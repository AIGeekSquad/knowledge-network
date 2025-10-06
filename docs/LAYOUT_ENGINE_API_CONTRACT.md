# Knowledge Network Layout Engine API Contract

Version: 1.0.0
Status: Current Implementation
Last Updated: 2025-01-06

## 1. Overview

This document defines the complete API contract for the Knowledge Network Layout Engine as implemented in the `KnowledgeGraph` TypeScript class. The API follows object-oriented patterns with TypeScript type safety and D3.js integration.

## 2. Class Constructor

### 2.1 KnowledgeGraph Constructor

```typescript
class KnowledgeGraph {
  constructor(
    container: HTMLElement,
    data: GraphData,
    config: GraphConfig = {}
  )
}
```

**Parameters**:
- `container` (HTMLElement) - The HTML element that will contain the SVG visualization
- `data` (GraphData) - The graph data containing nodes and edges to visualize
- `config` (GraphConfig, optional) - Configuration object with default values

**Example Usage**:
```typescript
const container = document.getElementById('graph-container') as HTMLElement;
const data: GraphData = {
  nodes: [
    { id: 'node1', label: 'Node 1' },
    { id: 'node2', label: 'Node 2' }
  ],
  edges: [
    { source: 'node1', target: 'node2' }
  ]
};

const graph = new KnowledgeGraph(container, data, {
  width: 800,
  height: 600,
  nodeRadius: 10,
  enableZoom: true
});
```

## 3. GraphConfig Interface (Complete TypeScript Definition)

Configuration is passed to the constructor and includes all styling and behavior options:

```typescript
interface GraphConfig {
  // Dimensions
  width?: number;                    // Default: 800
  height?: number;                   // Default: 600

  // Node styling (using Accessor pattern)
  nodeRadius?: Accessor<Node, number>;        // Default: 10
  nodeFill?: Accessor<Node, string>;          // Default: '#69b3a2'
  nodeStroke?: Accessor<Node, string>;        // Default: '#fff'
  nodeStrokeWidth?: Accessor<Node, number>;   // Default: 1.5

  // Edge styling
  linkDistance?: Accessor<Edge, number>;      // Default: 100
  linkStrength?: LinkStrengthFunction;        // Auto-generated if not provided
  linkStroke?: Accessor<Edge, string>;        // Default: '#999'
  linkStrokeWidth?: Accessor<Edge, number>;   // Default: 1.5

  // Force simulation
  chargeStrength?: Accessor<Node, number>;    // Default: -300
  collisionRadius?: Accessor<Node, number>;   // Default: nodeRadius + 2
  similarityFunction?: SimilarityFunction;    // Optional clustering

  // Edge rendering
  edgeRenderer?: 'simple' | 'bundled';       // Default: 'simple'
  edgeBundling?: EdgeBundlingConfig;          // Configuration for bundled edges

  // Simulation behavior
  waitForStable?: boolean;           // Default: false
  stabilityThreshold?: number;       // Default: 0.01

  // Edge labels
  showEdgeLabels?: boolean;          // Default: false
  edgeLabelStyle?: EdgeLabelStyle;   // Styling for edge labels

  // Interaction
  enableZoom?: boolean;              // Default: true
  enableDrag?: boolean;              // Default: true
  zoomExtent?: [number, number];     // Default: [0.1, 10]
  fitToViewport?: boolean;           // Default: false
  padding?: number;                  // Default: 20

  // Dimensionality
  dimensions?: 2 | 3;                // Default: 2

  // Callbacks
  onEdgesRendered?: () => void;      // Called when edges finish rendering
}
```

### 3.1 Accessor Type Pattern

The flexible accessor pattern allows both constants and functions:

```typescript
type Accessor<T, R> = R | ((d: T, i: number, nodes: T[]) => R);

// Examples of usage
const config: GraphConfig = {
  // Constant value
  nodeRadius: 15,

  // Function based on data
  nodeFill: (node: Node) => {
    return node.type === 'important' ? '#ff6b6b' : '#4ecdc4';
  },

  // Using index and array
  linkDistance: (edge: Edge, i: number, edges: Edge[]) => {
    return edge.weight ? edge.weight * 50 : 100;
  }
};
```

