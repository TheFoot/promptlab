import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// Load environment variables from .env file
dotenv.config({ path: path.join(rootDir, '.env') });

const config = {
  port: process.env.PORT || 3131,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/promptLibrary',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV === 'development',
  isProd: process.env.NODE_ENV === 'production',
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
};

// We can't use global.logger here because it's initialized after this file is imported
// The warning will be re-logged by the chat service when it tries to use the API key

export default config;
