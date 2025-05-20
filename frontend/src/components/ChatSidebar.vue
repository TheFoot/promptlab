<template>
  <div
    v-if="!disabled"
    class="chat-sidebar"
    :class="{ 'chat-sidebar-expanded': isExpanded }"
  >
    <div
      v-if="isExpanded"
      class="resize-handle"
      @mousedown="startResize"
    />

    <div
      v-if="isExpanded"
      class="chat-content"
    >
      <div class="chat-header">
        <div class="header-content">
          <h3>{{ currentPrompt ? 'Test Prompt' : 'Chat Assistant' }}</h3>
          <button
            class="reset-button"
            title="Reset conversation"
            @click="() => resetChat('manual_reset')"
          >
            Reset
          </button>
        </div>
      </div>

      <div class="chat-controls">
        <div class="chat-settings">
          <div class="settings-row">
            <label for="provider-select">Provider:</label>
            <select
              id="provider-select"
              v-model="modelConfig.provider"
              class="chat-select"
              @change="handleProviderChange"
            >
              <option
                v-for="provider in availableProviders"
                :key="provider"
                :value="provider"
              >
                {{ providerDisplayNames[provider] || provider }}
              </option>
            </select>

            <label for="model-select">Model:</label>
            <select
              id="model-select"
              v-model="modelConfig.model"
              class="chat-select"
            >
              <option
                v-for="model in availableModels"
                :key="model"
                :value="model"
              >
                {{ modelDisplayNames[model] || model }}
              </option>
            </select>
          </div>

          <div class="settings-row">
            <label for="temp-slider">Temperature: {{ modelConfig.temperature.toFixed(1) }}</label>
            <input
              id="temp-slider"
              v-model.number="modelConfig.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
            >
          </div>
        </div>
      </div>

      <div
        ref="messagesContainer"
        class="chat-messages"
      >
        <div
          v-for="(message, index) in messages"
          :key="index"
          class="chat-message"
          :class="{
            'user-message': message.role === 'user',
            'assistant-message': message.role === 'assistant',
          }"
        >
          <div class="message-role">
            {{ message.role === "user" ? "You" : "Assistant" }}
          </div>
          <div
            class="message-content"
            @dblclick="copyMessageToClipboard(message.content)"
            v-html="formatMessage(message.content)"
          />
        </div>
        <div
          v-if="isLoading"
          class="chat-message assistant-message"
        >
          <div class="message-role">
            Assistant
          </div>
          <div class="message-content">
            <div class="loading-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <textarea
          ref="messageInput"
          v-model="newMessage"
          placeholder="Type your message here..."
          :disabled="isLoading"
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.shift.enter="handleShiftEnter"
          @input="adjustTextareaHeight"
        />
        <button
          class="btn btn-primary"
          :disabled="isLoading || !newMessage.trim()"
          @click="sendMessage"
        >
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onMounted,
  onUnmounted,
} from "vue";
import { usePromptStore } from "../stores/promptStore";
import "highlight.js/styles/github.css";
import alertService from "../services/alertService";
import modelConfigService from "../services/modelConfigService";
import { renderMarkdown, downloadCodeBlock } from "../services/markdownService";
import "../styles/code-blocks.scss";

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  // Allow parent component to control expanded state
  expanded: {
    type: Boolean,
    default: false,
  },
});

// Watch for parent-controlled expanded state
watch(
  () => props.expanded,
  (newValue) => {
    if (newValue !== isExpanded.value) {
      isExpanded.value = newValue;

      // When expanded
      if (isExpanded.value) {
        nextTick(() => {
          // Apply stored width from state
          if (document.querySelector(".chat-sidebar")) {
            document.querySelector(".chat-sidebar").style.width =
              `${sidebarWidth.value}px`;
          }
          scrollToBottom();

          // Notify parent about the width for content adjustment
          emit("resize", sidebarWidth.value);
        });
      }
      // When collapsed
      else {
        // Reset inline style to let CSS handle width
        if (document.querySelector(".chat-sidebar")) {
          document.querySelector(".chat-sidebar").style.width = "";
        }
      }
    }
  },
);

// We use the markdownService for rendering markdown content

