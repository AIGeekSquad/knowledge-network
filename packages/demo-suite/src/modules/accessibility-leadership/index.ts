/**
 * Accessibility Leadership Module - Main Export
 *
 * Demonstrates inclusive design and assistive technology integration features
 * of the knowledge-network library. This module showcases industry-leading
 * accessibility implementations with Xbox gaming aesthetics.
 *
 * Key Features:
 * - Screen Reader Navigation: Full ARIA support with intelligent descriptions
 * - Voice Control: Speech recognition for hands-free graph interaction
 * - Spatial Keyboard Navigation: Arrow-key navigation with spatial awareness
 * - WCAG AAA Compliance: Exceeds accessibility guidelines across all criteria
 * - High Contrast Theming: Xbox-style accessible color schemes
 * - Assistive Technology API: Integration with platform accessibility services
 *
 * Xbox styling optimized for accessibility with high contrast and clear focus indicators.
 */

import { AccessibilityLeadership } from './AccessibilityLeadership.js';
import type { DemoModule } from '../../shared/DemoModule.js';

/**
 * Factory function to create the Accessibility Leadership module instance.
 *
 * @returns Promise resolving to the configured AccessibilityLeadership module
 */
export async function createAccessibilityLeadershipModule(): Promise<DemoModule> {
  return new AccessibilityLeadership();
}

/**
 * Module metadata for registration and discovery.
 */
export const moduleInfo = {
  id: 'accessibility-leadership',
  title: 'Accessibility Leadership',
  description: 'Screen reader navigation, voice control, and WCAG AAA compliance showcase',
  difficulty: 'advanced' as const,
  estimatedTime: '15-20 minutes',
  capabilities: [
    'Full screen reader support with intelligent descriptions',
    'Voice control for hands-free graph navigation',
    'Spatial keyboard navigation with arrow keys',
    'WCAG AAA compliance across all interaction patterns',
    'High contrast Xbox theming for visual accessibility',
    'Real-time accessibility metrics and validation'
  ],
  competitiveAdvantages: [
    'First graph library with full screen reader graph navigation',
    'Voice control capabilities not available in D3.js or Cytoscape.js',
    'WCAG AAA compliance vs AA-level support in alternatives',
    'Spatial keyboard navigation vs basic tab-only interfaces',
    'Assistive technology integration vs accessibility afterthoughts',
    'Xbox accessibility leadership applied to data visualization'
  ]
};

// Re-export key components for external use
export { AccessibilityLeadership } from './AccessibilityLeadership.js';
export { ScreenReaderManager } from './components/ScreenReaderManager.js';
export { VoiceController } from './components/VoiceController.js';
export { KeyboardNavigator } from './components/KeyboardNavigator.js';
export { AccessibilityValidator } from './components/AccessibilityValidator.js';
export { ContrastManager } from './components/ContrastManager.js';

// Re-export types for TypeScript consumers
export type {
  AccessibilityConfig,
  ScreenReaderAnnouncement,
  VoiceCommand,
  KeyboardNavigationState,
  AccessibilityMetrics,
  ContrastLevel
} from './AccessibilityLeadership.js';