import * as d3 from 'd3';
import type { Edge, Node } from '../types';
import type { EdgeRenderer, EdgeRenderConfig, EdgeRenderResult } from './EdgeRenderer';

/**
 * Custom edge compatibility function
 * Can use edge metadata and properties to determine compatibility
 */
export type EdgeCompatibilityFunction = (edge1: Edge, edge2: Edge) => number;

/**
 * Edge bundling configuration
 */
export interface EdgeBundlingConfig extends EdgeRenderConfig {
  /**
   * Number of subdivision points along each edge
   * Higher values create smoother curves but are more computationally expensive
   * @default 20
   */
  subdivisions?: number;

  /**
   * Compatibility threshold for edge bundling (0-1)
   * Edges with compatibility above this threshold will bundle together
   * @default 0.6
   */
  compatibilityThreshold?: number;

  /**
   * Number of bundling iterations
   * More iterations create tighter bundles
   * @default 90
   */
  iterations?: number;

  /**
   * Step size for each bundling iteration
   * Controls how much edges move toward each other
   * @default 0.04
   */
  stepSize?: number;

  /**
   * Spring constant for edge stiffness
   * Higher values keep edges closer to straight lines
   * @default 0.1
   */
  stiffness?: number;

  /**
   * Custom compatibility function
   * Allows custom logic based on edge properties and metadata
   * If provided, this function's result is multiplied with the default geometric compatibility
   * @default undefined
   */
  compatibilityFunction?: EdgeCompatibilityFunction;
}

/**
 * Control point for edge bundling
 */
interface ControlPoint {
  x: number;
  y: number;
}

/**
 * Edge bundling data
 */
interface EdgeBundlingData {
  controlPoints: ControlPoint[][];
  lineGenerator: d3.Line<ControlPoint>;
}

/**
 * Internal config type for EdgeBundling
 * All properties required except compatibilityFunction, which remains optional
 */
type EdgeBundlingInternalConfig = Required<Omit<EdgeBundlingConfig, 'compatibilityFunction'>> & { compatibilityFunction?: EdgeCompatibilityFunction };

/**
 * Edge bundling renderer using force-directed edge bundling algorithm
 * Based on: Holten, D., & Van Wijk, J. J. (2009). Force-directed edge bundling for graph visualization.
 */

export class EdgeBundling implements EdgeRenderer {
  private config: EdgeBundlingInternalConfig;

  constructor(config: EdgeBundlingConfig = {}) {
    this.config = {
      stroke: config.stroke ?? (() => '#999'),
      strokeWidth: config.strokeWidth ?? (() => 1.5),
      strokeOpacity: config.strokeOpacity ?? 0.6,
      subdivisions: config.subdivisions ?? 20,
      compatibilityThreshold: config.compatibilityThreshold ?? 0.6,
      iterations: config.iterations ?? 90,
      stepSize: config.stepSize ?? 0.04,
      stiffness: config.stiffness ?? 0.1,
      compatibilityFunction: config.compatibilityFunction,
    };
  }

  render(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    edges: Edge[],
    _nodes: Node[],
    config: EdgeRenderConfig
  ): EdgeRenderResult {
    // Merge config
    const renderConfig = { ...this.config, ...config };

    // Initialize control points for each edge
    const controlPoints = this.initializeControlPoints(edges);

    // Perform edge bundling
    this.performBundling(edges, controlPoints);

    // Create line generator for smooth curves
    const lineGenerator = d3.line<ControlPoint>()
      .x(d => d.x)
      .y(d => d.y)
      .curve(d3.curveBasis); // Use basis spline for smooth curves

    // Render edges as paths
    const selection = container
      .selectAll<SVGPathElement, Edge>('path')
      .data(edges)
      .join('path')
      .attr('fill', 'none')
      .attr('stroke', renderConfig.stroke ? (_d, i) => renderConfig.stroke!(_d, i) : '#999')
      .attr('stroke-opacity', renderConfig.strokeOpacity)
      .attr('stroke-width', renderConfig.strokeWidth ? (_d, i) => renderConfig.strokeWidth!(_d, i) : 1.5)
      .attr('d', (_d, i) => lineGenerator(controlPoints[i]));

    const bundlingData: EdgeBundlingData = {
      controlPoints,
      lineGenerator,
    };

    return {
      selection,
      data: bundlingData,
    };
  }

  update(result: EdgeRenderResult): void {
    const data = result.data as EdgeBundlingData;
    const edges = result.selection.data() as Edge[];

    // Update control points based on current node positions
    edges.forEach((edge, i) => {
      const source = edge.source as any;
      const target = edge.target as any;
      const points = data.controlPoints[i];

      // Update start and end points
      points[0] = { x: source.x, y: source.y };
      points[points.length - 1] = { x: target.x, y: target.y };

      // Interpolate intermediate points
      for (let j = 1; j < points.length - 1; j++) {
        const t = j / (points.length - 1);
        points[j].x = source.x * (1 - t) + target.x * t;
        points[j].y = source.y * (1 - t) + target.y * t;
      }
    });

    // Re-run bundling with updated positions
    this.performBundling(edges, data.controlPoints);

    // Update paths
    result.selection.attr('d', (_d, i) => data.lineGenerator(data.controlPoints[i]));
  }

