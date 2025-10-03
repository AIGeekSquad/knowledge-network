import * as d3 from 'd3';
import type { GraphData, GraphConfig, Node } from './types';

/**
 * Main class for creating and managing knowledge graph visualizations
 */
export class KnowledgeGraph {
  private container: HTMLElement;
  private data: GraphData;
  private config: Required<GraphConfig>;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;

  constructor(container: HTMLElement, data: GraphData, config: GraphConfig = {}) {
    this.container = container;
    this.data = data;
    this.config = {
      width: config.width ?? 800,
      height: config.height ?? 600,
      nodeRadius: config.nodeRadius ?? 10,
      linkDistance: config.linkDistance ?? 100,
      chargeStrength: config.chargeStrength ?? -300,
      enableZoom: config.enableZoom ?? true,
      enableDrag: config.enableDrag ?? true,
    };
  }

  /**
   * Render the knowledge graph
   */
  render(): void {
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('viewBox', [0, 0, this.config.width, this.config.height]);

    const g = this.svg.append('g');

    // Setup zoom if enabled
    if (this.config.enableZoom) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      this.svg.call(zoom);
    }

    // Create force simulation
    const simulation = d3.forceSimulation(this.data.nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(this.data.edges)
        .id((d: any) => d.id)
        .distance(this.config.linkDistance))
      .force('charge', d3.forceManyBody().strength(this.config.chargeStrength))
      .force('center', d3.forceCenter(this.config.width / 2, this.config.height / 2));

    // Draw edges
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.data.edges)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2);

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.data.nodes)
      .join('circle')
      .attr('r', this.config.nodeRadius)
      .attr('fill', '#69b3a2');

    // Setup drag if enabled
    if (this.config.enableDrag) {
      const drag = d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      node.call(drag as any);
    }

    // Add labels
    const labels = g.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(this.data.nodes)
      .join('text')
      .text(d => d.label ?? d.id)
      .attr('font-size', 12)
      .attr('dx', 15)
      .attr('dy', 4);

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });
  }

  /**
   * Update the graph data
   */
  updateData(data: GraphData): void {
    this.data = data;
    this.destroy();
    this.render();
  }

  /**
   * Destroy the graph and clean up
   */
  destroy(): void {
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
  }
}
