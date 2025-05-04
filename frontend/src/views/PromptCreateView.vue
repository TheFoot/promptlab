<template>
  <div class="prompt-create-view">
    <div class="sidebar">
      <PromptSidebar />
    </div>
    <div class="prompt-create-container">
      <div class="prompt-header">
        <div class="header-content">
          <h2>Create New Prompt</h2>
        </div>
      </div>

      <form
        class="prompt-form"
        @submit.prevent="savePrompt"
      >
        <div class="form-group mb-3">
          <label for="title">Title</label>
          <input
            id="title"
            v-model="prompt.title"
            type="text"
            placeholder="Prompt title"
            required
          >
        </div>

        <div class="form-group mb-3">
          <label>Tags</label>
          <TagInput v-model="prompt.tags" />
        </div>

        <div class="prompt-content">
          <div class="editor-container">
            <div class="editor-header">
              Content
            </div>
            <textarea
              v-model="prompt.content"
              class="content-editor"
              placeholder="Write your prompt here using markdown..."
              required
            />
          </div>
          <div class="preview-container">
            <div class="preview-header">
              Preview
            </div>
            <MarkdownPreview :content="prompt.content" />
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="saving"
          >
            {{ saving ? 'Creating...' : 'Create Prompt' }}
          </button>
          <router-link
            to="/"
            class="btn btn-secondary"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePromptStore } from '../stores/promptStore';
import PromptSidebar from '../components/PromptSidebar.vue';
import MarkdownPreview from '../components/MarkdownPreview.vue';
import TagInput from '../components/TagInput.vue';

const router = useRouter();
const promptStore = usePromptStore();

// Component state
const saving = ref(false);
const prompt = ref({
  title: '',
  content: '',
  tags: [],
});

// Methods
const savePrompt = async () => {
  if (!prompt.value.title || !prompt.value.content) {
    alert('Title and content are required');
    return;
  }

  saving.value = true;
  try {
    const newPrompt = await promptStore.createPrompt(prompt.value);
    
    // Explicitly set the current prompt in the store
    promptStore.currentPrompt = newPrompt;
    
    // Make sure the ID exists before redirecting
    if (newPrompt && newPrompt._id) {
      // Add a small delay to ensure store updates
      setTimeout(() => {
        router.push(`/prompts/${newPrompt._id}`);
      }, 100);
    } else {
      console.error('New prompt created but no ID returned');
      router.push('/');
    }
  } catch (error) {
    console.error('Error creating prompt:', error);
    alert('Failed to create prompt: ' + (error.message || 'Unknown error'));
  } finally {
    saving.value = false;
  }
};
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.prompt-create-view {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 1.5rem;
  height: 100%;
  max-width: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden; /* Prevent outer container from scrolling */
}

.sidebar {
  height: 100%;
  overflow: hidden; /* Sidebar container should not scroll itself */
}

.prompt-create-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto; /* Allow this container to scroll */
}

.prompt-header {
  padding: 1rem;
  background-color: var(--card-bg-color);
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--border-color);

  h2 {
    margin: 0;
    color: var(--text-color);
  }
}

.prompt-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 8px 8px;
  padding: 1rem;
}

.form-group {
  margin-bottom: 1rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
}

.prompt-content {
  display: flex;
  flex: 1;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;

  .editor-container,
  .preview-container {
    width: 50%;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .editor-container {
    border-right: 1px solid var(--border-color);
  }

  .editor-header,
  .preview-header {
    padding: 0.5rem 1rem;
    background-color: rgba(0, 0, 0, 0.03);
    border-bottom: 1px solid var(--border-color);
    font-weight: 500;
  }

  .content-editor {
    flex: 1;
    padding: 1.25rem;
    border: none;
    border-radius: 0;
    resize: none;
    font-family: monospace;
    font-size: 1rem;
    line-height: 1.6;
    min-height: 400px;
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .prompt-create-view {
    grid-template-columns: 1fr;
  }

  .prompt-content {
    flex-direction: column;

    .editor-container,
    .preview-container {
      width: 100%;
    }

    .editor-container {
      border-right: none;
      border-bottom: 1px solid var(--border-color);
    }

    .content-editor {
      min-height: 200px;
    }
  }
}
</style>
