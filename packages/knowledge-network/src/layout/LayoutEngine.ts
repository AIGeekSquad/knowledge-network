/**
 * Layout Engine Implementation
 *
 * Main implementation of the ILayoutEngine interface that coordinates
 * layout calculation and serialization. Independent of rendering concerns.
 * Extended with runtime similarity function registration capabilities.
 *
 * @fileoverview Main layout engine implementation with similarity extension
 */

import { EventEmitter } from 'events';
import type { Node } from '../types';
import { LayoutCalculator } from './LayoutCalculator';
import { LayoutSerializer } from './LayoutSerializer';
import {
  SimilarityFunctionRegistry,
  createSimilarityFunctionRegistry,
  type ISimilarityMeasure,
  type ISimilarityMeasureRegistry,
  type SimilarityFunction,
  type ClusteringContext
} from '../modular/core/SimilarityFunctionRegistry';
import {
  SimilarityConflictResolver,
  createConflictResolver,
  type ConflictResolutionStrategy
} from '../modular/core/SimilarityConflictResolver';
import type {
  ILayoutEngine,
  LayoutNode,
  LayoutConfiguration,
  LayoutEngineCapabilities,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PerformanceMetrics,
  ProgressCallback
} from './layout-engine';

/**
 * Main Layout Engine implementation
 * Coordinates layout calculation, validation, and capabilities reporting
 * Extended with runtime similarity function registration capabilities
 */
export class LayoutEngine extends EventEmitter implements ILayoutEngine {
  private calculator: LayoutCalculator;
  private isProcessing = false;
  private lastLayoutMap: Map<string, LayoutNode> | null = null;
  private lastPerformanceMetrics: PerformanceMetrics | null = null;
  private similarityRegistry: ISimilarityMeasureRegistry;
  private conflictResolver: SimilarityConflictResolver;

  constructor() {
    super();
    this.calculator = new LayoutCalculator();
    this.similarityRegistry = createSimilarityFunctionRegistry();
    this.conflictResolver = createConflictResolver();
    
    // Forward calculator events
    this.calculator.on('progress', (progress) => {
      this.emit('progress', progress);
    });
  }

