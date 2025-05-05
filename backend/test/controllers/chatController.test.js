import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import chatController from '../../src/controllers/chatController.js';
import ChatModelFactory from '../../src/services/chatService.js';
import config from '../../src/config/index.js';
import {
  mockExpressReqRes,
  setupLoggerMock,
  restoreAllSinon,
} from '../helpers/testSetup.js';

describe('Chat Controller', async () => {
  let restoreLogger;
  let chatModelStub;
  let mockChatModel;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
  });

  after(() => {
    // Restore original logger
    restoreLogger();
  });

  beforeEach(() => {
    // Create mock chat model with all required methods
    mockChatModel = {
      chat: sinon.stub(),
      streamChat: sinon.stub(),
    };

    // Set up default mock behaviors
    mockChatModel.chat.resolves({
      message: 'This is a mock response',
      usage: { total_tokens: 100 },
    });

    // Setup streamChat to call the callback and resolve
    mockChatModel.streamChat.callsFake(async (messages, callback, options) => {
      callback('This is a mock stream response');
      return { message: 'This is a mock stream response' };
    });

    // Create stub for ChatModelFactory
    chatModelStub = sinon
        .stub(ChatModelFactory, 'createModel')
        .returns(mockChatModel);
  });

  afterEach(() => {
    // Restore all stubs
    restoreAllSinon();
  });

  describe('sendMessage', async () => {
    it('should process valid chat requests successfully', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'openai',
          model: 'gpt-4',
          temperature: 0.7,
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(chatModelStub.calledWith('openai'), true);
      assert.equal(mockChatModel.chat.calledOnce, true);
      assert.equal(res.json.calledOnce, true);

      // Check that chat was called with correct parameters
      const chatArgs = mockChatModel.chat.firstCall.args;
      assert.deepEqual(chatArgs[0], [{ role: 'user', content: 'Hello' }]);
      assert.deepEqual(chatArgs[1], { model: 'gpt-4', temperature: 0.7 });
    });

    it('should use default provider when not specified', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
          // No provider specified
          model: 'gpt-4',
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(chatModelStub.calledWith(config.providers.default), true);
      assert.equal(mockChatModel.chat.calledOnce, true);
      assert.equal(res.json.calledOnce, true);
    });

    it('should return 400 when messages are missing', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          // Missing messages
          provider: 'openai',
          model: 'gpt-4',
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(res.status.calledWith(400), true);
      assert.equal(res.json.calledOnce, true);
      assert.deepEqual(res.json.firstCall.args[0], {
        error: 'Messages are required and must be an array',
      });
    });

    it('should return 400 when messages is not an array', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          messages: 'This is not an array',
          provider: 'openai',
          model: 'gpt-4',
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(res.status.calledWith(400), true);
      assert.equal(res.json.calledOnce, true);
      assert.deepEqual(res.json.firstCall.args[0], {
        error: 'Messages are required and must be an array',
      });
    });

    it('should handle errors from the chat model', async () => {
      // Arrange
      const error = new Error('API error');
      mockChatModel.chat.rejects(error);

      const { req, res } = mockExpressReqRes({
        body: {
          messages: [{ role: 'user', content: 'Hello' }],
          provider: 'openai',
          model: 'gpt-4',
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(res.status.calledWith(500), true);
      assert.equal(res.json.calledOnce, true);
      assert.deepEqual(res.json.firstCall.args[0], {
        error: 'Failed to process chat request',
        message: error.message,
      });
    });
  });

  describe('handleWebSocket', async () => {
    it('should handle WebSocket messages with streaming', async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'user-agent': 'test-agent' },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      // Act
      chatController.handleWebSocket(ws, req);

      // Verify initial connection message was sent
      assert.equal(ws.send.calledOnce, true);
      assert.equal(JSON.parse(ws.send.firstCall.args[0]).type, 'info');

      // Simulate receiving a message
      const message = JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        temperature: 0.5,
        stream: true,
      });

      await messageHandler(message);

      // Assert
      assert.equal(chatModelStub.calledWith('anthropic'), true);
      assert.equal(mockChatModel.streamChat.calledOnce, true);

      // Check messages that were sent to the client
      // First, start message
      assert.equal(ws.send.callCount, 4); // info, start, stream content, end
      assert.equal(JSON.parse(ws.send.secondCall.args[0]).type, 'start');

      // Then content
      assert.equal(JSON.parse(ws.send.thirdCall.args[0]).type, 'stream');
      assert.equal(
          JSON.parse(ws.send.thirdCall.args[0]).content,
          'This is a mock stream response',
      );

      // Finally end message
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, 'end');
    });

    it('should handle WebSocket messages without streaming', async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'user-agent': 'test-agent' },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      // Act
      chatController.handleWebSocket(ws, req);

      // Simulate receiving a message with stream: false
      const message = JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        provider: 'openai',
        model: 'gpt-4',
        stream: false,
      });

      await messageHandler(message);

      // Assert
      assert.equal(chatModelStub.calledWith('openai'), true);
      assert.equal(mockChatModel.chat.calledOnce, true);

      // Check messages that were sent to the client
      // First, start message (initial info + start)
      assert.equal(ws.send.callCount, 4);

      // Then content
      assert.equal(JSON.parse(ws.send.getCall(2).args[0]).type, 'stream');

      // Finally end message
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, 'end');
    });

    it('should handle validation errors in WebSocket messages', async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'user-agent': 'test-agent' },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      // Act
      chatController.handleWebSocket(ws, req);

      // Simulate receiving an invalid message (missing messages array)
      const message = JSON.stringify({
        provider: 'openai',
        model: 'gpt-4',
      });

      await messageHandler(message);

      // Assert - should send error message
      assert.equal(ws.send.callCount, 2); // info + error
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, 'error');
      assert.equal(
          JSON.parse(ws.send.lastCall.args[0]).error,
          'Messages are required and must be an array',
      );
    });

    it('should handle errors from chat model in WebSocket', async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: '127.0.0.1' },
        headers: { 'user-agent': 'test-agent' },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === 'message') {
          messageHandler = handler;
        }
      });

      // Set up chat model to throw an error
      const error = new Error('API error');
      mockChatModel.streamChat.rejects(error);

      // Act
      chatController.handleWebSocket(ws, req);

      // Simulate receiving a message
      const message = JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        provider: 'openai',
        model: 'gpt-4',
        stream: true,
      });

      await messageHandler(message);

      // Assert - should send error message
      assert.equal(ws.send.callCount, 3); // info + start + error
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, 'error');
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).error, 'API error');
    });
  });

  describe('getProviderConfig', async () => {
    it('should return provider configuration for the frontend', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes();

      // Act
      await chatController.getProviderConfig(req, res);

      // Assert
      assert.equal(res.json.calledOnce, true);

      const returnedConfig = res.json.firstCall.args[0];

      // Check structure of returned config
      assert.ok(returnedConfig.providers);
      assert.ok(returnedConfig.providers.available);
      assert.ok(returnedConfig.providers.default);
      assert.ok(returnedConfig.providers.displayNames);
      assert.ok(returnedConfig.models);
    });

    it('should include model configurations for each provider', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes();

      // Act
      await chatController.getProviderConfig(req, res);

      // Assert
      const returnedConfig = res.json.firstCall.args[0];

      // Check that models are included for each provider
      config.providers.available.forEach((provider) => {
        assert.ok(returnedConfig.models[provider]);
        assert.ok(returnedConfig.models[provider].available);
        assert.ok(returnedConfig.models[provider].default);
        assert.ok(returnedConfig.models[provider].displayNames);
      });
    });

    it('should handle errors properly', async () => {
      // Arrange
      const { req, res } = mockExpressReqRes();

      // Force an error by making providers unavailable
      const originalProviders = config.providers;
      config.providers = null;

      // Act
      await chatController.getProviderConfig(req, res);

      // Assert
      assert.equal(res.status.calledWith(500), true);
      assert.equal(res.json.calledOnce, true);
      assert.ok(res.json.firstCall.args[0].error);

      // Restore config
      config.providers = originalProviders;
    });
  });
});
