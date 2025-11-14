/**
 * InteractionEventSystem provides a decoupled event system for
 * communication between the interaction controller and renderers.
 *
 * Features:
 * - Type-safe event system
 * - Event filtering and middleware
 * - Performance optimization
 * - Event batching and debouncing
 * - Plugin architecture for custom events
 */

import { EventEmitter } from '../utils/EventEmitter';
import type { IRenderer } from '../rendering/IRenderer';
import type {
  InteractionEvent,
  ViewportChangeEvent,
  SelectionChangeEvent,
  NodeInteractionEvent,
  GestureEvent,
} from './types';

// === Event Type Registry ===

export interface InteractionEventMap {
  // Core viewport events
  'viewport:change': ViewportChangeEvent;
  'viewport:pan:start': ViewportChangeEvent;
  'viewport:pan': ViewportChangeEvent;
  'viewport:pan:end': ViewportChangeEvent;
  'viewport:zoom:start': ViewportChangeEvent;
  'viewport:zoom': ViewportChangeEvent;
  'viewport:zoom:end': ViewportChangeEvent;
  'viewport:reset': ViewportChangeEvent;
  'viewport:fit': ViewportChangeEvent;

  // Node interaction events
  'node:click': NodeInteractionEvent;
  'node:doubleclick': NodeInteractionEvent;
  'node:hover': NodeInteractionEvent;
  'node:hover:start': NodeInteractionEvent;
  'node:hover:end': NodeInteractionEvent;
  'node:drag:start': NodeInteractionEvent;
  'node:drag': NodeInteractionEvent;
  'node:drag:end': NodeInteractionEvent;

  // Selection events
  'selection:change': SelectionChangeEvent;
  'selection:clear': SelectionChangeEvent;
  'selection:add': SelectionChangeEvent;
  'selection:remove': SelectionChangeEvent;

  // Gesture events
  'gesture:tap': GestureEvent;
  'gesture:doubletap': GestureEvent;
  'gesture:longpress': GestureEvent;
  'gesture:pan': GestureEvent;
  'gesture:pinch': GestureEvent;
  'gesture:swipe': GestureEvent;

  // Interaction mode events
  'interaction:mode:change': InteractionModeChangeEvent;
  'interaction:state:change': InteractionStateChangeEvent;

  // Performance events
  'performance:frame': PerformanceEvent;
  'performance:warning': PerformanceWarningEvent;

  // Error events
  'error:interaction': InteractionErrorEvent;
}

// === Additional Event Types ===

export interface InteractionModeChangeEvent extends InteractionEvent {
  mode: 'pan' | 'zoom' | 'select' | 'drag' | 'idle';
  previousMode: 'pan' | 'zoom' | 'select' | 'drag' | 'idle';
}

export interface InteractionStateChangeEvent extends InteractionEvent {
  state: {
    isPanning: boolean;
    isZooming: boolean;
    isSelecting: boolean;
    isDragging: boolean;
    isAnimating: boolean;
  };
}

export interface PerformanceEvent extends InteractionEvent {
  frameRate: number;
  renderTime: number;
  activeAnimations: number;
}

export interface PerformanceWarningEvent extends InteractionEvent {
  warning: 'low_framerate' | 'high_memory' | 'slow_render' | 'animation_backlog';
  severity: 'info' | 'warning' | 'error';
  details: Record<string, any>;
}

export interface InteractionErrorEvent extends InteractionEvent {
  error: Error;
  context: string;
  recoverable: boolean;
}

// === Event Middleware System ===

export interface EventMiddleware<T extends InteractionEvent = InteractionEvent> {
  name: string;
  process(event: T, next: (event: T) => void): void;
}

export interface EventFilter<T extends InteractionEvent = InteractionEvent> {
  name: string;
  filter(event: T): boolean;
}

// === Event Batching ===

export interface BatchedEvent<T extends InteractionEvent = InteractionEvent> {
  events: T[];
  batchStartTime: number;
  batchEndTime: number;
  eventType: keyof InteractionEventMap;
}

export interface EventBatchingConfig {
  enabled: boolean;
  batchSize: number;
  maxBatchTime: number; // ms
  batchableEvents: Array<keyof InteractionEventMap>;
}

// === Main Event System ===

export class InteractionEventSystem extends EventEmitter {
  private middlewares = new Map<string, EventMiddleware[]>();
  private filters = new Map<string, EventFilter[]>();
  private eventBatches = new Map<string, InteractionEvent[]>();
  private batchTimers = new Map<string, number>();
  private batchingConfig: EventBatchingConfig;

