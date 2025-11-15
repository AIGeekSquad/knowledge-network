<!--
Sync Impact Report:
- Version: 1.2.0 → 1.3.0 (MINOR: Added Structural Simplicity principle)
- Added: Principle VIII (Structural Simplicity & Meaningful Organization)
- Modified: Principle II (Enhanced folder naming guidance)
- Key Learning: Implementation revealed critical need for clear folder structure and minimal complexity
- Impact: All future development must follow clear naming and structural simplicity
- Date: 2025-11-15
-->

# Knowledge Network Constitution

## Core Principles

### I. Test-First Development
Every feature starts with comprehensive tests written before implementation; TDD mandatory: Tests written → User approved → Tests fail → Then implement; Red-Green-Refactor cycle strictly enforced; Vitest with jsdom for DOM testing required; Tests must cover initialization, edge bundling algorithms, rendering systems, user interactions, and error handling.

### II. Clean Code Standards
Modern TypeScript strict configuration with ES2022 target required; PascalCase for classes/interfaces, camelCase for functions/variables, kebab-case for config files; **ASYNC NAMING**: All async methods in TypeScript MUST include "Async" in the method name (e.g., `generateEdgesAsync()`, `calculateCompatibilityAsync()`); **FOLDER NAMING**: Use clear, descriptive folder names that immediately convey purpose - avoid vague terms like "modular", "utils", "helpers"; No trash files: remove ALL test files, working files, temporary files after use; Proper naming conventions (no "working-demo", "test-basic", etc.); Clean up unused imports and dead code; Maintain clean file structure with only production files.

### III. Modern TypeScript Practices
Strict TypeScript configuration mandatory; Comprehensive type definitions in `src/types.ts`; Modern ES modules with proper imports; Configuration-driven design through interfaces; Type safety across all components including D3.js integrations; No build corruptions (d3 not d34 or other corruptions).

### IV. Build System Integrity
Always fix library build issues before creating demos; Ensure TypeScript imports work properly without build corruption; Test that library actually imports and works in demo code; Fix core library issues before attempting demo functionality; Use tsup for fast TypeScript compilation with dual ESM/CJS output; Vite for modern web development; **DEPENDENCY MANAGEMENT**: MUST use `pnpm add/remove/update` commands for all dependency management; MUST NOT manually edit package.json for adding/removing/updating dependencies; All dependency changes must go through pnpm CLI to ensure lockfile consistency.

### V. Documentation Completeness
Comprehensive documentation required in `docs/` directory; Include research documentation for edge bundling techniques; Maintain architectural documentation and troubleshooting guides; Document all APIs, interfaces, and system architectures; Keep README files updated with current setup and usage instructions.

### VI. Performance & Scalability
Performance requirements: handle datasets up to 1000 nodes; Canvas and SVG rendering support for different performance needs; Efficient edge bundling algorithms to reduce visual clutter; Progressive loading with status messages; Optimize for 60fps interactions with smooth zoom/pan navigation; Memory-conscious implementation.

### VII. Monorepo Organization
All project files belong in monorepo structure; Use `packages/knowledge-network/` for core library; Use `packages/demo-suite/` for demonstrations; Use `ai_working/` for temporary analysis files; Reference files with `@knowledge-network/` prefix; Demo Suite uses `workspace:*` dependencies; Follow modular architecture principles.

### VIII. Structural Simplicity & Meaningful Organization
**SIMPLICITY FIRST**: Aim for simplicity and minimal effort in all implementations; Maximize reuse of existing functionality rather than creating new components; Keep work to clear and strict necessary requirements only; **MEANINGFUL FOLDERS**: Every folder must have immediate, clear purpose - no empty folders, no confusing names; Folder structure must be immediately understandable by any developer; Use domain-specific names (`core/`, `layout/`, `rendering/`) not abstract terms (`modular/`, `utils/`, `helpers/`); **MINIMAL COMPLEXITY**: Complexity must be explicitly justified against simpler alternatives; When possible, extend existing components rather than creating parallel systems; Remove broken or obsolete infrastructure rather than maintaining it.

## Development Standards

### Single Working Demo Policy
**NEVER create multiple fragmented demo endpoints.** Requirements: ONE working demo at main URL; ALL capabilities visible in single integrated experience; NO separate test pages or fragmented demonstrations; NO "working-demo", "test-basic", "simple-test" files.

### Build System Requirements
Build tools: tsup for TypeScript compilation, Vite for development; Package management: pnpm with workspace support; Testing: Vitest with jsdom for DOM testing; Modern ES2022 target with D3.js v7 ES modules; Dual ESM/CJS output support.

### Quality Gates
Respect user time: test thoroughly before presenting; Fix obvious issues before engaging user; User role: strategic decisions, design approval, business context; Developer role: implementation, testing, debugging, fixing issues; No "can you test this" - deliver tested, validated work.

## Governance

Constitution supersedes all other practices; Amendments require documentation, approval, and migration plan; All PRs/reviews must verify compliance with these principles; Complexity must be justified against simpler alternatives; Use AGENTS.md for runtime development guidance; Commit changes with actual improvement on build quality and no regression.

**Version**: 1.3.0 | **Ratified**: 2025-11-13 | **Last Amended**: 2025-11-15