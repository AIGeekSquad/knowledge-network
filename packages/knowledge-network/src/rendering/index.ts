/**
 * Rendering System Exports
 *
 * Comprehensive rendering system for knowledge graph visualization including:
 * - Core rendering interfaces and systems
 * - Multiple renderer implementations (SVG, Canvas, Enhanced Canvas)
 * - Spatial-aware rendering with high-performance capabilities
 * - Integration utilities and examples
 */

// Core interfaces and systems
export type {
  IRenderer,
  RendererType,
  RendererConfig,
  RenderConfig,
  NodeRenderConfig,
  EdgeRenderConfig,
  LabelRenderConfig,
  NodeStyleUpdate,
  EdgeStyleUpdate,
  HighlightConfig,
  Transform,
  LabelItem,
} from './IRenderer';

export { RenderingSystem } from './RenderingSystem';

// Basic renderer implementations
export { CanvasRenderer } from './CanvasRenderer';
export { SVGRenderer } from './SVGRenderer';

// Enhanced spatial-aware rendering
export { EnhancedCanvasRenderer, type CanvasRenderingConfig } from './EnhancedCanvasRenderer';

// Spatial rendering system
export { SpatialRenderingSystem } from './SpatialRenderingSystem';

// Spatial integration utilities
export {
  SpatialCanvasFactory,
  SpatialInteractionHelpers,
  PerformanceMonitor,
  CanvasRendererMigration,
  PERFORMANCE_PRESETS,
  type PerformancePreset,
} from './SpatialCanvasIntegration';

// Examples and usage patterns
export { EnhancedCanvasExamples } from './examples/enhanced-canvas-example';

/**
 * Convenience factory functions for common use cases
 */

/**
 * Create a basic canvas renderer for simple graphs
 */
export function createCanvasRenderer(): CanvasRenderer {
  return new CanvasRenderer();
}

/**
 * Create an enhanced canvas renderer with default configuration
 */
export function createEnhancedCanvasRenderer(): EnhancedCanvasRenderer {
  return SpatialCanvasFactory.create('balanced');
}

/**
 * Create a high-performance renderer optimized for large graphs (1000+ nodes)
 */
export function createLargeGraphRenderer(): EnhancedCanvasRenderer {
  return SpatialCanvasFactory.create('largeGraph');
}

/**
 * Create a mobile-optimized renderer
 */
export function createMobileRenderer(): EnhancedCanvasRenderer {
  return SpatialCanvasFactory.createMobile();
}

/**
 * Create an SVG renderer for high-quality static visualizations
 */
export function createSVGRenderer(): SVGRenderer {
  return new SVGRenderer();
}