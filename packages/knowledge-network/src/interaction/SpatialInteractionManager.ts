/**
 * Enhanced InteractionManager with spatial indexing support for efficient node selection.
 *
 * Extends the base InteractionManager with spatial queries, enabling O(log n) performance
 * for mouse interactions, region selection, and ray-based picking.
 *
 * @example
 * ```typescript
 * const spatialInteraction = new SpatialInteractionManager();
 * spatialInteraction.setup(spatialRenderingSystem);
 *
 * // Enhanced node selection with spatial queries
 * spatialInteraction.onNodeClick((nodeId, event, selectionInfo) => {
 *   console.log(`Node ${nodeId} selected with distance ${selectionInfo.distance}`);
 * });
 *
 * // Region selection
 * const selectedNodes = spatialInteraction.selectNodesInRegion(selectionRect);
 * ```
 */

import { EventEmitter } from '../utils/EventEmitter';
import * as d3 from 'd3';
import type { Point } from '../layout/LayoutEngine';
import type { SpatialRenderingSystem, NodeSelectionResult, RegionSelectionResult } from '../rendering/SpatialRenderingSystem';
import { RaycastingUtils } from '../spatial';
import type { Rectangle, Ray2D } from '../spatial/types';

// Enhanced event handlers with spatial information
export type SpatialNodeClickHandler = (nodeId: string, event: MouseEvent, selectionInfo: NodeSelectionResult) => void;
export type SpatialNodeHoverHandler = (nodeId: string | null, selectionInfo?: NodeSelectionResult) => void;
export type RegionSelectionHandler = (selection: RegionSelectionResult, event: MouseEvent) => void;

// Re-export base types
export type {
  Selection,
  DragBehavior,
  HoveredItem,
  Rectangle,
  EdgeClickHandler,
  BackgroundClickHandler,
  KeyboardHandler,
} from '../interaction/InteractionManager';

/**
 * Configuration for spatial interaction behavior.
 */
export interface SpatialInteractionConfig {
  // Node selection
  nodeSelectionRadius: number;
  useRaycastingForSelection: boolean;
  raycastingTolerance: number;

  // Hover behavior
  hoverRadius: number;
  hoverDelay: number;
  useNearestNodeForHover: boolean;

  // Region selection
  enableRegionSelection: boolean;
  regionSelectionKey: 'shift' | 'ctrl' | 'alt';
  minRegionSize: number;

  // Performance
  throttleMouseMove: number;
  enableSpatialDebug: boolean;
}

/**
 * Region selection state.
 */
interface RegionSelectionState {
  active: boolean;
  startPoint: Point;
  currentBounds: Rectangle;
  nodes: string[];
}

/**
 * Enhanced selection implementation with spatial awareness.
 */
class SpatialSelection {
  nodes: string[] = [];
  edges: string[] = [];
  spatialInfo: Map<string, NodeSelectionResult> = new Map();

  isEmpty(): boolean {
    return this.nodes.length === 0 && this.edges.length === 0;
  }

  contains(itemId: string): boolean {
    return this.nodes.includes(itemId) || this.edges.includes(itemId);
  }

  clear(): void {
    this.nodes = [];
    this.edges = [];
    this.spatialInfo.clear();
  }

  addNode(nodeId: string, selectionInfo?: NodeSelectionResult): void {
    if (!this.nodes.includes(nodeId)) {
      this.nodes.push(nodeId);
      if (selectionInfo) {
        this.spatialInfo.set(nodeId, selectionInfo);
      }
    }
  }

  removeNode(nodeId: string): void {
    const index = this.nodes.indexOf(nodeId);
    if (index >= 0) {
      this.nodes.splice(index, 1);
      this.spatialInfo.delete(nodeId);
    }
  }

  getSelectionInfo(nodeId: string): NodeSelectionResult | undefined {
    return this.spatialInfo.get(nodeId);
  }
}

/**
 * Enhanced InteractionManager with spatial indexing support.
 */
export class SpatialInteractionManager extends EventEmitter {
  private renderingSystem: SpatialRenderingSystem | null = null;
  private selection: SpatialSelection = new SpatialSelection();
  private hoveredItem: { nodeId: string; selectionInfo: NodeSelectionResult } | null = null;
  private regionSelection: RegionSelectionState = {
    active: false,
    startPoint: { x: 0, y: 0 },
    currentBounds: { x: 0, y: 0, width: 0, height: 0 },
    nodes: [],
  };

