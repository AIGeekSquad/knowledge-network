# Knowledge Network Layout Engine Specification

Version: 1.0.0
Status: Implementation Complete
Last Updated: 2025-01-06

## 1. Executive Summary

The Knowledge Network Layout Engine is implemented as the `KnowledgeGraph` TypeScript class, providing a D3.js-based graph visualization system for knowledge graphs. It follows D3.js idiomatic patterns with TypeScript type safety, emphasizing simplicity, performance, and rich interactive capabilities.

## 2. Current Implementation Architecture

### 2.1 Design Principles

- **TypeScript First**: Complete type safety with comprehensive interfaces
- **D3.js Idiomatic**: Pure D3 patterns with modern ES6+ features
- **Callback-Driven**: Event system using simple callbacks rather than complex state machines
- **Edge Renderer Abstraction**: Pluggable rendering system (SimpleEdge, EdgeBundling)
- **Progressive Enhancement**: Core features working, advanced features optional

### 2.2 System Components

```
┌─────────────────────────────────────────────────┐
│           KnowledgeGraph Class                   │
├─────────────────────────────────────────────────┤
│  D3 Simulation │  Edge Renderer │  SVG Controls  │
├─────────────────────────────────────────────────┤
│         Configuration & Callbacks               │
├─────────────────────────────────────────────────┤
│              D3.js + TypeScript                  │
└─────────────────────────────────────────────────┘
```

### 2.3 File Structure (Current)

```
packages/knowledge-network/src/
├── KnowledgeGraph.ts     # Main class implementation
├── types.ts              # TypeScript type definitions
└── edges/
    ├── index.ts          # Edge renderer exports
    ├── SimpleEdge.ts     # Basic line rendering
    └── EdgeBundling.ts   # Hierarchical edge bundling
```

## 3. Current Implementation Details

### 3.1 KnowledgeGraph Class Structure

The main class follows a straightforward instantiation and configuration pattern:

```typescript
export class KnowledgeGraph {
  private container: HTMLElement;
  private data: GraphData;
  private config: GraphConfig;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;
  private edgeRenderer: EdgeRenderer;
  private edgeRenderResult: EdgeRenderResult | null = null;
  private linkGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

  constructor(container: HTMLElement, data: GraphData, config: GraphConfig = {})
  render(): void
  updateData(data: GraphData): void
  getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null
  destroy(): void
}
```

### 3.2 Lifecycle Management

Instead of a complex state machine, the implementation uses a simple lifecycle:

1. **Construction**: `new KnowledgeGraph(container, data, config)`
2. **Rendering**: `.render()` creates SVG, simulation, and visual elements
3. **Updates**: `.updateData(newData)` destroys and re-renders
4. **Cleanup**: `.destroy()` stops simulation and removes DOM elements

### 3.3 Callback System

The implementation uses callback functions in configuration for lifecycle events:

```typescript
interface GraphConfig {
  onEdgesRendered?: () => void;  // Called when edges complete rendering
  // ... other config options
}
```

This provides a simpler alternative to complex event systems while maintaining observability.

## 4. D3.js Integration Details

### 4.1 Force Simulation Setup (Actual Implementation)

```typescript
// From KnowledgeGraph.render() method
this.simulation = d3.forceSimulation(this.data.nodes as d3.SimulationNodeDatum[])
  .force('link', d3.forceLink(this.data.edges)
    .id((d: any) => d.id)
    .distance((d: any, i) => linkDistanceAccessor(d, i, this.data.edges))
    .strength(this.config.linkStrength ?? this.createLinkStrengthFunction()))
  .force('charge', d3.forceManyBody()
    .strength((d: any, i) => chargeAccessor(d, i, this.data.nodes)))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius((d: any, i) => collisionRadiusAccessor(d, i, this.data.nodes) + 2));
```

### 4.2 Accessor Pattern Usage

The implementation uses a flexible accessor pattern that converts configuration values to functions:

