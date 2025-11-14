import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData, Node } from '../src/types';

describe('KnowledgeGraph - Node Styling & Configuration', () => {
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

  it('should apply constant nodeRadius', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeRadius: 15,
    });
    graph.render();

    const circles = container.querySelectorAll('circle');
    circles.forEach((circle) => {
      expect(circle.getAttribute('r')).toBe('15');
    });
  });

  it('should apply function nodeRadius', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeRadius: (d: Node) => d.type === 'primary' ? 20 : 10,
    });
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('r')).toBe('20'); // primary node
    expect(circles[1].getAttribute('r')).toBe('10'); // secondary node
    expect(circles[2].getAttribute('r')).toBe('10'); // secondary node
  });

  it('should apply constant nodeFill', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeFill: '#ff6b6b',
    });
    graph.render();

    const circles = container.querySelectorAll('circle');
    circles.forEach((circle) => {
      expect(circle.getAttribute('fill')).toBe('#ff6b6b');
    });
  });

  it('should apply function nodeFill', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeFill: (d: Node) => d.type === 'primary' ? '#ff0000' : '#00ff00',
    });
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('fill')).toBe('#ff0000'); // primary node
    expect(circles[1].getAttribute('fill')).toBe('#00ff00'); // secondary node
    expect(circles[2].getAttribute('fill')).toBe('#00ff00'); // secondary node
  });

  it('should apply constant nodeStroke', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeStroke: '#333333',
    });
    graph.render();

    const circles = container.querySelectorAll('circle');
    circles.forEach((circle) => {
      expect(circle.getAttribute('stroke')).toBe('#333333');
    });
  });

  it('should apply function nodeStroke', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeStroke: (d: Node) => d.type === 'primary' ? '#000' : '#999',
    });
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('stroke')).toBe('#000'); // primary node
    expect(circles[1].getAttribute('stroke')).toBe('#999'); // secondary node
    expect(circles[2].getAttribute('stroke')).toBe('#999'); // secondary node
  });

  it('should apply constant nodeStrokeWidth', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeStrokeWidth: 3,
    });
    graph.render();

    const circles = container.querySelectorAll('circle');
    circles.forEach((circle) => {
      expect(circle.getAttribute('stroke-width')).toBe('3');
    });
  });

  it('should apply function nodeStrokeWidth', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeStrokeWidth: (d: Node) => d.type === 'primary' ? 4 : 1,
    });
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('stroke-width')).toBe('4'); // primary node
    expect(circles[1].getAttribute('stroke-width')).toBe('1'); // secondary node
    expect(circles[2].getAttribute('stroke-width')).toBe('1'); // secondary node
  });

  it('should support complex styling with multiple accessors', async () => {
    const complexData: GraphData = {
      nodes: [
        { id: 'important', type: 'critical', weight: 10 },
        { id: 'normal', type: 'standard', weight: 5 },
        { id: 'minor', type: 'low', weight: 1 },
      ],
      edges: [],
    };

    const graph = new KnowledgeGraph(container, complexData, {
      nodeRadius: (d: Node) => {
        if (d.weight && d.weight > 8) return 25;
        if (d.weight && d.weight > 3) return 15;
        return 8;
      },
      nodeFill: (d: Node) => {
        switch (d.type) {
          case 'critical': return '#ff4444';
          case 'standard': return '#4444ff';
          case 'low': return '#44ff44';
          default: return '#cccccc';
        }
      },
    });
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('r')).toBe('25'); // important node
    expect(circles[0].getAttribute('fill')).toBe('#ff4444');
    expect(circles[1].getAttribute('r')).toBe('15'); // normal node
    expect(circles[1].getAttribute('fill')).toBe('#4444ff');
    expect(circles[2].getAttribute('r')).toBe('8'); // minor node
    expect(circles[2].getAttribute('fill')).toBe('#44ff44');
  });

  it('should handle accessor functions with missing properties gracefully', async () => {
    const incompleteData: GraphData = {
      nodes: [
        { id: 'complete', type: 'primary', weight: 5 },
        { id: 'incomplete' }, // Missing type and weight
      ],
      edges: [],
    };

    const graph = new KnowledgeGraph(container, incompleteData, {
      nodeRadius: (d: Node) => d.weight ? d.weight * 2 : 10,
      nodeFill: (d: Node) => d.type === 'primary' ? '#ff0000' : '#cccccc',
    });

    await expect(graph.render()).resolves.not.toThrow();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('r')).toBe('10'); // 5 * 2
    expect(circles[0].getAttribute('fill')).toBe('#ff0000');
    expect(circles[1].getAttribute('r')).toBe('10'); // fallback
    expect(circles[1].getAttribute('fill')).toBe('#cccccc'); // fallback
  });

  it('should combine styling accessors with built-in defaults', async () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      nodeRadius: (d: Node) => d.type === 'primary' ? 20 : 12,
      // Other properties should use defaults
    });
    await graph.render();

    const circles = container.querySelectorAll('circle');
    expect(circles[0].getAttribute('r')).toBe('20');
    expect(circles[1].getAttribute('r')).toBe('12');

    // Should still have default stroke and fill
    expect(circles[0].getAttribute('stroke')).toBeTruthy();
    expect(circles[0].getAttribute('fill')).toBeTruthy();
  });
});