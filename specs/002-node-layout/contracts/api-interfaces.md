# NodeLayout API Interfaces

**Feature**: `002-node-layout`  
**Created**: 2025-11-13  
**Phase**: Phase 1 - API Contract Definition  
**Project**: Knowledge Network Library

## Overview

This document defines the TypeScript interfaces for the NodeLayout engine API contracts, including core interfaces, configuration schemas, and event definitions for similarity-based node positioning with progressive convergence.

## Core Position & Coordinate Interfaces

### Position3D

Universal 3D coordinate system supporting both 2D and 3D layouts. 2D mode implemented as z=0 constraint for architectural simplicity.

```typescript
interface Position3D {
  /** Horizontal coordinate */
  readonly x: number;
  /** Vertical coordinate */
  readonly y: number;
  /** Depth coordinate (0 for 2D mode) */
  readonly z: number;
}
```

### PositionDelta

Position change vector for convergence detection and force calculations.

```typescript
interface PositionDelta {
  readonly dx: number;
  readonly dy: number;
  readonly dz: number;
  /** Euclidean magnitude of the position change */
  readonly magnitude: number;
}
```

### BoundingBox

Spatial bounds for quadtree indexing and viewport calculations.

```typescript
interface BoundingBox {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  readonly minZ: number;
  readonly maxZ: number;
}
```

## Node Layout & Metadata Interfaces

### LayoutNode

Immutable wrapper for original node data with layout-specific metadata. Ensures strict separation between original data and layout calculations.

```typescript
interface LayoutNode extends SimulationNodeDatum {
  /** Unique layout identifier (generated via configurable ID function) */
  readonly id: string;
  
  /** Immutable reference to original node data */
  readonly originalNode: Node;
  
  /** Current spatial coordinates */
  position: Position3D;
  
  /** Semantic cluster membership (optional) */
  readonly cluster?: ClusterAssignment;
  
  /** Cached similarity scores for performance optimization */
  readonly similarityScores: Map<string, number>;
  
  /** Node convergence status and stability metrics */
  readonly convergenceState: NodeConvergenceState;
  
  /** Centrality metrics for progressive refinement prioritization */
  readonly importance: NodeImportance;
  
  /** Layout-specific metadata and tracking information */
  readonly metadata: LayoutNodeMetadata;
}
```

### NodeImportance

Centrality metrics for progressive refinement and node importance ranking based on research findings for optimal multi-phase layout strategy.

```typescript
interface NodeImportance {
  /** Direct connections count (graph degree) */
  readonly degree: number;
  
  /** Bridging centrality score [0-1] - how often node lies on shortest paths */
  readonly betweenness: number;
  
  /** Network influence score [0-1] - eigenvector centrality */
  readonly eigenvector: number;
  
  /** Weighted combination for sorting (0.4*degree + 0.3*betweenness + 0.3*eigenvector) */
  readonly composite: number;
}
```

### LayoutNodeMetadata

Layout-specific metadata for tracking and optimization.

```typescript
interface LayoutNodeMetadata {
  /** Creation timestamp */
  readonly createdAt: number;
  
  /** Last position update timestamp */
  readonly lastUpdated: number;
  
  /** Whether node has reached convergence stability */
  readonly isStable: boolean;
  
  /** Current processing phase */
  readonly phase: LayoutPhase;
  
  /** Force contributions breakdown for debugging and optimization */
  readonly forceContributions: ForceContribution[];
  
  /** Position history buffer for convergence detection */
  readonly positionHistory: Position3D[];
}
```

### ClusterAssignment

Semantic cluster membership for grouped positioning.

```typescript
interface ClusterAssignment {
  /** Unique cluster identifier */
  readonly clusterId: string;
  
  /** Cluster center position */
  readonly center: Position3D;
  
  /** Membership strength [0-1] */
  readonly membershipStrength: number;
  
  /** Cluster radius for spatial bounds */
  readonly radius: number;
}
```

### ForceContribution

Individual force contribution for analysis and debugging.

