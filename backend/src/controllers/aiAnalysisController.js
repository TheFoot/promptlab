/**
 * AI Analysis Controller
 *
 * Handles requests for AI-based prompt analysis, generation, feedback, template management,
 * and test history tracking.
 */

import providers from "../config/providers.js";

// In-memory store for test sessions and prompt versions
// In a production environment, these would be stored in a database
const testSessions = [];
const promptVersions = [];

/**
 * Analyze a prompt using AI to get improvement suggestions
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.promptText - The prompt text to analyze
 * @param {string} [req.body.model] - AI model to use (optional)
 * @param {Array<string>} [req.body.analysisAspects] - Specific aspects to analyze
 * @param {boolean} [req.body.includeAlternatives=true] - Whether to include alternative suggestions
 * @param {Object} res - Express response object
 */
export async function analyzePrompt(req, res) {
  try {
    const {
      promptText,
      model,
      analysisAspects,
      includeAlternatives = true,
    } = req.body;

    if (!promptText || typeof promptText !== "string") {
      return res.status(400).json({ message: "Prompt text is required" });
    }

    // Determine which provider and model to use
    const provider = model || providers.default;

    // Prepare system prompt for analysis
    const systemPrompt = buildAnalysisSystemPrompt(analysisAspects);

    // Build messages array for the AI
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: promptText },
    ];

    // Get the provider-specific client
    const providerClient = await getProviderClient(provider, model);

    // Call the AI with the prepared messages
    const response = await providerClient.generateAnalysis(messages, {
      includeAlternatives,
    });

    // Process and return the response
    return res.status(200).json(response);
  } catch (error) {
    global.logger.error("Error analyzing prompt", error);
    return res
      .status(500)
      .json({ message: "Error analyzing prompt", error: error.message });
  }
}

/**
 * Submit feedback on the AI analysis results
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.analysisId - The ID of the analysis to provide feedback for
 * @param {string} req.body.feedbackType - The type of feedback (helpful, not_helpful)
 * @param {string} [req.body.comments] - Optional additional comments about the feedback
 * @param {Object} res - Express response object
 */
export async function submitAnalysisFeedback(req, res) {
  try {
    const { analysisId, feedbackType, comments } = req.body;

    if (!analysisId) {
      return res.status(400).json({ message: "Analysis ID is required" });
    }

    if (!["helpful", "not_helpful"].includes(feedbackType)) {
      return res.status(400).json({ message: "Invalid feedback type" });
    }

    // In a production implementation, we would store this feedback in a database
    // For now, we'll just log it
    console.log(`Feedback received for analysis ${analysisId}:`, {
      feedbackType,
      comments,
    });

    return res.status(200).json({
      message: "Feedback submitted successfully",
      analysisId,
      feedbackType,
    });
  } catch (error) {
    global.logger.error("Error submitting analysis feedback", error);
    return res
      .status(500)
      .json({ message: "Error submitting feedback", error: error.message });
  }
}

/**
 * Get a list of available analysis templates
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getAnalysisTemplates(req, res) {
  try {
    // In a production implementation, these would likely be stored in a database
    // For now, we'll return a static list
    const templates = [
      {
        id: "general",
        name: "General Purpose",
        description: "Comprehensive analysis of all aspects of your prompt",
        aspects: [
          "clarity",
          "conciseness",
          "context",
          "specificity",
          "formatting",
        ],
      },
      {
        id: "coding",
        name: "Code Generation",
        description: "Optimized for prompts that ask for code generation",
        aspects: ["clarity", "specificity", "context"],
      },
      {
        id: "creative",
        name: "Creative Writing",
        description: "For prompts that generate creative or narrative content",
        aspects: ["clarity", "context", "specificity"],
      },
      {
        id: "concise",
        name: "Conciseness",
        description: "Focus on making your prompt as concise as possible",
        aspects: ["conciseness", "clarity"],
      },
    ];

    return res.status(200).json(templates);
  } catch (error) {
    global.logger.error("Error fetching analysis templates", error);
    return res
      .status(500)
      .json({ message: "Error fetching templates", error: error.message });
  }
}

/**
 * Get suggestion history for a prompt
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.promptId - The ID of the prompt to get suggestion history for
 * @param {Object} res - Express response object
 */
