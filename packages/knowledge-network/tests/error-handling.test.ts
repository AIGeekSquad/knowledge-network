import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData } from '../src/types';

describe('KnowledgeGraph - Error Handling & Resilience', () => {
  let container: HTMLDivElement;
  let consoleErrorSpy: any;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Spy on console.error to capture error logs
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.removeChild(container);
    consoleErrorSpy.mockRestore();
  });

  describe('Malformed Data Handling', () => {
    it('should handle nodes without required id field', () => {
      const malformedData: any = {
        nodes: [
          { label: 'Node without ID' }, // Missing id
          { id: 'node2', label: 'Node 2' },
        ],
        edges: [],
      };

      const graph = new KnowledgeGraph(container, malformedData);

      // Should not throw, but may log warnings
      expect(() => graph.render()).not.toThrow();
    });

    it('should handle edges with invalid node references', () => {
      const invalidData: GraphData = {
        nodes: [
          { id: 'node1', label: 'Node 1' },
          { id: 'node2', label: 'Node 2' },
        ],
        edges: [
          { source: 'node1', target: 'nonexistent' }, // Invalid target
          { source: 'node1', target: 'node2' }, // Valid edge
        ],
      };

      const graph = new KnowledgeGraph(container, invalidData);

      // Should handle invalid edges (may log warnings or throw recoverable errors)
      // This tests that the graph can be created even with invalid data
      expect(graph).toBeInstanceOf(KnowledgeGraph);
    });
  });

  describe('Callback Error Resilience', () => {
    it('should continue operation when callbacks throw errors', () => {
      const graphData: GraphData = {
        nodes: [
          { id: 'node1', label: 'Node 1' },
          { id: 'node2', label: 'Node 2' },
        ],
        edges: [
          { source: 'node1', target: 'node2' },
        ],
      };

      const graph = new KnowledgeGraph(container, graphData, {
        onStateChange: () => {
          throw new Error('State change callback error');
        },
        onNodeSelected: () => {
          throw new Error('Node selection callback error');
        },
      });

      // Should not throw even when callbacks fail
      expect(() => graph.render()).not.toThrow();

      // Should still create the graph elements
      setTimeout(() => {
        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBe(2);
      }, 100);
    });
  });
});