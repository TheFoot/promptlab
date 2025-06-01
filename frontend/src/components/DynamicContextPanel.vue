<template>
  <div
    class="dynamic-context-panel"
    :style="{ width: `${panelWidthPercent}%` }"
  >
    <div
      class="resize-handle"
      @mousedown="startResize"
    />

    <div
      class="panel-content"
    >
      <!-- Dynamic content based on active mode -->
      <div class="panel-dynamic-content">
        <!-- Chat Mode -->
        <div
          v-if="currentMode === 'chat'"
          class="chat-mode-content"
        >
          <slot name="chat-mode" />
        </div>

        <!-- Edit Mode -->
        <div
          v-else-if="currentMode === 'edit'"
          class="edit-mode-content"
        >
          <slot name="edit-mode" />
        </div>

        <!-- Design Mode -->
        <div
          v-else-if="currentMode === 'design'"
          class="design-mode-content"
        >
          <AIAssistantPanel 
            v-if="!useSlotContent"
            :prompt-content="promptContent"
            @update:prompt-content="handlePromptContentUpdate"
          />
          <slot
            v-else
            name="design-mode"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import AIAssistantPanel from "./AIAssistantPanel.vue";
import { useContextPanelStore } from "../stores/contextPanelStore";

// Props
const props = defineProps({
  panelTitle: {
    type: String,
    default: "Context Panel",
  },
  showCloseButton: {
    type: Boolean,
    default: false,
  },
  initialMode: {
    type: String,
    default: "chat",
    validator: (value) => ["edit", "chat", "design"].includes(value),
  },
  availableModes: {
    type: Array,
    default: () => [
      { value: "chat", label: "Chat", icon: "fas fa-comment" },
      { value: "edit", label: "Edit", icon: "fas fa-edit" },
      { value: "design", label: "Design", icon: "fas fa-palette" },
    ],
  },
  // Prompt content for AI Assistant Panel
  promptContent: {
    type: String,
    default: "",
  },
  // Control whether to use slot content or direct component for design mode
  useSlotContent: {
    type: Boolean,
    default: false,
  },
});

// Set up store access
const contextPanelStore = useContextPanelStore();

// Set up emits
const emit = defineEmits([
  "resize",
  "mode-changed",
  "update:promptContent",
]);

// Local refs and computed properties
const currentMode = ref(props.initialMode);
const panelWidthPercent = ref(40); // Default 40% width

// Computed title based on active mode
const dynamicPanelTitle = computed(() => { // eslint-disable-line no-unused-vars
  const modeMap = {
    edit: 'Edit',
    chat: 'Chat',
    design: 'Design Assistant'
  };
  return modeMap[currentMode.value] || props.panelTitle;
});

// Watch for props changes
watch(
  () => props.initialMode,
  (newMode) => {
    currentMode.value = newMode;
    contextPanelStore.setActiveMode(newMode);
  },
);

// Watch panel width changes and save to localStorage
watch(panelWidthPercent, (newWidth) => {
  localStorage.setItem("context-panel-width-percent", newWidth.toString());
  emit("resize", newWidth);
});

// Methods
const handleModeChange = (mode) => { // eslint-disable-line no-unused-vars
  currentMode.value = mode;
  contextPanelStore.setActiveMode(mode);
  emit("mode-changed", mode);

  // Save mode to localStorage for persistence
  localStorage.setItem("context-panel-mode", mode);
};

const handlePromptContentUpdate = (newContent) => {
  emit("update:promptContent", newContent);
};

// Resize functionality
const startResize = (e) => {
  e.preventDefault();
  document.body.style.cursor = "ew-resize";

  const initialX = e.clientX;
  const initialWidthPercent = panelWidthPercent.value;
  const containerWidth = e.target.closest('.prompt-detail-view')?.offsetWidth || window.innerWidth;

  const handleMouseMove = (e) => {
    const deltaX = initialX - e.clientX; // Negative delta means expanding left
    const deltaPercent = (deltaX / containerWidth) * 100;
    const newWidthPercent = Math.max(20, Math.min(80, initialWidthPercent + deltaPercent));
    
    panelWidthPercent.value = newWidthPercent;
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// Lifecycle hooks
onMounted(() => {
  // Load panel width from localStorage
  const savedWidthPercent = localStorage.getItem("context-panel-width-percent");
  if (savedWidthPercent) {
    panelWidthPercent.value = parseInt(savedWidthPercent, 10);
  }

  // Don't load mode from localStorage here - respect the prop passed from parent
  // The parent (PromptDetailView) handles localStorage loading
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
  background-color: var(--card-bg-color);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  min-width: 300px; /* Ensure minimum usable width */

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

  .panel-dynamic-content {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  // Mode-specific styling can be added here
  .edit-mode-content,
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
    min-width: 250px;
  }
}
</style>
