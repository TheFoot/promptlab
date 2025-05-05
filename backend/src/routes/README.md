# API Routes

This directory contains route definitions for the PromptLab API. Routes map HTTP endpoints to controller functions.

## Files

- `index.js` - Main router that combines all route modules
- `promptRoutes.js` - Routes for prompt CRUD operations
- `tagRoutes.js` - Routes for tag operations
- `chatRoutes.js` - Routes for chat functionality

## API Endpoints

### Prompts

| Method | Endpoint              | Description       | Controller               |
| ------ | --------------------- | ----------------- | ------------------------ |
| GET    | `/api/prompts`        | Get all prompts   | promptController.getAll  |
| GET    | `/api/prompts/:id`    | Get prompt by ID  | promptController.getById |
| POST   | `/api/prompts`        | Create new prompt | promptController.create  |
| PUT    | `/api/prompts/:id`    | Update prompt     | promptController.update  |
| DELETE | `/api/prompts/:id`    | Delete prompt     | promptController.delete  |
| GET    | `/api/prompts/search` | Search prompts    | promptController.search  |

### Tags

| Method | Endpoint          | Description    | Controller           |
| ------ | ----------------- | -------------- | -------------------- |
| GET    | `/api/tags`       | Get all tags   | tagController.getAll |
| POST   | `/api/tags`       | Create new tag | tagController.create |
| DELETE | `/api/tags/:name` | Delete tag     | tagController.delete |

### Chat

| Method | Endpoint           | Description          | Controller                 |
| ------ | ------------------ | -------------------- | -------------------------- |
| POST   | `/api/chat`        | Send message to AI   | chatController.sendMessage |
| GET    | `/api/chat/models` | Get available models | chatController.getModels   |

## WebSocket Endpoints

| Endpoint   | Description                             |
| ---------- | --------------------------------------- |
| `/ws/chat` | Real-time chat with streaming responses |

## Route Structure

Routes are defined using Express Router:

```javascript
import { Router } from "express";
import * as controller from "../controllers/exampleController.js";

const router = Router();

router.get("/", controller.getAll);
router.post("/", controller.create);

export default router;
```

## Related Documentation

- [Backend README](../../README.md)
- [Controllers](../controllers/README.md)
