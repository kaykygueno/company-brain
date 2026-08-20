import { getProviderConfig } from "@/ai/providers/config";
import type { LLMRequest, LLMResponse, RouterDecisionContext } from "@/ai/providers/types";
import { callGroqProvider } from "@/ai/providers/groq";

export function buildRoutingContext(request: LLMRequest): RouterDecisionContext {
  return {
    taskType: request.taskType ?? "chat",
    complexity: request.complexity ?? "medium",
    contextSize: request.contextSize ?? 0,
    speedPriority: request.speedPriority ?? false,
    costPriority: request.costPriority ?? false,
    modelAvailability: ["groq"],
  };
}

export function routeRequest(request: LLMRequest): string {
  const context = buildRoutingContext(request);

  // Future routing logic may use task type, complexity, context size,
  // speed requirements, cost constraints, and model availability.
  // This placeholder intentionally keeps the decision simple until that logic exists.
  const providerConfig = getProviderConfig("groq");

  if (!providerConfig.enabled) {
    throw new Error("Groq provider is not available for routing.");
  }

  return providerConfig.name;
}

export async function processLLMRequest(request: LLMRequest): Promise<LLMResponse> {
  const providerName = routeRequest(request);

  if (providerName === "groq") {
    return callGroqProvider(request);
  }

  throw new Error(`No provider implementation is available for ${providerName}`);
}
