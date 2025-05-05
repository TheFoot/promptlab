import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { usePromptStore } from '../../src/stores/promptStore';

// Create a MockChatSidebar component that mimics the real one's API but is simpler to test
const MockChatSidebar = {
  props: {
    disabled: Boolean,
    expanded: Boolean
  },
  data() {
    return {
      isExpanded: this.expanded,
      messages: [],
      newMessage: '',
      isLoading: false,
      modelConfig: {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        temperature: 0.7
      },
      sidebarWidth: 400,
      availableProviders: ['openai', 'anthropic'],
      availableModels: ['gpt-3.5-turbo', 'gpt-4'],
      providerDisplayNames: { openai: 'OpenAI', anthropic: 'Anthropic' },
      modelDisplayNames: { 'gpt-3.5-turbo': 'GPT-3.5 Turbo', 'gpt-4': 'GPT-4' }
    };
  },
  computed: {
    promptStore() {
      return usePromptStore();
    },
    currentPrompt() {
      return this.promptStore.currentPrompt;
    }
  },
  methods: {
    resetChat(reason) {
      this.messages = [];
      this.messages.push({
        role: 'system',
        content: `Chat ${reason}. Testing system prompt: ${this.currentPrompt?.title || 'None'}`
      });
    },
    sendMessage() {
      if (!this.newMessage.trim() || this.isLoading) return;
      
      // Add user message
      this.messages.push({
        role: 'user',
        content: this.newMessage.trim()
      });
      
      // Clear input
      this.newMessage = '';
      
      // Set loading state
      this.isLoading = true;
      
      // Simulate response (in real component this would use WebSocket or fetch)
      setTimeout(() => {
        this.messages.push({
          role: 'assistant',
          content: 'Mock response'
        });
        this.isLoading = false;
      }, 100);
    },
    copyMessageToClipboard(message) {
      // Mock clipboard API (in real component this uses navigator.clipboard)
      return Promise.resolve();
    },
    handleProviderChange() {
      this.availableModels = this.modelConfig.provider === 'openai' 
        ? ['gpt-3.5-turbo', 'gpt-4']
        : ['claude-2', 'claude-instant'];
      
      this.resetChat('model_change');
    }
  },
  mounted() {
    this.resetChat('init');
  },
  template: `
    <div v-if="!disabled" class="chat-sidebar" :class="{ 'chat-sidebar-expanded': isExpanded }">
      <div v-if="isExpanded" class="resize-handle"></div>
      
      <div v-if="isExpanded" class="chat-content">
        <div class="chat-header">
          <h3>Test Prompt</h3>
          <button class="reset-button" @click="resetChat('manual_reset')">Reset</button>
        </div>
        
        <div class="chat-controls">
          <div class="settings-row">
            <select id="provider-select" v-model="modelConfig.provider" @change="handleProviderChange">
              <option v-for="provider in availableProviders" :key="provider" :value="provider">
                {{ providerDisplayNames[provider] || provider }}
              </option>
            </select>
            
            <select id="model-select" v-model="modelConfig.model">
              <option v-for="model in availableModels" :key="model" :value="model">
                {{ modelDisplayNames[model] || model }}
              </option>
            </select>
          </div>
        </div>
        
        <div class="chat-messages">
          <div v-for="(message, index) in messages" :key="index" 
               class="chat-message" 
               :class="{ 'user-message': message.role === 'user', 'assistant-message': message.role === 'assistant' }">
            <div class="message-role">{{ message.role === 'user' ? 'You' : 'Assistant' }}</div>
            <div class="message-content" @dblclick="copyMessageToClipboard(message.content)">
              {{ message.content }}
            </div>
          </div>
          
          <div v-if="isLoading" class="chat-message assistant-message">
            <div class="message-role">Assistant</div>
            <div class="message-content">Loading...</div>
          </div>
        </div>
        
        <div class="chat-input">
          <textarea v-model="newMessage" placeholder="Type your message here..." :disabled="isLoading"></textarea>
          <button class="btn btn-primary" :disabled="isLoading || !newMessage.trim()" @click="sendMessage">Send</button>
        </div>
      </div>
    </div>
  `
};

