/**
 * Spatial indexing types for efficient node selection and spatial queries.
 *
 * These types support both 2D and 3D spatial operations for the Knowledge Network.
 * The spatial indexing system operates AFTER layout completion using positioned nodes.
 */

import type { PositionedNode } from '../layout/LayoutEngine';

// === Core Spatial Types ===

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export type Point = Point2D | Point3D;

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D extends Vector2D {
  z: number;
}

export type Vector = Vector2D | Vector3D;

// === Geometric Primitives ===

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Circle {
  center: Point2D;
  radius: number;
}

export interface Box {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
}

export interface Sphere {
  center: Point3D;
  radius: number;
}

// === Ray Types ===

export interface Ray2D {
  origin: Point2D;
  direction: Vector2D;
}

export interface Ray3D {
  origin: Point3D;
  direction: Vector3D;
}

export type Ray = Ray2D | Ray3D;

// === Intersection Results ===

export interface RayIntersection {
  node: PositionedNode;
  distance: number;
  point: Point;
}

export interface SpatialQueryResult {
  nodes: PositionedNode[];
  count: number;
}

// === Spatial Index Statistics ===

export interface SpatialIndexStats {
  nodeCount: number;
  maxDepth: number;
  averageDepth: number;
  memoryUsage: number; // Estimated memory usage in bytes
  buildTime: number; // Time taken to build index in milliseconds
  lastBuildTime: number; // Timestamp of last build
}

// === Tree Node Interfaces ===

export interface QuadTreeNodeData {
  bounds: Rectangle;
  nodes: PositionedNode[];
  children: QuadTreeNodeData[] | null;
  level: number;
}

export interface OctTreeNodeData {
  bounds: Box;
  nodes: PositionedNode[];
  children: OctTreeNodeData[] | null;
  level: number;
}

// === Configuration ===

export interface SpatialIndexConfig {
  // QuadTree/OctTree configuration
  maxDepth: number;
  maxNodesPerLeaf: number;

  // Performance tuning
  enableCaching: boolean;
  cacheSize: number;

  // Intersection tolerances
  rayIntersectionTolerance: number;
  pointQueryTolerance: number;
}

// === Default Configuration ===

export const DEFAULT_SPATIAL_CONFIG: SpatialIndexConfig = {
  maxDepth: 10,
  maxNodesPerLeaf: 10,
  enableCaching: true,
  cacheSize: 100,
  rayIntersectionTolerance: 1.0,
  pointQueryTolerance: 0.1,
};

// === Utility Functions ===

/**
 * Check if a point has 3D coordinates
 */
export function isPoint3D(point: Point): point is Point3D {
  return 'z' in point && typeof point.z === 'number';
}

/**
 * Check if a vector has 3D components
 */
export function isVector3D(vector: Vector): vector is Vector3D {
  return 'z' in vector && typeof vector.z === 'number';
}

/**
 * Check if a ray is 3D
 */
export function isRay3D(ray: Ray): ray is Ray3D {
  return isPoint3D(ray.origin) && isVector3D(ray.direction);
}

/**
 * Convert Rectangle to bounds array [minX, minY, maxX, maxY]
 */
export function rectangleToBounds(rect: Rectangle): [number, number, number, number] {
  return [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height];
}

/**
 * Convert Box to bounds array [minX, minY, minZ, maxX, maxY, maxZ]
 */
export function boxToBounds(box: Box): [number, number, number, number, number, number] {
  return [
    box.x,
    box.y,
    box.z,
    box.x + box.width,
    box.y + box.height,
    box.z + box.depth
  ];
}

/**
 * Create a Rectangle from positioned nodes
 */
export function createBoundingRectangle(nodes: PositionedNode[], padding = 0): Rectangle {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);

  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Create a Box from positioned nodes with 3D coordinates
 */
export function createBoundingBox(nodes: PositionedNode[], padding = 0): Box {
  if (nodes.length === 0) {
    return { x: 0, y: 0, z: 0, width: 0, height: 0, depth: 0 };
  }

  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const zs = nodes.map(n => n.z || 0);

  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const minZ = Math.min(...zs) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;
  const maxZ = Math.max(...zs) + padding;

  return {
    x: minX,
    y: minY,
    z: minZ,
    width: maxX - minX,
    height: maxY - minY,
    depth: maxZ - minZ,
  };
}

/**
 * Calculate distance between two 2D points
 */
export function distance2D(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance between two 3D points
 */
export function distance3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Normalize a 2D vector
 */
export function normalize2D(vector: Vector2D): Vector2D {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: vector.x / length, y: vector.y / length };
}

/**
 * Normalize a 3D vector
 */
export function normalize3D(vector: Vector3D): Vector3D {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y + vector.z * vector.z);
  if (length === 0) return { x: 0, y: 0, z: 0 };
  return { x: vector.x / length, y: vector.y / length, z: vector.z / length };
}