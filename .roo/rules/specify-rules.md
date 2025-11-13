# Knowledge Network Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-13

**Constitution Reference**: v1.1.0 (`.specify/memory/constitution.md`)

## Active Technologies
- TypeScript ES2022 with strict configuration, async/Promise-based API design + D3.js v7 (force calculations), existing LayoutNode structures from 002-node-layout (003-edge-generator)

**Core Stack**: TypeScript ES2022, D3.js v7, tsup, Vite, Vitest, pnpm workspaces
**Architecture**: Monorepo with modular edge rendering, force-directed layouts, Canvas/SVG rendering
**Performance**: 1000+ nodes capacity, 60fps interactions, progressive loading, memory optimization
**Quality**: Test-First Development (TDD), strict TypeScript, comprehensive documentation

## Project Structure

```text
packages/
├── knowledge-network/          # Core library (@aigeeksquad/knowledge-network)
│   ├── src/                   # TypeScript source with strict configuration
│   │   ├── edges/             # Edge rendering & bundling (SimpleEdge, EdgeBundling)
│   │   ├── layout/            # Force-directed layout engines
│   │   ├── rendering/         # Canvas/SVG/WebGL renderers
│   │   └── types.ts           # Comprehensive TypeScript definitions
│   └── tests/                 # Vitest test suite with jsdom
└── demo-suite/                # Vite-based interactive showcase
    └── src/                   # Demo implementation using workspace:* dependencies
docs/                          # Comprehensive documentation & research
```

## Development Commands

### Root Level (pnpm workspace commands)
```bash
pnpm install                   # Install dependencies across all packages
pnpm build                     # Build all packages
pnpm dev                       # Start development mode (all packages)
pnpm test                      # Run all tests across packages
```

### Core Library (`packages/knowledge-network/`)
```bash
pnpm build                     # tsup compilation with dual ESM/CJS output
pnpm dev                       # Watch mode development
pnpm test                      # Vitest with jsdom
pnpm test:watch               # Test watch mode
pnpm test EdgeBundling.test.ts # Run specific test file
```

### Demo Suite (`packages/demo-suite/`)
```bash
pnpm dev                       # Start Vite development server
pnpm build                     # Build demo for production
```

## Code Standards

**Naming Conventions** (Constitution Principle II):
- PascalCase: Classes, interfaces, TypeScript types
- camelCase: Functions, variables, methods
- kebab-case: Configuration files, documentation files

**File Management** (Constitution Principle II):
- NO trash files: remove ALL test files, working files, temporary files
- NO "working-demo", "test-basic", "simple-test" patterns
- Clean unused imports and dead code
- Production-only file structure

**TypeScript Standards** (Constitution Principle III):
- Strict configuration mandatory
- Comprehensive type definitions in `src/types.ts`
- Modern ES modules with proper imports
- No build corruptions (d3 not d34)

## Quality Gates

**Test-First Development** (Constitution Principle I):
- TDD mandatory: Tests → User approval → Tests fail → Implement
- Red-Green-Refactor cycle strictly enforced
- Coverage: initialization, edge bundling, rendering, interactions, error handling

**Build System Integrity** (Constitution Principle IV):
- Fix library build issues BEFORE creating demos
- Validate TypeScript imports work without corruption
- Test actual library functionality in demo code

**Single Working Demo Policy**:
- ONE integrated demo at localhost:3000/3002
- ALL capabilities visible in single experience
- NO separate test pages or fragmented demonstrations

## Recent Changes
- 003-edge-generator: Added TypeScript ES2022 with strict configuration, async/Promise-based API design + D3.js v7 (force calculations), existing LayoutNode structures from 002-node-layout

[LAST 3 FEATURES AND WHAT THEY ADDED - TO BE POPULATED BY SPECKIT COMMANDS]

## Constitution Compliance

All development must comply with Knowledge Network Constitution v1.1.0:
- Use `/speckit.constitution` command for compliance validation
- Reference `.specify/memory/constitution.md` for detailed principles
- Quality gates must pass before feature development
- Complexity must be justified against simpler alternatives

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
