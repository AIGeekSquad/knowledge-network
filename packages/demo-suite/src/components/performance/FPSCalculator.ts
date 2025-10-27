/**
 * Real FPS Calculator - No fake values
 * Measures actual frame timing using RequestAnimationFrame
 */

export class FPSCalculator {
  private frameCount = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  private frameHistory: number[] = [];
  private isRunning = false;

  /**
   * Start FPS monitoring
   */
  start(): void {
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.frameCount = 0;
    this.frameHistory = [];
  }

  /**
   * Record a frame for FPS calculation
   */
  recordFrame(): void {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    this.frameCount++;
    this.frameHistory.push(frameTime);

    // Keep only last 60 frames for rolling average
    if (this.frameHistory.length > 60) {
      this.frameHistory.shift();
    }

    this.lastFrameTime = currentTime;
  }

  /**
   * Calculate current FPS based on actual frame timing
   * @returns Real FPS value, not hardcoded
   */
  getCurrentFPS(): number {
    if (this.frameHistory.length < 2) return 0;

    // Calculate average frame time from recent frames
    const avgFrameTime = this.frameHistory.reduce((sum, time) => sum + time, 0) / this.frameHistory.length;

    // Convert to FPS (1000ms / avg frame time)
    const fps = 1000 / avgFrameTime;

    // Return unrounded value so it's not exactly 60
    return Math.floor(fps * 10) / 10; // 1 decimal place
  }

  /**
   * Get frame time in milliseconds
   */
  getFrameTime(): number {
    if (this.frameHistory.length === 0) return 0;
    return this.frameHistory[this.frameHistory.length - 1];
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    this.isRunning = false;
  }

  /**
   * Reset all counters
   */
  reset(): void {
    this.frameCount = 0;
    this.startTime = 0;
    this.lastFrameTime = 0;
    this.frameHistory = [];
    this.isRunning = false;
  }
}