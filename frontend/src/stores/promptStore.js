import { defineStore } from 'pinia';
import axios from 'axios';

export const usePromptStore = defineStore('prompt', {
  state: () => ({
    prompts: [],
    currentPrompt: null,
    tags: [],
    loading: false,
    error: null,
    searchQuery: '',
    selectedTag: '',
  }),

  getters: {
    filteredPrompts: (state) => {
      return state.prompts;
    },
  },

  actions: {
    // Fetch all prompts with optional search and tag filters
    async fetchPrompts() {
      this.loading = true;
      try {
        const params = {};
        if (this.searchQuery) params.search = this.searchQuery;
        if (this.selectedTag) params.tag = this.selectedTag;

        const response = await axios.get('/api/prompts', { params });
        this.prompts = response.data;
        this.error = null;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch prompts';
        console.error('Error fetching prompts:', error);
      } finally {
        this.loading = false;
      }
    },

    // Fetch a single prompt by ID
    async fetchPromptById(id) {
      this.loading = true;
      try {
        const response = await axios.get(`/api/prompts/${id}`);
        this.currentPrompt = response.data;
        this.error = null;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch prompt';
        console.error('Error fetching prompt:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Create a new prompt
    async createPrompt(promptData) {
      this.loading = true;
      try {
        const response = await axios.post('/api/prompts', promptData);
        
        // Set as current prompt
        this.currentPrompt = response.data;
        
        // Add to prompts array if it exists
        if (this.prompts.length) {
          this.prompts.unshift(response.data);
        }
        
        this.error = null;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to create prompt';
        console.error('Error creating prompt:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update an existing prompt
    async updatePrompt(id, promptData) {
      this.loading = true;
      try {
        const response = await axios.put(`/api/prompts/${id}`, promptData);
        
        // Update current prompt if it matches
        if (this.currentPrompt && this.currentPrompt._id === id) {
          this.currentPrompt = response.data;
        }
        
        // Update in prompts array if it exists
        const index = this.prompts.findIndex(p => p._id === id);
        if (index !== -1) {
          this.prompts[index] = {
            ...this.prompts[index],
            ...response.data,
          };
        }
        
        this.error = null;
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update prompt';
        console.error('Error updating prompt:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Delete a prompt
    async deletePrompt(id) {
      this.loading = true;
      try {
        await axios.delete(`/api/prompts/${id}`);
        
        // Remove from prompts array
        this.prompts = this.prompts.filter(p => p._id !== id);
        
        // Clear current prompt if it matches
        if (this.currentPrompt && this.currentPrompt._id === id) {
          this.currentPrompt = null;
        }
        
        this.error = null;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to delete prompt';
        console.error('Error deleting prompt:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Fetch all unique tags
    async fetchTags() {
      try {
        const response = await axios.get('/api/tags');
        this.tags = response.data;
        return response.data;
      } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
      }
    },

    // Set search query and refresh prompts
    setSearchQuery(query) {
      // Only fetch if query actually changed
      if (this.searchQuery !== query) {
        this.searchQuery = query;
        this.fetchPrompts();
      }
    },

    // Set selected tag and refresh prompts
    setSelectedTag(tag) {
      // Only fetch if tag actually changed
      if (this.selectedTag !== tag) {
        this.selectedTag = tag;
        this.fetchPrompts();
      }
    },

    // Clear filters
    clearFilters() {
      const hadFilters = this.searchQuery !== '' || this.selectedTag !== '';
      this.searchQuery = '';
      this.selectedTag = '';
      
      // Only fetch if there were filters before
      if (hadFilters) {
        this.fetchPrompts();
      }
    },
  },
});
