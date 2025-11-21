/**
 * Modular Knowledge Graph Engine Types
 * 
 * This file contains comprehensive TypeScript definitions for the modular graph engine.
 * Architecture: Sequential pipeline processing with modular rendering strategies.
 * 
 * @fileoverview Core type definitions for the modular knowledge graph system
 * @author Knowledge Network Team
 * @version 1.0.0
 */

// Basic graph data structures
export interface Node {
  /** Unique identifier for the node */
  id: string;

  /** Display label for the node */
  label?: string;

  /** Optional group/type classification */
  group?: string;

  /** Optional vector embedding for similarity calculations */
  vector?: number[];

  /** Optional metadata for Jaccard similarity */
  metadata?: {
    tags?: string[];
    [key: string]: any;
  };

  /** Optional position for spatial similarity */
  position?: {
    x: number;
    y: number;
    z: number;
  };

  /** Additional node properties */
  [key: string]: any;
}

export interface Edge {
  /** Unique identifier for the edge */
  id: string;

  /** Source node ID */
  source: string;

  /** Target node ID */
  target: string;

  /** Optional edge label */
  label?: string;

  /** Edge weight/strength */
  weight?: number;

  /** Additional edge properties */
  [key: string]: any;
}

// Graph dataset structure
export interface GraphDataset {
  /** Array of nodes */
  nodes: Node[];

  /** Array of edges */
  edges: Edge[];

  /** Optional metadata */
  metadata?: {
    [key: string]: any;
  };
}

// Modular configuration interfaces
export interface ModularGraphConfig {
  /** Layout engine configuration */
  layout: LayoutEngineOptions;

  /** Rendering strategy configuration */
  rendering: RenderingStrategyOptions;

  /** Pipeline coordinator configuration */
  pipeline: PipelineCoordinatorOptions;

  /** Navigation contract configuration */
  navigation: NavigationContractOptions;

  /** Similarity measure configuration */
  similarity: SimilarityMeasureOptions;
}

export interface LayoutEngineOptions {
  /** Layout algorithm type */
  algorithm: 'force-directed' | 'hierarchical' | 'circular';

  /** Algorithm-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface RenderingStrategyOptions {
  /** Rendering type */
  type: 'canvas' | 'svg' | 'webgl';

  /** Rendering-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface PipelineCoordinatorOptions {
  /** Processing mode */
  mode: 'sequential' | 'parallel';

  /** Pipeline-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface NavigationContractOptions {
  /** Navigation features to enable */
  features: string[];

  /** Navigation-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface SimilarityMeasureOptions {
  /** Similarity functions to use */
  functions: string[];

