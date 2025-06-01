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
          <div
            v-if="!editMode"
            class="mode-button-bar"
          >
            <button
              class="mode-btn"
              :class="{ active: contextPanelMode === 'chat' }"
              @click="setContextPanelMode('chat')"
            >
              <span class="btn-icon">💬</span>
              Chat
            </button>
            <button
              class="mode-btn"
              :class="{ active: contextPanelMode === 'edit' }"
              @click="setContextPanelMode('edit')"
            >
              <span class="btn-icon">✏️</span>
              Edit
            </button>
            <button
              class="mode-btn"
              :class="{ active: contextPanelMode === 'design' }"
              @click="setContextPanelMode('design')"
            >
              <span class="btn-icon">🎨</span>
              Design
            </button>
          </div>
          <button
            class="btn btn-outline-secondary"
            :title="editMode ? 'Close editor' : 'Close prompt and return to dashboard'"
            @click="editMode ? cancelEdit : navigateToHome"
          >
            ✕ Close
          </button>
          <template v-if="editMode">
            <button
              class="btn btn-primary mr-2"
              :disabled="saving"
              @click="savePrompt"
            >
              {{ saving ? "Saving..." : "Save" }}
            </button>
          </template>
        </div>
      </div>

      <div class="prompt-content">
        <div
          class="editor-container"
          :style="{ width: editMode ? '50%' : `${100 - contextPanelWidthPercent}%` }"
        >
          <textarea
            v-if="editMode"
            v-model="editedPrompt.content"
            class="content-editor"
            placeholder="Write your prompt here using markdown..."
          />
          <div
            v-else
            class="preview-wrapper"
          >
            <!-- Preview Status Bar -->
            <div
              class="preview-status-bar"
              :class="{ 'has-changes': hasUnsavedChanges }"
            >
              <div class="status-indicator">
                <span
                  v-if="hasUnsavedChanges"
                  class="status-text"
                >
                  <span class="status-dot unsaved" />
                  Previewing local changes
                </span>
                <span
                  v-else
                  class="status-text"
                >
                  <span class="status-dot saved" />
                  Saved content
                </span>
              </div>
              <div
                v-if="hasUnsavedChanges"
                class="status-actions"
              >
                <span class="changes-hint">Changes not saved</span>
              </div>
            </div>
            <!-- Preview Content -->
            <MarkdownPreview
              :content="contextPanelMode === 'edit' ? editableContent : prompt.content"
            />
          </div>
        </div>
        <div
          v-if="editMode"
          class="preview-container"
          style="width: 50%"
        >
          <div class="preview-header">
            Preview
          </div>
          <MarkdownPreview :content="editedPrompt.content" />
        </div>
        
        <!-- Always show DynamicContextPanel -->
        <DynamicContextPanel
          v-if="!editMode"
          :prompt-content="prompt.content"
          :initial-mode="contextPanelMode"
          :use-slot-content="true"
          @update:prompt-content="handleAISuggestion"
          @mode-changed="handleModeChange"
          @resize="handlePanelResize"
        >
          <template #chat-mode>
            <ChatSidebar
              :system-prompt="prompt.content"
              :embedded="true"
              agent-mode="chat"
            />
          </template>
          <template #edit-mode>
            <div class="edit-mode-panel">
              <div class="edit-toolbar">
                <div class="toolbar-left">
                  <!-- Future toolbar items can go here -->
                </div>
                <div class="toolbar-right">
                  <button
                    class="save-btn"
                    :disabled="saving"
                    @click="savePanelChanges"
                  >
                    {{ saving ? "Saving..." : "Save" }}
                  </button>
                </div>
              </div>
              <textarea
                v-model="editableContent"
                class="panel-editor"
                placeholder="Edit your prompt here..."
                @input="handleContentEdit"
              />
            </div>
          </template>
          <template #design-mode>
            <ChatSidebar
              :system-prompt="prompt.content"
              :embedded="true"
              agent-mode="design"
            />
          </template>
        </DynamicContextPanel>
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
import { useContextPanelStore } from "../stores/contextPanelStore";
import PromptSidebar from "../components/PromptSidebar.vue";
import MarkdownPreview from "../components/MarkdownPreview.vue";
import TagInput from "../components/TagInput.vue";
import DynamicContextPanel from "../components/DynamicContextPanel.vue";
import ChatSidebar from "../components/ChatSidebar.vue";

const route = useRoute();
const router = useRouter();
const promptStore = usePromptStore();
const uiStore = useUiStore();
const contextPanelStore = useContextPanelStore();

// Component state
const editMode = ref(false);
const saving = ref(false);
const editedPrompt = ref({
  title: "",
  content: "",
  tags: [],
});

// Context panel state
const contextPanelMode = ref(contextPanelStore.activeMode || 'chat');
const contextPanelWidthPercent = ref(40); // Default 40% width
const editableContent = ref(''); // For edit mode in panel

// Computed properties
const loading = computed(() => promptStore.loading);
const error = computed(() => promptStore.error);
const prompt = computed(() => promptStore.currentPrompt);

// Check if there are unsaved changes in the panel editor
const hasUnsavedChanges = computed(() => {
  return contextPanelMode.value === 'edit' && 
         prompt.value && 
         editableContent.value !== prompt.value.content;
});

// Methods
const fetchPrompt = async () => {
  try {
    await promptStore.fetchPromptById(route.params.id);
  } catch (error) {
    console.error("Error fetching prompt:", error);
  }
};

const enableEditMode = () => { // eslint-disable-line no-unused-vars
  editedPrompt.value = {
    title: prompt.value.title,
    content: prompt.value.content,
    tags: [...prompt.value.tags],
  };
  editMode.value = true;
};

