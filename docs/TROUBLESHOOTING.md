# Troubleshooting Guide

**Common issues and solutions for the knowledge-network library**

---

## Installation Issues

### ❌ "Cannot resolve module '@aigeeksquad/knowledge-network'"

**Problem**: Module not found or import errors

**Solutions:**
```bash
# Verify installation
npm list @aigeeksquad/knowledge-network

# Reinstall if missing
npm install @aigeeksquad/knowledge-network d3

# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Module has no exported member 'KnowledgeGraph'"

**Problem**: Import statement incorrect or module structure issues

**Solution:**
```typescript
// ✅ Correct import
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

// ❌ Incorrect imports
import KnowledgeGraph from '@aigeeksquad/knowledge-network';  // No default export
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network/dist';  // Don't import from dist
```

### ❌ TypeScript compilation errors

**Problem**: Missing type definitions or version conflicts

**Solutions:**
```bash
# Install required peer dependencies
npm install d3 @types/d3

# Check versions compatibility
npm list d3
# Should be d3@7.x for compatibility

# Update TypeScript if needed (requires 4.5+)
npm install -D typescript@latest
```

---

## Rendering Issues

### ❌ Graph not appearing

**Problem**: Container element missing dimensions or not found

**Common causes:**
1. Container element doesn't exist when graph initializes
2. Container has no width/height dimensions
3. Container is hidden (display: none)

**Solutions:**
```typescript
// ✅ Verify container exists and has dimensions
const container = document.getElementById('graph-container');
if (!container) {
  throw new Error('Container element not found');
}

// ✅ Ensure container has dimensions
container.style.width = '800px';
container.style.height = '600px';

// ✅ Or use CSS
/* CSS */
#graph-container {
  width: 100%;
  height: 400px;
  min-height: 400px;  /* Prevents collapse */
}
```

### ❌ "Cannot read property of undefined" errors

**Problem**: Data structure doesn't match expected format

**Check your data structure:**
```typescript
// ✅ Correct data structure
const data = {
  nodes: [
    { id: 'unique-id', label: 'Display Name' }  // id is required
  ],
  edges: [
    { source: 'valid-node-id', target: 'another-valid-id' }  // Must reference existing node ids
  ]
};

// ❌ Common mistakes
const badData = {
  vertices: [...],  // Should be 'nodes'
  links: [...],     // Should be 'edges'
  nodes: [
    { name: 'Node1' }  // Missing required 'id' field
  ],
  edges: [
    { from: 'A', to: 'B' }  // Should be 'source' and 'target'
  ]
};
```

### ❌ Nodes or edges not visible

**Problem**: Styling configuration issues or data problems

**Debug steps:**
```typescript
// 1. Check data is loaded
console.log('Nodes:', data.nodes.length);
console.log('Edges:', data.edges.length);

// 2. Check basic rendering
const graph = new KnowledgeGraph(container, data, {
  // Use default styling first
  nodeRadius: 10,
  nodeFill: '#ff0000',  // Bright color for visibility
  linkStroke: '#0000ff',
  linkStrokeWidth: 3
});

// 3. Check for errors
graph.render().catch(console.error);
```

---

## Edge Bundling Issues

### ❌ Edge bundling not working

**Problem**: Edges appear as straight lines instead of bundled curves

**Common causes:**
1. `waitForStable: false` (bundling needs stable layout)
2. Too few edges to bundle effectively
3. Edges don't meet compatibility threshold

**Solutions:**
```typescript
// ✅ Enable proper edge bundling
const graph = new KnowledgeGraph(container, data, {
  edgeRenderer: 'bundled',          // Enable bundling
  waitForStable: true,              // Critical: wait for layout stability
  stabilityThreshold: 0.005,        // Lower = more stable before bundling

  edgeBundling: {
    compatibilityThreshold: 0.3,    // Lower = more aggressive bundling
    iterations: 120,                // More iterations = more bundling
    subdivisions: 40                // More subdivisions = smoother curves
  }
});
```

### ❌ Edge bundling performance issues

**Problem**: Slow rendering or browser freezing with edge bundling

**Solutions:**
```typescript
// Optimize for performance
const config = {
  edgeRenderer: 'bundled',
  waitForStable: true,

  edgeBundling: {
    // Reduce computational load
    subdivisions: 20,               // Fewer points (vs default 60)
    iterations: 60,                 // Fewer iterations (vs default 120)
    compatibilityThreshold: 0.6,    // Higher = less aggressive bundling

    // For very large graphs (1000+ edges)
    stepSize: 0.08                  // Larger steps = faster convergence
  }
};

