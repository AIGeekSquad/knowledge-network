# API Interfaces: EdgeGenerator Module

**Date**: 2025-11-13  
**Feature**: EdgeGenerator Module  
**Branch**: `003-edge-generator`

## Overview

This document defines the async/Promise-based API interfaces for the EdgeGenerator module, emphasizing the requirement that ALL APIs MUST be async and use Promises for edge generation operations.

## Core API Interfaces

### EdgeGenerationEngine

**Description**: Main orchestration interface for async edge generation with functor-based extensibility.

```typescript
interface EdgeGenerationEngine {
  /**
   * Generate edge structures from relationship data (ASYNC REQUIRED)
   * @param relationships - Input relationship data
   * @param layoutNodes - Positioned node structures from node layout
   * @param config - Edge generation configuration
   * @returns Promise resolving to complete edge generation result
   */
  generateEdgesAsync(
    relationships: Relationship[],
    layoutNodes: LayoutNode[],
    config: EdgeGenerationConfig
  ): Promise<EdgeGenerationResult>;

  /**
   * Calculate edge compatibility matrix (ASYNC REQUIRED)
   * @param edges - Edge structures to analyze
   * @param compatibilityFunctor - Functor for compatibility calculation
   * @param context - Runtime context for optimization
   * @returns Promise resolving to compatibility matrix
   */
  calculateCompatibilityAsync(
    edges: EdgeLayout[],
    compatibilityFunctor: CompatibilityFunctor,
    context?: EdgeContext
  ): Promise<CompatibilityMatrix>;

  /**
   * Register custom compatibility functor at runtime
   * @param name - Unique functor identifier
   * @param functor - Compatibility calculation function
   * @returns void (synchronous registration)
   */
  registerCompatibilityFunctor(
    name: string,
    functor: CompatibilityFunctor
  ): void;

  /**
   * Unregister custom compatibility functor
   * @param name - Functor identifier to remove
   * @returns boolean indicating success
   */
  unregisterCompatibilityFunctor(name: string): boolean;

  /**
   * List registered compatibility functors
   * @returns Array of registered functor names
   */
  listCompatibilityFunctors(): string[];

  /**
   * Generate bundling-ready edge groups (ASYNC REQUIRED)
   * @param edges - Edge structures with compatibility data
   * @param thresholds - Bundling threshold configuration
   * @returns Promise resolving to bundling groups
   */
  prepareBundlingGroupsAsync(
    edges: EdgeLayout[],
    thresholds: DynamicThresholds
  ): Promise<BundlingData>;

  /**
   * Cancel ongoing edge generation operation
   * @param sessionId - Generation session identifier
   * @returns Promise resolving when cancellation is complete
   */
  cancelGenerationAsync(sessionId: string): Promise<void>;

  /**
   * Get generation progress for active session
   * @param sessionId - Generation session identifier
   * @returns Promise resolving to current progress state
   */
  getGenerationProgressAsync(sessionId: string): Promise<EdgeGenerationProgressEvent | null>;
}
```

### RelationshipProcessor

**Description**: Async relationship data processing with LayoutNode integration.

