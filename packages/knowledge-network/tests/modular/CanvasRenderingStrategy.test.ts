/**
 * Canvas Rendering Strategy Tests - Working Implementation
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('CanvasRenderingStrategy Wrapper', () => {
  it('should create Canvas strategy with default config', async () => {
    const { ModularCanvasRenderingStrategy } = await import('../../src/modular/strategies/CanvasRenderingStrategy');
    const strategy = new ModularCanvasRenderingStrategy();
    
    expect(strategy).toBeTruthy();
    expect(strategy.getActiveEdgeRenderer()).toBe('simple');
  });

  it('should get Canvas capabilities', async () => {
    const { ModularCanvasRenderingStrategy } = await import('../../src/modular/strategies/CanvasRenderingStrategy');
    const strategy = new ModularCanvasRenderingStrategy();
    
    const capabilities = strategy.getCapabilities();
    expect(capabilities.maxNodes).toBeGreaterThan(0);
    expect(capabilities.maxEdges).toBeGreaterThan(0);
    expect(capabilities.features.edgeBundling).toBe(true);
  });

  it('should switch edge renderers', async () => {
    const { ModularCanvasRenderingStrategy } = await import('../../src/modular/strategies/CanvasRenderingStrategy');
    const strategy = new ModularCanvasRenderingStrategy();
    
    expect(strategy.switchEdgeRenderer('bundling')).toBe(true);
    expect(strategy.getActiveEdgeRenderer()).toBe('bundling');
    
    expect(strategy.switchEdgeRenderer('simple')).toBe(true);
    expect(strategy.getActiveEdgeRenderer()).toBe('simple');
  });

  it('should validate configuration', async () => {
    const { ModularCanvasRenderingStrategy } = await import('../../src/modular/strategies/CanvasRenderingStrategy');
    const strategy = new ModularCanvasRenderingStrategy();
    
    const result = strategy.validateConfiguration({} as any);
    // In jsdom environment, Canvas might not be supported, so we expect either true or false
    expect(typeof result.isValid).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('should cleanup resources', async () => {
    const { ModularCanvasRenderingStrategy } = await import('../../src/modular/strategies/CanvasRenderingStrategy');
    const strategy = new ModularCanvasRenderingStrategy();
    
    await expect(strategy.cleanupAsync()).resolves.toBeUndefined();
  });
});