import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SVGRenderingStrategy } from '../src/rendering/SVGRenderingStrategy';
import type { 
  RenderingContext, 
  RenderingConfig,
  InteractionEvent,
  VisualUpdates,
  RenderingProgressCallback
} from '../src/rendering/rendering-strategy';
import type { LayoutNode } from '../src/layout/layout-engine';

describe('SVGRenderingStrategy', () => {
  let strategy: SVGRenderingStrategy;
  let container: HTMLElement;
  let svgElement: SVGElement;
  let mockContext: RenderingContext;
  let mockNodes: Map<string, LayoutNode>;

  beforeEach(() => {
    // Create strategy instance
    strategy = new SVGRenderingStrategy();
    
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    container.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 0,
      top: 0,
      width: 800,
      height: 600
    });
    container.appendChild = vi.fn();
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
          svg: {
            useCSSTransforms: true,
            enableTextSelection: false
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
    vi.restoreAllMocks();
    
    if (svgElement && svgElement.parentNode) {
      svgElement.parentNode.removeChild(svgElement);
    }
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('SVG Strategy Capabilities', () => {
    it('should return SVG-specific capabilities', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.maxNodes).toBe(800);
      expect(capabilities.maxEdges).toBe(1500);
      expect(capabilities.supportedInteractions).toContain('zoom');
      expect(capabilities.supportedInteractions).toContain('pan');
      expect(capabilities.supportedInteractions).toContain('select');
      expect(capabilities.supportedInteractions).toContain('hover');
      expect(capabilities.supportedInteractions).toContain('click');
      expect(capabilities.features.hardwareAcceleration).toBe(false);
      expect(capabilities.features.animations).toBe(true);
      expect(capabilities.features.realTimeUpdates).toBe(true);
      expect(capabilities.performanceProfile.renderingComplexity).toBe('O(n)');
    });

    it('should have reasonable memory profile for SVG', () => {
      const capabilities = strategy.getCapabilities();
      
      expect(capabilities.memoryProfile.baseUsage).toBe(8);
      expect(capabilities.memoryProfile.perNode).toBe(0.2);
      expect(capabilities.memoryProfile.perEdge).toBe(0.1);
      expect(capabilities.memoryProfile.peakMultiplier).toBe(1.5);
    });
  });

  describe('SVG Initialization and DOM Creation', () => {
    it('should create SVG element and container structure during rendering', async () => {
      await strategy.renderAsync(mockContext);
      
      svgElement = container.querySelector('svg') as SVGElement;
      expect(svgElement).toBeTruthy();
      expect(svgElement.getAttribute('width')).toBe('800');
      expect(svgElement.getAttribute('height')).toBe('600');
      expect(strategy.isInitialized).toBe(true);
    });

    it('should create proper SVG groups for nodes and edges', async () => {
      await strategy.renderAsync(mockContext);
      
      svgElement = container.querySelector('svg') as SVGElement;
      const edgeGroup = svgElement.querySelector('g.edges');
      const nodeGroup = svgElement.querySelector('g.nodes');
      
      expect(edgeGroup).toBeTruthy();
      expect(nodeGroup).toBeTruthy();
    });

    it('should apply SVG namespace and attributes correctly', async () => {
      await strategy.renderAsync(mockContext);
      
      svgElement = container.querySelector('svg') as SVGElement;
      expect(svgElement.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(svgElement.getAttribute('viewBox')).toBe('0 0 800 600');
    });

    it('should handle container resize and update SVG dimensions', async () => {
      // Mock container resize
      container.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 0, top: 0, width: 1000, height: 800
      });
      
      await strategy.renderAsync(mockContext);
      
      svgElement = container.querySelector('svg') as SVGElement;
      expect(svgElement.getAttribute('width')).toBe('1000');
      expect(svgElement.getAttribute('height')).toBe('800');
    });
  });

  describe('SVG Element Creation and Updates', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      svgElement = container.querySelector('svg') as SVGElement;
    });

    it('should create circle elements for nodes', async () => {
      const circles = svgElement.querySelectorAll('circle');
      
      expect(circles.length).toBe(mockNodes.size);
      
      // Check first node properties
      const firstCircle = circles[0];
      expect(firstCircle.getAttribute('r')).toBe('10');
      expect(firstCircle.getAttribute('cx')).toBeTruthy();
      expect(firstCircle.getAttribute('cy')).toBeTruthy();
    });

    it('should create line elements for edges', async () => {
      const lines = svgElement.querySelectorAll('line');
      
      expect(lines.length).toBe(mockContext.edges.length);
      
      // Check first edge properties
      const firstLine = lines[0];
      expect(firstLine.getAttribute('x1')).toBeTruthy();
      expect(firstLine.getAttribute('y1')).toBeTruthy();
      expect(firstLine.getAttribute('x2')).toBeTruthy();
      expect(firstLine.getAttribute('y2')).toBeTruthy();
    });

    it('should apply correct styling from configuration', async () => {
      const circles = svgElement.querySelectorAll('circle');
      const lines = svgElement.querySelectorAll('line');
      
      // Check node styling
      expect(circles[0].getAttribute('fill')).toBeTruthy();
      expect(circles[0].getAttribute('stroke')).toBeTruthy();
      expect(circles[0].getAttribute('stroke-width')).toBeTruthy();
      
      // Check edge styling
      expect(lines[0].getAttribute('stroke')).toBeTruthy();
      expect(lines[0].getAttribute('stroke-width')).toBeTruthy();
    });

    it('should handle progress updates during SVG creation', async () => {
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

  describe('SVG CSS Transforms and Viewport', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      svgElement = container.querySelector('svg') as SVGElement;
    });

    it('should apply CSS transforms for zoom and pan', async () => {
      const contextWithTransform = {
        ...mockContext,
        viewport: {
          ...mockContext.viewport,
          zoomLevel: 2,
          panOffset: { x: 50, y: 30 }
        }
      };
      
      await strategy.renderAsync(contextWithTransform);
      
      const rootGroup = svgElement.querySelector('g.viewport-transform');
      expect(rootGroup).toBeTruthy();
      
      const transform = rootGroup?.getAttribute('transform');
      expect(transform).toContain('scale(2)');
      expect(transform).toContain('translate(50,30)');
    });

    it('should update transforms without full re-render', async () => {
      const updates: VisualUpdates = {
        viewport: {
          zoomLevel: 1.5,
          panOffset: { x: 20, y: 10 }
        }
      };
      
      await strategy.updateVisualsAsync(updates);
      
      const rootGroup = svgElement.querySelector('g.viewport-transform');
      const transform = rootGroup?.getAttribute('transform');
      expect(transform).toContain('scale(1.5)');
      expect(transform).toContain('translate(20,10)');
    });
  });

  describe('SVG Accessibility and Semantic Structure', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      svgElement = container.querySelector('svg') as SVGElement;
    });

    it('should add accessibility attributes to SVG elements', async () => {
      expect(svgElement.getAttribute('role')).toBe('img');
      expect(svgElement.getAttribute('aria-label')).toBe('Knowledge graph visualization');
    });

    it('should create semantic grouping for screen readers', async () => {
      const nodeGroup = svgElement.querySelector('g.nodes');
      const edgeGroup = svgElement.querySelector('g.edges');
      
      expect(nodeGroup?.getAttribute('aria-label')).toBe('Graph nodes');
      expect(edgeGroup?.getAttribute('aria-label')).toBe('Graph edges');
    });

    it('should add node labels as title elements', async () => {
      const circles = svgElement.querySelectorAll('circle');
      
      circles.forEach((circle, index) => {
        const title = circle.querySelector('title');
        expect(title).toBeTruthy();
        expect(title?.textContent).toContain('Node');
      });
    });

    it('should support keyboard navigation when enabled', async () => {
      const circles = svgElement.querySelectorAll('circle');
      
      circles.forEach(circle => {
        expect(circle.getAttribute('tabindex')).toBe('0');
        expect(circle.getAttribute('role')).toBe('button');
      });
    });
  });

  describe('SVG Interaction and Event Handling', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      svgElement = container.querySelector('svg') as SVGElement;
    });

    it('should handle click interactions on nodes', () => {
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

    it('should handle hover interactions with tooltips', () => {
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

    it('should detect nodes through DOM-based hit testing', () => {
      // SVG uses DOM-based hit testing via elementFromPoint
      const mockElementFromPoint = vi.fn().mockReturnValue(
        svgElement.querySelector('circle')
      );
      
      Object.defineProperty(document, 'elementFromPoint', {
        value: mockElementFromPoint,
        writable: true
      });
      
      const clickEvent: InteractionEvent = {
        type: 'click',
        coordinates: { x: 100, y: 100 },
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      const handled = strategy.handleInteraction(clickEvent);
      expect(handled).toBe(true);
      expect(mockElementFromPoint).toHaveBeenCalled();
    });

    it('should emit DOM events for SVG elements', async () => {
      const eventSpy = vi.fn();
      strategy.events.on('nodeSelected', eventSpy);
      
      // Simulate node selection
      const selectEvent: InteractionEvent = {
        type: 'select',
        target: 'node1',
        coordinates: { x: 100, y: 100 },
        data: {},
        timestamp: Date.now(),
        propagate: true
      };
      
      strategy.handleInteraction(selectEvent);
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('SVG Visual Updates and DOM Manipulation', () => {
    beforeEach(async () => {
      await strategy.renderAsync(mockContext);
      svgElement = container.querySelector('svg') as SVGElement;
    });

    it('should update node positions via DOM attribute changes', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { 
            position: { x: 150, y: 120 },
            visual: { fillColor: '#ff0000' }
          }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      const circle = svgElement.querySelector('circle[data-node-id="node1"]');
      expect(circle?.getAttribute('cx')).toBe('150');
      expect(circle?.getAttribute('cy')).toBe('120');
      expect(circle?.getAttribute('fill')).toBe('#ff0000');
    });

    it('should update edge positions when nodes move', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { position: { x: 120, y: 110 } }],
          ['node2', { position: { x: 220, y: 160 } }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      const line = svgElement.querySelector('line[data-edge-id="node1-node2"]');
      expect(line?.getAttribute('x1')).toBe('120');
      expect(line?.getAttribute('y1')).toBe('110');
      expect(line?.getAttribute('x2')).toBe('220');
      expect(line?.getAttribute('y2')).toBe('160');
    });

    it('should handle selection state via CSS classes', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node2', { selected: true }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      const selectedCircle = svgElement.querySelector('circle[data-node-id="node2"]');
      expect(selectedCircle?.classList.contains('selected')).toBe(true);
    });

    it('should handle highlight state for neighbor highlighting', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { highlighted: true }],
          ['node3', { highlighted: false }]
        ])
      };
      
      await strategy.updateVisualsAsync(updates);
      
      const highlightedCircle = svgElement.querySelector('circle[data-node-id="node1"]');
      const normalCircle = svgElement.querySelector('circle[data-node-id="node3"]');
      
      expect(highlightedCircle?.classList.contains('highlighted')).toBe(true);
      expect(normalCircle?.classList.contains('highlighted')).toBe(false);
    });
  });

  describe('SVG Performance and DOM Efficiency', () => {
    it('should handle medium datasets efficiently with DOM reuse', async () => {
      // Create medium dataset (SVG is optimized for interactive features)
      const mediumNodes = new Map();
      for (let i = 0; i < 300; i++) {
        mediumNodes.set(`node-${i}`, {
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
      
      const mediumContext = {
        ...mockContext,
        nodes: mediumNodes
      };
      
      const startTime = performance.now();
      await strategy.renderAsync(mediumContext);
      const endTime = performance.now();
      
      // Should render in reasonable time
      expect(endTime - startTime).toBeLessThan(2000);
      expect(strategy.isInitialized).toBe(true);
      
      svgElement = container.querySelector('svg') as SVGElement;
      const circles = svgElement.querySelectorAll('circle');
      expect(circles.length).toBe(300);
    });

    it('should minimize DOM operations during updates', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { position: { x: 110, y: 105 } }]
        ])
      };
      
      // Count DOM operations (simplified - in real implementation would track setAttribute calls)
      const initialCircleCount = svgElement.querySelectorAll('circle').length;
      
      await strategy.updateVisualsAsync(updates);
      
      // Should not recreate elements, just update attributes
      const finalCircleCount = svgElement.querySelectorAll('circle').length;
      expect(finalCircleCount).toBe(initialCircleCount);
    });

    it('should use CSS transforms when enabled for better performance', async () => {
      const updates: VisualUpdates = {
        viewport: {
          zoomLevel: 2,
          panOffset: { x: 100, y: 50 }
        }
      };
      
      await strategy.updateVisualsAsync(updates);
      
      const transformGroup = svgElement.querySelector('g.viewport-transform');
      const style = transformGroup?.getAttribute('style') || transformGroup?.getAttribute('transform');
      
      // Should use either CSS transform or SVG transform
      expect(style).toBeTruthy();
    });
  });

  describe('SVG Cleanup and DOM Management', () => {
    it('should remove all SVG elements on cleanup', async () => {
      await strategy.renderAsync(mockContext);
      
      svgElement = container.querySelector('svg') as SVGElement;
      expect(svgElement).toBeTruthy();
      
      await strategy.cleanupAsync();
      
      const svgAfterCleanup = container.querySelector('svg');
      expect(svgAfterCleanup).toBeNull();
      expect(strategy.isInitialized).toBe(false);
    });

    it('should remove event listeners from DOM elements', async () => {
      await strategy.renderAsync(mockContext);
      
      // Mock event listener removal
      const removeEventListenerSpy = vi.spyOn(svgElement, 'removeEventListener');
      
      await strategy.cleanupAsync();
      
      // Should clean up properly
      expect(strategy.isInitialized).toBe(false);
    });

    it('should handle cleanup when no SVG exists', async () => {
      // Test cleanup without initialization
      await expect(strategy.cleanupAsync()).resolves.not.toThrow();
    });
  });

  describe('SVG Configuration Validation', () => {
    it('should validate SVG-specific configuration options', () => {
      const result = strategy.validateConfiguration(mockContext.config);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid SVG configuration', () => {
      const invalidConfig = {
        ...mockContext.config,
        strategyOptions: {
          svg: {
            useCSSTransforms: 'invalid' as any, // Should be boolean
            enableTextSelection: true
          }
        }
      };
      
      const result = strategy.validateConfiguration(invalidConfig);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toContain('useCSSTransforms');
    });

    it('should warn about performance with large datasets', () => {
      // SVG DOM elements become expensive with large node counts
      const capabilities = strategy.getCapabilities();
      expect(capabilities.maxNodes).toBeLessThan(1000); // More conservative than Canvas
    });
  });

  describe('SVG Error Handling', () => {
    it('should handle SVG creation failure gracefully', async () => {
      // Mock SVG creation failure
      const originalCreateElementNS = document.createElementNS;
      document.createElementNS = vi.fn().mockReturnValue(null);
      
      await expect(strategy.renderAsync(mockContext)).rejects.toThrow();
      
      document.createElementNS = originalCreateElementNS;
    });

    it('should handle DOM manipulation errors', async () => {
      await strategy.renderAsync(mockContext);
      
      // Mock DOM error
      const errorSpy = vi.fn();
      strategy.events.on('error', errorSpy);
      
      // Force an error by removing container
      container.remove();
      
      await expect(strategy.updateVisualsAsync({
        nodes: new Map([['node1', { position: { x: 200, y: 200 } }]])
      })).rejects.toThrow();
      
      expect(errorSpy).toHaveBeenCalled();
    });

    it('should recover from invalid attribute values', async () => {
      const updates: VisualUpdates = {
        nodes: new Map([
          ['node1', { 
            position: { x: NaN, y: Infinity }, // Invalid coordinates
            visual: { fillColor: 'invalid-color' }
          }]
        ])
      };
      
      // Should handle gracefully without breaking entire render
      await expect(strategy.updateVisualsAsync(updates)).resolves.not.toThrow();
    });
  });
});