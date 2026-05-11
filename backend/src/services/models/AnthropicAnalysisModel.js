/**
 * Anthropic analysis model implementation
 *
 * Handles API calls to Anthropic Claude for prompt analysis and content generation
 */

import Anthropic from "@anthropic-ai/sdk";
import AnalysisModelBase from "./AnalysisModelBase.js";
import config from "../../config/index.js";

class AnthropicAnalysisModel extends AnalysisModelBase {
  constructor(providerConfig = {}) {
    super(providerConfig);

    const anthropicConfig = config.anthropic;

    // Check for API key
    if (!anthropicConfig.api.key) {
      global.logger.warn("ANTHROPIC_API_KEY environment variable is not set", {
        note: "Claude analysis features will not work without a valid API key",
      });
    }

    // Initialize Anthropic client with API key
    this.client = new Anthropic({
      apiKey: anthropicConfig.api.key || process.env.ANTHROPIC_API_KEY,
      // Only add baseURL if it's defined
      ...(anthropicConfig.api.baseUrl
        ? { baseURL: anthropicConfig.api.baseUrl }
        : {}),
      ...providerConfig,
    });

    this.defaultModel = anthropicConfig.models.default;
    this.defaults = anthropicConfig.defaults;
  }

  // Convert OpenAI format messages to Anthropic format
  _convertMessages(messages) {
    let systemMessage;
    const convertedMessages = [];

    // Extract system message if present
    messages.forEach((message) => {
      if (message.role === "system") {
        systemMessage = message.content;
      } else {
        // Map 'user' and 'assistant' roles directly (they use the same names)
        convertedMessages.push({
          role: message.role,
          content: message.content,
        });
      }
    });

    return { systemMessage, messages: convertedMessages };
  }

  async generateAnalysis(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;
    const maxTokens = options.maxTokens || this.defaults.maxTokens;
    const includeAlternatives = options.includeAlternatives !== false;

    try {
      const { systemMessage, messages: convertedMessages } =
        this._convertMessages(messages);

      global.logger.debug("Sending analysis request to Anthropic API", {
        model,
        temperature,
        messageCount: messages.length,
        apiKeyPresent: !!this.client.apiKey,
      });

      // Prepare request parameters
      const requestParams = {
        model,
        messages: convertedMessages,
        temperature,
        max_tokens: maxTokens,
        format: "json",
      };

      // Only add system parameter if it's not empty
      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      const response = await this.client.messages.create(requestParams);

      global.logger.debug("Received analysis response from Anthropic API", {
        model,
        usage: response.usage,
      });

      // Handle case where content might be undefined or empty
      const contentText = response.content?.[0]?.text || "{}";

      // Parse JSON response
      let analysisResult;
      try {
        analysisResult = JSON.parse(contentText);
      } catch (parseError) {
        global.logger.error("Failed to parse Anthropic JSON response", {
          error: parseError.message,
          content: contentText,
        });
        throw new Error("Invalid JSON response from AI model");
      }

      // If includeAlternatives is false, remove alternatives from suggestions
      if (!includeAlternatives && analysisResult.suggestions) {
        analysisResult.suggestions = analysisResult.suggestions.map(
          (suggestion) => {
            // Create a new object without the alternatives key
            const { alternatives, ...rest } = suggestion; // eslint-disable-line no-unused-vars
            return rest;
          },
        );
      }

      return {
        ...analysisResult,
        usage: response.usage,
      };
    } catch (error) {
      global.logger.error("Anthropic API analysis request failed", {
        error: error.message,
        stack: error.stack,
        model,
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async generateContent(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;
    const maxTokens = options.maxTokens || this.defaults.maxTokens;

    try {
      const { systemMessage, messages: convertedMessages } =
        this._convertMessages(messages);

      global.logger.debug(
        "Sending content generation request to Anthropic API",
        {
          model,
          temperature,
          messageCount: messages.length,
          apiKeyPresent: !!this.client.apiKey,
        },
      );

      // Prepare request parameters
      const requestParams = {
        model,
        messages: convertedMessages,
        temperature,
        max_tokens: maxTokens,
      };

      // Only add system parameter if it's not empty
      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      const response = await this.client.messages.create(requestParams);

      global.logger.debug(
        "Received content generation response from Anthropic API",
        {
          model,
          usage: response.usage,
        },
      );

      // Handle case where content might be undefined or empty
      const contentText = response.content?.[0]?.text || "";

      return contentText;
    } catch (error) {
      global.logger.error("Anthropic API content generation request failed", {
        error: error.message,
        stack: error.stack,
        model,
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }
}

export default AnthropicAnalysisModel;
