import type { IRenderer, RendererType, RendererConfig, RenderConfig, NodeRenderConfig, EdgeRenderConfig, LabelRenderConfig, NodeStyleUpdate, EdgeStyleUpdate, HighlightConfig, Transform, LabelItem } from './IRenderer';
import type { LayoutResult, PositionedNode, PositionedEdge, NodePosition, EdgePosition } from '../layout/LayoutEngine';

export class CanvasRenderer implements IRenderer {
  readonly type: RendererType = 'canvas';

    private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private config: RendererConfig | null = null;

  initialize(container: HTMLElement, config: RendererConfig): void {
    this.config = config;
    this.canvas = document.createElement('canvas');
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    // Detect test environment where canvas is not available
    if (!this.ctx) {
      throw new Error('Canvas 2D context not available. Canvas rendering requires a browser environment or canvas npm package in Node.js.');
    }
  }

    destroy(): void {
    if (this.canvas) {
      this.canvas.remove();
    }
    this.canvas = null;
    this.ctx = null;
    this.config = null;
  }

    clear(): void {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

    render(layout: LayoutResult, config: RenderConfig): void {
    this.clear();

    // Render in order specified by config
    const order = config.layerOrder || ['edges', 'nodes', 'labels'];

    order.forEach((layer) => {
      switch (layer) {
        case 'edges':
          this.renderEdges(layout.edges, config.edgeConfig, layout.nodes);
          break;
        case 'nodes':
          this.renderNodes(layout.nodes, config.nodeConfig);
          break;
        case 'labels':
          // Generate labels from nodes
          const labels: LabelItem[] = layout.nodes
            .filter((node) => node.label)
            .map((node) => ({
              id: node.id,
              text: node.label!,
              position: { x: node.x, y: node.y },
              anchor: 'middle',
            }));
          this.renderLabels(labels, config.labelConfig);
          break;
      }
    });
  }

    renderNodes(nodes: PositionedNode[], config?: NodeRenderConfig): void {
    if (!this.ctx) return;

    const defaultConfig: NodeRenderConfig = {
      radius: 10,
      fill: '#69b3a2',
      stroke: '#fff',
      strokeWidth: 1.5,
      opacity: 1,
      shape: 'circle',
    };

    const finalConfig = { ...defaultConfig, ...config };

    nodes.forEach((node) => {
      const shape = this.accessor(finalConfig.shape!, node);
      const radius = this.accessor(finalConfig.radius!, node);
      const fill = this.accessor(finalConfig.fill!, node);
      const stroke = this.accessor(finalConfig.stroke!, node);
      const strokeWidth = this.accessor(finalConfig.strokeWidth!, node);
      const opacity = this.accessor(finalConfig.opacity!, node);

      this.ctx!.fillStyle = fill;
      this.ctx!.strokeStyle = stroke;
      this.ctx!.lineWidth = strokeWidth;
      this.ctx!.globalAlpha = opacity;

      this.ctx!.beginPath();

      switch (shape) {
        case 'circle':
          this.ctx!.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          break;
        case 'square':
          this.ctx!.rect(node.x - radius, node.y - radius, radius * 2, radius * 2);
          break;
        case 'diamond':
          this.ctx!.moveTo(node.x, node.y - radius);
          this.ctx!.lineTo(node.x + radius, node.y);
          this.ctx!.lineTo(node.x, node.y + radius);
          this.ctx!.lineTo(node.x - radius, node.y);
          this.ctx!.closePath();
          break;
        case 'triangle':
          const h = (radius * Math.sqrt(3)) / 2;
          this.ctx!.moveTo(node.x, node.y - radius);
          this.ctx!.lineTo(node.x + h, node.y + radius / 2);
          this.ctx!.lineTo(node.x - h, node.y + radius / 2);
          this.ctx!.closePath();
          break;
      }

      this.ctx!.fill();
      this.ctx!.stroke();
    });
  }

    renderEdges(edges: PositionedEdge[], config?: EdgeRenderConfig, _nodes?: PositionedNode[]): void {
    if (!this.ctx) return;

    const defaultConfig: EdgeRenderConfig = {
      stroke: '#999',
      strokeWidth: 1.5,
      opacity: 0.6,
      curveType: 'straight',
    };

    const finalConfig = { ...defaultConfig, ...config };

    edges.forEach((edge) => {
      const stroke = this.accessor(finalConfig.stroke!, edge);
      const strokeWidth = this.accessor(finalConfig.strokeWidth!, edge);
      const opacity = this.accessor(finalConfig.opacity!, edge);

      this.ctx!.strokeStyle = stroke;
      this.ctx!.lineWidth = strokeWidth;
      this.ctx!.globalAlpha = opacity;

      this.ctx!.beginPath();
      this.ctx!.moveTo((edge.source as PositionedNode).x, (edge.source as PositionedNode).y);
      this.ctx!.lineTo((edge.target as PositionedNode).x, (edge.target as PositionedNode).y);
      this.ctx!.stroke();
    });
  }

    renderLabels(items: LabelItem[], config?: LabelRenderConfig): void {
    if (!this.ctx) return;

    const defaultConfig: LabelRenderConfig = {
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fill: '#333',
      opacity: 1,
    };

    const finalConfig = { ...defaultConfig, ...config };

    items.forEach((item) => {
      const fontSize = this.accessor(finalConfig.fontSize!, item);
      const fontFamily = this.accessor(finalConfig.fontFamily!, item);
      const fill = this.accessor(finalConfig.fill!, item);
      const opacity = this.accessor(finalConfig.opacity!, item);

      this.ctx!.font = `${fontSize}px ${fontFamily}`;
      this.ctx!.fillStyle = fill;
      this.ctx!.globalAlpha = opacity;
      this.ctx!.textAlign = item.anchor || 'middle';
      this.ctx!.textBaseline = 'middle';

      this.ctx!.fillText(item.text, item.position.x, item.position.y);
    });
  }

  updateNodePositions(_positions: NodePosition[]): void {}

  updateEdgePositions(_positions: EdgePosition[]): void {}

  updateNodeStyles(_updates: NodeStyleUpdate[]): void {}

  updateEdgeStyles(_updates: EdgeStyleUpdate[]): void {}

  highlightNodes(_nodeIds: string[], _config?: HighlightConfig): void {}

  highlightEdges(_edgeIds: string[], _config?: HighlightConfig): void {}

  clearHighlights(): void {}

  getNodeElement(_nodeId: string): Element | null {
    return null;
  }

  getEdgeElement(_edgeId: string): Element | null {
    return null;
  }

  getContainer(): Element {
    return this.canvas!;
  }

  enableBatching(_enabled: boolean): void {}

  flush(): void {}

      private transform: Transform = { x: 0, y: 0, scale: 1 };

  setTransform(transform: Transform): void {
    this.transform = transform;
    if (this.ctx) {
      this.ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
    }
  }

  getTransform(): Transform {
    return { ...this.transform };
  }


    private accessor<T, R>(value: R | ((d: T) => R), data: T): R {
    return typeof value === 'function' ? (value as (d: T) => R)(data) : value;
  }
}