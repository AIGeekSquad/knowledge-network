/**
 * @fileoverview ProgressiveLoadingManager Implementation
 * 
 * Manages progressive loading capabilities with existing LayoutEngine integration.
 * Ensures node positions are available before edge calculations complete, enabling
 * immediate rendering and user interaction with partial data.
 * 
 * Key Features:
 * - Progressive data availability (nodes first, then edges)
 * - LayoutEngine integration with existing EventEmitter pattern
 * - Batched updates for performance optimization
 * - Memory-aware loading with degradation strategies
 * - Real-time progress tracking and completion estimation
 */

import { EventEmitter } from 'events';
import type { 
  Node,
  Edge,
  LayoutNode,
  PerformanceMetrics
} from '../../types';
import type { LayoutEngine } from '../../layout/LayoutEngine';

export interface LoadingStage {
  name: string;
  progress: number;
  isComplete: boolean;
  startTime: number;
  endTime?: number;
  dependencies: string[];
  output?: any;
  memoryUsage?: number;
  isPaused?: boolean;
  cancelled?: boolean;
  warnings?: LoadingWarning[];
}

export interface LoadingWarning {
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
}

export interface ProgressiveLoadingConfig {
  batchSize: number;
  stageWeights: Record<string, number>;
  enableProgressiveRendering: boolean;
  maxMemoryUsage: number; // MB
  enableIncrementalUpdates: boolean;
}

/**
 * Manages progressive loading with LayoutEngine integration
 */
export class ProgressiveLoadingManager extends EventEmitter {
  private loadingStages: Map<string, LoadingStage> = new Map();
  private stageCallbacks: Map<string, Set<(data: any) => void>> = new Map();
  private progressCallbacks: Set<(progress: Map<string, LoadingStage>) => void> = new Set();
  private layoutEngine: LayoutEngine | null = null;
  private config: ProgressiveLoadingConfig;
  private isLoading = false;
  private isPaused = false;
  private isCancelled = false;

  constructor(config?: Partial<ProgressiveLoadingConfig>) {
    super();
    
    this.config = {
      batchSize: 50,
      stageWeights: {
        'NodePositioning': 0.4,
        'Clustering': 0.2, 
        'EdgeCalculation': 0.3,
        'Rendering': 0.1
      },
      enableProgressiveRendering: true,
      maxMemoryUsage: 512,
      enableIncrementalUpdates: true,
      ...config
    };

    // Initialize default loading stages
    this.initializeLoadingStages();
  }

  /**
   * Start progressive loading process
   * @param nodes Input nodes
   * @param edges Input edges
   * @param config Loading configuration
   */
  async startProgressiveLoading(nodes: Node[], edges: Edge[], config?: any): Promise<void> {
    if (this.isLoading) {
      throw new Error('Progressive loading already in progress');
    }

    try {
      this.isLoading = true;
      this.isCancelled = false;
      this.isPaused = false;

      // Update configuration if provided
      if (config) {
        this.config = { ...this.config, ...config };
      }

      // Reset stage states
      this.resetStages();

      // Start with node positioning (integrates with existing LayoutEngine)
      await this.startNodePositioning(nodes, config);
      
      // Start other stages that depend on node positions
      this.startDependentStages(edges, config);

      this.emit('progressiveLoadingStarted', {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        config: this.config
      });

    } catch (error) {
      this.isLoading = false;
      throw new Error(`Failed to start progressive loading: ${error}`);
    }
  }

  /**
   * Get current loading progress for all stages
   */
  getLoadingProgress(): Map<string, LoadingStage> {
    return new Map(this.loadingStages);
  }

  /**
   * Check if data for specific stage is available
   */
  isStageDataAvailable(stageName: string): boolean {
    const stage = this.loadingStages.get(stageName);
    return stage ? stage.isComplete && stage.output !== undefined : false;
  }

  /**
   * Get data from completed stage
   */
  getStageData(stageName: string): any {
    if (!this.isStageDataAvailable(stageName)) {
      return null;
    }
    
    return this.loadingStages.get(stageName)?.output;
  }

