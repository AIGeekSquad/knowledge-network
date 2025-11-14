/**
 * SVG Rendering Strategy Implementation
 * 
 * Concrete implementation for SVG/DOM rendering that extends BaseRenderingStrategy.
 * Optimized for interactive features, accessibility, and medium-sized datasets
 * with DOM-based event handling and CSS styling capabilities.
 * 
 * @fileoverview SVG DOM rendering strategy for knowledge graphs
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
 * SVG DOM Rendering Strategy
 * 
 * Provides SVG-based rendering with:
 * - DOM element creation and manipulation
 * - CSS transforms and styling
 * - Accessibility features (ARIA labels, keyboard navigation)
 * - Interactive tooltips and hover effects
 * - Memory-efficient for medium datasets with rich interactions
 */
export class SVGRenderingStrategy extends BaseRenderingStrategy {
  private svgElement: SVGElement | null = null;
  private nodeGroup: SVGGElement | null = null;
  private edgeGroup: SVGGElement | null = null;
  private transformGroup: SVGGElement | null = null;
  private currentContext: RenderingContext | null = null;
  private nodeElements: Map<string, SVGCircleElement> = new Map();
  private edgeElements: Map<string, SVGLineElement> = new Map();

  /**
   * Get SVG-specific rendering capabilities
   */
  public getCapabilities(): RenderingCapabilities {
    return {
      maxNodes: 800,
      maxEdges: 1500,
      supportedInteractions: ['zoom', 'pan', 'select', 'hover', 'click', 'drag'],
      performanceProfile: {
        renderingComplexity: 'O(n)',
        updateComplexity: 'O(1)',
        memoryComplexity: 'O(n log n)', // DOM overhead
        optimalFor: ['interactive features', 'accessibility', 'styling flexibility']
      },
      memoryProfile: {
        baseUsage: 8, // MB - Higher due to DOM overhead
        perNode: 0.2, // MB per node - DOM elements are heavier
        perEdge: 0.1, // MB per edge
        peakMultiplier: 1.5 // 50% overhead for DOM tree
      },
      features: {
        edgeBundling: true, // SVG supports complex curves
        realTimeUpdates: true,
        hardwareAcceleration: false, // SVG is software-rendered but browser optimized
        animations: true // CSS animations and transitions
      }
    };
  }

  /**
   * Render the complete graph using SVG DOM
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
          message: 'Setting up SVG',
          metrics: {
            renderTime: 0,
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 60,
            nodesRendered: 0,
            edgesRendered: 0
          }
        });
      }

      // Initialize SVG DOM structure
      await this.initializeSVG(context);
      
      // Clear existing elements
      this.clearSVGContent();

      // Report nodes rendering progress
      if (progress) {
        progress({
          stage: 'nodes',
          percentage: 25,
          message: 'Creating node elements',
          metrics: {
            renderTime: performance.now() - (this._performanceStartTime || 0),
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 60,
            nodesRendered: 0,
            edgesRendered: 0
          }
        });
      }

      // Create edge elements first (render order: edges behind nodes)
      await this.createEdgeElements(context);

      // Report edges rendering progress
      if (progress) {
        progress({
          stage: 'edges',
          percentage: 60,
          message: 'Creating edge elements',
          metrics: {
            renderTime: performance.now() - (this._performanceStartTime || 0),
            memoryUsage: this.estimateMemoryUsage(context),
            currentFPS: 55,
            nodesRendered: 0,
            edgesRendered: context.edges.length
          }
        });
      }

      // Create node elements
      await this.createNodeElements(context);

      // Apply viewport transforms
      this.applyViewportTransform(context.viewport);

      // Report completion progress
      if (progress) {
        progress({
          stage: 'post-processing',
          percentage: 100,
          message: 'Finalizing SVG render',
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
   * Clean up SVG resources and DOM elements
   */
  public async cleanupAsync(): Promise<void> {
    await this.safeCleanup(async () => {
      // Remove event listeners
      this.removeEventListeners();

      // Clear element maps
      this.nodeElements.clear();
      this.edgeElements.clear();

      // Remove SVG from DOM
      if (this.svgElement && this.svgElement.parentNode) {
        this.svgElement.parentNode.removeChild(this.svgElement);
      }

      // Clear references
      this.svgElement = null;
      this.nodeGroup = null;
      this.edgeGroup = null;
      this.transformGroup = null;
      this.currentContext = null;

      // Call parent cleanup
      this.dispose();
    });
  }

