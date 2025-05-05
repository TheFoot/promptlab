<template>
  <div
    v-if="loading"
    class="loading-container"
  >
    <div class="loading">
      Loading prompt...
    </div>
  </div>
  <div
    v-else-if="error"
    class="error-container"
  >
    <div class="error">
      {{ error }}
    </div>
  </div>
  <div
    v-else-if="!prompt"
    class="loading-container"
  >
    <div class="loading">
      Prompt not found. Redirecting...
    </div>
  </div>
  <div
    v-else
    class="prompt-detail-view"
    :class="{ editing: editMode }"
  >
    <div class="sidebar">
      <PromptSidebar />
    </div>
    <div class="prompt-detail-container">
      <div class="prompt-header">
        <div class="header-content">
          <h2 v-if="!editMode">
            {{ prompt.title }}
          </h2>
          <input
            v-else
            v-model="editedPrompt.title"
            type="text"
            placeholder="Prompt title"
            class="title-input"
          >
          <div
            v-if="!editMode"
            class="prompt-tags"
          >
            <span
              v-for="tag in prompt.tags"
              :key="tag"
              class="prompt-tag"
            >{{
              tag
            }}</span>
          </div>
          <TagInput
            v-else
            v-model="editedPrompt.tags"
          />
        </div>
        <div class="header-actions">
          <button
            v-if="!editMode"
            class="btn btn-secondary"
            @click="enableEditMode"
          >
            Edit
          </button>
          <template v-else>
            <button
              class="btn btn-primary mr-2"
              :disabled="saving"
              @click="savePrompt"
            >
              {{ saving ? "Saving..." : "Save" }}
            </button>
            <button
              class="btn btn-secondary"
              @click="cancelEdit"
            >
              Cancel
            </button>
          </template>
        </div>
      </div>

      <div
        class="prompt-content"
        :class="{ 'edit-mode': editMode }"
      >
        <div
          class="editor-container"
          :class="{ 'full-width': !editMode }"
        >
          <textarea
            v-if="editMode"
            v-model="editedPrompt.content"
            class="content-editor"
            placeholder="Write your prompt here using markdown..."
          />
          <MarkdownPreview
            v-else
            :content="prompt.content"
          />
        </div>
        <div
          v-if="editMode"
          class="preview-container"
        >
          <div class="preview-header">
            Preview
          </div>
          <MarkdownPreview :content="editedPrompt.content" />
        </div>
      </div>

      <div
        v-if="editMode"
        class="prompt-footer"
      >
        <button
          class="btn btn-danger"
          @click="confirmDelete"
        >
          Delete Prompt
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { usePromptStore } from "../stores/promptStore";
import { useUiStore } from "../stores/uiStore";
import PromptSidebar from "../components/PromptSidebar.vue";
import MarkdownPreview from "../components/MarkdownPreview.vue";
import TagInput from "../components/TagInput.vue";

const route = useRoute();
const router = useRouter();
const promptStore = usePromptStore();
const uiStore = useUiStore();

// Component state
const editMode = ref(false);
const saving = ref(false);
const editedPrompt = ref({
  title: "",
  content: "",
  tags: [],
});

// Computed properties
const loading = computed(() => promptStore.loading);
const error = computed(() => promptStore.error);
const prompt = computed(() => promptStore.currentPrompt);

// Methods
const fetchPrompt = async () => {
  try {
    await promptStore.fetchPromptById(route.params.id);
  } catch (error) {
    console.error("Error fetching prompt:", error);
  }
};

const enableEditMode = () => {
  editedPrompt.value = {
    title: prompt.value.title,
    content: prompt.value.content,
    tags: [...prompt.value.tags],
  };
  editMode.value = true;
};

const cancelEdit = async () => {
  // First, update edit mode state
  editMode.value = false;
  editedPrompt.value = {
    title: prompt.value.title,
    content: prompt.value.content,
    tags: [...prompt.value.tags],
  };

  // Force UI layout update after state change
  await nextTick();

  // Allow time for transitions and layout adjustments
  setTimeout(() => {
    // Trigger window resize event to ensure all components adjust
    window.dispatchEvent(new Event("resize"));
  }, 100);
};

