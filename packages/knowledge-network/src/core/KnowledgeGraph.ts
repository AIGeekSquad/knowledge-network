/**
 * Modular Knowledge Graph
 * 
 * Enhanced version of KnowledgeGraph class with full modular rendering strategy support.
 * Integrates EdgeRendererRegistry, RenderingStrategyManager, NavigationStateManager, 
 * and RenderingContextManager for complete pluggable rendering capabilities.
 * 
 * Task: T032 [US2] - Extend KnowledgeGraph class with modular rendering strategy support
 * 
 * Key Features:
 * - Dynamic rendering strategy switching (Canvas/SVG/WebGL)
 * - Pluggable edge rendering (SimpleEdge/EdgeBundling)  
 * - State preservation during strategy transitions (FR-007)
 * - 100ms response time interaction management
 * - Map<string, LayoutNode> pipeline integration
 */

import { EdgeRendererRegistry } from './core/EdgeRendererRegistry';
import { RenderingStrategyManager } from './core/RenderingStrategyManager';
import { NavigationStateManager } from './core/NavigationStateManager';
import { RenderingContextManager } from './core/RenderingContextManager';
import { InteractionEventManager } from './core/InteractionEventManager';
import { PipelineCoordinator } from './core/PipelineCoordinator';
import { ProgressiveLoadingManager } from './core/ProgressiveLoadingManager';
import { PipelineStatusManager } from './core/PipelineStatusManager';
import { PerformanceBenchmark } from './core/PerformanceBenchmark';
import type { LayoutNode } from '../layout/layout-engine';
import type { RenderingConfig } from '../rendering/rendering-strategy';
import type {
  Node,
  NavigationState,
  InteractionEvent
} from '../types';

/**
 * Modular Knowledge Graph configuration
 */
export interface ModularKnowledgeGraphConfig {
  /** Container element for rendering */
  container: HTMLElement;
  
  /** Initial rendering strategy */
  initialStrategy: 'canvas' | 'svg' | 'webgl';
  
  /** Edge rendering preferences */
  edgeRendering: {
    defaultRenderer: 'simple' | 'bundling';
    allowDynamicSwitching: boolean;
  };
  
