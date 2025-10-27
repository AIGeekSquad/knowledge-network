/**
 * Performance Demo Tests - TDD approach
 * Write tests first to define what actually should work
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock performance API for testing
global.performance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000
  }
} as any;

global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

describe('Performance Demo - Real FPS Calculation', () => {
  let dom: JSDOM;
  let container: HTMLElement;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="container"></div>');
    global.document = dom.window.document;
    global.window = dom.window as any;
    container = dom.window.document.getElementById('container')!;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('FPS Calculation', () => {
    it('should calculate real FPS using RequestAnimationFrame timing', async () => {
      const { FPSCalculator } = await import('../../src/components/performance/FPSCalculator.js');

      const calculator = new FPSCalculator();

      // Mock time progression for 60fps
      let currentTime = 0;
      (performance.now as any).mockImplementation(() => {
        currentTime += 16.67; // ~60fps
        return currentTime;
      });

      calculator.start();

      // Simulate several frames
      for (let i = 0; i < 5; i++) {
        calculator.recordFrame();
      }

      const fps = calculator.getCurrentFPS();

      // Should calculate real FPS, not return hardcoded 60
      expect(fps).toBeGreaterThan(55);
      expect(fps).toBeLessThan(65);
      expect(fps).not.toBe(60); // Should not be exactly 60 (hardcoded)
    });

    it('should show lower FPS with increased computational load', async () => {
      const { FPSCalculator } = await import('../../src/components/performance/FPSCalculator.js');

      const calculator = new FPSCalculator();

      // Mock slower frame times
      let currentTime = 0;
      (performance.now as any).mockImplementation(() => {
        currentTime += 33.33; // ~30fps
        return currentTime;
      });

      calculator.start();

      // Simulate frames
      for (let i = 0; i < 5; i++) {
        calculator.recordFrame();
      }

      const fps = calculator.getCurrentFPS();

      expect(fps).toBeLessThan(35);
      expect(fps).toBeGreaterThan(25);
    });
  });

  describe('Interactive Elements', () => {
    it('should respond to double-click events', async () => {
      const { PerformanceOverlay } = await import('../../src/components/performance/PerformanceOverlay.js');

      const overlay = new PerformanceOverlay(container);
      await overlay.initialize();

      const toggleSpy = vi.fn();
      overlay.onToggle = toggleSpy;

      // Simulate double-click
      const event = new dom.window.Event('dblclick');
      overlay.getElement().dispatchEvent(event);

      expect(toggleSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Performance Metrics', () => {
    it('should measure actual render time not return zero', async () => {
      const { PerformanceDemo } = await import('../../src/components/performance/PerformanceDemo.js');

      const demo = new PerformanceDemo(container);

      // Mock render operation that takes time
      const renderTime = await demo.measureRenderTime(() => {
        // Simulate actual work
        for (let i = 0; i < 1000; i++) {
          Math.random() * Math.PI;
        }
      });

      expect(renderTime).toBeGreaterThan(0);
      expect(renderTime).toBeLessThan(100); // Should be reasonable
    });

    it('should track render time scaling behavior', async () => {
      const { PerformanceDemo } = await import('../../src/components/performance/PerformanceDemo.js');

      const demo = new PerformanceDemo(container);

      const time1 = await demo.measureGraphRender(10);
      const time2 = await demo.measureGraphRender(50);
      const time3 = await demo.measureGraphRender(100);

      // All should be measurable (> 0)
      expect(time1).toBeGreaterThan(0);
      expect(time2).toBeGreaterThan(0);
      expect(time3).toBeGreaterThan(0);

      // At least one should be different (showing it's not hardcoded)
      expect([time1, time2, time3].every(t => t === time1)).toBe(false);
    });
  });
});