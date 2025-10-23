/**
 * QuadTree implementation for efficient 2D spatial indexing.
 *
 * A QuadTree recursively subdivides 2D space into four quadrants,
 * enabling O(log n) spatial queries for node selection and region queries.
 *
 * @example
 * ```typescript
 * const quadTree = new QuadTree({ maxDepth: 8, maxNodesPerLeaf: 10 });
 * quadTree.build(positionedNodes);
 *
 * // Query nodes in a rectangle
 * const nodes = quadTree.queryRegion({ x: 0, y: 0, width: 100, height: 100 });
 *
 * // Query nodes near a point
 * const nearby = quadTree.queryRegion({ center: { x: 50, y: 50 }, radius: 25 });
 * ```
 */

import type { PositionedNode } from '../layout/LayoutEngine';
import type {
  Point2D,
  Rectangle,
  Circle,
  QuadTreeNodeData,
  SpatialIndexConfig,
  SpatialIndexStats,
} from './types';

/**
 * QuadTree node representing a spatial partition.
 */
class QuadTreeNode {
  bounds: Rectangle;
  nodes: PositionedNode[];
  children: QuadTreeNode[] | null;
  level: number;
  maxDepth: number;
  maxNodesPerLeaf: number;

  constructor(
    bounds: Rectangle,
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
   * Insert a node into the quadtree.
   */
  insert(node: PositionedNode): boolean {
    // Check if node is within bounds
    if (!this.containsPoint(node.x, node.y)) {
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
   * Subdivide this node into four quadrants.
   */
  private subdivide(): void {
    const x = this.bounds.x;
    const y = this.bounds.y;
    const w = this.bounds.width / 2;
    const h = this.bounds.height / 2;
    const level = this.level + 1;

    this.children = [
      // Top-left
      new QuadTreeNode(
        { x, y, width: w, height: h },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Top-right
      new QuadTreeNode(
        { x: x + w, y, width: w, height: h },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Bottom-left
      new QuadTreeNode(
        { x, y: y + h, width: w, height: h },
        level,
        this.maxDepth,
        this.maxNodesPerLeaf
      ),
      // Bottom-right
      new QuadTreeNode(
        { x: x + w, y: y + h, width: w, height: h },
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
   * Query nodes within a rectangular region.
   */
  queryRectangle(rect: Rectangle): PositionedNode[] {
    const result: PositionedNode[] = [];

    // Check if query region intersects with this node's bounds
    if (!this.intersectsRectangle(rect)) {
      return result;
    }

    // Add nodes in this node that are within the query region
    for (const node of this.nodes) {
      if (this.pointInRectangle(node.x, node.y, rect)) {
        result.push(node);
      }
    }

    // Query children recursively
    if (this.children) {
      for (const child of this.children) {
        result.push(...child.queryRectangle(rect));
      }
    }

    return result;
  }

  /**
   * Query nodes within a circular region.
   */
  queryCircle(circle: Circle): PositionedNode[] {
    const result: PositionedNode[] = [];

    // Check if circle intersects with this node's bounds
    if (!this.intersectsCircle(circle)) {
      return result;
    }

    // Add nodes in this node that are within the circle
    for (const node of this.nodes) {
      if (this.pointInCircle(node.x, node.y, circle)) {
        result.push(node);
      }
    }

    // Query children recursively
    if (this.children) {
      for (const child of this.children) {
        result.push(...child.queryCircle(circle));
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
  public containsPoint(x: number, y: number): boolean {
    return (
      x >= this.bounds.x &&
      x <= this.bounds.x + this.bounds.width &&
      y >= this.bounds.y &&
      y <= this.bounds.y + this.bounds.height
    );
  }

  /**
   * Check if a rectangle intersects with this node's bounds.
   */
  private intersectsRectangle(rect: Rectangle): boolean {
    return !(
      rect.x > this.bounds.x + this.bounds.width ||
      rect.x + rect.width < this.bounds.x ||
      rect.y > this.bounds.y + this.bounds.height ||
      rect.y + rect.height < this.bounds.y
    );
  }

  /**
   * Check if a circle intersects with this node's bounds.
   */
  private intersectsCircle(circle: Circle): boolean {
    // Find the closest point on the rectangle to the circle center
    const closestX = Math.max(
      this.bounds.x,
      Math.min(circle.center.x, this.bounds.x + this.bounds.width)
    );
    const closestY = Math.max(
      this.bounds.y,
      Math.min(circle.center.y, this.bounds.y + this.bounds.height)
    );

    // Calculate distance from circle center to closest point
    const dx = circle.center.x - closestX;
    const dy = circle.center.y - closestY;
    const distanceSquared = dx * dx + dy * dy;

    return distanceSquared <= circle.radius * circle.radius;
  }

  /**
   * Check if a point is within a rectangle.
   */
  private pointInRectangle(x: number, y: number, rect: Rectangle): boolean {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  /**
   * Check if a point is within a circle.
   */
  private pointInCircle(x: number, y: number, circle: Circle): boolean {
    const dx = x - circle.center.x;
    const dy = y - circle.center.y;
    return dx * dx + dy * dy <= circle.radius * circle.radius;
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
  toData(): QuadTreeNodeData {
    return {
      bounds: this.bounds,
      nodes: [...this.nodes],
      children: this.children?.map(child => child.toData()) || null,
      level: this.level,
    };
  }
}

/**
 * QuadTree spatial index for 2D positioned nodes.
 */
export class QuadTree {
  private config: SpatialIndexConfig;
  private root: QuadTreeNode | null = null;
  private bounds: Rectangle = { x: 0, y: 0, width: 0, height: 0 };
  private buildTime = 0;

  constructor(config: SpatialIndexConfig) {
    this.config = config;
  }

  /**
   * Build the quadtree from positioned nodes.
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
    this.root = new QuadTreeNode(
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
   * Query nodes within a region (rectangle or circle).
   */
  queryRegion(region: Rectangle | Circle): PositionedNode[] {
    if (!this.root) {
      return [];
    }

    if ('radius' in region) {
      return this.root.queryCircle(region);
    } else {
      return this.root.queryRectangle(region);
    }
  }

  /**
   * Query nodes near a point within a radius.
   */
  queryPoint(point: Point2D, radius: number): PositionedNode[] {
    const circle: Circle = { center: point, radius };
    return this.queryRegion(circle);
  }

  /**
   * Get all nodes in the quadtree.
   */
  getAllNodes(): PositionedNode[] {
    if (!this.root) {
      return [];
    }
    return this.root.getAllNodes();
  }

  /**
   * Clear the quadtree.
   */
  clear(): void {
    this.root = null;
    this.bounds = { x: 0, y: 0, width: 0, height: 0 };
    this.buildTime = 0;
  }

  /**
   * Get quadtree statistics.
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
    const memoryUsage = stats.nodeCount * 200 + stats.leafCount * 100; // bytes

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
  getRoot(): QuadTreeNode | null {
    return this.root;
  }

  /**
   * Get the tree bounds.
   */
  getBounds(): Rectangle {
    return { ...this.bounds };
  }

  /**
   * Convert to serializable data structure.
   */
  toData(): QuadTreeNodeData | null {
    return this.root?.toData() || null;
  }

  /**
   * Calculate bounding rectangle for nodes.
   */
  private calculateBounds(nodes: PositionedNode[]): Rectangle {
    if (nodes.length === 0) {
      return { x: 0, y: 0, width: 100, height: 100 };
    }

    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    // Add some padding to avoid edge cases
    const padding = Math.max((maxX - minX), (maxY - minY)) * 0.1 + 10;

    return {
      x: minX - padding,
      y: minY - padding,
      width: (maxX - minX) + 2 * padding,
      height: (maxY - minY) + 2 * padding,
    };
  }

  /**
   * Check if the quadtree is empty.
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
  queryExactPoint(point: Point2D, tolerance = 1): PositionedNode[] {
    return this.queryPoint(point, tolerance);
  }

  /**
   * Get nodes in the leaf containing a specific point.
   */
  getLeafNodes(point: Point2D): PositionedNode[] {
    if (!this.root) {
      return [];
    }

    let current = this.root;

    while (current.children) {
      let found = false;
      for (const child of current.children) {
        if (child.containsPoint && child.containsPoint(point.x, point.y)) {
          current = child;
          found = true;
          break;
        }
      }
      if (!found) break;
    }

    return current.nodes;
  }
}

/**
 * Utility functions for quadtree operations.
 */
export const QuadTreeUtils = {
  /**
   * Create a rectangle from center point and size.
   */
  createRectangleFromCenter(center: Point2D, width: number, height: number): Rectangle {
    return {
      x: center.x - width / 2,
      y: center.y - height / 2,
      width,
      height,
    };
  },

  /**
   * Create a circle from center and radius.
   */
  createCircle(center: Point2D, radius: number): Circle {
    return { center, radius };
  },

  /**
   * Check if two rectangles intersect.
   */
  rectanglesIntersect(a: Rectangle, b: Rectangle): boolean {
    return !(
      a.x > b.x + b.width ||
      a.x + a.width < b.x ||
      a.y > b.y + b.height ||
      a.y + a.height < b.y
    );
  },

  /**
   * Calculate rectangle area.
   */
  rectangleArea(rect: Rectangle): number {
    return rect.width * rect.height;
  },

  /**
   * Calculate circle area.
   */
  circleArea(circle: Circle): number {
    return Math.PI * circle.radius * circle.radius;
  },
};