import * as d3 from 'd3';
import type {
  IRenderer,
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
  LabelItem
} from './RenderingSystem';
import type { LayoutResult, PositionedNode, PositionedEdge, NodePosition, EdgePosition } from '../layout/LayoutEngine';
import { EdgeRenderer, EdgeRenderResult } from '../edges';

/**
 * SVG-based renderer for graph visualization.
 *
 * @remarks
 * The SVGRenderer uses D3.js to create and manage SVG elements for nodes,
 * edges, and labels. It supports various node shapes, edge styles, and
 * interactive features like highlighting and selection.
 *
 * @example
 * ```typescript
 * const renderer = new SVGRenderer();
 * renderer.initialize(container, { width: 800, height: 600 });
 * renderer.renderNodes(nodes, { radius: 10, fill: '#69b3a2' });
 * renderer.renderEdges(edges, { stroke: '#999' });
 * ```
 */
export class SVGRenderer implements IRenderer {
  readonly type: RendererType = 'svg';

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private rootGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private edgeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private labelGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private container: HTMLElement | null = null;
  private config: RendererConfig | null = null;
  private transform: Transform = { x: 0, y: 0, scale: 1 };
  private edgeRenderer: EdgeRenderer | null = null;
  private edgeRenderResult: EdgeRenderResult | null = null;
  private batching: boolean = false;
  private batchQueue: (() => void)[] = [];
  private simpleEdgeRenderer: any | null = null;
  private bundledEdgeRenderer: any | null = null;

  /**
   * Initialize the SVG renderer
   */
  initialize(container: HTMLElement, config: RendererConfig): void {
    this.container = container;
    this.config = config;

    // Clear any existing SVG
    d3.select(container).selectAll('svg').remove();

    // Create SVG element
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', config.width)
      .attr('height', config.height)
      .attr('viewBox', `0 0 ${config.width} ${config.height}`)
      .style('background-color', 'transparent');

    // Create root group for transformations
    this.rootGroup = this.svg.append('g')
      .attr('class', 'graph-root');

    // Create layer groups in order
    this.edgeGroup = this.rootGroup.append('g')
      .attr('class', 'edges');

    this.nodeGroup = this.rootGroup.append('g')
      .attr('class', 'nodes');

    this.labelGroup = this.rootGroup.append('g')
      .attr('class', 'labels');

    // Initialize edge renderers - we'll use them based on config
    // Import them dynamically to avoid circular dependencies
    const { SimpleEdge } = require('../edges/SimpleEdge');
    const { EdgeBundling } = require('../edges/EdgeBundling');
    this.simpleEdgeRenderer = new SimpleEdge();
    this.bundledEdgeRenderer = new EdgeBundling();
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
    this.rootGroup = null;
    this.edgeGroup = null;
    this.nodeGroup = null;
    this.labelGroup = null;
    this.container = null;
    this.config = null;
    this.edgeRenderer = null;
    this.simpleEdgeRenderer = null;
    this.bundledEdgeRenderer = null;
    this.edgeRenderResult = null;
    this.batchQueue = [];
  }

  /**
   * Clear all rendered elements
   */
  clear(): void {
    if (this.edgeGroup) this.edgeGroup.selectAll('*').remove();
    if (this.nodeGroup) this.nodeGroup.selectAll('*').remove();
    if (this.labelGroup) this.labelGroup.selectAll('*').remove();
    this.edgeRenderResult = null;
  }

