# Implementation Tasks: Modular Knowledge Graph Engine

**Branch**: `001-modular-graph-engine` | **Date**: 2025-11-13  
**Generated**: speckit.tasks command output | **TDD Required**: Tests → User approval → Tests fail → Implement

## CRITICAL: Archive-First Strategy

**Context**: Significant existing codebase with modular EdgeRenderer system, sophisticated LayoutEngine with multiple algorithms, and comprehensive KnowledgeGraph orchestration. Tasks focus on **extending existing architecture** rather than replacing it.

## Task Summary

**Total Tasks**: 59  
**MVP Scope**: US1 (Independent Layout Engine) + US2 (Pluggable Rendering Strategies) = 26 core tasks  
**Architecture**: Extend existing KnowledgeGraph, LayoutEngine, and EdgeRenderer systems

## Task Distribution by User Story

- **Archive & Setup**: 6 tasks
- **US1 (Independent Layout Engine)**: 12 tasks  
- **US2 (Pluggable Rendering Strategies)**: 14 tasks
- **US3 (Runtime Similarity Extension)**: 8 tasks
- **US4 (Unified Navigation Contract)**: 9 tasks
- **US5 (Pipeline-Based Layout Processing)**: 10 tasks

## Phase 0: Archive & Infrastructure Setup

- [x] T001 [Archive] Create archive directory and backup existing source code `packages/knowledge-network/src-archive/`
- [x] T002 [Archive] Document existing architecture and integration points in `packages/knowledge-network/EXISTING_ARCHITECTURE.md`
- [x] T003 [Setup] Create modular engine interfaces directory `packages/knowledge-network/src/modular/interfaces/`
- [x] T004 [Setup] Create modular engine core directory `packages/knowledge-network/src/modular/core/`
- [x] T005 [Setup] Set up test directory for modular components `packages/knowledge-network/tests/modular/`
- [x] T006 [Setup] Extend existing types.ts with modular engine type definitions `packages/knowledge-network/src/types.ts`

## Phase 1: US1 - Independent Layout Engine Operation

**Independent Test Criteria**: Layout calculations complete and positioning data available for export without any rendering operations

- [x] T007 [US1] Write test for ModularLayoutEngine interface extending existing LayoutEngine `packages/knowledge-network/tests/layout-engine-isolation.test.ts`
- [x] T008 [US1] Create IModularLayoutEngine interface extending existing LayoutEngine capabilities `packages/knowledge-network/src/layout/layout-engine.ts`
- [x] T009 [US1] Write test for layout data export functionality independent of rendering `packages/knowledge-network/tests/layout-serialization.test.ts`
- [x] T010 [US1] Implement LayoutDataExporter utility for position/metadata extraction `packages/knowledge-network/src/layout/LayoutSerializer.ts`
- [x] T011 [US1] Write test for enhanced LayoutEngine with async calculateLayoutAsync method `packages/knowledge-network/tests/layout-computation.test.ts`
- [x] T012 [US1] Extend existing LayoutEngine class with async layout calculation `packages/knowledge-network/src/layout/LayoutEngine.ts`
- [x] T013 [US1] Write test for layout completion events without rendering dependency `packages/knowledge-network/tests/layout-engine-isolation.test.ts`
- [x] T014 [US1] Enhance existing EventEmitter pattern in LayoutEngine for modular events `packages/knowledge-network/src/layout/LayoutCalculator.ts`
- [x] T015 [US1] Write test for layout performance monitoring with 1000+ node warning `packages/knowledge-network/tests/layout-computation.test.ts`
- [x] T016 [US1] Implement performance monitoring extension for existing LayoutEngine `packages/knowledge-network/src/layout/LayoutCalculator.ts`
- [x] T017 [P] [US1] Write integration test for layout-only operation without KnowledgeGraph rendering `packages/knowledge-network/tests/layout-engine-isolation.test.ts`
- [x] T018 [US1] Create ModularLayoutController that uses existing LayoutEngine without rendering `packages/knowledge-network/src/layout/LayoutEngine.ts`

## Phase 2: US2 - Pluggable Rendering Strategies  

**Independent Test Criteria**: Switch between rendering strategies (simple vs bundling) while maintaining consistent node positions and interaction capabilities

