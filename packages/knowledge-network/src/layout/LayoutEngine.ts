import { EventEmitter } from 'events';
import * as d3 from 'd3';
import type { GraphData, Node, Edge, GraphConfig } from '../types';

export type LayoutAlgorithm = 'force-directed' | 'hierarchical' | 'circular' | 'grid' | 'radial' | 'custom';

export interface LayoutConfig {
  width: number;
  height: number;
  padding?: number;
  dimensions?: number;

  // Force-directed specific
  linkDistance?: number | ((edge: Edge) => number);
  linkStrength?: number | ((edge: Edge) => number);
  chargeStrength?: number | ((node: Node) => number);
  chargeDistance?: number;
  collisionRadius?: number | ((node: Node) => number);
  alpha?: number;
  alphaMin?: number;
  alphaDecay?: number;
  velocityDecay?: number;
  centerStrength?: number;

  // Hierarchical specific
  direction?: 'TB' | 'BT' | 'LR' | 'RL';
  levelSeparation?: number;
  nodeSeparation?: number;

  // Circular specific
  startAngle?: number;
  endAngle?: number;
  radius?: number;

  // Grid specific
  rows?: number;
  columns?: number;
  cellPadding?: number;

  // Similarity-based clustering
  similarityFunction?: (a: Node, b: Node) => number;
  similarityThreshold?: number;
}

export interface LayoutResult {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  bounds: BoundingBox;
  metadata?: Record<string, any>;
}

export interface PositionedNode extends Node {
  x: number;
  y: number;
  z?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface PositionedEdge extends Edge {
  source: PositionedNode | string;
  target: PositionedNode | string;
  controlPoints?: Point[];
}

export interface LayoutPositions {
  nodes: NodePosition[];
  edges: EdgePosition[];
}

export interface NodePosition {
  id: string;
  x: number;
  y: number;
  z?: number;
}

export interface EdgePosition {
  source: Point;
  target: Point;
  controlPoints?: Point[];
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface LayoutUpdate {
  nodes?: NodePosition[];
  edges?: EdgePosition[];
  partial?: boolean;
}

/**
 * Manages layout calculations and force simulations for graph visualization.
 *
 * @remarks
 * The LayoutEngine is responsible for calculating node and edge positions
 * using various layout algorithms. It supports force-directed, hierarchical,
 * circular, grid, and radial layouts. The engine is purely focused on
 * position calculation without any rendering concerns.
 *
 * @example
 * ```typescript
 * const layoutEngine = new LayoutEngine('force-directed', {
 *   width: 800,
 *   height: 600,
 *   chargeStrength: -300
 * });
 *
 * const result = await layoutEngine.calculateLayout(graphData);
 * ```
 */
export class LayoutEngine extends EventEmitter {
  private algorithm: LayoutAlgorithm;
  private config: LayoutConfig;
  private simulation: d3.Simulation<d3.SimulationNodeDatum, undefined> | null = null;
  private initialAlpha: number = 1;
  private currentData: GraphData | null = null;

  constructor(algorithm: LayoutAlgorithm = 'force-directed', config?: Partial<LayoutConfig>) {
    super();
    this.algorithm = algorithm;
    this.config = this.mergeConfig(config);
  }

  private mergeConfig(config?: Partial<LayoutConfig>): LayoutConfig {
    const defaults: LayoutConfig = {
      width: 800,
      height: 600,
      padding: 50,
      dimensions: 2,
      // Force-directed defaults
      linkDistance: 100,
      linkStrength: 1,
      chargeStrength: -300,
      chargeDistance: Infinity,
      collisionRadius: 20,
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,
      centerStrength: 0.1,
      // Hierarchical defaults
      direction: 'TB',
      levelSeparation: 100,
      nodeSeparation: 50,
      // Circular defaults
      startAngle: 0,
      endAngle: 2 * Math.PI,
      radius: 200,
      // Grid defaults
      rows: 5,
      columns: 5,
      cellPadding: 10
    };

    return { ...defaults, ...config };
  }

