/**
 * AnimationSystem provides smooth transitions for viewport changes
 * and other animated interactions in the Knowledge Network.
 *
 * Features:
 * - Multiple easing functions
 * - GPU-accelerated animations when possible
 * - Animation cancellation and chaining
 * - Performance monitoring
 * - RequestAnimationFrame optimization
 */

import type { Point2D } from '../spatial/types';
import type {
  ViewportState as IViewportState,
  AnimationConfig,
  ViewportAnimation,
  EasingFunction,
} from './types';
import { EASING_FUNCTIONS, clamp } from './types';
import { ViewportState } from './ViewportState';

export interface AnimationSystemConfig {
  // Performance
  enableGpuAcceleration: boolean;
  maxConcurrentAnimations: number;
  frameRateTarget: number;

  // Default settings
  defaultDuration: number;
  defaultEasing: EasingFunction;

  // Thresholds
  minAnimationDuration: number;
  maxAnimationDuration: number;
  motionReductionThreshold: number;
}

export const DEFAULT_ANIMATION_CONFIG: AnimationSystemConfig = {
  enableGpuAcceleration: true,
  maxConcurrentAnimations: 5,
  frameRateTarget: 60,
  defaultDuration: 300,
  defaultEasing: EASING_FUNCTIONS.easeInOutQuad,
  minAnimationDuration: 50,
  maxAnimationDuration: 2000,
  motionReductionThreshold: 0.1,
};

interface ActiveAnimation {
  id: string;
  type: 'viewport' | 'custom';
  startTime: number;
  config: AnimationConfig;
  onUpdate: (progress: number, value: any) => void;
  onComplete: () => void;
  startValue: any;
  targetValue: any;
  isActive: boolean;
}

export class AnimationSystem {
  private config: AnimationSystemConfig;
  private activeAnimations = new Map<string, ActiveAnimation>();
  private animationFrame: number | null = null;
  private isRunning = false;
  private lastFrameTime = 0;

  // Performance tracking
  private frameCount = 0;
  private lastFpsCheck = 0;
  private currentFps = 60;

  // Motion preference detection
  private prefersReducedMotion = false;

  constructor(config: Partial<AnimationSystemConfig> = {}) {
    this.config = { ...DEFAULT_ANIMATION_CONFIG, ...config };
    this.detectMotionPreferences();
  }

  // === Configuration ===

