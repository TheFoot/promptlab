const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Generate a prompt based on questionnaire answers
 *
 * @param {Object} answers - User's answers to questionnaire
 * @returns {Promise<Object>} Generated prompt with sections
 */
async function generateFromQuestionnaire(answers) {
  try {
    // Build a prompt template to send to the AI analysis API (used in debug logs)
    Object.entries(answers)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }
        return `${key}: ${value}`;
      })
      .join("\n");

    // Use the dedicated prompt generation endpoint instead of analysis
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answers,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate prompt: ${response.statusText}`);
    }

    const result = await response.json();

    // The dedicated endpoint provides data in the exact format we need
    if (result && typeof result === "object" && result.content) {
      // Deduplicate tags if they exist
      let uniqueTags = [];
      if (result.suggestedTags && result.suggestedTags.length > 0) {
        // Create a Set to ensure uniqueness and convert back to array
        uniqueTags = [...new Set(result.suggestedTags)];
      }

      return {
        content: result.content,
        title: result.title || generateTitleFromContent(result.content),
        suggestedTags: uniqueTags,
      };
    }

    // Only fall back to mock implementation if the response doesn't contain content
    console.log(
      "Falling back to mock implementation - unexpected API response format",
    );
    return await mockGenerateFromQuestionnaire(answers);
  } catch (error) {
    console.error("Error in generateFromQuestionnaire:", error);
    // Always fall back to mock implementation on error
    return await mockGenerateFromQuestionnaire(answers);
  }
}

/**
 * Generate a title from prompt content
 *
 * @param {string} content - The prompt content
 * @returns {string} A generated title
 */
function generateTitleFromContent(content) {
  if (!content) return "New Prompt";

  // Try to get the first heading as the title
  const lines = content.split("\n");

  for (const line of lines) {
    if (line.startsWith("# ")) {
      return line.replace(/^# /, "").trim();
    }
  }

  // If no heading found, use the first sentence (up to 50 chars)
  const firstSentence = content.split(".")[0];
  if (firstSentence && firstSentence.length > 5) {
    return (
      firstSentence.substring(0, 50) + (firstSentence.length > 50 ? "..." : "")
    );
  }

  // Last resort
  return "Generated Prompt";
}

/**
 * Refine an existing prompt based on specific instructions
 *
 * @param {string} content - The existing prompt content
 * @param {string} instructions - Refinement instructions
 * @returns {Promise<Object>} Refined prompt and suggested changes
 */
async function refinePrompt(content, instructions) {
  try {
    // Create a prompt for the AI that includes the original content and refinement instructions
    const promptText = `
