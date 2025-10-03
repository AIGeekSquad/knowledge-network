import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData, Node } from '../src/types';

describe('KnowledgeGraph', () => {
  let container: HTMLDivElement;
  let graphData: GraphData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    graphData = {
      nodes: [
        { id: 'node1', label: 'Node 1', type: 'primary' },
        { id: 'node2', label: 'Node 2', type: 'secondary' },
        { id: 'node3', label: 'Node 3', type: 'secondary' },
      ],
      edges: [
        { source: 'node1', target: 'node2', type: 'is-a' },
        { source: 'node2', target: 'node3', type: 'related-to' },
      ],
    };
  });

  it('should create an instance', () => {
    const graph = new KnowledgeGraph(container, graphData);
    expect(graph).toBeInstanceOf(KnowledgeGraph);
  });

  it('should render the graph', () => {
    const graph = new KnowledgeGraph(container, graphData);
    graph.render();

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('width')).toBe('800');
    expect(svg?.getAttribute('height')).toBe('600');
  });

  it('should apply custom configuration', () => {
    const graph = new KnowledgeGraph(container, graphData, {
      width: 1000,
      height: 800,
    });
    graph.render();

    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('1000');
    expect(svg?.getAttribute('height')).toBe('800');
  });

  it('should support accessor functions for node radius', () => {
    const graph = new KnowledgeGraph(container, graphData, {
      nodeRadius: (d: Node) => d.type === 'primary' ? 20 : 10,
    });
    graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
    expect(circles[0].getAttribute('r')).toBe('20'); // primary node
    expect(circles[1].getAttribute('r')).toBe('10'); // secondary node
  });

  it('should support collision detection', () => {
    const graph = new KnowledgeGraph(container, graphData, {
      collisionRadius: 15,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(simulation?.force('collision')).toBeTruthy();
  });

  it('should support similarity-based clustering', () => {
    const dataWithVectors: GraphData = {
      nodes: [
        { id: 'a', vector: [1, 0, 0] },
        { id: 'b', vector: [0.9, 0.1, 0] },
        { id: 'c', vector: [0, 0, 1] },
      ],
      edges: [],
    };

    const graph = new KnowledgeGraph(container, dataWithVectors, {
      similarityFunction: (a: Node, b: Node) => {
        if (!a.vector || !b.vector) return 0;
        // Simple dot product
        return a.vector.reduce((sum, val, i) => sum + val * (b.vector![i] || 0), 0);
      },
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(simulation?.force('similarity')).toBeTruthy();
  });

  it('should clean up on destroy', () => {
    const graph = new KnowledgeGraph(container, graphData);
    graph.render();

    expect(container.querySelector('svg')).toBeTruthy();
    expect(graph.getSimulation()).toBeTruthy();

    graph.destroy();

    expect(container.querySelector('svg')).toBeFalsy();
    expect(graph.getSimulation()).toBeFalsy();
  });
});