  /**
   * Calculate layout for the given graph data
   */
  async calculateLayout(data: GraphData): Promise<LayoutResult> {
    this.currentData = data;
    this.emit('layoutStart');

    return new Promise((resolve) => {
      switch (this.algorithm) {
        case 'force-directed':
          this.calculateForceLayout(data, resolve);
          break;
        case 'hierarchical':
          resolve(this.calculateHierarchicalLayout(data));
          break;
        case 'circular':
          resolve(this.calculateCircularLayout(data));
          break;
        case 'grid':
          resolve(this.calculateGridLayout(data));
          break;
        case 'radial':
          resolve(this.calculateRadialLayout(data));
          break;
        default:
          resolve(this.calculateForceLayout(data, resolve));
      }
    });
  }

  /**
   * Update layout with partial changes
   */
  updateLayout(updates: LayoutUpdate): void {
    if (!this.currentData) return;

    if (updates.nodes) {
      updates.nodes.forEach(nodePos => {
        const node = this.currentData?.nodes.find(n => n.id === nodePos.id);
        if (node) {
          (node as any).x = nodePos.x;
          (node as any).y = nodePos.y;
          if (nodePos.z !== undefined) {
            (node as any).z = nodePos.z;
          }
        }
      });
    }

    this.emit('positions', this.getCurrentPositions());
  }

  /**
   * Force-directed layout calculation
   */
  private calculateForceLayout(data: GraphData, resolve: (result: LayoutResult) => void): void {
    const { width, height, linkDistance, linkStrength, chargeStrength, chargeDistance,
            collisionRadius, alpha, alphaMin, alphaDecay, velocityDecay, centerStrength,
            dimensions, similarityFunction, similarityThreshold } = this.config;

    // Create nodes with positions
    const nodes = data.nodes.map(node => ({
      ...node,
      x: (node as any).x ?? Math.random() * width,
      y: (node as any).y ?? Math.random() * height,
      z: dimensions === 3 ? ((node as any).z ?? Math.random() * Math.min(width, height)) : undefined
    }));

    // Initialize simulation
    this.simulation = d3.forceSimulation(nodes as d3.SimulationNodeDatum[])
      .alpha(alpha!)
      .alphaMin(alphaMin!)
      .alphaDecay(alphaDecay!)
      .velocityDecay(velocityDecay!);

    // Add link force
    const linkForce = d3.forceLink(data.edges)
      .id((d: any) => d.id)
      .distance((edge: any) => {
        if (typeof linkDistance === 'function') {
          return linkDistance(edge);
        }
        return linkDistance!;
      })
      .strength((edge: any) => {
        if (typeof linkStrength === 'function') {
          return linkStrength(edge);
        }
        return linkStrength!;
      });

    this.simulation.force('link', linkForce);

    // Add charge force
    const chargeForce = d3.forceManyBody()
      .strength((node: any) => {
        if (typeof chargeStrength === 'function') {
          return chargeStrength(node);
        }
        return chargeStrength!;
      })
      .distanceMax(chargeDistance!);

    this.simulation.force('charge', chargeForce);

    // Add center force
    this.simulation.force('center', d3.forceCenter(width / 2, height / 2).strength(centerStrength!));

    // Add collision force
    const collisionForce = d3.forceCollide()
      .radius((node: any) => {
        if (typeof collisionRadius === 'function') {
          return collisionRadius(node);
        }
        return collisionRadius!;
      });

    this.simulation.force('collision', collisionForce);

    // Add similarity clustering if provided
    if (similarityFunction && similarityThreshold) {
      this.addSimilarityForce(nodes, similarityFunction, similarityThreshold);
    }

    this.initialAlpha = this.simulation.alpha();

    // Track progress
    this.simulation.on('tick', () => {
      const alpha = this.simulation?.alpha() ?? 0;
      const progress = Math.min(99, Math.round((1 - alpha / this.initialAlpha) * 100));

      // Update original data nodes with current simulation positions
      nodes.forEach((simNode, index) => {
        if (data.nodes[index]) {
          (data.nodes[index] as any).x = simNode.x;
          (data.nodes[index] as any).y = simNode.y;
          (data.nodes[index] as any).vx = simNode.vx;
          (data.nodes[index] as any).vy = simNode.vy;
        }
      });

      this.emit('layoutProgress', progress);
      this.emit('positions', this.getCurrentPositions());
    });

    // Resolve when stable
    this.simulation.on('end', () => {
      // Update original data nodes with simulation results
      nodes.forEach((simNode, index) => {
        if (data.nodes[index]) {
          (data.nodes[index] as any).x = simNode.x;
          (data.nodes[index] as any).y = simNode.y;
          (data.nodes[index] as any).z = simNode.z;
          (data.nodes[index] as any).vx = simNode.vx;
          (data.nodes[index] as any).vy = simNode.vy;
          (data.nodes[index] as any).fx = simNode.fx;
          (data.nodes[index] as any).fy = simNode.fy;
        }
      });

      this.emit('stable');
      this.emit('layoutEnd', this.createLayoutResult(data));
      resolve(this.createLayoutResult(data));
    });
  }

