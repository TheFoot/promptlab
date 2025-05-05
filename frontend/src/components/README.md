# Components

This directory contains reusable Vue components used throughout the PromptLab application. These components are designed to be composable, reusable, and follow the Vue 3 Composition API with `<script setup>` syntax.

## Component Files

- `ChatSidebar.vue` - Sidebar for interacting with AI models
- `MarkdownPreview.vue` - Renders Markdown content with syntax highlighting
- `PromptSidebar.vue` - Sidebar for managing and filtering prompts
- `TagInput.vue` - Component for adding, removing, and managing tags

## Component Structure

Each component follows this general structure:

```vue
<script setup>
// Imports
import { ref, computed } from "vue";

// Props
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
});

// Emits
const emit = defineEmits(["update", "delete"]);

// State and logic
const isActive = ref(false);

// Methods
function handleClick() {
  isActive.value = !isActive.value;
  emit("update", isActive.value);
}
</script>

<template>
  <div :class="{ active: isActive }">
    <h2>{{ title }}</h2>
    <button @click="handleClick">Toggle</button>
  </div>
</template>

<style scoped lang="scss">
@import "../styles/variables.scss";

div {
  // Styles
}
</style>
```

## ChatSidebar.vue

Interactive sidebar for testing prompts with AI models. Features include:

- Model selection (GPT-3.5, GPT-4, GPT-4o)
- Temperature adjustment
- Markdown rendering of responses
- Code syntax highlighting
- WebSocket-based streaming responses

## MarkdownPreview.vue

Renders Markdown content with syntax highlighting for code blocks.

## PromptSidebar.vue

Sidebar for browsing, filtering, and selecting prompts in the library.

## TagInput.vue

Component for managing tags, with autocomplete and validation.

## Creating New Components

When creating new components:

1. Follow the Vue 3 Composition API with `<script setup>` syntax
2. Use SCSS with scoped styles
3. Keep components focused on a single responsibility
4. Document props, emits, and key functionality
5. Use PascalCase for component filenames

## Related Documentation

- [Frontend README](../../README.md)
- [Views](../views/README.md)
- [Stores](../stores/README.md)
