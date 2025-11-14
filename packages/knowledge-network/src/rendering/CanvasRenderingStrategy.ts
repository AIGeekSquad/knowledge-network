/**
 * Canvas Rendering Strategy Implementation
 * 
 * Concrete implementation for Canvas 2D rendering that extends BaseRenderingStrategy.
 * Optimized for medium-sized datasets (up to 1000 nodes) with interactive features,
 * smooth animations, and high-DPI display support.
 * 
 * @fileoverview Canvas 2D rendering strategy for knowledge graphs
 */

import { BaseRenderingStrategy } from './BaseRenderingStrategy';
import type {
  RenderingContext,
  RenderingConfig,
  RenderingCapabilities,
  ValidationResult,
  VisualUpdates,
  InteractionEvent,
  RenderingProgressCallback,
  Point2D
} from './rendering-strategy';
import type { LayoutNode } from '../layout/layout-engine';

/**
 * Canvas 2D Rendering Strategy
 * 
 * Provides high-performance Canvas 2D rendering with:
 * - Interactive node and edge rendering
 * - Hit testing for user interactions
 * - High-DPI display support
 * - Smooth animations and transitions
 * - Memory-efficient rendering for medium datasets
 */
export class CanvasRenderingStrategy extends BaseRenderingStrategy {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private currentContext: RenderingContext | null = null;
  private devicePixelRatio: number = 1;
  private animationFrameId: number | null = null;

  /**
   * Get Canvas-specific rendering capabilities
   */
  public getCapabilities(): RenderingCapabilities {
    return {
      maxNodes: 1000,
      maxEdges: 2000,
      supportedInteractions: ['zoom', 'pan', 'select', 'hover', 'click', 'drag'],
      performanceProfile: {
        renderingComplexity: 'O(n)',
        updateComplexity: 'O(1)',
        memoryComplexity: 'O(n)',
        optimalFor: ['medium datasets', 'interactive navigation', 'smooth animations']
      },
      memoryProfile: {
        baseUsage: 5, // MB
        perNode: 0.1, // MB per node
        perEdge: 0.05, // MB per edge
        peakMultiplier: 1.2 // 20% overhead for rendering buffers
      },
      features: {
        edgeBundling: false, // Canvas strategy focuses on simple, fast rendering
        realTimeUpdates: true,
        hardwareAcceleration: false, // Canvas 2D is software-rendered
        animations: true
      }
    };
  }

