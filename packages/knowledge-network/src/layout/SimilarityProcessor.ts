/**
 * SimilarityProcessor Implementation
 * 
 * Handles similarity function execution, caching, and performance optimization.
 * Implements LRU cache with TTL and supports weighted composition of multiple
 * similarity functions following the functor contract.
 */

import type {
  Node,
  SimilarityFunctor,
  ClusteringContext,
  CacheConfig,
  CacheEntry,
  CacheStatistics,
  PerformanceMetrics
} from '../types.js';

/**
 * Cache entry for similarity results
 */
interface SimilarityCacheEntry extends CacheEntry {
  lastAccessed: number;
}

/**
 * SimilarityProcessor - Execute and cache similarity calculations
 * 
 * Core responsibilities:
 * - Execute similarity functors with validation
 * - Maintain LRU cache with TTL for performance
 * - Support weighted composition of multiple functions
 * - Provide performance metrics and cache statistics
 */
export class SimilarityProcessor {
  private cache = new Map<string, SimilarityCacheEntry>();
  private registeredFunctors = new Map<string, SimilarityFunctor>();
  private config: CacheConfig;
  private statistics: CacheStatistics;

  constructor(cacheConfig?: Partial<CacheConfig>) {
    this.config = {
      ttl: cacheConfig?.ttl ?? 30000, // 30 seconds default
      maxSize: cacheConfig?.maxSize ?? 10000,
      evictionPolicy: cacheConfig?.evictionPolicy ?? 'lru',
      invalidationEvents: cacheConfig?.invalidationEvents ?? []
    };

    this.statistics = {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      memoryUsage: 0
    };
  }

  /**
   * Register a similarity functor with validation
   */
  registerSimilarityFunctor(name: string, functor: SimilarityFunctor): void {
    this.validateFunctor(functor);
    this.registeredFunctors.set(name, functor);
  }

  /**
   * Calculate similarity between two nodes with caching
   */
  async calculateSimilarityAsync(
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext,
    functorName: string
  ): Promise<number> {
    const cacheKey = this.generateCacheKey(nodeA.id, nodeB.id);

    // Check cache first
    const cached = this.getCachedSimilarity(cacheKey);
    if (cached !== null) {
      this.statistics.hitCount++;
      this.updateHitRate();
      return cached;
    }

    // Cache miss - calculate similarity
    this.statistics.missCount++;
    this.updateHitRate();

    const functor = this.registeredFunctors.get(functorName);
    if (!functor) {
      throw new Error(`Unknown similarity function: ${functorName}`);
    }

    let similarity: number;
    try {
      similarity = functor(nodeA, nodeB, context);
      
      // Validate and normalize result
      similarity = this.validateAndNormalize(similarity);
    } catch (error) {
      console.warn(`Similarity calculation failed for ${nodeA.id}-${nodeB.id}:`, error);
      similarity = 0; // Default to no similarity on error
    }

    // Store in cache
    this.setCachedSimilarity(cacheKey, similarity, nodeA.id, nodeB.id);

    return similarity;
  }

  /**
   * Calculate weighted composition of multiple similarity functions
   */
  async calculateWeightedSimilarityAsync(
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext,
    weights: Record<string, number>
  ): Promise<number> {
    const normalizedWeights = this.normalizeWeights(weights);
    let totalSimilarity = 0;

    for (const [functorName, weight] of Object.entries(normalizedWeights)) {
      if (weight > 0) {
        const similarity = await this.calculateSimilarityAsync(nodeA, nodeB, context, functorName);
        totalSimilarity += similarity * weight;
      }
    }

    return Math.max(0, Math.min(1, totalSimilarity));
  }

  /**
   * Batch similarity calculations for efficiency
   */
  async calculateBatchSimilarityAsync(
    nodePairs: [Node, Node][],
    context: ClusteringContext,
    functorName: string
  ): Promise<number[]> {
    const results: number[] = [];
    
    for (const [nodeA, nodeB] of nodePairs) {
      const similarity = await this.calculateSimilarityAsync(nodeA, nodeB, context, functorName);
      results.push(similarity);
    }

    return results;
  }

