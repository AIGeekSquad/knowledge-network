/**
 * Spatial Canvas Integration
 *
 * Helper utilities for integrating the EnhancedCanvasRenderer with existing
 * rendering systems and providing easy migration from basic CanvasRenderer.
 *
 * This module provides factory functions, configuration presets, and
 * migration utilities to streamline adoption of spatial-aware rendering.
 */

import { EnhancedCanvasRenderer, type CanvasRenderingConfig } from './EnhancedCanvasRenderer';
import { CanvasRenderer } from './CanvasRenderer';
import type { IRenderer, RendererConfig } from './IRenderer';
import type { SpatialIndexConfig } from '../spatial/types';

/**
 * Performance presets for different use cases
 */
export interface PerformancePreset {
  name: string;
  description: string;
  config: CanvasRenderingConfig;
  spatialConfig: Partial<SpatialIndexConfig>;
}

/**
 * Predefined performance presets
 */
export const PERFORMANCE_PRESETS: Record<string, PerformancePreset> = {
  fast: {
    name: 'Fast',
    description: 'Optimized for speed with reduced visual fidelity',
    config: {
      width: 800,
      height: 600,
      enableViewportCulling: true,
      enableLevelOfDetail: true,
      batchSize: 200,
      useOffscreenCanvas: true,
      pixelDensity: 1,
      minZoom: 0.2,
      maxZoom: 5,
    },
    spatialConfig: {
      maxDepth: 6,
      maxNodesPerLeaf: 20,
      enableCaching: true,
      cacheSize: 50,
    },
  },

  balanced: {
    name: 'Balanced',
    description: 'Good balance of performance and visual quality',
    config: {
      width: 800,
      height: 600,
      enableViewportCulling: true,
      enableLevelOfDetail: true,
      batchSize: 100,
      useOffscreenCanvas: true,
      pixelDensity: window.devicePixelRatio || 1,
      minZoom: 0.1,
      maxZoom: 10,
    },
    spatialConfig: {
      maxDepth: 10,
      maxNodesPerLeaf: 10,
      enableCaching: true,
      cacheSize: 100,
    },
  },

  highQuality: {
    name: 'High Quality',
    description: 'Maximum visual fidelity, may be slower on large graphs',
    config: {
      width: 800,
      height: 600,
      enableViewportCulling: true,
      enableLevelOfDetail: false,
      batchSize: 50,
      useOffscreenCanvas: true,
      pixelDensity: window.devicePixelRatio || 1,
      minZoom: 0.05,
      maxZoom: 20,
    },
    spatialConfig: {
      maxDepth: 12,
      maxNodesPerLeaf: 5,
      enableCaching: true,
      cacheSize: 200,
      rayIntersectionTolerance: 0.5,
      pointQueryTolerance: 0.05,
    },
  },

  largeGraph: {
    name: 'Large Graph',
    description: 'Optimized for graphs with 1000+ nodes',
    config: {
      width: 800,
      height: 600,
      enableViewportCulling: true,
      enableLevelOfDetail: true,
      batchSize: 500,
      useOffscreenCanvas: true,
      pixelDensity: 1,
      minZoom: 0.1,
      maxZoom: 8,
    },
    spatialConfig: {
      maxDepth: 8,
      maxNodesPerLeaf: 25,
      enableCaching: true,
      cacheSize: 300,
    },
  },
};

/**
 * Factory for creating spatial-aware canvas renderers
 */
export class SpatialCanvasFactory {
  /**
   * Create renderer with performance preset
   */
  static create(preset: keyof typeof PERFORMANCE_PRESETS = 'balanced'): EnhancedCanvasRenderer {
    const presetConfig = PERFORMANCE_PRESETS[preset];
    if (!presetConfig) {
      throw new Error(`Unknown preset: ${preset}`);
    }

    const renderer = new EnhancedCanvasRenderer();
    return renderer;
  }

  /**
   * Create renderer with custom configuration
   */
  static createCustom(config: CanvasRenderingConfig): EnhancedCanvasRenderer {
    const renderer = new EnhancedCanvasRenderer();
    return renderer;
  }

