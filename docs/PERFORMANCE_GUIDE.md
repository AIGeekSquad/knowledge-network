# Performance Guide

**Optimization strategies for knowledge graphs of all sizes**

---

## Overview

The knowledge-network library scales from small interactive graphs to large-scale network visualizations with thousands of nodes and edges. This guide provides tested performance optimization strategies, configuration patterns, and architectural recommendations for different scales and use cases.

---

## Performance by Scale

### Graph Size Classification

| Scale | Nodes | Edges | Primary Bottlenecks | Key Strategies |
|-------|-------|-------|-------------------|----------------|
| **Small** | < 100 | < 200 | None | All features enabled |
| **Medium** | 100-1,000 | 200-2,000 | Edge bundling computation | Optimize bundling settings |
| **Large** | 1,000-5,000 | 2,000-10,000 | Force simulation, DOM updates | Fixed styling, reduce interactions |
| **Very Large** | 5,000+ | 10,000+ | Everything | Data reduction, simple rendering |

---

## Small Graphs (< 100 nodes)

**Recommended Configuration:**
```typescript
const smallGraphConfig: GraphConfig = {
  // All features enabled - performance not a concern
  edgeRenderer: 'bundled',
  enableZoom: true,
  enableDrag: true,
  waitForStable: true,

  // Use functions for rich styling
  nodeRadius: (node) => node.metadata?.importance ? 15 : 10,
  nodeFill: (node) => getColorByType(node.type),

  edgeBundling: {
    subdivisions: 60,           // Smooth curves
    iterations: 120,            // Tight bundles
    compatibilityThreshold: 0.4  // Aggressive bundling
  }
};
```

**Focus Areas:**
- Rich visual styling and animations
- Interactive features and smooth transitions
- Advanced edge bundling for visual appeal

---

## Medium Graphs (100-1,000 nodes)

**Performance Bottlenecks:**
- Edge bundling becomes computationally expensive
- Too many DOM updates during simulation
- Accessor functions called frequently

**Optimized Configuration:**
```typescript
const mediumGraphConfig: GraphConfig = {
  // Optimize edge bundling
  edgeRenderer: 'bundled',
  waitForStable: true,
  edgeBundling: {
    subdivisions: 30,           // Reduce from 60 (still smooth)
    iterations: 80,             // Reduce from 120 (still effective)
    compatibilityThreshold: 0.5, // Less aggressive bundling
    stepSize: 0.08             // Faster convergence
  },

  // Balance styling vs performance
  nodeRadius: (node) => node.metadata?.size || 8,  // Keep functions for important styling
  nodeFill: '#4ecdc4',        // Fixed color (faster than function)
  nodeStroke: '#fff',         // Fixed stroke

  // Optimize forces
  chargeStrength: -200,       // Moderate repulsion
  linkDistance: 60,           // Shorter edges
  stabilityThreshold: 0.005   // Slightly less precise

  // Keep interaction enabled
  enableZoom: true,
  enableDrag: true
};
```

**Key Optimizations:**
1. **Reduced bundling complexity** while maintaining visual benefit
2. **Mix of fixed and dynamic styling** for best performance/appearance balance
3. **Moderate force settings** for faster convergence

---

## Large Graphs (1,000-5,000 nodes)

**Performance Bottlenecks:**
- Force simulation takes very long to converge
- Edge bundling becomes prohibitively slow
- Browser struggles with DOM updates

