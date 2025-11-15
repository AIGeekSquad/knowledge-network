/**
 * Navigation Contract
 * 
 * Defines unified navigation and interaction interfaces that work consistently across
 * all rendering strategies and layout configurations. Ensures predictable user experience
 * with 100ms response time requirement and single-selection behavior.
 * 
 * Key Integration Points:
 * - Consistent behavior across Canvas, SVG, and WebGL rendering strategies
 * - Single selection with automatic deselection (per clarifications)
 * - Navigation state preservation across rendering strategy changes
 * - Async interaction handling for smooth user experience
 * - Integration with viewport management and zoom controls
 */

import { Point2D, Rectangle } from './rendering-strategy';

// Core Navigation Contract Interface
export interface INavigationContract {
  /**
   * Handle user interaction event
   * @param event Interaction event to process
   * @returns Promise resolving to whether event was handled
   */
  handleInteractionAsync(event: InteractionEvent): Promise<boolean>;
  
  /**
   * Update navigation state
   * @param updates Partial state updates to apply
   */
  updateStateAsync(updates: Partial<NavigationState>): Promise<void>;
  
  /**
   * Get current navigation state
   * @returns Current state snapshot
   */
  getState(): NavigationState;
  
  /**
   * Set navigation constraints
   * @param constraints Navigation limits and boundaries
   */
  setConstraints(constraints: NavigationConstraints): void;
  
  /**
   * Reset navigation to initial state
   * @param animate Whether to animate the reset
   */
  resetAsync(animate: boolean): Promise<void>;
  
  /**
   * Enable or disable specific interaction types
   * @param interactions Map of interaction types to enabled state
   */
  configureInteractions(interactions: Map<InteractionType, boolean>): void;
}

// Navigation State (Enhanced from rendering-strategy)
export interface NavigationState {
  /** Current zoom level (0.1 to 10.0 range by default) */
  zoomLevel: number;
  
  /** Pan offset from center position */
  panOffset: Point2D;
  
  /** Currently selected node ID (single selection only) */
  selectedNodeId?: string;
  
  /** Set of highlighted node IDs (neighbor highlighting) */
  highlightedNodeIds: Set<string>;
  
  /** Current interaction mode */
  interactionMode: InteractionMode;
  
  /** Visible area bounds */
  viewBounds: Rectangle;
  
  /** Last interaction timestamp for responsiveness tracking */
  lastInteractionTimestamp: number;
  
  /** Navigation history for undo/redo */
  history: NavigationHistoryEntry[];
  
  /** Current position in history */
  historyIndex: number;
  
  /** Whether navigation is currently locked */
  locked: boolean;
}

export type InteractionMode = 
  | 'navigate'    // General navigation mode
  | 'select'      // Node selection mode
  | 'pan'         // Pan-only mode
  | 'zoom'        // Zoom-only mode
  | 'disabled';   // No interactions allowed

// Navigation History for Undo/Redo
export interface NavigationHistoryEntry {
  /** Timestamp of this state */
  timestamp: number;
  
  /** Zoom level at this state */
  zoomLevel: number;
  
  /** Pan offset at this state */
  panOffset: Point2D;
  
  /** Selected node at this state */
  selectedNodeId?: string;
  
  /** Description of the action that led to this state */
  action: string;
}

// Interaction Event (Enhanced)
export interface InteractionEvent {
  /** Unique event ID for tracking */
  id: string;
  
  /** Event type */
  type: InteractionType;
  
  /** Target element (node ID or null for background) */
  target?: string;
  
  /** Event coordinates in screen space */
  screenCoordinates: Point2D;
  
  /** Event coordinates in graph space */
  graphCoordinates: Point2D;
  
  /** Event-specific data */
  data: InteractionEventData;
  
  /** Timestamp when event occurred */
  timestamp: number;
  
  /** Whether event should be propagated to other handlers */
  propagate: boolean;
  
  /** Original DOM event (if applicable) */
  originalEvent?: Event;
  
