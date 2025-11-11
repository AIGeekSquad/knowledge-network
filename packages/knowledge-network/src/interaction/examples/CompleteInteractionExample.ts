/**
 * Complete Interaction System Example
 *
 * Demonstrates how to set up and use the full interaction system
 * with all features including mobile and accessibility support.
 */

import {
  createAutoInteractionController,
  createCompleteInteractionSystem,
  InteractionEventSystem,
  InteractionController,
  createMobileOptimizer,
  createAccessibilitySupport,
  MobileOptimizer,
  AccessibilitySupport,
  INTERACTION_PRESETS,
  type InteractionConfig,
  type ViewportChangeEvent,
  type SelectionChangeEvent,
  type NodeInteractionEvent,
} from '../index';

import { SpatialIndexer } from '../../spatial/SpatialIndexer';
import type { PositionedNode } from '../../layout/LayoutEngine';

// Mock renderer for example
class ExampleRenderer {
  type = 'canvas' as const;
  private container: HTMLElement | null = null;

  initialize(container: HTMLElement) {
    this.container = container;
  }

  destroy() {}
  clear() {}
  render() {}
  renderNodes() {}
  renderEdges() {}
  renderLabels() {}
  updateNodePositions() {}
  updateEdgePositions() {}
  updateNodeStyles() {}
  updateEdgeStyles() {}
  highlightNodes() {}
  highlightEdges() {}
  clearHighlights() {}
  setTransform() {}
  getTransform() { return { x: 0, y: 0, scale: 1 }; }
  getNodeElement() { return null; }
  getEdgeElement() { return null; }
  getContainer() { return this.container || document.createElement('div'); }
  enableBatching() {}
  flush() {}
}

// === Basic Setup Example ===

export function createBasicInteractionSystem(container: HTMLElement): {
  controller: InteractionController;
  eventSystem: InteractionEventSystem;
} {
  // Create renderer and spatial indexer
  const renderer = new ExampleRenderer();
  const spatialIndexer = new SpatialIndexer();

  // Create interaction system with auto-detection
  const { controller, eventSystem, connect } = createCompleteInteractionSystem();

  // Connect to container and renderer
  connect(container, renderer, spatialIndexer);

  return { controller, eventSystem };
}

// === Advanced Setup Example ===

export function createAdvancedInteractionSystem(
  container: HTMLElement,
  options: {
    preset?: keyof typeof INTERACTION_PRESETS;
    enableMobile?: boolean;
    enableAccessibility?: boolean;
    customConfig?: Partial<InteractionConfig>;
  } = {}
): {
  controller: InteractionController;
  eventSystem: InteractionEventSystem;
  mobileOptimizer?: MobileOptimizer;
  accessibilitySupport?: AccessibilitySupport;
} {
  const {
    preset = 'default',
    enableMobile = true,
    enableAccessibility = true,
    customConfig = {},
  } = options;

  // Create base config from preset
  const baseConfig = { ...INTERACTION_PRESETS[preset], ...customConfig };

  // Create renderer and spatial indexer
  const renderer = new ExampleRenderer();
  const spatialIndexer = new SpatialIndexer();

  // Create interaction controller
  const controller = new InteractionController(baseConfig);
  const eventSystem = new InteractionEventSystem();

  // Initialize controller
  controller.initialize(container, renderer, spatialIndexer);

  // Setup event forwarding
  setupEventForwarding(controller, eventSystem);

  // Create optional mobile and accessibility support
  let mobileOptimizer: MobileOptimizer | undefined;
  let accessibilitySupport: AccessibilitySupport | undefined;

  if (enableMobile) {
    mobileOptimizer = createMobileOptimizer(controller, {
      enhancedTouchTargets: true,
      enableHaptics: true,
      batteryOptimization: true,
    });
  }

  if (enableAccessibility) {
    accessibilitySupport = createAccessibilitySupport(controller, {
      announceChanges: true,
      enableKeyboardNavigation: true,
      enableVoiceCommands: true,
    });
  }

  return {
    controller,
    eventSystem,
    mobileOptimizer,
    accessibilitySupport,
  };
}

// === Event System Integration ===

function setupEventForwarding(
  controller: InteractionController,
  eventSystem: InteractionEventSystem
): void {
  // Forward controller events to event system
  controller.on('viewportChange', (_event: ViewportChangeEvent) => {
    eventSystem.emitInteractionEvent('viewport:change', _event);

    // Emit specific viewport events
    switch (event.reason) {
      case 'pan':
        eventSystem.emitInteractionEvent('viewport:pan', _event);
        break;
      case 'zoom':
        eventSystem.emitInteractionEvent('viewport:zoom', _event);
        break;
      case 'reset':
        eventSystem.emitInteractionEvent('viewport:reset', _event);
        break;
      case 'fit':
        eventSystem.emitInteractionEvent('viewport:fit', _event);
        break;
    }
  });

  controller.on('selectionChange', (_event: SelectionChangeEvent) => {
    eventSystem.emitInteractionEvent('selection:change', _event);

    if (event.selectedNodes.length === 0) {
      eventSystem.emitInteractionEvent('selection:clear', _event);
    }
  });

  controller.on('nodeClick', (_event: NodeInteractionEvent) => {
    eventSystem.emitInteractionEvent('node:click', _event);
  });

  controller.on('nodeHover', (_event: NodeInteractionEvent) => {
    eventSystem.emitInteractionEvent('node:hover', _event);
  });
}

