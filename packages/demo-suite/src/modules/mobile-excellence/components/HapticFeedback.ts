/**
 * Haptic Feedback Component
 *
 * Provides tactile feedback for mobile graph interactions using the Vibration API.
 * Implements Xbox-style feedback patterns for different interaction types.
 */

import type { HapticPattern } from '../MobileExcellence.js';

interface HapticConfig {
  enabled: boolean;
  intensity: number;
}

export class HapticFeedback {
  private enabled: boolean;
  private intensity: number;
  private isSupported: boolean;

  // Xbox-inspired haptic patterns
  private patterns: Record<string, number[]> = {
    // Quick selection feedback
    selection: [20, 10, 20],

    // Navigation feedback (like Xbox controller bumper)
    navigation: [40],

    // Error pattern (double buzz)
    error: [100, 50, 100],

    // Success pattern (triple gentle tap)
    success: [30, 20, 30, 20, 30],

    // Warning pattern (long buzz)
    warning: [200],

    // Tap feedback (Xbox button press)
    tap: [25],

    // Double tap (Xbox double-click)
    doubletap: [25, 30, 25],

    // Long press (Xbox hold)
    longpress: [50, 100, 50],

    // Pinch gesture (gradual intensity)
    pinch: [15, 5, 20, 5, 25],

    // Pan gesture (directional feedback)
    pan: [30],

    // Rotate gesture (circular pattern)
    rotate: [20, 10, 20, 10, 20, 10, 20]
  };

  constructor({ enabled, intensity }: HapticConfig) {
    this.enabled = enabled;
    this.intensity = intensity;
    this.isSupported = 'vibrate' in navigator;

    if (!this.isSupported) {
      console.warn('Haptic feedback not supported on this device');
    }
  }

  /**
   * Trigger haptic feedback for a specific interaction type
   */
  triggerFeedback(type: string, customIntensity?: number): void {
    if (!this.enabled || !this.isSupported) return;

    const pattern = this.patterns[type];
    if (!pattern) {
      console.warn(`Unknown haptic pattern: ${type}`);
      return;
    }

    const intensity = customIntensity ?? this.intensity;
    this.playPattern(pattern, intensity);
  }

  /**
   * Play a custom haptic pattern
   */
  playCustomPattern(pattern: HapticPattern): void {
    if (!this.enabled || !this.isSupported) return;

    if (pattern.pattern) {
      this.playPattern(pattern.pattern, pattern.intensity);
    } else {
      // Single vibration
      const duration = Math.round(pattern.duration * pattern.intensity);
      this.vibrate([duration]);
    }
  }

  /**
   * Set global haptic intensity
   */
  setIntensity(intensity: number): void {
    this.intensity = Math.max(0, Math.min(1, intensity));
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if haptic feedback is supported
   */
  isHapticSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Test haptic feedback with a simple pattern
   */
  testFeedback(): void {
    this.triggerFeedback('success');
  }

  /**
   * Stop any ongoing vibration
   */
  stop(): void {
    if (this.isSupported) {
      navigator.vibrate(0);
    }
  }

  /**
   * Create contextual feedback based on graph interaction
   */
  triggerInteractionFeedback(interactionType: string, context?: any): void {
    switch (interactionType) {
      case 'node-select':
        this.triggerFeedback('selection', 0.6);
        break;

      case 'node-deselect':
        this.triggerFeedback('tap', 0.3);
        break;

      case 'edge-hover':
        this.triggerFeedback('tap', 0.2);
        break;

      case 'zoom-start':
        this.triggerFeedback('pinch', 0.4);
        break;

      case 'zoom-end':
        this.triggerFeedback('tap', 0.3);
        break;

      case 'pan-start':
        this.triggerFeedback('pan', 0.3);
        break;

      case 'rotation-start':
        this.triggerFeedback('rotate', 0.5);
        break;

      case 'menu-open':
        this.triggerFeedback('navigation');
        break;

      case 'menu-close':
        this.triggerFeedback('tap', 0.4);
        break;

      case 'error':
        this.triggerFeedback('error');
        break;

      case 'achievement':
        this.triggerFeedback('success');
        break;

      default:
        this.triggerFeedback('tap', 0.3);
    }
  }

  /**
   * Provide feedback based on battery level
   */
  triggerBatteryAwareFeedback(type: string, batteryLevel: number): void {
    // Reduce feedback intensity when battery is low
    let intensityMultiplier = 1.0;

    if (batteryLevel < 0.2) {
      intensityMultiplier = 0.3; // Very gentle feedback
    } else if (batteryLevel < 0.5) {
      intensityMultiplier = 0.6; // Reduced feedback
    }

    const adjustedIntensity = this.intensity * intensityMultiplier;
    this.triggerFeedback(type, adjustedIntensity);
  }

  /**
   * Xbox-style controller emulation patterns
   */
  triggerXboxPattern(buttonType: 'A' | 'B' | 'X' | 'Y' | 'start' | 'select' | 'trigger'): void {
    const xboxPatterns = {
      'A': [30], // Main action button
      'B': [20], // Cancel/back button
      'X': [25], // Alternative action
      'Y': [25], // Secondary action
      'start': [50, 30, 50], // Start button
      'select': [40], // Select button
      'trigger': [15, 5, 30] // Trigger pull
    };

    const pattern = xboxPatterns[buttonType];
    if (pattern) {
      this.playPattern(pattern, this.intensity);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    this.enabled = false;
  }

  // Private methods

  private playPattern(pattern: number[], intensity: number): void {
    if (!this.isSupported) return;

    // Scale pattern by intensity (0-1)
    const scaledPattern = pattern.map(duration =>
      Math.round(duration * intensity)
    );

    // Filter out zero durations
    const validPattern = scaledPattern.filter(duration => duration > 0);

    if (validPattern.length > 0) {
      this.vibrate(validPattern);
    }
  }

  private vibrate(pattern: number | number[]): void {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration failed:', error);
      this.isSupported = false;
    }
  }
}