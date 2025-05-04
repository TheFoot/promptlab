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
          <h3>Test Prompt</h3>
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
              <option value="openai">
                OpenAI
              </option>
              <option value="anthropic">
                Anthropic
              </option>
            </select>
            
            <label for="model-select">Model:</label>
            <select
              id="model-select"
              v-model="modelConfig.model"
              class="chat-select"
            >
              <template v-if="modelConfig.provider === 'openai'">
                <option value="gpt-3.5-turbo">
                  GPT-3.5 Turbo
                </option>
                <option value="gpt-4">
                  GPT-4
                </option>
                <option value="gpt-4-turbo">
                  GPT-4 Turbo
                </option>
                <option value="gpt-4o">
                  GPT-4o
                </option>
              </template>
              <template v-else-if="modelConfig.provider === 'anthropic'">
                <option value="claude-3-7-sonnet-latest">
                  Claude 3.7 Sonnet (Newest)
                </option>
                <option value="claude-3-5-sonnet-latest">
                  Claude 3.5 Sonnet
                </option>
                <option value="claude-3-5-haiku-latest">
                  Claude 3.5 Haiku
                </option>
                <option value="claude-3-opus-20240229">
                  Claude 3 Opus
                </option>
                <option value="claude-3-sonnet-20240229">
                  Claude 3 Sonnet
                </option>
                <option value="claude-3-haiku-20240307">
                  Claude 3 Haiku
                </option>
              </template>
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
            @dblclick="copyMessageToClipboard(message.content)"
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
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { usePromptStore } from '../stores/promptStore';
import { marked } from 'marked';
import highlightjs from 'highlight.js';
import 'highlight.js/styles/github.css';
import alertService from '../services/alertService';

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
    
    // When expanded
    if (isExpanded.value) {
      nextTick(() => {
        // Apply stored width from state
        if (document.querySelector('.chat-sidebar')) {
          document.querySelector('.chat-sidebar').style.width = `${sidebarWidth.value}px`;
        }
        scrollToBottom();
        
        // Notify parent about the width for content adjustment
        emit('resize', sidebarWidth.value);
      });
    } 
    // When collapsed
    else {
      // Reset inline style to let CSS handle width
      if (document.querySelector('.chat-sidebar')) {
        document.querySelector('.chat-sidebar').style.width = '';
      }
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
const messageInput = ref(null); // Reference to the textarea
const socket = ref(null);
const promptStore = usePromptStore();
const modelConfig = ref({
  provider: 'openai',
  model: 'gpt-3.5-turbo',
  temperature: 0.7
});
const sidebarWidth = ref(400); // Default width

// Get current prompt from store
const currentPrompt = computed(() => promptStore.currentPrompt);

// Define emits
const emit = defineEmits(['toggle', 'resize']);

// Note: Toggle function is now handled by parent component via the expanded prop

// Resize sidebar
const startResize = (e) => {
  e.preventDefault();
  document.body.style.cursor = 'ew-resize';
  
  const initialX = e.clientX;
  const initialWidth = parseInt(getComputedStyle(document.querySelector('.chat-sidebar')).width);
  
  // Send initial resize event to indicate resize started
  emit('resize', initialWidth);
  
  const handleMouseMove = (e) => {
    const newWidth = initialWidth - (e.clientX - initialX);
    if (newWidth > 250 && newWidth < 600) {
      sidebarWidth.value = newWidth;
      document.querySelector('.chat-sidebar').style.width = `${newWidth}px`;
      
      // Emit resize event with new width to parent component
      emit('resize', newWidth);
    }
  };
  
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    
    // Send one final resize event after mouse up
    emit('resize', sidebarWidth.value);
    
    // Save the width to localStorage
    saveSidebarWidth(sidebarWidth.value);
  };
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
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
  messageInput.value.style.height = 'auto';
  
  // Set new height based on content - min 40px, max 120px
  const newHeight = Math.min(Math.max(messageInput.value.scrollHeight, 40), 120);
  messageInput.value.style.height = `${newHeight}px`;
};

// Handle provider change
const handleProviderChange = () => {
  // Set default model based on selected provider
  if (modelConfig.value.provider === 'openai') {
    modelConfig.value.model = 'gpt-3.5-turbo';
  } else if (modelConfig.value.provider === 'anthropic') {
    modelConfig.value.model = 'claude-3-7-sonnet-latest';
  }
  
  // Reset chat history when provider changes
  resetChat('model_change');
};

