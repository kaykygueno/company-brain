import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { getActiveMembership } from "./companies";
import { assertConfidence, assertKnowledgeManager } from "./knowledge";
import { evidenceMetadata, knowledgeType } from "./schema";
import {
    WEBSITE_COLLECTION_LIMITS,
    buildCandidateFromPage,
    extractLinks,
    extractReadableText,
    fetchPageWithLimits,
    selectPagesToVisit,
    type PageKind,
} from "./lib/websiteCollector";
import {
    GOOGLE_COLLECTION_LIMITS,
    aggregateReviewThemes,
    businessProfileToEvidenceDraft,
    draftThemeCandidates,
    fetchGooglePlaceDetails,
    formatThemeSummary,
    resolveGooglePlaceId,
    reviewToEvidenceDraft,
} from "./lib/googleBusinessCollector";
import type { EvidenceDraft } from "./lib/evidence";

const sourcePlans = [
    { kind: "GOOGLE_BUSINESS" as const, name: "Google Business" },
    { kind: "NEWS" as const, name: "Public news mentions" },
    { kind: "SOCIAL_PROFILE" as const, name: "Public company profiles" },
    { kind: "PUBLIC_DIRECTORY" as const, name: "Public directories" },
];

export const listSources = query({
    args: {},
    handler: async (ctx) => {
        const { company } = await getActiveMembership(ctx);
        if (!company) return [];
        return await ctx.db
            .query("sources")
            .withIndex("by_companyId", (index) => index.eq("companyId", company._id))
            .collect();
    },
});

export const summary = query({
    args: {},
    handler: async (ctx) => {
        const { company } = await getActiveMembership(ctx);
        if (!company) return null;

        const [sources, evidence, candidates] = await Promise.all([
            ctx.db.query("sources").withIndex("by_companyId", (index) => index.eq("companyId", company._id)).collect(),
            ctx.db.query("evidence").withIndex("by_companyId", (index) => index.eq("companyId", company._id)).collect(),
            ctx.db.query("knowledgeCandidates").withIndex("by_companyId", (index) => index.eq("companyId", company._id)).collect(),
        ]);
        return {
            status: company.discoveryStatus,
            sourcesFound: sources.length,
            evidenceFound: evidence.length,
            candidatesFound: candidates.length,
            potentialRisks: candidates.filter((candidate) => candidate.type === "RISK").length,
            opportunities: candidates.filter((candidate) => candidate.type === "GOAL").length,
        };
    },
});

export const start = mutation({
    args: {},
    handler: async (ctx) => {
        const { membership, company } = await getActiveMembership(ctx);
        if (!company) throw new Error("Select a company before building its brain.");
        assertKnowledgeManager(membership?.role);
        if (company.discoveryStatus !== "NOT_STARTED") return;

        const now = Date.now();
        const plannedSources = company.website
            ? [{ kind: "OFFICIAL_WEBSITE" as const, name: company.name, url: company.website }, ...sourcePlans]
            : sourcePlans;
        for (const source of plannedSources) {
            await ctx.db.insert("sources", {
                companyId: company._id,
                kind: source.kind,
                name: source.name,
                url: "url" in source ? source.url : undefined,
                status: "DISCOVERED",
                discoveredAt: now,
            });
        }
        await ctx.db.patch(company._id, { discoveryStatus: "BUILDING", discoveryStartedAt: now });
    },
});

// Collection adapters call this boundary after obtaining public text from an approved source.
// It creates reviewable candidates only; permanent knowledge is still created by approval.
export const recordEvidence = mutation({
    args: {
        sourceId: v.id("sources"),
        content: v.string(),
        sourceUrl: v.optional(v.string()),
        metadata: v.optional(evidenceMetadata),
        candidate: v.optional(v.object({
            type: knowledgeType,
            statement: v.string(),
            confidence: v.number(),
        })),
    },
    handler: async (ctx, args) => {
        const { user, membership, company } = await getActiveMembership(ctx);
        if (!company) throw new Error("Select a company before recording discovery evidence.");
        assertKnowledgeManager(membership?.role);
        const source = await ctx.db.get(args.sourceId);
        if (!source || source.companyId !== company._id) throw new Error("Source was not found in your active company.");
        const content = args.content.trim();
        if (!content) throw new Error("Discovery evidence cannot be empty.");

        const now = Date.now();
        const sourceUrl = args.sourceUrl?.trim() || source.url;
        const evidenceId = await ctx.db.insert("evidence", { companyId: company._id, sourceId: source._id, content, sourceUrl, discoveredAt: now, metadata: args.metadata });
        await ctx.db.patch(source._id, { status: "COLLECTED", collectedAt: now });

        if (!args.candidate) return { evidenceId, candidateId: null };
        assertConfidence(args.candidate.confidence);
        const statement = args.candidate.statement.trim();
        if (!statement) throw new Error("A discovery candidate requires a statement.");
        const candidateId = await ctx.db.insert("knowledgeCandidates", {
            companyId: company._id,
            type: args.candidate.type,
            statement,
            sourceType: source.kind,
            sourceReference: sourceUrl,
            evidenceId,
            evidence: content,
            confidence: args.candidate.confidence,
            generatedBy: "Public discovery pipeline",
            createdByUserId: user._id,
            createdAt: now,
            status: "PENDING",
        });
        return { evidenceId, candidateId };
    },
});

