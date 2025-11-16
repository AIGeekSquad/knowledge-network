/**
 * Layout Engine Implementation
 *
 * Main implementation of the ILayoutEngine interface that coordinates
 * layout calculation and serialization. Independent of rendering concerns.
 *
 * @fileoverview Main layout engine implementation
 */

import { EventEmitter } from '../utils/ReactiveEmitter.js';
import type { Node } from '../types';
import { LayoutCalculator } from './LayoutCalculator';
import { LayoutSerializer } from './LayoutSerializer';
import type {
  ILayoutEngine,
  LayoutNode,
  LayoutConfiguration,
  LayoutEngineCapabilities,
  ValidationResult,
  PerformanceMetrics,
  ProgressCallback
} from './layout-engine';

/**
 * Main Layout Engine implementation
 * Coordinates layout calculation, validation, and capabilities reporting
 */
export class LayoutEngine extends EventEmitter implements ILayoutEngine {
  private calculator: LayoutCalculator;
  private isProcessing = false;
  private lastLayoutMap: Map<string, LayoutNode> | null = null;
  private lastPerformanceMetrics: PerformanceMetrics | null = null;

  constructor() {
    super();
    this.calculator = new LayoutCalculator();
  }

  /**
   * Calculate layout for given nodes with configuration
   */
  async calculateAsync(
    nodes: Node[],
    config: LayoutConfiguration,
    progressCallback?: ProgressCallback
  ): Promise<Map<string, LayoutNode>> {
    if (this.isProcessing) {
      throw new Error('Layout calculation already in progress');
    }

    try {
      this.isProcessing = true;
      this.emit('layoutStarted', { nodeCount: nodes.length });

      // Use calculator for actual computation
      const layoutMap = await this.calculator.calculateAsync(
        nodes,
        config,
        (progress) => {
          this.emit('progress', progress);
          if (progressCallback) {
            progressCallback(progress);
          }
        }
      );

      this.lastLayoutMap = layoutMap;
      this.lastPerformanceMetrics = this.calculator.getPerformanceMetrics();
      
      this.emit('layoutComplete', { 
        nodeCount: layoutMap.size,
        metrics: this.lastPerformanceMetrics
      });

      return layoutMap;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration(config: LayoutConfiguration): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.forceParameters) {
      errors.push('Force parameters are required');
    }

    if (!config.stabilityThreshold || config.stabilityThreshold < 0 || config.stabilityThreshold > 1) {
      errors.push('Stability threshold must be between 0 and 1');
    }

    if (!config.maxIterations || config.maxIterations <= 0) {
      errors.push('Max iterations must be positive');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.map(msg => ({ field: 'configuration', message: msg, code: 'VALIDATION_ERROR' })),
      warnings: warnings.map(msg => ({ field: 'configuration', message: msg, severity: 'medium' as const }))
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.calculator.cleanup();
    this.isProcessing = false;
    this.lastLayoutMap = null;
    this.lastPerformanceMetrics = null;
    this.removeAllListeners();
  }

  /**
   * Get capabilities of this layout engine
   */
  getCapabilities(): LayoutEngineCapabilities {
    return {
      maxNodes: 5000,
      supportedForces: ['force-directed', 'center', 'charge', 'collision'],
      clusteringAlgorithms: ['similarity-based', 'modularity'],
      supportsRealTimeUpdates: true,
      performanceProfile: {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(n)',
        recommendedFor: ['small to medium datasets', 'force-directed layouts']
      }
    };
  }

  /**
   * Get performance metrics from last calculation
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.lastPerformanceMetrics || this.getDefaultMetrics();
  }

  /**
   * Serialize current layout to string
   */
  serializeLayout(): string | null {
    if (!this.lastLayoutMap) {
      return null;
    }
    return LayoutSerializer.serialize(this.lastLayoutMap);
  }

  /**
   * Load layout from serialized string
   */
  loadSerializedLayout(jsonString: string): Map<string, LayoutNode> {
    const layoutMap = LayoutSerializer.deserialize(jsonString);
    this.lastLayoutMap = layoutMap;
    return layoutMap;
  }

  /**
   * Check if currently processing
   */
  get isLayoutProcessing(): boolean {
    return this.isProcessing;
  }

  /**
   * Get default metrics
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
}

/**
 * Factory function for creating layout engine
 */
export function createLayoutEngine(): LayoutEngine {
  return new LayoutEngine();
}

/**
 * Factory function for creating optimized layout engine
 */
export function createOptimizedLayoutEngine(): LayoutEngine {
  const engine = new LayoutEngine();
  // Add any optimization configurations here
  return engine;
}