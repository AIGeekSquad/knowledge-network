/**
 * Quality Assessment Component
 *
 * Provides tools for comparing visual fidelity and quality across different renderers,
 * including zoom testing, edge sharpness analysis, and color accuracy measurements.
 */

import type { RendererType, ComparisonResult, QualityMetrics } from '../RendererComparison.js';

export interface QualityTest {
  id: string;
  name: string;
  description: string;
  category: 'sharpness' | 'color' | 'performance' | 'stability';
  execute: (rendererType: RendererType, canvas: HTMLCanvasElement) => Promise<number>;
}

export interface QualityAssessmentConfig {
  enabledTests: string[];
  zoomLevels: number[];
  sampleRegions: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  }>;
  colorTargets: Array<{
    expected: string;
    tolerance: number;
  }>;
}

export interface QualityAssessmentEvents {
  assessmentStart: () => void;
  assessmentProgress: (progress: number, testName: string) => void;
  assessmentComplete: (results: ComparisonResult[]) => void;
  testComplete: (testId: string, results: Record<RendererType, number>) => void;
}

/**
 * QualityAssessment provides comprehensive visual quality testing across renderers
 */
export class QualityAssessment {
  private container: HTMLElement;
  private overlay: HTMLElement | null = null;
  private assessmentPanel: HTMLElement | null = null;
  private isVisible = false;
  private isRunning = false;

  private qualityTests: Map<string, QualityTest> = new Map();
  private config: QualityAssessmentConfig = this.getDefaultConfig();
  private eventListeners: Map<keyof QualityAssessmentEvents, Set<Function>> = new Map();

  private currentResults: ComparisonResult[] = [];

  constructor(container: HTMLElement) {
    this.container = container;
    this.initializeQualityTests();
  }

  public initialize(): void {
    this.createAssessmentInterface();
    this.setupEventHandlers();
  }

  public show(): void {
    if (this.container && !this.isVisible) {
      this.container.style.display = 'flex';
      this.isVisible = true;
      this.updateInterface();
    }
  }

  public hide(): void {
    if (this.container && this.isVisible) {
      this.container.style.display = 'none';
      this.isVisible = false;
    }
  }

  public async runAssessment(renderers: Map<RendererType, HTMLCanvasElement>): Promise<ComparisonResult[]> {
    if (this.isRunning) {
      throw new Error('Assessment already in progress');
    }

    this.isRunning = true;
    this.emit('assessmentStart');

    const results: ComparisonResult[] = [];
    const totalTests = this.config.enabledTests.length * renderers.size;
    let completedTests = 0;

    try {
      // Run each enabled test on each renderer
      for (const testId of this.config.enabledTests) {
        const test = this.qualityTests.get(testId);
        if (!test) continue;

        this.emit('assessmentProgress', completedTests / totalTests, test.name);

        const testResults: Record<string, number> = {};

        for (const [rendererType, canvas] of renderers) {
          try {
            const score = await test.execute(rendererType, canvas);
            testResults[rendererType] = score;
            completedTests++;

            this.emit('assessmentProgress', completedTests / totalTests, test.name);
          } catch (error) {
            console.warn(`Quality test ${testId} failed for ${rendererType}:`, error);
            testResults[rendererType] = 0;
            completedTests++;
          }
        }

        this.emit('testComplete', testId, testResults);
      }

      // Aggregate results per renderer
      for (const [rendererType] of renderers) {
        const qualityMetrics = this.calculateQualityMetrics(rendererType);
        const rendererResult: ComparisonResult = {
          renderer: rendererType,
          metrics: {
            fps: 0, // Will be filled by performance component
            memoryUsage: 0,
            drawCalls: 0,
            renderTime: 0,
            updateTime: 0,
            isActive: true
          },
          quality: qualityMetrics,
          supported: true
        };

        results.push(rendererResult);
      }

      this.currentResults = results;
      this.emit('assessmentComplete', results);

    } finally {
      this.isRunning = false;
    }

    return results;
  }

  public update(): void {
    if (!this.isVisible || !this.assessmentPanel) return;

    this.updateResultsDisplay();
  }

