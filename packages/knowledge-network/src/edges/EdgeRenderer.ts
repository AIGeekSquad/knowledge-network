import * as d3 from 'd3';
import type { Edge, Node } from '../types';

/**
 * Interface for edge rendering strategies in the Knowledge Network graph.
 *
 * The EdgeRenderer interface defines the contract for custom edge rendering implementations.
 * It follows a three-phase lifecycle: render -> update -> destroy.
 *
 * Implementations can range from simple straight lines to complex bundled edges with
 * force-directed algorithms. The interface is designed to be flexible enough to support
 * various rendering techniques while maintaining consistency across the system.
 *
 * @example
 * ```typescript
 * // Creating a custom curved edge renderer
 * class CurvedEdgeRenderer implements EdgeRenderer {
 *   render(container, edges, nodes, config) {
 *     const selection = container
 *       .selectAll<SVGPathElement, Edge>('path')
 *       .data(edges)
 *       .join('path')
 *       .attr('fill', 'none')
 *       .attr('stroke', config.stroke ? (d, i) => config.stroke!(d, i) : '#999')
 *       .attr('stroke-width', 2);
 *
 *     return {
 *       selection,
 *       data: { curvature: 0.2 } // Store custom data for updates
 *     };
 *   }
 *
 *   update(result) {
 *     const data = result.data;
 *     result.selection.attr('d', (d: Edge) => {
 *       const source = d.source as Node;
 *       const target = d.target as Node;
 *       // Create a curved path between source and target
 *       const dx = target.x! - source.x!;
 *       const dy = target.y! - source.y!;
 *       const dr = Math.sqrt(dx * dx + dy * dy) * data.curvature;
 *       return `M${source.x},${source.y}A${dr},${dr} 0 0,1 ${target.x},${target.y}`;
 *     });
 *   }
 *
 *   destroy(result) {
 *     result.selection.remove();
 *   }
 * }
 *
 * // Using the custom renderer
 * const renderer = new CurvedEdgeRenderer();
 * const result = renderer.render(container, edges, nodes, {
 *   stroke: (d) => d.metadata?.type === 'strong' ? '#000' : '#999',
 *   strokeOpacity: 0.7
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Creating an animated edge renderer
 * class AnimatedEdgeRenderer implements EdgeRenderer {
 *   render(container, edges, nodes, config) {
 *     const selection = container
 *       .selectAll<SVGLineElement, Edge>('line')
 *       .data(edges)
 *       .join('line')
 *       .attr('stroke', '#999')
 *       .attr('stroke-dasharray', '5,5');
 *
 *     // Animate the dash offset for a flowing effect
 *     selection
 *       .append('animate')
 *       .attr('attributeName', 'stroke-dashoffset')
 *       .attr('values', '10;0')
 *       .attr('dur', '2s')
 *       .attr('repeatCount', 'indefinite');
 *
 *     return { selection, data: null };
 *   }
 *
 *   update(result) {
 *     // Update line positions during force simulation
 *     result.selection
 *       .attr('x1', (d: Edge) => (d.source as Node).x ?? 0)
 *       .attr('y1', (d: Edge) => (d.source as Node).y ?? 0)
 *       .attr('x2', (d: Edge) => (d.target as Node).x ?? 0)
 *       .attr('y2', (d: Edge) => (d.target as Node).y ?? 0);
 *   }
 *
 *   destroy(result) {
 *     result.selection.selectAll('animate').remove();
 *     result.selection.remove();
 *   }
 * }
 * ```
 */
export interface EdgeRenderer {
  /**
   * Renders edges in the graph visualization.
   *
   * This method is called once during initialization to create the edge elements.
   * It should create all necessary SVG elements and return a result object that
   * will be used for subsequent updates.
   *
   * The renderer has full control over how edges are visualized - it can create
   * lines, paths, or even complex SVG structures with multiple elements per edge.
   *
   * @param container - The SVG group element (`<g>`) where edges should be rendered.
   *                    This container is dedicated to edges and sits below nodes in the z-order.
   * @param edges - Array of edge objects to render. Each edge has source/target references
   *                that will be resolved to Node objects with x/y positions.
   * @param nodes - Array of all nodes in the graph. Useful for looking up positions or
   *                creating node-aware edge layouts.
   * @param config - Configuration object controlling edge appearance (colors, widths, opacity).
   *
   * @returns An EdgeRenderResult containing the D3 selection of created elements and
   *          any custom data needed for updates.
   *
   * @example
   * ```typescript
   * render(container, edges, nodes, config) {
   *   // Create SVG elements for edges
   *   const selection = container
   *     .selectAll('line')
   *     .data(edges)
   *     .join('line');
   *
   *   // Apply initial styling
   *   selection
   *     .attr('stroke', config.stroke || (() => '#999'))
   *     .attr('stroke-width', config.strokeWidth || (() => 1.5));
   *
   *   // Return result for update phase
   *   return { selection, data: null };
   * }
   * ```
   */
  render(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    edges: Edge[],
    nodes: Node[],
    config: EdgeRenderConfig
  ): EdgeRenderResult;

  /**
   * Updates edge positions during force simulation ticks.
   *
   * This method is called repeatedly during the force simulation to update edge
   * positions as nodes move. It should be highly optimized as it runs many times
   * per second during animation.
   *
   * The update method receives the result from the render phase and should use it
   * to efficiently update edge positions without recreating elements.
   *
   * @param result - The EdgeRenderResult returned from the render() method,
   *                 containing the D3 selection and any custom data.
   *
   * @example
   * ```typescript
   * update(result) {
   *   // Efficiently update positions using the stored selection
   *   result.selection
   *     .attr('x1', (d: Edge) => (d.source as Node).x ?? 0)
   *     .attr('y1', (d: Edge) => (d.source as Node).y ?? 0)
   *     .attr('x2', (d: Edge) => (d.target as Node).x ?? 0)
   *     .attr('y2', (d: Edge) => (d.target as Node).y ?? 0);
   * }
   * ```
   */
  update(result: EdgeRenderResult): void;

