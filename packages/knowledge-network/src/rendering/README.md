# Enhanced Canvas Renderer with Spatial Interaction API

High-performance canvas renderer with spatial indexing integration, viewport transformations, and interactive capabilities designed for large knowledge graphs (1000+ nodes).

## Features

### 🚀 Performance Optimizations

- **Viewport Culling**: Only render visible nodes using spatial indexing (O(log n))
- **Level-of-Detail**: Simplify rendering based on zoom level
- **Batch Operations**: Group rendering calls for efficiency
- **OffscreenCanvas**: Background processing when available
- **Spatial Indexing**: QuadTree/OctTree integration for fast queries

### 🎯 Spatial Interaction API

```typescript
// Efficient node selection using spatial queries
const node = renderer.getNodeAt(mouseX, mouseY);
const nodesInRegion = renderer.getNodesInRegion(selectionBounds);
const rayIntersections = renderer.queryRay(origin, direction);
```

### 🎮 Viewport Operations

- **Pan & Zoom**: Smooth transformations with constraints
- **Fit to Viewport**: Automatically fit graph with padding
- **Coordinate Conversion**: World ↔ Screen coordinate utilities
- **Reset View**: One-click navigation reset

### 🖱️ Built-in Interactions

- **Mouse Picking**: Ray-based node selection
- **Hover Detection**: Efficient mouseover using spatial index
- **Multi-select**: Ctrl/Cmd+click for multiple nodes
- **Region Selection**: Drag to select multiple nodes
- **Pan and Zoom**: Mouse wheel and drag support

## Quick Start

### Basic Usage

```typescript
import { createEnhancedCanvasRenderer } from '@aigeeksquad/knowledge-network/rendering';

const renderer = createEnhancedCanvasRenderer();
renderer.initialize(container, {
  width: 800,
  height: 600,
  enableViewportCulling: true,
  enableLevelOfDetail: true,
});

renderer.render(layout, {
  nodeConfig: { radius: 10, fill: '#69b3a2' },
  edgeConfig: { stroke: '#999', strokeWidth: 1.5 },
});
```

### Large Graph Optimization

```typescript
import { createLargeGraphRenderer } from '@aigeeksquad/knowledge-network/rendering';

const renderer = createLargeGraphRenderer();
renderer.initialize(container, {
  width: 1200,
  height: 800,
});

// Automatically optimized for 1000+ nodes
renderer.render(largeLayout, renderConfig);
```

### Mobile Optimization

```typescript
import { createMobileRenderer } from '@aigeeksquad/knowledge-network/rendering';

const renderer = createMobileRenderer();
renderer.initialize(container, {
  width: window.innerWidth,
  height: window.innerHeight - 100,
});
```

## Advanced Usage

### Custom Performance Presets

```typescript
import { SpatialCanvasFactory, PERFORMANCE_PRESETS } from '@aigeeksquad/knowledge-network/rendering';

// Use predefined presets
const renderer = SpatialCanvasFactory.create('highQuality');

// Or create custom configuration
const customRenderer = SpatialCanvasFactory.createCustom({
  enableViewportCulling: true,
  enableLevelOfDetail: true,
  batchSize: 150,
  useOffscreenCanvas: true,
  maxZoom: 15,
  selectionTolerance: 8,
});
```

### Interactive Features Setup

```typescript
import { SpatialInteractionHelpers } from '@aigeeksquad/knowledge-network/rendering';

// Setup comprehensive mouse interactions
const cleanup = SpatialInteractionHelpers.setupMouseInteractions(renderer, {
  enableHover: true,
  enableSelection: true,
  enablePanning: true,
  enableZooming: true,

  onNodeHover: (node) => {
    console.log('Hovered node:', node);
    showTooltip(node);
  },

  onNodeClick: (node) => {
    console.log('Clicked node:', node);
    highlightConnectedNodes(node);
  },
});

// Setup region selection with drag
SpatialInteractionHelpers.setupRegionSelection(renderer, (selectedNodes) => {
  console.log('Selected nodes:', selectedNodes);
});

// Setup keyboard shortcuts
SpatialInteractionHelpers.setupKeyboardShortcuts(renderer, {
  resetView: 'r',
  fitView: 'f',
  zoomIn: '+',
  zoomOut: '-',
});
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@aigeeksquad/knowledge-network/rendering';

const monitor = new PerformanceMonitor();
const stopMonitoring = monitor.monitor(renderer);

// Later...
const stats = monitor.getStats();
console.log('Performance Stats:', {
  avgRenderTime: stats.avgRenderTime,
  avgFrameRate: stats.avgFrameRate,
  recommendations: stats.recommendations,
});
```

