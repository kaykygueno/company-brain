import { convexTest } from "convex-test";
import { afterEach, describe, expect, test, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { WEBSITE_COLLECTION_LIMITS } from "./lib/websiteCollector";

const modules = import.meta.glob("./**/*.*s");

// A small fixture "site" for DublinBrew's official website, used to drive the
// collector action end-to-end without touching the real internet.
const dublinBrewPages: Record<string, { status: number; body: string; headers?: Record<string, string> }> = {
    "https://dublinbrew.example": {
        status: 200,
        headers: { "content-type": "text/html" },
        body: `<html><body>
            <nav>
                <a href="/about">About Us</a>
                <a href="/menu">Menu</a>
                <a href="/locations">Our Locations</a>
                <a href="/pricing">Pricing</a>
                <a href="/faq">FAQs</a>
                <a href="/team">Meet the Team</a>
                <a href="/contact">Contact Us</a>
                <a href="/careers">Careers</a>
                <a href="/blog">News</a>
                <a href="/privacy-policy">Privacy Policy</a>
                <a href="/menu.pdf">Menu (PDF)</a>
                <a href="mailto:hello@dublinbrew.example">Email us</a>
                <a href="https://instagram.com/dublinbrew">Instagram</a>
            </nav>
            <main><p>DublinBrew is an independent coffee roaster and café based in Dublin, Ireland.</p></main>
        </body></html>`,
    },
    "https://dublinbrew.example/about": { status: 200, headers: { "content-type": "text/html" }, body: "<p>DublinBrew was founded in 2015 by two Dublin baristas who wanted better coffee.</p>" },
    "https://dublinbrew.example/menu": { status: 200, headers: { "content-type": "text/html" }, body: "<p>DublinBrew roasts single-origin beans in small weekly batches for every branch.</p>" },
    "https://dublinbrew.example/locations": { status: 200, headers: { "content-type": "text/html" }, body: "<p>DublinBrew operates three branches across Dublin city centre and Rathmines.</p>" },
    "https://dublinbrew.example/pricing": { status: 200, headers: { "content-type": "text/html" }, body: "<p>DublinBrew prices a standard flat white between four and five euro.</p>" },
    "https://dublinbrew.example/faq": { status: 200, headers: { "content-type": "text/html" }, body: "<p>DublinBrew is open every day except Christmas Day and Saint Stephen's Day.</p>" },
    "https://dublinbrew.example/team": { status: 200, headers: { "content-type": "text/html" }, body: "<p>DublinBrew's head roaster trained in Melbourne before returning to Dublin.</p>" },
    // Off-domain redirect: the collector must refuse to follow it, not silently visit another site.
    "https://dublinbrew.example/contact": { status: 302, body: "", headers: { location: "https://otherdomain.example/thanks" } },
};

function stubDublinBrewFetch() {
    vi.stubGlobal("fetch", async (input: string) => {
        const url = typeof input === "string" ? input : String(input);
        const page = dublinBrewPages[url];
        if (!page) return new Response("not found", { status: 404 });
        return new Response(page.body, { status: page.status, headers: page.headers });
    });
}

describe("public company discovery", () => {
    test("builds DublinBrew from its company record and creates reviewable, not permanent, knowledge", async () => {
        const t = convexTest(schema, modules);
        const asOwner = t.withIdentity({ subject: "dublinbrew_owner", name: "Owner", email: "owner@dublinbrew.example" });
        const companyName = "DublinBrew";
        await asOwner.mutation(api.companies.create, {
            name: companyName,
            website: "https://dublinbrew.example",
            country: "Ireland",
            industry: "Hospitality",
            description: "An independent Dublin coffee business.",
            includeDemoData: false,
        });

        await asOwner.mutation(api.discovery.start, {});
        const sources = await asOwner.query(api.discovery.listSources, {});
        expect(sources).toHaveLength(5);
        const website = sources.find((source) => source.kind === "OFFICIAL_WEBSITE");
        expect(website?.name).toBe(companyName);
        expect(website?.url).toBe("https://dublinbrew.example");

        await asOwner.mutation(api.discovery.recordEvidence, {
            sourceId: website!._id,
            content: "DublinBrew is open on Friday evenings and serves speciality coffee in Dublin.",
            sourceUrl: "https://dublinbrew.example/about",
            candidate: {
                type: "FACT",
                statement: `${companyName} serves speciality coffee in Dublin.`,
                confidence: 86,
            },
        });

        const summary = await asOwner.query(api.discovery.summary, {});
        expect(summary).toMatchObject({ status: "BUILDING", sourcesFound: 5, evidenceFound: 1, candidatesFound: 1 });
        const candidates = await asOwner.query(api.knowledgeCandidates.list, { status: "PENDING" });
        expect(candidates[0]).toMatchObject({ statement: `${companyName} serves speciality coffee in Dublin.`, sourceType: "OFFICIAL_WEBSITE" });
        const knowledge = await asOwner.query(api.knowledge.list, {});
        expect(knowledge).toHaveLength(0);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("4D.1: collects real evidence from DublinBrew's official website and only ever proposes reviewable candidates", async () => {
        stubDublinBrewFetch();
        const t = convexTest(schema, modules);
        const asOwner = t.withIdentity({ subject: "dublinbrew_owner", name: "Owner", email: "owner@dublinbrew.example" });
        await asOwner.mutation(api.companies.create, {
            name: "DublinBrew",
            website: "https://dublinbrew.example",
            country: "Ireland",
            industry: "Hospitality",
            description: "An independent Dublin coffee business.",
            includeDemoData: false,
        });
        await asOwner.mutation(api.discovery.start, {});

        // Company -> official website -> pages discovered -> evidence recorded -> candidate generated.
        const result = await asOwner.action(api.discovery.collectWebsite, {});

        // Stays within the page budget even though the homepage links to more categories than the budget allows.
        expect(result.pagesVisited).toBeLessThanOrEqual(WEBSITE_COLLECTION_LIMITS.maxPages);
        // Home + About/Menu/Locations/Pricing/FAQ/Team (Contact's off-domain redirect is refused; Careers/News lose out to the page cap).
        expect(result.pagesVisited).toBe(7);
        expect(result.evidenceRecorded).toBe(7);
        expect(result.candidatesProposed).toBe(7);

        const sources = await asOwner.query(api.discovery.listSources, {});
        const website = sources.find((source) => source.kind === "OFFICIAL_WEBSITE");
        expect(website?.status).toBe("COLLECTED");

        // Candidate = PENDING, never auto-approved.
        const candidates = await asOwner.query(api.knowledgeCandidates.list, { status: "PENDING" });
        expect(candidates).toHaveLength(7);
        for (const candidate of candidates) {
            expect(candidate.status).toBe("PENDING");
            expect(candidate.type).toBe("FACT");
            expect(candidate.sourceType).toBe("OFFICIAL_WEBSITE");
        }
        const collectedUrls = candidates.map((candidate) => candidate.sourceReference);
        // Obviously irrelevant, off-topic, off-domain, and duplicate pages never became evidence.
        expect(collectedUrls).not.toContain("https://dublinbrew.example/privacy-policy");
        expect(collectedUrls).not.toContain("https://dublinbrew.example/menu.pdf");
        expect(collectedUrls.some((url) => url?.includes("otherdomain.example"))).toBe(false);
        expect(collectedUrls.some((url) => url?.includes("instagram.com"))).toBe(false);
        expect(new Set(collectedUrls).size).toBe(collectedUrls.length);

        const summary = await asOwner.query(api.discovery.summary, {});
        expect(summary).toMatchObject({ status: "BUILDING", sourcesFound: 5, evidenceFound: 7, candidatesFound: 7 });

        // knowledgeItems = unchanged: collection alone never creates permanent knowledge.
        const knowledge = await asOwner.query(api.knowledge.list, {});
        expect(knowledge).toHaveLength(0);
    });

    test("4D.1: a Member without knowledge-manager rights cannot run collection", async () => {
        stubDublinBrewFetch();
        const t = convexTest(schema, modules);
        const owner = t.withIdentity({ subject: "owner", name: "Owner", email: "owner@dublinbrew.example" });
        await owner.mutation(api.companies.create, {
            name: "DublinBrew",
            website: "https://dublinbrew.example",
            includeDemoData: false,
        });
        await owner.mutation(api.discovery.start, {});
        const companyId = (await owner.query(api.companies.viewer, {}))!.activeCompany!._id;

        const member = t.withIdentity({ subject: "member", name: "Member", email: "member@dublinbrew.example" });
        await member.mutation(api.companies.create, { name: "Placeholder", includeDemoData: false }); // ensures the users record exists
        await owner.mutation(api.companies.addMembership, { clerkId: "member", name: "Member", email: "member@dublinbrew.example", role: "Member" });
        await member.mutation(api.companies.setActive, { companyId });

        await expect(member.action(api.discovery.collectWebsite, {})).rejects.toThrow(/owners and admins/i);
    });
});

// A small fixture Google Business Profile for DublinBrew: an aggregate
// rating plus the (Google-capped) five most relevant reviews. Three reviews
// praise the atmosphere/staff, two complain about slow Friday-evening
// service — enough for the theme aggregation stage to notice a pattern on
// each side without needing dozens of fixture reviews.
const dublinBrewGoogleReviews = [
    { author_name: "A", rating: 5, text: "Amazing atmosphere and lovely staff.", time: 1700000000 },
    { author_name: "B", rating: 5, text: "Great staff, we loved the atmosphere.", time: 1700000001 },
    { author_name: "C", rating: 4, text: "Nice atmosphere and good coffee.", time: 1700000002 },
    { author_name: "D", rating: 2, text: "Waited forever, service was slow on Friday evening.", time: 1700000003 },
    { author_name: "E", rating: 1, text: "Slow service again, waited ages to order on a Friday.", time: 1700000004 },
];

function stubGoogleBusinessFetch() {
    vi.stubGlobal("fetch", async (input: string) => {
        const url = new URL(typeof input === "string" ? input : String(input));
        if (url.pathname.endsWith("/findplacefromtext/json")) {
            return Response.json({ status: "OK", candidates: [{ place_id: "dublinbrew-place-1", name: "DublinBrew Coffee" }] });
        }
        if (url.pathname.endsWith("/details/json")) {
            return Response.json({
                status: "OK",
                result: {
                    name: "DublinBrew Coffee",
                    formatted_address: "12 Dame Street, Dublin",
                    rating: 4.3,
                    user_ratings_total: 128,
                    url: "https://maps.google.com/?cid=1",
                    reviews: dublinBrewGoogleReviews,
                },
            });
        }
        return new Response("not found", { status: 404 });
    });
}

describe("google business discovery", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    test("4D.2: Google -> Business Profile discovery -> Reviews -> Evidence -> aggregated Candidates, PENDING only", async () => {
        stubGoogleBusinessFetch();
        vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-key");
        const t = convexTest(schema, modules);
        const asOwner = t.withIdentity({ subject: "dublinbrew_owner", name: "Owner", email: "owner@dublinbrew.example" });
        await asOwner.mutation(api.companies.create, {
            name: "DublinBrew",
            website: "https://dublinbrew.example",
            includeDemoData: false,
        });
        await asOwner.mutation(api.discovery.start, {});

        const result = await asOwner.action(api.discovery.collectGoogleBusiness, {});
        expect(result.reviewsCollected).toBe(5); // Google's Place Details API caps this at 5
        expect(result.evidenceRecorded).toBe(7); // 1 business profile + 5 reviews + 1 theme summary
        // Business profile rating (1) + recurring themes: Atmosphere, Staff (positive), Waiting time (negative).
        expect(result.candidatesProposed).toBe(4);

        // Business Profile discovery persisted the resolved place so repeat runs don't re-resolve it.
        const sources = await asOwner.query(api.discovery.listSources, {});
        const googleSource = sources.find((source) => source.kind === "GOOGLE_BUSINESS");
        expect(googleSource?.externalId).toBe("dublinbrew-place-1");
        expect(googleSource?.status).toBe("COLLECTED");

        const candidates = await asOwner.query(api.knowledgeCandidates.list, { status: "PENDING" });
        expect(candidates).toHaveLength(4);
        for (const candidate of candidates) {
            expect(candidate.status).toBe("PENDING");
            expect(candidate.sourceType).toBe("GOOGLE_BUSINESS");
        }

        const ratingCandidate = candidates.find((candidate) => candidate.statement.includes("average Google rating"));
        expect(ratingCandidate).toMatchObject({ type: "FACT", confidence: 90 });

        // The interpretation: a RISK for the recurring complaint, FACTs for the recurring praise.
        const risk = candidates.find((candidate) => candidate.type === "RISK");
        expect(risk?.statement).toBe("Recurring customer complaints about waiting time at DublinBrew.");
        expect(risk!.confidence).toBeGreaterThanOrEqual(55);
        expect(risk!.confidence).toBeLessThanOrEqual(95);
        expect(risk?.evidence).toContain("2 of 5 reviews");

        const atmosphereFact = candidates.find((candidate) => candidate.statement.includes("atmosphere"));
        expect(atmosphereFact?.type).toBe("FACT");

        // A single "Great beer!"-style review never became a candidate on its own.
        const evidenceCandidateCount = candidates.filter((candidate) => candidate.evidence === "Great beer!").length;
        expect(evidenceCandidateCount).toBe(0);

        const summary = await asOwner.query(api.discovery.summary, {});
        expect(summary).toMatchObject({ sourcesFound: 5, evidenceFound: 7, candidatesFound: 4, potentialRisks: 1 });

        // knowledgeItems = unchanged: collection and aggregation alone never create permanent knowledge.
        const knowledge = await asOwner.query(api.knowledge.list, {});
        expect(knowledge).toHaveLength(0);
    });

    test("4D.2: a repeat collection run does not re-propose the same recurring theme twice", async () => {
        stubGoogleBusinessFetch();
        vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-key");
        const t = convexTest(schema, modules);
        const asOwner = t.withIdentity({ subject: "dublinbrew_owner", name: "Owner", email: "owner@dublinbrew.example" });
        await asOwner.mutation(api.companies.create, { name: "DublinBrew", website: "https://dublinbrew.example", includeDemoData: false });
        await asOwner.mutation(api.discovery.start, {});

        await asOwner.action(api.discovery.collectGoogleBusiness, {});
        const second = await asOwner.action(api.discovery.collectGoogleBusiness, {});

        // The business-profile rating is proposed fresh each run (like any other page-level candidate);
        // the three theme candidates from the first run are not duplicated on the second.
        expect(second.candidatesProposed).toBe(1);

        const candidates = await asOwner.query(api.knowledgeCandidates.list, {});
        const themeStatements = candidates
            .filter((candidate) => candidate.generatedBy === "Review theme aggregation")
            .map((candidate) => candidate.statement);
        expect(new Set(themeStatements).size).toBe(themeStatements.length); // no duplicate theme statements
        expect(themeStatements).toHaveLength(3);
    });

    test("4D.2: fails clearly when GOOGLE_PLACES_API_KEY is not configured, instead of silently doing nothing", async () => {
        stubGoogleBusinessFetch();
        const t = convexTest(schema, modules);
        const asOwner = t.withIdentity({ subject: "dublinbrew_owner", name: "Owner", email: "owner@dublinbrew.example" });
        await asOwner.mutation(api.companies.create, { name: "DublinBrew", website: "https://dublinbrew.example", includeDemoData: false });
        await asOwner.mutation(api.discovery.start, {});

        await expect(asOwner.action(api.discovery.collectGoogleBusiness, {})).rejects.toThrow(/GOOGLE_PLACES_API_KEY/);
    });

    test("4D.2: a Member without knowledge-manager rights cannot run collection", async () => {
        stubGoogleBusinessFetch();
        vi.stubEnv("GOOGLE_PLACES_API_KEY", "test-key");
        const t = convexTest(schema, modules);
        const owner = t.withIdentity({ subject: "owner", name: "Owner", email: "owner@dublinbrew.example" });
        await owner.mutation(api.companies.create, { name: "DublinBrew", website: "https://dublinbrew.example", includeDemoData: false });
        await owner.mutation(api.discovery.start, {});
        const companyId = (await owner.query(api.companies.viewer, {}))!.activeCompany!._id;

        const member = t.withIdentity({ subject: "member", name: "Member", email: "member@dublinbrew.example" });
        await member.mutation(api.companies.create, { name: "Placeholder", includeDemoData: false });
        await owner.mutation(api.companies.addMembership, { clerkId: "member", name: "Member", email: "member@dublinbrew.example", role: "Member" });
        await member.mutation(api.companies.setActive, { companyId });

        await expect(member.action(api.discovery.collectGoogleBusiness, {})).rejects.toThrow(/owners and admins/i);
    });
});