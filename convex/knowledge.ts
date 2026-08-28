import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getActiveMembership } from "./companies";
import { knowledgeStatus, knowledgeType } from "./schema";

function assertKnowledgeManager(role: "Owner" | "Admin" | "Member" | undefined) {
    if (role !== "Owner" && role !== "Admin") {
        throw new Error("Only company owners and admins can manage knowledge.");
    }
}

function assertConfidence(confidence: number) {
    if (!Number.isInteger(confidence) || confidence < 0 || confidence > 100) {
        throw new Error("Confidence must be a whole number from 0 to 100.");
    }
}

export const list = query({
    args: { type: v.optional(knowledgeType), status: v.optional(knowledgeStatus) },
    handler: async (ctx, args) => {
        const { company } = await getActiveMembership(ctx);
        if (!company) {
            return [];
        }

        let items = await ctx.db
            .query("knowledgeItems")
            .withIndex("by_companyId", (index) => index.eq("companyId", company._id))
            .collect();
        if (args.type) {
            items = items.filter((item) => item.type === args.type);
        }
        if (args.status) {
            items = items.filter((item) => item.status === args.status);
        }
        return items;
    },
});

export const graph = query({
    args: { knowledgeId: v.id("knowledgeItems") },
    handler: async (ctx, args) => {
        const { company } = await getActiveMembership(ctx);
        if (!company) {
            return null;
        }

        const item = await ctx.db.get(args.knowledgeId);
        if (!item || item.companyId !== company._id) {
            throw new Error("Knowledge was not found in your active company.");
        }
        const [outgoing, incoming] = await Promise.all([
            ctx.db
                .query("knowledgeRelations")
                .withIndex("by_companyId_and_fromKnowledgeId", (index) =>
                    index.eq("companyId", company._id).eq("fromKnowledgeId", item._id),
                )
                .collect(),
            ctx.db
                .query("knowledgeRelations")
                .withIndex("by_companyId_and_toKnowledgeId", (index) =>
                    index.eq("companyId", company._id).eq("toKnowledgeId", item._id),
                )
                .collect(),
        ]);

        const relatedIds = [...outgoing.map((relation) => relation.toKnowledgeId), ...incoming.map((relation) => relation.fromKnowledgeId)];
        const relatedItems = await Promise.all(relatedIds.map((knowledgeId) => ctx.db.get(knowledgeId)));
        return { item, outgoing, incoming, relatedItems: relatedItems.filter((relatedItem) => relatedItem?.companyId === company._id) };
    },
});

export const create = mutation({
    args: {
        type: knowledgeType,
        title: v.string(),
        statement: v.string(),
        confidence: v.number(),
        status: knowledgeStatus,
        learnedAt: v.number(),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        providedBy: v.string(),
        sourceType: v.string(),
        sourceReference: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { user, membership, company } = await getActiveMembership(ctx);
        if (!company) {
            throw new Error("Select a company before adding knowledge.");
        }
        assertKnowledgeManager(membership?.role);
        assertConfidence(args.confidence);
        const title = args.title.trim();
        const statement = args.statement.trim();
        const providedBy = args.providedBy.trim();
        const sourceType = args.sourceType.trim();
        if (!title || !statement || !providedBy || !sourceType) {
            throw new Error("Knowledge requires a title, statement, provider, and source type.");
        }
        if (args.validFrom && args.validUntil && args.validUntil < args.validFrom) {
            throw new Error("The validity end date must be after the start date.");
        }

        const now = Date.now();
        return await ctx.db.insert("knowledgeItems", {
            ...args,
            title,
            statement,
            providedBy,
            sourceType,
            companyId: company._id,
            capturedByUserId: user._id,
            createdAt: now,
            updatedAt: now,
        });
    },
});

export const createRelation = mutation({
    args: {
        fromKnowledgeId: v.id("knowledgeItems"),
        relation: v.string(),
        toKnowledgeId: v.id("knowledgeItems"),
        confidence: v.number(),
    },
    handler: async (ctx, args) => {
        const { user, membership, company } = await getActiveMembership(ctx);
        if (!company) {
            throw new Error("Select a company before linking knowledge.");
        }
        assertKnowledgeManager(membership?.role);
        assertConfidence(args.confidence);
        const relation = args.relation.trim();
        if (!relation || args.fromKnowledgeId === args.toKnowledgeId) {
            throw new Error("A relationship must name two different knowledge records.");
        }

        const [fromItem, toItem] = await Promise.all([
            ctx.db.get(args.fromKnowledgeId),
            ctx.db.get(args.toKnowledgeId),
        ]);
        if (!fromItem || !toItem || fromItem.companyId !== company._id || toItem.companyId !== company._id) {
            throw new Error("Knowledge can only be linked within your active company.");
        }

        return await ctx.db.insert("knowledgeRelations", {
            ...args,
            relation,
            companyId: company._id,
            createdByUserId: user._id,
            createdAt: Date.now(),
        });
    },
});