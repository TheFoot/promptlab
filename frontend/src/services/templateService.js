const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Get templates matching specified filters
 *
 * @param {Object} filters - Filter criteria
 * @param {string} filters.type - Prompt type
 * @param {string} filters.purpose - Prompt purpose
 * @param {Array} filters.tags - Tags to filter by
 * @param {string} filters.search - Search text
 * @returns {Promise<Array>} Matching templates
 */
async function getTemplates(filters = {}) {
  try {
    const queryParams = new URLSearchParams();

    // Map our filters to the appropriate query parameters for the prompts API
    if (filters.search) queryParams.append("search", filters.search);
    if (filters.tags && filters.tags.length) {
      // Use the first tag as the tag filter
      queryParams.append("tag", filters.tags[0]);
    } else if (filters.type) {
      // If no specific tags provided, use the type as a tag filter
      queryParams.append("tag", filters.type);
    } else if (filters.purpose) {
      // If no type either, use the purpose as a tag
      queryParams.append("tag", filters.purpose);
    }

    // Use the prompts API as a replacement for templates
    const response = await fetch(
      `${API_BASE_URL}/api/prompts?${queryParams.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    // Transform the prompts into the template format
    const prompts = await response.json();

    return prompts
      .map((prompt) => ({
        id: prompt._id,
        name: prompt.title,
        description: getDescriptionFromContent(prompt.content),
        content: prompt.content,
        type: getTypeFromTags(prompt.tags),
        purpose: getPurposeFromTags(prompt.tags),
        tags: prompt.tags,
        metadata: {
          creator: prompt.createdBy ? "user" : "system",
          popularity: Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * 50) + 1, // Placeholder
          featured: false,
        },
      }))
      .filter((template) => {
        // Apply additional client-side filtering
        let matches = true;

        if (filters.type && template.type !== filters.type) {
          matches = false;
        }

        if (filters.purpose && template.purpose !== filters.purpose) {
          matches = false;
        }

        // If multiple tags were specified, check that all are present
        if (filters.tags && filters.tags.length > 1) {
          const lowerTags = template.tags.map((t) => t.toLowerCase());
          matches = filters.tags.every((tag) =>
            lowerTags.includes(tag.toLowerCase()),
          );
        }

        return matches;
      });
  } catch (error) {
    console.error("Error in getTemplates:", error);
    throw error;
  }
}

/**
 * Get a specific template by ID
 *
 * @param {string} id - The template ID
 * @returns {Promise<Object>} The template
 */
async function getTemplateById(id) {
  try {
    // Use the prompts API with the prompt ID
    const response = await fetch(`${API_BASE_URL}/api/prompts/${id}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }

    // Transform the prompt into the template format
    const prompt = await response.json();

    return {
      id: prompt._id,
      name: prompt.title,
      description: getDescriptionFromContent(prompt.content),
      content: prompt.content,
      type: getTypeFromTags(prompt.tags),
      purpose: getPurposeFromTags(prompt.tags),
      tags: prompt.tags,
      sections: extractSectionsFromContent(prompt.content),
      metadata: {
        creator: prompt.createdBy ? "user" : "system",
        popularity: Math.floor(Math.random() * 50) + 1, // Placeholder
        featured: false,
      },
    };
  } catch (error) {
    console.error("Error in getTemplateById:", error);
    throw error;
  }
}

/**
 * Apply a template with customizations
 *
 * @param {string} templateId - The template ID
 * @param {Object} customizations - Customization values for template variables
 * @returns {Promise<Object>} The customized template content
 */
async function applyTemplate(templateId, customizations = {}) {
  try {
    // First get the template by ID
    const template = await getTemplateById(templateId);

    // Apply the customizations to the template content
    let customizedContent = template.content;

    // Replace placeholders in the content
    for (const [key, value] of Object.entries(customizations)) {
      // Create a regex that matches [KEY] with case insensitivity
      const regex = new RegExp(`\\[${key}\\]`, "gi");
      customizedContent = customizedContent.replace(regex, value);
    }

    // Return the customized template
    return {
      ...template,
      content: customizedContent,
      customized: true,
    };
  } catch (error) {
    console.error("Error in applyTemplate:", error);
    throw error;
  }
}

