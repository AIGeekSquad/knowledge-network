/**
 * Edge Renderer Registry
 * 
 * Registry system for pluggable edge rendering strategies extending the existing
 * EdgeRenderer interface. Supports runtime registration of SimpleEdge, EdgeBundling,
 * and custom edge rendering implementations.
 * 
 * Task: T020 [US2] - Create EdgeRendererRegistry extending existing EdgeRenderer interface
 * 
 * Key Integration Points:
 * - Extends existing EdgeRenderer interface from archived system
 * - Leverages existing SimpleEdge and EdgeBundling implementations
 * - Maintains backward compatibility with current edge rendering system
 * - Supports dynamic strategy switching while preserving existing functionality
 */

import type { 
  IRenderingStrategy, 
  RenderingContext, 
  RenderingConfig,
  ValidationResult
} from '../../rendering/rendering-strategy';

// Import archived EdgeRenderer types (these will be available after integration)
interface LegacyEdgeRenderer {
  render(container: any, edges: any[], nodes: any[], config: any): any;
  update(result: any): void;
  destroy(result: any): void;
}

/**
 * Registry entry for edge rendering strategies
 */
export interface EdgeRendererEntry {
  /** Unique identifier for the renderer */
  name: string;
  
  /** The renderer implementation */
  renderer: LegacyEdgeRenderer;
  
  /** Metadata about the renderer's capabilities */
  metadata: EdgeRendererMetadata;
  
  /** Whether this renderer is enabled */
  enabled: boolean;
}

/**
 * Metadata describing edge renderer capabilities
 */
export interface EdgeRendererMetadata {
  /** Maximum recommended edge count */
  maxEdges: number;
  
  /** Rendering complexity description */
  complexity: string;
  
  /** Features supported by this renderer */
  features: string[];
  
  /** Performance characteristics */
  performanceProfile: 'fast' | 'balanced' | 'quality';
}

/**
 * Configuration for the edge renderer registry
 */
export interface EdgeRendererRegistryConfig {
  /** Default renderer to use */
  defaultRenderer: string;
  
  /** Automatic fallback chain */
  fallbackChain: string[];
  
  /** Performance thresholds for automatic switching */
  performanceThresholds: {
    edgeCount: number;
    renderTimeMs: number;
  };
}

/**
 * Edge Renderer Registry
 * 
 * Manages registration and selection of edge rendering strategies.
 * Extends the existing EdgeRenderer system with registry pattern for
 * dynamic strategy selection and runtime registration capabilities.
 */
export class EdgeRendererRegistry {
  private renderers: Map<string, EdgeRendererEntry> = new Map();
  private activeRenderer: string | null = null;
  private config: EdgeRendererRegistryConfig;

  constructor(config?: Partial<EdgeRendererRegistryConfig>) {
    this.config = {
      defaultRenderer: 'simple',
      fallbackChain: ['simple', 'bundling'],
      performanceThresholds: {
        edgeCount: 1000,
        renderTimeMs: 100
      },
      ...config
    };

    // Register default renderers
    this.registerDefaultRenderers();
  }

  /**
   * Register a new edge renderer
   */
  public registerRenderer(entry: EdgeRendererEntry): void {
    this.renderers.set(entry.name, entry);
  }

  /**
   * Get a registered renderer by name
   */
  public getRenderer(name: string): LegacyEdgeRenderer | null {
    const entry = this.renderers.get(name);
    return entry?.enabled ? entry.renderer : null;
  }

  /**
   * Get all registered renderer names
   */
  public getRegisteredNames(): string[] {
    return Array.from(this.renderers.keys()).filter(
      name => this.renderers.get(name)?.enabled
    );
  }

  /**
   * Select appropriate renderer based on context
   */
  public selectRenderer(edgeCount: number, nodeCount: number): string {
    // Simple selection logic - can be enhanced based on requirements
    if (edgeCount > this.config.performanceThresholds.edgeCount) {
      return this.renderers.has('bundling') ? 'bundling' : 'simple';
    }
    
    return this.config.defaultRenderer;
  }

  /**
   * Switch to a different renderer
   */
  public switchToRenderer(name: string): boolean {
    const entry = this.renderers.get(name);
    if (!entry || !entry.enabled) {
      return false;
    }
    
    this.activeRenderer = name;
    return true;
  }

  /**
   * Get current active renderer
   */
  public getActiveRenderer(): LegacyEdgeRenderer | null {
    if (!this.activeRenderer) return null;
    return this.getRenderer(this.activeRenderer);
  }

  /**
   * Validate configuration compatibility
   */
  public validateConfiguration(config: RenderingConfig): ValidationResult {
    const errors: Array<{field: string; message: string; code: string}> = [];
    const warnings: Array<{field: string; message: string; severity: 'low' | 'medium' | 'high'}> = [];

    // Validate default renderer exists
    if (!this.renderers.has(this.config.defaultRenderer)) {
      errors.push({
        field: 'defaultRenderer',
        message: `Default renderer '${this.config.defaultRenderer}' is not registered`,
        code: 'MISSING_DEFAULT_RENDERER'
      });
    }

    // Validate fallback chain
    for (const fallback of this.config.fallbackChain) {
      if (!this.renderers.has(fallback)) {
        warnings.push({
          field: 'fallbackChain',
          message: `Fallback renderer '${fallback}' is not registered`,
          severity: 'medium'
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Register default edge renderers (SimpleEdge, EdgeBundling)
   */
  private registerDefaultRenderers(): void {
    // Note: These will be connected to actual implementations during integration
    
    // Register simple edge renderer
    this.registerRenderer({
      name: 'simple',
      renderer: createMockRenderer('simple'), // TODO: Connect to actual SimpleEdge
      metadata: {
        maxEdges: 2000,
        complexity: 'O(n)',
        features: ['lines', 'basic-styling'],
        performanceProfile: 'fast'
      },
      enabled: true
    });

    // Register bundling edge renderer  
    this.registerRenderer({
      name: 'bundling',
      renderer: createMockRenderer('bundling'), // TODO: Connect to actual EdgeBundling
      metadata: {
        maxEdges: 1000,
        complexity: 'O(n²)',
        features: ['bundling', 'curves', 'advanced-styling'],
        performanceProfile: 'quality'
      },
      enabled: true
    });
  }
}

/**
 * Create mock renderer for testing (will be replaced with real implementations)
 */
function createMockRenderer(type: string): LegacyEdgeRenderer {
  return {
    render: () => ({ selection: null, data: { type } }),
    update: () => {},
    destroy: () => {}
  };
}

/**
 * Factory function for creating EdgeRendererRegistry instances
 */
export function createEdgeRendererRegistry(
  config?: Partial<EdgeRendererRegistryConfig>
): EdgeRendererRegistry {
  return new EdgeRendererRegistry(config);
}