  /**
   * Integrate with existing LayoutEngine
   */
  integrateWithLayoutEngine(layoutEngine: LayoutEngine): void {
    this.layoutEngine = layoutEngine;

    // Forward LayoutEngine events using existing EventEmitter pattern
    layoutEngine.on('progress', (progressData: any) => {
      this.updateStageProgress('NodePositioning', progressData.percentage || 0);
      
      this.emit('layoutProgress', {
        stage: 'NodePositioning',
        progress: progressData,
        timestamp: Date.now()
      });
    });

    layoutEngine.on('layoutComplete', (completionData: any) => {
      this.completeStage('NodePositioning', completionData);
      
      this.emit('nodePositionsAvailable', {
        nodeCount: completionData.nodeCount,
        processingTime: completionData.processingTime,
        data: this.layoutEngine?.getLastLayout()
      });
    });

    layoutEngine.on('layoutError', (error: any) => {
      this.addStageError('NodePositioning', `Layout calculation failed: ${error}`, true);
    });
  }

  /**
   * Get LayoutEngine progress if integrated
   */
  getLayoutEngineProgress(): PerformanceMetrics | null {
    return this.layoutEngine?.getLastPerformanceMetrics() || null;
  }

  /**
   * Register callback for when stage data becomes available
   */
  onStageDataAvailable(stageName: string, callback: (data: any) => void): void {
    if (!this.stageCallbacks.has(stageName)) {
      this.stageCallbacks.set(stageName, new Set());
    }
    this.stageCallbacks.get(stageName)!.add(callback);
  }

  /**
   * Register callback for progress updates
   */
  onProgressUpdate(callback: (progress: Map<string, LoadingStage>) => void): void {
    this.progressCallbacks.add(callback);
  }

  /**
   * Enable or disable incremental updates
   */
  enableIncrementalUpdates(enabled: boolean): void {
    this.config.enableIncrementalUpdates = enabled;
    
    this.emit('incrementalUpdatesChanged', {
      enabled,
      batchSize: this.config.batchSize
    });
  }

  /**
   * Set rendering batch size for progressive updates
   */
  setRenderingBatchSize(batchSize: number): void {
    this.config.batchSize = Math.max(1, batchSize);
    
    this.emit('batchSizeChanged', {
      batchSize: this.config.batchSize
    });
  }

  /**
   * Estimate completion time based on current progress
   */
  getEstimatedCompletionTime(): number {
    const totalWeight = Object.values(this.config.stageWeights).reduce((sum, weight) => sum + weight, 0);
    let completedWeight = 0;
    let averageTimePerWeight = 0;
    let totalTime = 0;

    // Calculate completion based on stage progress and weights
    this.loadingStages.forEach((stage, stageName) => {
      const stageWeight = this.config.stageWeights[stageName] || 0;
      const stageProgress = stage.progress / 100;
      
      completedWeight += stageWeight * stageProgress;
      
      if (stage.endTime && stage.startTime > 0) {
        const stageDuration = stage.endTime - stage.startTime;
        totalTime += stageDuration;
      }
    });

    if (completedWeight === 0) {
      return 5000; // Default estimate if no progress yet
    }

    averageTimePerWeight = totalTime / completedWeight;
    const remainingWeight = totalWeight - completedWeight;
    
    return Math.round(remainingWeight * averageTimePerWeight);
  }

  /**
   * Pause progressive loading
   */
  pauseLoading(): void {
    this.isPaused = true;
    
    this.loadingStages.forEach(stage => {
      if (!stage.isComplete) {
        stage.isPaused = true;
      }
    });

    this.emit('loadingPaused', { timestamp: Date.now() });
  }

  /**
   * Resume progressive loading
   */
  resumeLoading(): void {
    this.isPaused = false;
    
    this.loadingStages.forEach(stage => {
      stage.isPaused = false;
    });

    this.emit('loadingResumed', { timestamp: Date.now() });
  }

