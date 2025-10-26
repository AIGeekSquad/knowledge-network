/**
 * Main application orchestrator and state management for the Knowledge Network Demo Suite.
 * Coordinates modules, navigation, and performance monitoring.
 */

import { NavigationRouter, initializeGlobalRouter } from './shared/NavigationRouter.js';
import { PerformanceMonitor, initializeGlobalPerformanceMonitor } from './shared/PerformanceMonitor.js';
import { ModuleRegistry, type DemoModule } from './shared/DemoModule.js';
import { EventEmitter, announceToScreenReader } from './shared/utils.js';
import {
  Button,
  Panel,
  ConfigurationPanel,
  MetricsDisplay,
  CodeViewer,
  type BaseComponent
} from './shared/UIComponents.js';

export interface AppConfig {
  enablePerformanceMonitoring: boolean;
  enableDeepLinking: boolean;
  persistNavigation: boolean;
  defaultModule: string;
  showWelcomeMessage: boolean;
}

export interface AppState {
  isInitialized: boolean;
  currentModule: DemoModule | null;
  isLoading: boolean;
  error: Error | null;
  navigationVisible: boolean;
  performanceVisible: boolean;
}

/**
 * Application events for external components.
 */
export interface AppEvents {
  initialized: { app: DemoSuiteApp };
  moduleChange: { module: DemoModule | null; previousModule: DemoModule | null };
  stateUpdate: AppState;
  error: { error: Error; context: string };
}

/**
 * Main application class that orchestrates the entire demo suite.
 */
export class DemoSuiteApp extends EventEmitter<AppEvents> {
  private config: AppConfig = {
    enablePerformanceMonitoring: true,
    enableDeepLinking: true,
    persistNavigation: true,
    defaultModule: 'overview',
    showWelcomeMessage: true
  };

  private state: AppState = {
    isInitialized: false,
    currentModule: null,
    isLoading: false,
    error: null,
    navigationVisible: true,
    performanceVisible: false
  };

  private router: NavigationRouter;
  private performanceMonitor: PerformanceMonitor;
  private moduleRegistry: ModuleRegistry;

  private elements = {
    app: null as HTMLElement | null,
    navigation: null as HTMLElement | null,
    container: null as HTMLElement | null,
    overlay: null as HTMLElement | null
  };

  private components = {
    navigationPanel: null as Panel | null,
    configPanel: null as ConfigurationPanel | null,
    metricsDisplay: null as MetricsDisplay | null,
    codeViewer: null as CodeViewer | null
  };

  constructor(config?: Partial<AppConfig>) {
    super();

    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Initialize core systems
    this.router = initializeGlobalRouter({
      enableHistory: this.config.enableDeepLinking,
      persistState: this.config.persistNavigation,
      defaultRoute: `/${this.config.defaultModule}`
    });

    this.performanceMonitor = initializeGlobalPerformanceMonitor(
      document.body, // Will be updated when app container is available
      {
        showOverlay: false, // Start hidden, user can toggle
        maxHistory: 300
      }
    );

    this.moduleRegistry = new ModuleRegistry();

    this.setupEventHandlers();
  }

  /**
   * Initialize the application with DOM elements.
   */
  async initialize(): Promise<void> {
    try {
      this.setState({ isLoading: true });

      // Get DOM elements
      this.elements.app = document.getElementById('app');
      this.elements.navigation = document.getElementById('main-navigation');
      this.elements.container = document.getElementById('demo-container');
      this.elements.overlay = document.getElementById('performance-overlay');

      if (!this.elements.app || !this.elements.navigation || !this.elements.container) {
        throw new Error('Required DOM elements not found');
      }

      // Initialize performance monitor with correct container
      this.performanceMonitor.initialize(this.elements.app);

      // Register available modules
      await this.registerModules();

      // Build navigation UI
      this.buildNavigationUI();

      // Build sidebar UI
      this.buildSidebarUI();

      // Initialize router
      this.router.initialize();

      // Set up keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Show welcome message if enabled
      if (this.config.showWelcomeMessage) {
        this.showWelcomeMessage();
      }

      this.setState({
        isInitialized: true,
        isLoading: false,
        error: null
      });

      // Hide loading screen
      this.hideLoadingScreen();

      this.emit('initialized', { app: this });
      announceToScreenReader('Knowledge Network Demo Suite loaded successfully');

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({
        error: err,
        isLoading: false
      });
      this.emit('error', { error: err, context: 'initialization' });
      throw err;
    }
  }

