/**
 * Base class for all chat agents
 * Provides common functionality and abstract methods for different agent types
 */
class AgentBase {
  constructor(agentConfig = {}) {
    this.agentConfig = agentConfig;
    this.type = this.constructor.name.toLowerCase().replace('agent', '');
  }

  /**
   * Abstract method to build system prompt for the agent
   * @param {Object} context - Context object containing prompt, messages, etc.
   * @returns {string} - The system prompt to use
   */
  buildSystemPrompt(context = {}) { // eslint-disable-line no-unused-vars
    throw new Error(`buildSystemPrompt must be implemented by ${this.constructor.name}`);
  }

  /**
   * Abstract method to preprocess messages before sending to AI
   * @param {Array} messages - Array of message objects
   * @param {Object} context - Context object containing prompt, etc.
   * @returns {Array} - Processed messages array
   */
  preprocessMessages(messages, context = {}) { // eslint-disable-line no-unused-vars
    return messages;
  }

  /**
   * Abstract method to postprocess AI response
   * @param {string} response - AI response text
   * @param {Object} context - Context object
   * @returns {string} - Processed response
   */
  postprocessResponse(response, context = {}) { // eslint-disable-line no-unused-vars
    return response;
  }

  /**
   * Validate required context for this agent
   * @param {Object} context - Context object
   * @returns {boolean} - True if context is valid
   */
  validateContext(context = {}) { // eslint-disable-line no-unused-vars
    return true; // Base implementation accepts any context
  }

  /**
   * Get agent metadata
   * @returns {Object} - Agent metadata
   */
  getMetadata() {
    return {
      type: this.type,
      name: this.constructor.name,
      description: "Base agent implementation",
      supportedFeatures: [],
    };
  }
}

export default AgentBase;