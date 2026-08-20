import { NextRequest, NextResponse } from "next/server";
import { MAX_LLM_PROMPT_LENGTH, llmService, LLMProviderUnavailableError, LLMRequestValidationError } from "@/ai/llm-service";

const MAX_MESSAGE_LENGTH = MAX_LLM_PROMPT_LENGTH;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

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

    return NextResponse.json({
      response: result.content,
      provider: result.provider,
      model: result.model,
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
