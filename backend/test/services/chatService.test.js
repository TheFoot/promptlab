import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import ChatModelFactory from '../../src/services/chatService.js';
import config from '../../src/config/index.js';
import { setupLoggerMock, restoreAllSinon } from '../helpers/testSetup.js';

describe('Chat Service', async () => {
  let restoreLogger;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
  });

  after(() => {
    // Restore original logger
    restoreLogger();
  });

  afterEach(() => {
    // Restore all stubs
    restoreAllSinon();
  });

  describe('ChatModelFactory', async () => {
    it('should create an instance of a chat model', () => {
      // Act
      const model = ChatModelFactory.createModel('openai');
      
      // Assert
      assert.ok(model);
      assert.strictEqual(typeof model.chat, 'function');
      assert.strictEqual(typeof model.streamChat, 'function');
    });

    it('should support multiple providers', () => {
      // Create models for different providers
      const openaiModel = ChatModelFactory.createModel('openai');
      const anthropicModel = ChatModelFactory.createModel('anthropic');
      
      // Assert they're different instances
      assert.ok(openaiModel !== anthropicModel);
    });

    it('should provide helper methods for provider information', () => {
      // Test getAvailableProviders
      const providers = ChatModelFactory.getAvailableProviders();
      assert.ok(Array.isArray(providers));
      assert.ok(providers.includes('openai'));
      assert.ok(providers.includes('anthropic'));
      
      // Test getAvailableModels
      const openaiModels = ChatModelFactory.getAvailableModels('openai');
      assert.ok(Array.isArray(openaiModels));
      assert.ok(openaiModels.length > 0);
      
      // Test getProviderDisplayName
      const openaiName = ChatModelFactory.getProviderDisplayName('openai');
      assert.strictEqual(openaiName, 'OpenAI');
      
      // Test getModelDisplayName
      const modelName = ChatModelFactory.getModelDisplayName('openai', 'gpt-4');
      assert.strictEqual(modelName, 'GPT-4');
    });
  });
});