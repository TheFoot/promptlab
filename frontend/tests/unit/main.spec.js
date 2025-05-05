import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock vue
vi.mock('vue', () => {
  const mockApp = {
    use: vi.fn(() => mockApp),
    mount: vi.fn()
  };

  return {
    createApp: vi.fn(() => mockApp)
  };
});

// Mock App.vue component
vi.mock('../../src/App.vue', () => ({
  default: {}
}));

// Mock router
vi.mock('../../src/router', () => ({
  default: {}
}));

// Mock pinia
vi.mock('pinia', () => ({
  createPinia: vi.fn(() => ({}))
}));

// Mock styles import
vi.mock('../../src/styles/main.scss', () => ({}));

describe('main.js', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset modules to ensure we get a fresh import
    vi.resetModules();
  });
  
  it('creates the Vue app with the correct plugins', async () => {
    // Import the modules needed
    const { createApp } = await import('vue');
    const { createPinia } = await import('pinia');
    
    // Import main.js which sets up the app
    await import('../../src/main.js');
    
    // Verify createApp was called
    expect(createApp).toHaveBeenCalled();
    
    // Get the mock app instance
    const app = createApp.mock.results[0].value;
    
    // Verify plugins were registered
    expect(app.use).toHaveBeenCalledTimes(2);
    
    // Verify app was mounted
    expect(app.mount).toHaveBeenCalledWith('#app');
  });
});