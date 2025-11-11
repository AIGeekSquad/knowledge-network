/**
 * Smoothing Module Exports
 *
 * This module provides various smoothing strategies for edge bundling.
 * Each strategy implements the SmoothingStrategy interface, allowing
 * them to be used interchangeably in the edge bundling algorithm.
 *
 * Available smoothing algorithms:
 * - LaplacianSmoother: Simple neighbor averaging
 * - GaussianSmoother: Gaussian kernel-based smoothing
 * - BilateralSmoother: Edge-preserving smoothing
 */

export { SmoothingStrategy, BaseSmoothingStrategy } from './SmoothingStrategy';
export { LaplacianSmoother } from './LaplacianSmoother';
export { GaussianSmoother } from './GaussianSmoother';
export { BilateralSmoother } from './BilateralSmoother';

// Import for use in factory function
import { LaplacianSmoother } from './LaplacianSmoother';
import { GaussianSmoother } from './GaussianSmoother';
import { BilateralSmoother } from './BilateralSmoother';
import type { SmoothingStrategy } from './SmoothingStrategy';

/**
 * Factory function to create a smoothing strategy based on type.
 *
 * @param type The type of smoothing strategy to create
 * @param options Optional configuration for specific smoothers
 * @returns A configured smoothing strategy
 */
export function createSmoothingStrategy(
  type: 'laplacian' | 'gaussian' | 'bilateral',
  options?: {
    sigma?: number;
    spatialSigma?: number;
    intensitySigma?: number;
    kernelSize?: number;
  }
): SmoothingStrategy {
  switch (type) {
    case 'laplacian':
      return new LaplacianSmoother();

    case 'gaussian':
      return new GaussianSmoother(
        options?.sigma ?? 1.0,
        options?.kernelSize ?? 3
      );

    case 'bilateral':
      return new BilateralSmoother(
        options?.spatialSigma ?? 1.0,
        options?.intensitySigma ?? 10.0,
        options?.kernelSize ?? 3
      );

    default:
      // Default to Laplacian if unknown type
      return new LaplacianSmoother();
  }
}