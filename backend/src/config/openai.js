// OpenAI provider configuration

const openaiConfig = {
  // API configuration
  api: {
    key: process.env.OPENAI_API_KEY || '',
    baseUrl: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    organization: process.env.OPENAI_ORGANIZATION || ''
  },

  // Available models
  models: {
    available: [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o'
    ],
    default: 'gpt-4o',

    // UI display names for models
    displayNames: {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4o': 'GPT-4o'
    }
  },

  // Default configuration options
  defaults: {
    temperature: 0.7,
    maxTokens: 4096
  }
};

export default openaiConfig;
