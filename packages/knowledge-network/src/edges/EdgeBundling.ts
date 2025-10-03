import * as d3 from 'd3';
import type { Edge, Node } from '../types';
import type { EdgeRenderer, EdgeRenderConfig, EdgeRenderResult } from './EdgeRenderer';

/**
 * Custom edge compatibility function for determining which edges should bundle together.
 *
 * This function allows you to define custom logic for edge compatibility based on
 * edge metadata, properties, or any domain-specific criteria. The returned value
 * is multiplied with the geometric compatibility calculated by the bundling algorithm.
 *
 * @param edge1 - The first edge to compare
 * @param edge2 - The second edge to compare
 * @returns A number between 0 and 1, where:
 *          - 0 means edges are incompatible and should not bundle
 *          - 1 means edges are fully compatible and should bundle tightly
 *          - Values in between control the bundling strength
 *
 * @example
 * ```typescript
 * // Bundle edges only if they have the same type
 * const sameTypeCompatibility: EdgeCompatibilityFunction = (edge1, edge2) => {
 *   return edge1.metadata?.type === edge2.metadata?.type ? 1 : 0;
 * };
 *
 * // Bundle edges based on shared categories with weighted compatibility
 * const categoryCompatibility: EdgeCompatibilityFunction = (edge1, edge2) => {
 *   const categories1 = edge1.metadata?.categories || [];
 *   const categories2 = edge2.metadata?.categories || [];
 *   const shared = categories1.filter(c => categories2.includes(c));
 *   return shared.length / Math.max(categories1.length, categories2.length, 1);
 * };
 *
 * // Bundle edges going in the same direction more strongly
 * const directionalCompatibility: EdgeCompatibilityFunction = (edge1, edge2) => {
 *   const dir1 = edge1.metadata?.direction || 'both';
 *   const dir2 = edge2.metadata?.direction || 'both';
 *   if (dir1 === dir2) return 1;
 *   if (dir1 === 'both' || dir2 === 'both') return 0.5;
 *   return 0;
 * };
 * ```
 */
export type EdgeCompatibilityFunction = (edge1: Edge, edge2: Edge) => number;

