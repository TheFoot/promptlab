import { Router } from 'express';
import promptRoutes from './promptRoutes.js';
import tagRoutes from './tagRoutes.js';
import chatRoutes from './chatRoutes.js';

const router = Router();

// API routes
router.use('/prompts', promptRoutes);
router.use('/tags', tagRoutes);
router.use('/chat', chatRoutes);

export default router;
