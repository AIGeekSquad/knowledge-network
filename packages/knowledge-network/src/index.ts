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
  LayoutSerializer,
  // NodeLayout Engine (US1)
  NodeLayoutEngine,
  SimilarityProcessor,
  SpatialOptimizer,
  SimilarityCache,
  SimilarityMappingAlgorithms
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

// Rendering module (Phase 2: Pluggable Rendering Strategies)
export {
  BaseRenderingStrategy,
  CanvasRenderingStrategy,
  SVGRenderingStrategy,
  WebGLRenderingStrategy,
  StrategySwitcher
} from './rendering';

export type {
  IRenderingStrategy,
  RenderingContext,
  RenderingConfig,
  RenderingCapabilities,
  VisualUpdates,
  InteractionEvent,
  RenderingProgressCallback,
  PerformanceMetrics,
  SwitcherOptions,
  PerformanceSuggestion,
  StrategyComparison
} from './rendering';

// Main KnowledgeGraph class (current src/ implementation)
export { KnowledgeGraph } from './core/KnowledgeGraph';
export type { GraphData, GraphConfig } from './core/KnowledgeGraph';

// Reactive event system (using reactive-js for portability)
export { EventEmitter, ReactiveEmitter } from './utils/ReactiveEmitter';

// Placeholder exports for future phases
// TODO: Add similarity module exports (Phase 3)
// TODO: Add navigation module exports (Phase 4)
// TODO: Add pipeline module exports (Phase 5)