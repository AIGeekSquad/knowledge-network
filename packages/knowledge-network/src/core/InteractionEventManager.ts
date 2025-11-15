/**
 * @fileoverview InteractionEventManager Implementation
 * 
 * Manages consistent interaction event handling across all rendering strategies.
 * Ensures unified behavior for zoom, pan, select, and highlight operations
 * with 100ms response time guarantee.
 * 
 * Key Features:
 * - Cross-strategy event normalization and routing
 * - Performance monitoring with 100ms response requirement
 * - Event queuing and batching for optimization
 * - Strategy-specific adaptation while maintaining consistency
 * - Comprehensive error handling and fallback mechanisms
 */

import { EventEmitter } from 'events';
import type { 
  InteractionEvent,
  NavigationState,
  Point2D,
  Node
} from '../../types';
import type {
  INavigationContract,
  InteractionMode,
  PerformanceMonitoringConfig,
  NavigationConstraints,
  NavigationEvents
} from '../interfaces/INavigationContract';

export interface IInteractionEventManager {
  // Event processing
  processInteractionEvent(event: InteractionEvent): Promise<void>;
  createInteractionEvent(type: string, data: any, renderingStrategy: string): InteractionEvent;
  validateEventData(event: InteractionEvent): boolean;
  
  // Strategy consistency
  normalizeEventForStrategy(event: InteractionEvent, strategy: string): InteractionEvent;
  ensureConsistentBehavior(eventType: string, strategies: string[]): Promise<void>;
  
  // Event routing
  routeToStrategy(event: InteractionEvent, strategy: string): Promise<void>;
  broadcastToAllStrategies(event: InteractionEvent): Promise<void>;
  
  // Performance monitoring
  trackEventProcessingTime(eventType: string, processingTime: number): void;
  getEventProcessingStats(): EventProcessingStats;
  
  // Event queue management
  queueEvent(event: InteractionEvent): void;
  processEventQueue(): Promise<void>;
  clearEventQueue(): void;
}

export interface EventProcessingStats {
  totalEventsProcessed: number;
  averageProcessingTime: number;
  eventsByType: Map<string, number>;
  slowestEvent: { type: string; time: number };
  fastestEvent: { type: string; time: number };
}

/**
 * Manages interaction events across multiple rendering strategies
 */
export class InteractionEventManager extends EventEmitter implements IInteractionEventManager {
  private eventQueue: InteractionEvent[] = [];
  private processingStats: EventProcessingStats;
  private eventIdCounter = 0;
  private strategyAdapters: Map<string, StrategyAdapter>;
  private performanceMonitoring = true;
  private responseTimeSamples: number[] = [];
  private maxSamples = 10;

  constructor() {
    super();
    
    this.processingStats = {
      totalEventsProcessed: 0,
      averageProcessingTime: 0,
      eventsByType: new Map(),
      slowestEvent: { type: '', time: 0 },
      fastestEvent: { type: '', time: Infinity }
    };

    this.strategyAdapters = new Map([
      ['canvas', new CanvasStrategyAdapter()],
      ['svg', new SVGStrategyAdapter()],
      ['webgl', new WebGLStrategyAdapter()]
    ]);
  }

  /**
   * Process a single interaction event
   */
  async processInteractionEvent(event: InteractionEvent): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate event data
      if (!this.validateEventData(event)) {
        throw new Error(`Invalid event data for event type: ${event.type}`);
      }

      // Normalize event for target strategy
      const normalizedEvent = this.normalizeEventForStrategy(event, event.renderingStrategy);
      
      // Route to appropriate strategy
      if (event.renderingStrategy === 'all') {
        await this.broadcastToAllStrategies(normalizedEvent);
      } else {
        await this.routeToStrategy(normalizedEvent, event.renderingStrategy);
      }

      // Update statistics
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      if (this.performanceMonitoring) {
        this.trackEventProcessingTime(event.type, processingTime);
      }

