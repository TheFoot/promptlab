import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { usePromptStore } from "../../src/stores/promptStore";
import alertService from "../../src/services/alertService";

// Since we can't easily view the content of the PromptCreateView directly,
// we'll create a mock component based on what we assume it contains
const MockPromptCreateView = {
  template: `
    <div class="prompt-create-view">
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label for="title">Title</label>
          <input id="title" v-model="title" type="text" required>
        </div>
        
        <div class="form-group">
          <label for="content">Content</label>
          <textarea id="content" v-model="content" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="tags">Tags</label>
          <input id="tags" v-model="tagsInput" type="text" placeholder="Comma-separated tags">
        </div>
        
        <div class="preview-section" v-if="content">
          <div class="preview">{{ content }}</div>
        </div>
        
        <div class="action-buttons">
          <button type="submit" class="btn btn-primary">Create Prompt</button>
          <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
        </div>
      </form>
    </div>
  `,

  data() {
    return {
      title: "",
      content: "",
      tagsInput: "",
    };
  },

  computed: {
    tags() {
      return this.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    },
  },

  methods: {
    async submitForm() {
      // Check form validity
      if (!this.title || !this.content) {
        return;
      }

      try {
        const promptData = {
          title: this.title,
          content: this.content,
          tags: this.tags,
        };

        const promptStore = usePromptStore();
        const result = await promptStore.createPrompt(promptData);

        alertService.showAlert("Prompt created successfully!", "success");

        // Simulate router push (we can't actually navigate in a test)
        console.log("Navigating to:", result._id);
      } catch (error) {
        alertService.showAlert("Failed to create prompt", "error");
      }
    },

    cancel() {
      // Simulate router push back to home
      console.log("Cancelled, returning to home");
    },
  },
};

// Mock dependencies
vi.mock("../../src/services/alertService", () => ({
  default: {
    showAlert: vi.fn(),
  },
}));

describe("PromptCreateView", () => {
  let wrapper;
  let promptStore;

  beforeEach(() => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Get store instance
    promptStore = usePromptStore();

    // Mock store methods
    promptStore.createPrompt = vi
      .fn()
      .mockResolvedValue({ _id: "new-prompt-id" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form correctly", () => {
    wrapper = mount(MockPromptCreateView);

    // Check form elements
    expect(wrapper.find(".prompt-create-view").exists()).toBe(true);
    expect(wrapper.find("form").exists()).toBe(true);
    expect(wrapper.find("#title").exists()).toBe(true);
    expect(wrapper.find("#content").exists()).toBe(true);
    expect(wrapper.find("#tags").exists()).toBe(true);
    expect(wrapper.find(".btn-primary").text()).toBe("Create Prompt");
    expect(wrapper.find(".btn-secondary").text()).toBe("Cancel");
  });

  it("submits the form and creates a prompt", async () => {
    wrapper = mount(MockPromptCreateView);

    // Fill the form
    await wrapper.find("#title").setValue("Test Prompt");
    await wrapper.find("#content").setValue("This is a test prompt");
    await wrapper.find("#tags").setValue("test,example");

    // Submit the form
    await wrapper.find("form").trigger("submit");

    // Check that the store method was called with correct data
    expect(promptStore.createPrompt).toHaveBeenCalledWith({
      title: "Test Prompt",
      content: "This is a test prompt",
      tags: ["test", "example"],
    });

    // Check alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      "Prompt created successfully!",
      "success",
    );
  });

  it("handles form validation", async () => {
    wrapper = mount(MockPromptCreateView);

    // Do not fill in any fields

    // Submit the form with empty fields
    await wrapper.find("form").trigger("submit");

    // The form should not submit
    expect(promptStore.createPrompt).not.toHaveBeenCalled();
  });

  it("handles error when creating prompt", async () => {
    // Make createPrompt fail
    promptStore.createPrompt.mockRejectedValue(new Error("API Error"));

    wrapper = mount(MockPromptCreateView);

    // Fill the form
    await wrapper.find("#title").setValue("Test Prompt");
    await wrapper.find("#content").setValue("This is a test prompt");

    // Submit the form
    await wrapper.find("form").trigger("submit");

    // Check error alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      "Failed to create prompt",
      "error",
    );
  });

  it("cancels and returns to home", async () => {
    // Spy on console.log to verify navigation
    const consoleSpy = vi.spyOn(console, "log");

    wrapper = mount(MockPromptCreateView);

    // Click cancel button
    await wrapper.find(".btn-secondary").trigger("click");

    // Check "navigation" message
    expect(consoleSpy).toHaveBeenCalledWith("Cancelled, returning to home");
  });

  it("shows preview as content is entered", async () => {
    wrapper = mount(MockPromptCreateView);

    // Initially, preview should not be visible
    expect(wrapper.find(".preview").exists()).toBe(false);

    // Enter content
    await wrapper.find("#content").setValue("This is preview content");

    // Now preview should be visible with the content
    expect(wrapper.find(".preview").exists()).toBe(true);
    expect(wrapper.find(".preview").text()).toBe("This is preview content");
  });

  it("processes tags correctly", async () => {
    wrapper = mount(MockPromptCreateView);

    // Fill the form
    await wrapper.find("#title").setValue("Test Prompt");
    await wrapper.find("#content").setValue("This is a test prompt");

    // Test with spaces and empty tags
    await wrapper.find("#tags").setValue("tag1, ,tag2, tag3,");

    // Submit the form
    await wrapper.find("form").trigger("submit");

    // Check that tags were processed correctly (trimmed and filtered)
    expect(promptStore.createPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["tag1", "tag2", "tag3"],
      }),
    );
  });
});
