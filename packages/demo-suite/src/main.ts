/**
 * Application bootstrap and entry point for the Knowledge Network Demo Suite.
 * Initializes the application and handles progressive enhancement.
 */

// Import single showcase demo
import './showcase-demo.js';
import { announceToScreenReader } from './shared/utils.js';

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
 * Initialize the working demo components
 */
async function initializeWorkingDemo(): Promise<void> {
  const container = document.getElementById('demo-container');

  if (!container) {
    console.error('Demo container not found');
    return;
  }

  // Add Xbox-themed content
  container.innerHTML = `
    <div style="padding: 20px; color: white; text-align: center;">
      <h2 style="color: #107c10; margin-bottom: 20px;">Knowledge Network Performance Demo</h2>
      <p style="margin-bottom: 20px;">Real-time FPS monitoring with Xbox-themed interface</p>

      <div id="graph-area" style="
        width: 600px;
        height: 400px;
        background: rgba(255,255,255,0.05);
        border: 2px solid #107c10;
        border-radius: 8px;
        margin: 20px auto;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="text-align: center; color: #aaa;">
          <p>Performance monitoring active</p>
          <p><small>Look for FPS overlay in top-right corner</small></p>
          <p><small>Double-click overlay to toggle details</small></p>
        </div>
      </div>
    </div>
  `;

  // Initialize performance demo on the graph area
  const graphArea = container.querySelector('#graph-area') as HTMLElement;
  if (graphArea) {
    try {
      const demo = new PerformanceDemo(graphArea);
      await demo.initialize();
      console.log('Performance demo initialized successfully');
    } catch (error) {
      console.error('Failed to initialize performance demo:', error);
    }
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

    // Set up debug mode if enabled
    if (config.enableDebugMode) {
      setupDebugMode(app);
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
export { main, initializeApp };

// Progressive enhancement: Remove no-js class
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');
}