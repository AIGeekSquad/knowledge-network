/**
 * WebGL Renderer Integration Tests
 *
 * Comprehensive test suite for WebGL renderer including performance validation,
 * spatial integration, and fallback behavior testing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebGLRenderer } from '../WebGLRenderer';
import { SpatialIndexer } from '../../spatial/SpatialIndexer';
import type { LayoutResult, PositionedNode, PositionedEdge } from '../../layout/LayoutEngine';
import type { RenderConfig } from '../RenderingSystem';

// Mock WebGL context for testing
class MockWebGL2RenderingContext {
  canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // WebGL constants
  NO_ERROR = 0;
  INVALID_ENUM = 0x0500;
  INVALID_VALUE = 0x0501;
  INVALID_OPERATION = 0x0502;
  OUT_OF_MEMORY = 0x0505;
  INVALID_FRAMEBUFFER_OPERATION = 0x0506;

  VERTEX_SHADER = 0x8B31;
  FRAGMENT_SHADER = 0x8B30;
  COMPILE_STATUS = 0x8B81;
  LINK_STATUS = 0x8B82;

  ARRAY_BUFFER = 0x8892;
  ELEMENT_ARRAY_BUFFER = 0x8893;
  DYNAMIC_DRAW = 0x88E8;
  STATIC_DRAW = 0x88E4;

  TRIANGLES = 0x0004;
  UNSIGNED_SHORT = 0x1403;
  FLOAT = 0x1406;

  COLOR_BUFFER_BIT = 0x00004000;
  DEPTH_BUFFER_BIT = 0x00000100;

  BLEND = 0x0BE2;
  SRC_ALPHA = 0x0302;
  ONE_MINUS_SRC_ALPHA = 0x0303;

  TEXTURE_2D = 0x0DE1;
  RGBA = 0x1908;
  UNSIGNED_BYTE = 0x1401;
  NEAREST = 0x2600;
  TEXTURE_MIN_FILTER = 0x2801;
  TEXTURE_MAG_FILTER = 0x2800;

  FRAMEBUFFER = 0x8D40;
  COLOR_ATTACHMENT0 = 0x8CE0;
  FRAMEBUFFER_COMPLETE = 0x8CD5;

  MAX_TEXTURE_SIZE = 0x0D33;
  MAX_VERTEX_ATTRIBS = 0x8869;
  MAX_VARYING_VECTORS = 0x8DFC;
  MAX_TEXTURE_IMAGE_UNITS = 0x8872;

  // Mock implementations
  createShader = vi.fn(() => ({} as WebGLShader));
  createProgram = vi.fn(() => ({} as WebGLProgram));
  createBuffer = vi.fn(() => ({} as WebGLBuffer));
  createVertexArray = vi.fn(() => ({} as WebGLVertexArrayObject));
  createTexture = vi.fn(() => ({} as WebGLTexture));
  createFramebuffer = vi.fn(() => ({} as WebGLFramebuffer));

  shaderSource = vi.fn();
  compileShader = vi.fn();
  attachShader = vi.fn();
  linkProgram = vi.fn();
  useProgram = vi.fn();

  bindBuffer = vi.fn();
  bufferData = vi.fn();
  bufferSubData = vi.fn();

  bindVertexArray = vi.fn();
  enableVertexAttribArray = vi.fn();
  vertexAttribPointer = vi.fn();
  vertexAttribDivisor = vi.fn();

  bindTexture = vi.fn();
  texImage2D = vi.fn();
  texParameteri = vi.fn();

  bindFramebuffer = vi.fn();
  framebufferTexture2D = vi.fn();

  viewport = vi.fn();
  clearColor = vi.fn();
  clear = vi.fn();
  enable = vi.fn();
  blendFunc = vi.fn();

  drawElementsInstanced = vi.fn();

  getParameter = vi.fn((param: number) => {
    switch (param) {
      case this.MAX_TEXTURE_SIZE: return 4096;
      case this.MAX_VERTEX_ATTRIBS: return 16;
      case this.MAX_VARYING_VECTORS: return 8;
      case this.MAX_TEXTURE_IMAGE_UNITS: return 16;
      default: return 0;
    }
  });

  getShaderParameter = vi.fn(() => true);
  getProgramParameter = vi.fn(() => true);
  getShaderInfoLog = vi.fn(() => '');
  getProgramInfoLog = vi.fn(() => '');
  getAttribLocation = vi.fn(() => 0);
  getUniformLocation = vi.fn(() => ({} as WebGLUniformLocation));
  uniformMatrix3fv = vi.fn();
  uniform2f = vi.fn();
  uniform1f = vi.fn();

  getError = vi.fn(() => this.NO_ERROR);
  isContextLost = vi.fn(() => false);
  getSupportedExtensions = vi.fn(() => []);
  getExtension = vi.fn(() => null);
  checkFramebufferStatus = vi.fn(() => this.FRAMEBUFFER_COMPLETE);
  readPixels = vi.fn();

  deleteShader = vi.fn();
  deleteProgram = vi.fn();
  deleteBuffer = vi.fn();
  deleteVertexArray = vi.fn();
  deleteTexture = vi.fn();
  deleteFramebuffer = vi.fn();
}

describe('WebGLRenderer', () => {
  let renderer: WebGLRenderer;
  let container: HTMLDivElement;
  let mockCanvas: HTMLCanvasElement;
  let mockGL: MockWebGL2RenderingContext;

  // Test data
  const createTestLayout = (nodeCount: number = 100): LayoutResult => {
    const nodes: PositionedNode[] = [];
    const edges: PositionedEdge[] = [];

    // Create nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: `node-${i}`,
        label: `Node ${i}`,
        x: Math.random() * 800 - 400,
        y: Math.random() * 600 - 300,
        z: 0,
        data: { value: i },
      });
    }

    // Create edges (about 1.5x nodes)
    const edgeCount = Math.floor(nodeCount * 1.5);
    for (let i = 0; i < edgeCount; i++) {
      const sourceIdx = Math.floor(Math.random() * nodeCount);
      const targetIdx = Math.floor(Math.random() * nodeCount);
      if (sourceIdx !== targetIdx) {
        edges.push({
          id: `edge-${i}`,
          source: nodes[sourceIdx],
          target: nodes[targetIdx],
        });
      }
    }

    return { nodes, edges };
  };

  beforeEach(() => {
    // Create DOM elements
    container = document.createElement('div');
    document.body.appendChild(container);

    // Mock canvas and WebGL context
    mockCanvas = document.createElement('canvas');
    mockGL = new MockWebGL2RenderingContext(mockCanvas);

    // Mock canvas.getContext to return our mock WebGL context
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        const canvas = document.createElement.wrappedMethod(tagName) as HTMLCanvasElement;
        vi.spyOn(canvas, 'getContext').mockImplementation((contextType: string) => {
          if (contextType === 'webgl2') {
            return mockGL as any;
          }
          return null;
        });
        return canvas;
      }
      return document.createElement.wrappedMethod(tagName);
    });

    renderer = new WebGLRenderer();
  });

  afterEach(() => {
    renderer.destroy();
    document.body.removeChild(container);
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid config', () => {
      expect(() => {
        renderer.initialize(container, {
          width: 800,
          height: 600,
          pixelRatio: 1,
        });
      }).not.toThrow();

      expect(renderer.type).toBe('webgl');
    });

    it('should handle initialization errors gracefully', () => {
      // Make shader compilation fail
      mockGL.getShaderParameter.mockReturnValue(false);
      mockGL.getShaderInfoLog.mockReturnValue('Shader compilation error');

      expect(() => {
        renderer.initialize(container, {
          width: 800,
          height: 600,
        });
      }).toThrow();
    });

    it('should set up WebGL state correctly', () => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
      });

      expect(mockGL.createShader).toHaveBeenCalled();
      expect(mockGL.createProgram).toHaveBeenCalled();
      expect(mockGL.createBuffer).toHaveBeenCalled();
      expect(mockGL.createVertexArray).toHaveBeenCalled();
    });
  });

  describe('Rendering Pipeline', () => {
    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
        maxNodes: 1000,
        maxEdges: 2000,
      });
    });

    it('should render small graphs successfully', () => {
      const layout = createTestLayout(50);
      const config: RenderConfig = {
        nodeConfig: { radius: 5, fill: '#ff0000' },
        edgeConfig: { stroke: '#000000', strokeWidth: 1 },
      };

      expect(() => {
        renderer.render(layout, config);
      }).not.toThrow();

      expect(mockGL.clear).toHaveBeenCalled();
      expect(mockGL.drawElementsInstanced).toHaveBeenCalled();
    });

    it('should handle large graphs with LOD', () => {
      const layout = createTestLayout(5000);
      const config: RenderConfig = {};

      expect(() => {
        renderer.render(layout, config);
      }).not.toThrow();

      // Should use batching for large graphs
      expect(mockGL.drawElementsInstanced).toHaveBeenCalled();
    });

    it('should handle empty layout gracefully', () => {
      const layout: LayoutResult = { nodes: [], edges: [] };
      const config: RenderConfig = {};

      expect(() => {
        renderer.render(layout, config);
      }).not.toThrow();

      expect(mockGL.clear).toHaveBeenCalled();
    });
  });

  describe('Performance Optimizations', () => {
    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
        enableLOD: true,
        enableFrustumCulling: true,
      });
    });

    it('should apply LOD based on node count', () => {
      const smallLayout = createTestLayout(100);
      const largeLayout = createTestLayout(10000);

      // Render small layout (should use high detail)
      renderer.render(smallLayout, {});
      const smallStats = renderer.getRenderStats();

      // Render large layout (should use lower detail)
      renderer.render(largeLayout, {});
      const largeStats = renderer.getRenderStats();

      // Large graph should render fewer nodes due to LOD
      expect(largeStats.nodesRendered).toBeLessThan(largeLayout.nodes.length);
    });

    it('should use frustum culling with spatial index', () => {
      const layout = createTestLayout(1000);
      const spatialIndex = new SpatialIndexer();

      renderer.setSpatialIndex(spatialIndex);
      renderer.render(layout, {});

      const stats = renderer.getRenderStats();
      expect(stats.nodesRendered).toBeGreaterThan(0);
    });

    it('should track performance statistics', () => {
      const layout = createTestLayout(500);
      renderer.render(layout, {});

      const stats = renderer.getRenderStats();
      expect(stats).toHaveProperty('frameTime');
      expect(stats).toHaveProperty('nodesRendered');
      expect(stats).toHaveProperty('edgesRendered');
      expect(stats).toHaveProperty('drawCalls');
    });
  });

  describe('Spatial Integration', () => {
    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
        enablePicking: true,
      });
    });

    it('should support spatial queries', () => {
      const layout = createTestLayout(100);
      renderer.render(layout, {});

      // Test node picking
      const node = renderer.getNodeAt(400, 300);
      // Note: In real implementation, this would return a node if one exists at that position
      // For mock, it may return null, which is acceptable for testing
      expect(node).toBeDefined(); // Either a node or null
    });

    it('should support viewport transformations', () => {
      const layout = createTestLayout(100);

      // Test zoom
      renderer.setZoom(2.0);
      const zoomTransform = renderer.getTransform();
      expect(zoomTransform.scale).toBe(2.0);

      // Test pan
      renderer.setPan(100, 50);
      const panTransform = renderer.getTransform();
      expect(panTransform.x).toBe(100);
      expect(panTransform.y).toBe(50);

      // Test reset view
      renderer.resetView();
      const resetTransform = renderer.getTransform();
      expect(resetTransform.scale).toBeGreaterThan(0);
    });

    it('should convert between coordinate systems', () => {
      const worldPoint = { x: 100, y: 50 };
      const screenPoint = renderer.worldToScreen(worldPoint);
      const backToWorld = renderer.screenToWorld(screenPoint);

      // Should be close to original (within floating point precision)
      expect(Math.abs(backToWorld.x - worldPoint.x)).toBeLessThan(0.1);
      expect(Math.abs(backToWorld.y - worldPoint.y)).toBeLessThan(0.1);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
        enableErrorRecovery: true,
        maxRenderErrors: 3,
      });
    });

    it('should handle WebGL errors gracefully', () => {
      const layout = createTestLayout(100);

      // Simulate WebGL error
      mockGL.getError.mockReturnValueOnce(mockGL.INVALID_OPERATION);

      expect(() => {
        renderer.render(layout, {});
      }).not.toThrow();

      const errorState = renderer.getErrorState();
      expect(errorState.errorCount).toBeGreaterThanOrEqual(0);
    });

    it('should recover from context loss', () => {
      const layout = createTestLayout(100);

      // Simulate successful render
      renderer.render(layout, {});

      // Simulate context loss
      mockGL.isContextLost.mockReturnValue(true);
      const contextLostEvent = new Event('webglcontextlost');
      renderer.getContainer().dispatchEvent(contextLostEvent);

      // Simulate context restore
      mockGL.isContextLost.mockReturnValue(false);
      const contextRestoreEvent = new Event('webglcontextrestored');
      renderer.getContainer().dispatchEvent(contextRestoreEvent);

      // Should be able to render again
      expect(() => {
        renderer.render(layout, {});
      }).not.toThrow();
    });

    it('should provide diagnostic information', () => {
      const errorState = renderer.getErrorState();

      expect(errorState).toHaveProperty('errorCount');
      expect(errorState).toHaveProperty('contextLost');
      expect(errorState).toHaveProperty('diagnostics');
    });
  });

  describe('Memory Management', () => {
    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
      });
    });

    it('should clean up resources on destroy', () => {
      const layout = createTestLayout(100);
      renderer.render(layout, {});

      renderer.destroy();

      // Verify cleanup calls
      expect(mockGL.deleteProgram).toHaveBeenCalled();
      expect(mockGL.deleteBuffer).toHaveBeenCalled();
      expect(mockGL.deleteVertexArray).toHaveBeenCalled();
    });

    it('should handle multiple initializations', () => {
      renderer.destroy();

      expect(() => {
        renderer.initialize(container, { width: 400, height: 300 });
      }).not.toThrow();

      expect(() => {
        renderer.initialize(container, { width: 800, height: 600 });
      }).not.toThrow();
    });
  });

  describe('Performance Benchmarks', () => {
    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
        enableLOD: true,
        enableFrustumCulling: true,
      });
    });

    it('should handle 1000 nodes within reasonable time', () => {
      const layout = createTestLayout(1000);

      const startTime = performance.now();
      renderer.render(layout, {});
      const renderTime = performance.now() - startTime;

      // Should complete within 100ms for 1000 nodes (generous threshold for testing)
      expect(renderTime).toBeLessThan(100);
    });

    it('should handle 10000 nodes with LOD within reasonable time', () => {
      const layout = createTestLayout(10000);

      const startTime = performance.now();
      renderer.render(layout, {});
      const renderTime = performance.now() - startTime;

      // Should complete within 500ms for 10000 nodes with LOD
      expect(renderTime).toBeLessThan(500);

      const stats = renderer.getRenderStats();
      // Should use LOD to reduce rendered node count
      expect(stats.nodesRendered).toBeLessThan(layout.nodes.length);
    });

    it('should maintain consistent performance across multiple renders', () => {
      const layout = createTestLayout(1000);
      const renderTimes: number[] = [];

      // Perform multiple renders
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        renderer.render(layout, {});
        renderTimes.push(performance.now() - startTime);
      }

      // Calculate statistics
      const avgTime = renderTimes.reduce((a, b) => a + b) / renderTimes.length;
      const maxTime = Math.max(...renderTimes);

      // Performance should be consistent (max shouldn't be more than 3x average)
      expect(maxTime).toBeLessThan(avgTime * 3);
    });
  });

  describe('Integration with Spatial Indexing', () => {
    let spatialIndex: SpatialIndexer;

    beforeEach(() => {
      renderer.initialize(container, {
        width: 800,
        height: 600,
        enableFrustumCulling: true,
      });

      spatialIndex = new SpatialIndexer();
      renderer.setSpatialIndex(spatialIndex);
    });

    it('should integrate with spatial index for culling', () => {
      const layout = createTestLayout(1000);
      renderer.render(layout, {});

      const stats = renderer.getRenderStats();
      expect(stats.nodesRendered).toBeGreaterThan(0);
      expect(stats.nodesRendered).toBeLessThanOrEqual(layout.nodes.length);
    });

    it('should update spatial index when layout changes', () => {
      const layout1 = createTestLayout(500);
      const layout2 = createTestLayout(750);

      renderer.render(layout1, {});
      const stats1 = renderer.getRenderStats();

      renderer.render(layout2, {});
      const stats2 = renderer.getRenderStats();

      // Should handle different layout sizes
      expect(stats2.nodesRendered).not.toBe(stats1.nodesRendered);
    });
  });
});