Original Prompt:
\`\`\`
${content}
\`\`\`

Refinement Instructions:
${instructions}

Please analyze this prompt and provide an improved version based on the refinement instructions.
`;

    // Use the AI analysis endpoint
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText,
        analysisAspects: ["improvement", "clarity", "specificity"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refine prompt: ${response.statusText}`);
    }

    const result = await response.json();

    // Check if we got a valid response
    if (result && result.suggestions && result.suggestions.length > 0) {
      // Find the suggestion with the most comprehensive replacement text
      let bestSuggestion = result.suggestions.reduce(
        (best, current) => {
          if (!best.replacementText) return current;
          if (!current.replacementText) return best;
          return current.replacementText.length > best.replacementText.length
            ? current
            : best;
        },
        { replacementText: "" },
      );

      // Return the refined content
      if (
        bestSuggestion.replacementText &&
        bestSuggestion.replacementText.length > content.length / 2
      ) {
        return {
          content: bestSuggestion.replacementText,
          suggestedChanges: [
            {
              type: bestSuggestion.category || "refinement",
              description:
                bestSuggestion.description ||
                "Improved based on your instructions",
              originalText: bestSuggestion.originalText || content,
              replacementText: bestSuggestion.replacementText,
            },
          ],
        };
      }
    }

    // Fall back to the mock implementation if we couldn't extract useful refinements
    return await mockRefinePrompt(content, instructions);
  } catch (error) {
    console.error("Error in refinePrompt:", error);
    throw error;
  }
}

/**
 * Generate specific sections for a prompt
 *
 * @param {string} type - The prompt type
 * @param {Array} sections - Section specifications
 * @returns {Promise<Object>} Generated sections
 */
async function generateSections(type, sections) {
  try {
    // Create a prompt that asks the AI to generate specific sections
    const sectionNames = sections.map((s) => s.name || s.id).join(", ");
    const promptText = `
I need to create a prompt of type "${type}". Please help me generate the following sections for my prompt:
${sectionNames}

For each section, provide well-written content that would be appropriate for a prompt of this type.
Format your response with markdown headings for each section name.
`;

    // Use the AI analysis endpoint
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText,
        analysisAspects: ["completeness", "clarity", "structure"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate sections: ${response.statusText}`);
    }

    const result = await response.json();

    // Parse the response to extract the sections
    if (result && result.suggestions && result.suggestions.length > 0) {
      // Find the suggestion with the most comprehensive replacement text
      const bestSuggestion = result.suggestions.reduce(
        (best, current) => {
          if (!best.replacementText) return current;
          if (!current.replacementText) return best;
          return current.replacementText.length > best.replacementText.length
            ? current
            : best;
        },
        { replacementText: "" },
      );

      if (bestSuggestion.replacementText) {
        // Extract sections from the generated markdown
        const content = bestSuggestion.replacementText;
        const extractedSections = extractSectionsFromContent(content, sections);

        if (Object.keys(extractedSections).length > 0) {
          return { sections: extractedSections };
        }
      }
    }

    // Fall back to generating mock sections if we couldn't extract useful content
    return {
      sections: sections.reduce((acc, section) => {
        acc[section.id] = generateMockSectionContent(
          type,
          section.name || section.id,
        );
        return acc;
      }, {}),
    };
  } catch (error) {
    console.error("Error in generateSections:", error);
    throw error;
  }
}

/**
 * Helper function to extract sections from generated content
 */
function extractSectionsFromContent(content, requestedSections) {
  const extractedSections = {};
  const lines = content.split("\n");

  let currentSection = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check if this is a heading that starts a section
    if (line.startsWith("##") || line.startsWith("# ")) {
      // If we have a current section, save it
      if (currentSection && currentContent.length > 0) {
        const matchingSection = requestedSections.find((s) => {
          const name = s.name || s.id;
          return currentSection.toLowerCase().includes(name.toLowerCase());
        });

        if (matchingSection) {
          extractedSections[matchingSection.id] = currentContent
            .join("\n")
            .trim();
        }
      }

      // Start a new section
      currentSection = line.replace(/^#+\s*/, "");
      currentContent = [];
    }
    // If we're in a section, add the line to its content
    else if (currentSection) {
      currentContent.push(line);
    }
  }

  // Add the last section
  if (currentSection && currentContent.length > 0) {
    const matchingSection = requestedSections.find((s) => {
      const name = s.name || s.id;
      return currentSection.toLowerCase().includes(name.toLowerCase());
    });

    if (matchingSection) {
      extractedSections[matchingSection.id] = currentContent.join("\n").trim();
    }
  }

  return extractedSections;
}

/**
 * Generate mock content for a section based on type and name
 */
function generateMockSectionContent(type, sectionName) {
  const sectionNameLower = sectionName.toLowerCase();

  if (sectionNameLower.includes("instruction")) {
    return `Instructions for how to use this ${type} prompt effectively. Be specific about what you want the AI to do.`;
  } else if (sectionNameLower.includes("example")) {
    return `Here's an example of the expected format and content for this ${type} prompt.`;
  } else if (sectionNameLower.includes("context")) {
    return `Provide relevant background information to help the AI understand the context of your request.`;
  } else if (sectionNameLower.includes("format")) {
    return `Specify the desired format for the AI's response to ensure it meets your requirements.`;
  } else {
    return `Content for the ${sectionName} section of your ${type} prompt.`;
  }
}

/**
 * Analyze a prompt for improvement suggestions
 *
 * @param {string} content - The prompt content to analyze
 * @returns {Promise<Object>} Analysis results and suggestions
 */
