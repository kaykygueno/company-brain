import { LLMRouter } from "@/ai/llm-router";
import { classifyLLMError, LLMRequestValidationError } from "@/ai/llm-service";
import type { LLMRequest } from "@/ai/types";

/**
 * Knowledge Extraction Service
 *
 * A dedicated AI-layer service that reads raw conversation content (an AI interview
 * transcript, a chat thread, meeting notes, etc.) and proposes structured *candidate*
 * knowledge for a human reviewer.
 *
 * This service never writes anything permanent — it only ever returns candidates.
 * The LLM has no access to the knowledgeItems table and no tool that could create one;
 * its entire output surface is this typed candidate array. Callers are expected to hand
 * that array to the knowledgeCandidates system (convex/knowledgeCandidates.ts `create`),
 * where a candidate stays PENDING until a company Owner or Admin approves it.
 */

export const KNOWLEDGE_CANDIDATE_TYPES = [
  "FACT",
  "PROCESS",
  "RULE",
  "DECISION",
  "REASON",
  "LESSON",
  "RISK",
  "GOAL",
] as const;

export type KnowledgeCandidateType = (typeof KNOWLEDGE_CANDIDATE_TYPES)[number];

export type ExtractedKnowledgeCandidate = {
  type: KnowledgeCandidateType;
  statement: string;
  /** The exact text from the conversation that caused this candidate to be proposed. */
  evidence: string;
  /** 0-100. How certain the model is that the statement is accurate, persistent, and correctly typed. */
  confidence: number;
};

export type ExtractKnowledgeCandidatesInput = {
  conversation: string;
  /** e.g. "ai_interview", "chat", "meeting_notes". Defaults to "conversation". */
  sourceType?: string;
};

export type ExtractKnowledgeCandidatesResult = {
  candidates: ExtractedKnowledgeCandidate[];
  provider: string;
  model: string;
};

// Interview transcripts run much longer than a single chat message, so this service
// validates its own input length instead of going through llmService's chat-sized cap.
export const MAX_EXTRACTION_INPUT_LENGTH = 12000;

const CANDIDATE_TYPE_SET = new Set<string>(KNOWLEDGE_CANDIDATE_TYPES);

const SYSTEM_PROMPT = `You are the knowledge-extraction engine for Company Brain, a system that helps companies preserve durable business knowledge from natural conversation.

Your only job is to read a conversation and propose CANDIDATE knowledge for a human reviewer. You never create permanent records. Every candidate you propose must be approved by a company Owner or Admin before it becomes real, lasting knowledge — treat your output as a draft for review, never as a finished fact.

Classify each candidate into exactly one of these types:
- FACT: a verifiable, established fact about the business (numbers, structure, history, market position).
- PROCESS: a documented or habitual way the company does something.
- RULE: a policy, constraint, or standard the company enforces.
- DECISION: a choice the company made, including its rationale and/or outcome.
- REASON: the stated rationale or justification behind a decision or practice.
- LESSON: something the company learned, usually from an outcome that did or did not go as planned.
- RISK: an identified threat, dependency, or vulnerability to the business.
- GOAL: an objective, target, or intended future outcome the company is pursuing.

Strict rules:
1. Only extract knowledge that is actually present in the conversation. Never invent, infer beyond what was said, or fill gaps with assumptions or general knowledge. If the conversation contains no meaningful company knowledge, return an empty candidates array — do not force a result just to produce output.
2. Ignore casual conversation: greetings, small talk, pleasantries, jokes, and other content with no lasting business relevance must never become a candidate.
3. Distinguish temporary, one-off, or time-bound statements ("I'm out sick today", "we're waiting on a reply this afternoon") from persistent business knowledge that stays true or relevant beyond the moment. Only propose the latter as candidates.
4. Distinguish personal opinions or unverified impressions ("I think", "I feel", "in my view") from established company facts. Never upgrade an opinion into a FACT. If an opinion is worth capturing because it explains a DECISION or REASON, classify it accordingly and phrase the statement so it is clearly attributed as a view or belief, not stated as settled fact.
5. Preserve uncertainty. If the speaker hedges, qualifies, or is unsure, your statement and confidence score must reflect that — never phrase a hedged, speculative, or unconfirmed statement as if it were certain.
6. Every candidate must include an "evidence" field: a direct quote or close paraphrase from the conversation that caused you to propose it. Never propose a candidate without evidence grounded in the text.
7. Every candidate must include a "confidence" field from 0 to 100 reflecting how certain you are that the statement is accurate, persistent, and correctly classified. Use lower confidence for hedged, ambiguous, secondhand, or opinion-based statements.
8. Return as many candidates as the conversation actually supports — zero, one, or several — one entry per distinct piece of knowledge. Do not merge unrelated statements into one candidate, and do not split one statement into duplicates.

Respond with ONLY a JSON object of this exact shape and nothing else — no prose, no markdown fences, no commentary:
{"candidates": [{"type": "FACT|PROCESS|RULE|DECISION|REASON|LESSON|RISK|GOAL", "statement": "string", "evidence": "string", "confidence": 0}]}

If there is no meaningful company knowledge to propose, respond with exactly:
{"candidates": []}`;

