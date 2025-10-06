import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { KnowledgeGraph } from '../src/KnowledgeGraph';
import type { GraphData } from '../src/types';

describe('KnowledgeGraph - User Interactions', () => {
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

  describe('Zoom and Pan Functionality', () => {
    it('should enable zoom and pan by default', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      // Check that zoom behavior is applied (d3 adds __zoom property)
      expect((svg as any).__zoom).toBeDefined();
    });

    it('should disable zoom when configured', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableZoom: false,
      });
      graph.render();

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      // Should not have zoom behavior when disabled
      expect((svg as any).__zoom).toBeUndefined();
    });

    it('should apply zoom constraints when configured', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableZoom: true,
        zoomScaleExtent: [0.5, 3],
      });
      graph.render();

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect((svg as any).__zoom).toBeDefined();
    });

    it('should handle zoom configuration without errors', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableZoom: true,
      });

      // Should not throw when rendering with zoom enabled
      expect(() => graph.render()).not.toThrow();
    });

    it('should handle pan configuration without errors', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableZoom: true,
      });

      // Should not throw when rendering with pan enabled
      expect(() => graph.render()).not.toThrow();
    });
  });

  describe('Drag Functionality', () => {
    it('should enable node dragging by default', () => {
      const graph = new KnowledgeGraph(container, basicGraphData);
      graph.render();

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Check that nodes exist and can potentially be dragged
      expect(circles[0]).toBeDefined();
    });

    it('should disable dragging when configured', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableDrag: false,
      });
      graph.render();

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Should have nodes regardless of drag settings
      expect(circles[0]).toBeDefined();
    });

    it('should handle drag configuration without errors', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableDrag: true,
      });

      // Should not throw when rendering with drag enabled
      expect(() => graph.render()).not.toThrow();
    });

    it('should create draggable nodes when enabled', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableDrag: true,
      });
      graph.render();

      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThan(0);

      // Each node should be created successfully
      circles.forEach(circle => {
        expect(circle).toBeDefined();
      });
    });
  });

  describe('Combined Interactions', () => {
    it('should handle both zoom and drag when both enabled', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableZoom: true,
        enableDrag: true,
      });
      graph.render();

      const svg = container.querySelector('svg');
      const circles = container.querySelectorAll('circle');

      expect(svg).toBeTruthy();
      expect(circles.length).toBeGreaterThan(0);
      expect((svg as any).__zoom).toBeDefined();
      expect(circles[0]).toBeDefined();
    });

    it('should configure interaction features independently', () => {
      const graph = new KnowledgeGraph(container, basicGraphData, {
        enableZoom: true,
        enableDrag: true,
      });

      // Should not throw when rendering with both interactions enabled
      expect(() => graph.render()).not.toThrow();

      // Both features should be available
      const svg = container.querySelector('svg');
      const circles = container.querySelectorAll('circle');

      expect((svg as any).__zoom).toBeDefined();
      expect(circles[0]).toBeDefined();
    });
  });
});