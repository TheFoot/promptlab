/**
 * OpenAI analysis model implementation
 *
 * Handles API calls to OpenAI for prompt analysis and content generation
 */

import { OpenAI } from "openai";
import AnalysisModelBase from "./AnalysisModelBase.js";
import config from "../../config/index.js";

class OpenAIAnalysisModel extends AnalysisModelBase {
  constructor(providerConfig = {}) {
    super(providerConfig);

    const openaiConfig = config.openai;

    // Check for API key
    if (!openaiConfig.api.key) {
      global.logger.warn("OPENAI_API_KEY environment variable is not set", {
        note: "AI analysis features will not work without a valid API key",
      });
    }

    this.client = new OpenAI({
      apiKey: openaiConfig.api.key,
      baseURL: openaiConfig.api.baseUrl,
      organization: openaiConfig.api.organization || undefined,
      ...providerConfig,
    });

    this.defaultModel = openaiConfig.models.default;
    this.defaults = openaiConfig.defaults;
  }

  async generateAnalysis(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;
    const includeAlternatives = options.includeAlternatives !== false;

    try {
      global.logger.debug("Sending analysis request to OpenAI API", {
        model,
        temperature,
        messageCount: messages.length,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        response_format: { type: "json_object" },
      });

      global.logger.debug("Received analysis response from OpenAI API", {
        model,
        tokens: response.usage,
        responseChoices: response.choices.length,
      });

      // Parse JSON response
      let analysisResult;
      try {
        analysisResult = JSON.parse(response.choices[0].message.content);
      } catch (parseError) {
        global.logger.error("Failed to parse OpenAI JSON response", {
          error: parseError.message,
          content: response.choices[0].message.content,
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
      global.logger.error("OpenAI API analysis request failed", {
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

    try {
      global.logger.debug("Sending content generation request to OpenAI API", {
        model,
        temperature,
        messageCount: messages.length,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
      });

      global.logger.debug(
        "Received content generation response from OpenAI API",
        {
          model,
          tokens: response.usage,
          responseChoices: response.choices.length,
        },
      );

      return response.choices[0].message.content;
    } catch (error) {
      global.logger.error("OpenAI API content generation request failed", {
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

export default OpenAIAnalysisModel;
