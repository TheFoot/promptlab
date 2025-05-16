<template>
  <div class="markdown-preview">
    <div
      v-if="!content"
      class="empty-preview"
    >
      No content to preview.
    </div>
    <div
      v-else
      class="markdown-content"
      v-html="renderedMarkdown"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { Marked } from "marked";
import highlightjs from "highlight.js";
import "highlight.js/styles/github.css";
import "../styles/code-blocks.scss";
import alertService from "../services/alertService";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});

// Helper function to escape HTML for safe display
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') {
    return '';
  }
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Deep content extractor - Robustly handles various content formats and edge cases
 * 
 * @param {*} input - The input content which could be anything (string, object, null, etc.)
 * @returns {string} - The extracted content as a string
 */
function extractRealContent(input) {
  // Case 1: Handle null/undefined
  if (input === null || input === undefined) {
    return '';
  }
  
  // Case 2: Input is already a string
  if (typeof input === 'string') {
    // Check if it's a stringified JSON that needs parsing
    try {
      if ((input.trim().startsWith('{') && input.trim().endsWith('}')) || 
          (input.trim().startsWith('[') && input.trim().endsWith(']'))) {
        const parsed = JSON.parse(input);
        // Recursively extract from the parsed object
        return extractRealContent(parsed);
      }
    } catch (e) {
      // Not valid JSON, just return the string
    }
    return input;
  }
  
  // Case 3: Input is an object
  if (typeof input === 'object') {
    // Special handling for token objects with raw markdown
    if (input.type === 'code') {
      // If we have text content, just return it directly (don't add markdown fence)
      if (input.text && typeof input.text === 'string') {
        return input.text;
      }
    }
    
    // Priority property checking - check most likely properties first
    const props = ['text', 'content', 'raw', 'value', 'markdown', 'md'];
    for (const prop of props) {
      if (input[prop] && typeof input[prop] === 'string') {
        return input[prop];
      }
    }
    
    // Check if object has a reasonable toString implementation
    if (input.toString && typeof input.toString === 'function') {
      const str = input.toString();
      if (str !== '[object Object]') {
        return str;
      }
    }
    
    // Last resort: stringify the object
    try {
      return JSON.stringify(input, null, 2);
    } catch (e) {
      return '[Object]';
    }
  }
  
  // Case 4: Any other type - convert to string
  return String(input);
}

// Create a new Marked instance with our options
const marked = new Marked({
  breaks: true,
  gfm: true,
  async: false,
  // Add custom renderer for code blocks
  renderer: {
    code(code, language) {
      let codeContent;
      let codeLanguage = language || '';
      
      // Check for markdown code fences first and strip them if present
      if (typeof code === 'string' && code.trim().startsWith('```')) {
        const match = /^```([^\n]*)\n([\s\S]*?)```\s*$/g.exec(code);
        if (match) {
          if (match[1]) codeLanguage = match[1].trim();
          codeContent = match[2];
        } else {
          codeContent = code;
        }
      }
      // Handle case where code is a token object
      else if (typeof code === 'object' && code !== null) {
        // Extract language from token if available
        if (code.lang) {
          codeLanguage = code.lang;
        }
        
        // Extract code content from token
        codeContent = extractRealContent(code);
        
        // Check if the extracted content still has code fences
        if (typeof codeContent === 'string' && codeContent.trim().startsWith('```')) {
          const match = /^```([^\n]*)\n([\s\S]*?)```\s*$/g.exec(codeContent);
          if (match) {
            if (match[1]) codeLanguage = match[1].trim();
            codeContent = match[2];
          }
        }
      } else {
        // Direct content - just make sure it's a string
        codeContent = String(code || '');
      }
      
      // Highlight the code
      let highlightedCode;
      try {
        if (codeLanguage && highlightjs.getLanguage(codeLanguage)) {
          highlightedCode = highlightjs.highlight(codeContent, { language: codeLanguage }).value;
        } else {
          highlightedCode = escapeHtml(codeContent);
        }
      } catch (error) {
        console.error("Error highlighting code:", error);
        highlightedCode = escapeHtml(codeContent);
      }
      
      // Format display language name
      const displayLanguage = codeLanguage 
        ? codeLanguage.charAt(0).toUpperCase() + codeLanguage.slice(1)
        : "Plain text";
      
      // Create filename for download
      const timestamp = new Date().getTime();
      const extension = codeLanguage || "txt";
      const filename = `code-${timestamp}.${extension}`;
      
      // Return custom code block with download button
      return `
        <div class="code-block-wrapper">
          <div class="code-header">
            <span class="code-language">${displayLanguage}</span>
            <button class="code-download-btn" title="Download code" data-code="${encodeURIComponent(codeContent)}" data-filename="${filename}" onclick="window.downloadCodeBlock(this)">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
          </div>
          <pre><code class="hljs ${codeLanguage || ''}">${highlightedCode}</code></pre>
        </div>
      `;
    }
  }
});

