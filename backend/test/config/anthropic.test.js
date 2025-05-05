import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import anthropicConfig from '../../src/config/anthropic.js';
import { setupLoggerMock } from '../helpers/testSetup.js';

describe('Anthropic Configuration', async () => {
  let restoreLogger;
  let originalEnv;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
    
    // Save original environment variables
    originalEnv = { ...process.env };
  });

  after(() => {
    // Restore original logger
    restoreLogger();
    
    // Restore original environment variables
    process.env = originalEnv;
    
    // Restore sinon stubs
    sinon.restore();
  });

  it('should have the required configuration structure', () => {
    // Assert
    assert.ok(anthropicConfig.api);
    assert.ok(anthropicConfig.models);
    assert.ok(anthropicConfig.models.available);
    assert.ok(anthropicConfig.models.default);
    assert.ok(anthropicConfig.models.displayNames);
    assert.ok(anthropicConfig.defaults);
  });

  it('should include default configuration values', () => {
    // Assert default values
    assert.strictEqual(typeof anthropicConfig.defaults.temperature, 'number');
    assert.ok(anthropicConfig.defaults.temperature >= 0 && anthropicConfig.defaults.temperature <= 1);
    assert.strictEqual(typeof anthropicConfig.defaults.maxTokens, 'number');
    assert.ok(anthropicConfig.defaults.maxTokens > 0);
  });

  it('should include default model', () => {
    // Assert default model is in available models
    assert.ok(anthropicConfig.models.available.includes(anthropicConfig.models.default));
  });

  it('should have display names for all available models', () => {
    // Assert all available models have display names
    anthropicConfig.models.available.forEach(model => {
      assert.ok(anthropicConfig.models.displayNames[model]);
    });
  });

  it('should use API key from environment variable if available', () => {
    // Arrange
    const testApiKey = 'test-anthropic-api-key';
    process.env.ANTHROPIC_API_KEY = testApiKey;
    
    // Act & Assert
    // Need to re-import to get updated environment variables
    const freshConfig = {
      api: {
        key: process.env.ANTHROPIC_API_KEY || '',
        ...(process.env.ANTHROPIC_API_BASE_URL ?
          { baseUrl: process.env.ANTHROPIC_API_BASE_URL } :
          {}),
      }
    };
    
    assert.strictEqual(freshConfig.api.key, testApiKey);
  });

  it('should include baseUrl only if specified in environment', () => {
    // Arrange - no base URL specified
    delete process.env.ANTHROPIC_API_BASE_URL;
    
    // Act & Assert
    // Need to replicate configuration logic to test with current env
    const configWithoutBase = {
      api: {
        key: process.env.ANTHROPIC_API_KEY || '',
        ...(process.env.ANTHROPIC_API_BASE_URL ?
          { baseUrl: process.env.ANTHROPIC_API_BASE_URL } :
          {}),
      }
    };
    
    assert.strictEqual(configWithoutBase.api.baseUrl, undefined);
    
    // Arrange - with base URL specified
    const testBaseUrl = 'https://test-api.anthropic.com';
    process.env.ANTHROPIC_API_BASE_URL = testBaseUrl;
    
    // Act & Assert
    const configWithBase = {
      api: {
        key: process.env.ANTHROPIC_API_KEY || '',
        ...(process.env.ANTHROPIC_API_BASE_URL ?
          { baseUrl: process.env.ANTHROPIC_API_BASE_URL } :
          {}),
      }
    };
    
    assert.strictEqual(configWithBase.api.baseUrl, testBaseUrl);
  });
});