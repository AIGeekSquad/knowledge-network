# Knowledge Network Layout Engine API Contract
## D3.js Idiomatic Implementation Contract

## Overview

This document defines the precise API contract for the Knowledge Network Layout Engine, specifying all methods, callbacks, data structures, and behaviors. This contract serves as the definitive interface specification for implementation and testing.

## Module Export Contract

```typescript
// Main module export
export function knowledgeNetwork(): KnowledgeNetworkGraph;

// Type definition
export interface KnowledgeNetworkGraph {
  // Core render function (D3 selection call pattern)
  (selection: d3.Selection<any, GraphData, any, any>): void;
  
  // All configuration and interaction methods...
}
```

## Configuration Methods Contract

### Dimension Configuration

```typescript
interface DimensionMethods {
  width(): number;
  width(value: number): KnowledgeNetworkGraph;
  
  height(): number;
  height(value: number): KnowledgeNetworkGraph;
  
  padding(): number;
  padding(value: number): KnowledgeNetworkGraph;
}
```

### Node Configuration

```typescript
interface NodeMethods {
  nodeRadius(): Accessor<Node, number>;
  nodeRadius(value: number | ((d: Node, i: number, nodes: Node[]) => number)): KnowledgeNetworkGraph;
  
  nodeFill(): Accessor<Node, string>;
  nodeFill(value: string | ((d: Node, i: number, nodes: Node[]) => string)): KnowledgeNetworkGraph;
  
  nodeStroke(): Accessor<Node, string>;
  nodeStroke(value: string | ((d: Node, i: number, nodes: Node[]) => string)): KnowledgeNetworkGraph;
  
  nodeStrokeWidth(): Accessor<Node, number>;
  nodeStrokeWidth(value: number | ((d: Node, i: number, nodes: Node[]) => number)): KnowledgeNetworkGraph;
  
  nodeOpacity(): Accessor<Node, number>;
  nodeOpacity(value: number | ((d: Node, i: number, nodes: Node[]) => number)): KnowledgeNetworkGraph;
  
  nodeLabel(): Accessor<Node, string>;
  nodeLabel(value: string | ((d: Node, i: number, nodes: Node[]) => string)): KnowledgeNetworkGraph;
}
```

### Edge Configuration

```typescript
interface EdgeMethods {
  linkDistance(): Accessor<Edge, number>;
  linkDistance(value: number | ((d: Edge, i: number, edges: Edge[]) => number)): KnowledgeNetworkGraph;
  
  linkStrength(): Accessor<Edge, number>;
  linkStrength(value: number | ((d: Edge, i: number, edges: Edge[]) => number)): KnowledgeNetworkGraph;
  
  linkStroke(): Accessor<Edge, string>;
  linkStroke(value: string | ((d: Edge, i: number, edges: Edge[]) => string)): KnowledgeNetworkGraph;
  
  linkStrokeWidth(): Accessor<Edge, number>;
  linkStrokeWidth(value: number | ((d: Edge, i: number, edges: Edge[]) => number)): KnowledgeNetworkGraph;
  
  linkOpacity(): Accessor<Edge, number>;
  linkOpacity(value: number | ((d: Edge, i: number, edges: Edge[]) => number)): KnowledgeNetworkGraph;
}
```

### Force Simulation Configuration

```typescript
interface ForceMethods {
  chargeStrength(): Accessor<Node, number>;
  chargeStrength(value: number | ((d: Node, i: number, nodes: Node[]) => number)): KnowledgeNetworkGraph;
  
  collisionRadius(): Accessor<Node, number>;
  collisionRadius(value: number | ((d: Node, i: number, nodes: Node[]) => number)): KnowledgeNetworkGraph;
  
  alphaDecay(): number;
  alphaDecay(value: number): KnowledgeNetworkGraph;
  
  velocityDecay(): number;
  velocityDecay(value: number): KnowledgeNetworkGraph;
  
  alphaMin(): number;
  alphaMin(value: number): KnowledgeNetworkGraph;
  
  alphaTarget(): number;
  alphaTarget(value: number): KnowledgeNetworkGraph;
}
```

### Rendering Configuration