- [x] T019 [US2] Write test for enhanced EdgeRenderer registry extending existing EdgeRenderer `packages/knowledge-network/tests/modular/EdgeRendererRegistry.test.ts`
- [x] T020 [US2] Create EdgeRendererRegistry extending existing EdgeRenderer interface `packages/knowledge-network/src/modular/core/EdgeRendererRegistry.ts`
- [x] T021 [US2] Write test for RenderingStrategyManager with dynamic strategy switching `packages/knowledge-network/tests/modular/RenderingStrategyManager.test.ts`
- [x] T022 [US2] Implement RenderingStrategyManager using existing SimpleEdge and EdgeBundling `packages/knowledge-network/src/modular/core/RenderingStrategyManager.ts`
- [x] T023 [US2] Write test for Canvas rendering strategy wrapper `packages/knowledge-network/tests/modular/CanvasRenderingStrategy.test.ts`
- [x] T024 [US2] Create CanvasRenderingStrategy extending existing rendering capabilities `packages/knowledge-network/src/modular/strategies/CanvasRenderingStrategy.ts`
- [x] T025 [US2] Write test for SVG rendering strategy wrapper `packages/knowledge-network/tests/modular/SVGRenderingStrategy.test.ts`
- [x] T026 [US2] Create SVGRenderingStrategy extending existing rendering capabilities `packages/knowledge-network/src/modular/strategies/SVGRenderingStrategy.ts`
- [x] T027 [US2] Write test for state preservation during strategy switching (FR-007) `packages/knowledge-network/tests/modular/StrategyStatePersistence.test.ts`
- [x] T028 [US2] Implement NavigationStateManager for consistent interaction across strategies `packages/knowledge-network/src/modular/core/NavigationStateManager.ts`
- [x] T029 [US2] Write test for rendering context management with existing LayoutEngine output `packages/knowledge-network/tests/modular/RenderingContextManager.test.ts`
- [x] T030 [US2] Create RenderingContextManager for coordinating layout and rendering data `packages/knowledge-network/src/modular/core/RenderingContextManager.ts`
- [x] T031 [P] [US2] Write integration test for complete rendering strategy switching `packages/knowledge-network/tests/modular/RenderingStrategyIntegration.test.ts`
- [x] T032 [US2] Extend KnowledgeGraph class with modular rendering strategy support `packages/knowledge-network/src/modular/ModularKnowledgeGraph.ts` (created)

## Phase 3: US3 - Runtime Similarity Extension

**Independent Test Criteria**: Custom similarity function registration, application to node clustering, and <50 lines of code requirement verification

- [ ] T033 [US3] Write test for SimilarityFunctionRegistry with namespace separation `packages/knowledge-network/tests/modular/SimilarityFunctionRegistry.test.ts`
- [ ] T034 [US3] Create SimilarityFunctionRegistry extending existing similarity system `packages/knowledge-network/src/modular/core/SimilarityFunctionRegistry.ts`
- [ ] T035 [US3] Write test for runtime similarity function registration with <50 lines validation `packages/knowledge-network/tests/modular/RuntimeSimilarityRegistration.test.ts`
- [ ] T036 [US3] Implement runtime registration system extending existing LayoutEngine similarity `packages/knowledge-network/src/layout/LayoutEngine.ts` (modification)
- [ ] T037 [US3] Write test for similarity conflict resolution with mathematical averaging `packages/knowledge-network/tests/modular/SimilarityConflictResolver.test.ts`
- [ ] T038 [US3] Implement conflict resolution extending existing similarity calculations `packages/knowledge-network/src/modular/core/SimilarityConflictResolver.ts`
- [ ] T039 [P] [US3] Write integration test for custom similarity measures with existing clustering `packages/knowledge-network/tests/modular/CustomSimilarityIntegration.test.ts`
- [ ] T040 [US3] Enhance existing similarity force system in LayoutEngine for runtime extensibility `packages/knowledge-network/src/layout/LayoutEngine.ts` (modification)

## Phase 4: US4 - Unified Navigation Contract

**Independent Test Criteria**: Consistent interaction patterns (zoom, pan, select, highlight) work identically across all rendering engines with 100ms response time

- [ ] T041 [US4] Write test for NavigationContract interface with 100ms response requirement `packages/knowledge-network/tests/modular/NavigationContract.test.ts`
- [ ] T042 [US4] Create INavigationContract interface for unified interactions `packages/knowledge-network/src/modular/interfaces/INavigationContract.ts`
- [ ] T043 [US4] Write test for InteractionEventManager with consistent behavior across strategies `packages/knowledge-network/tests/modular/InteractionEventManager.test.ts`
- [ ] T044 [US4] Implement InteractionEventManager extending existing interaction patterns `packages/knowledge-network/src/modular/core/InteractionEventManager.ts`
- [ ] T045 [US4] Write test for single selection with automatic deselection behavior `packages/knowledge-network/tests/modular/SingleSelectionManager.test.ts`
- [ ] T046 [US4] Extend existing selection system in KnowledgeGraph for single selection enforcement `packages/knowledge-network/src/KnowledgeGraph.ts` (modification)
- [ ] T047 [US4] Write test for neighbor highlighting across different rendering strategies `packages/knowledge-network/tests/modular/NeighborHighlightManager.test.ts`
- [ ] T048 [US4] Implement NeighborHighlightManager extending existing neighbor functionality `packages/knowledge-network/src/modular/core/NeighborHighlightManager.ts`
- [ ] T049 [P] [US4] Write integration test for navigation contract across all rendering strategies `packages/knowledge-network/tests/modular/NavigationIntegration.test.ts`

