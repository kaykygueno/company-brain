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

export default defineSchema({
    users: defineTable({
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        activeCompanyId: v.optional(v.id("companies")),
    }).index("by_clerkId", ["clerkId"]),
    companies: defineTable({
        name: v.string(),
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