/**
 * Configuration options for edge bundling algorithm.
 *
 * EdgeBundlingConfig extends EdgeRenderConfig with parameters specific to the
 * force-directed edge bundling algorithm. These parameters control how edges
 * are grouped and bundled together to reduce visual clutter.
 *
 * The algorithm works by:
 * 1. Subdividing each edge into control points
 * 2. Calculating compatibility between edge pairs
 * 3. Iteratively moving compatible edges closer together
 * 4. Rendering the bundled edges as smooth curves
 *
 * @example
 * ```typescript
 * // Basic bundling configuration
 * const config: EdgeBundlingConfig = {
 *   subdivisions: 20,
 *   iterations: 60,
 *   compatibilityThreshold: 0.6
 * };
 *
 * // Advanced configuration with custom compatibility
 * const advancedConfig: EdgeBundlingConfig = {
 *   subdivisions: 30,              // More control points for smoother curves
 *   iterations: 90,                 // More iterations for tighter bundles
 *   compatibilityThreshold: 0.5,   // Lower threshold bundles more edges
 *   stepSize: 0.05,                 // Larger steps for faster convergence
 *   stiffness: 0.2,                 // Higher stiffness keeps edges straighter
 *   compatibilityFunction: (e1, e2) => {
 *     // Custom logic: bundle edges with same metadata type
 *     return e1.metadata?.type === e2.metadata?.type ? 1 : 0;
 *   },
 *   stroke: (edge) => edge.metadata?.color || '#999',
 *   strokeWidth: (edge) => edge.metadata?.weight || 1.5,
 *   strokeOpacity: 0.6
 * };
 *
 * // Performance-optimized configuration for large graphs
 * const performanceConfig: EdgeBundlingConfig = {
 *   subdivisions: 10,               // Fewer points for faster updates
 *   iterations: 30,                 // Fewer iterations for quicker rendering
 *   compatibilityThreshold: 0.7,   // Higher threshold reduces calculations
 *   stepSize: 0.08                  // Larger steps for faster convergence
 * };
 * ```
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
 * Edge bundling renderer using the force-directed edge bundling algorithm.
 *
 * EdgeBundling implements a sophisticated edge rendering technique that groups
 * visually similar edges together to reduce clutter in complex graphs. It's
 * particularly effective for graphs with many crossing edges or dense connections.
 *
 * The algorithm works by treating edges as flexible springs that can be attracted
 * to each other based on their geometric and semantic compatibility. Compatible
 * edges are gradually pulled together through iterative force calculations,
 * creating aesthetic bundles that reveal high-level patterns in the graph structure.
 *
 * Based on: Holten, D., & Van Wijk, J. J. (2009). Force-directed edge bundling for graph visualization.
 *
 * @example
 * ```typescript
 * // Basic usage with default settings
 * const bundler = new EdgeBundling();
 * const graph = new KnowledgeNetwork(container, {
 *   edgeRenderer: bundler
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Custom bundling for a hierarchical graph
 * const bundler = new EdgeBundling({
 *   subdivisions: 25,              // More points for smoother curves
 *   iterations: 80,                // More iterations for tighter bundles
 *   compatibilityThreshold: 0.55,  // Bundle moderately similar edges
 *   stiffness: 0.15,               // Allow more curve flexibility
 *   compatibilityFunction: (edge1, edge2) => {
 *     // Bundle edges at the same hierarchy level more strongly
 *     const level1 = edge1.metadata?.level || 0;
 *     const level2 = edge2.metadata?.level || 0;
 *     return level1 === level2 ? 1 : 0.3;
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Dynamic switching between simple and bundled rendering
 * class AdaptiveRenderer {
 *   private simpleRenderer = new SimpleEdge();
 *   private bundledRenderer = new EdgeBundling({
 *     subdivisions: 20,
 *     iterations: 60
 *   });
 *
 *   render(container, edges, nodes, config) {
 *     // Use bundling only when there are many edges
 *     const renderer = edges.length > 100
 *       ? this.bundledRenderer
 *       : this.simpleRenderer;
 *     return renderer.render(container, edges, nodes, config);
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Visualizing different edge types with custom bundling
 * const networkBundler = new EdgeBundling({
 *   compatibilityFunction: (edge1, edge2) => {
 *     const type1 = edge1.metadata?.type;
 *     const type2 = edge2.metadata?.type;
 *
 *     // Strong bundling for same types
 *     if (type1 === type2) return 1;
 *
 *     // Moderate bundling for related types
 *     if ((type1 === 'data' && type2 === 'control') ||
 *         (type1 === 'control' && type2 === 'data')) {
 *       return 0.5;
 *     }
 *
 *     // No bundling for unrelated types
 *     return 0;
 *   },
 *   stroke: (edge) => {
 *     const typeColors = {
 *       'data': '#4CAF50',
 *       'control': '#2196F3',
 *       'dependency': '#FF9800'
 *     };
 *     return typeColors[edge.metadata?.type] || '#999';
 *   }
 * });
 * ```
 *
 * @performance
 * Performance characteristics:
 * - O(n²) complexity for compatibility calculation (n = number of edges)
 * - O(n × s × i) for bundling iterations (s = subdivisions, i = iterations)
 * - Recommended limits:
 *   - < 500 edges for real-time interaction
 *   - < 2000 edges for static visualization
 *   - Use fewer subdivisions/iterations for better performance
 *
 * @implements {EdgeRenderer}
 */
export class EdgeBundling implements EdgeRenderer {
  private config: EdgeBundlingInternalConfig;

  /**
   * Creates a new EdgeBundling renderer instance.
   *
   * @param config - Configuration options for the bundling algorithm.
   *                 All parameters are optional with sensible defaults.
   *
   * @example
   * ```typescript
   * // Create with default configuration
   * const bundler = new EdgeBundling();
   *
   * // Create with custom configuration
   * const bundler = new EdgeBundling({
   *   subdivisions: 30,
   *   iterations: 100,
   *   compatibilityThreshold: 0.5
   * });
   * ```
   */
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

