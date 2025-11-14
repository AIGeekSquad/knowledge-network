/**
 * Base Rendering Strategy Implementation
 * 
 * Abstract base class that provides common functionality for all rendering strategies.
 * Implements the IRenderingStrategy interface and provides lifecycle management,
 * event handling, and performance monitoring infrastructure.
 * 
 * @fileoverview Base rendering strategy with common implementation patterns
 */

import { EventEmitter } from 'events';
import type {
  IRenderingStrategy,
  RenderingContext,
  RenderingConfig,
  RenderingCapabilities,
  ValidationResult,
  VisualUpdates,
  InteractionEvent,
  RenderingProgressCallback
} from './rendering-strategy';

/**
 * Abstract base class for rendering strategies
 * 
 * Provides common infrastructure for:
 * - Lifecycle management (initialization, cleanup)
 * - Event system for rendering lifecycle and performance tracking
 * - State management for initialization status
 * - Error handling and validation patterns
 * - Performance monitoring hooks
 */
export abstract class BaseRenderingStrategy implements IRenderingStrategy {
  protected _isInitialized = false;
  protected _events = new EventEmitter();
  protected _performanceStartTime: number | null = null;

  /**
   * Whether this strategy has been initialized
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Event emitter for lifecycle and performance events
   */
  public get events(): EventEmitter {
    return this._events;
  }

  /**
   * Abstract method: Get strategy capabilities and constraints
   * Must be implemented by concrete strategies
   */
  public abstract getCapabilities(): RenderingCapabilities;

  /**
   * Abstract method: Render the complete graph using this strategy
   * Must be implemented by concrete strategies
   */
  public abstract renderAsync(
    context: RenderingContext, 
    progress?: RenderingProgressCallback
  ): Promise<void>;

  /**
   * Abstract method: Clean up rendering resources and stop active operations
   * Must be implemented by concrete strategies
   */
  public abstract cleanupAsync(): Promise<void>;

  /**
   * Abstract method: Handle user interaction events
   * Must be implemented by concrete strategies
   */
  public abstract handleInteraction(event: InteractionEvent): boolean;

  /**
   * Abstract method: Update visual properties without full re-render
   * Must be implemented by concrete strategies
   */
  public abstract updateVisualsAsync(updates: VisualUpdates): Promise<void>;

  /**
   * Abstract method: Validate configuration before rendering
   * Must be implemented by concrete strategies
   */
  public abstract validateConfiguration(config: RenderingConfig): ValidationResult;

  /**
   * Mark strategy as initialized and emit lifecycle events
   * Should be called by concrete implementations after successful initialization
   */
  protected markAsInitialized(): void {
    this._isInitialized = true;
    this.emitEvent('initialized', {
      strategy: this.constructor.name,
      timestamp: Date.now(),
      capabilities: this.getCapabilities()
    });
  }

  /**
   * Mark strategy as disposed and emit lifecycle events
   * Should be called by concrete implementations during cleanup
   */
  protected dispose(): void {
    this._isInitialized = false;
    this.emitEvent('disposed', {
      strategy: this.constructor.name,
      timestamp: Date.now()
    });
  }

  /**
   * Emit an event through the event system
   * Provides consistent event emission with error handling
   */
  protected emitEvent(eventName: string, data?: any): void {
    try {
      this._events.emit(eventName, data);
    } catch (error) {
      // Log error but don't throw to prevent cascading failures
      console.error(`Error emitting event '${eventName}':`, error);
      this._events.emit('error', error);
    }
  }

  /**
   * Start performance tracking for an operation
   * Returns start time for duration calculation
   */
  protected startPerformanceTracking(): number {
    this._performanceStartTime = performance.now();
    return this._performanceStartTime;
  }

  /**
   * End performance tracking and emit performance event
   */
  protected endPerformanceTracking(
    operation: string, 
    additionalData?: Record<string, any>
  ): number {
    const endTime = performance.now();
    const duration = this._performanceStartTime ? endTime - this._performanceStartTime : 0;
    
    this.emitEvent('performance', {
      operation,
      duration,
      startTime: this._performanceStartTime,
      endTime,
      ...additionalData
    });
    
    this._performanceStartTime = null;
    return duration;
  }

  /**
   * Emit rendering lifecycle event with performance data
   */
  protected emitRenderingEvent(
    stage: 'started' | 'completed' | 'failed',
    context?: RenderingContext,
    error?: Error
  ): void {
    this.emitEvent('rendering', {
      stage,
      strategy: this.constructor.name,
      timestamp: Date.now(),
      nodeCount: context?.nodes.size ?? 0,
      edgeCount: context?.edges.length ?? 0,
      error: error?.message
    });

    // Also emit specific event for the stage
    this.emitEvent(`render-${stage}`, {
      strategy: this.constructor.name,
      timestamp: Date.now(),
      context,
      error
    });
  }

