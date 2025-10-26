/**
 * Base interface and abstract class for all demo modules in the Knowledge Network Demo Suite.
 *
 * Follows the "bricks and studs" philosophy:
 * - Each module is a self-contained "brick" with clear responsibilities
 * - The interface defines the "studs" - public contract points for connection
 * - Modules can be regenerated independently without breaking the system
 */

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ConfigOption {
  id: string;
  label: string;
  type: 'slider' | 'toggle' | 'select' | 'color';
  value: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
  description?: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: 'typescript' | 'javascript' | 'glsl';
  code: string;
  category: 'setup' | 'algorithm' | 'optimization' | 'interaction';
}

export interface ModuleMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  nodeCount: number;
  edgeCount: number;
  lastUpdate: number;
}

export interface ModuleState {
  isInitialized: boolean;
  isRunning: boolean;
  hasError: boolean;
  errorMessage?: string;
  config: Record<string, any>;
  metrics: ModuleMetrics;
}

/**
 * Core interface that all demo modules must implement.
 * This is the "stud" pattern - the stable contract for module connection.
 */
export interface DemoModule {
  /** Unique identifier for the module */
  readonly id: string;

  /** Human-readable title displayed in navigation */
  readonly title: string;

  /** Brief description of what this module demonstrates */
  readonly description: string;

  /** Difficulty level for progressive learning */
  readonly difficulty: DifficultyLevel;

  /** Estimated time to explore this demo */
  readonly estimatedTime: string;

  /** List of key capabilities demonstrated */
  readonly capabilities: string[];

  /** Competitive advantages showcased by this module */
  readonly competitiveAdvantages: string[];

  /** Current module state */
  readonly state: ModuleState;

  /**
   * Initialize the module with a container element.
   * Called when module is first loaded or navigation switches to it.
   *
   * @param container - DOM element to render into
   * @returns Promise that resolves when initialization is complete
   */
  initialize(container: HTMLElement): Promise<void>;

  /**
   * Render or update the module visualization.
   * Called after initialization and whenever state changes require re-rendering.
   *
   * @returns Promise that resolves when render is complete
   */
  render(): Promise<void>;

  /**
   * Clean up resources when module is deactivated.
   * Called when navigating away from module or app shutdown.
   */
  cleanup(): void;

  /**
   * Get current configuration options for the module.
   * Used to build the configuration panel UI.
   *
   * @returns Array of configuration options
   */
  getConfigurationOptions(): ConfigOption[];

  /**
   * Update module configuration.
   * Called when user changes settings via configuration panel.
   *
   * @param config - New configuration values
   */
  updateConfiguration(config: Record<string, any>): void;

  /**
   * Get code examples for this module.
   * Used to show implementation details and educational content.
   *
   * @returns Array of code examples
   */
  getCodeExamples(): CodeExample[];

  /**
   * Get current performance metrics.
   * Used by PerformanceMonitor for real-time display.
   *
   * @returns Current metrics or null if not available
   */
  getMetrics(): ModuleMetrics | null;

  /**
   * Handle window resize events.
   * Called when viewport changes to maintain responsive layout.
   *
   * @param width - New viewport width
   * @param height - New viewport height
   */
  onResize(width: number, height: number): void;

  /**
   * Handle touch/mouse interactions.
   * Called for pan, zoom, select operations.
   *
   * @param event - Interaction event details
   */
  onInteraction(event: InteractionEvent): void;
}

export interface InteractionEvent {
  type: 'pan' | 'zoom' | 'select' | 'hover' | 'touch';
  x: number;
  y: number;
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  target?: any;
  originalEvent?: Event;
}

/**
 * Abstract base class providing common functionality for demo modules.
 * Implements the foundation that most modules need while leaving
 * specific visualization logic to concrete implementations.
 */
export abstract class BaseDemoModule implements DemoModule {
  public readonly id: string;
  public readonly title: string;
  public readonly description: string;
  public readonly difficulty: DifficultyLevel;
  public readonly estimatedTime: string;
  public readonly capabilities: string[];
  public readonly competitiveAdvantages: string[];

  protected container: HTMLElement | null = null;
  protected canvas: HTMLCanvasElement | null = null;
  protected context: CanvasRenderingContext2D | null = null;
  protected animationFrame: number | null = null;
  protected resizeObserver: ResizeObserver | null = null;

  private _state: ModuleState;
  private lastFrameTime = 0;
  private frameCount = 0;