  /** Similarity-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

// ============================================
// 002-node-layout Feature Types
// ============================================

/** 3D Position coordinates with z=0 for 2D mode */
export interface Position3D {
  readonly x: number;
  readonly y: number;
  readonly z: number; // 0 for 2D mode
}

/** Cluster assignment info */
export interface ClusterAssignment {
  clusterId: string;
  centroid: Position3D;
  confidence: number;
}

/** Node convergence state */
export interface NodeConvergenceState {
  isStable: boolean;
  velocity: Position3D;
  force: Position3D;
  lastMovement: number;
}

/** Force contribution details */
export interface ForceContribution {
  forceName: string;
  magnitude: number;
  direction: Position3D;
}

/** Progressive refinement phases */
export enum LayoutPhase {
  COARSE = 'coarse',     // 0-500ms: High-importance nodes
  MEDIUM = 'medium',     // 500ms-2s: Medium-importance nodes
  FINE = 'fine'          // 2s-5s: All nodes with stability
}

/** Layout metadata for tracking processing state */
export interface LayoutNodeMetadata {
  readonly createdAt: number;
  readonly lastUpdated: number;
  readonly isStable: boolean;
  readonly phase: LayoutPhase;
  readonly forceContributions: ForceContribution[];
}

/** Node importance metrics for progressive refinement */
export interface NodeImportance {
  readonly degree: number;        // Direct connections count
  readonly betweenness: number;   // Bridging centrality (0-1)
  readonly eigenvector: number;   // Network influence (0-1)
  readonly composite: number;     // Weighted combination
}

/** Bounding box for spatial indexing */
export interface BoundingBox {
  minX: number;
  minY: number;
  minZ?: number;
  maxX: number;
  maxY: number;
  maxZ?: number;
}

/** Cache statistics */
export interface CacheStatistics {
  readonly hitCount: number;
  readonly missCount: number;
  readonly hitRate: number;
  readonly evictionCount: number;
  readonly memoryUsage: number;
}

/** Performance metrics for layout and similarity calculations */
export interface PerformanceMetrics {
  similarityCalculations: number;
  cacheHitRate: number;
  iterationsPerSecond: number;
  memoryPeakUsage: number;
  [key: string]: number;
}

/** Similarity Cache Interface */
export interface SimilarityCache {
  get(key: string): number | null;
  set(key: string, value: number): void;
  getStatistics(): CacheStatistics;
  clear(): void;
}

/** Layout configuration */
export interface LayoutConfig {
  dimensions: 2 | 3;
  similarityThreshold: number;
  convergenceThreshold: number;
  maxIterations: number;
  forceIntegration: {
    enablePhysics: boolean;
    similarityStrength: number;
    repulsionStrength: number;
    centeringStrength: number;
  };
  progressiveRefinement: {
    enablePhases: boolean;
    phase1Duration: number;
    phase2Duration: number;
    importanceWeights: {
      degree: number;
      betweenness: number;
      eigenvector: number;
    };
  };
  memoryManagement: {
    useTypedArrays: boolean;
    cacheSize: number;
    historySize: number;
    gcThreshold: number;
  };
}

/** Spatial indexing for performance optimization */
export interface QuadTreeIndex {
  readonly bounds: BoundingBox;
  readonly theta: number;               // Barnes-Hut approximation threshold
  readonly maxDepth: number;           // Tree depth limit
  readonly maxSize: number;
  readonly evictionPolicy: 'lru' | 'fifo' | 'lfu';
  readonly invalidationEvents: string[];
}

/** Clustering context for similarity calculations */
export interface ClusteringContext {
  readonly currentIteration: number;
  readonly alpha: number;
  readonly spatialIndex: QuadTreeIndex | null;
  readonly cacheManager: SimilarityCache | null;
  readonly performanceMetrics: PerformanceMetrics;
  readonly layoutConfig: LayoutConfig;
}

/** Functor contract for similarity calculations */
export type SimilarityFunctor = (
  nodeA: Node,
  nodeB: Node,
  context: ClusteringContext
) => number;

/** Enhanced LayoutNode with similarity-based metadata */
export interface EnhancedLayoutNode {
  readonly id: string;
  readonly originalNode: Node;
  readonly position: Position3D;
  readonly cluster?: ClusterAssignment;
  readonly similarityScores: Map<string, number>;
  readonly convergenceState: NodeConvergenceState;
  readonly importance: NodeImportance;
  readonly metadata: LayoutNodeMetadata;
}

/** Progressive refinement phase definition */
export interface ProgressiveRefinementPhase {
  readonly phase: string;
  readonly nodeSelection?: 'high-degree' | 'random' | 'custom';
  readonly nodePercentage?: number;
  readonly maxNodes?: number;
  readonly maxDuration?: number;
  readonly convergenceThreshold?: number;
}

/** Progressive refinement configuration */
export interface ProgressiveRefinementConfig {
  readonly enabled: boolean;
  readonly phases: ProgressiveRefinementPhase[];
  readonly earlyInteraction?: boolean;
}

/** Spatial constraints */
export interface SpatialConstraints {
  readonly boundingBox?: {
    width: number;
    height: number;
    depth?: number;
  };
}

/** Incremental update configuration */
export interface IncrementalConfig {
  readonly enabled: boolean;
  readonly changedNodes?: string[];
  readonly preserveStability?: boolean;
}

/** Convergence metrics */
export interface ConvergenceMetrics {
  readonly isConverged: boolean;
  readonly stability: number;
  readonly iterations: number;
  readonly positionDelta: number;
  readonly averageMovement: number;
  readonly maxMovement: number;
  readonly stabilityRatio: number;
  readonly iterationCount: number;
  readonly timeElapsed: number;
}

// ============================================
// Additional NodeLayout Engine Types
// ============================================

/** Node layout engine states */
export enum EngineState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  PROCESSING = 'processing',
  CONVERGED = 'converged',
  ERROR = 'error'
}

/** Memory usage tracking */
export interface MemoryUsage {
  readonly coordinateStorage: number;
  readonly cacheSize: number;
  readonly spatialIndexSize: number;
  readonly totalEstimated: number;
  readonly heapUsagePercent: number;
}

