// Service to fetch and manage model configurations
import alertService from "./alertService.js";

class ModelConfigService {
  constructor() {
    this.config = {
      providers: {
        available: [],
        default: "openai",
        displayNames: {},
      },
      models: {},
    };
    this.isLoaded = false;
    this.loadPromise = null;
  }

  async loadConfig() {
    // Only load config once or return existing promise if already loading
    if (this.loadPromise !== null) {
      return this.loadPromise;
    }

    // Create new promise for loading config
    this.loadPromise = new Promise((resolve) => {
      // Use an immediately invoked async function inside
      (async () => {
        try {
          const response = await fetch("/api/chat/config");

          if (!response.ok) {
            throw new Error(
              `Failed to load model configuration: ${response.status} ${response.statusText}`,
            );
          }

          this.config = await response.json();
          this.isLoaded = true;
          console.log("Model configuration loaded:", this.config);
          resolve(this.config);
        } catch (error) {
          console.error("Error loading model configuration:", error);
          alertService.showAlert(
            "Failed to load model configuration. Using defaults.",
            "error",
            5000,
          );
          // Set up fallback config
          this.setupFallbackConfig();
          this.isLoaded = true;
          resolve(this.config);
        }
      })();
    });

    return this.loadPromise;
  }

  setupFallbackConfig() {
    // Fallback configuration if API request fails
    this.config = {
      providers: {
        available: ["openai", "anthropic"],
        default: "openai",
        displayNames: {
          openai: "OpenAI",
          anthropic: "Anthropic",
        },
      },
      models: {
        openai: {
          available: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"],
          default: "gpt-3.5-turbo",
          displayNames: {
            "gpt-3.5-turbo": "GPT-3.5 Turbo",
            "gpt-4": "GPT-4",
            "gpt-4-turbo": "GPT-4 Turbo",
            "gpt-4o": "GPT-4o",
          },
        },
        anthropic: {
          available: [
            "claude-opus-4-20250514",
            "claude-sonnet-4-20250514",
            "claude-3-7-sonnet-latest",
            "claude-3-5-sonnet-latest",
            "claude-3-5-haiku-latest",
            "claude-3-opus-20240229",
            "claude-3-sonnet-20240229",
            "claude-3-haiku-20240307",
          ],
          default: "claude-sonnet-4-20250514",
          displayNames: {
            "claude-opus-4-20250514": "Claude 4 Opus (Latest)",
            "claude-sonnet-4-20250514": "Claude 4 Sonnet (Latest)",
            "claude-3-7-sonnet-latest": "Claude 3.7 Sonnet",
            "claude-3-5-sonnet-latest": "Claude 3.5 Sonnet",
            "claude-3-5-haiku-latest": "Claude 3.5 Haiku",
            "claude-3-opus-20240229": "Claude 3 Opus",
            "claude-3-sonnet-20240229": "Claude 3 Sonnet",
            "claude-3-haiku-20240307": "Claude 3 Haiku",
          },
        },
      },
    };
  }

  async getConfig() {
    if (!this.isLoaded) {
      await this.loadConfig();
    }
    return this.config;
  }

  async getAvailableProviders() {
    const config = await this.getConfig();
    return config.providers.available;
  }

  async getDefaultProvider() {
    const config = await this.getConfig();
    return config.providers.default;
  }

  async getProviderDisplayName(provider) {
    const config = await this.getConfig();
    return config.providers.displayNames[provider] || provider;
  }

  async getAvailableModels(provider) {
    const config = await this.getConfig();
    return config.models[provider]?.available || [];
  }

  async getDefaultModel(provider) {
    const config = await this.getConfig();
    return config.models[provider]?.default || "";
  }

  async getModelDisplayName(provider, model) {
    const config = await this.getConfig();
    return config.models[provider]?.displayNames[model] || model;
  }
}

// Create and export singleton instance
const modelConfigService = new ModelConfigService();
export default modelConfigService;
