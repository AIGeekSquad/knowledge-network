import { EventEmitter } from 'events';
import type {
  LayoutResult,
  PositionedNode,
  PositionedEdge,
  NodePosition,
  EdgePosition,
  Point,
  BoundingBox,
} from '../layout/LayoutEngine';
import type { Node, Edge, GraphConfig } from '../types';
import { SVGRenderer } from './SVGRenderer';

export type RendererType = 'svg' | 'canvas' | 'webgl';
export type NodeShape = 'circle' | 'square' | 'diamond' | 'triangle' | 'star';
export type CurveType = 'straight' | 'arc' | 'bezier' | 'bundle';

export interface Transform {
  x: number;
  y: number;
  scale: number;
}

export interface RendererConfig {
  width: number;
  height: number;
  pixelRatio?: number;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
}

export interface RenderConfig {
  nodeConfig?: NodeRenderConfig;
  edgeConfig?: EdgeRenderConfig;
  labelConfig?: LabelRenderConfig;
  layerOrder?: ('edges' | 'nodes' | 'labels')[];
}

export interface NodeRenderConfig {
  radius?: number | ((node: Node) => number);
  fill?: string | ((node: Node) => string);
  stroke?: string | ((node: Node) => string);
  strokeWidth?: number | ((node: Node) => number);
  opacity?: number | ((node: Node) => number);
  shape?: NodeShape | ((node: Node) => NodeShape);
  image?: string | ((node: Node) => string | null);
}

export interface EdgeRenderConfig {
  stroke?: string | ((edge: Edge) => string);
  strokeWidth?: number | ((edge: Edge) => number);
  opacity?: number | ((edge: Edge) => number);
  strokeDasharray?: string | ((edge: Edge) => string);
  arrowHead?: boolean | ArrowConfig;
  curveType?: CurveType;
}

export interface ArrowConfig {
  size?: number;
  color?: string;
  type?: 'triangle' | 'circle' | 'square';
}

export interface LabelItem {
  id: string;
  text: string;
  position: Point;
  anchor?: 'start' | 'middle' | 'end';
  offset?: Point;
}

export interface LabelRenderConfig {
  fontSize?: number | ((item: LabelItem) => number);
  fontFamily?: string;
  fill?: string | ((item: LabelItem) => string);
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface NodeStyleUpdate {
  nodeId: string;
  style: Partial<NodeRenderConfig>;
}

export interface EdgeStyleUpdate {
  edgeId: string;
  style: Partial<EdgeRenderConfig>;
}

export interface HighlightConfig {
  color?: string;
  opacity?: number;
  scale?: number;
  duration?: number;
}

/**
 * Abstract renderer interface
 */
export interface IRenderer {
  readonly type: RendererType;

  // Lifecycle
  initialize(container: HTMLElement, config: RendererConfig): void;
  destroy(): void;
  clear(): void;

  // Rendering
  render(layout: LayoutResult, config: RenderConfig): void;
  renderNodes(nodes: PositionedNode[], config?: NodeRenderConfig): void;
  renderEdges(edges: PositionedEdge[], config?: EdgeRenderConfig, nodes?: PositionedNode[]): void;
  renderLabels(items: LabelItem[], config?: LabelRenderConfig): void;

  // Updates
  updateNodePositions(positions: NodePosition[]): void;
  updateEdgePositions(positions: EdgePosition[]): void;
  updateNodeStyles(updates: NodeStyleUpdate[]): void;
  updateEdgeStyles(updates: EdgeStyleUpdate[]): void;

  // Selection & Highlighting
  highlightNodes(nodeIds: string[], config?: HighlightConfig): void;
  highlightEdges(edgeIds: string[], config?: HighlightConfig): void;
  clearHighlights(): void;

  // Viewport
  setTransform(transform: Transform): void;
  getTransform(): Transform;

  // Element Access
  getNodeElement(nodeId: string): Element | null;
  getEdgeElement(edgeId: string): Element | null;
  getContainer(): Element;

