/**
 * Knowledge Network - Modular Graph Engine
 * 
 * Main entry point for the modular knowledge graph visualization library.
 * Provides independent layout engines, pluggable rendering strategies,
 * and sequential pipeline processing.
 * 
 * @fileoverview Main library exports
 */

// Core types and interfaces (selective exports to avoid conflicts)
export type {
  Node,
  Edge,
  GraphDataset,
  ModularGraphConfig,
  LayoutEngineOptions,
  PipelineCoordinatorOptions,
  NavigationContractOptions,
  SimilarityMeasureOptions
} from './types';

// Layout engine module (Phase 1: Independent Layout Engine)
export {
  LayoutEngine,
  LayoutCalculator,
  LayoutSerializer
} from './layout';

export type {
  ILayoutEngine,
  LayoutNode,
  LayoutConfiguration,
  LayoutContext,
  LayoutMetadata,
  LayoutProgress,
  ForceConfig,
  ClusteringConfig,
  SimilarityFunction,
  ProgressCallback,
  SerializableLayoutState,
  SerializableLayoutNode,
  LayoutStateMetadata
} from './layout';

// Configuration module
export * from './config/configuration';

// Placeholder exports for future phases
// TODO: Add rendering module exports (Phase 2)
// TODO: Add similarity module exports (Phase 3) 
// TODO: Add navigation module exports (Phase 4)
// TODO: Add pipeline module exports (Phase 5)