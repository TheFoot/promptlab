import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import PromptSidebar from '../../src/components/PromptSidebar.vue';
import { usePromptStore } from '../../src/stores/promptStore';

// Mock vue-router
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { id: '1' },
  })),
}));

// Mock router-link component
const routerLinkStub = {
  name: 'RouterLink',
  template: '<a><slot /></a>',
  props: ['to']
};

describe('PromptSidebar.vue', () => {
  let wrapper;
  let store;
  
  beforeEach(() => {
    // Create a fresh Pinia and activate it
    const pinia = createPinia();
    setActivePinia(pinia);
    
    // Mock promptStore methods
    store = usePromptStore();
    store.fetchPrompts = vi.fn().mockResolvedValue();
    store.fetchTags = vi.fn().mockResolvedValue();
    store.setSearchQuery = vi.fn();
    store.setSelectedTag = vi.fn();
    
    // Set up store state
    store.prompts = [
      { 
        _id: '1', 
        title: 'Test Prompt 1', 
        tags: ['tag1', 'tag2'], 
        updatedAt: '2023-01-01T00:00:00.000Z' 
      },
      { 
        _id: '2', 
        title: 'Test Prompt 2', 
        tags: ['tag2', 'tag3'], 
        updatedAt: '2023-01-02T00:00:00.000Z' 
      }
    ];
    store.tags = ['tag1', 'tag2', 'tag3'];
    store.loading = false;
    store.error = null;
    store.searchQuery = '';
    store.selectedTag = '';
    
    // Mock Date.toLocaleDateString
    const originalToLocaleDateString = Date.prototype.toLocaleDateString;
    Date.prototype.toLocaleDateString = function() {
      return '1/1/2023';
    };
    
    // Setup fake timers
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    // Restore timers
    vi.useRealTimers();
    vi.clearAllMocks();
  });
  
  it('renders properly with prompts', async () => {
    // Mount the component with router-link stub
    wrapper = mount(PromptSidebar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    });
    
    // Check the prompt list rendered correctly
    const promptItems = wrapper.findAll('.prompt-item');
    expect(promptItems.length).toBe(2);
    
    // Check first prompt content
    const firstPrompt = promptItems[0];
    expect(firstPrompt.find('.prompt-title').text()).toBe('Test Prompt 1');
  });
  
  it('renders loading state', async () => {
    // Set loading state
    store.loading = true;
    
    // Mount component
    wrapper = mount(PromptSidebar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    });
    
    // Check loading state is rendered
    expect(wrapper.find('.loading').exists()).toBe(true);
    expect(wrapper.find('.prompt-item').exists()).toBe(false);
  });
  
  it('renders error state', async () => {
    // Set error state
    store.error = 'Error message';
    
    // Mount component
    wrapper = mount(PromptSidebar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    });
    
    // Check error state is rendered
    expect(wrapper.find('.error').exists()).toBe(true);
    expect(wrapper.find('.error').text()).toBe('Error message');
  });
  
  it('renders empty state when no prompts', async () => {
    // Set empty prompts
    store.prompts = [];
    
    // Mount component
    wrapper = mount(PromptSidebar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    });
    
    // Check empty state is rendered
    expect(wrapper.find('.no-prompts').exists()).toBe(true);
  });
  
  it('handles search input', async () => {
    wrapper = mount(PromptSidebar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    });
    
    // Find and update search input
    const searchInput = wrapper.find('.search-input');
    await searchInput.setValue('test');
    
    // Advance timers to trigger debounced function
    vi.advanceTimersByTime(500);
    
    // Check that setSearchQuery was called
    expect(store.setSearchQuery).toHaveBeenCalledWith('test');
  });
  
  it('handles tag selection', async () => {
    wrapper = mount(PromptSidebar, {
      global: {
        stubs: {
          RouterLink: routerLinkStub
        }
      }
    });
    
    // Find and update tag filter
    const tagFilter = wrapper.find('.tag-filter');
    await tagFilter.setValue('tag1');
    await tagFilter.trigger('change');
    
    // Check that setSelectedTag was called
    expect(store.setSelectedTag).toHaveBeenCalledWith('tag1');
  });
});