export async function getPromptSuggestionHistory(req, res) {
  try {
    const { promptId } = req.params;

    if (!promptId) {
      return res.status(400).json({ message: "Prompt ID is required" });
    }

    // In a production implementation, we would fetch this from a database
    // For now, we'll return an empty array
    return res.status(200).json([]);
  } catch (error) {
    global.logger.error("Error fetching suggestion history", error);
    return res
      .status(500)
      .json({
        message: "Error fetching suggestion history",
        error: error.message,
      });
  }
}

/**
 * Save a new test session for a prompt
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {Object} req.body - Request body containing test session data
 * @param {Array} req.body.conversation - Array of message objects
 * @param {Object} req.body.metrics - Test metrics
 * @param {string} req.body.timestamp - ISO timestamp
 * @param {Object} res - Express response object
 */
export async function saveTestSession(req, res) {
  try {
    const { id: promptId } = req.params;
    const { conversation, metrics, timestamp } = req.body;

    if (!promptId) {
      return res.status(400).json({ message: "Prompt ID is required" });
    }

    if (!conversation || !Array.isArray(conversation)) {
      return res.status(400).json({ message: "Conversation data is required" });
    }

    // Create a new test session
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newSession = {
      id: sessionId,
      promptId,
      timestamp: timestamp || new Date().toISOString(),
      modelId: req.body.modelId || "unknown",
      parameters: req.body.parameters || {},
      conversation,
      metrics: metrics || {},
    };

    // In a production environment, this would be saved to a database
    testSessions.unshift(newSession);

    // Return a summary of the session
    return res.status(201).json({
      id: sessionId,
      timestamp: newSession.timestamp,
      modelId: newSession.modelId,
      messageCount: conversation.length,
      metrics: newSession.metrics,
    });
  } catch (error) {
    global.logger.error("Error saving test session", error);
    return res
      .status(500)
      .json({ message: "Error saving test session", error: error.message });
  }
}

/**
 * Get test history for a prompt
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {Object} req.query - Query parameters
 * @param {number} req.query.limit - Maximum number of sessions to return
 * @param {number} req.query.offset - Number of sessions to skip
 * @param {string} req.query.startDate - Filter by start date (ISO string)
 * @param {string} req.query.endDate - Filter by end date (ISO string)
 * @param {string} req.query.modelId - Filter by model ID
 * @param {Object} res - Express response object
 */
export async function getTestHistory(req, res) {
  try {
    const { id: promptId } = req.params;
    const { limit, offset, startDate, endDate, modelId } = req.query;

    if (!promptId) {
      return res.status(400).json({ message: "Prompt ID is required" });
    }

    // Filter sessions for the prompt
    let filteredSessions = testSessions.filter(
      (session) => session.promptId === promptId,
    );

    // Apply additional filters
    if (startDate) {
      const start = new Date(startDate).getTime();
      filteredSessions = filteredSessions.filter(
        (session) => new Date(session.timestamp).getTime() >= start,
      );
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      filteredSessions = filteredSessions.filter(
        (session) => new Date(session.timestamp).getTime() <= end,
      );
    }

    if (modelId) {
      filteredSessions = filteredSessions.filter(
        (session) => session.modelId === modelId,
      );
    }

    // Apply pagination
    const paginatedSessions = filteredSessions.slice(
      parseInt(offset) || 0,
      (parseInt(offset) || 0) + (parseInt(limit) || filteredSessions.length),
    );

    // Create summary objects (without full conversation data)
    const sessionSummaries = paginatedSessions.map((session) => ({
      id: session.id,
      timestamp: session.timestamp,
      modelId: session.modelId,
      parameters: session.parameters,
      messageCount: session.conversation.length,
      metrics: session.metrics,
    }));

    return res.status(200).json({
      total: filteredSessions.length,
      sessions: sessionSummaries,
    });
  } catch (error) {
    global.logger.error("Error fetching test history", error);
    return res
      .status(500)
      .json({ message: "Error fetching test history", error: error.message });
  }
}

