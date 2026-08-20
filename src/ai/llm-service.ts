import { LLMRouter } from "@/ai/llm-router";
import type { LLMRequest, LLMResponse } from "@/ai/types";

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
    return this.router.route(request);
  }
}

export const llmService = new LLMService();
