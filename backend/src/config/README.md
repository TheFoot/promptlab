# Configuration Module

This directory contains configuration management code for the Prompt Library backend.

## Files

- `index.js` - Main configuration exports and environment variable handling

## Usage

```javascript
import config from '../config';

// Access configuration values
const port = config.port;
const mongoUri = config.mongoUri;
```

## Configuration Variables

| Name | Description | Default |
|------|-------------|--------|
| `port` | Server port | 3131 |
| `mongoUri` | MongoDB connection string | localhost:27017/prompt-library |
| `env` | Application environment | development |
| `openaiApiKey` | OpenAI API key | - |

## Related Documentation

- [Backend README](../../README.md)
- [Environment Setup](../../../README.md#development-setup)