```typescript
interface RenderingMethods {
  edgeRenderer(): 'simple' | 'bundled' | 'curved';
  edgeRenderer(value: 'simple' | 'bundled' | 'curved'): KnowledgeNetworkGraph;
  
  bundlingStrength(): number;
  bundlingStrength(value: number): KnowledgeNetworkGraph;
  
  bundlingIterations(): number;
  bundlingIterations(value: number): KnowledgeNetworkGraph;
  
  bundlingCompatibility(): number;
  bundlingCompatibility(value: number): KnowledgeNetworkGraph;
  
  renderMode(): 'immediate' | 'progressive' | 'deferred';
  renderMode(value: 'immediate' | 'progressive' | 'deferred'): KnowledgeNetworkGraph;
  
  hideGraphDuringLayout(): boolean;
  hideGraphDuringLayout(value: boolean): KnowledgeNetworkGraph;
  
  waitForStableLayout(): boolean;
  waitForStableLayout(value: boolean): KnowledgeNetworkGraph;
  
  stabilityThreshold(): number;
  stabilityThreshold(value: number): KnowledgeNetworkGraph;
  
  maxLayoutDuration(): number;
  maxLayoutDuration(value: number): KnowledgeNetworkGraph;
}
```

### Interaction Configuration

```typescript
interface InteractionMethods {
  enableZoom(): boolean;
  enableZoom(value: boolean): KnowledgeNetworkGraph;
  
  zoomExtent(): [number, number];
  zoomExtent(value: [number, number]): KnowledgeNetworkGraph;
  
  enablePan(): boolean;
  enablePan(value: boolean): KnowledgeNetworkGraph;
  
  enableDrag(): boolean;
  enableDrag(value: boolean): KnowledgeNetworkGraph;
  
  enableSelection(): boolean;
  enableSelection(value: boolean): KnowledgeNetworkGraph;
  
  selectionMode(): 'single' | 'multiple';
  selectionMode(value: 'single' | 'multiple'): KnowledgeNetworkGraph;
  
  neighborHighlightDepth(): number;
  neighborHighlightDepth(value: number): KnowledgeNetworkGraph;
}
```

## Event Callback Contract

### Event Registration

```typescript
interface EventMethods {
  on(event: 'stateChange', callback: StateChangeCallback): KnowledgeNetworkGraph;
  on(event: 'layoutProgress', callback: LayoutProgressCallback): KnowledgeNetworkGraph;
  on(event: 'edgeRenderStart', callback: EdgeRenderStartCallback): KnowledgeNetworkGraph;
  on(event: 'edgeRenderProgress', callback: EdgeRenderProgressCallback): KnowledgeNetworkGraph;
  on(event: 'edgeRenderComplete', callback: EdgeRenderCompleteCallback): KnowledgeNetworkGraph;
  on(event: 'zoomFit', callback: ZoomFitCallback): KnowledgeNetworkGraph;
  on(event: 'ready', callback: ReadyCallback): KnowledgeNetworkGraph;
  on(event: 'error', callback: ErrorCallback): KnowledgeNetworkGraph;
  on(event: 'nodeClick', callback: NodeEventCallback): KnowledgeNetworkGraph;
  on(event: 'nodeMouseover', callback: NodeEventCallback): KnowledgeNetworkGraph;
  on(event: 'nodeMouseout', callback: NodeEventCallback): KnowledgeNetworkGraph;
  on(event: 'edgeClick', callback: EdgeEventCallback): KnowledgeNetworkGraph;
  on(event: 'edgeMouseover', callback: EdgeEventCallback): KnowledgeNetworkGraph;
  on(event: 'edgeMouseout', callback: EdgeEventCallback): KnowledgeNetworkGraph;
  on(event: 'zoom', callback: ZoomCallback): KnowledgeNetworkGraph;
  on(event: 'dragStart', callback: DragCallback): KnowledgeNetworkGraph;
  on(event: 'drag', callback: DragCallback): KnowledgeNetworkGraph;
  on(event: 'dragEnd', callback: DragCallback): KnowledgeNetworkGraph;
  on(event: 'selectionChange', callback: SelectionChangeCallback): KnowledgeNetworkGraph;
  on(event: 'performanceUpdate', callback: PerformanceCallback): KnowledgeNetworkGraph;
  on(event: 'frameDrop', callback: FrameDropCallback): KnowledgeNetworkGraph;
  on(event: 'validationError', callback: ValidationErrorCallback): KnowledgeNetworkGraph;
  
  // Get current callback
  on(event: string): Function | undefined;
  
  // Remove callback
  on(event: string, null): KnowledgeNetworkGraph;
}
```

