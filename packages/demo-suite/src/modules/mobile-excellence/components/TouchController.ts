/**
 * Touch Controller Component
 *
 * Handles multi-touch gesture recognition and processing for mobile graph interactions.
 * Provides Xbox-themed touch feedback and gesture analysis.
 */

import { EventEmitter } from '../../../shared/utils.js';
import type { MobileConfig, TouchGesture } from '../MobileExcellence.js';

interface TouchControllerConfig {
  container: HTMLElement;
  config: MobileConfig;
  onGesture: (gesture: TouchGesture) => void;
}

export class TouchController extends EventEmitter<{
  gesture: TouchGesture;
  pointerdown: PointerEvent;
  pointermove: PointerEvent;
  pointerup: PointerEvent;
}> {
  private container: HTMLElement;
  private config: MobileConfig;
  private onGestureCallback: (gesture: TouchGesture) => void;

  private activePointers = new Map<number, PointerEvent>();
  private gestureStartTime = 0;
  private lastTapTime = 0;
  private longPressTimer: number | null = null;

  // Gesture state
  private initialDistance = 0;
  private initialAngle = 0;
  private initialCenter = { x: 0, y: 0 };
  private currentScale = 1;
  private currentRotation = 0;

  constructor({ container, config, onGesture }: TouchControllerConfig) {
    super();
    this.container = container;
    this.config = config;
    this.onGestureCallback = onGesture;

    this.setupEventHandlers();
  }

  updateConfig(config: MobileConfig): void {
    this.config = config;
  }

  handleInteraction(event: any): void {
    // Process interaction events from the main module
    if (event.type === 'touch') {
      this.processGestureEvent(event);
    }
  }

  destroy(): void {
    this.cleanup();
    this.removeAllListeners();
  }

  private setupEventHandlers(): void {
    if (!this.config.enableMultiTouch) return;

    // Use pointer events for better multi-touch support
    this.container.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.container.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.container.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.container.addEventListener('pointercancel', this.handlePointerCancel.bind(this));

    // Prevent default touch behaviors
    this.container.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.container.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    this.container.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
  }

  private handlePointerDown(event: PointerEvent): void {
    event.preventDefault();

    this.activePointers.set(event.pointerId, event);
    this.gestureStartTime = performance.now();

    // Start long press timer for single touch
    if (this.activePointers.size === 1) {
      this.startLongPressTimer(event);
    } else {
      this.clearLongPressTimer();
    }

    // Initialize multi-touch gesture
    if (this.activePointers.size === 2) {
      this.initializeMultiTouchGesture();
    }

    this.emit('pointerdown', event);
  }

  private handlePointerMove(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;

    event.preventDefault();
    this.activePointers.set(event.pointerId, event);

    const pointerCount = this.activePointers.size;

    if (pointerCount === 1) {
      this.processSingleTouchGesture(event);
    } else if (pointerCount === 2) {
      this.processMultiTouchGesture();
    }

    this.emit('pointermove', event);
  }

  private handlePointerUp(event: PointerEvent): void {
    if (!this.activePointers.has(event.pointerId)) return;

    event.preventDefault();

    const wasMultiTouch = this.activePointers.size > 1;
    this.activePointers.delete(event.pointerId);

    this.clearLongPressTimer();

    // Process tap gesture if it was a quick single touch
    if (!wasMultiTouch && this.activePointers.size === 0) {
      this.processTapGesture(event);
    }

    this.emit('pointerup', event);
  }

  private handlePointerCancel(event: PointerEvent): void {
    this.activePointers.delete(event.pointerId);
    this.clearLongPressTimer();
  }

  private initializeMultiTouchGesture(): void {
    const pointers = Array.from(this.activePointers.values());
    if (pointers.length < 2) return;

    const [p1, p2] = pointers;

    this.initialDistance = this.getDistance(p1, p2);
    this.initialAngle = this.getAngle(p1, p2);
    this.initialCenter = this.getCenter(p1, p2);
    this.currentScale = 1;
    this.currentRotation = 0;
  }

  private processSingleTouchGesture(event: PointerEvent): void {
    // Clear long press timer when moving
    this.clearLongPressTimer();

    // Create pan gesture
    const gesture: TouchGesture = {
      type: 'pan',
      startTime: this.gestureStartTime,
      startPosition: this.initialCenter,
      currentPosition: { x: event.clientX, y: event.clientY },
      fingerCount: 1
    };

    this.onGestureCallback(gesture);
  }

  private processMultiTouchGesture(): void {
    const pointers = Array.from(this.activePointers.values());
    if (pointers.length < 2) return;

    const [p1, p2] = pointers;

    const currentDistance = this.getDistance(p1, p2);
    const currentAngle = this.getAngle(p1, p2);
    const currentCenter = this.getCenter(p1, p2);

    // Calculate scale (pinch)
    this.currentScale = currentDistance / this.initialDistance;

    // Calculate rotation
    this.currentRotation = currentAngle - this.initialAngle;

    // Determine primary gesture type based on thresholds
    let gestureType: TouchGesture['type'] = 'pan';

    const scaleThreshold = 0.1; // 10% scale change
    const rotationThreshold = Math.PI / 12; // 15 degrees

    if (Math.abs(this.currentScale - 1) > scaleThreshold) {
      gestureType = 'pinch';
    } else if (Math.abs(this.currentRotation) > rotationThreshold && this.config.enableRotation) {
      gestureType = 'rotate';
    }

    const gesture: TouchGesture = {
      type: gestureType,
      startTime: this.gestureStartTime,
      startPosition: this.initialCenter,
      currentPosition: currentCenter,
      scale: this.currentScale,
      rotation: this.currentRotation,
      fingerCount: pointers.length
    };

    this.onGestureCallback(gesture);
  }

  private processTapGesture(event: PointerEvent): void {
    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;
    const doubleTapThreshold = 300; // ms

    let gestureType: TouchGesture['type'] = 'tap';

    // Check for double tap
    if (timeSinceLastTap < doubleTapThreshold) {
      gestureType = 'doubletap';
    }

    const gesture: TouchGesture = {
      type: gestureType,
      startTime: this.gestureStartTime,
      endTime: now,
      startPosition: { x: event.clientX, y: event.clientY },
      currentPosition: { x: event.clientX, y: event.clientY },
      fingerCount: 1
    };

    this.onGestureCallback(gesture);
    this.lastTapTime = now;
  }

  private processGestureEvent(event: any): void {
    // Process custom interaction events
    const gesture: TouchGesture = {
      type: 'tap',
      startTime: performance.now(),
      startPosition: { x: event.x, y: event.y },
      currentPosition: { x: event.x, y: event.y },
      fingerCount: 1
    };

    this.onGestureCallback(gesture);
  }

  private startLongPressTimer(event: PointerEvent): void {
    this.clearLongPressTimer();

    this.longPressTimer = window.setTimeout(() => {
      const gesture: TouchGesture = {
        type: 'longpress',
        startTime: this.gestureStartTime,
        startPosition: { x: event.clientX, y: event.clientY },
        currentPosition: { x: event.clientX, y: event.clientY },
        fingerCount: 1
      };

      this.onGestureCallback(gesture);
    }, 500); // 500ms for long press
  }

  private clearLongPressTimer(): void {
    if (this.longPressTimer !== null) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private getDistance(p1: PointerEvent, p2: PointerEvent): number {
    const dx = p2.clientX - p1.clientX;
    const dy = p2.clientY - p1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getAngle(p1: PointerEvent, p2: PointerEvent): number {
    return Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX);
  }

  private getCenter(p1: PointerEvent, p2: PointerEvent): { x: number; y: number } {
    return {
      x: (p1.clientX + p2.clientX) / 2,
      y: (p1.clientY + p2.clientY) / 2
    };
  }

  private cleanup(): void {
    this.activePointers.clear();
    this.clearLongPressTimer();
  }
}