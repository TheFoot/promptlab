import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import sinon from "sinon";
import mongoose from "mongoose";

// Import the module we're testing
import * as serverModule from "../src/server.js";

// Import dependencies we need to mock
import config from "../src/config/index.js";

// Import helpers
import { setupLoggerMock } from "./helpers/testSetup.js";

describe("Server Module Additional Tests", () => {
  let restoreLogger;
  let mongooseConnectStub;

  beforeEach(() => {
    // Setup logger mock before each test
    restoreLogger = setupLoggerMock();

    // Stub mongoose connect
    mongooseConnectStub = sinon.stub(mongoose, "connect").resolves();
  });

  afterEach(() => {
    // Restore sinon stubs after each test
    sinon.restore();

    // Restore logger
    if (restoreLogger) restoreLogger();
  });

  describe("initializeApp", () => {
    it("should attempt fallback MongoDB connection on failure", async () => {
      // Arrange
      const dbError = new Error("Connection failed");
      mongooseConnectStub.onFirstCall().rejects(dbError);
      mongooseConnectStub.onSecondCall().resolves();

      // Mock config with docker URI
      const originalMongodbUri = config.mongodbUri;
      Object.defineProperty(config, "mongodbUri", {
        value: "mongodb://nonexistent:27017/test",
        configurable: true,
      });

      try {
        // Act
        await serverModule.initializeApp();

        // Assert
        assert.strictEqual(
          mongooseConnectStub.callCount,
          2,
          "MongoDB connection should be attempted twice",
        );

        const mockLogger = global.logger;
        assert.ok(
          mockLogger.error.calledWith("Failed to connect to MongoDB"),
          "Error should be logged",
        );
        assert.ok(
          mockLogger.info.calledWith("Trying fallback connection"),
          "Fallback should be logged",
        );
        assert.ok(
          mockLogger.info.calledWith("MongoDB connected via fallback"),
          "Fallback success should be logged",
        );
      } finally {
        // Restore config
        Object.defineProperty(config, "mongodbUri", {
          value: originalMongodbUri,
          configurable: true,
        });
      }
    });

    it("should throw if MongoDB connection ultimately fails", async () => {
      // Arrange
      const dbError = new Error("Connection failed");
      mongooseConnectStub.rejects(dbError);

      // Store original config value
      const originalMongodbUri = config.mongodbUri;

      // Mock config with a localhost URI (not Docker)
      Object.defineProperty(config, "mongodbUri", {
        value: "mongodb://localhost:27017/test",
        configurable: true,
      });

      try {
        // Act & Assert
        await assert.rejects(
          async () => await serverModule.initializeApp(),
          (err) => {
            assert.strictEqual(err, dbError, "Should throw the original error");
            return true;
          },
        );
      } finally {
        // Restore config
        Object.defineProperty(config, "mongodbUri", {
          value: originalMongodbUri,
          configurable: true,
        });
      }
    });
  });

  describe("setupStaticFileServing", () => {
    it("should not serve static files in development mode", async () => {
      // Arrange
      const mockApp = {
        use: sinon.stub(),
        get: sinon.stub(),
      };

      // Mock config
      const originalIsProd = config.isProd;
      Object.defineProperty(config, "isProd", {
        value: false,
        configurable: true,
      });

      try {
        // Act
        await serverModule.setupStaticFileServing(mockApp);

        // Assert
        assert.ok(!mockApp.use.called, "Should not set up static file serving");
        assert.ok(!mockApp.get.called, "Should not set up wildcard handler");
      } finally {
        // Restore config
        Object.defineProperty(config, "isProd", {
          value: originalIsProd,
          configurable: true,
        });
      }
    });
  });
});
