/**
 * Tests for SpatialIndexer - Main spatial indexing functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialIndexer, SpatialIndexerFactory } from '../src/spatial/SpatialIndexer';
import type { PositionedNode } from '../src/layout/LayoutEngine';
import type { Rectangle, Box, Ray2D, Ray3D } from '../src/spatial/types';

describe('SpatialIndexer', () => {
  let indexer: SpatialIndexer;
  let nodes2D: PositionedNode[];
  let nodes3D: PositionedNode[];

  beforeEach(() => {
    indexer = new SpatialIndexer({
      maxDepth: 6,
      maxNodesPerLeaf: 4,
      enableCaching: false, // Disable for predictable tests
    });

    // Create test data for 2D
    nodes2D = [
      { id: 'n1', x: 10, y: 10 },
      { id: 'n2', x: 50, y: 50 },
      { id: 'n3', x: 90, y: 90 },
      { id: 'n4', x: 25, y: 75 },
      { id: 'n5', x: 75, y: 25 },
    ];

    // Create test data for 3D
    nodes3D = [
      { id: 'n1', x: 10, y: 10, z: 10 },
      { id: 'n2', x: 50, y: 50, z: 50 },
      { id: 'n3', x: 90, y: 90, z: 90 },
      { id: 'n4', x: 25, y: 75, z: 25 },
      { id: 'n5', x: 75, y: 25, z: 75 },
    ];
  });

  describe('Basic Operations', () => {
    it('should build 2D index correctly', () => {
      indexer.build(nodes2D);

      expect(indexer.is3DIndex()).toBe(false);
      expect(indexer.getNodes()).toHaveLength(5);

      const stats = indexer.getStatistics();
      expect(stats.nodeCount).toBe(5);
      expect(stats.buildTime).toBeGreaterThan(0);
    });

    it('should build 3D index correctly', () => {
      indexer.build(nodes3D);

      expect(indexer.is3DIndex()).toBe(true);
      expect(indexer.getNodes()).toHaveLength(5);

      const stats = indexer.getStatistics();
      expect(stats.nodeCount).toBe(5);
      expect(stats.buildTime).toBeGreaterThan(0);
    });

    it('should handle empty node list', () => {
      indexer.build([]);

      expect(indexer.getNodes()).toHaveLength(0);
      expect(indexer.queryPoint({ x: 0, y: 0 })).toHaveLength(0);

      const stats = indexer.getStatistics();
      expect(stats.nodeCount).toBe(0);
    });

    it('should clear index correctly', () => {
      indexer.build(nodes2D);
      expect(indexer.getNodes()).toHaveLength(5);

      indexer.clear();
      expect(indexer.getNodes()).toHaveLength(0);
      expect(indexer.queryPoint({ x: 50, y: 50 })).toHaveLength(0);
    });

    it('should rebuild index with new data', () => {
      indexer.build(nodes2D);
      expect(indexer.is3DIndex()).toBe(false);

      indexer.rebuild(nodes3D);
      expect(indexer.is3DIndex()).toBe(true);
      expect(indexer.getNodes()).toHaveLength(5);
    });
  });

  describe('2D Point Queries', () => {
    beforeEach(() => {
      indexer.build(nodes2D);
    });

    it('should find nodes near a point', () => {
      // Query near node n2 (50, 50)
      const results = indexer.queryPoint({ x: 52, y: 48 }, 10);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('n2');
    });

    it('should find multiple nodes within radius', () => {
      // Query with large radius to catch multiple nodes
      const results = indexer.queryPoint({ x: 50, y: 50 }, 50);
      expect(results.length).toBeGreaterThan(1);
    });

    it('should return empty array for distant points', () => {
      const results = indexer.queryPoint({ x: 200, y: 200 }, 5);
      expect(results).toHaveLength(0);
    });

    it('should handle zero radius correctly', () => {
      // Should find node at exact position
      const results = indexer.queryPoint({ x: 50, y: 50 }, 0);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('n2');
    });
  });

  describe('3D Point Queries', () => {
    beforeEach(() => {
      indexer.build(nodes3D);
    });

    it('should find nodes near a 3D point', () => {
      // Query near node n2 (50, 50, 50)
      const results = indexer.queryPoint({ x: 52, y: 48, z: 51 }, 10);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('n2');
    });

    it('should handle 2D query on 3D index', () => {
      // 2D point should be converted to 3D with z=0
      const results = indexer.queryPoint({ x: 52, y: 48 }, 15);
      // Should find nodes near the XY projection
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Region Queries', () => {
    beforeEach(() => {
      indexer.build(nodes2D);
    });

    it('should find nodes in rectangular region', () => {
      const region: Rectangle = { x: 0, y: 0, width: 60, height: 60 };
      const results = indexer.queryRegion(region);

      // Should find n1 (10,10) and n2 (50,50)
      expect(results.length).toBeGreaterThanOrEqual(2);
      const ids = results.map(n => n.id);
      expect(ids).toContain('n1');
      expect(ids).toContain('n2');
    });

    it('should handle box region on 2D index', () => {
      const region: Box = { x: 0, y: 0, z: -10, width: 60, height: 60, depth: 20 };
      const results = indexer.queryRegion(region);

      // Should work similar to rectangle
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Ray Queries', () => {
    beforeEach(() => {
      indexer.build(nodes2D);
    });

    it('should perform 2D raycasting', () => {
      const ray: Ray2D = {
        origin: { x: 0, y: 50 },
        direction: { x: 1, y: 0 } // Ray going right
      };

      const intersections = indexer.queryRay(ray);
      expect(intersections.length).toBeGreaterThan(0);

      // Results should be sorted by distance
      for (let i = 1; i < intersections.length; i++) {
        expect(intersections[i].distance).toBeGreaterThanOrEqual(intersections[i - 1].distance);
      }
    });

    it('should perform 3D raycasting on 3D index', () => {
      indexer.build(nodes3D);

      const ray: Ray3D = {
        origin: { x: 0, y: 0, z: 50 },
        direction: { x: 1, y: 1, z: 0 } // Ray going diagonally in XY plane
      };

      const intersections = indexer.queryRay(ray);
      expect(intersections.length).toBeGreaterThan(0);

      // Check that intersection points are valid
      intersections.forEach(intersection => {
        expect(intersection.point).toBeDefined();
        expect(intersection.distance).toBeGreaterThanOrEqual(0);
        expect(intersection.node).toBeDefined();
      });
    });
  });

  describe('Nearest Node Search', () => {
    beforeEach(() => {
      indexer.build(nodes2D);
    });

    it('should find nearest node', () => {
      const nearest = indexer.findNearest({ x: 12, y: 8 });
      expect(nearest).not.toBeNull();
      expect(nearest!.id).toBe('n1'); // Should be closest to (10, 10)
    });

    it('should return null when no nodes within max distance', () => {
      const nearest = indexer.findNearest({ x: 200, y: 200 }, 10);
      expect(nearest).toBeNull();
    });

    it('should respect max distance parameter', () => {
      const nearest = indexer.findNearest({ x: 12, y: 8 }, 1);
      expect(nearest).toBeNull(); // Should be too far from any node
    });
  });

  describe('Distance-based Queries', () => {
    beforeEach(() => {
      indexer.build(nodes2D);
    });

    it('should get nodes within distance sorted by distance', () => {
      const results = indexer.getNodesWithinDistance({ x: 50, y: 50 }, 50);

      expect(results.length).toBeGreaterThan(0);

      // Should be sorted by distance
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distance).toBeGreaterThanOrEqual(results[i - 1].distance);
      }

      // All results should be within the specified distance
      results.forEach(result => {
        expect(result.distance).toBeLessThanOrEqual(50);
      });
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        maxDepth: 8,
        maxNodesPerLeaf: 6,
      };

      indexer.setConfig(newConfig);
      const config = indexer.getConfig();

      expect(config.maxDepth).toBe(8);
      expect(config.maxNodesPerLeaf).toBe(6);
    });

    it('should rebuild when configuration changes with existing nodes', () => {
      indexer.build(nodes2D);
      const initialStats = indexer.getStatistics();

      indexer.setConfig({ maxDepth: 2 });
      const newStats = indexer.getStatistics();

      // Should have rebuilt the index
      expect(newStats.buildTime).toBeGreaterThan(0);
      expect(newStats.maxDepth).toBeLessThanOrEqual(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle nodes with same coordinates', () => {
      const duplicateNodes: PositionedNode[] = [
        { id: 'n1', x: 50, y: 50 },
        { id: 'n2', x: 50, y: 50 },
        { id: 'n3', x: 50, y: 50 },
      ];

      indexer.build(duplicateNodes);
      const results = indexer.queryPoint({ x: 50, y: 50 }, 1);
      expect(results).toHaveLength(3);
    });

    it('should handle negative coordinates', () => {
      const negativeNodes: PositionedNode[] = [
        { id: 'n1', x: -50, y: -50 },
        { id: 'n2', x: 0, y: 0 },
        { id: 'n3', x: 50, y: 50 },
      ];

      indexer.build(negativeNodes);
      const results = indexer.queryPoint({ x: -50, y: -50 }, 10);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle very large coordinates', () => {
      const largeNodes: PositionedNode[] = [
        { id: 'n1', x: 1e6, y: 1e6 },
        { id: 'n2', x: 1e6 + 10, y: 1e6 + 10 },
      ];

      indexer.build(largeNodes);
      const results = indexer.queryPoint({ x: 1e6 + 5, y: 1e6 + 5 }, 20);
      expect(results).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('should handle large number of nodes efficiently', () => {
      const largeNodeSet: PositionedNode[] = [];
      for (let i = 0; i < 1000; i++) {
        largeNodeSet.push({
          id: `n${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        });
      }

      const startTime = performance.now();
      indexer.build(largeNodeSet);
      const buildTime = performance.now() - startTime;

      expect(buildTime).toBeLessThan(1000); // Should build in less than 1 second

      const queryStartTime = performance.now();
      const results = indexer.queryPoint({ x: 500, y: 500 }, 50);
      const queryTime = performance.now() - queryStartTime;

      expect(queryTime).toBeLessThan(50); // Should query in less than 50ms
      expect(results.length).toBeGreaterThan(0);
    });
  });
});

describe('SpatialIndexerFactory', () => {
  it('should create fast indexer', () => {
    const indexer = SpatialIndexerFactory.createFast();
    const config = indexer.getConfig();

    expect(config.maxDepth).toBe(6);
    expect(config.maxNodesPerLeaf).toBe(20);
  });

  it('should create precise indexer', () => {
    const indexer = SpatialIndexerFactory.createPrecise();
    const config = indexer.getConfig();

    expect(config.maxDepth).toBe(12);
    expect(config.maxNodesPerLeaf).toBe(5);
    expect(config.rayIntersectionTolerance).toBe(0.5);
  });

  it('should create balanced indexer', () => {
    const indexer = SpatialIndexerFactory.createBalanced();
    expect(indexer).toBeDefined();
  });

  it('should create memory-efficient indexer', () => {
    const indexer = SpatialIndexerFactory.createMemoryEfficient();
    const config = indexer.getConfig();

    expect(config.enableCaching).toBe(false);
    expect(config.cacheSize).toBe(0);
  });
});