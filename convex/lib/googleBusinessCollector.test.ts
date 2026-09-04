import { describe, expect, test } from "vitest";
import {
    aggregateReviewThemes,
    businessProfileToEvidenceDraft,
    detectThemes,
    draftThemeCandidates,
    formatThemeSummary,
    inferSentimentFromRating,
    parseFindPlaceResponse,
    parsePlaceDetailsResponse,
    reviewToEvidenceDraft,
    themeConfidence,
    type GooglePlaceDetails,
} from "./googleBusinessCollector";

describe("google business collector: response parsing", () => {
    test("extracts a place_id from a successful Find Place response", () => {
        const placeId = parseFindPlaceResponse({
            status: "OK",
            candidates: [{ place_id: "place-123", name: "DublinBrew" }],
        });
        expect(placeId).toBe("place-123");
    });

    test("returns null when Google reports no results, rather than throwing", () => {
        expect(parseFindPlaceResponse({ status: "ZERO_RESULTS", candidates: [] })).toBeNull();
        expect(parseFindPlaceResponse(null)).toBeNull();
    });

    test("parses place details including reviews, and drops malformed reviews", () => {
        const place = parsePlaceDetailsResponse(
            {
                status: "OK",
                result: {
                    name: "DublinBrew Coffee",
                    formatted_address: "12 Dame Street, Dublin",
                    rating: 4.3,
                    user_ratings_total: 128,
                    url: "https://maps.google.com/?cid=1",
                    reviews: [
                        { author_name: "Jane D.", rating: 5, text: "Great atmosphere and friendly staff.", time: 1700000000 },
                        { author_name: "No rating", text: "Missing a rating entirely." }, // dropped: no rating
                        { rating: 3 }, // dropped: no text
                    ],
                },
            },
            "place-123",
        );
        expect(place?.name).toBe("DublinBrew Coffee");
        expect(place?.reviews).toHaveLength(1);
        expect(place?.reviews[0]).toMatchObject({ authorName: "Jane D.", rating: 5, publishedAt: 1700000000 * 1000 });
    });
});

describe("google business collector: evidence drafting", () => {
    const place: GooglePlaceDetails = {
        placeId: "place-123",
        name: "DublinBrew Coffee",
        formattedAddress: "12 Dame Street, Dublin",
        rating: 4.3,
        userRatingsTotal: 128,
        mapsUrl: "https://maps.google.com/?cid=1",
        reviews: [],
    };

    test("a single review becomes evidence with NO attached candidate", () => {
        const draft = reviewToEvidenceDraft({ rating: 5, text: "Great beer!", authorName: "Sam" }, place);
        expect(draft.content).toBe("Great beer!");
        expect(draft.metadata).toMatchObject({ kind: "review", rating: 5, authorName: "Sam" });
        expect(draft.candidate).toBeUndefined(); // the core rule: one opinion isn't knowledge
    });

    test("Google's API never supplies an owner response, so the draft never fabricates one", () => {
        const draft = reviewToEvidenceDraft({ rating: 5, text: "Loved it." }, place);
        expect(draft.metadata?.ownerResponse).toBeUndefined();
    });

    test("the business profile's aggregate rating is authoritative enough to draft a FACT candidate directly", () => {
        const draft = businessProfileToEvidenceDraft(place, "DublinBrew");
        expect(draft.candidate).toMatchObject({ type: "FACT", confidence: 90 });
        expect(draft.candidate?.statement).toContain("4.3/5");
        expect(draft.candidate?.statement).toContain("128");
    });

    test("skips the rating candidate when there are too few ratings to be meaningful", () => {
        const draft = businessProfileToEvidenceDraft({ ...place, userRatingsTotal: 2 }, "DublinBrew");
        expect(draft.candidate).toBeUndefined();
    });
});

describe("google business collector: theme detection and sentiment", () => {
    test("detects multiple themes in one review", () => {
        expect(detectThemes("The staff were lovely but the wait was very long.")).toEqual(
            expect.arrayContaining(["Staff", "Waiting time"]),
        );
    });

    test("maps star ratings to sentiment, treating 3 stars as neutral", () => {
        expect(inferSentimentFromRating(5)).toBe("positive");
        expect(inferSentimentFromRating(4)).toBe("positive");
        expect(inferSentimentFromRating(2)).toBe("negative");
        expect(inferSentimentFromRating(1)).toBe("negative");
        expect(inferSentimentFromRating(3)).toBeNull();
    });
});

describe("google business collector: aggregation (Reviews -> Themes -> Candidate)", () => {
    const reviews = [
        { rating: 5, text: "Amazing atmosphere and lovely staff." },
        { rating: 5, text: "Great staff, will be back for the atmosphere alone." },
        { rating: 4, text: "Nice atmosphere, good coffee." },
        { rating: 2, text: "Waited forever, service was way too slow on a Friday." },
        { rating: 1, text: "Slow service again, waited 20 minutes just to order." },
    ];

    test("tallies theme mentions per sentiment bucket", () => {
        const aggregation = aggregateReviewThemes(reviews);
        expect(aggregation.totalReviews).toBe(5);
        expect(aggregation.positive.Atmosphere).toBe(3);
        expect(aggregation.positive.Staff).toBe(2);
        expect(aggregation.negative["Waiting time"]).toBe(2);
    });

    test("one-off mentions never survive to be candidates, only recurring themes do", () => {
        const aggregation = aggregateReviewThemes(reviews);
        const drafts = draftThemeCandidates("DublinBrew", aggregation);
        const themes = drafts.map((draft) => draft.theme);
        expect(themes).toContain("Atmosphere");
        expect(themes).toContain("Waiting time");

        // Every drafted candidate references a real recurring pattern, not a single review.
        for (const draft of drafts) {
            expect(draft.mentionCount).toBeGreaterThanOrEqual(2);
        }
    });

    test("drafts a RISK for a recurring negative theme and a FACT for a recurring positive theme", () => {
        const aggregation = aggregateReviewThemes(reviews);
        const drafts = draftThemeCandidates("DublinBrew", aggregation);
        const waitingTime = drafts.find((draft) => draft.theme === "Waiting time");
        const atmosphere = drafts.find((draft) => draft.theme === "Atmosphere");
        expect(waitingTime).toMatchObject({ type: "RISK", sentiment: "negative" });
        expect(waitingTime?.statement).toBe("Recurring customer complaints about waiting time at DublinBrew.");
        expect(atmosphere).toMatchObject({ type: "FACT", sentiment: "positive" });
        expect(atmosphere?.statement).toBe("Customers consistently praise DublinBrew's atmosphere.");
    });

    test("confidence stays within a sane 55-95 band and grows with more supporting reviews", () => {
        expect(themeConfidence(0, 10)).toBe(0);
        const small = themeConfidence(2, 5);
        const large = themeConfidence(28, 92);
        expect(small).toBeGreaterThanOrEqual(55);
        expect(small).toBeLessThanOrEqual(95);
        expect(large).toBeGreaterThan(small);
    });

    test("does not propose any theme when there are too few total reviews", () => {
        const aggregation = aggregateReviewThemes([{ rating: 1, text: "Slow service, bad staff, bad atmosphere." }]);
        expect(draftThemeCandidates("DublinBrew", aggregation)).toHaveLength(0);
    });

    test("formats a human-readable theme summary suitable as its own evidence entry", () => {
        const aggregation = aggregateReviewThemes(reviews);
        const summary = formatThemeSummary("DublinBrew", aggregation);
        expect(summary).toContain("5 Google reviews");
        expect(summary).toContain("Atmosphere (3)");
        expect(summary).toContain("Waiting time (2)");
    });
});
