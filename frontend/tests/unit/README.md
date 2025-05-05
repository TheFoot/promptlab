# Frontend Unit Tests

This directory contains unit tests for the PromptLab frontend application, using Vitest as the test runner and Vue Test Utils for component testing.

## Test Files

### Component Tests
- `AlertSystem.spec.js` - Tests for notification component (7 tests)
- `TagInput.spec.js` - Tests for tag input component (13 tests)
- `MarkdownPreview.spec.js` - Tests for markdown rendering component (WIP - currently facing issues with mocking)

### Store Tests
- `promptStore.spec.js` - Tests for prompt management store (15 tests)
- `uiStore.spec.js` - Tests for UI state store (3 tests)

### Service Tests
- `alertService.spec.js` - Tests for alert notification service (5 tests)
- `modelConfigService.spec.js` - Tests for model configuration service (8 tests)

## Testing Strategy

Tests are designed to verify:
1. Component rendering and behavior
2. Store state management and actions
3. Service functionality and error handling
4. User interactions
5. Proper API integration

## Coverage Summary (as of May 5, 2025)

- 51 passing tests across 6 components/services
- 2 failing tests for MarkdownPreview (due to mocking issues)
- Key functionality covered:
  - Notification system
  - Tag input and management
  - Prompt data store operations
  - UI state changes
  - Alert service integration
  - Model configuration loading and error handling

## Next Steps

1. Fix MarkdownPreview component tests
2. Add tests for ChatSidebar and PromptSidebar components
3. Add tests for view components (HomeView, PromptCreateView, PromptDetailView)
4. Create test utilities for router and localStorage
5. Address coverage gaps
6. Add integration tests for key user flows

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Notes

- External dependencies are mocked using Vitest's mocking capabilities
- Pinia stores are tested using createPinia and setActivePinia
- JSDOM is used to simulate browser environment
- Test coverage is tracked using V8 coverage provider