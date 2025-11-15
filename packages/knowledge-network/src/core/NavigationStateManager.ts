/**
 * Navigation State Manager
 * 
 * Manages consistent interaction patterns (zoom, pan, select, highlight) across 
 * all rendering strategies with 100ms response time requirement. Ensures that
 * user interactions work identically whether using Canvas, SVG, or WebGL rendering.
 * 
 * Task: T028 [US2] - Implement NavigationStateManager for consistent interaction across strategies
 * 
 * Key Integration Points:
 * - Extends existing interaction patterns from archived system
 * - Provides unified interaction contract across all rendering strategies
 * - Maintains NavigationState entity from data model
 * - Ensures 100ms response time requirement compliance
 */

import type { InteractionEvent } from '../../rendering/rendering-strategy';

/**
 * Point in 2D space
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Rectangle bounds
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Interaction mode enumeration
 */
export type InteractionMode = 'navigate' | 'select' | 'pan' | 'zoom' | 'edit';

/**
 * Navigation state as defined in data model
 */
export interface NavigationState {
  /** Current zoom factor (0.1 to 10.0 range) */
  zoomLevel: number;
  
  /** Current pan offset from center position */
  panOffset: Point2D;
  
  /** ID of currently selected node (single selection only) */
  selectedNodeId?: string;
  
  /** Set of nodes highlighted via neighbor highlighting */
  highlightedNodeIds: Set<string>;
  
  /** Current interaction state */
  interactionMode: InteractionMode;
  
  /** Current visible area bounds */
  viewBounds: Rectangle;
  
  /** Timestamp of last user interaction for responsiveness tracking */
  lastInteractionTimestamp: number;
}

/**
 * Configuration for navigation state manager
 */
export interface NavigationStateManagerConfig {
  /** Zoom limits */
  zoomLimits: {
    min: number;
    max: number;
    step: number;
  };
  
  /** Pan constraints */
  panConstraints: {
    enabled: boolean;
    bounds?: Rectangle;
  };
  
  /** Selection behavior */
  selection: {
    enableSingleSelection: boolean;
    enableMultiSelection: boolean;
    autoDeselectOnEmpty: boolean;
  };
  
  /** Highlight behavior */
  highlighting: {
    enableNeighborHighlighting: boolean;
    maxHighlightedNodes: number;
    highlightTimeout: number; // ms
  };
  
  /** Performance requirements */
  performance: {
    maxResponseTime: number; // 100ms requirement
    enableDebouncing: boolean;
    debounceDelay: number;
  };
}

/**
 * Navigation event data
 */
export interface NavigationEvent {
  type: 'zoom' | 'pan' | 'select' | 'highlight' | 'mode-change';
  previousState: NavigationState;
  newState: NavigationState;
  timestamp: number;
  responseTime: number; // ms
}

/**
 * Navigation State Manager
 * 
 * Provides consistent interaction patterns across all rendering strategies.
 * Maintains user interaction state and ensures 100ms response time compliance.
 */
export class NavigationStateManager {
  private state: NavigationState;
  private config: NavigationStateManagerConfig;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private pendingOperations: Map<string, NodeJS.Timeout> = new Map();
  private performanceMonitor: {
    interactions: Array<{ timestamp: number; responseTime: number }>;
  } = { interactions: [] };

  constructor(config?: Partial<NavigationStateManagerConfig>) {
    this.config = {
      zoomLimits: {
        min: 0.1,
        max: 10.0,
        step: 0.1
      },
      panConstraints: {
        enabled: true,
        bounds: undefined // No bounds by default
      },
      selection: {
        enableSingleSelection: true,
        enableMultiSelection: false, // FR-007 specifies single selection
        autoDeselectOnEmpty: true
      },
      highlighting: {
        enableNeighborHighlighting: true,
        maxHighlightedNodes: 50,
        highlightTimeout: 2000 // 2 seconds
      },
      performance: {
        maxResponseTime: 100, // 100ms requirement
        enableDebouncing: true,
        debounceDelay: 16 // ~60fps
      },
      ...config
    };

    // Initialize default navigation state
    this.state = {
      zoomLevel: 1.0,
      panOffset: { x: 0, y: 0 },
      selectedNodeId: undefined,
      highlightedNodeIds: new Set<string>(),
      interactionMode: 'navigate',
      viewBounds: { x: 0, y: 0, width: 800, height: 600 },
      lastInteractionTimestamp: Date.now()
    };

    this.initializeEventSystem();
  }

  /**
   * Get current navigation state (immutable copy)
   */
  public getState(): Readonly<NavigationState> {
    return {
      ...this.state,
      highlightedNodeIds: new Set(this.state.highlightedNodeIds)
    };
  }

