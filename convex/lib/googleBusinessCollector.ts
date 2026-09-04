// The Google Business / customer reviews collection adapter.
//
// Architecture: Company -> Business Profile discovery -> Reviews / business
// information -> Evidence -> Knowledge Candidates. Kept isolated from
// discovery.ts, which only orchestrates: resolve a place, fetch its profile,
// turn that into EvidenceDraft[] via the pure functions below, and hand them
// to the same recordEvidence / knowledgeCandidates.create pipeline every
// other adapter uses.
//
// This adapter never scrapes Google. It only calls Google's public Places
// API (Find Place, Place Details) with a server-side API key. That API is
// also why it never sees more than a handful of reviews: Google's Places API
// returns at most 5 "most relevant" reviews per place, by design — this
// adapter cannot and does not work around that limit. Aggregation is written
// to operate over whatever review list it's given, so accumulating more
// reviews across repeated collection runs later doesn't require a rewrite.
import type { CandidateDraft, EvidenceDraft } from "./evidence";

export const GOOGLE_COLLECTION_LIMITS = {
    // Google's Places API itself caps this; kept here so callers don't
    // need to know that detail, and so a future, higher-volume API can raise it.
    maxReviews: 5,
    requestTimeoutMs: 8_000,
    // A theme needs at least this many independent reviews behind it...
    minThemeMentions: 2,
    // ...and needs to show up in at least this share of all reviews...
    minThemeRatio: 0.4,
    // ...and there must be at least this many reviews total, before a theme is
    // treated as a genuine pattern rather than one or two opinions.
    minReviewsForAggregation: 3,
} as const;

export interface GoogleReview {
    authorName?: string;
    rating: number;
    text: string;
    publishedAt?: number; // epoch ms, when Google provides `time`
    relativeTimeDescription?: string;
}

export interface GooglePlaceDetails {
    placeId: string;
    name?: string;
    formattedAddress?: string;
    rating?: number;
    userRatingsTotal?: number;
    mapsUrl?: string;
    reviews: GoogleReview[];
}

// ---------------------------------------------------------------------------
// Defensive parsing of Google's (untyped, loosely-shaped) JSON responses.
// ---------------------------------------------------------------------------

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parseFindPlaceResponse(json: unknown): string | null {
    const body = asRecord(json);
    if (!body || body.status !== "OK") return null;
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const first = asRecord(candidates[0]);
    return asString(first?.place_id) ?? null;
}

function parseReview(raw: unknown): GoogleReview | null {
    const review = asRecord(raw);
    if (!review) return null;
    const rating = asNumber(review.rating);
    const text = asString(review.text);
    if (rating === undefined || !text) return null; // not enough of a review to use
    const timeSeconds = asNumber(review.time);
    return {
        authorName: asString(review.author_name),
        rating,
        text,
        publishedAt: timeSeconds !== undefined ? timeSeconds * 1000 : undefined,
        relativeTimeDescription: asString(review.relative_time_description),
    };
}

export function parsePlaceDetailsResponse(json: unknown, placeId: string): GooglePlaceDetails | null {
    const body = asRecord(json);
    if (!body || body.status !== "OK") return null;
    const result = asRecord(body.result);
    if (!result) return null;
    const rawReviews = Array.isArray(result.reviews) ? result.reviews : [];
    const reviews = rawReviews.map(parseReview).filter((review): review is GoogleReview => review !== null);
    return {
        placeId,
        name: asString(result.name),
        formattedAddress: asString(result.formatted_address),
        rating: asNumber(result.rating),
        userRatingsTotal: asNumber(result.user_ratings_total),
        mapsUrl: asString(result.url),
        reviews,
    };
}

// ---------------------------------------------------------------------------
// Network calls. Dependency-injected fetch, same pattern as the website
// collector, so these are testable with fixture responses instead of the
// real internet. Credentials (the API key) are only ever passed in by the
// caller (the Convex action, reading a server-side env var) — this module
// never reads process.env itself, so it stays usable in any runtime.
// ---------------------------------------------------------------------------

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

async function fetchJsonWithTimeout(url: string, timeoutMs: number, fetchImpl: FetchLike): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetchImpl(url, { signal: controller.signal });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}

// Business Profile discovery: resolves a company to a Google Place ID from
// its name (and, when available, its address/country to disambiguate).
export async function resolveGooglePlaceId(
    query: string,
    apiKey: string,
    fetchImpl: FetchLike,
    limits: Pick<typeof GOOGLE_COLLECTION_LIMITS, "requestTimeoutMs"> = GOOGLE_COLLECTION_LIMITS,
): Promise<string | null> {
    const url = new URL("https://maps.googleapis.com/maps/api/place/findplacefromtext/json");
    url.searchParams.set("input", query);
    url.searchParams.set("inputtype", "textquery");
    url.searchParams.set("fields", "place_id,name,formatted_address");
    url.searchParams.set("key", apiKey);
    const json = await fetchJsonWithTimeout(url.toString(), limits.requestTimeoutMs, fetchImpl);
    return parseFindPlaceResponse(json);
}