```typescript
interface ForceContribution {
  /** Force type identifier (e.g., 'similarity', 'repulsion', 'centering') */
  readonly type: string;
  
  /** Force vector components */
  readonly force: Position3D;
  
  /** Force magnitude */
  readonly magnitude: number;
  
  /** Contributing nodes (for pairwise forces) */
  readonly contributors?: string[];
}
```

## Convergence & State Management Interfaces

### NodeConvergenceState

Node-level convergence status and stability tracking.

```typescript
interface NodeConvergenceState {
  /** Whether node position has stabilized */
  readonly isConverged: boolean;
  
  /** Current position movement velocity */
  readonly velocity: Position3D;
  
  /** Position variance over recent history */
  readonly positionVariance: number;
  
  /** Number of consecutive stable iterations */
  readonly stableIterations: number;
  
  /** Last significant movement timestamp */
  readonly lastMovement: number;
}
```

### ConvergenceMetrics

Global layout convergence metrics and progress tracking.

```typescript
interface ConvergenceMetrics {
  /** Mean position delta across all nodes */
  readonly averageMovement: number;
  
  /** Largest position delta in current iteration */
  readonly maxMovement: number;
  
  /** Fraction of nodes below stability threshold [0-1] */
  readonly stabilityRatio: number;
  
  /** Current layout iteration count */
  readonly iterationCount: number;
  
  /** Total processing time elapsed (milliseconds) */
  readonly timeElapsed: number;
  
  /** Estimated remaining time (milliseconds, optional) */
  readonly estimatedRemaining?: number;
}
```

### LayoutPhase

Progressive refinement phase enumeration based on research: three-phase strategy with centrality-based prioritization.

```typescript
enum LayoutPhase {
  /** Initial phase: 0-500ms, top 20% nodes by importance */
  COARSE = 'coarse',
  
  /** Medium refinement: 500ms-2s, top 60% nodes by importance */
  MEDIUM = 'medium',
  
  /** Fine detail: 2s-5s, all nodes with stability optimization */
  FINE = 'fine'
}
```

### ProgressiveRefinementState

Track multi-phase layout progression with performance metrics.

```typescript
interface ProgressiveRefinementState {
  /** Current processing phase */
  readonly currentPhase: LayoutPhase;
  
  /** Phase start timestamp */
  readonly phaseStartTime: number;
  
  /** Planned phase duration (milliseconds) */
  readonly phaseDuration: number;
  
  /** Node IDs included in current phase */
  readonly nodesInPhase: string[];
  
  /** Successfully completed phases */
  readonly completedPhases: LayoutPhase[];
  
  /** Real-time convergence metrics */
  readonly convergenceMetrics: ConvergenceMetrics;
}
```

## Engine & Configuration Interfaces

### NodeLayoutEngine

Main orchestrator interface for similarity-based positioning.

```typescript
interface NodeLayoutEngine {
  /** Engine instance identifier */
  readonly id: string;
  
  /** Current configuration */
  readonly config: LayoutConfig;
  
  /** Processing state */
  readonly state: EngineState;
  
  /** Registered similarity functions */
  readonly registeredFunctions: Map<string, WeightedSimilarityFunction>;
  
  /** Event emitter for progress tracking */
  readonly eventEmitter: LayoutEventEmitter;
  
  /** Calculate layout with progressive refinement */
  calculateLayout(
    nodes: Node[], 
    similarityFunctor: SimilarityFunctor, 
    config?: Partial<LayoutConfig>
  ): Promise<LayoutResult>;
  
  /** Update positions maintaining stability */
  updatePositions(
    nodeUpdates: NodeUpdate[], 
    preserveStability?: boolean
  ): Promise<void>;
  
  /** Switch coordinate dimensions */
  switchDimensions(targetDimensions: 2 | 3): Promise<TransitionResult>;
  
  /** Register custom similarity function */
  registerSimilarityFunction(
    name: string, 
    functor: SimilarityFunctor, 
    weight?: number
  ): void;
  
  /** Get current layout status */
  getStatus(): EngineStatus;
}
```

### EngineState

Processing state enumeration for engine status tracking.