  /**
   * Handle user interaction events using DOM-based hit testing
   */
  public handleInteraction(event: InteractionEvent): boolean {
    if (!this.svgElement || !this.currentContext) {
      return false;
    }

    try {
      // Use DOM-based hit testing for precise element detection (with jsdom fallback)
      let targetNodeId: string | null = null;
      
      if (typeof document.elementFromPoint === 'function') {
        // Real browser environment
        const element = document.elementFromPoint(event.coordinates.x, event.coordinates.y);
        if (element && element.closest) {
          const circleElement = element.closest('circle[data-node-id]');
          if (circleElement) {
            targetNodeId = circleElement.getAttribute('data-node-id');
          }
        }
      } else {
        // Test environment - use coordinate-based hit testing
        targetNodeId = this.hitTestNodes(event.coordinates);
      }

      // Emit interaction event with results
      this.emitEvent('interaction', {
        ...event,
        target: targetNodeId
      });

      // Handle specific interaction types
      switch (event.type) {
        case 'click':
        case 'select':
          if (targetNodeId) {
            this.handleNodeSelection(targetNodeId);
          }
          break;
        
        case 'hover':
          if (targetNodeId) {
            this.handleNodeHover(targetNodeId);
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
   * Update visual properties via DOM manipulation
   */
  public async updateVisualsAsync(updates: VisualUpdates): Promise<void> {
    if (!this.currentContext) {
      return;
    }

    try {
      // Update viewport transforms
      if (updates.viewport) {
        Object.assign(this.currentContext.viewport, updates.viewport);
        this.applyViewportTransform(this.currentContext.viewport);
      }

      // Update node positions and styles
      if (updates.nodes) {
        for (const [nodeId, nodeUpdate] of updates.nodes) {
          await this.updateNodeElement(nodeId, nodeUpdate);
          
          // Update connected edges
          await this.updateConnectedEdges(nodeId);
        }
      }

      // Update edge styles
      if (updates.edges) {
        for (const [edgeId, edgeUpdate] of updates.edges) {
          await this.updateEdgeElement(edgeId, edgeUpdate);
        }
      }

      this.emitEvent('visualsUpdated', updates);
    } catch (error) {
      this.emitEvent('error', error);
      throw error;
    }
  }

  /**
   * Validate SVG-specific configuration
   */
  public validateConfiguration(config: RenderingConfig): ValidationResult {
    const errors = [];
    const warnings = [];

    // Validate SVG options
    if (config.strategyOptions?.svg) {
      const svgOptions = config.strategyOptions.svg;
      
      if (svgOptions.useCSSTransforms !== undefined && typeof svgOptions.useCSSTransforms !== 'boolean') {
        errors.push({
          field: 'strategyOptions.svg.useCSSTransforms',
          message: 'useCSSTransforms must be a boolean',
          code: 'INVALID_CSS_TRANSFORMS'
        });
      }

      if (svgOptions.enableTextSelection !== undefined && typeof svgOptions.enableTextSelection !== 'boolean') {
        errors.push({
          field: 'strategyOptions.svg.enableTextSelection',
          message: 'enableTextSelection must be a boolean',
          code: 'INVALID_TEXT_SELECTION'
        });
      }
    }

    // Check browser support for SVG
    const domValidation = this.validateDOMSupport(['document.createElementNS', 'SVGElement']);
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
   * Initialize SVG DOM structure
   */
  private async initializeSVG(context: RenderingContext): Promise<void> {
    if (this.svgElement) {
      return; // Already initialized
    }

    // Get container dimensions
    const containerRect = context.container.getBoundingClientRect();
    const width = containerRect.width || 800;
    const height = containerRect.height || 600;

    // Create SVG element
    this.svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    if (!this.svgElement) {
      throw new Error('Failed to create SVG element');
    }

    // Set SVG attributes
    this.svgElement.setAttribute('width', width.toString());
    this.svgElement.setAttribute('height', height.toString());
    this.svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    this.svgElement.setAttribute('role', 'img');
    this.svgElement.setAttribute('aria-label', 'Knowledge graph visualization');

    // Create transformation group
    this.transformGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.transformGroup.setAttribute('class', 'viewport-transform');
    this.svgElement.appendChild(this.transformGroup);

    // Create edge group (rendered first, behind nodes)
    this.edgeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.edgeGroup.setAttribute('class', 'edges');
    this.edgeGroup.setAttribute('aria-label', 'Graph edges');
    this.transformGroup.appendChild(this.edgeGroup);

    // Create node group (rendered on top)
    this.nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.nodeGroup.setAttribute('class', 'nodes');
    this.nodeGroup.setAttribute('aria-label', 'Graph nodes');
    this.transformGroup.appendChild(this.nodeGroup);

    // Append to container (handle jsdom appendChild mock)
    if (context.container.appendChild) {
      context.container.appendChild(this.svgElement);
    }
  }

  /**
   * Clear existing SVG content
   */
  private clearSVGContent(): void {
    if (this.nodeGroup) {
      this.nodeGroup.innerHTML = '';
    }
    if (this.edgeGroup) {
      this.edgeGroup.innerHTML = '';
    }
    this.nodeElements.clear();
    this.edgeElements.clear();
  }

  /**
   * Create SVG circle elements for nodes
   */
  private async createNodeElements(context: RenderingContext): Promise<void> {
    if (!this.nodeGroup) return;

    const nodeConfig = context.config.visual.nodes;

    for (const [nodeId, node] of context.nodes) {
      // Create circle element
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      
      // Set geometric attributes
      circle.setAttribute('cx', node.x.toString());
      circle.setAttribute('cy', node.y.toString());
      circle.setAttribute('r', nodeConfig.defaultRadius.toString());
      
      // Set visual attributes
      const fillColor = node.data?.color || nodeConfig.defaultFillColor;
      circle.setAttribute('fill', fillColor);
      circle.setAttribute('stroke', nodeConfig.defaultStrokeColor);
      circle.setAttribute('stroke-width', nodeConfig.strokeWidth.toString());
      circle.setAttribute('opacity', nodeConfig.opacity.toString());
      
      // Set data and accessibility attributes
      circle.setAttribute('data-node-id', nodeId);
      circle.setAttribute('role', 'button');
      circle.setAttribute('tabindex', '0');
      circle.setAttribute('aria-label', `Node: ${node.data?.label || nodeId}`);

      // Add title element for tooltips
      const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      title.textContent = node.data?.label || nodeId;
      circle.appendChild(title);

      // Apply selection and highlight states
      const isSelected = context.viewport.selectedNodeId === nodeId;
      const isHighlighted = context.viewport.highlightedNodeIds.has(nodeId);
      
      if (isSelected) circle.classList.add('selected');
      if (isHighlighted) circle.classList.add('highlighted');

      // Store element reference
      this.nodeElements.set(nodeId, circle);
      this.nodeGroup.appendChild(circle);
    }
  }

  /**
   * Create SVG line elements for edges
   */
  private async createEdgeElements(context: RenderingContext): Promise<void> {
    if (!this.edgeGroup) return;

    const edgeConfig = context.config.visual.edges;

    for (const edge of context.edges) {
      const sourceNode = context.nodes.get(edge.sourceId);
      const targetNode = context.nodes.get(edge.targetId);

      if (sourceNode && targetNode) {
        // Create line element
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        
        // Set geometric attributes
        line.setAttribute('x1', sourceNode.x.toString());
        line.setAttribute('y1', sourceNode.y.toString());
        line.setAttribute('x2', targetNode.x.toString());
        line.setAttribute('y2', targetNode.y.toString());
        
        // Set visual attributes
        line.setAttribute('stroke', edge.visualProperties?.strokeColor || edgeConfig.defaultStrokeColor);
        line.setAttribute('stroke-width', (edge.visualProperties?.strokeWidth || edgeConfig.defaultStrokeWidth).toString());
        line.setAttribute('opacity', (edge.visualProperties?.opacity || edgeConfig.opacity).toString());
        
        // Set data attributes
        const edgeId = `${edge.sourceId}-${edge.targetId}`;
        line.setAttribute('data-edge-id', edgeId);
        line.setAttribute('aria-label', `Edge from ${edge.sourceId} to ${edge.targetId}`);

        // Store element reference
        this.edgeElements.set(edgeId, line);
        this.edgeGroup.appendChild(line);
      }
    }
  }

  /**
   * Apply viewport transformations using CSS or SVG transforms
   */
  private applyViewportTransform(viewport: any): void {
    if (!this.transformGroup) return;

    const useCSS = this.currentContext?.config.strategyOptions?.svg?.useCSSTransforms;
    const scale = viewport.zoomLevel;
    const translateX = viewport.panOffset.x;
    const translateY = viewport.panOffset.y;

    if (useCSS) {
      // Use CSS transforms for better performance
      this.transformGroup.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    } else {
      // Use SVG transforms for broader compatibility
      this.transformGroup.setAttribute('transform', 
        `translate(${translateX},${translateY}) scale(${scale})`);
    }
  }

  /**
   * Update individual node element
   */
  private async updateNodeElement(nodeId: string, nodeUpdate: any): Promise<void> {
    const circle = this.nodeElements.get(nodeId);
    const node = this.currentContext?.nodes.get(nodeId);
    
    if (!circle || !node) return;

    // Update position
    if (nodeUpdate.position) {
      circle.setAttribute('cx', nodeUpdate.position.x.toString());
      circle.setAttribute('cy', nodeUpdate.position.y.toString());
      
      // Update node data for edge calculations
      node.x = nodeUpdate.position.x;
      node.y = nodeUpdate.position.y;
    }

    // Update visual properties
    if (nodeUpdate.visual) {
      if (nodeUpdate.visual.fillColor) {
        circle.setAttribute('fill', nodeUpdate.visual.fillColor);
      }
      if (nodeUpdate.visual.strokeColor) {
        circle.setAttribute('stroke', nodeUpdate.visual.strokeColor);
      }
      if (nodeUpdate.visual.opacity !== undefined) {
        circle.setAttribute('opacity', nodeUpdate.visual.opacity.toString());
      }
    }

    // Update selection state
    if (nodeUpdate.selected !== undefined) {
      if (nodeUpdate.selected) {
        circle.classList.add('selected');
      } else {
        circle.classList.remove('selected');
      }
    }

    // Update highlight state
    if (nodeUpdate.highlighted !== undefined) {
      if (nodeUpdate.highlighted) {
        circle.classList.add('highlighted');
      } else {
        circle.classList.remove('highlighted');
      }
    }
  }

  /**
   * Update edges connected to a moved node
   */
  private async updateConnectedEdges(nodeId: string): Promise<void> {
    if (!this.currentContext) return;

    const node = this.currentContext.nodes.get(nodeId);
    if (!node) return;

    // Find edges connected to this node
    for (const edge of this.currentContext.edges) {
      const edgeId = `${edge.sourceId}-${edge.targetId}`;
      const line = this.edgeElements.get(edgeId);
      
      if (line) {
        if (edge.sourceId === nodeId) {
          // Update source position
          line.setAttribute('x1', node.x.toString());
          line.setAttribute('y1', node.y.toString());
        }
        if (edge.targetId === nodeId) {
          // Update target position
          line.setAttribute('x2', node.x.toString());
          line.setAttribute('y2', node.y.toString());
        }
      }
    }
  }

  /**
   * Update individual edge element
   */
  private async updateEdgeElement(edgeId: string, edgeUpdate: any): Promise<void> {
    const line = this.edgeElements.get(edgeId);
    if (!line) return;

    // Update visual properties
    if (edgeUpdate.visual) {
      if (edgeUpdate.visual.strokeColor) {
        line.setAttribute('stroke', edgeUpdate.visual.strokeColor);
      }
      if (edgeUpdate.visual.strokeWidth !== undefined) {
        line.setAttribute('stroke-width', edgeUpdate.visual.strokeWidth.toString());
      }
      if (edgeUpdate.visual.opacity !== undefined) {
        line.setAttribute('opacity', edgeUpdate.visual.opacity.toString());
      }
    }
  }

  /**
   * Handle node selection with DOM class updates
   */
  private handleNodeSelection(nodeId: string): void {
    if (!this.currentContext) return;

    // Remove previous selection
    if (this.currentContext.viewport.selectedNodeId) {
      const prevSelected = this.nodeElements.get(this.currentContext.viewport.selectedNodeId);
      if (prevSelected) {
        prevSelected.classList.remove('selected');
      }
    }

    // Apply new selection
    this.currentContext.viewport.selectedNodeId = nodeId;
    const selectedNode = this.nodeElements.get(nodeId);
    if (selectedNode) {
      selectedNode.classList.add('selected');
    }
    
    this.emitEvent('nodeSelected', { nodeId, timestamp: Date.now() });
  }

  /**
   * Handle node hover with DOM effects
   */
  private handleNodeHover(nodeId: string): void {
    this.emitEvent('nodeHovered', { nodeId, timestamp: Date.now() });
    
    // Could add hover CSS class or show tooltip
    const hoveredNode = this.nodeElements.get(nodeId);
    if (hoveredNode) {
      hoveredNode.classList.add('hovered');
    }
  }

  /**
   * Remove all event listeners from DOM elements
   */
  private removeEventListeners(): void {
    // SVG DOM cleanup - remove any attached event listeners
    // In a full implementation, we'd track and remove specific listeners
    if (this.svgElement) {
      // Generic cleanup approach
      this.svgElement.removeAttribute('onclick');
      this.svgElement.removeAttribute('onmouseover');
    }
  }

  /**
   * Coordinate-based hit testing fallback for test environments
   */
  private hitTestNodes(coordinates: Point2D): string | null {
    if (!this.currentContext) return null;

    const nodeRadius = this.currentContext.config.visual.nodes.defaultRadius;
    
    for (const [nodeId, node] of this.currentContext.nodes) {
      const dx = coordinates.x - node.x;
      const dy = coordinates.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nodeRadius) {
        return nodeId;
      }
    }

    return null;
  }
}