// Or disable for very large graphs
if (data.edges.length > 5000) {
  config.edgeRenderer = 'simple';  // Skip bundling entirely
}
```

---

## Performance Issues

### ❌ Slow rendering with large graphs

**Problem**: Browser becomes unresponsive with large datasets

**Solutions by graph size:**

```typescript
// Small graphs (< 100 nodes): Full features
const smallGraphConfig = {
  edgeRenderer: 'bundled',
  enableZoom: true,
  enableDrag: true
};

// Medium graphs (100-1000 nodes): Optimized bundling
const mediumGraphConfig = {
  edgeRenderer: 'bundled',
  edgeBundling: {
    iterations: 60,        // Reduce from default 120
    subdivisions: 30       // Reduce from default 60
  },
  nodeRadius: 8,           // Fixed instead of function
  enableDrag: true
};

// Large graphs (1000-5000 nodes): Minimal styling
const largeGraphConfig = {
  edgeRenderer: 'simple',  // Skip bundling
  nodeRadius: 5,           // Small, fixed size
  nodeFill: '#4ecdc4',     // Fixed color
  chargeStrength: -50,     // Weaker forces
  enableDrag: false        // Disable for performance
};

// Very large graphs (5000+ nodes): Consider data reduction
if (data.nodes.length > 5000) {
  // Filter or cluster data before visualization
  data = filterMostImportantNodes(data, 5000);
}
```

### ❌ Memory leaks in single-page applications

**Problem**: Memory usage grows over time in SPAs

**Solution**: Always destroy graph instances
```typescript
// React
useEffect(() => {
  const graph = new KnowledgeGraph(container, data);
  graph.render();

  return () => {
    graph.destroy();  // Critical for preventing memory leaks
  };
}, [data]);

// Vue
beforeUnmount() {
  this.graph?.destroy();
},

// Angular
ngOnDestroy() {
  this.graph?.destroy();
}

// Vanilla JS
window.addEventListener('beforeunload', () => {
  graph.destroy();
});
```

---

## Data Structure Issues

### ❌ "Node with id 'X' not found" errors

**Problem**: Edge references non-existent node

**Debug and fix:**
```typescript
// Check for orphaned edges
function validateGraphData(data) {
  const nodeIds = new Set(data.nodes.map(n => n.id));

  const invalidEdges = data.edges.filter(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

    return !nodeIds.has(sourceId) || !nodeIds.has(targetId);
  });

  if (invalidEdges.length > 0) {
    console.error('Invalid edges found:', invalidEdges);
    // Remove invalid edges
    data.edges = data.edges.filter(edge => !invalidEdges.includes(edge));
  }

  return data;
}

// Use before creating graph
const cleanData = validateGraphData(rawData);
const graph = new KnowledgeGraph(container, cleanData);
```

### ❌ Duplicate node IDs

**Problem**: Multiple nodes with same ID causing rendering issues

**Solution:**
```typescript
function ensureUniqueNodeIds(data) {
  const seen = new Set();
  const duplicates = [];

  data.nodes.forEach((node, index) => {
    if (seen.has(node.id)) {
      duplicates.push({ node, index });
    } else {
      seen.add(node.id);
    }
  });

  if (duplicates.length > 0) {
    console.warn('Duplicate node IDs found:', duplicates);

    // Fix by appending index to duplicates
    duplicates.forEach(({ node, index }) => {
      node.id = `${node.id}_${index}`;
    });
  }

  return data;
}
```

---

## Framework-Specific Issues

### React Issues

**❌ Graph re-renders on every state change**
```typescript
// ✅ Memoize configuration object
const config = useMemo(() => ({
  nodeRadius: 10,
  edgeRenderer: 'bundled'
}), []);

// ✅ Stable references for callbacks
const onNodeSelected = useCallback((nodeId) => {
  setSelectedNode(nodeId);
}, []);
```

**❌ "Warning: Can't perform state update on unmounted component"**
```typescript
// ✅ Use cleanup function
useEffect(() => {
  let mounted = true;

  graph.render().then(() => {
    if (mounted) {
      setIsLoading(false);
    }
  });

  return () => {
    mounted = false;
    graph.destroy();
  };
}, []);
```

### Vue Issues

**❌ Reactivity interfering with D3**
```vue
<script setup>
// ✅ Use shallowRef for graph instance
import { shallowRef } from 'vue';

