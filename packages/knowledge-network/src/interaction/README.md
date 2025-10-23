# Knowledge Network Interaction System

A comprehensive, decoupled interaction system that provides unified pan/zoom/selection behavior across all Knowledge Network renderers (SVG, Canvas, WebGL).

## Features

- ✅ **Unified Interaction Controller**: Consistent behavior across all renderer types
- ✅ **Advanced Gesture Recognition**: Multi-touch, pinch, pan, tap, long press, swipe
- ✅ **Smooth Animation System**: GPU-accelerated animations with custom easing functions
- ✅ **Viewport Management**: Coordinate transformations, bounds checking, fit-to-content
- ✅ **Event System**: Type-safe, middleware-capable event handling with batching
- ✅ **Mobile Optimization**: Touch targets, haptic feedback, battery optimization
- ✅ **Accessibility Support**: Screen readers, keyboard navigation, voice control
- ✅ **Performance Optimization**: Spatial indexing integration, viewport culling
- ✅ **Comprehensive Testing**: Full test coverage for all interaction modes

## Architecture

### Core Components

```typescript
// Main interaction controller
InteractionController
├── ViewportState          // Pan/zoom/coordinate transforms
├── GestureRecognizer     // Touch and mouse gesture processing
├── AnimationSystem       // Smooth transitions and animations
└── InteractionEventSystem // Event delegation and middleware

// Optional enhancements
MobileOptimizer           // Mobile-specific optimizations
AccessibilitySupport      // Screen reader and keyboard support
RendererIntegration      // Renderer capability detection and adaptation
```

### Key Interfaces

```typescript
interface IInteractiveRenderer extends IRenderer {
  // Enhanced viewport control
  setZoom(zoom: number, center?: Point2D): void;
  setPan(pan: Point2D): void;
  resetView(): void;
  fitToViewport(padding?: number): void;

  // Spatial queries (O(log n) with spatial indexing)
  getNodeAt(screenX: number, screenY: number): PositionedNode | null;
  getNodesInRegion(region: Rectangle): PositionedNode[];
  isNodeVisible(node: PositionedNode): boolean;
}
```

## Quick Start

### Basic Usage

```typescript
import { createAutoInteractionController } from '@aigeeksquad/knowledge-network';

// Auto-detects device capabilities (mobile/desktop/accessibility)
const controller = createAutoInteractionController();

// Initialize with container and renderer
controller.initialize(container, renderer, spatialIndexer);

// Update with graph data
controller.updateNodes(nodes);

// Programmatic control
await controller.setZoom(2.0);
await controller.fitToGraph();
controller.selectNodes(['node1', 'node2']);
```

### Advanced Setup with Full Features

```typescript
import {
  createCompleteInteractionSystem,
  createMobileOptimizer,
  createAccessibilitySupport,
} from '@aigeeksquad/knowledge-network';

// Create full interaction system
const { controller, eventSystem, connect } = createCompleteInteractionSystem();

// Connect to renderer
connect(container, renderer, spatialIndexer);

// Add mobile optimizations
const mobileOptimizer = createMobileOptimizer(controller, {
  enhancedTouchTargets: true,
  enableHaptics: true,
  batteryOptimization: true,
});

// Add accessibility support
const accessibilitySupport = createAccessibilitySupport(controller, {
  announceChanges: true,
  enableKeyboardNavigation: true,
  enableVoiceCommands: true,
});

// Set up event handlers
eventSystem.on('node:click', (event) => {
  console.log('Node clicked:', event.node.id);
});

eventSystem.on('viewport:change', (event) => {
  console.log('Viewport changed:', event.viewport);
});
```

## Interaction Features

### Pan & Zoom
- **Mouse wheel zoom** with center point preservation
- **Touch pinch-to-zoom** with natural gestures
- **Pan with drag** (mouse or touch)
- **Keyboard navigation** (arrow keys, +/- zoom)
- **Programmatic control** with smooth animations

### Selection
- **Single-click selection** with visual feedback
- **Multi-select** with Ctrl/Cmd+click
- **Region select** with drag rectangle
- **Keyboard navigation** through nodes
- **Programmatic selection** with batching

### Gestures
- **Tap/Double-tap**: Node selection and zoom
- **Long press**: Context menus and details
- **Pinch**: Zoom with natural center point
- **Pan**: Single or multi-finger panning
- **Swipe**: Navigation and transitions

