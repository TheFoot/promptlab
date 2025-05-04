# Configuration Module

This directory contains configuration management code for the Prompt Library backend, including centralized provider and model settings.

## Files

- `index.js` - Main configuration exports and environment variable handling
- `providers.js` - Available AI providers configuration
- `openai.js` - OpenAI-specific configuration (models, API settings)
- `anthropic.js` - Anthropic-specific configuration (models, API settings)

## Usage

```javascript
import config from '../config';

// Access basic configuration
const port = config.port;
const mongoUri = config.mongoUri;

// Access provider configuration
const availableProviders = config.providers.available;
const defaultProvider = config.providers.default;

// Access model configuration
const openaiModels = config.openai.models.available;
const anthropicModels = config.anthropic.models.available;
```

## Core Configuration

| Name | Description | Default |
|------|-------------|--------|
| `port` | Server port | 3131 |
| `mongoUri` | MongoDB connection string | localhost:27017/prompt-library |
| `nodeEnv` | Application environment | development |
| `isDev` | Development mode flag | true if nodeEnv is development |
| `isProd` | Production mode flag | true if nodeEnv is production |

## Provider Configuration

The configuration system centralizes all provider settings:

### Provider Management

- `providers.available` - List of available AI providers
- `providers.default` - Default provider when not specified
- `providers.ui.displayNames` - Human-readable provider names

### OpenAI Configuration

- `openai.api` - API connection settings (key, baseUrl, organization)
- `openai.models.available` - Available OpenAI models
- `openai.models.default` - Default OpenAI model
- `openai.models.displayNames` - Human-readable model names
- `openai.defaults` - Default parameter values (temperature, maxTokens)

### Anthropic Configuration

- `anthropic.api` - API connection settings (key, baseUrl)
- `anthropic.models.available` - Available Anthropic Claude models
- `anthropic.models.default` - Default Anthropic model
- `anthropic.models.displayNames` - Human-readable model names
- `anthropic.defaults` - Default parameter values (temperature, maxTokens)

## Environment Variables

| Name | Description | Used In |
|------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | openai.js |
| `OPENAI_API_BASE_URL` | Custom OpenAI API endpoint (optional) | openai.js |
| `OPENAI_ORGANIZATION` | OpenAI organization ID (optional) | openai.js |
| `ANTHROPIC_API_KEY` | Anthropic API key | anthropic.js |
| `ANTHROPIC_API_BASE_URL` | Custom Anthropic API endpoint (optional) | anthropic.js |

## Related Documentation

- [Backend README](../../README.md)
- [Environment Setup](../../../README.md#development-setup)
- [Chat Service](../services/README.md)
