/**
 * @aigeeksquad/knowledge-network
 * A TypeScript library extending d3.js for knowledge graph visualization
 */

export { KnowledgeGraph } from './KnowledgeGraph';
export {
  Node,
  Edge,
  GraphData,
  GraphConfig,
  Accessor,
  SimilarityFunction,
  LinkStrengthFunction,
  LayoutEngineState
} from './types';
export { ForceLayoutEngine } from './layout/ForceLayoutEngine';
export {
  LayoutEngine,
  LayoutConfig,
  LayoutResult,
  LayoutAlgorithm,
  PositionedNode,
  PositionedEdge
} from './layout/LayoutEngine';
export {
  EmbeddingManager,
  EmbeddingUtils,
  EmbeddingFunction,
  TextEmbeddingFunction,
  EmbeddingConfig,
  SemanticLayoutConfig
} from './semantic';
export {
  EdgeRenderer,
  EdgeRenderConfig,
  EdgeRenderResult,
  SimpleEdge,
  EdgeBundling,
  EdgeBundlingConfig,
  EdgeCompatibilityFunction,
  CurveType,
  SmoothingType
} from './edges';
