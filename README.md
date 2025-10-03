# KnowledgeGraphRenderer

A modern TypeScript library extending d3.js for creating interactive knowledge graph visualizations.

## 📦 Packages

This monorepo contains the following packages:

- **[@aigeeksquad/knowledge-network](./packages/knowledge-network)** - Core library for knowledge graph visualization
- **[examples](./packages/examples)** - Interactive examples and demonstrations

## 🚀 Quick Start

### Installation

```bash
pnpm install
```

### Development

```bash
# Build all packages
pnpm build

# Run tests
pnpm test

# Start the examples in development mode
pnpm dev

# Lint all packages
pnpm lint

# Format code
pnpm format
```

## 📖 Usage

Install the library in your project:

```bash
npm install @aigeeksquad/knowledge-network d3
```

Basic usage:

```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

const container = document.getElementById('graph');
const data = {
  nodes: [
    { id: 'A', label: 'Node A' },
    { id: 'B', label: 'Node B' },
  ],
  edges: [
    { source: 'A', target: 'B' },
  ],
};

const graph = new KnowledgeGraph(container, data);
graph.render();
```

For more detailed documentation, see the [library README](./packages/knowledge-network/README.md).

## 🏗️ Project Structure

```
KnowledgeGraphRenderer/
├── packages/
│   ├── knowledge-network/    # Core library
│   │   ├── src/
│   │   │   ├── KnowledgeGraph.ts
│   │   │   ├── types.ts
│   │   │   ├── layout/
│   │   │   └── __tests__/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   └── examples/             # Example applications
│       ├── src/
│       ├── index.html
│       └── package.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## 🧪 Testing

Tests are written using Vitest:

```bash
pnpm test
```

## 📝 License

MIT © AIGeekSquad
