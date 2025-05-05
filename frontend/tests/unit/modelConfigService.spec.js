import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import modelConfigService from '../../src/services/modelConfigService';
import alertService from '../../src/services/alertService';

// Mock the alertService
vi.mock('../../src/services/alertService', () => ({
  default: {
    showAlert: vi.fn()
  }
}));

describe('modelConfigService', () => {
  let originalFetch;
  
  beforeEach(() => {
    // Store the original fetch
    originalFetch = global.fetch;
    
    // Reset service state for each test
    modelConfigService.isLoaded = false;
    modelConfigService.loadPromise = null;
    
    // Reset console mocks
    console.log = vi.fn();
    console.error = vi.fn();
  });
  
  afterEach(() => {
    // Restore fetch
    global.fetch = originalFetch;
    
    // Clear mocks
    vi.clearAllMocks();
  });

  it('loads configuration from API successfully', async () => {
    // Mock the API response
    const mockConfig = {
      providers: {
        available: ['openai', 'anthropic'],
        default: 'openai',
        displayNames: {
          openai: 'OpenAI',
          anthropic: 'Anthropic'
        }
      },
      models: {
        openai: {
          available: ['gpt-3.5-turbo', 'gpt-4'],
          default: 'gpt-3.5-turbo',
          displayNames: {
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gpt-4': 'GPT-4'
          }
        }
      }
    };
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockConfig)
    });
    
    // Load the config
    const config = await modelConfigService.loadConfig();
    
    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith('/api/chat/config');
    
    // Check that the config was loaded correctly
    expect(config).toEqual(mockConfig);
    expect(modelConfigService.config).toEqual(mockConfig);
    expect(modelConfigService.isLoaded).toBe(true);
    
    // Check that console log was called
    expect(console.log).toHaveBeenCalledWith('Model configuration loaded:', mockConfig);
  });

  it('uses fallback config when API request fails', async () => {
    // Mock a failed API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });
    
    // Load the config
    const config = await modelConfigService.loadConfig();
    
    // Check that fetch was called
    expect(global.fetch).toHaveBeenCalledWith('/api/chat/config');
    
    // Check that error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Check that alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      'Failed to load model configuration. Using defaults.',
      'error',
      5000
    );
    
    // Check that fallback config was set
    expect(modelConfigService.isLoaded).toBe(true);
    expect(config).toBe(modelConfigService.config);
    expect(config.providers.available).toContain('openai');
    expect(config.providers.available).toContain('anthropic');
  });

  it('handles fetch throwing an error', async () => {
    // Mock fetch to throw an error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
    
    // Load the config
    const config = await modelConfigService.loadConfig();
    
    // Check that error was logged
    expect(console.error).toHaveBeenCalled();
    
    // Check that alert was shown
    expect(alertService.showAlert).toHaveBeenCalledWith(
      'Failed to load model configuration. Using defaults.',
      'error',
      5000
    );
    
    // Check that fallback config was set
    expect(modelConfigService.isLoaded).toBe(true);
    expect(config).toBe(modelConfigService.config);
  });

  it('reuses existing load promise when multiple requests are made', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({})
    });
    
    // Create two concurrent requests
    const promise1 = modelConfigService.loadConfig();
    const promise2 = modelConfigService.loadConfig();
    
    // Wait for both to resolve
    await Promise.all([promise1, promise2]);
    
    // Check that fetch was only called once
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('getConfig loads config when not loaded yet', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({})
    });
    
    // Call getConfig when not loaded
    await modelConfigService.getConfig();
    
    // Check that loadConfig was called
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('getConfig returns cached config when already loaded', async () => {
    // Set the service as already loaded
    modelConfigService.isLoaded = true;
    modelConfigService.config = { test: 'value' };
    
    // Mock fetch to ensure it's not called
    global.fetch = vi.fn();
    
    // Call getConfig
    const config = await modelConfigService.getConfig();
    
    // Check that fetch was not called
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Check that the cached config was returned
    expect(config).toEqual({ test: 'value' });
  });

  it('provider helper methods work correctly', async () => {
    // Set the service as already loaded with test data
    modelConfigService.isLoaded = true;
    modelConfigService.config = {
      providers: {
        available: ['openai', 'anthropic'],
        default: 'openai',
        displayNames: {
          openai: 'OpenAI',
          anthropic: 'Anthropic'
        }
      },
      models: {}
    };
    
    // Test the provider helper methods
    const availableProviders = await modelConfigService.getAvailableProviders();
    expect(availableProviders).toEqual(['openai', 'anthropic']);
    
    const defaultProvider = await modelConfigService.getDefaultProvider();
    expect(defaultProvider).toBe('openai');
    
    const displayName = await modelConfigService.getProviderDisplayName('openai');
    expect(displayName).toBe('OpenAI');
    
    // Test with unknown provider
    const unknownDisplayName = await modelConfigService.getProviderDisplayName('unknown');
    expect(unknownDisplayName).toBe('unknown');
  });

  it('model helper methods work correctly', async () => {
    // Set the service as already loaded with test data
    modelConfigService.isLoaded = true;
    modelConfigService.config = {
      providers: {
        available: ['openai'],
        default: 'openai',
        displayNames: { openai: 'OpenAI' }
      },
      models: {
        openai: {
          available: ['gpt-3.5-turbo', 'gpt-4'],
          default: 'gpt-3.5-turbo',
          displayNames: {
            'gpt-3.5-turbo': 'GPT-3.5 Turbo',
            'gpt-4': 'GPT-4'
          }
        }
      }
    };
    
    // Test the model helper methods
    const availableModels = await modelConfigService.getAvailableModels('openai');
    expect(availableModels).toEqual(['gpt-3.5-turbo', 'gpt-4']);
    
    const defaultModel = await modelConfigService.getDefaultModel('openai');
    expect(defaultModel).toBe('gpt-3.5-turbo');
    
    const displayName = await modelConfigService.getModelDisplayName('openai', 'gpt-3.5-turbo');
    expect(displayName).toBe('GPT-3.5 Turbo');
    
    // Test with unknown provider
    const unknownProviderModels = await modelConfigService.getAvailableModels('unknown');
    expect(unknownProviderModels).toEqual([]);
    
    const unknownProviderDefault = await modelConfigService.getDefaultModel('unknown');
    expect(unknownProviderDefault).toBe('');
    
    // Test with unknown model
    const unknownModelDisplay = await modelConfigService.getModelDisplayName('openai', 'unknown-model');
    expect(unknownModelDisplay).toBe('unknown-model');
  });
});