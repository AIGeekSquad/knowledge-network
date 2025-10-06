import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData } from '../src/types';

describe('KnowledgeGraph - Data Management & Lifecycle', () => {
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

  describe('updateData() Method', () => {
    it('should update with new nodes', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const newData: GraphData = {
        nodes: [
          { id: 'nodeA', label: 'Node A' },
          { id: 'nodeB', label: 'Node B' },
        ],
        edges: [{ source: 'nodeA', target: 'nodeB' }],
      };

      graph.updateData(newData);

      const circles = container.querySelectorAll('circle');
      const labels = container.querySelectorAll('text');
      expect(circles).toHaveLength(2);
      expect(labels).toHaveLength(2);
    });

    it('should add new nodes to existing graph', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const expandedData: GraphData = {
        nodes: [
          ...basicGraphData.nodes,
          { id: 'node4', label: 'Node 4', type: 'tertiary' },
        ],
        edges: [
          ...basicGraphData.edges,
          { id: 'edge3', source: 'node3', target: 'node4', type: 'extends' },
        ],
      };

      graph.updateData(expandedData);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(4);
    });

    it('should remove nodes from graph', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const reducedData: GraphData = {
        nodes: [basicGraphData.nodes[0], basicGraphData.nodes[1]],
        edges: [basicGraphData.edges[0]],
      };

      graph.updateData(reducedData);

      const circles = container.querySelectorAll('circle');
      expect(circles).toHaveLength(2);
    });

    it('should handle complete data replacement', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const newData: GraphData = {
        nodes: [
          { id: 'alpha', label: 'Alpha Node' },
          { id: 'beta', label: 'Beta Node' },
          { id: 'gamma', label: 'Gamma Node' },
        ],
        edges: [
          { source: 'alpha', target: 'beta' },
          { source: 'beta', target: 'gamma' },
          { source: 'gamma', target: 'alpha' },
        ],
      };

      graph.updateData(newData);

      const circles = container.querySelectorAll('circle');
      const labels = container.querySelectorAll('text');
      expect(circles).toHaveLength(3);
      expect(labels[0].textContent).toBe('Alpha Node');
    });

    it('should handle position preservation during updates', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      // Get circles after initial render
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBe(3);

      // Update with same data should not throw
      expect(() => graph.updateData(basicGraphData)).not.toThrow();

      // Should still have same number of nodes
      const updatedCircles = container.querySelectorAll('circle');
      expect(updatedCircles.length).toBe(3);
    });

    it('should handle empty data updates', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const emptyData: GraphData = { nodes: [], edges: [] };

      expect(() => graph.updateData(emptyData)).not.toThrow();

      const circles = container.querySelectorAll('circle');
      const labels = container.querySelectorAll('text');
      expect(circles).toHaveLength(0);
      expect(labels).toHaveLength(0);
    });
  });

  describe('getSimulation() Method', () => {
    it('should return null before render', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      expect(graph.getSimulation()).toBeNull();
    });

    it('should return simulation after render', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const simulation = graph.getSimulation();
      expect(simulation).toBeTruthy();
      expect(typeof simulation?.alpha()).toBe('number');
    });

    it('should return same simulation on multiple calls', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const sim1 = graph.getSimulation();
      const sim2 = graph.getSimulation();
      expect(sim1).toBe(sim2);
    });
  });

  describe('destroy() Method', () => {
    it('should clean up all resources', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      expect(container.querySelector('svg')).toBeTruthy();
      expect(graph.getSimulation()).toBeTruthy();

      graph.destroy();

      expect(container.querySelector('svg')).toBeFalsy();
      expect(graph.getSimulation()).toBeFalsy();
    });

    it('should be safe to call multiple times', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      expect(() => {
        graph.destroy();
        graph.destroy();
        graph.destroy();
      }).not.toThrow();
    });

    it('should be safe to call before render', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      expect(() => graph.destroy()).not.toThrow();
    });
  });
});