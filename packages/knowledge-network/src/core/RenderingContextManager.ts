/**
 * Rendering Context Manager
 * 
 * Coordinates layout and rendering data handoff between LayoutEngine output
 * and rendering strategies. Manages the critical Map<string, LayoutNode> handoff
 * mechanism and ensures data consistency across the rendering pipeline.
 * 
 * Task: T030 [US2] - Create RenderingContextManager for coordinating layout and rendering data
 * 
 * Key Integration Points:
 * - Consumes Map<string, LayoutNode> from existing LayoutEngine
 * - Integrates EdgeLayout data from 003-edge-generator  
 * - Provides RenderingContext to all rendering strategies
 * - Coordinates with centralized progress reporting system
 */

import type { 
  RenderingContext, 
  RenderingConfig,
  ValidationResult
} from '../../rendering/rendering-strategy';
import type { LayoutNode } from '../../layout/layout-engine';
import { NavigationStateManager, type NavigationState } from './NavigationStateManager';

/**
 * Edge layout data structure from 003-edge-generator integration
 */
export interface EdgeLayout {
  /** Reference to source LayoutNode ID */
  sourceId: string;
  
  /** Reference to target LayoutNode ID */
  targetId: string;
  
  /** Pre-calculated compatibility scores for bundling optimization */
  compatibilityScores: Map<string, number>;
  
  /** Optional bundle assignment for edge bundling */
  bundleGroup?: string;
  
  /** Original edge data from input dataset */
  originalEdge: any;
}

/**
 * Context creation options
 */
export interface ContextCreationOptions {
  /** Whether to include performance constraints */
  includeConstraints: boolean;
  
  /** Whether to validate data integrity */
  validateData: boolean;
  
  /** Memory optimization settings */
  optimization: {
    enableCaching: boolean;
    maxCacheSize: number; // Number of contexts to cache
  };
}

/**
 * Context update result
 */
export interface ContextUpdateResult {
  success: boolean;
  updatedNodes: number;
  updatedEdges: number;
  validationErrors: string[];
  performanceMetrics: {
    updateTime: number;
    memoryUsage: number;
  };
}

/**
 * Rendering Context Manager
 * 
 * Manages the transformation of layout data into rendering contexts and
 * coordinates data handoff between pipeline stages. Ensures data consistency
 * and efficient context creation for all rendering strategies.
 */
export class RenderingContextManager {
  private navigationStateManager: NavigationStateManager;
  private contextCache: Map<string, RenderingContext> = new Map();
  private options: ContextCreationOptions;
  private performanceMetrics: {
    contextsCreated: number;
    averageCreationTime: number;
    memoryUsage: number;
  } = { contextsCreated: 0, averageCreationTime: 0, memoryUsage: 0 };

  constructor(
    navigationStateManager: NavigationStateManager,
    options?: Partial<ContextCreationOptions>
  ) {
    this.navigationStateManager = navigationStateManager;
    this.options = {
      includeConstraints: true,
      validateData: true,
      optimization: {
        enableCaching: true,
        maxCacheSize: 5 // Cache last 5 contexts for performance
      },
      ...options
    };
  }