/**
 * Helper function to extract sections from content
 *
 * @param {string} content - Template content
 * @returns {Array} Extracted sections
 */
function extractSectionsFromContent(content) {
  if (!content) return [];

  const sections = [];
  const lines = content.split("\n");

  let currentSection = null;
  let sectionId = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this is a heading that should start a new section
    if (line.startsWith("##")) {
      // If we have a current section, finalize it
      if (currentSection) {
        sections.push(currentSection);
      }

      // Extract the section name (remove the ## and trim)
      const name = line.replace(/^##\s*/, "").trim();

      // Start a new section
      sectionId++;
      currentSection = {
        id: `section_${sectionId}`,
        name,
        content: "",
        isRequired:
          name.toLowerCase().includes("required") ||
          name.toLowerCase() === "instructions" ||
          name.toLowerCase() === "context",
        isCustomizable: line.includes("[") && line.includes("]"),
      };
    }
    // If we're in a section, add the line to its content
    else if (currentSection) {
      if (currentSection.content) {
        currentSection.content += "\n" + line;
      } else {
        currentSection.content = line;
      }

      // Check if this line has customizable content
      if (line.includes("[") && line.includes("]")) {
        currentSection.isCustomizable = true;
      }
    }
  }

  // Add the last section if there is one
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Save a user-created template
 *
 * @param {Object} template - The template to save
 * @param {string} template.name - Template name
 * @param {string} template.description - Template description
 * @param {string} template.content - Template content
 * @param {string} template.type - Template type
 * @param {string} template.purpose - Template purpose
 * @param {Array} template.tags - Template tags
 * @param {Array} template.sections - Template sections
 * @returns {Promise<Object>} The saved template
 */
async function saveUserTemplate(template) {
  try {
    // Convert template format to prompt format
    const promptData = {
      title: template.name,
      content: template.content,
      // Combine type, purpose, and any existing tags
      tags: [
        ...(template.type ? [template.type] : []),
        ...(template.purpose ? [template.purpose] : []),
        ...(template.tags || []),
      ],
    };

    // Use the prompts API to save
    const response = await fetch(`${API_BASE_URL}/api/prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(promptData),
    });

    if (!response.ok) {
      throw new Error(`Failed to save template: ${response.statusText}`);
    }

    // Get the saved prompt and convert back to template format
    const prompt = await response.json();

    return {
      id: prompt._id,
      name: prompt.title,
      description:
        template.description || getDescriptionFromContent(prompt.content),
      content: prompt.content,
      type: template.type || getTypeFromTags(prompt.tags),
      purpose: template.purpose || getPurposeFromTags(prompt.tags),
      tags: prompt.tags,
      sections: template.sections || extractSectionsFromContent(prompt.content),
      metadata: {
        creator: "user",
        popularity: 0,
        featured: false,
      },
    };
  } catch (error) {
    console.error("Error in saveUserTemplate:", error);
    throw error;
  }
}

/**
 * Update an existing template
 *
 * @param {string} id - The template ID
 * @param {Object} template - The updated template data
 * @returns {Promise<Object>} The updated template
 */
async function updateTemplate(id, template) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(template),
    });

    if (!response.ok) {
      throw new Error(`Failed to update template: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in updateTemplate:", error);
    throw error;
  }
}

/**
 * Delete a template
 *
 * @param {string} id - The template ID
 * @returns {Promise<Object>} Deletion confirmation
 */
async function deleteTemplate(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in deleteTemplate:", error);
    throw error;
  }
}

/**
 * Get template types
 *
 * @returns {Promise<Array>} List of template types
 */
async function getTemplateTypes() {
  try {
    // Use the available analysis templates endpoint as these contain type information
    const response = await fetch(
      `${API_BASE_URL}/api/ai-analysis/analysis-templates`,
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch template types: ${response.statusText}`);
    }

    // Transform the response to match the expected format for template types
    const templates = await response.json();
    return templates.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      icon: getIconForType(template.id),
      aspects: template.aspects,
    }));
  } catch (error) {
    console.error("Error in getTemplateTypes:", error);
    throw error;
  }
}

/**
 * Helper function to get an appropriate icon for each template type
 */
function getIconForType(type) {
  const icons = {
    general: "fas fa-globe",
    coding: "fas fa-code",
    creative: "fas fa-feather-alt",
    concise: "fas fa-compress-alt",
  };

  return icons[type] || "fas fa-file-alt";
}

/**
 * Get template purposes
 *
 * @returns {Promise<Array>} List of template purposes
 */
async function getTemplatePurposes() {
  try {
    // Use the available tags endpoint as a source for categories/purposes
    const response = await fetch(`${API_BASE_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch template purposes: ${response.statusText}`,
      );
    }

    // Get all tags and filter/transform to purposes
    await response.json(); // Not using tags directly, using predefined purposeIds

    // Define the core purposes we want to support
    const purposeIds = [
      "information",
      "generation",
      "transformation",
      "analysis",
      "conversation",
    ];

    // Create purpose objects from the core purpose IDs
    return purposeIds.map((id) => ({
      id,
      name: getPurposeName(id),
      description: getPurposeDescription(id),
      icon: getPurposeIcon(id),
    }));
  } catch (error) {
    console.error("Error in getTemplatePurposes:", error);
    throw error;
  }
}

/**
 * Helper function to get a formatted name for each purpose
 */
function getPurposeName(id) {
  const names = {
    information: "Information Extraction",
    generation: "Content Generation",
    transformation: "Content Transformation",
    analysis: "Analysis & Reasoning",
    conversation: "Conversation Design",
  };

  return names[id] || id.charAt(0).toUpperCase() + id.slice(1);
}

/**
 * Helper function to get a description for each purpose
 */
function getPurposeDescription(id) {
  const descriptions = {
    information: "Extract specific information or insights from data or text",
    generation:
      "Generate creative or structured content like text, code, or ideas",
    transformation: "Transform content from one format or style to another",
    analysis: "Analyze data or situations and provide reasoned conclusions",
    conversation: "Create conversational agents or structured dialogues",
  };

  return descriptions[id] || "Custom purpose for specialized use cases";
}

/**
 * Helper function to get an icon for each purpose
 */
function getPurposeIcon(id) {
  const icons = {
    information: "fas fa-search",
    generation: "fas fa-pen-fancy",
    transformation: "fas fa-exchange-alt",
    analysis: "fas fa-chart-line",
    conversation: "fas fa-comments",
  };

  return icons[id] || "fas fa-lightbulb";
}

/**
 * Analyze template variables
 *
 * @param {string} content - Template content to analyze
 * @returns {Promise<Object>} Analysis results with variables
 */
async function analyzeTemplateVariables(content) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/templates/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze template: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in analyzeTemplateVariables:", error);
    throw error;
  }
}

/**
 * Get featured templates
 *
 * @param {number} limit - Maximum number of templates to return
 * @returns {Promise<Array>} Featured templates
 */
async function getFeaturedTemplates(limit = 5) {
  try {
    // Use the prompts API with a limit parameter as a replacement
    const response = await fetch(`${API_BASE_URL}/api/prompts?limit=${limit}`);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch featured templates: ${response.statusText}`,
      );
    }

    // Transform the prompts into the template format
    const prompts = await response.json();
    return prompts.map((prompt) => ({
      id: prompt._id,
      name: prompt.title,
      description: getDescriptionFromContent(prompt.content),
      content: prompt.content,
      type: getTypeFromTags(prompt.tags),
      purpose: getPurposeFromTags(prompt.tags),
      tags: prompt.tags,
      metadata: {
        creator: "system",
        popularity: Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * 100) + 50, // Placeholder
        featured: true,
      },
    }));
  } catch (error) {
    console.error("Error in getFeaturedTemplates:", error);
    throw error;
  }
}

