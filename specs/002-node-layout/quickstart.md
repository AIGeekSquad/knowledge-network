# NodeLayout Module - Quick Start Guide

**Version**: 1.0.0 | **Module**: `@aigeeksquad/knowledge-network/layout/NodeLayout`

The NodeLayout module provides similarity-based node positioning for knowledge graphs, translating abstract similarity relationships into intuitive spatial arrangements. This enables semantic navigation through spatial proximity rather than explicit connections.

## Installation & Setup

```typescript
import { NodeLayoutEngine } from '@aigeeksquad/knowledge-network/layout/NodeLayout';
import { Node, SimilarityFunctor } from '@aigeeksquad/knowledge-network/types';

// Create layout engine instance
const layoutEngine = new NodeLayoutEngine();
```

## Basic Usage

### Minimal Example Using Similarity Functions

```typescript
// Define your nodes with similarity data
const nodes: Node[] = [
  { id: 'node1', label: 'Research Paper A', vector: [0.1, 0.2, 0.3] },
  { id: 'node2', label: 'Research Paper B', vector: [0.2, 0.3, 0.1] },
  { id: 'node3', label: 'Research Paper C', vector: [0.8, 0.7, 0.9] }
];

// Configure layout with cosine similarity
const layoutConfig = {
  similarityFunction: 'cosine',
  dimensionalMode: '2D' as const,
  convergenceThreshold: 0.01
};

// Calculate layout
const layoutResult = await layoutEngine.calculateLayout(nodes, layoutConfig);

// Access positioned nodes
const positionedNodes = layoutResult.nodes;
// Each node now has: { ...originalNode, position: { x: number, y: number, z?: number } }
```

## Configuration Options

### Similarity Function Configuration

```typescript
interface LayoutConfig {
  // Similarity function selection
  similarityFunction: 'cosine' | 'jaccard' | 'euclidean' | string; // string for custom registered functions
  
  // Weighted similarity composition
  similarityWeights?: {
    [functionName: string]: number; // Default weight: 1.0
  };
  
  // Dimensional settings
  dimensionalMode: '2D' | '3D';
  
  // Convergence criteria
  convergenceThreshold: number; // Default: 0.01
  maxIterations?: number; // Default: 1000
}
```

### Progressive Refinement Phases

```typescript
const advancedConfig = {
  similarityFunction: 'cosine',
  dimensionalMode: '3D' as const,
  
  // Configure progressive refinement
  progressiveRefinement: {
    enabled: true,
    phases: [
      {
        name: 'initial',
        nodeSelection: 'high-degree', // 'random' | 'high-degree' | 'custom'
        maxNodes: 100,
        convergenceThreshold: 0.05
      },
      {
        name: 'refinement',
        nodeSelection: 'remaining',
        convergenceThreshold: 0.01
      }
    ]
  }
};
```

### 2D/3D Mode Selection

```typescript
// Switch between dimensional modes
await layoutEngine.switchDimensions('3D'); // '2D' | '3D'

// Configure universal coordinates (2D mode uses z=0 constraint)
const config3D = {
  similarityFunction: 'cosine',
  dimensionalMode: '3D' as const,
  spatialConstraints: {
    boundingBox: { width: 1000, height: 800, depth: 600 }
  }
};
```

## Custom Similarity Functions

### Functor Contract

All similarity functions follow the contract:
```typescript
type SimilarityFunctor = (
  nodeA: Node, 
  nodeB: Node, 
  context: ClusteringContext
) => number;
```

### Basic Custom Function

```typescript
// Register a custom metadata-based similarity function
const metadataSimilarity: SimilarityFunctor = (nodeA, nodeB, context) => {
  const tagsA = new Set(nodeA.metadata?.tags || []);
  const tagsB = new Set(nodeB.metadata?.tags || []);
  
  const intersection = new Set([...tagsA].filter(x => tagsB.has(x)));
  const union = new Set([...tagsA, ...tagsB]);
  
  return union.size > 0 ? intersection.size / union.size : 0;
};

// Register the function
layoutEngine.registerSimilarityFunction('metadata', metadataSimilarity);

// Use in configuration
const config = {
  similarityFunction: 'metadata',
  dimensionalMode: '2D' as const
};
```

### Weighted Composition Example

```typescript
// Register multiple similarity functions
layoutEngine.registerSimilarityFunction('vector', cosineSimilarity);
layoutEngine.registerSimilarityFunction('metadata', metadataSimilarity);

// Configure weighted composition
const compositeConfig = {
  similarityFunction: 'composite',
  similarityWeights: {
    vector: 0.7,     // 70% weight on vector similarity
    metadata: 0.3    // 30% weight on metadata similarity
  },
  dimensionalMode: '2D' as const
};
```

## Progressive Refinement

### Event-Driven Progress Tracking

