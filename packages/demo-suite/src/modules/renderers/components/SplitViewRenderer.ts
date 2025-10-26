/**
 * Split View Renderer Component
 *
 * Manages synchronized display of multiple renderers side-by-side,
 * demonstrating identical graph visualization across SVG, Canvas, and WebGL engines.
 */

import type { RendererType, RendererMetrics } from '../RendererComparison.js';
import type { InteractionEvent } from '../../../shared/DemoModule.js';

export interface GraphDataset {
  nodes: Array<{
    id: string;
    x?: number;
    y?: number;
    radius?: number;
    color?: string;
    label?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight?: number;
    color?: string;
    width?: number;
  }>;
  metadata: {
    name: string;
    description: string;
    nodeCount: number;
    edgeCount: number;
    complexity: 'low' | 'medium' | 'high';
  };
}

export interface VisualProperties {
  zoomLevel: number;
  edgeOpacity: number;
  nodeScale: number;
}

export interface RendererInstance {
  type: RendererType;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D | WebGLRenderingContext | null;
  isActive: boolean;
  metrics: RendererMetrics;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

/**
 * Event emitter interface for split view renderer events
 */
export interface SplitViewEvents {
  rendererStateChange: (renderer: RendererType, active: boolean) => void;
  interactionSync: (event: InteractionEvent) => void;
  metricsUpdate: (metrics: Record<string, RendererMetrics>) => void;
}

/**
 * SplitViewRenderer manages multiple rendering engines displaying identical graphs
 */
export class SplitViewRenderer {
  private container: HTMLElement;
  private renderers: Map<RendererType, RendererInstance> = new Map();
  private currentDataset: GraphDataset | null = null;
  private syncInteractions = true;
  private visualProperties: VisualProperties = {
    zoomLevel: 1.0,
    edgeOpacity: 0.6,
    nodeScale: 1.0
  };
  private eventListeners: Map<keyof SplitViewEvents, Set<Function>> = new Map();

  private isInitialized = false;
  private animationFrame: number | null = null;
  private lastUpdateTime = 0;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.createSplitLayout();
    await this.initializeRenderers();
    this.setupInteractionHandlers();

    this.isInitialized = true;
  }

  public async loadDataset(dataset: GraphDataset): Promise<void> {
    this.currentDataset = dataset;

    // Load data into each active renderer
    for (const [type, renderer] of this.renderers) {
      if (renderer.isActive) {
        await this.loadDatasetIntoRenderer(renderer, dataset);
      }
    }

    this.render();
  }

  public setEnabledRenderers(rendererTypes: RendererType[]): void {
    // Update renderer visibility and state
    for (const [type, renderer] of this.renderers) {
      const shouldBeActive = rendererTypes.includes(type);
      const wasActive = renderer.isActive;

      renderer.isActive = shouldBeActive;
      renderer.canvas.style.display = shouldBeActive ? 'block' : 'none';

      if (shouldBeActive !== wasActive) {
        this.emit('rendererStateChange', type, shouldBeActive);

        // Load current dataset if renderer was just activated
        if (shouldBeActive && this.currentDataset) {
          this.loadDatasetIntoRenderer(renderer, this.currentDataset);
        }
      }
    }

    this.updateLayout();
    this.render();
  }

  public setSyncInteractions(sync: boolean): void {
    this.syncInteractions = sync;
  }

  public updateVisualProperties(properties: Partial<VisualProperties>): void {
    this.visualProperties = { ...this.visualProperties, ...properties };

    // Apply visual property changes to all active renderers
    for (const [type, renderer] of this.renderers) {
      if (renderer.isActive) {
        this.applyVisualProperties(renderer);
      }
    }

    this.render();
  }

  public async render(): Promise<void> {
    if (!this.isInitialized) return;

    const now = performance.now();
    const deltaTime = now - this.lastUpdateTime;

    // Render each active renderer
    for (const [type, renderer] of this.renderers) {
      if (renderer.isActive && this.currentDataset) {
        const startTime = performance.now();
        await this.renderGraph(renderer, this.currentDataset);
        const renderTime = performance.now() - startTime;

        // Update renderer metrics
        renderer.metrics.renderTime = renderTime;
        renderer.metrics.fps = deltaTime > 0 ? 1000 / deltaTime : 0;
        renderer.metrics.lastUpdate = now;
      }
    }

    this.lastUpdateTime = now;
    this.emitMetricsUpdate();
  }

