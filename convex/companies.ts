import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import { membershipRole } from "./schema";

type CompanyContext = QueryCtx | MutationCtx;

const demonstrationDashboard = {
    needsAttention: [
        { title: "Limerick branch missed revenue target", detail: "Three consecutive weeks below weekly target. No action recorded.", severity: "high" },
        { title: "Coffee bean stock below safety threshold", detail: "4 of 12 branches have less than 2 weeks of specialty stock remaining.", severity: "high" },
        { title: "Q3 delivery schedule unconfirmed", detail: "Primary bean supplier has not responded to the Q3 schedule request.", severity: "medium" },
    ],
    risks: ["Single-supplier dependency for specialty beans creates a fragile supply chain.", "Staff turnover in Cork branches is 3x the company average.", "Seasonal demand spikes are not matched by current branch staffing models."],
    opportunities: [
        { title: "Expand cold brew product line", detail: "Cold brew demand is up 34% YoY across all branches. No new SKUs introduced yet." },
        { title: "Grow loyalty programme coverage", detail: "Only 22% of regular customers are currently enrolled in the loyalty programme." },
    ],
    questionsForYou: [{ question: "Is the Galway branch expansion still planned for Q4?", context: "The last recorded decision deferred it. No update has been captured since March." }],
    recentDecisions: [
        { title: "Switch to single-origin bean supplier", date: "Jan 2025", outcome: "Implemented" },
        { title: "Expand to Galway branch", date: "Mar 2025", outcome: "Implemented" },
        { title: "Pause loyalty programme rebrand", date: "Nov 2024", outcome: "Paused" },
    ],
    knowledgeSummary: [
        { label: "Facts", count: 142 }, { label: "Rules", count: 89 }, { label: "Processes", count: 67 },
        { label: "Decisions", count: 234 }, { label: "Lessons", count: 53 }, { label: "Risks", count: 28 },
    ],
    connectedSystems: ["monday.com", "Asana", "Jira", "ClickUp", "Trello", "Google Drive", "Google Calendar", "Slack", "Salesforce"],
};

async function getCurrentUser(ctx: CompanyContext) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("You must be signed in to access company data.");
    }

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (index) => index.eq("clerkId", identity.subject))
        .unique();

    if (!user) {
        throw new Error("Your Company Brain profile has not been created yet.");
    }

    return user;
}

async function ensureCurrentUser(ctx: MutationCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
        throw new Error("You must be signed in to create a company.");
    }

    const existingUser = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (index) => index.eq("clerkId", identity.subject))
        .unique();

    if (existingUser) {
        return existingUser;
    }

    const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        name: identity.name ?? "Company Brain user",
        email: identity.email ?? "",
    });

    return await ctx.db.get(userId);
}

export async function getActiveMembership(ctx: CompanyContext) {
    const user = await getCurrentUser(ctx);
    if (!user.activeCompanyId) {
        return { user, membership: null, company: null };
    }

    const membership = await ctx.db
        .query("memberships")
        .withIndex("by_userId_and_companyId", (index) =>
            index.eq("userId", user._id).eq("companyId", user.activeCompanyId!),
        )
        .unique();

    if (!membership) {
        throw new Error("You do not have access to the selected company.");
    }

    const company = await ctx.db.get(membership.companyId);
    if (!company) {
        throw new Error("The selected company no longer exists.");
    }

    return { user, membership, company };
}

export const viewer = query({
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
        if (!user) {
            return { activeCompany: null, companies: [], role: null };
        }

        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_userId", (index) => index.eq("userId", user._id))
            .collect();
        const companies = await Promise.all(
            memberships.map(async (membership) => {
                const company = await ctx.db.get(membership.companyId);
                return company ? { _id: company._id, name: company.name, role: membership.role } : null;
            }),
        );
        const activeCompany = companies.find((company) => company?._id === user.activeCompanyId) ?? null;

        return {
            activeCompany,
            companies: companies.filter((company) => company !== null),
            role: activeCompany?.role ?? null,
        };
    },
});

export const create = mutation({
    args: { name: v.string(), includeDemoData: v.boolean() },
    handler: async (ctx, args) => {
        const name = args.name.trim();
        if (name.length < 2 || name.length > 100) {
            throw new Error("Company names must be between 2 and 100 characters.");
        }

        const user = await ensureCurrentUser(ctx);
        if (!user) {
            throw new Error("Unable to create your Company Brain profile.");
        }
        const companyId = await ctx.db.insert("companies", { name, createdAt: Date.now() });
        await ctx.db.insert("memberships", {
            userId: user._id,
            companyId,
            role: "Owner",
            createdAt: Date.now(),
        });
        if (args.includeDemoData) {
            await ctx.db.insert("dashboardData", { companyId, data: demonstrationDashboard });
        }
        await ctx.db.patch(user._id, { activeCompanyId: companyId });
        return companyId;
    },
});

export const setActive = mutation({
    args: { companyId: v.id("companies") },
    handler: async (ctx, args) => {
        const user = await getCurrentUser(ctx);
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_userId_and_companyId", (index) =>
                index.eq("userId", user._id).eq("companyId", args.companyId),
            )
            .unique();
        if (!membership) {
            throw new Error("You do not belong to this company.");
        }

        await ctx.db.patch(user._id, { activeCompanyId: args.companyId });
    },
});

export const addMembership = mutation({
    args: {
        clerkId: v.string(),
        name: v.string(),
        email: v.string(),
        role: membershipRole,
    },
    handler: async (ctx, args) => {
        const { membership: actorMembership, company } = await getActiveMembership(ctx);
        if (!company || actorMembership?.role !== "Owner") {
            throw new Error("Only company owners can add members.");
        }

        const clerkId = args.clerkId.trim();
        if (!clerkId) {
            throw new Error("A Clerk user ID is required.");
        }
        let user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (index) => index.eq("clerkId", clerkId))
            .unique();
        if (!user) {
            const userId = await ctx.db.insert("users", {
                clerkId,
                name: args.name.trim() || "Company Brain user",
                email: args.email.trim(),
            });
            user = await ctx.db.get(userId);
        }
        if (!user) {
            throw new Error("Unable to create the member profile.");
        }

        const existingMembership = await ctx.db
            .query("memberships")
            .withIndex("by_userId_and_companyId", (index) =>
                index.eq("userId", user._id).eq("companyId", company._id),
            )
            .unique();
        if (existingMembership) {
            throw new Error("This user already belongs to the active company.");
        }

        const membershipId = await ctx.db.insert("memberships", {
            userId: user._id,
            companyId: company._id,
            role: args.role,
            createdAt: Date.now(),
        });
        if (!user.activeCompanyId) {
            await ctx.db.patch(user._id, { activeCompanyId: company._id });
        }
        return membershipId;
    },
});

export const updateMembershipRole = mutation({
    args: { membershipId: v.id("memberships"), role: membershipRole },
    handler: async (ctx, args) => {
        const { membership: actorMembership } = await getActiveMembership(ctx);
        if (actorMembership?.role !== "Owner") {
            throw new Error("Only company owners can update member roles.");
        }

        const targetMembership = await ctx.db.get(args.membershipId);
        if (!targetMembership || targetMembership.companyId !== actorMembership.companyId) {
            throw new Error("You cannot update memberships outside your active company.");
        }

        await ctx.db.patch(args.membershipId, { role: args.role });
    },
});