/**
 * Get templates created by the current user
 *
 * @returns {Promise<Array>} User templates
 */
async function getUserTemplates() {
  try {
    // Use the prompts API to get all prompts (will include the user's prompts)
    const response = await fetch(`${API_BASE_URL}/api/prompts`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user templates: ${response.statusText}`);
    }

    // Transform the prompts into the template format
    const prompts = await response.json();

    // For now, treat all as user templates
    return prompts.map((prompt) => ({
      id: prompt._id,
      name: prompt.title,
      description: getDescriptionFromContent(prompt.content),
      content: prompt.content,
      type: getTypeFromTags(prompt.tags),
      purpose: getPurposeFromTags(prompt.tags),
      tags: prompt.tags,
      metadata: {
        creator: "user",
        popularity: Math.floor(crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1) * 20) + 1, // Placeholder
        featured: false,
      },
    }));
  } catch (error) {
    console.error("Error in getUserTemplates:", error);
    throw error;
  }
}

/**
 * Helper function to extract a description from the prompt content
 */
function getDescriptionFromContent(content) {
  if (!content) return "A custom prompt template";

  // Try to find a meaningful description in the content
  const lines = content.split("\n");

  // First look for a description after a heading
  for (let i = 0; i < lines.length - 1; i++) {
    if (
      lines[i].startsWith("##") &&
      lines[i].toLowerCase().includes("description")
    ) {
      const nextLine = lines[i + 1];
      if (nextLine && nextLine.trim() && !nextLine.startsWith("#")) {
        return (
          nextLine.trim().substring(0, 120) +
          (nextLine.length > 120 ? "..." : "")
        );
      }
    }
  }

  // Otherwise, get the first non-empty, non-heading line
  for (const line of lines) {
    if (line.trim() && !line.startsWith("#")) {
      return line.trim().substring(0, 120) + (line.length > 120 ? "..." : "");
    }
  }

  return "A custom prompt template";
}

/**
 * Helper function to determine type from tags
 */
function getTypeFromTags(tags) {
  if (!tags || !tags.length) return "general";

  const typeMapping = {
    code: "coding",
    creative: "creative",
    analysis: "analytical",
    data: "analytical",
    conversation: "conversational",
    instruction: "instructional",
  };

  for (const tag of tags) {
    const lowercaseTag = tag.toLowerCase();
    for (const [key, value] of Object.entries(typeMapping)) {
      if (lowercaseTag.includes(key)) {
        return value;
      }
    }
  }

  return "general";
}

/**
 * Helper function to determine purpose from tags
 */
function getPurposeFromTags(tags) {
  if (!tags || !tags.length) return "generation";

  const purposeMapping = {
    extract: "information",
    research: "information",
    generate: "generation",
    create: "generation",
    write: "generation",
    transform: "transformation",
    convert: "transformation",
    analyze: "analysis",
    understand: "analysis",
    chat: "conversation",
    dialog: "conversation",
  };

  for (const tag of tags) {
    const lowercaseTag = tag.toLowerCase();
    for (const [key, value] of Object.entries(purposeMapping)) {
      if (lowercaseTag.includes(key)) {
        return value;
      }
    }
  }

  return "generation";
}

// Fallback implementations for development or testing
const fallbackTemplates = [
  {
    id: "general-info-1",
    name: "General Information Prompt",
    description:
      "A versatile prompt for requesting factual information on any topic",
    content: `# Information Request

## Topic
[TOPIC]

## Background
I need comprehensive information about the topic above.

## Specific Questions
- What is [TOPIC] and why is it important?
- What is the history and origin of [TOPIC]?
- What are the key components or principles of [TOPIC]?
- How is [TOPIC] used or applied in the real world?
- What are common misconceptions about [TOPIC]?

## Output Format
Please structure your response with clear headings and bullet points where appropriate. Include specific examples to illustrate key points.`,
    type: "general",
    purpose: "information",
    tags: ["information", "research", "factual"],
    sections: [
      {
        id: "topic",
        name: "Topic",
        content: "[TOPIC]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "background",
        name: "Background",
        content: "I need comprehensive information about the topic above.",
        isRequired: false,
        isCustomizable: true,
      },
      {
        id: "questions",
        name: "Specific Questions",
        content:
          "- What is [TOPIC] and why is it important?\n- What is the history and origin of [TOPIC]?\n- What are the key components or principles of [TOPIC]?\n- How is [TOPIC] used or applied in the real world?\n- What are common misconceptions about [TOPIC]?",
        isRequired: true,
        isCustomizable: true,
      },
    ],
    metadata: {
      creator: "system",
      popularity: 124,
      rating: 4.7,
      featured: true,
    },
  },
  {
    id: "code-optimization-1",
    name: "Code Optimization Prompt",
    description:
      "A prompt template for requesting code optimization and improvements",
    content: `# Code Optimization Request

## Language
\`\`\`
[LANGUAGE]
\`\`\`

## Original Code
\`\`\`[LANGUAGE]
[ORIGINAL_CODE]
\`\`\`

## Performance Issues
[PERFORMANCE_ISSUES]

## Optimization Goals
- Improve execution speed
- Reduce memory usage
- Improve readability
- [ADDITIONAL_GOALS]

## Constraints
- Must maintain the same functionality and outputs
- [ADDITIONAL_CONSTRAINTS]

## Output Format
Please provide:
1. The optimized code with comments explaining key changes
2. A brief explanation of the optimization strategy
3. Expected performance improvements`,
    type: "coding",
    purpose: "transformation",
    tags: ["code", "optimization", "performance"],
    sections: [
      {
        id: "language",
        name: "Language",
        content: "[LANGUAGE]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "original_code",
        name: "Original Code",
        content: "[ORIGINAL_CODE]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "performance_issues",
        name: "Performance Issues",
        content: "[PERFORMANCE_ISSUES]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "additional_goals",
        name: "Additional Goals",
        content: "[ADDITIONAL_GOALS]",
        isRequired: false,
        isCustomizable: true,
      },
      {
        id: "additional_constraints",
        name: "Additional Constraints",
        content: "[ADDITIONAL_CONSTRAINTS]",
        isRequired: false,
        isCustomizable: true,
      },
    ],
    metadata: {
      creator: "system",
      popularity: 87,
      rating: 4.5,
      featured: true,
    },
  },
  {
    id: "creative-story-1",
    name: "Creative Story Generator",
    description: "Generate engaging stories with customizable elements",
    content: `# Creative Story Prompt

## Story Parameters
- Genre: [GENRE]
- Setting: [SETTING]
- Main Character: [CHARACTER]
- Theme: [THEME]
- Mood: [MOOD]
- Length: [LENGTH] words approximately

## Plot Elements
- Inciting Incident: [INCITING_INCIDENT]
- Main Conflict: [CONFLICT]
- Resolution Style: [RESOLUTION]

## Special Instructions
[SPECIAL_INSTRUCTIONS]

## Output Format
Please write a cohesive story that incorporates all the elements above. The story should have a clear beginning, middle, and end. Use descriptive language and dialogue to bring the characters and setting to life.`,
    type: "creative",
    purpose: "generation",
    tags: ["creative", "storytelling", "fiction"],
    sections: [
      {
        id: "genre",
        name: "Genre",
        content: "[GENRE]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "setting",
        name: "Setting",
        content: "[SETTING]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "character",
        name: "Main Character",
        content: "[CHARACTER]",
        isRequired: true,
        isCustomizable: true,
      },
      {
        id: "theme",
        name: "Theme",
        content: "[THEME]",
        isRequired: false,
        isCustomizable: true,
      },
      {
        id: "inciting_incident",
        name: "Inciting Incident",
        content: "[INCITING_INCIDENT]",
        isRequired: false,
        isCustomizable: true,
      },
      {
        id: "special_instructions",
        name: "Special Instructions",
        content: "[SPECIAL_INSTRUCTIONS]",
        isRequired: false,
        isCustomizable: true,
      },
    ],
    metadata: {
      creator: "system",
      popularity: 142,
      rating: 4.8,
      featured: true,
    },
  },
];

// Fallback getTemplates implementation
async function getFallbackTemplates(filters = {}) {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  let templates = [...fallbackTemplates];

  // Apply filters
  if (filters.type) {
    templates = templates.filter((t) => t.type === filters.type);
  }

  if (filters.purpose) {
    templates = templates.filter((t) => t.purpose === filters.purpose);
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    templates = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.tags.some((tag) => tag.toLowerCase().includes(search)),
    );
  }

  if (filters.tags && filters.tags.length) {
    templates = templates.filter((t) =>
      filters.tags.some((tag) => t.tags.includes(tag)),
    );
  }

  return templates;
}

export {
  getTemplates,
  getTemplateById,
  applyTemplate,
  saveUserTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateTypes,
  getTemplatePurposes,
  analyzeTemplateVariables,
  getFeaturedTemplates,
  getUserTemplates,
  // Fallback implementations for development
  getFallbackTemplates,
};
