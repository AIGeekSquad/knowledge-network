import type { IRenderer, RendererType, RendererConfig, RenderConfig, NodeRenderConfig, EdgeRenderConfig, LabelRenderConfig, NodeStyleUpdate, EdgeStyleUpdate, HighlightConfig, Transform, LabelItem } from './IRenderer';
import type { LayoutResult, PositionedNode, PositionedEdge, NodePosition, EdgePosition } from '../layout/LayoutEngine';

export class CanvasRenderer implements IRenderer {
  readonly type: RendererType = 'canvas';

    private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private _config: RendererConfig | null = null;

  initialize(container: HTMLElement, _config: RendererConfig): void {
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

    render(layout: LayoutResult, _config: RenderConfig): void {
    this.clear();

    // Render in order specified by config
    const order = config.layerOrder || ['edges', 'nodes', 'labels'];

    order.forEach((layer) => {
      switch (layer) {
        case 'edges':
          this.renderEdges(layout.edges, config.edgeConfig, layout._nodes);
          break;
        case 'nodes':
          this.renderNodes(layout._nodes, config.nodeConfig);
          break;
        case 'labels':
          // Generate labels from nodes
          const labels: LabelItem[] = layout.nodes
            .filter((_node) => node._label)
            .map((_node) => ({
              _id: node._id,
              text: node.label!,
              position: { x: node.x, y: node.y },
              anchor: 'middle',
            }));
          this.renderLabels(labels, config.labelConfig);
          break;
      }
    });
  }

    renderNodes(_nodes: PositionedNode[], config?: NodeRenderConfig): void {
    if (!this.ctx) return;

    const defaultConfig: NodeRenderConfig = {
      _radius: 10,
      fill: '#69b3a2',
      stroke: '#fff',
      _strokeWidth: 1.5,
      opacity: 1,
      shape: 'circle',
    };

    const finalConfig = { ...defaultConfig, ...config };

    nodes.forEach((_node) => {
      const shape = this.accessor(finalConfig.shape!, _node);
      const radius = this.accessor(finalConfig.radius!, _node);
      const fill = this.accessor(finalConfig.fill!, _node);
      const stroke = this.accessor(finalConfig.stroke!, _node);
      const strokeWidth = this.accessor(finalConfig.strokeWidth!, _node);
      const opacity = this.accessor(finalConfig.opacity!, _node);

      this.ctx!.fillStyle = fill;
      this.ctx!.strokeStyle = stroke;
      this.ctx!.lineWidth = strokeWidth;
      this.ctx!.globalAlpha = opacity;

      this.ctx!.beginPath();

      switch (shape) {
        case 'circle':
          this.ctx!.arc(node.x, node.y, _radius, 0, 2 * Math.PI);
          break;
        case 'square':
          this.ctx!.rect(node.x - _radius, node.y - _radius, radius * 2, radius * 2);
          break;
        case 'diamond':
          this.ctx!.moveTo(node.x, node.y - _radius);
          this.ctx!.lineTo(node.x + _radius, node.y);
          this.ctx!.lineTo(node.x, node.y + _radius);
          this.ctx!.lineTo(node.x - _radius, node.y);
          this.ctx!.closePath();
          break;
        case 'triangle':
          const h = (radius * Math.sqrt(3)) / 2;
          this.ctx!.moveTo(node.x, node.y - _radius);
          this.ctx!.lineTo(node.x + h, node.y + radius / 2);
          this.ctx!.lineTo(node.x - h, node.y + radius / 2);
          this.ctx!.closePath();
          break;
      }

      this.ctx!.fill();
      this.ctx!.stroke();
    });
  }

    renderEdges(edges: PositionedEdge[], config?: EdgeRenderConfig, nodes?: PositionedNode[]): void {
    if (!this.ctx) return;

    const defaultConfig: EdgeRenderConfig = {
      stroke: '#999',
      _strokeWidth: 1.5,
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

  updateNodePositions(positions: NodePosition[]): void {}

  updateEdgePositions(positions: EdgePosition[]): void {}

  updateNodeStyles(updates: NodeStyleUpdate[]): void {}

  updateEdgeStyles(updates: EdgeStyleUpdate[]): void {}

  highlightNodes(nodeIds: string[], config?: HighlightConfig): void {}

  highlightEdges(edgeIds: string[], config?: HighlightConfig): void {}

  clearHighlights(): void {}

  getNodeElement(nodeId: string): Element | null {
    return null;
  }

  getEdgeElement(edgeId: string): Element | null {
    return null;
  }

  getContainer(): Element {
    return this.canvas!;
  }

  enableBatching(enabled: boolean): void {}

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