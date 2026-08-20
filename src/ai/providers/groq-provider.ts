import { BaseLLMProvider } from "@/ai/providers/provider";
import { getProviderConfig } from "@/ai/providers/config";
import type { LLMRequest, LLMResponse, LLMTaskType } from "@/ai/types";

export class GroqProvider extends BaseLLMProvider {
  readonly name = "groq" as const;
  readonly displayName = "Groq";
  readonly defaultModel = "llama-3.1-8b-instant";

  supports(taskType: LLMTaskType): boolean {
    const config = getProviderConfig(this.name);
    return config.supportedTasks.includes(taskType);
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const config = getProviderConfig(this.name);

    if (!config.enabled) {
      throw new Error("Groq provider is currently disabled.");
    }

    // Part 3B will add the real Groq API communication.
    // This stub keeps the architecture stable without exposing any API key.
    const requestId = `groq-${Date.now()}`;

    return {
      provider: this.name,
      model: this.defaultModel,
      content: `Groq provider stub response for: ${request.prompt}`,
      requestId,
      metadata: {
        taskType: request.taskType ?? "chat",
        contextSize: request.contextSize ?? 0,
        baseUrl: config.baseUrl,
        providerEnvVar: config.apiKeyEnvVar,
        status: "stubbed-for-part-3b",
      },
    };
  }
}
