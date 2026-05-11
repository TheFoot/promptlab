import ChatModelFactory from './chatService.js';
import AgentFactory from './agents/AgentFactory.js';

/**
 * Service for handling agent-based chat interactions
 * Bridges agents with AI models and handles the complete chat flow
 */
class AgentChatService {
  /**
   * Process a chat request using an agent
   * @param {Object} params - Chat parameters
   * @param {Array} params.messages - Message history
   * @param {string} params.agentType - Type of agent to use
   * @param {string} params.provider - AI provider (openai, anthropic, etc.)
   * @param {string} params.model - AI model name
   * @param {number} params.temperature - Model temperature
   * @param {string} params.promptContent - User's prompt content (for context)
   * @param {string} params.promptTitle - User's prompt title (for context)
   * @param {Object} params.options - Additional options
   * @returns {Object} - Chat response
   */
  static async processChat(params) {
    const {
      messages = [],
      agentType = 'chat',
      provider = 'openai',
      model,
      temperature,
      promptContent,
      promptTitle,
      options = {},
    } = params;

    try {
      // Create agent instance
      const agent = AgentFactory.createAgent(agentType);

      // Build context for agent
      const context = {
        promptContent,
        promptTitle,
        messages,
        provider,
        model,
        temperature,
        ...options,
      };

      // Validate context
      if (!agent.validateContext(context)) {
        throw new Error(`Invalid context for ${agentType} agent`);
      }

      // Build system prompt using agent
      const systemPrompt = agent.buildSystemPrompt(context);

      // Preprocess messages using agent
      const processedMessages = agent.preprocessMessages(messages, context);

      // Create final message array with system prompt
      const finalMessages = [
        { role: 'system', content: systemPrompt },
        ...processedMessages,
      ];

      global.logger.debug('Agent chat request', {
        agentType,
        provider,
        model,
        messageCount: finalMessages.length,
        hasPromptContent: !!promptContent,
        systemPromptLength: systemPrompt.length,
      });

      // Get AI model and send request
      const chatModel = ChatModelFactory.createModel(provider);
      const response = await chatModel.chat(finalMessages, {
        model,
        temperature,
        ...options,
      });

      // Postprocess response using agent
      const finalResponse = agent.postprocessResponse(response.message, context);

      global.logger.info('Agent chat completed', {
        agentType,
        provider,
        model,
        responseLength: finalResponse.length,
        tokens: response.usage?.total_tokens,
      });

      return {
        message: finalResponse,
        usage: response.usage,
        agentType,
        agentMetadata: agent.getMetadata(),
      };
    } catch (error) {
      global.logger.error('Agent chat failed', {
        error: error.message,
        stack: error.stack,
        agentType,
        provider,
        model,
        messageCount: messages.length,
      });
      throw error;
    }
  }

  /**
   * Process a streaming chat request using an agent
   * @param {Object} params - Chat parameters (same as processChat)
   * @param {Object|Function} callbacks - Callback functions or legacy onChunk function
   * @returns {Object} - Chat response
   */
  static async processStreamingChat(params, callbacks) {
    const {
      messages = [],
      agentType = 'chat',
      provider = 'openai',
      model,
      temperature,
      promptContent,
      promptTitle,
      options = {},
    } = params;

    try {
      // Create agent instance
      const agent = AgentFactory.createAgent(agentType);

      // Build context for agent
      const context = {
        promptContent,
        promptTitle,
        messages,
        provider,
        model,
        temperature,
        ...options,
      };

      // Validate context
      if (!agent.validateContext(context)) {
        throw new Error(`Invalid context for ${agentType} agent`);
      }

      // Build system prompt using agent
      const systemPrompt = agent.buildSystemPrompt(context);

      // Preprocess messages using agent
      const processedMessages = agent.preprocessMessages(messages, context);

      // Create final message array with system prompt
      const finalMessages = [
        { role: 'system', content: systemPrompt },
        ...processedMessages,
      ];

      global.logger.debug('Agent streaming chat request', {
        agentType,
        provider,
        model,
        messageCount: finalMessages.length,
        hasPromptContent: !!promptContent,
        systemPromptLength: systemPrompt.length,
      });

      // Get AI model and send streaming request
      const chatModel = ChatModelFactory.createModel(provider);
      
      // Handle legacy callback format or new structured callbacks
      let streamingCallbacks;
      if (typeof callbacks === 'function') {
        // Legacy format - convert to new format
        streamingCallbacks = {
          onResponseChunk: callbacks,
          onThinkingStart: () => {},
          onThinkingChunk: () => {},
          onThinkingEnd: () => {},
          onResponseStart: () => {},
          onResponseEnd: () => {},
        };
      } else {
        streamingCallbacks = {
          onThinkingStart: callbacks.onThinkingStart || (() => {}),
          onThinkingChunk: callbacks.onThinkingChunk || (() => {}),
          onThinkingEnd: callbacks.onThinkingEnd || (() => {}),
          onResponseStart: callbacks.onResponseStart || (() => {}),
          onResponseChunk: callbacks.onResponseChunk || callbacks.onChunk || (() => {}),
          onResponseEnd: callbacks.onResponseEnd || (() => {}),
        };
      }

      const response = await chatModel.streamChat(
        finalMessages,
        streamingCallbacks,
        {
          model,
          temperature,
          ...options,
        }
      );

      // Postprocess final response using agent
      const finalResponse = agent.postprocessResponse(response.message, context);

      global.logger.info('Agent streaming chat completed', {
        agentType,
        provider,
        model,
        responseLength: finalResponse.length,
      });

      return {
        message: finalResponse,
        usage: response.usage,
        agentType,
        agentMetadata: agent.getMetadata(),
      };
    } catch (error) {
      global.logger.error('Agent streaming chat failed', {
        error: error.message,
        stack: error.stack,
        agentType,
        provider,
        model,
        messageCount: messages.length,
      });
      throw error;
    }
  }

  /**
   * Get available agent types
   * @returns {Array<string>} - Array of available agent types
   */
  static getAvailableAgentTypes() {
    return AgentFactory.getAvailableTypes();
  }

  /**
   * Get metadata for all agents
   * @returns {Array<Object>} - Array of agent metadata
   */
  static getAllAgentMetadata() {
    return AgentFactory.getAllAgentMetadata();
  }

  /**
   * Get metadata for a specific agent
   * @param {string} agentType - Agent type
   * @returns {Object|null} - Agent metadata or null
   */
  static getAgentMetadata(agentType) {
    return AgentFactory.getAgentMetadata(agentType);
  }
}

export default AgentChatService;