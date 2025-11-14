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
export type { Node, Edge, GraphDataset } from '../types';