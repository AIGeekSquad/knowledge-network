/**
 * InteractionController provides unified interaction handling across all renderers.
 *
 * Features:
 * - Renderer-agnostic pan/zoom/selection behavior
 * - Gesture recognition for touch and mouse
 * - Keyboard shortcuts and accessibility
 * - Smooth animations and transitions
 * - Event delegation to renderers
 * - Performance optimization
 */

import type { Point2D, Rectangle } from '../spatial/types';
import type { PositionedNode } from '../layout/LayoutEngine';
import type { IRenderer } from '../rendering/IRenderer';
import type {
  InteractionConfig, InteractionFeatures,
  InteractionState,
  InteractionEventHandlers,
  ViewportChangeEvent,
  SelectionChangeEvent,
  NodeInteractionEvent,
  GestureEvent,
  SelectionRegion, SelectionMode,
  ViewportState as IViewportState,
} from './types';
import {
  DEFAULT_INTERACTION_CONFIG,
  createInteractionState,
  calculateDistance,
  throttle,
} from './types';

import { ViewportState, type IViewportState } from './ViewportState';
import { GestureRecognizer } from './GestureRecognizer';
import { AnimationSystem } from './AnimationSystem';
import { SpatialIndexer } from '../spatial/SpatialIndexer';
import { EventEmitter } from '../utils/EventEmitter';

export class InteractionController extends EventEmitter {
  private config: InteractionConfig;
  private state: InteractionState;
  private viewport: ViewportState;
  private previousViewportState: Readonly<IViewportState> | null = null;
  private gestureRecognizer: GestureRecognizer;
  private animationSystem: AnimationSystem;

  // External dependencies
  private container: HTMLElement | null = null;
  private renderer: IRenderer | null = null;
  private spatialIndexer: SpatialIndexer | null = null;
  private nodes: PositionedNode[] = [];

  // Event handling
  private eventHandlers: InteractionEventHandlers = {};
  private boundEventListeners = new Map<string, EventListener>();
  private isAttached = false;

  // Performance optimization
  private throttledRender: () => void;
  private throttledNodeQuery: (point: Point2D) => PositionedNode | null;

  // Selection state
  private selectionRegion: SelectionRegion | null = null;
  private isSelecting = false;

  // Keyboard state
  private keysPressed = new Set<string>();

  constructor(config: Partial<InteractionConfig> = {}) {
    super();

    this.config = { ...DEFAULT_INTERACTION_CONFIG, ...config };
    this.state = createInteractionState();
    this.viewport = new ViewportState(800, 600, this.config); // Default size

    this.gestureRecognizer = new GestureRecognizer({
      tapTimeout: this.config.gestures.tapTimeout,
      doubleTapTimeout: this.config.gestures.doubleTapTimeout,
      longPressTimeout: this.config.gestures.longPressTimeout,
      pinchThreshold: this.config.gestures.pinchThreshold,
      panThreshold: this.config.gestures.panThreshold,
      swipeThreshold: this.config.gestures.swipeThreshold,
    });

    this.animationSystem = new AnimationSystem({
      defaultDuration: this.config.animation.defaultDuration,
      defaultEasing: this.config.animation.defaultEasing,
      enableGpuAcceleration: this.config.animation.enableGpuAcceleration,
    });

    this.setupGestureHandlers();
    this.createThrottledFunctions();
  }

  // === Initialization ===

  /**
   * Initialize the interaction controller with container and renderer
   */
  initialize(
    container: HTMLElement,
    renderer: IRenderer,
    spatialIndexer?: SpatialIndexer
  ): void {
    this.container = container;
    this.renderer = renderer;
    this.spatialIndexer = spatialIndexer || null;

    // Update viewport dimensions
    const rect = container.getBoundingClientRect();
    this.viewport.updateDimensions(rect.width, rect.height);

    this.attachEventListeners();
  }

  /**
   * Destroy and clean up the interaction controller
   */
  destroy(): void {
    this.detachEventListeners();
    this.animationSystem.stop();
    this.gestureRecognizer.reset();
    this.removeAllListeners();

    this.container = null;
    this.renderer = null;
    this.spatialIndexer = null;
    this.nodes = [];
  }

  // === Configuration ===

