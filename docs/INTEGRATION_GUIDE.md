# Integration Guide

**Framework integration patterns for React, Vue, Angular, and vanilla JavaScript**

---

## Overview

The knowledge-network library integrates seamlessly with modern web frameworks while maintaining optimal performance and proper lifecycle management. This guide provides tested patterns and best practices for each major framework.

---

## React Integration

### Basic Hook Pattern

```typescript
import { useEffect, useRef, useState } from 'react';
import { KnowledgeGraph, GraphData, LayoutEngineState } from '@aigeeksquad/knowledge-network';

interface KnowledgeGraphProps {
  data: GraphData;
  config?: GraphConfig;
  onNodeSelected?: (nodeId: string) => void;
}

export const KnowledgeGraphComponent: React.FC<KnowledgeGraphProps> = ({
  data,
  config,
  onNodeSelected
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<KnowledgeGraph | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create graph instance
    graphRef.current = new KnowledgeGraph(
      containerRef.current,
      data,
      {
        ...config,
        onStateChange: (state, progress) => {
          setIsLoading(state !== LayoutEngineState.READY);
          config?.onStateChange?.(state, progress);
        },
        onNodeSelected: (nodeId, neighbors, edges) => {
          onNodeSelected?.(nodeId);
          config?.onNodeSelected?.(nodeId, neighbors, edges);
        }
      }
    );

    // Render graph
    graphRef.current.render();

    // Cleanup on unmount
    return () => {
      graphRef.current?.destroy();
      graphRef.current = null;
    };
  }, [data, config, onNodeSelected]);

  return (
    <div className="knowledge-graph-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner">Loading graph...</div>
        </div>
      )}
      <div
        ref={containerRef}
        className="knowledge-graph"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
```

### Advanced React Pattern with State Management

```typescript
import { useKnowledgeGraph } from './hooks/useKnowledgeGraph';

export const AdvancedGraphComponent: React.FC<{
  initialData: GraphData;
}> = ({ initialData }) => {
  const {
    containerRef,
    graph,
    data,
    selectedNode,
    isLoading,
    error,
    updateData,
    selectNode,
    clearSelection
  } = useKnowledgeGraph(initialData, {
    edgeRenderer: 'bundled',
    waitForStable: true
  });

  return (
    <div className="graph-container">
      <div className="graph-controls">
        <button onClick={clearSelection}>Clear Selection</button>
        {selectedNode && (
          <div className="selection-info">
            Selected: {selectedNode.label || selectedNode.id}
          </div>
        )}
      </div>

      {error && (
        <div className="error">Error: {error.message}</div>
      )}

      <div ref={containerRef} className="graph-canvas" />
    </div>
  );
};
```

### Custom React Hook

```typescript
// hooks/useKnowledgeGraph.ts
import { useRef, useState, useEffect, useCallback } from 'react';
import { KnowledgeGraph, GraphData, GraphConfig, Node } from '@aigeeksquad/knowledge-network';

export function useKnowledgeGraph(
  initialData: GraphData,
  config: GraphConfig = {}
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<KnowledgeGraph | null>(null);

  const [data, setData] = useState<GraphData>(initialData);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize graph
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      graphRef.current = new KnowledgeGraph(
        containerRef.current,
        data,
        {
          ...config,
          onStateChange: (state, progress) => {
            setIsLoading(state !== 'ready');
            setError(state === 'error' ? new Error('Rendering failed') : null);
          },
          onNodeSelected: (nodeId) => {
            const node = data.nodes.find(n => n.id === nodeId);
            setSelectedNode(node || null);
          },
          onError: (err) => setError(err)
        }
      );

      graphRef.current.render();
    } catch (err) {
      setError(err as Error);
    }

    return () => {
      graphRef.current?.destroy();
    };
  }, [data, config]);

  // Update data efficiently
  const updateData = useCallback((newData: GraphData) => {
    setData(newData);
    graphRef.current?.updateData(newData);
  }, []);

  // Node selection
  const selectNode = useCallback((nodeId: string) => {
    graphRef.current?.selectNode(nodeId);
  }, []);

  const clearSelection = useCallback(() => {
    graphRef.current?.clearSelection();
    setSelectedNode(null);
  }, []);

  return {
    containerRef,
    graph: graphRef.current,
    data,
    selectedNode,
    isLoading,
    error,
    updateData,
    selectNode,
    clearSelection
  };
}
```

---

## Vue Integration

### Composition API (Vue 3)

