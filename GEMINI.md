# Gemini Code Assistant Context: KnowledgeGraphRenderer

This document provides context for the Gemini Code Assistant to understand and effectively assist with development in the `KnowledgeGraphRenderer` monorepo.

## Project Overview

This is a TypeScript monorepo managed with `pnpm` workspaces. The primary goal of this project is to provide a modern, interactive, and highly customizable library for visualizing knowledge graphs.

The monorepo contains two main packages:

1.  `packages/knowledge-network`: The core TypeScript library (`@aigeeksquad/knowledge-network`) that extends `d3.js` to create knowledge graph visualizations. It is built using `tsup` and tested with `vitest`.
2.  `packages/examples`: A package containing interactive examples and demonstrations of the `knowledge-network` library, built with `vite`.

### Core Features

The `@aigeeksquad/knowledge-network` library provides several advanced features:

*   **d3-idiomatic API**: Uses accessor functions for properties, allowing for dynamic and data-driven styling and behavior.
*   **Force-Directed Layout**: Implements a sophisticated force simulation for positioning nodes and links.
*   **Edge Bundling**: Includes force-directed edge bundling to reduce visual clutter by grouping related edges into curved paths.
*   **Similarity-based Clustering**: Can attract nodes to each other based on a custom vector similarity function (e.g., cosine similarity).
*   **Ontology-aware Links**: Link strength in the force simulation can be influenced by the semantic type of the relationship (e.g., `is-a`, `part-of`).
*   **Interaction**: Built-in support for zooming, panning, and dragging nodes.
*   **Collision Detection**: Prevents nodes from overlapping.

## Building and Running

The project uses `pnpm` for package management and running scripts.

*   **Install dependencies:**
    ```bash
    pnpm install
    ```

*   **Build the library (`@aigeeksquad/knowledge-network`):**
    ```bash
    pnpm build
    ```

*   **Run tests:**
    ```bash
    pnpm test
    ```

*   **Run tests in watch mode:**
    ```bash
    pnpm test:watch
    ```

*   **Start the examples in development mode:**
    ```bash
    pnpm dev
    ```

*   **Lint the codebase:**
    ```bash
    pnpm lint
    ```

*   **Format the code:**
    ```bash
    pnpm format
    ```

## Development Conventions

*   **Language**: The entire codebase is written in TypeScript.
*   **Code Style**: Code is formatted with `prettier` and linted with `eslint`. Run `pnpm format` and `pnpm lint` before committing.
*   **Testing**: Tests are written with `vitest`. Test files are located alongside the source code in `__tests__` directories (e.g., `src/__tests__/KnowledgeGraph.test.ts`).
*   **API Design**: The public API of `KnowledgeGraph` follows d3.js conventions, using accessor functions. For example, a property like `nodeRadius` can be a static value or a function that receives a node datum and returns a value.
*   **Modularity**: The library is structured into modules for different concerns, such as `layout`, `edges`, and `types`. The main entry point is `src/index.ts`.
*   **Build System**: `tsup` is used to compile the TypeScript library into ESM and CJS formats. The configuration is in `packages/knowledge-network/tsup.config.ts`.
*   **Examples**: The `packages/examples` directory is the primary way to test and visualize changes to the core library during development.
