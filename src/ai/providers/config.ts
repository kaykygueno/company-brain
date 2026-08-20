import type { ProviderConfig, ProviderRegistry } from "./types";

export const providerRegistry: ProviderRegistry = {
  groq: {
    name: "groq",
    displayName: "Groq",
    enabled: true,
    apiKeyEnvVar: "GROQ_API_KEY",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.1-8b-instant",
    supportedTasks: ["chat", "summarization", "analysis", "classification", "other"],
    notes: [
      "Default provider for the initial version.",
      "Future routing may consider task type, complexity, context size, speed, cost, and model availability.",
    ],
  },
};

export function getProviderConfig(name: keyof typeof providerRegistry): ProviderConfig {
  const config = providerRegistry[name];

  if (!config) {
    throw new Error(`Provider configuration not found for ${String(name)}`);
  }

  return config;
}
