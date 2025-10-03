import * as d3 from 'd3';
import type { Edge, Node } from '../types';
import type { EdgeRenderer, EdgeRenderConfig, EdgeRenderResult } from './EdgeRenderer';

/**
 * Simple edge renderer using straight lines
 */
export class SimpleEdge implements EdgeRenderer {
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

  update(result: EdgeRenderResult): void {
    result.selection
      .attr('x1', (d: Edge) => d.source.x)
      .attr('y1', (d: Edge) => d.source.y)
      .attr('x2', (d: Edge) => d.target.x)
      .attr('y2', (d: Edge) => d.target.y);
  }

  destroy(result: EdgeRenderResult): void {
    result.selection.remove();
  }
}
