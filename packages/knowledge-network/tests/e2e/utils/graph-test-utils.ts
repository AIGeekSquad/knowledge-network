import { Page, Locator, expect } from '@playwright/test';

/**
 * Shared utilities for E2E testing of Knowledge Network graph functionality
 * Provides common test patterns for validating rendering strategies and interactions
 */

export interface TestGraphData {
  nodes: Array<{
    id: string;
    label: string;
    type?: string;
    x?: number;
    y?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    type?: string;
  }>;
}

export interface RenderingStrategyTest {
  strategy: 'canvas' | 'svg' | 'webgl';
  selector: string;
  expectedElements: string[];
}

/**
 * Create standardized test data for consistent E2E testing
 */
export function createTestGraphData(): TestGraphData {
  return {
    nodes: [
      { id: 'node1', label: 'Node 1', type: 'concept' },
      { id: 'node2', label: 'Node 2', type: 'entity' },
      { id: 'node3', label: 'Node 3', type: 'concept' },
      { id: 'node4', label: 'Node 4', type: 'entity' },
      { id: 'node5', label: 'Node 5', type: 'concept' }
    ],
    edges: [
      { source: 'node1', target: 'node2', type: 'connects' },
      { source: 'node2', target: 'node3', type: 'relates' },
      { source: 'node3', target: 'node4', type: 'connects' },
      { source: 'node4', target: 'node5', type: 'relates' },
      { source: 'node1', target: 'node5', type: 'connects' }
    ]
  };
}

/**
 * Create large test dataset for performance validation
 */
