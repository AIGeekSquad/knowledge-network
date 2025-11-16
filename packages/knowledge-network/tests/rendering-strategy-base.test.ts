import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BaseRenderingStrategy } from '../src/rendering/BaseRenderingStrategy';
import type { 
  IRenderingStrategy, 
  RenderingCapabilities, 
  RenderingContext, 
  RenderingConfig,
  ValidationResult,
  VisualUpdates,
  InteractionEvent,
  RenderingProgressCallback
} from '../src/rendering/rendering-strategy';
import type { LayoutNode } from '../src/layout/layout-engine';
import { EventEmitter } from '../src/utils/ReactiveEmitter';

// Mock implementation for testing abstract base class
class MockRenderingStrategy extends BaseRenderingStrategy {
  getCapabilities(): RenderingCapabilities {
    return {
      maxNodes: 1000,
      maxEdges: 2000,
      supportedInteractions: ['zoom', 'pan', 'select', 'hover'],
      performanceProfile: {
        renderingComplexity: 'O(n)',
        updateComplexity: 'O(1)',
        memoryComplexity: 'O(n)',
        optimalFor: ['medium datasets', 'interactive navigation']
      },
      memoryProfile: {
        baseUsage: 10,
        perNode: 0.1,
        perEdge: 0.05,
        peakMultiplier: 1.5
      },
      features: {
        edgeBundling: false,
        realTimeUpdates: true,
        hardwareAcceleration: false,
        animations: true
      }
    };
  }

  async renderAsync(context: RenderingContext, progress?: RenderingProgressCallback): Promise<void> {
    this.markAsInitialized();
    this.emitEvent('rendered', { context, timestamp: Date.now() });
    // Mock render implementation with progress updates
    if (progress) {
      progress({
        stage: 'preparation',
        percentage: 0,
        message: 'Starting render',
        metrics: {
          renderTime: 0,
          memoryUsage: 10,
          currentFPS: 60,
          nodesRendered: 0,
          edgesRendered: 0
        }
      });
      
      progress({
        stage: 'nodes',
        percentage: 50,
        message: 'Rendering nodes',
        metrics: {
          renderTime: 25,
          memoryUsage: 15,
          currentFPS: 58,
          nodesRendered: context.nodes.size,
          edgesRendered: 0
        }
      });
      
      progress({
        stage: 'edges',
        percentage: 80,
        message: 'Rendering edges',
        metrics: {
          renderTime: 40,
          memoryUsage: 18,
          currentFPS: 55,
          nodesRendered: context.nodes.size,
          edgesRendered: context.edges.length
        }
      });
      
      progress({
        stage: 'post-processing',
        percentage: 100,
        message: 'Finalizing render',
        metrics: {
          renderTime: 50,
          memoryUsage: 20,
          currentFPS: 60,
          nodesRendered: context.nodes.size,
          edgesRendered: context.edges.length
        }
      });
    }
  }

  async cleanupAsync(): Promise<void> {
    this.dispose();
  }

  handleInteraction(event: InteractionEvent): boolean {
    this.emitEvent('interaction', event);
    return true;
  }

  async updateVisualsAsync(updates: VisualUpdates): Promise<void> {
    this.emitEvent('visualsUpdated', updates);
  }

  validateConfiguration(config: RenderingConfig): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }
}

