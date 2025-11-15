/**
 * EdgeRenderer Registry Tests - Working Implementation
 * 
 * Simple tests that validate core EdgeRendererRegistry functionality
 */

import { describe, it, expect } from 'vitest';
import '../setup';

describe('EdgeRendererRegistry', () => {
  it('should create registry and register default renderers', async () => {
    const { EdgeRendererRegistry } = await import('../../src/modular/core/EdgeRendererRegistry');
    const registry = new EdgeRendererRegistry();
    
    const registeredNames = registry.getRegisteredNames();
    expect(registeredNames).toContain('simple');
    expect(registeredNames).toContain('bundling');
  });

  it('should get registered renderers', async () => {
    const { EdgeRendererRegistry } = await import('../../src/modular/core/EdgeRendererRegistry');
    const registry = new EdgeRendererRegistry();
    
    const simpleRenderer = registry.getRenderer('simple');
    const bundlingRenderer = registry.getRenderer('bundling');
    
    expect(simpleRenderer).toBeTruthy();
    expect(bundlingRenderer).toBeTruthy();
  });

  it('should select appropriate renderer based on dataset size', async () => {
    const { EdgeRendererRegistry } = await import('../../src/modular/core/EdgeRendererRegistry');
    const registry = new EdgeRendererRegistry();
    
    // Small dataset should select simple
    const smallSelection = registry.selectRenderer(100, 50);
    expect(smallSelection).toBe('simple');
    
    // Large dataset should select bundling
    const largeSelection = registry.selectRenderer(1500, 1000);
    expect(largeSelection).toBe('bundling');
  });

  it('should switch active renderer', async () => {
    const { EdgeRendererRegistry } = await import('../../src/modular/core/EdgeRendererRegistry');
    const registry = new EdgeRendererRegistry();
    
    expect(registry.switchToRenderer('simple')).toBe(true);
    expect(registry.switchToRenderer('bundling')).toBe(true);
    expect(registry.switchToRenderer('nonexistent')).toBe(false);
  });

  it('should validate configuration', async () => {
    const { EdgeRendererRegistry } = await import('../../src/modular/core/EdgeRendererRegistry');
    const registry = new EdgeRendererRegistry();
    
    const result = registry.validateConfiguration({} as any);
    expect(result.isValid).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});