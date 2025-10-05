# Knowledge Network Layout Engine Test Requirements
## D3.js Idiomatic API Testing Specification

## Overview

This document defines comprehensive test requirements for the Knowledge Network Layout Engine's D3.js idiomatic API. Tests must validate all API contracts, callbacks, state management, and performance guarantees.

## Test Framework Requirements

### Technology Stack

```json
{
  "test-runner": "vitest",
  "assertion": "vitest/chai",
  "dom": "jsdom",
  "d3": "^7.0.0",
  "coverage": "v8",
  "mocking": "vitest-mock"
}
```

### Test Structure

```
tests/
├── unit/
│   ├── configuration.test.ts
│   ├── events.test.ts
│   ├── state-machine.test.ts
│   ├── selection.test.ts
│   ├── zoom-pan.test.ts
│   ├── force-simulation.test.ts
│   └── data-management.test.ts
├── integration/
│   ├── rendering-pipeline.test.ts
│   ├── interaction-flow.test.ts
│   ├── error-recovery.test.ts
│   └── performance.test.ts
├── e2e/
│   ├── complete-workflow.test.ts
│   └── demo-scenarios.test.ts
└── helpers/
    ├── mock-data.ts
    ├── test-utils.ts
    └── performance-utils.ts
```

## Unit Test Requirements

### 1. Configuration API Tests

```typescript
describe('Configuration API', () => {
  describe('Method Chaining', () => {
    it('should return graph instance for all setters');
    it('should return current value for all getters');
    it('should maintain fluent interface through entire chain');
  });

  describe('Accessor Functions', () => {
    it('should accept constant values');
    it('should accept function accessors');
    it('should convert constants to functions internally');
    it('should pass correct parameters to accessor functions');
    it('should handle undefined accessor returns gracefully');
  });

  describe('Configuration Validation', () => {
    it('should validate numeric ranges (width, height, padding)');
    it('should validate enum values (renderMode, selectionMode)');
    it('should validate array bounds (zoomExtent)');
    it('should provide meaningful error messages');
  });

  describe('Default Values', () => {
    it('should use documented defaults when not configured');
    it('should allow overriding any default');
    it('should reset to defaults on request');
  });
});
```

### 2. Event System Tests

```typescript
describe('Event System', () => {
  describe('Event Registration', () => {
    it('should register callbacks for all documented events');
    it('should support multiple callbacks per event');
    it('should return graph instance when registering');
    it('should return callback when querying');
    it('should remove callbacks when passed null');
  });

  describe('Callback Execution', () => {
    it('should execute callbacks in registration order');
    it('should pass correct parameters to each callback type');
    it('should handle callback errors without stopping propagation');
    it('should support stopping propagation explicitly');
  });

  describe('State Change Events', () => {
    it('should trigger stateChange for every state transition');
    it('should include previous state in metadata');
    it('should include progress value (0-1)');
    it('should include phase-specific metadata');
  });

  describe('Progress Events', () => {
    it('should trigger layoutProgress during force simulation');
    it('should trigger edgeRenderProgress during batched rendering');
    it('should throttle progress updates to configured interval');
    it('should provide accurate progress calculations');
  });

  describe('Interaction Events', () => {
    it('should trigger nodeClick with event and data');
    it('should trigger nodeMouseover/out on hover');
    it('should trigger drag events during node dragging');
    it('should trigger zoom events with transform');
    it('should provide correct this context in callbacks');
  });

  describe('Error Events', () => {
    it('should trigger error event with context');
    it('should indicate if error is recoverable');
    it('should provide fallback strategy in context');
    it('should trigger validationError for data issues');
  });
});
```

### 3. State Machine Tests

```typescript
describe('State Machine', () => {
  describe('State Transitions', () => {
    it('should start in IDLE state');
    it('should transition IDLE -> LOADING on data load');
    it('should transition LOADING -> LAYOUT_CALCULATING on success');
    it('should transition LAYOUT_CALCULATING -> EDGE_RENDERING when stable');
    it('should transition EDGE_RENDERING -> ZOOM_FITTING when complete');
    it('should transition ZOOM_FITTING -> READY when fitted');
    it('should transition to ERROR from any state on error');
    it('should prevent invalid state transitions');
  });

  describe('Progress Tracking', () => {
    it('should track overall progress across all phases');
    it('should calculate layout progress from alpha decay');
    it('should calculate edge progress from batch completion');
    it('should reset progress on state entry');
    it('should reach 100% before state transition');
  });

  describe('State Metadata', () => {
    it('should include phase-specific metadata');
    it('should update metadata during state execution');
    it('should preserve metadata through callbacks');
    it('should include timestamp in metadata');
  });

  describe('Error States', () => {
    it('should capture error context');
    it('should identify recoverable vs non-recoverable');
    it('should provide recovery strategies');
    it('should allow retry from ERROR state');
  });
});
```

