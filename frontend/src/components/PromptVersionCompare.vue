<template>
  <div class="prompt-version-compare">
    <div class="compare-header">
      <h3>Compare Prompt Versions</h3>
      <div class="version-selectors">
        <div class="version-selector">
          <label for="version1">Version 1:</label>
          <select
            id="version1"
            v-model="selectedVersionIds.version1"
            @change="loadVersions"
          >
            <option value="">
              Select version...
            </option>
            <option
              v-for="version in versions"
              :key="`v1-${version.id}`"
              :value="version.id"
            >
              v{{ version.versionNumber }}: {{ formatDate(version.createdAt) }}
            </option>
          </select>
        </div>

        <div class="swap-button">
          <button
            title="Swap versions"
            @click="swapVersions"
          >
            <i class="fas fa-exchange-alt" />
          </button>
        </div>

        <div class="version-selector">
          <label for="version2">Version 2:</label>
          <select
            id="version2"
            v-model="selectedVersionIds.version2"
            @change="loadVersions"
          >
            <option value="">
              Select version...
            </option>
            <option
              v-for="version in versions"
              :key="`v2-${version.id}`"
              :value="version.id"
            >
              v{{ version.versionNumber }}: {{ formatDate(version.createdAt) }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading-indicator"
    >
      <i class="fas fa-spinner fa-spin" />
      Loading versions...
    </div>

    <div
      v-else-if="!selectedVersionIds.version1 || !selectedVersionIds.version2"
      class="select-versions-message"
    >
      Please select two versions to compare.
    </div>

    <div
      v-else-if="comparisonData"
      class="comparison-container"
    >
      <div class="versions-metadata">
        <div class="version-info">
          <h4>Version {{ comparisonData.version1.versionNumber }}</h4>
          <div class="metadata-item">
            <span class="metadata-label">Created:</span>
            <span class="metadata-value">{{
              formatDateLong(comparisonData.version1.createdAt)
            }}</span>
          </div>
          <div
            v-if="comparisonData.version1.metadata?.description"
            class="metadata-item"
          >
            <span class="metadata-label">Description:</span>
            <span class="metadata-value">{{
              comparisonData.version1.metadata.description
            }}</span>
          </div>
          <div
            v-if="comparisonData.version1.metadata?.changedBy"
            class="metadata-item"
          >
            <span class="metadata-label">Changed by:</span>
            <span class="metadata-value">{{
              comparisonData.version1.metadata.changedBy
            }}</span>
          </div>
          <div class="version-actions">
            <button
              class="btn-restore"
              title="Restore to this version"
              @click="restoreVersion(comparisonData.version1.id)"
            >
              <i class="fas fa-history" />
              Restore
            </button>
          </div>
        </div>

        <div class="version-info">
          <h4>Version {{ comparisonData.version2.versionNumber }}</h4>
          <div class="metadata-item">
            <span class="metadata-label">Created:</span>
            <span class="metadata-value">{{
              formatDateLong(comparisonData.version2.createdAt)
            }}</span>
          </div>
          <div
            v-if="comparisonData.version2.metadata?.description"
            class="metadata-item"
          >
            <span class="metadata-label">Description:</span>
            <span class="metadata-value">{{
              comparisonData.version2.metadata.description
            }}</span>
          </div>
          <div
            v-if="comparisonData.version2.metadata?.changedBy"
            class="metadata-item"
          >
            <span class="metadata-label">Changed by:</span>
            <span class="metadata-value">{{
              comparisonData.version2.metadata.changedBy
            }}</span>
          </div>
          <div class="version-actions">
            <button
              class="btn-restore"
              title="Restore to this version"
              @click="restoreVersion(comparisonData.version2.id)"
            >
              <i class="fas fa-history" />
              Restore
            </button>
          </div>
        </div>
      </div>

      <div class="diff-container">
        <div class="diff-header">
          <h4>Differences</h4>
          <div class="diff-legend">
            <span class="legend-item removed">
              <span class="color-box" />
              Removed
            </span>
            <span class="legend-item added">
              <span class="color-box" />
              Added
            </span>
          </div>
        </div>

        <div class="diff-view">
          <div
            v-if="isTextDiffAvailable"
            class="text-diff"
          >
            <div
              v-for="(lineGroup, i) in diffLines"
              :key="`group-${i}`"
              class="diff-section"
            >
              <div
                v-if="lineGroup.type === 'unchanged'"
                class="diff-unchanged"
              >
                <div
                  v-for="(line, j) in lineGroup.lines"
                  :key="`unc-${i}-${j}`"
                  class="line unchanged"
                >
                  <pre>{{ line }}</pre>
                </div>
              </div>

              <div
                v-else
                class="diff-changed"
              >
                <div class="column removed">
                  <div
                    v-for="(line, j) in lineGroup.removed"
                    :key="`rem-${i}-${j}`"
                    class="line removed"
                  >
                    <pre>{{ line }}</pre>
                  </div>
                </div>
                <div class="column added">
                  <div
                    v-for="(line, j) in lineGroup.added"
                    :key="`add-${i}-${j}`"
                    class="line added"
                  >
                    <pre>{{ line }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="side-by-side"
          >
            <div class="column">
              <h5>Version {{ comparisonData.version1.versionNumber }}</h5>
              <pre>{{ comparisonData.version1.content }}</pre>
            </div>
            <div class="column">
              <h5>Version {{ comparisonData.version2.versionNumber }}</h5>
              <pre>{{ comparisonData.version2.content }}</pre>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="hasTestResults"
        class="metrics-comparison"
      >
        <div class="metrics-header">
          <h4>Test Results Comparison</h4>
        </div>

        <div class="metrics-grid">
          <div class="metric-column header">
            <div class="metric-name">
              Metric
            </div>
            <div
              v-for="(name, key) in metricsToCompare"
              :key="`header-${key}`"
              class="metric-row"
            >
              <span>{{ name }}</span>
            </div>
          </div>

          <div class="metric-column">
            <div class="metric-header">
              Version {{ comparisonData.version1.versionNumber }}
            </div>
            <div
              v-for="(name, key) in metricsToCompare"
              :key="`v1-${key}`"
              class="metric-row"
            >
              <span>{{
                formatMetricValue(comparisonData.version1.testResults?.[key])
              }}</span>
            </div>
          </div>

          <div class="metric-column">
            <div class="metric-header">
              Version {{ comparisonData.version2.versionNumber }}
            </div>
            <div
              v-for="(name, key) in metricsToCompare"
              :key="`v2-${key}`"
              class="metric-row"
            >
              <span>{{
                formatMetricValue(comparisonData.version2.testResults?.[key])
              }}</span>
            </div>
          </div>

          <div class="metric-column">
            <div class="metric-header">
              Difference
            </div>
            <div
              v-for="(name, key) in metricsToCompare"
              :key="`diff-${key}`"
              class="metric-row"
            >
              <span :class="getMetricChangeClass(key)">
                {{ formatMetricDifference(key) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { promptVersionService } from "../services/promptVersionService";

// Define props
const props = defineProps({
  promptId: {
    type: String,
    required: true,
  },
});

// Define emits
const emit = defineEmits(["restore-version"]);

// Reactive state
const versions = ref([]);
const selectedVersionIds = ref({
  version1: "",
  version2: "",
});
const comparisonData = ref(null);
const loading = ref(false);

// Metrics to compare with display names
const metricsToCompare = {
  successRate: "Success Rate",
  averageResponseTime: "Avg. Response Time",
  tokenCount: "Token Count",
  estimatedCost: "Est. Cost",
};

// Computed properties
const isTextDiffAvailable = computed(() => {
  return comparisonData.value && comparisonData.value.diff;
});

const hasTestResults = computed(() => {
  return (
    comparisonData.value &&
    (comparisonData.value.version1.testResults ||
      comparisonData.value.version2.testResults)
  );
});

const diffLines = computed(() => {
  if (!comparisonData.value || !comparisonData.value.diff) return [];

  // Process diff into sections for display
  const { unchanged, added, removed } = comparisonData.value.diff;

  // Create a map of line numbers to content for each category
  const unchangedMap = new Map(
    unchanged.map((item) => [item.line, item.content]),
  );
  const addedMap = new Map(added.map((item) => [item.line, item.content]));
  const removedMap = new Map(removed.map((item) => [item.line, item.content]));

  // Get all line numbers
  const allLines = [
    ...new Set([
      ...unchanged.map((item) => item.line),
      ...added.map((item) => item.line),
      ...removed.map((item) => item.line),
    ]),
  ].sort((a, b) => a - b);

  // Group lines into sections of unchanged and changed
  const result = [];

  let currentGroup = null;

  for (let i = 0; i < allLines.length; i++) {
    const lineNum = allLines[i];

    if (unchangedMap.has(lineNum)) {
      // This is an unchanged line

      if (!currentGroup || currentGroup.type !== "unchanged") {
        // Start a new unchanged group
        if (currentGroup) {
          result.push(currentGroup);
        }

        currentGroup = {
          type: "unchanged",
          lines: [],
        };
      }

      currentGroup.lines.push(unchangedMap.get(lineNum));
    } else {
      // This is a changed line

      if (!currentGroup || currentGroup.type !== "changed") {
        // Start a new changed group
        if (currentGroup) {
          result.push(currentGroup);
        }

        currentGroup = {
          type: "changed",
          removed: [],
          added: [],
        };
      }

      if (removedMap.has(lineNum)) {
        currentGroup.removed.push(removedMap.get(lineNum));
      }

      if (addedMap.has(lineNum)) {
        currentGroup.added.push(addedMap.get(lineNum));
      }
    }
  }

  // Add the last group
  if (currentGroup) {
    result.push(currentGroup);
  }

  return result;
});

// Lifecycle hooks
onMounted(async () => {
  await loadVersionsList();
});

// Watch for changes in selected versions
watch(
  selectedVersionIds,
  async (newIds, oldIds) => {
    if (
      newIds.version1 &&
      newIds.version2 &&
      (newIds.version1 !== oldIds.version1 ||
        newIds.version2 !== oldIds.version2)
    ) {
      await loadVersions();
    }
  },
  { deep: true },
);

// Methods
async function loadVersionsList() {
  loading.value = true;

  try {
    // Using the fallback method to handle development environment
    const versionsList = await promptVersionService.getVersionsWithFallback(
      props.promptId,
    );

    if (Array.isArray(versionsList)) {
      versions.value = versionsList;

      // If we have at least 2 versions, select the two most recent ones by default
      if (versions.value.length >= 2) {
        selectedVersionIds.value = {
          version1: versions.value[1].id, // Second most recent
          version2: versions.value[0].id, // Most recent
        };

        await loadVersions();
      }
    } else {
      versions.value = [];
    }
  } catch (error) {
    console.error("Error loading versions list:", error);
    versions.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadVersions() {
  if (
    !selectedVersionIds.value.version1 ||
    !selectedVersionIds.value.version2
  ) {
    comparisonData.value = null;
    return;
  }

  loading.value = true;

  try {
    // Get the comparison data from the service
    const comparison = await promptVersionService.compareVersions(
      props.promptId,
      selectedVersionIds.value.version1,
      selectedVersionIds.value.version2,
    );

    // Add the diff data manually (in real implementation, this would come from the service)
    if (comparison.version1 && comparison.version2) {
      comparison.diff = promptVersionService.createTextDiff(
        comparison.version1.content,
        comparison.version2.content,
      );
    }

    comparisonData.value = comparison;
  } catch (error) {
    console.error("Error loading versions comparison:", error);
    comparisonData.value = null;
  } finally {
    loading.value = false;
  }
}

function swapVersions() {
  const temp = selectedVersionIds.value.version1;
  selectedVersionIds.value.version1 = selectedVersionIds.value.version2;
  selectedVersionIds.value.version2 = temp;
}

async function restoreVersion(versionId) {
  if (!versionId) return;

  const confirmation = confirm(
    "Are you sure you want to restore this version? This will replace the current prompt content.",
  );

  if (!confirmation) return;

  try {
    await promptVersionService.restoreVersion(props.promptId, versionId);

    // Notify parent component about the restoration
    emit("restore-version", versionId);

    // Show success message
    alert("Prompt has been restored to the selected version.");
  } catch (error) {
    console.error("Error restoring version:", error);
    alert("Failed to restore the version. Please try again.");
  }
}

// Helper methods
function formatDate(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleDateString();
}

function formatDateLong(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleString();
}

function formatMetricValue(value) {
  if (value === undefined || value === null) {
    return "--";
  }

  if (typeof value === "number") {
    if (value < 0.01) {
      return value.toFixed(4);
    } else if (value < 1) {
      return value.toFixed(2);
    } else {
      return Math.round(value).toString();
    }
  }

  return value.toString();
}

function formatMetricDifference(key) {
  if (!comparisonData.value) return "--";

  const v1 = comparisonData.value.version1.testResults?.[key];
  const v2 = comparisonData.value.version2.testResults?.[key];

  if (v1 === undefined || v2 === undefined) return "--";

  const diff = v2 - v1;
  const isPercentage = key === "successRate";

  // Format the difference
  let diffStr;
  if (Math.abs(diff) < 0.01) {
    diffStr = diff.toFixed(4);
  } else if (Math.abs(diff) < 1) {
    diffStr = diff.toFixed(2);
  } else {
    diffStr = Math.round(diff).toString();
  }

  // Add + prefix for positive differences
  if (diff > 0) {
    diffStr = "+" + diffStr;
  }

  // Add percentage sign if relevant
  if (isPercentage) {
    diffStr += "%";
  }

  return diffStr;
}

function getMetricChangeClass(key) {
  if (!comparisonData.value) return "";

  const v1 = comparisonData.value.version1.testResults?.[key];
  const v2 = comparisonData.value.version2.testResults?.[key];

  if (v1 === undefined || v2 === undefined) return "";

  const diff = v2 - v1;

  // For most metrics, higher is better
  let isPositive = diff > 0;

  // For response time and cost, lower is better
  if (key === "averageResponseTime" || key === "estimatedCost") {
    isPositive = diff < 0;
  }

  return isPositive ? "positive-change" : "negative-change";
}
</script>

<style scoped lang="scss">
.prompt-version-compare {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.compare-header {
  padding: 15px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0 0 10px 0;
  }

  .version-selectors {
    display: flex;
    align-items: center;
    gap: 10px;

    .version-selector {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 5px;

      label {
        min-width: 70px;
      }

      select {
        flex: 1;
        padding: 5px;
        border-radius: 4px;
        border: 1px solid var(--color-border);
      }
    }

    .swap-button {
      button {
        background: none;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;

        &:hover {
          background-color: var(--color-background-mute);
        }
      }
    }
  }
}

.loading-indicator {
  padding: 30px;
  text-align: center;
  color: var(--color-text-light);

  i {
    margin-right: 10px;
  }
}

.select-versions-message {
  padding: 30px;
  text-align: center;
  color: var(--color-text-light);
  font-style: italic;
}

.comparison-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
}

.versions-metadata {
  display: flex;
  gap: 20px;

  .version-info {
    flex: 1;
    padding: 10px;
    background-color: var(--color-background-soft);
    border-radius: 4px;

    h4 {
      margin: 0 0 10px 0;
      padding-bottom: 5px;
      border-bottom: 1px solid var(--color-border);
    }

    .metadata-item {
      display: flex;
      margin-bottom: 5px;

      .metadata-label {
        width: 80px;
        color: var(--color-text-light);
      }

      .metadata-value {
        flex: 1;
      }
    }

    .version-actions {
      margin-top: 10px;

      button {
        background: none;
        border: 1px solid var(--color-border);
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 5px;

        &:hover {
          background-color: var(--color-background-mute);
        }

        &.btn-restore {
          color: var(--color-primary);
        }
      }
    }
  }
}

.diff-container {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;

  .diff-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    background-color: var(--color-background-soft);
    border-bottom: 1px solid var(--color-border);

    h4 {
      margin: 0;
    }

    .diff-legend {
      display: flex;
      gap: 15px;

      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 0.9em;

        .color-box {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        &.removed .color-box {
          background-color: rgba(255, 0, 0, 0.2);
        }

        &.added .color-box {
          background-color: rgba(0, 128, 0, 0.2);
        }
      }
    }
  }

  .diff-view {
    background-color: var(--color-background);
    padding: 10px;
    max-height: 500px;
    overflow-y: auto;

    .text-diff {
      font-family: monospace;
      font-size: 0.9em;
      white-space: nowrap;

      .diff-section {
        margin-bottom: 5px;
      }

      .diff-unchanged {
        .line {
          padding: 2px 5px;

          pre {
            margin: 0;
            white-space: pre-wrap;
          }
        }
      }

      .diff-changed {
        display: flex;

        .column {
          flex: 1;

          &.removed {
            background-color: rgba(255, 0, 0, 0.1);
            margin-right: 2px;
          }

          &.added {
            background-color: rgba(0, 128, 0, 0.1);
            margin-left: 2px;
          }

          .line {
            padding: 2px 5px;

            pre {
              margin: 0;
              white-space: pre-wrap;
            }

            &.removed {
              background-color: rgba(255, 0, 0, 0.2);
            }

            &.added {
              background-color: rgba(0, 128, 0, 0.2);
            }
          }
        }
      }
    }

    .side-by-side {
      display: flex;
      gap: 10px;

      .column {
        flex: 1;
        padding: 10px;
        border: 1px solid var(--color-border);
        border-radius: 4px;

        h5 {
          margin: 0 0 10px 0;
          padding-bottom: 5px;
          border-bottom: 1px solid var(--color-border);
        }

        pre {
          margin: 0;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 0.9em;
        }
      }
    }
  }
}

.metrics-comparison {
  border: 1px solid var(--color-border);
  border-radius: 4px;
  overflow: hidden;

  .metrics-header {
    padding: 10px 15px;
    background-color: var(--color-background-soft);
    border-bottom: 1px solid var(--color-border);

    h4 {
      margin: 0;
    }
  }

  .metrics-grid {
    display: flex;
    background-color: var(--color-background);

    .metric-column {
      flex: 1;
      padding: 10px;

      &.header {
        width: 180px;
        flex: 0 0 auto;
        background-color: var(--color-background-soft);
        border-right: 1px solid var(--color-border);
      }

      .metric-header {
        font-weight: 500;
        margin-bottom: 10px;
        text-align: center;
      }

      .metric-name {
        font-weight: 500;
        margin-bottom: 10px;
      }

      .metric-row {
        padding: 5px 0;
        display: flex;
        align-items: center;
        min-height: 30px;

        .positive-change {
          color: green;
        }

        .negative-change {
          color: red;
        }
      }
    }
  }
}
</style>
