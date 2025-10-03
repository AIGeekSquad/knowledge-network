# @aigeeksquad/knowledge-network

A modern TypeScript library extending d3.js for creating interactive knowledge graph visualizations.

## Features

- 🎨 **d3-idiomatic API** - Accessor functions for properties (constant, accessor, or function)
- 🔄 **Collision detection** - Automatic node overlap prevention
- 🧲 **Similarity-based clustering** - Vector similarity for intelligent node grouping
- 🔗 **Ontology-aware links** - Relationship types influence force layout
- 🌊 **Edge bundling** - Force-directed edge bundling for cleaner visualizations with curved, organic-looking edges
- 📐 **2D and 3D support** - Layout calculations in multiple dimensions
- 📦 Modern ESM/CJS module support
- 🔧 TypeScript support with full type definitions
- 🎯 Advanced force-directed layout engine
- 🖱️ Interactive features (zoom, drag, pan)
- 📱 Responsive and lightweight

## Installation

```bash
npm install @aigeeksquad/knowledge-network d3
```

or with pnpm:

```bash
pnpm add @aigeeksquad/knowledge-network d3
```

## Visual Examples

### Edge Bundling Comparison

The library supports both simple straight edges and advanced force-directed edge bundling for cleaner, more organic visualizations.

#### Simple Edges (Straight Lines)
![Simple Edges Example](../../../screenshots/simple-edges.png)

#### Edge Bundling (Curved, Bundled Paths)
![Edge Bundling Example](../../../screenshots/edge-bundling.png)

Edge bundling groups related edges together, creating smooth curved paths that significantly reduce visual clutter in complex graphs.

## Usage

### Basic Example

```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

const container = document.getElementById('graph');

const data = {
  nodes: [
    { id: 'A', label: 'Node A', type: 'concept' },
    { id: 'B', label: 'Node B', type: 'entity' },
    { id: 'C', label: 'Node C', type: 'concept' },
  ],
  edges: [
    { source: 'A', target: 'B', type: 'is-a' },
    { source: 'B', target: 'C', type: 'related-to' },
  ],
};

const graph = new KnowledgeGraph(container, data);
graph.render();
```

### d3-Idiomatic Accessor Functions

```typescript
const graph = new KnowledgeGraph(container, data, {
  width: 1000,
  height: 600,
  
  // Constant value
  nodeRadius: 15,
  
  // Or accessor function from node data
  nodeRadius: (d) => d.type === 'concept' ? 20 : 10,
  
  // Style nodes by type
  nodeFill: (d) => d.type === 'concept' ? '#ff6b6b' : '#4ecdc4',
  
  // Collision detection with custom radius
  collisionRadius: (d) => (d.type === 'concept' ? 20 : 10) + 5,
  
  enableZoom: true,
  enableDrag: true,
});

graph.render();
```

### Similarity-Based Clustering

```typescript
const data = {
  nodes: [
    { id: 'A', label: 'AI', vector: [1.0, 0.8, 0.6] },
    { id: 'B', label: 'ML', vector: [0.9, 0.9, 0.7] },
    { id: 'C', label: 'Art', vector: [0.1, 0.2, 0.9] },
  ],
  edges: [],
};

const graph = new KnowledgeGraph(container, data, {
  // Attract similar nodes based on vector similarity
  similarityFunction: (a, b) => {
    if (!a.vector || !b.vector) return 0;
    // Cosine similarity calculation
    const dotProduct = a.vector.reduce((sum, val, i) => sum + val * b.vector[i], 0);
    const normA = Math.sqrt(a.vector.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.vector.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (normA * normB);
  },
});

graph.render();
```

### Ontology-Aware Link Forces

```typescript
const data = {
  nodes: [
    { id: 'A', label: 'Animal' },
    { id: 'B', label: 'Dog' },
    { id: 'C', label: 'Cat' },
  ],
  edges: [
    { source: 'A', target: 'B', type: 'is-a' },      // Strong hierarchical link
    { source: 'A', target: 'C', type: 'is-a' },
    { source: 'B', target: 'C', type: 'similar-to' }, // Weaker associative link
  ],
};

const graph = new KnowledgeGraph(container, data, {
  // Links automatically use ontology types:
  // 'is-a': 1.5, 'part-of': 1.2, 'related-to': 0.8, 'similar-to': 0.6
  
  // Or customize link strength by type
  linkStrength: (edge) => {
    if (edge.type === 'is-a') return 2.0;
    if (edge.type === 'part-of') return 1.5;
    return 1.0;
  },
  
  // Style links by type
  linkStroke: (d) => {
    const colors = {
      'is-a': '#e74c3c',
      'part-of': '#3498db',
      'related-to': '#95a5a6',
    };
    return colors[d.type] || '#999';
  },
});

graph.render();
```

### Edge Bundling

Enable force-directed edge bundling for cleaner, more organic-looking visualizations. Edge bundling groups related edges together, creating smooth curved paths that reduce visual clutter in complex graphs with many edges.

**Visual Comparison:**