// Reset chat conversation
const resetChat = (reason = 'manual_reset') => {
  messages.value = [];
  
  // Add appropriate system message based on reset reason
  let resetMessage = '';
  
  switch (reason) {
    case 'model_change':
      // Model or provider change message
      resetMessage = `Chat reset due to model change. Now using: ${modelConfig.value.provider} / ${modelConfig.value.model}`;
      break;
    case 'prompt_change':
      // Prompt change message
      resetMessage = `Chat reset due to prompt change. Now testing: ${currentPrompt.value?.title || 'Unknown prompt'}`;
      break;
    case 'manual_reset':
      // Manual reset by user
      resetMessage = 'Chat manually reset.';
      break;
    case 'init':
      // Initial setup
      resetMessage = 'Chat initialized.';
      break;
    default:
      // Default message
      resetMessage = 'Chat reset.';
  }
  
  // Add the prompt information if available
  if (currentPrompt.value && reason !== 'prompt_change') {
    resetMessage += ` Testing system prompt: ${currentPrompt.value.title}`;
  }
  
  // Add the system message
  messages.value.push({
    role: 'system',
    content: resetMessage
  });
};

// Copy message to clipboard
const copyMessageToClipboard = async (message) => {
  try {
    await navigator.clipboard.writeText(message);
    alertService.showAlert('Message copied to clipboard!', 'success', 3000);
  } catch (err) {
    console.error('Failed to copy message:', err);
    alertService.showAlert('Failed to copy to clipboard', 'error', 3000);
  }
};

