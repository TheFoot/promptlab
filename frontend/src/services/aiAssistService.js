/**
 * AI Assist Service for PromptLab
 *
 * This service handles interactions with the backend API for AI-based prompt analysis,
 * suggestions, and improvements.
 */

// Base API URL from environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Analyze a prompt text using AI to get suggestions for improvements
 *
 * @param {string} promptText - The prompt text to analyze
 * @param {Object} options - Optional parameters
 * @param {string} options.model - AI model to use for analysis (defaults to server-side default)
 * @param {Array<string>} options.analysisAspects - Specific aspects to analyze (clarity, conciseness, etc.)
 * @param {boolean} options.includeAlternatives - Whether to include alternative suggestions
 * @returns {Promise<Object>} Analysis results including score, suggestions, and summary
 */
async function analyzePrompt(promptText, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/prompts/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText,
        model: options.model,
        analysisAspects: options.analysisAspects,
        includeAlternatives: options.includeAlternatives ?? true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to analyze prompt: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in analyzePrompt:", error);
    throw error;
  }
}

/**
 * Submit feedback on the AI analysis results
 *
 * @param {string} analysisId - The ID of the analysis to provide feedback for
 * @param {string} feedbackType - The type of feedback (helpful, not_helpful)
 * @param {string} [comments] - Optional additional comments about the feedback
 * @returns {Promise<Object>} Confirmation of feedback submission
 */
async function submitAnalysisFeedback(analysisId, feedbackType, comments = "") {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/analysis-feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisId,
          feedbackType,
          comments,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to submit feedback: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in submitAnalysisFeedback:", error);
    throw error;
  }
}

/**
 * Get a list of prompt analysis templates
 * Templates provide pre-configured analysis options for different use cases
 *
 * @returns {Promise<Array<Object>>} List of available analysis templates
 */
async function getAnalysisTemplates() {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/analysis-templates`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to fetch templates: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getAnalysisTemplates:", error);
    throw error;
  }
}

/**
 * Get suggestion history for a prompt
 * This allows tracking of all suggestions made for a prompt over time
 *
 * @param {string} promptId - The ID of the prompt to get suggestion history for
 * @returns {Promise<Array<Object>>} Historical suggestion data
 */
async function getPromptSuggestionHistory(promptId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/prompts/${promptId}/suggestion-history`,
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Failed to fetch suggestion history: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in getPromptSuggestionHistory:", error);
    throw error;
  }
}

export default {
  analyzePrompt,
  submitAnalysisFeedback,
  getAnalysisTemplates,
  getPromptSuggestionHistory,
};