### 4. Selection Management Tests

```typescript
describe('Selection Management', () => {
  describe('Node Selection', () => {
    it('should select single node by ID');
    it('should select multiple nodes');
    it('should deselect all nodes');
    it('should toggle selection state');
    it('should respect selectionMode (single/multiple)');
  });

  describe('Neighbor Highlighting', () => {
    it('should highlight immediate neighbors');
    it('should highlight neighbors to specified depth');
    it('should highlight adjacent edges when requested');
    it('should clear highlights independently of selection');
  });

  describe('Selection State', () => {
    it('should return array of selected node IDs');
    it('should return Set of highlighted node IDs');
    it('should return Set of highlighted edge IDs');
    it('should maintain selection through data updates');
  });

  describe('Selection Events', () => {
    it('should trigger selectionChange on any change');
    it('should pass selected and highlighted to callback');
    it('should trigger after programmatic selection');
    it('should trigger after interactive selection');
  });

  describe('Visual Updates', () => {
    it('should update node appearance on selection');
    it('should update edge appearance on highlight');
    it('should apply selection styles via accessors');
    it('should support custom selection styling');
  });
});
```

### 5. Zoom and Pan Tests

```typescript
describe('Zoom and Pan', () => {
  describe('Zoom Behavior', () => {
    it('should create D3 zoom behavior');
    it('should respect zoom extent constraints');
    it('should support programmatic zoom to scale');
    it('should support zoom to specific center');
    it('should trigger zoom event with transform');
  });

  describe('Pan Behavior', () => {
    it('should support programmatic pan');
    it('should center on specific node');
    it('should constrain panning to bounds');
    it('should update transform on pan');
  });

  describe('Fit Operations', () => {
    it('should fit entire graph to viewport');
    it('should apply padding when fitting');
    it('should fit to selected nodes only');
    it('should animate fitting transition');
    it('should trigger zoomFit callback');
  });

  describe('Transform Management', () => {
    it('should get current transform');
    it('should set transform programmatically');
    it('should reset to identity transform');
    it('should persist transform through re-render');
  });

  describe('Enable/Disable', () => {
    it('should enable/disable zoom');
    it('should enable/disable pan');
    it('should remove behaviors when disabled');
    it('should restore behaviors when re-enabled');
  });
});
```

### 6. Force Simulation Tests

```typescript
describe('Force Simulation', () => {
  describe('Simulation Access', () => {
    it('should provide D3 force simulation');
    it('should allow force modification');
    it('should support adding custom forces');
    it('should support removing forces');
  });

  describe('Simulation Control', () => {
    it('should reheat simulation with alpha');
    it('should stop simulation');
    it('should restart simulation');
    it('should tick simulation manually');
  });

  describe('Force Configuration', () => {
    it('should apply charge force with accessor');
    it('should apply link force with distance/strength');
    it('should apply collision force with radius');
    it('should apply center force');
  });

  describe('Simulation Events', () => {
    it('should update positions on tick');
    it('should trigger layoutProgress during simulation');
    it('should detect stability threshold');
    it('should timeout if not stabilizing');
  });

  describe('Drag Integration', () => {
    it('should fix node position during drag');
    it('should reheat simulation on drag start');
    it('should cool simulation on drag end');
    it('should update positions during drag');
  });
});
```

### 7. Data Management Tests

```typescript
describe('Data Management', () => {
  describe('Data Loading', () => {
    it('should accept GraphData structure');
    it('should validate node IDs are unique');
    it('should validate edge references exist');
    it('should handle empty datasets');
  });

  describe('Data Updates', () => {
    it('should update entire dataset');
    it('should add nodes incrementally');
    it('should remove nodes and connected edges');
    it('should merge partial updates');
  });

  describe('Batch Operations', () => {
    it('should batch multiple updates');
    it('should defer rendering until batch end');
    it('should maintain consistency during batch');
    it('should trigger single re-render');
  });

  describe('Data Validation', () => {
    it('should detect missing node references');
    it('should detect circular references');
    it('should validate data types');
    it('should trigger validationError callback');
  });

  describe('Data Binding', () => {
    it('should bind data to D3 selections');
    it('should use key function for updates');
    it('should handle enter/update/exit');
    it('should maintain data consistency');
  });
});
```

