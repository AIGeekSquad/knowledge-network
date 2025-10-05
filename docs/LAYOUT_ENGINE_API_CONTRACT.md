# Knowledge Network Layout Engine API Contract

## Overview

This document defines the complete TypeScript API contract for the Knowledge Network Layout Engine. All interfaces, types, and enums specified here form the binding contract between the layout engine and consuming applications.

## Core Types and Enums

### Engine States

```typescript
/**
 * Enumeration of all possible engine states
 */
export enum EngineState {
  IDLE = 'idle',
  LOADING = 'loading',
  LAYOUT_CALCULATING = 'layout_calculating',
  EDGE_GENERATING = 'edge_generating',
  ZOOM_FITTING = 'zoom_fitting',
  READY = 'ready',
  ERROR = 'error',
  DISPOSED = 'disposed'
}

/**
 * Edge rendering modes
 */
export enum EdgeRenderMode {
  SIMPLE = 'simple',
  BUNDLED = 'bundled',
  CURVED = 'curved'
}

/**
 * Diagnostic event types for monitoring
 */
export enum DiagnosticEventType {
  // Performance events
  RENDER_START = 'render_start',
  RENDER_PHASE_COMPLETE = 'render_phase_complete',
  FRAME_DROP = 'frame_drop',
  MEMORY_WARNING = 'memory_warning',
  
  // State events
  STATE_TRANSITION = 'state_transition',
  PROGRESS_UPDATE = 'progress_update',
  
  // Interaction events
  USER_INTERACTION = 'user_interaction',
  SELECTION_CHANGE = 'selection_change',
  ZOOM_CHANGE = 'zoom_change',
  PAN_CHANGE = 'pan_change',
  
  // Error events
  ERROR_OCCURRED = 'error_occurred',
  RECOVERY_ATTEMPTED = 'recovery_attempted',
  RECOVERY_SUCCESS = 'recovery_success',
  RECOVERY_FAILED = 'recovery_failed',
  
  // Data events
  DATA_LOADED = 'data_loaded',
  DATA_VALIDATED = 'data_validated',
  DATA_PREPROCESSED = 'data_preprocessed'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * Layout algorithms available
 */
export enum LayoutAlgorithm {
  FORCE = 'force',
  HIERARCHICAL = 'hierarchical',
  CIRCULAR = 'circular',
  GRID = 'grid'
}
```

## Data Structures

### Graph Data

```typescript
/**
 * Node representation in the graph
 */
export interface Node {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;  // Fixed x position
  fy?: number;  // Fixed y position
  fz?: number;  // Fixed z position
  vector?: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Edge representation in the graph
 */
export interface Edge {
  id?: string;
  source: string | Node;
  target: string | Node;
  label?: string;
  type?: string;
  weight?: number;
  strength?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Complete graph data structure
 */
export interface GraphData {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    title?: string;
    description?: string;
    version?: string;
    [key: string]: unknown;
  };
}
```

### State Metadata

```typescript
/**
 * Base metadata for all states
 */
export interface StateMetadata {
  timestamp: number;
  previousState?: EngineState;
  [key: string]: unknown;
}

/**
 * Loading state metadata
 */
export interface LoadingMetadata extends StateMetadata {
  nodesLoaded: number;
  edgesLoaded: number;
  totalNodes: number;
  totalEdges: number;
  validationStatus: 'pending' | 'validating' | 'valid' | 'invalid';
  validationErrors?: string[];
}

/**
 * Layout calculation metadata
 */
export interface LayoutMetadata extends StateMetadata {
  alpha: number;
  alphaTarget: number;
  iterations: number;
  stabilityMetric: number;
  nodePositions?: Map<string, { x: number; y: number; z?: number }>;
  layoutAlgorithm: LayoutAlgorithm;
}

/**
 * Edge rendering metadata
 */
export interface EdgeRenderingMetadata extends StateMetadata {
  edgesProcessed: number;
  totalEdges: number;
  renderMode: EdgeRenderMode;
  bundlingProgress?: number;
  bundlingIterations?: number;
  renderBatches?: number;
}

/**
 * Zoom fitting metadata
 */
export interface ZoomFitMetadata extends StateMetadata {
  scale: number;
  translateX: number;
  translateY: number;
  boundingBox: BoundingBox;
  animationDuration: number;
}

/**
 * Error state metadata
 */
export interface ErrorMetadata extends StateMetadata {
  error: EngineError;
  phase: EngineState;
  recoverable: boolean;
  recoveryActions: string[];
  attemptedRecoveries: number;
}
```

