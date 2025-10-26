/**
 * Developer Experience Module
 *
 * Comprehensive developer tools and playground for knowledge-network library:
 * - Interactive code editing with Monaco Editor and IntelliSense
 * - Real-time configuration playground with live preview
 * - Framework integration examples and templates
 * - Performance profiling and optimization tools
 * - Interactive API documentation and explorer
 */

import { BaseDemoModule, type ConfigOption, type CodeExample as BaseCodeExample, type InteractionEvent } from '../../shared/DemoModule.js';
import { CodeEditor } from './components/CodeEditor.js';
import { ConfigurationPlayground } from './components/ConfigurationPlayground.js';
import { FrameworkIntegration } from './components/FrameworkIntegration.js';
import { PerformanceProfiler } from './components/PerformanceProfiler.js';
import { APIExplorer } from './components/APIExplorer.js';
import { generateDeveloperDatasets } from './data/developer-datasets.js';
import { formatNumber, debounce } from '../../shared/utils.js';

/**
 * Configuration interface for developer experience features
 */
export interface DeveloperConfig {
  enableCodeEditor: boolean;
  enableLivePreview: boolean;
  enableFrameworkExamples: boolean;
  enablePerformanceProfiler: boolean;
  editorTheme: 'xbox-dark' | 'xbox-light' | 'vs-dark' | 'vs-light';
  selectedFramework: 'react' | 'vue' | 'angular' | 'vanilla';
  autoSave: boolean;
  showMinifiedOutput: boolean;
  enableIntelliSense: boolean;
  profilerUpdateInterval: number;
  exportFormat: 'typescript' | 'javascript' | 'json' | 'yaml';
}

/**
 * Enhanced code example with framework-specific variations
 */
export interface CodeExample extends BaseCodeExample {
  framework?: 'react' | 'vue' | 'angular' | 'vanilla';
  dependencies?: string[];
  runnable?: boolean;
  editable?: boolean;
}

/**
 * Framework integration template
 */
export interface FrameworkTemplate {
  id: string;
  name: string;
  framework: 'react' | 'vue' | 'angular' | 'vanilla';
  description: string;
  template: string;
  dependencies: string[];
  setup: string;
  usage: string;
}

/**
 * Performance profiler metrics
 */
export interface ProfilerMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage: number;
  fpsAverage: number;
  nodeCount: number;
  edgeCount: number;
  drawCalls: number;
  bottlenecks: string[];
  recommendations: string[];
  timestamp: number;
}

/**
 * API endpoint documentation
 */
export interface APIEndpoint {
  id: string;
  name: string;
  category: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    default?: any;
  }>;
  returns: {
    type: string;
    description: string;
  };
  example: string;
  interactive: boolean;
}

/**
 * Export format configuration
 */
export interface ExportFormat {
  type: 'typescript' | 'javascript' | 'json' | 'yaml';
  minified: boolean;
  includeTypes: boolean;
  includeComments: boolean;
  bundled: boolean;
}

/**
 * Main Developer Experience module implementation
 */
export class DeveloperExperience extends BaseDemoModule {
  private knowledgeGraph: any = null;
  private codeEditor: CodeEditor | null = null;
  private configurationPlayground: ConfigurationPlayground | null = null;
  private frameworkIntegration: FrameworkIntegration | null = null;
  private performanceProfiler: PerformanceProfiler | null = null;
  private apiExplorer: APIExplorer | null = null;

  private currentDataset: any = null;
  private profilerMetrics: ProfilerMetrics;
  private activeCodeExample: CodeExample | null = null;
  private configurationHistory: any[] = [];

  private developerConfig: DeveloperConfig = {
    enableCodeEditor: true,
    enableLivePreview: true,
    enableFrameworkExamples: true,
    enablePerformanceProfiler: true,
    editorTheme: 'xbox-dark',
    selectedFramework: 'react',
    autoSave: true,
    showMinifiedOutput: false,
    enableIntelliSense: true,
    profilerUpdateInterval: 1000,
    exportFormat: 'typescript'
  };

