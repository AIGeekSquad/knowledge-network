/**
 * Mobile Excellence Module - Main Export
 *
 * Demonstrates mobile-native touch interactions, responsive design, and mobile optimization
 * features of the knowledge-network library. This module showcases:
 *
 * - Multi-touch Gestures: Pinch-to-zoom, two-finger pan, rotation controls
 * - Haptic Feedback: Tactile responses for selections and interactions
 * - Battery Optimization: Performance scaling based on device capabilities
 * - Adaptive Interface: Dynamic UI adaptation for screen sizes and orientations
 * - Touch Target Sizing: Accessibility-optimized touch targets for all devices
 *
 * Mobile-first design with Xbox gaming aesthetics optimized for touch screens.
 */

import { MobileExcellence } from './MobileExcellence.js';
import type { DemoModule } from '../../shared/DemoModule.js';

/**
 * Factory function to create the Mobile Excellence module instance.
 *
 * @returns Promise resolving to the configured MobileExcellence module
 */
export async function createMobileExcellenceModule(): Promise<DemoModule> {
  return new MobileExcellence();
}

/**
 * Module metadata for registration and discovery.
 */
export const moduleInfo = {
  id: 'mobile-excellence',
  title: 'Mobile Excellence',
  description: 'Multi-touch gestures, haptic feedback, and mobile-optimized graph interactions',
  difficulty: 'intermediate' as const,
  estimatedTime: '8-12 minutes',
  capabilities: [
    'Multi-touch gesture recognition (pinch, pan, rotate)',
    'Haptic feedback for touch interactions',
    'Battery-aware performance scaling',
    'Adaptive UI for all screen sizes and orientations',
    'Touch-optimized node selection and manipulation',
    'Mobile-native zoom and navigation controls'
  ],
  competitiveAdvantages: [
    '60fps rendering on mobile devices vs 10-15fps in D3.js',
    'Native multi-touch gesture support vs single-touch only',
    'Hardware-accelerated animations vs CPU-bound alternatives',
    'Battery-optimized performance scaling vs fixed overhead',
    'Touch-first design vs desktop-adapted interfaces',
    'Xbox-inspired mobile gaming UI vs generic web controls'
  ]
};

// Re-export key components for external use
export { MobileExcellence } from './MobileExcellence.js';
export { TouchController } from './components/TouchController.js';
export { HapticFeedback } from './components/HapticFeedback.js';
export { BatteryMonitor } from './components/BatteryMonitor.js';
export { AdaptiveInterface } from './components/AdaptiveInterface.js';

// Re-export types for TypeScript consumers
export type {
  MobileConfig,
  TouchGesture,
  HapticPattern,
  BatteryStatus,
  DeviceProfile
} from './MobileExcellence.js';