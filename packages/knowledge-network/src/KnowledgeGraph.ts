import * as d3 from 'd3';
import type { GraphData, GraphConfig, Node, Accessor } from './types';
import { LayoutEngineState } from './types';
import { EdgeRenderer, EdgeRenderResult, SimpleEdge, EdgeBundling } from './edges';

/**
 * Main class for creating and managing interactive knowledge graph visualizations.
 *
 * @remarks
 * The KnowledgeGraph class provides a powerful D3.js-based visualization for displaying
 * nodes and edges with force-directed layout. It supports various rendering styles,
 * interaction modes (zoom, drag), and customization options through the GraphConfig.
 *
 * The graph uses a physics simulation to position nodes, which can be customized
 * through force parameters like charge strength and link distance. Edges can be
 * rendered as simple lines or with advanced bundling techniques for better clarity
 * in dense graphs.
 *
 * @example
 * ```typescript
 * // Basic usage with minimal configuration
 * const container = document.getElementById('graph-container');
 * const data = {
 *   nodes: [
 *     { id: 'node1', label: 'Concept A' },
 *     { id: 'node2', label: 'Concept B' },
 *     { id: 'node3', label: 'Concept C' }
 *   ],
 *   edges: [
 *     { source: 'node1', target: 'node2' },
 *     { source: 'node2', target: 'node3' }
 *   ]
 * };
 *
 * const graph = new KnowledgeGraph(container, data);
 * graph.render();
 * ```
 *
 * @example
 * ```typescript
 * // Advanced usage with custom configuration and styling
 * const config: GraphConfig = {
 *   width: 1200,
 *   height: 800,
 *   nodeRadius: (node) => node.importance * 10,
 *   nodeFill: (node) => node.category === 'primary' ? '#ff6b6b' : '#4ecdc4',
 *   linkDistance: 150,
 *   chargeStrength: -500,
 *   edgeRenderer: 'bundled',
 *   edgeBundling: {
 *     strength: 0.85,
 *     compatibility: 0.75
 *   },
 *   enableZoom: true,
 *   enableDrag: true,
 *   waitForStable: true,
 *   stabilityThreshold: 0.01
 * };
 *
 * const graph = new KnowledgeGraph(container, data, config);
 * graph.render();
 *
 * // Access the D3 simulation for custom behavior
 * const simulation = graph.getSimulation();
 * simulation?.alpha(0.5).restart();
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic data updates
 * const graph = new KnowledgeGraph(container, initialData);
 * graph.render();
 *
 * // Later, update with new data
 * const newData = await fetchUpdatedGraphData();
 * graph.updateData(newData);
 * ```
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
  private zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  private currentState: LayoutEngineState = LayoutEngineState.INITIAL;
  private selectedNodeId: string | null = null;
  private nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private initialAlpha: number = 1;

  /**
   * Creates a new KnowledgeGraph instance.
   *
   * @param container - The HTML element that will contain the SVG visualization.
   *                    The graph will create an SVG element as a child of this container.
   * @param data - The graph data containing nodes and edges to visualize.
   *               Nodes must have unique `id` properties, and edges must reference
   *               valid node IDs in their `source` and `target` properties.
   * @param config - Optional configuration object to customize the graph appearance and behavior.
   *                 All config properties have sensible defaults if not specified.
   *
   * @remarks
   * The constructor initializes the graph but does not render it. Call `render()` after
   * construction to create the visualization. Configuration options include:
   *
   * - **Dimensions**: `width`, `height` - Set the SVG dimensions
   * - **Node styling**: `nodeRadius`, `nodeFill`, `nodeStroke`, `nodeStrokeWidth` - Can be constants or functions
   * - **Edge styling**: `linkStroke`, `linkStrokeWidth` - Can be constants or functions
   * - **Force parameters**: `linkDistance`, `linkStrength`, `chargeStrength`, `collisionRadius`
   * - **Rendering options**: `edgeRenderer` ('simple' or 'bundled'), `edgeBundling` config
   * - **Interaction**: `enableZoom`, `enableDrag` - Enable/disable user interactions
   * - **Performance**: `waitForStable`, `stabilityThreshold` - Control when edges are rendered
   * - **Advanced**: `similarityFunction` - Custom function for similarity-based node attraction
   *
   * @example
   * ```typescript
   * // Simple construction with defaults
   * const graph = new KnowledgeGraph(container, data);
   *
   * // With custom configuration
   * const graph = new KnowledgeGraph(container, data, {
   *   width: 1000,
   *   height: 600,
   *   nodeRadius: 15,
   *   nodeFill: (node) => node.type === 'primary' ? '#ff0000' : '#0000ff',
   *   enableZoom: true,
   *   edgeRenderer: 'bundled'
   * });
   * ```
   */
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
      zoomExtent: config.zoomExtent,
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
   * Update the state and call the callback if provided
   */
  private updateState(state: LayoutEngineState, progress: number = 0): void {
    this.currentState = state;
    if (this.config.onStateChange) {
      try {
        this.config.onStateChange(state, progress);
      } catch (error) {
        console.error('Error in onStateChange callback:', error);
      }
    }
  }

  /**
   * Handle errors with callback
   */
  private handleError(error: Error, stage: string): void {
    this.updateState(LayoutEngineState.ERROR, 0);
    if (this.config.onError) {
      try {
        this.config.onError(error, stage);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
    console.error(`Error in ${stage}:`, error);
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
   * Renders the knowledge graph visualization in the container element.
   *
   * @remarks
   * This method creates the SVG element, sets up the D3 force simulation, and renders
   * all visual elements (nodes, edges, labels). It must be called after construction
   * to display the graph.
   *
   * The rendering process includes:
   * 1. Creating the SVG canvas with specified dimensions
   * 2. Setting up zoom and pan controls (if enabled)
   * 3. Initializing the force simulation with configured forces
   * 4. Creating node circles with specified styling
   * 5. Setting up drag interactions for nodes (if enabled)
   * 6. Adding text labels for nodes
   * 7. Rendering edges (immediately or after stabilization based on config)
   *
   * The force simulation runs continuously to position nodes. If `waitForStable` is true,
   * edges are only rendered once the simulation reaches the stability threshold, which
   * can improve performance for large graphs.
   *
   * @example
   * ```typescript
   * // Basic rendering
   * const graph = new KnowledgeGraph(container, data);
   * graph.render();
   * ```
   *
   * @example
   * ```typescript
   * // Render with post-render customization
   * const graph = new KnowledgeGraph(container, data, config);
   * graph.render();
   *
   * // Customize simulation after rendering
   * const simulation = graph.getSimulation();
   * simulation?.force('charge', d3.forceManyBody().strength(-1000));
   * simulation?.alpha(0.5).restart();
   * ```
   *
   * @example
   * ```typescript
   * // Wait for stabilization before edges (better for large graphs)
   * const graph = new KnowledgeGraph(container, data, {
   *   waitForStable: true,
   *   stabilityThreshold: 0.005
   * });
   * graph.render();
   * // Edges will appear once simulation stabilizes
   * ```
   *
   * @throws {Error} May throw if the container element is invalid or if D3 operations fail
   */
  render(): void {
    try {
      // Update state to loading
      this.updateState(LayoutEngineState.LOADING, 10);

      const width = this.config.width ?? 800;
      const height = this.config.height ?? 600;

    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .on('click', () => {
        // Clear selection when clicking on empty space
        this.clearSelection();
      });

    const g = this.svg.append('g');

    // Setup zoom if enabled
    if (this.config.enableZoom) {
      const zoomExtent = this.config.zoomExtent || [0.1, 10];
      this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent(zoomExtent)
        .on('zoom', (event) => {
          g.attr('transform', event.transform);
        });

      this.svg.call(this.zoomBehavior);

      // Store zoom behavior reference on the SVG element for testing
      (this.svg.node() as any).__zoomBehavior = this.zoomBehavior;

      // Add fit-to-viewport functionality if enabled
      if (this.config.fitToViewport) {
        setTimeout(() => {
          this.fitToViewport(g, zoom);
        }, 1000); // Wait for initial layout to settle
      }
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
    const linkForce = d3.forceLink(this.data.edges)
      .id((d: any) => d.id);

    // Set link distance - handle constant vs function
    if (typeof this.config.linkDistance === 'function') {
      linkForce.distance((d: any, i) => linkDistanceAccessor(d, i, this.data.edges));
    } else {
      linkForce.distance(this.config.linkDistance ?? 100);
    }

    // Set link strength if provided
    if (this.config.linkStrength !== undefined) {
      linkForce.strength(this.config.linkStrength);
    } else {
      linkForce.strength(this.createLinkStrengthFunction());
    }

    const chargeForce = d3.forceManyBody();

    // Set charge strength - handle constant vs function
    if (typeof this.config.chargeStrength === 'function') {
      chargeForce.strength((d: any, i) => chargeAccessor(d, i, this.data.nodes));
    } else {
      chargeForce.strength(this.config.chargeStrength ?? -300);
    }

    this.simulation = d3.forceSimulation(this.data.nodes as d3.SimulationNodeDatum[])
      .force('link', linkForce)
      .force('charge', chargeForce)
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Add collision detection if configured
    if (this.config.collisionRadius) {
      const collisionRadiusAccessor = this.accessor(this.config.collisionRadius, 10);
      this.simulation.force('collision', d3.forceCollide()
        .radius((d: any, i) => collisionRadiusAccessor(d, i, this.data.nodes) + 2));
    }

    // Add similarity-based attraction if configured
    if (this.config.similarityFunction) {
      this.simulation.force('similarity', this.createSimilarityForce(this.config.similarityFunction));
    }

    // Create link group (edges will be rendered later)
    this.linkGroup = g.append('g').attr('class', 'links');

    // Update state to layout calculating
    this.updateState(LayoutEngineState.LAYOUT_CALCULATING, 30);

    // Draw nodes
    this.nodeGroup = g.append('g').attr('class', 'nodes');
    const node = this.nodeGroup
      .selectAll('circle')
      .data(this.data.nodes)
      .join('circle')
      .attr('r', (d, i) => radiusAccessor(d, i, this.data.nodes))
      .attr('fill', (d, i) => fillAccessor(d, i, this.data.nodes))
      .attr('stroke', (d, i) => strokeAccessor(d, i, this.data.nodes))
      .attr('stroke-width', (d, i) => strokeWidthAccessor(d, i, this.data.nodes))
      .attr('cursor', 'pointer')
      .on('click', (event, d: any) => {
        event.stopPropagation();
        this.selectNode(d.id);
      });

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
          // Recalculate edge bundling after drag ends if using bundled renderer
          if (this.config.edgeRenderer === 'bundled' && this.edgeRenderResult) {
            setTimeout(() => {
              this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);
            }, 100);
          }
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

    // Add a failsafe timeout for edge rendering (max 5 seconds)
    if (this.config.waitForStable) {
      setTimeout(() => {
        if (!edgesRendered) {
          console.log('Force rendering edges after timeout');
          edgesRendered = true;
          this.updateState(LayoutEngineState.EDGE_GENERATING, 70);
          this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);

          // Call onEdgesRendered callback if provided
          if (this.config.onEdgesRendered) {
            setTimeout(() => {
              this.config.onEdgesRendered?.();
              this.updateState(LayoutEngineState.READY, 100);
            }, 50); // Small delay to ensure edges are fully rendered
          } else {
            this.updateState(LayoutEngineState.READY, 100);
          }
        }
      }, 5000); // 5 second maximum wait
    }

    // Store initial alpha for progress calculation
    this.initialAlpha = this.simulation.alpha();

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      const alpha = this.simulation?.alpha() ?? 1;

      // Calculate layout progress (alpha goes from 1 to near 0)
      const layoutProgress = Math.min(99, Math.round((1 - alpha / this.initialAlpha) * 100));

      // Call layout progress callback
      if (this.config.onLayoutProgress && this.currentState === LayoutEngineState.LAYOUT_CALCULATING) {
        try {
          this.config.onLayoutProgress(alpha, layoutProgress);
        } catch (error) {
          console.error('Error in onLayoutProgress callback:', error);
        }
      }

      // Update overall progress during layout calculation
      if (this.currentState === LayoutEngineState.LAYOUT_CALCULATING) {
        const overallProgress = 30 + Math.round(layoutProgress * 0.4); // 30-70% range
        this.updateState(LayoutEngineState.LAYOUT_CALCULATING, overallProgress);
      }

      // Check if simulation has stabilized and render edges
      if (!edgesRendered && this.config.waitForStable) {
        if (alpha < (this.config.stabilityThreshold ?? 0.01)) {
          edgesRendered = true;
          this.updateState(LayoutEngineState.EDGE_GENERATING, 70);
          this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);

          // Call onEdgesRendered callback if provided
          if (this.config.onEdgesRendered) {
            setTimeout(() => {
              this.config.onEdgesRendered?.();
              this.updateState(LayoutEngineState.READY, 100);
            }, 50); // Small delay to ensure edges are fully rendered
          } else {
            this.updateState(LayoutEngineState.READY, 100);
          }
        }
      }

      // Update edge positions if already rendered
      if (edgesRendered && this.edgeRenderResult) {
        this.edgeRenderer.update(this.edgeRenderResult);

        // Update edge labels if they exist
        if (this.config.showEdgeLabels) {
          this.updateEdgeLabels();
        }
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
      edgesRendered = true;
      this.updateState(LayoutEngineState.EDGE_GENERATING, 70);
      this.renderEdges(linkStrokeAccessor, linkStrokeWidthAccessor);

      // Call onEdgesRendered callback if provided
      if (this.config.onEdgesRendered) {
        setTimeout(() => {
          this.config.onEdgesRendered?.();
          this.updateState(LayoutEngineState.READY, 100);
        }, 100); // Small delay to ensure edges are fully rendered
      } else {
        this.updateState(LayoutEngineState.READY, 100);
      }
    }
    } catch (error) {
      this.handleError(error as Error, 'render');
      throw error; // Re-throw to maintain existing behavior
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

    try {
      // Call edge rendering progress callback for start
      if (this.config.onEdgeRenderingProgress) {
        try {
          this.config.onEdgeRenderingProgress(0, this.data.edges.length);
        } catch (error) {
          console.error('Error in onEdgeRenderingProgress callback:', error);
        }
      }

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

      // Call edge rendering progress callback for completion
      if (this.config.onEdgeRenderingProgress) {
        try {
          this.config.onEdgeRenderingProgress(this.data.edges.length, this.data.edges.length);
        } catch (error) {
          console.error('Error in onEdgeRenderingProgress callback:', error);
        }
      }

      // Render edge labels if enabled
      if (this.config.showEdgeLabels) {
        this.renderEdgeLabels();
      }
    } catch (error) {
      this.handleError(error as Error, 'renderEdges');
      throw error;
    }
  }

  /**
   * Render edge labels along the edges
   */
  private renderEdgeLabels(): void {
    if (!this.linkGroup || !this.edgeRenderResult) return;

    // Remove existing labels
    this.linkGroup.selectAll('.edge-label').remove();
    this.linkGroup.selectAll('.edge-label-path').remove();

    // Create a group for labels
    const labelGroup = this.linkGroup.append('g')
      .attr('class', 'edge-labels');

    // For each edge, create a text element along the path
    const edges = this.data.edges;
    const paths = this.edgeRenderResult.selection;

    paths.each(function(_d: any, i: number) {
      const path = d3.select(this) as d3.Selection<SVGPathElement, any, any, any>;
      const edge = edges[i];

      if (!edge.label) return;

      // Create a unique ID for this path
      const pathId = `edge-label-path-${i}`;

      // Clone the path for the text to follow
      labelGroup.append('path')
        .attr('id', pathId)
        .attr('class', 'edge-label-path')
        .attr('d', path.attr('d'))
        .style('fill', 'none')
        .style('stroke', 'none');

      // Create text element that follows the path
      const labelStyle = this.config.edgeLabelStyle || {};
      labelGroup.append('text')
        .attr('class', 'edge-label')
        .append('textPath')
        .attr('href', `#${pathId}`)
        .attr('startOffset', '50%')
        .style('text-anchor', labelStyle.textAnchor || 'middle')
        .style('font-size', `${labelStyle.fontSize || 11}px`)
        .style('fill', labelStyle.fill || '#333')
        .style('font-family', labelStyle.fontFamily || 'Arial, sans-serif')
        .style('dominant-baseline', labelStyle.dominantBaseline || 'middle')
        .style('pointer-events', 'none')
        .style('font-weight', '500')
        .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
        .text(edge.label);
    });
  }

  /**
   * Update edge labels positions during simulation
   */
  private updateEdgeLabels(): void {
    if (!this.linkGroup || !this.edgeRenderResult) return;

    const paths = this.edgeRenderResult.selection;

    // Update the hidden path elements that the text follows
    this.linkGroup.selectAll('.edge-label-path')
      .each(function(_d: any, i: number) {
        const pathElement = paths.nodes()[i];
        if (pathElement) {
          d3.select(this).attr('d', d3.select(pathElement).attr('d'));
        }
      });
  }

  /**
   * Fit the graph to the viewport with optional padding
   */
  private fitToViewport(_g: d3.Selection<SVGGElement, unknown, null, undefined>, zoom: d3.ZoomBehavior<SVGSVGElement, unknown>): void {
    if (!this.svg) return;

    const padding = this.config.padding || 20;
    const nodes = this.data.nodes as any[];

    if (nodes.length === 0) return;

    // Calculate bounding box of all nodes
    const xExtent = d3.extent(nodes, d => d.x) as [number, number];
    const yExtent = d3.extent(nodes, d => d.y) as [number, number];

    const width = this.config.width || 800;
    const height = this.config.height || 600;

    const dx = xExtent[1] - xExtent[0];
    const dy = yExtent[1] - yExtent[0];
    const x = (xExtent[0] + xExtent[1]) / 2;
    const y = (yExtent[0] + yExtent[1]) / 2;

    // Calculate scale to fit with padding
    const scale = Math.min(
      (width - padding * 2) / dx,
      (height - padding * 2) / dy
    );

    // Calculate translation to center
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    // Apply transform
    const transform = d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale);

    this.svg.transition().duration(750).call(
      zoom.transform as any,
      transform
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
   * Updates the graph with new data and re-renders the visualization.
   *
   * @param data - The new graph data containing nodes and edges to visualize.
   *               Must follow the same structure as the initial data.
   *
   * @remarks
   * This method completely replaces the current graph with new data. It destroys
   * the existing visualization (including the SVG and simulation) and creates a
   * new one with the updated data. The configuration remains unchanged.
   *
   * This is useful for:
   * - Loading completely different datasets
   * - Refreshing data from an API
   * - Switching between different graph views
   *
   * Note that this performs a full re-render, which resets the simulation.
   * For incremental updates or animations, you may want to directly manipulate
   * the D3 simulation instead.
   *
   * @example
   * ```typescript
   * // Initial render
   * const graph = new KnowledgeGraph(container, initialData, config);
   * graph.render();
   *
   * // Later, update with new data
   * const newData = {
   *   nodes: [
   *     { id: 'A', label: 'New Node A' },
   *     { id: 'B', label: 'New Node B' }
   *   ],
   *   edges: [
   *     { source: 'A', target: 'B' }
   *   ]
   * };
   * graph.updateData(newData);
   * ```
   *
   * @example
   * ```typescript
   * // Periodic data refresh from API
   * async function refreshGraph() {
   *   const freshData = await fetch('/api/graph-data').then(r => r.json());
   *   graph.updateData(freshData);
   * }
   *
   * // Refresh every 30 seconds
   * setInterval(refreshGraph, 30000);
   * ```
   *
   * @example
   * ```typescript
   * // Switch between different data views
   * const datasets = {
   *   overview: { nodes: [...], edges: [...] },
   *   detailed: { nodes: [...], edges: [...] }
   * };
   *
   * // Toggle between views
   * function switchView(viewName: 'overview' | 'detailed') {
   *   graph.updateData(datasets[viewName]);
   * }
   * ```
   */
  updateData(data: GraphData): void {
    this.data = data;
    this.destroy();
    this.render();
  }

  /**
   * Gets the D3 force simulation instance for advanced customization.
   *
   * @returns The D3 simulation instance, or null if the graph hasn't been rendered yet.
   *
   * @remarks
   * This method provides direct access to the underlying D3 force simulation,
   * allowing advanced users to customize forces, adjust parameters, or hook into
   * simulation events. The simulation controls the physics-based positioning of nodes.
   *
   * Common use cases:
   * - Adjusting force strengths dynamically
   * - Restarting the simulation with different alpha values
   * - Adding custom forces
   * - Listening to simulation events ('tick', 'end')
   * - Programmatically fixing node positions
   *
   * @example
   * ```typescript
   * // Access simulation for customization
   * const graph = new KnowledgeGraph(container, data);
   * graph.render();
   *
   * const simulation = graph.getSimulation();
   * if (simulation) {
   *   // Adjust charge force strength
   *   simulation.force('charge', d3.forceManyBody().strength(-1000));
   *
   *   // Restart with higher alpha for more movement
   *   simulation.alpha(0.5).restart();
   *
   *   // Listen to simulation events
   *   simulation.on('end', () => {
   *     console.log('Simulation stabilized');
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Fix node positions programmatically
   * const simulation = graph.getSimulation();
   * if (simulation) {
   *   const nodes = simulation.nodes();
   *   // Fix the first node at center
   *   nodes[0].fx = 400;
   *   nodes[0].fy = 300;
   *   simulation.alpha(0.3).restart();
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Add a custom force
   * const simulation = graph.getSimulation();
   * if (simulation) {
   *   // Add a force that pulls nodes toward the center
   *   simulation.force('pullToCenter', (alpha) => {
   *     const nodes = simulation.nodes();
   *     nodes.forEach(node => {
   *       node.vx += (400 - node.x) * 0.01 * alpha;
   *       node.vy += (300 - node.y) * 0.01 * alpha;
   *     });
   *   });
   *   simulation.alpha(0.5).restart();
   * }
   * ```
   */
  getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null {
    return this.simulation;
  }

  /**
   * Selects a node and highlights it along with its neighbors.
   *
   * @param nodeId - The ID of the node to select
   *
   * @remarks
   * This method selects a node, highlights it and its connected neighbors,
   * and calls the onNodeSelected callback if provided. The selection state
   * is visually indicated by changing node appearance.
   *
   * @example
   * ```typescript
   * graph.selectNode('node1');
   * // Node and its neighbors are highlighted
   * ```
   */
  selectNode(nodeId: string): void {
    if (!this.nodeGroup) return;

    this.selectedNodeId = nodeId;

    // Get neighbors and connected edges
    const neighbors = this.getNeighbors(nodeId);
    const connectedEdges: string[] = [];

    // Find connected edges
    this.data.edges.forEach((edge, index) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as Node).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as Node).id;

      if (sourceId === nodeId || targetId === nodeId) {
        connectedEdges.push(edge.id || `edge-${index}`);
      }
    });

    // Update node styles
    this.nodeGroup.selectAll('circle')
      .attr('opacity', (d: any) => {
        if (d.id === nodeId) return 1;
        if (neighbors.includes(d.id)) return 0.8;
        return 0.3;
      })
      .attr('stroke-width', (d: any) => {
        if (d.id === nodeId) return 3;
        if (neighbors.includes(d.id)) return 2;
        return 1.5;
      });

    // Update edge styles if edges are rendered
    if (this.linkGroup) {
      this.linkGroup.selectAll('path')
        .attr('opacity', (_d: any, i: number) => {
          const edge = this.data.edges[i];
          const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as Node).id;
          const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as Node).id;

          if (sourceId === nodeId || targetId === nodeId) {
            return 0.8;
          }
          return 0.2;
        });
    }

    // Call the callback if provided
    if (this.config.onNodeSelected) {
      try {
        this.config.onNodeSelected(nodeId, neighbors, connectedEdges);
      } catch (error) {
        console.error('Error in onNodeSelected callback:', error);
      }
    }
  }

  /**
   * Clears the current node selection.
   *
   * @remarks
   * This method removes any node selection and returns all nodes and edges
   * to their default appearance.
   *
   * @example
   * ```typescript
   * graph.clearSelection();
   * // All nodes and edges return to normal appearance
   * ```
   */
  clearSelection(): void {
    if (!this.nodeGroup) return;

    this.selectedNodeId = null;

    // Reset node styles
    this.nodeGroup.selectAll('circle')
      .attr('opacity', 1)
      .attr('stroke-width', 1.5);

    // Reset edge styles
    if (this.linkGroup) {
      this.linkGroup.selectAll('path')
        .attr('opacity', 0.6);
    }
  }

  /**
   * Gets the neighbor node IDs for a given node.
   *
   * @param nodeId - The ID of the node to find neighbors for
   * @returns Array of neighbor node IDs
   *
   * @remarks
   * This method returns all nodes that are directly connected to the
   * specified node via edges (both incoming and outgoing).
   *
   * @example
   * ```typescript
   * const neighbors = graph.getNeighbors('node1');
   * console.log(`Node1 has ${neighbors.length} neighbors`);
   * ```
   */
  getNeighbors(nodeId: string): string[] {
    const neighbors: Set<string> = new Set();

    this.data.edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as Node).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as Node).id;

      if (sourceId === nodeId && targetId !== nodeId) {
        neighbors.add(targetId);
      } else if (targetId === nodeId && sourceId !== nodeId) {
        neighbors.add(sourceId);
      }
    });

    return Array.from(neighbors);
  }

  /**
   * Destroys the graph visualization and cleans up all resources.
   *
   * @remarks
   * This method performs a complete cleanup of the graph visualization:
   * - Stops the force simulation
   * - Removes the SVG element from the DOM
   * - Cleans up edge renderer resources
   * - Releases all internal references
   *
   * Call this method when:
   * - The graph is no longer needed
   * - Before removing the container element
   * - To prevent memory leaks in single-page applications
   * - Before calling `render()` again on the same instance
   *
   * After calling destroy(), the graph instance can be re-rendered by calling
   * `render()` again, or you can create a new instance.
   *
   * @example
   * ```typescript
   * // Basic cleanup
   * const graph = new KnowledgeGraph(container, data);
   * graph.render();
   *
   * // Later, when done with the graph
   * graph.destroy();
   * ```
   *
   * @example
   * ```typescript
   * // In a single-page application component
   * class GraphComponent {
   *   private graph: KnowledgeGraph;
   *
   *   onMount() {
   *     this.graph = new KnowledgeGraph(this.container, data);
   *     this.graph.render();
   *   }
   *
   *   onUnmount() {
   *     // Clean up when component unmounts
   *     this.graph.destroy();
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Re-rendering after destroy
   * const graph = new KnowledgeGraph(container, data, config);
   * graph.render();
   *
   * // Destroy and re-render with same instance
   * graph.destroy();
   * graph.render(); // Creates fresh visualization
   * ```
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