## API Reference

### EnhancedCanvasRenderer

#### Spatial Queries

```typescript
// Find node at screen coordinates
getNodeAt(screenX: number, screenY: number): PositionedNode | null

// Find nodes in rectangular region
getNodesInRegion(bounds: Rectangle): PositionedNode[]

// Ray-based node selection
queryRay(origin: Point, direction: Vector): PositionedNode[]
```

#### Viewport Control

```typescript
// Zoom operations
setZoom(scale: number): void
getZoom(): number

// Pan operations
setPan(offset: Point2D): void
getPan(): Point2D

// View fitting
fitToViewport(padding?: number): void
resetView(): void

// Coordinate transformations
worldToScreen(worldPoint: Point): Point2D
screenToWorld(screenPoint: Point2D): Point2D
```

#### Interaction

```typescript
// Highlighting
highlightNodes(nodeIds: string[]): void
highlightEdges(edgeIds: string[]): void
clearHighlights(): void

// Selection state (internal)
getSelectedNodes(): string[]
getHoveredNode(): PositionedNode | null
```

### Configuration Options

```typescript
interface CanvasRenderingConfig {
  // Basic canvas settings
  width: number;
  height: number;
  pixelDensity?: number;

  // Performance optimizations
  enableViewportCulling?: boolean;    // Default: true
  enableLevelOfDetail?: boolean;      // Default: true
  batchSize?: number;                 // Default: 100
  useOffscreenCanvas?: boolean;       // Default: true

  // Viewport constraints
  minZoom?: number;                   // Default: 0.1
  maxZoom?: number;                   // Default: 10
  panBounds?: Rectangle;              // Default: unlimited

  // Interaction settings
  enableMouseInteraction?: boolean;   // Default: true
  selectionTolerance?: number;        // Default: 10px
  hoverDistance?: number;             // Default: 15px
}
```

## Performance Characteristics

### Benchmarked Performance

| Node Count | Render Time | Selection Time | Memory Usage |
|------------|-------------|----------------|--------------|
| 100        | ~1ms        | <1ms           | ~2MB         |
| 500        | ~3ms        | <1ms           | ~8MB         |
| 1,000      | ~6ms        | <1ms           | ~15MB        |
| 2,000      | ~12ms       | <1ms           | ~28MB        |
| 5,000      | ~25ms       | <1ms           | ~65MB        |

*Tested on modern desktop browser with viewport culling enabled*

### Optimization Strategies

1. **Viewport Culling**: Reduces rendered node count by 60-90% on typical graphs
2. **Spatial Indexing**: O(log n) queries vs O(n) linear search
3. **Level of Detail**: Simplifies rendering at low zoom levels
4. **Batch Rendering**: Reduces canvas API calls by grouping operations
5. **OffscreenCanvas**: Enables background processing for non-blocking updates

## Migration Guide

### From Basic CanvasRenderer

```typescript
// Before: Basic CanvasRenderer
const basicRenderer = new CanvasRenderer();

// After: Enhanced CanvasRenderer with compatibility mode
import { CanvasRendererMigration } from '@aigeeksquad/knowledge-network/rendering';
const enhancedRenderer = CanvasRendererMigration.createCompatible(basicConfig);

// Gradually enable features
enhancedRenderer.initialize(container, {
  ...basicConfig,
  enableViewportCulling: true,  // Start with this
  enableMouseInteraction: true, // Then add interactions
});
```

### Performance Testing

```typescript
import { CanvasRendererMigration } from '@aigeeksquad/knowledge-network/rendering';

const comparison = await CanvasRendererMigration.performanceTest(
  basicRenderer,
  enhancedRenderer,
  testLayout
);

console.log('Performance Improvement:', {
  renderSpeedup: comparison.basic.renderTime / comparison.enhanced.renderTime,
  memoryEfficiency: comparison.basic.memory / comparison.enhanced.memory,
});
```