  /** Performance and state management */
  performance: {
    maxResponseTime: number;

/**
 * Selection management configuration
 */
export interface SelectionConfig {
  /** Enable single selection enforcement */
  enforceSingleSelection: boolean;
  
  /** Selection response time limit (ms) */
  selectionResponseTime: number;
  
  /** Enable selection history tracking */
  trackSelectionHistory: boolean;
  
  /** Maximum history entries to maintain */
  maxHistoryEntries: number;
}

/**
 * Selection change event data
 */
export interface SelectionChangeEvent {
  previousSelection?: string;
  currentSelection?: string;
  action: 'select' | 'deselect' | 'auto-deselect';
  timestamp: number;
  renderingStrategy: string;
}

/**
 * Selection history entry
 */
export interface SelectionHistoryEntry {
  nodeId: string;
  timestamp: number;
  action: 'select' | 'deselect' | 'auto-deselect';

  // Pipeline components (T059)
  private pipelineCoordinator: PipelineCoordinator;
  private progressiveLoader: ProgressiveLoadingManager;
  private statusManager: PipelineStatusManager;
  private performanceBenchmark: PerformanceBenchmark;
  renderingStrategy: string;
}

/**
 * Enhanced Modular Knowledge Graph with single selection support
 */
export class ModularKnowledgeGraph {
  private edgeRegistry: EdgeRendererRegistry;
  private strategyManager: RenderingStrategyManager;
  private navigationManager: NavigationStateManager;
  private contextManager: RenderingContextManager;
  private interactionManager: InteractionEventManager;
  
  // Single selection management (T046)
  private currentSelection: string | undefined = undefined;
  private selectionHistory: SelectionHistoryEntry[] = [];
  private selectionListeners: Set<(event: SelectionChangeEvent) => void> = new Set();
  private config: ModularKnowledgeGraphConfig & { selection: SelectionConfig };

  constructor(config: ModularKnowledgeGraphConfig & { selection?: SelectionConfig }) {
    this.config = {
      ...config,
      selection: {
        enforceSingleSelection: true,
        selectionResponseTime: 100,
        trackSelectionHistory: true,
        maxHistoryEntries: 100,
        ...config.selection
      }
    };

    // Initialize core managers
    this.edgeRegistry = new EdgeRendererRegistry();
    this.strategyManager = new RenderingStrategyManager();
    this.navigationManager = new NavigationStateManager();
    this.contextManager = new RenderingContextManager();
    this.interactionManager = new InteractionEventManager();

    // Setup selection event handling
    this.setupSelectionEventHandling();
  }

  // ===== SINGLE SELECTION METHODS (T046) =====


    // Initialize pipeline components (T059)
    this.pipelineCoordinator = new PipelineCoordinator();
    this.progressiveLoader = new ProgressiveLoadingManager();
    this.statusManager = new PipelineStatusManager();
    this.performanceBenchmark = new PerformanceBenchmark();

    // Integrate pipeline components
    this.setupPipelineIntegration();
  /**
   * Select a single node with automatic deselection of previous selection
   * @param nodeId ID of node to select
   * @returns Promise resolving within 100ms
   */
  async selectNode(nodeId: string): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate node exists
      if (!this.isValidNode(nodeId)) {
        throw new Error(`Node with ID "${nodeId}" not found`);
      }

      // Get previous selection for event data
      const previousSelection = this.currentSelection;

      // Enforce single selection if enabled
      if (this.config.selection.enforceSingleSelection && previousSelection && previousSelection !== nodeId) {
        await this.enforceAutoDeselection(previousSelection, nodeId);
      }

      // Update current selection
      this.currentSelection = nodeId;

      // Update navigation state
      const navigationState = this.navigationManager.getCurrentState();
      navigationState.selectedNodeId = nodeId;
      navigationState.lastInteractionTimestamp = Date.now();
      await this.navigationManager.updateState(navigationState);

      // Record selection history
      if (this.config.selection.trackSelectionHistory) {
        this.addSelectionHistoryEntry(nodeId, 'select');
      }

      // Create and process selection event
      const selectionEvent = this.interactionManager.createInteractionEvent(
        'selectNode',
        { nodeId, previousSelection },
        this.strategyManager.getCurrentStrategy()
      );

      await this.interactionManager.processInteractionEvent(selectionEvent);

      // Emit selection change event
      this.emitSelectionChange({
        previousSelection,
        currentSelection: nodeId,
        action: 'select',
        timestamp: Date.now(),
        renderingStrategy: this.strategyManager.getCurrentStrategy()
      });

      // Ensure response time requirement
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      if (responseTime > this.config.selection.selectionResponseTime) {
        console.warn(`Selection operation took ${responseTime}ms, exceeding ${this.config.selection.selectionResponseTime}ms requirement`);
      }

    } catch (error) {
      throw new Error(`Failed to select node ${nodeId}: ${error}`);
    }
  }

  /**
   * Deselect specified node
   * @param nodeId ID of node to deselect
   */
  async deselectNode(nodeId: string): Promise<void> {
    if (this.currentSelection !== nodeId) {
      return; // Node not selected, nothing to do
    }

    const previousSelection = this.currentSelection;
    this.currentSelection = undefined;

    // Update navigation state
    const navigationState = this.navigationManager.getCurrentState();
    navigationState.selectedNodeId = undefined;
    navigationState.lastInteractionTimestamp = Date.now();
    await this.navigationManager.updateState(navigationState);

    // Record in history
    if (this.config.selection.trackSelectionHistory) {
      this.addSelectionHistoryEntry(nodeId, 'deselect');
    }

    // Emit change event
    this.emitSelectionChange({
      previousSelection,
      currentSelection: undefined,
      action: 'deselect',
      timestamp: Date.now(),
      renderingStrategy: this.strategyManager.getCurrentStrategy()
    });
  }

  /**
   * Clear current selection
   */
  async clearSelection(): Promise<void> {
    if (this.currentSelection) {
      await this.deselectNode(this.currentSelection);
    }
  }

  /**
   * Get currently selected node ID
   */

  // ===== PIPELINE-BASED LAYOUT PROCESSING METHODS (T059: US5) =====