// Helper function to detect and fix code blocks in content prior to parsing
function preprocessMarkdown(content) {
  // Standard extraction first to handle nested objects
  const extractedContent = extractRealContent(content);
  
  // Handle the case where the entire content is a stringified code token
  if (typeof extractedContent === 'string' && 
      extractedContent.trim().startsWith('{') && 
      extractedContent.trim().endsWith('}')) {
    try {
      const possibleToken = JSON.parse(extractedContent);
      if (possibleToken.type === 'code' && possibleToken.text) {
        // Extract actual content and language for the renderer to handle
        return possibleToken.text;
      }
    } catch (e) {
      // Not a valid JSON token object, continue with regular content
    }
  }
  
  // Clean any triple backtick fences that might be in the extracted content
  if (typeof extractedContent === 'string') {
    // Remove markdown code block syntax if the entire content is a code block
    const codeBlockMatch = /^\s*```([^\n]*)\n([\s\S]*?)```\s*$/g.exec(extractedContent);
    if (codeBlockMatch && codeBlockMatch[2]) {
      // The content is a code block; let the renderer handle it as regular code
      return codeBlockMatch[2];
    }
  }
  
  return extractedContent;
}

// Function to render markdown content
const getRenderedMarkdown = () => {
  try {
    if (!props.content) return '';
    
    // Pre-process to handle complex content structures
    const processedContent = preprocessMarkdown(props.content);
    
    // Parse the markdown with our configured marked instance
    return marked.parse(processedContent);
  } catch (error) {
    console.error("Error parsing markdown:", error);
    
    // Show error message, but also attempt to render the raw content
    const rawContent = typeof props.content === 'string' 
      ? props.content 
      : JSON.stringify(props.content, null, 2);
      
    return `<p class="error">Error rendering markdown: ${error.message}</p>
            <pre>${escapeHtml(rawContent)}</pre>`;
  }
};

// Compute the rendered markdown
const renderedMarkdown = computed(() => getRenderedMarkdown());

// Function to download code blocks
const downloadCodeBlock = (button) => {
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

    alertService.showAlert(`Downloading ${filename}`, "success", 3000);
  } catch (error) {
    console.error("Error downloading code:", error);
    alertService.showAlert("Failed to download code", "error", 3000);
  }
};

onMounted(() => {
  // Add download function to window object
  window.downloadCodeBlock = window.downloadCodeBlock || downloadCodeBlock;
});

onUnmounted(() => {
  // We don't remove the function as it might be used by other instances
});
</script>

<style lang="scss" scoped>
.markdown-preview {
  background-color: var(--card-bg-color);
  border-radius: 4px;
  padding: 1.25rem;
  overflow-y: auto;
  height: 100%;
  font-size: 1rem;
  line-height: 1.6;

  .empty-preview {
    color: var(--text-secondary);
    font-style: italic;
    text-align: center;
    padding: 2rem 0;
  }
}

.markdown-content {
  // Properly display markdown elements
  :deep(h1) {
    font-size: 2rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--border-color);
  }

  :deep(h2) {
    font-size: 1.7rem;
    margin-top: 1.5rem;
    margin-bottom: 1rem;
  }

  :deep(h3) {
    font-size: 1.4rem;
    margin-top: 1.2rem;
    margin-bottom: 0.8rem;
  }

  :deep(h4, h5, h6) {
    margin-top: 1rem;
    margin-bottom: 0.6rem;
  }

  :deep(p) {
    margin-bottom: 1.2rem;
    line-height: 1.6;
  }

  :deep(ul, ol) {
    margin-bottom: 1rem;
    padding-left: 2rem;
  }

  :deep(li) {
    margin-bottom: 0.5rem;
  }

  // Code block styling is imported from the centralized style file
  // We import it in script section: '../styles/code-blocks.scss'

  :deep(blockquote) {
    padding-left: 1rem;
    border-left: 4px solid var(--border-color);
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  :deep(table) {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 1rem;
  }

  :deep(th, td) {
    border: 1px solid var(--border-color);
    padding: 0.5rem;
  }

  :deep(th) {
    background-color: rgba(0, 0, 0, 0.03);
  }

  :deep(a) {
    color: var(--primary-color);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
  
  :deep(.error) {
    color: var(--error-color);
    padding: 1rem;
    background-color: rgba(220, 53, 69, 0.05);
    border-radius: 4px;
    margin-bottom: 1rem;
  }
}
</style>