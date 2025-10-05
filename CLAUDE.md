# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing a TypeScript library for knowledge graph visualization built on d3.js. The project consists of:

- **Core library** (`packages/knowledge-network`): The main `@aigeeksquad/knowledge-network` package
- **Examples** (`packages/examples`): Vite-based interactive demonstrations

## Common Commands

### Development Commands
```bash
# Install dependencies
pnpm install

# Build all packages (excludes examples)
pnpm build

# Start development mode (all packages in parallel)
pnpm dev

# Run all tests
pnpm test

# Lint all packages
pnpm lint

# Format all code
pnpm format

# Clean build artifacts and node_modules
pnpm clean
```

### Package-Specific Commands

**Core library** (`packages/knowledge-network`):
```bash
cd packages/knowledge-network

# Build library with tsup
pnpm build

# Watch mode development
pnpm dev

# Run tests once
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run a specific test file
pnpm test EdgeBundling.test.ts

# Lint TypeScript files
pnpm lint

# Clean dist folder
pnpm clean
```

**Examples** (`packages/examples`):
```bash
cd packages/examples

# Start development server
pnpm dev

# Build examples
pnpm build

# Preview built examples
pnpm preview
```

## Architecture

### Core Library Structure

The main library follows a modular architecture:

- **KnowledgeGraph**: Main class that orchestrates graph creation and management
- **Layout Engine**: Force-directed layout using d3-force (`ForceLayoutEngine`)
- **Edge Renderers**: Pluggable edge rendering system
  - `SimpleEdge`: Basic straight line edges
  - `EdgeBundling`: Advanced force-directed edge bundling for complex graphs
- **Types**: Comprehensive TypeScript definitions for nodes, edges, and configurations

### Key Design Patterns

1. **Modular Edge Rendering**: The `EdgeRenderer` system allows switching between different edge rendering strategies (`simple` or `bundling`)

2. **Configuration-Driven**: The `GraphConfig` interface provides extensive customization options for layout, styling, and behavior

3. **D3 Integration**: Built on d3.js v7 with modern ES modules, using d3-force for physics simulation

4. **Workspace Dependencies**: Examples package uses `workspace:*` to depend on the local core library

## Testing

- **Framework**: Vitest with jsdom for DOM testing
- **Test Location**: Tests are in the `tests/` directory

## Build System

- **Library Build**: tsup for fast TypeScript compilation with dual ESM/CJS output
- **Examples Build**: Vite for modern web development
- **Package Manager**: pnpm with workspace support
- **TypeScript**: Strict configuration with modern ES2022 target

## Key Features

### Edge Bundling
The library's standout feature is force-directed edge bundling, which reduces visual clutter in complex graphs by grouping related edges. This is particularly effective for:
- Graphs with many parallel edges
- Visualizations where edge flow patterns matter
- Dense networks requiring visual clarity

### Configuration Options
The `GraphConfig` interface supports extensive customization including:
- Layout parameters (forces, distances, collision)
- Styling (colors, strokes, radii)
- Behavior (zoom, drag, stability detection)
- Edge rendering strategy selection
- 2D/3D coordinate support