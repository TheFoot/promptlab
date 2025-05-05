import { describe, it, expect, vi, beforeEach } from 'vitest';
import { shallowMount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import { usePromptStore } from '../../src/stores/promptStore';
import { useUiStore } from '../../src/stores/uiStore';
import PromptDetailView from '../../src/views/PromptDetailView.vue';
import alertService from '../../src/services/alertService';

// Mock dependencies
vi.mock('../../src/services/alertService', () => ({
  default: {
    showAlert: vi.fn()
  }
}));

// Mock MarkdownPreview component that might be used
vi.mock('../../src/components/MarkdownPreview.vue', () => ({
  default: {
    name: 'MarkdownPreview',
    template: '<div class="mock-markdown-preview">{{ content }}</div>',
    props: ['content']
  }
}));

// Mock TagInput component
vi.mock('../../src/components/TagInput.vue', () => ({
  default: {
    name: 'TagInput',
    template: '<div class="mock-tag-input"></div>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}));

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home' },
    { path: '/prompts/:id', name: 'prompt-detail' }
  ]
});

describe('PromptDetailView Direct', () => {
  let wrapper;
  let promptStore;
  let uiStore;
  
  beforeEach(() => {
    // Setup Pinia
    const pinia = createPinia();
    setActivePinia(pinia);
    
    // Get store instances
    promptStore = usePromptStore();
    uiStore = useUiStore();
    
    // Mock store methods
    promptStore.fetchPromptById = vi.fn().mockImplementation(async (id) => {
      promptStore.currentPrompt = {
        _id: id,
        title: 'Test Prompt',
        content: 'Test content',
        tags: ['test', 'example']
      };
      return promptStore.currentPrompt;
    });
    
    promptStore.updatePrompt = vi.fn().mockResolvedValue({});
    promptStore.deletePrompt = vi.fn().mockResolvedValue({});
    
    // Set up route params
    router.currentRoute.value = { params: { id: 'test-id' } };
    
    // Mock router push
    router.push = vi.fn();
    
    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true);
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the view correctly', async () => {
    // Mount component
    wrapper = shallowMount(PromptDetailView, {
      global: {
        plugins: [router],
        mocks: {
          $route: { params: { id: 'test-id' } }
        }
      }
    });
    
    // Check that the component is rendered
    expect(wrapper.exists()).toBe(true);
    
    // Wait for all promises to resolve
    await flushPromises();
    
    // Check that fetchPromptById was called with the right ID
    expect(promptStore.fetchPromptById).toHaveBeenCalledWith('test-id');
  });
});