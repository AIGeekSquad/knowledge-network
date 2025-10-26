/**
 * Real-time performance monitoring system for the Knowledge Network Demo Suite.
 * Provides FPS, memory usage, and render time metrics with overlay display.
 */

import { formatMemory, formatDuration, formatNumber, throttle, EventEmitter } from './utils.js';
import type { ModuleMetrics } from './DemoModule.js';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  totalNodes: number;
  totalEdges: number;
  lastUpdate: number;
}

export interface PerformanceHistory {
  timestamp: number;
  metrics: PerformanceMetrics;
}

export interface PerformanceConfig {
  maxHistory: number;
  updateInterval: number;
  showOverlay: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  opacity: number;
  enableDetails: boolean;
}

/**
 * Performance monitoring events for external components.
 */
export interface PerformanceEvents {
  metricsUpdate: PerformanceMetrics;
  overlayToggle: { visible: boolean };
  configChange: Partial<PerformanceConfig>;
}

/**
 * Main performance monitoring class with real-time overlay.
 */
export class PerformanceMonitor extends EventEmitter<PerformanceEvents> {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private isVisible = false;
  private isRunning = false;

  private config: PerformanceConfig = {
    maxHistory: 300, // 5 minutes at 60fps
    updateInterval: 16, // ~60fps
    showOverlay: false,
    position: 'top-left',
    opacity: 0.8,
    enableDetails: true
  };

  private metrics: PerformanceMetrics = {
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    totalNodes: 0,
    totalEdges: 0,
    lastUpdate: Date.now()
  };

  private history: PerformanceHistory[] = [];
  private frameCount = 0;
  private lastFrameTime = performance.now();
  private updateTimer: number | null = null;
  private activeModule: { getMetrics(): ModuleMetrics | null } | null = null;

  // Throttled update function to prevent excessive DOM manipulation
  private throttledUpdateOverlay = throttle(() => this.updateOverlay(), this.config.updateInterval);

  constructor(config?: Partial<PerformanceConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  /**
   * Initialize the performance monitor with a container element.
   */
  initialize(container: HTMLElement): void {
    this.container = container;
    this.createOverlay();

    if (this.config.showOverlay) {
      this.show();
    }

    this.startMonitoring();
  }

  /**
   * Register the active demo module for metrics collection.
   */
  setActiveModule(module: { getMetrics(): ModuleMetrics | null } | null): void {
    this.activeModule = module;
  }

  /**
   * Update configuration settings.
   */
  updateConfig(config: Partial<PerformanceConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...config };

    // Handle position change
    if (config.position && config.position !== oldConfig.position) {
      this.updateOverlayPosition();
    }

    // Handle opacity change
    if (config.opacity !== undefined && this.overlay) {
      this.overlay.style.opacity = config.opacity.toString();
    }

    // Handle visibility change
    if (config.showOverlay !== undefined && config.showOverlay !== oldConfig.showOverlay) {
      if (config.showOverlay) {
        this.show();
      } else {
        this.hide();
      }
    }

    this.emit('configChange', config);
  }

  /**
   * Show the performance overlay.
   */
  show(): void {
    if (this.overlay && !this.isVisible) {
      this.overlay.style.display = 'block';
      this.isVisible = true;
      this.emit('overlayToggle', { visible: true });
    }
  }

  /**
   * Hide the performance overlay.
   */
  hide(): void {
    if (this.overlay && this.isVisible) {
      this.overlay.style.display = 'none';
      this.isVisible = false;
      this.emit('overlayToggle', { visible: false });
    }
  }

  /**
   * Toggle overlay visibility.
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Get current performance metrics.
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance history.
   */
  getHistory(): PerformanceHistory[] {
    return [...this.history];
  }

  /**
   * Get performance statistics from history.
   */
  getStatistics(): {
    avgFps: number;
    minFps: number;
    maxFps: number;
    avgFrameTime: number;
    memoryTrend: 'stable' | 'increasing' | 'decreasing';
  } {
    if (this.history.length === 0) {
      return {
        avgFps: 0,
        minFps: 0,
        maxFps: 0,
        avgFrameTime: 0,
        memoryTrend: 'stable'
      };
    }

    const recentHistory = this.history.slice(-60); // Last second of data
    const fps = recentHistory.map(h => h.metrics.fps);
    const frameTimes = recentHistory.map(h => h.metrics.frameTime);

    const avgFps = fps.reduce((sum, f) => sum + f, 0) / fps.length;
    const minFps = Math.min(...fps);
    const maxFps = Math.max(...fps);
    const avgFrameTime = frameTimes.reduce((sum, ft) => sum + ft, 0) / frameTimes.length;

    // Calculate memory trend
    let memoryTrend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (recentHistory.length >= 2) {
      const firstMemory = recentHistory[0].metrics.memoryUsage;
      const lastMemory = recentHistory[recentHistory.length - 1].metrics.memoryUsage;
      const threshold = firstMemory * 0.05; // 5% change threshold

      if (lastMemory > firstMemory + threshold) {
        memoryTrend = 'increasing';
      } else if (lastMemory < firstMemory - threshold) {
        memoryTrend = 'decreasing';
      }
    }

    return {
      avgFps: Number(avgFps.toFixed(1)),
      minFps: Number(minFps.toFixed(1)),
      maxFps: Number(maxFps.toFixed(1)),
      avgFrameTime: Number(avgFrameTime.toFixed(2)),
      memoryTrend
    };
  }