```vue
<template>
  <div class="knowledge-graph-wrapper">
    <div v-if="isLoading" class="loading">
      Loading graph...
    </div>
    <div
      ref="containerRef"
      class="graph-container"
      :style="{ width: '100%', height: '400px' }"
    />
    <div v-if="selectedNode" class="selection-info">
      Selected: {{ selectedNode.label || selectedNode.id }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { KnowledgeGraph, GraphData, GraphConfig, Node } from '@aigeeksquad/knowledge-network';

interface Props {
  data: GraphData;
  config?: GraphConfig;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  nodeSelected: [nodeId: string];
  error: [error: Error];
}>();

const containerRef = ref<HTMLDivElement>();
const graph = ref<KnowledgeGraph | null>(null);
const isLoading = ref(true);
const selectedNode = ref<Node | null>(null);

onMounted(() => {
  if (!containerRef.value) return;

  graph.value = new KnowledgeGraph(
    containerRef.value,
    props.data,
    {
      ...props.config,
      onStateChange: (state, progress) => {
        isLoading.value = state !== 'ready';
      },
      onNodeSelected: (nodeId, neighbors, edges) => {
        const node = props.data.nodes.find(n => n.id === nodeId);
        selectedNode.value = node || null;
        emit('nodeSelected', nodeId);
      },
      onError: (error) => {
        emit('error', error);
      }
    }
  );

  graph.value.render();
});

onUnmounted(() => {
  graph.value?.destroy();
});

// Watch for data changes
watch(() => props.data, (newData) => {
  graph.value?.updateData(newData);
}, { deep: true });
</script>
```

### Options API (Vue 2/3)

```vue
<template>
  <div class="knowledge-graph-wrapper">
    <div v-if="isLoading">Loading...</div>
    <div ref="container" class="graph-container" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { KnowledgeGraph, GraphData, GraphConfig } from '@aigeeksquad/knowledge-network';

export default defineComponent({
  name: 'KnowledgeGraphComponent',
  props: {
    data: {
      type: Object as PropType<GraphData>,
      required: true
    },
    config: {
      type: Object as PropType<GraphConfig>,
      default: () => ({})
    }
  },
  data() {
    return {
      graph: null as KnowledgeGraph | null,
      isLoading: true
    };
  },
  mounted() {
    this.initializeGraph();
  },
  beforeUnmount() {
    this.graph?.destroy();
  },
  watch: {
    data: {
      handler() {
        this.graph?.updateData(this.data);
      },
      deep: true
    }
  },
  methods: {
    initializeGraph() {
      if (!this.$refs.container) return;

      this.graph = new KnowledgeGraph(
        this.$refs.container as HTMLElement,
        this.data,
        {
          ...this.config,
          onStateChange: (state) => {
            this.isLoading = state !== 'ready';
          },
          onNodeSelected: (nodeId, neighbors, edges) => {
            this.$emit('node-selected', nodeId, neighbors, edges);
          }
        }
      );

      this.graph.render();
    }
  }
});
</script>
```

---

## Angular Integration

### Component with Service

```typescript
// knowledge-graph.component.ts
import {
  Component,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ViewChild,
  Output,
  EventEmitter
} from '@angular/core';
import { KnowledgeGraph, GraphData, GraphConfig, LayoutEngineState } from '@aigeeksquad/knowledge-network';

@Component({
  selector: 'app-knowledge-graph',
  template: `
    <div class="knowledge-graph-wrapper">
      <div *ngIf="isLoading" class="loading-overlay">
        <div class="spinner">Loading graph...</div>
      </div>
      <div
        #container
        class="graph-container"
        [style.width]="'100%'"
        [style.height]="'100%'"
      ></div>
      <div *ngIf="selectedNodeId" class="selection-info">
        Selected: {{ getSelectedNodeLabel() }}
      </div>
    </div>
  `,
  styleUrls: ['./knowledge-graph.component.scss']
})
export class KnowledgeGraphComponent implements OnInit, OnDestroy, OnChanges {
  @Input() data!: GraphData;
  @Input() config: GraphConfig = {};

  @Output() nodeSelected = new EventEmitter<{
    nodeId: string;
    neighbors: string[];
    edges: string[];
  }>();

  @Output() stateChanged = new EventEmitter<{
    state: LayoutEngineState;
    progress: number;
  }>();

  @ViewChild('container', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  private graph: KnowledgeGraph | null = null;
  public isLoading = true;
  public selectedNodeId: string | null = null;

  ngOnInit(): void {
    this.initializeGraph();
  }

  ngOnDestroy(): void {
    this.graph?.destroy();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.graph) {
      this.graph.updateData(this.data);
    }
  }

  private initializeGraph(): void {
    if (!this.containerRef?.nativeElement) return;

    this.graph = new KnowledgeGraph(
      this.containerRef.nativeElement,
      this.data,
      {
        ...this.config,
        onStateChange: (state, progress) => {
          this.isLoading = state !== LayoutEngineState.READY;
          this.stateChanged.emit({ state, progress });
        },
        onNodeSelected: (nodeId, neighbors, edges) => {
          this.selectedNodeId = nodeId;
          this.nodeSelected.emit({ nodeId, neighbors, edges });
        }
      }
    );

    this.graph.render();
  }

  public getSelectedNodeLabel(): string {
    if (!this.selectedNodeId) return '';
    const node = this.data.nodes.find(n => n.id === this.selectedNodeId);
    return node?.label || node?.id || '';
  }

  public selectNode(nodeId: string): void {
    this.graph?.selectNode(nodeId);
  }

  public clearSelection(): void {
    this.graph?.clearSelection();
    this.selectedNodeId = null;
  }
}
```

