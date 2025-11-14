/**
 * Enhanced RenderingSystem with integrated spatial indexing for efficient node selection.
 *
 * Extends the base RenderingSystem with spatial indexing capabilities,
 * enabling O(log n) node selection, ray-based picking, and region queries.
 *
 * @example
 * ```typescript
 * const spatialRenderer = new SpatialRenderingSystem(container, {
 *   width: 800,
 *   height: 600,
 *   spatialIndexing: {
 *     enabled: true,
 *     maxDepth: 8,
 *     maxNodesPerLeaf: 10
 *   }
 * });
 *
 * // Render with automatic spatial index building
 * spatialRenderer.render(layoutResult);
 *
 * // Efficient node selection
 * const nodeAtPoint = spatialRenderer.getNodeAt(mouseX, mouseY);
 * const nodesInRegion = spatialRenderer.getNodesInRegion(selectionBox);
 * ```
 */

import { EventEmitter } from '../utils/EventEmitter';
import type {
  LayoutResult,
  Point,
  PositionedNode,
} from '../layout/LayoutEngine';
import { SVGRenderer } from './SVGRenderer';
import { CanvasRenderer } from './CanvasRenderer';
import type { IRenderer } from './IRenderer';
import {
  SpatialIndexer,
  SpatialIndexerFactory,
  RaycastingUtils,
} from '../spatial';
import type {
  SpatialIndexConfig,
  Rectangle,
  Box,
  Ray2D,
  Ray3D,
  RayIntersection,
  SpatialIndexStats,
} from '../spatial/types';

// Re-export base types
export type {
  RendererType,
  NodeShape,
  CurveType,
  Transform,
  RendererConfig,
  RenderConfig,
  NodeRenderConfig,
  EdgeRenderConfig,
  LabelRenderConfig,
  LabelItem,
  NodeStyleUpdate,
  EdgeStyleUpdate,
  HighlightConfig,
} from './RenderingSystem';

/**
 * Configuration for spatial indexing in the rendering system.
 */
export interface SpatialRenderingConfig {
  enabled: boolean;
  indexerType: 'fast' | 'precise' | 'balanced' | 'memory-efficient' | 'custom';
  customConfig?: Partial<SpatialIndexConfig>;
  rebuildOnRender: boolean;
  raycastingTolerance: number;
  selectionRadius: number;
}

/**
 * Extended renderer configuration with spatial indexing options.
 */
export interface ExtendedRendererConfig {
  width: number;
  height: number;
  pixelRatio?: number;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  spatialIndexing?: Partial<SpatialRenderingConfig>;
}

/**
 * Node selection result with additional spatial information.
 */
export interface NodeSelectionResult {
  node: PositionedNode;
  distance: number;
  exactMatch: boolean;
  selectionPoint: Point;
}

/**
 * Region selection result.
 */
export interface RegionSelectionResult {
  nodes: PositionedNode[];
  totalCount: number;
  bounds: Rectangle | Box;
  containsAll: boolean;
}

/**
 * Enhanced rendering system with spatial indexing capabilities.
 */
export class SpatialRenderingSystem extends EventEmitter {
  private renderer: IRenderer | null = null;
  private container: HTMLElement;
  private config: ExtendedRendererConfig;
  private renderConfig: any; // RenderConfig from base
  private spatialIndexer: SpatialIndexer | null = null;
  private spatialConfig: SpatialRenderingConfig;
  private currentLayout: LayoutResult | null = null;
  private highlightedNodes: Set<string> = new Set();
  private highlightedEdges: Set<string> = new Set();

  constructor(
    container: HTMLElement,
    config?: Partial<ExtendedRendererConfig>,
    renderConfig?: any
  ) {
    super();
    this.container = container;
    this.config = {
      width: 800,
      height: 600,
      pixelRatio: window.devicePixelRatio || 1,
      antialias: true,
      preserveDrawingBuffer: false,
      ...config,
    };

    this.spatialConfig = {
      enabled: true,
      indexerType: 'balanced',
      rebuildOnRender: true,
      raycastingTolerance: 5.0,
      selectionRadius: 10.0,
      ...config?.spatialIndexing,
    };

    this.renderConfig = {
      layerOrder: ['edges', 'nodes', 'labels'],
      ...renderConfig,
    };

    // Initialize spatial indexer if enabled
    if (this.spatialConfig.enabled) {
      this.initializeSpatialIndexer();
    }
  }