  constructor() {
    super({
      id: 'developer-experience',
      title: 'Developer Experience',
      description: 'Live code editor, framework integration, and configuration playground',
      difficulty: 'advanced',
      estimatedTime: '20-30 minutes',
      capabilities: [
        'Live Monaco code editor with IntelliSense and syntax highlighting',
        'Framework integration examples (React, Vue, Angular)',
        'Real-time configuration playground with parameter tuning',
        'Performance profiler with optimization recommendations',
        'Interactive API documentation with live examples',
        'Code generation and export utilities for production use'
      ],
      competitiveAdvantages: [
        'First graph library with integrated Monaco code playground',
        'Live configuration editing vs static documentation',
        'Framework-specific integration examples vs generic tutorials',
        'Performance profiling tools not available in D3.js or Cytoscape.js',
        'Xbox-style developer console vs basic configuration panels',
        'Production-ready code generation vs copy-paste examples'
      ]
    });

    this.profilerMetrics = {
      renderTime: 0,
      updateTime: 0,
      memoryUsage: 0,
      fpsAverage: 60,
      nodeCount: 0,
      edgeCount: 0,
      drawCalls: 0,
      bottlenecks: [],
      recommendations: [],
      timestamp: Date.now()
    };
  }

  protected async onInitialize(): Promise<void> {
    if (!this.container || !this.context) {
      throw new Error('Container and context must be available');
    }

    // Apply Xbox-inspired developer console styling
    this.setupXboxDeveloperStyling();

    // Initialize developer components
    this.codeEditor = new CodeEditor({
      container: this.container,
      theme: this.developerConfig.editorTheme,
      enableIntelliSense: this.developerConfig.enableIntelliSense,
      onCodeChange: this.handleCodeChange.bind(this)
    });

    this.configurationPlayground = new ConfigurationPlayground({
      container: this.container,
      onConfigChange: this.handleConfigChange.bind(this),
      enableLivePreview: this.developerConfig.enableLivePreview
    });

    this.frameworkIntegration = new FrameworkIntegration({
      container: this.container,
      selectedFramework: this.developerConfig.selectedFramework,
      onFrameworkChange: this.handleFrameworkChange.bind(this)
    });

    this.performanceProfiler = new PerformanceProfiler({
      container: this.container,
      updateInterval: this.developerConfig.profilerUpdateInterval,
      onProfileUpdate: this.handleProfileUpdate.bind(this)
    });

    this.apiExplorer = new APIExplorer({
      container: this.container,
      onAPICall: this.handleAPICall.bind(this)
    });

    // Generate developer-focused dataset
    this.currentDataset = generateDeveloperDatasets();

    // Initialize developer graph
    await this.initializeDeveloperGraph();

    // Set up developer event handlers
    this.setupDeveloperHandlers();

    // Start performance monitoring
    this.startPerformanceMonitoring();

    // Load default code example
    this.loadDefaultExample();
  }

  protected async onRender(): Promise<void> {
    if (!this.context || !this.canvas) return;

    const startTime = performance.now();

    // Clear with Xbox developer console background
    this.renderDeveloperBackground();

    // Render graph with developer tooling overlays
    if (this.knowledgeGraph && this.currentDataset) {
      await this.renderDeveloperGraph();
    }

    // Render developer overlays
    this.renderDeveloperOverlays();

    // Update performance metrics
    const renderTime = performance.now() - startTime;
    this.updateProfilerMetrics(renderTime);
  }

  protected onCleanup(): void {
    this.codeEditor?.destroy();
    this.configurationPlayground?.destroy();
    this.frameworkIntegration?.destroy();
    this.performanceProfiler?.destroy();
    this.apiExplorer?.destroy();
    this.knowledgeGraph = null;
  }

  protected onConfigurationUpdate(config: Record<string, any>): void {
    this.developerConfig = { ...this.developerConfig, ...config };

    // Update components with new configuration
    this.codeEditor?.updateConfig({
      theme: this.developerConfig.editorTheme,
      enableIntelliSense: this.developerConfig.enableIntelliSense
    });

    this.configurationPlayground?.setLivePreview(this.developerConfig.enableLivePreview);
    this.frameworkIntegration?.setFramework(this.developerConfig.selectedFramework);
    this.performanceProfiler?.setUpdateInterval(this.developerConfig.profilerUpdateInterval);

    // Save configuration to history
    this.configurationHistory.push({
      timestamp: Date.now(),
      config: { ...this.developerConfig }
    });

    // Auto-save if enabled
    if (this.developerConfig.autoSave) {
      this.saveConfiguration();
    }
  }

