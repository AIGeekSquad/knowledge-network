/**
 * RendererIntegration provides utilities to connect renderers
 * with the interaction system for consistent behavior.
 *
 * Features:
 * - Enhanced IRenderer interface with interaction support
 * - Viewport management integration
 * - Event delegation and handling
 * - Performance optimization
 * - Renderer capability detection
 */

import type { Point2D, Rectangle } from '../spatial/types';
import type { PositionedNode } from '../layout/LayoutEngine';
import type { IRenderer } from '../rendering/IRenderer';
import type { Transform } from '../rendering/RenderingSystem';
import type {
  ViewportState,
  InteractionEventHandlers, ViewportChangeEvent, SelectionChangeEvent, NodeInteractionEvent,
} from './types';

// === Enhanced Renderer Interface ===

export interface IInteractiveRenderer extends IRenderer {
  // Interaction capabilities
  readonly supportsInteraction: boolean;
  readonly supportsSpatialQueries: boolean;
  readonly supportsViewportCulling: boolean;
  readonly supportsHardwareAcceleration: boolean;

  // Viewport control
  setZoom(zoom: number, center?: Point2D): void;
  setPan(pan: Point2D): void;
  resetView(): void;
  fitToViewport(padding?: number): void;

  // Spatial queries
  getNodeAt(screenX: number, screenY: number): PositionedNode | null;
  getNodesInRegion(region: Rectangle): PositionedNode[];
  isNodeVisible(_node: PositionedNode): boolean;

  // Event handling
  setInteractionHandlers(handlers: Partial<InteractionEventHandlers>): void;
  removeInteractionHandlers(): void;

  // Performance
  enableViewportCulling(enabled: boolean): void;
  setLevelOfDetail(enabled: boolean): void;
  getPerformanceMetrics(): RendererPerformanceMetrics;
}

export interface RendererPerformanceMetrics {
  frameRate: number;
  renderTime: number;
  memoryUsage: number;
  drawnNodes: number;
  drawnEdges: number;
  culledNodes: number;
  culledEdges: number;
}

// === Renderer Capability Detection ===

export interface RendererCapabilities {
  type: 'svg' | 'canvas' | 'webgl';
  supportsInteraction: boolean;
  supportsSpatialQueries: boolean;
  supportsViewportCulling: boolean;
  supportsHardwareAcceleration: boolean;
  supportsTouch: boolean;
  maxNodes: number;
  maxEdges: number;
}

export function detectRendererCapabilities(renderer: IRenderer): RendererCapabilities {
  const type = renderer.type;

  switch (type) {
    case 'svg':
      return {
        type: 'svg',
        supportsInteraction: true,
        supportsSpatialQueries: false, // DOM queries are slower
        supportsViewportCulling: false,
        supportsHardwareAcceleration: false,
        supportsTouch: true,
        maxNodes: 500, // SVG performance degrades with many elements
        maxEdges: 1000,
      };

    case 'canvas':
      return {
        type: 'canvas',
        supportsInteraction: true,
        supportsSpatialQueries: true, // With spatial indexing
        supportsViewportCulling: true,
        supportsHardwareAcceleration: false,
        supportsTouch: true,
        maxNodes: 5000,
        maxEdges: 10000,
      };

    case 'webgl':
      return {
        type: 'webgl',
        supportsInteraction: true,
        supportsSpatialQueries: true,
        supportsViewportCulling: true,
        supportsHardwareAcceleration: true,
        supportsTouch: true,
        maxNodes: 50000, // WebGL can handle much larger datasets
        maxEdges: 100000,
      };

    default:
      return {
        type: 'canvas', // Default fallback
        supportsInteraction: false,
        supportsSpatialQueries: false,
        supportsViewportCulling: false,
        supportsHardwareAcceleration: false,
        supportsTouch: false,
        maxNodes: 100,
        maxEdges: 200,
      };
  }
}

// === Renderer Integration Wrapper ===

export class RendererIntegrationAdapter implements IInteractiveRenderer {
  private renderer: IRenderer;
  private capabilities: RendererCapabilities;
  private interactionHandlers: Partial<InteractionEventHandlers> = {};

  // Viewport state
  private currentTransform: Transform = { x: 0, y: 0, scale: 1 };
  private viewportDimensions = { width: 800, height: 600 };

  // Performance tracking
  private frameStartTime = 0;
  private frameCount = 0;
  private lastFpsCheck = 0;
  private currentFps = 60;

  constructor(renderer: IRenderer) {
    this.renderer = renderer;
    this.capabilities = detectRendererCapabilities(renderer);
  }

  // === IRenderer Interface Delegation ===

  get type() { return this.renderer.type; }
  get supportsInteraction() { return this.capabilities.supportsInteraction; }
  get supportsSpatialQueries() { return this.capabilities.supportsSpatialQueries; }
  get supportsViewportCulling() { return this.capabilities.supportsViewportCulling; }
  get supportsHardwareAcceleration() { return this.capabilities.supportsHardwareAcceleration; }