  // Performance tracking
  private eventCounts = new Map<string, number>();
  private lastPerformanceCheck = 0;
  private performanceCheckInterval = 1000; // 1 second

  // Event routing
  private rendererSubscriptions = new Map<IRenderer, Set<keyof InteractionEventMap>>();

  constructor(batchingConfig?: Partial<EventBatchingConfig>) {
    super();

    this.batchingConfig = {
      enabled: true,
      batchSize: 10,
      maxBatchTime: 16, // 60fps
      batchableEvents: [
        'viewport:pan',
        'viewport:zoom',
        'node:hover',
        'gesture:pan',
        'gesture:pinch',
        'performance:frame',
      ],
      ...batchingConfig,
    };

    this.setupPerformanceMonitoring();
  }

  // === Event Emission ===

  /**
   * Emit a typed interaction event
   */
  emitInteractionEvent<K extends keyof InteractionEventMap>(
    eventType: K,
    event: InteractionEventMap[K]
  ): void {
    // Apply filters
    const filters = this.filters.get(eventType as string) || [];
    for (const filter of filters) {
      if (!filter.filter(event)) {
        return; // Event filtered out
      }
    }

    // Apply middleware pipeline
    this.processWithMiddleware(eventType as string, event, (processedEvent) => {
      // Handle batching
      if (this.shouldBatchEvent(eventType)) {
        this.addToBatch(eventType as string, processedEvent);
      } else {
        this.emitDirectly(eventType as string, processedEvent);
      }
    });
  }

  /**
   * Emit multiple events as a batch
   */
  emitBatch<K extends keyof InteractionEventMap>(
    eventType: K,
    events: InteractionEventMap[K][]
  ): void {
    if (events.length === 0) return;

    const batchedEvent: BatchedEvent<InteractionEventMap[K]> = {
      events,
      batchStartTime: events[0].timestamp,
      batchEndTime: events[events.length - 1].timestamp,
      eventType,
    };

    this.emit(`${eventType as string}:batch`, batchedEvent);
    this.emit('event:batch', batchedEvent);
  }

  // === Middleware System ===

  /**
   * Add middleware to process events of a specific type
   */
  addMiddleware<K extends keyof InteractionEventMap>(
    eventType: K,
    middleware: EventMiddleware<InteractionEventMap[K]>
  ): void {
    const eventTypeStr = eventType as string;
    if (!this.middlewares.has(eventTypeStr)) {
      this.middlewares.set(eventTypeStr, []);
    }
    this.middlewares.get(eventTypeStr)!.push(middleware);
  }

  /**
   * Remove middleware
   */
  removeMiddleware<K extends keyof InteractionEventMap>(
    eventType: K,
    middlewareName: string
  ): void {
    const eventTypeStr = eventType as string;
    const middlewares = this.middlewares.get(eventTypeStr);
    if (middlewares) {
      const index = middlewares.findIndex(m => m.name === middlewareName);
      if (index >= 0) {
        middlewares.splice(index, 1);
      }
    }
  }

  // === Event Filtering ===

  /**
   * Add event filter
   */
  addFilter<K extends keyof InteractionEventMap>(
    eventType: K,
    filter: EventFilter<InteractionEventMap[K]>
  ): void {
    const eventTypeStr = eventType as string;
    if (!this.filters.has(eventTypeStr)) {
      this.filters.set(eventTypeStr, []);
    }
    this.filters.get(eventTypeStr)!.push(filter);
  }

  /**
   * Remove event filter
   */
  removeFilter<K extends keyof InteractionEventMap>(
    eventType: K,
    filterName: string
  ): void {
    const eventTypeStr = eventType as string;
    const filters = this.filters.get(eventTypeStr);
    if (filters) {
      const index = filters.findIndex(f => f.name === filterName);
      if (index >= 0) {
        filters.splice(index, 1);
      }
    }
  }

  // === Renderer Integration ===

  /**
   * Subscribe a renderer to specific event types
   */
  subscribeRenderer(renderer: IRenderer, eventTypes: Array<keyof InteractionEventMap>): void {
    if (!this.rendererSubscriptions.has(renderer)) {
      this.rendererSubscriptions.set(renderer, new Set());
    }

    const subscriptions = this.rendererSubscriptions.get(renderer)!;
    eventTypes.forEach(eventType => {
      subscriptions.add(eventType);
      this.on(eventType as string, (event: InteractionEvent) => {
        this.notifyRenderer(renderer, eventType, event);
      });
    });
  }

