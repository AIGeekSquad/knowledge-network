/**
 * ForceBalancer Component - Structural vs Semantic Force Controls
 *
 * Interactive component that allows users to balance between traditional structural
 * forces (based on graph topology) and semantic forces (based on concept similarity).
 * Demonstrates the hybrid force system that is unique to knowledge-network's AI capabilities.
 */

export interface ForceBalancerConfig {
  structuralWeight: number; // 0-1, weight of structural forces
  semanticWeight: number;   // 0-1, weight of semantic forces
  showRealTimeMetrics: boolean;
  enablePresets: boolean;
  onForceChange: (structural: number, semantic: number) => void;
  onPresetSelect: (preset: ForcePreset) => void;
}

export interface ForcePreset {
  id: string;
  name: string;
  description: string;
  structuralWeight: number;
  semanticWeight: number;
  icon: string;
}

export interface ForceMetrics {
  structuralEnergy: number;
  semanticEnergy: number;
  totalEnergy: number;
  convergence: number;
  nodeMovement: number;
  lastUpdate: number;
}

/**
 * ForceBalancer - Interactive force system controller
 */
export class ForceBalancer {
  private container: HTMLElement;
  private config: ForceBalancerConfig;
  private structuralSlider: HTMLInputElement;
  private semanticSlider: HTMLInputElement;
  private balanceVisualization: HTMLElement;
  private metricsDisplay: HTMLElement;
  private presetButtons: HTMLElement[];
  private lockBalanceCheckbox: HTMLInputElement;
  private balanceLocked: boolean = false;

  private readonly presets: ForcePreset[] = [
    {
      id: 'structural-only',
      name: 'Structural Only',
      description: 'Pure graph topology layout',
      structuralWeight: 1.0,
      semanticWeight: 0.0,
      icon: '🔗'
    },
    {
      id: 'balanced',
      name: 'Balanced Hybrid',
      description: 'Equal structural and semantic influence',
      structuralWeight: 0.5,
      semanticWeight: 0.5,
      icon: '⚖️'
    },
    {
      id: 'semantic-focused',
      name: 'Semantic Focused',
      description: 'Emphasizes conceptual similarity',
      structuralWeight: 0.3,
      semanticWeight: 0.7,
      icon: '🧠'
    },
    {
      id: 'semantic-only',
      name: 'Semantic Only',
      description: 'Pure AI-driven clustering',
      structuralWeight: 0.0,
      semanticWeight: 1.0,
      icon: '🤖'
    }
  ];

  constructor(container: HTMLElement, config: ForceBalancerConfig) {
    this.container = container;
    this.config = config;

    this.createElement();
    this.bindEvents();
    this.updateVisualization();
  }