  /**
   * Get current application state.
   */
  getState(): AppState {
    return { ...this.state };
  }

  /**
   * Get current configuration.
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update application configuration.
   */
  updateConfig(config: Partial<AppConfig>): void {
    this.config = { ...this.config, ...config };

    // Apply configuration changes
    if (config.enablePerformanceMonitoring !== undefined) {
      this.performanceMonitor.updateConfig({
        showOverlay: config.enablePerformanceMonitoring && this.state.performanceVisible
      });
    }
  }

  /**
   * Navigate to a specific module.
   */
  async navigateToModule(moduleId: string, params?: Record<string, any>): Promise<boolean> {
    return this.router.navigate(`/${moduleId}`, { params });
  }

  /**
   * Toggle performance monitoring display.
   */
  togglePerformanceMonitoring(): void {
    this.setState({ performanceVisible: !this.state.performanceVisible });
    this.performanceMonitor.updateConfig({
      showOverlay: this.config.enablePerformanceMonitoring && this.state.performanceVisible
    });
  }

  /**
   * Toggle navigation visibility.
   */
  toggleNavigation(): void {
    this.setState({ navigationVisible: !this.state.navigationVisible });
    if (this.elements.navigation) {
      this.elements.navigation.style.display = this.state.navigationVisible ? '' : 'none';
    }
  }

  /**
   * Get the current active module.
   */
  getCurrentModule(): DemoModule | null {
    return this.state.currentModule;
  }

  /**
   * Get available module IDs.
   */
  getAvailableModules(): string[] {
    return this.moduleRegistry.getAvailableModules();
  }

  /**
   * Export application state for debugging.
   */
  exportDebugInfo(): {
    config: AppConfig;
    state: AppState;
    performance: ReturnType<PerformanceMonitor['exportData']>;
    navigation: ReturnType<NavigationRouter['getState']>;
  } {
    return {
      config: this.getConfig(),
      state: this.getState(),
      performance: this.performanceMonitor.exportData(),
      navigation: this.router.getState()
    };
  }

  /**
   * Clean up application resources.
   */
  destroy(): void {
    // Cleanup current module
    if (this.state.currentModule) {
      this.state.currentModule.cleanup();
    }

    // Cleanup components
    for (const component of Object.values(this.components)) {
      if (component) {
        component.destroy();
      }
    }

    // Cleanup core systems
    this.performanceMonitor.destroy();
    this.router.destroy();
    this.moduleRegistry.destroy();

    // Remove event listeners
    this.removeAllListeners();

    this.setState({ isInitialized: false });
  }

  // Private methods

  private setState(updates: Partial<AppState>): void {
    this.state = { ...this.state, ...updates };
    this.emit('stateUpdate', { ...this.state });
  }

  private async registerModules(): Promise<void> {
    // Register overview module (placeholder for now)
    this.moduleRegistry.registerModule('overview', async () => {
      return await this.createOverviewModule();
    });

    // Register performance showcase module
    this.moduleRegistry.registerModule('performance', async () => {
      const { createPerformanceModule } = await import('./modules/performance/index.js');
      return await createPerformanceModule();
    });

    // Register renderer comparison module
    this.moduleRegistry.registerModule('renderers', async () => {
      const { createRendererComparisonModule } = await import('./modules/renderers/index.js');
      return await createRendererComparisonModule();
    });

    // Register semantic AI module
    this.moduleRegistry.registerModule('semantic-ai', async () => {
      const { createSemanticAIModule } = await import('./modules/semantic-ai/index.js');
      return await createSemanticAIModule();
    });

    // Register mobile excellence module
    this.moduleRegistry.registerModule('mobile-excellence', async () => {
      const { createMobileExcellenceModule } = await import('./modules/mobile-excellence/index.js');
      return await createMobileExcellenceModule();
    });

    // Register accessibility leadership module
    this.moduleRegistry.registerModule('accessibility-leadership', async () => {
      const { createAccessibilityLeadershipModule } = await import('./modules/accessibility-leadership/index.js');
      return await createAccessibilityLeadershipModule();
    });

    // Register developer experience module
    this.moduleRegistry.registerModule('developer-experience', async () => {
      const { createDeveloperExperienceModule } = await import('./modules/developer-experience/index.js');
      return await createDeveloperExperienceModule();
    });
  }

