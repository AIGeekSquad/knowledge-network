import type { GraphData, GraphConfig, Node, Accessor } from './types';
import { LayoutEngineState } from './types';
import {
  LayoutEngine,
  type LayoutResult,
  type NodePosition,
  type LayoutConfig,
} from './layout/LayoutEngine';
import { RenderingSystem } from './rendering/RenderingSystem';
import { ViewportManager } from './viewport/ViewportManager';
import { SimpleEdge, EdgeBundling } from './edges';
import type { EdgeRenderResult } from './edges/EdgeRenderer';

/**
 * Main class for creating and managing interactive knowledge graph visualizations.
 *
 * @remarks
 * The KnowledgeGraph class acts as an orchestrator that coordinates layout calculation,
 * edge generation, rendering, and viewport management through specialized modules.
 * It follows a clean separation of concerns with proper modular architecture.
 *
 * Architecture:
 * - LayoutEngine: Handles all position calculations
 * - RenderingSystem: Manages DOM operations and rendering
 * - ViewportManager: Controls zoom, pan, and viewport transformations
 * - EdgeRenderer: Generates edge geometries
 *
 * Flow: Layout → Edge Generation → Rendering → Viewport
 *
 * @example
 * ```typescript
 * // Basic usage with minimal configuration
 * const container = document.getElementById('graph-container');
 * const data = {
 *   nodes: [
 *     { id: 'node1', label: 'Concept A' },
 *     { id: 'node2', label: 'Concept B' },
 *     { id: 'node3', label: 'Concept C' }
 *   ],
 *   edges: [
 *     { source: 'node1', target: 'node2' },
 *     { source: 'node2', target: 'node3' }
 *   ]
 * };
 *
 * const graph = new KnowledgeGraph(container, data);
 * graph.render();
 * ```
 */
export class KnowledgeGraph {
  private container: HTMLElement;
  private data: GraphData;
  private config: GraphConfig;

  // Modular components
  private layoutEngine: LayoutEngine | null = null;
  private renderingSystem: RenderingSystem | null = null;
  private viewportManager: ViewportManager | null = null;
  private edgeRenderer: SimpleEdge | EdgeBundling | null = null;

  // State management
  private currentState: LayoutEngineState = LayoutEngineState.INITIAL;
  private selectedNodeId: string | null = null;
  private layoutResult: LayoutResult | null = null;
  private edgeRenderResult: EdgeRenderResult | null = null;

  /**
   * Creates a new KnowledgeGraph instance.
   *
   * @param container - The HTML element that will contain the graph visualization.
   * @param data - The graph data containing nodes and edges to visualize.
   * @param config - Optional configuration object to customize the graph.
   */
  constructor(container: HTMLElement, data: GraphData, config: GraphConfig = {}) {
    this.container = container;
    this.data = data;
    this.config = {
      width: config.width ?? 800,
      height: config.height ?? 600,
      nodeRadius: config.nodeRadius ?? 10,
      nodeFill: config.nodeFill ?? '#69b3a2',
      nodeStroke: config.nodeStroke ?? '#fff',
      nodeStrokeWidth: config.nodeStrokeWidth ?? 1.5,
      linkDistance: config.linkDistance ?? 100,
      linkStrength: config.linkStrength,
      linkStroke: config.linkStroke ?? '#999',
      linkStrokeWidth: config.linkStrokeWidth ?? 1.5,
      chargeStrength: config.chargeStrength ?? -300,
      collisionRadius: config.collisionRadius,
      similarityFunction: config.similarityFunction,
      edgeRenderer: config.edgeRenderer ?? 'simple',
      edgeBundling: config.edgeBundling,
      waitForStable: config.waitForStable ?? false,
      stabilityThreshold: config.stabilityThreshold ?? 0.01,
      enableZoom: config.enableZoom ?? true,
      zoomExtent: config.zoomExtent,
      enableDrag: config.enableDrag ?? true,
      dimensions: config.dimensions ?? 2,
      ...config,
    };

    this.initializeComponents();
  }

  /**
   * Initialize all modular components
   */
  private initializeComponents(): void {
    // Initialize LayoutEngine
    const layoutConfig: Partial<LayoutConfig> = {
      width: this.config.width!,
      height: this.config.height!,
      linkDistance: typeof this.config.linkDistance === 'function' ? 100 : this.config.linkDistance,
      linkStrength:
        typeof this.config.linkStrength === 'function' ? 1 : (this.config.linkStrength ?? 1),
      chargeStrength:
        typeof this.config.chargeStrength === 'function' ? -300 : this.config.chargeStrength,
      collisionRadius:
        typeof this.config.collisionRadius === 'function' ? 20 : this.config.collisionRadius,
      similarityFunction: this.config.similarityFunction,
      similarityThreshold: this.config.similarityThreshold,
      alpha: 1,
      alphaMin: this.config.stabilityThreshold ?? 0.01,
      dimensions: this.config.dimensions,
    };

    this.layoutEngine = new LayoutEngine('force-directed', layoutConfig);

    // Initialize RenderingSystem
    this.renderingSystem = new RenderingSystem(this.container, {
      width: this.config.width!,
      height: this.config.height!,
    });

    // Initialize ViewportManager
    this.viewportManager = new ViewportManager();

    // Initialize EdgeRenderer
    if (this.config.edgeRenderer === 'bundled') {
      this.edgeRenderer = new EdgeBundling(this.config.edgeBundling);
    } else {
      this.edgeRenderer = new SimpleEdge();
    }

    this.setupEventListeners();
  }

