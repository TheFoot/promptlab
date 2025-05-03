import { Router } from 'express';
import promptRoutes from './promptRoutes.js';
import tagRoutes from './tagRoutes.js';

const router = Router();

// API routes
router.use('/prompts', promptRoutes);
router.use('/tags', tagRoutes);

export default router;
