/**
 * RaycastingSystem - Efficient ray-based node selection for both 2D and 3D spatial indices.
 *
 * Provides ray-box/ray-sphere intersection algorithms with optimized traversal
 * of QuadTree and OctTree structures for precise node selection.
 *
 * @example
 * ```typescript
 * const raycasting = new RaycastingSystem(config);
 *
 * // 2D ray from mouse position
 * const ray2D = { origin: { x: 100, y: 200 }, direction: { x: 1, y: 0 } };
 * const intersections2D = raycasting.raycast2D(ray2D, quadTree);
 *
 * // 3D ray for camera-based selection
 * const ray3D = { origin: { x: 0, y: 0, z: 10 }, direction: { x: 0, y: 0, z: -1 } };
 * const intersections3D = raycasting.raycast3D(ray3D, octTree);
 * ```
 */

import type { PositionedNode } from '../layout/LayoutEngine';
import type {
  Point2D,
  Point3D,
  Vector2D,
  Vector3D,
  Ray,
  Ray2D,
  Ray3D,
  Rectangle,
  Box,
  RayIntersection,
  SpatialIndexConfig,
} from './types';
import {
  isRay3D,
  normalize2D,
  normalize3D,
  distance2D,
  distance3D,
} from './types';
import type { QuadTree } from './QuadTree';
import type { OctTree } from './OctTree';

/**
 * Ray-rectangle intersection result for 2D raycasting.
 */
interface RayRectangleIntersection {
  intersects: boolean;
  distance: number;
  point: Point2D;
}

/**
 * Ray-box intersection result for 3D raycasting.
 */
interface RayBoxIntersection {
  intersects: boolean;
  distance: number;
  point: Point3D;
}

/**
 * Ray-node intersection with extended information.
 */
interface NodeIntersectionResult extends RayIntersection {
  boundingBoxDistance: number;
  isDirectHit: boolean;
}

/**
 * RaycastingSystem handles ray-based spatial queries for both 2D and 3D indices.
 */
export class RaycastingSystem {
  private config: SpatialIndexConfig;

  constructor(config: SpatialIndexConfig) {
    this.config = config;
  }

  /**
   * Perform 2D raycasting against a QuadTree.
   */
  raycast2D(ray: Ray, quadTree: QuadTree): RayIntersection[] {
    if (isRay3D(ray)) {
      // Convert 3D ray to 2D by projecting onto XY plane
      const ray2D: Ray2D = {
        origin: { x: ray.origin.x, y: ray.origin.y },
        direction: normalize2D({ x: ray.direction.x, y: ray.direction.y }),
      };
      return this.performRaycast2D(ray2D, quadTree);
    } else {
      // Normalize 2D ray direction for consistent behavior
      const normalizedRay: Ray2D = {
        origin: ray.origin,
        direction: normalize2D(ray.direction),
      };
      return this.performRaycast2D(normalizedRay, quadTree);
    }
  }

  /**
   * Perform 3D raycasting against an OctTree.
   */
  raycast3D(ray: Ray, octTree: OctTree): RayIntersection[] {
    if (!isRay3D(ray)) {
      // Convert 2D ray to 3D (extend along Z-axis)
      // Determine appropriate Z coordinate from octTree bounds or use 0 as default
      const root = octTree.getRoot();
      const zCoordinate = root?.bounds ? (root.bounds.z + root.bounds.depth / 2) : 0;

      const ray3D: Ray3D = {
        origin: { x: ray.origin.x, y: ray.origin.y, z: zCoordinate },
        direction: normalize3D({ x: ray.direction.x, y: ray.direction.y, z: 0 }),
      };
      return this.performRaycast3D(ray3D, octTree);
    } else {
      // Normalize 3D ray direction for consistent behavior
      const normalizedRay: Ray3D = {
        origin: ray.origin,
        direction: normalize3D(ray.direction),
      };
      return this.performRaycast3D(normalizedRay, octTree);
    }
  }

  /**
   * Update configuration.
   */
  setConfig(config: SpatialIndexConfig): void {
    this.config = config;
  }

  /**
   * Get current configuration.
   */
  getConfig(): SpatialIndexConfig {
    return { ...this.config };
  }

