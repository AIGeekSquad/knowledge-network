/**
 * SemanticAIDemo - Main Embedding-Based Clustering Demonstration
 *
 * Industry-first demonstration of AI-powered graph layout and clustering capabilities.
 * This module showcases the unique semantic clustering features of the knowledge-network
 * library that no other graph visualization library offers.
 *
 * Key Features:
 * - Real-time embedding calculation and positioning
 * - Hybrid force systems balancing structure and semantics
 * - Interactive concept input with live clustering
 * - Dynamic similarity threshold adjustment
 * - Semantic edge bundling with AI compatibility
 */

import { BaseDemoModule } from '../../shared/DemoModule.js';
import type {
  DemoModule,
  ConfigOption,
  CodeExample,
  ModuleMetrics,
  InteractionEvent
} from '../../shared/DemoModule.js';

import { ConceptInput, type ConceptInputConfig } from './components/ConceptInput.js';
import { ForceBalancer, type ForceBalancerConfig, type ForceMetrics } from './components/ForceBalancer.js';
import { ClusteringVisualizer, type ClusteringConfig, type NodeCluster } from './components/ClusteringVisualizer.js';

import {
  conceptNetworks,
  type SemanticNode,
  type SemanticEdge
} from './data/semantic-datasets.js';

// Type exports for external use
export type {
  SemanticNode as ConceptEmbedding,
  SemanticEdge as SemanticForce,
  NodeCluster as ClusteringThreshold,
  ForceBalancerConfig as EmbeddingModel,
  ClusteringConfig as SemanticEdgeBundle
};

export interface SemanticConfig {
  dataset: 'research-papers' | 'technology-stack' | 'scientific-concepts' | 'custom';
  embeddingModel: 'simple' | 'tfidf' | 'semantic';
  forceBalance: { structural: number; semantic: number };
  clusteringThreshold: number;
  showEmbeddings: boolean;
  showClusters: boolean;
  showSimilarityEdges: boolean;
  animationSpeed: number;
  nodeSize: number;
  edgeOpacity: number;
}

/**
 * SemanticAIDemo - Main demonstration class
 */
export class SemanticAIDemo extends BaseDemoModule implements DemoModule {
  private semanticConfig: SemanticConfig;
  private currentNodes: SemanticNode[] = [];
  private currentEdges: SemanticEdge[] = [];
  private currentClusters: NodeCluster[] = [];

  // Component instances
  private conceptInput: ConceptInput | null = null;
  private forceBalancer: ForceBalancer | null = null;
  private clusteringVisualizer: ClusteringVisualizer | null = null;

  // UI elements
  private controlPanel: HTMLElement | null = null;
  private visualizationContainer: HTMLElement | null = null;
  private datasetSelector: HTMLSelectElement | null = null;
  private aiStatusIndicator: HTMLElement | null = null;

  // Rendering state
  private graphCanvas: HTMLCanvasElement | null = null;
  private graphContext: CanvasRenderingContext2D | null = null;
  private nodePositions: Map<string, { x: number; y: number }> = new Map();
  private hoveredNode: string | null = null;
  private selectedNode: string | null = null;

  // Animation and physics
  private isAnimating = false;
  private lastFrameTime = 0;
  private velocities: Map<string, { x: number; y: number }> = new Map();

  constructor() {
    super({
      id: 'semantic-ai',
      title: 'Semantic AI Clustering',
      description: 'AI-powered graph layout with embedding-based clustering and semantic forces',
      difficulty: 'advanced',
      estimatedTime: '15-20 minutes',
      capabilities: [
        'Real-time embedding-based node positioning',
        'Hybrid structural + semantic force systems',
        'Interactive concept input with live clustering',
        'Dynamic similarity threshold adjustment',
        'Semantic edge bundling with AI compatibility',
        'Multi-model embedding comparison'
      ],
      competitiveAdvantages: [
        'Industry-first semantic clustering in graph visualization',
        'Real-time embedding calculation and positioning',
        'Hybrid force systems balancing structure and meaning',
        'Academic semantic spacetime model implementation',
        'Production-ready caching with LRU optimization',
        'No competitor offers first-class AI integration'
      ]
    });

    this.semanticConfig = this.getDefaultSemanticConfiguration();
  }

  /**
   * Get default semantic configuration
   */
  private getDefaultSemanticConfiguration(): SemanticConfig {
    return {
      dataset: 'research-papers',
      embeddingModel: 'semantic',
      forceBalance: { structural: 0.5, semantic: 0.5 },
      clusteringThreshold: 0.6,
      showEmbeddings: true,
      showClusters: true,
      showSimilarityEdges: false,
      animationSpeed: 1.0,
      nodeSize: 8,
      edgeOpacity: 0.6
    };
  }