  /**
   * Update interaction configuration
   */
  updateConfig(config: Partial<InteractionConfig>): void {
    this.config = { ...this.config, ...config };

    // Update child systems
    this.gestureRecognizer.updateConfig({
      tapTimeout: this.config.gestures.tapTimeout,
      doubleTapTimeout: this.config.gestures.doubleTapTimeout,
      longPressTimeout: this.config.gestures.longPressTimeout,
      pinchThreshold: this.config.gestures.pinchThreshold,
      panThreshold: this.config.gestures.panThreshold,
      swipeThreshold: this.config.gestures.swipeThreshold,
    });

    this.animationSystem.updateConfig({
      defaultDuration: this.config.animation.defaultDuration,
      defaultEasing: this.config.animation.defaultEasing,
      enableGpuAcceleration: this.config.animation.enableGpuAcceleration,
    });

    this.createThrottledFunctions();
  }

  /**
   * Get current configuration
   */
  getConfig(): InteractionConfig {
    return { ...this.config };
  }

  // === Feature Control ===

  enablePan(enabled: boolean): void {
    this.config.features.panWithMouse = enabled;
  }

  enableZoom(enabled: boolean): void {
    this.config.features.mouseWheelZoom = enabled;
  }

  enableSelection(enabled: boolean): void {
    this.config.features.singleSelect = enabled;
    this.config.features.multiSelect = enabled;
  }

  // === Event Handler Registration ===

  setEventHandlers(handlers: Partial<InteractionEventHandlers>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  // === Viewport Control ===

  /**
   * Set zoom level programmatically
   */
  async setZoom(zoom: number, center?: Point2D, animated = true): Promise<void> {
    if (animated && this.config.features.animatedTransitions) {
      await this.animationSystem.animateZoom(this.viewport, zoom, center);
    } else {
      this.viewport.setZoom(zoom, center);
    }

    this.updateRenderer();
    this.emitViewportChangeEvent('zoom');
  }

  /**
   * Set pan offset programmatically
   */
  async setPan(pan: Point2D, animated = true): Promise<void> {
    if (animated && this.config.features.animatedTransitions) {
      await this.animationSystem.animatePan(this.viewport, pan);
    } else {
      this.viewport.setPan(pan);
    }

    this.updateRenderer();
    this.emitViewportChangeEvent('pan');
  }

  /**
   * Reset viewport to initial state
   */
  async resetView(animated = true): Promise<void> {
    const initialZoom = this.config.viewport.initialZoom ?? 1;
    const initialPan = this.config.viewport.initialPan ?? { x: 0, y: 0 };

    if (animated && this.config.features.animatedTransitions) {
      await this.animationSystem.animateReset(this.viewport, initialZoom, initialPan);
    } else {
      this.viewport.reset(initialZoom, initialPan);
    }

    this.updateRenderer();
    this.emitViewportChangeEvent('reset');
  }

  /**
   * Fit graph to viewport
   */
  async fitToGraph(padding = 50, animated = true): Promise<void> {
    if (this.nodes.length === 0) return;

    // Calculate content bounds
    const xs = this.nodes.map(n => n.x);
    const ys = this.nodes.map(n => n.y);
    const contentBounds = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };

    if (animated && this.config.features.animatedTransitions) {
      await this.animationSystem.animateToFit(this.viewport, contentBounds, padding);
    } else {
      this.viewport.fitToBounds(contentBounds, padding);
    }

    this.updateRenderer();
    this.emitViewportChangeEvent('fit');
  }

  /**
   * Zoom to specific node
   */
  async zoomToNode(nodeId: string, zoomLevel = 2, animated = true): Promise<void> {
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const nodeScreenPos = this.viewport.worldToScreen({ x: node.x, y: node.y });
    const viewportCenter = {
      x: this.viewport.getDimensions().width / 2,
      y: this.viewport.getDimensions().height / 2,
    };

    // Calculate pan to center the node
    const panDelta = {
      x: (viewportCenter.x - nodeScreenPos.x) / this.viewport.getZoom(),
      y: (viewportCenter.y - nodeScreenPos.y) / this.viewport.getZoom(),
    };

    const targetPan = {
      x: this.viewport.getPan().x + panDelta.x,
      y: this.viewport.getPan().y + panDelta.y,
    };

    if (animated && this.config.features.animatedTransitions) {
      // Animate pan and zoom simultaneously
      await Promise.all([
        this.animationSystem.animatePan(this.viewport, targetPan),
        this.animationSystem.animateZoom(this.viewport, zoomLevel, viewportCenter),
      ]);
    } else {
      this.viewport.setPan(targetPan);
      this.viewport.setZoom(zoomLevel, viewportCenter);
    }

    this.updateRenderer();
    this.emitViewportChangeEvent('programmatic');
  }

