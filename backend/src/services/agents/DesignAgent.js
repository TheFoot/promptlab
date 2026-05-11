import AgentBase from './AgentBase.js';

/**
 * Design Agent - Analyzes and suggests improvements for prompts
 * This agent has its own system prompt and uses the user's prompt as context
 */
class DesignAgent extends AgentBase {
  constructor(agentConfig = {}) {
    super(agentConfig);
    
    // Base system prompt for design agent
    this.baseSystemPrompt = `You are an expert prompt design assistant. ` +
      `Your role is to help users analyze, improve, and optimize their prompts for AI systems.

When analyzing a prompt, consider:
- Clarity and specificity of instructions
- Completeness of context and requirements
- Potential ambiguities or areas for improvement
- Best practices for prompt engineering
- Effectiveness for the intended use case

When a user's prompt is provided, use it as context for your analysis and suggestions. ` +
      `Provide constructive, actionable feedback that helps improve the prompt's effectiveness.

Be helpful, specific, and focus on practical improvements rather than general advice.`;
  }

  /**
   * Build system prompt for design agent
   * Combines base system prompt with user's prompt as context
   * @param {Object} context - Contains promptContent, promptTitle, etc.
   * @returns {string} - Complete system prompt
   */
  buildSystemPrompt(context = {}) {
    const { promptContent, promptTitle } = context;
    
    let systemPrompt = this.baseSystemPrompt;
    
    // Add user's prompt as context if available
    if (promptContent && promptContent.trim()) {
      systemPrompt += `\n\nUser's Current Prompt:`;
      if (promptTitle) {
        systemPrompt += `\nTitle: "${promptTitle}"`;
      }
      systemPrompt += `\nContent: """${promptContent.trim()}"""`;
      systemPrompt += `\n\nUse this prompt as context when the user asks for ` +
        `analysis or improvements.`;
    } else {
      systemPrompt += `\n\nNo specific prompt has been provided yet. ` +
        `Help the user understand prompt design principles and ask for their prompt ` +
        `when they're ready for specific analysis.`;
    }
    
    return systemPrompt;
  }

  /**
   * Preprocess messages - can enhance with prompt context
   * @param {Array} messages - Message history
   * @param {Object} context - Context object
   * @returns {Array} - Potentially modified messages
   */
  preprocessMessages(messages, context = {}) { // eslint-disable-line no-unused-vars
    // For design agent, we don't need to modify messages since
    // the prompt context is already in the system prompt
    return messages;
  }

  /**
   * Postprocess response - can add design-specific formatting
   * @param {string} response - AI response
   * @param {Object} context - Context object
   * @returns {string} - Potentially enhanced response
   */
  postprocessResponse(response, context = {}) { // eslint-disable-line no-unused-vars
    // Could add design agent specific formatting here if needed
    return response;
  }

  /**
   * Validate context for design agent
   * @param {Object} context - Context object
   * @returns {boolean} - True if valid
   */
  validateContext(context = {}) { // eslint-disable-line no-unused-vars
    // Design agent can work with or without a prompt
    return true;
  }

  /**
   * Get design agent metadata
   * @returns {Object} - Agent metadata
   */
  getMetadata() {
    return {
      type: 'design',
      name: 'DesignAgent',
      description: 'Analyzes and suggests improvements for prompts',
      supportedFeatures: ['prompt_analysis', 'improvement_suggestions', 'design_guidance'],
      requiresPrompt: false, // Can provide general guidance without a specific prompt
    };
  }
}

export default DesignAgent;