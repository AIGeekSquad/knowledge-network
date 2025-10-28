import { EventEmitter } from '../utils/EventEmitter';
import * as d3 from 'd3';
import type { RenderingSystem } from '../rendering/RenderingSystem';
import type { Point } from '../layout/LayoutEngine';

export interface Selection {
  nodes: string[];
  edges: string[];
  isEmpty(): boolean;
  contains(itemId: string): boolean;
  clear(): void;
}

export interface DragBehavior {
  enabled: boolean;
  threshold?: number;
  constrainToViewport?: boolean;
  onDragStart?: (nodeId: string) => void;
  onDrag?: (nodeId: string, position: Point) => void;
  onDragEnd?: (nodeId: string) => void;
}

export interface HoveredItem {
  type: 'node' | 'edge';
  id: string;
  position: Point;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type NodeClickHandler = (nodeId: string, event: MouseEvent) => void;
export type EdgeClickHandler = (edgeId: string, event: MouseEvent) => void;
export type BackgroundClickHandler = (event: MouseEvent) => void;
export type NodeHoverHandler = (nodeId: string | null) => void;
export type EdgeHoverHandler = (edgeId: string | null) => void;
export type KeyboardHandler = (event: KeyboardEvent) => void;

class SelectionImpl implements Selection {
  nodes: string[] = [];
  edges: string[] = [];

  isEmpty(): boolean {
    return this.nodes.length === 0 && this.edges.length === 0;
  }

  contains(itemId: string): boolean {
    return this.nodes.includes(itemId) || this.edges.includes(itemId);
  }

  clear(): void {
    this.nodes = [];
    this.edges = [];
  }
}

/**
 * Manages all user interactions with the graph visualization.
 *
 * @remarks
 * The InteractionManager handles selection, dragging, hovering, clicking,
 * and keyboard interactions. It works with the RenderingSystem to provide
 * visual feedback for interactions and emits events for state changes.
 *
 * @example
 * ```typescript
 * const interactionManager = new InteractionManager();
 * interactionManager.setup(renderingSystem);
 *
 * interactionManager.onNodeClick((nodeId, event) => {
 *   console.log(`Node ${nodeId} clicked`);
 * });
 *
 * interactionManager.setDragEnabled(true);
 * ```
 */
export class InteractionManager extends EventEmitter {
  private renderingSystem: RenderingSystem | null = null;
  private selection: SelectionImpl = new SelectionImpl();
  private hoveredItem: HoveredItem | null = null;
  private dragBehavior: DragBehavior = { enabled: false };
  private isDraggingNode: boolean = false;
  private draggedNodeId: string | null = null;
  private hoverEnabled: boolean = true;
  private hoverDelay: number = 0;
  private hoverTimeout: NodeJS.Timeout | null = null;
  private keyboardEnabled: boolean = true;
  private multiSelectKey: 'ctrl' | 'shift' | 'meta' = 'ctrl';

  // Event handlers
  private nodeClickHandlers: NodeClickHandler[] = [];
  private nodeDoubleClickHandlers: NodeClickHandler[] = [];
  private nodeRightClickHandlers: NodeClickHandler[] = [];
  private edgeClickHandlers: EdgeClickHandler[] = [];
  private backgroundClickHandlers: BackgroundClickHandler[] = [];
  private nodeHoverHandlers: NodeHoverHandler[] = [];
  private nodeHoverEndHandlers: NodeHoverHandler[] = [];
  private edgeHoverHandlers: EdgeHoverHandler[] = [];
  private edgeHoverEndHandlers: EdgeHoverHandler[] = [];
  private keyDownHandlers: KeyboardHandler[] = [];
  private keyUpHandlers: KeyboardHandler[] = [];

  /**
   * Setup interaction handling with a rendering system
   */
  setup(renderingSystem: RenderingSystem): void {
    this.renderingSystem = renderingSystem;
    this.attachEventListeners();
  }

  /**
   * Destroy and clean up event listeners
   */
  destroy(): void {
    this.detachEventListeners();
    this.selection.clear();
    this.hoveredItem = null;
    this.draggedNodeId = null;
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.removeAllListeners();
  }