## Mobile & Touch Support

### Enhanced Touch Targets
```typescript
// Automatically enhances small nodes for touch accessibility
const mobileOptimizer = createMobileOptimizer(controller, {
  enhancedTouchTargets: true,
  minimumTouchTargetSize: 44, // iOS HIG recommendation
  touchSlop: 8, // Movement tolerance
});
```

### Haptic Feedback
```typescript
// Provides tactile feedback for interactions
mobileOptimizer.triggerHapticFeedback('selection'); // Node selected
mobileOptimizer.triggerHapticFeedback('impact');    // Zoom/pan limit
mobileOptimizer.triggerHapticFeedback('success');   // Action completed
```

### Battery Optimization
```typescript
// Automatically reduces performance when battery is low
const mobileOptimizer = createMobileOptimizer(controller, {
  batteryOptimization: true, // Auto-adjust frame rate and animations
  lowPowerMode: false,       // Manual override
});
```

## Accessibility Features

### Screen Reader Support
```typescript
const accessibilitySupport = createAccessibilitySupport(controller, {
  announceChanges: true,        // Announce viewport and selection changes
  enableLiveRegions: true,      // ARIA live regions for updates
  customAnnouncements: true,    // Custom announcement messages
});

// Manual announcements
accessibilitySupport.announce('Graph loaded with 50 nodes');
```

### Keyboard Navigation
```typescript
// Built-in keyboard shortcuts
// Arrow keys: Navigate through graph
// +/-: Zoom in/out
// R: Reset viewport
// F: Fit to graph
// Tab: Cycle through nodes
// Enter/Space: Activate selected node
// Escape: Clear selection
```

### Voice Control
```typescript
const accessibilitySupport = createAccessibilitySupport(controller, {
  enableVoiceCommands: true,
  voiceCommandLanguage: 'en-US',
});

// Add custom voice commands
accessibilitySupport.addVoiceCommand('zoom in', () => {
  controller.zoom(1.5);
});

accessibilitySupport.addVoiceCommand('show details', () => {
  showNodeDetails(controller.getSelectedNodes());
});
```

## Animation System

### Smooth Transitions
```typescript
// All viewport changes can be animated
await controller.setZoom(2.0, centerPoint, true);    // Animated
await controller.setPan({ x: 100, y: 50 }, true);    // Animated
await controller.fitToGraph(50, true);               // Animated
await controller.resetView(true);                    // Animated
```

### Custom Animations
```typescript
const animationSystem = new AnimationSystem();

// Animate any value with custom easing
await animationSystem.animate(
  'custom-animation',
  0,
  100,
  {
    duration: 1000,
    easing: EASING_FUNCTIONS.easeInOutCubic,
    onProgress: (progress) => console.log(`${progress * 100}%`),
  },
  (progress, value) => {
    // Update your custom property
    updateCustomProperty(value);
  }
);
```

### Easing Functions
```typescript
import { EASING_FUNCTIONS, AnimationSystem } from './AnimationSystem';

// Built-in easing functions
EASING_FUNCTIONS.linear
EASING_FUNCTIONS.easeInQuad
EASING_FUNCTIONS.easeOutQuad
EASING_FUNCTIONS.easeInOutQuad
EASING_FUNCTIONS.easeInCubic
EASING_FUNCTIONS.easeOutCubic
EASING_FUNCTIONS.easeInOutCubic
EASING_FUNCTIONS.easeOutElastic

// Create custom spring/bounce effects
const springEasing = AnimationSystem.createSpringEasing(120, 14);
const bounceEasing = AnimationSystem.createBounceEasing(3, 0.6);
```

## Event System

### Type-Safe Events
```typescript
// Comprehensive event types with full TypeScript support
eventSystem.on('node:click', (event: NodeInteractionEvent) => {
  console.log('Node:', event.node.id);
  console.log('Position:', event.position);
  console.log('Original event:', event.originalEvent);
});

eventSystem.on('viewport:change', (event: ViewportChangeEvent) => {
  console.log('Viewport:', event.viewport);
  console.log('Reason:', event.reason); // 'pan' | 'zoom' | 'reset' | 'fit'
});
```

