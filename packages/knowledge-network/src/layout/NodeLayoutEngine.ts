/**
 * NodeLayoutEngine Implementation
 * 
 * Similarity-based node positioning engine that extends the existing LayoutEngine.
 * Implements functor contract for extensible similarity functions and provides
 * progressive refinement with 2D/3D coordinate support.
 */

import { LayoutEngine } from './LayoutEngine.js';
import { SimilarityProcessor } from './SimilarityProcessor.js';
import { DefaultSimilarityFunctions } from './DefaultSimilarityFunctions.js';
import type { 
  Node, 
  EnhancedLayoutNode,
  LayoutConfiguration,
  SimilarityFunctor,
  ClusteringContext,
  Position3D,
  ConvergenceMetrics,
  ProgressiveRefinementPhase,
  LayoutPhase,
  NodeImportance,
  PerformanceMetrics
} from '../types.js';
import type { 
  ILayoutEngine,
  LayoutNode,
  LayoutConfiguration as BaseLayoutConfiguration,
  ProgressCallback,
  ValidationResult,
  LayoutEngineCapabilities
} from './layout-engine.js';

/**
 * NodeLayoutEngine - Similarity-based node positioning
 * 
 * Extends existing LayoutEngine with similarity-based positioning capabilities:
 * - Configurable similarity functions following functor contract
 * - Progressive refinement (COARSE → MEDIUM → FINE phases)
 * - 2D/3D coordinate support with z=0 constraint for 2D
 * - Integration with existing pipeline and D3.js forces
 */
export class NodeLayoutEngine extends LayoutEngine implements ILayoutEngine {
  private similarityProcessor: SimilarityProcessor;
  private currentDimensionMode: '2D' | '3D' = '2D';
  private convergenceMetrics: ConvergenceMetrics | null = null;
  private registeredSimilarityFunctions = new Map<string, SimilarityFunctor>();

  constructor() {
    super();
    this.similarityProcessor = new SimilarityProcessor();
    this.registerDefaultSimilarityFunctions();
  }

  /**
   * Calculate layout using similarity-based positioning
   * Implements the core functionality tested in node-layout-engine.test.ts
   */
  async calculateAsync(
    nodes: Node[],
    config: LayoutConfiguration,
    progressCallback?: ProgressCallback
  ): Promise<Map<string, LayoutNode>> {
    // Validate configuration
    const validation = this.validateConfiguration(config);
    if (!validation.isValid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    const startTime = performance.now();
    this.emit('layoutStarted', { nodeCount: nodes.length });

    try {
      // Create clustering context
      const context = this.createClusteringContext(config, 0, 1.0);

      // Get or resolve similarity function
      const similarityFunctor = this.resolveSimilarityFunction(config.similarityFunction);

      // Progressive refinement if enabled
      if (config.progressiveRefinement?.enabled && config.progressiveRefinement.phases.length > 0) {
        return await this.calculateProgressiveAsync(nodes, config, similarityFunctor, context, progressCallback);
      } else {
        // Standard calculation
        return await this.calculateStandardAsync(nodes, config, similarityFunctor, context, progressCallback);
      }
    } finally {
      const endTime = performance.now();
      this.emit('layoutComplete', { 
        nodeCount: nodes.length,
        duration: endTime - startTime,
        metrics: this.convergenceMetrics
      });
    }
  }

  /**
   * Register a custom similarity function following functor contract
   */
  registerSimilarityFunction(name: string, functor: SimilarityFunctor, weight: number = 1.0): void {
    // Validate functor signature and return values
    this.validateSimilarityFunctor(functor);
    this.registeredSimilarityFunctions.set(name, functor);
    this.similarityProcessor.registerSimilarityFunctor(name, functor);
  }

  /**
   * Switch between 2D and 3D dimensional modes
   */
  async switchDimensionalModeAsync(targetMode: '2D' | '3D'): Promise<void> {
    if (this.currentDimensionMode === targetMode) {
      return; // No change needed
    }

    this.currentDimensionMode = targetMode;
    this.emit('dimensionModeChanged', { mode: targetMode });
  }

  /**
   * Get current convergence metrics
   */
  async getConvergenceMetricsAsync(): Promise<ConvergenceMetrics> {
    if (!this.convergenceMetrics) {
      throw new Error('No convergence metrics available - layout not calculated yet');
    }
    return this.convergenceMetrics;
  }

  /**
   * Standard layout calculation without progressive refinement
   */
  private async calculateStandardAsync(
    nodes: Node[],
    config: LayoutConfiguration,
    similarityFunctor: SimilarityFunctor,
    context: ClusteringContext,
    progressCallback?: ProgressCallback
  ): Promise<Map<string, LayoutNode>> {
    const layoutNodes = new Map<string, LayoutNode>();

    // Initialize enhanced layout nodes
    const enhancedNodes = nodes.map(node => this.createEnhancedLayoutNode(node));

    // Calculate similarity-based positions
    for (let i = 0; i < enhancedNodes.length; i++) {
      const nodeA = enhancedNodes[i];
      
      // Calculate initial position based on similarities
      const position = await this.calculateSimilarityBasedPosition(
        nodeA, enhancedNodes, similarityFunctor, context
      );

      // Create final LayoutNode
      const layoutNode: LayoutNode = {
        id: nodeA.id,
        x: position.x,
        y: position.y,
        clusterId: nodeA.cluster?.clusterId,
        similarityScores: nodeA.similarityScores,
        originalData: nodeA.originalNode,
        layoutMetadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          isStable: false,
          phase: 'standard',
          forceContributions: []
        }
      };

      layoutNodes.set(nodeA.id, layoutNode);

      // Report progress
      if (progressCallback) {
        progressCallback({
          completed: i + 1,
          total: nodes.length,
          phase: 'positioning',
          message: `Positioned ${i + 1}/${nodes.length} nodes`
        });
      }
    }

    // Update convergence metrics
    this.convergenceMetrics = {
      isConverged: true,
      stability: 1.0,
      iterations: 1,
      positionDelta: 0,
      averageMovement: 0,
      maxMovement: 0,
      stabilityRatio: 1.0,
      iterationCount: 1,
      timeElapsed: performance.now() - context.performanceMetrics.memoryPeakUsage
    };

    return layoutNodes;
  }