  /**
   * Attach event listeners to the container
   */
  private attachEventListeners(): void {
    if (!this.renderingSystem) return;

    const container = this.renderingSystem.getContainer();
    if (!container) return;

    const svg = container.tagName === 'svg' ? container : container.querySelector('svg');
    if (!svg) return;

    const d3Svg = d3.select(svg);

    // Click events
    d3Svg.on('click', (event: MouseEvent) => this.handleClick(event));
    d3Svg.on('dblclick', (event: MouseEvent) => this.handleDoubleClick(event));
    d3Svg.on('contextmenu', (event: MouseEvent) => this.handleRightClick(event));

    // Hover events
    d3Svg.on('mouseover', (event: MouseEvent) => this.handleMouseOver(event));
    d3Svg.on('mouseout', (event: MouseEvent) => this.handleMouseOut(event));
    d3Svg.on('mousemove', (event: MouseEvent) => this.handleMouseMove(event));

    // Drag setup
    if (this.dragBehavior.enabled) {
      this.setupDragBehavior();
    }

    // Keyboard events (on document)
    if (this.keyboardEnabled) {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
    }
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    if (!this.renderingSystem) return;

    const container = this.renderingSystem.getContainer();
    if (!container) return;

    const svg = container.tagName === 'svg' ? container : container.querySelector('svg');
    if (!svg) return;

    const d3Svg = d3.select(svg);

    // Remove all event listeners
    d3Svg.on('click', null);
    d3Svg.on('dblclick', null);
    d3Svg.on('contextmenu', null);
    d3Svg.on('mouseover', null);
    d3Svg.on('mouseout', null);
    d3Svg.on('mousemove', null);

    // Remove keyboard listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  /**
   * Handle click events
   */
  private handleClick = (event: MouseEvent): void => {
    const target = event.target as Element;
    const nodeElement = target.closest('.node');
    const edgeElement = target.closest('.edge');

    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-node-id');
      if (nodeId) {
        this.handleNodeClick(nodeId, event);
      }
    } else if (edgeElement) {
      const edgeId = edgeElement.getAttribute('data-edge-id') ||
                     Array.from(edgeElement.parentElement!.children).indexOf(edgeElement).toString();
      this.handleEdgeClick(edgeId, event);
    } else {
      this.handleBackgroundClick(event);
    }
  };

  /**
   * Handle double click events
   */
  private handleDoubleClick = (event: MouseEvent): void => {
    const target = event.target as Element;
    const nodeElement = target.closest('.node');

    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-node-id');
      if (nodeId) {
        this.nodeDoubleClickHandlers.forEach(handler => handler(nodeId, event));
      }
    }
  };

