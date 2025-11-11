import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData, GraphConfig } from '../src/types';

describe('KnowledgeGraph - Initialization & Constructor', () => {
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

  it('should create instance with minimal parameters', () => {
    const graph = new KnowledgeGraph(container, basicGraphData);
    expect(graph).toBeInstanceOf(KnowledgeGraph);
  });

  it('should create instance with full configuration', () => {
    const config: GraphConfig = {
      width: 1000,
      height: 800,
      nodeRadius: 15,
      nodeFill: '#ff6b6b',
      nodeStroke: '#333',
      nodeStrokeWidth: 2,
      linkDistance: 150,
      linkStroke: '#999',
      linkStrokeWidth: 2,
      chargeStrength: -500,
      collisionRadius: 20,
    };

    const graph = new KnowledgeGraph(container, basicGraphData, config);
    expect(graph).toBeInstanceOf(KnowledgeGraph);
  });

  it('should apply default values for missing config', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, { width: 1000 });
    expect(graph).toBeInstanceOf(KnowledgeGraph);

    // Should not throw when rendering with partial config
    expect(() => graph.render()).not.toThrow();
  });

  it('should handle empty nodes array', () => {
    const emptyData = { nodes: [], edges: [] };
    const graph = new KnowledgeGraph(container, emptyData);
    expect(graph).toBeInstanceOf(KnowledgeGraph);
    expect(() => graph.render()).not.toThrow();
  });

  it('should handle empty edges array', () => {
    const noEdgesData = {
      nodes: [{ id: 'alone', label: 'Lonely Node' }],
      edges: [],
    };
    const graph = new KnowledgeGraph(container, noEdgesData);
    expect(graph).toBeInstanceOf(KnowledgeGraph);
    expect(() => graph.render()).not.toThrow();
  });

  it('should support collision detection configuration', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      collisionRadius: 15,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(simulation?.force('collision')).toBeTruthy();
  });

  it('should support similarity-based clustering configuration', () => {
    const dataWithVectors: GraphData = {
      nodes: [
        { id: 'a', vector: [1, 0, 0] },
        { id: 'b', vector: [0.9, 0.1, 0] },
        { id: 'c', vector: [0, 0, 1] },
      ],
      edges: [],
    };

    const graph = new KnowledgeGraph(container, dataWithVectors, {
      similarityFunction: (a, b) => {
        if (!a.vector || !b.vector) return 0;
        // Simple dot product
        return a.vector.reduce((sum, val, i) => sum + val * (b.vector![i] || 0), 0);
      },
      similarityThreshold: 0.5,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(simulation?.force('similarity')).toBeTruthy();
  });
});