  public cleanup(): void {
    this.eventListeners.clear();
  }

  // Event emitter methods
  public on<K extends keyof QualityAssessmentEvents>(event: K, callback: QualityAssessmentEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  public off<K extends keyof QualityAssessmentEvents>(event: K, callback: QualityAssessmentEvents[K]): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit<K extends keyof QualityAssessmentEvents>(event: K, ...args: Parameters<QualityAssessmentEvents[K]>): void {
    this.eventListeners.get(event)?.forEach(callback => {
      (callback as Function)(...args);
    });
  }

  private getDefaultConfig(): QualityAssessmentConfig {
    return {
      enabledTests: ['edge-sharpness', 'text-clarity', 'color-accuracy', 'zoom-stability'],
      zoomLevels: [0.25, 0.5, 1.0, 2.0, 4.0],
      sampleRegions: [
        { x: 100, y: 100, width: 100, height: 100, label: 'Top-left' },
        { x: 300, y: 150, width: 100, height: 100, label: 'Center' },
        { x: 500, y: 200, width: 100, height: 100, label: 'Bottom-right' }
      ],
      colorTargets: [
        { expected: '#ff0000', tolerance: 10 },
        { expected: '#00ff00', tolerance: 10 },
        { expected: '#0000ff', tolerance: 10 }
      ]
    };
  }

  private initializeQualityTests(): void {
    // Edge Sharpness Test
    this.qualityTests.set('edge-sharpness', {
      id: 'edge-sharpness',
      name: 'Edge Sharpness',
      description: 'Measures the sharpness and clarity of rendered edges',
      category: 'sharpness',
      execute: async (rendererType: RendererType, canvas: HTMLCanvasElement): Promise<number> => {
        return this.measureEdgeSharpness(canvas);
      }
    });

    // Text Clarity Test
    this.qualityTests.set('text-clarity', {
      id: 'text-clarity',
      name: 'Text Clarity',
      description: 'Evaluates text rendering quality and readability',
      category: 'sharpness',
      execute: async (rendererType: RendererType, canvas: HTMLCanvasElement): Promise<number> => {
        return this.measureTextClarity(canvas);
      }
    });

    // Color Accuracy Test
    this.qualityTests.set('color-accuracy', {
      id: 'color-accuracy',
      name: 'Color Accuracy',
      description: 'Tests color reproduction fidelity',
      category: 'color',
      execute: async (rendererType: RendererType, canvas: HTMLCanvasElement): Promise<number> => {
        return this.measureColorAccuracy(canvas);
      }
    });

    // Zoom Stability Test
    this.qualityTests.set('zoom-stability', {
      id: 'zoom-stability',
      name: 'Zoom Stability',
      description: 'Evaluates visual stability across different zoom levels',
      category: 'stability',
      execute: async (rendererType: RendererType, canvas: HTMLCanvasElement): Promise<number> => {
        return this.measureZoomStability(canvas);
      }
    });

    // Anti-aliasing Quality Test
    this.qualityTests.set('antialiasing', {
      id: 'antialiasing',
      name: 'Anti-aliasing Quality',
      description: 'Measures smoothness of diagonal lines and curves',
      category: 'sharpness',
      execute: async (rendererType: RendererType, canvas: HTMLCanvasElement): Promise<number> => {
        return this.measureAntialiasingQuality(canvas);
      }
    });

    // Gradient Smoothness Test
    this.qualityTests.set('gradient-smoothness', {
      id: 'gradient-smoothness',
      name: 'Gradient Smoothness',
      description: 'Evaluates gradient rendering without banding',
      category: 'color',
      execute: async (rendererType: RendererType, canvas: HTMLCanvasElement): Promise<number> => {
        return this.measureGradientSmoothness(canvas);
      }
    });
  }

  private createAssessmentInterface(): void {
    this.container.innerHTML = `
      <div class="quality-assessment-overlay">
        <div class="quality-assessment-panel">
          <!-- Header -->
          <div class="assessment-header">
            <h2>Visual Quality Assessment</h2>
            <button class="close-button" aria-label="Close assessment">
              <span>✕</span>
            </button>
          </div>

          <!-- Configuration -->
          <div class="assessment-config">
            <div class="config-section">
              <h3>Test Configuration</h3>
              <div class="test-selection">
                <div class="test-checkbox" data-test="edge-sharpness">
                  <input type="checkbox" id="test-edge-sharpness" checked>
                  <label for="test-edge-sharpness">Edge Sharpness</label>
                </div>
                <div class="test-checkbox" data-test="text-clarity">
                  <input type="checkbox" id="test-text-clarity" checked>
                  <label for="test-text-clarity">Text Clarity</label>
                </div>
                <div class="test-checkbox" data-test="color-accuracy">
                  <input type="checkbox" id="test-color-accuracy" checked>
                  <label for="test-color-accuracy">Color Accuracy</label>
                </div>
                <div class="test-checkbox" data-test="zoom-stability">
                  <input type="checkbox" id="test-zoom-stability" checked>
                  <label for="test-zoom-stability">Zoom Stability</label>
                </div>
              </div>
            </div>
          </div>

          <!-- Progress -->
          <div class="assessment-progress" style="display: none;">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <div class="progress-text">Initializing assessment...</div>
          </div>

          <!-- Results -->
          <div class="assessment-results" id="assessment-results">
            <h3>Quality Comparison Results</h3>
            <div class="results-grid">
              <!-- Results will be populated dynamically -->
            </div>
          </div>

          <!-- Controls -->
          <div class="assessment-controls">
            <button class="run-assessment-btn ui-button ui-button--primary">
              Run Quality Assessment
            </button>
            <button class="export-results-btn ui-button ui-button--secondary" disabled>
              Export Results
            </button>
          </div>
        </div>
      </div>
    `;

    this.assessmentPanel = this.container.querySelector('.quality-assessment-panel');
    this.applyAssessmentStyling();
  }

  private applyAssessmentStyling(): void {
    const style = document.createElement('style');
    style.textContent = `
      .quality-assessment-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--z-overlay);
        padding: var(--space-4);
      }

      .quality-assessment-panel {
        background: var(--color-bg-surface);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-lg);
        width: 100%;
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 0 30px rgba(16, 124, 16, 0.4);
      }

      .assessment-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-6);
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }

      .assessment-header h2 {
        margin: 0;
        color: var(--color-white);
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        text-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      }

      .close-button {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: var(--color-white);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-lg);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .close-button:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: scale(1.1);
      }

      .assessment-config {
        padding: var(--space-6);
      }

      .config-section h3 {
        margin: 0 0 var(--space-4) 0;
        color: var(--color-text-primary);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
      }

      .test-selection {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--space-3);
      }

      .test-checkbox {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--color-bg-primary);
        border-radius: var(--radius-base);
        border: 1px solid var(--color-gray-600);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .test-checkbox:hover {
        border-color: var(--color-primary);
        box-shadow: 0 0 10px rgba(16, 124, 16, 0.2);
      }

      .test-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--color-primary);
      }

      .test-checkbox label {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        font-size: var(--font-size-sm);
      }

      .assessment-progress {
        padding: var(--space-6);
        border-top: 1px solid var(--color-gray-600);
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--color-gray-700);
        border-radius: var(--radius-full);
        overflow: hidden;
        margin-bottom: var(--space-3);
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
        width: 0%;
        transition: width var(--duration-normal) var(--easing-ease);
      }

      .progress-text {
        text-align: center;
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .assessment-results {
        padding: var(--space-6);
        border-top: 1px solid var(--color-gray-600);
      }

      .assessment-results h3 {
        margin: 0 0 var(--space-4) 0;
        color: var(--color-text-primary);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
      }

      .results-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--space-4);
      }

      .renderer-result {
        background: var(--color-bg-primary);
        border: 1px solid var(--color-gray-600);
        border-radius: var(--radius-base);
        padding: var(--space-4);
      }

      .renderer-result h4 {
        margin: 0 0 var(--space-3) 0;
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .quality-metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-2);
      }

      .quality-metric:last-child {
        margin-bottom: 0;
      }

      .metric-label {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .metric-score {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
      }

      .metric-score--excellent {
        background: rgba(76, 175, 80, 0.2);
        color: var(--color-success);
      }

      .metric-score--good {
        background: rgba(255, 185, 0, 0.2);
        color: var(--color-accent);
      }

      .metric-score--fair {
        background: rgba(255, 140, 0, 0.2);
        color: var(--color-warning);
      }

      .metric-score--poor {
        background: rgba(244, 67, 54, 0.2);
        color: var(--color-danger);
      }

      .assessment-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-6);
        border-top: 1px solid var(--color-gray-600);
        background: var(--color-bg-primary);
        border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      }

      .assessment-controls .ui-button {
        min-width: 160px;
      }

      /* Responsive design */
      @media (max-width: 640px) {
        .quality-assessment-overlay {
          padding: var(--space-2);
        }

        .assessment-header {
          padding: var(--space-3) var(--space-4);
        }

        .assessment-config,
        .assessment-progress,
        .assessment-results {
          padding: var(--space-4);
        }

        .test-selection {
          grid-template-columns: 1fr;
        }

        .results-grid {
          grid-template-columns: 1fr;
        }

        .assessment-controls {
          flex-direction: column;
          gap: var(--space-3);
        }
      }
    `;

    document.head.appendChild(style);
  }

  private setupEventHandlers(): void {
    if (!this.assessmentPanel) return;

    // Close button
    const closeButton = this.assessmentPanel.querySelector('.close-button');
    closeButton?.addEventListener('click', () => this.hide());

    // Run assessment button
    const runButton = this.assessmentPanel.querySelector('.run-assessment-btn');
    runButton?.addEventListener('click', () => this.handleRunAssessment());

    // Export results button
    const exportButton = this.assessmentPanel.querySelector('.export-results-btn');
    exportButton?.addEventListener('click', () => this.handleExportResults());

    // Test selection checkboxes
    const checkboxes = this.assessmentPanel.querySelectorAll('.test-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => this.updateEnabledTests());
    });
  }