  /**
   * Module-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    this.createSemanticInterface();
    this.initializeComponents();
    this.loadInitialDataset();
    this.setupGraphVisualization();
    this.startSemanticAnimation();

    // Show AI status as active
    this.updateAIStatus('active', 'Semantic AI engine initialized');
  }

  /**
   * Create the semantic AI interface
   */
  private createSemanticInterface(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="semantic-ai-container">
        <!-- AI Status Indicator -->
        <div class="ai-status-bar" id="ai-status">
          <div class="ai-status-indicator">
            <div class="ai-status-light"></div>
            <span class="ai-status-text">Initializing AI engine...</span>
          </div>
          <div class="ai-model-indicator">
            Model: <span class="ai-model-name">Semantic Embeddings</span>
          </div>
        </div>

        <!-- Dataset Selection -->
        <div class="dataset-selection-panel">
          <label class="dataset-label">
            📊 Dataset:
            <select class="dataset-selector ui-select" id="dataset-selector">
              <option value="research-papers">🎓 Research Papers Network</option>
              <option value="technology-stack">💻 Technology Stack</option>
              <option value="scientific-concepts">🔬 Scientific Concepts</option>
            </select>
          </label>
        </div>

        <!-- Main Content Area -->
        <div class="semantic-content">
          <!-- Controls Panel -->
          <div class="controls-panel" id="controls-panel">
            <div class="concept-input-section" id="concept-input-container"></div>
            <div class="force-balancer-section" id="force-balancer-container"></div>
            <div class="clustering-visualizer-section" id="clustering-visualizer-container"></div>
          </div>

          <!-- Visualization Area -->
          <div class="visualization-panel" id="visualization-container">
            <div class="visualization-header">
              <h3 class="visualization-title">🧠 Semantic Graph Visualization</h3>
              <div class="visualization-stats" id="viz-stats">
                <span class="viz-stat">Nodes: <span class="viz-stat-value" id="node-count">0</span></span>
                <span class="viz-stat">Clusters: <span class="viz-stat-value" id="cluster-count">0</span></span>
                <span class="viz-stat">AI Status: <span class="viz-stat-value" id="ai-status-mini">Active</span></span>
              </div>
            </div>
            <canvas class="semantic-graph-canvas" id="semantic-canvas"></canvas>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.controlPanel = this.container.querySelector('#controls-panel') as HTMLElement;
    this.visualizationContainer = this.container.querySelector('#visualization-container') as HTMLElement;
    this.datasetSelector = this.container.querySelector('#dataset-selector') as HTMLSelectElement;
    this.aiStatusIndicator = this.container.querySelector('#ai-status') as HTMLElement;
    this.graphCanvas = this.container.querySelector('#semantic-canvas') as HTMLCanvasElement;

    if (this.graphCanvas) {
      this.graphContext = this.graphCanvas.getContext('2d');
    }

    // Add Xbox AI styling
    this.addSemanticStyling();
    this.bindSemanticEvents();
  }

