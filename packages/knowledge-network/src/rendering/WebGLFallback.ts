/**
 * WebGL Fallback Strategies and Error Handling
 *
 * Provides comprehensive fallback mechanisms when WebGL is unavailable or fails.
 * Ensures graceful degradation to Canvas 2D or software rendering.
 */

import type { IRenderer } from './IRenderer';
import type { RendererConfig, WebGLRendererConfig } from './WebGLRenderer';
import { CanvasRenderer } from './CanvasRenderer';

export interface FallbackConfig {
  enableWebGL1Fallback: boolean;
  enableCanvasFallback: boolean;
  enableSoftwareFallback: boolean;
  maxWebGLInitRetries: number;
  performanceThreshold: number; // FPS below which to trigger fallback
  memoryThreshold: number; // MB above which to trigger fallback
}

export interface CapabilityCheck {
  webgl2: boolean;
  webgl1: boolean;
  canvas2d: boolean;
  extensions: {
    [key: string]: boolean;
  };
  limits: {
    maxTextureSize: number;
    maxVertexAttributes: number;
    maxFragmentTextures: number;
  };
}

export interface FallbackResult {
  success: boolean;
  renderer: IRenderer | null;
  fallbackLevel: 'none' | 'webgl1' | 'canvas2d' | 'software';
  reason: string;
  capabilities: CapabilityCheck;
}

/**
 * Comprehensive fallback system for WebGL rendering
 */
export class WebGLFallback {
  private config: FallbackConfig;
  private lastCapabilityCheck: CapabilityCheck | null = null;

  constructor(config: Partial<FallbackConfig> = {}) {
    this.config = {
      enableWebGL1Fallback: true,
      enableCanvasFallback: true,
      enableSoftwareFallback: false, // Not implemented
      maxWebGLInitRetries: 3,
      performanceThreshold: 30, // 30 FPS
      memoryThreshold: 512, // 512 MB
      ...config,
    };
  }

  /**
   * Attempt to initialize WebGL renderer with fallbacks
   */
  async initializeRenderer(
    container: HTMLElement,
    config: WebGLRendererConfig
  ): Promise<FallbackResult> {
    // Check browser capabilities
    const capabilities = this.checkCapabilities();
    this.lastCapabilityCheck = capabilities;

    // Try WebGL2 first
    if (capabilities.webgl2) {
      try {
        const { WebGLRenderer } = await import('./WebGLRenderer');
        const renderer = new WebGLRenderer();

        for (let attempt = 1; attempt <= this.config.maxWebGLInitRetries; attempt++) {
          try {
            renderer.initialize(container, config);
            return {
              success: true,
              renderer,
              fallbackLevel: 'none',
              reason: 'WebGL2 initialization successful',
              capabilities,
            };
          } catch (error) {
            console.warn(`WebGL2 initialization attempt ${attempt} failed:`, error);

            if (attempt === this.config.maxWebGLInitRetries) {
              renderer.destroy();
              break;
            }

            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          }
        }
      } catch (error) {
        console.warn('WebGL2 renderer import/creation failed:', error);
      }
    }

    // Try WebGL1 fallback
    if (this.config.enableWebGL1Fallback && capabilities.webgl1) {
      try {
        const webgl1Result = await this.initializeWebGL1Fallback(container, config);
        if (webgl1Result.success) {
          return {
            ...webgl1Result,
            fallbackLevel: 'webgl1',
            reason: 'WebGL2 failed, using WebGL1 fallback',
            capabilities,
          };
        }
      } catch (error) {
        console.warn('WebGL1 fallback failed:', error);
      }
    }

    // Try Canvas 2D fallback
    if (this.config.enableCanvasFallback && capabilities.canvas2d) {
      try {
        const canvas2dResult = this.initializeCanvas2DFallback(container, config);
        return {
          ...canvas2dResult,
          fallbackLevel: 'canvas2d',
          reason: 'WebGL not available, using Canvas 2D fallback',
          capabilities,
        };
      } catch (error) {
        console.warn('Canvas 2D fallback failed:', error);
      }
    }

    // Software fallback (not implemented)
    if (this.config.enableSoftwareFallback) {
      console.warn('Software rendering fallback not implemented');
    }

    return {
      success: false,
      renderer: null,
      fallbackLevel: 'software',
      reason: 'All rendering fallbacks failed',
      capabilities,
    };
  }

  /**
   * Check browser rendering capabilities
   */
  checkCapabilities(): CapabilityCheck {
    const canvas = document.createElement('canvas');
    const capabilities: CapabilityCheck = {
      webgl2: false,
      webgl1: false,
      canvas2d: false,
      extensions: {},
      limits: {
        maxTextureSize: 0,
        maxVertexAttributes: 0,
        maxFragmentTextures: 0,
      },
    };

    // Check WebGL2
    try {
      const gl2 = canvas.getContext('webgl2');
      if (gl2) {
        capabilities.webgl2 = true;
        this.checkWebGLCapabilities(gl2, capabilities);
      }
    } catch (error) {
      console.warn('WebGL2 context creation failed:', error);
    }

    // Check WebGL1
    try {
      const gl1 = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl1) {
        capabilities.webgl1 = true;
        if (!capabilities.webgl2) {
          this.checkWebGLCapabilities(gl1 as WebGLRenderingContext, capabilities);
        }
      }
    } catch (error) {
      console.warn('WebGL1 context creation failed:', error);
    }

