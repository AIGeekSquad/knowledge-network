/**
 * OctTree implementation for efficient 3D spatial indexing.
 *
 * An OctTree recursively subdivides 3D space into eight octants,
 * enabling O(log n) spatial queries for node selection and region queries.
 *
 * @example
 * ```typescript
 * const octTree = new OctTree({ maxDepth: 8, maxNodesPerLeaf: 10 });
 * octTree.build(positionedNodes);
 *
 * // Query nodes in a box
 * const nodes = octTree.queryRegion({ x: 0, y: 0, z: 0, width: 100, height: 100, depth: 100 });
 *
 * // Query nodes near a point
 * const nearby = octTree.queryRegion({ center: { x: 50, y: 50, z: 50 }, radius: 25 });
 * ```
 */

import type { PositionedNode } from '../layout/LayoutEngine';
import type {
  Point3D,
  Box,
  Sphere,
  OctTreeNodeData,
  SpatialIndexConfig,
  SpatialIndexStats,
} from './types';

/**
 * OctTree node representing a spatial partition in 3D space.
 */
class OctTreeNode {
  bounds: Box;
  nodes: PositionedNode[];
  children: OctTreeNode[] | null;
  level: number;
  maxDepth: number;
  maxNodesPerLeaf: number;

  constructor(
    bounds: Box,
    level: number,
    maxDepth: number,
    maxNodesPerLeaf: number
  ) {
    this.bounds = bounds;
    this.nodes = [];
    this.children = null;
    this.level = level;
    this.maxDepth = maxDepth;
    this.maxNodesPerLeaf = maxNodesPerLeaf;
  }

  /**
   * Insert a node into the octree.
   */
  insert(node: PositionedNode): boolean {
    const z = node.z || 0; // Default z to 0 if undefined

    // Check if node is within bounds
    if (!this.containsPoint(node.x, node.y, z)) {
      return false;
    }

    // If we have space and aren't subdivided, add to this node
    if (this.nodes.length < this.maxNodesPerLeaf && this.children === null) {
      this.nodes.push(node);
      return true;
    }

    // Subdivide if not already done
    if (this.children === null) {
      if (this.level >= this.maxDepth) {
        // At max depth, just add to current node
        this.nodes.push(node);
        return true;
      }
      this.subdivide();
    }

    // Try to insert into children
    if (this.children) {
      for (const child of this.children) {
        if (child.insert(node)) {
          return true;
        }
      }
    }

    // If all else fails, add to current node
    this.nodes.push(node);
    return true;
  }

  /**
   * Subdivide this node into eight octants.
   */
  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const z = this.bounds.z;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;
    const d = this.bounds.depth / 2;
    const level = this.level + 1;