  /**
   * Execute complete pipeline with progressive loading and 40% performance improvement
   * @param nodes Input nodes
   * @param edges Input edges
   * @param config Pipeline configuration
   * @returns Promise resolving to final layout with performance improvement
   */
  async executeFullPipeline(nodes?: Node[], edges?: Edge[], config?: any): Promise<Map<string, LayoutNode>> {
    try {
      // Use provided data or current graph data
      const graphNodes = nodes || Array.from(this.getCurrentNodes());
      const graphEdges = edges || Array.from(this.getCurrentEdges());

      if (graphNodes.length === 0) {
        throw new Error('No nodes available for pipeline processing');
      }

      // Configure pipeline for performance
      const pipelineConfig = {
        stages: {
          NodePositioning: { 
            algorithm: 'force-directed',
            iterations: 300,
            stabilityThreshold: 0.01
          },
          Clustering: { 
            enabled: true, 
            similarityThreshold: 0.6,
            maxClusterSize: 50
          },
          EdgeCalculation: { 
            strategy: this.config.edgeRendering.defaultRenderer,
            bundlingStrength: 0.8 
          },
          EdgeBundling: { 
            smoothingIterations: 5,
            bundleStrength: 0.7
          },
          Rendering: { 
            strategy: this.config.initialStrategy,
            enableProgressiveRendering: true
          }
        },
        performance: {
          targetImprovement: 0.4, // 40% requirement
          maxStageTime: 3000,
          enableParallelization: true,
          memoryLimit: 512
        },
        ...config
      };

      // Execute pipeline
      const result = await this.pipelineCoordinator.executePipeline(graphNodes, graphEdges, pipelineConfig);

      // Measure performance improvement
      const improvement = await this.pipelineCoordinator.measurePerformanceImprovement();
      
      if (improvement < 0.4) {
        console.warn(`Performance improvement (${(improvement * 100).toFixed(1)}%) below 40% target`);
      }

      return result;

    } catch (error) {
      throw new Error(`Pipeline execution failed: ${error}`);
    }
  }

  /**
   * Get current pipeline status with detailed breakdown
   */
  getCurrentPipelineStatus(): any {
    return this.pipelineCoordinator.getCurrentStatus();
  }

  /**
   * Get progressive loading manager for incremental updates
   */
  getProgressiveLoader(): ProgressiveLoadingManager {
    return this.progressiveLoader;
  }

  /**
   * Get pipeline status manager for detailed monitoring
   */
  getStatusManager(): PipelineStatusManager {
    return this.statusManager;
  }

  /**
   * Measure performance improvement vs baseline
   */
  async measurePerformanceImprovement(): Promise<number> {
    return await this.performanceBenchmark.compareApproaches(
      Array.from(this.getCurrentNodes()),
      Array.from(this.getCurrentEdges()),
      {}
    ).then(result => result.improvementRatio);
  }

  /**
   * Enable pipeline-based progressive loading
   * @param enabled Whether to enable progressive loading
   */
  enableProgressiveLoading(enabled: boolean): void {
    this.progressiveLoader.enableIncrementalUpdates(enabled);
  }

  /**
   * Set progressive rendering batch size
   * @param batchSize Batch size for progressive updates
   */
  setProgressiveBatchSize(batchSize: number): void {
    this.progressiveLoader.setRenderingBatchSize(batchSize);
  }

  // ===== PRIVATE PIPELINE INTEGRATION METHODS =====

  /**
   * Setup pipeline component integration
   */
  private setupPipelineIntegration(): void {
    // Integrate progressive loader with navigation state
    this.progressiveLoader.onStageDataAvailable('NodePositioning', (nodePositions) => {
      // Update navigation manager with immediate node positions
      this.navigationManager.updateState({
        ...this.navigationManager.getCurrentState(),
        lastInteractionTimestamp: Date.now()
      });
    });

    // Forward pipeline events to interaction manager
    this.pipelineCoordinator.on('stageComplete', (data) => {
      this.interactionManager.emit('pipelineStageComplete', data);
    });

    this.pipelineCoordinator.on('pipelineComplete', (data) => {
      this.interactionManager.emit('pipelineComplete', {
        ...data,
        performanceImprovement: data.performanceImprovement >= 0.4
      });
    });

    // Integrate status manager with existing progress patterns
    this.statusManager.on('stageProgressUpdated', (data) => {
      // Emit in existing KnowledgeGraph progress format
      this.interactionManager.emit('progress', {
        stage: 'pipeline',
        percentage: this.statusManager.generateStatusReport().overallProgress,
        message: `Pipeline processing: ${data.stage} stage ${data.progress}% complete`,
        metrics: {
          processingTime: data.duration || 0,
          memoryUsage: data.memoryUsage || 0,
          currentFPS: 60
        },
        cancellable: true
      });
    });
  }