async function analyzePrompt(content) {
  try {
    // Use the available AI analysis endpoint directly
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText: content,
        analysisAspects: [
          "clarity",
          "specificity",
          "structure",
          "completeness",
        ],
        includeAlternatives: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze prompt: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in analyzePrompt:", error);
    throw error;
  }
}

/**
 * Generate prompt improvements based on test results
 *
 * @param {string} content - Current prompt content
 * @param {Object} testResults - Results from testing the prompt
 * @returns {Promise<Object>} Suggested improvements
 */
async function generateImprovements(content, testResults) {
  try {
    // Create a prompt that includes the test results for improvement suggestions
    const testResultsStr = JSON.stringify(testResults, null, 2);
    const promptText = `
Original Prompt:
\`\`\`
${content}
\`\`\`

Test Results:
\`\`\`json
${testResultsStr}
\`\`\`

Based on these test results, please analyze the prompt and suggest improvements to make it more effective.
`;

    // Use the AI analysis endpoint
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText,
        analysisAspects: ["improvement", "clarity", "specificity"],
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to generate improvements: ${response.statusText}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in generateImprovements:", error);
    throw error;
  }
}

/**
 * Generate a title and tags for a prompt
 *
 * @param {string} content - The prompt content
 * @returns {Promise<Object>} Generated title and tags
 */
async function generateTitleAndTags(content) {
  try {
    // Create a prompt asking for title and tag suggestions
    const promptText = `
Prompt Content:
\`\`\`
${content}
\`\`\`

Please suggest an appropriate title and 3-5 relevant tags for this prompt.
`;

    // Use the AI analysis endpoint
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText,
        analysisAspects: ["completeness"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to generate metadata: ${response.statusText}`);
    }

    const result = await response.json();

    // Extract title and tags from the analysis result
    let title = generateTitleFromContent(content);
    let tags = [];

    if (result && result.summary) {
      // Try to extract title and tags from the summary
      const lines = result.summary.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().includes("title:")) {
          const extracted = line.split("title:")[1]?.trim();
          if (extracted && extracted.length > 3) {
            title = extracted;
          }
        } else if (line.toLowerCase().includes("tags:")) {
          const extracted = line.split("tags:")[1]?.trim();
          if (extracted) {
            // Split by commas or spaces
            tags = extracted.split(/[,\s]+/).filter((tag) => tag.length > 0);
          }
        }
      }
    }

    // If we couldn't extract from summary, try suggestions
    if (
      tags.length === 0 &&
      result.suggestions &&
      result.suggestions.length > 0
    ) {
      // Try to find a suggestion that mentions tags
      const tagSuggestion = result.suggestions.find(
        (s) => s.description && s.description.toLowerCase().includes("tag"),
      );

      if (tagSuggestion && tagSuggestion.replacementText) {
        const extractedTags = tagSuggestion.replacementText
          .split(/[,\s]+/)
          .filter(
            (tag) =>
              tag.length > 0 && !["tags", "tag"].includes(tag.toLowerCase()),
          );

        if (extractedTags.length > 0) {
          tags = extractedTags;
        }
      }
    }

    return {
      title,
      tags,
    };
  } catch (error) {
    console.error("Error in generateTitleAndTags:", error);

    // Fall back to basic extraction if API fails
    return {
      title: generateTitleFromContent(content),
      tags: extractTagsFromContent(content),
    };
  }
}

/**
 * Extract potential tags from content
 */
function extractTagsFromContent(content) {
  if (!content) return [];

  const tags = new Set();
  const lines = content.split("\n");

  // Common words that might indicate the type of prompt
  const typeIndicators = [
    "code",
    "creative",
    "write",
    "generate",
    "analyze",
    "explain",
    "summarize",
    "compare",
  ];

  // Check the first heading for key terms
  const firstHeading = lines.find((line) => line.startsWith("# "));
  if (firstHeading) {
    const words = firstHeading.toLowerCase().split(/\W+/);
    for (const word of words) {
      if (word.length > 3 && typeIndicators.includes(word)) {
        tags.add(word);
      }
    }
  }

  // Look for section headings that might indicate prompt purpose
  for (const line of lines) {
    if (line.startsWith("## ")) {
      const sectionName = line.replace(/^##\s*/, "").toLowerCase();
      if (
        ["instructions", "context", "examples", "format", "output"].includes(
          sectionName,
        )
      ) {
        tags.add(sectionName);
      }
    }
  }

  return Array.from(tags).slice(0, 5);
}

/**
 * Compare two prompt versions and generate a diff analysis
 *
 * @param {string} originalContent - The original prompt content
 * @param {string} newContent - The new prompt content
 * @returns {Promise<Object>} Diff analysis with explanations
 */
async function comparePrompts(originalContent, newContent) {
  try {
    // Create a prompt that asks the AI to compare versions
    const promptText = `
Original Prompt Version:
\`\`\`
${originalContent}
\`\`\`

New Prompt Version:
\`\`\`
${newContent}
\`\`\`

Please compare these two prompt versions and identify the key differences, improvements, and potential issues in the changes.
`;

    // Use the AI analysis endpoint
    const response = await fetch(`${API_BASE_URL}/api/ai-analysis/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        promptText,
        analysisAspects: ["comparison", "improvement"],
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to compare prompts: ${response.statusText}`);
    }

    const result = await response.json();

    // Format the response as a diff analysis
    return {
      comparison: result.summary || "Comparison analysis not available",
      differences: result.suggestions
        ? result.suggestions.map((s) => ({
            type: s.category || "difference",
            description: s.description || s.title || "Change detected",
            originalText: s.originalText || "(Not specified)",
            newText: s.replacementText || "(Not specified)",
          }))
        : [
            {
              type: "note",
              description:
                "The content has changed, but detailed comparison is not available.",
            },
          ],
    };
  } catch (error) {
    console.error("Error in comparePrompts:", error);

    // Simple fallback just noting there are differences
    return {
      comparison: "Analysis not available",
      differences: [
        {
          type: "note",
          description:
            "The content has changed, but detailed comparison is not available.",
        },
      ],
    };
  }
}

