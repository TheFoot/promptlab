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
import "highlight.js/styles/github.css";
import "../styles/code-blocks.scss";
import alertService from "../services/alertService";
import { renderMarkdown, downloadCodeBlock } from "../services/markdownService";

const props = defineProps({
  content: {
    type: String,
    default: "",
  },
});

// Compute the rendered markdown
const renderedMarkdown = computed(() => {
  const html = renderMarkdown(props.content);
  return html || "";
});

// Handle download code blocks
const handleDownloadCodeBlock = (button) => {
  const result = downloadCodeBlock(button);
  if (result.success) {
    alertService.showAlert(`Downloading ${result.filename}`, "success", 3000);
  } else {
    alertService.showAlert("Failed to download code", "error", 3000);
  }
};

onMounted(() => {
  // Add download function to window object
  window.downloadCodeBlock =
    window.downloadCodeBlock || handleDownloadCodeBlock;
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