/**
 * Get a specific test session
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {string} req.params.sessionId - The ID of the test session
 * @param {Object} res - Express response object
 */
export async function getTestSession(req, res) {
  try {
    const { id: promptId, sessionId } = req.params;

    if (!promptId || !sessionId) {
      return res
        .status(400)
        .json({ message: "Prompt ID and session ID are required" });
    }

    // Find the session
    const session = testSessions.find(
      (s) => s.id === sessionId && s.promptId === promptId,
    );

    if (!session) {
      return res.status(404).json({ message: "Test session not found" });
    }

    return res.status(200).json(session);
  } catch (error) {
    global.logger.error("Error fetching test session", error);
    return res
      .status(500)
      .json({ message: "Error fetching test session", error: error.message });
  }
}

/**
 * Delete a test session
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {string} req.params.sessionId - The ID of the test session
 * @param {Object} res - Express response object
 */
export async function deleteTestSession(req, res) {
  try {
    const { id: promptId, sessionId } = req.params;

    if (!promptId || !sessionId) {
      return res
        .status(400)
        .json({ message: "Prompt ID and session ID are required" });
    }

    // Find the session index
    const sessionIndex = testSessions.findIndex(
      (s) => s.id === sessionId && s.promptId === promptId,
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ message: "Test session not found" });
    }

    // Remove the session
    testSessions.splice(sessionIndex, 1);

    return res
      .status(200)
      .json({ message: "Test session deleted successfully" });
  } catch (error) {
    global.logger.error("Error deleting test session", error);
    return res
      .status(500)
      .json({ message: "Error deleting test session", error: error.message });
  }
}

/**
 * Save a new version of a prompt
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {Object} req.body - Request body
 * @param {string} req.body.content - The prompt content
 * @param {Object} req.body.metadata - Additional metadata
 * @param {Object} res - Express response object
 */