**Performance-First Configuration:**
```typescript
const largeGraphConfig: GraphConfig = {
  // Simplify rendering
  edgeRenderer: 'simple',     // Skip bundling entirely

  // Fixed styling for speed
  nodeRadius: 5,              // Small, fixed size
  nodeFill: '#4ecdc4',        // Fixed color
  nodeStroke: '#fff',
  nodeStrokeWidth: 1,
  linkStroke: '#999',
  linkStrokeWidth: 1,

  // Optimize simulation
  chargeStrength: -50,        // Weaker forces
  linkDistance: 20,           // Short edges
  stabilityThreshold: 0.01,   // Less precision

  // Reduce interaction overhead
  enableDrag: false,          // Disable dragging
  enableZoom: true,           // Keep zoom for navigation

  // Use callback optimization
  onLayoutProgress: throttle((alpha, progress) => {
    // Update UI at most every 100ms
    updateProgressIndicator(progress);
  }, 100)
};

// Utility function for throttling callbacks
function throttle(func, delay) {
  let timeoutId;
  let lastExecTime = 0;
  return function (...args) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    }
  };
}
```

**Architecture Recommendations:**
```typescript
// Use clustering for large graphs
function clusterLargeGraph(data: GraphData, maxNodes: number = 3000): GraphData {
  if (data.nodes.length <= maxNodes) return data;

  // Simple clustering by node type
  const clusters = groupBy(data.nodes, 'type');
  const clusteredNodes: Node[] = [];
  const clusteredEdges: Edge[] = [];

  Object.entries(clusters).forEach(([type, nodes]) => {
    if (nodes.length <= 50) {
      // Keep small groups as-is
      clusteredNodes.push(...nodes);
    } else {
      // Create cluster representative
      const clusterNode: Node = {
        id: `cluster-${type}`,
        label: `${type} (${nodes.length} items)`,
        type: 'cluster',
        metadata: {
          originalNodes: nodes.map(n => n.id),
          nodeCount: nodes.length
        }
      };
      clusteredNodes.push(clusterNode);
    }
  });

  // Rebuild edges for clustered data
  // Implementation depends on clustering strategy

  return { nodes: clusteredNodes, edges: clusteredEdges };
}
```

---

## Very Large Graphs (5,000+ nodes)

**Critical Performance Strategy:**
Focus on **data reduction** before visualization.

### Data Reduction Techniques

#### 1. Importance Filtering
```typescript
function filterByImportance(data: GraphData, threshold: number = 0.5): GraphData {
  const importantNodes = data.nodes.filter(node =>
    (node.metadata?.importance as number || 0) >= threshold
  );

  const importantNodeIds = new Set(importantNodes.map(n => n.id));

  const relevantEdges = data.edges.filter(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return importantNodeIds.has(sourceId) && importantNodeIds.has(targetId);
  });

  return { nodes: importantNodes, edges: relevantEdges };
}
```

#### 2. Degree-Based Filtering
```typescript
function filterByDegree(data: GraphData, minDegree: number = 2): GraphData {
  // Calculate node degrees
  const degrees = new Map<string, number>();

  data.edges.forEach(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

    degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1);
    degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
  });

  // Keep only well-connected nodes
  const connectedNodes = data.nodes.filter(node =>
    (degrees.get(node.id) || 0) >= minDegree
  );

  // Keep edges between remaining nodes
  const nodeIds = new Set(connectedNodes.map(n => n.id));
  const validEdges = data.edges.filter(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    return nodeIds.has(sourceId) && nodeIds.has(targetId);
  });

  return { nodes: connectedNodes, edges: validEdges };
}
```

#### 3. Hierarchical Clustering
```typescript
function createHierarchicalClusters(
  data: GraphData,
  maxNodesPerLevel: number = 1000
): GraphData[] {
  const levels: GraphData[] = [];
  let currentData = data;

  while (currentData.nodes.length > maxNodesPerLevel) {
    // Create next level by clustering
    const clustered = clusterByConnectivity(currentData, maxNodesPerLevel);
    levels.push(clustered);
    currentData = clustered;
  }

  levels.push(currentData); // Final level
  return levels;
}

// Start with highest level, allow drilling down
function setupHierarchicalView(levels: GraphData[]) {
  let currentLevel = 0;

  const graph = new KnowledgeGraph(container, levels[currentLevel], {
    onNodeSelected: (nodeId) => {
      const node = levels[currentLevel].nodes.find(n => n.id === nodeId);

      // If cluster node, drill down to next level
      if (node?.type === 'cluster' && currentLevel < levels.length - 1) {
        currentLevel++;
        graph.updateData(levels[currentLevel]);
      }
    }
  });

  return { graph, levels, currentLevel };
}
```

