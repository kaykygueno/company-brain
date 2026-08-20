export type LLMTaskType =
  | "chat"
  | "analysis"
  | "summary"
  | "classification"
  | "other";

export type LLMComplexity = "low" | "medium" | "high";

export type LLMRequest = {
  prompt: string;
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