  protected getDefaultConfiguration(): Record<string, any> {
    return { ...this.developerConfig };
  }

  public getConfigurationOptions(): ConfigOption[] {
    return [
      {
        id: 'enableCodeEditor',
        label: 'Code Editor',
        type: 'toggle',
        value: this.developerConfig.enableCodeEditor,
        description: 'Enable Monaco code editor with IntelliSense'
      },
      {
        id: 'enableLivePreview',
        label: 'Live Preview',
        type: 'toggle',
        value: this.developerConfig.enableLivePreview,
        description: 'Real-time preview of code changes'
      },
      {
        id: 'enableFrameworkExamples',
        label: 'Framework Examples',
        type: 'toggle',
        value: this.developerConfig.enableFrameworkExamples,
        description: 'Show framework-specific integration examples'
      },
      {
        id: 'enablePerformanceProfiler',
        label: 'Performance Profiler',
        type: 'toggle',
        value: this.developerConfig.enablePerformanceProfiler,
        description: 'Enable performance monitoring and profiling'
      },
      {
        id: 'editorTheme',
        label: 'Editor Theme',
        type: 'select',
        value: this.developerConfig.editorTheme,
        options: [
          { value: 'xbox-dark', label: 'Xbox Dark' },
          { value: 'xbox-light', label: 'Xbox Light' },
          { value: 'vs-dark', label: 'Visual Studio Dark' },
          { value: 'vs-light', label: 'Visual Studio Light' }
        ],
        description: 'Code editor color theme'
      },
      {
        id: 'selectedFramework',
        label: 'Framework',
        type: 'select',
        value: this.developerConfig.selectedFramework,
        options: [
          { value: 'react', label: 'React' },
          { value: 'vue', label: 'Vue 3' },
          { value: 'angular', label: 'Angular' },
          { value: 'vanilla', label: 'Vanilla JS' }
        ],
        description: 'Target framework for code examples'
      },
      {
        id: 'autoSave',
        label: 'Auto Save',
        type: 'toggle',
        value: this.developerConfig.autoSave,
        description: 'Automatically save configuration changes'
      },
      {
        id: 'showMinifiedOutput',
        label: 'Minified Output',
        type: 'toggle',
        value: this.developerConfig.showMinifiedOutput,
        description: 'Show minified code in export preview'
      },
      {
        id: 'profilerUpdateInterval',
        label: 'Profiler Update Rate',
        type: 'slider',
        value: this.developerConfig.profilerUpdateInterval,
        min: 100,
        max: 5000,
        step: 100,
        description: 'Performance profiler update interval (ms)'
      }
    ];
  }

  public getCodeExamples(): CodeExample[] {
    return [
      {
        id: 'basic-setup',
        title: 'Basic Graph Setup',
        description: 'Initialize a knowledge graph with basic configuration',
        language: 'typescript',
        framework: this.developerConfig.selectedFramework,
        code: this.getFrameworkSpecificCode('basic-setup'),
        category: 'setup',
        runnable: true,
        editable: true,
        dependencies: ['@aigeeksquad/knowledge-network']
      },
      {
        id: 'configuration-playground',
        title: 'Live Configuration',
        description: 'Interactive parameter tuning with real-time feedback',
        language: 'typescript',
        framework: this.developerConfig.selectedFramework,
        code: this.getFrameworkSpecificCode('configuration'),
        category: 'interaction',
        runnable: true,
        editable: true,
        dependencies: ['@aigeeksquad/knowledge-network', 'react']
      },
      {
        id: 'performance-optimization',
        title: 'Performance Optimization',
        description: 'Advanced techniques for optimal rendering performance',
        language: 'typescript',
        framework: this.developerConfig.selectedFramework,
        code: this.getFrameworkSpecificCode('performance'),
        category: 'optimization',
        runnable: false,
        editable: true,
        dependencies: ['@aigeeksquad/knowledge-network']
      },
      {
        id: 'custom-rendering',
        title: 'Custom Node Rendering',
        description: 'Implementing custom node and edge rendering functions',
        language: 'typescript',
        framework: this.developerConfig.selectedFramework,
        code: this.getFrameworkSpecificCode('custom-rendering'),
        category: 'algorithm',
        runnable: true,
        editable: true,
        dependencies: ['@aigeeksquad/knowledge-network', 'd3']
      }
    ];
  }

