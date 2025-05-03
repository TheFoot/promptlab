import { Router } from 'express';
import { getAllTags } from '../controllers/tagController.js';

const router = Router();

// Get all unique tags
router.get('/', getAllTags);

export default router;
