/**
 * Interaction System Exports
 *
 * Comprehensive interaction system for Knowledge Network visualization providing:
 * - Unified pan/zoom/selection behavior across all renderers
 * - Advanced gesture recognition for touch and mouse
 * - Smooth animations and transitions
 * - Event system for renderer communication
 * - Mobile and accessibility support
 */

// === Core Types ===
export type {
  InteractionState,
  InteractionFeatures,
  ViewportState,
  InteractionConfig,
  InteractionEvent,
  NodeInteractionEvent,
  ViewportChangeEvent,
  SelectionChangeEvent,
  GestureEvent,
  GestureType,
  GestureData,
  TouchPoint,
  AnimationConfig,
  ViewportAnimation,
  EasingFunction,
  CoordinateTransform,
  SelectionRegion,
  SelectionMode,
  InteractionEventHandlers,
} from './types';

export {
  DEFAULT_INTERACTION_FEATURES,
  DEFAULT_INTERACTION_CONFIG,
  EASING_FUNCTIONS,
  createViewportState,
  createInteractionState,
  calculateDistance,
  clamp,
  throttle,
} from './types';

// === Core Classes ===
export { ViewportState } from './ViewportState';
export { GestureRecognizer, type GestureRecognizerConfig, DEFAULT_GESTURE_CONFIG } from './GestureRecognizer';
export { AnimationSystem, type AnimationSystemConfig, DEFAULT_ANIMATION_CONFIG } from './AnimationSystem';
export { InteractionController } from './InteractionController';

// === Event System ===
export {
  InteractionEventSystem,
  type InteractionEventMap,
  type InteractionModeChangeEvent,
  type InteractionStateChangeEvent,
  type PerformanceEvent,
  type PerformanceWarningEvent,
  type InteractionErrorEvent,
  type EventMiddleware,
  type EventFilter,
  type BatchedEvent,
  type EventBatchingConfig,
} from './InteractionEventSystem';

// === Factory Functions ===

/**
 * Create a basic interaction controller with default settings
 */
export function createInteractionController(
  config?: Partial<InteractionConfig>
): InteractionController {
  return new InteractionController(config);
}

/**
 * Create a mobile-optimized interaction controller
 */
export function createMobileInteractionController(): InteractionController {
  return new InteractionController({
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      touchEnabled: true,
      multiTouchEnabled: true,
      pinchZoom: true,
      doubleClickZoom: false, // Avoid conflicts with double-tap zoom
      regionSelect: false, // Difficult on mobile
      keyboardNavigation: false, // Not applicable on mobile
      throttleDelay: 32, // 30fps for better battery life
    },
    gestures: {
      tapTimeout: 150, // Faster for mobile
      doubleTapTimeout: 250,
      longPressTimeout: 400,
      pinchThreshold: 5, // More sensitive for touch
      panThreshold: 3,
      swipeThreshold: 30,
      velocityThreshold: 0.3,
    },
    animation: {
      defaultDuration: 250, // Faster animations
      defaultEasing: EASING_FUNCTIONS.easeOutQuad,
      enableGpuAcceleration: true,
    },
  });
}

/**
 * Create a desktop-optimized interaction controller
 */
export function createDesktopInteractionController(): InteractionController {
  return new InteractionController({
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      touchEnabled: false,
      multiTouchEnabled: false,
      pinchZoom: false,
      mouseWheelZoom: true,
      doubleClickZoom: true,
      regionSelect: true,
      keyboardNavigation: true,
      throttleDelay: 16, // 60fps
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
      defaultEasing: EASING_FUNCTIONS.easeInOutQuad,
      enableGpuAcceleration: true,
    },
  });
}

/**
 * Create a high-performance interaction controller for large graphs
 */
export function createPerformanceInteractionController(): InteractionController {
  return new InteractionController({
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      animatedTransitions: false, // Disable for performance
      throttleDelay: 32, // 30fps
      enableBatching: true,
    },
    gestures: {
      tapTimeout: 100, // Faster response
      doubleTapTimeout: 200,
      longPressTimeout: 300,
      pinchThreshold: 15, // Less sensitive to avoid accidental triggers
      panThreshold: 8,
      swipeThreshold: 100,
      velocityThreshold: 1.0,
    },
    animation: {
      defaultDuration: 150, // Minimal animations
      defaultEasing: EASING_FUNCTIONS.linear,
      enableGpuAcceleration: false, // May be slower for complex scenes
    },
  });
}

/**
 * Create an accessibility-focused interaction controller
 */
