/**
 * Developer Experience Module - Main Export
 *
 * Demonstrates interactive configuration playground and integration examples
 * for the knowledge-network library. This module showcases developer-focused
 * features with Xbox gaming aesthetics for enhanced DX.
 *
 * Key Features:
 * - Live Code Editor: Monaco-powered editor with syntax highlighting and IntelliSense
 * - Framework Integration: Examples for React, Vue, Angular, and vanilla JavaScript
 * - Configuration Playground: Real-time parameter tuning with immediate visual feedback
 * - Performance Profiler: Developer tools for optimization and debugging
 * - API Explorer: Interactive documentation with live examples
 * - Export Utilities: Code generation and configuration export tools
 *
 * Xbox-styled developer console interface with dark theme optimizations.
 */

import { DeveloperExperience } from './DeveloperExperience.js';
import type { DemoModule } from '../../shared/DemoModule.js';

/**
 * Factory function to create the Developer Experience module instance.
 *
 * @returns Promise resolving to the configured DeveloperExperience module
 */
export async function createDeveloperExperienceModule(): Promise<DemoModule> {
  return new DeveloperExperience();
}

/**
 * Module metadata for registration and discovery.
 */
export const moduleInfo = {
  id: 'developer-experience',
  title: 'Developer Experience',
  description: 'Live code editor, framework integration, and configuration playground',
  difficulty: 'advanced' as const,
  estimatedTime: '20-30 minutes',
  capabilities: [
    'Live Monaco code editor with IntelliSense and syntax highlighting',
    'Framework integration examples (React, Vue, Angular)',
    'Real-time configuration playground with parameter tuning',
    'Performance profiler with optimization recommendations',
    'Interactive API documentation with live examples',
    'Code generation and export utilities for production use'
  ],
  competitiveAdvantages: [
    'First graph library with integrated Monaco code playground',
    'Live configuration editing vs static documentation',
    'Framework-specific integration examples vs generic tutorials',
    'Performance profiling tools not available in D3.js or Cytoscape.js',
    'Xbox-style developer console vs basic configuration panels',
    'Production-ready code generation vs copy-paste examples'
  ]
};

// Re-export key components for external use
export { DeveloperExperience } from './DeveloperExperience.js';
export { CodeEditor } from './components/CodeEditor.js';
export { ConfigurationPlayground } from './components/ConfigurationPlayground.js';
export { FrameworkIntegration } from './components/FrameworkIntegration.js';
export { PerformanceProfiler } from './components/PerformanceProfiler.js';
export { APIExplorer } from './components/APIExplorer.js';

// Re-export types for TypeScript consumers
export type {
  DeveloperConfig,
  CodeExample,
  FrameworkTemplate,
  ProfilerMetrics,
  APIEndpoint,
  ExportFormat
} from './DeveloperExperience.js';