import { NextRequest, NextResponse } from "next/server";
import { MAX_LLM_PROMPT_LENGTH, llmService, LLMProviderUnavailableError, LLMRequestValidationError } from "@/ai/llm-service";
import { extractKnowledgeCandidates, MAX_EXTRACTION_INPUT_LENGTH } from "@/ai/knowledge-extraction-service";
import type { ExtractedKnowledgeCandidate } from "@/ai/knowledge-extraction-service";

const MAX_MESSAGE_LENGTH = MAX_LLM_PROMPT_LENGTH;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const priorConversation = typeof body?.conversation === "string" ? body.conversation.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Please enter a message before sending." }, { status: 400 });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          error: `Your message is too long. Please keep it to ${MAX_MESSAGE_LENGTH} characters or fewer.`,
        },
        { status: 413 },
      );
    }

    const result = await llmService.ask({
      prompt: message,
      taskType: "chat",
    });

    // Knowledge extraction runs alongside the reply but is entirely separate from it: it never
    // changes what the user sees in the conversation, and its raw output is never returned as
    // free-form text — only as a structured (and possibly empty) list of candidates.
    const candidates = await runKnowledgeExtraction(priorConversation, message, result.content);

    return NextResponse.json({
      response: result.content,
      provider: result.provider,
      model: result.model,
      ...(candidates.length > 0 ? { knowledge: { candidates } } : {}),
    });
  } catch (error) {
    if (error instanceof LLMRequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof LLMProviderUnavailableError) {
      console.error("Company Brain chat provider unavailable:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 503 },
      );
    }

    console.error("Company Brain chat request failed:", error);
    return NextResponse.json(
      { error: "Failed to reach Company Brain." },
      { status: 500 },
    );
  }
}

// Best-effort: extraction failing (or finding nothing) must never break the chat reply itself.
async function runKnowledgeExtraction(
  priorConversation: string,
  latestMessage: string,
  latestReply: string,
): Promise<ExtractedKnowledgeCandidate[]> {
  try {
    const trimmedPrior = priorConversation.slice(-MAX_EXTRACTION_INPUT_LENGTH);
    const conversation = `${trimmedPrior ? `${trimmedPrior}\n` : ""}user: ${latestMessage}\nai: ${latestReply}`.slice(
      -MAX_EXTRACTION_INPUT_LENGTH,
    );

    const extraction = await extractKnowledgeCandidates({ conversation, sourceType: "ai_interview" });
    return extraction.candidates;
  } catch (error) {
    console.error("Knowledge extraction from AI Interview failed:", error);
    return [];
  }
}