### Middleware System
```typescript
// Add custom processing to events
const loggingMiddleware = InteractionEventSystem.createLoggingMiddleware(
  'debug-logger',
  'debug'
);

const throttleMiddleware = InteractionEventSystem.createThrottleMiddleware(
  'viewport-throttle',
  16 // 60fps
);

eventSystem.addMiddleware('node:click', loggingMiddleware);
eventSystem.addMiddleware('viewport:pan', throttleMiddleware);
```

### Event Batching
```typescript
// Automatic batching for high-frequency events
const eventSystem = new InteractionEventSystem({
  enabled: true,
  batchSize: 10,
  maxBatchTime: 16, // 60fps
  batchableEvents: ['viewport:pan', 'viewport:zoom'],
});

// Listen to batched events
eventSystem.on('viewport:pan:batch', (batchedEvent) => {
  console.log('Batch of', batchedEvent.events.length, 'pan events');
});
```

## Performance Optimization

### Spatial Indexing Integration
```typescript
// O(log n) node selection with QuadTree/OctTree
const spatialIndexer = new SpatialIndexer();
spatialIndexer.build(nodes);

controller.initialize(container, renderer, spatialIndexer);

// Fast spatial queries
const nodeAtPoint = controller.getNodeAt(mouseX, mouseY);
const nodesInRegion = controller.getNodesInRegion(selectionRect);
```

### Viewport Culling
```typescript
// Only render visible nodes for large graphs
const renderer = createInteractiveRenderer(baseRenderer);
renderer.enableViewportCulling(true);
renderer.setLevelOfDetail(true);

// Automatically filters nodes based on viewport
const visibleNodes = nodes.filter(node => renderer.isNodeVisible(node));
```

### Performance Monitoring
```typescript
// Real-time performance tracking
const stats = controller.getPerformanceStats();
console.log('FPS:', stats.animation.fps);
console.log('Selected nodes:', stats.selectedNodeCount);
console.log('Spatial index enabled:', stats.spatialIndexEnabled);

// Performance warnings
eventSystem.on('performance:warning', (event) => {
  if (event.warning === 'low_framerate') {
    console.warn('Performance degraded, reducing quality');
  }
});
```

## Configuration Presets

### Device-Optimized Presets
```typescript
import { INTERACTION_PRESETS, createInteractionControllerFromPreset } from './index';

// Pre-configured for different devices
const desktopController = createInteractionControllerFromPreset('desktop');
const mobileController = createInteractionControllerFromPreset('mobile');
const accessibleController = createInteractionControllerFromPreset('accessible');
const performanceController = createInteractionControllerFromPreset('performance');
```

### Auto-Detection
```typescript
// Automatically detects device capabilities and preferences
const controller = createAutoInteractionController();

// Override specific settings
const controller = createAutoInteractionController({
  features: {
    animatedTransitions: false, // Disable animations
    throttleDelay: 32,         // 30fps for better performance
  },
});
```

## Testing

The interaction system includes comprehensive tests covering:

- ✅ **Unit Tests**: All core components with 90%+ coverage
- ✅ **Integration Tests**: Cross-component interaction validation
- ✅ **Gesture Tests**: Multi-touch and mouse gesture recognition
- ✅ **Animation Tests**: Smooth transitions and custom easing
- ✅ **Accessibility Tests**: Screen reader and keyboard navigation
- ✅ **Performance Tests**: Spatial indexing and viewport culling

```bash
# Run all interaction tests
npm test src/interaction

# Run specific test suites
npm test ViewportState.test.ts
npm test GestureRecognizer.test.ts
npm test InteractionController.test.ts
npm test AnimationSystem.test.ts
```

## Browser Compatibility

### Supported Features by Browser

| Feature | Chrome | Firefox | Safari | Edge | Mobile Safari | Chrome Mobile |
|---------|--------|---------|--------|------|---------------|---------------|
| Touch Events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-touch | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pointer Events | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vibration API | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Speech Recognition | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |
| Battery API | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Device Orientation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Fallback Behavior
- Features gracefully degrade when APIs are unavailable
- Mobile optimizations work on all touch devices
- Accessibility features use standard APIs with wide support

## API Reference

### InteractionController