  /**
   * Renders edges as bundled curves using force-directed bundling.
   *
   * This method performs the complete edge bundling process:
   * 1. Initializes control points along each edge
   * 2. Calculates compatibility between all edge pairs
   * 3. Iteratively bundles compatible edges together
   * 4. Renders the bundled edges as smooth SVG paths
   *
   * @param container - SVG group element for rendering paths
   * @param edges - Array of edges to bundle and render
   * @param _nodes - Array of nodes (unused but required by interface)
   * @param config - Additional rendering configuration to merge with constructor config
   *
   * @returns EdgeRenderResult containing the path selection and bundling data
   *
   * @example
   * ```typescript
   * const result = bundler.render(container, edges, nodes, {
   *   stroke: (edge) => edge.metadata?.important ? '#ff0000' : '#999999',
   *   strokeOpacity: 0.7
   * });
   * ```
   */
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

  /**
   * Updates bundled edge positions during force simulation.
   *
   * This method efficiently updates the bundled edges as nodes move during
   * the force simulation. Instead of recalculating the entire bundling,
   * it translates the existing control points based on node movement,
   * preserving the bundled structure while following the nodes.
   *
   * The update strategy:
   * 1. Calculate how much each edge's endpoints have moved
   * 2. Interpolate this movement across all control points
   * 3. Update the SVG paths with the new control point positions
   *
   * @param result - The EdgeRenderResult from render() containing paths and control points
   *
   * @example
   * ```typescript
   * // In a force simulation tick handler
   * simulation.on('tick', () => {
   *   // Update node positions
   *   nodeSelection
   *     .attr('cx', d => d.x)
   *     .attr('cy', d => d.y);
   *
   *   // Update bundled edges
   *   bundler.update(edgeRenderResult);
   * });
   * ```
   *
   * @performance
   * This method is optimized for animation:
   * - O(e × s) complexity where e = edges, s = subdivisions
   * - No bundling recalculation during updates
   * - Smooth interpolation maintains bundle structure
   * - Typical performance: 30-60fps for 500 edges with 20 subdivisions
   */
  update(result: EdgeRenderResult): void {
    const data = result.data as EdgeBundlingData;
    const edges = result.selection.data() as Edge[];

    // Update control points based on current node positions
    edges.forEach((edge, i) => {
      const source = edge.source as any;
      const target = edge.target as any;
      const points = data.controlPoints[i];

      // Store the old start and end positions
      const oldSourceX = points[0].x;
      const oldSourceY = points[0].y;
      const oldTargetX = points[points.length - 1].x;
      const oldTargetY = points[points.length - 1].y;

      // Calculate the delta movement of endpoints
      const deltaSourceX = source.x - oldSourceX;
      const deltaSourceY = source.y - oldSourceY;
      const deltaTargetX = target.x - oldTargetX;
      const deltaTargetY = target.y - oldTargetY;

      // Update all control points proportionally based on endpoint movement
      for (let j = 0; j < points.length; j++) {
        const t = j / (points.length - 1);
        // Interpolate the delta movement across the control points
        points[j].x += deltaSourceX * (1 - t) + deltaTargetX * t;
        points[j].y += deltaSourceY * (1 - t) + deltaTargetY * t;
      }
    });

    // Update paths
    result.selection.attr('d', (_d, i) => data.lineGenerator(data.controlPoints[i]));
  }

  /**
   * Removes all bundled edge paths from the DOM.
   *
   * Cleans up all SVG elements created during rendering. This should be called
   * when switching renderers, removing edges, or destroying the graph.
   *
   * @param result - The EdgeRenderResult containing the paths to remove
   *
   * @example
   * ```typescript
   * // Clean up when switching renderers
   * const bundledResult = bundler.render(container, edges, nodes, config);
   * // ... later ...
   * bundler.destroy(bundledResult);
   * const simpleResult = simpleRenderer.render(container, edges, nodes, config);
   * ```
   */
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
              // Amplify the attractive force for more dramatic bundling
              const forceMagnitude = comp * 3.0;
              fx += (dx / distance) * forceMagnitude;
              fy += (dy / distance) * forceMagnitude;
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