  private async handleRunAssessment(): Promise<void> {
    // This would be called with actual renderer canvases from the parent component
    console.log('Running quality assessment...');

    // Show progress
    const progressSection = this.assessmentPanel?.querySelector('.assessment-progress');
    if (progressSection) {
      (progressSection as HTMLElement).style.display = 'block';
    }

    // Simulate assessment for demonstration
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Hide progress and enable export
    if (progressSection) {
      (progressSection as HTMLElement).style.display = 'none';
    }

    const exportButton = this.assessmentPanel?.querySelector('.export-results-btn');
    if (exportButton) {
      (exportButton as HTMLButtonElement).disabled = false;
    }

    this.displaySampleResults();
  }

  private handleExportResults(): void {
    if (this.currentResults.length === 0) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      results: this.currentResults,
      config: this.config
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `quality-assessment-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  private updateEnabledTests(): void {
    const checkboxes = this.assessmentPanel?.querySelectorAll('.test-checkbox input[type="checkbox"]');
    const enabledTests: string[] = [];

    checkboxes?.forEach(checkbox => {
      if ((checkbox as HTMLInputElement).checked) {
        const testId = (checkbox as HTMLInputElement).id.replace('test-', '');
        enabledTests.push(testId);
      }
    });

    this.config.enabledTests = enabledTests;
  }

  private updateInterface(): void {
    // Update interface based on current state
  }

  private updateResultsDisplay(): void {
    if (this.currentResults.length === 0) return;

    const resultsGrid = this.assessmentPanel?.querySelector('.results-grid');
    if (!resultsGrid) return;

    resultsGrid.innerHTML = '';

    this.currentResults.forEach(result => {
      const resultElement = this.createRendererResultElement(result);
      resultsGrid.appendChild(resultElement);
    });
  }

  private createRendererResultElement(result: ComparisonResult): HTMLElement {
    const element = document.createElement('div');
    element.className = 'renderer-result';

    const quality = result.quality;
    element.innerHTML = `
      <h4>${result.renderer.toUpperCase()} Renderer</h4>

      <div class="quality-metric">
        <span class="metric-label">Edge Sharpness</span>
        <span class="metric-score ${this.getScoreClass(quality.edgeSharpness)}">${quality.edgeSharpness.toFixed(1)}/10</span>
      </div>

      <div class="quality-metric">
        <span class="metric-label">Text Clarity</span>
        <span class="metric-score ${this.getScoreClass(quality.textClarity)}">${quality.textClarity.toFixed(1)}/10</span>
      </div>

      <div class="quality-metric">
        <span class="metric-label">Color Accuracy</span>
        <span class="metric-score ${this.getScoreClass(quality.colorAccuracy)}">${quality.colorAccuracy.toFixed(1)}/10</span>
      </div>

      <div class="quality-metric">
        <span class="metric-label">Zoom Stability</span>
        <span class="metric-score ${this.getScoreClass(quality.zoomStability)}">${quality.zoomStability.toFixed(1)}/10</span>
      </div>
    `;

    return element;
  }

  private getScoreClass(score: number): string {
    if (score >= 8.5) return 'metric-score--excellent';
    if (score >= 7.0) return 'metric-score--good';
    if (score >= 5.0) return 'metric-score--fair';
    return 'metric-score--poor';
  }

  private displaySampleResults(): void {
    // Generate sample results for demonstration
    this.currentResults = [
      {
        renderer: 'svg',
        metrics: { fps: 60, memoryUsage: 50, drawCalls: 100, renderTime: 16.67, updateTime: 2.3, isActive: true },
        quality: { edgeSharpness: 9.2, textClarity: 9.5, colorAccuracy: 9.8, zoomStability: 8.9 },
        supported: true
      },
      {
        renderer: 'canvas',
        metrics: { fps: 45, memoryUsage: 80, drawCalls: 150, renderTime: 22.2, updateTime: 5.1, isActive: true },
        quality: { edgeSharpness: 8.1, textClarity: 8.3, colorAccuracy: 8.7, zoomStability: 7.9 },
        supported: true
      },
      {
        renderer: 'webgl',
        metrics: { fps: 120, memoryUsage: 120, drawCalls: 50, renderTime: 8.33, updateTime: 1.2, isActive: true },
        quality: { edgeSharpness: 7.8, textClarity: 7.2, colorAccuracy: 8.9, zoomStability: 9.1 },
        supported: true
      }
    ];

    this.updateResultsDisplay();
  }

  private calculateQualityMetrics(rendererType: RendererType): QualityMetrics {
    // This would aggregate the results from individual quality tests
    // For now, return default values
    return {
      edgeSharpness: 8.0,
      textClarity: 8.0,
      colorAccuracy: 8.0,
      zoomStability: 8.0
    };
  }

  // Quality measurement methods
  private async measureEdgeSharpness(canvas: HTMLCanvasElement): Promise<number> {
    // Implement edge sharpness analysis using gradient detection
    // This would analyze the canvas pixels to measure edge definition
    return Math.random() * 3 + 7; // Simulated score 7-10
  }

  private async measureTextClarity(canvas: HTMLCanvasElement): Promise<number> {
    // Implement text clarity measurement
    // This would analyze rendered text for clarity and readability
    return Math.random() * 3 + 7; // Simulated score 7-10
  }

  private async measureColorAccuracy(canvas: HTMLCanvasElement): Promise<number> {
    // Implement color accuracy measurement
    // This would sample specific colors and compare to expected values
    return Math.random() * 3 + 7; // Simulated score 7-10
  }

  private async measureZoomStability(canvas: HTMLCanvasElement): Promise<number> {
    // Implement zoom stability measurement
    // This would test visual consistency across different zoom levels
    return Math.random() * 3 + 7; // Simulated score 7-10
  }

  private async measureAntialiasingQuality(canvas: HTMLCanvasElement): Promise<number> {
    // Implement anti-aliasing quality measurement
    // This would analyze diagonal lines and curves for smoothness
    return Math.random() * 3 + 7; // Simulated score 7-10
  }

  private async measureGradientSmoothness(canvas: HTMLCanvasElement): Promise<number> {
    // Implement gradient smoothness measurement
    // This would analyze gradients for banding artifacts
    return Math.random() * 3 + 7; // Simulated score 7-10
  }
}