/**
 * Tests for RaycastingSystem - Ray-based spatial queries
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RaycastingSystem, RaycastingUtils } from '../src/spatial/RaycastingSystem';
import { QuadTree } from '../src/spatial/QuadTree';
import { OctTree } from '../src/spatial/OctTree';
import type { PositionedNode } from '../src/spatial/../layout/LayoutEngine';
import type { Ray2D, Ray3D, Point2D, Point3D } from '../src/spatial/types';

describe('RaycastingSystem', () => {
  let raycastingSystem: RaycastingSystem;
  let quadTree: QuadTree;
  let octTree: OctTree;
  let nodes2D: PositionedNode[];
  let nodes3D: PositionedNode[];

  beforeEach(() => {
    const config = {
      maxDepth: 6,
      maxNodesPerLeaf: 4,
      enableCaching: false,
      cacheSize: 0,
      rayIntersectionTolerance: 5.0,
      pointQueryTolerance: 0.1,
    };

    raycastingSystem = new RaycastingSystem(config);
    quadTree = new QuadTree(config);
    octTree = new OctTree(config);

    // Create test nodes in a line for easy ray intersection testing
    nodes2D = [
      { id: 'n1', x: 10, y: 50 },
      { id: 'n2', x: 30, y: 50 },
      { id: 'n3', x: 50, y: 50 },
      { id: 'n4', x: 70, y: 50 },
      { id: 'n5', x: 90, y: 50 },
      { id: 'n6', x: 50, y: 10 }, // Off the line
      { id: 'n7', x: 50, y: 90 }, // Off the line
    ];

    nodes3D = [
      { id: 'n1', x: 10, y: 50, z: 50 },
      { id: 'n2', x: 30, y: 50, z: 50 },
      { id: 'n3', x: 50, y: 50, z: 50 },
      { id: 'n4', x: 70, y: 50, z: 50 },
      { id: 'n5', x: 90, y: 50, z: 50 },
      { id: 'n6', x: 50, y: 10, z: 50 }, // Off the line
      { id: 'n7', x: 50, y: 90, z: 50 }, // Off the line
    ];
  });

  describe('2D Raycasting', () => {
    beforeEach(() => {
      quadTree.build(nodes2D);
    });

    it('should perform horizontal ray intersection', () => {
      const ray: Ray2D = {
        origin: { x: 0, y: 50 },
        direction: { x: 1, y: 0 } // Ray going right along y=50
      };

      const intersections = raycastingSystem.raycast2D(ray, quadTree);

      expect(intersections.length).toBeGreaterThan(0);

      // Should find nodes along the horizontal line
      const nodeIds = intersections.map(i => i.node.id);
      expect(nodeIds).toContain('n1');
      expect(nodeIds).toContain('n2');
      expect(nodeIds).toContain('n3');

      // Results should be sorted by distance
      for (let i = 1; i < intersections.length; i++) {
        expect(intersections[i].distance).toBeGreaterThanOrEqual(intersections[i - 1].distance);
      }
    });

    it('should perform diagonal ray intersection', () => {
      const ray: Ray2D = {
        origin: { x: 0, y: 0 },
        direction: { x: 1, y: 1 } // Ray going diagonally
      };

      const intersections = raycastingSystem.raycast2D(ray, quadTree);

      expect(intersections.length).toBeGreaterThan(0);

      // Each intersection should have valid properties
      intersections.forEach(intersection => {
        expect(intersection.node).toBeDefined();
        expect(intersection.distance).toBeGreaterThanOrEqual(0);
        expect(intersection.point).toBeDefined();
        expect(intersection.point.x).toBeGreaterThanOrEqual(0);
        expect(intersection.point.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('should handle ray with no intersections', () => {
      const ray: Ray2D = {
        origin: { x: 0, y: 0 },
        direction: { x: -1, y: -1 } // Ray going away from nodes
      };

      const intersections = raycastingSystem.raycast2D(ray, quadTree);

      expect(intersections).toHaveLength(0);
    });

    it('should convert 3D ray to 2D for 2D raycasting', () => {
      const ray3D: Ray3D = {
        origin: { x: 0, y: 50, z: 0 },
        direction: { x: 1, y: 0, z: 0 }
      };

      const intersections = raycastingSystem.raycast2D(ray3D, quadTree);

      expect(intersections.length).toBeGreaterThan(0);
      // Should work similar to 2D ray
    });
  });

  describe('3D Raycasting', () => {
    beforeEach(() => {
      octTree.build(nodes3D);
    });

    it('should perform 3D ray intersection', () => {
      const ray: Ray3D = {
        origin: { x: 0, y: 50, z: 50 },
        direction: { x: 1, y: 0, z: 0 } // Ray going right along y=50, z=50
      };

      const intersections = raycastingSystem.raycast3D(ray, octTree);

      expect(intersections.length).toBeGreaterThan(0);

      // Should find nodes along the line
      const nodeIds = intersections.map(i => i.node.id);
      expect(nodeIds).toContain('n1');
      expect(nodeIds).toContain('n2');
      expect(nodeIds).toContain('n3');

      // Results should be sorted by distance
      for (let i = 1; i < intersections.length; i++) {
        expect(intersections[i].distance).toBeGreaterThanOrEqual(intersections[i - 1].distance);
      }
    });

    it('should perform 3D diagonal ray intersection', () => {
      const ray: Ray3D = {
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 1, y: 1, z: 1 } // Ray going diagonally in 3D
      };

      const intersections = raycastingSystem.raycast3D(ray, octTree);

      expect(intersections.length).toBeGreaterThan(0);

      // Each intersection should have valid 3D properties
      intersections.forEach(intersection => {
        expect(intersection.node).toBeDefined();
        expect(intersection.distance).toBeGreaterThanOrEqual(0);
        expect(intersection.point).toBeDefined();
        expect('z' in intersection.point).toBe(true);
      });
    });

    it('should convert 2D ray to 3D for 3D raycasting', () => {
      const ray2D: Ray2D = {
        origin: { x: 0, y: 50 },
        direction: { x: 1, y: 0 }
      };

      const intersections = raycastingSystem.raycast3D(ray2D, octTree);

      expect(intersections.length).toBeGreaterThan(0);
      // Should work by extending ray into 3D space
    });

    it('should handle rays that miss all nodes', () => {
      const ray: Ray3D = {
        origin: { x: 0, y: 0, z: 0 },
        direction: { x: 0, y: 0, z: -1 } // Ray going into negative Z
      };

      const intersections = raycastingSystem.raycast3D(ray, octTree);

      // May or may not intersect depending on tolerance, but should not crash
      expect(intersections).toBeDefined();
      expect(Array.isArray(intersections)).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxDepth: 8,
        maxNodesPerLeaf: 6,
        enableCaching: true,
        cacheSize: 100,
        rayIntersectionTolerance: 2.0,
        pointQueryTolerance: 0.05,
      };

      raycastingSystem.setConfig(newConfig);
      const config = raycastingSystem.getConfig();

      expect(config.rayIntersectionTolerance).toBe(2.0);
      expect(config.pointQueryTolerance).toBe(0.05);
    });

    it('should affect intersection tolerance', () => {
      quadTree.build(nodes2D);

      // Test with tight tolerance
      raycastingSystem.setConfig({
        ...raycastingSystem.getConfig(),
        rayIntersectionTolerance: 1.0
      });

      const ray: Ray2D = {
        origin: { x: 0, y: 45 }, // Slightly off the line
        direction: { x: 1, y: 0 }
      };

      const tightResults = raycastingSystem.raycast2D(ray, quadTree);

      // Test with loose tolerance
      raycastingSystem.setConfig({
        ...raycastingSystem.getConfig(),
        rayIntersectionTolerance: 10.0
      });

      const looseResults = raycastingSystem.raycast2D(ray, quadTree);

      expect(looseResults.length).toBeGreaterThanOrEqual(tightResults.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ray starting inside node cluster', () => {
      quadTree.build(nodes2D);

      const ray: Ray2D = {
        origin: { x: 50, y: 50 }, // Start at a node position
        direction: { x: 1, y: 0 }
      };

      const intersections = raycastingSystem.raycast2D(ray, quadTree);

      expect(intersections.length).toBeGreaterThan(0);
    });

    it('should handle zero-length direction vector', () => {
      quadTree.build(nodes2D);

      const ray: Ray2D = {
        origin: { x: 50, y: 50 },
        direction: { x: 0, y: 0 }
      };

      // Should not crash, though results may be empty or undefined
      expect(() => {
        raycastingSystem.raycast2D(ray, quadTree);
      }).not.toThrow();
    });

    it('should handle empty spatial index', () => {
      const emptyQuadTree = new QuadTree({
        maxDepth: 6,
        maxNodesPerLeaf: 4,
        enableCaching: false,
        cacheSize: 0,
        rayIntersectionTolerance: 5.0,
        pointQueryTolerance: 0.1,
      });

      const ray: Ray2D = {
        origin: { x: 0, y: 0 },
        direction: { x: 1, y: 1 }
      };

      const intersections = raycastingSystem.raycast2D(ray, emptyQuadTree);

      expect(intersections).toHaveLength(0);
    });
  });

  describe('Performance', () => {
    it('should handle raycasting on large datasets efficiently', () => {
      const largeNodes: PositionedNode[] = [];
      for (let i = 0; i < 1000; i++) {
        largeNodes.push({
          id: `n${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        });
      }

      quadTree.build(largeNodes);

      const ray: Ray2D = {
        origin: { x: 0, y: 500 },
        direction: { x: 1, y: 0 }
      };

      const startTime = performance.now();
      const intersections = raycastingSystem.raycast2D(ray, quadTree);
      const raycastTime = performance.now() - startTime;

      expect(raycastTime).toBeLessThan(100); // Should be fast
      expect(intersections.length).toBeGreaterThan(0);
    });
  });
});

describe('RaycastingUtils', () => {
  describe('Ray Creation', () => {
    it('should create 2D ray from two points', () => {
      const start: Point2D = { x: 0, y: 0 };
      const end: Point2D = { x: 10, y: 10 };

      const ray = RaycastingUtils.createRay2DFromPoints(start, end);

      expect(ray.origin).toEqual(start);
      expect(ray.direction.x).toBeCloseTo(Math.sqrt(0.5), 2);
      expect(ray.direction.y).toBeCloseTo(Math.sqrt(0.5), 2);
    });

    it('should create 3D ray from two points', () => {
      const start: Point3D = { x: 0, y: 0, z: 0 };
      const end: Point3D = { x: 10, y: 0, z: 0 };

      const ray = RaycastingUtils.createRay3DFromPoints(start, end);

      expect(ray.origin).toEqual(start);
      expect(ray.direction.x).toBe(1);
      expect(ray.direction.y).toBe(0);
      expect(ray.direction.z).toBe(0);
    });

    it('should create ray from mouse coordinates', () => {
      const ray = RaycastingUtils.createRayFromMouse(100, 150, 800, 600);

      expect(ray.origin.x).toBe(400);
      expect(ray.origin.y).toBe(300);
      expect(ray.direction).toBeDefined();
    });

    it('should create camera ray for 3D selection', () => {
      const cameraPos: Point3D = { x: 0, y: 0, z: 10 };
      const cameraTarget: Point3D = { x: 0, y: 0, z: 0 };

      const ray = RaycastingUtils.createCameraRay(0.5, 0.5, cameraPos, cameraTarget, 45, 1.0);

      expect(ray.origin).toEqual(cameraPos);
      expect(ray.direction).toBeDefined();
    });
  });

  describe('Intersection Utilities', () => {
    it('should calculate ray length between intersections', () => {
      const intersection1 = {
        node: { id: 'n1', x: 0, y: 0 },
        distance: 0,
        point: { x: 0, y: 0 }
      };

      const intersection2 = {
        node: { id: 'n2', x: 10, y: 0 },
        distance: 10,
        point: { x: 10, y: 0 }
      };

      const length = RaycastingUtils.calculateRayLength(intersection1, intersection2);
      expect(length).toBe(10);
    });

    it('should filter intersections by distance range', () => {
      const intersections = [
        { node: { id: 'n1', x: 0, y: 0 }, distance: 5, point: { x: 5, y: 0 } },
        { node: { id: 'n2', x: 0, y: 0 }, distance: 15, point: { x: 15, y: 0 } },
        { node: { id: 'n3', x: 0, y: 0 }, distance: 25, point: { x: 25, y: 0 } },
      ];

      const filtered = RaycastingUtils.filterIntersectionsByDistance(intersections, 10, 20);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].distance).toBe(15);
    });

    it('should get closest intersection', () => {
      const intersections = [
        { node: { id: 'n1', x: 0, y: 0 }, distance: 15, point: { x: 15, y: 0 } },
        { node: { id: 'n2', x: 0, y: 0 }, distance: 5, point: { x: 5, y: 0 } },
        { node: { id: 'n3', x: 0, y: 0 }, distance: 25, point: { x: 25, y: 0 } },
      ];

      const closest = RaycastingUtils.getClosestIntersection(intersections);

      expect(closest).not.toBeNull();
      expect(closest!.distance).toBe(5);
    });

    it('should return null for empty intersection list', () => {
      const closest = RaycastingUtils.getClosestIntersection([]);
      expect(closest).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle identical points in ray creation', () => {
      const point: Point2D = { x: 10, y: 20 };
      const ray = RaycastingUtils.createRay2DFromPoints(point, point);

      expect(ray.origin).toEqual(point);
      // Direction should be zero or normalized to a default
      expect(ray.direction).toBeDefined();
    });

    it('should handle zero mouse coordinates', () => {
      const ray = RaycastingUtils.createRayFromMouse(0, 0, 800, 600);

      expect(ray.origin.x).toBe(400);
      expect(ray.origin.y).toBe(300);
      expect(ray.direction).toBeDefined();
    });
  });
});