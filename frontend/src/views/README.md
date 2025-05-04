# Views

This directory contains page-level Vue components that correspond to different routes in the application. These components are loaded by Vue Router when navigating to their respective URLs.

## View Files

- `HomeView.vue` - Main dashboard/home page
- `PromptCreateView.vue` - Page for creating new prompts
- `PromptDetailView.vue` - Page for viewing and editing a specific prompt

## HomeView.vue

The main landing page of the application. Features include:

- List of prompts with filtering options
- Search functionality
- Tag filtering
- Navigation to create and detail views

## PromptCreateView.vue

Page for creating new prompts. Features include:

- Markdown editor for prompt content
- Title input
- Tag management
- Form validation
- Preview functionality

## PromptDetailView.vue

Page for viewing and editing a specific prompt. Features include:

- Markdown editor with live preview
- Tag editing
- Delete confirmation
- Testing prompt with chat interface

## View Structure

Views follow this general structure:

```vue
<script setup>
// Imports
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePromptStore } from '../stores/promptStore';
import SomeComponent from '../components/SomeComponent.vue';

// Router and store initialization
const route = useRoute();
const router = useRouter();
const promptStore = usePromptStore();

// State management
const loading = ref(true);

// Lifecycle hooks
onMounted(async () => {
  // Initialize data
  await promptStore.fetchData();
  loading.value = false;
});

// Methods
function handleSomeAction() {
  // Implementation
}
</script>

<template>
  <div class="view-container">
    <h1>View Title</h1>
    <SomeComponent />
  </div>
</template>

<style scoped lang="scss">
@import '../styles/variables.scss';

.view-container {
  // Styles
}
</style>
```

## Creating New Views

When creating new views:

1. Add the view component in this directory
2. Register the route in `router/index.js`
3. Follow Vue 3 Composition API with `<script setup>` syntax
4. Handle loading states and error conditions
5. Use SCSS with scoped styles

## Related Documentation

- [Frontend README](../../README.md)
- [Components](../components/README.md)
- [Router](../router/README.md)