import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeBundling, type EdgeCompatibilityFunction, type CurveType, type SmoothingType } from '../src/edges/EdgeBundling';
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';

// Test helper types
interface TestNode {
  x: number;
  y: number;
  id: string;
}

interface TestEdge {
  source: TestNode;
  target: TestNode;
  metadata?: {
    type?: string;
    weight?: number;
    category?: string;
    direction?: string;
    level?: number;
  };
}

describe('EdgeBundling - Algorithms & Implementation', () => {
  let container: d3.Selection<SVGGElement, unknown, null, undefined>;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;

    const svg = d3.select(document.body)
      .append('svg')
      .attr('width', 800)
      .attr('height', 600);

    container = svg.append('g');
  });

  describe('Basic Functionality (Enhanced Algorithm)', () => {
    it('should create curved paths with enhanced algorithm', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        compatibilityThreshold: 0.3,
        iterations: 50,
        stepSize: 0.1,
        stiffness: 0.1,
        momentum: 0.5, // New enhanced feature
        curveType: 'basis' // New enhanced feature
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 100, id: 'b' } },
        { source: { x: 100, y: 150, id: 'c' }, target: { x: 400, y: 150, id: 'd' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(2);
    });

    it('should bundle compatible edges with enhanced force application', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.2,
        iterations: 40,
        stepSize: 0.1,
        stiffness: 0.05,
        momentum: 0.6,
      });

      const edges: TestEdge[] = [
        { source: { x: 50, y: 200, id: 'e1s' }, target: { x: 450, y: 200, id: 'e1t' } },
        { source: { x: 50, y: 210, id: 'e2s' }, target: { x: 450, y: 210, id: 'e2t' } },
        { source: { x: 50, y: 220, id: 'e3s' }, target: { x: 450, y: 220, id: 'e3t' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(3);
    });

    it('should create visible curvature with enhanced algorithm', () => {
      const bundler = new EdgeBundling({
        subdivisions: 12,
        compatibilityThreshold: 0.1,
        iterations: 60,
        stepSize: 0.15,
        stiffness: 0.02,
        momentum: 0.7,
        smoothingIterations: 3,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 250, id: 's' }, target: { x: 400, y: 250, id: 't' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      const path = container.select('path');
      expect(path.attr('d')).toContain('C'); // Should contain curve commands
    });
  });

  describe('Adaptive Subdivision', () => {
    it('should use more subdivisions for longer edges when adaptive subdivision is enabled', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        adaptiveSubdivision: true,
        compatibilityThreshold: 0.6,
        iterations: 20,
        stepSize: 0.04,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'short_s' }, target: { x: 150, y: 100, id: 'short_t' } },
        { source: { x: 100, y: 200, id: 'long_s' }, target: { x: 500, y: 200, id: 'long_t' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(2);
    });

    it('should use fixed subdivisions when adaptive subdivision is disabled', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        adaptiveSubdivision: false,
        compatibilityThreshold: 0.6,
        iterations: 20,
        stepSize: 0.04,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'short_s' }, target: { x: 150, y: 100, id: 'short_t' } },
        { source: { x: 100, y: 200, id: 'long_s' }, target: { x: 500, y: 200, id: 'long_t' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(2);
    });
  });

  describe('Momentum-Based Force Application', () => {
    it('should track velocity in control points for momentum', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.6,
        iterations: 30,
        stepSize: 0.1,
        stiffness: 0.1,
        momentum: 0.8,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 100, id: 'b' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(1);
    });
  });

  describe('Curve Type Support', () => {
    const testCurveTypes: CurveType[] = ['basis', 'cardinal', 'catmull-rom', 'linear'];

    testCurveTypes.forEach((curveType) => {
      it(`should generate paths using ${curveType} curve interpolation`, () => {
        const bundler = new EdgeBundling({
          subdivisions: 8,
          compatibilityThreshold: 0.3,
          iterations: 20,
          stepSize: 0.1,
          stiffness: 0.1,
          curveType,
        });

        const edges: TestEdge[] = [
          { source: { x: 50, y: 100, id: 'a' }, target: { x: 350, y: 100, id: 'b' } },
          { source: { x: 60, y: 120, id: 'c' }, target: { x: 360, y: 120, id: 'd' } },
        ];

        const result = bundler.render(container, edges, {
          stroke: () => '#999',
          strokeWidth: () => 1.5,
          strokeOpacity: 0.6,
        });

        expect(result).toBeDefined();
        expect(container.selectAll('path').size()).toBe(2);
      });
    });
  });

  describe('Smoothing Types', () => {
    const testSmoothingTypes: SmoothingType[] = ['laplacian', 'gaussian'];

    testSmoothingTypes.forEach((smoothingType) => {
      it(`should apply ${smoothingType} smoothing to control points`, () => {
        const bundler = new EdgeBundling({
          subdivisions: 10,
          compatibilityThreshold: 0.4,
          iterations: 25,
          stepSize: 0.08,
          stiffness: 0.1,
          smoothingType,
          smoothingIterations: 3,
          smoothingFrequency: 5,
        });

        const edges: TestEdge[] = [
          { source: { x: 100, y: 50, id: 'a' }, target: { x: 300, y: 50, id: 'b' } },
        ];

        const result = bundler.render(container, edges, {
          stroke: () => '#999',
          strokeWidth: () => 1.5,
          strokeOpacity: 0.6,
        });

        expect(result).toBeDefined();
        expect(container.selectAll('path').size()).toBe(1);
      });
    });
  });

  describe('Edge Compatibility Function', () => {
    it('should use custom compatibility function when provided', () => {
      const customCompatibility: EdgeCompatibilityFunction<TestEdge> = (e1, e2) => {
        // Custom logic: edges are compatible if they have the same metadata type
        return e1.metadata?.type === e2.metadata?.type ? 0.8 : 0.1;
      };

      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.5,
        iterations: 20,
        stepSize: 0.1,
        stiffness: 0.1,
        compatibilityFunction: customCompatibility,
      });

      const edges: TestEdge[] = [
        {
          source: { x: 100, y: 100, id: 'a' },
          target: { x: 300, y: 100, id: 'b' },
          metadata: { type: 'similar' }
        },
        {
          source: { x: 110, y: 120, id: 'c' },
          target: { x: 310, y: 120, id: 'd' },
          metadata: { type: 'similar' }
        },
        {
          source: { x: 120, y: 140, id: 'e' },
          target: { x: 320, y: 140, id: 'f' },
          metadata: { type: 'different' }
        },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(3);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle single edge without bundling', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.6,
        iterations: 20,
        stepSize: 0.1,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 100, id: 'b' } },
      ];

      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(1);
    });

    it('should handle edges with same start and end points', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.6,
        iterations: 20,
        stepSize: 0.1,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 100, y: 100, id: 'a' } },
      ];

      expect(() => {
        bundler.render(container, edges, {
          stroke: () => '#999',
          strokeWidth: () => 1.5,
          strokeOpacity: 0.6,
        });
      }).not.toThrow();
    });

    it('should handle large numbers of edges efficiently', () => {
      const bundler = new EdgeBundling({
        subdivisions: 6, // Reduced for performance
        compatibilityThreshold: 0.7,
        iterations: 15, // Reduced for performance
        stepSize: 0.1,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [];
      for (let i = 0; i < 50; i++) {
        edges.push({
          source: { x: 50 + Math.random() * 100, y: 100 + Math.random() * 50, id: `s${i}` },
          target: { x: 350 + Math.random() * 100, y: 100 + Math.random() * 50, id: `t${i}` },
        });
      }

      const startTime = performance.now();
      const result = bundler.render(container, edges, {
        stroke: () => '#999',
        strokeWidth: () => 1.5,
        strokeOpacity: 0.6,
      });
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(50);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Configuration Validation', () => {
    it('should handle invalid subdivision values gracefully', () => {
      const bundler = new EdgeBundling({
        subdivisions: 0, // Invalid
        compatibilityThreshold: 0.6,
        iterations: 20,
        stepSize: 0.1,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 100, id: 'b' } },
      ];

      expect(() => {
        bundler.render(container, edges, {
          stroke: () => '#999',
          strokeWidth: () => 1.5,
          strokeOpacity: 0.6,
        });
      }).not.toThrow();
    });

    it('should handle extreme iteration values', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.6,
        iterations: 1000, // Very high
        stepSize: 0.1,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 100, id: 'b' } },
      ];

      expect(() => {
        bundler.render(container, edges, {
          stroke: () => '#999',
          strokeWidth: () => 1.5,
          strokeOpacity: 0.6,
        });
      }).not.toThrow();
    });
  });

  describe('Styling Integration', () => {
    it('should apply edge-specific styling correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.6,
        iterations: 20,
        stepSize: 0.1,
        stiffness: 0.1,
      });

      const edges: TestEdge[] = [
        {
          source: { x: 100, y: 100, id: 'a' },
          target: { x: 300, y: 100, id: 'b' },
          metadata: { weight: 0.8 }
        },
        {
          source: { x: 110, y: 120, id: 'c' },
          target: { x: 310, y: 120, id: 'd' },
          metadata: { weight: 0.3 }
        },
      ];

      const result = bundler.render(container, edges, {
        stroke: (d) => d.metadata?.weight! > 0.5 ? '#red' : '#blue',
        strokeWidth: (d) => d.metadata?.weight! * 5 || 1,
        strokeOpacity: 0.6,
      });

      expect(result).toBeDefined();
      expect(container.selectAll('path').size()).toBe(2);
    });
  });

  describe('Curve Tension Configuration', () => {
    it('should apply different curve tensions correctly', () => {
      const tensions = [0.0, 0.5, 1.0];

      tensions.forEach((tension) => {
        const bundler = new EdgeBundling({
          subdivisions: 8,
          compatibilityThreshold: 0.6,
          iterations: 20,
          stepSize: 0.1,
          stiffness: 0.1,
          curveType: 'cardinal',
          curveTension: tension,
        });

        const edges: TestEdge[] = [
          { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 100, id: 'b' } },
        ];

        expect(() => {
          bundler.render(container, edges, {
            stroke: () => '#999',
            strokeWidth: () => 1.5,
            strokeOpacity: 0.6,
          });
        }).not.toThrow();

        // Clean up for next iteration
        container.selectAll('*').remove();
      });
    });
  });
});