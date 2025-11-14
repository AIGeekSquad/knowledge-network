/**
 * Tests for GestureRecognizer class
 */

import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { GestureRecognizer, DEFAULT_GESTURE_CONFIG } from '../GestureRecognizer';
import type { GestureEvent } from '../types';

// Mock DOM methods
Object.defineProperty(window, 'setTimeout', {
  value: vi.fn((callback, delay) => {
    const id = Math.random();
    // Execute immediately for test predictability
    setTimeout(() => callback(), 0);
    return id;
  }),
});

Object.defineProperty(window, 'clearTimeout', {
  value: vi.fn(),
});

describe('GestureRecognizer', () => {
  let gestureRecognizer: GestureRecognizer;
  let mockCallback: vi.Mock;

  beforeEach(() => {
    gestureRecognizer = new GestureRecognizer();
    mockCallback = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('configuration', () => {
    test('should initialize with default config', () => {
      const config = gestureRecognizer.getConfig();
      expect(config).toEqual(DEFAULT_GESTURE_CONFIG);
    });

    test('should update configuration', () => {
      const newConfig = {
        tapTimeout: 100,
        panThreshold: 10,
      };

      gestureRecognizer.updateConfig(newConfig);
      const config = gestureRecognizer.getConfig();

      expect(config.tapTimeout).toBe(100);
      expect(config.panThreshold).toBe(10);
      expect(config.doubleTapTimeout).toBe(DEFAULT_GESTURE_CONFIG.doubleTapTimeout); // Unchanged
    });
  });

  describe('event handler registration', () => {
    test('should register and call event handlers', () => {
      gestureRecognizer.on('tap', mockCallback);

      // Simulate tap gesture recognition
      const mockEvent: GestureEvent = {
        type: 'gesture',
        gesture: 'tap',
        data: {
          startPosition: { x: 100, y: 100 },
          currentPosition: { x: 100, y: 100 },
          deltaPosition: { x: 0, y: 0 },
          touchCount: 1,
        },
        timestamp: Date.now(),
        cancelled: false,
      };

      // Manually trigger event to test handler
      (gestureRecognizer as any).fireGestureEvent('tap', mockEvent.data);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'tap',
          data: expect.objectContaining({
            startPosition: { x: 100, y: 100 },
            currentPosition: { x: 100, y: 100 },
          }),
        })
      );
    });

    test('should remove event handlers', () => {
      gestureRecognizer.on('tap', mockCallback);
      gestureRecognizer.off('tap', mockCallback);

      // Manually trigger event
      (gestureRecognizer as any).fireGestureEvent('tap', {
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        deltaPosition: { x: 0, y: 0 },
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    test('should remove all handlers for gesture type', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      gestureRecognizer.on('tap', callback1);
      gestureRecognizer.on('tap', callback2);
      gestureRecognizer.off('tap'); // Remove all

      // Manually trigger event
      (gestureRecognizer as any).fireGestureEvent('tap', {
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        deltaPosition: { x: 0, y: 0 },
      });

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe('mouse gesture recognition', () => {
    test('should handle mouse down/up for tap', async () => {
      gestureRecognizer.on('tap', mockCallback);

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });

      const mouseUp = new MouseEvent('mouseup', {
        clientX: 100,
        clientY: 100,
        bubbles: true,
      });

      gestureRecognizer.handleMouseDown(mouseDown);

      // Wait a bit to avoid immediate tap
      await new Promise(resolve => setTimeout(resolve, 10));

      gestureRecognizer.handleMouseUp(mouseUp);

      // Give time for timeout to process
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'tap',
        })
      );
    });

    test('should detect pan gesture on mouse move', () => {
      gestureRecognizer.on('pan', mockCallback);

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 120,
        clientY: 130,
      });

      gestureRecognizer.handleMouseDown(mouseDown);
      gestureRecognizer.handleMouseMove(mouseMove);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'pan',
          data: expect.objectContaining({
            deltaPosition: { x: 20, y: 30 },
          }),
        })
      );
    });

    test('should not trigger tap on large movement', async () => {
      gestureRecognizer.on('tap', mockCallback);

      const mouseDown = new MouseEvent('mousedown', {
        clientX: 100,
        clientY: 100,
      });

      const mouseMove = new MouseEvent('mousemove', {
        clientX: 150, // Move beyond tap threshold
        clientY: 150,
      });

      const mouseUp = new MouseEvent('mouseup', {
        clientX: 150,
        clientY: 150,
      });

      gestureRecognizer.handleMouseDown(mouseDown);
      gestureRecognizer.handleMouseMove(mouseMove);
      gestureRecognizer.handleMouseUp(mouseUp);

      // Wait for potential tap timeout
      await new Promise(resolve => setTimeout(resolve, 250));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('touch gesture recognition', () => {
    function createTouch(id: number, x: number, y: number): Touch {
      return {
        identifier: id,
        clientX: x,
        clientY: y,
        force: 1.0,
        pageX: x,
        pageY: y,
        radiusX: 1,
        radiusY: 1,
        rotationAngle: 0,
        screenX: x,
        screenY: y,
        target: document.body,
      } as Touch;
    }

    function createTouchEvent(type: string, touches: Touch[]): TouchEvent {
      const touchList = {
        length: touches.length,
        item: (index: number) => touches[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < touches.length; i++) {
            yield touches[i];
          }
        },
      } as TouchList;

      // Add indexed access
      touches.forEach((touch, index) => {
        (touchList as any)[index] = touch;
      });

      return new TouchEvent(type, {
        touches: touchList,
        changedTouches: touchList,
        targetTouches: touchList,
        bubbles: true,
        cancelable: true,
      });
    }

    test('should handle single touch tap', async () => {
      gestureRecognizer.on('tap', mockCallback);

      const touch1 = createTouch(1, 100, 100);
      const touchStart = createTouchEvent('touchstart', [touch1]);
      const touchEnd = createTouchEvent('touchend', []);

      gestureRecognizer.handleTouchStart(touchStart);

      await new Promise(resolve => setTimeout(resolve, 50));

      gestureRecognizer.handleTouchEnd(touchEnd);

      await new Promise(resolve => setTimeout(resolve, 250));

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'tap',
          data: expect.objectContaining({
            touchCount: 1,
          }),
        })
      );
    });

    test('should detect pinch gesture with two touches', () => {
      gestureRecognizer.on('pinch', mockCallback);

      const touch1 = createTouch(1, 100, 100);
      const touch2 = createTouch(2, 200, 100);
      const touchStart = createTouchEvent('touchstart', [touch1, touch2]);

      // Move touches closer together
      const touch1Move = createTouch(1, 120, 100);
      const touch2Move = createTouch(2, 180, 100);
      const touchMove = createTouchEvent('touchmove', [touch1Move, touch2Move]);

      gestureRecognizer.handleTouchStart(touchStart);
      gestureRecognizer.handleTouchMove(touchMove);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'pinch',
          data: expect.objectContaining({
            touchCount: 2,
            scale: expect.any(Number),
          }),
        })
      );
    });

    test('should detect two-finger pan', () => {
      gestureRecognizer.on('twoFingerPan', mockCallback);

      const touch1 = createTouch(1, 100, 100);
      const touch2 = createTouch(2, 200, 100);
      const touchStart = createTouchEvent('touchstart', [touch1, touch2]);

      // Move both touches in same direction
      const touch1Move = createTouch(1, 110, 120);
      const touch2Move = createTouch(2, 210, 120);
      const touchMove = createTouchEvent('touchmove', [touch1Move, touch2Move]);

      gestureRecognizer.handleTouchStart(touchStart);
      gestureRecognizer.handleTouchMove(touchMove);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'twoFingerPan',
          data: expect.objectContaining({
            touchCount: 2,
            deltaPosition: { x: 10, y: 20 },
          }),
        })
      );
    });

    test('should handle three finger gesture', () => {
      gestureRecognizer.on('threeFingerTap', mockCallback);

      const touch1 = createTouch(1, 100, 100);
      const touch2 = createTouch(2, 200, 100);
      const touch3 = createTouch(3, 150, 200);
      const touchStart = createTouchEvent('touchstart', [touch1, touch2, touch3]);

      gestureRecognizer.handleTouchStart(touchStart);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'threeFingerTap',
          data: expect.objectContaining({
            touchCount: 3,
          }),
        })
      );
    });
  });

  describe('gesture state management', () => {
    test('should track current gesture state', () => {
      const initialState = gestureRecognizer.getCurrentGesture();
      expect(initialState.type).toBeNull();
      expect(initialState.data).toEqual({});
    });

    test('should check if gesture is active', () => {
      expect(gestureRecognizer.isGestureActive('pan')).toBe(false);

      // Simulate starting a pan gesture
      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 120, clientY: 130 });

      gestureRecognizer.handleMouseDown(mouseDown);
      gestureRecognizer.handleMouseMove(mouseMove);

      expect(gestureRecognizer.isGestureActive('pan')).toBe(true);
    });

    test('should get active touch count', () => {
      expect(gestureRecognizer.getActiveTouchCount()).toBe(0);

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      gestureRecognizer.handleMouseDown(mouseDown);

      expect(gestureRecognizer.getActiveTouchCount()).toBe(1); // Mouse counts as touch
    });

    test('should reset gesture state', () => {
      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      gestureRecognizer.handleMouseDown(mouseDown);

      expect(gestureRecognizer.getActiveTouchCount()).toBe(1);

      gestureRecognizer.reset();

      expect(gestureRecognizer.getActiveTouchCount()).toBe(0);
      expect(gestureRecognizer.getCurrentGesture().type).toBeNull();
    });
  });

  describe('double tap detection', () => {
    test('should detect double tap within timeout', async () => {
      gestureRecognizer.on('doubleTap', mockCallback);

      // First tap
      const mouseDown1 = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseUp1 = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      gestureRecognizer.handleMouseDown(mouseDown1);
      gestureRecognizer.handleMouseUp(mouseUp1);

      // Wait for first tap to process
      await new Promise(resolve => setTimeout(resolve, 50));

      // Second tap quickly
      const mouseDown2 = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseUp2 = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      gestureRecognizer.handleMouseDown(mouseDown2);
      gestureRecognizer.handleMouseUp(mouseUp2);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'doubleTap',
        })
      );
    });

    test('should not detect double tap if too far apart', async () => {
      gestureRecognizer.on('doubleTap', mockCallback);

      // First tap
      const mouseDown1 = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseUp1 = new MouseEvent('mouseup', { clientX: 100, clientY: 100 });

      gestureRecognizer.handleMouseDown(mouseDown1);
      gestureRecognizer.handleMouseUp(mouseUp1);

      await new Promise(resolve => setTimeout(resolve, 50));

      // Second tap too far away
      const mouseDown2 = new MouseEvent('mousedown', { clientX: 200, clientY: 200 });
      const mouseUp2 = new MouseEvent('mouseup', { clientX: 200, clientY: 200 });

      gestureRecognizer.handleMouseDown(mouseDown2);
      gestureRecognizer.handleMouseUp(mouseUp2);

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('long press detection', () => {
    test('should detect long press after timeout', async () => {
      gestureRecognizer.on('longPress', mockCallback);

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      gestureRecognizer.handleMouseDown(mouseDown);

      // Wait longer than long press timeout
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          gesture: 'longPress',
          data: expect.objectContaining({
            duration: expect.any(Number),
          }),
        })
      );
    });

    test('should cancel long press on movement', async () => {
      gestureRecognizer.on('longPress', mockCallback);

      const mouseDown = new MouseEvent('mousedown', { clientX: 100, clientY: 100 });
      const mouseMove = new MouseEvent('mousemove', { clientX: 120, clientY: 130 });

      gestureRecognizer.handleMouseDown(mouseDown);
      gestureRecognizer.handleMouseMove(mouseMove); // Movement should cancel long press

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle errors in gesture callbacks gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });

      gestureRecognizer.on('tap', errorCallback);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Manually trigger event that should cause error
      (gestureRecognizer as any).fireGestureEvent('tap', {
        startPosition: { x: 0, y: 0 },
        currentPosition: { x: 0, y: 0 },
        deltaPosition: { x: 0, y: 0 },
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in gesture callback:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});