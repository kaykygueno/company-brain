import { NextRequest, NextResponse } from "next/server";
import {
  extractKnowledgeCandidates,
  MAX_EXTRACTION_INPUT_LENGTH,
} from "@/ai/knowledge-extraction-service";
import { LLMProviderUnavailableError, LLMRequestValidationError } from "@/ai/llm-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const conversation = typeof body?.conversation === "string" ? body.conversation.trim() : "";
    const sourceType = typeof body?.sourceType === "string" ? body.sourceType.trim() : undefined;

    if (!conversation) {
      return NextResponse.json({ error: "Conversation content is required." }, { status: 400 });
    }

    if (conversation.length > MAX_EXTRACTION_INPUT_LENGTH) {
      return NextResponse.json(
        {
          error: `Conversation exceeds the maximum allowed length of ${MAX_EXTRACTION_INPUT_LENGTH} characters.`,
        },
        { status: 413 },
      );
    }

    const result = await extractKnowledgeCandidates({ conversation, sourceType });

    return NextResponse.json({
      candidates: result.candidates,
      provider: result.provider,
      model: result.model,
    });
  } catch (error) {
    if (error instanceof LLMRequestValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof LLMProviderUnavailableError) {
      console.error("Knowledge extraction provider unavailable:", error);
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Knowledge extraction request failed:", error);
    return NextResponse.json({ error: "Failed to extract knowledge candidates." }, { status: 500 });
  }
}