```typescript
enum EngineState {
  IDLE = 'idle',
  INITIALIZING = 'initializing', 
  PROCESSING = 'processing',
  CONVERGED = 'converged',
  ERROR = 'error'
}
```

### LayoutResult

Complete layout computation result with performance metrics.

```typescript
interface LayoutResult {
  /** Positioned nodes with layout metadata */
  readonly nodes: LayoutNode[];
  
  /** Final convergence status */
  readonly convergenceState: ConvergenceMetrics;
  
  /** Performance metrics and timing */
  readonly performanceMetrics: PerformanceMetrics;
  
  /** Total processing time (milliseconds) */
  readonly processingTime: number;
  
  /** Resource consumption metrics */
  readonly memoryUsage: MemoryUsage;
  
  /** Success status and any warnings */
  readonly status: {
    readonly success: boolean;
    readonly warnings: string[];
    readonly errors: string[];
  };
}
```

### PerformanceMetrics

Detailed performance tracking for optimization.

```typescript
interface PerformanceMetrics {
  /** Total similarity calculations performed */
  readonly similarityCalculations: number;
  
  /** Cache hit rate percentage [0-100] */
  readonly cacheHitRate: number;
  
  /** Processing speed (iterations per second) */
  readonly iterationsPerSecond: number;
  
  /** Peak memory consumption (bytes) */
  readonly memoryPeakUsage: number;
  
  /** Quadtree operations count */
  readonly spatialIndexOperations: number;
  
  /** WebWorker utilization (if applicable) */
  readonly workerUtilization?: number;
}
```

### MemoryUsage

Memory consumption tracking for resource management.

```typescript
interface MemoryUsage {
  /** Coordinate storage (bytes) */
  readonly coordinateStorage: number;
  
  /** Similarity cache size (bytes) */
  readonly cacheSize: number;
  
  /** Spatial index memory (bytes) */
  readonly spatialIndexSize: number;
  
  /** Total estimated usage (bytes) */
  readonly totalEstimated: number;
  
  /** Browser heap usage percentage [0-100] */
  readonly heapUsagePercent: number;
}
```

## Spatial Indexing Interfaces

### QuadTreeIndex

Spatial optimization structure with Barnes-Hut approximation.

```typescript
interface QuadTreeIndex {
  /** Spatial bounds for indexing */
  readonly bounds: BoundingBox;
  
  /** Barnes-Hut approximation threshold [0-1] */
  readonly theta: number;
  
  /** Maximum tree depth limit */
  readonly maxDepth: number;
  
  /** Nodes per leaf capacity */
  readonly nodeCapacity: number;
  
  /** Insert node into spatial index */
  insert(node: LayoutNode): void;
  
  /** Query nodes in region */
  query(region: BoundingBox): LayoutNode[];
  
  /** Get nearby nodes within radius */
  getNearby(position: Position3D, radius: number): LayoutNode[];
  
  /** Rebuild index (periodic optimization) */
  rebuild(): void;
  
  /** Get index statistics */
  getStatistics(): SpatialIndexStatistics;
}
```

### SpatialIndexStatistics

Performance metrics for spatial indexing optimization.

```typescript
interface SpatialIndexStatistics {
  /** Total nodes indexed */
  readonly nodeCount: number;
  
  /** Tree depth levels */
  readonly treeDepth: number;
  
  /** Average nodes per leaf */
  readonly averageLeafSize: number;
  
  /** Query performance (queries per second) */
  readonly queryPerformance: number;
  
  /** Memory usage (bytes) */
  readonly memoryUsage: number;
}
```

## Integration & Update Interfaces

### NodeUpdate

Node position update specification for maintaining stability.

```typescript
interface NodeUpdate {
  /** Target node identifier */
  readonly nodeId: string;
  
  /** New position coordinates */
  readonly newPosition: Position3D;
  
  /** Update priority for processing order */
  readonly priority: number;
  
  /** Whether to trigger convergence recalculation */
  readonly triggerConvergence: boolean;
}
```

### TransitionResult

Dimensional switching result with preservation metrics.

