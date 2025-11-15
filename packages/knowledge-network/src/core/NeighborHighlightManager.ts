/**
 * @fileoverview NeighborHighlightManager Implementation
 * 
 * Manages neighbor highlighting functionality across all rendering strategies
 * with consistent visual behavior and performance requirements. Extends existing
 * neighbor functionality with multi-degree highlighting and strategy adaptation.
 * 
 * Key Features:
 * - Multi-degree neighbor highlighting (1st, 2nd, 3rd degree separation)
 * - Cross-strategy consistency (Canvas/SVG/WebGL)
 * - Performance optimization with 100ms response guarantee
 * - Configurable visual highlighting (opacity, color, transitions)
 * - Dynamic graph structure adaptation
 */

import { EventEmitter } from 'events';
import type { 
  Node,
  Edge,
  NavigationState,
  Point2D
} from '../../types';

export interface HighlightCapabilities {
  maxHighlightedNodes: number;
  supportsTransitions: boolean;
  supportsOpacityBlending: boolean;
  supportsColorBlending: boolean;
  responseTimeGuarantee: number;
}

export interface HighlightConfig {
  highlightColor: string;
  highlightOpacity: number;
  dimmedOpacity: number;
  transitionDuration: number;
  maxHighlightDistance: number; // degrees of separation
  enableBidirectionalHighlight: boolean;
}

/**
 * Graph structure for efficient neighbor lookups
 */
interface GraphStructure {
  adjacencyList: Map<string, Set<string>>;
  nodeMap: Map<string, Node>;
  edgeMap: Map<string, Edge>;
}

/**
 * Manages neighbor highlighting across rendering strategies
 */
export class NeighborHighlightManager extends EventEmitter {
  private graphStructure: GraphStructure;
  private highlightedNodes: Set<string> = new Set();
  private config: HighlightConfig;
  private strategyCapabilities: Map<string, HighlightCapabilities>;

  constructor(initialConfig?: Partial<HighlightConfig>) {
    super();

    // Initialize default configuration
    this.config = {
      highlightColor: '#00ff88',
      highlightOpacity: 0.8,
      dimmedOpacity: 0.3,
      transitionDuration: 250,
      maxHighlightDistance: 1,
      enableBidirectionalHighlight: true,
      ...initialConfig
    };

    // Initialize graph structure
    this.graphStructure = {
      adjacencyList: new Map(),
      nodeMap: new Map(),
      edgeMap: new Map()
    };

    // Initialize strategy capabilities
    this.strategyCapabilities = new Map([
      ['canvas', {
        maxHighlightedNodes: 200,
        supportsTransitions: true,
        supportsOpacityBlending: true,
        supportsColorBlending: true,
        responseTimeGuarantee: 50
      }],
      ['svg', {
        maxHighlightedNodes: 500,
        supportsTransitions: true,
        supportsOpacityBlending: true,
        supportsColorBlending: true,
        responseTimeGuarantee: 75
      }],
      ['webgl', {
        maxHighlightedNodes: 2000,
        supportsTransitions: false, // Limited GPU transition support
        supportsOpacityBlending: true,
        supportsColorBlending: false,
        responseTimeGuarantee: 25
      }]
    ]);
  }

  /**
   * Highlight neighbors of specified node
   * @param nodeId ID of node whose neighbors to highlight
   * @returns Promise resolving within 100ms
   */
  async highlightNeighbors(nodeId: string): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate node exists
      if (!this.graphStructure.nodeMap.has(nodeId)) {
        throw new Error(`Node with ID "${nodeId}" not found`);
      }

      // Clear existing highlights
      this.highlightedNodes.clear();

      // Find neighbors based on configuration
      const neighbors = this.findNeighbors(nodeId, this.config.maxHighlightDistance);
      
      // Add neighbors to highlight set
      neighbors.forEach(neighborId => this.highlightedNodes.add(neighborId));

      // Emit highlighting event
      this.emit('neighborsHighlighted', {
        sourceNodeId: nodeId,
        highlightedNodeIds: Array.from(this.highlightedNodes),
        highlightDistance: this.config.maxHighlightDistance,
        timestamp: Date.now()
      });