export async function savePromptVersion(req, res) {
  try {
    const { id: promptId } = req.params;
    const { content, metadata } = req.body;

    if (!promptId) {
      return res.status(400).json({ message: "Prompt ID is required" });
    }

    if (!content) {
      return res.status(400).json({ message: "Prompt content is required" });
    }

    // Get existing versions for this prompt
    const promptVersionsList = promptVersions.filter(
      (v) => v.promptId === promptId,
    );

    // Calculate next version number
    const versionNumber =
      promptVersionsList.length > 0
        ? Math.max(...promptVersionsList.map((v) => v.versionNumber)) + 1
        : 1;

    // Create new version
    const versionId = `version_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const newVersion = {
      id: versionId,
      promptId,
      versionNumber,
      content,
      createdAt: new Date().toISOString(),
      metadata: metadata || {},
      testResults: {},
    };

    // In a production environment, this would be saved to a database
    promptVersions.push(newVersion);

    return res.status(201).json({
      id: versionId,
      promptId,
      versionNumber,
      createdAt: newVersion.createdAt,
    });
  } catch (error) {
    global.logger.error("Error saving prompt version", error);
    return res
      .status(500)
      .json({ message: "Error saving prompt version", error: error.message });
  }
}

/**
 * Get all versions of a prompt
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {Object} res - Express response object
 */
export async function getPromptVersions(req, res) {
  try {
    const { id: promptId } = req.params;

    if (!promptId) {
      return res.status(400).json({ message: "Prompt ID is required" });
    }

    // Filter versions for the prompt and sort by version number descending
    const versions = promptVersions
      .filter((v) => v.promptId === promptId)
      .sort((a, b) => b.versionNumber - a.versionNumber);

    // Create version summaries without full content
    const versionSummaries = versions.map((version) => ({
      id: version.id,
      promptId: version.promptId,
      versionNumber: version.versionNumber,
      createdAt: version.createdAt,
      metadata: version.metadata,
      testResults: version.testResults,
    }));

    return res.status(200).json(versionSummaries);
  } catch (error) {
    global.logger.error("Error fetching prompt versions", error);
    return res
      .status(500)
      .json({
        message: "Error fetching prompt versions",
        error: error.message,
      });
  }
}

/**
 * Get a specific version of a prompt
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {string} req.params.versionId - The ID of the version
 * @param {Object} res - Express response object
 */
export async function getPromptVersion(req, res) {
  try {
    const { id: promptId, versionId } = req.params;

    if (!promptId || !versionId) {
      return res
        .status(400)
        .json({ message: "Prompt ID and version ID are required" });
    }

    // Find the version
    const version = promptVersions.find(
      (v) => v.id === versionId && v.promptId === promptId,
    );

    if (!version) {
      return res.status(404).json({ message: "Prompt version not found" });
    }

    return res.status(200).json(version);
  } catch (error) {
    global.logger.error("Error fetching prompt version", error);
    return res
      .status(500)
      .json({ message: "Error fetching prompt version", error: error.message });
  }
}

/**
 * Generate a prompt based on questionnaire answers or inputs
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {Object} req.body.answers - The questionnaire answers to use for generation
 * @param {string} [req.body.model] - AI model to use (optional)
 * @param {Object} res - Express response object
 */
export async function generatePrompt(req, res) {
  try {
    const { answers, model } = req.body;

    if (!answers || typeof answers !== "object") {
      return res
        .status(400)
        .json({ message: "Questionnaire answers are required" });
    }

    // Determine which provider and model to use
    const provider = model || providers.default;

    // Format questionnaire answers for the prompt
    const questionnaire = Object.entries(answers)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n");

    // Instructions for generating a prompt
    const systemPrompt = 
      `You are an expert AI prompt engineer. Your task is to create a well-structured, 
effective prompt based on the questionnaire answers provided.
Create a prompt that matches the requirements in the questionnaire answers exactly.
Format your response as a complete, well-structured markdown document with appropriate 
headings and sections.
Focus on clarity, specificity, and providing enough context for the AI to understand 
the request precisely.
The prompt should be ready to use without further modification.`;

    // Build messages array for the AI
    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Please create a prompt based on these questionnaire answers:\n\n${questionnaire}`,
      },
    ];

    // Get the provider-specific client
    const providerClient = await getProviderClient(provider, model);

    // Call the AI with the prepared messages
    // For now we'll simulate this with a mock response
    const promptContent = await providerClient.generateContent(messages);
    console.log("Generated prompt content of length:", promptContent.length);

    // Generate a title and tags based on the content and questionnaire
    const title = generateTitleFromContent(promptContent, answers);
    const suggestedTags = generateTagsFromAnswers(answers);

    console.log(
      "Returning response with content length:",
      promptContent.length,
      "title:",
      title,
    );

    return res.status(200).json({
      content: promptContent,
      title,
      suggestedTags,
    });
  } catch (error) {
    global.logger.error("Error generating prompt", error);
    return res
      .status(500)
      .json({ message: "Error generating prompt", error: error.message });
  }
}

/**
 * Restore a prompt to a specific version
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - The ID of the prompt
 * @param {string} req.params.versionId - The ID of the version
 * @param {Object} res - Express response object
 */
export async function restorePromptVersion(req, res) {
  try {
    const { id: promptId, versionId } = req.params;

    if (!promptId || !versionId) {
      return res
        .status(400)
        .json({ message: "Prompt ID and version ID are required" });
    }

    // Find the version
    const version = promptVersions.find(
      (v) => v.id === versionId && v.promptId === promptId,
    );

    if (!version) {
      return res.status(404).json({ message: "Prompt version not found" });
    }

    // In a production environment, this would update the prompt in the database
    // For now, we'll just return the version content
    return res.status(200).json({
      message: "Prompt restored successfully",
      promptId,
      versionId,
      content: version.content,
    });
  } catch (error) {
    global.logger.error("Error restoring prompt version", error);
    return res
      .status(500)
      .json({
        message: "Error restoring prompt version",
        error: error.message,
      });
  }
}

/**
 * Build the system prompt for analysis based on requested aspects
 *
 * @param {Array<string>} aspects - Aspects to analyze
 * @returns {string} The system prompt
 */