  /**
   * Create the force balancer UI with Xbox styling
   */
  private createElement(): void {
    this.container.innerHTML = `
      <div class="force-balancer-panel">
        <div class="force-balancer-header">
          <h3 class="force-balancer-title">
            ⚡ Hybrid Force System
          </h3>
          <div class="force-balancer-subtitle">
            Balance between structural topology and semantic similarity
          </div>
        </div>

        <div class="force-balance-visualization" id="balance-viz">
          <div class="force-balance-bar">
            <div class="force-balance-fill"></div>
            <div class="force-balance-marker"></div>
          </div>
          <div class="force-balance-labels">
            <span class="force-label force-label--structural">🔗 Structural</span>
            <span class="force-label force-label--semantic">🧠 Semantic</span>
          </div>
        </div>

        <div class="force-controls">
          <div class="force-control-group">
            <div class="force-slider-container">
              <label class="force-slider-label">
                <span class="force-slider-title">Structural Force</span>
                <span class="force-slider-value" id="structural-value">${(this.config.structuralWeight * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                class="force-slider force-slider--structural"
                id="structural-slider"
                min="0"
                max="100"
                value="${this.config.structuralWeight * 100}"
                step="1"
              />
            </div>

            <div class="force-slider-container">
              <label class="force-slider-label">
                <span class="force-slider-title">Semantic Force</span>
                <span class="force-slider-value" id="semantic-value">${(this.config.semanticWeight * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                class="force-slider force-slider--semantic"
                id="semantic-slider"
                min="0"
                max="100"
                value="${this.config.semanticWeight * 100}"
                step="1"
              />
            </div>
          </div>

          <div class="force-balance-controls">
            <label class="force-balance-lock ui-toggle-container">
              <input type="checkbox" class="ui-toggle" id="lock-balance" />
              <span class="ui-toggle__label">Lock Balance (1:1)</span>
            </label>
          </div>
        </div>

        ${this.config.enablePresets ? this.createPresetsHTML() : ''}

        ${this.config.showRealTimeMetrics ? this.createMetricsHTML() : ''}
      </div>
    `;

    // Cache elements
    this.structuralSlider = this.container.querySelector('#structural-slider') as HTMLInputElement;
    this.semanticSlider = this.container.querySelector('#semantic-slider') as HTMLInputElement;
    this.balanceVisualization = this.container.querySelector('#balance-viz') as HTMLElement;
    this.lockBalanceCheckbox = this.container.querySelector('#lock-balance') as HTMLInputElement;

    if (this.config.showRealTimeMetrics) {
      this.metricsDisplay = this.container.querySelector('#force-metrics') as HTMLElement;
    }

    this.presetButtons = Array.from(this.container.querySelectorAll('.force-preset-btn'));

    // Add Xbox styling
    this.addXboxStyling();
  }