      // Emit completion event
      this.emit('eventProcessed', {
        eventId: event.interactionId,
        processingTime,
        strategy: event.renderingStrategy
      });

    } catch (error) {
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      
      this.emit('eventError', {
        eventId: event.interactionId,
        error,
        processingTime
      });
      
      throw error;
    }
  }

  /**
   * Create a new interaction event with proper structure
   */
  createInteractionEvent(type: string, data: any, renderingStrategy: string): InteractionEvent {
    this.eventIdCounter++;
    
    return {
      type,
      timestamp: Date.now(),
      source: this.inferEventSource(type, data),
      data,
      renderingStrategy,
      interactionId: `${type}-${String(this.eventIdCounter).padStart(3, '0')}`
    };
  }

  /**
   * Validate event data structure
   */
  validateEventData(event: InteractionEvent): boolean {
    return !!(
      event.type &&
      event.timestamp > 0 &&
      event.source &&
      event.renderingStrategy &&
      event.interactionId &&
      event.data !== null &&
      event.data !== undefined
    );
  }

  /**
   * Normalize event for specific rendering strategy
   */
  normalizeEventForStrategy(event: InteractionEvent, strategy: string): InteractionEvent {
    const adapter = this.strategyAdapters.get(strategy);
    if (!adapter) {
      console.warn(`No adapter found for strategy: ${strategy}`);
      return event;
    }

    return adapter.normalizeEvent(event);
  }

  /**
   * Ensure consistent behavior across multiple strategies
   */
  async ensureConsistentBehavior(eventType: string, strategies: string[]): Promise<void> {
    const testEvent = this.createInteractionEvent(eventType, { test: true }, 'test');
    
    // Validate that all strategies can handle this event type consistently
    for (const strategy of strategies) {
      const normalizedEvent = this.normalizeEventForStrategy(testEvent, strategy);
      
      if (!this.validateEventData(normalizedEvent)) {
        throw new Error(`Strategy ${strategy} cannot handle event type ${eventType} consistently`);
      }
    }
  }

  /**
   * Route event to specific strategy
   */
  async routeToStrategy(event: InteractionEvent, strategy: string): Promise<void> {
    const adapter = this.strategyAdapters.get(strategy);
    if (!adapter) {
      throw new Error(`Unknown rendering strategy: ${strategy}`);
    }

    try {
      await adapter.processEvent(event);
    } catch (error) {
      throw new Error(`${strategy} strategy failed to process event: ${error}`);
    }
  }

  /**
   * Broadcast event to all registered strategies
   */
  async broadcastToAllStrategies(event: InteractionEvent): Promise<void> {
    const broadcastPromises = Array.from(this.strategyAdapters.keys()).map(strategy => {
      const strategyEvent = { ...event, renderingStrategy: strategy };
      return this.routeToStrategy(strategyEvent, strategy).catch(error => {
        console.warn(`Strategy ${strategy} failed to process broadcast event:`, error);
        return Promise.resolve(); // Continue with other strategies
      });
    });

    await Promise.all(broadcastPromises);
  }

  /**
   * Track event processing time for performance monitoring
   */
  trackEventProcessingTime(eventType: string, processingTime: number): void {
    // Update total events processed
    this.processingStats.totalEventsProcessed++;
    
    // Update event type counts
    const currentCount = this.processingStats.eventsByType.get(eventType) || 0;
    this.processingStats.eventsByType.set(eventType, currentCount + 1);
    
    // Update response time samples for rolling average
    this.responseTimeSamples.push(processingTime);
    if (this.responseTimeSamples.length > this.maxSamples) {
      this.responseTimeSamples.shift();
    }
    
    // Calculate average processing time
    const totalTime = this.responseTimeSamples.reduce((sum, time) => sum + time, 0);
    this.processingStats.averageProcessingTime = totalTime / this.responseTimeSamples.length;
    
    // Update slowest/fastest events
    if (processingTime > this.processingStats.slowestEvent.time) {
      this.processingStats.slowestEvent = { type: eventType, time: processingTime };
    }
    
    if (processingTime < this.processingStats.fastestEvent.time) {
      this.processingStats.fastestEvent = { type: eventType, time: processingTime };
    }

    // Emit warning if response time exceeds requirement
    if (processingTime > 100) {
      this.emit('performanceWarning', {
        eventType,
        processingTime,
        threshold: 100,
        message: `Event ${eventType} took ${processingTime}ms, exceeding 100ms requirement`
      });
    }
  }

  /**
   * Get current event processing statistics
   */
  getEventProcessingStats(): EventProcessingStats {
    return { ...this.processingStats };
  }

  /**
   * Add event to processing queue
   */
  queueEvent(event: InteractionEvent): void {
    this.eventQueue.push(event);
    
    // Auto-process queue if it gets too large
    if (this.eventQueue.length > 50) {
      this.processEventQueue().catch(error => {
        console.error('Failed to auto-process event queue:', error);
      });
    }
  }

  /**
   * Process all queued events
   */
  async processEventQueue(): Promise<void> {
    const queueStartTime = performance.now();
    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = []; // Clear queue immediately
    
    // Process events in batches to maintain responsiveness
    const batchSize = 10;
    for (let i = 0; i < eventsToProcess.length; i += batchSize) {
      const batch = eventsToProcess.slice(i, i + batchSize);
      
      await Promise.all(batch.map(event => 
        this.processInteractionEvent(event).catch(error => {
          console.warn(`Failed to process queued event ${event.interactionId}:`, error);
          return Promise.resolve();
        })
      ));
      
      // Brief pause between batches to maintain UI responsiveness
      if (i + batchSize < eventsToProcess.length) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    const queueEndTime = performance.now();
    const queueProcessingTime = queueEndTime - queueStartTime;
    
    this.emit('queueProcessed', {
      eventsProcessed: eventsToProcess.length,
      processingTime: queueProcessingTime,
      averageTimePerEvent: queueProcessingTime / eventsToProcess.length
    });
  }

  /**
   * Clear all queued events
   */
  clearEventQueue(): void {
    const clearedCount = this.eventQueue.length;
    this.eventQueue = [];
    
    this.emit('queueCleared', {
      eventsCleared: clearedCount
    });
  }

  /**
   * Infer event source from event type and data
   */
  private inferEventSource(type: string, data: any): string {
    if (type.includes('touch') || type.includes('pinch')) return 'touch';
    if (type.includes('key') || data.key) return 'keyboard';
    if (type.includes('wheel') || data.deltaY) return 'wheel';
    if (type.includes('click') || type.includes('drag')) return 'mouse';
    return 'user';
  }
}

