/**
 * @fileoverview Unified Navigation Contract Interface
 * 
 * Defines the contract for consistent navigation behavior across all rendering
 * strategies. Ensures that zoom, pan, select, and highlight operations work
 * identically whether using Canvas, SVG, or WebGL rendering.
 * 
 * Key Requirements:
 * - 100ms response time for all operations
 * - State preservation across rendering strategy switches
 * - Single selection enforcement with automatic deselection
 * - Unified coordinate system handling
 * - Consistent event emission patterns
 */

import type { 
  Point2D, 
  Rectangle, 
  Node,
  NavigationState,
  InteractionEvent
} from '../../types';

/**
 * Interaction modes that determine navigation behavior
 */
export type InteractionMode = 'navigate' | 'select' | 'pan' | 'zoom' | 'highlight';

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitoringConfig {
  /** Enable response time tracking */
  trackResponseTimes: boolean;
  
  /** Maximum allowed response time (ms) */
  maxResponseTime: number;
  
  /** Sample size for rolling average */
  sampleSize: number;
  
  /** Enable performance warnings */
  enableWarnings: boolean;
}

/**
 * Navigation constraints and limits
 */
export interface NavigationConstraints {
  /** Minimum zoom level */
  minZoom: number;
  
  /** Maximum zoom level */
  maxZoom: number;
  
  /** Pan bounds (null = unlimited) */
  panBounds?: Rectangle;
  
  /** Enable smooth animations */
  enableAnimations: boolean;
  
  /** Animation duration (ms) */
  animationDuration: number;
}

/**
 * Unified navigation contract that all rendering strategies must implement
 */
export interface INavigationContract {
  
  // ===== CORE NAVIGATION OPERATIONS =====
  
  /**
   * Zoom the view by specified factor
   * @param factor Zoom factor (1.0 = no change, >1.0 = zoom in, <1.0 = zoom out)
   * @param center Optional zoom center point (defaults to view center)
   * @returns Promise that resolves when zoom is complete (must resolve within 100ms)
   */
  zoom(factor: number, center?: Point2D): Promise<void>;

  /**
   * Pan the view by specified offset
   * @param offset Pan offset in screen coordinates
   * @returns Promise that resolves when pan is complete (must resolve within 100ms)
   */
  pan(offset: Point2D): Promise<void>;

  /**
   * Select a single node (automatically deselects previous selection)
   * @param nodeId ID of node to select
   * @returns Promise that resolves when selection is complete (must resolve within 100ms)
   */
  selectNode(nodeId: string): Promise<void>;

  /**
   * Highlight neighbors of specified node
   * @param nodeId ID of node whose neighbors to highlight
   * @returns Promise that resolves when highlighting is complete (must resolve within 100ms)
   */
  highlightNeighbors(nodeId: string): Promise<void>;

  /**
   * Clear current node selection
   * @returns Promise that resolves when clear is complete (must resolve within 100ms)
   */
  clearSelection(): Promise<void>;

  /**
   * Clear all node highlighting
   * @returns Promise that resolves when clear is complete (must resolve within 100ms)
   */
  clearHighlight(): Promise<void>;

  // ===== NAVIGATION STATE MANAGEMENT =====

  /**
   * Get current navigation state
   * @returns Current navigation state (synchronous for performance)
   */
  getNavigationState(): NavigationState;

  /**
   * Set navigation state directly
   * @param state New navigation state
   * @returns Promise that resolves when state is applied (must resolve within 100ms)
   */
  setNavigationState(state: NavigationState): Promise<void>;

  /**
   * Reset view to default state
   * @returns Promise that resolves when reset is complete (must resolve within 100ms)
   */
  resetView(): Promise<void>;

  /**
   * Fit view to show all nodes
   * @param padding Optional padding around nodes
   * @returns Promise that resolves when fit is complete (must resolve within 100ms)
   */
  fitToNodes(padding?: number): Promise<void>;

  // ===== COORDINATE SYSTEM OPERATIONS =====

  /**
   * Convert screen coordinates to graph coordinates
   * @param screenPoint Screen coordinates
   * @returns Graph coordinates
   */
  screenToGraph(screenPoint: Point2D): Point2D;

  /**
   * Convert graph coordinates to screen coordinates  
   * @param graphPoint Graph coordinates
   * @returns Screen coordinates
   */
  graphToScreen(graphPoint: Point2D): Point2D;

  /**
   * Get visible area bounds in graph coordinates
   * @returns Visible area rectangle
   */
  getVisibleBounds(): Rectangle;

  // ===== INTERACTION CONSTRAINTS =====

  /**
   * Set navigation constraints and limits
   * @param constraints Navigation constraints
   */
  setConstraints(constraints: NavigationConstraints): void;

  /**
   * Get current navigation constraints
   * @returns Current constraints
   */
  getConstraints(): NavigationConstraints;

  /**
   * Check if operation is within constraints
   * @param operation Operation type
   * @param parameters Operation parameters
   * @returns True if operation is allowed
   */
  isOperationAllowed(operation: string, parameters: any): boolean;

