import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getActiveMembership } from "./companies";
import { assertConfidence, assertKnowledgeManager } from "./knowledge";
import { knowledgeCandidateStatus, knowledgeType } from "./schema";

// Turns a proposed statement into a short, single-line label for the resulting knowledgeItem's title.
function deriveTitle(statement: string) {
    const singleLine = statement.replace(/\s+/g, " ").trim();
    return singleLine.length > 100 ? `${singleLine.slice(0, 97)}...` : singleLine;
}

export const list = query({
    args: { status: v.optional(knowledgeCandidateStatus) },
    handler: async (ctx, args) => {
        const { company } = await getActiveMembership(ctx);
        if (!company) {
            return [];
        }

        let candidates = await ctx.db
            .query("knowledgeCandidates")
            .withIndex("by_companyId", (index) => index.eq("companyId", company._id))
            .collect();
        if (args.status) {
            candidates = candidates.filter((candidate) => candidate.status === args.status);
        }
        return candidates;
    },
});

export const create = mutation({
    args: {
        type: knowledgeType,
        statement: v.string(),
        sourceType: v.string(),
        sourceReference: v.optional(v.string()),
        evidenceId: v.optional(v.id("evidence")),
        evidence: v.string(),
        confidence: v.number(),
        generatedBy: v.string(),
    },
    handler: async (ctx, args) => {
        const { user, company } = await getActiveMembership(ctx);
        if (!company) {
            throw new Error("Select a company before proposing knowledge.");
        }
        assertConfidence(args.confidence);

        const statement = args.statement.trim();
        const sourceType = args.sourceType.trim();
        const evidence = args.evidence.trim();
        const generatedBy = args.generatedBy.trim();
        const sourceReference = args.sourceReference?.trim() || undefined;
        if (!statement || !sourceType || !evidence || !generatedBy) {
            throw new Error("A knowledge candidate requires a statement, source type, evidence, and generator.");
        }

        return await ctx.db.insert("knowledgeCandidates", {
            companyId: company._id,
            type: args.type,
            statement,
            sourceType,
            sourceReference,
            evidenceId: args.evidenceId,
            evidence,
            confidence: args.confidence,
            generatedBy,
            createdByUserId: user._id,
            createdAt: Date.now(),
            status: "PENDING",
        });
    },
});

export const approve = mutation({
    args: { candidateId: v.id("knowledgeCandidates") },
    handler: async (ctx, args) => {
        const { user, membership, company } = await getActiveMembership(ctx);
        if (!company) {
            throw new Error("Select a company before approving candidates.");
        }
        assertKnowledgeManager(membership?.role);

        const candidate = await ctx.db.get(args.candidateId);
        if (!candidate || candidate.companyId !== company._id) {
            throw new Error("Candidate was not found in your active company.");
        }
        if (candidate.status !== "PENDING") {
            throw new Error("Only pending candidates can be approved.");
        }

        const now = Date.now();
        const knowledgeItemId = await ctx.db.insert("knowledgeItems", {
            companyId: company._id,
            type: candidate.type,
            title: deriveTitle(candidate.statement),
            statement: candidate.statement,
            confidence: candidate.confidence,
            status: "active",
            learnedAt: candidate.createdAt,
            providedBy: candidate.generatedBy,
            sourceType: candidate.sourceType,
            sourceReference: candidate.sourceReference,
            capturedByUserId: user._id,
            sourceCandidateId: candidate._id,
            createdAt: now,
            updatedAt: now,
        });

        await ctx.db.patch(candidate._id, {
            status: "APPROVED",
            reviewedByUserId: user._id,
            reviewedAt: now,
        });

        return knowledgeItemId;
    },
});

export const reject = mutation({
    args: { candidateId: v.id("knowledgeCandidates") },
    handler: async (ctx, args) => {
        const { user, membership, company } = await getActiveMembership(ctx);
        if (!company) {
            throw new Error("Select a company before rejecting candidates.");
        }
        assertKnowledgeManager(membership?.role);

        const candidate = await ctx.db.get(args.candidateId);
        if (!candidate || candidate.companyId !== company._id) {
            throw new Error("Candidate was not found in your active company.");
        }
        if (candidate.status !== "PENDING") {
            throw new Error("Only pending candidates can be rejected.");
        }

        await ctx.db.patch(candidate._id, {
            status: "REJECTED",
            rejectedByUserId: user._id,
            rejectedAt: Date.now(),
        });
    },
});