  /**
   * Unsubscribe a renderer from all events
   */
  unsubscribeRenderer(renderer: IRenderer): void {
    const subscriptions = this.rendererSubscriptions.get(renderer);
    if (subscriptions) {
      subscriptions.forEach(eventType => {
        this.removeAllListeners(eventType as string);
      });
      this.rendererSubscriptions.delete(renderer);
    }
  }

  // === Batching Configuration ===

  /**
   * Update batching configuration
   */
  updateBatchingConfig(config: Partial<EventBatchingConfig>): void {
    this.batchingConfig = { ...this.batchingConfig, ...config };
  }

  /**
   * Get current batching configuration
   */
  getBatchingConfig(): EventBatchingConfig {
    return { ...this.batchingConfig };
  }

  // === Performance Monitoring ===

  /**
   * Get event statistics
   */
  getEventStats(): Record<string, number> {
    return Object.fromEntries(this.eventCounts);
  }

  /**
   * Reset event statistics
   */
  resetEventStats(): void {
    this.eventCounts.clear();
  }

  // === Built-in Middleware ===

  /**
   * Create throttling middleware
   */
  static createThrottleMiddleware<T extends InteractionEvent>(
    name: string,
    delay: number
  ): EventMiddleware<T> {
    let lastEmit = 0;

    return {
      name,
      process: (event: T, next: (event: T) => void) => {
        const now = Date.now();
        if (now - lastEmit >= delay) {
          lastEmit = now;
          next(event);
        }
      },
    };
  }