### Callback Type Definitions

```typescript
// State management callbacks
type StateChangeCallback = (
  state: LayoutState,
  progress: number,
  metadata: StateMetadata
) => void;

type LayoutProgressCallback = (
  progress: number,
  alpha: number,
  metadata: LayoutMetadata
) => void;

// Edge rendering callbacks
type EdgeRenderStartCallback = (
  totalEdges: number,
  renderMode: 'simple' | 'bundled' | 'curved'
) => void;

type EdgeRenderProgressCallback = (
  rendered: number,
  total: number,
  batchInfo: BatchInfo
) => void;

type EdgeRenderCompleteCallback = (
  renderStats: RenderStats
) => void;

// Viewport callbacks
type ZoomFitCallback = (
  transform: d3.ZoomTransform
) => void;

// Lifecycle callbacks
type ReadyCallback = (
  stats: GraphStats
) => void;

type ErrorCallback = (
  error: Error,
  context: ErrorContext
) => void;

// Interaction callbacks
type NodeEventCallback = (
  event: MouseEvent,
  d: Node,
  element: SVGElement
) => void;

type EdgeEventCallback = (
  event: MouseEvent,
  d: Edge,
  element: SVGElement
) => void;

type ZoomCallback = (
  transform: d3.ZoomTransform
) => void;

type DragCallback = (
  event: d3.D3DragEvent<SVGElement, Node, Node>,
  d: Node
) => void;

type SelectionChangeCallback = (
  selected: string[],
  highlighted: Set<string>
) => void;

// Performance callbacks
type PerformanceCallback = (
  metrics: PerformanceMetrics
) => void;

type FrameDropCallback = (
  info: FrameDropInfo
) => void;

// Validation callbacks
type ValidationErrorCallback = (
  errors: ValidationError[]
) => void;
```

## Data Structure Contract

### Input Data Structures

```typescript
interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface Node {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;  // Fixed x position
  fy?: number;  // Fixed y position
  vector?: number[];
  metadata?: Record<string, unknown>;
  // Runtime properties added by D3
  index?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  id?: string;
  source: string | Node;
  target: string | Node;
  label?: string;
  type?: string;
  weight?: number;
  strength?: number;
  metadata?: Record<string, unknown>;
  // Runtime properties added by D3
  index?: number;
}
```

### State and Metadata Structures

```typescript
enum LayoutState {
  IDLE = 'idle',
  LOADING = 'loading',
  LAYOUT_CALCULATING = 'layout_calculating',
  EDGE_RENDERING = 'edge_rendering',
  ZOOM_FITTING = 'zoom_fitting',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

interface StateMetadata {
  phase?: string;
  nodesLoaded?: number;
  edgesLoaded?: number;
  validationStatus?: 'success' | 'warning' | 'error';
  errors?: ValidationError[];
  timestamp?: number;
}

interface LayoutMetadata {
  iterations: number;
  stability: number;
  converging: boolean;
  estimatedCompletion?: number;
  alpha: number;
  alphaTarget: number;
  alphaMin: number;
}

interface BatchInfo {
  batchSize: number;
  currentBatch: number;
  totalBatches: number;
  estimatedTimeRemaining?: number;
}

interface RenderStats {
  totalEdges: number;
  renderTime: number;
  mode: 'simple' | 'bundled' | 'curved';
  bundlingIterations?: number;
  bundlingTime?: number;
}

interface GraphStats {
  renderTime: number;
  layoutTime: number;
  edgeRenderTime: number;
  nodeCount: number;
  edgeCount: number;
  layoutIterations: number;
  finalAlpha: number;
}

interface ErrorContext {
  phase: LayoutState;
  operation: string;
  recoverable: boolean;
  fallback?: string;
  data?: Record<string, unknown>;
}

interface PerformanceMetrics {
  fps: number;
  renderTime: number;
  layoutTime: number;
  edgeRenderTime: number;
  memoryUsage?: number;
  nodeCount: number;
  edgeCount: number;
  visibleNodes: number;
  visibleEdges: number;
}

interface FrameDropInfo {
  targetFPS: number;
  actualFPS: number;
  duration: number;
  cause?: string;
}

interface ValidationError {
  type: 'missing_node' | 'missing_edge' | 'invalid_data' | 'circular_reference';
  message: string;
  nodeId?: string;
  edgeId?: string;
  data?: unknown;
}
```

