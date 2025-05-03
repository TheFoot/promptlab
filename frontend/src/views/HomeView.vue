<template>
  <div class="home-view">
    <div class="sidebar">
      <PromptSidebar />
    </div>
    <div class="welcome-container">
      <div class="welcome-card card">
        <h2>Welcome to Prompt Library!</h2>
        <p>This application helps you manage your LLM prompts and templates.</p>
        <ul class="feature-list">
          <li>Create and organize prompts for different AI models</li>
          <li>Add tags to categorize your prompts</li>
          <li>Use markdown to format your prompts</li>
          <li>Search and filter by tags to quickly find what you need</li>
        </ul>
        <div class="welcome-actions">
          <router-link to="/prompts/new" class="btn btn-primary">
            {{ hasPrompts ? 'Create New Prompt' : 'Create Your First Prompt' }}
          </router-link>
          
          <div v-if="hasPrompts" class="existing-prompts-message mt-2">
            You have {{ promptStore.prompts.length }} prompt{{ promptStore.prompts.length !== 1 ? 's' : '' }} available.
            <br>Select one from the sidebar to view or edit.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { usePromptStore } from '../stores/promptStore';
import PromptSidebar from '../components/PromptSidebar.vue';

const promptStore = usePromptStore();

// Fetch prompts when component is mounted
onMounted(async () => {
  if (promptStore.prompts.length === 0) {
    await promptStore.fetchPrompts();
  }
});

// Computed property to check if there are any prompts
const hasPrompts = computed(() => promptStore.prompts.length > 0);
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.home-view {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  min-height: calc(100vh - 150px);
  max-width: 100%;
  padding: 0;
  margin: 0;
}

.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.welcome-card {
  max-width: 600px;
  padding: 2rem;
  text-align: center;

  h2 {
    margin-bottom: 1rem;
    color: var(--primary-color);
  }

  p {
    margin-bottom: 1.5rem;
    font-size: 1.1rem;
  }

  .feature-list {
    text-align: left;
    margin: 0 auto 2rem auto;
    max-width: 400px;
    list-style-type: none;

    li {
      padding: 0.5rem 0;
      position: relative;
      padding-left: 1.5rem;

      &:before {
        content: '✓';
        color: var(--success-color);
        position: absolute;
        left: 0;
      }
    }
  }

  .welcome-actions {
    margin-top: 1.5rem;
    
    .existing-prompts-message {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.5;
    }
  }
}

@media (max-width: 768px) {
  .home-view {
    grid-template-columns: 1fr;
  }

  .welcome-container {
    padding: 1rem;
  }
}
</style>