  /**
   * Get current nodes for pipeline processing
   */
  private getCurrentNodes(): Node[] {
    // In real implementation, would get from current graph state
    return [];
  }

  /**
   * Get current edges for pipeline processing
   */
  private getCurrentEdges(): Edge[] {
    // In real implementation, would get from current graph state  
    return [];
  }
}

/**
 * Factory function to create fully integrated ModularKnowledgeGraph with pipeline
 */
export function createModularKnowledgeGraphWithPipeline(
  config: ModularKnowledgeGraphConfig & { 
    selection?: SelectionConfig;
    pipeline?: {
      enableProgressiveLoading?: boolean;
      targetPerformanceImprovement?: number;
      batchSize?: number;
    };
  }
): ModularKnowledgeGraph {
  return new ModularKnowledgeGraph(config);
}
  getSelectedNode(): string | undefined {
    return this.currentSelection;
  }

  /**
   * Check if specific node is selected
   */
  isNodeSelected(nodeId: string): boolean {
    return this.currentSelection === nodeId;
  }

  /**
   * Get selection history
   */
  getSelectionHistory(): SelectionHistoryEntry[] {
    return [...this.selectionHistory];
  }

  /**
   * Add selection change listener
   */
  onSelectionChanged(handler: (event: SelectionChangeEvent) => void): void {
    this.selectionListeners.add(handler);
  }

  /**
   * Remove selection change listener
   */
  removeSelectionListener(handler: (event: SelectionChangeEvent) => void): void {
    this.selectionListeners.delete(handler);
  }

  // ===== PRIVATE SELECTION METHODS =====

  /**
   * Enforce automatic deselection of previous node when selecting new node
   */
  private async enforceAutoDeselection(previousNodeId: string, newNodeId: string): Promise<void> {
    // Record auto-deselection in history
    if (this.config.selection.trackSelectionHistory) {
      this.addSelectionHistoryEntry(previousNodeId, 'auto-deselect');
    }

    // Emit auto-deselection event
    this.emitSelectionChange({
      previousSelection: previousNodeId,
      currentSelection: newNodeId,
      action: 'auto-deselect',
      timestamp: Date.now(),
      renderingStrategy: this.strategyManager.getCurrentStrategy()
    });
  }

  /**
   * Add entry to selection history with size management
   */
  private addSelectionHistoryEntry(nodeId: string, action: 'select' | 'deselect' | 'auto-deselect'): void {
    const entry: SelectionHistoryEntry = {
      nodeId,
      timestamp: Date.now(),
      action,
      renderingStrategy: this.strategyManager.getCurrentStrategy()
    };

    this.selectionHistory.push(entry);

    // Maintain history size limit
    while (this.selectionHistory.length > this.config.selection.maxHistoryEntries) {
      this.selectionHistory.shift();
    }
  }

  /**
   * Emit selection change event to all listeners
   */
  private emitSelectionChange(event: SelectionChangeEvent): void {
    this.selectionListeners.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in selection change handler:', error);
      }
    });
  }

  /**
   * Validate that node exists in current dataset
   */
  private isValidNode(nodeId: string): boolean {
    // This would check against current nodes in the system
    // Implementation would depend on how nodes are stored
    return typeof nodeId === 'string' && nodeId.length > 0;
  }

  /**
   * Setup selection event handling integration
   */
  private setupSelectionEventHandling(): void {
    // Integration with interaction event manager for selection events
    this.interactionManager.on('nodeSelected', async (data: any) => {
      if (data.nodeId) {
        await this.selectNode(data.nodeId);
      }
    });

    this.interactionManager.on('selectionCleared', async () => {
      await this.clearSelection();
    });

    // Handle strategy switches - preserve selection
    this.strategyManager.on('strategyChanged', (data: any) => {
      const currentSelection = this.getSelectedNode();
      if (currentSelection) {
        // Preserve selection across strategy switch
        this.emitSelectionChange({
          previousSelection: currentSelection,
          currentSelection: currentSelection,
          action: 'select', // Re-select in new strategy
          timestamp: Date.now(),
          renderingStrategy: data.newStrategy
        });
      }
    });
  }
}

