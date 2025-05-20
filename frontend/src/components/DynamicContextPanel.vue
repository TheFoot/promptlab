<template>
  <div
    class="dynamic-context-panel"
    :class="{ 'dynamic-context-panel--expanded': isExpanded }"
    :style="{ width: isExpanded ? `${panelWidth}px` : '0' }"
  >
    <div
      v-if="isExpanded"
      class="resize-handle"
      @mousedown="startResize"
    />

    <div
      v-if="isExpanded"
      class="panel-content"
    >
      <div class="panel-header">
        <div class="header-content">
          <h3>{{ panelTitle }}</h3>
          <button
            v-if="showCloseButton"
            class="close-button"
            title="Close panel"
            @click="closePanel"
          >
            <i class="fas fa-times" />
          </button>
        </div>
      </div>

      <!-- Mode selector component -->
      <ModeSelectorComponent
        v-model="currentMode"
        :available-modes="availableModes"
        @mode-changed="handleModeChange"
      />

      <!-- Dynamic content based on active mode -->
      <div class="panel-dynamic-content">
        <!-- Edit Mode -->
        <div
          v-if="currentMode === 'edit'"
          class="edit-mode-content"
        >
          <slot name="edit-mode" />
        </div>

        <!-- Preview Mode -->
        <div
          v-else-if="currentMode === 'preview'"
          class="preview-mode-content"
        >
          <slot name="preview-mode" />
        </div>

        <!-- Chat Mode -->
        <div
          v-else-if="currentMode === 'chat'"
          class="chat-mode-content"
        >
          <slot name="chat-mode" />
        </div>

        <!-- Design Mode -->
        <div
          v-else-if="currentMode === 'design'"
          class="design-mode-content"
        >
          <slot name="design-mode" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import ModeSelectorComponent from "./ModeSelectorComponent.vue";
import { useContextPanelStore } from "../stores/contextPanelStore";

// Props
const props = defineProps({
  panelTitle: {
    type: String,
    default: "Context Panel",
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  initialMode: {
    type: String,
    default: "edit",
    validator: (value) => ["edit", "preview", "chat", "design"].includes(value),
  },
  availableModes: {
    type: Array,
    default: () => [
      { value: "edit", label: "Edit", icon: "fas fa-edit" },
      { value: "preview", label: "Preview", icon: "fas fa-eye" },
      { value: "chat", label: "Chat", icon: "fas fa-comment" },
      { value: "design", label: "Design", icon: "fas fa-palette" },
    ],
  },
  // Control panel expanded state from parent
  expanded: {
    type: Boolean,
    default: undefined,
  },
});

// Set up store access
const contextPanelStore = useContextPanelStore();

// Set up emits
const emit = defineEmits([
  "close",
  "resize",
  "mode-changed",
  "update:expanded",
]);

// Local refs and computed properties
const currentMode = ref(props.initialMode);

// Use store state if not controlled by props
const isExpanded = computed({
  get: () =>
    props.expanded !== undefined
      ? props.expanded
      : contextPanelStore.isExpanded,
  set: (value) => {
    if (props.expanded !== undefined) {
      emit("update:expanded", value);
    } else {
      contextPanelStore.setExpanded(value);
    }
  },
});

const panelWidth = computed(() => contextPanelStore.panelWidth);

// Watch for props changes
watch(
  () => props.initialMode,
  (newMode) => {
    currentMode.value = newMode;
    contextPanelStore.setActiveMode(newMode);
  },
);

// Watch for prop-controlled expanded state
watch(
  () => props.expanded,
  (newValue) => {
    if (newValue !== undefined) {
      contextPanelStore.setExpanded(newValue);
    }
  },
);

// Methods
const closePanel = () => {
  isExpanded.value = false;
  emit("close");
};

const handleModeChange = (mode) => {
  contextPanelStore.setActiveMode(mode);
  emit("mode-changed", mode);

  // Save mode to localStorage for persistence
  localStorage.setItem("context-panel-mode", mode);
};

// Resize functionality
const startResize = (e) => {
  e.preventDefault();
  document.body.style.cursor = "ew-resize";

  const initialX = e.clientX;
  const initialWidth = panelWidth.value;

  // Send initial resize event
  emit("resize", initialWidth);

  const handleMouseMove = (e) => {
    const newWidth = initialWidth - (e.clientX - initialX);
    if (newWidth > 250 && newWidth < 600) {
      contextPanelStore.setPanelWidth(newWidth);

      // Emit resize event with new width
      emit("resize", newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";

    // Send one final resize event
    emit("resize", panelWidth.value);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// Lifecycle hooks
onMounted(() => {
  // Initialize from localStorage
  contextPanelStore.initializeFromStorage();

  // Sync local mode with store on mount
  if (contextPanelStore.activeMode !== currentMode.value) {
    currentMode.value = contextPanelStore.activeMode;
  }
});

onUnmounted(() => {
  // Cleanup if needed
});
</script>

<style lang="scss" scoped>
.dynamic-context-panel {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 0; /* Invisible when collapsed */
  background-color: var(--card-bg-color);
  border-left: 1px solid var(--border-color);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100%;

  &--expanded {
    width: 400px;
    transition: none; /* Disable transition when resizing */
  }

  .resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    background: transparent;

    &:hover {
      background-color: rgba(74, 108, 247, 0.1);
    }

    &:active {
      background-color: rgba(74, 108, 247, 0.2);
    }
  }

  .panel-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .panel-header {
    padding: 0 15px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--primary-color);
    color: white;
    height: 50px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .header-content {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
    }

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .close-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      &:active {
        background: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .panel-dynamic-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  // Mode-specific styling can be added here
  .edit-mode-content,
  .preview-mode-content,
  .chat-mode-content,
  .design-mode-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }
}

// Media queries for responsiveness
@media (max-width: 768px) {
  .dynamic-context-panel {
    &--expanded {
      width: 300px;
    }
  }
}
</style>
