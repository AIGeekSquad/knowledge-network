/**
 * GestureRecognizer processes complex touch and mouse patterns
 * into high-level gesture events for the interaction system.
 *
 * Supports:
 * - Multi-touch gestures (pinch, pan, rotate)
 * - Mouse gestures (drag, click, double-click)
 * - Keyboard combinations
 * - Gesture sequences and combinations
 */

import type { Point2D } from '../spatial/types';
import type {
  GestureType,
  GestureData,
  GestureEvent, TouchPoint, InteractionConfig,
} from './types';
import { calculateDistance, throttle } from './types';

export interface GestureRecognizerConfig {
  // Timing thresholds (ms)
  tapTimeout: number;
  doubleTapTimeout: number;
  longPressTimeout: number;

  // Distance thresholds (pixels)
  tapMaxDistance: number;
  panThreshold: number;
  swipeThreshold: number;
  pinchThreshold: number;

  // Velocity thresholds (pixels/ms)
  swipeMinVelocity: number;

  // Multi-touch
  maxTouchPoints: number;
  touchTimeout: number;

  // Debouncing
  gestureThrottleDelay: number;
}

export const DEFAULT_GESTURE_CONFIG: GestureRecognizerConfig = {
  tapTimeout: 200,
  doubleTapTimeout: 300,
  longPressTimeout: 500,
  tapMaxDistance: 10,
  panThreshold: 5,
  swipeThreshold: 50,
  pinchThreshold: 10,
  swipeMinVelocity: 0.5,
  maxTouchPoints: 10,
  touchTimeout: 100,
  gestureThrottleDelay: 16, // 60fps
};

interface ActiveTouch {
  id: number;
  startPosition: Point2D;
  currentPosition: Point2D;
  previousPosition: Point2D;
  startTime: number;
  lastUpdateTime: number;
  pressure: number;
}

interface GestureState {
  type: GestureType | null;
  startTime: number;
  isActive: boolean;
  data: Partial<GestureData>;
}

export class GestureRecognizer {
  private config: GestureRecognizerConfig;
  private activeTouches = new Map<number, ActiveTouch>();
  private gestureState: GestureState;
  private eventCallbacks = new Map<GestureType, ((_event: GestureEvent) => void)[]>();

  // Timing and state tracking
  private lastTapTime = 0;
  private lastTapPosition: Point2D = { x: 0, y: 0 };
  private longPressTimer: number | null = null;
  private tapTimer: number | null = null;

  // Mouse state
  private mouseDown = false;
  private mouseStartPosition: Point2D = { x: 0, y: 0 };
  private mouseStartTime = 0;

  // Throttled gesture emission
  private emitGesture: (gesture: GestureType, data: GestureData) => void;

  constructor(config: Partial<GestureRecognizerConfig> = {}) {
    this.config = { ...DEFAULT_GESTURE_CONFIG, ...config };

    this.gestureState = {
      type: null,
      startTime: 0,
      isActive: false,
      data: {},
    };

    // Create throttled gesture emitter
    this.emitGesture = throttle((gesture: GestureType, data: GestureData) => {
      this.fireGestureEvent(gesture, data);
    }, this.config.gestureThrottleDelay);
  }

  // === Configuration ===

  updateConfig(config: Partial<GestureRecognizerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): GestureRecognizerConfig {
    return { ...this.config };
  }

  // === Event Handlers Registration ===

  on(gestureType: GestureType, callback: (_event: GestureEvent) => void): void {
    if (!this.eventCallbacks.has(gestureType)) {
      this.eventCallbacks.set(gestureType, []);
    }
    this.eventCallbacks.get(gestureType)!.push(callback);
  }

