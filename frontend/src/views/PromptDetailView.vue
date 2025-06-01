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
    :class="{ editing: contextPanelMode === 'edit' }"
  >
    <div class="sidebar">
      <PromptSidebar />
    </div>
    <div class="prompt-detail-container">
      <div class="prompt-header">
        <div class="header-content">
          <input
            v-model="editedPrompt.title"
            type="text"
            placeholder="Prompt title"
            class="title-input"
            @input="debouncedSaveTitle"
          >
          <TagInput
            v-model="editedPrompt.tags"
            @update:model-value="debouncedSaveTags"
          />
        </div>
        <div class="header-actions">
          <div
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
            :title="contextPanelMode === 'edit' ? 'Close editor' : 'Close prompt and return to dashboard'"
            @click="handleCloseButton"
          >
            ✕ Close
          </button>
        </div>
      </div>

      <div class="prompt-content">
        <div
          class="editor-container"
          :style="{ width: `${100 - contextPanelWidthPercent}%` }"
        >
          <div class="preview-wrapper">
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
        
        <!-- Always show DynamicContextPanel -->
        <DynamicContextPanel
          :prompt-content="prompt.content"
          :initial-mode="contextPanelMode"
          :use-slot-content="true"
          @update:prompt-content="handleAISuggestion"
          @mode-changed="handleModeChange"
          @resize="handlePanelResize"
        >
          <template #chat-mode>
            <div class="chat-mode-panel">
              <div class="panel-header-toolbar">
                <div class="toolbar-left">
                  <h3 class="panel-title">
                    <span class="panel-icon">💬</span>
                    Prompt Chat Agent
                  </h3>
                </div>
                <div class="toolbar-right">
                  <button
                    class="reset-btn"
                    title="Reset conversation"
                    @click="() => $refs.chatSidebar?.resetChat('manual_reset')"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
              <ChatSidebar
                ref="chatSidebar"
                :system-prompt="prompt.content"
                :embedded="true"
                :hide-toolbar="true"
                agent-mode="chat"
              />
            </div>
          </template>
          <template #edit-mode>
            <div class="edit-mode-panel">
              <div class="panel-header-toolbar">
                <div class="toolbar-left">
                  <h3 class="panel-title">
                    <span class="panel-icon">✏️</span>
                    Prompt Markdown Editor
                  </h3>
                </div>
                <div class="toolbar-right">
                  <button
                    class="save-btn"
                    :disabled="saving"
                    @click="savePanelChanges"
                  >
                    <span class="save-icon">💾</span>
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
            <div class="design-mode-panel">
              <div class="panel-header-toolbar">
                <div class="toolbar-left">
                  <h3 class="panel-title">
                    <span class="panel-icon">🎨</span>
                    Prompt Design Agent
                  </h3>
                </div>
                <div class="toolbar-right">
                  <button
                    class="reset-btn"
                    title="Reset conversation"
                    @click="() => $refs.designSidebar?.resetChat('manual_reset')"
                  >
                    🔄 Reset
                  </button>
                  <button
                    class="analyze-btn"
                    title="Analyze current prompt"
                    @click="() => $refs.designSidebar?.analyzeCurrentPrompt()"
                  >
                    🔍 Analyze
                  </button>
                </div>
              </div>
              <ChatSidebar
                ref="designSidebar"
                :system-prompt="prompt.content"
                :embedded="true"
                :hide-toolbar="true"
                agent-mode="design"
              />
            </div>
          </template>
        </DynamicContextPanel>
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


const setContextPanelMode = (mode) => {
  contextPanelMode.value = mode;
  contextPanelStore.setActiveMode(mode);
};

const navigateToHome = () => {
  router.push("/");
};

const handleCloseButton = () => {
  if (contextPanelMode.value === 'edit') {
    cancelEdit();
  } else {
    navigateToHome();
  }
};

