<template>
  <div class="ai-assistant-panel">
    <div class="panel-header">
      <button
        class="analyze-button"
        :disabled="isAnalyzing || !hasPromptContent"
        @click="analyzePrompt"
      >
        <i class="fas fa-magic" />
        <span>{{ isAnalyzing ? "Analyzing..." : "Analyze Prompt" }}</span>
      </button>
    </div>

    <div class="panel-content">
      <!-- Loading state -->
      <div
        v-if="isAnalyzing"
        class="analysis-loading"
      >
        <div class="spinner" />
        <p>Analyzing your prompt...</p>
      </div>

      <!-- No content state -->
      <div
        v-else-if="!hasPromptContent"
        class="empty-state"
      >
        <i class="fas fa-robot empty-state-icon" />
        <p>
          Enter a prompt in the editor to get AI-powered suggestions and
          improvements.
        </p>
      </div>

      <!-- Error state -->
      <div
        v-else-if="analysisError"
        class="error-state"
      >
        <i class="fas fa-exclamation-triangle error-icon" />
        <p>{{ analysisError }}</p>
        <button
          class="retry-button"
          @click="analyzePrompt"
        >
          Try Again
        </button>
      </div>

      <!-- Results state -->
      <div
        v-else-if="analysisResults"
        class="analysis-results"
      >
        <!-- Overall score section -->
        <div class="score-section">
          <div class="score-display">
            <div
              class="score-circle"
              :class="scoreClass"
            >
              {{ analysisResults.overallScore }}
            </div>
            <div class="score-label">
              Overall Score
            </div>
          </div>
          <div class="score-summary">
            <p>{{ analysisResults.summary }}</p>
          </div>
        </div>

        <!-- Suggestions section -->
        <div class="suggestions-section">
          <h4>Suggested Improvements</h4>
          <div
            v-if="
              analysisResults.suggestions && analysisResults.suggestions.length
            "
            class="suggestions-list"
          >
            <AISuggestionComponent
              v-for="(suggestion, index) in analysisResults.suggestions"
              :key="index"
              :suggestion="suggestion"
              @apply-suggestion="applySuggestion"
            />
          </div>
          <div
            v-else
            class="no-suggestions"
          >
            <p>No improvements needed! Your prompt looks great.</p>
          </div>
        </div>

        <!-- Feedback section -->
        <div class="feedback-section">
          <h4>Was this analysis helpful?</h4>
          <div class="feedback-buttons">
            <button
              class="feedback-button"
              @click="provideFeedback('helpful')"
            >
              <i class="fas fa-thumbs-up" />
              <span>Helpful</span>
            </button>
            <button
              class="feedback-button"
              @click="provideFeedback('not_helpful')"
            >
              <i class="fas fa-thumbs-down" />
              <span>Not Helpful</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Initial state (no analysis run yet) -->
      <div
        v-else
        class="initial-state"
      >
        <i class="fas fa-lightbulb initial-state-icon" />
        <p>
          Click "Analyze Prompt" to get AI-powered suggestions for improving
          your prompt.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { usePromptStore } from "../stores/promptStore";
import AISuggestionComponent from "./AISuggestionComponent.vue";

// Props
const props = defineProps({
  promptContent: {
    type: String,
    default: "",
  },
});

// Emits
const emit = defineEmits(["update:promptContent"]);

// Store access
const promptStore = usePromptStore();

// Local state
const isAnalyzing = ref(false);
const analysisResults = ref(null);
const analysisError = ref(null);
const feedbackProvided = ref(false);

// Computed properties
const hasPromptContent = computed(
  () => props.promptContent && props.promptContent.trim().length > 0,
);

const scoreClass = computed(() => {
  if (!analysisResults.value) return "";
  const score = analysisResults.value.overallScore;

  if (score >= 80) return "score-excellent";
  if (score >= 60) return "score-good";
  if (score >= 40) return "score-fair";
  return "score-needs-work";
});

// Methods
const analyzePrompt = async () => {
  if (!hasPromptContent.value) return;

  isAnalyzing.value = true;
  analysisError.value = null;

  try {
    // This will be replaced with an actual service call
    // to the backend API that handles prompt analysis
    const result = await promptStore.analyzePrompt(props.promptContent);
    analysisResults.value = result;
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    analysisError.value = "Failed to analyze prompt. Please try again.";
  } finally {
    isAnalyzing.value = false;
  }
};

const applySuggestion = (suggestion) => {
  // Update prompt content with the suggestion
  // This could be:
  // 1. A direct replacement
  // 2. An insertion at a specific position
  // 3. A smart merge of the suggestion with the current content

  // For now, we'll implement a simple replacement
  // A more sophisticated implementation would use the suggestion.type
  // to determine how to apply the change
  if (suggestion.replacementText) {
    emit("update:promptContent", suggestion.replacementText);
  }
};

const provideFeedback = (feedbackType) => {
  if (feedbackProvided.value) return;

  // In a real implementation, this would send feedback to the backend
  console.log(`User provided feedback: ${feedbackType}`);
  feedbackProvided.value = true;

  // Show a brief feedback acknowledgment
  // This could be handled via a notification system
  alert(`Thank you for your feedback!`);
};

