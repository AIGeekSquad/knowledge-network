/**
 * Performance Overlay with working double-click toggle
 */

export class PerformanceOverlay {
  private container: HTMLElement;
  private overlay: HTMLElement | null = null;
  private isVisible = false;
  private isDetailed = false;

  public onToggle: ((visible: boolean) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    this.createOverlay();
    this.setupEventHandlers();
  }

  private createOverlay(): void {
    this.overlay = document.createElement('div');
    this.overlay.id = 'performance-overlay';
    this.overlay.className = 'performance-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      cursor: pointer;
      user-select: none;
      z-index: 1000;
    `;

    this.overlay.innerHTML = `
      <div>FPS: <span id="fps-value">--</span></div>
      <div>Frame: <span id="frame-time">--</span>ms</div>
      <div id="detailed-metrics" style="display: none;">
        <div>Nodes: <span id="node-count">--</span></div>
        <div>Edges: <span id="edge-count">--</span></div>
        <small>Double-click to toggle</small>
      </div>
    `;

    this.container.appendChild(this.overlay);
  }

  private setupEventHandlers(): void {
    if (!this.overlay) return;

    // Double-click to toggle detailed view
    this.overlay.addEventListener('dblclick', () => {
      this.toggleDetails();
    });

    // Visual feedback for interactivity
    this.overlay.addEventListener('mouseenter', () => {
      if (this.overlay) {
        this.overlay.style.background = 'rgba(16, 124, 16, 0.9)'; // Xbox Green
      }
    });

    this.overlay.addEventListener('mouseleave', () => {
      if (this.overlay) {
        this.overlay.style.background = 'rgba(0, 0, 0, 0.8)';
      }
    });
  }

  private toggleDetails(): void {
    if (!this.overlay) return;

    this.isDetailed = !this.isDetailed;
    const detailedMetrics = this.overlay.querySelector('#detailed-metrics') as HTMLElement;

    if (detailedMetrics) {
      detailedMetrics.style.display = this.isDetailed ? 'block' : 'none';
    }

    if (this.onToggle) {
      this.onToggle(this.isDetailed);
    }
  }

  updateMetrics(fps: number, frameTime: number, nodeCount = 0, edgeCount = 0): void {
    if (!this.overlay) return;

    const fpsElement = this.overlay.querySelector('#fps-value');
    const frameTimeElement = this.overlay.querySelector('#frame-time');
    const nodeCountElement = this.overlay.querySelector('#node-count');
    const edgeCountElement = this.overlay.querySelector('#edge-count');

    if (fpsElement) fpsElement.textContent = fps.toString();
    if (frameTimeElement) frameTimeElement.textContent = frameTime.toFixed(1);
    if (nodeCountElement) nodeCountElement.textContent = nodeCount.toString();
    if (edgeCountElement) edgeCountElement.textContent = edgeCount.toString();
  }

  getElement(): HTMLElement {
    return this.overlay!;
  }

  show(): void {
    if (this.overlay) {
      this.overlay.style.display = 'block';
      this.isVisible = true;
    }
  }

  hide(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none';
      this.isVisible = false;
    }
  }

  destroy(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
  }
}