  /**
   * Perform 2D raycasting implementation.
   */
  private performRaycast2D(ray: Ray2D, quadTree: QuadTree): RayIntersection[] {
    const results: NodeIntersectionResult[] = [];
    const root = quadTree.getRoot();

    if (!root) {
      return [];
    }

    // Traverse quadtree and test intersections
    this.traverseQuadTree(ray, root, results);

    // Sort by distance and convert to final format
    results.sort((a, b) => a.distance - b.distance);

    return results.map(result => ({
      node: result.node,
      distance: result.distance,
      point: result.point,
    }));
  }

  /**
   * Perform 3D raycasting implementation.
   */
  private performRaycast3D(ray: Ray3D, octTree: OctTree): RayIntersection[] {
    const results: NodeIntersectionResult[] = [];
    const root = octTree.getRoot();

    if (!root) {
      return [];
    }

    // Traverse octree and test intersections
    this.traverseOctTree(ray, root, results);

    // Sort by distance and convert to final format
    results.sort((a, b) => a.distance - b.distance);

    return results.map(result => ({
      node: result.node,
      distance: result.distance,
      point: result.point,
    }));
  }

  /**
   * Recursively traverse QuadTree and test ray intersections.
   */
  private traverseQuadTree(ray: Ray2D, node: any, results: NodeIntersectionResult[]): void {
    // Test ray-rectangle intersection for current node bounds
    const boundsIntersection = this.rayRectangleIntersection(ray, node.bounds);

    if (!boundsIntersection.intersects) {
      return;
    }

    // Test intersection with nodes in current node
    for (const positionedNode of node.nodes) {
      const intersection = this.rayNodeIntersection2D(ray, positionedNode);
      if (intersection) {
        results.push(intersection);
      }
    }

    // Recursively traverse children
    if (node.children) {
      for (const child of node.children) {
        this.traverseQuadTree(ray, child, results);
      }
    }
  }

  /**
   * Recursively traverse OctTree and test ray intersections.
   */
  private traverseOctTree(ray: Ray3D, node: any, results: NodeIntersectionResult[]): void {
    // Test ray-box intersection for current node bounds
    const boundsIntersection = this.rayBoxIntersection(ray, node.bounds);

    if (!boundsIntersection.intersects) {
      return;
    }

    // Test intersection with nodes in current node
    for (const positionedNode of node.nodes) {
      const intersection = this.rayNodeIntersection3D(ray, positionedNode);
      if (intersection) {
        results.push(intersection);
      }
    }

    // Recursively traverse children
    if (node.children) {
      for (const child of node.children) {
        this.traverseOctTree(ray, child, results);
      }
    }
  }