  /**
   * Cancel progressive loading
   */
  cancelLoading(): void {
    this.isCancelled = true;
    this.isLoading = false;
    
    this.loadingStages.forEach(stage => {
      if (!stage.isComplete) {
        stage.cancelled = true;
      }
    });

    this.emit('loadingCancelled', { timestamp: Date.now() });
  }

  // ===== PRIVATE METHODS =====

  /**
   * Initialize default loading stages
   */
  private initializeLoadingStages(): void {
    const defaultStages: Array<{ name: string; dependencies: string[] }> = [
      { name: 'NodePositioning', dependencies: [] },
      { name: 'Clustering', dependencies: ['NodePositioning'] },
      { name: 'EdgeCalculation', dependencies: ['Clustering'] },
      { name: 'Rendering', dependencies: ['EdgeCalculation'] }
    ];

    defaultStages.forEach(({ name, dependencies }) => {
      this.loadingStages.set(name, {
        name,
        progress: 0,
        isComplete: false,
        startTime: 0,
        dependencies
      });
    });
  }

  /**
   * Reset all stage states
   */
  private resetStages(): void {
    this.loadingStages.forEach(stage => {
      stage.progress = 0;
      stage.isComplete = false;
      stage.startTime = 0;
      stage.endTime = undefined;
      stage.output = undefined;
      stage.memoryUsage = undefined;
      stage.isPaused = false;
      stage.cancelled = false;
      stage.warnings = [];
    });
  }

  /**
   * Start node positioning stage with LayoutEngine
   */
  private async startNodePositioning(nodes: Node[], config: any): Promise<void> {
    if (!this.layoutEngine) {
      throw new Error('LayoutEngine not integrated. Call integrateWithLayoutEngine() first.');
    }

    const stage = this.loadingStages.get('NodePositioning')!;
    stage.startTime = Date.now();
    stage.memoryUsage = this.estimateMemoryUsage();

    try {
      // Use existing LayoutEngine async methods
      const layoutConfig = this.createLayoutConfiguration(config);
      const layoutResult = await this.layoutEngine.calculateAsync(nodes, layoutConfig, (progress) => {
        // Forward progress updates
        this.updateStageProgress('NodePositioning', progress.percentage);
      });

      // Make node positions immediately available
      stage.output = layoutResult;
      stage.isComplete = true;
      stage.endTime = Date.now();
      stage.memoryUsage = this.estimateMemoryUsage();

      // Notify callbacks that node positions are available
      this.notifyStageDataAvailable('NodePositioning', layoutResult);

    } catch (error) {
      this.addStageError('NodePositioning', `Node positioning failed: ${error}`, true);
      throw error;
    }
  }

  /**
   * Start stages that depend on node positioning
   */
  private startDependentStages(edges: Edge[], config: any): void {
    // These stages can start as soon as node positions are available
    // Implementation would start clustering and edge calculation processes
    
    this.emit('dependentStagesStarted', {
      stages: ['Clustering', 'EdgeCalculation'],
      edgeCount: edges.length,
      timestamp: Date.now()
    });
  }

