# Code Quality Guide

This document provides guidelines for maintaining and improving code quality in the Knowledge Network project.

## SonarQube Integration

The project uses SonarQube for continuous quality monitoring:

- **Project:** `aigeeksquad_KnowledgeGraphRenderer`
- **Dashboard:** https://sonarcloud.io/project/overview?id=aigeeksquad_KnowledgeGraphRenderer

## Current Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Coverage** | 30% | 80% | 🔴 Needs Improvement |
| **Code Smells** | 583 | <50 | 🔴 In Progress |
| **Cognitive Complexity** | 2,499 | <1000 | 🔴 Needs Refactoring |
| **Bugs** | 5 | 0 | 🟡 Under Review |
| **Vulnerabilities** | 0 | 0 | ✅ Good |
| **Security Rating** | A | A | ✅ Good |
| **Technical Debt** | 35h | <10h | 🔴 Needs Reduction |

## Priority Issues

### 🔴 Critical: Cognitive Complexity

**8 functions exceed complexity limit (15):**

1. `EdgeBundling.bundleEdges()` - Complexity: 49
   - **File:** `src/edges/EdgeBundling.ts:698`
   - **Action:** Extract compatibility calculation into separate methods
   - **Impact:** High maintainability improvement

2. `EdgeBundling.smoothEdges()` - Complexity: 23
   - **File:** `src/edges/EdgeBundling.ts:857`
   - **Action:** Extract smoothing strategies

3. `SVGRenderer.renderNodes()` - Complexity: 20
   - **File:** `src/rendering/SVGRenderer.ts:323`
   - **Action:** Extract node shape rendering

4. `WebGLRenderer.renderNodes()` - Complexity: 23
   - **File:** `src/rendering/WebGLRenderer.ts:748`
   - **Action:** Extract buffer management logic

5. `WebGLFallback.handleContextLoss()` - Complexity: 23
   - **File:** `src/rendering/WebGLFallback.ts:65`
   - **Action:** Simplify recovery logic

6. `InteractionController.handlePointerMove()` - Complexity: 18
   - **File:** `src/interaction/InteractionController.ts:526`
   - **Action:** Extract interaction state handling

7. `DataGenerator.generateGraph()` - Complexity: 25
   - **File:** `packages/demo-suite/src/shared/DataGenerator.ts:193`
   - **Action:** Extract node/edge generation

8. `DataGenerator.generateTreeGraph()` - Complexity: 19
   - **File:** `packages/demo-suite/src/shared/DataGenerator.ts:272`
   - **Action:** Extract tree building logic

### 🟡 Major: Code Smells

**Common patterns to address:**

1. **Unused imports** - 14 occurrences
   - ✅ **Fixed:** Most unused imports in `interaction/` module removed
   - **Remaining:** Check `rendering/` and `demo-suite/` modules

2. **Empty method stubs** - 7 occurrences
   - ✅ **Fixed:** Added explanatory comments to `CanvasRenderer.ts`
   - **Pattern:** Document why methods are intentionally empty

3. **Empty catch blocks** - 4 occurrences
   - ✅ **Fixed:** Added comments to explain fallback behavior
   - **Pattern:** Always document why errors are silently handled

4. **Unnecessary type assertions** - 6 occurrences
   - **File:** `src/rendering/CanvasRenderer.ts`, `EnhancedCanvasRenderer.ts`
   - **Action:** Improve type definitions to avoid assertions

5. **Use `for-of` instead of `.forEach()`** - Multiple occurrences
   - **Pattern:** Modern for-of loops are more performant
   - **Action:** Refactor forEach to for-of where appropriate

## Refactoring Guidelines

### Reducing Cognitive Complexity

**Strategy:** Extract complex logic into smaller, focused functions.

**Example: EdgeBundling.bundleEdges()**

Before:
```typescript
bundleEdges() {
  // 200+ lines with nested loops and conditionals
}
```

After:
```typescript
bundleEdges() {
  const compatibilityMatrix = this.calculateCompatibilityMatrix();
  const bundleGroups = this.groupCompatibleEdges(compatibilityMatrix);
  return this.generateBundleSegments(bundleGroups);
}

private calculateCompatibilityMatrix() { /* ... */ }
private groupCompatibleEdges() { /* ... */ }
private generateBundleSegments() { /* ... */ }
```

### Improving Test Coverage

**Focus areas for coverage improvement:**

1. **Core modules** (should reach 80%+):
   - ✅ `edges/` - Currently at 94%
   - ✅ `spatial/` - Currently at 81%
   - ✅ `semantic/` - Currently at 94%
   - 🔴 `core/DataManager.ts` - Currently at 0%
   - 🔴 `state/StateManager.ts` - Currently at 0%

2. **Browser-specific modules** (document limitations):
   - `interaction/` - Requires browser testing framework
   - `rendering/WebGLRenderer.ts` - Needs WebGL mocks or real browser

**See [TESTING.md](./TESTING.md) for detailed testing guide.**

### Code Style Improvements

1. **Use modern JavaScript patterns:**
   ```typescript
   // ❌ Avoid
   array.forEach(item => { ... });
   
   // ✅ Prefer
   for (const item of array) { ... }
   ```

2. **Prefer `globalThis` over `window`:**
   ```typescript
   // ❌ Avoid
   window.requestAnimationFrame(...)
   
   // ✅ Prefer
   globalThis.requestAnimationFrame(...)
   ```

3. **Use `.at()` for array access:**
   ```typescript
   // ❌ Avoid
   array[array.length - 1]
   
   // ✅ Prefer
   array.at(-1)
   ```

## Addressing Issues

### Step-by-Step Process

1. **Identify the issue** in SonarQube or during code review
2. **Understand the root cause** - why is this flagged?
3. **Choose the fix strategy:**
   - Extract method
   - Simplify logic
   - Add type safety
   - Document intentional behavior
4. **Write tests** to verify the fix
5. **Verify with SonarQube** - ensure the issue is resolved

### Example: Fixing Unused Import

```typescript
// Before (SonarQube warning)
import type { Point2D, Point3D, Point } from '../spatial/types';

// After
import type { Point2D } from '../spatial/types';
```

### Example: Documenting Empty Method

```typescript
// Before (SonarQube critical)
updateNodePositions(_positions: NodePosition[]): void {}

// After
updateNodePositions(_positions: NodePosition[]): void {
  // Not implemented in basic CanvasRenderer - use EnhancedCanvasRenderer for incremental updates
}
```

## Monitoring Progress

### Weekly Quality Check

Run these commands to check quality:

```bash
# Run tests with coverage
pnpm test -- --coverage

# Check for linting issues
pnpm lint

# Build to ensure no type errors
pnpm build
```

### SonarQube Scans

SonarQube automatically scans:
- On every pull request
- On every commit to main branch
- Nightly for comprehensive analysis

View results at: https://sonarcloud.io/project/overview?id=aigeeksquad_KnowledgeGraphRenderer

## Contributing

When submitting code:

1. ✅ All tests must pass
2. ✅ Coverage should not decrease (unless justified)
3. ✅ No new critical or blocker issues
4. ✅ Document any intentional quality trade-offs

## Resources

- [SonarQube Rules](https://rules.sonarsource.com/typescript/)
- [Cognitive Complexity](https://www.sonarsource.com/resources/cognitive-complexity/)
- [Vitest Documentation](https://vitest.dev/)
- [Testing Guide](./TESTING.md)
