import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import sinon from 'sinon';
import dotenv from 'dotenv';
import { restoreAllSinon } from '../helpers/testSetup.js';

describe('Configuration Module', async () => {
  let originalEnv;
  
  beforeEach(() => {
    // Save original process.env
    originalEnv = { ...process.env };
    
    // Mock dotenv.config
    sinon.stub(dotenv, 'config').returns({});
  });
  
  afterEach(() => {
    // Restore process.env
    process.env = originalEnv;
    
    // Restore all stubs
    restoreAllSinon();
  });
  
  it('should have the correct structure', async () => {
    // Import the actual config
    const config = (await import('../../src/config/index.js')).default;
    
    // Assert basic structure
    assert.ok(config.port);
    assert.ok(config.mongodbUri);
    assert.ok(config.nodeEnv);
    assert.ok('isDev' in config);
    assert.ok('isProd' in config);
    
    // Assert provider configurations
    assert.ok(config.providers);
    assert.ok(config.openai);
    assert.ok(config.anthropic);
    
    // Assert providers
    assert.ok(Array.isArray(config.providers.available));
    assert.ok(config.providers.available.includes('openai'));
    assert.ok(config.providers.available.includes('anthropic'));
  });
});