const cancelEdit = async () => {
  // Reset edited prompt data
  editedPrompt.value = {
    title: prompt.value.title,
    content: prompt.value.content,
    tags: [...prompt.value.tags],
  };
  
  // Reset editable content to original
  editableContent.value = prompt.value.content;

  // Reset context panel mode to chat when exiting edit mode
  contextPanelMode.value = 'chat';
  contextPanelStore.setActiveMode('chat');

  // Force UI layout update after state change
  await nextTick();

  // Allow time for transitions and layout adjustments
  setTimeout(() => {
    // Trigger window resize event to ensure all components adjust
    window.dispatchEvent(new Event("resize"));
  }, 100);
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
  if (!prompt.value || !editableContent.value) return;
  
  saving.value = true;
  try {
    // Only save content from the editor panel
    await promptStore.updatePrompt(route.params.id, {
      ...prompt.value,
      content: editableContent.value
    });

    // Reset context panel mode to chat when exiting edit mode
    contextPanelMode.value = 'chat';
    contextPanelStore.setActiveMode('chat');
  } catch (error) {
    console.error("Error saving prompt content:", error);
  } finally {
    saving.value = false;
  }
};

// Debounced save functions for title and tags
let titleSaveTimeout = null;
let tagsSaveTimeout = null;

const debouncedSaveTitle = () => {
  if (titleSaveTimeout) clearTimeout(titleSaveTimeout);
  titleSaveTimeout = setTimeout(async () => {
    if (!prompt.value || !editedPrompt.value.title.trim()) return;
    
    try {
      await promptStore.updatePrompt(route.params.id, {
        ...prompt.value,
        title: editedPrompt.value.title
      });
    } catch (error) {
      console.error("Error saving title:", error);
    }
  }, 1000); // 1 second debounce
};

const debouncedSaveTags = () => {
  if (tagsSaveTimeout) clearTimeout(tagsSaveTimeout);
  tagsSaveTimeout = setTimeout(async () => {
    if (!prompt.value) return;
    
    try {
      await promptStore.updatePrompt(route.params.id, {
        ...prompt.value,
        tags: editedPrompt.value.tags
      });
    } catch (error) {
      console.error("Error saving tags:", error);
    }
  }, 1000); // 1 second debounce
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

// Watch for prompt changes to initialize editedPrompt
watch(
  () => prompt.value,
  (newPrompt) => {
    if (newPrompt) {
      editedPrompt.value = {
        title: newPrompt.title,
        content: newPrompt.content,
        tags: [...newPrompt.tags],
      };
    }
  },
  { immediate: true }
);

// Update global UI state when edit mode changes
watch(contextPanelMode, (mode) => {
  uiStore.setEditMode(mode === 'edit');
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
  align-items: flex-start;
  padding: 1rem;
  background-color: var(--card-bg-color);
  border-radius: 8px 8px 0 0;
  border: 1px solid var(--border-color);
  border-bottom: none;
  position: relative; /* For z-index to work */
  z-index: 50; /* Higher than sidebar but lower than app header */

  .title-input {
    font-size: 1.5rem;
    font-weight: bold;
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text-color);
    padding: 0;
    margin: 0;
    outline: none;
    
    &:focus {
      background-color: rgba(74, 108, 247, 0.05);
      border-radius: 4px;
      padding: 0.25rem;
    }
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

.chat-mode-panel,
.design-mode-panel,
.edit-mode-panel {
  height: 100%;
  display: flex;
  flex-direction: column;

  .panel-header-toolbar {
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
      
      .panel-title {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-color);
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .panel-icon {
        font-size: 1.1rem;
      }
    }
    
    .toolbar-right {
      display: flex;
      gap: 0.5rem;
    }
    
    .save-btn,
    .reset-btn,
    .analyze-btn {
      padding: 0.25rem 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      
      &:hover:not(:disabled) {
        background-color: var(--primary-color-dark, #3a5ce7);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .reset-btn {
      background-color: var(--secondary-color, #6c757d);
      
      &:hover:not(:disabled) {
        background-color: var(--secondary-color-dark, #545b62);
      }
    }

    .analyze-btn {
      background-color: var(--success-color, #28a745);
      
      &:hover:not(:disabled) {
        background-color: var(--success-color-dark, #1e7e34);
      }
    }

    .save-icon {
      font-size: 0.875rem;
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