  off(gestureType: GestureType, callback?: (_event: GestureEvent) => void): void {
    if (!callback) {
      this.eventCallbacks.delete(gestureType);
      return;
    }

    const callbacks = this.eventCallbacks.get(gestureType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index >= 0) {
        callbacks.splice(index, 1);
      }
    }
  }

  // === Touch Event Handling ===

  handleTouchStart(_event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const position = { x: touch.clientX, y: touch.clientY };

      const activeTouch: ActiveTouch = {
        id: touch.identifier,
        startPosition: position,
        currentPosition: position,
        previousPosition: position,
        startTime: currentTime,
        lastUpdateTime: currentTime,
        pressure: touch.force || 1.0,
      };

      this.activeTouches.set(touch.identifier, activeTouch);
    }

    this.processGestureStart(currentTime);
  }

  handleTouchMove(_event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();
    let hasValidTouch = false;

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      const activeTouch = this.activeTouches.get(touch.identifier);

      if (!activeTouch) continue;

      activeTouch.previousPosition = activeTouch.currentPosition;
      activeTouch.currentPosition = { x: touch.clientX, y: touch.clientY };
      activeTouch.lastUpdateTime = currentTime;
      activeTouch.pressure = touch.force || 1.0;

      hasValidTouch = true;
    }

    if (hasValidTouch) {
      this.processGestureMove(currentTime);
    }
  }

  handleTouchEnd(_event: TouchEvent): void {
    event.preventDefault();

    const currentTime = Date.now();

    for (let i = 0; i < event.changedTouches.length; i++) {
      const touch = event.changedTouches[i];
      this.activeTouches.delete(touch.identifier);
    }

    this.processGestureEnd(currentTime);
  }

  handleTouchCancel(_event: TouchEvent): void {
    this.cancelAllGestures();
  }

  // === Mouse Event Handling ===

  handleMouseDown(_event: MouseEvent): void {
    const position = { x: event.clientX, y: event.clientY };
    const currentTime = Date.now();

    this.mouseDown = true;
    this.mouseStartPosition = position;
    this.mouseStartTime = currentTime;

    // Simulate a single touch for gesture processing
    const mouseTouch: ActiveTouch = {
      id: -1, // Special ID for mouse
      startPosition: position,
      currentPosition: position,
      previousPosition: position,
      startTime: currentTime,
      lastUpdateTime: currentTime,
      pressure: 1.0,
    };

    this.activeTouches.set(-1, mouseTouch);
    this.processGestureStart(currentTime);
  }

  handleMouseMove(_event: MouseEvent): void {
    if (!this.mouseDown) return;

    const position = { x: event.clientX, y: event.clientY };
    const currentTime = Date.now();
    const mouseTouch = this.activeTouches.get(-1);

    if (mouseTouch) {
      mouseTouch.previousPosition = mouseTouch.currentPosition;
      mouseTouch.currentPosition = position;
      mouseTouch.lastUpdateTime = currentTime;

      this.processGestureMove(currentTime);
    }
  }

  handleMouseUp(_event: MouseEvent): void {
    if (!this.mouseDown) return;

    const currentTime = Date.now();
    this.mouseDown = false;

    this.activeTouches.delete(-1);
    this.processGestureEnd(currentTime);
  }

  handleMouseWheel(_event: WheelEvent): void {
    // Wheel events are handled directly by InteractionController
    // but could be processed here for gesture combinations
  }

  // === Gesture Processing ===

  private processGestureStart(currentTime: number): void {
    this.clearTimers();

    const touchCount = this.activeTouches.size;

    if (touchCount === 1) {
      // Single touch - could be tap, long press, or pan start
      this.startLongPressTimer();
      this.startTapDetection(currentTime);
    } else if (touchCount === 2) {
      // Two fingers - could be pinch or two-finger pan
      this.startMultiTouchGesture('pinch', currentTime);
    } else if (touchCount === 3) {
      // Three fingers - special gesture
      this.startMultiTouchGesture('threeFingerTap', currentTime);
    }
  }

  private processGestureMove(currentTime: number): void {
    const touchCount = this.activeTouches.size;
    const touches = Array.from(this.activeTouches.values());

    if (touchCount === 0) return;

    if (touchCount === 1) {
      this.processSingleTouchMove(touches[0], currentTime);
    } else if (touchCount === 2) {
      this.processTwoFingerMove(touches, currentTime);
    } else if (touchCount >= 3) {
      this.processMultiFingerMove(touches, currentTime);
    }
  }

  private processGestureEnd(currentTime: number): void {
    const touchCount = this.activeTouches.size;

    if (touchCount === 0) {
      // All touches ended
      this.finalizePendingGestures(currentTime);
      this.resetGestureState();
    } else {
      // Some touches remain - transition to new gesture
      this.processGestureStart(currentTime);
    }
  }

  private processSingleTouchMove(touch: ActiveTouch, currentTime: number): void {
    const distance = calculateDistance(touch.startPosition, touch.currentPosition);

    // Cancel tap if moved too far
    if (distance > this.config.tapMaxDistance) {
      this.cancelTapDetection();
      this.cancelLongPress();
    }

    // Start pan gesture if moved enough
    if (distance > this.config.panThreshold && !this.gestureState.isActive) {
      this.startGesture('pan', currentTime, {
        startPosition: touch.startPosition,
        currentPosition: touch.currentPosition,
        deltaPosition: {
          x: touch.currentPosition.x - touch.startPosition.x,
          y: touch.currentPosition.y - touch.startPosition.y,
        },
        velocity: this.calculateVelocity(touch),
        touchCount: 1,
      });
    } else if (this.gestureState.type === 'pan') {
      // Continue pan gesture
      this.updateGesture('pan', {
        currentPosition: touch.currentPosition,
        deltaPosition: {
          x: touch.currentPosition.x - touch.startPosition.x,
          y: touch.currentPosition.y - touch.startPosition.y,
        },
        velocity: this.calculateVelocity(touch),
      });
    }
  }

  private processTwoFingerMove(touches: ActiveTouch[], currentTime: number): void {
    const [touch1, touch2] = touches;

    // Calculate current and previous distances for pinch detection
    const currentDistance = calculateDistance(touch1.currentPosition, touch2.currentPosition);
    const previousDistance = calculateDistance(touch1.previousPosition, touch2.previousPosition);
    const startDistance = calculateDistance(touch1.startPosition, touch2.startPosition);

    const scale = currentDistance / startDistance;
    const deltaScale = currentDistance / previousDistance;

    // Calculate center point
    const center: Point2D = {
      x: (touch1.currentPosition.x + touch2.currentPosition.x) / 2,
      y: (touch1.currentPosition.y + touch2.currentPosition.y) / 2,
    };

    const startCenter: Point2D = {
      x: (touch1.startPosition.x + touch2.startPosition.x) / 2,
      y: (touch1.startPosition.y + touch2.startPosition.y) / 2,
    };

    // Determine if this is a pinch or two-finger pan
    const scaleChange = Math.abs(scale - 1.0);
    const panDistance = calculateDistance(center, startCenter);

    if (scaleChange > 0.1 || this.gestureState.type === 'pinch') {
      // Pinch gesture
      if (!this.gestureState.isActive) {
        this.startGesture('pinch', currentTime, {
          startPosition: startCenter,
          currentPosition: center,
          scale,
          touchCount: 2,
        });
      } else {
        this.updateGesture('pinch', {
          currentPosition: center,
          scale,
        });
      }
    } else if (panDistance > this.config.panThreshold || this.gestureState.type === 'twoFingerPan') {
      // Two-finger pan
      if (!this.gestureState.isActive) {
        this.startGesture('twoFingerPan', currentTime, {
          startPosition: startCenter,
          currentPosition: center,
          deltaPosition: {
            x: center.x - startCenter.x,
            y: center.y - startCenter.y,
          },
          touchCount: 2,
        });
      } else {
        this.updateGesture('twoFingerPan', {
          currentPosition: center,
          deltaPosition: {
            x: center.x - startCenter.x,
            y: center.y - startCenter.y,
          },
        });
      }
    }
  }

  private processMultiFingerMove(touches: ActiveTouch[], currentTime: number): void {
    // For 3+ fingers, treat as multi-finger pan
    const center = this.calculateCenterPoint(touches.map(t => t.currentPosition));
    const startCenter = this.calculateCenterPoint(touches.map(t => t.startPosition));

    const deltaPosition = {
      x: center.x - startCenter.x,
      y: center.y - startCenter.y,
    };

    if (!this.gestureState.isActive) {
      this.startGesture('pan', currentTime, {
        startPosition: startCenter,
        currentPosition: center,
        deltaPosition,
        touchCount: touches.length,
      });
    } else {
      this.updateGesture('pan', {
        currentPosition: center,
        deltaPosition,
        touchCount: touches.length,
      });
    }
  }

  // === Gesture State Management ===

  private startGesture(type: GestureType, startTime: number, data: Partial<GestureData>): void {
    this.gestureState = {
      type,
      startTime,
      isActive: true,
      data: { ...data, duration: 0 },
    };

    this.emitGesture(type, this.createGestureData(data));
  }

  private updateGesture(type: GestureType, data: Partial<GestureData>): void {
    if (this.gestureState.type !== type) return;

    this.gestureState.data = { ...this.gestureState.data, ...data };
    this.gestureState.data.duration = Date.now() - this.gestureState.startTime;

    this.emitGesture(type, this.createGestureData(this.gestureState.data));
  }

  private finalizePendingGestures(currentTime: number): void {
    if (this.gestureState.isActive) {
      // Finalize active gesture
      const duration = currentTime - this.gestureState.startTime;

      if (this.gestureState.type === 'pan') {
        // Check if pan was actually a swipe
        const touches = Array.from(this.activeTouches.values());
        if (touches.length > 0) {
          const velocity = this.calculateVelocity(touches[0]);
          const velocityMagnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

          if (velocityMagnitude > this.config.swipeMinVelocity) {
            this.emitGesture('swipe', this.createGestureData({
              ...this.gestureState.data,
              velocity,
              duration,
            }));
          }
        }
      }
    } else {
      // Check for tap gestures
      this.processPendingTap(currentTime);
    }
  }

  private startMultiTouchGesture(type: GestureType, startTime: number): void {
    const touches = Array.from(this.activeTouches.values());
    const center = this.calculateCenterPoint(touches.map(t => t.currentPosition));

    this.startGesture(type, startTime, {
      startPosition: center,
      currentPosition: center,
      touchCount: touches.length,
    });
  }

  private resetGestureState(): void {
    this.gestureState = {
      type: null,
      startTime: 0,
      isActive: false,
      data: {},
    };
  }

  // === Tap Detection ===

  private startTapDetection(currentTime: number): void {
    this.cancelTapTimer();

    this.tapTimer = window.setTimeout(() => {
      // Single tap confirmed
      const touches = Array.from(this.activeTouches.values());
      if (touches.length === 1) {
        const touch = touches[0];
        const distance = calculateDistance(touch.startPosition, touch.currentPosition);

        if (distance <= this.config.tapMaxDistance) {
          this.processTap(touch.currentPosition, currentTime);
        }
      }
      this.tapTimer = null;
    }, this.config.tapTimeout);
  }

  private processTap(position: Point2D, currentTime: number): void {
    const timeSinceLastTap = currentTime - this.lastTapTime;
    const distanceFromLastTap = calculateDistance(position, this.lastTapPosition);

    if (
      timeSinceLastTap < this.config.doubleTapTimeout &&
      distanceFromLastTap <= this.config.tapMaxDistance
    ) {
      // Double tap
      this.emitGesture('doubleTap', this.createGestureData({
        startPosition: position,
        currentPosition: position,
        touchCount: 1,
      }));

      this.lastTapTime = 0; // Reset to prevent triple tap
    } else {
      // Single tap
      this.emitGesture('tap', this.createGestureData({
        startPosition: position,
        currentPosition: position,
        touchCount: 1,
      }));

      this.lastTapTime = currentTime;
      this.lastTapPosition = position;
    }
  }

  private cancelTapDetection(): void {
    this.cancelTapTimer();
  }

  private cancelTapTimer(): void {
    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
      this.tapTimer = null;
    }
  }

  private processPendingTap(currentTime: number): void {
    if (this.tapTimer) {
      // Force tap processing
      clearTimeout(this.tapTimer);
      this.tapTimer = null;

      const touches = Array.from(this.activeTouches.values());
      if (touches.length === 1) {
        this.processTap(touches[0].currentPosition, currentTime);
      }
    }
  }

  // === Long Press Detection ===

  private startLongPressTimer(): void {
    this.cancelLongPress();

    this.longPressTimer = window.setTimeout(() => {
      const touches = Array.from(this.activeTouches.values());
      if (touches.length === 1) {
        const touch = touches[0];
        const distance = calculateDistance(touch.startPosition, touch.currentPosition);

        if (distance <= this.config.tapMaxDistance) {
          this.emitGesture('longPress', this.createGestureData({
            startPosition: touch.startPosition,
            currentPosition: touch.currentPosition,
            duration: Date.now() - touch.startTime,
            touchCount: 1,
          }));
        }
      }
      this.longPressTimer = null;
    }, this.config.longPressTimeout);
  }

  private cancelLongPress(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  // === Utilities ===

  private calculateVelocity(touch: ActiveTouch): Point2D {
    const timeDelta = touch.lastUpdateTime - (touch.lastUpdateTime - 16); // Assume 16ms frame
    const positionDelta = {
      x: touch.currentPosition.x - touch.previousPosition.x,
      y: touch.currentPosition.y - touch.previousPosition.y,
    };

    return {
      x: positionDelta.x / Math.max(timeDelta, 1),
      y: positionDelta.y / Math.max(timeDelta, 1),
    };
  }

  private calculateCenterPoint(positions: Point2D[]): Point2D {
    if (positions.length === 0) return { x: 0, y: 0 };

    const sum = positions.reduce(
      (acc, pos) => ({ x: acc.x + pos.x, y: acc.y + pos.y }),
      { x: 0, y: 0 }
    );

    return {
      x: sum.x / positions.length,
      y: sum.y / positions.length,
    };
  }

  private createGestureData(data: Partial<GestureData>): GestureData {
    return {
      startPosition: data.startPosition || { x: 0, y: 0 },
      currentPosition: data.currentPosition || { x: 0, y: 0 },
      deltaPosition: data.deltaPosition || { x: 0, y: 0 },
      velocity: data.velocity,
      scale: data.scale,
      rotation: data.rotation,
      touchCount: data.touchCount,
      duration: data.duration,
    };
  }

  private fireGestureEvent(gesture: GestureType, data: GestureData): void {
    const _event: GestureEvent = {
      type: 'gesture',
      gesture,
      data,
      timestamp: Date.now(),
      cancelled: false,
    };

    const callbacks = this.eventCallbacks.get(gesture);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(_event);
        } catch (error) {
          console.error('Error in gesture callback:', error);
        }
      });
    }
  }

  private clearTimers(): void {
    this.cancelTapTimer();
    this.cancelLongPress();
  }

  private cancelAllGestures(): void {
    this.clearTimers();
    this.activeTouches.clear();
    this.resetGestureState();
    this.mouseDown = false;
  }

  // === Public Methods ===

  /**
   * Cancel all active gestures and reset state
   */
  reset(): void {
    this.cancelAllGestures();
  }

  /**
   * Get current gesture state
   */
  getCurrentGesture(): { type: GestureType | null; data: Partial<GestureData> } {
    return {
      type: this.gestureState.type,
      data: { ...this.gestureState.data },
    };
  }

  /**
   * Check if a specific gesture type is currently active
   */
  isGestureActive(gestureType: GestureType): boolean {
    return this.gestureState.type === gestureType && this.gestureState.isActive;
  }

  /**
   * Get number of active touch points
   */
  getActiveTouchCount(): number {
    return this.activeTouches.size;
  }
}