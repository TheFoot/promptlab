<template>
  <div
    v-if="!disabled"
    class="chat-sidebar"
    :class="{ 
      'chat-sidebar-expanded': isExpanded,
      'embedded-mode': embedded
    }"
  >
    <div
      v-if="isExpanded && !embedded"
      class="resize-handle"
      @mousedown="startResize"
    />

    <div
      v-if="isExpanded || embedded"
      class="chat-content"
    >
      <div
        v-if="!hideToolbar"
        class="chat-toolbar"
      >
        <div class="toolbar-left">
          <!-- Future toolbar items can go here -->
        </div>
        <div class="toolbar-right">
          <button
            class="reset-btn"
            title="Reset conversation"
            @click="() => resetChat('manual_reset')"
          >
            🔄 Reset
          </button>
          <button
            v-if="agentMode === 'design'"
            class="analyze-btn"
            title="Analyze current prompt"
            @click="analyzeCurrentPrompt"
          >
            🔍 Analyze
          </button>
        </div>
      </div>

      <div class="chat-controls">
        <div
          class="settings-header"
          @click="toggleSettings"
        >
          <span class="settings-title">Agent Settings</span>
          <span
            class="settings-toggle"
            :class="{ expanded: settingsExpanded[agentMode] }"
          >▼</span>
        </div>
        <div 
          v-show="settingsExpanded[agentMode]" 
          class="chat-settings"
        >
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
            <label for="temp-slider">
              Temperature: {{ effectiveTemperature.toFixed(1) }}
              <span
                v-if="!canAdjustTemperature"
                class="fixed-value-note"
              >(Fixed for reasoning models)</span>
            </label>
            <input
              id="temp-slider"
              v-model.number="modelConfig.temperature"
              type="range"
              min="0"
              max="1"
              step="0.1"
              :disabled="!canAdjustTemperature"
              :class="{ 'disabled-control': !canAdjustTemperature }"
            >
          </div>

          <!-- Conversation-level system message attachment for chat mode -->
          <div 
            v-if="agentMode === 'chat' && getPromptContent()"
            class="conversation-attachment"
          >
            <div class="attachment-header">
              <div class="attachment-icon">
                📎
              </div>
              <div class="attachment-label">
                System Instructions
              </div>
            </div>
            <div class="prompt-attachment">
              <div class="attachment-icon">
                ⚙️
              </div>
              <div class="attachment-content">
                <div class="attachment-title">
                  {{ currentPrompt?.title || 'System Prompt' }}
                </div>
                <div class="attachment-preview">
                  {{ getPromptContent().substring(0, 100) }}{{ getPromptContent().length > 100 ? '...' : '' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Conversation-level prompt attachment for design mode -->
          <div 
            v-if="agentMode === 'design' && currentPrompt?.content"
            class="conversation-attachment"
          >
            <div class="attachment-header">
              <div class="attachment-icon">
                📎
              </div>
              <div class="attachment-label">
                Attached to conversation
              </div>
            </div>
            <div class="prompt-attachment">
              <div class="attachment-icon">
                📄
              </div>
              <div class="attachment-content">
                <div class="attachment-title">
                  {{ currentPrompt.title || 'Untitled Prompt' }}
                </div>
                <div class="attachment-preview">
                  {{ currentPrompt.content.substring(0, 100) }}{{ currentPrompt.content.length > 100 ? '...' : '' }}
                </div>
              </div>
            </div>
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
          <div
            class="message-role"
            :class="{ 'error-message': message.isError }"
          >
            {{ message.role === "user" ? "You" : (agentMode === 'design' ? "Design Agent" : "Chat Agent") }}
            <span
              v-if="message.isError"
              class="error-indicator"
            >⚠️</span>
          </div>
          
          <!-- Thinking panel for assistant messages -->
          <ThinkingStatusPanel
            v-if="message.role === 'assistant' && (message.hasThinking || message.isThinking)"
            :thinking-content="message.thinkingContent || ''"
            :is-thinking="message.isThinking || false"
            :thinking-start-time="message.thinkingStartTime"
            :thinking-end-time="message.thinkingEndTime"
            :default-expanded="false"
            :auto-scroll="true"
          />
          
          <div
            class="message-content"
            @dblclick="copyMessageToClipboard(message.content)"
            v-html="formatMessageWithPlaceholders(message)"
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
import ThinkingStatusPanel from "./ThinkingStatusPanel.vue";
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
  // For embedded mode in DynamicContextPanel
  embedded: {
    type: Boolean,
    default: false,
  },
  // Override system prompt instead of using current prompt
  systemPrompt: {
    type: String,
    default: null,
  },
  // Agent mode: 'chat' (test prompts) or 'design' (design assistant)
  agentMode: {
    type: String,
    default: 'chat',
    validator: (value) => ['chat', 'design'].includes(value),
  },
  // Hide the internal toolbar when embedded in context panels
  hideToolbar: {
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

// Initialize expanded state from props - always expanded in embedded mode
const isExpanded = ref(props.expanded || props.embedded);
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

// Settings visibility state - track per agent mode
const settingsExpanded = ref({
  chat: false,
  design: false
});

// Check if this is a new browser session
const isNewSession = ref(false);

// Get current prompt from store or props
const currentPrompt = computed(() => {
  // Always use the store prompt for full data (title, content, etc.)
  // The systemPrompt prop is just for overriding the content for the AI
  return promptStore.currentPrompt;
});

// Track if current model supports temperature adjustment
const supportsTemperatureControl = ref(true);

// Check if current model allows temperature changes (non-reasoning models)
const canAdjustTemperature = computed(() => {
  return supportsTemperatureControl.value;
});

// Get the effective temperature display value
const effectiveTemperature = computed(() => {
  if (!supportsTemperatureControl.value) {
    return 1.0; // Fixed temperature for reasoning models
  }
  return modelConfig.temperature;
});

// Get the content to use for AI system message
const getPromptContent = () => {
  if (props.systemPrompt) {
    return props.systemPrompt;
  }
  return currentPrompt.value?.content;
};

// System messages are now handled server-side via agents
// The agent system on the server will build appropriate system prompts

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
    
    // Update temperature control capability for new model
    await updateTemperatureControl();
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

// Toggle settings visibility
const toggleSettings = () => {
  settingsExpanded.value[props.agentMode] = !settingsExpanded.value[props.agentMode];
  // Save state to localStorage
  localStorage.setItem(`chat-settings-expanded-${props.agentMode}`, settingsExpanded.value[props.agentMode].toString());
};

// Close settings when user starts interacting
const closeSettingsOnInteraction = () => {
  if (settingsExpanded.value[props.agentMode]) {
    settingsExpanded.value[props.agentMode] = false;
    localStorage.setItem(`chat-settings-expanded-${props.agentMode}`, 'false');
  }
};

// Reset chat conversation
const resetChat = (reason = "manual_reset") => {
  messages.value = [];

  // Add appropriate system message based on reset reason and agent mode
  let resetMessage = "";

  if (props.agentMode === 'design') {
    // Design agent reset messages
    switch (reason) {
      case "model_change":
        resetMessage = `Model changed to ${providerDisplayNames.value[modelConfig.provider] || modelConfig.provider} / ${modelDisplayNames.value[modelConfig.model] || modelConfig.model}. Ready to analyze prompts with the new model.`;
        break;
      case "prompt_change":
        resetMessage = currentPrompt.value?.title 
          ? `Now working with **${currentPrompt.value.title}**. I'm here to help analyze and improve it.`
          : "Now working with your prompt. I'm here to help analyze and improve it.";
        break;
      case "manual_reset":
        resetMessage = currentPrompt.value?.title 
          ? `Hi! I'm here to help you analyze and improve your prompt **${currentPrompt.value.title}**. Click the Analyze button to get started, or feel free to ask me anything about prompt design.`
          : "Hi! I'm here to help you analyze and improve your prompt. Click the Analyze button to get started, or feel free to ask me anything about prompt design.";
        break;
      case "init":
        resetMessage = currentPrompt.value?.title 
          ? `Hi! I'm here to help you analyze and improve your prompt **${currentPrompt.value.title}**. Click the Analyze button to get started, or feel free to ask me anything about prompt design.`
          : "Hi! I'm here to help you analyze and improve your prompt. Click the Analyze button to get started, or feel free to ask me anything about prompt design.";
        break;
      default:
        resetMessage = "I'm ready to help you with prompt analysis and design.";
    }
  } else {
    // Chat agent reset messages  
    switch (reason) {
      case "model_change":
        resetMessage = `Model changed to ${providerDisplayNames.value[modelConfig.provider] || modelConfig.provider} / ${modelDisplayNames.value[modelConfig.model] || modelConfig.model}. Let's continue testing your prompt.`;
        break;
      case "prompt_change":
        resetMessage = currentPrompt.value?.title 
          ? `Now testing **${currentPrompt.value.title}**. I'm ready to respond using this prompt as my system instructions.`
          : "Now testing your prompt. I'm ready to respond using this prompt as my system instructions.";
        break;
      case "manual_reset":
        resetMessage = currentPrompt.value?.title 
          ? `Hello! I'm ready to help you test your prompt **${currentPrompt.value.title}**. Go ahead and ask me anything to see how I respond with your prompt instructions.`
          : "Hello! I'm ready to help you test your prompt. Go ahead and ask me anything to see how I respond with your prompt instructions.";
        break;
      case "init":
        resetMessage = currentPrompt.value?.title 
          ? `Hello! I'm ready to help you test your prompt **${currentPrompt.value.title}**. Go ahead and ask me anything to see how I respond with your prompt instructions.`
          : "Hello! I'm ready to help you test your prompt. Go ahead and ask me anything to see how I respond with your prompt instructions.";
        break;
      default:
        resetMessage = "Ready to test your prompt.";
    }
  }

  // Add prompt information only if no prompt is available
  if (!currentPrompt.value || reason === "prompt_cleared") {
    resetMessage += " No prompt selected.";
  }

  // Add the assistant message (so it displays with markdown rendering)
  messages.value.push({
    role: "assistant",
    content: resetMessage,
  });
};

// Analyze current prompt (for design agent mode)
const analyzeCurrentPrompt = () => {
  if (!currentPrompt.value?.content) {
    alertService.showAlert("No prompt available to analyze", "warning", 3000);
    return;
  }

  // Close settings on interaction
  closeSettingsOnInteraction();

  // Create clean analysis message (no attachment - server handles prompt automatically)
  const analysisMessage = "Please analyze this prompt.";
  
  // Add user message to chat without attachment (server-side will handle prompt)
  messages.value.push({
    role: "user", 
    content: analysisMessage
  });

  // Auto-send the analysis request
  sendAnalysisMessage();
};

// Send analysis message (modified version of sendMessage for auto-analysis)
const sendAnalysisMessage = async () => {
  if (isLoading.value) return;

  // Scroll to bottom after new message
  await nextTick();
  scrollToBottom();

  // Set loading state
  isLoading.value = true;

  try {
    // Create message object for API
    const messageObj = {
      messages: [
        // Add all user and assistant messages (server will handle system message via agent)
        ...messages.value
          .filter((m) => m.role !== "system")
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })),
      ],
      provider: modelConfig.provider,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      stream: true,
      agentType: props.agentMode,
      promptContent: getPromptContent(),
      promptTitle: currentPrompt.value?.title,
    };

    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      socket.value.send(JSON.stringify(messageObj));
    } else {
      console.log("WebSocket not connected, using REST API fallback");
      const apiUrl = "/api/chat";
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messageObj),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(JSON.stringify(errorData));
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
    messages.value.push({
      role: "assistant",
      content: parseErrorMessage(error.message || error),
      isError: true,
    });
  } finally {
    isLoading.value = false;
    scrollToBottom();
  }
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