  destroy(result: EdgeRenderResult): void {
    result.selection.remove();
  }

  /**
   * Initialize control points for each edge
   */
  private initializeControlPoints(edges: Edge[]): ControlPoint[][] {
    return edges.map(edge => {
      const source = edge.source as any;
      const target = edge.target as any;
      const points: ControlPoint[] = [];

      // Create subdivision points along the edge
      for (let i = 0; i <= this.config.subdivisions; i++) {
        const t = i / this.config.subdivisions;
        points.push({
          x: source.x * (1 - t) + target.x * t,
          y: source.y * (1 - t) + target.y * t,
        });
      }

      return points;
    });
  }

  /**
   * Perform force-directed edge bundling
   */
  private performBundling(edges: Edge[], controlPoints: ControlPoint[][]): void {
    const n = edges.length;

    // Compute compatibility between all edge pairs
    const compatibility = this.computeCompatibility(edges);

    // Perform bundling iterations
    for (let iter = 0; iter < this.config.iterations; iter++) {
      // Gradually decrease step size
      const step = this.config.stepSize * (1 - iter / this.config.iterations);

      // For each edge
      for (let i = 0; i < n; i++) {
        const points = controlPoints[i];

        // For each control point (except endpoints)
        for (let p = 1; p < points.length - 1; p++) {
          let fx = 0;
          let fy = 0;

          // Calculate attractive force from compatible edges
          for (let j = 0; j < n; j++) {
            if (i === j) continue;

            const comp = compatibility[i][j];
            if (comp < this.config.compatibilityThreshold) continue;

            const otherPoints = controlPoints[j];
            const otherPoint = otherPoints[p];

            // Attractive force toward compatible edge
            const dx = otherPoint.x - points[p].x;
            const dy = otherPoint.y - points[p].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              fx += (dx / distance) * comp;
              fy += (dy / distance) * comp;
            }
          }

          // Spring force toward straight line
          const source = points[0];
          const target = points[points.length - 1];
          const t = p / (points.length - 1);
          const straightX = source.x * (1 - t) + target.x * t;
          const straightY = source.y * (1 - t) + target.y * t;

          fx += (straightX - points[p].x) * this.config.stiffness;
          fy += (straightY - points[p].y) * this.config.stiffness;

          // Update position
          points[p].x += fx * step;
          points[p].y += fy * step;
        }
      }
    }
  }

  /**
   * Compute compatibility between all edge pairs
   */
  private computeCompatibility(edges: Edge[]): number[][] {
    const n = edges.length;
    const compatibility: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      const e1 = edges[i];
      const s1 = e1.source as any;
      const t1 = e1.target as any;

      for (let j = i + 1; j < n; j++) {
        const e2 = edges[j];
        const s2 = e2.source as any;
        const t2 = e2.target as any;

        // Calculate various compatibility metrics

        // 1. Angle compatibility
        const v1x = t1.x - s1.x;
        const v1y = t1.y - s1.y;
        const v2x = t2.x - s2.x;
        const v2y = t2.y - s2.y;

        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

        const angleComp = Math.abs((v1x * v2x + v1y * v2y) / (len1 * len2));

        // 2. Scale compatibility
        const lAvg = (len1 + len2) / 2;
        const scaleComp = 2 / (lAvg / Math.min(len1, len2) + Math.max(len1, len2) / lAvg);

        // 3. Position compatibility
        const m1x = (s1.x + t1.x) / 2;
        const m1y = (s1.y + t1.y) / 2;
        const m2x = (s2.x + t2.x) / 2;
        const m2y = (s2.y + t2.y) / 2;

        const mDist = Math.sqrt((m1x - m2x) ** 2 + (m1y - m2y) ** 2);
        const posComp = lAvg / (lAvg + mDist);

        // 4. Visibility compatibility
        const i0x = Math.max(Math.min(s1.x, t1.x), Math.min(s2.x, t2.x));
        const i0y = Math.max(Math.min(s1.y, t1.y), Math.min(s2.y, t2.y));
        const i1x = Math.min(Math.max(s1.x, t1.x), Math.max(s2.x, t2.x));
        const i1y = Math.min(Math.max(s1.y, t1.y), Math.max(s2.y, t2.y));

        const visComp = (i1x - i0x >= 0 && i1y - i0y >= 0)
          ? Math.min(1, ((i1x - i0x) * (i1y - i0y)) / ((len1 * len2) / 4))
          : 0;

        // Combined geometric compatibility
        let comp = angleComp * scaleComp * posComp * visComp;

        // Apply custom compatibility function if provided
        if (this.config.compatibilityFunction) {
          const customComp = this.config.compatibilityFunction(e1, e2);
          // Multiply with geometric compatibility to combine both
          comp *= customComp;
        }

        compatibility[i][j] = comp;
        compatibility[j][i] = comp;
      }
    }

    return compatibility;
  }
}