  /**
   * Initialize the spatial indexer based on configuration.
   */
  private initializeSpatialIndexer(): void {
    if (!this.spatialConfig.enabled) {
      this.spatialIndexer = null;
      return;
    }

    switch (this.spatialConfig.indexerType) {
      case 'fast':
        this.spatialIndexer = SpatialIndexerFactory.createFast();
        break;
      case 'precise':
        this.spatialIndexer = SpatialIndexerFactory.createPrecise();
        break;
      case 'balanced':
        this.spatialIndexer = SpatialIndexerFactory.createBalanced();
        break;
      case 'memory-efficient':
        this.spatialIndexer = SpatialIndexerFactory.createMemoryEfficient();
        break;
      case 'custom':
        this.spatialIndexer = new SpatialIndexer(this.spatialConfig.customConfig);
        break;
    }

    // Update raycasting tolerance
    if (this.spatialIndexer) {
      const config = this.spatialIndexer.getConfig();
      config.rayIntersectionTolerance = this.spatialConfig.raycastingTolerance;
      this.spatialIndexer.setConfig(config);
    }
  }

  /**
   * Set the renderer type (inherited from base RenderingSystem pattern).
   */
  async setRenderer(type: string): Promise<void> {
    if (this.renderer) {
      this.renderer.destroy();
    }

    switch (type) {
      case 'svg':
        this.renderer = new SVGRenderer();
        break;
      case 'canvas':
        this.renderer = new CanvasRenderer();
        break;
      case 'webgl':
        throw new Error('WebGL renderer not yet implemented');
      default:
        throw new Error(`Unknown renderer type: ${type}`);
    }

    this.renderer.initialize(this.container, this.config);
    this.emit('rendererChanged', type);
  }

  /**
   * Render the graph layout with automatic spatial index building.
   */
  render(layout: LayoutResult, config?: any): void {
    if (!this.renderer) {
      this.setRenderer('svg');
    }

    this.currentLayout = layout;
    const finalConfig = { ...this.renderConfig, ...config };
    this.renderConfig = finalConfig;

    // Render using base renderer
    this.renderer!.render(layout, finalConfig);

    // Build or rebuild spatial index
    if (this.spatialConfig.enabled && this.spatialConfig.rebuildOnRender) {
      this.buildSpatialIndex();
    }

    this.emit('rendered', layout);
    this.emit('spatialIndexBuilt', this.getSpatialStats());
  }

  /**
   * Build spatial index from current layout.
   */
  buildSpatialIndex(): void {
    if (!this.spatialIndexer || !this.currentLayout) {
      return;
    }

    const startTime = performance.now();
    this.spatialIndexer.build(this.currentLayout.nodes);
    const buildTime = performance.now() - startTime;

    this.emit('spatialIndexRebuilt', {
      buildTime,
      stats: this.getSpatialStats(),
    });
  }

  /**
   * Get node at specific screen coordinates.
   */
  getNodeAt(x: number, y: number, radius?: number): NodeSelectionResult | null {
    if (!this.spatialIndexer) {
      return this.getNodeAtFallback(x, y, radius);
    }

    const searchRadius = radius ?? this.spatialConfig.selectionRadius;
    const point = this.screenToWorld({ x, y });

    const nearestNode = this.spatialIndexer.findNearest(point, searchRadius);

    if (!nearestNode) {
      return null;
    }

    const distance = this.calculateDistance(point, {
      x: nearestNode.x,
      y: nearestNode.y,
      z: nearestNode.z,
    });

    return {
      node: nearestNode,
      distance,
      exactMatch: distance < 1.0,
      selectionPoint: point,
    };
  }

  /**
   * Get nodes in a rectangular or box region.
   */
  getNodesInRegion(bounds: Rectangle | Box): RegionSelectionResult {
    if (!this.spatialIndexer) {
      return this.getNodesInRegionFallback(bounds);
    }

    const worldBounds = this.screenToWorldRegion(bounds);
    const nodes = this.spatialIndexer.queryRegion(worldBounds);

    return {
      nodes,
      totalCount: nodes.length,
      bounds: worldBounds,
      containsAll: false, // Could be enhanced to check if all nodes are contained
    };
  }

  /**
   * Get nodes intersected by a ray.
   */
  getNodesOnRay(ray: Ray2D | Ray3D): RayIntersection[] {
    if (!this.spatialIndexer) {
      return [];
    }

    const worldRay = this.screenToWorldRay(ray);
    return this.spatialIndexer.queryRay(worldRay);
  }

  /**
   * Get nodes within a distance from a point.
   */
  getNodesWithinDistance(
    point: Point,
    distance: number
  ): Array<{ node: PositionedNode; distance: number }> {
    if (!this.spatialIndexer) {
      return [];
    }

    const worldPoint = this.screenToWorld(point);
    return this.spatialIndexer.getNodesWithinDistance(worldPoint, distance);
  }

  /**
   * Create a ray from mouse coordinates for node selection.
   */
  createRayFromMouse(mouseX: number, mouseY: number): Ray2D {
    return RaycastingUtils.createRayFromMouse(
      mouseX,
      mouseY,
      this.config.width,
      this.config.height
    );
  }