// Format message with prompt placeholders as badges
const formatMessageWithPlaceholders = (message) => {
  
  if (!message.hasPromptPlaceholder) {
    return formatMessage(message.content);
  }

  // Replace prompt placeholders with discrete badges
  const contentWithBadges = message.content.replace(
    /<current-prompt>(.*?)<\/current-prompt>/g,
    '<span class="prompt-placeholder-badge" title="Current prompt will be inserted here">📄 $1</span>'
  );

  return formatMessage(contentWithBadges);
};

// Parse error into human-readable message
const parseErrorMessage = (error) => {
  // Log full error to console
  console.error("Full error details:", error);

  // Try to extract meaningful error message
  if (typeof error === 'string') {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(error);
      // Look for common error message properties
      return parsed.message || parsed.error || parsed.details || parsed.msg || "An unexpected error occurred.";
    } catch {
      // If not JSON, check if it looks like a JSON string that failed to parse
      if (error.includes('"message"') || error.includes('"error"')) {
        // Try to extract message property using regex as fallback
        const messageMatch = error.match(/"message"\s*:\s*"([^"]+)"/);
        if (messageMatch) {
          return messageMatch[1];
        }
        const errorMatch = error.match(/"error"\s*:\s*"([^"]+)"/);
        if (errorMatch) {
          return errorMatch[1];
        }
      }
      // If not JSON-like, return the string directly (but clean it up)
      return error.replace(/^Error:\s*/, '');
    }
  }
  
  if (error && typeof error === 'object') {
    // Extract message from error object
    return error.message || error.error || error.details || error.msg || "An unexpected error occurred.";
  }
  
  return "An unexpected error occurred.";
};

