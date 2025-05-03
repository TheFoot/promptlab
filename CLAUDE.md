# CLAUDE.md - Prompt Library Development Guide

## Build & Run Commands
- `npm run dev` - Start both frontend and backend development servers
- `npm run dev:frontend` - Start only frontend dev server
- `npm run dev:backend` - Start only backend dev server
- `npm run build` - Build frontend for production (quiet mode)
- `npm run build:with-warnings` - Build with warnings enabled
- `npm run lint` - Run linting for both frontend and backend
- `npm run format` - Format code with Prettier for both frontend and backend

## Code Style Guidelines
- **Modules:** Use ES Modules (ESM) not CommonJS
- **Async:** Use async/await pattern (no .then/.catch chains)
- **Components:** Use Vue 3 Composition API with `<script setup>` syntax
- **Styling:** Use SCSS with scoped styles per component
- **Formatting:** Follow Google JavaScript style guide
- **Error Handling:** Use try/catch blocks and proper error responses
- **Naming:** Use camelCase for variables/functions, PascalCase for components
- **State Management:** Use Pinia for global state, component refs for local state
- **API Endpoints:** Follow REST conventions with proper HTTP verbs

## Project Structure
Frontend: Vue 3 SPA with Vite, Vue Router and Pinia
Backend: Express REST API with MongoDB using Mongoose