  /**
   * Create presets section HTML
   */
  private createPresetsHTML(): string {
    return `
      <div class="force-presets">
        <div class="force-presets-header">
          <h4 class="force-presets-title">Force Presets</h4>
        </div>
        <div class="force-presets-grid">
          ${this.presets.map(preset => `
            <button class="force-preset-btn" data-preset="${preset.id}">
              <div class="force-preset-icon">${preset.icon}</div>
              <div class="force-preset-name">${preset.name}</div>
              <div class="force-preset-description">${preset.description}</div>
              <div class="force-preset-weights">
                S:${(preset.structuralWeight * 100).toFixed(0)}% |
                AI:${(preset.semanticWeight * 100).toFixed(0)}%
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Create metrics section HTML
   */
  private createMetricsHTML(): string {
    return `
      <div class="force-metrics" id="force-metrics">
        <div class="force-metrics-header">
          <h4 class="force-metrics-title">📊 Real-time Metrics</h4>
        </div>
        <div class="force-metrics-grid">
          <div class="force-metric">
            <span class="force-metric-label">Structural Energy</span>
            <span class="force-metric-value" id="structural-energy">-</span>
          </div>
          <div class="force-metric">
            <span class="force-metric-label">Semantic Energy</span>
            <span class="force-metric-value" id="semantic-energy">-</span>
          </div>
          <div class="force-metric">
            <span class="force-metric-label">Total Energy</span>
            <span class="force-metric-value" id="total-energy">-</span>
          </div>
          <div class="force-metric">
            <span class="force-metric-label">Convergence</span>
            <span class="force-metric-value" id="convergence">-</span>
          </div>
          <div class="force-metric">
            <span class="force-metric-label">Node Movement</span>
            <span class="force-metric-value" id="node-movement">-</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Add Xbox-themed styling for force controls
   */
  private addXboxStyling(): void {
    const styles = `
      <style>
      .force-balancer-panel {
        background: linear-gradient(135deg, var(--color-gray-800) 0%, var(--color-gray-700) 100%);
        border: 2px solid var(--color-primary); /* Xbox Green */
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-4);
        box-shadow: 0 0 20px rgba(16, 124, 16, 0.2); /* Xbox Green glow */
        position: relative;
        overflow: hidden;
      }

      .force-balancer-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--color-primary), var(--color-accent), var(--color-secondary));
        animation: force-pulse 3s ease-in-out infinite;
      }

      @keyframes force-pulse {
        0%, 100% { opacity: 0.7; transform: scaleX(1); }
        50% { opacity: 1; transform: scaleX(1.02); }
      }

      .force-balancer-header {
        text-align: center;
        margin-bottom: var(--space-6);
      }

      .force-balancer-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-primary); /* Xbox Green */
        margin-bottom: var(--space-2);
        text-shadow: 0 0 10px rgba(16, 124, 16, 0.5);
      }

      .force-balancer-subtitle {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .force-balance-visualization {
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: rgba(0, 0, 0, 0.3);
        border-radius: var(--radius-base);
      }

      .force-balance-bar {
        position: relative;
        height: 12px;
        background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        border-radius: var(--radius-full);
        margin-bottom: var(--space-3);
        overflow: hidden;
      }

      .force-balance-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: var(--color-accent); /* Xbox Gold */
        transition: width 0.3s ease;
        border-radius: var(--radius-full);
        box-shadow: 0 0 10px rgba(255, 185, 0, 0.6);
      }

      .force-balance-marker {
        position: absolute;
        top: -2px;
        height: 16px;
        width: 3px;
        background: var(--color-white);
        border-radius: var(--radius-full);
        transition: left 0.3s ease;
        box-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
      }

      .force-balance-labels {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .force-label {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .force-label--structural {
        color: var(--color-primary);
      }

      .force-label--semantic {
        color: var(--color-secondary);
      }

      .force-controls {
        margin-bottom: var(--space-6);
      }

      .force-control-group {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-4);
      }

      .force-slider-container {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .force-slider-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .force-slider-title {
        color: var(--color-text-primary);
      }

      .force-slider-value {
        color: var(--color-accent); /* Xbox Gold */
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-bold);
      }

      .force-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        border-radius: var(--radius-full);
        outline: none;
        cursor: pointer;
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .force-slider--structural {
        background: linear-gradient(90deg, var(--color-gray-600), var(--color-primary));
      }

      .force-slider--semantic {
        background: linear-gradient(90deg, var(--color-gray-600), var(--color-secondary));
      }

      .force-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid var(--color-white);
        cursor: pointer;
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .force-slider--structural::-webkit-slider-thumb {
        background: var(--color-primary);
        box-shadow: 0 0 10px rgba(16, 124, 16, 0.6);
      }

      .force-slider--semantic::-webkit-slider-thumb {
        background: var(--color-secondary);
        box-shadow: 0 0 10px rgba(0, 188, 242, 0.6);
      }

      .force-slider:hover::-webkit-slider-thumb {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.4);
      }

      .force-balance-controls {
        display: flex;
        justify-content: center;
        padding: var(--space-3);
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-base);
      }

      .force-presets {
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-base);
        border: 1px solid var(--color-gray-600);
      }

      .force-presets-header {
        margin-bottom: var(--space-4);
      }

      .force-presets-title {
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        margin: 0;
      }

      .force-presets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: var(--space-3);
      }

      .force-preset-btn {
        padding: var(--space-3);
        background: var(--color-gray-800);
        border: 2px solid var(--color-gray-600);
        border-radius: var(--radius-base);
        color: var(--color-text-primary);
        text-align: center;
        cursor: pointer;
        transition: all var(--duration-fast) var(--easing-ease);
        position: relative;
        overflow: hidden;
      }

      .force-preset-btn:hover {
        border-color: var(--color-accent);
        background: var(--color-gray-700);
        transform: translateY(-2px);
        box-shadow: 0 0 15px rgba(255, 185, 0, 0.3);
      }

      .force-preset-btn--active {
        border-color: var(--color-accent);
        background: linear-gradient(135deg, rgba(255, 185, 0, 0.1), rgba(255, 185, 0, 0.05));
        box-shadow: 0 0 20px rgba(255, 185, 0, 0.4);
      }

      .force-preset-icon {
        font-size: var(--font-size-xl);
        margin-bottom: var(--space-2);
      }

      .force-preset-name {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1);
        color: var(--color-text-primary);
      }

      .force-preset-description {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-2);
        line-height: 1.3;
      }

      .force-preset-weights {
        font-size: var(--font-size-xs);
        color: var(--color-accent);
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-medium);
      }

      .force-metrics {
        padding: var(--space-4);
        background: rgba(0, 0, 0, 0.3);
        border-radius: var(--radius-base);
        border: 1px solid var(--color-secondary);
      }

      .force-metrics-header {
        margin-bottom: var(--space-3);
      }

      .force-metrics-title {
        color: var(--color-secondary);
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        margin: 0;
      }

      .force-metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-3);
      }

      .force-metric {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-2);
        background: rgba(0, 188, 242, 0.1);
        border-radius: var(--radius-base);
        border: 1px solid rgba(0, 188, 242, 0.3);
      }

      .force-metric-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-1);
        text-align: center;
      }

      .force-metric-value {
        font-size: var(--font-size-base);
        color: var(--color-secondary);
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-bold);
      }

      @media (max-width: 640px) {
        .force-presets-grid {
          grid-template-columns: 1fr;
        }

        .force-metrics-grid {
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        }
      }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Bind event handlers for force controls
   */
  private bindEvents(): void {
    // Structural slider
    this.structuralSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.config.structuralWeight = value;

      if (this.balanceLocked) {
        this.config.semanticWeight = 1 - value;
        this.semanticSlider.value = (this.config.semanticWeight * 100).toString();
      }

      this.updateDisplay();
      this.config.onForceChange(this.config.structuralWeight, this.config.semanticWeight);
    });

    // Semantic slider
    this.semanticSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.config.semanticWeight = value;

      if (this.balanceLocked) {
        this.config.structuralWeight = 1 - value;
        this.structuralSlider.value = (this.config.structuralWeight * 100).toString();
      }

      this.updateDisplay();
      this.config.onForceChange(this.config.structuralWeight, this.config.semanticWeight);
    });

    // Balance lock checkbox
    this.lockBalanceCheckbox.addEventListener('change', (e) => {
      this.balanceLocked = (e.target as HTMLInputElement).checked;

      if (this.balanceLocked) {
        // Normalize to sum to 1.0
        const total = this.config.structuralWeight + this.config.semanticWeight;
        if (total > 0) {
          this.config.structuralWeight = this.config.structuralWeight / total;
          this.config.semanticWeight = this.config.semanticWeight / total;
        } else {
          this.config.structuralWeight = 0.5;
          this.config.semanticWeight = 0.5;
        }

        this.structuralSlider.value = (this.config.structuralWeight * 100).toString();
        this.semanticSlider.value = (this.config.semanticWeight * 100).toString();
        this.updateDisplay();
        this.config.onForceChange(this.config.structuralWeight, this.config.semanticWeight);
      }
    });

    // Preset buttons
    this.presetButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const presetId = (e.currentTarget as HTMLElement).getAttribute('data-preset');
        const preset = this.presets.find(p => p.id === presetId);
        if (preset) {
          this.applyPreset(preset);
        }
      });
    });
  }

  /**
   * Apply a force preset
   */
  private applyPreset(preset: ForcePreset): void {
    this.config.structuralWeight = preset.structuralWeight;
    this.config.semanticWeight = preset.semanticWeight;

    this.structuralSlider.value = (preset.structuralWeight * 100).toString();
    this.semanticSlider.value = (preset.semanticWeight * 100).toString();

    // Update active preset button
    this.presetButtons.forEach(button => {
      button.classList.remove('force-preset-btn--active');
      if (button.getAttribute('data-preset') === preset.id) {
        button.classList.add('force-preset-btn--active');
      }
    });

    this.updateDisplay();
    this.config.onForceChange(this.config.structuralWeight, this.config.semanticWeight);
    this.config.onPresetSelect(preset);

    // Brief animation feedback
    this.showPresetFeedback(preset);
  }

  /**
   * Show visual feedback when preset is selected
   */
  private showPresetFeedback(preset: ForcePreset): void {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--color-accent);
      color: var(--color-gray-900);
      padding: var(--space-3) var(--space-6);
      border-radius: var(--radius-lg);
      font-weight: var(--font-weight-bold);
      z-index: var(--z-overlay);
      animation: presetFeedback 1.5s ease-out forwards;
      pointer-events: none;
      box-shadow: 0 0 30px rgba(255, 185, 0, 0.8);
    `;
    feedback.textContent = `${preset.icon} ${preset.name} Applied`;

    document.body.appendChild(feedback);

    setTimeout(() => {
      document.body.removeChild(feedback);
    }, 1500);

    // Add keyframe animation
    if (!document.querySelector('#preset-feedback-styles')) {
      const style = document.createElement('style');
      style.id = 'preset-feedback-styles';
      style.textContent = `
        @keyframes presetFeedback {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Update all display elements
   */
  private updateDisplay(): void {
    this.updateVisualization();
    this.updateSliderValues();
  }

  /**
   * Update the balance visualization bar
   */
  private updateVisualization(): void {
    const total = this.config.structuralWeight + this.config.semanticWeight;
    const structuralPercent = total > 0 ? (this.config.structuralWeight / total) * 100 : 50;

    const fill = this.balanceVisualization.querySelector('.force-balance-fill') as HTMLElement;
    const marker = this.balanceVisualization.querySelector('.force-balance-marker') as HTMLElement;

    fill.style.width = `${structuralPercent}%`;
    marker.style.left = `${structuralPercent}%`;
  }

  /**
   * Update slider value displays
   */
  private updateSliderValues(): void {
    const structuralValue = this.container.querySelector('#structural-value') as HTMLElement;
    const semanticValue = this.container.querySelector('#semantic-value') as HTMLElement;

    structuralValue.textContent = `${(this.config.structuralWeight * 100).toFixed(0)}%`;
    semanticValue.textContent = `${(this.config.semanticWeight * 100).toFixed(0)}%`;
  }

  /**
   * Update real-time force metrics
   */
  public updateMetrics(metrics: ForceMetrics): void {
    if (!this.config.showRealTimeMetrics || !this.metricsDisplay) return;

    const elements = {
      structuralEnergy: this.metricsDisplay.querySelector('#structural-energy') as HTMLElement,
      semanticEnergy: this.metricsDisplay.querySelector('#semantic-energy') as HTMLElement,
      totalEnergy: this.metricsDisplay.querySelector('#total-energy') as HTMLElement,
      convergence: this.metricsDisplay.querySelector('#convergence') as HTMLElement,
      nodeMovement: this.metricsDisplay.querySelector('#node-movement') as HTMLElement
    };

    if (elements.structuralEnergy) elements.structuralEnergy.textContent = metrics.structuralEnergy.toFixed(2);
    if (elements.semanticEnergy) elements.semanticEnergy.textContent = metrics.semanticEnergy.toFixed(2);
    if (elements.totalEnergy) elements.totalEnergy.textContent = metrics.totalEnergy.toFixed(2);
    if (elements.convergence) elements.convergence.textContent = `${(metrics.convergence * 100).toFixed(1)}%`;
    if (elements.nodeMovement) elements.nodeMovement.textContent = metrics.nodeMovement.toFixed(2);
  }

  /**
   * Get current force configuration
   */
  public getForces(): { structural: number, semantic: number } {
    return {
      structural: this.config.structuralWeight,
      semantic: this.config.semanticWeight
    };
  }

  /**
   * Set force weights programmatically
   */
  public setForces(structural: number, semantic: number): void {
    this.config.structuralWeight = Math.max(0, Math.min(1, structural));
    this.config.semanticWeight = Math.max(0, Math.min(1, semantic));

    this.structuralSlider.value = (this.config.structuralWeight * 100).toString();
    this.semanticSlider.value = (this.config.semanticWeight * 100).toString();

    this.updateDisplay();
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ForceBalancerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.updateDisplay();
  }

  /**
   * Cleanup component
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}