### Minimal Configuration for Very Large Graphs

```typescript
const veryLargeGraphConfig: GraphConfig = {
  // Absolute minimal rendering
  edgeRenderer: 'simple',

  // Fixed, small styling
  nodeRadius: 3,
  nodeFill: '#4ecdc4',
  nodeStroke: 'none',        // Remove strokes entirely
  linkStroke: '#ccc',
  linkStrokeWidth: 0.5,      // Thin edges

  // Fast simulation
  chargeStrength: -30,       // Minimal repulsion
  linkDistance: 15,          // Very short edges
  stabilityThreshold: 0.05,  // Fast convergence

  // Disable expensive features
  enableDrag: false,
  enableZoom: false,         // Or implement custom lightweight zoom

  // Minimal callbacks
  onLayoutProgress: null     // Skip progress callbacks
};
```

---

## Specific Optimization Techniques

### 1. Edge Bundling Performance

#### Optimal Settings by Graph Size

```typescript
const bundlingConfigs = {
  // Small graphs: maximum quality
  small: {
    subdivisions: 60,
    iterations: 150,
    compatibilityThreshold: 0.2,
    stepSize: 0.04,
    stiffness: 0.05
  },

  // Medium graphs: balanced
  medium: {
    subdivisions: 30,
    iterations: 80,
    compatibilityThreshold: 0.4,
    stepSize: 0.08,
    stiffness: 0.1
  },

  // Large graphs: performance focused
  large: {
    subdivisions: 15,
    iterations: 40,
    compatibilityThreshold: 0.6,
    stepSize: 0.15,
    stiffness: 0.2
  }
};

// Choose config based on edge count
function getBundlingConfig(edgeCount: number) {
  if (edgeCount < 200) return bundlingConfigs.small;
  if (edgeCount < 2000) return bundlingConfigs.medium;
  return bundlingConfigs.large;
}
```

#### Progressive Edge Bundling
```typescript
// Start with simple edges, upgrade to bundling after layout settles
let currentRenderer = 'simple';

const graph = new KnowledgeGraph(container, data, {
  edgeRenderer: currentRenderer,

  onStateChange: (state, progress) => {
    // Switch to bundling after initial layout
    if (state === 'ready' && currentRenderer === 'simple' && data.edges.length < 1000) {
      setTimeout(() => {
        graph.updateConfig({ edgeRenderer: 'bundled' });
        currentRenderer = 'bundled';
      }, 500);
    }
  }
});
```

### 2. Force Simulation Performance

#### Adaptive Force Settings
```typescript
function getOptimalForceConfig(nodeCount: number, edgeCount: number): Partial<GraphConfig> {
  const density = edgeCount / (nodeCount * (nodeCount - 1) / 2);

  return {
    // Charge strength based on node count
    chargeStrength: Math.max(-500, -50 * Math.log(nodeCount)),

    // Link distance based on density
    linkDistance: density > 0.1 ? 20 : 60,

    // Collision detection only for sparse graphs
    collisionRadius: nodeCount < 1000 ? (node) => node.radius + 2 : undefined,

    // Stability threshold based on complexity
    stabilityThreshold: nodeCount > 2000 ? 0.01 : 0.001
  };
}
```

#### Simulation Control
```typescript
const graph = new KnowledgeGraph(container, data, config);

// Access simulation for fine control
const simulation = graph.getSimulation();

if (simulation && data.nodes.length > 1000) {
  // Reduce alpha decay for faster convergence
  simulation.alphaDecay(0.02);  // Default is 0.0228

  // Increase velocity decay to reduce oscillation
  simulation.velocityDecay(0.6); // Default is 0.4

  // Set custom alpha target for earlier stopping
  simulation.alphaTarget(0.01);  // Stop earlier than default 0
}
```

