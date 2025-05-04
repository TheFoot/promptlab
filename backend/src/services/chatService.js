import {OpenAI} from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Base class for all chat models
class ChatModelBase {
  constructor(config = {}) {
    this.config = config;
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
  constructor(config = {}) {
    super(config);
    
    // Check for API key
    if (!process.env.OPENAI_API_KEY) {
      global.logger.warn('OPENAI_API_KEY environment variable is not set', {
        note: 'Chat features will not work without a valid API key',
      });
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...config,
    });
  }

  async chat(messages, options = {}) {
    const model = options.model || 'gpt-3.5-turbo';
    
    try {
      global.logger.debug('Sending request to OpenAI API', {
        model,
        temperature: options.temperature,
        messageCount: messages.length,
      });
      
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
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
        model: options.model || 'gpt-3.5-turbo',
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async streamChat(messages, onChunk, options = {}) {
    const model = options.model || 'gpt-3.5-turbo';
    
    try {
      global.logger.debug('Starting streaming request to OpenAI API', {
        model,
        temperature: options.temperature,
        messageCount: messages.length,
      });
      
      const stream = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
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

      return {message: responseText};
    } catch (error) {
      global.logger.error('OpenAI API streaming request failed', {
        error: error.message,
        stack: error.stack,
        model: options.model || 'gpt-3.5-turbo',
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }
}

// Anthropic Claude model implementation
class AnthropicModel extends ChatModelBase {
  constructor(config = {}) {
    super(config);
    
    // Check for API key
    if (!process.env.ANTHROPIC_API_KEY) {
      global.logger.warn('ANTHROPIC_API_KEY environment variable is not set', {
        note: 'Claude chat features will not work without a valid API key',
      });
    }
    
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      ...config,
    });
  }

  // Convert OpenAI format messages to Anthropic format
  _convertMessages(messages) {
    let systemMessage = '';
    const convertedMessages = [];
    
    // Extract system message if present
    messages.forEach(message => {
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
    const model = options.model || 'claude-3-7-sonnet-latest';
    
    try {
      const { systemMessage, messages: convertedMessages } = this._convertMessages(messages);
      
      global.logger.debug('Sending request to Anthropic API', {
        model,
        temperature: options.temperature,
        messageCount: messages.length,
      });
      
      const response = await this.client.messages.create({
        model,
        system: systemMessage,
        messages: convertedMessages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.max_tokens || 4096,
      });
      
      global.logger.debug('Received response from Anthropic API', {
        model,
        usage: response.usage,
      });

      return {
        message: response.content[0].text,
        usage: response.usage,
      };
    } catch (error) {
      global.logger.error('Anthropic API request failed', {
        error: error.message,
        stack: error.stack,
        model: options.model || 'claude-3-7-sonnet-latest',
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }

  async streamChat(messages, onChunk, options = {}) {
    const model = options.model || 'claude-3-7-sonnet-latest';
    
    try {
      const { systemMessage, messages: convertedMessages } = this._convertMessages(messages);
      
      global.logger.debug('Starting streaming request to Anthropic API', {
        model,
        temperature: options.temperature,
        messageCount: messages.length,
      });
      
      const stream = await this.client.messages.create({
        model,
        system: systemMessage,
        messages: convertedMessages,
        temperature: options.temperature !== undefined ? options.temperature : 0.7,
        max_tokens: options.max_tokens || 4096,
        stream: true,
      });

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

      return {message: responseText};
    } catch (error) {
      global.logger.error('Anthropic API streaming request failed', {
        error: error.message,
        stack: error.stack,
        model: options.model || 'claude-3-7-sonnet-latest',
        status: error.status,
        type: error.type,
      });
      throw error;
    }
  }
}

// Factory to create the appropriate model based on the provider
class ChatModelFactory {
  static createModel(provider, config = {}) {
    const normalizedProvider = provider?.toLowerCase() || 'openai';
    
    global.logger.debug('Creating chat model', {
      provider: normalizedProvider,
      config: Object.keys(config),
    });
    
    switch (normalizedProvider) {
      case 'anthropic':
        return new AnthropicModel(config);
      case 'openai':
      default:
        return new OpenAIModel(config);
    }
  }
}

export default ChatModelFactory;