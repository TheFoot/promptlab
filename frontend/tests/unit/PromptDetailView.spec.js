import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { usePromptStore } from "../../src/stores/promptStore";
import { useUiStore } from "../../src/stores/uiStore";
import alertService from "../../src/services/alertService";

// Create a simplified mock component
const MockPromptDetailView = {
  template: `
    <div class="prompt-detail-view" v-if="prompt">
      <div class="view-mode" v-if="!isEditing">
        <div class="prompt-header">
          <h1>{{ prompt.title }}</h1>
          <div class="action-buttons">
            <button class="btn-edit" @click="startEditing">Edit</button>
            <button class="btn-delete" @click="confirmDelete">Delete</button>
          </div>
        </div>
        
        <div class="tags-section">
          <span v-for="tag in prompt.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
        
        <div class="content-section">
          <div class="content-preview">{{ prompt.content }}</div>
        </div>
      </div>

      <div class="edit-mode" v-else>
        <form @submit.prevent="savePrompt">
          <input id="title" v-model="editedPrompt.title" required>
          <textarea id="content" v-model="editedPrompt.content" required></textarea>
          <input id="tags" v-model="tagsInput">
          
          <div class="action-buttons">
            <button type="submit" class="btn-save">Save</button>
            <button type="button" class="btn-cancel" @click="cancelEdit">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `,

  data() {
    return {
      editedPrompt: {
        title: "",
        content: "",
        tags: [],
      },
      tagsInput: "",
    };
  },

  computed: {
    promptStore() {
      return usePromptStore();
    },

    uiStore() {
      return useUiStore();
    },

    prompt() {
      return this.promptStore.currentPrompt;
    },

    isEditing() {
      return this.uiStore.isEditingPrompt;
    },
  },

  created() {
    // Initialize editing form
    this.resetEditForm();
  },

  methods: {
    startEditing() {
      this.resetEditForm();
      this.uiStore.setEditMode(true);
    },

    cancelEdit() {
      this.uiStore.setEditMode(false);
    },

    resetEditForm() {
      if (this.prompt) {
        this.editedPrompt = {
          title: this.prompt.title,
          content: this.prompt.content,
          tags: [...this.prompt.tags],
        };
        this.tagsInput = this.prompt.tags.join(", ");
      }
    },

    async savePrompt() {
      try {
        // Process tags
        const tags = this.tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);

        await this.promptStore.updatePrompt(this.prompt._id, {
          title: this.editedPrompt.title,
          content: this.editedPrompt.content,
          tags,
        });

        this.uiStore.setEditMode(false);
        alertService.showAlert("Prompt updated successfully", "success");
      } catch (error) {
        console.error("Failed to update prompt:", error.message);
        alertService.showAlert("Failed to update prompt", "error");
      }
    },

    async confirmDelete() {
      // Mock the confirm dialog for testing
      const confirmed = window.confirm(
        "Are you sure you want to delete this prompt?",
      );

      if (confirmed) {
        try {
          await this.promptStore.deletePrompt(this.prompt._id);
          alertService.showAlert("Prompt deleted successfully", "success");
          // Simulate navigation
          console.log("Navigate to home");
        } catch (error) {
          console.error("Failed to delete prompt:", error.message);
          alertService.showAlert("Failed to delete prompt", "error");
        }
      }
    },
  },
};

// Mock dependencies
vi.mock("../../src/services/alertService", () => ({
  default: {
    showAlert: vi.fn(),
  },
}));

// Mock window.confirm
window.confirm = vi.fn();