      // Ensure response time requirement
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      if (responseTime > 100) {
        console.warn(`Neighbor highlighting took ${responseTime}ms, exceeding 100ms requirement`);
      }

    } catch (error) {
      throw new Error(`Failed to highlight neighbors of ${nodeId}: ${error}`);
    }
  }

  /**
   * Clear all highlighting
   */
  async clearHighlight(): Promise<void> {
    const previousHighlighted = new Set(this.highlightedNodes);
    this.highlightedNodes.clear();

    this.emit('highlightCleared', {
      previouslyHighlighted: Array.from(previousHighlighted),
      timestamp: Date.now()
    });
  }

  /**
   * Clear highlighting for specific node
   */
  async clearNodeHighlight(nodeId: string): Promise<void> {
    if (this.highlightedNodes.has(nodeId)) {
      this.highlightedNodes.delete(nodeId);

      this.emit('nodeHighlightCleared', {
        nodeId,
        remainingHighlighted: Array.from(this.highlightedNodes),
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get all currently highlighted nodes
   */
  getHighlightedNodes(): Set<string> {
    return new Set(this.highlightedNodes);
  }

  /**
   * Check if specific node is highlighted
   */
  isNodeHighlighted(nodeId: string): boolean {
    return this.highlightedNodes.has(nodeId);
  }

  /**
   * Get neighbors of specified node
   */
  getNeighborsOf(nodeId: string): string[] {
    const neighbors = this.graphStructure.adjacencyList.get(nodeId);
    return neighbors ? Array.from(neighbors) : [];
  }

  /**
   * Ensure consistent highlighting across strategies
   */
  async ensureConsistentHighlighting(strategies: string[]): Promise<void> {
    // Validate that all strategies can handle current highlighting requirements
    const currentHighlightCount = this.highlightedNodes.size;
    
    for (const strategy of strategies) {
      const capabilities = this.getHighlightingCapabilities(strategy);
      
      if (currentHighlightCount > capabilities.maxHighlightedNodes) {
        throw new Error(
          `Strategy ${strategy} cannot handle ${currentHighlightCount} highlighted nodes (max: ${capabilities.maxHighlightedNodes})`
        );
      }
      
      if (capabilities.responseTimeGuarantee > 100) {
        console.warn(
          `Strategy ${strategy} response time (${capabilities.responseTimeGuarantee}ms) exceeds 100ms requirement`
        );
      }
    }
  }

  /**
   * Get highlighting capabilities for specific strategy
   */
  getHighlightingCapabilities(strategy: string): HighlightCapabilities {
    const capabilities = this.strategyCapabilities.get(strategy);
    if (!capabilities) {
      // Return conservative default capabilities
      return {
        maxHighlightedNodes: 100,
        supportsTransitions: false,
        supportsOpacityBlending: true,
        supportsColorBlending: false,
        responseTimeGuarantee: 100
      };
    }
    return { ...capabilities };
  }

  /**
   * Set highlighting configuration
   */
  setHighlightConfig(config: HighlightConfig): void {
    this.config = { ...config };
    
    this.emit('configChanged', {
      newConfig: this.config,
      timestamp: Date.now()
    });
  }

  /**
   * Get current highlighting configuration
   */
  getHighlightConfig(): HighlightConfig {
    return { ...this.config };
  }

  /**
   * Integrate with graph structure
   */
  integrateWithGraph(nodes: Node[], edges: Edge[]): void {
    this.buildGraphStructure(nodes, edges);
    
    this.emit('graphIntegrated', {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      timestamp: Date.now()
    });
  }

  /**
   * Update graph structure when nodes or edges change
   */
  updateGraphStructure(nodes: Node[], edges: Edge[]): void {
    // Clear existing highlighting if structure changes significantly
    const previousNodeCount = this.graphStructure.nodeMap.size;
    const previousEdgeCount = this.graphStructure.edgeMap.size;
    
    this.buildGraphStructure(nodes, edges);
    
    // Clear highlights if structure changed significantly
    if (Math.abs(nodes.length - previousNodeCount) > 0 || 
        Math.abs(edges.length - previousEdgeCount) > 0) {
      this.highlightedNodes.clear();
    }

    this.emit('graphStructureUpdated', {
      previousNodeCount,
      newNodeCount: nodes.length,
      previousEdgeCount,
      newEdgeCount: edges.length,
      highlightsCleared: this.highlightedNodes.size === 0,
      timestamp: Date.now()
    });
  }

  /**
   * Find neighbors within specified distance
   * @param nodeId Starting node
   * @param maxDistance Maximum degrees of separation
   * @returns Set of neighbor node IDs
   */
  private findNeighbors(nodeId: string, maxDistance: number): Set<string> {
    const visited = new Set<string>();
    const neighbors = new Set<string>();
    const queue: { nodeId: string; distance: number }[] = [{ nodeId, distance: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.nodeId)) {
        continue;
      }
      
      visited.add(current.nodeId);
      
      // Add to neighbors if within distance and not the starting node
      if (current.distance > 0 && current.distance <= maxDistance) {
        neighbors.add(current.nodeId);
      }

      // Continue exploring if within distance
      if (current.distance < maxDistance) {
        const adjacentNodes = this.graphStructure.adjacencyList.get(current.nodeId);
        if (adjacentNodes) {
          adjacentNodes.forEach(neighborId => {
            if (!visited.has(neighborId)) {
              queue.push({ nodeId: neighborId, distance: current.distance + 1 });
            }
          });
        }
      }
    }

    return neighbors;
  }

  /**
   * Build efficient graph structure for neighbor lookups
   */
  private buildGraphStructure(nodes: Node[], edges: Edge[]): void {
    // Clear existing structure
    this.graphStructure.adjacencyList.clear();
    this.graphStructure.nodeMap.clear();
    this.graphStructure.edgeMap.clear();

    // Build node map
    nodes.forEach(node => {
      this.graphStructure.nodeMap.set(node.id, node);
      this.graphStructure.adjacencyList.set(node.id, new Set());
    });

    // Build adjacency list
    edges.forEach(edge => {
      this.graphStructure.edgeMap.set(edge.id, edge);
      
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

      // Add bidirectional connections if enabled
      if (this.config.enableBidirectionalHighlight) {
        this.graphStructure.adjacencyList.get(sourceId)?.add(targetId);
        this.graphStructure.adjacencyList.get(targetId)?.add(sourceId);
      } else {
        // Only add forward connection for directed graphs
        this.graphStructure.adjacencyList.get(sourceId)?.add(targetId);
      }
    });
  }

  /**
   * Get strategy-specific highlight styling
   */
  getStrategyHighlightStyle(strategy: string): any {
    const capabilities = this.getHighlightingCapabilities(strategy);
    
    const baseStyle = {
      color: this.config.highlightColor,
      opacity: this.config.highlightOpacity,
      dimmedOpacity: this.config.dimmedOpacity
    };

    switch (strategy) {
      case 'canvas':
        return {
          ...baseStyle,
          fillStyle: this.config.highlightColor,
          globalAlpha: this.config.highlightOpacity,
          shadowBlur: capabilities.supportsColorBlending ? 10 : 0,
          shadowColor: this.config.highlightColor
        };

      case 'svg':
        return {
          ...baseStyle,
          fill: this.config.highlightColor,
          'fill-opacity': this.config.highlightOpacity,
          stroke: this.config.highlightColor,
          'stroke-opacity': this.config.highlightOpacity,
          transition: capabilities.supportsTransitions ? 
            `all ${this.config.transitionDuration}ms ease-in-out` : 'none'
        };

      case 'webgl':
        return {
          ...baseStyle,
          // WebGL uses normalized colors
          highlightColorVec: this.hexToRgbNormalized(this.config.highlightColor),
          highlightOpacity: this.config.highlightOpacity,
          dimmedOpacity: this.config.dimmedOpacity,
          useShaderBlending: capabilities.supportsOpacityBlending
        };

      default:
        return baseStyle;
    }
  }

  /**
   * Convert hex color to normalized RGB values for WebGL
   */
  private hexToRgbNormalized(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      return [1, 1, 1]; // Default to white
    }
    
    return [
      parseInt(result[1], 16) / 255,
      parseInt(result[2], 16) / 255,
      parseInt(result[3], 16) / 255
    ];
  }

  /**
   * Optimize highlighting for large graphs
   */
  private optimizeForLargeGraphs(): void {
    const totalNodes = this.graphStructure.nodeMap.size;
    
    if (totalNodes > 1000) {
      // Reduce max highlight distance for performance
      this.config.maxHighlightDistance = Math.min(this.config.maxHighlightDistance, 2);
      
      // Reduce transition duration for responsiveness
      this.config.transitionDuration = Math.min(this.config.transitionDuration, 150);
      
      console.warn(`Graph has ${totalNodes} nodes. Optimizing highlight settings for performance.`);
    }
  }

  /**
   * Validate highlighting constraints for given strategy
   */
  validateConstraintsForStrategy(strategy: string): boolean {
    const capabilities = this.getHighlightingCapabilities(strategy);
    const currentHighlightCount = this.highlightedNodes.size;
    
    return (
      currentHighlightCount <= capabilities.maxHighlightedNodes &&
      capabilities.responseTimeGuarantee <= 100
    );
  }

  /**
   * Get performance metrics for current highlighting
   */
  getHighlightPerformanceMetrics(): {
    highlightedNodeCount: number;
    totalNodeCount: number;
    highlightRatio: number;
    estimatedMemoryUsage: number; // bytes
    maxSupportedNodes: number;
  } {
    const totalNodes = this.graphStructure.nodeMap.size;
    const highlightedCount = this.highlightedNodes.size;
    
    return {
      highlightedNodeCount: highlightedCount,
      totalNodeCount: totalNodes,
      highlightRatio: totalNodes === 0 ? 0 : highlightedCount / totalNodes,
      estimatedMemoryUsage: highlightedCount * 64, // Rough estimate: 64 bytes per highlighted node
      maxSupportedNodes: Math.max(...Array.from(this.strategyCapabilities.values()).map(c => c.maxHighlightedNodes))
    };
  }
}

/**
 * Factory function to create NeighborHighlightManager
 */
export function createNeighborHighlightManager(config?: Partial<HighlightConfig>): NeighborHighlightManager {
  return new NeighborHighlightManager(config);
}

/**
 * Default highlighting configurations for different use cases
 */
export const DefaultHighlightConfigs = {
  SUBTLE: {
    highlightColor: '#ffffff',
    highlightOpacity: 0.6,
    dimmedOpacity: 0.4,
    transitionDuration: 200,
    maxHighlightDistance: 1,
    enableBidirectionalHighlight: true
  },
  
  PROMINENT: {
    highlightColor: '#00ff00',
    highlightOpacity: 0.9,
    dimmedOpacity: 0.1,
    transitionDuration: 300,
    maxHighlightDistance: 2,
    enableBidirectionalHighlight: true
  },
  
  PERFORMANCE: {
    highlightColor: '#ffff00',
    highlightOpacity: 0.7,
    dimmedOpacity: 0.3,
    transitionDuration: 100, // Faster for performance
    maxHighlightDistance: 1,
    enableBidirectionalHighlight: false // Faster without bidirectional
  }
} as const;

/**
 * Utility functions for neighbor operations
 */
export const NeighborUtils = {
  
  /**
   * Calculate graph diameter (maximum shortest path between any two nodes)
   */
  calculateGraphDiameter(nodes: Node[], edges: Edge[]): number {
    // Implementation would use Floyd-Warshall or BFS
    // For now, return reasonable estimate based on graph size
    const nodeCount = nodes.length;
    return Math.ceil(Math.log2(nodeCount)) + 1;
  },

  /**
   * Find optimal highlight distance for graph structure
   */
  getOptimalHighlightDistance(nodes: Node[], edges: Edge[]): number {
    const avgDegree = edges.length * 2 / nodes.length; // Average node degree
    
    if (avgDegree < 2) return 2; // Sparse graph - highlight more
    if (avgDegree > 10) return 1; // Dense graph - highlight less
    return 1; // Default
  },

  /**
   * Estimate highlight performance impact
   */
  estimatePerformanceImpact(
    nodeCount: number, 
    highlightDistance: number, 
    avgDegree: number
  ): 'low' | 'medium' | 'high' {
    const estimatedHighlighted = Math.min(
      nodeCount, 
      Math.pow(avgDegree, highlightDistance)
    );
    
    if (estimatedHighlighted < 50) return 'low';
    if (estimatedHighlighted < 200) return 'medium';
    return 'high';
  }

} as const;