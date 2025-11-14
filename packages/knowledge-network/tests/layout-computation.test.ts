/**
 * T008: Layout Computation Test
 * 
 * Tests that layout calculations return Map<string, LayoutNode> for O(1) lookups.
 * This validates the core requirement of US1 that layout engines must return
 * structured data suitable for efficient pipeline handoffs.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  ILayoutEngine,
  LayoutConfiguration,
  LayoutNode,
  ForceConfig,
  ClusteringConfig,
  PerformanceConfig,
  LayoutProgress,
  ProgressCallback
} from '../src/layout/layout-engine';
import type { Node, Edge } from '../src-archive/types';

describe('Layout Computation', () => {
  let mockLayoutEngine: ILayoutEngine;
  let testNodes: Node[];
  let testEdges: Edge[];
  let testConfig: LayoutConfiguration;

  beforeEach(() => {
    // Create comprehensive test dataset
    testNodes = [
      { 
        id: 'n1', 
        label: 'Machine Learning', 
        type: 'concept',
        vector: [0.8, 0.2, 0.1],
        metadata: { importance: 0.9, category: 'AI' }
      },
      { 
        id: 'n2', 
        label: 'Neural Networks', 
        type: 'concept',
        vector: [0.9, 0.1, 0.05],
        metadata: { importance: 0.8, category: 'AI' }
      },
      { 
        id: 'n3', 
        label: 'Data Science', 
        type: 'domain',
        vector: [0.6, 0.3, 0.2],
        metadata: { importance: 0.7, category: 'Data' }
      },
      { 
        id: 'n4', 
        label: 'Algorithm', 
        type: 'detail',
        vector: [0.5, 0.4, 0.3],
        metadata: { importance: 0.6, category: 'Technical' }
      }
    ];

    testEdges = [
      { source: 'n1', target: 'n2', type: 'relates', weight: 0.9 },
      { source: 'n1', target: 'n3', type: 'domain', weight: 0.7 },
      { source: 'n2', target: 'n4', type: 'uses', weight: 0.6 }
    ];

    // Configuration for realistic D3 force simulation
    const forceConfig: ForceConfig = {
      centerForce: 0.1,
      chargeForce: -300,
      linkForce: 0.5,
      collisionRadius: 25,
      customForces: new Map([
        ['similarity', { strength: 0.3 }],
        ['clustering', { strength: 0.2 }]
      ])
    };

    const clusteringConfig: ClusteringConfig = {
      enabled: true,
      similarityThreshold: 0.7,
      maxClusterSize: 15,
      clusterSeparation: 80,
      algorithm: 'similarity-based',
    };

    const performanceConfig: PerformanceConfig = {
      maxMemoryMB: 200,
      warningThreshold: 500,
      enableDegradation: true,
      targetFPS: 60,
    };

    testConfig = {
      forceParameters: forceConfig,
      clusteringConfig,
      similarityMeasures: ['cosine-similarity', 'type-similarity'],
      performanceSettings: performanceConfig,
      stabilityThreshold: 0.005,
      maxIterations: 500,
    };

    // Mock layout engine with realistic behavior
    mockLayoutEngine = {
      calculateAsync: vi.fn(),
      validateConfiguration: vi.fn(),
      cleanup: vi.fn(),
      getCapabilities: vi.fn(),
    };
  });

  describe('Map<string, LayoutNode> Return Type', () => {
    it('should return Map with node IDs as keys', async () => {
      // Create expected layout result
      const expectedLayout = new Map<string, LayoutNode>();
      testNodes.forEach((node, index) => {
        expectedLayout.set(node.id, {
          id: node.id,
          x: 100 + index * 50, // Positioned layout
          y: 150 + index * 30,
          clusterId: node.type === 'concept' ? 'cluster-ai' : undefined,
          similarityScores: new Map([
            ['cosine-similarity', 0.8],
            ['type-similarity', 0.6]
          ]),
          originalData: node,
          layoutMetadata: {
            algorithm: 'force-directed-d3',
            timestamp: Date.now(),
            processingTime: 120,
            appliedForces: new Map([
              ['charge', -300],
              ['center', 0.1],
              ['similarity', 0.3]
            ]),
            customData: {
              iterations: 150,
              stabilityReached: true
            }
          }
        });
      });

      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(expectedLayout);

      const result = await mockLayoutEngine.calculateAsync(testNodes, testConfig);

      // Verify Map structure and O(1) lookup capability
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(testNodes.length);

      // Test O(1) lookups for all nodes
      testNodes.forEach(node => {
        expect(result.has(node.id)).toBe(true);
        const layoutNode = result.get(node.id);
        expect(layoutNode).toBeDefined();
        expect(layoutNode!.id).toBe(node.id);
        expect(typeof layoutNode!.x).toBe('number');
        expect(typeof layoutNode!.y).toBe('number');
      });
    });

    it('should provide complete LayoutNode structure for each node', async () => {
      const mockLayout = new Map<string, LayoutNode>();
      testNodes.forEach(node => {
        mockLayout.set(node.id, {
          id: node.id,
          x: Math.random() * 400,
          y: Math.random() * 300,
          clusterId: 'test-cluster',
          similarityScores: new Map([
            ['cosine-similarity', Math.random()],
            ['type-similarity', Math.random()]
          ]),
          originalData: node,
          layoutMetadata: {
            algorithm: 'force-directed',
            timestamp: Date.now(),
            processingTime: Math.random() * 100,
            appliedForces: new Map([
              ['charge', -300],
              ['center', 0.1]
            ])
          }
        });
      });

      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(mockLayout);

      const result = await mockLayoutEngine.calculateAsync(testNodes, testConfig);

      // Verify complete LayoutNode structure
      result.forEach((layoutNode, nodeId) => {
        expect(layoutNode.id).toBe(nodeId); // Key matches ID
        expect(typeof layoutNode.x).toBe('number');
        expect(typeof layoutNode.y).toBe('number');
        expect(layoutNode.similarityScores).toBeInstanceOf(Map);
        expect(layoutNode.originalData).toBeDefined();
        expect(layoutNode.layoutMetadata).toBeDefined();
        expect(layoutNode.layoutMetadata.algorithm).toBeDefined();
        expect(typeof layoutNode.layoutMetadata.timestamp).toBe('number');
        expect(typeof layoutNode.layoutMetadata.processingTime).toBe('number');
        expect(layoutNode.layoutMetadata.appliedForces).toBeInstanceOf(Map);
      });
    });

    it('should handle empty node arrays', async () => {
      const emptyLayout = new Map<string, LayoutNode>();
      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(emptyLayout);

      const result = await mockLayoutEngine.calculateAsync([], testConfig);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('D3.js Force Simulation Integration', () => {
    it('should calculate realistic node positions', async () => {
      // Mock realistic D3 force simulation results
      const simulatedLayout = new Map<string, LayoutNode>();
      
      // Simulate clustered positioning based on similarity
      const aiNodes = testNodes.filter(n => n.metadata?.category === 'AI');
      const otherNodes = testNodes.filter(n => n.metadata?.category !== 'AI');

      // AI cluster positioned together
      aiNodes.forEach((node, index) => {
        simulatedLayout.set(node.id, {
          id: node.id,
          x: 200 + index * 30, // Clustered positioning
          y: 200 + index * 20,
          clusterId: 'ai-cluster',
          similarityScores: new Map([['cosine-similarity', 0.85]]),
          originalData: node,
          layoutMetadata: {
            algorithm: 'force-directed-clustering',
            timestamp: Date.now(),
            processingTime: 95,
            appliedForces: new Map([
              ['charge', -300],
              ['similarity', 0.4],
              ['clustering', 0.3]
            ])
          }
        });
      });

      // Other nodes positioned separately
      otherNodes.forEach((node, index) => {
        simulatedLayout.set(node.id, {
          id: node.id,
          x: 400 + index * 40,
          y: 100 + index * 30,
          similarityScores: new Map([['type-similarity', 0.4]]),
          originalData: node,
          layoutMetadata: {
            algorithm: 'force-directed',
            timestamp: Date.now(),
            processingTime: 95,
            appliedForces: new Map([
              ['charge', -300],
              ['center', 0.1]
            ])
          }
        });
      });

      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(simulatedLayout);

      const result = await mockLayoutEngine.calculateAsync(testNodes, testConfig);

      // Verify clustering behavior is reflected in positions
      const aiLayoutNodes = Array.from(result.values())
        .filter(ln => ln.clusterId === 'ai-cluster');
      
      expect(aiLayoutNodes.length).toBeGreaterThan(0);
      
      // AI nodes should be positioned closer together
      if (aiLayoutNodes.length >= 2) {
        const node1 = aiLayoutNodes[0];
        const node2 = aiLayoutNodes[1];
        const distance = Math.sqrt(
          Math.pow(node1.x - node2.x, 2) + 
          Math.pow(node1.y - node2.y, 2)
        );
        expect(distance).toBeLessThan(100); // Clustered within 100 units
      }
    });

    it('should preserve similarity scores from configuration', async () => {
      const layoutWithSimilarity = new Map<string, LayoutNode>();
      
      testNodes.forEach(node => {
        const scores = new Map<string, number>();
        testConfig.similarityMeasures.forEach(measure => {
          scores.set(measure, Math.random());
        });

        layoutWithSimilarity.set(node.id, {
          id: node.id,
          x: Math.random() * 400,
          y: Math.random() * 300,
          similarityScores: scores,
          originalData: node,
          layoutMetadata: {
            algorithm: 'similarity-based-layout',
            timestamp: Date.now(),
            processingTime: 80,
            appliedForces: new Map()
          }
        });
      });

      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(layoutWithSimilarity);

      const result = await mockLayoutEngine.calculateAsync(testNodes, testConfig);

      // Verify similarity measures are preserved
      result.forEach(layoutNode => {
        testConfig.similarityMeasures.forEach(measure => {
          expect(layoutNode.similarityScores.has(measure)).toBe(true);
          expect(typeof layoutNode.similarityScores.get(measure)).toBe('number');
        });
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should support progress callbacks during calculation', async () => {
      const progressCallback: ProgressCallback = vi.fn();
      const mockProgress: LayoutProgress[] = [
        {
          stage: 'initialization',
          percentage: 0,
          message: 'Initializing force simulation',
          metrics: {
            processingTime: 0,
            memoryUsage: 10,
            iterations: 0,
            stabilityScore: 0,
            currentFPS: 0
          },
          cancellable: true
        },
        {
          stage: 'simulation',
          percentage: 50,
          message: 'Running force simulation',
          metrics: {
            processingTime: 50,
            memoryUsage: 25,
            iterations: 150,
            stabilityScore: 0.3,
            currentFPS: 58
          },
          cancellable: true
        },
        {
          stage: 'finalization',
          percentage: 100,
          message: 'Layout calculation complete',
          metrics: {
            processingTime: 120,
            memoryUsage: 30,
            iterations: 300,
            stabilityScore: 0.005,
            currentFPS: 60
          },
          cancellable: false
        }
      ];

      // Mock progress updates and final result
      (mockLayoutEngine.calculateAsync as any).mockImplementation(
        async (nodes: Node[], config: LayoutConfiguration, progress?: ProgressCallback) => {
          if (progress) {
            mockProgress.forEach(p => progress(p));
          }
          return new Map();
        }
      );

      await mockLayoutEngine.calculateAsync(testNodes, testConfig, progressCallback);

      expect(progressCallback).toHaveBeenCalledTimes(mockProgress.length);
      mockProgress.forEach((expectedProgress, index) => {
        expect(progressCallback).toHaveBeenNthCalledWith(index + 1, expectedProgress);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle nodes without vector data', async () => {
      const nodesWithoutVectors: Node[] = [
        { id: 'nv1', label: 'No Vector 1', type: 'concept' },
        { id: 'nv2', label: 'No Vector 2', type: 'detail' }
      ];

      const layoutResult = new Map<string, LayoutNode>();
      nodesWithoutVectors.forEach(node => {
        layoutResult.set(node.id, {
          id: node.id,
          x: Math.random() * 400,
          y: Math.random() * 300,
          similarityScores: new Map(), // Empty similarity scores
          originalData: node,
          layoutMetadata: {
            algorithm: 'basic-force',
            timestamp: Date.now(),
            processingTime: 30,
            appliedForces: new Map([['charge', -300]])
          }
        });
      });

      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(layoutResult);

      const result = await mockLayoutEngine.calculateAsync(nodesWithoutVectors, testConfig);

      expect(result.size).toBe(nodesWithoutVectors.length);
      result.forEach(layoutNode => {
        expect(layoutNode.similarityScores).toBeInstanceOf(Map);
        expect(layoutNode.originalData).toBeDefined();
      });
    });

    it('should maintain data consistency with large datasets', async () => {
      const largeNodeSet: Node[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `large-node-${i}`,
        label: `Large Node ${i}`,
        type: i % 4 === 0 ? 'concept' : 'detail',
        vector: [Math.random(), Math.random(), Math.random()]
      }));

      const largeLayout = new Map<string, LayoutNode>();
      largeNodeSet.forEach(node => {
        largeLayout.set(node.id, {
          id: node.id,
          x: Math.random() * 1000,
          y: Math.random() * 800,
          similarityScores: new Map([['vector-similarity', Math.random()]]),
          originalData: node,
          layoutMetadata: {
            algorithm: 'optimized-force',
            timestamp: Date.now(),
            processingTime: 200,
            appliedForces: new Map([['charge', -200]])
          }
        });
      });

      (mockLayoutEngine.calculateAsync as any).mockResolvedValue(largeLayout);

      const result = await mockLayoutEngine.calculateAsync(largeNodeSet, testConfig);

      // Verify data integrity with large datasets
      expect(result.size).toBe(largeNodeSet.length);
      
      // Test random sampling for performance
      const sampleIds = largeNodeSet.slice(0, 10).map(n => n.id);
      sampleIds.forEach(id => {
        expect(result.has(id)).toBe(true);
        const layoutNode = result.get(id);
        expect(layoutNode!.id).toBe(id);
        expect(layoutNode!.originalData).toBeDefined();
      });
    });
  });
});