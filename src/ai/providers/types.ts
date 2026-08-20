export type LLMTaskType =
  | "chat"
  | "analysis"
  | "summarization"
  | "classification"
  | "other";

export type LLMRequest = {
  prompt: string;
  taskType?: LLMTaskType;
  contextSize?: number;
  complexity?: "low" | "medium" | "high";
  speedPriority?: boolean;
  costPriority?: boolean;
  conversationId?: string;
  metadata?: Record<string, unknown>;
};

export type LLMResponse = {
  provider: string;
  model: string;
  content: string;
  requestId?: string;
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

export type ProviderRegistry = Record<ProviderName, ProviderConfig>;

export type RouterDecisionContext = {
  taskType?: LLMTaskType;
  complexity?: LLMRequest["complexity"];
  contextSize?: number;
  speedPriority?: boolean;
  costPriority?: boolean;
  modelAvailability?: string[];
  selectedProvider?: ProviderName;
};