function buildUserPrompt(conversation: string, sourceType: string): string {
  return `SOURCE TYPE: ${sourceType}\n\nCONVERSATION:\n"""\n${conversation}\n"""`;
}

function parseCandidates(raw: string): ExtractedKnowledgeCandidate[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The extraction model did not return valid JSON.");
  }

  const candidatesValue = (parsed as { candidates?: unknown } | null)?.candidates;
  if (!Array.isArray(candidatesValue)) {
    throw new Error("The extraction model response did not include a candidates array.");
  }

  const candidates: ExtractedKnowledgeCandidate[] = [];
  for (const entry of candidatesValue) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const { type, statement, evidence, confidence } = entry as Record<string, unknown>;
    if (typeof type !== "string" || !CANDIDATE_TYPE_SET.has(type)) {
      continue;
    }
    if (typeof statement !== "string" || !statement.trim()) {
      continue;
    }
    if (typeof evidence !== "string" || !evidence.trim()) {
      continue;
    }
    if (typeof confidence !== "number" || !Number.isFinite(confidence)) {
      continue;
    }

    candidates.push({
      type: type as KnowledgeCandidateType,
      statement: statement.trim(),
      evidence: evidence.trim(),
      confidence: Math.max(0, Math.min(100, Math.round(confidence))),
    });
  }

  return candidates;
}

/**
 * Reads conversation content and returns structured candidate knowledge — never free-form
 * text, and never a write to permanent storage. Returns an empty candidates array when the
 * conversation holds no meaningful, durable company knowledge.
 */
export async function extractKnowledgeCandidates(
  input: ExtractKnowledgeCandidatesInput,
): Promise<ExtractKnowledgeCandidatesResult> {
  const conversation = input.conversation.trim();
  const sourceType = input.sourceType?.trim() || "conversation";

  if (!conversation) {
    throw new LLMRequestValidationError("Conversation content is required.");
  }
  if (conversation.length > MAX_EXTRACTION_INPUT_LENGTH) {
    throw new LLMRequestValidationError(
      `Conversation exceeds the maximum allowed length of ${MAX_EXTRACTION_INPUT_LENGTH} characters.`,
    );
  }

  const request: LLMRequest = {
    prompt: buildUserPrompt(conversation, sourceType),
    systemPrompt: SYSTEM_PROMPT,
    responseFormat: "json_object",
    taskType: "extraction",
  };

  const response = await new LLMRouter().route(request).catch((error) => {
    throw classifyLLMError(error, "Failed to extract knowledge candidates.");
  });

  return {
    candidates: parseCandidates(response.content),
    provider: response.provider,
    model: response.model,
  };
}