  /**
   * Render complete layout
   */
  render(layout: LayoutResult, config: RenderConfig): void {
    const operation = () => {
      // Clear previous rendering
      this.clear();

      // Render in order specified by config
      const order = config.layerOrder || ['edges', 'nodes', 'labels'];

      order.forEach(layer => {
        switch (layer) {
          case 'edges':
            this.renderEdges(layout.edges, config.edgeConfig);
            break;
          case 'nodes':
            this.renderNodes(layout.nodes, config.nodeConfig);
            break;
          case 'labels':
            // Generate labels from nodes
            const labels: LabelItem[] = layout.nodes
              .filter(node => node.label)
              .map(node => ({
                id: node.id,
                text: node.label!,
                position: { x: node.x, y: node.y },
                anchor: 'middle'
              }));
            this.renderLabels(labels, config.labelConfig);
            break;
        }
      });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Render nodes
   */
  renderNodes(nodes: PositionedNode[], config?: NodeRenderConfig): void {
    if (!this.nodeGroup) return;

    const operation = () => {
      const defaultConfig: NodeRenderConfig = {
        radius: 10,
        fill: '#69b3a2',
        stroke: '#fff',
        strokeWidth: 1.5,
        opacity: 1,
        shape: 'circle'
      };

      const finalConfig = { ...defaultConfig, ...config };

      // Data join with key function
      const nodeSelection = this.nodeGroup!
        .selectAll<SVGElement, PositionedNode>('.node')
        .data(nodes, (d: PositionedNode) => d.id);

      // Exit
      nodeSelection.exit().remove();

      // Enter + Update
      const nodeEnter = nodeSelection.enter()
        .append('g')
        .attr('class', 'node')
        .attr('data-node-id', d => d.id);

      // Merge enter and update selections
      const nodeMerged = nodeEnter.merge(nodeSelection as any);

      // Position groups
      nodeMerged.attr('transform', d => `translate(${d.x},${d.y})`);

      // Remove old shapes
      nodeMerged.selectAll('*').remove();

      // Add shapes based on config
      nodeMerged.each((d, i, nodes) => {
        const group = d3.select(nodes[i]);
        const shape = this.accessor(finalConfig.shape!, d);

        switch (shape) {
          case 'circle':
            group.append('circle')
              .attr('r', this.accessor(finalConfig.radius!, d))
              .attr('fill', this.accessor(finalConfig.fill!, d))
              .attr('stroke', this.accessor(finalConfig.stroke!, d))
              .attr('stroke-width', this.accessor(finalConfig.strokeWidth!, d))
              .attr('opacity', this.accessor(finalConfig.opacity!, d));
            break;

          case 'square':
            const size = this.accessor(finalConfig.radius!, d) * 2;
            group.append('rect')
              .attr('x', -size / 2)
              .attr('y', -size / 2)
              .attr('width', size)
              .attr('height', size)
              .attr('fill', this.accessor(finalConfig.fill!, d))
              .attr('stroke', this.accessor(finalConfig.stroke!, d))
              .attr('stroke-width', this.accessor(finalConfig.strokeWidth!, d))
              .attr('opacity', this.accessor(finalConfig.opacity!, d));
            break;

          case 'diamond':
            const r = this.accessor(finalConfig.radius!, d);
            group.append('polygon')
              .attr('points', `0,-${r} ${r},0 0,${r} -${r},0`)
              .attr('fill', this.accessor(finalConfig.fill!, d))
              .attr('stroke', this.accessor(finalConfig.stroke!, d))
              .attr('stroke-width', this.accessor(finalConfig.strokeWidth!, d))
              .attr('opacity', this.accessor(finalConfig.opacity!, d));
            break;

          case 'triangle':
            const tr = this.accessor(finalConfig.radius!, d);
            const h = tr * Math.sqrt(3) / 2;
            group.append('polygon')
              .attr('points', `0,-${tr} ${h},${tr/2} -${h},${tr/2}`)
              .attr('fill', this.accessor(finalConfig.fill!, d))
              .attr('stroke', this.accessor(finalConfig.stroke!, d))
              .attr('stroke-width', this.accessor(finalConfig.strokeWidth!, d))
              .attr('opacity', this.accessor(finalConfig.opacity!, d));
            break;

          default:
            // Default to circle
            group.append('circle')
              .attr('r', this.accessor(finalConfig.radius!, d))
              .attr('fill', this.accessor(finalConfig.fill!, d))
              .attr('stroke', this.accessor(finalConfig.stroke!, d))
              .attr('stroke-width', this.accessor(finalConfig.strokeWidth!, d))
              .attr('opacity', this.accessor(finalConfig.opacity!, d));
        }

        // Add image if specified
        const image = finalConfig.image ? this.accessor(finalConfig.image, d) : null;
        if (image) {
          const imageSize = this.accessor(finalConfig.radius!, d) * 1.5;
          group.append('image')
            .attr('href', image)
            .attr('x', -imageSize / 2)
            .attr('y', -imageSize / 2)
            .attr('width', imageSize)
            .attr('height', imageSize)
            .attr('clip-path', 'circle()');
        }
      });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Render edges
   */
  renderEdges(edges: PositionedEdge[], config?: EdgeRenderConfig): void {
    if (!this.edgeGroup) return;

    const operation = () => {
      const defaultConfig: EdgeRenderConfig = {
        stroke: '#999',
        strokeWidth: 1.5,
        opacity: 0.6,
        curveType: 'straight'
      };

      const finalConfig = { ...defaultConfig, ...config };

      // Prepare edges for rendering - ensure source/target are node objects
      const nodes = new Map<string, any>();

      // Create a map of node IDs to positioned nodes
      edges.forEach(edge => {
        if (typeof edge.source !== 'string') {
          nodes.set(edge.source.id, edge.source);
        }
        if (typeof edge.target !== 'string') {
          nodes.set(edge.target.id, edge.target);
        }
      });

      const processedEdges = edges.map(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
        const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

        return {
          ...edge,
          source: nodes.get(sourceId) || { id: sourceId, x: 0, y: 0 },
          target: nodes.get(targetId) || { id: targetId, x: 0, y: 0 }
        };
      });

      // Choose the appropriate renderer
      const renderer = finalConfig.curveType === 'bundle' ? this.bundledEdgeRenderer : this.simpleEdgeRenderer;

      if (renderer) {
        // Use the EdgeRenderer interface render method
        this.edgeRenderResult = renderer.render(
          this.edgeGroup,
          processedEdges as any,
          Array.from(nodes.values()),
          {
            stroke: finalConfig.stroke,
            strokeWidth: finalConfig.strokeWidth,
            strokeOpacity: finalConfig.opacity,
            strokeDasharray: finalConfig.strokeDasharray
          }
        );
      }

      // Add arrow heads if configured
      if (finalConfig.arrowHead && this.svg) {
        this.addArrowHeads(finalConfig.arrowHead);
      }
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Render labels
   */
  renderLabels(items: LabelItem[], config?: LabelRenderConfig): void {
    if (!this.labelGroup) return;

    const operation = () => {
      const defaultConfig: LabelRenderConfig = {
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fill: '#333',
        opacity: 1
      };

      const finalConfig = { ...defaultConfig, ...config };

      // Data join
      const labelSelection = this.labelGroup!
        .selectAll<SVGTextElement, LabelItem>('.label')
        .data(items, (d: LabelItem) => d.id);

      // Exit
      labelSelection.exit().remove();

      // Enter + Update
      const labelEnter = labelSelection.enter()
        .append('text')
        .attr('class', 'label')
        .attr('data-label-id', d => d.id);

      const labelMerged = labelEnter.merge(labelSelection);

      labelMerged
        .attr('x', d => d.position.x + (d.offset?.x || 0))
        .attr('y', d => d.position.y + (d.offset?.y || 0))
        .attr('text-anchor', d => d.anchor || 'middle')
        .attr('dominant-baseline', 'central')
        .attr('font-size', d => this.accessor(finalConfig.fontSize!, d))
        .attr('font-family', finalConfig.fontFamily!)
        .attr('fill', d => this.accessor(finalConfig.fill!, d))
        .attr('opacity', finalConfig.opacity!)
        .text(d => d.text);

      // Add stroke if configured
      if (finalConfig.stroke) {
        labelMerged
          .attr('stroke', finalConfig.stroke)
          .attr('stroke-width', finalConfig.strokeWidth || 0.5);
      }
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Update node positions
   */
  updateNodePositions(positions: NodePosition[]): void {
    if (!this.nodeGroup) return;

    const operation = () => {
      const positionMap = new Map(positions.map(p => [p.id, p]));

      this.nodeGroup!
        .selectAll<SVGGElement, any>('.node')
        .each((d, i, nodes) => {
          const position = positionMap.get(d.id);
          if (position) {
            d3.select(nodes[i])
              .transition()
              .duration(200)
              .attr('transform', `translate(${position.x},${position.y})`);
          }
        });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Update edge positions
   */
  updateEdgePositions(positions: EdgePosition[]): void {
    if (!this.edgeGroup || !this.edgeRenderResult) return;

    const operation = () => {
      // Update edge paths based on new positions
      if (this.edgeRenderResult?.edges) {
        this.edgeRenderResult.edges
          .transition()
          .duration(200)
          .attr('d', (d: any, i: number) => {
            const pos = positions[i];
            if (pos) {
              return `M${pos.source.x},${pos.source.y} L${pos.target.x},${pos.target.y}`;
            }
            return null;
          });
      }
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Update node styles
   */
  updateNodeStyles(updates: NodeStyleUpdate[]): void {
    if (!this.nodeGroup) return;

    const operation = () => {
      const styleMap = new Map(updates.map(u => [u.nodeId, u.style]));

      this.nodeGroup!
        .selectAll<SVGGElement, any>('.node')
        .each((d, i, nodes) => {
          const style = styleMap.get(d.id);
          if (style) {
            const selection = d3.select(nodes[i]).select('circle, rect, polygon');

            if (style.fill !== undefined) {
              selection.attr('fill', style.fill as any);
            }
            if (style.stroke !== undefined) {
              selection.attr('stroke', style.stroke as any);
            }
            if (style.strokeWidth !== undefined) {
              selection.attr('stroke-width', style.strokeWidth as any);
            }
            if (style.opacity !== undefined) {
              selection.attr('opacity', style.opacity as any);
            }
          }
        });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Update edge styles
   */
  updateEdgeStyles(updates: EdgeStyleUpdate[]): void {
    if (!this.edgeGroup) return;

    const operation = () => {
      const styleMap = new Map(updates.map(u => [u.edgeId, u.style]));

      this.edgeGroup!
        .selectAll<SVGPathElement, any>('.edge')
        .each((d, i, edges) => {
          const style = styleMap.get(d.id || `edge-${i}`);
          if (style) {
            const selection = d3.select(edges[i]);

            if (style.stroke !== undefined) {
              selection.attr('stroke', style.stroke as any);
            }
            if (style.strokeWidth !== undefined) {
              selection.attr('stroke-width', style.strokeWidth as any);
            }
            if (style.opacity !== undefined) {
              selection.attr('opacity', style.opacity as any);
            }
            if (style.strokeDasharray !== undefined) {
              selection.attr('stroke-dasharray', style.strokeDasharray as any);
            }
          }
        });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Highlight nodes
   */
  highlightNodes(nodeIds: string[], config?: HighlightConfig): void {
    if (!this.nodeGroup) return;

    const operation = () => {
      const defaultConfig: HighlightConfig = {
        color: '#ff6b6b',
        opacity: 1,
        scale: 1.2,
        duration: 200
      };

      const finalConfig = { ...defaultConfig, ...config };
      const idSet = new Set(nodeIds);

      this.nodeGroup!
        .selectAll<SVGGElement, any>('.node')
        .each((d, i, nodes) => {
          const element = d3.select(nodes[i]);
          const shape = element.select('circle, rect, polygon');

          if (idSet.has(d.id)) {
            // Highlight
            shape
              .transition()
              .duration(finalConfig.duration!)
              .attr('stroke', finalConfig.color!)
              .attr('stroke-width', 3)
              .attr('opacity', finalConfig.opacity!)
              .attr('transform', `scale(${finalConfig.scale})`);
          } else {
            // Dim others
            shape
              .transition()
              .duration(finalConfig.duration!)
              .attr('opacity', 0.3);
          }
        });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Highlight edges
   */
  highlightEdges(edgeIds: string[], config?: HighlightConfig): void {
    if (!this.edgeGroup) return;

    const operation = () => {
      const defaultConfig: HighlightConfig = {
        color: '#ff6b6b',
        opacity: 1,
        scale: 1,
        duration: 200
      };

      const finalConfig = { ...defaultConfig, ...config };
      const idSet = new Set(edgeIds);

      this.edgeGroup!
        .selectAll<SVGPathElement, any>('.edge')
        .each((d, i, edges) => {
          const element = d3.select(edges[i]);
          const edgeId = d.id || `edge-${i}`;

          if (idSet.has(edgeId)) {
            // Highlight
            element
              .transition()
              .duration(finalConfig.duration!)
              .attr('stroke', finalConfig.color!)
              .attr('stroke-width', 3)
              .attr('opacity', finalConfig.opacity!);
          } else {
            // Dim others
            element
              .transition()
              .duration(finalConfig.duration!)
              .attr('opacity', 0.2);
          }
        });
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Clear highlights
   */
  clearHighlights(): void {
    const operation = () => {
      // Reset nodes
      if (this.nodeGroup) {
        this.nodeGroup
          .selectAll<SVGGElement, any>('.node')
          .select('circle, rect, polygon')
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('transform', 'scale(1)');
      }

      // Reset edges
      if (this.edgeGroup) {
        this.edgeGroup
          .selectAll<SVGPathElement, any>('.edge')
          .transition()
          .duration(200)
          .attr('opacity', 0.6);
      }
    };

    if (this.batching) {
      this.batchQueue.push(operation);
    } else {
      operation();
    }
  }

  /**
   * Set viewport transform
   */
  setTransform(transform: Transform): void {
    this.transform = transform;

    if (this.rootGroup) {
      this.rootGroup
        .transition()
        .duration(200)
        .attr('transform', `translate(${transform.x},${transform.y}) scale(${transform.scale})`);
    }
  }

  /**
   * Get viewport transform
   */
  getTransform(): Transform {
    return { ...this.transform };
  }

  /**
   * Get node element
   */
  getNodeElement(nodeId: string): Element | null {
    if (!this.nodeGroup) return null;

    const selection = this.nodeGroup
      .selectAll<SVGGElement, any>('.node')
      .filter((d: any) => d.id === nodeId);

    return selection.empty() ? null : selection.node();
  }

  /**
   * Get edge element
   */
  getEdgeElement(edgeId: string): Element | null {
    if (!this.edgeGroup) return null;

    const selection = this.edgeGroup
      .selectAll<SVGPathElement, any>('.edge')
      .filter((d: any, i: number) => (d.id || `edge-${i}`) === edgeId);

    return selection.empty() ? null : selection.node();
  }

  /**
   * Get container element
   */
  getContainer(): Element {
    return this.svg?.node() || this.container!;
  }

  /**
   * Enable/disable batching
   */
  enableBatching(enabled: boolean): void {
    this.batching = enabled;
    if (!enabled) {
      this.flush();
    }
  }

  /**
   * Flush batched operations
   */
  flush(): void {
    const operations = [...this.batchQueue];
    this.batchQueue = [];

    operations.forEach(op => op());
  }

  /**
   * Helper to get value from accessor
   */
  private accessor<T, R>(value: R | ((d: T) => R), data: T): R {
    return typeof value === 'function' ? value(data) : value;
  }

  /**
   * Helper to get node data from node or ID
   */
  private getNodeData(nodeOrId: PositionedNode | string): any {
    if (typeof nodeOrId === 'string') {
      // For string IDs, return a minimal object
      return { id: nodeOrId, x: 0, y: 0 };
    }
    return nodeOrId;
  }

  /**
   * Add arrow heads to edges
   */
  private addArrowHeads(config: boolean | any): void {
    if (!this.svg) return;

    const arrowConfig = config === true ? {} : config;
    const size = arrowConfig.size || 10;
    const color = arrowConfig.color || '#999';
    const type = arrowConfig.type || 'triangle';

    // Define arrow marker
    const defs = this.svg.select('defs').empty()
      ? this.svg.append('defs')
      : this.svg.select('defs');

    // Remove existing arrow markers
    defs.selectAll('.arrow-marker').remove();

    // Create new arrow marker
    const marker = defs.append('marker')
      .attr('class', 'arrow-marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 8)
      .attr('refY', 0)
      .attr('markerWidth', size)
      .attr('markerHeight', size)
      .attr('orient', 'auto');

    switch (type) {
      case 'triangle':
        marker.append('path')
          .attr('d', 'M0,-5L10,0L0,5')
          .attr('fill', color);
        break;
      case 'circle':
        marker.append('circle')
          .attr('cx', 5)
          .attr('cy', 0)
          .attr('r', 3)
          .attr('fill', color);
        break;
      case 'square':
        marker.append('rect')
          .attr('x', 2)
          .attr('y', -3)
          .attr('width', 6)
          .attr('height', 6)
          .attr('fill', color);
        break;
    }

    // Apply marker to edges
    if (this.edgeGroup) {
      this.edgeGroup
        .selectAll('.edge')
        .attr('marker-end', 'url(#arrowhead)');
    }
  }
}