  /**
   * Execute complete layout calculation for nodes
   * Returns Map<string, LayoutNode> for O(1) lookups
   */
  async calculateAsync(
    nodes: Node[],
    config: LayoutConfiguration,
    progress?: ProgressCallback
  ): Promise<Map<string, LayoutNode>> {
    if (this.isProcessing) {
      throw new Error('Layout calculation already in progress. Call cleanup() first.');
    }

    // Validate configuration first
    const validation = this.validateConfiguration(config);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Configuration validation failed: ${errorMessages}`);
    }

    // Check node count against performance limits
    if (nodes.length > config.performanceSettings.warningThreshold) {
      progress?.({
        stage: 'initialization',
        percentage: 0,
        message: `Warning: Processing ${nodes.length} nodes exceeds recommended threshold of ${config.performanceSettings.warningThreshold}`,
        metrics: this.getDefaultMetrics(),
        cancellable: true
      });

      // Enable automatic degradation if configured
      if (config.performanceSettings.enableDegradation && 
          nodes.length > config.performanceSettings.warningThreshold * 2) {
        
        // Reduce max iterations for large datasets
        config = {
          ...config,
          maxIterations: Math.max(50, Math.floor(config.maxIterations * 0.5))
        };
        
        progress?.({
          stage: 'initialization',
          percentage: 5,
          message: `Automatic degradation enabled: Reduced iterations to ${config.maxIterations}`,
          metrics: this.getDefaultMetrics(),
          cancellable: true
        });
      }
    }

    try {
      this.isProcessing = true;

      // Use calculator for actual layout computation
      const layoutMap = await this.calculator.calculateAsync(nodes, config, progress);
      
      // Store results for later access
      this.lastLayoutMap = layoutMap;
      this.lastPerformanceMetrics = this.calculator.getPerformanceMetrics();

      // Emit completion event
      this.emit('layoutComplete', {
        nodeCount: layoutMap.size,
        processingTime: this.lastPerformanceMetrics.processingTime,
        iterations: this.lastPerformanceMetrics.iterations
      });

      return layoutMap;

    } catch (error) {
      this.emit('layoutError', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Validate configuration before execution
   */
  validateConfiguration(config: LayoutConfiguration): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate force parameters
    if (!config.forceParameters) {
      errors.push({
        field: 'forceParameters',
        message: 'Force parameters are required',
        code: 'MISSING_FORCE_PARAMS'
      });
    } else {
      // Check force parameter ranges
      if (config.forceParameters.centerForce < 0 || config.forceParameters.centerForce > 1) {
        errors.push({
          field: 'forceParameters.centerForce',
          message: 'Center force must be between 0 and 1',
          code: 'INVALID_FORCE_RANGE'
        });
      }

      if (config.forceParameters.chargeForce < 0 || config.forceParameters.chargeForce > 1) {
        errors.push({
          field: 'forceParameters.chargeForce',
          message: 'Charge force must be between 0 and 1',
          code: 'INVALID_FORCE_RANGE'
        });
      }

      if (config.forceParameters.collisionRadius <= 0) {
        errors.push({
          field: 'forceParameters.collisionRadius',
          message: 'Collision radius must be positive',
          code: 'INVALID_COLLISION_RADIUS'
        });
      }
    }

    // Validate clustering configuration
    if (config.clusteringConfig) {
      if (config.clusteringConfig.enabled && config.clusteringConfig.similarityThreshold <= 0) {
        errors.push({
          field: 'clusteringConfig.similarityThreshold',
          message: 'Similarity threshold must be positive when clustering is enabled',
          code: 'INVALID_SIMILARITY_THRESHOLD'
        });
      }

      if (config.clusteringConfig.maxClusterSize <= 0) {
        warnings.push({
          field: 'clusteringConfig.maxClusterSize',
          message: 'Max cluster size should be positive',
          severity: 'medium'
        });
      }
    }

    // Validate performance settings
    if (!config.performanceSettings) {
      warnings.push({
        field: 'performanceSettings',
        message: 'Performance settings not specified - using defaults',
        severity: 'low'
      });
    } else {
      if (config.performanceSettings.maxMemoryMB <= 0) {
        warnings.push({
          field: 'performanceSettings.maxMemoryMB',
          message: 'Max memory setting should be positive',
          severity: 'medium'
        });
      }

      if (config.performanceSettings.warningThreshold > 10000) {
        warnings.push({
          field: 'performanceSettings.warningThreshold',
          message: 'Warning threshold is very high - may impact performance',
          severity: 'high'
        });
      }
    }

    // Validate iteration limits
    if (config.maxIterations <= 0) {
      errors.push({
        field: 'maxIterations',
        message: 'Max iterations must be positive',
        code: 'INVALID_MAX_ITERATIONS'
      });
    } else if (config.maxIterations > 10000) {
      warnings.push({
        field: 'maxIterations',
        message: 'Very high iteration count may impact performance',
        severity: 'medium'
      });
    }

    // Validate stability threshold
    if (config.stabilityThreshold <= 0) {
      errors.push({
        field: 'stabilityThreshold',
        message: 'Stability threshold must be positive',
        code: 'INVALID_STABILITY_THRESHOLD'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clean up resources and stop any active simulations
   */
  cleanup(): void {
    this.isProcessing = false;
    this.calculator.cleanup();
    this.lastLayoutMap = null;
    this.lastPerformanceMetrics = null;
    this.removeAllListeners();
  }

  /**
   * Get current engine capabilities and limitations
   */
  getCapabilities(): LayoutEngineCapabilities {
    return {
      maxNodes: 50000, // Theoretical maximum - performance degrades beyond this
      supportedForces: [
        'center',
        'charge', 
        'link',
        'collision',
        'forceX',
        'forceY'
      ],
      clusteringAlgorithms: [
        'hierarchical',
        'kmeans', 
        'similarity-based'
      ],
      supportsRealTimeUpdates: true,
      performanceProfile: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(n)',
        recommendedFor: [
          'Knowledge graphs up to 5000 nodes',
          'Social networks',
          'Dependency graphs',
          'Mind maps',
          'Interactive visualizations'
        ]
      }
    };
  }

  /**
   * Get the last calculated layout (if any)
   */
  getLastLayout(): Map<string, LayoutNode> | null {
    return this.lastLayoutMap;
  }

  /**
   * Get the last performance metrics (if any)
   */
  getLastPerformanceMetrics(): PerformanceMetrics | null {
    return this.lastPerformanceMetrics;
  }

  /**
   * Serialize the last layout to JSON
   */
  serializeLayout(): string | null {
    if (!this.lastLayoutMap) {
      return null;
    }

    try {
      return LayoutSerializer.serialize(
        this.lastLayoutMap,
        {
          algorithm: 'force-directed',
          appVersion: '1.0.0'
        },
        this.lastPerformanceMetrics || undefined
      );
    } catch (error) {
      throw new Error(`Layout serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load layout from serialized JSON
   */
  loadSerializedLayout(jsonString: string): Map<string, LayoutNode> {
    try {
      const layoutMap = LayoutSerializer.deserialize(jsonString);
      this.lastLayoutMap = layoutMap;
      
      this.emit('layoutLoaded', {
        nodeCount: layoutMap.size,
        source: 'serialized'
      });

      return layoutMap;
    } catch (error) {
      throw new Error(`Layout deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if engine is currently processing
   */
  isCalculating(): boolean {
    return this.isProcessing;
  }

  /**
   * Get default performance metrics
   */
  private getDefaultMetrics(): PerformanceMetrics {
    return {
      processingTime: 0,
      memoryUsage: 0,
      iterations: 0,
      stabilityScore: 0,
      currentFPS: 0
    };
  }

  /**
   * Create a default configuration for quick setup
   */
  static createDefaultConfiguration(): LayoutConfiguration {
    return {
      forceParameters: {
        centerForce: 0.1,
        chargeForce: 0.3,
        linkForce: 0.1,
        collisionRadius: 20,
        customForces: new Map()
      },
      clusteringConfig: {
        enabled: false,
        similarityThreshold: 0.5,
        maxClusterSize: 50,
        clusterSeparation: 100,

  // ===== SIMILARITY EXTENSION METHODS (T036: Runtime Registration System) =====

  /**
   * Register a custom similarity measure for runtime extensibility
   * @param measure Similarity measure to register
   */
  registerSimilarityMeasure(measure: ISimilarityMeasure): void {
    this.similarityRegistry.register(measure);
    this.emit('similarityMeasureRegistered', { id: measure.id, name: measure.name });
  }

  /**
   * Unregister a similarity measure
   * @param measureId ID of measure to unregister
   */
  unregisterSimilarityMeasure(measureId: string): void {
    this.similarityRegistry.unregister(measureId);
    this.emit('similarityMeasureUnregistered', { id: measureId });
  }

  /**
   * Get all registered similarity measure IDs
   * @returns Array of measure IDs
   */
  getRegisteredSimilarityMeasures(): string[] {
    return this.similarityRegistry.list();
  }

  /**
   * Get similarity registry for advanced operations
   * @returns The similarity registry instance
   */
  getSimilarityRegistry(): ISimilarityMeasureRegistry {
    return this.similarityRegistry;
  }

  /**
   * Calculate similarity between two nodes using specified measure
   * @param measureId ID of similarity measure to use
   * @param nodeA First node
   * @param nodeB Second node
   * @param context Clustering context
   * @returns Similarity score (0-1)
   */
  calculateNodeSimilarity(
    measureId: string,
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext
  ): number {
    return this.similarityRegistry.calculateSimilarity(measureId, nodeA, nodeB, context);
  }

  /**
   * Calculate similarity using multiple measures with conflict resolution
   * @param measureIds Array of measure IDs to use
   * @param nodeA First node
   * @param nodeB Second node
   * @param context Clustering context
   * @returns Combined similarity score

  /**
   * Enhanced similarity calculation with conflict resolution
   * @param measureIds Array of measure IDs to use
   * @param nodeA First node
   * @param nodeB Second node  
   * @param context Clustering context
   * @returns Resolved similarity score with conflict resolution
   */
  calculateEnhancedSimilarity(
    measureIds: string[],
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext
  ): number {
    if (measureIds.length === 0) {
      throw new Error('At least one similarity measure must be specified');
    }

    if (measureIds.length === 1) {
      return this.calculateNodeSimilarity(measureIds[0], nodeA, nodeB, context);
    }

    // Calculate scores with multiple measures
    const scores: number[] = [];
    const weights: number[] = [];

    for (const measureId of measureIds) {
      try {
        const score = this.calculateNodeSimilarity(measureId, nodeA, nodeB, context);
        const weight = context.config.measureWeights.get(measureId) || 1.0;
        
        scores.push(score);
        weights.push(weight);
      } catch (error) {
        console.warn(`Failed to calculate similarity with measure ${measureId}:`, error);
        // Continue with other measures
      }
    }

    if (scores.length === 0) {
      throw new Error('All similarity calculations failed');
    }

    // Use conflict resolver for enhanced resolution
    return this.conflictResolver.resolveConflicts(
      scores,
      weights,
      context.config.conflictResolution
    );
  }

  /**
   * Get conflict analysis for similarity calculations
   * @param measureIds Array of measure IDs
   * @param nodeA First node
   * @param nodeB Second node
   * @param context Clustering context
   * @returns Conflict statistics and resolution report
   */
  analyzeSimilarityConflicts(
    measureIds: string[],
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext
  ) {
    const scores: number[] = [];
    const weights: number[] = [];

    for (const measureId of measureIds) {
      try {
        const score = this.calculateNodeSimilarity(measureId, nodeA, nodeB, context);
        const weight = context.config.measureWeights.get(measureId) || 1.0;
        
        scores.push(score);
        weights.push(weight);
      } catch (error) {
        console.warn(`Failed to calculate similarity with measure ${measureId}:`, error);
      }
    }

    const resolvedScore = this.conflictResolver.resolveConflicts(
      scores, 
      weights, 
      context.config.conflictResolution
    );

    return this.conflictResolver.createResolutionReport(
      scores,
      resolvedScore,
      context.config.conflictResolution,
      weights
    );
  }

  /**
   * Get enhanced similarity capabilities including conflict resolution
   * @returns Enhanced capabilities with similarity extensions
   */
  getEnhancedCapabilities(): LayoutEngineCapabilities & {
    similarityExtensions: {
      supportedConflictResolutions: ConflictResolutionStrategy[];
      maxCustomMeasures: number;
      registeredMeasures: string[];
      supportsRuntimeRegistration: boolean;
    }
  } {
    const baseCapabilities = this.getCapabilities();
    
    return {
      ...baseCapabilities,
      similarityExtensions: {
        supportedConflictResolutions: ['average', 'weighted-average', 'max', 'min'],
        maxCustomMeasures: 50, // Reasonable limit for performance
        registeredMeasures: this.getRegisteredSimilarityMeasures(),
        supportsRuntimeRegistration: true
      }
    };
  }
   */
  calculateMultiSimilarity(
    measureIds: string[],
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext
  ): number {
    return this.similarityRegistry.calculateMultiSimilarity(measureIds, nodeA, nodeB, context);
  }

  /**
   * Validate a custom similarity function before registration
   * @param fn Function to validate
   * @returns Validation result with errors and warnings
   */
  validateSimilarityFunction(fn: SimilarityFunction): ValidationResult {
    return this.similarityRegistry.validateFunction(fn);
  }
        algorithm: 'similarity-based'
      },
      similarityMeasures: [],
      performanceSettings: {
        maxMemoryMB: 512,
        warningThreshold: 1000,
        enableDegradation: true,
        targetFPS: 60
      },
      stabilityThreshold: 0.01,
      maxIterations: 300
    };
  }
}