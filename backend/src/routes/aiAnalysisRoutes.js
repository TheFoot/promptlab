/**
 * AI Analysis Routes
 * 
 * Routes for AI-based prompt analysis features, testing, and version control
 */

import express from 'express';
import {
  analyzePrompt,
  generatePrompt,
  submitAnalysisFeedback,
  getAnalysisTemplates,
  getPromptSuggestionHistory,
  // Test History endpoints
  saveTestSession,
  getTestHistory,
  getTestSession,
  deleteTestSession,
  // Version Control endpoints
  savePromptVersion,
  getPromptVersions,
  getPromptVersion,
  restorePromptVersion
} from '../controllers/aiAnalysisController.js';

const router = express.Router();

// Analyze a prompt to get improvement suggestions
router.post('/analyze', analyzePrompt);

// Generate a prompt based on questionnaire answers
router.post('/generate', generatePrompt);

// Submit feedback on analysis results
router.post('/analysis-feedback', submitAnalysisFeedback);

// Get available analysis templates
router.get('/analysis-templates', getAnalysisTemplates);

// Get suggestion history for a prompt
router.get('/:promptId/suggestion-history', getPromptSuggestionHistory);

// Test History endpoints
router.post('/prompts/:id/tests', saveTestSession);
router.get('/prompts/:id/tests', getTestHistory);
router.get('/prompts/:id/tests/:sessionId', getTestSession);
router.delete('/prompts/:id/tests/:sessionId', deleteTestSession);

// Version Control endpoints
router.post('/prompts/:id/versions', savePromptVersion);
router.get('/prompts/:id/versions', getPromptVersions);
router.get('/prompts/:id/versions/:versionId', getPromptVersion);
router.put('/prompts/:id/versions/:versionId/restore', restorePromptVersion);

export default router;