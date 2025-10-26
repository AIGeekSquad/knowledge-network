/**
 * Competitive Comparison Component
 *
 * Side-by-side benchmarking against D3.js, Cytoscape.js, and vis.js
 * with quantified performance metrics and competitive advantages visualization.
 */

import { BaseComponent, Button, Toggle, Panel, Select } from '../../../shared/UIComponents.js';
import { formatNumber, formatDuration, formatMemory } from '../../../shared/utils.js';

export interface CompetitiveComparisonConfig {
  enableComparison?: boolean;
  onRunBenchmark: (library: string) => void;
  showDetails?: boolean;
}

interface BenchmarkResult {
  library: string;
  fps: number;
  selectionTime: number;
  memoryUsage: number;
  duration: number;
  complexity: string;
  nodeCount: number;
}

interface LibraryInfo {
  name: string;
  version: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  color: string;
  icon: string;
}

/**
 * Competitive benchmarking component with Xbox-themed styling
 */
export class CompetitiveComparison extends BaseComponent<{
  benchmarkStart: { library: string };
  comparisonToggle: { enabled: boolean };
}> {
  private config: CompetitiveComparisonConfig;
  private benchmarkResults = new Map<string, BenchmarkResult>();
  private isRunningBenchmark = false;
  private currentLibrary = '';

  private libraryInfo: Record<string, LibraryInfo> = {
    'knowledge-network': {
      name: 'Knowledge Network',
      version: '2.0.0',
      description: 'GPU-accelerated graph visualization with spatial indexing',
      strengths: ['WebGL rendering', 'O(log n) selection', 'High performance'],
      weaknesses: ['Newer library', 'Learning curve'],
      color: 'var(--color-primary)',
      icon: '🚀'
    },
    'd3': {
      name: 'D3.js',
      version: '7.8.5',
      description: 'Data-driven documents with DOM manipulation',
      strengths: ['Mature ecosystem', 'Flexible API', 'Large community'],
      weaknesses: ['CPU-bound', 'O(n) operations', 'Performance limitations'],
      color: 'var(--color-warning)',
      icon: '📊'
    },
    'cytoscape': {
      name: 'Cytoscape.js',
      version: '3.26.0',
      description: 'Graph theory library for analysis and visualization',
      strengths: ['Rich algorithms', 'Network analysis', 'Good documentation'],
      weaknesses: ['Canvas limitations', 'Memory intensive', 'Slower rendering'],
      color: 'var(--color-info)',
      icon: '🕸️'
    },
    'visjs': {
      name: 'vis.js',
      version: '4.21.0',
      description: 'Dynamic visualization library with multiple chart types',
      strengths: ['Multiple visualizations', 'Good interactions', 'Easy setup'],
      weaknesses: ['Canvas performance', 'Limited scalability', 'Heavy bundle'],
      color: 'var(--color-accent)',
      icon: '📈'
    }
  };

  constructor(config: CompetitiveComparisonConfig) {
    super('div', 'competitive-comparison');
    this.config = config;

    this.setupComponent();
  }

  private setupComponent(): void {
    // Create panel container with Xbox styling
    const panel = new Panel({
      title: '⚔️ Competitive Benchmark',
      collapsible: true,
      expanded: false,
      className: 'competitive-comparison-panel'
    });

    // Add custom Xbox-style header styling
    const panelElement = panel.getElement();
    panelElement.style.cssText += `
      background: linear-gradient(135deg, var(--color-bg-surface), var(--color-gray-700));
      border: 1px solid var(--color-accent);
      box-shadow: 0 0 15px rgba(255, 185, 0, 0.2);
    `;

    // Create content container
    const content = document.createElement('div');
    content.className = 'competitive-comparison-content';
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-4);
    `;

    // Add library selector
    this.createLibrarySelector(content);

    // Add benchmark controls
    this.createBenchmarkControls(content);

    // Add results comparison
    this.createResultsComparison(content);

    // Add library details
    this.createLibraryDetails(content);

    panel.addContent(content);
    this.element.appendChild(panel.getElement());
  }

  private createLibrarySelector(container: HTMLElement): void {
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'library-selector';
    selectorContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Create library selection grid
    const libraryGrid = document.createElement('div');
    libraryGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
      margin-bottom: var(--space-3);
    `;

    Object.entries(this.libraryInfo).forEach(([key, info]) => {
      const libraryCard = document.createElement('div');
      libraryCard.className = `library-card library-card--${key}`;
      libraryCard.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-3);
        background: var(--color-gray-900);
        border: 1px solid var(--color-border-light);
        border-radius: var(--radius-base);
        cursor: pointer;
        transition: all var(--duration-fast) var(--easing-ease);
        position: relative;
        overflow: hidden;
      `;

      libraryCard.addEventListener('mouseenter', () => {
        libraryCard.style.borderColor = info.color;
        libraryCard.style.boxShadow = `0 0 15px ${info.color}30`;
      });

      libraryCard.addEventListener('mouseleave', () => {
        if (this.currentLibrary !== key) {
          libraryCard.style.borderColor = 'var(--color-border-light)';
          libraryCard.style.boxShadow = 'none';
        }
      });

      libraryCard.addEventListener('click', () => {
        this.selectLibrary(key);
      });

      libraryCard.innerHTML = `
        <div style="
          font-size: var(--font-size-lg);
          margin-bottom: var(--space-2);
        ">${info.icon}</div>
        <div style="
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          text-align: center;
          margin-bottom: var(--space-1);
        ">${info.name}</div>
        <div style="
          font-size: var(--font-size-xs);
          color: var(--color-text-secondary);
          font-family: var(--font-family-mono);
        ">v${info.version}</div>
      `;

      libraryGrid.appendChild(libraryCard);
    });

    selectorContainer.appendChild(libraryGrid);
    container.appendChild(selectorContainer);

    // Select Knowledge Network by default
    this.selectLibrary('knowledge-network');
  }

  private createBenchmarkControls(container: HTMLElement): void {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'benchmark-controls';
    controlsContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    // Benchmark button
    const benchmarkButton = new Button('🏁 Run Benchmark', {
      variant: 'primary',
      size: 'medium'
    });

    // Add Xbox-style glow effect
    const benchmarkButtonElement = benchmarkButton.getElement().querySelector('.ui-button') as HTMLElement;
    if (benchmarkButtonElement) {
      benchmarkButtonElement.style.cssText += `
        background: linear-gradient(135deg, var(--color-accent), #e6a800);
        box-shadow: 0 0 15px rgba(255, 185, 0, 0.4);
        border: 1px solid var(--color-accent);
        width: 100%;
      `;
    }

    benchmarkButton.on('click', () => {
      if (!this.isRunningBenchmark && this.currentLibrary) {
        this.startBenchmark(this.currentLibrary);
      }
    });

    // Run all button
    const runAllButton = new Button('⚡ Benchmark All', {
      variant: 'secondary',
      size: 'medium'
    });

    const runAllButtonElement = runAllButton.getElement().querySelector('.ui-button') as HTMLElement;
    if (runAllButtonElement) {
      runAllButtonElement.style.width = '100%';
      runAllButtonElement.style.marginTop = 'var(--space-2)';
    }

    runAllButton.on('click', () => {
      if (!this.isRunningBenchmark) {
        this.runAllBenchmarks();
      }
    });

    // Description
    const description = document.createElement('div');
    description.style.cssText = `
      margin-bottom: var(--space-3);
      font-size: var(--font-size-xs);
      color: var(--color-text-secondary);
      line-height: var(--line-height-relaxed);
      text-align: center;
    `;
    description.innerHTML = `
      Compare performance across different libraries<br>
      <span style="color: var(--color-accent);">Tests: Rendering, Selection, Memory Usage</span>
    `;

    controlsContainer.appendChild(description);
    controlsContainer.appendChild(benchmarkButton.getElement());
    controlsContainer.appendChild(runAllButton.getElement());
    container.appendChild(controlsContainer);
  }

  private createResultsComparison(container: HTMLElement): void {
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'results-comparison';
    resultsContainer.id = 'results-comparison';
    resultsContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
      display: none;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-3);
      color: var(--color-text-primary);
      font-weight: var(--font-weight-semibold);
    `;
    header.innerHTML = `🏆 <span>Benchmark Results</span>`;

    const resultsTable = document.createElement('div');
    resultsTable.id = 'results-table';
    resultsTable.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    `;

    resultsContainer.appendChild(header);
    resultsContainer.appendChild(resultsTable);
    container.appendChild(resultsContainer);
  }

  private createLibraryDetails(container: HTMLElement): void {
    const detailsContainer = document.createElement('div');
    detailsContainer.id = 'library-details';
    detailsContainer.className = 'library-details';
    detailsContainer.style.cssText = `
      background: var(--color-gray-800);
      border: 1px solid var(--color-border-light);
      border-radius: var(--radius-base);
      padding: var(--space-3);
    `;

    container.appendChild(detailsContainer);
    this.updateLibraryDetails('knowledge-network');
  }

  private selectLibrary(libraryKey: string): void {
    this.currentLibrary = libraryKey;

    // Update visual selection
    const cards = this.element.querySelectorAll('.library-card');
    cards.forEach(card => {
      const cardElement = card as HTMLElement;
      if (card.classList.contains(`library-card--${libraryKey}`)) {
        const info = this.libraryInfo[libraryKey];
        cardElement.style.borderColor = info.color;
        cardElement.style.boxShadow = `0 0 15px ${info.color}30`;
        cardElement.style.background = `linear-gradient(135deg, var(--color-gray-900), ${info.color}10)`;
      } else {
        cardElement.style.borderColor = 'var(--color-border-light)';
        cardElement.style.boxShadow = 'none';
        cardElement.style.background = 'var(--color-gray-900)';
      }
    });

    // Update library details
    this.updateLibraryDetails(libraryKey);
  }

  private updateLibraryDetails(libraryKey: string): void {
    const detailsContainer = document.querySelector('#library-details') as HTMLElement;
    if (!detailsContainer) return;

    const info = this.libraryInfo[libraryKey];
    if (!info) return;

    detailsContainer.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        gap: var(--space-3);
        margin-bottom: var(--space-3);
      ">
        <div style="
          font-size: var(--font-size-xl);
        ">${info.icon}</div>
        <div>
          <div style="
            font-size: var(--font-size-base);
            font-weight: var(--font-weight-semibold);
            color: ${info.color};
          ">${info.name}</div>
          <div style="
            font-size: var(--font-size-xs);
            color: var(--color-text-secondary);
            margin-top: var(--space-1);
          ">${info.description}</div>
        </div>
      </div>

      <div style="
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-3);
      ">
        <div>
          <div style="
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--color-success);
            margin-bottom: var(--space-2);
          ">✅ Strengths</div>
          ${info.strengths.map(strength => `
            <div style="
              font-size: var(--font-size-xs);
              color: var(--color-text-secondary);
              margin-bottom: var(--space-1);
            ">• ${strength}</div>
          `).join('')}
        </div>
        <div>
          <div style="
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-semibold);
            color: var(--color-warning);
            margin-bottom: var(--space-2);
          ">⚠️ Considerations</div>
          ${info.weaknesses.map(weakness => `
            <div style="
              font-size: var(--font-size-xs);
              color: var(--color-text-secondary);
              margin-bottom: var(--space-1);
            ">• ${weakness}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private startBenchmark(libraryKey: string): void {
    this.isRunningBenchmark = true;

    // Update button state
    const buttons = this.element.querySelectorAll('.ui-button');
    buttons.forEach(button => {
      (button as HTMLElement).style.opacity = '0.5';
    });

    // Trigger benchmark
    this.config.onRunBenchmark(libraryKey);
    this.emit('benchmarkStart', { library: libraryKey });
  }

  private async runAllBenchmarks(): Promise<void> {
    const libraries = Object.keys(this.libraryInfo);

    for (const library of libraries) {
      if (this.isRunningBenchmark) break;

      await new Promise(resolve => {
        this.startBenchmark(library);
        setTimeout(resolve, 2000); // Allow time for benchmark
      });
    }

    this.isRunningBenchmark = false;
  }

  public updateBenchmarkResult(libraryKey: string, result: any): void {
    const benchmarkResult: BenchmarkResult = {
      library: libraryKey,
      fps: result.fps,
      selectionTime: result.selectionTime,
      memoryUsage: result.memoryUsage,
      duration: result.duration,
      complexity: libraryKey === 'knowledge-network' ? 'O(log n)' : 'O(n)',
      nodeCount: result.nodeCount || 1000
    };

    this.benchmarkResults.set(libraryKey, benchmarkResult);
    this.updateResultsDisplay();

    this.isRunningBenchmark = false;

    // Restore button states
    const buttons = this.element.querySelectorAll('.ui-button');
    buttons.forEach(button => {
      (button as HTMLElement).style.opacity = '1';
    });
  }

  private updateResultsDisplay(): void {
    const resultsContainer = document.querySelector('#results-comparison') as HTMLElement;
    const resultsTable = document.querySelector('#results-table') as HTMLElement;

    if (!resultsContainer || !resultsTable) return;

    if (this.benchmarkResults.size === 0) {
      resultsContainer.style.display = 'none';
      return;
    }

    resultsContainer.style.display = 'block';

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
      gap: var(--space-2);
      padding: var(--space-2) 0;
      border-bottom: 2px solid var(--color-accent);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      font-size: var(--font-size-xs);
    `;
    header.innerHTML = `
      <div>Library</div>
      <div>FPS</div>
      <div>Selection</div>
      <div>Memory</div>
      <div>Score</div>
    `;

    // Clear and rebuild table
    resultsTable.innerHTML = '';
    resultsTable.appendChild(header);

    // Sort results by overall performance score
    const sortedResults = [...this.benchmarkResults.entries()]
      .sort(([,a], [,b]) => this.calculateScore(b) - this.calculateScore(a));

    sortedResults.forEach(([libraryKey, result], index) => {
      const info = this.libraryInfo[libraryKey];
      const score = this.calculateScore(result);
      const isWinner = index === 0;

      const row = document.createElement('div');
      row.style.cssText = `
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: var(--space-2);
        padding: var(--space-2) 0;
        border-bottom: 1px solid var(--color-border-light);
        font-family: var(--font-family-mono);
        font-size: var(--font-size-xs);
        align-items: center;
        ${isWinner ? `background: linear-gradient(135deg, ${info.color}10, transparent);` : ''}
      `;

      row.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          gap: var(--space-2);
          color: ${info.color};
          font-weight: var(--font-weight-semibold);
        ">
          ${info.icon} ${info.name}
          ${isWinner ? ' 🏆' : ''}
        </div>
        <div style="color: ${result.fps >= 50 ? 'var(--color-success)' : result.fps >= 30 ? 'var(--color-warning)' : 'var(--color-danger)'};">
          ${result.fps.toFixed(0)}
        </div>
        <div style="color: ${result.selectionTime < 1 ? 'var(--color-success)' : result.selectionTime < 10 ? 'var(--color-warning)' : 'var(--color-danger)'};">
          ${formatDuration(result.selectionTime)}
        </div>
        <div>${formatMemory(result.memoryUsage)}</div>
        <div style="
          color: ${isWinner ? 'var(--color-success)' : 'var(--color-text-primary)'};
          font-weight: var(--font-weight-semibold);
        ">${score.toFixed(0)}</div>
      `;

      resultsTable.appendChild(row);
    });

    // Add competitive advantages summary
    if (this.benchmarkResults.has('knowledge-network')) {
      const knResult = this.benchmarkResults.get('knowledge-network')!;
      const summary = document.createElement('div');
      summary.style.cssText = `
        margin-top: var(--space-3);
        padding: var(--space-3);
        background: linear-gradient(135deg, var(--color-primary)10, transparent);
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-base);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
      `;

      const advantages = this.calculateAdvantages(knResult);
      summary.innerHTML = `
        <div style="
          color: var(--color-primary);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--space-2);
        ">🚀 Knowledge Network Advantages:</div>
        ${advantages.map(advantage => `
          <div style="margin-bottom: var(--space-1);">• ${advantage}</div>
        `).join('')}
      `;

      resultsTable.appendChild(summary);
    }
  }

  private calculateScore(result: BenchmarkResult): number {
    // Weighted performance score
    const fpsScore = Math.min(result.fps / 60 * 100, 100);
    const selectionScore = Math.max(0, 100 - (result.selectionTime * 10));
    const memoryScore = Math.max(0, 100 - (result.memoryUsage / (1024 * 1024) / 10));

    return (fpsScore * 0.4) + (selectionScore * 0.4) + (memoryScore * 0.2);
  }

  private calculateAdvantages(knResult: BenchmarkResult): string[] {
    const advantages: string[] = [];

    // Compare against other results
    for (const [library, result] of this.benchmarkResults) {
      if (library === 'knowledge-network') continue;

      const info = this.libraryInfo[library];
      const fpsImprovement = ((knResult.fps / result.fps - 1) * 100);
      const selectionImprovement = ((result.selectionTime / knResult.selectionTime));
      const memoryImprovement = ((result.memoryUsage / knResult.memoryUsage - 1) * 100);

      if (fpsImprovement > 20) {
        advantages.push(`${fpsImprovement.toFixed(0)}% higher FPS than ${info.name}`);
      }

      if (selectionImprovement > 10) {
        advantages.push(`${selectionImprovement.toFixed(0)}x faster selection than ${info.name}`);
      }

      if (memoryImprovement > 20) {
        advantages.push(`${memoryImprovement.toFixed(0)}% more memory efficient than ${info.name}`);
      }
    }

    // Add algorithmic advantages
    advantages.push('O(log n) spatial indexing vs O(n) linear search');
    advantages.push('GPU-accelerated WebGL rendering');
    advantages.push('Optimized for 10K+ node visualization');

    return advantages;
  }

  public destroy(): void {
    super.destroy();
  }
}