## Integration Test Requirements

### 1. Rendering Pipeline Tests

```typescript
describe('Rendering Pipeline', () => {
  describe('Progressive Rendering', () => {
    it('should hide graph during layout calculation');
    it('should show graph after edge rendering');
    it('should batch edge rendering in chunks');
    it('should update progress during each phase');
  });

  describe('Immediate Rendering', () => {
    it('should render all elements immediately');
    it('should skip progressive phases');
    it('should complete faster for small graphs');
  });

  describe('Deferred Rendering', () => {
    it('should wait for explicit render call');
    it('should queue updates during deferral');
    it('should apply all updates on render');
  });

  describe('Edge Rendering Modes', () => {
    it('should render simple edges as straight lines');
    it('should bundle edges with FDEB algorithm');
    it('should render curved edges with D3 curves');
    it('should fall back on bundling errors');
  });
});
```

### 2. Interaction Flow Tests

```typescript
describe('Interaction Flow', () => {
  describe('Click Selection Flow', () => {
    it('should select node on click');
    it('should highlight neighbors');
    it('should update visual styles');
    it('should trigger selection callbacks');
  });

  describe('Hover Interaction Flow', () => {
    it('should highlight on mouseover');
    it('should clear on mouseout');
    it('should show tooltips if configured');
    it('should not interfere with selection');
  });

  describe('Drag Interaction Flow', () => {
    it('should start drag on mousedown');
    it('should update position during drag');
    it('should fix position temporarily');
    it('should trigger re-layout on release');
  });

  describe('Zoom Interaction Flow', () => {
    it('should zoom on wheel/pinch');
    it('should pan on drag with modifier');
    it('should respect zoom constraints');
    it('should update all elements');
  });
});
```

### 3. Error Recovery Tests

```typescript
describe('Error Recovery', () => {
  describe('Data Error Recovery', () => {
    it('should handle invalid node references gracefully');
    it('should filter out invalid edges');
    it('should continue with valid data');
    it('should report validation errors');
  });

  describe('Rendering Error Recovery', () => {
    it('should fall back from bundled to simple edges');
    it('should reduce visual complexity on memory pressure');
    it('should handle WebGL context loss');
    it('should retry failed operations');
  });

  describe('Interaction Error Recovery', () => {
    it('should handle selection of non-existent nodes');
    it('should recover from transform calculation errors');
    it('should reset to safe state on critical errors');
  });

  describe('State Recovery', () => {
    it('should transition from ERROR to IDLE');
    it('should allow retry of failed operation');
    it('should preserve valid state data');
    it('should clear error state on success');
  });
});
```

### 4. Performance Tests

```typescript
describe('Performance', () => {
  describe('Large Dataset Handling', () => {
    it('should handle 1000 nodes efficiently');
    it('should handle 5000 edges efficiently');
    it('should maintain 30+ FPS during interaction');
    it('should use appropriate batching');
  });

  describe('Memory Management', () => {
    it('should clean up on dispose');
    it('should not leak event listeners');
    it('should release D3 selections');
    it('should garbage collect removed nodes');
  });

  describe('Rendering Optimization', () => {
    it('should throttle progress updates');
    it('should debounce resize events');
    it('should batch DOM updates');
    it('should use requestAnimationFrame');
  });

  describe('Performance Monitoring', () => {
    it('should track FPS accurately');
    it('should measure phase durations');
    it('should detect frame drops');
    it('should trigger performance callbacks');
  });
});
```

## End-to-End Test Requirements

### Complete Workflow Tests

```typescript
describe('Complete Workflow', () => {
  it('should load -> calculate -> render -> interact successfully');
  it('should handle data update -> transition -> re-render');
  it('should recover from errors and continue');
  it('should maintain state through full lifecycle');
  it('should clean up completely on dispose');
});
```

### Demo Scenario Tests

```typescript
describe('Demo Scenarios', () => {
  it('should show 5-phase loading with progress');
  it('should demonstrate node selection with highlighting');
  it('should show zoom/pan interactions');
  it('should display performance metrics');
  it('should handle tab visibility changes');
  it('should work with provided sample datasets');
});
```

## Test Utilities

### Mock Data Generators