  /**
   * Add custom similarity-based clustering force
   */
  private addSimilarityForce(
    nodes: any[],
    similarityFunction: (a: Node, b: Node) => number,
    threshold: number
  ): void {
    if (!this.simulation) return;

    const similarityForce = (alpha: number) => {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const similarity = similarityFunction(nodes[i], nodes[j]);
          if (similarity > threshold) {
            const dx = nodes[j].x - nodes[i].x;
            const dy = nodes[j].y - nodes[i].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
              const force = alpha * similarity * 0.1;
              const fx = (dx / distance) * force;
              const fy = (dy / distance) * force;

              nodes[i].vx += fx;
              nodes[i].vy += fy;
              nodes[j].vx -= fx;
              nodes[j].vy -= fy;
            }
          }
        }
      }
    };

    this.simulation.force('similarity', similarityForce);
  }

  /**
   * Hierarchical layout calculation
   */
  private calculateHierarchicalLayout(data: GraphData): LayoutResult {
    const { width, height, direction, levelSeparation, nodeSeparation } = this.config;

    // Create hierarchy from edges
    const levels = this.calculateNodeLevels(data);
    const maxLevel = Math.max(...Array.from(levels.values()));

    // Position nodes based on levels
    const levelGroups = new Map<number, Node[]>();
    data.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level)!.push(node);
    });

    // Calculate positions
    const positionedNodes: PositionedNode[] = [];

    levelGroups.forEach((nodes, level) => {
      const isHorizontal = direction === 'LR' || direction === 'RL';
      const isReversed = direction === 'BT' || direction === 'RL';

      const primaryAxis = isHorizontal ? height : width;
      const secondaryAxis = isHorizontal ? width : height;

      const levelPosition = isReversed
        ? (maxLevel - level) * levelSeparation!
        : level * levelSeparation!;

      const spacing = primaryAxis / (nodes.length + 1);

      nodes.forEach((node, index) => {
        const position = (index + 1) * spacing;

        positionedNodes.push({
          ...node,
          x: isHorizontal ? levelPosition : position,
          y: isHorizontal ? position : levelPosition
        });
      });
    });

    // Process edges
    const positionedEdges = data.edges.map(edge => ({
      ...edge
    }));

    return {
      nodes: positionedNodes,
      edges: positionedEdges,
      bounds: this.calculateBounds(positionedNodes)
    };
  }

  /**
   * Circular layout calculation
   */
  private calculateCircularLayout(data: GraphData): LayoutResult {
    const { width, height, startAngle, endAngle, radius: configRadius } = this.config;

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = configRadius || Math.min(width, height) / 2 - 50;

    const angleRange = endAngle! - startAngle!;
    const angleStep = angleRange / Math.max(1, data.nodes.length - (angleRange === 2 * Math.PI ? 0 : 1));

    const positionedNodes: PositionedNode[] = data.nodes.map((node, index) => {
      const angle = startAngle! + index * angleStep;
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });

    const positionedEdges = data.edges.map(edge => ({
      ...edge
    }));

    return {
      nodes: positionedNodes,
      edges: positionedEdges,
      bounds: this.calculateBounds(positionedNodes)
    };
  }

  /**
   * Grid layout calculation
   */
  private calculateGridLayout(data: GraphData): LayoutResult {
    const { width, height, rows, columns, cellPadding } = this.config;

    const actualRows = rows || Math.ceil(Math.sqrt(data.nodes.length));
    const actualColumns = columns || Math.ceil(data.nodes.length / actualRows);

    const cellWidth = (width - cellPadding! * (actualColumns + 1)) / actualColumns;
    const cellHeight = (height - cellPadding! * (actualRows + 1)) / actualRows;

    const positionedNodes: PositionedNode[] = data.nodes.map((node, index) => {
      const row = Math.floor(index / actualColumns);
      const col = index % actualColumns;

      return {
        ...node,
        x: cellPadding! + col * (cellWidth + cellPadding!) + cellWidth / 2,
        y: cellPadding! + row * (cellHeight + cellPadding!) + cellHeight / 2
      };
    });

    const positionedEdges = data.edges.map(edge => ({
      ...edge
    }));

    return {
      nodes: positionedNodes,
      edges: positionedEdges,
      bounds: this.calculateBounds(positionedNodes)
    };
  }

  /**
   * Radial layout calculation
   */
  private calculateRadialLayout(data: GraphData): LayoutResult {
    const { width, height } = this.config;
    const centerX = width / 2;
    const centerY = height / 2;

    // Find central nodes (highest degree)
    const degrees = new Map<string, number>();
    data.edges.forEach(edge => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
      degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1);
      degrees.set(targetId, (degrees.get(targetId) || 0) + 1);
    });

    // Sort nodes by degree
    const sortedNodes = [...data.nodes].sort((a, b) =>
      (degrees.get(b.id) || 0) - (degrees.get(a.id) || 0)
    );

    // Calculate rings
    const rings = this.calculateRings(sortedNodes, degrees);
    const maxRing = Math.max(...Array.from(rings.values()));
    const ringRadius = Math.min(width, height) / (2 * (maxRing + 1));

    // Position nodes
    const ringGroups = new Map<number, Node[]>();
    sortedNodes.forEach(node => {
      const ring = rings.get(node.id) || 0;
      if (!ringGroups.has(ring)) {
        ringGroups.set(ring, []);
      }
      ringGroups.get(ring)!.push(node);
    });

    const positionedNodes: PositionedNode[] = [];

    ringGroups.forEach((nodes, ring) => {
      const radius = ring * ringRadius;
      const angleStep = (2 * Math.PI) / nodes.length;

      nodes.forEach((node, index) => {
        const angle = index * angleStep;
        positionedNodes.push({
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      });
    });

    const positionedEdges = data.edges.map(edge => ({
      ...edge
    }));

    return {
      nodes: positionedNodes,
      edges: positionedEdges,
      bounds: this.calculateBounds(positionedNodes)
    };
  }

  /**
   * Calculate node levels for hierarchical layout
   */
  private calculateNodeLevels(data: GraphData): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();

    // Find root nodes (no incoming edges)
    const hasIncoming = new Set<string>();
    data.edges.forEach(edge => {
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;
      hasIncoming.add(targetId);
    });

    const roots = data.nodes.filter(node => !hasIncoming.has(node.id));

    // BFS to assign levels
    const queue: { node: Node; level: number }[] = [];
    roots.forEach(node => {
      queue.push({ node, level: 0 });
      levels.set(node.id, 0);
      visited.add(node.id);
    });

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;

      data.edges.forEach(edge => {
        const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
        const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

        if (sourceId === node.id && !visited.has(targetId)) {
          const targetNode = data.nodes.find(n => n.id === targetId);
          if (targetNode) {
            queue.push({ node: targetNode, level: level + 1 });
            levels.set(targetId, level + 1);
            visited.add(targetId);
          }
        }
      });
    }

    // Assign level 0 to unvisited nodes
    data.nodes.forEach(node => {
      if (!levels.has(node.id)) {
        levels.set(node.id, 0);
      }
    });

    return levels;
  }

  /**
   * Calculate rings for radial layout
   */
  private calculateRings(nodes: Node[], degrees: Map<string, number>): Map<string, number> {
    const rings = new Map<string, number>();

    if (nodes.length === 0) return rings;

    // Place highest degree node at center
    rings.set(nodes[0].id, 0);

    // Place other nodes based on degree
    for (let i = 1; i < nodes.length; i++) {
      const degree = degrees.get(nodes[i].id) || 0;
      const ring = Math.ceil(Math.log2(i + 1));
      rings.set(nodes[i].id, ring);
    }

    return rings;
  }

  /**
   * Get current positions
   */
  private getCurrentPositions(): LayoutPositions {
    if (!this.currentData) {
      return { nodes: [], edges: [] };
    }

    const nodePositions: NodePosition[] = this.currentData.nodes.map(node => ({
      id: node.id,
      x: (node as any).x ?? 0,
      y: (node as any).y ?? 0,
      z: (node as any).z
    }));

    const edgePositions: EdgePosition[] = this.currentData.edges.map(edge => {
      const source = this.getNodePosition(edge.source, this.currentData!.nodes);
      const target = this.getNodePosition(edge.target, this.currentData!.nodes);

      return {
        source,
        target
      };
    });

    return { nodes: nodePositions, edges: edgePositions };
  }

  /**
   * Create final layout result
   */
  private createLayoutResult(data: GraphData): LayoutResult {
    const positionedNodes: PositionedNode[] = data.nodes.map(node => ({
      ...node,
      x: (node as any).x ?? 0,
      y: (node as any).y ?? 0,
      z: (node as any).z,
      vx: (node as any).vx,
      vy: (node as any).vy,
      fx: (node as any).fx,
      fy: (node as any).fy
    }));

    const positionedEdges: PositionedEdge[] = data.edges.map(edge => ({
      ...edge,
      source: edge.source,
      target: edge.target
    }));

    return {
      nodes: positionedNodes,
      edges: positionedEdges,
      bounds: this.calculateBounds(positionedNodes)
    };
  }

  /**
   * Calculate bounding box
   */
  private calculateBounds(nodes: PositionedNode[]): BoundingBox {
    if (nodes.length === 0) {
      return {
        minX: 0,
        minY: 0,
        maxX: this.config.width,
        maxY: this.config.height,
        width: this.config.width,
        height: this.config.height
      };
    }

    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);

    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Get node position
   */
  private getNodePosition(nodeOrId: any, nodes: Node[]): Point {
    if (typeof nodeOrId === 'string') {
      const node = nodes.find(n => n.id === nodeOrId);
      return {
        x: (node as any)?.x ?? 0,
        y: (node as any)?.y ?? 0,
        z: (node as any)?.z
      };
    }
    return {
      x: nodeOrId.x ?? 0,
      y: nodeOrId.y ?? 0,
      z: nodeOrId.z
    };
  }

  /**
   * Algorithm management
   */
  setAlgorithm(algorithm: LayoutAlgorithm): void {
    this.algorithm = algorithm;
    this.stopSimulation();
  }

  getAlgorithm(): LayoutAlgorithm {
    return this.algorithm;
  }

  getAvailableAlgorithms(): LayoutAlgorithm[] {
    return ['force-directed', 'hierarchical', 'circular', 'grid', 'radial'];
  }

  /**
   * Configuration management
   */
  setConfig(config: Partial<LayoutConfig>): void {
    this.config = this.mergeConfig(config);
  }

  getConfig(): LayoutConfig {
    return { ...this.config };
  }

  /**
   * Force simulation management
   */
  startSimulation(): void {
    this.simulation?.restart();
  }

  stopSimulation(): void {
    this.simulation?.stop();
  }

  restartSimulation(alpha?: number): void {
    if (this.simulation) {
      this.simulation.alpha(alpha ?? 1).restart();
    }
  }

  getSimulation(): d3.Simulation<d3.SimulationNodeDatum, undefined> | null {
    return this.simulation;
  }

  /**
   * Node positioning
   */
  setNodePosition(nodeId: string, x: number, y: number): void {
    if (!this.currentData) return;

    const node = this.currentData.nodes.find(n => n.id === nodeId);
    if (node) {
      (node as any).x = x;
      (node as any).y = y;
      this.emit('positions', this.getCurrentPositions());
    }
  }

  fixNodePosition(nodeId: string, x?: number, y?: number): void {
    if (!this.currentData) return;

    const node = this.currentData.nodes.find(n => n.id === nodeId);
    if (node) {
      (node as any).fx = x ?? (node as any).x;
      (node as any).fy = y ?? (node as any).y;
    }
  }

  releaseNodePosition(nodeId: string): void {
    if (!this.currentData) return;

    const node = this.currentData.nodes.find(n => n.id === nodeId);
    if (node) {
      (node as any).fx = null;
      (node as any).fy = null;
    }
  }

  /**
   * Update multiple node positions at once
   */
  updateNodePositions(positions: NodePosition[]): void {
    if (!this.currentData) return;

    positions.forEach(pos => {
      const node = this.currentData!.nodes.find(n => n.id === pos.id);
      if (node) {
        (node as any).x = pos.x;
        (node as any).y = pos.y;
        if (pos.z !== undefined) {
          (node as any).z = pos.z;
        }
      }
    });

    this.emit('positions', this.getCurrentPositions());
  }

  /**
   * Destroy the layout engine and clean up resources
   */
  destroy(): void {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    this.currentData = null;
    this.removeAllListeners();
  }
}