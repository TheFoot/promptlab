<template>
  <div class="test-mode-panel">
    <!-- Model selection and parameter controls -->
    <div class="test-controls">
      <div class="model-selector">
        <label for="model-select">Model:</label>
        <select
          id="model-select"
          v-model="selectedModel"
        >
          <option
            v-for="model in availableModels"
            :key="model.id"
            :value="model.id"
          >
            {{ model.name }}
          </option>
        </select>
      </div>

      <div class="parameter-controls">
        <div class="parameter">
          <label for="temperature">Temperature:</label>
          <input
            id="temperature"
            v-model.number="params.temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
          >
          <span class="value">{{ params.temperature.toFixed(1) }}</span>
        </div>

        <div class="parameter">
          <label for="top-p">Top P:</label>
          <input
            id="top-p"
            v-model.number="params.top_p"
            type="range"
            min="0"
            max="1"
            step="0.1"
          >
          <span class="value">{{ params.top_p.toFixed(1) }}</span>
        </div>
      </div>

      <button
        class="test-button"
        :disabled="!canTestPrompt"
        @click="testCurrentPrompt"
      >
        <i class="fas fa-play" />
        Test Prompt
      </button>
    </div>

    <!-- Chat history -->
    <div
      ref="chatHistoryContainer"
      class="test-history"
    >
      <div
        v-for="(message, index) in currentTestHistory"
        :key="index"
        class="message"
        :class="message.role"
      >
        <div class="message-header">
          <span class="role-badge">{{ message.role }}</span>
          <span class="timestamp">{{
            formatTimestamp(message.timestamp)
          }}</span>
        </div>
        <div class="message-content">
          <MarkdownPreview
            v-if="message.role === 'assistant'"
            :markdown="message.content"
          />
          <div
            v-else
            class="user-message"
          >
            {{ message.content }}
          </div>
        </div>
      </div>
    </div>

    <!-- Message input -->
    <div class="message-input-container">
      <textarea
        v-model="userMessage"
        placeholder="Enter a user message to test contextual response..."
        @keydown.enter.prevent="sendMessage"
      />
      <button
        :disabled="!userMessage.trim()"
        @click="sendMessage"
      >
        Send
      </button>
    </div>

    <!-- Test variation panel -->
    <div
      v-if="showVariations"
      class="variations-toggle"
    >
      <button @click="toggleVariations">
        {{ showVariations ? "Hide Variations" : "Show Variations" }}
      </button>
    </div>
    <TestVariationPanel
      v-if="showVariations"
      :prompt="currentPrompt"
      @select-variation="applyVariation"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { usePromptStore } from "../stores/promptStore";
import MarkdownPreview from "./MarkdownPreview.vue";
import { useModelConfigService } from "../services/modelConfigService";
import { chatService } from "../services/chatService";

// Define props
const props = defineProps({
  promptId: {
    type: String,
    required: true,
  },
});

// Emits
const emit = defineEmits(["save-test", "update-prompt"]);

// Setup store and services
const promptStore = usePromptStore();
const modelConfigService = useModelConfigService();

// Reactive state
const selectedModel = ref("");
const params = ref({
  temperature: 0.7,
  top_p: 0.9,
});
const currentTestHistory = ref([]);
const userMessage = ref("");
const showVariations = ref(false);
const chatHistoryContainer = ref(null);
const isLoading = ref(false);

// Computed properties
const availableModels = computed(() => modelConfigService.getAvailableModels());
const currentPrompt = computed(() => promptStore.getCurrentPrompt);
const canTestPrompt = computed(
  () =>
    currentPrompt.value?.content?.trim() &&
    selectedModel.value &&
    !isLoading.value,
);

// Initialize component
onMounted(async () => {
  // Set default model if available
  if (availableModels.value.length > 0) {
    selectedModel.value = availableModels.value[0].id;
  }

  // Load any existing test history
  await loadTestHistory();
});

// Watch for chat history changes to scroll to bottom
watch(
  currentTestHistory,
  async () => {
    await nextTick();
    if (chatHistoryContainer.value) {
      chatHistoryContainer.value.scrollTop =
        chatHistoryContainer.value.scrollHeight;
    }
  },
  { deep: true },
);

