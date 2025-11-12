/**
 * Core interaction types and interfaces for the Knowledge Network interaction system.
 *
 * Provides unified interaction behavior across all renderer types (SVG, Canvas, WebGL).
 * Supports mouse, touch, and keyboard interactions with gesture recognition.
 */

import type { Point2D } from '../spatial/types';
import type { PositionedNode } from '../layout/LayoutEngine';

// === Core Interaction Types ===

export interface InteractionState {
  isPanning: boolean;
  isZooming: boolean;
  isSelecting: boolean;
  isDragging: boolean;
  isAnimating: boolean;

  // Current interaction position
  lastPointerPosition: Point2D;
  panStartPosition: Point2D;
  zoomCenter: Point2D;

  // Selected nodes
  selectedNodes: Set<string>;
  hoveredNode: PositionedNode | null;

  // Drag state
  dragStartPosition: Point2D;
  draggedNodes: Set<string>;
}

export interface InteractionFeatures {
  // Selection modes
  singleSelect: boolean;
  multiSelect: boolean;
  regionSelect: boolean;

  // Navigation
  mouseWheelZoom: boolean;
  doubleClickZoom: boolean;
  panWithMouse: boolean;
  pinchZoom: boolean;

  // Keyboard shortcuts
  keyboardNavigation: boolean;
  resetShortcut: string;
  fitShortcut: string;

  // Animation
  animatedTransitions: boolean;
  transitionDuration: number;

  // Touch behavior
  touchEnabled: boolean;
  multiTouchEnabled: boolean;

  // Performance
  throttleDelay: number;
  enableBatching: boolean;
}

export interface ViewportState {
  // Transform properties
  zoom: number;
  pan: Point2D;

  // Constraints
  minZoom: number;
  maxZoom: number;
  panBounds?: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };

  // Viewport dimensions
  width: number;
  height: number;

  // Transform matrix for efficiency
  matrix: DOMMatrix;
}

// === Event Types ===

export interface InteractionEvent {
  type: string;
  timestamp: number;
  cancelled: boolean;
}

export interface NodeInteractionEvent extends InteractionEvent {
  node: PositionedNode;
  position: Point2D;
  originalEvent: MouseEvent | TouchEvent;
}

export interface ViewportChangeEvent extends InteractionEvent {
  viewport: ViewportState;
  previousViewport: ViewportState;
  reason: 'pan' | 'zoom' | 'reset' | 'fit' | 'programmatic';
}

export interface SelectionChangeEvent extends InteractionEvent {
  selectedNodes: PositionedNode[];
  addedNodes: PositionedNode[];
  removedNodes: PositionedNode[];
}

export interface GestureEvent extends InteractionEvent {
  gesture: GestureType;
  data: GestureData;
}

// === Gesture Recognition ===

export type GestureType =
  | 'tap'
  | 'doubleTap'
  | 'longPress'
  | 'pinch'
  | 'pan'
  | 'swipe'
  | 'twoFingerPan'
  | 'threeFingerTap';

export interface GestureData {
  startPosition: Point2D;
  currentPosition: Point2D;
  deltaPosition: Point2D;
  velocity?: Point2D;
  scale?: number;
  rotation?: number;
  touchCount?: number;
  duration?: number;
}

export interface TouchPoint {
  id: number;
  position: Point2D;
  pressure?: number;
  timestamp: number;
}

// === Animation Types ===

export interface AnimationConfig {
  duration: number;
  easing: EasingFunction;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export type EasingFunction = (t: number) => number;

export interface ViewportAnimation {
  target: Partial<ViewportState>;
  config: AnimationConfig;
  startTime: number;
  startViewport: ViewportState;
}

// === Configuration ===

export interface InteractionConfig {
  features: InteractionFeatures;
  viewport: {
    initialZoom?: number;
    initialPan?: Point2D;
    minZoom?: number;
    maxZoom?: number;
    panBounds?: ViewportState['panBounds'];
  };
  gestures: {
    tapTimeout: number;
    doubleTapTimeout: number;
    longPressTimeout: number;
    pinchThreshold: number;
    panThreshold: number;
    swipeThreshold: number;
    velocityThreshold: number;
  };
  animation: {
    defaultDuration: number;
    defaultEasing: EasingFunction;
    enableGpuAcceleration: boolean;
  };
  accessibility: {
    announceChanges: boolean;
    keyboardFocusVisible: boolean;
    screenReaderSupport: boolean;
  };
}

// === Default Configuration ===

export const DEFAULT_INTERACTION_FEATURES: InteractionFeatures = {
  singleSelect: true,
  multiSelect: true,
  regionSelect: true,
  mouseWheelZoom: true,
  doubleClickZoom: true,
  panWithMouse: true,
  pinchZoom: true,
  keyboardNavigation: true,
  resetShortcut: 'r',
  fitShortcut: 'f',
  animatedTransitions: true,
  transitionDuration: 300,
  touchEnabled: true,
  multiTouchEnabled: true,
  throttleDelay: 16, // 60fps
  enableBatching: true,
};

export const DEFAULT_INTERACTION_CONFIG: InteractionConfig = {
  features: DEFAULT_INTERACTION_FEATURES,
  viewport: {
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    minZoom: 0.1,
    maxZoom: 10,
  },
  gestures: {
    tapTimeout: 200,
    doubleTapTimeout: 300,
    longPressTimeout: 500,
    pinchThreshold: 10,
    panThreshold: 5,
    swipeThreshold: 50,
    velocityThreshold: 0.5,
  },
  animation: {
    defaultDuration: 300,
    defaultEasing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t, // easeInOutQuad
    enableGpuAcceleration: true,
  },
  accessibility: {
    announceChanges: false,
    keyboardFocusVisible: true,
    screenReaderSupport: false,
  },
};

// === Coordinate Transformation Utilities ===

export interface CoordinateTransform {
  // Transform screen coordinates to world coordinates
  screenToWorld(point: Point2D): Point2D;

