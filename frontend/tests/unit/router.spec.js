import { describe, it, expect, vi } from 'vitest';
import router from '../../src/router';

// Mock the view components
vi.mock('../../src/views/HomeView.vue', () => ({
  default: { name: 'HomeView' }
}));

vi.mock('../../src/views/PromptCreateView.vue', () => ({
  default: { name: 'PromptCreateView' }
}));

vi.mock('../../src/views/PromptDetailView.vue', () => ({
  default: { name: 'PromptDetailView' }
}));

describe('Router Configuration', () => {
  it('has the correct routes configured', () => {
    // Get the routes from the router
    const routes = router.options.routes;
    
    // Check that we have the expected number of routes
    expect(routes.length).toBeGreaterThan(0);
    
    // Check that the home route is configured
    const homeRoute = routes.find(route => route.path === '/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute.name).toBe('home');
    
    // Check the create prompt route
    const createRoute = routes.find(route => route.path === '/prompts/new');
    expect(createRoute).toBeDefined();
    expect(createRoute.name).toBe('prompt-create');
    
    // Check the prompt detail route
    const detailRoute = routes.find(route => route.path === '/prompts/:id');
    expect(detailRoute).toBeDefined();
    expect(detailRoute.name).toBe('prompt-detail');
  });
});