/** Layout computation result */
export interface LayoutResult {
  readonly nodes: EnhancedLayoutNode[];
  readonly convergenceState: ConvergenceMetrics;
  readonly performanceMetrics: PerformanceMetrics;
  readonly processingTime: number;
  readonly memoryUsage: MemoryUsage;
  readonly status: {
    readonly success: boolean;
    readonly warnings: string[];
    readonly errors: string[];
  };
}

/** Position change vector */
export interface PositionDelta {
  readonly dx: number;
  readonly dy: number;
  readonly dz: number;
  readonly magnitude: number;
}

/** Dimensional switching result */
export interface TransitionResult {
  readonly success: boolean;
  readonly fromDimensions: 2 | 3;
  readonly toDimensions: 2 | 3;
  readonly positionDeviations: PositionDelta[];
  readonly transitionTime: number;
}

/** Node position update specification */
export interface NodeUpdate {
  readonly nodeId: string;
  readonly newPosition: Position3D;
  readonly priority: number;
  readonly triggerConvergence: boolean;
}

/** Spatial index performance metrics */
export interface SpatialIndexStatistics {
  readonly nodeCount: number;
  readonly treeDepth: number;
  readonly averageLeafSize: number;
  readonly queryPerformance: number;
  readonly memoryUsage: number;
}

/** Similarity function metadata */
export interface SimilarityFunctionMetadata {
  readonly description: string;
  readonly expectedDataTypes: string[];
  readonly performanceHint: 'fast' | 'moderate' | 'slow';
  readonly deterministic: boolean;
}

/** Weighted similarity function composition */
export interface WeightedSimilarityFunction {
  readonly name: string;
  readonly functor: SimilarityFunctor;
  readonly weight: number;
  readonly isDefault: boolean;
  readonly metadata: SimilarityFunctionMetadata;
}

/** Layout progress event data */
export interface LayoutProgressEvent {
  readonly type: 'nodeLoading' | 'nodeLayout' | 'nodeLayoutComplete';
  readonly progress: number;
  readonly phase: string;
  readonly nodesProcessed: number;
  readonly totalNodes: number;
  readonly timeElapsed: number;
  readonly estimatedRemaining?: number;
}

/** Phase completion event data */
export interface PhaseCompleteEvent {
  readonly phase: LayoutPhase;
  readonly duration: number;
  readonly nodesPositioned: number;
  readonly convergenceAchieved: boolean;
}

/** Layout completion event data */
export interface LayoutCompleteEvent {
  readonly totalDuration: number;
  readonly finalStability: number;
  readonly totalNodes: number;
  readonly totalIterations: number;
}

/** Convergence update event data */
export interface ConvergenceUpdateEvent {
  readonly stability: number;
  readonly positionDelta: number;
  readonly iterations: number;
  readonly phase: LayoutPhase;
}

/** Layout event emitter interface */
export interface LayoutEventEmitter {
  on(event: 'layoutProgress', handler: (data: LayoutProgressEvent) => void): void;
  on(event: 'phaseComplete', handler: (data: PhaseCompleteEvent) => void): void;
  on(event: 'layoutComplete', handler: (data: LayoutCompleteEvent) => void): void;
  on(event: 'convergenceUpdate', handler: (data: ConvergenceUpdateEvent) => void): void;
  emit(event: string, data: any): void;
  off(event: string, handler: Function): void;
}

/** Node layout engine interface */
export interface NodeLayoutEngine {
  readonly id: string;
  readonly config: LayoutConfig;
  readonly state: EngineState;
  readonly registeredFunctions: Map<string, WeightedSimilarityFunction>;
  readonly eventEmitter: LayoutEventEmitter;

  calculateLayoutAsync(
    nodes: Node[],
    similarityFunctor: SimilarityFunctor,
    config?: Partial<LayoutConfig>
  ): Promise<LayoutResult>;

  updatePositionsAsync(
    nodeUpdates: NodeUpdate[],
    preserveStability?: boolean
  ): Promise<void>;

  switchDimensionsAsync(targetDimensions: 2 | 3): Promise<TransitionResult>;

  registerSimilarityFunction(
    name: string,
    functor: SimilarityFunctor,
    weight?: number
  ): void;

  getStatus(): { state: EngineState; convergence: ConvergenceMetrics };
}

// ============================================
// Cache Types
// ============================================

/** Cache configuration */
export interface CacheConfig {
  readonly maxSize: number;
  readonly ttl?: number;
  readonly evictionPolicy: 'lru' | 'fifo' | 'lfu';
}

/** Cache entry */
export interface CacheEntry<T> {
  readonly value: T;
  readonly timestamp: number;
  accessCount: number;
  lastAccessed: number;
}