  /**
   * Create renderer optimized for mobile devices
   */
  static createMobile(): EnhancedCanvasRenderer {
    const mobileConfig: CanvasRenderingConfig = {
      width: Math.min(window.innerWidth, 800),
      height: Math.min(window.innerHeight, 600),
      enableViewportCulling: true,
      enableLevelOfDetail: true,
      batchSize: 150,
      useOffscreenCanvas: false, // May not be supported on all mobile browsers
      pixelDensity: Math.min(window.devicePixelRatio || 1, 2), // Limit for performance
      minZoom: 0.3,
      maxZoom: 5,
    };

    return new EnhancedCanvasRenderer();
  }

  /**
   * Create renderer for development/debugging
   */
  static createDebug(): EnhancedCanvasRenderer {
    const debugConfig: CanvasRenderingConfig = {
      width: 800,
      height: 600,
      enableViewportCulling: false, // Show all nodes for debugging
      enableLevelOfDetail: false,
      batchSize: 10, // Small batches for easier debugging
      useOffscreenCanvas: false,
      pixelDensity: 1,
      minZoom: 0.01,
      maxZoom: 50,
      enableMouseInteraction: true,
      selectionTolerance: 20, // Larger tolerance for easier debugging
    };

    return new EnhancedCanvasRenderer();
  }
}

/**
 * Migration utilities for upgrading from basic CanvasRenderer
 */
export class CanvasRendererMigration {
  /**
   * Create enhanced renderer that matches basic renderer behavior
   */
  static createCompatible(basicConfig: RendererConfig): EnhancedCanvasRenderer {
    const enhancedConfig: CanvasRenderingConfig = {
      ...basicConfig,
      enableViewportCulling: false, // Match basic renderer behavior
      enableLevelOfDetail: false,
      batchSize: 1000, // Large batches to minimize batching effects
      useOffscreenCanvas: false,
      enableMouseInteraction: false, // Disabled by default for compatibility
    };

    return new EnhancedCanvasRenderer();
  }

  /**
   * Gradually enable spatial features
   */
  static enableSpatialFeatures(renderer: EnhancedCanvasRenderer): void {
    // This would update renderer configuration to enable spatial features
    // In a real implementation, this might involve configuration updates
    console.log('Enabling spatial features on renderer');
  }

  /**
   * Compare performance between basic and enhanced renderers
   */
  static async performanceTest(
    basicRenderer: CanvasRenderer,
    enhancedRenderer: EnhancedCanvasRenderer,
    testData: any
  ): Promise<{
    basic: { renderTime: number; memory: number };
    enhanced: { renderTime: number; memory: number };
  }> {
    // Performance testing implementation would go here
    // This is a placeholder for the API
    return {
      basic: { renderTime: 0, memory: 0 },
      enhanced: { renderTime: 0, memory: 0 },
    };
  }
}

/**
 * Spatial interaction helpers for common use cases
 */
export class SpatialInteractionHelpers {
  /**
   * Setup common mouse interactions
   */
  static setupMouseInteractions(
    renderer: EnhancedCanvasRenderer,
    options: {
      enableHover?: boolean;
      enableSelection?: boolean;
      enablePanning?: boolean;
      enableZooming?: boolean;
      onNodeHover?: (node: any) => void;
      onNodeClick?: (node: any) => void;
      onSelectionChange?: (selectedNodes: any[]) => void;
    } = {}
  ): () => void {
    const {
      enableHover = true,
      enableSelection = true,
      enablePanning = true,
      enableZooming = true,
      onNodeHover,
      onNodeClick,
      onSelectionChange,
    } = options;

    const container = renderer.getContainer() as HTMLCanvasElement;
    const listeners: Array<{ event: string; handler: EventListener }> = [];

    // Hover handling
    if (enableHover && onNodeHover) {
      const hoverHandler = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const node = renderer.getNodeAt(x, y);
        if (node) {
          onNodeHover(node);
        }
      };
      container.addEventListener('mousemove', hoverHandler);
      listeners.push({ event: 'mousemove', handler: hoverHandler });
    }

