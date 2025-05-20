// chatService.js - Handles chat functionality and integrations

/**
 * Chat Service 
 * Manages chat communication with AI models, handles WebSocket connections and state
 */

// Import necessary services
import alertService from "./alertService";
import modelConfigService from "./modelConfigService";
import { renderMarkdown, downloadCodeBlock } from "./markdownService";

// Module state - using symbols for private fields
const _state = {
  messages: [],
  isLoading: false,
  socket: null,
  currentAssistantMessage: null,
  modelConfig: {
    provider: "", // Will be set from config
    model: "", // Will be set from config
    temperature: 0.7,
  },
  availableProviders: [],
  availableModels: [],
  providerDisplayNames: {},
  modelDisplayNames: {}
};

/**
 * Initialize chat service and configuration
 */
async function initialize() {
  await loadModelConfiguration();
  setupWebSocket();
  resetChat("init");
  return _state;
}

/**
 * Load provider/model configuration
 */
async function loadModelConfiguration() {
  try {
    // Get configuration from service
    const config = await modelConfigService.getConfig();

    // Update state
    _state.availableProviders = config.providers.available;
    _state.providerDisplayNames = config.providers.displayNames;

    // Always set the provider from config default or first available
    _state.modelConfig.provider = config.providers.default || _state.availableProviders[0] || "";
    console.log("Setting default provider to:", _state.modelConfig.provider);

    // Update available models for selected provider
    await updateAvailableModels();
  } catch (error) {
    console.error("Failed to load model configuration:", error);
    alertService.showAlert("Failed to load model configuration", "error", 5000);
  }
}

/**
 * Update available models based on selected provider
 */
async function updateAvailableModels() {
  try {
    const config = await modelConfigService.getConfig();
    const provider = _state.modelConfig.provider;

    if (!provider) {
      console.warn("Provider is empty, cannot update models");
      return;
    }

    // Update model options
    _state.availableModels = config.models[provider]?.available || [];
    _state.modelDisplayNames = config.models[provider]?.displayNames || {};

    // Always use the default model from config
    _state.modelConfig.model = config.models[provider]?.default || _state.availableModels[0] || "";
    console.log("Setting default model to:", _state.modelConfig.model);
  } catch (error) {
    console.error("Failed to update model list:", error);
    _state.availableModels = [];
    _state.modelDisplayNames = {};
  }
}

/**
 * Handle provider change
 */
async function handleProviderChange() {
  // Update available models for selected provider
  await updateAvailableModels();

  // Reset chat history when provider changes
  resetChat("model_change");
}

/**
 * Reset chat conversation
 * @param {string} reason - Reason for reset: 'manual_reset', 'model_change', 'prompt_change', 'init'
 * @param {Object} currentPrompt - Current prompt object if available
 */
