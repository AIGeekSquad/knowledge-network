# Knowledge Network

A powerful TypeScript library for creating stunning, interactive knowledge graph visualizations with advanced edge bundling capabilities. Built on d3.js, it transforms complex network data into clean, comprehensible visual stories.

[![npm version](https://img.shields.io/npm/v/@aigeeksquad/knowledge-network.svg)](https://www.npmjs.com/package/@aigeeksquad/knowledge-network)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

## Overview

Knowledge Network is a modern graph visualization library that excels at rendering complex networks with clarity and elegance. Its standout feature—force-directed edge bundling—automatically groups related connections to reduce visual clutter, making it ideal for visualizing knowledge graphs, dependency networks, and relationship diagrams.

![Knowledge Network Visualization](./screenshots/hero-visualization.png)

## ✨ Key Features

- **🎯 Advanced Edge Bundling** - State-of-the-art force-directed edge bundling algorithm that creates organic, flowing visualizations
- **📊 Multiple Layout Algorithms** - Force-directed, hierarchical, circular, and grid layouts
- **🎨 Rich Styling Options** - Comprehensive node and edge customization with themes
- **⚡ High Performance** - Optimized rendering with WebGL support for large graphs
- **🔍 Interactive Controls** - Pan, zoom, node dragging, and selection
- **📱 Responsive Design** - Automatic adaptation to container size changes
- **🔧 Extensible Architecture** - Plugin system for custom behaviors
- **📝 Full TypeScript Support** - Complete type definitions with excellent IDE integration

## 📦 Installation

```bash
# Using npm
npm install @aigeeksquad/knowledge-network d3

# Using pnpm
pnpm add @aigeeksquad/knowledge-network d3

# Using yarn
yarn add @aigeeksquad/knowledge-network d3
```

## 🚀 Quick Start

Get up and running with a beautiful graph visualization in seconds:

```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

// Create your graph data
const data = {
  nodes: [
    { id: 'javascript', label: 'JavaScript', type: 'primary' },
    { id: 'typescript', label: 'TypeScript', type: 'secondary' },
    { id: 'react', label: 'React', type: 'secondary' },
    { id: 'd3', label: 'D3.js', type: 'secondary' },
    { id: 'webpack', label: 'Webpack', type: 'secondary' }
  ],
  edges: [
    { source: 'typescript', target: 'javascript', label: 'compiles to' },
    { source: 'react', target: 'javascript', label: 'built with' },
    { source: 'd3', target: 'javascript', label: 'built with' },
    { source: 'react', target: 'webpack', label: 'bundled by' }
  ]
};

// Initialize and render
const container = document.getElementById('graph-container');
const graph = new KnowledgeGraph(container, data, {
  width: 800,
  height: 600,
  nodeRadius: (d) => d.type === 'primary' ? 15 : 10,
  nodeFill: (d) => d.type === 'primary' ? '#ff6b6b' : '#4ecdc4',
  edgeRenderer: 'bundled',  // 'simple' or 'bundled'
  edgeBundling: {
    subdivisions: 60,
    iterations: 150,
    compatibilityThreshold: 0.2
  }
});

graph.render();
```

## 🌊 Edge Bundling

Edge bundling is the crown jewel of Knowledge Network, transforming tangled webs into elegant flowing visualizations. It automatically identifies and groups edges that follow similar paths, creating a cleaner and more interpretable graph.

| Without Edge Bundling | With Edge Bundling |
|----------------------|-------------------|
| ![Standard Edges](./screenshots/without-bundling.png) | ![Bundled Edges](./screenshots/with-bundling.png) |
| Cluttered, crossing edges | Clean, flowing bundles |

### When to Use Edge Bundling

- **Large networks** with 50+ edges
- **Hierarchical structures** where flow patterns matter
- **Geographic networks** showing connections between locations
- **Dependency graphs** with many interconnections
- **Social networks** displaying community structures

📖 **[Read the Complete Edge Bundling Guide →](./docs/EDGE_BUNDLING.md)**

## 🎮 Live Examples

Explore interactive examples demonstrating the library's capabilities:

### [View Live Demo →](https://knowledge-network-demo.vercel.app)

#### Available Examples

1. **Basic Graph** - Simple network with interactive nodes
2. **Edge Bundling Showcase** - See the dramatic difference bundling makes
3. **Large Network Performance** - 1000+ nodes running smoothly
4. **Custom Styling** - Advanced theming and visual customization
5. **Dynamic Updates** - Real-time graph modifications
6. **Layout Comparison** - All layout algorithms side-by-side

### Running Examples Locally

```bash
# Clone the repository
git clone https://github.com/aigeeksquad/knowledge-network.git
cd knowledge-network

# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Open http://localhost:5173 in your browser
```

## 📚 API Reference

### Core Classes

#### `KnowledgeGraph`

The main class for creating and managing graph visualizations.

```typescript
class KnowledgeGraph {
  constructor(
    container: HTMLElement,
    data: GraphData,
    config?: GraphConfig
  )

  // Core methods
  render(): void
  updateData(data: GraphData): void
  destroy(): void

  // Simulation access (for advanced usage)
  getSimulation(): d3.Simulation | null
}
```

#### `GraphData`

```typescript
interface GraphData {
  nodes: Node[]
  edges: Edge[]
}

interface Node {
  id: string
  label?: string
  type?: string           // Used for styling differentiation
  x?: number             // Optional fixed position
  y?: number             // Optional fixed position
  [key: string]: any     // Additional properties
}

interface Edge {
  source: string | Node   // Can be id or node object
  target: string | Node   // Can be id or node object
  label?: string
  value?: number         // Edge weight/strength
  [key: string]: any     // Additional properties
}
```

#### `GraphConfig`

```typescript
interface GraphConfig {
  // Container dimensions
  width?: number
  height?: number

  // Node styling (functions or static values)
  nodeRadius?: number | ((d: Node) => number)
  nodeFill?: string | ((d: Node) => string)
  nodeStroke?: string | ((d: Node) => string)
  nodeStrokeWidth?: number | ((d: Node) => number)
  nodeOpacity?: number | ((d: Node) => number)

  // Edge styling (functions or static values)
  edgeStroke?: string | ((d: Edge) => string)
  edgeStrokeWidth?: number | ((d: Edge) => number)
  edgeOpacity?: number | ((d: Edge) => number)

  // Edge rendering mode
  edgeRenderer?: 'simple' | 'bundled'  // Default: 'simple'

  // Edge bundling configuration (when edgeRenderer is 'bundled')
  edgeBundling?: {
    subdivisions?: number           // Points per edge (default: 32)
    iterations?: number             // Bundling iterations (default: 60)
    compatibilityThreshold?: number // Edge compatibility (0-1, default: 0.6)
    stepSize?: number              // Force step size (default: 0.04)
    stiffness?: number             // Bundle stiffness (0-1, default: 0.3)
    compatibilityFunction?: (edge1: Edge, edge2: Edge) => number
  }

  // Force simulation settings
  forceStrength?: number         // Node repulsion strength
  linkDistance?: number          // Target edge length
  chargeStrength?: number        // Node charge force

  // Interaction
  enableZoom?: boolean           // Enable pan and zoom
  enableDrag?: boolean           // Enable node dragging

  // Labels
  showLabels?: boolean           // Show node labels
  labelFont?: string             // Label font family
  labelSize?: number | ((d: Node) => number)
  labelColor?: string | ((d: Node) => string)
}
```

### Additional Exports

```typescript
// Edge bundling algorithm (for advanced usage)
import { EdgeBundling } from '@aigeeksquad/knowledge-network'

// Create a custom edge bundling instance
const bundler = new EdgeBundling(edges, {
  subdivisions: 60,
  iterations: 150,
  compatibilityThreshold: 0.2
})

// Process edges
bundler.process()
```

Full API documentation with JSDoc is available through TypeScript IntelliSense in your IDE.

## ⚡ Performance Guidance

### Graph Size Recommendations

| Graph Size | Nodes | Edges | Recommended Settings |
|------------|-------|-------|---------------------|
| Small | < 50 | < 100 | All features enabled |
| Medium | 50-500 | 100-1000 | Consider selective rendering |
| Large | 500-2000 | 1000-5000 | Enable WebGL, limit animations |
| Extra Large | 2000+ | 5000+ | Use clustering, virtual rendering |

### Optimization Tips

```typescript
// For large graphs
const largeGraphConfig: GraphConfig = {
  width: 1200,
  height: 800,

  // Use simpler rendering for performance
  edgeRenderer: 'simple',  // Skip bundling for very large graphs

  // Or use bundling with reduced iterations
  // edgeRenderer: 'bundled',
  // edgeBundling: {
  //   iterations: 30,        // Reduce from default 60
  //   subdivisions: 16       // Reduce from default 32
  // },

  // Simplify styling
  nodeRadius: 5,           // Fixed size instead of function
  nodeFill: '#4ecdc4',     // Fixed color instead of function
  edgeOpacity: 0.3,        // Lower opacity for many edges

  // Adjust force simulation
  chargeStrength: -50,     // Reduce repulsion for tighter layout
  linkDistance: 30         // Shorter edges for compact view
}
```

### Memory Management

- Destroy graph instances when unmounting: `graph.destroy()`
- Use `graph.updateData()` instead of creating new instances
- Consider using simpler rendering modes for very large datasets

## 🛠️ Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/aigeeksquad/knowledge-network.git
cd knowledge-network

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Development Commands

```bash
# Start development server with hot reload
pnpm dev

# Run tests with coverage
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint and format code
pnpm lint
pnpm format

# Build for production
pnpm build

# Build documentation
pnpm docs:build
```

### Project Structure

```
knowledge-network/
├── packages/
│   ├── knowledge-network/    # Core library
│   │   ├── src/
│   │   │   ├── core/        # Core graph functionality
│   │   │   ├── layouts/     # Layout algorithms
│   │   │   ├── rendering/   # Rendering engines
│   │   │   ├── interaction/ # User interaction handlers
│   │   │   ├── utils/       # Utility functions
│   │   │   └── types/       # TypeScript definitions
│   │   └── __tests__/       # Unit tests
│   └── examples/            # Interactive examples
│       └── src/
│           ├── basic/       # Basic usage examples
│           ├── advanced/    # Advanced features
│           └── showcase/    # Feature showcases
├── docs/                    # Documentation
│   └── EDGE_BUNDLING.md    # Edge bundling deep dive
└── scripts/                # Build and utility scripts
```

### Testing

The project uses Vitest for testing with comprehensive coverage:

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm test -- --grep "EdgeBundling"

# Generate coverage report
pnpm test:coverage
```

For real-time test feedback, Wallaby.js configuration is included.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Follow TypeScript best practices
- Write comprehensive JSDoc comments
- Include unit tests for new features
- Update documentation as needed

## 📄 License

MIT © AIGeekSquad

---

<p align="center">
  Built with ❤️ by the AIGeekSquad team
</p>

<p align="center">
  <a href="https://github.com/aigeeksquad/knowledge-network">GitHub</a> •
  <a href="https://www.npmjs.com/package/@aigeeksquad/knowledge-network">npm</a> •
  <a href="./docs/EDGE_BUNDLING.md">Documentation</a> •
  <a href="https://knowledge-network-demo.vercel.app">Demo</a>
</p>