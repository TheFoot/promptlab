import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import ChatModelFactory from '../../src/services/chatService.js';
import config from '../../src/config/index.js';
import { setupLoggerMock, restoreAllSinon } from '../helpers/testSetup.js';

describe('Chat Service Mocked Functions', async () => {
  let restoreLogger;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
  });

  after(() => {
    // Restore original logger
    restoreLogger();
  });

  describe('ChatModelFactory Helper Functions', () => {
    it('should provide helper methods to get provider information', () => {
      // Test getAvailableProviders
      const providers = ChatModelFactory.getAvailableProviders();
      assert.ok(Array.isArray(providers));
      assert.ok(providers.includes('openai'));
      assert.ok(providers.includes('anthropic'));
      
      // Test getProviderDisplayName
      const openaiName = ChatModelFactory.getProviderDisplayName('openai');
      assert.strictEqual(openaiName, 'OpenAI');
      
      // Test getModelDisplayName
      const modelName = ChatModelFactory.getModelDisplayName('openai', 'gpt-4');
      assert.strictEqual(modelName, 'GPT-4');
    });
  });
});