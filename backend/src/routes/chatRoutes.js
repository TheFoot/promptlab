import { Router } from 'express';
import chatController from '../controllers/chatController.js';

const router = Router();

// POST endpoint for chat requests
router.post('/', chatController.sendMessage);

export default router;