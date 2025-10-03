import { describe, it, expect, beforeEach } from 'vitest';
import { KnowledgeGraph } from '../KnowledgeGraph';
import type { GraphData } from '../types';

describe('KnowledgeGraph', () => {
  let container: HTMLDivElement;
  let graphData: GraphData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    graphData = {
      nodes: [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
        { id: 'node3', label: 'Node 3' },
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' },
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

  it('should clean up on destroy', () => {
    const graph = new KnowledgeGraph(container, graphData);
    graph.render();

    expect(container.querySelector('svg')).toBeTruthy();

    graph.destroy();

    expect(container.querySelector('svg')).toBeFalsy();
  });
});
