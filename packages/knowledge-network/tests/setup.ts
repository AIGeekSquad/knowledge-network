/**
 * Test setup file for JSDOM environment
 * This ensures DOM globals are available for all tests
 */

import { beforeAll } from 'vitest';
import { 
  Node, 
  SimilarityFunctor, 
  ClusteringContext, 
  EnhancedLayoutNode, 
  Position3D, 
  NodeImportance, 
  LayoutPhase 
} from '../src/types';

beforeAll(() => {
  // Additional DOM setup if needed
  // The JSDOM environment is already configured in vitest.config.ts
  console.log('DOM environment initialized');

  if (typeof window !== 'undefined') {
    // Mock SVGSVGElement.getBBox for JSDOM
    if (!('getBBox' in window.SVGSVGElement.prototype)) {
      Object.defineProperty(window.SVGSVGElement.prototype, 'getBBox', {
        value: () => ({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }),
        writable: true,
      });
    }

    // Mock ownerSVGElement for JSDOM
    if (!('ownerSVGElement' in window.SVGElement.prototype)) {
      Object.defineProperty(window.SVGElement.prototype, 'ownerSVGElement', {
        get: function() {
          return this.tagName === 'svg' ? this : this.parentNode;
        },
      });
    }

    // Mock createSVGPoint for JSDOM
    if (!('createSVGPoint' in window.SVGSVGElement.prototype)) {
      Object.defineProperty(window.SVGSVGElement.prototype, 'createSVGPoint', {
        value: function() {
          const point = this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg:point');
          point.x = 0;
          point.y = 0;
          return point;
        },
        writable: true,
      });
    }

    // Mock getScreenCTM for JSDOM
    if (!('getScreenCTM' in window.SVGElement.prototype)) {
      Object.defineProperty(window.SVGElement.prototype, 'getScreenCTM', {
        value: () => ({
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
        }),
        writable: true,
      });
    }
  }
});

// ============================================
// NodeLayout Testing Utilities & Mock Data Generators
// ============================================

/**
 * Generate mock nodes with vector embeddings for similarity testing
 */
export function generateMockNodes(count: number = 10): Node[] {
  const nodes: Node[] = [];
  
  for (let i = 0; i < count; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Test Node ${i}`,
      vector: Array.from({ length: 5 }, () => Math.random()), // 5-dimensional vector
      metadata: {
        category: `category-${Math.floor(i / 3)}`, // Group into categories
        tags: [`tag-${i % 4}`, `tag-${Math.floor(i / 2)}`],
        timestamp: Date.now() - (i * 86400000) // Spread across days
      },
      type: 'test-node',
      properties: {
        importance: Math.random(),
        connections: Math.floor(Math.random() * 10)
      }
    });
  }
  
  return nodes;
}

/**
 * Generate clustered nodes with known similarity patterns for validation
 */
export function generateClusteredNodes(clusterCount: number = 3, nodesPerCluster: number = 5): Node[] {
  const nodes: Node[] = [];
  
  for (let cluster = 0; cluster < clusterCount; cluster++) {
    const clusterCenter = Array.from({ length: 5 }, () => Math.random());
    
    for (let i = 0; i < nodesPerCluster; i++) {
      const nodeId = `cluster-${cluster}-node-${i}`;
      
      // Create vector close to cluster center with small variance
      const vector = clusterCenter.map(center => 
        center + (Math.random() - 0.5) * 0.2 // ±10% variance
      );
      
      nodes.push({
        id: nodeId,
        label: `Cluster ${cluster} Node ${i}`,
        vector,
        metadata: {
          clusterId: `cluster-${cluster}`,
          category: `category-${cluster}`,
          tags: [`cluster-${cluster}`, `node-${i}`]
        },
        type: 'clustered-node'
      });
    }
  }
  
  return nodes;
}

/**
 * Get production similarity function for testing real algorithms
 * NO MOCKS - Tests actual production code
 */
export function getProductionSimilarityFunction(name: 'cosine' | 'jaccard' | 'spatial'): SimilarityFunctor {
  const { SimilarityProcessor } = require('../src/layout/SimilarityProcessor');
  const processor = new SimilarityProcessor();
  return processor.getDefaultSimilarityFunction(name);
}

/**
 * Create mock clustering context for testing
 */
export function createMockClusteringContext(): ClusteringContext {
  return {
    currentIteration: 0,
    alpha: 1.0,
    spatialIndex: null, // Will be initialized by actual implementation
    cacheManager: null, // Will be initialized by actual implementation
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
        enablePhases: true,
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
}

/**
 * Create mock enhanced layout node for testing
 */
export function createMockLayoutNode(baseNode: Node, position?: Position3D): EnhancedLayoutNode {
  return {
    id: `layout-${baseNode.id}`,
    originalNode: baseNode,
    position: position || { x: Math.random() * 100, y: Math.random() * 100, z: 0 },
    similarityScores: new Map(),
    convergenceState: {
      isStable: false,
      positionDelta: 1.0,
      stabilityHistory: [1.0, 0.9, 0.8]
    },
    importance: {
      degree: Math.floor(Math.random() * 10),
      betweenness: Math.random(),
      eigenvector: Math.random(),
      composite: Math.random()
    },
    metadata: {
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      isStable: false,
      phase: LayoutPhase.COARSE,
      forceContributions: []
    }
  };
}

/**
 * Validate similarity function contract compliance
 */
export function validateSimilarityFunctor(functor: SimilarityFunctor): boolean {
  try {
    const nodeA = generateMockNodes(1)[0];
    const nodeB = generateMockNodes(1)[0];
    const context = createMockClusteringContext();
    
    const result = functor(nodeA, nodeB, context);
    
    // Contract validation
    return (
      typeof result === 'number' &&
      !isNaN(result) &&
      isFinite(result) &&
      result >= 0 &&
      result <= 1
    );
  } catch (error) {
    return false;
  }
}

/**
 * Assert similarity function results are within expected bounds
 */
export function assertSimilarityBounds(similarity: number, message: string = 'Similarity out of bounds'): void {
  if (typeof similarity !== 'number' || isNaN(similarity) || !isFinite(similarity)) {
    throw new Error(`${message}: similarity must be a finite number, got ${similarity}`);
  }
  if (similarity < 0 || similarity > 1) {
    throw new Error(`${message}: similarity must be in range [0, 1], got ${similarity}`);
  }
}

/**
 * Create performance testing dataset with known similarity patterns
 */
export function createPerformanceTestDataset(nodeCount: number): {
  nodes: Node[];
  expectedSimilarities: Map<string, number>;
} {
  const nodes = generateClusteredNodes(Math.ceil(nodeCount / 10), 10);
  const expectedSimilarities = new Map<string, number>();
  
  // Pre-calculate expected similarities for validation using REAL production function
  const productionCosine = getProductionSimilarityFunction('cosine');
  const context = createMockClusteringContext();
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const key = `${nodes[i].id}|${nodes[j].id}`;
      const similarity = productionCosine(nodes[i], nodes[j], context);
      expectedSimilarities.set(key, similarity);
    }
  }
  
  return { nodes, expectedSimilarities };
}

/**
 * Mock D3 SimulationNodeDatum for compatibility testing
 */
export function createMockSimulationNode(baseNode: Node): any {
  return {
    ...baseNode,
    x: Math.random() * 100,
    y: Math.random() * 100,
    vx: 0,
    vy: 0,
    fx: null,
    fy: null
  };
}