  constructor(config: {
    id: string;
    title: string;
    description: string;
    difficulty: DifficultyLevel;
    estimatedTime: string;
    capabilities: string[];
    competitiveAdvantages: string[];
  }) {
    this.id = config.id;
    this.title = config.title;
    this.description = config.description;
    this.difficulty = config.difficulty;
    this.estimatedTime = config.estimatedTime;
    this.capabilities = config.capabilities;
    this.competitiveAdvantages = config.competitiveAdvantages;

    this._state = {
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
  }

  public get state(): ModuleState {
    return { ...this._state }; // Return copy to prevent external mutation
  }

  public async initialize(container: HTMLElement): Promise<void> {
    try {
      this.container = container;

      // Create canvas element
      this.canvas = document.createElement('canvas');
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      this.canvas.style.display = 'block';

      const context = this.canvas.getContext('2d');
      if (!context) {
        throw new Error('Failed to get 2D canvas context');
      }
      this.context = context;

      // Set up resize observer
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(container);

      // Initial resize
      this.handleResize();

      // Append to container
      container.appendChild(this.canvas);

      // Call module-specific initialization
      await this.onInitialize();

      this._state.isInitialized = true;
      this._state.hasError = false;
      this._state.errorMessage = undefined;

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
      await this.onRender();
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

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    this.onCleanup();

    this._state.isInitialized = false;
    this._state.isRunning = false;
  }

  public updateConfiguration(config: Record<string, any>): void {
    this._state.config = { ...this._state.config, ...config };
    this.onConfigurationUpdate(this._state.config);
  }

  public getMetrics(): ModuleMetrics | null {
    return this._state.isInitialized ? { ...this._state.metrics } : null;
  }

  public onResize(width: number, height: number): void {
    // Default implementation handles canvas resize
    this.handleResize();
  }

  public onInteraction(event: InteractionEvent): void {
    // Override in concrete classes
  }

  // Abstract methods that concrete modules must implement
  protected abstract onInitialize(): Promise<void>;
  protected abstract onRender(): Promise<void>;
  protected abstract onCleanup(): void;
  protected abstract onConfigurationUpdate(config: Record<string, any>): void;
  protected abstract getDefaultConfiguration(): Record<string, any>;

  // Abstract methods for configuration and examples
  public abstract getConfigurationOptions(): ConfigOption[];
  public abstract getCodeExamples(): CodeExample[];

  // Protected helper methods
  protected startAnimation(): void {
    if (this.animationFrame) {
      return; // Already running
    }

    const animate = () => {
      this.render();
      this.animationFrame = requestAnimationFrame(animate);
    };

    this._state.isRunning = true;
    this.animationFrame = requestAnimationFrame(animate);
  }

  protected stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this._state.isRunning = false;
  }

  private handleResize(): void {
    if (!this.canvas || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size accounting for device pixel ratio
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Scale context for crisp rendering
    if (this.context) {
      this.context.scale(dpr, dpr);
    }

    // Trigger module-specific resize handling
    this.onResize(rect.width, rect.height);
  }

  private updateMetrics(startTime: number): void {
    const now = performance.now();
    const frameTime = now - startTime;

    this.frameCount++;

    // Update FPS every second
    if (now - this.lastFrameTime >= 1000) {
      this._state.metrics.fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    this._state.metrics.frameTime = frameTime;
    this._state.metrics.renderTime = frameTime;
    this._state.metrics.lastUpdate = now;

    // Update memory usage if available
    if ((performance as any).memory) {
      this._state.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
  }
}

/**
 * Module registry for managing available demo modules.
 * Provides discovery and instantiation of modules.
 */
export class ModuleRegistry {
  private modules = new Map<string, () => Promise<DemoModule>>();
  private instances = new Map<string, DemoModule>();

  /**
   * Register a module factory function.
   *
   * @param id - Unique module identifier
   * @param factory - Function that creates module instance
   */
  registerModule(id: string, factory: () => Promise<DemoModule>): void {
    this.modules.set(id, factory);
  }

  /**
   * Get list of available module IDs.
   */
  getAvailableModules(): string[] {
    return Array.from(this.modules.keys());
  }

  /**
   * Get or create a module instance.
   *
   * @param id - Module identifier
   * @returns Module instance or null if not found
   */
  async getModule(id: string): Promise<DemoModule | null> {
    // Return existing instance if available
    if (this.instances.has(id)) {
      return this.instances.get(id)!;
    }

    // Create new instance
    const factory = this.modules.get(id);
    if (!factory) {
      return null;
    }

    try {
      const module = await factory();
      this.instances.set(id, module);
      return module;
    } catch (error) {
      console.error(`Failed to create module ${id}:`, error);
      return null;
    }
  }

  /**
   * Cleanup and remove a module instance.
   *
   * @param id - Module identifier
   */
  destroyModule(id: string): void {
    const module = this.instances.get(id);
    if (module) {
      module.cleanup();
      this.instances.delete(id);
    }
  }

  /**
   * Cleanup all module instances.
   */
  destroy(): void {
    for (const [id] of this.instances) {
      this.destroyModule(id);
    }
    this.modules.clear();
  }
}