  /**
   * Create rendering context from LayoutEngine output
   */
  public async createRenderingContextAsync(
    layoutNodes: Map<string, LayoutNode>,
    edges: EdgeLayout[],
    config: RenderingConfig,
    container: HTMLElement
  ): Promise<RenderingContext> {
    const startTime = performance.now();

    try {
      // Validate input data if enabled
      if (this.options.validateData) {
        this.validateLayoutData(layoutNodes, edges);
      }

      // Get current navigation state
      const navigationState = this.navigationStateManager.getState();

      // Create rendering context
      const context: RenderingContext = {
        nodes: layoutNodes, // Direct handoff of Map<string, LayoutNode>
        edges: edges,
        config: config,
        container: container,
        viewport: this.createViewportState(navigationState),
        constraints: this.options.includeConstraints ? this.createPerformanceConstraints(layoutNodes.size, edges.length) : undefined
      };

      // Cache context if enabled
      if (this.options.optimization.enableCaching) {
        this.cacheContext(context);
      }

      // Update performance metrics
      const creationTime = performance.now() - startTime;
      this.updatePerformanceMetrics(creationTime, this.estimateContextMemoryUsage(context));

      return context;

    } catch (error) {
      throw new Error(`Failed to create rendering context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update existing rendering context with new data
   */
  public async updateRenderingContextAsync(
    context: RenderingContext,
    updates: {
      layoutNodes?: Map<string, LayoutNode>;
      edges?: EdgeLayout[];
      config?: Partial<RenderingConfig>;
    }
  ): Promise<ContextUpdateResult> {
    const startTime = performance.now();
    let updatedNodes = 0;
    let updatedEdges = 0;
    const validationErrors: string[] = [];

    try {
      // Update nodes if provided
      if (updates.layoutNodes) {
        context.nodes = updates.layoutNodes;
        updatedNodes = updates.layoutNodes.size;
      }

      // Update edges if provided
      if (updates.edges) {
        context.edges = updates.edges;
        updatedEdges = updates.edges.length;
      }

      // Update configuration if provided
      if (updates.config) {
        context.config = { ...context.config, ...updates.config };
      }

      // Update viewport state from navigation manager
      const navigationState = this.navigationStateManager.getState();
      context.viewport = this.createViewportState(navigationState);

      // Validate updated context
      if (this.options.validateData) {
        const validation = this.validateRenderingContext(context);
        if (!validation.isValid) {
          validationErrors.push(...validation.errors.map(e => e.message));
        }
      }

      const updateTime = performance.now() - startTime;
      const memoryUsage = this.estimateContextMemoryUsage(context);

      return {
        success: validationErrors.length === 0,
        updatedNodes,
        updatedEdges,
        validationErrors,
        performanceMetrics: {
          updateTime,
          memoryUsage
        }
      };

    } catch (error) {
      validationErrors.push(error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        updatedNodes: 0,
        updatedEdges: 0,
        validationErrors,
        performanceMetrics: {
          updateTime: performance.now() - startTime,
          memoryUsage: 0
        }
      };
    }
  }

  /**
   * Get cached rendering context if available
   */
  public getCachedContext(cacheKey: string): RenderingContext | null {
    return this.contextCache.get(cacheKey) || null;
  }

  /**
   * Clear context cache
   */
  public clearCache(): void {
    this.contextCache.clear();
  }

  /**
   * Get performance statistics
   */
  public getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Validate Map<string, LayoutNode> data structure
   */
  private validateLayoutData(layoutNodes: Map<string, LayoutNode>, edges: EdgeLayout[]): void {
    // Validate Map structure
    if (!(layoutNodes instanceof Map)) {
      throw new Error('Layout nodes must be provided as Map<string, LayoutNode>');
    }

    // Validate LayoutNode structure
    for (const [nodeId, layoutNode] of layoutNodes) {
      if (typeof nodeId !== 'string') {
        throw new Error(`Invalid node ID type: expected string, got ${typeof nodeId}`);
      }

      if (typeof layoutNode.x !== 'number' || typeof layoutNode.y !== 'number') {
        throw new Error(`Invalid LayoutNode position for node ${nodeId}: x and y must be numbers`);
      }

      if (layoutNode.id !== nodeId) {
        throw new Error(`LayoutNode ID mismatch: expected ${nodeId}, got ${layoutNode.id}`);
      }
    }

    // Validate edge references
    for (const edge of edges) {
      if (!layoutNodes.has(edge.sourceId)) {
        throw new Error(`Edge references non-existent source node: ${edge.sourceId}`);
      }

      if (!layoutNodes.has(edge.targetId)) {
        throw new Error(`Edge references non-existent target node: ${edge.targetId}`);
      }
    }
  }

  /**
   * Create viewport state from navigation state
   */
  private createViewportState(navigationState: NavigationState): any {
    return {
      zoomLevel: navigationState.zoomLevel,
      panOffset: { ...navigationState.panOffset },
      viewBounds: { ...navigationState.viewBounds },
      selectedNodeId: navigationState.selectedNodeId,
      highlightedNodeIds: new Set(navigationState.highlightedNodeIds),
      interactionMode: navigationState.interactionMode
    };
  }

  /**
   * Create performance constraints based on dataset size
   */
  private createPerformanceConstraints(nodeCount: number, edgeCount: number): any {
    return {
      maxRenderTime: 1000, // 1 second max render time
      maxUpdateTime: 100, // 100ms max update time
      memoryLimit: this.calculateMemoryLimit(nodeCount, edgeCount),
      enableDegradation: nodeCount > 1000 || edgeCount > 2000
    };
  }

  /**
   * Calculate memory limit based on dataset size
   */
  private calculateMemoryLimit(nodeCount: number, edgeCount: number): number {
    // ~10MB per 100 nodes as specified in technical context
    const baseMemory = 50; // MB base
    const nodeMemory = (nodeCount / 100) * 10; // 10MB per 100 nodes
    const edgeMemory = (edgeCount / 1000) * 5; // 5MB per 1000 edges
    
    return Math.max(100, baseMemory + nodeMemory + edgeMemory); // Minimum 100MB
  }

  /**
   * Cache rendering context with size management
   */
  private cacheContext(context: RenderingContext): void {
    const cacheKey = this.generateCacheKey(context);
    
    // Manage cache size
    if (this.contextCache.size >= this.options.optimization.maxCacheSize) {
      const oldestKey = this.contextCache.keys().next().value;
      if (oldestKey) {
        this.contextCache.delete(oldestKey);
      }
    }

    // Deep clone context for caching (avoid reference issues)
    const cachedContext: RenderingContext = {
      nodes: new Map(context.nodes),
      edges: [...context.edges],
      config: { ...context.config },
      container: context.container,
      viewport: { ...context.viewport },
      constraints: context.constraints ? { ...context.constraints } : undefined
    };

    this.contextCache.set(cacheKey, cachedContext);
  }

  /**
   * Generate cache key for context
   */
  private generateCacheKey(context: RenderingContext): string {
    const nodeCount = context.nodes.size;
    const edgeCount = context.edges.length;
    const configHash = this.hashObject(context.config);
    
    return `nodes:${nodeCount}_edges:${edgeCount}_config:${configHash}`;
  }

  /**
   * Simple object hashing for cache keys
   */
  private hashObject(obj: any): string {
    return JSON.stringify(obj).slice(0, 10);
  }

  /**
   * Validate complete rendering context
   */
  private validateRenderingContext(context: RenderingContext): ValidationResult {
    const errors: Array<{field: string; message: string; code: string}> = [];
    const warnings: Array<{field: string; message: string; severity: 'low' | 'medium' | 'high'}> = [];

    // Validate nodes Map
    if (!context.nodes || !(context.nodes instanceof Map)) {
      errors.push({
        field: 'nodes',
        message: 'Context must contain nodes as Map<string, LayoutNode>',
        code: 'INVALID_NODES_STRUCTURE'
      });
    }

    // Validate edges array
    if (!Array.isArray(context.edges)) {
      errors.push({
        field: 'edges',
        message: 'Context must contain edges as EdgeLayout[]',
        code: 'INVALID_EDGES_STRUCTURE'
      });
    }

    // Validate container element
    if (!context.container || !(context.container instanceof HTMLElement)) {
      errors.push({
        field: 'container',
        message: 'Context must contain valid HTML container element',
        code: 'INVALID_CONTAINER'
      });
    }

    // Performance warnings
    if (context.nodes && context.nodes.size > 1000) {
      warnings.push({
        field: 'performance',
        message: `Large dataset detected: ${context.nodes.size} nodes may impact performance`,
        severity: 'medium'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Estimate memory usage of rendering context
   */
  private estimateContextMemoryUsage(context: RenderingContext): number {
    // Estimate based on data structures
    const nodeMemory = context.nodes.size * 0.5; // KB per LayoutNode
    const edgeMemory = context.edges.length * 0.3; // KB per EdgeLayout
    const configMemory = 10; // KB for configuration objects
    const baseMemory = 50; // KB base overhead
    
    return (baseMemory + nodeMemory + edgeMemory + configMemory) / 1024; // Convert to MB
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(creationTime: number, memoryUsage: number): void {
    this.performanceMetrics.contextsCreated++;
    
    // Update running average
    const currentAverage = this.performanceMetrics.averageCreationTime;
    const newAverage = (currentAverage * (this.performanceMetrics.contextsCreated - 1) + creationTime) / this.performanceMetrics.contextsCreated;
    this.performanceMetrics.averageCreationTime = newAverage;
    
    this.performanceMetrics.memoryUsage = memoryUsage;
  }
}

/**
 * Factory function for creating RenderingContextManager instances
 */
export function createRenderingContextManager(
  navigationStateManager: NavigationStateManager,
  options?: Partial<ContextCreationOptions>
): RenderingContextManager {
  return new RenderingContextManager(navigationStateManager, options);
}

/**
 * Create optimized context manager for large datasets
 */
export function createOptimizedContextManager(
  navigationStateManager: NavigationStateManager
): RenderingContextManager {
  return new RenderingContextManager(navigationStateManager, {
    includeConstraints: true,
    validateData: true, // Enable validation for large datasets
    optimization: {
      enableCaching: true,
      maxCacheSize: 10 // Larger cache for better performance
    }
  });
}

/**
 * Context transformation utilities
 */
export class ContextTransformUtils {
  /**
   * Transform raw node/edge data to LayoutNode Map structure
   */
  static transformToLayoutNodeMap(
    nodes: Array<{id: string; x: number; y: number; [key: string]: any}>,
    fieldMappings?: {idField?: string; xField?: string; yField?: string}
  ): Map<string, LayoutNode> {
    const mappings = {
      idField: 'id',
      xField: 'x', 
      yField: 'y',
      ...fieldMappings
    };

    const layoutNodeMap = new Map<string, LayoutNode>();

    for (const nodeData of nodes) {
      const nodeId = nodeData[mappings.idField];
      const x = nodeData[mappings.xField];
      const y = nodeData[mappings.yField];

      if (typeof nodeId !== 'string' || typeof x !== 'number' || typeof y !== 'number') {
        console.warn(`Skipping invalid node data:`, nodeData);
        continue;
      }

      const layoutNode: LayoutNode = {
        id: nodeId,
        x: x,
        y: y,
        // Additional LayoutNode properties would be added here during full integration
      } as LayoutNode;

      layoutNodeMap.set(nodeId, layoutNode);
    }

    return layoutNodeMap;
  }

  /**
   * Transform raw edge data to EdgeLayout structure
   */
  static transformToEdgeLayout(
    edges: Array<{source: string; target: string; [key: string]: any}>,
    fieldMappings?: {sourceField?: string; targetField?: string}
  ): EdgeLayout[] {
    const mappings = {
      sourceField: 'source',
      targetField: 'target',
      ...fieldMappings
    };

    return edges.map((edgeData, index) => ({
      sourceId: edgeData[mappings.sourceField],
      targetId: edgeData[mappings.targetField],
      compatibilityScores: new Map<string, number>(), // Will be populated by EdgeGenerator
      bundleGroup: undefined,
      originalEdge: edgeData
    })).filter(edge => 
      typeof edge.sourceId === 'string' && 
      typeof edge.targetId === 'string'
    );
  }
}