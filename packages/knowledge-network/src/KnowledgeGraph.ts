import * as d3 from 'd3';
import type { GraphData, GraphConfig, Node, Accessor } from './types';
import { EdgeRenderer, EdgeRenderResult, SimpleEdge, EdgeBundling } from './edges';

/**
 * Main class for creating and managing knowledge graph visualizations
 */
export class KnowledgeGraph {
  private container: HTMLElement;
  private data: GraphData;
  private config: GraphConfig;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;
  private edgeRenderer: EdgeRenderer;
  private edgeRenderResult: EdgeRenderResult | null = null;
  private linkGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

  constructor(container: HTMLElement, data: GraphData, config: GraphConfig = {}) {
    this.container = container;
    this.data = data;
    this.config = {
      width: config.width ?? 800,
      height: config.height ?? 600,
      nodeRadius: config.nodeRadius ?? 10,
      nodeFill: config.nodeFill ?? '#69b3a2',
      nodeStroke: config.nodeStroke ?? '#fff',
      nodeStrokeWidth: config.nodeStrokeWidth ?? 1.5,
      linkDistance: config.linkDistance ?? 100,
      linkStrength: config.linkStrength,
      linkStroke: config.linkStroke ?? '#999',
      linkStrokeWidth: config.linkStrokeWidth ?? 1.5,
      chargeStrength: config.chargeStrength ?? -300,
      collisionRadius: config.collisionRadius,
      similarityFunction: config.similarityFunction,
      edgeRenderer: config.edgeRenderer ?? 'simple',
      edgeBundling: config.edgeBundling,
      waitForStable: config.waitForStable ?? false,
      stabilityThreshold: config.stabilityThreshold ?? 0.01,
      enableZoom: config.enableZoom ?? true,
      enableDrag: config.enableDrag ?? true,
      dimensions: config.dimensions ?? 2,
    };

    // Initialize edge renderer
    this.edgeRenderer = this.createEdgeRenderer();
  }

  /**
   * Create the appropriate edge renderer based on configuration
   */
  private createEdgeRenderer(): EdgeRenderer {
    if (this.config.edgeRenderer === 'bundled') {
      return new EdgeBundling(this.config.edgeBundling);
    }
    return new SimpleEdge();
  }

  /**
   * Convert accessor to a function that can be called
   */
  private accessor<T, R>(accessor: Accessor<T, R> | undefined, defaultValue: R): (d: T, i: number, nodes: T[]) => R {
    if (accessor === undefined) {
      return () => defaultValue;
    }
    if (typeof accessor === 'function') {
      return accessor as (d: T, i: number, nodes: T[]) => R;
    }
    return () => accessor;
  }

  /**
   * Render the knowledge graph
   */
  render(): void {
    const width = this.config.width ?? 800;
    const height = this.config.height ?? 600;

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

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

    // Create accessors
    const radiusAccessor = this.accessor(this.config.nodeRadius, 10);
    const fillAccessor = this.accessor(this.config.nodeFill, '#69b3a2');
    const strokeAccessor = this.accessor(this.config.nodeStroke, '#fff');
    const strokeWidthAccessor = this.accessor(this.config.nodeStrokeWidth, 1.5);
    const chargeAccessor = this.accessor(this.config.chargeStrength, -300);
    
    const linkDistanceAccessor = this.accessor(this.config.linkDistance, 100);
    const linkStrokeAccessor = this.accessor(this.config.linkStroke, '#999');
    const linkStrokeWidthAccessor = this.accessor(this.config.linkStrokeWidth, 1.5);

    // Create force simulation
    this.simulation = d3.forceSimulation(this.data.nodes as d3.SimulationNodeDatum[])
      .force('link', d3.forceLink(this.data.edges)
        .id((d: any) => d.id)
        .distance((d: any, i) => linkDistanceAccessor(d, i, this.data.edges))
        .strength(this.config.linkStrength ?? this.createLinkStrengthFunction()))
      .force('charge', d3.forceManyBody()
        .strength((d: any, i) => chargeAccessor(d, i, this.data.nodes)))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Add collision detection if configured
    const collisionRadiusAccessor = this.config.collisionRadius 
      ? this.accessor(this.config.collisionRadius, 10)
      : radiusAccessor;
    
    this.simulation.force('collision', d3.forceCollide()
      .radius((d: any, i) => collisionRadiusAccessor(d, i, this.data.nodes) + 2));

    // Add similarity-based attraction if configured
    if (this.config.similarityFunction) {
      this.simulation.force('similarity', this.createSimilarityForce(this.config.similarityFunction));
    }

    // Create link group (edges will be rendered later)
    this.linkGroup = g.append('g').attr('class', 'links');

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.data.nodes)
      .join('circle')
      .attr('r', (d, i) => radiusAccessor(d, i, this.data.nodes))
      .attr('fill', (d, i) => fillAccessor(d, i, this.data.nodes))
      .attr('stroke', (d, i) => strokeAccessor(d, i, this.data.nodes))
      .attr('stroke-width', (d, i) => strokeWidthAccessor(d, i, this.data.nodes));

