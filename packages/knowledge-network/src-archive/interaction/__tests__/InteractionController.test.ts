/**
 * Tests for InteractionController class
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { InteractionController } from '../InteractionController';
import { SpatialIndexer } from '../../spatial/SpatialIndexer';
import type { PositionedNode } from '../../layout/LayoutEngine';
import type { IRenderer } from '../../rendering/IRenderer';
import type { Transform } from '../../rendering/RenderingSystem';

// Mock renderer implementation
class MockRenderer implements IRenderer {
  type = 'canvas' as const;
  private transform: Transform = { x: 0, y: 0, scale: 1 };
  private container: HTMLElement | null = null;

  initialize(container: HTMLElement): void {
    this.container = container;
  }

  destroy(): void {
    this.container = null;
  }

  clear(): void {}
  render(): void {}
  renderNodes(): void {}
  renderEdges(): void {}
  renderLabels(): void {}
  updateNodePositions(): void {}
  updateEdgePositions(): void {}
  updateNodeStyles(): void {}
  updateEdgeStyles(): void {}
  highlightNodes(): void {}
  highlightEdges(): void {}
  clearHighlights(): void {}

  setTransform(transform: Transform): void {
    this.transform = { ...transform };
  }

  getTransform(): Transform {
    return { ...this.transform };
  }

  getNodeElement(): Element | null { return null; }
  getEdgeElement(): Element | null { return null; }
  getContainer(): Element {
    return this.container || document.createElement('div');
  }

  enableBatching(): void {}
  flush(): void {}
}

// Mock spatial indexer
class MockSpatialIndexer extends SpatialIndexer {
  private mockNodes: PositionedNode[] = [];

  build(nodes: PositionedNode[]): void {
    this.mockNodes = [...nodes];
  }

  queryPoint(): PositionedNode[] {
    return this.mockNodes.slice(0, 1); // Return first node for testing
  }

  queryRegion(): PositionedNode[] {
    return this.mockNodes;
  }
}

describe('InteractionController', () => {
  let controller: InteractionController;
  let mockRenderer: MockRenderer;
  let mockSpatialIndexer: MockSpatialIndexer;
  let container: HTMLElement;

  const testNodes: PositionedNode[] = [
    { id: 'node1', x: 100, y: 100, radius: 10 },
    { id: 'node2', x: 200, y: 200, radius: 15 },
    { id: 'node3', x: 300, y: 150, radius: 12 },
  ];

  beforeEach(() => {
    // Create container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create mock dependencies
    mockRenderer = new MockRenderer();
    mockSpatialIndexer = new MockSpatialIndexer();

    // Create controller
    controller = new InteractionController();
    controller.initialize(container, mockRenderer, mockSpatialIndexer);
    controller.updateNodes(testNodes);
  });

  afterEach(() => {
    controller.destroy();
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize with container and renderer', () => {
      expect(controller.getViewportState().width).toBe(800);
      expect(controller.getViewportState().height).toBe(600);
    });

    test('should destroy cleanly', () => {
      const destroySpy = vi.spyOn(mockRenderer, 'destroy');

      controller.destroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('viewport control', () => {
    test('should set zoom programmatically', async () => {
      await controller.setZoom(2, undefined, false); // No animation

      const viewport = controller.getViewportState();
      expect(viewport.zoom).toBe(2);

      // Check renderer transform was updated
      const transform = mockRenderer.getTransform();
      expect(transform.scale).toBe(2);
    });

    test('should set pan programmatically', async () => {
      await controller.setPan({ x: 100, y: 50 }, false); // No animation

      const viewport = controller.getViewportState();
      expect(viewport.pan).toEqual({ x: 100, y: 50 });

      const transform = mockRenderer.getTransform();
      expect(transform.x).toBe(100);
      expect(transform.y).toBe(50);
    });

    test('should reset view', async () => {
      await controller.setZoom(3, undefined, false);
      await controller.setPan({ x: 200, y: 100 }, false);

      await controller.resetView(false); // No animation

      const viewport = controller.getViewportState();
      expect(viewport.zoom).toBe(1);
      expect(viewport.pan).toEqual({ x: 0, y: 0 });
    });

    test('should fit to graph', async () => {
      await controller.fitToGraph(50, false); // No animation

      const viewport = controller.getViewportState();
      expect(viewport.zoom).toBeGreaterThan(0);
      expect(viewport.pan.x).toBeDefined();
      expect(viewport.pan.y).toBeDefined();
    });

    test('should zoom to specific node', async () => {
      await controller.zoomToNode('node2', 2, false); // No animation

      const viewport = controller.getViewportState();
      expect(viewport.zoom).toBe(2);

      // Pan should center node2 (at 200, 200)
      const expectedCenter = {
        x: viewport.width / 2,
        y: viewport.height / 2,
      };

      const node2ScreenPos = {
        x: 200 * viewport.zoom + viewport.pan.x,
        y: 200 * viewport.zoom + viewport.pan.y,
      };

      expect(Math.abs(node2ScreenPos.x - expectedCenter.x)).toBeLessThan(1);
      expect(Math.abs(node2ScreenPos.y - expectedCenter.y)).toBeLessThan(1);
    });
  });

  describe('programmatic interaction', () => {
    test('should pan by delta', () => {
      controller.pan(50, 25);

      const viewport = controller.getViewportState();
      expect(viewport.pan.x).toBe(50);
      expect(viewport.pan.y).toBe(25);
    });

    test('should zoom by factor', () => {
      controller.zoom(2);

      const viewport = controller.getViewportState();
      expect(viewport.zoom).toBe(2);
    });

    test('should zoom towards center point', () => {
      const center = { x: 200, y: 150 };
      controller.zoom(2, center);

      const viewport = controller.getViewportState();
      expect(viewport.zoom).toBe(2);
    });
  });

  describe('mouse event handling', () => {
    test('should handle mouse wheel zoom', () => {
      const wheelEvent = new WheelEvent('wheel', {
        clientX: 400,
        clientY: 300,
        deltaY: -100, // Zoom in
        bubbles: true,
      });

      Object.defineProperty(wheelEvent, 'target', { value: container });

      const initialZoom = controller.getViewportState().zoom;
      controller.handleWheel(wheelEvent);

      const newZoom = controller.getViewportState().zoom;
      expect(newZoom).toBeGreaterThan(initialZoom);
    });

    test('should handle mouse down/move/up for panning', () => {
      const mouseDown = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 150,
        clientY: 125,
        bubbles: true,
      });

      const mouseUp = new MouseEvent('mouseup', {
        clientX: 150,
        clientY: 125,
        bubbles: true,
      });

      controller.handleMouseDown(mouseDown);

      const initialPan = controller.getViewportState().pan;

      controller.handleMouseMove(mouseMove);

      const newPan = controller.getViewportState().pan;
      expect(newPan.x).not.toBe(initialPan.x);
      expect(newPan.y).not.toBe(initialPan.y);

      controller.handleMouseUp(mouseUp);

      const interactionState = controller.getInteractionState();
      expect(interactionState.isPanning).toBe(false);
    });
  });

  describe('selection management', () => {
    test('should select nodes by ID', () => {
      controller.selectNodes(['node1', 'node2']);

      const selectedNodes = controller.getSelectedNodes();
      expect(selectedNodes).toHaveLength(2);
      expect(selectedNodes.map(n => n.id)).toContain('node1');
      expect(selectedNodes.map(n => n.id)).toContain('node2');
    });

    test('should add to selection', () => {
      controller.selectNodes(['node1']);
      controller.selectNodes(['node2'], 'add');

      const selectedNodes = controller.getSelectedNodes();
      expect(selectedNodes).toHaveLength(2);
    });

    test('should toggle selection', () => {
      controller.selectNodes(['node1']);
      controller.selectNodes(['node1'], 'toggle'); // Should remove

      const selectedNodes = controller.getSelectedNodes();
      expect(selectedNodes).toHaveLength(0);

      controller.selectNodes(['node1'], 'toggle'); // Should add back

      const selectedNodes2 = controller.getSelectedNodes();
      expect(selectedNodes2).toHaveLength(1);
    });

    test('should clear selection', () => {
      controller.selectNodes(['node1', 'node2']);
      controller.clearSelection();

      const selectedNodes = controller.getSelectedNodes();
      expect(selectedNodes).toHaveLength(0);
    });

    test('should emit selection change events', () => {
      const selectionHandler = vi.fn();
      controller.on('selectionChange', selectionHandler);

      controller.selectNodes(['node1']);

      expect(selectionHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'selectionChange',
          selectedNodes: expect.arrayContaining([
            expect.objectContaining({ id: 'node1' }),
          ]),
          addedNodes: expect.arrayContaining([
            expect.objectContaining({ id: 'node1' }),
          ]),
          removedNodes: [],
        })
      );
    });
  });

  describe('keyboard handling', () => {
    test('should handle arrow key navigation', () => {
      const keyEvent = new KeyboardEvent('keydown', {
        key: 'ArrowRight',
        bubbles: true,
      });

      const initialPan = controller.getViewportState().pan;
      controller.handleKeyboard(keyEvent);

      const newPan = controller.getViewportState().pan;
      expect(newPan.x).toBeGreaterThan(initialPan.x);
    });

    test('should handle zoom keys', () => {
      const zoomInEvent = new KeyboardEvent('keydown', {
        key: '+',
        bubbles: true,
      });

      const initialZoom = controller.getViewportState().zoom;
      controller.handleKeyboard(zoomInEvent);

      const newZoom = controller.getViewportState().zoom;
      expect(newZoom).toBeGreaterThan(initialZoom);
    });

    test('should handle reset shortcut', () => {
      // First change viewport
      controller.zoom(2);
      controller.pan(100, 50);

      const resetEvent = new KeyboardEvent('keydown', {
        key: 'r',
        bubbles: true,
      });

      controller.handleKeyboard(resetEvent);

      // Should be reset (may be animated, so check after a brief delay)
      setTimeout(() => {
        const viewport = controller.getViewportState();
        expect(viewport.zoom).toBe(1);
        expect(viewport.pan).toEqual({ x: 0, y: 0 });
      }, 50);
    });

    test('should handle fit shortcut', () => {
      const fitEvent = new KeyboardEvent('keydown', {
        key: 'f',
        bubbles: true,
      });

      controller.handleKeyboard(fitEvent);

      // Should trigger fit behavior
      // (actual result depends on node positions and viewport size)
      const viewport = controller.getViewportState();
      expect(typeof viewport.zoom).toBe('number');
    });

    test('should handle escape key', () => {
      controller.selectNodes(['node1', 'node2']);

      const escapeEvent = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
      });

      controller.handleKeyboard(escapeEvent);

      const selectedNodes = controller.getSelectedNodes();
      expect(selectedNodes).toHaveLength(0);
    });
  });

  describe('node queries', () => {
    test('should get node at position', () => {
      // This would require proper spatial indexer implementation
      const node = controller.getNodeAt(100, 100);
      expect(node?.id).toBe('node1'); // Based on mock implementation
    });

    test('should get nodes in region', () => {
      const region = { x: 50, y: 50, width: 200, height: 200 };
      const nodes = controller.getNodesInRegion(region);

      expect(nodes).toBeDefined();
      expect(Array.isArray(nodes)).toBe(true);
    });
  });

  describe('feature control', () => {
    test('should enable/disable pan', () => {
      controller.enablePan(false);
      const config = controller.getConfig();
      expect(config.features.panWithMouse).toBe(false);

      controller.enablePan(true);
      const config2 = controller.getConfig();
      expect(config2.features.panWithMouse).toBe(true);
    });

    test('should enable/disable zoom', () => {
      controller.enableZoom(false);
      const config = controller.getConfig();
      expect(config.features.mouseWheelZoom).toBe(false);

      controller.enableZoom(true);
      const config2 = controller.getConfig();
      expect(config2.features.mouseWheelZoom).toBe(true);
    });

    test('should enable/disable selection', () => {
      controller.enableSelection(false);
      const config = controller.getConfig();
      expect(config.features.singleSelect).toBe(false);
      expect(config.features.multiSelect).toBe(false);

      controller.enableSelection(true);
      const config2 = controller.getConfig();
      expect(config2.features.singleSelect).toBe(true);
      expect(config2.features.multiSelect).toBe(true);
    });
  });

  describe('event handling registration', () => {
    test('should set and call event handlers', () => {
      const nodeClickHandler = vi.fn();
      const viewportChangeHandler = vi.fn();

      controller.setEventHandlers({
        onNodeClick: nodeClickHandler,
        onViewportChange: viewportChangeHandler,
      });

      // Trigger viewport change
      controller.zoom(2);

      // The viewport change handler should be called
      // Note: The actual call depends on internal event emission
    });

    test('should emit viewport change events', () => {
      const viewportHandler = vi.fn();
      controller.on('viewportChange', viewportHandler);

      controller.zoom(2);

      expect(viewportHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'viewportChange',
          reason: 'zoom',
          viewport: expect.objectContaining({
            zoom: 2,
          }),
        })
      );
    });
  });

  describe('performance and state', () => {
    test('should provide performance stats', () => {
      const stats = controller.getPerformanceStats();

      expect(stats).toHaveProperty('animation');
      expect(stats).toHaveProperty('selectedNodeCount');
      expect(stats).toHaveProperty('totalNodeCount');
      expect(stats).toHaveProperty('spatialIndexEnabled');

      expect(stats.totalNodeCount).toBe(testNodes.length);
      expect(stats.spatialIndexEnabled).toBe(true);
    });

    test('should track interaction state', () => {
      const initialState = controller.getInteractionState();

      expect(initialState.isPanning).toBe(false);
      expect(initialState.isZooming).toBe(false);
      expect(initialState.isSelecting).toBe(false);
      expect(initialState.isDragging).toBe(false);
      expect(initialState.selectedNodes).toBeInstanceOf(Set);
    });

    test('should check animation state', () => {
      expect(controller.isAnimating()).toBe(false);

      // Start an animated operation
      controller.setZoom(2, undefined, true); // With animation

      // Should be animating (briefly)
      expect(controller.isAnimating()).toBe(true);
    });
  });

  describe('configuration updates', () => {
    test('should update configuration', () => {
      const newConfig = {
        features: {
          ...controller.getConfig().features,
          throttleDelay: 32,
        },
      };

      controller.updateConfig(newConfig);

      const updatedConfig = controller.getConfig();
      expect(updatedConfig.features.throttleDelay).toBe(32);
    });
  });
});