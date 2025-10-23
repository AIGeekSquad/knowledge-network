import { EventEmitter } from 'events';
import * as d3 from 'd3';
import type { RenderingSystem, Transform } from '../rendering/RenderingSystem';
import type { Point, BoundingBox, NodePosition } from '../layout/LayoutEngine';

export type EasingFunction =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic';

/**
 * Manages viewport transformations including zoom, pan, and fit operations.
 *
 * @remarks
 * The ViewportManager handles all viewport-related transformations for the graph.
 * It integrates with D3's zoom behavior and provides methods for programmatic
 * control of the viewport including zooming, panning, and fitting content.
 *
 * @example
 * ```typescript
 * const viewportManager = new ViewportManager();
 * viewportManager.setup(container, renderingSystem);
 *
 * // Enable zoom with constraints
 * viewportManager.setZoomEnabled(true);
 * viewportManager.setZoomExtent(0.1, 10);
 *
 * // Fit content to viewport
 * viewportManager.fitToViewport(50, true);
 * ```
 */
export class ViewportManager extends EventEmitter {
  private container: HTMLElement | null = null;
  private renderingSystem: RenderingSystem | null = null;
  private zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;
  private transform: Transform = { x: 0, y: 0, scale: 1 };
  private zoomEnabled: boolean = false;
  private panEnabled: boolean = false;
  private zoomExtent: [number, number] = [0.1, 10];
  private animationDuration: number = 750;
  private easingFunction: EasingFunction = 'easeInOutCubic';
  private viewportBounds: BoundingBox | null = null;
  private nodePositions: Map<string, Point> = new Map();

  /**
   * Setup the viewport manager
   */
  setup(container: HTMLElement, renderingSystem: RenderingSystem): void {
    this.container = container;
    this.renderingSystem = renderingSystem;

    // Get SVG element
    const svg = container.tagName === 'svg' ? container : container.querySelector('svg');
    if (!svg) {
      throw new Error('No SVG element found in container');
    }

    // Calculate viewport bounds
    const rect = svg.getBoundingClientRect();
    this.viewportBounds = {
      minX: 0,
      minY: 0,
      maxX: rect.width,
      maxY: rect.height,
      width: rect.width,
      height: rect.height
    };

    // Setup D3 zoom behavior
    this.setupZoomBehavior(svg as SVGSVGElement);
  }

  /**
   * Destroy the viewport manager
   */
  destroy(): void {
    if (this.container) {
      const svg = this.container.tagName === 'svg' ? this.container : this.container.querySelector('svg');
      if (svg) {
        d3.select(svg).on('.zoom', null);
      }
    }

    this.container = null;
    this.renderingSystem = null;
    this.zoomBehavior = null;
    this.nodePositions.clear();
    this.removeAllListeners();
  }

  /**
   * Setup D3 zoom behavior
   */
  private setupZoomBehavior(svg: SVGSVGElement): void {
    const d3Svg = d3.select(svg);

    // Create zoom behavior
    this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(this.zoomExtent)
      .on('start', () => {
        this.emit('transformStart');
      })
      .on('zoom', (event) => {
        if (!this.zoomEnabled && event.transform.k !== this.transform.scale) {
          // Prevent zoom but allow pan
          event.transform.k = this.transform.scale;
        }
        if (!this.panEnabled && (event.transform.x !== this.transform.x || event.transform.y !== this.transform.y)) {
          // Prevent pan but allow zoom
          event.transform.x = this.transform.x;
          event.transform.y = this.transform.y;
        }

        this.updateTransform({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k
        });
      })
      .on('end', () => {
        this.emit('transformEnd');
      });

    // Only apply zoom behavior if zoom is enabled
    if (this.zoomEnabled) {
      d3Svg.call(this.zoomBehavior);

      // Set initial transform
      d3Svg.call(
        this.zoomBehavior.transform,
        d3.zoomIdentity.translate(this.transform.x, this.transform.y).scale(this.transform.scale)
      );
    }
  }

  /**
   * Update transform and notify rendering system
   */
  private updateTransform(transform: Transform): void {
    this.transform = transform;
    this.renderingSystem?.setTransform(transform);
    this.emit('transform', transform);

    if (transform.scale !== this.transform.scale) {
      this.emit('zoom', transform);
    }
    if (transform.x !== this.transform.x || transform.y !== this.transform.y) {
      this.emit('pan', transform);
    }
  }

