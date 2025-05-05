import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    isEditingPrompt: false,
  }),

  actions: {
    setEditMode(isEditing) {
      this.isEditingPrompt = isEditing;
    },
  },
});