```typescript
private accessor<T, R>(accessor: Accessor<T, R> | undefined, defaultValue: R): (d: T, i: number, nodes: T[]) => R {
  if (accessor === undefined) return () => defaultValue;
  if (typeof accessor === 'function') return accessor as (d: T, i: number, nodes: T[]) => R;
  return () => accessor;
}

// Usage example
const radiusAccessor = this.accessor(this.config.nodeRadius, 10);
const fillAccessor = this.accessor(this.config.nodeFill, '#69b3a2');
```

### 4.3 SVG Structure Creation

```typescript
// SVG setup with zoom capabilities
this.svg = d3.select(this.container)
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', [0, 0, width, height]);

const g = this.svg.append('g');

// Zoom behavior
const zoom = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent(this.config.zoomExtent || [0.1, 10])
  .on('zoom', (event) => {
    g.attr('transform', event.transform);
  });
```

## 5. Edge Rendering System

### 5.1 Pluggable Edge Renderer Architecture

The implementation uses an abstract `EdgeRenderer` interface with concrete implementations:

```typescript
// Edge renderer abstraction
interface EdgeRenderer {
  render(linkGroup: d3.Selection, edges: Edge[], nodes: Node[], style: EdgeStyle): EdgeRenderResult;
  update(result: EdgeRenderResult): void;
  destroy(result: EdgeRenderResult): void;
}

// Current implementations
class SimpleEdge implements EdgeRenderer { /* Basic straight lines */ }
class EdgeBundling implements EdgeRenderer { /* Hierarchical edge bundling */ }
```

### 5.2 Edge Rendering Configuration

```typescript
interface GraphConfig {
  edgeRenderer?: 'simple' | 'bundled';  // Renderer selection
  edgeBundling?: {  // Bundling parameters
    subdivisions?: number;
    adaptiveSubdivision?: boolean;
    compatibilityThreshold?: number;
    iterations?: number;
    stepSize?: number;
    stiffness?: number;
    momentum?: number;
    curveType?: 'basis' | 'cardinal' | 'catmullRom' | 'bundle';
    curveTension?: number;
    smoothingType?: 'laplacian' | 'gaussian' | 'bilateral';
    smoothingIterations?: number;
    smoothingFrequency?: number;
    compatibilityFunction?: (edge1: Edge, edge2: Edge) => number;
  };
}
```

### 5.3 Stabilization-Based Edge Rendering

The implementation includes an optional stabilization phase before edge rendering:

```typescript
// Wait for simulation to stabilize before rendering edges
if (this.config.waitForStable) {
  const alpha = this.simulation?.alpha() ?? 1;
  if (alpha < (this.config.stabilityThreshold ?? 0.01)) {
    edgesRendered = true;
    this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);
  }
}
```

## 6. Interaction System

### 6.1 Zoom and Pan Implementation

```typescript
// Zoom behavior setup
if (this.config.enableZoom) {
  const zoomExtent = this.config.zoomExtent || [0.1, 10];
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent(zoomExtent)
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
  this.svg.call(zoom);

  // Auto-fit functionality
  if (this.config.fitToViewport) {
    setTimeout(() => {
      this.fitToViewport(g, zoom);
    }, 1000);
  }
}
```

### 6.2 Drag Behavior

```typescript
// Node dragging with simulation integration
if (this.config.enableDrag) {
  const drag = d3.drag<SVGCircleElement, Node>()
    .on('start', (event, d: any) => {
      if (!event.active) this.simulation?.alphaTarget(0.3).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on('drag', (event, d: any) => {
      d.fx = event.x; d.fy = event.y;
    })
    .on('end', (event, d: any) => {
      if (!event.active) this.simulation?.alphaTarget(0);
      d.fx = null; d.fy = null;
      // Recalculate bundling after drag if needed
      if (this.config.edgeRenderer === 'bundled' && this.edgeRenderResult) {
        setTimeout(() => this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor), 100);
      }
    });
  node.call(drag as any);
}
```