```typescript
// Generate test graph data
function generateMockGraph(nodeCount: number, edgeCount: number): GraphData;
function generateClusteredGraph(clusters: number, nodesPerCluster: number): GraphData;
function generateHierarchicalGraph(levels: number, branching: number): GraphData;
function generateRandomGraph(nodeCount: number, edgeProbability: number): GraphData;

// Generate specific structures
function generateStarGraph(centerNode: Node, satellites: number): GraphData;
function generateGridGraph(rows: number, cols: number): GraphData;
function generateCompleteGraph(nodeCount: number): GraphData;
```

### Test Helpers

```typescript
// DOM helpers
function createContainer(): HTMLElement;
function cleanupDOM(): void;

// Event helpers
function simulateClick(element: SVGElement): void;
function simulateHover(element: SVGElement): void;
function simulateDrag(element: SVGElement, dx: number, dy: number): void;
function simulateZoom(scale: number, center?: [number, number]): void;

// State helpers
async function waitForState(graph: any, state: string): Promise<void>;
async function waitForReady(graph: any): Promise<void>;
async function waitForProgress(graph: any, progress: number): Promise<void>;

// Assertion helpers
function expectNodeSelected(graph: any, nodeId: string): void;
function expectNodesHighlighted(graph: any, nodeIds: string[]): void;
function expectTransform(graph: any, scale: number, x: number, y: number): void;
```

### Performance Utilities

```typescript
// Performance measurement
function measureRenderTime(graph: any, data: GraphData): number;
function measureFPS(callback: () => void, duration: number): number;
function profileMemory(operation: () => void): MemoryProfile;

// Performance assertions
function expectRenderTime(ms: number): Matcher;
function expectFPS(fps: number): Matcher;
function expectMemoryUsage(mb: number): Matcher;
```

## Coverage Requirements

### Code Coverage Targets

- **Overall**: ≥ 90%
- **Statements**: ≥ 90%
- **Branches**: ≥ 85%
- **Functions**: ≥ 95%
- **Lines**: ≥ 90%

### Critical Path Coverage

Must have 100% coverage for:
- State machine transitions
- Event callback execution
- Error recovery paths
- Data validation
- Public API methods

## Test Execution

### Test Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run performance tests
npm run test:performance
```

### CI/CD Integration

```yaml
# GitHub Actions example
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
    - run: npm ci
    - run: npm run test:coverage
    - uses: codecov/codecov-action@v3
```

## Test Documentation

### Test Naming Convention

```typescript
// Format: should [expected behavior] when [condition]
it('should trigger stateChange callback when state transitions');
it('should highlight neighbors when node is selected with highlightNeighbors option');
it('should fall back to simple edges when bundling fails');
```

### Test Documentation

Each test file must include:
- Purpose description
- Setup requirements
- Cleanup requirements
- Related API sections
- Known limitations

## Regression Tests

### Required Regression Tests

- State machine edge cases from v1.x
- Memory leaks from v2.x
- Performance degradation scenarios
- Browser compatibility issues
- D3.js version compatibility

### Regression Test Process

1. Add test for every bug fix
2. Add test for every edge case discovered
3. Maintain regression test suite separately
4. Run regression tests before releases

## Visual Regression Tests

### Snapshot Testing

```typescript
describe('Visual Regression', () => {
  it('should match snapshot for basic graph');
  it('should match snapshot for selected state');
  it('should match snapshot for bundled edges');
  it('should match snapshot after zoom/pan');
});
```

### Visual Test Requirements

- Consistent test data
- Fixed viewport dimensions
- Deterministic layouts (seed random)
- Platform-independent rendering

## Accessibility Tests

### ARIA Compliance

```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels');
  it('should support keyboard navigation');
  it('should announce state changes');
  it('should provide text alternatives');
});
```

## Performance Benchmarks

### Required Benchmarks

```typescript
describe('Performance Benchmarks', () => {
  benchmark('render 100 nodes', () => {
    // Target: < 500ms
  });
  
  benchmark('render 1000 nodes', () => {
    // Target: < 2000ms
  });
  
  benchmark('select node with 50 neighbors', () => {
    // Target: < 100ms
  });
  
  benchmark('zoom operation', () => {
    // Target: < 16ms (60 FPS)
  });
});
```

## Test Review Checklist

- [ ] All public APIs have tests
- [ ] All callbacks are tested
- [ ] All state transitions are tested
- [ ] All error paths are tested
- [ ] Performance requirements are validated
- [ ] Accessibility requirements are met
- [ ] Visual regression tests pass
- [ ] Documentation examples work
- [ ] Cross-browser tests pass
- [ ] Memory leak tests pass

## References

- [Vitest Documentation](https://vitest.dev/)
- [D3.js Testing Guide](https://github.com/d3/d3/blob/main/test/README.md)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