```typescript
class InteractionController {
  // Initialization
  initialize(container: HTMLElement, renderer: IRenderer, spatialIndexer?: SpatialIndexer): void
  destroy(): void

  // Viewport Control
  setZoom(zoom: number, center?: Point2D, animated?: boolean): Promise<void>
  setPan(pan: Point2D, animated?: boolean): Promise<void>
  resetView(animated?: boolean): Promise<void>
  fitToGraph(padding?: number, animated?: boolean): Promise<void>
  zoomToNode(nodeId: string, zoomLevel?: number, animated?: boolean): Promise<void>

  // Programmatic Interaction
  pan(deltaX: number, deltaY: number): void
  zoom(factor: number, centerPoint?: Point2D): void

  // Selection Management
  selectNodes(nodeIds: string[], mode?: 'set' | 'add' | 'toggle'): void
  clearSelection(): void
  getSelectedNodes(): PositionedNode[]

  // Feature Control
  enablePan(enabled: boolean): void
  enableZoom(enabled: boolean): void
  enableSelection(enabled: boolean): void

  // Node Queries (with spatial indexing)
  getNodeAt(screenX: number, screenY: number): PositionedNode | null
  getNodesInRegion(region: Rectangle): PositionedNode[]

  // State Access
  getViewportState(): ViewportState
  getInteractionState(): InteractionState
  getPerformanceStats(): PerformanceStats

  // Event Handling
  setEventHandlers(handlers: Partial<InteractionEventHandlers>): void
  on(event: string, handler: Function): void
  off(event: string, handler?: Function): void
}
```

### GestureRecognizer

```typescript
class GestureRecognizer {
  // Configuration
  updateConfig(config: Partial<GestureRecognizerConfig>): void
  getConfig(): GestureRecognizerConfig

  // Event Handling
  handleMouseDown(event: MouseEvent): void
  handleMouseMove(event: MouseEvent): void
  handleMouseUp(event: MouseEvent): void
  handleTouchStart(event: TouchEvent): void
  handleTouchMove(event: TouchEvent): void
  handleTouchEnd(event: TouchEvent): void

  // Gesture Events
  on(gestureType: GestureType, callback: (event: GestureEvent) => void): void
  off(gestureType: GestureType, callback?: (event: GestureEvent) => void): void

  // State Management
  getCurrentGesture(): { type: GestureType | null; data: Partial<GestureData> }
  isGestureActive(gestureType: GestureType): boolean
  getActiveTouchCount(): number
  reset(): void
}
```

### AnimationSystem

```typescript
class AnimationSystem {
  // Viewport Animations
  animateZoom(viewport: ViewportState, targetZoom: number, center?: Point2D): Promise<void>
  animatePan(viewport: ViewportState, targetPan: Point2D): Promise<void>
  animateToFit(viewport: ViewportState, bounds: Bounds, padding?: number): Promise<void>
  animateReset(viewport: ViewportState, zoom?: number, pan?: Point2D): Promise<void>

  // Custom Animations
  animate<T>(id: string, startValue: T, targetValue: T, config: AnimationConfig, onUpdate: (progress: number, value: T) => void): Promise<void>
  animateValue(id: string, start: number, target: number, config: AnimationConfig, onUpdate: (value: number) => void): Promise<void>
  animatePoint(id: string, start: Point2D, target: Point2D, config: AnimationConfig, onUpdate: (point: Point2D) => void): Promise<void>

  // Animation Control
  cancelAnimation(id: string): void
  cancelAllAnimations(): void
  isAnimating(id?: string): boolean
  getActiveAnimationIds(): string[]

  // Performance
  getCurrentFps(): number
  getPerformanceStats(): AnimationPerformanceStats
}
```

## Examples

See `src/interaction/examples/CompleteInteractionExample.ts` for a comprehensive usage example that demonstrates:

- Setting up the full interaction system
- Mobile and accessibility optimizations
- Custom event handling
- Performance monitoring
- Integration with existing renderers

## Contributing

When adding new interaction features:

1. **Follow modular design**: Each feature should be self-contained
2. **Include comprehensive tests**: Unit, integration, and performance tests
3. **Support all input methods**: Mouse, touch, and keyboard
4. **Consider accessibility**: Screen readers, keyboard navigation, voice control
5. **Optimize for performance**: Use spatial indexing, viewport culling, batching
6. **Document thoroughly**: Types, examples, and usage patterns

## License

This interaction system is part of the Knowledge Network library and follows the same license terms.