## Operational Methods Contract

### Data Management

```typescript
interface DataMethods {
  data(): GraphData | null;
  data(value: GraphData): KnowledgeNetworkGraph;
  
  addNodes(nodes: Node[]): KnowledgeNetworkGraph;
  addEdges(edges: Edge[]): KnowledgeNetworkGraph;
  removeNodes(nodeIds: string[]): KnowledgeNetworkGraph;
  removeEdges(edgeIds: string[]): KnowledgeNetworkGraph;
  
  updateData(data: Partial<GraphData>, options?: UpdateOptions): KnowledgeNetworkGraph;
  
  startBatch(): KnowledgeNetworkGraph;
  endBatch(): KnowledgeNetworkGraph;
}

interface UpdateOptions {
  merge?: boolean;
  key?: (d: Node | Edge) => string;
  updateOnly?: boolean;
  transition?: boolean;
  duration?: number;
}
```

### Selection Management

```typescript
interface SelectionMethods {
  selectNode(nodeId: string, options?: SelectionOptions): KnowledgeNetworkGraph;
  selectNodes(nodeIds: string[]): KnowledgeNetworkGraph;
  deselectAll(): KnowledgeNetworkGraph;
  
  selectedNodes(): string[];
  highlightedNodes(): Set<string>;
  highlightedEdges(): Set<string>;
  
  highlightNodes(nodeIds: string[]): KnowledgeNetworkGraph;
  highlightEdges(edgeIds: string[]): KnowledgeNetworkGraph;
  clearHighlights(): KnowledgeNetworkGraph;
  
  neighbors(nodeId: string, depth?: number): string[];
  adjacentEdges(nodeId: string): string[];
}

interface SelectionOptions {
  highlightNeighbors?: boolean;
  depth?: number;
  includeEdges?: boolean;
  exclusive?: boolean;
}
```

### Zoom and Pan Control

```typescript
interface ZoomPanMethods {
  zoom(): d3.ZoomBehavior<SVGSVGElement, unknown>;
  
  zoomTo(scale: number, center?: [number, number]): KnowledgeNetworkGraph;
  zoomToFit(padding?: number): KnowledgeNetworkGraph;
  zoomToSelection(padding?: number): KnowledgeNetworkGraph;
  resetZoom(): KnowledgeNetworkGraph;
  
  panTo(x: number, y: number): KnowledgeNetworkGraph;
  centerOn(nodeId: string): KnowledgeNetworkGraph;
  
  getTransform(): d3.ZoomTransform;
  setTransform(transform: d3.ZoomTransform): KnowledgeNetworkGraph;
}
```

### Force Simulation Access

```typescript
interface SimulationMethods {
  simulation(): d3.Simulation<Node, Edge> | null;
  
  force(name: string): d3.Force<Node, Edge> | undefined;
  force(name: string, force: d3.Force<Node, Edge> | null): KnowledgeNetworkGraph;
  
  reheat(alpha?: number): KnowledgeNetworkGraph;
  stop(): KnowledgeNetworkGraph;
  restart(): KnowledgeNetworkGraph;
  
  tick(iterations?: number): KnowledgeNetworkGraph;
}
```

### DOM Selection Access

```typescript
interface DOMSelectionMethods {
  nodes(): d3.Selection<SVGElement, Node, any, any>;
  edges(): d3.Selection<SVGElement, Edge, any, any>;
  labels(): d3.Selection<SVGTextElement, Node, any, any>;
  
  container(): d3.Selection<SVGGElement, unknown, null, undefined>;
  svg(): d3.Selection<SVGSVGElement, unknown, null, undefined>;
}
```

### Lifecycle Management