  // Performance
  enableBatching(enabled: boolean): void;
  flush(): void;
}

/**
 * RenderingSystem manages the rendering of graph layouts using different renderers.
 *
 * @remarks
 * The RenderingSystem acts as a facade for different rendering implementations
 * (SVG, Canvas, WebGL). It manages renderer lifecycle, coordinates rendering
 * operations, and provides a consistent interface regardless of the underlying
 * rendering technology.
 *
 * @example
 * ```typescript
 * const renderingSystem = new RenderingSystem(container, {
 *   width: 800,
 *   height: 600
 * });
 *
 * renderingSystem.setRenderer('svg');
 * renderingSystem.render(layoutResult, renderConfig);
 * ```
 */
export class RenderingSystem extends EventEmitter {
  private renderer: IRenderer | null = null;
  private container: HTMLElement;
  private config: RendererConfig;
  private renderConfig: RenderConfig;
  private highlightedNodes: Set<string> = new Set();
  private highlightedEdges: Set<string> = new Set();

  constructor(
    container: HTMLElement,
    config?: Partial<RendererConfig>,
    renderConfig?: RenderConfig
  ) {
    super();
    this.container = container;
    this.config = {
      width: 800,
      height: 600,
      pixelRatio: window.devicePixelRatio || 1,
      antialias: true,
      preserveDrawingBuffer: false,
      ...config,
    };
    this.renderConfig = {
      layerOrder: ['edges', 'nodes', 'labels'],
      ...renderConfig,
    };
  }

  /**
   * Set the renderer type
   */
  async setRenderer(type: RendererType): Promise<void> {
    if (this.renderer) {
      this.renderer.destroy();
    }

    switch (type) {
      case 'svg':
        this.renderer = new SVGRenderer();
        break;
      case 'canvas':
        // Canvas renderer would be implemented separately
        throw new Error('Canvas renderer not yet implemented');
      case 'webgl':
        // WebGL renderer would be implemented separately
        throw new Error('WebGL renderer not yet implemented');
      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }

    this.renderer.initialize(this.container, this.config);
    this.emit('rendererChanged', type);
  }

  /**
   * Get the current renderer
   */
  getRenderer(): IRenderer | null {
    return this.renderer;
  }

  /**
   * Get the renderer type
   */
  getRendererType(): RendererType | null {
    return this.renderer?.type || null;
  }

  /**
   * Initialize with default SVG renderer
   */
  initialize(): void {
    if (!this.renderer) {
      this.setRenderer('svg');
    }
  }

  /**
   * Render the graph layout
   */
  render(layout: LayoutResult, config?: RenderConfig): void {
    if (!this.renderer) {
      this.initialize();
    }

    const finalConfig = { ...this.renderConfig, ...config };
    this.renderConfig = finalConfig;

    this.renderer!.render(layout, finalConfig);
    this.emit('rendered', layout);
  }

  /**
   * Update node positions
   */
  updateNodePositions(positions: NodePosition[]): void {
    if (!this.renderer) return;
    this.renderer.updateNodePositions(positions);
    this.emit('nodesUpdated', positions);
  }

  /**
   * Update edge positions
   */
  updateEdgePositions(positions: EdgePosition[]): void {
    if (!this.renderer) return;
    this.renderer.updateEdgePositions(positions);
    this.emit('edgesUpdated', positions);
  }

  /**
   * Update node styles
   */
  updateNodeStyles(updates: NodeStyleUpdate[]): void {
    if (!this.renderer) return;
    this.renderer.updateNodeStyles(updates);
  }

  /**
   * Update edge styles
   */
  updateEdgeStyles(updates: EdgeStyleUpdate[]): void {
    if (!this.renderer) return;
    this.renderer.updateEdgeStyles(updates);
  }

  /**
   * Highlight nodes
   */
  highlightNodes(nodeIds: string[], config?: HighlightConfig): void {
    if (!this.renderer) return;

    // Clear previous highlights
    this.clearNodeHighlights();

    // Apply new highlights
    this.renderer.highlightNodes(nodeIds, config);
    nodeIds.forEach((id) => this.highlightedNodes.add(id));

    this.emit('nodesHighlighted', nodeIds);
  }

  /**
   * Highlight edges
   */
  highlightEdges(edgeIds: string[], config?: HighlightConfig): void {
    if (!this.renderer) return;

    // Clear previous highlights
    this.clearEdgeHighlights();

    // Apply new highlights
    this.renderer.highlightEdges(edgeIds, config);
    edgeIds.forEach((id) => this.highlightedEdges.add(id));

    this.emit('edgesHighlighted', edgeIds);
  }