### Geometric Types

```typescript
/**
 * 2D/3D point
 */
export interface Point {
  x: number;
  y: number;
  z?: number;
}

/**
 * Bounding box for viewport calculations
 */
export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

/**
 * Transform for zoom/pan operations
 */
export interface Transform {
  scale: number;
  translateX: number;
  translateY: number;
}
```

### Error Types

```typescript
/**
 * Engine error structure
 */
export interface EngineError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  details?: Record<string, unknown>;
  stack?: string;
  timestamp: number;
}

/**
 * Validation result for data
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}
```

## Configuration Interfaces

### Main Configuration

```typescript
/**
 * Complete engine configuration
 */
export interface EngineConfig {
  // Container
  container?: HTMLElement;
  
  // Rendering
  renderMode?: 'canvas' | 'svg' | 'webgl';
  width?: number;
  height?: number;
  progressiveRendering?: boolean;
  hideDuringLayout?: boolean;
  showGraphAfterPhase?: EngineState;
  
  // Performance
  maxNodes?: number;
  maxEdges?: number;
  targetFrameRate?: number;
  renderBatchSize?: number;
  
  // Layout
  layoutAlgorithm?: LayoutAlgorithm;
  layoutConfig?: LayoutConfig;
  
  // Edges
  edgeMode?: EdgeRenderMode;
  edgeConfig?: EdgeConfig;
  
  // Interaction
  interactionConfig?: InteractionConfig;
  
  // Diagnostics
  diagnosticsConfig?: DiagnosticsConfig;
  
  // Callbacks
  callbacks?: Partial<LayoutEngineCallbacks>;
}

/**
 * Layout-specific configuration
 */
export interface LayoutConfig {
  // Force layout
  chargeStrength?: number | ((node: Node) => number);
  linkDistance?: number | ((edge: Edge) => number);
  linkStrength?: number | ((edge: Edge) => number);
  centerForce?: number;
  collisionRadius?: number | ((node: Node) => number);
  
  // Stability
  stabilityThreshold?: number;
  maxIterations?: number;
  timeout?: number;
  alphaMin?: number;
  alphaDecay?: number;
  velocityDecay?: number;
  
  // Hierarchical layout
  levelSeparation?: number;
  nodeSeparation?: number;
  treeSpacing?: number;
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  
  // Circular layout
  radius?: number;
  startAngle?: number;
  endAngle?: number;
}

/**
 * Edge rendering configuration
 */
export interface EdgeConfig {
  // Bundling
  bundlingStrength?: number;
  bundlingIterations?: number;
  compatibilityThreshold?: number;
  stepSize?: number;
  
  // Styling
  strokeWidth?: number | ((edge: Edge) => number);
  strokeColor?: string | ((edge: Edge) => string);
  strokeOpacity?: number | ((edge: Edge) => number);
  
  // Curves
  curveType?: 'linear' | 'basis' | 'cardinal' | 'catmullRom';
  curveTension?: number;
  
  // Performance
  simplifyThreshold?: number;
  useWebGL?: boolean;
}

/**
 * Interaction configuration
 */
export interface InteractionConfig {
  enableSelection?: boolean;
  enableHover?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableDrag?: boolean;
  
  // Selection
  selectionMode?: 'single' | 'multiple';
  selectionDepth?: number;
  highlightNeighbors?: boolean;
  
  // Zoom/Pan
  zoomExtent?: [number, number];
  panBounds?: BoundingBox;
  zoomSpeed?: number;
  panSpeed?: number;
  
  // Drag
  dragThreshold?: number;
  snapToGrid?: boolean;
  gridSize?: number;
}

/**
 * Diagnostics configuration
 */
export interface DiagnosticsConfig {
  enabled?: boolean;
  level?: 'error' | 'warning' | 'info' | 'debug';
  performanceMonitoring?: boolean;
  eventLogging?: boolean;
  consoleOutput?: boolean;
  bufferSize?: number;
}
```