const graph = shallowRef(null);

// ✅ Avoid reactive data in D3 operations
const graphData = toRaw(props.data);
</script>
```

### Angular Issues

**❌ Change detection triggering unnecessary updates**
```typescript
// ✅ Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ Detach from Angular zone for D3 operations
constructor(private ngZone: NgZone) {}

initGraph() {
  this.ngZone.runOutsideAngular(() => {
    this.graph = new KnowledgeGraph(...);
    this.graph.render();
  });
}
```

---

## Browser Compatibility

### Supported Browsers

| Browser | Minimum Version | Notes |
|---------|----------------|--------|
| Chrome | 88+ | Full support |
| Firefox | 78+ | Full support |
| Safari | 14+ | Full support |
| Edge | 88+ | Full support |

### ❌ "d3 is not defined" in older browsers

**Problem**: ES modules not supported

**Solution**: Use bundled version or polyfills
```html
<!-- For older browsers -->
<script src="https://unpkg.com/d3@7"></script>
<script src="https://unpkg.com/@aigeeksquad/knowledge-network/dist/umd/index.js"></script>

<script>
  // Access via global
  const { KnowledgeGraph } = window.KnowledgeNetwork;
</script>
```

---

## Development Issues

### ❌ Hot reload breaks graph

**Problem**: Development server hot reload causes graph to break

**Solution**: Proper cleanup in development
```typescript
// React with hot reload
if (module.hot) {
  module.hot.dispose(() => {
    graph?.destroy();
  });
}

// Vite development
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    graph?.destroy();
  });
}
```

### ❌ Test environment issues

**Problem**: Tests fail because DOM elements not available

**Solution**: Proper test setup
```typescript
// Jest/Vitest setup
import { beforeEach, afterEach } from 'vitest';

describe('KnowledgeGraph tests', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    // Create test container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });
});
```

---

## Getting Help

### Debug Information to Collect

When reporting issues, please include:

```typescript
// 1. Library version
console.log('Version:', require('@aigeeksquad/knowledge-network/package.json').version);

// 2. Data structure sample
console.log('Sample data:', {
  nodeCount: data.nodes.length,
  edgeCount: data.edges.length,
  sampleNode: data.nodes[0],
  sampleEdge: data.edges[0]
});

// 3. Configuration used
console.log('Config:', config);

// 4. Browser and environment
console.log('User agent:', navigator.userAgent);
console.log('Viewport:', { width: window.innerWidth, height: window.innerHeight });

// 5. Console errors
// Copy any error messages from browser console
```

### Enable Debug Mode

```typescript
// Add debug callbacks to see internal state
const debugConfig = {
  ...yourConfig,

  onStateChange: (state, progress) => {
    console.log(`[DEBUG] State: ${state}, Progress: ${progress}%`);
  },

  onLayoutProgress: (alpha, progress) => {
    console.log(`[DEBUG] Layout progress: ${progress}%, alpha: ${alpha}`);
  },

  onEdgeRenderingProgress: (rendered, total) => {
    console.log(`[DEBUG] Edge rendering: ${rendered}/${total}`);
  },

  onError: (error, stage) => {
    console.error(`[DEBUG] Error in ${stage}:`, error);
  }
};
```

### Common Debugging Commands

```javascript
// In browser console:

// Check if graph exists
console.log(window.graph || 'Graph not found');

// Inspect D3 simulation
const sim = graph.getSimulation();
console.log('Simulation alpha:', sim?.alpha());
console.log('Simulation nodes:', sim?.nodes());

// Check DOM elements
console.log('SVG elements:', document.querySelectorAll('svg'));
console.log('Node elements:', document.querySelectorAll('.node'));
console.log('Edge elements:', document.querySelectorAll('.edge'));
```

### Performance Debugging

```typescript
// Measure rendering performance
console.time('graph-render');

const graph = new KnowledgeGraph(container, data, {
  onStateChange: (state) => {
    console.log(`State: ${state} at ${Date.now()}`);
    if (state === 'ready') {
      console.timeEnd('graph-render');
    }
  }
});

