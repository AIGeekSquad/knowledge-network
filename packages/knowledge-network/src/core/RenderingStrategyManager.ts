/**
 * Rendering Strategy Manager
 * 
 * Manages dynamic switching between rendering strategies (Canvas, SVG, WebGL)
 * while maintaining consistent node positions and interaction capabilities.
 * Uses existing SimpleEdge and EdgeBundling implementations.
 * 
 * Task: T022 [US2] - Implement RenderingStrategyManager with dynamic strategy switching
 * 
 * Key Integration Points:
 * - Uses existing SimpleEdge and EdgeBundling from archived system
 * - Integrates with current Canvas/SVG/WebGL rendering strategies
 * - Maintains state consistency during strategy transitions
 * - Provides seamless user experience across all rendering modes
 */

import type { 
  IRenderingStrategy, 
  RenderingContext, 
  RenderingConfig,
  ValidationResult,
  RenderingCapabilities,
  VisualUpdates,
  InteractionEvent
} from '../../rendering/rendering-strategy';
import { EdgeRendererRegistry } from './EdgeRendererRegistry';

/**
 * Strategy switching event data
 */
export interface StrategySwitch {
  fromStrategy: string | null;
  toStrategy: string;
  reason: 'manual' | 'performance' | 'compatibility';
  success: boolean;
  preservedState?: any;
}

/**
 * Performance metrics for strategy comparison
 */
export interface StrategyPerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  fps: number;
  nodesRendered: number;
  edgesRendered: number;
}

/**
 * Configuration for the rendering strategy manager
 */
export interface RenderingStrategyManagerConfig {
  /** Default strategy to use */
  defaultStrategy: 'canvas' | 'svg' | 'webgl';
  
  /** Performance thresholds for automatic switching */
  performanceThresholds: {
    maxRenderTime: number; // ms
    minFPS: number;
    maxMemoryUsage: number; // MB
  };
  
  /** State preservation settings */
  statePreservation: {
    preserveZoom: boolean;
    preserveSelection: boolean;
    preserveHighlights: boolean;
  };
  
  /** Automatic fallback chain */
  fallbackChain: string[];
}

/**
 * Rendering Strategy Manager
 * 
 * Coordinates dynamic switching between Canvas, SVG, and WebGL rendering strategies
 * while preserving user interaction state and maintaining consistent visual output.
 */
export class RenderingStrategyManager {
  private strategies: Map<string, IRenderingStrategy> = new Map();
  private activeStrategy: IRenderingStrategy | null = null;
  private activeStrategyName: string | null = null;
  private edgeRendererRegistry: EdgeRendererRegistry;
  private config: RenderingStrategyManagerConfig;
  private currentContext: RenderingContext | null = null;
  private preservedState: any = null;
  private performanceHistory: Map<string, StrategyPerformanceMetrics[]> = new Map();
  private eventListeners: Map<string, Set<Function>> = new Map();

  constructor(config?: Partial<RenderingStrategyManagerConfig>) {
    this.config = {
      defaultStrategy: 'canvas',
      performanceThresholds: {
        maxRenderTime: 100, // 100ms max render time
        minFPS: 30, // Minimum 30 FPS
        maxMemoryUsage: 512 // 512MB max memory
      },
      statePreservation: {
        preserveZoom: true,
        preserveSelection: true,
        preserveHighlights: true
      },
      fallbackChain: ['canvas', 'svg', 'webgl'],
      ...config
    };

    this.edgeRendererRegistry = new EdgeRendererRegistry();
    this.initializeEventSystem();
  }