// Fallback implementations for development and testing

/**
 * Fallback for generateFromQuestionnaire
 *
 * @param {Object} answers - User's answers
 * @returns {Promise<Object>} Mock generated prompt
 */
async function mockGenerateFromQuestionnaire(answers) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Extract key information from answers
  const goal = answers.goal || "provide information";
  const audience = getAudienceDescription(answers.audience);
  const tone = getToneDescription(answers.tone);
  const length = getLengthDescription(answers.length);
  const components = getComponentDescriptions(answers.components);
  const constraints = answers.constraints || "";

  // Generate a title based on purpose and type
  let title = "";
  switch (answers.promptPurpose) {
    case "information":
      title = "Information Extraction Prompt";
      break;
    case "generation":
      title = "Content Generation Prompt";
      break;
    case "transformation":
      title = "Content Transformation Prompt";
      break;
    case "analysis":
      title = "Analysis & Reasoning Prompt";
      break;
    case "conversation":
      title = "Conversation Design Prompt";
      break;
    default:
      title = "Custom Prompt";
  }

  if (answers.promptType) {
    switch (answers.promptType) {
      case "general":
        title = `General ${title}`;
        break;
      case "coding":
        title = `Code ${title}`;
        break;
      case "creative":
        title = `Creative ${title}`;
        break;
      case "analytical":
        title = `Analytical ${title}`;
        break;
      case "instructional":
        title = `Instructional ${title}`;
        break;
      case "conversational":
        title = `Conversational ${title}`;
        break;
    }
  }

  // Generate mock content based on answers
  const content = `# ${title}

## Goal
${goal}

## Instructions
You are tasked with ${goal}. Please provide a response that is ${length} and uses a ${tone} tone appropriate for ${audience}.

${constraints ? `## Constraints\n${constraints}\n` : ""}

## Output Requirements
Please ensure your response includes:
${components.map((c) => `- ${c}`).join("\n")}

## Example
[Provide a brief example of what you expect the output to look like]

