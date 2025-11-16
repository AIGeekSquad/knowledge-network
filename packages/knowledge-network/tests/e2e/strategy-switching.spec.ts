import { test, expect } from '@playwright/test';
import { 
  setupGraphTest, 
  waitForGraphLoad, 
  testStrategySwitching,
  assertPerformanceRequirements,
  cleanupGraphTest,
  PERFORMANCE_REQUIREMENTS
} from './utils/graph-test-utils';

/**
 * E2E Tests for Rendering Strategy Switching Visual Validation
 * 
 * This is the CORE TEST for the modular architecture requirement.
 * Validates that users can switch between rendering strategies while:
 * - Maintaining consistent node positions (FR-007)
 * - Preserving navigation state and zoom level
 * - Completing switches within 2 seconds (SC-002)
 * - Maintaining identical interaction behavior across strategies
 * - Ensuring visual consistency and no data loss during transitions
 */

test.describe('Rendering Strategy Switching', () => {
  
  test.beforeEach(async ({ page }) => {
    await setupGraphTest(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupGraphTest(page);
  });

  test('should switch from Canvas to SVG maintaining node positions', async ({ page }) => {
    // Start with Canvas strategy
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Test strategy switching with position preservation
    await testStrategySwitching(page, 'canvas', 'svg');

    // Verify SVG elements are now present
    const svgExists = await page.locator('svg[data-graph-svg]').isVisible();
    expect(svgExists).toBe(true);

    // Verify Canvas elements are removed/hidden
    const canvasVisible = await page.locator('canvas[data-graph-canvas]').isVisible();
    expect(canvasVisible).toBe(false);
  });

  test('should switch from SVG to WebGL maintaining state', async ({ page }) => {
    // Start with SVG strategy
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Select a node and set navigation state
    const nodeToSelect = page.locator('circle[data-node-id="node1"]');
    await nodeToSelect.click();
    
    // Zoom in to create navigation state
    await page.mouse.wheel(0, -200);
    await page.waitForTimeout(300);

    // Capture state before switching
    const beforeState = await page.evaluate(() => {
      return {
        selectedNodeId: (window as any).__selectedNodeId,
        zoomLevel: (window as any).__navigationState?.zoomLevel,
        panOffset: (window as any).__navigationState?.panOffset
      };
    });

    // Switch to WebGL strategy
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
    await strategySelector.selectOption('webgl');

    // Wait for strategy switch
    await page.waitForTimeout(2000);
    await waitForGraphLoad(page);

    // Capture state after switching
    const afterState = await page.evaluate(() => {
      return {
        selectedNodeId: (window as any).__selectedNodeId,
        zoomLevel: (window as any).__navigationState?.zoomLevel,
        currentStrategy: (window as any).__currentRenderingStrategy,
        webglCanvas: !!document.querySelector('canvas[data-graph-webgl]')
      };
    });

    // Verify state preservation
    expect(afterState.currentStrategy).toBe('webgl');
    expect(afterState.webglCanvas).toBe(true);
    expect(afterState.selectedNodeId).toBe(beforeState.selectedNodeId);
    
    // Allow for small floating point differences in zoom
    if (beforeState.zoomLevel && afterState.zoomLevel) {
      expect(Math.abs(afterState.zoomLevel - beforeState.zoomLevel)).toBeLessThan(0.1);
    }
  });

  test('should complete all strategy switches within 2 seconds', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Test all possible strategy transitions
    const transitions = [
      { from: 'canvas', to: 'svg' },
      { from: 'svg', to: 'webgl' },
      { from: 'webgl', to: 'canvas' }
    ];

    for (const transition of transitions) {
      const startTime = await page.evaluate(() => performance.now());

      // Switch strategy
      const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
      await strategySelector.selectOption(transition.to);

      // Wait for completion
      await page.waitForFunction(
        (expectedStrategy) => (window as any).__currentRenderingStrategy === expectedStrategy,
        transition.to,
        { timeout: 3000 }
      );

      const endTime = await page.evaluate(() => performance.now());
      const switchTime = endTime - startTime;

      // Verify 2-second requirement (SC-002)
      expect(switchTime).toBeLessThan(PERFORMANCE_REQUIREMENTS.STRATEGY_SWITCH_TIME);

      // Brief pause between transitions
      await page.waitForTimeout(200);
    }
  });

  test('should maintain interaction behavior consistency across strategies', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Test interaction behavior for each strategy
    const strategies = ['canvas', 'svg', 'webgl'];
    const interactionResults = [];

    for (const strategy of strategies) {
      // Switch to strategy
      const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
      await strategySelector.selectOption(strategy);
      await waitForGraphLoad(page);

      // Test node selection timing
      const selectionStart = await page.evaluate(() => performance.now());
      
      const nodeSelector = strategy === 'svg' ? 'circle[data-node-id="node1"]' : '[data-node-id="node1"]';
      await page.locator(nodeSelector).click();
      
      const selectionEnd = await page.evaluate(() => performance.now());
      const selectionTime = selectionEnd - selectionStart;

      // Test navigation response timing
      const navigationStart = await page.evaluate(() => performance.now());
      await page.mouse.wheel(0, -50); // Small zoom
      await page.waitForTimeout(100);
      const navigationEnd = await page.evaluate(() => performance.now());
      const navigationTime = navigationEnd - navigationStart;

      interactionResults.push({
        strategy,
        selectionTime,
        navigationTime,
        selectedNode: await page.evaluate(() => (window as any).__selectedNodeId)
      });

      // Clear selection for next test
      await page.evaluate(() => {
        (window as any).__selectedNodeId = null;
      });
    }

    // Verify consistent behavior across strategies
    interactionResults.forEach(result => {
      // Selection should be fast (100ms requirement)
      expect(result.selectionTime).toBeLessThan(PERFORMANCE_REQUIREMENTS.NAVIGATION_RESPONSE_TIME * 2);
      
      // Navigation should meet response time requirement
      expect(result.navigationTime).toBeLessThan(PERFORMANCE_REQUIREMENTS.NAVIGATION_RESPONSE_TIME * 2);
      
      // Should successfully select nodes
      expect(result.selectedNode).toBeDefined();
    });

    // All strategies should have similar performance characteristics
    const selectionTimes = interactionResults.map(r => r.selectionTime);
    const maxSelectionTime = Math.max(...selectionTimes);
    const minSelectionTime = Math.min(...selectionTimes);
    
    // Performance should be reasonably consistent (within 3x factor)
    expect(maxSelectionTime / minSelectionTime).toBeLessThan(3.0);
  });

  test('should handle rapid strategy switching without errors', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Rapid strategy switching stress test
    const strategies = ['svg', 'webgl', 'canvas', 'svg', 'webgl'];
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);

    for (let i = 0; i < strategies.length; i++) {
      const strategy = strategies[i];
      
      await strategySelector.selectOption(strategy);
      
      // Short wait between switches
      await page.waitForTimeout(300);
      
      // Verify no errors occurred
      const errorState = await page.evaluate(() => {
        return {
          jsErrors: (window as any).__jsErrors || [],
          renderingErrors: (window as any).__renderingErrors || [],
          currentStrategy: (window as any).__currentRenderingStrategy
        };
      });

      expect(errorState.jsErrors).toHaveLength(0);
      expect(errorState.renderingErrors).toHaveLength(0);
      expect(errorState.currentStrategy).toBe(strategy);
    }

    // Final verification that graph is still functional
    const finalState = await page.evaluate(() => {
      return {
        hasVisualElements: !!document.querySelector('canvas, svg'),
        canInteract: (window as any).__interactionEnabled !== false,
        nodeCount: document.querySelectorAll('[data-node-id]').length
      };
    });

    expect(finalState.hasVisualElements).toBe(true);
    expect(finalState.canInteract).toBe(true);
    expect(finalState.nodeCount).toBeGreaterThan(0);
  });

  test('should preserve complex navigation state during strategy switching', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Create complex navigation state
    // 1. Select a node
    const targetNode = page.locator('[data-node-id="node2"]');
    await targetNode.click();

    // 2. Zoom to specific level
    await page.mouse.wheel(0, -300); // Zoom in significantly
    await page.waitForTimeout(200);

    // 3. Pan to offset position
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(500, 200);
    await page.mouse.up();
    await page.waitForTimeout(200);

    // Capture complex state
    const complexStateBefore = await page.evaluate(() => {
      return {
        selectedNodeId: (window as any).__selectedNodeId,
        zoomLevel: (window as any).__navigationState?.zoomLevel,
        panOffset: (window as any).__navigationState?.panOffset,
        highlightedNodes: Array.from(document.querySelectorAll('[data-highlighted="true"]')).map(n => n.getAttribute('data-node-id')),
        viewBounds: (window as any).__navigationState?.viewBounds
      };
    });

    // Switch strategy
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
    await strategySelector.selectOption('svg');
    await waitForGraphLoad(page);

    // Verify complex state preservation
    const complexStateAfter = await page.evaluate(() => {
      return {
        selectedNodeId: (window as any).__selectedNodeId,
        zoomLevel: (window as any).__navigationState?.zoomLevel,
        panOffset: (window as any).__navigationState?.panOffset,
        highlightedNodes: Array.from(document.querySelectorAll('[data-highlighted="true"]')).map(n => n.getAttribute('data-node-id')),
        currentStrategy: (window as any).__currentRenderingStrategy
      };
    });

    expect(complexStateAfter.currentStrategy).toBe('svg');
    expect(complexStateAfter.selectedNodeId).toBe(complexStateBefore.selectedNodeId);
    
    // Zoom and pan should be approximately preserved
    if (complexStateBefore.zoomLevel && complexStateAfter.zoomLevel) {
      expect(Math.abs(complexStateAfter.zoomLevel - complexStateBefore.zoomLevel)).toBeLessThan(0.2);
    }
    
    // Highlighted nodes should be preserved
    expect(complexStateAfter.highlightedNodes).toEqual(complexStateBefore.highlightedNodes);
  });

  test('should handle strategy switching during active layout calculation', async ({ page }) => {
    // Load larger dataset that will take time to layout
    await page.goto('/?strategy=canvas&nodes=300&layout=slow');
    
    // Don't wait for full load - switch during layout
    await page.waitForTimeout(1000);

    // Switch strategy during layout
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
    await strategySelector.selectOption('svg');

    // Wait for both layout and strategy switch to complete
    await waitForGraphLoad(page, 15000);

    // Verify successful transition
    const transitionResult = await page.evaluate(() => {
      return {
        currentStrategy: (window as any).__currentRenderingStrategy,
        layoutComplete: (window as any).__layoutComplete,
        nodesRendered: document.querySelectorAll('[data-node-id]').length,
        edgesRendered: document.querySelectorAll('[data-edge-id]').length,
        errors: (window as any).__transitionErrors || []
      };
    });

    expect(transitionResult.currentStrategy).toBe('svg');
    expect(transitionResult.layoutComplete).toBe(true);
    expect(transitionResult.nodesRendered).toBeGreaterThan(250);
    expect(transitionResult.edgesRendered).toBeGreaterThan(0);
    expect(transitionResult.errors).toHaveLength(0);
  });

  test('should maintain data integrity across all strategy combinations', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Get initial graph structure
    const initialStructure = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-node-id]')).map(n => ({
        id: n.getAttribute('data-node-id'),
        x: parseFloat(n.getAttribute('data-x') || '0'),
        y: parseFloat(n.getAttribute('data-y') || '0')
      }));

      const edges = Array.from(document.querySelectorAll('[data-edge-id]')).map(e => ({
        id: e.getAttribute('data-edge-id'),
        source: e.getAttribute('data-source'),
        target: e.getAttribute('data-target')
      }));

      return { nodes, edges };
    });

    // Test all strategy combinations
    const strategyCombinations = [
      ['canvas', 'svg'],
      ['svg', 'webgl'], 
      ['webgl', 'canvas'],
      ['canvas', 'webgl'],
      ['webgl', 'svg'],
      ['svg', 'canvas']
    ];

    for (const [fromStrategy, toStrategy] of strategyCombinations) {
      // Switch to from strategy first
      const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
      await strategySelector.selectOption(fromStrategy);
      await waitForGraphLoad(page);

      // Switch to target strategy
      await strategySelector.selectOption(toStrategy);
      await waitForGraphLoad(page);

      // Verify data integrity
      const currentStructure = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('[data-node-id]')).map(n => ({
          id: n.getAttribute('data-node-id'),
          x: parseFloat(n.getAttribute('data-x') || '0'),
          y: parseFloat(n.getAttribute('data-y') || '0')
        }));

        const edges = Array.from(document.querySelectorAll('[data-edge-id]')).map(e => ({
          id: e.getAttribute('data-edge-id'),
          source: e.getAttribute('data-source'),
          target: e.getAttribute('data-target')
        }));

        return { 
          nodes, 
          edges,
          strategy: (window as any).__currentRenderingStrategy
        };
      });

      // Verify structure consistency
      expect(currentStructure.strategy).toBe(toStrategy);
      expect(currentStructure.nodes).toHaveLength(initialStructure.nodes.length);
      expect(currentStructure.edges).toHaveLength(initialStructure.edges.length);

      // Verify node position stability (FR-007)
      for (let i = 0; i < initialStructure.nodes.length; i++) {
        const initial = initialStructure.nodes[i];
        const current = currentStructure.nodes.find(n => n.id === initial.id);
        
        expect(current).toBeDefined();
        expect(Math.abs(current!.x - initial.x)).toBeLessThan(2.0); // Allow minimal floating-point drift
        expect(Math.abs(current!.y - initial.y)).toBeLessThan(2.0);
      }
    }
  });

  test('should handle strategy switching with edge bundling enabled', async ({ page }) => {
    // Start with SVG + edge bundling
    await page.goto('/?strategy=svg&bundling=true');
    await waitForGraphLoad(page);

    // Verify bundling is active
    const bundlingBefore = await page.evaluate(() => {
      return {
        hasCurvedEdges: !!document.querySelector('path[data-edge-id]'),
        bundlingEnabled: (window as any).__edgeBundlingEnabled
      };
    });

    expect(bundlingBefore.bundlingEnabled).toBe(true);

    // Switch to Canvas strategy
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
    await strategySelector.selectOption('canvas');
    await waitForGraphLoad(page);

    // Verify bundling state is preserved in new strategy
    const bundlingAfter = await page.evaluate(() => {
      return {
        currentStrategy: (window as any).__currentRenderingStrategy,
        bundlingEnabled: (window as any).__edgeBundlingEnabled,
        edgeLayout: (window as any).__edgeLayout,
        bundlingData: (window as any).__bundlingData
      };
    });

    expect(bundlingAfter.currentStrategy).toBe('canvas');
    expect(bundlingAfter.bundlingEnabled).toBe(true);
    expect(bundlingAfter.edgeLayout || bundlingAfter.bundlingData).toBeDefined();
  });

  test('should handle strategy switching failures gracefully', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Simulate strategy initialization failure
    await page.evaluate(() => {
      // Override strategy initialization to simulate failure
      (window as any).__simulateStrategyFailure = 'webgl';
    });

    // Attempt to switch to failing strategy
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
    await strategySelector.selectOption('webgl');

    // Wait for failure handling
    await page.waitForTimeout(3000);

    // Verify graceful fallback
    const failureHandling = await page.evaluate(() => {
      return {
        currentStrategy: (window as any).__currentRenderingStrategy,
        fallbackActivated: (window as any).__fallbackActivated,
        errorRecovery: (window as any).__errorRecovery,
        systemStable: (window as any).__systemStable !== false,
        hasVisualOutput: !!document.querySelector('canvas, svg')
      };
    });

    // Should either stay on current strategy or fall back to working strategy
    expect(['canvas', 'svg']).toContain(failureHandling.currentStrategy);
    expect(failureHandling.systemStable).toBe(true);
    expect(failureHandling.hasVisualOutput).toBe(true);
    expect(failureHandling.fallbackActivated || failureHandling.errorRecovery).toBeTruthy();
  });

  test('should provide visual feedback during strategy switching', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Monitor for visual feedback during switching
    const feedbackTest = page.evaluate(() => {
      const feedbackEvents = [];
      
      // Monitor for loading indicators or progress feedback
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            const target = mutation.target as Element;
            if (target.classList?.contains('loading') || 
                target.hasAttribute('data-loading') ||
                target.textContent?.includes('Switching')) {
              feedbackEvents.push({
                type: 'feedback',
                timestamp: performance.now(),
                element: target.tagName
              });
            }
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        attributes: true,
        subtree: true
      });

      (window as any).__feedbackObserver = observer;
      (window as any).__feedbackEvents = feedbackEvents;
      
      return 'feedback-monitoring-started';
    });

    expect(await feedbackTest).toBe('feedback-monitoring-started');

    // Switch strategy
    const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
    await strategySelector.selectOption('svg');
    await waitForGraphLoad(page);

    // Check for feedback events
    const feedbackResult = await page.evaluate(() => {
      const observer = (window as any).__feedbackObserver;
      if (observer) observer.disconnect();
      
      return {
        feedbackEvents: (window as any).__feedbackEvents || [],
        progressIndicator: !!document.querySelector('[data-testid="progress-indicator"]'),
        loadingStates: (window as any).__loadingStates || []
      };
    });

    // Should provide some form of user feedback during switching
    expect(
      feedbackResult.feedbackEvents.length > 0 ||
      feedbackResult.progressIndicator ||
      feedbackResult.loadingStates.length > 0
    ).toBeTruthy();
  });

  test('should support programmatic strategy switching API', async ({ page }) => {
    await page.goto('/?strategy=canvas');
    await waitForGraphLoad(page);

    // Test programmatic API for strategy switching
    const apiResults = await page.evaluate(async () => {
      const graph = (window as any).__knowledgeGraph;
      if (!graph || !graph.switchRenderingStrategyAsync) {
        return { apiAvailable: false };
      }

      const results = [];
      
      // Test programmatic switching
      try {
        const result1 = await graph.switchRenderingStrategyAsync('svg');
        results.push({ strategy: 'svg', success: result1, error: null });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result2 = await graph.switchRenderingStrategyAsync('webgl');
        results.push({ strategy: 'webgl', success: result2, error: null });
        
        return { apiAvailable: true, results };
      } catch (error) {
        return { 
          apiAvailable: true, 
          results,
          error: error.message 
        };
      }
    });

    if (apiResults.apiAvailable) {
      // Verify API calls succeeded
      apiResults.results.forEach((result: any) => {
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();
      });
    }
  });
});