// Format message with markdown and syntax highlighting
const formatMessage = (content) => {
  if (!content) return '';
  
  // Add download buttons to code blocks
  const renderer = new marked.Renderer();
  
  // Override the paragraph renderer to handle code blocks specially
  const originalParagraph = renderer.paragraph;
  renderer.paragraph = function(text) {
    // If paragraph contains only a code block, don't wrap in <p> tags
    if (text.trim().startsWith('<div class="code-block-wrapper">') && 
        text.trim().endsWith('</div>')) {
      return text;
    }
    
    // Otherwise use the original paragraph renderer
    return originalParagraph.call(this, text);
  };
  
  renderer.code = (code, language) => {
    // Default highlightjs code rendering
    const highlightedCode = language && highlightjs.getLanguage(language)
      ? highlightjs.highlight(code, { language }).value
      : highlightjs.highlightAuto(code).value;
      
    // Create a timestamp-based filename with proper extension
    const timestamp = new Date().getTime();
    const extension = language || 'txt';
    const filename = `code-${timestamp}.${extension}`;
    
    // Return code block with download button using an icon
    return `
      <div class="code-block-wrapper">
        <div class="code-header">
          <span class="code-language">${language || 'plain text'}</span>
          <button class="code-download-btn" title="Download code" data-code="${encodeURIComponent(code)}" data-filename="${filename}" onclick="window.downloadCodeBlock(this)">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
        <pre><code class="hljs ${language}">${highlightedCode}</code></pre>
      </div>
    `;
  };
  
  // Set the custom renderer
  marked.setOptions({ renderer });
  
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
  
  // Clear input after storing message
  newMessage.value = ''; // Clear input
  
  // Reset textarea height
  if (messageInput.value) {
    messageInput.value.style.height = 'auto';
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
        // Add system message with the current prompt content
        ...(currentPrompt.value?.content ? [{ role: 'system', content: currentPrompt.value.content }] : []),
        // Add all user and assistant messages
        ...messages.value.filter(m => m.role !== 'system')
      ],
      provider: modelConfig.value.provider,
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
      
      // Use the API endpoint through Vite's proxy
      const apiUrl = '/api/chat';
      
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
  // Create WebSocket connection using the browser's current protocol and host
  // This leverages Vite's WebSocket proxy configuration
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/api/chat/ws`;
  
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

// Store sidebar width in localStorage
const saveSidebarWidth = (width) => {
  localStorage.setItem('chat-sidebar-width', width.toString());
};

// Function to download code blocks
const downloadCodeBlock = (button) => {
  try {
    const code = decodeURIComponent(button.getAttribute('data-code'));
    const filename = button.getAttribute('data-filename');
    
    // Create blob with code content
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alertService.showAlert(`Downloading ${filename}`, 'success', 3000);
  } catch (error) {
    console.error('Error downloading code:', error);
    alertService.showAlert('Failed to download code', 'error', 3000);
  }
};

onMounted(() => {
  setupWebSocket();
  
  // Load saved sidebar width from localStorage or use default
  const savedWidth = localStorage.getItem('chat-sidebar-width');
  if (savedWidth) {
    const width = parseInt(savedWidth, 10);
    // Ensure width is within reasonable bounds (250-600px)
    if (width >= 250 && width <= 600) {
      sidebarWidth.value = width;
    }
  }
  
  // Initialize with a clean slate
  resetChat('init');
  
  // Apply initial width from state
  if (isExpanded.value && document.querySelector('.chat-sidebar')) {
    document.querySelector('.chat-sidebar').style.width = `${sidebarWidth.value}px`;
  }
  
  // Initialize textarea height
  nextTick(() => {
    if (messageInput.value) {
      adjustTextareaHeight();
    }
  });
  
  // Add download function to window object for code download buttons
  window.downloadCodeBlock = downloadCodeBlock;
});

onUnmounted(() => {
  // Clean up WebSocket on component unmount
  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }
  
  // Remove downloadCodeBlock function from window object
  if (window.downloadCodeBlock === downloadCodeBlock) {
    window.downloadCodeBlock = undefined;
  }
});

// Watch for changes in the current prompt
watch(() => currentPrompt.value, (newPrompt) => {
  if (newPrompt) {
    // Reset the chat history when the prompt changes
    resetChat('prompt_change');
  }
});

// Watch for changes in the model selection
watch(() => modelConfig.value.model, (newModel, oldModel) => {
  if (oldModel && newModel !== oldModel) {
    // Reset chat history when model changes
    resetChat('model_change');
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
      white-space: pre-wrap;
      word-break: break-word;
      cursor: text;
      position: relative;
      
      &:hover {
        &::after {
          content: 'Double-click to copy';
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
      
      :deep(.code-block-wrapper) {
        margin: 0;
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid var(--border-color);
        display: block; /* Ensure proper display */
        line-height: 0; /* Eliminate any extra space */
        
        /* But restore line height for children */
        & > * {
          line-height: normal;
        }
      }
      
      /* Margin between elements */
      :deep(p) {
        margin-bottom: 10px;
      }
      
      /* Margin between code blocks */
      :deep(.code-block-wrapper) {
        margin-top: 10px;
        margin-bottom: 10px;
      }
      
      /* First code block shouldn't have top margin */
      :deep(.message-content > .code-block-wrapper:first-child) {
        margin-top: 0;
      }
      
      :deep(.code-header) {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: #343541;
        color: #fff;
        padding: 4px 8px;  /* Restored padding */
        font-size: 0.8rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        height: 30px;  /* Increased height for more padding */
        line-height: 22px;  /* Adjusted line height */
        box-sizing: border-box;
        
        // Dark mode adjustments - make header more visible
        .dark-theme & {
          background-color: #1e1e2f;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
      }
      
      :deep(.code-language) {
        font-family: monospace;
        font-size: 0.75rem;
        opacity: 0.8;
        display: inline-block;
        line-height: 1;
        position: relative;
        top: -1px; /* Fine-tune vertical alignment */
      }
      
      :deep(.code-download-btn) {
        background-color: transparent;
        border: none;
        color: white;
        width: 22px;
        height: 22px;
        border-radius: 3px;
        cursor: pointer;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: all 0.2s;
        line-height: 1;
        
        svg {
          transition: all 0.2s;
          width: 14px;
          height: 14px;
        }
        
        &:hover {
          opacity: 1;
          background-color: rgba(255, 255, 255, 0.1);
          
          svg {
            stroke: #fff;
          }
        }
        
        &:active {
          background-color: rgba(255, 255, 255, 0.2);
        }
      }
      
      :deep(pre) {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 10px;
        border-radius: 4px;
        overflow-x: auto;
        margin: 10px 0;
        font-family: monospace;
        max-height: 400px;
        
        // Dark mode adjustments
        .dark-theme & {
          background-color: #2a2a2a;
          color: #e6e6e6;
        }
      }
      
      :deep(.code-block-wrapper pre) {
        margin: 0;
        border-radius: 0 0 4px 4px;
        background-color: rgba(0, 0, 0, 0.03);
        
        // Dark mode adjustments
        .dark-theme & {
          background-color: #2a2a2a;
          color: #e6e6e6;
        }
        
        code {
          background-color: transparent;
          padding: 0;
          font-family: monospace;
          
          // Dark mode adjustments
          .dark-theme & {
            color: #e6e6e6;
          }
        }
      }
      
      :deep(p) {
        margin-bottom: 10px;
      }
      
      :deep(ul), :deep(ol) {
        padding-left: 20px;
        margin-bottom: 10px;
      }
      
      /* Styling for inline code blocks */
      :deep(code:not(pre code)) {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 2px 4px;
        border-radius: 3px;
        font-family: monospace;
        font-size: 0.9em;
        
        // Dark mode adjustments
        .dark-theme & {
          background-color: rgba(255, 255, 255, 0.1);
          color: #e6e6e6;
        }
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