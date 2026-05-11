import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";
import aiAssistService from "../services/aiAssistService.js";
import { testHistoryService } from "../services/testHistoryService.js";
import { promptVersionService } from "../services/promptVersionService.js";
import * as templateService from "../services/templateService.js";
import * as promptGenerationService from "../services/promptGenerationService.js";

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

  // Test history and version control state
  const testHistory = ref([]);
  const currentTestSession = ref(null);
  const testMetrics = ref({});
  const promptVersions = ref([]);
  const compareVersions = ref({ version1: null, version2: null });
  const testHistoryLoading = ref(false);
  const versionsLoading = ref(false);

  // Getters
  const filteredPrompts = computed(() => {
    return prompts.value;
  });

  const getCurrentPrompt = computed(() => {
    return currentPrompt.value;
  });

  const getTestHistory = computed(() => {
    return testHistory.value;
  });

  const getPromptVersions = computed(() => {
    return promptVersions.value;
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

  // AI analysis state
  const analysisResults = ref(null);
  const analysisLoading = ref(false);
  const analysisError = ref(null);

  // Template and prompt generation state
  const promptTemplates = ref([]);
  const userTemplates = ref([]);
  const promptTypes = ref([]);
  const promptPurposes = ref([]);
  const templatesLoading = ref(false);
  const templatesError = ref(null);
  const generationInProgress = ref(false);

  // Analyze a prompt using AI
  async function analyzePrompt(promptText, options = {}) {
    analysisLoading.value = true;
    analysisError.value = null;

    try {
      const result = await aiAssistService.analyzePrompt(promptText, options);
      analysisResults.value = result;
      return result;
    } catch (err) {
      analysisError.value = err.message || "Failed to analyze prompt";
      console.error("Error analyzing prompt:", err);
      throw err;
    } finally {
      analysisLoading.value = false;
    }
  }

  // Submit feedback on analysis results
  async function submitAnalysisFeedback(
    analysisId,
    feedbackType,
    comments = "",
  ) {
    try {
      return await aiAssistService.submitAnalysisFeedback(
        analysisId,
        feedbackType,
        comments,
      );
    } catch (err) {
      console.error("Error submitting analysis feedback:", err);
      throw err;
    }
  }

  // Get analysis templates
  async function getAnalysisTemplates() {
    try {
      return await aiAssistService.getAnalysisTemplates();
    } catch (err) {
      console.error("Error fetching analysis templates:", err);
      throw err;
    }
  }

  // Test History Actions
  async function fetchTestHistory(promptId, options = {}) {
    testHistoryLoading.value = true;
    try {
      const result = await testHistoryService.getTestHistoryWithFallback(
        promptId,
        options,
      );

      if (Array.isArray(result)) {
        testHistory.value = result;
      } else {
        testHistory.value = [];
      }

      return testHistory.value;
    } catch (err) {
      console.error("Error fetching test history:", err);
      testHistory.value = [];
      throw err;
    } finally {
      testHistoryLoading.value = false;
    }
  }

  async function fetchTestSession(promptId, sessionId) {
    testHistoryLoading.value = true;
    try {
      const session = await testHistoryService.getTestSession(
        promptId,
        sessionId,
      );
      currentTestSession.value = session;
      return session;
    } catch (err) {
      console.error("Error fetching test session:", err);
      throw err;
    } finally {
      testHistoryLoading.value = false;
    }
  }

  async function saveTestSession(promptId, conversation, metrics = {}) {
    testHistoryLoading.value = true;
    try {
      const result = await testHistoryService.saveTestSession(
        promptId,
        conversation,
        metrics,
      );
      currentTestSession.value = result;

      // Add to test history if it exists
      if (testHistory.value.length && result) {
        testHistory.value.unshift(result);
      }

      return result;
    } catch (err) {
      console.error("Error saving test session:", err);
      // Try local storage fallback
      const fallbackResult = testHistoryService.saveTestSessionToLocalStorage(
        promptId,
        { conversation, metrics, timestamp: new Date().toISOString() },
      );

      if (fallbackResult) {
        currentTestSession.value = fallbackResult;
        testHistory.value.unshift(fallbackResult);
      }

      return fallbackResult;
    } finally {
      testHistoryLoading.value = false;
    }
  }

  async function deleteTestSession(promptId, sessionId) {
    testHistoryLoading.value = true;
    try {
      await testHistoryService.deleteTestSession(promptId, sessionId);

      // Remove from test history if it exists
      testHistory.value = testHistory.value.filter(
        (session) => session.id !== sessionId,
      );

      // Clear current session if it matches
      if (currentTestSession.value?.id === sessionId) {
        currentTestSession.value = null;
      }
    } catch (err) {
      console.error("Error deleting test session:", err);
      throw err;
    } finally {
      testHistoryLoading.value = false;
    }
  }

  function startNewTestSession(promptId) {
    // Reset current test session
    currentTestSession.value = {
      promptId,
      timestamp: new Date().toISOString(),
      conversation: [],
      metrics: {},
    };

    return currentTestSession.value;
  }

  // Version Control Actions
  async function fetchPromptVersions(promptId) {
    versionsLoading.value = true;
    try {
      const result =
        await promptVersionService.getVersionsWithFallback(promptId);

      if (Array.isArray(result)) {
        promptVersions.value = result;
      } else {
        promptVersions.value = [];
      }

      return promptVersions.value;
    } catch (err) {
      console.error("Error fetching prompt versions:", err);
      promptVersions.value = [];
      throw err;
    } finally {
      versionsLoading.value = false;
    }
  }

  async function savePromptVersion(promptId, content, description = "") {
    versionsLoading.value = true;
    try {
      const result = await promptVersionService.saveVersionWithFallback(
        promptId,
        content,
        { description },
      );

      // Add to versions list if it exists
      if (promptVersions.value.length && result) {
        promptVersions.value.unshift(result);
      }

      return result;
    } catch (err) {
      console.error("Error saving prompt version:", err);
      throw err;
    } finally {
      versionsLoading.value = false;
    }
  }

  async function comparePromptVersions(promptId, version1Id, version2Id) {
    versionsLoading.value = true;
    try {
      compareVersions.value = {
        version1: version1Id,
        version2: version2Id,
      };

      return await promptVersionService.compareVersions(
        promptId,
        version1Id,
        version2Id,
      );
    } catch (err) {
      console.error("Error comparing prompt versions:", err);
      throw err;
    } finally {
      versionsLoading.value = false;
    }
  }

  async function restorePromptVersion(promptId, versionId) {
    versionsLoading.value = true;
    try {
      const result = await promptVersionService.restoreVersion(
        promptId,
        versionId,
      );

      // Update current prompt if it matches
      if (currentPrompt.value && currentPrompt.value._id === promptId) {
        currentPrompt.value = {
          ...currentPrompt.value,
          content: result.content,
        };
      }

      return result;
    } catch (err) {
      console.error("Error restoring prompt version:", err);

      // Fallback to manual restoration
      try {
        const version =
          (await promptVersionService.getVersionFromLocalStorage(
            promptId,
            versionId,
          )) || promptVersions.value.find((v) => v.id === versionId);

        if (
          version &&
          currentPrompt.value &&
          currentPrompt.value._id === promptId
        ) {
          // Manually update the prompt content
          currentPrompt.value = {
            ...currentPrompt.value,
            content: version.content,
          };

          // Save the changes to the server
          return await updatePrompt(promptId, { content: version.content });
        }
      } catch (fallbackErr) {
        console.error("Error in fallback version restoration:", fallbackErr);
      }

      throw err;
    } finally {
      versionsLoading.value = false;
    }
  }

  // Template and prompt generation actions
  async function fetchTemplates(filters = {}) {
    templatesLoading.value = true;
    templatesError.value = null;

    try {
      // First try to fetch from API
      const result = await templateService.getTemplates(filters);
      promptTemplates.value = result;
      return result;
    } catch (err) {
      console.error("Error fetching templates:", err);
      templatesError.value = "Failed to fetch templates";

      // Fallback to mock data for development
      try {
        const fallbackResult =
          await templateService.getFallbackTemplates(filters);
        promptTemplates.value = fallbackResult;
        return fallbackResult;
      } catch (fallbackErr) {
        console.error("Error in fallback templates:", fallbackErr);
        throw err;
      }
    } finally {
      templatesLoading.value = false;
    }
  }

  async function fetchUserTemplates() {
    templatesLoading.value = true;

    try {
      const result = await templateService.getUserTemplates();
      userTemplates.value = result;
      return result;
    } catch (err) {
      console.error("Error fetching user templates:", err);
      // Just return empty array, non-critical functionality
      userTemplates.value = [];
      return [];
    } finally {
      templatesLoading.value = false;
    }
  }

  async function fetchTemplateById(id) {
    templatesLoading.value = true;
    templatesError.value = null;

    try {
      return await templateService.getTemplateById(id);
    } catch (err) {
      console.error("Error fetching template:", err);
      templatesError.value = "Failed to fetch template";
      throw err;
    } finally {
      templatesLoading.value = false;
    }
  }

  async function saveUserTemplate(template) {
    templatesLoading.value = true;
    templatesError.value = null;

    try {
      const result = await templateService.saveUserTemplate(template);

      // Add to user templates if they exist
      if (Array.isArray(userTemplates.value)) {
        userTemplates.value.unshift(result);
      }

      return result;
    } catch (err) {
      console.error("Error saving user template:", err);
      templatesError.value = "Failed to save template";
      throw err;
    } finally {
      templatesLoading.value = false;
    }
  }

  async function applyTemplate(templateId, customizations = {}) {
    templatesLoading.value = true;
    templatesError.value = null;

    try {
      return await templateService.applyTemplate(templateId, customizations);
    } catch (err) {
      console.error("Error applying template:", err);
      templatesError.value = "Failed to apply template";
      throw err;
    } finally {
      templatesLoading.value = false;
    }
  }

  async function fetchPromptTypes() {
    try {
      const result = await templateService.getTemplateTypes();
      promptTypes.value = result;
      return result;
    } catch (err) {
      console.error("Error fetching prompt types:", err);
      // Return empty array as this is non-critical
      return [];
    }
  }

  async function fetchPromptPurposes() {
    try {
      const result = await templateService.getTemplatePurposes();
      promptPurposes.value = result;
      return result;
    } catch (err) {
      console.error("Error fetching prompt purposes:", err);
      // Return empty array as this is non-critical
      return [];
    }
  }

  async function generatePromptFromQuestionnaire(answers) {
    generationInProgress.value = true;

    try {
      console.log(
        "promptStore: Calling generateFromQuestionnaire with answers",
        answers,
      );
      // Try API first
      const result =
        await promptGenerationService.generateFromQuestionnaire(answers);
      console.log(
        "promptStore: Received result from promptGenerationService",
        result,
      );
      return result;
    } catch (err) {
      console.error("Error generating prompt from questionnaire:", err);

      // Fallback to mock generation for development
      try {
        console.log("promptStore: Trying fallback mock generation");
        const mockResult =
          await promptGenerationService.mockGenerateFromQuestionnaire(answers);
        console.log("promptStore: Received mock result", mockResult);
        return mockResult;
      } catch (fallbackErr) {
        console.error("Error in fallback prompt generation:", fallbackErr);
        throw err;
      }
    } finally {
      generationInProgress.value = false;
    }
  }

  async function refinePrompt(content, instructions) {
    generationInProgress.value = true;

    try {
      // Try API first
      return await promptGenerationService.refinePrompt(content, instructions);
    } catch (err) {
      console.error("Error refining prompt:", err);

      // Fallback to mock refinement for development
      try {
        return await promptGenerationService.mockRefinePrompt(
          content,
          instructions,
        );
      } catch (fallbackErr) {
        console.error("Error in fallback prompt refinement:", fallbackErr);
        throw err;
      }
    } finally {
      generationInProgress.value = false;
    }
  }

  async function generateSections(type, sections) {
    generationInProgress.value = true;

    try {
      return await promptGenerationService.generateSections(type, sections);
    } catch (err) {
      console.error("Error generating sections:", err);
      throw err;
    } finally {
      generationInProgress.value = false;
    }
  }

  async function generateTitleAndTags(content) {
    generationInProgress.value = true;

    try {
      return await promptGenerationService.generateTitleAndTags(content);
    } catch (err) {
      console.error("Error generating title and tags:", err);

      // Fallback with simple extraction
      return {
        title: content.split("\n")[0].replace(/^#\s*/, "") || "New Prompt",
        tags: [],
      };
    } finally {
      generationInProgress.value = false;
    }
  }

  async function comparePromptContents(originalContent, newContent) {
    generationInProgress.value = true;

    try {
      return await promptGenerationService.comparePrompts(
        originalContent,
        newContent,
      );
    } catch (err) {
      console.error("Error comparing prompts:", err);

      // Simple fallback just noting there are differences
      return {
        differences: [
          {
            type: "note",
            description:
              "The content has changed, but detailed comparison is not available.",
          },
        ],
      };
    } finally {
      generationInProgress.value = false;
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
    analysisResults,
    analysisLoading,
    analysisError,
    testHistory,
    currentTestSession,
    testMetrics,
    promptVersions,
    compareVersions,
    testHistoryLoading,
    versionsLoading,

    // Template and generation state
    promptTemplates,
    userTemplates,
    promptTypes,
    promptPurposes,
    templatesLoading,
    templatesError,
    generationInProgress,

    // Getters
    filteredPrompts,
    getCurrentPrompt,
    getTestHistory,
    getPromptVersions,

    // Actions
    fetchPrompts,
    fetchPromptById,
    createPrompt,
    updatePrompt,
    deletePrompt,
    fetchTags,
    setSearchQuery,
    setSelectedTag,
    clearFilters,

    // AI Analysis Actions
    analyzePrompt,
    submitAnalysisFeedback,
    getAnalysisTemplates,

    // Test History Actions
    fetchTestHistory,
    fetchTestSession,
    saveTestSession,
    deleteTestSession,
    startNewTestSession,

    // Version Control Actions
    fetchPromptVersions,
    savePromptVersion,
    comparePromptVersions,
    restorePromptVersion,

    // Template and Generation Actions
    fetchTemplates,
    fetchUserTemplates,
    fetchTemplateById,
    saveUserTemplate,
    applyTemplate,
    fetchPromptTypes,
    fetchPromptPurposes,
    generatePromptFromQuestionnaire,
    refinePrompt,
    generateSections,
    generateTitleAndTags,
    comparePromptContents,
  };
});