## 4. Public Methods

### 4.1 `render(): void`
Renders the knowledge graph visualization in the container element.

- **Returns**: void
- **Effect**: Creates SVG, force simulation, nodes, edges, and interaction handlers
- **Triggers**: Complete rendering pipeline including stabilization and edge rendering

```typescript
const graph = new KnowledgeGraph(container, data, config);
graph.render();  // Must be called to display the visualization
```

### 4.2 `updateData(data: GraphData): void`
Updates the graph with new data and re-renders the visualization.

- **Parameters**: `data` (GraphData) - New graph data
- **Returns**: void
- **Effect**: Destroys existing visualization and creates new one with updated data

```typescript
const newData: GraphData = {
  nodes: [/* new nodes */],
  edges: [/* new edges */]
};
graph.updateData(newData);
```

### 4.3 `getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null`
Gets the D3 force simulation instance for advanced customization.

- **Returns**: D3 simulation instance or null if not rendered
- **Use case**: Direct manipulation of forces, alpha values, or simulation events

```typescript
const simulation = graph.getSimulation();
if (simulation) {
  // Adjust force strength
  simulation.force('charge', d3.forceManyBody().strength(-1000));
  // Restart with higher alpha
  simulation.alpha(0.5).restart();
}
```

### 4.4 `destroy(): void`
Destroys the graph visualization and cleans up all resources.

- **Returns**: void
- **Effect**: Stops simulation, removes SVG, cleans up edge renderer resources

```typescript
graph.destroy();  // Call when graph is no longer needed
```

## 5. TypeScript Data Types (Complete Interfaces)

### 5.1 Core Data Structures

```typescript
interface Node {
  id: string;                       // Required: unique identifier
  label?: string;                   // Optional: display label
  type?: string;                    // Optional: node type for styling
  x?: number; y?: number; z?: number; // Optional: coordinates
  vector?: number[];                // Optional: vector embedding for similarity
  metadata?: Record<string, unknown>; // Optional: arbitrary metadata
}

interface Edge {
  id?: string;                      // Optional: unique identifier
  source: string | Node;            // Required: source node ID or object
  target: string | Node;            // Required: target node ID or object
  label?: string;                   // Optional: edge label
  type?: string;                    // Optional: edge type
  weight?: number;                  // Optional: edge weight (0-1)
  strength?: number;                // Optional: force strength override
  metadata?: Record<string, unknown>; // Optional: arbitrary metadata
}

interface GraphData {
  nodes: Node[];                    // Array of all nodes
  edges: Edge[];                    // Array of all edges
}
```

### 5.2 Function Types

```typescript
// Accessor pattern - can be constant or function
type Accessor<T, R> = R | ((d: T, i: number, nodes: T[]) => R);

// Similarity function for node clustering
type SimilarityFunction = (a: Node, b: Node) => number;

// Link strength function for force simulation
type LinkStrengthFunction = (edge: Edge, i: number, edges: Edge[]) => number;
```

### 5.3 Edge Bundling Configuration

```typescript
interface EdgeBundlingConfig {
  subdivisions?: number;                    // Default: 20
  adaptiveSubdivision?: boolean;           // Default: true
  compatibilityThreshold?: number;         // Default: 0.6
  iterations?: number;                     // Default: 90
  stepSize?: number;                       // Default: 0.04
  stiffness?: number;                      // Default: 0.1
  momentum?: number;                       // Default: 0.5
  curveType?: 'basis' | 'cardinal' | 'catmullRom' | 'bundle'; // Default: 'basis'
  curveTension?: number;                   // Default: 0.85
  smoothingType?: 'laplacian' | 'gaussian' | 'bilateral'; // Default: 'laplacian'
  smoothingIterations?: number;            // Default: 2
  smoothingFrequency?: number;             // Default: 5
  compatibilityFunction?: (edge1: Edge, edge2: Edge) => number;
}
```

