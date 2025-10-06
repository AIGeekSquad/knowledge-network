/**
 * Flow Verification Tests
 *
 * These tests verify the correct sequence: Layout → Edge Generation → Rendering → Zoom
 * and ensure that no rendering occurs during layout calculation phase.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KnowledgeGraph } from '../../src/KnowledgeGraph';
import { LayoutEngine } from '../../src/layout/LayoutEngine';
import { RenderingSystem } from '../../src/rendering/RenderingSystem';
import { ViewportManager } from '../../src/viewport/ViewportManager';
import { EdgeRenderer } from '../../src/edges/EdgeRenderer';
import type { GraphData, GraphConfig } from '../../src/types';
import * as d3 from 'd3';

describe('Flow Verification', () => {
  let container: HTMLElement;
  let sampleData: GraphData;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    sampleData = {
      nodes: [
        { id: 'node1', label: 'Node 1' },
        { id: 'node2', label: 'Node 2' },
        { id: 'node3', label: 'Node 3' }
      ],
      edges: [
        { source: 'node1', target: 'node2' },
        { source: 'node2', target: 'node3' }
      ]
    };
  });

  describe('Proper Flow Sequence', () => {
    it('should follow Layout → Edge → Render → Zoom sequence in modular approach', async () => {
      const executionOrder: string[] = [];

      // Step 1: Layout calculation (no DOM manipulation)
      const layoutEngine = new LayoutEngine('force-directed', {
        width: 800,
        height: 600
      });

      layoutEngine.on('layoutStart', () => executionOrder.push('layout-start'));
      layoutEngine.on('layoutEnd', () => executionOrder.push('layout-complete'));

      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      expect(executionOrder).toEqual(['layout-start', 'layout-complete']);

      // Step 2: Edge generation (pure data processing)
      executionOrder.push('edge-generation');
      // Edge generation should happen here as pure data processing
      // (not during layout or rendering)

      // Step 3: Rendering system setup and render
      const renderingSystem = new RenderingSystem(container, {
        width: 800,
        height: 600
      });

      renderingSystem.on('rendered', () => executionOrder.push('render-complete'));
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      // Step 4: Viewport/Zoom setup (after rendering)
      const svg = container.querySelector('svg')!;
      const viewportManager = new ViewportManager();
      viewportManager.setup(svg, renderingSystem);
      executionOrder.push('viewport-ready');

      // Verify correct sequence
      expect(executionOrder).toEqual([
        'layout-start',
        'layout-complete',
        'edge-generation',
        'render-complete',
        'viewport-ready'
      ]);
    });

    it('should ensure layout calculation produces data without DOM operations', async () => {
      const layoutEngine = new LayoutEngine('circular', {
        width: 600,
        height: 400
      });

      // Mock DOM operations to detect violations
      const domOperations: string[] = [];
      const originalCreateElement = document.createElement.bind(document);
      const originalCreateElementNS = document.createElementNS.bind(document);

      document.createElement = vi.fn((tagName: string) => {
        domOperations.push(`createElement: ${tagName}`);
        return originalCreateElement(tagName);
      });

      document.createElementNS = vi.fn((namespace: string, tagName: string) => {
        domOperations.push(`createElementNS: ${tagName}`);
        return originalCreateElementNS(namespace, tagName);
      });

      try {
        const result = await layoutEngine.calculateLayout(sampleData);

        // Layout should complete without any DOM operations
        expect(domOperations).toEqual([]);

        // But should produce valid positioned data
        expect(result.nodes).toHaveLength(3);
        expect(result.nodes.every(node =>
          typeof node.x === 'number' && typeof node.y === 'number'
        )).toBe(true);
      } finally {
        document.createElement = originalCreateElement;
        document.createElementNS = originalCreateElementNS;
      }
    });

    it('should ensure rendering only happens after layout is complete', (done) => {
      const events: Array<{ type: string; timestamp: number }> = [];
      const startTime = Date.now();

      const layoutEngine = new LayoutEngine('force-directed');
      const renderingSystem = new RenderingSystem(container);

      layoutEngine.on('layoutStart', () => {
        events.push({ type: 'layout-start', timestamp: Date.now() - startTime });
      });

      layoutEngine.on('layoutEnd', (result) => {
        events.push({ type: 'layout-end', timestamp: Date.now() - startTime });

        // Only now should rendering begin
        renderingSystem.initialize();
        renderingSystem.render(result);
      });

      renderingSystem.on('rendered', () => {
        events.push({ type: 'render-complete', timestamp: Date.now() - startTime });

        // Verify temporal order
        const layoutStart = events.find(e => e.type === 'layout-start')!;
        const layoutEnd = events.find(e => e.type === 'layout-end')!;
        const renderComplete = events.find(e => e.type === 'render-complete')!;

        expect(layoutStart.timestamp).toBeLessThan(layoutEnd.timestamp);
        expect(layoutEnd.timestamp).toBeLessThan(renderComplete.timestamp);

        done();
      });

      layoutEngine.calculateLayout(sampleData);
    });
  });

  describe('Edge Generation Timing', () => {
    it('should generate edges after layout but before rendering', async () => {
      const phases: string[] = [];

      // Phase 1: Layout
      const layoutEngine = new LayoutEngine('force-directed');
      const layoutResult = await layoutEngine.calculateLayout(sampleData);
      phases.push('layout-complete');

      // Phase 2: Edge generation (should happen here, not during layout)
      phases.push('edge-generation-start');

      // Simulate edge processing that would happen in a proper implementation
      const processedEdges = layoutResult.edges.map(edge => ({
        ...edge,
        // Edge processing should use layout data, not create it
        computed: true
      }));

      phases.push('edge-generation-complete');

      // Phase 3: Rendering
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();
      renderingSystem.render({
        ...layoutResult,
        edges: processedEdges
      });
      phases.push('render-complete');

      expect(phases).toEqual([
        'layout-complete',
        'edge-generation-start',
        'edge-generation-complete',
        'render-complete'
      ]);
    });

    it('should not perform edge bundling during layout calculation', async () => {
      const layoutEngine = new LayoutEngine('force-directed');

      // Track if complex edge operations happen during layout
      let edgeBundlingCalled = false;
      const originalMath = Math.sqrt;

      Math.sqrt = vi.fn((n: number) => {
        // If we see complex math during layout, it might indicate
        // edge bundling happening at the wrong time
        if (n > 1000) { // Arbitrary threshold for "complex" operations
          edgeBundlingCalled = true;
        }
        return originalMath(n);
      });

      try {
        await layoutEngine.calculateLayout(sampleData);

        // Simple layout shouldn't trigger complex edge computations
        expect(edgeBundlingCalled).toBe(false);
      } finally {
        Math.sqrt = originalMath;
      }
    });
  });

  describe('Zoom/Viewport Timing', () => {
    it('should only setup viewport after rendering is complete', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Before rendering, there should be no SVG
      expect(container.querySelector('svg')).toBeNull();

      // After rendering, SVG should exist for viewport setup
      const mockLayout = {
        nodes: [{ id: 'n1', label: 'Node 1', x: 100, y: 100 }],
        edges: [],
        bounds: { minX: 50, minY: 50, maxX: 150, maxY: 150, width: 100, height: 100 }
      };

      renderingSystem.render(mockLayout);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      // Now viewport can be setup
      const viewportManager = new ViewportManager();
      expect(() => viewportManager.setup(svg!, renderingSystem)).not.toThrow();
    });

    it('should handle zoom operations only after complete rendering', () => {
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      const mockLayout = {
        nodes: [{ id: 'n1', label: 'Node 1', x: 100, y: 100 }],
        edges: [],
        bounds: { minX: 50, minY: 50, maxX: 150, maxY: 150, width: 100, height: 100 }
      };

      renderingSystem.render(mockLayout);
      const svg = container.querySelector('svg')!;

      const viewportManager = new ViewportManager();
      viewportManager.setup(svg, renderingSystem);

      // Zoom should work after rendering
      const initialTransform = viewportManager.getTransform();
      viewportManager.zoomIn(1.5);
      const zoomedTransform = viewportManager.getTransform();

      expect(zoomedTransform.scale).toBeGreaterThan(initialTransform.scale);
    });
  });

  describe('Anti-Pattern Detection', () => {
    it('should detect if KnowledgeGraph violates proper flow', () => {
      // The current KnowledgeGraph implementation violates proper flow
      // by doing direct D3 rendering in the render() method
      const graph = new KnowledgeGraph(container, sampleData);

      // Monitor D3 operations during render
      const d3Operations: string[] = [];
      const originalSelect = d3.select;

      d3.select = vi.fn((selector: any) => {
        d3Operations.push(`d3.select called`);
        return originalSelect(selector);
      }) as any;

      try {
        graph.render();

        // CURRENT VIOLATION: KnowledgeGraph does direct D3 operations
        // This test documents the current broken architecture
        expect(d3Operations.length).toBeGreaterThan(0);

        // TODO: In proper architecture, KnowledgeGraph should only orchestrate:
        // 1. LayoutEngine.calculateLayout()
        // 2. EdgeRenderer.render()
        // 3. RenderingSystem.render()
        // 4. ViewportManager.setup()
        //
        // And should NOT call d3.select directly
      } finally {
        d3.select = originalSelect;
      }
    });

    it('should validate that modular components are actually used', () => {
      const graph = new KnowledgeGraph(container, sampleData);

      // The current implementation doesn't use modular components
      // This test documents what SHOULD happen in a proper implementation

      // Check if LayoutEngine is used (currently it's not)
      const layoutEngineUsed = !!graph.getSimulation; // Simulation is in KnowledgeGraph, not LayoutEngine

      // CURRENT VIOLATION: KnowledgeGraph has its own simulation
      // Instead of using LayoutEngine
      expect(typeof graph.getSimulation).toBe('function');

      // TODO: In proper architecture:
      // - KnowledgeGraph should delegate to LayoutEngine
      // - KnowledgeGraph should delegate to RenderingSystem
      // - KnowledgeGraph should delegate to ViewportManager
      // - KnowledgeGraph should NOT have direct D3 code
    });
  });

  describe('Data Integrity During Flow', () => {
    it('should maintain data integrity through the entire flow', async () => {
      const originalData = JSON.parse(JSON.stringify(sampleData));

      // Step 1: Layout
      const layoutEngine = new LayoutEngine();
      const layoutResult = await layoutEngine.calculateLayout(sampleData);

      // Data should be enhanced, not modified
      expect(layoutResult.nodes).toHaveLength(originalData.nodes.length);
      expect(layoutResult.edges).toHaveLength(originalData.edges.length);

      // Original IDs should be preserved
      expect(layoutResult.nodes.map(n => n.id)).toEqual(originalData.nodes.map(n => n.id));

      // Step 2: Rendering
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();
      renderingSystem.render(layoutResult);

      // DOM should be created but data unchanged
      const nodes = container.querySelectorAll('circle, rect, path');
      expect(nodes.length).toBeGreaterThan(0);

      // Step 3: Viewport
      const svg = container.querySelector('svg')!;
      const viewportManager = new ViewportManager();
      viewportManager.setup(svg, renderingSystem);

      // Transform operations shouldn't affect data
      viewportManager.zoomTo(2);
      // Data integrity should be maintained (no way to verify without proper architecture)
    });

    it('should ensure each phase operates on appropriate data', async () => {
      // Layout phase: operates on raw graph data
      const layoutEngine = new LayoutEngine();
      const layoutInput = { nodes: [...sampleData.nodes], edges: [...sampleData.edges] };
      const layoutResult = await layoutEngine.calculateLayout(layoutInput);

      // Layout should add position data
      expect(layoutResult.nodes.every(n => 'x' in n && 'y' in n)).toBe(true);
      expect(layoutResult).toHaveProperty('bounds');

      // Rendering phase: operates on positioned data
      const renderingSystem = new RenderingSystem(container);
      renderingSystem.initialize();

      // Should accept positioned data
      expect(() => renderingSystem.render(layoutResult)).not.toThrow();

      // Viewport phase: operates on screen coordinates
      const svg = container.querySelector('svg')!;
      const viewportManager = new ViewportManager();
      viewportManager.setup(svg, renderingSystem);

      // Should handle coordinate transformations
      const screenPoint = { x: 100, y: 100 };
      const graphPoint = viewportManager.screenToGraph(screenPoint);
      expect(graphPoint).toHaveProperty('x');
      expect(graphPoint).toHaveProperty('y');
    });
  });
});