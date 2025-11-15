/**
 * Similarity Measure Contracts
 * 
 * Defines interfaces for runtime-extensible similarity functions that enable
 * custom node clustering and grouping strategies. Pure function approach with
 * namespace separation to prevent conflicts between similarity and compatibility functions.
 * 
 * Key Integration Points:
 * - Pure functions with (nodeA, nodeB, context) => number signature
 * - Runtime registration in separate "similarity" namespace
 * - <50 lines of code requirement for custom implementations
 * - Mathematical averaging for conflicting similarity scores
 * - Integration with clustering algorithms and layout engines
 */

import { Node } from '../../../packages/knowledge-network/src/types';
import { LayoutNode, LayoutContext } from './layout-engine';

// Core Similarity Measure Interface
export interface ISimilarityMeasure {
  /** Unique identifier for this similarity measure */
  readonly id: string;
  
  /** Human-readable name */
  readonly name: string;
  
  /** Description of what this measure calculates */
  readonly description: string;
  
  /** The pure function implementing similarity calculation */
  readonly calculateSimilarity: SimilarityFunction;
  
  /** Configuration schema for this measure */
  readonly configSchema: SimilarityConfigSchema;
  
  /** Version for compatibility tracking */
  readonly version: string;
}

// Similarity Function Type (Pure Function as specified in clarifications)
export type SimilarityFunction = (
  nodeA: Node,
  nodeB: Node, 
  context: ClusteringContext
) => number;

// Clustering Context (Enhanced Layout Context)
export interface ClusteringContext {
  /** Current clustering iteration */
  iteration: number;
  
  /** All nodes being processed with current layout positions */
  nodes: Map<string, LayoutNode>;
  
  /** Clustering-specific configuration */
  config: ClusteringConfiguration;
  
  /** Performance metrics and constraints */
  performance: ClusteringPerformanceMetrics;
  
  /** Previously calculated similarity scores */
  existingSimilarities: Map<string, Map<string, number>>;
  
  /** Current cluster assignments */
  clusterAssignments: Map<string, string>;
}

// Clustering Configuration
export interface ClusteringConfiguration {
  /** Similarity threshold for cluster membership */
  similarityThreshold: number;
  
  /** Maximum nodes per cluster */
  maxClusterSize: number;
  
  /** Minimum similarity for cluster creation */
  minClusterSimilarity: number;
  
  /** Cluster separation distance */
  separationDistance: number;
  
  /** Weight for different similarity measures */
  measureWeights: Map<string, number>;
  
  /** Conflict resolution strategy */
  conflictResolution: ConflictResolutionStrategy;
}

export type ConflictResolutionStrategy = 'average' | 'weighted-average' | 'max' | 'min';

// Performance Metrics for Clustering
export interface ClusteringPerformanceMetrics {
  /** Processing time so far (ms) */
  processingTime: number;
  
  /** Memory usage (MB) */
  memoryUsage: number;
  
  /** Number of similarity calculations performed */
  calculationsPerformed: number;
  
  /** Current clusters formed */
  clustersFormed: number;
  
  /** Clustering quality metrics */
  qualityMetrics: ClusteringQualityMetrics;
}

export interface ClusteringQualityMetrics {
  /** Average intra-cluster similarity */
  avgIntraClusterSimilarity: number;
  
  /** Average inter-cluster dissimilarity */
  avgInterClusterDissimilarity: number;
  
  /** Silhouette score */
  silhouetteScore: number;
  
  /** Modularity score */
  modularityScore: number;
}

// Similarity Measure Registry
export interface ISimilarityMeasureRegistry {
  /**
   * Register a new similarity measure
   * @param measure Similarity measure to register
   * @throws Error if measure ID conflicts or validation fails
   */
  register(measure: ISimilarityMeasure): void;
  
  /**
   * Unregister a similarity measure
   * @param id Measure ID to unregister
   */
  unregister(id: string): void;
  
  /**
   * Get a registered similarity measure by ID
   * @param id Measure ID
   * @returns Similarity measure or undefined if not found
   */
  get(id: string): ISimilarityMeasure | undefined;
  
  /**
   * List all registered similarity measure IDs
   * @returns Array of measure IDs
   */
  list(): string[];
  
  /**
   * Validate a similarity function before registration
   * @param fn Function to validate
   * @returns Validation result
   */
  validateFunction(fn: SimilarityFunction): ValidationResult;
  
  /**
   * Get measures by category or tag
   * @param category Category to filter by
   * @returns Array of matching measures
   */
  getByCategory(category: string): ISimilarityMeasure[];
}

// Configuration Schema for Similarity Measures
export interface SimilarityConfigSchema {
  /** Schema version */
  version: string;
  
  /** Required parameters */
  required: ParameterDefinition[];
  
  /** Optional parameters */
  optional: ParameterDefinition[];
  
  /** Default configuration values */
  defaults: Record<string, any>;
  
  /** Validation rules */
  validation: ValidationRule[];
}

export interface ParameterDefinition {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: 'number' | 'string' | 'boolean' | 'object' | 'array';
  
  /** Description */
  description: string;
  
  /** Valid range or enum values */
  constraints?: ParameterConstraints;
  
  /** Default value */
  defaultValue?: any;
}

export interface ParameterConstraints {
  /** Minimum value (for numbers) */
  min?: number;
  
  /** Maximum value (for numbers) */
  max?: number;
  
  /** Valid values (for enums) */
  enum?: any[];
  
  /** Pattern (for strings) */
  pattern?: string;
  
