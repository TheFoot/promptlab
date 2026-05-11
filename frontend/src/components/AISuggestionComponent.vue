<template>
  <div
    class="ai-suggestion"
    :class="{
      'ai-suggestion--expanded': isExpanded,
      'ai-suggestion--category-clarity': suggestion.category === 'clarity',
      'ai-suggestion--category-conciseness':
        suggestion.category === 'conciseness',
      'ai-suggestion--category-context': suggestion.category === 'context',
      'ai-suggestion--category-specificity':
        suggestion.category === 'specificity',
      'ai-suggestion--category-formatting':
        suggestion.category === 'formatting',
    }"
  >
    <div
      class="suggestion-header"
      @click="toggleExpanded"
    >
      <div class="suggestion-category">
        <span class="category-icon">
          <i :class="categoryIcon" />
        </span>
        <span class="category-name">{{ categoryName }}</span>
      </div>
      <div class="suggestion-title">
        {{ suggestion.title }}
      </div>
      <div class="expand-button">
        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" />
      </div>
    </div>

    <div
      v-if="isExpanded"
      class="suggestion-content"
    >
      <div class="suggestion-description">
        <p>{{ suggestion.description }}</p>
      </div>

      <div
        v-if="suggestion.replacementText"
        class="suggestion-comparison"
      >
        <div class="comparison-section">
          <div class="section-header">
            <i class="fas fa-exclamation-circle" />
            <span>Current</span>
          </div>
          <div class="section-content original-text">
            {{ suggestion.originalText }}
          </div>
        </div>

        <div class="comparison-divider">
          <i class="fas fa-arrow-down" />
        </div>

        <div class="comparison-section">
          <div class="section-header improved">
            <i class="fas fa-check-circle" />
            <span>Improved</span>
          </div>
          <div class="section-content improved-text">
            {{ suggestion.replacementText }}
          </div>
        </div>
      </div>

      <div
        v-if="
          showAlternatives &&
            suggestion.alternatives &&
            suggestion.alternatives.length
        "
        class="alternatives-section"
      >
        <h4>Alternative Suggestions</h4>
        <div class="alternatives-list">
          <div
            v-for="(alternative, index) in suggestion.alternatives"
            :key="index"
            class="alternative-item"
          >
            <div class="alternative-content">
              {{ alternative.text }}
            </div>
            <button
              class="alternative-use-button"
              @click="useAlternative(alternative)"
            >
              <i class="fas fa-check" />
              Use This
            </button>
          </div>
        </div>
      </div>

      <div class="suggestion-actions">
        <button
          v-if="suggestion.replacementText"
          class="action-button apply-button"
          @click="applySuggestion"
        >
          <i class="fas fa-check" />
          Apply Suggestion
        </button>

        <button
          v-if="suggestion.alternatives && suggestion.alternatives.length"
          class="action-button show-alternatives-button"
          @click="toggleAlternatives"
        >
          <i :class="showAlternatives ? 'fas fa-eye-slash' : 'fas fa-eye'" />
          {{ showAlternatives ? "Hide Alternatives" : "Show Alternatives" }}
        </button>

        <button
          class="action-button dismiss-button"
          @click="dismissSuggestion"
        >
          <i class="fas fa-times" />
          Dismiss
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

// Props
const props = defineProps({
  suggestion: {
    type: Object,
    required: true,
    validator: (value) => {
      return (
        value &&
        typeof value.title === "string" &&
        typeof value.category === "string"
      );
    },
  },
});

// Emits
const emit = defineEmits(["apply-suggestion", "dismiss-suggestion"]);

// Local state
const isExpanded = ref(false);
const showAlternatives = ref(false);
const isDismissed = ref(false);

// Computed properties
const categoryName = computed(() => {
  const categories = {
    clarity: "Clarity",
    conciseness: "Conciseness",
    context: "Context",
    specificity: "Specificity",
    formatting: "Formatting",
  };
  return categories[props.suggestion.category] || "General";
});

const categoryIcon = computed(() => {
  const icons = {
    clarity: "fas fa-lightbulb",
    conciseness: "fas fa-compress-alt",
    context: "fas fa-sitemap",
    specificity: "fas fa-bullseye",
    formatting: "fas fa-font",
  };
  return icons[props.suggestion.category] || "fas fa-info-circle";
});

// Methods
const toggleExpanded = () => {
  isExpanded.value = !isExpanded.value;
};

const toggleAlternatives = () => {
  showAlternatives.value = !showAlternatives.value;
};

const applySuggestion = () => {
  emit("apply-suggestion", props.suggestion);
};

const useAlternative = (alternative) => {
  // Create a new suggestion object with the alternative text
  const newSuggestion = {
    ...props.suggestion,
    replacementText: alternative.text,
  };
  emit("apply-suggestion", newSuggestion);
};

const dismissSuggestion = () => {
  isDismissed.value = true;
  emit("dismiss-suggestion", props.suggestion);
};
</script>

