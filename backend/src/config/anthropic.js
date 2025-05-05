// Anthropic provider configuration

const anthropicConfig = {
  // API configuration
  api: {
    key: process.env.ANTHROPIC_API_KEY || '',
    // Note: baseUrl should only be included if explicitly specified
    ...(process.env.ANTHROPIC_API_BASE_URL ?
      { baseUrl: process.env.ANTHROPIC_API_BASE_URL } :
      {}),
  },

  // Available models
  models: {
    available: [
      'claude-3-7-sonnet-latest',
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
    ],
    default: 'claude-3-7-sonnet-latest',

    // UI display names for models
    displayNames: {
      'claude-3-7-sonnet-latest': 'Claude 3.7 Sonnet (Newest)',
      'claude-3-5-sonnet-latest': 'Claude 3.5 Sonnet',
      'claude-3-5-haiku-latest': 'Claude 3.5 Haiku',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
    },
  },

  // Default configuration options
  defaults: {
    temperature: 0.7,
    maxTokens: 4096,
  },
};

export default anthropicConfig;