  /**
   * Zoom controls
   */
  setZoomEnabled(enabled: boolean): void {
    this.zoomEnabled = enabled;

    if (this.zoomBehavior && this.container) {
      const svg = this.container.tagName === 'svg' ? this.container : this.container.querySelector('svg');
      if (svg) {
        const d3Svg = d3.select(svg);
        if (enabled) {
          d3Svg.call(this.zoomBehavior);
        } else {
          d3Svg.on('.zoom', null);
          // Re-enable only pan if pan is enabled
          if (this.panEnabled) {
            this.setupZoomBehavior(svg as SVGSVGElement);
          }
        }
      }
    }
  }

  setZoomExtent(min: number, max: number): void {
    this.zoomExtent = [min, max];
    if (this.zoomBehavior) {
      this.zoomBehavior.scaleExtent(this.zoomExtent);
    }
  }

  getZoomExtent(): [number, number] {
    return [...this.zoomExtent];
  }

  zoomIn(factor: number = 1.2): void {
    const newScale = Math.min(this.transform.scale * factor, this.zoomExtent[1]);
    this.zoomTo(newScale);
  }

  zoomOut(factor: number = 1.2): void {
    const newScale = Math.max(this.transform.scale / factor, this.zoomExtent[0]);
    this.zoomTo(newScale);
  }

  zoomTo(scale: number, center?: Point): void {
    // Fallback for test environment or when zoom behavior is not available
    const clampedScale = Math.max(this.zoomExtent[0], Math.min(this.zoomExtent[1], scale));

    if (!this.container || !this.zoomBehavior) {
      const newTransform = {
        x: this.transform.x,
        y: this.transform.y,
        scale: clampedScale
      };
      this.transform = newTransform;
      this.updateTransform(newTransform);
      return;
    }

    const svg = this.container.tagName === 'svg' ? this.container : this.container.querySelector('svg');
    if (!svg) return;

    // Check if SVG element has proper properties for d3-zoom (test environment detection)
    const svgElement = svg as SVGSVGElement;
    if (!svgElement.width || !svgElement.width.baseVal) {
      const newTransform = {
        x: this.transform.x,
        y: this.transform.y,
        scale: clampedScale
      };
      this.transform = newTransform;
      this.updateTransform(newTransform);
      return;
    }

    try {
      const d3Svg = d3.select(svg);

      if (center) {
        // Zoom to specific center point
        const dx = center.x - this.transform.x;
        const dy = center.y - this.transform.y;
        const newX = center.x - dx * (clampedScale / this.transform.scale);
        const newY = center.y - dy * (clampedScale / this.transform.scale);

        d3Svg.transition()
          .duration(this.animationDuration)
          .ease(this.getD3Easing())
          .call(
            this.zoomBehavior.transform,
            d3.zoomIdentity.translate(newX, newY).scale(clampedScale)
          );
      } else {
        // Zoom to current center
        const centerX = (this.viewportBounds?.width || 800) / 2;
        const centerY = (this.viewportBounds?.height || 600) / 2;
        const dx = centerX - this.transform.x;
        const dy = centerY - this.transform.y;
        const newX = centerX - dx * (clampedScale / this.transform.scale);
        const newY = centerY - dy * (clampedScale / this.transform.scale);

        d3Svg.transition()
          .duration(this.animationDuration)
          .ease(this.getD3Easing())
          .call(
            this.zoomBehavior.transform,
            d3.zoomIdentity.translate(newX, newY).scale(clampedScale)
          );
      }
    } catch (error) {
      // Fallback to direct transform update if d3 operations fail (e.g., in test environment)
      const newTransform = {
        x: this.transform.x,
        y: this.transform.y,
        scale: clampedScale
      };
      this.transform = newTransform;
      this.updateTransform(newTransform);
    }
  }

  resetZoom(): void {
    this.setTransform({ x: 0, y: 0, scale: 1 }, true);
  }

  getZoomLevel(): number {
    return this.transform.scale;
  }

