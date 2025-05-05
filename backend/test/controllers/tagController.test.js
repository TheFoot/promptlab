import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';

import { getAllTags } from '../../src/controllers/tagController.js';
import Prompt from '../../src/models/Prompt.js';
import { mockExpressReqRes, setupLoggerMock, restoreAllSinon } from '../helpers/testSetup.js';

describe('Tag Controller', async () => {
  let restoreLogger;

  before(() => {
    // Setup mock logger to prevent test logs
    restoreLogger = setupLoggerMock();
  });

  after(() => {
    // Restore original logger
    restoreLogger();
  });

  beforeEach(() => {
    // Create stub for Prompt model aggregate method
    sinon.stub(Prompt, 'aggregate');
  });

  afterEach(() => {
    // Restore all stubs
    restoreAllSinon();
  });

  describe('getAllTags', async () => {
    it('should return all unique tags from the database', async () => {
      // Arrange
      const mockTags = [
        { name: 'test' },
        { name: 'example' },
        { name: 'coding' }
      ];
      
      Prompt.aggregate.resolves(mockTags);
      
      const { req, res } = mockExpressReqRes();

      // Act
      await getAllTags(req, res);

      // Assert
      assert.equal(res.json.calledOnce, true);
      const returnedTags = res.json.firstCall.args[0];
      assert.deepEqual(returnedTags, ['test', 'example', 'coding']);
      
      // Verify the aggregation pipeline
      const pipeline = Prompt.aggregate.firstCall.args[0];
      assert.equal(pipeline.length, 4);
      assert.deepEqual(pipeline[0], { $unwind: '$tags' });
      assert.deepEqual(pipeline[1], { $group: { _id: '$tags' } });
      assert.deepEqual(pipeline[2], { $sort: { _id: 1 } });
      assert.deepEqual(pipeline[3], { $project: { _id: 0, name: '$_id' } });
    });

    it('should handle empty tag results properly', async () => {
      // Arrange
      Prompt.aggregate.resolves([]);
      
      const { req, res } = mockExpressReqRes();

      // Act
      await getAllTags(req, res);

      // Assert
      assert.equal(res.json.calledOnce, true);
      const returnedTags = res.json.firstCall.args[0];
      assert.deepEqual(returnedTags, []);
    });

    it('should handle errors properly', async () => {
      // Arrange
      const error = new Error('Database error');
      Prompt.aggregate.throws(error);
      
      const { req, res } = mockExpressReqRes();

      // Act
      await getAllTags(req, res);

      // Assert
      assert.equal(res.status.calledWith(500), true);
      assert.equal(res.json.calledWith({ message: error.message }), true);
    });
  });
});