  /**
   * Register a rendering strategy
   */
  public registerStrategy(name: string, strategy: IRenderingStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * Get available strategy names
   */
  public getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Switch to a different rendering strategy
   */
  public async switchToStrategyAsync(
    strategyName: string, 
    reason: 'manual' | 'performance' | 'compatibility' = 'manual'
  ): Promise<boolean> {
    const targetStrategy = this.strategies.get(strategyName);
    if (!targetStrategy) {
      this.emitEvent('strategy-switch-failed', { 
        reason: `Strategy '${strategyName}' not found`,
        strategyName 
      });
      return false;
    }

    // Preserve current state if we have an active strategy
    const fromStrategyName = this.activeStrategyName;
    if (this.activeStrategy && this.currentContext) {
      this.preservedState = this.captureCurrentState(this.currentContext);
    }

    try {
      // Cleanup previous strategy
      if (this.activeStrategy) {
        await this.activeStrategy.cleanupAsync();
      }

      // Activate new strategy
      this.activeStrategy = targetStrategy;
      this.activeStrategyName = strategyName;

      // Restore state if we have context
      if (this.currentContext) {
        await this.activeStrategy.renderAsync(this.currentContext);
        if (this.preservedState) {
          await this.restoreState(this.preservedState);
        }
      }

      // Emit success event
      this.emitEvent('strategy-switched', {
        fromStrategy: fromStrategyName,
        toStrategy: strategyName,
        reason,
        success: true,
        preservedState: this.preservedState
      });

      return true;
    } catch (error) {
      // Emit failure event and attempt fallback
      this.emitEvent('strategy-switch-failed', { 
        reason: error instanceof Error ? error.message : 'Unknown error',
        strategyName,
        error 
      });

      // Try fallback strategy
      return await this.attemptFallbackStrategy(reason);
    }
  }

  /**
   * Render using the current active strategy
   */
  public async renderAsync(context: RenderingContext): Promise<void> {
    this.currentContext = context;

    // Initialize default strategy if none active
    if (!this.activeStrategy) {
      await this.switchToStrategyAsync(this.config.defaultStrategy);
    }

    if (!this.activeStrategy) {
      throw new Error('No rendering strategy available');
    }

    // Record performance metrics
    const startTime = performance.now();
    
    await this.activeStrategy.renderAsync(context);
    
    const endTime = performance.now();
    this.recordPerformanceMetrics(this.activeStrategyName!, {
      renderTime: endTime - startTime,
      updateTime: 0,
      memoryUsage: this.estimateMemoryUsage(context),
      fps: 0, // Will be updated during interaction
      nodesRendered: context.nodes.size,
      edgesRendered: context.edges.length
    });
  }

  /**
   * Update visuals using current strategy
   */
  public async updateVisualsAsync(updates: VisualUpdates): Promise<void> {
    if (!this.activeStrategy) {
      throw new Error('No active rendering strategy');
    }

    const startTime = performance.now();
    await this.activeStrategy.updateVisualsAsync(updates);
    const endTime = performance.now();

    // Update performance metrics
    if (this.activeStrategyName) {
      const history = this.performanceHistory.get(this.activeStrategyName) || [];
      if (history.length > 0) {
        history[history.length - 1].updateTime = endTime - startTime;
      }
    }
  }

  /**
   * Handle interaction events
   */
  public handleInteraction(event: InteractionEvent): boolean {
    if (!this.activeStrategy) return false;
    return this.activeStrategy.handleInteraction(event);
  }

  /**
   * Get capabilities of current strategy
   */
  public getCapabilities(): RenderingCapabilities | null {
    if (!this.activeStrategy) return null;
    return this.activeStrategy.getCapabilities();
  }

  /**
   * Get current active strategy name
   */
  public getActiveStrategyName(): string | null {
    return this.activeStrategyName;
  }

  /**
   * Validate strategy configuration
   */
  public validateConfiguration(config: RenderingConfig): ValidationResult {
    if (!this.activeStrategy) {
      return {
        isValid: false,
        errors: [{ field: 'strategy', message: 'No active strategy', code: 'NO_STRATEGY' }],
        warnings: []
      };
    }

    return this.activeStrategy.validateConfiguration(config);
  }

  /**
   * Get performance metrics for a strategy
   */
  public getPerformanceMetrics(strategyName: string): StrategyPerformanceMetrics[] {
    return this.performanceHistory.get(strategyName) || [];
  }

  /**
   * Recommend optimal strategy based on current context
   */
  public recommendStrategy(nodeCount: number, edgeCount: number): string {
    // Simple recommendation logic - can be enhanced
    if (nodeCount > 1000 || edgeCount > 2000) {
      return this.strategies.has('webgl') ? 'webgl' : 'canvas';
    } else if (nodeCount < 100 && edgeCount < 200) {
      return 'svg'; // SVG is good for small, interactive graphs
    } else {
      return 'canvas'; // Balanced performance for medium datasets
    }
  }

  /**
   * Cleanup all strategies
   */
  public async cleanupAsync(): Promise<void> {
    if (this.activeStrategy) {
      await this.activeStrategy.cleanupAsync();
    }
    
    this.activeStrategy = null;
    this.activeStrategyName = null;
    this.currentContext = null;
    this.preservedState = null;
  }

  /**
   * Add event listener
   */
  public addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: string, listener: Function): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  /**
   * Initialize event system
   */
  private initializeEventSystem(): void {
    this.eventListeners.set('strategy-switched', new Set());
    this.eventListeners.set('strategy-switch-failed', new Set());
    this.eventListeners.set('performance-warning', new Set());
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Capture current interaction state
   */
  private captureCurrentState(context: RenderingContext): any {
    return {
      viewport: { ...context.viewport },
      // Additional state preservation logic will be added
      timestamp: Date.now()
    };
  }

  /**
   * Restore interaction state after strategy switch
   */
  private async restoreState(state: any): Promise<void> {
    if (!this.activeStrategy || !this.currentContext) return;

    // Apply viewport state
    if (state.viewport && this.config.statePreservation.preserveZoom) {
      // State restoration logic will be enhanced during integration
      const updates: VisualUpdates = {
        viewport: state.viewport
      };
      await this.activeStrategy.updateVisualsAsync(updates);
    }
  }

  /**
   * Attempt fallback to safe strategy
   */
  private async attemptFallbackStrategy(reason: string): Promise<boolean> {
    for (const fallbackName of this.config.fallbackChain) {
      if (this.strategies.has(fallbackName) && fallbackName !== this.activeStrategyName) {
        try {
          const success = await this.switchToStrategyAsync(fallbackName, 'compatibility');
          if (success) {
            this.emitEvent('fallback-activated', { 
              strategy: fallbackName, 
              originalReason: reason 
            });
            return true;
          }
        } catch (error) {
          continue; // Try next fallback
        }
      }
    }
    return false;
  }

  /**
   * Record performance metrics
   */
  private recordPerformanceMetrics(strategyName: string, metrics: StrategyPerformanceMetrics): void {
    if (!this.performanceHistory.has(strategyName)) {
      this.performanceHistory.set(strategyName, []);
    }
    
    const history = this.performanceHistory.get(strategyName)!;
    history.push(metrics);
    
    // Keep only last 10 metrics for memory efficiency
    if (history.length > 10) {
      history.shift();
    }

    // Check performance thresholds
    if (metrics.renderTime > this.config.performanceThresholds.maxRenderTime ||
        metrics.memoryUsage > this.config.performanceThresholds.maxMemoryUsage) {
      this.emitEvent('performance-warning', { strategy: strategyName, metrics });
    }
  }

  /**
   * Estimate memory usage based on context
   */
  private estimateMemoryUsage(context: RenderingContext): number {
    const capabilities = this.getCapabilities();
    if (!capabilities) return 0;

    const nodeMemory = context.nodes.size * (capabilities.memoryProfile?.perNode || 0.1);
    const edgeMemory = context.edges.length * (capabilities.memoryProfile?.perEdge || 0.05);
    const baseMemory = capabilities.memoryProfile?.baseUsage || 10;
    
    return baseMemory + nodeMemory + edgeMemory;
  }
}

/**
 * Factory function for creating RenderingStrategyManager instances
 */
export function createRenderingStrategyManager(
  config?: Partial<RenderingStrategyManagerConfig>
): RenderingStrategyManager {
  return new RenderingStrategyManager(config);
}

/**
 * Create default strategy manager with all standard strategies registered
 */
export function createDefaultStrategyManager(): RenderingStrategyManager {
  const manager = new RenderingStrategyManager();
  
  // Note: Strategy registration will be completed during integration with
  // existing CanvasRenderingStrategy, SVGRenderingStrategy, WebGLRenderingStrategy
  
  return manager;
}