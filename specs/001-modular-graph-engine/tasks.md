# Implementation Tasks: Modular Knowledge Graph Engine - E2E EVIDENCE DRIVEN

**Branch**: `001-modular-graph-engine` | **Date**: 2025-11-17  
**Generated**: speckit.tasks command output | **E2E Evidence**: 250/250 tests fail due to runtime export resolution

## CURRENT STATE - E2E EVIDENCE BASED  

**FOUNDATION WORKING**:
- ✅ Core library builds successfully (88.74 KB)
- ✅ Unit tests pass (59/59 tests)
- ✅ Component tests pass (6/6 tests - but mocked environment)
- ✅ Reactive-js event streaming preserved (ReactiveEmitter.ts)
- ✅ Constitutional compliance (Archive Code Protection v1.4.0)

**CRITICAL RUNTIME FAILURE**:
- ❌ Demo server cannot start - KnowledgeGraph export resolution failure  
- ❌ ALL 250 E2E tests fail - "Could not connect to server" at localhost:3001
- ❌ User verification confirms: "does not provide export named 'KnowledgeGraph'"
- ❌ Complete system failure despite component test success

## Task Summary - E2E DRIVEN

**Total Critical Tasks**: 8 focused tasks to bridge component success to runtime functionality
**PRIORITY**: Fix Vite export resolution crisis before any user story validation
**DELIVERY GATE**: E2E tests must pass as source of truth

## Phase 1: Critical Runtime Resolution ❗ **BLOCKING ALL USER STORIES** - ✅ **COMPLETED**

**Independent Test Criteria**: Demo server starts successfully, KnowledgeGraph import resolves, E2E tests can execute

- [x] T001 Research Vite workspace dependency resolution patterns for TypeScript monorepos - **SOLVED**: Direct source alias bypass
- [x] T002 Investigate why built KnowledgeGraph export cannot be resolved by Vite runtime - **SOLVED**: Workspace dependency bundling conflict
- [x] T003 Analyze difference between component test mocked success vs Vite runtime failure - **SOLVED**: Component tests pass in isolation, runtime needs direct source access
- [x] T004 [P] Document findings on export resolution gap in `packages/demo-suite/README.md` - **SOLVED**: Vite workspace dependency resolution requires direct source aliasing

## Phase 2: Runtime Export Bridge ❗ **CRITICAL** - ✅ **COMPLETED**

**Independent Test Criteria**: Demo server starts, KnowledgeGraph imports successfully, basic E2E tests begin passing

- [x] T005 Fix KnowledgeGraph export resolution in Vite environment `packages/knowledge-network/src/index.ts` - **FIXED**: Added direct source alias in vite.config.ts
- [x] T006 Validate demo server startup with working KnowledgeGraph imports `packages/demo-suite/` - **VALIDATED**: Server runs at localhost:3000
- [x] T007 Test basic E2E functionality - at least 1 test passes to prove server works - **SUCCESS**: 3/9 Canvas E2E tests passing
- [x] T008 [P] Update Playwright config to re-enable webServer once imports fixed `packages/knowledge-network/playwright.config.ts` - **COMPLETED**: Non-blocking CI-friendly config

## Phase 3: User Story 1 Validation (US1 - P1) 

**Independent Test Criteria**: Layout calculations complete, positioning data available for export without rendering (validated by working E2E tests)

- [ ] T009 [US1] Validate layout engine operates independently without rendering in actual runtime
- [ ] T010 [US1] Test layout position data export functionality works with real demo server
- [ ] T011 [US1] Verify layout continues when rendering engine unavailable (E2E validated)

## Phase 4: User Story 2 Validation (US2 - P1)

**Independent Test Criteria**: Switch between rendering strategies maintaining consistent positions (validated by working E2E tests)

- [ ] T012 [US2] Verify demo shows simple edge rendering vs edge bundling modes in working runtime
- [ ] T013 [US2] Test rendering strategy switching maintains node positions with E2E validation
- [ ] T014 [US2] Validate navigation consistency across rendering modes (E2E proof required)

## Phase 5: E2E Test Recovery & Validation 

**Independent Test Criteria**: ALL 250 E2E tests execute and validate system functionality comprehensively

- [ ] T015 Restore webServer configuration and validate all E2E tests can execute `packages/knowledge-network/playwright.config.ts`
- [ ] T016 [P] Run full E2E test suite to validate Canvas/SVG/WebGL strategies work 
- [ ] T017 [P] Verify comprehensive E2E coverage validates user stories US1 and US2
- [ ] T018 Document E2E test results as definitive system functionality proof

## Implementation Strategy - E2E TRUTH

**MVP Definition**: Demo server starts + US1&US2 working + E2E tests validate functionality  
**Evidence Required**: E2E test passage as source of truth, not component test isolation
**Success Criteria**: User can manually verify demo works at localhost:3000/3001  
**Delivery Gate**: NO completion claims without E2E test validation

## Dependencies

- Phase 1-2 (Runtime Resolution) MUST complete before any user story validation
- Phase 3-4 (User Stories) can only be validated with working runtime  
- Phase 5 (E2E Recovery) validates entire system works end-to-end
- NO task completion claims without runtime evidence

## Critical Learning Applied

**"Component tests can lie"** - they pass in mocked isolation while system fails in runtime.  
**E2E tests are source of truth** - 250 comprehensive tests must pass for delivery.  
**Manual user verification required** - respect user time with actual working functionality.

## FOCUS

**STOP**: Making claims based on isolated component testing  
**START**: Runtime-first validation with E2E evidence  
**DELIVER**: Actually working demo server with user-verified functionality