  /**
   * Pan controls
   */
  setPanEnabled(enabled: boolean): void {
    this.panEnabled = enabled;

    if (this.zoomBehavior && this.container) {
      const svg = this.container.tagName === 'svg' ? this.container : this.container.querySelector('svg');
      if (svg) {
        const d3Svg = d3.select(svg);
        if (!enabled && !this.zoomEnabled) {
          // Disable all interactions
          d3Svg.on('.zoom', null);
        } else {
          // Re-setup zoom behavior
          this.setupZoomBehavior(svg as SVGSVGElement);
        }
      }
    }
  }

  panBy(dx: number, dy: number): void {
    const newTransform: Transform = {
      x: this.transform.x + dx,
      y: this.transform.y + dy,
      scale: this.transform.scale
    };
    this.setTransform(newTransform, true);
  }

  panTo(x: number, y: number): void {
    const newTransform: Transform = {
      x,
      y,
      scale: this.transform.scale
    };
    this.setTransform(newTransform, true);
  }

  centerOn(point: Point): void {
    const centerX = (this.viewportBounds?.width || 800) / 2;
    const centerY = (this.viewportBounds?.height || 600) / 2;

    const newTransform: Transform = {
      x: centerX - point.x * this.transform.scale,
      y: centerY - point.y * this.transform.scale,
      scale: this.transform.scale
    };

    this.setTransform(newTransform, true);
  }

  centerNode(nodeId: string, animated: boolean = true): void {
    const position = this.nodePositions.get(nodeId);
    if (position) {
      if (animated) {
        this.centerOn(position);
      } else {
        const centerX = (this.viewportBounds?.width || 800) / 2;
        const centerY = (this.viewportBounds?.height || 600) / 2;

        this.setTransform({
          x: centerX - position.x * this.transform.scale,
          y: centerY - position.y * this.transform.scale,
          scale: this.transform.scale
        }, false);
      }
    }
  }

  /**
   * Set node positions for viewport calculations
   */
  setNodePositions(positions: NodePosition[]): void {
    this.nodePositions.clear();
    positions.forEach(pos => {
      this.nodePositions.set(pos.id, { x: pos.x, y: pos.y, z: pos.z });
    });
  }

  /**
   * Fit operations
   */
  fitToViewport(padding: number = 50, animated: boolean = true): void {
    // Get all node positions to calculate bounds
    if (this.nodePositions.size === 0) return;

    const positions = Array.from(this.nodePositions.values());
    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);