// Format timestamp for display
function formatTimestamp(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Load test history for the current prompt
async function loadTestHistory() {
  try {
    // This will be implemented when we create the testHistoryService
    // const history = await testHistoryService.getTestHistory(promptId);
    // if (history?.length) {
    //   currentTestHistory.value = history;
    // }

    // For now, initialize with empty array
    currentTestHistory.value = [];
  } catch (error) {
    console.error("Error loading test history:", error);
  }
}

// Test the current prompt
async function testCurrentPrompt() {
  if (!canTestPrompt.value) return;

  isLoading.value = true;

  try {
    // Add system prompt to history
    currentTestHistory.value.push({
      role: "system",
      content: currentPrompt.value.content,
      timestamp: new Date().toISOString(),
    });

    // Add initial user message if available
    if (userMessage.value.trim()) {
      await sendMessage();
    }
  } catch (error) {
    console.error("Error testing prompt:", error);
  } finally {
    isLoading.value = false;
  }
}

// Send a message in the test conversation
async function sendMessage() {
  if (!userMessage.value.trim() || isLoading.value) return;

  isLoading.value = true;

  try {
    // Add user message to history
    const userMsg = {
      role: "user",
      content: userMessage.value.trim(),
      timestamp: new Date().toISOString(),
    };
    currentTestHistory.value.push(userMsg);

    // Clear input
    userMessage.value = "";

    // Prepare messages for API
    const messages = currentTestHistory.value.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Get response from AI
    const response = await chatService.sendMessage({
      messages,
      model: selectedModel.value,
      parameters: params.value,
    });

    // Add assistant response to history
    if (response?.content) {
      currentTestHistory.value.push({
        role: "assistant",
        content: response.content,
        timestamp: new Date().toISOString(),
        metrics: response.metrics || {},
      });

      // Save test session
      await saveTestSession();
    }
  } catch (error) {
    console.error("Error sending message:", error);
    // Add error message to history
    currentTestHistory.value.push({
      role: "system",
      content: `Error: ${error.message || "Failed to get response"}`,
      timestamp: new Date().toISOString(),
    });
  } finally {
    isLoading.value = false;
  }
}

// Save the current test session
async function saveTestSession() {
  try {
    // This will be implemented when we create the testHistoryService
    // await testHistoryService.saveTestSession(
    //   props.promptId,
    //   currentTestHistory.value,
    //   calculateMetrics()
    // );

    // Emit event for parent components
    emit("save-test", {
      promptId: props.promptId,
      conversation: currentTestHistory.value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error saving test session:", error);
  }
}

// Calculate metrics for current session - Will be used when testHistoryService is implemented
// function calculateMetrics() {
//   // Implement basic metrics calculation
//   const assistantMessages = currentTestHistory.value.filter(
//     (msg) => msg.role === "assistant",
//   );

//   if (!assistantMessages.length) return {};

//   // Example metrics
//   return {
//     responseCount: assistantMessages.length,
//     averageResponseTime:
//       assistantMessages.reduce(
//         (sum, msg) => sum + (msg.metrics?.responseTime || 0),
//         0,
//       ) / assistantMessages.length,
//     totalTokens: assistantMessages.reduce(
//       (sum, msg) => sum + (msg.metrics?.tokenCount || 0),
//       0,
//     ),
//   };
// }

// Toggle variations panel
function toggleVariations() {
  showVariations.value = !showVariations.value;
}

// Apply a variation to the current prompt
function applyVariation(variation) {
  if (!variation) return;

  // Update the current prompt with the variation
  emit("update-prompt", variation);
}
</script>

<style scoped lang="scss">
.test-mode-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
  border-radius: 4px;
  overflow: hidden;
}

.test-controls {
  display: flex;
  align-items: center;
  padding: 10px;
  background-color: var(--color-background-soft);
  border-bottom: 1px solid var(--color-border);

  .model-selector {
    margin-right: 10px;

    select {
      padding: 5px;
      border-radius: 4px;
      border: 1px solid var(--color-border);
    }
  }

  .parameter-controls {
    display: flex;
    flex: 1;

    .parameter {
      display: flex;
      align-items: center;
      margin-right: 15px;

      label {
        margin-right: 5px;
      }

      .value {
        min-width: 2rem;
        text-align: right;
      }
    }
  }

  .test-button {
    padding: 6px 12px;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;

    i {
      margin-right: 5px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.test-history {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .message {
    padding: 10px;
    border-radius: 8px;
    max-width: 80%;

    &.user {
      align-self: flex-end;
      background-color: var(--color-primary-soft);
    }

    &.assistant {
      align-self: flex-start;
      background-color: var(--color-background-mute);
    }

    &.system {
      align-self: center;
      background-color: var(--color-background-soft);
      font-style: italic;
      opacity: 0.8;
      font-size: 0.9em;
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

      .timestamp {
        opacity: 0.7;
      }
    }

    .message-content {
      word-break: break-word;
    }
  }
}

.message-input-container {
  padding: 10px;
  display: flex;
  border-top: 1px solid var(--color-border);

  textarea {
    flex: 1;
    min-height: 60px;
    padding: 8px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    resize: vertical;
    margin-right: 8px;
  }

  button {
    align-self: flex-end;
    padding: 8px 15px;
    background-color: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.variations-toggle {
  display: flex;
  justify-content: center;
  padding: 5px;
  background-color: var(--color-background-soft);

  button {
    background: none;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    font-size: 0.9em;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