  /**
   * Cleans up resources when edges are removed or the graph is destroyed.
   *
   * This method should remove all SVG elements created during render and clean up
   * any event listeners, timers, or other resources.
   *
   * @param result - The EdgeRenderResult to clean up.
   *
   * @example
   * ```typescript
   * destroy(result) {
   *   // Remove all created elements
   *   result.selection.remove();
   *
   *   // Clean up any additional resources if needed
   *   if (result.data?.timer) {
   *     clearInterval(result.data.timer);
   *   }
   * }
   * ```
   */
  destroy(result: EdgeRenderResult): void;
}

/**
 * Configuration options for edge rendering.
 *
 * This interface defines the visual properties that can be customized for edges.
 * All properties are optional, allowing renderers to provide sensible defaults.
 *
 * The configuration uses functions for stroke and strokeWidth to allow dynamic
 * styling based on edge properties or metadata.
 *
 * @example
 * ```typescript
 * // Static configuration
 * const config: EdgeRenderConfig = {
 *   strokeOpacity: 0.6
 * };
 *
 * // Dynamic configuration based on edge properties
 * const config: EdgeRenderConfig = {
 *   stroke: (edge) => {
 *     // Color edges based on their type
 *     switch(edge.metadata?.type) {
 *       case 'dependency': return '#ff6b6b';
 *       case 'reference': return '#4ecdc4';
 *       case 'parent': return '#45b7d1';
 *       default: return '#95a5a6';
 *     }
 *   },
 *   strokeWidth: (edge) => {
 *     // Width based on edge weight
 *     const weight = edge.metadata?.weight || 1;
 *     return Math.min(weight * 2, 10);
 *   },
 *   strokeOpacity: 0.7
 * };
 *
 * // Configuration for highlighting specific edges
 * const highlightConfig: EdgeRenderConfig = {
 *   stroke: (edge) => {
 *     const isHighlighted = edge.source.id === selectedNodeId ||
 *                          edge.target.id === selectedNodeId;
 *     return isHighlighted ? '#ff0000' : '#cccccc';
 *   },
 *   strokeWidth: (edge) => {
 *     const isHighlighted = edge.source.id === selectedNodeId ||
 *                          edge.target.id === selectedNodeId;
 *     return isHighlighted ? 3 : 1;
 *   },
 *   strokeOpacity: 0.8
 * };
 * ```
 */
export interface EdgeRenderConfig {
  /**
   * Function to determine the stroke color for each edge.
   *
   * @param d - The edge data object
   * @param i - The index of the edge in the edges array
   * @returns CSS color string (hex, rgb, named color, etc.)
   *
   * @example
   * ```typescript
   * stroke: (edge, index) => {
   *   // Alternate colors
   *   return index % 2 === 0 ? '#ff6b6b' : '#4ecdc4';
   * }
   * ```
   */
  stroke?: (d: Edge, i: number) => string;

  /**
   * Function to determine the stroke width for each edge.
   *
   * @param d - The edge data object
   * @param i - The index of the edge in the edges array
   * @returns Width in pixels
   *
   * @example
   * ```typescript
   * strokeWidth: (edge, index) => {
   *   // Variable width based on metadata
   *   return edge.metadata?.strength || 1.5;
   * }
   * ```
   */
  strokeWidth?: (d: Edge, i: number) => number;

  /**
   * Global opacity for all edges (0.0 - 1.0).
   *
   * This sets the base opacity for all edges. Individual edges can still
   * have different opacities if the stroke function returns colors with alpha.
   *
   * @default 0.6
   *
   * @example
   * ```typescript
   * strokeOpacity: 0.3 // Semi-transparent edges
   * ```
   */
  strokeOpacity?: number;
}

/**
 * Result object returned from edge rendering.
 *
 * This interface encapsulates the rendering output, including the D3 selection
 * of created elements and any custom data needed for updates.
 *
 * The data property is intentionally flexible (any type) to allow renderers
 * to store whatever information they need for efficient updates. This could
 * include cached calculations, animation states, or complex data structures
 * for bundled edges.
 *
 * @example
 * ```typescript
 * // Simple renderer result
 * const result: EdgeRenderResult = {
 *   selection: d3.selectAll('line.edge'),
 *   data: null
 * };
 *
 * // Complex renderer with custom data
 * const result: EdgeRenderResult = {
 *   selection: d3.selectAll('path.bundled-edge'),
 *   data: {
 *     controlPoints: [[{x: 0, y: 0}, {x: 50, y: 50}, {x: 100, y: 100}]],
 *     animationFrame: 0,
 *     bundleGroups: [0, 0, 1, 1, 2],
 *     compatibility: [[1, 0.8], [0.8, 1]]
 *   }
 * };
 * ```
 */
export interface EdgeRenderResult {
  /**
   * D3 selection containing all rendered edge elements.
   *
   * This selection is used in the update() method to efficiently update
   * edge positions during force simulation. The selection should be bound
   * to the edge data array for proper data joins.
   */
  selection: d3.Selection<any, Edge, SVGGElement, unknown>;

  /**
   * Custom data specific to the renderer implementation.
   *
   * This can store any information needed for efficient updates, such as:
   * - Pre-calculated values to avoid recalculation during updates
   * - Animation states or timers
   * - Complex data structures for advanced rendering (e.g., edge bundling)
   * - References to additional SVG elements or groups
   *
   * For simple renderers, this can be null.
   */
  data: any;
}
