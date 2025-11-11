/**
 * Semantic Module - Public interface for semantic functionality
 *
 * This module exports all semantic-related functionality for the Knowledge Network.
 * It provides a clean interface for embedding management and semantic calculations.
 *
 * @example
 * ```typescript
 * import { EmbeddingManager, EmbeddingUtils } from '@aigeeksquad/knowledge-network/semantic';
 *
 * const manager = new EmbeddingManager({
 *   textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(384),
 *   dimensions: 384
 * });
 * ```
 */

export { EmbeddingManager, EmbeddingUtils } from './EmbeddingManager';
export type {
  EmbeddingFunction,
  TextEmbeddingFunction,
  EmbeddingConfig
} from './EmbeddingManager';

/**
 * Extended LayoutConfig interface with semantic options
 * Re-exported for convenience
 */
export interface SemanticLayoutConfig {
  // Semantic embedding-based clustering
  embeddingFunction?: import('./EmbeddingManager').EmbeddingFunction;
  textEmbeddingFunction?: import('./EmbeddingManager').TextEmbeddingFunction;
  textExtractor?: (node: import('../types').Node) => string;
  semanticWeight?: number;
  semanticThreshold?: number;
  semanticDimensions?: number;
  semanticForceStrength?: number;
  enableSemanticCache?: boolean;
  maxSemanticCacheSize?: number;
}