import * as d3 from 'd3';
import type { Edge, Node } from '../types';

/**
 * Interface for edge rendering strategies
 */
export interface EdgeRenderer {
  /**
   * Render edges in the graph
   * @param container - SVG group element to render edges into
   * @param edges - Array of edges to render
   * @param nodes - Array of nodes (for position lookup)
   * @param config - Rendering configuration
   */
  render(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    edges: Edge[],
    nodes: Node[],
    config: EdgeRenderConfig
  ): EdgeRenderResult;

  /**
   * Update edge positions during simulation ticks
   * @param result - Result from initial render call
   */
  update(result: EdgeRenderResult): void;

  /**
   * Clean up resources
   */
  destroy(result: EdgeRenderResult): void;
}

/**
 * Configuration for edge rendering
 */
export interface EdgeRenderConfig {
  stroke?: (d: Edge, i: number) => string;
  strokeWidth?: (d: Edge, i: number) => number;
  strokeOpacity?: number;
}

/**
 * Result from edge rendering
 */
export interface EdgeRenderResult {
  selection: d3.Selection<any, Edge, SVGGElement, unknown>;
  data: any; // Additional data specific to the renderer
}