  // ===== PERFORMANCE MONITORING =====

  /**
   * Get last operation response time
   * @returns Response time in milliseconds
   */
  getResponseTime(): number;

  /**
   * Get average response time over recent operations
   * @returns Average response time in milliseconds
   */
  getAverageResponseTime(): number;

  /**
   * Enable or disable performance monitoring
   * @param enabled Whether to enable monitoring
   */
  enablePerformanceMonitoring(enabled: boolean): void;

  /**
   * Configure performance monitoring settings
   * @param config Performance monitoring configuration
   */
  configurePerformanceMonitoring(config: PerformanceMonitoringConfig): void;

  // ===== EVENT SYSTEM =====

  /**
   * Register event handler
   * @param event Event name
   * @param handler Event handler function
   */
  on(event: string, handler: (data: any) => void): void;

  /**
   * Unregister event handler
   * @param event Event name
   * @param handler Event handler function to remove
   */
  off(event: string, handler: (data: any) => void): void;

  /**
   * Emit event to all registered handlers
   * @param event Event name
   * @param data Event data
   */
  emit(event: string, data: any): void;

  /**
   * Get list of supported events
   * @returns Array of supported event names
   */
  getSupportedEvents(): string[];

  // ===== ADVANCED NAVIGATION FEATURES =====

  /**
   * Animate smooth transition to target state
   * @param targetState Target navigation state
   * @param duration Animation duration (ms)
   * @returns Promise that resolves when animation is complete
   */
  animateToState(targetState: Partial<NavigationState>, duration?: number): Promise<void>;

  /**
   * Focus on specific node with smooth animation
   * @param nodeId Node to focus on
   * @param zoomLevel Target zoom level
   * @returns Promise that resolves when focus is complete
   */
  focusNode(nodeId: string, zoomLevel?: number): Promise<void>;

  /**
   * Get nodes currently visible in viewport
   * @returns Array of visible node IDs
   */
  getVisibleNodes(): string[];

  /**
   * Check if specific node is currently visible
   * @param nodeId Node ID to check
   * @returns True if node is in viewport
   */
  isNodeVisible(nodeId: string): boolean;

  // ===== CLEANUP AND LIFECYCLE =====

  /**
   * Clean up resources and event listeners
   */
  cleanup(): void;

  /**
   * Initialize navigation contract with rendering context
   * @param renderingContext Context from current rendering strategy
   */
  initialize(renderingContext: any): void;
}

/**
 * Standard navigation events that all implementations should support
 */
export const NavigationEvents = {
  // Zoom events
  ZOOM_START: 'zoom:start',
  ZOOM_UPDATE: 'zoom:update', 
  ZOOM_END: 'zoom:end',
  
  // Pan events
  PAN_START: 'pan:start',
  PAN_UPDATE: 'pan:update',
  PAN_END: 'pan:end',
  
  // Selection events
  NODE_SELECTED: 'node:selected',
  NODE_DESELECTED: 'node:deselected',
  SELECTION_CLEARED: 'selection:cleared',
  
  // Highlight events
  NEIGHBORS_HIGHLIGHTED: 'neighbors:highlighted',
  HIGHLIGHT_CLEARED: 'highlight:cleared',
  
  // State events
  STATE_CHANGED: 'state:changed',
  VIEW_RESET: 'view:reset',
  
  // Performance events
  RESPONSE_TIME_WARNING: 'performance:response-time-warning',
  PERFORMANCE_DEGRADATION: 'performance:degradation'
} as const;

/**
 * Navigation event data structures
 */
export interface NavigationEventData {
  timestamp: number;
  interactionMode: InteractionMode;
  responseTime?: number;
  previousState?: NavigationState;
  currentState: NavigationState;
}

export interface ZoomEventData extends NavigationEventData {
  factor: number;
  center?: Point2D;
  finalZoomLevel: number;
}

export interface PanEventData extends NavigationEventData {
  offset: Point2D;
  finalPanOffset: Point2D;
}

export interface SelectionEventData extends NavigationEventData {
  nodeId?: string;
  previousSelection?: string;
}

export interface HighlightEventData extends NavigationEventData {
  nodeId?: string;
  highlightedNodes: Set<string>;
}

/**
 * Factory function type for creating navigation contracts
 */
export type NavigationContractFactory = (
  renderingStrategy: string,
  constraints?: NavigationConstraints,
  performanceConfig?: PerformanceMonitoringConfig
) => INavigationContract;

/**
 * Default navigation constraints
 */
export const DefaultNavigationConstraints: NavigationConstraints = {
  minZoom: 0.1,
  maxZoom: 10.0,
  panBounds: undefined, // Unlimited panning
  enableAnimations: true,
  animationDuration: 250
};

/**
 * Default performance monitoring configuration
 */
export const DefaultPerformanceConfig: PerformanceMonitoringConfig = {
  trackResponseTimes: true,
  maxResponseTime: 100, // US4 requirement
  sampleSize: 10,
  enableWarnings: true
};