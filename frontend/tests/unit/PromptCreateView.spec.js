import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import { h } from "vue";
import PromptCreateView from "../../src/views/PromptCreateView.vue";
import { usePromptStore } from "../../src/stores/promptStore";

// Mock components to simplify testing
vi.mock("../../src/components/MarkdownPreview.vue", () => ({
  default: {
    name: "MarkdownPreview",
    render() {
      return h("div", { class: "mock-markdown-preview" }, this.content);
    },
    props: ["content"],
  },
}));

vi.mock("../../src/components/TagInput.vue", () => ({
  default: {
    name: "TagInput",
    render() {
      return h("div", { class: "mock-tag-input" });
    },
    props: ["modelValue"],
    emits: ["update:modelValue"],
  },
}));

vi.mock("../../src/components/PromptSidebar.vue", () => ({
  default: {
    name: "PromptSidebar",
    render() {
      return h("div", { class: "mock-prompt-sidebar" });
    },
  },
}));

// Mock window alert
global.alert = vi.fn();

// Create proper router for testing
const routes = [
  { path: "/", name: "home", component: { render: () => h("div", "Home") } },
  {
    path: "/prompts/:id",
    name: "prompt-detail",
    component: { render: () => h("div", "Detail") },
  },
];

describe("PromptCreateView", () => {
  let wrapper;
  let promptStore;
  let router;
  let originalSetTimeout;

  beforeEach(() => {
    // Save original setTimeout
    originalSetTimeout = global.setTimeout;

    // Mock setTimeout
    global.setTimeout = vi.fn().mockImplementation((fn) => {
      fn();
      return 123; // Just return a numeric ID
    });

    // Reset other mocks
    vi.clearAllMocks();

    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Setup router
    router = createRouter({
      history: createWebHistory(),
      routes,
    });

    // Set up store with mocked methods
    promptStore = usePromptStore();
    promptStore.createPrompt = vi
      .fn()
      .mockResolvedValue({ _id: "new-prompt-id" });

    // Mock router.push
    router.push = vi.fn();

    // Mount component with stubs
    wrapper = mount(PromptCreateView, {
      global: {
        plugins: [router],
        stubs: {
          RouterLink: true,
        },
      },
    });
  });

  afterEach(() => {
    // Restore setTimeout
    global.setTimeout = originalSetTimeout;
  });

  it("renders correctly with form elements", () => {
    // Basic structure tests
    expect(wrapper.find(".prompt-create-view").exists()).toBe(true);
    expect(wrapper.find("form").exists()).toBe(true);
    expect(wrapper.find("#title").exists()).toBe(true);
    expect(wrapper.find("#content-editor").exists()).toBe(true);
    expect(wrapper.find("button[type='submit']").exists()).toBe(true);
  });

  it("initializes with empty prompt data", () => {
    expect(wrapper.vm.prompt).toEqual({
      title: "",
      content: "",
      tags: [],
    });

    expect(wrapper.vm.saving).toBe(false);
  });

  it("shows validation alert when submitted with empty fields", async () => {
    // Submit form without filling it
    await wrapper.find("form").trigger("submit");

    // Alert should be shown
    expect(global.alert).toHaveBeenCalledWith("Title and content are required");

    // Store method should not be called
    expect(promptStore.createPrompt).not.toHaveBeenCalled();
  });

  it("handles successful prompt creation and navigation", async () => {
    // Fill form fields
    await wrapper.find("#title").setValue("Test Title");
    await wrapper.find("#content-editor").setValue("Test Content");

    // Submit the form
    await wrapper.find("form").trigger("submit");

    // Check that createPrompt was called with correct data
    expect(promptStore.createPrompt).toHaveBeenCalledWith({
      title: "Test Title",
      content: "Test Content",
      tags: [],
    });

    // Wait for promises to resolve
    await flushPromises();

    // Check that currentPrompt was set in store
    expect(promptStore.currentPrompt).toEqual({ _id: "new-prompt-id" });

    // Check that setTimeout was called
    expect(global.setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);

    // Check that we navigated to the correct route
    expect(router.push).toHaveBeenCalledWith("/prompts/new-prompt-id");
  });

  it("handles errors when creating prompts", async () => {
    // Setup console.error mock
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Make the store method throw an error
    const errorMessage = "API Error";
    promptStore.createPrompt.mockRejectedValueOnce(new Error(errorMessage));

    // Fill and submit form
    await wrapper.find("#title").setValue("Test Title");
    await wrapper.find("#content-editor").setValue("Test Content");
    await wrapper.find("form").trigger("submit");

    // Wait for promises to reject
    await flushPromises();

    // Error should be logged
    expect(console.error).toHaveBeenCalledWith(
      "Error creating prompt:",
      expect.objectContaining({ message: errorMessage }),
    );

    // Alert should be shown
    expect(global.alert).toHaveBeenCalledWith(
      `Failed to create prompt: ${errorMessage}`,
    );

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("changes button text while saving", async () => {
    // Make createPrompt take a long time (never resolve)
    promptStore.createPrompt.mockImplementationOnce(
      () => new Promise(() => {}),
    );

    // Fill form
    await wrapper.find("#title").setValue("Test Title");
    await wrapper.find("#content-editor").setValue("Test Content");

    // Before submit
    expect(wrapper.find("button[type='submit']").text()).toBe("Create Prompt");

    // Submit form
    await wrapper.find("form").trigger("submit");

    // After submit (during saving)
    expect(wrapper.find("button[type='submit']").text()).toBe("Creating...");
    expect(
      wrapper.find("button[type='submit']").attributes("disabled"),
    ).toBeDefined();
  });

  it("redirects to home when response has no ID", async () => {
    // Setup console.error mock
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Mock store to return a response without _id
    promptStore.createPrompt.mockResolvedValueOnce({});

    // Fill and submit form
    await wrapper.find("#title").setValue("Test Title");
    await wrapper.find("#content-editor").setValue("Test Content");
    await wrapper.find("form").trigger("submit");

    // Wait for promises to resolve
    await flushPromises();

    // Error should be logged
    expect(console.error).toHaveBeenCalledWith(
      "New prompt created but no ID returned",
    );

    // Should redirect to home
    expect(router.push).toHaveBeenCalledWith("/");

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("passes content to MarkdownPreview", async () => {
    const testContent = "# Test Markdown";
    await wrapper.find("#content-editor").setValue(testContent);

    // Find MarkdownPreview and check its props
    const preview = wrapper.findComponent({ name: "MarkdownPreview" });
    expect(preview.props("content")).toBe(testContent);
  });
});