// Reviews / business information: fetches the resolved place's profile and
// its (Google-capped) most relevant reviews in one call.
export async function fetchGooglePlaceDetails(
    placeId: string,
    apiKey: string,
    fetchImpl: FetchLike,
    limits: Pick<typeof GOOGLE_COLLECTION_LIMITS, "requestTimeoutMs"> = GOOGLE_COLLECTION_LIMITS,
): Promise<GooglePlaceDetails | null> {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "name,formatted_address,rating,user_ratings_total,url,reviews");
    url.searchParams.set("key", apiKey);
    const json = await fetchJsonWithTimeout(url.toString(), limits.requestTimeoutMs, fetchImpl);
    return parsePlaceDetailsResponse(json, placeId);
}

// ---------------------------------------------------------------------------
// Evidence drafting. Structured details (rating, author, date, location, and
// owner response when Google's API supplies one) travel in `metadata`; the
// review's own words stay as the evidence content, untouched.
// ---------------------------------------------------------------------------

// Google's public Places API does not expose the business owner's reply to a
// review — there is no scrape-free way to get it. `ownerResponse` stays part
// of the shared shape for when an API that does provide it is added, but this
// adapter can only ever leave it unset; it never fabricates one.
export function reviewToEvidenceDraft(review: GoogleReview, place: GooglePlaceDetails): EvidenceDraft {
    return {
        content: review.text,
        sourceUrl: place.mapsUrl,
        metadata: {
            kind: "review",
            rating: review.rating,
            authorName: review.authorName,
            publishedAt: review.publishedAt,
            location: place.formattedAddress,
        },
        // No candidate: a single review is evidence of one customer's
        // opinion, not company knowledge on its own — see aggregation below.
    };
}

// The business profile itself (Google's own aggregate rating over many more
// reviews than the API hands us individually) is a single, authoritative
// data point, not one person's opinion — so, unlike an individual review,
// it's reasonable to propose it as a FACT candidate directly.
export function businessProfileToEvidenceDraft(place: GooglePlaceDetails, companyName: string): EvidenceDraft {
    const parts = [`${companyName} is listed on Google Business${place.name && place.name !== companyName ? ` as "${place.name}"` : ""}.`];
    if (place.formattedAddress) parts.push(`Address: ${place.formattedAddress}.`);
    if (place.rating !== undefined && place.userRatingsTotal !== undefined) {
        parts.push(`Average rating ${place.rating}/5 from ${place.userRatingsTotal} Google reviews.`);
    }
    const content = parts.join(" ");

    let candidate: CandidateDraft | undefined;
    if (place.rating !== undefined && place.userRatingsTotal && place.userRatingsTotal >= 5) {
        candidate = {
            type: "FACT",
            statement: `${companyName} holds an average Google rating of ${place.rating}/5 from ${place.userRatingsTotal} reviews.`,
            confidence: 90,
        };
    }

    return {
        content,
        sourceUrl: place.mapsUrl,
        metadata: { kind: "business_profile", rating: place.rating, location: place.formattedAddress },
        candidate,
    };
}

// ---------------------------------------------------------------------------
// Aggregation: Reviews -> Themes -> Frequency/sentiment -> Candidate. This is
// what turns "Great beer!" from noise into a signal: a customer's exact words
// aren't knowledge, but the same theme recurring across many independent
// reviews is a defensible claim about the company.
// ---------------------------------------------------------------------------

export type ThemeSentiment = "positive" | "negative";

const THEMES: { theme: string; pattern: RegExp }[] = [
    { theme: "Atmosphere", pattern: /\b(atmosphere|ambien(?:ce|ca)|vibe|cosy|cozy|decor)\b/i },
    { theme: "Staff", pattern: /\b(staff|barista|waiter|waitress|server|employees?|team)\b/i },
    { theme: "Product quality", pattern: /\b(coffee|beer|food|drinks?|quality|delicious|fresh|taste|flavou?r)\b/i },
    { theme: "Pricing", pattern: /\b(price|pricing|expensive|overpriced|cheap|value for money)\b/i },
    { theme: "Waiting time", pattern: /\b(wait(?:ing|ed)?|slow|queue|line|delay(?:ed)?)\b/i },
    { theme: "Cleanliness", pattern: /\b(clean(?:liness)?|dirty|messy|hygien(?:e|ic))\b/i },
    { theme: "Parking", pattern: /\bparking\b/i },
    { theme: "Location", pattern: /\b(location|easy to find|convenient(?:ly)?[- ]located)\b/i },
];