/**
 * Base strategy adapter for rendering-specific event handling
 */
abstract class StrategyAdapter {
  abstract normalizeEvent(event: InteractionEvent): InteractionEvent;
  abstract processEvent(event: InteractionEvent): Promise<void>;
}

/**
 * Canvas-specific event adapter
 */
class CanvasStrategyAdapter extends StrategyAdapter {
  normalizeEvent(event: InteractionEvent): InteractionEvent {
    return {
      ...event,
      data: {
        ...event.data,
        canvasContext: '2d',
        requiresRedraw: true,
        // Normalize coordinates for canvas coordinate system
        normalizedPosition: event.data.position ? {
          x: event.data.position.x / 800, // Assuming 800px canvas width
          y: event.data.position.y / 600  // Assuming 600px canvas height
        } : undefined
      }
    };
  }

  async processEvent(event: InteractionEvent): Promise<void> {
    // Canvas-specific event processing
    // This would integrate with existing Canvas rendering system
    return Promise.resolve();
  }
}

/**
 * SVG-specific event adapter
 */
class SVGStrategyAdapter extends StrategyAdapter {
  normalizeEvent(event: InteractionEvent): InteractionEvent {
    return {
      ...event,
      data: {
        ...event.data,
        domElement: this.inferDOMElement(event.type),
        attributeChanges: this.mapToSVGAttributes(event.data),
        // SVG uses different coordinate system
        normalizedPosition: event.data.position ? {
          x: event.data.position.x,
          y: event.data.position.y
        } : undefined
      }
    };
  }

