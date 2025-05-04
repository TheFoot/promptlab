# Stores

This directory contains Pinia stores that manage the application state for the Prompt Library. Pinia is the official state management library for Vue 3.

## Store Files

- `promptStore.js` - Manages prompt and tag data
- `uiStore.js` - Manages UI state like theme and layout preferences

## promptStore.js

Manages the state related to prompts and tags, including:

- Fetching prompts from the API
- Creating, updating, and deleting prompts
- Managing tags
- Filtering and searching prompts
- Handling loading and error states

### Usage

```javascript
import { usePromptStore } from '../stores/promptStore';

const promptStore = usePromptStore();

// Access state
const prompts = promptStore.prompts;
const tags = promptStore.tags;

// Call actions
await promptStore.fetchPrompts();
await promptStore.createPrompt(newPrompt);

// Use getters
const filteredPrompts = promptStore.getFilteredPrompts;
```

## uiStore.js

Manages UI-related state, including:

- Dark/light theme toggle
- Sidebar visibility
- Layout preferences
- User interface settings

### Usage

```javascript
import { useUiStore } from '../stores/uiStore';

const uiStore = useUiStore();

// Access state
const isDarkMode = uiStore.isDarkMode;
const sidebarVisible = uiStore.sidebarVisible;

// Call actions
uiStore.toggleDarkMode();
uiStore.setSidebarVisible(false);
```

## Store Structure

Stores follow this general structure:

```javascript
import { defineStore } from 'pinia';

export const useExampleStore = defineStore('example', {
  // State
  state: () => ({
    items: [],
    loading: false,
    error: null
  }),
  
  // Getters
  getters: {
    filteredItems: (state) => state.items.filter(item => item.active)
  },
  
  // Actions
  actions: {
    async fetchItems() {
      this.loading = true;
      try {
        // API call
        this.loading = false;
      } catch (error) {
        this.error = error.message;
        this.loading = false;
      }
    }
  }
});
```

## Creating New Stores

When creating new stores:

1. Define a clear responsibility for the store
2. Use the Pinia `defineStore` function
3. Implement state, getters, and actions as needed
4. Handle loading and error states for async operations
5. Document the store's purpose and API

## Related Documentation

- [Frontend README](../../README.md)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Components](../components/README.md)