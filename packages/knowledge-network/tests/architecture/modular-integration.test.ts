/**
 * Modular Integration Tests
 *
 * These tests verify that LayoutEngine, RenderingSystem, and ViewportManager
 * work together properly while maintaining their modular boundaries.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LayoutEngine } from '../../src/layout/LayoutEngine';
import { RenderingSystem } from '../../src/rendering/RenderingSystem';
import { ViewportManager } from '../../src/viewport/ViewportManager';
import type { GraphData } from '../../src/types';

describe('Modular Integration', () => {
  let container: HTMLElement;
  let sampleData: GraphData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    sampleData = {
      nodes: [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
        { id: 'node3', label: 'Node 3' },
        { id: 'node4', label: 'Node 4' }
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' },
        { source: 'node3', target: 'node4' },
        { source: 'node4', target: 'node1' }
      ]
    };
  });

  describe('LayoutEngine Integration', () => {
    it('should integrate with RenderingSystem through standard interfaces', async () => {
      const layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600,
        chargeStrength: -300,
        linkDistance: 100
      });

      const renderingSystem = new RenderingSystem(container, {
        width: 800,
        height: 600
      });

      // Layout produces data compatible with rendering
      const layoutResult = await layoutEngine.calculateLayout(sampleData);

      // Verify layout result structure matches rendering expectations
      expect(layoutResult).toHaveProperty('nodes');
      expect(layoutResult).toHaveProperty('edges');
      expect(layoutResult).toHaveProperty('bounds');
      expect(layoutResult.nodes.every(n => 'x' in n && 'y' in n)).toBe(true);

      // Rendering system should accept layout result
      renderingSystem.initialize();
      expect(() => renderingSystem.render(layoutResult)).not.toThrow();
    });

    it('should support real-time layout updates through event system', (done) => {
      const layoutEngine = new LayoutEngine('force-directed');
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      const positionUpdates: any[] = [];

      // Listen to layout position updates
      layoutEngine.on('positions', (positions) => {
        positionUpdates.push(positions);

        // Update rendering system with new positions
        if (positions.nodes) {
          renderingSystem.updateNodePositions(positions.nodes);
        }
        if (positions.edges) {
          renderingSystem.updateEdgePositions(positions.edges);
        }
      });

      layoutEngine.on('layoutEnd', () => {
        // Should have received position updates during simulation
        expect(positionUpdates.length).toBeGreaterThan(0);
        expect(positionUpdates[0]).toHaveProperty('nodes');
        expect(positionUpdates[0]).toHaveProperty('edges');
        done();
      });

      layoutEngine.calculateLayout(sampleData);
    });

    it('should work with different layout algorithms', async () => {
      const algorithms = ['force-directed', 'circular', 'grid', 'hierarchical'] as const;
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      for (const algorithm of algorithms) {
        const layoutEngine = new LayoutEngine(algorithm, {
          width: 600,
          height: 400
        });

        const result = await layoutEngine.calculateLayout(sampleData);

        // Each algorithm should produce renderable results
        expect(result.nodes).toHaveLength(sampleData.nodes.length);
        expect(result.nodes.every(n => typeof n.x === 'number' && typeof n.y === 'number')).toBe(true);

        // Rendering system should handle all layouts
        expect(() => renderingSystem.render(result)).not.toThrow();
      }
    });
  });

  describe('RenderingSystem Integration', () => {
    it('should integrate with ViewportManager for coordinate transformations', async () => {
      const layoutEngine = new LayoutEngine('circular');
      const renderingSystem = new RenderingSystem(container);
      const viewportManager = new ViewportManager();

      // Setup complete integration
      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      const svg = container.querySelector('svg')!;
      viewportManager.setup(svg, renderingSystem);

      // ViewportManager should coordinate with RenderingSystem
      const initialTransform = viewportManager.getTransform();
      const renderingTransform = renderingSystem.getTransform();

      expect(initialTransform).toEqual(renderingTransform);

      // Transform changes should be synchronized
      const newTransform = { x: 100, y: 100, scale: 2 };
      viewportManager.setTransform(newTransform);

      expect(renderingSystem.getTransform()).toEqual(newTransform);
    });

    it('should support renderer switching without breaking integrations', async () => {
      const layoutEngine = new LayoutEngine();
      const renderingSystem = new RenderingSystem(container);
      const layoutResult = await layoutEngine.calculateLayout(sampleData);

      // Start with SVG renderer
      renderingSystem.setRenderer('svg');
      renderingSystem.render(layoutResult);

      let svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      // ViewportManager should work with SVG
      const viewportManager = new ViewportManager();
      viewportManager.setup(svg!, renderingSystem);
      viewportManager.zoomTo(1.5);

      // TODO: Test canvas and WebGL when implemented
      // For now, they should throw proper errors
      expect(() => renderingSystem.setRenderer('canvas')).toThrow('Canvas renderer not yet implemented');
      expect(() => renderingSystem.setRenderer('webgl')).toThrow('WebGL renderer not yet implemented');
    });

    it('should handle dynamic style updates across modules', async () => {
      const layoutEngine = new LayoutEngine();
      const renderingSystem = new RenderingSystem(container);

      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      // Should be able to update node styles
      const styleUpdates = [
        { nodeId: 'node1', style: { fill: '#ff0000', radius: 15 } },
        { nodeId: 'node2', style: { fill: '#00ff00', radius: 20 } }
      ];

      expect(() => renderingSystem.updateNodeStyles(styleUpdates)).not.toThrow();

      // Should be able to update edge styles
      const edgeUpdates = [
        { edgeId: 'edge-0', style: { stroke: '#ff0000', strokeWidth: 3 } }
      ];

      expect(() => renderingSystem.updateEdgeStyles(edgeUpdates)).not.toThrow();
    });
  });

  describe('ViewportManager Integration', () => {
    it('should integrate with both LayoutEngine and RenderingSystem', async () => {
      const layoutEngine = new LayoutEngine('force-directed');
      const renderingSystem = new RenderingSystem(container);
      const viewportManager = new ViewportManager();

      // Complete integration setup
      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      const svg = container.querySelector('svg')!;
      viewportManager.setup(svg, renderingSystem);

      // ViewportManager should use layout bounds for fit operations
      expect(() => viewportManager.fitToBounds(layoutResult.bounds)).not.toThrow();

      // Should be able to update node positions for viewport calculations
      const nodePositions = new Map();
      layoutResult.nodes.forEach(node => {
        nodePositions.set(node.id, { x: node.x, y: node.y });
      });

      viewportManager.updateNodePositions(nodePositions);

      // Should support fitting to specific nodes
      expect(() => viewportManager.fitToNodes(['node1', 'node2'])).not.toThrow();
    });

    it('should handle coordinate transformations correctly', async () => {
      const layoutEngine = new LayoutEngine('grid', {
        width: 400,
        height: 300,
        rows: 2,
        columns: 2
      });

      const renderingSystem = new RenderingSystem(container, {
        width: 400,
        height: 300
      });

      const viewportManager = new ViewportManager();

      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      const svg = container.querySelector('svg')!;
      viewportManager.setup(svg, renderingSystem);

      // Test coordinate conversion
      const screenPoint = { x: 200, y: 150 }; // Center of 400x300 viewport
      const graphPoint = viewportManager.screenToGraph(screenPoint);
      const backToScreen = viewportManager.graphToScreen(graphPoint);

      // Should convert back to approximately the same point
      expect(Math.abs(backToScreen.x - screenPoint.x)).toBeLessThan(1);
      expect(Math.abs(backToScreen.y - screenPoint.y)).toBeLessThan(1);
    });

    it('should synchronize viewport state with rendering system', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Render some content to have an SVG
      const mockLayout = {
        nodes: [{ id: 'n1', label: 'Node', x: 100, y: 100 }],
        edges: [],
        bounds: { minX: 50, minY: 50, maxX: 150, maxY: 150, width: 100, height: 100 }
      };

      renderingSystem.render(mockLayout);
      const svg = container.querySelector('svg')!;

      const viewportManager = new ViewportManager();
      viewportManager.setup(svg, renderingSystem);

      // Viewport changes should propagate to rendering system
      const transform = { x: 50, y: 50, scale: 1.5 };
      viewportManager.setTransform(transform);

      expect(renderingSystem.getTransform()).toEqual(transform);
    });
  });

  describe('Multi-Module Event Flow', () => {
    it('should handle events across all modules correctly', (done) => {
      const layoutEngine = new LayoutEngine();
      const renderingSystem = new RenderingSystem(container);
      const viewportManager = new ViewportManager();

      const events: Array<{ module: string, event: string, timestamp: number }> = [];
      const startTime = Date.now();

      // Track events from all modules
      layoutEngine.on('layoutStart', () => {
        events.push({ module: 'layout', event: 'start', timestamp: Date.now() - startTime });
      });

      layoutEngine.on('layoutEnd', (result) => {
        events.push({ module: 'layout', event: 'end', timestamp: Date.now() - startTime });

        // Setup rendering after layout
        renderingSystem.initialize();
        renderingSystem.render(result);
      });

      renderingSystem.on('rendered', () => {
        events.push({ module: 'rendering', event: 'rendered', timestamp: Date.now() - startTime });

        // Setup viewport after rendering
        const svg = container.querySelector('svg')!;
        viewportManager.setup(svg, renderingSystem);
        events.push({ module: 'viewport', event: 'setup', timestamp: Date.now() - startTime });

        // Verify event order
        const layoutStart = events.find(e => e.event === 'start')!;
        const layoutEnd = events.find(e => e.event === 'end')!;
        const rendered = events.find(e => e.event === 'rendered')!;
        const viewportSetup = events.find(e => e.event === 'setup')!;

        expect(layoutStart.timestamp).toBeLessThan(layoutEnd.timestamp);
        expect(layoutEnd.timestamp).toBeLessThan(rendered.timestamp);
        expect(rendered.timestamp).toBeLessThan(viewportSetup.timestamp);

        done();
      });

      layoutEngine.calculateLayout(sampleData);
    });

    it('should maintain module independence during error conditions', async () => {
      const layoutEngine = new LayoutEngine();
      const renderingSystem = new RenderingSystem(container);

      // Layout should work even if rendering fails
      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      expect(layoutResult.nodes).toHaveLength(sampleData.nodes.length);

      // Simulate rendering error
      const originalRender = renderingSystem.render.bind(renderingSystem);
      renderingSystem.render = vi.fn(() => {
        throw new Error('Rendering failed');
      });

      expect(() => renderingSystem.render(layoutResult)).toThrow('Rendering failed');

      // Layout should still be valid and usable
      expect(layoutResult.nodes.every(n => typeof n.x === 'number')).toBe(true);

      // Restore rendering and it should work
      renderingSystem.render = originalRender;
      renderingSystem.initialize();
      expect(() => renderingSystem.render(layoutResult)).not.toThrow();
    });
  });

  describe('Performance and Resource Management', () => {
    it('should properly clean up resources across modules', async () => {
      const layoutEngine = new LayoutEngine();
      const renderingSystem = new RenderingSystem(container);
      const viewportManager = new ViewportManager();

      // Setup complete integration
      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      const svg = container.querySelector('svg')!;
      viewportManager.setup(svg, renderingSystem);

      // Verify setup
      expect(container.children.length).toBeGreaterThan(0);
      expect(viewportManager.getTransform()).toBeDefined();

      // Cleanup should work for all modules
      viewportManager.destroy();
      renderingSystem.destroy();
      layoutEngine.stopSimulation();

      // Should be properly cleaned up
      expect(container.children.length).toBe(0); // RenderingSystem clears DOM
    });

    it('should support efficient updates across modules', async () => {
      const layoutEngine = new LayoutEngine();
      const renderingSystem = new RenderingSystem(container);

      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      // Enable batching for performance
      renderingSystem.enableBatching(true);

      // Should be able to batch updates
      const nodeUpdates = layoutResult.nodes.map(node => ({
        id: node.id,
        x: node.x + 10,
        y: node.y + 10
      }));

      renderingSystem.updateNodePositions(nodeUpdates);

      // Flush batched updates
      renderingSystem.flush();

      // Disable batching
      renderingSystem.enableBatching(false);
    });
  });
});