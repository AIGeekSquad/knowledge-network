/**
 * @fileoverview SimilarityCache - Caching system for similarity calculations
 * 
 * Implements LRU eviction and TTL-based invalidation to optimize
 * repeated similarity calculations.
 */

import { CacheConfig, CacheEntry, CacheStatistics } from '../types';

export class SimilarityCache {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private hits = 0;
  private misses = 0;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: 30000, // 30 seconds default
      maxSize: 10000,
      evictionPolicy: 'lru',
      invalidationEvents: ['node-updated', 'function-changed'],
      ...config
    };
  }

  /**
   * Get cached similarity value
   */
  public get(key: string): number | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update access stats
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;

    return entry.value;
  }

  /**
   * Cache similarity value
   */
  public set(key: string, value: number): void {
    if (this.cache.size >= this.config.maxSize) {
      this.evict();
    }

    const entry: CacheEntry = {
      value,
      timestamp: Date.now(),
      accessCount: 1,
      nodeHashes: key.split('|') as [string, string],
      lastAccessed: Date.now()
    };

    this.cache.set(key, entry);
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  public getStatistics(): CacheStatistics {
    const total = this.hits + this.misses;
    return {
      hitCount: this.hits,
      missCount: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
      evictionCount: 0, // TODO: Track evictions
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Evict entries based on policy (LRU)
   */
  private evict(): void {
    // Simple LRU implementation
    let oldestKey = '';
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.lastAccessed! < oldestAccess) {
        oldestAccess = entry.lastAccessed!;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private estimateMemoryUsage(): number {
    return this.cache.size * 64; // Rough estimate
  }
}