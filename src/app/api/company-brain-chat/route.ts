import { NextRequest, NextResponse } from "next/server";
import { llmService } from "@/ai/llm-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
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
    console.error("Company Brain chat request failed:", error);
    return NextResponse.json(
      { error: "Failed to reach Company Brain." },
      { status: 500 },
    );
  }
}