## Callback Interfaces

```typescript
/**
 * Complete callback interface for the layout engine
 */
export interface LayoutEngineCallbacks {
  // State management callbacks
  onStateChange?: (state: EngineState, progress: number, metadata: StateMetadata) => void;
  onStateEnter?: (state: EngineState, metadata: StateMetadata) => void;
  onStateExit?: (state: EngineState, metadata: StateMetadata) => void;
  
  // Progress callbacks for specific phases
  onLoadingProgress?: (progress: number, metadata: LoadingMetadata) => void;
  onLayoutProgress?: (progress: number, alpha: number, stabilityMetric: number) => void;
  onEdgeRenderingProgress?: (progress: number, edgesRendered: number, totalEdges: number) => void;
  onZoomFitProgress?: (progress: number, currentScale: number, targetScale: number) => void;
  
  // Completion callbacks
  onLoadComplete?: (data: GraphData, validationResult: ValidationResult) => void;
  onLayoutComplete?: (nodePositions: Map<string, Point>) => void;
  onEdgesRendered?: (edgeCount: number, renderTime: number) => void;
  onZoomFitComplete?: (scale: number, translate: [number, number]) => void;
  onRenderComplete?: (metrics: PerformanceMetrics) => void;
  
  // Interaction callbacks
  onNodeSelected?: (nodeId: string, neighbors: string[], edges: string[]) => void;
  onNodeDeselected?: (nodeId: string) => void;
  onNodeHovered?: (nodeId: string | null, position?: Point) => void;
  onNodeDragStart?: (nodeId: string, position: Point) => void;
  onNodeDragging?: (nodeId: string, position: Point) => void;
  onNodeDragEnd?: (nodeId: string, position: Point) => void;
  
  // View callbacks
  onZoomChange?: (scale: number, translate: [number, number]) => void;
  onPanChange?: (translate: [number, number]) => void;
  onViewportChange?: (viewport: BoundingBox, transform: Transform) => void;
  
  // Error callbacks
  onError?: (error: EngineError, stage: EngineState, recoverable: boolean) => void;
  onWarning?: (warning: string, details?: Record<string, unknown>) => void;
  onRecoveryAttempt?: (error: EngineError, strategy: string) => void;
  onRecoverySuccess?: (error: EngineError, strategy: string) => void;
  onRecoveryFailed?: (error: EngineError, strategies: string[]) => void;
  
  // Diagnostic callbacks
  onDiagnosticEvent?: (event: DiagnosticEvent, data: any, timestamp: number) => void;
  onPerformanceMetrics?: (metrics: PerformanceMetrics) => void;
  onMemoryWarning?: (usage: number, limit: number) => void;
}
```

## Main API Interface

