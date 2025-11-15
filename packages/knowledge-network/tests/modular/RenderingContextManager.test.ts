/**
 * Rendering Context Manager Tests - Working Implementation
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('RenderingContextManager', () => {
  it('should create context manager', async () => {
    const { NavigationStateManager, createNavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const { RenderingContextManager, createRenderingContextManager } = await import('../../src/modular/core/RenderingContextManager');
    
    const navManager = createNavigationStateManager();
    const contextManager = createRenderingContextManager(navManager);
    
    expect(contextManager).toBeTruthy();
    expect(contextManager.getPerformanceMetrics()).toBeTruthy();
  });

  it('should handle context transformation utilities', async () => {
    const { ContextTransformUtils } = await import('../../src/modular/core/RenderingContextManager');
    
    const nodes = [
      { id: 'node1', x: 100, y: 200 },
      { id: 'node2', x: 300, y: 400 }
    ];
    
    const layoutNodeMap = ContextTransformUtils.transformToLayoutNodeMap(nodes);
    expect(layoutNodeMap.size).toBe(2);
    expect(layoutNodeMap.get('node1')?.x).toBe(100);
    expect(layoutNodeMap.get('node2')?.y).toBe(400);
  });

  it('should transform edges to EdgeLayout format', async () => {
    const { ContextTransformUtils } = await import('../../src/modular/core/RenderingContextManager');
    
    const edges = [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' }
    ];
    
    const edgeLayouts = ContextTransformUtils.transformToEdgeLayout(edges);
    expect(edgeLayouts.length).toBe(2);
    expect(edgeLayouts[0].sourceId).toBe('node1');
    expect(edgeLayouts[0].targetId).toBe('node2');
  });

  it('should clear cache', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const { RenderingContextManager } = await import('../../src/modular/core/RenderingContextManager');
    
    const navManager = new NavigationStateManager();
    const contextManager = new RenderingContextManager(navManager);
    
    contextManager.clearCache();
    expect(contextManager.getCachedContext('test')).toBeNull();
  });

  it('should get performance metrics', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const { RenderingContextManager } = await import('../../src/modular/core/RenderingContextManager');
    
    const navManager = new NavigationStateManager();
    const contextManager = new RenderingContextManager(navManager);
    
    const metrics = contextManager.getPerformanceMetrics();
    expect(metrics.contextsCreated).toBe(0);
    expect(metrics.averageCreationTime).toBe(0);
  });
});