import { describe, expect, test } from "vitest";
import { extractKnowledgeCandidates, KNOWLEDGE_CANDIDATE_TYPES } from "@/ai/knowledge-extraction-service";
import { llmService } from "@/ai/llm-service";

/**
 * Live smoke test against the real Groq API (skipped automatically when GROQ_API_KEY is
 * unavailable, e.g. in CI without secrets). Run explicitly with:
 *   npx vitest run src/ai/knowledge-extraction-service.smoke.test.ts
 */
describe.skipIf(!process.env.GROQ_API_KEY)("AI Interview backend (live Groq)", () => {
  test("the ordinary chat reply still works", async () => {
    const result = await llmService.ask({
      prompt: "In one short sentence, what is Company Brain?",
      taskType: "chat",
    });

    expect(result.provider).toBe("groq");
    expect(result.content.trim().length).toBeGreaterThan(0);
  });

  test("extracts FACT / PROCESS / REASON candidates from a conversation with clear business knowledge", async () => {
    const conversation =
      "manager: We always place our custom-component order with Supplier X on Monday because they need three days to prepare it.";

    const { candidates } = await extractKnowledgeCandidates({ conversation, sourceType: "ai_interview" });

    console.log("Extracted candidates:", JSON.stringify(candidates, null, 2));

    expect(candidates.length).toBeGreaterThan(0);
    for (const candidate of candidates) {
      expect(KNOWLEDGE_CANDIDATE_TYPES).toContain(candidate.type);
      expect(candidate.statement.length).toBeGreaterThan(0);
      expect(candidate.evidence.length).toBeGreaterThan(0);
      expect(candidate.confidence).toBeGreaterThanOrEqual(0);
      expect(candidate.confidence).toBeLessThanOrEqual(100);
    }

    // The evidence field must be grounded in what was actually said, not invented — every
    // candidate's evidence should share meaningful words with the source conversation.
    const conversationWords = new Set(conversation.toLowerCase().match(/[a-z]{4,}/g));
    for (const candidate of candidates) {
      const evidenceWords = candidate.evidence.toLowerCase().match(/[a-z]{4,}/g) ?? [];
      const overlap = evidenceWords.filter((word) => conversationWords.has(word));
      expect(overlap.length).toBeGreaterThan(0);
    }

    const types = candidates.map((candidate) => candidate.type);
    expect(types).toEqual(expect.arrayContaining(["PROCESS"]));
  }, 30000);

  test("returns no candidates for a conversation with no meaningful business knowledge", async () => {
    const conversation = [
      "manager: Good morning!",
      "ai: Good morning, how are you today?",
      "manager: I'm doing well thanks, just grabbing a coffee before we start.",
    ].join("\n");

    const { candidates } = await extractKnowledgeCandidates({ conversation, sourceType: "ai_interview" });

    expect(candidates).toHaveLength(0);
  }, 30000);
});