## 6. Current Callback System

### 6.1 Existing Callback Support

The current implementation supports a simple callback system through configuration:

```typescript
interface GraphConfig {
  onEdgesRendered?: () => void;  // Called when edges complete rendering
}

// Usage
const graph = new KnowledgeGraph(container, data, {
  onEdgesRendered: () => {
    console.log('All edges have been rendered');
    hideLoadingSpinner();
  }
});
```

## 7. Enhanced Callback System for Demo Requirements

### 7.1 Proposed Enhanced GraphConfig

To support the 5-stage loading demo and advanced interactions, the following callbacks would be added:

```typescript
interface GraphConfig {
  // State management callbacks
  onStateChange?: (state: LayoutEngineState, progress: number) => void;
  onLayoutProgress?: (alpha: number, stability: number) => void;

  // Edge rendering callbacks (5-stage loading)
  onEdgeRenderingStart?: (totalEdges: number) => void;
  onEdgeRenderingProgress?: (rendered: number, total: number) => void;
  onEdgeRenderingComplete?: () => void;

  // Selection callbacks
  onNodeSelection?: (nodeId: string, neighbors: Node[], edges: Edge[]) => void;

  // Error handling
  onError?: (error: Error, stage: string, recoverable: boolean) => void;

  // Existing callback
  onEdgesRendered?: () => void;
}
```

### 7.2 Layout Engine States

```typescript
enum LayoutEngineState {
  INITIAL = 'INITIAL',
  LOADING = 'LOADING',
  LAYOUT_CALCULATING = 'LAYOUT_CALCULATING',
  EDGES_RENDERING = 'EDGES_RENDERING',
  READY = 'READY',
  ERROR = 'ERROR'
}
```

### 7.3 Example Usage with Enhanced Callbacks

```typescript
const graph = new KnowledgeGraph(container, data, {
  width: 800,
  height: 600,
  enableZoom: true,
  enableDrag: true,
  edgeRenderer: 'bundled',
  waitForStable: true,

  // State tracking
  onStateChange: (state, progress) => {
    updateStatusDisplay(`State: ${state} (${progress}%)`);
  },

  // Layout progress
  onLayoutProgress: (alpha, stability) => {
    updateProgressBar(Math.round((1 - alpha) * 100));
  },

  // Edge rendering (5-stage loading)
  onEdgeRenderingStart: (totalEdges) => {
    showProgressBar(`Rendering ${totalEdges} edges...`);
  },

  onEdgeRenderingProgress: (rendered, total) => {
    const percent = Math.round((rendered / total) * 100);
    updateProgressBar(`Edges: ${rendered}/${total} (${percent}%)`);
  },

  onEdgeRenderingComplete: () => {
    hideProgressBar();
    showZoomControls();
  },

  // Node selection
  onNodeSelection: (nodeId, neighbors, edges) => {
    highlightNeighbors(neighbors);
    showNodeDetails(nodeId, neighbors.length);
  },

  // Error handling
  onError: (error, stage, recoverable) => {
    console.error(`Error in ${stage}:`, error);
    if (recoverable) {
      showRetryButton();
    } else {
      showErrorMessage(error.message);
    }
  }
});
```

## 8. Complete Usage Example

### 8.1 Basic Usage

