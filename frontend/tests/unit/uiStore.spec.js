import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useUiStore } from "../../src/stores/uiStore";

describe("uiStore", () => {
  beforeEach(() => {
    // Create a fresh Pinia instance and make it active
    setActivePinia(createPinia());
  });

  it("has the correct initial state", () => {
    const store = useUiStore();

    expect(store.isEditingPrompt).toBe(false);
  });

  it("sets edit mode to true", () => {
    const store = useUiStore();
    store.setEditMode(true);

    expect(store.isEditingPrompt).toBe(true);
  });

  it("sets edit mode to false", () => {
    const store = useUiStore();

    // First set it to true
    store.setEditMode(true);
    expect(store.isEditingPrompt).toBe(true);

    // Then set it to false
    store.setEditMode(false);
    expect(store.isEditingPrompt).toBe(false);
  });
});
