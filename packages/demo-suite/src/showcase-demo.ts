/**
 * Single Showcase Demo - Working demonstration of library capabilities
 * Shows real knowledge graphs with interactive controls
 */

import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
import { PerformanceDemo } from './components/performance/PerformanceDemo.js';

// Rich sample data showing library capabilities
function createComprehensiveKnowledgeGraph() {
  return {
    nodes: [
      // Technology concepts
      { id: 'javascript', label: 'JavaScript', type: 'language' },
      { id: 'typescript', label: 'TypeScript', type: 'language' },
      { id: 'react', label: 'React', type: 'framework' },
      { id: 'nodejs', label: 'Node.js', type: 'runtime' },
      { id: 'webpack', label: 'Webpack', type: 'tool' },

      // Data visualization
      { id: 'd3', label: 'D3.js', type: 'library' },
      { id: 'charts', label: 'Charts', type: 'concept' },
      { id: 'graphs', label: 'Graphs', type: 'concept' },
      { id: 'data-viz', label: 'Data Visualization', type: 'field' },

      // Performance concepts
      { id: 'performance', label: 'Performance', type: 'concept' },
      { id: 'optimization', label: 'Optimization', type: 'process' },
      { id: 'algorithms', label: 'Algorithms', type: 'concept' },
      { id: 'data-structures', label: 'Data Structures', type: 'concept' },

      // Web technologies
      { id: 'html', label: 'HTML', type: 'markup' },
      { id: 'css', label: 'CSS', type: 'styling' },
      { id: 'svg', label: 'SVG', type: 'format' },
      { id: 'canvas', label: 'Canvas', type: 'api' },
      { id: 'webgl', label: 'WebGL', type: 'api' }
    ],
    edges: [
      // Language relationships
      { source: 'typescript', target: 'javascript', label: 'compiles to' },
      { source: 'react', target: 'javascript', label: 'built with' },
      { source: 'nodejs', target: 'javascript', label: 'runtime for' },

      // Build tools
      { source: 'webpack', target: 'javascript', label: 'bundles' },
      { source: 'webpack', target: 'typescript', label: 'processes' },

      // Visualization
      { source: 'd3', target: 'javascript', label: 'library for' },
      { source: 'd3', target: 'data-viz', label: 'enables' },
      { source: 'charts', target: 'data-viz', label: 'type of' },
      { source: 'graphs', target: 'data-viz', label: 'type of' },

      // Performance
      { source: 'performance', target: 'optimization', label: 'improved by' },
      { source: 'algorithms', target: 'performance', label: 'affects' },
      { source: 'data-structures', target: 'algorithms', label: 'used in' },

      // Web technologies
      { source: 'svg', target: 'html', label: 'embedded in' },
      { source: 'canvas', target: 'html', label: 'element in' },
      { source: 'webgl', target: 'canvas', label: 'context for' },
      { source: 'css', target: 'html', label: 'styles' },

      // Cross-connections
      { source: 'd3', target: 'svg', label: 'renders to' },
      { source: 'd3', target: 'canvas', label: 'can use' },
      { source: 'react', target: 'html', label: 'generates' },
      { source: 'performance', target: 'webgl', label: 'enhanced by' }
    ]
  };
}

// Configuration options for the demo
interface DemoConfig {
  renderingMode: 'svg' | 'canvas' | 'webgl';
  edgeRenderer: 'simple' | 'bundled';
  layoutAlgorithm: 'force-directed' | 'circular' | 'grid';
  showPerformanceMetrics: boolean;
}

