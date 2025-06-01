<template>
  <div class="test-variation-panel">
    <div class="variation-header">
      <h3>Prompt Variations</h3>
      <div class="variation-actions">
        <button
          class="btn-create"
          @click="createNewVariation"
        >
          <i class="fas fa-plus" />
          New Variation
        </button>
        <button
          class="btn-compare"
          :disabled="selectedVariations.length < 2"
          @click="compareVariations"
        >
          <i class="fas fa-code-compare" />
          Compare Selected
        </button>
      </div>
    </div>

    <div class="variations-list">
      <div
        v-if="!variations.length"
        class="no-variations"
      >
        No variations created yet. Create a variation to compare different
        versions of your prompt.
      </div>

      <div
        v-for="(variation, index) in variations"
        :key="index"
        class="variation-item"
        :class="{ 'is-selected': selectedVariations.includes(index) }"
      >
        <div class="variation-item-header">
          <div class="variation-checkbox">
            <input
              :id="`variation-${index}`"
              type="checkbox"
              :checked="selectedVariations.includes(index)"
              @change="toggleVariationSelection(index)"
            >
            <label :for="`variation-${index}`">Variation {{ index + 1 }}</label>
          </div>

          <div class="variation-controls">
            <button
              class="btn-test"
              title="Test this variation"
              @click="testVariation(index)"
            >
              <i class="fas fa-play" />
            </button>
            <button
              class="btn-apply"
              title="Apply this variation"
              @click="applyVariation(index)"
            >
              <i class="fas fa-check" />
            </button>
            <button
              class="btn-delete"
              title="Delete this variation"
              @click="deleteVariation(index)"
            >
              <i class="fas fa-trash" />
            </button>
          </div>
        </div>

        <div class="variation-content">
          <textarea
            v-model="variations[index].content"
            @change="updateVariation(index)"
          />
        </div>

        <div
          v-if="variation.metrics"
          class="variation-metrics"
        >
          <div class="metric">
            <span class="metric-label">Response Time:</span>
            <span class="metric-value">{{
              formatMetric(variation.metrics.responseTime, "ms")
            }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Tokens:</span>
            <span class="metric-value">{{
              formatMetric(variation.metrics.tokenCount)
            }}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Cost:</span>
            <span class="metric-value">${{ formatMetric(variation.metrics.estimatedCost, "", 4) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Variation Creation Dialog -->
    <div
      v-if="showCreationDialog"
      class="variation-dialog"
    >
      <div class="dialog-content">
        <h3>Create New Variation</h3>
        <div class="form-group">
          <label for="variation-base">Base on:</label>
          <select
            id="variation-base"
            v-model="newVariationBase"
          >
            <option value="current">
              Current Prompt
            </option>
            <option
              v-for="(variation, index) in variations"
              :key="`base-${index}`"
              :value="index"
            >
              Variation {{ index + 1 }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="variation-desc">Description (optional):</label>
          <input
            id="variation-desc"
            v-model="newVariationDescription"
            type="text"
            placeholder="E.g., Increased specificity"
          >
        </div>
        <div class="form-action-buttons">
          <button
            class="btn-cancel"
            @click="cancelVariationCreation"
          >
            Cancel
          </button>
          <button
            class="btn-create"
            @click="confirmVariationCreation"
          >
            Create
          </button>
        </div>
      </div>
    </div>

    <!-- Results Comparison Modal -->
    <div
      v-if="showComparisonModal"
      class="comparison-modal"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h3>Variation Comparison</h3>
          <button
            class="btn-close"
            @click="closeComparisonModal"
          >
            ×
          </button>
        </div>
        <div class="modal-body">
          <div class="comparison-grid">
            <div class="comparison-header">
              <div class="comparison-cell">
                Variation
              </div>
              <div
                v-for="index in selectedVariationsForComparison"
                :key="`header-${index}`"
                class="comparison-cell"
              >
                Variation {{ index + 1 }}
              </div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">
                Prompt
              </div>
              <div
                v-for="index in selectedVariationsForComparison"
                :key="`prompt-${index}`"
                class="comparison-cell"
              >
                <div class="prompt-preview">
                  {{ truncateText(variations[index].content, 100) }}
                </div>
              </div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">
                Response Time
              </div>
              <div
                v-for="index in selectedVariationsForComparison"
                :key="`time-${index}`"
                class="comparison-cell"
              >
                {{
                  formatMetric(variations[index].metrics?.responseTime, "ms")
                }}
              </div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">
                Token Count
              </div>
              <div
                v-for="index in selectedVariationsForComparison"
                :key="`tokens-${index}`"
                class="comparison-cell"
              >
                {{ formatMetric(variations[index].metrics?.tokenCount) }}
              </div>
            </div>

            <div class="comparison-row">
              <div class="comparison-label">
                Cost
              </div>
              <div
                v-for="index in selectedVariationsForComparison"
                :key="`cost-${index}`"
                class="comparison-cell"
              >
                ${{
                  formatMetric(variations[index].metrics?.estimatedCost, "", 4)
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

// Define props
const props = defineProps({
  // The current prompt object with id and content
  prompt: {
    type: Object,
    required: true,
  },
});

// Define emits
const emit = defineEmits([
  "select-variation",
  "test-variation",
  "update-variation",
]);

// Reactive state
const variations = ref([]);
const selectedVariations = ref([]);
const showCreationDialog = ref(false);
const newVariationBase = ref("current");
const newVariationDescription = ref("");
const showComparisonModal = ref(false);

// Computed properties
const selectedVariationsForComparison = computed(() => {
  return selectedVariations.value.slice(0, 3); // Limit to 3 for UI reasons
});

// Watch for prompt changes to reset variations if prompt id changes
watch(
  () => props.prompt?.id,
  (newId, oldId) => {
    if (newId !== oldId) {
      // Reset variations if prompt changes
      variations.value = [];
      selectedVariations.value = [];
    }
  },
  { immediate: true },
);

// Methods
function createNewVariation() {
  showCreationDialog.value = true;
}

function cancelVariationCreation() {
  showCreationDialog.value = false;
  newVariationBase.value = "current";
  newVariationDescription.value = "";
}

function confirmVariationCreation() {
  // Determine base content for the new variation
  let baseContent = "";

  if (newVariationBase.value === "current") {
    baseContent = props.prompt.content;
  } else {
    const baseIndex = parseInt(newVariationBase.value);
    if (variations.value[baseIndex]) {
      baseContent = variations.value[baseIndex].content;
    } else {
      baseContent = props.prompt.content;
    }
  }

  // Create the new variation
  variations.value.push({
    content: baseContent,
    description: newVariationDescription.value,
    created: new Date().toISOString(),
    metrics: null,
  });

  // Close the dialog
  showCreationDialog.value = false;
  newVariationBase.value = "current";
  newVariationDescription.value = "";
}

function toggleVariationSelection(index) {
  const selectionIndex = selectedVariations.value.indexOf(index);

  if (selectionIndex >= 0) {
    // Remove from selection
    selectedVariations.value.splice(selectionIndex, 1);
  } else {
    // Add to selection
    selectedVariations.value.push(index);
  }
}

function updateVariation(index) {
  emit("update-variation", {
    index,
    variation: variations.value[index],
  });
}

function testVariation(index) {
  emit("test-variation", {
    index,
    variation: variations.value[index],
  });
}

function applyVariation(index) {
  if (index >= 0 && index < variations.value.length) {
    emit("select-variation", variations.value[index]);
  }
}

function deleteVariation(index) {
  if (index >= 0 && index < variations.value.length) {
    // Check if this variation is selected
    const selectionIndex = selectedVariations.value.indexOf(index);
    if (selectionIndex >= 0) {
      selectedVariations.value.splice(selectionIndex, 1);
    }

    // Update indexes of other selected variations
    selectedVariations.value = selectedVariations.value.map((selectedIndex) => {
      if (selectedIndex > index) {
        return selectedIndex - 1;
      }
      return selectedIndex;
    });

    // Remove the variation
    variations.value.splice(index, 1);
  }
}

function compareVariations() {
  if (selectedVariations.value.length >= 2) {
    showComparisonModal.value = true;
  }
}

function closeComparisonModal() {
  showComparisonModal.value = false;
}

// Helper functions
function formatMetric(value, unit = "", decimals = 0) {
  if (value === undefined || value === null) {
    return "--";
  }

  const formatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return `${formatted}${unit ? " " + unit : ""}`;
}

function truncateText(text, maxLength) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Methods to expose for the parent to call
// These can be used to programmatically control the component
function addVariation(variationContent, metrics = null) {
  variations.value.push({
    content: variationContent,
    created: new Date().toISOString(),
    metrics,
  });
  return variations.value.length - 1; // Return the index of the new variation
}

function updateVariationMetrics(index, metrics) {
  if (index >= 0 && index < variations.value.length) {
    variations.value[index].metrics = metrics;
  }
}

function clearVariations() {
  variations.value = [];
  selectedVariations.value = [];
}

// Expose some internal methods to the parent component
defineExpose({
  addVariation,
  updateVariationMetrics,
  clearVariations,
});
</script>

<style scoped lang="scss">
.test-variation-panel {
  margin-top: 15px;
  background-color: var(--color-background-soft);
  border-radius: 4px;
  padding: 15px;
}

.variation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;

  h3 {
    margin: 0;
    font-size: 1.1rem;
  }

  .variation-actions {
    display: flex;
    gap: 8px;

    button {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;

      i {
        font-size: 0.9rem;
      }

      &.btn-create {
        background-color: var(--color-primary);
        color: white;
      }

      &.btn-compare {
        background-color: var(--color-background-mute);

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }
  }
}

.variations-list {
  display: flex;
  flex-direction: column;
  gap: 15px;

  .no-variations {
    padding: 20px;
    text-align: center;
    color: var(--color-text-light);
    font-style: italic;
    background-color: var(--color-background);
    border-radius: 4px;
  }
}

.variation-item {
  background-color: var(--color-background);
  border-radius: 4px;
  border: 1px solid var(--color-border);
  overflow: hidden;
  transition: border-color 0.2s;

  &.is-selected {
    border-color: var(--color-primary);
  }

  .variation-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 10px;
    background-color: var(--color-background-mute);
    border-bottom: 1px solid var(--color-border);

    .variation-checkbox {
      display: flex;
      align-items: center;
      gap: 5px;

      input[type="checkbox"] {
        margin: 0;
      }

      label {
        font-weight: 500;
      }
    }

    .variation-controls {
      display: flex;
      gap: 5px;

      button {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--color-text);
        width: 28px;
        height: 28px;
        border-radius: 4px;

        &:hover {
          background-color: var(--color-background-soft);
        }

        &.btn-apply {
          color: var(--color-success);
        }

        &.btn-delete {
          color: var(--color-danger);
        }
      }
    }
  }

  .variation-content {
    padding: 10px;

    textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      resize: vertical;
      font-family: monospace;
    }
  }

  .variation-metrics {
    display: flex;
    justify-content: space-around;
    padding: 8px 10px;
    background-color: var(--color-background-mute);
    border-top: 1px solid var(--color-border);
    font-size: 0.9rem;

    .metric {
      display: flex;
      flex-direction: column;
      align-items: center;

      .metric-label {
        font-size: 0.8rem;
        color: var(--color-text-light);
      }

      .metric-value {
        font-weight: 500;
      }
    }
  }
}

// Dialog styles
.variation-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .dialog-content {
    background-color: var(--color-background);
    border-radius: 8px;
    padding: 20px;
    width: 400px;
    max-width: 90%;

    h3 {
      margin-top: 0;
    }

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
      }

      input,
      select {
        width: 100%;
        padding: 8px;
        border: 1px solid var(--color-border);
        border-radius: 4px;
      }
    }

    .form-action-buttons {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;

      button {
        padding: 8px 15px;
        border-radius: 4px;
        border: none;
        cursor: pointer;

        &.btn-cancel {
          background-color: var(--color-background-mute);
        }

        &.btn-create {
          background-color: var(--color-primary);
          color: white;
        }
      }
    }
  }
}