// An adapter's upstream identifier for a source (e.g. a resolved Google Place
// ID), cached so a rate/cost-limited external lookup doesn't have to be
// repeated on every collection run.
export const setSourceExternalId = mutation({
    args: { sourceId: v.id("sources"), externalId: v.string() },
    handler: async (ctx, args) => {
        const { membership, company } = await getActiveMembership(ctx);
        if (!company) throw new Error("Select a company before updating a source.");
        assertKnowledgeManager(membership?.role);
        const source = await ctx.db.get(args.sourceId);
        if (!source || source.companyId !== company._id) throw new Error("Source was not found in your active company.");
        const externalId = args.externalId.trim();
        if (!externalId) throw new Error("An external id cannot be empty.");
        await ctx.db.patch(source._id, { externalId });
    },
});

// The first real collection adapter: a controlled company researcher, not a
// general-purpose crawler. It only ever visits the company's own official
// website, only follows links that match a known company-page category
// (About, Products, Services, Locations, Contact, Team, FAQ, Pricing,
// Blog/News, Careers, Company information), and stays inside
// WEBSITE_COLLECTION_LIMITS for page count, content size, redirects,
// timeouts, and duplicate/irrelevant pages. Every page it reads becomes
// evidence via recordEvidence, which only ever creates PENDING candidates —
// this action never touches knowledgeItems.
export const collectWebsite = action({
    args: {},
    handler: async (ctx): Promise<{ pagesVisited: number; evidenceRecorded: number; candidatesProposed: number }> => {
        const viewer = await ctx.runQuery(api.companies.viewer, {});
        if (!viewer) throw new Error("You must be signed in to collect from a company's website.");
        assertKnowledgeManager(viewer.role ?? undefined);

        const sources = await ctx.runQuery(api.discovery.listSources, {});
        const source = sources.find((candidate) => candidate.kind === "OFFICIAL_WEBSITE");
        if (!source || !source.url) {
            throw new Error("Start discovery and confirm a company website before collecting from it.");
        }

        const allowedHost = new URL(source.url).hostname;
        const limits = WEBSITE_COLLECTION_LIMITS;
        const visitedUrls = new Set<string>();
        let pagesVisited = 0;
        let evidenceRecorded = 0;
        let candidatesProposed = 0;

        const recordPage = async (pageUrl: string, kind: PageKind, html: string) => {
            const text = extractReadableText(html, limits.maxEvidenceLength);
            if (!text) return;
            const draft = buildCandidateFromPage(kind, text);
            await ctx.runMutation(api.discovery.recordEvidence, {
                sourceId: source._id,
                content: text,
                sourceUrl: pageUrl,
                candidate: draft ? { type: "FACT" as const, statement: draft.statement, confidence: draft.confidence } : undefined,
            });
            evidenceRecorded += 1;
            if (draft) candidatesProposed += 1;
        };

        const homepage = await fetchPageWithLimits(source.url, allowedHost, limits, fetch);
        if (!homepage) {
            throw new Error(`The official website (${source.url}) could not be reached.`);
        }
        visitedUrls.add(homepage.finalUrl);
        pagesVisited += 1;
        await recordPage(homepage.finalUrl, "Home", homepage.html);

        const links = extractLinks(homepage.html, homepage.finalUrl);
        const pagesToVisit = selectPagesToVisit(homepage.finalUrl, links, allowedHost, limits);

        for (const page of pagesToVisit) {
            if (visitedUrls.has(page.url)) continue; // duplicate page already collected
            await new Promise((resolve) => setTimeout(resolve, limits.minRequestIntervalMs)); // stay a low-rate visitor
            const fetched = await fetchPageWithLimits(page.url, allowedHost, limits, fetch);
            if (!fetched || visitedUrls.has(fetched.finalUrl)) continue;
            visitedUrls.add(fetched.finalUrl);
            pagesVisited += 1;
            await recordPage(fetched.finalUrl, page.kind, fetched.html);
        }

        return { pagesVisited, evidenceRecorded, candidatesProposed };
    },
});

