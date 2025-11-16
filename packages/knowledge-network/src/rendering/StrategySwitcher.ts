/**
 * Strategy Switcher Implementation
 * 
 * Manages dynamic switching between rendering strategies while preserving navigation state.
 * Provides automatic strategy selection, performance monitoring, fallback handling,
 * and seamless transitions between Canvas, SVG, and WebGL rendering.
 * 
 * @fileoverview Dynamic rendering strategy management and switching
 */

import { EventEmitter } from '../utils/ReactiveEmitter.js';
import type {
  IRenderingStrategy,
  RenderingContext,
  RenderingCapabilities
} from './rendering-strategy';

/**
 * Performance metrics for strategy switching decisions
 */
export interface PerformanceMetrics {
  currentFPS: number;
  renderTime: number;
  memoryUsage: number;
  nodeCount: number;
}

/**
 * Strategy switching configuration options
 */
export interface SwitcherOptions {
  autoSwitchEnabled: boolean;
  performanceThreshold: number;
  memoryThreshold: number;
  switchDebounceTime: number;
  fallbackStrategy: string;
}

/**
 * Performance-based strategy suggestion
 */
export interface PerformanceSuggestion {
  suggestedStrategy: string;
  reason: string;
  expectedImprovement: string;
  confidence: number; // 0-1
}

/**
 * Strategy comparison result
 */
export interface StrategyComparison {
  [strategyName: string]: RenderingCapabilities;
}

/**
 * Strategy Switcher
 * 
 * Coordinates multiple rendering strategies with:
 * - Dynamic strategy selection based on dataset size and performance
 * - Seamless navigation state preservation during switches
 * - Automatic fallback and error recovery
 * - Performance monitoring and optimization recommendations
 * - Thread-safe concurrent switching management
 */
export class StrategySwitcher extends EventEmitter {
  private strategies: Map<string, IRenderingStrategy> = new Map();
  private currentStrategy: IRenderingStrategy | null = null;
  private currentStrategyName: string | null = null;
  private currentContext: RenderingContext | null = null;
  private switchingInProgress = false;
  private lastSwitchTime = 0;
  private performanceHistory: PerformanceMetrics[] = [];
  
  // Configuration
  private options: SwitcherOptions = {
    autoSwitchEnabled: false,
    performanceThreshold: 45, // FPS
    memoryThreshold: 512, // MB
    switchDebounceTime: 2000, // ms
    fallbackStrategy: 'canvas'
  };

  /**
   * Expose events interface for external access
   */
  public get events(): EventEmitter {
    return this;
  }

  /**
   * Register a rendering strategy
   */
  public registerStrategy(name: string, strategy: IRenderingStrategy): void {
    if (this.strategies.has(name)) {
      throw new Error(`Strategy "${name}" is already registered`);
    }
    
    this.strategies.set(name, strategy);
    this.emit('strategy-registered', { name, capabilities: strategy.getCapabilities() });
  }