```typescript
interface LifecycleMethods {
  init(container: HTMLElement | d3.Selection<HTMLElement, any, any, any>): KnowledgeNetworkGraph;
  render(): KnowledgeNetworkGraph;
  dispose(): KnowledgeNetworkGraph;
  
  isReady(): boolean;
  getState(): LayoutState;
  getProgress(): number;
}
```

## Behavior Contracts

### State Transition Rules

```typescript
const StateTransitions: Record<LayoutState, LayoutState[]> = {
  IDLE: [LayoutState.LOADING, LayoutState.DISPOSED],
  LOADING: [LayoutState.LAYOUT_CALCULATING, LayoutState.ERROR],
  LAYOUT_CALCULATING: [LayoutState.EDGE_RENDERING, LayoutState.ERROR],
  EDGE_RENDERING: [LayoutState.ZOOM_FITTING, LayoutState.ERROR],
  ZOOM_FITTING: [LayoutState.READY, LayoutState.ERROR],
  READY: [LayoutState.LOADING, LayoutState.DISPOSED],
  ERROR: [LayoutState.IDLE, LayoutState.LOADING, LayoutState.DISPOSED],
  DISPOSED: []
};
```

### Callback Execution Order

1. **Initialization Phase**
   - `init` event
   - `stateChange` (IDLE)

2. **Loading Phase**
   - `stateChange` (LOADING)
   - `validationError` (if validation fails)
   - Data preprocessing

3. **Layout Phase**
   - `stateChange` (LAYOUT_CALCULATING)
   - `layoutProgress` (multiple times during simulation)
   - Force simulation ticks

4. **Edge Rendering Phase**
   - `stateChange` (EDGE_RENDERING)
   - `edgeRenderStart`
   - `edgeRenderProgress` (per batch)
   - `edgeRenderComplete`

5. **Zoom Fitting Phase**
   - `stateChange` (ZOOM_FITTING)
   - `zoomFit`

6. **Ready Phase**
   - `stateChange` (READY)
   - `ready`

7. **Error Handling**
   - `error` (at any phase)
   - `stateChange` (ERROR)

### Progress Calculation Contract

```typescript
interface ProgressCalculation {
  // Overall progress (0-1)
  overall(): number;
  
  // Phase-specific progress (0-1)
  loading(): number;
  layout(): number;
  edgeRendering(): number;
  zoomFitting(): number;
  
  // Progress calculation formulas
  calculateLayoutProgress(alpha: number, alphaMin: number): number;
  calculateEdgeProgress(rendered: number, total: number): number;
  calculateZoomProgress(elapsed: number, duration: number): number;
}

// Layout progress formula
const layoutProgress = (alpha: number, alphaMin: number, alphaTarget: number): number => {
  return 1 - Math.max(0, Math.min(1, (alpha - alphaMin) / (alphaTarget - alphaMin)));
};

// Edge rendering progress formula  
const edgeProgress = (rendered: number, total: number): number => {
  return total > 0 ? rendered / total : 0;
};
```

### Error Recovery Contract

```typescript
interface ErrorRecovery {
  // Automatic recovery strategies
  automaticRecovery: {
    bundlingFallback: () => void;  // Fall back to simple edges
    memoryReduction: () => void;   // Reduce visual complexity
    dataValidation: () => void;    // Fix data issues
  };
  
  // Manual recovery methods
  recover(strategy: 'fallback' | 'retry' | 'reset'): KnowledgeNetworkGraph;
  retryLastOperation(): KnowledgeNetworkGraph;
  resetToSafeState(): KnowledgeNetworkGraph;
}
```

## Performance Guarantees

### Rendering Performance

```typescript
interface PerformanceGuarantees {
  // Maximum time for operations
  maxLayoutTime: 5000;      // 5 seconds
  maxEdgeRenderTime: 3000;  // 3 seconds
  maxZoomFitTime: 750;      // 750ms
  
  // Batch sizes
  defaultEdgeBatchSize: 100;
  minBatchSize: 10;
  maxBatchSize: 1000;
  
  // Frame rate targets
  targetFPS: 60;
  minAcceptableFPS: 30;
  
  // Memory limits
  maxNodes: 10000;
  maxEdges: 50000;
}
```

