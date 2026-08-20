import type { LLMRequest, LLMResponse, LLMTaskType } from "@/ai/types";

export interface LLMProvider {
  readonly name: string;
  readonly displayName: string;
  readonly defaultModel: string;

  supports(taskType: LLMTaskType): boolean;
  generate(request: LLMRequest): Promise<LLMResponse>;
}

export abstract class BaseLLMProvider implements LLMProvider {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly defaultModel: string;

  abstract supports(taskType: LLMTaskType): boolean;
  abstract generate(request: LLMRequest): Promise<LLMResponse>;
}
