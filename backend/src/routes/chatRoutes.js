import { Router } from 'express';
import chatController from '../controllers/chatController.js';

const router = new Router();

// POST endpoint for chat requests
router.post('/', chatController.sendMessage);

// GET endpoint for provider configuration
router.get('/config', chatController.getProviderConfig);

export default router;
