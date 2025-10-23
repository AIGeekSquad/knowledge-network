import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData, Node } from '../src/types';

describe('KnowledgeGraph - Rendering & DOM Manipulation', () => {
  let container: HTMLDivElement;
  let basicGraphData: GraphData;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    basicGraphData = {
      nodes: [
        { id: 'node1', label: 'Node 1', type: 'primary' },
        { id: 'node2', label: 'Node 2', type: 'secondary' },
        { id: 'node3', label: 'Node 3', type: 'secondary' },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', type: 'is-a', weight: 0.8 },
        { id: 'edge2', source: 'node2', target: 'node3', type: 'related-to', weight: 0.6 },
      ],
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create SVG with correct dimensions', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData);
    await graph.render();

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('800');
    expect(svg?.getAttribute('height')).toBe('600');
  });

  it('should apply custom configuration for dimensions', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      width: 1000,
      height: 800,
    });
    await graph.render();

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('1000');
    expect(svg?.getAttribute('height')).toBe('800');
  });

  it('should create nodes with correct count', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData);
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles).toHaveLength(3);
  });

  it('should create labels for nodes', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData);
    await graph.render();

    const labels = container.querySelectorAll('text');
    expect(labels).toHaveLength(3);
    expect(labels[0].textContent).toBe('Node 1');
    expect(labels[1].textContent).toBe('Node 2');
    expect(labels[2].textContent).toBe('Node 3');
  });

  it('should use node id as fallback label', async () => {
    const dataWithoutLabels: GraphData = {
      nodes: [
        { id: 'nodeA' },
        { id: 'nodeB' },
      ],
      edges: [{ source: 'nodeA', target: 'nodeB' }],
    };

    const graph = new KnowledgeGraph(container, dataWithoutLabels);
    await graph.render();

    const labels = container.querySelectorAll('text');
    expect(labels[0].textContent).toBe('nodeA');
    expect(labels[1].textContent).toBe('nodeB');
  });

  it('should create force simulation', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData);
    await graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(typeof simulation?.alpha()).toBe('number');
  });

  it('should render multiple times without error', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData);

    // First render should succeed
    await graph.render();
    expect(container.querySelector('svg')).toBeTruthy();

    // Clear and render again
    graph.destroy();
    await graph.render();

    // Should have correct number of elements after re-render
    const circles = container.querySelectorAll('circle');
    const labels = container.querySelectorAll('text');
    expect(circles).toHaveLength(3);
    expect(labels).toHaveLength(3);
  }, 10000);

  it('should clean up DOM on destroy', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData);
    await graph.render();

    expect(container.querySelector('svg')).toBeTruthy();
    expect(graph.getSimulation()).toBeTruthy();

    graph.destroy();

    expect(container.querySelector('svg')).toBeFalsy();
    expect(graph.getSimulation()).toBeFalsy();
  });
});