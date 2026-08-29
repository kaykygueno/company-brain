import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

// convex-test needs the raw function source so it can route calls the same way the real
// deployment does; import.meta.glob is how Vite (and therefore Vitest) hands that over.
const modules = import.meta.glob("./**/*.*s");

function setUp() {
  return convexTest(schema, modules);
}

type AuthedClient = ReturnType<ReturnType<typeof setUp>["withIdentity"]>;

async function createCompanyWithOwner(t: ReturnType<typeof setUp>, ownerClerkId: string, companyName: string) {
  const asOwner = t.withIdentity({ subject: ownerClerkId, name: "Owner", email: `${ownerClerkId}@example.com` });
  const companyId = await asOwner.mutation(api.companies.create, { name: companyName, includeDemoData: false });
  return { asOwner, companyId };
}

async function addMember(
  t: ReturnType<typeof setUp>,
  asOwner: AuthedClient,
  clerkId: string,
  role: "Owner" | "Admin" | "Member",
) {
  await asOwner.mutation(api.companies.addMembership, {
    clerkId,
    name: role,
    email: `${clerkId}@example.com`,
    role,
  });
  return t.withIdentity({ subject: clerkId, name: role, email: `${clerkId}@example.com` });
}

const sampleCandidate = {
  type: "PROCESS" as const,
  statement: "Custom-component orders are placed with Supplier X on Mondays.",
  sourceType: "ai_interview",
  sourceReference: undefined,
  evidence: "We always place our custom-component order with Supplier X on Monday because they need three days to prepare it.",
  confidence: 82,
  generatedBy: "AI Interview Agent",
};

describe("knowledge candidate pipeline", () => {
  test("a member can propose a candidate but cannot approve or reject it", async () => {
    const t = setUp();
    const { asOwner, companyId } = await createCompanyWithOwner(t, "clerk_owner_a", "Company A");
    const asMember = await addMember(t, asOwner, "clerk_member_a", "Member");

    const candidateId = await asMember.mutation(api.knowledgeCandidates.create, sampleCandidate);

    const candidates = await asMember.query(api.knowledgeCandidates.list, { status: "PENDING" });
    expect(candidates).toHaveLength(1);
    expect(candidates[0]._id).toBe(candidateId);
    expect(candidates[0].companyId).toBe(companyId);
    expect(candidates[0].status).toBe("PENDING");
    expect(candidates[0].evidence).toBe(sampleCandidate.evidence);

    await expect(asMember.mutation(api.knowledgeCandidates.approve, { candidateId })).rejects.toThrow(
      /owners and admins/i,
    );
    await expect(asMember.mutation(api.knowledgeCandidates.reject, { candidateId })).rejects.toThrow(
      /owners and admins/i,
    );

    // Denied actions must not have changed anything.
    const stillPending = await asMember.query(api.knowledgeCandidates.list, { status: "PENDING" });
    expect(stillPending).toHaveLength(1);
    const permanentKnowledge = await asMember.query(api.knowledge.list, {});
    expect(permanentKnowledge).toHaveLength(0);
  });

  test("approving a candidate creates a knowledgeItem, preserves provenance, and keeps the candidate", async () => {
    const t = setUp();
    const { asOwner } = await createCompanyWithOwner(t, "clerk_owner_a", "Company A");

    const candidateId = await asOwner.mutation(api.knowledgeCandidates.create, sampleCandidate);
    const knowledgeItemId = await asOwner.mutation(api.knowledgeCandidates.approve, { candidateId });

    const items = await asOwner.query(api.knowledge.list, { status: "active" });
    expect(items).toHaveLength(1);
    expect(items[0]._id).toBe(knowledgeItemId);
    expect(items[0].type).toBe(sampleCandidate.type);
    expect(items[0].statement).toBe(sampleCandidate.statement);
    expect(items[0].confidence).toBe(sampleCandidate.confidence);
    expect(items[0].sourceType).toBe(sampleCandidate.sourceType);
    expect(items[0].providedBy).toBe(sampleCandidate.generatedBy);
    expect(items[0].sourceCandidateId).toBe(candidateId);

    const approvedCandidates = await asOwner.query(api.knowledgeCandidates.list, { status: "APPROVED" });
    expect(approvedCandidates).toHaveLength(1);
    expect(approvedCandidates[0]._id).toBe(candidateId);
    expect(approvedCandidates[0].reviewedAt).toBeTypeOf("number");

    const pending = await asOwner.query(api.knowledgeCandidates.list, { status: "PENDING" });
    expect(pending).toHaveLength(0);
  });

  test("rejecting a candidate removes it from the pending queue without creating knowledge, and keeps the record", async () => {
    const t = setUp();
    const { asOwner } = await createCompanyWithOwner(t, "clerk_owner_a", "Company A");
    const asAdmin = await addMember(t, asOwner, "clerk_admin_a", "Admin");

    const candidateId = await asOwner.mutation(api.knowledgeCandidates.create, sampleCandidate);
    await asAdmin.mutation(api.knowledgeCandidates.reject, { candidateId });

    const pending = await asOwner.query(api.knowledgeCandidates.list, { status: "PENDING" });
    expect(pending).toHaveLength(0);

    const rejected = await asOwner.query(api.knowledgeCandidates.list, { status: "REJECTED" });
    expect(rejected).toHaveLength(1);
    expect(rejected[0]._id).toBe(candidateId);
    expect(rejected[0].rejectedAt).toBeTypeOf("number");

    const items = await asOwner.query(api.knowledge.list, {});
    expect(items).toHaveLength(0);
  });

  test("Company B cannot read, approve, or reject Company A's candidates", async () => {
    const t = setUp();
    const { asOwner: ownerA } = await createCompanyWithOwner(t, "clerk_owner_a", "Company A");
    const { asOwner: ownerB } = await createCompanyWithOwner(t, "clerk_owner_b", "Company B");

    const candidateId = await ownerA.mutation(api.knowledgeCandidates.create, sampleCandidate);

    const candidatesSeenByB = await ownerB.query(api.knowledgeCandidates.list, { status: "PENDING" });
    expect(candidatesSeenByB).toHaveLength(0);

    await expect(ownerB.mutation(api.knowledgeCandidates.approve, { candidateId })).rejects.toThrow(
      /not found in your active company/i,
    );
    await expect(ownerB.mutation(api.knowledgeCandidates.reject, { candidateId })).rejects.toThrow(
      /not found in your active company/i,
    );

    // The candidate must be untouched by Company B's failed attempts.
    const candidatesSeenByA = await ownerA.query(api.knowledgeCandidates.list, { status: "PENDING" });
    expect(candidatesSeenByA).toHaveLength(1);
    expect(candidatesSeenByA[0]._id).toBe(candidateId);

    // And Company B's own knowledge stays empty.
    const knowledgeForB = await ownerB.query(api.knowledge.list, {});
    expect(knowledgeForB).toHaveLength(0);
  });
});