  private async createOverviewModule(): Promise<DemoModule> {
    const { BaseDemoModule } = await import('./shared/DemoModule.js');

    return new class OverviewModule extends BaseDemoModule {
      constructor() {
        super({
          id: 'overview',
          title: 'Demo Suite Overview',
          description: 'Welcome to the Knowledge Network Demo Suite - explore interactive graph visualizations and algorithms',
          difficulty: 'beginner',
          estimatedTime: '2-3 minutes',
          capabilities: ['Navigation', 'Module Discovery', 'Getting Started'],
          competitiveAdvantages: ['Progressive Learning Path', 'Comprehensive Examples', 'Interactive Exploration']
        });
      }

      protected async onInitialize(): Promise<void> {
        // Overview module implementation will be added in next chunks
      }

      protected async onRender(): Promise<void> {
        if (!this.context || !this.canvas) return;

        // Simple welcome screen
        this.context.fillStyle = '#f5f5f5';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.context.fillStyle = '#333';
        this.context.font = '24px Arial';
        this.context.textAlign = 'center';
        this.context.fillText(
          'Welcome to Knowledge Network Demo Suite',
          this.canvas.width / 2,
          this.canvas.height / 2 - 20
        );

        this.context.font = '16px Arial';
        this.context.fillText(
          'Select a demo from the navigation to get started',
          this.canvas.width / 2,
          this.canvas.height / 2 + 20
        );
      }

      protected onCleanup(): void {
        // No special cleanup needed
      }

      protected onConfigurationUpdate(config: Record<string, any>): void {
        // No configuration options for overview
      }

      protected getDefaultConfiguration(): Record<string, any> {
        return {};
      }

      getConfigurationOptions() {
        return [];
      }

      getCodeExamples() {
        return [{
          id: 'getting-started',
          title: 'Getting Started',
          description: 'Basic setup for using the demo suite',
          language: 'typescript' as const,
          code: `
// Import the demo suite
import { DemoSuiteApp } from './app.js';

// Initialize the application
const app = new DemoSuiteApp({
  enablePerformanceMonitoring: true,
  enableDeepLinking: true
});

// Initialize with DOM
await app.initialize();

// Navigate to a demo
await app.navigateToModule('basic-graph');
          `,
          category: 'setup' as const
        }];
      }
    };
  }

