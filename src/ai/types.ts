export type LLMTaskType =
  | "chat"
  | "analysis"
  | "summary"
  | "classification"
  | "extraction"
  | "other";

export type LLMComplexity = "low" | "medium" | "high";

export type LLMRequest = {
  prompt: string;
  /** Optional system-role instructions, kept separate from user-provided content. */
  systemPrompt?: string;
  /** Request a specific output shape from providers that support it. Defaults to free-form text. */
  responseFormat?: "text" | "json_object";
  taskType?: LLMTaskType;
  contextSize?: number;
  complexity?: LLMComplexity;
  speedPriority?: boolean;
  costPriority?: boolean;
  metadata?: Record<string, unknown>;
};

export type LLMResponse = {
  provider: string;
  model: string;
  content: string;
  requestId: string;
  metadata?: Record<string, unknown>;
};

export type ProviderName = "groq";

export type ProviderConfig = {
  name: ProviderName;
  displayName: string;
  enabled: boolean;
  apiKeyEnvVar: string;
  baseUrl: string;
  defaultModel: string;
  supportedTasks: LLMTaskType[];
  notes: string[];
};
