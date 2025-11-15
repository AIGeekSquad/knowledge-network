/**
 * Pipeline Coordinator Contracts
 * 
 * Defines interfaces for centralized progress coordination across all pipeline stages,
 * supporting the sequential processing architecture where NodeLayout completes before
 * EdgeGenerator, followed by rendering. Provides unified progress reporting and error handling.
 * 
 * Key Integration Points:
 * - Sequential pipeline stages with 100% completion gates between stages
 * - Centralized progress aggregation with detailed stage breakdown
 * - Pipeline stage coordination (NodePositioning → EdgeCalculation → Rendering)
 * - Async pipeline execution with progress callbacks
 * - Error handling and recovery across pipeline stages
 */

import { LayoutNode } from './layout-engine';
import { EdgeLayout } from './rendering-strategy';

// Core Pipeline Coordinator Interface
export interface IPipelineCoordinator {
  /**
   * Execute complete pipeline from data input to final rendering
   * @param input Pipeline input data and configuration
   * @param progress Optional progress callback for unified status reporting
   * @returns Promise resolving to pipeline execution result
   */
  executeAsync(input: PipelineInput, progress?: PipelineProgressCallback): Promise<PipelineResult>;
  
  /**
   * Execute specific pipeline stage
   * @param stage Stage to execute
   * @param input Stage-specific input data
   * @param progress Optional progress callback for stage
   * @returns Promise resolving to stage output
   */
  executeStageAsync<T, U>(
    stage: PipelineStage, 
    input: T, 
    progress?: StageProgressCallback
  ): Promise<U>;
  
  /**
   * Get current pipeline status
   * @returns Current execution status and progress
   */
  getStatus(): PipelineStatus;
  
  /**
   * Cancel pipeline execution
   * @param reason Optional cancellation reason
   */
  cancelAsync(reason?: string): Promise<void>;
  
  /**
   * Register stage-specific processor
   * @param stage Pipeline stage
   * @param processor Stage processor implementation
   */
  registerStageProcessor<T, U>(stage: PipelineStage, processor: IStageProcessor<T, U>): void;
  
  /**
   * Configure pipeline coordination settings
   * @param config Coordination configuration
   */
  configure(config: PipelineCoordinationConfig): void;
}

// Pipeline Stages (Sequential as per clarifications)
export type PipelineStage = 
  | 'initialization'     // Data loading and validation
  | 'node-positioning'   // NodeLayout processing (002-node-layout)
  | 'clustering'         // Node clustering based on similarity measures
  | 'edge-calculation'   // EdgeGenerator processing (003-edge-generator)  
  | 'edge-bundling'      // Edge bundling compatibility scoring
  | 'rendering'          // Visual rendering strategy execution
  | 'post-processing';   // Final optimizations and cleanup

// Pipeline Input
export interface PipelineInput {
  /** Input graph dataset */
  dataset: GraphDataset;
  
  /** Pipeline configuration */
  config: PipelineConfiguration;
  
  /** Target container for rendering */
  container: HTMLElement;
  
  /** Processing options */
  options: PipelineOptions;
}

// Pipeline Configuration (Hierarchical as per clarifications)
export interface PipelineConfiguration {
  /** Layout engine configuration */
  layout: LayoutStageConfig;
  
  /** Edge generation configuration */
  edgeGeneration: EdgeGenerationStageConfig;
  
  /** Rendering configuration */
  rendering: RenderingStageConfig;
  
  /** Progress reporting configuration */
  progress: ProgressReportingConfig;
  
  /** Performance constraints */
  performance: PerformanceConstraints;
  
  /** Error handling configuration */
  errorHandling: ErrorHandlingConfig;
}

// Stage Configurations
export interface LayoutStageConfig {
  /** Layout engine to use */
  engine: string;
  
  /** Force simulation parameters */
  forceConfig: any; // ForceConfig from layout-engine.ts
  
  /** Clustering configuration */
  clustering: any; // ClusteringConfig from layout-engine.ts
  
  /** Similarity measures to apply */
  similarityMeasures: string[];
  
  /** Stage-specific performance settings */
  performance: StagePerformanceConfig;
}

