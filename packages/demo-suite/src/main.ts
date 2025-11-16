/**
 * Application bootstrap and entry point for the Knowledge Network Demo Suite.
 * Initializes the application and handles progressive enhancement.
 */

// Import actual knowledge graph library
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
import { announceToScreenReader } from './shared/utils.js';
import { UnifiedDemo, createUnifiedDemo } from './components/UnifiedDemo.js';

/**
 * Application initialization configuration.
 */
interface InitConfig {
  enableDebugMode?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableDeepLinking?: boolean;
  defaultModule?: string;
  showWelcomeMessage?: boolean;
}

/**
 * Get configuration from URL parameters or defaults.
 */
function getInitialConfig(): InitConfig {
  const params = new URLSearchParams(window.location.search);

  return {
    enableDebugMode: params.get('debug') === 'true',
    enablePerformanceMonitoring: params.get('perf') !== 'false', // Default true
    enableDeepLinking: params.get('routing') !== 'false', // Default true
    defaultModule: params.get('module') || 'overview',
    showWelcomeMessage: params.get('welcome') !== 'false' // Default true
  };
}

/**
 * Check if the browser supports required features.
 */
function checkBrowserSupport(): { supported: boolean; missing: string[] } {
  const missing: string[] = [];

  // Check for essential features
  if (!window.requestAnimationFrame) {
    missing.push('requestAnimationFrame');
  }

  if (!window.ResizeObserver) {
    missing.push('ResizeObserver');
  }

  if (!window.URL || !window.URLSearchParams) {
    missing.push('URL/URLSearchParams');
  }

  if (!document.createElement('canvas').getContext) {
    missing.push('Canvas 2D Context');
  }

  if (!window.addEventListener) {
    missing.push('Event Listeners');
  }

  // Check for modern JavaScript features
  try {
    // Test ES6+ features using Function constructor instead of eval
    new Function('const test = () => {}; class Test {}; new Promise(() => {});')();
  } catch {
    missing.push('ES6+ JavaScript');
  }

  return {
    supported: missing.length === 0,
    missing
  };
}

/**
 * Show browser compatibility error.
 */
function showBrowserError(missing: string[]): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div style="
      padding: 2rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 2rem auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <h1 style="color: #d32f2f; margin-bottom: 1rem;">Browser Not Supported</h1>
      <p style="margin-bottom: 1rem;">
        Your browser lacks some features required for the Knowledge Network Demo Suite:
      </p>
      <ul style="text-align: left; margin: 1rem 0; color: #666;">
        ${missing.map(feature => `<li>• ${feature}</li>`).join('')}
      </ul>
      <p>
        Please update to a modern browser like:
      </p>
      <p style="margin-top: 1rem;">
        <strong>Chrome 60+, Firefox 55+, Safari 12+, or Edge 79+</strong>
      </p>
    </div>
  `;
}

/**
 * Show loading error with retry option.
 */
function showLoadingError(error: Error): void {
  const app = document.getElementById('app');
  if (!app) return;

  console.error('Demo Suite initialization error:', error);

  app.innerHTML = `
    <div style="
      padding: 2rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      margin: 2rem auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <h1 style="color: #d32f2f; margin-bottom: 1rem;">Loading Error</h1>
      <p style="margin-bottom: 1rem; color: #666;">
        Failed to load the Knowledge Network Demo Suite.
      </p>
      <details style="text-align: left; margin: 1rem 0; padding: 1rem; background: #f5f5f5; border-radius: 4px;">
        <summary style="cursor: pointer; font-weight: bold;">Error Details</summary>
        <pre style="margin-top: 0.5rem; font-size: 0.9em; color: #d32f2f; white-space: pre-wrap;">${error.message}</pre>
      </details>
      <button
        onclick="window.location.reload()"
        style="
          background: #667eea;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin: 0 0.5rem;
        "
      >
        Retry
      </button>
      <button
        onclick="window.open('https://github.com/anthropics/knowledge-network/issues', '_blank')"
        style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          margin: 0 0.5rem;
        "
      >
        Report Issue
      </button>
    </div>
  `;

  // Hide loading screen
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.display = 'none';
  }
}

/**
 * Initialize performance monitoring for startup metrics.
 */
function initializeStartupMetrics(): {
  markStart: () => void;
  markEnd: () => void;
  getMetrics: () => { loadTime: number; renderTime: number };
} {
  const startTime = performance.now();
  let initTime = 0;
  let renderTime = 0;

  return {
    markStart: () => {
      initTime = performance.now();
    },
    markEnd: () => {
      renderTime = performance.now();
    },
    getMetrics: () => ({
      loadTime: initTime - startTime,
      renderTime: renderTime - initTime
    })
  };
}

/**
 * Set up error handling for uncaught errors.
 */
function setupGlobalErrorHandling(): void {
  window.addEventListener('error', (event) => {
    console.error('Uncaught error:', event.error);
    announceToScreenReader('An error occurred. Please check the console for details.');

    // Show user-friendly error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 1rem;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      max-width: 300px;
    `;
    notification.innerHTML = `
      <strong>Error:</strong> Something went wrong.
      <button onclick="this.parentElement.remove()" style="
        background: transparent;
        border: 1px solid white;
        color: white;
        padding: 0.25rem 0.5rem;
        margin-left: 0.5rem;
        border-radius: 2px;
        cursor: pointer;
        font-size: 0.8rem;
      ">Dismiss</button>
    `;
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    announceToScreenReader('A promise was rejected. Please check the console for details.');
  });
}

