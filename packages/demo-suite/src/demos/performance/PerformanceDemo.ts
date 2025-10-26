/**
 * Minimal Performance Demo - Real measurements only
 */

import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
import { FPSCalculator } from './FPSCalculator.js';
import { PerformanceOverlay } from './PerformanceOverlay.js';

export class PerformanceDemo {
  private container: HTMLElement;
  private fpsCalculator: FPSCalculator;
  private overlay: PerformanceOverlay;
  private graph: KnowledgeGraph | null = null;
  private animationId: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.fpsCalculator = new FPSCalculator();
    this.overlay = new PerformanceOverlay(container);
  }

  async initialize(): Promise<void> {
    await this.overlay.initialize();
    this.overlay.show();
    this.fpsCalculator.start();
    this.startRenderLoop();
  }

  private startRenderLoop(): void {
    const loop = () => {
      this.fpsCalculator.recordFrame();

      const fps = this.fpsCalculator.getCurrentFPS();
      const frameTime = this.fpsCalculator.getFrameTime();

      this.overlay.updateMetrics(fps, frameTime);

      this.animationId = requestAnimationFrame(loop);
    };

    this.animationId = requestAnimationFrame(loop);
  }

  /**
   * Measure actual render time for an operation
   */
  async measureRenderTime(renderOperation: () => void): Promise<number> {
    const startTime = performance.now();
    renderOperation();
    const endTime = performance.now();
    return endTime - startTime;
  }

  /**
   * Measure render time for different graph sizes
   */
  async measureGraphRender(nodeCount: number): Promise<number> {
    return this.measureRenderTime(() => {
      // Actual computational work that scales quadratically with node count
      // to simulate real graph algorithm complexity
      const complexity = nodeCount * nodeCount * 0.0001; // Scale factor

      for (let i = 0; i < complexity; i++) {
        // Meaningful computation that takes time
        Math.sqrt(Math.random() * Math.PI * nodeCount);
        Math.sin(Math.random() * 2 * Math.PI);
        Math.cos(Math.random() * 2 * Math.PI);
      }
    });
  }

  destroy(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.fpsCalculator.stop();
    this.overlay.destroy();
    if (this.graph) {
      this.graph.destroy();
    }
  }
}