export interface EdgeGenerationStageConfig {
  /** Edge generation strategy */
  strategy: string;
  
  /** Compatibility calculation settings */
  compatibility: any; // CompatibilityConfig from EdgeGenerator
  
  /** Bundling preparation settings */
  bundling: any; // BundlingConfig from EdgeGenerator
  
  /** Stage-specific performance settings */
  performance: StagePerformanceConfig;
}

export interface RenderingStageConfig {
  /** Rendering strategy to use */
  strategy: 'simple' | 'bundling' | 'webgl';
  
  /** Visual configuration */
  visual: any; // VisualConfig from rendering-strategy.ts
  
  /** Interaction configuration */
  interaction: any; // InteractionConfig from rendering-strategy.ts
  
  /** Stage-specific performance settings */
  performance: StagePerformanceConfig;
}

export interface StagePerformanceConfig {
  /** Maximum execution time for stage (ms) */
  timeout: number;
  
  /** Memory limit for stage (MB) */
  memoryLimit: number;
  
  /** Enable stage-specific monitoring */
  monitoring: boolean;
}

// Progress Reporting Configuration
export interface ProgressReportingConfig {
  /** Stage weight for overall progress calculation */
  stageWeights: Map<PipelineStage, number>;
  
  /** Progress reporting interval (ms) */
  reportingInterval: number;
  
  /** Enable detailed stage breakdown */
  detailedBreakdown: boolean;
  
  /** Progress message verbosity */
  verbosity: 'minimal' | 'standard' | 'detailed';
}

// Performance Constraints
export interface PerformanceConstraints {
  /** Overall pipeline timeout (ms) */
  overallTimeout: number;
  
  /** Total memory limit (MB) */
  totalMemoryLimit: number;
  
  /** Target completion time (ms) */
  targetCompletionTime: number;
  
  /** Enable automatic degradation */
  enableDegradation: boolean;
  
  /** Performance monitoring */
  monitoring: PerformanceMonitoringConfig;
}

export interface PerformanceMonitoringConfig {
  /** Enable performance tracking */
  enabled: boolean;
  
  /** Sampling interval (ms) */
  samplingInterval: number;
  
  /** Track memory usage */
  trackMemory: boolean;
  
  /** Track CPU usage */
  trackCPU: boolean;
  
  /** Performance alerts */
  alerts: PerformanceAlerts;
}

export interface PerformanceAlerts {
  /** Memory threshold for warnings (%) */
  memoryWarningThreshold: number;
  
  /** CPU threshold for warnings (%) */
  cpuWarningThreshold: number;
  
  /** Time threshold for warnings (ms) */
  timeWarningThreshold: number;
}

// Error Handling Configuration
export interface ErrorHandlingConfig {
  /** Error handling strategy */
  strategy: 'fail-fast' | 'continue-on-error' | 'retry';
  
  /** Maximum retry attempts */
  maxRetries: number;
  
  /** Retry delay (ms) */
  retryDelay: number;
  
  /** Enable error recovery */
  enableRecovery: boolean;
  
  /** Fallback configurations */
  fallbacks: Map<PipelineStage, any>;
}

// Pipeline Options
export interface PipelineOptions {
  /** Skip specific stages (for testing/debugging) */
  skipStages: Set<PipelineStage>;
  
  /** Resume from specific stage */
  resumeFromStage?: PipelineStage;
  
  /** Dry run mode (validation only) */
  dryRun: boolean;
  
  /** Enable debug logging */
  debug: boolean;
  
  /** Pipeline execution mode */
  mode: 'sequential' | 'parallel-where-safe';
  
  /** Enable stage caching */
  enableCaching: boolean;
}

// Pipeline Result
export interface PipelineResult {
  /** Execution success status */
  success: boolean;
  
  /** Final positioned nodes */
  nodes: Map<string, LayoutNode>;
  
  /** Final edge layouts */
  edges: EdgeLayout[];
  
  /** Execution statistics */
  statistics: PipelineStatistics;
  
  /** Any errors encountered */
  errors: PipelineError[];
  
  /** Performance metrics */
  performance: PipelinePerformanceMetrics;
  
  /** Stage-specific results */
  stageResults: Map<PipelineStage, StageResult>;
}

