import type { ProviderConfig, ProviderName } from "@/ai/types";

export const providerRegistry: Record<ProviderName, ProviderConfig> = {
  groq: {
    name: "groq",
    displayName: "Groq",
    enabled: true,
    apiKeyEnvVar: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "openai/gpt-oss-20b",
    supportedTasks: ["chat", "analysis", "summary", "classification", "other"],
    notes: [
      "Default provider for the first version.",
      "Future routing may consider task type, complexity, context size, speed, cost, and model availability.",
    ],
  },
};

export function getProviderConfig(name: ProviderName): ProviderConfig {
  const config = providerRegistry[name];

  if (!config) {
    throw new Error(`No provider config found for: ${String(name)}`);
  }

  return {
    ...config,
    enabled: config.enabled,
    defaultModel: process.env.GROQ_MODEL || config.defaultModel,
  };
}
