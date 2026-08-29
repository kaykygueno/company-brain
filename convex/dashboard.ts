import { mutation, query } from "./_generated/server";
import { getActiveMembership } from "./companies";

export const current = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (index) => index.eq("clerkId", identity.subject))
            .unique();
        if (!user?.activeCompanyId) {
            return null;
        }

        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_userId_and_companyId", (index) =>
                index.eq("userId", user._id).eq("companyId", user.activeCompanyId!),
            )
            .unique();
        if (!membership) {
            return null;
        }

        const company = await ctx.db.get(membership.companyId);
        if (!company) {
            return null;
        }

        const dashboard = await ctx.db
            .query("dashboardData")
            .withIndex("by_companyId", (index) => index.eq("companyId", company._id))
            .unique();

        return { company, data: dashboard?.data ?? null };
    },
});

// Lets a company owner clear seeded/demo dashboard data so the dashboard falls
// back to the real empty state instead of showing fictional sample content.
export const clearDemoData = mutation({
    args: {},
    handler: async (ctx) => {
        const { membership, company } = await getActiveMembership(ctx);
        if (!company || membership?.role !== "Owner") {
            throw new Error("Only the company owner can clear dashboard data.");
        }

        const dashboard = await ctx.db
            .query("dashboardData")
            .withIndex("by_companyId", (index) => index.eq("companyId", company._id))
            .unique();
        if (dashboard) {
            await ctx.db.delete(dashboard._id);
        }
    },
});