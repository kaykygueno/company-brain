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
    const completion = await groq.chat.completions.create({
      model: config.defaultModel,
      messages: [{ role: "user", content: request.prompt }],
      temperature: 0.7,
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
