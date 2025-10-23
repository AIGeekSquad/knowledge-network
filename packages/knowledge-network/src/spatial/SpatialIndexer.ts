/**
 * SpatialIndexer - Main interface for spatial indexing in the Knowledge Network.
 *
 * Provides efficient spatial queries for node selection after layout completion.
 * Supports both 2D (QuadTree) and 3D (OctTree) spatial indexing with O(log n) performance.
 *
 * @example
 * ```typescript
 * const indexer = new SpatialIndexer({ maxDepth: 8, maxNodesPerLeaf: 10 });
 *
 * // Build spatial index after layout completes
 * indexer.build(layoutResult.nodes);
 *
 * // Query nodes near a point
 * const nearby = indexer.queryPoint({ x: 100, y: 200 }, 50);
 *
 * // Ray-based node selection
 * const ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };
 * const intersected = indexer.queryRay(ray);
 * ```
 */

import type { PositionedNode } from '../layout/LayoutEngine';
import type {
  Point,
  Point2D,
  Point3D,
  Rectangle,
  Circle,
  Box,
  Sphere,
  Ray,
  RayIntersection,
  SpatialIndexStats,
  SpatialIndexConfig,
} from './types';
import { DEFAULT_SPATIAL_CONFIG } from './types';
import { QuadTree } from './QuadTree';
import { OctTree } from './OctTree';
import { RaycastingSystem } from './RaycastingSystem';

export interface ISpatialIndexer {
  // Core operations
  build(nodes: PositionedNode[]): void;
  queryPoint(point: Point, radius?: number): PositionedNode[];
  queryRegion(bounds: Rectangle | Box): PositionedNode[];
  queryRay(ray: Ray): RayIntersection[];

  // Management
  clear(): void;
  rebuild(nodes: PositionedNode[]): void;
  getStatistics(): SpatialIndexStats;

  // Configuration
  setConfig(config: Partial<SpatialIndexConfig>): void;
  getConfig(): SpatialIndexConfig;
}

/**
 * Main spatial indexing implementation that automatically chooses between
 * 2D (QuadTree) and 3D (OctTree) based on node data.
 */
export class SpatialIndexer implements ISpatialIndexer {
  private config: SpatialIndexConfig;
  private quadTree: QuadTree | null = null;
  private octTree: OctTree | null = null;
  private raycastingSystem: RaycastingSystem;
  private is3D = false;
  private nodes: PositionedNode[] = [];
  private buildStartTime = 0;

  constructor(config?: Partial<SpatialIndexConfig>) {
    this.config = { ...DEFAULT_SPATIAL_CONFIG, ...config };
    this.raycastingSystem = new RaycastingSystem(this.config);
  }

  /**
   * Build spatial index from positioned nodes.
   * Automatically detects 2D vs 3D based on node coordinates.
   */
  build(nodes: PositionedNode[]): void {
    this.buildStartTime = performance.now();

    // Clear existing indices
    this.clear();

    if (nodes.length === 0) {
      return;
    }

    // Store nodes after clearing
    this.nodes = [...nodes];

    // Detect 2D vs 3D based on node data
    this.is3D = this.detect3D(nodes);

    if (this.is3D) {
      this.octTree = new OctTree(this.config);
      this.octTree.build(nodes);
    } else {
      this.quadTree = new QuadTree(this.config);
      this.quadTree.build(nodes);
    }
  }

  /**
   * Query nodes near a point within a radius.
   */
  queryPoint(point: Point, radius = 0): PositionedNode[] {
    if (this.is3D && this.octTree) {
      if ('z' in point) {
        const sphere: Sphere = { center: point as Point3D, radius };
        return this.octTree.queryRegion(sphere);
      } else {
        // Convert 2D point to 3D for 3D tree
        const point3D: Point3D = { x: point.x, y: point.y, z: 0 };
        const sphere: Sphere = { center: point3D, radius };
        return this.octTree.queryRegion(sphere);
      }
    } else if (!this.is3D && this.quadTree) {
      const circle: Circle = { center: point as Point2D, radius };
      return this.quadTree.queryRegion(circle);
    }

    return [];
  }

  /**
   * Query nodes within a rectangular or box region.
   */
  queryRegion(bounds: Rectangle | Box): PositionedNode[] {
    if (this.is3D && this.octTree) {
      // Convert Rectangle to Box if needed
      if (!('z' in bounds)) {
        const box: Box = {
          x: bounds.x,
          y: bounds.y,
          z: -Infinity,
          width: bounds.width,
          height: bounds.height,
          depth: Infinity,
        };
        return this.octTree.queryRegion(box);
      } else {
        return this.octTree.queryRegion(bounds as Box);
      }
    } else if (!this.is3D && this.quadTree) {
      // Use 2D bounds for QuadTree
      if ('z' in bounds) {
        const rect: Rectangle = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        };
        return this.quadTree.queryRegion(rect);
      } else {
        return this.quadTree.queryRegion(bounds as Rectangle);
      }
    }