  /**
   * Get the closest node to a ray (useful for mouse-over interactions).
   */
  getClosestNodeToRay(ray: Ray2D | Ray3D): NodeSelectionResult | null {
    const intersections = this.getNodesOnRay(ray);
    const closest = RaycastingUtils.getClosestIntersection(intersections);

    if (!closest) {
      return null;
    }

    return {
      node: closest.node,
      distance: closest.distance,
      exactMatch: closest.distance < this.spatialConfig.raycastingTolerance,
      selectionPoint: closest.point,
    };
  }

  /**
   * Enable or disable spatial indexing.
   */
  setSpatialIndexingEnabled(enabled: boolean): void {
    const wasEnabled = this.spatialConfig.enabled;
    this.spatialConfig.enabled = enabled;

    if (enabled && !wasEnabled) {
      this.initializeSpatialIndexer();
      if (this.currentLayout) {
        this.buildSpatialIndex();
      }
    } else if (!enabled && wasEnabled) {
      this.spatialIndexer = null;
    }

    this.emit('spatialIndexingToggled', enabled);
  }

  /**
   * Update spatial indexing configuration.
   */
  setSpatialConfig(config: Partial<SpatialRenderingConfig>): void {
    this.spatialConfig = { ...this.spatialConfig, ...config };

    if (this.spatialConfig.enabled) {
      this.initializeSpatialIndexer();
      if (this.currentLayout && this.spatialConfig.rebuildOnRender) {
        this.buildSpatialIndex();
      }
    }
  }

  /**
   * Get spatial indexing statistics.
   */
  getSpatialStats(): SpatialIndexStats | null {
    return this.spatialIndexer?.getStatistics() || null;
  }

  /**
   * Check if spatial indexing is available and built.
   */
  isSpatialIndexAvailable(): boolean {
    return this.spatialIndexer !== null && this.spatialIndexer.getNodes().length > 0;
  }

  /**
   * Force rebuild of spatial index.
   */
  rebuildSpatialIndex(): void {
    if (this.spatialConfig.enabled && this.currentLayout) {
      this.buildSpatialIndex();
    }
  }

  /**
   * Get the container element from the underlying renderer.
   */
  getContainer(): Element | null {
    return this.renderer?.getContainer() || null;
  }

  /**
   * Get the underlying spatial indexer (for advanced usage).
   */
  getSpatialIndexer(): SpatialIndexer | null {
    return this.spatialIndexer;
  }

  // === Coordinate System Transformation Methods ===

  /**
   * Transform screen coordinates to world coordinates.
   */
  private screenToWorld(screenPoint: Point): Point {
    // This is a simplified transformation
    // In a real implementation, you'd use the renderer's transformation matrix
    const transform = this.getTransform();

    return {
      x: (screenPoint.x - transform.x) / transform.scale,
      y: (screenPoint.y - transform.y) / transform.scale,
      z: 'z' in screenPoint ? screenPoint.z : undefined,
    };
  }

  /**
   * Transform screen region to world region.
   */
  private screenToWorldRegion(screenBounds: Rectangle | Box): Rectangle | Box {
    const topLeft = this.screenToWorld({
      x: screenBounds.x,
      y: screenBounds.y,
    });
    const bottomRight = this.screenToWorld({
      x: screenBounds.x + screenBounds.width,
      y: screenBounds.y + screenBounds.height,
    });

    if ('z' in screenBounds) {
      return {
        x: topLeft.x,
        y: topLeft.y,
        z: screenBounds.z,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
        depth: screenBounds.depth,
      };
    } else {
      return {
        x: topLeft.x,
        y: topLeft.y,
        width: bottomRight.x - topLeft.x,
        height: bottomRight.y - topLeft.y,
      };
    }
  }

  /**
   * Transform screen ray to world ray.
   */
  private screenToWorldRay(screenRay: Ray2D | Ray3D): Ray2D | Ray3D {
    const worldOrigin = this.screenToWorld(screenRay.origin);

    if ('z' in screenRay.origin) {
      return {
        origin: worldOrigin as any,
        direction: screenRay.direction, // Direction vectors don't need transformation
      };
    } else {
      return {
        origin: worldOrigin as any,
        direction: screenRay.direction,
      };
    }
  }

