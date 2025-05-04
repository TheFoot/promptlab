# PromptLab Docker Hub Overview

## What is PromptLab?

PromptLab is a comprehensive tool for developing, testing, and managing LLM prompts. It provides a centralized workspace where you can create, organize, and iterate on prompts for various AI providers including OpenAI and Anthropic.

## Features

- **Multi-Provider Support**: Works with OpenAI (GPT models) and Anthropic (Claude models)
- **Prompt Management**: Create, edit, and organize prompts with tags
- **Real-time Testing**: Test prompts against live AI models
- **Interactive Chat**: Interactive chat interface to experiment with your prompts
- **Markdown Support**: Rich text editing with markdown formatting
- **Tag Organization**: Organize prompts with customizable tags

## How to Run PromptLab

### Using the Docker Image

```bash
# Pull the image
docker pull thefootonline/promptlab:latest

# Run with MongoDB
docker network create promptlab-network
docker run -d --name mongodb --network promptlab-network mongo:latest
docker run -d --name promptlab \
  --network promptlab-network \
  -p 3131:3131 \
  -e MONGODB_URI=mongodb://mongodb:27017/promptLab \
  -e OPENAI_API_KEY=your_openai_key \
  -e ANTHROPIC_API_KEY=your_anthropic_key \
  thefootonline/promptlab:latest
```

The application will be available at http://localhost:3131

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes (for OpenAI models) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes (for Claude models) |
| `MONGODB_URI` | Custom MongoDB connection URI | No |
| `PORT` | Custom port (default: 3131) | No |

## Data Persistence

PromptLab stores its data in MongoDB. To persist your data, mount a volume for the MongoDB container:

```bash
docker run -d --name mongodb \
  --network promptlab-network \
  -v /path/on/host:/data/db \
  mongo:latest
```

## Configuration

PromptLab can be configured through environment variables:

- `NODE_ENV`: Set to `production` for production use
- `PORT`: Change the port (default: 3131)
- `MONGODB_URI`: Customize the MongoDB connection URI
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key