  // === Programmatic Interaction ===

  pan(deltaX: number, deltaY: number): void {
    const currentPan = this.viewport.getPan();
    this.viewport.setPan({
      x: currentPan.x + deltaX / this.viewport.getZoom(),
      y: currentPan.y + deltaY / this.viewport.getZoom(),
    });

    this.updateRenderer();
    this.emitViewportChangeEvent('pan');
  }

  zoom(factor: number, centerPoint?: Point2D): void {
    const center = centerPoint || {
      x: this.viewport.getDimensions().width / 2,
      y: this.viewport.getDimensions().height / 2,
    };

    this.viewport.adjustZoom(factor, center);
    this.updateRenderer();
    this.emitViewportChangeEvent('zoom');
  }

  // === Node Management ===

  /**
   * Update node data for spatial queries
   */
  updateNodes(nodes: PositionedNode[]): void {
    this.nodes = [...nodes];

    // Update spatial indexer if available
    if (this.spatialIndexer) {
      this.spatialIndexer.build(nodes);
    }
  }

  /**
   * Get node at screen coordinates
   */
  getNodeAt(screenX: number, screenY: number): PositionedNode | null {
    return this.throttledNodeQuery({ x: screenX, y: screenY });
  }

  /**
   * Get nodes in screen region
   */
  getNodesInRegion(region: Rectangle): PositionedNode[] {
    if (!this.spatialIndexer) {
      // Fallback: manual check
      const worldRegion = this.viewport.screenRectToWorld(region);
      return this.nodes.filter(node => {
        return (
          node.x >= worldRegion.x &&
          node.x <= worldRegion.x + worldRegion.width &&
          node.y >= worldRegion.y &&
          node.y <= worldRegion.y + worldRegion.height
        );
      });
    }

    const worldRegion = this.viewport.screenRectToWorld(region);
    return this.spatialIndexer.queryRegion(worldRegion);
  }

  // === Selection Management ===

  /**
   * Select nodes by ID
   */
  selectNodes(nodeIds: string[], mode: 'set' | 'add' | 'toggle' = 'set'): void {
    const previousSelection = new Set(this.state.selectedNodes);

    switch (mode) {
      case 'set':
        this.state.selectedNodes = new Set(nodeIds);
        break;
      case 'add':
        nodeIds.forEach(id => this.state.selectedNodes.add(id));
        break;
      case 'toggle':
        nodeIds.forEach(id => {
          if (this.state.selectedNodes.has(id)) {
            this.state.selectedNodes.delete(id);
          } else {
            this.state.selectedNodes.add(id);
          }
        });
        break;
    }

    this.emitSelectionChangeEvent(previousSelection);
    this.updateRenderer();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    if (this.state.selectedNodes.size === 0) return;

    const previousSelection = new Set(this.state.selectedNodes);
    this.state.selectedNodes.clear();

    this.emitSelectionChangeEvent(previousSelection);
    this.updateRenderer();
  }

  /**
   * Get currently selected nodes
   */
  getSelectedNodes(): PositionedNode[] {
    return this.nodes.filter(node => this.state.selectedNodes.has(node.id));
  }

  // === Mouse Event Handlers ===

  handleMouseDown(_event: MouseEvent): void {
    if (!this.container) return;

    event.preventDefault();
    const point = this.getEventPoint(_event);

    this.state.lastPointerPosition = point;
    this.state.panStartPosition = point;

    // Check for node interaction
    const node = this.getNodeAt(point.x, point.y);
    if (node && this.eventHandlers.onNodeClick) {
      this.emitNodeEvent('nodeClick', node, point, _event);
      return;
    }

    // Start pan or selection based on modifiers
    if (this.shouldStartSelection(_event)) {
      this.startRegionSelection(point);
    } else if (this.config.features.panWithMouse) {
      this.state.isPanning = true;
    }

    // Pass to gesture recognizer
    this.gestureRecognizer.handleMouseDown(_event);
  }