```typescript
interface RelationshipProcessor {
  /**
   * Process relationship data into EdgeLayout structures (ASYNC REQUIRED)
   * @param relationships - Input relationship data
   * @param layoutNodes - Available positioned nodes
   * @param config - Processing configuration
   * @returns Promise resolving to processed edge structures
   */
  processRelationshipsAsync(
    relationships: Relationship[],
    layoutNodes: Map<string, LayoutNode>,
    config: RelationshipProcessingConfig
  ): Promise<EdgeLayout[]>;

  /**
   * Validate relationship references against available nodes (ASYNC REQUIRED)
   * @param relationships - Relationships to validate
   * @param availableNodes - Set of valid node IDs
   * @returns Promise resolving to validation results
   */
  validateRelationshipReferencesAsync(
    relationships: Relationship[],
    availableNodes: Set<string>
  ): Promise<ValidationResult>;

  /**
   * Create EdgeLayout from validated relationship (ASYNC REQUIRED)
   * @param relationship - Source relationship data
   * @param sourceNode - Source LayoutNode
   * @param targetNode - Target LayoutNode
   * @param context - Processing context
   * @returns Promise resolving to EdgeLayout structure
   */
  createEdgeLayoutAsync(
    relationship: Relationship,
    sourceNode: LayoutNode,
    targetNode: LayoutNode,
    context: EdgeContext
  ): Promise<EdgeLayout>;

  /**
   * Batch process relationships with progress tracking (ASYNC REQUIRED)
   * @param relationships - Input relationships
   * @param layoutNodes - Available nodes
   * @param batchConfig - Batch processing configuration
   * @param progressCallback - Progress event handler
   * @returns Promise resolving to batch processing results
   */
  batchProcessRelationshipsAsync(
    relationships: Relationship[],
    layoutNodes: Map<string, LayoutNode>,
    batchConfig: BatchProcessingConfig,
    progressCallback?: ProgressCallback
  ): Promise<BatchProcessingResult>;
}

interface RelationshipProcessingConfig {
  readonly idGenerator: EdgeIdGenerator;
  readonly validateReferences: boolean;
  readonly preserveMetadata: boolean;
  readonly calculateGeometry: boolean;
  readonly errorHandling: ErrorHandlingStrategy;
}

interface BatchProcessingConfig extends RelationshipProcessingConfig {
  readonly chunkSize: number;
  readonly maxConcurrent: number;
  readonly memoryThreshold: number;
  readonly timeoutMs: number;
}

interface BatchProcessingResult {
  readonly edges: EdgeLayout[];
  readonly processed: number;
  readonly failed: number;
  readonly errors: ProcessingError[];
  readonly performance: BatchPerformanceMetrics;
}

interface ProcessingError {
  readonly relationshipId: string;
  readonly error: Error;
  readonly retry: boolean;
}

interface BatchPerformanceMetrics {
  readonly totalTime: number;
  readonly averageChunkTime: number;
  readonly memoryUsage: number;
  readonly throughput: number; // relationships/second
}
```

### CompatibilityProcessor

**Description**: Async compatibility calculation with spatial optimization and caching.

```typescript
interface CompatibilityProcessor {
  /**
   * Calculate pairwise edge compatibility (ASYNC REQUIRED)
   * @param edgeA - First edge for comparison
   * @param edgeB - Second edge for comparison
   * @param functor - Compatibility calculation function
   * @param context - Processing context
   * @returns Promise resolving to compatibility score
   */
  calculatePairwiseCompatibility(
    edgeA: EdgeLayout,
    edgeB: EdgeLayout,
    functor: CompatibilityFunctor,
    context: EdgeContext
  ): Promise<number>;

  /**
   * Build complete compatibility matrix (ASYNC REQUIRED)
   * @param edges - All edges for matrix calculation
   * @param functor - Compatibility calculation function
   * @param config - Matrix calculation configuration
   * @returns Promise resolving to full compatibility matrix
   */
  buildCompatibilityMatrix(
    edges: EdgeLayout[],
    functor: CompatibilityFunctor,
    config: MatrixCalculationConfig
  ): Promise<CompatibilityMatrix>;

  /**
   * Calculate progressive compatibility with spatial optimization (ASYNC REQUIRED)
   * @param edges - Edges for calculation
   * @param functor - Compatibility function
   * @param spatialConfig - Spatial optimization settings
   * @param progressCallback - Progress tracking callback
   * @returns Promise resolving to optimized compatibility matrix
   */
  calculateProgressiveCompatibilityAsync(
    edges: EdgeLayout[],
    functor: CompatibilityFunctor,
    spatialConfig: SpatialOptimizationConfig,
    progressCallback?: ProgressCallback
  ): Promise<CompatibilityMatrix>;

  /**
   * Validate functor output and normalize results (ASYNC REQUIRED)
   * @param compatibility - Raw compatibility score
   * @param edgeA - First edge
   * @param edgeB - Second edge
   * @param normalizationMethod - Normalization strategy
   * @returns Promise resolving to validated and normalized score
   */
  validateFunctorOutputAsync(
    compatibility: number,
    edgeA: EdgeLayout,
    edgeB: EdgeLayout,
    normalizationMethod: NormalizationMethod
  ): Promise<number>;

  /**
   * Calculate dynamic compatibility thresholds (ASYNC REQUIRED)
   * @param matrix - Compatibility matrix for analysis
   * @param edges - Edge structures for context
   * @returns Promise resolving to dynamic threshold configuration
   */
  calculateDynamicThresholdsAsync(
    matrix: CompatibilityMatrix,
    edges: EdgeLayout[]
  ): Promise<DynamicThresholds>;

  /**
   * Clear compatibility cache and reset state
   * @returns Promise resolving when cleanup is complete
   */
  clearCacheAsync(): Promise<void>;
}

interface MatrixCalculationConfig {
  readonly spatialOptimization: boolean;
  readonly progressiveCalculation: boolean;
  readonly cacheResults: boolean;
  readonly normalizationMethod: NormalizationMethod;
  readonly parallelWorkers: number;
  readonly chunkSize: number;
}

interface SpatialOptimizationConfig {
  readonly gridSize: number;
  readonly proximityRadius: number;
  readonly enableSpatialIndex: boolean;
  readonly adaptiveGridSizing: boolean;
}
```