// The second collection adapter: Google Business / customer reviews. Same
// architecture as the website adapter — Company -> Business Profile
// discovery -> Reviews/business information -> Evidence -> Knowledge
// Candidates — plus an aggregation stage: Reviews -> Themes ->
// Frequency/sentiment -> Candidate. A single review is recorded as evidence
// only (see lib/googleBusinessCollector.reviewToEvidenceDraft) — it takes a
// theme recurring across multiple independent reviews to earn a PENDING
// candidate. All Google-specific logic (API calls, review parsing, theme
// aggregation) lives in lib/googleBusinessCollector.ts; this action only
// orchestrates it and writes through the same recordEvidence /
// knowledgeCandidates.create pipeline every adapter uses. Credentials never
// leave the server: the API key is read from an env var inside this action.
export const collectGoogleBusiness = action({
    args: {},
    handler: async (ctx): Promise<{ reviewsCollected: number; evidenceRecorded: number; candidatesProposed: number }> => {
        const viewer = await ctx.runQuery(api.companies.viewer, {});
        if (!viewer || !viewer.activeCompany) throw new Error("Select a company before collecting from Google Business.");
        assertKnowledgeManager(viewer.role ?? undefined);

        const apiKey = process.env.GOOGLE_PLACES_API_KEY;
        if (!apiKey) {
            throw new Error(
                "GOOGLE_PLACES_API_KEY is not configured. Set it with `npx convex env set GOOGLE_PLACES_API_KEY <key>` before collecting from Google Business.",
            );
        }

        const sources = await ctx.runQuery(api.discovery.listSources, {});
        const source = sources.find((candidate) => candidate.kind === "GOOGLE_BUSINESS");
        if (!source) {
            throw new Error("Start discovery before collecting Google Business reviews.");
        }

        const companyName = viewer.activeCompany.name;
        const limits = GOOGLE_COLLECTION_LIMITS;

        // Business Profile discovery: resolve once, then cache on the source
        // so repeat runs don't spend another lookup against Google's API.
        let placeId = source.externalId;
        if (!placeId) {
            const resolved = await resolveGooglePlaceId(companyName, apiKey, fetch, limits);
            if (!resolved) {
                throw new Error(`Could not find a Google Business Profile for "${companyName}".`);
            }
            placeId = resolved;
            await ctx.runMutation(api.discovery.setSourceExternalId, { sourceId: source._id, externalId: placeId });
        }

        const place = await fetchGooglePlaceDetails(placeId, apiKey, fetch, limits);
        if (!place) {
            throw new Error(`Could not fetch Google Business details for "${companyName}".`);
        }

        let evidenceRecorded = 0;
        let candidatesProposed = 0;

        const recordDraft = async (draft: EvidenceDraft) => {
            const result = await ctx.runMutation(api.discovery.recordEvidence, {
                sourceId: source._id,
                content: draft.content,
                sourceUrl: draft.sourceUrl,
                metadata: draft.metadata,
                candidate: draft.candidate,
            });
            evidenceRecorded += 1;
            if (draft.candidate) candidatesProposed += 1;
            return result.evidenceId;
        };

        // Reviews / business information -> Evidence.
        await recordDraft(businessProfileToEvidenceDraft(place, companyName));
        const reviews = place.reviews.slice(0, limits.maxReviews);
        for (const review of reviews) {
            await recordDraft(reviewToEvidenceDraft(review, place));
        }

        // Reviews -> Themes -> Frequency/sentiment -> Candidate.
        const aggregation = aggregateReviewThemes(reviews.map((review) => ({ text: review.text, rating: review.rating })));
        if (aggregation.totalReviews > 0) {
            const summaryEvidenceId = await recordDraft({
                content: formatThemeSummary(companyName, aggregation),
                sourceUrl: place.mapsUrl,
                metadata: { kind: "theme_summary" },
            });

            const themeDrafts = draftThemeCandidates(companyName, aggregation);
            if (themeDrafts.length > 0) {
                // Google tends to return the same "most relevant" reviews run to
                // run, so without this check every collection would re-propose
                // an identical finding. Dedupe by exact statement text, which
                // stays stable per theme+sentiment across runs (see
                // draftThemeCandidates).
                const existingCandidates = await ctx.runQuery(api.knowledgeCandidates.list, {});
                const existingStatements = new Set(existingCandidates.map((candidate) => candidate.statement));
                for (const draft of themeDrafts) {
                    if (existingStatements.has(draft.statement)) continue;
                    await ctx.runMutation(api.knowledgeCandidates.create, {
                        type: draft.type,
                        statement: draft.statement,
                        sourceType: source.kind,
                        sourceReference: place.mapsUrl,
                        evidenceId: summaryEvidenceId,
                        evidence: `${draft.mentionCount} of ${aggregation.totalReviews} reviews raised "${draft.theme.toLowerCase()}" (${draft.sentiment}).`,
                        confidence: draft.confidence,
                        generatedBy: "Review theme aggregation",
                    });
                    candidatesProposed += 1;
                }
            }
        }

        return { reviewsCollected: reviews.length, evidenceRecorded, candidatesProposed };
    },
});