  handleMouseMove(_event: MouseEvent): void {
    if (!this.container) return;

    const point = this.getEventPoint(_event);
    const deltaX = point.x - this.state.lastPointerPosition.x;
    const deltaY = point.y - this.state.lastPointerPosition.y;

    // Update hover state
    const hoveredNode = this.getNodeAt(point.x, point.y);
    if (hoveredNode !== this.state.hoveredNode) {
      this.state.hoveredNode = hoveredNode;
      if (hoveredNode && this.eventHandlers.onNodeHover) {
        this.emitNodeEvent('nodeHover', hoveredNode, point, _event);
      }
    }

    // Handle active interactions
    if (this.state.isPanning) {
      this.pan(deltaX, deltaY);
    } else if (this.isSelecting) {
      this.updateRegionSelection(point);
    }

    this.state.lastPointerPosition = point;

    // Pass to gesture recognizer
    this.gestureRecognizer.handleMouseMove(_event);
  }

  handleMouseUp(_event: MouseEvent): void {
    if (!this.container) return;

    const point = this.getEventPoint(_event);

    // Finalize selection
    if (this.isSelecting) {
      this.completeRegionSelection();
    }

    // Reset states
    this.state.isPanning = false;
    this.isSelecting = false;

    // Pass to gesture recognizer
    this.gestureRecognizer.handleMouseUp(_event);
  }

  handleWheel(_event: WheelEvent): void {
    if (!this.container || !this.config.features.mouseWheelZoom) return;

    event.preventDefault();

    const point = this.getEventPoint(_event);
    const scaleFactor = event.deltaY > 0 ? 0.9 : 1.1;

    this.zoom(scaleFactor, point);
  }

  // === Touch Event Handlers ===

  handleTouchStart(_event: TouchEvent): void {
    if (!this.config.features.touchEnabled) return;

    this.gestureRecognizer.handleTouchStart(_event);
  }

  handleTouchMove(_event: TouchEvent): void {
    if (!this.config.features.touchEnabled) return;

    this.gestureRecognizer.handleTouchMove(_event);
  }

  handleTouchEnd(_event: TouchEvent): void {
    if (!this.config.features.touchEnabled) return;

    this.gestureRecognizer.handleTouchEnd(_event);
  }

  // === Keyboard Event Handlers ===

  handleKeyboard(_event: KeyboardEvent): void {
    if (!this.config.features.keyboardNavigation) return;

    const key = event.key.toLowerCase();

    if (event.type === 'keydown') {
      this.keysPressed.add(key);
    } else if (event.type === 'keyup') {
      this.keysPressed.delete(key);
    }

    // Handle shortcuts
    if (event.type === 'keydown') {
      switch (key) {
        case this.config.features.resetShortcut:
          event.preventDefault();
          this.resetView();
          break;

        case this.config.features.fitShortcut:
          event.preventDefault();
          this.fitToGraph();
          break;

        case 'escape':
          event.preventDefault();
          this.clearSelection();
          this.animationSystem.cancelAllAnimations();
          break;

        case 'arrowup':
          event.preventDefault();
          this.pan(0, event.shiftKey ? -50 : -20);
          break;

        case 'arrowdown':
          event.preventDefault();
          this.pan(0, event.shiftKey ? 50 : 20);
          break;

        case 'arrowleft':
          event.preventDefault();
          this.pan(event.shiftKey ? -50 : -20, 0);
          break;

        case 'arrowright':
          event.preventDefault();
          this.pan(event.shiftKey ? 50 : 20, 0);
          break;

        case '+':
        case '=':
          event.preventDefault();
          this.zoom(1.2);
          break;

        case '-':
          event.preventDefault();
          this.zoom(0.8);
          break;
      }
    }
  }

  // === Internal Event Handling ===

