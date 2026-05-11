import { defineStore } from "pinia";
import { ref } from "vue";

// Define the context panel mode store using Pinia setup style
export const useContextPanelStore = defineStore("contextPanel", () => {
  // State
  const activeMode = ref("edit"); // Default mode: edit, preview, chat, design
  const panelWidth = ref(400); // Default width in px
  const isExpanded = ref(false); // Panel expanded state

  // Actions
  function setActiveMode(mode) {
    if (["edit", "preview", "chat", "design"].includes(mode)) {
      activeMode.value = mode;
    } else {
      console.error(
        `Invalid mode: ${mode}. Must be one of: edit, preview, chat, design`,
      );
    }
  }

  function setPanelWidth(width) {
    // Ensure width is within reasonable bounds
    const newWidth = Math.min(Math.max(250, width), 600);
    panelWidth.value = newWidth;
    // Save to localStorage for persistence
    localStorage.setItem("context-panel-width", newWidth.toString());
  }

  function setExpanded(expanded) {
    isExpanded.value = expanded;
  }

  function toggleExpanded() {
    isExpanded.value = !isExpanded.value;
  }

  // Initialize from localStorage if available
  function initializeFromStorage() {
    const savedWidth = localStorage.getItem("context-panel-width");
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      // Ensure width is within reasonable bounds
      if (width >= 250 && width <= 600) {
        panelWidth.value = width;
      }
    }

    const savedMode = localStorage.getItem("context-panel-mode");
    if (
      savedMode &&
      ["edit", "preview", "chat", "design"].includes(savedMode)
    ) {
      activeMode.value = savedMode;
    }
  }

  return {
    activeMode,
    panelWidth,
    isExpanded,
    setActiveMode,
    setPanelWidth,
    setExpanded,
    toggleExpanded,
    initializeFromStorage,
  };
});
