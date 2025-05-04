<template>
  <div
    v-if="!disabled"
    class="chat-sidebar"
    :class="{ 'chat-sidebar-expanded': isExpanded }"
  >
    
    <div
      v-if="isExpanded"
      class="chat-content"
    >
      <div class="chat-header">
        <div class="header-content">
          <h3>Test Prompt</h3>
          <button 
            @click="resetChat" 
            class="reset-button" 
            title="Reset conversation"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div class="chat-controls">
        <div class="chat-settings">
          <div class="settings-row">
            <label for="model-select">Model:</label>
            <select
              id="model-select"
              v-model="modelConfig.model"
              class="chat-select"
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-4o">GPT-4o</option>
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
          :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }"
        >
          <div class="message-role">
            {{ message.role === 'user' ? 'You' : 'Assistant' }}
          </div>
          <div
            class="message-content"
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
          v-model="newMessage" 
          placeholder="Type your message here..." 
          :disabled="isLoading"
          @keydown.enter.prevent="sendMessage"
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { usePromptStore } from '../stores/promptStore';
import { marked } from 'marked';
import highlightjs from 'highlight.js';
import 'highlight.js/styles/github.css';

// Props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false
  },
  // Allow parent component to control expanded state
  expanded: {
    type: Boolean,
    default: false
  }
});

// Watch for parent-controlled expanded state
watch(() => props.expanded, (newValue) => {
  if (newValue !== isExpanded.value) {
    isExpanded.value = newValue;
    if (isExpanded.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
});

// Configure marked with code highlighting
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && highlightjs.getLanguage(lang)) {
      return highlightjs.highlight(code, { language: lang }).value;
    }
    return highlightjs.highlightAuto(code).value;
  },
  breaks: true,
  gfm: true,
});

// Initialize expanded state from props
const isExpanded = ref(props.expanded);
const messages = ref([]);
const newMessage = ref('');
const isLoading = ref(false);
const messagesContainer = ref(null);
const socket = ref(null);
const promptStore = usePromptStore();
const modelConfig = ref({
  model: 'gpt-3.5-turbo',
  temperature: 0.7
});

// Get current prompt from store
const currentPrompt = computed(() => promptStore.currentPrompt);

// Define emits
const emit = defineEmits(['toggle']);

// Toggle sidebar expansion
const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  // Emit the toggle event so parent components can react
  emit('toggle', isExpanded.value);
  
  if (isExpanded.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
};

// Reset chat conversation
const resetChat = () => {
  messages.value = [];
  if (currentPrompt.value) {
    messages.value.push({
      role: 'system',
      content: 'Chat reset. Ready to test system prompt: ' + currentPrompt.value.title
    });
  }
};

// Format message with markdown and syntax highlighting
const formatMessage = (content) => {
  if (!content) return '';
  return marked(content);
};

