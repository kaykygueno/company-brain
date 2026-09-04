import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const membershipRole = v.union(
    v.literal("Owner"),
    v.literal("Admin"),
    v.literal("Member"),
);

export const knowledgeType = v.union(
    v.literal("FACT"),
    v.literal("PROCESS"),
    v.literal("RULE"),
    v.literal("DECISION"),
    v.literal("REASON"),
    v.literal("LESSON"),
    v.literal("RISK"),
    v.literal("GOAL"),
);

export const knowledgeStatus = v.union(
    v.literal("active"),
    v.literal("superseded"),
    v.literal("archived"),
);

export const knowledgeCandidateStatus = v.union(
    v.literal("PENDING"),
    v.literal("APPROVED"),
    v.literal("REJECTED"),
);

export const discoveryStatus = v.union(
    v.literal("NOT_STARTED"),
    v.literal("BUILDING"),
    v.literal("READY"),
    v.literal("FAILED"),
);

export const sourceKind = v.union(
    v.literal("OFFICIAL_WEBSITE"),
    v.literal("GOOGLE_BUSINESS"),
    v.literal("NEWS"),
    v.literal("SOCIAL_PROFILE"),
    v.literal("PUBLIC_DIRECTORY"),
);

export const sourceStatus = v.union(
    v.literal("DISCOVERED"),
    v.literal("COLLECTED"),
    v.literal("FAILED"),
);

// Structured detail an adapter can attach to one piece of evidence, alongside
// its free-text content. Deliberately generic (not "review-only") so future
// adapters — news, social — can reuse the same shape instead of each growing
// their own bag of fields. `kind` lets aggregation queries tell evidence
// sub-types apart (e.g. a review vs. a business-profile summary) without
// parsing the content text.
export const evidenceMetadata = v.object({
    kind: v.optional(v.union(v.literal("review"), v.literal("business_profile"), v.literal("theme_summary"))),
    rating: v.optional(v.number()),
    authorName: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
    ownerResponse: v.optional(v.string()),
    location: v.optional(v.string()),
});

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        activeCompanyId: v.optional(v.id("companies")),
    }).index("by_clerkId", ["clerkId"]),
    companies: defineTable({
        name: v.string(),
        website: v.optional(v.string()),
        country: v.optional(v.string()),
        industry: v.optional(v.string()),
        description: v.optional(v.string()),
        discoveryStatus: discoveryStatus,
        discoveryStartedAt: v.optional(v.number()),
        createdAt: v.number(),
    }),
    memberships: defineTable({
        userId: v.id("users"),
        companyId: v.id("companies"),
        role: membershipRole,
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_and_companyId", ["userId", "companyId"])
        .index("by_companyId", ["companyId"]),
    dashboardData: defineTable({
        companyId: v.id("companies"),
        data: v.any(),
    }).index("by_companyId", ["companyId"]),
    knowledgeItems: defineTable({
        companyId: v.id("companies"),
        type: knowledgeType,
        title: v.string(),
        statement: v.string(),
        confidence: v.number(),
        status: knowledgeStatus,
        learnedAt: v.number(),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        reviewedAt: v.optional(v.number()),
        providedBy: v.string(),
        sourceType: v.string(),
        sourceReference: v.optional(v.string()),
        capturedByUserId: v.id("users"),
        // Traces this item back to the knowledgeCandidates record it was approved from, if any.
        sourceCandidateId: v.optional(v.id("knowledgeCandidates")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_companyId", ["companyId"])
        .index("by_companyId_and_type", ["companyId", "type"])
        .index("by_companyId_and_status", ["companyId", "status"]),
    knowledgeCandidates: defineTable({
        companyId: v.id("companies"),
        type: knowledgeType,
        statement: v.string(),
        sourceType: v.string(),
        sourceReference: v.optional(v.string()),
        // Public-discovery candidates retain a durable link to the exact evidence record.
        evidenceId: v.optional(v.id("evidence")),
        // The original evidence (interview excerpt, document text, etc.) that caused the AI to propose this knowledge.
        evidence: v.string(),
        confidence: v.number(),
        // Who or what produced this candidate, e.g. "AI Interview Agent" or a person's name.
        generatedBy: v.string(),
        createdByUserId: v.id("users"),
        createdAt: v.number(),
        status: knowledgeCandidateStatus,
        reviewedByUserId: v.optional(v.id("users")),
        reviewedAt: v.optional(v.number()),
        rejectedByUserId: v.optional(v.id("users")),
        rejectedAt: v.optional(v.number()),
    })
        .index("by_companyId", ["companyId"])
        .index("by_companyId_and_status", ["companyId", "status"]),
    sources: defineTable({
        companyId: v.id("companies"),
        kind: sourceKind,
        name: v.string(),
        url: v.optional(v.string()),
        status: sourceStatus,
        discoveredAt: v.number(),
        collectedAt: v.optional(v.number()),
        // An adapter's upstream identifier for this source (e.g. a resolved
        // Google Place ID), cached so repeat collection runs don't have to
        // re-resolve it against a rate/cost-limited external API every time.
        externalId: v.optional(v.string()),
    })
        .index("by_companyId", ["companyId"])
        .index("by_companyId_and_kind", ["companyId", "kind"]),
    evidence: defineTable({
        companyId: v.id("companies"),
        sourceId: v.id("sources"),
        content: v.string(),
        sourceUrl: v.optional(v.string()),
        discoveredAt: v.number(),
        metadata: v.optional(evidenceMetadata),
    })
        .index("by_companyId", ["companyId"])
        .index("by_sourceId", ["sourceId"]),
    knowledgeRelations: defineTable({
        companyId: v.id("companies"),
        fromKnowledgeId: v.id("knowledgeItems"),
        relation: v.string(),
        toKnowledgeId: v.id("knowledgeItems"),
        confidence: v.number(),
        createdByUserId: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_companyId_and_fromKnowledgeId", ["companyId", "fromKnowledgeId"])
        .index("by_companyId_and_toKnowledgeId", ["companyId", "toKnowledgeId"]),
});