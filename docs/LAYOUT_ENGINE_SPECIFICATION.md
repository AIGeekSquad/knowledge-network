# Knowledge Network Layout Engine Specification
## Pure D3.js Idiomatic API Design

## Executive Summary

The Knowledge Network Layout Engine is reimagined as a pure D3.js idiomatic visualization system that embraces D3's selection-based, data-driven paradigm. This specification defines a fluent, chainable API with comprehensive callback support for state management, progressive rendering, and interactive capabilities.

## Core Philosophy

### D3.js Idiomatic Principles

1. **Selection-Based Operations**: All operations work on D3 selections
2. **Method Chaining**: Fluent interface for configuration and rendering
3. **Data Binding**: Direct data-to-DOM binding following D3 patterns
4. **Accessor Functions**: `(d, i, nodes) => value` pattern throughout
5. **Event-Driven**: D3-style `.on('event', handler)` for all interactions
6. **Transitions**: Native D3 transitions for animations

### Architectural Alignment

```javascript
// Pure D3.js idiomatic usage
const graph = knowledgeNetwork()
  .width(800)
  .height(600)
  .nodeRadius(d => d.importance * 10)
  .on('stateChange', (state, progress) => console.log(state, progress))
  .on('nodeClick', (event, d) => showDetails(d));

d3.select('#container')
  .datum(graphData)
  .call(graph);
```

## API Architecture

### Core API Structure

```javascript
// Factory function following D3 convention
function knowledgeNetwork() {
  // Private state
  let width = 800;
  let height = 600;
  let nodeRadius = 5;
  let simulation = null;
  let callbacks = d3.dispatch(
    'stateChange',
    'layoutProgress', 
    'edgeRenderStart',
    'edgeRenderProgress',
    'edgeRenderComplete',
    'zoomFit',
    'ready',
    'error',
    'nodeClick',
    'nodeMouseover',
    'nodeMouseout',
    'edgeClick',
    'edgeMouseover',
    'edgeMouseout',
    'zoom',
    'dragStart',
    'drag',
    'dragEnd'
  );

  // The main render function
  function graph(selection) {
    selection.each(function(data) {
      // D3 idiomatic rendering
    });
  }

  // Chainable configuration methods
  graph.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return graph;
  };

  graph.nodeRadius = function(value) {
    if (!arguments.length) return nodeRadius;
    nodeRadius = typeof value === 'function' ? value : () => value;
    return graph;
  };

  // Event handling
  graph.on = function() {
    const value = callbacks.on.apply(callbacks, arguments);
    return value === callbacks ? graph : value;
  };

  return graph;
}
```

## State Management API

### State Machine with D3 Callbacks

```javascript
// State enumeration
const LayoutState = {
  IDLE: 'idle',
  LOADING: 'loading',
  LAYOUT_CALCULATING: 'layout_calculating',
  EDGE_RENDERING: 'edge_rendering',
  ZOOM_FITTING: 'zoom_fitting',
  READY: 'ready',
  ERROR: 'error',
  DISPOSED: 'disposed'
};

// State management integration
graph.on('stateChange', function(state, progress, metadata) {
  // State object structure
  // {
  //   current: LayoutState.LOADING,
  //   previous: LayoutState.IDLE,
  //   progress: 0.45,  // 0-1 normalized
  //   metadata: {
  //     phase: 'validation',
  //     nodesLoaded: 150,
  //     edgesLoaded: 450,
  //     errors: []
  //   }
  // }
});
```

### Progress Callbacks

```javascript
// Layout calculation progress
graph.on('layoutProgress', function(progress, alpha, metadata) {
  // progress: 0-1 normalized progress
  // alpha: current simulation alpha value
  // metadata: {
  //   iterations: 150,
  //   stability: 0.85,
  //   converging: true,
  //   estimatedCompletion: 2500  // ms
  // }
});

// Edge rendering progress
graph.on('edgeRenderStart', function(totalEdges, renderMode) {
  console.log(`Starting to render ${totalEdges} edges in ${renderMode} mode`);
});

graph.on('edgeRenderProgress', function(rendered, total, batchInfo) {
  // batchInfo: {
  //   batchSize: 100,
  //   currentBatch: 5,
  //   totalBatches: 10,
  //   estimatedTimeRemaining: 1500  // ms
  // }
});

graph.on('edgeRenderComplete', function(renderStats) {
  // renderStats: {
  //   totalEdges: 500,
  //   renderTime: 2500,  // ms
  //   mode: 'bundled',
  //   bundlingIterations: 90
  // }
});
```

## Configuration API

### Fluent Configuration Interface

