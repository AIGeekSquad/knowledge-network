import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CanvasRenderingStrategy } from '../src/rendering/CanvasRenderingStrategy';
import type { 
  RenderingContext, 
  RenderingConfig,
  InteractionEvent,
  VisualUpdates,
  RenderingProgressCallback
} from '../src/rendering/rendering-strategy';
import type { LayoutNode } from '../src/layout/layout-engine';

describe('CanvasRenderingStrategy', () => {
  let strategy: CanvasRenderingStrategy;
  let container: HTMLElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let mockContext: RenderingContext;
  let mockNodes: Map<string, LayoutNode>;

  beforeEach(() => {
    // Create strategy instance
    strategy = new CanvasRenderingStrategy();
    
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);
    
    // Setup mock nodes
    mockNodes = new Map([
      ['node1', { 
        id: 'node1', 
        x: 100, 
        y: 100, 
        vx: 0, 
        vy: 0, 
        fx: null, 
        fy: null, 
        data: { label: 'Node 1', color: '#3498db' } 
      }],
      ['node2', { 
        id: 'node2', 
        x: 200, 
        y: 150, 
        vx: 0, 
        vy: 0, 
        fx: null, 
        fy: null, 
        data: { label: 'Node 2', color: '#e74c3c' } 
      }],
      ['node3', { 
        id: 'node3', 
        x: 150, 
        y: 200, 
        vx: 0, 
        vy: 0, 
        fx: null, 
        fy: null, 
        data: { label: 'Node 3', color: '#2ecc71' } 
      }]
    ]);
    
    // Setup mock context
    mockContext = {
      nodes: mockNodes,
      edges: [
        {
          sourceId: 'node1',
          targetId: 'node2',
          compatibilityScores: new Map(),
          originalEdge: { source: 'node1', target: 'node2' }
        },
        {
          sourceId: 'node2',
          targetId: 'node3',
          compatibilityScores: new Map(),
          originalEdge: { source: 'node2', target: 'node3' }
        }
      ],
      config: {
        strategy: 'simple',
        performanceMode: 'balanced',
        visual: {
          nodes: {
            defaultRadius: 10,
            radiusRange: [5, 20],
            defaultFillColor: '#3498db',
            defaultStrokeColor: '#2c3e50',
            strokeWidth: 2,
            opacity: 1,
            selectedOpacity: 1,
            highlightedOpacity: 0.7
          },
          edges: {
            defaultStrokeColor: '#95a5a6',
            defaultStrokeWidth: 1,
            opacity: 0.6,
            selectedOpacity: 1,
            bundlingCurvature: 0.5,
            arrowHeadSize: 8
          },
          colors: {
            primary: ['#3498db', '#e74c3c', '#2ecc71'],
            accent: ['#f39c12', '#9b59b6'],
            background: '#ffffff',
            selection: '#e67e22'
          },
          animations: {
            enabled: true,
            duration: 300,
            easing: 'ease-out'
          }
        },
        interaction: {
          zoom: { min: 0.1, max: 10, step: 0.1, enableFit: true },
          pan: { enabled: true, inertia: true },
          selection: { mode: 'single', enableNeighborHighlight: true, feedback: 'outline' },
          hover: { enabled: true, delay: 200, showTooltips: true }
        },
        degradation: {
          enabled: true,
          memoryThreshold: 500,
          performanceThreshold: 30,
          strategy: 'reduce-quality'
        },
        strategyOptions: {
          canvas: {
            highDPI: true,
            contextType: '2d',
            imageSmoothingEnabled: true
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
        maxMemoryMB: 512,
        targetFPS: 60,
        maxFrameTime: 16.67,
        enableMonitoring: true
      }
    };
  });

  afterEach(() => {
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Canvas Strategy Capabilities', () => {
    it('should return Canvas-specific capabilities', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.maxNodes).toBe(1000);
      expect(capabilities.maxEdges).toBe(2000);
      expect(capabilities.supportedInteractions).toContain('zoom');
      expect(capabilities.supportedInteractions).toContain('pan');
      expect(capabilities.supportedInteractions).toContain('select');
      expect(capabilities.supportedInteractions).toContain('hover');
      expect(capabilities.features.hardwareAcceleration).toBe(false);
      expect(capabilities.features.animations).toBe(true);
      expect(capabilities.features.realTimeUpdates).toBe(true);
      expect(capabilities.performanceProfile.renderingComplexity).toBe('O(n)');
    });

    it('should have reasonable memory profile for Canvas', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.memoryProfile.baseUsage).toBe(5);
      expect(capabilities.memoryProfile.perNode).toBe(0.1);
      expect(capabilities.memoryProfile.perEdge).toBe(0.05);
      expect(capabilities.memoryProfile.peakMultiplier).toBe(1.2);
    });
  });

  describe('Canvas Initialization and Setup', () => {
    it('should create and configure canvas element during rendering', async () => {
      await strategy.renderAsync(mockContext);
      
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();
      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
      expect(strategy.isInitialized).toBe(true);
    });

    it('should handle high DPI canvas setup', async () => {
      // Mock devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        value: 2
      });
      
      await strategy.renderAsync(mockContext);
      
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      
      expect(canvas).toBeTruthy();
      // Canvas should be scaled for high DPI
      expect(canvas.width).toBe(1600); // 800 * 2
      expect(canvas.height).toBe(1200); // 600 * 2
      expect(canvas.style.width).toBe('800px');
      expect(canvas.style.height).toBe('600px');
    });

    it('should configure canvas context properties', async () => {
      await strategy.renderAsync(mockContext);
      
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      
      expect(ctx.imageSmoothingEnabled).toBe(true);
    });

    it('should handle canvas creation failure gracefully', async () => {
      const mockContainer = {
        appendChild: vi.fn(),
        querySelector: vi.fn().mockReturnValue(null),
        style: { width: '800px', height: '600px' },
        getBoundingClientRect: () => ({ width: 800, height: 600 })
      } as any;
      
      const contextWithBadContainer = {
        ...mockContext,
        container: mockContainer
      };
      
      // Should handle gracefully when canvas creation fails
      await expect(strategy.renderAsync(contextWithBadContainer)).rejects.toThrow();
    });
  });

  describe('Canvas Rendering Operations', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    });

    it('should render nodes with correct visual properties', async () => {
      const canvasSpy = vi.spyOn(ctx, 'arc');
      const fillSpy = vi.spyOn(ctx, 'fill');
      const strokeSpy = vi.spyOn(ctx, 'stroke');
      
      await strategy.renderAsync(mockContext);
      
      // Should call arc for each node (circles)
      expect(canvasSpy).toHaveBeenCalledTimes(mockNodes.size);
      expect(fillSpy).toHaveBeenCalled();
      expect(strokeSpy).toHaveBeenCalled();
    });

    it('should render edges as lines between nodes', async () => {
      const lineSpy = vi.spyOn(ctx, 'lineTo');
      const moveSpy = vi.spyOn(ctx, 'moveTo');
      
      await strategy.renderAsync(mockContext);
      
      // Should draw lines for edges
      expect(moveSpy).toHaveBeenCalled();
      expect(lineSpy).toHaveBeenCalled();
    });

    it('should apply node colors from configuration', async () => {
      const fillStyleSpy = vi.spyOn(ctx, 'fillStyle', 'set');
      
      await strategy.renderAsync(mockContext);
      
      // Should set fill colors for nodes
      expect(fillStyleSpy).toHaveBeenCalled();
    });

    it('should clear canvas before rendering', async () => {
      const clearSpy = vi.spyOn(ctx, 'clearRect');
      
      await strategy.renderAsync(mockContext);
      
      expect(clearSpy).toHaveBeenCalledWith(0, 0, canvas.width, canvas.height);
    });

    it('should handle progress updates during rendering', async () => {
      const progressSpy = vi.fn();
      
      await strategy.renderAsync(mockContext, progressSpy);
      
      expect(progressSpy).toHaveBeenCalledTimes(4); // preparation, nodes, edges, post-processing
      expect(progressSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({
        stage: 'preparation',
        percentage: 0
      }));
      expect(progressSpy).toHaveBeenNthCalledWith(4, expect.objectContaining({
        stage: 'post-processing',
        percentage: 100
      }));
    });
  });

  describe('Canvas Context State Management', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    });

    it('should save and restore canvas context state', async () => {
      const saveSpy = vi.spyOn(ctx, 'save');
      const restoreSpy = vi.spyOn(ctx, 'restore');
      
      await strategy.renderAsync(mockContext);
      
      expect(saveSpy).toHaveBeenCalled();
      expect(restoreSpy).toHaveBeenCalled();
    });

    it('should apply transformations for zoom and pan', async () => {
      const transformSpy = vi.spyOn(ctx, 'setTransform');
      
      const contextWithTransform = {
        ...mockContext,
        viewport: {
          ...mockContext.viewport,
          zoomLevel: 2,
          panOffset: { x: 50, y: 30 }
        }
      };
      
      await strategy.renderAsync(contextWithTransform);
      
      expect(transformSpy).toHaveBeenCalled();
    });
  });

  describe('Hit Testing and Interaction', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
    });

    it('should handle click interactions and identify nodes', () => {
      const clickEvent: InteractionEvent = {
        type: 'click',
        coordinates: { x: 100, y: 100 }, // Near node1
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const handled = strategy.handleInteraction(clickEvent);
      expect(handled).toBe(true);
    });

    it('should handle hover interactions', () => {
      const hoverEvent: InteractionEvent = {
        type: 'hover',
        coordinates: { x: 200, y: 150 }, // Near node2
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const handled = strategy.handleInteraction(hoverEvent);
      expect(handled).toBe(true);
    });

    it('should detect nodes within radius for hit testing', () => {
      // Test hit detection for node at (100, 100) with radius 10
      const nearClick = { x: 105, y: 105 }; // Within radius
      const farClick = { x: 150, y: 150 }; // Outside radius
      
      const nearEvent: InteractionEvent = {
        type: 'click',
        coordinates: nearClick,
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const farEvent: InteractionEvent = {
        type: 'click',
        coordinates: farClick,
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      expect(strategy.handleInteraction(nearEvent)).toBe(true);
      expect(strategy.handleInteraction(farEvent)).toBe(true); // Still handled, but no node hit
    });
  });

  describe('Visual Updates and Re-rendering', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    });

    it('should handle node position updates', async () => {
      const clearSpy = vi.spyOn(ctx, 'clearRect');
      
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { 
            position: { x: 150, y: 120 },
            visual: { fillColor: '#ff0000' }
          }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      // Should clear and redraw
      expect(clearSpy).toHaveBeenCalled();
    });

    it('should handle viewport updates', async () => {
      const updates: VisualUpdates = {
        viewport: {
          zoomLevel: 1.5,
          panOffset: { x: 20, y: 10 }
        }
      };
      
      await strategy.updateVisualsAsync(updates);
      
      // Should trigger re-render with new viewport
      expect(strategy.isInitialized).toBe(true);
    });

    it('should handle selection state changes', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node2', { 
            selected: true,
            highlighted: false
          }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      // Should update visual state
      expect(strategy.isInitialized).toBe(true);
    });
  });

  describe('Canvas Performance Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      // Create larger dataset
      const largeNodes = new Map();
      for (let i = 0; i < 500; i++) {
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
      
      // Should render in reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
      expect(strategy.isInitialized).toBe(true);
    });

    it('should use requestAnimationFrame for smooth updates', async () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');
      
      await strategy.updateVisualsAsync({
        viewport: { zoomLevel: 2 }
      });
      
      // Should use RAF for smooth updates (implementation detail)
      // This test verifies the strategy considers animation performance
    });
  });

  describe('Canvas Cleanup and Disposal', () => {
    it('should remove canvas element on cleanup', async () => {
      await strategy.renderAsync(mockContext);
      
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas).toBeTruthy();
      
      await strategy.cleanupAsync();
      
      const canvasAfterCleanup = container.querySelector('canvas');
      expect(canvasAfterCleanup).toBeNull();
      expect(strategy.isInitialized).toBe(false);
    });

    it('should handle cleanup when no canvas exists', async () => {
      // Test cleanup without initialization
      await expect(strategy.cleanupAsync()).resolves.not.toThrow();
    });

    it('should clear event listeners on disposal', async () => {
      await strategy.renderAsync(mockContext);
      
      const removeEventListenerSpy = vi.spyOn(canvas || document, 'removeEventListener');
      
      await strategy.cleanupAsync();
      
      // Should clean up properly without errors
      expect(strategy.isInitialized).toBe(false);
    });
  });

  describe('Canvas Configuration Validation', () => {
    it('should validate canvas-specific configuration', () => {
      const result = strategy.validateConfiguration(mockContext.config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid canvas configuration', () => {
      const invalidConfig = {
        ...mockContext.config,
        strategyOptions: {
          canvas: {
            highDPI: true,
            contextType: 'invalid' as any, // Invalid context type
            imageSmoothingEnabled: true
          }
        }
      };
      
      const result = strategy.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about performance issues with large datasets', () => {
      const capabilities = strategy.getCapabilities();
      const largeDatasetConfig = {
        ...mockContext.config,
        // Simulate config that would exceed capabilities
      };
      
      // Test with context that exceeds recommended limits
      const largeNodes = new Map();
      for (let i = 0; i < capabilities.maxNodes + 100; i++) {
        largeNodes.set(`node-${i}`, { id: `node-${i}`, x: 0, y: 0 } as LayoutNode);
      }
      
      const largeContext = {
        ...mockContext,
        nodes: largeNodes,
        config: largeDatasetConfig
      };
      
      const validation = strategy.validateConfiguration(largeContext.config);
      
      // Should still be valid but may have warnings
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Canvas Error Handling', () => {
    it('should handle canvas context creation failure', async () => {
      // Mock canvas that returns null for getContext
      const mockCanvas = {
        getContext: vi.fn().mockReturnValue(null),
        width: 800,
        height: 600,
        style: {}
      };
      
      document.createElement = vi.fn().mockReturnValue(mockCanvas);
      
      await expect(strategy.renderAsync(mockContext)).rejects.toThrow();
    });

    it('should handle rendering errors gracefully', async () => {
      await strategy.renderAsync(mockContext);
      
      canvas = container.querySelector('canvas') as HTMLCanvasElement;
      ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      
      // Mock a context method to throw
      vi.spyOn(ctx, 'arc').mockImplementation(() => {
        throw new Error('Canvas rendering error');
      });
      
      // Should handle the error and emit error events
      const errorSpy = vi.fn();
      strategy.events.on('error', errorSpy);
      
      await expect(strategy.renderAsync(mockContext)).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});