  /**
   * Calculate distance between two points (2D or 3D).
   */
  private calculateDistance(a: Point, b: Point): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    if ('z' in a && 'z' in b && a.z !== undefined && b.z !== undefined) {
      const dz = a.z - b.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    } else {
      return Math.sqrt(dx * dx + dy * dy);
    }
  }

  // === Fallback Methods (when spatial indexing is disabled) ===

  /**
   * Fallback node selection using linear search.
   */
  private getNodeAtFallback(x: number, y: number, radius = 10): NodeSelectionResult | null {
    if (!this.currentLayout) {
      return null;
    }

    const worldPoint = this.screenToWorld({ x, y });
    let closest: PositionedNode | null = null;
    let minDistance = radius;

    for (const node of this.currentLayout.nodes) {
      const distance = this.calculateDistance(worldPoint, {
        x: node.x,
        y: node.y,
        z: node.z,
      });

      if (distance < minDistance) {
        minDistance = distance;
        closest = node;
      }
    }

    if (!closest) {
      return null;
    }

    return {
      node: closest,
      distance: minDistance,
      exactMatch: minDistance < 1.0,
      selectionPoint: worldPoint,
    };
  }

  /**
   * Fallback region selection using linear search.
   */
  private getNodesInRegionFallback(bounds: Rectangle | Box): RegionSelectionResult {
    if (!this.currentLayout) {
      return {
        nodes: [],
        totalCount: 0,
        bounds,
        containsAll: false,
      };
    }

    const worldBounds = this.screenToWorldRegion(bounds);
    const nodes: PositionedNode[] = [];

    for (const node of this.currentLayout.nodes) {
      if (this.isNodeInBounds(node, worldBounds)) {
        nodes.push(node);
      }
    }

    return {
      nodes,
      totalCount: nodes.length,
      bounds: worldBounds,
      containsAll: nodes.length === this.currentLayout.nodes.length,
    };
  }

  /**
   * Check if a node is within bounds.
   */
  private isNodeInBounds(node: PositionedNode, bounds: Rectangle | Box): boolean {
    const inXY =
      node.x >= bounds.x &&
      node.x <= bounds.x + bounds.width &&
      node.y >= bounds.y &&
      node.y <= bounds.y + bounds.height;

    if ('z' in bounds) {
      const z = node.z || 0;
      return inXY && z >= bounds.z && z <= bounds.z + bounds.depth;
    }

    return inXY;
  }

  // === Delegate base RenderingSystem methods ===

  getRenderer(): IRenderer | null {
    return this.renderer;
  }

  initialize(): void {
    if (!this.renderer) {
      this.setRenderer('svg');
    }
  }

  getTransform(): any {
    return this.renderer?.getTransform() || { x: 0, y: 0, scale: 1 };
  }

  setTransform(transform: any): void {
    this.renderer?.setTransform(transform);
  }

  highlightNodes(nodeIds: string[], config?: any): void {
    this.renderer?.highlightNodes(nodeIds, config);
    nodeIds.forEach(id => this.highlightedNodes.add(id));
  }

  clearHighlights(): void {
    this.renderer?.clearHighlights();
    this.highlightedNodes.clear();
    this.highlightedEdges.clear();
  }

  clear(): void {
    this.renderer?.clear();
    this.currentLayout = null;
    this.spatialIndexer?.clear();
  }

  destroy(): void {
    this.renderer?.destroy();
    this.spatialIndexer = null;
    this.currentLayout = null;
    this.removeAllListeners();
  }
}

/**
 * Factory for creating spatial rendering systems with different optimizations.
 */
export class SpatialRenderingFactory {
  /**
   * Create a fast spatial rendering system optimized for performance.
   */
  static createFast(container: HTMLElement, config?: Partial<ExtendedRendererConfig>) {
    return new SpatialRenderingSystem(container, {
      ...config,
      spatialIndexing: {
        enabled: true,
        indexerType: 'fast',
        rebuildOnRender: true,
        raycastingTolerance: 10.0,
        selectionRadius: 15.0,
        ...config?.spatialIndexing,
      },
    });
  }

  /**
   * Create a precise spatial rendering system optimized for accuracy.
   */
  static createPrecise(container: HTMLElement, config?: Partial<ExtendedRendererConfig>) {
    return new SpatialRenderingSystem(container, {
      ...config,
      spatialIndexing: {
        enabled: true,
        indexerType: 'precise',
        rebuildOnRender: true,
        raycastingTolerance: 2.0,
        selectionRadius: 5.0,
        ...config?.spatialIndexing,
      },
    });
  }

  /**
   * Create a memory-efficient spatial rendering system.
   */
  static createMemoryEfficient(container: HTMLElement, config?: Partial<ExtendedRendererConfig>) {
    return new SpatialRenderingSystem(container, {
      ...config,
      spatialIndexing: {
        enabled: true,
        indexerType: 'memory-efficient',
        rebuildOnRender: false, // Manual rebuild for memory control
        raycastingTolerance: 8.0,
        selectionRadius: 12.0,
        ...config?.spatialIndexing,
      },
    });
  }

  /**
   * Create a spatial rendering system without spatial indexing (fallback mode).
   */
  static createFallback(container: HTMLElement, config?: Partial<ExtendedRendererConfig>) {
    return new SpatialRenderingSystem(container, {
      ...config,
      spatialIndexing: {
        enabled: false,
        ...config?.spatialIndexing,
      },
    });
  }
}