  private setupGestureHandlers(): void {
    this.gestureRecognizer.on('tap', (_event: GestureEvent) => {
      const node = this.getNodeAt(event.data.currentPosition.x, event.data.currentPosition.y);

      if (node) {
        // Node tap
        if (this.config.features.singleSelect) {
          const isMultiSelect = this.keysPressed.has('control') || this.keysPressed.has('meta');
          this.selectNodes([node.id], isMultiSelect ? 'toggle' : 'set');
        }
      } else {
        // Background tap
        if (!this.keysPressed.has('control') && !this.keysPressed.has('meta')) {
          this.clearSelection();
        }
      }
    });

    this.gestureRecognizer.on('doubleTap', (_event: GestureEvent) => {
      if (this.config.features.doubleClickZoom) {
        this.zoom(2, event.data.currentPosition);
      }
    });

    this.gestureRecognizer.on('pinch', (_event: GestureEvent) => {
      if (this.config.features.pinchZoom && event.data.scale) {
        this.viewport.setZoom(
          this.viewport.getZoom() * event.data.scale,
          event.data.currentPosition
        );
        this.updateRenderer();
      }
    });

    this.gestureRecognizer.on('pan', (_event: GestureEvent) => {
      if (event.data.deltaPosition) {
        this.pan(event.data.deltaPosition.x, event.data.deltaPosition.y);
      }
    });

    this.gestureRecognizer.on('twoFingerPan', (_event: GestureEvent) => {
      if (event.data.deltaPosition) {
        this.pan(event.data.deltaPosition.x, event.data.deltaPosition.y);
      }
    });
  }

  private attachEventListeners(): void {
    if (!this.container || this.isAttached) return;

    const events: Array<[string, EventListener]> = [
      ['mousedown', this.handleMouseDown.bind(this)],
      ['mousemove', this.handleMouseMove.bind(this)],
      ['mouseup', this.handleMouseUp.bind(this)],
      ['wheel', this.handleWheel.bind(this)],
      ['touchstart', this.handleTouchStart.bind(this)],
      ['touchmove', this.handleTouchMove.bind(this)],
      ['touchend', this.handleTouchEnd.bind(this)],
      ['keydown', this.handleKeyboard.bind(this)],
      ['keyup', this.handleKeyboard.bind(this)],
    ];

    events.forEach(([eventType, handler]) => {
      this.boundEventListeners.set(eventType, handler);

      if (eventType.startsWith('touch') || eventType.startsWith('mouse') || eventType === 'wheel') {
        this.container!.addEventListener(eventType, handler, { passive: false });
      } else {
        window.addEventListener(eventType, handler);
      }
    });

    this.isAttached = true;
  }

  private detachEventListeners(): void {
    if (!this.container || !this.isAttached) return;

    this.boundEventListeners.forEach((handler, eventType) => {
      if (eventType.startsWith('touch') || eventType.startsWith('mouse') || eventType === 'wheel') {
        this.container!.removeEventListener(eventType, handler);
      } else {
        window.removeEventListener(eventType, handler);
      }
    });

    this.boundEventListeners.clear();
    this.isAttached = false;
  }

