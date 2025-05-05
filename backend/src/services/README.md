# Services

This directory contains service modules that implement the business logic for the PromptLab application. Services handle the core functionality and interact with models, external APIs, and other resources.

## Files

- `chatService.js` - Handles interaction with OpenAI API for chat functionality

## Service Structure

Services encapsulate business logic and data access:

```javascript
// Example service function
export const getAll = async (filters = {}) => {
  // Business logic implementation
  const data = await Model.find(filters);
  return data;
};
```

## Chat Service

The Chat Service manages communication with OpenAI's API for generating responses. It handles:

- Managing API requests to OpenAI
- Streaming responses via WebSockets
- Error handling and retries
- Model selection and parameter configuration

### Usage

```javascript
import * as chatService from "../services/chatService.js";

// Regular response
const response = await chatService.sendMessage(message, model, temperature);

// Streaming response
const stream = chatService.streamResponse(message, model, temperature);
stream.on("data", (chunk) => {
  // Handle streaming response chunk
});
```

## Error Handling

Services should handle domain-specific errors and translate them to appropriate exceptions that controllers can process.

## Related Documentation

- [Backend README](../../README.md)
- [Controllers](../controllers/README.md)
- [Models](../models/README.md)
