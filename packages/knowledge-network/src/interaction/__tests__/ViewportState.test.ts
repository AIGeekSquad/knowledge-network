/**
 * Tests for ViewportState class
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { ViewportState } from '../ViewportState';
import type { InteractionConfig } from '../types';

describe('ViewportState', () => {
  let viewport: ViewportState;
  const width = 800;
  const height = 600;

  beforeEach(() => {
    viewport = new ViewportState(width, height);
  });

  describe('initialization', () => {
    test('should initialize with default values', () => {
      const state = viewport.getState();

      expect(state.zoom).toBe(1);
      expect(state.pan).toEqual({ x: 0, y: 0 });
      expect(state.width).toBe(width);
      expect(state.height).toBe(height);
      expect(state.minZoom).toBe(0.1);
      expect(state.maxZoom).toBe(10);
    });

    test('should initialize with custom config', () => {
      const config: Partial<InteractionConfig> = {
        viewport: {
          initialZoom: 2,
          initialPan: { x: 100, y: 50 },
          minZoom: 0.5,
          maxZoom: 5,
        },
      };

      const customViewport = new ViewportState(width, height, config);
      const state = customViewport.getState();

      expect(state.zoom).toBe(2);
      expect(state.pan).toEqual({ x: 100, y: 50 });
      expect(state.minZoom).toBe(0.5);
      expect(state.maxZoom).toBe(5);
    });
  });

  describe('zoom operations', () => {
    test('should set zoom within limits', () => {
      expect(viewport.setZoom(2)).toBe(true);
      expect(viewport.getZoom()).toBe(2);

      expect(viewport.setZoom(0.05)).toBe(true); // Below min, should be clamped
      expect(viewport.getZoom()).toBe(0.1);

      expect(viewport.setZoom(15)).toBe(true); // Above max, should be clamped
      expect(viewport.getZoom()).toBe(10);
    });

    test('should not change zoom if already at target', () => {
      viewport.setZoom(2);
      expect(viewport.setZoom(2)).toBe(false); // No change
    });

    test('should zoom towards center point', () => {
      const center = { x: 200, y: 150 };
      viewport.setZoom(2, center);

      // After zooming to 2x at center point, the world point under center
      // should remain at the same screen position
      const worldPointUnderCenter = viewport.screenToWorld(center);
      viewport.setZoom(4, center);
      const newScreenPos = viewport.worldToScreen(worldPointUnderCenter);

      expect(Math.abs(newScreenPos.x - center.x)).toBeLessThan(1);
      expect(Math.abs(newScreenPos.y - center.y)).toBeLessThan(1);
    });

    test('should adjust zoom by factor', () => {
      viewport.setZoom(2);
      viewport.adjustZoom(1.5);
      expect(viewport.getZoom()).toBe(3);

      viewport.adjustZoom(0.5);
      expect(viewport.getZoom()).toBe(1.5);
    });
  });

  describe('pan operations', () => {
    test('should set pan offset', () => {
      expect(viewport.setPan({ x: 100, y: 50 })).toBe(true);
      expect(viewport.getPan()).toEqual({ x: 100, y: 50 });
    });

    test('should not change pan if already at target', () => {
      viewport.setPan({ x: 100, y: 50 });
      expect(viewport.setPan({ x: 100, y: 50 })).toBe(false);
    });

    test('should respect pan bounds', () => {
      viewport.setPanBounds({
        minX: -50,
        maxX: 50,
        minY: -25,
        maxY: 25,
      });

      viewport.setPan({ x: 100, y: 100 }); // Beyond bounds
      const pan = viewport.getPan();
      expect(pan.x).toBe(50); // Clamped to max
      expect(pan.y).toBe(25); // Clamped to max

      viewport.setPan({ x: -100, y: -100 }); // Beyond bounds
      const pan2 = viewport.getPan();
      expect(pan2.x).toBe(-50); // Clamped to min
      expect(pan2.y).toBe(-25); // Clamped to min
    });

    test('should adjust pan by delta', () => {
      viewport.setPan({ x: 10, y: 20 });
      viewport.adjustPan({ x: 5, y: -10 });
      expect(viewport.getPan()).toEqual({ x: 15, y: 10 });
    });
  });

  describe('coordinate transformations', () => {
    beforeEach(() => {
      viewport.setZoom(2);
      viewport.setPan({ x: 10, y: 20 });
    });

    test('should transform screen to world coordinates', () => {
      const screenPoint = { x: 100, y: 50 };
      const worldPoint = viewport.screenToWorld(screenPoint);

      expect(worldPoint.x).toBe((100 - 10) / 2); // (screen - pan) / zoom
      expect(worldPoint.y).toBe((50 - 20) / 2);
    });

    test('should transform world to screen coordinates', () => {
      const worldPoint = { x: 45, y: 15 };
      const screenPoint = viewport.worldToScreen(worldPoint);

      expect(screenPoint.x).toBe(45 * 2 + 10); // world * zoom + pan
      expect(screenPoint.y).toBe(15 * 2 + 20);
    });

    test('should have consistent round-trip transformations', () => {
      const originalScreen = { x: 150, y: 200 };
      const world = viewport.screenToWorld(originalScreen);
      const backToScreen = viewport.worldToScreen(world);

      expect(Math.abs(backToScreen.x - originalScreen.x)).toBeLessThan(0.001);
      expect(Math.abs(backToScreen.y - originalScreen.y)).toBeLessThan(0.001);
    });

    test('should transform rectangles correctly', () => {
      const screenRect = { x: 50, y: 100, width: 200, height: 150 };
      const worldRect = viewport.screenRectToWorld(screenRect);

      expect(worldRect.x).toBe((50 - 10) / 2);
      expect(worldRect.y).toBe((100 - 20) / 2);
      expect(worldRect.width).toBe(200 / 2);
      expect(worldRect.height).toBe(150 / 2);
    });
  });

  describe('viewport bounds and visibility', () => {
    test('should calculate world bounds correctly', () => {
      viewport.setZoom(2);
      viewport.setPan({ x: 100, y: 50 });

      const bounds = viewport.getWorldBounds();

      expect(bounds.minX).toBe((0 - 100) / 2);
      expect(bounds.minY).toBe((0 - 50) / 2);
      expect(bounds.maxX).toBe((width - 100) / 2);
      expect(bounds.maxY).toBe((height - 50) / 2);
    });

    test('should check point visibility correctly', () => {
      viewport.setZoom(1);
      viewport.setPan({ x: 0, y: 0 });

      // Point inside viewport
      expect(viewport.isPointVisible({ x: 400, y: 300 })).toBe(true);

      // Point outside viewport
      expect(viewport.isPointVisible({ x: -100, y: -100 })).toBe(false);
      expect(viewport.isPointVisible({ x: 1000, y: 1000 })).toBe(false);

      // Point at edge (with margin)
      expect(viewport.isPointVisible({ x: -5, y: -5 }, 10)).toBe(true);
    });

    test('should check rectangle visibility correctly', () => {
      viewport.setZoom(1);
      viewport.setPan({ x: 0, y: 0 });

      // Rectangle completely inside
      expect(viewport.isRectVisible({ x: 100, y: 100, width: 200, height: 150 })).toBe(true);

      // Rectangle completely outside
      expect(viewport.isRectVisible({ x: -300, y: -200, width: 100, height: 100 })).toBe(false);

      // Rectangle partially overlapping
      expect(viewport.isRectVisible({ x: 700, y: 500, width: 200, height: 200 })).toBe(true);
    });
  });

  describe('fit to bounds', () => {
    test('should fit content to viewport with padding', () => {
      const contentBounds = {
        minX: -100,
        minY: -50,
        maxX: 100,
        maxY: 50,
      };

      viewport.fitToBounds(contentBounds, 50);
      const state = viewport.getState();

      // Content size: 200x100
      // Available space: (800-100)x(600-100) = 700x500
      // Zoom should be min(700/200, 500/100) = min(3.5, 5) = 3.5
      expect(state.zoom).toBeCloseTo(3.5, 1);

      // Pan should center the content
      const expectedPanX = width / 2 / state.zoom - 0; // Content center X is 0
      const expectedPanY = height / 2 / state.zoom - 0; // Content center Y is 0
      expect(state.pan.x).toBeCloseTo(expectedPanX, 1);
      expect(state.pan.y).toBeCloseTo(expectedPanY, 1);
    });

    test('should handle empty content bounds', () => {
      const emptyBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

      viewport.setZoom(2);
      viewport.setPan({ x: 100, y: 50 });

      viewport.fitToBounds(emptyBounds);

      // Should reset to default state
      const state = viewport.getState();
      expect(state.zoom).toBe(1);
      expect(state.pan).toEqual({ x: 0, y: 0 });
    });
  });

  describe('reset and dimensions', () => {
    test('should reset to initial state', () => {
      viewport.setZoom(3);
      viewport.setPan({ x: 200, y: 100 });

      viewport.reset(1.5, { x: 50, y: 25 });

      expect(viewport.getZoom()).toBe(1.5);
      expect(viewport.getPan()).toEqual({ x: 50, y: 25 });
    });

    test('should update dimensions', () => {
      viewport.updateDimensions(1000, 800);

      const state = viewport.getState();
      expect(state.width).toBe(1000);
      expect(state.height).toBe(800);
    });
  });

  describe('zoom limits', () => {
    test('should set new zoom limits', () => {
      viewport.setZoomLimits(0.5, 8);

      const state = viewport.getState();
      expect(state.minZoom).toBe(0.5);
      expect(state.maxZoom).toBe(8);
    });

    test('should re-apply current zoom to new limits', () => {
      viewport.setZoom(0.05); // Below new limit
      viewport.setZoomLimits(0.2, 5);

      expect(viewport.getZoom()).toBe(0.2); // Should be clamped to new min
    });
  });

  describe('utility methods', () => {
    test('should clone viewport state', () => {
      viewport.setZoom(2);
      viewport.setPan({ x: 100, y: 50 });

      const cloned = viewport.clone();
      expect(cloned.equals(viewport)).toBe(true);

      // Modify original
      viewport.setZoom(3);
      expect(cloned.equals(viewport)).toBe(false);
    });

    test('should check equality with tolerance', () => {
      const viewport2 = new ViewportState(width, height);

      viewport.setZoom(2.0000001);
      viewport2.setZoom(2.0000002);

      expect(viewport.equals(viewport2, 1e-6)).toBe(true);
      expect(viewport.equals(viewport2, 1e-8)).toBe(false);
    });

    test('should create CSS transform string', () => {
      viewport.setZoom(2);
      viewport.setPan({ x: 50, y: 25 });

      const css = viewport.toCSSTransform();
      expect(css).toBe('translate(50px, 25px) scale(2)');
    });

    test('should get scale factor', () => {
      viewport.setZoom(3);
      expect(viewport.getScale()).toBe(3);
    });
  });
});