// === Usage Examples ===

export class InteractionExampleApp {
  private container: HTMLElement;
  private controller: InteractionController;
  private eventSystem: InteractionEventSystem;
  private mobileOptimizer?: MobileOptimizer;
  private accessibilitySupport?: AccessibilitySupport;

  private nodes: PositionedNode[] = [
    { id: 'node1', x: 100, y: 100, radius: 20 },
    { id: 'node2', x: 200, y: 150, radius: 15 },
    { id: 'node3', x: 300, y: 200, radius: 25 },
    { id: 'node4', x: 150, y: 250, radius: 18 },
  ];

  constructor(container: HTMLElement) {
    this.container = container;

    // Create interaction system
    const system = createAdvancedInteractionSystem(container, {
      preset: 'default',
      enableMobile: true,
      enableAccessibility: true,
    });

    this.controller = system.controller;
    this.eventSystem = system.eventSystem;
    this.mobileOptimizer = system.mobileOptimizer;
    this.accessibilitySupport = system.accessibilitySupport;

    this.setupEventHandlers();
    this.setupCustomMiddleware();
    this.loadData();
  }

  private setupEventHandlers(): void {
    // Viewport change handling
    this.eventSystem.on('viewport:change', (_event) => {
      console.log('Viewport changed:', event.viewport);
      this.updateUI(event.viewport);
    });

    // Selection handling
    this.eventSystem.on('selection:change', (_event) => {
      console.log('Selection changed:', event.selectedNodes.length, 'nodes');
      this.updateSelection(event.selectedNodes);
    });

    // Node interaction handling
    this.eventSystem.on('node:click', (_event) => {
      console.log('Node clicked:', event.node.id);
      this.handleNodeClick(event.node);
    });

    // Performance monitoring
    this.eventSystem.on('performance:warning', (_event) => {
      console.warn('Performance warning:', event.warning, event.details);
    });
  }

  private setupCustomMiddleware(): void {
    // Add throttling middleware for viewport events
    const throttleMiddleware = InteractionEventSystem.createThrottleMiddleware(
      'viewport-throttle',
      16 // 60fps
    );

    this.eventSystem.addMiddleware('viewport:pan', throttleMiddleware);
    this.eventSystem.addMiddleware('viewport:zoom', throttleMiddleware);

    // Add logging middleware for debugging
    if (process.env.NODE_ENV === 'development') {
      const loggingMiddleware = InteractionEventSystem.createLoggingMiddleware(
        'debug-logger',
        'debug'
      );

      this.eventSystem.addMiddleware('node:click', loggingMiddleware);
      this.eventSystem.addMiddleware('selection:change', loggingMiddleware);
    }

    // Add viewport bounds filter
    const boundsFilter = InteractionEventSystem.createViewportBoundsFilter(
      'viewport-bounds',
      {
        minZoom: 0.1,
        maxZoom: 10,
        panBounds: { minX: -500, maxX: 500, minY: -500, maxY: 500 },
      }
    );

    this.eventSystem.addFilter('viewport:change', boundsFilter);
  }

  private loadData(): void {
    // Update nodes in interaction controller
    this.controller.updateNodes(this.nodes);

    // Update accessibility support with focusable nodes
    if (this.accessibilitySupport) {
      this.accessibilitySupport.updateFocusableNodes(this.nodes.map(n => n.id));
    }

    // Fit graph to viewport
    this.controller.fitToGraph(50);
  }

  // === UI Integration Methods ===

  private updateUI(viewport: any): void {
    // Update UI elements based on viewport state
    const zoomLevel = Math.round(viewport.zoom * 100);
    const zoomDisplay = document.getElementById('zoom-level');
    if (zoomDisplay) {
      zoomDisplay.textContent = `${zoomLevel}%`;
    }
  }

  private updateSelection(selectedNodes: PositionedNode[]): void {
    // Update selection UI
    const selectionCount = document.getElementById('selection-count');
    if (selectionCount) {
      selectionCount.textContent = `${selectedNodes.length} selected`;
    }

    // Trigger haptic feedback for mobile
    if (this.mobileOptimizer && selectedNodes.length > 0) {
      this.mobileOptimizer.triggerHapticFeedback('selection');
    }
  }

