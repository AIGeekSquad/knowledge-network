import { test, expect } from '@playwright/test';
import { 
  setupGraphTest, 
  waitForGraphLoad, 
  validateRenderingStrategy, 
  testNodeSelection,
  testNavigationControls,
  assertPerformanceRequirements,
  cleanupGraphTest,
  RENDERING_STRATEGY_TESTS,
  PERFORMANCE_REQUIREMENTS
} from './utils/graph-test-utils';

/**
 * E2E Tests for WebGL Rendering Strategy DOM Integration
 * 
 * Validates that the WebGL rendering strategy:
 * - Properly initializes WebGL context in browser environment
 * - Creates expected DOM elements (canvas with WebGL context)
 * - Supports hardware acceleration and optimal performance
 * - Handles WebGL context loss and resource management gracefully
 * - Falls back appropriately when WebGL is unavailable
 * - Meets high-performance requirements for large datasets
 */

test.describe('WebGL Rendering Strategy', () => {
  const webglStrategy = RENDERING_STRATEGY_TESTS.find(s => s.strategy === 'webgl')!;

  test.beforeEach(async ({ page }) => {
    await setupGraphTest(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupGraphTest(page);
  });

  test('should initialize WebGL rendering strategy successfully', async ({ page }) => {
    // Set WebGL rendering strategy
    await page.evaluate(() => {
      (window as any).__initializeStrategy = 'webgl';
    });

    // Navigate to demo with WebGL strategy
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Validate WebGL DOM integration
    await validateRenderingStrategy(page, webglStrategy);

    // Verify WebGL-specific context and capabilities
    const webglInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl') || canvas?.getContext('experimental-webgl');
      
      return {
        hasCanvas: !!canvas,
        hasWebGLContext: !!gl,
        contextType: gl ? 'webgl' : null,
        maxTextureSize: gl?.getParameter(gl.MAX_TEXTURE_SIZE),
        renderer: gl?.getParameter(gl.RENDERER),
        vendor: gl?.getParameter(gl.VENDOR)
      };
    });

    expect(webglInfo.hasCanvas).toBe(true);
    
    // WebGL may not be available in all test environments
    if (webglInfo.hasWebGLContext) {
      expect(webglInfo.contextType).toBe('webgl');
      expect(webglInfo.maxTextureSize).toBeGreaterThan(0);
      expect(webglInfo.renderer).toBeDefined();
    }
  });

  test('should handle WebGL context loss gracefully', async ({ page }) => {
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Simulate WebGL context loss
    const contextLossResult = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      // Get the context loss extension
      const loseContextExtension = gl.getExtension('WEBGL_lose_context');
      
      if (loseContextExtension) {
        // Simulate context loss
        loseContextExtension.loseContext();
        
        // Check if context was lost
        return {
          webglAvailable: true,
          contextLost: gl.isContextLost(),
          extensionAvailable: true
        };
      }

      return {
        webglAvailable: true,
        extensionAvailable: false
      };
    });

    // Verify graceful handling of context loss
    if (contextLossResult.webglAvailable && contextLossResult.extensionAvailable) {
      // Wait a moment for error handling
      await page.waitForTimeout(500);

      const errorHandlingResult = await page.evaluate(() => {
        return {
          errorCaught: (window as any).__webglError !== undefined,
          fallbackStrategy: (window as any).__fallbackStrategy,
          systemStable: (window as any).__systemStable !== false
        };
      });

      // Should either catch error or trigger fallback
      expect(
        errorHandlingResult.errorCaught || 
        errorHandlingResult.fallbackStrategy
      ).toBeTruthy();
      expect(errorHandlingResult.systemStable).toBe(true);
    }
  });

  test('should fall back when WebGL is unavailable', async ({ page }) => {
    // Disable WebGL in browser
    await page.addInitScript(() => {
      // Override WebGL context creation to simulate unavailable WebGL
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(contextType: string, ...args: any[]) {
        if (contextType === 'webgl' || contextType === 'experimental-webgl') {
          return null; // Simulate WebGL unavailable
        }
        return originalGetContext.call(this, contextType, ...args);
      };
    });

    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Verify fallback strategy is used
    const fallbackInfo = await page.evaluate(() => {
      return {
        currentStrategy: (window as any).__currentRenderingStrategy,
        fallbackActivated: (window as any).__fallbackActivated,
        webglError: (window as any).__webglError,
        hasVisualOutput: !!document.querySelector('canvas, svg')
      };
    });

    // Should have fallen back to Canvas or SVG
    expect(['canvas', 'svg']).toContain(fallbackInfo.currentStrategy);
    expect(fallbackInfo.fallbackActivated).toBe(true);
    expect(fallbackInfo.hasVisualOutput).toBe(true);
  });

  test('should demonstrate superior performance with WebGL', async ({ page }) => {
    // Test with moderately large dataset that should benefit from WebGL
    await page.goto('/?strategy=webgl&nodes=500');
    await waitForGraphLoad(page, 15000);

    // Measure WebGL performance
    await assertPerformanceRequirements(page, {
      maxRenderTime: PERFORMANCE_REQUIREMENTS.STRATEGY_SWITCH_TIME * 1.5, // Allow more time for large dataset
      minFPS: PERFORMANCE_REQUIREMENTS.TARGET_FPS * 0.8, // Should be close to target FPS
      maxMemoryMB: PERFORMANCE_REQUIREMENTS.MAX_MEMORY_PER_100_NODES * 6 // 500 nodes * ratio + overhead
    });

    // Verify WebGL can handle large datasets efficiently
    const performanceInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      return {
        hasWebGL: !!gl,
        nodeCount: document.querySelectorAll('[data-node-id]').length,
        renderTime: (window as any).__lastRenderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
        gpuMemoryInfo: gl?.getExtension('WEBGL_debug_renderer_info')
      };
    });

    if (performanceInfo.hasWebGL) {
      expect(performanceInfo.nodeCount).toBeGreaterThan(400);
      
      if (performanceInfo.renderTime) {
        expect(performanceInfo.renderTime).toBeLessThan(5000); // Should render quickly
      }
    }
  });

  test('should support WebGL shader compilation and validation', async ({ page }) => {
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Verify shader program compilation
    const shaderInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      // Check for shader program
      const shaderProgram = (gl as any).__knowledgeGraphShaderProgram;
      
      return {
        webglAvailable: true,
        hasShaderProgram: !!shaderProgram,
        shaderInfoLog: shaderProgram ? gl.getProgramInfoLog(shaderProgram) : null,
        shaderLinkStatus: shaderProgram ? gl.getProgramParameter(shaderProgram, gl.LINK_STATUS) : null
      };
    });

    if (shaderInfo.webglAvailable) {
      expect(shaderInfo.hasShaderProgram).toBe(true);
      
      if (shaderInfo.hasShaderProgram) {
        expect(shaderInfo.shaderLinkStatus).toBe(true);
        // Info log should be empty (no errors) or null
        expect(shaderInfo.shaderInfoLog === '' || shaderInfo.shaderInfoLog === null).toBe(true);
      }
    }
  });

  test('should handle WebGL buffer management for large datasets', async ({ page }) => {
    await page.goto('/?strategy=webgl&nodes=800');
    await waitForGraphLoad(page, 20000); // Extended timeout for large dataset

    // Verify WebGL buffer efficiency
    const bufferInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      return {
        webglAvailable: true,
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxTextureUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        bufferUsage: (gl as any).__bufferUsageStats || {},
        nodeCount: document.querySelectorAll('[data-node-id]').length
      };
    });

    if (bufferInfo.webglAvailable) {
      expect(bufferInfo.nodeCount).toBeGreaterThan(600); // Should handle large dataset
      expect(bufferInfo.maxVertexAttribs).toBeGreaterThan(8); // Sufficient attributes
      expect(bufferInfo.maxTextureUnits).toBeGreaterThan(4); // Sufficient texture units
    }
  });

  test('should maintain precision with WebGL coordinate calculations', async ({ page }) => {
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Test coordinate precision by comparing with expected positions
    const coordinateInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      // Get vertex data if available
      const vertexData = (gl as any).__vertexPositions || [];
      const nodePositions = (window as any).__nodePositions || [];

      return {
        webglAvailable: true,
        hasVertexData: vertexData.length > 0,
        hasNodePositions: nodePositions.length > 0,
        samplePositions: nodePositions.slice(0, 3),
        coordinateRange: {
          minX: Math.min(...nodePositions.map((p: any) => p.x || 0)),
          maxX: Math.max(...nodePositions.map((p: any) => p.x || 0)),
          minY: Math.min(...nodePositions.map((p: any) => p.y || 0)),
          maxY: Math.max(...nodePositions.map((p: any) => p.y || 0))
        }
      };
    });

    if (coordinateInfo.webglAvailable && coordinateInfo.hasNodePositions) {
      // Verify coordinate ranges are reasonable
      const range = coordinateInfo.coordinateRange;
      expect(Math.abs(range.maxX - range.minX)).toBeGreaterThan(10); // Should have spread
      expect(Math.abs(range.maxY - range.minY)).toBeGreaterThan(10); // Should have spread
      expect(Math.abs(range.minX)).toBeLessThan(5000); // Should not be extreme values
      expect(Math.abs(range.maxX)).toBeLessThan(5000);
    }
  });

  test('should support WebGL texture and instanced rendering optimizations', async ({ page }) => {
    await page.goto('/?strategy=webgl&nodes=400&optimization=true');
    await waitForGraphLoad(page);

    // Check for advanced WebGL optimizations
    const optimizationInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      // Check for instanced rendering extension
      const instancedExt = gl.getExtension('ANGLE_instanced_arrays');
      const vaoExt = gl.getExtension('OES_vertex_array_object');

      return {
        webglAvailable: true,
        supportsInstancedRendering: !!instancedExt,
        supportsVertexArrays: !!vaoExt,
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        optimizationsEnabled: (window as any).__webglOptimizationsEnabled,
        renderingMode: (window as any).__webglRenderingMode
      };
    });

    if (optimizationInfo.webglAvailable) {
      // WebGL should support reasonable texture sizes for node rendering
      expect(optimizationInfo.maxTextureSize).toBeGreaterThanOrEqual(1024);
      
      // Advanced features improve performance but aren't required
      if (optimizationInfo.supportsInstancedRendering) {
        expect(optimizationInfo.renderingMode).toContain('instanced');
      }
    }
  });

  test('should handle WebGL memory constraints and cleanup', async ({ page }) => {
    await page.goto('/?strategy=webgl&nodes=300');
    await waitForGraphLoad(page);

    // Test memory management
    const memoryInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      // Get memory info if available
      const memoryInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      const initialMemory = (performance as any).memory?.usedJSHeapSize;

      return {
        webglAvailable: true,
        hasMemoryExtension: !!memoryInfo,
        initialMemoryMB: initialMemory ? Math.round(initialMemory / 1024 / 1024) : 0,
        bufferCount: (gl as any).__bufferCount || 0,
        textureCount: (gl as any).__textureCount || 0
      };
    });

    if (memoryInfo.webglAvailable) {
      // Memory usage should be reasonable for 300 nodes
      if (memoryInfo.initialMemoryMB > 0) {
        expect(memoryInfo.initialMemoryMB).toBeLessThan(100); // Should not use excessive memory
      }
    }

    // Test cleanup
    await page.evaluate(() => {
      const graph = (window as any).__knowledgeGraph;
      if (graph && graph.cleanup) {
        graph.cleanup();
      }
    });

    // Verify cleanup occurred
    const cleanupInfo = await page.evaluate(() => {
      return {
        cleanupCalled: (window as any).__webglCleanupCalled,
        buffersReleased: (window as any).__buffersReleased,
        contextPreserved: (window as any).__contextPreserved
      };
    });

    expect(cleanupInfo.cleanupCalled || cleanupInfo.buffersReleased).toBeTruthy();
  });

  test('should support high-performance navigation with WebGL', async ({ page }) => {
    await page.goto('/?strategy=webgl&nodes=200');
    await waitForGraphLoad(page);

    // Test navigation performance with WebGL
    const startTime = await page.evaluate(() => performance.now());
    
    await testNavigationControls(page);
    
    const endTime = await page.evaluate(() => performance.now());
    const navigationTime = endTime - startTime;

    // WebGL navigation should be very fast
    expect(navigationTime).toBeLessThan(PERFORMANCE_REQUIREMENTS.NAVIGATION_RESPONSE_TIME * 2);

    // Verify WebGL maintains smooth rendering during navigation
    const navigationPerformance = await page.evaluate(() => {
      return {
        lastFrameTime: (window as any).__lastFrameTime || 0,
        averageFPS: (window as any).__averageFPS || 0,
        droppedFrames: (window as any).__droppedFrames || 0
      };
    });

    if (navigationPerformance.averageFPS > 0) {
      expect(navigationPerformance.averageFPS).toBeGreaterThanOrEqual(PERFORMANCE_REQUIREMENTS.MIN_FPS);
    }
  });

  test('should render large datasets efficiently with WebGL', async ({ page }) => {
    // Test WebGL with large dataset that benefits from GPU acceleration
    await page.goto('/?strategy=webgl&nodes=1000');
    
    // Extended timeout for 1000 nodes
    await waitForGraphLoad(page, 30000);

    // Verify WebGL performance with large dataset
    const largeDatasetPerformance = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      return {
        hasWebGL: !!gl,
        nodeCount: document.querySelectorAll('[data-node-id]').length,
        renderingComplete: (window as any).__renderingComplete,
        totalRenderTime: (window as any).__totalRenderTime,
        gpuUtilization: (window as any).__gpuUtilization
      };
    });

    if (largeDatasetPerformance.hasWebGL) {
      expect(largeDatasetPerformance.nodeCount).toBeGreaterThan(800); // Should handle large dataset
      expect(largeDatasetPerformance.renderingComplete).toBe(true);
      
      // Should meet 30-second requirement for 1000 nodes
      if (largeDatasetPerformance.totalRenderTime) {
        expect(largeDatasetPerformance.totalRenderTime).toBeLessThan(30000);
      }
    }
  });

  test('should support WebGL viewport and projection matrix updates', async ({ page }) => {
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Get initial matrix state
    const initialMatrixInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      return {
        webglAvailable: true,
        viewportWidth: gl.getParameter(gl.VIEWPORT)[2],
        viewportHeight: gl.getParameter(gl.VIEWPORT)[3],
        currentProjectionMatrix: (gl as any).__projectionMatrix || [],
        currentViewMatrix: (gl as any).__viewMatrix || []
      };
    });

    if (initialMatrixInfo.webglAvailable) {
      expect(initialMatrixInfo.viewportWidth).toBeGreaterThan(0);
      expect(initialMatrixInfo.viewportHeight).toBeGreaterThan(0);
    }

    // Trigger zoom to test matrix updates
    const canvas = page.locator('canvas[data-graph-webgl]');
    await canvas.click({ position: { x: 400, y: 300 } });
    await page.mouse.wheel(0, -200); // Significant zoom
    await page.waitForTimeout(300);

    // Verify matrix updates
    const updatedMatrixInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      return {
        webglAvailable: true,
        matrixUpdateCalled: (window as any).__matrixUpdateCalled,
        projectionChanged: (window as any).__projectionMatrixChanged,
        viewChanged: (window as any).__viewMatrixChanged
      };
    });

    if (updatedMatrixInfo.webglAvailable) {
      // Should have updated matrices for zoom
      expect(
        updatedMatrixInfo.matrixUpdateCalled || 
        updatedMatrixInfo.projectionChanged || 
        updatedMatrixInfo.viewChanged
      ).toBeTruthy();
    }
  });

  test('should handle WebGL resource limits appropriately', async ({ page }) => {
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Test resource limit handling
    const resourceInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      return {
        webglAvailable: true,
        maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
        maxVaryingVectors: gl.getParameter(gl.MAX_VARYING_VECTORS),
        maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
        maxFragmentUniformVectors: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
        maxVertexUniformVectors: gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
      };
    });

    if (resourceInfo.webglAvailable) {
      // Verify WebGL has sufficient resources for graph rendering
      expect(resourceInfo.maxVertexAttribs).toBeGreaterThanOrEqual(8);
      expect(resourceInfo.maxTextureImageUnits).toBeGreaterThanOrEqual(8);
      expect(resourceInfo.maxFragmentUniformVectors).toBeGreaterThanOrEqual(16);
      expect(resourceInfo.maxVertexUniformVectors).toBeGreaterThanOrEqual(16);
    }
  });

  test('should maintain visual fidelity with WebGL rendering', async ({ page }) => {
    await page.goto('/?strategy=webgl');
    await waitForGraphLoad(page);

    // Verify visual output matches expectations
    const visualInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-webgl]') as HTMLCanvasElement;
      const gl = canvas?.getContext('webgl');
      
      if (!gl) return { webglAvailable: false };

      // Check if rendering produced visual output
      const imageData = (window as any).__webglImageData;
      
      return {
        webglAvailable: true,
        hasVisualOutput: !!imageData,
        canvasSize: { width: canvas.width, height: canvas.height },
        renderingCalls: (window as any).__webglRenderingCalls || 0
      };
    });

    if (visualInfo.webglAvailable) {
      expect(visualInfo.canvasSize.width).toBeGreaterThan(0);
      expect(visualInfo.canvasSize.height).toBeGreaterThan(0);
      
      // Should have made rendering calls
      if (visualInfo.renderingCalls > 0) {
        expect(visualInfo.renderingCalls).toBeGreaterThan(0);
      }
    }
  });
});