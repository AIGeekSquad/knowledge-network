/**
 * Layout Engine Contracts
 * 
 * Defines interfaces for modular layout engine components, supporting the sequential pipeline
 * architecture where NodeLayout processes first, then EdgeGenerator calculates edge arrangements.
 * 
 * Key Integration Points:
 * - Map<string, LayoutNode> data handoff between pipeline stages
 * - Async method naming convention (all async methods include "Async")
 * - Progress reporting integration with centralized coordinator
 * - Runtime similarity function registration and validation
 */

import { Node } from '../types';

// Core Layout Engine Interface
export interface ILayoutEngine {
  /**
   * Execute complete layout calculation for nodes
   * @param nodes Input node array from GraphDataset
   * @param config Configuration parameters for layout algorithm
   * @param progress Optional progress callback for status reporting
   * @returns Promise resolving to Map with node IDs as keys for O(1) lookups
   */
  calculateAsync(
    nodes: Node[], 
    config: LayoutConfiguration,
    progress?: ProgressCallback
  ): Promise<Map<string, LayoutNode>>;
  
  /**
   * Validate configuration before execution
   * @param config Configuration to validate
   * @returns Validation result with any errors or warnings
   */
  validateConfiguration(config: LayoutConfiguration): ValidationResult;
  
  /**
   * Clean up resources and stop any active simulations
   */
  cleanup(): void;
  
  /**
   * Get current engine capabilities and limitations
   */
  getCapabilities(): LayoutEngineCapabilities;
}

// Enhanced Layout Node (from 002-node-layout integration)
export interface LayoutNode {
  /** Unique identifier for O(1 lookups in Map<string, LayoutNode> */
  readonly id: string;
  
  /** Calculated X coordinate position */
  x: number;
  
  /** Calculated Y coordinate position */
  y: number;
  
  /** Optional cluster assignment from similarity measures */
  clusterId?: string;
  
  /** Similarity scores from all applied similarity functions */
  similarityScores: Map<string, number>;
  
  /** Original node data from input GraphDataset */
  originalData: any;
  
  /** Algorithm-specific layout metadata */
  layoutMetadata: LayoutMetadata;
}

// Layout Configuration
export interface LayoutConfiguration {
  /** D3.js force simulation parameters */
  forceParameters: ForceConfig;
  
  /** Node clustering and grouping configuration */
  clusteringConfig: ClusteringConfig;
  
  /** Names of registered similarity functions to apply */
  similarityMeasures: string[];
  
  /** Performance and memory constraints */
  performanceSettings: PerformanceConfig;
  
  /** Threshold for determining when layout has stabilized */
  stabilityThreshold: number;
  
  /** Maximum iterations before forced completion */
  maxIterations: number;
}

// Force Configuration for D3.js Integration
export interface ForceConfig {
  /** Strength of center force (0-1) */
  centerForce: number;
  
  /** Strength of repulsion between nodes (0-1) */
  chargeForce: number;
  
  /** Link force strength for connected nodes (0-1) */
  linkForce: number;
  
  /** Collision detection radius */
  collisionRadius: number;
  
  /** Custom force configurations */
  customForces?: Map<string, any>;
}

// Clustering Configuration
export interface ClusteringConfig {
  /** Enable node clustering based on similarity */
  enabled: boolean;
  
  /** Minimum similarity threshold for clustering */
  similarityThreshold: number;
  
  /** Maximum cluster size */
  maxClusterSize: number;
  
  /** Cluster separation distance */
  clusterSeparation: number;
  
  /** Algorithm to use for clustering */
  algorithm: 'hierarchical' | 'kmeans' | 'similarity-based';
}

// Performance Configuration
export interface PerformanceConfig {
  /** Maximum memory usage in MB (~10MB per 100 nodes baseline) */
  maxMemoryMB: number;
  
  /** Node count threshold for performance warnings */
  warningThreshold: number;
  
  /** Enable automatic degradation when limits approached */
  enableDegradation: boolean;
  
  /** Target FPS for interactive operations */
  targetFPS: number;
}

// Layout Context for Similarity Functions
export interface LayoutContext {
  /** Current layout iteration */
  iteration: number;
  
  /** All nodes being processed */
  nodes: Map<string, LayoutNode>;
  
  /** Configuration parameters */
  config: LayoutConfiguration;
  
  /** Performance metrics */
  performanceMetrics: PerformanceMetrics;
}

// Similarity Function Type (Pure Function as specified in clarifications)
export type SimilarityFunction = (
  nodeA: Node, 
  nodeB: Node, 
  context: LayoutContext
) => number;

// Layout Metadata
export interface LayoutMetadata {
  /** Algorithm that produced this layout */
  algorithm: string;
  
  /** Processing timestamp */
  timestamp: number;
  
  /** Performance metrics for this node */
  processingTime: number;
  
  /** Force values applied to this node */
  appliedForces: Map<string, number>;
  
  /** Custom algorithm-specific data */
  customData?: any;
}

// Validation Result
export interface ValidationResult {
  /** Whether configuration is valid */
  isValid: boolean;
  
  /** Array of validation errors */
  errors: ValidationError[];
  
  /** Array of validation warnings */
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Engine Capabilities
export interface LayoutEngineCapabilities {
  /** Maximum recommended node count */
  maxNodes: number;
  
  /** Supported force types */
  supportedForces: string[];
  
  /** Available clustering algorithms */
  clusteringAlgorithms: string[];
  
  /** Whether engine supports real-time updates */
  supportsRealTimeUpdates: boolean;
  
  /** Performance characteristics */
  performanceProfile: PerformanceProfile;
}

export interface PerformanceProfile {
  /** Time complexity (e.g., "O(n²)", "O(n log n)") */
  timeComplexity: string;
  
  /** Space complexity */
  spaceComplexity: string;
  
  /** Recommended use cases */
  recommendedFor: string[];
}

// Performance Metrics
export interface PerformanceMetrics {
  /** Processing time in milliseconds */
  processingTime: number;
  
  /** Memory usage in MB */
  memoryUsage: number;
  
  /** Number of iterations completed */
  iterations: number;
  
  /** Current stability score */
  stabilityScore: number;
  
  /** Frames per second for interactive operations */
  currentFPS: number;
}

// Progress Callback Type
export type ProgressCallback = (progress: LayoutProgress) => void;

export interface LayoutProgress {
  /** Current stage of layout processing */
  stage: 'initialization' | 'simulation' | 'clustering' | 'finalization';
  
  /** Progress percentage (0-100) */
  percentage: number;
  
  /** Human-readable status message */
  message: string;
  
  /** Performance metrics at current state */
  metrics: PerformanceMetrics;
  
  /** Whether processing can be cancelled */
  cancellable: boolean;
}