  updateConfig(config: Partial<AnimationSystemConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AnimationSystemConfig {
    return { ...this.config };
  }

  // === Viewport Animations ===

  /**
   * Animate viewport zoom to target level
   */
  animateZoom(
    viewport: ViewportState,
    targetZoom: number,
    center?: Point2D,
    config?: Partial<AnimationConfig>
  ): Promise<void> {
    const startZoom = viewport.getZoom();
    const clampedTarget = clamp(targetZoom, 0.1, 10); // Use viewport limits

    if (Math.abs(startZoom - clampedTarget) < 0.001) {
      return Promise.resolve();
    }

    const animConfig = this.createAnimationConfig(config);

    return new Promise((resolve) => {
      this.startAnimation(
        'viewport-zoom',
        startZoom,
        clampedTarget,
        animConfig,
        (progress, value) => {
          viewport.setZoom(value, center);
        },
        resolve
      );
    });
  }

  /**
   * Animate viewport pan to target position
   */
  animatePan(
    viewport: ViewportState,
    targetPan: Point2D,
    config?: Partial<AnimationConfig>
  ): Promise<void> {
    const startPan = viewport.getPan();

    if (
      Math.abs(startPan.x - targetPan.x) < 0.1 &&
      Math.abs(startPan.y - targetPan.y) < 0.1
    ) {
      return Promise.resolve();
    }

    const animConfig = this.createAnimationConfig(config);

    return new Promise((resolve) => {
      this.startAnimation(
        'viewport-pan',
        startPan,
        targetPan,
        animConfig,
        (progress, value) => {
          viewport.setPan(value);
        },
        resolve
      );
    });
  }

  /**
   * Animate viewport to fit bounds
   */
  animateToFit(
    viewport: ViewportState,
    contentBounds: { minX: number; minY: number; maxX: number; maxY: number },
    padding = 50,
    config?: Partial<AnimationConfig>
  ): Promise<void> {
    // Calculate target viewport state
    const targetViewport = viewport.clone();
    targetViewport.fitToBounds(contentBounds, padding);

    return this.animateToViewport(viewport, targetViewport.getState(), config);
  }

  /**
   * Animate viewport reset to initial state
   */
  animateReset(
    viewport: ViewportState,
    initialZoom = 1,
    initialPan: Point2D = { x: 0, y: 0 },
    config?: Partial<AnimationConfig>
  ): Promise<void> {
    const targetState: Partial<IViewportState> = {
      zoom: initialZoom,
      pan: initialPan,
    };

    return this.animateToViewport(viewport, targetState, config);
  }

  /**
   * Animate viewport to a specific state
   */
  animateToViewport(
    viewport: ViewportState,
    targetState: Partial<IViewportState>,
    config?: Partial<AnimationConfig>
  ): Promise<void> {
    const currentState = viewport.getState();
    const animConfig = this.createAnimationConfig(config);

    // Combine all viewport changes into a single animation
    return new Promise((resolve) => {
      this.startAnimation(
        'viewport-combined',
        currentState,
        targetState,
        animConfig,
        (progress, value) => {
          if (value.zoom !== undefined) {
            viewport.setZoom(value.zoom);
          }
          if (value.pan !== undefined) {
            viewport.setPan(value.pan);
          }
        },
        resolve
      );
    });
  }

  // === Custom Animations ===

  /**
   * Animate any numeric value with custom update function
   */
  animate<T>(
    id: string,
    startValue: T,
    targetValue: T,
    config: AnimationConfig,
    onUpdate: (progress: number, value: T) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.startAnimation(id, startValue, targetValue, config, onUpdate, resolve);
    });
  }

  /**
   * Animate between two numeric values
   */
  animateValue(
    id: string,
    startValue: number,
    targetValue: number,
    config: Partial<AnimationConfig>,
    onUpdate: (value: number) => void
  ): Promise<void> {
    const animConfig = this.createAnimationConfig(config);

    return new Promise((resolve) => {
      this.startAnimation(id, startValue, targetValue, animConfig, onUpdate, resolve);
    });
  }

  /**
   * Animate between two Point2D values
   */
  animatePoint(
    id: string,
    startPoint: Point2D,
    targetPoint: Point2D,
    config: Partial<AnimationConfig>,
    onUpdate: (point: Point2D) => void
  ): Promise<void> {
    const animConfig = this.createAnimationConfig(config);

    return new Promise((resolve) => {
      this.startAnimation(id, startPoint, targetPoint, animConfig, onUpdate, resolve);
    });
  }

  // === Animation Control ===

  /**
   * Cancel a specific animation by ID
   */
  cancelAnimation(id: string): void {
    const animation = this.activeAnimations.get(id);
    if (animation) {
      animation.isActive = false;
      this.activeAnimations.delete(id);

      if (this.activeAnimations.size === 0) {
        this.stopAnimationLoop();
      }
    }
  }

  /**
   * Cancel all animations
   */
  cancelAllAnimations(): void {
    this.activeAnimations.clear();
    this.stopAnimationLoop();
  }

  /**
   * Check if an animation is currently running
   */
  isAnimating(id?: string): boolean {
    if (id) {
      return this.activeAnimations.has(id);
    }
    return this.activeAnimations.size > 0;
  }

  /**
   * Get list of currently running animation IDs
   */
  getActiveAnimationIds(): string[] {
    return Array.from(this.activeAnimations.keys());
  }

  /**
   * Stop the animation system (cancels all animations)
   */
  stop(): void {
    this.cancelAllAnimations();
  }

  // === Performance Monitoring ===

  /**
   * Get current frame rate
   */
  getCurrentFps(): number {
    return this.currentFps;
  }

  /**
   * Get animation performance stats
   */
  getPerformanceStats(): {
    fps: number;
    activeAnimations: number;
    isRunning: boolean;
    frameCount: number;
  } {
    return {
      fps: this.currentFps,
      activeAnimations: this.activeAnimations.size,
      isRunning: this.isRunning,
      frameCount: this.frameCount,
    };
  }

  // === Internal Animation Management ===

  private startAnimation<T>(
    id: string,
    startValue: T,
    targetValue: T,
    config: AnimationConfig,
    onUpdate: (progress: number, value: T) => void,
    onComplete: () => void
  ): void {
    // Cancel existing animation with same ID
    if (this.activeAnimations.has(id)) {
      this.cancelAnimation(id);
    }

    // Check for reduced motion preference
    if (this.prefersReducedMotion && config.duration > this.config.motionReductionThreshold) {
      // Skip animation, go directly to end state
      onUpdate(1, targetValue);
      onComplete();
      return;
    }

    // Create animation
    const animation: ActiveAnimation = {
      id,
      type: 'custom',
      startTime: performance.now(),
      config,
      onUpdate,
      onComplete,
      startValue,
      targetValue,
      isActive: true,
    };

    this.activeAnimations.set(id, animation);
    this.startAnimationLoop();
  }

  private startAnimationLoop(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.animationFrame = requestAnimationFrame(this.animationTick.bind(this));
  }

  private stopAnimationLoop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private animationTick(currentTime: number): void {
    if (!this.isRunning) return;

    this.updatePerformanceStats(currentTime);

    const completedAnimations: string[] = [];

    // Update all active animations
    for (const [id, animation] of this.activeAnimations) {
      if (!animation.isActive) {
        completedAnimations.push(id);
        continue;
      }

      const elapsed = currentTime - animation.startTime;
      const progress = Math.min(elapsed / animation.config.duration, 1);

      // Apply easing
      const easedProgress = animation.config.easing(progress);

      // Calculate interpolated value
      const value = this.interpolateValue(
        animation.startValue,
        animation.targetValue,
        easedProgress
      );

      // Update animation
      try {
        animation.onUpdate(easedProgress, value);

        // Call progress callback if provided
        if (animation.config.onProgress) {
          animation.config.onProgress(easedProgress);
        }
      } catch (error) {
        console.error('Animation update error:', error);
        completedAnimations.push(id);
        continue;
      }

      // Check if animation is complete
      if (progress >= 1) {
        completedAnimations.push(id);
      }
    }

    // Complete finished animations
    for (const id of completedAnimations) {
      const animation = this.activeAnimations.get(id);
      if (animation) {
        try {
          animation.onComplete();
          if (animation.config.onComplete) {
            animation.config.onComplete();
          }
        } catch (error) {
          console.error('Animation completion error:', error);
        }
      }
      this.activeAnimations.delete(id);
    }

    // Continue loop if there are still active animations
    if (this.activeAnimations.size > 0) {
      this.animationFrame = requestAnimationFrame(this.animationTick.bind(this));
    } else {
      this.stopAnimationLoop();
    }
  }

  private interpolateValue<T>(startValue: T, targetValue: T, progress: number): T {
    if (typeof startValue === 'number' && typeof targetValue === 'number') {
      return (startValue + (targetValue - startValue) * progress) as T;
    }

    if (this.isPoint2D(startValue) && this.isPoint2D(targetValue)) {
      return {
        x: startValue.x + (targetValue.x - startValue.x) * progress,
        y: startValue.y + (targetValue.y - startValue.y) * progress,
      } as T;
    }

    // For complex objects, interpolate each numeric property
    if (typeof startValue === 'object' && typeof targetValue === 'object') {
      const result = { ...startValue } as any;

      for (const key in targetValue) {
        const start = (startValue as any)[key];
        const target = (targetValue as any)[key];

        if (typeof start === 'number' && typeof target === 'number') {
          result[key] = start + (target - start) * progress;
        } else if (this.isPoint2D(start) && this.isPoint2D(target)) {
          result[key] = {
            x: start.x + (target.x - start.x) * progress,
            y: start.y + (target.y - start.y) * progress,
          };
        }
      }

      return result as T;
    }

    // Fallback: return target value at 50% progress
    return progress >= 0.5 ? targetValue : startValue;
  }

  private isPoint2D(value: any): value is Point2D {
    return (
      value &&
      typeof value === 'object' &&
      typeof value.x === 'number' &&
      typeof value.y === 'number'
    );
  }

  private createAnimationConfig(config?: Partial<AnimationConfig>): AnimationConfig {
    return {
      duration: clamp(
        config?.duration ?? this.config.defaultDuration,
        this.config.minAnimationDuration,
        this.config.maxAnimationDuration
      ),
      easing: config?.easing ?? this.config.defaultEasing,
      onProgress: config?.onProgress,
      onComplete: config?.onComplete,
    };
  }

  private updatePerformanceStats(currentTime: number): void {
    this.frameCount++;

    // Calculate FPS every second
    if (currentTime - this.lastFpsCheck >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsCheck));
      this.frameCount = 0;
      this.lastFpsCheck = currentTime;
    }
  }

  private detectMotionPreferences(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = mediaQuery.matches;

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this.prefersReducedMotion = e.matches;
      });
    }
  }

  // === Static Utility Methods ===

  /**
   * Create a spring-based easing function
   */
  static createSpringEasing(tension = 120, friction = 14): EasingFunction {
    return (t: number) => {
      const omega = Math.sqrt(tension);
      const zeta = friction / (2 * Math.sqrt(tension));

      if (zeta < 1) {
        // Under-damped
        const omegaD = omega * Math.sqrt(1 - zeta * zeta);
        const A = 1;
        const B = (zeta * omega) / omegaD;
        return 1 - Math.exp(-zeta * omega * t) * (A * Math.cos(omegaD * t) + B * Math.sin(omegaD * t));
      } else {
        // Critically or over-damped
        return 1 - Math.exp(-omega * t) * (1 + omega * t);
      }
    };
  }

  /**
   * Create a bounce easing function
   */
  static createBounceEasing(bounces = 3, decay = 0.6): EasingFunction {
    return (t: number) => {
      if (t === 1) return 1;

      let n = bounces;
      let a = decay;
      let sum = 0;

      for (let i = 0; i < n; i++) {
        sum += Math.pow(a, i);
      }

      let currentBounce = 0;
      let currentTime = 0;

      for (let i = 0; i < n; i++) {
        const bounceTime = (1 - Math.pow(a, i)) / sum;
        if (t <= currentTime + bounceTime) {
          const localT = (t - currentTime) / bounceTime;
          const bounceHeight = Math.pow(a, i);
          return 1 - bounceHeight * (1 - (2 * localT - 1) * (2 * localT - 1));
        }
        currentTime += bounceTime;
      }

      return 1;
    };
  }
}