  /** Custom validation function */
  custom?: (value: any) => boolean;
}

export interface ValidationRule {
  /** Rule name */
  name: string;
  
  /** Validation function */
  validate: (config: any) => boolean;
  
  /** Error message if validation fails */
  errorMessage: string;
}

// Built-in Similarity Measures

// Euclidean Distance Similarity
export interface EuclideanSimilarityConfig {
  /** Weight for coordinate distance */
  coordinateWeight: number;
  
  /** Include derived properties in calculation */
  includeProperties: boolean;
  
  /** Property weights */
  propertyWeights: Map<string, number>;
}

// Jaccard Similarity for Set-based Properties
export interface JaccardSimilarityConfig {
  /** Properties to compare as sets */
  setProperties: string[];
  
  /** Weight for each property */
  propertyWeights: Map<string, number>;
  
  /** Minimum set size for meaningful comparison */
  minSetSize: number;
}

// Semantic Similarity (if embedding data available)
export interface SemanticSimilarityConfig {
  /** Embedding property name */
  embeddingProperty: string;
  
  /** Similarity metric */
  metric: 'cosine' | 'euclidean' | 'manhattan';
  
  /** Normalization strategy */
  normalization: 'none' | 'l1' | 'l2';
}

// Graph Structure Similarity
export interface StructuralSimilarityConfig {
  /** Include direct neighbors */
  includeDirectNeighbors: boolean;
  
  /** Include second-degree neighbors */
  includeSecondDegree: boolean;
  
  /** Weight for structural features */
  structureWeight: number;
  
  /** Weight for attribute features */
  attributeWeight: number;
}

// Similarity Calculation Result
export interface SimilarityResult {
  /** Calculated similarity score (0-1) */
  score: number;
  
  /** Confidence in the calculation */
  confidence: number;
  
  /** Breakdown of contributing factors */
  breakdown: SimilarityBreakdown;
  
  /** Processing metadata */
  metadata: SimilarityMetadata;
}

export interface SimilarityBreakdown {
  /** Contribution from different aspects */
  aspects: Map<string, number>;
  
  /** Weights applied */
  weights: Map<string, number>;
  
  /** Raw scores before weighting */
  rawScores: Map<string, number>;
}

export interface SimilarityMetadata {
  /** Calculation time (ms) */
  calculationTime: number;
  
  /** Memory used (bytes) */
  memoryUsed: number;
  
  /** Algorithm used */
  algorithm: string;
  
  /** Input data quality indicators */
  dataQuality: DataQualityMetrics;
}

export interface DataQualityMetrics {
  /** Completeness score (0-1) */
  completeness: number;
  
  /** Data freshness (age in ms) */
  freshness: number;
  
  /** Consistency score (0-1) */
  consistency: number;
}

// Batch Similarity Processing
export interface BatchSimilarityRequest {
  /** Node pairs to calculate similarity for */
  pairs: NodePair[];
  
  /** Similarity measures to apply */
  measures: string[];
  
  /** Processing options */
  options: BatchProcessingOptions;
}

export interface NodePair {
  nodeA: Node;
  nodeB: Node;
  /** Optional pair-specific context */
  context?: any;
}

export interface BatchProcessingOptions {
  /** Maximum processing time (ms) */
  timeout: number;
  
  /** Process in parallel batches */
  parallel: boolean;
  
  /** Batch size for parallel processing */
  batchSize: number;
  
  /** Progress callback */
  onProgress?: (progress: BatchProgress) => void;
}

export interface BatchProgress {
  /** Pairs processed so far */
  processed: number;
  
  /** Total pairs to process */
  total: number;
  
  /** Processing rate (pairs/second) */
  rate: number;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining: number;
}

export interface BatchSimilarityResult {
  /** Results indexed by node pair */
  results: Map<string, Map<string, SimilarityResult>>;
  
  /** Processing statistics */
  statistics: BatchStatistics;
  
  /** Any errors encountered */
  errors: ProcessingError[];
}

export interface BatchStatistics {
  /** Total processing time (ms) */
  totalTime: number;
  
  /** Average calculation time per pair (ms) */
  avgTimePerPair: number;
  
  /** Memory peak usage (MB) */
  peakMemoryUsage: number;
  
  /** Successfully processed pairs */
  successfulPairs: number;
  
  /** Failed pairs */
  failedPairs: number;
}

export interface ProcessingError {
  /** Error type */
  type: 'timeout' | 'memory' | 'validation' | 'calculation';
  
  /** Error message */
  message: string;
  
  /** Node pair that caused the error */
  pair?: NodePair;
  
  /** Similarity measure that failed */
  measure?: string;
  
  /** Stack trace for debugging */
  stackTrace?: string;
}

// Validation Result (reused from other contracts)
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
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

// Helper Types for Mathematical Operations
export type ConflictResolutionFunction = (
  scores: number[],
  weights?: number[]
) => number;

// Factory for creating common similarity measures
export interface ISimilarityMeasureFactory {
  createEuclideanSimilarity(config: EuclideanSimilarityConfig): ISimilarityMeasure;
  createJaccardSimilarity(config: JaccardSimilarityConfig): ISimilarityMeasure;
  createSemanticSimilarity(config: SemanticSimilarityConfig): ISimilarityMeasure;
  createStructuralSimilarity(config: StructuralSimilarityConfig): ISimilarityMeasure;
  createCustomSimilarity(
    id: string,
    name: string,
    fn: SimilarityFunction,
    schema: SimilarityConfigSchema
  ): ISimilarityMeasure;
}