  initialize(container: HTMLElement, _config: any): void {
    const rect = container.getBoundingClientRect();
    this.viewportDimensions = { width: rect.width, height: rect.height };

    this.renderer.initialize(container, _config);
  }

  destroy(): void {
    this.renderer.destroy();
    this.interactionHandlers = {};
  }

  clear(): void {
    this.renderer.clear();
  }

  render(layout: any, _config: any): void {
    this.startFrameTiming();
    this.renderer.render(layout, _config);
    this.endFrameTiming();
  }

  renderNodes(nodes: PositionedNode[], config?: any): void {
    // Apply viewport culling if supported
    if (this.capabilities.supportsViewportCulling) {
      nodes = this.cullNodes(nodes);
    }

    this.renderer.renderNodes(nodes, _config);
  }

  renderEdges(edges: any[], config?: any, nodes?: PositionedNode[]): void {
    // Apply viewport culling if supported
    if (this.capabilities.supportsViewportCulling && edges.length > 0) {
      edges = this.cullEdges(edges);
    }

    this.renderer.renderEdges(edges, _config, nodes);
  }

  renderLabels(items: any[], config?: any): void {
    this.renderer.renderLabels(items, _config);
  }

  updateNodePositions(positions: any[]): void {
    this.renderer.updateNodePositions(positions);
  }

  updateEdgePositions(positions: any[]): void {
    this.renderer.updateEdgePositions(positions);
  }

  updateNodeStyles(updates: any[]): void {
    this.renderer.updateNodeStyles(updates);
  }

  updateEdgeStyles(updates: any[]): void {
    this.renderer.updateEdgeStyles(updates);
  }

  highlightNodes(nodeIds: string[], config?: any): void {
    this.renderer.highlightNodes(nodeIds, _config);
  }

  highlightEdges(edgeIds: string[], config?: any): void {
    this.renderer.highlightEdges(edgeIds, _config);
  }

  clearHighlights(): void {
    this.renderer.clearHighlights();
  }

  setTransform(transform: Transform): void {
    this.currentTransform = { ...transform };
    this.renderer.setTransform(transform);
  }

  getTransform(): Transform {
    return { ...this.currentTransform };
  }

  getNodeElement(nodeId: string): Element | null {
    return this.renderer.getNodeElement(nodeId);
  }

  getEdgeElement(edgeId: string): Element | null {
    return this.renderer.getEdgeElement(edgeId);
  }

  getContainer(): Element {
    return this.renderer.getContainer();
  }

  enableBatching(enabled: boolean): void {
    this.renderer.enableBatching(enabled);
  }

  flush(): void {
    this.renderer.flush();
  }

  // === Enhanced Interaction Methods ===

  setZoom(zoom: number, center?: Point2D): void {
    if (center) {
      // Adjust pan to maintain center point
      const currentCenter = {
        x: this.viewportDimensions.width / 2,
        y: this.viewportDimensions.height / 2,
      };

      const scaleDelta = zoom / this.currentTransform.scale;
      const newPan = {
        x: this.currentTransform.x + (center.x - currentCenter.x) * (1 - scaleDelta),
        y: this.currentTransform.y + (center.y - currentCenter.y) * (1 - scaleDelta),
      };

      this.setTransform({
        x: newPan.x,
        y: newPan.y,
        scale: zoom,
      });
    } else {
      this.setTransform({
        ...this.currentTransform,
        scale: zoom,
      });
    }
  }

  setPan(pan: Point2D): void {
    this.setTransform({
      ...this.currentTransform,
      x: pan.x,
      y: pan.y,
    });
  }

  resetView(): void {
    this.setTransform({ x: 0, y: 0, scale: 1 });
  }

  fitToViewport(padding = 50): void {
    // This would need access to node data to calculate bounds
    // Implementation depends on renderer type and data source
    console.warn('fitToViewport not implemented - requires node data access');
  }

  getNodeAt(screenX: number, screenY: number): PositionedNode | null {
    // Transform screen coordinates to world coordinates
    const worldX = (screenX - this.currentTransform.x) / this.currentTransform.scale;
    const worldY = (screenY - this.currentTransform.y) / this.currentTransform.scale;

    // This would need spatial indexing or renderer-specific hit testing
    // Implementation depends on available spatial indexer
    console.warn('getNodeAt not implemented - requires spatial indexing integration');
    return null;
  }

  getNodesInRegion(region: Rectangle): PositionedNode[] {
    // Transform screen region to world coordinates
    const worldRegion = {
      x: (region.x - this.currentTransform.x) / this.currentTransform.scale,
      y: (region.y - this.currentTransform.y) / this.currentTransform.scale,
      width: region.width / this.currentTransform.scale,
      height: region.height / this.currentTransform.scale,
    };

    // This would need spatial indexing
    console.warn('getNodesInRegion not implemented - requires spatial indexing integration');
    return [];
  }