// Pipeline Statistics
export interface PipelineStatistics {
  /** Total execution time (ms) */
  totalExecutionTime: number;
  
  /** Time per stage */
  stageExecutionTimes: Map<PipelineStage, number>;
  
  /** Nodes processed */
  nodesProcessed: number;
  
  /** Edges processed */
  edgesProcessed: number;
  
  /** Memory usage statistics */
  memoryStats: MemoryStatistics;
  
  /** Cache statistics (if caching enabled) */
  cacheStats?: CacheStatistics;
}

export interface MemoryStatistics {
  /** Peak memory usage (MB) */
  peakUsage: number;
  
  /** Average memory usage (MB) */
  averageUsage: number;
  
  /** Memory usage per stage */
  stageUsage: Map<PipelineStage, number>;
  
  /** Garbage collection events */
  gcEvents: number;
}

export interface CacheStatistics {
  /** Cache hits */
  hits: number;
  
  /** Cache misses */
  misses: number;
  
  /** Cache hit ratio */
  hitRatio: number;
  
  /** Cache size (MB) */
  size: number;
}

// Pipeline Status (Enhanced from data-model.md)
export interface PipelineStatus {
  /** Current active stage */
  currentStage: PipelineStage;
  
  /** Progress percentage for each stage (0-100) */
  stageProgress: Map<PipelineStage, number>;
  
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  
  /** Stage timing information */
  stageTimings: Map<PipelineStage, StageTimingInfo>;
  
  /** Errors encountered during processing */
  errors: PipelineError[];
  
  /** Warnings (e.g., performance, dataset size) */
  warnings: PipelineWarning[];
  
  /** Whether pipeline is currently active */
  isActive: boolean;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
  
  /** Current stage message */
  currentMessage: string;
}

export interface StageTimingInfo {
  /** Stage start time */
  startTime: number;
  
  /** Stage end time (if completed) */
  endTime?: number;
  
  /** Stage duration (ms) */
  duration?: number;
  
  /** Expected duration (ms) */
  expectedDuration?: number;
}

// Pipeline Errors and Warnings
export interface PipelineError {
  /** Error type */
  type: 'validation' | 'processing' | 'timeout' | 'memory' | 'configuration';
  
  /** Error message */
  message: string;
  
  /** Error code */
  code: string;
  
  /** Stage where error occurred */
  stage: PipelineStage;
  
  /** Error timestamp */
  timestamp: number;
  
  /** Stack trace for debugging */
  stackTrace?: string;
  
  /** Recovery suggestions */
  recoverySuggestions?: string[];
}

export interface PipelineWarning {
  /** Warning type */
  type: 'performance' | 'memory' | 'dataset-size' | 'configuration';
  
  /** Warning message */
  message: string;
  
  /** Warning severity */
  severity: 'low' | 'medium' | 'high';
  
  /** Stage where warning occurred */
  stage: PipelineStage;
  
  /** Warning timestamp */
  timestamp: number;
}

// Stage Processor Interface
export interface IStageProcessor<TInput, TOutput> {
  /**
   * Process stage with given input
   * @param input Stage input data
   * @param config Stage configuration
   * @param progress Progress callback
   * @returns Promise resolving to stage output
   */
  processAsync(
    input: TInput, 
    config: any, 
    progress?: StageProgressCallback
  ): Promise<TOutput>;
  
  /**
   * Validate stage input
   * @param input Input to validate
   * @returns Validation result
   */
  validateInput(input: TInput): ValidationResult;
  
  /**
   * Get stage capabilities
   */
  getCapabilities(): StageCapabilities;
  
  /**
   * Clean up stage resources
   */
  cleanup(): void;
}

export interface StageCapabilities {
  /** Maximum recommended input size */
  maxInputSize: number;
  
  /** Expected time complexity */
  timeComplexity: string;
  
  /** Expected space complexity */
  spaceComplexity: string;
  
  /** Supported configuration options */
  supportedOptions: string[];
  
  /** Whether stage supports cancellation */
  supportsCancellation: boolean;
  
  /** Whether stage supports progress reporting */
  supportsProgress: boolean;
}

// Stage Result
export interface StageResult {
  /** Stage execution success */
  success: boolean;
  