  /**
   * Setup event listeners for modular components
   */
  private setupEventListeners(): void {
    if (!this.layoutEngine) return;

    // Layout progress events
    this.layoutEngine.on('layoutProgress', (progress: number) => {
      if (
        this.config.onLayoutProgress &&
        this.currentState === LayoutEngineState.LAYOUT_CALCULATING
      ) {
        const simulation = this.layoutEngine?.getSimulation();
        const alpha = simulation?.alpha() ?? 0;
        this.config.onLayoutProgress(alpha, progress);
      }
    });

    // Layout positions update
    this.layoutEngine.on('positions', (positions: any) => {
      if (this.renderingSystem && this.layoutResult) {
        this.renderingSystem.updateNodePositions(positions.nodes);
        this.renderingSystem.updateEdgePositions(positions.edges);
      }
    });

    // Layout completion
    this.layoutEngine.on('layoutEnd', (result: LayoutResult) => {
      this.layoutResult = result;
      this.onLayoutComplete();
    });

    // Layout stability for edge rendering
    this.layoutEngine.on('stable', () => {
      if (this.config.waitForStable && this.layoutResult) {
        this.renderEdges();
      }
    });
  }

  /**
   * Update the state and call the callback if provided
   */
  private updateState(state: LayoutEngineState, progress: number = 0): void {
    this.currentState = state;
    if (this.config.onStateChange) {
      try {
        this.config.onStateChange(state, progress);
      } catch (error) {
        console.error('Error in onStateChange callback:', error);
      }
    }
  }