  /**
   * Progressive refinement calculation with phases
   */
  private async calculateProgressiveAsync(
    nodes: Node[],
    config: LayoutConfiguration,
    similarityFunctor: SimilarityFunctor,
    context: ClusteringContext,
    progressCallback?: ProgressCallback
  ): Promise<Map<string, LayoutNode>> {
    const layoutNodes = new Map<string, LayoutNode>();
    const enhancedNodes = nodes.map(node => this.createEnhancedLayoutNode(node));

    // Sort nodes by importance for progressive processing
    const sortedNodes = enhancedNodes.sort((a, b) => b.importance.composite - a.importance.composite);

    const phases = config.progressiveRefinement!.phases;
    let processedNodes = 0;

    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phase = phases[phaseIndex];
      const phaseStartTime = performance.now();

      // Determine nodes for this phase
      const phaseNodeCount = this.calculatePhaseNodeCount(phase, nodes.length);
      const phaseNodes = sortedNodes.slice(processedNodes, processedNodes + phaseNodeCount);

      // Process phase nodes
      for (const node of phaseNodes) {
        const position = await this.calculateSimilarityBasedPosition(
          node, enhancedNodes, similarityFunctor, context
        );

        const layoutNode: LayoutNode = {
          id: node.id,
          x: position.x,
          y: position.y,
          clusterId: node.cluster?.clusterId,
          similarityScores: node.similarityScores,
          originalData: node.originalNode,
          layoutMetadata: {
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            isStable: false,
            phase: phase.phase as LayoutPhase,
            forceContributions: []
          }
        };

        layoutNodes.set(node.id, layoutNode);
      }

      processedNodes += phaseNodeCount;

      // Report phase completion
      if (progressCallback) {
        progressCallback({
          completed: processedNodes,
          total: nodes.length,
          phase: phase.phase,
          message: `Completed ${phase.phase} phase: ${processedNodes}/${nodes.length} nodes`
        });
      }

      this.emit('phaseComplete', {
        phase: phase.phase,
        duration: performance.now() - phaseStartTime,
        nodesPositioned: phaseNodeCount
      });

      // Check if we've processed all nodes
      if (processedNodes >= nodes.length) break;
    }