### 3. Rendering Performance

#### Renderer Selection Strategy
```typescript
function selectOptimalRenderer(nodeCount: number, edgeCount: number): RendererType {
  // SVG: Best for small graphs with interaction
  if (nodeCount < 500 && edgeCount < 1000) return 'svg';

  // Canvas: Better for medium graphs
  if (nodeCount < 2000 && edgeCount < 5000) return 'canvas';

  // WebGL: Required for large graphs
  return 'webgl';
}

const config: GraphConfig = {
  renderer: selectOptimalRenderer(data.nodes.length, data.edges.length),
  // ... other settings
};
```

#### Level-of-Detail (LOD) Rendering
```typescript
// Reduce detail based on zoom level
const graph = new KnowledgeGraph(container, data, {
  nodeRadius: (node, zoom = 1) => {
    const baseRadius = node.metadata?.size || 8;
    // Smaller nodes when zoomed out
    return Math.max(2, baseRadius * Math.min(zoom, 1));
  },

  // Hide labels when zoomed out
  showLabels: (zoom = 1) => zoom > 0.5,

  onZoomChange: (zoomLevel) => {
    // Update styling based on zoom
    if (zoomLevel < 0.3) {
      // Very zoomed out: minimal rendering
      graph.updateConfig({
        nodeStroke: 'none',
        linkStrokeWidth: 0.5
      });
    } else if (zoomLevel > 2) {
      // Zoomed in: full detail
      graph.updateConfig({
        nodeStroke: '#333',
        linkStrokeWidth: 1.5,
        showLabels: true
      });
    }
  }
});
```

---

## Memory Management

### Efficient Data Updates

```typescript
// ✅ Efficient: Reuse graph instance
const graph = new KnowledgeGraph(container, initialData);
graph.render();

// Update with new data
graph.updateData(newData);  // Reuses components

// ❌ Inefficient: Create new instances
graph1.destroy();
const graph2 = new KnowledgeGraph(container, newData);  // Recreates everything
```

### Memory Leak Prevention

```typescript
// Critical cleanup patterns
class GraphManager {
  private graphs: Map<string, KnowledgeGraph> = new Map();

  createGraph(id: string, container: HTMLElement, data: GraphData): KnowledgeGraph {
    // Always clean up existing graph
    this.destroyGraph(id);

    const graph = new KnowledgeGraph(container, data);
    this.graphs.set(id, graph);
    return graph;
  }

  destroyGraph(id: string): void {
    const graph = this.graphs.get(id);
    if (graph) {
      graph.destroy();           // Critical: cleanup D3 simulation and DOM
      this.graphs.delete(id);
    }
  }

  // Cleanup all graphs (e.g., on app shutdown)
  destroyAll(): void {
    this.graphs.forEach(graph => graph.destroy());
    this.graphs.clear();
  }
}
```

### Resource Monitoring

```typescript
// Monitor memory usage during development
function monitorMemoryUsage(graph: KnowledgeGraph, intervalMs: number = 5000) {
  const monitor = setInterval(() => {
    if (performance.memory) {
      console.log('Memory:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB',
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB'
      });
    }
  }, intervalMs);

  // Stop monitoring when graph destroyed
  const originalDestroy = graph.destroy.bind(graph);
  graph.destroy = () => {
    clearInterval(monitor);
    originalDestroy();
  };
}
```

---

## Advanced Performance Patterns

### 1. Web Workers for Data Processing

```typescript
// main.ts
import GraphWorker from './graph.worker?worker';

async function processLargeDataset(rawData: any[]): Promise<GraphData> {
  return new Promise((resolve) => {
    const worker = new GraphWorker();

    worker.postMessage({
      type: 'PROCESS_DATA',
      data: rawData
    });

    worker.onmessage = (e) => {
      if (e.data.type === 'PROCESSED_DATA') {
        worker.terminate();
        resolve(e.data.result);
      }
    };
  });
}

// graph.worker.ts
self.onmessage = (e) => {
  if (e.data.type === 'PROCESS_DATA') {
    const processedData = expensiveDataProcessing(e.data.data);

    self.postMessage({
      type: 'PROCESSED_DATA',
      result: processedData
    });
  }
};
```