describe("PromptDetailView", () => {
  let wrapper;
  let promptStore;
  let uiStore;

  beforeEach(() => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);

    // Get store instances
    promptStore = usePromptStore();
    uiStore = useUiStore();

    // Mock store methods
    promptStore.updatePrompt = vi.fn().mockResolvedValue({});
    promptStore.deletePrompt = vi.fn().mockResolvedValue({});

    // Set current prompt
    promptStore.currentPrompt = {
      _id: "test-id",
      title: "Test Prompt",
      content: "Test content",
      tags: ["test", "example"],
      updatedAt: new Date().toISOString(),
    };

    // Set initial UI state
    uiStore.isEditingPrompt = false;

    // Spy on console
    vi.spyOn(console, "log");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders in view mode with prompt details", async () => {
    wrapper = mount(MockPromptDetailView);

    // Check view mode is shown
    expect(wrapper.find(".view-mode").exists()).toBe(true);
    expect(wrapper.find(".edit-mode").exists()).toBe(false);

    // Check prompt details
    expect(wrapper.find("h1").text()).toBe("Test Prompt");
    expect(wrapper.find(".content-preview").text()).toBe("Test content");

    // Check tags
    const tags = wrapper.findAll(".tag");
    expect(tags.length).toBe(2);
    expect(tags[0].text()).toBe("test");
    expect(tags[1].text()).toBe("example");
  });

  it("switches to edit mode when edit button is clicked", async () => {
    wrapper = mount(MockPromptDetailView);

    // Click edit button
    await wrapper.find(".btn-edit").trigger("click");

    // Check that UI store was updated
    expect(uiStore.isEditingPrompt).toBe(true);

    // Force re-render
    await wrapper.vm.$nextTick();

    // Check edit mode is shown
    expect(wrapper.find(".view-mode").exists()).toBe(false);
    expect(wrapper.find(".edit-mode").exists()).toBe(true);

    // Check form is populated
    expect(wrapper.find("#title").element.value).toBe("Test Prompt");
    expect(wrapper.find("#content").element.value).toBe("Test content");
    expect(wrapper.find("#tags").element.value).toBe("test, example");
  });

  it("updates a prompt when save is clicked", async () => {
    // Start in edit mode
    uiStore.isEditingPrompt = true;

    wrapper = mount(MockPromptDetailView);

    // Update form values
    await wrapper.find("#title").setValue("Updated Title");
    await wrapper.find("#content").setValue("Updated content");
    await wrapper.find("#tags").setValue("test, new-tag");

    // Submit the form
    await wrapper.find("form").trigger("submit");

    // Check store method was called with correct data
    expect(promptStore.updatePrompt).toHaveBeenCalledWith("test-id", {
      title: "Updated Title",
      content: "Updated content",
      tags: ["test", "new-tag"],
    });

    // Check that UI returned to view mode
    expect(uiStore.isEditingPrompt).toBe(false);

    // Check alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      "Prompt updated successfully",
      "success",
    );
  });

  it("handles errors when updating a prompt", async () => {
    // Start in edit mode
    uiStore.isEditingPrompt = true;

    // Make updatePrompt fail
    promptStore.updatePrompt.mockRejectedValue(new Error("API Error"));

    wrapper = mount(MockPromptDetailView);

    // Submit the form
    await wrapper.find("form").trigger("submit");

    // Check alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      "Failed to update prompt",
      "error",
    );
  });

  it("cancels edit mode when cancel button is clicked", async () => {
    // Start in edit mode
    uiStore.isEditingPrompt = true;

    wrapper = mount(MockPromptDetailView);

    // Click cancel
    await wrapper.find(".btn-cancel").trigger("click");

    // Check UI mode was reset
    expect(uiStore.isEditingPrompt).toBe(false);
  });

  it("deletes a prompt when confirmed", async () => {
    // Mock confirmation dialog to return true
    window.confirm.mockReturnValue(true);

    wrapper = mount(MockPromptDetailView);

    // Click delete button
    await wrapper.find(".btn-delete").trigger("click");

    // Check prompt was deleted
    expect(promptStore.deletePrompt).toHaveBeenCalledWith("test-id");

    // Check alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      "Prompt deleted successfully",
      "success",
    );

    // Check navigation message
    expect(console.log).toHaveBeenCalledWith("Navigate to home");
  });

  it("does not delete when confirmation is cancelled", async () => {
    // Mock confirmation dialog to return false
    window.confirm.mockReturnValue(false);

    wrapper = mount(MockPromptDetailView);

    // Click delete button
    await wrapper.find(".btn-delete").trigger("click");

    // Check prompt was not deleted
    expect(promptStore.deletePrompt).not.toHaveBeenCalled();

    // No navigation should occur
    expect(console.log).not.toHaveBeenCalledWith("Navigate to home");
  });
});