    this.children = [
      // Front face (z = z)
      // Top-left-front
      new OctTreeNode(
        { x, y, z, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Top-right-front
      new OctTreeNode(
        { x: x + w, y, z, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Bottom-left-front
      new OctTreeNode(
        { x, y: y + h, z, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Bottom-right-front
      new OctTreeNode(
        { x: x + w, y: y + h, z, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),

      // Back face (z = z + d)
      // Top-left-back
      new OctTreeNode(
        { x, y, z: z + d, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Top-right-back
      new OctTreeNode(
        { x: x + w, y, z: z + d, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Bottom-left-back
      new OctTreeNode(
        { x, y: y + h, z: z + d, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Bottom-right-back
      new OctTreeNode(
        { x: x + w, y: y + h, z: z + d, width: w, height: h, depth: d },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
    ];

    // Redistribute existing nodes to children
    const existingNodes = [...this.nodes];
    this.nodes = [];

    for (const node of existingNodes) {
      let inserted = false;
      for (const child of this.children) {
        if (child.insert(node)) {
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        this.nodes.push(node);
      }
    }
  }

  /**
   * Query nodes within a box region.
   */
  queryBox(box: Box): PositionedNode[] {
    const result: PositionedNode[] = [];

    // Check if query region intersects with this node's bounds
    if (!this.intersectsBox(box)) {
      return result;
    }

    // Add nodes in this node that are within the query region
    for (const node of this.nodes) {
      const z = node.z || 0;
      if (this.pointInBox(node.x, node.y, z, box)) {
        result.push(node);
      }
    }

    // Query children recursively
    if (this.children) {
      for (const child of this.children) {
        result.push(...child.queryBox(box));
      }
    }

    return result;
  }

  /**
   * Query nodes within a spherical region.
   */
  querySphere(sphere: Sphere): PositionedNode[] {
    const result: PositionedNode[] = [];

    // Check if sphere intersects with this node's bounds
    if (!this.intersectsSphere(sphere)) {
      return result;
    }

    // Add nodes in this node that are within the sphere
    for (const node of this.nodes) {
      const z = node.z || 0;
      if (this.pointInSphere(node.x, node.y, z, sphere)) {
        result.push(node);
      }
    }

    // Query children recursively
    if (this.children) {
      for (const child of this.children) {
        result.push(...child.querySphere(sphere));
      }
    }

    return result;
  }

  /**
   * Get all nodes in this subtree.
   */
  getAllNodes(): PositionedNode[] {
    const result = [...this.nodes];

    if (this.children) {
      for (const child of this.children) {
        result.push(...child.getAllNodes());
      }
    }

    return result;
  }

  /**
   * Check if this node contains a point.
   */
  public containsPoint(x: number, y: number, z: number): boolean {
    return (
      x >= this.bounds.x &&
      x <= this.bounds.x + this.bounds.width &&
      y >= this.bounds.y &&
      y <= this.bounds.y + this.bounds.height &&
      z >= this.bounds.z &&
      z <= this.bounds.z + this.bounds.depth
    );
  }

  /**
   * Check if a box intersects with this node's bounds.
   */
  private intersectsBox(box: Box): boolean {
    return !(
      box.x > this.bounds.x + this.bounds.width ||
      box.x + box.width < this.bounds.x ||
      box.y > this.bounds.y + this.bounds.height ||
      box.y + box.height < this.bounds.y ||
      box.z > this.bounds.z + this.bounds.depth ||
      box.z + box.depth < this.bounds.z
    );
  }

  /**
   * Check if a sphere intersects with this node's bounds.
   */
  private intersectsSphere(sphere: Sphere): boolean {
    // Find the closest point on the box to the sphere center
    const closestX = Math.max(
      this.bounds.x,
      Math.min(sphere.center.x, this.bounds.x + this.bounds.width)
    );
    const closestY = Math.max(
      this.bounds.y,
      Math.min(sphere.center.y, this.bounds.y + this.bounds.height)
    );
    const closestZ = Math.max(
      this.bounds.z,
      Math.min(sphere.center.z, this.bounds.z + this.bounds.depth)
    );

    // Calculate distance from sphere center to closest point
    const dx = sphere.center.x - closestX;
    const dy = sphere.center.y - closestY;
    const dz = sphere.center.z - closestZ;
    const distanceSquared = dx * dx + dy * dy + dz * dz;

    return distanceSquared <= sphere.radius * sphere.radius;
  }

  /**
   * Check if a point is within a box.
   */
  private pointInBox(x: number, y: number, z: number, box: Box): boolean {
    return (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height &&
      z >= box.z &&
      z <= box.z + box.depth
    );
  }

  /**
   * Check if a point is within a sphere.
   */
  private pointInSphere(x: number, y: number, z: number, sphere: Sphere): boolean {
    const dx = x - sphere.center.x;
    const dy = y - sphere.center.y;
    const dz = z - sphere.center.z;
    return dx * dx + dy * dy + dz * dz <= sphere.radius * sphere.radius;
  }

  /**
   * Get statistics for this subtree.
   */
  getStats(): { nodeCount: number; maxDepth: number; totalDepth: number; leafCount: number } {
    let nodeCount = this.nodes.length;
    let maxDepth = this.level;
    let totalDepth = this.level;
    let leafCount = this.children === null ? 1 : 0;

    if (this.children) {
      for (const child of this.children) {
        const childStats = child.getStats();
        nodeCount += childStats.nodeCount;
        maxDepth = Math.max(maxDepth, childStats.maxDepth);
        totalDepth += childStats.totalDepth;
        leafCount += childStats.leafCount;
      }
    }

    return { nodeCount, maxDepth, totalDepth, leafCount };
  }

  /**
   * Convert to serializable data structure.
   */
  toData(): OctTreeNodeData {
    return {
      bounds: this.bounds,
      nodes: [...this.nodes],
      children: this.children?.map(child => child.toData()) || null,
      level: this.level,
    };
  }
}

/**
 * OctTree spatial index for 3D positioned nodes.
 */
export class OctTree {
  private config: SpatialIndexConfig;
  private root: OctTreeNode | null = null;
  private bounds: Box = { x: 0, y: 0, z: 0, width: 0, height: 0, depth: 0 };
  private buildTime = 0;

  constructor(config: SpatialIndexConfig) {
    this.config = config;
  }

  /**
   * Build the octree from positioned nodes.
   */
  build(nodes: PositionedNode[]): void {
    const startTime = performance.now();

    if (nodes.length === 0) {
      this.root = null;
      this.buildTime = 0;
      return;
    }

    // Calculate bounding box
    this.bounds = this.calculateBounds(nodes);

    // Create root node
    this.root = new OctTreeNode(
      this.bounds,
      0,
      this.config.maxDepth,
      this.config.maxNodesPerLeaf
    );

    // Insert all nodes
    for (const node of nodes) {
      this.root.insert(node);
    }

    this.buildTime = performance.now() - startTime;
  }

  /**
   * Query nodes within a region (box or sphere).
   */
  queryRegion(region: Box | Sphere): PositionedNode[] {
    if (!this.root) {
      return [];
    }

    if ('radius' in region) {
      return this.root.querySphere(region);
    } else {
      return this.root.queryBox(region);
    }
  }

  /**
   * Query nodes near a point within a radius.
   */
  queryPoint(point: Point3D, radius: number): PositionedNode[] {
    const sphere: Sphere = { center: point, radius };
    return this.queryRegion(sphere);
  }

  /**
   * Get all nodes in the octree.
   */
  getAllNodes(): PositionedNode[] {
    if (!this.root) {
      return [];
    }
    return this.root.getAllNodes();
  }

  /**
   * Clear the octree.
   */
  clear(): void {
    this.root = null;
    this.bounds = { x: 0, y: 0, z: 0, width: 0, height: 0, depth: 0 };
    this.buildTime = 0;
  }

  /**
   * Get octree statistics.
   */
  getStatistics(): SpatialIndexStats {
    if (!this.root) {
      return {
        nodeCount: 0,
        maxDepth: 0,
        averageDepth: 0,
        memoryUsage: 0,
        buildTime: this.buildTime,
        lastBuildTime: Date.now(),
      };
    }

    const stats = this.root.getStats();
    const averageDepth = stats.leafCount > 0 ? stats.totalDepth / stats.leafCount : 0;

    // Rough memory estimation (very approximate)
    const memoryUsage = stats.nodeCount * 300 + stats.leafCount * 150; // bytes (higher than QuadTree due to 3D)

    return {
      nodeCount: stats.nodeCount,
      maxDepth: stats.maxDepth,
      averageDepth,
      memoryUsage,
      buildTime: this.buildTime,
      lastBuildTime: Date.now(),
    };
  }

  /**
   * Get the root node (for advanced usage or debugging).
   */
  getRoot(): OctTreeNode | null {
    return this.root;
  }

  /**
   * Get the tree bounds.
   */
  getBounds(): Box {
    return { ...this.bounds };
  }

  /**
   * Convert to serializable data structure.
   */
  toData(): OctTreeNodeData | null {
    return this.root?.toData() || null;
  }

  /**
   * Calculate bounding box for nodes.
   */
  private calculateBounds(nodes: PositionedNode[]): Box {
    if (nodes.length === 0) {
      return { x: 0, y: 0, z: 0, width: 100, height: 100, depth: 100 };
    }

    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const zs = nodes.map(n => n.z || 0);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const minZ = Math.min(...zs);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const maxZ = Math.max(...zs);

    // Add some padding to avoid edge cases
    const padding = Math.max((maxX - minX), (maxY - minY), (maxZ - minZ)) * 0.1 + 10;

    return {
      x: minX - padding,
      y: minY - padding,
      z: minZ - padding,
      width: (maxX - minX) + 2 * padding,
      height: (maxY - minY) + 2 * padding,
      depth: (maxZ - minZ) + 2 * padding,
    };
  }

  /**
   * Check if the octree is empty.
   */
  isEmpty(): boolean {
    return this.root === null;
  }

  /**
   * Get the configuration.
   */
  getConfig(): SpatialIndexConfig {
    return { ...this.config };
  }

  /**
   * Update configuration and rebuild if needed.
   */
  setConfig(config: SpatialIndexConfig): void {
    this.config = config;
    // Note: This will require a rebuild to take effect
  }

  /**
   * Find nodes at a specific point (with tolerance).
   */
  queryExactPoint(point: Point3D, tolerance = 1): PositionedNode[] {
    return this.queryPoint(point, tolerance);
  }

  /**
   * Get nodes in the leaf containing a specific point.
   */
  getLeafNodes(point: Point3D): PositionedNode[] {
    if (!this.root) {
      return [];
    }

    let current = this.root;

    while (current.children) {
      let found = false;
      for (const child of current.children) {
        if (child.containsPoint && child.containsPoint(point.x, point.y, point.z)) {
          current = child;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    return current.nodes;
  }

  /**
   * Query nodes within a cylindrical region (useful for 2D-like queries in 3D space).
   */
  queryCylinder(center: Point3D, radius: number, minZ?: number, maxZ?: number): PositionedNode[] {
    const actualMinZ = minZ !== undefined ? minZ : this.bounds.z;
    const actualMaxZ = maxZ !== undefined ? maxZ : this.bounds.z + this.bounds.depth;

    const box: Box = {
      x: center.x - radius,
      y: center.y - radius,
      z: actualMinZ,
      width: radius * 2,
      height: radius * 2,
      depth: actualMaxZ - actualMinZ,
    };

    const candidateNodes = this.queryRegion(box);
    const result: PositionedNode[] = [];

    // Filter by cylindrical distance
    for (const node of candidateNodes) {
      const dx = node.x - center.x;
      const dy = node.y - center.y;
      const distance2D = Math.sqrt(dx * dx + dy * dy);

      if (distance2D <= radius) {
        result.push(node);
      }
    }

    return result;
  }
}

/**
 * Utility functions for octree operations.
 */
export const OctTreeUtils = {
  /**
   * Create a box from center point and size.
   */
  createBoxFromCenter(center: Point3D, width: number, height: number, depth: number): Box {
    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      z: center.z - depth / 2,
      width,
      height,
      depth,
    };
  },

  /**
   * Create a sphere from center and radius.
   */
  createSphere(center: Point3D, radius: number): Sphere {
    return { center, radius };
  },

  /**
   * Check if two boxes intersect.
   */
  boxesIntersect(a: Box, b: Box): boolean {
    return !(
      a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y ||
      a.z > b.z + b.depth ||
      a.z + a.depth < b.z
    );
  },

  /**
   * Calculate box volume.
   */
  boxVolume(box: Box): number {
    return box.width * box.height * box.depth;
  },

  /**
   * Calculate sphere volume.
   */
  sphereVolume(sphere: Sphere): number {
    return (4 / 3) * Math.PI * Math.pow(sphere.radius, 3);
  },

  /**
   * Convert a 2D rectangle to a 3D box with infinite depth.
   */
  rectangleToBox(rect: { x: number; y: number; width: number; height: number }): Box {
    return {
      x: rect.x,
      y: rect.y,
      z: -Infinity,
      width: rect.width,
      height: rect.height,
      depth: Infinity,
    };
  },
};