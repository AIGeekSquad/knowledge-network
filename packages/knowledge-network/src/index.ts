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

// Spatial Indexing System
export {
  SpatialIndexer,
  SpatialIndexerFactory,
  QuadTree,
  QuadTreeUtils,
  OctTree,
  OctTreeUtils,
  RaycastingSystem,
  RaycastingUtils,
  Point,
  Point2D,
  Point3D,
  Vector,
  Vector2D,
  Vector3D,
  Rectangle,
  Circle,
  Box,
  Sphere,
  Ray,
  Ray2D,
  Ray3D,
  RayIntersection,
  SpatialQueryResult,
  SpatialIndexStats,
  SpatialIndexConfig,
  DEFAULT_SPATIAL_CONFIG,
  isPoint3D,
  isVector3D,
  isRay3D,
  createBoundingRectangle,
  createBoundingBox,
  distance2D,
  distance3D,
  normalize2D,
  normalize3D
} from './spatial';

// Enhanced Rendering and Interaction Systems
export {
  SpatialRenderingSystem,
  SpatialRenderingFactory,
  ExtendedRendererConfig,
  SpatialRenderingConfig,
  NodeSelectionResult,
  RegionSelectionResult
} from './rendering/SpatialRenderingSystem';

export {
  SpatialInteractionManager,
  SpatialInteractionConfig,
  SpatialNodeClickHandler,
  SpatialNodeHoverHandler,
  RegionSelectionHandler
} from './interaction/SpatialInteractionManager';
