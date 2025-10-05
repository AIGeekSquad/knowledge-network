/**
 * SmoothingStrategy.ts
 *
 * Defines the interface and base implementation for edge bundling smoothing algorithms.
 * Part of the modular edge bundling system that follows the brick-and-stud philosophy.
 *
 * This module serves as the "stud" (interface) that different smoothing algorithms
 * connect to, allowing for flexible composition and easy extension of smoothing behaviors.
 */

import { ControlPoint } from '../EdgeBundling';

/**
 * Interface for smoothing strategies used in edge bundling.
 *
 * Smoothing algorithms post-process bundled edges to improve visual quality
 * by reducing noise and creating smoother curves while preserving important
 * features of the bundle structure.
 */
export interface SmoothingStrategy {
  /**
   * Apply smoothing to an array of edge paths.
   *
   * @param points Array of edge paths, where each path is an array of control points
   * @param iterations Number of smoothing iterations to apply
   */
  smooth(points: ControlPoint[][], iterations: number): void;

  /**
   * Get the name of this smoothing strategy.
   * Used for logging and debugging purposes.
   */
  getName(): string;
}

/**
 * Base class for smoothing strategies providing common functionality.
 * Concrete smoothing algorithms should extend this class.
 */
export abstract class BaseSmoothingStrategy implements SmoothingStrategy {
  protected readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * Apply smoothing to the given points.
   * Must be implemented by concrete smoothing strategies.
   */
  abstract smooth(points: ControlPoint[][], iterations: number): void;

  /**
   * Get the name of this smoothing strategy.
   */
  getName(): string {
    return this.name;
  }

  /**
   * Helper method to validate input parameters.
   *
   * @param points Array of edge paths to validate
   * @param iterations Number of iterations to validate
   * @throws Error if parameters are invalid
   */
  protected validateInput(points: ControlPoint[][], iterations: number): void {
    if (!points || !Array.isArray(points)) {
      throw new Error(`${this.name}: Invalid points array`);
    }

    if (iterations < 0 || !Number.isInteger(iterations)) {
      throw new Error(`${this.name}: Iterations must be a non-negative integer`);
    }

    if (points.length === 0) {
      // Nothing to smooth, but not an error
      return;
    }

    // Validate that all paths have valid control points
    for (let i = 0; i < points.length; i++) {
      const path = points[i];
      if (!Array.isArray(path)) {
        throw new Error(`${this.name}: Invalid path at index ${i}`);
      }

      for (let j = 0; j < path.length; j++) {
        const point = path[j];
        if (!point || typeof point.x !== 'number' || typeof point.y !== 'number') {
          throw new Error(`${this.name}: Invalid control point at path ${i}, point ${j}`);
        }
      }
    }
  }
}