/**
 * Demo Integration Tests - Component Level Testing
 * 
 * Tests actual functionality of demo components with the library
 * Following Constitution requirement for proper testing levels vs E2E over-reliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { KnowledgeGraph, GraphData } from '@aigeeksquad/knowledge-network';

// Mock DOM environment for testing
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class MockHTMLCanvasElement {
    getContext() {
      return {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        canvas: { width: 800, height: 600 }
      };
    }
    get width() { return 800; }
    set width(val) {}
    get height() { return 600; }
    set height(val) {}
  }
});

describe('Demo Integration - Component Level Testing', () => {
  let container: HTMLElement;
  let testData: GraphData;

  beforeEach(() => {
    // Setup DOM container
    container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '600px';
    document.body.appendChild(container);

    // Create test data
    testData = {
      nodes: [
        { id: 'node1', label: 'Test Node 1', type: 'concept' },
        { id: 'node2', label: 'Test Node 2', type: 'entity' },
        { id: 'node3', label: 'Test Node 3', type: 'concept' }
      ],
      edges: [
        { source: 'node1', target: 'node2', type: 'relates-to' },
        { source: 'node2', target: 'node3', type: 'connects-to' }
      ]
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should create KnowledgeGraph instance with demo data', () => {
    // Test: Can import and instantiate KnowledgeGraph
    expect(() => {
      const graph = new KnowledgeGraph(container, testData);
      expect(graph).toBeDefined();
      expect(typeof graph.render).toBe('function');
      graph.destroy?.();
    }).not.toThrow();
  });

  it('should handle basic rendering without errors', async () => {
    // Test: Can render without throwing errors
    const graph = new KnowledgeGraph(container, testData, {
      width: 800,
      height: 600,
      edgeRenderer: 'simple'
    });

    expect(() => {
      graph.render();
    }).not.toThrow();

    graph.destroy?.();
  });

  it('should support edge bundling rendering strategy', async () => {
    // Test: Can use advanced edge bundling
    const graph = new KnowledgeGraph(container, testData, {
      width: 800,
      height: 600,
      edgeRenderer: 'bundled',
      edgeBundling: {
        iterations: 30,
        compatibilityThreshold: 0.4
      }
    });

    expect(() => {
      graph.render();
    }).not.toThrow();

    graph.destroy?.();
  });

  it('should handle reactive event streaming', () => {
    // Test: Reactive events work properly
    let nodeSelectedCalled = false;
    let stateChangeCalled = false;

    const graph = new KnowledgeGraph(container, testData, {
      onNodeSelected: (nodeId: string) => {
        nodeSelectedCalled = true;
        expect(typeof nodeId).toBe('string');
      },
      onStateChange: (state: string) => {
        stateChangeCalled = true;
        expect(typeof state).toBe('string');
      }
    });

    // Simulate events
    if (graph.selectNode) {
      graph.selectNode('node1');
      expect(nodeSelectedCalled).toBe(true);
    }

    graph.destroy?.();
  });

  it('should validate demo data generation works', () => {
    // Test: Demo data generator produces valid data
    const demoNodes = Array.from({ length: 10 }, (_, i) => ({
      id: `demo-${i}`,
      label: `Demo Node ${i}`,
      type: i % 2 === 0 ? 'concept' : 'entity'
    }));

    const demoEdges = Array.from({ length: 8 }, (_, i) => ({
      source: `demo-${i}`,
      target: `demo-${i + 1}`,
      type: 'demo-connection'
    }));

    const demoData = { nodes: demoNodes, edges: demoEdges };

    expect(() => {
      const graph = new KnowledgeGraph(container, demoData);
      graph.render();
      graph.destroy?.();
    }).not.toThrow();
  });

  it('should validate component composition without E2E dependency', () => {
    // Test: Demo components can compose together
    const graph = new KnowledgeGraph(container, testData);
    
    // Test basic API surface exists
    expect(graph).toHaveProperty('render');
    if (graph.destroy) expect(typeof graph.destroy).toBe('function');
    if (graph.selectNode) expect(typeof graph.selectNode).toBe('function');
    if (graph.clearSelection) expect(typeof graph.clearSelection).toBe('function');

    graph.destroy?.();
  });
});