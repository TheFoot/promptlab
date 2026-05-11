import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
import config from "../config/index.js";

// Base class for all chat models
class ChatModelBase {
  constructor(providerConfig = {}) {
    this.providerConfig = providerConfig;
  }

  /* eslint-disable no-unused-vars */
  async chat(messages) {
    throw new Error("Not implemented");
  }

  async streamChat(messages, onChunk) {
    throw new Error("Not implemented");
  }
  /* eslint-enable no-unused-vars */

  // Simulate streaming by sending incremental chunks for better UX
  // This is useful for models that don't support native streaming
  async _simulateStreaming(content, onChunk, wordsPerChunk = 3, delayMs = 50) {
    const words = content.split(' ');
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      // Get the next chunk of words
      const chunkWords = words.slice(i, i + wordsPerChunk);
      const chunk = chunkWords.join(' ');
      
      // Add space before chunk if not the first chunk
      const chunkToSend = i > 0 ? ' ' + chunk : chunk;
      
      onChunk(chunkToSend);
      
      // Add small delay to simulate streaming (except for the last chunk)
      if (i + wordsPerChunk < words.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
}

// OpenAI model implementation
class OpenAIModel extends ChatModelBase {
  constructor(providerConfig = {}) {
    super(providerConfig);

    const openaiConfig = config.openai;

    // Check for API key
    if (!openaiConfig.api.key) {
      global.logger.warn("OPENAI_API_KEY environment variable is not set", {
        note: "Chat features will not work without a valid API key",
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
    this.reasoningCapabilities = openaiConfig.reasoningCapabilities || {};
  }

  // Check if a model supports thinking
  _supportsThinking(model) {
    return this.reasoningCapabilities[model]?.thinking || false;
  }

  // Check if a model supports streaming thinking
  _supportsStreamingThinking(model) {
    return this.reasoningCapabilities[model]?.streamingThinking || false;
  }

  // Convert system messages to user messages for models that don't support them (like o1 series)
  _adaptMessagesForModel(messages, model) {
    if (this._supportsThinking(model)) {
      // o1, o3, o4 models don't support system messages, convert them to user messages
      return messages.map(msg => {
        if (msg.role === 'system') {
          return {
            role: 'user',
            content: `System instructions: ${msg.content}`
          };
        }
        return msg;
      });
    }
    return messages;
  }


  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;

    try {
      global.logger.debug("Sending request to OpenAI API", {
        model,
        temperature,
        messageCount: messages.length,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
      });

      global.logger.debug("Received response from OpenAI API", {
        model,
        tokens: response.usage,
        responseChoices: response.choices.length,
      });

      return {
        message: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      global.logger.error("OpenAI API request failed", {
        error: error.message,
        stack: error.stack,
        model,
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async streamChat(messages, callbacks, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;

    try {
      global.logger.debug("Starting streaming request to OpenAI API", {
        model,
        temperature,
        messageCount: messages.length,
        supportsThinking: this._supportsThinking(model),
        supportsStreamingThinking: this._supportsStreamingThinking(model),
      });

      // Handle legacy callback format
      let streamingCallbacks;
      if (typeof callbacks === 'function') {
        streamingCallbacks = { onResponseChunk: callbacks };
      } else {
        streamingCallbacks = callbacks;
      }

      // Handle reasoning models (o1, o3, o4 series) - these don't support streaming
      if (this._supportsThinking(model)) {
        // Show thinking placeholder
        if (streamingCallbacks.onThinkingStart) {
          streamingCallbacks.onThinkingStart();
        }

        // Send placeholder thinking content for OpenAI models (they don't expose actual thinking)
        if (streamingCallbacks.onThinkingChunk) {
          const thinkingPlaceholder = [
            `🤔 ${model} is reasoning through this problem...`,
            "",
            "Note: OpenAI reasoning models perform internal thinking that is not visible",
            "in the API response. The model is analyzing the request, considering",
            "different approaches, and formulating the best response."
          ].join("\n");
          streamingCallbacks.onThinkingChunk(thinkingPlaceholder);
        }

        // Convert system messages to user messages for reasoning models
        const adaptedMessages = this._adaptMessagesForModel(messages, model);

        global.logger.debug("Calling reasoning model with adapted messages", {
          model,
          originalMessageCount: messages.length,
          adaptedMessageCount: adaptedMessages.length,
          hasSystemMessage: messages.some(msg => msg.role === 'system'),
        });

        // For reasoning models, we need to use non-streaming API
        const response = await this.client.chat.completions.create({
          model,
          messages: adaptedMessages,
          // Reasoning models have fixed temperature and other parameters
        });

        // End thinking phase
        if (streamingCallbacks.onThinkingEnd) {
          streamingCallbacks.onThinkingEnd();
        }

        // Start response phase
        if (streamingCallbacks.onResponseStart) {
          streamingCallbacks.onResponseStart();
        }

        // Simulate streaming by chunking the response for better UX
        const content = response.choices[0]?.message?.content || "";
        if (content && streamingCallbacks.onResponseChunk) {
          await this._simulateStreaming(content, streamingCallbacks.onResponseChunk);
        }

        // End response phase
        if (streamingCallbacks.onResponseEnd) {
          streamingCallbacks.onResponseEnd();
        }

        global.logger.debug("Completed reasoning request to OpenAI API", {
          model,
          responseLength: content.length,
        });

        return { message: content };
      }

      // Regular streaming for non-reasoning models
      if (streamingCallbacks.onResponseStart) {
        streamingCallbacks.onResponseStart();
      }

      // For non-reasoning models, messages are used as-is (they support system messages)
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        stream: true,
      });

      let responseText = "";
      let chunkCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          responseText += content;
          if (streamingCallbacks.onResponseChunk) {
            streamingCallbacks.onResponseChunk(content);
          }
          chunkCount++;
        }
      }

      // End response phase
      if (streamingCallbacks.onResponseEnd) {
        streamingCallbacks.onResponseEnd();
      }

      global.logger.debug("Completed streaming from OpenAI API", {
        model,
        responseLength: responseText.length,
        chunkCount,
      });

      return { message: responseText };
    } catch (error) {
      global.logger.error("OpenAI API streaming request failed", {
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

// Anthropic Claude model implementation
class AnthropicModel extends ChatModelBase {
  constructor(providerConfig = {}) {
    super(providerConfig);

    const anthropicConfig = config.anthropic;

    // Check for API key
    if (!anthropicConfig.api.key) {
      global.logger.warn("ANTHROPIC_API_KEY environment variable is not set", {
        note: "Claude chat features will not work without a valid API key",
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
    this.reasoningCapabilities = anthropicConfig.reasoningCapabilities || {};
  }

  // Check if a model supports thinking
  _supportsThinking(model) {
    return this.reasoningCapabilities[model]?.thinking || false;
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

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;
    const maxTokens = options.maxTokens || this.defaults.maxTokens;

    try {
      const { systemMessage, messages: convertedMessages } =
        this._convertMessages(messages);

      global.logger.debug("Sending request to Anthropic API", {
        model,
        temperature,
        messageCount: messages.length,
        apiKeyPresent: !!this.client.apiKey,
      });

      // Prepare request parameters (omitting undefined values)
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

      global.logger.debug("Received response from Anthropic API", {
        model,
        usage: response.usage,
      });

      // Handle case where content might be undefined or empty
      const contentText = response.content?.[0]?.text || "";

      return {
        message: contentText,
        usage: response.usage,
      };
    } catch (error) {
      global.logger.error("Anthropic API request failed", {
        error: error.message,
        stack: error.stack,
        model,
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async streamChat(messages, callbacks, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined
        ? options.temperature
        : this.defaults.temperature;
    const maxTokens = options.maxTokens || this.defaults.maxTokens;

    try {
      const { systemMessage, messages: convertedMessages } =
        this._convertMessages(messages);

      global.logger.debug("Starting streaming request to Anthropic API", {
        model,
        temperature,
        messageCount: messages.length,
        apiKeyPresent: !!this.client.apiKey,
        supportsThinking: this._supportsThinking(model),
      });

      // Handle legacy callback format
      let streamingCallbacks;
      if (typeof callbacks === 'function') {
        streamingCallbacks = { onResponseChunk: callbacks };
      } else {
        streamingCallbacks = callbacks;
      }

      // Prepare request parameters (omitting undefined values)
      const requestParams = {
        model,
        messages: convertedMessages,
        max_tokens: maxTokens,
        stream: true,
      };

      // Only add system parameter if it's not empty
      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      // Enable thinking for reasoning-capable models
      if (this._supportsThinking(model)) {
        const thinkingBudget = options.thinkingBudget || 
          this.reasoningCapabilities[model]?.thinkingBudget?.suggested || 4000;
          
        requestParams.thinking = {
          type: "enabled",
          budget_tokens: thinkingBudget
        };
        
        // Temperature must be 1 when thinking is enabled
        requestParams.temperature = 1;
        
        global.logger.debug("Enabled thinking for Anthropic model", {
          model,
          thinkingBudget,
          temperature: 1,
        });
      } else {
        // Use normal temperature for non-thinking models
        requestParams.temperature = temperature;
      }

      const stream = await this.client.messages.create(requestParams);

      let responseText = "";
      let chunkCount = 0;
      let isThinking = false;
      let hasStartedResponse = false;

      for await (const chunk of stream) {
        // Handle thinking blocks
        if (chunk.type === "content_block_start" && chunk.content_block?.type === "thinking") {
          isThinking = true;
          if (streamingCallbacks.onThinkingStart) {
            streamingCallbacks.onThinkingStart();
          }
        }
        // Handle text response blocks
        else if (chunk.type === "content_block_start" && chunk.content_block?.type === "text") {
          if (isThinking && streamingCallbacks.onThinkingEnd) {
            streamingCallbacks.onThinkingEnd();
            isThinking = false;
          }
          if (!hasStartedResponse && streamingCallbacks.onResponseStart) {
            streamingCallbacks.onResponseStart();
            hasStartedResponse = true;
          }
        }
        // Handle thinking content deltas
        else if (chunk.type === "content_block_delta" && chunk.delta?.type === "thinking_delta") {
          if (streamingCallbacks.onThinkingChunk && chunk.delta.thinking) {
            streamingCallbacks.onThinkingChunk(chunk.delta.thinking);
          }
        }
        // Handle text content deltas (existing logic)
        else if (chunk.type === "content_block_delta" && chunk.delta?.text) {
          responseText += chunk.delta.text;
          if (streamingCallbacks.onResponseChunk) {
            streamingCallbacks.onResponseChunk(chunk.delta.text);
          }
          chunkCount++;
        }
        // Handle block end
        else if (chunk.type === "content_block_stop") {
          if (isThinking && streamingCallbacks.onThinkingEnd) {
            streamingCallbacks.onThinkingEnd();
            isThinking = false;
          }
        }
      }

      // Ensure response end is called
      if (streamingCallbacks.onResponseEnd) {
        streamingCallbacks.onResponseEnd();
      }

      global.logger.debug("Completed streaming from Anthropic API", {
        model,
        responseLength: responseText.length,
        chunkCount,
      });

      return { message: responseText };
    } catch (error) {
      global.logger.error("Anthropic API streaming request failed", {
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

// Factory to create the appropriate model based on the provider
class ChatModelFactory {
  static createModel(provider, providerConfig = {}) {
    const normalizedProvider =
      provider?.toLowerCase() || config.providers.default;

    global.logger.debug("Creating chat model", {
      provider: normalizedProvider,
      config: Object.keys(providerConfig),
    });

    switch (normalizedProvider) {
      case "anthropic":
        return new AnthropicModel(providerConfig);
      case "openai":
      default:
        return new OpenAIModel(providerConfig);
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

  // Helper to get provider display name
  static getProviderDisplayName(provider) {
    const normalizedProvider = provider?.toLowerCase();
    return (
      config.providers.ui.displayNames[normalizedProvider] || normalizedProvider
    );
  }

  // Helper to get model display name
  static getModelDisplayName(provider, model) {
    const normalizedProvider =
      provider?.toLowerCase() || config.providers.default;

    switch (normalizedProvider) {
      case "anthropic":
        return config.anthropic.models.displayNames[model] || model;
      case "openai":
      default:
        return config.openai.models.displayNames[model] || model;
    }
  }
}

export default ChatModelFactory;
