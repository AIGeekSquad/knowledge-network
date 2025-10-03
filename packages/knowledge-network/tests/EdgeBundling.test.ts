import { describe, it, expect, beforeEach } from 'vitest';
import { EdgeBundling } from '../src/edges/EdgeBundling';
import * as d3 from 'd3';
import { JSDOM } from 'jsdom';

describe('EdgeBundling', () => {
  let container: d3.Selection<SVGGElement, unknown, null, undefined>;

  beforeEach(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    global.document = dom.window.document as any;
    
    const svg = d3.select(document.body)
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);
    
    container = svg.append('g');
  });

  it('should create curved paths, not straight lines', () => {
    const bundler = new EdgeBundling({
      subdivisions: 10,
      compatibilityThreshold: 0.3,
      iterations: 50,
      stepSize: 0.1,
      stiffness: 0.1
    });

    // Create simple test edges
    const edges = [
      { source: { x: 100, y: 100, id: 'a' }, target: { x: 400, y: 100, id: 'b' } },
      { source: { x: 100, y: 150, id: 'c' }, target: { x: 400, y: 150, id: 'd' } }
    ];

    const nodes = [
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

    // A straight line would be like "M100,100L400,100"
    // A curved path should have C commands (cubic bezier)
    expect(path1).toContain('C'); // Should contain curve commands
    expect(path2).toContain('C');

    // The paths should be different from straight lines
    const straightPath1 = `M100,100L400,100`;
    const straightPath2 = `M100,150L400,150`;
    
    expect(path1).not.toBe(straightPath1);
    expect(path2).not.toBe(straightPath2);
  });

  it('should bundle compatible edges together', () => {
    const bundler = new EdgeBundling({
      subdivisions: 5,
      compatibilityThreshold: 0.2,
      iterations: 30,
      stepSize: 0.1,
      stiffness: 0.05
    });

    // Create parallel edges that should bundle
    const edges = [
      { source: { x: 50, y: 200, id: 'e1s' }, target: { x: 450, y: 200, id: 'e1t' } },
      { source: { x: 50, y: 210, id: 'e2s' }, target: { x: 450, y: 210, id: 'e2t' } },
      { source: { x: 50, y: 220, id: 'e3s' }, target: { x: 450, y: 220, id: 'e3t' } }
    ];

    const nodes = edges.flatMap(e => [e.source, e.target]);

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
    // After bundling, middle points should be closer
    expect(dist12).toBeLessThan(10);
    expect(dist23).toBeLessThan(10);
  });

  it('should create visible curvature in bundled edges', () => {
    const bundler = new EdgeBundling({
      subdivisions: 10,
      compatibilityThreshold: 0.1,
      iterations: 50,
      stepSize: 0.2,
      stiffness: 0.02
    });

    // Single edge to check for curvature
    const edges = [
      { source: { x: 100, y: 250, id: 's' }, target: { x: 400, y: 250, id: 't' } }
    ];

    const nodes = [
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
    
    // Should have at least 5 pixels of curvature
    expect(maxDeviation).toBeGreaterThan(5);
  });
});