// A review may raise more than one theme; each theme is counted at most once
// per review so one wordy review can't dominate the tally.
export function detectThemes(text: string): string[] {
    return THEMES.filter(({ pattern }) => pattern.test(text)).map(({ theme }) => theme);
}

// Google reviews always carry a star rating, so that's the primary sentiment
// signal: 4-5 stars reads as positive, 1-2 as negative. 3-star reviews are
// mixed/neutral and are excluded from theme tallying — kept as evidence, but
// not used to accuse or credit the company either way.
export function inferSentimentFromRating(rating: number): ThemeSentiment | null {
    if (rating >= 4) return "positive";
    if (rating <= 2) return "negative";
    return null;
}

export interface ReviewForAggregation {
    text: string;
    rating: number;
}

export interface ThemeAggregation {
    totalReviews: number;
    positive: Record<string, number>;
    negative: Record<string, number>;
}

export function aggregateReviewThemes(reviews: ReviewForAggregation[]): ThemeAggregation {
    const positive: Record<string, number> = {};
    const negative: Record<string, number> = {};
    for (const review of reviews) {
        const sentiment = inferSentimentFromRating(review.rating);
        if (!sentiment) continue;
        const bucket = sentiment === "positive" ? positive : negative;
        for (const theme of detectThemes(review.text)) {
            bucket[theme] = (bucket[theme] ?? 0) + 1;
        }
    }
    return { totalReviews: reviews.length, positive, negative };
}

// Confidence grows with both how large a share of reviews raise a theme and
// how many independent reviews that represents in absolute terms — a theme
// in 3 of 5 reviews is a smaller sample than 28 of 92, even at a similar
// ratio, so it shouldn't reach the same confidence.
export function themeConfidence(mentionCount: number, totalReviews: number): number {
    if (totalReviews <= 0 || mentionCount <= 0) return 0;
    const coverage = mentionCount / totalReviews;
    const volumeBonus = Math.min(mentionCount, 15);
    const confidence = 50 + coverage * 30 + volumeBonus;
    return Math.max(55, Math.min(95, Math.round(confidence)));
}

function shouldProposeTheme(mentionCount: number, totalReviews: number): boolean {
    const { minThemeMentions, minThemeRatio, minReviewsForAggregation } = GOOGLE_COLLECTION_LIMITS;
    return (
        totalReviews >= minReviewsForAggregation &&
        mentionCount >= minThemeMentions &&
        mentionCount / totalReviews >= minThemeRatio
    );
}

export interface ThemeCandidateDraft extends CandidateDraft {
    theme: string;
    sentiment: ThemeSentiment;
    mentionCount: number;
}

// The numbers (theme -> mention count) are the evidence; this is the
// interpretation layer that turns a recurring pattern into a reviewable
// candidate. Negative themes read as a potential RISK; positive themes read
// as a FACT worth keeping on record. Statement text stays stable per
// theme+sentiment (no counts embedded) so repeat collection runs can be
// deduplicated by exact statement instead of re-proposing the same finding.
export function draftThemeCandidates(companyName: string, aggregation: ThemeAggregation): ThemeCandidateDraft[] {
    const drafts: ThemeCandidateDraft[] = [];
    for (const [sentiment, bucket, type] of [
        ["negative", aggregation.negative, "RISK"],
        ["positive", aggregation.positive, "FACT"],
    ] as const) {
        for (const [theme, mentionCount] of Object.entries(bucket)) {
            if (!shouldProposeTheme(mentionCount, aggregation.totalReviews)) continue;
            const lowerTheme = theme.toLowerCase();
            const statement =
                sentiment === "negative"
                    ? `Recurring customer complaints about ${lowerTheme} at ${companyName}.`
                    : `Customers consistently praise ${companyName}'s ${lowerTheme}.`;
            drafts.push({
                theme,
                sentiment,
                mentionCount,
                type,
                statement,
                confidence: themeConfidence(mentionCount, aggregation.totalReviews),
            });
        }
    }
    return drafts.sort((a, b) => b.mentionCount - a.mentionCount);
}

// Human-readable form of the aggregation table, recorded as its own evidence
// entry — the numbers behind whatever theme candidates get drafted from them.
export function formatThemeSummary(companyName: string, aggregation: ThemeAggregation): string {
    const formatBucket = (bucket: Record<string, number>) =>
        Object.entries(bucket)
            .sort((a, b) => b[1] - a[1])
            .map(([theme, count]) => `${theme} (${count})`)
            .join(", ") || "none";

    return (
        `Customer feedback themes for ${companyName} across ${aggregation.totalReviews} Google reviews. ` +
        `Positive: ${formatBucket(aggregation.positive)}. Negative: ${formatBucket(aggregation.negative)}.`
    );
}