  /**
   * Test ray-rectangle intersection.
   */
  private rayRectangleIntersection(ray: Ray2D, rect: Rectangle): RayRectangleIntersection {
    // Implementation using parametric line intersection
    const { origin, direction } = ray;

    // Calculate t values for intersection with rectangle edges
    const t1 = (rect.x - origin.x) / direction.x;
    const t2 = (rect.x + rect.width - origin.x) / direction.x;
    const t3 = (rect.y - origin.y) / direction.y;
    const t4 = (rect.y + rect.height - origin.y) / direction.y;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4));

    // No intersection if tmax < 0 or tmin > tmax
    if (tmax < 0 || tmin > tmax) {
      return {
        intersects: false,
        distance: Infinity,
        point: { x: 0, y: 0 },
      };
    }

    // Use the closest intersection point
    const t = tmin >= 0 ? tmin : tmax;
    const point: Point2D = {
      x: origin.x + t * direction.x,
      y: origin.y + t * direction.y,
    };

    return {
      intersects: true,
      distance: t,
      point,
    };
  }

  /**
   * Test ray-box intersection.
   */
  private rayBoxIntersection(ray: Ray3D, box: Box): RayBoxIntersection {
    // Implementation using slab method
    const { origin, direction } = ray;

    // Calculate t values for intersection with box faces
    const t1 = (box.x - origin.x) / direction.x;
    const t2 = (box.x + box.width - origin.x) / direction.x;
    const t3 = (box.y - origin.y) / direction.y;
    const t4 = (box.y + box.height - origin.y) / direction.y;
    const t5 = (box.z - origin.z) / direction.z;
    const t6 = (box.z + box.depth - origin.z) / direction.z;

    const tmin = Math.max(
      Math.max(Math.min(t1, t2), Math.min(t3, t4)),
      Math.min(t5, t6)
    );
    const tmax = Math.min(
      Math.min(Math.max(t1, t2), Math.max(t3, t4)),
      Math.max(t5, t6)
    );

    // No intersection if tmax < 0 or tmin > tmax
    if (tmax < 0 || tmin > tmax) {
      return {
        intersects: false,
        distance: Infinity,
        point: { x: 0, y: 0, z: 0 },
      };
    }

    // Use the closest intersection point
    const t = tmin >= 0 ? tmin : tmax;
    const point: Point3D = {
      x: origin.x + t * direction.x,
      y: origin.y + t * direction.y,
      z: origin.z + t * direction.z,
    };

    return {
      intersects: true,
      distance: t,
      point,
    };
  }

  /**
   * Test ray intersection with a positioned node in 2D.
   */
  private rayNodeIntersection2D(ray: Ray2D, node: PositionedNode): NodeIntersectionResult | null {
    const nodePoint: Point2D = { x: node.x, y: node.y };

    // Calculate distance from node to ray
    const distanceToRay = this.pointToRayDistance2D(nodePoint, ray);

    if (distanceToRay > this.config.rayIntersectionTolerance) {
      return null;
    }

    // Calculate distance along ray to closest point to node
    const rayToNode: Vector2D = { x: nodePoint.x - ray.origin.x, y: nodePoint.y - ray.origin.y };
    const projectionLength = rayToNode.x * ray.direction.x + rayToNode.y * ray.direction.y;

    // Skip if node is behind ray origin
    if (projectionLength < 0) {
      return null;
    }

    // Calculate intersection point on ray
    const intersectionPoint: Point2D = {
      x: ray.origin.x + projectionLength * ray.direction.x,
      y: ray.origin.y + projectionLength * ray.direction.y,
    };

    const distance = distance2D(ray.origin, intersectionPoint);
    const isDirectHit = distanceToRay < this.config.pointQueryTolerance;

    return {
      node,
      distance,
      point: intersectionPoint,
      boundingBoxDistance: distanceToRay,
      isDirectHit,
    };
  }

  /**
   * Test ray intersection with a positioned node in 3D.
   */
  private rayNodeIntersection3D(ray: Ray3D, node: PositionedNode): NodeIntersectionResult | null {
    const nodePoint: Point3D = { x: node.x, y: node.y, z: node.z || 0 };

    // Calculate distance from node to ray
    const distanceToRay = this.pointToRayDistance3D(nodePoint, ray);

    if (distanceToRay > this.config.rayIntersectionTolerance) {
      return null;
    }

    // Calculate distance along ray to closest point to node
    const rayToNode: Vector3D = {
      x: nodePoint.x - ray.origin.x,
      y: nodePoint.y - ray.origin.y,
      z: nodePoint.z - ray.origin.z
    };
    const projectionLength = rayToNode.x * ray.direction.x +
                            rayToNode.y * ray.direction.y +
                            rayToNode.z * ray.direction.z;

    // Skip if node is behind ray origin
    if (projectionLength < 0) {
      return null;
    }

    // Calculate intersection point on ray
    const intersectionPoint: Point3D = {
      x: ray.origin.x + projectionLength * ray.direction.x,
      y: ray.origin.y + projectionLength * ray.direction.y,
      z: ray.origin.z + projectionLength * ray.direction.z,
    };

    const distance = distance3D(ray.origin, intersectionPoint);
    const isDirectHit = distanceToRay < this.config.pointQueryTolerance;

    return {
      node,
      distance,
      point: intersectionPoint,
      boundingBoxDistance: distanceToRay,
      isDirectHit,
    };
  }

  /**
   * Calculate distance from a point to a 2D ray.
   */
  private pointToRayDistance2D(point: Point2D, ray: Ray2D): number {
    const rayToPoint: Vector2D = { x: point.x - ray.origin.x, y: point.y - ray.origin.y };

    // Project point onto ray direction
    const projectionLength = rayToPoint.x * ray.direction.x + rayToPoint.y * ray.direction.y;

    // Find closest point on ray
    const closestPoint: Point2D = {
      x: ray.origin.x + projectionLength * ray.direction.x,
      y: ray.origin.y + projectionLength * ray.direction.y,
    };

    return distance2D(point, closestPoint);
  }

  /**
   * Calculate distance from a point to a 3D ray.
   */
  private pointToRayDistance3D(point: Point3D, ray: Ray3D): number {
    const rayToPoint: Vector3D = {
      x: point.x - ray.origin.x,
      y: point.y - ray.origin.y,
      z: point.z - ray.origin.z
    };

    // Project point onto ray direction
    const projectionLength = rayToPoint.x * ray.direction.x +
                            rayToPoint.y * ray.direction.y +
                            rayToPoint.z * ray.direction.z;

    // Find closest point on ray
    const closestPoint: Point3D = {
      x: ray.origin.x + projectionLength * ray.direction.x,
      y: ray.origin.y + projectionLength * ray.direction.y,
      z: ray.origin.z + projectionLength * ray.direction.z,
    };

    return distance3D(point, closestPoint);
  }
}