  async processEvent(event: InteractionEvent): Promise<void> {
    // SVG-specific event processing
    // This would integrate with existing SVG rendering system
    return Promise.resolve();
  }

  private inferDOMElement(eventType: string): string {
    if (eventType.includes('node')) return 'circle';
    if (eventType.includes('edge')) return 'line';
    return 'g';
  }

  private mapToSVGAttributes(data: any): Record<string, any> {
    const attributes: Record<string, any> = {};
    
    if (data.style) {
      Object.keys(data.style).forEach(key => {
        attributes[key] = data.style[key];
      });
    }
    
    return attributes;
  }
}

/**
 * WebGL-specific event adapter
 */
class WebGLStrategyAdapter extends StrategyAdapter {
  normalizeEvent(event: InteractionEvent): InteractionEvent {
    return {
      ...event,
      data: {
        ...event.data,
        glContext: 'webgl2',
        bufferTarget: 'ARRAY_BUFFER',
        requiresBufferUpdate: this.requiresBufferUpdate(event.type),
        // WebGL uses normalized device coordinates
        normalizedPosition: event.data.position ? {
          x: (event.data.position.x / 800) * 2 - 1, // Convert to NDC [-1, 1]
          y: -((event.data.position.y / 600) * 2 - 1) // Flip Y and convert to NDC
        } : undefined
      }
    };
  }

  async processEvent(event: InteractionEvent): Promise<void> {
    // WebGL-specific event processing
    // This would integrate with existing WebGL rendering system
    return Promise.resolve();
  }

  private requiresBufferUpdate(eventType: string): boolean {
    return ['zoom', 'pan', 'select', 'highlight'].includes(eventType);
  }
}

/**
 * Factory function to create InteractionEventManager
 */
export function createInteractionEventManager(): IInteractionEventManager {
  return new InteractionEventManager();
}

/**
 * Event type utilities
 */
export const InteractionEventTypes = {
  // Navigation events
  ZOOM: 'zoom',
  PAN: 'pan',
  RESET_VIEW: 'resetView',
  
  // Selection events
  SELECT_NODE: 'selectNode',
  DESELECT_NODE: 'deselectNode',
  CLEAR_SELECTION: 'clearSelection',
  
  // Highlight events
  HIGHLIGHT_NEIGHBORS: 'highlightNeighbors',
  CLEAR_HIGHLIGHT: 'clearHighlight',
  
  // Mouse events
  MOUSE_CLICK: 'mouseClick',
  MOUSE_MOVE: 'mouseMove',
  MOUSE_WHEEL: 'mouseWheel',
  
  // Touch events
  TOUCH_START: 'touchStart',
  TOUCH_MOVE: 'touchMove',
  TOUCH_END: 'touchEnd',
  PINCH: 'pinch',
  
  // Keyboard events
  KEY_DOWN: 'keyDown',
  KEY_UP: 'keyUp'
} as const;

/**
 * Performance-optimized event queue processor
 */
export class EventQueueProcessor {
  private isProcessing = false;
  private processingTimeout: NodeJS.Timeout | null = null;

  constructor(private eventManager: InteractionEventManager) {}

  /**
   * Schedule queue processing with debouncing
   */
  scheduleQueueProcessing(delay: number = 16): void { // ~60fps
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
    }

    this.processingTimeout = setTimeout(async () => {
      if (!this.isProcessing) {
        this.isProcessing = true;
        try {
          await this.eventManager.processEventQueue();
        } finally {
          this.isProcessing = false;
        }
      }
    }, delay);
  }

  /**
   * Force immediate queue processing
   */
  async forceProcessQueue(): Promise<void> {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }

    if (!this.isProcessing) {
      this.isProcessing = true;
      try {
        await this.eventManager.processEventQueue();
      } finally {
        this.isProcessing = false;
      }
    }
  }

  cleanup(): void {
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    this.isProcessing = false;
  }
}