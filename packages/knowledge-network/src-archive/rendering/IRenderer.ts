import type {
  RendererType,
  RendererConfig,
  RenderConfig,
  NodeRenderConfig,
  EdgeRenderConfig,
  LabelRenderConfig,
  NodeStyleUpdate,
  EdgeStyleUpdate,
  HighlightConfig,
  Transform,
  LabelItem,
} from './RenderingSystem';
import type {
  LayoutResult,
  PositionedNode,
  PositionedEdge,
  NodePosition,
  EdgePosition,
} from '../layout/LayoutEngine';

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