function buildAnalysisSystemPrompt(
  aspects = [
    "clarity", 
    "conciseness", 
    "context", 
    "specificity", 
    "formatting"
  ],
) {
  return `You're an expert prompt engineer. Analyze the prompt and provide constructive feedback.
Focus on these aspects: ${aspects.join(", ")}.

For your analysis, provide:
1. An overall score (0-100)
2. A brief summary of the prompt's strengths and weaknesses
3. Specific suggestions for improvement, with:
   - The issue identified
   - The reason it's problematic
   - A specific replacement or addition
   - One or more alternative suggestions when relevant

Format your response as valid JSON with this structure:
{
  "overallScore": number,
  "summary": "brief overall assessment",
  "suggestions": [
    {
      "category": "one of: clarity, conciseness, context, specificity, formatting",
      "title": "short issue description",
      "description": "detailed explanation",
      "originalText": "text to be improved (if applicable)",
      "replacementText": "suggested improvement",
      "alternatives": [
        { "text": "first alternative" },
        { "text": "second alternative" }
      ]
    }
  ]
}`;
}

/**
 * Get the provider-specific client for AI calls
 *
 * @param {string} provider - Provider name
 * @param {string} model - Model name (optional)
 * @returns {Object} Provider client
 */
async function getProviderClient() {
  // This is a placeholder implementation
  // In a real implementation, this would initialize the appropriate client
  // based on the specified provider and model

  return {
    generateAnalysis: async () => {
      // This mock implementation returns a sample analysis result
      // In a real implementation, this would call the provider's API

      // A slight delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        overallScore: 75,
        summary: 
          "Your prompt is generally clear but could be more specific in certain areas. " + 
          "Adding more context would help the AI understand exactly what you're looking for.",
        suggestions: [
          {
            category: "clarity",
            title: "Clarify the main objective",
            description:
              "The prompt's main goal is somewhat ambiguous. " + 
              "Making it explicit will help the AI focus on what's most important.",
            originalText:
              "I want you to analyze this data and give me insights.",
            replacementText:
              "I want you to analyze this financial data and give me insights " + 
              "about revenue trends over the past quarter.",
            alternatives: [
              {
                text: "Analyze this financial data and identify the top 3 factors " + 
                      "affecting our revenue this quarter.",
              },
              {
                text: "Review this financial dataset and provide specific insights " + 
                      "on cost reduction opportunities and revenue growth.",
              },
            ],
          },
          {
            category: "specificity",
            title: "Add specific examples",
            description:
              "Including examples of insights you want would help guide the response.",
            originalText: "",
            replacementText:
              "For example, I'd like to know if there are any unexpected spikes or drops " + 
              "in our monthly sales figures, and what might have caused them.",
            alternatives: [],
          },
        ],
      };
    },

    // New method for generating content
    generateContent: async (messages) => {
      // This mock implementation returns a sample generated prompt
      // In a real implementation, this would call the provider's API

      // A slight delay to simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Extract the type from messages to customize the response
      const userMessage =
        messages.find((m) => m.role === "user")?.content || "";
      const promptType =
        (userMessage.match(/promptType:\s*(\w+)/) || [])[1] || "general";

      // Create a sample prompt based on type and purpose
      let promptContent = "";

      if (promptType === "coding" || userMessage.includes("coding")) {
        promptContent = `# Code Generation Prompt

## Task Description
I need you to generate [programming language] code that accomplishes the following task:
[Detailed description of the functionality needed]

## Requirements
- The code should be well-structured and follow best practices
- Include clear comments explaining the logic
- Handle edge cases appropriately
- Optimize for [performance/readability/maintainability]

## Input Format
[Description of input data format or parameters]

## Expected Output
[Description of expected output or behavior]

## Example
[Optional: Example of similar code or input/output examples]

## Additional Notes
- [Any constraints or specific requirements]
- [Any preferences for implementation approach]
- If you have questions about the requirements, please ask for clarification before proceeding.`;
      } else if (
        promptType === "creative" ||
        userMessage.includes("creative")
      ) {
        promptContent = `# Creative Writing Prompt

## Writing Task
Create a [story/poem/script] about [subject] with the following elements:

## Elements to Include
- [Character types or specific characters]
- [Setting details]
- [Themes to explore]
- [Plot elements or structure]

## Style and Tone
- Write in a [formal/casual/poetic/etc.] tone
- Use [first/third] person perspective
- The overall mood should be [descriptive terms for mood]

## Length and Structure
- Approximately [length requirement] in total
- Structure should include [specific structural elements]

## Additional Guidelines
- [Any specific constraints]
- [Any elements to avoid]
- Feel free to be creative while maintaining the core requirements above`;
      } else {
        promptContent = `# General Purpose Prompt

## Objective
[Clear statement of what you need the AI to do]

## Background Context
[Relevant background information that helps understand the task]

## Specific Instructions
1. [First specific instruction or step]
2. [Second specific instruction or step]
3. [Third specific instruction or step]

## Format Requirements
- [How the response should be formatted]
- [Any specific sections to include]
- [Length expectations]

## Examples
[Example of the type of response you're looking for]

## Constraints
- [Time constraints]
- [Topical constraints]
- [Any other limitations]

## Additional Notes
- If anything is unclear, please ask clarifying questions before proceeding
- Prioritize [accuracy/creativity/brevity/etc.] in your response`;
      }

      return promptContent;
    },
  };
}

