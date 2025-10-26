/**
 * Renderer Comparison Module - Main Export
 *
 * Demonstrates the unique multi-renderer architecture of the knowledge-network library
 * by showing identical graphs rendered simultaneously with SVG, Canvas, and WebGL engines.
 * This showcases a key competitive advantage - no other library has three production-ready
 * rendering engines.
 *
 * Key demonstrations:
 * - Visual Quality: Same graphs rendered with different engines for quality comparison
 * - Performance Metrics: Real-time FPS and memory usage across renderers
 * - Feature Matrix: Interactive capability comparison across rendering approaches
 * - Fallback Strategy: Graceful degradation demonstration
 *
 * Competitive positioning against D3.js, Cytoscape.js, and vis.js with multi-engine architecture.
 */

import { RendererComparison } from './RendererComparison.js';
import type { DemoModule } from '../../shared/DemoModule.js';

/**
 * Factory function to create the Renderer Comparison module instance.
 *
 * @returns Promise resolving to the configured RendererComparison module
 */
export async function createRenderersModule(): Promise<DemoModule> {
  return new RendererComparison();
}

/**
 * Module metadata for registration and discovery.
 */
export const moduleInfo = {
  id: 'renderers',
  title: 'Renderer Comparison',
  description: 'Multi-engine architecture demonstration with SVG, Canvas, and WebGL renderers',
  difficulty: 'intermediate' as const,
  estimatedTime: '8-12 minutes',
  capabilities: [
    'Three production-ready rendering engines (SVG/Canvas/WebGL)',
    'Identical graph visualization across all renderers',
    'Real-time performance comparison and metrics',
    'Interactive quality assessment and zoom testing',
    'Graceful fallback and degradation strategies',
    'Gaming-inspired renderer selection interface'
  ],
  competitiveAdvantages: [
    'Only library with three production-ready renderers',
    'Seamless switching maintains identical interactions',
    'Graceful WebGL → Canvas → SVG fallback chain',
    'Performance-optimized renderer selection',
    'Consistent API across all rendering backends'
  ]
};

// Re-export key components for external use
export { RendererComparison } from './RendererComparison.js';
export { SplitViewRenderer } from './components/SplitViewRenderer.js';
export { QualityAssessment } from './components/QualityAssessment.js';
export { PerformanceComparison } from './components/PerformanceComparison.js';

// Re-export types for TypeScript consumers
export type {
  RendererConfig,
  RendererType,
  RendererMetrics,
  QualityMetrics,
  ComparisonResult
} from './RendererComparison.js';