```typescript
// Listen for layout progress events
layoutEngine.on('layoutProgress', (event) => {
  console.log(`Phase: ${event.phase}, Progress: ${event.progress}%`);
  console.log(`Nodes processed: ${event.nodesProcessed}/${event.totalNodes}`);
});

// Configure progressive layout
const progressiveConfig = {
  similarityFunction: 'cosine',
  dimensionalMode: '2D' as const,
  progressiveRefinement: {
    enabled: true,
    earlyInteraction: true, // Enable interaction before full convergence
    phases: [
      { name: 'quick', maxNodes: 50, convergenceThreshold: 0.1 },
      { name: 'detailed', convergenceThreshold: 0.01 }
    ]
  }
};

const result = await layoutEngine.calculateLayout(nodes, progressiveConfig);
```

### Convergence Monitoring

```typescript
// Monitor convergence state
const convergenceState = await layoutEngine.getConvergenceState();
console.log({
  isConverged: convergenceState.isConverged,
  stability: convergenceState.stability,
  iterationsCompleted: convergenceState.iterations,
  positionDelta: convergenceState.positionDelta
});
```

## Common Patterns

### Pattern 1: Research Paper Clustering

```typescript
const researchConfig = {
  similarityFunction: 'cosine',
  dimensionalMode: '2D' as const,
  progressiveRefinement: {
    enabled: true,
    phases: [
      { name: 'topics', nodeSelection: 'high-degree', maxNodes: 100 },
      { name: 'subtopics', convergenceThreshold: 0.005 }
    ]
  }
};
```

### Pattern 2: Multi-Modal Similarity

```typescript
// Custom function combining multiple data types
const multiModalSimilarity: SimilarityFunctor = (nodeA, nodeB, context) => {
  let similarity = 0;
  let weightSum = 0;
  
  // Vector similarity (if available)
  if (nodeA.vector && nodeB.vector) {
    similarity += cosineSimilarity(nodeA.vector, nodeB.vector) * 0.6;
    weightSum += 0.6;
  }
  
  // Category similarity
  if (nodeA.category === nodeB.category) {
    similarity += 1.0 * 0.3;
    weightSum += 0.3;
  }
  
  // Temporal proximity
  if (nodeA.timestamp && nodeB.timestamp) {
    const timeDiff = Math.abs(nodeA.timestamp - nodeB.timestamp);
    const temporalSim = Math.exp(-timeDiff / (365 * 24 * 60 * 60 * 1000)); // 1 year decay
    similarity += temporalSim * 0.1;
    weightSum += 0.1;
  }
  
  return weightSum > 0 ? similarity / weightSum : 0;
};
```

### Pattern 3: Dynamic Layout Updates

```typescript
// Update layout when data changes
const updateLayout = async (newNodes: Node[], changedNodeIds: string[]) => {
  const updateConfig = {
    similarityFunction: 'cosine',
    dimensionalMode: '2D' as const,
    incrementalUpdate: {
      enabled: true,
      changedNodes: changedNodeIds,
      preserveStability: true
    }
  };
  
  return await layoutEngine.updatePositions(newNodes, updateConfig);
};
```

## API Reference

### NodeLayoutEngine

#### Core Methods

```typescript
class NodeLayoutEngine {
  // Calculate complete layout
  calculateLayout(nodes: Node[], config: LayoutConfig): Promise<LayoutResult>;
  
  // Update existing layout
  updatePositions(nodeUpdates: NodeUpdate[], options?: UpdateOptions): Promise<LayoutResult>;
  
  // Switch dimensional mode
  switchDimensions(targetDimensions: '2D' | '3D'): Promise<TransitionResult>;
  
  // Register custom similarity function
  registerSimilarityFunction(name: string, functor: SimilarityFunctor, weight?: number): void;
  
  // Monitor convergence
  getConvergenceState(): Promise<ConvergenceState>;
}
```

#### Event System

```typescript
// Available events
'layoutProgress'    // { phase: string, progress: number, nodesProcessed: number, totalNodes: number }
'phaseComplete'     // { phase: string, duration: number, nodesPositioned: number }
'layoutComplete'    // { totalDuration: number, finalStability: number }
'convergenceUpdate' // { stability: number, positionDelta: number, iterations: number }
```

#### Configuration Interface

```typescript
interface LayoutConfig {
  similarityFunction: string;
  dimensionalMode: '2D' | '3D';
  convergenceThreshold?: number;
  maxIterations?: number;
  similarityWeights?: Record<string, number>;
  progressiveRefinement?: ProgressiveConfig;
  spatialConstraints?: SpatialConstraints;
  incrementalUpdate?: IncrementalConfig;
}
```

#### Result Types

```typescript
interface LayoutResult {
  nodes: PositionedNode[];           // Nodes with position coordinates
  convergenceState: ConvergenceState; // Final convergence information
  clusterAssignments?: ClusterData;   // Optional clustering information
  performanceMetrics: PerformanceData; // Timing and optimization data
}

interface PositionedNode extends Node {
  position: {
    x: number;
    y: number;
    z?: number; // Present in 3D mode
  };
  clusterId?: string;
  stabilityScore?: number;
}
```

---

**Next Steps**: Explore the [complete API documentation](./contracts/api-interfaces.md) or review [configuration schemas](./contracts/configuration-schemas.md) for advanced usage patterns.