  /** Modifier keys pressed during event */
  modifiers: EventModifiers;
}

export type InteractionType = 
  | 'zoom-in'
  | 'zoom-out' 
  | 'zoom-to-fit'
  | 'pan'
  | 'pan-start'
  | 'pan-end'
  | 'select'
  | 'deselect'
  | 'hover'
  | 'hover-end'
  | 'click'
  | 'double-click'
  | 'drag-start'
  | 'drag'
  | 'drag-end'
  | 'wheel'
  | 'keydown'
  | 'keyup';

// Event Modifiers
export interface EventModifiers {
  /** Ctrl key pressed */
  ctrl: boolean;
  
  /** Shift key pressed */
  shift: boolean;
  
  /** Alt key pressed */
  alt: boolean;
  
  /** Meta key pressed (Cmd on Mac) */
  meta: boolean;
}

// Interaction Event Data
export interface InteractionEventData {
  /** Zoom event data */
  zoom?: ZoomEventData;
  
  /** Pan event data */
  pan?: PanEventData;
  
  /** Selection event data */
  selection?: SelectionEventData;
  
  /** Drag event data */
  drag?: DragEventData;
  
  /** Keyboard event data */
  keyboard?: KeyboardEventData;
  
  /** Mouse wheel data */
  wheel?: WheelEventData;
}

export interface ZoomEventData {
  /** Zoom delta (positive for zoom in, negative for zoom out) */
  delta: number;
  
  /** Zoom center point */
  center: Point2D;
  
  /** Previous zoom level */
  previousLevel: number;
  
  /** New zoom level */
  newLevel: number;
}

export interface PanEventData {
  /** Pan delta vector */
  delta: Point2D;
  
  /** Previous pan offset */
  previousOffset: Point2D;
  
  /** New pan offset */
  newOffset: Point2D;
  
  /** Pan velocity for inertia */
  velocity?: Point2D;
}

export interface SelectionEventData {
  /** Previously selected node ID */
  previousSelection?: string;
  
  /** Newly selected node ID */
  newSelection?: string;
  
  /** Whether this is a deselection */
  isDeselection: boolean;
  
  /** Neighbor nodes to highlight */
  neighborsToHighlight?: string[];
}

export interface DragEventData {
  /** Drag start position */
  startPosition: Point2D;
  
  /** Current drag position */
  currentPosition: Point2D;
  
  /** Drag delta from start */
  deltaFromStart: Point2D;
  
  /** Drag delta from last event */
  deltaFromLast: Point2D;
}

export interface KeyboardEventData {
  /** Key that was pressed/released */
  key: string;
  
  /** Key code */
  keyCode: number;
  
  /** Whether this is a repeat event */
  repeat: boolean;
}

export interface WheelEventData {
  /** Wheel delta X */
  deltaX: number;
  
  /** Wheel delta Y */
  deltaY: number;
  
  /** Wheel delta Z */
  deltaZ: number;
  
  /** Delta mode (pixel, line, page) */
  deltaMode: number;
}

// Navigation Constraints
export interface NavigationConstraints {
  /** Zoom constraints */
  zoom: ZoomConstraints;
  
  /** Pan constraints */
  pan: PanConstraints;
  
  /** Selection constraints */
  selection: SelectionConstraints;
  
  /** Interaction constraints */
  interactions: InteractionConstraints;
}

export interface ZoomConstraints {
  /** Minimum zoom level */
  min: number;
  
  /** Maximum zoom level */
  max: number;
  
  /** Zoom step size */
  step: number;
  
  /** Smooth zoom animation */
  smooth: boolean;
  
  /** Zoom animation duration (ms) */
  animationDuration: number;
}

export interface PanConstraints {
  /** Whether panning is enabled */
  enabled: boolean;
  
  /** Pan boundaries (optional) */
  boundaries?: Rectangle;
  
  /** Enable pan inertia */
  inertia: boolean;
  
  /** Inertia friction coefficient */
  friction: number;
  
