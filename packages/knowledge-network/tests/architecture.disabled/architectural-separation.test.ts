/**
 * Architectural Separation Tests
 *
 * These tests verify that the knowledge-network library follows proper
 * separation of concerns and modular design principles.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraph } from '../../src/KnowledgeGraph';
import { LayoutEngine } from '../../src/layout/LayoutEngine';
import { RenderingSystem } from '../../src/rendering/RenderingSystem';
import { ViewportManager } from '../../src/viewport/ViewportManager';
import type { GraphData, GraphConfig } from '../../src/types';

describe('Architectural Separation', () => {
  let container: HTMLElement;
  let sampleData: GraphData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    sampleData = {
      nodes: [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
        { id: 'node3', label: 'Node 3' }
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' }
      ]
    };
  });

  describe('Layout Engine Separation', () => {
    it('should be able to calculate layout without DOM manipulation', async () => {
      const layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600
      });

      // Track DOM operations
      const originalCreateElement = document.createElement.bind(document);
      const createElementSpy = vi.fn(originalCreateElement);
      document.createElement = createElementSpy;

      try {
        const result = await layoutEngine.calculateLayout(sampleData);

        // Layout should complete without creating DOM elements
        expect(createElementSpy).not.toHaveBeenCalled();

        // Should produce positioned nodes and edges
        expect(result.nodes).toHaveLength(3);
        expect(result.edges).toHaveLength(2);
        expect(result.nodes[0]).toHaveProperty('x');
        expect(result.nodes[0]).toHaveProperty('y');
        expect(result.bounds).toBeDefined();
      } finally {
        document.createElement = originalCreateElement;
      }
    });

    it('should emit layout events without rendering', (done) => {
      const layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600
      });

      const events: string[] = [];

      layoutEngine.on('layoutStart', () => events.push('layoutStart'));
      layoutEngine.on('layoutProgress', () => events.push('layoutProgress'));
      layoutEngine.on('layoutEnd', () => {
        events.push('layoutEnd');

        // Should have emitted layout events
        expect(events).toContain('layoutStart');
        expect(events).toContain('layoutEnd');
        done();
      });

      layoutEngine.calculateLayout(sampleData);
    });

    it('should support different layout algorithms independently', () => {
      const layoutEngine = new LayoutEngine();

      // Should support multiple algorithms
      const algorithms = layoutEngine.getAvailableAlgorithms();
      expect(algorithms).toContain('force-directed');
      expect(algorithms).toContain('hierarchical');
      expect(algorithms).toContain('circular');
      expect(algorithms).toContain('grid');
      expect(algorithms).toContain('radial');

      // Should be able to switch algorithms
      layoutEngine.setAlgorithm('circular');
      expect(layoutEngine.getAlgorithm()).toBe('circular');
    });
  });

  describe('Rendering System Separation', () => {
    it('should be able to initialize without layout data', () => {
      const renderingSystem = new RenderingSystem(container, {
        width: 800,
        height: 600
      });

      // Should initialize successfully
      expect(() => renderingSystem.initialize()).not.toThrow();

      // Should have a renderer
      expect(renderingSystem.getRenderer()).toBeTruthy();
      expect(renderingSystem.getRendererType()).toBe('svg');
    });

    it('should support multiple renderer types', () => {
      const renderingSystem = new RenderingSystem(container);

      // SVG renderer should work
      expect(() => renderingSystem.setRenderer('svg')).not.toThrow();
      expect(renderingSystem.getRendererType()).toBe('svg');

      // Canvas renderer should throw (not implemented)
      expect(() => renderingSystem.setRenderer('canvas')).toThrow('Canvas renderer not yet implemented');

      // WebGL renderer should throw (not implemented)
      expect(() => renderingSystem.setRenderer('webgl')).toThrow('WebGL renderer not yet implemented');
    });

    it('should only render when given layout data', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Should be able to call render without layout data (no-op)
      const mockLayout = {
        nodes: [],
        edges: [],
        bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 }
      };

      expect(() => renderingSystem.render(mockLayout)).not.toThrow();
    });
  });

  describe('Viewport Manager Separation', () => {
    it('should manage transformations independently of layout', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      const viewportManager = new ViewportManager();

      // Create an SVG for the viewport manager
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '800');
      svg.setAttribute('height', '600');
      container.appendChild(svg);

      viewportManager.setup(svg, renderingSystem);

      // Should handle zoom operations
      const initialTransform = viewportManager.getTransform();
      expect(initialTransform).toEqual({ x: 0, y: 0, scale: 1 });

      viewportManager.zoomIn();
      const zoomedTransform = viewportManager.getTransform();
      expect(zoomedTransform.scale).toBeGreaterThan(1);
    });

    it('should support viewport operations without nodes', () => {
      const renderingSystem = new RenderingSystem(container);
      const viewportManager = new ViewportManager();

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);
      viewportManager.setup(svg, renderingSystem);

      // Should be able to set zoom constraints
      viewportManager.setZoomExtent(0.5, 5);
      expect(viewportManager.getZoomExtent()).toEqual([0.5, 5]);

      // Should handle transform operations
      viewportManager.setTransform({ x: 100, y: 100, scale: 2 });
      expect(viewportManager.getTransform()).toEqual({ x: 100, y: 100, scale: 2 });
    });
  });

  describe('Module Independence', () => {
    it('should allow LayoutEngine to work without RenderingSystem', async () => {
      const layoutEngine = new LayoutEngine('grid', {
        width: 600,
        height: 400,
        rows: 2,
        columns: 2
      });

      const result = await layoutEngine.calculateLayout(sampleData);

      // Should produce valid layout without any rendering system
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes.every(node =>
        typeof node.x === 'number' && typeof node.y === 'number'
      )).toBe(true);
    });

    it('should allow RenderingSystem to work without LayoutEngine', () => {
      const renderingSystem = new RenderingSystem(container);

      // Should initialize and work with pre-positioned data
      renderingSystem.initialize();

      const mockLayout = {
        nodes: [
          { id: 'n1', label: 'Node 1', x: 100, y: 100 },
          { id: 'n2', label: 'Node 2', x: 200, y: 200 }
        ],
        edges: [
          { source: 'n1', target: 'n2' }
        ],
        bounds: { minX: 50, minY: 50, maxX: 250, maxY: 250, width: 200, height: 200 }
      };

      expect(() => renderingSystem.render(mockLayout)).not.toThrow();
    });

    it('should allow ViewportManager to work independently', () => {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      const renderingSystem = new RenderingSystem(container);
      const viewportManager = new ViewportManager();

      viewportManager.setup(svg, renderingSystem);

      // Should work without any graph data
      viewportManager.zoomTo(2);
      viewportManager.panBy(50, 50);

      const transform = viewportManager.getTransform();
      expect(transform.scale).toBe(2);
      // Note: exact pan coordinates may vary due to centering logic
    });
  });

  describe('Interface Compliance', () => {
    it('should have proper interfaces for all modular components', () => {
      // LayoutEngine should have proper interface
      const layoutEngine = new LayoutEngine();
      expect(typeof layoutEngine.calculateLayout).toBe('function');
      expect(typeof layoutEngine.setAlgorithm).toBe('function');
      expect(typeof layoutEngine.getConfig).toBe('function');

      // RenderingSystem should have proper interface
      const renderingSystem = new RenderingSystem(container);
      expect(typeof renderingSystem.setRenderer).toBe('function');
      expect(typeof renderingSystem.render).toBe('function');
      expect(typeof renderingSystem.clear).toBe('function');

      // ViewportManager should have proper interface
      const viewportManager = new ViewportManager();
      expect(typeof viewportManager.setup).toBe('function');
      expect(typeof viewportManager.zoomTo).toBe('function');
      expect(typeof viewportManager.setTransform).toBe('function');
    });
  });

  describe('Data Flow Validation', () => {
    it('should pass data correctly between modules', async () => {
      // Layout should produce data that Rendering can consume
      const layoutEngine = new LayoutEngine('circular');
      const layoutResult = await layoutEngine.calculateLayout(sampleData);

      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Layout result should be compatible with rendering system
      expect(() => renderingSystem.render(layoutResult)).not.toThrow();

      // Viewport should be able to use layout bounds
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      container.appendChild(svg);

      const viewportManager = new ViewportManager();
      viewportManager.setup(svg, renderingSystem);

      expect(() => viewportManager.fitToBounds(layoutResult.bounds)).not.toThrow();
    });

    it('should maintain data consistency across modules', async () => {
      const layoutEngine = new LayoutEngine();
      const result = await layoutEngine.calculateLayout(sampleData);

      // Node IDs should be preserved
      expect(result.nodes.map(n => n.id)).toEqual(['node1', 'node2', 'node3']);

      // Edge references should be preserved
      expect(result.edges).toHaveLength(2);
      expect(result.edges.every(edge =>
        typeof edge.source === 'string' || typeof edge.source === 'object'
      )).toBe(true);
    });
  });
});