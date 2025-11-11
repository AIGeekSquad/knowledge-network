/**
 * Tests for AnimationSystem class
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { AnimationSystem, DEFAULT_ANIMATION_CONFIG } from '../AnimationSystem';
import { ViewportState } from '../ViewportState';
import { EASING_FUNCTIONS } from '../types';

// Mock requestAnimationFrame and performance
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // Simulate 60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

Object.defineProperty(global.performance, 'now', {
  value: vi.fn(() => Date.now()),
});

describe('AnimationSystem', () => {
  let animationSystem: AnimationSystem;

  beforeEach(() => {
    animationSystem = new AnimationSystem();
    vi.clearAllMocks();
  });

  afterEach(() => {
    animationSystem.stop();
  });

  describe('configuration', () => {
    test('should initialize with default config', () => {
      const config = animationSystem.getConfig();
      expect(config).toEqual(DEFAULT_ANIMATION_CONFIG);
    });

    test('should update configuration', () => {
      const newConfig = {
        defaultDuration: 500,
        maxConcurrentAnimations: 10,
      };

      animationSystem.updateConfig(newConfig);
      const config = animationSystem.getConfig();

      expect(config.defaultDuration).toBe(500);
      expect(config.maxConcurrentAnimations).toBe(10);
      expect(config.defaultEasing).toBe(DEFAULT_ANIMATION_CONFIG.defaultEasing); // Unchanged
    });
  });

  describe('viewport animations', () => {
    let viewport: ViewportState;

    beforeEach(() => {
      viewport = new ViewportState(800, 600);
    });

    test('should animate zoom', async () => {
      const initialZoom = viewport.getZoom();
      const targetZoom = 2;

      const promise = animationSystem.animateZoom(viewport, targetZoom);

      // Animation should be running
      expect(animationSystem.isAnimating('viewport-zoom')).toBe(true);

      await promise;

      expect(viewport.getZoom()).toBe(targetZoom);
      expect(animationSystem.isAnimating('viewport-zoom')).toBe(false);
    });

    test('should animate zoom towards center point', async () => {
      const center = { x: 200, y: 150 };
      const targetZoom = 2;

      const worldPointBeforeZoom = viewport.screenToWorld(center);

      await animationSystem.animateZoom(viewport, targetZoom, center);

      // The world point under the center should remain at the same screen position
      const screenPointAfterZoom = viewport.worldToScreen(worldPointBeforeZoom);
      expect(Math.abs(screenPointAfterZoom.x - center.x)).toBeLessThan(1);
      expect(Math.abs(screenPointAfterZoom.y - center.y)).toBeLessThan(1);
    });

    test('should animate pan', async () => {
      const targetPan = { x: 100, y: 50 };

      const promise = animationSystem.animatePan(viewport, targetPan);

      expect(animationSystem.isAnimating('viewport-pan')).toBe(true);

      await promise;

      const currentPan = viewport.getPan();
      expect(currentPan.x).toBeCloseTo(targetPan.x, 1);
      expect(currentPan.y).toBeCloseTo(targetPan.y, 1);
      expect(animationSystem.isAnimating('viewport-pan')).toBe(false);
    });

    test('should animate to fit bounds', async () => {
      const contentBounds = {
        minX: -50,
        minY: -25,
        maxX: 50,
        maxY: 25,
      };

      await animationSystem.animateToFit(viewport, contentBounds, 50);

      const state = viewport.getState();
      expect(state.zoom).toBeGreaterThan(1); // Should zoom in to fit
    });

    test('should animate reset', async () => {
      // First change viewport
      viewport.setZoom(3);
      viewport.setPan({ x: 200, y: 100 });

      const initialZoom = 1.5;
      const initialPan = { x: 25, y: 10 };

      await animationSystem.animateReset(viewport, initialZoom, initialPan);

      expect(viewport.getZoom()).toBeCloseTo(initialZoom, 1);
      const pan = viewport.getPan();
      expect(pan.x).toBeCloseTo(initialPan.x, 1);
      expect(pan.y).toBeCloseTo(initialPan.y, 1);
    });

    test('should skip animation for minimal changes', async () => {
      viewport.setZoom(2.0001);
      const promise = animationSystem.animateZoom(viewport, 2);

      // Should resolve immediately
      await expect(promise).resolves.toBeUndefined();
      expect(animationSystem.isAnimating()).toBe(false);
    });
  });

  describe('custom animations', () => {
    test('should animate numeric values', async () => {
      let currentValue = 0;
      const targetValue = 100;

      const promise = animationSystem.animateValue(
        'test-numeric',
        currentValue,
        targetValue,
        { duration: 100 },
        (value) => {
          currentValue = value;
        }
      );

      await promise;

      expect(currentValue).toBe(targetValue);
      expect(animationSystem.isAnimating('test-numeric')).toBe(false);
    });

    test('should animate point values', async () => {
      let currentPoint = { x: 0, y: 0 };
      const targetPoint = { x: 100, y: 50 };

      const promise = animationSystem.animatePoint(
        'test-point',
        currentPoint,
        targetPoint,
        { duration: 100 },
        (point) => {
          currentPoint = { ...point };
        }
      );

      await promise;

      expect(currentPoint.x).toBeCloseTo(targetPoint.x, 1);
      expect(currentPoint.y).toBeCloseTo(targetPoint.y, 1);
    });

    test('should animate with custom configuration', async () => {
      let currentValue = 0;
      let progressCalls = 0;
      let completeCalls = 0;

      const promise = animationSystem.animate(
        'test-custom',
        currentValue,
        100,
        {
          duration: 200,
          easing: EASING_FUNCTIONS.easeInQuad,
          onProgress: () => {
            progressCalls++;
          },
          onComplete: () => {
            completeCalls++;
          },
        },
        (progress, value) => {
          currentValue = value;
        }
      );

      await promise;

      expect(currentValue).toBe(100);
      expect(progressCalls).toBeGreaterThan(0);
      expect(completeCalls).toBe(1);
    });
  });

  describe('animation control', () => {
    test('should cancel specific animation', async () => {
      let currentValue = 0;

      const promise = animationSystem.animateValue(
        'test-cancel',
        currentValue,
        100,
        { duration: 1000 }, // Long duration
        (value) => {
          currentValue = value;
        }
      );

      expect(animationSystem.isAnimating('test-cancel')).toBe(true);

      animationSystem.cancelAnimation('test-cancel');

      expect(animationSystem.isAnimating('test-cancel')).toBe(false);

      // Promise should still resolve (animation was cancelled)
      await expect(promise).resolves.toBeUndefined();
    });

    test('should cancel all animations', async () => {
      const promise1 = animationSystem.animateValue(
        'test-1',
        0,
        100,
        { duration: 1000 },
        () => {}
      );

      const promise2 = animationSystem.animateValue(
        'test-2',
        0,
        100,
        { duration: 1000 },
        () => {}
      );

      expect(animationSystem.isAnimating('test-1')).toBe(true);
      expect(animationSystem.isAnimating('test-2')).toBe(true);

      animationSystem.cancelAllAnimations();

      expect(animationSystem.isAnimating('test-1')).toBe(false);
      expect(animationSystem.isAnimating('test-2')).toBe(false);

      await expect(promise1).resolves.toBeUndefined();
      await expect(promise2).resolves.toBeUndefined();
    });

    test('should check if specific animation is running', () => {
      expect(animationSystem.isAnimating('non-existent')).toBe(false);

      animationSystem.animateValue('test', 0, 100, { duration: 1000 }, () => {});

      expect(animationSystem.isAnimating('test')).toBe(true);
      expect(animationSystem.isAnimating()).toBe(true); // Any animation

      animationSystem.cancelAnimation('test');

      expect(animationSystem.isAnimating('test')).toBe(false);
      expect(animationSystem.isAnimating()).toBe(false);
    });

    test('should get active animation IDs', () => {
      expect(animationSystem.getActiveAnimationIds()).toEqual([]);

      animationSystem.animateValue('test-1', 0, 100, { duration: 1000 }, () => {});
      animationSystem.animateValue('test-2', 0, 100, { duration: 1000 }, () => {});

      const activeIds = animationSystem.getActiveAnimationIds();
      expect(activeIds).toContain('test-1');
      expect(activeIds).toContain('test-2');
      expect(activeIds).toHaveLength(2);
    });
  });

  describe('performance monitoring', () => {
    test('should track frame rate', async () => {
      // Start an animation to begin frame tracking
      animationSystem.animateValue('test-fps', 0, 100, { duration: 200 }, () => {});

      // Wait a bit for frame rate calculation
      await new Promise(resolve => setTimeout(resolve, 100));

      const fps = animationSystem.getCurrentFps();
      expect(typeof fps).toBe('number');
      expect(fps).toBeGreaterThan(0);
    });

    test('should provide performance stats', () => {
      const stats = animationSystem.getPerformanceStats();

      expect(stats).toHaveProperty('fps');
      expect(stats).toHaveProperty('activeAnimations');
      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('frameCount');

      expect(typeof stats.fps).toBe('number');
      expect(typeof stats.activeAnimations).toBe('number');
      expect(typeof stats.isRunning).toBe('boolean');
      expect(typeof stats.frameCount).toBe('number');
    });
  });

  describe('easing functions', () => {
    test('should use different easing functions', async () => {
      const values: number[] = [];

      await animationSystem.animate(
        'test-easing',
        0,
        100,
        {
          duration: 100,
          easing: EASING_FUNCTIONS.easeInQuad,
        },
        (progress, value) => {
          values.push(value);
        }
      );

      expect(values).toHaveLength.greaterThan(1);
      expect(values[0]).toBe(0);
      expect(values[values.length - 1]).toBe(100);

      // For easeInQuad, values should start slow and speed up
      const midpoint = Math.floor(values.length / 2);
      const firstHalfAvg = values.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
      const secondHalfAvg = values.slice(midpoint).reduce((a, b) => a + b, 0) / (values.length - midpoint);

      expect(secondHalfAvg).toBeGreaterThan(firstHalfAvg);
    });
  });

  describe('error handling', () => {
    test('should handle errors in animation callbacks', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const promise = animationSystem.animate(
        'test-error',
        0,
        100,
        { duration: 100 },
        () => {
          throw new Error('Animation callback error');
        }
      );

      await promise;

      expect(consoleSpy).toHaveBeenCalledWith(
        'Animation update error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });

    test('should handle errors in completion callbacks', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const promise = animationSystem.animate(
        'test-completion-error',
        0,
        100,
        {
          duration: 100,
          onComplete: () => {
            throw new Error('Completion callback error');
          },
        },
        () => {}
      );

      await promise;

      expect(consoleSpy).toHaveBeenCalledWith(
        'Animation completion error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('static utility methods', () => {
    test('should create spring easing function', () => {
      const springEasing = AnimationSystem.createSpringEasing(120, 14);

      expect(typeof springEasing).toBe('function');

      // Test spring function properties
      expect(springEasing(0)).toBe(0);
      expect(springEasing(1)).toBeCloseTo(1, 1);

      // Spring should overshoot then settle
      const midValue = springEasing(0.5);
      expect(typeof midValue).toBe('number');
    });

    test('should create bounce easing function', () => {
      const bounceEasing = AnimationSystem.createBounceEasing(3, 0.6);

      expect(typeof bounceEasing).toBe('function');

      expect(bounceEasing(0)).toBeCloseTo(0, 1);
      expect(bounceEasing(1)).toBe(1);

      // Bounce should have varying values
      const values = [0.2, 0.4, 0.6, 0.8].map(t => bounceEasing(t));
      expect(values).toEqual(expect.arrayContaining([expect.any(Number)]));
    });
  });

  describe('reduced motion support', () => {
    test('should respect prefers-reduced-motion', async () => {
      // Mock matchMedia to indicate reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn((query) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      // Create new animation system to pick up the preference
      const reducedMotionSystem = new AnimationSystem();

      let finalValue = 0;

      const promise = reducedMotionSystem.animate(
        'test-reduced-motion',
        0,
        100,
        { duration: 1000 }, // Long duration
        (progress, value) => {
          finalValue = value;
        }
      );

      await promise;

      // Should skip animation and go directly to end value
      expect(finalValue).toBe(100);
      expect(reducedMotionSystem.isAnimating()).toBe(false);

      reducedMotionSystem.stop();
    });
  });
});