    const bounds: BoundingBox = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      width: 0,
      height: 0
    };
    bounds.width = bounds.maxX - bounds.minX;
    bounds.height = bounds.maxY - bounds.minY;

    this.fitToBounds(bounds, padding, animated);
  }

  fitToNodes(nodeIds: string[], padding: number = 50, animated: boolean = true): void {
    const positions = nodeIds
      .map(id => this.nodePositions.get(id))
      .filter((p): p is Point => p !== undefined);

    if (positions.length === 0) return;

    const xs = positions.map(p => p.x);
    const ys = positions.map(p => p.y);

    const bounds: BoundingBox = {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
      width: 0,
      height: 0
    };
    bounds.width = bounds.maxX - bounds.minX;
    bounds.height = bounds.maxY - bounds.minY;

    this.fitToBounds(bounds, padding, animated);
  }

  fitToBounds(bounds: BoundingBox, padding: number = 50, animated: boolean = true): void {
    if (!this.viewportBounds) return;

    const viewWidth = this.viewportBounds.width - 2 * padding;
    const viewHeight = this.viewportBounds.height - 2 * padding;

    // Calculate scale to fit bounds
    const scaleX = viewWidth / bounds.width;
    const scaleY = viewHeight / bounds.height;
    let scale = Math.min(scaleX, scaleY);

    // Clamp to zoom extent
    scale = Math.max(this.zoomExtent[0], Math.min(this.zoomExtent[1], scale));

    // Calculate translation to center
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;

    const transform: Transform = {
      x: this.viewportBounds.width / 2 - centerX * scale,
      y: this.viewportBounds.height / 2 - centerY * scale,
      scale
    };

    this.setTransform(transform, animated);
  }

  /**
   * Transform management
   */
  getTransform(): Transform {
    return { ...this.transform };
  }

  setTransform(transform: Transform, animated: boolean = false): void {
    if (!this.container || !this.zoomBehavior) {
      this.transform = transform;
      this.updateTransform(transform);
      return;
    }

    const svg = this.container.tagName === 'svg' ? this.container : this.container.querySelector('svg');
    if (!svg) return;

    // Check if SVG element has proper properties for d3-zoom (test environment detection)
    const svgElement = svg as SVGSVGElement;
    if (!svgElement.width || !svgElement.width.baseVal) {
      this.transform = transform;
      this.updateTransform(transform);
      return;
    }

    try {
      const d3Svg = d3.select(svg);
      const d3Transform = d3.zoomIdentity
        .translate(transform.x, transform.y)
        .scale(transform.scale);

      if (animated) {
        d3Svg.transition()
          .duration(this.animationDuration)
          .ease(this.getD3Easing())
          .call(this.zoomBehavior.transform, d3Transform);
      } else {
        d3Svg.call(this.zoomBehavior.transform, d3Transform);
      }
    } catch (error) {
      this.transform = transform;
      this.updateTransform(transform);
    }
  }

  resetTransform(animated: boolean = true): void {
    this.setTransform({ x: 0, y: 0, scale: 1 }, animated);
  }

  /**
   * Viewport information
   */
  getViewportBounds(): BoundingBox {
    return this.viewportBounds ? { ...this.viewportBounds } : {
      minX: 0,
      minY: 0,
      maxX: 800,
      maxY: 600,
      width: 800,
      height: 600
    };
  }

  getVisibleBounds(): BoundingBox {
    const viewport = this.getViewportBounds();
    const transform = this.transform;

    // Calculate visible bounds in graph coordinates
    const minX = -transform.x / transform.scale;
    const minY = -transform.y / transform.scale;
    const maxX = (viewport.width - transform.x) / transform.scale;
    const maxY = (viewport.height - transform.y) / transform.scale;

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  isInViewport(point: Point): boolean {
    const bounds = this.getVisibleBounds();
    return point.x >= bounds.minX &&
           point.x <= bounds.maxX &&
           point.y >= bounds.minY &&
           point.y <= bounds.maxY;
  }

  isNodeInViewport(nodeId: string): boolean {
    const position = this.nodePositions.get(nodeId);
    return position ? this.isInViewport(position) : false;
  }

  /**
   * Coordinate conversion
   */
  screenToGraph(point: Point): Point {
    const transform = this.transform;
    return {
      x: (point.x - transform.x) / transform.scale,
      y: (point.y - transform.y) / transform.scale
    };
  }

  graphToScreen(point: Point): Point {
    const transform = this.transform;
    return {
      x: point.x * transform.scale + transform.x,
      y: point.y * transform.scale + transform.y
    };
  }

  /**
   * Animation settings
   */
  setAnimationDuration(duration: number): void {
    this.animationDuration = Math.max(0, duration);
  }

  setEasing(easing: EasingFunction): void {
    this.easingFunction = easing;
  }

  /**
   * Get D3 easing function
   */
  private getD3Easing(): (t: number) => number {
    switch (this.easingFunction) {
      case 'linear':
        return d3.easeLinear;
      case 'easeInQuad':
        return d3.easeQuadIn;
      case 'easeOutQuad':
        return d3.easeQuadOut;
      case 'easeInOutQuad':
        return d3.easeQuadInOut;
      case 'easeInCubic':
        return d3.easeCubicIn;
      case 'easeOutCubic':
        return d3.easeCubicOut;
      case 'easeInOutCubic':
        return d3.easeCubicInOut;
      default:
        return d3.easeCubicInOut;
    }
  }

  /**
   * Update node positions for viewport calculations
   */
  updateNodePositions(positions: Map<string, Point>): void {
    this.nodePositions = new Map(positions);
  }

  /**
   * Set node position
   */
  setNodePosition(nodeId: string, position: Point): void {
    this.nodePositions.set(nodeId, position);
  }

  /**
   * Remove node position
   */
  removeNodePosition(nodeId: string): void {
    this.nodePositions.delete(nodeId);
  }

  /**
   * Clear all node positions
   */
  clearNodePositions(): void {
    this.nodePositions.clear();
  }
}