export function createAccessibleInteractionController(): InteractionController {
  return new InteractionController({
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      keyboardNavigation: true,
      animatedTransitions: false, // Respect reduced motion preferences
      throttleDelay: 100, // Slower for screen readers
    },
    accessibility: {
      announceChanges: true,
      keyboardFocusVisible: true,
      screenReaderSupport: true,
    },
    animation: {
      defaultDuration: 0, // No animations for accessibility
      defaultEasing: EASING_FUNCTIONS.linear,
      enableGpuAcceleration: false,
    },
  });
}

// === Interaction Presets ===

export const INTERACTION_PRESETS = {
  /**
   * Default interaction settings suitable for most use cases
   */
  default: DEFAULT_INTERACTION_CONFIG,

  /**
   * Mobile-optimized settings
   */
  mobile: {
    ...DEFAULT_INTERACTION_CONFIG,
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      touchEnabled: true,
      multiTouchEnabled: true,
      pinchZoom: true,
      doubleClickZoom: false,
      regionSelect: false,
      keyboardNavigation: false,
      throttleDelay: 32,
    },
  },

  /**
   * Desktop-optimized settings
   */
  desktop: {
    ...DEFAULT_INTERACTION_CONFIG,
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      touchEnabled: false,
      multiTouchEnabled: false,
      pinchZoom: false,
      mouseWheelZoom: true,
      doubleClickZoom: true,
      regionSelect: true,
      keyboardNavigation: true,
      throttleDelay: 16,
    },
  },

  /**
   * High-performance settings for large graphs
   */
  performance: {
    ...DEFAULT_INTERACTION_CONFIG,
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      animatedTransitions: false,
      throttleDelay: 32,
      enableBatching: true,
    },
    animation: {
      ...DEFAULT_INTERACTION_CONFIG.animation,
      defaultDuration: 150,
      enableGpuAcceleration: false,
    },
  },

  /**
   * Accessibility-focused settings
   */
  accessible: {
    ...DEFAULT_INTERACTION_CONFIG,
    features: {
      ...DEFAULT_INTERACTION_FEATURES,
      keyboardNavigation: true,
      animatedTransitions: false,
      throttleDelay: 100,
    },
    accessibility: {
      announceChanges: true,
      keyboardFocusVisible: true,
      screenReaderSupport: true,
    },
    animation: {
      ...DEFAULT_INTERACTION_CONFIG.animation,
      defaultDuration: 0,
    },
  },
} as const;

// === Utility Functions ===

/**
 * Create interaction controller from preset
 */
export function createInteractionControllerFromPreset(
  preset: keyof typeof INTERACTION_PRESETS,
  overrides?: Partial<InteractionConfig>
): InteractionController {
  const config = { ...INTERACTION_PRESETS[preset], ...overrides };
  return new InteractionController(config);
}

/**
 * Detect device capabilities and return appropriate preset
 */
export function detectInteractionPreset(): keyof typeof INTERACTION_PRESETS {
  if (typeof window === 'undefined') {
    return 'default';
  }

  // Check for touch support
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // Check for mobile device
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (prefersReducedMotion) {
    return 'accessible';
  }

  if (isMobile || hasTouchSupport) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Create auto-configured interaction controller based on device capabilities
 */
export function createAutoInteractionController(
  overrides?: Partial<InteractionConfig>
): InteractionController {
  const preset = detectInteractionPreset();
  return createInteractionControllerFromPreset(preset, overrides);
}

// === Integration Helpers ===

/**
 * Connect interaction controller to renderer and spatial indexer
 */
export function connectInteractionSystem(
  interactionController: InteractionController,
  container: HTMLElement,
  renderer: any, // IRenderer type from rendering module
  spatialIndexer?: any // SpatialIndexer type from spatial module
): void {
  interactionController.initialize(container, renderer, spatialIndexer);
}

/**
 * Create complete interaction system with event system
 */
export function createCompleteInteractionSystem(
  config?: Partial<InteractionConfig>
): {
  controller: InteractionController;
  eventSystem: InteractionEventSystem;
  connect: (container: HTMLElement, renderer: any, spatialIndexer?: any) => void;
} {
  const controller = new InteractionController(config);
  const eventSystem = new InteractionEventSystem();

  // Connect controller to event system
  const connect = (container: HTMLElement, renderer: any, spatialIndexer?: any) => {
    controller.initialize(container, renderer, spatialIndexer);

    // Forward controller events to event system
    controller.on('viewportChange', (event) => {
      eventSystem.emitInteractionEvent('viewport:change', event);
    });

    controller.on('selectionChange', (event) => {
      eventSystem.emitInteractionEvent('selection:change', event);
    });

    controller.on('nodeClick', (event) => {
      eventSystem.emitInteractionEvent('node:click', event);
    });

    controller.on('nodeHover', (event) => {
      eventSystem.emitInteractionEvent('node:hover', event);
    });
  };

  return { controller, eventSystem, connect };
}