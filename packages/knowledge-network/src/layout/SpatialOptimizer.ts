/**
 * @fileoverview SpatialOptimizer - Translates similarity scores to spatial coordinates with convergence monitoring
 * 
 * Handles configurable similarity-to-distance mapping, coordinate optimization, force integration,
 * and convergence detection for similarity-based node positioning.
 */

import {
  Position3D,
  Node,
  EnhancedLayoutNode,
  ConvergenceMetrics,
  ClusteringContext,
  LayoutConfig,
  NodeConvergenceState,
  PositionDelta,
  BoundingBox
} from '../types';

/**
 * Similarity-to-distance mapping function type
 */
export type SimilarityToDistanceMapper = (similarity: number, config?: any) => number;

/**
 * Pre-defined similarity-to-distance mapping algorithms
 */
export class SimilarityMappingAlgorithms {
  /**
   * Exponential distance mapping: high similarity = small distance
   * Formula: maxDistance * (1 - similarity^exponent)
   */
  public static exponential(similarity: number, config: { maxDistance: number; exponent: number } = { maxDistance: 100, exponent: 2 }): number {
    return config.maxDistance * (1 - Math.pow(similarity, config.exponent));
  }

  /**
   * Linear inverse mapping: distance = maxDistance * (1 - similarity)
   */
  public static linear(similarity: number, config: { maxDistance: number } = { maxDistance: 100 }): number {
    return config.maxDistance * (1 - similarity);
  }

  /**
   * Logarithmic mapping for non-linear similarity relationships
   * Formula: maxDistance * -log(similarity + epsilon) / log(1 + epsilon)
   */
  public static logarithmic(similarity: number, config: { maxDistance: number; epsilon: number } = { maxDistance: 100, epsilon: 0.01 }): number {
    const normalizedSim = similarity + config.epsilon;
    const maxLog = -Math.log(config.epsilon);
    const currentLog = -Math.log(normalizedSim);
    return config.maxDistance * (currentLog / maxLog);
  }

  /**
   * Spring-based mapping using Hooke's law simulation
   * Formula: restLength * (1 - similarity * springConstant)
   */
  public static spring(similarity: number, config: { restLength: number; springConstant: number } = { restLength: 80, springConstant: 0.8 }): number {
    return config.restLength * (1 - similarity * config.springConstant);
  }

  /**
   * Threshold-based mapping: binary distance based on similarity threshold
   */
  public static threshold(similarity: number, config: { threshold: number; closeDistance: number; farDistance: number } = { threshold: 0.5, closeDistance: 20, farDistance: 100 }): number {
    return similarity >= config.threshold ? config.closeDistance : config.farDistance;
  }

  /**
   * Power law mapping for scale-free network layouts
   */
  public static powerLaw(similarity: number, config: { scale: number; exponent: number } = { scale: 100, exponent: 1.5 }): number {
    return config.scale * Math.pow(1 - similarity + 0.01, config.exponent);
  }
}

/**
 * SpatialOptimizer translates similarity scores to spatial coordinates with configurable mapping
 */
export class SpatialOptimizer {
  private convergenceMetrics: ConvergenceMetrics;
  private previousPositions = new Map<string, Position3D>();
  private similarityMapper: SimilarityToDistanceMapper;
  private mappingConfig: any;

  constructor(
    mapper: SimilarityToDistanceMapper = SimilarityMappingAlgorithms.exponential,
    mappingConfig?: any
  ) {
    this.similarityMapper = mapper;
    this.mappingConfig = mappingConfig || { maxDistance: 100, exponent: 2 };

    this.convergenceMetrics = {
      isConverged: false,
      stability: 0,
      iterations: 0,
      positionDelta: 0,
      averageMovement: 0,
      maxMovement: 0,
      stabilityRatio: 0,
      iterationCount: 0,
      timeElapsed: 0
    };
  }

  /**
   * Optimize node positions based on similarity matrix using configurable mapping
   */
  public optimizePositions(
    similarities: Map<string, number>,
    constraints: { boundingBox?: BoundingBox; dimensions: 2 | 3 }
  ): Position3D[] {
    // Extract unique node IDs from similarity matrix keys
    const nodeIds = this.extractNodeIds(similarities);
    const positions: Position3D[] = [];

    // Initialize random positions within bounds
    const bounds = constraints.boundingBox || {
      minX: 0, maxX: 800, minY: 0, maxY: 600, minZ: 0, maxZ: constraints.dimensions === 3 ? 400 : 0
    };

    for (let i = 0; i < nodeIds.length; i++) {
      const x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      const z = constraints.dimensions === 3
        ? bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ)
        : 0;

      positions.push({ x, y, z });
    }

