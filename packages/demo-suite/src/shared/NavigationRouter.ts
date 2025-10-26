/**
 * Client-side navigation router with deep linking and state persistence.
 * Handles module routing, URL state, and browser history management.
 */

import { EventEmitter, debounce } from './utils.js';
import type { DemoModule, DifficultyLevel } from './DemoModule.js';

export interface RouteParams {
  moduleId?: string;
  config?: Record<string, any>;
  view?: 'demo' | 'code' | 'settings';
  [key: string]: any;
}

export interface Route {
  path: string;
  moduleId: string;
  params: RouteParams;
  title: string;
  difficulty: DifficultyLevel;
}

export interface NavigationState {
  currentRoute: Route | null;
  history: Route[];
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface RouterConfig {
  basePath: string;
  enableHistory: boolean;
  persistState: boolean;
  storageKey: string;
  defaultRoute: string;
  scrollBehavior: 'smooth' | 'auto' | 'instant';
}

/**
 * Router events for external components.
 */
export interface RouterEvents {
  routeChange: { route: Route; previousRoute: Route | null };
  beforeRouteChange: { route: Route; previousRoute: Route | null; cancel: () => void };
  navigationError: { error: Error; attemptedRoute: string };
  stateUpdate: NavigationState;
}

/**
 * Main navigation router class.
 */
export class NavigationRouter extends EventEmitter<RouterEvents> {
  private config: RouterConfig = {
    basePath: '',
    enableHistory: true,
    persistState: true,
    storageKey: 'knowledge-network-nav-state',
    defaultRoute: '/overview',
    scrollBehavior: 'smooth'
  };

  private state: NavigationState = {
    currentRoute: null,
    history: [],
    canGoBack: false,
    canGoForward: false
  };

  private routes = new Map<string, () => Promise<DemoModule | null>>();
  private isInitialized = false;
  private historyIndex = -1;
  private popstateHandler: ((event: PopStateEvent) => void) | null = null;

  // Debounced state persistence to avoid excessive localStorage writes
  private debouncedPersistState = debounce(() => this.persistState(), 300);

