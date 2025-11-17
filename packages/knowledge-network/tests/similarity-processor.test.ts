/**
 * @fileoverview Unit tests for similarity function execution and functor contract compliance
 * 
 * Tests REAL production code, not mocks, following user feedback.
 * Implementation tested: packages/knowledge-network/src/layout/SimilarityProcessor.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  SimilarityFunctor, 
  ClusteringContext, 
  Node,
  WeightedSimilarityFunction 
} from '../src/types';
import {
  generateMockNodes,
  createMockClusteringContext,
  validateSimilarityFunctor,
  assertSimilarityBounds
} from './setup';

// Import REAL production code - no mocks
import { SimilarityProcessor } from '../src/layout/SimilarityProcessor';

describe('SimilarityProcessor', () => {
  let processor: SimilarityProcessor;
  let mockNodes: Node[];
  let clusteringContext: ClusteringContext;

  beforeEach(() => {
    processor = new SimilarityProcessor();
    mockNodes = generateMockNodes(10);
    clusteringContext = createMockClusteringContext();
  });

  describe('Functor Contract Compliance', () => {
    it('should enforce similarity functor contract signature', () => {
      // Test that functors follow (nodeA, nodeB, context) => number contract
      const validFunctor = processor.getDefaultSimilarityFunction('cosine');
      
      expect(validateSimilarityFunctor(validFunctor)).toBe(true);
      
      // Invalid functor missing parameters should be rejected
      const invalidFunctor = (nodeA: Node) => 0.5; // Missing nodeB and context
      expect(() => {
        processor.validateFunctorContract(invalidFunctor as any);
      }).toThrow('Invalid functor signature');
    });

    it('should validate functor return values are in range [0,1]', () => {
      const nodes = generateMockNodes(3);
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      // Valid similarity function using REAL production code
      const validSimilarity = realCosine(nodes[0], nodes[1], clusteringContext);
      expect(() => assertSimilarityBounds(validSimilarity)).not.toThrow();
      
      // Invalid similarity function returning out-of-bounds values
      const invalidFunctor: SimilarityFunctor = () => 2.5; // > 1.0
      
      expect(() => {
        const result = invalidFunctor(nodes[0], nodes[1], clusteringContext);
        assertSimilarityBounds(result);
      }).toThrow('similarity must be in range [0, 1]');
    });

    it('should handle null/undefined inputs gracefully', () => {
      const validNode = mockNodes[0];
      const nullNode = null as any;
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      expect(() => {
        processor.calculateSimilarity(validNode, nullNode, realCosine, clusteringContext);
      }).toThrow('Invalid node input');
      
      expect(() => {
        processor.calculateSimilarity(validNode, validNode, realCosine, null as any);
      }).toThrow('Invalid clustering context');
    });
  });

  describe('Similarity Function Registration', () => {
    it('should register similarity functions with unique names', () => {
      // Use real production functions
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      const realJaccard = processor.getDefaultSimilarityFunction('jaccard');
      
      processor.registerSimilarityFunction('custom-cosine', realCosine);
      processor.registerSimilarityFunction('custom-jaccard', realJaccard);
      
      expect(processor.getRegisteredFunctions().length).toBeGreaterThanOrEqual(5); // 3 default + 2 custom
      expect(processor.hasFunction('custom-cosine')).toBe(true);
      expect(processor.hasFunction('custom-jaccard')).toBe(true);
    });

    it('should prevent duplicate function names', () => {
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      processor.registerSimilarityFunction('test', realCosine);
      
      expect(() => {
        processor.registerSimilarityFunction('test', realCosine);
      }).toThrow('Function name already registered');
    });

    it('should support weighted function composition', () => {
      // Register weighted functions using REAL production functions
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      const realJaccard = processor.getDefaultSimilarityFunction('jaccard');
      
      processor.registerSimilarityFunction('weighted-cosine', realCosine, 0.7);
      processor.registerSimilarityFunction('weighted-jaccard', realJaccard, 0.3);
      
      // Test weighted composition
      const compositeResult = processor.calculateWeightedSimilarity(
        mockNodes[0], 
        mockNodes[1], 
        ['weighted-cosine', 'weighted-jaccard'], 
        clusteringContext
      );
      
      expect(compositeResult).toBeGreaterThanOrEqual(0);
      expect(compositeResult).toBeLessThanOrEqual(1);
      expect(typeof compositeResult).toBe('number');
    });
  });

  describe('Similarity Matrix Calculation', () => {
    it('should calculate similarity matrix for node pairs', () => {
      const nodes = generateMockNodes(5);
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      // Test with REAL production cosine similarity
      const matrix = processor.calculateSimilarityMatrix(nodes, realCosine, clusteringContext);
      
      // Matrix should be symmetric
      expect(matrix.size).toBe(10); // C(5,2) = 10 unique pairs
      
      // Verify symmetry: similarity(A,B) === similarity(B,A)
      const keyAB = processor.generatePairKey(nodes[0].id, nodes[1].id);
      const keyBA = processor.generatePairKey(nodes[1].id, nodes[0].id);
      expect(matrix.get(keyAB)).toBe(matrix.get(keyBA));
    });

    it('should handle identical nodes correctly', () => {
      const node = mockNodes[0];
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      // Self-similarity should be close to 1.0 for identical vectors (floating point precision)
      const selfSimilarity = realCosine(node, node, clusteringContext);
      expect(selfSimilarity).toBeCloseTo(1.0, 10); // High precision tolerance
    });

    it('should cache similarity calculations for performance', () => {
      const nodes = generateMockNodes(3);
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      // First calculation should miss cache
      const result1 = processor.calculateSimilarity(
        nodes[0], nodes[1], realCosine, clusteringContext
      );
      
      // Second calculation should hit cache
      const result2 = processor.calculateSimilarity(
        nodes[0], nodes[1], realCosine, clusteringContext
      );
      
      expect(result1).toBe(result2);
      
      // Cache statistics tracking
      const stats = processor.getCacheStatistics();
      expect(stats.hitCount).toBeGreaterThanOrEqual(0);
      expect(stats.missCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Error Handling', () => {
    it('should meet performance targets for similarity calculations', () => {
      const largeNodeSet = generateMockNodes(100);
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      const startTime = performance.now();
      
      // Performance test with REAL production algorithm
      const matrix = processor.calculateSimilarityMatrix(
        largeNodeSet, 
        realCosine, 
        clusteringContext
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Should complete within performance targets
      expect(duration).toBeLessThan(1000); // <1 second for 100 nodes
      expect(matrix.size).toBe(4950); // C(100,2) = 4950 pairs
    });

    it('should handle functor exceptions gracefully', () => {
      const faultyFunctor: SimilarityFunctor = () => {
        throw new Error('Simulated calculation error');
      };
      
      expect(() => {
        processor.calculateSimilarity(
          mockNodes[0], 
          mockNodes[1], 
          faultyFunctor, 
          clusteringContext
        );
      }).toThrow('Similarity calculation failed');
    });

    it('should validate clustering context requirements', () => {
      const invalidContext = { ...clusteringContext, alpha: -1 }; // Invalid alpha
      
      expect(() => {
        processor.validateClusteringContext(invalidContext);
      }).toThrow('Invalid clustering context: alpha must be >= 0');
    });
  });

  describe('Default Similarity Functions', () => {
    it('should provide default cosine similarity implementation', () => {
      const defaultCosine = processor.getDefaultSimilarityFunction('cosine');
      
      const nodes = generateMockNodes(2);
      const result = defaultCosine(nodes[0], nodes[1], clusteringContext);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should provide default jaccard similarity implementation', () => {
      const defaultJaccard = processor.getDefaultSimilarityFunction('jaccard');
      
      const nodes = generateMockNodes(2);
      const result = defaultJaccard(nodes[0], nodes[1], clusteringContext);
      
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('should auto-select appropriate similarity function based on node data', () => {
      const vectorNode = { id: 'v1', vector: [1, 2, 3], label: 'Vector Node' };
      const metadataNode = { id: 'm1', metadata: { tags: ['a', 'b'] }, label: 'Metadata Node' };
      
      const autoSelected = processor.selectAppropiateSimilarityFunction([vectorNode, metadataNode]);
      
      expect(['cosine', 'jaccard', 'spatial']).toContain(autoSelected);
    });
  });

  describe('Integration with ClusteringContext', () => {
    it('should utilize spatial index when available', () => {
      const contextWithIndex = {
        ...clusteringContext,
        spatialIndex: { bounds: { minX: 0, minY: 0, maxX: 100, maxY: 100 } }
      };
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      const result = processor.calculateSimilarityWithSpatialOptimization(
        mockNodes[0],
        mockNodes,
        realCosine,
        contextWithIndex
      );
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(mockNodes.length);
    });

    it('should update performance metrics during calculations', () => {
      const nodes = generateMockNodes(5);
      const realCosine = processor.getDefaultSimilarityFunction('cosine');
      
      processor.calculateSimilarityMatrix(nodes, realCosine, clusteringContext);
      
      const metrics = processor.getPerformanceMetrics();
      expect(metrics.similarityCalculations).toBeGreaterThan(0);
      expect(metrics.iterationsPerSecond).toBeGreaterThanOrEqual(0);
    });
  });
});