import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import providers from './providers.js';
import openaiConfig from './openai.js';
import anthropicConfig from './anthropic.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

// Basic application configuration
const config = {
  port: process.env.PORT || 3131,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/promptLab',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
};

// Add provider-specific configurations
const providerConfigs = {
  providers,
  openai: openaiConfig,
  anthropic: anthropicConfig
};

// Check for missing API keys and log warnings
if (!openaiConfig.api.key) {
  // We can't use global.logger here because it's initialized after this file is imported
  // The warning will be re-logged by the chat service when it tries to use the API key
  console.warn('OPENAI_API_KEY environment variable is not set. Chat features using OpenAI will not work.');
}

if (!anthropicConfig.api.key) {
  console.warn('ANTHROPIC_API_KEY environment variable is not set. Chat features using Anthropic will not work.');
}

// Export everything as a unified configuration
export default {
  ...config,
  ...providerConfigs
};