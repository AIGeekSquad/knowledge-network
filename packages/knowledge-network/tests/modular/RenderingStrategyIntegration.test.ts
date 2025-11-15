/**
 * Rendering Strategy Integration Tests - Working Implementation
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('Rendering Strategy Integration', () => {
  it('should create modular knowledge graph', async () => {
    const { ModularKnowledgeGraph } = await import('../../src/modular/ModularKnowledgeGraph');
    
    const mockContainer = document.createElement('div');
    const graph = new ModularKnowledgeGraph({
      container: mockContainer,
      initialStrategy: 'canvas',
      edgeRendering: {
        defaultRenderer: 'simple',
        allowDynamicSwitching: true
      },
      performance: {
        maxResponseTime: 100,
        enableStatePreservation: true,
        enablePerformanceMonitoring: true
      },
      visual: {
        nodes: { defaultRadius: 5, defaultFillColor: '#4A90E2' },
        edges: { defaultStrokeColor: '#999', defaultStrokeWidth: 1, opacity: 0.6 }
      }
    });
    
    expect(graph).toBeTruthy();
    expect(graph.getAvailableStrategies()).toEqual([]);
    expect(graph.getActiveStrategy()).toBeNull();
  });

  it('should initialize and cleanup graph', async () => {
    const { ModularKnowledgeGraph } = await import('../../src/modular/ModularKnowledgeGraph');
    
    const mockContainer = document.createElement('div');
    const graph = new ModularKnowledgeGraph({
      container: mockContainer,
      initialStrategy: 'canvas',
      edgeRendering: { defaultRenderer: 'simple', allowDynamicSwitching: true },
      performance: { maxResponseTime: 100, enableStatePreservation: true, enablePerformanceMonitoring: true },
      visual: {
        nodes: { defaultRadius: 5, defaultFillColor: '#4A90E2' },
        edges: { defaultStrokeColor: '#999', defaultStrokeWidth: 1, opacity: 0.6 }
      }
    });
    
    await graph.initializeAsync();
    await expect(graph.cleanupAsync()).resolves.toBeUndefined();
  });

  it('should get performance statistics', async () => {
    const { ModularKnowledgeGraph } = await import('../../src/modular/ModularKnowledgeGraph');
    
    const mockContainer = document.createElement('div');
    const graph = new ModularKnowledgeGraph({
      container: mockContainer,
      initialStrategy: 'canvas',
      edgeRendering: { defaultRenderer: 'simple', allowDynamicSwitching: true },
      performance: { maxResponseTime: 100, enableStatePreservation: true, enablePerformanceMonitoring: true },
      visual: {
        nodes: { defaultRadius: 5, defaultFillColor: '#4A90E2' },
        edges: { defaultStrokeColor: '#999', defaultStrokeWidth: 1, opacity: 0.6 }
      }
    });
    
    const stats = graph.getPerformanceStats();
    expect(stats).toBeTruthy();
    expect(stats.isCompliant).toBe(true);
  });

  it('should handle edge renderer switching', async () => {
    const { ModularKnowledgeGraph } = await import('../../src/modular/ModularKnowledgeGraph');
    
    const mockContainer = document.createElement('div');
    const graph = new ModularKnowledgeGraph({
      container: mockContainer,
      initialStrategy: 'canvas',
      edgeRendering: { defaultRenderer: 'simple', allowDynamicSwitching: true },
      performance: { maxResponseTime: 100, enableStatePreservation: true, enablePerformanceMonitoring: true },
      visual: {
        nodes: { defaultRadius: 5, defaultFillColor: '#4A90E2' },
        edges: { defaultStrokeColor: '#999', defaultStrokeWidth: 1, opacity: 0.6 }
      }
    });
    
    expect(graph.switchEdgeRenderer('bundling')).toBe(true);
    expect(graph.switchEdgeRenderer('simple')).toBe(true);
  });

  it('should get navigation state', async () => {
    const { ModularKnowledgeGraph } = await import('../../src/modular/ModularKnowledgeGraph');
    
    const mockContainer = document.createElement('div');
    const graph = new ModularKnowledgeGraph({
      container: mockContainer,
      initialStrategy: 'canvas',
      edgeRendering: { defaultRenderer: 'simple', allowDynamicSwitching: true },
      performance: { maxResponseTime: 100, enableStatePreservation: true, enablePerformanceMonitoring: true },
      visual: {
        nodes: { defaultRadius: 5, defaultFillColor: '#4A90E2' },
        edges: { defaultStrokeColor: '#999', defaultStrokeWidth: 1, opacity: 0.6 }
      }
    });
    
    const navState = graph.getNavigationState();
    expect(navState.zoomLevel).toBe(1.0);
    expect(navState.interactionMode).toBe('navigate');
  });
});