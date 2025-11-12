# Testing Guide

This document explains the testing strategy for the Knowledge Network library and how to run different types of tests.

## Test Structure

The project uses **Vitest** for unit testing with two types of test files:

1. **Integration Tests** (`tests/**/*.test.ts`) - Test the library from a consumer perspective
2. **Unit Tests** (`src/**/__tests__/**/*.test.ts`) - Test individual modules in isolation

## Running Tests

### Standard Test Suite (jsdom)

Run tests that work in jsdom (Node.js environment):

```bash
pnpm test                 # Run all jsdom-compatible tests
pnpm test:watch           # Run tests in watch mode
```

**Currently runs:** 22 test files with 320 tests

### Browser-Specific Tests

Some tests require browser APIs not available in jsdom:

- **WebGL tests** - Require WebGL2 context
- **Interaction tests** - Require DOMMatrix, Touch APIs, and other browser-specific features

**Excluded from jsdom:** 5 test files with 126 tests

These tests are located in:
- `src/rendering/__tests__/WebGLRenderer.test.ts`
- `src/interaction/__tests__/InteractionController.test.ts`
- `src/interaction/__tests__/ViewportState.test.ts`
- `src/interaction/__tests__/AnimationSystem.test.ts`
- `src/interaction/__tests__/GestureRecognizer.test.ts`

To run browser-specific tests, you'll need to set up Playwright or another browser testing framework.

## Coverage

### Current Coverage: ~30%

The low coverage is primarily due to:

1. **Browser-specific modules** that cannot be tested in jsdom:
   - `interaction/` module (0% coverage) - Requires DOMMatrix, Touch APIs
   - `rendering/WebGLRenderer.ts` (16.87% coverage) - Requires WebGL context
   - `state/StateManager.ts` (0% coverage) - Not yet integrated
   - `core/DataManager.ts` (0% coverage) - Not yet integrated

2. **Well-tested core modules** have good coverage:
   - `edges/EdgeBundling.ts` - 94.32%
   - `edges/SimpleEdge.ts` - 93.33%
   - `spatial/QuadTree.ts` - 90.25%
   - `spatial/RaycastingSystem.ts` - 98.49%
   - `semantic/EmbeddingManager.ts` - 94.81%
   - `KnowledgeGraph.ts` - 75.80%

### Running Coverage Reports

```bash
pnpm exec vitest run --coverage
```

Coverage reports are generated in `coverage/`:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI/CD integration

## Coverage Goals

### jsdom-Compatible Code: 80%

For code that can run in jsdom (core graph functionality, edge bundling, spatial indexing), we target 80% coverage.

### Browser-Specific Code: Best Effort

Browser-specific code (WebGL, advanced interactions) should have:
- **Unit tests** for logic that can be tested with mocks
- **Integration tests** in a real browser environment (Playwright)
- **Manual testing** for visual features

## SonarQube Integration

The project is configured for SonarQube analysis:

```properties
# sonar-project.properties
sonar.javascript.lcov.reportPaths=packages/knowledge-network/coverage/lcov.info
```

SonarQube metrics:
- **Lines of Code:** 18,864
- **Cognitive Complexity:** 2,499
- **Code Smells:** 583 (being addressed)
- **Bugs:** 5 (under review)
- **Vulnerabilities:** 0 ✅

## Adding New Tests

### For Core Functionality

Add tests to `tests/` directory:

```typescript
// tests/my-feature.test.ts
import { describe, it, expect } from 'vitest';
import { KnowledgeGraph } from '../src';

describe('My Feature', () => {
  it('should work correctly', () => {
    const graph = new KnowledgeGraph(container, config);
    // Test your feature
  });
});
```

### For Browser-Specific Features

Add tests to `src/module/__tests__/`:

```typescript
// src/rendering/__tests__/MyRenderer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyRenderer', () => {
  // Note: These tests require browser APIs
  it('should render correctly', () => {
    // Your test
  });
});
```

Mark them for exclusion in `vitest.config.ts` if they need real browser APIs.

## Test Best Practices

1. **Use descriptive test names** that explain what is being tested
2. **Test behavior, not implementation** - focus on public APIs
3. **Keep tests isolated** - each test should be independent
4. **Mock external dependencies** when possible
5. **Use setup/teardown** to avoid test pollution
6. **Test edge cases** and error conditions

## Debugging Tests

### Run a specific test file

```bash
pnpm exec vitest tests/my-feature.test.ts
```

### Run with debugging

```bash
pnpm exec vitest --inspect-brk tests/my-feature.test.ts
```

### Use Vitest UI

```bash
pnpm exec vitest --ui
```

This opens a browser-based UI for exploring and debugging tests.

## CI/CD Integration

Tests run automatically on:
- **Pull requests** - All jsdom-compatible tests must pass
- **Main branch commits** - Full test suite + coverage reporting
- **Pre-commit hooks** - Fast unit tests only

Coverage reports are uploaded to SonarQube for quality tracking.
