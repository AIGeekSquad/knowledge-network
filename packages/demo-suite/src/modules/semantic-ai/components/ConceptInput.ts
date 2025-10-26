/**
 * ConceptInput Component - Live Text Entry with Real-time Embedding
 *
 * Interactive component allowing users to input new concepts that are immediately
 * embedded and positioned in the semantic space. Demonstrates real-time AI integration
 * with the knowledge-network library's semantic clustering capabilities.
 */

import type { SemanticNode } from '../data/semantic-datasets.js';

export interface ConceptInputConfig {
  placeholder: string;
  maxLength: number;
  autoComplete: boolean;
  embeddingModel: 'simple' | 'tfidf' | 'semantic';
  onConceptAdded: (concept: SemanticNode) => void;
  onEmbeddingCalculated: (concept: string, embedding: number[]) => void;
}

export interface ConceptSuggestion {
  text: string;
  category: string;
  similarity: number;
  description?: string;
}

/**
 * ConceptInput - Interactive concept entry with semantic positioning
 */
export class ConceptInput {
  private container: HTMLElement;
  private config: ConceptInputConfig;
  private inputElement: HTMLInputElement;
  private suggestionsContainer: HTMLElement;
  private embeddingDisplay: HTMLElement;
  private addButton: HTMLElement;
  private currentEmbedding: number[] | null = null;
  private currentConcept: string = '';
  private suggestions: ConceptSuggestion[] = [];
  private conceptCounter = 1000; // Start high to avoid ID conflicts

  constructor(container: HTMLElement, config: ConceptInputConfig) {
    this.container = container;
    this.config = config;

    this.createElement();
    this.bindEvents();
  }

