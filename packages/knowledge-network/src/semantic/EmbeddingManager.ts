/**
 * EmbeddingManager - Handles semantic embedding calculations and caching
 *
 * This module provides a self-contained system for:
 * - Computing semantic embeddings from nodes
 * - Caching expensive embedding calculations
 * - Supporting both sync and async embedding functions
 * - Calculating semantic similarity between nodes
 *
 * Contract:
 * - Input: Node objects with text content (label, description, etc.)
 * - Output: Numeric embedding vectors for semantic comparison
 * - Side effects: In-memory caching for performance
 * - Dependencies: None (pure calculation)
 */

import type { Node } from '../types';

/**
 * Function type for computing embeddings from nodes
 */
export type EmbeddingFunction = (node: Node) => Promise<number[]> | number[];

/**
 * Function type for computing text embeddings
 */
export type TextEmbeddingFunction = (text: string) => Promise<number[]> | number[];

/**
 * Configuration for semantic embedding calculations
 */
export interface EmbeddingConfig {
  /** Function to compute embeddings from nodes */
  embeddingFunction?: EmbeddingFunction;
  /** Function to compute embeddings from text (alternative to embeddingFunction) */
  textEmbeddingFunction?: TextEmbeddingFunction;
  /** Function to extract text from nodes for text-based embeddings */
  textExtractor?: (node: Node) => string;
  /** Number of dimensions in embedding vectors */
  dimensions?: number;
  /** Enable caching of computed embeddings */
  enableCache?: boolean;
  /** Maximum cache size (number of embeddings to keep) */
  maxCacheSize?: number;
}

/**
 * Cached embedding entry with metadata
 */
interface CachedEmbedding {
  embedding: number[];
  timestamp: number;
  hits: number;
}

/**
 * Default text extractor that combines node label and description
 */
const defaultTextExtractor = (node: Node): string => {
  const parts: string[] = [];

  if (node.label) {
    parts.push(node.label);
  }

  if ((node as any).description) {
    parts.push((node as any).description);
  }

  if ((node as any).content) {
    parts.push((node as any).content);
  }

  return parts.join(' ').trim() || node.id;
};

/**
 * Manages semantic embeddings for graph nodes with caching support
 *
 * @example
 * ```typescript
 * const manager = new EmbeddingManager({
 *   textEmbeddingFunction: async (text) => computeEmbedding(text),
 *   dimensions: 384,
 *   enableCache: true
 * });
 *
 * const nodes = [node1, node2, node3];
 * const embeddings = await manager.computeEmbeddings(nodes);
 * const similarity = manager.cosineSimilarity(embeddings[0], embeddings[1]);
 * ```
 */
export class EmbeddingManager {
  private config: {
    embeddingFunction?: EmbeddingFunction;
    textEmbeddingFunction?: TextEmbeddingFunction;
    textExtractor: (node: Node) => string;
    dimensions: number;
    enableCache: boolean;
    maxCacheSize: number;
  };
  private cache = new Map<string, CachedEmbedding>();

  constructor(config: EmbeddingConfig = {}) {
    this.config = {
      embeddingFunction: config.embeddingFunction,
      textEmbeddingFunction: config.textEmbeddingFunction,
      textExtractor: config.textExtractor || defaultTextExtractor,
      dimensions: config.dimensions || 384,
      enableCache: config.enableCache !== undefined ? config.enableCache : true,
      maxCacheSize: config.maxCacheSize || 1000
    };

    // Validate configuration
    if (!this.config.embeddingFunction && !this.config.textEmbeddingFunction) {
      throw new Error('EmbeddingManager requires either embeddingFunction or textEmbeddingFunction');
    }
  }

