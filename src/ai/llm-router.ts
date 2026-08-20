import { GroqProvider } from "@/ai/providers/groq-provider";
import { getProviderConfig } from "@/ai/providers/config";
import type { LLMProvider } from "@/ai/providers/provider";
import type { LLMRequest, LLMResponse } from "@/ai/types";

/**
 * LLM Router
 *
 * Current purpose: receive a request and decide which provider should process it.
 * For this first version, the router intentionally selects Groq by default.
 *
 * This is the place where future routing logic may consider:
 * - task type
 * - complexity
 * - context size
 * - speed requirements
 * - cost requirements
 * - model availability
 */
export class LLMRouter {
  constructor(private readonly providers: LLMProvider[] = [new GroqProvider()]) {}

  selectProvider(request: LLMRequest): LLMProvider {
    const taskType = request.taskType ?? "chat";
    const matchingProvider = this.providers.find((provider) => provider.supports(taskType));

    if (!matchingProvider) {
      throw new Error(`No provider is available for task type: ${taskType}`);
    }

    const config = getProviderConfig(matchingProvider.name as "groq");
    if (!config.enabled) {
      throw new Error(`Provider is disabled: ${config.displayName}`);
    }

    return matchingProvider;
  }

  async route(request: LLMRequest): Promise<LLMResponse> {
    const provider = this.selectProvider(request);
    return provider.generate(request);
  }
}