  /**
   * Handle zoom interaction
   */
  public handleZoom(newZoomLevel: number, centerPoint?: Point2D): boolean {
    const startTime = performance.now();
    
    // Validate zoom level
    const clampedZoom = Math.max(
      this.config.zoomLimits.min,
      Math.min(this.config.zoomLimits.max, newZoomLevel)
    );

    if (clampedZoom === this.state.zoomLevel) {
      return false; // No change needed
    }

    const previousState = { ...this.state };
    this.state.zoomLevel = clampedZoom;
    this.state.lastInteractionTimestamp = Date.now();

    // Update view bounds based on zoom
    this.updateViewBoundsInternal();

    const responseTime = performance.now() - startTime;
    this.recordPerformanceMetric(responseTime);

    this.emitNavigationEvent('zoom', previousState, responseTime);
    return true;
  }

  /**
   * Handle pan interaction
   */
  public handlePan(deltaX: number, deltaY: number): boolean {
    const startTime = performance.now();

    const newPanOffset = {
      x: this.state.panOffset.x + deltaX,
      y: this.state.panOffset.y + deltaY
    };

    // Apply pan constraints if enabled
    if (this.config.panConstraints.enabled && this.config.panConstraints.bounds) {
      const bounds = this.config.panConstraints.bounds;
      newPanOffset.x = Math.max(bounds.x, Math.min(bounds.x + bounds.width, newPanOffset.x));
      newPanOffset.y = Math.max(bounds.y, Math.min(bounds.y + bounds.height, newPanOffset.y));
    }

    if (newPanOffset.x === this.state.panOffset.x && newPanOffset.y === this.state.panOffset.y) {
      return false; // No change needed
    }

    const previousState = { ...this.state };
    this.state.panOffset = newPanOffset;
    this.state.lastInteractionTimestamp = Date.now();

    // Update view bounds based on pan
    this.updateViewBoundsInternal();

    const responseTime = performance.now() - startTime;
    this.recordPerformanceMetric(responseTime);

    this.emitNavigationEvent('pan', previousState, responseTime);
    return true;
  }

  /**
   * Handle node selection (single selection per FR-007)
   */
  public handleSelection(nodeId: string): boolean {
    const startTime = performance.now();

    // Single selection enforcement
    if (this.state.selectedNodeId === nodeId) {
      return false; // Already selected
    }

    const previousState = { ...this.state };
    
    // Clear previous selection (single selection only)
    this.state.selectedNodeId = nodeId;
    this.state.lastInteractionTimestamp = Date.now();

    const responseTime = performance.now() - startTime;
    this.recordPerformanceMetric(responseTime);

    this.emitNavigationEvent('select', previousState, responseTime);
    return true;
  }

  /**
   * Clear current selection
   */
  public clearSelection(): boolean {
    if (!this.state.selectedNodeId) {
      return false; // Nothing to clear
    }

    const previousState = { ...this.state };
    this.state.selectedNodeId = undefined;
    this.state.lastInteractionTimestamp = Date.now();

    this.emitNavigationEvent('select', previousState, 0);
    return true;
  }

  /**
   * Handle neighbor highlighting
   */
  public handleNeighborHighlighting(nodeId: string, neighborIds: string[]): boolean {
    if (!this.config.highlighting.enableNeighborHighlighting) {
      return false;
    }

    const startTime = performance.now();
    const previousState = { ...this.state };

    // Clear previous highlights
    this.state.highlightedNodeIds.clear();

    // Add new highlights (respect max limit)
    const nodesToHighlight = [nodeId, ...neighborIds].slice(0, this.config.highlighting.maxHighlightedNodes);
    nodesToHighlight.forEach(id => this.state.highlightedNodeIds.add(id));
    
    this.state.lastInteractionTimestamp = Date.now();

    const responseTime = performance.now() - startTime;
    this.recordPerformanceMetric(responseTime);

    this.emitNavigationEvent('highlight', previousState, responseTime);

    // Set timeout to clear highlights if configured
    if (this.config.highlighting.highlightTimeout > 0) {
      this.scheduleHighlightClear();
    }

    return true;
  }

  /**
   * Clear all highlights
   */
  public clearHighlights(): boolean {
    if (this.state.highlightedNodeIds.size === 0) {
      return false; // Nothing to clear
    }

    const previousState = { ...this.state };
    this.state.highlightedNodeIds.clear();
    this.state.lastInteractionTimestamp = Date.now();

    this.emitNavigationEvent('highlight', previousState, 0);
    return true;
  }