### PipelineEventEmitter

**Description**: Event-driven pipeline coordination with Promise-based event handling.

```typescript
interface PipelineEventEmitter extends EventTarget {
  /**
   * Wait for specific pipeline event (ASYNC REQUIRED)
   * @param eventType - Type of event to wait for
   * @param timeoutMs - Maximum wait time
   * @returns Promise resolving to event data
   */
  waitForAsync<T>(eventType: string, timeoutMs?: number): Promise<T>;

  /**
   * Emit pipeline event with data
   * @param eventType - Type of event to emit
   * @param data - Event data payload
   * @returns void (synchronous emission)
   */
  emit<T>(eventType: string, data: T): void;

  /**
   * Register event listener with Promise support
   * @param eventType - Event type to listen for
   * @param listener - Event handler function
   * @param options - Event listener options
   * @returns Promise resolving when listener is registered
   */
  registerListenerAsync<T>(
    eventType: string,
    listener: (data: T) => Promise<void> | void,
    options?: EventListenerOptions
  ): Promise<void>;

  /**
   * Remove event listener
   * @param eventType - Event type
   * @param listener - Handler to remove
   * @returns Promise resolving when removal is complete
   */
  removeListenerAsync<T>(
    eventType: string,
    listener: (data: T) => Promise<void> | void
  ): Promise<void>;

  /**
   * Clear all event listeners
   * @returns Promise resolving when cleanup is complete
   */
  clearListenersAsync(): Promise<void>;
}

interface EdgeGenerationPipeline {
  /**
   * Execute complete edge generation pipeline (ASYNC REQUIRED)
   * @param config - Generation configuration
   * @returns Promise resolving to complete generation result
   */
  executeAsync(config: EdgeGenerationConfig): Promise<EdgeGenerationResult>;

  /**
   * Execute pipeline stage by stage with coordination (ASYNC REQUIRED)
   * @param relationships - Input relationship data
   * @param layoutNodes - Positioned nodes
   * @param config - Generation configuration
   * @returns Promise resolving to generation result
   */
  executeStagedAsync(
    relationships: Relationship[],
    layoutNodes: LayoutNode[],
    config: EdgeGenerationConfig
  ): Promise<EdgeGenerationResult>;

  /**
   * Cancel pipeline execution
   * @param sessionId - Pipeline session identifier
   * @returns Promise resolving when cancellation is complete
   */
  cancelAsync(sessionId: string): Promise<void>;
}
```

## Error Handling Interfaces

### CircuitBreaker

**Description**: Circuit breaker pattern for resilient async operations.

```typescript
interface CircuitBreaker {
  /**
   * Execute operation with circuit breaker protection (ASYNC REQUIRED)
   * @param operation - Async operation to protect
   * @param fallback - Fallback operation on failure
   * @param context - Operation context
   * @returns Promise resolving to operation result
   */
  executeAsync<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>,
    context?: CircuitBreakerContext
  ): Promise<T>;

  /**
   * Check circuit breaker state
   * @returns Current circuit breaker state
   */
  getState(): CircuitBreakerState;

  /**
   * Reset circuit breaker to closed state
   * @returns Promise resolving when reset is complete
   */
  resetAsync(): Promise<void>;
}

interface CircuitBreakerContext {
  readonly operationName: string;
  readonly timeoutMs: number;
  readonly retryAttempts: number;
}

enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}
```

### AsyncErrorHandler

**Description**: Comprehensive error handling for async edge generation operations.