  /**
   * Compute embeddings for multiple nodes
   *
   * @param nodes - Array of nodes to compute embeddings for
   * @returns Promise resolving to array of embedding vectors
   *
   * @example
   * ```typescript
   * const embeddings = await manager.computeEmbeddings([node1, node2]);
   * // Returns: [[0.1, 0.2, ...], [0.3, 0.4, ...]]
   * ```
   */
  async computeEmbeddings(nodes: Node[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const node of nodes) {
      const embedding = await this.computeNodeEmbedding(node);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Compute embedding for a single node with caching
   *
   * @param node - Node to compute embedding for
   * @returns Promise resolving to embedding vector
   */
  async computeNodeEmbedding(node: Node): Promise<number[]> {
    const cacheKey = this.getCacheKey(node);

    // Check cache first
    if (this.config.enableCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      cached.hits++;
      cached.timestamp = Date.now();
      return cached.embedding;
    }

    // Compute new embedding
    let embedding: number[];

    if (this.config.embeddingFunction) {
      const result = this.config.embeddingFunction(node);
      embedding = result instanceof Promise ? await result : result;
    } else if (this.config.textEmbeddingFunction) {
      const text = this.config.textExtractor(node);
      const result = this.config.textEmbeddingFunction(text);
      embedding = result instanceof Promise ? await result : result;
    } else {
      throw new Error('No embedding function configured');
    }

    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length === 0) {
      throw new Error(`Invalid embedding for node ${node.id}: expected non-empty array`);
    }

    if (this.config.dimensions && embedding.length !== this.config.dimensions) {
      throw new Error(
        `Embedding dimension mismatch for node ${node.id}: expected ${this.config.dimensions}, got ${embedding.length}`
      );
    }

    // Cache the result
    if (this.config.enableCache) {
      this.cacheEmbedding(cacheKey, embedding);
    }

    return embedding;
  }

  /**
   * Calculate cosine similarity between two embedding vectors
   *
   * @param embedding1 - First embedding vector
   * @param embedding2 - Second embedding vector
   * @returns Cosine similarity score between -1 and 1
   *
   * @example
   * ```typescript
   * const similarity = manager.cosineSimilarity([0.1, 0.2], [0.3, 0.4]);
   * // Returns: 0.98... (high similarity)
   * ```
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding vectors must have the same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);

    if (magnitude === 0) {
      return 0; // Handle zero vectors
    }

    return dotProduct / magnitude;
  }

  /**
   * Calculate euclidean distance between two embedding vectors
   *
   * @param embedding1 - First embedding vector
   * @param embedding2 - Second embedding vector
   * @returns Euclidean distance (0 = identical, higher = more different)
   */
  euclideanDistance(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embedding vectors must have the same length');
    }

    let sum = 0;
    for (let i = 0; i < embedding1.length; i++) {
      const diff = embedding1[i] - embedding2[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  /**
   * Get cache statistics for monitoring performance
   *
   * @returns Object with cache metrics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalEntries: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalHits = entries.reduce((sum, entry) => sum + entry.hits, 0);
    const totalRequests = entries.reduce((sum, entry) => sum + entry.hits + 1, 0); // +1 for initial computation

    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      totalHits,
      totalEntries: entries.length
    };
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Update configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<EmbeddingConfig>): void {
    this.config = { ...this.config, ...config };

    // Clear cache if embedding function changed
    if (config.embeddingFunction || config.textEmbeddingFunction || config.textExtractor) {
      this.clearCache();
    }
  }

  /**
   * Generate cache key for a node
   */
  private getCacheKey(node: Node): string {
    if (this.config.embeddingFunction) {
      // For custom embedding functions, use node ID and data hash
      const dataStr = JSON.stringify({
        id: node.id,
        label: node.label,
        data: (node as any).data || {}
      });
      return `node:${this.hashString(dataStr)}`;
    } else {
      // For text-based embeddings, use extracted text hash
      const text = this.config.textExtractor(node);
      return `text:${this.hashString(text)}`;
    }
  }

  /**
   * Simple string hashing for cache keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Cache an embedding with LRU eviction
   */
  private cacheEmbedding(key: string, embedding: number[]): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.config.maxCacheSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      const toRemove = Math.ceil(this.config.maxCacheSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove && entries.length > 0; i++) {
        this.cache.delete(entries[i][0]);
      }
    }

    this.cache.set(key, {
      embedding: [...embedding], // Copy to avoid mutations
      timestamp: Date.now(),
      hits: 0
    });
  }
}

/**
 * Utility functions for common embedding operations
 */
export const EmbeddingUtils = {
  /**
   * Create a simple text-based embedding function using basic text features
   * This is a fallback for when no external embedding service is available
   *
   * @param dimensions - Number of dimensions for the embedding
   * @returns Text embedding function
   */
  createSimpleTextEmbedding: (dimensions: number = 100): TextEmbeddingFunction => {
    return (text: string): number[] => {
      const words = text.toLowerCase().split(/\s+/);
      const embedding = new Array(dimensions).fill(0);

      // Simple feature extraction based on text properties
      embedding[0] = Math.min(words.length / 10, 1); // Normalized word count
      embedding[1] = text.length / 1000; // Normalized character count

      // Character frequency features
      for (let i = 0; i < Math.min(text.length, dimensions - 10); i++) {
        const charCode = text.charCodeAt(i) % (dimensions - 10);
        embedding[charCode + 2] += 0.1;
      }

      // Word hash features
      words.forEach((word, index) => {
        if (index < dimensions - 20) {
          const wordHash = word.split('').reduce((hash, char) =>
            ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff, 0);
          embedding[(Math.abs(wordHash) % (dimensions - 20)) + 10] += 0.1;
        }
      });

      // Normalize the embedding
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
    };
  },

  /**
   * Create a mock embedding function for testing
   *
   * @param dimensions - Number of dimensions for the embedding
   * @returns Mock embedding function that returns consistent results
   */
  createMockEmbedding: (dimensions: number = 384): EmbeddingFunction => {
    return (node: Node): number[] => {
      // Create deterministic embedding based on node ID
      const seed = node.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const random = (n: number) => (Math.sin(n * 12.9898) * 43758.5453) % 1;

      const embedding = [];
      for (let i = 0; i < dimensions; i++) {
        embedding.push(random(seed + i) * 2 - 1); // Range [-1, 1]
      }

      // Normalize
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / magnitude);
    };
  }
};