import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import AlertSystem from '../../src/components/AlertSystem.vue';

describe('AlertSystem.vue', () => {
  beforeEach(() => {
    // Mock setTimeout and clearTimeout
    vi.useFakeTimers();
  });
  
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not render alerts initially', () => {
    const wrapper = mount(AlertSystem);
    expect(wrapper.findAll('.alert').length).toBe(0);
  });

  it('exposes addAlert and removeAlert methods', () => {
    const wrapper = mount(AlertSystem);
    expect(typeof wrapper.vm.addAlert).toBe('function');
    expect(typeof wrapper.vm.removeAlert).toBe('function');
  });
  
  it('adds an alert with addAlert method', async () => {
    const wrapper = mount(AlertSystem);
    
    // Add an alert
    wrapper.vm.addAlert('Test message', 'success');
    await wrapper.vm.$nextTick();
    
    // Check alert properties
    const alerts = wrapper.findAll('.alert');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].text()).toContain('Test message');
    expect(alerts[0].classes()).toContain('alert-success');
  });
  
  it('supports different alert types', async () => {
    const wrapper = mount(AlertSystem);
    
    // Add alerts with different types
    wrapper.vm.addAlert('Success message', 'success');
    wrapper.vm.addAlert('Error message', 'error');
    wrapper.vm.addAlert('Info message', 'info');
    await wrapper.vm.$nextTick();
    
    // Check alert classes
    const alerts = wrapper.findAll('.alert');
    expect(alerts.length).toBe(3);
    expect(alerts[0].classes()).toContain('alert-success');
    expect(alerts[1].classes()).toContain('alert-error');
    expect(alerts[2].classes()).toContain('alert-info');
  });
  
  it('removes alerts with removeAlert method', async () => {
    const wrapper = mount(AlertSystem);
    
    // Add two alerts
    const id1 = wrapper.vm.addAlert('First message');
    const id2 = wrapper.vm.addAlert('Second message');
    await wrapper.vm.$nextTick();
    
    // Confirm both alerts are present
    expect(wrapper.findAll('.alert').length).toBe(2);
    
    // Remove the first alert
    wrapper.vm.removeAlert(id1);
    await wrapper.vm.$nextTick();
    
    // Check that only one alert remains
    const remainingAlerts = wrapper.findAll('.alert');
    expect(remainingAlerts.length).toBe(1);
    expect(remainingAlerts[0].text()).toContain('Second message');
  });
  
  it('sets a timeout to automatically remove alerts', async () => {
    const wrapper = mount(AlertSystem);
    
    // Add an alert with a 2000ms duration
    wrapper.vm.addAlert('Test message', 'info', 2000);
    await wrapper.vm.$nextTick();
    
    // Check that the alert was added
    expect(wrapper.findAll('.alert').length).toBe(1);
    
    // Advance time by 1999ms (just before timeout)
    vi.advanceTimersByTime(1999);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.alert').length).toBe(1);
    
    // Advance time by 1ms more (just enough to trigger timeout)
    vi.advanceTimersByTime(1);
    await wrapper.vm.$nextTick();
    
    // Check that the alert was removed
    expect(wrapper.findAll('.alert').length).toBe(0);
  });
  
  it('clears timeouts when component is unmounted', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const wrapper = mount(AlertSystem);
    
    // Add some alerts
    wrapper.vm.addAlert('First alert');
    wrapper.vm.addAlert('Second alert');
    
    // Unmount the component
    wrapper.unmount();
    
    // Check that clearTimeout was called
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});