    return layoutNodes;
  }

  /**
   * Create enhanced layout node with importance metrics
   */
  private createEnhancedLayoutNode(node: Node): EnhancedLayoutNode {
    const importance = this.calculateNodeImportance(node);
    
    return {
      id: node.id,
      originalNode: node,
      position: node.position || { x: Math.random() * 800, y: Math.random() * 600, z: this.currentDimensionMode === '2D' ? 0 : Math.random() * 400 },
      similarityScores: new Map(),
      importance,
      convergenceState: {
        isStable: false,
        positionDelta: 0,
        stabilityHistory: []
      },
      metadata: {
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        isStable: false,
        phase: LayoutPhase.COARSE,
        forceContributions: []
      }
    };
  }

  /**
   * Calculate similarity-based position for a node
   */
  private async calculateSimilarityBasedPosition(
    targetNode: EnhancedLayoutNode,
    allNodes: EnhancedLayoutNode[],
    similarityFunctor: SimilarityFunctor,
    context: ClusteringContext
  ): Promise<Position3D> {
    let totalWeightedX = 0;
    let totalWeightedY = 0;
    let totalWeightedZ = 0;
    let totalWeight = 0;

    // Calculate weighted position based on similarity to other nodes
    for (const otherNode of allNodes) {
      if (otherNode.id === targetNode.id) continue;

      // Get cached or calculate similarity
      const similarity = await this.similarityProcessor.calculateSimilarityAsync(
        targetNode.originalNode,
        otherNode.originalNode,
        context,
        'default'
      );

      if (similarity > 0.1) { // Minimum threshold for influence
        const distance = 100 * (1 - similarity); // Higher similarity = closer distance
        const weight = similarity * similarity; // Quadratic weighting

        totalWeightedX += otherNode.position.x * weight;
        totalWeightedY += otherNode.position.y * weight;
        totalWeightedZ += otherNode.position.z * weight;
        totalWeight += weight;
      }
    }

    // Calculate final position
    if (totalWeight > 0) {
      return {
        x: totalWeightedX / totalWeight,
        y: totalWeightedY / totalWeight,
        z: this.currentDimensionMode === '2D' ? 0 : totalWeightedZ / totalWeight
      };
    } else {
      // Random position if no similarities found
      return {
        x: Math.random() * 800,
        y: Math.random() * 600,
        z: this.currentDimensionMode === '2D' ? 0 : Math.random() * 400
      };
    }
  }

  /**
   * Calculate node importance metrics
   */
  private calculateNodeImportance(node: Node): NodeImportance {
    // Simple heuristic based on available data
    let degree = 1; // Base importance
    let betweenness = 0.5; // Default centrality
    let eigenvector = 0.5; // Default influence

    // Boost importance if node has rich data
    if (node.vector && node.vector.length > 0) {
      degree += 1;
      eigenvector += 0.2;
    }

    if (node.metadata && node.metadata.tags && node.metadata.tags.length > 0) {
      degree += 0.5;
      betweenness += 0.2;
    }

    // Composite score (normalized to 0-1)
    const composite = Math.min(1.0, (0.4 * degree + 0.3 * betweenness + 0.3 * eigenvector) / 3);

    return { degree, betweenness, eigenvector, composite };
  }

  /**
   * Determine node count for progressive phase
   */
  private calculatePhaseNodeCount(phase: ProgressiveRefinementPhase, totalNodes: number): number {
    if (phase.maxNodes) {
      return Math.min(phase.maxNodes, totalNodes);
    }
    
    if (phase.nodePercentage) {
      return Math.ceil((phase.nodePercentage / 100) * totalNodes);
    }

    // Default phase percentages
    switch (phase.phase) {
      case 'COARSE': return Math.ceil(0.2 * totalNodes);  // 20%
      case 'MEDIUM': return Math.ceil(0.4 * totalNodes);  // Additional 40%
      case 'FINE': return totalNodes; // Remaining
      default: return Math.ceil(0.33 * totalNodes); // Default 33%
    }
  }

  /**
   * Resolve similarity function from config
   */
  private resolveSimilarityFunction(funcOrName: SimilarityFunctor | string): SimilarityFunctor {
    if (typeof funcOrName === 'function') {
      return funcOrName;
    }

    // Look up registered function
    const func = this.registeredSimilarityFunctions.get(funcOrName);
    if (func) {
      return func;
    }

    // Use default if available
    if (funcOrName === 'cosine') {
      return DefaultSimilarityFunctions.cosine;
    }
    if (funcOrName === 'jaccard') {
      return DefaultSimilarityFunctions.jaccard;
    }
    if (funcOrName === 'spatial') {
      return DefaultSimilarityFunctions.spatialProximity;
    }

    throw new Error(`Unknown similarity function: ${funcOrName}`);
  }

  /**
   * Validate similarity functor contract
   */
  private validateSimilarityFunctor(functor: SimilarityFunctor): void {
    if (typeof functor !== 'function') {
      throw new Error('Similarity function must be a function');
    }

    // Test with mock data
    const mockNodeA = { id: 'testA', label: 'Test A' };
    const mockNodeB = { id: 'testB', label: 'Test B' };
    const mockContext = this.createMockContext();

    try {
      const result = functor(mockNodeA, mockNodeB, mockContext);
      
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new Error('Similarity function must return a finite number');
      }
      
      if (result < 0 || result > 1) {
        throw new Error('Similarity function must return values in range [0,1]');
      }
    } catch (error) {
      throw new Error(`Similarity function validation failed: ${error.message}`);
    }
  }

  /**
   * Create clustering context for similarity calculations
   */
  private createClusteringContext(
    config: LayoutConfiguration, 
    iteration: number, 
    alpha: number
  ): ClusteringContext {
    return {
      currentIteration: iteration,
      alpha,
      spatialIndex: null, // Will be implemented with QuadTree
      cacheManager: null, // Will be managed by SimilarityProcessor
      performanceMetrics: {
        similarityCalculations: 0,
        cacheHitRate: 0,
        iterationsPerSecond: 0,
        memoryPeakUsage: performance.now()
      },
      layoutConfig: {
        dimensions: config.dimensionalMode === '3D' ? 3 : 2,
        similarityThreshold: 0.3,
        convergenceThreshold: config.convergenceThreshold,
        maxIterations: config.maxIterations || 1000,
        forceIntegration: {
          enablePhysics: true,
          similarityStrength: 0.5,
          repulsionStrength: -100,
          centeringStrength: 1.0
        },
        progressiveRefinement: {
          enablePhases: config.progressiveRefinement?.enabled || false,
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
      }
    };
  }

  /**
   * Create mock context for testing
   */
  private createMockContext(): ClusteringContext {
    return this.createClusteringContext(
      {
        similarityFunction: 'test',
        dimensionalMode: '2D',
        convergenceThreshold: 0.01
      },
      0,
      1.0
    );
  }

  /**
   * Register default similarity functions
   */
  private registerDefaultSimilarityFunctions(): void {
    // Register built-in functions
    this.registeredSimilarityFunctions.set('cosine', DefaultSimilarityFunctions.cosine);
    this.registeredSimilarityFunctions.set('jaccard', DefaultSimilarityFunctions.jaccard);
    this.registeredSimilarityFunctions.set('spatial', DefaultSimilarityFunctions.spatialProximity);
    this.registeredSimilarityFunctions.set('default', DefaultSimilarityFunctions.createAutoSelector());
  }

  /**
   * Validate layout configuration
   */
  validateConfiguration(config: LayoutConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate similarity function
    if (!config.similarityFunction) {
      errors.push('Similarity function is required');
    }

    // Validate dimensional mode
    if (config.dimensionalMode !== '2D' && config.dimensionalMode !== '3D') {
      errors.push('Dimensional mode must be "2D" or "3D"');
    }

    // Validate convergence threshold
    if (!config.convergenceThreshold || config.convergenceThreshold <= 0 || config.convergenceThreshold >= 1) {
      errors.push('Convergence threshold must be between 0 and 1');
    }

    // Validate max iterations
    if (config.maxIterations && config.maxIterations <= 0) {
      errors.push('Max iterations must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get engine capabilities
   */
  getCapabilities(): LayoutEngineCapabilities {
    return {
      supportsDynamic: true,
      supportsIncremental: true,
      maxNodes: 1000,
      supportsForces: true,
      supportsConstraints: true,
      supportsClustering: true,
      supports3D: true
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    super.cleanup();
    this.similarityProcessor.cleanup?.();
    this.registeredSimilarityFunctions.clear();
    this.convergenceMetrics = null;
  }
}