/**
 * @fileoverview Similarity Conflict Resolution Implementation
 * 
 * Provides mathematical strategies for resolving conflicts when multiple similarity
 * functions return different scores for the same node pair. Supports average,
 * weighted average, max, and min resolution strategies.
 * 
 * Key Features:
 * - Mathematical averaging with configurable strategies
 * - Weighted averaging with measure-specific weights
 * - Statistical analysis for conflict detection
 * - High-precision calculations for small differences
 * - Performance optimization for large score arrays
 */

export type ConflictResolutionStrategy = 'average' | 'weighted-average' | 'max' | 'min';

export interface ConflictStatistics {
  /** Mean of all scores */
  mean: number;
  /** Median score value */
  median: number;
  /** Standard deviation (measure of conflict) */
  standardDeviation: number;
  /** Range between min and max */
  range: number;
  /** Variance of scores */
  variance: number;
}

/**
 * Utility class for resolving conflicts between multiple similarity scores
 */
export class SimilarityConflictResolver {
  
  /**
   * Resolve conflicts between multiple similarity scores using specified strategy
   * @param scores Array of similarity scores (0-1 range)
   * @param weights Optional weights for each score (defaults to equal weights)
   * @param strategy Conflict resolution strategy
   * @returns Resolved similarity score
   */
  resolveConflicts(
    scores: number[], 
    weights?: number[], 
    strategy: ConflictResolutionStrategy = 'average'
  ): number {
    // Validate input
    if (scores.length === 0) {
      throw new Error('Cannot resolve conflicts for empty score array');
    }

    if (!this.validateScores(scores)) {
      throw new Error('Invalid input: scores array contains non-numeric values or values outside 0-1 range');
    }

    // Handle single score (no conflict)
    if (scores.length === 1) {
      return scores[0];
    }

    // Validate weights if provided
    if (weights && weights.length !== scores.length) {
      throw new Error('Scores and weights arrays must have the same length');
    }

    switch (strategy) {
      case 'average':
        return this.calculateSimpleAverage(scores);
        
      case 'weighted-average':
        return this.calculateWeightedAverage(scores, weights || this.createEqualWeights(scores.length));
        
      case 'max':
        return Math.max(...scores);
        
      case 'min':
        return Math.min(...scores);
        
      default:
        console.warn(`Unknown conflict resolution strategy: ${strategy}. Using simple average.`);
        return this.calculateSimpleAverage(scores);
    }
  }

  /**
   * Validate that all scores are valid numbers in the 0-1 range
   * @param scores Array of scores to validate
   * @returns True if all scores are valid
   */
  validateScores(scores: number[]): boolean {
    return scores.every(score => 
      typeof score === 'number' && 
      Number.isFinite(score) && 
      score >= 0 && 
      score <= 1
    );
  }

  /**
   * Calculate weighted average of scores
   * @param scores Array of similarity scores
   * @param weights Array of weights for each score
   * @returns Weighted average result
   */
  calculateWeightedAverage(scores: number[], weights: number[]): number {
    if (scores.length !== weights.length) {
      throw new Error('Scores and weights arrays must have the same length');
    }

    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    if (totalWeight === 0) {
      console.warn('Total weight is zero, returning 0');
      return 0;
    }

    const weightedSum = scores.reduce((sum, score, index) => {
      return sum + (score * weights[index]);
    }, 0);

    return weightedSum / totalWeight;
  }

  /**
   * Calculate simple arithmetic average
   * @param scores Array of similarity scores
   * @returns Simple average
   */
  private calculateSimpleAverage(scores: number[]): number {
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return sum / scores.length;
  }

  /**
   * Create equal weights array for given length
   * @param length Number of weights needed
   * @returns Array of equal weights
   */
  private createEqualWeights(length: number): number[] {
    const weight = 1.0 / length;
    return Array(length).fill(weight);
  }

  /**
   * Calculate comprehensive statistics for conflict analysis
   * @param scores Array of similarity scores
   * @returns Statistical analysis of conflicts
   */
  getConflictStatistics(scores: number[]): ConflictStatistics {
    if (scores.length === 0) {
      throw new Error('Cannot calculate statistics for empty score array');
    }

    if (!this.validateScores(scores)) {
      throw new Error('Cannot calculate statistics for invalid scores');
    }

    const mean = this.calculateSimpleAverage(scores);
    const median = this.calculateMedian(scores);
    const variance = this.calculateVariance(scores, mean);
    const standardDeviation = Math.sqrt(variance);
    const range = Math.max(...scores) - Math.min(...scores);

    return {
      mean,
      median,
      standardDeviation,
      range,
      variance
    };
  }

