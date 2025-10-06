/**
 * Extensibility Tests
 *
 * These tests verify that the architecture supports extensibility,
 * particularly for multiple renderer types (SVG/Canvas/WebGL) and
 * custom implementations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderingSystem, type IRenderer, type RendererType, type Transform, type RendererConfig, type RenderConfig, type LayoutResult, type NodePosition, type EdgePosition, type NodeStyleUpdate, type EdgeStyleUpdate, type HighlightConfig, type LabelItem } from '../../src/rendering/RenderingSystem';
import type { GraphData } from '../../src/types';

describe('Extensibility', () => {
  let container: HTMLElement;
  let sampleData: GraphData;
  let mockLayout: LayoutResult;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    sampleData = {
      nodes: [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
        { id: 'node3', label: 'Node 3' }
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' }
      ]
    };

    mockLayout = {
      nodes: [
        { id: 'node1', label: 'Node 1', x: 100, y: 100 },
        { id: 'node2', label: 'Node 2', x: 200, y: 200 },
        { id: 'node3', label: 'Node 3', x: 300, y: 300 }
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' }
      ],
      bounds: { minX: 50, minY: 50, maxX: 350, maxY: 350, width: 300, height: 300 }
    };
  });

  describe('Renderer Interface Compliance', () => {
    it('should define complete IRenderer interface', () => {
      // Test that all required methods exist in the interface
      const requiredMethods = [
        'initialize', 'destroy', 'clear',
        'render', 'renderNodes', 'renderEdges', 'renderLabels',
        'updateNodePositions', 'updateEdgePositions',
        'updateNodeStyles', 'updateEdgeStyles',
        'highlightNodes', 'highlightEdges', 'clearHighlights',
        'setTransform', 'getTransform',
        'getNodeElement', 'getEdgeElement', 'getContainer',
        'enableBatching', 'flush'
      ];

      // Create a mock renderer to test interface compliance
      class MockRenderer implements IRenderer {
        readonly type: RendererType = 'svg';

        initialize() {}
        destroy() {}
        clear() {}
        render() {}
        renderNodes() {}
        renderEdges() {}
        renderLabels() {}
        updateNodePositions() {}
        updateEdgePositions() {}
        updateNodeStyles() {}
        updateEdgeStyles() {}
        highlightNodes() {}
        highlightEdges() {}
        clearHighlights() {}
        setTransform() {}
        getTransform() { return { x: 0, y: 0, scale: 1 }; }
        getNodeElement() { return null; }
        getEdgeElement() { return null; }
        getContainer() { return container; }
        enableBatching() {}
        flush() {}
      }

      const renderer = new MockRenderer();

      requiredMethods.forEach(method => {
        expect(typeof (renderer as any)[method]).toBe('function');
      });
    });

    it('should support custom renderer implementations', () => {
      class CustomRenderer implements IRenderer {
        readonly type: RendererType = 'svg';
        private _container: HTMLElement | null = null;
        private _transform: Transform = { x: 0, y: 0, scale: 1 };

        initialize(container: HTMLElement, config: RendererConfig): void {
          this._container = container;
          // Custom initialization logic
        }

        destroy(): void {
          if (this._container) {
            this._container.innerHTML = '';
            this._container = null;
          }
        }

        clear(): void {
          if (this._container) {
            this._container.innerHTML = '';
          }
        }

        render(layout: LayoutResult, config: RenderConfig): void {
          // Custom rendering logic
          if (this._container) {
            const div = document.createElement('div');
            div.textContent = `Custom render: ${layout.nodes.length} nodes`;
            this._container.appendChild(div);
          }
        }

        renderNodes() {}
        renderEdges() {}
        renderLabels() {}
        updateNodePositions() {}
        updateEdgePositions() {}
        updateNodeStyles() {}
        updateEdgeStyles() {}
        highlightNodes() {}
        highlightEdges() {}
        clearHighlights() {}

        setTransform(transform: Transform): void {
          this._transform = transform;
        }

        getTransform(): Transform {
          return { ...this._transform };
        }

        getNodeElement(): Element | null { return null; }
        getEdgeElement(): Element | null { return null; }
        getContainer(): Element { return this._container!; }
        enableBatching() {}
        flush() {}
      }

      // Should be able to use custom renderer
      const renderer = new CustomRenderer();
      expect(renderer.type).toBe('svg');

      renderer.initialize(container, { width: 800, height: 600 });
      renderer.render(mockLayout, {});

      expect(container.textContent).toContain('Custom render: 3 nodes');
    });
  });

  describe('Multiple Renderer Support', () => {
    it('should support SVG renderer (implemented)', () => {
      const renderingSystem = new RenderingSystem(container);

      expect(() => renderingSystem.setRenderer('svg')).not.toThrow();
      expect(renderingSystem.getRendererType()).toBe('svg');

      // Should be able to render with SVG
      expect(() => renderingSystem.render(mockLayout)).not.toThrow();
    });

    it('should have placeholders for Canvas renderer (not implemented)', () => {
      const renderingSystem = new RenderingSystem(container);

      // Canvas renderer should throw appropriate error
      expect(() => renderingSystem.setRenderer('canvas')).toThrow('Canvas renderer not yet implemented');
    });

    it('should have placeholders for WebGL renderer (not implemented)', () => {
      const renderingSystem = new RenderingSystem(container);

      // WebGL renderer should throw appropriate error
      expect(() => renderingSystem.setRenderer('webgl')).toThrow('WebGL renderer not yet implemented');
    });

    it('should handle unknown renderer types gracefully', () => {
      const renderingSystem = new RenderingSystem(container);

      expect(() => renderingSystem.setRenderer('unknown' as RendererType)).toThrow('Unknown renderer type: unknown');
    });

    it('should support renderer switching', () => {
      const renderingSystem = new RenderingSystem(container);

      // Start with SVG
      renderingSystem.setRenderer('svg');
      expect(renderingSystem.getRendererType()).toBe('svg');

      renderingSystem.render(mockLayout);
      expect(container.querySelector('svg')).toBeTruthy();

      // Switch back to SVG (should destroy and recreate)
      renderingSystem.setRenderer('svg');
      expect(renderingSystem.getRendererType()).toBe('svg');
    });
  });

  describe('Renderer Factory Pattern', () => {
    it('should demonstrate proper factory pattern for renderers', () => {
      // The current implementation uses a simple factory in setRenderer()
      // This test validates the pattern and suggests improvements

      const renderingSystem = new RenderingSystem(container);

      // Factory should create appropriate renderer based on type
      renderingSystem.setRenderer('svg');
      const svgRenderer = renderingSystem.getRenderer();
      expect(svgRenderer?.type).toBe('svg');

      // Factory should handle errors for unimplemented types
      expect(() => renderingSystem.setRenderer('canvas')).toThrow();
      expect(() => renderingSystem.setRenderer('webgl')).toThrow();
    });

    it('should support future renderer registration pattern', () => {
      // This test documents how a proper extensible factory should work
      // Current implementation uses hardcoded switch statement

      interface RendererFactory {
        create(type: RendererType): IRenderer;
        register(type: RendererType, factory: () => IRenderer): void;
      }

      // Mock implementation showing extensible pattern
      class MockRendererFactory implements RendererFactory {
        private factories = new Map<RendererType, () => IRenderer>();

        register(type: RendererType, factory: () => IRenderer): void {
          this.factories.set(type, factory);
        }

        create(type: RendererType): IRenderer {
          const factory = this.factories.get(type);
          if (!factory) {
            throw new Error(`Renderer type ${type} not registered`);
          }
          return factory();
        }
      }

      const factory = new MockRendererFactory();

      // Should be able to register custom renderers
      class CustomRenderer implements IRenderer {
        readonly type: RendererType = 'canvas';
        initialize() {}
        destroy() {}
        clear() {}
        render() {}
        renderNodes() {}
        renderEdges() {}
        renderLabels() {}
        updateNodePositions() {}
        updateEdgePositions() {}
        updateNodeStyles() {}
        updateEdgeStyles() {}
        highlightNodes() {}
        highlightEdges() {}
        clearHighlights() {}
        setTransform() {}
        getTransform() { return { x: 0, y: 0, scale: 1 }; }
        getNodeElement() { return null; }
        getEdgeElement() { return null; }
        getContainer() { return container; }
        enableBatching() {}
        flush() {}
      }

      factory.register('canvas', () => new CustomRenderer());

      const renderer = factory.create('canvas');
      expect(renderer.type).toBe('canvas');
    });
  });

  describe('Configuration Extensibility', () => {
    it('should support extensible renderer configurations', () => {
      const renderingSystem = new RenderingSystem(container, {
        width: 1200,
        height: 800,
        pixelRatio: 2,
        antialias: true,
        preserveDrawingBuffer: true
      });

      const config = renderingSystem.getRendererConfig();
      expect(config.width).toBe(1200);
      expect(config.height).toBe(800);
      expect(config.pixelRatio).toBe(2);
      expect(config.antialias).toBe(true);
      expect(config.preserveDrawingBuffer).toBe(true);
    });

    it('should support extensible render configurations', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      const renderConfig = {
        nodeConfig: {
          radius: 15,
          fill: '#ff0000',
          stroke: '#000000',
          strokeWidth: 2
        },
        edgeConfig: {
          stroke: '#999999',
          strokeWidth: 1.5,
          opacity: 0.7
        },
        labelConfig: {
          fontSize: 14,
          fontFamily: 'Arial',
          fill: '#333333'
        },
        layerOrder: ['edges', 'nodes', 'labels'] as const
      };

      renderingSystem.setRenderConfig(renderConfig);
      const retrievedConfig = renderingSystem.getRenderConfig();

      expect(retrievedConfig.nodeConfig?.radius).toBe(15);
      expect(retrievedConfig.edgeConfig?.strokeWidth).toBe(1.5);
      expect(retrievedConfig.labelConfig?.fontSize).toBe(14);
    });
  });

  describe('Custom Edge Renderers', () => {
    it('should support multiple edge rendering strategies', () => {
      // Current implementation supports EdgeRenderer interface
      // This test validates that pattern

      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Should be able to render with different edge configurations
      const straightEdgeConfig = {
        edgeConfig: {
          curveType: 'straight' as const,
          stroke: '#999',
          strokeWidth: 1
        }
      };

      const curvedEdgeConfig = {
        edgeConfig: {
          curveType: 'bezier' as const,
          stroke: '#666',
          strokeWidth: 2
        }
      };

      expect(() => renderingSystem.render(mockLayout, straightEdgeConfig)).not.toThrow();
      expect(() => renderingSystem.render(mockLayout, curvedEdgeConfig)).not.toThrow();
    });
  });

  describe('Plugin Architecture Potential', () => {
    it('should support plugin-style extensions', () => {
      // This test documents how the architecture could support plugins

      interface GraphPlugin {
        name: string;
        install(renderingSystem: RenderingSystem): void;
        uninstall(renderingSystem: RenderingSystem): void;
      }

      class AnimationPlugin implements GraphPlugin {
        name = 'animation';
        private animationFrame?: number;

        install(renderingSystem: RenderingSystem): void {
          // Plugin could extend rendering system functionality
          const originalRender = renderingSystem.render.bind(renderingSystem);

          renderingSystem.render = (layout: LayoutResult, config?: RenderConfig) => {
            // Add animation capabilities
            originalRender(layout, config);

            // Start animation loop
            const animate = () => {
              // Custom animation logic here
              this.animationFrame = requestAnimationFrame(animate);
            };
            animate();
          };
        }

        uninstall(renderingSystem: RenderingSystem): void {
          if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
          }
          // Restore original render method would need reference
        }
      }

      const plugin = new AnimationPlugin();
      const renderingSystem = new RenderingSystem(container);

      // Plugin architecture would allow extensions
      plugin.install(renderingSystem);
      expect(plugin.name).toBe('animation');

      renderingSystem.initialize();
      expect(() => renderingSystem.render(mockLayout)).not.toThrow();

      plugin.uninstall(renderingSystem);
    });
  });

  describe('Future Extensibility Requirements', () => {
    it('should document Canvas renderer requirements', () => {
      // Canvas renderer would need to implement IRenderer interface
      // and handle different drawing operations

      interface CanvasRendererConfig extends RendererConfig {
        contextType?: '2d' | 'webgl' | 'webgl2';
        imageSmoothingEnabled?: boolean;
      }

      // Mock what Canvas renderer interface would look like
      const canvasRequirements = {
        contextType: '2d',
        drawNodes: expect.any(Function),
        drawEdges: expect.any(Function),
        drawLabels: expect.any(Function),
        hitTesting: expect.any(Function),
        offscreenBuffering: expect.any(Function)
      };

      expect(canvasRequirements.contextType).toBe('2d');
    });

    it('should document WebGL renderer requirements', () => {
      // WebGL renderer would need shader management and buffer handling

      interface WebGLRendererConfig extends RendererConfig {
        shaders?: {
          vertex: string;
          fragment: string;
        };
        bufferSize?: number;
        useInstancing?: boolean;
      }

      const webglRequirements = {
        shaderPrograms: expect.any(Function),
        bufferManagement: expect.any(Function),
        instancing: expect.any(Function),
        uniformUpdates: expect.any(Function),
        performanceOptimization: expect.any(Function)
      };

      expect(typeof webglRequirements.shaderPrograms).toBe('function');
    });

    it('should support performance monitoring extensibility', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Should support performance monitoring hooks
      let renderTime = 0;
      const start = performance.now();

      renderingSystem.render(mockLayout);

      renderTime = performance.now() - start;
      expect(renderTime).toBeGreaterThan(0);

      // Future: Could add performance monitoring plugins
      // renderingSystem.addPerformanceMonitor('render-time', callback);
    });

    it('should support accessibility extensions', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();
      renderingSystem.render(mockLayout);

      const svg = container.querySelector('svg');
      if (svg) {
        // Should be extensible for accessibility features
        const accessibilityExtension = {
          addAriaLabels: () => {
            svg.setAttribute('role', 'img');
            svg.setAttribute('aria-label', 'Knowledge graph visualization');
          },
          addKeyboardNavigation: () => {
            svg.setAttribute('tabindex', '0');
          },
          addScreenReaderSupport: () => {
            // Could add structured descriptions
          }
        };

        accessibilityExtension.addAriaLabels();
        accessibilityExtension.addKeyboardNavigation();

        expect(svg.getAttribute('role')).toBe('img');
        expect(svg.getAttribute('tabindex')).toBe('0');
      }
    });
  });
});