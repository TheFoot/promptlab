import ChatAgent from './ChatAgent.js';
import DesignAgent from './DesignAgent.js';

/**
 * Factory for creating agent instances
 * Manages agent types and provides a clean interface for agent creation
 */
class AgentFactory {
  static agentTypes = new Map([
    ['chat', ChatAgent],
    ['design', DesignAgent],
  ]);

  /**
   * Create an agent instance
   * @param {string} agentType - Type of agent to create ('chat', 'design', etc.)
   * @param {Object} agentConfig - Configuration for the agent
   * @returns {AgentBase} - Agent instance
   */
  static createAgent(agentType = 'chat', agentConfig = {}) {
    const normalizedType = agentType?.toLowerCase() || 'chat';
    const AgentClass = this.agentTypes.get(normalizedType);
    
    if (!AgentClass) {
      global.logger?.warn('Unknown agent type, falling back to chat agent', {
        requestedType: agentType,
        normalizedType,
        availableTypes: Array.from(this.agentTypes.keys()),
      });
      return new ChatAgent(agentConfig);
    }

    global.logger?.debug('Creating agent', {
      type: normalizedType,
      config: Object.keys(agentConfig),
    });

    return new AgentClass(agentConfig);
  }

  /**
   * Get available agent types
   * @returns {Array<string>} - Array of available agent type names
   */
  static getAvailableTypes() {
    return Array.from(this.agentTypes.keys());
  }

  /**
   * Get metadata for all available agents
   * @returns {Array<Object>} - Array of agent metadata objects
   */
  static getAllAgentMetadata() {
    return Array.from(this.agentTypes.entries()).map(([, AgentClass]) => {
      const tempAgent = new AgentClass();
      return tempAgent.getMetadata();
    });
  }

  /**
   * Get metadata for a specific agent type
   * @param {string} agentType - Agent type name
   * @returns {Object|null} - Agent metadata or null if not found
   */
  static getAgentMetadata(agentType) {
    const normalizedType = agentType?.toLowerCase();
    const AgentClass = this.agentTypes.get(normalizedType);
    
    if (!AgentClass) {
      return null;
    }
    
    const tempAgent = new AgentClass();
    return tempAgent.getMetadata();
  }

  /**
   * Register a new agent type
   * @param {string} agentType - Agent type name
   * @param {class} AgentClass - Agent class constructor
   */
  static registerAgent(agentType, AgentClass) {
    if (!agentType || typeof agentType !== 'string') {
      throw new Error('Agent type must be a non-empty string');
    }
    
    if (!AgentClass || typeof AgentClass !== 'function') {
      throw new Error('Agent class must be a constructor function');
    }
    
    this.agentTypes.set(agentType.toLowerCase(), AgentClass);
    
    global.logger?.info('Registered new agent type', {
      type: agentType.toLowerCase(),
      className: AgentClass.name,
    });
  }
}

export default AgentFactory;