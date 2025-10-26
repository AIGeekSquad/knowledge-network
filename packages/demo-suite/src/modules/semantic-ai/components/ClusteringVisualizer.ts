/**
 * ClusteringVisualizer Component - Interactive Clustering Threshold Controls
 *
 * Component that allows users to adjust semantic similarity thresholds in real-time,
 * visualizing how concepts cluster based on AI-generated embeddings. Demonstrates
 * dynamic clustering capabilities unique to the knowledge-network library.
 */

import type { SemanticNode } from '../data/semantic-datasets.js';

export interface ClusteringConfig {
  similarityThreshold: number; // 0-1, minimum similarity for clustering
  clusteringMethod: 'hierarchical' | 'kmeans' | 'dbscan';
  showClusterCenters: boolean;
  showSimilarityEdges: boolean;
  maxClusters: number;
  onThresholdChange: (threshold: number) => void;
  onMethodChange: (method: string) => void;
  onClusterUpdate: (clusters: NodeCluster[]) => void;
}

export interface NodeCluster {
  id: string;
  center: { x: number, y: number };
  nodes: SemanticNode[];
  color: string;
  similarity: number;
  keywords: string[];
}

export interface SimilarityEdge {
  source: string;
  target: string;
  similarity: number;
  visible: boolean;
}

export interface ClusteringMetrics {
  clusterCount: number;
  averageClusterSize: number;
  silhouetteScore: number;
  cohesion: number;
  separation: number;
  totalSimilarityEdges: number;
}

/**
 * ClusteringVisualizer - Interactive semantic clustering controls
 */
export class ClusteringVisualizer {
  private container: HTMLElement;
  private config: ClusteringConfig;
  private thresholdSlider: HTMLInputElement;
  private methodSelect: HTMLSelectElement;
  private clusterDisplay: HTMLElement;
  private metricsDisplay: HTMLElement;
  private similarityMatrix: HTMLElement;

  private currentClusters: NodeCluster[] = [];
  private currentNodes: SemanticNode[] = [];
  private similarityEdges: SimilarityEdge[] = [];
  private clusterColors: string[] = [
    '#107c10', '#00bcf2', '#ffb900', '#e81123', '#ff8c00',
    '#9a0089', '#00bcae', '#8764b8', '#00cc6a', '#ffc83d'
  ];

  constructor(container: HTMLElement, config: ClusteringConfig) {
    this.container = container;
    this.config = config;

    this.createElement();
    this.bindEvents();
  }

