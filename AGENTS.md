# Knowledge Network Project Context

This file provides guidance to AI assistants working with this project.

## Project Overview

The Knowledge Network is a TypeScript library for knowledge graph visualization built on D3.js. It's designed as an interactive web-based visualization tool that demonstrates knowledge graph rendering capabilities with progressive loading, interactive navigation, and multiple edge visualization modes.

This monorepo contains:
- **Core library** (`packages/knowledge-network/`): The main `@aigeeksquad/knowledge-network` package
- **Examples** (`packages/examples/`): Vite-based interactive demonstrations

The library's standout feature is force-directed edge bundling, which reduces visual clutter in complex graphs by grouping related edges. This is particularly effective for knowledge graphs, mind maps, and dense networks requiring visual clarity.

## Working in This Project

When working on this project:
- All project files belong in this monorepo structure
- Use `ai_working/` for temporary analysis files and working documents
- Reference files with `@knowledge-network/` prefix for the core library
- Examples use `workspace:*` dependencies to reference the local core library
- Follow the modular architecture principles described in `docs/` documentation

Follow this process:
- Identify tasks to be done
- Assert current state by building and running tests
- Perform work and improve
- Clean up and remove any temporary or debugging code added or clearly mark thigns to be addressed later using `//todo :` comments
- Ensure high quality standard and clean project structure
- Commit changes as they progress with actual improvement on build quality and no regression
- Make commit message that clearly states the work done and the outcome measured
- Proceed to next task

## Key Technologies

- **TypeScript**: Strict configuration with modern ES2022 target
- **D3.js v7**: Modern ES modules with d3-force for physics simulation
- **Build Tools**: 
  - `tsup` (`packages/knowledge-network/tsup.config.ts`) for fast TypeScript compilation with dual ESM/CJS output
  - `Vite` (`packages/examples/vite.config.ts`) for modern web development and examples
- **Package Management**: `pnpm` (`pnpm-workspace.yaml`) with workspace support
- **Testing**: `Vitest` (`packages/knowledge-network/vitest.config.ts`) with jsdom for DOM testing
- **Rendering**: HTML5 Canvas and SVG support for different performance needs

## Development Workflow

### Root Level Commands
```bash
# Install dependencies across all packages
pnpm install

# Build all packages (excludes examples)
pnpm build

# Start development mode (all packages in parallel)
pnpm dev

# Run all tests across packages
pnpm test

# Lint all packages
pnpm lint

# Format all code
pnpm format

# Clean build artifacts and node_modules
pnpm clean
```

### Core Library Development
Navigate to `packages/knowledge-network/`:
```bash
# Build library with tsup
pnpm build

# Watch mode development
pnpm dev

# Run tests (various options)
pnpm test                    # Run tests once
pnpm test:watch             # Run tests in watch mode
pnpm test EdgeBundling.test.ts  # Run specific test file
pnpm exec vitest --ui       # Open interactive test UI

# Lint TypeScript files
pnpm lint

# Clean dist folder
pnpm clean
```

### Examples Development
Navigate to `packages/examples/`:
```bash
# Start development server
pnpm dev

# Build examples
pnpm build

# Preview built examples
pnpm preview
```

## Architecture Overview

### Core Library Structure
The main library follows a modular architecture:

- **`KnowledgeGraph`** (`packages/knowledge-network/src/KnowledgeGraph.ts`): Main orchestration class
- **Layout Engine**: Force-directed layout using `d3-force` (`packages/knowledge-network/src/layout/ForceLayoutEngine.ts`)
- **Edge Rendering System**: Pluggable edge renderers
  - `SimpleEdge` (`packages/knowledge-network/src/edges/SimpleEdge.ts`): Basic straight line edges  
  - `EdgeBundling` (`packages/knowledge-network/src/edges/EdgeBundling.ts`): Advanced force-directed edge bundling
  - **Edge Smoothing**: Multiple strategies
    - `Laplacian` (`packages/knowledge-network/src/edges/smoothing/LaplacianSmoother.ts`)
    - `Gaussian` (`packages/knowledge-network/src/edges/smoothing/GaussianSmoother.ts`)
    - `Bilateral` (`packages/knowledge-network/src/edges/smoothing/BilateralSmoother.ts`)
- **`Types`** (`packages/knowledge-network/src/types.ts`): Comprehensive TypeScript definitions

### Key Design Patterns

1. **Modular Edge Rendering**: The `EdgeRenderer` (`packages/knowledge-network/src/edges/EdgeRenderer.ts`) system allows switching between different strategies (`simple` or `bundling`)

2. **Configuration-Driven**: The `GraphConfig` (`packages/knowledge-network/src/types.ts`) interface provides extensive customization for layout, styling, and behavior

3. **D3 Integration**: Built on d3.js v7 with modern ES modules, using d3-force for physics simulation

4. **Workspace Dependencies**: Examples package uses `workspace:*` to depend on the local core library

## Project Structure

```
├── packages/
│   ├── knowledge-network/          # Core library
│   │   ├── src/                   # Source code
│   │   │   ├── core/              # Data management
│   │   │   ├── edges/             # Edge rendering & bundling
│   │   │   ├── layout/            # Layout engines
│   │   │   ├── rendering/         # Canvas/SVG renderers
│   │   │   ├── state/             # State management
│   │   │   └── viewport/          # Viewport controls
│   │   └── tests/                 # Test suite
│   └── examples/                   # Interactive demos
├── docs/                          # Project documentation
├── ai_working/                    # Analysis and working files
└── screenshots/                   # Visual examples
```

## Configuration and Customization

The `GraphConfig` (`packages/knowledge-network/src/types.ts`) interface supports extensive customization:
- **Layout parameters**: Forces, distances, collision detection
- **Styling options**: Colors, strokes, node radii
- **Behavior settings**: Zoom, drag, stability detection  
- **Edge rendering**: Strategy selection between simple and bundling modes
- **Coordinate support**: Both 2D and 3D positioning

## Testing Strategy

- **Framework**: Vitest with jsdom for DOM testing
- **Test Location**: Tests are in the `tests/` (`packages/knowledge-network/tests/`) directory
- **Coverage Areas**: 
  - Initialization and data management
  - Edge bundling algorithms  
  - Rendering systems
  - User interactions
  - Error handling

## Demo Application Requirements

The project includes a comprehensive demo specification (`docs/DEMO_SPECIFICATION.md`) that defines:
- Progressive loading with status messages
- Two visualization modes (Simple Edges vs Enhanced Bundling)
- Interactive node selection with opacity management
- Zoom and pan navigation controls
- Performance requirements for datasets up to 1000 nodes

## Research and Documentation

The project includes extensive research documentation:
- `docs/EDGE_BUNDLING.md`: Comprehensive guide to edge bundling techniques
- `docs/EDGE_BUNDLING_RESEARCH.md`: Academic research on bundling approaches
- `docs/SEMANTIC_SPACETIME_RESEARCH.md`: Advanced semantic spacetime approaches

## File Naming Conventions

- Use PascalCase for TypeScript classes and interfaces
- Use camelCase for functions and variables
- Use kebab-case for configuration files and documentation
- Test files follow the pattern `*.test.ts`
- Configuration files use descriptive names (`tsup.config.ts`, `vitest.config.ts`)
