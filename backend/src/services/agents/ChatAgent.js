import AgentBase from './AgentBase.js';

/**
 * Chat Agent - Uses the current prompt as the system prompt
 * This agent allows testing of prompts by using them directly as system instructions
 */
class ChatAgent extends AgentBase {
  constructor(agentConfig = {}) {
    super(agentConfig);
  }

  /**
   * Build system prompt for chat agent
   * Uses the current prompt content as the system prompt directly
   * @param {Object} context - Contains promptContent, messages, etc.
   * @returns {string} - System prompt
   */
  buildSystemPrompt(context = {}) {
    const { promptContent, fallbackPrompt } = context;
    
    // Use the provided prompt content, or fall back to default
    if (promptContent && promptContent.trim()) {
      return promptContent.trim();
    }
    
    // Fallback system prompt
    return fallbackPrompt || "You are a helpful assistant.";
  }

  /**
   * Preprocess messages - no special processing needed for chat agent
   * @param {Array} messages - Message history
   * @param {Object} context - Context object
   * @returns {Array} - Unmodified messages
   */
  preprocessMessages(messages, context = {}) { // eslint-disable-line no-unused-vars
    return messages;
  }

  /**
   * Postprocess response - no special processing needed
   * @param {string} response - AI response
   * @param {Object} context - Context object
   * @returns {string} - Unmodified response
   */
  postprocessResponse(response, context = {}) { // eslint-disable-line no-unused-vars
    return response;
  }

  /**
   * Validate context for chat agent
   * @param {Object} context - Context object
   * @returns {boolean} - Always valid
   */
  validateContext(context = {}) { // eslint-disable-line no-unused-vars
    return true; // Chat agent works with any context
  }

  /**
   * Get chat agent metadata
   * @returns {Object} - Agent metadata
   */
  getMetadata() {
    return {
      type: 'chat',
      name: 'ChatAgent',
      description: 'Tests prompts by using them as system instructions',
      supportedFeatures: ['prompt_testing', 'direct_system_prompt'],
      requiresPrompt: false, // Can work without a prompt
    };
  }
}

export default ChatAgent;