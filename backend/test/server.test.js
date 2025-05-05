import { describe, it, before, after, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import sinon from "sinon";
import { WebSocketServer } from "ws";

// Import the module we're testing
import * as serverModule from "../src/server.js";

// Import dependencies we need to mock
import config from "../src/config/index.js";

// Import helpers
import { setupLoggerMock } from "./helpers/testSetup.js";

describe("Server Module", () => {
  let restoreLogger;
  let processOnStub;
  let originalProcessOn;

  before(() => {
    // Store original process.on to restore later
    originalProcessOn = process.on;

    // Replace with stub
    processOnStub = sinon.stub();
    process.on = processOnStub;
  });

  beforeEach(() => {
    // Setup logger mock before each test
    restoreLogger = setupLoggerMock();
  });

  afterEach(() => {
    // Restore sinon stubs after each test
    sinon.restore();

    // Restore logger
    if (restoreLogger) restoreLogger();
  });

  after(() => {
    // Restore original process.on
    process.on = originalProcessOn;
  });

  describe("setupExceptionHandlers", () => {
    it("should register uncaught exception handler", () => {
      serverModule.setupExceptionHandlers();

      assert.ok(
        processOnStub.calledWith("uncaughtException", sinon.match.func),
        "Should register uncaughtException handler",
      );
    });

    it("should register unhandled rejection handler", () => {
      serverModule.setupExceptionHandlers();

      assert.ok(
        processOnStub.calledWith("unhandledRejection", sinon.match.func),
        "Should register unhandledRejection handler",
      );
    });

    it("should log fatal error when uncaught exception occurs", () => {
      // Setup
      serverModule.setupExceptionHandlers();
      const uncaughtHandler =
        processOnStub.withArgs("uncaughtException").args[0][1];
      const consoleErrorStub = sinon.stub(console, "error");
      const mockError = new Error("Test error");

      // Create mock logger
      const mockLogger = {
        fatal: sinon.stub(),
      };
      global.logger = mockLogger;

      // Execute
      uncaughtHandler(mockError);

      // Verify
      assert.ok(consoleErrorStub.calledTwice, "Should log to console twice");
      assert.ok(
        mockLogger.fatal.calledOnce,
        "Should log fatal error to logger",
      );
      assert.ok(
        mockLogger.fatal.calledWith("Uncaught exception", sinon.match.object),
        "Should log with correct message and error object",
      );

      // Clean up
      delete global.logger;
    });

    it("should log error when unhandled rejection occurs", () => {
      // Setup
      serverModule.setupExceptionHandlers();
      const rejectionHandler =
        processOnStub.withArgs("unhandledRejection").args[0][1];
      const consoleErrorStub = sinon.stub(console, "error");
      const mockError = new Error("Test rejection");

      // Create mock logger
      const mockLogger = {
        error: sinon.stub(),
      };
      global.logger = mockLogger;

      // Execute
      rejectionHandler(mockError);

      // Verify
      assert.ok(consoleErrorStub.calledOnce, "Should log to console once");
      assert.ok(mockLogger.error.calledOnce, "Should log error to logger");
      assert.ok(
        mockLogger.error.calledWith(
          "Unhandled promise rejection",
          sinon.match.object,
        ),
        "Should log with correct message and reason object",
      );

      // Clean up
      delete global.logger;
    });

    it("should handle non-Error rejection reasons correctly", () => {
      // Setup
      serverModule.setupExceptionHandlers();
      const rejectionHandler =
        processOnStub.withArgs("unhandledRejection").args[0][1];
      const consoleErrorStub = sinon.stub(console, "error");

      // Test with an object
      const nonErrorReason = { message: "Not an Error object" };

      // Create mock logger
      const mockLogger = {
        error: sinon.stub(),
      };
      global.logger = mockLogger;

      // Execute
      rejectionHandler(nonErrorReason);

      // Verify
      assert.ok(consoleErrorStub.calledOnce, "Should log to console once");
      assert.ok(mockLogger.error.calledOnce, "Should log error to logger");
      assert.ok(
        mockLogger.error.calledWith(
          "Unhandled promise rejection",
          sinon.match.object,
        ),
        "Should log with correct message and reason object",
      );

      // Verify the stack trace was set correctly
      const errorInfo = mockLogger.error.firstCall.args[1];
      assert.strictEqual(
        errorInfo.stack,
        "No stack trace available",
        "Should set correct stack trace for non-Error rejection",
      );

      // Clean up
      delete global.logger;
    });
  });

  // Additional tests for error handling in startServer
  describe("startServer", () => {
    it("should handle server startup correctly", async () => {
      const mockServer = {
        listen: sinon.stub().callsFake((port, callback) => {
          callback();
          return mockServer;
        }),
      };

      const mockLogger = {
        info: sinon.stub(),
      };
      global.logger = mockLogger;

      // Mock config
      sinon.stub(config, "port").value(3000);
      sinon.stub(config, "nodeEnv").value("test");

      const result = await serverModule.startServer(mockServer);

      assert.strictEqual(result, mockServer);
      assert.ok(mockServer.listen.calledOnce);
      assert.ok(
        mockLogger.info.calledWith("Server started"),
        "Should log server start",
      );

      delete global.logger;
    });

    it("should log WebSocket server URL", async () => {
      const mockServer = {
        listen: sinon.stub().callsFake((port, callback) => {
          callback();
          return mockServer;
        }),
      };

      const mockLogger = {
        info: sinon.stub(),
      };
      global.logger = mockLogger;

      // Mock config
      sinon.stub(config, "port").value(3000);

      await serverModule.startServer(mockServer);

      const wsLogCall = mockLogger.info
        .getCalls()
        .find((call) => call.args[0] === "WebSocket server available");
      assert.ok(wsLogCall, "Should log WebSocket server availability");

      delete global.logger;
    });
  });

  // Note: We're not testing setupWebSocketServer with unit tests
  // because mocking the WebSocketServer constructor is challenging
  // Instead, we rely on integration tests and manual testing for this functionality
});