## 7. TypeScript Type System

### 7.1 Core Data Types

From `types.ts`, the implementation defines comprehensive interfaces:

```typescript
interface Node {
  id: string;
  label?: string;
  type?: string;
  x?: number; y?: number; z?: number;
  vector?: number[];  // For similarity calculations
  metadata?: Record<string, unknown>;
}

interface Edge {
  id?: string;
  source: string | Node;
  target: string | Node;
  label?: string;
  type?: string;
  weight?: number;
  strength?: number;
  metadata?: Record<string, unknown>;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}
```

### 7.2 Accessor Type System

The flexible accessor pattern allows both constants and functions:

```typescript
export type Accessor<T, R> = R | ((d: T, i: number, nodes: T[]) => R);

// Usage examples in GraphConfig
interface GraphConfig {
  nodeRadius?: Accessor<Node, number>;
  nodeFill?: Accessor<Node, string>;
  linkDistance?: Accessor<Edge, number>;
  chargeStrength?: Accessor<Node, number>;
  // ... other configuration options
}
```

## 8. Advanced Features

### 8.1 Similarity-Based Forces

The implementation supports custom similarity functions for node clustering:

```typescript
interface GraphConfig {
  similarityFunction?: SimilarityFunction;
}

export type SimilarityFunction = (a: Node, b: Node) => number;

// Implementation creates custom force
if (this.config.similarityFunction) {
  this.simulation.force('similarity', this.createSimilarityForce(this.config.similarityFunction));
}
```

### 8.2 Edge Labels

Support for rendering labels along edge paths:

```typescript
interface GraphConfig {
  showEdgeLabels?: boolean;
  edgeLabelStyle?: {
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    textAnchor?: 'start' | 'middle' | 'end';
    dominantBaseline?: string;
  };
}
```

### 8.3 Configuration Defaults (Actual Implementation)

```typescript
// From KnowledgeGraph constructor
this.config = {
  width: config.width ?? 800,
  height: config.height ?? 600,
  nodeRadius: config.nodeRadius ?? 10,
  nodeFill: config.nodeFill ?? '#69b3a2',
  nodeStroke: config.nodeStroke ?? '#fff',
  nodeStrokeWidth: config.nodeStrokeWidth ?? 1.5,
  linkDistance: config.linkDistance ?? 100,
  linkStroke: config.linkStroke ?? '#999',
  linkStrokeWidth: config.linkStrokeWidth ?? 1.5,
  chargeStrength: config.chargeStrength ?? -300,
  edgeRenderer: config.edgeRenderer ?? 'simple',
  waitForStable: config.waitForStable ?? false,
  stabilityThreshold: config.stabilityThreshold ?? 0.01,
  enableZoom: config.enableZoom ?? true,
  enableDrag: config.enableDrag ?? true,
  dimensions: config.dimensions ?? 2,
  // ... merged with provided config
};
```

## 9. Future Enhancement Requirements

Based on demo requirements, these callback enhancements would support needed functionality:

### 9.1 Enhanced Callback System

```typescript
interface GraphConfig {
  // State management callbacks
  onStateChange?: (state: LayoutEngineState, progress: number) => void;
  onLayoutProgress?: (alpha: number, stability: number) => void;

  // Edge rendering callbacks
  onEdgeRenderingStart?: (totalEdges: number) => void;
  onEdgeRenderingProgress?: (rendered: number, total: number) => void;
  onEdgeRenderingComplete?: () => void;

  // Selection callbacks
  onNodeSelection?: (nodeId: string, neighbors: Node[], edges: Edge[]) => void;

  // Error handling
  onError?: (error: Error, stage: string, recoverable: boolean) => void;
}
```

### 9.2 Status and Diagnostics

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

This represents the minimal enhancements needed to support the demo requirements while building on the existing solid implementation.
