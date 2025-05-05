import { describe, it } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import mongoose from 'mongoose';

import {
  getPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
} from '../../src/controllers/promptController.js';

import Prompt from '../../src/models/Prompt.js';

// Mock test helper for mocking Express req/res
const mockExpressReqRes = (reqOverrides = {}, resOverrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    ip: '127.0.0.1',
    ...reqOverrides,
  };
  
  const res = {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
    send: sinon.stub().returnsThis(),
    ...resOverrides,
  };
  
  return { req, res };
};

describe('Prompt Controller Basic Tests', async () => {
  it('should have the required controller methods', () => {
    assert.strictEqual(typeof getPrompts, 'function');
    assert.strictEqual(typeof getPromptById, 'function');
    assert.strictEqual(typeof createPrompt, 'function');
    assert.strictEqual(typeof updatePrompt, 'function');
    assert.strictEqual(typeof deletePrompt, 'function');
  });
  
  it('should handle error cases', async () => {
    // Mock Prompt.find to throw an error
    const originalFind = Prompt.find;
    Prompt.find = () => {
      throw new Error('Test error');
    };
    
    // Create mock request and response
    const { req, res } = mockExpressReqRes();
    
    // Call the function
    await getPrompts(req, res);
    
    // Assert
    assert.strictEqual(res.status.firstCall.args[0], 500);
    assert.deepStrictEqual(res.json.firstCall.args[0], { message: 'Test error' });
    
    // Restore original Prompt.find
    Prompt.find = originalFind;
  });
});