import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import chatController from '../../src/controllers/chatController.js';
import ChatModelFactory from '../../src/services/chatService.js';
import { setupLoggerMock } from '../helpers/testSetup.js';

describe('WebSocket Chat Controller', async () => {
  let restoreLogger;
  let chatModelStub;
  let mockChatModel;
  let ws;
  let req;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();

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

    // Create a WebSocket mock
    ws = {
      on: sinon.stub(),
      send: sinon.stub(),
      close: sinon.stub(),
    };

    // Create a request mock
    req = {
      socket: { remoteAddress: '127.0.0.1' },
      headers: { 'user-agent': 'test-agent' },
    };
  });

  after(() => {
    // Restore original logger
    restoreLogger();

    // Restore all stubs
    sinon.restore();
  });

  it('should handle WebSocket connection cleanup on close event', async () => {
    // Arrange
    let closeHandler;
    ws.on.callsFake((event, handler) => {
      if (event === 'close') {
        closeHandler = handler;
      }
    });

    // Act
    chatController.handleWebSocket(ws, req);

    // Assert that close handler was registered
    assert.ok(closeHandler);

    // Simulate close event
    closeHandler();

    // Verify cleanup was handled properly
    assert.ok(global.logger.info.called);
    const logCall = global.logger.info
        .getCalls()
        .find((call) => call.args[0] === 'WebSocket connection closed');
    assert.ok(logCall);
  });

  it('should handle WebSocket errors', async () => {
    // Reset stubs
    ws.on.resetHistory();
    global.logger.error.resetHistory();

    // Arrange
    let errorHandler;
    ws.on.callsFake((event, handler) => {
      if (event === 'error') {
        errorHandler = handler;
      }
    });

    // Act
    chatController.handleWebSocket(ws, req);

    // Assert that error handler was registered
    assert.ok(errorHandler);

    // Simulate error event
    const testError = new Error('Test WebSocket error');
    errorHandler(testError);

    // Verify error was logged
    assert.ok(global.logger.error.called);
    const logCall = global.logger.error
        .getCalls()
        .find((call) => call.args[0] === 'WebSocket error');
    assert.ok(logCall);
    assert.strictEqual(logCall.args[1].error, 'Test WebSocket error');
  });

  it('should handle malformed JSON in WebSocket messages', async () => {
    // Reset stubs
    ws.on.resetHistory();
    ws.send.resetHistory();

    // Arrange
    let messageHandler;
    ws.on.callsFake((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    // Act
    chatController.handleWebSocket(ws, req);

    // Assert message handler was registered
    assert.ok(messageHandler);

    // Simulate receiving invalid JSON
    await messageHandler('this is not valid JSON');

    // Check that error was sent back to client
    assert.ok(ws.send.called);
    const lastCall = ws.send.lastCall.args[0];
    const response = JSON.parse(lastCall);
    assert.strictEqual(response.type, 'error');
    assert.ok(response.error.includes('Invalid JSON'));
  });

  it('should handle streaming responses with multiple chunks', async () => {
    // Reset stubs
    ws.on.resetHistory();
    ws.send.resetHistory();
    mockChatModel.streamChat.resetHistory();

    // Arrange
    let messageHandler;
    ws.on.callsFake((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    // Setup streaming response with multiple chunks
    const chunks = ['Chunk 1', 'Chunk 2', 'Chunk 3'];
    mockChatModel.streamChat.callsFake(async (messages, callback, options) => {
      chunks.forEach((chunk) => callback(chunk));
      return { message: chunks.join('') };
    });

    // Act
    chatController.handleWebSocket(ws, req);

    // Simulate receiving message that requests streaming
    const message = JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
      provider: 'openai',
      model: 'gpt-4',
      stream: true,
    });

    await messageHandler(message);

    // Assert
    assert.equal(mockChatModel.streamChat.calledOnce, true);

    // Verify all chunks were sent
    // First message is always the info message
    assert.equal(ws.send.callCount, chunks.length + 3); // info + start + chunks + end

    // Check content of each chunk message
    for (let i = 0; i < chunks.length; i++) {
      const chunkMessage = JSON.parse(ws.send.getCall(i + 2).args[0]);
      assert.equal(chunkMessage.type, 'stream');
      assert.equal(chunkMessage.content, chunks[i]);
    }

    // Verify end message was sent
    const endMessage = JSON.parse(ws.send.lastCall.args[0]);
    assert.equal(endMessage.type, 'end');
    assert.equal(endMessage.content, chunks.join(''));
  });

  it('should send error message when model is not available', async () => {
    // Reset stubs
    ws.on.resetHistory();
    ws.send.resetHistory();
    chatModelStub.resetHistory();

    // Arrange
    let messageHandler;
    ws.on.callsFake((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    // Force model creation to fail
    chatModelStub.throws(new Error('Model not available'));

    // Act
    chatController.handleWebSocket(ws, req);

    // Simulate receiving a message
    const message = JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
      provider: 'invalid-provider',
      model: 'invalid-model',
    });

    await messageHandler(message);

    // Assert error was sent to client
    const errorMessage = JSON.parse(ws.send.lastCall.args[0]);
    assert.equal(errorMessage.type, 'error');
    assert.ok(errorMessage.error.includes('Model not available'));

    // Reset stub for subsequent tests
    chatModelStub.reset();
    chatModelStub.returns(mockChatModel);
  });

  it('should handle messages without the stream option as non-streaming', async () => {
    // Reset stubs
    ws.on.resetHistory();
    ws.send.resetHistory();
    mockChatModel.chat.resetHistory();
    mockChatModel.streamChat.resetHistory();

    // Restore original chatModelStub behavior
    chatModelStub.resetBehavior();
    chatModelStub.returns(mockChatModel);

    // Arrange
    let messageHandler;
    ws.on.callsFake((event, handler) => {
      if (event === 'message') {
        messageHandler = handler;
      }
    });

    // Act
    chatController.handleWebSocket(ws, req);

    // Simulate receiving a message without stream option
    const message = JSON.stringify({
      messages: [{ role: 'user', content: 'Hello' }],
      provider: 'openai',
      model: 'gpt-4',
      // No stream option
    });

    await messageHandler(message);

    // Assert regular (non-streaming) chat was used
    assert.equal(mockChatModel.chat.calledOnce, true);
    assert.equal(mockChatModel.streamChat.called, false);
  });

  it('should explicitly set stream to false when requested', async () => {
    // Reset stubs
    ws.on.resetHistory();
    ws.send.resetHistory();
    mockChatModel.chat.resetHistory();
    mockChatModel.streamChat.resetHistory();

    // Arrange
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

    // Assert regular (non-streaming) chat was used
    assert.equal(mockChatModel.chat.calledOnce, true);
    assert.equal(mockChatModel.streamChat.called, false);
  });
});
