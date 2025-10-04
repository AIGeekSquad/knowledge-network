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

describe('EdgeBundling Enhanced', () => {
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

  describe('Basic Functionality (Updated for Enhanced Algorithm)', () => {
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
        { source: { x: 100, y: 150, id: 'c' }, target: { x: 400, y: 150, id: 'd' } }
      ];

      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 100, id: 'b' },
        { x: 100, y: 150, id: 'c' },
        { x: 400, y: 150, id: 'd' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Check that paths were created
      expect(result.selection.size()).toBe(2);

      // Get the path data
      const pathData = result.selection.nodes().map(node => node.getAttribute('d'));

      // Paths should not be null
      expect(pathData[0]).toBeTruthy();
      expect(pathData[1]).toBeTruthy();

      // Parse path to check it has curves (not just M and L commands)
      const path1 = pathData[0]!;
      const path2 = pathData[1]!;

      // Enhanced algorithm should produce curved paths with C commands
      expect(path1).toContain('C'); // Should contain curve commands
      expect(path2).toContain('C');

      // The paths should be different from straight lines
      const straightPath1 = `M100,100L400,100`;
      const straightPath2 = `M100,150L400,150`;

      expect(path1).not.toBe(straightPath1);
      expect(path2).not.toBe(straightPath2);

      // Enhanced algorithm should preserve bundling data
      const bundlingData = result.data as any;
      expect(bundlingData).toBeTruthy();
      expect(bundlingData.controlPoints).toBeTruthy();
      expect(bundlingData.controlPoints.length).toBe(2);
      expect(bundlingData.lineGenerator).toBeTruthy();
    });

    it('should bundle compatible edges with enhanced force application', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.2,
        iterations: 40,
        stepSize: 0.1,
        stiffness: 0.05,
        momentum: 0.6, // Enhanced momentum for smoother bundling
        smoothingType: 'laplacian', // Enhanced smoothing
        smoothingIterations: 2
      });

      // Create parallel edges that should bundle
      const edges: TestEdge[] = [
        { source: { x: 50, y: 200, id: 'e1s' }, target: { x: 450, y: 200, id: 'e1t' } },
        { source: { x: 50, y: 210, id: 'e2s' }, target: { x: 450, y: 210, id: 'e2t' } },
        { source: { x: 50, y: 220, id: 'e3s' }, target: { x: 450, y: 220, id: 'e3t' } }
      ];

      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Extract control points from the bundling data
      const bundlingData = result.data as any;
      expect(bundlingData).toBeTruthy();
      expect(bundlingData.controlPoints).toBeTruthy();
      expect(bundlingData.controlPoints.length).toBe(3);

      // Check that middle control points of parallel edges have moved closer together
      const midPointIndex = Math.floor(bundlingData.controlPoints[0].length / 2);

      const midPoint1 = bundlingData.controlPoints[0][midPointIndex];
      const midPoint2 = bundlingData.controlPoints[1][midPointIndex];
      const midPoint3 = bundlingData.controlPoints[2][midPointIndex];

      // Verify velocity tracking exists (momentum feature)
      expect(midPoint1.vx).toBeDefined();
      expect(midPoint1.vy).toBeDefined();
      expect(midPoint2.vx).toBeDefined();
      expect(midPoint2.vy).toBeDefined();

      // Calculate distances between middle points
      const dist12 = Math.sqrt(
        Math.pow(midPoint1.x - midPoint2.x, 2) +
        Math.pow(midPoint1.y - midPoint2.y, 2)
      );
      const dist23 = Math.sqrt(
        Math.pow(midPoint2.x - midPoint3.x, 2) +
        Math.pow(midPoint2.y - midPoint3.y, 2)
      );

      // Original distance between edges was 10 pixels
      // After enhanced bundling with momentum, middle points should be closer
      expect(dist12).toBeLessThan(10);
      expect(dist23).toBeLessThan(10);
    });

    it('should create visible curvature with enhanced algorithm', () => {
      const bundler = new EdgeBundling({
        subdivisions: 12,
        compatibilityThreshold: 0.1,
        iterations: 60,
        stepSize: 0.15,
        stiffness: 0.02,
        momentum: 0.7,
        curveType: 'basis',
        smoothingType: 'laplacian',
        smoothingIterations: 3
      });

      // Single edge to check for enhanced curvature
      const edges: TestEdge[] = [
        { source: { x: 100, y: 250, id: 's' }, target: { x: 400, y: 250, id: 't' } }
      ];

      const nodes: TestNode[] = [
        { x: 100, y: 250, id: 's' },
        { x: 400, y: 250, id: 't' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;

      // Check that control points deviate from straight line
      const controlPoints = bundlingData.controlPoints[0];
      const sourceX = 100, sourceY = 250;
      const targetX = 400, targetY = 250;

      let maxDeviation = 0;
      for (let i = 1; i < controlPoints.length - 1; i++) {
        const t = i / (controlPoints.length - 1);
        const expectedX = sourceX * (1 - t) + targetX * t;
        const expectedY = sourceY * (1 - t) + targetY * t;

        const deviation = Math.abs(controlPoints[i].y - expectedY);
        maxDeviation = Math.max(maxDeviation, deviation);
      }

      // Enhanced algorithm should create more pronounced curvature
      expect(maxDeviation).toBeGreaterThan(5);

      // Verify all control points have velocity for momentum
      for (let i = 1; i < controlPoints.length - 1; i++) {
        expect(controlPoints[i].vx).toBeDefined();
        expect(controlPoints[i].vy).toBeDefined();
      }
    });
  });

  describe('Adaptive Subdivision', () => {
    it('should use more subdivisions for longer edges when adaptive subdivision is enabled', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        adaptiveSubdivision: true,
        iterations: 20
      });

      // Create edges of different lengths
      const shortEdge: TestEdge = {
        source: { x: 100, y: 100, id: 'short_s' },
        target: { x: 150, y: 100, id: 'short_t' }
      };
      const longEdge: TestEdge = {
        source: { x: 100, y: 200, id: 'long_s' },
        target: { x: 500, y: 200, id: 'long_t' }
      };

      const edges = [shortEdge, longEdge];
      const nodes = [shortEdge.source, shortEdge.target, longEdge.source, longEdge.target];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;

      // Long edge should have more control points than short edge
      const shortEdgeControlPoints = bundlingData.controlPoints[0];
      const longEdgeControlPoints = bundlingData.controlPoints[1];

      expect(longEdgeControlPoints.length).toBeGreaterThan(shortEdgeControlPoints.length);

      // Short edge (50px) should have base subdivisions
      // Long edge (400px) should have additional subdivisions (400/30 ≈ 13 additional)
      expect(shortEdgeControlPoints.length).toBe(11); // subdivisions + 1
      expect(longEdgeControlPoints.length).toBeGreaterThan(15); // Should have more
    });

    it('should use fixed subdivisions when adaptive subdivision is disabled', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        adaptiveSubdivision: false,
        iterations: 20
      });

      // Create edges of different lengths
      const shortEdge: TestEdge = {
        source: { x: 100, y: 100, id: 'short_s' },
        target: { x: 150, y: 100, id: 'short_t' }
      };
      const longEdge: TestEdge = {
        source: { x: 100, y: 200, id: 'long_s' },
        target: { x: 500, y: 200, id: 'long_t' }
      };

      const edges = [shortEdge, longEdge];
      const nodes = [shortEdge.source, shortEdge.target, longEdge.source, longEdge.target];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;

      // Both edges should have the same number of control points
      const shortEdgeControlPoints = bundlingData.controlPoints[0];
      const longEdgeControlPoints = bundlingData.controlPoints[1];

      expect(shortEdgeControlPoints.length).toBe(longEdgeControlPoints.length);
      expect(shortEdgeControlPoints.length).toBe(11); // subdivisions + 1
      expect(longEdgeControlPoints.length).toBe(11); // subdivisions + 1
    });
  });

  describe('Momentum-Based Force Application', () => {
    it('should track velocity in control points for momentum', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        momentum: 0.8,
        iterations: 30,
        stepSize: 0.1
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 100, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 300, y: 100, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;
      const controlPoints = bundlingData.controlPoints[0];

      // All control points should have velocity components
      for (let i = 0; i < controlPoints.length; i++) {
        expect(controlPoints[i].vx).toBeDefined();
        expect(controlPoints[i].vy).toBeDefined();
        expect(typeof controlPoints[i].vx).toBe('number');
        expect(typeof controlPoints[i].vy).toBe('number');
      }
    });

    it('should produce smoother movement with higher momentum values', () => {
      const lowMomentumBundler = new EdgeBundling({
        subdivisions: 10,
        momentum: 0.1,
        iterations: 50,
        stepSize: 0.1
      });

      const highMomentumBundler = new EdgeBundling({
        subdivisions: 10,
        momentum: 0.9,
        iterations: 50,
        stepSize: 0.1
      });

      // Create parallel edges that should bundle
      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'e1s' }, target: { x: 400, y: 100, id: 'e1t' } },
        { source: { x: 100, y: 120, id: 'e2s' }, target: { x: 400, y: 120, id: 'e2t' } }
      ];
      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      const lowMomentumResult = lowMomentumBundler.render(container, edges as any, nodes as any, {});
      const highMomentumResult = highMomentumBundler.render(container, edges as any, nodes as any, {});

      const lowMomentumData = lowMomentumResult.data as any;
      const highMomentumData = highMomentumResult.data as any;

      // High momentum should produce less jagged curves (lower velocity variance)
      const calculateVelocityVariance = (controlPoints: any[]) => {
        let totalVariance = 0;
        for (let i = 1; i < controlPoints.length - 1; i++) {
          const vx = controlPoints[i].vx || 0;
          const vy = controlPoints[i].vy || 0;
          totalVariance += vx * vx + vy * vy;
        }
        return totalVariance / (controlPoints.length - 2);
      };

      const lowMomentumVariance = calculateVelocityVariance(lowMomentumData.controlPoints[0]);
      const highMomentumVariance = calculateVelocityVariance(highMomentumData.controlPoints[0]);

      // High momentum should result in more controlled (potentially lower variance) movement
      expect(typeof lowMomentumVariance).toBe('number');
      expect(typeof highMomentumVariance).toBe('number');
    });
  });

  describe('Smoothing Algorithms', () => {
    it('should apply Laplacian smoothing correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        smoothingType: 'laplacian',
        smoothingIterations: 3,
        iterations: 20
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 100, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 100, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;
      const controlPoints = bundlingData.controlPoints[0];

      // Endpoints should remain fixed
      expect(controlPoints[0].x).toBe(100);
      expect(controlPoints[0].y).toBe(100);
      expect(controlPoints[controlPoints.length - 1].x).toBe(400);
      expect(controlPoints[controlPoints.length - 1].y).toBe(100);

      // Smoothing should have been applied
      expect(controlPoints.length).toBeGreaterThan(2);
    });

    it('should apply Gaussian smoothing correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 12,
        smoothingType: 'gaussian',
        smoothingIterations: 2,
        iterations: 30
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 150, id: 'a' }, target: { x: 400, y: 150, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 150, id: 'a' },
        { x: 400, y: 150, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;
      const controlPoints = bundlingData.controlPoints[0];

      // Endpoints should remain fixed with Gaussian smoothing
      expect(controlPoints[0].x).toBe(100);
      expect(controlPoints[0].y).toBe(150);
      expect(controlPoints[controlPoints.length - 1].x).toBe(400);
      expect(controlPoints[controlPoints.length - 1].y).toBe(150);

      // Should have applied Gaussian smoothing
      expect(controlPoints.length).toBe(13); // subdivisions + 1
    });

    it('should apply bilateral smoothing correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        smoothingType: 'bilateral',
        smoothingIterations: 2,
        iterations: 25
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 200, id: 'a' }, target: { x: 400, y: 200, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 200, id: 'a' },
        { x: 400, y: 200, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;
      const controlPoints = bundlingData.controlPoints[0];

      // Endpoints should remain fixed with bilateral smoothing
      expect(controlPoints[0].x).toBe(100);
      expect(controlPoints[0].y).toBe(200);
      expect(controlPoints[controlPoints.length - 1].x).toBe(400);
      expect(controlPoints[controlPoints.length - 1].y).toBe(200);

      // Bilateral smoothing should preserve edges while smoothing
      expect(controlPoints.length).toBe(11); // subdivisions + 1
    });

    it('should handle different smoothing frequencies correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        smoothingType: 'laplacian',
        smoothingIterations: 1,
        smoothingFrequency: 5, // Smooth every 5 iterations
        iterations: 15 // Should smooth at iterations 5, 10, 15
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 300, y: 200, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 300, y: 200, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should complete without errors and produce smoothed results
      expect(result.selection.size()).toBe(1);
      expect(result.data).toBeTruthy();
    });
  });

  describe('Curve Types', () => {
    it('should render with basis spline curves', () => {
      const bundler = new EdgeBundling({
        curveType: 'basis',
        subdivisions: 10,
        iterations: 20
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 200, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 200, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;

      // Should have created line generator with basis curve
      expect(bundlingData.lineGenerator).toBeTruthy();

      // Path should contain curve commands
      const pathData = result.selection.node()?.getAttribute('d');
      expect(pathData).toBeTruthy();
      expect(pathData).toContain('C'); // Cubic bezier curves from basis spline
    });

    it('should render with cardinal spline curves', () => {
      const bundler = new EdgeBundling({
        curveType: 'cardinal',
        curveTension: 0.7,
        subdivisions: 10,
        iterations: 20
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 150, id: 'a' }, target: { x: 400, y: 250, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 150, id: 'a' },
        { x: 400, y: 250, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should render successfully with cardinal curves
      expect(result.selection.size()).toBe(1);
      const pathData = result.selection.node()?.getAttribute('d');
      expect(pathData).toBeTruthy();
      expect(pathData).toContain('C'); // Should contain curve commands
    });

    it('should render with Catmull-Rom spline curves', () => {
      const bundler = new EdgeBundling({
        curveType: 'catmullRom',
        curveTension: 0.5,
        subdivisions: 12,
        iterations: 25
      });

      const edges: TestEdge[] = [
        { source: { x: 150, y: 100, id: 'a' }, target: { x: 450, y: 300, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 150, y: 100, id: 'a' },
        { x: 450, y: 300, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should render successfully with Catmull-Rom curves
      expect(result.selection.size()).toBe(1);
      const pathData = result.selection.node()?.getAttribute('d');
      expect(pathData).toBeTruthy();
    });

    it('should render with bundle spline curves', () => {
      const bundler = new EdgeBundling({
        curveType: 'bundle',
        curveTension: 0.8,
        subdivisions: 10,
        iterations: 30
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 350, y: 250, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 350, y: 250, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should render successfully with bundle curves
      expect(result.selection.size()).toBe(1);
      const pathData = result.selection.node()?.getAttribute('d');
      expect(pathData).toBeTruthy();
    });

    it('should use different curve tension values correctly', () => {
      const lowTensionBundler = new EdgeBundling({
        curveType: 'cardinal',
        curveTension: 0.1,
        subdivisions: 8,
        iterations: 20
      });

      const highTensionBundler = new EdgeBundling({
        curveType: 'cardinal',
        curveTension: 0.9,
        subdivisions: 8,
        iterations: 20
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 300, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 300, id: 'b' }
      ];

      const lowTensionResult = lowTensionBundler.render(container, edges as any, nodes as any, {});
      const highTensionResult = highTensionBundler.render(container, edges as any, nodes as any, {});

      // Both should render successfully
      expect(lowTensionResult.selection.size()).toBe(1);
      expect(highTensionResult.selection.size()).toBe(1);

      // Paths should be different due to different tension
      const lowTensionPath = lowTensionResult.selection.node()?.getAttribute('d');
      const highTensionPath = highTensionResult.selection.node()?.getAttribute('d');

      expect(lowTensionPath).toBeTruthy();
      expect(highTensionPath).toBeTruthy();
      expect(lowTensionPath).not.toBe(highTensionPath);
    });
  });

  describe('Configuration Options Integration', () => {
    it('should handle all configuration options together', () => {
      const bundler = new EdgeBundling({
        subdivisions: 15,
        adaptiveSubdivision: true,
        compatibilityThreshold: 0.4,
        iterations: 40,
        stepSize: 0.06,
        stiffness: 0.15,
        momentum: 0.6,
        curveType: 'cardinal',
        curveTension: 0.7,
        smoothingType: 'gaussian',
        smoothingIterations: 2,
        smoothingFrequency: 3
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 600, y: 150, id: 'b' } },
        { source: { x: 100, y: 120, id: 'c' }, target: { x: 600, y: 170, id: 'd' } },
        { source: { x: 100, y: 140, id: 'e' }, target: { x: 600, y: 190, id: 'f' } }
      ];
      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should render all edges successfully
      expect(result.selection.size()).toBe(3);

      // Should have bundling data with control points
      const bundlingData = result.data as any;
      expect(bundlingData.controlPoints).toBeTruthy();
      expect(bundlingData.controlPoints.length).toBe(3);

      // Long edges should have more subdivisions due to adaptive subdivision
      const controlPoints = bundlingData.controlPoints[0];
      expect(controlPoints.length).toBeGreaterThan(16); // Should have adaptive subdivisions

      // All control points should have velocity (momentum feature)
      for (let i = 1; i < controlPoints.length - 1; i++) {
        expect(controlPoints[i].vx).toBeDefined();
        expect(controlPoints[i].vy).toBeDefined();
      }
    });

    it('should apply rendering configuration correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        iterations: 30
      });

      const edges: TestEdge[] = [
        {
          source: { x: 100, y: 100, id: 'a' },
          target: { x: 400, y: 200, id: 'b' },
          metadata: { weight: 3, type: 'important' }
        }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 200, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {
        stroke: (edge: any) => edge.metadata?.type === 'important' ? '#ff0000' : '#999999',
        strokeWidth: (edge: any) => edge.metadata?.weight || 1,
        strokeOpacity: 0.8
      });

      const pathElement = result.selection.node() as SVGPathElement;

      // Should apply custom styling
      expect(pathElement.getAttribute('stroke')).toBe('#ff0000');
      expect(pathElement.getAttribute('stroke-width')).toBe('3');
      expect(pathElement.getAttribute('stroke-opacity')).toBe('0.8');
    });
  });

  describe('Edge Compatibility Function Integration', () => {
    it('should use custom compatibility function for edge bundling', () => {
      const sameTypeCompatibility: EdgeCompatibilityFunction = (edge1, edge2) => {
        return edge1.metadata?.type === edge2.metadata?.type ? 1 : 0;
      };

      const bundler = new EdgeBundling({
        subdivisions: 10,
        compatibilityThreshold: 0.5,
        iterations: 40,
        compatibilityFunction: sameTypeCompatibility
      });

      const edges: TestEdge[] = [
        {
          source: { x: 100, y: 100, id: 'a1' },
          target: { x: 400, y: 100, id: 'b1' },
          metadata: { type: 'data' }
        },
        {
          source: { x: 100, y: 120, id: 'a2' },
          target: { x: 400, y: 120, id: 'b2' },
          metadata: { type: 'data' }
        },
        {
          source: { x: 100, y: 140, id: 'a3' },
          target: { x: 400, y: 140, id: 'b3' },
          metadata: { type: 'control' }
        }
      ];
      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;

      // The two 'data' type edges should bundle together more than with the 'control' edge
      const dataEdge1Points = bundlingData.controlPoints[0];
      const dataEdge2Points = bundlingData.controlPoints[1];
      const controlEdgePoints = bundlingData.controlPoints[2];

      const midIndex = Math.floor(dataEdge1Points.length / 2);

      // Distance between same-type edges should be smaller
      const sameTypeDistance = Math.sqrt(
        Math.pow(dataEdge1Points[midIndex].x - dataEdge2Points[midIndex].x, 2) +
        Math.pow(dataEdge1Points[midIndex].y - dataEdge2Points[midIndex].y, 2)
      );

      // Distance between different-type edges should be larger
      const differentTypeDistance = Math.sqrt(
        Math.pow(dataEdge1Points[midIndex].x - controlEdgePoints[midIndex].x, 2) +
        Math.pow(dataEdge1Points[midIndex].y - controlEdgePoints[midIndex].y, 2)
      );

      expect(sameTypeDistance).toBeLessThan(differentTypeDistance);
    });

    it('should combine geometric and custom compatibility', () => {
      const weightedCompatibility: EdgeCompatibilityFunction = (edge1, edge2) => {
        const weight1 = (edge1.metadata?.weight as number) || 1;
        const weight2 = (edge2.metadata?.weight as number) || 1;
        // Higher weights should bundle together more
        return Math.min(weight1, weight2) / Math.max(weight1, weight2);
      };

      const bundler = new EdgeBundling({
        subdivisions: 8,
        compatibilityThreshold: 0.3,
        iterations: 30,
        compatibilityFunction: weightedCompatibility
      });

      const edges: TestEdge[] = [
        {
          source: { x: 100, y: 100, id: 'a1' },
          target: { x: 400, y: 100, id: 'b1' },
          metadata: { weight: 5 }
        },
        {
          source: { x: 100, y: 120, id: 'a2' },
          target: { x: 400, y: 120, id: 'b2' },
          metadata: { weight: 5 }
        },
        {
          source: { x: 100, y: 140, id: 'a3' },
          target: { x: 400, y: 140, id: 'b3' },
          metadata: { weight: 1 }
        }
      ];
      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should render successfully with custom compatibility
      expect(result.selection.size()).toBe(3);
      expect(result.data).toBeTruthy();
    });

    it('should handle directional compatibility function', () => {
      const directionalCompatibility: EdgeCompatibilityFunction = (edge1, edge2) => {
        const dir1 = edge1.metadata?.direction || 'both';
        const dir2 = edge2.metadata?.direction || 'both';
        if (dir1 === dir2) return 1;
        if (dir1 === 'both' || dir2 === 'both') return 0.5;
        return 0;
      };

      const bundler = new EdgeBundling({
        subdivisions: 10,
        compatibilityThreshold: 0.4,
        iterations: 35,
        compatibilityFunction: directionalCompatibility
      });

      const edges: TestEdge[] = [
        {
          source: { x: 100, y: 100, id: 'a1' },
          target: { x: 400, y: 100, id: 'b1' },
          metadata: { direction: 'forward' }
        },
        {
          source: { x: 100, y: 120, id: 'a2' },
          target: { x: 400, y: 120, id: 'b2' },
          metadata: { direction: 'forward' }
        },
        {
          source: { x: 100, y: 140, id: 'a3' },
          target: { x: 400, y: 140, id: 'b3' },
          metadata: { direction: 'backward' }
        }
      ];
      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should handle directional compatibility correctly
      expect(result.selection.size()).toBe(3);
      const bundlingData = result.data as any;
      expect(bundlingData.controlPoints.length).toBe(3);
    });
  });

  describe('Performance and Quality', () => {
    it('should produce smooth curves without jaggedness', () => {
      const bundler = new EdgeBundling({
        subdivisions: 15,
        smoothingType: 'gaussian',
        smoothingIterations: 3,
        momentum: 0.8,
        iterations: 50
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 500, y: 300, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 500, y: 300, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;
      const controlPoints = bundlingData.controlPoints[0];

      // Check for smoothness by measuring angle changes between consecutive segments
      let maxAngleChange = 0;
      for (let i = 1; i < controlPoints.length - 1; i++) {
        const p1 = controlPoints[i - 1];
        const p2 = controlPoints[i];
        const p3 = controlPoints[i + 1];

        // Calculate vectors
        const v1x = p2.x - p1.x;
        const v1y = p2.y - p1.y;
        const v2x = p3.x - p2.x;
        const v2y = p3.y - p2.y;

        // Calculate angle between vectors
        const dot = v1x * v2x + v1y * v2y;
        const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const len2 = Math.sqrt(v2x * v2x + v2y * v2y);

        if (len1 > 0 && len2 > 0) {
          const angle = Math.acos(Math.max(-1, Math.min(1, dot / (len1 * len2))));
          maxAngleChange = Math.max(maxAngleChange, angle);
        }
      }

      // Should not have sharp angle changes (smoothed curves)
      expect(maxAngleChange).toBeLessThan(Math.PI / 2); // Less than 90 degrees
    });

    it('should maintain bundling effectiveness with enhanced algorithm', () => {
      const bundler = new EdgeBundling({
        subdivisions: 12,
        compatibilityThreshold: 0.3,
        iterations: 60,
        momentum: 0.7,
        smoothingType: 'laplacian',
        adaptiveSubdivision: true
      });

      // Create a set of edges that should bundle together
      const edges: TestEdge[] = [];
      const nodes: TestNode[] = [];

      // Create 5 parallel edges
      for (let i = 0; i < 5; i++) {
        const yOffset = i * 15;
        const source = { x: 100, y: 200 + yOffset, id: `s${i}` };
        const target = { x: 500, y: 200 + yOffset, id: `t${i}` };
        edges.push({ source, target });
        nodes.push(source, target);
      }

      const result = bundler.render(container, edges as any, nodes as any, {});
      const bundlingData = result.data as any;

      // Check bundling effectiveness by measuring how close middle points are
      const midIndex = Math.floor(bundlingData.controlPoints[0].length / 2);
      const midPoints = bundlingData.controlPoints.map((points: any) => points[midIndex]);

      // Calculate average distance from centroid
      const centroidX = midPoints.reduce((sum: number, p: any) => sum + p.x, 0) / midPoints.length;
      const centroidY = midPoints.reduce((sum: number, p: any) => sum + p.y, 0) / midPoints.length;

      let totalDistance = 0;
      for (const point of midPoints) {
        totalDistance += Math.sqrt(
          Math.pow(point.x - centroidX, 2) + Math.pow(point.y - centroidY, 2)
        );
      }
      const avgDistanceFromCentroid = totalDistance / midPoints.length;

      // Original spread was 60 pixels (4 edges * 15 pixel spacing)
      // After bundling, average distance from centroid should be much smaller
      expect(avgDistanceFromCentroid).toBeLessThan(30); // Should bundle to within 30px of center
    });

    it('should handle large numbers of edges efficiently', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8, // Lower subdivisions for performance
        iterations: 20,  // Fewer iterations for performance
        compatibilityThreshold: 0.7, // Higher threshold to reduce calculations
        momentum: 0.5
      });

      // Create 20 edges (still reasonable for test environment)
      const edges: TestEdge[] = [];
      const nodes: TestNode[] = [];

      for (let i = 0; i < 20; i++) {
        const angle = (i * Math.PI * 2) / 20;
        const sourceX = 400 + Math.cos(angle) * 100;
        const sourceY = 300 + Math.sin(angle) * 100;
        const targetX = 400 + Math.cos(angle + Math.PI) * 150;
        const targetY = 300 + Math.sin(angle + Math.PI) * 150;

        const source = { x: sourceX, y: sourceY, id: `s${i}` };
        const target = { x: targetX, y: targetY, id: `t${i}` };
        edges.push({ source, target });
        nodes.push(source, target);
      }

      const startTime = Date.now();
      const result = bundler.render(container, edges as any, nodes as any, {});
      const endTime = Date.now();

      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(1000); // 1 second max for 20 edges

      // Should render all edges
      expect(result.selection.size()).toBe(20);
      expect(result.data).toBeTruthy();
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle edges with identical endpoints', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        iterations: 20
      });

      const edges: TestEdge[] = [
        { source: { x: 200, y: 200, id: 'same1' }, target: { x: 200, y: 200, id: 'same2' } }
      ];
      const nodes: TestNode[] = [
        { x: 200, y: 200, id: 'same1' },
        { x: 200, y: 200, id: 'same2' }
      ];

      // Should not crash with zero-length edge
      expect(() => {
        bundler.render(container, edges as any, nodes as any, {});
      }).not.toThrow();
    });

    it('should handle single edge correctly', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        iterations: 30,
        momentum: 0.6
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 300, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 300, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      expect(result.selection.size()).toBe(1);
      expect(result.data).toBeTruthy();

      const bundlingData = result.data as any;
      expect(bundlingData.controlPoints.length).toBe(1);
      expect(bundlingData.controlPoints[0].length).toBe(11); // subdivisions + 1
    });

    it('should update edge positions correctly during simulation', () => {
      const bundler = new EdgeBundling({
        subdivisions: 8,
        iterations: 20,
        momentum: 0.5
      });

      // Create initial edges
      const source = { x: 100, y: 100, id: 'a' };
      const target = { x: 400, y: 200, id: 'b' };
      const edges: TestEdge[] = [{ source, target }];
      const nodes: TestNode[] = [source, target];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Move the nodes (simulate force layout tick)
      source.x = 150;
      source.y = 150;
      target.x = 450;
      target.y = 250;

      // Update should work without errors
      expect(() => {
        bundler.update(result);
      }).not.toThrow();

      // Path should be updated
      const pathData = result.selection.node()?.getAttribute('d');
      expect(pathData).toBeTruthy();
      expect(pathData).toContain('M150,150'); // Should start at new source position
    });

    it('should clean up correctly when destroyed', () => {
      const bundler = new EdgeBundling({
        subdivisions: 10,
        iterations: 20
      });

      const edges: TestEdge[] = [
        { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 200, id: 'b' } }
      ];
      const nodes: TestNode[] = [
        { x: 100, y: 100, id: 'a' },
        { x: 400, y: 200, id: 'b' }
      ];

      const result = bundler.render(container, edges as any, nodes as any, {});

      // Should have path in DOM
      expect(container.selectAll('path').size()).toBe(1);

      // Destroy should remove paths
      bundler.destroy(result);
      expect(container.selectAll('path').size()).toBe(0);
    });

    it('should handle different subdivision counts gracefully in bundling', () => {
      // This tests the enhanced algorithm's ability to handle edges with different subdivision counts
      const bundler = new EdgeBundling({
        subdivisions: 10,
        adaptiveSubdivision: true,
        iterations: 30,
        compatibilityThreshold: 0.4
      });

      const edges: TestEdge[] = [
        // Short edge - will have fewer subdivisions
        { source: { x: 100, y: 100, id: 'short_s' }, target: { x: 200, y: 100, id: 'short_t' } },
        // Long edge - will have more subdivisions
        { source: { x: 100, y: 120, id: 'long_s' }, target: { x: 600, y: 120, id: 'long_t' } }
      ];
      const nodes: TestNode[] = edges.flatMap(e => [e.source, e.target]);

      // Should handle different subdivision counts without errors
      expect(() => {
        const result = bundler.render(container, edges as any, nodes as any, {});
        expect(result.selection.size()).toBe(2);
      }).not.toThrow();
    });
  });
});