describe('BaseRenderingStrategy', () => {
  let strategy: MockRenderingStrategy;
  let container: HTMLElement;
  let mockNodes: Map<string, LayoutNode>;
  let mockContext: RenderingContext;

  beforeEach(() => {
    strategy = new MockRenderingStrategy();
    container = document.createElement('div');
    document.body.appendChild(container);
    
    // Setup mock data
    mockNodes = new Map([
      ['node1', { 
        id: 'node1', 
        x: 100, 
        y: 100, 
        vx: 0, 
        vy: 0, 
        fx: null, 
        fy: null, 
        data: { label: 'Node 1' } 
      }],
      ['node2', { 
        id: 'node2', 
        x: 200, 
        y: 150, 
        vx: 0, 
        vy: 0, 
        fx: null, 
        fy: null, 
        data: { label: 'Node 2' } 
      }]
    ]);
    
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
          zoom: {
            min: 0.1,
            max: 10,
            step: 0.1,
            enableFit: true
          },
          pan: {
            enabled: true,
            inertia: true
          },
          selection: {
            mode: 'single',
            enableNeighborHighlight: true,
            feedback: 'outline'
          },
          hover: {
            enabled: true,
            delay: 200,
            showTooltips: true
          }
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

  describe('IRenderingStrategy Contract Compliance', () => {
    it('should implement all required interface methods', () => {
      expect(strategy).toHaveProperty('renderAsync');
      expect(strategy).toHaveProperty('cleanupAsync');
      expect(strategy).toHaveProperty('handleInteraction');
      expect(strategy).toHaveProperty('updateVisualsAsync');
      expect(strategy).toHaveProperty('getCapabilities');
      expect(strategy).toHaveProperty('validateConfiguration');
      expect(strategy).toHaveProperty('isInitialized');
      expect(strategy).toHaveProperty('events');
    });

    it('should have proper method signatures', () => {
      expect(typeof strategy.renderAsync).toBe('function');
      expect(typeof strategy.cleanupAsync).toBe('function');
      expect(typeof strategy.handleInteraction).toBe('function');
      expect(typeof strategy.updateVisualsAsync).toBe('function');
      expect(typeof strategy.getCapabilities).toBe('function');
      expect(typeof strategy.validateConfiguration).toBe('function');
    });

    it('should return promises for async methods', async () => {
      const renderPromise = strategy.renderAsync(mockContext);
      expect(renderPromise).toBeInstanceOf(Promise);
      await renderPromise;

      const cleanupPromise = strategy.cleanupAsync();
      expect(cleanupPromise).toBeInstanceOf(Promise);
      await cleanupPromise;

      const updatePromise = strategy.updateVisualsAsync({});
      expect(updatePromise).toBeInstanceOf(Promise);
      await updatePromise;
    });
  });

  describe('Base Strategy Initialization', () => {
    it('should initialize with correct default state', () => {
      expect(strategy.isInitialized).toBe(false);
      expect(strategy.events).toBeDefined();
      expect(strategy.events).toBeInstanceOf(EventEmitter);
    });

    it('should set isInitialized to true after rendering', async () => {
      expect(strategy.isInitialized).toBe(false);
      await strategy.renderAsync(mockContext);
      expect(strategy.isInitialized).toBe(true);
    });

    it('should emit lifecycle events', async () => {
      const initSpy = vi.fn();
      const renderSpy = vi.fn();
      
      strategy.events.on('initialized', initSpy);
      strategy.events.on('rendered', renderSpy);
      
      await strategy.renderAsync(mockContext);
      
      expect(initSpy).toHaveBeenCalled();
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should handle progress callbacks during rendering', async () => {
      const progressSpy = vi.fn();
      
      await strategy.renderAsync(mockContext, progressSpy);
      
      expect(progressSpy).toHaveBeenCalledTimes(4);
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

  describe('Strategy Metadata', () => {
    it('should return valid capabilities object', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities).toHaveProperty('maxNodes');
      expect(capabilities).toHaveProperty('maxEdges');
      expect(capabilities).toHaveProperty('supportedInteractions');
      expect(capabilities).toHaveProperty('performanceProfile');
      expect(capabilities).toHaveProperty('memoryProfile');
      expect(capabilities).toHaveProperty('features');
      
      expect(typeof capabilities.maxNodes).toBe('number');
      expect(typeof capabilities.maxEdges).toBe('number');
      expect(Array.isArray(capabilities.supportedInteractions)).toBe(true);
    });

    it('should have reasonable performance characteristics', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.maxNodes).toBeGreaterThan(0);
      expect(capabilities.maxNodes).toBeLessThanOrEqual(10000);
      expect(capabilities.maxEdges).toBeGreaterThan(0);
      
      expect(capabilities.memoryProfile.baseUsage).toBeGreaterThan(0);
      expect(capabilities.memoryProfile.perNode).toBeGreaterThan(0);
      expect(capabilities.memoryProfile.perEdge).toBeGreaterThan(0);
      expect(capabilities.memoryProfile.peakMultiplier).toBeGreaterThanOrEqual(1);
    });

    it('should validate supported interactions', () => {
      const capabilities = strategy.getCapabilities();
      const validInteractions = ['zoom', 'pan', 'select', 'hover', 'click', 'drag'];
      
      capabilities.supportedInteractions.forEach(interaction => {
        expect(validInteractions).toContain(interaction);
      });
    });
  });

  describe('Lifecycle Management', () => {
    it('should handle proper disposal', async () => {
      const disposeSpy = vi.fn();
      strategy.events.on('disposed', disposeSpy);
      
      await strategy.cleanupAsync();
      
      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should clean up resources on dispose', async () => {
      await strategy.renderAsync(mockContext);
      expect(strategy.isInitialized).toBe(true);
      
      await strategy.cleanupAsync();
      
      // Should reset state after cleanup
      expect(strategy.isInitialized).toBe(false);
    });

    it('should not throw errors after disposal', async () => {
      await strategy.cleanupAsync();
      
      // Should not throw errors after disposal
      expect(() => strategy.cleanupAsync()).not.toThrow();
      expect(() => strategy.getCapabilities()).not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should provide performance monitoring hooks', async () => {
      const performanceSpy = vi.fn();
      strategy.events.on('performance', performanceSpy);
      
      // Simulate performance tracking
      const startTime = performance.now();
      await strategy.renderAsync(mockContext);
      const endTime = performance.now();
      
      // Emit performance event manually to test the hook
      strategy.events.emit('performance', {
        operation: 'render',
        duration: endTime - startTime,
        nodeCount: mockNodes.size,
        edgeCount: 0
      });
      
      expect(performanceSpy).toHaveBeenCalledWith(expect.objectContaining({
        operation: 'render',
        duration: expect.any(Number),
        nodeCount: expect.any(Number)
      }));
    });

    it('should track rendering metrics in progress callbacks', async () => {
      const progressSpy = vi.fn();
      
      await strategy.renderAsync(mockContext, progressSpy);
      
      // Verify metrics are provided in progress updates
      const lastCall = progressSpy.mock.calls[progressSpy.mock.calls.length - 1];
      const progress = lastCall[0];
      
      expect(progress.metrics).toBeDefined();
      expect(progress.metrics.renderTime).toBeGreaterThanOrEqual(0);
      expect(progress.metrics.memoryUsage).toBeGreaterThan(0);
      expect(progress.metrics.currentFPS).toBeGreaterThan(0);
      expect(progress.metrics.nodesRendered).toBe(mockNodes.size);
    });
  });

  describe('Event System', () => {
    it('should support event emission and listening', () => {
      const eventSpy = vi.fn();
      strategy.events.on('test-event', eventSpy);
      
      strategy.events.emit('test-event', { data: 'test' });
      
      expect(eventSpy).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should support multiple listeners for the same event', () => {
      const spy1 = vi.fn();
      const spy2 = vi.fn();
      
      strategy.events.on('test', spy1);
      strategy.events.on('test', spy2);
      
      strategy.events.emit('test');
      
      expect(spy1).toHaveBeenCalled();
      expect(spy2).toHaveBeenCalled();
    });

    it('should support event listener removal', () => {
      const eventSpy = vi.fn();
      strategy.events.on('test', eventSpy);
      strategy.events.off('test', eventSpy);
      
      strategy.events.emit('test');
      
      expect(eventSpy).not.toHaveBeenCalled();
    });

    it('should emit interaction events when handling interactions', () => {
      const interactionSpy = vi.fn();
      strategy.events.on('interaction', interactionSpy);
      
      const mockEvent: InteractionEvent = {
        type: 'click',
        coordinates: { x: 100, y: 100 },
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      strategy.handleInteraction(mockEvent);
      
      expect(interactionSpy).toHaveBeenCalledWith(mockEvent);
    });
  });

  describe('Configuration Validation', () => {
    it('should validate rendering configuration', () => {
      const result = strategy.validateConfiguration(mockContext.config);
      
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(typeof result.isValid).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should return valid result for correct configuration', () => {
      const result = strategy.validateConfiguration(mockContext.config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid configurations', () => {
      const invalidConfig = {
        ...mockContext.config,
        visual: {
          ...mockContext.config.visual,
          nodes: {
            ...mockContext.config.visual.nodes,
            defaultRadius: -5 // Invalid negative radius
          }
        }
      };
      
      // Mock strategy should detect invalid config
      const mockStrategy = new (class extends BaseRenderingStrategy {
        getCapabilities() { return strategy.getCapabilities(); }
        async renderAsync() {}
        async cleanupAsync() {}
        handleInteraction() { return false; }
        async updateVisualsAsync() {}
        
        validateConfiguration(config: RenderingConfig): ValidationResult {
          const errors = [];
          if (config.visual.nodes.defaultRadius < 0) {
            errors.push({
              field: 'visual.nodes.defaultRadius',
              message: 'Radius must be positive',
              code: 'INVALID_RADIUS'
            });
          }
          
          return {
            isValid: errors.length === 0,
            errors,
            warnings: []
          };
        }
      })();
      
      const result = mockStrategy.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('visual.nodes.defaultRadius');
    });
  });

  describe('Error Handling', () => {
    it('should handle rendering errors gracefully', async () => {
      const errorStrategy = new (class extends BaseRenderingStrategy {
        getCapabilities() { return strategy.getCapabilities(); }
        
        async renderAsync(): Promise<void> {
          throw new Error('Rendering failed');
        }
        
        async cleanupAsync() {}
        handleInteraction() { return false; }
        async updateVisualsAsync() {}
        validateConfiguration() { return { isValid: true, errors: [], warnings: [] }; }
      })();

      await expect(errorStrategy.renderAsync(mockContext)).rejects.toThrow('Rendering failed');
      expect(errorStrategy.isInitialized).toBe(false);
    });

    it('should emit error events when operations fail', () => {
      const errorSpy = vi.fn();
      strategy.events.on('error', errorSpy);
      
      // Simulate error emission
      const testError = new Error('Test error');
      strategy.events.emit('error', testError);
      
      expect(errorSpy).toHaveBeenCalledWith(testError);
    });

    it('should handle cleanup errors gracefully', async () => {
      const errorStrategy = new (class extends BaseRenderingStrategy {
        getCapabilities() { return strategy.getCapabilities(); }
        async renderAsync() { this.markAsInitialized(); }
        
        async cleanupAsync(): Promise<void> {
          throw new Error('Cleanup failed');
        }
        
        handleInteraction() { return false; }
        async updateVisualsAsync() {}
        validateConfiguration() { return { isValid: true, errors: [], warnings: [] }; }
      })();

      await errorStrategy.renderAsync(mockContext);
      
      await expect(errorStrategy.cleanupAsync()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('Visual Updates', () => {
    it('should handle visual updates', async () => {
      const updatesSpy = vi.fn();
      strategy.events.on('visualsUpdated', updatesSpy);
      
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { 
            position: { x: 150, y: 120 },
            selected: true 
          }]
        ]),
        viewport: {
          zoomLevel: 1.5,
          panOffset: { x: 10, y: 20 }
        }
      };
      
      await strategy.updateVisualsAsync(updates);
      
      expect(updatesSpy).toHaveBeenCalledWith(updates);
    });

    it('should support partial visual updates', async () => {
      const updates: VisualUpdates = {
        viewport: {
          zoomLevel: 2.0
        }
      };
      
      await expect(strategy.updateVisualsAsync(updates)).resolves.not.toThrow();
    });
  });
});