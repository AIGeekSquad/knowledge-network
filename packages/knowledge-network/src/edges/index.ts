/**
 * Edge rendering system for the Knowledge Network visualization library.
 *
 * This module provides a flexible plugin architecture for rendering edges in graph
 * visualizations. It includes two built-in renderers and supports custom implementations.
 *
 * ## Overview
 *
 * The edge rendering system is designed around the EdgeRenderer interface, which
 * defines a three-phase lifecycle: render -> update -> destroy. This architecture
 * allows for efficient animation during force simulations while maintaining clean
 * separation between rendering strategies.
 *
 * ## Available Renderers
 *
 * ### SimpleEdge
 * - Renders edges as straight SVG lines
 * - Best for small to medium graphs (< 1000 edges)
 * - Highest performance, lowest visual complexity
 * - Default renderer for most use cases
 *
 * ### EdgeBundling
 * - Groups similar edges together using force-directed bundling
 * - Best for dense graphs with many crossing edges
 * - Reduces visual clutter by creating aesthetic bundles
 * - Configurable compatibility functions for domain-specific bundling
 *
 * ## Creating Custom Renderers
 *
 * Implement the EdgeRenderer interface to create custom edge visualizations:
 *
 * @example
 * ```typescript
 * import { EdgeRenderer, EdgeRenderConfig, EdgeRenderResult } from '@knowledge-network/edges';
 *
 * class GlowingEdgeRenderer implements EdgeRenderer {
 *   render(container, edges, nodes, config) {
 *     const defs = container.append('defs');
 *     const filter = defs.append('filter')
 *       .attr('id', 'glow');
 *     filter.append('feGaussianBlur')
 *       .attr('stdDeviation', '3')
 *       .attr('result', 'coloredBlur');
 *
 *     const selection = container
 *       .selectAll('line')
 *       .data(edges)
 *       .join('line')
 *       .attr('stroke', config.stroke || (() => '#00ff00'))
 *       .attr('stroke-width', 2)
 *       .attr('filter', 'url(#glow)');
 *
 *     return { selection, data: { filter } };
 *   }
 *
 *   update(result) {
 *     result.selection
 *       .attr('x1', d => d.source.x)
 *       .attr('y1', d => d.source.y)
 *       .attr('x2', d => d.target.x)
 *       .attr('y2', d => d.target.y);
 *   }
 *
 *   destroy(result) {
 *     result.data.filter.remove();
 *     result.selection.remove();
 *   }
 * }
 * ```
 *
 * ## Choosing the Right Renderer
 *
 * @example
 * ```typescript
 * import { SimpleEdge, EdgeBundling } from '@knowledge-network/edges';
 *
 * function selectRenderer(edges: Edge[], graphType: string) {
 *   // Use bundling for dense graphs
 *   if (edges.length > 200) {
 *     return new EdgeBundling({
 *       subdivisions: 15,
 *       iterations: 50
 *     });
 *   }
 *
 *   // Use bundling for hierarchical visualizations
 *   if (graphType === 'hierarchical') {
 *     return new EdgeBundling({
 *       compatibilityFunction: (e1, e2) => {
 *         // Bundle edges at the same level
 *         return e1.metadata?.level === e2.metadata?.level ? 1 : 0.3;
 *       }
 *     });
 *   }
 *
 *   // Default to simple edges
 *   return new SimpleEdge();
 * }
 * ```
 *
 * ## Integration with Knowledge Network
 *
 * @example
 * ```typescript
 * import { KnowledgeNetwork } from '@knowledge-network/core';
 * import { EdgeBundling } from '@knowledge-network/edges';
 *
 * const network = new KnowledgeNetwork(container, {
 *   nodes: data.nodes,
 *   edges: data.edges,
 *   edgeRenderer: new EdgeBundling({
 *     subdivisions: 20,
 *     iterations: 60,
 *     compatibilityThreshold: 0.6,
 *     stroke: (edge) => {
 *       // Color by edge type
 *       const typeColors = {
 *         'dependency': '#e74c3c',
 *         'reference': '#3498db',
 *         'parent': '#2ecc71'
 *       };
 *       return typeColors[edge.metadata?.type] || '#95a5a6';
 *     }
 *   })
 * });
 * ```
 *
 * @module edges
 */

// Core interfaces
export { EdgeRenderer, EdgeRenderConfig, EdgeRenderResult } from './EdgeRenderer';

// Built-in renderers
export { SimpleEdge } from './SimpleEdge';
export {
  EdgeBundling,
  EdgeBundlingConfig,
  EdgeCompatibilityFunction,
  CurveType,
  SmoothingType
} from './EdgeBundling';