  /** Maximum pan velocity */
  maxVelocity: number;
}

export interface SelectionConstraints {
  /** Selection mode (single only per clarifications) */
  mode: 'single';
  
  /** Enable automatic deselection on background click */
  autoDeselect: boolean;
  
  /** Enable neighbor highlighting */
  enableNeighborHighlight: boolean;
  
  /** Maximum neighbors to highlight */
  maxNeighborsToHighlight: number;
  
  /** Selection animation duration (ms) */
  animationDuration: number;
}

export interface InteractionConstraints {
  /** Response time requirement (ms) */
  responseTimeLimit: number;
  
  /** Minimum time between interactions (debounce) */
  debounceTime: number;
  
  /** Enable touch interactions */
  touchEnabled: boolean;
  
  /** Enable keyboard interactions */
  keyboardEnabled: boolean;
  
  /** Disabled interaction types */
  disabledInteractions: Set<InteractionType>;
}

// Navigation Event Handlers
export interface INavigationEventHandler {
  /**
   * Handle zoom events
   * @param event Zoom interaction event
   * @returns Whether event was handled
   */
  onZoom?(event: InteractionEvent): Promise<boolean>;
  
  /**
   * Handle pan events
   * @param event Pan interaction event
   * @returns Whether event was handled
   */
  onPan?(event: InteractionEvent): Promise<boolean>;
  
  /**
   * Handle selection events
   * @param event Selection interaction event
   * @returns Whether event was handled
   */
  onSelect?(event: InteractionEvent): Promise<boolean>;
  
  /**
   * Handle hover events
   * @param event Hover interaction event
   * @returns Whether event was handled
   */
  onHover?(event: InteractionEvent): Promise<boolean>;
  
  /**
   * Handle drag events
   * @param event Drag interaction event
   * @returns Whether event was handled
   */
  onDrag?(event: InteractionEvent): Promise<boolean>;
  
  /**
   * Handle keyboard events
   * @param event Keyboard interaction event
   * @returns Whether event was handled
   */
  onKeyboard?(event: InteractionEvent): Promise<boolean>;
}

// Navigation State Manager
export interface INavigationStateManager {
  /**
   * Get current navigation state
   */
  getCurrentState(): NavigationState;
  
  /**
   * Update navigation state
   * @param updates Partial updates to apply
   * @param addToHistory Whether to add this change to history
   */
  updateStateAsync(updates: Partial<NavigationState>, addToHistory?: boolean): Promise<void>;
  
  /**
   * Save current state to history
   * @param action Description of the action
   */
  saveToHistory(action: string): void;
  
  /**
   * Undo last navigation action
   */
  undoAsync(): Promise<boolean>;
  
  /**
   * Redo next navigation action
   */
  redoAsync(): Promise<boolean>;
  
  /**
   * Clear navigation history
   */
  clearHistory(): void;
  
  /**
   * Subscribe to state changes
   * @param callback Function to call when state changes
   * @returns Unsubscribe function
   */
  subscribeToChanges(callback: NavigationStateChangeCallback): () => void;
}

export type NavigationStateChangeCallback = (
  newState: NavigationState, 
  previousState: NavigationState,
  changes: Partial<NavigationState>
) => void;

// Viewport Manager Interface
export interface IViewportManager {
  /**
   * Fit viewport to show all content
   * @param padding Optional padding around content
   * @param animate Whether to animate the fit
   */
  fitToContentAsync(padding?: number, animate?: boolean): Promise<void>;
  
  /**
   * Zoom to specific level
   * @param level Target zoom level
   * @param center Optional center point for zoom
   * @param animate Whether to animate the zoom
   */
  zoomToLevelAsync(level: number, center?: Point2D, animate?: boolean): Promise<void>;
  
  /**
   * Pan to specific position
   * @param position Target position
   * @param animate Whether to animate the pan
   */
  panToPositionAsync(position: Point2D, animate?: boolean): Promise<void>;
  