  /**
   * Update performance metrics (called by requestAnimationFrame).
   */
  updateMetrics(): void {
    const now = performance.now();

    // Calculate FPS
    this.frameCount++;
    const deltaTime = now - this.lastFrameTime;

    if (deltaTime >= 1000) { // Update FPS every second
      this.metrics.fps = Math.round(this.frameCount * 1000 / deltaTime);
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // Get module-specific metrics
    if (this.activeModule) {
      const moduleMetrics = this.activeModule.getMetrics();
      if (moduleMetrics) {
        this.metrics.frameTime = moduleMetrics.frameTime;
        this.metrics.renderTime = moduleMetrics.renderTime;
        this.metrics.totalNodes = moduleMetrics.nodeCount;
        this.metrics.totalEdges = moduleMetrics.edgeCount;
      }
    }

    // Get memory usage (if available)
    if ((performance as any).memory) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    this.metrics.lastUpdate = now;

    // Add to history
    this.history.push({
      timestamp: now,
      metrics: { ...this.metrics }
    });

    // Trim history to max size
    if (this.history.length > this.config.maxHistory) {
      this.history.shift();
    }

    // Update overlay if visible
    if (this.isVisible && this.overlay) {
      this.throttledUpdateOverlay();
    }

    // Emit metrics update event
    this.emit('metricsUpdate', { ...this.metrics });
  }

  /**
   * Start monitoring performance.
   */
  private startMonitoring(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();

    const monitor = () => {
      if (this.isRunning) {
        this.updateMetrics();
        requestAnimationFrame(monitor);
      }
    };

    requestAnimationFrame(monitor);
  }

  /**
   * Stop monitoring performance.
   */
  private stopMonitoring(): void {
    this.isRunning = false;
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
  }

  /**
   * Create the performance overlay element.
   */
  private createOverlay(): void {
    if (!this.container || this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'performance-overlay';
    this.overlay.className = 'performance-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      z-index: 10000;
      background: rgba(0, 0, 0, 0.8);
      color: #fff;
      font-family: 'Courier New', monospace;
      font-size: 11px;
      padding: 8px;
      border-radius: 4px;
      min-width: 180px;
      display: none;
      opacity: ${this.config.opacity};
      user-select: none;
      pointer-events: auto;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: opacity 0.2s ease;
    `;

    this.updateOverlayPosition();

    // Add toggle functionality
    this.overlay.addEventListener('dblclick', (e) => {
      e.preventDefault();
      this.config.enableDetails = !this.config.enableDetails;
      this.updateOverlay();
    });

    // Add keyboard shortcut (Ctrl/Cmd + P)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p' && e.shiftKey) {
        e.preventDefault();
        this.toggle();
      }
    });

    this.container.appendChild(this.overlay);
  }

  /**
   * Update overlay position based on configuration.
   */
  private updateOverlayPosition(): void {
    if (!this.overlay) return;

    const positions = {
      'top-left': { top: '10px', left: '10px', right: 'auto', bottom: 'auto' },
      'top-right': { top: '10px', left: 'auto', right: '10px', bottom: 'auto' },
      'bottom-left': { top: 'auto', left: '10px', right: 'auto', bottom: '10px' },
      'bottom-right': { top: 'auto', left: 'auto', right: '10px', bottom: '10px' }
    };

    const pos = positions[this.config.position];
    Object.assign(this.overlay.style, pos);
  }

  /**
   * Update the overlay content with current metrics.
   */
  private updateOverlay(): void {
    if (!this.overlay) return;

    const stats = this.getStatistics();
    const memoryTrendIcon = {
      'stable': '→',
      'increasing': '↗',
      'decreasing': '↘'
    }[stats.memoryTrend];

    let content = `
      <div style="margin-bottom: 4px; font-weight: bold; color: #4CAF50;">
        Performance Monitor
      </div>
      <div>FPS: <span style="color: ${this.getFpsColor(this.metrics.fps)}">${this.metrics.fps.toFixed(0)}</span></div>
      <div>Frame: ${formatDuration(this.metrics.frameTime)}</div>
      <div>Render: ${formatDuration(this.metrics.renderTime)}</div>
    `;

    if (this.metrics.memoryUsage > 0) {
      content += `<div>Memory: ${formatMemory(this.metrics.memoryUsage)} ${memoryTrendIcon}</div>`;
    }

    if (this.config.enableDetails) {
      content += `
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2);">
          <div>Nodes: ${formatNumber(this.metrics.totalNodes)}</div>
          <div>Edges: ${formatNumber(this.metrics.totalEdges)}</div>
          <div style="margin-top: 4px; font-size: 10px; color: #888;">
            Avg FPS: ${stats.avgFps} (${stats.minFps}-${stats.maxFps})
          </div>
          <div style="font-size: 10px; color: #888;">
            Double-click to toggle details
          </div>
        </div>
      `;
    } else {
      content += `
        <div style="margin-top: 4px; font-size: 10px; color: #888;">
          Double-click for details
        </div>
      `;
    }

    this.overlay.innerHTML = content;
  }

  /**
   * Get color based on FPS value.
   */
  private getFpsColor(fps: number): string {
    if (fps >= 50) return '#4CAF50'; // Green
    if (fps >= 30) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.stopMonitoring();

    if (this.overlay && this.container) {
      this.container.removeChild(this.overlay);
      this.overlay = null;
    }

    this.history = [];
    this.removeAllListeners();
  }

  /**
   * Export performance data for analysis.
   */
  exportData(): {
    config: PerformanceConfig;
    metrics: PerformanceMetrics;
    history: PerformanceHistory[];
    statistics: ReturnType<PerformanceMonitor['getStatistics']>;
    timestamp: number;
  } {
    return {
      config: { ...this.config },
      metrics: { ...this.metrics },
      history: [...this.history],
      statistics: this.getStatistics(),
      timestamp: Date.now()
    };
  }

  /**
   * Create a simple performance chart (ASCII art for debugging).
   */
  getPerformanceChart(width = 40, height = 10): string {
    if (this.history.length === 0) return 'No data available';

    const recentHistory = this.history.slice(-width);
    const fps = recentHistory.map(h => h.metrics.fps);
    const maxFps = Math.max(...fps, 60);
    const minFps = Math.min(...fps, 0);

    const lines: string[] = [];
    for (let row = height - 1; row >= 0; row--) {
      let line = '';
      const threshold = minFps + ((maxFps - minFps) * row / (height - 1));

      for (let col = 0; col < width; col++) {
        if (col < fps.length) {
          line += fps[col] >= threshold ? '█' : ' ';
        } else {
          line += ' ';
        }
      }
      lines.push(`${threshold.toFixed(0).padStart(2)} |${line}|`);
    }

    lines.push('   ' + '-'.repeat(width + 2));
    lines.push(`   FPS Chart (${fps.length} samples)`);

    return lines.join('\n');
  }
}

/**
 * Simple performance benchmark utilities.
 */
export class PerformanceBenchmark {
  private startTime = 0;
  private marks = new Map<string, number>();

  /**
   * Start timing an operation.
   */
  start(label?: string): void {
    this.startTime = performance.now();
    if (label) {
      this.marks.set(label + '_start', this.startTime);
    }
  }

  /**
   * End timing and return duration.
   */
  end(label?: string): number {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    if (label) {
      this.marks.set(label + '_end', endTime);
      this.marks.set(label + '_duration', duration);
    }

    return duration;
  }

  /**
   * Add a timing mark.
   */
  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  /**
   * Measure time between two marks.
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined) {
      throw new Error(`Start mark "${startMark}" not found`);
    }
    if (endMark && end === undefined) {
      throw new Error(`End mark "${endMark}" not found`);
    }

    const duration = end! - start;
    this.marks.set(name, duration);
    return duration;
  }

  /**
   * Get all marks and measurements.
   */
  getResults(): Record<string, number> {
    const results: Record<string, number> = {};
    for (const [key, value] of this.marks.entries()) {
      results[key] = value;
    }
    return results;
  }

  /**
   * Clear all marks and measurements.
   */
  clear(): void {
    this.marks.clear();
    this.startTime = 0;
  }
}

/**
 * Global performance monitor instance for easy access.
 */
let globalPerformanceMonitor: PerformanceMonitor | null = null;

export function getGlobalPerformanceMonitor(): PerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
  }
  return globalPerformanceMonitor;
}

export function initializeGlobalPerformanceMonitor(container: HTMLElement, config?: Partial<PerformanceConfig>): PerformanceMonitor {
  if (globalPerformanceMonitor) {
    globalPerformanceMonitor.destroy();
  }

  globalPerformanceMonitor = new PerformanceMonitor(config);
  globalPerformanceMonitor.initialize(container);
  return globalPerformanceMonitor;
}