import { describe, it, expect, vi, beforeEach } from "vitest";
import { shallowMount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import { usePromptStore } from "../../src/stores/promptStore";
import PromptCreateView from "../../src/views/PromptCreateView.vue";
// alertService is imported but used in the mocked implementation
// import alertService from "../../src/services/alertService";

// Mock dependencies
vi.mock("../../src/services/alertService", () => ({
  default: {
    showAlert: vi.fn(),
  },
}));

// Mock MarkdownPreview component that might be used
vi.mock("../../src/components/MarkdownPreview.vue", () => ({
  default: {
    name: "MarkdownPreview",
    template: '<div class="mock-markdown-preview">{{ content }}</div>',
    props: ["content"],
  },
}));

// Mock TagInput component
vi.mock("../../src/components/TagInput.vue", () => ({
  default: {
    name: "TagInput",
    template: '<div class="mock-tag-input"></div>',
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
}));

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home" },
    { path: "/prompts/new", name: "prompt-create" },
    { path: "/prompts/:id", name: "prompt-detail" },
  ],
});

describe("PromptCreateView Direct", () => {
  let wrapper;
  let promptStore;

  beforeEach(() => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Get store instance
    promptStore = usePromptStore();

    // Mock store methods
    promptStore.createPrompt = vi.fn().mockResolvedValue({ _id: "new-id" });

    // Mock router push
    router.push = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the view correctly", () => {
    wrapper = shallowMount(PromptCreateView, {
      global: {
        plugins: [router],
      },
    });

    // Check that the component is rendered
    expect(wrapper.exists()).toBe(true);
  });
});