## Phase 5: US5 - Pipeline-Based Layout Processing

**Independent Test Criteria**: Progressive loading with node positions available before edge calculations complete, 40% performance improvement measurement

- [ ] T050 [US5] Write test for PipelineCoordinator with sequential stage processing `packages/knowledge-network/tests/modular/PipelineCoordinator.test.ts`
- [ ] T051 [US5] Create PipelineCoordinator extending existing KnowledgeGraph orchestration `packages/knowledge-network/src/modular/core/PipelineCoordinator.ts`
- [ ] T052 [US5] Write test for progressive loading with existing LayoutEngine integration `packages/knowledge-network/tests/modular/ProgressiveLoadingManager.test.ts`
- [ ] T053 [US5] Implement ProgressiveLoadingManager using existing EventEmitter pattern `packages/knowledge-network/src/modular/core/ProgressiveLoadingManager.ts`
- [ ] T054 [US5] Write test for pipeline status with detailed stage breakdown `packages/knowledge-network/tests/modular/PipelineStatusManager.test.ts`
- [ ] T055 [US5] Implement PipelineStatusManager extending existing progress reporting `packages/knowledge-network/src/modular/core/PipelineStatusManager.ts`
- [ ] T056 [US5] Write test for 40% performance improvement against existing monolithic processing `packages/knowledge-network/tests/modular/PerformanceComparison.test.ts`
- [ ] T057 [US5] Create PerformanceBenchmark utility to measure pipeline vs existing approach `packages/knowledge-network/src/modular/core/PerformanceBenchmark.ts`
- [ ] T058 [P] [US5] Write integration test for complete pipeline with existing component integration `packages/knowledge-network/tests/modular/PipelineIntegration.test.ts`
- [ ] T059 [US5] Create ModularKnowledgeGraph class extending existing KnowledgeGraph `packages/knowledge-network/src/modular/ModularKnowledgeGraph.ts`

## Dependency Graph

### Sequential Dependencies (Must complete in order):
1. **Phase 0 → All Others**: Archive and setup must complete before development
2. **Phase 1 → Phase 2**: Layout independence needed before rendering modularity  
3. **Phase 2 → Phase 4**: Rendering strategies needed for navigation testing
4. **Phases 1,2,3,4 → Phase 5**: All modular components needed for pipeline integration

### Parallel Execution Opportunities:
- **Phase 1 & Phase 3**: Layout modularity and similarity extension can develop independently
- **Phase 2 & Phase 4**: Rendering and navigation can develop independently after Phase 1
- **Within each phase**: Tasks marked [P] can be executed in parallel

### Existing Code Integration Points:
- **KnowledgeGraph.ts**: Extend with modular capabilities, preserve existing API
- **LayoutEngine.ts**: Add async methods and runtime extensibility, preserve existing algorithms  
- **EdgeRenderer system**: Leverage existing SimpleEdge and EdgeBundling implementations
- **types.ts**: Extend with new interfaces, preserve existing type definitions

## MVP Delivery Scope

**Minimum Viable Product** consists of US1 + US2 (both P1 priority):
- Tasks T007-T018 (Independent Layout Engine)
- Tasks T019-T032 (Pluggable Rendering Strategies)
- **Total MVP Tasks**: 26 (including setup)
- **Success Criteria**: Layout calculations independent of rendering + Dynamic strategy switching

## Archive Strategy

**Current Source Preservation**:
1. **Backup entire src/ directory** to `src-archive/` before any modifications
2. **Document existing architecture** including current EdgeRenderer system, LayoutEngine capabilities, and KnowledgeGraph orchestration
3. **Preserve backward compatibility** by extending rather than replacing existing classes
4. **Maintain existing API surface** while adding new modular capabilities

## Integration Approach

**Extend, Don't Replace**:
- **LayoutEngine.ts**: Add async methods, keep existing synchronous API
- **KnowledgeGraph.ts**: Add modular methods, preserve existing constructor and public API
- **EdgeRenderer system**: Use existing interfaces, extend with registry pattern
- **Types.ts**: Add new interfaces alongside existing type definitions

## File Path Strategy

**Modular Extensions**:
- New interfaces: `src/modular/interfaces/`
- Core modular logic: `src/modular/core/` 
- Strategy implementations: `src/modular/strategies/`
- Modified existing files: Extend in place with backward compatibility
- Test files: `tests/modular/` mirroring source structure

## TDD Compliance

**Mandatory Process**: Tests → User approval → Tests fail → Implement → Tests pass
- Every implementation task preceded by corresponding test task
- Integration tests validate existing code compatibility
- Performance tests validate quantitative success criteria (40% improvement, 100ms response)
- Test files use Vitest + jsdom following existing project patterns
- Archive validation tests ensure no regression in existing functionality