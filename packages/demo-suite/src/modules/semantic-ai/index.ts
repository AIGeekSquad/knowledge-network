/**
 * Semantic AI Demo Module - Main Export
 *
 * Industry-first demonstration of AI-powered graph layout and clustering capabilities
 * that are unique to the knowledge-network library. This module showcases:
 *
 * - Embedding-Based Clustering: Real-time semantic positioning using vector embeddings
 * - Hybrid Force Systems: Balance between structural and semantic attraction forces
 * - Live Embedding Generation: Interactive text input with real-time embedding calculation
 * - Semantic Edge Bundling: AI-based edge compatibility for intelligent bundling
 * - Dynamic Clustering: Interactive similarity thresholds with visual feedback
 *
 * Competitive positioning: No other graph visualization library offers first-class
 * semantic clustering and AI-driven layout capabilities.
 */

import { SemanticAIDemo } from './SemanticAIDemo.js';
import type { DemoModule } from '../../shared/DemoModule.js';

/**
 * Factory function to create the Semantic AI Demo module instance.
 *
 * @returns Promise resolving to the configured SemanticAIDemo module
 */
export async function createSemanticAIModule(): Promise<DemoModule> {
  return new SemanticAIDemo();
}

/**
 * Module metadata for registration and discovery.
 */
export const moduleInfo = {
  id: 'semantic-ai',
  title: 'Semantic AI Clustering',
  description: 'AI-powered graph layout with embedding-based clustering and semantic forces',
  difficulty: 'advanced' as const,
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
};

// Re-export key components for external use
export { SemanticAIDemo } from './SemanticAIDemo.js';
export { ConceptInput } from './components/ConceptInput.js';
export { ForceBalancer } from './components/ForceBalancer.js';
export { ClusteringVisualizer } from './components/ClusteringVisualizer.js';

// Re-export semantic datasets
export {
  conceptNetworks,
  researchPapers,
  technologyStack,
  scientificConcepts
} from './data/semantic-datasets.js';

// Re-export types for TypeScript consumers
export type {
  SemanticConfig,
  ConceptEmbedding,
  SemanticForce,
  ClusteringThreshold,
  EmbeddingModel,
  SemanticEdgeBundle
} from './SemanticAIDemo.js';