// Initialize expanded state from props
const isExpanded = ref(props.expanded);
const messages = ref([]);
const newMessage = ref("");
const isLoading = ref(false);
const messagesContainer = ref(null);
const messageInput = ref(null); // Reference to the textarea
const socket = ref(null);
const promptStore = usePromptStore();
const modelConfig = reactive({
  provider: "", // Will be set from config
  model: "", // Will be set from config
  temperature: 0.7,
});
const sidebarWidth = ref(400); // Default width

// Model config state
const availableProviders = ref([]);
const availableModels = ref([]);
const providerDisplayNames = ref({});
const modelDisplayNames = ref({});

// Get current prompt from store
const currentPrompt = computed(() => promptStore.currentPrompt);

// Define emits
const emit = defineEmits(["toggle", "resize"]);

// Load provider/model configuration
const loadModelConfiguration = async () => {
  try {
    // Get configuration from service
    const config = await modelConfigService.getConfig();

    // Update reactive UI state
    availableProviders.value = config.providers.available;
    providerDisplayNames.value = config.providers.displayNames;

    // Always set the provider from config default or first available
    modelConfig.provider =
      config.providers.default || availableProviders.value[0] || "";
    console.log("Setting default provider to:", modelConfig.provider);

    // Update available models for selected provider
    await updateAvailableModels();
  } catch (error) {
    console.error("Failed to load model configuration:", error);
    alertService.showAlert("Failed to load model configuration", "error", 5000);
  }
};

// Update available models based on selected provider
const updateAvailableModels = async () => {
  try {
    const config = await modelConfigService.getConfig();
    const provider = modelConfig.provider;

    if (!provider) {
      console.warn("Provider is empty, cannot update models");
      return;
    }

    // Update model options
    availableModels.value = config.models[provider]?.available || [];
    modelDisplayNames.value = config.models[provider]?.displayNames || {};

    // Always use the default model from config
    modelConfig.model =
      config.models[provider]?.default || availableModels.value[0] || "";
    console.log("Setting default model to:", modelConfig.model);
  } catch (error) {
    console.error("Failed to update model list:", error);
    availableModels.value = [];
    modelDisplayNames.value = {};
  }
};

// Note: Toggle function is now handled by parent component via the expanded prop

