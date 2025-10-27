/**
 * Simple working demo for manual testing
 * No fancy modules, just working FPS and double-click
 */

import { PerformanceDemo } from './components/performance/PerformanceDemo.js';

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('demo-container');

  if (!container) {
    console.error('No demo container found');
    return;
  }

  // Create simple content for testing
  container.innerHTML = `
    <div style="padding: 20px; color: white;">
      <h2 style="color: #107c10;">Performance Demo Test</h2>
      <p>Testing FPS calculation and double-click functionality.</p>
      <p><strong>Instructions:</strong> Look for performance overlay in top-right corner, double-click it to toggle details.</p>

      <div id="graph-area" style="
        width: 600px;
        height: 400px;
        background: rgba(255,255,255,0.1);
        border: 2px solid #107c10;
        border-radius: 8px;
        margin: 20px 0;
        position: relative;
      ">
        <p style="text-align: center; margin-top: 180px;">Graph area for performance testing</p>
      </div>
    </div>
  `;

  // Initialize performance demo
  const graphArea = container.querySelector('#graph-area') as HTMLElement;
  if (graphArea) {
    const demo = new PerformanceDemo(graphArea);
    await demo.initialize();

    console.log('Performance demo initialized - check top-right corner for overlay');
  }
});