  /** Stage output data */
  output: any;
  
  /** Stage execution time (ms) */
  executionTime: number;
  
  /** Stage memory usage (MB) */
  memoryUsage: number;
  
  /** Stage-specific metrics */
  metrics: any;
  
  /** Stage errors (if any) */
  errors: PipelineError[];
  
  /** Stage warnings (if any) */
  warnings: PipelineWarning[];
}

// Progress Callbacks
export type PipelineProgressCallback = (progress: PipelineProgressInfo) => void;
export type StageProgressCallback = (progress: StageProgressInfo) => void;

export interface PipelineProgressInfo {
  /** Overall progress percentage (0-100) */
  overallProgress: number;
  
  /** Current active stage */
  currentStage: PipelineStage;
  
  /** Current stage progress (0-100) */
  currentStageProgress: number;
  
  /** Progress message */
  message: string;
  
  /** Detailed stage breakdown */
  stageBreakdown: Map<PipelineStage, number>;
  
  /** Performance metrics */
  metrics: PipelinePerformanceSnapshot;
  
  /** Estimated time remaining (ms) */
  estimatedTimeRemaining?: number;
}

export interface StageProgressInfo {
  /** Stage being processed */
  stage: PipelineStage;
  
  /** Stage progress percentage (0-100) */
  percentage: number;
  
  /** Stage status message */
  message: string;
  
  /** Items processed */
  itemsProcessed: number;
  
  /** Total items to process */
  totalItems: number;
  
  /** Stage performance metrics */
  metrics: StagePerformanceSnapshot;
}

// Performance Metrics
export interface PipelinePerformanceMetrics {
  /** Total execution time (ms) */
  totalTime: number;
  
  /** Time per stage */
  stageTimings: Map<PipelineStage, number>;
  
  /** Peak memory usage (MB) */
  peakMemory: number;
  
  /** Average FPS during execution */
  averageFPS: number;
  
  /** Performance bottlenecks identified */
  bottlenecks: PerformanceBottleneck[];
}

export interface PerformanceBottleneck {
  /** Stage where bottleneck occurred */
  stage: PipelineStage;
  
  /** Bottleneck type */
  type: 'cpu' | 'memory' | 'io';
  
  /** Bottleneck severity */
  severity: 'minor' | 'moderate' | 'severe';
  
  /** Description */
  description: string;
  
  /** Optimization suggestions */
  suggestions: string[];
}

export interface PipelinePerformanceSnapshot {
  /** Current memory usage (MB) */
  memoryUsage: number;
  
  /** Current CPU usage (%) */
  cpuUsage: number;
  
  /** Current FPS */
  currentFPS: number;
  
  /** Processing rate (items/second) */
  processingRate: number;
}

export interface StagePerformanceSnapshot {
  /** Stage memory usage (MB) */
  memoryUsage: number;
  
  /** Stage CPU usage (%) */
  cpuUsage: number;
  
  /** Stage processing time so far (ms) */
  processingTime: number;
  
  /** Items processed per second */
  itemsPerSecond: number;
}

// Pipeline Coordinator Configuration
export interface PipelineCoordinationConfig {
  /** Default stage weights for progress calculation */
  defaultStageWeights: Map<PipelineStage, number>;
  
  /** Progress reporting configuration */
  progressReporting: ProgressReportingConfig;
  
  /** Performance monitoring configuration */
  performanceMonitoring: PerformanceMonitoringConfig;
  
  /** Error handling configuration */
  errorHandling: ErrorHandlingConfig;
  
  /** Stage dependency configuration */
  stageDependencies: StageDependencyConfig;
}

export interface StageDependencyConfig {
  /** Required completion percentage for stage transitions */
  completionThresholds: Map<PipelineStage, number>;
  
  /** Stage dependencies (which stages must complete first) */
  dependencies: Map<PipelineStage, PipelineStage[]>;
  
  /** Conditional stage execution rules */
  conditionalExecution: Map<PipelineStage, (context: any) => boolean>;
}

// GraphDataset (reused from data-model.md)
export interface GraphDataset {
  nodes: any[];
  edges: any[];
  metadata?: any;
  fieldMappings: any;
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