    // Check Canvas 2D
    try {
      const ctx2d = canvas.getContext('2d');
      capabilities.canvas2d = !!ctx2d;
    } catch (error) {
      console.warn('Canvas 2D context creation failed:', error);
    }

    canvas.remove();
    return capabilities;
  }

  /**
   * Check specific WebGL capabilities and extensions
   */
  private checkWebGLCapabilities(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    capabilities: CapabilityCheck
  ): void {
    try {
      // Check limits
      capabilities.limits.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      capabilities.limits.maxVertexAttributes = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
      capabilities.limits.maxFragmentTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);

      // Check essential extensions
      const extensions = [
        'OES_element_index_uint',
        'WEBGL_debug_renderer_info',
        'EXT_color_buffer_float',
        'OES_texture_float',
        'OES_texture_float_linear',
      ];

      for (const ext of extensions) {
        try {
          capabilities.extensions[ext] = !!gl.getExtension(ext);
        } catch (_error) {
          capabilities.extensions[ext] = false;
        }
      }
    } catch (error) {
      console.warn('Error checking WebGL capabilities:', error);
    }
  }

  /**
   * Initialize WebGL1 fallback renderer
   */
  private async initializeWebGL1Fallback(
    _container: HTMLElement,
    _config: WebGLRendererConfig
  ): Promise<{ success: boolean; renderer: IRenderer | null }> {
    // For now, return failure since WebGL1 renderer is not implemented
    // In a full implementation, this would create a WebGL1-compatible renderer
    console.warn('WebGL1 fallback renderer not implemented');
    return { success: false, renderer: null };
  }

  /**
   * Initialize Canvas 2D fallback renderer
   */
  private initializeCanvas2DFallback(
    container: HTMLElement,
    config: RendererConfig
  ): { success: boolean; renderer: IRenderer | null } {
    try {
      const renderer = new CanvasRenderer();
      renderer.initialize(container, config);
      return { success: true, renderer };
    } catch (error) {
      console.error('Canvas 2D fallback initialization failed:', error);
      return { success: false, renderer: null };
    }
  }

  /**
   * Monitor performance and suggest fallbacks
   */
  monitorPerformance(renderStats: {
    frameTime: number;
    nodesRendered: number;
    memoryUsage?: number;
  }): {
    shouldFallback: boolean;
    reason: string;
    suggestedLevel: 'webgl1' | 'canvas2d' | 'software';
  } {
    const fps = 1000 / renderStats.frameTime;

    // Check performance threshold
    if (fps < this.config.performanceThreshold) {
      return {
        shouldFallback: true,
        reason: `Performance below threshold: ${fps.toFixed(1)} FPS < ${this.config.performanceThreshold} FPS`,
        suggestedLevel: 'canvas2d',
      };
    }

    // Check memory usage
    if (renderStats.memoryUsage && renderStats.memoryUsage > this.config.memoryThreshold) {
      return {
        shouldFallback: true,
        reason: `Memory usage above threshold: ${renderStats.memoryUsage} MB > ${this.config.memoryThreshold} MB`,
        suggestedLevel: 'canvas2d',
      };
    }

    return {
      shouldFallback: false,
      reason: 'Performance within acceptable range',
      suggestedLevel: 'canvas2d',
    };
  }

  /**
   * Get diagnostic information for debugging
   */
  getDiagnostics(): {
    capabilities: CapabilityCheck | null;
    userAgent: string;
    vendor: string;
    renderer: string;
    webglVersion: string;
    glslVersion: string;
  } {
    const canvas = document.createElement('canvas');
    let vendor = 'Unknown';
    let renderer = 'Unknown';
    let webglVersion = 'Unknown';
    let glslVersion = 'Unknown';

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (gl) {
        vendor = gl.getParameter(gl.VENDOR) || 'Unknown';
        renderer = gl.getParameter(gl.RENDERER) || 'Unknown';
        webglVersion = gl.getParameter(gl.VERSION) || 'Unknown';
        glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || 'Unknown';

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor;
          renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer;
        }
      }
    } catch (error) {
      console.warn('Error getting WebGL diagnostics:', error);
    }

    canvas.remove();

    return {
      capabilities: this.lastCapabilityCheck,
      userAgent: navigator.userAgent,
      vendor,
      renderer,
      webglVersion,
      glslVersion,
    };
  }

  /**
   * Create error report for support
   */
  createErrorReport(error: Error, context: string): string {
    const diagnostics = this.getDiagnostics();
    const timestamp = new Date().toISOString();

    return `
WebGL Renderer Error Report
Generated: ${timestamp}

Context: ${context}
Error: ${error.message}
Stack: ${error.stack}

Browser Information:
User Agent: ${diagnostics.userAgent}

WebGL Information:
Vendor: ${diagnostics.vendor}
Renderer: ${diagnostics.renderer}
WebGL Version: ${diagnostics.webglVersion}
GLSL Version: ${diagnostics.glslVersion}

Capabilities: ${JSON.stringify(diagnostics.capabilities, null, 2)}
`.trim();
  }

  /**
   * Update fallback configuration
   */
  updateConfig(config: Partial<FallbackConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): FallbackConfig {
    return { ...this.config };
  }
}