const setContextPanelMode = (mode) => {
  contextPanelMode.value = mode;
  contextPanelStore.setActiveMode(mode);
};

const navigateToHome = () => {
  router.push("/");
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

// Context panel handlers
const handleModeChange = (mode) => {
  contextPanelMode.value = mode;
  contextPanelStore.setActiveMode(mode);
};

const handlePanelResize = (widthPercent) => {
  contextPanelWidthPercent.value = widthPercent;
};

const handleAISuggestion = (newContent) => {
  if (newContent && prompt.value) {
    // Apply AI suggestion to the current prompt
    promptStore.updatePrompt(route.params.id, {
      ...prompt.value,
      content: newContent
    });
  }
};

const handleContentEdit = () => {
  // Just handle the input - no auto-save to avoid focus loss
  // Content will be saved when user clicks Save button
};

const savePanelChanges = async () => {
  if (!prompt.value) return;
  
  saving.value = true;
  try {
    await promptStore.updatePrompt(route.params.id, {
      ...prompt.value,
      content: editableContent.value
    });
  } catch (error) {
    console.error("Error saving prompt from panel:", error);
  } finally {
    saving.value = false;
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

// Watch for prompt changes to sync editableContent (only when different)
watch(
  () => prompt.value?.content,
  (newContent) => {
    if (newContent && newContent !== editableContent.value) {
      editableContent.value = newContent;
    }
  },
  { immediate: true }
);

// Watch for context panel mode changes to keep everything in sync
watch(contextPanelMode, (newMode) => {
  contextPanelStore.setActiveMode(newMode);
  localStorage.setItem("context-panel-mode", newMode);
});

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
  // Initialize mode from localStorage to sync with DynamicContextPanel
  const savedMode = localStorage.getItem("context-panel-mode");
  if (savedMode && ["chat", "edit", "design"].includes(savedMode)) {
    contextPanelMode.value = savedMode;
    contextPanelStore.setActiveMode(savedMode);
  }

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
    align-items: center;

    .mode-button-bar {
      display: flex;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      overflow: hidden;
      margin-right: 1rem;

      .mode-btn {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        background-color: var(--card-bg-color);
        border: none;
        border-right: 1px solid var(--border-color);
        color: var(--text-color);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 1rem;
        font-weight: 500;

        &:last-child {
          border-right: none;
        }

        &:hover {
          background-color: var(--hover-color, #f0f0f0);
          
          /* Darker text on hover in dark mode */
          @media (prefers-color-scheme: dark) {
            color: #333333;
          }
        }

        &.active {
          background-color: var(--primary-color);
          color: white;

          &:hover {
            background-color: var(--primary-color-dark, #3a5ce7);
          }
        }

        .btn-icon {
          font-size: 1em;
        }
      }
    }

    .mr-2 {
      margin-right: 0.5rem;
    }

    .btn-outline-secondary {
      background-color: transparent;
      border: 1px solid var(--secondary-color);
      color: var(--secondary-color);

      &:hover {
        background-color: var(--secondary-color);
        color: white;
      }
    }
  }
}

.prompt-content {
  flex: 1;
  display: flex;
  border: 1px solid var(--border-color);
  border-radius: 0 0 8px 8px;
  overflow: hidden;
  background-color: var(--card-bg-color);
  position: relative;

  .editor-container,
  .preview-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: auto;
    transition: width 0.2s ease;
  }

  .editor-container {
    border-right: 1px solid var(--border-color);
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

  .preview-wrapper {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .preview-status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: var(--card-bg-color);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.85rem;
    min-height: 40px;

    &.has-changes {
      background-color: rgba(255, 193, 7, 0.1);
      border-bottom-color: rgba(255, 193, 7, 0.3);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-text {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-color);
    }

    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;

      &.saved {
        background-color: #28a745;
      }

      &.unsaved {
        background-color: #ffc107;
      }
    }

    .status-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .changes-hint {
      color: #856404;
      font-size: 0.8rem;
      font-style: italic;
    }
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

.edit-mode-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .edit-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: var(--surface-color, #f8f9fa);
    border-bottom: 1px solid var(--border-color);
    min-height: 40px;
    
    /* Make toolbar stand out with subtle different background */
    @media (prefers-color-scheme: dark) {
      background-color: #2d2d2d;
    }
    
    .toolbar-left {
      flex: 1;
    }
    
    .toolbar-right {
      display: flex;
      gap: 0.5rem;
    }
    
    .save-btn {
      padding: 0.25rem 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      
      &:hover:not(:disabled) {
        background-color: var(--primary-color-dark, #3a5ce7);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .panel-editor {
    flex: 1;
    width: 100%;
    padding: 1rem;
    border: none;
    resize: none;
    font-family: monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    background-color: var(--secondary-color, #f8f9fa);
    color: var(--text-color);
    border-radius: 0;
    outline: none;
    
    /* Subtle inset shadow to create depth */
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05), 
                inset 0 1px 2px rgba(0, 0, 0, 0.1);

    /* Better contrast in dark mode */
    @media (prefers-color-scheme: dark) {
      background-color: #2a2a2a;
      color: #ffffff;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 
                  inset 0 1px 2px rgba(0, 0, 0, 0.4);
    }

    &:focus {
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05), 
                  inset 0 1px 2px rgba(0, 0, 0, 0.1),
                  inset 0 0 0 2px var(--primary-color);
                  
      @media (prefers-color-scheme: dark) {
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 
                    inset 0 1px 2px rgba(0, 0, 0, 0.4),
                    inset 0 0 0 2px var(--primary-color);
      }
    }
  }
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