```javascript
const graph = knowledgeNetwork()
  // Dimensions
  .width(1200)
  .height(800)
  .padding(20)
  
  // Node configuration with accessors
  .nodeRadius(d => d.importance * 5 + 3)
  .nodeFill(d => colorScale(d.category))
  .nodeStroke(d => d.selected ? '#ff0000' : '#333')
  .nodeStrokeWidth(d => d.selected ? 2 : 1)
  .nodeOpacity(d => d.highlighted ? 1 : 0.6)
  
  // Edge configuration with accessors  
  .linkDistance(d => d.weight ? 50 / d.weight : 100)
  .linkStrength(d => d.type === 'strong' ? 1 : 0.5)
  .linkStroke(d => d.highlighted ? '#ff0000' : '#999')
  .linkStrokeWidth(d => d.highlighted ? 2 : 1)
  .linkOpacity(d => d.highlighted ? 1 : 0.3)
  
  // Force simulation
  .chargeStrength(d => -300 * (d.importance || 1))
  .collisionRadius(d => graph.nodeRadius()(d) + 2)
  .alphaDecay(0.02)
  .velocityDecay(0.4)
  
  // Edge rendering
  .edgeRenderer('bundled')  // 'simple' | 'bundled' | 'curved'
  .bundlingStrength(0.85)
  .bundlingIterations(90)
  .bundlingCompatibility(0.6)
  
  // Interaction
  .enableZoom(true)
  .zoomExtent([0.1, 10])
  .enablePan(true)
  .enableDrag(true)
  .enableSelection(true)
  .selectionMode('single')  // 'single' | 'multiple'
  .neighborHighlightDepth(1)
  
  // Rendering behavior
  .renderMode('progressive')  // 'immediate' | 'progressive' | 'deferred'
  .hideGraphDuringLayout(true)
  .waitForStableLayout(true)
  .stabilityThreshold(0.001)
  .maxLayoutDuration(5000)  // ms
  
  // Performance
  .enableWebGL(false)
  .batchSize(100)  // for edge rendering
  .throttleProgress(16);  // ms between progress updates
```

## Selection and Data Binding API

### D3 Selection Integration

```javascript
// Standard D3 selection pattern
const container = d3.select('#graph-container');

// Bind data and call graph
container
  .datum(graphData)
  .call(graph);

// Or with explicit data binding
graph
  .data(graphData)
  .render(container);

// Updating data with transition
container
  .datum(newData)
  .transition()
  .duration(750)
  .call(graph);
```

### Node and Edge Selections

```javascript
// Access internal selections
const nodes = graph.nodes();  // Returns D3 selection of nodes
const edges = graph.edges();  // Returns D3 selection of edges

// Direct manipulation
nodes
  .filter(d => d.category === 'important')
  .classed('highlighted', true)
  .transition()
  .duration(500)
  .attr('r', d => graph.nodeRadius()(d) * 1.5);

// Custom styling
edges
  .filter(d => d.weight > 0.8)
  .style('stroke', '#ff6b6b')
  .style('stroke-width', 2);
```

## Interaction API

### Node Interaction Events

```javascript
// Node click with D3 event pattern
graph.on('nodeClick', function(event, d) {
  // event: D3 event object
  // d: node data
  // this: DOM element
  
  const neighbors = graph.neighbors(d.id);
  const edges = graph.adjacentEdges(d.id);
  
  // Highlight neighbors
  graph.highlightNodes(neighbors);
  graph.highlightEdges(edges);
});

// Node hover
graph.on('nodeMouseover', function(event, d) {
  // Show tooltip
  d3.select(this)
    .transition()
    .duration(200)
    .attr('r', graph.nodeRadius()(d) * 1.2);
});

graph.on('nodeMouseout', function(event, d) {
  d3.select(this)
    .transition()
    .duration(200)
    .attr('r', graph.nodeRadius()(d));
});
```

### Selection API

```javascript
// Programmatic selection
graph.selectNode('node-id-1');
graph.selectNodes(['node-1', 'node-2', 'node-3']);
graph.deselectAll();

// Get selection state
const selected = graph.selectedNodes();  // Returns array of node IDs
const highlighted = graph.highlightedNodes();  // Returns Set of node IDs

// Selection with neighbor highlighting
graph.selectNode('node-1', {
  highlightNeighbors: true,
  depth: 2,  // Highlight 2 levels of neighbors
  includeEdges: true
});

// Selection events
graph.on('selectionChange', function(selected, highlighted) {
  console.log('Selected:', selected);
  console.log('Highlighted:', highlighted);
});
```

### Zoom and Pan API

