import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TagInput from '../../src/components/TagInput.vue';

describe('TagInput.vue', () => {
  it('renders correctly without tags', () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    expect(wrapper.find('.tag-input-container').exists()).toBe(true);
    expect(wrapper.find('.tag-input').exists()).toBe(true);
    expect(wrapper.findAll('.tag-item').length).toBe(0);
  });

  it('renders tags correctly', () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: ['javascript', 'vue']
      }
    });
    
    const tagItems = wrapper.findAll('.tag-item');
    expect(tagItems.length).toBe(2);
    expect(tagItems[0].find('.tag-text').text()).toBe('javascript');
    expect(tagItems[1].find('.tag-text').text()).toBe('vue');
  });

  it('adds a tag when pressing Enter', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    // Type in the input field
    const input = wrapper.find('.tag-input');
    await input.setValue('javascript');
    
    // Press Enter
    await input.trigger('keydown.enter');
    
    // Check that the modelValue was updated correctly
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript']);
  });

  it('adds a tag when pressing comma', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    // Type in the input field
    const input = wrapper.find('.tag-input');
    await input.setValue('vue');
    
    // Press comma
    await input.trigger('keydown.comma');
    
    // Check that the modelValue was updated correctly
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['vue']);
  });

  it('adds multiple tags when comma-separated', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    // Type comma-separated tags in the input field
    const input = wrapper.find('.tag-input');
    await input.setValue('javascript,vue,react');
    
    // Press Enter
    await input.trigger('keydown.enter');
    
    // Check that the modelValue was updated with all tags
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript', 'vue', 'react']);
  });

  it('trims whitespace from tags', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    // Type tags with whitespace
    const input = wrapper.find('.tag-input');
    await input.setValue('  javascript  ,  vue  ');
    
    // Press Enter
    await input.trigger('keydown.enter');
    
    // Check that the tags were trimmed
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript', 'vue']);
  });

  it('ignores empty tags', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    // Type tags with empty values
    const input = wrapper.find('.tag-input');
    await input.setValue('javascript,,vue,');
    
    // Press Enter
    await input.trigger('keydown.enter');
    
    // Check that empty tags were ignored
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript', 'vue']);
  });

  it('prevents duplicate tags', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: ['javascript']
      }
    });
    
    // Try to add an existing tag
    const input = wrapper.find('.tag-input');
    await input.setValue('javascript');
    
    // Press Enter
    await input.trigger('keydown.enter');
    
    // Check that no duplicate was added
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript']);
  });

  it('removes a tag when clicking the remove button', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: ['javascript', 'vue']
      }
    });
    
    // Click the remove button for the first tag
    const removeButtons = wrapper.findAll('.tag-remove');
    await removeButtons[0].trigger('click');
    
    // Check that the first tag was removed
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['vue']);
  });

  it('removes the last tag when pressing backspace with empty input', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: ['javascript', 'vue']
      }
    });
    
    // Clear the input and press backspace
    const input = wrapper.find('.tag-input');
    await input.setValue('');
    await input.trigger('keydown.backspace');
    
    // Check that the last tag was removed
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript']);
  });

  it('does not remove tags with backspace when input has value', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: ['javascript', 'vue']
      }
    });
    
    // Type something and press backspace
    const input = wrapper.find('.tag-input');
    await input.setValue('react');
    await input.trigger('keydown.backspace');
    
    // Check that no tags were removed
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('adds tag when input loses focus (blur)', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: []
      }
    });
    
    // Type in the input field
    const input = wrapper.find('.tag-input');
    await input.setValue('javascript');
    
    // Trigger blur event
    await input.trigger('blur');
    
    // Check that the tag was added
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0][0]).toEqual(['javascript']);
  });

  it('adds class to input when tags exist', async () => {
    const wrapper = mount(TagInput, {
      props: {
        modelValue: ['javascript']
      }
    });
    
    // Check that the input has the has-tags class
    const input = wrapper.find('.tag-input');
    expect(input.classes()).toContain('has-tags');
  });
});