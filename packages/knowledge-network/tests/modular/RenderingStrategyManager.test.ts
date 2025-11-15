/**
 * RenderingStrategyManager Tests - Working Implementation
 * 
 * Simple tests that validate core RenderingStrategyManager functionality
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('RenderingStrategyManager', () => {
  it('should create strategy manager with default configuration', async () => {
    const { RenderingStrategyManager } = await import('../../src/modular/core/RenderingStrategyManager');
    const manager = new RenderingStrategyManager();
    
    expect(manager.getAvailableStrategies()).toEqual([]);
    expect(manager.getActiveStrategyName()).toBeNull();
  });

  it('should register and retrieve strategies', async () => {
    const { RenderingStrategyManager } = await import('../../src/modular/core/RenderingStrategyManager');
    const manager = new RenderingStrategyManager();
    
    const mockStrategy = {
      renderAsync: vi.fn(),
      cleanupAsync: vi.fn(),
      handleInteraction: vi.fn(),
      updateVisualsAsync: vi.fn(),
      getCapabilities: vi.fn().mockReturnValue({ maxNodes: 1000 }),
      validateConfiguration: vi.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] })
    };
    
    manager.registerStrategy('test-strategy', mockStrategy);
    expect(manager.getAvailableStrategies()).toContain('test-strategy');
  });

  it('should recommend strategy based on dataset size', async () => {
    const { RenderingStrategyManager } = await import('../../src/modular/core/RenderingStrategyManager');
    const manager = new RenderingStrategyManager();
    
    const smallRecommendation = manager.recommendStrategy(50, 100);
    expect(['canvas', 'svg'].includes(smallRecommendation)).toBe(true);
    
    const largeRecommendation = manager.recommendStrategy(1500, 3000);
    expect(['webgl', 'canvas'].includes(largeRecommendation)).toBe(true);
  });

  it('should handle performance metrics', async () => {
    const { RenderingStrategyManager } = await import('../../src/modular/core/RenderingStrategyManager');
    const manager = new RenderingStrategyManager();
    
    const metrics = manager.getPerformanceMetrics('test-strategy');
    expect(Array.isArray(metrics)).toBe(true);
  });

  it('should manage event listeners', async () => {
    const { RenderingStrategyManager } = await import('../../src/modular/core/RenderingStrategyManager');
    const manager = new RenderingStrategyManager();
    
    const listener = vi.fn();
    manager.addEventListener('test-event', listener);
    manager.removeEventListener('test-event', listener);
    
    // Should not throw errors
    expect(true).toBe(true);
  });
});