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

### Option 1: With Existing MongoDB Instance

If you already have MongoDB running locally or in another container:

```bash
# Pull the image
docker pull thefootonline/promptlab:latest

# Run the application container
docker run -d --name promptlab \
  -p 3131:3131 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/promptLab \
  -e OPENAI_API_KEY=your_openai_key \
  -e ANTHROPIC_API_KEY=your_anthropic_key \
  thefootonline/promptlab:latest
```

Note: `host.docker.internal` is used to connect to services on your host machine. If your MongoDB uses authentication, adjust the URI accordingly.

### Option 2: Complete Setup with New MongoDB

If you need to set up both PromptLab and MongoDB:

```bash
# Pull the image
docker pull thefootonline/promptlab:latest

# Create a network for the containers
docker network create promptlab-network

# Start MongoDB container
docker run -d --name mongodb \
  --network promptlab-network \
  -p 27017:27017 \
  mongo:latest

# Start PromptLab container
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

PromptLab stores its data in MongoDB. To persist your data when using a new MongoDB container, mount a volume:

```bash
docker run -d --name mongodb \
  --network promptlab-network \
  -v /path/on/host:/data/db \
  -p 27017:27017 \
  mongo:latest
```

## Configuration

PromptLab can be configured through environment variables:

- `NODE_ENV`: Set to `production` for production use
- `PORT`: Change the port (default: 3131)
- `MONGODB_URI`: Customize the MongoDB connection URI
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key