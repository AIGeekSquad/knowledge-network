/**
 * GaussianSmoother.ts
 *
 * Implementation of Gaussian smoothing for edge bundling.
 * This smoothing algorithm uses a Gaussian kernel to create weighted
 * averages of neighboring points, producing smooth curves with
 * controllable smoothness through the sigma parameter.
 *
 * References:
 * - Hurter, C., et al. (2012). Graph bundling by kernel density estimation.
 * - Nixon, M. S., & Aguado, A. S. (2019). Feature extraction and image processing.
 */

import { BaseSmoothingStrategy } from './SmoothingStrategy';
import { ControlPoint } from '../EdgeBundling';

/**
 * Gaussian smoothing strategy for edge bundling.
 *
 * This algorithm smooths edges using a Gaussian kernel, which provides
 * a weighted average where closer neighbors have more influence than
 * distant ones. The result is smooth curves that preserve important
 * features while reducing noise.
 *
 * The Gaussian kernel follows the formula:
 * weight(x) = exp(-(x²) / (2σ²))
 * where σ (sigma) controls the width of the kernel.
 */
export class GaussianSmoother extends BaseSmoothingStrategy {
  private readonly sigma: number;
  private readonly kernelSize: number;

  /**
   * Create a new Gaussian smoother.
   *
   * @param sigma Standard deviation for the Gaussian kernel (default: 1.0)
   * @param kernelSize Radius of the smoothing kernel in points (default: 3)
   */
  constructor(sigma: number = 1.0, kernelSize: number = 3) {
    super('GaussianSmoother');
    this.sigma = sigma;
    this.kernelSize = kernelSize;
  }

  /**
   * Apply Gaussian smoothing to control points.
   *
   * For each edge path, this method applies a Gaussian-weighted average
   * to each interior control point using its neighbors within the kernel radius.
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
   * Apply a single iteration of Gaussian smoothing.
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
          // Apply Gaussian kernel
          let sumX = 0;
          let sumY = 0;
          let sumWeight = 0;

          // Convolve with Gaussian kernel
          for (let j = -this.kernelSize; j <= this.kernelSize; j++) {
            const idx = i + j;

            // Check bounds
            if (idx >= 0 && idx < numPoints) {
              // Calculate Gaussian weight
              // weight = exp(-(distance²) / (2σ²))
              const weight = Math.exp(-(j * j) / (2 * this.sigma * this.sigma));

              sumX += points[idx].x * weight;
              sumY += points[idx].y * weight;
              sumWeight += weight;
            }
          }

          // Normalize by total weight
          smoothed.push({
            x: sumX / sumWeight,
            y: sumY / sumWeight,
            vx: points[i].vx,
            vy: points[i].vy,
          });
        }
      }

      // Update only interior points with smoothed values (skip endpoints)
      for (let i = 1; i < numPoints - 1; i++) {
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
   * Get the current sigma value.
   */
  getSigma(): number {
    return this.sigma;
  }

  /**
   * Get the current kernel size.
   */
  getKernelSize(): number {
    return this.kernelSize;
  }
}