import { Router } from "express";
import {
  getPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from "../controllers/promptController.js";

const router = new Router();

// Get all prompts with optional filtering
router.get("/", getPrompts);

// Get a specific prompt
router.get("/:id", getPromptById);

// Create a new prompt
router.post("/", createPrompt);

// Update an existing prompt
router.put("/:id", updatePrompt);

// Delete a prompt
router.delete("/:id", deletePrompt);

export default router;