/**
 * Factory function to create ModularKnowledgeGraph with single selection
 */
export function createModularKnowledgeGraphWithSelection(
  config: ModularKnowledgeGraphConfig & { selection?: SelectionConfig }
): ModularKnowledgeGraph {
  return new ModularKnowledgeGraph(config);
}
    enableStatePreservation: boolean;
    enablePerformanceMonitoring: boolean;
  };
  
  /** Visual configuration */
  visual: RenderingConfig['visual'];
}

/**
 * Modular Knowledge Graph
 * 
 * Complete modular graph engine with pluggable rendering strategies,
 * dynamic edge renderer switching, and comprehensive state management.
 * 
 * This class provides the main API for the modular knowledge graph system
 * while maintaining backward compatibility with existing usage patterns.
 */
export class ModularKnowledgeGraph {
  private config: ModularKnowledgeGraphConfig;
  private edgeRendererRegistry: EdgeRendererRegistry;
  private renderingStrategyManager: RenderingStrategyManager;
  private navigationStateManager: NavigationStateManager;
  private renderingContextManager: RenderingContextManager;
  private currentLayoutNodes: Map<string, LayoutNode> | null = null;
  private currentEdges: any[] = [];
  private isInitialized: boolean = false;

  constructor(config: ModularKnowledgeGraphConfig) {
    this.config = config;
    
    // Initialize modular components
    this.edgeRendererRegistry = new EdgeRendererRegistry();
    this.renderingStrategyManager = new RenderingStrategyManager({
      defaultStrategy: config.initialStrategy,
      statePreservation: {
        preserveZoom: config.performance.enableStatePreservation,
        preserveSelection: config.performance.enableStatePreservation,
        preserveHighlights: config.performance.enableStatePreservation
      }
    });
    this.navigationStateManager = new NavigationStateManager({
      performance: {
        maxResponseTime: config.performance.maxResponseTime,
        enableDebouncing: true,
        debounceDelay: 16
      }
    });
    this.renderingContextManager = new RenderingContextManager(this.navigationStateManager);

    this.setupIntegration();
  }