  /**
   * Change interaction mode
   */
  public setInteractionMode(mode: InteractionMode): boolean {
    if (this.state.interactionMode === mode) {
      return false; // No change needed
    }

    const previousState = { ...this.state };
    this.state.interactionMode = mode;
    this.state.lastInteractionTimestamp = Date.now();

    this.emitNavigationEvent('mode-change', previousState, 0);
    return true;
  }

  /**
   * Update view bounds (typically called by rendering strategies)
   */
  public updateViewBounds(bounds: Rectangle): void {
    this.state.viewBounds = { ...bounds };
    this.updateViewBoundsInternal();
  }

  /**
   * Check if response time requirement is being met
   */
  public isPerformanceCompliant(): boolean {
    const recentInteractions = this.performanceMonitor.interactions
      .filter(i => Date.now() - i.timestamp < 5000) // Last 5 seconds
      .slice(-10); // Last 10 interactions

    if (recentInteractions.length === 0) return true;

    const averageResponseTime = recentInteractions.reduce((sum, i) => sum + i.responseTime, 0) / recentInteractions.length;
    return averageResponseTime <= this.config.performance.maxResponseTime;
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): {
    averageResponseTime: number;
    maxResponseTime: number;
    interactionCount: number;
  } {
    const recentInteractions = this.performanceMonitor.interactions
      .filter(i => Date.now() - i.timestamp < 10000); // Last 10 seconds

    if (recentInteractions.length === 0) {
      return { averageResponseTime: 0, maxResponseTime: 0, interactionCount: 0 };
    }

    const responseTimes = recentInteractions.map(i => i.responseTime);
    return {
      averageResponseTime: responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length,
      maxResponseTime: Math.max(...responseTimes),
      interactionCount: recentInteractions.length
    };
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
    this.eventListeners.set('navigation-changed', new Set());
    this.eventListeners.set('performance-warning', new Set());
    this.eventListeners.set('state-restored', new Set());
  }

  /**
   * Emit navigation event
   */
  private emitNavigationEvent(type: NavigationEvent['type'], previousState: NavigationState, responseTime: number): void {
    const event: NavigationEvent = {
      type,
      previousState,
      newState: this.getState(),
      timestamp: Date.now(),
      responseTime
    };

    this.eventListeners.get('navigation-changed')?.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in navigation event listener:`, error);
      }
    });

    // Check for performance warnings
    if (responseTime > this.config.performance.maxResponseTime) {
      this.eventListeners.get('performance-warning')?.forEach(listener => {
        try {
          listener({ responseTime, maxAllowed: this.config.performance.maxResponseTime, type });
        } catch (error) {
          console.error(`Error in performance warning listener:`, error);
        }
      });
    }
  }

  /**
   * Record performance metric
   */
  private recordPerformanceMetric(responseTime: number): void {
    this.performanceMonitor.interactions.push({
      timestamp: Date.now(),
      responseTime
    });

    // Keep only recent metrics (last 100 interactions)
    if (this.performanceMonitor.interactions.length > 100) {
      this.performanceMonitor.interactions = this.performanceMonitor.interactions.slice(-100);
    }
  }

  /**
   * Update view bounds based on current state
   */
  private updateViewBoundsInternal(): void {
    // Calculate visible area based on zoom and pan
    const baseWidth = this.state.viewBounds.width / this.state.zoomLevel;
    const baseHeight = this.state.viewBounds.height / this.state.zoomLevel;
    
    this.state.viewBounds = {
      x: -this.state.panOffset.x / this.state.zoomLevel,
      y: -this.state.panOffset.y / this.state.zoomLevel,
      width: baseWidth,
      height: baseHeight
    };
  }

  /**
   * Schedule highlight clearing
   */
  private scheduleHighlightClear(): void {
    // Clear any existing timeout
    const existingTimeout = this.pendingOperations.get('highlight-clear');
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule new timeout
    const timeout = setTimeout(() => {
      this.clearHighlights();
      this.pendingOperations.delete('highlight-clear');
    }, this.config.highlighting.highlightTimeout);

    this.pendingOperations.set('highlight-clear', timeout);
  }
}

/**
 * Factory function for creating NavigationStateManager instances
 */
export function createNavigationStateManager(
  config?: Partial<NavigationStateManagerConfig>
): NavigationStateManager {
  return new NavigationStateManager(config);
}

/**
 * Create navigation state manager with performance optimization
 */
export function createOptimizedNavigationStateManager(): NavigationStateManager {
  return new NavigationStateManager({
    performance: {
      maxResponseTime: 100, // Strict 100ms requirement
      enableDebouncing: true,
      debounceDelay: 8 // ~120fps for ultra-smooth interactions
    },
    highlighting: {
      enableNeighborHighlighting: true,
      maxHighlightedNodes: 20, // Reduced for better performance
      highlightTimeout: 1500 // Shorter timeout
    }
  });
}