  /**
   * Handle right click events
   */
  private handleRightClick = (event: MouseEvent): void => {
    event.preventDefault();

    const target = event.target as Element;
    const nodeElement = target.closest('.node');

    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-node-id');
      if (nodeId) {
        this.nodeRightClickHandlers.forEach(handler => handler(nodeId, event));
      }
    }
  };

  /**
   * Handle mouse over events
   */
  private handleMouseOver = (event: MouseEvent): void => {
    if (!this.hoverEnabled) return;

    const target = event.target as Element;
    const nodeElement = target.closest('.node');
    const edgeElement = target.closest('.edge');

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    const setHovered = () => {
      if (nodeElement) {
        const nodeId = nodeElement.getAttribute('data-node-id');
        if (nodeId && (!this.hoveredItem || this.hoveredItem.id !== nodeId)) {
          this.hoveredItem = {
            type: 'node',
            id: nodeId,
            position: { x: event.clientX, y: event.clientY }
          };
          this.nodeHoverHandlers.forEach(handler => handler(nodeId));
          this.emit('nodeHover', nodeId);
        }
      } else if (edgeElement) {
        const edgeId = edgeElement.getAttribute('data-edge-id') ||
                       Array.from(edgeElement.parentElement!.children).indexOf(edgeElement).toString();
        if (!this.hoveredItem || this.hoveredItem.id !== edgeId) {
          this.hoveredItem = {
            type: 'edge',
            id: edgeId,
            position: { x: event.clientX, y: event.clientY }
          };
          this.edgeHoverHandlers.forEach(handler => handler(edgeId));
          this.emit('edgeHover', edgeId);
        }
      }
    };

    if (this.hoverDelay > 0) {
      this.hoverTimeout = setTimeout(setHovered, this.hoverDelay);
    } else {
      setHovered();
    }
  };

  /**
   * Handle mouse out events
   */
  private handleMouseOut = (event: MouseEvent): void => {
    if (!this.hoverEnabled) return;

    const target = event.target as Element;
    const relatedTarget = event.relatedTarget as Element;

    // Check if we're still within the same node/edge
    const nodeElement = target.closest('.node');
    const edgeElement = target.closest('.edge');

    if (nodeElement && !relatedTarget?.closest('.node')) {
      if (this.hoveredItem && this.hoveredItem.type === 'node') {
        this.nodeHoverEndHandlers.forEach(handler => handler(null));
        this.emit('nodeHoverEnd', this.hoveredItem.id);
        this.hoveredItem = null;
      }
    } else if (edgeElement && !relatedTarget?.closest('.edge')) {
      if (this.hoveredItem && this.hoveredItem.type === 'edge') {
        this.edgeHoverEndHandlers.forEach(handler => handler(null));
        this.emit('edgeHoverEnd', this.hoveredItem.id);
        this.hoveredItem = null;
      }
    }

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
  };

  /**
   * Handle mouse move events
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (this.hoveredItem) {
      this.hoveredItem.position = { x: event.clientX, y: event.clientY };
    }
  };

  /**
   * Handle node click
   */
  private handleNodeClick(nodeId: string, event: MouseEvent): void {
    const multi = this.isMultiSelectPressed(event);
    this.selectNode(nodeId, multi);

    this.nodeClickHandlers.forEach(handler => handler(nodeId, event));
    this.emit('nodeClicked', nodeId, event);
  }

  /**
   * Handle edge click
   */
  private handleEdgeClick(edgeId: string, event: MouseEvent): void {
    const multi = this.isMultiSelectPressed(event);
    this.selectEdge(edgeId, multi);

    this.edgeClickHandlers.forEach(handler => handler(edgeId, event));
    this.emit('edgeClicked', edgeId, event);
  }

  /**
   * Handle background click
   */
  private handleBackgroundClick(event: MouseEvent): void {
    if (!this.isMultiSelectPressed(event)) {
      this.clearSelection();
    }

    this.backgroundClickHandlers.forEach(handler => handler(event));
    this.emit('backgroundClicked', event);
  }

  /**
   * Handle keyboard events
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (!this.keyboardEnabled) return;

    this.keyDownHandlers.forEach(handler => handler(event));
    this.emit('keyDown', event);

    // Handle common shortcuts
    if (event.key === 'Escape') {
      this.clearSelection();
    } else if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      this.selectAll();
    }
  };

  private handleKeyUp = (event: KeyboardEvent): void => {
    if (!this.keyboardEnabled) return;

    this.keyUpHandlers.forEach(handler => handler(event));
    this.emit('keyUp', event);
  };

  /**
   * Setup drag behavior
   */
  private setupDragBehavior(): void {
    if (!this.renderingSystem) return;

    const container = this.renderingSystem.getContainer();
    if (!container) return;

    const svg = container.tagName === 'svg' ? container : container.querySelector('svg');
    if (!svg) return;

    const d3Svg = d3.select(svg);
    const nodeGroups = d3Svg.selectAll('.node');

    const drag = d3.drag()
      .on('start', (event: any, d: any) => {
        const nodeId = d.id || event.sourceEvent.target.closest('.node')?.getAttribute('data-node-id');
        if (nodeId) {
          this.startDrag(nodeId, event.sourceEvent);
        }
      })
      .on('drag', (event: any, d: any) => {
        const nodeId = d.id || this.draggedNodeId;
        if (nodeId && this.isDraggingNode) {
          const position = { x: event.x, y: event.y };
          this.dragBehavior.onDrag?.(nodeId, position);
          this.emit('nodeDragged', nodeId, position);
        }
      })
      .on('end', (_event: any, d: any) => {
        const nodeId = d.id || this.draggedNodeId;
        if (nodeId) {
          this.endDrag();
        }
      });

    nodeGroups.call(drag as any);
  }

  /**
   * Check if multi-select key is pressed
   */
  private isMultiSelectPressed(event: MouseEvent | KeyboardEvent): boolean {
    switch (this.multiSelectKey) {
      case 'ctrl':
        return event.ctrlKey;
      case 'shift':
        return event.shiftKey;
      case 'meta':
        return event.metaKey;
      default:
        return false;
    }
  }

  /**
   * Selection methods
   */
  selectNode(nodeId: string, multi: boolean = false): void {
    if (!multi) {
      this.selection.clear();
    }

    if (!this.selection.nodes.includes(nodeId)) {
      this.selection.nodes.push(nodeId);
    } else if (multi) {
      // Toggle selection in multi-select mode
      const index = this.selection.nodes.indexOf(nodeId);
      this.selection.nodes.splice(index, 1);
    }

    this.updateSelectionHighlight();
    this.emit('selectionChanged', this.getSelection());
  }

  selectEdge(edgeId: string, multi: boolean = false): void {
    if (!multi) {
      this.selection.clear();
    }

    if (!this.selection.edges.includes(edgeId)) {
      this.selection.edges.push(edgeId);
    } else if (multi) {
      // Toggle selection in multi-select mode
      const index = this.selection.edges.indexOf(edgeId);
      this.selection.edges.splice(index, 1);
    }

    this.updateSelectionHighlight();
    this.emit('selectionChanged', this.getSelection());
  }

  selectNodesInRegion(_region: Rectangle): void {
    // This would require access to node positions
    // Implementation would depend on layout engine integration
    console.warn('selectNodesInRegion not yet implemented');
  }

  selectAll(): void {
    // This would require access to all nodes and edges
    // Implementation would depend on data manager integration
    console.warn('selectAll not yet implemented');
  }

  clearSelection(): void {
    this.selection.clear();
    this.renderingSystem?.clearHighlights();
    this.emit('selectionChanged', this.getSelection());
  }

  getSelection(): Selection {
    return {
      nodes: [...this.selection.nodes],
      edges: [...this.selection.edges],
      isEmpty: () => this.selection.isEmpty(),
      contains: (itemId: string) => this.selection.contains(itemId),
      clear: () => this.clearSelection()
    };
  }

  isSelected(itemId: string): boolean {
    return this.selection.contains(itemId);
  }

  /**
   * Update selection highlighting
   */
  private updateSelectionHighlight(): void {
    if (!this.renderingSystem) return;

    if (this.selection.nodes.length > 0) {
      this.renderingSystem.highlightNodes(this.selection.nodes, {
        color: '#4a90e2',
        opacity: 1,
        scale: 1.1
      });
    }

    if (this.selection.edges.length > 0) {
      this.renderingSystem.highlightEdges(this.selection.edges, {
        color: '#4a90e2',
        opacity: 1
      });
    }
  }

  /**
   * Hover methods
   */
  setHoverEnabled(enabled: boolean): void {
    this.hoverEnabled = enabled;
    if (!enabled && this.hoveredItem) {
      if (this.hoveredItem.type === 'node') {
        this.nodeHoverEndHandlers.forEach(handler => handler(null));
      } else {
        this.edgeHoverEndHandlers.forEach(handler => handler(null));
      }
      this.hoveredItem = null;
    }
  }

  setHoverDelay(delay: number): void {
    this.hoverDelay = Math.max(0, delay);
  }

  getHoveredItem(): HoveredItem | null {
    return this.hoveredItem ? { ...this.hoveredItem } : null;
  }

  /**
   * Drag methods
   */
  setDragEnabled(enabled: boolean): void {
    this.dragBehavior.enabled = enabled;
    if (enabled) {
      this.setupDragBehavior();
    }
  }

  setDragBehavior(behavior: DragBehavior): void {
    this.dragBehavior = { ...behavior };
    if (behavior.enabled) {
      this.setupDragBehavior();
    }
  }

  startDrag(nodeId: string, _event: MouseEvent): void {
    if (!this.dragBehavior.enabled) return;

    this.isDraggingNode = true;
    this.draggedNodeId = nodeId;

    this.dragBehavior.onDragStart?.(nodeId);
    this.emit('dragStart', nodeId);
  }

  endDrag(): void {
    if (!this.isDraggingNode || !this.draggedNodeId) return;

    const nodeId = this.draggedNodeId;
    this.isDraggingNode = false;
    this.draggedNodeId = null;

    this.dragBehavior.onDragEnd?.(nodeId);
    this.emit('dragEnd', nodeId);
  }

  isDragging(): boolean {
    return this.isDraggingNode;
  }

  /**
   * Event handler registration
   */
  onNodeClick(handler: NodeClickHandler): void {
    this.nodeClickHandlers.push(handler);
  }

  onNodeDoubleClick(handler: NodeClickHandler): void {
    this.nodeDoubleClickHandlers.push(handler);
  }

  onNodeRightClick(handler: NodeClickHandler): void {
    this.nodeRightClickHandlers.push(handler);
  }

  onEdgeClick(handler: EdgeClickHandler): void {
    this.edgeClickHandlers.push(handler);
  }

  onBackgroundClick(handler: BackgroundClickHandler): void {
    this.backgroundClickHandlers.push(handler);
  }

  onNodeHover(handler: NodeHoverHandler): void {
    this.nodeHoverHandlers.push(handler);
  }

  onNodeHoverEnd(handler: NodeHoverHandler): void {
    this.nodeHoverEndHandlers.push(handler);
  }

  onEdgeHover(handler: EdgeHoverHandler): void {
    this.edgeHoverHandlers.push(handler);
  }

  onEdgeHoverEnd(handler: EdgeHoverHandler): void {
    this.edgeHoverEndHandlers.push(handler);
  }

  onKeyDown(handler: KeyboardHandler): void {
    this.keyDownHandlers.push(handler);
  }

  onKeyUp(handler: KeyboardHandler): void {
    this.keyUpHandlers.push(handler);
  }

  /**
   * Keyboard control
   */
  setKeyboardEnabled(enabled: boolean): void {
    this.keyboardEnabled = enabled;
    if (enabled) {
      document.addEventListener('keydown', this.handleKeyDown);
      document.addEventListener('keyup', this.handleKeyUp);
    } else {
      document.removeEventListener('keydown', this.handleKeyDown);
      document.removeEventListener('keyup', this.handleKeyUp);
    }
  }

  /**
   * Set multi-select key
   */
  setMultiSelectKey(key: 'ctrl' | 'shift' | 'meta'): void {
    this.multiSelectKey = key;
  }
}