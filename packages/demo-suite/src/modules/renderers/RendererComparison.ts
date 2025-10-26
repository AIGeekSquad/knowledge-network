/**
 * Renderer Comparison Module
 *
 * Demonstrates the unique multi-renderer architecture of the knowledge-network library
 * with side-by-side comparison of SVG, Canvas, and WebGL rendering engines.
 */

import type {
  DemoModule,
  ModuleState,
  ConfigOption,
  CodeExample,
  ModuleMetrics,
  InteractionEvent
} from '../../shared/DemoModule.js';
import { SplitViewRenderer } from './components/SplitViewRenderer.js';
import { QualityAssessment } from './components/QualityAssessment.js';
import { PerformanceComparison } from './components/PerformanceComparison.js';
import { createRendererTestDatasets } from './data/renderer-test-datasets.js';

export type RendererType = 'svg' | 'canvas' | 'webgl';

export interface RendererConfig {
  enabledRenderers: RendererType[];
  syncInteractions: boolean;
  showPerformanceMetrics: boolean;
  enableQualityAssessment: boolean;
  fallbackStrategy: 'graceful' | 'immediate';
  testDataset: string;
  zoomLevel: number;
  edgeOpacity: number;
  nodeScale: number;
}

export interface RendererMetrics {
  fps: number;
  memoryUsage: number;
  drawCalls: number;
  renderTime: number;
  updateTime: number;
  isActive: boolean;
}

export interface QualityMetrics {
  edgeSharpness: number;
  textClarity: number;
  colorAccuracy: number;
  zoomStability: number;
}

export interface ComparisonResult {
  renderer: RendererType;
  metrics: RendererMetrics;
  quality: QualityMetrics;
  supported: boolean;
  fallbackUsed?: RendererType;
}

/**
 * Main Renderer Comparison implementation demonstrating multi-engine architecture
 */
export class RendererComparison implements DemoModule {
  public readonly id = 'renderers';
  public readonly title = 'Renderer Comparison';
  public readonly description = 'Multi-engine architecture with SVG, Canvas, and WebGL renderers';
  public readonly difficulty = 'intermediate' as const;
  public readonly estimatedTime = '8-12 minutes';
  public readonly capabilities = [
    'Three production-ready rendering engines (SVG/Canvas/WebGL)',
    'Identical graph visualization across all renderers',
    'Real-time performance comparison and metrics',
    'Interactive quality assessment and zoom testing',
    'Graceful fallback and degradation strategies',
    'Gaming-inspired renderer selection interface'
  ];
  public readonly competitiveAdvantages = [
    'Only library with three production-ready renderers',
    'Seamless switching maintains identical interactions',
    'Graceful WebGL → Canvas → SVG fallback chain',
    'Performance-optimized renderer selection',
    'Consistent API across all rendering backends'
  ];

  private container: HTMLElement | null = null;
  private splitViewRenderer: SplitViewRenderer | null = null;
  private qualityAssessment: QualityAssessment | null = null;
  private performanceComparison: PerformanceComparison | null = null;
  private controlPanel: HTMLElement | null = null;
  private animationFrame: number | null = null;

  private _state: ModuleState = {
    isInitialized: false,
    isRunning: false,
    hasError: false,
    config: this.getDefaultConfiguration(),
    metrics: {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      renderTime: 0,
      nodeCount: 0,
      edgeCount: 0,
      lastUpdate: Date.now()
    }
  };

  public get state(): ModuleState {
    return { ...this._state };
  }

