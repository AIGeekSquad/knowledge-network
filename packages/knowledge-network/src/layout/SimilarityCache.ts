/**
 * @fileoverview SimilarityCache - Performance optimization through cached similarity results
 * 
 * Implements hybrid TTL + event-driven invalidation caching system for similarity calculations
 * with LRU eviction, performance monitoring, and memory management.
 */

import { 
  SimilarityCache as SimilarityCacheInterface,
  CacheEntry,
  CacheConfig,
  CacheStatistics,
  Node
} from '../types';

/**
 * High-performance similarity cache with TTL and event-driven invalidation
 */
export class SimilarityCache implements SimilarityCacheInterface {
  public readonly cache = new Map<string, CacheEntry>();
  public readonly config: CacheConfig;
  public readonly statistics: CacheStatistics;

  private hitCount = 0;
  private missCount = 0;
  private evictionCount = 0;
  private readonly accessOrder: string[] = []; // For LRU tracking

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 30000, // 30 seconds default
      maxSize: 10000,
      evictionPolicy: 'lru',
      invalidationEvents: ['node-updated', 'function-changed', 'layout-reset'],
      ...config
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
   * Get cached similarity value
   */
  public get(key: string): number | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      this.updateStatistics();
      return null;
    }

    // Check TTL expiration
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.missCount++;
      this.updateStatistics();
      return null;
    }

    // Update access tracking for LRU
    this.updateAccessOrder(key);
    
    // Update access count
    const updatedEntry: CacheEntry = {
      ...entry,
      accessCount: entry.accessCount + 1
    };
    this.cache.set(key, updatedEntry);

    this.hitCount++;
    this.updateStatistics();
    return entry.value;
  }

  /**
   * Set cached similarity value
   */
  public set(key: string, similarity: number, nodeHashes: [string, string]): void {
    // Validate similarity value
    if (similarity < 0 || similarity > 1 || !Number.isFinite(similarity)) {
      throw new Error(`Invalid similarity value: ${similarity} must be in range [0, 1]`);
    }

    // Check cache size limit
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry = {
      value: similarity,
      timestamp: Date.now(),
      accessCount: 1,
      nodeHashes
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateStatistics();
  }

  /**
   * Invalidate all cache entries involving a specific node
   */
  public invalidateNode(nodeId: string): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.nodeHashes.includes(nodeId)) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        invalidatedCount++;
      }
    }

    this.updateStatistics();
    return invalidatedCount;
  }

  /**
   * Invalidate cache entries matching predicate
   */
  public invalidateWhere(predicate: (entry: CacheEntry, key: string) => boolean): number {
    let invalidatedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (predicate(entry, key)) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        invalidatedCount++;
      }
    }

    this.updateStatistics();
    return invalidatedCount;
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.updateStatistics();
  }

  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    return { ...this.statistics };
  }

  /**
   * Cleanup expired entries
   */
  public cleanup(): number {
    let cleanedCount = 0;
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
        this.removeFromAccessOrder(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.updateStatistics();
    }

    return cleanedCount;
  }

  /**
   * Generate consistent cache key for node pair
   */
  public static generateCacheKey(nodeIdA: string, nodeIdB: string): string {
    // Ensure consistent ordering for symmetric similarity
    const [first, second] = [nodeIdA, nodeIdB].sort();
    return `${first}|${second}`;
  }

  /**
   * Warmup cache with precomputed similarities
   */
  public warmup(similarities: Map<string, { value: number; nodeHashes: [string, string] }>): number {
    let warmedCount = 0;
    
    for (const [key, data] of similarities.entries()) {
      if (!this.cache.has(key)) {
        this.set(key, data.value, data.nodeHashes);
        warmedCount++;
      }
    }

    return warmedCount;
  }

  /**
   * Get cache health metrics
   */
  public getHealthMetrics(): {
    fillRatio: number;
    hitRate: number;
    averageAccessCount: number;
    expiredRatio: number;
  } {
    const fillRatio = this.cache.size / this.config.maxSize;
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    
    let totalAccessCount = 0;
    let expiredCount = 0;
    
    for (const entry of this.cache.values()) {
      totalAccessCount += entry.accessCount;
      if (this.isExpired(entry)) {
        expiredCount++;
      }
    }

    const averageAccessCount = this.cache.size > 0 ? totalAccessCount / this.cache.size : 0;
    const expiredRatio = this.cache.size > 0 ? expiredCount / this.cache.size : 0;

    return {
      fillRatio,
      hitRate,
      averageAccessCount,
      expiredRatio
    };
  }

  // Private helper methods

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > this.config.ttl;
  }

  private updateAccessOrder(key: string): void {
    // Remove from current position
    this.removeFromAccessOrder(key);
    
    // Add to end (most recently used)
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index >= 0) {
      this.accessOrder.splice(index, 1);
    }
  }

  private evictLeastRecentlyUsed(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0]; // Oldest entry
    this.cache.delete(lruKey);
    this.removeFromAccessOrder(lruKey);
    this.evictionCount++;
    
    this.updateStatistics();
  }

  private updateStatistics(): void {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? this.hitCount / total : 0;
    const memoryUsage = this.estimateMemoryUsage();

    Object.assign(this.statistics, {
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      evictionCount: this.evictionCount,
      memoryUsage
    });
  }

  private estimateMemoryUsage(): number {
    // Rough estimate: key (32 bytes) + entry (64 bytes) = 96 bytes per cache entry
    return this.cache.size * 96;
  }
}