### Angular Service Pattern

```typescript
// knowledge-graph.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { KnowledgeGraph, GraphData, LayoutEngineState } from '@aigeeksquad/knowledge-network';

@Injectable({
  providedIn: 'root'
})
export class KnowledgeGraphService {
  private graphs = new Map<string, KnowledgeGraph>();
  private stateSubject = new BehaviorSubject<{
    graphId: string;
    state: LayoutEngineState;
    progress: number;
  } | null>(null);

  public state$: Observable<any> = this.stateSubject.asObservable();

  createGraph(
    graphId: string,
    container: HTMLElement,
    data: GraphData,
    config?: GraphConfig
  ): KnowledgeGraph {
    // Clean up existing graph if exists
    this.destroyGraph(graphId);

    const graph = new KnowledgeGraph(container, data, {
      ...config,
      onStateChange: (state, progress) => {
        this.stateSubject.next({ graphId, state, progress });
        config?.onStateChange?.(state, progress);
      }
    });

    this.graphs.set(graphId, graph);
    return graph;
  }

  getGraph(graphId: string): KnowledgeGraph | null {
    return this.graphs.get(graphId) || null;
  }

  destroyGraph(graphId: string): void {
    const graph = this.graphs.get(graphId);
    if (graph) {
      graph.destroy();
      this.graphs.delete(graphId);
    }
  }

  destroyAllGraphs(): void {
    this.graphs.forEach(graph => graph.destroy());
    this.graphs.clear();
  }
}
```

### Angular Module Setup

```typescript
// knowledge-graph.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KnowledgeGraphComponent } from './knowledge-graph.component';

@NgModule({
  declarations: [
    KnowledgeGraphComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    KnowledgeGraphComponent
  ]
})
export class KnowledgeGraphModule { }
```

---

## Vue Integration (Options API)

### Vue 2 Compatible Pattern

```vue
<template>
  <div class="knowledge-graph-wrapper">
    <div v-if="loading" class="loading-state">
      Loading graph...
    </div>
    <div
      ref="graphContainer"
      class="graph-container"
      :style="containerStyle"
    />
  </div>
</template>

<script>
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

export default {
  name: 'KnowledgeGraph',
  props: {
    data: {
      type: Object,
      required: true
    },
    config: {
      type: Object,
      default: () => ({})
    },
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 600
    }
  },
  data() {
    return {
      graph: null,
      loading: true,
      selectedNodeId: null
    };
  },
  computed: {
    containerStyle() {
      return {
        width: `${this.width}px`,
        height: `${this.height}px`
      };
    }
  },
  mounted() {
    this.initGraph();
  },
  beforeDestroy() {
    if (this.graph) {
      this.graph.destroy();
    }
  },
  watch: {
    data: {
      handler() {
        if (this.graph) {
          this.graph.updateData(this.data);
        }
      },
      deep: true
    }
  },
  methods: {
    initGraph() {
      if (!this.$refs.graphContainer) return;

      this.graph = new KnowledgeGraph(
        this.$refs.graphContainer,
        this.data,
        {
          width: this.width,
          height: this.height,
          ...this.config,
          onStateChange: (state, progress) => {
            this.loading = state !== 'ready';
            this.$emit('state-change', { state, progress });
          },
          onNodeSelected: (nodeId, neighbors, edges) => {
            this.selectedNodeId = nodeId;
            this.$emit('node-selected', {
              nodeId,
              neighbors,
              edges
            });
          }
        }
      );

      this.graph.render();
    }
  }
};
</script>
```

