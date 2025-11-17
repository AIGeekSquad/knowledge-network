/**
 * @fileoverview LayoutCalculator - Factory for creating immutable LayoutNode structures
 * 
 * Provides LayoutNode factory methods and immutable wrapper system that maintains
 * strict separation between original node data and layout-specific metadata.
 */

import { 
  Node,
  EnhancedLayoutNode,
  Position3D,
  NodeImportance,
  LayoutNodeMetadata,
  NodeConvergenceState,
  LayoutPhase,
  ClusterAssignment
} from '../types';

/**
 * LayoutCalculator creates immutable LayoutNode wrappers from original nodes
 */
export class LayoutCalculator {
  private static idCounter = 0;

  /**
   * Create LayoutNode from original node with immutable reference
   */
  public static createLayoutNode(
    originalNode: Node,
    initialPosition?: Position3D,
    config?: { 
      generateId?: (node: Node) => string;
      calculateImportance?: (node: Node) => NodeImportance;
    }
  ): EnhancedLayoutNode {
    // Generate unique layout ID
    const layoutId = config?.generateId ? 
      config.generateId(originalNode) : 
      this.generateDefaultId(originalNode);

    // Calculate node importance
    const importance = config?.calculateImportance ?
      config.calculateImportance(originalNode) :
      this.calculateDefaultImportance(originalNode);

    // Create immutable LayoutNode wrapper
    const layoutNode: EnhancedLayoutNode = {
      id: layoutId,
      originalNode: Object.freeze({ ...originalNode }), // Immutable reference
      position: initialPosition || this.generateInitialPosition(),
      cluster: undefined, // Will be assigned during clustering
      similarityScores: new Map<string, number>(),
      convergenceState: this.createInitialConvergenceState(),
      importance,
      metadata: this.createInitialMetadata()
    };

    return Object.freeze(layoutNode); // Immutable wrapper
  }

  /**
   * Create batch of LayoutNodes from node array
   */
  public static createLayoutNodes(
    nodes: Node[],
    positions?: Position3D[],
    config?: {
      generateId?: (node: Node, index: number) => string;
      calculateImportance?: (node: Node, allNodes: Node[]) => NodeImportance;
      spatialConstraints?: { width: number; height: number; depth?: number };
    }
  ): EnhancedLayoutNode[] {
    if (positions && positions.length !== nodes.length) {
      throw new Error('Position array length must match nodes array length');
    }

    return nodes.map((node, index) => {
      const position = positions ? positions[index] : 
        this.generateConstrainedPosition(config?.spatialConstraints);
      
      const importance = config?.calculateImportance ?
        config.calculateImportance(node, nodes) :
        this.calculateDefaultImportance(node);

      const layoutId = config?.generateId ?
        config.generateId(node, index) :
        this.generateDefaultId(node);

      return this.createLayoutNode(node, position, {
        generateId: () => layoutId,
        calculateImportance: () => importance
      });
    });
  }

  /**
   * Update LayoutNode with new position while preserving immutability
   */
  public static updatePosition(
    layoutNode: EnhancedLayoutNode,
    newPosition: Position3D,
    preserveHistory: boolean = true
  ): EnhancedLayoutNode {
    // Calculate position delta for convergence tracking
    const positionDelta = this.calculatePositionDelta(layoutNode.position, newPosition);
    
    // Update convergence state
    const updatedConvergenceState = this.updateConvergenceState(
      layoutNode.convergenceState,
      positionDelta,
      preserveHistory
    );

    // Create new immutable LayoutNode
    const updatedNode: EnhancedLayoutNode = {
      ...layoutNode,
      position: newPosition,
      convergenceState: updatedConvergenceState,
      metadata: {
        ...layoutNode.metadata,
        lastUpdated: Date.now(),
        isStable: positionDelta < 0.01 // Stability threshold
      }
    };

    return Object.freeze(updatedNode);
  }

  /**
   * Assign cluster to LayoutNode
   */
  public static assignCluster(
    layoutNode: EnhancedLayoutNode,
    cluster: ClusterAssignment
  ): EnhancedLayoutNode {
    const updatedNode: EnhancedLayoutNode = {
      ...layoutNode,
      cluster,
      metadata: {
        ...layoutNode.metadata,
        lastUpdated: Date.now()
      }
    };

    return Object.freeze(updatedNode);
  }

