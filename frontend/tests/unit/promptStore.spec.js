import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { usePromptStore } from "../../src/stores/promptStore";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("promptStore", () => {
  beforeEach(() => {
    // Create a fresh Pinia instance and make it active
    setActivePinia(createPinia());

    // Reset all mocks
    vi.resetAllMocks();
  });

  it("has the correct initial state", () => {
    const store = usePromptStore();

    expect(store.prompts).toEqual([]);
    expect(store.currentPrompt).toBeNull();
    expect(store.tags).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
    expect(store.searchQuery).toBe("");
    expect(store.selectedTag).toBe("");
  });

  it("fetches prompts successfully", async () => {
    const mockPrompts = [
      { _id: "1", title: "Prompt 1", content: "Content 1", tags: ["tag1"] },
      { _id: "2", title: "Prompt 2", content: "Content 2", tags: ["tag2"] },
    ];

    // Setup axios mock response
    axios.get.mockResolvedValue({ data: mockPrompts });

    // Create store and call fetchPrompts
    const store = usePromptStore();
    await store.fetchPrompts();

    // Check that the axios.get was called correctly
    expect(axios.get).toHaveBeenCalledWith("/api/prompts", { params: {} });

    // Check that the store state was updated correctly
    expect(store.prompts).toEqual(mockPrompts);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("handles errors when fetching prompts", async () => {
    // Setup axios to reject with an error
    const error = new Error("API Error");
    error.response = { data: { message: "Failed to fetch prompts" } };
    axios.get.mockRejectedValue(error);

    // Create store and call fetchPrompts
    const store = usePromptStore();
    await store.fetchPrompts();

    // Check that the store state reflects the error
    expect(store.prompts).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBe("Failed to fetch prompts");
  });

  it("fetches a prompt by ID successfully", async () => {
    const mockPrompt = {
      _id: "1",
      title: "Prompt 1",
      content: "Content 1",
      tags: ["tag1"],
    };

    // Setup axios mock response
    axios.get.mockResolvedValue({ data: mockPrompt });

    // Create store and call fetchPromptById
    const store = usePromptStore();
    const result = await store.fetchPromptById("1");

    // Check that the axios.get was called correctly
    expect(axios.get).toHaveBeenCalledWith("/api/prompts/1");

    // Check that the store state was updated correctly
    expect(store.currentPrompt).toEqual(mockPrompt);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();

    // Check that the function returned the prompt
    expect(result).toEqual(mockPrompt);
  });

  it("handles errors when fetching a prompt by ID", async () => {
    // Setup axios to reject with an error
    const error = new Error("API Error");
    error.response = { data: { message: "Failed to fetch prompt" } };
    axios.get.mockRejectedValue(error);

    // Create store and call fetchPromptById
    const store = usePromptStore();

    // The function should throw the error
    await expect(store.fetchPromptById("1")).rejects.toThrow();

    // Check that the store state reflects the error
    expect(store.currentPrompt).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBe("Failed to fetch prompt");
  });

  it("creates a prompt successfully", async () => {
    const newPrompt = {
      title: "New Prompt",
      content: "New Content",
      tags: ["new"],
    };
    const createdPrompt = { _id: "3", ...newPrompt };

    // Setup axios mock response
    axios.post.mockResolvedValue({ data: createdPrompt });

    // Create store and call createPrompt
    const store = usePromptStore();
    store.prompts = []; // Empty array to test the conditional logic
    const result = await store.createPrompt(newPrompt);

    // Check that the axios.post was called correctly
    expect(axios.post).toHaveBeenCalledWith("/api/prompts", newPrompt);

    // Check that the store state was updated correctly
    expect(store.currentPrompt).toEqual(createdPrompt);
    expect(store.prompts).toEqual([]);
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();

    // Check that the function returned the created prompt
    expect(result).toEqual(createdPrompt);
  });

  it("adds the created prompt to the prompts array if it exists", async () => {
    const existingPrompts = [
      { _id: "1", title: "Prompt 1", content: "Content 1", tags: ["tag1"] },
      { _id: "2", title: "Prompt 2", content: "Content 2", tags: ["tag2"] },
    ];

    const newPrompt = {
      title: "New Prompt",
      content: "New Content",
      tags: ["new"],
    };
    const createdPrompt = { _id: "3", ...newPrompt };

    // Setup axios mock response
    axios.post.mockResolvedValue({ data: createdPrompt });

    // Create store with existing prompts and call createPrompt
    const store = usePromptStore();
    store.prompts = [...existingPrompts];
    await store.createPrompt(newPrompt);

    // Check that the new prompt was added to the beginning of the array
    expect(store.prompts.length).toBe(3);
    expect(store.prompts[0]).toEqual(createdPrompt);
  });

  it("updates a prompt successfully", async () => {
    const promptId = "1";
    const updateData = { title: "Updated Title", content: "Updated Content" };
    const updatedPrompt = {
      _id: promptId,
      title: "Updated Title",
      content: "Updated Content",
      tags: ["tag1"],
    };

    // Setup axios mock response
    axios.put.mockResolvedValue({ data: updatedPrompt });

    // Create store with existing prompts and current prompt
    const store = usePromptStore();
    store.prompts = [
      { _id: "1", title: "Prompt 1", content: "Content 1", tags: ["tag1"] },
      { _id: "2", title: "Prompt 2", content: "Content 2", tags: ["tag2"] },
    ];
    store.currentPrompt = {
      _id: "1",
      title: "Prompt 1",
      content: "Content 1",
      tags: ["tag1"],
    };

    // Call updatePrompt
    const result = await store.updatePrompt(promptId, updateData);

    // Check that the axios.put was called correctly
    expect(axios.put).toHaveBeenCalledWith(
      `/api/prompts/${promptId}`,
      updateData,
    );

    // Check that the store state was updated correctly
    expect(store.currentPrompt).toEqual(updatedPrompt);
    expect(store.prompts[0].title).toBe("Updated Title");
    expect(store.prompts[0].content).toBe("Updated Content");
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();

    // Check that the function returned the updated prompt
    expect(result).toEqual(updatedPrompt);
  });

  it("deletes a prompt successfully", async () => {
    const promptId = "1";

    // Setup axios mock response
    axios.delete.mockResolvedValue({});

    // Create store with existing prompts and current prompt
    const store = usePromptStore();
    store.prompts = [
      { _id: "1", title: "Prompt 1", content: "Content 1", tags: ["tag1"] },
      { _id: "2", title: "Prompt 2", content: "Content 2", tags: ["tag2"] },
    ];
    store.currentPrompt = {
      _id: "1",
      title: "Prompt 1",
      content: "Content 1",
      tags: ["tag1"],
    };

    // Call deletePrompt
    await store.deletePrompt(promptId);

    // Check that the axios.delete was called correctly
    expect(axios.delete).toHaveBeenCalledWith(`/api/prompts/${promptId}`);

    // Check that the store state was updated correctly
    expect(store.prompts.length).toBe(1);
    expect(store.prompts[0]._id).toBe("2");
    expect(store.currentPrompt).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.error).toBeNull();
  });

  it("fetches tags successfully", async () => {
    const mockTags = ["javascript", "vue", "test"];

    // Setup axios mock response
    axios.get.mockResolvedValue({ data: mockTags });

    // Create store and call fetchTags
    const store = usePromptStore();
    const result = await store.fetchTags();

    // Check that the axios.get was called correctly
    expect(axios.get).toHaveBeenCalledWith("/api/tags");

    // Check that the store state was updated correctly
    expect(store.tags).toEqual(mockTags);

    // Check that the function returned the tags
    expect(result).toEqual(mockTags);
  });

  it("handles errors when fetching tags", async () => {
    // Setup axios to reject with an error
    axios.get.mockRejectedValue(new Error("API Error"));

    // Create store and call fetchTags
    const store = usePromptStore();
    const result = await store.fetchTags();

    // It should return an empty array on error
    expect(result).toEqual([]);

    // Store tags should remain unchanged
    expect(store.tags).toEqual([]);
  });

  it("sets search query and fetches prompts", async () => {
    // Setup axios mock response
    axios.get.mockResolvedValue({ data: [] });

    // Create store and call setSearchQuery
    const store = usePromptStore();
    await store.setSearchQuery("test query");

    // Check that the store state was updated
    expect(store.searchQuery).toBe("test query");

    // Check that fetchPrompts was called with the correct params
    expect(axios.get).toHaveBeenCalledWith("/api/prompts", {
      params: { search: "test query" },
    });
  });

  it("sets selected tag and fetches prompts", async () => {
    // Setup axios mock response
    axios.get.mockResolvedValue({ data: [] });

    // Create store and call setSelectedTag
    const store = usePromptStore();
    await store.setSelectedTag("javascript");

    // Check that the store state was updated
    expect(store.selectedTag).toBe("javascript");

    // Check that fetchPrompts was called with the correct params
    expect(axios.get).toHaveBeenCalledWith("/api/prompts", {
      params: { tag: "javascript" },
    });
  });

  it("clears filters and fetches prompts if filters were active", async () => {
    // Setup axios mock response
    axios.get.mockResolvedValue({ data: [] });

    // Create store with active filters
    const store = usePromptStore();
    store.searchQuery = "test query";
    store.selectedTag = "javascript";

    // Reset mock to check if fetchPrompts is called
    axios.get.mockClear();

    // Call clearFilters
    await store.clearFilters();

    // Check that the store state was updated
    expect(store.searchQuery).toBe("");
    expect(store.selectedTag).toBe("");

    // Check that fetchPrompts was called with empty params
    expect(axios.get).toHaveBeenCalledWith("/api/prompts", { params: {} });
  });

  it("does not fetch prompts when clearing filters if no filters were active", async () => {
    // Setup store with no active filters
    const store = usePromptStore();
    store.searchQuery = "";
    store.selectedTag = "";

    // Call clearFilters
    await store.clearFilters();

    // Check that fetchPrompts was not called
    expect(axios.get).not.toHaveBeenCalled();
  });
});