    // Setup drag if enabled
    if (this.config.enableDrag) {
      const drag = d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d: any) => {
          if (!event.active) this.simulation?.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d: any) => {
          if (!event.active) this.simulation?.alphaTarget(0);
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

    // Track if edges have been rendered
    let edgesRendered = false;

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      // Check if simulation has stabilized and render edges
      if (!edgesRendered && this.config.waitForStable) {
        const alpha = this.simulation?.alpha() ?? 1;
        if (alpha < (this.config.stabilityThreshold ?? 0.01)) {
          edgesRendered = true;
          this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);
        }
      }

      // Update edge positions if already rendered
      if (edgesRendered && this.edgeRenderResult) {
        this.edgeRenderer.update(this.edgeRenderResult);
      }

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    // If not waiting for stable, render edges immediately
    if (!this.config.waitForStable) {
      this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);
    }
  }

  /**
   * Render edges using the configured edge renderer
   */
  private renderEdges(
    linkStrokeAccessor: (d: any, i: number, nodes: any[]) => string,
    linkStrokeWidthAccessor: (d: any, i: number, nodes: any[]) => number
  ): void {
    if (!this.linkGroup) return;

    this.edgeRenderResult = this.edgeRenderer.render(
      this.linkGroup,
      this.data.edges,
      this.data.nodes,
      {
        stroke: (d, i) => linkStrokeAccessor(d, i, this.data.edges),
        strokeWidth: (d, i) => linkStrokeWidthAccessor(d, i, this.data.edges),
        strokeOpacity: 0.6,
      }
    );
  }

  /**
   * Create a link strength function based on edge types (ontology)
   */
  private createLinkStrengthFunction() {
    return (edge: any) => {
      // Default strength, can be overridden by edge.strength
      if (edge.strength !== undefined) {
        return edge.strength;
      }
      // Type-based strength for ontology relationships
      if (edge.type) {
        const typeStrengths: Record<string, number> = {
          'is-a': 1.5,
          'part-of': 1.2,
          'related-to': 0.8,
          'similar-to': 0.6,
        };
        return typeStrengths[edge.type] ?? 1.0;
      }
      return 1.0;
    };
  }

  /**
   * Create a custom force for similarity-based attraction
   */
  private createSimilarityForce(similarityFn: (a: Node, b: Node) => number) {
    return (alpha: number) => {
      const nodes = this.data.nodes as any[];
      const strength = 0.1;
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          
          // Calculate similarity
          const similarity = similarityFn(a, b);
          
          if (similarity > 0) {
            // Attract similar nodes
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
              const force = (similarity * strength * alpha) / distance;
              const fx = dx * force;
              const fy = dy * force;
              
              a.vx += fx;
              a.vy += fy;
              b.vx -= fx;
              b.vy -= fy;
            }
          }
        }
      }
    };
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
   * Get the current simulation instance
   */
  getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null {
    return this.simulation;
  }

  /**
   * Destroy the graph and clean up
   */
  destroy(): void {
    if (this.edgeRenderResult) {
      this.edgeRenderer.destroy(this.edgeRenderResult);
      this.edgeRenderResult = null;
    }
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
    this.linkGroup = null;
  }
}
