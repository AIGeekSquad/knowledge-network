/**
 * Scale Controller Component
 *
 * Interactive controls for adjusting node count and triggering performance benchmarks.
 * Features live scaling with real-time FPS impact visualization.
 */

import { BaseComponent, Button, Slider, Toggle, Panel } from '../../../shared/UIComponents.js';
import { formatNumber, formatDuration } from '../../../shared/utils.js';
import type { ScaleTestResult } from '../PerformanceShowcase.js';

export interface ScaleControllerConfig {
  initialScale: number;
  minScale?: number;
  maxScale?: number;
  onScaleChange: (scale: number) => void;
  onBenchmarkStart: () => void;
  enableAutoScale?: boolean;
}

/**
 * Scale Controller with Xbox-inspired styling and interactive controls
 */
export class ScaleController extends BaseComponent<{
  scaleChange: { scale: number };
  benchmarkStart: void;
  autoScaleToggle: { enabled: boolean };
}> {
  private config: ScaleControllerConfig;
  private scaleSlider: Slider | null = null;
  private autoScaleToggle: Toggle | null = null;
  private benchmarkButton: Button | null = null;
  private quickScaleButtons: Button[] = [];
  private resultsContainer: HTMLElement | null = null;

  private currentScale: number;
  private benchmarkResults: ScaleTestResult[] = [];
  private isRunningBenchmark = false;

  constructor(config: ScaleControllerConfig) {
    super('div', 'scale-controller');
    this.config = config;
    this.currentScale = config.initialScale;

    this.setupComponent();
  }

  private setupComponent(): void {
    // Create panel container with Xbox styling
    const panel = new Panel({
      title: '⚡ Scale Control',
      collapsible: true,
      expanded: true,
      className: 'scale-controller-panel'
    });

    // Add custom Xbox-style header styling
    const panelElement = panel.getElement();
    panelElement.style.cssText += `
      background: linear-gradient(135deg, var(--color-bg-surface), var(--color-gray-700));
      border: 1px solid var(--color-primary);
      box-shadow: 0 0 15px rgba(16, 124, 16, 0.2);
    `;

    // Create content container
    const content = document.createElement('div');
    content.className = 'scale-controller-content';
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
    `;

    // Add scale slider with live feedback
    this.createScaleSlider(content);

    // Add quick scale buttons
    this.createQuickScaleButtons(content);

    // Add auto-scale toggle
    this.createAutoScaleToggle(content);

    // Add benchmark controls
    this.createBenchmarkControls(content);

    // Add results display
    this.createResultsDisplay(content);

    panel.addContent(content);
    this.element.appendChild(panel.getElement());
  }

  private createScaleSlider(container: HTMLElement): void {
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'scale-slider-container';
    sliderContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Scale info header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
    `;
    header.innerHTML = `
      <span>Node Count</span>
      <span id="current-scale-display" style="
        color: var(--color-secondary);
        font-family: var(--font-family-mono);
        font-size: var(--font-size-lg);
        text-shadow: 0 0 5px rgba(0, 188, 242, 0.3);
      ">
        ${formatNumber(this.currentScale)}
      </span>
    `;

    // Create slider
    this.scaleSlider = new Slider({
      label: '',
      min: this.config.minScale || 100,
      max: this.config.maxScale || 20000,
      value: this.currentScale,
      step: 100
    });

    // Style the slider with Xbox theme
    const sliderElement = this.scaleSlider.getElement();
    sliderElement.style.marginBottom = '0';

    // Add Xbox-style track styling
    const sliderInput = sliderElement.querySelector('.ui-slider') as HTMLInputElement;
    if (sliderInput) {
      sliderInput.style.background = `
        linear-gradient(to right,
          var(--color-primary) 0%,
          var(--color-primary) ${((this.currentScale - 100) / (20000 - 100)) * 100}%,
          var(--color-gray-300) ${((this.currentScale - 100) / (20000 - 100)) * 100}%,
          var(--color-gray-300) 100%)
      `;
    }

    // Handle slider changes
    this.scaleSlider.on('input', ({ value }) => {
      this.updateScale(value);
      this.updateSliderTrack(value);
    });

    this.scaleSlider.on('change', ({ value }) => {
      this.config.onScaleChange(value);
      this.emit('scaleChange', { scale: value });
    });

    sliderContainer.appendChild(header);
    sliderContainer.appendChild(this.scaleSlider.getElement());

    // Add performance impact indicator
    const impactIndicator = document.createElement('div');
    impactIndicator.style.cssText = `
      margin-top: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      text-align: center;
    `;
    impactIndicator.innerHTML = `
      <span id="performance-impact">Performance Impact: Excellent</span>
    `;
    sliderContainer.appendChild(impactIndicator);

    container.appendChild(sliderContainer);
  }

  private createQuickScaleButtons(container: HTMLElement): void {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'quick-scale-buttons';
    buttonContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-2);
      margin: var(--space-2) 0;
    `;

    const quickScales = [
      { value: 1000, label: '1K' },
      { value: 5000, label: '5K' },
      { value: 10000, label: '10K' },
      { value: 15000, label: '15K' },
      { value: 20000, label: '20K' },
      { value: 0, label: 'Max' }
    ];

    quickScales.forEach(({ value, label }) => {
      const button = new Button(label, {
        variant: value === this.currentScale ? 'primary' : 'secondary',
        size: 'small'
      });

      // Add Xbox-style glow effect
      const buttonElement = button.getElement().querySelector('.ui-button') as HTMLElement;
      if (buttonElement) {
        buttonElement.style.cssText += `
          transition: all var(--duration-fast) var(--easing-ease);
          border: 1px solid transparent;
        `;

        buttonElement.addEventListener('mouseenter', () => {
          if (value !== this.currentScale) {
            buttonElement.style.borderColor = 'var(--color-secondary)';
            buttonElement.style.boxShadow = '0 0 10px rgba(0, 188, 242, 0.3)';
          }
        });

        buttonElement.addEventListener('mouseleave', () => {
          if (value !== this.currentScale) {
            buttonElement.style.borderColor = 'transparent';
            buttonElement.style.boxShadow = 'none';
          }
        });
      }

      button.on('click', () => {
        const targetValue = value === 0 ? (this.config.maxScale || 20000) : value;
        this.updateScale(targetValue);
        this.scaleSlider?.setValue(targetValue);
        this.updateSliderTrack(targetValue);
        this.config.onScaleChange(targetValue);
        this.updateQuickButtonStates(targetValue);
        this.emit('scaleChange', { scale: targetValue });
      });

      this.quickScaleButtons.push(button);
      buttonContainer.appendChild(button.getElement());
    });

    container.appendChild(buttonContainer);
  }

  private createAutoScaleToggle(container: HTMLElement): void {
    this.autoScaleToggle = new Toggle({
      label: '🔄 Auto-scale Benchmark',
      value: this.config.enableAutoScale || false
    });

    // Add Xbox-style description
    const toggleContainer = document.createElement('div');
    toggleContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    const description = document.createElement('div');
    description.style.cssText = `
      margin-top: var(--space-2);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
    `;
    description.textContent = 'Automatically test performance across different scales';

    this.autoScaleToggle.on('change', ({ value }) => {
      this.emit('autoScaleToggle', { enabled: value });
    });

    toggleContainer.appendChild(this.autoScaleToggle.getElement());
    toggleContainer.appendChild(description);
    container.appendChild(toggleContainer);
  }

  private createBenchmarkControls(container: HTMLElement): void {
    const benchmarkContainer = document.createElement('div');
    benchmarkContainer.className = 'benchmark-controls';
    benchmarkContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Benchmark button
    this.benchmarkButton = new Button('🚀 Run Scale Benchmark', {
      variant: 'primary',
      size: 'medium'
    });

    // Add Xbox-style glow effect
    const benchmarkButtonElement = this.benchmarkButton.getElement().querySelector('.ui-button') as HTMLElement;
    if (benchmarkButtonElement) {
      benchmarkButtonElement.style.cssText += `
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        box-shadow: 0 0 15px rgba(16, 124, 16, 0.4);
        border: 1px solid var(--color-primary);
      `;
    }

    this.benchmarkButton.on('click', () => {
      if (!this.isRunningBenchmark) {
        this.startBenchmark();
      }
    });

    // Benchmark description
    const description = document.createElement('div');
    description.style.cssText = `
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
    `;
    description.innerHTML = `
      Tests performance progression from 100 to 20,000 nodes<br>
      <span style="color: var(--color-secondary);">Measures: FPS, render time, memory usage, selection speed</span>
    `;

    benchmarkContainer.appendChild(this.benchmarkButton.getElement());
    benchmarkContainer.appendChild(description);
    container.appendChild(benchmarkContainer);
  }

  private createResultsDisplay(container: HTMLElement): void {
    this.resultsContainer = document.createElement('div');
    this.resultsContainer.className = 'benchmark-results';
    this.resultsContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
      min-height: 120px;
      display: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
      margin-bottom: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    `;
    header.innerHTML = `
      📊 <span>Benchmark Results</span>
    `;

    const resultsContent = document.createElement('div');
    resultsContent.id = 'benchmark-results-content';
    resultsContent.style.cssText = `
      font-family: var(--font-family-mono);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      line-height: 1.6;
    `;

    this.resultsContainer.appendChild(header);
    this.resultsContainer.appendChild(resultsContent);
    container.appendChild(this.resultsContainer);
  }

  private updateScale(scale: number): void {
    this.currentScale = scale;

    // Update display
    const display = document.querySelector('#current-scale-display');
    if (display) {
      display.textContent = formatNumber(scale);
    }

    // Update performance impact indicator
    this.updatePerformanceImpact(scale);

    // Update quick button states
    this.updateQuickButtonStates(scale);
  }

  private updateSliderTrack(value: number): void {
    const sliderInput = this.element.querySelector('.ui-slider') as HTMLInputElement;
    if (sliderInput) {
      const min = this.config.minScale || 100;
      const max = this.config.maxScale || 20000;
      const percentage = ((value - min) / (max - min)) * 100;

      sliderInput.style.background = `
        linear-gradient(to right,
          var(--color-primary) 0%,
          var(--color-primary) ${percentage}%,
          var(--color-gray-300) ${percentage}%,
          var(--color-gray-300) 100%)
      `;
    }
  }

  private updatePerformanceImpact(scale: number): void {
    const impactElement = document.querySelector('#performance-impact') as HTMLElement;
    if (!impactElement) return;

    let impact: string;
    let color: string;

    if (scale <= 1000) {
      impact = 'Excellent (60fps+)';
      color = 'var(--color-success)';
    } else if (scale <= 5000) {
      impact = 'Very Good (50-60fps)';
      color = 'var(--color-primary)';
    } else if (scale <= 10000) {
      impact = 'Good (30-50fps)';
      color = 'var(--color-secondary)';
    } else if (scale <= 15000) {
      impact = 'Moderate (20-30fps)';
      color = 'var(--color-warning)';
    } else {
      impact = 'Challenging (10-20fps)';
      color = 'var(--color-danger)';
    }

    impactElement.textContent = `Performance Impact: ${impact}`;
    impactElement.style.color = color;
  }

  private updateQuickButtonStates(currentScale: number): void {
    const scales = [1000, 5000, 10000, 15000, 20000, this.config.maxScale || 20000];

    this.quickScaleButtons.forEach((button, index) => {
      const scale = scales[index];
      const buttonElement = button.getElement().querySelector('.ui-button') as HTMLElement;

      if (scale === currentScale || (index === 5 && currentScale === (this.config.maxScale || 20000))) {
        button.setText(button.getElement().textContent!);
        buttonElement.style.background = 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))';
        buttonElement.style.borderColor = 'var(--color-primary)';
        buttonElement.style.boxShadow = '0 0 15px rgba(16, 124, 16, 0.4)';
      } else {
        buttonElement.style.background = 'var(--color-gray-700)';
        buttonElement.style.borderColor = 'var(--color-border-light)';
        buttonElement.style.boxShadow = 'none';
      }
    });
  }

  private startBenchmark(): void {
    this.isRunningBenchmark = true;

    // Update button state
    this.benchmarkButton?.setText('🔄 Running Benchmark...');
    this.benchmarkButton?.setEnabled(false);

    // Show results container
    if (this.resultsContainer) {
      this.resultsContainer.style.display = 'block';
    }

    // Clear previous results
    this.benchmarkResults = [];
    this.updateResultsDisplay();

    // Trigger benchmark
    this.config.onBenchmarkStart();
    this.emit('benchmarkStart', undefined);
  }

  public updateBenchmarkResults(results: ScaleTestResult[]): void {
    this.benchmarkResults = results;
    this.isRunningBenchmark = false;

    // Update button state
    this.benchmarkButton?.setText('🚀 Run Scale Benchmark');
    this.benchmarkButton?.setEnabled(true);

    // Update results display
    this.updateResultsDisplay();
  }

  private updateResultsDisplay(): void {
    const content = document.querySelector('#benchmark-results-content');
    if (!content) return;

    if (this.benchmarkResults.length === 0) {
      content.innerHTML = `
        <div style="color: var(--color-text-muted); text-align: center; padding: var(--space-4);">
          ${this.isRunningBenchmark ? 'Running benchmark tests...' : 'No results yet'}
        </div>
      `;
      return;
    }

    const html = this.benchmarkResults.map(result => `
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: var(--space-2);
        padding: var(--space-1) 0;
        border-bottom: 1px solid var(--color-border-light);
      ">
        <div style="color: var(--color-secondary);">${formatNumber(result.nodeCount)}</div>
        <div style="color: ${result.fps >= 50 ? 'var(--color-success)' : result.fps >= 30 ? 'var(--color-warning)' : 'var(--color-danger)'};">
          ${result.fps}fps
        </div>
        <div>${formatDuration(result.renderTime)}</div>
        <div>${formatDuration(result.selectionTime)}</div>
      </div>
    `).join('');

    content.innerHTML = `
      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr 1fr 1fr;
        gap: var(--space-2);
        font-weight: var(--font-weight-semibold);
        padding: var(--space-1) 0;
        border-bottom: 2px solid var(--color-primary);
        margin-bottom: var(--space-2);
        color: var(--color-text-primary);
      ">
        <div>Nodes</div>
        <div>FPS</div>
        <div>Render</div>
        <div>Select</div>
      </div>
      ${html}
    `;
  }

  public destroy(): void {
    this.scaleSlider?.destroy();
    this.autoScaleToggle?.destroy();
    this.benchmarkButton?.destroy();
    this.quickScaleButtons.forEach(button => button.destroy());
    this.quickScaleButtons = [];
    super.destroy();
  }
}