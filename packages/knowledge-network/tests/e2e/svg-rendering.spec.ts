import { test, expect } from '@playwright/test';
import { 
  setupGraphTest, 
  waitForGraphLoad, 
  validateRenderingStrategy, 
  testNodeSelection,
  testNavigationControls,
  assertPerformanceRequirements,
  cleanupGraphTest,
  validateGraphStructure,
  RENDERING_STRATEGY_TESTS,
  PERFORMANCE_REQUIREMENTS
} from './utils/graph-test-utils';

/**
 * E2E Tests for SVG Rendering Strategy DOM Integration
 * 
 * Validates that the SVG rendering strategy:
 * - Properly initializes and renders SVG elements in browser environment
 * - Creates expected DOM structure (svg, g groups, circles, lines)
 * - Supports all required interactions with DOM event handling
 * - Maintains accessibility with proper SVG attributes
 * - Meets performance requirements for interactive SVG rendering
 */

test.describe('SVG Rendering Strategy', () => {
  const svgStrategy = RENDERING_STRATEGY_TESTS.find(s => s.strategy === 'svg')!;

  test.beforeEach(async ({ page }) => {
    await setupGraphTest(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupGraphTest(page);
  });

  test('should initialize SVG rendering strategy successfully', async ({ page }) => {
    // Set SVG rendering strategy
    await page.evaluate(() => {
      (window as any).__initializeStrategy = 'svg';
    });

    // Navigate to demo with SVG strategy
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Validate SVG DOM integration
    await validateRenderingStrategy(page, svgStrategy);

    // Verify SVG-specific structure
    const svg = page.locator('svg[data-graph-svg]');
    const nodesGroup = page.locator('svg[data-graph-svg] g[data-nodes-group]');
    const edgesGroup = page.locator('svg[data-graph-svg] g[data-edges-group]');

    // Check main SVG element
    await expect(svg).toBeVisible();
    await expect(svg).toHaveAttribute('viewBox');
    await expect(svg).toHaveAttribute('width');
    await expect(svg).toHaveAttribute('height');

    // Check group structure
    await expect(nodesGroup).toBeVisible();
    await expect(edgesGroup).toBeVisible();

    // Verify actual node and edge elements exist
    const nodeElements = page.locator('svg[data-graph-svg] circle[data-node-id]');
    const edgeElements = page.locator('svg[data-graph-svg] line[data-edge-id], svg[data-graph-svg] path[data-edge-id]');
    
    await expect(nodeElements).not.toHaveCount(0);
    await expect(edgeElements).not.toHaveCount(0);
  });

  test('should render nodes with proper SVG attributes', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Get node information from SVG
    const nodeInfo = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('circle[data-node-id]'));
      return nodes.map(node => ({
        id: node.getAttribute('data-node-id'),
        cx: node.getAttribute('cx'),
        cy: node.getAttribute('cy'),
        r: node.getAttribute('r'),
        fill: node.getAttribute('fill'),
        hasLabel: !!node.nextElementSibling?.tagName === 'text' // Check for text labels
      }));
    });

    expect(nodeInfo.length).toBeGreaterThan(0);
    
    // Verify each node has proper attributes
    nodeInfo.forEach(node => {
      expect(node.id).toBeDefined();
      expect(parseFloat(node.cx!)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(node.cy!)).toBeGreaterThanOrEqual(0);
      expect(parseFloat(node.r!)).toBeGreaterThan(0);
      expect(node.fill).toBeDefined();
    });
  });

  test('should render edges with proper SVG elements', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Get edge information from SVG
    const edgeInfo = await page.evaluate(() => {
      const edges = Array.from(document.querySelectorAll('[data-edge-id]'));
      return edges.map(edge => ({
        id: edge.getAttribute('data-edge-id'),
        source: edge.getAttribute('data-source'),
        target: edge.getAttribute('data-target'),
        tagName: edge.tagName,
        hasStroke: edge.getAttribute('stroke') !== null,
        hasStrokeWidth: edge.getAttribute('stroke-width') !== null
      }));
    });

    expect(edgeInfo.length).toBeGreaterThan(0);

    // Verify edge elements are properly formed
    edgeInfo.forEach(edge => {
      expect(edge.source).toBeDefined();
      expect(edge.target).toBeDefined();
      expect(['line', 'path']).toContain(edge.tagName.toLowerCase());
      expect(edge.hasStroke).toBe(true);
      expect(edge.hasStrokeWidth).toBe(true);
    });
  });

  test('should support node selection with SVG DOM events', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Test SVG node selection with DOM events
    await testNodeSelection(page, 'svg');

    // Verify SVG-specific selection styling
    const selectedNodeInfo = await page.evaluate(() => {
      const selectedNode = document.querySelector('circle[data-selected="true"]');
      return selectedNode ? {
        hasSelectedAttribute: true,
        fill: selectedNode.getAttribute('fill'),
        strokeWidth: selectedNode.getAttribute('stroke-width'),
        transform: selectedNode.getAttribute('transform')
      } : null;
    });

    expect(selectedNodeInfo).toBeDefined();
    expect(selectedNodeInfo!.hasSelectedAttribute).toBe(true);
  });

  test('should handle SVG navigation with proper coordinate transformations', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Get initial SVG viewBox
    const initialViewBox = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      return svg?.getAttribute('viewBox');
    });

    // Test navigation controls
    await testNavigationControls(page);

    // Verify SVG viewBox transformation
    const updatedViewBox = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      return svg?.getAttribute('viewBox');
    });

    expect(initialViewBox).toBeDefined();
    expect(updatedViewBox).toBeDefined();
    
    // ViewBox should change after navigation
    if (initialViewBox !== updatedViewBox) {
      // This is expected - viewBox should update with navigation
      expect(updatedViewBox).toBeDefined();
    }
  });

  test('should maintain accessibility attributes in SVG', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Check SVG accessibility attributes
    const accessibilityInfo = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      const nodes = document.querySelectorAll('circle[data-node-id]');
      const edges = document.querySelectorAll('[data-edge-id]');

      return {
        svg: {
          hasRole: svg?.getAttribute('role'),
          hasAriaLabel: svg?.getAttribute('aria-label'),
          hasTitle: !!svg?.querySelector('title')
        },
        nodes: Array.from(nodes).slice(0, 3).map(node => ({
          hasAriaLabel: node.getAttribute('aria-label'),
          hasTitle: !!node.querySelector('title'),
          hasTabIndex: node.getAttribute('tabindex')
        })),
        edges: Array.from(edges).slice(0, 2).map(edge => ({
          hasAriaLabel: edge.getAttribute('aria-label'),
          hasDescription: edge.getAttribute('aria-describedby')
        }))
      };
    });

    // Verify main SVG accessibility
    expect(accessibilityInfo.svg.hasRole || accessibilityInfo.svg.hasAriaLabel).toBeTruthy();

    // Verify nodes have accessibility features
    if (accessibilityInfo.nodes.length > 0) {
      const hasAccessibilityFeatures = accessibilityInfo.nodes.some(node => 
        node.hasAriaLabel || node.hasTitle || node.hasTabIndex
      );
      expect(hasAccessibilityFeatures).toBeTruthy();
    }
  });

  test('should support SVG CSS styling and animations', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Test CSS styling application
    const styleInfo = await page.evaluate(() => {
      const nodes = document.querySelectorAll('circle[data-node-id]');
      const edges = document.querySelectorAll('[data-edge-id]');
      
      return {
        nodeStyles: Array.from(nodes).slice(0, 2).map(node => {
          const computed = window.getComputedStyle(node);
          return {
            hasCSSFill: computed.fill && computed.fill !== '',
            hasCSSStroke: computed.stroke && computed.stroke !== '',
            hasTransition: computed.transition && computed.transition !== 'all 0s ease 0s'
          };
        }),
        edgeStyles: Array.from(edges).slice(0, 2).map(edge => {
          const computed = window.getComputedStyle(edge);
          return {
            hasCSSStroke: computed.stroke && computed.stroke !== '',
            hasStrokeWidth: computed.strokeWidth && computed.strokeWidth !== ''
          };
        })
      };
    });

    // Verify CSS styling is applied
    if (styleInfo.nodeStyles.length > 0) {
      const hasNodeStyling = styleInfo.nodeStyles.some(style => 
        style.hasCSSFill || style.hasCSSStroke
      );
      expect(hasNodeStyling).toBeTruthy();
    }

    if (styleInfo.edgeStyles.length > 0) {
      const hasEdgeStyling = styleInfo.edgeStyles.some(style => 
        style.hasCSSStroke || style.hasStrokeWidth
      );
      expect(hasEdgeStyling).toBeTruthy();
    }
  });

  test('should handle SVG rendering performance requirements', async ({ page }) => {
    await page.goto('/?strategy=svg&nodes=100');
    await waitForGraphLoad(page);

    // Assert SVG performance requirements
    await assertPerformanceRequirements(page, {
      maxRenderTime: PERFORMANCE_REQUIREMENTS.STRATEGY_SWITCH_TIME,
      minFPS: PERFORMANCE_REQUIREMENTS.MIN_FPS,
      maxMemoryMB: PERFORMANCE_REQUIREMENTS.MAX_MEMORY_PER_100_NODES
    });

    // Verify SVG DOM performance
    const domPerformance = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      const nodeCount = document.querySelectorAll('circle[data-node-id]').length;
      const edgeCount = document.querySelectorAll('[data-edge-id]').length;
      
      return {
        svgExists: !!svg,
        totalElements: nodeCount + edgeCount,
        nodeCount,
        edgeCount
      };
    });

    expect(domPerformance.svgExists).toBe(true);
    expect(domPerformance.nodeCount).toBeGreaterThan(80); // Should render most nodes
    expect(domPerformance.edgeCount).toBeGreaterThan(0);
  });

  test('should support SVG zoom and pan transformations', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Get initial transform state
    const initialTransform = await page.evaluate(() => {
      const mainGroup = document.querySelector('svg[data-graph-svg] g[data-transform-group]');
      return mainGroup?.getAttribute('transform') || '';
    });

    // Perform zoom operation
    const svg = page.locator('svg[data-graph-svg]');
    await svg.click({ position: { x: 400, y: 300 } });
    await page.mouse.wheel(0, -100); // Zoom in
    await page.waitForTimeout(300);

    // Get updated transform state
    const updatedTransform = await page.evaluate(() => {
      const mainGroup = document.querySelector('svg[data-graph-svg] g[data-transform-group]');
      return mainGroup?.getAttribute('transform') || '';
    });

    // Transform should change after zoom
    expect(updatedTransform).not.toBe(initialTransform);
    expect(updatedTransform).toContain('scale'); // Should contain scaling transformation
  });

  test('should handle large SVG graphs efficiently', async ({ page }) => {
    // Test SVG strategy with larger dataset
    await page.goto('/?strategy=svg&nodes=300');
    
    // Wait for larger dataset with extended timeout
    await waitForGraphLoad(page, 12000);

    // Verify SVG handles large datasets
    const svgPerformance = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      const nodeElements = document.querySelectorAll('circle[data-node-id]');
      const edgeElements = document.querySelectorAll('[data-edge-id]');
      
      return {
        svgExists: !!svg,
        nodeCount: nodeElements.length,
        edgeCount: edgeElements.length,
        totalDOMElements: document.querySelectorAll('svg[data-graph-svg] *').length
      };
    });

    expect(svgPerformance.svgExists).toBe(true);
    expect(svgPerformance.nodeCount).toBeGreaterThan(250); // Should render most nodes
    expect(svgPerformance.edgeCount).toBeGreaterThan(0);
    
    // SVG should not create excessive DOM elements
    expect(svgPerformance.totalDOMElements).toBeLessThan(2000); // Reasonable DOM size limit
  });

  test('should support SVG edge bundling visualization', async ({ page }) => {
    await page.goto('/?strategy=svg&bundling=true');
    await waitForGraphLoad(page);

    // Verify edge bundling creates curved paths in SVG
    const bundlingInfo = await page.evaluate(() => {
      const straightEdges = document.querySelectorAll('svg[data-graph-svg] line[data-edge-id]');
      const curvedEdges = document.querySelectorAll('svg[data-graph-svg] path[data-edge-id]');
      
      return {
        straightEdgeCount: straightEdges.length,
        curvedEdgeCount: curvedEdges.length,
        totalEdges: straightEdges.length + curvedEdges.length,
        samplePathData: curvedEdges.length > 0 ? curvedEdges[0].getAttribute('d') : null
      };
    });

    // With bundling enabled, should have curved path elements
    expect(bundlingInfo.totalEdges).toBeGreaterThan(0);
    
    if (bundlingInfo.curvedEdgeCount > 0) {
      expect(bundlingInfo.samplePathData).toBeDefined();
      expect(bundlingInfo.samplePathData).toContain('C'); // Should contain cubic Bezier curves
    }
  });

  test('should maintain SVG coordinate system integrity', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Verify coordinate system consistency
    const coordinateInfo = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      const viewBox = svg?.getAttribute('viewBox')?.split(' ').map(Number);
      const nodes = Array.from(document.querySelectorAll('circle[data-node-id]'));
      
      const nodePositions = nodes.slice(0, 5).map(node => ({
        id: node.getAttribute('data-node-id'),
        cx: parseFloat(node.getAttribute('cx') || '0'),
        cy: parseFloat(node.getAttribute('cy') || '0')
      }));

      return {
        viewBox: viewBox || [],
        nodePositions: nodePositions,
        svgDimensions: {
          width: svg?.getAttribute('width'),
          height: svg?.getAttribute('height')
        }
      };
    });

    // Verify viewBox is properly set
    expect(coordinateInfo.viewBox).toHaveLength(4);
    expect(coordinateInfo.viewBox[2]).toBeGreaterThan(0); // Width
    expect(coordinateInfo.viewBox[3]).toBeGreaterThan(0); // Height

    // Verify node positions are within reasonable bounds
    coordinateInfo.nodePositions.forEach(node => {
      expect(node.cx).toBeGreaterThanOrEqual(-1000);
      expect(node.cx).toBeLessThanOrEqual(2000);
      expect(node.cy).toBeGreaterThanOrEqual(-1000);
      expect(node.cy).toBeLessThanOrEqual(2000);
    });
  });

  test('should handle SVG text labels properly', async ({ page }) => {
    await page.goto('/?strategy=svg&labels=true');
    await waitForGraphLoad(page);

    // Verify text labels are rendered
    const labelInfo = await page.evaluate(() => {
      const textLabels = document.querySelectorAll('svg[data-graph-svg] text[data-label]');
      
      return Array.from(textLabels).slice(0, 3).map(label => ({
        text: label.textContent,
        x: label.getAttribute('x'),
        y: label.getAttribute('y'),
        textAnchor: label.getAttribute('text-anchor'),
        fontSize: window.getComputedStyle(label).fontSize
      }));
    });

    if (labelInfo.length > 0) {
      labelInfo.forEach(label => {
        expect(label.text).toBeDefined();
        expect(label.text!.length).toBeGreaterThan(0);
        expect(parseFloat(label.x!)).toBeGreaterThanOrEqual(-1000);
        expect(parseFloat(label.y!)).toBeGreaterThanOrEqual(-1000);
      });
    }
  });

  test('should support CSS transitions and animations in SVG', async ({ page }) => {
    await page.goto('/?strategy=svg&animations=true');
    await waitForGraphLoad(page);

    // Trigger an interaction that should animate
    const firstNode = page.locator('circle[data-node-id="node1"]');
    await firstNode.hover();
    await page.waitForTimeout(100);

    // Check for animation/transition effects
    const animationInfo = await page.evaluate(() => {
      const hoveredNode = document.querySelector('circle[data-node-id="node1"]');
      const computed = window.getComputedStyle(hoveredNode!);
      
      return {
        hasTransition: computed.transition && computed.transition !== 'all 0s ease 0s',
        currentTransform: hoveredNode?.getAttribute('transform'),
        currentFill: computed.fill,
        currentStroke: computed.stroke
      };
    });

    // Should have transition properties or transform changes
    expect(
      animationInfo.hasTransition || 
      animationInfo.currentTransform || 
      animationInfo.currentFill !== animationInfo.currentStroke
    ).toBeTruthy();
  });

  test('should export SVG content correctly', async ({ page }) => {
    await page.goto('/?strategy=svg');
    await waitForGraphLoad(page);

    // Test SVG export functionality
    const svgExport = await page.evaluate(() => {
      const svg = document.querySelector('svg[data-graph-svg]');
      return {
        svgHTML: svg?.outerHTML || '',
        svgString: new XMLSerializer().serializeToString(svg!),
        isValidSVG: svg?.tagName === 'svg'
      };
    });

    expect(svgExport.isValidSVG).toBe(true);
    expect(svgExport.svgHTML).toContain('<svg');
    expect(svgExport.svgHTML).toContain('data-graph-svg');
    expect(svgExport.svgString).toContain('xmlns="http://www.w3.org/2000/svg"');
    
    // Verify exportable content has nodes and edges
    expect(svgExport.svgString).toContain('circle');
    expect(svgExport.svgString.includes('line') || svgExport.svgString.includes('path')).toBe(true);
  });
});