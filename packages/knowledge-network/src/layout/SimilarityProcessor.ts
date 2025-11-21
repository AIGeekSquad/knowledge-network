/**
 * @fileoverview SimilarityProcessor - Executes similarity calculations and manages custom functor integration
 * 
 * Implements functor contract compliance for similarity-based node positioning with runtime registration,
 * weighted composition, caching, and performance optimization.
 */

import {
  Node,
  SimilarityFunctor,
  ClusteringContext,
  WeightedSimilarityFunction,
  SimilarityFunctionMetadata,
  PerformanceMetrics,
  CacheStatistics,
  CacheEntry,
  CacheConfig
} from '../types';
import {
  cosineSimilarity,
  jaccardSimilarity,
  spatialProximity
} from './DefaultSimilarityFunctions';
import { SimilarityCache } from './SimilarityCache';
import { LayoutConfigFactory } from './LayoutConfigFactory';

/**
 * SimilarityProcessor handles similarity function execution with functor contract compliance
 */
export class SimilarityProcessor {
  private readonly registeredFunctions = new Map<string, WeightedSimilarityFunction>();
  private readonly cache: SimilarityCache;
  private performanceMetrics: PerformanceMetrics;

  constructor() {
    this.performanceMetrics = {
      similarityCalculations: 0,
      cacheHitRate: 0,
      iterationsPerSecond: 0,
      memoryPeakUsage: 0
    };

    this.cache = new SimilarityCache({
      ttl: 30000, // 30 seconds default
      maxSize: 10000,
      evictionPolicy: 'lru',
      invalidationEvents: ['node-updated', 'function-changed']
    });

    // Register default similarity functions
    this.registerDefaultFunctions();
  }

