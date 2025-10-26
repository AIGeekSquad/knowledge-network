/**
 * Metrics Dashboard Component
 *
 * Real-time performance metrics display with Xbox-inspired styling.
 * Shows FPS, render time, memory usage, and performance trends.
 */

import { BaseComponent, Panel, MetricsDisplay } from '../../../shared/UIComponents.js';
import { formatNumber, formatDuration, formatMemory } from '../../../shared/utils.js';
import type { ScaleTestResult } from '../PerformanceShowcase.js';

export interface MetricsDashboardConfig {
  updateInterval?: number;
  showDetails?: boolean;
  enableTrends?: boolean;
  maxHistoryLength?: number;
}

interface PerformanceHistory {
  timestamp: number;
  fps: number;
  renderTime: number;
  memoryUsage: number;
  selectionTime: number;
}

/**
 * Real-time metrics dashboard with Xbox-themed styling and performance visualization
 */
export class MetricsDashboard extends BaseComponent<{
  metricsUpdate: { metrics: any };
}> {
  private config: MetricsDashboardConfig;
  private metricsDisplay: MetricsDisplay | null = null;
  private trendChart: HTMLElement | null = null;
  private performanceHistory: PerformanceHistory[] = [];
  private updateTimer: number | null = null;

  private currentMetrics = {
    fps: 60,
    renderTime: 16,
    memoryUsage: 0,
    selectionTime: 0.1,
    nodeCount: 1000,
    gpuMemory: 0
  };

  constructor(config: MetricsDashboardConfig = {}) {
    super('div', 'metrics-dashboard');
    this.config = {
      updateInterval: 1000,
      showDetails: true,
      enableTrends: true,
      maxHistoryLength: 60,
      ...config
    };

    this.setupComponent();
    this.startUpdating();
  }

  private setupComponent(): void {
    // Create panel container with Xbox styling
    const panel = new Panel({
      title: '📊 Performance Metrics',
      collapsible: true,
      expanded: true,
      className: 'metrics-dashboard-panel'
    });

    // Add custom Xbox-style header styling
    const panelElement = panel.getElement();
    panelElement.style.cssText += `
      background: linear-gradient(135deg, var(--color-bg-surface), var(--color-gray-700));
      border: 1px solid var(--color-secondary);
      box-shadow: 0 0 15px rgba(0, 188, 242, 0.2);
    `;

    // Create content container
    const content = document.createElement('div');
    content.className = 'metrics-dashboard-content';
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
    `;

    // Add real-time metrics section
    this.createRealTimeMetrics(content);

    // Add performance trends (if enabled)
    if (this.config.enableTrends) {
      this.createTrendVisualization(content);
    }

    // Add detailed metrics section
    if (this.config.showDetails) {
      this.createDetailedMetrics(content);
    }

    panel.addContent(content);
    this.element.appendChild(panel.getElement());
  }

  private createRealTimeMetrics(container: HTMLElement): void {
    const metricsContainer = document.createElement('div');
    metricsContainer.className = 'real-time-metrics';
    metricsContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Create metrics grid
    const metricsGrid = document.createElement('div');
    metricsGrid.style.cssText = `
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-3);
    `;

    // Primary metrics
    const primaryMetrics = [
      {
        id: 'fps-metric',
        label: 'FPS',
        value: '60',
        unit: 'fps',
        color: 'var(--color-success)',
        icon: '🎯'
      },
      {
        id: 'render-metric',
        label: 'Render Time',
        value: '16.7',
        unit: 'ms',
        color: 'var(--color-secondary)',
        icon: '⚡'
      },
      {
        id: 'memory-metric',
        label: 'Memory',
        value: '—',
        unit: 'MB',
        color: 'var(--color-warning)',
        icon: '💾'
      },
      {
        id: 'selection-metric',
        label: 'Selection',
        value: '<1',
        unit: 'ms',
        color: 'var(--color-primary)',
        icon: '🔍'
      }
    ];

    primaryMetrics.forEach(metric => {
      const metricCard = document.createElement('div');
      metricCard.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-3);
        background: var(--color-gray-900);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-base);
        position: relative;
        overflow: hidden;
      `;

      // Add subtle glow effect
      metricCard.style.boxShadow = `0 0 10px ${metric.color}20`;

      metricCard.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        ">
          <span style="font-size: var(--font-size-base);">${metric.icon}</span>
          <span style="
            font-size: var(--font-size-xs);
            color: var(--color-text-secondary);
            font-weight: var(--font-weight-medium);
          ">${metric.label}</span>
        </div>
        <div style="
          display: flex;
          align-items: baseline;
          gap: var(--space-1);
        ">
          <span id="${metric.id}-value" style="
            font-size: var(--font-size-xl);
            font-weight: var(--font-weight-bold);
            color: ${metric.color};
            font-family: var(--font-family-mono);
            text-shadow: 0 0 8px ${metric.color}50;
          ">${metric.value}</span>
          <span style="
            font-size: var(--font-size-xs);
            color: var(--color-text-muted);
          ">${metric.unit}</span>
        </div>
      `;

      metricsGrid.appendChild(metricCard);
    });

    metricsContainer.appendChild(metricsGrid);
    container.appendChild(metricsContainer);
  }

  private createTrendVisualization(container: HTMLElement): void {
    const trendContainer = document.createElement('div');
    trendContainer.className = 'trend-visualization';
    trendContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-3);
    `;
    header.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-semibold);
      ">
        📈 <span>Performance Trends</span>
      </div>
      <div style="
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
      ">Last 60s</div>
    `;

    // Create ASCII-style trend chart
    this.trendChart = document.createElement('div');
    this.trendChart.id = 'trend-chart';
    this.trendChart.style.cssText = `
      font-family: var(--font-family-mono);
      font-size: 10px;
      line-height: 1;
      color: var(--color-secondary);
      background: var(--color-black);
      padding: var(--space-3);
      border-radius: var(--radius-base);
      overflow-x: auto;
      white-space: pre;
      border: 1px solid var(--color-border-dark);
    `;

    trendContainer.appendChild(header);
    trendContainer.appendChild(this.trendChart);
    container.appendChild(trendContainer);

    // Initialize with empty chart
    this.updateTrendChart();
  }

  private createDetailedMetrics(container: HTMLElement): void {
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'detailed-metrics';
    detailsContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
    `;
    header.innerHTML = `🔬 <span>Detailed Analysis</span>`;

    // Create detailed metrics list
    const detailsList = document.createElement('div');
    detailsList.className = 'details-list';
    detailsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
    `;

    const detailedMetrics = [
      { id: 'avg-fps', label: 'Avg FPS (60s)', value: '60.0' },
      { id: 'min-fps', label: 'Min FPS', value: '58.2' },
      { id: 'max-render', label: 'Max Render', value: '18.3ms' },
      { id: 'gpu-usage', label: 'GPU Memory', value: '—' },
      { id: 'frame-drops', label: 'Frame Drops', value: '0' },
      { id: 'efficiency', label: 'Efficiency', value: '98.5%' }
    ];

    detailedMetrics.forEach(metric => {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-1) 0;
        border-bottom: 1px solid var(--color-border-light);
      `;
      row.innerHTML = `
        <span style="color: var(--color-text-secondary);">${metric.label}:</span>
        <span id="${metric.id}-value" style="
          color: var(--color-text-primary);
          font-weight: var(--font-weight-semibold);
        ">${metric.value}</span>
      `;
      detailsList.appendChild(row);
    });

    detailsContainer.appendChild(header);
    detailsContainer.appendChild(detailsList);
    container.appendChild(detailsContainer);
  }

  private startUpdating(): void {
    if (this.updateTimer) return;

    this.updateTimer = window.setInterval(() => {
      this.updateMetrics();
    }, this.config.updateInterval);
  }

  private updateMetrics(): void {
    // Add current metrics to history
    this.addToHistory();

    // Update real-time display
    this.updateRealTimeDisplay();

    // Update trend chart
    if (this.config.enableTrends) {
      this.updateTrendChart();
    }

    // Update detailed metrics
    if (this.config.showDetails) {
      this.updateDetailedDisplay();
    }

    // Emit metrics update event
    this.emit('metricsUpdate', { metrics: this.currentMetrics });
  }

  private addToHistory(): void {
    const historyEntry: PerformanceHistory = {
      timestamp: Date.now(),
      fps: this.currentMetrics.fps,
      renderTime: this.currentMetrics.renderTime,
      memoryUsage: this.currentMetrics.memoryUsage,
      selectionTime: this.currentMetrics.selectionTime
    };

    this.performanceHistory.push(historyEntry);

    // Limit history length
    if (this.performanceHistory.length > (this.config.maxHistoryLength || 60)) {
      this.performanceHistory.shift();
    }
  }

  private updateRealTimeDisplay(): void {
    // Update FPS
    const fpsElement = document.querySelector('#fps-metric-value');
    if (fpsElement) {
      fpsElement.textContent = this.currentMetrics.fps.toFixed(0);
      const color = this.currentMetrics.fps >= 50 ? 'var(--color-success)' :
                    this.currentMetrics.fps >= 30 ? 'var(--color-warning)' : 'var(--color-danger)';
      (fpsElement as HTMLElement).style.color = color;
      (fpsElement as HTMLElement).style.textShadow = `0 0 8px ${color}50`;
    }

    // Update render time
    const renderElement = document.querySelector('#render-metric-value');
    if (renderElement) {
      renderElement.textContent = formatDuration(this.currentMetrics.renderTime).replace('ms', '');
    }

    // Update memory
    const memoryElement = document.querySelector('#memory-metric-value');
    if (memoryElement) {
      if (this.currentMetrics.memoryUsage > 0) {
        const memoryMB = this.currentMetrics.memoryUsage / (1024 * 1024);
        memoryElement.textContent = memoryMB.toFixed(1);
      } else {
        memoryElement.textContent = '—';
      }
    }

    // Update selection time
    const selectionElement = document.querySelector('#selection-metric-value');
    if (selectionElement) {
      selectionElement.textContent = this.currentMetrics.selectionTime < 1 ?
        '<1' : this.currentMetrics.selectionTime.toFixed(1);
    }
  }

  private updateTrendChart(): void {
    if (!this.trendChart || this.performanceHistory.length === 0) {
      if (this.trendChart) {
        this.trendChart.textContent = 'No data available yet...';
      }
      return;
    }

    const width = 50;
    const height = 8;

    // Generate FPS trend chart
    const fpsData = this.performanceHistory.slice(-width).map(h => h.fps);
    const minFps = Math.min(...fpsData, 0);
    const maxFps = Math.max(...fpsData, 60);

    let chart = '';
    for (let row = height - 1; row >= 0; row--) {
      const threshold = minFps + ((maxFps - minFps) * row / (height - 1));
      let line = `${threshold.toFixed(0).padStart(2)} |`;

      for (let col = 0; col < width; col++) {
        if (col < fpsData.length) {
          const value = fpsData[col];
          if (value >= threshold) {
            line += value >= 50 ? '█' : value >= 30 ? '▓' : '▒';
          } else {
            line += ' ';
          }
        } else {
          line += ' ';
        }
      }
      line += '|';
      chart += line + '\n';
    }

    chart += '   ' + '-'.repeat(width + 2) + '\n';
    chart += `   FPS Chart (${fpsData.length}s)`;

    this.trendChart.textContent = chart;
  }

  private updateDetailedDisplay(): void {
    if (this.performanceHistory.length === 0) return;

    const recent = this.performanceHistory.slice(-60); // Last 60 seconds
    const fps = recent.map(h => h.fps);
    const renderTimes = recent.map(h => h.renderTime);

    // Calculate statistics
    const avgFps = fps.reduce((sum, f) => sum + f, 0) / fps.length;
    const minFps = Math.min(...fps);
    const maxRender = Math.max(...renderTimes);
    const frameDrops = fps.filter(f => f < 30).length;
    const efficiency = ((fps.filter(f => f >= 50).length / fps.length) * 100);

    // Update displays
    this.updateDetailValue('avg-fps', avgFps.toFixed(1));
    this.updateDetailValue('min-fps', minFps.toFixed(1));
    this.updateDetailValue('max-render', formatDuration(maxRender));
    this.updateDetailValue('frame-drops', frameDrops.toString());
    this.updateDetailValue('efficiency', efficiency.toFixed(1) + '%');

    if (this.currentMetrics.gpuMemory > 0) {
      const gpuMB = this.currentMetrics.gpuMemory / (1024 * 1024);
      this.updateDetailValue('gpu-usage', gpuMB.toFixed(1) + 'MB');
    }
  }

  private updateDetailValue(id: string, value: string): void {
    const element = document.querySelector(`#${id}-value`);
    if (element) {
      element.textContent = value;
    }
  }

  public updateResults(results: ScaleTestResult[]): void {
    if (results.length === 0) return;

    // Use latest result to update current metrics
    const latest = results[results.length - 1];
    this.currentMetrics = {
      fps: latest.fps,
      renderTime: latest.renderTime,
      memoryUsage: latest.memoryUsage,
      selectionTime: latest.selectionTime,
      nodeCount: latest.nodeCount,
      gpuMemory: this.currentMetrics.gpuMemory
    };

    // Force update display
    this.updateMetrics();
  }

  public updateCurrentMetrics(metrics: Partial<typeof this.currentMetrics>): void {
    this.currentMetrics = { ...this.currentMetrics, ...metrics };
  }

  public destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }

    this.metricsDisplay?.destroy();
    super.destroy();
  }
}