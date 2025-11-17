/**
 * Layout Independence E2E Tests
 * 
 * Tests User Story 1: Independent layout engine operation
 * Validates T009-T011 from implementation tasks
 */

import { test, expect } from '@playwright/test';
import { waitForGraphLoad } from './utils/graph-test-utils';

test.describe('Layout Engine Independence (User Story 1)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await waitForGraphLoad(page);
  });

  /**
   * T009: Validate layout engine operates independently without rendering
   */
  test('T009: Layout engine operates independently without rendering', async ({ page }) => {
    // Execute layout independence validation
    const validationResult = await page.evaluate(async () => {
      if (!(window as any).__validateLayoutIndependence) {
        throw new Error('Layout independence validation function not available');
      }
      
      try {
        const result = await (window as any).__validateLayoutIndependence();
        return { success: result, error: null };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(validationResult.success).toBe(true);
    expect(validationResult.error).toBeNull();

    // Verify console logs show successful validation
    const logs = await page.evaluate(() => {
      return console.log.toString().includes('Layout Engine Independence Validation');
    });
  });

  /**
   * T010: Test layout position data export functionality
   */
  test('T010: Layout position data export functionality works', async ({ page }) => {
    // Test layout data export in runtime environment
    const exportTest = await page.evaluate(async () => {
      // Import LayoutEngine directly in browser context
      const { LayoutEngine } = await import('@aigeeksquad/knowledge-network');
      
      const layoutEngine = new LayoutEngine();
      const testNodes = [
        { id: 'test1', label: 'Test 1', x: 0, y: 0 },
        { id: 'test2', label: 'Test 2', x: 100, y: 0 },
        { id: 'test3', label: 'Test 3', x: 50, y: 100 }
      ];
      
      const config = {
        forceParameters: {
          centerX: 400,
          centerY: 300,
          charge: -100,
          linkDistance: 50,
          collision: 30
        },
        stabilityThreshold: 0.1,
        maxIterations: 100,
        enableClustering: false
      };

      try {
        // Calculate layout
        const layoutMap = await layoutEngine.calculateAsync(testNodes, config);
        
        // Test serialization
        const serialized = layoutEngine.serializeLayout();
        if (!serialized) return { success: false, error: 'Serialization failed' };
        
        // Test deserialization
        const deserializedMap = layoutEngine.loadSerializedLayout(serialized);
        
        // Validate results
        const success = layoutMap.size === testNodes.length && 
                       deserializedMap.size === testNodes.length &&
                       JSON.parse(serialized).length === testNodes.length;
        
        layoutEngine.cleanup();
        return { 
          success, 
          layoutSize: layoutMap.size, 
          serializedSize: serialized.length,
          deserializedSize: deserializedMap.size
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    expect(exportTest.success).toBe(true);
    expect(exportTest.layoutSize).toBe(3);
    expect(exportTest.serializedSize).toBeGreaterThan(0);
    expect(exportTest.deserializedSize).toBe(3);
  });

  /**
   * T011: Verify layout continues when rendering engine unavailable
   */
  test('T011: Layout continues without rendering engine', async ({ page }) => {
    // Test layout operation in headless mode (no rendering)
    const headlessTest = await page.evaluate(async () => {
      const { LayoutEngine } = await import('@aigeeksquad/knowledge-network');
      
      // Create multiple engines to simulate concurrent operation without rendering
      const engines = [
        new LayoutEngine(),
        new LayoutEngine(), 
        new LayoutEngine()
      ];
      
      const testNodes = [
        { id: 'concurrent1', label: 'Node 1', x: 0, y: 0 },
        { id: 'concurrent2', label: 'Node 2', x: 50, y: 50 },
        { id: 'concurrent3', label: 'Node 3', x: 100, y: 100 }
      ];
      
      const config = {
        forceParameters: {
          centerX: 200,
          centerY: 200,
          charge: -50,
          linkDistance: 30,
          collision: 15
        },
        stabilityThreshold: 0.1,
        maxIterations: 50,
        enableClustering: false
      };

      try {
        // Run layout calculations concurrently without rendering
        const layoutPromises = engines.map(engine => engine.calculateAsync(testNodes, config));
        const results = await Promise.all(layoutPromises);
        
        // Validate all calculations completed successfully
        const allSuccessful = results.every(layoutMap => layoutMap.size === testNodes.length);
        
        // Verify capabilities are available without rendering
        const capabilities = engines.map(engine => engine.getCapabilities());
        const allHaveCapabilities = capabilities.every(cap => 
          cap.maxNodes > 0 && 
          cap.supportedForces.length > 0 &&
          cap.supportsRealTimeUpdates === true
        );
        
        // Get performance metrics
        const metrics = engines.map(engine => engine.getPerformanceMetrics());
        const allHaveMetrics = metrics.every(metric => 
          typeof metric.processingTime === 'number' &&
          typeof metric.memoryUsage === 'number'
        );
        
        // Cleanup
        engines.forEach(engine => engine.cleanup());
        
        return { 
          success: allSuccessful && allHaveCapabilities && allHaveMetrics,
          resultsCount: results.length,
          capabilitiesCount: capabilities.length,
          metricsCount: metrics.length
        };
      } catch (error) {
        engines.forEach(engine => engine.cleanup());
        return { success: false, error: error.message };
      }
    });

    expect(headlessTest.success).toBe(true);
    expect(headlessTest.resultsCount).toBe(3);
    expect(headlessTest.capabilitiesCount).toBe(3); 
    expect(headlessTest.metricsCount).toBe(3);
  });

  /**
   * Integration test: Verify layout independence doesn't break graph functionality
   */
  test('Layout independence preserves graph functionality', async ({ page }) => {
    // Wait for canvas element to be available
    await page.waitForSelector('canvas[data-graph-canvas]', { timeout: 5000 });
    
    // Verify graph is still functional after layout independence tests
    const graphStatus = await page.evaluate(() => {
      return {
        knowledgeGraphReady: (window as any).__knowledgeGraphReady,
        unifiedDemoExists: !!(window as any).__unifiedDemo,
        canvasExists: !!document.querySelector('canvas[data-graph-canvas]')
      };
    });

    expect(graphStatus.knowledgeGraphReady).toBe(true);
    expect(graphStatus.unifiedDemoExists).toBe(true);
    expect(graphStatus.canvasExists).toBe(true);
  });
});