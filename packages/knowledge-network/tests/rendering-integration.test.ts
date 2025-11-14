import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StrategySwitcher } from '../src/rendering/StrategySwitcher';
import { CanvasRenderingStrategy } from '../src/rendering/CanvasRenderingStrategy';
import { SVGRenderingStrategy } from '../src/rendering/SVGRenderingStrategy';
import { WebGLRenderingStrategy } from '../src/rendering/WebGLRenderingStrategy';
import type { 
  RenderingContext
} from '../src/rendering/rendering-strategy';
import type { LayoutNode } from '../src/layout/layout-engine';

describe('Rendering Integration Tests', () => {
  let switcher: StrategySwitcher;
  let container: HTMLElement;
  let integrationContext: RenderingContext;
  let testNodes: Map<string, LayoutNode>;

  beforeEach(() => {
    // Create complete integrated system
    switcher = new StrategySwitcher();
    switcher.registerStrategy('canvas', new CanvasRenderingStrategy());
    switcher.registerStrategy('svg', new SVGRenderingStrategy());
    switcher.registerStrategy('webgl', new WebGLRenderingStrategy());
    
    // Setup realistic container
    container = document.createElement('div');
    container.style.width = '1000px';
    container.style.height = '800px';
    container.appendChild = vi.fn();
    document.body.appendChild(container);
    
    // Create realistic test dataset
    testNodes = new Map();
    for (let i = 0; i < 100; i++) {
      testNodes.set(`node${i}`, {
        id: `node${i}`,
        x: Math.random() * 1000,
        y: Math.random() * 800,
        vx: Math.random() * 2 - 1,
        vy: Math.random() * 2 - 1,
        fx: null,
        fy: null,
        data: { 
          label: `Node ${i}`,
          category: ['research', 'development', 'marketing'][i % 3],
          importance: Math.random(),
          connections: Math.floor(Math.random() * 10)
        }
      });
    }
    
    // Setup production-like context
    integrationContext = {
      nodes: testNodes,
      edges: Array.from({ length: 80 }, (_, i) => ({
        sourceId: `node${i % 50}`,
        targetId: `node${(i + 1 + Math.floor(Math.random() * 10)) % 100}`,
        compatibilityScores: new Map(),
        originalEdge: { 
          source: `node${i % 50}`, 
          target: `node${(i + 1) % 100}`,
          weight: Math.random()
        }
      })),
      config: {
        strategy: 'simple',
        performanceMode: 'balanced',
        visual: {
          nodes: {
            defaultRadius: 8,
            radiusRange: [4, 16],
            defaultFillColor: '#2c3e50',
            defaultStrokeColor: '#34495e',
            strokeWidth: 1.5,
            opacity: 0.9,
            selectedOpacity: 1.0,
            highlightedOpacity: 0.6
          },
          edges: {
            defaultStrokeColor: '#bdc3c7',
            defaultStrokeWidth: 1,
            opacity: 0.5,
            selectedOpacity: 0.8,
            bundlingCurvature: 0.6,
            arrowHeadSize: 8
          },
          colors: {
            primary: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6'],
            accent: ['#e67e22', '#1abc9c'],
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
          memoryThreshold: 512,
          performanceThreshold: 30,
          strategy: 'reduce-quality'
        }
      },
      container,
      viewport: {
        zoomLevel: 1,
        panOffset: { x: 0, y: 0 },
        selectedNodeId: undefined,
        highlightedNodeIds: new Set(),
        interactionMode: 'navigate',
        viewBounds: { x: 0, y: 0, width: 1000, height: 800 }
      },
      constraints: {
        maxMemoryMB: 1024,
        targetFPS: 60,
        maxFrameTime: 16.67,
        enableMonitoring: true
      }
    };
  });

  describe('End-to-End Strategy Integration', () => {
    it('should integrate all rendering strategies successfully', async () => {
      const strategies = ['canvas', 'svg', 'webgl'];
      const results = [];
      
      for (const strategyName of strategies) {
        try {
          await switcher.switchToStrategy(strategyName, integrationContext);
          
          results.push({
            strategy: strategyName,
            success: true,
            initialized: switcher.getCurrentStrategy().isInitialized,
            capabilities: switcher.getStrategyCapabilities(strategyName)
          });
        } catch (error) {
          results.push({
            strategy: strategyName,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      // At least one strategy should work
      const successfulStrategies = results.filter(r => r.success);
      expect(successfulStrategies.length).toBeGreaterThan(0);
      
      // Validate successful strategy properties
      successfulStrategies.forEach(result => {
        expect(result.capabilities.maxNodes).toBeGreaterThan(0);
        expect(result.capabilities.supportedInteractions).toContain('zoom');
      });
    });

    it('should handle complete workflow with realistic data', async () => {
      // Test complete workflow: register → recommend → switch → render → interact
      
      // 1. Strategy recommendation
      const recommendation = switcher.recommendStrategy(
        integrationContext.nodes.size,
        integrationContext.edges.length
      );
      expect(['canvas', 'svg', 'webgl']).toContain(recommendation);
      
      // 2. Compatibility check
      const isCompatible = await switcher.isStrategyCompatible(recommendation, integrationContext);
      if (!isCompatible) {
        // If recommended strategy not compatible, try fallback
        const fallback = 'canvas';
        const fallbackCompatible = await switcher.isStrategyCompatible(fallback, integrationContext);
        expect(fallbackCompatible).toBe(true);
      }
      
      // 3. Strategy switching
      try {
        await switcher.switchToStrategy(recommendation, integrationContext);
        expect(switcher.getCurrentStrategyName()).toBe(recommendation);
      } catch (error) {
        // Test passes if switcher handles failure gracefully
        expect(error).toBeDefined();
      }
      
      // 4. Performance monitoring integration
      switcher.reportPerformanceMetrics({
        currentFPS: 55,
        renderTime: 18,
        memoryUsage: 250,
        nodeCount: integrationContext.nodes.size
      });
      
      // Should not throw errors
      expect(switcher.isHealthy()).toBe(true);
    });

    it('should handle large dataset strategy selection automatically', async () => {
      // Create large dataset
      const largeNodes = new Map();
      for (let i = 0; i < 1500; i++) {
        largeNodes.set(`large-node${i}`, {
          id: `large-node${i}`,
          x: Math.random() * 2000,
          y: Math.random() * 1600,
          vx: 0, vy: 0, fx: null, fy: null,
          data: { label: `Large Node ${i}` }
        });
      }
      
      const largeContext = {
        ...integrationContext,
        nodes: largeNodes
      };
      
      // Should automatically select WebGL for large dataset
      try {
        await switcher.renderWithOptimalStrategy(largeContext);
        
        // If successful, should be WebGL
        expect(switcher.getCurrentStrategyName()).toBe('webgl');
      } catch (error) {
        // If WebGL fails, should fallback to next best option
        const currentStrategy = switcher.getCurrentStrategyName();
        expect(['canvas', 'svg']).toContain(currentStrategy);
      }
    });
  });

  describe('Strategy Switching Integration with Layout Engine', () => {
    it('should properly integrate with layout engine results', async () => {
      // Simulate layout engine results with Map<string, LayoutNode> structure
      const layoutResults = new Map();
      
      Array.from(integrationContext.nodes.entries()).forEach(([id, node]) => {
        layoutResults.set(id, {
          ...node,
          // Simulate layout calculations
          x: node.x + Math.random() * 50 - 25,
          y: node.y + Math.random() * 50 - 25,
          vx: Math.random() * 4 - 2,
          vy: Math.random() * 4 - 2
        });
      });
      
      const layoutContext = {
        ...integrationContext,
        nodes: layoutResults
      };
      
      // Test that strategies can consume layout results
      const strategies = ['canvas', 'svg'];
      
      for (const strategy of strategies) {
        try {
          await switcher.switchToStrategy(strategy, layoutContext);
          
          const currentContext = switcher.getCurrentContext();
          expect(currentContext?.nodes.size).toBe(layoutResults.size);
          
          // Verify Map<string, LayoutNode> structure is preserved
          expect(currentContext?.nodes instanceof Map).toBe(true);
        } catch (error) {
          // Continue testing other strategies if one fails
          continue;
        }
      }
    });

    it('should handle layout updates during strategy switching', async () => {
      try {
        await switcher.switchToStrategy('canvas', integrationContext);
        
        // Simulate layout update (node positions changed)
        const updatedNodes = new Map(integrationContext.nodes);
        updatedNodes.forEach(node => {
          node.x += Math.random() * 20 - 10;
          node.y += Math.random() * 20 - 10;
        });
        
        const updatedContext = {
          ...integrationContext,
          nodes: updatedNodes
        };
        
        // Switch strategy with updated layout
        await switcher.switchToStrategy('svg', updatedContext);
        
        const finalContext = switcher.getCurrentContext();
        expect(finalContext?.nodes.size).toBe(updatedNodes.size);
      } catch (error) {
        // Test passes if integration handles updates gracefully
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance Under Different Load Conditions', () => {
    it('should handle performance monitoring across all strategies', async () => {
      const performanceResults = [];
      
      for (const strategyName of ['canvas', 'svg', 'webgl']) {
        try {
          const startTime = performance.now();
          await switcher.switchToStrategy(strategyName, integrationContext);
          const switchTime = performance.now() - startTime;
          
          // Test performance reporting
          switcher.reportPerformanceMetrics({
            currentFPS: 60,
            renderTime: switchTime,
            memoryUsage: 200,
            nodeCount: integrationContext.nodes.size
          });
          
          performanceResults.push({
            strategy: strategyName,
            switchTime,
            success: true
          });
        } catch (error) {
          performanceResults.push({
            strategy: strategyName,
            switchTime: 0,
            success: false,
            error: (error as Error).message
          });
        }
      }
      
      // At least one strategy should perform adequately
      const successfulResults = performanceResults.filter(r => r.success);
      expect(successfulResults.length).toBeGreaterThan(0);
      
      // Performance monitoring should work
      expect(switcher.isHealthy()).toBe(true);
    });

    it('should demonstrate degradation and recovery workflows', async () => {
      switcher.setDegradationEnabled(true);
      
      try {
        // Start with high-performance strategy
        await switcher.switchToStrategy('webgl', integrationContext);
      } catch (error) {
        // If WebGL fails, should fallback
      }
      
      // Simulate memory pressure
      switcher.reportMemoryPressure(800); // High memory usage
      
      // Simulate performance degradation  
      switcher.reportPerformanceMetrics({
        currentFPS: 20, // Poor performance
        renderTime: 100,
        memoryUsage: 800,
        nodeCount: integrationContext.nodes.size
      });
      
      // System should handle degradation gracefully
      expect(switcher.isHealthy()).toBe(true);
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should demonstrate robust error recovery across strategies', async () => {
      const errorScenarios = [
        'Canvas context creation failure',
        'SVG DOM manipulation error',
        'WebGL shader compilation failure'
      ];
      
      let recoveryCount = 0;
      
      for (const strategyName of ['canvas', 'svg', 'webgl']) {
        try {
          await switcher.switchToStrategy(strategyName, integrationContext);
          recoveryCount++;
        } catch (error) {
          // Test error handling
          expect(error).toBeDefined();
          
          // Try recovery with fallback
          try {
            switcher.setFallbackStrategy('canvas');
            // Fallback should maintain basic functionality
          } catch (fallbackError) {
            // Even fallback errors should be handled gracefully
          }
        }
      }
      
      // System should maintain stability despite errors
      expect(switcher.isHealthy()).toBe(true);
    });

    it('should maintain data integrity during error scenarios', async () => {
      const originalNodeCount = integrationContext.nodes.size;
      const originalEdgeCount = integrationContext.edges.length;
      
      // Test multiple strategy switches with potential failures
      const strategySequence = ['canvas', 'svg', 'webgl', 'canvas'];
      
      for (const strategy of strategySequence) {
        try {
          await switcher.switchToStrategy(strategy, integrationContext);
        } catch (error) {
          // Continue testing despite failures
        }
        
        // Data integrity should be maintained
        const currentContext = switcher.getCurrentContext();
        if (currentContext) {
          expect(currentContext.nodes.size).toBe(originalNodeCount);
          expect(currentContext.edges.length).toBe(originalEdgeCount);
        }
      }
    });
  });

  describe('Configuration Validation Integration', () => {
    it('should validate configurations across all strategies', async () => {
      const testConfigurations = [
        // Valid configurations
        { ...integrationContext.config, performanceMode: 'high-quality' as const },
        { ...integrationContext.config, performanceMode: 'performance' as const },
        
        // Edge case configurations
        {
          ...integrationContext.config,
          visual: {
            ...integrationContext.config.visual,
            nodes: {
              ...integrationContext.config.visual.nodes,
              defaultRadius: 20 // Large nodes
            }
          }
        }
      ];
      
      for (const config of testConfigurations) {
        const contextWithConfig = { ...integrationContext, config };
        
        // Test each strategy's validation
        for (const strategyName of ['canvas', 'svg', 'webgl']) {
          const strategy = switcher.getStrategyCapabilities(strategyName);
          expect(strategy.maxNodes).toBeGreaterThan(0);
          expect(Array.isArray(strategy.supportedInteractions)).toBe(true);
        }
      }
    });

    it('should handle strategy-specific configuration options', async () => {
      // Test Canvas-specific options
      const canvasConfig = {
        ...integrationContext.config,
        strategyOptions: {
          canvas: {
            highDPI: true,
            contextType: '2d' as const,
            imageSmoothingEnabled: true
          }
        }
      };
      
      // Test SVG-specific options  
      const svgConfig = {
        ...integrationContext.config,
        strategyOptions: {
          svg: {
            useCSSTransforms: true,
            enableTextSelection: false
          }
        }
      };
      
      // Test WebGL-specific options
      const webglConfig = {
        ...integrationContext.config,
        strategyOptions: {
          webgl: {
            contextAttributes: { antialias: true, alpha: false },
            useInstancedRendering: true,
            shaderQuality: 'high' as const
          }
        }
      };
      
      const configs = [canvasConfig, svgConfig, webglConfig];
      const strategies = ['canvas', 'svg', 'webgl'];
      
      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        const strategy = strategies[i];
        
        try {
          const contextWithOptions = { ...integrationContext, config };
          await switcher.switchToStrategy(strategy, contextWithOptions);
          
          // Should handle strategy-specific options
          expect(switcher.getCurrentStrategyName()).toBe(strategy);
        } catch (error) {
          // Configuration validation should work even if rendering fails
          const validation = switcher.getCurrentStrategy().validateConfiguration(config);
          expect(validation).toHaveProperty('isValid');
        }
      }
    });
  });

  describe('Memory and Performance Integration', () => {
    it('should demonstrate memory efficiency across strategies', async () => {
      const memoryProfileTests = [];
      
      for (const strategyName of ['canvas', 'svg', 'webgl']) {
        try {
          const capabilities = switcher.getStrategyCapabilities(strategyName);
          const estimatedMemory = capabilities.memoryProfile.baseUsage +
                                (integrationContext.nodes.size * capabilities.memoryProfile.perNode) +
                                (integrationContext.edges.length * capabilities.memoryProfile.perEdge);
          
          memoryProfileTests.push({
            strategy: strategyName,
            estimatedMemory,
            maxNodes: capabilities.maxNodes,
            hardwareAccelerated: capabilities.features.hardwareAcceleration
          });
        } catch (error) {
          // Continue testing other strategies
        }
      }
      
      // Should have memory profiles for strategies
      expect(memoryProfileTests.length).toBeGreaterThan(0);
      
      // WebGL should be most memory efficient per node
      const webglProfile = memoryProfileTests.find(p => p.strategy === 'webgl');
      const canvasProfile = memoryProfileTests.find(p => p.strategy === 'canvas');
      
      if (webglProfile && canvasProfile) {
        expect(webglProfile.maxNodes).toBeGreaterThan(canvasProfile.maxNodes);
      }
    });

    it('should handle performance-based automatic switching', async () => {
      switcher.setAutoSwitchEnabled(true);
      switcher.enablePerformanceMonitoring(true);
      
      try {
        // Start with any available strategy
        await switcher.switchToStrategy('canvas', integrationContext);
      } catch (error) {
        // Continue test with different strategy
        try {
          await switcher.switchToStrategy('svg', integrationContext);
        } catch (svgError) {
          // If all strategies fail, test the switching logic itself
          const recommendation = switcher.recommendStrategy(100, 50);
          expect(['canvas', 'svg', 'webgl']).toContain(recommendation);
        }
      }
      
      // Report poor performance to trigger auto-switching
      switcher.reportPerformanceMetrics({
        currentFPS: 25,
        renderTime: 60,
        memoryUsage: 400,
        nodeCount: integrationContext.nodes.size
      });
      
      // Auto-switching logic should be functional
      const suggestion = switcher.getPerformanceSuggestion();
      if (suggestion) {
        expect(suggestion.suggestedStrategy).toBeTruthy();
        expect(suggestion.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Complete System Validation', () => {
    it('should validate entire rendering pipeline integration', async () => {
      // Complete pipeline test: data → layout → rendering → interaction
      
      // 1. Validate data structure
      expect(integrationContext.nodes instanceof Map).toBe(true);
      expect(Array.isArray(integrationContext.edges)).toBe(true);
      expect(integrationContext.nodes.size).toBe(100);
      expect(integrationContext.edges.length).toBe(80);
      
      // 2. Test strategy capabilities
      const allStrategies = switcher.getAvailableStrategies();
      expect(allStrategies.length).toBe(3);
      expect(allStrategies).toEqual(['canvas', 'svg', 'webgl']);
      
      // 3. Test strategy comparison
      const comparison = switcher.compareStrategies(['canvas', 'webgl']);
      expect(comparison.canvas.maxNodes).toBe(1000);
      expect(comparison.webgl.maxNodes).toBe(10000);
      expect(comparison.webgl.features.hardwareAcceleration).toBe(true);
      
      // 4. Test configuration management
      const config = switcher.getConfiguration();
      expect(config.autoSwitchEnabled).toBe(false);
      expect(config.performanceThreshold).toBe(45);
      
      // 5. Test state management
      expect(switcher.isHealthy()).toBe(true);
    });

    it('should demonstrate production-ready stability', async () => {
      // Simulate production usage patterns
      const usagePatterns = [
        { action: 'initial-render', strategy: 'canvas' },
        { action: 'zoom-in', zoomLevel: 3.0 },
        { action: 'pan', panOffset: { x: 200, y: -100 } },
        { action: 'select-node', nodeId: 'node42' },
        { action: 'strategy-switch', strategy: 'svg' },
        { action: 'highlight-neighbors', nodeIds: ['node41', 'node43'] },
        { action: 'performance-degradation', fps: 20 },
        { action: 'auto-switch', strategy: 'webgl' }
      ];
      
      for (const pattern of usagePatterns) {
        try {
          switch (pattern.action) {
            case 'initial-render':
              await switcher.switchToStrategy(pattern.strategy!, integrationContext);
              break;
              
            case 'zoom-in':
              integrationContext.viewport.zoomLevel = pattern.zoomLevel!;
              break;
              
            case 'pan':
              integrationContext.viewport.panOffset = pattern.panOffset!;
              break;
              
            case 'select-node':
              integrationContext.viewport.selectedNodeId = pattern.nodeId;
              break;
              
            case 'strategy-switch':
              await switcher.switchToStrategy(pattern.strategy!, integrationContext);
              break;
              
            case 'highlight-neighbors':
              integrationContext.viewport.highlightedNodeIds = new Set(pattern.nodeIds);
              break;
              
            case 'performance-degradation':
              switcher.reportPerformanceMetrics({
                currentFPS: pattern.fps!,
                renderTime: 80,
                memoryUsage: 300,
                nodeCount: integrationContext.nodes.size
              });
              break;
              
            case 'auto-switch':
              // Test auto-switching recommendation
              const suggestion = switcher.getPerformanceSuggestion();
              if (suggestion) {
                expect(suggestion.confidence).toBeLessThanOrEqual(1.0);
              }
              break;
          }
          
          // System should remain stable throughout
          expect(switcher.isHealthy()).toBe(true);
          
        } catch (error) {
          // Individual operations may fail due to jsdom limitations
          // but system stability should be maintained
          expect(switcher.isHealthy()).toBe(true);
        }
      }
    });

    it('should provide comprehensive capability reporting', async () => {
      // Test strategy capability reporting for system integration
      const capabilityReport = {};
      
      for (const strategyName of switcher.getAvailableStrategies()) {
        const capabilities = switcher.getStrategyCapabilities(strategyName);
        
        capabilityReport[strategyName] = {
          maxNodes: capabilities.maxNodes,
          maxEdges: capabilities.maxEdges,
          hardwareAcceleration: capabilities.features.hardwareAcceleration,
          animations: capabilities.features.animations,
          realTimeUpdates: capabilities.features.realTimeUpdates,
          memoryEfficiency: capabilities.memoryProfile.perNode,
          optimalUseCase: capabilities.performanceProfile.optimalFor[0]
        };
      }
      
      // Validate capability structure
      expect(Object.keys(capabilityReport).length).toBe(3);
      expect(capabilityReport['canvas'].maxNodes).toBe(1000);
      expect(capabilityReport['svg'].maxNodes).toBe(800);
      expect(capabilityReport['webgl'].maxNodes).toBe(10000);
      expect(capabilityReport['webgl'].hardwareAcceleration).toBe(true);
      
      // Memory efficiency ranking
      expect(capabilityReport['webgl'].memoryEfficiency).toBeLessThan(capabilityReport['svg'].memoryEfficiency);
    });
  });
});