  constructor(config?: Partial<RouterConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the router and set up event handlers.
   */
  initialize(): void {
    if (this.isInitialized) {
      console.warn('Router already initialized');
      return;
    }

    // Load persisted state
    if (this.config.persistState) {
      this.loadPersistedState();
    }

    // Set up browser history handling
    if (this.config.enableHistory) {
      this.setupHistoryHandling();
    }

    // Navigate to initial route
    const initialPath = this.getCurrentPath();
    if (initialPath && initialPath !== '/') {
      this.navigate(initialPath, { replaceState: true });
    } else {
      this.navigate(this.config.defaultRoute, { replaceState: true });
    }

    this.isInitialized = true;
  }

  /**
   * Register a route with its module factory.
   */
  registerRoute(
    path: string,
    moduleFactory: () => Promise<DemoModule | null>,
    options?: {
      title?: string;
      difficulty?: DifficultyLevel;
    }
  ): void {
    this.routes.set(path, moduleFactory);
  }

  /**
   * Navigate to a specific path.
   */
  async navigate(
    path: string,
    options: {
      replaceState?: boolean;
      params?: Record<string, any>;
      skipHistory?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      const normalizedPath = this.normalizePath(path);
      const route = await this.createRoute(normalizedPath, options.params);

      if (!route) {
        throw new Error(`Route not found: ${path}`);
      }

      // Emit beforeRouteChange event with cancellation support
      let cancelled = false;
      const cancel = () => { cancelled = true; };

      this.emit('beforeRouteChange', {
        route,
        previousRoute: this.state.currentRoute,
        cancel
      });

      if (cancelled) {
        return false;
      }

      // Update browser URL and history
      if (this.config.enableHistory && !options.skipHistory) {
        const url = this.config.basePath + normalizedPath;
        const state = { route: route, timestamp: Date.now() };

        if (options.replaceState) {
          window.history.replaceState(state, route.title, url);
        } else {
          window.history.pushState(state, route.title, url);
        }
      }

      // Update internal state
      const previousRoute = this.state.currentRoute;
      this.state.currentRoute = route;

      // Update history tracking
      if (!options.skipHistory) {
        if (this.historyIndex < this.state.history.length - 1) {
          // If we're not at the end, remove forward history
          this.state.history = this.state.history.slice(0, this.historyIndex + 1);
        }

        this.state.history.push(route);
        this.historyIndex = this.state.history.length - 1;

        this.updateNavigationState();
      }

      // Update page title
      document.title = `${route.title} - Knowledge Network Demo Suite`;

      // Emit route change event
      this.emit('routeChange', { route, previousRoute });

      // Persist state
      if (this.config.persistState) {
        this.debouncedPersistState();
      }

      return true;

    } catch (error) {
      console.error('Navigation error:', error);
      this.emit('navigationError', {
        error: error instanceof Error ? error : new Error(String(error)),
        attemptedRoute: path
      });
      return false;
    }
  }

  /**
   * Navigate back in history.
   */
  goBack(): boolean {
    if (!this.state.canGoBack) {
      return false;
    }

    if (this.config.enableHistory) {
      window.history.back();
    } else {
      this.historyIndex--;
      const route = this.state.history[this.historyIndex];
      this.navigate(route.path, { skipHistory: true, replaceState: true });
    }

    return true;
  }

  /**
   * Navigate forward in history.
   */
  goForward(): boolean {
    if (!this.state.canGoForward) {
      return false;
    }

    if (this.config.enableHistory) {
      window.history.forward();
    } else {
      this.historyIndex++;
      const route = this.state.history[this.historyIndex];
      this.navigate(route.path, { skipHistory: true, replaceState: true });
    }

    return true;
  }

  /**
   * Get current navigation state.
   */
  getState(): NavigationState {
    return { ...this.state };
  }

  /**
   * Get current route.
   */
  getCurrentRoute(): Route | null {
    return this.state.currentRoute ? { ...this.state.currentRoute } : null;
  }

  /**
   * Get available routes.
   */
  getAvailableRoutes(): string[] {
    return Array.from(this.routes.keys());
  }

  /**
   * Check if a route exists.
   */
  hasRoute(path: string): boolean {
    return this.routes.has(this.normalizePath(path));
  }

  /**
   * Update route parameters without full navigation.
   */
  updateParams(params: Record<string, any>, options: { replaceState?: boolean } = {}): void {
    if (!this.state.currentRoute) {
      return;
    }

    const updatedRoute: Route = {
      ...this.state.currentRoute,
      params: { ...this.state.currentRoute.params, ...params }
    };

    // Update URL with new parameters
    if (this.config.enableHistory) {
      const url = this.buildUrl(updatedRoute.path, updatedRoute.params);
      const state = { route: updatedRoute, timestamp: Date.now() };

      if (options.replaceState) {
        window.history.replaceState(state, updatedRoute.title, url);
      } else {
        window.history.pushState(state, updatedRoute.title, url);
      }
    }

    this.state.currentRoute = updatedRoute;

    // Emit route change
    this.emit('routeChange', {
      route: updatedRoute,
      previousRoute: this.state.currentRoute
    });

    // Persist state
    if (this.config.persistState) {
      this.debouncedPersistState();
    }
  }

  /**
   * Clear navigation history.
   */
  clearHistory(): void {
    this.state.history = this.state.currentRoute ? [this.state.currentRoute] : [];
    this.historyIndex = this.state.history.length - 1;
    this.updateNavigationState();

    if (this.config.persistState) {
      this.debouncedPersistState();
    }
  }

  /**
   * Generate URL for a route with parameters.
   */
  generateUrl(path: string, params?: Record<string, any>): string {
    return this.config.basePath + this.buildUrl(path, params);
  }

  /**
   * Parse URL parameters into an object.
   */
  parseUrl(url: string): { path: string; params: Record<string, any> } {
    const [path, search] = url.split('?');
    const params: Record<string, any> = {};

    if (search) {
      const searchParams = new URLSearchParams(search);
      for (const [key, value] of searchParams.entries()) {
        // Try to parse JSON values
        try {
          params[key] = JSON.parse(value);
        } catch {
          params[key] = value;
        }
      }
    }

    return { path: this.normalizePath(path), params };
  }

  /**
   * Cleanup router and remove event handlers.
   */
  destroy(): void {
    if (this.popstateHandler) {
      window.removeEventListener('popstate', this.popstateHandler);
      this.popstateHandler = null;
    }

    this.routes.clear();
    this.removeAllListeners();
    this.isInitialized = false;
  }

  // Private methods

  /**
   * Normalize path format.
   */
  private normalizePath(path: string): string {
    // Remove base path if present
    if (path.startsWith(this.config.basePath)) {
      path = path.slice(this.config.basePath.length);
    }

    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }

    // Remove trailing slash except for root
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    return path;
  }

  /**
   * Get current browser path.
   */
  private getCurrentPath(): string {
    const path = window.location.pathname + window.location.search;
    return this.normalizePath(path);
  }

  /**
   * Create a route object from path and parameters.
   */
  private async createRoute(path: string, params?: Record<string, any>): Promise<Route | null> {
    const moduleFactory = this.routes.get(path);
    if (!moduleFactory) {
      return null;
    }

    try {
      const module = await moduleFactory();
      if (!module) {
        return null;
      }

      return {
        path,
        moduleId: module.id,
        params: params || {},
        title: module.title,
        difficulty: module.difficulty
      };
    } catch (error) {
      console.error(`Failed to create route for ${path}:`, error);
      return null;
    }
  }

