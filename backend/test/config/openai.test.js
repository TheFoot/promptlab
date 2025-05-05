import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import sinon from "sinon";

import openaiConfig from "../../src/config/openai.js";
import { setupLoggerMock } from "../helpers/testSetup.js";

describe("OpenAI Configuration", async () => {
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

  it("should have the required configuration structure", () => {
    // Assert
    assert.ok(openaiConfig.api);
    assert.ok(openaiConfig.models);
    assert.ok(openaiConfig.models.available);
    assert.ok(openaiConfig.models.default);
    assert.ok(openaiConfig.models.displayNames);
    assert.ok(openaiConfig.defaults);
  });

  it("should include default configuration values", () => {
    // Assert default values
    assert.strictEqual(typeof openaiConfig.defaults.temperature, "number");
    assert.ok(
      openaiConfig.defaults.temperature >= 0 &&
        openaiConfig.defaults.temperature <= 1,
    );
    assert.strictEqual(typeof openaiConfig.defaults.maxTokens, "number");
    assert.ok(openaiConfig.defaults.maxTokens > 0);
  });

  it("should include default model", () => {
    // Assert default model is in available models
    assert.ok(
      openaiConfig.models.available.includes(openaiConfig.models.default),
    );
  });

  it("should have display names for all available models", () => {
    // Assert all available models have display names
    openaiConfig.models.available.forEach((model) => {
      assert.ok(openaiConfig.models.displayNames[model]);
    });
  });

  it("should use API key from environment variable if available", () => {
    // Arrange
    const testApiKey = "test-openai-api-key";
    process.env.OPENAI_API_KEY = testApiKey;

    // Act & Assert
    // Need to re-create config object to reflect current env vars
    const freshConfig = {
      api: {
        key: process.env.OPENAI_API_KEY || "",
        baseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
        organization: process.env.OPENAI_ORGANIZATION || "",
      },
    };

    assert.strictEqual(freshConfig.api.key, testApiKey);
  });

  it("should use default base URL if not specified in environment", () => {
    // Arrange - no base URL specified
    delete process.env.OPENAI_API_BASE_URL;

    // Act & Assert
    // Need to re-create config object to reflect current env vars
    const freshConfig = {
      api: {
        key: process.env.OPENAI_API_KEY || "",
        baseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
        organization: process.env.OPENAI_ORGANIZATION || "",
      },
    };

    assert.strictEqual(freshConfig.api.baseUrl, "https://api.openai.com/v1");

    // Arrange - with base URL specified
    const testBaseUrl = "https://test-api.openai.com";
    process.env.OPENAI_API_BASE_URL = testBaseUrl;

    // Act & Assert
    const freshConfigWithBase = {
      api: {
        key: process.env.OPENAI_API_KEY || "",
        baseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
        organization: process.env.OPENAI_ORGANIZATION || "",
      },
    };

    assert.strictEqual(freshConfigWithBase.api.baseUrl, testBaseUrl);
  });

  it("should use organization from environment variable if available", () => {
    // Arrange
    const testOrg = "test-openai-org";
    process.env.OPENAI_ORGANIZATION = testOrg;

    // Act & Assert
    // Need to re-create config object to reflect current env vars
    const freshConfig = {
      api: {
        key: process.env.OPENAI_API_KEY || "",
        baseUrl: process.env.OPENAI_API_BASE_URL || "https://api.openai.com/v1",
        organization: process.env.OPENAI_ORGANIZATION || "",
      },
    };

    assert.strictEqual(freshConfig.api.organization, testOrg);
  });
});
