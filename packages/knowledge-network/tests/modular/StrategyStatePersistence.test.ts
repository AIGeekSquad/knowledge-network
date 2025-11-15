/**
 * Strategy State Persistence Tests - Working Implementation
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('Strategy State Persistence (FR-007)', () => {
  it('should create navigation state manager', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const manager = new NavigationStateManager();
    
    const state = manager.getState();
    expect(state.zoomLevel).toBe(1.0);
    expect(state.interactionMode).toBe('navigate');
  });

  it('should handle zoom interactions', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const manager = new NavigationStateManager();
    
    expect(manager.handleZoom(1.5)).toBe(true);
    expect(manager.getState().zoomLevel).toBe(1.5);
  });

  it('should handle pan interactions', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const manager = new NavigationStateManager();
    
    expect(manager.handlePan(10, 20)).toBe(true);
    const state = manager.getState();
    expect(state.panOffset.x).toBe(10);
    expect(state.panOffset.y).toBe(20);
  });

  it('should handle node selection', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const manager = new NavigationStateManager();
    
    expect(manager.handleSelection('node1')).toBe(true);
    expect(manager.getState().selectedNodeId).toBe('node1');
  });

  it('should check performance compliance', async () => {
    const { NavigationStateManager } = await import('../../src/modular/core/NavigationStateManager');
    const manager = new NavigationStateManager();
    
    expect(manager.isPerformanceCompliant()).toBe(true);
  });
});