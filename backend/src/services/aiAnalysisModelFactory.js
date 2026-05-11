/**
 * Factory to create the appropriate analysis model based on the provider
 *
 * Handles provider selection and instantiation of the appropriate model
 */

import OpenAIAnalysisModel from "./models/OpenAIAnalysisModel.js";
import AnthropicAnalysisModel from "./models/AnthropicAnalysisModel.js";
import config from "../config/index.js";

class AnalysisModelFactory {
  static createModel(provider, modelName) {
    const normalizedProvider =
      provider?.toLowerCase() || config.providers.default;

    global.logger.debug("Creating analysis model", {
      provider: normalizedProvider,
      model: modelName,
    });

    // Check if the provider is valid
    if (!config.providers.available.includes(normalizedProvider)) {
      global.logger.warn(`Invalid provider: ${provider}`, {
        availableProviders: config.providers.available,
        usingDefault: config.providers.default,
      });
    }

    switch (normalizedProvider) {
      case "anthropic":
        return new AnthropicAnalysisModel();
      case "openai":
        return new OpenAIAnalysisModel();
      default:
        global.logger.warn(`Unsupported provider: ${provider}, using default`, {
          defaultProvider: config.providers.default,
        });
        if (config.providers.default === "anthropic") {
          return new AnthropicAnalysisModel();
        }
        return new OpenAIAnalysisModel();
    }
  }

  // Helper method to get available providers
  static getAvailableProviders() {
    return config.providers.available;
  }

  // Helper method to get available models for a provider
  static getAvailableModels(provider) {
    const normalizedProvider =
      provider?.toLowerCase() || config.providers.default;

    switch (normalizedProvider) {
      case "anthropic":
        return config.anthropic.models.available;
      case "openai":
      default:
        return config.openai.models.available;
    }
  }
}

export { AnalysisModelFactory };
