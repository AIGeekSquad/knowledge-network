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
import type { LayoutNode } from '../layout/layout-engine';
import type { RenderingConfig } from '../rendering/rendering-strategy';

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