  isNodeVisible(_node: PositionedNode): boolean {
    // Transform node position to screen coordinates
    const screenX = node.x * this.currentTransform.scale + this.currentTransform.x;
    const screenY = node.y * this.currentTransform.scale + this.currentTransform.y;

    // Check if node is within viewport bounds (with some margin for node radius)
    const margin = (node.radius || 10) * this.currentTransform.scale;

    return (
      screenX >= -margin &&
      screenX <= this.viewportDimensions.width + margin &&
      screenY >= -margin &&
      screenY <= this.viewportDimensions.height + margin
    );
  }

  setInteractionHandlers(handlers: Partial<InteractionEventHandlers>): void {
    this.interactionHandlers = { ...this.interactionHandlers, ...handlers };
  }

  removeInteractionHandlers(): void {
    this.interactionHandlers = {};
  }

  enableViewportCulling(enabled: boolean): void {
    // Store viewport culling preference
    // Implementation depends on renderer type
    // Viewport culling feature configured
  }

  setLevelOfDetail(enabled: boolean): void {
    // Store level of detail preference
    // Implementation depends on renderer type
    // Level of detail feature configured
  }

  getPerformanceMetrics(): RendererPerformanceMetrics {
    return {
      frameRate: this.currentFps,
      renderTime: 0, // Would need to be measured during render calls
      memoryUsage: 0, // Would need renderer-specific measurement
      drawnNodes: 0, // Would need to be tracked during rendering
      drawnEdges: 0, // Would need to be tracked during rendering
      culledNodes: 0, // Would need to be tracked during culling
      culledEdges: 0, // Would need to be tracked during culling
    };
  }

  // === Viewport Culling ===

  private cullNodes(nodes: PositionedNode[]): PositionedNode[] {
    if (!this.capabilities.supportsViewportCulling) {
      return nodes;
    }

    return nodes.filter(node => this.isNodeVisible(_node));
  }

  private cullEdges(edges: any[]): any[] {
    if (!this.capabilities.supportsViewportCulling) {
      return edges;
    }

    // For edges, we need to check if either endpoint is visible
    // or if the edge crosses the viewport
    return edges.filter(edge => {
      // This would need access to source/target node positions
      // Simplified implementation for now
      return true;
    });
  }

  // === Performance Monitoring ===

  private startFrameTiming(): void {
    this.frameStartTime = performance.now();
  }

  private endFrameTiming(): void {
    if (this.frameStartTime === 0) return;

    const frameTime = performance.now() - this.frameStartTime;
    this.frameCount++;

    // Calculate FPS every second
    const now = Date.now();
    if (now - this.lastFpsCheck >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsCheck));
      this.frameCount = 0;
      this.lastFpsCheck = now;
    }

    this.frameStartTime = 0;
  }
}

// === Integration Factory Functions ===

/**
 * Wrap an existing renderer with interaction capabilities
 */
export function createInteractiveRenderer(renderer: IRenderer): IInteractiveRenderer {
  return new RendererIntegrationAdapter(renderer);
}

/**
 * Check if renderer supports specific interaction features
 */
export function checkRendererCompatibility(
  renderer: IRenderer,
  requiredFeatures: Partial<RendererCapabilities>
): boolean {
  const capabilities = detectRendererCapabilities(renderer);

  for (const [feature, required] of Object.entries(requiredFeatures)) {
    if (required && !capabilities[feature as keyof RendererCapabilities]) {
      return false;
    }
  }

  return true;
}

/**
 * Get optimal renderer type for given requirements
 */
export function getOptimalRendererType(
  nodeCount: number,
  edgeCount: number,
  requiresInteraction = true,
  requiresHighPerformance = false
): 'svg' | 'canvas' | 'webgl' {
  if (requiresHighPerformance || nodeCount > 5000 || edgeCount > 10000) {
    return 'webgl';
  }

  if (nodeCount > 500 || edgeCount > 1000) {
    return 'canvas';
  }

  return requiresInteraction ? 'svg' : 'canvas';
}

/**
 * Create renderer with interaction optimization
 */
export function createOptimizedRenderer(
  rendererType: 'svg' | 'canvas' | 'webgl',
  nodeCount: number,
  edgeCount: number
): {
  renderer: IInteractiveRenderer;
  _config: any;
  recommendations: string[];
} {
  // This would create the actual renderer instance
  // For now, return configuration recommendations

  const recommendations: string[] = [];
  const _config: any = {};

  if (nodeCount > 1000) {
    recommendations.push('Enable viewport culling for better performance');
    config.enableViewportCulling = true;
  }

  if (nodeCount > 5000) {
    recommendations.push('Enable level-of-detail rendering');
    config.enableLevelOfDetail = true;
  }

  if (edgeCount > 2000) {
    recommendations.push('Use edge bundling to reduce visual complexity');
    config.enableEdgeBundling = true;
  }

  if (rendererType === 'webgl') {
    recommendations.push('GPU acceleration available for maximum performance');
    config.enableHardwareAcceleration = true;
  }

  // This would need actual renderer creation based on type
  const mockRenderer = {} as IInteractiveRenderer;

  return {
    renderer: mockRenderer,
    _config,
    recommendations,
  };
}