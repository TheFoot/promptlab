# Router

This directory contains the Vue Router configuration for the PromptLab application. Vue Router is the official router for Vue.js applications.

## Files

- `index.js` - Main router configuration with route definitions

## Route Structure

The `index.js` file defines the following routes:

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomeView | Main dashboard with prompt list |
| `/prompts/new` | PromptCreateView | Create a new prompt |
| `/prompts/:id` | PromptDetailView | View and edit a prompt |

## Configuration

```javascript
import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // Other routes
  ]
});

export default router;
```

## Navigation Guards

The router includes navigation guards for:

- Authentication checks
- Data prefetching
- Analytics tracking

## Route Parameters

Some routes use parameters to identify resources:

- `:id` in `/prompts/:id` identifies a specific prompt

## Usage in Components

```javascript
import { useRouter, useRoute } from 'vue-router';

// In setup()
const router = useRouter();
const route = useRoute();

// Access route params
const promptId = route.params.id;

// Programmatic navigation
function goToDetail(id) {
  router.push({ name: 'prompt-detail', params: { id } });
}
```

## Adding New Routes

To add a new route:

1. Create the view component in the `views` directory
2. Import the component in `router/index.js`
3. Add a route object to the `routes` array
4. Configure any needed navigation guards or meta fields

## Related Documentation

- [Frontend README](../../README.md)
- [Views](../views/README.md)
- [Vue Router Documentation](https://router.vuejs.org/)