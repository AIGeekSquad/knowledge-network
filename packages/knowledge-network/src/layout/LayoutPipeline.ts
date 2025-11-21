/**
 * @fileoverview LayoutPipeline - Orchestrates the layout execution flow
 * 
 * Encapsulates the steps of the layout process: initialization, similarity calculation,
 * spatial optimization, and finalization.
 */

import {
    Node,
    EnhancedLayoutNode,
    SimilarityFunctor,
    ClusteringContext,
    LayoutConfig,
    LayoutResult,
    MemoryUsage,
    Position3D,
    NodeImportance,
    LayoutPhase
} from '../types';
import {
    LayoutEventEmitter,
    LayoutProgressEvent,
    LayoutCompleteEvent
} from './LayoutEvents';
import { SimilarityProcessor } from './SimilarityProcessor';
import { SpatialOptimizer } from './SpatialOptimizer';

export class LayoutPipeline {
    private readonly similarityProcessor: SimilarityProcessor;
    private readonly spatialOptimizer: SpatialOptimizer;
    private readonly eventEmitter: LayoutEventEmitter;
    private startTime: number = 0;

    constructor(
        similarityProcessor: SimilarityProcessor,
        spatialOptimizer: SpatialOptimizer,
        eventEmitter: LayoutEventEmitter
    ) {
        this.similarityProcessor = similarityProcessor;
        this.spatialOptimizer = spatialOptimizer;
        this.eventEmitter = eventEmitter;
    }

    public async executeAsync(
        nodes: Node[],
        similarityFunctor: SimilarityFunctor,
        config: LayoutConfig
    ): Promise<LayoutResult> {
        this.startTime = performance.now();

        try {
            // 1. Initialization
            this.emitProgress('nodeLoading', 0, 'initialization', 0, nodes.length);
            const context = this.createClusteringContext(config);

            // 2. Similarity Calculation
            this.similarityProcessor.validateFunctorContract(similarityFunctor);
            this.emitProgress('nodeLayout', 25, 'similarity-calculation', 0, nodes.length);

            const similarities = this.similarityProcessor.calculateSimilarityMatrix(
                nodes,
                similarityFunctor,
                context
            );

            // 3. Spatial Optimization
            this.emitProgress('nodeLayout', 50, 'spatial-optimization', nodes.length, nodes.length);

            const positions = this.spatialOptimizer.optimizePositions(similarities, {
                dimensions: config.dimensions,
                boundingBox: {
                    minX: 0, maxX: 800,
                    minY: 0, maxY: 600,
                    minZ: 0, maxZ: config.dimensions === 3 ? 400 : 0
                }
            });

            // 4. Finalization
            const layoutNodes = this.createLayoutNodes(nodes, positions);

            this.emitProgress('nodeLayout', 75, 'convergence', nodes.length, nodes.length);
            const convergenceState = this.spatialOptimizer.getConvergenceState();

            const totalTime = performance.now() - this.startTime;

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
            return this.handleError(error);
        }
    }

    private emitProgress(
        type: 'nodeLoading' | 'nodeLayout' | 'nodeLayoutComplete',
        progress: number,
        phase: string,
        nodesProcessed: number,
        totalNodes: number
    ): void {
        this.eventEmitter.emit('layoutProgress', {
            type,
            progress,
            phase,
            nodesProcessed,
            totalNodes,
            timeElapsed: performance.now() - this.startTime
        } as LayoutProgressEvent);
    }

    private createClusteringContext(config: LayoutConfig): ClusteringContext {
        return {
            currentIteration: 0,
            alpha: 1.0,
            spatialIndex: null,
            cacheManager: null,
            performanceMetrics: this.similarityProcessor.getPerformanceMetrics(),
            layoutConfig: config
        };
    }

    private createLayoutNodes(nodes: Node[], positions: Position3D[]): EnhancedLayoutNode[] {
        const layoutNodes: EnhancedLayoutNode[] = [];

        for (let i = 0; i < nodes.length && i < positions.length; i++) {
            const node = nodes[i];
            const position = positions[i];

            const importance: NodeImportance = {
                degree: (node as any).connections || 1,
                betweenness: Math.random(),
                eigenvector: Math.random(),
                composite: Math.random()
            };

            const layoutNode: EnhancedLayoutNode = {
                id: `layout-${node.id}`,
                originalNode: node,
                position,
                cluster: undefined,
                similarityScores: new Map(),
                convergenceState: {
                    isStable: false,
                    velocity: { x: 0, y: 0, z: 0 },
                    force: { x: 0, y: 0, z: 0 },
                    lastMovement: 0
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
        }

        return layoutNodes;
    }

    private estimateMemoryUsage(nodeCount: number): MemoryUsage {
        const coordinateStorage = nodeCount * 24;
        const cacheSize = this.similarityProcessor.getCacheStatistics().memoryUsage;
        const spatialIndexSize = nodeCount * 16;
        const totalEstimated = coordinateStorage + cacheSize + spatialIndexSize;

        return {
            coordinateStorage,
            cacheSize,
            spatialIndexSize,
            totalEstimated,
            heapUsagePercent: (totalEstimated / (1024 * 1024)) * 100
        };
    }

    private handleError(error: unknown): LayoutResult {
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
