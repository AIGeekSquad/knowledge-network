/**
 * LaplacianSmoother.ts
 *
 * Implementation of Laplacian smoothing for edge bundling.
 * This smoothing algorithm averages each control point with its neighbors,
 * creating smoother curves while preserving edge endpoints.
 *
 * Reference:
 * - Taubin, G. (1995). A signal processing approach to fair surface design.
 * - Field, D. A. (1988). Laplacian smoothing and Delaunay triangulations.
 */

import { BaseSmoothingStrategy } from './SmoothingStrategy';
import { ControlPoint } from '../EdgeBundling';

/**
 * Laplacian smoothing strategy for edge bundling.
 *
 * This algorithm smooths edges by averaging each control point with its
 * immediate neighbors. It's computationally efficient and produces
 * smooth results, though it may shrink curves slightly over many iterations.
 *
 * The implementation uses a weighted average where the current point
 * has weight 2 and each neighbor has weight 1, which helps preserve
 * the overall shape better than simple averaging.
 */
export class LaplacianSmoother extends BaseSmoothingStrategy {
  constructor() {
    super('LaplacianSmoother');
  }

  /**
   * Apply Laplacian smoothing to control points.
   *
   * For each edge path, this method averages each interior control point
   * with its immediate neighbors while keeping endpoints fixed.
   *
   * @param points Array of edge paths to smooth
   * @param iterations Number of smoothing iterations to apply
   */
  smooth(points: ControlPoint[][], iterations: number): void {
    // Validate input
    this.validateInput(points, iterations);

    // Apply smoothing for the specified number of iterations
    for (let iter = 0; iter < iterations; iter++) {
      this.applySingleIteration(points);
    }
  }

  /**
   * Apply a single iteration of Laplacian smoothing.
   *
   * @param controlPoints Array of edge paths to smooth
   */
  private applySingleIteration(controlPoints: ControlPoint[][]): void {
    controlPoints.forEach(points => {
      const numPoints = points.length;

      // Skip edges with too few points to smooth
      if (numPoints <= 2) {
        return;
      }

      // Create smoothed version of the points
      const smoothed: ControlPoint[] = [];

      for (let i = 0; i < numPoints; i++) {
        if (i === 0 || i === numPoints - 1) {
          // Keep endpoints fixed to maintain edge connectivity
          smoothed.push({
            x: points[i].x,
            y: points[i].y,
            vx: points[i].vx,
            vy: points[i].vy,
          });
        } else {
          // Apply weighted average with neighbors
          // Weight: previous (1), current (2), next (1)
          // This weighting helps preserve the overall shape
          const newX = (points[i - 1].x + 2 * points[i].x + points[i + 1].x) / 4;
          const newY = (points[i - 1].y + 2 * points[i].y + points[i + 1].y) / 4;

          smoothed.push({
            x: newX,
            y: newY,
            vx: points[i].vx,
            vy: points[i].vy,
          });
        }
      }

      // Update original points with smoothed values
      for (let i = 0; i < numPoints; i++) {
        points[i].x = smoothed[i].x;
        points[i].y = smoothed[i].y;
        // Preserve velocity if it exists
        if (smoothed[i].vx !== undefined) {
          points[i].vx = smoothed[i].vx;
        }
        if (smoothed[i].vy !== undefined) {
          points[i].vy = smoothed[i].vy;
        }
      }
    });
  }
}