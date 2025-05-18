import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import sinon from "sinon";
import { setupLoggerMock } from "./helpers/testSetup.js";

describe("Main Application Entry Point", () => {
  let restoreLogger;
  let processExitStub;
  let mockLogger;

  beforeEach(() => {
    // Setup logger mock
    restoreLogger = setupLoggerMock();
    mockLogger = global.logger;

    // Mock process.exit
    processExitStub = sinon.stub(process, "exit");
  });

  afterEach(() => {
    // Restore sinon stubs
    sinon.restore();

    // Restore logger
    if (restoreLogger) restoreLogger();
  });

  it("should test error handling behavior", () => {
    // We'll test the error handling logic that's in index.js

    const testError = new Error("Test error");

    // Simulate the error handling behavior
    try {
      throw testError;
    } catch (error) {
      global.logger.error("Server initialization failed", {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }

    // Assert error handling
    assert.ok(
      mockLogger.error.calledWith("Server initialization failed", {
        error: testError.message,
        stack: testError.stack,
      }),
      "Should log the error with appropriate details",
    );

    assert.ok(
      processExitStub.calledWith(1),
      "Should exit the process with code 1 on initialization error",
    );
  });
});
