/**
 * Rendering Module Exports
 * 
 * Pluggable rendering strategies for knowledge graph visualization.
 * Supports Canvas, SVG, and WebGL rendering with dynamic strategy switching
 * and navigation state preservation.
 * 
 * @fileoverview Main rendering module exports
 */

// Core rendering strategy interfaces and types
export type {
  IRenderingStrategy,
  RenderingContext,
  RenderingConfig,
  RenderingCapabilities,
  VisualUpdates,
  InteractionEvent,
  RenderingProgressCallback,
  ValidationResult,
  Point2D,
  Rectangle
} from './rendering-strategy';

// Base strategy implementation
export { BaseRenderingStrategy } from './BaseRenderingStrategy';

// Concrete rendering strategies
export { CanvasRenderingStrategy } from './CanvasRenderingStrategy';
export { SVGRenderingStrategy } from './SVGRenderingStrategy';
export { WebGLRenderingStrategy } from './WebGLRenderingStrategy';

// Strategy switching and management
export { StrategySwitcher } from './StrategySwitcher';
export type {
  PerformanceMetrics,
  SwitcherOptions,
  PerformanceSuggestion,
  StrategyComparison
} from './StrategySwitcher';