/**
 * Basic Graph Renderer - Actually renders knowledge graphs using the library
 * TDD implementation to pass the defined tests
 */

import { KnowledgeGraph, type GraphData } from '@aigeeksquad/knowledge-network';

export class BasicGraphRenderer {
  private container: HTMLElement;
  private graph: KnowledgeGraph | null = null;
  private isInitialized = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Create a simple graph container
    this.container.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        position: relative;
        background: rgba(255,255,255,0.02);
        border-radius: 4px;
      " id="graph-canvas"></div>
    `;

    this.isInitialized = true;
  }

  async render(): Promise<void> {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      const graphContainer = this.container.querySelector('#graph-canvas') as HTMLElement;
      if (!graphContainer) {
        console.error('Graph canvas not found');
        return; // Handle gracefully without throwing
      }

      const data = this.getSampleData();

      // Create KnowledgeGraph instance with Xbox-themed styling
      this.graph = new KnowledgeGraph(graphContainer, data, {
        width: graphContainer.offsetWidth || 400,
        height: graphContainer.offsetHeight || 300,
        nodeRadius: 8,
        nodeFill: '#107c10',        // Xbox Green nodes
        nodeStroke: '#ffffff',
        nodeStrokeWidth: 2,
        edgeStroke: '#00bcf2',      // Xbox Blue edges
        edgeStrokeWidth: 2,
        edgeRenderer: 'simple',     // Start with simple edges
        enableZoom: true,
        enableDrag: true
      });

      await this.graph.render();

    } catch (error) {
      console.error('Graph render error:', error);
      // Don't throw - handle gracefully as per test requirements
    }
  }

  getSampleData(): GraphData {
    return {
      nodes: [
        { id: 'gaming', label: 'Gaming', type: 'category' },
        { id: 'xbox', label: 'Xbox', type: 'platform' },
        { id: 'performance', label: 'Performance', type: 'concept' },
        { id: 'graphics', label: 'Graphics', type: 'concept' },
        { id: 'fps', label: 'FPS', type: 'metric' },
        { id: 'gpu', label: 'GPU', type: 'hardware' },
        { id: 'optimization', label: 'Optimization', type: 'concept' }
      ],
      edges: [
        { source: 'gaming', target: 'xbox' },
        { source: 'xbox', target: 'performance' },
        { source: 'performance', target: 'graphics' },
        { source: 'graphics', target: 'gpu' },
        { source: 'performance', target: 'fps' },
        { source: 'gpu', target: 'optimization' },
        { source: 'optimization', target: 'performance' }
      ]
    };
  }

  destroy(): void {
    if (this.graph) {
      this.graph.destroy();
      this.graph = null;
    }
    this.isInitialized = false;
  }
}