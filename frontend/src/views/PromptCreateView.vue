<template>
  <div class="prompt-create-view">
    <div class="sidebar">
      <PromptSidebar />
    </div>
    <div class="prompt-create-container">
      <div
        v-if="useClassicMode"
        class="prompt-header"
      >
        <div class="header-content">
          <h2>Create New Prompt</h2>
          <div class="header-actions">
            <button
              class="mode-switch-btn"
              title="Switch to Enhanced Prompt Creator"
              @click="toggleCreatorMode"
            >
              <i class="fas fa-magic" />
              Enhanced Mode
            </button>
          </div>
        </div>
      </div>

      <!-- Classic Prompt Creator -->
      <form
        v-if="useClassicMode"
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
          <label for="tags-input">Tags</label>
          <TagInput
            id="tags-input"
            v-model="prompt.tags"
          />
        </div>

        <div class="prompt-content">
          <div class="editor-container">
            <div class="editor-header">
              <label for="content-editor">Content</label>
            </div>
            <textarea
              id="content-editor"
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
            <MarkdownPreview :markdown="prompt.content" />
          </div>
        </div>

        <div class="form-actions">
          <button
            type="submit"
            class="btn btn-primary"
            :disabled="saving"
          >
            {{ saving ? "Creating..." : "Create Prompt" }}
          </button>
          <router-link
            to="/"
            class="btn btn-secondary"
          >
            Cancel
          </router-link>
        </div>
      </form>

      <!-- Enhanced Prompt Creator -->
      <div
        v-else
        class="enhanced-creator-container"
      >
        <div class="creator-header">
          <h2>Create New Prompt</h2>
          <div class="header-actions">
            <button
              class="mode-switch-btn classic-mode-btn"
              title="Switch to Classic Prompt Creator"
              @click="toggleCreatorMode"
            >
              <i class="fas fa-edit" />
              Classic Mode
            </button>
          </div>
        </div>
        <EnhancedPromptCreator @prompt-created="handlePromptCreated" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { usePromptStore } from "../stores/promptStore";
import { useUiStore } from "../stores/uiStore";
import PromptSidebar from "../components/PromptSidebar.vue";
import MarkdownPreview from "../components/MarkdownPreview.vue";
import TagInput from "../components/TagInput.vue";
import EnhancedPromptCreator from "../components/EnhancedPromptCreator.vue";

const router = useRouter();
const promptStore = usePromptStore();
const uiStore = useUiStore();

// Component state
const saving = ref(false);
const useClassicMode = ref(false); // Default to enhanced mode
const prompt = ref({
  title: "",
  content: "",
  tags: [],
});

// Toggle between classic and enhanced creator modes
const toggleCreatorMode = () => {
  useClassicMode.value = !useClassicMode.value;
};

// Methods
const savePrompt = async () => {
  if (!prompt.value.title || !prompt.value.content) {
    alert("Title and content are required");
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
      console.error("New prompt created but no ID returned");
      router.push("/");
    }
  } catch (error) {
    console.error("Error creating prompt:", error);
    alert("Failed to create prompt: " + (error.message || "Unknown error"));
  } finally {
    saving.value = false;
  }
};

// Handle prompt creation from enhanced creator
const handlePromptCreated = (newPromptId) => {
  if (newPromptId) {
    router.push(`/prompts/${newPromptId}`);
  } else {
    router.push("/");
  }
};

// Set edit mode flag when component is mounted and clear it when unmounted
onMounted(() => {
  uiStore.setEditMode(true);
});

onUnmounted(() => {
  uiStore.setEditMode(false);
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.prompt-create-view {
  display: grid;
  grid-template-columns: 350px 1fr;
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

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  h2 {
    margin: 0;
    color: var(--text-color);
  }
}

.creator-header {
  padding: 1rem;
  background-color: var(--card-bg-color);
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 1.5rem;
    color: var(--text-color);
  }
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

.mode-switch-btn {
  padding: 0.5rem 1rem;
  background-color: var(--primary-color-light, #e3f2fd);
  border: 1px solid var(--primary-color, #1976d2);
  border-radius: 4px;
  color: var(--primary-color, #1976d2);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-color, #1976d2);
    color: white;
  }

  i {
    font-size: 1rem;
  }

  &.classic-mode-btn {
    background-color: #f8f9fa;
    border-color: #dee2e6;
    color: #495057;

    &:hover {
      background-color: #e9ecef;
      color: #212529;
    }
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

.enhanced-creator-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;

  // Remove top border-radius if there's a header
  &:has(.creator-header) {
    border-top-left-radius: 0;
    border-top-right-radius: 0;
    border-top: none;
  }
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
