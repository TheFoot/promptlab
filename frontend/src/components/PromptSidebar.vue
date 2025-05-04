<template>
  <div class="prompt-sidebar">
    <div class="search-container mb-3">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search prompts..."
        class="search-input"
        @input="handleSearch"
      >
      <select 
        v-model="selectedTag" 
        class="tag-filter mt-2" 
        @change="handleTagChange"
      >
        <option value="">
          All Tags
        </option>
        <option
          v-for="tag in tags"
          :key="tag"
          :value="tag"
        >
          {{ tag }}
        </option>
      </select>
    </div>

    <div class="create-prompt-container mb-3">
      <router-link
        to="/prompts/new"
        class="btn btn-primary"
      >
        + New Prompt
      </router-link>
    </div>

    <div class="prompt-list">
      <div
        v-if="loading"
        class="loading"
      >
        Loading...
      </div>
      <div
        v-else-if="error"
        class="error"
      >
        {{ error }}
      </div>
      <div
        v-else-if="prompts.length === 0"
        class="no-prompts"
      >
        No prompts found. Create a new one to get started.
      </div>
      <router-link
        v-for="prompt in prompts"
        v-else
        :key="prompt._id"
        :to="`/prompts/${prompt._id}`"
        class="prompt-item"
        :class="{ active: isActivePrompt(prompt._id) }"
      >
        <h3 class="prompt-title">
          {{ prompt.title }}
        </h3>
        <div class="prompt-tags">
          <span
            v-for="tag in prompt.tags"
            :key="`${prompt._id}-${tag}`"
            class="prompt-tag"
          >
            {{ tag }}
          </span>
        </div>
        <div class="prompt-date">
          {{ formatDate(prompt.updatedAt) }}
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { usePromptStore } from '../stores/promptStore';

const promptStore = usePromptStore();
const route = useRoute();

// Local state
const searchQuery = ref('');
const selectedTag = ref('');

// Computed properties
const loading = computed(() => promptStore.loading);
const error = computed(() => promptStore.error);
const prompts = computed(() => promptStore.prompts);
const tags = computed(() => promptStore.tags);

// Methods
const isActivePrompt = (id) => {
  return route.params.id === id;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Debounce search to avoid too many API calls
let searchTimeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (promptStore.searchQuery !== searchQuery.value) {
      promptStore.setSearchQuery(searchQuery.value);
    }
  }, 300); // Wait 300ms after user stops typing
};

const handleTagChange = () => {
  if (promptStore.selectedTag !== selectedTag.value) {
    promptStore.setSelectedTag(selectedTag.value);
  }
};

// Lifecycle hooks
onMounted(async () => {
  // Set local state from store
  searchQuery.value = promptStore.searchQuery;
  selectedTag.value = promptStore.selectedTag;

  // Only fetch if not already loaded
  const tagsPromise = promptStore.tags.length === 0 ? promptStore.fetchTags() : Promise.resolve();
  const promptsPromise = promptStore.prompts.length === 0 ? promptStore.fetchPrompts() : Promise.resolve();
  
  await Promise.all([tagsPromise, promptsPromise]);
});

// Sync with store state
watch(
  () => promptStore.searchQuery,
  (newVal) => {
    if (searchQuery.value !== newVal) {
      searchQuery.value = newVal;
    }
  }
);

watch(
  () => promptStore.selectedTag,
  (newVal) => {
    if (selectedTag.value !== newVal) {
      selectedTag.value = newVal;
    }
  }
);
</script>

<style lang="scss" scoped>
.prompt-sidebar {
  background-color: var(--card-bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 350px;
  overflow: hidden; /* Prevent sidebar from scrolling itself */

  .search-input,
  .tag-filter {
    width: 100%;
  }

  .prompt-list {
    flex: 1;
    overflow-y: auto;
  }

  .prompt-item {
    display: block;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    color: var(--text-color);
    text-decoration: none;
    transition: background-color 0.2s, border-color 0.2s;

    &:hover {
      background-color: rgba(74, 108, 247, 0.05);
      border-color: var(--primary-color);
    }

    &.active {
      border-left: 3px solid var(--primary-color);
      background-color: rgba(74, 108, 247, 0.1);
    }

    .prompt-title {
      font-size: 1rem;
      margin: 0 0 0.5rem 0;
    }

    .prompt-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .prompt-tag {
      background-color: rgba(74, 108, 247, 0.1);
      color: var(--primary-color);
      padding: 0.15rem 0.5rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      display: inline-block;
    }

    .prompt-date {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  }

  .loading,
  .error,
  .no-prompts {
    padding: 1rem;
    text-align: center;
    color: var(--text-secondary);
  }

  .error {
    color: var(--error-color);
  }
}
</style>
