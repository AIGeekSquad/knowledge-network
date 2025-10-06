import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData, Edge } from '../src/types';

describe('KnowledgeGraph - Edge Rendering & Integration', () => {
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

  it('should apply constant linkStroke', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      linkStroke: '#ff0000',
      edgeRenderer: 'simple',
    });
    graph.render();

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach((line) => {
      expect(line.getAttribute('stroke')).toBe('#ff0000');
    });
  });

  it('should apply function linkStroke', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      linkStroke: (d: Edge) => d.type === 'is-a' ? '#blue' : '#green',
      edgeRenderer: 'simple',
    });
    graph.render();

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);
  });

  it('should apply constant linkStrokeWidth', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      linkStrokeWidth: 4,
      edgeRenderer: 'simple',
    });
    graph.render();

    const lines = container.querySelectorAll('line');
    lines.forEach((line) => {
      expect(line.getAttribute('stroke-width')).toBe('4');
    });
  });

  it('should apply function linkStrokeWidth', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      linkStrokeWidth: (d: Edge) => d.weight ? d.weight * 3 : 1,
      edgeRenderer: 'simple',
    });
    graph.render();

    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);
  });

  it('should use bundled edge renderer when configured', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      edgeRenderer: 'bundled',
      edgeBundling: {
        subdivisions: 20,
        iterations: 90,
      },
    });

    expect(() => graph.render()).not.toThrow();

    // Bundled renderer creates path elements instead of lines
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle edge bundling configuration', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      edgeRenderer: 'bundled',
      edgeBundling: {
        subdivisions: 15,
        compatibilityThreshold: 0.7,
        iterations: 60,
        stepSize: 0.05,
        stiffness: 0.2,
      },
    });

    expect(() => graph.render()).not.toThrow();

    const paths = container.querySelectorAll('path');
    expect(paths.length).toBeGreaterThanOrEqual(2);
  });
});