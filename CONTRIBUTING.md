# Contributing to Knowledge Network

Thank you for your interest in contributing to @aigeeksquad/knowledge-network!

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linter
pnpm lint

# Format code
pnpm format
```

### Development Workflow

1. **Make changes** to the library in `packages/knowledge-network/src/`
2. **Build the library**: `cd packages/knowledge-network && pnpm build`
3. **Test your changes**: `pnpm test`
4. **Run the examples**: `cd packages/examples && pnpm dev`
5. **Lint your code**: `pnpm lint`

### Project Structure

```
KnowledgeGraphRenderer/
├── packages/
│   ├── knowledge-network/    # Core library
│   │   ├── src/
│   │   │   ├── KnowledgeGraph.ts
│   │   │   ├── types.ts
│   │   │   ├── layout/
│   │   │   └── __tests__/
│   │   ├── dist/            # Build output (gitignored)
│   │   └── package.json
│   └── examples/            # Example applications
│       ├── src/
│       ├── index.html
│       └── package.json
├── pnpm-workspace.yaml
└── package.json
```

## Testing

We use Vitest for testing. Tests are located in `src/__tests__/` directories.

```bash
# Run tests once
pnpm test

# Run tests in watch mode
cd packages/knowledge-network && pnpm test:watch
```

## Building

The library is built using [tsup](https://tsup.egoist.dev/), which generates:
- ESM output (`dist/index.js`)
- CJS output (`dist/index.cjs`)
- TypeScript declarations (`dist/index.d.ts`, `dist/index.d.cts`)

```bash
# Build the library
cd packages/knowledge-network && pnpm build

# Build in watch mode
cd packages/knowledge-network && pnpm dev
```

## Publishing

The package is published to npm as `@aigeeksquad/knowledge-network`.

### Prepare for Publishing

1. Update version in `packages/knowledge-network/package.json`
2. Update CHANGELOG.md
3. Build the package: `cd packages/knowledge-network && pnpm build`
4. Test the package: `pnpm test`
5. Publish: `cd packages/knowledge-network && npm publish --access public`

## Code Style

We use ESLint and Prettier for code formatting:

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

## Pull Request Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass: `pnpm test`
6. Ensure code is linted: `pnpm lint`
7. Commit your changes with a clear message
8. Push to your fork
9. Create a Pull Request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
