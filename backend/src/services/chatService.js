import {OpenAI} from 'openai';

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

// Factory to create the appropriate model based on the provider
class ChatModelFactory {
  static createModel(provider, config = {}) {
    const normalizedProvider = provider?.toLowerCase() || 'openai';
    
    global.logger.debug('Creating chat model', {
      provider: normalizedProvider,
      config: Object.keys(config),
    });
    
    switch (normalizedProvider) {
      case 'openai':
      default:
        return new OpenAIModel(config);
    }
  }
}

export default ChatModelFactory;