  /**
   * Create the concept input UI elements with Xbox styling
   */
  private createElement(): void {
    this.container.innerHTML = `
      <div class="concept-input-panel">
        <div class="concept-input-header">
          <h3 class="concept-input-title">
            🧠 AI Concept Generator
          </h3>
          <div class="concept-input-subtitle">
            Enter a concept to see real-time semantic positioning
          </div>
        </div>

        <div class="concept-input-form">
          <div class="concept-input-group">
            <input
              type="text"
              class="concept-input-field"
              placeholder="${this.config.placeholder}"
              maxlength="${this.config.maxLength}"
              autocomplete="off"
            />
            <button class="concept-input-add-btn ui-button ui-button--primary" disabled>
              <span class="concept-input-btn-icon">➕</span>
              <span class="concept-input-btn-text">Add Concept</span>
            </button>
          </div>

          <div class="concept-input-model-selector">
            <label class="concept-input-label">Embedding Model:</label>
            <select class="concept-input-model ui-select">
              <option value="simple">Simple Text Similarity</option>
              <option value="tfidf">TF-IDF Vectors</option>
              <option value="semantic">Semantic Embeddings</option>
            </select>
          </div>

          <div class="concept-suggestions hidden" id="concept-suggestions">
            <div class="concept-suggestions-header">
              <span class="concept-suggestions-title">💡 Suggestions</span>
            </div>
            <div class="concept-suggestions-list"></div>
          </div>

          <div class="concept-embedding-preview hidden" id="embedding-preview">
            <div class="embedding-preview-header">
              <span class="embedding-preview-title">🔢 Embedding Vector</span>
              <span class="embedding-preview-model">Model: ${this.config.embeddingModel}</span>
            </div>
            <div class="embedding-preview-vector"></div>
            <div class="embedding-preview-stats">
              <span class="embedding-stat">
                <span class="embedding-stat-label">Dimensions:</span>
                <span class="embedding-stat-value">-</span>
              </span>
              <span class="embedding-stat">
                <span class="embedding-stat-label">Magnitude:</span>
                <span class="embedding-stat-value">-</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cache elements
    this.inputElement = this.container.querySelector('.concept-input-field') as HTMLInputElement;
    this.suggestionsContainer = this.container.querySelector('#concept-suggestions') as HTMLElement;
    this.embeddingDisplay = this.container.querySelector('#embedding-preview') as HTMLElement;
    this.addButton = this.container.querySelector('.concept-input-add-btn') as HTMLElement;

    // Add Xbox-themed styling
    this.addXboxStyling();
  }

  /**
   * Add Xbox-themed styling for AI features
   */
  private addXboxStyling(): void {
    const styles = `
      <style>
      .concept-input-panel {
        background: linear-gradient(135deg, var(--color-gray-800) 0%, var(--color-gray-700) 100%);
        border: 2px solid var(--color-accent); /* Xbox Gold for AI features */
        border-radius: var(--radius-lg);
        padding: var(--space-6);
        margin-bottom: var(--space-4);
        box-shadow: 0 0 20px rgba(255, 185, 0, 0.2); /* Xbox Gold glow */
        position: relative;
        overflow: hidden;
      }

      .concept-input-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--color-accent), var(--color-primary), var(--color-secondary));
        animation: ai-pulse 2s ease-in-out infinite;
      }

      @keyframes ai-pulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .concept-input-header {
        text-align: center;
        margin-bottom: var(--space-6);
      }

      .concept-input-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-accent); /* Xbox Gold */
        margin-bottom: var(--space-2);
        text-shadow: 0 0 10px rgba(255, 185, 0, 0.5);
      }

      .concept-input-subtitle {
        color: var(--color-text-secondary);
        font-size: var(--font-size-sm);
      }

      .concept-input-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .concept-input-group {
        display: flex;
        gap: var(--space-3);
        align-items: center;
      }

      .concept-input-field {
        flex: 1;
        padding: var(--space-3) var(--space-4);
        background: var(--color-gray-900);
        border: 2px solid var(--color-gray-600);
        border-radius: var(--radius-base);
        color: var(--color-text-primary);
        font-size: var(--font-size-base);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .concept-input-field:focus {
        border-color: var(--color-accent); /* Xbox Gold focus */
        box-shadow: 0 0 0 3px rgba(255, 185, 0, 0.2);
        outline: none;
      }

      .concept-input-field:focus + .concept-input-add-btn {
        box-shadow: 0 0 15px rgba(255, 185, 0, 0.4);
      }

      .concept-input-add-btn {
        background: linear-gradient(135deg, var(--color-accent), #e5a500);
        border: none;
        color: var(--color-gray-900);
        font-weight: var(--font-weight-bold);
        transition: all var(--duration-fast) var(--easing-ease);
      }

      .concept-input-add-btn:hover:not(:disabled) {
        background: linear-gradient(135deg, #e5a500, var(--color-accent));
        transform: translateY(-2px);
        box-shadow: 0 0 20px rgba(255, 185, 0, 0.6);
      }

      .concept-input-add-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--color-gray-600);
        color: var(--color-gray-400);
      }

      .concept-input-model-selector {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .concept-input-label {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
        white-space: nowrap;
      }

      .concept-input-model {
        background: var(--color-gray-800);
        border: 1px solid var(--color-gray-600);
        color: var(--color-text-primary);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--radius-base);
        font-size: var(--font-size-sm);
      }

      .concept-suggestions {
        background: var(--color-gray-800);
        border: 1px solid var(--color-secondary); /* Xbox Blue */
        border-radius: var(--radius-base);
        overflow: hidden;
        animation: slideDown 0.3s ease-out;
      }

      .concept-suggestions-header {
        background: linear-gradient(90deg, var(--color-secondary), #0099cc);
        padding: var(--space-2) var(--space-3);
        color: var(--color-white);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-sm);
      }

      .concept-suggestions-list {
        max-height: 200px;
        overflow-y: auto;
      }

      .concept-suggestion-item {
        padding: var(--space-3);
        border-bottom: 1px solid var(--color-gray-700);
        cursor: pointer;
        transition: background-color var(--duration-fast) var(--easing-ease);
      }

      .concept-suggestion-item:hover {
        background: var(--color-gray-700);
        color: var(--color-secondary); /* Xbox Blue */
      }

      .concept-suggestion-item:last-child {
        border-bottom: none;
      }

      .concept-suggestion-text {
        font-weight: var(--font-weight-medium);
        margin-bottom: var(--space-1);
      }

      .concept-suggestion-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
      }

      .concept-embedding-preview {
        background: var(--color-gray-800);
        border: 1px solid var(--color-primary); /* Xbox Green */
        border-radius: var(--radius-base);
        overflow: hidden;
        animation: slideDown 0.3s ease-out;
      }

      .embedding-preview-header {
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
        padding: var(--space-2) var(--space-3);
        color: var(--color-white);
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-sm);
      }

      .embedding-preview-title {
        font-weight: var(--font-weight-medium);
      }

      .embedding-preview-model {
        font-size: var(--font-size-xs);
        opacity: 0.8;
      }

      .embedding-preview-vector {
        padding: var(--space-3);
        font-family: var(--font-family-mono);
        font-size: var(--font-size-xs);
        color: var(--color-text-secondary);
        max-height: 120px;
        overflow-y: auto;
        line-height: 1.6;
      }

      .embedding-preview-stats {
        display: flex;
        gap: var(--space-4);
        padding: var(--space-2) var(--space-3);
        background: var(--color-gray-900);
        border-top: 1px solid var(--color-gray-700);
      }

      .embedding-stat {
        display: flex;
        gap: var(--space-2);
        font-size: var(--font-size-xs);
      }

      .embedding-stat-label {
        color: var(--color-text-muted);
      }

      .embedding-stat-value {
        color: var(--color-primary);
        font-weight: var(--font-weight-medium);
        font-family: var(--font-family-mono);
      }

      .hidden {
        display: none !important;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  /**
   * Bind event handlers for interactive behavior
   */
  private bindEvents(): void {
    // Input field events
    this.inputElement.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value.trim();
      this.currentConcept = value;

      if (value.length > 2) {
        this.generateEmbedding(value);
        this.generateSuggestions(value);
        this.addButton.removeAttribute('disabled');
      } else {
        this.hideEmbeddingPreview();
        this.hideSuggestions();
        this.addButton.setAttribute('disabled', 'true');
      }
    });

    this.inputElement.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !this.addButton.hasAttribute('disabled')) {
        this.addConcept();
      }
    });

    // Add button click
    this.addButton.addEventListener('click', () => {
      if (!this.addButton.hasAttribute('disabled')) {
        this.addConcept();
      }
    });

    // Model selector change
    const modelSelect = this.container.querySelector('.concept-input-model') as HTMLSelectElement;
    modelSelect.addEventListener('change', (e) => {
      const newModel = (e.target as HTMLSelectElement).value as 'simple' | 'tfidf' | 'semantic';
      this.config.embeddingModel = newModel;

      // Update preview header
      const modelDisplay = this.embeddingDisplay.querySelector('.embedding-preview-model') as HTMLElement;
      if (modelDisplay) {
        modelDisplay.textContent = `Model: ${newModel}`;
      }

      // Regenerate embedding if we have a current concept
      if (this.currentConcept.length > 2) {
        this.generateEmbedding(this.currentConcept);
      }
    });
  }

  /**
   * Generate embedding vector for the given text
   */
  private generateEmbedding(text: string): void {
    let embedding: number[];

    switch (this.config.embeddingModel) {
      case 'simple':
        embedding = this.generateSimpleEmbedding(text);
        break;
      case 'tfidf':
        embedding = this.generateTFIDFEmbedding(text);
        break;
      case 'semantic':
        embedding = this.generateSemanticEmbedding(text);
        break;
      default:
        embedding = this.generateSimpleEmbedding(text);
    }

    this.currentEmbedding = embedding;
    this.showEmbeddingPreview(embedding);
    this.config.onEmbeddingCalculated(text, embedding);
  }

  /**
   * Generate simple character-based embedding
   */
  private generateSimpleEmbedding(text: string): number[] {
    const embedding = new Array(16).fill(0);
    const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');

    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      embedding[i % embedding.length] += char / 100;
    }

    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Generate TF-IDF-style embedding
   */
  private generateTFIDFEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const vocabulary = ['machine', 'learning', 'data', 'science', 'algorithm', 'neural', 'network',
                       'artificial', 'intelligence', 'model', 'training', 'prediction', 'analysis',
                       'pattern', 'classification', 'regression', 'clustering', 'optimization',
                       'feature', 'vector', 'matrix', 'probability', 'statistics', 'knowledge'];

    const embedding = new Array(vocabulary.length).fill(0);

    // Simple TF calculation
    words.forEach(word => {
      const index = vocabulary.indexOf(word);
      if (index !== -1) {
        embedding[index] += 1;
      }
    });

    // Add some semantic similarity
    words.forEach(word => {
      vocabulary.forEach((vocabWord, index) => {
        const similarity = this.calculateWordSimilarity(word, vocabWord);
        if (similarity > 0.3) {
          embedding[index] += similarity * 0.5;
        }
      });
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
    const embedding = new Array(64).fill(0); // Higher dimensional

    // Simulate semantic understanding with predefined concept vectors
    const semanticConcepts = {
      'technology': [1, 0.8, 0.6, 0.3, -0.2, 0.9, 0.4, 0.7],
      'science': [0.7, 1, 0.9, 0.5, 0.3, 0.6, 0.8, 0.4],
      'learning': [0.6, 0.4, 1, 0.8, 0.7, 0.3, 0.5, 0.9],
      'data': [0.8, 0.6, 0.7, 1, 0.4, 0.5, 0.9, 0.3],
      'network': [0.5, 0.7, 0.4, 0.6, 1, 0.8, 0.2, 0.6],
      'artificial': [0.9, 0.3, 0.8, 0.4, 0.6, 1, 0.5, 0.7],
      'intelligence': [0.4, 0.8, 0.6, 0.7, 0.5, 0.9, 1, 0.4],
      'analysis': [0.3, 0.9, 0.5, 0.8, 0.4, 0.2, 0.7, 1]
    };

    // Combine concept vectors based on word presence
    words.forEach(word => {
      Object.entries(semanticConcepts).forEach(([concept, vector]) => {
        const similarity = this.calculateWordSimilarity(word, concept);
        if (similarity > 0.2) {
          for (let i = 0; i < Math.min(8, embedding.length); i++) {
            embedding[i] += vector[i] * similarity;
            // Add to multiple positions for higher dimensionality
            if (i + 8 < embedding.length) embedding[i + 8] += vector[i] * similarity * 0.7;
            if (i + 16 < embedding.length) embedding[i + 16] += vector[i] * similarity * 0.5;
            if (i + 24 < embedding.length) embedding[i + 24] += vector[i] * similarity * 0.3;
          }
        }
      });
    });

    // Add some random semantic noise for realism
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] += (Math.random() - 0.5) * 0.1;
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? embedding.map(val => val / magnitude) : embedding;
  }

  /**
   * Calculate simple word similarity using character overlap
   */
  private calculateWordSimilarity(word1: string, word2: string): number {
    if (word1 === word2) return 1;

    const longer = word1.length > word2.length ? word1 : word2;
    const shorter = word1.length > word2.length ? word2 : word1;

    if (longer.length === 0) return 0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Generate contextual suggestions based on input
   */
  private generateSuggestions(text: string): void {
    const suggestions: ConceptSuggestion[] = [];

    // Generate suggestions based on semantic similarity
    const baseConcepts = [
      { text: 'Machine Learning', category: 'AI', description: 'Algorithms that learn from data' },
      { text: 'Neural Networks', category: 'AI', description: 'Brain-inspired computing models' },
      { text: 'Data Science', category: 'Analytics', description: 'Extracting insights from data' },
      { text: 'Knowledge Graphs', category: 'Semantic', description: 'Structured knowledge representation' },
      { text: 'Computer Vision', category: 'AI', description: 'AI for visual understanding' },
      { text: 'Natural Language Processing', category: 'AI', description: 'AI for language understanding' },
      { text: 'Distributed Systems', category: 'Systems', description: 'Scalable system architecture' },
      { text: 'Cloud Computing', category: 'Infrastructure', description: 'On-demand computing resources' }
    ];

    baseConcepts.forEach(concept => {
      const similarity = this.calculateWordSimilarity(text.toLowerCase(), concept.text.toLowerCase());
      if (similarity > 0.2) {
        suggestions.push({
          ...concept,
          similarity
        });
      }
    });

    // Sort by similarity
    suggestions.sort((a, b) => b.similarity - a.similarity);

    this.suggestions = suggestions.slice(0, 5); // Top 5 suggestions
    this.showSuggestions();
  }

  /**
   * Show embedding vector preview
   */
  private showEmbeddingPreview(embedding: number[]): void {
    const vectorDisplay = this.embeddingDisplay.querySelector('.embedding-preview-vector') as HTMLElement;
    const dimensionsDisplay = this.embeddingDisplay.querySelector('.embedding-stat-value') as HTMLElement;
    const magnitudeDisplay = this.embeddingDisplay.querySelectorAll('.embedding-stat-value')[1] as HTMLElement;

    // Format vector display
    const formattedVector = embedding.map(val => val.toFixed(3)).join(', ');
    vectorDisplay.textContent = `[${formattedVector}]`;

    // Update stats
    dimensionsDisplay.textContent = embedding.length.toString();
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    magnitudeDisplay.textContent = magnitude.toFixed(4);

    this.embeddingDisplay.classList.remove('hidden');
  }

  /**
   * Hide embedding preview
   */
  private hideEmbeddingPreview(): void {
    this.embeddingDisplay.classList.add('hidden');
  }

  /**
   * Show concept suggestions
   */
  private showSuggestions(): void {
    const suggestionsList = this.suggestionsContainer.querySelector('.concept-suggestions-list') as HTMLElement;

    suggestionsList.innerHTML = this.suggestions.map(suggestion => `
      <div class="concept-suggestion-item" data-text="${suggestion.text}">
        <div class="concept-suggestion-text">${suggestion.text}</div>
        <div class="concept-suggestion-meta">
          <span class="concept-suggestion-category">${suggestion.category}</span>
          <span class="concept-suggestion-similarity">${(suggestion.similarity * 100).toFixed(1)}% match</span>
        </div>
        ${suggestion.description ? `<div class="concept-suggestion-description">${suggestion.description}</div>` : ''}
      </div>
    `).join('');

    // Add click handlers to suggestions
    suggestionsList.querySelectorAll('.concept-suggestion-item').forEach(item => {
      item.addEventListener('click', () => {
        const text = item.getAttribute('data-text');
        if (text) {
          this.inputElement.value = text;
          this.currentConcept = text;
          this.generateEmbedding(text);
          this.hideSuggestions();
          this.addButton.removeAttribute('disabled');
          this.inputElement.focus();
        }
      });
    });

    this.suggestionsContainer.classList.remove('hidden');
  }

  /**
   * Hide concept suggestions
   */
  private hideSuggestions(): void {
    this.suggestionsContainer.classList.add('hidden');
  }

  /**
   * Add the current concept to the graph
   */
  private addConcept(): void {
    if (!this.currentConcept || !this.currentEmbedding) return;

    // Determine category based on concept text
    const category = this.determineCategory(this.currentConcept);

    const newConcept: SemanticNode = {
      id: `user-concept-${this.conceptCounter++}`,
      concept: this.currentConcept,
      category: 'user-generated',
      description: `User-generated concept: ${this.currentConcept}`,
      tags: [category, 'user-input', 'ai-embedded'],
      x: 0,
      y: 0,
      semanticVector: [...this.currentEmbedding]
    };

    // Notify parent component
    this.config.onConceptAdded(newConcept);

    // Clear input and reset state
    this.inputElement.value = '';
    this.currentConcept = '';
    this.currentEmbedding = null;
    this.hideEmbeddingPreview();
    this.hideSuggestions();
    this.addButton.setAttribute('disabled', 'true');

    // Brief success feedback
    this.showSuccessFeedback();
  }

  /**
   * Determine category for a concept based on its text
   */
  private determineCategory(concept: string): string {
    const text = concept.toLowerCase();

    if (text.includes('machine') || text.includes('ai') || text.includes('neural')) return 'ai';
    if (text.includes('data') || text.includes('analysis') || text.includes('science')) return 'data-science';
    if (text.includes('network') || text.includes('system') || text.includes('computing')) return 'systems';
    if (text.includes('web') || text.includes('frontend') || text.includes('backend')) return 'web';
    if (text.includes('algorithm') || text.includes('optimization') || text.includes('search')) return 'algorithms';
    if (text.includes('design') || text.includes('user') || text.includes('interface')) return 'design';

    return 'general';
  }

  /**
   * Show brief success feedback when concept is added
   */
  private showSuccessFeedback(): void {
    const originalText = this.addButton.textContent;
    const icon = this.addButton.querySelector('.concept-input-btn-icon') as HTMLElement;
    const text = this.addButton.querySelector('.concept-input-btn-text') as HTMLElement;

    icon.textContent = '✅';
    text.textContent = 'Added!';
    this.addButton.style.background = 'linear-gradient(135deg, var(--color-success), #0e6b0e)';

    setTimeout(() => {
      icon.textContent = '➕';
      text.textContent = 'Add Concept';
      this.addButton.style.background = '';
    }, 1500);
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ConceptInputConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if (newConfig.placeholder) {
      this.inputElement.placeholder = newConfig.placeholder;
    }

    if (newConfig.maxLength) {
      this.inputElement.maxLength = newConfig.maxLength;
    }
  }

  /**
   * Clear current state
   */
  public clear(): void {
    this.inputElement.value = '';
    this.currentConcept = '';
    this.currentEmbedding = null;
    this.hideEmbeddingPreview();
    this.hideSuggestions();
    this.addButton.setAttribute('disabled', 'true');
  }

  /**
   * Cleanup component
   */
  public destroy(): void {
    // Remove event listeners and clean up
    this.container.innerHTML = '';
  }
}