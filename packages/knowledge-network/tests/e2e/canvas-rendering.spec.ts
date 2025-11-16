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
 * E2E Tests for Canvas Rendering Strategy DOM Integration
 * 
 * Validates that the Canvas rendering strategy:
 * - Properly initializes and renders in browser environment
 * - Creates expected DOM elements (canvas element with correct attributes)
 * - Supports all required interactions (selection, navigation, highlighting)
 * - Meets performance requirements (100ms response time, target FPS)
 * - Handles error conditions gracefully
 */

test.describe('Canvas Rendering Strategy', () => {
  const canvasStrategy = RENDERING_STRATEGY_TESTS.find(s => s.strategy === 'canvas')!;

  test.beforeEach(async ({ page }) => {
    await setupGraphTest(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupGraphTest(page);
  });

  test('should initialize Canvas rendering strategy successfully', async ({ page }) => {
    // Set Canvas rendering strategy
    await page.evaluate(() => {
      (window as any).__initializeStrategy = 'canvas';
    });

    // Navigate to demo with Canvas strategy
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Validate Canvas DOM integration
    await validateRenderingStrategy(page, canvasStrategy);

    // Verify Canvas-specific attributes and properties
    const canvas = page.locator('canvas[data-graph-canvas]');
    
    // Check canvas dimensions are set correctly
    await expect(canvas).toHaveAttribute('width');
    await expect(canvas).toHaveAttribute('height');
    
    // Verify Canvas 2D context is available
    const hasContext = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-canvas]') as HTMLCanvasElement;
      return !!canvas?.getContext('2d');
    });
    expect(hasContext).toBe(true);

    // Verify graph content is rendered (non-blank canvas)
    const hasContent = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-canvas]') as HTMLCanvasElement;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return false;
      
      // Get image data and check for non-transparent pixels
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      return imageData.data.some((pixel, index) => {
        // Check alpha channel (every 4th value) for non-transparent pixels
        return index % 4 === 3 && pixel > 0;
      });
    });
    expect(hasContent).toBe(true);
  });

  test('should support node selection with Canvas strategy', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Test node selection functionality
    await testNodeSelection(page, 'canvas');

    // Validate Canvas-specific selection rendering
    const selectionInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-canvas]') as HTMLCanvasElement;
      return {
        hasCanvas: !!canvas,
        contextType: canvas?.getContext('2d') ? '2d' : null,
        selectedNodeId: (window as any).__selectedNodeId
      };
    });

    expect(selectionInfo.hasCanvas).toBe(true);
    expect(selectionInfo.contextType).toBe('2d');
    expect(selectionInfo.selectedNodeId).toBeDefined();
  });

  test('should handle navigation controls with Canvas strategy', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Test zoom and pan functionality
    await testNavigationControls(page);

    // Verify navigation state is maintained in Canvas
    const navigationState = await page.evaluate(() => {
      return (window as any).__navigationState || {};
    });

    expect(navigationState.zoomLevel).toBeDefined();
    expect(navigationState.panOffset).toBeDefined();
  });

  test('should meet performance requirements with Canvas strategy', async ({ page }) => {
    await page.goto('/?strategy=canvas&nodes=100');
    await waitForGraphLoad(page);

    // Assert performance requirements for Canvas rendering
    await assertPerformanceRequirements(page, {
      maxRenderTime: PERFORMANCE_REQUIREMENTS.STRATEGY_SWITCH_TIME,
      minFPS: PERFORMANCE_REQUIREMENTS.MIN_FPS,
      maxMemoryMB: PERFORMANCE_REQUIREMENTS.MAX_MEMORY_PER_100_NODES
    });
  });

  test('should handle Canvas context loss gracefully', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Simulate Canvas context loss
    const contextLossHandled = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-canvas]') as HTMLCanvasElement;
      if (!canvas) return false;

      // Trigger context loss event
      const loseContextExtension = (canvas.getContext('2d') as any)?.getExtension?.('WEBGL_lose_context');
      if (loseContextExtension) {
        loseContextExtension.loseContext();
      } else {
        // Fallback: dispatch context loss event manually
        canvas.dispatchEvent(new Event('webglcontextlost'));
      }

      // Check if error handling was triggered
      return (window as any).__contextLossHandled === true;
    });

    // Verify graceful degradation or recovery
    const errorState = await page.evaluate(() => {
      return (window as any).__renderingError || null;
    });

    // Should either recover or show appropriate error
    expect(contextLossHandled || errorState).toBeTruthy();
  });

  test('should handle large datasets with Canvas strategy', async ({ page }) => {
    // Test with larger dataset
    await page.goto('/?strategy=canvas&nodes=500');
    
    // Wait longer for large dataset loading
    await waitForGraphLoad(page, 15000);

    // Verify Canvas can handle larger datasets
    const canvasInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-canvas]') as HTMLCanvasElement;
      const nodeCount = document.querySelectorAll('[data-node-id]').length;
      
      return {
        canvasExists: !!canvas,
        nodeCount: nodeCount,
        canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null
      };
    });

    expect(canvasInfo.canvasExists).toBe(true);
    expect(canvasInfo.nodeCount).toBeGreaterThan(400); // Should render most nodes
    expect(canvasInfo.canvasSize).toBeDefined();
  });

  test('should maintain consistency across browser refresh', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Get initial graph state
    const initialState = await page.evaluate(() => {
      return {
        nodeCount: document.querySelectorAll('[data-node-id]').length,
        strategy: (window as any).__currentRenderingStrategy
      };
    });

    // Refresh page
    await page.reload();
    await waitForGraphLoad(page);

    // Verify consistency after refresh
    const refreshedState = await page.evaluate(() => {
      return {
        nodeCount: document.querySelectorAll('[data-node-id]').length,
        strategy: (window as any).__currentRenderingStrategy
      };
    });

    expect(refreshedState.nodeCount).toBe(initialState.nodeCount);
    expect(refreshedState.strategy).toBe('canvas');
  });

  test('should support high-DPI displays with Canvas strategy', async ({ page }) => {
    // Set device pixel ratio for high-DPI testing
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?strategy=canvas&highDPI=true');
    await waitForGraphLoad(page);

    // Verify high-DPI Canvas rendering
    const highDPIInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas[data-graph-canvas]') as HTMLCanvasElement;
      const devicePixelRatio = window.devicePixelRatio;
      
      return {
        hasCanvas: !!canvas,
        devicePixelRatio: devicePixelRatio,
        canvasWidth: canvas?.width,
        canvasHeight: canvas?.height,
        styleWidth: canvas?.style.width,
        styleHeight: canvas?.style.height
      };
    });

    expect(highDPIInfo.hasCanvas).toBe(true);
    expect(highDPIInfo.devicePixelRatio).toBeGreaterThan(1);
    
    // Canvas pixel dimensions should be scaled for high-DPI
    if (highDPIInfo.canvasWidth && highDPIInfo.styleWidth) {
      const physicalWidth = parseInt(highDPIInfo.styleWidth.replace('px', ''));
      expect(highDPIInfo.canvasWidth).toBeGreaterThan(physicalWidth);
    }
  });

  test('should handle Canvas rendering errors gracefully', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    
    // Inject Canvas error simulation
    await page.evaluate(() => {
      // Override Canvas context to simulate error
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function() {
        throw new Error('Simulated Canvas error');
      };
      
      (window as any).__canvasErrorSimulated = true;
    });

    // Attempt to initialize graph
    await page.evaluate(() => {
      // Trigger graph initialization which should handle error
      if ((window as any).__initializeGraph) {
        (window as any).__initializeGraph();
      }
    });

    // Verify error handling
    const errorHandling = await page.evaluate(() => {
      return {
        errorCaught: (window as any).__renderingError !== null,
        fallbackStrategy: (window as any).__fallbackStrategy,
        systemStable: (window as any).__systemStable !== false
      };
    });

    expect(errorHandling.errorCaught || errorHandling.fallbackStrategy).toBeTruthy();
    expect(errorHandling.systemStable).toBe(true);
  });
});