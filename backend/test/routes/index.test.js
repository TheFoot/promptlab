import { describe, it } from 'node:test';
import assert from 'node:assert';
import apiRoutes from '../../src/routes/index.js';

describe('API Routes Index', async () => {
  it('should have registered routes for main API endpoints', () => {
    // Get all registered route paths
    const routePaths = apiRoutes.stack
      .map(layer => layer.regexp)
      .map(regexp => regexp.toString())
      .join(' ');
    
    // Check that the main API endpoints are present
    assert.ok(routePaths.includes('prompts'), 'Should have /prompts endpoint');
    assert.ok(routePaths.includes('tags'), 'Should have /tags endpoint');
    assert.ok(routePaths.includes('chat'), 'Should have /chat endpoint');
  });
});