```typescript
import { KnowledgeGraph } from './KnowledgeGraph';
import type { GraphData, GraphConfig } from './types';

// Prepare data
const data: GraphData = {
  nodes: [
    { id: 'node1', label: 'Machine Learning', type: 'concept' },
    { id: 'node2', label: 'Neural Networks', type: 'concept' },
    { id: 'node3', label: 'Deep Learning', type: 'concept' }
  ],
  edges: [
    { source: 'node1', target: 'node2', type: 'relates-to' },
    { source: 'node2', target: 'node3', type: 'part-of' }
  ]
};

// Configuration
const config: GraphConfig = {
  width: 1200,
  height: 800,
  nodeRadius: (node) => node.type === 'concept' ? 15 : 10,
  nodeFill: (node) => node.type === 'concept' ? '#ff6b6b' : '#4ecdc4',
  linkDistance: 100,
  chargeStrength: -500,
  edgeRenderer: 'bundled',
  enableZoom: true,
  enableDrag: true,
  waitForStable: true,
  onEdgesRendered: () => console.log('Rendering complete')
};

// Create and render
const container = document.getElementById('graph-container') as HTMLElement;
const graph = new KnowledgeGraph(container, data, config);
graph.render();
```

### 8.2 Advanced Usage with Enhanced Callbacks (Future)

```typescript
// With enhanced callback system for demo requirements
const graph = new KnowledgeGraph(container, data, {
  width: 1200,
  height: 800,
  edgeRenderer: 'bundled',
  waitForStable: true,

  // 5-stage loading callbacks
  onStateChange: (state, progress) => {
    console.log(`State: ${state}, Progress: ${progress}%`);
  },

  onLayoutProgress: (alpha, stability) => {
    document.getElementById('progress')!.textContent =
      `Layout: ${Math.round((1 - alpha) * 100)}%`;
  },

  onEdgeRenderingStart: (totalEdges) => {
    console.log(`Starting to render ${totalEdges} edges`);
  },

  onEdgeRenderingProgress: (rendered, total) => {
    document.getElementById('progress')!.textContent =
      `Edges: ${rendered}/${total}`;
  },

  onEdgeRenderingComplete: () => {
    document.getElementById('progress')!.textContent = 'Complete!';
  },

  // Node selection for highlighting
  onNodeSelection: (nodeId, neighbors, edges) => {
    console.log(`Selected ${nodeId} with ${neighbors.length} neighbors`);
    highlightConnections(neighbors, edges);
  },

  // Error handling
  onError: (error, stage, recoverable) => {
    console.error(`Error in ${stage}:`, error);
    if (!recoverable) {
      showErrorDialog(error.message);
    }
  }
});

graph.render();
```

## 9. Integration with D3.js

### 9.1 Accessing D3 Simulation

```typescript
// Get direct access to D3 simulation for advanced control
const simulation = graph.getSimulation();
if (simulation) {
  // Modify forces
  simulation.force('charge', d3.forceManyBody().strength(-1000));

  // Add custom forces
  simulation.force('custom', (alpha) => {
    // Custom force implementation
  });

  // Control simulation
  simulation.alpha(0.5).restart();
}
```

### 9.2 Working with Existing D3 Code

```typescript
// The KnowledgeGraph class integrates well with existing D3 workflows
const graph = new KnowledgeGraph(container, data, config);
graph.render();

// Access the SVG for additional D3 manipulations
const svg = d3.select(container).select('svg');
svg.append('g').attr('class', 'custom-overlay');
```

## 10. TypeScript Integration

### 10.1 Full Type Safety

```typescript
// All interfaces are exported for full type safety
import type {
  GraphData,
  GraphConfig,
  Node,
  Edge,
  Accessor,
  SimilarityFunction,
  LinkStrengthFunction
} from './types';

// Type-safe configuration
const config: GraphConfig = {
  nodeRadius: (node: Node): number => {
    return node.metadata?.importance as number * 10 || 10;
  },

  similarityFunction: (a: Node, b: Node): number => {
    if (a.type === b.type) return 0.8;
    return 0.2;
  }
};
```

### 10.2 Generic Constraints

```typescript
// The Accessor type provides flexible typing
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
const config: GraphConfig = {
  nodeFill: (node: Node) => colorScale(node.type || 'default'),
  linkStroke: (edge: Edge) => edge.type === 'important' ? '#red' : '#gray'
};
```

This API contract reflects the current implementation while providing a clear path for the minimal enhancements needed to support advanced demo requirements.