  /**
   * Validate functor contract compliance
   */
  public validateFunctorContract(functor: any): void {
    if (typeof functor !== 'function') {
      throw new Error('Invalid functor signature: functor must be a function');
    }

    // Check function signature - should have 3 parameters
    if (functor.length !== 3) {
      throw new Error('Invalid functor signature: functor must accept exactly 3 parameters (nodeA, nodeB, context)');
    }

    // Test basic contract compliance
    try {
      const testNodeA: Node = { id: 'test-a', label: 'Test A' };
      const testNodeB: Node = { id: 'test-b', label: 'Test B' };
      const testContext: ClusteringContext = this.createMinimalTestContext();

      const result = functor(testNodeA, testNodeB, testContext);

      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid functor signature: functor must return a finite number');
      }
    } catch (error) {
      throw new Error(`Invalid functor signature: ${error instanceof Error ? error.message : 'Contract validation failed'}`);
    }
  }

  /**
   * Calculate similarity between two nodes using specified functor
   */
  public calculateSimilarity(
    nodeA: Node,
    nodeB: Node,
    functor: SimilarityFunctor,
    context: ClusteringContext
  ): number {
    // Input validation
    if (!nodeA || !nodeB) {
      throw new Error('Invalid node input: nodes cannot be null or undefined');
    }

    if (!context) {
      throw new Error('Invalid clustering context: context cannot be null or undefined');
    }

    // Check cache first
    const cacheKey = this.generatePairKey(nodeA.id, nodeB.id);
    const cached = this.cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Calculate similarity
    try {
      const startTime = performance.now();
      const similarity = functor(nodeA, nodeB, context);
      const endTime = performance.now();

      // Validate result
      if (typeof similarity !== 'number' || isNaN(similarity) || !isFinite(similarity)) {
        throw new Error('Similarity calculation failed: functor returned invalid number');
      }

      if (similarity < 0 || similarity > 1) {
        throw new Error(`Similarity calculation failed: result ${similarity} outside valid range [0, 1]`);
      }

      // Cache result
      this.cache.set(cacheKey, similarity);

      // Update performance metrics
      this.performanceMetrics.similarityCalculations++;
      this.updatePerformanceMetrics(endTime - startTime);

      return similarity;
    } catch (error) {
      throw new Error(`Similarity calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register similarity function with weight
   */
  public registerSimilarityFunction(
    name: string,
    functor: SimilarityFunctor,
    weight: number = 1.0
  ): void {
    if (this.registeredFunctions.has(name)) {
      throw new Error(`Function name already registered: ${name}`);
    }

    // Validate functor contract
    this.validateFunctorContract(functor);

    // Validate weight
    if (weight < 0 || !isFinite(weight)) {
      throw new Error(`Invalid weight: ${weight} must be non-negative finite number`);
    }

    const weightedFunction: WeightedSimilarityFunction = {
      name,
      functor,
      weight,
      isDefault: false,
      metadata: {
        description: `Custom similarity function: ${name}`,
        expectedDataTypes: [],
        performanceHint: 'moderate',
        deterministic: true
      }
    };

    this.registeredFunctions.set(name, weightedFunction);
  }

  /**
   * Get list of registered function names
   */
  public getRegisteredFunctions(): string[] {
    return Array.from(this.registeredFunctions.keys());
  }

  /**
   * Check if function is registered
   */
  public hasFunction(name: string): boolean {
    return this.registeredFunctions.has(name);
  }

  /**
   * Calculate weighted similarity using multiple functions
   */
  public calculateWeightedSimilarity(
    nodeA: Node,
    nodeB: Node,
    functionNames: string[],
    context: ClusteringContext
  ): number {
    let totalSimilarity = 0;
    let totalWeight = 0;

    for (const name of functionNames) {
      const func = this.registeredFunctions.get(name);
      if (!func) {
        throw new Error(`Similarity function not found: ${name}`);
      }

      const similarity = this.calculateSimilarity(nodeA, nodeB, func.functor, context);
      totalSimilarity += similarity * func.weight;
      totalWeight += func.weight;
    }

    return totalWeight > 0 ? totalSimilarity / totalWeight : 0;
  }

  /**
   * Calculate similarity matrix for all node pairs
   */
  public calculateSimilarityMatrix(
    nodes: Node[],
    functor: SimilarityFunctor,
    context: ClusteringContext
  ): Map<string, number> {
    const matrix = new Map<string, number>();

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = this.calculateSimilarity(nodes[i], nodes[j], functor, context);
        const key = this.generatePairKey(nodes[i].id, nodes[j].id);
        matrix.set(key, similarity);

        // Set symmetric entry
        const symmetricKey = this.generatePairKey(nodes[j].id, nodes[i].id);
        matrix.set(symmetricKey, similarity);
      }
    }

    return matrix;
  }

  /**
   * Generate consistent cache key for node pairs
   */
  public generatePairKey(nodeIdA: string, nodeIdB: string): string {
    // Ensure consistent ordering for symmetric similarity
    const [first, second] = [nodeIdA, nodeIdB].sort();
    return `${first}|${second}`;
  }

  /**
   * Get cache statistics
   */
  public getCacheStatistics(): CacheStatistics {
    return this.cache.getStatistics();
  }

  /**
   * Get default similarity function by name
   */
  public getDefaultSimilarityFunction(name: string): SimilarityFunctor {
    const func = this.registeredFunctions.get(name);
    if (!func) {
      throw new Error(`Default similarity function not found: ${name}`);
    }
    return func.functor;
  }

  /**
   * Auto-select appropriate similarity function based on node data
   */
  public selectAppropiateSimilarityFunction(nodes: Node[]): string {
    // Check for vector data
    const hasVectors = nodes.some(node => node.vector && node.vector.length > 0);
    if (hasVectors) return 'cosine';

    // Check for metadata
    const hasMetadata = nodes.some(node => node.metadata);
    if (hasMetadata) return 'jaccard';

    // Fallback to spatial proximity
    return 'spatial';
  }

  /**
   * Calculate similarity with spatial optimization
   */
  public calculateSimilarityWithSpatialOptimization(
    targetNode: Node,
    allNodes: Node[],
    functor: SimilarityFunctor,
    context: ClusteringContext
  ): { nodeId: string; similarity: number }[] {
    // If spatial index available, use it to limit calculations
    if (context.spatialIndex) {
      // TODO: Implement spatial optimization using QuadTree
      // For now, return limited subset for performance
      const nearby = allNodes.slice(0, Math.min(50, allNodes.length));

      return nearby
        .filter(node => node.id !== targetNode.id)
        .map(node => ({
          nodeId: node.id,
          similarity: this.calculateSimilarity(targetNode, node, functor, context)
        }))
        .sort((a, b) => b.similarity - a.similarity);
    }

    // Calculate all similarities if no spatial optimization
    return allNodes
      .filter(node => node.id !== targetNode.id)
      .map(node => ({
        nodeId: node.id,
        similarity: this.calculateSimilarity(targetNode, node, functor, context)
      }));
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Validate clustering context
   */
  public validateClusteringContext(context: ClusteringContext): void {
    if (context.alpha < 0) {
      throw new Error('Invalid clustering context: alpha must be >= 0');
    }

    if (context.currentIteration < 0) {
      throw new Error('Invalid clustering context: currentIteration must be >= 0');
    }

    if (!context.layoutConfig) {
      throw new Error('Invalid clustering context: layoutConfig is required');
    }
  }

  // Private helper methods

  private registerDefaultFunctions(): void {
    // Register default functions from DefaultSimilarityFunctions module
    this.registeredFunctions.set('cosine', {
      name: 'cosine',
      functor: cosineSimilarity,
      weight: 1.0,
      isDefault: true,
      metadata: {
        description: 'Cosine similarity for vector embeddings',
        expectedDataTypes: ['vector'],
        performanceHint: 'fast',
        deterministic: true
      }
    });

    this.registeredFunctions.set('jaccard', {
      name: 'jaccard',
      functor: jaccardSimilarity,
      weight: 1.0,
      isDefault: true,
      metadata: {
        description: 'Jaccard similarity for metadata overlap',
        expectedDataTypes: ['metadata', 'tags'],
        performanceHint: 'fast',
        deterministic: true
      }
    });

    this.registeredFunctions.set('spatial', {
      name: 'spatial',
      functor: spatialProximity,
      weight: 1.0,
      isDefault: true,
      metadata: {
        description: 'Spatial proximity similarity',
        expectedDataTypes: ['position'],
        performanceHint: 'fast',
        deterministic: true
      }
    });
  }

  private updatePerformanceMetrics(calculationTime: number): void {
    if (calculationTime > 0) {
      this.performanceMetrics.iterationsPerSecond = 1000 / calculationTime;
    }

    // Update cache hit rate
    const stats = this.cache.getStatistics();
    this.performanceMetrics.cacheHitRate = stats.hitRate;

    // Estimate memory usage
    this.performanceMetrics.memoryPeakUsage = Math.max(
      this.performanceMetrics.memoryPeakUsage,
      stats.memoryUsage
    );
  }

  private createMinimalTestContext(): ClusteringContext {
    return {
      currentIteration: 0,
      alpha: 1.0,
      spatialIndex: null,
      cacheManager: this.cache,
      performanceMetrics: this.performanceMetrics,
      layoutConfig: LayoutConfigFactory.createDefault()
    };
  }
}