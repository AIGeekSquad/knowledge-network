/**
 * ViewportState manages the current viewport transformation state
 * and coordinate transformations for all renderers.
 *
 * Provides consistent pan/zoom behavior across SVG, Canvas, and WebGL renderers.
 */

import type { Point2D } from '../spatial/types';
import type {
  ViewportState as IViewportState,
  CoordinateTransform,
  InteractionConfig,
} from './types';
import { clamp } from './types';

export class ViewportState implements CoordinateTransform {
  private state: IViewportState;
  private matrix: DOMMatrix;
  private inverseMatrix: DOMMatrix;

  constructor(
    width: number,
    height: number,
    config: Partial<InteractionConfig> = {}
  ) {
    this.state = {
      zoom: config.viewport?.initialZoom ?? 1,
      pan: config.viewport?.initialPan ?? { x: 0, y: 0 },
      minZoom: config.viewport?.minZoom ?? 0.1,
      maxZoom: config.viewport?.maxZoom ?? 10,
      panBounds: config.viewport?.panBounds,
      width,
      height,
      matrix: new DOMMatrix(),
    };

    this.matrix = new DOMMatrix();
    this.inverseMatrix = new DOMMatrix();
    this.updateMatrices();
  }

  // === State Access ===

  /**
   * Get current viewport state (read-only copy)
   */
  getState(): Readonly<IViewportState> {
    return {
      ...this.state,
      matrix: new DOMMatrix(this.matrix),
    };
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.state.zoom;
  }

  /**
   * Get current pan offset
   */
  getPan(): Point2D {
    return { ...this.state.pan };
  }