/**
 * Utility functions for raycasting operations.
 */
export const RaycastingUtils = {
  /**
   * Create a 2D ray from two points.
   */
  createRay2DFromPoints(start: Point2D, end: Point2D): Ray2D {
    const direction = normalize2D({
      x: end.x - start.x,
      y: end.y - start.y,
    });

    return {
      origin: start,
      direction,
    };
  },

  /**
   * Create a 3D ray from two points.
   */
  createRay3DFromPoints(start: Point3D, end: Point3D): Ray3D {
    const direction = normalize3D({
      x: end.x - start.x,
      y: end.y - start.y,
      z: end.z - start.z,
    });

    return {
      origin: start,
      direction,
    };
  },

  /**
   * Create a ray from mouse coordinates (for 2D canvas interaction).
   */
  createRayFromMouse(mouseX: number, mouseY: number, canvasWidth: number, canvasHeight: number): Ray2D {
    // Convert mouse coordinates to normalized direction
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const direction = normalize2D({
      x: mouseX - centerX,
      y: mouseY - centerY,
    });

    return {
      origin: { x: centerX, y: centerY },
      direction,
    };
  },

  /**
   * Create a ray for camera-based 3D selection.
   */
  createCameraRay(
    mouseX: number,
    mouseY: number,
    cameraPosition: Point3D,
    cameraTarget: Point3D,
    _fov: number,
    _aspectRatio: number
  ): Ray3D {
    // Simplified camera ray calculation
    // In a real implementation, you'd use proper camera matrices
    const direction = normalize3D({
      x: cameraTarget.x - cameraPosition.x,
      y: cameraTarget.y - cameraPosition.y,
      z: cameraTarget.z - cameraPosition.z,
    });

    // Adjust for mouse position (simplified)
    const adjustedDirection = normalize3D({
      x: direction.x + (mouseX - 0.5) * 0.1,
      y: direction.y + (mouseY - 0.5) * 0.1,
      z: direction.z,
    });

    return {
      origin: cameraPosition,
      direction: adjustedDirection,
    };
  },

  /**
   * Calculate ray length between two intersection points.
   */
  calculateRayLength(intersection1: RayIntersection, intersection2: RayIntersection): number {
    if ('z' in intersection1.point && 'z' in intersection2.point) {
      return distance3D(intersection1.point as Point3D, intersection2.point as Point3D);
    } else {
      return distance2D(intersection1.point as Point2D, intersection2.point as Point2D);
    }
  },

  /**
   * Filter intersections by distance range.
   */
  filterIntersectionsByDistance(
    intersections: RayIntersection[],
    minDistance: number,
    maxDistance: number
  ): RayIntersection[] {
    return intersections.filter(
      intersection => intersection.distance >= minDistance && intersection.distance <= maxDistance
    );
  },

  /**
   * Get the closest intersection from a list.
   */
  getClosestIntersection(intersections: RayIntersection[]): RayIntersection | null {
    if (intersections.length === 0) {
      return null;
    }

    return intersections.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest
    );
  },
};