/**
 * EmbeddingManager Tests
 *
 * Tests for the semantic embedding functionality including:
 * - Basic embedding computation
 * - Caching mechanisms
 * - Similarity calculations
 * - Error handling
 * - Configuration validation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmbeddingManager, EmbeddingUtils, type EmbeddingFunction, type TextEmbeddingFunction } from '../../src/semantic/EmbeddingManager';
import type { Node } from '../../src/types';

// Mock embedding function for testing
const mockTextEmbedding: TextEmbeddingFunction = (text: string): number[] => {
  // Create deterministic embedding based on text content
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(10).fill(0);

  // Simple feature extraction for testing
  embedding[0] = words.length / 10; // Word count feature
  embedding[1] = text.length / 100; // Character count feature

  // Word-based features
  words.forEach((word, index) => {
    if (index < 8) {
      embedding[index + 2] = word.length / 20;
    }
  });

  return embedding;
};

const mockNodeEmbedding: EmbeddingFunction = (node: Node): number[] => {
  const text = node.label || node.id;
  return mockTextEmbedding(text);
};

// Test nodes
const testNodes: Node[] = [
  { id: 'node1', label: 'artificial intelligence' },
  { id: 'node2', label: 'machine learning' },
  { id: 'node3', label: 'deep learning' },
  { id: 'node4', label: 'natural language processing' },
  { id: 'node5', label: 'computer vision' }
];

describe('EmbeddingManager', () => {
  let manager: EmbeddingManager;

  beforeEach(() => {
    manager = new EmbeddingManager({
      textEmbeddingFunction: mockTextEmbedding,
      dimensions: 10,
      enableCache: true,
      maxCacheSize: 100
    });
  });

  describe('Configuration and Initialization', () => {
    it('should initialize with text embedding function', () => {
      expect(manager).toBeInstanceOf(EmbeddingManager);
    });

    it('should initialize with node embedding function', () => {
      const nodeManager = new EmbeddingManager({
        embeddingFunction: mockNodeEmbedding,
        dimensions: 10
      });

      expect(nodeManager).toBeInstanceOf(EmbeddingManager);
    });

    it('should throw error without embedding function', () => {
      expect(() => {
        new EmbeddingManager({});
      }).toThrow('EmbeddingManager requires either embeddingFunction or textEmbeddingFunction');
    });

    it('should use default configuration values', () => {
      const defaultManager = new EmbeddingManager({
        textEmbeddingFunction: mockTextEmbedding
      });

      expect(defaultManager).toBeInstanceOf(EmbeddingManager);
    });
  });

  describe('Embedding Computation', () => {
    it('should compute embeddings for multiple nodes', async () => {
      const embeddings = await manager.computeEmbeddings(testNodes);

      expect(embeddings).toHaveLength(5);
      expect(embeddings[0]).toHaveLength(10);
      expect(Array.isArray(embeddings[0])).toBe(true);
    });

    it('should compute embedding for single node', async () => {
      const embedding = await manager.computeNodeEmbedding(testNodes[0]);

      expect(embedding).toHaveLength(10);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should handle async embedding functions', async () => {
      const asyncEmbedding: TextEmbeddingFunction = async (text: string): Promise<number[]> => {
        return new Promise(resolve => {
          setTimeout(() => resolve(mockTextEmbedding(text)), 10);
        });
      };

      const asyncManager = new EmbeddingManager({
        textEmbeddingFunction: asyncEmbedding,
        dimensions: 10
      });

      const embedding = await asyncManager.computeNodeEmbedding(testNodes[0]);
      expect(embedding).toHaveLength(10);
    });

    it('should validate embedding dimensions', async () => {
      const invalidEmbedding: TextEmbeddingFunction = (): number[] => {
        return [0.1, 0.2]; // Wrong dimension
      };

      const invalidManager = new EmbeddingManager({
        textEmbeddingFunction: invalidEmbedding,
        dimensions: 10
      });

      await expect(invalidManager.computeNodeEmbedding(testNodes[0]))
        .rejects.toThrow('Embedding dimension mismatch');
    });

    it('should handle empty embedding arrays', async () => {
      const emptyEmbedding: TextEmbeddingFunction = (): number[] => {
        return [];
      };

      const emptyManager = new EmbeddingManager({
        textEmbeddingFunction: emptyEmbedding,
        dimensions: 10
      });

      await expect(emptyManager.computeNodeEmbedding(testNodes[0]))
        .rejects.toThrow('Invalid embedding for node');
    });
  });

  describe('Caching', () => {
    it('should cache computed embeddings', async () => {
      // First computation
      const embedding1 = await manager.computeNodeEmbedding(testNodes[0]);

      // Second computation should return cached result
      const embedding2 = await manager.computeNodeEmbedding(testNodes[0]);

      expect(embedding1).toEqual(embedding2);

      const stats = manager.getCacheStats();
      expect(stats.totalHits).toBeGreaterThan(0);
    });

    it('should respect cache size limits', async () => {
      const smallCacheManager = new EmbeddingManager({
        textEmbeddingFunction: mockTextEmbedding,
        dimensions: 10,
        enableCache: true,
        maxCacheSize: 2
      });

      // Compute more embeddings than cache size
      const nodes = Array.from({ length: 5 }, (_, i) => ({
        id: `node${i}`,
        label: `text ${i}`
      }));

      for (const node of nodes) {
        await smallCacheManager.computeNodeEmbedding(node);
      }

      const stats = smallCacheManager.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(2);
    });

    it('should allow disabling cache', async () => {
      const noCacheManager = new EmbeddingManager({
        textEmbeddingFunction: mockTextEmbedding,
        dimensions: 10,
        enableCache: false
      });

      await noCacheManager.computeNodeEmbedding(testNodes[0]);
      await noCacheManager.computeNodeEmbedding(testNodes[0]);

      const stats = noCacheManager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache', async () => {
      await manager.computeNodeEmbedding(testNodes[0]);

      let stats = manager.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      manager.clearCache();

      stats = manager.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Similarity Calculations', () => {
    it('should calculate cosine similarity', () => {
      const embedding1 = [1, 0, 0];
      const embedding2 = [1, 0, 0];
      const embedding3 = [0, 1, 0];

      const similarity1 = manager.cosineSimilarity(embedding1, embedding2);
      const similarity2 = manager.cosineSimilarity(embedding1, embedding3);

      expect(similarity1).toBeCloseTo(1, 5); // Identical vectors
      expect(similarity2).toBeCloseTo(0, 5); // Orthogonal vectors
    });

    it('should calculate euclidean distance', () => {
      const embedding1 = [0, 0, 0];
      const embedding2 = [1, 1, 1];

      const distance = manager.euclideanDistance(embedding1, embedding2);

      expect(distance).toBeCloseTo(Math.sqrt(3), 5);
    });

    it('should handle zero vectors in cosine similarity', () => {
      const zero = [0, 0, 0];
      const nonZero = [1, 1, 1];

      const similarity = manager.cosineSimilarity(zero, nonZero);
      expect(similarity).toBe(0);
    });

    it('should throw error for mismatched vector lengths', () => {
      const short = [1, 2];
      const long = [1, 2, 3, 4];

      expect(() => {
        manager.cosineSimilarity(short, long);
      }).toThrow('Embedding vectors must have the same length');

      expect(() => {
        manager.euclideanDistance(short, long);
      }).toThrow('Embedding vectors must have the same length');
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', () => {
      const newEmbeddingFn: TextEmbeddingFunction = () => [0.5, 0.5, 0.5];

      manager.updateConfig({
        textEmbeddingFunction: newEmbeddingFn,
        dimensions: 3
      });

      // Cache should be cleared after config update
      const stats = manager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should clear cache on embedding function change', async () => {
      // Compute and cache an embedding
      await manager.computeNodeEmbedding(testNodes[0]);

      let stats = manager.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);

      // Update embedding function
      manager.updateConfig({
        textEmbeddingFunction: () => [0.1, 0.2, 0.3]
      });

      stats = manager.getCacheStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('Text Extraction', () => {
    it('should use custom text extractor', async () => {
      const customExtractor = (node: Node): string => {
        return `custom: ${node.id}`;
      };

      const customManager = new EmbeddingManager({
        textEmbeddingFunction: mockTextEmbedding,
        textExtractor: customExtractor,
        dimensions: 10
      });

      const embedding = await customManager.computeNodeEmbedding(testNodes[0]);
      expect(embedding).toHaveLength(10);
    });

    it('should handle nodes with different content fields', async () => {
      const nodeWithDescription = {
        id: 'test',
        label: 'Test Node',
        description: 'This is a test node with description'
      } as Node;

      const nodeWithContent = {
        id: 'test2',
        label: 'Test Node 2',
        content: 'This node has content field'
      } as Node;

      const embedding1 = await manager.computeNodeEmbedding(nodeWithDescription);
      const embedding2 = await manager.computeNodeEmbedding(nodeWithContent);

      expect(embedding1).toHaveLength(10);
      expect(embedding2).toHaveLength(10);
    });
  });
});

describe('EmbeddingUtils', () => {
  describe('Simple Text Embedding', () => {
    it('should create simple text embedding function', () => {
      const embeddingFn = EmbeddingUtils.createSimpleTextEmbedding(50);
      const embedding = embeddingFn('test text');

      expect(embedding).toHaveLength(50);
      expect(typeof embedding[0]).toBe('number');
    });

    it('should create normalized embeddings', () => {
      const embeddingFn = EmbeddingUtils.createSimpleTextEmbedding(10);
      const embedding = embeddingFn('test text');

      // Check if embedding is normalized (magnitude should be close to 1)
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1, 1);
    });

    it('should produce different embeddings for different texts', () => {
      const embeddingFn = EmbeddingUtils.createSimpleTextEmbedding(20);
      const embedding1 = embeddingFn('artificial intelligence');
      const embedding2 = embeddingFn('natural language processing');

      expect(embedding1).not.toEqual(embedding2);
    });
  });

  describe('Mock Embedding', () => {
    it('should create deterministic mock embeddings', () => {
      const embeddingFn = EmbeddingUtils.createMockEmbedding(100);

      const node = { id: 'test-node', label: 'Test Node' };
      const embedding1 = embeddingFn(node);
      const embedding2 = embeddingFn(node);

      expect(embedding1).toEqual(embedding2);
      expect(embedding1).toHaveLength(100);
    });

    it('should create different embeddings for different nodes', () => {
      const embeddingFn = EmbeddingUtils.createMockEmbedding(50);

      const node1 = { id: 'node1', label: 'Node 1' };
      const node2 = { id: 'node2', label: 'Node 2' };

      const embedding1 = embeddingFn(node1);
      const embedding2 = embeddingFn(node2);

      expect(embedding1).not.toEqual(embedding2);
    });

    it('should produce normalized mock embeddings', () => {
      const embeddingFn = EmbeddingUtils.createMockEmbedding(20);
      const node = { id: 'test', label: 'Test' };
      const embedding = embeddingFn(node);

      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(magnitude).toBeCloseTo(1, 5);
    });
  });
});