```typescript
interface AsyncErrorHandler {
  /**
   * Handle compatibility function failure with async fallback (ASYNC REQUIRED)
   * @param error - Error from custom compatibility function
   * @param edgeA - First edge in failed calculation
   * @param edgeB - Second edge in failed calculation
   * @param fallbackFunctor - Default fallback functor
   * @returns Promise resolving to fallback compatibility score
   */
  handleCompatibilityErrorAsync(
    error: Error,
    edgeA: EdgeLayout,
    edgeB: EdgeLayout,
    fallbackFunctor: CompatibilityFunctor
  ): Promise<number>;

  /**
   * Handle relationship processing timeout (ASYNC REQUIRED)
   * @param timeoutError - Timeout error details
   * @param partialResults - Partially processed results
   * @param remainingWork - Unprocessed relationships
   * @returns Promise resolving to recovery strategy
   */
  handleProcessingTimeoutAsync(
    timeoutError: TimeoutError,
    partialResults: EdgeLayout[],
    remainingWork: Relationship[]
  ): Promise<TimeoutRecoveryResult>;

  /**
   * Handle memory pressure during generation (ASYNC REQUIRED)
   * @param memoryError - Memory pressure details
   * @param currentState - Current generation state
   * @returns Promise resolving to memory management strategy
   */
  handleMemoryPressureAsync(
    memoryError: MemoryPressureError,
    currentState: GenerationState
  ): Promise<MemoryRecoveryResult>;
}

interface TimeoutError extends Error {
  readonly timeoutMs: number;
  readonly operationName: string;
  readonly partialProgress: number;
}

interface TimeoutRecoveryResult {
  readonly strategy: 'retry' | 'continue' | 'abort';
  readonly adjustedTimeout: number;
  readonly reducedBatchSize: number;
}

interface MemoryPressureError extends Error {
  readonly memoryUsage: number;
  readonly memoryLimit: number;
  readonly pressureLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface MemoryRecoveryResult {
  readonly strategy: 'reduce_batch' | 'clear_cache' | 'use_workers' | 'abort';
  readonly newBatchSize?: number;
  readonly cacheReduction?: number;
}

interface GenerationState {
  readonly sessionId: string;
  readonly phase: GenerationPhase;
  readonly processed: number;
  readonly total: number;
  readonly memoryUsage: number;
  readonly startTime: number;
}
```

## Validation Interfaces

### AsyncValidation

**Description**: Comprehensive async validation for edge generation inputs and outputs.

```typescript
interface AsyncValidator {
  /**
   * Validate edge generation configuration (ASYNC REQUIRED)
   * @param config - Configuration to validate
   * @returns Promise resolving to validation result
   */
  validateConfigurationAsync(config: EdgeGenerationConfig): Promise<ValidationResult>;

  /**
   * Validate relationship data integrity (ASYNC REQUIRED)
   * @param relationships - Relationships to validate
   * @param availableNodes - Valid node references
   * @returns Promise resolving to relationship validation result
   */
  validateRelationshipsAsync(
    relationships: Relationship[],
    availableNodes: Set<string>
  ): Promise<RelationshipValidationResult>;

  /**
   * Validate compatibility functor implementation (ASYNC REQUIRED)
   * @param functor - Functor to validate
   * @param testEdges - Test edges for validation
   * @returns Promise resolving to functor validation result
   */
  validateCompatibilityFunctorAsync(
    functor: CompatibilityFunctor,
    testEdges: EdgeLayout[]
  ): Promise<FunctorValidationResult>;

  /**
   * Validate generated edge layout structures (ASYNC REQUIRED)
   * @param edges - Generated edges to validate
   * @param originalRelationships - Source relationship data
   * @returns Promise resolving to edge validation result
   */
  validateEdgeLayoutsAsync(
    edges: EdgeLayout[],
    originalRelationships: Relationship[]
  ): Promise<EdgeValidationResult>;
}

interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

interface RelationshipValidationResult extends ValidationResult {
  readonly validRelationships: number;
  readonly invalidReferences: string[];
  readonly duplicateIds: string[];
}

interface FunctorValidationResult extends ValidationResult {
  readonly outputRange: [number, number];
  readonly averageExecutionTime: number;
  readonly errorRate: number;
  readonly recommendedNormalization: NormalizationMethod;
}

interface EdgeValidationResult extends ValidationResult {
  readonly integrityChecks: IntegrityCheckResult[];
  readonly geometryValidation: GeometryValidationResult;
  readonly compatibilityValidation: CompatibilityValidationResult;
}

interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
  readonly context?: Record<string, unknown>;
}

interface ValidationWarning extends ValidationError {
  readonly severity: 'warning';
  readonly suggestion?: string;
}

interface IntegrityCheckResult {
  readonly checkName: string;
  readonly passed: boolean;
  readonly details: string;
}

interface GeometryValidationResult {
  readonly validGeometry: boolean;
  readonly invalidEdges: string[];
  readonly geometryErrors: string[];
}

interface CompatibilityValidationResult {
  readonly scoresInRange: boolean;
  readonly matrixSymmetric: boolean;
  readonly compatibilityErrors: string[];
}
```

---

**Status**: ✅ Complete  
**Next**: Configuration schemas and event specifications