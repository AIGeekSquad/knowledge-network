/**
 * BilateralSmoother.ts
 *
 * Implementation of bilateral filtering for edge bundling.
 * This edge-preserving smoothing algorithm considers both spatial
 * distance and intensity difference when smoothing, helping maintain
 * sharp features while reducing noise.
 *
 * References:
 * - Tomasi, C., & Manduchi, R. (1998). Bilateral filtering for gray and color images.
 * - Paris, S., et al. (2009). Bilateral filtering: Theory and applications.
 * - Eisemann, E., & Durand, F. (2004). Flash photography enhancement via intrinsic relighting.
 */

import { BaseSmoothingStrategy } from './SmoothingStrategy';
import { ControlPoint } from '../EdgeBundling';

/**
 * Bilateral smoothing strategy for edge bundling.
 *
 * This algorithm provides edge-preserving smoothing by using two kernels:
 * 1. A spatial kernel based on distance between points (like Gaussian)
 * 2. An intensity kernel based on position difference
 *
 * The combination preserves sharp features (like bundle boundaries)
 * while smoothing within similar regions. This is particularly useful
 * for maintaining the structure of tightly bundled edges while reducing
 * noise in loosely bundled areas.
 */
export class BilateralSmoother extends BaseSmoothingStrategy {
  private readonly spatialSigma: number;
  private readonly intensitySigma: number;
  private readonly kernelSize: number;

  /**
   * Create a new bilateral smoother.
   *
   * @param spatialSigma Standard deviation for spatial distance kernel (default: 1.0)
   * @param intensitySigma Standard deviation for intensity/position difference kernel (default: 10.0)
   * @param kernelSize Radius of the smoothing kernel in points (default: 3)
   */
  constructor(
    spatialSigma: number = 1.0,
    intensitySigma: number = 10.0,
    kernelSize: number = 3
  ) {
    super('BilateralSmoother');
    this.spatialSigma = spatialSigma;
    this.intensitySigma = intensitySigma;
    this.kernelSize = kernelSize;
  }

  /**
   * Apply bilateral smoothing to control points.
   *
   * For each edge path, this method applies bilateral filtering which
   * preserves edges while smoothing. Points that are spatially close
   * AND similar in position are averaged together.
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
   * Apply a single iteration of bilateral smoothing.
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
          // Apply bilateral filter
          let sumX = 0;
          let sumY = 0;
          let sumWeight = 0;

          // Current point position (center of kernel)
          const centerX = points[i].x;
          const centerY = points[i].y;

          // Apply bilateral kernel
          for (let j = -this.kernelSize; j <= this.kernelSize; j++) {
            const idx = i + j;

            // Check bounds
            if (idx >= 0 && idx < numPoints) {
              // Calculate spatial weight (based on index distance)
              // This gives more weight to nearby points in the sequence
              const spatialWeight = Math.exp(
                -(j * j) / (2 * this.spatialSigma * this.spatialSigma)
              );

              // Calculate intensity weight (based on position difference)
              // This gives more weight to points with similar positions
              const dx = points[idx].x - centerX;
              const dy = points[idx].y - centerY;
              const intensityDiff = Math.sqrt(dx * dx + dy * dy);
              const intensityWeight = Math.exp(
                -(intensityDiff * intensityDiff) /
                  (2 * this.intensitySigma * this.intensitySigma)
              );

              // Combine weights
              const weight = spatialWeight * intensityWeight;

              sumX += points[idx].x * weight;
              sumY += points[idx].y * weight;
              sumWeight += weight;
            }
          }

          // Normalize by total weight
          if (sumWeight > 0) {
            smoothed.push({
              x: sumX / sumWeight,
              y: sumY / sumWeight,
              vx: points[i].vx,
              vy: points[i].vy,
            });
          } else {
            // Fallback to original point if weights sum to zero
            // (shouldn't happen in practice)
            smoothed.push({
              x: points[i].x,
              y: points[i].y,
              vx: points[i].vx,
              vy: points[i].vy,
            });
          }
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

  /**
   * Get the current spatial sigma value.
   */
  getSpatialSigma(): number {
    return this.spatialSigma;
  }

  /**
   * Get the current intensity sigma value.
   */
  getIntensitySigma(): number {
    return this.intensitySigma;
  }

  /**
   * Get the current kernel size.
   */
  getKernelSize(): number {
    return this.kernelSize;
  }
}