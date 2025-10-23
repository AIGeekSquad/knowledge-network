/**
 * WebGL Performance Optimizations for Massive Graph Rendering
 *
 * Provides Level-of-Detail (LOD), instanced rendering optimizations,
 * and intelligent batching for 10,000+ node performance.
 */

import type { PositionedNode, PositionedEdge } from '../layout/LayoutEngine';
import type { Transform } from './RenderingSystem';

export interface PerformanceConfig {
  enableLOD: boolean;
  enableInstancing: boolean;
  enableBatching: boolean;
  enableFrustumCulling: boolean;

  // LOD settings
  lodLevels: number;
  lodDistanceThreshold: number[];

  // Batching settings
  maxBatchSize: number;
  batchByMaterial: boolean;

  // Performance targets
  targetFPS: number;
  maxRenderTime: number; // milliseconds
}

export interface LODLevel {
  level: number;
  minDistance: number;
  maxDistance: number;
  nodeSimplification: number; // 0-1, how much to simplify
  edgeSimplification: number;
  skipLabels: boolean;
  skipSmallNodes: boolean;
}

export interface RenderBatch {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  lodLevel: number;
  material: string;
  estimatedCost: number;
}

/**
 * Performance optimization manager for WebGL rendering
 */
export class WebGLPerformance {
  private config: PerformanceConfig;
  private lodLevels: LODLevel[];

  // Performance tracking
  private frameStats = {
    frameTime: 0,
    renderTime: 0,
    nodesRendered: 0,
    edgesRendered: 0,
    batchesExecuted: 0,
    lodLevel: 0,
  };