```typescript
/**
 * Main Layout Engine API
 */
export interface ILayoutEngine {
  // Lifecycle methods
  initialize(config?: EngineConfig): Promise<void>;
  loadData(data: GraphData): Promise<ValidationResult>;
  render(options?: RenderOptions): Promise<void>;
  update(data: Partial<GraphData>): Promise<void>;
  dispose(): void;
  
  // State management
  getState(): EngineState;
  getProgress(): number;
  getStateMetadata(): StateMetadata;
  waitForState(state: EngineState, timeout?: number): Promise<void>;
  
  // Rendering control
  startRendering(): Promise<void>;
  pauseRendering(): void;
  resumeRendering(): void;
  cancelRendering(): void;
  setRenderMode(mode: EdgeRenderMode): void;
  
  // Layout control
  runLayout(algorithm?: LayoutAlgorithm): Promise<void>;
  stopLayout(): void;
  setLayoutConfig(config: Partial<LayoutConfig>): void;
  getNodePositions(): Map<string, Point>;
  setNodePosition(nodeId: string, position: Point): void;
  fixNodePosition(nodeId: string, fixed: boolean): void;
  
  // Edge control
  setEdgeMode(mode: EdgeRenderMode): void;
  setEdgeConfig(config: Partial<EdgeConfig>): void;
  bundleEdges(options?: BundlingOptions): Promise<void>;
  showEdges(visible: boolean): void;
  
  // Interaction methods
  selectNode(nodeId: string): void;
  deselectNode(nodeId?: string): void;
  selectNodes(nodeIds: string[]): void;
  getSelectedNodes(): string[];
  highlightNeighbors(nodeId: string, depth?: number): void;
  clearHighlights(): void;
  
  // View control
  zoomTo(scale: number, center?: Point, duration?: number): Promise<void>;
  panTo(position: Point, duration?: number): Promise<void>;
  fitToViewport(padding?: number, duration?: number): Promise<void>;
  resetView(duration?: number): Promise<void>;
  getTransform(): Transform;
  setTransform(transform: Transform, duration?: number): Promise<void>;
  
  // Data access
  getData(): GraphData;
  getNode(nodeId: string): Node | undefined;
  getEdge(edgeId: string): Edge | undefined;
  getNeighbors(nodeId: string, depth?: number): string[];
  getConnectedEdges(nodeId: string): string[];
  
  // Configuration
  setConfig(config: Partial<EngineConfig>): void;
  getConfig(): EngineConfig;
  
  // Callbacks
  on<K extends keyof LayoutEngineCallbacks>(
    event: K,
    callback: LayoutEngineCallbacks[K]
  ): void;
  off<K extends keyof LayoutEngineCallbacks>(
    event: K,
    callback?: LayoutEngineCallbacks[K]
  ): void;
  once<K extends keyof LayoutEngineCallbacks>(
    event: K,
    callback: LayoutEngineCallbacks[K]
  ): void;
  
  // Diagnostics
  getDiagnostics(): DiagnosticData;
  getPerformanceMetrics(): PerformanceMetrics;
  clearDiagnostics(): void;
  exportDiagnostics(): string;
  
  // Error recovery
  attemptRecovery(): Promise<boolean>;
  resetToSafeState(): void;
  getLastError(): EngineError | null;
}
```

## Supporting Interfaces

### Rendering Options

```typescript
/**
 * Options for rendering operations
 */
export interface RenderOptions {
  progressive?: boolean;
  batchSize?: number;
  hideGraphDuringLayout?: boolean;
  skipLayout?: boolean;
  skipEdges?: boolean;
  skipViewportFit?: boolean;
}

/**
 * Edge bundling options
 */
export interface BundlingOptions {
  strength?: number;
  iterations?: number;
  compatibilityThreshold?: number;
  stepSize?: number;
  smoothing?: boolean;
}
```

### Performance Metrics

```typescript
/**
 * Performance metrics for monitoring
 */
export interface PerformanceMetrics {
  // Timing
  totalRenderTime: number;
  dataLoadTime: number;
  layoutTime: number;
  edgeRenderTime: number;
  viewportFitTime: number;
  
  // Counts
  nodeCount: number;
  edgeCount: number;
  visibleNodes: number;
  visibleEdges: number;
  
  // Performance
  frameRate: number;
  averageFrameTime: number;
  droppedFrames: number;
  
  // Memory
  memoryUsage: number;
  peakMemoryUsage: number;
  
  // Interactions
  interactionLatency: number;
  selectionTime: number;
  zoomPanLatency: number;
}

/**
 * Diagnostic data structure
 */
export interface DiagnosticData {
  events: DiagnosticEvent[];
  metrics: PerformanceMetrics;
  errors: EngineError[];
  warnings: string[];
  stateHistory: StateTransition[];
}

/**
 * Diagnostic event
 */
export interface DiagnosticEvent {
  type: DiagnosticEventType;
  timestamp: number;
  data: any;
  level: 'error' | 'warning' | 'info' | 'debug';
}

/**
 * State transition record
 */
export interface StateTransition {
  from: EngineState;
  to: EngineState;
  timestamp: number;
  duration: number;
  trigger: string;
}
```

## Factory and Builder

