/**
 * @fileoverview SimilarityFunctionRegistry Implementation
 * 
 * Provides runtime registration and management of similarity functions for node clustering.
 * Maintains namespace separation from compatibility functions and ensures function validation
 * per US3 requirements.
 * 
 * Key Features:
 * - Pure function validation with (nodeA, nodeB, context) => number signature
 * - Namespace separation for similarity vs compatibility functions
 * - Runtime registration with <50 lines of code requirement support
 * - Mathematical averaging for conflicting similarity scores
 * - Integration with clustering algorithms and layout engines
 */

import type {
  ISimilarityMeasure,
  ISimilarityMeasureRegistry,
  SimilarityFunction,
  ClusteringContext,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  SimilarityConfigSchema,
  ParameterDefinition,
  Node
} from '../../types';

/**
 * Default built-in similarity measures
 */
export const BuiltInSimilarityMeasures = {
  EUCLIDEAN: 'euclidean-distance',
  JACCARD: 'jaccard-similarity',
  COSINE: 'cosine-similarity',
  STRUCTURAL: 'structural-similarity'
} as const;

/**
 * Registry for runtime similarity function management
 */
export class SimilarityFunctionRegistry implements ISimilarityMeasureRegistry {
  private readonly measures = new Map<string, ISimilarityMeasure>();
  private readonly categories = new Map<string, Set<string>>();
  
  constructor() {
    // Register built-in similarity measures on initialization
    this.registerBuiltInMeasures();
  }

  /**
   * Register a new similarity measure
   * @param measure Similarity measure to register
   * @throws Error if measure ID conflicts or validation fails
   */
  register(measure: ISimilarityMeasure): void {
    // Validate measure completeness
    this.validateMeasure(measure);
    
    // Check for ID conflicts within similarity namespace
    if (this.measures.has(measure.id)) {
      throw new Error(`Similarity measure with ID "${measure.id}" already registered`);
    }

    // Validate function signature and behavior
    const validationResult = this.validateFunction(measure.calculateSimilarity);
    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors.map(e => e.message).join(', ');
      throw new Error(`Invalid similarity function: ${errorMessages}`);
    }

    // Register the measure
    this.measures.set(measure.id, measure);
    