  /**
   * Get cache statistics
   */
  async getCacheStatisticsAsync(): Promise<CacheStatistics> {
    this.statistics.memoryUsage = this.estimateMemoryUsage();
    return { ...this.statistics };
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetricsAsync(): Promise<PerformanceMetrics> {
    return {
      similarityCalculations: this.statistics.hitCount + this.statistics.missCount,
      cacheHitRate: this.statistics.hitRate,
      iterationsPerSecond: 0, // Would be calculated based on actual timing
      memoryPeakUsage: this.statistics.memoryUsage
    };
  }

  /**
   * Generate consistent cache key for node pairs
   */
  private generateCacheKey(nodeAId: string, nodeBId: string): string {
    // Ensure consistent ordering for bidirectional similarity
    const [first, second] = [nodeAId, nodeBId].sort();
    return `${first}|${second}`;
  }

  /**
   * Get cached similarity if valid
   */
  private getCachedSimilarity(cacheKey: string): number | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    
    // Check TTL
    if (now - entry.timestamp > this.config.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Update access time for LRU
    entry.lastAccessed = now;
    entry.accessCount++;
    
    return entry.value;
  }

  /**
   * Store similarity in cache with eviction if needed
   */
  private setCachedSimilarity(
    cacheKey: string,
    similarity: number,
    nodeAId: string,
    nodeBId: string
  ): void {
    // Evict if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const entry: SimilarityCacheEntry = {
      value: similarity,
      timestamp: Date.now(),
      accessCount: 1,
      nodeHashes: [nodeAId, nodeBId],
      lastAccessed: Date.now()
    };

    this.cache.set(cacheKey, entry);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.statistics.evictionCount++;
    }
  }

  /**
   * Validate functor signature and behavior
   */
  private validateFunctor(functor: SimilarityFunctor): void {
    if (typeof functor !== 'function') {
      throw new Error('Similarity function must be a function');
    }

    // Test with mock data
    const mockNodeA = { id: 'testA', label: 'Test A' };
    const mockNodeB = { id: 'testB', label: 'Test B' };
    const mockContext: ClusteringContext = {
      currentIteration: 0,
      alpha: 1.0,
      spatialIndex: null,
      cacheManager: null,
      performanceMetrics: {
        similarityCalculations: 0,
        cacheHitRate: 0,
        iterationsPerSecond: 0,
        memoryPeakUsage: 0
      },
      layoutConfig: {
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
          enablePhases: false,
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

    try {
      const result = functor(mockNodeA, mockNodeB, mockContext);
      
      if (typeof result !== 'number' || !Number.isFinite(result)) {
        throw new Error('Similarity function must return a finite number');
      }
    } catch (error) {
      throw new Error(`Similarity function validation failed: ${error.message}`);
    }
  }

  /**
   * Validate and normalize similarity score to [0,1] range
   */
  private validateAndNormalize(similarity: number): number {
    if (typeof similarity !== 'number' || !Number.isFinite(similarity)) {
      return 0;
    }

    // Clamp to [0,1] range
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Normalize weights to sum to 1.0
   */
  private normalizeWeights(weights: Record<string, number>): Record<string, number> {
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + Math.abs(w), 0);
    
    if (totalWeight === 0) {
      return {}; // No valid weights
    }

    const normalized: Record<string, number> = {};
    for (const [name, weight] of Object.entries(weights)) {
      normalized[name] = Math.abs(weight) / totalWeight;
    }

    return normalized;
  }

  /**
   * Update hit rate statistic
   */
  private updateHitRate(): void {
    const total = this.statistics.hitCount + this.statistics.missCount;
    this.statistics.hitRate = total > 0 ? this.statistics.hitCount / total : 0;
  }

  /**
   * Estimate memory usage of cache
   */
  private estimateMemoryUsage(): number {
    // Rough estimation: ~100 bytes per cache entry
    return this.cache.size * 100;
  }

  /**
   * Clean up resources
   */
  cleanup?(): void {
    this.cache.clear();
    this.registeredFunctors.clear();
    this.statistics = {
      hitCount: 0,
      missCount: 0,
      hitRate: 0,
      evictionCount: 0,
      memoryUsage: 0
    };
  }
}

// Export types for testing
export type { SimilarityFunctor, ClusteringContext, SimilarityCache, CacheStatistics };