  /**
   * Build URL with parameters.
   */
  private buildUrl(path: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return path;
    }

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }

    const search = searchParams.toString();
    return path + (search ? '?' + search : '');
  }

  /**
   * Set up browser history event handling.
   */
  private setupHistoryHandling(): void {
    this.popstateHandler = (event: PopStateEvent) => {
      const state = event.state;
      if (state && state.route) {
        const route = state.route as Route;
        this.state.currentRoute = route;
        this.emit('routeChange', { route, previousRoute: null });
      } else {
        // Handle URL change without state (e.g., manual URL edit)
        const currentPath = this.getCurrentPath();
        this.navigate(currentPath, { skipHistory: true, replaceState: true });
      }
    };

    window.addEventListener('popstate', this.popstateHandler);
  }

  /**
   * Update navigation state flags.
   */
  private updateNavigationState(): void {
    this.state.canGoBack = this.historyIndex > 0;
    this.state.canGoForward = this.historyIndex < this.state.history.length - 1;

    this.emit('stateUpdate', { ...this.state });
  }

  /**
   * Persist current state to localStorage.
   */
  private persistState(): void {
    if (!this.config.persistState) {
      return;
    }

    try {
      const stateToSave = {
        currentRoute: this.state.currentRoute,
        history: this.state.history.slice(-20), // Keep last 20 routes
        historyIndex: Math.min(this.historyIndex, 19),
        timestamp: Date.now()
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to persist router state:', error);
    }
  }

  /**
   * Load persisted state from localStorage.
   */
  private loadPersistedState(): void {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (!saved) {
        return;
      }

      const data = JSON.parse(saved);

      // Check if state is not too old (24 hours)
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(this.config.storageKey);
        return;
      }

      this.state.history = data.history || [];
      this.historyIndex = data.historyIndex || -1;
      this.updateNavigationState();

    } catch (error) {
      console.warn('Failed to load persisted router state:', error);
      localStorage.removeItem(this.config.storageKey);
    }
  }
}

/**
 * Route builder utility for creating complex routes.
 */
export class RouteBuilder {
  private path: string;
  private params: Record<string, any> = {};

  constructor(path: string) {
    this.path = path;
  }

  /**
   * Add a parameter to the route.
   */
  param(key: string, value: any): RouteBuilder {
    this.params[key] = value;
    return this;
  }

  /**
   * Add multiple parameters to the route.
   */
  addParams(params: Record<string, any>): RouteBuilder {
    Object.assign(this.params, params);
    return this;
  }

  /**
   * Build the final URL.
   */
  build(router?: NavigationRouter): string {
    if (router) {
      return router.generateUrl(this.path, this.params);
    }

    // Fallback URL building
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(this.params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      }
    }

    const search = searchParams.toString();
    return this.path + (search ? '?' + search : '');
  }

  /**
   * Static factory method.
   */
  static route(path: string): RouteBuilder {
    return new RouteBuilder(path);
  }
}

/**
 * Navigation breadcrumb utility.
 */
export class NavigationBreadcrumbs {
  private router: NavigationRouter;
  private separator: string;

  constructor(router: NavigationRouter, separator = ' → ') {
    this.router = router;
    this.separator = separator;
  }

  /**
   * Get breadcrumb trail for current route.
   */
  getBreadcrumbs(): Array<{ title: string; path: string; isActive: boolean }> {
    const currentRoute = this.router.getCurrentRoute();
    if (!currentRoute) {
      return [];
    }

    const breadcrumbs: Array<{ title: string; path: string; isActive: boolean }> = [];

    // Add home/overview
    breadcrumbs.push({
      title: 'Demo Suite',
      path: '/overview',
      isActive: false
    });

    // Add current module
    if (currentRoute.path !== '/overview') {
      breadcrumbs.push({
        title: currentRoute.title,
        path: currentRoute.path,
        isActive: true
      });
    } else {
      breadcrumbs[0].isActive = true;
    }

    return breadcrumbs;
  }

  /**
   * Render breadcrumbs as HTML string.
   */
  renderHtml(): string {
    const breadcrumbs = this.getBreadcrumbs();
    return breadcrumbs
      .map((crumb, index) => {
        const classes = crumb.isActive ? 'breadcrumb-active' : 'breadcrumb-link';
        return `<span class="${classes}">${crumb.title}</span>`;
      })
      .join(`<span class="breadcrumb-separator">${this.separator}</span>`);
  }
}

/**
 * Global router instance for easy access.
 */
let globalRouter: NavigationRouter | null = null;

export function getGlobalRouter(): NavigationRouter | null {
  return globalRouter;
}

export function initializeGlobalRouter(config?: Partial<RouterConfig>): NavigationRouter {
  if (globalRouter) {
    globalRouter.destroy();
  }

  globalRouter = new NavigationRouter(config);
  return globalRouter;
}