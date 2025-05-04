# Backend - Express.js API

This directory contains the Express.js backend API for the PromptLab application. It provides the REST endpoints for managing prompts, tags, and chat functionality.

## Directory Structure

- `src/` - Source code
  - `index.js` - Application entry point
  - `config/` - [Configuration settings](./src/config/README.md)
  - `controllers/` - [API request handlers](./src/controllers/README.md)
  - `models/` - [Database models](./src/models/README.md)
  - `modules/` - [Utility modules](./src/modules/README.md)
  - `routes/` - [API routes](./src/routes/README.md)
  - `services/` - [Business logic](./src/services/README.md)
- `package.json` - Backend dependencies

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## Environment Variables

The backend requires the following environment variables:

- `PORT` - Server port (default: 3131)
- `MONGODB_URI` - MongoDB connection URI
- `NODE_ENV` - Environment (development, production, test)

### AI Provider API Keys

- `OPENAI_API_KEY` - OpenAI API key for GPT models
- `ANTHROPIC_API_KEY` - Anthropic API key for Claude models

Optional provider configuration:
- `OPENAI_API_BASE_URL` - Custom OpenAI API endpoint
- `OPENAI_ORGANIZATION` - OpenAI organization ID
- `ANTHROPIC_API_BASE_URL` - Custom Anthropic API endpoint

These should be defined in a `.env` file in the root project directory.

See [Configuration docs](./src/config/README.md) for more details.

## API Endpoints

See the [Routes documentation](./src/routes/README.md) for detailed API endpoint information.

## Key Technologies

- Express.js - Web framework
- MongoDB/Mongoose - Database
- ESM modules - JavaScript module system
- WebSockets - Real-time communication

## Related Documentation

- [Main Project README](../README.md)
- [API Routes](./src/routes/README.md)
- [Database Models](./src/models/README.md)