  private setupEventHandlers(): void {
    // Router events
    this.router.on('routeChange', async ({ route, previousRoute }) => {
      await this.handleRouteChange(route.moduleId, previousRoute?.moduleId);
    });

    this.router.on('navigationError', ({ error, attemptedRoute }) => {
      console.error('Navigation error:', error);
      this.emit('error', { error, context: `navigation to ${attemptedRoute}` });
    });

    // Performance monitor events
    this.performanceMonitor.on('metricsUpdate', (metrics) => {
      if (this.components.metricsDisplay) {
        this.components.metricsDisplay.updateMetrics({
          'FPS': metrics.fps.toFixed(0),
          'Frame Time': `${metrics.frameTime.toFixed(1)}ms`,
          'Memory': this.formatMemory(metrics.memoryUsage),
          'Nodes': metrics.totalNodes.toString(),
          'Edges': metrics.totalEdges.toString()
        });
      }
    });

    // Window events
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });

    window.addEventListener('resize', () => {
      if (this.state.currentModule) {
        const rect = this.elements.container?.getBoundingClientRect();
        if (rect) {
          this.state.currentModule.onResize(rect.width, rect.height);
        }
      }
    });
  }

  private async handleRouteChange(moduleId: string, previousModuleId?: string): Promise<void> {
    try {
      this.setState({ isLoading: true });

      // Cleanup previous module
      if (this.state.currentModule) {
        this.state.currentModule.cleanup();
        this.performanceMonitor.setActiveModule(null);
      }

      // Load new module
      const module = await this.moduleRegistry.getModule(moduleId);
      if (!module) {
        throw new Error(`Module not found: ${moduleId}`);
      }

      // Initialize module
      if (!this.elements.container) {
        throw new Error('Demo container not available');
      }

      await module.initialize(this.elements.container);
      await module.render();

      // Update state
      const previousModule = this.state.currentModule;
      this.setState({
        currentModule: module,
        isLoading: false,
        error: null
      });

      // Update performance monitoring
      this.performanceMonitor.setActiveModule(module);

      // Update configuration panel
      this.updateConfigurationPanel(module);

      // Update code viewer
      this.updateCodeViewer(module);

      // Emit module change event
      this.emit('moduleChange', { module, previousModule });

      // Announce to screen readers
      announceToScreenReader(`Loaded ${module.title} demo`);

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.setState({
        error: err,
        isLoading: false,
        currentModule: null
      });
      this.emit('error', { error: err, context: `loading module ${moduleId}` });
    }
  }

  private buildNavigationUI(): void {
    if (!this.elements.navigation) return;

    // Create navigation structure
    const nav = document.createElement('div');
    nav.className = 'navigation';

    // Brand/logo
    const brand = document.createElement('div');
    brand.className = 'navigation__brand';
    brand.textContent = 'Knowledge Network';

    // Menu will be populated when modules are registered
    const menu = document.createElement('div');
    menu.className = 'navigation__menu';

    // Controls
    const controls = document.createElement('div');
    controls.className = 'navigation__controls';

    const perfButton = new Button('📊', {
      variant: 'ghost',
      size: 'small',
      ariaLabel: 'Toggle performance monitoring'
    });

    perfButton.on('click', () => {
      this.togglePerformanceMonitoring();
    });

    controls.appendChild(perfButton.getElement());

    nav.appendChild(brand);
    nav.appendChild(menu);
    nav.appendChild(controls);

    this.elements.navigation.appendChild(nav);
  }

  private buildSidebarUI(): void {
    // Sidebar will be implemented in future chunks
    // This foundation provides the structure for configuration and metrics panels
  }

  private updateConfigurationPanel(module: DemoModule): void {
    if (this.components.configPanel) {
      this.components.configPanel.destroy();
    }

    const options = module.getConfigurationOptions();
    if (options.length > 0) {
      this.components.configPanel = new ConfigurationPanel({
        title: 'Configuration',
        configOptions: options,
        onConfigChange: (config) => {
          module.updateConfiguration(config);
        }
      });

      // Append to sidebar when it's implemented
    }
  }

  private updateCodeViewer(module: DemoModule): void {
    const examples = module.getCodeExamples();
    if (examples.length > 0 && this.components.codeViewer) {
      const firstExample = examples[0];
      this.components.codeViewer.setCode(firstExample.code, firstExample.language);
    }
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (event) => {
      // Ctrl/Cmd + Shift + P: Toggle performance monitoring
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        this.togglePerformanceMonitoring();
      }

      // Ctrl/Cmd + Shift + N: Toggle navigation
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
        event.preventDefault();
        this.toggleNavigation();
      }

      // Escape: Go back or close overlays
      if (event.key === 'Escape') {
        if (this.state.performanceVisible) {
          this.togglePerformanceMonitoring();
        } else {
          this.router.goBack();
        }
      }
    });
  }

  private showWelcomeMessage(): void {
    // Simple welcome message - can be enhanced in future chunks
    setTimeout(() => {
      announceToScreenReader(
        'Welcome to the Knowledge Network Demo Suite. Use arrow keys to navigate, press Ctrl+Shift+P to toggle performance monitoring.'
      );
    }, 2000);
  }

  private hideLoadingScreen(): void {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      document.body.classList.add('app-loaded');
      setTimeout(() => {
        loadingScreen.style.display = 'none';
      }, 500);
    }
  }

  private formatMemory(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  }
}

/**
 * Global application instance.
 */
let globalApp: DemoSuiteApp | null = null;

/**
 * Get the global application instance.
 */
export function getGlobalApp(): DemoSuiteApp | null {
  return globalApp;
}

/**
 * Initialize the global application instance.
 */
export async function initializeApp(config?: Partial<AppConfig>): Promise<DemoSuiteApp> {
  if (globalApp) {
    globalApp.destroy();
  }

  globalApp = new DemoSuiteApp(config);
  await globalApp.initialize();
  return globalApp;
}