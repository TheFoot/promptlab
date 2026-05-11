import { Router } from "express";
import promptRoutes from "./promptRoutes.js";
import tagRoutes from "./tagRoutes.js";
import chatRoutes from "./chatRoutes.js";
import aiAnalysisRoutes from "./aiAnalysisRoutes.js";

const router = new Router();

// API routes
router.use("/prompts", promptRoutes);
router.use("/tags", tagRoutes);
router.use("/chat", chatRoutes);
router.use("/ai-analysis", aiAnalysisRoutes);

export default router;
