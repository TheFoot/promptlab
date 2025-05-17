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
- **Variable Declarations:** Don't initialize variables with `undefined` - it's redundant
- **Nullish Handling:** Use optional chaining (`?.`) and nullish coalescing (`??`) for concise null checks
  - Prefer `obj?.prop` over `obj && obj.prop`
  - Prefer `arr?.[index]` over `arr && arr[index]`
  - Prefer `func?.()` over `func && func()`
- **Promise Handling:** Never use Promise objects directly in boolean conditions; check against `null` or use appropriate methods
- **Accessibility:** Always associate form labels with controls using the `for` attribute that matches an `id` on the control
- **Error Handling:** Never use empty catch blocks. Always log errors with `console.error()` or handle them appropriately
- **Try/Catch:** When the error variable is not used in the catch block, use the simplified syntax: `try { ... } catch { ... }` instead of `try { ... } catch (e) { ... }`
- **Function Design:**
  - **Return Type Consistency:** Ensure functions always return the same type (e.g., if a function returns a string, all return paths should return strings)
  - **Cognitive Complexity:** Keep function complexity low by:
    - Breaking complex functions into smaller, single-purpose helper functions
    - Extracting conditional logic into separate functions
    - Limiting nested conditionals to 2-3 levels deep
    - Using early returns to handle edge cases first
  - **Function Size:** Functions should generally be shorter than 30 lines; longer functions should be refactored

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