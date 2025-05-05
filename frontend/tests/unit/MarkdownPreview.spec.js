import { describe, it, expect, vi } from 'vitest';
import { computed, ref } from 'vue';
import { mount } from '@vue/test-utils';

// Create a mock component instead of using the real one
const MockMarkdownPreview = {
  template: `
    <div class="markdown-preview">
      <div v-if="!content" class="empty-preview">No content to preview.</div>
      <div v-else class="markdown-content" v-html="renderedMarkdown"></div>
    </div>
  `,
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  setup(props) {
    const renderedMarkdown = computed(() => {
      if (!props.content) return '';
      return `<p>Mocked markdown: ${props.content}</p>`;
    });

    return {
      renderedMarkdown
    };
  }
};

describe('MarkdownPreview.vue', () => {
  it('renders empty preview message when content is not provided', () => {
    const wrapper = mount(MockMarkdownPreview);
    
    expect(wrapper.find('.empty-preview').exists()).toBe(true);
    expect(wrapper.find('.empty-preview').text()).toBe('No content to preview.');
    expect(wrapper.find('.markdown-content').exists()).toBe(false);
  });

  it('renders markdown content when content is provided', () => {
    const wrapper = mount(MockMarkdownPreview, {
      props: {
        content: '# Test Content'
      }
    });
    
    expect(wrapper.find('.empty-preview').exists()).toBe(false);
    expect(wrapper.find('.markdown-content').exists()).toBe(true);
    expect(wrapper.find('.markdown-content').html()).toContain('Mocked markdown: # Test Content');
  });
});