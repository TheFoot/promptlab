// Central configuration for available providers

const providers = {
  // List of available AI providers
  available: ["openai", "anthropic"],

  // Default provider to use if none specified
  default: "anthropic",

  // Configuration for provider selection UI
  ui: {
    // Display names for providers in UI dropdowns
    displayNames: {
      openai: "OpenAI",
      anthropic: "Anthropic",
    },
  },
};

export default providers;