  /**
   * Validate rendering context before processing
   * Provides common validation patterns for all strategies
   */
  protected validateContext(context: RenderingContext): ValidationResult {
    const errors: Array<{field: string; message: string; code: string}> = [];
    const warnings: Array<{field: string; message: string; severity: 'low' | 'medium' | 'high'}> = [];

    // Validate required context properties
    if (!context) {
      errors.push({
        field: 'context',
        message: 'Rendering context is required',
        code: 'MISSING_CONTEXT'
      });
      return { isValid: false, errors, warnings };
    }

    if (!context.container) {
      errors.push({
        field: 'context.container',
        message: 'Container element is required',
        code: 'MISSING_CONTAINER'
      });
    }

    if (!context.nodes || !(context.nodes instanceof Map)) {
      errors.push({
        field: 'context.nodes',
        message: 'Nodes must be provided as Map<string, LayoutNode>',
        code: 'INVALID_NODES'
      });
    }

    if (!Array.isArray(context.edges)) {
      errors.push({
        field: 'context.edges',
        message: 'Edges must be provided as array',
        code: 'INVALID_EDGES'
      });
    }

    if (!context.config) {
      errors.push({
        field: 'context.config',
        message: 'Rendering configuration is required',
        code: 'MISSING_CONFIG'
      });
    }

    // Validate capabilities vs context requirements
    const capabilities = this.getCapabilities();
    if (context.nodes && context.nodes.size > capabilities.maxNodes) {
      warnings.push({
        field: 'context.nodes',
        message: `Node count (${context.nodes.size}) exceeds recommended maximum (${capabilities.maxNodes})`,
        severity: 'medium' as const
      });
    }

    if (context.edges && context.edges.length > capabilities.maxEdges) {
      warnings.push({
        field: 'context.edges',
        message: `Edge count (${context.edges.length}) exceeds recommended maximum (${capabilities.maxEdges})`,
        severity: 'medium' as const
      });
    }

    // Validate container is in DOM (only in browser environment)
    if (context.container && typeof document !== 'undefined' && document.body) {
      try {
        if (!document.body.contains(context.container)) {
          warnings.push({
            field: 'context.container',
            message: 'Container element is not attached to DOM',
            severity: 'low' as const
          });
        }
      } catch (error) {
        // Ignore DOM validation errors in test environments
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get memory usage estimate for current context
   * Provides baseline memory calculation that strategies can override
   */
  protected estimateMemoryUsage(context?: RenderingContext): number {
    if (!context) return 0;

    const capabilities = this.getCapabilities();
    const baseUsage = capabilities.memoryProfile.baseUsage;
    const nodeMemory = context.nodes.size * capabilities.memoryProfile.perNode;
    const edgeMemory = context.edges.length * capabilities.memoryProfile.perEdge;
    
    return baseUsage + nodeMemory + edgeMemory;
  }

  /**
   * Check if context exceeds performance constraints
   */
  protected checkPerformanceConstraints(context: RenderingContext): boolean {
    if (!context.constraints.enableMonitoring) {
      return true; // Skip checks if monitoring disabled
    }

    const estimatedMemory = this.estimateMemoryUsage(context);
    if (estimatedMemory > context.constraints.maxMemoryMB) {
      this.emitEvent('performance-warning', {
        type: 'memory',
        estimated: estimatedMemory,
        limit: context.constraints.maxMemoryMB,
        message: 'Estimated memory usage exceeds constraints'
      });
      return false;
    }

    return true;
  }

  /**
   * Safe cleanup helper that handles errors gracefully
   */
  protected async safeCleanup(cleanupFn: () => Promise<void> | void): Promise<void> {
    try {
      await cleanupFn();
    } catch (error) {
      console.error(`Cleanup error in ${this.constructor.name}:`, error);
      this.emitEvent('error', error);
    }
  }

  /**
   * Validate that required DOM APIs are available
   * Useful for strategies that depend on specific browser features
   */
  protected validateDOMSupport(requiredAPIs: string[]): ValidationResult {
    const errors = [];
    const missing = [];

    for (const api of requiredAPIs) {
      if (typeof window === 'undefined') {
        missing.push(api);
        continue;
      }

      // Check for API availability
      const parts = api.split('.');
      let current: any = window;
      for (const part of parts) {
        if (!current || !(part in current)) {
          missing.push(api);
          break;
        }
        current = current[part];
      }
    }

    if (missing.length > 0) {
      errors.push({
        field: 'browser-support',
        message: `Required APIs not available: ${missing.join(', ')}`,
        code: 'UNSUPPORTED_BROWSER'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Create a debounced function for performance-sensitive operations
   */
  protected createDebounced<T extends (...args: any[]) => any>(
    fn: T,
    delay: number
  ): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const debounced = ((...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    }) as T & { cancel: () => void };
    
    debounced.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
    
    return debounced;
  }

  /**
   * Helper to check if strategy supports a specific interaction type
   */
  protected supportsInteraction(interactionType: string): boolean {
    const capabilities = this.getCapabilities();
    return capabilities.supportedInteractions.includes(interactionType);
  }

  /**
   * Destructor-like cleanup when strategy is no longer needed
   * Removes all event listeners and cleans up resources
   */
  public destroy(): void {
    this._events.removeAllListeners();
    this.dispose();
  }
}