  /**
   * Update similarity scores for LayoutNode
   */
  public static updateSimilarityScores(
    layoutNode: EnhancedLayoutNode,
    similarities: Map<string, number>
  ): EnhancedLayoutNode {
    // Merge with existing scores
    const updatedScores = new Map([
      ...layoutNode.similarityScores.entries(),
      ...similarities.entries()
    ]);

    const updatedNode: EnhancedLayoutNode = {
      ...layoutNode,
      similarityScores: updatedScores,
      metadata: {
        ...layoutNode.metadata,
        lastUpdated: Date.now()
      }
    };

    return Object.freeze(updatedNode);
  }

  /**
   * Batch update multiple LayoutNodes
   */
  public static batchUpdate(
    layoutNodes: EnhancedLayoutNode[],
    updates: Array<{
      nodeId: string;
      position?: Position3D;
      cluster?: ClusterAssignment;
      similarities?: Map<string, number>;
    }>
  ): EnhancedLayoutNode[] {
    const nodeMap = new Map(layoutNodes.map(node => [node.id, node]));
    
    // Apply updates
    for (const update of updates) {
      const existing = nodeMap.get(update.nodeId);
      if (existing) {
        let updated = existing;
        
        if (update.position) {
          updated = this.updatePosition(updated, update.position);
        }
        
        if (update.cluster) {
          updated = this.assignCluster(updated, update.cluster);
        }
        
        if (update.similarities) {
          updated = this.updateSimilarityScores(updated, update.similarities);
        }
        
        nodeMap.set(update.nodeId, updated);
      }
    }

    return Array.from(nodeMap.values());
  }

  /**
   * Validate LayoutNode data integrity
   */
  public static validateLayoutNode(layoutNode: EnhancedLayoutNode): boolean {
    try {
      // Validate required fields
      if (!layoutNode.id || !layoutNode.originalNode || !layoutNode.position) {
        return false;
      }

      // Validate position coordinates are finite
      const pos = layoutNode.position;
      if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y) || !Number.isFinite(pos.z)) {
        return false;
      }

      // Validate importance metrics are in valid ranges
      const imp = layoutNode.importance;
      if (imp.composite < 0 || imp.composite > 1) {
        return false;
      }

      // Validate similarity scores are in [0, 1] range
      for (const [key, value] of layoutNode.similarityScores.entries()) {
        if (value < 0 || value > 1 || !Number.isFinite(value)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Private helper methods

  private static generateDefaultId(node: Node): string {
    return `layout-${node.id}-${Date.now()}-${this.idCounter++}`;
  }

  private static generateInitialPosition(): Position3D {
    return {
      x: Math.random() * 800,
      y: Math.random() * 600, 
      z: 0 // Default to 2D
    };
  }

  private static generateConstrainedPosition(
    constraints?: { width: number; height: number; depth?: number }
  ): Position3D {
    const bounds = constraints || { width: 800, height: 600, depth: 0 };
    
    return {
      x: Math.random() * bounds.width,
      y: Math.random() * bounds.height,
      z: bounds.depth ? Math.random() * bounds.depth : 0
    };
  }

  private static calculateDefaultImportance(node: Node): NodeImportance {
    // Simple heuristic-based importance calculation
    const connections = (node as any).connections || (node as any).degree || 1;
    const degree = Math.min(connections / 10, 1); // Normalize to [0, 1]
    
    // Placeholder calculations (in real implementation, would use graph topology)
    const betweenness = Math.random() * 0.5; // Conservative estimate
    const eigenvector = Math.random() * 0.5; // Conservative estimate
    
    const composite = 0.4 * degree + 0.3 * betweenness + 0.3 * eigenvector;

    return {
      degree: connections,
      betweenness,
      eigenvector, 
      composite
    };
  }

  private static createInitialConvergenceState(): NodeConvergenceState {
    return {
      isStable: false,
      positionDelta: 1.0, // High initial delta
      stabilityHistory: [1.0] // Track recent position changes
    };
  }

  private static createInitialMetadata(): LayoutNodeMetadata {
    return {
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      isStable: false,
      phase: LayoutPhase.COARSE,
      forceContributions: []
    };
  }

  private static calculatePositionDelta(previous: Position3D, current: Position3D): number {
    const dx = current.x - previous.x;
    const dy = current.y - previous.y;
    const dz = current.z - previous.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private static updateConvergenceState(
    current: NodeConvergenceState,
    positionDelta: number,
    preserveHistory: boolean
  ): NodeConvergenceState {
    const newHistory = preserveHistory ? 
      [...current.stabilityHistory.slice(-9), positionDelta] : // Keep last 10
      [positionDelta];

    const isStable = positionDelta < 0.01 && 
                     newHistory.slice(-3).every(delta => delta < 0.01);

    return {
      isStable,
      positionDelta,
      stabilityHistory: newHistory
    };
  }
}