const savePrompt = async () => {
  if (!editedPrompt.value.title || !editedPrompt.value.content) {
    alert("Title and content are required");
    return;
  }

  saving.value = true;
  try {
    await promptStore.updatePrompt(route.params.id, editedPrompt.value);

    // First, update edit mode state
    editMode.value = false;

    // Force UI layout update after state change
    await nextTick();

    // Allow time for transitions and layout adjustments
    setTimeout(() => {
      // Trigger window resize event to ensure all components adjust
      window.dispatchEvent(new Event("resize"));
    }, 100);
  } catch (error) {
    console.error("Error saving prompt:", error);
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  if (confirm("Are you sure you want to delete this prompt?")) {
    try {
      await promptStore.deletePrompt(route.params.id);
      router.push("/");
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  }
};

// Watch for route changes to load the correct prompt
watch(
  () => route.params.id,
  async (newId) => {
    if (newId) {
      await fetchPrompt();

      // Redirect if prompt not found after fetch
      if (!promptStore.currentPrompt && !loading.value) {
        console.error("Prompt not found, redirecting to home");
        router.push("/");
      }
    }
  },
);

// Update global UI state when edit mode changes
watch(editMode, (isEditMode) => {
  uiStore.setEditMode(isEditMode);
});

// Watch for prompt to be null after loading completes
watch(
  () => promptStore.loading,
  (isLoading) => {
    if (
      !isLoading &&
      route.params.id &&
      !promptStore.currentPrompt &&
      !promptStore.error
    ) {
      // Loading finished but no prompt found and no error either
      console.error(
        "Prompt not found after loading completed, redirecting to home",
      );
      router.push("/");
    }
  },
);

// Lifecycle hooks
onMounted(async () => {
  if (route.params.id) {
    await fetchPrompt();

    // Redirect if prompt not found after initial fetch
    if (!promptStore.currentPrompt && !loading.value) {
      console.error("Prompt not found on initial load, redirecting to home");
      router.push("/");
    }
  }
});
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.prompt-detail-view {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  height: 100%;
  max-width: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden; /* Prevent outer container from scrolling */

  &.editing {
    /* Ensure content spans full width when in edit mode */
    width: 100%;
    position: relative;
    z-index: 60; /* Higher than chat sidebar */
  }
}

.sidebar {
  height: 100%;
  overflow: hidden; /* Sidebar container should not scroll itself */
}

.prompt-detail-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: 100%;
  overflow-y: auto; /* Allow this container to scroll */
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: var(--card-bg-color);
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--border-color);
  border-bottom: none;
  position: relative; /* For z-index to work */
  z-index: 50; /* Higher than sidebar but lower than app header */

  h2 {
    margin: 0;
    color: var(--text-color);
  }

  .title-input {
    font-size: 1.5rem;
    font-weight: bold;
    width: 100%;
  }

  .prompt-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;
  }

  .prompt-tag {
    background-color: rgba(74, 108, 247, 0.1);
    color: var(--primary-color);
    padding: 0.25rem 0.5rem;
    border-radius: 2rem;
    font-size: 0.75rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }
}

.prompt-content {
  flex: 1;
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  background-color: var(--card-bg-color);

  &.edit-mode {
    .editor-container,
    .preview-container {
      width: 50%;
      height: 100%;
    }

    .editor-container {
      border-right: 1px solid var(--border-color);
    }
  }

  .editor-container,
  .preview-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .editor-container {
    width: 100%;

    &.full-width {
      width: 100%;
    }
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
  }

  .preview-header {
    padding: 0.5rem 1rem;
    background-color: rgba(0, 0, 0, 0.03);
    border-bottom: 1px solid var(--border-color);
    font-weight: 500;
  }
}

.prompt-footer {
  padding: 1rem;
  background-color: var(--card-bg-color);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 8px 8px;
  display: flex;
  justify-content: flex-end;
}

.loading-container,
.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.loading,
.error {
  padding: 1rem;
}

.error {
  color: var(--error-color);
}

@media (max-width: 768px) {
  .prompt-detail-view {
    grid-template-columns: 1fr;
  }

  .prompt-content.edit-mode {
    flex-direction: column;

    .editor-container,
    .preview-container {
      width: 100%;
      height: auto;
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
