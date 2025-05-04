# Controllers

This directory contains controller modules that handle HTTP requests for the PromptLab API. Controllers are responsible for processing incoming requests, interacting with services to perform business logic, and returning appropriate responses.

## Files

- `promptController.js` - Handles prompt CRUD operations
- `tagController.js` - Handles tag-related operations
- `chatController.js` - Handles chat functionality with AI models

## Controller Structure

Each controller follows a similar pattern:

```javascript
export const getAll = async (req, res) => {
  try {
    // Call service function to get data
    const data = await service.getAll();
    
    // Return successful response
    return res.status(200).json(data);
  } catch (error) {
    // Handle errors
    return res.status(500).json({ error: error.message });
  }
};
```

## Error Handling

Controllers use try/catch blocks to handle exceptions and return appropriate HTTP status codes:

- 200 - Success
- 201 - Resource created
- 400 - Bad request (validation errors)
- 404 - Resource not found
- 500 - Server error

## Related Documentation

- [Backend README](../../README.md)
- [Routes](../routes/README.md)
- [Services](../services/README.md)