  private handleNodeClick(node: PositionedNode): void {
    // Handle node click - zoom to node
    this.controller.zoomToNode(node.id, 2);

    // Announce for accessibility
    if (this.accessibilitySupport) {
      this.accessibilitySupport.announce(`Focused on ${node.id}`);
    }
  }

  // === Public API ===

  /**
   * Add custom interaction handlers
   */
  setEventHandlers(handlers: {
    onNodeClick?: (node: PositionedNode) => void;
    onSelectionChange?: (nodes: PositionedNode[]) => void;
    onViewportChange?: (viewport: any) => void;
  }): void {
    if (handlers.onNodeClick) {
      this.eventSystem.on('node:click', (_event) => {
        handlers.onNodeClick!(event.node);
      });
    }

    if (handlers.onSelectionChange) {
      this.eventSystem.on('selection:change', (_event) => {
        handlers.onSelectionChange!(event.selectedNodes);
      });
    }

    if (handlers.onViewportChange) {
      this.eventSystem.on('viewport:change', (_event) => {
        handlers.onViewportChange!(event.viewport);
      });
    }
  }

  /**
   * Programmatically control the graph
   */
  async focusOnNode(nodeId: string): Promise<void> {
    await this.controller.zoomToNode(nodeId, 1.5);
  }

  async resetView(): Promise<void> {
    await this.controller.resetView();
  }

  async fitToGraph(): Promise<void> {
    await this.controller.fitToGraph(50);
  }

  selectNodes(nodeIds: string[]): void {
    this.controller.selectNodes(nodeIds);
  }

  clearSelection(): void {
    this.controller.clearSelection();
  }

  /**
   * Update graph data
   */
  updateNodes(nodes: PositionedNode[]): void {
    this.nodes = [...nodes];
    this.controller.updateNodes(nodes);

    if (this.accessibilitySupport) {
      this.accessibilitySupport.updateFocusableNodes(nodes.map(n => n.id));
    }
  }

  /**
   * Configure interaction behavior
   */
  enableFeature(feature: 'pan' | 'zoom' | 'selection', enabled: boolean): void {
    switch (feature) {
      case 'pan':
        this.controller.enablePan(enabled);
        break;
      case 'zoom':
        this.controller.enableZoom(enabled);
        break;
      case 'selection':
        this.controller.enableSelection(enabled);
        break;
    }
  }

  /**
   * Get performance information
   */
  getPerformanceStats(): any {
    return {
      controller: this.controller.getPerformanceStats(),
      eventSystem: this.eventSystem.getEventStats(),
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.controller.destroy();
    this.eventSystem.destroy();
    this.accessibilitySupport?.destroy();
  }
}

// === Factory Function for Easy Usage ===

export function createKnowledgeNetworkInteraction(
  container: HTMLElement,
  nodes: PositionedNode[] = [],
  _options: {
    preset?: keyof typeof INTERACTION_PRESETS;
    enableMobile?: boolean;
    enableAccessibility?: boolean;
    customConfig?: Partial<InteractionConfig>;
  }
): InteractionExampleApp {
  const app = new InteractionExampleApp(container);

  if (nodes.length > 0) {
    app.updateNodes(nodes);
  }

  return app;
}

// === Usage Example ===

export function exampleUsage(): void {
  // Get container element
  const container = document.getElementById('knowledge-network-container');
  if (!container) return;

  // Sample data
  const sampleNodes: PositionedNode[] = [
    { id: 'concept1', x: 100, y: 100, radius: 20 },
    { id: 'concept2', x: 300, y: 150, radius: 25 },
    { id: 'concept3', x: 500, y: 200, radius: 18 },
    { id: 'concept4', x: 200, y: 300, radius: 22 },
    { id: 'concept5', x: 400, y: 350, radius: 15 },
  ];

  // Create interaction system
  const app = createKnowledgeNetworkInteraction(container, sampleNodes, {
    preset: 'desktop',
    enableMobile: true,
    enableAccessibility: true,
  });

  // Set up custom event handlers
  app.setEventHandlers({
    onNodeClick: (node) => {
      console.log(`Node ${node.id} was clicked!`);
    },
    onSelectionChange: (nodes) => {
      console.log(`Selection changed: ${nodes.length} nodes selected`);
    },
    onViewportChange: (viewport) => {
      console.log(`Viewport: zoom=${viewport.zoom}, pan=${viewport.pan.x},${viewport.pan.y}`);
    },
  });

  // Example interactions
  setTimeout(() => {
    app.focusOnNode('concept2');
  }, 1000);

  setTimeout(() => {
    app.selectNodes(['concept1', 'concept3', 'concept5']);
  }, 2000);

  setTimeout(() => {
    app.fitToGraph();
  }, 3000);

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    app.destroy();
  });
}

// Run example if in browser
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', exampleUsage);
}