    // Add to category index if measure has category metadata
    const category = (measure as any).category || 'general';
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(measure.id);
  }

  /**
   * Unregister a similarity measure
   * @param id Measure ID to unregister
   */
  unregister(id: string): void {
    const measure = this.measures.get(id);
    if (measure) {
      this.measures.delete(id);
      
      // Remove from category index
      for (const [category, measureIds] of this.categories.entries()) {
        if (measureIds.has(id)) {
          measureIds.delete(id);
          if (measureIds.size === 0) {
            this.categories.delete(category);
          }
          break;
        }
      }
    }
  }

  /**
   * Get a registered similarity measure by ID
   * @param id Measure ID
   * @returns Similarity measure or undefined if not found
   */
  get(id: string): ISimilarityMeasure | undefined {
    return this.measures.get(id);
  }

  /**
   * List all registered similarity measure IDs
   * @returns Array of measure IDs
   */
  list(): string[] {
    return Array.from(this.measures.keys());
  }

  /**
   * Validate a similarity function before registration
   * @param fn Function to validate
   * @returns Validation result
   */
  validateFunction(fn: SimilarityFunction): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Check function signature by examining parameter count
      const funcString = fn.toString();
      const paramMatch = funcString.match(/\(([^)]*)\)/);
      const params = paramMatch?.[1]?.split(',').map(p => p.trim()).filter(p => p) || [];
      
      if (params.length !== 3) {
        errors.push({
          field: 'signature',
          message: 'Function must accept exactly 3 parameters: (nodeA, nodeB, context)',
          code: 'INVALID_PARAM_COUNT'
        });
      }

      // Test function execution with mock data
      const mockNodeA: Node = { id: 'test-a', x: 0, y: 0 };
      const mockNodeB: Node = { id: 'test-b', x: 1, y: 1 };
      const mockContext: ClusteringContext = this.createMockContext();

      try {
        const result = fn(mockNodeA, mockNodeB, mockContext);
        
        // Validate return type
        if (typeof result !== 'number') {
          errors.push({
            field: 'returnType',
            message: 'Function must return a number',
            code: 'INVALID_RETURN_TYPE'
          });
        } else {
          // Validate return value range
          if (result < 0 || result > 1) {
            warnings.push({
              field: 'returnValue',
              message: 'Similarity values should be between 0 and 1',
              severity: 'medium'
            });
          }
          
          if (!Number.isFinite(result)) {
            errors.push({
              field: 'returnValue',
              message: 'Function must return a finite number',
              code: 'INVALID_RETURN_VALUE'
            });
          }
        }
      } catch (executionError) {
        errors.push({
          field: 'execution',
          message: `Function throws exceptions during validation: ${executionError}`,
          code: 'RUNTIME_ERROR'
        });
      }

      // Performance warning for complex functions
      const startTime = performance.now();
      try {
        for (let i = 0; i < 100; i++) {
          fn(mockNodeA, mockNodeB, mockContext);
        }
        const endTime = performance.now();
        const avgTime = (endTime - startTime) / 100;
        
        if (avgTime > 1) { // More than 1ms average
          warnings.push({
            field: 'performance',
            message: 'Function may have performance issues (>1ms per call)',
            severity: 'medium'
          });
        }
      } catch {
        // Performance test failed, already captured in execution test
      }

    } catch (analysisError) {
      errors.push({
        field: 'analysis',
        message: `Failed to analyze function: ${analysisError}`,
        code: 'ANALYSIS_ERROR'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get measures by category or tag
   * @param category Category to filter by
   * @returns Array of matching measures
   */
  getByCategory(category: string): ISimilarityMeasure[] {
    const measureIds = this.categories.get(category);
    if (!measureIds) {
      return [];
    }

    return Array.from(measureIds)
      .map(id => this.measures.get(id))
      .filter((measure): measure is ISimilarityMeasure => measure !== undefined);
  }

  /**
   * Get all available categories
   * @returns Array of category names
   */
  getCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Calculate similarity using a specific measure
   * @param measureId ID of the similarity measure to use
   * @param nodeA First node
   * @param nodeB Second node
   * @param context Clustering context
   * @returns Similarity score or throws error if measure not found
   */
  calculateSimilarity(
    measureId: string,
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext
  ): number {
    const measure = this.measures.get(measureId);
    if (!measure) {
      throw new Error(`Similarity measure with ID "${measureId}" not found`);
    }

    return measure.calculateSimilarity(nodeA, nodeB, context);
  }

  /**
   * Calculate similarity using multiple measures and resolve conflicts
   * @param measureIds Array of measure IDs to use
   * @param nodeA First node
   * @param nodeB Second node
   * @param context Clustering context
   * @returns Combined similarity score using configured resolution strategy
   */
  calculateMultiSimilarity(
    measureIds: string[],
    nodeA: Node,
    nodeB: Node,
    context: ClusteringContext
  ): number {
    if (measureIds.length === 0) {
      throw new Error('At least one similarity measure must be specified');
    }

    const scores: number[] = [];
    const weights: number[] = [];

    for (const measureId of measureIds) {
      try {
        const score = this.calculateSimilarity(measureId, nodeA, nodeB, context);
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

    // Resolve conflicts based on configured strategy
    return this.resolveConflicts(scores, weights, context.config.conflictResolution);
  }

  /**
   * Validate measure completeness
   */
  private validateMeasure(measure: ISimilarityMeasure): void {
    if (!measure.id || typeof measure.id !== 'string') {
      throw new Error('Invalid similarity measure: missing required field "id"');
    }

    if (!measure.name || typeof measure.name !== 'string') {
      throw new Error('Invalid similarity measure: missing required field "name"');
    }

    if (!measure.description || typeof measure.description !== 'string') {
      throw new Error('Invalid similarity measure: missing required field "description"');
    }

    if (!measure.calculateSimilarity || typeof measure.calculateSimilarity !== 'function') {
      throw new Error('Invalid similarity measure: missing required field "calculateSimilarity"');
    }

    if (!measure.configSchema || typeof measure.configSchema !== 'object') {
      throw new Error('Invalid similarity measure: missing required field "configSchema"');
    }

    if (!measure.version || typeof measure.version !== 'string') {
      throw new Error('Invalid similarity measure: missing required field "version"');
    }
  }

  /**
   * Create mock clustering context for validation
   */
  private createMockContext(): ClusteringContext {
    return {
      iteration: 1,
      nodes: new Map([
        ['test-a', { id: 'test-a', x: 0, y: 0, clusterId: undefined, similarityScores: new Map(), originalData: {}, layoutMetadata: {} }],
        ['test-b', { id: 'test-b', x: 1, y: 1, clusterId: undefined, similarityScores: new Map(), originalData: {}, layoutMetadata: {} }]
      ]),
      config: {
        similarityThreshold: 0.5,
        maxClusterSize: 10,
        minClusterSimilarity: 0.3,
        separationDistance: 50,
        measureWeights: new Map(),
        conflictResolution: 'average'
      },
      performance: {
        processingTime: 0,
        memoryUsage: 0,
        calculationsPerformed: 0,
        clustersFormed: 0,
        qualityMetrics: {
          avgIntraClusterSimilarity: 0,
          avgInterClusterDissimilarity: 0,
          silhouetteScore: 0,
          modularityScore: 0
        }
      },
      existingSimilarities: new Map(),
      clusterAssignments: new Map()
    };
  }

  /**
   * Resolve conflicts between multiple similarity scores
   */
  private resolveConflicts(
    scores: number[],
    weights: number[],
    strategy: 'average' | 'weighted-average' | 'max' | 'min'
  ): number {
    switch (strategy) {
      case 'average':
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
      case 'weighted-average':
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        if (totalWeight === 0) return 0;
        const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
        return weightedSum / totalWeight;
        
      case 'max':
        return Math.max(...scores);
        
      case 'min':
        return Math.min(...scores);
        
      default:
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
  }

  /**
   * Register built-in similarity measures
   */
  private registerBuiltInMeasures(): void {
    // Euclidean Distance Similarity
    this.register({
      id: BuiltInSimilarityMeasures.EUCLIDEAN,
      name: 'Euclidean Distance',
      description: 'Calculates similarity based on Euclidean distance between node positions',
      calculateSimilarity: (nodeA, nodeB, context) => {
        const dx = (nodeA.x || 0) - (nodeB.x || 0);
        const dy = (nodeA.y || 0) - (nodeB.y || 0);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = Math.sqrt(
          Math.pow(context.config.separationDistance, 2) * 2
        );
        return Math.max(0, 1 - distance / maxDistance);
      },
      configSchema: {
        version: '1.0.0',
        required: [],
        optional: [
          {
            name: 'maxDistance',
            type: 'number',
            description: 'Maximum distance for normalization',
            defaultValue: 100
          }
        ],
        defaults: { maxDistance: 100 },
        validation: []
      },
      version: '1.0.0'
    });

    // Jaccard Similarity
    this.register({
      id: BuiltInSimilarityMeasures.JACCARD,
      name: 'Jaccard Similarity',
      description: 'Calculates similarity based on set overlap of node properties',
      calculateSimilarity: (nodeA, nodeB, context) => {
        const tagsA = new Set((nodeA as any).tags || []);
        const tagsB = new Set((nodeB as any).tags || []);
        const intersection = new Set([...tagsA].filter(x => tagsB.has(x)));
        const union = new Set([...tagsA, ...tagsB]);
        return union.size === 0 ? 0 : intersection.size / union.size;
      },
      configSchema: {
        version: '1.0.0',
        required: [],
        optional: [
          {
            name: 'propertyName',
            type: 'string',
            description: 'Property name to compare as sets',
            defaultValue: 'tags'
          }
        ],
        defaults: { propertyName: 'tags' },
        validation: []
      },
      version: '1.0.0'
    });
  }
}

/**
 * Factory function to create a new SimilarityFunctionRegistry instance
 */
export function createSimilarityFunctionRegistry(): ISimilarityMeasureRegistry {
  return new SimilarityFunctionRegistry();
}

/**
 * Singleton instance for global access (optional)
 */
let globalRegistry: ISimilarityMeasureRegistry | null = null;

/**
 * Get or create the global similarity function registry
 */
export function getGlobalSimilarityRegistry(): ISimilarityMeasureRegistry {
  if (!globalRegistry) {
    globalRegistry = createSimilarityFunctionRegistry();
  }
  return globalRegistry;
}

/**
 * Reset the global registry (mainly for testing)
 */
export function resetGlobalSimilarityRegistry(): void {
  globalRegistry = null;
}