  /**
   * Clear node highlights
   */
  clearNodeHighlights(): void {
    if (!this.renderer || this.highlightedNodes.size === 0) return;

    const defaultStyle: NodeStyleUpdate[] = Array.from(this.highlightedNodes).map((nodeId) => ({
      nodeId,
      style: {
        opacity: 1,
        stroke: this.renderConfig.nodeConfig?.stroke,
        strokeWidth: this.renderConfig.nodeConfig?.strokeWidth,
      },
    }));

    this.renderer.updateNodeStyles(defaultStyle);
    this.highlightedNodes.clear();
  }

  /**
   * Clear edge highlights
   */
  clearEdgeHighlights(): void {
    if (!this.renderer || this.highlightedEdges.size === 0) return;

    const defaultStyle: EdgeStyleUpdate[] = Array.from(this.highlightedEdges).map((edgeId) => ({
      edgeId,
      style: {
        opacity: 1,
        stroke: this.renderConfig.edgeConfig?.stroke,
        strokeWidth: this.renderConfig.edgeConfig?.strokeWidth,
      },
    }));

    this.renderer.updateEdgeStyles(defaultStyle);
    this.highlightedEdges.clear();
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.clearNodeHighlights();
    this.clearEdgeHighlights();
    this.emit('highlightsCleared');
  }

  /**
   * Highlight selection
   */
  highlightSelection(selection: { nodes: string[]; edges: string[] }): void {
    if (selection.nodes.length > 0) {
      this.highlightNodes(selection.nodes);
    } else {
      this.clearNodeHighlights();
    }

    if (selection.edges.length > 0) {
      this.highlightEdges(selection.edges);
    } else {
      this.clearEdgeHighlights();
    }
  }

  /**
   * Set viewport transform
   */
  setTransform(transform: Transform): void {
    if (!this.renderer) return;
    this.renderer.setTransform(transform);
    this.emit('transformChanged', transform);
  }

  /**
   * Get viewport transform
   */
  getTransform(): Transform {
    if (!this.renderer) {
      return { x: 0, y: 0, scale: 1 };
    }
    return this.renderer.getTransform();
  }

  /**
   * Get node element
   */
  getNodeElement(nodeId: string): Element | null {
    if (!this.renderer) return null;
    return this.renderer.getNodeElement(nodeId);
  }

  /**
   * Get edge element
   */
  getEdgeElement(edgeId: string): Element | null {
    if (!this.renderer) return null;
    return this.renderer.getEdgeElement(edgeId);
  }

  /**
   * Get container element
   */
  getContainer(): Element {
    if (!this.renderer) {
      return this.container;
    }
    return this.renderer.getContainer();
  }

  /**
   * Clear the rendering
   */
  clear(): void {
    if (!this.renderer) return;
    this.renderer.clear();
    this.highlightedNodes.clear();
    this.highlightedEdges.clear();
    this.emit('cleared');
  }

  /**
   * Destroy the rendering system
   */
  destroy(): void {
    if (this.renderer) {
      this.renderer.destroy();
      this.renderer = null;
    }
    this.highlightedNodes.clear();
    this.highlightedEdges.clear();
    this.removeAllListeners();
    this.emit('destroyed');
  }

  /**
   * Enable/disable batching for performance
   */
  enableBatching(enabled: boolean): void {
    if (!this.renderer) return;
    this.renderer.enableBatching(enabled);
  }

  /**
   * Flush batched operations
   */
  flush(): void {
    if (!this.renderer) return;
    this.renderer.flush();
  }

  /**
   * Update render configuration
   */
  setRenderConfig(config: Partial<RenderConfig>): void {
    this.renderConfig = { ...this.renderConfig, ...config };
  }

  /**
   * Get render configuration
   */
  getRenderConfig(): RenderConfig {
    return { ...this.renderConfig };
  }

  /**
   * Update renderer configuration
   */
  setRendererConfig(config: Partial<RendererConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.renderer) {
      // Re-initialize with new config
      const type = this.renderer.type;
      this.renderer.destroy();
      this.setRenderer(type);
    }
  }

  /**
   * Get renderer configuration
   */
  getRendererConfig(): RendererConfig {
    return { ...this.config };
  }
}