  /**
   * Create the clustering visualizer UI with Xbox styling
   */
  private createElement(): void {
    this.container.innerHTML = `
      <div class="clustering-visualizer-panel">
        <div class="clustering-visualizer-header">
          <h3 class="clustering-visualizer-title">
            🎯 Semantic Clustering
          </h3>
          <div class="clustering-visualizer-subtitle">
            Adjust similarity thresholds to see AI-driven concept clustering
          </div>
        </div>

        <div class="clustering-controls">
          <div class="clustering-threshold-control">
            <label class="clustering-threshold-label">
              <span class="clustering-threshold-title">Similarity Threshold</span>
              <span class="clustering-threshold-value" id="threshold-value">${(this.config.similarityThreshold * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              class="clustering-threshold-slider"
              id="threshold-slider"
              min="0"
              max="100"
              value="${this.config.similarityThreshold * 100}"
              step="1"
            />
            <div class="clustering-threshold-markers">
              <span class="threshold-marker threshold-marker--loose">Loose</span>
              <span class="threshold-marker threshold-marker--balanced">Balanced</span>
              <span class="threshold-marker threshold-marker--strict">Strict</span>
            </div>
          </div>

          <div class="clustering-method-control">
            <label class="clustering-method-label">Clustering Method:</label>
            <select class="clustering-method-select ui-select" id="method-select">
              <option value="hierarchical" ${this.config.clusteringMethod === 'hierarchical' ? 'selected' : ''}>
                🌲 Hierarchical
              </option>
              <option value="kmeans" ${this.config.clusteringMethod === 'kmeans' ? 'selected' : ''}>
                🎯 K-Means
              </option>
              <option value="dbscan" ${this.config.clusteringMethod === 'dbscan' ? 'selected' : ''}>
                🔍 DBSCAN
              </option>
            </select>
          </div>

          <div class="clustering-options">
            <label class="clustering-option ui-toggle-container">
              <input type="checkbox" class="ui-toggle" id="show-centers" ${this.config.showClusterCenters ? 'checked' : ''} />
              <span class="ui-toggle__label">Show Cluster Centers</span>
            </label>
            <label class="clustering-option ui-toggle-container">
              <input type="checkbox" class="ui-toggle" id="show-similarity" ${this.config.showSimilarityEdges ? 'checked' : ''} />
              <span class="ui-toggle__label">Show Similarity Edges</span>
            </label>
          </div>
        </div>

        <div class="clustering-visualization">
          <div class="cluster-display" id="cluster-display">
            <div class="cluster-display-header">
              <h4 class="cluster-display-title">🏷️ Active Clusters</h4>
              <span class="cluster-count" id="cluster-count">0 clusters</span>
            </div>
            <div class="cluster-list" id="cluster-list">
              <div class="no-clusters-message">
                Adjust similarity threshold to generate clusters
              </div>
            </div>
          </div>

          <div class="clustering-metrics" id="clustering-metrics">
            <div class="clustering-metrics-header">
              <h4 class="clustering-metrics-title">📊 Clustering Quality</h4>
            </div>
            <div class="clustering-metrics-grid">
              <div class="clustering-metric">
                <span class="clustering-metric-label">Clusters</span>
                <span class="clustering-metric-value" id="metric-clusters">-</span>
              </div>
              <div class="clustering-metric">
                <span class="clustering-metric-label">Avg Size</span>
                <span class="clustering-metric-value" id="metric-size">-</span>
              </div>
              <div class="clustering-metric">
                <span class="clustering-metric-label">Cohesion</span>
                <span class="clustering-metric-value" id="metric-cohesion">-</span>
              </div>
              <div class="clustering-metric">
                <span class="clustering-metric-label">Separation</span>
                <span class="clustering-metric-value" id="metric-separation">-</span>
              </div>
              <div class="clustering-metric">
                <span class="clustering-metric-label">Quality Score</span>
                <span class="clustering-metric-value" id="metric-quality">-</span>
              </div>
            </div>
          </div>
        </div>

        <div class="similarity-matrix-panel" id="similarity-matrix">
          <div class="similarity-matrix-header">
            <h4 class="similarity-matrix-title">🔢 Similarity Matrix</h4>
            <button class="similarity-matrix-toggle ui-button ui-button--secondary" id="matrix-toggle">
              Show Matrix
            </button>
          </div>
          <div class="similarity-matrix-content hidden" id="matrix-content">
            <div class="similarity-matrix-grid" id="matrix-grid"></div>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.thresholdSlider = this.container.querySelector('#threshold-slider') as HTMLInputElement;
    this.methodSelect = this.container.querySelector('#method-select') as HTMLSelectElement;
    this.clusterDisplay = this.container.querySelector('#cluster-display') as HTMLElement;
    this.metricsDisplay = this.container.querySelector('#clustering-metrics') as HTMLElement;
    this.similarityMatrix = this.container.querySelector('#similarity-matrix') as HTMLElement;

    // Add Xbox styling
    this.addXboxStyling();
  }

  /**
   * Add Xbox-themed styling for clustering controls
   */
  private addXboxStyling(): void {
    const styles = `
      <style>
      .clustering-visualizer-panel {
        background: linear-gradient(135deg, var(--color-gray-800) 0%, var(--color-gray-700) 100%);
        border: 2px solid var(--color-secondary); /* Xbox Blue */
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-4);
        box-shadow: 0 0 20px rgba(0, 188, 242, 0.2); /* Xbox Blue glow */
        position: relative;
        overflow: hidden;
      }

