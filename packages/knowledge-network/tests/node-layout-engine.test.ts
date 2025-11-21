/**
 * NodeLayoutEngine Tests
 * 
 * Test-First Development for similarity-based node positioning engine.
 * Tests focus on the core functionality defined in specs/002-node-layout/spec.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Node } from '../src/types';

// Import interfaces that should exist after implementation
import {
  NodeLayoutEngine
} from '../src/layout/NodeLayoutEngine';
import type {
  SimilarityFunctor,
  LayoutConfig,
  Position3D,
  ConvergenceMetrics
} from '../src/types';

describe('NodeLayoutEngine', () => {
  let engine: NodeLayoutEngine;
  let testNodes: Node[];
  let mockSimilarityFunctor: SimilarityFunctor;

  beforeEach(() => {
    // Setup test data
    testNodes = [
      { id: 'node1', label: 'Test Node 1', vector: [0.1, 0.2, 0.3] },
      { id: 'node2', label: 'Test Node 2', vector: [0.2, 0.3, 0.1] },
      { id: 'node3', label: 'Test Node 3', vector: [0.8, 0.7, 0.9] }
    ];

    // Mock similarity function following functor contract
    mockSimilarityFunctor = vi.fn((nodeA: Node, nodeB: Node, context: any) => {
      // Simple cosine similarity mock
      if (nodeA.vector && nodeB.vector) {
        return 0.5; // Mock similarity score
      }
      return 0.0;
    });

    engine = new NodeLayoutEngine();
  });

  describe('Core Functionality', () => {
    it('should initialize with default configuration', () => {
      expect(engine).toBeDefined();
      expect(engine.config).toBeDefined();
      expect(engine.config.dimensions).toBe(2);
    });

    it('should implement calculateLayoutAsync with similarity-based positioning', async () => {
      // Test the main layout calculation method
      const config: Partial<LayoutConfig> = {
        dimensions: 2,
        convergenceThreshold: 0.01,
        maxIterations: 100
      };

      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor, config);
      expect(result).toBeDefined();
      expect(result.nodes.length).toBe(testNodes.length);
      expect(result.status.success).toBe(true);
    });

    it('should return EnhancedLayoutNode array', async () => {
      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor);
      expect(result.nodes).toBeInstanceOf(Array);
      expect(result.nodes[0].originalNode).toBe(testNodes[0]);
      expect(result.nodes[0].position).toBeDefined();
    });
  });

  describe('Functor Contract Compliance', () => {
    it('should accept similarity functors with correct signature', () => {
      // Test that functor contract (nodeA, nodeB, context) => number is enforced
      const validFunctor: SimilarityFunctor = (nodeA, nodeB, context) => 0.5;

      expect(() => {
        engine.registerSimilarityFunction('test', validFunctor);
      }).not.toThrow();
    });

    it('should validate functor return values are in [0,1] range', async () => {
      const invalidFunctor = vi.fn(() => 1.5);

      // The engine strictly validates the functor contract during execution
      // and returns failure if it violates the range
      const result = await engine.calculateLayoutAsync(testNodes, invalidFunctor);
      expect(result.status.success).toBe(false);
      expect(result.status.errors.length).toBeGreaterThan(0);
    });

    it('should call similarity functor with correct parameters', async () => {
      await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor);
      expect(mockSimilarityFunctor).toHaveBeenCalledWith(
        expect.any(Object), // nodeA
        expect.any(Object), // nodeB  
        expect.objectContaining({ // context
          currentIteration: expect.any(Number),
          alpha: expect.any(Number)
        })
      );
    });
  });

  describe('2D/3D Coordinate Support', () => {
    it('should support 2D mode with z=0 constraint', async () => {
      const config: Partial<LayoutConfig> = {
        dimensions: 2,
        convergenceThreshold: 0.01
      };

      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor, config);
      result.nodes.forEach(layoutNode => {
        expect(layoutNode.position.z).toBe(0);
        expect(typeof layoutNode.position.x).toBe('number');
        expect(typeof layoutNode.position.y).toBe('number');
      });
    });

    it('should support 3D mode with z coordinates', async () => {
      const config: Partial<LayoutConfig> = {
        dimensions: 3,
        convergenceThreshold: 0.01
      };

      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor, config);
      result.nodes.forEach(layoutNode => {
        expect(typeof layoutNode.position.z).toBe('number');
        // In 3D mode, z should likely be non-zero for at least some nodes or allowed to be non-zero
      });
    });

    it('should switch between 2D and 3D modes', async () => {
      // Initial calculation in 3D
      await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor, { dimensions: 3 });

      const result2D = await engine.switchDimensionsAsync(2);
      expect(result2D.success).toBe(true);
      expect(result2D.toDimensions).toBe(2);
    });
  });

  describe('Progressive Refinement Phases', () => {
    it('should support COARSE phase', async () => {
      const config: Partial<LayoutConfig> = {
        progressiveRefinement: {
          enablePhases: true,
          phase1Duration: 500,
          phase2Duration: 2000,
          importanceWeights: { degree: 1, betweenness: 0, eigenvector: 0 }
        }
      };

      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor, config);
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    it('should emit progress events during refinement', async () => {
      const progressCallback = vi.fn();
      engine.eventEmitter.on('layoutProgress', progressCallback);

      await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor);

      expect(progressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: expect.stringMatching(/nodeLoading|nodeLayout|nodeLayoutComplete/),
          progress: expect.any(Number)
        })
      );
    });
  });

  describe('Convergence Monitoring', () => {
    it('should detect convergence', async () => {
      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor);
      expect(result.convergenceState.isConverged).toBeDefined();
    });

    it('should provide stability metrics', async () => {
      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor);
      expect(result.convergenceState).toMatchObject({
        isConverged: expect.any(Boolean),
        positionDelta: expect.any(Number)
      });
    });
  });

  describe('Pipeline Integration', () => {
    it('should maintain immutable node references', async () => {
      const originalNode = testNodes[0];
      const result = await engine.calculateLayoutAsync(testNodes, mockSimilarityFunctor);
      const layoutNode = result.nodes.find(n => n.originalNode.id === originalNode.id);

      expect(layoutNode).toBeDefined();
      expect(layoutNode?.originalNode).toBe(originalNode); // Same reference
      expect(originalNode).toEqual(testNodes[0]); // Unchanged
    });
  });
});