  /**
   * Add semantic AI styling with Xbox theme
   */
  private addSemanticStyling(): void {
    const styles = `
      <style>
      .semantic-ai-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-800) 100%);
        color: var(--color-text-primary);
        font-family: var(--font-family-primary);
      }

      .ai-status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) var(--space-4);
        background: linear-gradient(90deg, var(--color-accent), #e5a500);
        color: var(--color-gray-900);
        font-weight: var(--font-weight-semibold);
        box-shadow: 0 0 20px rgba(255, 185, 0, 0.4);
        margin-bottom: var(--space-4);
      }

      .ai-status-indicator {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .ai-status-light {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: var(--color-success);
        animation: ai-pulse 2s ease-in-out infinite;
        box-shadow: 0 0 10px rgba(16, 124, 16, 0.8);
      }

      @keyframes ai-pulse {
        0%, 100% { opacity: 0.8; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.2); }
      }

      .ai-status-light--error {
        background: var(--color-danger);
        box-shadow: 0 0 10px rgba(232, 17, 35, 0.8);
      }

      .ai-status-light--processing {
        background: var(--color-secondary);
        box-shadow: 0 0 10px rgba(0, 188, 242, 0.8);
        animation: ai-processing 1s linear infinite;
      }

      @keyframes ai-processing {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .ai-status-text {
        font-size: var(--font-size-sm);
      }

      .ai-model-indicator {
        font-size: var(--font-size-xs);
        opacity: 0.8;
      }

      .ai-model-name {
        font-weight: var(--font-weight-bold);
      }

      .dataset-selection-panel {
        padding: var(--space-3) var(--space-4);
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-base);
        margin-bottom: var(--space-4);
      }

      .dataset-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
      }

      .dataset-selector {
        background: var(--color-gray-800);
        border: 1px solid var(--color-gray-600);
        color: var(--color-text-primary);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-base);
        font-size: var(--font-size-sm);
        min-width: 250px;
      }

      .semantic-content {
        display: grid;
        grid-template-columns: 400px 1fr;
        gap: var(--space-4);
        flex: 1;
        overflow: hidden;
      }

      .controls-panel {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        overflow-y: auto;
        padding-right: var(--space-2);
        max-height: calc(100vh - 200px);
      }

      .controls-panel::-webkit-scrollbar {
        width: 6px;
      }

      .controls-panel::-webkit-scrollbar-track {
        background: var(--color-gray-800);
        border-radius: var(--radius-full);
      }

      .controls-panel::-webkit-scrollbar-thumb {
        background: var(--color-gray-600);
        border-radius: var(--radius-full);
      }

      .controls-panel::-webkit-scrollbar-thumb:hover {
        background: var(--color-gray-500);
      }

      .visualization-panel {
        display: flex;
        flex-direction: column;
        background: var(--color-gray-800);
        border: 2px solid var(--color-primary);
        border-radius: var(--radius-lg);
        overflow: hidden;
        box-shadow: 0 0 30px rgba(16, 124, 16, 0.2);
      }

      .visualization-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3) var(--space-4);
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
        color: var(--color-white);
        border-bottom: 1px solid var(--color-primary-dark);
      }

      .visualization-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        margin: 0;
        text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      }

      .visualization-stats {
        display: flex;
        gap: var(--space-4);
        font-size: var(--font-size-xs);
      }

      .viz-stat {
        display: flex;
        align-items: center;
        gap: var(--space-1);
        color: rgba(255, 255, 255, 0.8);
      }

      .viz-stat-value {
        color: var(--color-white);
        font-weight: var(--font-weight-bold);
        font-family: var(--font-family-mono);
      }

      .semantic-graph-canvas {
        flex: 1;
        width: 100%;
        height: 100%;
        cursor: grab;
        background: radial-gradient(circle at 50% 50%, rgba(16, 124, 16, 0.1) 0%, transparent 70%);
      }

      .semantic-graph-canvas:active {
        cursor: grabbing;
      }

      /* Responsive design */
      @media (max-width: 1200px) {
        .semantic-content {
          grid-template-columns: 350px 1fr;
        }
      }

      @media (max-width: 768px) {
        .semantic-content {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }

        .controls-panel {
          max-height: 300px;
        }

        .visualization-stats {
          flex-direction: column;
          gap: var(--space-1);
        }
      }

      /* AI Processing Animation */
      .ai-processing-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: var(--color-accent);
        padding: var(--space-4) var(--space-6);
        border-radius: var(--radius-lg);
        border: 2px solid var(--color-accent);
        font-weight: var(--font-weight-bold);
        z-index: var(--z-modal);
        animation: processing-fade 0.3s ease-out;
      }

      @keyframes processing-fade {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Bind semantic AI events
   */
  private bindSemanticEvents(): void {
    if (!this.datasetSelector) return;

    // Dataset selection
    this.datasetSelector.addEventListener('change', (e) => {
      const dataset = (e.target as HTMLSelectElement).value as SemanticConfig['dataset'];
      this.semanticConfig.dataset = dataset;
      this.loadDataset(dataset);
    });

    // Graph canvas interactions
    if (this.graphCanvas) {
      this.graphCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
      this.graphCanvas.addEventListener('click', (e) => this.handleCanvasClick(e));
      this.graphCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
      this.graphCanvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
    }
  }

  /**
   * Initialize AI components
   */
  private initializeComponents(): void {
    if (!this.controlPanel) return;

    // Initialize ConceptInput
    const conceptInputContainer = this.controlPanel.querySelector('#concept-input-container') as HTMLElement;
    if (conceptInputContainer) {
      const conceptConfig: ConceptInputConfig = {
        placeholder: 'Enter a concept (e.g., "Machine Learning")',
        maxLength: 100,
        autoComplete: true,
        embeddingModel: this.semanticConfig.embeddingModel,
        onConceptAdded: (concept) => this.addUserConcept(concept),
        onEmbeddingCalculated: (concept, embedding) => this.onEmbeddingCalculated(concept, embedding)
      };
      this.conceptInput = new ConceptInput(conceptInputContainer, conceptConfig);
    }

    // Initialize ForceBalancer
    const forceBalancerContainer = this.controlPanel.querySelector('#force-balancer-container') as HTMLElement;
    if (forceBalancerContainer) {
      const forceConfig: ForceBalancerConfig = {
        structuralWeight: this.semanticConfig.forceBalance.structural,
        semanticWeight: this.semanticConfig.forceBalance.semantic,
        showRealTimeMetrics: true,
        enablePresets: true,
        onForceChange: (structural, semantic) => this.onForceBalanceChange(structural, semantic),
        onPresetSelect: (preset) => this.onForcePresetSelect(preset)
      };
      this.forceBalancer = new ForceBalancer(forceBalancerContainer, forceConfig);
    }

    // Initialize ClusteringVisualizer
    const clusteringContainer = this.controlPanel.querySelector('#clustering-visualizer-container') as HTMLElement;
    if (clusteringContainer) {
      const clusteringConfig: ClusteringConfig = {
        similarityThreshold: this.semanticConfig.clusteringThreshold,
        clusteringMethod: 'hierarchical',
        showClusterCenters: true,
        showSimilarityEdges: this.semanticConfig.showSimilarityEdges,
        maxClusters: 8,
        onThresholdChange: (threshold) => this.onClusteringThresholdChange(threshold),
        onMethodChange: (method) => this.onClusteringMethodChange(method),
        onClusterUpdate: (clusters) => this.onClusterUpdate(clusters)
      };
      this.clusteringVisualizer = new ClusteringVisualizer(clusteringContainer, clusteringConfig);
    }
  }

  /**
   * Load initial dataset
   */
  private loadInitialDataset(): void {
    this.loadDataset(this.semanticConfig.dataset);
  }

  /**
   * Load a specific dataset
   */
  private loadDataset(datasetName: SemanticConfig['dataset']): void {
    this.updateAIStatus('processing', `Loading ${datasetName} dataset...`);

    setTimeout(() => {
      const dataset = conceptNetworks[datasetName];
      if (dataset) {
        this.currentNodes = [...dataset.nodes];
        this.currentEdges = [...dataset.edges];

        // Initialize node positions randomly
        this.initializeNodePositions();

        // Generate embeddings for nodes
        this.generateNodeEmbeddings();

        // Update components
        this.clusteringVisualizer?.updateNodes(this.currentNodes);

        // Update stats
        this.updateVisualizationStats();

        this.updateAIStatus('active', `${datasetName} dataset loaded successfully`);
      } else {
        this.updateAIStatus('error', `Failed to load ${datasetName} dataset`);
      }
    }, 500);
  }

  /**
   * Initialize random node positions
   */
  private initializeNodePositions(): void {
    if (!this.graphCanvas) return;

    const centerX = this.graphCanvas.width / 2;
    const centerY = this.graphCanvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    this.currentNodes.forEach((node, index) => {
      const angle = (index / this.currentNodes.length) * 2 * Math.PI;
      const r = radius * (0.5 + Math.random() * 0.5);
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;

      this.nodePositions.set(node.id, { x, y });
      this.velocities.set(node.id, { x: 0, y: 0 });

      // Update node coordinates for clustering
      node.x = x;
      node.y = y;
    });
  }

  /**
   * Generate embeddings for current nodes
   */
  private generateNodeEmbeddings(): void {
    this.currentNodes.forEach(node => {
      if (!node.semanticVector) {
        // Generate embedding based on concept text
        node.semanticVector = this.generateEmbedding(node.concept, this.semanticConfig.embeddingModel);
      }
    });
  }

  /**
   * Generate embedding for a concept
   */
  private generateEmbedding(concept: string, model: SemanticConfig['embeddingModel']): number[] {
    // Simple embedding generation (in real implementation, this would call an embedding model)
    const words = concept.toLowerCase().split(/\s+/);
    let embedding: number[];

    switch (model) {
      case 'simple':
        embedding = this.generateSimpleEmbedding(concept);
        break;
      case 'tfidf':
        embedding = this.generateTFIDFEmbedding(concept);
        break;
      case 'semantic':
        embedding = this.generateSemanticEmbedding(concept);
        break;
      default:
        embedding = this.generateSemanticEmbedding(concept);
    }

    return embedding;
  }

  /**
   * Generate simple character-based embedding
   */
  private generateSimpleEmbedding(text: string): number[] {
    const embedding = new Array(32).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      embedding[i % embedding.length] += Math.sin(char / 10) * Math.cos(i);
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Generate TF-IDF style embedding
   */
  private generateTFIDFEmbedding(text: string): number[] {
    const vocabulary = [
      'machine', 'learning', 'data', 'science', 'algorithm', 'neural', 'network',
      'artificial', 'intelligence', 'model', 'training', 'prediction', 'analysis',
      'pattern', 'classification', 'regression', 'clustering', 'optimization',
      'feature', 'vector', 'matrix', 'probability', 'statistics', 'knowledge',
      'computer', 'vision', 'language', 'processing', 'deep', 'system', 'graph', 'semantic'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(vocabulary.length).fill(0);

    // Calculate term frequency
    words.forEach(word => {
      const index = vocabulary.indexOf(word);
      if (index !== -1) {
        embedding[index] += 1;
      } else {
        // Add similarity-based weight for related words
        vocabulary.forEach((vocabWord, vocabIndex) => {
          const similarity = this.calculateWordSimilarity(word, vocabWord);
          if (similarity > 0.3) {
            embedding[vocabIndex] += similarity * 0.5;
          }
        });
      }
    });

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Generate semantic embedding (simulated)
   */
  private generateSemanticEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(128).fill(0); // Higher dimensional

    // Semantic concept mappings
    const semanticConcepts = {
      'technology': { vector: [1, 0.8, 0.6, 0.3, -0.2, 0.9, 0.4, 0.7], weight: 1.0 },
      'science': { vector: [0.7, 1, 0.9, 0.5, 0.3, 0.6, 0.8, 0.4], weight: 1.0 },
      'learning': { vector: [0.6, 0.4, 1, 0.8, 0.7, 0.3, 0.5, 0.9], weight: 1.0 },
      'data': { vector: [0.8, 0.6, 0.7, 1, 0.4, 0.5, 0.9, 0.3], weight: 1.0 },
      'network': { vector: [0.5, 0.7, 0.4, 0.6, 1, 0.8, 0.2, 0.6], weight: 1.0 },
      'artificial': { vector: [0.9, 0.3, 0.8, 0.4, 0.6, 1, 0.5, 0.7], weight: 1.0 },
      'intelligence': { vector: [0.4, 0.8, 0.6, 0.7, 0.5, 0.9, 1, 0.4], weight: 1.0 },
      'analysis': { vector: [0.3, 0.9, 0.5, 0.8, 0.4, 0.2, 0.7, 1], weight: 1.0 }
    };

    // Map words to semantic concepts
    words.forEach(word => {
      Object.entries(semanticConcepts).forEach(([concept, data]) => {
        const similarity = this.calculateWordSimilarity(word, concept);
        if (similarity > 0.1) {
          // Distribute concept vector across embedding dimensions
          for (let i = 0; i < data.vector.length; i++) {
            for (let j = 0; j < 16; j++) { // Repeat pattern across dimensions
              const idx = (i * 16 + j) % embedding.length;
              embedding[idx] += data.vector[i] * similarity * data.weight;
            }
          }
        }
      });
    });

    // Add some controlled randomness for uniqueness
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] += (Math.random() - 0.5) * 0.1;
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Calculate word similarity using character overlap
   */
  private calculateWordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1;

    const set1 = new Set(word1.toLowerCase().split(''));
    const set2 = new Set(word2.toLowerCase().split(''));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Setup graph visualization canvas
   */
  private setupGraphVisualization(): void {
    if (!this.graphCanvas || !this.container) return;

    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Set canvas size
    this.graphCanvas.width = (rect.width - 450) * dpr;
    this.graphCanvas.height = (rect.height - 150) * dpr;
    this.graphCanvas.style.width = `${rect.width - 450}px`;
    this.graphCanvas.style.height = `${rect.height - 150}px`;

    if (this.graphContext) {
      this.graphContext.scale(dpr, dpr);
    }
  }

  /**
   * Start semantic animation loop
   */
  private startSemanticAnimation(): void {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.lastFrameTime = performance.now();

    const animate = (currentTime: number) => {
      if (!this.isAnimating) return;

      const deltaTime = (currentTime - this.lastFrameTime) / 1000;
      this.lastFrameTime = currentTime;

      this.updateSemanticPhysics(deltaTime);
      this.renderSemanticGraph();

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  /**
   * Update physics simulation with semantic forces
   */
  private updateSemanticPhysics(deltaTime: number): void {
    if (this.currentNodes.length === 0) return;

    const dampening = 0.9;
    const forceStrength = 0.1;

    this.currentNodes.forEach(node => {
      const pos = this.nodePositions.get(node.id);
      const vel = this.velocities.get(node.id);
      if (!pos || !vel) return;

      let forceX = 0;
      let forceY = 0;

      // Apply structural forces (traditional graph layout)
      if (this.semanticConfig.forceBalance.structural > 0) {
        const structuralForce = this.calculateStructuralForces(node);
        forceX += structuralForce.x * this.semanticConfig.forceBalance.structural;
        forceY += structuralForce.y * this.semanticConfig.forceBalance.structural;
      }

      // Apply semantic forces (embedding-based)
      if (this.semanticConfig.forceBalance.semantic > 0) {
        const semanticForce = this.calculateSemanticForces(node);
        forceX += semanticForce.x * this.semanticConfig.forceBalance.semantic;
        forceY += semanticForce.y * this.semanticConfig.forceBalance.semantic;
      }

      // Update velocity and position
      vel.x = (vel.x + forceX * deltaTime * forceStrength) * dampening;
      vel.y = (vel.y + forceY * deltaTime * forceStrength) * dampening;

      pos.x += vel.x * deltaTime * this.semanticConfig.animationSpeed;
      pos.y += vel.y * deltaTime * this.semanticConfig.animationSpeed;

      // Update node coordinates for clustering
      node.x = pos.x;
      node.y = pos.y;
    });
  }

  /**
   * Calculate structural forces (traditional graph layout)
   */
  private calculateStructuralForces(node: SemanticNode): { x: number; y: number } {
    const pos = this.nodePositions.get(node.id);
    if (!pos) return { x: 0, y: 0 };

    let forceX = 0;
    let forceY = 0;

    // Repulsion from all other nodes
    this.currentNodes.forEach(otherNode => {
      if (otherNode.id === node.id) return;

      const otherPos = this.nodePositions.get(otherNode.id);
      if (!otherPos) return;

      const dx = pos.x - otherPos.x;
      const dy = pos.y - otherPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0 && distance < 200) {
        const repulsion = 500 / (distance * distance);
        forceX += (dx / distance) * repulsion;
        forceY += (dy / distance) * repulsion;
      }
    });

    // Attraction to connected nodes
    this.currentEdges.forEach(edge => {
      if (edge.source === node.id || edge.target === node.id) {
        const otherNodeId = edge.source === node.id ? edge.target : edge.source;
        const otherPos = this.nodePositions.get(otherNodeId);
        if (!otherPos) return;

        const dx = otherPos.x - pos.x;
        const dy = otherPos.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 50) {
          const attraction = Math.min(0.1, distance * 0.001);
          forceX += (dx / distance) * attraction;
          forceY += (dy / distance) * attraction;
        }
      }
    });

    return { x: forceX, y: forceY };
  }

  /**
   * Calculate semantic forces (embedding-based)
   */
  private calculateSemanticForces(node: SemanticNode): { x: number; y: number } {
    const pos = this.nodePositions.get(node.id);
    if (!pos || !node.semanticVector) return { x: 0, y: 0 };

    let forceX = 0;
    let forceY = 0;

    // Semantic attraction/repulsion based on embeddings
    this.currentNodes.forEach(otherNode => {
      if (otherNode.id === node.id || !otherNode.semanticVector) return;

      const otherPos = this.nodePositions.get(otherNode.id);
      if (!otherPos) return;

      // Calculate semantic similarity
      const similarity = this.cosineSimilarity(node.semanticVector, otherNode.semanticVector);

      const dx = otherPos.x - pos.x;
      const dy = otherPos.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // High similarity = attraction, low similarity = repulsion
        const idealDistance = 100 + (1 - similarity) * 200;
        const force = (distance - idealDistance) * similarity * 0.02;

        forceX += (dx / distance) * force;
        forceY += (dy / distance) * force;
      }
    });

    return { x: forceX, y: forceY };
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
  }

  /**
   * Render the semantic graph
   */
  private renderSemanticGraph(): void {
    if (!this.graphCanvas || !this.graphContext) return;

    const ctx = this.graphContext;
    const canvas = this.graphCanvas;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render edges
    this.renderEdges(ctx);

    // Render similarity edges if enabled
    if (this.semanticConfig.showSimilarityEdges) {
      this.renderSimilarityEdges(ctx);
    }

    // Render cluster centers if enabled
    if (this.semanticConfig.showClusters) {
      this.renderClusters(ctx);
    }

    // Render nodes
    this.renderNodes(ctx);

    // Render node labels
    this.renderNodeLabels(ctx);
  }

  /**
   * Render graph edges
   */
  private renderEdges(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.semanticConfig.edgeOpacity})`;
    ctx.lineWidth = 1;

    this.currentEdges.forEach(edge => {
      const sourcePos = this.nodePositions.get(edge.source);
      const targetPos = this.nodePositions.get(edge.target);

      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      }
    });
  }

  /**
   * Render similarity edges
   */
  private renderSimilarityEdges(ctx: CanvasRenderingContext2D): void {
    const similarityEdges = this.clusteringVisualizer?.getSimilarityEdges() || [];

    ctx.strokeStyle = 'rgba(0, 188, 242, 0.3)'; // Xbox Blue
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    similarityEdges.forEach(edge => {
      if (!edge.visible) return;

      const sourcePos = this.nodePositions.get(edge.source);
      const targetPos = this.nodePositions.get(edge.target);

      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);
  }

  /**
   * Render clusters
   */
  private renderClusters(ctx: CanvasRenderingContext2D): void {
    this.currentClusters.forEach(cluster => {
      if (cluster.nodes.length < 2) return;

      // Calculate cluster bounds
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;

      cluster.nodes.forEach(node => {
        const pos = this.nodePositions.get(node.id);
        if (pos) {
          minX = Math.min(minX, pos.x);
          maxX = Math.max(maxX, pos.x);
          minY = Math.min(minY, pos.y);
          maxY = Math.max(maxY, pos.y);
        }
      });

      if (minX !== Infinity) {
        const padding = 20;
        ctx.strokeStyle = cluster.color;
        ctx.fillStyle = cluster.color + '20';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);

        ctx.fillRect(minX - padding, minY - padding,
                    maxX - minX + padding * 2, maxY - minY + padding * 2);
        ctx.strokeRect(minX - padding, minY - padding,
                      maxX - minX + padding * 2, maxY - minY + padding * 2);

        ctx.setLineDash([]);
      }
    });
  }

  /**
   * Render graph nodes
   */
  private renderNodes(ctx: CanvasRenderingContext2D): void {
    this.currentNodes.forEach(node => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;

      const radius = this.semanticConfig.nodeSize;
      const isHovered = this.hoveredNode === node.id;
      const isSelected = this.selectedNode === node.id;

      // Node background
      ctx.fillStyle = this.getNodeColor(node);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius + (isHovered ? 2 : 0), 0, 2 * Math.PI);
      ctx.fill();

      // Node border
      if (isSelected || isHovered) {
        ctx.strokeStyle = isSelected ? '#ffb900' : '#ffffff';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      }

      // AI indicator for user-generated nodes
      if (node.category === 'user-generated') {
        ctx.fillStyle = '#ffb900';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AI', pos.x, pos.y - radius - 8);
      }
    });
  }

  /**
   * Get node color based on category and cluster
   */
  private getNodeColor(node: SemanticNode): string {
    // Check if node is in a cluster
    const cluster = this.currentClusters.find(c =>
      c.nodes.some(n => n.id === node.id)
    );

    if (cluster) {
      return cluster.color;
    }

    // Default category colors
    const categoryColors: Record<string, string> = {
      'core-ml': '#107c10',
      'applications': '#00bcf2',
      'foundations': '#ffb900',
      'tools': '#e81123',
      'semantic': '#9a0089',
      'user-generated': '#ff8c00'
    };

    return categoryColors[node.category] || '#6c757d';
  }

  /**
   * Render node labels
   */
  private renderNodeLabels(ctx: CanvasRenderingContext2D): void {
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';

    this.currentNodes.forEach(node => {
      const pos = this.nodePositions.get(node.id);
      if (!pos) return;

      const isVisible = this.hoveredNode === node.id ||
                       this.selectedNode === node.id ||
                       this.currentNodes.length <= 20;

      if (isVisible) {
        const label = node.concept.length > 15 ?
                     node.concept.substring(0, 12) + '...' :
                     node.concept;

        ctx.fillText(label, pos.x, pos.y + this.semanticConfig.nodeSize + 15);
      }
    });
  }

  /**
   * Handle canvas mouse events
   */
  private handleCanvasMouseMove(e: MouseEvent): void {
    if (!this.graphCanvas) return;

    const rect = this.graphCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find hovered node
    let hoveredNode: string | null = null;
    for (const node of this.currentNodes) {
      const pos = this.nodePositions.get(node.id);
      if (pos) {
        const dx = x - pos.x;
        const dy = y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= this.semanticConfig.nodeSize + 5) {
          hoveredNode = node.id;
          break;
        }
      }
    }

    this.hoveredNode = hoveredNode;
    this.graphCanvas.style.cursor = hoveredNode ? 'pointer' : 'grab';
  }

  private handleCanvasClick(e: MouseEvent): void {
    this.selectedNode = this.hoveredNode;
  }

  private handleCanvasMouseDown(e: MouseEvent): void {
    if (this.graphCanvas) {
      this.graphCanvas.style.cursor = 'grabbing';
    }
  }

  private handleCanvasMouseUp(e: MouseEvent): void {
    if (this.graphCanvas) {
      this.graphCanvas.style.cursor = this.hoveredNode ? 'pointer' : 'grab';
    }
  }

  /**
   * Event handlers for AI components
   */
  private addUserConcept(concept: SemanticNode): void {
    this.currentNodes.push(concept);

    // Initialize position near center with some randomness
    if (this.graphCanvas) {
      const centerX = this.graphCanvas.width / 4;
      const centerY = this.graphCanvas.height / 4;
      const x = centerX + (Math.random() - 0.5) * 100;
      const y = centerY + (Math.random() - 0.5) * 100;

      this.nodePositions.set(concept.id, { x, y });
      this.velocities.set(concept.id, { x: 0, y: 0 });

      concept.x = x;
      concept.y = y;
    }

    // Update components
    this.clusteringVisualizer?.updateNodes(this.currentNodes);
    this.updateVisualizationStats();

    this.updateAIStatus('active', `Added concept: ${concept.concept}`);
  }

  private onEmbeddingCalculated(concept: string, embedding: number[]): void {
    // Show brief AI processing indicator
    this.updateAIStatus('processing', `Calculating embedding for "${concept}"`);

    setTimeout(() => {
      this.updateAIStatus('active', 'Embedding calculated successfully');
    }, 300);
  }

  private onForceBalanceChange(structural: number, semantic: number): void {
    this.semanticConfig.forceBalance.structural = structural;
    this.semanticConfig.forceBalance.semantic = semantic;

    // Update force metrics
    if (this.forceBalancer) {
      const metrics: ForceMetrics = {
        structuralEnergy: this.calculateStructuralEnergy(),
        semanticEnergy: this.calculateSemanticEnergy(),
        totalEnergy: 0,
        convergence: this.calculateConvergence(),
        nodeMovement: this.calculateNodeMovement(),
        lastUpdate: Date.now()
      };
      metrics.totalEnergy = metrics.structuralEnergy + metrics.semanticEnergy;

      this.forceBalancer.updateMetrics(metrics);
    }
  }

  private onForcePresetSelect(preset: any): void {
    this.updateAIStatus('processing', `Applying ${preset.name} force preset`);

    setTimeout(() => {
      this.updateAIStatus('active', `Force preset applied: ${preset.name}`);
    }, 500);
  }

  private onClusteringThresholdChange(threshold: number): void {
    this.semanticConfig.clusteringThreshold = threshold;
  }

  private onClusteringMethodChange(method: string): void {
    this.updateAIStatus('processing', `Switching to ${method} clustering`);

    setTimeout(() => {
      this.updateAIStatus('active', `Clustering method: ${method}`);
    }, 300);
  }

  private onClusterUpdate(clusters: NodeCluster[]): void {
    this.currentClusters = clusters;
    this.updateVisualizationStats();
  }

  /**
   * Calculate physics metrics
   */
  private calculateStructuralEnergy(): number {
    let energy = 0;
    this.currentNodes.forEach(node => {
      const vel = this.velocities.get(node.id);
      if (vel) {
        energy += vel.x * vel.x + vel.y * vel.y;
      }
    });
    return energy * this.semanticConfig.forceBalance.structural;
  }

  private calculateSemanticEnergy(): number {
    let energy = 0;
    // Calculate energy based on semantic similarity alignment
    for (let i = 0; i < this.currentNodes.length; i++) {
      for (let j = i + 1; j < this.currentNodes.length; j++) {
        const node1 = this.currentNodes[i];
        const node2 = this.currentNodes[j];

        if (node1.semanticVector && node2.semanticVector) {
          const similarity = this.cosineSimilarity(node1.semanticVector, node2.semanticVector);
          const pos1 = this.nodePositions.get(node1.id);
          const pos2 = this.nodePositions.get(node2.id);

          if (pos1 && pos2) {
            const distance = Math.sqrt(
              (pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2
            );
            const idealDistance = 100 + (1 - similarity) * 200;
            energy += Math.abs(distance - idealDistance) * similarity;
          }
        }
      }
    }
    return energy * this.semanticConfig.forceBalance.semantic;
  }

  private calculateConvergence(): number {
    let totalVelocity = 0;
    this.currentNodes.forEach(node => {
      const vel = this.velocities.get(node.id);
      if (vel) {
        totalVelocity += Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      }
    });

    // Higher convergence = lower velocity
    const avgVelocity = this.currentNodes.length > 0 ? totalVelocity / this.currentNodes.length : 0;
    return Math.max(0, 1 - avgVelocity / 10);
  }

  private calculateNodeMovement(): number {
    let totalMovement = 0;
    this.currentNodes.forEach(node => {
      const vel = this.velocities.get(node.id);
      if (vel) {
        totalMovement += Math.sqrt(vel.x * vel.x + vel.y * vel.y);
      }
    });
    return this.currentNodes.length > 0 ? totalMovement / this.currentNodes.length : 0;
  }

  /**
   * Update AI status indicator
   */
  private updateAIStatus(status: 'active' | 'processing' | 'error', message: string): void {
    if (!this.aiStatusIndicator) return;

    const light = this.aiStatusIndicator.querySelector('.ai-status-light') as HTMLElement;
    const text = this.aiStatusIndicator.querySelector('.ai-status-text') as HTMLElement;

    if (light) {
      light.className = `ai-status-light ai-status-light--${status}`;
    }

    if (text) {
      text.textContent = message;
    }

    // Update mini status
    const miniStatus = this.container?.querySelector('#ai-status-mini') as HTMLElement;
    if (miniStatus) {
      miniStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
      miniStatus.style.color = status === 'active' ? '#107c10' :
                              status === 'processing' ? '#00bcf2' : '#e81123';
    }
  }

  /**
   * Update visualization statistics
   */
  private updateVisualizationStats(): void {
    const nodeCountElement = this.container?.querySelector('#node-count') as HTMLElement;
    const clusterCountElement = this.container?.querySelector('#cluster-count') as HTMLElement;

    if (nodeCountElement) {
      nodeCountElement.textContent = this.currentNodes.length.toString();
    }

    if (clusterCountElement) {
      clusterCountElement.textContent = this.currentClusters.length.toString();
    }
  }

  /**
   * Required abstract method implementations
   */
  protected async onRender(): Promise<void> {
    // Rendering is handled by animation loop
  }

  protected onCleanup(): void {
    this.isAnimating = false;
    this.conceptInput?.destroy();
    this.forceBalancer?.destroy();
    this.clusteringVisualizer?.destroy();
  }

  protected onConfigurationUpdate(config: Record<string, any>): void {
    // Update semantic configuration
    this.semanticConfig = { ...this.semanticConfig, ...config };

    // Update components if needed
    if (config.embeddingModel && this.conceptInput) {
      this.conceptInput.updateConfig({ embeddingModel: config.embeddingModel });
    }
  }

  protected getDefaultConfiguration(): Record<string, any> {
    return this.getDefaultSemanticConfiguration();
  }

  public getConfigurationOptions(): ConfigOption[] {
    return [
      {
        id: 'dataset',
        label: 'Dataset',
        type: 'select',
        value: this.semanticConfig.dataset,
        options: [
          { value: 'research-papers', label: 'Research Papers' },
          { value: 'technology-stack', label: 'Technology Stack' },
          { value: 'scientific-concepts', label: 'Scientific Concepts' }
        ],
        description: 'Select the concept network dataset to visualize'
      },
      {
        id: 'embeddingModel',
        label: 'Embedding Model',
        type: 'select',
        value: this.semanticConfig.embeddingModel,
        options: [
          { value: 'simple', label: 'Simple Text Similarity' },
          { value: 'tfidf', label: 'TF-IDF Vectors' },
          { value: 'semantic', label: 'Semantic Embeddings' }
        ],
        description: 'Choose the AI model for generating concept embeddings'
      },
      {
        id: 'clusteringThreshold',
        label: 'Clustering Threshold',
        type: 'slider',
        value: this.semanticConfig.clusteringThreshold,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Minimum similarity required for concepts to cluster together'
      },
      {
        id: 'showClusters',
        label: 'Show Clusters',
        type: 'toggle',
        value: this.semanticConfig.showClusters,
        description: 'Display cluster boundaries around related concepts'
      },
      {
        id: 'showSimilarityEdges',
        label: 'Show Similarity Edges',
        type: 'toggle',
        value: this.semanticConfig.showSimilarityEdges,
        description: 'Display edges between semantically similar concepts'
      },
      {
        id: 'animationSpeed',
        label: 'Animation Speed',
        type: 'slider',
        value: this.semanticConfig.animationSpeed,
        min: 0.1,
        max: 3.0,
        step: 0.1,
        description: 'Speed of the physics animation'
      }
    ];
  }

  public getCodeExamples(): CodeExample[] {
    return [
      {
        id: 'semantic-setup',
        title: 'Semantic AI Setup',
        description: 'Initialize knowledge-network with AI-powered semantic clustering',
        language: 'typescript',
        category: 'setup',
        code: `import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

// Initialize with semantic AI capabilities
const graph = new KnowledgeGraph({
  container: '#graph-container',

  // Enable semantic clustering
  semanticClustering: {
    enabled: true,
    embeddingModel: 'semantic',
    similarityThreshold: 0.6,
    clusteringMethod: 'hierarchical'
  },

  // Hybrid force system
  forces: {
    structural: { weight: 0.5 },
    semantic: { weight: 0.5 }
  },

  // AI-powered edge bundling
  edgeRenderer: {
    type: 'semantic-bundling',
    compatibilityFunction: 'embedding-based'
  }
});

// Add concepts with automatic embedding
graph.addNode({
  id: 'ml',
  concept: 'Machine Learning',
  category: 'ai',
  generateEmbedding: true
});`
      },
      {
        id: 'embedding-generation',
        title: 'Real-time Embedding Generation',
        description: 'Generate embeddings for concepts and update graph layout',
        language: 'typescript',
        category: 'algorithm',
        code: `// Generate embedding for new concept
const concept = 'Natural Language Processing';
const embedding = await graph.generateEmbedding(concept, {
  model: 'semantic',
  dimensions: 128
});

// Add concept with embedding
const node = {
  id: 'nlp',
  concept: concept,
  semanticVector: embedding,
  category: 'ai-applications'
};

graph.addNode(node);

// Update layout with semantic positioning
graph.updateLayout({
  useSemanticForces: true,
  semanticWeight: 0.7,
  structuralWeight: 0.3
});

// Listen for clustering updates
graph.on('clustersUpdated', (clusters) => {
  console.log('New semantic clusters:', clusters);
});`
      },
      {
        id: 'force-balancing',
        title: 'Hybrid Force System',
        description: 'Balance between structural and semantic forces in real-time',
        language: 'typescript',
        category: 'optimization',
        code: `// Create force balancer
const forceBalancer = new ForceBalancer({
  onForceChange: (structural, semantic) => {
    graph.updateForces({
      structural: { weight: structural },
      semantic: { weight: semantic }
    });
  }
});

// Apply preset configurations
forceBalancer.applyPreset('semantic-focused', {
  structural: 0.3,
  semantic: 0.7,
  description: 'Emphasize conceptual relationships'
});

// Real-time metrics
setInterval(() => {
  const metrics = graph.getForceMetrics();
  forceBalancer.updateMetrics({
    structuralEnergy: metrics.structural,
    semanticEnergy: metrics.semantic,
    convergence: metrics.convergence
  });
}, 1000);`
      },
      {
        id: 'clustering-analysis',
        title: 'Dynamic Clustering Analysis',
        description: 'Analyze and visualize semantic clusters with adjustable thresholds',
        language: 'typescript',
        category: 'interaction',
        code: `// Initialize clustering visualizer
const clusteringViz = new ClusteringVisualizer({
  similarityThreshold: 0.6,
  clusteringMethod: 'hierarchical',

  onThresholdChange: (threshold) => {
    // Recalculate clusters with new threshold
    const clusters = graph.recalculateClusters({
      threshold,
      method: 'semantic-similarity'
    });

    // Update visualization
    updateClusterDisplay(clusters);
  },

  onClusterUpdate: (clusters) => {
    // Analyze cluster quality
    const metrics = analyzeClusterQuality(clusters);
    console.log('Cluster metrics:', metrics);

    // Update graph colors
    graph.colorNodesByCluster(clusters);
  }
});

// Generate similarity matrix
const nodes = graph.getNodes();
const similarityMatrix = graph.calculateSimilarityMatrix(nodes);
clusteringViz.updateSimilarityMatrix(similarityMatrix);`
      }
    ];
  }
}