  /**
   * Handle errors with callback
   */
  private handleError(error: Error, stage: string): void {
    this.updateState(LayoutEngineState.ERROR, 0);
    if (this.config.onError) {
      try {
        this.config.onError(error, stage);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }
    console.error(`Error in ${stage}:`, error);
  }

  /**
   * Convert accessor to a function that can be called
   */
  private accessor<T, R>(
    accessor: Accessor<T, R> | undefined,
    defaultValue: R
  ): (d: T, i: number, nodes: T[]) => R {
    if (accessor === undefined) {
      return () => defaultValue;
    }
    if (typeof accessor === 'function') {
      return accessor as (d: T, i: number, nodes: T[]) => R;
    }
    return () => accessor;
  }

  /**
   * Renders the knowledge graph visualization following proper modular flow.
   *
   * Flow: Layout → Edge Generation → Rendering → Viewport
   */
  async render(): Promise<void> {
    try {
      this.updateState(LayoutEngineState.LOADING, 10);

      if (!this.layoutEngine || !this.renderingSystem || !this.viewportManager) {
        throw new Error('Components not initialized');
      }

      // Step 1: Layout Calculation (NO rendering)
      this.updateState(LayoutEngineState.LAYOUT_CALCULATING, 30);
      this.layoutResult = await this.layoutEngine.calculateLayout(this.data);

      // Step 2: Edge Generation (using layout data)
      this.updateState(LayoutEngineState.EDGE_GENERATING, 70);
      this.onLayoutComplete();

      if (!this.config.waitForStable) {
        await this.renderEdges();
      }
      // If waitForStable is true, renderEdges will be called by the 'stable' event
    } catch (error) {
      this.handleError(error as Error, 'render');
      throw error;
    }
  }

  /**
   * Called when layout calculation is complete
   */
  private onLayoutComplete(): void {
    if (!this.layoutResult || !this.viewportManager) return;

    // Update viewport manager with node positions
    const nodePositions: NodePosition[] = this.layoutResult.nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      z: node.z,
    }));

    this.viewportManager.setNodePositions(nodePositions);
  }

  /**
   * Render edges using layout data
   */
  private async renderEdges(): Promise<void> {
    if (!this.layoutResult || !this.renderingSystem || !this.edgeRenderer) return;

    try {
      // Call edge rendering progress callback
      if (this.config.onEdgeRenderingProgress) {
        this.config.onEdgeRenderingProgress(0, this.data.edges.length);
      }

      // Step 3: Rendering (DOM operations)
      await this.renderingSystem.setRenderer(this.config.renderer || 'svg');
      this.renderingSystem.render(this.layoutResult, {
        nodeConfig: {
          radius: this.config.nodeRadius,
          fill: this.config.nodeFill,
          stroke: this.config.nodeStroke,
          strokeWidth: this.config.nodeStrokeWidth,
        },
        edgeConfig: {
          stroke: this.config.linkStroke,
          strokeWidth: this.config.linkStrokeWidth,
          curveType: this.config.edgeRenderer === 'bundled' ? 'bundle' : 'straight',
        },
      });

      // Step 4: Viewport Management
      this.updateState(LayoutEngineState.ZOOM_FITTING, 90);
      this.setupViewport();

      // Call edge rendering completion callback
      if (this.config.onEdgeRenderingProgress) {
        this.config.onEdgeRenderingProgress(this.data.edges.length, this.data.edges.length);
      }

      if (this.config.onEdgesRendered) {
        this.config.onEdgesRendered();
      }

      this.updateState(LayoutEngineState.READY, 100);
    } catch (error) {
      this.handleError(error as Error, 'renderEdges');
    }
  }

  /**
   * Setup viewport management
   */
  private setupViewport(): void {
    if (!this.viewportManager || !this.renderingSystem) return;

    this.viewportManager.setup(this.container, this.renderingSystem);

    if (this.config.enableZoom) {
      this.viewportManager.setZoomEnabled(true);
      if (this.config.zoomExtent) {
        this.viewportManager.setZoomExtent(this.config.zoomExtent[0], this.config.zoomExtent[1]);
      }
    }

    if (this.config.enableDrag) {
      this.viewportManager.setPanEnabled(true);
    }

    if (this.config.fitToViewport) {
      setTimeout(() => {
        this.viewportManager?.fitToViewport(this.config.padding || 50, true);
      }, 100);
    }
  }

  /**
   * Updates the graph with new data and re-renders the visualization.
   */
  async updateData(data: GraphData): Promise<void> {
    this.data = data;
    this.destroy();
    this.initializeComponents();
    await this.render();
  }

  /**
   * Gets the D3 force simulation instance for advanced customization.
   */
  getSimulation(): any {
    return this.layoutEngine?.getSimulation() || null;
  }

  /**
   * Selects a node and highlights it along with its neighbors.
   */
  selectNode(nodeId: string): void {
    if (!this.renderingSystem) return;

    this.selectedNodeId = nodeId;

    // Get neighbors
    const neighbors = this.getNeighbors(nodeId);
    const connectedEdges: string[] = [];

    // Find connected edges
    this.data.edges.forEach((edge, index) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as Node).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as Node).id;

      if (sourceId === nodeId || targetId === nodeId) {
        connectedEdges.push(edge.id || `edge-${index}`);
      }
    });

    // Apply highlighting through rendering system
    this.renderingSystem.highlightNodes([nodeId, ...neighbors]);
    this.renderingSystem.highlightEdges(connectedEdges);

    // Call the callback if provided
    if (this.config.onNodeSelected) {
      try {
        this.config.onNodeSelected(nodeId, neighbors, connectedEdges);
      } catch (error) {
        console.error('Error in onNodeSelected callback:', error);
      }
    }
  }

  /**
   * Clears the current node selection.
   */
  clearSelection(): void {
    if (!this.renderingSystem) return;

    this.selectedNodeId = null;
    this.renderingSystem.clearHighlights();
  }

  /**
   * Gets the neighbor node IDs for a given node.
   */
  getNeighbors(nodeId: string): string[] {
    const neighbors: Set<string> = new Set();

    this.data.edges.forEach((edge) => {
      const sourceId = typeof edge.source === 'string' ? edge.source : (edge.source as Node).id;
      const targetId = typeof edge.target === 'string' ? edge.target : (edge.target as Node).id;

      if (sourceId === nodeId && targetId !== nodeId) {
        neighbors.add(targetId);
      } else if (targetId === nodeId && sourceId !== nodeId) {
        neighbors.add(sourceId);
      }
    });

    return Array.from(neighbors);
  }

  /**
   * Destroys the graph visualization and cleans up all resources.
   */
  destroy(): void {
    // Clean up layout engine
    if (this.layoutEngine) {
      this.layoutEngine.destroy();
      this.layoutEngine = null;
    }

    // Clean up rendering system
    if (this.renderingSystem) {
      this.renderingSystem.destroy();
      this.renderingSystem = null;
    }

    // Clean up viewport manager
    if (this.viewportManager) {
      this.viewportManager.destroy();
      this.viewportManager = null;
    }

    // Clean up edge renderer
    if (this.edgeRenderResult && this.edgeRenderer) {
      this.edgeRenderer.destroy(this.edgeRenderResult);
      this.edgeRenderResult = null;
    }

    this.edgeRenderer = null;
    this.layoutResult = null;
    this.selectedNodeId = null;
  }
}