```javascript
// Zoom behavior following D3 patterns
const zoom = graph.zoom();  // Returns D3 zoom behavior

// Programmatic zoom
graph.zoomTo(2.0);  // Zoom to scale 2.0
graph.zoomTo(2.0, [400, 300]);  // Zoom to scale 2.0 centered at [400, 300]
graph.zoomToFit();  // Fit entire graph in viewport
graph.zoomToFit(50);  // Fit with 50px padding
graph.zoomToSelection();  // Zoom to selected nodes
graph.resetZoom();  // Reset to identity transform

// Pan control
graph.panTo(100, 200);  // Pan to position
graph.centerOn('node-id');  // Center view on specific node

// Zoom events
graph.on('zoom', function(transform) {
  // transform: D3 zoom transform
  // { k: scale, x: translateX, y: translateY }
  console.log('Zoom level:', transform.k);
});
```

### Drag Behavior

```javascript
// Drag behavior following D3 patterns
graph.on('dragStart', function(event, d) {
  // Fix node position during drag
  d.fx = d.x;
  d.fy = d.y;
  
  // Restart simulation with higher alpha
  graph.simulation()
    .alphaTarget(0.3)
    .restart();
});

graph.on('drag', function(event, d) {
  // Update fixed position
  d.fx = event.x;
  d.fy = event.y;
});

graph.on('dragEnd', function(event, d) {
  // Release fixed position
  d.fx = null;
  d.fy = null;
  
  // Cool down simulation
  graph.simulation()
    .alphaTarget(0);
});
```

## Force Simulation API

### Direct Simulation Access

```javascript
// Get D3 force simulation
const simulation = graph.simulation();

// Modify forces
simulation.force('charge')
  .strength(d => -500 * d.importance);

simulation.force('link')
  .distance(d => d.weight ? 50 / d.weight : 100);

// Add custom force
simulation.force('clustering', clusteringForce()
  .strength(0.5)
  .centers(clusterCenters));

// Control simulation
simulation
  .alpha(0.5)
  .restart();

// Simulation events
simulation.on('tick', function() {
  // Custom tick handling
});

simulation.on('end', function() {
  // Simulation stabilized
  graph.trigger('simulationEnd');
});
```

### Custom Forces

```javascript
// Add custom forces using D3 patterns
graph.force('radial', d3.forceRadial()
  .radius(d => d.level * 100)
  .strength(0.8));

graph.force('boundary', boundaryForce()
  .bounds({ x: [0, width], y: [0, height] })
  .strength(0.1));

// Remove force
graph.force('radial', null);
```

## Transition API

### D3 Transition Support

```javascript
// Configure default transition
graph
  .defaultTransition(d3.transition()
    .duration(750)
    .ease(d3.easeCubicInOut));

// Animated updates
graph.updateNodes(newNodeData, {
  transition: true,
  duration: 1000,
  delay: (d, i) => i * 10
});

graph.updateEdges(newEdgeData, {
  transition: true,
  duration: 500
});

// Animated layout changes
graph
  .transition()
  .duration(2000)
  .call(graph.layoutAlgorithm, 'radial');
```

## Error Handling API

### Error Events

```javascript
graph.on('error', function(error, context) {
  // error: Error object with details
  // context: {
  //   phase: 'edge_rendering',
  //   operation: 'bundling',
  //   recoverable: true,
  //   fallback: 'simple',
  //   data: { edgeCount: 5000 }
  // }
  
  if (context.recoverable) {
    // Attempt recovery
    graph.recover(context.fallback);
  } else {
    // Show error UI
    showError(error.message);
  }
});

// Validation errors
graph.on('validationError', function(errors) {
  // errors: Array of validation issues
  // [{
  //   type: 'missing_node',
  //   edge: 'edge-1',
  //   node: 'node-99',
  //   message: 'Edge references non-existent node'
  // }]
});
```

## Lifecycle API

### Component Lifecycle

```javascript
// Initialization
graph.on('init', function(config) {
  console.log('Graph initialized with config:', config);
});

// Ready state
graph.on('ready', function(stats) {
  // stats: {
  //   renderTime: 2500,
  //   nodeCount: 150,
  //   edgeCount: 450,
  //   layoutIterations: 300
  // }
  console.log('Graph ready:', stats);
});

// Disposal
graph.on('dispose', function() {
  console.log('Graph disposed');
});

// Manual lifecycle control
graph.init(container);
graph.render();
graph.dispose();
```

## Data Update API

### Live Data Updates

```javascript
// Update entire dataset
graph.data(newData);
graph.render();

// Incremental updates
graph.addNodes(newNodes);
graph.addEdges(newEdges);
graph.removeNodes(nodeIds);
graph.removeEdges(edgeIds);

// Update with merge strategy
graph.updateData(partialData, {
  merge: true,
  key: d => d.id,
  updateOnly: false
});

// Batch updates
graph.startBatch();
graph.addNodes(nodes1);
graph.addEdges(edges1);
graph.removeNodes(oldNodeIds);
graph.endBatch();  // Triggers single re-render
```