class ShowcaseDemo {
  private container: HTMLElement;
  private graph: KnowledgeGraph | null = null;
  private performanceDemo: PerformanceDemo | null = null;
  private config: DemoConfig = {
    renderingMode: 'svg',
    edgeRenderer: 'simple',
    layoutAlgorithm: 'force-directed',
    showPerformanceMetrics: true
  };

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    this.createInterface();
    await this.initializePerformanceMonitoring();
    await this.renderGraph();
    this.setupControls();
  }

  private createInterface(): void {
    this.container.innerHTML = `
      <div class="showcase-demo">
        <div class="controls-panel">
          <h3>Interactive Controls</h3>

          <div class="control-group">
            <label>Rendering Engine:</label>
            <select id="rendering-mode">
              <option value="svg">SVG</option>
              <option value="canvas">Canvas</option>
              <option value="webgl">WebGL</option>
            </select>
          </div>

          <div class="control-group">
            <label>Edge Rendering:</label>
            <select id="edge-renderer">
              <option value="simple">Simple</option>
              <option value="bundled">Bundled</option>
            </select>
          </div>

          <div class="control-group">
            <label>Layout Algorithm:</label>
            <select id="layout-algorithm">
              <option value="force-directed">Force-Directed</option>
              <option value="circular">Circular</option>
              <option value="grid">Grid</option>
            </select>
          </div>

          <button id="apply-config">Apply Configuration</button>
        </div>

        <div class="graph-container" id="graph-area">
          <!-- Graph will render here -->
        </div>
      </div>
    `;

    // Add styling
    const style = document.createElement('style');
    style.textContent = `
      .showcase-demo {
        display: flex;
        gap: 20px;
        height: 100%;
        background: #1a1d20;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      .controls-panel {
        width: 250px;
        padding: 20px;
        background: #2d3748;
        border-radius: 8px;
        height: fit-content;
      }

      .controls-panel h3 {
        margin: 0 0 20px 0;
        color: #107c10;
      }

      .control-group {
        margin-bottom: 15px;
      }

      .control-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }

      .control-group select {
        width: 100%;
        padding: 8px;
        border: 1px solid #4a5568;
        border-radius: 4px;
        background: #1a202c;
        color: white;
      }

      #apply-config {
        width: 100%;
        padding: 10px;
        background: #107c10;
        color: white;
        border: none;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
      }

      #apply-config:hover {
        background: #0e6b0e;
      }

      .graph-container {
        flex: 1;
        border: 2px solid #107c10;
        border-radius: 8px;
        position: relative;
        background: rgba(255,255,255,0.02);
      }
    `;
    document.head.appendChild(style);
  }

  private async initializePerformanceMonitoring(): Promise<void> {
    if (this.config.showPerformanceMetrics) {
      const graphArea = this.container.querySelector('#graph-area') as HTMLElement;
      if (graphArea) {
        this.performanceDemo = new PerformanceDemo(graphArea);
        await this.performanceDemo.initialize();
      }
    }
  }

  private async renderGraph(): Promise<void> {
    const graphArea = this.container.querySelector('#graph-area') as HTMLElement;
    if (!graphArea) return;

    // Clear existing graph
    if (this.graph) {
      this.graph.destroy();
    }

    const data = createComprehensiveKnowledgeGraph();

    // Create graph with current configuration
    this.graph = new KnowledgeGraph(graphArea, data, {
      width: graphArea.offsetWidth || 600,
      height: graphArea.offsetHeight || 400,

      // Node styling
      nodeRadius: (node) => node.type === 'language' ? 12 : 8,
      nodeFill: (node) => {
        const colors = {
          'language': '#107c10',
          'framework': '#00bcf2',
          'library': '#ff6b6b',
          'concept': '#4ecdc4',
          'tool': '#ffb900'
        };
        return colors[node.type as keyof typeof colors] || '#999';
      },
      nodeStroke: '#ffffff',
      nodeStrokeWidth: 2,

      // Edge styling
      edgeStroke: '#666',
      edgeStrokeWidth: 1.5,
      edgeRenderer: this.config.edgeRenderer,

      // Layout settings based on algorithm
      ...(this.config.layoutAlgorithm === 'circular' ? {
        // Circular layout would need custom implementation
      } : {
        // Default force-directed
        chargeStrength: -300,
        linkDistance: 100
      }),

      // Interaction
      enableZoom: true,
      enableDrag: true
    });

    await this.graph.render();
  }

  private setupControls(): void {
    const applyButton = this.container.querySelector('#apply-config') as HTMLButtonElement;

    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.updateConfiguration();
      });
    }
  }

  private updateConfiguration(): void {
    const renderingMode = (this.container.querySelector('#rendering-mode') as HTMLSelectElement).value;
    const edgeRenderer = (this.container.querySelector('#edge-renderer') as HTMLSelectElement).value;
    const layoutAlgorithm = (this.container.querySelector('#layout-algorithm') as HTMLSelectElement).value;

    this.config.renderingMode = renderingMode as any;
    this.config.edgeRenderer = edgeRenderer as any;
    this.config.layoutAlgorithm = layoutAlgorithm as any;

    console.log('Applying new configuration:', this.config);

    // Re-render with new configuration
    this.renderGraph();
  }
}

// Initialize showcase demo
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('demo-container');

  if (container) {
    const demo = new ShowcaseDemo(container);
    await demo.initialize();
    console.log('Showcase demo initialized successfully');
  } else {
    console.error('Demo container not found');
  }
});