import { describe, it } from 'node:test';
import assert from 'node:assert';

import tagRoutes from '../../src/routes/tagRoutes.js';

describe('Tag Routes', async () => {
  it('should have route for getting all tags', () => {
    // Find the route definition for GET /
    const getRoute = tagRoutes.stack.find(
        (layer) =>
          layer.route && layer.route.path === '/' && layer.route.methods.get,
    );

    // Ensure it exists
    assert.ok(getRoute, 'GET / route should exist');
  });
});
