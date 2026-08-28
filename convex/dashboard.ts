import { query } from "./_generated/server";
import { getActiveMembership } from "./companies";

export const current = query({
    args: {},
    handler: async (ctx) => {
        const { company } = await getActiveMembership(ctx);
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