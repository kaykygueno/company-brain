import Groq from "groq-sdk";
import { BaseLLMProvider } from "@/ai/providers/provider";
import { getProviderConfig } from "@/ai/providers/config";
import type { LLMRequest, LLMResponse, LLMTaskType } from "@/ai/types";

export class GroqProvider extends BaseLLMProvider {
  readonly name = "groq" as const;
  readonly displayName = "Groq";
  readonly defaultModel = getProviderConfig(this.name).defaultModel;

  supports(taskType: LLMTaskType): boolean {
    const config = getProviderConfig(this.name);
    return config.supportedTasks.includes(taskType);
  }

  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GROQ_API_KEY environment variable.");
    }

    return new Groq({ apiKey });
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const config = getProviderConfig(this.name);

    if (!config.enabled) {
      throw new Error("Groq provider is currently disabled.");
    }

    const groq = this.getClient();
    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [];
    if (request.systemPrompt) {
      messages.push({ role: "system", content: request.systemPrompt });
    }
    messages.push({ role: "user", content: request.prompt });

    const completion = await groq.chat.completions.create({
      model: config.defaultModel,
      messages,
      // Extraction needs deterministic, grounded output rather than creative phrasing.
      temperature: request.taskType === "extraction" ? 0.2 : 0.7,
      ...(request.responseFormat === "json_object" ? { response_format: { type: "json_object" as const } } : {}),
    });

    const content = completion.choices[0]?.message?.content ?? "No response returned by Groq.";

    return {
      provider: this.name,
      model: config.defaultModel,
      content,
      requestId: completion.id ?? `groq-${Date.now()}`,
      metadata: {
        taskType: request.taskType ?? "chat",
        contextSize: request.contextSize ?? 0,
        baseUrl: config.baseUrl,
        providerEnvVar: config.apiKeyEnvVar,
        status: "live-groq-integration",
      },
    };
  }
}
