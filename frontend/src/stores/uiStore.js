import { defineStore } from "pinia";
import { ref } from "vue";

// In Pinia v3, we prefer the setup style for defining stores
export const useUiStore = defineStore("ui", () => {
  // State
  const isEditingPrompt = ref(false);

  // Actions
  function setEditMode(isEditing) {
    isEditingPrompt.value = isEditing;
  }

  return {
    isEditingPrompt,
    setEditMode,
  };
});