// Comparison modal
.comparison-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;

  .modal-content {
    background-color: var(--color-background);
    border-radius: 8px;
    width: 800px;
    max-width: 95%;
    max-height: 90vh;
    display: flex;
    flex-direction: column;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      border-bottom: 1px solid var(--color-border);

      h3 {
        margin: 0;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
      }
    }

    .modal-body {
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    }
  }

  .comparison-grid {
    display: table;
    width: 100%;
    border-collapse: collapse;

    .comparison-header {
      display: table-row;
      background-color: var(--color-background-soft);
      font-weight: bold;

      .comparison-cell {
        display: table-cell;
        padding: 10px;
        border: 1px solid var(--color-border);
      }
    }

    .comparison-row {
      display: table-row;

      &:nth-child(even) {
        background-color: var(--color-background-mute);
      }

      .comparison-label {
        display: table-cell;
        font-weight: bold;
        padding: 10px;
        border: 1px solid var(--color-border);
        width: 120px;
      }

      .comparison-cell {
        display: table-cell;
        padding: 10px;
        border: 1px solid var(--color-border);

        .prompt-preview {
          font-family: monospace;
          font-size: 0.9rem;
          white-space: pre-wrap;
          max-height: 100px;
          overflow-y: auto;
        }
      }
    }
  }
}
</style>