  // Adaptive performance
  private adaptiveEnabled = true;
  private performanceHistory: number[] = [];
  private currentQuality = 1.0; // 0-1, quality level

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enableLOD: true,
      enableInstancing: true,
      enableBatching: true,
      enableFrustumCulling: true,
      lodLevels: 4,
      lodDistanceThreshold: [100, 500, 2000, 10000],
      maxBatchSize: 1000,
      batchByMaterial: true,
      targetFPS: 60,
      maxRenderTime: 16.67, // 60 FPS
      ...config,
    };

    this.initializeLODLevels();
  }

  /**
   * Initialize Level-of-Detail configurations
   */
  private initializeLODLevels(): void {
    this.lodLevels = [];

    for (let i = 0; i < this.config.lodLevels; i++) {
      const level: LODLevel = {
        level: i,
        minDistance: i === 0 ? 0 : this.config.lodDistanceThreshold[i - 1],
        maxDistance: i < this.config.lodDistanceThreshold.length
          ? this.config.lodDistanceThreshold[i]
          : Infinity,
        nodeSimplification: Math.pow(0.7, i), // Exponential decay
        edgeSimplification: Math.pow(0.5, i),
        skipLabels: i > 1,
        skipSmallNodes: i > 2,
      };

      this.lodLevels.push(level);
    }
  }

  /**
   * Calculate appropriate LOD level based on zoom and performance
   */
  calculateLODLevel(
    transform: Transform,
    viewportSize: { width: number; height: number },
    nodeCount: number
  ): number {
    if (!this.config.enableLOD) return 0;

    const scale = transform.scale;
    const pixelDensity = scale * Math.min(viewportSize.width, viewportSize.height);

    // Base LOD on zoom level
    let lodLevel = 0;
    if (pixelDensity < 200) lodLevel = 3;
    else if (pixelDensity < 500) lodLevel = 2;
    else if (pixelDensity < 1000) lodLevel = 1;
    else lodLevel = 0;

    // Adjust for node count (performance pressure)
    if (nodeCount > 50000) lodLevel = Math.max(lodLevel, 2);
    else if (nodeCount > 20000) lodLevel = Math.max(lodLevel, 1);

    // Adjust for recent performance
    if (this.adaptiveEnabled && this.performanceHistory.length > 5) {
      const avgFrameTime = this.performanceHistory.slice(-5).reduce((a, b) => a + b) / 5;
      if (avgFrameTime > this.config.maxRenderTime * 1.5) {
        lodLevel = Math.min(lodLevel + 1, this.config.lodLevels - 1);
      } else if (avgFrameTime < this.config.maxRenderTime * 0.5) {
        lodLevel = Math.max(lodLevel - 1, 0);
      }
    }

    return Math.min(lodLevel, this.config.lodLevels - 1);
  }

  /**
   * Filter and simplify nodes based on LOD level
   */
  applyNodeLOD(
    nodes: PositionedNode[],
    lodLevel: number,
    transform: Transform,
    viewportBounds: { x: number; y: number; width: number; height: number }
  ): PositionedNode[] {
    if (lodLevel === 0) return nodes;

    const lod = this.lodLevels[lodLevel];
    const filteredNodes: PositionedNode[] = [];

    // Calculate view-dependent thresholds
    const scale = transform.scale;
    const minNodeSize = 2 / scale; // 2 pixel minimum in world space

    for (const node of nodes) {
      // Skip nodes that are too small at current zoom
      if (lod.skipSmallNodes) {
        const nodeRadius = (node as any).radius || 10;
        if (nodeRadius < minNodeSize) continue;
      }

      // Apply distance-based culling
      if (lod.level > 0) {
        const distanceFromCenter = Math.sqrt(
          Math.pow(node.x - (viewportBounds.x + viewportBounds.width / 2), 2) +
          Math.pow(node.y - (viewportBounds.y + viewportBounds.height / 2), 2)
        );

        if (distanceFromCenter > lod.maxDistance / scale) continue;
      }

      // Spatial sampling for high LOD levels
      if (lod.level > 1) {
        const spatialHash = this.spatialHash(node.x, node.y, lod.nodeSimplification);
        if (spatialHash % Math.ceil(1 / lod.nodeSimplification) !== 0) continue;
      }

      filteredNodes.push(node);
    }

    return filteredNodes;
  }

  /**
   * Filter and simplify edges based on LOD level
   */
  applyEdgeLOD(
    edges: PositionedEdge[],
    visibleNodes: Set<string>,
    lodLevel: number,
    transform: Transform
  ): PositionedEdge[] {
    if (lodLevel === 0) return edges;

    const lod = this.lodLevels[lodLevel];
    const filteredEdges: PositionedEdge[] = [];

    for (const edge of edges) {
      const source = edge.source as PositionedNode;
      const target = edge.target as PositionedNode;

      // Only include edges where both nodes are visible
      if (!visibleNodes.has(source.id) || !visibleNodes.has(target.id)) continue;

      // Skip edges based on simplification level
      if (lod.level > 1) {
        const edgeHash = this.edgeHash(source.id, target.id);
        if (edgeHash % Math.ceil(1 / lod.edgeSimplification) !== 0) continue;
      }

      // Skip very short edges at high LOD levels
      if (lod.level > 2) {
        const edgeLength = Math.sqrt(
          Math.pow(target.x - source.x, 2) + Math.pow(target.y - source.y, 2)
        );
        const screenLength = edgeLength * transform.scale;
        if (screenLength < 5) continue; // Skip edges shorter than 5 pixels
      }

      filteredEdges.push(edge);
    }

    return filteredEdges;
  }

  /**
   * Create optimized render batches
   */
  createRenderBatches(
    nodes: PositionedNode[],
    edges: PositionedEdge[],
    lodLevel: number
  ): RenderBatch[] {
    if (!this.config.enableBatching) {
      return [{
        nodes,
        edges,
        lodLevel,
        material: 'default',
        estimatedCost: nodes.length + edges.length,
      }];
    }

    const batches: RenderBatch[] = [];

    // Batch nodes by material/style if enabled
    if (this.config.batchByMaterial) {
      const nodeBatches = this.batchNodesByMaterial(nodes, lodLevel);
      const edgeBatches = this.batchEdgesByMaterial(edges, lodLevel);

      // Combine batches optimally
      batches.push(...nodeBatches);
      batches.push(...edgeBatches);
    } else {
      // Simple size-based batching
      const nodeBatches = this.chunkArray(nodes, this.config.maxBatchSize);
      const edgeBatches = this.chunkArray(edges, this.config.maxBatchSize);

      nodeBatches.forEach(nodeChunk => {
        batches.push({
          nodes: nodeChunk,
          edges: [],
          lodLevel,
          material: 'default',
          estimatedCost: nodeChunk.length,
        });
      });

      edgeBatches.forEach(edgeChunk => {
        batches.push({
          nodes: [],
          edges: edgeChunk,
          lodLevel,
          material: 'default',
          estimatedCost: edgeChunk.length,
        });
      });
    }

    // Sort batches by estimated cost (render cheaper batches first)
    batches.sort((a, b) => a.estimatedCost - b.estimatedCost);

    return batches;
  }

  /**
   * Batch nodes by material properties for efficient rendering
   */
  private batchNodesByMaterial(nodes: PositionedNode[], lodLevel: number): RenderBatch[] {
    const materialMap = new Map<string, PositionedNode[]>();

    for (const node of nodes) {
      // Create material key based on visual properties
      const materialKey = this.getNodeMaterialKey(node);

      if (!materialMap.has(materialKey)) {
        materialMap.set(materialKey, []);
      }
      materialMap.get(materialKey)!.push(node);
    }

    const batches: RenderBatch[] = [];

    for (const [material, materialNodes] of materialMap) {
      // Split large material groups into smaller batches
      const chunks = this.chunkArray(materialNodes, this.config.maxBatchSize);

      for (const chunk of chunks) {
        batches.push({
          nodes: chunk,
          edges: [],
          lodLevel,
          material,
          estimatedCost: chunk.length,
        });
      }
    }

    return batches;
  }

  /**
   * Batch edges by material properties
   */
  private batchEdgesByMaterial(edges: PositionedEdge[], lodLevel: number): RenderBatch[] {
    const materialMap = new Map<string, PositionedEdge[]>();

    for (const edge of edges) {
      const materialKey = this.getEdgeMaterialKey(edge);

      if (!materialMap.has(materialKey)) {
        materialMap.set(materialKey, []);
      }
      materialMap.get(materialKey)!.push(edge);
    }

    const batches: RenderBatch[] = [];

    for (const [material, materialEdges] of materialMap) {
      const chunks = this.chunkArray(materialEdges, this.config.maxBatchSize);

      for (const chunk of chunks) {
        batches.push({
          nodes: [],
          edges: chunk,
          lodLevel,
          material,
          estimatedCost: chunk.length * 2, // Edges are more expensive than nodes
        });
      }
    }

    return batches;
  }

  /**
   * Update performance statistics and adapt quality
   */
  updatePerformanceStats(frameTime: number, renderStats: {
    nodesRendered: number;
    edgesRendered: number;
    batchesExecuted: number;
    lodLevel: number;
  }): void {
    this.frameStats = {
      frameTime,
      renderTime: frameTime,
      ...renderStats,
    };

    // Track performance history for adaptive quality
    this.performanceHistory.push(frameTime);
    if (this.performanceHistory.length > 20) {
      this.performanceHistory.shift();
    }

    // Update quality level based on performance
    if (this.adaptiveEnabled) {
      this.updateAdaptiveQuality();
    }
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats() {
    return {
      ...this.frameStats,
      currentQuality: this.currentQuality,
      avgFrameTime: this.performanceHistory.length > 0
        ? this.performanceHistory.reduce((a, b) => a + b) / this.performanceHistory.length
        : 0,
      targetFrameTime: this.config.maxRenderTime,
    };
  }

  /**
   * Enable/disable adaptive performance
   */
  setAdaptivePerformance(enabled: boolean): void {
    this.adaptiveEnabled = enabled;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
    this.initializeLODLevels();
  }

  // === Utility Methods ===

  private spatialHash(x: number, y: number, scale: number): number {
    const gridSize = 100 / scale;
    const gx = Math.floor(x / gridSize);
    const gy = Math.floor(y / gridSize);
    return Math.abs((gx * 73856093) ^ (gy * 19349663));
  }

  private edgeHash(sourceId: string, targetId: string): number {
    const combined = sourceId + targetId;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash + combined.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash);
  }

  private getNodeMaterialKey(node: PositionedNode): string {
    // Create a key based on visual properties that affect rendering
    const props = node as any;
    return `${props.color || 'default'}_${props.shape || 'circle'}_${props.strokeWidth || 1}`;
  }

  private getEdgeMaterialKey(edge: PositionedEdge): string {
    const props = edge as any;
    return `${props.color || 'default'}_${props.strokeWidth || 1}_${props.strokeDasharray || 'solid'}`;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private updateAdaptiveQuality(): void {
    if (this.performanceHistory.length < 5) return;

    const recentAvg = this.performanceHistory.slice(-5).reduce((a, b) => a + b) / 5;
    const target = this.config.maxRenderTime;

    if (recentAvg > target * 1.2) {
      // Performance is poor, reduce quality
      this.currentQuality = Math.max(0.1, this.currentQuality - 0.1);
    } else if (recentAvg < target * 0.8) {
      // Performance is good, can increase quality
      this.currentQuality = Math.min(1.0, this.currentQuality + 0.05);
    }
  }
}