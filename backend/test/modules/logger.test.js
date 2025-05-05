import { describe, it } from 'node:test';
import assert from 'node:assert';
import { serverLogger } from '../../src/modules/logger.js';

describe('Logger Module', () => {
  it('should create a logger with expected methods', () => {
    // Arrange & Act
    const logger = serverLogger({ level: 'info' });
    
    // Assert
    assert.strictEqual(typeof logger.info, 'function');
    assert.strictEqual(typeof logger.debug, 'function');
    assert.strictEqual(typeof logger.warn, 'function');
    assert.strictEqual(typeof logger.error, 'function');
  });
});