  // Transform world coordinates to screen coordinates
  worldToScreen(point: Point2D): Point2D;

  // Apply viewport transform to a point
  applyTransform(point: Point2D): Point2D;

  // Get the transform matrix
  getMatrix(): DOMMatrix;

  // Update transform from viewport state
  updateFromViewport(viewport: ViewportState): void;
}

// === Selection Types ===

export interface SelectionRegion {
  type: 'rectangle' | 'circle' | 'polygon';
  bounds: {
    startPoint: Point2D;
    endPoint: Point2D;
  } | {
    center: Point2D;
    radius: number;
  } | {
    points: Point2D[];
  };
}

export interface SelectionMode {
  type: 'single' | 'multi' | 'toggle' | 'region';
  modifierKeys: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}

// === Event Handler Types ===

export interface InteractionEventHandlers {
  onNodeClick?: (event: NodeInteractionEvent) => void;
  onNodeDoubleClick?: (event: NodeInteractionEvent) => void;
  onNodeHover?: (event: NodeInteractionEvent) => void;
  onNodeDragStart?: (event: NodeInteractionEvent) => void;
  onNodeDrag?: (event: NodeInteractionEvent) => void;
  onNodeDragEnd?: (event: NodeInteractionEvent) => void;

  onViewportChange?: (event: ViewportChangeEvent) => void;
  onSelectionChange?: (event: SelectionChangeEvent) => void;
  onGesture?: (event: GestureEvent) => void;

  onPanStart?: (event: InteractionEvent) => void;
  onPan?: (event: InteractionEvent) => void;
  onPanEnd?: (event: InteractionEvent) => void;

  onZoomStart?: (event: InteractionEvent) => void;
  onZoom?: (event: InteractionEvent) => void;
  onZoomEnd?: (event: InteractionEvent) => void;
}

// === Utility Functions ===

/**
 * Create a default viewport state for a given container size
 */
export function createViewportState(
  width: number,
  height: number,
  config: Partial<InteractionConfig> = {}
): ViewportState {
  const zoom = config.viewport?.initialZoom ?? 1;
  const pan = config.viewport?.initialPan ?? { x: 0, y: 0 };

  return {
    zoom,
    pan,
    minZoom: config.viewport?.minZoom ?? 0.1,
    maxZoom: config.viewport?.maxZoom ?? 10,
    panBounds: config.viewport?.panBounds,
    width,
    height,
    matrix: new DOMMatrix()
      .translate(pan.x, pan.y)
      .scale(zoom, zoom),
  };
}

/**
 * Create default interaction state
 */
export function createInteractionState(): InteractionState {
  return {
    isPanning: false,
    isZooming: false,
    isSelecting: false,
    isDragging: false,
    isAnimating: false,
    lastPointerPosition: { x: 0, y: 0 },
    panStartPosition: { x: 0, y: 0 },
    zoomCenter: { x: 0, y: 0 },
    selectedNodes: new Set(),
    hoveredNode: null,
    dragStartPosition: { x: 0, y: 0 },
    draggedNodes: new Set(),
  };
}

/**
 * Calculate distance between two points
 */
export function calculateDistance(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T {
  let timeoutId: number | null = null;
  let lastExecTime = 0;

  return ((...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else if (!timeoutId) {
      timeoutId = window.setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
        timeoutId = null;
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

/**
 * Built-in easing functions
 */
export const EASING_FUNCTIONS = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};