  public async initialize(container: HTMLElement): Promise<void> {
    try {
      this.container = container;

      // Create Xbox-styled layout
      this.createLayout();

      // Initialize components
      await this.initializeComponents();

      // Set up event handlers
      this.setupEventHandlers();

      // Start with initial dataset
      await this.loadTestDataset(this._state.config.testDataset as string);

      this._state.isInitialized = true;
      this._state.hasError = false;
      this._state.errorMessage = undefined;

      // Start render loop
      this.startRenderLoop();

    } catch (error) {
      this._state.hasError = true;
      this._state.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  public async render(): Promise<void> {
    if (!this._state.isInitialized || this._state.hasError) {
      return;
    }

    const startTime = performance.now();

    try {
      // Update all active renderers
      if (this.splitViewRenderer) {
        await this.splitViewRenderer.render();
      }

      // Update performance metrics
      if (this.performanceComparison) {
        this.performanceComparison.update();
      }

      // Update quality assessment
      if (this.qualityAssessment) {
        this.qualityAssessment.update();
      }

      this.updateMetrics(startTime);

    } catch (error) {
      this._state.hasError = true;
      this._state.errorMessage = error instanceof Error ? error.message : 'Render error';
      throw error;
    }
  }

  public cleanup(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.splitViewRenderer?.cleanup();
    this.qualityAssessment?.cleanup();
    this.performanceComparison?.cleanup();

    this._state.isInitialized = false;
    this._state.isRunning = false;
  }

  public updateConfiguration(config: Record<string, any>): void {
    const oldConfig = this._state.config;
    this._state.config = { ...this._state.config, ...config };

    // Handle configuration changes
    if (config.enabledRenderers && config.enabledRenderers !== oldConfig.enabledRenderers) {
      this.updateEnabledRenderers(config.enabledRenderers as RendererType[]);
    }

    if (config.testDataset && config.testDataset !== oldConfig.testDataset) {
      this.loadTestDataset(config.testDataset as string);
    }

    if (config.syncInteractions !== undefined) {
      this.splitViewRenderer?.setSyncInteractions(config.syncInteractions as boolean);
    }

    // Update visual properties
    this.updateVisualProperties();
  }

  public getConfigurationOptions(): ConfigOption[] {
    return [
      {
        id: 'enabledRenderers',
        label: 'Active Renderers',
        type: 'select',
        value: this._state.config.enabledRenderers,
        options: [
          { value: ['svg', 'canvas', 'webgl'], label: 'All Three (SVG + Canvas + WebGL)' },
          { value: ['svg', 'canvas'], label: 'SVG + Canvas' },
          { value: ['canvas', 'webgl'], label: 'Canvas + WebGL' },
          { value: ['svg', 'webgl'], label: 'SVG + WebGL' },
          { value: ['svg'], label: 'SVG Only' },
          { value: ['canvas'], label: 'Canvas Only' },
          { value: ['webgl'], label: 'WebGL Only' }
        ],
        description: 'Choose which renderers to display side-by-side'
      },
      {
        id: 'syncInteractions',
        label: 'Sync Interactions',
        type: 'toggle',
        value: this._state.config.syncInteractions,
        description: 'Synchronize pan, zoom, and selection across all renderers'
      },
      {
        id: 'showPerformanceMetrics',
        label: 'Performance Overlay',
        type: 'toggle',
        value: this._state.config.showPerformanceMetrics,
        description: 'Show real-time FPS, memory usage, and render time metrics'
      },
      {
        id: 'enableQualityAssessment',
        label: 'Quality Assessment',
        type: 'toggle',
        value: this._state.config.enableQualityAssessment,
        description: 'Enable visual quality comparison tools and zoom testing'
      },
      {
        id: 'testDataset',
        label: 'Test Dataset',
        type: 'select',
        value: this._state.config.testDataset,
        options: [
          { value: 'small-network', label: 'Small Network (50 nodes)' },
          { value: 'medium-network', label: 'Medium Network (200 nodes)' },
          { value: 'large-network', label: 'Large Network (1000 nodes)' },
          { value: 'dense-network', label: 'Dense Network (500 nodes, high connectivity)' },
          { value: 'hierarchical', label: 'Hierarchical Tree (300 nodes)' },
          { value: 'clustered', label: 'Clustered Network (400 nodes)' }
        ],
        description: 'Choose dataset to compare renderer performance and quality'
      },
      {
        id: 'fallbackStrategy',
        label: 'Fallback Strategy',
        type: 'select',
        value: this._state.config.fallbackStrategy,
        options: [
          { value: 'graceful', label: 'Graceful Degradation' },
          { value: 'immediate', label: 'Immediate Fallback' }
        ],
        description: 'How to handle renderer compatibility issues'
      },
      {
        id: 'zoomLevel',
        label: 'Zoom Level',
        type: 'slider',
        value: this._state.config.zoomLevel,
        min: 0.1,
        max: 5.0,
        step: 0.1,
        description: 'Test zoom level for quality assessment'
      },
      {
        id: 'edgeOpacity',
        label: 'Edge Opacity',
        type: 'slider',
        value: this._state.config.edgeOpacity,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        description: 'Edge transparency for visual comparison'
      },
      {
        id: 'nodeScale',
        label: 'Node Scale',
        type: 'slider',
        value: this._state.config.nodeScale,
        min: 0.5,
        max: 3.0,
        step: 0.1,
        description: 'Node size multiplier'
      }
    ];
  }

  public getCodeExamples(): CodeExample[] {
    return [
      {
        id: 'multi-renderer-setup',
        title: 'Multi-Renderer Setup',
        description: 'Initialize knowledge-network with multiple rendering engines',
        language: 'typescript',
        category: 'setup',
        code: `import { KnowledgeGraph, SVGRenderer, CanvasRenderer, WebGLRenderer } from '@aigeeksquad/knowledge-network';

// Initialize with multiple renderers
const graph = new KnowledgeGraph({
  renderers: {
    svg: new SVGRenderer({ quality: 'high' }),
    canvas: new CanvasRenderer({ antialiasing: true }),
    webgl: new WebGLRenderer({
      fallback: 'canvas',
      maxNodes: 10000
    })
  },
  // Renderer selection strategy
  renderingStrategy: 'auto', // or 'svg', 'canvas', 'webgl'
  fallbackChain: ['webgl', 'canvas', 'svg']
});

// Switch renderers at runtime
graph.setRenderer('webgl');
graph.setRenderer('canvas');
graph.setRenderer('svg');`
      },
      {
        id: 'renderer-comparison',
        title: 'Performance Comparison',
        description: 'Compare rendering performance across engines',
        language: 'typescript',
        category: 'optimization',
        code: `// Get performance metrics for each renderer
const metrics = {
  svg: graph.getRenderer('svg').getMetrics(),
  canvas: graph.getRenderer('canvas').getMetrics(),
  webgl: graph.getRenderer('webgl').getMetrics()
};

// Compare FPS across renderers
console.log('SVG FPS:', metrics.svg.fps);
console.log('Canvas FPS:', metrics.canvas.fps);
console.log('WebGL FPS:', metrics.webgl.fps);

// Memory usage comparison
console.log('Memory usage (MB):', {
  svg: metrics.svg.memoryUsage / 1024 / 1024,
  canvas: metrics.canvas.memoryUsage / 1024 / 1024,
  webgl: metrics.webgl.memoryUsage / 1024 / 1024
});`
      },
      {
        id: 'fallback-handling',
        title: 'Graceful Fallback',
        description: 'Implement renderer fallback strategy',
        language: 'typescript',
        category: 'setup',
        code: `// Configure fallback behavior
const graph = new KnowledgeGraph({
  renderingStrategy: 'auto',
  fallbackChain: ['webgl', 'canvas', 'svg'],

  // Fallback conditions
  fallbackConditions: {
    webgl: {
      maxNodes: 5000,
      requiresWebGL2: false,
      memoryLimit: 512 * 1024 * 1024 // 512MB
    },
    canvas: {
      maxNodes: 10000,
      requiresCanvas2D: true
    }
  },

  // Handle fallback events
  onFallback: (from: string, to: string, reason: string) => {
    console.log(\`Renderer fallback: \${from} → \${to} (\${reason})\`);
  }
});

// Check current renderer and capabilities
console.log('Active renderer:', graph.getActiveRenderer());
console.log('Supported renderers:', graph.getSupportedRenderers());`
      },
      {
        id: 'quality-assessment',
        title: 'Quality Assessment',
        description: 'Assess and compare visual quality across renderers',
        language: 'typescript',
        category: 'optimization',
        code: `// Quality assessment configuration
const qualityConfig = {
  testPatterns: ['edges', 'text', 'gradients', 'transparency'],
  zoomLevels: [0.1, 0.5, 1.0, 2.0, 5.0],
  measureSharpness: true,
  measureColorAccuracy: true
};

// Run quality assessment
const assessment = await graph.assessRenderQuality(qualityConfig);

// Results for each renderer
assessment.results.forEach(result => {
  console.log(\`\${result.renderer} Quality Scores:\`);
  console.log('  Edge Sharpness:', result.metrics.edgeSharpness);
  console.log('  Text Clarity:', result.metrics.textClarity);
  console.log('  Color Accuracy:', result.metrics.colorAccuracy);
  console.log('  Zoom Stability:', result.metrics.zoomStability);
});`
      }
    ];
  }

  public getMetrics(): ModuleMetrics | null {
    return this._state.isInitialized ? { ...this._state.metrics } : null;
  }

  public onResize(width: number, height: number): void {
    this.splitViewRenderer?.onResize(width, height);
    this.updateLayout();
  }

  public onInteraction(event: InteractionEvent): void {
    this.splitViewRenderer?.onInteraction(event);
  }

  private getDefaultConfiguration(): RendererConfig {
    return {
      enabledRenderers: ['svg', 'canvas', 'webgl'],
      syncInteractions: true,
      showPerformanceMetrics: true,
      enableQualityAssessment: true,
      fallbackStrategy: 'graceful',
      testDataset: 'medium-network',
      zoomLevel: 1.0,
      edgeOpacity: 0.6,
      nodeScale: 1.0
    };
  }

  private createLayout(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="renderer-comparison-layout">
        <!-- Xbox-styled header -->
        <div class="renderer-comparison__header">
          <div class="renderer-comparison__title">
            <h2>Multi-Renderer Architecture</h2>
            <p>SVG • Canvas • WebGL | Real-time Comparison</p>
          </div>
          <div class="renderer-comparison__status">
            <div class="renderer-status" data-renderer="svg">
              <span class="status-dot status-dot--svg"></span>
              <span class="status-label">SVG</span>
            </div>
            <div class="renderer-status" data-renderer="canvas">
              <span class="status-dot status-dot--canvas"></span>
              <span class="status-label">Canvas</span>
            </div>
            <div class="renderer-status" data-renderer="webgl">
              <span class="status-dot status-dot--webgl"></span>
              <span class="status-label">WebGL</span>
            </div>
          </div>
        </div>

        <!-- Main content area -->
        <div class="renderer-comparison__main">
          <!-- Split view container -->
          <div class="renderer-comparison__viewport" id="renderer-viewport">
            <!-- SplitViewRenderer will be mounted here -->
          </div>

          <!-- Side panel for controls and metrics -->
          <div class="renderer-comparison__panel" id="control-panel">
            <!-- Controls and metrics will be mounted here -->
          </div>
        </div>

        <!-- Quality assessment overlay -->
        <div class="renderer-comparison__overlay" id="quality-overlay" style="display: none;">
          <!-- QualityAssessment will be mounted here -->
        </div>
      </div>
    `;

    this.applyXboxStyling();
  }

  private applyXboxStyling(): void {
    const style = document.createElement('style');
    style.textContent = `
      .renderer-comparison-layout {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--color-bg-primary);
        color: var(--color-text-primary);
        font-family: var(--font-family-primary);
      }

      .renderer-comparison__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-6);
        background: linear-gradient(135deg, var(--color-gray-800), var(--color-gray-700));
        border-bottom: 2px solid var(--color-primary);
        box-shadow: 0 0 20px rgba(16, 124, 16, 0.3);
      }