      .clustering-visualizer-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--color-secondary), var(--color-accent), var(--color-primary));
        animation: clustering-pulse 2.5s ease-in-out infinite;
      }

      @keyframes clustering-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .clustering-visualizer-header {
        text-align: center;
        margin-bottom: var(--space-6);
      }

      .clustering-visualizer-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-secondary); /* Xbox Blue */
        margin-bottom: var(--space-2);
        text-shadow: 0 0 10px rgba(0, 188, 242, 0.5);
      }

      .clustering-visualizer-subtitle {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .clustering-controls {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
        padding: var(--space-4);
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-base);
      }

      .clustering-threshold-control {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .clustering-threshold-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .clustering-threshold-title {
        color: var(--color-text-primary);
      }

      .clustering-threshold-value {
        color: var(--color-secondary); /* Xbox Blue */
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-bold);
      }

      .clustering-threshold-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 8px;
        background: linear-gradient(90deg, var(--color-gray-600), var(--color-secondary));
        border-radius: var(--radius-full);
        outline: none;
        cursor: pointer;
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .clustering-threshold-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--color-secondary);
        border: 3px solid var(--color-white);
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 188, 242, 0.6);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .clustering-threshold-slider:hover::-webkit-slider-thumb {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(0, 188, 242, 0.8);
      }

      .clustering-threshold-markers {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--space-1);
        padding: 0 var(--space-2);
      }

      .threshold-marker {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        font-weight: var(--font-weight-medium);
      }

      .threshold-marker--loose { color: #ff6b6b; }
      .threshold-marker--balanced { color: var(--color-accent); }
      .threshold-marker--strict { color: #4ecdc4; }

      .clustering-method-control {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .clustering-method-label {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
        white-space: nowrap;
      }

      .clustering-method-select {
        background: var(--color-gray-800);
        border: 1px solid var(--color-gray-600);
        color: var(--color-text-primary);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-base);
        font-size: var(--font-size-sm);
      }

      .clustering-options {
        display: flex;
        gap: var(--space-4);
        flex-wrap: wrap;
      }

      .clustering-option {
        margin-bottom: 0;
      }

      .clustering-visualization {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
        margin-bottom: var(--space-6);
      }

      .cluster-display {
        background: rgba(0, 188, 242, 0.1);
        border: 1px solid var(--color-secondary);
        border-radius: var(--radius-base);
        overflow: hidden;
      }

      .cluster-display-header {
        background: linear-gradient(90deg, var(--color-secondary), #0099cc);
        padding: var(--space-3);
        color: var(--color-white);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cluster-display-title {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        margin: 0;
      }

      .cluster-count {
        font-size: var(--font-size-xs);
        opacity: 0.9;
        font-family: var(--font-family-mono);
      }

      .cluster-list {
        max-height: 300px;
        overflow-y: auto;
        padding: var(--space-3);
      }

      .no-clusters-message {
        text-align: center;
        color: var(--color-text-muted);
        font-style: italic;
        padding: var(--space-4);
      }

      .cluster-item {
        background: var(--color-gray-800);
        border-radius: var(--radius-base);
        margin-bottom: var(--space-3);
        overflow: hidden;
        border: 1px solid var(--color-gray-600);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .cluster-item:hover {
        border-color: var(--color-secondary);
        box-shadow: 0 0 10px rgba(0, 188, 242, 0.3);
      }

      .cluster-item:last-child {
        margin-bottom: 0;
      }

      .cluster-header {
        padding: var(--space-2) var(--space-3);
        background: rgba(0, 188, 242, 0.1);
        border-bottom: 1px solid var(--color-gray-600);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .cluster-name {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }

      .cluster-size {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        font-family: var(--font-family-mono);
      }

      .cluster-nodes {
        padding: var(--space-2);
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }

      .cluster-node {
        background: var(--color-gray-700);
        color: var(--color-text-secondary);
        font-size: var(--font-size-xs);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-base);
        border: 1px solid var(--color-gray-600);
      }

      .cluster-keywords {
        padding: var(--space-2) var(--space-3);
        border-top: 1px solid var(--color-gray-700);
        background: rgba(0, 0, 0, 0.2);
      }

      .cluster-keywords-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        margin-bottom: var(--space-1);
      }

      .cluster-keywords-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-1);
      }

      .cluster-keyword {
        background: var(--color-secondary);
        color: var(--color-white);
        font-size: var(--font-size-xs);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-base);
        font-weight: var(--font-weight-medium);
      }

      .clustering-metrics {
        background: rgba(16, 124, 16, 0.1);
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-base);
        overflow: hidden;
      }

      .clustering-metrics-header {
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
        padding: var(--space-3);
        color: var(--color-white);
      }

      .clustering-metrics-title {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        margin: 0;
      }

      .clustering-metrics-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--space-2);
        padding: var(--space-3);
      }

      .clustering-metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-2);
        background: rgba(16, 124, 16, 0.1);
        border-radius: var(--radius-base);
        border: 1px solid rgba(16, 124, 16, 0.3);
      }

      .clustering-metric-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        font-weight: var(--font-weight-medium);
      }

      .clustering-metric-value {
        font-size: var(--font-size-sm);
        color: var(--color-primary);
        font-family: var(--font-family-mono);
        font-weight: var(--font-weight-bold);
      }

      .similarity-matrix-panel {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid var(--color-gray-600);
        border-radius: var(--radius-base);
        overflow: hidden;
      }

      .similarity-matrix-header {
        padding: var(--space-3);
        background: var(--color-gray-800);
        border-bottom: 1px solid var(--color-gray-600);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .similarity-matrix-title {
        font-size: var(--font-size-base);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        margin: 0;
      }

      .similarity-matrix-toggle {
        font-size: var(--font-size-xs);
        padding: var(--space-1) var(--space-3);
      }

      .similarity-matrix-content {
        padding: var(--space-3);
        max-height: 400px;
        overflow: auto;
      }

      .similarity-matrix-grid {
        display: grid;
        gap: 1px;
        font-family: var(--font-family-mono);
        font-size: var(--font-size-xs);
      }

      .matrix-cell {
        background: var(--color-gray-700);
        padding: var(--space-1);
        text-align: center;
        border-radius: var(--radius-sm);
        min-width: 40px;
        min-height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .matrix-cell--header {
        background: var(--color-gray-600);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
      }

      .matrix-cell--high {
        background: var(--color-primary);
        color: var(--color-white);
      }

      .matrix-cell--medium {
        background: var(--color-accent);
        color: var(--color-gray-900);
      }

      .matrix-cell--low {
        background: var(--color-gray-600);
        color: var(--color-text-muted);
      }

      .hidden {
        display: none !important;
      }

      @media (max-width: 768px) {
        .clustering-visualization {
          grid-template-columns: 1fr;
        }

        .clustering-options {
          flex-direction: column;
          gap: var(--space-2);
        }
      }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Bind event handlers for clustering controls
   */
  private bindEvents(): void {
    // Threshold slider
    this.thresholdSlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value) / 100;
      this.config.similarityThreshold = value;

      this.updateThresholdDisplay();
      this.recalculateClusters();
      this.config.onThresholdChange(value);
    });

    // Method selector
    this.methodSelect.addEventListener('change', (e) => {
      const method = (e.target as HTMLSelectElement).value as 'hierarchical' | 'kmeans' | 'dbscan';
      this.config.clusteringMethod = method;

      this.recalculateClusters();
      this.config.onMethodChange(method);
    });

    // Toggle controls
    const showCentersToggle = this.container.querySelector('#show-centers') as HTMLInputElement;
    showCentersToggle.addEventListener('change', (e) => {
      this.config.showClusterCenters = (e.target as HTMLInputElement).checked;
    });

    const showSimilarityToggle = this.container.querySelector('#show-similarity') as HTMLInputElement;
    showSimilarityToggle.addEventListener('change', (e) => {
      this.config.showSimilarityEdges = (e.target as HTMLInputElement).checked;
      this.updateSimilarityEdges();
    });

    // Matrix toggle
    const matrixToggle = this.container.querySelector('#matrix-toggle') as HTMLButtonElement;
    const matrixContent = this.container.querySelector('#matrix-content') as HTMLElement;
    matrixToggle.addEventListener('click', () => {
      const isHidden = matrixContent.classList.contains('hidden');
      if (isHidden) {
        matrixContent.classList.remove('hidden');
        matrixToggle.textContent = 'Hide Matrix';
        this.updateSimilarityMatrix();
      } else {
        matrixContent.classList.add('hidden');
        matrixToggle.textContent = 'Show Matrix';
      }
    });
  }

  /**
   * Update nodes for clustering analysis
   */
  public updateNodes(nodes: SemanticNode[]): void {
    this.currentNodes = nodes;
    this.recalculateClusters();
    this.updateSimilarityMatrix();
  }

  /**
   * Recalculate clusters based on current settings
   */
  private recalculateClusters(): void {
    if (this.currentNodes.length === 0) {
      this.currentClusters = [];
      this.updateClusterDisplay();
      this.updateMetricsDisplay();
      return;
    }

    // Calculate pairwise similarities
    const similarities = this.calculateSimilarities();

    // Apply clustering algorithm
    switch (this.config.clusteringMethod) {
      case 'hierarchical':
        this.currentClusters = this.performHierarchicalClustering(similarities);
        break;
      case 'kmeans':
        this.currentClusters = this.performKMeansClustering();
        break;
      case 'dbscan':
        this.currentClusters = this.performDBSCANClustering(similarities);
        break;
    }

    this.updateClusterDisplay();
    this.updateMetricsDisplay();
    this.updateSimilarityEdges();
    this.config.onClusterUpdate(this.currentClusters);
  }

  /**
   * Calculate similarity matrix between all nodes
   */
  private calculateSimilarities(): number[][] {
    const n = this.currentNodes.length;
    const similarities = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          similarities[i][j] = 1.0;
        } else {
          similarities[i][j] = this.calculateNodeSimilarity(this.currentNodes[i], this.currentNodes[j]);
        }
      }
    }

    return similarities;
  }

  /**
   * Calculate similarity between two nodes
   */
  private calculateNodeSimilarity(node1: SemanticNode, node2: SemanticNode): number {
    // Use embedding vectors if available
    if (node1.semanticVector && node2.semanticVector) {
      return this.cosineSimilarity(node1.semanticVector, node2.semanticVector);
    }

    // Fallback to text-based similarity
    let similarity = 0;

    // Concept name similarity
    similarity += this.textSimilarity(node1.concept, node2.concept) * 0.4;

    // Category similarity
    if (node1.category === node2.category) {
      similarity += 0.3;
    }

    // Tag overlap
    const commonTags = node1.tags.filter(tag => node2.tags.includes(tag));
    similarity += (commonTags.length / Math.max(node1.tags.length, node2.tags.length)) * 0.3;

    return Math.min(1.0, similarity);
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
   * Calculate text similarity using Jaccard index
   */
  private textSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Perform hierarchical clustering
   */
  private performHierarchicalClustering(similarities: number[][]): NodeCluster[] {
    const clusters: NodeCluster[] = [];
    const n = this.currentNodes.length;
    const used = new Array(n).fill(false);

    for (let i = 0; i < n; i++) {
      if (used[i]) continue;

      const cluster: NodeCluster = {
        id: `cluster-${clusters.length}`,
        center: { x: 0, y: 0 },
        nodes: [this.currentNodes[i]],
        color: this.clusterColors[clusters.length % this.clusterColors.length],
        similarity: 1.0,
        keywords: []
      };

      used[i] = true;

      // Find similar nodes
      for (let j = i + 1; j < n; j++) {
        if (used[j]) continue;

        if (similarities[i][j] >= this.config.similarityThreshold) {
          cluster.nodes.push(this.currentNodes[j]);
          used[j] = true;
        }
      }

      // Calculate cluster properties
      this.calculateClusterProperties(cluster);
      clusters.push(cluster);
    }

    return clusters;
  }

  /**
   * Perform K-means clustering (simplified)
   */
  private performKMeansClustering(): NodeCluster[] {
    const k = Math.min(this.config.maxClusters, Math.ceil(this.currentNodes.length / 3));
    const clusters: NodeCluster[] = [];

    // Initialize clusters randomly
    for (let i = 0; i < k; i++) {
      clusters.push({
        id: `cluster-${i}`,
        center: { x: 0, y: 0 },
        nodes: [],
        color: this.clusterColors[i % this.clusterColors.length],
        similarity: 0,
        keywords: []
      });
    }

    // Simple assignment based on node index (simplified k-means)
    this.currentNodes.forEach((node, index) => {
      const clusterIndex = index % k;
      clusters[clusterIndex].nodes.push(node);
    });

    // Calculate cluster properties
    clusters.forEach(cluster => this.calculateClusterProperties(cluster));

    return clusters.filter(cluster => cluster.nodes.length > 0);
  }

  /**
   * Perform DBSCAN clustering (simplified)
   */
  private performDBSCANClustering(similarities: number[][]): NodeCluster[] {
    const clusters: NodeCluster[] = [];
    const n = this.currentNodes.length;
    const visited = new Array(n).fill(false);
    const clustered = new Array(n).fill(false);
    const minPoints = 2;

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      visited[i] = true;

      // Find neighbors
      const neighbors = [];
      for (let j = 0; j < n; j++) {
        if (similarities[i][j] >= this.config.similarityThreshold) {
          neighbors.push(j);
        }
      }

      if (neighbors.length >= minPoints) {
        // Create new cluster
        const cluster: NodeCluster = {
          id: `cluster-${clusters.length}`,
          center: { x: 0, y: 0 },
          nodes: [],
          color: this.clusterColors[clusters.length % this.clusterColors.length],
          similarity: 0,
          keywords: []
        };

        const queue = [...neighbors];
        while (queue.length > 0) {
          const current = queue.shift()!;
          if (!clustered[current]) {
            cluster.nodes.push(this.currentNodes[current]);
            clustered[current] = true;
          }

          if (!visited[current]) {
            visited[current] = true;
            const currentNeighbors = [];
            for (let k = 0; k < n; k++) {
              if (similarities[current][k] >= this.config.similarityThreshold) {
                currentNeighbors.push(k);
              }
            }

            if (currentNeighbors.length >= minPoints) {
              queue.push(...currentNeighbors);
            }
          }
        }

        this.calculateClusterProperties(cluster);
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  /**
   * Calculate cluster center and keywords
   */
  private calculateClusterProperties(cluster: NodeCluster): void {
    if (cluster.nodes.length === 0) return;

    // Calculate center position
    let totalX = 0;
    let totalY = 0;
    cluster.nodes.forEach(node => {
      totalX += node.x || 0;
      totalY += node.y || 0;
    });
    cluster.center = {
      x: totalX / cluster.nodes.length,
      y: totalY / cluster.nodes.length
    };

    // Extract keywords from cluster nodes
    const allTags = cluster.nodes.flatMap(node => node.tags);
    const tagCounts = new Map<string, number>();
    allTags.forEach(tag => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });

    cluster.keywords = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Calculate average similarity within cluster
    let totalSimilarity = 0;
    let comparisons = 0;
    for (let i = 0; i < cluster.nodes.length; i++) {
      for (let j = i + 1; j < cluster.nodes.length; j++) {
        totalSimilarity += this.calculateNodeSimilarity(cluster.nodes[i], cluster.nodes[j]);
        comparisons++;
      }
    }
    cluster.similarity = comparisons > 0 ? totalSimilarity / comparisons : 1.0;
  }

  /**
   * Update threshold display
   */
  private updateThresholdDisplay(): void {
    const thresholdValue = this.container.querySelector('#threshold-value') as HTMLElement;
    thresholdValue.textContent = `${(this.config.similarityThreshold * 100).toFixed(0)}%`;
  }

  /**
   * Update cluster display
   */
  private updateClusterDisplay(): void {
    const clusterList = this.container.querySelector('#cluster-list') as HTMLElement;
    const clusterCount = this.container.querySelector('#cluster-count') as HTMLElement;

    clusterCount.textContent = `${this.currentClusters.length} clusters`;

    if (this.currentClusters.length === 0) {
      clusterList.innerHTML = `
        <div class="no-clusters-message">
          Adjust similarity threshold to generate clusters
        </div>
      `;
      return;
    }

    clusterList.innerHTML = this.currentClusters.map((cluster, index) => `
      <div class="cluster-item">
        <div class="cluster-header">
          <span class="cluster-name" style="color: ${cluster.color}">
            🏷️ Cluster ${index + 1}
          </span>
          <span class="cluster-size">${cluster.nodes.length} nodes</span>
        </div>
        <div class="cluster-nodes">
          ${cluster.nodes.slice(0, 10).map(node => `
            <span class="cluster-node">${node.concept}</span>
          `).join('')}
          ${cluster.nodes.length > 10 ? `<span class="cluster-node">+${cluster.nodes.length - 10} more</span>` : ''}
        </div>
        ${cluster.keywords.length > 0 ? `
          <div class="cluster-keywords">
            <div class="cluster-keywords-label">Keywords:</div>
            <div class="cluster-keywords-list">
              ${cluster.keywords.map(keyword => `
                <span class="cluster-keyword">${keyword}</span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  /**
   * Update metrics display
   */
  private updateMetricsDisplay(): void {
    const metrics = this.calculateClusteringMetrics();

    const elements = {
      clusters: this.metricsDisplay.querySelector('#metric-clusters') as HTMLElement,
      size: this.metricsDisplay.querySelector('#metric-size') as HTMLElement,
      cohesion: this.metricsDisplay.querySelector('#metric-cohesion') as HTMLElement,
      separation: this.metricsDisplay.querySelector('#metric-separation') as HTMLElement,
      quality: this.metricsDisplay.querySelector('#metric-quality') as HTMLElement
    };

    if (elements.clusters) elements.clusters.textContent = metrics.clusterCount.toString();
    if (elements.size) elements.size.textContent = metrics.averageClusterSize.toFixed(1);
    if (elements.cohesion) elements.cohesion.textContent = `${(metrics.cohesion * 100).toFixed(1)}%`;
    if (elements.separation) elements.separation.textContent = `${(metrics.separation * 100).toFixed(1)}%`;
    if (elements.quality) elements.quality.textContent = `${(metrics.silhouetteScore * 100).toFixed(1)}%`;
  }

  /**
   * Calculate clustering quality metrics
   */
  private calculateClusteringMetrics(): ClusteringMetrics {
    if (this.currentClusters.length === 0 || this.currentNodes.length === 0) {
      return {
        clusterCount: 0,
        averageClusterSize: 0,
        silhouetteScore: 0,
        cohesion: 0,
        separation: 0,
        totalSimilarityEdges: 0
      };
    }

    const clusterCount = this.currentClusters.length;
    const averageClusterSize = this.currentNodes.length / clusterCount;

    // Calculate cohesion (average intra-cluster similarity)
    let totalCohesion = 0;
    this.currentClusters.forEach(cluster => {
      totalCohesion += cluster.similarity;
    });
    const cohesion = clusterCount > 0 ? totalCohesion / clusterCount : 0;

    // Calculate separation (average inter-cluster dissimilarity)
    let totalSeparation = 0;
    let separationCount = 0;
    for (let i = 0; i < this.currentClusters.length; i++) {
      for (let j = i + 1; j < this.currentClusters.length; j++) {
        const cluster1 = this.currentClusters[i];
        const cluster2 = this.currentClusters[j];

        // Average similarity between clusters
        let interClusterSimilarity = 0;
        let comparisons = 0;
        cluster1.nodes.forEach(node1 => {
          cluster2.nodes.forEach(node2 => {
            interClusterSimilarity += this.calculateNodeSimilarity(node1, node2);
            comparisons++;
          });
        });

        if (comparisons > 0) {
          totalSeparation += 1 - (interClusterSimilarity / comparisons);
          separationCount++;
        }
      }
    }
    const separation = separationCount > 0 ? totalSeparation / separationCount : 1;

    // Simplified silhouette score
    const silhouetteScore = (cohesion + separation) / 2;

    return {
      clusterCount,
      averageClusterSize,
      silhouetteScore,
      cohesion,
      separation,
      totalSimilarityEdges: this.similarityEdges.length
    };
  }

  /**
   * Update similarity edges visibility
   */
  private updateSimilarityEdges(): void {
    this.similarityEdges = [];

    if (!this.config.showSimilarityEdges) return;

    // Generate edges between nodes above threshold
    for (let i = 0; i < this.currentNodes.length; i++) {
      for (let j = i + 1; j < this.currentNodes.length; j++) {
        const similarity = this.calculateNodeSimilarity(this.currentNodes[i], this.currentNodes[j]);
        if (similarity >= this.config.similarityThreshold) {
          this.similarityEdges.push({
            source: this.currentNodes[i].id,
            target: this.currentNodes[j].id,
            similarity,
            visible: true
          });
        }
      }
    }
  }

  /**
   * Update similarity matrix display
   */
  private updateSimilarityMatrix(): void {
    const matrixGrid = this.container.querySelector('#matrix-grid') as HTMLElement;

    if (this.currentNodes.length === 0 || this.currentNodes.length > 10) {
      matrixGrid.innerHTML = `
        <div style="text-align: center; padding: var(--space-4); color: var(--color-text-muted);">
          ${this.currentNodes.length === 0 ?
            'No nodes to display' :
            'Matrix hidden for large datasets (>10 nodes)'}
        </div>
      `;
      return;
    }

    const similarities = this.calculateSimilarities();
    const n = this.currentNodes.length;

    matrixGrid.style.gridTemplateColumns = `100px repeat(${n}, 1fr)`;

    let html = '<div class="matrix-cell matrix-cell--header"></div>';

    // Column headers
    for (let i = 0; i < n; i++) {
      const shortName = this.currentNodes[i].concept.substring(0, 8) + (this.currentNodes[i].concept.length > 8 ? '...' : '');
      html += `<div class="matrix-cell matrix-cell--header">${shortName}</div>`;
    }

    // Matrix rows
    for (let i = 0; i < n; i++) {
      // Row header
      const shortName = this.currentNodes[i].concept.substring(0, 10) + (this.currentNodes[i].concept.length > 10 ? '...' : '');
      html += `<div class="matrix-cell matrix-cell--header">${shortName}</div>`;

      // Similarity values
      for (let j = 0; j < n; j++) {
        const similarity = similarities[i][j];
        const value = (similarity * 100).toFixed(0);
        let cellClass = 'matrix-cell';

        if (similarity >= 0.7) cellClass += ' matrix-cell--high';
        else if (similarity >= 0.4) cellClass += ' matrix-cell--medium';
        else cellClass += ' matrix-cell--low';

        html += `<div class="${cellClass}" title="${this.currentNodes[i].concept} ↔ ${this.currentNodes[j].concept}: ${value}%">${value}</div>`;
      }
    }

    matrixGrid.innerHTML = html;
  }

  /**
   * Get current clusters
   */
  public getClusters(): NodeCluster[] {
    return [...this.currentClusters];
  }

  /**
   * Get similarity edges for visualization
   */
  public getSimilarityEdges(): SimilarityEdge[] {
    return [...this.similarityEdges];
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ClusteringConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.similarityThreshold !== undefined) {
      this.thresholdSlider.value = (newConfig.similarityThreshold * 100).toString();
      this.updateThresholdDisplay();
    }

    if (newConfig.clusteringMethod !== undefined) {
      this.methodSelect.value = newConfig.clusteringMethod;
    }

    this.recalculateClusters();
  }

  /**
   * Cleanup component
   */
  public destroy(): void {
    this.container.innerHTML = '';
  }
}