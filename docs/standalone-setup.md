# PromptLab Standalone Setup

This guide will help you quickly set up PromptLab using Docker Compose without having to clone the repository.

## Prerequisites

- Docker and Docker Compose installed on your system
- API keys for either OpenAI or Anthropic (or both) set as environment variables on your system

## Quick Start

1. **Create a directory for PromptLab**

   ```bash
   mkdir promptlab
   cd promptlab
   ```

2. **Download the Docker Compose file**

   ```bash
   # Download the Docker Compose file
   curl -O https://raw.githubusercontent.com/yourusername/promptlab/main/docs/docker-compose-standalone.yml
   ```

3. **Ensure API keys are available as environment variables**

   Make sure your API keys are set as environment variables on your system:

   ```bash
   # For Linux/macOS
   export OPENAI_API_KEY=your_openai_api_key
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   
   # For Windows PowerShell
   $env:OPENAI_API_KEY="your_openai_api_key"
   $env:ANTHROPIC_API_KEY="your_anthropic_api_key"
   ```

   You can add these to your shell profile for persistence.

4. **Start the application**

   ```bash
   docker-compose -f docker-compose-standalone.yml up -d
   ```

5. **Access PromptLab**

   Open your browser and navigate to: [http://localhost:3131](http://localhost:3131)

## Customization Options

### Change the MongoDB port

If you need to use a different port for MongoDB, edit the `docker-compose-standalone.yml` file and modify the ports setting under the mongodb service:

```yaml
mongodb:
  ports:
    - "12345:27017"  # Change 12345 to your desired port
```

### Use a specific version

To use a specific version of PromptLab instead of the latest, edit the `docker-compose-standalone.yml` file:

```yaml
promptlab:
  image: thefootonline/promptlab:0.9.0-beta  # Specify the version
```

### Data Persistence

MongoDB data is automatically persisted in a Docker volume named `promptlab_mongodb_data`. This ensures your data remains even if you restart the containers.

To use a specific location on your host system instead, modify the volumes section:

```yaml
mongodb:
  volumes:
    - ./data:/data/db  # Store data in a 'data' directory
```

## Stopping the Application

To stop the application:

```bash
docker-compose -f docker-compose-standalone.yml down
```

To stop and remove all data (including the MongoDB volume):

```bash
docker-compose -f docker-compose-standalone.yml down -v
```