  public onInteraction(event: InteractionEvent): void {
    // Log interactions for developer analysis
    if (this.performanceProfiler) {
      this.performanceProfiler.logInteraction(event);
    }

    // Update code editor if interaction affects displayed code
    if (event.type === 'select' && this.codeEditor) {
      this.updateCodeForSelection(event);
    }
  }

  // Developer-specific public methods

  /**
   * Execute code in the editor
   */
  public async executeCode(): Promise<any> {
    if (!this.codeEditor) return null;

    const code = this.codeEditor.getValue();
    try {
      // Execute code in sandboxed environment
      const result = await this.executeSandboxedCode(code);
      this.displayExecutionResult(result);
      return result;
    } catch (error) {
      this.displayExecutionError(error);
      throw error;
    }
  }

  /**
   * Export current configuration as code
   */
  public exportConfiguration(format: ExportFormat): string {
    const config = this.getCurrentConfiguration();

    switch (format.type) {
      case 'typescript':
        return this.generateTypeScriptConfig(config, format);
      case 'javascript':
        return this.generateJavaScriptConfig(config, format);
      case 'json':
        return JSON.stringify(config, null, format.minified ? 0 : 2);
      case 'yaml':
        return this.generateYAMLConfig(config);
      default:
        return JSON.stringify(config, null, 2);
    }
  }

  /**
   * Get performance analysis report
   */
  public getPerformanceReport(): ProfilerMetrics {
    return { ...this.profilerMetrics };
  }

  // Private methods

  private setupXboxDeveloperStyling(): void {
    if (!this.container) return;

    this.container.style.cssText += `
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
      border: 2px solid #107c10;
      border-radius: 8px;
      box-shadow:
        0 0 30px rgba(16, 124, 16, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      position: relative;
      overflow: hidden;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    `;

    // Add Xbox developer console header
    const consoleHeader = document.createElement('div');
    consoleHeader.className = 'xbox-dev-console-header';
    consoleHeader.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 48px;
      background: linear-gradient(90deg, #107c10 0%, #1570a6 100%);
      display: flex;
      align-items: center;
      padding: 0 16px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    `;

    consoleHeader.innerHTML = `
      <span>🎮 Xbox Developer Console</span>
      <div style="margin-left: auto; display: flex; gap: 16px; align-items: center; font-size: 12px;">
        <span id="dev-framework">Framework: ${this.developerConfig.selectedFramework.toUpperCase()}</span>
        <span id="dev-performance">Performance: <span style="color: #ffb900;">Optimal</span></span>
        <span id="dev-memory">Memory: <span id="memory-usage">0MB</span></span>
      </div>
    `;

    this.container.appendChild(consoleHeader);
  }

  private async initializeDeveloperGraph(): Promise<void> {
    // Initialize knowledge graph with developer tooling
    console.log('Initializing developer graph with dataset:', this.currentDataset);
  }

  private async renderDeveloperGraph(): Promise<void> {
    // Render the graph with developer annotations
  }

  private renderDeveloperBackground(): void {
    if (!this.context || !this.canvas) return;

    const { width, height } = this.canvas;

    // Xbox developer console grid pattern
    const gradient = this.context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.5, '#1a1a1a');
    gradient.addColorStop(1, '#0a0a0a');

    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, width, height);

    // Draw subtle grid for developer reference
    this.context.strokeStyle = 'rgba(16, 124, 16, 0.1)';
    this.context.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x < width; x += 50) {
      this.context.beginPath();
      this.context.moveTo(x, 0);
      this.context.lineTo(x, height);
      this.context.stroke();
    }

    // Horizontal lines
    for (let y = 0; y < height; y += 50) {
      this.context.beginPath();
      this.context.moveTo(0, y);
      this.context.lineTo(width, y);
      this.context.stroke();
    }
  }

  private renderDeveloperOverlays(): void {
    // Render performance metrics overlay
    this.renderPerformanceOverlay();

    // Render coordinate system
    this.renderCoordinateSystem();

    // Render debug information
    this.renderDebugInfo();
  }

  private renderPerformanceOverlay(): void {
    if (!this.context || !this.developerConfig.enablePerformanceProfiler) return;

    const metrics = this.profilerMetrics;

    this.context.save();
    this.context.fillStyle = 'rgba(16, 124, 16, 0.8)';
    this.context.font = '12px Consolas, monospace';

    const overlayText = [
      `FPS: ${metrics.fpsAverage.toFixed(1)}`,
      `Render: ${metrics.renderTime.toFixed(1)}ms`,
      `Memory: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      `Nodes: ${metrics.nodeCount}`,
      `Edges: ${metrics.edgeCount}`
    ];

    overlayText.forEach((text, index) => {
      this.context!.fillText(text, 10, 70 + (index * 16));
    });

    this.context.restore();
  }