  private getEventPoint(_event: MouseEvent | Touch): Point2D {
    if (!this.container) return { x: 0, y: 0 };

    const rect = this.container.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  private shouldStartSelection(_event: MouseEvent): boolean {
    return (
      this.config.features.regionSelect &&
      (event.shiftKey || event.ctrlKey || event.metaKey)
    );
  }

  private startRegionSelection(startPoint: Point2D): void {
    this.isSelecting = true;
    this.selectionRegion = {
      type: 'rectangle',
      bounds: { startPoint, endPoint: startPoint },
    };
  }

  private updateRegionSelection(currentPoint: Point2D): void {
    if (!this.selectionRegion) return;

    if (this.selectionRegion.type === 'rectangle' && 'startPoint' in this.selectionRegion.bounds) {
      this.selectionRegion.bounds.endPoint = currentPoint;
    }

    // Visual feedback could be implemented here
  }

  private completeRegionSelection(): void {
    if (!this.selectionRegion) return;

    if (this.selectionRegion.type === 'rectangle' && 'startPoint' in this.selectionRegion.bounds) {
      const { startPoint, endPoint } = this.selectionRegion.bounds;

      const rect: Rectangle = {
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      };

      const nodesInRegion = this.getNodesInRegion(rect);
      const nodeIds = nodesInRegion.map(n => n.id);

      if (nodeIds.length > 0) {
        const isMultiSelect = this.keysPressed.has('control') || this.keysPressed.has('meta');
        this.selectNodes(nodeIds, isMultiSelect ? 'add' : 'set');
      }
    }

    this.selectionRegion = null;
    this.isSelecting = false;
  }

  private createThrottledFunctions(): void {
    this.throttledRender = throttle(() => {
      this.updateRenderer();
    }, this.config.features.throttleDelay);

    this.throttledNodeQuery = throttle((point: Point2D) => {
      if (!this.spatialIndexer) {
        // Fallback: manual search
        const worldPoint = this.viewport.screenToWorld(point);
        return this.nodes.find(node => {
          const distance = calculateDistance(worldPoint, { x: node.x, y: node.y });
          return distance <= (node.radius || 10);
        }) || null;
      }

      const worldPoint = this.viewport.screenToWorld(point);
      const nearby = this.spatialIndexer.queryPoint(worldPoint, 15); // 15px tolerance
      return nearby.length > 0 ? nearby[0] : null;
    }, this.config.features.throttleDelay);
  }

  private updateRenderer(): void {
    if (!this.renderer) return;

    // Update renderer transform
    const transform = {
      x: this.viewport.getPan().x,
      y: this.viewport.getPan().y,
      scale: this.viewport.getZoom(),
    };

    this.renderer.setTransform(transform);

    // Highlight selected nodes
    if (this.state.selectedNodes.size > 0) {
      this.renderer.highlightNodes(Array.from(this.state.selectedNodes));
    }
  }

  private emitViewportChangeEvent(reason: ViewportChangeEvent['reason']): void {
    const currentState = this.viewport.getState();
    const _event: ViewportChangeEvent = {
      type: 'viewportChange',
      viewport: currentState,
      previousViewport: this.previousViewportState || currentState,
      reason,
      _timestamp: Date.now(),
      cancelled: false,
    };

    // Update previous state for next time
    this.previousViewportState = currentState;

    if (this.eventHandlers.onViewportChange) {
      this.eventHandlers.onViewportChange(_event);
    }

    this.emit('viewportChange', _event);
  }

  private emitSelectionChangeEvent(previousSelection: Set<string>): void {
    const selectedNodes = this.getSelectedNodes();
    const previousNodes = this.nodes.filter(n => previousSelection.has(n.id));

    const addedNodes = selectedNodes.filter(n => !previousSelection.has(n.id));
    const removedNodes = previousNodes.filter(n => !this.state.selectedNodes.has(n.id));

    const _event: SelectionChangeEvent = {
      type: 'selectionChange',
      selectedNodes,
      addedNodes,
      removedNodes,
      _timestamp: Date.now(),
      cancelled: false,
    };

    if (this.eventHandlers.onSelectionChange) {
      this.eventHandlers.onSelectionChange(_event);
    }

    this.emit('selectionChange', _event);
  }

  private emitNodeEvent(
    eventType: 'nodeClick' | 'nodeHover',
    node: PositionedNode,
    position: Point2D,
    originalEvent: MouseEvent | TouchEvent
  ): void {
    const _event: NodeInteractionEvent = {
      type: eventType,
      node,
      position,
      originalEvent,
      _timestamp: Date.now(),
      cancelled: false,
    };

    const handler = eventType === 'nodeClick'
      ? this.eventHandlers.onNodeClick
      : this.eventHandlers.onNodeHover;

    if (handler) {
      handler(_event);
    }

    this.emit(eventType, _event);
  }

  // === Public State Access ===

  getViewportState(): Readonly<IViewportState> {
    return this.viewport.getState();
  }

  getInteractionState(): Readonly<InteractionState> {
    return { ...this.state };
  }

  isAnimating(): boolean {
    return this.animationSystem.isAnimating();
  }

  getPerformanceStats() {
    return {
      animation: this.animationSystem.getPerformanceStats(),
      selectedNodeCount: this.state.selectedNodes.size,
      totalNodeCount: this.nodes.length,
      spatialIndexEnabled: !!this.spatialIndexer,
    };
  }
}