## Additional Notes
- Take your time to provide a well-thought-out response
- If you need clarification on any aspect of this request, please ask
- If you cannot fulfill any part of this request, explain why`;

  // Generate suggested tags
  const suggestedTags = new Set(); // Use a Set to automatically prevent duplicates

  if (answers.promptType) {
    suggestedTags.add(answers.promptType);
  }

  if (answers.promptPurpose) {
    suggestedTags.add(answers.promptPurpose);
  }

  if (answers.audience) {
    suggestedTags.add(answers.audience);
  }

  if (answers.tone) {
    suggestedTags.add(answers.tone);
  }

  // Add components as tags
  if (answers.components && Array.isArray(answers.components)) {
    answers.components.forEach((component) => {
      suggestedTags.add(component);
    });
  }

  // Convert back to array and limit to 5 tags
  const uniqueTags = [...suggestedTags].slice(0, 5);

  return {
    content,
    title,
    suggestedTags: uniqueTags,
  };
}

/**
 * Helper function to get audience description
 */
function getAudienceDescription(audience) {
  switch (audience) {
    case "technical":
      return "a technical audience with specialized knowledge";
    case "non-technical":
      return "a non-technical audience without specialized knowledge";
    case "mixed":
      return "a mixed audience with varying levels of expertise";
    case "children":
      return "children, requiring simplified explanations";
    default:
      return "a general audience";
  }
}

/**
 * Helper function to get tone description
 */
function getToneDescription(tone) {
  switch (tone) {
    case "formal":
      return "formal and professional";
    case "casual":
      return "casual and conversational";
    case "educational":
      return "educational and instructive";
    case "creative":
      return "creative and imaginative";
    case "technical":
      return "technical and precise";
    default:
      return "balanced and neutral";
  }
}

/**
 * Helper function to get length description
 */
function getLengthDescription(length) {
  if (!length) return "moderate in length";

  const lengthNum = parseInt(length);
  if (isNaN(lengthNum)) return "moderate in length";

  if (lengthNum <= 1) return "very concise and brief";
  if (lengthNum === 2) return "concise but thorough";
  if (lengthNum === 3) return "moderate in length with reasonable detail";
  if (lengthNum === 4) return "detailed and comprehensive";
  if (lengthNum >= 5) return "extremely detailed and comprehensive";

  return "moderate in length";
}

/**
 * Helper function to get component descriptions
 */
function getComponentDescriptions(components) {
  if (!components || !Array.isArray(components) || components.length === 0) {
    return [
      "Relevant information on the subject",
      "Clear explanation of key concepts",
    ];
  }

  const descriptions = [];

  if (components.includes("examples")) {
    descriptions.push("Practical examples to illustrate concepts");
  }

  if (components.includes("steps")) {
    descriptions.push("Step-by-step instructions or procedures");
  }

  if (components.includes("context")) {
    descriptions.push("Background context or historical information");
  }

  if (components.includes("visuals")) {
    descriptions.push("Descriptive language that creates visual imagery");
  }

  if (components.includes("data")) {
    descriptions.push("Relevant data or statistics");
  }

  if (components.includes("analogies")) {
    descriptions.push("Helpful analogies or metaphors to simplify concepts");
  }

  return descriptions.length > 0
    ? descriptions
    : ["Clear explanation of key concepts"];
}

/**
 * Fallback for refinePrompt
 *
 * @param {string} content - Original content
 * @param {string} instructions - Refinement instructions
 * @returns {Promise<Object>} Mock refined prompt
 */
async function mockRefinePrompt(content, instructions) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simple refinement that adds a section based on instructions
  const refinedContent = `${content}\n\n## Refinements based on: "${instructions}"\n- Added additional clarity\n- Improved structure\n- Enhanced specificity`;

  return {
    content: refinedContent,
    suggestedChanges: [
      {
        type: "addition",
        description: "Added refinement section based on your instructions",
        reason: "To incorporate your feedback directly into the prompt",
      },
    ],
  };
}

export {
  generateFromQuestionnaire,
  refinePrompt,
  generateSections,
  analyzePrompt,
  generateImprovements,
  generateTitleAndTags,
  comparePrompts,
  // Fallback implementations
  mockGenerateFromQuestionnaire,
  mockRefinePrompt,
};