/**
 * Generate a title from prompt content and questionnaire answers
 *
 * @param {string} content - The generated prompt content
 * @param {Object} answers - The questionnaire answers
 * @returns {string} A generated title
 */
function generateTitleFromContent(content, answers) {
  // Try to extract a title from the content first
  const lines = content.split("\n");

  // Look for a markdown heading
  for (const line of lines) {
    if (line.startsWith("# ")) {
      return line.replace(/^# /, "").trim();
    }
  }

  // If no heading found in content, generate from answers
  if (answers) {
    const purpose = getReadablePurpose(answers.promptPurpose);
    const type = getReadableType(answers.promptType);

    if (purpose && type) {
      return `${type} ${purpose} Prompt`;
    } else if (purpose) {
      return `${purpose} Prompt`;
    } else if (type) {
      return `${type} Prompt`;
    }
  }

  // Last resort
  return "Generated Prompt";
}

/**
 * Generate suggested tags from questionnaire answers
 *
 * @param {Object} answers - The questionnaire answers
 * @returns {Array<string>} Array of suggested tags
 */
function generateTagsFromAnswers(answers) {
  const tags = [];

  // Add type and purpose as tags
  if (answers.promptType) {
    tags.push(answers.promptType);
  }

  if (answers.promptPurpose) {
    tags.push(answers.promptPurpose);
  }

  // Add audience as tag if available
  if (answers.audience) {
    tags.push(answers.audience);
  }

  // Add tone as tag if available
  if (answers.tone) {
    tags.push(answers.tone);
  }

  // Add components as tags if available
  if (answers.components && Array.isArray(answers.components)) {
    answers.components.forEach((component) => {
      if (!tags.includes(component)) {
        tags.push(component);
      }
    });
  }

  // Return up to 5 tags
  return tags.slice(0, 5);
}

/**
 * Get a readable version of the prompt purpose
 *
 * @param {string} purposeId - The purpose ID
 * @returns {string} Readable purpose name
 */
function getReadablePurpose(purposeId) {
  switch (purposeId) {
    case "information":
      return "Information Extraction";
    case "generation":
      return "Content Generation";
    case "transformation":
      return "Content Transformation";
    case "analysis":
      return "Analysis & Reasoning";
    case "conversation":
      return "Conversation Design";
    default:
      return purposeId
        ? purposeId.charAt(0).toUpperCase() + purposeId.slice(1)
        : "General";
  }
}

/**
 * Get a readable version of the prompt type
 *
 * @param {string} typeId - The type ID
 * @returns {string} Readable type name
 */
function getReadableType(typeId) {
  switch (typeId) {
    case "general":
      return "General Purpose";
    case "coding":
      return "Code Generation";
    case "creative":
      return "Creative Writing";
    case "analytical":
      return "Analytical";
    case "instructional":
      return "Instructional";
    case "conversational":
      return "Conversational";
    default:
      return typeId
        ? typeId.charAt(0).toUpperCase() + typeId.slice(1)
        : "Custom";
  }
}