// Resize sidebar
const startResize = (e) => {
  e.preventDefault();
  document.body.style.cursor = "ew-resize";

  const initialX = e.clientX;
  const initialWidth = parseInt(
    getComputedStyle(document.querySelector(".chat-sidebar")).width,
  );

  // Send initial resize event to indicate resize started
  emit("resize", initialWidth);

  const handleMouseMove = (e) => {
    const newWidth = initialWidth - (e.clientX - initialX);
    if (newWidth > 250 && newWidth < 600) {
      sidebarWidth.value = newWidth;
      document.querySelector(".chat-sidebar").style.width = `${newWidth}px`;

      // Emit resize event with new width to parent component
      emit("resize", newWidth);
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";

    // Send one final resize event after mouse up
    emit("resize", sidebarWidth.value);

    // Save the width to localStorage
    saveSidebarWidth(sidebarWidth.value);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
};

// Handle Shift+Enter key press to insert a newline
const handleShiftEnter = () => {
  // No need to prevent default - let the browser insert the newline
  // Adjust height after inserting newline
  nextTick(() => {
    adjustTextareaHeight();
  });
};

// Auto-adjust textarea height
const adjustTextareaHeight = () => {
  if (!messageInput.value) return;

  // Reset height to calculate scroll height
  messageInput.value.style.height = "auto";

  // Set new height based on content - min 40px, max 120px
  const newHeight = Math.min(
    Math.max(messageInput.value.scrollHeight, 40),
    120,
  );
  messageInput.value.style.height = `${newHeight}px`;
};

// Handle provider change
const handleProviderChange = async () => {
  // Update available models for selected provider
  await updateAvailableModels();

  // Reset chat history when provider changes
  resetChat("model_change");
};

// Reset chat conversation
const resetChat = (reason = "manual_reset") => {
  messages.value = [];

  // Add appropriate system message based on reset reason
  let resetMessage = "";

  switch (reason) {
    case "model_change":
      // Model or provider change message
      resetMessage = `Chat reset due to model change. Now using: ${providerDisplayNames.value[modelConfig.provider] || modelConfig.provider} / ${modelDisplayNames.value[modelConfig.model] || modelConfig.model}`;
      break;
    case "prompt_change":
      // Prompt change message
      resetMessage = `Chat reset due to prompt change. Now testing: ${currentPrompt.value?.title || "Unknown prompt"}`;
      break;
    case "manual_reset":
      // Manual reset by user
      resetMessage = "Chat manually reset.";
      break;
    case "init":
      // Initial setup
      resetMessage = "Chat initialized.";
      break;
    default:
      // Default message
      resetMessage = "Chat reset.";
  }

  // Add the prompt information if available
  if (currentPrompt.value && reason !== "prompt_change" && reason !== "prompt_cleared") {
    resetMessage += ` Testing system prompt: ${currentPrompt.value.title}`;
  } else if (!currentPrompt.value || reason === "prompt_cleared") {
    resetMessage += " No prompt selected.";
  }

  // Add the system message
  messages.value.push({
    role: "system",
    content: resetMessage,
  });
};

// Copy message to clipboard
const copyMessageToClipboard = async (message) => {
  try {
    await navigator.clipboard.writeText(message);
    alertService.showAlert("Message copied to clipboard!", "success", 3000);
  } catch (err) {
    console.error("Failed to copy message:", err);
    alertService.showAlert("Failed to copy to clipboard", "error", 3000);
  }
};

// Format message with markdown and syntax highlighting using the shared service
const formatMessage = (content) => {
  return renderMarkdown(content);
};

// Send message function
const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return;

  // Add user message to chat
  messages.value.push({
    role: "user",
    content: newMessage.value.trim(),
  });

  // Clear input after storing message
  newMessage.value = ""; // Clear input

  // Reset textarea height
  if (messageInput.value) {
    messageInput.value.style.height = "auto";
  }

  // Scroll to bottom after new message
  await nextTick();
  scrollToBottom();

  // Set loading state
  isLoading.value = true;

  try {
    // Create message object for API
    const messageObj = {
      messages: [
        // Add system message with the current prompt content only if there is a prompt
        ...(currentPrompt.value?.content
          ? [{ role: "system", content: currentPrompt.value.content }]
          : [{ role: "system", content: "You are a helpful assistant." }]), // Default system message when no prompt is selected
        // Add all user and assistant messages
        ...messages.value.filter((m) => m.role !== "system"),
      ],
      provider: modelConfig.provider,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      stream: true,
    };

    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      // Use WebSocket if connected
      socket.value.send(JSON.stringify(messageObj));
      // The response will be handled by the websocket message handlers
      console.log("Message sent via WebSocket");
    } else {
      console.log("WebSocket not connected, using REST API fallback");
      // Fallback to REST API if WebSocket not connected

      // Use the API endpoint through Vite's proxy
      const apiUrl = "/api/chat";

      console.log("Using API endpoint:", apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageObj),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      const messageContent =
        typeof data.message === "string"
          ? data.message
          : String(data.message || "");

      messages.value.push({
        role: "assistant",
        content: messageContent,
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    messages.value.push({
      role: "assistant",
      content: "Sorry, there was an error processing your request.",
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
};

// Scroll messages container to bottom
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// WebSocket setup
const setupWebSocket = () => {
  // Create WebSocket connection using the browser's current protocol and host
  // This leverages Vite's WebSocket proxy configuration
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/ws`;

  console.log("Setting up WebSocket connection to:", wsUrl);

  const ws = new WebSocket(wsUrl);
  socket.value = ws;

  let currentAssistantMessage = null;

  ws.onopen = () => {
    console.log("WebSocket connection established successfully");
  };

  ws.onmessage = (event) => {
    console.log("WebSocket message received:", event.data);

    try {
      const data = JSON.parse(event.data);

      if (data.type === "start") {
        // Start of a new message
        console.log("Starting new assistant message");
        // Make sure the message content starts as an empty string
        currentAssistantMessage = { role: "assistant", content: "" };
        // Add message to the messages array - create a new object rather than pushing the reference
        messages.value.push({ role: "assistant", content: "" });
      } else if (data.type === "stream" && currentAssistantMessage) {
        // Continuation of a message
        console.log("Received content chunk:", data.content);

        // Get the content chunk from the data
        const contentChunk = data.content;

        // Update the reference message content
        currentAssistantMessage.content =
          typeof currentAssistantMessage.content === "string"
            ? currentAssistantMessage.content + contentChunk
            : contentChunk;

        // Update the last message in the array with current content
        const lastIndex = messages.value.length - 1;
        if (lastIndex >= 0) {
          // Create a completely new object reference
          messages.value[lastIndex] = {
            role: "assistant",
            content:
              typeof currentAssistantMessage.content === "string"
                ? currentAssistantMessage.content
                : String(currentAssistantMessage.content),
          };

          // Debug log the updated message
          console.log(
            "Updated message structure:",
            typeof messages.value[lastIndex].content,
            messages.value[lastIndex].content.substring(0, 20) + "...",
          );
        }

        // Force reactive update by creating a new array reference
        messages.value = [...messages.value];
        scrollToBottom();
      } else if (data.type === "end") {
        // End of a message
        console.log("Message completed");
        isLoading.value = false;
        scrollToBottom();
      } else if (data.type === "error") {
        console.error("WebSocket error from server:", data.error);
        isLoading.value = false;
        messages.value.push({
          role: "assistant",
          content: `Error: ${data.error}`,
        });
        scrollToBottom();
      } else if (data.type === "info") {
        console.log("WebSocket info:", data.message);
      } else {
        console.warn("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("WebSocket connection error:", error);
    isLoading.value = false;
  };

  ws.onclose = (event) => {
    console.log(
      "WebSocket connection closed with code:",
      event.code,
      "reason:",
      event.reason,
    );
    isLoading.value = false;

    // Attempt to reconnect after delay if not closed cleanly
    if (!event.wasClean) {
      console.log("Attempting to reconnect in 3 seconds...");
      setTimeout(() => {
        if (socket.value === ws) {
          // Only reconnect if this is still the current socket
          setupWebSocket();
        }
      }, 3000);
    }
  };
};

// Store sidebar width in localStorage
const saveSidebarWidth = (width) => {
  localStorage.setItem("chat-sidebar-width", width.toString());
};

// Function to handle downloading code blocks using the shared service
const handleDownloadCodeBlock = (button) => {
  const result = downloadCodeBlock(button);
  if (result.success) {
    alertService.showAlert(`Downloading ${result.filename}`, "success", 3000);
  } else {
    alertService.showAlert("Failed to download code", "error", 3000);
  }
};

onMounted(async () => {
  // Load model configuration first
  await loadModelConfiguration();

  setupWebSocket();

  // Load saved sidebar width from localStorage or use default
  const savedWidth = localStorage.getItem("chat-sidebar-width");
  if (savedWidth) {
    const width = parseInt(savedWidth, 10);
    // Ensure width is within reasonable bounds (250-600px)
    if (width >= 250 && width <= 600) {
      sidebarWidth.value = width;
    }
  }

  // Initialize with a clean slate
  resetChat("init");

  // Apply initial width from state
  if (isExpanded.value && document.querySelector(".chat-sidebar")) {
    document.querySelector(".chat-sidebar").style.width =
      `${sidebarWidth.value}px`;
  }

  // Initialize textarea height
  nextTick(() => {
    if (messageInput.value) {
      adjustTextareaHeight();
    }
  });

  // Add download function to window object for code download buttons
  window.downloadCodeBlock = handleDownloadCodeBlock;
});

onUnmounted(() => {
  // Clean up WebSocket on component unmount
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }

  // Remove downloadCodeBlock function from window object
  if (window.downloadCodeBlock === handleDownloadCodeBlock) {
    window.downloadCodeBlock = undefined;
  }
});

// Watch for changes in the current prompt
watch(
  () => currentPrompt.value,
  (newPrompt) => {
    if (newPrompt) {
      // Reset the chat history when the prompt changes
      resetChat("prompt_change");
    } else {
      // Clear chat when prompt is cleared
      resetChat("prompt_cleared");
    }
  },
);

// Watch for changes in the model selection
watch(
  () => modelConfig.model,
  (newModel, oldModel) => {
    if (oldModel && newModel !== oldModel) {
      // Reset chat history when model changes
      resetChat("model_change");
    }
  },
);
</script>

<style lang="scss" scoped>
@use "../styles/variables" as *;

.chat-sidebar {
  position: absolute;
  right: 0;
  top: 0; /* Align with content-wrapper */
  bottom: 0;
  width: 0; /* Invisible when collapsed */
  background-color: var(--card-bg-color);
  border-left: 1px solid var(--border-color);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  height: 100%; /* Take full height of parent */

  &.chat-sidebar-expanded {
    width: 400px;
    transition: none; /* Disable transition when resizing */
  }
  /* Toggle button removed - now in the main app header */

  .resize-handle {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
    background: transparent;

    &:hover {
      background-color: rgba(74, 108, 247, 0.1);
    }

    &:active {
      background-color: rgba(74, 108, 247, 0.2);
    }
  }

  .chat-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }

  .chat-header {
    padding: 0 15px;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--primary-color);
    color: white;
    height: 50px; /* Slightly smaller than app header */
    box-sizing: border-box;
    display: flex;
    align-items: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .header-content {
      display: flex;
      width: 100%;
      justify-content: space-between;
      align-items: center;
    }

    h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .reset-button {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 10px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background-color 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      &:active {
        background: rgba(255, 255, 255, 0.4);
      }
    }
  }

  .chat-controls {
    padding: 10px 15px;
    border-bottom: 1px solid var(--border-color);
    background-color: rgba(74, 108, 247, 0.05);

    .chat-settings {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .settings-row {
      display: flex;
      flex-direction: column;
      gap: 5px;

      label {
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    .chat-select {
      width: 100%;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid var(--border-color);
      background-color: var(--card-bg-color);
      color: var(--text-color);
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.2);
      }
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--primary-color);
    }
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .chat-message {
    border-radius: 8px;
    padding: 10px;
    max-width: 90%;

    &.user-message {
      background-color: rgba(74, 108, 247, 0.1);
      align-self: flex-end;

      .message-role {
        color: var(--primary-color);
      }
    }

    &.assistant-message {
      background-color: var(--card-bg-color);
      border: 1px solid var(--border-color);
      align-self: flex-start;

      .message-role {
        color: var(--secondary-color);
      }
    }

    .message-role {
      font-weight: bold;
      font-size: 0.8rem;
      margin-bottom: 5px;
    }

    .message-content {
      font-size: 0.9rem;
      line-height: 1.5;
      word-break: break-word;
      cursor: text;
      position: relative;

      &:hover {
        &::after {
          content: "Double-click to copy";
          position: absolute;
          top: -20px;
          right: 5px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          opacity: 0.8;
          pointer-events: none;
          z-index: 10;
        }
      }

      // Code block styling is imported from the centralized style file
      // We import it in script section: '../styles/code-blocks.scss'

      /* Margin between elements */
      :deep(p) {
        margin-bottom: 10px;
      }

      /* First code block shouldn't have top margin */
      :deep(.message-content > .code-block-wrapper:first-child) {
        margin-top: 0;
      }

      :deep(ul),
      :deep(ol) {
        padding-left: 20px;
        margin-bottom: 10px;
      }
    }
  }

  .loading-indicator {
    display: flex;
    gap: 5px;

    span {
      width: 8px;
      height: 8px;
      background-color: var(--text-secondary);
      border-radius: 50%;
      display: inline-block;
      animation: bounce 1.4s infinite ease-in-out both;

      &:nth-child(1) {
        animation-delay: -0.32s;
      }

      &:nth-child(2) {
        animation-delay: -0.16s;
      }
    }
  }

  .chat-input {
    padding: 15px;
    border-top: 1px solid var(--border-color);
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;

    textarea {
      resize: none;
      min-height: 40px;
      max-height: 120px;
      border-radius: 4px;
      padding: 10px;
      overflow-y: auto;
      flex-grow: 1;
      line-height: 1.2;
    }

    button {
      align-self: flex-end;
    }
  }
}

@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

// Media queries for responsiveness
@media (max-width: 768px) {
  .chat-sidebar {
    &.chat-sidebar-expanded {
      width: 300px;
    }
  }
}
</style>
