# CLAUDE.md - PromptLab Development Guide

## Build & Run Commands
- `npm run dev` - Start both frontend and backend development servers
- `npm run dev:frontend` - Start only frontend dev server
- `npm run dev:backend` - Start only backend dev server
- `npm run build` - Build frontend for production (quiet mode)
- `npm run build:with-warnings` - Build with warnings enabled
- `npm run lint` - Run linting for both frontend and backend
- `npm run format` - Format code with Prettier for both frontend and backend
- `npm test` - Run all tests
- `npm run test:frontend` - Run only frontend tests
- `npm run test:backend` - Run only backend tests
- `npm run test:coverage` - Generate test coverage reports for both frontend and backend
- `npm run sonar` - Run SonarQube analysis for both frontend and backend

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
- **Frontend:** Vue 3 SPA with Vite, Vue Router and Pinia
- **Backend:** Express REST API with MongoDB using Mongoose
- **Documentation:** Comprehensive README system (see below)

## Testing
- **Frontend:** Vitest with Vue Test Utils and JSDOM
- **Backend:** Node.js built-in test runner
- **Coverage:** V8 coverage for frontend, Node.js experimental coverage for backend

## Documentation System
This project uses a comprehensive README documentation system:
- The root README provides an overview of the entire project
- Each meaningful subdirectory has its own README describing its purpose, usage, and key components
- READMEs are hierarchically linked to create a navigable documentation network
- When searching for information about project components, first check the corresponding README files

## Development Workflow
1. Follow the setup instructions in the root README
2. Use the commands above for development and testing
3. Consult the directory-specific README files when working on a particular module
4. Follow code style guidelines for all new contributions
5. Create tests for new features
6. Update documentation when adding new features or changing functionality