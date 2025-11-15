/**
 * SVG Rendering Strategy Tests - Working Implementation
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('SVGRenderingStrategy Wrapper', () => {
  it('should create SVG strategy with default config', async () => {
    const { ModularSVGRenderingStrategy } = await import('../../src/modular/strategies/SVGRenderingStrategy');
    const strategy = new ModularSVGRenderingStrategy();
    
    expect(strategy).toBeTruthy();
  });

  it('should get SVG capabilities', async () => {
    const { ModularSVGRenderingStrategy } = await import('../../src/modular/strategies/SVGRenderingStrategy');
    const strategy = new ModularSVGRenderingStrategy();
    
    const capabilities = strategy.getCapabilities();
    expect(capabilities.maxNodes).toBeGreaterThan(0);
    expect(capabilities.features.accessibility).toBe(true);
  });

  it('should switch edge renderers', async () => {
    const { ModularSVGRenderingStrategy } = await import('../../src/modular/strategies/SVGRenderingStrategy');
    const strategy = new ModularSVGRenderingStrategy();
    
    expect(strategy.switchEdgeRenderer('bundling')).toBe(true);
    expect(strategy.switchEdgeRenderer('simple')).toBe(true);
  });

  it('should validate configuration', async () => {
    const { ModularSVGRenderingStrategy } = await import('../../src/modular/strategies/SVGRenderingStrategy');
    const strategy = new ModularSVGRenderingStrategy();
    
    const result = strategy.validateConfiguration({} as any);
    expect(result.isValid).toBe(true);
  });

  it('should cleanup resources', async () => {
    const { ModularSVGRenderingStrategy } = await import('../../src/modular/strategies/SVGRenderingStrategy');
    const strategy = new ModularSVGRenderingStrategy();
    
    await expect(strategy.cleanupAsync()).resolves.toBeUndefined();
  });
});