    // Click handling
    if (enableSelection && onNodeClick) {
      const clickHandler = (event: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const node = renderer.getNodeAt(x, y);
        if (node) {
          onNodeClick(node);
        }
      };
      container.addEventListener('click', clickHandler);
      listeners.push({ event: 'click', handler: clickHandler });
    }

    // Panning handling
    if (enablePanning) {
      let isPanning = false;
      let lastPanPoint = { x: 0, y: 0 };

      const panStartHandler = (event: MouseEvent) => {
        if (event.button === 1 || (event.button === 0 && event.shiftKey)) {
          isPanning = true;
          lastPanPoint = { x: event.clientX, y: event.clientY };
          event.preventDefault();
        }
      };

      const panMoveHandler = (event: MouseEvent) => {
        if (isPanning) {
          const deltaX = event.clientX - lastPanPoint.x;
          const deltaY = event.clientY - lastPanPoint.y;

          const currentTransform = renderer.getTransform();
          renderer.setPan({
            x: currentTransform.x + deltaX,
            y: currentTransform.y + deltaY,
          });

          lastPanPoint = { x: event.clientX, y: event.clientY };
          event.preventDefault();
        }
      };

      const panEndHandler = () => {
        isPanning = false;
      };

      container.addEventListener('mousedown', panStartHandler);
      container.addEventListener('mousemove', panMoveHandler);
      container.addEventListener('mouseup', panEndHandler);

      listeners.push(
        { event: 'mousedown', handler: panStartHandler },
        { event: 'mousemove', handler: panMoveHandler },
        { event: 'mouseup', handler: panEndHandler }
      );
    }

    // Return cleanup function
    return () => {
      listeners.forEach(({ event, handler }) => {
        container.removeEventListener(event, handler);
      });
    };
  }

  /**
   * Setup region selection with drag
   */
  static setupRegionSelection(
    renderer: EnhancedCanvasRenderer,
    onRegionSelect: (nodes: any[]) => void
  ): () => void {
    const container = renderer.getContainer() as HTMLCanvasElement;
    let isSelecting = false;
    let startPoint = { x: 0, y: 0 };

    const startHandler = (event: MouseEvent) => {
      if (event.button === 0 && event.altKey) {
        isSelecting = true;
        const rect = container.getBoundingClientRect();
        startPoint = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        event.preventDefault();
      }
    };

    const moveHandler = (event: MouseEvent) => {
      if (isSelecting) {
        // Visual feedback could be added here
        event.preventDefault();
      }
    };

    const endHandler = (event: MouseEvent) => {
      if (isSelecting) {
        const rect = container.getBoundingClientRect();
        const endPoint = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        const selectionRect = {
          x: Math.min(startPoint.x, endPoint.x),
          y: Math.min(startPoint.y, endPoint.y),
          width: Math.abs(endPoint.x - startPoint.x),
          height: Math.abs(endPoint.y - startPoint.y),
        };

        const selectedNodes = renderer.getNodesInRegion(selectionRect);
        onRegionSelect(selectedNodes);

        isSelecting = false;
        event.preventDefault();
      }
    };

    container.addEventListener('mousedown', startHandler);
    container.addEventListener('mousemove', moveHandler);
    container.addEventListener('mouseup', endHandler);

    return () => {
      container.removeEventListener('mousedown', startHandler);
      container.removeEventListener('mousemove', moveHandler);
      container.removeEventListener('mouseup', endHandler);
    };
  }

  /**
   * Setup keyboard shortcuts for common operations
   */
  static setupKeyboardShortcuts(
    renderer: EnhancedCanvasRenderer,
    shortcuts: {
      resetView?: string; // Default: 'r'
      fitView?: string;   // Default: 'f'
      zoomIn?: string;    // Default: '='
      zoomOut?: string;   // Default: '-'
    } = {}
  ): () => void {
    const {
      resetView = 'r',
      fitView = 'f',
      zoomIn = '=',
      zoomOut = '-',
    } = shortcuts;

    const keyHandler = (event: KeyboardEvent) => {
      if (event.target !== document.body && event.target !== renderer.getContainer()) {
        return; // Only handle when not in input fields
      }

      switch (event.key.toLowerCase()) {
        case resetView:
          renderer.resetView();
          event.preventDefault();
          break;
        case fitView:
          renderer.fitToViewport();
          event.preventDefault();
          break;
        case zoomIn:
          const currentZoom = renderer.getTransform().scale;
          renderer.setZoom(currentZoom * 1.2);
          event.preventDefault();
          break;
        case zoomOut:
          const currentZoom2 = renderer.getTransform().scale;
          renderer.setZoom(currentZoom2 / 1.2);
          event.preventDefault();
          break;
      }
    };

    document.addEventListener('keydown', keyHandler);

    return () => {
      document.removeEventListener('keydown', keyHandler);
    };
  }
}