  /**
   * Get viewport dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.state.width,
      height: this.state.height,
    };
  }

  /**
   * Get viewport bounds in world coordinates
   */
  getWorldBounds(): { minX: number; minY: number; maxX: number; maxY: number } {
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this.state.width,
      y: this.state.height,
    });

    return {
      minX: topLeft.x,
      minY: topLeft.y,
      maxX: bottomRight.x,
      maxY: bottomRight.y,
    };
  }

  // === Transform Operations ===

  /**
   * Set zoom level with optional center point
   */
  setZoom(zoom: number, center?: Point2D): boolean {
    const clampedZoom = clamp(zoom, this.state.minZoom, this.state.maxZoom);

    if (clampedZoom === this.state.zoom) {
      return false; // No change
    }

    if (center) {
      // Zoom towards/away from a specific point
      const worldCenter = this.screenToWorld(center);

      // Update zoom
      this.state.zoom = clampedZoom;

      // Adjust pan to keep world center at screen center
      const newScreenCenter = this.worldToScreen(worldCenter);
      const panDelta = {
        x: center.x - newScreenCenter.x,
        y: center.y - newScreenCenter.y,
      };

      this.setPan({
        x: this.state.pan.x + panDelta.x / this.state.zoom,
        y: this.state.pan.y + panDelta.y / this.state.zoom,
      });
    } else {
      this.state.zoom = clampedZoom;
      this.updateMatrices();
    }

    return true;
  }

  /**
   * Set pan offset with bounds checking
   */
  setPan(pan: Point2D): boolean {
    let newPan = { ...pan };

    // Apply pan bounds if configured
    if (this.state.panBounds) {
      newPan.x = clamp(newPan.x, this.state.panBounds.minX, this.state.panBounds.maxX);
      newPan.y = clamp(newPan.y, this.state.panBounds.minY, this.state.panBounds.maxY);
    }

    if (newPan.x === this.state.pan.x && newPan.y === this.state.pan.y) {
      return false; // No change
    }

    this.state.pan = newPan;
    this.updateMatrices();
    return true;
  }

  /**
   * Adjust zoom by a factor (multiply current zoom)
   */
  adjustZoom(factor: number, center?: Point2D): boolean {
    return this.setZoom(this.state.zoom * factor, center);
  }

  /**
   * Adjust pan by a delta (add to current pan)
   */
  adjustPan(delta: Point2D): boolean {
    return this.setPan({
      x: this.state.pan.x + delta.x,
      y: this.state.pan.y + delta.y,
    });
  }

  /**
   * Reset viewport to initial state
   */
  reset(
    initialZoom = 1,
    initialPan: Point2D = { x: 0, y: 0 }
  ): void {
    this.state.zoom = clamp(initialZoom, this.state.minZoom, this.state.maxZoom);
    this.state.pan = { ...initialPan };
    this.updateMatrices();
  }

  /**
   * Fit content to viewport with padding
   */
  fitToBounds(
    contentBounds: { minX: number; minY: number; maxX: number; maxY: number },
    padding = 50
  ): void {
    const contentWidth = contentBounds.maxX - contentBounds.minX;
    const contentHeight = contentBounds.maxY - contentBounds.minY;

    if (contentWidth === 0 || contentHeight === 0) {
      this.reset();
      return;
    }

    // Calculate zoom to fit content with padding
    const availableWidth = this.state.width - 2 * padding;
    const availableHeight = this.state.height - 2 * padding;

    const zoomX = availableWidth / contentWidth;
    const zoomY = availableHeight / contentHeight;
    const newZoom = clamp(Math.min(zoomX, zoomY), this.state.minZoom, this.state.maxZoom);

    // Calculate pan to center content
    const contentCenterX = (contentBounds.minX + contentBounds.maxX) / 2;
    const contentCenterY = (contentBounds.minY + contentBounds.maxY) / 2;

    const viewportCenterX = this.state.width / 2;
    const viewportCenterY = this.state.height / 2;

    this.state.zoom = newZoom;
    this.state.pan = {
      x: viewportCenterX / newZoom - contentCenterX,
      y: viewportCenterY / newZoom - contentCenterY,
    };

    this.updateMatrices();
  }

  /**
   * Update viewport dimensions (e.g., on container resize)
   */
  updateDimensions(width: number, height: number): void {
    this.state.width = width;
    this.state.height = height;
    // Note: matrices don't need updating as they don't depend on viewport size
  }

  /**
   * Set pan bounds
   */
  setPanBounds(bounds: IViewportState['panBounds']): void {
    this.state.panBounds = bounds;

    // Re-apply current pan to respect new bounds
    if (bounds) {
      this.setPan(this.state.pan);
    }
  }

  /**
   * Set zoom limits
   */
  setZoomLimits(minZoom: number, maxZoom: number): void {
    this.state.minZoom = minZoom;
    this.state.maxZoom = maxZoom;

    // Re-apply current zoom to respect new limits
    this.setZoom(this.state.zoom);
  }

  // === Coordinate Transform Interface ===

  /**
   * Transform screen coordinates to world coordinates
   */
  screenToWorld(point: Point2D): Point2D {
    const transformedPoint = this.inverseMatrix.transformPoint(new DOMPoint(point.x, point.y));
    return {
      x: transformedPoint.x,
      y: transformedPoint.y,
    };
  }

  /**
   * Transform world coordinates to screen coordinates
   */
  worldToScreen(point: Point2D): Point2D {
    const transformedPoint = this.matrix.transformPoint(new DOMPoint(point.x, point.y));
    return {
      x: transformedPoint.x,
      y: transformedPoint.y,
    };
  }

  /**
   * Apply viewport transform to a point
   */
  applyTransform(point: Point2D): Point2D {
    return this.worldToScreen(point);
  }

  /**
   * Get the current transform matrix
   */
  getMatrix(): DOMMatrix {
    return new DOMMatrix(this.matrix);
  }

  /**
   * Update transform from viewport state
   */
  updateFromViewport(viewport: IViewportState): void {
    this.state = {
      ...this.state, // Preserve width, height, bounds
      zoom: viewport.zoom,
      pan: viewport.pan,
    };
    this.updateMatrices();
  }

  // === Advanced Transform Utilities ===

  /**
   * Get the inverse transform matrix
   */
  getInverseMatrix(): DOMMatrix {
    return new DOMMatrix(this.inverseMatrix);
  }

  /**
   * Transform a rectangle from screen to world coordinates
   */
  screenRectToWorld(rect: { x: number; y: number; width: number; height: number }) {
    const topLeft = this.screenToWorld({ x: rect.x, y: rect.y });
    const bottomRight = this.screenToWorld({
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  /**
   * Transform a rectangle from world to screen coordinates
   */
  worldRectToScreen(rect: { x: number; y: number; width: number; height: number }) {
    const topLeft = this.worldToScreen({ x: rect.x, y: rect.y });
    const bottomRight = this.worldToScreen({
      x: rect.x + rect.width,
      y: rect.y + rect.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  /**
   * Check if a point in world coordinates is visible in the current viewport
   */
  isPointVisible(worldPoint: Point2D, margin = 0): boolean {
    const screenPoint = this.worldToScreen(worldPoint);
    return (
      screenPoint.x >= -margin &&
      screenPoint.x <= this.state.width + margin &&
      screenPoint.y >= -margin &&
      screenPoint.y <= this.state.height + margin
    );
  }

  /**
   * Check if a rectangle in world coordinates intersects the current viewport
   */
  isRectVisible(
    worldRect: { x: number; y: number; width: number; height: number },
    margin = 0
  ): boolean {
    const screenRect = this.worldRectToScreen(worldRect);

    return !(
      screenRect.x + screenRect.width < -margin ||
      screenRect.x > this.state.width + margin ||
      screenRect.y + screenRect.height < -margin ||
      screenRect.y > this.state.height + margin
    );
  }

  /**
   * Get the current scale factor (same as zoom)
   */
  getScale(): number {
    return this.state.zoom;
  }

  /**
   * Create a CSS transform string for DOM elements
   */
  toCSSTransform(): string {
    return `translate(${this.state.pan.x}px, ${this.state.pan.y}px) scale(${this.state.zoom})`;
  }

  // === Internal Methods ===

  /**
   * Update transformation matrices when state changes
   */
  private updateMatrices(): void {
    // Create transform matrix: translate then scale
    this.matrix = new DOMMatrix()
      .translate(this.state.pan.x, this.state.pan.y)
      .scale(this.state.zoom, this.state.zoom);

    // Create inverse matrix for screen-to-world transforms
    this.inverseMatrix = this.matrix.inverse();

    // Update state matrix for external access
    this.state.matrix = new DOMMatrix(this.matrix);
  }

  /**
   * Clone this viewport state
   */
  clone(): ViewportState {
    const cloned = new ViewportState(this.state.width, this.state.height);
    cloned.state = {
      ...this.state,
      pan: { ...this.state.pan },
      panBounds: this.state.panBounds ? { ...this.state.panBounds } : undefined,
      matrix: new DOMMatrix(this.state.matrix),
    };
    cloned.matrix = new DOMMatrix(this.matrix);
    cloned.inverseMatrix = new DOMMatrix(this.inverseMatrix);
    return cloned;
  }

  /**
   * Compare with another viewport state for equality
   */
  equals(other: ViewportState, tolerance = 1e-10): boolean {
    return (
      Math.abs(this.state.zoom - other.state.zoom) < tolerance &&
      Math.abs(this.state.pan.x - other.state.pan.x) < tolerance &&
      Math.abs(this.state.pan.y - other.state.pan.y) < tolerance &&
      this.state.width === other.state.width &&
      this.state.height === other.state.height
    );
  }
}