<style lang="scss" scoped>
.ai-suggestion {
  border-radius: 8px;
  border: 1px solid var(--border-color, #e0e0e0);
  overflow: hidden;
  background-color: var(--card-bg-color, #ffffff);
  transition:
    box-shadow 0.2s,
    transform 0.2s;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &--expanded {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  // Category-specific styling
  &--category-clarity {
    border-left: 4px solid #4a6cf7; // Primary color
  }

  &--category-conciseness {
    border-left: 4px solid #4caf50; // Success/green
  }

  &--category-context {
    border-left: 4px solid #ff9800; // Warning/orange
  }

  &--category-specificity {
    border-left: 4px solid #9c27b0; // Purple
  }

  &--category-formatting {
    border-left: 4px solid #2196f3; // Info/blue
  }

  // Header
  .suggestion-header {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    background-color: var(--surface-color, #f5f5f5);
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--hover-color, #e9e9e9);
    }

    .suggestion-category {
      display: flex;
      align-items: center;
      gap: 6px;
      padding-right: 12px;
      border-right: 1px solid var(--border-color, #e0e0e0);
      margin-right: 12px;

      .category-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      }

      .category-name {
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--text-color, #333333);
      }
    }

    .suggestion-title {
      flex: 1;
      font-size: 0.95rem;
      font-weight: 400;
      color: var(--text-color, #333333);
    }

    .expand-button {
      margin-left: 8px;
      color: var(--text-color-light, #666666);
      transition: transform 0.2s;
    }
  }

  // Content
  .suggestion-content {
    padding: 16px;
    border-top: 1px solid var(--border-color, #e0e0e0);

    .suggestion-description {
      margin-bottom: 16px;
      color: var(--text-color, #333333);
      font-size: 0.95rem;
      line-height: 1.5;
    }

    // Comparison display
    .suggestion-comparison {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;

      .comparison-section {
        border-radius: 6px;
        border: 1px solid var(--border-color, #e0e0e0);
        overflow: hidden;

        .section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background-color: var(--surface-color, #f5f5f5);
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-color-light, #666666);

          &.improved {
            color: var(--success-color, #4caf50);
          }
        }

        .section-content {
          padding: 12px;
          font-size: 0.95rem;
          line-height: 1.5;
          white-space: pre-wrap;

          &.original-text {
            background-color: #fff9e7; // Light yellow background for original
            color: var(--text-color, #333333);
          }

          &.improved-text {
            background-color: #f0f7f0; // Light green background for improved
            color: var(--text-color, #333333);
          }
        }
      }

      .comparison-divider {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 4px 0;
        color: var(--text-color-light, #666666);
      }
    }

    // Alternatives section
    .alternatives-section {
      margin-bottom: 16px;

      h4 {
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 0.95rem;
        color: var(--text-color, #333333);
      }

      .alternatives-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .alternative-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border-radius: 6px;
          background-color: var(--surface-color, #f5f5f5);

          .alternative-content {
            flex: 1;
            font-size: 0.9rem;
            line-height: 1.4;
            color: var(--text-color, #333333);
          }

          .alternative-use-button {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 6px 10px;
            border: none;
            border-radius: 4px;
            background-color: var(--primary-color, #4a6cf7);
            color: white;
            font-size: 0.8rem;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
              background-color: var(--primary-color-dark, #3a5ce7);
            }
          }
        }
      }
    }

    // Actions
    .suggestion-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;

      .action-button {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border: none;
        border-radius: 4px;
        font-size: 0.85rem;
        cursor: pointer;
        transition: all 0.2s;

        // Apply button
        &.apply-button {
          background-color: var(--primary-color, #4a6cf7);
          color: white;

          &:hover {
            background-color: var(--primary-color-dark, #3a5ce7);
          }
        }

        // Show alternatives button
        &.show-alternatives-button {
          background-color: var(--surface-color, #f5f5f5);
          color: var(--text-color, #333333);
          border: 1px solid var(--border-color, #e0e0e0);

          &:hover {
            background-color: var(--hover-color, #e9e9e9);
          }
        }

        // Dismiss button
        &.dismiss-button {
          background-color: transparent;
          color: var(--text-color-light, #666666);
          border: 1px solid var(--border-color, #e0e0e0);

          &:hover {
            background-color: var(--hover-color, #e9e9e9);
          }
        }
      }
    }
  }
}

// Media queries for responsiveness
@media (max-width: 768px) {
  .ai-suggestion {
    .suggestion-header {
      flex-wrap: wrap;

      .suggestion-category {
        padding-right: 0;
        border-right: none;
        margin-right: 0;
        margin-bottom: 4px;
        width: 100%;
      }

      .suggestion-title {
        width: 100%;
      }

      .expand-button {
        margin-left: auto;
      }
    }

    .suggestion-content {
      .suggestion-actions {
        flex-direction: column;

        .action-button {
          width: 100%;
          justify-content: center;
        }
      }
    }
  }
}
</style>
