import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../../src/views/HomeView.vue';
import { usePromptStore } from '../../src/stores/promptStore';

// Mock child components
vi.mock('../../src/components/PromptSidebar.vue', () => ({
  default: {
    name: 'PromptSidebar',
    template: '<div class="mock-prompt-sidebar"></div>'
  }
}));

// Create a mock router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/prompts/new', name: 'prompt-create' }
  ]
});

describe('HomeView.vue', () => {
  let wrapper;
  let promptStore;
  
  beforeEach(() => {
    // Create a fresh Pinia instance and make it active
    const pinia = createPinia();
    setActivePinia(pinia);
    
    // Get the store instance
    promptStore = usePromptStore();
    
    // Mock store methods
    promptStore.fetchPrompts = vi.fn().mockResolvedValue();
  });
  
  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('renders the welcome message and prompt sidebar', async () => {
    // Initialize store state
    promptStore.prompts = [];
    
    wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });
    
    // Check that the component is rendered
    expect(wrapper.find('.home-view').exists()).toBe(true);
    
    // Check that it contains the sidebar
    expect(wrapper.find('.sidebar').exists()).toBe(true);
    expect(wrapper.find('.mock-prompt-sidebar').exists()).toBe(true);
    
    // Check that it contains the welcome message
    expect(wrapper.find('.welcome-card').exists()).toBe(true);
    expect(wrapper.find('h2').text()).toBe('Welcome to PromptLab!');
    
    // Check the call to action
    expect(wrapper.find('.btn-primary').text()).toBe('Create Your First Prompt');
  });

  it('fetches prompts on mount if none are loaded', async () => {
    // Initialize store state with empty prompts
    promptStore.prompts = [];
    
    wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });
    
    // Check that fetchPrompts was called
    expect(promptStore.fetchPrompts).toHaveBeenCalled();
  });

  it('does not fetch prompts on mount if already loaded', async () => {
    // Initialize store state with some prompts
    promptStore.prompts = [
      { _id: '1', title: 'Test Prompt' }
    ];
    
    wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });
    
    // Check that fetchPrompts was not called
    expect(promptStore.fetchPrompts).not.toHaveBeenCalled();
  });

  it('shows different CTA text when prompts exist', async () => {
    // Initialize store state with prompts
    promptStore.prompts = [
      { _id: '1', title: 'Test Prompt 1' },
      { _id: '2', title: 'Test Prompt 2' }
    ];
    
    wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });
    
    // Check the call to action text
    expect(wrapper.find('.btn-primary').text()).toBe('Create New Prompt');
    
    // Check that it displays the prompt count
    expect(wrapper.find('.existing-prompts-message').exists()).toBe(true);
    expect(wrapper.find('.existing-prompts-message').text()).toContain('You have 2 prompts available');
  });

  it('handles singular prompt text correctly', async () => {
    // Initialize store state with a single prompt
    promptStore.prompts = [
      { _id: '1', title: 'Test Prompt 1' }
    ];
    
    wrapper = mount(HomeView, {
      global: {
        plugins: [router]
      }
    });
    
    // Check that it uses singular form
    expect(wrapper.find('.existing-prompts-message').text()).toContain('You have 1 prompt available');
  });
});