  /**
   * Render the complete graph using Canvas 2D
   */
  public async renderAsync(
    context: RenderingContext,
    progress?: RenderingProgressCallback
  ): Promise<void> {
    try {
      // Start performance tracking
      this.startPerformanceTracking();
      this.emitRenderingEvent('started', context);

      // Validate context before rendering
      const validation = this.validateContext(context);
      if (!validation.isValid) {
        throw new Error(`Invalid rendering context: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Store context for later use
      this.currentContext = context;

      // Report preparation progress
      if (progress) {
        progress({
          stage: 'preparation',
          percentage: 0,
          message: 'Setting up Canvas',
          metrics: {
            renderTime: 0,
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 60,
            nodesRendered: 0,
            edgesRendered: 0
          }
        });
      }

      // Initialize canvas if not already done
      await this.initializeCanvas(context);
      
      // Clear canvas for fresh render
      this.clearCanvas();
      
      // Apply viewport transformations
      this.applyViewportTransform(context.viewport);

      // Report nodes rendering progress
      if (progress) {
        progress({
          stage: 'nodes',
          percentage: 25,
          message: 'Rendering nodes',
          metrics: {
            renderTime: performance.now() - (this._performanceStartTime || 0),
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 60,
            nodesRendered: 0,
            edgesRendered: 0
          }
        });
      }

      // Render edges first (so they appear behind nodes)
      await this.renderEdges(context);

      // Report edges rendering progress
      if (progress) {
        progress({
          stage: 'edges',
          percentage: 60,
          message: 'Rendering edges',
          metrics: {
            renderTime: performance.now() - (this._performanceStartTime || 0),
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 55,
            nodesRendered: 0,
            edgesRendered: context.edges.length
          }
        });
      }

      // Render nodes
      await this.renderNodes(context);

      // Report post-processing progress
      if (progress) {
        progress({
          stage: 'post-processing',
          percentage: 100,
          message: 'Finalizing render',
          metrics: {
            renderTime: performance.now() - (this._performanceStartTime || 0),
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 60,
            nodesRendered: context.nodes.size,
            edgesRendered: context.edges.length
          }
        });
      }

      // Mark as initialized and emit events
      this.markAsInitialized();
      this.emitEvent('rendered', { context, timestamp: Date.now() });
      this.emitRenderingEvent('completed', context);

      // End performance tracking
      this.endPerformanceTracking('render', {
        nodeCount: context.nodes.size,
        edgeCount: context.edges.length
      });

    } catch (error) {
      this.emitRenderingEvent('failed', context, error as Error);
      this.emitEvent('error', error);
      throw error;
    }
  }

  /**
   * Clean up Canvas resources
   */
  public async cleanupAsync(): Promise<void> {
    await this.safeCleanup(async () => {
      // Cancel any pending animation frames
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }

      // Remove canvas from DOM
      if (this.canvas && this.canvas.parentNode) {
        this.canvas.parentNode.removeChild(this.canvas);
      }

      // Clear references
      this.canvas = null;
      this.ctx = null;
      this.currentContext = null;

      // Call parent cleanup
      this.dispose();
    });
  }

  /**
   * Handle user interaction events
   */
  public handleInteraction(event: InteractionEvent): boolean {
    if (!this.canvas || !this.currentContext) {
      return false;
    }

    try {
      const canvasRect = this.canvas.getBoundingClientRect();
      const canvasX = (event.coordinates.x - canvasRect.left) * this.devicePixelRatio;
      const canvasY = (event.coordinates.y - canvasRect.top) * this.devicePixelRatio;

      // Convert canvas coordinates to graph coordinates
      const graphCoords = this.canvasToGraphCoordinates({ x: canvasX, y: canvasY });

      // Perform hit testing to find clicked/hovered nodes
      const hitNode = this.hitTestNodes(graphCoords);

      // Emit interaction event with results
      this.emitEvent('interaction', {
        ...event,
        target: hitNode?.id,
        graphCoordinates: graphCoords
      });

      // Handle specific interaction types
      switch (event.type) {
        case 'click':
        case 'select':
          if (hitNode) {
            this.handleNodeSelection(hitNode.id);
          }
          break;
        
        case 'hover':
          if (hitNode) {
            this.handleNodeHover(hitNode.id);
          }
          break;
      }

      return true;
    } catch (error) {
      this.emitEvent('error', error);
      return false;
    }
  }

  /**
   * Update visual properties without full re-render
   */
  public async updateVisualsAsync(updates: VisualUpdates): Promise<void> {
    if (!this.currentContext) {
      return;
    }

    try {
      // Update current context with new data
      if (updates.viewport) {
        Object.assign(this.currentContext.viewport, updates.viewport);
      }

      if (updates.nodes) {
        // Update node positions and properties
        for (const [nodeId, nodeUpdate] of updates.nodes) {
          const node = this.currentContext.nodes.get(nodeId);
          if (node && nodeUpdate.position) {
            node.x = nodeUpdate.position.x;
            node.y = nodeUpdate.position.y;
          }
        }
      }

      // Use requestAnimationFrame for smooth updates
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }

      this.animationFrameId = requestAnimationFrame(() => {
        this.rerenderCanvas();
      });

      this.emitEvent('visualsUpdated', updates);
    } catch (error) {
      this.emitEvent('error', error);
      throw error;
    }
  }

  /**
   * Validate Canvas-specific configuration
   */
  public validateConfiguration(config: RenderingConfig): ValidationResult {
    const errors = [];
    const warnings = [];

    // Validate canvas options
    if (config.strategyOptions?.canvas) {
      const canvasOptions = config.strategyOptions.canvas;
      
      if (canvasOptions.contextType && !['2d', 'webgl'].includes(canvasOptions.contextType)) {
        errors.push({
          field: 'strategyOptions.canvas.contextType',
          message: 'Canvas context type must be "2d" or "webgl"',
          code: 'INVALID_CONTEXT_TYPE'
        });
      }
    }

    // Check browser support
    const domValidation = this.validateDOMSupport(['HTMLCanvasElement.prototype.getContext']);
    if (!domValidation.isValid) {
      errors.push(...domValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Initialize Canvas element and 2D context
   */
  private async initializeCanvas(context: RenderingContext): Promise<void> {
    if (this.canvas) {
      return; // Already initialized
    }

    // Create canvas element
    this.canvas = document.createElement('canvas');
    if (!this.canvas) {
      throw new Error('Failed to create canvas element');
    }

    // Get device pixel ratio for high-DPI displays
    this.devicePixelRatio = context.config.strategyOptions?.canvas?.highDPI 
      ? (window.devicePixelRatio || 1) 
      : 1;

    // Get container dimensions
    const containerRect = context.container.getBoundingClientRect();
    const width = containerRect.width || 800;
    const height = containerRect.height || 600;

    // Set canvas dimensions (accounting for device pixel ratio)
    this.canvas.width = width * this.devicePixelRatio;
    this.canvas.height = height * this.devicePixelRatio;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Get 2D context
    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    // Configure context properties
    if (context.config.strategyOptions?.canvas?.imageSmoothingEnabled !== undefined) {
      this.ctx.imageSmoothingEnabled = context.config.strategyOptions.canvas.imageSmoothingEnabled;
    }

    // Scale context for high-DPI displays
    if (this.devicePixelRatio !== 1) {
      this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
    }

    // Append canvas to container
    context.container.appendChild(this.canvas);
  }

  /**
   * Clear the entire canvas
   */
  private clearCanvas(): void {
    if (!this.ctx || !this.canvas) return;

    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  /**
   * Apply viewport transformations (zoom and pan)
   */
  private applyViewportTransform(viewport: any): void {
    if (!this.ctx) return;

    this.ctx.save();
    this.ctx.setTransform(
      viewport.zoomLevel, 0, 0, viewport.zoomLevel,
      viewport.panOffset.x, viewport.panOffset.y
    );
  }

  /**
   * Render all nodes as circles
   */
  private async renderNodes(context: RenderingContext): Promise<void> {
    if (!this.ctx) return;

    const nodeConfig = context.config.visual.nodes;
    
    for (const [nodeId, node] of context.nodes) {
      const isSelected = context.viewport.selectedNodeId === nodeId;
      const isHighlighted = context.viewport.highlightedNodeIds.has(nodeId);
      
      // Determine visual properties
      const radius = nodeConfig.defaultRadius;
      const fillColor = node.data?.color || nodeConfig.defaultFillColor;
      const strokeColor = nodeConfig.defaultStrokeColor;
      const opacity = isSelected ? nodeConfig.selectedOpacity : 
                     isHighlighted ? nodeConfig.highlightedOpacity : 
                     nodeConfig.opacity;

      // Draw node
      this.ctx.save();
      this.ctx.globalAlpha = opacity;
      
      // Fill circle
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      this.ctx.fillStyle = fillColor;
      this.ctx.fill();

      // Stroke circle
      this.ctx.lineWidth = nodeConfig.strokeWidth;
      this.ctx.strokeStyle = strokeColor;
      this.ctx.stroke();
      
      this.ctx.restore();
    }
  }

  /**
   * Render all edges as lines
   */
  private async renderEdges(context: RenderingContext): Promise<void> {
    if (!this.ctx) return;

    const edgeConfig = context.config.visual.edges;
    
    this.ctx.save();
    this.ctx.strokeStyle = edgeConfig.defaultStrokeColor;
    this.ctx.lineWidth = edgeConfig.defaultStrokeWidth;
    this.ctx.globalAlpha = edgeConfig.opacity;

    for (const edge of context.edges) {
      const sourceNode = context.nodes.get(edge.sourceId);
      const targetNode = context.nodes.get(edge.targetId);

      if (sourceNode && targetNode) {
        this.ctx.beginPath();
        this.ctx.moveTo(sourceNode.x, sourceNode.y);
        this.ctx.lineTo(targetNode.x, targetNode.y);
        this.ctx.stroke();
      }
    }

    this.ctx.restore();
  }

  /**
   * Convert canvas coordinates to graph coordinates
   */
  private canvasToGraphCoordinates(canvasCoords: Point2D): Point2D {
    if (!this.currentContext) {
      return canvasCoords;
    }

    const viewport = this.currentContext.viewport;
    return {
      x: (canvasCoords.x - viewport.panOffset.x) / viewport.zoomLevel,
      y: (canvasCoords.y - viewport.panOffset.y) / viewport.zoomLevel
    };
  }

  /**
   * Perform hit testing to find nodes at given coordinates
   */
  private hitTestNodes(graphCoords: Point2D): LayoutNode | null {
    if (!this.currentContext) return null;

    const nodeRadius = this.currentContext.config.visual.nodes.defaultRadius;
    
    for (const [nodeId, node] of this.currentContext.nodes) {
      const dx = graphCoords.x - node.x;
      const dy = graphCoords.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nodeRadius) {
        return node;
      }
    }

    return null;
  }

  /**
   * Handle node selection
   */
  private handleNodeSelection(nodeId: string): void {
    if (!this.currentContext) return;

    // Update viewport state
    this.currentContext.viewport.selectedNodeId = nodeId;
    
    // Re-render to show selection
    this.rerenderCanvas();
    
    this.emitEvent('nodeSelected', { nodeId, timestamp: Date.now() });
  }

  /**
   * Handle node hover
   */
  private handleNodeHover(nodeId: string): void {
    if (!this.currentContext) return;

    // Update hover state if needed
    this.emitEvent('nodeHovered', { nodeId, timestamp: Date.now() });
  }

  /**
   * Re-render the canvas with current state
   */
  private rerenderCanvas(): void {
    if (!this.currentContext) return;

    try {
      this.clearCanvas();
      this.applyViewportTransform(this.currentContext.viewport);
      
      // Render in correct order (edges first, then nodes)
      this.renderEdges(this.currentContext);
      this.renderNodes(this.currentContext);
    } catch (error) {
      this.emitEvent('error', error);
    }
  }
}