  /**
   * Get list of available strategy names
   */
  public getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get capabilities for a specific strategy
   */
  public getStrategyCapabilities(strategyName: string): RenderingCapabilities {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy "${strategyName}" not found`);
    }
    return strategy.getCapabilities();
  }

  /**
   * Recommend optimal strategy based on dataset characteristics
   */
  public recommendStrategy(nodeCount: number, edgeCount: number): string {
    let bestStrategy = 'canvas';
    let bestScore = 0;

    for (const [name, strategy] of this.strategies) {
      const capabilities = strategy.getCapabilities();
      let score = 0;

      // Score based on capacity
      if (nodeCount <= capabilities.maxNodes && edgeCount <= capabilities.maxEdges) {
        score += 100; // Can handle the data
        
        // Additional scoring factors
        if (capabilities.features.hardwareAcceleration && nodeCount > 1000) {
          score += 50; // Hardware acceleration bonus for large datasets
        }
        
        if (capabilities.features.realTimeUpdates) {
          score += 20; // Real-time updates bonus
        }
        
        // Efficiency scoring
        const nodeEfficiency = capabilities.maxNodes / capabilities.memoryProfile.perNode;
        score += Math.min(nodeEfficiency / 1000, 30); // Efficiency bonus
      }

      if (score > bestScore) {
        bestScore = score;
        bestStrategy = name;
      }
    }

    return bestStrategy;
  }

  /**
   * Switch to a specific rendering strategy
   */
  public async switchToStrategy(strategyName: string, context: RenderingContext): Promise<boolean> {
    if (this.switchingInProgress) {
      // Wait for current switch to complete
      await this.waitForSwitchCompletion();
    }

    // Check if already using this strategy
    if (this.currentStrategyName === strategyName) {
      return true; // No-op
    }

    try {
      this.switchingInProgress = true;
      this.emit('strategy-switch-start', {
        from: this.currentStrategyName,
        to: strategyName,
        reason: 'manual'
      });

      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        throw new Error(`Strategy "${strategyName}" not registered`);
      }

      // Validate strategy compatibility
      const isCompatible = await this.isStrategyCompatible(strategyName, context);
      if (!isCompatible) {
        throw new Error(`Strategy "${strategyName}" is not compatible with current context`);
      }

      // Cleanup previous strategy
      if (this.currentStrategy) {
        await this.currentStrategy.cleanupAsync();
        this.emit('strategy-lifecycle', {
          event: 'disposed',
          strategy: this.currentStrategyName
        });
      }

      // Preserve navigation state
      const preservedViewport = context.viewport ? { ...context.viewport } : null;

      // Switch to new strategy
      this.currentStrategy = strategy;
      this.currentStrategyName = strategyName;
      this.currentContext = context;

      // Initialize new strategy
      await this.currentStrategy.renderAsync(context);
      
      this.emit('strategy-lifecycle', {
        event: 'initialized',
        strategy: strategyName
      });

      this.emit('strategy-switch-complete', {
        strategy: strategyName,
        success: true,
        preservedState: preservedViewport
      });

      this.lastSwitchTime = Date.now();
      return true;

    } catch (error) {
      this.emit('error', error);
      this.emit('strategy-switch-complete', {
        strategy: strategyName,
        success: false,
        error: (error as Error).message
      });

      // Attempt fallback if available
      if (this.options.fallbackStrategy && this.options.fallbackStrategy !== strategyName) {
        try {
          return await this.switchToStrategy(this.options.fallbackStrategy, context);
        } catch (fallbackError) {
          this.emit('error', fallbackError);
        }
      }

      throw error;
    } finally {
      this.switchingInProgress = false;
    }
  }

  /**
   * Render with automatically selected optimal strategy
   */
  public async renderWithOptimalStrategy(context: RenderingContext): Promise<void> {
    const optimalStrategy = this.recommendStrategy(context.nodes.size, context.edges.length);
    await this.switchToStrategy(optimalStrategy, context);
  }

  /**
   * Check if strategy is compatible with given context
   */
  public async isStrategyCompatible(strategyName: string, context: RenderingContext): Promise<boolean> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return false;

    try {
      // Check capability limits
      const capabilities = strategy.getCapabilities();
      if (context.nodes.size > capabilities.maxNodes) return false;
      if (context.edges.length > capabilities.maxEdges) return false;

      // Check configuration validity
      const validation = strategy.validateConfiguration(context.config);
      if (!validation.isValid) return false;

      // Check browser support for strategy-specific features
      if (strategyName === 'webgl') {
        return typeof window !== 'undefined' && !!window.WebGLRenderingContext;
      }

      return true;
    } catch (error) {
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Get current active strategy
   */
  public getCurrentStrategy(): IRenderingStrategy {
    if (!this.currentStrategy) {
      throw new Error('No strategy is currently active');
    }
    return this.currentStrategy;
  }

  /**
   * Get current strategy name
   */
  public getCurrentStrategyName(): string {
    return this.currentStrategyName || '';
  }

  /**
   * Get current rendering context
   */
  public getCurrentContext(): RenderingContext | null {
    return this.currentContext;
  }

  /**
   * Configure switcher behavior
   */
  public configure(options: Partial<SwitcherOptions>): void {
    // Validate options
    if (options.performanceThreshold !== undefined && options.performanceThreshold <= 0) {
      throw new Error('Performance threshold must be positive');
    }
    if (options.switchDebounceTime !== undefined && options.switchDebounceTime < 0) {
      throw new Error('Switch debounce time cannot be negative');
    }

    Object.assign(this.options, options);
    this.emit('configuration-changed', this.options);
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): SwitcherOptions {
    return { ...this.options };
  }

  /**
   * Enable/disable automatic strategy selection
   */
  public setAutoSelectionEnabled(enabled: boolean): void {
    this.options.autoSwitchEnabled = enabled;
  }

  /**
   * Enable/disable performance monitoring
   */
  public enablePerformanceMonitoring(enabled: boolean): void {
    this.emit('performance-monitoring-changed', { enabled });
  }

  /**
   * Enable/disable automatic switching based on performance
   */
  public setAutoSwitchEnabled(enabled: boolean): void {
    this.options.autoSwitchEnabled = enabled;
  }

  /**
   * Set fallback strategy for error recovery
   */
  public setFallbackStrategy(strategyName: string): void {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Fallback strategy "${strategyName}" is not registered`);
    }
    this.options.fallbackStrategy = strategyName;
  }

  /**
   * Enable/disable degradation handling
   */
  public setDegradationEnabled(enabled: boolean): void {
    // Implementation for degradation handling
    this.emit('degradation-changed', { enabled });
  }

  /**
   * Report performance metrics for monitoring
   */
  public reportPerformanceMetrics(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    
    // Keep only recent history
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift();
    }

    this.emit('performance-update', metrics);

    // Check for auto-switching conditions
    if (this.options.autoSwitchEnabled && this.shouldAutoSwitch(metrics)) {
      this.triggerAutoSwitch(metrics);
    }
  }

  /**
   * Report memory pressure for degradation
   */
  public reportMemoryPressure(memoryUsageMB: number): void {
    if (memoryUsageMB > this.options.memoryThreshold && this.currentContext) {
      // Find less memory-intensive strategy
      const currentCapabilities = this.currentStrategy?.getCapabilities();
      if (!currentCapabilities) return;

      for (const [name, strategy] of this.strategies) {
        const capabilities = strategy.getCapabilities();
        if (capabilities.memoryProfile.baseUsage < currentCapabilities.memoryProfile.baseUsage) {
          this.switchToStrategy(name, this.currentContext).catch(error => {
            this.emit('error', error);
          });
          break;
        }
      }
    }
  }

  /**
   * Get performance-based strategy suggestion
   */
  public getPerformanceSuggestion(): PerformanceSuggestion | null {
    if (this.performanceHistory.length === 0) return null;

    const recentMetrics = this.performanceHistory.slice(-10);
    const avgFPS = recentMetrics.reduce((sum, m) => sum + m.currentFPS, 0) / recentMetrics.length;

    if (avgFPS < this.options.performanceThreshold) {
      // Suggest more performant strategy
      const currentCapabilities = this.currentStrategy?.getCapabilities();
      if (!currentCapabilities) return null;

      for (const [name, strategy] of this.strategies) {
        const capabilities = strategy.getCapabilities();
        if (capabilities.features.hardwareAcceleration && !currentCapabilities.features.hardwareAcceleration) {
          return {
            suggestedStrategy: name,
            reason: `Current FPS (${avgFPS.toFixed(1)}) below threshold (${this.options.performanceThreshold})`,
            expectedImprovement: 'GPU acceleration should improve performance significantly',
            confidence: 0.8
          };
        }
      }
    }

    return null;
  }

  /**
   * Compare capabilities of multiple strategies
   */
  public compareStrategies(strategyNames: string[]): StrategyComparison {
    const comparison: StrategyComparison = {};
    
    for (const name of strategyNames) {
      const strategy = this.strategies.get(name);
      if (strategy) {
        comparison[name] = strategy.getCapabilities();
      }
    }
    
    return comparison;
  }

  /**
   * Check if switcher is in healthy state
   */
  public isHealthy(): boolean {
    return !this.switchingInProgress && this.currentStrategy !== null;
  }

  /**
   * Cleanup all strategies and resources
   */
  public async cleanup(): Promise<void> {
    if (this.currentStrategy) {
      await this.currentStrategy.cleanupAsync();
      this.emit('strategy-lifecycle', {
        event: 'disposed',
        strategy: this.currentStrategyName
      });
    }

    this.currentStrategy = null;
    this.currentStrategyName = null;
    this.currentContext = null;
    this.performanceHistory = [];
  }

  /**
   * Wait for any in-progress switch to complete
   */
  private async waitForSwitchCompletion(): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (!this.switchingInProgress) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);
    });
  }

  /**
   * Check if auto-switching should be triggered
   */
  private shouldAutoSwitch(metrics: PerformanceMetrics): boolean {
    // Debouncing - don't switch too frequently
    const timeSinceLastSwitch = Date.now() - this.lastSwitchTime;
    if (timeSinceLastSwitch < this.options.switchDebounceTime) {
      return false;
    }

    // Performance threshold check
    return metrics.currentFPS < this.options.performanceThreshold;
  }

  /**
   * Trigger automatic strategy switching
   */
  private async triggerAutoSwitch(_metrics: PerformanceMetrics): Promise<void> {
    if (!this.currentContext) return;

    try {
      const suggestion = this.getPerformanceSuggestion();
      if (suggestion && suggestion.confidence > 0.7) {
        this.emit('auto-switch-triggered', {
          from: this.currentStrategyName,
          to: suggestion.suggestedStrategy,
          reason: suggestion.reason
        });

        await this.switchToStrategy(suggestion.suggestedStrategy, this.currentContext);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }
}