  /**
   * Create debouncing middleware
   */
  static createDebounceMiddleware<T extends InteractionEvent>(
    name: string,
    delay: number
  ): EventMiddleware<T> {
    let timeoutId: number | null = null;

    return {
      name,
      process: (event: T, next: (event: T) => void) => {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }

        timeoutId = window.setTimeout(() => {
          next(event);
          timeoutId = null;
        }, delay);
      },
    };
  }

  /**
   * Create logging middleware
   */
  static createLoggingMiddleware<T extends InteractionEvent>(
    name: string,
    logLevel: 'debug' | 'info' | 'warn' | 'error' = 'debug'
  ): EventMiddleware<T> {
    return {
      name,
      process: (event: T, next: (event: T) => void) => {
        console[logLevel](`[InteractionEvent] ${event.type}:`, event);
        next(event);
      },
    };
  }

  // === Built-in Filters ===

  /**
   * Create viewport bounds filter
   */
  static createViewportBoundsFilter(
    name: string,
    bounds: { minZoom: number; maxZoom: number; panBounds?: { minX: number; maxX: number; minY: number; maxY: number } }
  ): EventFilter<ViewportChangeEvent> {
    return {
      name,
      filter: (event: ViewportChangeEvent) => {
        const { zoom, pan } = event.viewport;

        // Check zoom bounds
        if (zoom < bounds.minZoom || zoom > bounds.maxZoom) {
          return false;
        }

        // Check pan bounds
        if (bounds.panBounds) {
          if (
            pan.x < bounds.panBounds.minX ||
            pan.x > bounds.panBounds.maxX ||
            pan.y < bounds.panBounds.minY ||
            pan.y > bounds.panBounds.maxY
          ) {
            return false;
          }
        }

        return true;
      },
    };
  }

  /**
   * Create frame rate filter
   */
  static createFrameRateFilter(
    name: string,
    minFrameRate: number
  ): EventFilter<PerformanceEvent> {
    return {
      name,
      filter: (event: PerformanceEvent) => event.frameRate >= minFrameRate,
    };
  }

  // === Internal Methods ===

  private processWithMiddleware<T extends InteractionEvent>(
    eventType: string,
    event: T,
    finalCallback: (event: T) => void
  ): void {
    const middlewares = this.middlewares.get(eventType) || [];

    if (middlewares.length === 0) {
      finalCallback(event);
      return;
    }

    let currentIndex = 0;

    const next = (processedEvent: T) => {
      if (currentIndex >= middlewares.length) {
        finalCallback(processedEvent);
        return;
      }

      const middleware = middlewares[currentIndex++];
      try {
        middleware.process(processedEvent, next);
      } catch (error) {
        console.error(`Middleware error in ${middleware.name}:`, error);
        next(processedEvent); // Continue with original event
      }
    };

    next(event);
  }

  private shouldBatchEvent<K extends keyof InteractionEventMap>(eventType: K): boolean {
    return (
      this.batchingConfig.enabled &&
      this.batchingConfig.batchableEvents.includes(eventType)
    );
  }

  private addToBatch(eventType: string, event: InteractionEvent): void {
    if (!this.eventBatches.has(eventType)) {
      this.eventBatches.set(eventType, []);
    }

    const batch = this.eventBatches.get(eventType)!;
    batch.push(event);

    // Start batch timer if not already running
    if (!this.batchTimers.has(eventType)) {
      const timerId = window.setTimeout(() => {
        this.flushBatch(eventType);
      }, this.batchingConfig.maxBatchTime);

      this.batchTimers.set(eventType, timerId);
    }

    // Flush if batch is full
    if (batch.length >= this.batchingConfig.batchSize) {
      this.flushBatch(eventType);
    }
  }

  private flushBatch(eventType: string): void {
    const batch = this.eventBatches.get(eventType);
    if (!batch || batch.length === 0) return;

    // Clear timer
    const timerId = this.batchTimers.get(eventType);
    if (timerId) {
      clearTimeout(timerId);
      this.batchTimers.delete(eventType);
    }

    // Emit batch
    this.emitBatch(eventType as keyof InteractionEventMap, batch);

    // Clear batch
    this.eventBatches.set(eventType, []);
  }

  private emitDirectly(eventType: string, event: InteractionEvent): void {
    this.trackEventPerformance(eventType);
    this.emit(eventType, event);
    this.emit('interaction:event', { eventType, event });
  }

  private notifyRenderer(
    renderer: IRenderer,
    eventType: keyof InteractionEventMap,
    _event: InteractionEvent
  ): void {
    try {
      // Renderer-specific event handling could be implemented here
      // For now, renderers listen to events directly
    } catch (error) {
      console.error(`Error notifying renderer for ${eventType}:`, error);
    }
  }

  private trackEventPerformance(eventType: string): void {
    // Update event count
    const currentCount = this.eventCounts.get(eventType) || 0;
    this.eventCounts.set(eventType, currentCount + 1);

    // Check performance periodically
    const now = Date.now();
    if (now - this.lastPerformanceCheck >= this.performanceCheckInterval) {
      this.checkPerformance();
      this.lastPerformanceCheck = now;
    }
  }

  private setupPerformanceMonitoring(): void {
    // Monitor frame rate and emit warnings
    let frameCount = 0;
    let lastTime = Date.now();

    const checkFrameRate = () => {
      frameCount++;
      const now = Date.now();

      if (now - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;

        // Emit performance event
        this.emitInteractionEvent('performance:frame', {
          type: 'performance:frame',
          frameRate: fps,
          renderTime: 0, // Could be measured
          activeAnimations: 0, // Could be tracked
          timestamp: now,
          cancelled: false,
        });

        // Emit warning if frame rate is low
        if (fps < 30) {
          this.emitInteractionEvent('performance:warning', {
            type: 'performance:warning',
            warning: 'low_framerate',
            severity: fps < 15 ? 'error' : 'warning',
            details: { fps, threshold: 30 },
            timestamp: now,
            cancelled: false,
          });
        }
      }

      requestAnimationFrame(checkFrameRate);
    };

    requestAnimationFrame(checkFrameRate);
  }

  private checkPerformance(): void {
    const totalEvents = Array.from(this.eventCounts.values()).reduce((sum, count) => sum + count, 0);

    // Emit warning if too many events per second
    if (totalEvents > 1000) { // Threshold: 1000 events/second
      this.emitInteractionEvent('performance:warning', {
        type: 'performance:warning',
        warning: 'high_memory',
        severity: 'warning',
        details: { eventsPerSecond: totalEvents, threshold: 1000 },
        timestamp: Date.now(),
        cancelled: false,
      });
    }
  }

  // === Cleanup ===

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Clear all batch timers
    this.batchTimers.forEach(timerId => clearTimeout(timerId));
    this.batchTimers.clear();

    // Clear batches
    this.eventBatches.clear();

    // Remove all listeners
    this.removeAllListeners();

    // Clear subscriptions
    this.rendererSubscriptions.clear();

    // Clear middleware and filters
    this.middlewares.clear();
    this.filters.clear();

    // Reset stats
    this.eventCounts.clear();
  }
}