  public onResize(width: number, height: number): void {
    this.updateLayout();

    // Resize all canvases
    for (const [type, renderer] of this.renderers) {
      this.resizeRenderer(renderer);
    }

    this.render();
  }

  public onInteraction(event: InteractionEvent): void {
    if (this.syncInteractions) {
      // Apply interaction to all active renderers
      for (const [type, renderer] of this.renderers) {
        if (renderer.isActive) {
          this.applyInteraction(renderer, event);
        }
      }

      this.emit('interactionSync', event);
      this.render();
    }
  }

  public cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Cleanup renderer resources
    for (const [type, renderer] of this.renderers) {
      this.cleanupRenderer(renderer);
    }

    this.renderers.clear();
    this.eventListeners.clear();
    this.isInitialized = false;
  }

  // Event emitter methods
  public on<K extends keyof SplitViewEvents>(event: K, callback: SplitViewEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off<K extends keyof SplitViewEvents>(event: K, callback: SplitViewEvents[K]): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof SplitViewEvents>(event: K, ...args: Parameters<SplitViewEvents[K]>): void {
    this.eventListeners.get(event)?.forEach(callback => {
      (callback as Function)(...args);
    });
  }

  private createSplitLayout(): void {
    this.container.innerHTML = `
      <div class="split-view-container">
        <!-- SVG Renderer Panel -->
        <div class="renderer-panel" data-renderer="svg">
          <div class="renderer-header">
            <h3>SVG Renderer</h3>
            <div class="renderer-info">
              <span class="renderer-tag">Vector</span>
              <div class="renderer-metrics">
                <span class="fps-display">-- FPS</span>
                <span class="memory-display">-- MB</span>
              </div>
            </div>
          </div>
          <div class="renderer-viewport">
            <canvas class="renderer-canvas" data-type="svg"></canvas>
          </div>
        </div>

        <!-- Canvas Renderer Panel -->
        <div class="renderer-panel" data-renderer="canvas">
          <div class="renderer-header">
            <h3>Canvas Renderer</h3>
            <div class="renderer-info">
              <span class="renderer-tag">2D Context</span>
              <div class="renderer-metrics">
                <span class="fps-display">-- FPS</span>
                <span class="memory-display">-- MB</span>
              </div>
            </div>
          </div>
          <div class="renderer-viewport">
            <canvas class="renderer-canvas" data-type="canvas"></canvas>
          </div>
        </div>

        <!-- WebGL Renderer Panel -->
        <div class="renderer-panel" data-renderer="webgl">
          <div class="renderer-header">
            <h3>WebGL Renderer</h3>
            <div class="renderer-info">
              <span class="renderer-tag">GPU</span>
              <div class="renderer-metrics">
                <span class="fps-display">-- FPS</span>
                <span class="memory-display">-- MB</span>
              </div>
            </div>
          </div>
          <div class="renderer-viewport">
            <canvas class="renderer-canvas" data-type="webgl"></canvas>
          </div>
        </div>
      </div>
    `;

    this.applySplitViewStyling();
  }

  private applySplitViewStyling(): void {
    const style = document.createElement('style');
    style.textContent = `
      .split-view-container {
        display: flex;
        height: 100%;
        width: 100%;
        background: var(--color-gray-900);
        border-radius: var(--radius-base);
        overflow: hidden;
      }

      .renderer-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        border-right: 2px solid var(--color-gray-700);
        background: var(--color-gray-800);
        position: relative;
      }

      .renderer-panel:last-child {
        border-right: none;
      }

      .renderer-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) var(--space-4);
        background: linear-gradient(135deg, var(--color-gray-700), var(--color-gray-600));
        border-bottom: 1px solid var(--color-gray-600);
        min-height: 60px;
      }

      .renderer-header h3 {
        margin: 0;
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .renderer-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: var(--space-1);
      }

      .renderer-tag {
        font-size: var(--font-size-xs);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-weight: var(--font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .renderer-panel[data-renderer="svg"] .renderer-tag {
        background: rgba(16, 124, 16, 0.2);
        color: var(--color-primary);
        border: 1px solid var(--color-primary);
      }

      .renderer-panel[data-renderer="canvas"] .renderer-tag {
        background: rgba(0, 188, 242, 0.2);
        color: var(--color-secondary);
        border: 1px solid var(--color-secondary);
      }

      .renderer-panel[data-renderer="webgl"] .renderer-tag {
        background: rgba(255, 185, 0, 0.2);
        color: var(--color-accent);
        border: 1px solid var(--color-accent);
      }

      .renderer-metrics {
        display: flex;
        gap: var(--space-2);
        font-family: var(--font-family-mono);
        font-size: var(--font-size-xs);
      }

      .fps-display, .memory-display {
        color: var(--color-text-secondary);
      }

      .renderer-viewport {
        flex: 1;
        position: relative;
        background: var(--color-black);
        overflow: hidden;
      }

      .renderer-canvas {
        width: 100%;
        height: 100%;
        display: block;
        cursor: grab;
      }

      .renderer-canvas:active {
        cursor: grabbing;
      }

      /* Gaming-inspired active state */
      .renderer-panel[data-renderer="svg"].active .renderer-header {
        border-bottom-color: var(--color-primary);
        box-shadow: 0 0 10px rgba(16, 124, 16, 0.3);
      }

      .renderer-panel[data-renderer="canvas"].active .renderer-header {
        border-bottom-color: var(--color-secondary);
        box-shadow: 0 0 10px rgba(0, 188, 242, 0.3);
      }

      .renderer-panel[data-renderer="webgl"].active .renderer-header {
        border-bottom-color: var(--color-accent);
        box-shadow: 0 0 10px rgba(255, 185, 0, 0.3);
      }

      /* Responsive layout */
      @media (max-width: 1200px) {
        .split-view-container {
          flex-direction: column;
        }

        .renderer-panel {
          border-right: none;
          border-bottom: 2px solid var(--color-gray-700);
        }

        .renderer-panel:last-child {
          border-bottom: none;
        }

        .renderer-header {
          min-height: 50px;
          padding: var(--space-2) var(--space-3);
        }
      }

      /* Single column mobile layout */
      @media (max-width: 640px) {
        .renderer-info {
          align-items: flex-start;
        }

        .renderer-metrics {
          flex-direction: column;
          gap: var(--space-1);
        }
      }
    `;

    document.head.appendChild(style);
  }

  private async initializeRenderers(): Promise<void> {
    const canvases = this.container.querySelectorAll('.renderer-canvas') as NodeListOf<HTMLCanvasElement>;

    for (const canvas of canvases) {
      const type = canvas.dataset.type as RendererType;
      let context: CanvasRenderingContext2D | WebGLRenderingContext | null = null;

      try {
        // Initialize appropriate context based on renderer type
        switch (type) {
          case 'svg':
            // For SVG, we'll use Canvas 2D context for demonstration
            context = canvas.getContext('2d');
            break;
          case 'canvas':
            context = canvas.getContext('2d');
            break;
          case 'webgl':
            context = canvas.getContext('webgl2') || canvas.getContext('webgl');
            break;
        }

        const renderer: RendererInstance = {
          type,
          canvas,
          context,
          isActive: true, // Start with all renderers active
          metrics: {
            fps: 0,
            memoryUsage: 0,
            drawCalls: 0,
            renderTime: 0,
            updateTime: 0,
            isActive: true
          },
          viewport: {
            x: 0,
            y: 0,
            scale: 1
          }
        };

        this.renderers.set(type, renderer);
        this.resizeRenderer(renderer);

      } catch (error) {
        console.warn(`Failed to initialize ${type} renderer:`, error);
        // Create fallback renderer instance
        this.renderers.set(type, {
          type,
          canvas,
          context: null,
          isActive: false,
          metrics: {
            fps: 0,
            memoryUsage: 0,
            drawCalls: 0,
            renderTime: 0,
            updateTime: 0,
            isActive: false
          },
          viewport: { x: 0, y: 0, scale: 1 }
        });
      }
    }
  }

  private setupInteractionHandlers(): void {
    for (const [type, renderer] of this.renderers) {
      const canvas = renderer.canvas;

      // Mouse events
      canvas.addEventListener('mousedown', this.handleMouseDown.bind(this, type));
      canvas.addEventListener('mousemove', this.handleMouseMove.bind(this, type));
      canvas.addEventListener('mouseup', this.handleMouseUp.bind(this, type));
      canvas.addEventListener('wheel', this.handleWheel.bind(this, type));

      // Touch events
      canvas.addEventListener('touchstart', this.handleTouchStart.bind(this, type));
      canvas.addEventListener('touchmove', this.handleTouchMove.bind(this, type));
      canvas.addEventListener('touchend', this.handleTouchEnd.bind(this, type));
    }
  }

  private async loadDatasetIntoRenderer(renderer: RendererInstance, dataset: GraphDataset): Promise<void> {
    if (!renderer.context || !renderer.isActive) return;

    // Generate layout positions if not provided
    this.generateLayout(dataset);

    // Renderer-specific loading logic would go here
    // For demonstration, we'll set up the renderer state
    console.log(`Loading ${dataset.metadata.name} into ${renderer.type} renderer`);
  }

  private generateLayout(dataset: GraphDataset): void {
    // Simple circle layout for demonstration
    const centerX = 400;
    const centerY = 300;
    const radius = 200;

    dataset.nodes.forEach((node, index) => {
      const angle = (index / dataset.nodes.length) * 2 * Math.PI;
      node.x = centerX + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
      node.radius = node.radius || 5;
      node.color = node.color || '#4A90E2';
    });
  }

  private async renderGraph(renderer: RendererInstance, dataset: GraphDataset): Promise<void> {
    const { context, canvas, viewport, type } = renderer;
    if (!context) return;

    const startTime = performance.now();

    // Clear canvas
    if (context instanceof CanvasRenderingContext2D) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      await this.renderCanvas2D(context, canvas, dataset, viewport);
    } else if (context instanceof WebGLRenderingContext || context instanceof WebGL2RenderingContext) {
      context.clear(context.COLOR_BUFFER_BIT);
      await this.renderWebGL(context, canvas, dataset, viewport);
    }

    // Update draw calls metric
    renderer.metrics.drawCalls++;
    renderer.metrics.updateTime = performance.now() - startTime;
  }

  private async renderCanvas2D(
    context: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    dataset: GraphDataset,
    viewport: { x: number; y: number; scale: number }
  ): Promise<void> {
    context.save();

    // Apply viewport transformation
    context.translate(viewport.x, viewport.y);
    context.scale(viewport.scale, viewport.scale);

    // Render edges first
    context.globalAlpha = this.visualProperties.edgeOpacity;
    context.strokeStyle = '#666';
    context.lineWidth = 1;

    dataset.edges.forEach(edge => {
      const sourceNode = dataset.nodes.find(n => n.id === edge.source);
      const targetNode = dataset.nodes.find(n => n.id === edge.target);

      if (sourceNode && targetNode && sourceNode.x !== undefined && sourceNode.y !== undefined &&
          targetNode.x !== undefined && targetNode.y !== undefined) {
        context.beginPath();
        context.moveTo(sourceNode.x, sourceNode.y);
        context.lineTo(targetNode.x, targetNode.y);
        context.stroke();
      }
    });

    // Render nodes
    context.globalAlpha = 1.0;
    dataset.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined && node.radius !== undefined) {
        const radius = node.radius * this.visualProperties.nodeScale;

        context.fillStyle = node.color || '#4A90E2';
        context.beginPath();
        context.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        context.fill();

        // Add subtle border
        context.strokeStyle = '#fff';
        context.lineWidth = 1;
        context.stroke();
      }
    });

    context.restore();
  }

  private async renderWebGL(
    context: WebGLRenderingContext | WebGL2RenderingContext,
    canvas: HTMLCanvasElement,
    dataset: GraphDataset,
    viewport: { x: number; y: number; scale: number }
  ): Promise<void> {
    // WebGL rendering implementation
    // This would include shader programs, vertex buffers, etc.
    // For demonstration, we'll use a simple approach

    context.clearColor(0.0, 0.0, 0.0, 1.0);
    context.clear(context.COLOR_BUFFER_BIT);

    // Note: A full WebGL implementation would require:
    // - Vertex and fragment shaders
    // - Vertex buffer objects
    // - Uniform matrices for transformations
    // - Proper batch rendering for performance
  }

  private applyVisualProperties(renderer: RendererInstance): void {
    // Apply current visual properties to the renderer
    // This would update shader uniforms for WebGL, or set context properties for Canvas
  }

  private applyInteraction(renderer: RendererInstance, event: InteractionEvent): void {
    const viewport = renderer.viewport;

    switch (event.type) {
      case 'pan':
        if (event.deltaX !== undefined && event.deltaY !== undefined) {
          viewport.x += event.deltaX;
          viewport.y += event.deltaY;
        }
        break;

      case 'zoom':
        if (event.scale !== undefined) {
          const prevScale = viewport.scale;
          viewport.scale = Math.max(0.1, Math.min(5.0, viewport.scale * event.scale));

          // Adjust position to zoom towards mouse cursor
          const scaleChange = viewport.scale / prevScale;
          viewport.x = event.x - (event.x - viewport.x) * scaleChange;
          viewport.y = event.y - (event.y - viewport.y) * scaleChange;
        }
        break;
    }
  }

  private resizeRenderer(renderer: RendererInstance): void {
    const canvas = renderer.canvas;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale context for crisp rendering
    if (renderer.context instanceof CanvasRenderingContext2D) {
      renderer.context.scale(dpr, dpr);
    } else if (renderer.context instanceof WebGLRenderingContext || renderer.context instanceof WebGL2RenderingContext) {
      renderer.context.viewport(0, 0, canvas.width, canvas.height);
    }
  }

  private updateLayout(): void {
    // Update the flex layout based on active renderers
    const activePanels = Array.from(this.container.querySelectorAll('.renderer-panel')).filter(panel => {
      const renderer = panel.getAttribute('data-renderer') as RendererType;
      return this.renderers.get(renderer)?.isActive;
    });

    // Show/hide panels based on active renderers
    for (const panel of this.container.querySelectorAll('.renderer-panel')) {
      const renderer = panel.getAttribute('data-renderer') as RendererType;
      const rendererInstance = this.renderers.get(renderer);

      if (rendererInstance) {
        (panel as HTMLElement).style.display = rendererInstance.isActive ? 'flex' : 'none';
        panel.classList.toggle('active', rendererInstance.isActive);
      }
    }
  }

  private emitMetricsUpdate(): void {
    const metricsMap: Record<string, RendererMetrics> = {};

    for (const [type, renderer] of this.renderers) {
      metricsMap[type] = { ...renderer.metrics };

      // Update display
      const panel = this.container.querySelector(`.renderer-panel[data-renderer="${type}"]`);
      if (panel) {
        const fpsDisplay = panel.querySelector('.fps-display');
        const memoryDisplay = panel.querySelector('.memory-display');

        if (fpsDisplay) {
          fpsDisplay.textContent = `${Math.round(renderer.metrics.fps)} FPS`;
        }

        if (memoryDisplay) {
          const memoryMB = renderer.metrics.memoryUsage / 1024 / 1024;
          memoryDisplay.textContent = `${memoryMB.toFixed(1)} MB`;
        }
      }
    }

    this.emit('metricsUpdate', metricsMap);
  }

  private cleanupRenderer(renderer: RendererInstance): void {
    // Cleanup renderer-specific resources
    if (renderer.context instanceof WebGLRenderingContext || renderer.context instanceof WebGL2RenderingContext) {
      // Clean up WebGL resources (buffers, textures, programs)
    }
  }

  // Interaction event handlers
  private handleMouseDown(rendererType: RendererType, event: MouseEvent): void {
    this.onInteraction({
      type: 'pan',
      x: event.clientX,
      y: event.clientY,
      originalEvent: event
    });
  }

  private handleMouseMove(rendererType: RendererType, event: MouseEvent): void {
    if (event.buttons === 1) { // Left mouse button down
      this.onInteraction({
        type: 'pan',
        x: event.clientX,
        y: event.clientY,
        deltaX: event.movementX,
        deltaY: event.movementY,
        originalEvent: event
      });
    }
  }

  private handleMouseUp(rendererType: RendererType, event: MouseEvent): void {
    // End pan interaction
  }

  private handleWheel(rendererType: RendererType, event: WheelEvent): void {
    event.preventDefault();

    const scale = event.deltaY > 0 ? 0.9 : 1.1;

    this.onInteraction({
      type: 'zoom',
      x: event.clientX,
      y: event.clientY,
      scale,
      originalEvent: event
    });
  }

  private handleTouchStart(rendererType: RendererType, event: TouchEvent): void {
    event.preventDefault();
    // Touch interaction handling
  }

  private handleTouchMove(rendererType: RendererType, event: TouchEvent): void {
    event.preventDefault();
    // Touch interaction handling
  }

  private handleTouchEnd(rendererType: RendererType, event: TouchEvent): void {
    event.preventDefault();
    // Touch interaction handling
  }
}