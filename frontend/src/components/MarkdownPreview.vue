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
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
});

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Render markdown content
const renderedMarkdown = computed(() => {
  if (!props.content) return '';
  return marked(props.content);
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

  :deep(code) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.9em;
  }

  :deep(pre) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    margin-bottom: 1rem;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

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
