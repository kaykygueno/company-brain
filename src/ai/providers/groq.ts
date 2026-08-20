import { getProviderConfig } from "./config";
import type { LLMRequest, LLMResponse } from "./types";

export async function callGroqProvider(request: LLMRequest): Promise<LLMResponse> {
  const config = getProviderConfig("groq");

  if (!config.enabled) {
    throw new Error("Groq provider is disabled.");
  }

  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `groq-${Date.now()}`;

  return {
    provider: config.name,
    model: config.defaultModel,
    content: `Groq placeholder response for: ${request.prompt}`,
    requestId,
    metadata: {
      taskType: request.taskType ?? "chat",
      contextSize: request.contextSize ?? 0,
      providerEnvVar: config.apiKeyEnvVar,
      baseUrl: config.baseUrl,
      status: "stubbed-for-future-provider-integration",
    },
  };
}
