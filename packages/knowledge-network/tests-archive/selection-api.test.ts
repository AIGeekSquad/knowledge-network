import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData } from '../src/types';

describe('KnowledgeGraph - Selection API & Neighbors', () => {
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

  it('should support node selection with callback', (done) => {
    const onNodeSelected = vi.fn();

    const graph = new KnowledgeGraph(container, graphData, {
      onNodeSelected,
    });

    graph.render();

    // Wait for render to complete
    setTimeout(() => {
      graph.selectNode('node2');

      expect(onNodeSelected).toHaveBeenCalledWith(
        'node2',
        expect.arrayContaining(['node1', 'node3']), // neighbors
        expect.any(Array) // edges
      );
      done();
    }, 100);
  });

  it('should get neighbors correctly', () => {
    const graph = new KnowledgeGraph(container, graphData);
    graph.render();

    const neighbors = graph.getNeighbors('node2');
    expect(neighbors).toEqual(expect.arrayContaining(['node1', 'node3']));
    expect(neighbors).toHaveLength(2);
  });

  it('should clear selection', (done) => {
    const graph = new KnowledgeGraph(container, graphData);
    graph.render();

    setTimeout(() => {
      graph.selectNode('node1');

      // Verify node is selected (has reduced opacity for non-selected)
      const circles = container.querySelectorAll('circle');
      const node3 = circles[2];
      expect(node3.getAttribute('opacity')).toBe('0.3');

      graph.clearSelection();

      // All nodes should be back to full opacity
      expect(node3.getAttribute('opacity')).toBe('1');
      done();
    }, 100);
  });

  it('should handle click on nodes for selection', (done) => {
    const onNodeSelected = vi.fn();

    const graph = new KnowledgeGraph(container, graphData, {
      onNodeSelected,
    });

    graph.render();

    setTimeout(() => {
      // Simulate click on first node
      const circles = container.querySelectorAll('circle');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      circles[0].dispatchEvent(clickEvent);

      expect(onNodeSelected).toHaveBeenCalledWith(
        'node1',
        expect.arrayContaining(['node2']),
        expect.any(Array)
      );
      done();
    }, 100);
  });
});