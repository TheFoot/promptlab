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
import { marked } from "marked";
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

// Configure marked options with code highlighting
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && highlightjs.getLanguage(lang)) {
      return highlightjs.highlight(code, { language: lang }).value;
    }
    return highlightjs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// Custom renderer for better code blocks
const getRenderedMarkdown = () => {
  if (!props.content) return "";

  const renderer = new marked.Renderer();

  // Override the code renderer to add headers and download buttons
  renderer.code = (code, language) => {
    // Default highlightjs code rendering
    const highlightedCode =
      language && highlightjs.getLanguage(language)
        ? highlightjs.highlight(code, { language }).value
        : highlightjs.highlightAuto(code).value;

    // Create a timestamp-based filename with proper extension
    const timestamp = new Date().getTime();
    const extension = language || "txt";
    const filename = `code-${timestamp}.${extension}`;

    // Return code block with download button
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-language">${language || "plain text"}</span>
          <button class="code-download-btn" title="Download code" data-code="${encodeURIComponent(code)}" data-filename="${filename}" onclick="window.downloadCodeBlock(this)">
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

  // Override the paragraph renderer to handle code blocks specially
  const originalParagraph = renderer.paragraph;
  renderer.paragraph = function (text) {
    // If paragraph contains only a code block, don't wrap in <p> tags
    if (
      text.trim().startsWith('<div class="code-block-wrapper">') &&
      text.trim().endsWith("</div>")
    ) {
      return text;
    }

    // Otherwise use the original paragraph renderer
    return originalParagraph.call(this, text);
  };

  // Set the custom renderer
  marked.setOptions({ renderer });

  return marked(props.content);
};

// Render markdown content
const renderedMarkdown = computed(() => getRenderedMarkdown());

// Function to download code blocks
const downloadCodeBlock = (button) => {
  try {
    const code = decodeURIComponent(button.getAttribute("data-code"));
    const filename = button.getAttribute("data-filename");

    // Create blob with code content
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    // Create temporary link element to trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alertService.showAlert(`Downloading ${filename}`, "success", 3000);
  } catch (error) {
    console.error("Error downloading code:", error);
    alertService.showAlert("Failed to download code", "error", 3000);
  }
};

onMounted(() => {
  // Add download function to window object for code download buttons
  window.downloadCodeBlock = window.downloadCodeBlock || downloadCodeBlock;
});

onUnmounted(() => {
  // Do not remove the window function if it might be used by other components
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
}
</style>