```typescript
/**
 * Factory for creating layout engine instances
 */
export interface LayoutEngineFactory {
  create(container: HTMLElement, config?: EngineConfig): ILayoutEngine;
  createWithCallbacks(
    container: HTMLElement,
    callbacks: Partial<LayoutEngineCallbacks>,
    config?: EngineConfig
  ): ILayoutEngine;
}

/**
 * Builder pattern for complex configurations
 */
export interface LayoutEngineBuilder {
  withContainer(container: HTMLElement): LayoutEngineBuilder;
  withConfig(config: Partial<EngineConfig>): LayoutEngineBuilder;
  withCallbacks(callbacks: Partial<LayoutEngineCallbacks>): LayoutEngineBuilder;
  withRenderMode(mode: 'canvas' | 'svg' | 'webgl'): LayoutEngineBuilder;
  withLayoutAlgorithm(algorithm: LayoutAlgorithm): LayoutEngineBuilder;
  withEdgeMode(mode: EdgeRenderMode): LayoutEngineBuilder;
  withDiagnostics(enabled: boolean): LayoutEngineBuilder;
  build(): ILayoutEngine;
}
```

## Usage Examples

### Basic Usage

```typescript
import { LayoutEngineFactory, EngineState } from '@knowledge-network/layout-engine';

const factory = new LayoutEngineFactory();
const engine = factory.create(document.getElementById('graph-container')!, {
  renderMode: 'canvas',
  layoutAlgorithm: LayoutAlgorithm.FORCE,
  edgeMode: EdgeRenderMode.BUNDLED
});

// Register callbacks
engine.on('stateChange', (state, progress, metadata) => {
  console.log(`State: ${state}, Progress: ${progress}%`);
});

engine.on('nodeSelected', (nodeId, neighbors, edges) => {
  console.log(`Selected: ${nodeId}, Neighbors: ${neighbors.length}`);
});

// Load and render
await engine.initialize();
await engine.loadData(graphData);
await engine.render();
```

### Advanced Usage with Builder

```typescript
import { LayoutEngineBuilder } from '@knowledge-network/layout-engine';

const engine = new LayoutEngineBuilder()
  .withContainer(container)
  .withRenderMode('webgl')
  .withLayoutAlgorithm(LayoutAlgorithm.HIERARCHICAL)
  .withEdgeMode(EdgeRenderMode.BUNDLED)
  .withCallbacks({
    onStateChange: handleStateChange,
    onNodeSelected: handleNodeSelection,
    onError: handleError,
    onPerformanceMetrics: updateMetricsDisplay
  })
  .withDiagnostics(true)
  .build();

// Complex rendering with options
await engine.render({
  progressive: true,
  batchSize: 100,
  hideGraphDuringLayout: true
});

// Interaction
engine.selectNode('node-1');
engine.highlightNeighbors('node-1', 2);
await engine.fitToViewport(20, 750);
```

### Error Recovery

```typescript
engine.on('error', async (error, stage, recoverable) => {
  console.error(`Error in ${stage}: ${error.message}`);
  
  if (recoverable) {
    const recovered = await engine.attemptRecovery();
    if (!recovered) {
      engine.resetToSafeState();
    }
  } else {
    // Non-recoverable error
    showErrorDialog(error);
    engine.dispose();
  }
});
```

## Contract Guarantees

### Invariants

1. **State Consistency**: The engine is always in exactly one state
2. **Progress Monotonicity**: Progress within a state only increases (0-100)
3. **Callback Order**: Callbacks are invoked in the documented order
4. **Error Safety**: All errors transition to ERROR state with context
5. **Resource Cleanup**: Dispose() releases all resources

### Performance Guarantees

1. **Callback Latency**: < 5ms per callback invocation
2. **State Transitions**: < 10ms for state changes
3. **Progress Updates**: Throttled to 60 Hz maximum
4. **Memory Growth**: O(n) with node count, O(m) with edge count

### Compatibility

- **TypeScript**: 4.5+
- **ECMAScript**: ES2020+
- **Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Node.js**: 16+ (for SSR/testing)

## Version

**Contract Version**: 2.0.0
**Last Updated**: 2024-01-20
**Status**: Stable

## Migration Guide

For migration from v1.x to v2.0, see [MIGRATION.md](./MIGRATION.md)