---

## Vanilla JavaScript

### ES6 Modules

```javascript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

class GraphManager {
  constructor(containerId, data, config = {}) {
    this.container = document.getElementById(containerId);
    this.graph = null;
    this.data = data;
    this.config = config;

    this.init();
  }

  init() {
    if (!this.container) {
      throw new Error(`Container element not found`);
    }

    this.graph = new KnowledgeGraph(this.container, this.data, {
      ...this.config,
      onStateChange: (state, progress) => {
        this.handleStateChange(state, progress);
      },
      onNodeSelected: (nodeId, neighbors, edges) => {
        this.handleNodeSelection(nodeId, neighbors, edges);
      }
    });

    this.graph.render();
  }

  handleStateChange(state, progress) {
    const loadingEl = document.getElementById('loading-indicator');
    if (loadingEl) {
      loadingEl.style.display = state === 'ready' ? 'none' : 'block';
      loadingEl.textContent = `Loading: ${Math.round(progress)}%`;
    }
  }

  handleNodeSelection(nodeId, neighbors, edges) {
    // Update UI to show selection
    const infoEl = document.getElementById('node-info');
    if (infoEl) {
      const node = this.data.nodes.find(n => n.id === nodeId);
      infoEl.textContent = `Selected: ${node?.label || nodeId}`;
    }
  }

  updateData(newData) {
    this.data = newData;
    this.graph?.updateData(newData);
  }

  destroy() {
    this.graph?.destroy();
  }
}

// Usage
const graphManager = new GraphManager('my-graph', data, {
  edgeRenderer: 'bundled',
  nodeRadius: 10
});
```

### Traditional Script Tags

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/d3@7"></script>
  <script type="module">
    import { KnowledgeGraph } from 'https://cdn.jsdelivr.net/npm/@aigeeksquad/knowledge-network/+esm';

    // Your data
    const data = {
      nodes: [
        { id: 'A', label: 'Node A' },
        { id: 'B', label: 'Node B' }
      ],
      edges: [
        { source: 'A', target: 'B' }
      ]
    };

    // Initialize when DOM ready
    document.addEventListener('DOMContentLoaded', () => {
      const container = document.getElementById('graph');
      const graph = new KnowledgeGraph(container, data, {
        width: 800,
        height: 600,
        edgeRenderer: 'bundled'
      });

      graph.render();

      // Make available globally for debugging
      window.graph = graph;
    });
  </script>
</head>
<body>
  <div id="graph" style="width: 800px; height: 600px;"></div>
</body>
</html>
```

---

## Performance Best Practices

### Framework-Specific Optimizations

#### React Performance

```typescript
import { memo, useMemo, useCallback } from 'react';

export const KnowledgeGraphComponent = memo<KnowledgeGraphProps>(({
  data,
  config,
  onNodeSelected
}) => {
  // Memoize configuration to prevent unnecessary re-renders
  const memoizedConfig = useMemo(() => ({
    ...config,
    onNodeSelected: useCallback((nodeId, neighbors, edges) => {
      onNodeSelected?.(nodeId);
    }, [onNodeSelected])
  }), [config, onNodeSelected]);

  // Rest of component...
});
```

#### Vue Performance

```vue
<script setup lang="ts">
import { computed, toRefs } from 'vue';

const props = defineProps<Props>();