// Send message function
const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return;

  // Close settings on first interaction
  closeSettingsOnInteraction();

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
        // Add all user and assistant messages (server will handle system message via agent)
        ...messages.value
          .filter((m) => m.role !== "system")
          .map(msg => ({
            role: msg.role,
            content: msg.content
          })),
      ],
      provider: modelConfig.provider,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      stream: true,
      agentType: props.agentMode,
      promptContent: getPromptContent(),
      promptTitle: currentPrompt.value?.title,
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
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(JSON.stringify(errorData));
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
    messages.value.push({
      role: "assistant",
      content: parseErrorMessage(error.message || error),
      isError: true,
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
        currentAssistantMessage = { 
          role: "assistant", 
          content: "",
          thinkingContent: "",
          isThinking: false,
          hasThinking: false,
          thinkingStartTime: null,
          thinkingEndTime: null
        };
        // Add message to the messages array - create a new object rather than pushing the reference
        messages.value.push({ 
          role: "assistant", 
          content: "",
          thinkingContent: "",
          isThinking: false,
          hasThinking: false,
          thinkingStartTime: null,
          thinkingEndTime: null
        });
      } else if (data.type === "thinking_start" && currentAssistantMessage) {
        // Start of thinking phase
        console.log("Starting thinking phase");
        currentAssistantMessage.isThinking = true;
        currentAssistantMessage.hasThinking = true;
        currentAssistantMessage.thinkingStartTime = new Date();
        
        // Update the message in the array
        const lastIndex = messages.value.length - 1;
        if (lastIndex >= 0) {
          messages.value[lastIndex] = {
            ...messages.value[lastIndex],
            isThinking: true,
            hasThinking: true,
            thinkingStartTime: new Date()
          };
        }
      } else if (data.type === "thinking_stream" && currentAssistantMessage) {
        // Thinking content chunk
        console.log("Received thinking chunk:", data.content);
        
        const contentChunk = data.content;
        currentAssistantMessage.thinkingContent =
          typeof currentAssistantMessage.thinkingContent === "string"
            ? currentAssistantMessage.thinkingContent + contentChunk
            : contentChunk;
        
        // Update the message in the array
        const lastIndex = messages.value.length - 1;
        if (lastIndex >= 0) {
          messages.value[lastIndex] = {
            ...messages.value[lastIndex],
            thinkingContent: currentAssistantMessage.thinkingContent
          };
        }
      } else if (data.type === "thinking_end" && currentAssistantMessage) {
        // End of thinking phase
        console.log("Thinking phase completed");
        currentAssistantMessage.isThinking = false;
        currentAssistantMessage.thinkingEndTime = new Date();
        
        // Update the message in the array
        const lastIndex = messages.value.length - 1;
        if (lastIndex >= 0) {
          messages.value[lastIndex] = {
            ...messages.value[lastIndex],
            isThinking: false,
            thinkingEndTime: new Date()
          };
        }
      } else if (data.type === "response_start" && currentAssistantMessage) {
        // Start of response phase
        console.log("Starting response phase");
        // No special handling needed, just logging
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
          // Create a completely new object reference while preserving thinking data
          messages.value[lastIndex] = {
            ...messages.value[lastIndex],
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
        isLoading.value = false;
        
        // Remove any empty message that might have been created on "start"
        if (messages.value.length > 0 && messages.value[messages.value.length - 1].content === "") {
          messages.value.pop();
        }
        
        messages.value.push({
          role: "assistant",
          content: parseErrorMessage(data.error),
          isError: true,
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

  // Initialize settings visibility state
  const sessionKey = 'chat-session-initialized';
  const isNewSessionValue = !localStorage.getItem(sessionKey);
  isNewSession.value = isNewSessionValue;
  
  // For new sessions, show settings expanded
  if (isNewSessionValue) {
    settingsExpanded.value[props.agentMode] = true;
    localStorage.setItem(sessionKey, 'true');
  } else {
    // Load saved state for this agent mode
    const savedState = localStorage.getItem(`chat-settings-expanded-${props.agentMode}`);
    settingsExpanded.value[props.agentMode] = savedState === 'true';
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

// Expose methods for parent components
defineExpose({
  resetChat,
  analyzeCurrentPrompt
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

// Update temperature control capability when model changes
const updateTemperatureControl = async () => {
  try {
    const capabilities = await modelConfigService.getModelCapabilities(modelConfig.provider, modelConfig.model);
    supportsTemperatureControl.value = !capabilities.thinking;
    
    // If model doesn't support temperature control, set it to 1
    if (!supportsTemperatureControl.value) {
      modelConfig.temperature = 1.0;
    }
  } catch {
    supportsTemperatureControl.value = true; // Default to allowing temperature control
  }
};

// Watch for changes in the model selection
watch(
  () => modelConfig.model,
  (newModel, oldModel) => {
    if (oldModel && newModel !== oldModel) {
      // Reset chat history when model changes
      resetChat("model_change");
    }
    // Update temperature control capability
    updateTemperatureControl();
  },
);

// Watch for changes in provider selection
watch(
  () => modelConfig.provider,
  () => {
    // Update temperature control capability when provider changes
    updateTemperatureControl();
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

  &.embedded-mode {
    position: static;
    width: 100% !important;
    height: 100%;
    border-left: none;
    box-shadow: none;
    border-radius: 0;
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

  .chat-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: var(--surface-color, #f8f9fa);
    border-bottom: 1px solid var(--border-color);
    min-height: 40px;
    
    /* Make toolbar stand out with subtle different background */
    @media (prefers-color-scheme: dark) {
      background-color: #2d2d2d;
    }
    
    .toolbar-left {
      flex: 1;
    }
    
    .toolbar-right {
      display: flex;
      gap: 0.5rem;
    }
    
    .reset-btn {
      padding: 0.25rem 0.75rem;
      background-color: transparent;
      color: var(--secondary-color, #6c757d);
      border: 1px solid var(--secondary-color, #6c757d);
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &:hover:not(:disabled) {
        background-color: var(--secondary-color, #6c757d);
        color: white;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .analyze-btn {
      padding: 0.25rem 0.75rem;
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      
      &:hover:not(:disabled) {
        background-color: var(--primary-color-dark, #3a5ce7);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .chat-controls {
    border-bottom: 1px solid var(--border-color);
    background-color: rgba(74, 108, 247, 0.05);

    .settings-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      cursor: pointer;
      user-select: none;
      transition: background-color 0.2s ease;

      &:hover {
        background-color: rgba(74, 108, 247, 0.08);
      }

      .settings-title {
        font-weight: 500;
        font-size: 0.9rem;
        color: var(--text-color);
      }

      .settings-toggle {
        font-size: 0.8rem;
        color: var(--text-secondary);
        transition: transform 0.2s ease;

        &.expanded {
          transform: rotate(180deg);
        }
      }
    }

    .chat-settings {
      padding: 10px 15px 10px 15px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background-color: rgba(74, 108, 247, 0.02);
      
      @media (prefers-color-scheme: dark) {
        background-color: rgba(0, 0, 0, 0.1);
      }
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
      
      .fixed-value-note {
        font-size: 0.75rem;
        color: var(--text-muted);
        font-style: italic;
        font-weight: normal;
      }
    }
    
    .disabled-control {
      opacity: 0.5;
      cursor: not-allowed;
      
      &:disabled {
        background-color: var(--disabled-bg, #f5f5f5);
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
    
    /* Subtle inset shadow to create depth - same as editor */
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05), 
                inset 0 1px 2px rgba(0, 0, 0, 0.1);

    /* Better contrast in dark mode */
    @media (prefers-color-scheme: dark) {
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3), 
                  inset 0 1px 2px rgba(0, 0, 0, 0.4);
    }
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
      display: flex;
      align-items: center;
      gap: 0.5rem;

      &.error-message {
        color: #dc3545; /* Red color for errors */
        
        @media (prefers-color-scheme: dark) {
          color: #ff6b6b; /* Lighter red for dark mode */
        }
      }
    }

    .error-indicator {
      font-size: 0.7rem;
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

      // Prompt placeholder badge styling
      :deep(.prompt-placeholder-badge) {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        background-color: rgba(74, 108, 247, 0.1);
        color: var(--primary-color);
        padding: 0.15rem 0.4rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 500;
        border: 1px solid rgba(74, 108, 247, 0.2);
        cursor: help;
        
        @media (prefers-color-scheme: dark) {
          background-color: rgba(74, 108, 247, 0.2);
          border-color: rgba(74, 108, 247, 0.3);
        }
      }
    }
  }

  .conversation-attachment {
    padding: 0.75rem;
    background-color: rgba(34, 197, 94, 0.05);
    border-bottom: 1px solid rgba(34, 197, 94, 0.15);
    
    @media (prefers-color-scheme: dark) {
      background-color: rgba(34, 197, 94, 0.1);
      border-bottom-color: rgba(34, 197, 94, 0.25);
    }

    .attachment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
      
      .attachment-icon {
        font-size: 0.9rem;
      }
      
      .attachment-label {
        font-weight: 500;
      }
    }

    .prompt-attachment {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background-color: rgba(74, 108, 247, 0.05);
      border: 1px solid rgba(74, 108, 247, 0.15);
      border-radius: 6px;
      padding: 0.75rem;
      font-size: 0.85rem;

      @media (prefers-color-scheme: dark) {
        background-color: rgba(74, 108, 247, 0.1);
        border-color: rgba(74, 108, 247, 0.25);
      }

      .attachment-icon {
        font-size: 1.1rem;
        flex-shrink: 0;
      }

      .attachment-content {
        flex: 1;
        min-width: 0;
      }

      .attachment-title {
        font-weight: 600;
        color: var(--primary-color);
        margin-bottom: 0.25rem;
      }

      .attachment-preview {
        color: var(--text-secondary);
        line-height: 1.4;
        word-break: break-word;
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
