import { LLMRouter } from "@/ai/llm-router";
import type { LLMRequest, LLMResponse } from "@/ai/types";

export const MAX_LLM_PROMPT_LENGTH = 4000;

export class LLMRequestValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LLMRequestValidationError";
  }
}

export class LLMProviderUnavailableError extends Error {
  constructor(message = "Company Brain is temporarily unavailable. Please try again in a moment.") {
    super(message);
    this.name = "LLMProviderUnavailableError";
  }
}

/**
 * Normalizes an error raised anywhere in the AI layer (router, provider, network) into either
 * an existing LLM error type or a generic fallback, so every caller reports failures consistently.
 */
export function classifyLLMError(error: unknown, fallbackMessage = "Failed to reach Company Brain."): Error {
  if (error instanceof LLMRequestValidationError || error instanceof LLMProviderUnavailableError) {
    return error;
  }

  const message = error instanceof Error ? error.message.toLowerCase() : "";
  const isProviderIssue = [
    "missing groq_api_key",
    "provider is disabled",
    "no provider",
    "api key",
    "rate limit",
    "authentication",
    "invalid api key",
    "fetch failed",
    "timed out",
    "network",
    "unavailable",
  ].some((fragment) => message.includes(fragment));

  return isProviderIssue ? new LLMProviderUnavailableError() : new Error(fallbackMessage);
}

/**
 * LLM Service
 *
 * This is the main application-facing AI service layer.
 * The rest of the application should depend on this service instead of calling a provider directly.
 *
 * Architecture:
 * Frontend
 *   ↓
 * Backend
 *   ↓
 * LLM Service
 *   ↓
 * LLM Router
 *   ↓
 * Groq Provider
 *   ↓
 * Groq API  (Part 3B)
 */
export class LLMService {
  constructor(private readonly router: LLMRouter = new LLMRouter()) {}

  async ask(request: LLMRequest): Promise<LLMResponse> {
    const prompt = request.prompt.trim();

    if (!prompt) {
      throw new LLMRequestValidationError("Message is required.");
    }

    if (prompt.length > MAX_LLM_PROMPT_LENGTH) {
      throw new LLMRequestValidationError(
        `Message exceeds the maximum allowed length of ${MAX_LLM_PROMPT_LENGTH} characters.`,
      );
    }

    try {
      return await this.router.route({ ...request, prompt });
    } catch (error) {
      throw classifyLLMError(error);
    }
  }
}

export const llmService = new LLMService();