// Use computed for configuration to prevent reactivity overhead
const graphConfig = computed(() => ({
  ...props.config,
  onNodeSelected: (nodeId, neighbors, edges) => {
    emit('nodeSelected', nodeId);
  }
}));
</script>
```

#### Angular Performance

```typescript
// Use OnPush change detection for better performance
@Component({
  selector: 'app-knowledge-graph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '...'
})
export class KnowledgeGraphComponent {
  // Implement trackBy for data arrays
  trackByNodeId(index: number, node: Node): string {
    return node.id;
  }
}
```

---

## Common Integration Patterns

### Loading States

```typescript
// Pattern for all frameworks
const config = {
  onStateChange: (state, progress) => {
    const states = {
      'initial': 'Initializing...',
      'loading': 'Loading data...',
      'layout_calculating': `Calculating layout... ${Math.round(progress)}%`,
      'edge_generating': 'Rendering edges...',
      'zoom_fitting': 'Fitting to viewport...',
      'ready': '',
      'error': 'Error occurred'
    };

    updateLoadingMessage(states[state]);
  }
};
```

### Error Handling

```typescript
const config = {
  onError: (error, stage) => {
    console.error(`Graph error in ${stage}:`, error);

    // User-friendly error messages
    const userMessage = {
      'render': 'Failed to render graph. Check your data format.',
      'renderNodes': 'Failed to render nodes. Verify node data structure.',
      'renderEdges': 'Failed to render edges. Check edge references.'
    }[stage] || 'Unknown error occurred';

    showUserError(userMessage);
  }
};
```

### Responsive Graphs

```typescript
// Pattern for responsive graphs in any framework
function createResponsiveGraph(container, data, baseConfig = {}) {
  const updateDimensions = () => {
    const rect = container.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height
    };
  };

  const graph = new KnowledgeGraph(container, data, {
    ...baseConfig,
    ...updateDimensions()
  });

  // Handle window resize
  const resizeObserver = new ResizeObserver(() => {
    const newDimensions = updateDimensions();

    // Recreate graph with new dimensions
    graph.destroy();
    Object.assign(graph, new KnowledgeGraph(
      container,
      data,
      { ...baseConfig, ...newDimensions }
    ));
    graph.render();
  });

  resizeObserver.observe(container);

  return {
    graph,
    cleanup: () => {
      resizeObserver.disconnect();
      graph.destroy();
    }
  };
}
```

---

## Testing Integration

### Jest/Vitest Testing

```typescript
// __tests__/KnowledgeGraph.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph, GraphData } from '@aigeeksquad/knowledge-network';

describe('KnowledgeGraph Integration', () => {
  let container: HTMLDivElement;
  let graph: KnowledgeGraph;

  const testData: GraphData = {
    nodes: [
      { id: 'A', label: 'Node A' },
      { id: 'B', label: 'Node B' }
    ],
    edges: [
      { source: 'A', target: 'B' }
    ]
  };

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
  });

  afterEach(() => {
    graph?.destroy();
    document.body.removeChild(container);
  });

  it('renders graph successfully', async () => {
    graph = new KnowledgeGraph(container, testData);

    await graph.render();

    expect(container.querySelector('svg')).toBeTruthy();
    expect(container.querySelectorAll('.node')).toHaveLength(2);
  });

  it('handles data updates', async () => {
    graph = new KnowledgeGraph(container, testData);
    await graph.render();

    const newData = {
      ...testData,
      nodes: [...testData.nodes, { id: 'C', label: 'Node C' }]
    };

    await graph.updateData(newData);
    expect(container.querySelectorAll('.node')).toHaveLength(3);
  });
});
```

### React Testing Library

```typescript
// __tests__/KnowledgeGraphComponent.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { KnowledgeGraphComponent } from '../KnowledgeGraphComponent';

test('renders loading state initially', () => {
  render(<KnowledgeGraphComponent data={testData} />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});

test('renders graph after loading', async () => {
  render(<KnowledgeGraphComponent data={testData} />);

  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  expect(document.querySelector('.knowledge-graph')).toBeInTheDocument();
});
```

---

## Troubleshooting Integration Issues

### Common Problems and Solutions

**Graph not rendering:**
- Verify container element exists and has dimensions
- Check console for error messages
- Ensure data structure matches GraphData interface

**Performance issues with large datasets:**
- Use `edgeRenderer: 'simple'` for 5000+ nodes
- Implement virtualization for very large graphs
- Consider data pagination or filtering

**Memory leaks:**
- Always call `graph.destroy()` in cleanup/unmount handlers
- Use `updateData()` instead of creating new instances

**TypeScript compilation errors:**
- Ensure d3 types are installed: `npm install @types/d3`
- Check that Node and Edge interfaces match your data

**📖 Complete troubleshooting guide**: [Troubleshooting Guide](./TROUBLESHOOTING.md)

---

## Related Documentation

- **[📚 Complete API Reference](../packages/knowledge-network/README.md)** - Full API documentation
- **[📊 Edge Bundling Guide](./EDGE_BUNDLING.md)** - Advanced edge bundling techniques
- **[⚡ Performance Guide](./PERFORMANCE_GUIDE.md)** - Optimization strategies
- **[❓ Troubleshooting](./TROUBLESHOOTING.md)** - Common issues and solutions

---

**Need help?** Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/aigeeksquad/knowledge-network/issues) on GitHub.