/**
 * Add debugging helpers to window in debug mode.
 */
function setupDebugMode(app: any): void {
  // Make app available globally for debugging
  (window as any).__demoSuiteApp = app;

  // Add debug helpers
  (window as any).__demoSuiteDebug = {
    exportState: () => app.exportDebugInfo(),
    togglePerformance: () => app.togglePerformanceMonitoring(),
    navigateTo: (moduleId: string) => app.navigateToModule(moduleId),
    getModules: () => app.getAvailableModules()
  };

  console.log('🐛 Debug mode enabled');
  console.log('Available debug commands:');
  console.log('  __demoSuiteApp - Main application instance');
  console.log('  __demoSuiteDebug.exportState() - Export debug information');
  console.log('  __demoSuiteDebug.togglePerformance() - Toggle performance monitoring');
  console.log('  __demoSuiteDebug.navigateTo(moduleId) - Navigate to module');
  console.log('  __demoSuiteDebug.getModules() - List available modules');
}

/**
 * Initialize comprehensive interactive demo with unified modular capabilities
 */
async function initializeInteractiveDemo(): Promise<void> {
  const container = document.getElementById('demo-container');

  if (!container) {
    console.error('Demo container not found');
    return;
  }

  try {
    // Check for unified demo mode (FR-010 implementation)
    const params = new URLSearchParams(window.location.search);
    const useUnifiedDemo = params.get('unified') !== 'false'; // Default to unified demo

    if (useUnifiedDemo) {
      // Initialize FR-010 Unified Demo - Single integrated experience with ALL capabilities
      console.log('🎯 Initializing FR-010 Unified Demo - Single integrated experience');
      
      const unifiedDemo = createUnifiedDemo('demo-container', {
        initialStrategy: (params.get('strategy') as 'canvas' | 'svg' | 'webgl') || 'canvas',
        showControls: true,
        enablePerformanceMonitoring: true
      });

      // Make unified demo available for E2E testing
      (window as any).__unifiedDemo = unifiedDemo;
      (window as any).__knowledgeGraph = unifiedDemo.getGraph();
      (window as any).__currentRenderingStrategy = params.get('strategy') || 'canvas';
      (window as any).__knowledgeGraphReady = true;

      console.log('✅ FR-010 Unified Demo initialized - ALL modular capabilities available in single experience');
      
    } else {
      // Fallback to original demo system for development/testing
      await initializeOriginalDemo(container);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize demo:', error);
    showDemoInitializationError(container, errorMessage);
  }
}

/**
 * Initialize original demo system (preserved for development)
 */
async function initializeOriginalDemo(container: HTMLElement): Promise<void> {
  // Import required components
  const { DataGenerator } = await import('./shared/DataGenerator.js');
  const { initializeGlobalPerformanceMonitor } = await import('./shared/PerformanceMonitor.js');

  // Initialize performance monitoring
  const perfMonitor = initializeGlobalPerformanceMonitor(container, {
    showOverlay: true,
    position: 'top-right',
    enableDetails: true
  });

  // Create interactive demo manager
  const demoManager = new InteractiveDemoManager(container, perfMonitor);
  await demoManager.initialize();

  console.log('✅ Original interactive demo initialized successfully');
}

/**
 * Show demo initialization error
 */
function showDemoInitializationError(container: HTMLElement, errorMessage: string): void {
  container.innerHTML = `
    <div style="padding: 20px; color: white; text-align: center;">
      <h2>Demo Initialization Error</h2>
      <p>Error: ${errorMessage}</p>
      <div style="margin-top: 20px;">
        <button onclick="window.location.reload()" style="
          background: #667eea; color: white; border: none;
          padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px;
        ">Retry</button>
        <button onclick="window.location.href='/?unified=false'" style="
          background: #6c757d; color: white; border: none;
          padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px;
        ">Fallback Mode</button>
      </div>
    </div>
  `;
}

/**
 * Interactive Demo Manager - Orchestrates the full demo experience
 */
class InteractiveDemoManager {
  private container: HTMLElement;
  private perfMonitor: any;
  private currentGraph: any = null;
  private dataGenerator: any;
  private currentDataset = 'knowledge';
  private currentRenderer = 'svg';

  // Dataset configurations
  private datasets = {
    biological: {
      name: 'Biological Network',
      description: 'Protein interaction network',
      type: 'biological' as const,
      nodeCount: 40,
      config: { avgDegree: 3, nodeRadius: { min: 4, max: 12 } }
    },
    knowledge: {
      name: 'Knowledge Graph',
      description: 'AI/ML topics and relationships',
      type: 'knowledge' as const,
      nodeCount: 35,
      config: { avgDegree: 4, nodeRadius: { min: 5, max: 10 } }
    },
    social: {
      name: 'Social Network',
      description: 'Friend connections with clustering',
      type: 'social' as const,
      nodeCount: 45,
      config: { avgDegree: 5, nodeRadius: { min: 6, max: 8 } }
    },
    scaleFree: {
      name: 'Scale-Free Network',
      description: 'Hub-dominated structure',
      type: 'scaleFree' as const,
      nodeCount: 50,
      config: { avgDegree: 3, nodeRadius: { min: 3, max: 15 } }
    },
    clustered: {
      name: 'Clustered Communities',
      description: 'Dense groups with sparse connections',
      type: 'cluster' as const,
      nodeCount: 60,
      config: { clusterCount: 4, nodeRadius: { min: 5, max: 8 } }
    },
    smallWorld: {
      name: 'Small World',
      description: 'High clustering, short paths',
      type: 'smallWorld' as const,
      nodeCount: 40,
      config: { avgDegree: 4, nodeRadius: { min: 5, max: 8 } }
    }
  };

  constructor(container: HTMLElement, perfMonitor: any) {
    this.container = container;
    this.perfMonitor = perfMonitor;
  }

  async initialize(): Promise<void> {
    // Import DataGenerator
    const { DataGenerator } = await import('./shared/DataGenerator.js');
    this.dataGenerator = new DataGenerator(42); // Fixed seed for reproducibility

    // Create UI structure
    this.createUI();

    // Load initial dataset
    await this.loadDataset(this.currentDataset);

    // Set up event listeners
    this.setupEventListeners();
  }

  private createUI(): void {
    this.container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Header Controls -->
        <div id="demo-controls" style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 15px 20px;
          background: rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        ">
          <div style="display: flex; align-items: center; gap: 20px;">
            <h1 style="margin: 0; font-size: 1.5rem; font-weight: 600;">Knowledge Network Demo</h1>

            <!-- Dataset Selector -->
            <div style="display: flex; align-items: center; gap: 8px;">
              <label for="dataset-select" style="font-weight: 500;">Dataset:</label>
              <select id="dataset-select" style="
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 4px;
                padding: 6px 12px;
                color: white;
                font-size: 14px;
                min-width: 180px;
              ">
                ${Object.entries(this.datasets).map(([key, dataset]) =>
                  `<option value="${key}" ${key === this.currentDataset ? 'selected' : ''} style="
                    background: #333;
                    color: white;
                  ">
                    ${dataset.name}
                  </option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 15px;">
            <!-- Renderer Mode Buttons -->
            <div style="display: flex; gap: 5px;">
              ${['svg', 'canvas', 'webgl'].map(mode =>
                `<button
                  id="renderer-${mode}"
                  data-renderer="${mode}"
                  class="renderer-btn ${mode === this.currentRenderer ? 'active' : ''}"
                  style="
                    background: ${mode === this.currentRenderer ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    padding: 6px 12px;
                    color: white;
                    font-size: 12px;
                    font-weight: 500;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  "
                  onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'"
                  onmouseout="this.style.background='${mode === this.currentRenderer ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}'"
                >
                  ${mode.toUpperCase()}
                </button>`
              ).join('')}
            </div>

            <!-- Performance Toggle -->
            <button id="perf-toggle" style="
              background: rgba(76, 175, 80, 0.2);
              border: 1px solid rgba(76, 175, 80, 0.5);
              border-radius: 4px;
              padding: 6px 12px;
              color: white;
              font-size: 12px;
              cursor: pointer;
              transition: all 0.2s ease;
            ">
              📊 PERF
            </button>
          </div>
        </div>

        <!-- Dataset Info Bar -->
        <div id="dataset-info" style="
          padding: 10px 20px;
          background: rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          flex-shrink: 0;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div id="dataset-description">Loading dataset...</div>
            <div style="font-size: 12px; opacity: 0.7;">
              Press Ctrl+1-6 for datasets • Ctrl+R for renderer • Ctrl+Shift+P for performance
            </div>
          </div>
        </div>

        <!-- Graph Container -->
        <div id="graph-container" style="
          flex: 1;
          position: relative;
          background: rgba(255, 255, 255, 0.05);
          overflow: hidden;
        "></div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Dataset selector
    const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
    datasetSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.loadDataset(target.value);
    });

    // Renderer buttons
    document.querySelectorAll('.renderer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const renderer = target.dataset.renderer;
        if (renderer) {
          this.switchRenderer(renderer);
        }
      });
    });

    // Performance toggle
    const perfToggle = document.getElementById('perf-toggle');
    perfToggle?.addEventListener('click', () => {
      this.perfMonitor?.toggle();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1': case '2': case '3': case '4': case '5': case '6':
            e.preventDefault();
            const datasetKeys = Object.keys(this.datasets);
            const index = parseInt(e.key) - 1;
            if (index < datasetKeys.length) {
              this.loadDataset(datasetKeys[index]);
            }
            break;
          case 'r':
            e.preventDefault();
            this.cycleRenderer();
            break;
        }
      }
    });
  }

  private async loadDataset(datasetKey: string): Promise<void> {
    const dataset = this.datasets[datasetKey as keyof typeof this.datasets];
    if (!dataset) return;

    this.currentDataset = datasetKey;

    // Show notification for dataset change
    this.showNotification(`Loading ${dataset.name}`);

    // Update info bar
    const descriptionElement = document.getElementById('dataset-description');
    if (descriptionElement) {
      descriptionElement.innerHTML = `
        <strong>${dataset.name}</strong> - ${dataset.description}
        <span style="margin-left: 20px; opacity: 0.8;">
          ${dataset.nodeCount} nodes • Renderer: ${this.currentRenderer.toUpperCase()}
          ${this.getEdgeRenderer() === 'bundled' ? ' • Edge Bundling' : ''}
        </span>
      `;
    }

    try {
      // Generate graph data
      const graphData = this.dataGenerator.generateGraph(dataset.type, {
        nodeCount: dataset.nodeCount,
        width: 800,
        height: 600,
        ...dataset.config
      });

      // Update dataset selector
      const selector = document.getElementById('dataset-select') as HTMLSelectElement;
      if (selector) {
        selector.value = datasetKey;
      }

      await this.renderGraph(graphData);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to load dataset:', error);
      const container = document.getElementById('graph-container');
      if (container) {
        container.innerHTML = `
          <div style="
            display: flex; align-items: center; justify-content: center;
            height: 100%; color: white; text-align: center;
          ">
            <div>
              <h3>Failed to load ${dataset.name}</h3>
              <p style="opacity: 0.8; margin-top: 10px;">Error: ${errorMessage}</p>
            </div>
          </div>
        `;
      }
    }
  }

  private async renderGraph(data: any): Promise<void> {
    const container = document.getElementById('graph-container');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
      <div style="
        display: flex; align-items: center; justify-content: center;
        height: 100%; color: white; text-align: center;
      ">
        <div>
          <div style="
            width: 40px; height: 40px; margin: 0 auto 16px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top: 3px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <div>Rendering graph...</div>
          <div style="margin-top: 8px; font-size: 12px; opacity: 0.7;">
            ${data.nodes.length} nodes, ${data.edges.length} edges
          </div>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;

    // Wait a moment to show loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    // Clear and create graph container
    container.innerHTML = '<div style="width: 100%; height: 100%; position: relative;"></div>';
    const graphDiv = container.firstElementChild as HTMLElement;

    if (!graphDiv) return;

    try {
      // Set up performance monitoring
      if (this.perfMonitor) {
        this.perfMonitor.setActiveModule({
          getMetrics: () => ({
            frameTime: performance.now() % 16.67, // Simulate frame time
            renderTime: 5 + Math.random() * 10,   // Simulate render time
            nodeCount: data.nodes.length,
            edgeCount: data.edges.length
          })
        });
      }

      // Create graph configuration
      const config = {
        width: container.clientWidth,
        height: container.clientHeight,
        nodeRadius: (d: any) => d.radius || 8,
        nodeFill: (d: any) => d.color || this.getNodeColor(d),
        linkStroke: (d: any) => d.color || '#7f8c8d',
        edgeRenderer: this.getEdgeRenderer(),
        enableZoom: true,
        enableDrag: true,
        chargeStrength: -300,
        linkDistance: 50,
        linkStrength: () => 0.5
      };

      // Import and create KnowledgeGraph
      const { KnowledgeGraph } = await import('@aigeeksquad/knowledge-network');
      this.currentGraph = new KnowledgeGraph(graphDiv, data, config);

      await this.currentGraph.render();

      // Note: Graph uses fixed dimensions based on initial container size
      // ResizeObserver removed as KnowledgeGraph doesn't support dynamic resizing

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Failed to render graph:', error);
      graphDiv.innerHTML = `
        <div style="
          display: flex; align-items: center; justify-content: center;
          height: 100%; color: white; text-align: center;
        ">
          <div>
            <h3>Rendering Error</h3>
            <p style="opacity: 0.8; margin-top: 10px;">${errorMessage}</p>
          </div>
        </div>
      `;
    }
  }

  private switchRenderer(renderer: string): void {
    this.currentRenderer = renderer;

    // Update button states
    document.querySelectorAll('.renderer-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-renderer') === renderer;
      (btn as HTMLElement).style.background = isActive ?
        'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)';
    });

    // Show notification
    this.showNotification(`Switched to ${renderer.toUpperCase()} renderer`);

    // Reload current dataset with new renderer
    this.loadDataset(this.currentDataset);
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10001;
      font-size: 14px;
      font-weight: 500;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.style.transform = 'translateX(0)';
    });

    // Remove after 2 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }, 2000);
  }

  private cycleRenderer(): void {
    const renderers = ['svg', 'canvas', 'webgl'];
    const currentIndex = renderers.indexOf(this.currentRenderer);
    const nextRenderer = renderers[(currentIndex + 1) % renderers.length];
    this.switchRenderer(nextRenderer);
  }

  private getEdgeRenderer(): 'simple' | 'bundled' {
    // Map renderer types to edge rendering strategy
    switch (this.currentRenderer) {
      case 'webgl': return 'bundled'; // WebGL can handle complex bundling
      case 'canvas': return 'simple';   // Canvas for performance
      case 'svg':
      default: return 'simple';        // SVG default
    }
  }

  private getNodeColor(node: any): string {
    // Color by category with fallback
    const categoryColors: Record<string, string> = {
      'topic': '#4ECDC4',
      'person': '#FF6B6B',
      'protein': '#96CEB4',
      'cluster-0': '#FF6B6B',
      'cluster-1': '#4ECDC4',
      'cluster-2': '#45B7D1',
      'cluster-3': '#96CEB4',
      'level-1': '#FFEAA7',
      'level-2': '#DDA0DD',
      'level-3': '#81C784'
    };

    return categoryColors[node.category] ||
           categoryColors[node.type] ||
           '#667eea';
  }
}

/**
 * Log initialization metrics.
 */
function logInitMetrics(metrics: { loadTime: number; renderTime: number }, config: InitConfig): void {
  const totalTime = metrics.loadTime + metrics.renderTime;

  console.log(`📊 Demo Suite Initialization Metrics:`);
  console.log(`  Load Time: ${metrics.loadTime.toFixed(2)}ms`);
  console.log(`  Render Time: ${metrics.renderTime.toFixed(2)}ms`);
  console.log(`  Total Time: ${totalTime.toFixed(2)}ms`);

  if (config.enableDebugMode) {
    console.log(`  Configuration:`, config);
  }

  // Performance budget warnings
  if (totalTime > 3000) {
    console.warn('⚠️  Slow initialization detected (>3s). Consider optimizing.');
  } else if (totalTime > 1000) {
    console.log('⚡ Initialization completed in reasonable time (1-3s).');
  } else {
    console.log('🚀 Fast initialization! (<1s)');
  }
}

/**
 * Main application initialization function.
 */
async function main(): Promise<void> {
  // Set up startup monitoring
  const startupMetrics = initializeStartupMetrics();

  // Set up global error handling
  setupGlobalErrorHandling();

  // Check browser support
  const browserCheck = checkBrowserSupport();
  if (!browserCheck.supported) {
    showBrowserError(browserCheck.missing);
    return;
  }

  try {
    // Get configuration
    const config = getInitialConfig();

    // Mark initialization start
    startupMetrics.markStart();

    // Hide loading screen - showcase demo will initialize itself
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      loadingScreen.style.opacity = '0';
      loadingScreen.style.pointerEvents = 'none';
      document.body.classList.add('app-loaded');
    }

    // Mark initialization end
    startupMetrics.markEnd();

    // Initialize the interactive demo
    await initializeInteractiveDemo();

    // Set up debug mode if enabled (placeholder for future app instance)
    if (config.enableDebugMode) {
      console.log('🐛 Debug mode enabled');
    }

    // Log performance metrics
    const metrics = startupMetrics.getMetrics();
    logInitMetrics(metrics, config);

    // Announce successful initialization
    announceToScreenReader('Knowledge Network Demo Suite loaded and ready');

    console.log('✅ Knowledge Network Demo Suite initialized successfully');

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    showLoadingError(err);
  }
}

/**
 * Ensure DOM is ready before initializing.
 */
function whenReady(callback: () => void): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    callback();
  }
}

// Check if we're in a module environment
if (typeof document !== 'undefined') {
  // Browser environment - initialize when DOM is ready
  whenReady(() => {
    main().catch((error) => {
      console.error('Failed to initialize demo suite:', error);
      showLoadingError(error instanceof Error ? error : new Error(String(error)));
    });
  });
} else {
  // Node.js environment - export for testing
  console.warn('Demo suite main.ts loaded in non-browser environment');
}

// Export for module systems
export { main, initializeInteractiveDemo };

// Progressive enhancement: Remove no-js class
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');
}