/**
 * Prompt templates for AI analysis
 *
 * Contains system prompts and templates used for prompt analysis and generation
 */

/**
 * Build the system prompt for analysis based on requested aspects
 *
 * @param {Array<string>} aspects - Aspects to analyze
 * @returns {string} The system prompt
 */
function buildAnalysisSystemPrompt(
  aspects = ["clarity", "conciseness", "context", "specificity", "formatting"],
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
 * System prompt for prompt generation based on questionnaire answers
 */
const promptGenerationSystem = `You are an expert AI prompt engineer. Your task is to create a 
well-structured, effective prompt based on the questionnaire answers provided.
Create a prompt that matches the requirements in the questionnaire answers exactly.
Format your response as a complete, well-structured markdown document with appropriate 
headings and sections.
Focus on clarity, specificity, and providing enough context for the AI to understand 
the request precisely.
The prompt should be ready to use without further modification.`;

export { buildAnalysisSystemPrompt, promptGenerationSystem };