export function createLargeTestGraphData(nodeCount: number = 100): TestGraphData {
  const nodes = [];
  const edges = [];

  // Generate nodes
  for (let i = 1; i <= nodeCount; i++) {
    nodes.push({
      id: `node${i}`,
      label: `Node ${i}`,
      type: i % 3 === 0 ? 'concept' : 'entity'
    });
  }

  // Generate edges (create connected graph with some clustering)
  for (let i = 1; i <= nodeCount; i++) {
    // Connect to next node (linear backbone)
    if (i < nodeCount) {
      edges.push({
        source: `node${i}`,
        target: `node${i + 1}`,
        type: 'sequence'
      });
    }

    // Add cluster connections every 10 nodes
    if (i % 10 === 0 && i > 10) {
      edges.push({
        source: `node${i}`,
        target: `node${i - 10}`,
        type: 'cluster'
      });
    }

    // Add some random connections for complexity
    if (i % 7 === 0) {
      const targetId = Math.floor(Math.random() * nodeCount) + 1;
      if (targetId !== i) {
        edges.push({
          source: `node${i}`,
          target: `node${targetId}`,
          type: 'random'
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Wait for graph to be fully loaded and rendered
 */
export async function waitForGraphLoad(page: Page, timeout: number = 10000): Promise<void> {
  // Wait for the graph container to exist
  await page.waitForSelector('[data-testid="knowledge-graph"]', { timeout });
  
  // Wait for layout to complete (no animation ongoing)
  await page.waitForFunction(
    () => {
      const container = document.querySelector('[data-testid="knowledge-graph"]');
      if (!container) return false;
      
      // Check if graph instance indicates it's ready
      return (window as any).__knowledgeGraphReady === true;
    },
    { timeout }
  );

  // Give a short buffer for final rendering
  await page.waitForTimeout(500);
}

/**
 * Validate that rendering strategy DOM elements are present
 */
export async function validateRenderingStrategy(
  page: Page, 
  strategy: RenderingStrategyTest
): Promise<void> {
  // Check main container exists
  const container = page.locator(`[data-testid="knowledge-graph"] ${strategy.selector}`);
  await expect(container).toBeVisible();

  // Validate expected elements for this strategy
  for (const element of strategy.expectedElements) {
    const elementLocator = page.locator(`${strategy.selector} ${element}`);
    await expect(elementLocator).toBeVisible();
  }
}

/**
 * Test node selection functionality
 */
export async function testNodeSelection(page: Page, strategy: string): Promise<void> {
  // Click on first node
  const firstNode = page.locator('[data-testid="knowledge-graph"] [data-node-id="node1"]');
  await expect(firstNode).toBeVisible();
  await firstNode.click();

  // Validate selection state
  await expect(firstNode).toHaveAttribute('data-selected', 'true');
  
  // Validate neighbor highlighting
  const neighbors = page.locator('[data-testid="knowledge-graph"] [data-highlighted="true"]');
  await expect(neighbors).not.toHaveCount(0);

  // Test deselection
  const emptyArea = page.locator('[data-testid="knowledge-graph"]');
  await emptyArea.click({ position: { x: 50, y: 50 } });
  
  // Validate deselection
  await expect(firstNode).toHaveAttribute('data-selected', 'false');
}

/**
 * Test zoom and pan functionality
 */
export async function testNavigationControls(page: Page): Promise<void> {
  const container = page.locator('[data-testid="knowledge-graph"]');
  
  // Test zoom in
  await container.click({ position: { x: 400, y: 300 } });
  await page.mouse.wheel(0, -100); // Zoom in
  await page.waitForTimeout(200);
  
  // Test zoom out  
  await page.mouse.wheel(0, 100); // Zoom out
  await page.waitForTimeout(200);

  // Test pan
  await page.mouse.move(400, 300);
  await page.mouse.down();
  await page.mouse.move(450, 350);
  await page.mouse.up();
  await page.waitForTimeout(200);
}

/**
 * Measure rendering performance
 */
export async function measureRenderingPerformance(page: Page): Promise<{
  renderTime: number;
  fps: number;
  memoryUsage?: number;
}> {
  // Start performance measurement
  await page.evaluate(() => {
    (window as any).__performanceStart = performance.now();
    (window as any).__frameCount = 0;
    (window as any).__frameStart = performance.now();
  });

  // Trigger re-render by updating graph
  await page.evaluate(() => {
    const graph = (window as any).__knowledgeGraph;
    if (graph && graph.updateData) {
      // Force re-render with same data
      graph.updateData((window as any).__testGraphData);
    }
  });

  // Wait for render completion
  await waitForGraphLoad(page);

  // Measure performance
  const metrics = await page.evaluate(() => {
    const renderTime = performance.now() - (window as any).__performanceStart;
    const frameTime = performance.now() - (window as any).__frameStart;
    const frameCount = (window as any).__frameCount || 1;
    const fps = Math.round((frameCount / frameTime) * 1000);

    return {
      renderTime: Math.round(renderTime),
      fps: Math.max(fps, 1), // Avoid division by zero
      memoryUsage: (performance as any).memory?.usedJSHeapSize 
    };
  });

  return metrics;
}

/**
 * Test strategy switching functionality
 */
export async function testStrategySwitching(
  page: Page,
  fromStrategy: string,
  toStrategy: string
): Promise<void> {
  // Get initial node positions for consistency check
  const initialPositions = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-node-id]');
    return Array.from(nodes).map(node => ({
      id: node.getAttribute('data-node-id'),
      x: parseFloat(node.getAttribute('data-x') || '0'),
      y: parseFloat(node.getAttribute('data-y') || '0')
    }));
  });

  // Switch strategy
  const strategySelector = page.locator(`[data-testid="strategy-selector"]`);
  await strategySelector.selectOption(toStrategy);

  // Wait for strategy switch to complete
  await page.waitForFunction(
    (strategy) => {
      return (window as any).__currentRenderingStrategy === strategy;
    },
    toStrategy,
    { timeout: 5000 }
  );

  // Validate node positions remained consistent
  const newPositions = await page.evaluate(() => {
    const nodes = document.querySelectorAll('[data-node-id]');
    return Array.from(nodes).map(node => ({
      id: node.getAttribute('data-node-id'),
      x: parseFloat(node.getAttribute('data-x') || '0'),
      y: parseFloat(node.getAttribute('data-y') || '0')
    }));
  });

  // Check position consistency (allow small floating point differences)
  expect(newPositions).toHaveLength(initialPositions.length);
  for (let i = 0; i < initialPositions.length; i++) {
    expect(Math.abs(newPositions[i].x - initialPositions[i].x)).toBeLessThan(1.0);
    expect(Math.abs(newPositions[i].y - initialPositions[i].y)).toBeLessThan(1.0);
  }
}

/**
 * Validate graph structure integrity
 */
export async function validateGraphStructure(page: Page, expectedData: TestGraphData): Promise<void> {
  const actualStructure = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-node-id]')).map(node => ({
      id: node.getAttribute('data-node-id'),
      label: node.getAttribute('data-label')
    }));

    const edges = Array.from(document.querySelectorAll('[data-edge-id]')).map(edge => ({
      source: edge.getAttribute('data-source'),
      target: edge.getAttribute('data-target')
    }));

    return { nodes, edges };
  });

  // Validate node count and IDs
  expect(actualStructure.nodes).toHaveLength(expectedData.nodes.length);
  const actualNodeIds = actualStructure.nodes.map(n => n.id).sort();
  const expectedNodeIds = expectedData.nodes.map(n => n.id).sort();
  expect(actualNodeIds).toEqual(expectedNodeIds);

  // Validate edge count and connections
  expect(actualStructure.edges).toHaveLength(expectedData.edges.length);
  const actualEdgeKeys = actualStructure.edges.map(e => `${e.source}-${e.target}`).sort();
  const expectedEdgeKeys = expectedData.edges.map(e => `${e.source}-${e.target}`).sort();
  expect(actualEdgeKeys).toEqual(expectedEdgeKeys);
}