function resetChat(reason = "manual_reset", currentPrompt = null) {
  _state.messages = [];

  // Add appropriate system message based on reset reason
  let resetMessage = "";

  switch (reason) {
    case "model_change":
      // Model or provider change message
      resetMessage = `Chat reset due to model change. Now using: ${
        _state.providerDisplayNames[_state.modelConfig.provider] || _state.modelConfig.provider
      } / ${
        _state.modelDisplayNames[_state.modelConfig.model] || _state.modelConfig.model
      }`;
      break;
    case "prompt_change":
      // Prompt change message
      resetMessage = `Chat reset due to prompt change. Now testing: ${currentPrompt?.title || "Unknown prompt"}`;
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
  if (currentPrompt && reason !== "prompt_change") {
    resetMessage += ` Testing system prompt: ${currentPrompt.title}`;
  }

  // Add the system message
  _state.messages.push({
    role: "system",
    content: resetMessage,
  });

  return _state.messages;
}

/**
 * Send message via chat
 * @param {string} messageText - The message text to send
 * @param {Object} currentPrompt - The current prompt being used (optional)
 * @param {Function} onChunkReceived - Callback to handle streaming chunks (optional)
 * @returns {Promise<Array>} - Updated messages array
 */
async function sendMessage(messageText, currentPrompt = null, onChunkReceived = null) {
  if (!messageText.trim() || _state.isLoading) return _state.messages;

  // Add user message to chat
  _state.messages.push({
    role: "user",
    content: messageText.trim(),
  });

  // Set loading state
  _state.isLoading = true;

  try {
    // Create message object for API
    const messageObj = {
      messages: [
        // Add system message with the current prompt content
        ...(currentPrompt?.content ? [{ role: "system", content: currentPrompt.content }] : []),
        // Add all user and assistant messages
        ..._state.messages.filter((m) => m.role !== "system"),
      ],
      provider: _state.modelConfig.provider,
      model: _state.modelConfig.model,
      temperature: _state.modelConfig.temperature,
      stream: true,
    };

    if (_state.socket && _state.socket.readyState === WebSocket.OPEN) {
      // Use WebSocket if connected
      _state.socket.send(JSON.stringify(messageObj));
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
      const messageContent = typeof data.message === "string" ? data.message : String(data.message || "");

      _state.messages.push({
        role: "assistant",
        content: messageContent,
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    _state.messages.push({
      role: "assistant",
      content: "Sorry, there was an error processing your request.",
    });
  } finally {
    _state.isLoading = false;
  }

  return _state.messages;
}

/**
 * Copy message to clipboard
 * @param {string} message - The message to copy
 */
async function copyMessageToClipboard(message) {
  try {
    await navigator.clipboard.writeText(message);
    alertService.showAlert("Message copied to clipboard!", "success", 3000);
    return true;
  } catch (err) {
    console.error("Failed to copy message:", err);
    alertService.showAlert("Failed to copy to clipboard", "error", 3000);
    return false;
  }
}

/**
 * Set up WebSocket connection
 * @param {Function} onMessageUpdate - Callback function when messages are updated (optional)
 */
function setupWebSocket(onMessageUpdate = null) {
  // Create WebSocket connection using the browser's current protocol and host
  // This leverages Vite's WebSocket proxy configuration
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/ws`;

  console.log("Setting up WebSocket connection to:", wsUrl);

  const ws = new WebSocket(wsUrl);
  _state.socket = ws;

  _state.currentAssistantMessage = null;

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
        _state.currentAssistantMessage = { role: "assistant", content: "" };
        // Add message to the messages array - create a new object rather than pushing the reference
        _state.messages.push({ role: "assistant", content: "" });
      } else if (data.type === "stream" && _state.currentAssistantMessage) {
        // Continuation of a message
        console.log("Received content chunk:", data.content);

        // Get the content chunk from the data
        const contentChunk = data.content;

        // Update the reference message content
        _state.currentAssistantMessage.content =
          typeof _state.currentAssistantMessage.content === "string"
            ? _state.currentAssistantMessage.content + contentChunk
            : contentChunk;

        // Update the last message in the array with current content
        const lastIndex = _state.messages.length - 1;
        if (lastIndex >= 0) {
          // Create a completely new object reference
          _state.messages[lastIndex] = {
            role: "assistant",
            content:
              typeof _state.currentAssistantMessage.content === "string"
                ? _state.currentAssistantMessage.content
                : String(_state.currentAssistantMessage.content),
          };
        }

        // Notify any listeners of the update
        if (onMessageUpdate) {
          onMessageUpdate([..._state.messages]);
        }
      } else if (data.type === "end") {
        // End of a message
        console.log("Message completed");
        _state.isLoading = false;

        // Notify any listeners of the final update
        if (onMessageUpdate) {
          onMessageUpdate([..._state.messages]);
        }
      } else if (data.type === "error") {
        console.error("WebSocket error from server:", data.error);
        _state.isLoading = false;
        _state.messages.push({
          role: "assistant",
          content: `Error: ${data.error}`,
        });

        // Notify any listeners of the error
        if (onMessageUpdate) {
          onMessageUpdate([..._state.messages]);
        }
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
    _state.isLoading = false;
  };

  ws.onclose = (event) => {
    console.log(
      "WebSocket connection closed with code:",
      event.code,
      "reason:",
      event.reason,
    );
    _state.isLoading = false;

    // Attempt to reconnect after delay if not closed cleanly
    if (!event.wasClean) {
      console.log("Attempting to reconnect in 3 seconds...");
      setTimeout(() => {
        if (_state.socket === ws) {
          // Only reconnect if this is still the current socket
          setupWebSocket(onMessageUpdate);
        }
      }, 3000);
    }
  };

  return ws;
}

/**
 * Format message with markdown and syntax highlighting
 * @param {string} content - The message content to format
 * @returns {string} - Formatted HTML
 */
function formatMessage(content) {
  return renderMarkdown(content);
}

/**
 * Get current state (for reactive components)
 * @returns {Object} - A copy of the current state
 */
function getState() {
  return {
    messages: [..._state.messages],
    isLoading: _state.isLoading,
    modelConfig: { ..._state.modelConfig },
    availableProviders: [..._state.availableProviders],
    availableModels: [..._state.availableModels],
    providerDisplayNames: { ..._state.providerDisplayNames },
    modelDisplayNames: { ..._state.modelDisplayNames },
  };
}

/**
 * Update model configuration
 * @param {Object} config - New configuration object
 */
function updateModelConfig(config) {
  const previousProvider = _state.modelConfig.provider;
  const previousModel = _state.modelConfig.model;
  
  // Update config with provided values
  Object.assign(_state.modelConfig, config);
  
  // If provider changed, update available models
  if (config.provider && config.provider !== previousProvider) {
    handleProviderChange();
  }
  // If only model changed (not triggered by provider change)
  else if (config.model && config.model !== previousModel) {
    resetChat("model_change");
  }
  
  return { ..._state.modelConfig };
}

/**
 * Cleanup resources (e.g., close WebSocket)
 */
function cleanup() {
  if (_state.socket) {
    _state.socket.close();
    _state.socket = null;
  }
}

// Export service methods
export default {
  initialize,
  sendMessage,
  resetChat,
  copyMessageToClipboard,
  formatMessage,
  getState,
  updateModelConfig,
  handleProviderChange,
  cleanup,
};
