import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AlertSystem from '../../src/components/AlertSystem.vue';

describe('AlertSystem.vue', () => {
  it('renders alert when shown with correct message and type', () => {
    const wrapper = mount(AlertSystem, {
      props: {
        show: true,
        message: 'Test alert message',
        type: 'success'
      }
    });
    
    expect(wrapper.text()).toContain('Test alert message');
    expect(wrapper.classes()).toContain('alert');
    expect(wrapper.classes()).toContain('success');
  });

  it('does not render alert when show is false', () => {
    const wrapper = mount(AlertSystem, {
      props: {
        show: false,
        message: 'Test alert message',
        type: 'success'
      }
    });
    
    expect(wrapper.isVisible()).toBe(false);
  });
});
