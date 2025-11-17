/**
 * Layout Module Exports
 * 
 * Exports all layout engine components for the modular graph engine.
 * Provides independent layout calculation capabilities without rendering dependencies.
 * 
 * @fileoverview Layout module barrel exports
 */

// Main layout engine implementation
export { LayoutEngine } from './LayoutEngine';

// Core layout calculator with D3.js force simulation
export { LayoutCalculator } from './LayoutCalculator';

// Layout state serialization/deserialization
export { LayoutSerializer } from './LayoutSerializer';

// Contract interfaces and types
export type {
  // Main interface
  ILayoutEngine,
  
  // Core data structures
  LayoutNode,
  LayoutConfiguration,
  LayoutContext,
  LayoutMetadata,
  LayoutProgress,
  
  // Configuration interfaces
  ForceConfig,
  ClusteringConfig,
  PerformanceConfig,
  
  // Validation interfaces
  ValidationResult,
  ValidationError,
  ValidationWarning,
  
  // Capability interfaces
  LayoutEngineCapabilities,
  PerformanceProfile,
  PerformanceMetrics,
  
  // Function types
  SimilarityFunction,
  ProgressCallback
} from './layout-engine';

// Serialization types
export type {
  SerializableLayoutState,
  SerializableLayoutNode,
  LayoutStateMetadata
} from './LayoutSerializer';

// Re-export commonly used types from main types file

// ============================================
// NodeLayout Module Exports (002-node-layout)
// ============================================

// Similarity-based positioning engine
export { NodeLayoutEngine } from './NodeLayoutEngine';

// Similarity processing with functor contract compliance
export { SimilarityProcessor } from './SimilarityProcessor';

// Spatial optimization with configurable distance mapping
export { SpatialOptimizer, SimilarityMappingAlgorithms } from './SpatialOptimizer';
export type { SimilarityToDistanceMapper } from './SpatialOptimizer';

// Immutable LayoutNode factory system
export { LayoutCalculator } from './LayoutCalculator';

// High-performance similarity caching
export { SimilarityCache } from './SimilarityCache';

// NodeLayout types for external usage
export type { 
  SimilarityFunctor,
  ClusteringContext,
  EnhancedLayoutNode,
  LayoutConfig,
  LayoutResult,
  NodeImportance,
  Position3D,
  ConvergenceMetrics,
  WeightedSimilarityFunction,
  LayoutEventEmitter,
  LayoutProgressEvent,
  NodeUpdate,
  TransitionResult,
  EngineState
} from '../types';
export type { Node, Edge, GraphDataset } from '../types';