      .renderer-comparison__title h2 {
        margin: 0;
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-primary);
        text-shadow: 0 0 10px rgba(16, 124, 16, 0.5);
      }

      .renderer-comparison__title p {
        margin: var(--space-1) 0 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        font-weight: var(--font-weight-medium);
      }

      .renderer-comparison__status {
        display: flex;
        gap: var(--space-6);
      }

      .renderer-status {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: rgba(0, 0, 0, 0.3);
        border-radius: var(--radius-base);
        border: 1px solid var(--color-gray-600);
      }

      .status-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--color-gray-500);
        box-shadow: inset 0 0 4px rgba(0, 0, 0, 0.3);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .status-dot--svg.active {
        background: var(--color-primary);
        box-shadow: 0 0 10px rgba(16, 124, 16, 0.6);
      }
      .status-dot--canvas.active {
        background: var(--color-secondary);
        box-shadow: 0 0 10px rgba(0, 188, 242, 0.6);
      }
      .status-dot--webgl.active {
        background: var(--color-accent);
        box-shadow: 0 0 10px rgba(255, 185, 0, 0.6);
      }

      .status-label {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .renderer-comparison__main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .renderer-comparison__viewport {
        flex: 1;
        position: relative;
        background: var(--color-gray-900);
        border-right: 1px solid var(--color-gray-700);
      }

      .renderer-comparison__panel {
        width: 320px;
        background: var(--color-bg-surface);
        border-left: 1px solid var(--color-gray-700);
        overflow-y: auto;
        padding: var(--space-4);
      }

      .renderer-comparison__overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        z-index: var(--z-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Gaming-inspired glow effects */
      .renderer-comparison__header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
          transparent 0%,
          var(--color-primary) 50%,
          transparent 100%);
        animation: pulse-glow 2s ease-in-out infinite;
      }

      @keyframes pulse-glow {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }

      /* Responsive design */
      @media (max-width: 1024px) {
        .renderer-comparison__main {
          flex-direction: column;
        }

        .renderer-comparison__panel {
          width: 100%;
          height: 200px;
          border-left: none;
          border-top: 1px solid var(--color-gray-700);
        }
      }

      @media (max-width: 640px) {
        .renderer-comparison__header {
          flex-direction: column;
          gap: var(--space-3);
          text-align: center;
        }

        .renderer-comparison__status {
          justify-content: center;
        }
      }
    `;

    document.head.appendChild(style);
  }

  private async initializeComponents(): Promise<void> {
    if (!this.container) return;

    const viewportElement = this.container.querySelector('#renderer-viewport') as HTMLElement;
    const panelElement = this.container.querySelector('#control-panel') as HTMLElement;
    const overlayElement = this.container.querySelector('#quality-overlay') as HTMLElement;

    // Initialize split view renderer
    this.splitViewRenderer = new SplitViewRenderer(viewportElement);
    await this.splitViewRenderer.initialize();

    // Initialize performance comparison
    this.performanceComparison = new PerformanceComparison(panelElement);
    this.performanceComparison.initialize();

    // Initialize quality assessment
    this.qualityAssessment = new QualityAssessment(overlayElement);
    this.qualityAssessment.initialize();

    this.controlPanel = panelElement;
  }

  private setupEventHandlers(): void {
    // Renderer status updates
    this.splitViewRenderer?.on('rendererStateChange', (renderer: RendererType, active: boolean) => {
      this.updateRendererStatus(renderer, active);
    });

    // Performance metrics updates
    this.performanceComparison?.on('metricsUpdate', (metrics: Record<string, RendererMetrics>) => {
      this.updateMetricsDisplay(metrics);
    });

    // Quality assessment events
    this.qualityAssessment?.on('assessmentComplete', (results: ComparisonResult[]) => {
      this.handleQualityResults(results);
    });
  }

  private async loadTestDataset(datasetName: string): Promise<void> {
    const datasets = createRendererTestDatasets();
    const dataset = datasets[datasetName];

    if (!dataset) {
      console.warn(`Dataset ${datasetName} not found, using default`);
      return;
    }

    // Load dataset into all renderers
    await this.splitViewRenderer?.loadDataset(dataset);

    // Update node and edge counts
    this._state.metrics.nodeCount = dataset.nodes.length;
    this._state.metrics.edgeCount = dataset.edges.length;
  }

  private updateEnabledRenderers(renderers: RendererType[]): void {
    this.splitViewRenderer?.setEnabledRenderers(renderers);

    // Update status indicators
    const allRenderers: RendererType[] = ['svg', 'canvas', 'webgl'];
    allRenderers.forEach(renderer => {
      this.updateRendererStatus(renderer, renderers.includes(renderer));
    });
  }

  private updateVisualProperties(): void {
    const config = this._state.config as RendererConfig;

    this.splitViewRenderer?.updateVisualProperties({
      zoomLevel: config.zoomLevel,
      edgeOpacity: config.edgeOpacity,
      nodeScale: config.nodeScale
    });
  }

  private updateRendererStatus(renderer: RendererType, active: boolean): void {
    const statusDot = this.container?.querySelector(`.status-dot--${renderer}`);
    if (statusDot) {
      statusDot.classList.toggle('active', active);
    }
  }

  private updateMetricsDisplay(metrics: Record<string, RendererMetrics>): void {
    // Update module metrics with aggregate data
    const activeMetrics = Object.values(metrics).filter(m => m.isActive);
    if (activeMetrics.length > 0) {
      this._state.metrics.fps = Math.max(...activeMetrics.map(m => m.fps));
      this._state.metrics.renderTime = Math.max(...activeMetrics.map(m => m.renderTime));
      this._state.metrics.memoryUsage = activeMetrics.reduce((sum, m) => sum + m.memoryUsage, 0);
    }
  }

  private handleQualityResults(results: ComparisonResult[]): void {
    console.log('Quality assessment results:', results);
    // Update UI with quality comparison data
  }

  private updateLayout(): void {
    // Handle responsive layout updates
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    // Update component layouts
    this.splitViewRenderer?.onResize(width, height);
  }

  private startRenderLoop(): void {
    if (this.animationFrame) return;

    const animate = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(animate);
    };

    this._state.isRunning = true;
    this.animationFrame = requestAnimationFrame(animate);
  }

  private updateMetrics(startTime: number): void {
    const now = performance.now();
    const frameTime = now - startTime;

    this._state.metrics.frameTime = frameTime;
    this._state.metrics.renderTime = frameTime;
    this._state.metrics.lastUpdate = now;

    // Update memory usage if available
    if ((performance as any).memory) {
      this._state.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  }
}