/**
 * Utility for measuring and optimizing renderer performance
 */
export class PerformanceMonitor {
  private metrics: {
    renderTimes: number[];
    spatialQueryTimes: number[];
    nodeCount: number[];
    frameRate: number[];
  } = {
    renderTimes: [],
    spatialQueryTimes: [],
    nodeCount: [],
    frameRate: [],
  };

  private lastFrameTime = 0;

  /**
   * Start monitoring renderer performance
   */
  monitor(renderer: EnhancedCanvasRenderer): () => void {
    let frameCount = 0;
    let lastFpsTime = performance.now();

    const originalRender = renderer.render.bind(renderer);
    renderer.render = (...args) => {
      const startTime = performance.now();
      const result = originalRender(...args);
      const endTime = performance.now();

      this.metrics.renderTimes.push(endTime - startTime);
      this.metrics.nodeCount.push(args[0]?.nodes?.length || 0);

      // Calculate FPS
      frameCount++;
      if (endTime - lastFpsTime >= 1000) {
        this.metrics.frameRate.push(frameCount);
        frameCount = 0;
        lastFpsTime = endTime;
      }

      return result;
    };

    const originalGetNodeAt = renderer.getNodeAt.bind(renderer);
    renderer.getNodeAt = (...args) => {
      const startTime = performance.now();
      const result = originalGetNodeAt(...args);
      const endTime = performance.now();

      this.metrics.spatialQueryTimes.push(endTime - startTime);
      return result;
    };

    return () => {
      // Restore original methods
      renderer.render = originalRender;
      renderer.getNodeAt = originalGetNodeAt;
    };
  }

  /**
   * Get performance statistics
   */
  getStats(): {
    avgRenderTime: number;
    avgSpatialQueryTime: number;
    avgFrameRate: number;
    maxNodeCount: number;
    recommendations: string[];
  } {
    const avgRenderTime = this.average(this.metrics.renderTimes);
    const avgSpatialQueryTime = this.average(this.metrics.spatialQueryTimes);
    const avgFrameRate = this.average(this.metrics.frameRate);
    const maxNodeCount = Math.max(...this.metrics.nodeCount, 0);

    const recommendations: string[] = [];

    if (avgRenderTime > 16) {
      recommendations.push('Consider enabling viewport culling or level-of-detail');
    }

    if (avgSpatialQueryTime > 5) {
      recommendations.push('Spatial index may need optimization for your use case');
    }

    if (avgFrameRate < 30) {
      recommendations.push('Frame rate is low - consider performance optimizations');
    }

    if (maxNodeCount > 1000) {
      recommendations.push('Use largeGraph preset for better performance with many nodes');
    }

    return {
      avgRenderTime,
      avgSpatialQueryTime,
      avgFrameRate,
      maxNodeCount,
      recommendations,
    };
  }

  /**
   * Reset monitoring data
   */
  reset(): void {
    this.metrics = {
      renderTimes: [],
      spatialQueryTimes: [],
      nodeCount: [],
      frameRate: [],
    };
  }

  private average(arr: number[]): number {
    return arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  }
}

/**
 * Export all utilities for easy access
 */
export {
  EnhancedCanvasRenderer,
  type CanvasRenderingConfig,
};