See the [Visual Examples](#visual-examples) section above for a side-by-side comparison of simple edges vs. bundled edges.

**Basic Usage:**

```typescript
const graph = new KnowledgeGraph(container, data, {
  // Enable edge bundling
  edgeRenderer: 'bundled',
  
  // Wait for node layout to stabilize before rendering edges (recommended)
  waitForStable: true,
  stabilityThreshold: 0.005,
  
  // Configure edge bundling parameters
  edgeBundling: {
    subdivisions: 60,              // More control points = smoother curves
    compatibilityThreshold: 0.4,   // Lower = more aggressive bundling
    iterations: 120,                // More iterations = tighter bundles
    stepSize: 0.1,                 // Larger steps = more visible bundling
    stiffness: 0.05,               // Lower = more curvature allowed
  },
});

graph.render();
```

**Edge Renderer Options:**
- `'simple'` (default): Straight lines between nodes
- `'bundled'`: Force-directed edge bundling with curved paths

**Configuration Parameters:**

| Parameter | Default | Description | Tips |
|-----------|---------|-------------|------|
| `waitForStable` | `false` | Wait for simulation to stabilize before rendering edges | Set to `true` for bundling to ensure stable node positions |
| `stabilityThreshold` | `0.005` | Alpha value threshold for stability detection | Lower values = wait longer for more stable layout |
| `subdivisions` | `60` | Number of control points per edge | Higher values (40-60) create smoother curves but slower computation |
| `compatibilityThreshold` | `0.6` | How similar edges must be to bundle (0-1) | Lower values (0.3-0.5) = more aggressive bundling |
| `iterations` | `90` | Number of bundling iterations | More iterations (100-150) = tighter, more visible bundles |
| `stepSize` | `0.04` | Movement step size per iteration | Larger values (0.08-0.15) = more dramatic bundling effect |
| `stiffness` | `0.1` | Spring force toward straight line | Lower values (0.05-0.08) allow more curvature |

**Tips for Best Results:**
- Use graphs with multiple parallel edges or edges flowing in similar directions
- Lower `compatibilityThreshold` and `stiffness` for more dramatic bundling
- Increase `iterations` and `subdivisions` for smoother, tighter bundles
- Always set `waitForStable: true` to ensure bundling works on stable layouts

#### Custom Edge Compatibility

You can provide a custom compatibility function to control which edges bundle together based on edge properties and metadata:

```typescript
const graph = new KnowledgeGraph(container, data, {
  edgeRenderer: 'bundled',
  waitForStable: true,
  edgeBundling: {
    // Custom compatibility based on edge type
    compatibilityFunction: (edge1, edge2) => {
      // Only bundle edges of the same type
      if (edge1.type === edge2.type) return 1.0;
      
      // Don't bundle edges of different types
      return 0.0;
    },
  },
});
```

The custom compatibility function:
- Receives two edges as parameters
- Returns a number between 0 and 1 (0 = no bundling, 1 = maximum bundling)
- Result is multiplied with geometric compatibility (angle, scale, position, visibility)
- Can use any edge properties including `type`, `weight`, `metadata`, etc.
- Allows semantic bundling based on relationship ontology

**Example Use Cases:**
- Bundle only edges representing the same relationship type
- Use edge metadata to group related connections
- Apply different bundling strengths based on edge importance
- Prevent bundling between conflicting relationship types

### Using CDN

```html
<script type="module">
  import { KnowledgeGraph } from 'https://cdn.jsdelivr.net/npm/@aigeeksquad/knowledge-network/+esm';
  
  // Your code here
</script>
```

## API Reference

### `KnowledgeGraph`

Main class for creating knowledge graph visualizations.

#### Constructor

```typescript
new KnowledgeGraph(container: HTMLElement, data: GraphData, config?: GraphConfig)
```

#### Methods

- `render()`: Render the graph visualization
- `updateData(data: GraphData)`: Update the graph with new data
- `destroy()`: Clean up and remove the graph

### Types

```typescript
interface Node {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
  z?: number; // For 3D support
  vector?: number[]; // For similarity-based clustering
  metadata?: Record<string, unknown>;
}

interface Edge {
  id?: string;
  source: string | Node;
  target: string | Node;
  label?: string;
  type?: string; // Ontology type affects layout
  weight?: number;
  strength?: number; // Link strength for force calculations
  metadata?: Record<string, unknown>;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

// Accessor function type - can return value from datum, or be a constant
type Accessor<T, R> = R | ((d: T, i: number, nodes: T[]) => R);

// Similarity function for node clustering
type SimilarityFunction = (a: Node, b: Node) => number;

// Link strength function based on edge type
type LinkStrengthFunction = (edge: Edge, i: number, edges: Edge[]) => number;

interface GraphConfig {
  width?: number;
  height?: number;
  
  // Node styling - d3 idiomatic accessor pattern
  nodeRadius?: Accessor<Node, number>;
  nodeFill?: Accessor<Node, string>;
  nodeStroke?: Accessor<Node, string>;
  nodeStrokeWidth?: Accessor<Node, number>;
  
  // Link styling - d3 idiomatic accessor pattern
  linkDistance?: Accessor<Edge, number>;
  linkStrength?: LinkStrengthFunction;
  linkStroke?: Accessor<Edge, string>;
  linkStrokeWidth?: Accessor<Edge, number>;
  
  // Force simulation
  chargeStrength?: Accessor<Node, number>;
  similarityFunction?: SimilarityFunction; // For clustering based on similarity
  collisionRadius?: Accessor<Node, number>; // For collision detection
  
  // Interaction
  enableZoom?: boolean;
  enableDrag?: boolean;
  
  // Dimensionality
  dimensions?: 2 | 3; // Support 2D and 3D layouts
}
```

## Development

See the [examples package](../examples) for interactive demonstrations.

## License

MIT © AIGeekSquad
