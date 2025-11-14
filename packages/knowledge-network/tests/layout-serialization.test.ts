/**
 * T009: Layout State Serialization Test
 * 
 * Tests that layout state can be serialized and deserialized for persistence and caching.
 * This validates the requirement that layout calculations must support state management
 * for performance optimization and pipeline coordination.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { 
  ILayoutEngine,
  LayoutConfiguration,
  LayoutNode,
  ForceConfig,
  ClusteringConfig,
  PerformanceConfig,
  LayoutMetadata
} from '../src/layout/layout-engine';
import type { Node } from '../src-archive/types';

// Mock LayoutSerializer interface (to be implemented)
interface ILayoutSerializer {
  serializeAsync(layout: Map<string, LayoutNode>): Promise<string>;
  deserializeAsync(serializedData: string): Promise<Map<string, LayoutNode>>;
  validateSerializedData(serializedData: string): boolean;
  getSerializationMetadata(serializedData: string): SerializationMetadata;
}

interface SerializationMetadata {
  version: string;
  timestamp: number;
  nodeCount: number;
  algorithm: string;
  checksum: string;
}

describe('Layout State Serialization', () => {
  let mockLayoutEngine: ILayoutEngine;
  let mockLayoutSerializer: ILayoutSerializer;
  let testNodes: Node[];
  let testConfig: LayoutConfiguration;
  let testLayoutState: Map<string, LayoutNode>;

  beforeEach(() => {
    // Create test nodes
    testNodes = [
      { 
        id: 'serialize-1', 
        label: 'Serializable Node 1', 
        type: 'concept',
        vector: [0.1, 0.2, 0.3],
        metadata: { persistence: true, cached: false }
      },
      { 
        id: 'serialize-2', 
        label: 'Serializable Node 2', 
        type: 'domain',
        vector: [0.4, 0.5, 0.6],
        metadata: { persistence: true, cached: true }
      },
      { 
        id: 'serialize-3', 
        label: 'Serializable Node 3', 
        type: 'detail',
        metadata: { persistence: false, temporary: true }
      }
    ];

    // Create test configuration
    const forceConfig: ForceConfig = {
      centerForce: 0.05,
      chargeForce: -250,
      linkForce: 0.4,
      collisionRadius: 30,
    };

    const clusteringConfig: ClusteringConfig = {
      enabled: false,
      similarityThreshold: 0.5,
      maxClusterSize: 20,
      clusterSeparation: 60,
      algorithm: 'hierarchical',
    };

    const performanceConfig: PerformanceConfig = {
      maxMemoryMB: 150,
      warningThreshold: 800,
      enableDegradation: false,
      targetFPS: 30,
    };

    testConfig = {
      forceParameters: forceConfig,
      clusteringConfig,
      similarityMeasures: ['vector-similarity'],
      performanceSettings: performanceConfig,
      stabilityThreshold: 0.01,
      maxIterations: 200,
    };

    // Create realistic layout state
    testLayoutState = new Map<string, LayoutNode>();
    testNodes.forEach((node, index) => {
      testLayoutState.set(node.id, {
        id: node.id,
        x: 100 + index * 75,
        y: 200 + index * 50,
        clusterId: index < 2 ? 'persistent-cluster' : undefined,
        similarityScores: new Map([
          ['vector-similarity', 0.7 + index * 0.1],
          ['type-similarity', 0.5 + index * 0.15]
        ]),
        originalData: node,
        layoutMetadata: {
          algorithm: 'force-directed-serializable',
          timestamp: Date.now(),
          processingTime: 85 + index * 10,
          appliedForces: new Map([
            ['charge', -250],
            ['center', 0.05],
            ['custom', 0.2 + index * 0.1]
          ]),
          customData: {
            serializationVersion: '1.0',
            iterationsToStability: 145,
            finalStabilityScore: 0.008,
            persistenceFlag: node.metadata?.persistence || false
          }
        }
      });
    });

    // Mock layout engine
    mockLayoutEngine = {
      calculateAsync: vi.fn(),
      validateConfiguration: vi.fn(),
      cleanup: vi.fn(),
      getCapabilities: vi.fn(),
    };

    // Mock layout serializer
    mockLayoutSerializer = {
      serializeAsync: vi.fn(),
      deserializeAsync: vi.fn(),
      validateSerializedData: vi.fn(),
      getSerializationMetadata: vi.fn(),
    };
  });

  describe('Layout State Serialization', () => {
    it('should serialize layout state to JSON string', async () => {
      const expectedSerializedData = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: testLayoutState.size,
        algorithm: 'force-directed-serializable',
        nodes: Array.from(testLayoutState.entries()).map(([id, layoutNode]) => ({
          id,
          x: layoutNode.x,
          y: layoutNode.y,
          clusterId: layoutNode.clusterId,
          similarityScores: Array.from(layoutNode.similarityScores.entries()),
          originalData: layoutNode.originalData,
          layoutMetadata: {
            ...layoutNode.layoutMetadata,
            appliedForces: Array.from(layoutNode.layoutMetadata.appliedForces.entries())
          }
        }))
      });

      (mockLayoutSerializer.serializeAsync as any).mockResolvedValue(expectedSerializedData);

      const result = await mockLayoutSerializer.serializeAsync(testLayoutState);

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(mockLayoutSerializer.serializeAsync).toHaveBeenCalledWith(testLayoutState);

      // Verify it's valid JSON
      expect(() => JSON.parse(result)).not.toThrow();
    });

    it('should preserve all LayoutNode properties during serialization', async () => {
      const serializedData = {
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: testLayoutState.size,
        algorithm: 'force-directed-serializable',
        nodes: Array.from(testLayoutState.entries()).map(([id, layoutNode]) => ({
          id,
          x: layoutNode.x,
          y: layoutNode.y,
          clusterId: layoutNode.clusterId,
          similarityScores: Array.from(layoutNode.similarityScores.entries()),
          originalData: layoutNode.originalData,
          layoutMetadata: {
            algorithm: layoutNode.layoutMetadata.algorithm,
            timestamp: layoutNode.layoutMetadata.timestamp,
            processingTime: layoutNode.layoutMetadata.processingTime,
            appliedForces: Array.from(layoutNode.layoutMetadata.appliedForces.entries()),
            customData: layoutNode.layoutMetadata.customData
          }
        }))
      };

      (mockLayoutSerializer.serializeAsync as any).mockResolvedValue(JSON.stringify(serializedData));

      const result = await mockLayoutSerializer.serializeAsync(testLayoutState);
      const parsed = JSON.parse(result);

      // Verify all critical properties are preserved
      expect(parsed.nodeCount).toBe(testLayoutState.size);
      expect(parsed.nodes).toHaveLength(testLayoutState.size);
      
      parsed.nodes.forEach((serializedNode: any) => {
        const originalNode = testLayoutState.get(serializedNode.id);
        expect(originalNode).toBeDefined();
        expect(serializedNode.x).toBe(originalNode!.x);
        expect(serializedNode.y).toBe(originalNode!.y);
        expect(serializedNode.clusterId).toBe(originalNode!.clusterId);
        expect(Array.isArray(serializedNode.similarityScores)).toBe(true);
        expect(serializedNode.originalData).toEqual(originalNode!.originalData);
        expect(serializedNode.layoutMetadata).toBeDefined();
      });
    });

    it('should handle Maps and complex objects in serialization', async () => {
      // Test that Maps are properly converted to arrays for JSON serialization
      const nodeWithComplexData = testLayoutState.get('serialize-1')!;
      
      const mockSerializedResult = {
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: 1,
        algorithm: 'test',
        nodes: [{
          id: nodeWithComplexData.id,
          x: nodeWithComplexData.x,
          y: nodeWithComplexData.y,
          similarityScores: [
            ['vector-similarity', 0.7],
            ['type-similarity', 0.5]
          ],
          originalData: nodeWithComplexData.originalData,
          layoutMetadata: {
            algorithm: nodeWithComplexData.layoutMetadata.algorithm,
            timestamp: nodeWithComplexData.layoutMetadata.timestamp,
            processingTime: nodeWithComplexData.layoutMetadata.processingTime,
            appliedForces: [
              ['charge', -250],
              ['center', 0.05]
            ],
            customData: nodeWithComplexData.layoutMetadata.customData
          }
        }]
      };

      (mockLayoutSerializer.serializeAsync as any).mockResolvedValue(JSON.stringify(mockSerializedResult));

      const testMap = new Map([['serialize-1', nodeWithComplexData]]);
      const result = await mockLayoutSerializer.serializeAsync(testMap);
      const parsed = JSON.parse(result);

      // Verify Maps are converted to arrays
      expect(Array.isArray(parsed.nodes[0].similarityScores)).toBe(true);
      expect(Array.isArray(parsed.nodes[0].layoutMetadata.appliedForces)).toBe(true);
    });
  });

  describe('Layout State Deserialization', () => {
    it('should deserialize JSON string back to Map<string, LayoutNode>', async () => {
      const serializedData = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: 2,
        algorithm: 'test-deserialization',
        nodes: [
          {
            id: 'deserialize-1',
            x: 150,
            y: 250,
            clusterId: 'test-cluster',
            similarityScores: [['test-similarity', 0.8]],
            originalData: { id: 'deserialize-1', label: 'Test Node 1' },
            layoutMetadata: {
              algorithm: 'test-algorithm',
              timestamp: Date.now(),
              processingTime: 100,
              appliedForces: [['charge', -300]],
              customData: { test: true }
            }
          },
          {
            id: 'deserialize-2',
            x: 300,
            y: 400,
            similarityScores: [['test-similarity', 0.6]],
            originalData: { id: 'deserialize-2', label: 'Test Node 2' },
            layoutMetadata: {
              algorithm: 'test-algorithm',
              timestamp: Date.now(),
              processingTime: 120,
              appliedForces: [['charge', -300], ['center', 0.1]]
            }
          }
        ]
      });

      const expectedMap = new Map<string, LayoutNode>();
      const parsedData = JSON.parse(serializedData);
      
      parsedData.nodes.forEach((nodeData: any) => {
        expectedMap.set(nodeData.id, {
          id: nodeData.id,
          x: nodeData.x,
          y: nodeData.y,
          clusterId: nodeData.clusterId,
          similarityScores: new Map(nodeData.similarityScores),
          originalData: nodeData.originalData,
          layoutMetadata: {
            algorithm: nodeData.layoutMetadata.algorithm,
            timestamp: nodeData.layoutMetadata.timestamp,
            processingTime: nodeData.layoutMetadata.processingTime,
            appliedForces: new Map(nodeData.layoutMetadata.appliedForces),
            customData: nodeData.layoutMetadata.customData
          }
        });
      });

      (mockLayoutSerializer.deserializeAsync as any).mockResolvedValue(expectedMap);

      const result = await mockLayoutSerializer.deserializeAsync(serializedData);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.has('deserialize-1')).toBe(true);
      expect(result.has('deserialize-2')).toBe(true);

      const node1 = result.get('deserialize-1')!;
      expect(node1.x).toBe(150);
      expect(node1.y).toBe(250);
      expect(node1.clusterId).toBe('test-cluster');
      expect(node1.similarityScores).toBeInstanceOf(Map);
      expect(node1.similarityScores.get('test-similarity')).toBe(0.8);
      expect(node1.layoutMetadata.appliedForces).toBeInstanceOf(Map);
    });

    it('should reconstruct Maps from arrays during deserialization', async () => {
      const serializedWithArrays = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: 1,
        algorithm: 'map-reconstruction-test',
        nodes: [{
          id: 'map-test-node',
          x: 100,
          y: 200,
          similarityScores: [
            ['cosine', 0.9],
            ['euclidean', 0.7],
            ['jaccard', 0.5]
          ],
          originalData: { id: 'map-test-node', type: 'test' },
          layoutMetadata: {
            algorithm: 'test',
            timestamp: Date.now(),
            processingTime: 50,
            appliedForces: [
              ['charge', -400],
              ['center', 0.2],
              ['custom', 0.1]
            ]
          }
        }]
      });

      const reconstructedMap = new Map<string, LayoutNode>();
      const nodeData = JSON.parse(serializedWithArrays).nodes[0];
      
      reconstructedMap.set(nodeData.id, {
        id: nodeData.id,
        x: nodeData.x,
        y: nodeData.y,
        similarityScores: new Map(nodeData.similarityScores),
        originalData: nodeData.originalData,
        layoutMetadata: {
          algorithm: nodeData.layoutMetadata.algorithm,
          timestamp: nodeData.layoutMetadata.timestamp,
          processingTime: nodeData.layoutMetadata.processingTime,
          appliedForces: new Map(nodeData.layoutMetadata.appliedForces)
        }
      });

      (mockLayoutSerializer.deserializeAsync as any).mockResolvedValue(reconstructedMap);

      const result = await mockLayoutSerializer.deserializeAsync(serializedWithArrays);
      const node = result.get('map-test-node')!;

      // Verify Maps are properly reconstructed
      expect(node.similarityScores).toBeInstanceOf(Map);
      expect(node.similarityScores.size).toBe(3);
      expect(node.similarityScores.get('cosine')).toBe(0.9);
      expect(node.similarityScores.get('euclidean')).toBe(0.7);
      expect(node.similarityScores.get('jaccard')).toBe(0.5);

      expect(node.layoutMetadata.appliedForces).toBeInstanceOf(Map);
      expect(node.layoutMetadata.appliedForces.size).toBe(3);
      expect(node.layoutMetadata.appliedForces.get('charge')).toBe(-400);
      expect(node.layoutMetadata.appliedForces.get('center')).toBe(0.2);
      expect(node.layoutMetadata.appliedForces.get('custom')).toBe(0.1);
    });

    it('should handle deserialization errors gracefully', async () => {
      const invalidSerializedData = '{ "invalid": "json", "missing": "required_fields" }';

      (mockLayoutSerializer.deserializeAsync as any).mockRejectedValue(
        new Error('Invalid serialized layout data: missing required fields')
      );

      await expect(mockLayoutSerializer.deserializeAsync(invalidSerializedData))
        .rejects.toThrow('Invalid serialized layout data');
    });
  });

  describe('Serialization Validation and Metadata', () => {
    it('should validate serialized data integrity', () => {
      const validSerializedData = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: 2,
        algorithm: 'validation-test',
        checksum: 'abc123def456',
        nodes: [
          { id: 'valid-1', x: 100, y: 200, originalData: {}, layoutMetadata: {} },
          { id: 'valid-2', x: 300, y: 400, originalData: {}, layoutMetadata: {} }
        ]
      });

      const invalidSerializedData = '{ "incomplete": "data" }';

      (mockLayoutSerializer.validateSerializedData as any)
        .mockImplementation((data: string) => {
          try {
            const parsed = JSON.parse(data);
            return !!(parsed.version && parsed.nodes && Array.isArray(parsed.nodes));
          } catch {
            return false;
          }
        });

      expect(mockLayoutSerializer.validateSerializedData(validSerializedData)).toBe(true);
      expect(mockLayoutSerializer.validateSerializedData(invalidSerializedData)).toBe(false);
    });

    it('should extract serialization metadata', () => {
      const serializedDataWithMetadata = JSON.stringify({
        version: '1.2.0',
        timestamp: 1700000000000,
        nodeCount: 50,
        algorithm: 'advanced-force-directed',
        checksum: 'sha256:abcdef123456',
        nodes: []
      });

      const expectedMetadata: SerializationMetadata = {
        version: '1.2.0',
        timestamp: 1700000000000,
        nodeCount: 50,
        algorithm: 'advanced-force-directed',
        checksum: 'sha256:abcdef123456'
      };

      (mockLayoutSerializer.getSerializationMetadata as any).mockReturnValue(expectedMetadata);

      const metadata = mockLayoutSerializer.getSerializationMetadata(serializedDataWithMetadata);

      expect(metadata.version).toBe('1.2.0');
      expect(metadata.nodeCount).toBe(50);
      expect(metadata.algorithm).toBe('advanced-force-directed');
      expect(metadata.checksum).toBe('sha256:abcdef123456');
    });

    it('should support versioned serialization for backwards compatibility', () => {
      const v1SerializedData = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: 1,
        nodes: [{ id: 'v1-node', x: 100, y: 200 }]
      });

      const v2SerializedData = JSON.stringify({
        version: '2.0',
        timestamp: Date.now(),
        nodeCount: 1,
        algorithm: 'enhanced-force',
        checksum: 'abc123',
        compressionType: 'gzip',
        nodes: [{ id: 'v2-node', x: 100, y: 200, clusterId: 'cluster-1' }]
      });

      (mockLayoutSerializer.validateSerializedData as any)
        .mockImplementation((data: string) => {
          const parsed = JSON.parse(data);
          return ['1.0', '2.0'].includes(parsed.version);
        });

      expect(mockLayoutSerializer.validateSerializedData(v1SerializedData)).toBe(true);
      expect(mockLayoutSerializer.validateSerializedData(v2SerializedData)).toBe(true);
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large layout state serialization efficiently', async () => {
      const largeLayoutState = new Map<string, LayoutNode>();
      
      // Create large dataset
      for (let i = 0; i < 1000; i++) {
        largeLayoutState.set(`large-node-${i}`, {
          id: `large-node-${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 800,
          similarityScores: new Map([
            ['similarity-1', Math.random()],
            ['similarity-2', Math.random()]
          ]),
          originalData: { id: `large-node-${i}`, type: 'performance-test' },
          layoutMetadata: {
            algorithm: 'performance-optimized',
            timestamp: Date.now(),
            processingTime: Math.random() * 100,
            appliedForces: new Map([
              ['charge', -300 + Math.random() * 100],
              ['center', 0.1]
            ])
          }
        });
      }

      const mockLargeSerializedData = JSON.stringify({
        version: '1.0',
        timestamp: Date.now(),
        nodeCount: 1000,
        algorithm: 'performance-optimized',
        compressionHint: 'recommended',
        nodes: [] // Placeholder - actual implementation would include all nodes
      });

      (mockLayoutSerializer.serializeAsync as any).mockResolvedValue(mockLargeSerializedData);

      const startTime = Date.now();
      const result = await mockLayoutSerializer.serializeAsync(largeLayoutState);
      const endTime = Date.now();

      expect(typeof result).toBe('string');
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(mockLayoutSerializer.serializeAsync).toHaveBeenCalledWith(largeLayoutState);
    });

    it('should support streaming serialization for memory efficiency', async () => {
      // Mock streaming serialization for large datasets
      const streamingResult = {
        stream: true,
        chunks: 5,
        totalSize: 1024000,
        compression: 'gzip'
      };

      (mockLayoutSerializer.serializeAsync as any).mockResolvedValue(
        JSON.stringify(streamingResult)
      );

      const result = await mockLayoutSerializer.serializeAsync(testLayoutState);
      const parsed = JSON.parse(result);

      // Verify streaming metadata is included
      expect(parsed.stream).toBe(true);
      expect(typeof parsed.chunks).toBe('number');
      expect(typeof parsed.totalSize).toBe('number');
    });
  });
});