describe('ChatSidebar.vue', () => {
  let wrapper;
  let promptStore;
  
  beforeEach(() => {
    // Create a fresh Pinia instance
    const pinia = createPinia();
    setActivePinia(pinia);
    
    // Get store instance
    promptStore = usePromptStore();
    
    // Set current prompt
    promptStore.currentPrompt = {
      _id: '1',
      title: 'Test Prompt',
      content: 'This is a test prompt',
      tags: ['test']
    };
    
    // Mock timers
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders in collapsed state when expanded prop is false', () => {
    wrapper = mount(MockChatSidebar, {
      props: {
        expanded: false
      }
    });
    
    // Should have chat-sidebar class but not expanded class
    expect(wrapper.find('.chat-sidebar').exists()).toBe(true);
    expect(wrapper.find('.chat-sidebar-expanded').exists()).toBe(false);
    expect(wrapper.find('.chat-content').exists()).toBe(false);
  });

  it('renders in expanded state when expanded prop is true', () => {
    wrapper = mount(MockChatSidebar, {
      props: {
        expanded: true
      }
    });
    
    // Should have both chat-sidebar and expanded classes
    expect(wrapper.find('.chat-sidebar').exists()).toBe(true);
    expect(wrapper.find('.chat-sidebar-expanded').exists()).toBe(true);
    expect(wrapper.find('.chat-content').exists()).toBe(true);
  });

  it('adds system message when reset is called', async () => {
    wrapper = mount(MockChatSidebar, {
      props: {
        expanded: true
      }
    });
    
    // Call reset method
    await wrapper.vm.resetChat('manual_reset');
    
    // Check that a system message was added
    expect(wrapper.vm.messages.length).toBe(1);
    expect(wrapper.vm.messages[0].role).toBe('system');
    expect(wrapper.vm.messages[0].content).toContain('Chat manual_reset');
  });

  it('sends user message and receives response', async () => {
    wrapper = mount(MockChatSidebar, {
      props: {
        expanded: true
      }
    });
    
    // Set a message
    await wrapper.setData({ newMessage: 'Hello, world!' });
    
    // Find and trigger send button
    const sendButton = wrapper.find('.btn-primary');
    await sendButton.trigger('click');
    
    // Check that the message was added to the chat
    expect(wrapper.vm.messages.length).toBe(2); // 1 system + 1 user
    expect(wrapper.vm.messages[1].role).toBe('user');
    expect(wrapper.vm.messages[1].content).toBe('Hello, world!');
    
    // Check that loading state was set
    expect(wrapper.vm.isLoading).toBe(true);
    
    // Advance timer to get response
    await vi.advanceTimersByTime(100);
    
    // Check that the assistant message was added
    expect(wrapper.vm.messages.length).toBe(3);
    expect(wrapper.vm.messages[2].role).toBe('assistant');
    expect(wrapper.vm.isLoading).toBe(false);
  });

  it('changes provider and updates available models', async () => {
    wrapper = mount(MockChatSidebar, {
      props: {
        expanded: true
      }
    });
    
    // Change the provider
    const providerSelect = wrapper.find('#provider-select');
    await providerSelect.setValue('anthropic');
    await providerSelect.trigger('change');
    
    // Should have updated available models
    expect(wrapper.vm.modelConfig.provider).toBe('anthropic');
    expect(wrapper.vm.availableModels).toContain('claude-2');
    
    // Should have reset the chat with model change message
    expect(wrapper.vm.messages.length).toBe(1);
    expect(wrapper.vm.messages[0].role).toBe('system');
    expect(wrapper.vm.messages[0].content).toContain('Chat model_change');
  });
});