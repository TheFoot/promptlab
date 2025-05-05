import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../config/index.js';

// Base class for all chat models
class ChatModelBase {
  constructor(providerConfig = {}) {
    this.providerConfig = providerConfig;
  }

  async chat(messages, options = {}) {
    throw new Error('Not implemented');
  }

  async streamChat(messages, onChunk, options = {}) {
    throw new Error('Not implemented');
  }
}

// OpenAI model implementation
class OpenAIModel extends ChatModelBase {
  constructor(providerConfig = {}) {
    super(providerConfig);

    const openaiConfig = config.openai;

    // Check for API key
    if (!openaiConfig.api.key) {
      global.logger.warn('OPENAI_API_KEY environment variable is not set', {
        note: 'Chat features will not work without a valid API key',
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

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined ?
        options.temperature :
        this.defaults.temperature;

    try {
      global.logger.debug('Sending request to OpenAI API', {
        model,
        temperature,
        messageCount: messages.length,
      });

      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
      });

      global.logger.debug('Received response from OpenAI API', {
        model,
        tokens: response.usage,
        responseChoices: response.choices.length,
      });

      return {
        message: response.choices[0].message.content,
        usage: response.usage,
      };
    } catch (error) {
      global.logger.error('OpenAI API request failed', {
        error: error.message,
        stack: error.stack,
        model,
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async streamChat(messages, onChunk, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined ?
        options.temperature :
        this.defaults.temperature;

    try {
      global.logger.debug('Starting streaming request to OpenAI API', {
        model,
        temperature,
        messageCount: messages.length,
      });

      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature,
        stream: true,
      });

      let responseText = '';
      let chunkCount = 0;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          responseText += content;
          onChunk(content);
          chunkCount++;
        }
      }

      global.logger.debug('Completed streaming from OpenAI API', {
        model,
        responseLength: responseText.length,
        chunkCount,
      });

      return { message: responseText };
    } catch (error) {
      global.logger.error('OpenAI API streaming request failed', {
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
      global.logger.warn('ANTHROPIC_API_KEY environment variable is not set', {
        note: 'Claude chat features will not work without a valid API key',
      });
    }

    // Initialize Anthropic client with API key
    this.client = new Anthropic({
      apiKey: anthropicConfig.api.key || process.env.ANTHROPIC_API_KEY,
      // Only add baseURL if it's defined
      ...(anthropicConfig.api.baseUrl ?
        { baseURL: anthropicConfig.api.baseUrl } :
        {}),
      ...providerConfig,
    });

    this.defaultModel = anthropicConfig.models.default;
    this.defaults = anthropicConfig.defaults;
  }

  // Convert OpenAI format messages to Anthropic format
  _convertMessages(messages) {
    let systemMessage = undefined;
    const convertedMessages = [];

    // Extract system message if present
    messages.forEach((message) => {
      if (message.role === 'system') {
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
      options.temperature !== undefined ?
        options.temperature :
        this.defaults.temperature;
    const maxTokens = options.maxTokens || this.defaults.maxTokens;

    try {
      const { systemMessage, messages: convertedMessages } =
        this._convertMessages(messages);

      global.logger.debug('Sending request to Anthropic API', {
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

      global.logger.debug('Received response from Anthropic API', {
        model,
        usage: response.usage,
      });

      // Handle case where content might be undefined or empty
      const contentText = response.content && response.content[0] && response.content[0].text 
        ? response.content[0].text 
        : '';

      return {
        message: contentText,
        usage: response.usage,
      };
    } catch (error) {
      global.logger.error('Anthropic API request failed', {
        error: error.message,
        stack: error.stack,
        model,
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async streamChat(messages, onChunk, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature =
      options.temperature !== undefined ?
        options.temperature :
        this.defaults.temperature;
    const maxTokens = options.maxTokens || this.defaults.maxTokens;

    try {
      const { systemMessage, messages: convertedMessages } =
        this._convertMessages(messages);

      global.logger.debug('Starting streaming request to Anthropic API', {
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
        stream: true,
      };

      // Only add system parameter if it's not empty
      if (systemMessage) {
        requestParams.system = systemMessage;
      }

      const stream = await this.client.messages.create(requestParams);

      let responseText = '';
      let chunkCount = 0;

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.text) {
          responseText += chunk.delta.text;
          onChunk(chunk.delta.text);
          chunkCount++;
        }
      }

      global.logger.debug('Completed streaming from Anthropic API', {
        model,
        responseLength: responseText.length,
        chunkCount,
      });

      return { message: responseText };
    } catch (error) {
      global.logger.error('Anthropic API streaming request failed', {
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

    global.logger.debug('Creating chat model', {
      provider: normalizedProvider,
      config: Object.keys(providerConfig),
    });

    switch (normalizedProvider) {
      case 'anthropic':
        return new AnthropicModel(providerConfig);
      case 'openai':
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
      case 'anthropic':
        return config.anthropic.models.available;
      case 'openai':
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
      case 'anthropic':
        return config.anthropic.models.displayNames[model] || model;
      case 'openai':
      default:
        return config.openai.models.displayNames[model] || model;
    }
  }
}

export default ChatModelFactory;
