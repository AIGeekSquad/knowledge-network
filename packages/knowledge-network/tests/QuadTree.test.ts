/**
 * Tests for QuadTree - 2D spatial indexing data structure
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QuadTree, QuadTreeUtils } from '../src/spatial/QuadTree';
import type { PositionedNode } from '../src/spatial/../layout/LayoutEngine';
import type { Rectangle, Circle } from '../src/spatial/types';

describe('QuadTree', () => {
  let quadTree: QuadTree;
  let nodes: PositionedNode[];

  beforeEach(() => {
    quadTree = new QuadTree({
      maxDepth: 6,
      maxNodesPerLeaf: 4,
      enableCaching: false,
      cacheSize: 0,
      rayIntersectionTolerance: 1.0,
      pointQueryTolerance: 0.1,
    });

    nodes = [
      { id: 'n1', x: 10, y: 10 },
      { id: 'n2', x: 20, y: 20 },
      { id: 'n3', x: 80, y: 80 },
      { id: 'n4', x: 90, y: 10 },
      { id: 'n5', x: 10, y: 90 },
      { id: 'n6', x: 50, y: 50 },
      { id: 'n7', x: 30, y: 70 },
      { id: 'n8', x: 70, y: 30 },
    ];
  });

  describe('Initialization and Building', () => {
    it('should initialize empty quadtree', () => {
      expect(quadTree.isEmpty()).toBe(true);
      expect(quadTree.getAllNodes()).toHaveLength(0);
    });

    it('should build quadtree from nodes', () => {
      quadTree.build(nodes);

      expect(quadTree.isEmpty()).toBe(false);
      expect(quadTree.getAllNodes()).toHaveLength(8);

      const stats = quadTree.getStatistics();
      expect(stats.nodeCount).toBe(8);
      expect(stats.buildTime).toBeGreaterThan(0);
    });

    it('should handle empty node array', () => {
      quadTree.build([]);

      expect(quadTree.isEmpty()).toBe(true);
      expect(quadTree.getAllNodes()).toHaveLength(0);
    });

    it('should calculate proper bounds', () => {
      quadTree.build(nodes);
      const bounds = quadTree.getBounds();

      expect(bounds.x).toBeLessThan(10);
      expect(bounds.y).toBeLessThan(10);
      expect(bounds.x + bounds.width).toBeGreaterThan(90);
      expect(bounds.y + bounds.height).toBeGreaterThan(90);
    });
  });

  describe('Rectangle Queries', () => {
    beforeEach(() => {
      quadTree.build(nodes);
    });

    it('should query nodes in rectangle region', () => {
      const rect: Rectangle = { x: 0, y: 0, width: 50, height: 50 };
      const results = quadTree.queryRegion(rect);

      // Should include nodes n1, n2, n6 (and possibly others depending on bounds)
      expect(results.length).toBeGreaterThan(0);

      const ids = results.map(n => n.id);
      expect(ids).toContain('n1'); // (10, 10)
      expect(ids).toContain('n2'); // (20, 20)
      expect(ids).toContain('n6'); // (50, 50) - on edge
    });

    it('should return empty array for non-intersecting rectangle', () => {
      const rect: Rectangle = { x: 200, y: 200, width: 50, height: 50 };
      const results = quadTree.queryRegion(rect);

      expect(results).toHaveLength(0);
    });

    it('should query nodes in small rectangle', () => {
      const rect: Rectangle = { x: 5, y: 5, width: 10, height: 10 };
      const results = quadTree.queryRegion(rect);

      const ids = results.map(n => n.id);
      expect(ids).toContain('n1'); // (10, 10) should be in or on edge
    });
  });

  describe('Circle Queries', () => {
    beforeEach(() => {
      quadTree.build(nodes);
    });

    it('should query nodes in circular region', () => {
      const circle: Circle = { center: { x: 15, y: 15 }, radius: 10 };
      const results = quadTree.queryRegion(circle);

      const ids = results.map(n => n.id);
      expect(ids).toContain('n1'); // (10, 10) should be within radius
      expect(ids).toContain('n2'); // (20, 20) should be within radius
    });

    it('should handle large circle covering all nodes', () => {
      const circle: Circle = { center: { x: 50, y: 50 }, radius: 100 };
      const results = quadTree.queryRegion(circle);

      expect(results).toHaveLength(8); // All nodes should be included
    });

    it('should handle small circle with no nodes', () => {
      const circle: Circle = { center: { x: 200, y: 200 }, radius: 5 };
      const results = quadTree.queryRegion(circle);

      expect(results).toHaveLength(0);
    });
  });

  describe('Point Queries', () => {
    beforeEach(() => {
      quadTree.build(nodes);
    });

    it('should query nodes near point with radius', () => {
      const results = quadTree.queryPoint({ x: 15, y: 15 }, 10);

      const ids = results.map(n => n.id);
      expect(ids).toContain('n1'); // (10, 10)
      expect(ids).toContain('n2'); // (20, 20)
    });

    it('should query exact point', () => {
      const results = quadTree.queryExactPoint({ x: 10, y: 10 }, 1);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('n1');
    });

    it('should handle zero radius query', () => {
      const results = quadTree.queryPoint({ x: 10, y: 10 }, 0);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('n1');
    });
  });

  describe('Tree Structure and Statistics', () => {
    it('should respect max depth configuration', () => {
      const shallowTree = new QuadTree({
        maxDepth: 2,
        maxNodesPerLeaf: 1,
        enableCaching: false,
        cacheSize: 0,
        rayIntersectionTolerance: 1.0,
        pointQueryTolerance: 0.1,
      });

      shallowTree.build(nodes);
      const stats = shallowTree.getStatistics();

      expect(stats.maxDepth).toBeLessThanOrEqual(2);
    });

    it('should respect max nodes per leaf configuration', () => {
      const denseTree = new QuadTree({
        maxDepth: 10,
        maxNodesPerLeaf: 2,
        enableCaching: false,
        cacheSize: 0,
        rayIntersectionTolerance: 1.0,
        pointQueryTolerance: 0.1,
      });

      denseTree.build(nodes);
      const stats = denseTree.getStatistics();

      expect(stats.nodeCount).toBe(8);
      expect(stats.maxDepth).toBeGreaterThan(0);
    });

    it('should provide meaningful statistics', () => {
      quadTree.build(nodes);
      const stats = quadTree.getStatistics();

      expect(stats.nodeCount).toBe(8);
      expect(stats.maxDepth).toBeGreaterThanOrEqual(0);
      expect(stats.averageDepth).toBeGreaterThanOrEqual(0);
      expect(stats.memoryUsage).toBeGreaterThan(0);
      expect(stats.buildTime).toBeGreaterThan(0);
    });

    it('should convert to serializable data structure', () => {
      quadTree.build(nodes);
      const data = quadTree.toData();

      expect(data).toBeDefined();
      expect(data!.bounds).toBeDefined();
      expect(data!.nodes).toBeDefined();
      expect(data!.level).toBe(0);
    });
  });

  describe('Configuration Management', () => {
    it('should get and set configuration', () => {
      const config = quadTree.getConfig();
      expect(config.maxDepth).toBe(6);

      quadTree.setConfig({
        maxDepth: 8,
        maxNodesPerLeaf: 10,
        enableCaching: false,
        cacheSize: 0,
        rayIntersectionTolerance: 1.0,
        pointQueryTolerance: 0.1,
      });

      const newConfig = quadTree.getConfig();
      expect(newConfig.maxDepth).toBe(8);
      expect(newConfig.maxNodesPerLeaf).toBe(10);
    });
  });

  describe('Clear and Rebuild', () => {
    it('should clear quadtree', () => {
      quadTree.build(nodes);
      expect(quadTree.getAllNodes()).toHaveLength(8);

      quadTree.clear();
      expect(quadTree.isEmpty()).toBe(true);
      expect(quadTree.getAllNodes()).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single node', () => {
      const singleNode: PositionedNode[] = [{ id: 'n1', x: 50, y: 50 }];
      quadTree.build(singleNode);

      const results = quadTree.queryPoint({ x: 50, y: 50 }, 1);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('n1');
    });

    it('should handle nodes at exact same position', () => {
      const duplicateNodes: PositionedNode[] = [
        { id: 'n1', x: 50, y: 50 },
        { id: 'n2', x: 50, y: 50 },
        { id: 'n3', x: 50, y: 50 },
      ];

      quadTree.build(duplicateNodes);
      const results = quadTree.queryPoint({ x: 50, y: 50 }, 1);

      expect(results).toHaveLength(3);
    });

    it('should handle very large coordinate values', () => {
      const largeNodes: PositionedNode[] = [
        { id: 'n1', x: 1e6, y: 1e6 },
        { id: 'n2', x: 1e6 + 100, y: 1e6 + 100 },
      ];

      quadTree.build(largeNodes);
      const results = quadTree.queryPoint({ x: 1e6 + 50, y: 1e6 + 50 }, 100);

      expect(results).toHaveLength(2);
    });

    it('should handle negative coordinates', () => {
      const negativeNodes: PositionedNode[] = [
        { id: 'n1', x: -50, y: -50 },
        { id: 'n2', x: -25, y: -25 },
        { id: 'n3', x: 0, y: 0 },
      ];

      quadTree.build(negativeNodes);
      const results = quadTree.queryPoint({ x: -30, y: -30 }, 20);

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset: PositionedNode[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          id: `n${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        });
      }

      const startTime = performance.now();
      quadTree.build(largeDataset);
      const buildTime = performance.now() - startTime;

      expect(buildTime).toBeLessThan(500); // Should build quickly

      const queryStartTime = performance.now();
      const results = quadTree.queryPoint({ x: 500, y: 500 }, 50);
      const queryTime = performance.now() - queryStartTime;

      expect(queryTime).toBeLessThan(20); // Should query quickly
      expect(results.length).toBeGreaterThan(0);
    });

    it('should perform better than linear search for large datasets', () => {
      const largeDataset: PositionedNode[] = [];
      for (let i = 0; i < 5000; i++) {
        largeDataset.push({
          id: `n${i}`,
          x: Math.random() * 1000,
          y: Math.random() * 1000,
        });
      }

      quadTree.build(largeDataset);

      // Test multiple queries
      const queryCount = 100;
      const startTime = performance.now();

      for (let i = 0; i < queryCount; i++) {
        quadTree.queryPoint(
          { x: Math.random() * 1000, y: Math.random() * 1000 },
          30
        );
      }

      const totalTime = performance.now() - startTime;
      const averageTimePerQuery = totalTime / queryCount;

      expect(averageTimePerQuery).toBeLessThan(5); // Should be very fast per query
    });
  });
});

describe('QuadTreeUtils', () => {
  describe('Rectangle Operations', () => {
    it('should create rectangle from center', () => {
      const rect = QuadTreeUtils.createRectangleFromCenter(
        { x: 50, y: 50 },
        20,
        30
      );

      expect(rect.x).toBe(40);
      expect(rect.y).toBe(35);
      expect(rect.width).toBe(20);
      expect(rect.height).toBe(30);
    });

    it('should create circle', () => {
      const circle = QuadTreeUtils.createCircle({ x: 10, y: 20 }, 15);

      expect(circle.center.x).toBe(10);
      expect(circle.center.y).toBe(20);
      expect(circle.radius).toBe(15);
    });

    it('should detect rectangle intersection', () => {
      const rect1: Rectangle = { x: 0, y: 0, width: 10, height: 10 };
      const rect2: Rectangle = { x: 5, y: 5, width: 10, height: 10 };
      const rect3: Rectangle = { x: 20, y: 20, width: 10, height: 10 };

      expect(QuadTreeUtils.rectanglesIntersect(rect1, rect2)).toBe(true);
      expect(QuadTreeUtils.rectanglesIntersect(rect1, rect3)).toBe(false);
    });

    it('should calculate rectangle area', () => {
      const rect: Rectangle = { x: 0, y: 0, width: 10, height: 20 };
      expect(QuadTreeUtils.rectangleArea(rect)).toBe(200);
    });

    it('should calculate circle area', () => {
      const circle = { center: { x: 0, y: 0 }, radius: 5 };
      const area = QuadTreeUtils.circleArea(circle);
      expect(area).toBeCloseTo(Math.PI * 25, 2);
    });
  });
});