# @aigeeksquad/knowledge-network

A modern TypeScript library extending d3.js for creating interactive knowledge graph visualizations.

## Features

- 🎨 Built on top of d3.js for powerful visualizations
- 📦 Modern ESM/CJS module support
- 🔧 TypeScript support with full type definitions
- 🎯 Force-directed layout engine
- 🖱️ Interactive features (zoom, drag, pan)
- 🎭 Customizable styling and configuration
- 📱 Responsive and lightweight

## Installation

```bash
npm install @aigeeksquad/knowledge-network d3
```

or with pnpm:

```bash
pnpm add @aigeeksquad/knowledge-network d3
```

## Usage

### Basic Example

```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

const container = document.getElementById('graph');

const data = {
  nodes: [
    { id: 'A', label: 'Node A' },
    { id: 'B', label: 'Node B' },
    { id: 'C', label: 'Node C' },
  ],
  edges: [
    { source: 'A', target: 'B' },
    { source: 'B', target: 'C' },
  ],
};

const graph = new KnowledgeGraph(container, data);
graph.render();
```

### With Configuration

```typescript
const graph = new KnowledgeGraph(container, data, {
  width: 1000,
  height: 600,
  nodeRadius: 15,
  linkDistance: 150,
  chargeStrength: -400,
  enableZoom: true,
  enableDrag: true,
});

graph.render();
```

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
  metadata?: Record<string, unknown>;
}

interface Edge {
  id?: string;
  source: string | Node;
  target: string | Node;
  label?: string;
  type?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

interface GraphConfig {
  width?: number;
  height?: number;
  nodeRadius?: number;
  linkDistance?: number;
  chargeStrength?: number;
  enableZoom?: boolean;
  enableDrag?: boolean;
}
```

## Development

See the [examples package](../examples) for interactive demonstrations.

## License

MIT © AIGeekSquad