### 2. Virtualization for Massive Graphs

```typescript
// Only render nodes within viewport
class VirtualizedGraph {
  private viewportBounds: { x: number, y: number, width: number, height: number };
  private allNodes: Node[];
  private visibleNodes: Node[];

  updateViewport(bounds: typeof this.viewportBounds) {
    this.viewportBounds = bounds;

    // Filter nodes within viewport (with margin for smooth scrolling)
    const margin = 100;
    this.visibleNodes = this.allNodes.filter(node =>
      node.x >= bounds.x - margin &&
      node.x <= bounds.x + bounds.width + margin &&
      node.y >= bounds.y - margin &&
      node.y <= bounds.y + bounds.height + margin
    );

    // Update graph with visible subset
    const visibleData = {
      nodes: this.visibleNodes,
      edges: this.getVisibleEdges(this.visibleNodes)
    };

    this.graph.updateData(visibleData);
  }

  private getVisibleEdges(nodes: Node[]): Edge[] {
    const nodeIds = new Set(nodes.map(n => n.id));
    return this.allEdges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });
  }
}
```

### 3. Progressive Loading

```typescript
// Load and render data in chunks
async function loadGraphProgressively(
  dataLoader: () => Promise<GraphData>,
  container: HTMLElement,
  chunkSize: number = 500
): Promise<KnowledgeGraph> {

  const fullData = await dataLoader();
  const chunks = chunkArray(fullData.nodes, chunkSize);

  // Start with first chunk
  let currentData: GraphData = {
    nodes: chunks[0] || [],
    edges: []
  };

  const graph = new KnowledgeGraph(container, currentData, {
    onStateChange: (state) => {
      if (state === 'ready' && chunks.length > 1) {
        // Load next chunk after current is stable
        setTimeout(() => loadNextChunk(), 100);
      }
    }
  });

  let chunkIndex = 0;

  function loadNextChunk() {
    if (chunkIndex >= chunks.length - 1) return;

    chunkIndex++;
    currentData.nodes.push(...chunks[chunkIndex]);

    // Add edges connecting to new nodes
    const newNodeIds = new Set(chunks[chunkIndex].map(n => n.id));
    const newEdges = fullData.edges.filter(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      return newNodeIds.has(sourceId) || newNodeIds.has(targetId);
    });

    currentData.edges.push(...newEdges);
    graph.updateData({ ...currentData });

    // Continue loading if more chunks remain
    if (chunkIndex < chunks.length - 1) {
      setTimeout(loadNextChunk, 100);
    }
  }

  await graph.render();
  return graph;
}
```

---

## Performance Monitoring

### Built-in Performance Metrics

```typescript
const graph = new KnowledgeGraph(container, data, {
  onStateChange: (state, progress) => {
    console.time(`state-${state}`);

    // Track state transitions
    performance.mark(`graph-${state}-start`);
  },

  onLayoutProgress: (alpha, progress) => {
    // Monitor simulation convergence
    if (progress % 10 === 0) {  // Log every 10%
      console.log(`Layout: ${progress}%, alpha: ${alpha.toFixed(4)}`);
    }
  }
});
```

### Custom Performance Profiler

```typescript
class GraphProfiler {
  private marks: Map<string, number> = new Map();

  startMark(name: string): void {
    this.marks.set(name, performance.now());
  }

  endMark(name: string): number {
    const start = this.marks.get(name);
    if (!start) return 0;

    const duration = performance.now() - start;
    console.log(`${name}: ${duration.toFixed(2)}ms`);
    this.marks.delete(name);
    return duration;
  }

  profileGraph(graph: KnowledgeGraph): void {
    this.startMark('total-render');

    const originalRender = graph.render.bind(graph);
    graph.render = async () => {
      this.startMark('layout-calculation');

      const result = await originalRender();

      this.endMark('layout-calculation');
      this.endMark('total-render');

      return result;
    };
  }
}

// Usage
const profiler = new GraphProfiler();
profiler.profileGraph(graph);
```

