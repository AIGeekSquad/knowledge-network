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
  LayoutConfig,
  LayoutResult,
  NodeUpdate,
  TransitionResult,
  EngineState,
  ConvergenceMetrics,
  WeightedSimilarityFunction,
  Position3D,
  LayoutNodeMetadata
} from '../types';
import { LayoutEventEmitter } from './LayoutEvents';
import { SimilarityProcessor } from './SimilarityProcessor';
import { SpatialOptimizer } from './SpatialOptimizer';
import { EventEmitter } from '../utils/EventEmitter';
import { LayoutConfigFactory } from './LayoutConfigFactory';
import { LayoutPipeline } from './LayoutPipeline';
import { PositionUpdateService } from './PositionUpdateService';

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
  private readonly layoutPipeline: LayoutPipeline;
  private readonly positionUpdateService: PositionUpdateService;
  private readonly layoutNodes = new Map<string, EnhancedLayoutNode>();

  constructor(config?: Partial<LayoutConfig>) {
    this.id = `layout-engine-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.config = LayoutConfigFactory.create(config);
    this.state = EngineState.IDLE;

    // Initialize processors
    this.similarityProcessor = new SimilarityProcessor();
    this.spatialOptimizer = new SpatialOptimizer();
    this.eventEmitter = new EventEmitter();
    this.positionUpdateService = new PositionUpdateService();

    // Initialize pipeline
    this.layoutPipeline = new LayoutPipeline(
      this.similarityProcessor,
      this.spatialOptimizer,
      this.eventEmitter
    );

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

    // Merge configuration
    const mergedConfig = config ? { ...this.config, ...config } : this.config;

    this.state = EngineState.PROCESSING;

    const result = await this.layoutPipeline.executeAsync(
      nodes,
      similarityFunctor,
      mergedConfig
    );

    if (result.status.success) {
      this.state = EngineState.CONVERGED;
      // Update internal state
      result.nodes.forEach(node => {
        this.layoutNodes.set(node.originalNode.id, node);
      });
    } else {
      this.state = EngineState.ERROR;
    }

    return result;
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

    // Apply updates using position update service
    const updatedPositions = this.positionUpdateService.updatePositions(
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
}