```typescript
interface TransitionResult {
  /** Whether transition completed successfully */
  readonly success: boolean;
  
  /** New dimensional mode */
  readonly newDimensions: 2 | 3;
  
  /** Position preservation accuracy */
  readonly preservationAccuracy: number;
  
  /** Transition time (milliseconds) */
  readonly transitionTime: number;
  
  /** Affected nodes count */
  readonly affectedNodes: number;
  
  /** Any issues encountered */
  readonly warnings: string[];
}
```

### EngineStatus

Current engine status for monitoring and debugging.

```typescript
interface EngineStatus {
  /** Current processing state */
  readonly state: EngineState;
  
  /** Active node count */
  readonly activeNodes: number;
  
  /** Current layout phase */
  readonly currentPhase: LayoutPhase;
  
  /** Progress percentage [0-100] */
  readonly progress: number;
  
  /** Performance metrics snapshot */
  readonly performance: PerformanceMetrics;
  
  /** Last error (if any) */
  readonly lastError?: string;
  
  /** Engine uptime (milliseconds) */
  readonly uptime: number;
}
```

## Validation & Error Interfaces

### ValidationResult

Input validation result for configuration and data integrity.

```typescript
interface ValidationResult {
  /** Whether validation passed */
  readonly isValid: boolean;
  
  /** Validation errors (blocking issues) */
  readonly errors: ValidationError[];
  
  /** Validation warnings (non-blocking issues) */
  readonly warnings: ValidationWarning[];
  
  /** Suggested corrections */
  readonly suggestions: string[];
}
```

### ValidationError

Specific validation error with context and resolution guidance.

```typescript
interface ValidationError {
  /** Error code for programmatic handling */
  readonly code: string;
  
  /** Human-readable error message */
  readonly message: string;
  
  /** Field or property path causing error */
  readonly field: string;
  
  /** Current invalid value */
  readonly value: unknown;
  
  /** Expected value or constraint */
  readonly expected: string;
  
  /** Suggested resolution */
  readonly resolution: string;
}
```

### ValidationWarning

Non-blocking validation issue with performance or quality implications.

```typescript
interface ValidationWarning {
  /** Warning code */
  readonly code: string;
  
  /** Warning message */
  readonly message: string;
  
  /** Severity level */
  readonly severity: 'low' | 'medium' | 'high';
  
  /** Performance impact description */
  readonly impact: string;
  
  /** Recommended action */
  readonly recommendation: string;
}
```

## Usage Examples

### Basic Layout Calculation

```typescript
// Initialize engine
const engine: NodeLayoutEngine = new NodeLayoutEngineImpl({
  dimensions: 2,
  convergenceThreshold: 0.01,
  maxIterations: 1000
});

// Calculate layout with cosine similarity
const result: LayoutResult = await engine.calculateLayout(
  nodes, 
  cosineSimilarityFunctor
);

// Check convergence
if (result.status.success) {
  console.log(`Layout converged in ${result.processingTime}ms`);
  console.log(`Cache hit rate: ${result.performanceMetrics.cacheHitRate}%`);
}
```

### Progressive Monitoring

```typescript
// Monitor layout progress
engine.eventEmitter.on('layoutProgress', (event: LayoutProgressEvent) => {
  console.log(`Phase: ${event.phase}, Progress: ${event.progress}%`);
  
  if (event.phase === LayoutPhase.COARSE && event.progress === 100) {
    console.log('Initial positioning complete - nodes interactive');
  }
});
```

### Custom Similarity Function

```typescript
// Register domain-specific similarity
const metadataSimilarity: SimilarityFunctor = (nodeA, nodeB, context) => {
  const tagsA = new Set(nodeA.metadata?.tags || []);
  const tagsB = new Set(nodeB.metadata?.tags || []);
  
  const intersection = new Set([...tagsA].filter(x => tagsB.has(x)));
  const union = new Set([...tagsA, ...tagsB]);
  
  return intersection.size / union.size; // Jaccard similarity
};

engine.registerSimilarityFunction('metadata', metadataSimilarity, 0.7);
```

This interface specification provides the foundation for implementing the NodeLayout engine with type safety, performance monitoring, and extensibility while maintaining compatibility with the established modular graph engine architecture.