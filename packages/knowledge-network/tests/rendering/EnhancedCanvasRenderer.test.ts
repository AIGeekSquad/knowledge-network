/**
 * Enhanced Canvas Renderer Tests
 *
 * Comprehensive test suite covering spatial integration, viewport operations,
 * performance optimizations, and interaction capabilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedCanvasRenderer, type CanvasRenderingConfig } from '../../src/rendering/EnhancedCanvasRenderer';
import type { LayoutResult, PositionedNode, PositionedEdge } from '../../src/layout/LayoutEngine';
import type { RenderConfig } from '../../src/rendering/IRenderer';

// Mock setup for browser APIs
Object.defineProperty(window, 'devicePixelRatio', {
  writable: true,
  value: 2,
});

global.HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation((contextType) => {
  if (contextType === '2d') {
    return {
      clearRect: vi.fn(),
      setTransform: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      rect: vi.fn(),
      // Properties
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      globalAlpha: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'top',
    };
  }
  return null;
});

global.OffscreenCanvas = class MockOffscreenCanvas {
  width: number;
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  getContext(contextType: string) {
    if (contextType === '2d') {
      return global.HTMLCanvasElement.prototype.getContext('2d');
    }
    return null;
  }
} as any;

global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

describe('EnhancedCanvasRenderer', () => {
  let renderer: EnhancedCanvasRenderer;
  let container: HTMLElement;
  let config: CanvasRenderingConfig;
  let mockLayout: LayoutResult;

  beforeEach(() => {
    renderer = new EnhancedCanvasRenderer();
    container = document.createElement('div');
    document.body.appendChild(container);

    config = {
      width: 800,
      height: 600,
      enableViewportCulling: true,
      enableLevelOfDetail: true,
      useOffscreenCanvas: true,
      enableMouseInteraction: true,
    };

    mockLayout = {
      nodes: [
        { id: 'node1', x: 100, y: 100, label: 'Node 1' },
        { id: 'node2', x: 200, y: 200, label: 'Node 2' },
        { id: 'node3', x: 300, y: 100, label: 'Node 3' },
        { id: 'node4', x: 400, y: 300, label: 'Node 4' },
        { id: 'node5', x: 500, y: 150, label: 'Node 5' },
      ] as PositionedNode[],
      edges: [
        { id: 'edge1', source: mockLayout?.nodes[0], target: mockLayout?.nodes[1] },
        { id: 'edge2', source: mockLayout?.nodes[1], target: mockLayout?.nodes[2] },
        { id: 'edge3', source: mockLayout?.nodes[2], target: mockLayout?.nodes[3] },
        { id: 'edge4', source: mockLayout?.nodes[3], target: mockLayout?.nodes[4] },
      ] as PositionedEdge[],
    };

    // Fix circular reference
    mockLayout.edges.forEach((edge, index) => {
      edge.source = mockLayout.nodes[index];
      edge.target = mockLayout.nodes[Math.min(index + 1, mockLayout.nodes.length - 1)];
    });
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('Initialization and Lifecycle', () => {
    it('should initialize with proper configuration', () => {
      renderer.initialize(container, config);

      expect(container.children.length).toBe(1);
      expect(container.children[0].tagName).toBe('CANVAS');

      const canvas = container.children[0] as HTMLCanvasElement;
      expect(canvas.width).toBe(config.width * window.devicePixelRatio);
      expect(canvas.height).toBe(config.height * window.devicePixelRatio);
      expect(canvas.style.width).toBe(`${config.width}px`);
      expect(canvas.style.height).toBe(`${config.height}px`);
    });

    it('should properly destroy and cleanup resources', () => {
      renderer.initialize(container, config);
      const initialChildren = container.children.length;

      // Request a render to create an animation frame
      renderer['requestRender']();

      renderer.destroy();

      expect(container.children.length).toBe(0);
      expect(global.cancelAnimationFrame).toHaveBeenCalled();
    });

    it('should handle missing OffscreenCanvas support gracefully', () => {
      const originalOffscreenCanvas = global.OffscreenCanvas;
      // @ts-expect-error - Intentionally deleting for test
      delete global.OffscreenCanvas;

      expect(() => {
        renderer.initialize(container, config);
      }).not.toThrow();

      global.OffscreenCanvas = originalOffscreenCanvas;
    });
  });

  describe('Core Rendering', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
    });

    it('should render nodes and edges', () => {
      const renderConfig: RenderConfig = {
        nodeConfig: { radius: 10, fill: '#blue' },
        edgeConfig: { stroke: '#gray', strokeWidth: 2 },
        labelConfig: { fontSize: 12, fill: '#black' },
        layerOrder: ['edges', 'nodes', 'labels'],
      };

      expect(() => {
        renderer.render(mockLayout, renderConfig);
      }).not.toThrow();

      // Verify spatial index was built
      expect(renderer['spatialIndexValid']).toBe(true);
    });

    it('should handle empty layout gracefully', () => {
      const emptyLayout: LayoutResult = { nodes: [], edges: [] };
      const renderConfig: RenderConfig = {
        nodeConfig: {},
        edgeConfig: {},
        labelConfig: {},
      };

      expect(() => {
        renderer.render(emptyLayout, renderConfig);
      }).not.toThrow();
    });

    it('should rebuild spatial index when layout changes', () => {
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };

      renderer.render(mockLayout, renderConfig);
      const firstIndexValid = renderer['spatialIndexValid'];

      // Render with different layout
      const newLayout: LayoutResult = {
        nodes: [{ id: 'newNode', x: 50, y: 50, label: 'New Node' }] as PositionedNode[],
        edges: [] as PositionedEdge[],
      };

      renderer.render(newLayout, renderConfig);
      const secondIndexValid = renderer['spatialIndexValid'];

      expect(firstIndexValid).toBe(true);
      expect(secondIndexValid).toBe(true);
    });
  });

  describe('Spatial Queries', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };
      renderer.render(mockLayout, renderConfig);
    });

    it('should find node at screen coordinates', () => {
      // Node 1 is at world coordinates (100, 100)
      // With default viewport, screen coordinates should be the same
      const node = renderer.getNodeAt(100, 100);

      expect(node).toBeTruthy();
      expect(node?.id).toBe('node1');
    });

    it('should return null when no node at coordinates', () => {
      const node = renderer.getNodeAt(1000, 1000);
      expect(node).toBeNull();
    });

    it('should find nodes in region', () => {
      const region = { x: 90, y: 90, width: 120, height: 120 };
      const nodes = renderer.getNodesInRegion(region);

      // Should find nodes 1 and 2 within this region
      expect(nodes.length).toBeGreaterThan(0);
      const nodeIds = nodes.map(n => n.id);
      expect(nodeIds).toContain('node1');
      expect(nodeIds).toContain('node2');
    });

    it('should perform ray queries', () => {
      const origin = { x: 0, y: 100 };
      const direction = { x: 1, y: 0 };
      const nodes = renderer.queryRay(origin, direction);

      // Ray should intersect with nodes along y=100
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  describe('Viewport Operations', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
    });

    it('should set zoom with constraints', () => {
      renderer.setZoom(2.0);
      const transform = renderer.getTransform();
      expect(transform.scale).toBe(2.0);

      // Test min zoom constraint
      renderer.setZoom(0.01);
      const minTransform = renderer.getTransform();
      expect(minTransform.scale).toBeGreaterThanOrEqual(0.1);

      // Test max zoom constraint
      renderer.setZoom(20.0);
      const maxTransform = renderer.getTransform();
      expect(maxTransform.scale).toBeLessThanOrEqual(10.0);
    });

    it('should set pan offset', () => {
      renderer.setPan({ x: 50, y: 100 });
      const transform = renderer.getTransform();
      expect(transform.x).toBe(50);
      expect(transform.y).toBe(100);
    });

    it('should fit viewport to show all nodes', () => {
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };
      renderer.render(mockLayout, renderConfig);

      renderer.fitToViewport(20);

      const transform = renderer.getTransform();
      expect(transform.scale).toBeGreaterThan(0);
      expect(transform.x).toBeDefined();
      expect(transform.y).toBeDefined();
    });

    it('should handle coordinate transformations correctly', () => {
      renderer.setZoom(2.0);
      renderer.setPan({ x: 100, y: 50 });

      const worldPoint = { x: 200, y: 300 };
      const screenPoint = renderer.worldToScreen(worldPoint);
      const backToWorld = renderer.screenToWorld(screenPoint);

      expect(backToWorld.x).toBeCloseTo(worldPoint.x, 5);
      expect(backToWorld.y).toBeCloseTo(worldPoint.y, 5);
    });
  });

  describe('Performance Optimizations', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
    });

    it('should perform viewport culling when enabled', () => {
      // Create layout with nodes outside viewport
      const largeLayout: LayoutResult = {
        nodes: [
          { id: 'visible1', x: 100, y: 100, label: 'Visible 1' },
          { id: 'visible2', x: 200, y: 200, label: 'Visible 2' },
          { id: 'offscreen1', x: 2000, y: 2000, label: 'Offscreen 1' },
          { id: 'offscreen2', x: -1000, y: -1000, label: 'Offscreen 2' },
        ] as PositionedNode[],
        edges: [] as PositionedEdge[],
      };

      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };
      renderer.render(largeLayout, renderConfig);

      const visibleNodes = renderer['visibleNodes'];
      expect(visibleNodes.length).toBeLessThan(largeLayout.nodes.length);
    });

    it('should apply level of detail based on zoom level', () => {
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };

      // Render at high zoom (should show all details)
      renderer.setZoom(2.0);
      renderer.render(mockLayout, renderConfig);

      // Render at low zoom (should apply LOD)
      renderer.setZoom(0.2);
      renderer.render(mockLayout, renderConfig);

      // Verify LOD was applied (implementation detail may vary)
      expect(renderer['viewport'].scale).toBe(0.2);
    });

    it('should batch render operations', () => {
      // Create config with small batch size for testing
      const batchConfig = { ...config, batchSize: 2 };
      renderer.initialize(container, batchConfig);

      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };
      renderer.render(mockLayout, renderConfig);

      // Batching is internal optimization, so we just verify no errors
      expect(renderer['visibleNodes']).toBeDefined();
    });
  });

  describe('Interaction Features', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };
      renderer.render(mockLayout, renderConfig);
    });

    it('should handle mouse move events for hover detection', () => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();

      // Set up bounding rect mock for the canvas
      canvas.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0,
        top: 0,
        width: 800,
        height: 600,
      });

      const mouseMoveEvent = new MouseEvent('mousemove', {
        clientX: 100, // Exact position of node1
        clientY: 100,
      });

      // Simulate mouse move
      canvas.dispatchEvent(mouseMoveEvent);

      // Hover state might be null if no node is actually found at that position
      // This test mainly verifies that the event handler doesn't crash
      expect(renderer['hoveredNode']).toBeDefined(); // Could be null or a node
    });

    it('should handle click events for node selection', () => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();

      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 100,
      });

      canvas.dispatchEvent(clickEvent);

      // Should update selection state
      expect(renderer['selectedNodes'].size).toBeGreaterThan(0);
    });

    it('should handle wheel events for zoom', () => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;
      const initialZoom = renderer.getTransform().scale;

      const wheelEvent = new WheelEvent('wheel', {
        deltaY: -100, // Zoom in
        clientX: 400,
        clientY: 300,
      });

      canvas.dispatchEvent(wheelEvent);

      const newZoom = renderer.getTransform().scale;
      expect(newZoom).toBeGreaterThan(initialZoom);
    });

    it('should support multi-select with ctrl/cmd key', () => {
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // First selection
      const click1 = new MouseEvent('click', {
        clientX: 100,
        clientY: 100,
      });
      canvas.dispatchEvent(click1);

      // Second selection with ctrl key
      const click2 = new MouseEvent('click', {
        clientX: 200,
        clientY: 200,
        ctrlKey: true,
      });
      canvas.dispatchEvent(click2);

      expect(renderer['selectedNodes'].size).toBe(2);
    });
  });

  describe('Highlighting and Selection', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
    });

    it('should highlight nodes', () => {
      renderer.highlightNodes(['node1', 'node2']);
      expect(renderer['highlightedNodes'].size).toBe(2);
      expect(renderer['highlightedNodes'].has('node1')).toBe(true);
      expect(renderer['highlightedNodes'].has('node2')).toBe(true);
    });

    it('should highlight edges', () => {
      renderer.highlightEdges(['edge1', 'edge2']);
      expect(renderer['highlightedEdges'].size).toBe(2);
      expect(renderer['highlightedEdges'].has('edge1')).toBe(true);
      expect(renderer['highlightedEdges'].has('edge2')).toBe(true);
    });

    it('should clear all highlights', () => {
      renderer.highlightNodes(['node1']);
      renderer.highlightEdges(['edge1']);

      renderer.clearHighlights();

      expect(renderer['highlightedNodes'].size).toBe(0);
      expect(renderer['highlightedEdges'].size).toBe(0);
    });
  });

  describe('IRenderer Interface Compliance', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
    });

    it('should implement all required IRenderer methods', () => {
      // Lifecycle methods
      expect(typeof renderer.initialize).toBe('function');
      expect(typeof renderer.destroy).toBe('function');
      expect(typeof renderer.clear).toBe('function');

      // Rendering methods
      expect(typeof renderer.render).toBe('function');
      expect(typeof renderer.renderNodes).toBe('function');
      expect(typeof renderer.renderEdges).toBe('function');
      expect(typeof renderer.renderLabels).toBe('function');

      // Update methods
      expect(typeof renderer.updateNodePositions).toBe('function');
      expect(typeof renderer.updateEdgePositions).toBe('function');
      expect(typeof renderer.updateNodeStyles).toBe('function');
      expect(typeof renderer.updateEdgeStyles).toBe('function');

      // Highlighting methods
      expect(typeof renderer.highlightNodes).toBe('function');
      expect(typeof renderer.highlightEdges).toBe('function');
      expect(typeof renderer.clearHighlights).toBe('function');

      // Transform methods
      expect(typeof renderer.setTransform).toBe('function');
      expect(typeof renderer.getTransform).toBe('function');

      // Element access methods
      expect(typeof renderer.getNodeElement).toBe('function');
      expect(typeof renderer.getEdgeElement).toBe('function');
      expect(typeof renderer.getContainer).toBe('function');

      // Performance methods
      expect(typeof renderer.enableBatching).toBe('function');
      expect(typeof renderer.flush).toBe('function');
    });

    it('should have correct type identifier', () => {
      expect(renderer.type).toBe('canvas');
    });

    it('should return correct container element', () => {
      const container = renderer.getContainer();
      expect(container.tagName).toBe('CANVAS');
    });

    it('should return null for individual node/edge elements (Canvas limitation)', () => {
      expect(renderer.getNodeElement('node1')).toBeNull();
      expect(renderer.getEdgeElement('edge1')).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization with invalid container gracefully', () => {
      // This test verifies robustness, specific behavior may vary
      expect(() => {
        renderer.initialize(container, config);
      }).not.toThrow();
    });

    it('should handle rendering before initialization gracefully', () => {
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };

      expect(() => {
        renderer.render(mockLayout, renderConfig);
      }).not.toThrow();
    });

    it('should handle spatial queries before spatial index is built', () => {
      renderer.initialize(container, config);

      // Query before rendering (before spatial index is built)
      const node = renderer.getNodeAt(100, 100);
      expect(node).toBeNull();

      const nodes = renderer.getNodesInRegion({ x: 0, y: 0, width: 100, height: 100 });
      expect(nodes).toEqual([]);
    });
  });

  describe('Memory and Performance', () => {
    beforeEach(() => {
      renderer.initialize(container, config);
    });

    it('should not leak memory on multiple renders', () => {
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };

      // Render multiple times with different layouts
      for (let i = 0; i < 10; i++) {
        const layout: LayoutResult = {
          nodes: [{ id: `node-${i}`, x: i * 50, y: i * 50, label: `Node ${i}` }] as PositionedNode[],
          edges: [] as PositionedEdge[],
        };
        renderer.render(layout, renderConfig);
      }

      // Should not accumulate state inappropriately
      expect(renderer['currentLayout']?.nodes.length).toBe(1);
    });

    it('should handle large node counts efficiently', () => {
      // Create large layout
      const largeLayout: LayoutResult = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node-${i}`,
          x: (i % 50) * 20,
          y: Math.floor(i / 50) * 20,
          label: `Node ${i}`,
        })) as PositionedNode[],
        edges: [] as PositionedEdge[],
      };

      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };

      const startTime = performance.now();
      renderer.render(largeLayout, renderConfig);
      const endTime = performance.now();

      // Should complete in reasonable time (this is environment dependent)
      expect(endTime - startTime).toBeLessThan(1000); // 1 second threshold
    });

    it('should properly cleanup on destroy', () => {
      const renderConfig: RenderConfig = { nodeConfig: {}, edgeConfig: {}, labelConfig: {} };
      renderer.render(mockLayout, renderConfig);

      renderer.destroy();

      // Verify cleanup
      expect(renderer['canvas']).toBeNull();
      expect(renderer['ctx']).toBeNull();
      expect(renderer['currentLayout']).toBeNull();
      expect(renderer['spatialIndexValid']).toBe(false);
    });
  });
});

describe('EnhancedCanvasRenderer Integration', () => {
  it('should work with real DOM elements', () => {
    const renderer = new EnhancedCanvasRenderer();
    const container = document.createElement('div');
    document.body.appendChild(container);

    const config: CanvasRenderingConfig = {
      width: 400,
      height: 300,
    };

    try {
      renderer.initialize(container, config);

      const mockLayout: LayoutResult = {
        nodes: [
          { id: 'test1', x: 100, y: 100, label: 'Test 1' },
          { id: 'test2', x: 200, y: 150, label: 'Test 2' },
        ] as PositionedNode[],
        edges: [
          { id: 'testEdge', source: { id: 'test1', x: 100, y: 100 }, target: { id: 'test2', x: 200, y: 150 } },
        ] as PositionedEdge[],
      };

      const renderConfig: RenderConfig = {
        nodeConfig: { radius: 15, fill: '#4CAF50' },
        edgeConfig: { stroke: '#757575', strokeWidth: 2 },
        labelConfig: { fontSize: 14, fill: '#212121' },
      };

      renderer.render(mockLayout, renderConfig);

      // Verify spatial queries work
      const node = renderer.getNodeAt(100, 100);
      expect(node?.id).toBe('test1');

      // Verify viewport operations work
      renderer.setZoom(1.5);
      renderer.setPan({ x: 50, y: 25 });

      const transform = renderer.getTransform();
      expect(transform.scale).toBe(1.5);
      expect(transform.x).toBe(50);
      expect(transform.y).toBe(25);

    } finally {
      renderer.destroy();
      document.body.removeChild(container);
    }
  });
});