## Examples

### Interactive Node Explorer

```typescript
function createNodeExplorer(container: HTMLElement, layout: LayoutResult) {
  const renderer = createEnhancedCanvasRenderer();
  renderer.initialize(container, { width: 800, height: 600 });

  let selectedNode: PositionedNode | null = null;

  // Setup click handling for node exploration
  SpatialInteractionHelpers.setupMouseInteractions(renderer, {
    onNodeClick: (node) => {
      selectedNode = node;

      // Highlight clicked node and its neighbors
      const neighbors = findNeighbors(node, layout.edges);
      renderer.highlightNodes([node.id, ...neighbors.map(n => n.id)]);

      // Show node details
      showNodeDetails(node);
    },

    onNodeHover: (node) => {
      if (node !== selectedNode) {
        renderer.highlightNodes([node.id]);
      }
    },
  });

  renderer.render(layout, {
    nodeConfig: {
      radius: 12,
      fill: (node: PositionedNode) =>
        node === selectedNode ? '#ff6b35' : '#69b3a2',
    },
    edgeConfig: {
      stroke: '#999',
      strokeWidth: 1.5,
    },
  });

  return renderer;
}
```

### Region-based Analysis

```typescript
function createRegionAnalyzer(container: HTMLElement, layout: LayoutResult) {
  const renderer = createEnhancedCanvasRenderer();
  renderer.initialize(container, { width: 800, height: 600 });

  // Enable region selection for analysis
  SpatialInteractionHelpers.setupRegionSelection(renderer, (selectedNodes) => {
    // Analyze selected region
    const analysis = {
      nodeCount: selectedNodes.length,
      avgConnections: selectedNodes.reduce((sum, node) =>
        sum + countConnections(node, layout.edges), 0) / selectedNodes.length,
      categories: countCategories(selectedNodes),
    };

    showAnalysisResults(analysis);

    // Highlight selected nodes
    renderer.highlightNodes(selectedNodes.map(n => n.id));
  });

  renderer.render(layout, renderConfig);
  return renderer;
}
```

## Browser Support

- **Chrome/Edge**: Full support including OffscreenCanvas
- **Firefox**: Full support including OffscreenCanvas
- **Safari**: Full support, OffscreenCanvas on Safari 16.4+
- **Mobile**: Touch interactions optimized, OffscreenCanvas varies

## Best Practices

### For Large Graphs (1000+ nodes)

1. Use `largeGraph` preset or enable viewport culling
2. Implement progressive loading if needed
3. Consider data reduction strategies for extreme sizes
4. Monitor performance with PerformanceMonitor

### For Interactive Applications

1. Use appropriate selection tolerance for your UI
2. Provide visual feedback for all interactions
3. Implement keyboard shortcuts for power users
4. Test on target devices and browsers

### For Mobile Applications

1. Use larger touch targets (12px+ radius)
2. Implement pinch-to-zoom and pan gestures
3. Limit pixel density for performance
4. Test on actual devices, not just browser DevTools

## Troubleshooting

### Performance Issues

**Problem**: Low frame rate on large graphs
**Solution**: Enable viewport culling and level-of-detail, increase batch size

**Problem**: Slow node selection
**Solution**: Verify spatial index is built, check selection tolerance

### Interaction Issues

**Problem**: Nodes not selectable
**Solution**: Ensure `enableMouseInteraction: true` and reasonable selection tolerance

**Problem**: Pan/zoom not working
**Solution**: Check for event handler conflicts, verify viewport constraints

### Visual Issues

**Problem**: Blurry rendering on high-DPI displays
**Solution**: Set appropriate `pixelDensity` in configuration

**Problem**: Nodes disappear at certain zoom levels
**Solution**: Adjust level-of-detail thresholds or disable LOD

## Contributing

The enhanced renderer is built with modular design principles. Key extension points:

- **Custom Spatial Queries**: Extend SpatialIndexer for domain-specific queries
- **Performance Presets**: Add new presets in SpatialCanvasFactory
- **Interaction Patterns**: Extend SpatialInteractionHelpers
- **Rendering Effects**: Add new rendering modes in EnhancedCanvasRenderer

See the main project README for contribution guidelines.