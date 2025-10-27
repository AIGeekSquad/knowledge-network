# @aigeeksquad/knowledge-network

**Complete API Reference and Usage Guide**

A modern TypeScript library extending d3.js for creating interactive knowledge graph visualizations with advanced edge bundling, similarity-based clustering, and ontology-aware relationships.

---

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core API](#core-api)
- [Configuration Reference](#configuration-reference)
- [Data Structures](#data-structures)
- [Advanced Patterns](#advanced-patterns)
- [Performance Optimization](#performance-optimization)
- [TypeScript Integration](#typescript-integration)
- [Related Guides](#related-guides)

---

## Installation

```bash
npm install @aigeeksquad/knowledge-network d3
```

**TypeScript users**: Type definitions included, no additional `@types` packages needed.

**CDN usage**:
```html
<script type="module">
  import { KnowledgeGraph } from 'https://cdn.jsdelivr.net/npm/@aigeeksquad/knowledge-network/+esm';
</script>
```

---

## Quick Start

### Basic Graph in 30 Seconds

```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

// 1. Create your data
const data = {
  nodes: [
    { id: 'A', label: 'Node A', type: 'concept' },
    { id: 'B', label: 'Node B', type: 'entity' },
    { id: 'C', label: 'Node C', type: 'concept' }
  ],
  edges: [
    { source: 'A', target: 'B', type: 'is-a' },
    { source: 'B', target: 'C', type: 'related-to' }
  ]
};

// 2. Create and render
const container = document.getElementById('graph');
const graph = new KnowledgeGraph(container, data);
graph.render();
```

### With Edge Bundling

```typescript
const graph = new KnowledgeGraph(container, data, {
  edgeRenderer: 'bundled',      // Enable edge bundling
  waitForStable: true,          // Wait for layout stability
  edgeBundling: {
    iterations: 120,            // Smooth, flowing edges
    compatibilityThreshold: 0.4 // More aggressive bundling
  }
});
```

---

## Core API

### KnowledgeGraph Class

The main class for creating and managing interactive knowledge graph visualizations.

#### Constructor

```typescript
new KnowledgeGraph(
  container: HTMLElement,    // DOM element to render into
  data: GraphData,          // Graph data (nodes and edges)
  config?: GraphConfig      // Optional configuration
)
```

**Parameters:**
- **`container`** - HTML element that will contain the visualization
- **`data`** - Graph data structure with nodes and edges
- **`config`** - Optional configuration object (see [Configuration Reference](#configuration-reference))

#### Core Methods

```typescript
// Render the graph visualization
graph.render(): Promise<void>

// Update graph with new data
graph.updateData(data: GraphData): Promise<void>

// Clean up and remove graph
graph.destroy(): void
```

#### Selection and Interaction

```typescript
// Select a node and highlight neighbors
graph.selectNode(nodeId: string): void

// Clear current selection
graph.clearSelection(): void

// Get currently selected node
graph.getSelectedNodeId(): string | null

// Get neighbor nodes for a given node
graph.getNeighbors(nodeId: string): string[]
```

#### Advanced Access

```typescript
// Access D3 simulation for advanced customization
graph.getSimulation(): d3.Simulation | null

// Disable animations (for testing or performance)
graph.disableAnimations(): void
```

---

## Configuration Reference

### GraphConfig Interface

Complete configuration options following d3.js accessor patterns.

#### Container and Layout

```typescript
interface GraphConfig {
  // Dimensions
  width?: number;           // Default: 800
  height?: number;          // Default: 600

  // Layout engine
  dimensions?: 2 | 3;       // Default: 2 (2D layout)

  // Simulation stability
  waitForStable?: boolean;         // Default: false
  stabilityThreshold?: number;     // Default: 0.001
}
```

#### Node Configuration

All node properties support **d3-style accessors** - either constant values or functions.

```typescript
// Node visual styling
nodeRadius?: Accessor<Node, number>;           // Default: 10
nodeFill?: Accessor<Node, string>;             // Default: '#69b3a2'
nodeStroke?: Accessor<Node, string>;           // Default: '#fff'
nodeStrokeWidth?: Accessor<Node, number>;      // Default: 1.5

// Force simulation properties
chargeStrength?: Accessor<Node, number>;       // Default: -300
collisionRadius?: Accessor<Node, number>;      // Default: nodeRadius + 2

// Clustering
similarityFunction?: SimilarityFunction;       // Optional
similarityThreshold?: number;                  // Default: 0.5
```

**Accessor Pattern Examples:**
```typescript
// Constant values
nodeRadius: 15,
nodeFill: '#ff6b6b',

// Data-driven functions
nodeRadius: (node) => node.type === 'concept' ? 15 : 8,
nodeFill: (node) => node.metadata?.color || '#69b3a2',
chargeStrength: (node) => node.metadata?.importance ? -500 : -200
```

#### Edge Configuration

```typescript
// Edge visual styling
linkStroke?: Accessor<Edge, string>;           // Default: '#999'
linkStrokeWidth?: Accessor<Edge, number>;      // Default: 1.5
linkDistance?: Accessor<Edge, number>;         // Default: 100

// Force simulation properties
linkStrength?: LinkStrengthFunction;           // Default: 1.0

// Edge rendering
edgeRenderer?: 'simple' | 'bundled';          // Default: 'simple'
edgeBundling?: EdgeBundlingConfig;            // Edge bundling settings
```

#### Interaction Configuration

```typescript
// User interaction controls
enableZoom?: boolean;          // Default: true
enableDrag?: boolean;          // Default: true
zoomExtent?: [number, number]; // Default: [0.1, 10]
fitToViewport?: boolean;       // Default: false
padding?: number;              // Default: 20 (when fitting to viewport)
```

#### Callback Configuration

```typescript
// Progress and state callbacks
onStateChange?: (state: LayoutEngineState, progress: number) => void;
onLayoutProgress?: (alpha: number, progress: number) => void;
onEdgeRenderingProgress?: (rendered: number, total: number) => void;
onEdgesRendered?: () => void;

// Interaction callbacks
onNodeSelected?: (nodeId: string, neighbors: string[], edges: string[]) => void;
onError?: (error: Error, stage: string) => void;
```

---

## Data Structures

### Node Interface

```typescript
interface Node {
  id: string;                        // Required: Unique identifier
  label?: string;                    // Optional: Display label
  type?: string;                     // Optional: Node type for styling/grouping

  // Positioning (managed by simulation)
  x?: number;                        // X coordinate
  y?: number;                        // Y coordinate
  z?: number;                        // Z coordinate (3D only)

  // Advanced features
  vector?: number[];                 // Embedding for similarity clustering
  metadata?: Record<string, unknown>; // Custom properties
}
```

**Examples:**
```typescript
// Basic node
{ id: 'concept-1', label: 'Machine Learning' }

// Node with type for styling
{ id: 'concept-1', label: 'ML', type: 'primary' }

// Node with vector for clustering
{
  id: 'concept-1',
  label: 'ML',
  vector: [0.8, 0.2, 0.5],
  metadata: { importance: 0.9 }
}

// Node with fixed position
{ id: 'center', label: 'Core', x: 400, y: 300 }
```

### Edge Interface

```typescript
interface Edge {
  source: string | Node;             // Source node (ID or object)
  target: string | Node;             // Target node (ID or object)

  id?: string;                       // Optional: Unique identifier
  label?: string;                    // Optional: Display label
  type?: string;                     // Optional: Edge type (affects layout)

  // Advanced properties
  weight?: number;                   // Edge importance/strength
  strength?: number;                 // Force simulation strength
  metadata?: Record<string, unknown>; // Custom properties
}
```

**Examples:**
```typescript
// Basic edge
{ source: 'A', target: 'B' }

// Typed edge with weight
{
  source: 'A',
  target: 'B',
  type: 'dependency',
  weight: 0.8
}

// Edge with custom strength and metadata
{
  source: 'parent',
  target: 'child',
  type: 'hierarchy',
  strength: 2.0,
  metadata: { bidirectional: false }
}
```

### GraphData Interface

```typescript
interface GraphData {
  nodes: Node[];    // Array of all nodes
  edges: Edge[];    // Array of all edges
}
```

**Validation Requirements:**
- All nodes must have unique `id` values
- All edge `source`/`target` references must point to existing node `id` values
- Circular references are allowed and handled correctly

---

## Advanced Patterns

### 1. Similarity-Based Clustering

Create attraction forces between similar nodes using vector embeddings or custom similarity functions.

```typescript
const data = {
  nodes: [
    { id: 'AI', label: 'Artificial Intelligence', vector: [1.0, 0.8, 0.6] },
    { id: 'ML', label: 'Machine Learning', vector: [0.9, 0.9, 0.7] },
    { id: 'Art', label: 'Digital Art', vector: [0.1, 0.2, 0.9] }
  ],
  edges: []
};

const graph = new KnowledgeGraph(container, data, {
  // Attract similar nodes using cosine similarity
  similarityFunction: (a, b) => {
    if (!a.vector || !b.vector) return 0;

    const dotProduct = a.vector.reduce((sum, val, i) => sum + val * b.vector[i], 0);
    const normA = Math.sqrt(a.vector.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.vector.reduce((sum, val) => sum + val * val, 0));

    return dotProduct / (normA * normB);
  },
  similarityThreshold: 0.7  // Only cluster highly similar nodes
});
```

### 2. Ontology-Aware Link Forces

Configure link strength based on relationship types to create semantic layouts.

```typescript
const graph = new KnowledgeGraph(container, data, {
  // Stronger forces for hierarchical relationships
  linkStrength: (edge) => {
    switch (edge.type) {
      case 'is-a':       return 2.0;  // Strong hierarchical
      case 'part-of':    return 1.5;  // Medium structural
      case 'related-to': return 0.8;  // Weak associative
      case 'similar-to': return 0.6;  // Weak similarity
      default:           return 1.0;
    }
  },

  // Visual styling by relationship type
  linkStroke: (edge) => ({
    'is-a': '#e74c3c',      // Red for hierarchy
    'part-of': '#3498db',   // Blue for structure
    'related-to': '#95a5a6' // Gray for association
  }[edge.type] || '#999')
});
```

### 3. Advanced Edge Bundling

Configure edge bundling for complex visualizations with many connections.

#### Basic Edge Bundling

```typescript
const graph = new KnowledgeGraph(container, data, {
  edgeRenderer: 'bundled',
  waitForStable: true,        // Critical for good bundling
  edgeBundling: {
    subdivisions: 60,         // Smooth curves (20-60)
    iterations: 120,          // Tight bundles (90-150)
    compatibilityThreshold: 0.4, // Aggressive bundling (0.2-0.6)
    stepSize: 0.08,          // Visible bundling (0.04-0.15)
    stiffness: 0.05          // More curvature (0.05-0.2)
  }
});
```

#### Custom Edge Compatibility

```typescript
const graph = new KnowledgeGraph(container, data, {
  edgeRenderer: 'bundled',
  edgeBundling: {
    // Custom bundling rules based on edge properties
    compatibilityFunction: (edge1, edge2) => {
      // Bundle edges of same type only
      if (edge1.type === edge2.type) return 1.0;

      // Partial bundling for related types
      if (edge1.type === 'is-a' && edge2.type === 'part-of') return 0.6;

      // No bundling for conflicting types
      return 0.0;
    }
  }
});
```

### 4. Dynamic Data Updates

```typescript
// Initialize graph
const graph = new KnowledgeGraph(container, initialData);
graph.render();

// Update with new data (efficient - reuses components)
const newData = {
  nodes: [...existingNodes, newNode],
  edges: [...existingEdges, newEdge]
};
graph.updateData(newData);

// Clean up when done
graph.destroy();
```

### 5. Progress Tracking and State Management

```typescript
const graph = new KnowledgeGraph(container, data, {
  onStateChange: (state, progress) => {
    console.log(`State: ${state}, Progress: ${progress}%`);

    switch (state) {
      case 'loading':
        showLoadingSpinner();
        break;
      case 'layout_calculating':
        updateProgressBar(progress);
        break;
      case 'ready':
        hideLoadingIndicators();
        break;
      case 'error':
        showErrorMessage('Failed to render graph');
        break;
    }
  },

  onNodeSelected: (nodeId, neighbors, edges) => {
    highlightRelatedContent(nodeId, neighbors);
    showNodeDetails(nodeId);
  }
});
```

---

## Performance Optimization

### Graph Size Guidelines

| Nodes | Edges | Recommended Configuration |
|-------|-------|---------------------------|
| < 100 | < 200 | All features enabled, bundling optional |
| 100-1000 | 200-2000 | Edge bundling recommended, standard settings |
| 1000-5000 | 2000-10000 | Reduce bundling iterations, fixed styling |
| 5000+ | 10000+ | Simple edges, minimal styling, consider clustering |

### Large Graph Optimizations

```typescript
// For graphs with 1000+ nodes
const largeGraphConfig: GraphConfig = {
  // Performance rendering
  edgeRenderer: 'simple',     // Skip bundling for very large graphs

  // Fixed styling (faster than functions)
  nodeRadius: 5,
  nodeFill: '#4ecdc4',
  nodeStroke: '#fff',

  // Optimized forces
  chargeStrength: -50,        // Weaker repulsion
  linkDistance: 20,           // Shorter edges

  // Reduced interaction
  enableDrag: false,          // Disable dragging for performance

  // Stability settings
  stabilityThreshold: 0.01    // Less precise stability for speed
};
```

### Memory Management

```typescript
// Always clean up when components unmount
useEffect(() => {
  const graph = new KnowledgeGraph(container, data);
  graph.render();

  return () => {
    graph.destroy();  // Critical: prevents memory leaks
  };
}, []);

// Efficient updates (reuse components)
graph.updateData(newData);  // Better than creating new instances
```

**📖 Complete performance guidance**: [Performance Guide](../../docs/PERFORMANCE_GUIDE.md)

---

## TypeScript Integration

### Full Type Safety

```typescript
import {
  KnowledgeGraph,
  GraphData,
  GraphConfig,
  Node,
  Edge,
  LayoutEngineState
} from '@aigeeksquad/knowledge-network';

// Strongly typed data
const data: GraphData = {
  nodes: [
    { id: 'n1', label: 'Node 1', type: 'concept' }
  ],
  edges: [
    { source: 'n1', target: 'n2', type: 'relationship' }
  ]
};

// Type-safe configuration
const config: GraphConfig = {
  nodeRadius: (node: Node) => node.type === 'concept' ? 12 : 8,
  onStateChange: (state: LayoutEngineState, progress: number) => {
    // Full IntelliSense support
  }
};
```

### Custom Interfaces

Extend base types for domain-specific requirements:

```typescript
// Custom node with domain properties
interface ConceptNode extends Node {
  category: 'technology' | 'process' | 'tool';
  relevance: number;
  tags: string[];
}

// Custom edge with relationship metadata
interface RelationshipEdge extends Edge {
  relationshipType: 'dependency' | 'similarity' | 'hierarchy';
  confidence: number;
  bidirectional: boolean;
}

// Use with graph
const domainData: GraphData = {
  nodes: conceptNodes as Node[],
  edges: relationshipEdges as Edge[]
};
```

---

## Related Guides

### Interactive Exploration Platform

Experience the API capabilities through hands-on interactive exploration and benchmarking:

- **[🚀 Complete Demo Suite](../demo-suite/README.md)** - Interactive platform with mode switching and benchmarking tools
- **[🎮 Mode Switching Demo](../demo-suite/)** - Live comparison of SVG, Canvas, WebGL rendering with performance metrics
- **[📊 Layout Algorithm Explorer](../demo-suite/)** - Interactive comparison of force-directed, circular, grid, hierarchical layouts
- **[📚 Rich Dataset Library](../demo-suite/src/components/data/)** - Computer science, research, biology, literature knowledge graphs

### Essential Reading

- **[📊 Edge Bundling Guide](../../docs/EDGE_BUNDLING.md)** - Complete guide to edge bundling techniques
- **[⚡ Performance Guide](../../docs/PERFORMANCE_GUIDE.md)** - Optimization strategies for large datasets
- **[🔧 Integration Guide](../../docs/INTEGRATION_GUIDE.md)** - React, Vue, Angular integration patterns

### Reference Documentation

- **[❓ Troubleshooting](../../docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[🔄 Migration Guide](../../docs/MIGRATION_GUIDE.md)** - Version upgrade guidance
- **[📊 Research Documentation](../../docs/EDGE_BUNDLING_RESEARCH.md)** - Academic foundations and theory

### Competitive Analysis

- **[🏆 Competitive Showcase](../../docs/COMPETITIVE_SHOWCASE.md)** - Quantified advantages vs D3.js, Cytoscape.js, vis.js
- **[🎯 Demo Development Guide](../../docs/DEMO_DEVELOPMENT_GUIDE.md)** - Creating new demonstration modules

---

## Development

**Building from source**: See the [main project README](../../README.md#development) for development setup and build instructions.

**Contributing**: See [Contributing Guide](../../CONTRIBUTING.md) for contribution guidelines and development workflow.

---

## License

MIT © AIGeekSquad