import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import ChatModelFactory from '../../src/services/chatService.js';
import config from '../../src/config/index.js';
import { setupLoggerMock } from '../helpers/testSetup.js';

describe('Chat Service', async () => {
  let restoreLogger;

  // Mock OpenAI API responses
  const mockOpenAICompletionResponse = {
    choices: [
      {
        message: {
          content: 'This is a mock OpenAI response',
        },
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 20,
      total_tokens: 30,
    },
  };

  const mockOpenAIStreamResponse = [
    { choices: [{ delta: { content: 'This ' } }] },
    { choices: [{ delta: { content: 'is ' } }] },
    { choices: [{ delta: { content: 'a ' } }] },
    { choices: [{ delta: { content: 'mock ' } }] },
    { choices: [{ delta: { content: 'OpenAI ' } }] },
    { choices: [{ delta: { content: 'response' } }] },
    { choices: [{ delta: { content: '' } }] }, // Empty delta at end
  ];

  // Mock Anthropic API responses - note the content format must match the expected structure
  const mockAnthropicMessageResponse = {
    content: [{ type: 'text', text: 'This is a mock Anthropic response' }],
    usage: {
      input_tokens: 10,
      output_tokens: 20,
    },
  };

  const mockAnthropicStreamResponse = [
    { type: 'content_block_delta', delta: { text: 'This ' } },
    { type: 'content_block_delta', delta: { text: 'is ' } },
    { type: 'content_block_delta', delta: { text: 'a ' } },
    { type: 'content_block_delta', delta: { text: 'mock ' } },
    { type: 'content_block_delta', delta: { text: 'Anthropic ' } },
    { type: 'content_block_delta', delta: { text: 'response' } },
    { type: 'other_event', delta: { text: '' } }, // Non-content event
  ];

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
  });

  after(() => {
    // Restore original logger
    restoreLogger();
  });

  describe('ChatModelFactory', async () => {
    // Save original config before each test and restore after
    let originalConfig;

    before(() => {
      // Save original config
      originalConfig = {
        providers: { ...config.providers },
      };
    });

    after(() => {
      // Restore original config
      config.providers = originalConfig.providers;

      // Reset all stubs
      sinon.restore();
    });

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

    it('should default to OpenAI when provider is not specified', () => {
      // Make sure default is set to openai for this test
      config.providers.default = 'openai';

      // Act - not specifying the provider
      const model = ChatModelFactory.createModel();

      // Assert it's an OpenAI model
      assert.strictEqual(model.constructor.name, 'OpenAIModel');
    });

    it('should handle case-insensitive provider names', () => {
      // Act with different casings
      const model1 = ChatModelFactory.createModel('OpenAI');
      const model2 = ChatModelFactory.createModel('ANTHROPIC');
      const model3 = ChatModelFactory.createModel('aNtHrOpIc');

      // Assert
      assert.strictEqual(model1.constructor.name, 'OpenAIModel');
      assert.strictEqual(model2.constructor.name, 'AnthropicModel');
      assert.strictEqual(model3.constructor.name, 'AnthropicModel');
    });

    it('should return default provider when provider is null or undefined', () => {
      // Save original default provider
      const originalDefault = config.providers.default;

      try {
        // Set a known default for testing
        config.providers.default = 'anthropic';

        // Act with undefined and null providers
        const model1 = ChatModelFactory.createModel(undefined);
        const model2 = ChatModelFactory.createModel(null);

        // Assert both use the default provider
        assert.strictEqual(model1.constructor.name, 'AnthropicModel');
        assert.strictEqual(model2.constructor.name, 'AnthropicModel');
      } finally {
        // Restore original default
        config.providers.default = originalDefault;
      }
    });

    it('should handle unknown providers by falling back to default', () => {
      // Ensure default is set to openai
      config.providers.default = 'openai';

      // Act with an unknown provider
      const model = ChatModelFactory.createModel('unknown_provider');

      // Assert it falls back to OpenAI
      assert.strictEqual(model.constructor.name, 'OpenAIModel');
    });
  });

  describe('OpenAIModel', async () => {
    let openAICreateStub;
    let openAIStreamStub;
    let openaiModel;
    let OpenAIStub;

    // Setup before all tests in this block
    before(() => {
      // Create stubs for OpenAI API methods
      openAICreateStub = sinon.stub().resolves(mockOpenAICompletionResponse);

      // Create stub for streaming API
      const mockAsyncIterator = {
        async* [Symbol.asyncIterator]() {
          for (const chunk of mockOpenAIStreamResponse) {
            yield chunk;
          }
        },
      };
      openAIStreamStub = sinon.stub().resolves(mockAsyncIterator);

      // Stub the OpenAI client
      OpenAIStub = sinon.stub().returns({
        chat: {
          completions: {
            create: sinon.stub().callsFake((params) => {
              if (params.stream) {
                return openAIStreamStub(params);
              }
              return openAICreateStub(params);
            }),
          },
        },
      });

      // Replace the OpenAI constructor in global scope
      global.OpenAI = OpenAIStub;

      // Create an instance of the model
      openaiModel = ChatModelFactory.createModel('openai');
    });

    // Cleanup after tests
    after(() => {
      delete global.OpenAI;
      sinon.restore();
    });

    it('should correctly call the OpenAI API for chat', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockOpenAICompletionResponse);

      // Replace the create method with our stub
      const originalCreate = openaiModel.client.chat.completions.create;
      openaiModel.client.chat.completions.create = stubForTest;

      // Arrange
      const messages = [{ role: 'user', content: 'Hello' }];
      const options = { model: 'gpt-4', temperature: 0.5 };

      // Act
      const result = await openaiModel.chat(messages, options);

      // Assert
      assert.strictEqual(result.message, 'This is a mock OpenAI response');
      assert.deepStrictEqual(result.usage, mockOpenAICompletionResponse.usage);

      // Verify API was called with correct parameters
      const createArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(createArgs.model, 'gpt-4');
      assert.strictEqual(createArgs.temperature, 0.5);
      assert.deepStrictEqual(createArgs.messages, messages);

      // Restore original
      openaiModel.client.chat.completions.create = originalCreate;
    });

    it('should use default model and temperature when not specified', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockOpenAICompletionResponse);

      // Replace the create method with our stub
      const originalCreate = openaiModel.client.chat.completions.create;
      openaiModel.client.chat.completions.create = stubForTest;

      // Arrange
      const messages = [{ role: 'user', content: 'Hello' }];
      const expectedModel = config.openai.models.default;
      const expectedTemperature = config.openai.defaults.temperature;

      // Act
      await openaiModel.chat(messages);

      // Assert API was called with default parameters
      const createArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(createArgs.model, expectedModel);
      assert.strictEqual(createArgs.temperature, expectedTemperature);

      // Restore original
      openaiModel.client.chat.completions.create = originalCreate;
    });

    it('should correctly stream responses from the OpenAI API', async () => {
      // Create a stream-like object that will yield the expected chunks
      const mockStream = {
        async* [Symbol.asyncIterator]() {
          for (const chunk of mockOpenAIStreamResponse) {
            yield chunk;
          }
        },
      };

      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockStream);

      // Replace the create method with our stub
      const originalCreate = openaiModel.client.chat.completions.create;
      openaiModel.client.chat.completions.create = stubForTest;

      // Arrange
      const messages = [{ role: 'user', content: 'Hello' }];
      const options = { model: 'gpt-4', temperature: 0.5 };
      const chunkCallback = sinon.spy();

      // Act
      const result = await openaiModel.streamChat(
          messages,
          chunkCallback,
          options,
      );

      // Assert
      assert.strictEqual(result.message, 'This is a mock OpenAI response');

      // Verify callback was called for each chunk (that has content)
      assert.strictEqual(chunkCallback.callCount, 6); // 6 non-empty chunks
      assert.strictEqual(chunkCallback.firstCall.args[0], 'This ');
      assert.strictEqual(chunkCallback.lastCall.args[0], 'response');

      // Verify stream parameter was set in API call
      const callArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(callArgs.stream, true);

      // Restore original
      openaiModel.client.chat.completions.create = originalCreate;
    });

    it('should handle and propagate errors from the OpenAI API', async () => {
      // Arrange
      const apiError = new Error('OpenAI API Error');
      apiError.status = 429;
      apiError.type = 'rate_limit_error';

      // Create a stub for the chat completions create method that will reject
      const errorStub = sinon.stub().rejects(apiError);

      // Replace the create method with our error stub
      const originalCreate = openaiModel.client.chat.completions.create;
      openaiModel.client.chat.completions.create = errorStub;

      const messages = [{ role: 'user', content: 'Hello' }];

      // Act & Assert
      try {
        await openaiModel.chat(messages);
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.strictEqual(err.message, 'OpenAI API Error');
        assert.strictEqual(err.status, 429);
        assert.strictEqual(err.type, 'rate_limit_error');
      }

      // Restore original
      openaiModel.client.chat.completions.create = originalCreate;
    });

    it('should handle and propagate errors from the OpenAI streaming API', async () => {
      // Arrange
      const apiError = new Error('OpenAI Streaming API Error');

      // Create a stub for the chat completions create method that will reject
      const errorStub = sinon.stub().rejects(apiError);

      // Replace the create method with our error stub
      const originalCreate = openaiModel.client.chat.completions.create;
      openaiModel.client.chat.completions.create = errorStub;

      const messages = [{ role: 'user', content: 'Hello' }];
      const chunkCallback = sinon.spy();

      // Act & Assert
      try {
        await openaiModel.streamChat(messages, chunkCallback);
        assert.fail('Expected an error to be thrown');
      } catch (err) {
        assert.strictEqual(err.message, 'OpenAI Streaming API Error');
      }

      // Restore original
      openaiModel.client.chat.completions.create = originalCreate;
    });
  });

  describe('AnthropicModel', async () => {
    let anthropicModel;
    let anthropicMessagesCreate;
    let savedAnthropicConstructor;

    // Setup before all tests in this block
    before(() => {
      // Save original Anthropic constructor if it exists
      savedAnthropicConstructor = global.Anthropic;

      // Create a stub for Anthropic.messages.create
      anthropicMessagesCreate = sinon.stub();

      // Normal response mode
      anthropicMessagesCreate
          .withArgs(sinon.match({ stream: undefined }))
          .resolves(mockAnthropicMessageResponse);

      // Streaming response mode
      anthropicMessagesCreate.withArgs(sinon.match({ stream: true })).resolves({
        async* [Symbol.asyncIterator]() {
          for (const chunk of mockAnthropicStreamResponse) {
            yield chunk;
          }
        },
      });

      // Create mock Anthropic class
      global.Anthropic = function MockAnthropic() {
        this.messages = {
          create: anthropicMessagesCreate,
        };
      };

      // Create an instance of the model
      anthropicModel = ChatModelFactory.createModel('anthropic');
    });

    // Cleanup after tests
    after(() => {
      // Restore original Anthropic constructor
      global.Anthropic = savedAnthropicConstructor;
      sinon.restore();
    });

    it('should correctly call the Anthropic API for chat', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockAnthropicMessageResponse);

      // Replace the create method with our stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = stubForTest;

      // Arrange
      const messages = [{ role: 'user', content: 'Hello' }];
      const options = {
        model: 'claude-3-opus-20240229',
        temperature: 0.5,
        maxTokens: 2000,
      };

      // Act
      const result = await anthropicModel.chat(messages, options);

      // Assert
      assert.strictEqual(result.message, 'This is a mock Anthropic response');
      assert.deepStrictEqual(result.usage, mockAnthropicMessageResponse.usage);

      // Verify API was called with correct parameters
      const callArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(callArgs.model, 'claude-3-opus-20240229');
      assert.strictEqual(callArgs.temperature, 0.5);
      assert.strictEqual(callArgs.max_tokens, 2000);
      assert.deepStrictEqual(callArgs.messages, messages);

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should use default model, temperature and maxTokens when not specified', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockAnthropicMessageResponse);

      // Replace the create method with our stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = stubForTest;

      // Arrange
      const messages = [{ role: 'user', content: 'Hello' }];
      const expectedModel = config.anthropic.models.default;
      const expectedTemperature = config.anthropic.defaults.temperature;
      const expectedMaxTokens = config.anthropic.defaults.maxTokens;

      // Act
      await anthropicModel.chat(messages);

      // Assert API was called with default parameters
      const callArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(callArgs.model, expectedModel);
      assert.strictEqual(callArgs.temperature, expectedTemperature);
      assert.strictEqual(callArgs.max_tokens, expectedMaxTokens);

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should correctly convert system messages for Anthropic API', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockAnthropicMessageResponse);

      // Replace the create method with our stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = stubForTest;

      // Arrange
      const messages = [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'How can I help you?' },
        { role: 'user', content: 'Tell me a joke' },
      ];

      // Act
      await anthropicModel.chat(messages);

      // Assert API was called with correct message conversion
      const callArgs = stubForTest.firstCall.args[0];

      // System message should be set separately
      assert.strictEqual(callArgs.system, 'You are a helpful assistant');

      // Messages should only contain user and assistant messages
      assert.strictEqual(callArgs.messages.length, 3);
      assert.deepStrictEqual(callArgs.messages, [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'How can I help you?' },
        { role: 'user', content: 'Tell me a joke' },
      ]);

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should correctly stream responses from the Anthropic API', async () => {
      // Create a stream-like object that will yield the expected chunks
      const mockStream = {
        async* [Symbol.asyncIterator]() {
          for (const chunk of mockAnthropicStreamResponse) {
            yield chunk;
          }
        },
      };

      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockStream);

      // Replace the create method with our stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = stubForTest;

      // Arrange
      const messages = [{ role: 'user', content: 'Hello' }];
      const options = { model: 'claude-3-haiku-20240307', temperature: 0.5 };
      const chunkCallback = sinon.spy();

      // Act
      const result = await anthropicModel.streamChat(
          messages,
          chunkCallback,
          options,
      );

      // Assert
      // Check that we're properly concatenating the mock chunks from the test data
      assert.strictEqual(result.message, 'This is a mock Anthropic response');

      // Verify callback was called for each content chunk (that's of type 'content_block_delta')
      assert.strictEqual(chunkCallback.callCount, 6); // 6 content chunks
      assert.strictEqual(chunkCallback.firstCall.args[0], 'This ');
      assert.strictEqual(chunkCallback.lastCall.args[0], 'response');

      // Verify stream parameter was set in API call
      const callArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(callArgs.stream, true);

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should handle and propagate errors from the Anthropic API', async () => {
      // Arrange
      const apiError = new Error('Anthropic API Error');
      apiError.status = 429;

      // Create a new stub that always rejects
      const errorStub = sinon.stub().rejects(apiError);

      // Replace the create method with our error stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = errorStub;

      const messages = [{ role: 'user', content: 'Hello' }];

      // Act & Assert
      try {
        await anthropicModel.chat(messages);
        assert.fail('Expected error was not thrown');
      } catch (err) {
        assert.strictEqual(err.message, 'Anthropic API Error');
        assert.strictEqual(err.status, 429);
      }

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should handle and propagate errors from the Anthropic streaming API', async () => {
      // Arrange
      const apiError = new Error('Anthropic Streaming API Error');

      // Create a new stub that always rejects
      const errorStub = sinon.stub().rejects(apiError);

      // Replace the create method with our error stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = errorStub;

      const messages = [{ role: 'user', content: 'Hello' }];
      const chunkCallback = sinon.spy();

      // Act & Assert
      try {
        await anthropicModel.streamChat(messages, chunkCallback);
        assert.fail('Expected error was not thrown');
      } catch (err) {
        assert.strictEqual(err.message, 'Anthropic Streaming API Error');
      }

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should correctly handle message conversion with no system message', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockAnthropicMessageResponse);

      // Replace the create method with our stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = stubForTest;

      // Arrange - messages with no system message
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'How can I help you?' },
      ];

      // Act
      await anthropicModel.chat(messages);

      // Assert - system parameter should not be included
      const callArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(callArgs.system, undefined);
      assert.deepStrictEqual(callArgs.messages, messages);

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });

    it('should extract system message when it appears in the middle of messages', async () => {
      // Create a targeted stub just for this test
      const stubForTest = sinon.stub().resolves(mockAnthropicMessageResponse);

      // Replace the create method with our stub
      const originalCreate = anthropicModel.client.messages.create;
      anthropicModel.client.messages.create = stubForTest;

      // Arrange - system message in middle position
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'system', content: 'Be concise in your responses' },
        { role: 'assistant', content: 'How can I help you?' },
      ];

      // Act
      await anthropicModel.chat(messages);

      // Assert - system parameter should be set and messages should exclude system message
      const callArgs = stubForTest.firstCall.args[0];
      assert.strictEqual(callArgs.system, 'Be concise in your responses');
      assert.deepStrictEqual(callArgs.messages, [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'How can I help you?' },
      ]);

      // Restore original method
      anthropicModel.client.messages.create = originalCreate;
    });
  });
});
