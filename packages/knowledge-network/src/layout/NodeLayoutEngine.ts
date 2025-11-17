/**
 * @fileoverview NodeLayoutEngine - Main orchestrator for similarity-based node positioning
 * 
 * Coordinates similarity processing, spatial optimization, and layout convergence
 * following the NodeLayout architecture with functor contract compliance.
 */

import { 
  Node,
  EnhancedLayoutNode, 
  SimilarityFunctor,
  ClusteringContext,
  LayoutConfig,
  LayoutResult,
  NodeUpdate,
  TransitionResult,
  EngineState,
  ConvergenceMetrics,
  PerformanceMetrics,
  MemoryUsage,
  WeightedSimilarityFunction,
  LayoutEventEmitter,
  LayoutProgressEvent,
  PhaseCompleteEvent,
  LayoutCompleteEvent,
  ConvergenceUpdateEvent,
  Position3D,
  NodeImportance,
  LayoutPhase,
  LayoutNodeMetadata,
  NodeConvergenceState
} from '../types';
import { SimilarityProcessor } from './SimilarityProcessor';
import { SpatialOptimizer } from './SpatialOptimizer';
import { EventEmitter } from '../utils/EventEmitter';

/**
 * NodeLayoutEngine orchestrates similarity-based positioning algorithms
 */
export class NodeLayoutEngine {
  public readonly id: string;
  public readonly config: LayoutConfig;
  public state: EngineState;
  public readonly registeredFunctions: Map<string, WeightedSimilarityFunction>;
  public readonly eventEmitter: LayoutEventEmitter;

  private readonly similarityProcessor: SimilarityProcessor;
  private readonly spatialOptimizer: SpatialOptimizer;
  private readonly layoutNodes = new Map<string, EnhancedLayoutNode>();
  private startTime: number = 0;

