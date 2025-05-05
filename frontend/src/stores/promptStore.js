import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

// In Pinia v3, we use the setup function syntax for stores
export const usePromptStore = defineStore("prompt", () => {
  // State
  const prompts = ref([]);
  const currentPrompt = ref(null);
  const tags = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const searchQuery = ref("");
  const selectedTag = ref("");

  // Getters
  const filteredPrompts = computed(() => {
    return prompts.value;
  });

  // Actions
  // Fetch all prompts with optional search and tag filters
  async function fetchPrompts() {
    loading.value = true;
    try {
      const params = {};
      if (searchQuery.value) params.search = searchQuery.value;
      if (selectedTag.value) params.tag = selectedTag.value;

      const response = await axios.get("/api/prompts", { params });
      prompts.value = response.data;
      error.value = null;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to fetch prompts";
      console.error("Error fetching prompts:", err);
    } finally {
      loading.value = false;
    }
  }

  // Fetch a single prompt by ID
  async function fetchPromptById(id) {
    loading.value = true;
    try {
      const response = await axios.get(`/api/prompts/${id}`);
      currentPrompt.value = response.data;
      error.value = null;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to fetch prompt";
      console.error("Error fetching prompt:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Create a new prompt
  async function createPrompt(promptData) {
    loading.value = true;
    try {
      const response = await axios.post("/api/prompts", promptData);

      // Set as current prompt
      currentPrompt.value = response.data;

      // Add to prompts array if it exists
      if (prompts.value.length) {
        prompts.value.unshift(response.data);
      }

      error.value = null;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to create prompt";
      console.error("Error creating prompt:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Update an existing prompt
  async function updatePrompt(id, promptData) {
    loading.value = true;
    try {
      const response = await axios.put(`/api/prompts/${id}`, promptData);

      // Update current prompt if it matches
      if (currentPrompt.value && currentPrompt.value._id === id) {
        currentPrompt.value = response.data;
      }

      // Update in prompts array if it exists
      const index = prompts.value.findIndex((p) => p._id === id);
      if (index !== -1) {
        prompts.value[index] = {
          ...prompts.value[index],
          ...response.data,
        };
      }

      error.value = null;
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to update prompt";
      console.error("Error updating prompt:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Delete a prompt
  async function deletePrompt(id) {
    loading.value = true;
    try {
      await axios.delete(`/api/prompts/${id}`);

      // Remove from prompts array
      prompts.value = prompts.value.filter((p) => p._id !== id);

      // Clear current prompt if it matches
      if (currentPrompt.value && currentPrompt.value._id === id) {
        currentPrompt.value = null;
      }

      error.value = null;
    } catch (err) {
      error.value = err.response?.data?.message || "Failed to delete prompt";
      console.error("Error deleting prompt:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all unique tags
  async function fetchTags() {
    try {
      const response = await axios.get("/api/tags");
      tags.value = response.data;
      return response.data;
    } catch (err) {
      console.error("Error fetching tags:", err);
      return [];
    }
  }

  // Set search query and refresh prompts
  function setSearchQuery(query) {
    // Only fetch if query actually changed
    if (searchQuery.value !== query) {
      searchQuery.value = query;
      fetchPrompts();
    }
  }

  // Set selected tag and refresh prompts
  function setSelectedTag(tag) {
    // Only fetch if tag actually changed
    if (selectedTag.value !== tag) {
      selectedTag.value = tag;
      fetchPrompts();
    }
  }

  // Clear filters
  function clearFilters() {
    const hadFilters = searchQuery.value !== "" || selectedTag.value !== "";
    searchQuery.value = "";
    selectedTag.value = "";

    // Only fetch if there were filters before
    if (hadFilters) {
      fetchPrompts();
    }
  }

  return {
    // State
    prompts,
    currentPrompt,
    tags,
    loading,
    error,
    searchQuery,
    selectedTag,
    
    // Getters
    filteredPrompts,
    
    // Actions
    fetchPrompts,
    fetchPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    fetchTags,
    setSearchQuery,
    setSelectedTag,
    clearFilters
  };
});