graph.render();
```

---

## FAQ

### Q: Can I use this library with Server-Side Rendering (SSR)?

**A:** No, the library requires a browser DOM environment. Use dynamic imports in SSR frameworks:

```typescript
// Next.js
import dynamic from 'next/dynamic';

const KnowledgeGraph = dynamic(
  () => import('./components/KnowledgeGraph'),
  { ssr: false }
);

// Nuxt.js
<KnowledgeGraph v-if="$nuxt.$client" :data="graphData" />
```

### Q: How do I customize node and edge appearance?

**A:** Use accessor functions for data-driven styling:

```typescript
const config = {
  // Node styling
  nodeRadius: (node) => node.metadata?.size || 10,
  nodeFill: (node) => node.metadata?.color || '#69b3a2',

  // Edge styling
  linkStroke: (edge) => edge.type === 'important' ? '#ff0000' : '#999',
  linkStrokeWidth: (edge) => edge.weight ? edge.weight * 3 : 1
};
```

### Q: Can I export the graph as an image?

**A:** Yes, use standard SVG/Canvas export techniques:

```typescript
// For SVG renderer (default)
function exportSVG() {
  const svg = container.querySelector('svg');
  const svgData = new XMLSerializer().serializeToString(svg);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  return URL.createObjectURL(blob);
}

// For Canvas renderer
function exportCanvas() {
  const canvas = container.querySelector('canvas');
  return canvas.toDataURL('image/png');
}
```

### Q: How do I handle very large graphs (10,000+ nodes)?

**A:** Use data reduction and performance optimizations:

```typescript
// 1. Data filtering/clustering
const filteredData = {
  nodes: data.nodes.filter(node => node.metadata?.importance > 0.7),
  edges: data.edges.filter(edge => edge.weight > 0.5)
};

// 2. Performance config
const performanceConfig = {
  edgeRenderer: 'simple',     // Skip bundling
  nodeRadius: 3,              // Small nodes
  enableDrag: false,          // Disable interaction
  stabilityThreshold: 0.1     // Less precision for speed
};

// 3. Consider virtualization for massive datasets
// Implement view-dependent node rendering
```

### Q: Can I customize the force simulation parameters?

**A:** Yes, access the D3 simulation directly:

```typescript
const graph = new KnowledgeGraph(container, data, config);
graph.render();

// Access D3 simulation for advanced customization
const simulation = graph.getSimulation();
if (simulation) {
  simulation
    .force('charge', d3.forceCollide().radius(20))
    .force('center', d3.forceCenter(400, 300))
    .alpha(1)
    .restart();
}
```

### Q: How do I implement custom themes?

**A:** Define theme objects and apply via configuration:

```typescript
const themes = {
  dark: {
    nodeFill: '#ffffff',
    nodeStroke: '#333333',
    linkStroke: '#666666',
    background: '#1a1a1a'
  },
  light: {
    nodeFill: '#333333',
    nodeStroke: '#ffffff',
    linkStroke: '#999999',
    background: '#ffffff'
  }
};

function applyTheme(themeName) {
  const theme = themes[themeName];
  container.style.backgroundColor = theme.background;

  graph.updateConfig({
    nodeFill: theme.nodeFill,
    nodeStroke: theme.nodeStroke,
    linkStroke: theme.linkStroke
  });
}
```

---

## Still Need Help?

### Community Resources

- **[📚 Complete API Reference](../packages/knowledge-network/README.md)** - Comprehensive API documentation
- **[🔧 Integration Guide](./INTEGRATION_GUIDE.md)** - Framework integration patterns
- **[⚡ Performance Guide](./PERFORMANCE_GUIDE.md)** - Performance optimization strategies

### Report Issues

If you've found a bug or need additional help:

1. **Search existing issues**: [GitHub Issues](https://github.com/aigeeksquad/knowledge-network/issues)
2. **Create detailed bug report** including:
   - Library version
   - Browser and version
   - Sample data and configuration
   - Expected vs actual behavior
   - Console error messages
   - Minimal reproduction case

### Feature Requests

Have an idea for improving the library?

1. **Check existing discussions**: [GitHub Discussions](https://github.com/aigeeksquad/knowledge-network/discussions)
2. **Propose new features** with:
   - Clear use case description
   - Expected API design
   - Examples of how it would be used

---

**Last Updated**: Auto-maintained with library releases