---

## Browser-Specific Optimizations

### Chrome/Edge Optimizations

```typescript
// Use OffscreenCanvas if available for background processing
const config: GraphConfig = {
  renderer: 'canvas',

  // Chrome-specific optimizations
  onRenderFrame: () => {
    // Request idle callback for non-critical updates
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        updateSecondaryUI();
      });
    }
  }
};
```

### Firefox Optimizations

```typescript
// Firefox handles SVG better than Canvas for medium graphs
const isFirefox = navigator.userAgent.includes('Firefox');

const config: GraphConfig = {
  renderer: isFirefox && nodeCount < 1000 ? 'svg' : 'canvas',

  // Firefox-specific force settings
  chargeStrength: isFirefox ? -250 : -300,
  linkDistance: isFirefox ? 35 : 30
};
```

### Safari Optimizations

```typescript
// Safari memory management
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

if (isSafari) {
  // More aggressive cleanup for Safari
  setInterval(() => {
    if (graph && performance.memory?.usedJSHeapSize > 100 * 1024 * 1024) {
      console.warn('High memory usage detected, consider data reduction');
    }
  }, 10000);
}
```

---

## Performance Testing

### Benchmarking Setup

```typescript
// Benchmark different configurations
async function benchmarkConfigurations(
  data: GraphData,
  configs: { name: string, config: GraphConfig }[]
): Promise<BenchmarkResults> {

  const results: BenchmarkResults = {};

  for (const { name, config } of configs) {
    console.log(`Benchmarking: ${name}`);

    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize || 0;

    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    const graph = new KnowledgeGraph(container, data, config);

    await graph.render();

    const endTime = performance.now();
    const endMemory = performance.memory?.usedJSHeapSize || 0;

    results[name] = {
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      nodeCount: data.nodes.length,
      edgeCount: data.edges.length
    };

    graph.destroy();
    document.body.removeChild(container);

    // Allow garbage collection between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

// Example usage
const configs = [
  { name: 'simple-edges', config: { edgeRenderer: 'simple' } },
  { name: 'bundled-default', config: { edgeRenderer: 'bundled' } },
  { name: 'bundled-optimized', config: {
    edgeRenderer: 'bundled',
    edgeBundling: { iterations: 60, subdivisions: 20 }
  }}
];

benchmarkConfigurations(testData, configs).then(console.log);
```

---

---

## 🎮 Interactive Performance Exploration

**Experience optimization techniques through hands-on exploration:**

- **[🔥 Interactive Benchmarking Platform](../packages/demo-suite/)** - Real-time performance comparison across rendering modes and layout algorithms
- **[⚖️ Renderer Mode Switching](../packages/demo-suite/)** - Live SVG vs Canvas vs WebGL performance comparison with metrics
- **[🏆 Configuration Optimization Tools](../packages/demo-suite/)** - Find optimal settings for your data with benchmarking export
- **[📊 Dataset Performance Analysis](../packages/demo-suite/src/components/data/)** - Compare performance across computer science, research, biology knowledge graphs

**Interactive platform enables configuration iteration and quantified competitive advantage validation.**

---

## Related Documentation

- **[📚 Complete API Reference](../packages/knowledge-network/README.md)** - Full API documentation with configuration options
- **[🔧 Integration Guide](./INTEGRATION_GUIDE.md)** - Framework-specific performance patterns
- **[❓ Troubleshooting](./TROUBLESHOOTING.md)** - Common performance-related issues

---

**Performance Questions?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or [benchmark your specific use case](https://github.com/aigeeksquad/knowledge-network/tree/main/benchmarks) using our performance testing tools.