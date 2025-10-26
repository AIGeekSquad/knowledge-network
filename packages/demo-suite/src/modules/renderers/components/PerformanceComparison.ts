/**
 * Performance Comparison Component
 *
 * Provides real-time performance monitoring and comparison across different renderers,
 * tracking FPS, memory usage, draw calls, and render times with gaming-inspired metrics display.
 */

import type { RendererType, RendererMetrics } from '../RendererComparison.js';

export interface PerformanceSnapshot {
  timestamp: number;
  renderer: RendererType;
  metrics: RendererMetrics;
}

export interface PerformanceTrend {
  renderer: RendererType;
  history: PerformanceSnapshot[];
  averages: {
    fps: number;
    memoryUsage: number;
    renderTime: number;
    drawCalls: number;
  };
  peaks: {
    maxFps: number;
    maxMemory: number;
    maxRenderTime: number;
  };
}

export interface PerformanceComparisonEvents {
  metricsUpdate: (metrics: Record<RendererType, RendererMetrics>) => void;
  trendUpdate: (trends: Record<RendererType, PerformanceTrend>) => void;
  performanceAlert: (renderer: RendererType, issue: string, severity: 'warning' | 'critical') => void;
}

/**
 * PerformanceComparison provides real-time monitoring and analysis of renderer performance
 */
export class PerformanceComparison {
  private container: HTMLElement;
  private isInitialized = false;
  private isMonitoring = false;

  private performanceHistory: Map<RendererType, PerformanceSnapshot[]> = new Map();
  private currentMetrics: Map<RendererType, RendererMetrics> = new Map();
  private eventListeners: Map<keyof PerformanceComparisonEvents, Set<Function>> = new Map();

  private updateInterval: number | null = null;
  private historyLimit = 100; // Keep last 100 measurements per renderer
  private alertThresholds = {
    lowFps: 30,
    highMemory: 200 * 1024 * 1024, // 200MB
    highRenderTime: 50 // 50ms
  };

  // UI Elements
  private metricsDisplay: HTMLElement | null = null;
  private trendsChart: HTMLElement | null = null;
  private alertsPanel: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public initialize(): void {
    this.createPerformanceInterface();
    this.setupEventHandlers();
    this.startMonitoring();
    this.isInitialized = true;
  }

  public update(): void {
    if (!this.isInitialized || !this.isMonitoring) return;

    this.updateMetricsDisplay();
    this.updateTrendsChart();
    this.checkPerformanceAlerts();
  }

  public updateMetrics(rendererType: RendererType, metrics: RendererMetrics): void {
    // Store current metrics
    this.currentMetrics.set(rendererType, { ...metrics });

    // Add to history
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      renderer: rendererType,
      metrics: { ...metrics }
    };

    if (!this.performanceHistory.has(rendererType)) {
      this.performanceHistory.set(rendererType, []);
    }

    const history = this.performanceHistory.get(rendererType)!;
    history.push(snapshot);

    // Maintain history limit
    if (history.length > this.historyLimit) {
      history.shift();
    }

