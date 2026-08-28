import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const membershipRole = v.union(
    v.literal("Owner"),
    v.literal("Admin"),
    v.literal("Member"),
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
});