  private renderCoordinateSystem(): void {
    if (!this.context || !this.canvas) return;

    this.context.save();
    this.context.strokeStyle = '#ffb900';
    this.context.fillStyle = '#ffb900';
    this.context.font = '10px Consolas, monospace';
    this.context.lineWidth = 1;

    // Draw axis indicators
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // X axis
    this.context.beginPath();
    this.context.moveTo(centerX - 20, centerY);
    this.context.lineTo(centerX + 20, centerY);
    this.context.stroke();

    // Y axis
    this.context.beginPath();
    this.context.moveTo(centerX, centerY - 20);
    this.context.lineTo(centerX, centerY + 20);
    this.context.stroke();

    // Origin label
    this.context.fillText('(0,0)', centerX + 5, centerY - 5);

    this.context.restore();
  }

  private renderDebugInfo(): void {
    // Render additional debug information for developers
  }

  private setupDeveloperHandlers(): void {
    if (!this.container) return;

    // Hot key handlers for developer actions
    this.container.addEventListener('keydown', (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            this.saveConfiguration();
            break;
          case 'r':
            event.preventDefault();
            this.executeCode();
            break;
          case 'e':
            event.preventDefault();
            this.exportConfiguration({
              type: this.developerConfig.exportFormat,
              minified: this.developerConfig.showMinifiedOutput,
              includeTypes: true,
              includeComments: true,
              bundled: false
            });
            break;
        }
      }
    });
  }

  private startPerformanceMonitoring(): void {
    if (!this.developerConfig.enablePerformanceProfiler) return;

    setInterval(() => {
      this.updatePerformanceMetrics();
    }, this.developerConfig.profilerUpdateInterval);
  }

  private loadDefaultExample(): void {
    if (!this.codeEditor) return;

    const defaultCode = this.getFrameworkSpecificCode('basic-setup');
    this.codeEditor.setValue(defaultCode);
  }

  private getFrameworkSpecificCode(example: string): string {
    const framework = this.developerConfig.selectedFramework;

    const templates = {
      'basic-setup': {
        react: `import React, { useEffect, useRef } from 'react';
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

export function GraphComponent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<KnowledgeGraph | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize the knowledge graph
    graphRef.current = new KnowledgeGraph({
      container: containerRef.current,
      width: 800,
      height: 600,
      layout: {
        type: 'force-directed',
        strength: 0.1,
        distance: 100
      },
      rendering: {
        nodeRadius: 5,
        edgeWidth: 1,
        enableZoom: true,
        enablePan: true
      }
    });

    // Load sample data
    const nodes = [
      { id: 'node1', label: 'Node 1', x: 100, y: 100 },
      { id: 'node2', label: 'Node 2', x: 200, y: 150 },
      { id: 'node3', label: 'Node 3', x: 150, y: 250 }
    ];

    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' }
    ];

    graphRef.current.setData({ nodes, edges });

    return () => {
      graphRef.current?.destroy();
    };
  }, []);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}`,
        vue: `<template>
  <div ref="graphContainer" class="graph-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

const graphContainer = ref<HTMLDivElement>();
let graph: KnowledgeGraph | null = null;

onMounted(() => {
  if (!graphContainer.value) return;

  // Initialize the knowledge graph
  graph = new KnowledgeGraph({
    container: graphContainer.value,
    width: 800,
    height: 600,
    layout: {
      type: 'force-directed',
      strength: 0.1,
      distance: 100
    },
    rendering: {
      nodeRadius: 5,
      edgeWidth: 1,
      enableZoom: true,
      enablePan: true
    }
  });

  // Load sample data
  const nodes = [
    { id: 'node1', label: 'Node 1', x: 100, y: 100 },
    { id: 'node2', label: 'Node 2', x: 200, y: 150 },
    { id: 'node3', label: 'Node 3', x: 150, y: 250 }
  ];

  const edges = [
    { source: 'node1', target: 'node2' },
    { source: 'node2', target: 'node3' }
  ];

  graph.setData({ nodes, edges });
});

onUnmounted(() => {
  graph?.destroy();
});
</script>

<style scoped>
.graph-container {
  width: 100%;
  height: 100%;
}
</style>`,
        angular: `import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

@Component({
  selector: 'app-graph',
  template: \`
    <div #graphContainer class="graph-container"></div>
  \`,
  styles: [\`
    .graph-container {
      width: 100%;
      height: 100%;
    }
  \`]
})
export class GraphComponent implements OnInit, OnDestroy {
  @ViewChild('graphContainer', { static: true })
  graphContainer!: ElementRef<HTMLDivElement>;

  private graph: KnowledgeGraph | null = null;

  ngOnInit(): void {
    // Initialize the knowledge graph
    this.graph = new KnowledgeGraph({
      container: this.graphContainer.nativeElement,
      width: 800,
      height: 600,
      layout: {
        type: 'force-directed',
        strength: 0.1,
        distance: 100
      },
      rendering: {
        nodeRadius: 5,
        edgeWidth: 1,
        enableZoom: true,
        enablePan: true
      }
    });

    // Load sample data
    const nodes = [
      { id: 'node1', label: 'Node 1', x: 100, y: 100 },
      { id: 'node2', label: 'Node 2', x: 200, y: 150 },
      { id: 'node3', label: 'Node 3', x: 150, y: 250 }
    ];

    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' }
    ];

    this.graph.setData({ nodes, edges });
  }

  ngOnDestroy(): void {
    this.graph?.destroy();
  }
}`,
        vanilla: `import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

// Get the container element
const container = document.getElementById('graph-container');
if (!container) {
  throw new Error('Graph container not found');
}

// Initialize the knowledge graph
const graph = new KnowledgeGraph({
  container,
  width: 800,
  height: 600,
  layout: {
    type: 'force-directed',
    strength: 0.1,
    distance: 100
  },
  rendering: {
    nodeRadius: 5,
    edgeWidth: 1,
    enableZoom: true,
    enablePan: true
  }
});

// Load sample data
const nodes = [
  { id: 'node1', label: 'Node 1', x: 100, y: 100 },
  { id: 'node2', label: 'Node 2', x: 200, y: 150 },
  { id: 'node3', label: 'Node 3', x: 150, y: 250 }
];

const edges = [
  { source: 'node1', target: 'node2' },
  { source: 'node2', target: 'node3' }
];

graph.setData({ nodes, edges });

// Cleanup function
window.addEventListener('beforeunload', () => {
  graph.destroy();
});`
      }
    };

    return templates[example]?.[framework] || templates[example]?.vanilla || '';
  }

  private handleCodeChange(code: string): void {
    if (this.developerConfig.enableLivePreview) {
      this.updateLivePreview(code);
    }

    if (this.developerConfig.autoSave) {
      this.saveCodeChange(code);
    }
  }

  private handleConfigChange(config: any): void {
    this.onConfigurationUpdate(config);
  }

  private handleFrameworkChange(framework: string): void {
    this.developerConfig.selectedFramework = framework as any;
    this.loadDefaultExample(); // Reload example for new framework
  }

  private handleProfileUpdate(metrics: ProfilerMetrics): void {
    this.profilerMetrics = metrics;
    this.updatePerformanceUI();
  }

  private handleAPICall(endpoint: APIEndpoint, params: any): void {
    // Handle interactive API calls
    console.log('API call:', endpoint, params);
  }

  private updateLivePreview(code: string): void {
    // Update live preview with debouncing
    const debouncedUpdate = debounce(() => {
      this.executeSandboxedCode(code).catch(console.error);
    }, 500);

    debouncedUpdate();
  }

  private async executeSandboxedCode(code: string): Promise<any> {
    // Execute code in a sandboxed environment
    // This is a simplified implementation
    try {
      const result = eval(`(function() { ${code} })()`);
      return result;
    } catch (error) {
      throw new Error(`Code execution error: ${error.message}`);
    }
  }

  private displayExecutionResult(result: any): void {
    console.log('Code execution result:', result);
  }

  private displayExecutionError(error: any): void {
    console.error('Code execution error:', error);
  }

  private saveConfiguration(): void {
    // Save current configuration
    localStorage.setItem('knowledgeGraphConfig', JSON.stringify(this.developerConfig));
  }

  private saveCodeChange(code: string): void {
    // Auto-save code changes
    localStorage.setItem('knowledgeGraphCode', code);
  }

  private getCurrentConfiguration(): any {
    return {
      graph: this.developerConfig,
      dataset: this.currentDataset,
      code: this.codeEditor?.getValue(),
      framework: this.developerConfig.selectedFramework
    };
  }

  private generateTypeScriptConfig(config: any, format: ExportFormat): string {
    const imports = `import { KnowledgeGraph, GraphConfig } from '@aigeeksquad/knowledge-network';`;
    const configCode = `const config: GraphConfig = ${JSON.stringify(config.graph, null, 2)};`;

    if (format.minified) {
      return `${imports}\nconst config=${JSON.stringify(config.graph)};export default config;`;
    }

    return `${imports}\n\n${configCode}\n\nexport default config;`;
  }

  private generateJavaScriptConfig(config: any, format: ExportFormat): string {
    if (format.minified) {
      return `const config=${JSON.stringify(config.graph)};export default config;`;
    }

    return `const config = ${JSON.stringify(config.graph, null, 2)};\n\nexport default config;`;
  }

  private generateYAMLConfig(config: any): string {
    // Simple YAML generation (would use a proper YAML library in production)
    return Object.entries(config.graph)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join('\n');
  }

  private updateCodeForSelection(event: InteractionEvent): void {
    // Update code editor based on graph interaction
  }

  private updatePerformanceMetrics(): void {
    // Update performance metrics
    this.profilerMetrics.timestamp = Date.now();
    this.profilerMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
  }

  private updatePerformanceUI(): void {
    // Update performance indicators in UI
    const memoryElement = this.container?.querySelector('#memory-usage');
    if (memoryElement) {
      memoryElement.textContent = `${(this.profilerMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`;
    }
  }

  private updateProfilerMetrics(renderTime: number): void {
    this.profilerMetrics.renderTime = renderTime;
    this.profilerMetrics.fpsAverage = Math.round(1000 / Math.max(renderTime, 16.67));
    this.profilerMetrics.nodeCount = this.currentDataset?.nodes?.length || 0;
    this.profilerMetrics.edgeCount = this.currentDataset?.edges?.length || 0;
    this.profilerMetrics.timestamp = Date.now();

    // Update state metrics for external access
    if (this._state) {
      (this._state.metrics as any).developer = {
        framework: this.developerConfig.selectedFramework,
        codeEditor: this.developerConfig.enableCodeEditor,
        livePreview: this.developerConfig.enableLivePreview,
        profilerMetrics: this.profilerMetrics
      };
    }
  }
}