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
7. Ensure code is formatted: `pnpm format`
8. Commit your changes with a clear message following [Conventional Commits](https://www.conventionalcommits.org/)
9. Push to your fork
10. Create a Pull Request

### Commit Message Format

We follow the Conventional Commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

**Examples:**
```
feat(core): add support for custom node shapes
fix(bundling): resolve edge bundling crash on large graphs
docs: update installation instructions
test(layout): add tests for force layout engine
ci: add SonarQube integration
```

## CI/CD Pipeline

### Automated Checks

All pull requests automatically run through our CI/CD pipeline:

**✅ Required Checks:**
- Linting and code formatting
- Multi-version Node.js testing (18, 20, 22)
- Full test suite execution
- Bundle size verification
- Security vulnerability scanning

**📊 Quality Gates:**
- Test coverage must be ≥80%
- All tests must pass
- No linting errors
- Bundle size within limits (300KB)

### Preview Deployments

Pull requests automatically get preview deployments:
- Demo site deployed to unique URL
- Updated on every commit
- Commented on PR for easy access

### Branch Protection

The `main` branch is protected and requires:
- All CI checks to pass
- At least one approving review
- Branch to be up-to-date with main

### Release Process

Releases are automated using semantic versioning:

1. **Manual Trigger**: Use "Semantic Versioning" workflow
2. **Choose Version**: patch, minor, major, or prerelease
3. **Auto-Generated**: Changelog and release notes
4. **NPM Publish**: Automatic on tag creation
5. **GitHub Release**: Created with artifacts

For more details, see [.github/README.md](.github/README.md)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
