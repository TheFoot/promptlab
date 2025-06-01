<template>
  <div class="test-history-browser">
    <div class="browser-header">
      <h3>Test History</h3>
      <div class="filter-controls">
        <div class="date-range">
          <label for="start-date">From:</label>
          <input
            id="start-date"
            v-model="filters.startDate"
            type="date"
            @change="loadHistory"
          >

          <label for="end-date">To:</label>
          <input
            id="end-date"
            v-model="filters.endDate"
            type="date"
            @change="loadHistory"
          >
        </div>

        <div class="model-filter">
          <label for="model-filter">Model:</label>
          <select
            id="model-filter"
            v-model="filters.modelId"
            @change="loadHistory"
          >
            <option value="">
              All Models
            </option>
            <option
              v-for="model in availableModels"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name }}
            </option>
          </select>
        </div>

        <button
          class="btn-clear-filters"
          @click="clearFilters"
        >
          <i class="fas fa-times" />
          Clear Filters
        </button>
      </div>
    </div>

    <div
      v-if="!loading"
      class="history-container"
    >
      <div
        v-if="testSessions.length === 0"
        class="no-history"
      >
        No test history found. Run some tests to see results here.
      </div>

      <div
        v-else
        class="sessions-list"
      >
        <div
          v-for="session in testSessions"
          :key="session.id"
          class="session-item"
          :class="{ 'is-selected': selectedSessionId === session.id }"
          @click="selectSession(session.id)"
        >
          <div class="session-header">
            <div class="session-timestamp">
              {{ formatDate(session.timestamp) }}
            </div>
            <div class="session-model">
              {{ getModelName(session.modelId) }}
            </div>
          </div>

          <div class="session-preview">
            <div class="message-count">
              <i class="fas fa-comment" />
              {{ getMessageCount(session) }} messages
            </div>
            <div class="message-preview">
              {{ getSessionPreview(session) }}
            </div>
          </div>

          <div class="session-metrics">
            <div class="metric">
              <span class="metric-label">Response Time:</span>
              <span class="metric-value">{{
                formatMetric(session.metrics?.responseTime, "ms")
              }}</span>
            </div>
            <div class="metric">
              <span class="metric-label">Tokens:</span>
              <span class="metric-value">{{
                formatMetric(session.metrics?.tokenCount)
              }}</span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="totalSessions > pageSize"
        class="pagination-controls"
      >
        <button
          class="btn-prev"
          :disabled="currentPage === 0"
          @click="prevPage"
        >
          <i class="fas fa-chevron-left" />
          Previous
        </button>

        <span class="page-info">
          Page {{ currentPage + 1 }} of {{ totalPages }}
        </span>

        <button
          class="btn-next"
          :disabled="currentPage >= totalPages - 1"
          @click="nextPage"
        >
          Next
          <i class="fas fa-chevron-right" />
        </button>
      </div>
    </div>

    <div
      v-if="loading"
      class="loading-indicator"
    >
      <i class="fas fa-spinner fa-spin" />
      Loading test history...
    </div>

    <!-- Session Detail View -->
    <div
      v-if="selectedSession"
      class="session-detail"
    >
      <div class="detail-header">
        <h4>Test Session Detail</h4>
        <div class="detail-actions">
          <button
            class="btn-continue"
            title="Continue this conversation"
            @click="continueConversation"
          >
            <i class="fas fa-play" />
            Continue
          </button>
          <button
            class="btn-close"
            title="Close detail view"
            @click="closeDetail"
          >
            <i class="fas fa-times" />
          </button>
        </div>
      </div>

      <div class="session-info">
        <div class="info-item">
          <span class="info-label">Date:</span>
          <span class="info-value">{{
            formatDateLong(selectedSession.timestamp)
          }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Model:</span>
          <span class="info-value">{{
            getModelName(selectedSession.modelId)
          }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Temperature:</span>
          <span class="info-value">{{
            selectedSession.parameters?.temperature || "N/A"
          }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Top P:</span>
          <span class="info-value">{{
            selectedSession.parameters?.top_p || "N/A"
          }}</span>
        </div>
      </div>

      <div class="conversation-replay">
        <div class="conversation-header">
          Conversation
        </div>

        <div class="message-list">
          <div
            v-for="(message, index) in selectedSession.conversation"
            :key="index"
            class="message"
            :class="message.role"
          >
            <div class="message-header">
              <span class="role-badge">{{ message.role }}</span>
              <span class="timestamp">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div class="message-content">
              <MarkdownPreview
                v-if="message.role === 'assistant'"
                :markdown="message.content"
              />
              <div
                v-else
                class="content-text"
              >
                {{ message.content }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="selectedSession.metrics"
        class="metrics-detail"
      >
        <div class="metrics-header">
          Metrics
        </div>

        <div class="metrics-grid">
          <div
            v-for="(value, key) in selectedSession.metrics"
            :key="key"
            class="metric-item"
          >
            <div class="metric-name">
              {{ formatMetricName(key) }}
            </div>
            <div class="metric-value">
              {{ formatMetricValue(key, value) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useModelConfigService } from "../services/modelConfigService";
import { testHistoryService } from "../services/testHistoryService";
import MarkdownPreview from "./MarkdownPreview.vue";

// Define props
const props = defineProps({
  promptId: {
    type: String,
    required: true,
  },
});

// Define emits
const emit = defineEmits(["continue-session"]);

// Services
const modelConfigService = useModelConfigService();

// Reactive state
const testSessions = ref([]);
const selectedSessionId = ref(null);
const selectedSession = ref(null);
const loading = ref(false);
const currentPage = ref(0);
const pageSize = ref(10);
const totalSessions = ref(0);
const filters = ref({
  startDate: "",
  endDate: "",
  modelId: "",
});

// Computed properties
const availableModels = computed(() => modelConfigService.getAvailableModels());
const totalPages = computed(() =>
  Math.ceil(totalSessions.value / pageSize.value),
);

// Watchers
watch(selectedSessionId, async (newId) => {
  if (newId) {
    await loadSessionDetail(newId);
  } else {
    selectedSession.value = null;
  }
});

// Lifecycle hooks
onMounted(async () => {
  await loadHistory();
});

// Methods
async function loadHistory() {
  loading.value = true;

  try {
    const options = {
      limit: pageSize.value,
      offset: currentPage.value * pageSize.value,
      ...filters.value,
    };

    // Convert date objects to ISO strings
    if (options.startDate) {
      options.startDate = new Date(options.startDate).toISOString();
    }

    if (options.endDate) {
      // Set to end of day
      const endDate = new Date(options.endDate);
      endDate.setHours(23, 59, 59, 999);
      options.endDate = endDate.toISOString();
    }

    // Use local storage fallback for development
    const result = await testHistoryService.getTestHistoryWithFallback(
      props.promptId,
      options,
    );

    if (Array.isArray(result)) {
      // Simple API response
      testSessions.value = result;
      totalSessions.value = result.length + currentPage.value * pageSize.value;
    } else if (result && typeof result === "object") {
      // Paginated API response
      testSessions.value = result.sessions || [];
      totalSessions.value = result.total || 0;
    } else {
      testSessions.value = [];
      totalSessions.value = 0;
    }
  } catch (error) {
    console.error("Error loading test history:", error);
    testSessions.value = [];
  } finally {
    loading.value = false;
  }
}

async function loadSessionDetail(sessionId) {
  try {
    // First check if the session is already in our list
    const sessionFromList = testSessions.value.find((s) => s.id === sessionId);

    if (sessionFromList && sessionFromList.conversation) {
      // We already have the full conversation
      selectedSession.value = sessionFromList;
      return;
    }

    // Otherwise, load the session from the API
    const session = await testHistoryService.getTestSession(
      props.promptId,
      sessionId,
    );
    selectedSession.value = session;
  } catch (error) {
    console.error("Error loading session detail:", error);
    // Try to use the session from the list as a fallback
    selectedSession.value =
      testSessions.value.find((s) => s.id === sessionId) || null;
  }
}

function selectSession(sessionId) {
  selectedSessionId.value =
    sessionId === selectedSessionId.value ? null : sessionId;
}

function closeDetail() {
  selectedSessionId.value = null;
}

function prevPage() {
  if (currentPage.value > 0) {
    currentPage.value--;
    loadHistory();
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value - 1) {
    currentPage.value++;
    loadHistory();
  }
}

function clearFilters() {
  filters.value = {
    startDate: "",
    endDate: "",
    modelId: "",
  };

  loadHistory();
}

function continueConversation() {
  if (!selectedSession.value) return;

  emit("continue-session", {
    sessionId: selectedSession.value.id,
    conversation: selectedSession.value.conversation,
    parameters: selectedSession.value.parameters,
  });
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

function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function getModelName(modelId) {
  if (!modelId) return "Unknown";

  const model = availableModels.value.find((m) => m.id === modelId);
  return model ? model.name : modelId;
}

function getMessageCount(session) {
  return session.conversation?.length || 0;
}

function getSessionPreview(session) {
  if (!session.conversation || session.conversation.length === 0) {
    return "No messages";
  }

  // Get the first non-system message
  const userMessage = session.conversation.find((msg) => msg.role === "user");
  if (userMessage) {
    const preview = userMessage.content.substring(0, 60);
    return preview.length < userMessage.content.length
      ? preview + "..."
      : preview;
  }

  return "No user messages";
}

function formatMetric(value, unit = "", decimals = 0) {
  if (value === undefined || value === null) {
    return "--";
  }

  const formatted =
    decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();

  return `${formatted}${unit ? " " + unit : ""}`;
}

function formatMetricName(key) {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}

function formatMetricValue(key, value) {
  // Format different metric types appropriately
  if (typeof value === "number") {
    if (key.includes("time") || key.includes("duration")) {
      return formatMetric(value, "ms");
    } else if (key.includes("count") || key.includes("total")) {
      return formatMetric(value);
    } else if (key.includes("cost")) {
      return "$" + formatMetric(value, "", 4);
    } else if (key.includes("rate") || key.includes("percentage")) {
      return formatMetric(value, "%", 1);
    }
  }

  return value;
}
</script>

<style scoped lang="scss">
.test-history-browser {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.browser-header {
  padding: 15px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);

  h3 {
    margin: 0 0 10px 0;
  }

  .filter-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;

    .date-range,
    .model-filter {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    input,
    select {
      padding: 5px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }

    .btn-clear-filters {
      padding: 5px 10px;
      background: none;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
      cursor: pointer;

      &:hover {
        background-color: var(--color-background-mute);
      }
    }
  }
}

.history-container {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .no-history {
    padding: 30px;
    text-align: center;
    color: var(--color-text-light);
    font-style: italic;
  }
}

.sessions-list {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .session-item {
    background-color: var(--color-background-mute);
    border-radius: 4px;
    padding: 12px;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      border-color: var(--color-border);
      background-color: var(--color-background-soft);
    }

    &.is-selected {
      border-color: var(--color-primary);
      background-color: var(--color-primary-soft);
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;

      .session-timestamp {
        font-weight: 500;
      }

      .session-model {
        color: var(--color-text-light);
        font-size: 0.9em;
      }
    }

    .session-preview {
      margin-bottom: 8px;

      .message-count {
        font-size: 0.85em;
        color: var(--color-text-light);
        margin-bottom: 3px;

        i {
          margin-right: 5px;
        }
      }

      .message-preview {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 0.95em;
      }
    }

    .session-metrics {
      display: flex;
      gap: 15px;
      font-size: 0.85em;

      .metric {
        display: flex;
        gap: 5px;

        .metric-label {
          color: var(--color-text-light);
        }

        .metric-value {
          font-weight: 500;
        }
      }
    }
  }
}

.pagination-controls {
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--color-background-soft);
  border-top: 1px solid var(--color-border);

  button {
    padding: 5px 10px;
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;

    &:hover:not(:disabled) {
      background-color: var(--color-background-mute);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-size: 0.9em;
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

.session-detail {
  border-top: 1px solid var(--color-border);
  background-color: var(--color-background-soft);
  overflow-y: auto;
  max-height: 60%;

  .detail-header {
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--color-background-mute);
    border-bottom: 1px solid var(--color-border);

    h4 {
      margin: 0;
    }

    .detail-actions {
      display: flex;
      gap: 8px;

      button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 5px 8px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 5px;

        &:hover {
          background-color: var(--color-background);
        }

        &.btn-continue {
          color: var(--color-primary);
        }
      }
    }
  }

  .session-info {
    padding: 10px 15px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    border-bottom: 1px solid var(--color-border);

    .info-item {
      display: flex;
      gap: 5px;

      .info-label {
        color: var(--color-text-light);
      }

      .info-value {
        font-weight: 500;
      }
    }
  }

  .conversation-replay {
    padding: 0 15px 15px;

    .conversation-header {
      padding: 10px 0;
      font-weight: 500;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 10px;
    }

    .message-list {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .message {
        padding: 10px;
        border-radius: 8px;

        &.user {
          background-color: var(--color-primary-soft);
          align-self: flex-end;
          max-width: 80%;
        }

        &.assistant {
          background-color: var(--color-background-mute);
          align-self: flex-start;
          max-width: 80%;
        }

        &.system {
          background-color: var(--color-background);
          align-self: center;
          font-style: italic;
          max-width: 90%;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 0.8em;

          .role-badge {
            font-weight: bold;
            text-transform: capitalize;
          }
        }

        .message-content {
          word-break: break-word;

          .content-text {
            white-space: pre-wrap;
          }
        }
      }
    }
  }

  .metrics-detail {
    padding: 0 15px 15px;

    .metrics-header {
      padding: 10px 0;
      font-weight: 500;
      border-bottom: 1px solid var(--color-border);
      margin-bottom: 10px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;

      .metric-item {
        .metric-name {
          font-size: 0.9em;
          color: var(--color-text-light);
          margin-bottom: 3px;
        }

        .metric-value {
          font-weight: 500;
        }
      }
    }
  }
}
</style>
