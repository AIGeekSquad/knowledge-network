import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData } from '../src/types';

describe('KnowledgeGraph - Layout Simulation & Physics', () => {
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

  it('should apply constant linkDistance', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      linkDistance: 200,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    const linkForce = simulation?.force('link');
    expect(linkForce).toBeTruthy();
  });

  it('should apply function linkDistance', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      linkDistance: (d) => d.weight ? d.weight * 100 : 50,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(simulation?.force('link')).toBeTruthy();
  });

  it('should apply constant chargeStrength', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      chargeStrength: -800,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    const chargeForce = simulation?.force('charge');
    expect(chargeForce).toBeTruthy();
  });

  it('should apply function chargeStrength', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      chargeStrength: (d) => d.type === 'primary' ? -1000 : -300,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    expect(simulation?.force('charge')).toBeTruthy();
  });

  it('should configure collision detection with radius', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      collisionRadius: 25,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    const collisionForce = simulation?.force('collision');
    expect(collisionForce).toBeTruthy();
  });

  it('should configure centering force', () => {
    const graph = new KnowledgeGraph(container, basicGraphData, {
      centeringStrength: 0.1,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    const centerForce = simulation?.force('center');
    expect(centerForce).toBeTruthy();
  });

  it('should handle similarity-based clustering force', () => {
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
      similarityStrength: 0.5,
    });
    graph.render();

    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
    const similarityForce = simulation?.force('similarity');
    expect(similarityForce).toBeTruthy();
  });

  it('should respect waitForStable configuration', () => {
    // This is more of an integration test to ensure the config is accepted
    const graph = new KnowledgeGraph(container, basicGraphData, {
      waitForStable: true,
      stabilityThreshold: 0.01,
    });

    expect(() => graph.render()).not.toThrow();
    const simulation = graph.getSimulation();
    expect(simulation).toBeTruthy();
  });
});