    // Emit metrics update
    this.emitMetricsUpdate();
  }

  public getPerformanceTrends(): Record<string, PerformanceTrend> {
    const trends: Record<string, PerformanceTrend> = {};

    for (const [renderer, history] of this.performanceHistory) {
      if (history.length === 0) continue;

      trends[renderer] = this.calculateTrend(renderer, history);
    }

    return trends;
  }

  public exportPerformanceData(): string {
    const exportData = {
      timestamp: new Date().toISOString(),
      renderers: Array.from(this.performanceHistory.keys()),
      history: Object.fromEntries(this.performanceHistory),
      trends: this.getPerformanceTrends(),
      thresholds: this.alertThresholds
    };

    return JSON.stringify(exportData, null, 2);
  }

  public cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    this.isMonitoring = false;
    this.eventListeners.clear();
    this.performanceHistory.clear();
    this.currentMetrics.clear();
  }

  // Event emitter methods
  public on<K extends keyof PerformanceComparisonEvents>(event: K, callback: PerformanceComparisonEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off<K extends keyof PerformanceComparisonEvents>(event: K, callback: PerformanceComparisonEvents[K]): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof PerformanceComparisonEvents>(event: K, ...args: Parameters<PerformanceComparisonEvents[K]>): void {
    this.eventListeners.get(event)?.forEach(callback => {
      (callback as Function)(...args);
    });
  }

  private createPerformanceInterface(): void {
    this.container.innerHTML = `
      <div class="performance-comparison">
        <!-- Header -->
        <div class="performance-header">
          <h3>Performance Monitor</h3>
          <div class="performance-controls">
            <button class="toggle-monitoring-btn ui-button ui-button--small ui-button--secondary">
              <span class="monitoring-status">●</span>
              Monitoring
            </button>
            <button class="export-data-btn ui-button ui-button--small ui-button--ghost">
              Export Data
            </button>
          </div>
        </div>

        <!-- Real-time Metrics Display -->
        <div class="metrics-section" id="metrics-display">
          <h4>Live Metrics</h4>
          <div class="metrics-grid">
            <!-- Metrics will be populated dynamically -->
          </div>
        </div>

        <!-- Performance Trends Chart -->
        <div class="trends-section" id="trends-chart">
          <h4>Performance Trends</h4>
          <div class="chart-controls">
            <select class="metric-selector">
              <option value="fps">FPS</option>
              <option value="memory">Memory Usage</option>
              <option value="renderTime">Render Time</option>
              <option value="drawCalls">Draw Calls</option>
            </select>
            <select class="timespan-selector">
              <option value="30">Last 30s</option>
              <option value="60">Last 60s</option>
              <option value="300">Last 5min</option>
            </select>
          </div>
          <div class="chart-container">
            <canvas class="trends-canvas"></canvas>
          </div>
        </div>

        <!-- Performance Alerts -->
        <div class="alerts-section" id="alerts-panel">
          <h4>Performance Alerts</h4>
          <div class="alerts-list">
            <!-- Alerts will be populated dynamically -->
          </div>
        </div>

        <!-- Comparison Summary -->
        <div class="summary-section">
          <h4>Renderer Comparison</h4>
          <div class="comparison-table">
            <div class="table-header">
              <div class="col-renderer">Renderer</div>
              <div class="col-fps">FPS</div>
              <div class="col-memory">Memory</div>
              <div class="col-render-time">Render Time</div>
              <div class="col-rating">Rating</div>
            </div>
            <div class="table-body" id="comparison-table-body">
              <!-- Comparison rows will be populated dynamically -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.metricsDisplay = this.container.querySelector('#metrics-display');
    this.trendsChart = this.container.querySelector('#trends-chart');
    this.alertsPanel = this.container.querySelector('#alerts-panel');

    this.applyPerformanceStyling();
  }

  private applyPerformanceStyling(): void {
    const style = document.createElement('style');
    style.textContent = `
      .performance-comparison {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: var(--space-4);
      }

      .performance-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4);
        background: var(--color-bg-primary);
        border: 1px solid var(--color-gray-600);
        border-radius: var(--radius-base);
      }

      .performance-header h3 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
      }

      .performance-controls {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }

      .monitoring-status {
        color: var(--color-success);
        font-size: var(--font-size-sm);
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
      }

      .metrics-section,
      .trends-section,
      .alerts-section,
      .summary-section {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-gray-600);
        border-radius: var(--radius-base);
        padding: var(--space-4);
      }

      .metrics-section h4,
      .trends-section h4,
      .alerts-section h4,
      .summary-section h4 {
        margin: 0 0 var(--space-3) 0;
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        border-bottom: 1px solid var(--color-gray-600);
        padding-bottom: var(--space-2);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-3);
      }

      .metric-card {
        background: var(--color-bg-surface);
        border: 1px solid var(--color-gray-700);
        border-radius: var(--radius-base);
        padding: var(--space-3);
        position: relative;
      }

      .metric-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        border-radius: var(--radius-base) var(--radius-base) 0 0;
      }

      .metric-card[data-renderer="svg"]::before {
        background: var(--color-primary);
      }
      .metric-card[data-renderer="canvas"]::before {
        background: var(--color-secondary);
      }
      .metric-card[data-renderer="webgl"]::before {
        background: var(--color-accent);
      }

      .metric-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .metric-renderer {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .metric-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-success);
      }

      .metric-status.warning {
        background: var(--color-warning);
      }

      .metric-status.critical {
        background: var(--color-danger);
      }

      .metric-values {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        font-size: var(--font-size-sm);
      }

      .metric-label {
        color: var(--color-text-secondary);
      }

      .metric-value {
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .chart-controls {
        display: flex;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      }

      .metric-selector,
      .timespan-selector {
        background: var(--color-bg-surface);
        border: 1px solid var(--color-gray-600);
        color: var(--color-text-primary);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-base);
        font-size: var(--font-size-sm);
      }

      .chart-container {
        position: relative;
        height: 200px;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-gray-700);
        border-radius: var(--radius-base);
        overflow: hidden;
      }

      .trends-canvas {
        width: 100%;
        height: 100%;
        display: block;
      }

      .alerts-list {
        max-height: 150px;
        overflow-y: auto;
      }

      .alert-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-2) var(--space-3);
        margin-bottom: var(--space-2);
        border-radius: var(--radius-base);
        border-left: 4px solid;
      }

      .alert-item.warning {
        background: rgba(255, 140, 0, 0.1);
        border-left-color: var(--color-warning);
      }

      .alert-item.critical {
        background: rgba(244, 67, 54, 0.1);
        border-left-color: var(--color-danger);
      }

      .alert-icon {
        font-size: var(--font-size-base);
      }

      .alert-content {
        flex: 1;
      }

      .alert-renderer {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        margin-bottom: var(--space-1);
      }

      .alert-message {
        font-size: var(--font-size-sm);
        color: var(--color-text-primary);
      }

      .alert-timestamp {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        font-family: var(--font-family-mono);
      }

      .comparison-table {
        overflow-x: auto;
      }

      .table-header,
      .table-row {
        display: grid;
        grid-template-columns: 1fr 80px 100px 120px 80px;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        align-items: center;
      }

      .table-header {
        background: var(--color-bg-surface);
        border-radius: var(--radius-base) var(--radius-base) 0 0;
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        color: var(--color-text-secondary);
        border-bottom: 1px solid var(--color-gray-600);
      }

      .table-row {
        border-bottom: 1px solid var(--color-gray-700);
        font-size: var(--font-size-sm);
      }

      .table-row:last-child {
        border-bottom: none;
        border-radius: 0 0 var(--radius-base) var(--radius-base);
      }

      .renderer-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .performance-rating {
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
        text-align: center;
      }

      .performance-rating.excellent {
        background: rgba(76, 175, 80, 0.2);
        color: var(--color-success);
      }

      .performance-rating.good {
        background: rgba(255, 185, 0, 0.2);
        color: var(--color-accent);
      }

      .performance-rating.fair {
        background: rgba(255, 140, 0, 0.2);
        color: var(--color-warning);
      }

      .performance-rating.poor {
        background: rgba(244, 67, 54, 0.2);
        color: var(--color-danger);
      }

      /* Responsive design */
      @media (max-width: 1024px) {
        .performance-header {
          flex-direction: column;
          gap: var(--space-2);
          text-align: center;
        }

        .metrics-grid {
          grid-template-columns: 1fr;
        }

        .chart-controls {
          flex-direction: column;
          align-items: stretch;
        }

        .table-header,
        .table-row {
          grid-template-columns: 1fr 60px 80px 100px 60px;
          font-size: var(--font-size-xs);
        }
      }

      @media (max-width: 640px) {
        .performance-controls {
          flex-direction: column;
          width: 100%;
        }

        .comparison-table {
          font-size: var(--font-size-xs);
        }

        .table-header,
        .table-row {
          grid-template-columns: 1fr 50px 70px 90px 50px;
        }
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventHandlers(): void {
    // Toggle monitoring button
    const toggleBtn = this.container.querySelector('.toggle-monitoring-btn');
    toggleBtn?.addEventListener('click', () => this.toggleMonitoring());

    // Export data button
    const exportBtn = this.container.querySelector('.export-data-btn');
    exportBtn?.addEventListener('click', () => this.handleExportData());

    // Chart controls
    const metricSelector = this.container.querySelector('.metric-selector');
    const timespanSelector = this.container.querySelector('.timespan-selector');

    metricSelector?.addEventListener('change', () => this.updateTrendsChart());
    timespanSelector?.addEventListener('change', () => this.updateTrendsChart());
  }

  private startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 1000); // Update every second
  }

  private stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private toggleMonitoring(): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }

    this.updateMonitoringButton();
  }

  private updateMonitoringButton(): void {
    const button = this.container.querySelector('.toggle-monitoring-btn');
    const status = this.container.querySelector('.monitoring-status');

    if (button && status) {
      button.textContent = this.isMonitoring ? 'Stop Monitoring' : 'Start Monitoring';
      status.textContent = this.isMonitoring ? '●' : '○';
    }
  }

  private handleExportData(): void {
    const data = this.exportPerformanceData();

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-data-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  private updateMetricsDisplay(): void {
    if (!this.metricsDisplay) return;

    const metricsGrid = this.metricsDisplay.querySelector('.metrics-grid');
    if (!metricsGrid) return;

    metricsGrid.innerHTML = '';

    // Create metric cards for each active renderer
    for (const [renderer, metrics] of this.currentMetrics) {
      const card = this.createMetricCard(renderer, metrics);
      metricsGrid.appendChild(card);
    }

    // Update comparison table
    this.updateComparisonTable();
  }

  private createMetricCard(renderer: RendererType, metrics: RendererMetrics): HTMLElement {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.dataset.renderer = renderer;

    const status = this.getPerformanceStatus(metrics);

    card.innerHTML = `
      <div class="metric-header">
        <span class="metric-renderer">${renderer.toUpperCase()}</span>
        <div class="metric-status ${status}"></div>
      </div>
      <div class="metric-values">
        <div class="metric-row">
          <span class="metric-label">FPS:</span>
          <span class="metric-value">${Math.round(metrics.fps)}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Memory:</span>
          <span class="metric-value">${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Render Time:</span>
          <span class="metric-value">${metrics.renderTime.toFixed(1)}ms</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Draw Calls:</span>
          <span class="metric-value">${metrics.drawCalls}</span>
        </div>
      </div>
    `;

    return card;
  }

  private updateTrendsChart(): void {
    const canvas = this.container.querySelector('.trends-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Get selected metric and timespan
    const metricSelector = this.container.querySelector('.metric-selector') as HTMLSelectElement;
    const timespanSelector = this.container.querySelector('.timespan-selector') as HTMLSelectElement;

    const metric = metricSelector?.value || 'fps';
    const timespan = parseInt(timespanSelector?.value || '60') * 1000; // Convert to milliseconds

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw chart
    this.drawPerformanceChart(ctx, canvas, metric, timespan);
  }

  private drawPerformanceChart(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    metric: string,
    timespan: number
  ): void {
    const now = Date.now();
    const startTime = now - timespan;
    const padding = 40;
    const chartWidth = canvas.width - 2 * padding;
    const chartHeight = canvas.height - 2 * padding;

    // Set up rendering
    ctx.font = '12px monospace';
    ctx.lineWidth = 2;

    // Colors for each renderer
    const colors = {
      svg: '#107c10',
      canvas: '#00bcf2',
      webgl: '#ffb900'
    };

    // Draw chart for each renderer
    for (const [renderer, history] of this.performanceHistory) {
      if (history.length === 0) continue;

      // Filter data within timespan
      const data = history.filter(snapshot => snapshot.timestamp >= startTime);
      if (data.length < 2) continue;

      // Get values and normalize
      const values = data.map(snapshot => this.getMetricValue(snapshot.metrics, metric));
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const valueRange = maxValue - minValue || 1;

      // Draw line
      ctx.strokeStyle = colors[renderer] || '#666';
      ctx.beginPath();

      data.forEach((snapshot, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const value = this.getMetricValue(snapshot.metrics, metric);
        const normalizedValue = (value - minValue) / valueRange;
        const y = padding + chartHeight * (1 - normalizedValue);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw legend
      const legendY = padding + Object.keys(colors).indexOf(renderer) * 20;
      ctx.fillStyle = colors[renderer] || '#666';
      ctx.fillRect(10, legendY, 10, 10);
      ctx.fillStyle = '#fff';
      ctx.fillText(renderer.toUpperCase(), 25, legendY + 8);
    }

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + chartHeight);
    ctx.stroke();

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + chartHeight);
    ctx.lineTo(padding + chartWidth, padding + chartHeight);
    ctx.stroke();
  }

  private updateComparisonTable(): void {
    const tableBody = this.container.querySelector('#comparison-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    for (const [renderer, metrics] of this.currentMetrics) {
      const row = this.createComparisonRow(renderer, metrics);
      tableBody.appendChild(row);
    }
  }

  private createComparisonRow(renderer: RendererType, metrics: RendererMetrics): HTMLElement {
    const row = document.createElement('div');
    row.className = 'table-row';

    const rating = this.calculatePerformanceRating(metrics);

    row.innerHTML = `
      <div class="renderer-name">${renderer.toUpperCase()}</div>
      <div>${Math.round(metrics.fps)}</div>
      <div>${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
      <div>${metrics.renderTime.toFixed(1)}ms</div>
      <div class="performance-rating ${rating.class}">${rating.label}</div>
    `;

    return row;
  }

  private checkPerformanceAlerts(): void {
    for (const [renderer, metrics] of this.currentMetrics) {
      // Check FPS
      if (metrics.fps < this.alertThresholds.lowFps) {
        this.emitPerformanceAlert(renderer, `Low FPS: ${Math.round(metrics.fps)}`, 'warning');
      }

      // Check memory usage
      if (metrics.memoryUsage > this.alertThresholds.highMemory) {
        this.emitPerformanceAlert(renderer,
          `High memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
          'critical'
        );
      }

      // Check render time
      if (metrics.renderTime > this.alertThresholds.highRenderTime) {
        this.emitPerformanceAlert(renderer,
          `Slow render time: ${metrics.renderTime.toFixed(1)}ms`,
          'warning'
        );
      }
    }
  }

  private emitMetricsUpdate(): void {
    const metricsObject: Record<string, RendererMetrics> = {};
    for (const [renderer, metrics] of this.currentMetrics) {
      metricsObject[renderer] = metrics;
    }

    this.emit('metricsUpdate', metricsObject);
  }

  private emitPerformanceAlert(renderer: RendererType, issue: string, severity: 'warning' | 'critical'): void {
    this.emit('performanceAlert', renderer, issue, severity);
    this.displayAlert(renderer, issue, severity);
  }

  private displayAlert(renderer: RendererType, issue: string, severity: 'warning' | 'critical'): void {
    const alertsList = this.alertsPanel?.querySelector('.alerts-list');
    if (!alertsList) return;

    const alert = document.createElement('div');
    alert.className = `alert-item ${severity}`;

    const icon = severity === 'critical' ? '⚠️' : '⚡';
    const timestamp = new Date().toLocaleTimeString();

    alert.innerHTML = `
      <div class="alert-icon">${icon}</div>
      <div class="alert-content">
        <div class="alert-renderer">${renderer.toUpperCase()}</div>
        <div class="alert-message">${issue}</div>
      </div>
      <div class="alert-timestamp">${timestamp}</div>
    `;

    // Add to top of list
    alertsList.insertBefore(alert, alertsList.firstChild);

    // Remove old alerts (keep max 5)
    const alerts = alertsList.querySelectorAll('.alert-item');
    if (alerts.length > 5) {
      alerts[alerts.length - 1].remove();
    }
  }

  private calculateTrend(renderer: RendererType, history: PerformanceSnapshot[]): PerformanceTrend {
    if (history.length === 0) {
      return {
        renderer,
        history: [],
        averages: { fps: 0, memoryUsage: 0, renderTime: 0, drawCalls: 0 },
        peaks: { maxFps: 0, maxMemory: 0, maxRenderTime: 0 }
      };
    }

    const fps = history.map(s => s.metrics.fps);
    const memory = history.map(s => s.metrics.memoryUsage);
    const renderTime = history.map(s => s.metrics.renderTime);
    const drawCalls = history.map(s => s.metrics.drawCalls);

    return {
      renderer,
      history: [...history],
      averages: {
        fps: fps.reduce((a, b) => a + b, 0) / fps.length,
        memoryUsage: memory.reduce((a, b) => a + b, 0) / memory.length,
        renderTime: renderTime.reduce((a, b) => a + b, 0) / renderTime.length,
        drawCalls: drawCalls.reduce((a, b) => a + b, 0) / drawCalls.length
      },
      peaks: {
        maxFps: Math.max(...fps),
        maxMemory: Math.max(...memory),
        maxRenderTime: Math.max(...renderTime)
      }
    };
  }

  private getMetricValue(metrics: RendererMetrics, metricName: string): number {
    switch (metricName) {
      case 'fps': return metrics.fps;
      case 'memory': return metrics.memoryUsage / 1024 / 1024; // Convert to MB
      case 'renderTime': return metrics.renderTime;
      case 'drawCalls': return metrics.drawCalls;
      default: return 0;
    }
  }

  private getPerformanceStatus(metrics: RendererMetrics): string {
    if (metrics.fps < this.alertThresholds.lowFps ||
        metrics.memoryUsage > this.alertThresholds.highMemory ||
        metrics.renderTime > this.alertThresholds.highRenderTime) {
      return 'critical';
    }

    if (metrics.fps < 45 || metrics.renderTime > 25) {
      return 'warning';
    }

    return 'good';
  }

  private calculatePerformanceRating(metrics: RendererMetrics): { class: string; label: string } {
    let score = 0;

    // FPS scoring (0-4 points)
    if (metrics.fps >= 60) score += 4;
    else if (metrics.fps >= 45) score += 3;
    else if (metrics.fps >= 30) score += 2;
    else if (metrics.fps >= 15) score += 1;

    // Render time scoring (0-3 points)
    if (metrics.renderTime <= 16.67) score += 3; // 60fps target
    else if (metrics.renderTime <= 33.33) score += 2; // 30fps target
    else if (metrics.renderTime <= 50) score += 1;

    // Memory efficiency scoring (0-3 points)
    const memoryMB = metrics.memoryUsage / 1024 / 1024;
    if (memoryMB <= 50) score += 3;
    else if (memoryMB <= 100) score += 2;
    else if (memoryMB <= 200) score += 1;

    // Convert score to rating
    if (score >= 8) return { class: 'excellent', label: 'A+' };
    if (score >= 6) return { class: 'good', label: 'B+' };
    if (score >= 4) return { class: 'fair', label: 'C+' };
    return { class: 'poor', label: 'D' };
  }
}