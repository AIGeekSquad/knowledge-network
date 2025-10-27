/**
 * Graph Renderer Component Tests - TDD approach
 * Tests for rendering actual knowledge graphs using the library
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Mock the knowledge-network library for testing
vi.mock('@aigeeksquad/knowledge-network', () => ({
  KnowledgeGraph: vi.fn().mockImplementation(() => ({
    render: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    updateData: vi.fn().mockResolvedValue(undefined),
    getData: vi.fn().mockReturnValue({ nodes: [], edges: [] })
  }))
}));

describe('Graph Renderer Component', () => {
  let dom: JSDOM;
  let container: HTMLElement;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><div id="container"></div>', {
      url: 'http://localhost:3000' // Avoid opaque origin
    });
    global.document = dom.window.document;
    global.window = dom.window as any;

    // Mock localStorage to avoid security errors
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(() => null)
    } as any;

    container = dom.window.document.getElementById('container')!;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Graph Rendering', () => {
    it('should initialize with sample data', async () => {
      const { BasicGraphRenderer } = await import('../../src/components/graph/BasicGraphRenderer.js');

      const renderer = new BasicGraphRenderer(container);
      await renderer.initialize();

      expect(renderer).toBeDefined();
      expect(container.children.length).toBeGreaterThan(0);
    });

    it('should create KnowledgeGraph instance with sample data', async () => {
      const { KnowledgeGraph } = await import('@aigeeksquad/knowledge-network');
      const { BasicGraphRenderer } = await import('../../src/components/graph/BasicGraphRenderer.js');

      const renderer = new BasicGraphRenderer(container);
      await renderer.render();

      // Should call KnowledgeGraph constructor
      expect(KnowledgeGraph).toHaveBeenCalled();

      // Get the call arguments to verify data and config
      const [, data, config] = (KnowledgeGraph as any).mock.calls[0];

      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
      expect(config.nodeFill).toBe('#107c10');  // Xbox Green
      expect(config.edgeStroke).toBe('#00bcf2'); // Xbox Blue
    });

    it('should handle render errors gracefully', async () => {
      const { KnowledgeGraph } = await import('@aigeeksquad/knowledge-network');

      // Mock render to throw error
      (KnowledgeGraph as any).mockImplementation(() => ({
        render: vi.fn().mockRejectedValue(new Error('Render failed')),
        destroy: vi.fn()
      }));

      const { BasicGraphRenderer } = await import('../../src/components/graph/BasicGraphRenderer.js');

      const renderer = new BasicGraphRenderer(container);

      // Should not throw, should handle error
      await expect(renderer.render()).resolves.not.toThrow();
    });

    it('should clean up properly on destroy', async () => {
      const { BasicGraphRenderer } = await import('../../src/components/graph/BasicGraphRenderer.js');

      const renderer = new BasicGraphRenderer(container);
      await renderer.render();

      // Should not throw when destroying
      expect(() => renderer.destroy()).not.toThrow();

      // Should reset initialized state
      expect(renderer['isInitialized']).toBe(false);
    });
  });

  describe('Sample Data Generation', () => {
    it('should generate valid graph data', async () => {
      const { BasicGraphRenderer } = await import('../../src/components/graph/BasicGraphRenderer.js');

      const renderer = new BasicGraphRenderer(container);
      const data = renderer.getSampleData();

      // Should have nodes and edges
      expect(data).toHaveProperty('nodes');
      expect(data).toHaveProperty('edges');
      expect(Array.isArray(data.nodes)).toBe(true);
      expect(Array.isArray(data.edges)).toBe(true);
      expect(data.nodes.length).toBeGreaterThan(0);
      expect(data.edges.length).toBeGreaterThan(0);

      // Nodes should have required properties
      data.nodes.forEach(node => {
        expect(node).toHaveProperty('id');
        expect(typeof node.id).toBe('string');
      });

      // Edges should reference valid nodes
      data.edges.forEach(edge => {
        expect(edge).toHaveProperty('source');
        expect(edge).toHaveProperty('target');

        const nodeIds = data.nodes.map(n => n.id);
        expect(nodeIds).toContain(edge.source);
        expect(nodeIds).toContain(edge.target);
      });
    });
  });
});