  /**
   * Focus on specific node
   * @param nodeId Node to focus on
   * @param zoomLevel Optional zoom level for focus
   * @param animate Whether to animate the focus
   */
  focusOnNodeAsync(nodeId: string, zoomLevel?: number, animate?: boolean): Promise<void>;
  
  /**
   * Get visible nodes in current viewport
   * @returns Set of visible node IDs
   */
  getVisibleNodes(): Set<string>;
  
  /**
   * Convert screen coordinates to graph coordinates
   * @param screenPoint Point in screen space
   * @returns Point in graph space
   */
  screenToGraph(screenPoint: Point2D): Point2D;
  
  /**
   * Convert graph coordinates to screen coordinates
   * @param graphPoint Point in graph space
   * @returns Point in screen space
   */
  graphToScreen(graphPoint: Point2D): Point2D;
}

// Touch Gesture Support
export interface TouchGesture {
  /** Gesture type */
  type: 'pinch' | 'rotate' | 'swipe' | 'tap' | 'double-tap' | 'long-press';
  
  /** Gesture data */
  data: TouchGestureData;
  
  /** Gesture state */
  state: 'start' | 'change' | 'end' | 'cancel';
}

export interface TouchGestureData {
  /** Center point of gesture */
  center: Point2D;
  
  /** Scale factor (for pinch) */
  scale?: number;
  
  /** Rotation angle (for rotation) */
  rotation?: number;
  
  /** Velocity (for swipe) */
  velocity?: Point2D;
  
  /** Touch points */
  touches: TouchPoint[];
}

export interface TouchPoint {
  /** Touch identifier */
  id: number;
  
  /** Current position */
  position: Point2D;
  
  /** Force (if supported) */
  force?: number;
}

// Performance Monitoring
export interface NavigationPerformanceMetrics {
  /** Average response time (ms) */
  averageResponseTime: number;
  
  /** Maximum response time (ms) */
  maxResponseTime: number;
  
  /** Total interactions processed */
  totalInteractions: number;
  
  /** Interactions per second */
  interactionsPerSecond: number;
  
  /** Frame drops during interactions */
  frameDrops: number;
  
  /** Memory usage during interactions (MB) */
  memoryUsage: number;
}

// Accessibility Support
export interface AccessibilityConfig {
  /** Enable keyboard navigation */
  keyboardNavigation: boolean;
  
  /** Enable screen reader support */
  screenReaderSupport: boolean;
  
  /** Enable high contrast mode */
  highContrastMode: boolean;
  
  /** Enable focus indicators */
  focusIndicators: boolean;
  
  /** Reduce motion for accessibility */
  reduceMotion: boolean;
  
  /** Custom keyboard shortcuts */
  keyboardShortcuts: Map<string, string>;
}

// Integration with Rendering Strategies
export interface INavigationRenderer {
  /**
   * Render navigation-related visual elements
   * @param state Current navigation state
   * @param context Rendering context
   */
  renderNavigationElements(state: NavigationState, context: any): void;
  
  /**
   * Update visual feedback for interactions
   * @param event Interaction event
   * @param feedback Visual feedback to display
   */
  showInteractionFeedback(event: InteractionEvent, feedback: VisualFeedback): void;
  
  /**
   * Clear visual feedback
   */
  clearFeedback(): void;
}

export interface VisualFeedback {
  /** Feedback type */
  type: 'selection' | 'hover' | 'focus' | 'highlight';
  
  /** Target element */
  target: string;
  
  /** Feedback properties */
  properties: VisualFeedbackProperties;
  
  /** Duration (ms, 0 for persistent) */
  duration: number;
}

export interface VisualFeedbackProperties {
  /** Color */
  color?: string;
  
  /** Opacity */
  opacity?: number;
  
  /** Scale factor */
  scale?: number;
  
  /** Border width */
  borderWidth?: number;
  
  /** Glow effect */
  glow?: boolean;
  
  /** Animation */
  animation?: 'pulse' | 'fade' | 'scale' | 'none';
}