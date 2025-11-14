/**
 * Spatial Indexing System for Knowledge Network
 *
 * Provides efficient spatial queries for node selection after layout completion.
 * Supports both 2D (QuadTree) and 3D (OctTree) spatial indexing with O(log n) performance.
 */

// Main API
export { SpatialIndexer, SpatialIndexerFactory } from './SpatialIndexer';
export type { ISpatialIndexer } from './SpatialIndexer';

// Core spatial data structures
export { QuadTree, QuadTreeUtils } from './QuadTree';
export { OctTree, OctTreeUtils } from './OctTree';

// Raycasting system
export { RaycastingSystem, RaycastingUtils } from './RaycastingSystem';

// Types and utilities
export type {
  // Core types
  Point,
  Point2D,
  Point3D,
  Vector,
  Vector2D,
  Vector3D,

  // Geometric primitives
  Rectangle,
  Circle,
  Box,
  Sphere,

  // Ray types
  Ray,
  Ray2D,
  Ray3D,

  // Results
  RayIntersection,
  SpatialQueryResult,
  SpatialIndexStats,

  // Configuration
  SpatialIndexConfig,

  // Tree data
  QuadTreeNodeData,
  OctTreeNodeData,
} from './types';

export {
  // Constants
  DEFAULT_SPATIAL_CONFIG,

  // Utility functions
  isPoint3D,
  isVector3D,
  isRay3D,
  rectangleToBounds,
  boxToBounds,
  createBoundingRectangle,
  createBoundingBox,
  distance2D,
  distance3D,
  normalize2D,
  normalize3D,
} from './types';

/**
 * Quick Start Guide
 *
 * @example
 * ```typescript
 * import { SpatialIndexer } from '@aigeeksquad/knowledge-network';
 *
 * // Create spatial indexer after layout completes
 * const indexer = new SpatialIndexer({ maxDepth: 8, maxNodesPerLeaf: 10 });
 *
 * // Build spatial index from positioned nodes
 * indexer.build(layoutResult.nodes);
 *
 * // Query nodes near a point
 * const nearbyNodes = indexer.queryPoint({ x: 100, y: 200 }, 50);
 *
 * // Query nodes in a region
 * const regionNodes = indexer.queryRegion({ x: 0, y: 0, width: 100, height: 100 });
 *
 * // Ray-based node selection
 * const ray = { origin: { x: 0, y: 0 }, direction: { x: 1, y: 0 } };
 * const intersectedNodes = indexer.queryRay(ray);
 * ```
 *
 * @example Factory Usage
 * ```typescript
 * import { SpatialIndexerFactory } from '@aigeeksquad/knowledge-network';
 *
 * // Create optimized indexers for different use cases
 * const fastIndexer = SpatialIndexerFactory.createFast();
 * const preciseIndexer = SpatialIndexerFactory.createPrecise();
 * const balancedIndexer = SpatialIndexerFactory.createBalanced();
 * const memoryEfficientIndexer = SpatialIndexerFactory.createMemoryEfficient();
 * ```
 *
 * @example Ray-based Selection
 * ```typescript
 * import { RaycastingUtils } from '@aigeeksquad/knowledge-network';
 *
 * // Create ray from mouse position for 2D canvas
 * const ray = RaycastingUtils.createRayFromMouse(mouseX, mouseY, canvasWidth, canvasHeight);
 * const intersections = indexer.queryRay(ray);
 * const closestNode = RaycastingUtils.getClosestIntersection(intersections);
 * ```
 *
 * @example Advanced 3D Usage
 * ```typescript
 * // 3D spatial indexing is automatically detected when nodes have z coordinates
 * const nodes3D = [
 *   { id: 'n1', x: 10, y: 10, z: 10 },
 *   { id: 'n2', x: 50, y: 50, z: 50 }
 * ];
 *
 * indexer.build(nodes3D);
 *
 * // Query 3D sphere
 * const sphereNodes = indexer.queryPoint({ x: 30, y: 30, z: 30 }, 25);
 *
 * // 3D raycasting
 * const ray3D = { origin: { x: 0, y: 0, z: 0 }, direction: { x: 1, y: 1, z: 1 } };
 * const intersections3D = indexer.queryRay(ray3D);
 * ```
 */