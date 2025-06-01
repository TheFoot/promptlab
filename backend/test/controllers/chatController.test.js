import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import sinon from "sinon";

import chatController from "../../src/controllers/chatController.js";
import AgentChatService from "../../src/services/agentChatService.js";
import config from "../../src/config/index.js";
import {
  mockExpressReqRes,
  setupLoggerMock,
  restoreAllSinon,
} from "../helpers/testSetup.js";

describe("Chat Controller", async () => {
  let restoreLogger;
  let agentChatServiceStub;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
  });

  after(() => {
    // Restore original logger
    restoreLogger();
  });

  beforeEach(() => {
    // Create stub for AgentChatService
    agentChatServiceStub = sinon.stub(AgentChatService, "processChat").resolves({
      message: "This is a mock agent response",
      usage: { total_tokens: 100 },
      agentType: "chat",
      agentMetadata: { type: "chat", name: "ChatAgent" },
    });

    // Create stub for streaming version
    sinon.stub(AgentChatService, "processStreamingChat").callsFake(async (params, onChunk) => {
      onChunk("This is a mock stream response");
      return {
        message: "This is a mock stream response",
        usage: { total_tokens: 100 },
        agentType: params.agentType || "chat",
        agentMetadata: { type: "chat", name: "ChatAgent" },
      };
    });
  });

  afterEach(() => {
    // Restore all stubs
    restoreAllSinon();
  });

  describe("sendMessage", async () => {
    it("should process valid chat requests successfully", async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          messages: [{ role: "user", content: "Hello" }],
          provider: "openai",
          model: "gpt-4",
          temperature: 0.7,
          agentType: "chat",
          promptContent: "You are a helpful assistant.",
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(agentChatServiceStub.calledOnce, true);
      assert.equal(res.json.calledOnce, true);

      // Check that AgentChatService was called with correct parameters
      const chatArgs = agentChatServiceStub.firstCall.args[0];
      assert.deepEqual(chatArgs.messages, [{ role: "user", content: "Hello" }]);
      assert.equal(chatArgs.provider, "openai");
      assert.equal(chatArgs.model, "gpt-4");
      assert.equal(chatArgs.temperature, 0.7);
      assert.equal(chatArgs.agentType, "chat");
      assert.equal(chatArgs.promptContent, "You are a helpful assistant.");
    });

    it("should use default provider when not specified", async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          messages: [{ role: "user", content: "Hello" }],
          // No provider specified
          model: "gpt-4",
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(agentChatServiceStub.calledOnce, true);
      assert.equal(res.json.calledOnce, true);

      // Check that default provider was used
      const chatArgs = agentChatServiceStub.firstCall.args[0];
      assert.equal(chatArgs.provider, config.providers.default);
    });

    it("should return 400 when messages are missing", async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          // Missing messages
          provider: "openai",
          model: "gpt-4",
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(res.status.calledWith(400), true);
      assert.equal(res.json.calledOnce, true);
      assert.deepEqual(res.json.firstCall.args[0], {
        error: "Messages are required and must be an array",
      });
    });

    it("should return 400 when messages is not an array", async () => {
      // Arrange
      const { req, res } = mockExpressReqRes({
        body: {
          messages: "This is not an array",
          provider: "openai",
          model: "gpt-4",
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(res.status.calledWith(400), true);
      assert.equal(res.json.calledOnce, true);
      assert.deepEqual(res.json.firstCall.args[0], {
        error: "Messages are required and must be an array",
      });
    });

    it("should handle errors from the chat model", async () => {
      // Arrange
      const error = new Error("API error");
      agentChatServiceStub.rejects(error);

      const { req, res } = mockExpressReqRes({
        body: {
          messages: [{ role: "user", content: "Hello" }],
          provider: "openai",
          model: "gpt-4",
        },
      });

      // Act
      await chatController.sendMessage(req, res);

      // Assert
      assert.equal(res.status.calledWith(500), true);
      assert.equal(res.json.calledOnce, true);
      assert.deepEqual(res.json.firstCall.args[0], {
        error: "Failed to process chat request",
        message: error.message,
      });
    });
  });

  describe("handleWebSocket", async () => {
    it("should handle WebSocket messages with streaming", async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: "127.0.0.1" },
        headers: { "user-agent": "test-agent" },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      // Act
      chatController.handleWebSocket(ws, req);

      // Verify initial connection message was sent
      assert.equal(ws.send.calledOnce, true);
      assert.equal(JSON.parse(ws.send.firstCall.args[0]).type, "info");

      // Simulate receiving a message
      const message = JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        provider: "anthropic",
        model: "claude-sonnet-4-20250514",
        temperature: 0.5,
        stream: true,
        agentType: "chat",
      });

      await messageHandler(message);

      // Assert - Check that AgentChatService.processStreamingChat was called
      assert.equal(AgentChatService.processStreamingChat.calledOnce, true);

      // Check messages that were sent to the client
      // info, start, stream content, end
      assert.equal(ws.send.callCount, 4);
      assert.equal(JSON.parse(ws.send.secondCall.args[0]).type, "start");

      // Then content
      assert.equal(JSON.parse(ws.send.thirdCall.args[0]).type, "stream");
      assert.equal(
        JSON.parse(ws.send.thirdCall.args[0]).content,
        "This is a mock stream response",
      );

      // Finally end message
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, "end");
    });

    it("should handle WebSocket messages without streaming", async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: "127.0.0.1" },
        headers: { "user-agent": "test-agent" },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      // Act
      chatController.handleWebSocket(ws, req);

      // Simulate receiving a message with stream: false
      const message = JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        provider: "openai",
        model: "gpt-4",
        stream: false,
      });

      await messageHandler(message);

      // Assert - Check that AgentChatService.processChat was called
      assert.equal(AgentChatService.processChat.calledOnce, true);

      // Check messages that were sent to the client
      // First, start message (initial info + start)
      assert.equal(ws.send.callCount, 4);

      // Then content
      assert.equal(JSON.parse(ws.send.getCall(2).args[0]).type, "stream");

      // Finally end message
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, "end");
    });

    it("should handle validation errors in WebSocket messages", async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: "127.0.0.1" },
        headers: { "user-agent": "test-agent" },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      // Act
      chatController.handleWebSocket(ws, req);

      // Simulate receiving an invalid message (missing messages array)
      const message = JSON.stringify({
        provider: "openai",
        model: "gpt-4",
      });

      await messageHandler(message);

      // Assert - should send error message
      assert.equal(ws.send.callCount, 2); // info + error
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, "error");
      assert.equal(
        JSON.parse(ws.send.lastCall.args[0]).error,
        "Messages are required and must be an array",
      );
    });

    it("should handle errors from chat model in WebSocket", async () => {
      // Arrange
      const ws = {
        on: sinon.stub(),
        send: sinon.stub(),
      };

      const req = {
        socket: { remoteAddress: "127.0.0.1" },
        headers: { "user-agent": "test-agent" },
      };

      // Set up message handler
      let messageHandler;
      ws.on.callsFake((event, handler) => {
        if (event === "message") {
          messageHandler = handler;
        }
      });

      // Set up AgentChatService to throw an error
      const error = new Error("API error");
      AgentChatService.processStreamingChat.rejects(error);

      // Act
      chatController.handleWebSocket(ws, req);

      // Simulate receiving a message
      const message = JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
        provider: "openai",
        model: "gpt-4",
        stream: true,
      });

      await messageHandler(message);

      // Assert - should send error message
      assert.equal(ws.send.callCount, 3); // info + start + error
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).type, "error");
      assert.equal(JSON.parse(ws.send.lastCall.args[0]).error, "API error");
    });
  });

  describe("getProviderConfig", async () => {
    it("should return provider configuration for the frontend", async () => {
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

    it("should include model configurations for each provider", async () => {
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

    it("should handle errors properly", async () => {
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