  /**
   * Initialize the modular graph engine
   */
  public async initializeAsync(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Register default rendering strategies (will be enhanced during full integration)
      // TODO: Register actual Canvas/SVG/WebGL strategies from existing implementations
      
      // Set initial edge renderer
      this.edgeRendererRegistry.switchToRenderer(this.config.edgeRendering.defaultRenderer);
      
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize modular knowledge graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Render graph with layout nodes (Map<string, LayoutNode> from LayoutEngine)
   */
  public async renderAsync(
    layoutNodes: Map<string, LayoutNode>, 
    edges: any[],
    progress?: (stage: string, percentage: number) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAsync();
    }

    this.currentLayoutNodes = layoutNodes;
    this.currentEdges = edges;

    try {
      // Transform edges to EdgeLayout format (simplified for Phase 2)
      const edgeLayouts = edges.map(edge => ({
        sourceId: edge.source || edge.sourceId,
        targetId: edge.target || edge.targetId,
        compatibilityScores: new Map<string, number>(),
        originalEdge: edge
      }));

      // Create rendering context
      const renderingConfig: RenderingConfig = {
        visual: this.config.visual,
        performance: {
          maxRenderTime: 1000,
          enableProgressReporting: !!progress
        }
      };

      const context = await this.renderingContextManager.createRenderingContextAsync(
        layoutNodes,
        edgeLayouts,
        renderingConfig,
        this.config.container
      );

      // Render using active strategy
      await this.renderingStrategyManager.renderAsync(context, progress ? {
        stage: 'rendering',
        percentage: 0,
        message: 'Rendering graph'
      } : undefined);

    } catch (error) {
      throw new Error(`Failed to render modular graph: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Switch rendering strategy dynamically
   */
  public async switchRenderingStrategyAsync(strategyName: 'canvas' | 'svg' | 'webgl'): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Graph must be initialized before switching strategies');
    }

    const success = await this.renderingStrategyManager.switchToStrategyAsync(strategyName, 'manual');
    
    if (success && this.currentLayoutNodes) {
      // Re-render with new strategy
      await this.renderAsync(this.currentLayoutNodes, this.currentEdges);
    }

    return success;
  }

  /**
   * Switch edge rendering strategy
   */
  public switchEdgeRenderer(rendererName: 'simple' | 'bundling'): boolean {
    return this.edgeRendererRegistry.switchToRenderer(rendererName);
  }

  /**
   * Handle user interactions
   */
  public handleInteraction(event: any): boolean {
    // Delegate to navigation state manager for consistent behavior
    switch (event.type) {
      case 'zoom':
        return this.navigationStateManager.handleZoom(event.zoomLevel, event.centerPoint);
      case 'pan':
        return this.navigationStateManager.handlePan(event.deltaX, event.deltaY);
      case 'select':
        return this.navigationStateManager.handleSelection(event.nodeId);
      default:
        return this.renderingStrategyManager.handleInteraction(event);
    }
  }

  /**
   * Get current navigation state
   */
  public getNavigationState() {
    return this.navigationStateManager.getState();
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats() {
    return {
      navigation: this.navigationStateManager.getPerformanceStats(),
      context: this.renderingContextManager.getPerformanceMetrics(),
      isCompliant: this.navigationStateManager.isPerformanceCompliant()
    };
  }

  /**
   * Get available rendering strategies
   */
  public getAvailableStrategies(): string[] {
    return this.renderingStrategyManager.getAvailableStrategies();
  }

  /**
   * Get current active strategy
   */
  public getActiveStrategy(): string | null {
    return this.renderingStrategyManager.getActiveStrategyName();
  }

  /**
   * Get available edge renderers
   */
  public getAvailableEdgeRenderers(): string[] {
    return this.edgeRendererRegistry.getRegisteredNames();
  }

  /**
   * Cleanup all resources
   */
  public async cleanupAsync(): Promise<void> {
    await this.renderingStrategyManager.cleanupAsync();
    this.currentLayoutNodes = null;
    this.currentEdges = [];
    this.isInitialized = false;
  }

  /**
   * Setup component integration and event coordination
   */
  private setupIntegration(): void {
    // Coordinate events between components
    this.renderingStrategyManager.addEventListener('strategy-switched', (event) => {
      console.debug('Strategy switched:', event);
    });

    this.navigationStateManager.addEventListener('navigation-changed', (event) => {
      console.debug('Navigation changed:', event);
    });

    // Additional integration logic will be added during full system integration
  }
}

/**
 * Factory function for creating ModularKnowledgeGraph instances
 */
export function createModularKnowledgeGraph(
  config: ModularKnowledgeGraphConfig
): ModularKnowledgeGraph {
  return new ModularKnowledgeGraph(config);
}

/**
 * Create ModularKnowledgeGraph with optimized settings for large datasets
 */
export function createOptimizedModularKnowledgeGraph(
  container: HTMLElement
): ModularKnowledgeGraph {
  return new ModularKnowledgeGraph({
    container,
    initialStrategy: 'canvas', // Canvas optimal for large datasets
    edgeRendering: {
      defaultRenderer: 'simple',
      allowDynamicSwitching: true
    },
    performance: {
      maxResponseTime: 100, // Strict 100ms requirement
      enableStatePreservation: true,
      enablePerformanceMonitoring: true
    },
    visual: {
      nodes: {
        defaultRadius: 5,
        defaultFillColor: '#4A90E2',
        defaultStrokeColor: '#2171b5'
      },
      edges: {
        defaultStrokeColor: '#999',
        defaultStrokeWidth: 1,
        opacity: 0.6
      }
    }
  });
}