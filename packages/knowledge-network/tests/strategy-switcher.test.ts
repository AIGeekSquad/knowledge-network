import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StrategySwitcher } from '../src/rendering/StrategySwitcher';
import { CanvasRenderingStrategy } from '../src/rendering/CanvasRenderingStrategy';
import { SVGRenderingStrategy } from '../src/rendering/SVGRenderingStrategy';
import { WebGLRenderingStrategy } from '../src/rendering/WebGLRenderingStrategy';
import type { 
  RenderingContext,
  IRenderingStrategy
} from '../src/rendering/rendering-strategy';
import type { LayoutNode } from '../src/layout/layout-engine';

describe('StrategySwitcher', () => {
  let switcher: StrategySwitcher;
  let container: HTMLElement;
  let mockContext: RenderingContext;
  let mockNodes: Map<string, LayoutNode>;

  beforeEach(() => {
    // Create switcher instance
    switcher = new StrategySwitcher();
    
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    container.appendChild = vi.fn();
    document.body.appendChild(container);
    
    // Setup mock nodes
    mockNodes = new Map();
    for (let i = 0; i < 50; i++) {
      mockNodes.set(`node${i}`, {
        id: `node${i}`,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
        fx: null,
        fy: null,
        data: { label: `Node ${i}` }
      });
    }
    
    // Setup mock context
    mockContext = {
      nodes: mockNodes,
      edges: [],
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
        }
      },
      container,
      viewport: {
        zoomLevel: 1.5,
        panOffset: { x: 50, y: 30 },
        selectedNodeId: 'node5',
        highlightedNodeIds: new Set(['node10', 'node15']),
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
    vi.restoreAllMocks();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Strategy Registration and Management', () => {
    it('should register rendering strategies', () => {
      const canvasStrategy = new CanvasRenderingStrategy();
      const svgStrategy = new SVGRenderingStrategy();
      const webglStrategy = new WebGLRenderingStrategy();
      
      switcher.registerStrategy('canvas', canvasStrategy);
      switcher.registerStrategy('svg', svgStrategy);
      switcher.registerStrategy('webgl', webglStrategy);
      
      expect(switcher.getAvailableStrategies()).toContain('canvas');
      expect(switcher.getAvailableStrategies()).toContain('svg');
      expect(switcher.getAvailableStrategies()).toContain('webgl');
    });

    it('should get strategy capabilities by name', () => {
      const canvasStrategy = new CanvasRenderingStrategy();
      switcher.registerStrategy('canvas', canvasStrategy);
      
      const capabilities = switcher.getStrategyCapabilities('canvas');
      expect(capabilities.maxNodes).toBe(1000);
      expect(capabilities.features.hardwareAcceleration).toBe(false);
    });

    it('should recommend optimal strategy based on dataset size', () => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('svg', new SVGRenderingStrategy());
      switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
      
      // Small dataset - Canvas or SVG
      const smallRecommendation = switcher.recommendStrategy(100, 200);
      expect(['canvas', 'svg']).toContain(smallRecommendation);
      
      // Large dataset - WebGL
      const largeRecommendation = switcher.recommendStrategy(5000, 10000);
      expect(largeRecommendation).toBe('webgl');
    });

    it('should prevent duplicate strategy registration', () => {
      const strategy1 = new CanvasRenderingStrategy();
      const strategy2 = new CanvasRenderingStrategy();
      
      switcher.registerStrategy('canvas', strategy1);
      
      expect(() => {
        switcher.registerStrategy('canvas', strategy2);
      }).toThrow('Strategy "canvas" is already registered');
    });
  });

  describe('Runtime Strategy Switching', () => {
    beforeEach(() => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('svg', new SVGRenderingStrategy());
      switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
    });

    it('should switch strategies while preserving context', async () => {
      // Start with canvas
      await switcher.switchToStrategy('canvas', mockContext);
      expect(switcher.getCurrentStrategyName()).toBe('canvas');
      
      // Switch to SVG
      await switcher.switchToStrategy('svg', mockContext);
      expect(switcher.getCurrentStrategyName()).toBe('svg');
      
      // Verify context is maintained
      expect(switcher.getCurrentContext()).toBeDefined();
    });

    it('should handle automatic strategy selection based on node count', async () => {
      // Enable automatic selection
      switcher.setAutoSelectionEnabled(true);
      
      // Test with large dataset that should trigger WebGL
      const largeNodes = new Map();
      for (let i = 0; i < 2000; i++) {
        largeNodes.set(`node${i}`, {
          id: `node${i}`,
          x: i, y: i,
          vx: 0, vy: 0, fx: null, fy: null,
          data: {}
        });
      }
      
      const largeContext = { ...mockContext, nodes: largeNodes };
      
      await switcher.renderWithOptimalStrategy(largeContext);
      
      // Should automatically select WebGL for large dataset
      expect(switcher.getCurrentStrategyName()).toBe('webgl');
    });

    it('should emit events during strategy switching', async () => {
      const switchStartSpy = vi.fn();
      const switchCompleteSpy = vi.fn();
      
      switcher.events.on('strategy-switch-start', switchStartSpy);
      switcher.events.on('strategy-switch-complete', switchCompleteSpy);
      
      await switcher.switchToStrategy('svg', mockContext);
      
      expect(switchStartSpy).toHaveBeenCalledWith({
        from: null,
        to: 'svg',
        reason: 'manual'
      });
      expect(switchCompleteSpy).toHaveBeenCalledWith({
        strategy: 'svg',
        success: true
      });
    });

    it('should handle strategy switching failures gracefully', async () => {
      const failingStrategy = {
        renderAsync: vi.fn().mockRejectedValue(new Error('Render failed')),
        cleanupAsync: vi.fn(),
        handleInteraction: vi.fn(),
        updateVisualsAsync: vi.fn(),
        getCapabilities: vi.fn().mockReturnValue({ maxNodes: 100 }),
        validateConfiguration: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
        isInitialized: false,
        events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }
      };
      
      switcher.registerStrategy('failing', failingStrategy as any);
      
      const errorSpy = vi.fn();
      switcher.events.on('error', errorSpy);
      
      await expect(switcher.switchToStrategy('failing', mockContext)).rejects.toThrow();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('Performance-Based Strategy Selection', () => {
    beforeEach(() => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('svg', new SVGRenderingStrategy());
      switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
    });

    it('should monitor performance and suggest strategy changes', async () => {
      switcher.enablePerformanceMonitoring(true);
      
      await switcher.switchToStrategy('canvas', mockContext);
      
      // Simulate low performance
      switcher.reportPerformanceMetrics({
        currentFPS: 20, // Below threshold
        renderTime: 50,
        memoryUsage: 100,
        nodeCount: mockNodes.size
      });
      
      // Should suggest switching to more performant strategy
      const suggestion = switcher.getPerformanceSuggestion();
      expect(suggestion).toBeTruthy();
      expect(suggestion?.suggestedStrategy).toBe('webgl');
    });

    it('should respect performance constraints when switching', async () => {
      const constrainedContext = {
        ...mockContext,
        constraints: {
          ...mockContext.constraints,
          targetFPS: 45,
          maxMemoryMB: 256
        }
      };
      
      await switcher.renderWithOptimalStrategy(constrainedContext);
      
      // Should select strategy that meets constraints
      const currentStrategy = switcher.getCurrentStrategyName();
      const capabilities = switcher.getStrategyCapabilities(currentStrategy);
      
      expect(capabilities.memoryProfile.baseUsage).toBeLessThanOrEqual(256);
    });

    it('should handle memory pressure by degrading strategy', async () => {
      switcher.setDegradationEnabled(true);
      
      await switcher.switchToStrategy('webgl', mockContext);
      
      // Simulate memory pressure
      switcher.reportMemoryPressure(900); // MB
      
      // Should degrade to less memory-intensive strategy
      const currentStrategy = switcher.getCurrentStrategyName();
      expect(['canvas', 'svg']).toContain(currentStrategy);
    });
  });

  describe('Capability Checking and Validation', () => {
    beforeEach(() => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('svg', new SVGRenderingStrategy());
      switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
    });

    it('should validate strategy compatibility with context', async () => {
      const hugeContext = {
        ...mockContext,
        nodes: new Map(Array.from({ length: 50000 }, (_, i) => [
          `node${i}`, { id: `node${i}`, x: 0, y: 0, vx: 0, vy: 0, fx: null, fy: null, data: {} }
        ]))
      };
      
      const canvasCompatible = await switcher.isStrategyCompatible('canvas', hugeContext);
      const webglCompatible = await switcher.isStrategyCompatible('webgl', hugeContext);
      
      expect(canvasCompatible).toBe(false); // Exceeds Canvas limits
      expect(webglCompatible).toBe(true); // WebGL can handle it
    });

    it('should check required browser features before switching', async () => {
      // Mock WebGL unavailable
      const originalWebGL = window.WebGLRenderingContext;
      delete (window as any).WebGLRenderingContext;
      
      const webglCompatible = await switcher.isStrategyCompatible('webgl', mockContext);
      expect(webglCompatible).toBe(false);
      
      // Restore
      (window as any).WebGLRenderingContext = originalWebGL;
    });

    it('should validate configuration before strategy switch', async () => {
      const invalidConfig = {
        ...mockContext.config,
        strategyOptions: {
          webgl: {
            shaderQuality: 'invalid' as any
          }
        }
      };
      
      const invalidContext = { ...mockContext, config: invalidConfig };
      
      await expect(switcher.switchToStrategy('webgl', invalidContext)).rejects.toThrow();
    });
  });

  describe('Strategy Lifecycle Management', () => {
    beforeEach(() => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('svg', new SVGRenderingStrategy());
    });

    it('should properly cleanup previous strategy before switching', async () => {
      await switcher.switchToStrategy('canvas', mockContext);
      
      const canvasStrategy = switcher.getCurrentStrategy();
      const cleanupSpy = vi.spyOn(canvasStrategy, 'cleanupAsync');
      
      await switcher.switchToStrategy('svg', mockContext);
      
      expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should handle concurrent strategy switches safely', async () => {
      // Start multiple switches simultaneously
      const switch1 = switcher.switchToStrategy('canvas', mockContext);
      const switch2 = switcher.switchToStrategy('svg', mockContext);
      const switch3 = switcher.switchToStrategy('canvas', mockContext);
      
      // Should handle gracefully - last switch wins
      await Promise.allSettled([switch1, switch2, switch3]);
      
      expect(switcher.getCurrentStrategyName()).toBe('canvas');
    });

    it('should prevent switching to same strategy', async () => {
      await switcher.switchToStrategy('canvas', mockContext);
      
      // Switching to same strategy should be no-op
      const result = await switcher.switchToStrategy('canvas', mockContext);
      
      expect(result).toBe(true);
      expect(switcher.getCurrentStrategyName()).toBe('canvas');
    });

    it('should emit lifecycle events for strategy management', async () => {
      const strategySpy = vi.fn();
      switcher.events.on('strategy-lifecycle', strategySpy);
      
      await switcher.switchToStrategy('canvas', mockContext);
      await switcher.cleanup();
      
      expect(strategySpy).toHaveBeenCalledWith({
        event: 'initialized',
        strategy: 'canvas'
      });
      expect(strategySpy).toHaveBeenCalledWith({
        event: 'disposed',
        strategy: 'canvas'
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should fallback to safe strategy on critical errors', async () => {
      const unstableStrategy = {
        renderAsync: vi.fn().mockRejectedValue(new Error('Critical failure')),
        cleanupAsync: vi.fn(),
        getCapabilities: vi.fn().mockReturnValue({ maxNodes: 1000, features: {} }),
        validateConfiguration: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
        handleInteraction: vi.fn(),
        updateVisualsAsync: vi.fn(),
        isInitialized: false,
        events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }
      };
      
      switcher.registerStrategy('unstable', unstableStrategy as any);
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy()); // Safe fallback
      switcher.setFallbackStrategy('canvas');
      
      // Should fallback to canvas on failure
      await switcher.switchToStrategy('unstable', mockContext);
      
      expect(switcher.getCurrentStrategyName()).toBe('canvas');
    });

    it('should handle strategy initialization failures', async () => {
      const initFailStrategy = {
        renderAsync: vi.fn().mockImplementation(() => {
          throw new Error('Initialization failed');
        }),
        cleanupAsync: vi.fn(),
        getCapabilities: vi.fn().mockReturnValue({ maxNodes: 1000 }),
        validateConfiguration: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
        handleInteraction: vi.fn(),
        updateVisualsAsync: vi.fn(),
        isInitialized: false,
        events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() }
      };
      
      switcher.registerStrategy('init-fail', initFailStrategy as any);
      
      await expect(switcher.switchToStrategy('init-fail', mockContext)).rejects.toThrow();
    });

    it('should recover from strategy crashes during runtime', async () => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      await switcher.switchToStrategy('canvas', mockContext);
      
      const errorSpy = vi.fn();
      switcher.events.on('strategy-error', errorSpy);
      
      // Simulate strategy crash
      const currentStrategy = switcher.getCurrentStrategy();
      currentStrategy.events.emit('error', new Error('Strategy crashed'));
      
      expect(errorSpy).toHaveBeenCalled();
      
      // Switcher should handle recovery
      expect(switcher.isHealthy()).toBe(true);
    });
  });

  describe('Context Preservation During Switching', () => {
    beforeEach(() => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('svg', new SVGRenderingStrategy());
    });

    it('should preserve viewport state across strategy changes', async () => {
      const originalViewport = { ...mockContext.viewport };
      
      await switcher.switchToStrategy('canvas', mockContext);
      await switcher.switchToStrategy('svg', mockContext);
      
      const currentContext = switcher.getCurrentContext();
      expect(currentContext?.viewport.zoomLevel).toBe(originalViewport.zoomLevel);
      expect(currentContext?.viewport.panOffset).toEqual(originalViewport.panOffset);
      expect(currentContext?.viewport.selectedNodeId).toBe(originalViewport.selectedNodeId);
    });

    it('should maintain node selection during strategy switch', async () => {
      mockContext.viewport.selectedNodeId = 'node20';
      
      await switcher.switchToStrategy('canvas', mockContext);
      await switcher.switchToStrategy('svg', mockContext);
      
      const currentContext = switcher.getCurrentContext();
      expect(currentContext?.viewport.selectedNodeId).toBe('node20');
    });

    it('should preserve highlight state for neighbor highlighting', async () => {
      mockContext.viewport.highlightedNodeIds = new Set(['node1', 'node2', 'node3']);
      
      await switcher.switchToStrategy('canvas', mockContext);
      await switcher.switchToStrategy('svg', mockContext);
      
      const currentContext = switcher.getCurrentContext();
      expect(currentContext?.viewport.highlightedNodeIds.size).toBe(3);
      expect(currentContext?.viewport.highlightedNodeIds.has('node1')).toBe(true);
    });

    it('should handle edge cases in state preservation', async () => {
      // Test with extreme viewport values
      mockContext.viewport.zoomLevel = 0.01; // Very zoomed out
      mockContext.viewport.panOffset = { x: -10000, y: 5000 }; // Extreme pan
      
      await switcher.switchToStrategy('canvas', mockContext);
      await switcher.switchToStrategy('svg', mockContext);
      
      const currentContext = switcher.getCurrentContext();
      expect(currentContext?.viewport.zoomLevel).toBe(0.01);
      expect(currentContext?.viewport.panOffset.x).toBe(-10000);
    });
  });

  describe('Performance Monitoring and Auto-switching', () => {
    beforeEach(() => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
      switcher.enablePerformanceMonitoring(true);
      switcher.setAutoSwitchEnabled(true);
    });

    it('should monitor rendering performance continuously', async () => {
      await switcher.switchToStrategy('canvas', mockContext);
      
      const performanceSpy = vi.fn();
      switcher.events.on('performance-update', performanceSpy);
      
      // Simulate performance data
      switcher.reportPerformanceMetrics({
        currentFPS: 45,
        renderTime: 25,
        memoryUsage: 150,
        nodeCount: mockNodes.size
      });
      
      expect(performanceSpy).toHaveBeenCalled();
    });

    it('should auto-switch when performance drops below threshold', async () => {
      await switcher.switchToStrategy('canvas', mockContext);
      
      // Report poor performance
      switcher.reportPerformanceMetrics({
        currentFPS: 15, // Well below 60fps
        renderTime: 100,
        memoryUsage: 200,
        nodeCount: mockNodes.size
      });
      
      // Should trigger auto-switch to more performant strategy
      await new Promise(resolve => setTimeout(resolve, 100)); // Allow time for auto-switch
      
      expect(switcher.getCurrentStrategyName()).toBe('webgl');
    });

    it('should prevent rapid strategy switching (debouncing)', async () => {
      await switcher.switchToStrategy('canvas', mockContext);
      
      // Report multiple rapid performance issues
      for (let i = 0; i < 5; i++) {
        switcher.reportPerformanceMetrics({
          currentFPS: 10,
          renderTime: 200,
          memoryUsage: 300,
          nodeCount: mockNodes.size
        });
      }
      
      // Should debounce and not switch multiple times rapidly
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(switcher.getCurrentStrategyName()).toBe('webgl');
    });
  });

  describe('Configuration and Options', () => {
    it('should allow configuration of switching behavior', () => {
      const options = {
        autoSwitchEnabled: true,
        performanceThreshold: 45,
        memoryThreshold: 512,
        switchDebounceTime: 2000,
        fallbackStrategy: 'canvas'
      };
      
      switcher.configure(options);
      
      expect(switcher.getConfiguration()).toMatchObject(options);
    });

    it('should validate switcher configuration', () => {
      const invalidOptions = {
        performanceThreshold: -10, // Invalid
        switchDebounceTime: -1000 // Invalid
      };
      
      expect(() => {
        switcher.configure(invalidOptions);
      }).toThrow();
    });

    it('should provide strategy comparison information', () => {
      switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
      switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
      
      const comparison = switcher.compareStrategies(['canvas', 'webgl']);
      
      expect(comparison.canvas.maxNodes).toBe(1000);
      expect(comparison.webgl.maxNodes).toBe(10000);
      expect(comparison.canvas.features.hardwareAcceleration).toBe(false);
      expect(comparison.webgl.features.hardwareAcceleration).toBe(true);
    });
  });
});