## Performance Monitoring API

### Performance Events

```javascript
graph.on('performanceUpdate', function(metrics) {
  // metrics: {
  //   fps: 45,
  //   renderTime: 16.7,  // ms per frame
  //   layoutTime: 2500,  // total layout time
  //   edgeRenderTime: 1500,  // total edge render time
  //   memoryUsage: 45.2,  // MB
  //   nodeCount: 500,
  //   edgeCount: 1500,
  //   visibleNodes: 450,
  //   visibleEdges: 1200
  // }
});

// Frame drops
graph.on('frameDrop', function(info) {
  // info: {
  //   targetFPS: 60,
  //   actualFPS: 15,
  //   duration: 250,  // ms of low FPS
  //   cause: 'edge_rendering'
  // }
});
```

## Method Chaining Examples

### Complete Configuration Chain

```javascript
const graph = knowledgeNetwork()
  // Dimensions
  .width(1200)
  .height(800)
  
  // Data
  .data(graphData)
  
  // Visual encoding
  .nodeRadius(d => Math.sqrt(d.value) * 2)
  .nodeFill(d => colorScale(d.category))
  .linkStroke(d => d.type === 'strong' ? '#333' : '#999')
  
  // Forces
  .chargeStrength(-300)
  .linkDistance(50)
  
  // Rendering
  .edgeRenderer('bundled')
  .bundlingStrength(0.85)
  
  // Behavior
  .enableZoom(true)
  .enableDrag(true)
  
  // Events
  .on('stateChange', handleStateChange)
  .on('nodeClick', handleNodeClick)
  .on('error', handleError)
  .on('ready', handleReady);

// Render to container
d3.select('#container').call(graph);
```

### Progressive Enhancement

```javascript
// Start with basic graph
const graph = knowledgeNetwork()
  .data(graphData);

// Progressively add features
graph
  .nodeRadius(d => d.importance * 5)
  .nodeFill(d => d.color);

// Add interactions later
graph
  .enableZoom(true)
  .on('nodeClick', showDetails);

// Add performance monitoring
graph
  .on('performanceUpdate', updateMetrics)
  .on('frameDrop', handlePerformanceIssue);

// Render when ready
d3.select('#container').call(graph);
```

## Testing Requirements

### Unit Test Coverage

```javascript
describe('KnowledgeNetwork D3 API', () => {
  describe('Configuration API', () => {
    it('should support method chaining', () => {
      const graph = knowledgeNetwork()
        .width(800)
        .height(600)
        .nodeRadius(10);
      
      expect(graph.width()).toBe(800);
      expect(graph.height()).toBe(600);
      expect(graph.nodeRadius()()).toBe(10);
    });
    
    it('should accept accessor functions', () => {
      const accessor = d => d.value * 2;
      const graph = knowledgeNetwork()
        .nodeRadius(accessor);
      
      const result = graph.nodeRadius()({ value: 5 }, 0, []);
      expect(result).toBe(10);
    });
  });
  
  describe('Event System', () => {
    it('should trigger callbacks in correct order', (done) => {
      const events = [];
      const graph = knowledgeNetwork()
        .on('stateChange', () => events.push('state'))
        .on('layoutProgress', () => events.push('layout'))
        .on('ready', () => {
          expect(events).toEqual(['state', 'layout', 'state']);
          done();
        });
      
      d3.select(container).datum(data).call(graph);
    });
  });
  
  describe('Selection API', () => {
    it('should highlight neighbors on selection', () => {
      const graph = knowledgeNetwork();
      graph.selectNode('node-1', { highlightNeighbors: true });
      
      const highlighted = graph.highlightedNodes();
      expect(highlighted.size).toBeGreaterThan(1);
    });
  });
});
```

## Migration Guide

### From Current Implementation to D3 Idiomatic

```javascript
// Current approach
const graph = new KnowledgeGraph(container, data, config);
graph.render();

// New D3 idiomatic approach  
const graph = knowledgeNetwork()
  .width(config.width)
  .height(config.height)
  .nodeRadius(config.nodeRadius);

d3.select(container)
  .datum(data)
  .call(graph);
```

## Version History

- **v3.0.0**: Complete D3.js idiomatic redesign
- **v2.0.0**: Previous class-based implementation
- **v1.0.0**: Initial release

## References

- [D3.js API Reference](https://github.com/d3/d3/blob/main/API.md)
- [D3 Force Layout](https://github.com/d3/d3-force)
- [D3 Selection](https://github.com/d3/d3-selection)
- [D3 Transition](https://github.com/d3/d3-transition)
- [Reusable Charts Pattern](https://bost.ocks.org/mike/chart/)