  /**
   * Update progress for specific stage
   */
  private updateStageProgress(stageName: string, progress: number): void {
    const stage = this.loadingStages.get(stageName);
    if (stage) {
      stage.progress = Math.max(0, Math.min(100, progress));
      
      // Notify progress callbacks
      this.notifyProgressUpdate();
      
      this.emit('stageProgressUpdated', {
        stageName,
        progress,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Complete a stage with output data
   */
  private completeStage(stageName: string, output: any): void {
    const stage = this.loadingStages.get(stageName);
    if (stage) {
      stage.progress = 100;
      stage.isComplete = true;
      stage.endTime = Date.now();
      stage.output = output;
      stage.memoryUsage = this.estimateMemoryUsage();

      this.emit('stageCompleted', {
        stageName,
        output,
        duration: stage.endTime - stage.startTime,
        memoryUsage: stage.memoryUsage
      });

      // Notify data availability callbacks
      this.notifyStageDataAvailable(stageName, output);
    }
  }

  /**
   * Add error to stage
   */
  private addStageError(stageName: string, message: string, critical: boolean): void {
    const stage = this.loadingStages.get(stageName);
    if (stage) {
      if (!stage.warnings) stage.warnings = [];
      
      stage.warnings.push({
        message,
        severity: critical ? 'high' : 'medium',
        timestamp: Date.now()
      });

      this.emit('stageError', {
        stageName,
        message,
        critical,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Notify stage data availability callbacks
   */
  private notifyStageDataAvailable(stageName: string, data: any): void {
    const callbacks = this.stageCallbacks.get(stageName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in stage data callback for ${stageName}:`, error);
        }
      });
    }
  }

  /**
   * Notify all progress update callbacks
   */
  private notifyProgressUpdate(): void {
    const currentProgress = this.getLoadingProgress();
    this.progressCallbacks.forEach(callback => {
      try {
        callback(currentProgress);
      } catch (error) {
        console.error('Error in progress update callback:', error);
      }
    });
  }

  /**
   * Create LayoutEngine configuration from loading config
   */
  private createLayoutConfiguration(config: any): any {
    return {
      forceParameters: {
        centerForce: 0.1,
        chargeForce: 0.3,
        linkForce: 0.1,
        collisionRadius: 20,
        customForces: new Map()
      },
      clusteringConfig: {
        enabled: config?.clustering?.enabled || false,
        similarityThreshold: config?.clustering?.threshold || 0.5,
        maxClusterSize: 50,
        clusterSeparation: 100,
        algorithm: 'similarity-based'
      },
      similarityMeasures: config?.similarityMeasures || [],
      performanceSettings: {
        maxMemoryMB: this.config.maxMemoryUsage,
        warningThreshold: 1000,
        enableDegradation: true,
        targetFPS: 60
      },
      stabilityThreshold: 0.01,
      maxIterations: config?.iterations || 300
    };
  }

  /**
   * Estimate current memory usage (simplified)
   */
  private estimateMemoryUsage(): number {
    let totalMemory = 0;
    
    this.loadingStages.forEach(stage => {
      if (stage.output) {
        if (stage.output instanceof Map) {
          totalMemory += stage.output.size * 0.1; // ~0.1MB per layout node
        } else if (Array.isArray(stage.output)) {
          totalMemory += stage.output.length * 0.05; // ~0.05MB per edge
        }
      }
    });

    return totalMemory;
  }

  /**
   * Process data in batches for incremental updates
   */
  private async processBatch<T>(
    data: T[],
    batchProcessor: (batch: T[]) => Promise<any>,
    stageName: string
  ): Promise<any[]> {
    const results = [];
    const batchSize = this.config.batchSize;
    
    for (let i = 0; i < data.length; i += batchSize) {
      if (this.isCancelled) {
        throw new Error(`Batch processing cancelled for stage ${stageName}`);
      }

      if (this.isPaused) {
        await this.waitForResume();
      }

      const batch = data.slice(i, i + batchSize);
      const batchResult = await batchProcessor(batch);
      results.push(batchResult);

      // Update progress based on batch completion
      const progress = Math.min(100, ((i + batchSize) / data.length) * 100);
      this.updateStageProgress(stageName, progress);

      // Memory check
      const currentMemory = this.estimateMemoryUsage();
      if (currentMemory > this.config.maxMemoryUsage * 0.9) {
        const stage = this.loadingStages.get(stageName);
        if (stage && !stage.warnings) stage.warnings = [];
        
        stage?.warnings?.push({
          message: `Memory usage (${currentMemory.toFixed(1)}MB) approaching limit (${this.config.maxMemoryUsage}MB)`,
          severity: 'high',
          timestamp: Date.now()
        });
      }

      // Brief pause between batches for UI responsiveness
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    return results;
  }

  /**
   * Wait for resume when paused
   */
  private async waitForResume(): Promise<void> {
    return new Promise(resolve => {
      const checkResume = () => {
        if (!this.isPaused) {
          resolve();
        } else {
          setTimeout(checkResume, 50);
        }
      };
      checkResume();
    });
  }

  /**
   * Create batched node position updates
   */
  async createProgressiveNodeUpdates(
    nodePositions: Map<string, LayoutNode>
  ): Promise<void> {
    const nodes = Array.from(nodePositions.values());
    
    await this.processBatch(
      nodes,
      async (batch: LayoutNode[]) => {
        // Create progressive update for this batch
        const batchMap = new Map(batch.map(node => [node.id, node]));
        
        // Emit progressive update
        this.emit('progressiveNodesAvailable', {
          batch: batchMap,
          batchSize: batch.length,
          totalProcessed: batch.length,
          timestamp: Date.now()
        });

        return batchMap;
      },
      'NodePositioning'
    );
  }

  /**
   * Get progressive loading statistics
   */
  getProgressiveLoadingStats(): {
    stagesComplete: number;
    totalStages: number;
    overallProgress: number;
    memoryUsage: number;
    estimatedTimeRemaining: number;
  } {
    const totalStages = this.loadingStages.size;
    const completedStages = Array.from(this.loadingStages.values())
      .filter(stage => stage.isComplete).length;
    
    const weightedProgress = Array.from(this.loadingStages.entries())
      .reduce((total, [stageName, stage]) => {
        const weight = this.config.stageWeights[stageName] || 0;
        return total + (weight * (stage.progress / 100));
      }, 0);

    return {
      stagesComplete: completedStages,
      totalStages,
      overallProgress: Math.round(weightedProgress * 100),
      memoryUsage: this.estimateMemoryUsage(),
      estimatedTimeRemaining: this.getEstimatedCompletionTime()
    };
  }
}

/**
 * Factory function to create ProgressiveLoadingManager
 */
export function createProgressiveLoadingManager(
  config?: Partial<ProgressiveLoadingConfig>
): ProgressiveLoadingManager {
  return new ProgressiveLoadingManager(config);
}

/**
 * Default progressive loading configurations
 */
export const DefaultProgressiveConfigs = {
  PERFORMANCE: {
    batchSize: 100,
    enableIncrementalUpdates: false, // Disabled for better performance
    enableProgressiveRendering: true,
    maxMemoryUsage: 1024
  },
  
  RESPONSIVE: {
    batchSize: 25,
    enableIncrementalUpdates: true,
    enableProgressiveRendering: true,
    maxMemoryUsage: 512
  },
  
  MEMORY_CONSTRAINED: {
    batchSize: 10,
    enableIncrementalUpdates: true,
    enableProgressiveRendering: true,
    maxMemoryUsage: 256
  }
} as const;

/**
 * Progressive loading utility functions
 */
export const ProgressiveLoadingUtils = {
  
  /**
   * Calculate optimal batch size based on dataset size and memory
   */
  calculateOptimalBatchSize(nodeCount: number, availableMemory: number): number {
    // Estimate memory per node (rough approximation)
    const memoryPerNode = 0.1; // MB
    const maxNodesPerBatch = Math.floor(availableMemory * 0.2 / memoryPerNode);
    
    // Balance between performance and memory
    if (nodeCount < 100) return Math.min(nodeCount, 25);
    if (nodeCount < 500) return Math.min(maxNodesPerBatch, 50);
    return Math.min(maxNodesPerBatch, 100);
  },

  /**
   * Estimate progressive loading time
   */
  estimateProgressiveLoadingTime(
    nodeCount: number, 
    edgeCount: number,
    config: ProgressiveLoadingConfig
  ): number {
    // Base time estimates (ms)
    const baseNodeTime = nodeCount * 2; // ~2ms per node
    const baseEdgeTime = edgeCount * 1; // ~1ms per edge
    const renderingTime = (nodeCount + edgeCount) * 0.5; // ~0.5ms per element
    
    // Adjust for batching
    const batchOverhead = Math.ceil(nodeCount / config.batchSize) * 10; // 10ms per batch
    
    return baseNodeTime + baseEdgeTime + renderingTime + batchOverhead;
  }

} as const;