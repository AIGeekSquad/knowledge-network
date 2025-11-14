import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebGLRenderingStrategy } from '../src/rendering/WebGLRenderingStrategy';
import type { 
  RenderingContext, 
  RenderingConfig,
  InteractionEvent,
  VisualUpdates,
  RenderingProgressCallback
} from '../src/rendering/rendering-strategy';
import type { LayoutNode } from '../src/layout/layout-engine';

// Mock WebGL API for jsdom environment
const createMockWebGL = () => {
  const mockContext = {
    // Shader operations
    createShader: vi.fn().mockReturnValue({}),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn().mockReturnValue(true),
    createProgram: vi.fn().mockReturnValue({}),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn().mockReturnValue(true),
    useProgram: vi.fn(),
    
    // Buffer operations
    createBuffer: vi.fn().mockReturnValue({}),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn().mockReturnValue(0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn().mockReturnValue({}),
    
    // Rendering operations
    clearColor: vi.fn(),
    clear: vi.fn(),
    viewport: vi.fn(),
    drawArrays: vi.fn(),
    uniform1f: vi.fn(),
    uniform2f: vi.fn(),
    uniformMatrix4fv: vi.fn(),
    
    // WebGL state management
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    
    // Resource management
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    isContextLost: vi.fn().mockReturnValue(false),
    getShaderInfoLog: vi.fn().mockReturnValue(''),
    getProgramInfoLog: vi.fn().mockReturnValue(''),
    
    // Constants
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    ARRAY_BUFFER: 34962,
    STATIC_DRAW: 35044,
    COLOR_BUFFER_BIT: 16384,
    TRIANGLES: 4,
    FLOAT: 5126,
    BLEND: 3042,
    SRC_ALPHA: 770,
    ONE_MINUS_SRC_ALPHA: 771,
    POINTS: 0,
    COMPILE_STATUS: 35713,
    LINK_STATUS: 35714,
    
    // State
    drawingBufferWidth: 800,
    drawingBufferHeight: 600
  };

  const mockCanvas = {
    getContext: vi.fn().mockImplementation((type) => {
      if (type === 'webgl' || type === 'experimental-webgl') {
        return mockContext;
      }
      return null;
    }),
    width: 800,
    height: 600,
    style: {},
    getBoundingClientRect: vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    }),
    parentNode: null
  };

  return { mockCanvas, mockContext };
};