// Send message function
const sendMessage = async () => {
  if (!newMessage.value.trim() || isLoading.value) return;
  
  // Add user message to chat
  messages.value.push({
    role: 'user',
    content: newMessage.value.trim()
  });
  
  // Store message for potential future use
  const messageText = newMessage.value.trim();
  newMessage.value = ''; // Clear input
  
  // Scroll to bottom after new message
  await nextTick();
  scrollToBottom();
  
  // Set loading state
  isLoading.value = true;
  
  try {
    // Create message object for API
    const messageObj = {
      messages: [
        // Add system message with the current prompt content
        ...(currentPrompt.value?.content ? [{ role: 'system', content: currentPrompt.value.content }] : []),
        // Add all user and assistant messages
        ...messages.value.filter(m => m.role !== 'system')
      ],
      model: modelConfig.value.model,
      temperature: modelConfig.value.temperature,
      stream: true
    };
    
    if (socket.value && socket.value.readyState === WebSocket.OPEN) {
      // Use WebSocket if connected
      socket.value.send(JSON.stringify(messageObj));
      // The response will be handled by the websocket message handlers
      console.log('Message sent via WebSocket');
    } else {
      console.log('WebSocket not connected, using REST API fallback');
      // Fallback to REST API if WebSocket not connected
      
      // Determine the API endpoint (same logic as for WebSocket)
      let apiUrl = '/api/chat';
      if (window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1')) {
        // In development, connect to the backend server directly
        const port = 3000; // Backend port from config
        apiUrl = `${window.location.protocol}//${window.location.hostname}:${port}/api/chat`;
      }
      
      console.log('Using API endpoint:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageObj)
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      messages.value.push({
        role: 'assistant',
        content: data.message
      });
    }
  } catch (error) {
    console.error('Error sending message:', error);
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, there was an error processing your request.'
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
  // Create WebSocket connection
  // Use the correct WebSocket URL for development environment
  let wsUrl;
  if (window.location.host.includes('localhost') || window.location.host.includes('127.0.0.1')) {
    // In development, connect to the backend server directly
    const port = 3000; // Backend port from config
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${wsProtocol}//${window.location.hostname}:${port}/api/chat/ws`;
  } else {
    // In production
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${wsProtocol}//${window.location.host}/api/chat/ws`;
  }
  
  console.log('Setting up WebSocket connection to:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  socket.value = ws;
  
  let currentAssistantMessage = null;

  ws.onopen = () => {
    console.log('WebSocket connection established successfully');
  };
  
  ws.onmessage = (event) => {
    console.log('WebSocket message received:', event.data);
    
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'start') {
        // Start of a new message
        console.log('Starting new assistant message');
        currentAssistantMessage = { role: 'assistant', content: '' };
        messages.value.push(currentAssistantMessage);
      } else if (data.type === 'stream' && currentAssistantMessage) {
        // Continuation of a message
        console.log('Received content chunk:', data.content);
        currentAssistantMessage.content += data.content;
        // Force reactive update by creating a new array reference
        messages.value = [...messages.value];
        scrollToBottom();
      } else if (data.type === 'end') {
        // End of a message
        console.log('Message completed');
        isLoading.value = false;
        scrollToBottom();
      } else if (data.type === 'error') {
        console.error('WebSocket error from server:', data.error);
        isLoading.value = false;
        messages.value.push({
          role: 'assistant',
          content: `Error: ${data.error}`
        });
        scrollToBottom();
      } else if (data.type === 'info') {
        console.log('WebSocket info:', data.message);
      } else {
        console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket connection error:', error);
    isLoading.value = false;
  };
  
  ws.onclose = (event) => {
    console.log('WebSocket connection closed with code:', event.code, 'reason:', event.reason);
    isLoading.value = false;
    
    // Attempt to reconnect after delay if not closed cleanly
    if (!event.wasClean) {
      console.log('Attempting to reconnect in 3 seconds...');
      setTimeout(() => {
        if (socket.value === ws) { // Only reconnect if this is still the current socket
          setupWebSocket();
        }
      }, 3000);
    }
  };
};

// Lifecycle hooks
onMounted(() => {
  setupWebSocket();
  // Initialize with a clean slate
  resetChat();
});

onUnmounted(() => {
  // Clean up WebSocket on component unmount
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }
});

// Watch for changes in the current prompt
watch(() => currentPrompt.value, (newPrompt) => {
  if (newPrompt) {
    // Reset the chat history when the prompt changes
    resetChat();
  }
});
</script>

<style lang="scss" scoped>
@use '../styles/variables' as *;

.chat-sidebar {
  position: fixed;
  right: 0;
  top: 60px; /* Start below the app header */
  bottom: 0;
  width: 0; /* Invisible when collapsed */
  background-color: var(--card-bg-color);
  border-left: 1px solid var(--border-color);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  
  &.chat-sidebar-expanded {
    width: 400px;
  }
  /* Toggle button removed - now in the main app header */
  
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
      white-space: pre-wrap;
      word-break: break-word;
      
      :deep(pre) {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 10px 0;
        font-family: monospace;
        
        code {
          background-color: transparent;
          padding: 0;
          font-family: monospace;
        }
      }
      
      :deep(p) {
        margin-bottom: 10px;
      }
      
      :deep(ul), :deep(ol) {
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
    flex-direction: column;
    gap: 10px;
    
    textarea {
      resize: none;
      height: 80px;
      border-radius: 4px;
      padding: 10px;
    }
    
    button {
      align-self: flex-end;
    }
  }
}

@keyframes bounce {
  0%, 80%, 100% { 
    transform: scale(0);
  } 
  40% { 
    transform: scale(1.0);
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