    // Apply similarity-based optimization using stress minimization
    return this.applySimilarityOptimization(positions, similarities, nodeIds, constraints);
  }

  /**
   * Monitor convergence state for position updates
   */
  public monitorConvergence(
    positions: Position3D[],
    previousPositions: Position3D[]
  ): ConvergenceMetrics {
    if (positions.length !== previousPositions.length) {
      throw new Error('Position arrays must have same length for convergence monitoring');
    }

    let totalMovement = 0;
    let maxMovement = 0;
    let stableNodes = 0;
    const stabilityThreshold = 0.01;

    // Calculate position deltas
    for (let i = 0; i < positions.length; i++) {
      const current = positions[i];
      const previous = previousPositions[i];

      const delta = this.calculatePositionDelta(current, previous);
      totalMovement += delta.magnitude;
      maxMovement = Math.max(maxMovement, delta.magnitude);

      if (delta.magnitude < stabilityThreshold) {
        stableNodes++;
      }
    }

    const averageMovement = positions.length > 0 ? totalMovement / positions.length : 0;
    const stabilityRatio = positions.length > 0 ? stableNodes / positions.length : 1;

    // Update convergence metrics
    this.convergenceMetrics = {
      isConverged: stabilityRatio > 0.95 && maxMovement < 0.01,
      stability: stabilityRatio,
      iterations: this.convergenceMetrics.iterations + 1,
      positionDelta: maxMovement,
      averageMovement,
      maxMovement,
      stabilityRatio,
      iterationCount: this.convergenceMetrics.iterations + 1,
      timeElapsed: this.convergenceMetrics.timeElapsed + 16.67 // ~60fps assumption
    };

    return this.convergenceMetrics;
  }

  /**
   * Apply force integration with similarity and physics forces
   */
  public applyForceIntegration(
    similarities: Map<string, number>,
    forces: any[] // D3 force data
  ): Position3D[] {
    // This is a placeholder for hybrid force + similarity positioning
    // In a full implementation, this would integrate with D3.js force simulation

    const nodeIds = this.extractNodeIds(similarities);
    const positions: Position3D[] = [];

    // Generate positions considering both similarity and force data
    for (let i = 0; i < nodeIds.length; i++) {
      // Start with similarity-based positioning
      const similarityPosition = this.calculateSimilarityBasedPosition(nodeIds[i], similarities, nodeIds);

      // Apply force modifications if available
      const forceModification = forces.length > i ? forces[i] : { x: 0, y: 0, z: 0 };

      positions.push({
        x: similarityPosition.x + (forceModification.x || 0) * 0.1, // 10% force influence
        y: similarityPosition.y + (forceModification.y || 0) * 0.1,
        z: similarityPosition.z + (forceModification.z || 0) * 0.1
      });
    }

    return positions;
  }

  /**
   * Set similarity-to-distance mapping function
   */
  public setSimilarityMapper(
    mapper: SimilarityToDistanceMapper,
    config?: any
  ): void {
    this.similarityMapper = mapper;
    this.mappingConfig = config;
  }

  /**
   * Get current mapping configuration
   */
  public getMappingConfig(): { mapper: SimilarityToDistanceMapper; config: any } {
    return {
      mapper: this.similarityMapper,
      config: this.mappingConfig
    };
  }

  /**
   * Test different mapping algorithms and return quality metrics
   */
  public benchmarkMappingAlgorithms(
    similarities: Map<string, number>,
    testAlgorithms: Array<{
      name: string;
      mapper: SimilarityToDistanceMapper;
      config?: any;
    }>
  ): Array<{
    name: string;
    stressScore: number;
    convergenceIterations: number;
    qualityMetric: number;
  }> {
    const results = [];

    for (const algorithm of testAlgorithms) {
      // Temporarily switch to test algorithm
      const originalMapper = this.similarityMapper;
      const originalConfig = this.mappingConfig;

      this.setSimilarityMapper(algorithm.mapper, algorithm.config);

      // Run optimization and measure quality
      const startTime = performance.now();
      const positions = this.optimizePositions(similarities, { dimensions: 2 });
      const endTime = performance.now();

      // Calculate stress (how well distances match target similarities)
      const stress = this.calculateStress(similarities, positions, this.extractNodeIds(similarities));
      const convergenceTime = endTime - startTime;

      // Quality metric combining stress and convergence speed
      const qualityMetric = 1 / (1 + stress + convergenceTime / 1000);

      results.push({
        name: algorithm.name,
        stressScore: stress,
        convergenceIterations: Math.ceil(convergenceTime / 16.67), // ~60fps assumption
        qualityMetric
      });

      // Restore original mapper
      this.setSimilarityMapper(originalMapper, originalConfig);
    }

    return results.sort((a, b) => b.qualityMetric - a.qualityMetric);
  }

  /**
   * Calculate layout stress (how well spatial distances match similarity scores)
   */
  public calculateStress(
    similarities: Map<string, number>,
    positions: Position3D[],
    nodeIds: string[]
  ): number {
    let totalStress = 0;
    let comparisons = 0;

    for (let i = 0; i < nodeIds.length; i++) {
      for (let j = i + 1; j < nodeIds.length; j++) {
        const key = `${nodeIds[i]}|${nodeIds[j]}`;
        const similarity = similarities.get(key);

        if (similarity !== undefined && i < positions.length && j < positions.length) {
          const targetDistance = this.similarityMapper(similarity, this.mappingConfig);
          const actualDistance = this.calculateDistance(positions[i], positions[j]);

          // Stress is squared difference between target and actual distances
          const stress = Math.pow(targetDistance - actualDistance, 2);
          totalStress += stress;
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? Math.sqrt(totalStress / comparisons) : 0;
  }

  /**
   * Calculate position delta between two positions
   */
  public calculatePositionDelta(current: Position3D, previous: Position3D): PositionDelta {
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const dz = current.z - previous.z;
    const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz);

    return { dx, dy, dz, magnitude };
  }

  /**
   * Get current convergence state
   */
  public getConvergenceState(): ConvergenceMetrics {
    return { ...this.convergenceMetrics };
  }

  /**
   * Reset convergence tracking
   */
  public resetConvergence(): void {
    this.convergenceMetrics = {
      isConverged: false,
      stability: 0,
      iterations: 0,
      positionDelta: 0,
      averageMovement: 0,
      maxMovement: 0,
      stabilityRatio: 0,
      iterationCount: 0,
      timeElapsed: 0
    };
    this.previousPositions.clear();
  }

  private applySimilarityOptimization(
    initialPositions: Position3D[],
    similarities: Map<string, number>,
    nodeIds: string[],
    constraints: { boundingBox?: BoundingBox; dimensions: 2 | 3 }
  ): Position3D[] {
    let positions = [...initialPositions];
    const maxIterations = 50;
    const learningRate = 0.1;

    // Iterative optimization using stress minimization with configurable mapping
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const forces: Position3D[] = positions.map(() => ({ x: 0, y: 0, z: 0 }));

      // Calculate similarity-based forces using configurable mapping
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const key = `${nodeIds[i]}|${nodeIds[j]}`;
          const similarity = similarities.get(key) || 0;

          // Convert similarity to target distance using configurable mapping
          const targetDistance = this.similarityMapper(similarity, this.mappingConfig);

          // Calculate current distance
          const currentDistance = this.calculateDistance(positions[i], positions[j]);

          // Apply spring force based on distance deviation
          const force = (currentDistance - targetDistance) * learningRate / Math.max(currentDistance, 1);

          const dx = positions[j].x - positions[i].x;
          const dy = positions[j].y - positions[i].y;
          const dz = positions[j].z - positions[i].z;

          forces[i].x -= force * dx;
          forces[i].y -= force * dy;
          forces[i].z -= force * dz;
          forces[j].x += force * dx;
          forces[j].y += force * dy;
          forces[j].z += force * dz;
        }
      }

      // Apply forces to positions
      for (let i = 0; i < positions.length; i++) {
        positions[i] = {
          x: positions[i].x + forces[i].x,
          y: positions[i].y + forces[i].y,
          z: constraints.dimensions === 3 ? positions[i].z + forces[i].z : 0
        };
      }

      // Apply boundary constraints
      positions = this.applyBoundaryConstraints(positions, constraints.boundingBox);
    }

    return positions;
  }

  private extractNodeIds(similarities: Map<string, number>): string[] {
    const nodeIds = new Set<string>();
    for (const key of similarities.keys()) {
      const [source, target] = key.split('|');
      nodeIds.add(source);
      nodeIds.add(target);
    }
    return Array.from(nodeIds);
  }

  private calculateSimilarityBasedPosition(
    nodeId: string,
    similarities: Map<string, number>,
    allNodeIds: string[]
  ): Position3D {
    // Simple centroid calculation based on similar nodes
    let totalX = 0;
    let totalY = 0;
    let totalZ = 0;
    let weightSum = 0;

    for (const otherId of allNodeIds) {
      if (otherId === nodeId) continue;

      const key = [nodeId, otherId].sort().join('|');
      const similarity = similarities.get(key) || 0;

      if (similarity > 0.1) { // Only consider meaningful similarities
        // Use similarity as weight for position influence
        totalX += similarity * Math.random() * 400; // Random position for now
        totalY += similarity * Math.random() * 300;
        totalZ += similarity * Math.random() * 200;
        weightSum += similarity;
      }
    }

    return weightSum > 0
      ? { x: totalX / weightSum, y: totalY / weightSum, z: totalZ / weightSum }
      : { x: Math.random() * 400, y: Math.random() * 300, z: 0 };
  }

  private calculateDistance(posA: Position3D, posB: Position3D): number {
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private applyBoundaryConstraints(
    positions: Position3D[],
    bounds?: BoundingBox
  ): Position3D[] {
    if (!bounds) return positions;

    return positions.map(pos => ({
      x: Math.max(bounds.minX, Math.min(bounds.maxX, pos.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, pos.y)),
      z: Math.max(bounds.minZ || 0, Math.min(bounds.maxZ || 0, pos.z))
    }));
  }
}