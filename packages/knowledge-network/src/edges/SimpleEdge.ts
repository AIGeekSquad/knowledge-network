import * as d3 from 'd3';
import type { Edge, Node } from '../types';
import type { EdgeRenderer, EdgeRenderConfig, EdgeRenderResult } from './EdgeRenderer';

/**
 * Simple edge renderer using straight lines.
 *
 * SimpleEdge is the default edge renderer that creates straight SVG lines between nodes.
 * It's the most performant option for graphs with a moderate number of edges and provides
 * clean, direct visual connections between nodes.
 *
 * This renderer is ideal for:
 * - Small to medium-sized graphs (< 1000 edges)
 * - Hierarchical layouts where edge bundling isn't needed
 * - Real-time interactive visualizations requiring fast updates
 * - Cases where edge clarity is more important than aesthetic bundling
 *
 * @example
 * ```typescript
 * // Basic usage with default configuration
 * const renderer = new SimpleEdge();
 * const graph = new KnowledgeNetwork(container, {
 *   edgeRenderer: renderer
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Using SimpleEdge with custom styling
 * const renderer = new SimpleEdge();
 * const result = renderer.render(edgeContainer, edges, nodes, {
 *   stroke: (edge) => {
 *     // Color code by edge type
 *     if (edge.metadata?.type === 'critical') return '#ff0000';
 *     if (edge.metadata?.type === 'warning') return '#ffaa00';
 *     return '#999999';
 *   },
 *   strokeWidth: (edge) => {
 *     // Thicker lines for important connections
 *     return edge.metadata?.importance || 1.5;
 *   },
 *   strokeOpacity: 0.5
 * });
 *
 * // During force simulation
 * simulation.on('tick', () => {
 *   renderer.update(result);
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Comparing SimpleEdge with EdgeBundling
 * import { SimpleEdge } from './SimpleEdge';
 * import { EdgeBundling } from './EdgeBundling';
 *
 * // Use SimpleEdge for smaller graphs or when performance is critical
 * const simpleRenderer = new SimpleEdge();
 *
 * // Switch to EdgeBundling for larger graphs with many crossing edges
 * const bundledRenderer = new EdgeBundling({
 *   subdivisions: 20,
 *   iterations: 60
 * });
 *
 * // You can dynamically switch renderers
 * let currentRenderer = edges.length < 500 ? simpleRenderer : bundledRenderer;
 * ```
 *
 * @implements {EdgeRenderer}
 */
export class SimpleEdge implements EdgeRenderer {
  /**
   * Renders edges as straight SVG lines.
   *
   * This method creates `<line>` elements for each edge, which are the most
   * efficient SVG elements for straight connections. The lines are styled
   * according to the provided configuration.
   *
   * @param container - The SVG group element where lines will be created
   * @param edges - Array of edges to render as lines
   * @param _nodes - Array of nodes (unused in simple renderer but required by interface)
   * @param config - Configuration for line appearance
   *
   * @returns EdgeRenderResult with the D3 selection of line elements and null data
   *
   * @example
   * ```typescript
   * render(container, edges, nodes, config) {
   *   // Creates SVG structure like:
   *   // <g>
   *   //   <line x1="0" y1="0" x2="100" y2="100" stroke="#999" stroke-width="1.5"/>
   *   //   <line x1="50" y1="50" x2="150" y2="75" stroke="#999" stroke-width="1.5"/>
   *   //   ...
   *   // </g>
   *
   *   const selection = container
   *     .selectAll<SVGLineElement, Edge>('line')
   *     .data(edges)
   *     .join('line')
   *     .attr('stroke', config.stroke || '#999')
   *     .attr('stroke-opacity', config.strokeOpacity || 0.6)
   *     .attr('stroke-width', config.strokeWidth || 1.5);
   *
   *   return { selection, data: null };
   * }
   * ```
   */
  render(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    edges: Edge[],
    _nodes: Node[],
    config: EdgeRenderConfig
  ): EdgeRenderResult {
    const selection = container
      .selectAll<SVGLineElement, Edge>('line')
      .data(edges)
      .join('line')
      .attr('stroke', config.stroke ? (d, i) => config.stroke!(d, i) : '#999')
      .attr('stroke-opacity', config.strokeOpacity ?? 0.6)
      .attr('stroke-width', config.strokeWidth ? (d, i) => config.strokeWidth!(d, i) : 1.5);

    return {
      selection,
      data: null,
    };
  }

  /**
   * Updates line positions based on current node positions.
   *
   * This method is called during force simulation ticks to update the x1, y1, x2, y2
   * attributes of each line element. It's optimized for performance as it runs
   * many times per second during animation.
   *
   * The method assumes that edge.source and edge.target have been resolved to
   * Node objects with x and y properties by the force simulation.
   *
   * @param result - The EdgeRenderResult from the render method containing the line selection
   *
   * @example
   * ```typescript
   * update(result) {
   *   // Updates each line's endpoints
   *   // If source node is at (10, 20) and target at (100, 150):
   *   // <line x1="10" y1="20" x2="100" y2="150" .../>
   *
   *   result.selection
   *     .attr('x1', (d: Edge) => (d.source as Node).x ?? 0)
   *     .attr('y1', (d: Edge) => (d.source as Node).y ?? 0)
   *     .attr('x2', (d: Edge) => (d.target as Node).x ?? 0)
   *     .attr('y2', (d: Edge) => (d.target as Node).y ?? 0);
   * }
   * ```
   *
   * @performance
   * This method is highly optimized:
   * - Direct attribute updates without recalculation
   * - No object allocation during updates
   * - Fallback to 0 for undefined positions prevents NaN errors
   * - Typical performance: ~60fps for 1000 edges on modern hardware
   */
  update(result: EdgeRenderResult): void {
    result.selection
      .attr('x1', (d: Edge) => (d.source as Node).x ?? 0)
      .attr('y1', (d: Edge) => (d.source as Node).y ?? 0)
      .attr('x2', (d: Edge) => (d.target as Node).x ?? 0)
      .attr('y2', (d: Edge) => (d.target as Node).y ?? 0);
  }

  /**
   * Removes all line elements from the DOM.
   *
   * This method is called when the graph is destroyed or when switching to a
   * different renderer. It ensures clean removal of all SVG elements created
   * by this renderer.
   *
   * @param result - The EdgeRenderResult containing the selection to remove
   *
   * @example
   * ```typescript
   * destroy(result) {
   *   // Removes all line elements from the container
   *   result.selection.remove();
   *   // After this, the container will be empty and ready for a new renderer
   * }
   * ```
   */
  destroy(result: EdgeRenderResult): void {
    result.selection.remove();
  }
}