  /**
   * Calculate median value from array of scores
   * @param scores Array of scores
   * @returns Median value
   */
  private calculateMedian(scores: number[]): number {
    const sorted = [...scores].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      // Even number of scores - average the two middle values
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      // Odd number of scores - return the middle value
      return sorted[middle];
    }
  }

  /**
   * Calculate variance of scores
   * @param scores Array of scores
   * @param mean Pre-calculated mean (for efficiency)
   * @returns Variance value
   */
  private calculateVariance(scores: number[], mean: number): number {
    const squaredDifferences = scores.map(score => {
      const diff = score - mean;
      return diff * diff;
    });
    
    return this.calculateSimpleAverage(squaredDifferences);
  }

  /**
   * Detect if scores represent a significant conflict
   * @param scores Array of similarity scores
   * @param threshold Conflict threshold (default: 0.3 standard deviation)
   * @returns True if conflict is detected
   */
  hasSignificantConflict(scores: number[], threshold: number = 0.3): boolean {
    if (scores.length < 2) {
      return false; // No conflict with single score
    }

    const stats = this.getConflictStatistics(scores);
    return stats.standardDeviation > threshold;
  }

  /**
   * Get recommended resolution strategy based on conflict analysis
   * @param scores Array of similarity scores
   * @returns Recommended strategy
   */
  getRecommendedStrategy(scores: number[]): ConflictResolutionStrategy {
    const stats = this.getConflictStatistics(scores);
    
    // High conflict: use weighted average to balance measures
    if (stats.standardDeviation > 0.4) {
      return 'weighted-average';
    }
    
    // Medium conflict: simple average works well
    if (stats.standardDeviation > 0.2) {
      return 'average';
    }
    
    // Low conflict: any strategy works, prefer simple average for speed
    return 'average';
  }

  /**
   * Create a conflict resolution report for debugging
   * @param scores Array of similarity scores
   * @param finalScore Final resolved score
   * @param strategy Strategy used
   * @param weights Weights applied (if any)
   * @returns Detailed conflict resolution report
   */
  createResolutionReport(
    scores: number[],
    finalScore: number,
    strategy: ConflictResolutionStrategy,
    weights?: number[]
  ): ConflictResolutionReport {
    const stats = this.getConflictStatistics(scores);
    
    return {
      inputScores: [...scores],
      finalScore,
      strategy,
      weights: weights ? [...weights] : undefined,
      statistics: stats,
      hasConflict: this.hasSignificantConflict(scores),
      recommendedStrategy: this.getRecommendedStrategy(scores),
      processingTime: 0 // Would be measured in actual usage
    };
  }
}

export interface ConflictResolutionReport {
  inputScores: number[];
  finalScore: number;
  strategy: ConflictResolutionStrategy;
  weights?: number[];
  statistics: ConflictStatistics;
  hasConflict: boolean;
  recommendedStrategy: ConflictResolutionStrategy;
  processingTime: number;
}

/**
 * Factory function to create a new SimilarityConflictResolver instance
 */
export function createConflictResolver(): SimilarityConflictResolver {
  return new SimilarityConflictResolver();
}

/**
 * Standalone utility functions for quick conflict resolution
 */
export const ConflictResolvers = {
  
  /**
   * Quick average resolution
   */
  average: (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  },

  /**
   * Quick weighted average resolution
   */
  weightedAverage: (scores: number[], weights: number[]): number => {
    if (scores.length !== weights.length || scores.length === 0) return 0;
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = scores.reduce((sum, score, i) => sum + score * weights[i], 0);
    return weightedSum / totalWeight;
  },

  /**
   * Quick max resolution
   */
  max: (scores: number[]): number => {
    return scores.length === 0 ? 0 : Math.max(...scores);
  },

  /**
   * Quick min resolution
   */
  min: (scores: number[]): number => {
    return scores.length === 0 ? 0 : Math.min(...scores);
  }

} as const;