  private config: SpatialInteractionConfig = {
    nodeSelectionRadius: 10,
    useRaycastingForSelection: true,
    raycastingTolerance: 5.0,
    hoverRadius: 15,
    hoverDelay: 100,
    useNearestNodeForHover: true,
    enableRegionSelection: true,
    regionSelectionKey: 'shift',
    minRegionSize: 10,
    throttleMouseMove: 16, // ~60fps
    enableSpatialDebug: false,
  };

  // Enhanced event handlers
  private spatialNodeClickHandlers: SpatialNodeClickHandler[] = [];
  private spatialNodeHoverHandlers: SpatialNodeHoverHandler[] = [];
  private regionSelectionHandlers: RegionSelectionHandler[] = [];

  // Base event handlers (for compatibility)
  private edgeClickHandlers: any[] = [];
  private backgroundClickHandlers: any[] = [];
  private keyDownHandlers: any[] = [];
  private keyUpHandlers: any[] = [];

  // Throttling and state
  private lastMouseMoveTime = 0;
  private hoverTimeout: NodeJS.Timeout | null = null;
  private keyboardEnabled = true;
  private multiSelectKey: 'ctrl' | 'shift' | 'meta' = 'ctrl';

  /**
   * Setup spatial interaction handling.
   */
  setup(renderingSystem: SpatialRenderingSystem): void {
    this.renderingSystem = renderingSystem;
    this.attachEventListeners();
  }