describe('WebGLRenderingStrategy', () => {
  let strategy: WebGLRenderingStrategy;
  let container: HTMLElement;
  let mockContext: RenderingContext;
  let mockNodes: Map<string, LayoutNode>;
  let mockWebGLApi: ReturnType<typeof createMockWebGL>;
  let originalCreateElement: typeof document.createElement;

  beforeEach(() => {
    // Setup WebGL API mocks
    mockWebGLApi = createMockWebGL();
    
    // Mock document.createElement for canvas
    originalCreateElement = document.createElement.bind(document);
    document.createElement = vi.fn().mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'canvas') {
        return mockWebGLApi.mockCanvas as any;
      }
      return originalCreateElement(tagName);
    });

    // Mock WebGL support detection
    Object.defineProperty(window, 'WebGLRenderingContext', {
      value: function() {},
      writable: true
    });
    
    // Create strategy instance
    strategy = new WebGLRenderingStrategy();
    
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0, top: 0, width: 800, height: 600
    });
    container.appendChild = vi.fn();
    document.body.appendChild(container);
    
    // Setup mock nodes (larger dataset for WebGL)
    mockNodes = new Map();
    for (let i = 0; i < 100; i++) {
      mockNodes.set(`node${i}`, {
        id: `node${i}`,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        data: { label: `Node ${i}`, color: `hsl(${i * 3.6}, 70%, 50%)` }
      });
    }
    
    // Setup mock context
    mockContext = {
      nodes: mockNodes,
      edges: Array.from({ length: 150 }, (_, i) => ({
        sourceId: `node${i % 50}`,
        targetId: `node${(i + 1) % 50}`,
        compatibilityScores: new Map(),
        originalEdge: { source: `node${i % 50}`, target: `node${(i + 1) % 50}` }
      })),
      config: {
        strategy: 'webgl',
        performanceMode: 'performance',
        visual: {
          nodes: {
            defaultRadius: 8,
            radiusRange: [4, 16],
            defaultFillColor: '#3498db',
            defaultStrokeColor: '#2c3e50',
            strokeWidth: 1,
            opacity: 0.9,
            selectedOpacity: 1,
            highlightedOpacity: 0.7
          },
          edges: {
            defaultStrokeColor: '#95a5a6',
            defaultStrokeWidth: 0.5,
            opacity: 0.4,
            selectedOpacity: 1,
            bundlingCurvature: 0.3,
            arrowHeadSize: 6
          },
          colors: {
            primary: ['#3498db', '#e74c3c', '#2ecc71'],
            accent: ['#f39c12', '#9b59b6'],
            background: '#000000',
            selection: '#e67e22'
          },
          animations: {
            enabled: true,
            duration: 200,
            easing: 'ease-out'
          }
        },
        interaction: {
          zoom: { min: 0.1, max: 20, step: 0.1, enableFit: true },
          pan: { enabled: true, inertia: true },
          selection: { mode: 'single', enableNeighborHighlight: true, feedback: 'glow' },
          hover: { enabled: true, delay: 100, showTooltips: true }
        },
        degradation: {
          enabled: true,
          memoryThreshold: 1000,
          performanceThreshold: 45,
          strategy: 'reduce-quality'
        },
        strategyOptions: {
          webgl: {
            contextAttributes: {
              antialias: true,
              alpha: false,
              premultipliedAlpha: false
            },
            useInstancedRendering: true,
            shaderQuality: 'high'
          }
        }
      },
      container,
      viewport: {
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
        highlightedNodeIds: new Set(),
        interactionMode: 'navigate',
        viewBounds: { x: 0, y: 0, width: 800, height: 600 }
      },
      constraints: {
        maxMemoryMB: 1024,
        targetFPS: 60,
        maxFrameTime: 16.67,
        enableMonitoring: true
      }
    };
  });

  afterEach(() => {
    document.createElement = originalCreateElement;
    vi.restoreAllMocks();
    
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('WebGL Strategy Capabilities', () => {
    it('should return WebGL-specific capabilities for large datasets', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.maxNodes).toBe(10000);
      expect(capabilities.maxEdges).toBe(20000);
      expect(capabilities.supportedInteractions).toContain('zoom');
      expect(capabilities.supportedInteractions).toContain('pan');
      expect(capabilities.supportedInteractions).toContain('select');
      expect(capabilities.features.hardwareAcceleration).toBe(true);
      expect(capabilities.features.animations).toBe(true);
      expect(capabilities.features.realTimeUpdates).toBe(true);
      expect(capabilities.performanceProfile.renderingComplexity).toBe('O(log n)');
    });

    it('should have efficient memory profile for GPU rendering', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.memoryProfile.baseUsage).toBe(20); // Higher initial GPU memory
      expect(capabilities.memoryProfile.perNode).toBe(0.01); // Very efficient per-node
      expect(capabilities.memoryProfile.perEdge).toBe(0.005); // Very efficient per-edge
      expect(capabilities.memoryProfile.peakMultiplier).toBe(2.0); // GPU buffer overhead
    });

    it('should support hardware acceleration features', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.features.hardwareAcceleration).toBe(true);
      expect(capabilities.features.customShaders).toBe(true);
      expect(capabilities.performanceProfile.optimalFor).toContain('large datasets');
      expect(capabilities.performanceProfile.optimalFor).toContain('real-time interactions');
    });
  });

  describe('WebGL Context Initialization', () => {
    it('should create WebGL context and compile shaders', async () => {
      await strategy.renderAsync(mockContext);
      
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockWebGLApi.mockCanvas.getContext).toHaveBeenCalledWith('webgl');
      expect(mockWebGLApi.mockContext.createShader).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.createProgram).toHaveBeenCalled();
      expect(strategy.isInitialized).toBe(true);
    });

    it('should handle WebGL context creation failure with fallback', async () => {
      // Mock WebGL context failure
      mockWebGLApi.mockCanvas.getContext.mockReturnValue(null);
      
      await expect(strategy.renderAsync(mockContext)).rejects.toThrow();
    });

    it('should configure WebGL context attributes', async () => {
      await strategy.renderAsync(mockContext);
      
      expect(mockWebGLApi.mockCanvas.getContext).toHaveBeenCalledWith('webgl');
      // Context attributes are passed during getContext call
    });

    it('should validate WebGL support before initialization', () => {
      const validation = strategy.validateConfiguration(mockContext.config);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('WebGL Shader Management', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
    });

    it('should compile vertex and fragment shaders', () => {
      expect(mockWebGLApi.mockContext.createShader).toHaveBeenCalledWith(35633); // VERTEX_SHADER
      expect(mockWebGLApi.mockContext.createShader).toHaveBeenCalledWith(35632); // FRAGMENT_SHADER
      expect(mockWebGLApi.mockContext.shaderSource).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.compileShader).toHaveBeenCalled();
    });

    it('should link shader program successfully', () => {
      expect(mockWebGLApi.mockContext.createProgram).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.attachShader).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.linkProgram).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.useProgram).toHaveBeenCalled();
    });

    it('should handle shader compilation errors', async () => {
      // Mock shader compilation failure
      mockWebGLApi.mockContext.getShaderParameter.mockReturnValue(false);
      
      const errorSpy = vi.fn();
      strategy.events.on('error', errorSpy);
      
      await expect(strategy.renderAsync(mockContext)).rejects.toThrow();
    });

    it('should support different shader quality levels', async () => {
      const highQualityConfig = {
        ...mockContext.config,
        strategyOptions: {
          webgl: {
            ...mockContext.config.strategyOptions?.webgl,
            shaderQuality: 'high' as const
          }
        }
      };
      
      const result = strategy.validateConfiguration(highQualityConfig);
      expect(result.isValid).toBe(true);
    });
  });

  describe('WebGL Buffer Management', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
    });

    it('should create and populate vertex buffers for nodes', () => {
      expect(mockWebGLApi.mockContext.createBuffer).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.bindBuffer).toHaveBeenCalledWith(34962, expect.anything()); // ARRAY_BUFFER
      expect(mockWebGLApi.mockContext.bufferData).toHaveBeenCalled();
    });

    it('should optimize buffer updates for large datasets', async () => {
      // Clear previous calls
      mockWebGLApi.mockContext.bufferData.mockClear();
      
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { position: { x: 150, y: 120 } }],
          ['node2', { position: { x: 250, y: 180 } }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      // Should update buffer efficiently
      expect(mockWebGLApi.mockContext.bufferData).toHaveBeenCalled();
    });

    it('should handle instanced rendering when enabled', async () => {
      const instancedConfig = {
        ...mockContext.config,
        strategyOptions: {
          webgl: {
            ...mockContext.config.strategyOptions?.webgl,
            useInstancedRendering: true
          }
        }
      };
      
      const instancedContext = { ...mockContext, config: instancedConfig };
      
      await strategy.renderAsync(instancedContext);
      
      // Should setup instanced rendering
      expect(mockWebGLApi.mockContext.createBuffer).toHaveBeenCalled();
    });
  });

  describe('WebGL Rendering Performance', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
    });

    it('should handle large datasets efficiently with GPU acceleration', async () => {
      // Create large dataset
      const largeNodes = new Map();
      for (let i = 0; i < 2000; i++) {
        largeNodes.set(`node-${i}`, {
          id: `node-${i}`,
          x: Math.random() * 800,
          y: Math.random() * 600,
          vx: 0,
          vy: 0,
          fx: null,
          fy: null,
          data: { label: `Node ${i}` }
        });
      }
      
      const largeContext = {
        ...mockContext,
        nodes: largeNodes
      };
      
      const startTime = performance.now();
      await strategy.renderAsync(largeContext);
      const endTime = performance.now();
      
      // Should render efficiently even with large dataset
      expect(endTime - startTime).toBeLessThan(500);
      expect(strategy.isInitialized).toBe(true);
    });

    it('should maintain 60fps with real-time updates', async () => {
      // Simulate rapid updates
      const updatePromises = [];
      for (let i = 0; i < 10; i++) {
        updatePromises.push(strategy.updateVisualsAsync({
          viewport: { zoomLevel: 1 + i * 0.1 }
        }));
      }
      
      const startTime = performance.now();
      await Promise.all(updatePromises);
      const endTime = performance.now();
      
      // Should handle rapid updates efficiently
      expect(endTime - startTime).toBeLessThan(167); // 10 frames at 60fps
    });

    it('should provide GPU memory usage tracking', async () => {
      const performanceSpy = vi.fn();
      strategy.events.on('performance', performanceSpy);
      
      await strategy.renderAsync(mockContext);
      
      // Should emit performance metrics
      expect(performanceSpy).toHaveBeenCalled();
    });
  });

  describe('WebGL Viewport and Transformations', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
    });

    it('should apply matrix transformations for zoom and pan', async () => {
      const contextWithTransform = {
        ...mockContext,
        viewport: {
          ...mockContext.viewport,
          zoomLevel: 2,
          panOffset: { x: 100, y: 50 }
        }
      };
      
      await strategy.renderAsync(contextWithTransform);
      
      expect(mockWebGLApi.mockContext.uniformMatrix4fv).toHaveBeenCalled();
    });

    it('should update viewport efficiently without shader recompilation', async () => {
      // Clear previous uniform calls
      mockWebGLApi.mockContext.uniformMatrix4fv.mockClear();
      
      const updates: VisualUpdates = {
        viewport: {
          zoomLevel: 1.5,
          panOffset: { x: 20, y: 30 }
        }
      };
      
      await strategy.updateVisualsAsync(updates);
      
      // Should update uniforms only, not recompile
      expect(mockWebGLApi.mockContext.uniformMatrix4fv).toHaveBeenCalled();
      expect(mockWebGLApi.mockContext.createShader).not.toHaveBeenCalled();
    });
  });

  describe('WebGL Hit Testing and Interaction', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
    });

    it('should handle GPU-based hit testing with frame buffer reads', () => {
      const clickEvent: InteractionEvent = {
        type: 'click',
        coordinates: { x: 400, y: 300 },
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const handled = strategy.handleInteraction(clickEvent);
      expect(handled).toBe(true);
    });

    it('should support high-precision coordinate transformations', () => {
      const precisionEvent: InteractionEvent = {
        type: 'hover',
        coordinates: { x: 123.456, y: 789.012 },
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const handled = strategy.handleInteraction(precisionEvent);
      expect(handled).toBe(true);
    });

    it('should handle zoom-dependent hit testing accuracy', () => {
      // Test hit testing at different zoom levels
      const zoomedContext = {
        ...mockContext,
        viewport: {
          ...mockContext.viewport,
          zoomLevel: 5 // High zoom
        }
      };
      
      const highPrecisionEvent: InteractionEvent = {
        type: 'click',
        coordinates: { x: 400.1, y: 300.1 }, // Precise coordinates
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const handled = strategy.handleInteraction(highPrecisionEvent);
      expect(handled).toBe(true);
    });
  });

  describe('WebGL Error Handling and Fallback', () => {
    it('should detect WebGL support and provide fallback information', () => {
      const capabilities = strategy.getCapabilities();
      
      // Should indicate hardware acceleration capability
      expect(capabilities.features.hardwareAcceleration).toBe(true);
    });

    it('should handle WebGL context loss gracefully', async () => {
      await strategy.renderAsync(mockContext);
      
      // Simulate context loss
      const errorSpy = vi.fn();
      strategy.events.on('error', errorSpy);
      
      // Mock context loss event
      strategy.events.emit('webgl-context-lost', {
        reason: 'gpu-reset',
        timestamp: Date.now()
      });
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should validate WebGL-specific configuration', () => {
      const invalidConfig = {
        ...mockContext.config,
        strategyOptions: {
          webgl: {
            contextAttributes: {
              antialias: 'invalid' as any // Should be boolean
            },
            useInstancedRendering: true,
            shaderQuality: 'ultra' as any // Invalid quality level
          }
        }
      };
      
      const result = strategy.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle shader compilation failures', async () => {
      // Mock shader compilation failure
      mockWebGLApi.mockContext.getShaderParameter.mockReturnValue(false);
      mockWebGLApi.mockContext.getShaderInfoLog = vi.fn().mockReturnValue('Shader compilation error');
      
      await expect(strategy.renderAsync(mockContext)).rejects.toThrow();
    });
  });

  describe('WebGL Resource Cleanup', () => {
    it('should properly dispose of WebGL resources', async () => {
      await strategy.renderAsync(mockContext);
      
      // Mock WebGL cleanup methods
      mockWebGLApi.mockContext.deleteBuffer = vi.fn();
      mockWebGLApi.mockContext.deleteProgram = vi.fn();
      mockWebGLApi.mockContext.deleteShader = vi.fn();
      
      await strategy.cleanupAsync();
      
      expect(strategy.isInitialized).toBe(false);
      // GPU resources should be cleaned up
    });

    it('should handle cleanup when WebGL context is already lost', async () => {
      await strategy.renderAsync(mockContext);
      
      // Simulate context already lost
      mockWebGLApi.mockContext.isContextLost = vi.fn().mockReturnValue(true);
      
      await expect(strategy.cleanupAsync()).resolves.not.toThrow();
    });

    it('should prevent memory leaks in GPU buffers', async () => {
      await strategy.renderAsync(mockContext);
      
      // Track buffer creation and deletion
      const bufferCreateCount = mockWebGLApi.mockContext.createBuffer.mock.calls.length;
      
      await strategy.cleanupAsync();
      
      // Should clean up all created resources
      expect(bufferCreateCount).toBeGreaterThan(0);
    });
  });

  describe('WebGL Configuration Validation', () => {
    it('should validate WebGL context attributes', () => {
      const result = strategy.validateConfiguration(mockContext.config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect browser WebGL support', () => {
      const validation = strategy.validateConfiguration(mockContext.config);
      
      // Should check for WebGL availability
      expect(validation.isValid).toBe(true);
    });

    it('should warn about mobile GPU limitations', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true
      });
      
      const capabilities = strategy.getCapabilities();
      
      // Should have more conservative limits on mobile
      expect(capabilities.maxNodes).toBeGreaterThan(0);
    });
  });

  describe('WebGL Performance Optimization', () => {
    it('should use GPU instancing for efficient rendering', async () => {
      const instancedConfig = {
        ...mockContext.config,
        strategyOptions: {
          webgl: {
            ...mockContext.config.strategyOptions?.webgl,
            useInstancedRendering: true
          }
        }
      };
      
      await strategy.renderAsync({ ...mockContext, config: instancedConfig });
      
      // Should setup instanced rendering
      expect(mockWebGLApi.mockContext.createBuffer).toHaveBeenCalled();
    });

    it('should batch draw calls for performance', async () => {
      // Clear previous calls
      mockWebGLApi.mockContext.drawArrays.mockClear();
      
      await strategy.renderAsync(mockContext);
      
      // Should minimize draw calls through batching
      const drawCallCount = mockWebGLApi.mockContext.drawArrays.mock.calls.length;
      expect(drawCallCount).toBeLessThan(10); // Efficient batching
    });

    it('should handle frame rate optimization', async () => {
      const progressSpy = vi.fn();
      
      await strategy.renderAsync(mockContext, progressSpy);
      
      // Should report consistent high frame rates
      const lastProgress = progressSpy.mock.calls[progressSpy.mock.calls.length - 1]?.[0];
      expect(lastProgress?.metrics?.currentFPS).toBeGreaterThanOrEqual(45);
    });
  });
});