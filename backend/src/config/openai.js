// OpenAI provider configuration

const openaiConfig = {
  // API configuration
  api: {
    key: process.env.OPENAI_API_KEY || "",
    baseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
    organization: process.env.OPENAI_ORGANIZATION || "",
  },

  // Available models
  models: {
    available: [
      "o4-mini",
      "o3", 
      "o3-mini",
      "o1-preview", 
      "o1-mini", 
      "gpt-4o", 
      "gpt-4-turbo", 
      "gpt-4", 
      "gpt-3.5-turbo"
    ],
    default: "gpt-4o",

    // UI display names for models
    displayNames: {
      "o4-mini": "o4-mini (Latest Reasoning) 🧠",
      "o3": "o3 (Advanced Reasoning) 🧠",
      "o3-mini": "o3-mini (Reasoning) 🧠",
      "o1-preview": "o1-preview (Reasoning) 🧠",
      "o1-mini": "o1-mini (Reasoning) 🧠",
      "gpt-4o": "GPT-4o",
      "gpt-4-turbo": "GPT-4 Turbo",
      "gpt-4": "GPT-4",
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
    },
  },

  // Default configuration options
  defaults: {
    temperature: 0.7,
    maxTokens: 4096,
  },

  // Reasoning capabilities for models
  reasoningCapabilities: {
    "o4-mini": {
      thinking: true,
      streamingThinking: false,
      thinkingBudget: { min: 1000, max: 50000, suggested: 4000 },
    },
    "o3": {
      thinking: true,
      streamingThinking: false,
      thinkingBudget: { min: 1000, max: 100000, suggested: 10000 },
    },
    "o3-mini": {
      thinking: true,
      streamingThinking: false,
      thinkingBudget: { min: 1000, max: 50000, suggested: 4000 },
    },
    "o1-preview": {
      thinking: true,
      streamingThinking: false,
      thinkingBudget: { min: 25000, max: 25000, suggested: 25000 },
    },
    "o1-mini": {
      thinking: true,
      streamingThinking: false,
      thinkingBudget: { min: 25000, max: 25000, suggested: 25000 },
    },
    // Other OpenAI models don't support reasoning
  },
};

export default openaiConfig;