### Throttling and Debouncing

```typescript
interface ThrottleSettings {
  progressUpdateInterval: 16;    // ~60 FPS
  performanceUpdateInterval: 100; // 10 updates/second
  resizeDebounce: 250;
  selectionDebounce: 50;
}
```

## Compatibility Contract

### Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### D3.js Version

- D3.js v7.x required
- Uses d3-selection, d3-force, d3-zoom, d3-drag, d3-transition

### TypeScript Support

- Full TypeScript definitions included
- Supports strict mode
- Generic type parameters for custom node/edge data

## Testing Contract

### Required Test Coverage

```typescript
interface TestRequirements {
  unitTests: {
    configuration: ['chaining', 'accessors', 'defaults'];
    events: ['registration', 'removal', 'triggering', 'order'];
    state: ['transitions', 'progress', 'metadata'];
    selection: ['single', 'multiple', 'neighbors', 'highlights'];
    zoom: ['programmatic', 'constraints', 'transforms'];
    data: ['updates', 'batching', 'validation'];
  };
  
  integrationTests: {
    rendering: ['immediate', 'progressive', 'deferred'];
    interaction: ['click', 'hover', 'drag', 'zoom'];
    performance: ['large-datasets', 'memory-usage', 'frame-rate'];
    errorHandling: ['recovery', 'fallback', 'validation'];
  };
  
  e2eTests: {
    workflows: ['load-render-interact', 'update-transition', 'error-recovery'];
  };
}
```

### Test Utilities

```typescript
// Test helper functions
function createMockGraph(nodeCount: number, edgeCount: number): GraphData;
function simulateInteraction(graph: KnowledgeNetworkGraph, type: string, target: string): void;
function waitForState(graph: KnowledgeNetworkGraph, state: LayoutState): Promise<void>;
function measurePerformance(graph: KnowledgeNetworkGraph, data: GraphData): PerformanceMetrics;
```

## Version and Deprecation

### Semantic Versioning

- MAJOR: Breaking changes to API contract
- MINOR: New methods or events (backward compatible)
- PATCH: Bug fixes and performance improvements

### Deprecation Policy

- Deprecated features marked with `@deprecated` JSDoc
- Minimum 2 minor versions before removal
- Migration guide provided for breaking changes

## Contract Validation

### Runtime Validation

```typescript
interface ContractValidation {
  validateData(data: GraphData): ValidationResult;
  validateConfiguration(config: any): ValidationResult;
  validateCallback(event: string, callback: Function): ValidationResult;
  validateState(from: LayoutState, to: LayoutState): boolean;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}
```

### Development Mode Checks

- Type checking for all inputs
- State transition validation
- Callback parameter validation
- Performance threshold warnings

## Examples

### Basic Usage

```typescript
import { knowledgeNetwork } from '@knowledge-network/layout-engine';

const graph = knowledgeNetwork()
  .width(800)
  .height(600)
  .on('ready', () => console.log('Graph ready'));

d3.select('#container')
  .datum(graphData)
  .call(graph);
```

### Advanced Configuration

```typescript
const graph = knowledgeNetwork()
  // Configuration
  .nodeRadius(d => Math.sqrt(d.value) * 3)
  .edgeRenderer('bundled')
  .bundlingStrength(0.85)
  
  // State callbacks
  .on('stateChange', (state, progress) => {
    updateUI(state, progress);
  })
  
  // Interaction callbacks
  .on('nodeClick', (event, d) => {
    graph.selectNode(d.id, { highlightNeighbors: true });
  })
  
  // Performance monitoring
  .on('performanceUpdate', metrics => {
    if (metrics.fps < 30) {
      graph.edgeRenderer('simple');  // Fallback to simpler rendering
    }
  });
```

## Contract Compliance

Implementation MUST:
1. Support all specified methods with exact signatures
2. Trigger callbacks in specified order
3. Maintain state transition rules
4. Meet performance guarantees
5. Provide complete TypeScript definitions
6. Pass all contract validation tests

## References

- [D3.js v7 API](https://github.com/d3/d3/blob/main/API.md)
- [Web Performance API](https://developer.mozilla.org/en-US/docs/Web/API/Performance_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
