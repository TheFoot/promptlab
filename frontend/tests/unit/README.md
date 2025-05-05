# Frontend Unit Tests

This directory contains the unit tests for the PromptLab frontend application. The tests use Vitest with Vue Test Utils to test Vue components and related modules.

## Test Structure

- Each component has its own test file with the naming convention `ComponentName.spec.js`
- Some components have both standard tests and "Direct" tests (e.g., `PromptCreateView.spec.js` and `PromptCreateViewDirect.spec.js`)
- Tests are organized to mirror the structure of the src directory

## Test Types

1. **Component Tests**: Tests for Vue components testing rendering, props, events, etc.
2. **Store Tests**: Tests for Pinia stores to verify state management
3. **Service Tests**: Tests for service modules that handle API calls and application logic
4. **Utility Tests**: Tests for utility functions and helper methods
5. **Integration Tests**: Tests for how components work together

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

## Testing Patterns

### Component Testing

We use two approaches for testing components:

1. **Standard Tests**: Focus on behavior, user interactions, and output
2. **Direct Tests**: Focus on internal implementation details and lifecycle events

### Mocking

- External dependencies are mocked using `vi.mock()`
- API calls are mocked to return predictable responses
- DOM APIs are mocked when necessary (e.g., localStorage, navigator)

### Test Utilities

- `shallowMount`: For isolated component testing
- `mount`: For testing with child components
- `flushPromises`: For waiting on async operations to complete
- `vi.spyOn`: For verifying method calls

## Coverage Goal

The project aims for >80% test coverage. Current coverage is 83.65%.