    return [];
  }

  /**
   * Query nodes intersected by a ray.
   * Returns nodes sorted by distance from ray origin.
   */
  queryRay(ray: Ray): RayIntersection[] {
    if (this.is3D && this.octTree) {
      return this.raycastingSystem.raycast3D(ray, this.octTree);
    } else if (!this.is3D && this.quadTree) {
      return this.raycastingSystem.raycast2D(ray, this.quadTree);
    }

    return [];
  }

  /**
   * Clear all spatial indices.
   */
  clear(): void {
    if (this.quadTree) {
      this.quadTree.clear();
      this.quadTree = null;
    }
    if (this.octTree) {
      this.octTree.clear();
      this.octTree = null;
    }
    this.nodes = [];
  }

  /**
   * Rebuild spatial index with new nodes.
   */
  rebuild(nodes: PositionedNode[]): void {
    this.build(nodes);
  }

  /**
   * Get statistics about the spatial index.
   */
  getStatistics(): SpatialIndexStats {
    const currentTime = Date.now();
    const buildTime = this.buildStartTime ? performance.now() - this.buildStartTime : 0;

    const baseStats: SpatialIndexStats = {
      nodeCount: this.nodes.length,
      maxDepth: 0,
      averageDepth: 0,
      memoryUsage: 0,
      buildTime,
      lastBuildTime: currentTime,
    };

    if (this.is3D && this.octTree) {
      return {
        ...baseStats,
        ...this.octTree.getStatistics(),
      };
    } else if (!this.is3D && this.quadTree) {
      return {
        ...baseStats,
        ...this.quadTree.getStatistics(),
      };
    }

    return baseStats;
  }

  /**
   * Update configuration.
   */
  setConfig(config: Partial<SpatialIndexConfig>): void {
    this.config = { ...this.config, ...config };
    this.raycastingSystem.setConfig(this.config);

    // Rebuild if we have nodes
    if (this.nodes.length > 0) {
      this.rebuild(this.nodes);
    }
  }

  /**
   * Get current configuration.
   */
  getConfig(): SpatialIndexConfig {
    return { ...this.config };
  }

  /**
   * Get the underlying spatial data structure.
   * Useful for advanced queries or debugging.
   */
  getIndex(): QuadTree | OctTree | null {
    return this.is3D ? this.octTree : this.quadTree;
  }

  /**
   * Check if the current index is 3D.
   */
  is3DIndex(): boolean {
    return this.is3D;
  }

  /**
   * Get all indexed nodes.
   */
  getNodes(): PositionedNode[] {
    return [...this.nodes];
  }

  /**
   * Find the nearest node to a point.
   */
  findNearest(point: Point, maxDistance = Infinity): PositionedNode | null {
    let nearest: PositionedNode | null = null;
    let minDistance = maxDistance;

    // Start with a small radius and expand if needed
    let radius = 50;
    let candidates: PositionedNode[] = [];

    while (candidates.length === 0 && radius <= maxDistance) {
      candidates = this.queryPoint(point, radius);
      radius *= 2;
    }

    for (const node of candidates) {
      const nodePoint = this.is3D
        ? { x: node.x, y: node.y, z: node.z || 0 }
        : { x: node.x, y: node.y };

      const distance = this.calculateDistance(point, nodePoint);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = node;
      }
    }

    return nearest;
  }

  /**
   * Get nodes within a distance threshold, sorted by distance.
   */
  getNodesWithinDistance(point: Point, maxDistance: number): Array<{ node: PositionedNode; distance: number }> {
    const candidates = this.queryPoint(point, maxDistance);
    const results: Array<{ node: PositionedNode; distance: number }> = [];

    for (const node of candidates) {
      const nodePoint = this.is3D
        ? { x: node.x, y: node.y, z: node.z || 0 }
        : { x: node.x, y: node.y };

      const distance = this.calculateDistance(point, nodePoint);

      if (distance <= maxDistance) {
        results.push({ node, distance });
      }
    }

    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Detect if nodes have 3D coordinates.
   */
  private detect3D(nodes: PositionedNode[]): boolean {
    // Consider it 3D if any node has a valid z coordinate
    return nodes.some(node =>
      typeof node.z === 'number' &&
      !isNaN(node.z) &&
      node.z !== 0
    );
  }

  /**
   * Calculate distance between two points (2D or 3D).
   */
  private calculateDistance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    if ('z' in a && 'z' in b) {
      const dz = a.z - b.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    } else {
      return Math.sqrt(dx * dx + dy * dy);
    }
  }
}

/**
 * Factory function for creating spatial indexers with preset configurations.
 */
export class SpatialIndexerFactory {
  /**
   * Create a fast spatial indexer optimized for performance.
   */
  static createFast(): SpatialIndexer {
    return new SpatialIndexer({
      maxDepth: 6,
      maxNodesPerLeaf: 20,
      enableCaching: true,
      cacheSize: 50,
    });
  }

  /**
   * Create a precise spatial indexer optimized for accuracy.
   */
  static createPrecise(): SpatialIndexer {
    return new SpatialIndexer({
      maxDepth: 12,
      maxNodesPerLeaf: 5,
      enableCaching: true,
      cacheSize: 200,
      rayIntersectionTolerance: 0.5,
      pointQueryTolerance: 0.05,
    });
  }

  /**
   * Create a balanced spatial indexer for general use.
   */
  static createBalanced(): SpatialIndexer {
    return new SpatialIndexer(); // Uses default config
  }

  /**
   * Create a memory-efficient spatial indexer.
   */
  static createMemoryEfficient(): SpatialIndexer {
    return new SpatialIndexer({
      maxDepth: 8,
      maxNodesPerLeaf: 15,
      enableCaching: false,
      cacheSize: 0,
    });
  }
}