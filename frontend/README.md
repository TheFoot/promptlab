# Frontend - Vue 3 Application

This directory contains the Vue 3 frontend application for the Prompt Library. It's built with the Composition API, Vue Router for navigation, and Pinia for state management.

## Directory Structure

- `index.html` - HTML entry point
- `public/` - Static assets
- `src/` - Source code
  - `App.vue` - Root Vue component
  - `main.js` - JavaScript entry point
  - `assets/` - Images, fonts, and other assets
  - `components/` - [Reusable Vue components](./src/components/README.md)
  - `router/` - [Vue Router configuration](./src/router/README.md)
  - `stores/` - [Pinia state management](./src/stores/README.md)
  - `styles/` - [Global SCSS styles](./src/styles/README.md)
  - `views/` - [Page-level Vue components](./src/views/README.md)
- `vite.config.js` - Vite bundler configuration
- `package.json` - Frontend dependencies

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Key Features

- Prompt management interface with Markdown editor
- Tag filtering and management
- Search functionality
- Dark/light mode theming
- Responsive layout
- Chat interface for testing prompts with various AI models

## Key Technologies

- Vue 3 - JavaScript framework
- Vite - Build tool and dev server
- Vue Router - Client-side routing
- Pinia - State management
- SCSS - Styling
- ESLint/Prettier - Code linting and formatting

## Related Documentation

- [Main Project README](../README.md)
- [Components](./src/components/README.md)
- [Views](./src/views/README.md)
- [State Management](./src/stores/README.md)