// Watchers
watch(
  () => props.promptContent,
  () => {
    // Reset analysis when prompt content changes
    if (analysisResults.value) {
      analysisResults.value = null;
      analysisError.value = null;
      feedbackProvided.value = false;
    }
  },
);

// Lifecycle hooks
onMounted(() => {
  // Any initialization needed
});
</script>

<style lang="scss" scoped>
.ai-assistant-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--card-bg-color, #ffffff);

  .panel-header {
    display: flex;
    justify-content: stretch;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid var(--border-color, #e0e0e0);
    background-color: var(--surface-color, #f5f5f5);

  }

  .analyze-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    background-color: var(--primary-color, #4a6cf7);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 500;
    transition: background-color 0.2s;
    width: 100%;
    min-height: 40px;

    &:hover:not(:disabled) {
      background-color: var(--primary-color-dark, #3a5ce7);
    }

    &:disabled {
      background-color: var(--disabled-color, #cccccc);
      cursor: not-allowed;
      opacity: 0.7;
    }

    i {
      font-size: 1rem;
    }

    span {
      font-weight: 500;
    }
  }

  .panel-content {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
    display: flex;
    flex-direction: column;
  }

  // Loading state
  .analysis-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    flex: 1;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(74, 108, 247, 0.1);
      border-radius: 50%;
      border-top-color: var(--primary-color, #4a6cf7);
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 16px;
    }

    p {
      color: var(--text-color-light, #666666);
      text-align: center;
    }
  }

  // Empty state
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    flex: 1;
    text-align: center;

    .empty-state-icon {
      font-size: 3rem;
      color: var(--text-color-light, #999999);
      margin-bottom: 16px;
      opacity: 0.5;
    }

    p {
      color: var(--text-color-light, #666666);
      max-width: 300px;
    }
  }

  // Error state
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    flex: 1;
    text-align: center;

    .error-icon {
      font-size: 2rem;
      color: var(--error-color, #d32f2f);
      margin-bottom: 16px;
    }

    p {
      color: var(--text-color, #333333);
      margin-bottom: 16px;
    }

    .retry-button {
      background-color: var(--surface-color, #f5f5f5);
      border: 1px solid var(--border-color, #e0e0e0);
      border-radius: 4px;
      padding: 8px 16px;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background-color: var(--hover-color, #e9e9e9);
      }
    }
  }

  // Initial state
  .initial-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 16px;
    flex: 1;
    text-align: center;

    .initial-state-icon {
      font-size: 3rem;
      color: var(--primary-color, #4a6cf7);
      margin-bottom: 16px;
      opacity: 0.6;
    }

    p {
      color: var(--text-color-light, #666666);
      max-width: 300px;
    }
  }

  // Analysis results
  .analysis-results {
    display: flex;
    flex-direction: column;
    gap: 24px;

    // Score section
    .score-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border-radius: 8px;
      background-color: var(--surface-color, #f5f5f5);
      margin-bottom: 8px;

      .score-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 16px;
      }

      .score-circle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
        margin-bottom: 8px;

        &.score-excellent {
          background-color: var(--success-color, #4caf50);
        }

        &.score-good {
          background-color: var(--info-color, #2196f3);
        }

        &.score-fair {
          background-color: var(--warning-color, #ff9800);
        }

        &.score-needs-work {
          background-color: var(--error-color, #f44336);
        }
      }

      .score-label {
        font-size: 0.9rem;
        color: var(--text-color-light, #666666);
      }

      .score-summary {
        text-align: center;
        color: var(--text-color, #333333);
        font-size: 0.95rem;
      }
    }

    // Suggestions section
    .suggestions-section {
      h4 {
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 1rem;
        color: var(--text-color, #333333);
      }

      .suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .no-suggestions {
        padding: 16px;
        background-color: var(--surface-color, #f5f5f5);
        border-radius: 8px;
        text-align: center;
        color: var(--text-color-light, #666666);
      }
    }

    // Feedback section
    .feedback-section {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #e0e0e0);

      h4 {
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 1rem;
        color: var(--text-color, #333333);
        text-align: center;
      }

      .feedback-buttons {
        display: flex;
        justify-content: center;
        gap: 16px;
      }

      .feedback-button {
        display: flex;
        align-items: center;
        gap: 6px;
        background-color: var(--surface-color, #f5f5f5);
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--hover-color, #e9e9e9);
        }
      }
    }
  }
}

// Animations
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

// Media queries for responsiveness
@media (max-width: 768px) {
  .ai-assistant-panel {
    .panel-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .header-actions {
        width: 100%;

        .analyze-button {
          flex: 1;
          justify-content: center;
        }
      }
    }

    .score-section {
      flex-direction: column;

      .score-display {
        margin-bottom: 12px;
      }
    }

    .feedback-section {
      .feedback-buttons {
        flex-direction: column;
        gap: 8px;
      }
    }
  }
}
</style>
