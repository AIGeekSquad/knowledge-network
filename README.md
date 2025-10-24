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

## 📖 Research & Theory

This library is built on solid theoretical foundations. Explore our comprehensive research documentation to understand the algorithms and concepts behind the implementation:

### [📊 Edge Bundling Research](./docs/EDGE_BUNDLING_RESEARCH.md)
Comprehensive analysis of edge bundling techniques and approaches in graph visualization, covering:
- Theoretical foundations and algorithmic approaches
- AI-driven semantic approaches for knowledge networks
- Performance optimization and quality assessment methods
- Implementation recommendations and future research directions

### [🧠 Semantic Spacetime Research](./docs/SEMANTIC_SPACETIME_RESEARCH.md)
Deep dive into semantic spacetime approaches for knowledge graph generation and visualization:
- Mark Burgess's Semantic Spacetime model and Promise Theory foundations
- Agent-based architecture and temporal reasoning capabilities
- Applications in mind mapping and collaborative knowledge systems
- Integration strategies and performance considerations

These research documents provide the theoretical backing for the library's advanced features and can guide developers in implementing sophisticated knowledge visualization systems.

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

## 📚 Complete API Documentation

Looking for detailed API reference, configuration options, or advanced usage patterns?

### **📖 [Complete API Guide →](./packages/knowledge-network/README.md)**

The complete API documentation includes:
- **Comprehensive API Reference** - All classes, interfaces, and configuration options
- **Advanced Usage Patterns** - Edge bundling, similarity clustering, ontology-aware links
- **Configuration Examples** - Real-world configuration patterns and best practices
- **TypeScript Integration** - Full type definitions and IDE integration guides

### Quick API Overview

The library centers around the `KnowledgeGraph` class:

```typescript
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

const graph = new KnowledgeGraph(container, data, config);
graph.render();
```

**Core Concepts:**
- **GraphData** - `{ nodes: Node[], edges: Edge[] }`
- **GraphConfig** - Comprehensive configuration with d3-style accessor functions
- **EdgeRenderer** - Choose between `'simple'` or `'bundled'` edge styles

## 📖 Documentation & Guides

### Specialized Guides

- **[📊 Edge Bundling Guide](./docs/EDGE_BUNDLING.md)** - Complete guide to edge bundling for cleaner visualizations
- **[⚡ Performance Guide](./docs/PERFORMANCE_GUIDE.md)** - Optimization strategies for large graphs
- **[🔧 Integration Guide](./docs/INTEGRATION_GUIDE.md)** - Framework integration patterns (React, Vue, Angular)
- **[❓ Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[🔄 Migration Guide](./docs/MIGRATION_GUIDE.md)** - Version upgrade guidance

### Research & Theory

- **[📊 Edge Bundling Research](./docs/EDGE_BUNDLING_RESEARCH.md)** - Academic research and algorithmic foundations
- **[🧠 Semantic Spacetime Research](./docs/SEMANTIC_SPACETIME_RESEARCH.md)** - Advanced semantic approaches

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
├── docs/                          # Documentation & Research
│   ├── EDGE_BUNDLING.md           # Edge bundling user guide
│   ├── EDGE_BUNDLING_RESEARCH.md  # Edge bundling research & theory
│   └── SEMANTIC_SPACETIME_RESEARCH.md # Semantic spacetime research
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
  <a href="./docs/EDGE_BUNDLING_RESEARCH.md">Research</a> •
  <a href="https://knowledge-network-demo.vercel.app">Demo</a>
</p>