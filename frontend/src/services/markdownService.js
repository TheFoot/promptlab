import { Marked } from "marked";
import highlightjs from "highlight.js";

/**
 * Helper function to escape HTML for safety
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== "string") {
    return "";
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Handle string input content
 * @param {string} input - String input to process
 * @returns {string} - Processed string content
 */
function handleStringInput(input) {
  // Check if it's a stringified JSON that needs parsing
  try {
    const trimmed = input.trim();
    const isJsonObject = trimmed.startsWith("{") && trimmed.endsWith("}");
    const isJsonArray = trimmed.startsWith("[") && trimmed.endsWith("]");

    if (isJsonObject || isJsonArray) {
      const parsed = JSON.parse(input);
      // Recursively extract from the parsed object
      return extractRealContent(parsed);
    }
  } catch {
    // Not valid JSON, just return the string
  }
  return input;
}

/**
 * Extract string content from an object
 * @param {object} input - Object to extract content from
 * @returns {string} - Extracted string content
 */
function extractFromObject(input) {
  // Special handling for token objects with raw markdown
  if (input.type === "code" && input.text && typeof input.text === "string") {
    return input.text;
  }

  // Priority property checking - check most likely properties first
  const props = ["text", "content", "raw", "value", "markdown", "md"];
  for (const prop of props) {
    if (input[prop] && typeof input[prop] === "string") {
      return input[prop];
    }
  }

  // Check if object has a reasonable toString implementation
  if (input.toString && typeof input.toString === "function") {
    const str = input.toString();
    if (str !== "[object Object]") {
      return str;
    }
  }

  // Last resort: stringify the object
  try {
    return JSON.stringify(input, null, 2);
  } catch {
    return "[Object]";
  }
}

/**
 * Deep content extractor - Robustly handles various content formats and edge cases
 *
 * @param {*} input - The input content which could be anything (string, object, null, etc.)
 * @returns {string} - The extracted content as a string
 */
export function extractRealContent(input) {
  // Handle null/undefined
  if (input === null || input === undefined) {
    return "";
  }

  // Handle different types
  if (typeof input === "string") {
    return handleStringInput(input);
  }

  if (typeof input === "object") {
    return extractFromObject(input);
  }

  // Any other type - convert to string
  return String(input);
}

/**
 * Helper function to preprocess markdown content before rendering
 */
export function preprocessMarkdown(content) {
  // Standard extraction first to handle nested objects
  const extractedContent = extractRealContent(content);

  // Handle the case where the entire content is a stringified code token
  if (
    typeof extractedContent === "string" &&
    extractedContent.trim().startsWith("{") &&
    extractedContent.trim().endsWith("}")
  ) {
    try {
      const possibleToken = JSON.parse(extractedContent);
      if (possibleToken.type === "code" && possibleToken.text) {
        // Extract actual content and language for the renderer to handle
        return possibleToken.text;
      }
    } catch {
      // Not a valid JSON token object, continue with regular content
    }
  }

  // Clean any triple backtick fences that might be in the extracted content
  if (typeof extractedContent === "string") {
    // Remove markdown code block syntax if the entire content is a code block
    const codeBlockMatch = /^\s*```([^\n]*)\n([\s\S]*?)```\s*$/g.exec(
      extractedContent,
    );
    if (codeBlockMatch?.[2]) {
      // The content is a code block; let the renderer handle it as regular code
      return codeBlockMatch[2];
    }
  }

  return extractedContent;
}

/**
 * Create a configured Marked instance for markdown rendering
 */
export function createMarkedInstance(options = {}) {
  // Create base marked instance with default options
  const markedInstance = new Marked({
    breaks: true,
    gfm: true,
    async: false,
    pedantic: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
    hooks: {
      preprocess(markdown) {
        return markdown;
      },
      postprocess(html) {
        return html;
      },
    },
    ...options,
  });

  // Create the default renderer for code blocks
  const codeRenderer = (token) => {
    // Extract code and language from token
    const codeStr = token.text || "";
    const language = token.lang || "";

    // Default highlightjs code rendering
    let highlightedCode;
    try {
      if (language && highlightjs.getLanguage(language)) {
        highlightedCode = highlightjs.highlight(codeStr, { language }).value;
      } else {
        highlightedCode = escapeHtml(codeStr);
      }
    } catch (error) {
      console.error("Error highlighting code:", error);
      highlightedCode = escapeHtml(codeStr);
    }

    // Create a timestamp-based filename with proper extension
    const timestamp = new Date().getTime();
    const extension = language || "txt";
    const filename = `code-${timestamp}.${extension}`;

    // Return code block with download button using an icon
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-language">${language || "plain text"}</span>
          <button class="code-download-btn" title="Download code" data-code="${encodeURIComponent(codeStr)}" data-filename="${filename}" onclick="window.downloadCodeBlock(this)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
        <pre><code class="hljs ${language}">${highlightedCode}</code></pre>
      </div>
    `;
  };

  // Apply the custom renderers to the instance (only code renderer for now)
  markedInstance.use({
    renderer: {
      code: codeRenderer,
      // Don't override paragraph renderer - let Marked handle inline formatting
    },
  });
  

  return markedInstance;
}

/**
 * Render markdown content to HTML
 * @returns {string} HTML content as a string
 */
export function renderMarkdown(content) {
  try {
    // Don't try to render empty content
    if (!content) return "";

    // Get a fresh marked instance with our default configuration
    const markedInstance = createMarkedInstance();

    // Pre-process to handle complex content structures
    const processedContent = preprocessMarkdown(content);

    // Parse the markdown
    const result = markedInstance.parse(processedContent);
    
    return result || ""; // Ensure we always return a string
  } catch (error) {
    console.error("Error rendering markdown:", error);

    // Show error message, but also attempt to render the raw content
    const rawContent =
      typeof content === "string" ? content : JSON.stringify(content, null, 2);

    return `<p class="error">Error rendering markdown: ${error.message}</p>
            <pre>${escapeHtml(rawContent)}</pre>`;
  }
}

/**
 * Function to download code blocks
 * This function should be attached to the window object in components
 */
export function downloadCodeBlock(button) {
  try {
    const code = decodeURIComponent(button.getAttribute("data-code"));
    const filename = button.getAttribute("data-filename");

    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    console.error("Error downloading code:", error);
    return { success: false, error };
  }
}