/**
 * Setup common test environment and data
 */
export async function setupGraphTest(page: Page, data?: TestGraphData): Promise<TestGraphData> {
  const testData = data || createTestGraphData();
  
  // Navigate to demo page
  await page.goto('/');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Inject test data into page
  await page.evaluate((data) => {
    (window as any).__testGraphData = data;
    (window as any).__knowledgeGraphReady = false;
  }, testData);

  return testData;
}

/**
 * Cleanup after test
 */
export async function cleanupGraphTest(page: Page): Promise<void> {
  await page.evaluate(() => {
    // Clean up global test variables
    delete (window as any).__testGraphData;
    delete (window as any).__knowledgeGraph;
    delete (window as any).__knowledgeGraphReady;
    delete (window as any).__currentRenderingStrategy;
    delete (window as any).__performanceStart;
    delete (window as any).__frameCount;
    delete (window as any).__frameStart;
  });
}

/**
 * Assert performance requirements are met
 */
export async function assertPerformanceRequirements(
  page: Page,
  requirements: {
    maxRenderTime?: number;
    minFPS?: number;
    maxMemoryMB?: number;
  }
): Promise<void> {
  const metrics = await measureRenderingPerformance(page);

  if (requirements.maxRenderTime) {
    expect(metrics.renderTime).toBeLessThanOrEqual(requirements.maxRenderTime);
  }

  if (requirements.minFPS) {
    expect(metrics.fps).toBeGreaterThanOrEqual(requirements.minFPS);
  }

  if (requirements.maxMemoryMB && metrics.memoryUsage) {
    const memoryMB = metrics.memoryUsage / (1024 * 1024);
    expect(memoryMB).toBeLessThanOrEqual(requirements.maxMemoryMB);
  }
}

/**
 * Common rendering strategy configurations for testing
 */
export const RENDERING_STRATEGY_TESTS: RenderingStrategyTest[] = [
  {
    strategy: 'canvas',
    selector: 'canvas[data-graph-canvas]',
    expectedElements: [] // Canvas element itself is the container, no nested elements needed
  },
  {
    strategy: 'svg',
    selector: 'svg[data-graph-svg]',
    expectedElements: [
      'svg[data-graph-svg]',
      'g[data-nodes-group]',
      'g[data-edges-group]'
    ]
  },
  {
    strategy: 'webgl',
    selector: 'canvas[data-graph-webgl]',
    expectedElements: ['canvas[data-graph-webgl]']
  }
];

/**
 * Performance requirement constants based on specification
 */
export const PERFORMANCE_REQUIREMENTS = {
  NAVIGATION_RESPONSE_TIME: 100, // 100ms requirement from spec
  MIN_FPS: 30, // Minimum acceptable FPS
  TARGET_FPS: 60, // Target FPS from spec
  MAX_RENDER_TIME_1000_NODES: 30000, // 30 seconds for 1000 nodes from spec
  STRATEGY_SWITCH_TIME: 2000, // 2 seconds for strategy switching from spec
  MAX_MEMORY_PER_100_NODES: 10 // ~10MB per 100 nodes from spec
};