  /**
   * Configure spatial interaction behavior.
   */
  setConfig(config: Partial<SpatialInteractionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration.
   */
  getConfig(): SpatialInteractionConfig {
    return { ...this.config };
  }

  /**
   * Attach enhanced event listeners with spatial capabilities.
   */
  private attachEventListeners(): void {
    if (!this.renderingSystem) return;

    const container = this.renderingSystem.getContainer();
    if (!container) return;

    const svg = container.tagName === 'svg' ? container : container.querySelector('svg');
    if (!svg) return;

    const d3Svg = d3.select(svg);

    // Enhanced click events with spatial queries
    d3Svg.on('click', (event: MouseEvent) => this.handleSpatialClick(event));
    d3Svg.on('dblclick', (event: MouseEvent) => this.handleDoubleClick(event));
    d3Svg.on('contextmenu', (event: MouseEvent) => this.handleRightClick(event));

    // Enhanced hover with spatial queries
    d3Svg.on('mouseover', (event: MouseEvent) => this.handleSpatialMouseOver(event));
    d3Svg.on('mouseout', (event: MouseEvent) => this.handleSpatialMouseOut(event));
    d3Svg.on('mousemove', (event: MouseEvent) => this.handleSpatialMouseMove(event));

    // Region selection events
    if (this.config.enableRegionSelection) {
      d3Svg.on('mousedown', (event: MouseEvent) => this.handleMouseDown(event));
      d3Svg.on('mouseup', (event: MouseEvent) => this.handleMouseUp(event));
    }

    // Keyboard events
    if (this.keyboardEnabled) {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
    }
  }

  /**
   * Handle mouse clicks with spatial node selection.
   */
  private handleSpatialClick = (event: MouseEvent): void => {
    const mousePos = d3.pointer(event);
    const [x, y] = mousePos;

    // Try spatial node selection first
    if (this.renderingSystem?.isSpatialIndexAvailable()) {
      const selectionResult = this.renderingSystem.getNodeAt(x, y, this.config.nodeSelectionRadius);

      if (selectionResult) {
        this.handleSpatialNodeClick(selectionResult.node.id, event, selectionResult);
        return;
      }
    }

    // Check for edge selection (using existing DOM-based method)
    const target = event.target as Element;
    const edgeElement = target.closest('.edge');

    if (edgeElement) {
      const edgeId = edgeElement.getAttribute('data-edge-id') ||
                     Array.from(edgeElement.parentElement!.children).indexOf(edgeElement).toString();
      this.handleEdgeClick(edgeId, event);
      return;
    }

    // Background click
    this.handleBackgroundClick(event);
  };

  /**
   * Handle spatial node clicks with enhanced information.
   */
  private handleSpatialNodeClick(nodeId: string, event: MouseEvent, selectionInfo: NodeSelectionResult): void {
    const multi = this.isMultiSelectPressed(event);
    this.selectSpatialNode(nodeId, selectionInfo, multi);

    this.spatialNodeClickHandlers.forEach(handler => handler(nodeId, event, selectionInfo));
    this.emit('spatialNodeClicked', nodeId, event, selectionInfo);
  }

  /**
   * Handle spatial mouse over with efficient nearest node detection.
   */
  private handleSpatialMouseOver = (event: MouseEvent): void => {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    const delayedHover = () => {
      const mousePos = d3.pointer(event);
      const [x, y] = mousePos;

      if (this.renderingSystem?.isSpatialIndexAvailable()) {
        const selectionResult = this.renderingSystem.getNodeAt(x, y, this.config.hoverRadius);

        if (selectionResult && (!this.hoveredItem || this.hoveredItem.nodeId !== selectionResult.node.id)) {
          this.hoveredItem = {
            nodeId: selectionResult.node.id,
            selectionInfo: selectionResult,
          };

          this.spatialNodeHoverHandlers.forEach(handler =>
            handler(selectionResult.node.id, selectionResult)
          );
          this.emit('spatialNodeHover', selectionResult.node.id, selectionResult);
        }
      }
    };

    if (this.config.hoverDelay > 0) {
      this.hoverTimeout = setTimeout(delayedHover, this.config.hoverDelay);
    } else {
      delayedHover();
    }
  };

  /**
   * Handle spatial mouse out.
   */
  private handleSpatialMouseOut = (_event: MouseEvent): void => {
    if (this.hoveredItem) {
      this.spatialNodeHoverHandlers.forEach(handler => handler(null));
      this.emit('spatialNodeHoverEnd', this.hoveredItem.nodeId);
      this.hoveredItem = null;
    }

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  };

  /**
   * Handle spatial mouse move with throttling.
   */
  private handleSpatialMouseMove = (event: MouseEvent): void => {
    const now = performance.now();
    if (now - this.lastMouseMoveTime < this.config.throttleMouseMove) {
      return;
    }
    this.lastMouseMoveTime = now;

    if (this.hoveredItem) {
      this.hoveredItem.selectionInfo.selectionPoint = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    // Handle region selection
    if (this.regionSelection.active) {
      this.updateRegionSelection(event);
    }
  };

  /**
   * Handle mouse down for region selection.
   */
  private handleMouseDown = (event: MouseEvent): void => {
    if (!this.isRegionSelectionKeyPressed(event)) {
      return;
    }

    const mousePos = d3.pointer(event);
    const [x, y] = mousePos;

    this.regionSelection = {
      active: true,
      startPoint: { x, y },
      currentBounds: { x, y, width: 0, height: 0 },
      nodes: [],
    };

    event.preventDefault();
    this.emit('regionSelectionStart', this.regionSelection.startPoint);
  };

  /**
   * Handle mouse up for region selection.
   */
  private handleMouseUp = (event: MouseEvent): void => {
    if (!this.regionSelection.active) {
      return;
    }

    // Only process if region is large enough
    if (this.regionSelection.currentBounds.width > this.config.minRegionSize ||
        this.regionSelection.currentBounds.height > this.config.minRegionSize) {

      const selectionResult = this.getNodesInRegion(this.regionSelection.currentBounds);
      this.regionSelectionHandlers.forEach(handler => handler(selectionResult, event));
      this.emit('regionSelectionEnd', selectionResult, event);
    }

    this.regionSelection.active = false;
    this.emit('regionSelectionCancel');
  };

  /**
   * Update region selection bounds.
   */
  private updateRegionSelection(event: MouseEvent): void {
    if (!this.regionSelection.active) {
      return;
    }

    const mousePos = d3.pointer(event);
    const [x, y] = mousePos;

    const minX = Math.min(this.regionSelection.startPoint.x, x);
    const minY = Math.min(this.regionSelection.startPoint.y, y);
    const maxX = Math.max(this.regionSelection.startPoint.x, x);
    const maxY = Math.max(this.regionSelection.startPoint.y, y);

    this.regionSelection.currentBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    this.emit('regionSelectionUpdate', this.regionSelection.currentBounds);
  }

  /**
   * Select node with spatial information.
   */
  selectSpatialNode(nodeId: string, selectionInfo: NodeSelectionResult, multi = false): void {
    if (!multi) {
      this.selection.clear();
    }

    if (this.selection.contains(nodeId)) {
      if (multi) {
        this.selection.removeNode(nodeId);
      }
    } else {
      this.selection.addNode(nodeId, selectionInfo);
    }

    this.updateSelectionHighlight();
    this.emit('selectionChanged', this.getSelection());
  }

  /**
   * Get nodes in a rectangular region.
   */
  getNodesInRegion(bounds: Rectangle): RegionSelectionResult {
    if (!this.renderingSystem) {
      return {
        nodes: [],
        totalCount: 0,
        bounds,
        containsAll: false,
      };
    }

    return this.renderingSystem.getNodesInRegion(bounds);
  }

  /**
   * Select nodes in a region.
   */
  selectNodesInRegion(bounds: Rectangle, multi = false): RegionSelectionResult {
    const regionResult = this.getNodesInRegion(bounds);

    if (!multi) {
      this.selection.clear();
    }

    for (const node of regionResult.nodes) {
      this.selection.addNode(node.id);
    }

    this.updateSelectionHighlight();
    this.emit('selectionChanged', this.getSelection());

    return regionResult;
  }

  /**
   * Get nodes near a point with distance information.
   */
  getNodesNearPoint(point: Point, radius: number): Array<{ node: any; distance: number }> {
    if (!this.renderingSystem?.isSpatialIndexAvailable()) {
      return [];
    }

    return this.renderingSystem.getNodesWithinDistance(point, radius);
  }

  /**
   * Find the nearest node to a point.
   */
  findNearestNode(point: Point, maxDistance = Infinity): NodeSelectionResult | null {
    if (!this.renderingSystem?.isSpatialIndexAvailable()) {
      return null;
    }

    return this.renderingSystem.getNodeAt(point.x, point.y, maxDistance);
  }

  /**
   * Perform ray-based node selection.
   */
  selectNodesByRay(ray: Ray2D): any[] { // RayIntersection[]
    if (!this.renderingSystem?.isSpatialIndexAvailable()) {
      return [];
    }

    return this.renderingSystem.getNodesOnRay(ray);
  }

  /**
   * Create ray from mouse coordinates.
   */
  createRayFromMouse(mouseX: number, mouseY: number): Ray2D {
    if (!this.renderingSystem) {
      return RaycastingUtils.createRayFromMouse(mouseX, mouseY, 800, 600);
    }

    return this.renderingSystem.createRayFromMouse(mouseX, mouseY);
  }

  // === Event Handler Registration (Enhanced) ===

  onSpatialNodeClick(handler: SpatialNodeClickHandler): void {
    this.spatialNodeClickHandlers.push(handler);
  }

  onSpatialNodeHover(handler: SpatialNodeHoverHandler): void {
    this.spatialNodeHoverHandlers.push(handler);
  }

  onRegionSelection(handler: RegionSelectionHandler): void {
    this.regionSelectionHandlers.push(handler);
  }

  // === Base compatibility methods ===

  private handleEdgeClick(edgeId: string, event: MouseEvent): void {
    this.edgeClickHandlers.forEach(handler => handler(edgeId, event));
    this.emit('edgeClicked', edgeId, event);
  }

  private handleBackgroundClick(event: MouseEvent): void {
    if (!this.isMultiSelectPressed(event)) {
      this.clearSelection();
    }

    this.backgroundClickHandlers.forEach(handler => handler(event));
    this.emit('backgroundClicked', event);
  }

  private handleDoubleClick = (_event: MouseEvent): void => {
    // Implementation for double-click if needed
  };

  private handleRightClick = (event: MouseEvent): void => {
    // Implementation for right-click if needed
    event.preventDefault();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    this.keyDownHandlers.forEach(handler => handler(event));
    this.emit('keyDown', event);

    if (event.key === 'Escape') {
      this.clearSelection();
      if (this.regionSelection.active) {
        this.regionSelection.active = false;
        this.emit('regionSelectionCancel');
      }
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    this.keyUpHandlers.forEach(handler => handler(event));
    this.emit('keyUp', event);
  };

  private isMultiSelectPressed(event: MouseEvent | KeyboardEvent): boolean {
    switch (this.multiSelectKey) {
      case 'ctrl': return event.ctrlKey;
      case 'shift': return event.shiftKey;
      case 'meta': return event.metaKey;
      default: return false;
    }
  }

  private isRegionSelectionKeyPressed(event: MouseEvent): boolean {
    switch (this.config.regionSelectionKey) {
      case 'ctrl': return event.ctrlKey;
      case 'shift': return event.shiftKey;
      case 'alt': return event.altKey;
      default: return false;
    }
  }

  private updateSelectionHighlight(): void {
    if (!this.renderingSystem) return;

    if (this.selection.nodes.length > 0) {
      this.renderingSystem.highlightNodes(this.selection.nodes, {
        color: '#4a90e2',
        opacity: 1,
        scale: 1.1,
      });
    }
  }

  clearSelection(): void {
    this.selection.clear();
    this.renderingSystem?.clearHighlights();
    this.emit('selectionChanged', this.getSelection());
  }

  getSelection(): any {
    return {
      nodes: [...this.selection.nodes],
      edges: [...this.selection.edges],
      spatialInfo: new Map(this.selection.spatialInfo),
      isEmpty: () => this.selection.isEmpty(),
      contains: (itemId: string) => this.selection.contains(itemId),
      clear: () => this.clearSelection(),
    };
  }

  destroy(): void {
    this.selection.clear();
    this.hoveredItem = null;
    this.regionSelection.active = false;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    this.removeAllListeners();
  }
}