  constructor(config?: Partial<LayoutConfig>) {
    this.id = `layout-engine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.config = this.createDefaultConfig(config);
    this.state = EngineState.IDLE;
    
    // Initialize processors
    this.similarityProcessor = new SimilarityProcessor();
    this.spatialOptimizer = new SpatialOptimizer();
    this.eventEmitter = new EventEmitter();
    
    // Share registered functions reference
    this.registeredFunctions = this.similarityProcessor['registeredFunctions'];
  }

  /**
   * Calculate layout with progressive refinement
   */
  public async calculateLayoutAsync(
    nodes: Node[],
    similarityFunctor: SimilarityFunctor,
    config?: Partial<LayoutConfig>
  ): Promise<LayoutResult> {
    if (nodes.length === 0) {
      throw new Error('Cannot calculate layout: node array is empty');
    }

    this.state = EngineState.INITIALIZING;
    this.startTime = performance.now();
    
    // Merge configuration
    const mergedConfig = config ? { ...this.config, ...config } : this.config;
    
    try {
      // Emit layout start event
      this.eventEmitter.emit('layoutProgress', {
        type: 'nodeLoading',
        progress: 0,
        phase: 'initialization',
        nodesProcessed: 0,
        totalNodes: nodes.length,
        timeElapsed: 0
      } as LayoutProgressEvent);

      this.state = EngineState.PROCESSING;

      // Create clustering context
      const context = this.createClusteringContext(mergedConfig);

      // Validate similarity functor
      this.similarityProcessor.validateFunctorContract(similarityFunctor);

      // Calculate similarity matrix
      this.eventEmitter.emit('layoutProgress', {
        type: 'nodeLayout',
        progress: 25,
        phase: 'similarity-calculation',
        nodesProcessed: 0,
        totalNodes: nodes.length,
        timeElapsed: performance.now() - this.startTime
      } as LayoutProgressEvent);

      const similarities = this.similarityProcessor.calculateSimilarityMatrix(
        nodes, 
        similarityFunctor, 
        context
      );

      // Optimize spatial positions
      this.eventEmitter.emit('layoutProgress', {
        type: 'nodeLayout',
        progress: 50,
        phase: 'spatial-optimization',
        nodesProcessed: nodes.length,
        totalNodes: nodes.length,
        timeElapsed: performance.now() - this.startTime
      } as LayoutProgressEvent);

      const positions = this.spatialOptimizer.optimizePositions(similarities, {
        dimensions: mergedConfig.dimensions,
        boundingBox: { minX: 0, maxX: 800, minY: 0, maxY: 600, minZ: 0, maxZ: mergedConfig.dimensions === 3 ? 400 : 0 }
      });

      // Create enhanced layout nodes
      const layoutNodes = this.createLayoutNodes(nodes, positions);

      // Monitor convergence
      this.eventEmitter.emit('layoutProgress', {
        type: 'nodeLayout',
        progress: 75,
        phase: 'convergence',
        nodesProcessed: nodes.length,
        totalNodes: nodes.length,
        timeElapsed: performance.now() - this.startTime
      } as LayoutProgressEvent);

      const convergenceState = this.spatialOptimizer.getConvergenceState();

      this.state = EngineState.CONVERGED;
      const totalTime = performance.now() - this.startTime;

      // Emit completion event
      this.eventEmitter.emit('layoutComplete', {
        totalDuration: totalTime,
        finalStability: convergenceState.stability,
        totalNodes: nodes.length,
        totalIterations: convergenceState.iterationCount
      } as LayoutCompleteEvent);

      return {
        nodes: layoutNodes,
        convergenceState,
        performanceMetrics: this.similarityProcessor.getPerformanceMetrics(),
        processingTime: totalTime,
        memoryUsage: this.estimateMemoryUsage(layoutNodes.length),
        status: {
          success: true,
          warnings: [],
          errors: []
        }
      };

    } catch (error) {
      this.state = EngineState.ERROR;
      return {
        nodes: [],
        convergenceState: this.spatialOptimizer.getConvergenceState(),
        performanceMetrics: this.similarityProcessor.getPerformanceMetrics(),
        processingTime: performance.now() - this.startTime,
        memoryUsage: this.estimateMemoryUsage(0),
        status: {
          success: false,
          warnings: [],
          errors: [error instanceof Error ? error.message : 'Unknown layout error']
        }
      };
    }
  }

  /**
   * Update positions maintaining stability
   */
  public async updatePositionsAsync(
    nodeUpdates: NodeUpdate[],
    preserveStability: boolean = true
  ): Promise<void> {
    if (this.state !== EngineState.CONVERGED && this.state !== EngineState.PROCESSING) {
      throw new Error(`Cannot update positions: engine state is ${this.state}`);
    }

    // Extract current positions and node IDs for update
    const currentPositions: Position3D[] = [];
    const nodeIds: string[] = [];
    
    for (const layoutNode of this.layoutNodes.values()) {
      currentPositions.push(layoutNode.position);
      nodeIds.push(layoutNode.originalNode.id);
    }

    // Apply updates using spatial optimizer
    const updatedPositions = this.spatialOptimizer.updateNodePositions(
      nodeUpdates, 
      currentPositions, 
      nodeIds
    );

    // Update layout nodes with new positions
    for (let i = 0; i < nodeIds.length; i++) {
      const layoutNode = this.layoutNodes.get(nodeIds[i]);
      if (layoutNode && i < updatedPositions.length) {
        const updatedNode: EnhancedLayoutNode = {
          ...layoutNode,
          position: updatedPositions[i],
          metadata: {
            ...layoutNode.metadata,
            lastUpdated: Date.now(),
            isStable: preserveStability ? layoutNode.metadata.isStable : false
          }
        };
        this.layoutNodes.set(nodeIds[i], updatedNode);
      }
    }
  }

  /**
   * Switch coordinate dimensions
   */
  public async switchDimensionsAsync(targetDimensions: 2 | 3): Promise<TransitionResult> {
    const fromDimensions = this.config.dimensions;
    
    if (fromDimensions === targetDimensions) {
      return {
        success: true,
        fromDimensions,
        toDimensions: targetDimensions,
        positionDeviations: [],
        transitionTime: 0
      };
    }

    const startTime = performance.now();
    const positionDeviations: any[] = [];

    // Transform positions between dimensions
    for (const layoutNode of this.layoutNodes.values()) {
      const currentPos = layoutNode.position;
      
      const newPosition: Position3D = targetDimensions === 2 
        ? { x: currentPos.x, y: currentPos.y, z: 0 } // Flatten to 2D
        : { x: currentPos.x, y: currentPos.y, z: Math.random() * 200 - 100 }; // Expand to 3D
      
      // Track deviation
      const deviation = this.spatialOptimizer.calculatePositionDelta(newPosition, currentPos);
      positionDeviations.push(deviation);

      // Update layout node
      const updatedNode: EnhancedLayoutNode = {
        ...layoutNode,
        position: newPosition,
        metadata: {
          ...layoutNode.metadata,
          lastUpdated: Date.now()
        }
      };
      this.layoutNodes.set(layoutNode.originalNode.id, updatedNode);
    }

    const transitionTime = performance.now() - startTime;

    return {
      success: true,
      fromDimensions,
      toDimensions: targetDimensions,
      positionDeviations,
      transitionTime
    };
  }

  /**
   * Register custom similarity function
   */
  public registerSimilarityFunction(
    name: string, 
    functor: SimilarityFunctor, 
    weight?: number
  ): void {
    this.similarityProcessor.registerSimilarityFunction(name, functor, weight);
  }

  /**
   * Get current layout status
   */
  public getStatus(): { state: EngineState; convergence: ConvergenceMetrics } {
    return {
      state: this.state,
      convergence: this.spatialOptimizer.getConvergenceState()
    };
  }

  // Private helper methods

  private createDefaultConfig(partial?: Partial<LayoutConfig>): LayoutConfig {
    const defaultConfig: LayoutConfig = {
      dimensions: 2,
      similarityThreshold: 0.3,
      convergenceThreshold: 0.01,
      maxIterations: 1000,
      forceIntegration: {
        enablePhysics: true,
        similarityStrength: 0.5,
        repulsionStrength: -100,
        centeringStrength: 1.0
      },
      progressiveRefinement: {
        enablePhases: true,
        phase1Duration: 500,
        phase2Duration: 2000,
        importanceWeights: {
          degree: 0.4,
          betweenness: 0.3,
          eigenvector: 0.3
        }
      },
      memoryManagement: {
        useTypedArrays: true,
        cacheSize: 10000,
        historySize: 10,
        gcThreshold: 0.8
      }
    };

    return partial ? { ...defaultConfig, ...partial } : defaultConfig;
  }

  private createClusteringContext(config: LayoutConfig): ClusteringContext {
    return {
      currentIteration: 0,
      alpha: 1.0,
      spatialIndex: null, // TODO: Initialize QuadTree spatial index
      cacheManager: null, // TODO: Initialize similarity cache manager
      performanceMetrics: this.similarityProcessor.getPerformanceMetrics(),
      layoutConfig: config
    };
  }

  private createLayoutNodes(nodes: Node[], positions: Position3D[]): EnhancedLayoutNode[] {
    const layoutNodes: EnhancedLayoutNode[] = [];

    for (let i = 0; i < nodes.length && i < positions.length; i++) {
      const node = nodes[i];
      const position = positions[i];

      // Calculate node importance (simplified for now)
      const importance: NodeImportance = {
        degree: (node as any).connections || 1,
        betweenness: Math.random(), // TODO: Implement actual betweenness centrality
        eigenvector: Math.random(), // TODO: Implement actual eigenvector centrality  
        composite: Math.random()    // TODO: Calculate weighted combination
      };

      const layoutNode: EnhancedLayoutNode = {
        id: `layout-${node.id}`,
        originalNode: node,
        position,
        cluster: undefined, // TODO: Implement clustering assignment
        similarityScores: new Map(),
        convergenceState: {
          isStable: false,
          positionDelta: 1.0,
          stabilityHistory: [1.0]
        },
        importance,
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          isStable: false,
          phase: LayoutPhase.COARSE,
          forceContributions: []
        }
      };

      layoutNodes.push(layoutNode);
      this.layoutNodes.set(node.id, layoutNode);
    }

    return layoutNodes;
  }

  private estimateMemoryUsage(nodeCount: number): MemoryUsage {
    const coordinateStorage = nodeCount * 24; // 3 floats * 8 bytes for position
    const cacheSize = this.similarityProcessor.getCacheStatistics().memoryUsage;
    const spatialIndexSize = nodeCount * 16; // Rough estimate for spatial indexing
    const totalEstimated = coordinateStorage + cacheSize + spatialIndexSize;

    return {
      coordinateStorage,
      cacheSize,
      spatialIndexSize,
      totalEstimated,
      heapUsagePercent: (totalEstimated / (1024 * 1024)) * 100 // Convert to MB percentage (rough)
    };
  }
}