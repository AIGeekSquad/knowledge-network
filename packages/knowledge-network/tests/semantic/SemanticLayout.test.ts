/**
 * Semantic Layout Tests
 *
 * Tests for semantic layout functionality in the LayoutEngine including:
 * - Semantic force calculations
 * - Integration with existing layout algorithms
 * - Embedding-based clustering
 * - Configuration validation
 * - Performance characteristics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LayoutEngine } from '../../src/layout/LayoutEngine';
import { EmbeddingUtils } from '../../src/semantic/EmbeddingManager';
import type { GraphData, Node } from '../../src/types';

// Test data
const createTestGraph = (nodeCount: number = 5): GraphData => {
  const nodes: Node[] = [];
  const edges = [];

  // Create nodes with semantic content
  const topics = [
    'artificial intelligence machine learning',
    'deep learning neural networks',
    'natural language processing',
    'computer vision image recognition',
    'robotics automation systems'
  ];

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node${i}`,
      label: topics[i % topics.length]
    });
  }

  // Create some edges
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge${i}`,
      source: `node${i}`,
      target: `node${i + 1}`
    });
  }

  return { nodes, edges };
};

describe('Semantic Layout Integration', () => {
  let layoutEngine: LayoutEngine;
  let testGraph: GraphData;

  beforeEach(() => {
    testGraph = createTestGraph();
  });

  describe('Configuration', () => {
    it('should initialize without semantic configuration', () => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600
      });

      expect(layoutEngine.getEmbeddingStats()).toBeNull();
    });

    it('should initialize with text embedding function', () => {
      const textEmbeddingFn = EmbeddingUtils.createSimpleTextEmbedding(100);

      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: textEmbeddingFn,
        semanticDimensions: 100,
        semanticThreshold: 0.5,
        semanticForceStrength: 0.2
      });

      expect(layoutEngine).toBeInstanceOf(LayoutEngine);
    });

    it('should initialize with node embedding function', () => {
      const nodeEmbeddingFn = EmbeddingUtils.createMockEmbedding(50);

      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        embeddingFunction: nodeEmbeddingFn,
        semanticDimensions: 50,
        semanticThreshold: 0.7
      });

      expect(layoutEngine).toBeInstanceOf(LayoutEngine);
    });

    it('should update semantic configuration', () => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600
      });

      // Initially no semantic features
      expect(layoutEngine.getEmbeddingStats()).toBeNull();

      // Add semantic configuration
      layoutEngine.setConfig({
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(32),
        semanticDimensions: 32,
        semanticThreshold: 0.6
      });

      // Should now have embedding manager
      const stats = layoutEngine.getEmbeddingStats();
      expect(stats).not.toBeNull();
      expect(stats.size).toBe(0); // No embeddings computed yet
    });
  });

  describe('Embedding Computation', () => {
    beforeEach(() => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(64),
        semanticDimensions: 64,
        semanticThreshold: 0.5,
        semanticForceStrength: 0.1,
        enableSemanticCache: true
      });
    });

    it('should compute embeddings during layout calculation', async () => {
      const result = await layoutEngine.calculateLayout(testGraph);

      expect(result.nodes).toHaveLength(5);
      expect(result.edges).toHaveLength(4);

      // Check that embeddings were computed
      const embeddings = layoutEngine.getAllEmbeddings();
      expect(embeddings.size).toBe(5);

      // Check embedding dimensions
      const firstEmbedding = layoutEngine.getNodeEmbedding('node0');
      expect(firstEmbedding).toHaveLength(64);
    });

    it('should handle embedding computation errors gracefully', async () => {
      const errorEmbeddingFn = vi.fn().mockRejectedValue(new Error('Embedding service unavailable'));

      const errorLayoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: errorEmbeddingFn,
        semanticDimensions: 32
      });

      // Should complete layout even if embeddings fail
      const result = await errorLayoutEngine.calculateLayout(testGraph);

      expect(result.nodes).toHaveLength(5);
      expect(errorLayoutEngine.getAllEmbeddings().size).toBe(0);
    });

    it('should emit embeddingsComputed event', async () => {
      const eventSpy = vi.fn();
      layoutEngine.on('embeddingsComputed', eventSpy);

      await layoutEngine.calculateLayout(testGraph);

      expect(eventSpy).toHaveBeenCalledWith(5); // 5 nodes
    });
  });

  describe('Semantic Forces', () => {
    beforeEach(() => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(32),
        semanticDimensions: 32,
        semanticThreshold: 0.3, // Lower threshold for more connections
        semanticForceStrength: 0.5,
        alpha: 0.5, // Lower alpha for faster convergence in tests
        alphaDecay: 0.1
      });
    });

    it('should apply semantic forces during simulation', async () => {
      const positionsBeforeLayout = testGraph.nodes.map(node => ({
        id: node.id,
        x: Math.random() * 800,
        y: Math.random() * 600
      }));

      // Set initial positions
      testGraph.nodes.forEach((node, index) => {
        (node as any).x = positionsBeforeLayout[index].x;
        (node as any).y = positionsBeforeLayout[index].y;
      });

      const result = await layoutEngine.calculateLayout(testGraph);

      // Positions should have changed due to forces
      const changed = result.nodes.some((node, index) =>
        Math.abs(node.x - positionsBeforeLayout[index].x) > 1 ||
        Math.abs(node.y - positionsBeforeLayout[index].y) > 1
      );

      expect(changed).toBe(true);
    });

    it('should cluster semantically similar nodes', async () => {
      // Create nodes with clear semantic groups
      const semanticGraph: GraphData = {
        nodes: [
          { id: 'ai1', label: 'artificial intelligence machine learning' },
          { id: 'ai2', label: 'machine learning algorithms' },
          { id: 'ai3', label: 'deep learning neural networks' },
          { id: 'bio1', label: 'biology genetics DNA' },
          { id: 'bio2', label: 'genetics molecular biology' },
          { id: 'bio3', label: 'DNA sequencing genomics' }
        ],
        edges: []
      };

      const result = await layoutEngine.calculateLayout(semanticGraph);

      // Calculate similarities between AI nodes and bio nodes
      const aiSimilarity1 = layoutEngine.getSemanticSimilarity('ai1', 'ai2');
      const aiSimilarity2 = layoutEngine.getSemanticSimilarity('ai2', 'ai3');
      const crossSimilarity = layoutEngine.getSemanticSimilarity('ai1', 'bio1');

      // AI nodes should be more similar to each other than to bio nodes
      expect(aiSimilarity1).toBeGreaterThan(crossSimilarity!);
      expect(aiSimilarity2).toBeGreaterThan(crossSimilarity!);
    });

    it('should balance semantic and structural forces', async () => {
      const mixedLayoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(32),
        semanticDimensions: 32,
        semanticThreshold: 0.4,
        semanticForceStrength: 0.3,
        semanticWeight: 0.5, // Balance between semantic and structural
        chargeStrength: -100,
        linkDistance: 50,
        alpha: 0.3,
        alphaDecay: 0.05
      });

      const result = await mixedLayoutEngine.calculateLayout(testGraph);

      // Should have reasonable positions
      expect(result.nodes.every(node =>
        node.x >= 0 && node.x <= 800 && node.y >= 0 && node.y <= 600
      )).toBe(true);
    });
  });

  describe('Semantic Similarity API', () => {
    beforeEach(async () => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(64),
        semanticDimensions: 64
      });

      // Compute layout to generate embeddings
      await layoutEngine.calculateLayout(testGraph);
    });

    it('should return semantic similarity between nodes', () => {
      const similarity = layoutEngine.getSemanticSimilarity('node0', 'node1');

      expect(typeof similarity).toBe('number');
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });

    it('should return null for non-existent nodes', () => {
      const similarity = layoutEngine.getSemanticSimilarity('node0', 'nonexistent');

      expect(similarity).toBeNull();
    });

    it('should return null when no embeddings available', () => {
      const noSemanticEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600
      });

      const similarity = noSemanticEngine.getSemanticSimilarity('node0', 'node1');

      expect(similarity).toBeNull();
    });

    it('should return node embeddings', () => {
      const embedding = layoutEngine.getNodeEmbedding('node0');

      expect(Array.isArray(embedding)).toBe(true);
      expect(embedding!.length).toBe(64);
    });

    it('should return all embeddings', () => {
      const allEmbeddings = layoutEngine.getAllEmbeddings();

      expect(allEmbeddings.size).toBe(5);
      expect(allEmbeddings.has('node0')).toBe(true);
    });
  });

  describe('Performance and Caching', () => {
    beforeEach(() => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(128),
        semanticDimensions: 128,
        enableSemanticCache: true,
        maxSemanticCacheSize: 50
      });
    });

    it('should cache embeddings for repeated layouts', async () => {
      // First layout computation
      await layoutEngine.calculateLayout(testGraph);

      let stats = layoutEngine.getEmbeddingStats();
      expect(stats!.size).toBe(5);

      // Second layout with same data should use cache
      await layoutEngine.calculateLayout(testGraph);

      stats = layoutEngine.getEmbeddingStats();
      expect(stats!.totalHits).toBeGreaterThan(0);
    }, 10000); // Increase timeout to 10 seconds

    it('should handle large graphs efficiently', async () => {
      const largeGraph = createTestGraph(50);

      const startTime = Date.now();
      await layoutEngine.calculateLayout(largeGraph);
      const endTime = Date.now();

      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust based on performance requirements)
      expect(duration).toBeLessThan(15000); // 15 seconds max

      // Should have computed all embeddings
      const embeddings = layoutEngine.getAllEmbeddings();
      expect(embeddings.size).toBe(50);
    }, 20000); // Increase timeout to 20 seconds for large graphs

    it('should clear embedding cache', async () => {
      await layoutEngine.calculateLayout(testGraph);

      let stats = layoutEngine.getEmbeddingStats();
      expect(stats!.size).toBeGreaterThan(0);

      layoutEngine.clearEmbeddingCache();

      stats = layoutEngine.getEmbeddingStats();
      expect(stats!.size).toBe(0);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without semantic configuration', async () => {
      const basicLayoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        chargeStrength: -300,
        linkDistance: 100
      });

      const result = await basicLayoutEngine.calculateLayout(testGraph);

      expect(result.nodes).toHaveLength(5);
      expect(result.edges).toHaveLength(4);
      expect(basicLayoutEngine.getEmbeddingStats()).toBeNull();
    });

    it('should work with traditional similarity functions', async () => {
      const similarityFn = (a: Node, b: Node): number => {
        // Simple label similarity
        const labelA = a.label?.toLowerCase() || '';
        const labelB = b.label?.toLowerCase() || '';
        const commonWords = labelA.split(' ').filter(word =>
          labelB.split(' ').includes(word)
        ).length;
        return commonWords / Math.max(labelA.split(' ').length, labelB.split(' ').length);
      };

      const traditionalEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        similarityFunction: similarityFn,
        similarityThreshold: 0.3
      });

      const result = await traditionalEngine.calculateLayout(testGraph);

      expect(result.nodes).toHaveLength(5);
      expect(result.edges).toHaveLength(4);
    });

    it('should work with both semantic and traditional similarity', async () => {
      const similarityFn = (a: Node, b: Node): number => 0.5;

      const hybridEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        // Traditional similarity
        similarityFunction: similarityFn,
        similarityThreshold: 0.4,
        // Semantic similarity
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(32),
        semanticDimensions: 32,
        semanticThreshold: 0.6,
        semanticForceStrength: 0.2
      });

      const result = await hybridEngine.calculateLayout(testGraph);

      expect(result.nodes).toHaveLength(5);
      expect(result.edges).toHaveLength(4);
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources on destroy', async () => {
      layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(32),
        semanticDimensions: 32
      });

      await layoutEngine.calculateLayout(testGraph);

      // Should have embeddings
      expect(layoutEngine.getAllEmbeddings().size).toBeGreaterThan(0);

      layoutEngine.destroy();

      // Should be cleaned up
      expect(layoutEngine.getEmbeddingStats()).toBeNull();
      expect(layoutEngine.getAllEmbeddings().size).toBe(0);
    });
  });
});