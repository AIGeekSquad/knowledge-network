/**
 * WebGL Renderer for GPU-accelerated graph rendering
 *
 * Provides high-performance rendering of massive graphs (10,000+ nodes) using WebGL2.
 * Features spatial indexing integration, viewport management, and GPU-based picking.
 */

import type { IRenderer } from './IRenderer';
import type {
  RendererType,
  RendererConfig,
  RenderConfig,
  NodeRenderConfig,
  EdgeRenderConfig,
  LabelRenderConfig,
  NodeStyleUpdate,
  EdgeStyleUpdate,
  HighlightConfig,
  Transform,
  LabelItem,
  NodeShape,
} from './RenderingSystem';
import type {
  LayoutResult,
  PositionedNode,
  PositionedEdge,
  NodePosition,
  EdgePosition,
} from '../layout/LayoutEngine';
import type { SpatialIndexer } from '../spatial/SpatialIndexer';
import type { Point, Rectangle } from '../spatial/types';

import {
  NODE_VERTEX_SHADER,
  NODE_FRAGMENT_SHADER,
  EDGE_VERTEX_SHADER,
  EDGE_FRAGMENT_SHADER,
  PICKING_VERTEX_SHADER,
  PICKING_FRAGMENT_SHADER,
  createShaderProgram,
  NODE_SHADER_CONFIG,
  EDGE_SHADER_CONFIG,
  PICKING_SHADER_CONFIG,
  type ShaderProgram,
} from './shaders/WebGLShaders';
import { WebGLBufferManager } from './WebGLBufferManager';
import { WebGLPicking, type PickingResult } from './WebGLPicking';
import { WebGLPerformance, type PerformanceConfig, type RenderBatch } from './WebGLPerformance';
import { WebGLFallback, type FallbackConfig } from './WebGLFallback';

interface WebGLBuffers {
  // Node rendering
  nodePositions: WebGLBuffer | null;
  nodeAttributes: WebGLBuffer | null;
  nodeIndices: WebGLBuffer | null;
  nodeQuadVertices: WebGLBuffer | null;

  // Edge rendering
  edgePositions: WebGLBuffer | null;
  edgeAttributes: WebGLBuffer | null;
  edgeIndices: WebGLBuffer | null;
  edgeQuadVertices: WebGLBuffer | null;

  // Picking
  pickingAttributes: WebGLBuffer | null;
}

interface WebGLState {
  programs: {
    node: ShaderProgram | null;
    edge: ShaderProgram | null;
    picking: ShaderProgram | null;
  };
  buffers: WebGLBuffers;
  vaos: {
    node: WebGLVertexArrayObject | null;
    edge: WebGLVertexArrayObject | null;
    picking: WebGLVertexArrayObject | null;
  };
  textures: {
    picking: WebGLTexture | null;
    pickingFramebuffer: WebGLFramebuffer | null;
  };
}

export interface WebGLRendererConfig extends RendererConfig {
  // Performance settings
  maxNodes?: number;
  maxEdges?: number;
  enablePicking?: boolean;
  enableLOD?: boolean;
  enableFrustumCulling?: boolean;

  // Quality settings
  msaaSamples?: number;
  enableDepthBuffer?: boolean;

  // Fallback options
  fallbackToWebGL1?: boolean;
  fallbackToCanvas?: boolean;
  fallbackConfig?: Partial<FallbackConfig>;

  // Error handling
  enableErrorRecovery?: boolean;
  maxRenderErrors?: number;
}

/**
 * WebGL2 renderer for high-performance graph visualization
 */
export class WebGLRenderer implements IRenderer {
  readonly type: RendererType = 'webgl';

  // Core WebGL
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private config: WebGLRendererConfig | null = null;

  // WebGL state
  private state: WebGLState = {
    programs: { node: null, edge: null, picking: null },
    buffers: {
      nodePositions: null,
      nodeAttributes: null,
      nodeIndices: null,
      nodeQuadVertices: null,
      edgePositions: null,
      edgeAttributes: null,
      edgeIndices: null,
      edgeQuadVertices: null,
      pickingAttributes: null,
    },
    vaos: { node: null, edge: null, picking: null },
    textures: { picking: null, pickingFramebuffer: null },
  };

  // Buffer management
  private bufferManager: WebGLBufferManager | null = null;

  // Picking system
  private pickingSystem: WebGLPicking | null = null;

  // Performance optimization
  private performanceManager: WebGLPerformance | null = null;

  // Error handling and fallback
  private fallbackSystem: WebGLFallback | null = null;
  private errorCount = 0;
  private lastError: Error | null = null;

  // Rendering data
  private nodes: PositionedNode[] = [];
  private edges: PositionedEdge[] = [];
  private nodeCount = 0;
  private edgeCount = 0;

  // Viewport management
  private transform: Transform = { x: 0, y: 0, scale: 1 };
  private viewMatrix = new Float32Array(9);
  private projectionMatrix = new Float32Array(9);

  // Spatial integration
  private spatialIndex: SpatialIndexer | null = null;
  private frustumCulling = true;
  private visibleNodes: Set<string> = new Set();
  private visibleEdges: Set<string> = new Set();

  // Performance tracking
  private frameTime = 0;
  private renderStats = {
    nodesRendered: 0,
    edgesRendered: 0,
    drawCalls: 0,
    lastFrameTime: 0,
  };

  // Batch processing
  private batchingEnabled = false;
  private pendingUpdates: {
    nodePositions?: NodePosition[];
    edgePositions?: EdgePosition[];
    nodeStyles?: NodeStyleUpdate[];
    edgeStyles?: EdgeStyleUpdate[];
  } = {};

  /**
   * Initialize the WebGL renderer
   */
  initialize(container: HTMLElement, config: RendererConfig): void {
    this.config = {
      maxNodes: 50000,
      maxEdges: 100000,
      enablePicking: true,
      enableLOD: true,
      enableFrustumCulling: true,
      msaaSamples: 4,
      enableDepthBuffer: false,
      fallbackToWebGL1: true,
      fallbackToCanvas: true,
      enableErrorRecovery: true,
      maxRenderErrors: 5,
      ...config,
    } as WebGLRendererConfig;

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width * (this.config.pixelRatio || 1);
    this.canvas.height = this.config.height * (this.config.pixelRatio || 1);
    this.canvas.style.width = `${this.config.width}px`;
    this.canvas.style.height = `${this.config.height}px`;

    container.appendChild(this.canvas);

    // Initialize fallback system
    this.fallbackSystem = new WebGLFallback(this.config.fallbackConfig);

    try {
      // Initialize WebGL with error handling
      this.initializeWebGL();
      this.initializeShaders();
      this.initializeBuffers();
      this.setupViewport();
    } catch (error) {
      this.handleInitializationError(error as Error);
      throw error;
    }

    // Initialize buffer manager
    this.bufferManager = new WebGLBufferManager(
      this.gl!,
      this.config.maxNodes!,
      this.config.maxEdges!
    );

    // Initialize picking system
    if (this.config.enablePicking && this.state.programs.picking) {
      this.pickingSystem = new WebGLPicking(
        this.gl!,
        this.canvas.width,
        this.canvas.height,
        this.state.programs.picking
      );
    }

    // Initialize performance manager
    this.performanceManager = new WebGLPerformance({
      enableLOD: this.config.enableLOD,
      enableBatching: true,
      enableFrustumCulling: this.config.enableFrustumCulling,
    } as PerformanceConfig);

    // Set up context event handlers
    this.setupContextEventHandlers();
  }

  /**
   * Initialize WebGL2 context with fallback
   */
  private initializeWebGL(): void {
    if (!this.canvas) {
      throw new Error('Canvas not created');
    }

    // Try WebGL2 first
    this.gl = this.canvas.getContext('webgl2', {
      antialias: this.config!.antialias,
      preserveDrawingBuffer: this.config!.preserveDrawingBuffer,
      alpha: false,
      depth: this.config!.enableDepthBuffer,
    });

    if (!this.gl) {
      if (this.config!.fallbackToWebGL1) {
        // Try WebGL1
        const gl1 = this.canvas.getContext('webgl', {
          antialias: this.config!.antialias,
          preserveDrawingBuffer: this.config!.preserveDrawingBuffer,
        });

        if (gl1) {
          throw new Error('WebGL1 fallback not implemented. Please use WebGL2 compatible browser.');
        }
      }

      if (this.config!.fallbackToCanvas) {
        throw new Error('Canvas fallback not available in WebGL renderer');
      }

      throw new Error('WebGL2 not supported and no fallbacks available');
    }

    // Enable extensions
    const extensions = [
      'EXT_color_buffer_float',
      'OES_texture_float_linear',
      'WEBGL_debug_renderer_info',
    ];

    extensions.forEach(ext => {
      const extension = this.gl!.getExtension(ext);
      if (!extension) {
        console.warn(`WebGL extension ${ext} not available`);
      }
    });

    // Set initial state
    this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    if (this.config!.enableDepthBuffer) {
      this.gl.enable(this.gl.DEPTH_TEST);
    }
  }

  /**
   * Initialize shader programs
   */
  private initializeShaders(): void {
    if (!this.gl) return;

    try {
      // Node rendering shader
      this.state.programs.node = createShaderProgram(
        this.gl,
        NODE_VERTEX_SHADER,
        NODE_FRAGMENT_SHADER,
        NODE_SHADER_CONFIG.attributes,
        NODE_SHADER_CONFIG.uniforms
      );

      // Edge rendering shader
      this.state.programs.edge = createShaderProgram(
        this.gl,
        EDGE_VERTEX_SHADER,
        EDGE_FRAGMENT_SHADER,
        EDGE_SHADER_CONFIG.attributes,
        EDGE_SHADER_CONFIG.uniforms
      );

      // Picking shader (if enabled)
      if (this.config!.enablePicking) {
        this.state.programs.picking = createShaderProgram(
          this.gl,
          PICKING_VERTEX_SHADER,
          PICKING_FRAGMENT_SHADER,
          PICKING_SHADER_CONFIG.attributes,
          PICKING_SHADER_CONFIG.uniforms
        );
      }
    } catch (error) {
      throw new Error(`Failed to initialize shaders: ${error}`);
    }
  }

  /**
   * Initialize GPU buffers
   */
  private initializeBuffers(): void {
    if (!this.gl) return;

    const maxNodes = this.config!.maxNodes!;
    const maxEdges = this.config!.maxEdges!;

    // Create buffers
    this.state.buffers.nodePositions = this.gl.createBuffer();
    this.state.buffers.nodeAttributes = this.gl.createBuffer();
    this.state.buffers.nodeIndices = this.gl.createBuffer();
    this.state.buffers.nodeQuadVertices = this.gl.createBuffer();

    this.state.buffers.edgePositions = this.gl.createBuffer();
    this.state.buffers.edgeAttributes = this.gl.createBuffer();
    this.state.buffers.edgeIndices = this.gl.createBuffer();
    this.state.buffers.edgeQuadVertices = this.gl.createBuffer();

    if (this.config!.enablePicking) {
      this.state.buffers.pickingAttributes = this.gl.createBuffer();
    }

    // Initialize quad vertices for instanced rendering
    this.initializeQuadGeometry();

    // Create vertex array objects
    this.createVertexArrayObjects();

    // Initialize picking framebuffer
    if (this.config!.enablePicking) {
      this.initializePickingFramebuffer();
    }
  }

  /**
   * Create quad geometry for instanced rendering
   */
  private initializeQuadGeometry(): void {
    if (!this.gl) return;

    // Quad vertices: position (vec2)
    const quadVertices = new Float32Array([
      -1, -1,  // bottom-left
       1, -1,  // bottom-right
       1,  1,  // top-right
      -1,  1   // top-left
    ]);

    // Quad indices
    const quadIndices = new Uint16Array([
      0, 1, 2,  // first triangle
      0, 2, 3   // second triangle
    ]);

    // Upload node quad vertices
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.nodeQuadVertices);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);

    // Upload node quad indices
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.state.buffers.nodeIndices);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, quadIndices, this.gl.STATIC_DRAW);

    // Same for edges (line quad)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.edgeQuadVertices);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, quadVertices, this.gl.STATIC_DRAW);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.state.buffers.edgeIndices);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, quadIndices, this.gl.STATIC_DRAW);
  }

  /**
   * Create vertex array objects for efficient rendering
   */
  private createVertexArrayObjects(): void {
    if (!this.gl) return;

    // Node VAO
    this.state.vaos.node = this.gl.createVertexArray();
    this.setupNodeVAO();

    // Edge VAO
    this.state.vaos.edge = this.gl.createVertexArray();
    this.setupEdgeVAO();

    // Picking VAO
    if (this.config!.enablePicking) {
      this.state.vaos.picking = this.gl.createVertexArray();
      this.setupPickingVAO();
    }
  }

  /**
   * Setup node vertex array object
   */
  private setupNodeVAO(): void {
    if (!this.gl || !this.state.programs.node) return;

    this.gl.bindVertexArray(this.state.vaos.node);

    const program = this.state.programs.node;

    // Quad vertices (per-vertex)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.nodeQuadVertices);
    this.gl.enableVertexAttribArray(program.attributes.a_vertex);
    this.gl.vertexAttribPointer(program.attributes.a_vertex, 2, this.gl.FLOAT, false, 0, 0);

    // Node attributes (per-instance)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.nodeAttributes);

    // Position (vec2)
    this.gl.enableVertexAttribArray(program.attributes.a_position);
    this.gl.vertexAttribPointer(program.attributes.a_position, 2, this.gl.FLOAT, false, 32, 0);
    this.gl.vertexAttribDivisor(program.attributes.a_position, 1);

    // Radius (float)
    this.gl.enableVertexAttribArray(program.attributes.a_radius);
    this.gl.vertexAttribPointer(program.attributes.a_radius, 1, this.gl.FLOAT, false, 32, 8);
    this.gl.vertexAttribDivisor(program.attributes.a_radius, 1);

    // Color (vec4)
    this.gl.enableVertexAttribArray(program.attributes.a_color);
    this.gl.vertexAttribPointer(program.attributes.a_color, 4, this.gl.FLOAT, false, 32, 12);
    this.gl.vertexAttribDivisor(program.attributes.a_color, 1);

    // Shape (float)
    this.gl.enableVertexAttribArray(program.attributes.a_shape);
    this.gl.vertexAttribPointer(program.attributes.a_shape, 1, this.gl.FLOAT, false, 32, 28);
    this.gl.vertexAttribDivisor(program.attributes.a_shape, 1);

    // Bind indices
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.state.buffers.nodeIndices);

    this.gl.bindVertexArray(null);
  }

  /**
   * Setup edge vertex array object
   */
  private setupEdgeVAO(): void {
    if (!this.gl || !this.state.programs.edge) return;

    this.gl.bindVertexArray(this.state.vaos.edge);

    const program = this.state.programs.edge;

    // Quad vertices (per-vertex)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.edgeQuadVertices);
    this.gl.enableVertexAttribArray(program.attributes.a_vertex);
    this.gl.vertexAttribPointer(program.attributes.a_vertex, 2, this.gl.FLOAT, false, 0, 0);

    // Edge attributes (per-instance)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.edgeAttributes);

    // Start position (vec2)
    this.gl.enableVertexAttribArray(program.attributes.a_start);
    this.gl.vertexAttribPointer(program.attributes.a_start, 2, this.gl.FLOAT, false, 24, 0);
    this.gl.vertexAttribDivisor(program.attributes.a_start, 1);

    // End position (vec2)
    this.gl.enableVertexAttribArray(program.attributes.a_end);
    this.gl.vertexAttribPointer(program.attributes.a_end, 2, this.gl.FLOAT, false, 24, 8);
    this.gl.vertexAttribDivisor(program.attributes.a_end, 1);

    // Color (vec4)
    this.gl.enableVertexAttribArray(program.attributes.a_color);
    this.gl.vertexAttribPointer(program.attributes.a_color, 4, this.gl.FLOAT, false, 24, 16);
    this.gl.vertexAttribDivisor(program.attributes.a_color, 1);

    // Width (float) - packed in color.a for now
    // this.gl.enableVertexAttribArray(program.attributes.a_width);
    // this.gl.vertexAttribPointer(program.attributes.a_width, 1, this.gl.FLOAT, false, 24, 20);
    // this.gl.vertexAttribDivisor(program.attributes.a_width, 1);

    // Bind indices
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.state.buffers.edgeIndices);

    this.gl.bindVertexArray(null);
  }

  /**
   * Setup picking vertex array object
   */
  private setupPickingVAO(): void {
    if (!this.gl || !this.state.programs.picking) return;

    this.gl.bindVertexArray(this.state.vaos.picking);

    const program = this.state.programs.picking;

    // Quad vertices (per-vertex)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.nodeQuadVertices);
    this.gl.enableVertexAttribArray(program.attributes.a_vertex);
    this.gl.vertexAttribPointer(program.attributes.a_vertex, 2, this.gl.FLOAT, false, 0, 0);

    // Picking attributes (per-instance)
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.state.buffers.pickingAttributes);

    // Position (vec2)
    this.gl.enableVertexAttribArray(program.attributes.a_position);
    this.gl.vertexAttribPointer(program.attributes.a_position, 2, this.gl.FLOAT, false, 12, 0);
    this.gl.vertexAttribDivisor(program.attributes.a_position, 1);

    // Radius (float)
    this.gl.enableVertexAttribArray(program.attributes.a_radius);
    this.gl.vertexAttribPointer(program.attributes.a_radius, 1, this.gl.FLOAT, false, 12, 8);
    this.gl.vertexAttribDivisor(program.attributes.a_radius, 1);

    // Node ID (float)
    this.gl.enableVertexAttribArray(program.attributes.a_nodeId);
    this.gl.vertexAttribPointer(program.attributes.a_nodeId, 1, this.gl.FLOAT, false, 12, 12);
    this.gl.vertexAttribDivisor(program.attributes.a_nodeId, 1);

    // Bind indices
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.state.buffers.nodeIndices);

    this.gl.bindVertexArray(null);
  }

  /**
   * Initialize picking framebuffer for GPU-based node selection
   */
  private initializePickingFramebuffer(): void {
    if (!this.gl || !this.config!.enablePicking) return;

    // Create picking texture
    this.state.textures.picking = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.state.textures.picking);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.canvas!.width,
      this.canvas!.height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    // Create framebuffer
    this.state.textures.pickingFramebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.state.textures.pickingFramebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.state.textures.picking,
      0
    );

    // Check framebuffer status
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      console.warn('Picking framebuffer not complete, disabling GPU picking');
      this.config!.enablePicking = false;
    }

    // Unbind
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /**
   * Setup viewport and projection
   */
  private setupViewport(): void {
    if (!this.gl || !this.canvas) return;

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.updateMatrices();
  }

  /**
   * Update transformation matrices
   */
  private updateMatrices(): void {
    if (!this.canvas) return;

    const { x, y, scale } = this.transform;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // View matrix (translation and scale)
    this.viewMatrix.set([
      scale, 0, x,
      0, scale, y,
      0, 0, 1
    ]);

    // Projection matrix (viewport size)
    this.projectionMatrix.set([
      2/width, 0, 0,
      0, 2/height, 0,
      0, 0, 1
    ]);
  }

  // === IRenderer Interface Implementation ===

  /**
   * Clean up WebGL resources
   */
  destroy(): void {
    if (this.gl) {
      // Delete programs
      Object.values(this.state.programs).forEach(program => {
        if (program) {
          this.gl!.deleteProgram(program.program);
        }
      });

      // Delete buffers
      Object.values(this.state.buffers).forEach(buffer => {
        if (buffer) {
          this.gl!.deleteBuffer(buffer);
        }
      });

      // Delete VAOs
      Object.values(this.state.vaos).forEach(vao => {
        if (vao) {
          this.gl!.deleteVertexArray(vao);
        }
      });

      // Delete textures
      if (this.state.textures.picking) {
        this.gl.deleteTexture(this.state.textures.picking);
      }
      if (this.state.textures.pickingFramebuffer) {
        this.gl.deleteFramebuffer(this.state.textures.pickingFramebuffer);
      }
    }

    // Remove context event handlers
    this.removeContextEventHandlers();

    if (this.canvas) {
      this.canvas.remove();
    }

    // Clean up managers
    if (this.bufferManager) {
      this.bufferManager.destroy();
      this.bufferManager = null;
    }

    if (this.pickingSystem) {
      this.pickingSystem.destroy();
      this.pickingSystem = null;
    }

    // Reset state
    this.canvas = null;
    this.gl = null;
    this.config = null;
    this.spatialIndex = null;
    this.performanceManager = null;
    this.fallbackSystem = null;
  }

  /**
   * Clear the viewport
   */
  clear(): void {
    if (!this.gl) return;

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | (this.config!.enableDepthBuffer ? this.gl.DEPTH_BUFFER_BIT : 0));
    this.renderStats.nodesRendered = 0;
    this.renderStats.edgesRendered = 0;
    this.renderStats.drawCalls = 0;
  }

  /**
   * Main render method - implements optimized rendering pipeline with LOD and batching
   */
  render(layout: LayoutResult, config: RenderConfig): void {
    if (!this.gl || !this.performanceManager || !this.canvas) return;

    try {
      this.renderInternal(layout, config);
    } catch (error) {
      this.handleRenderError(error as Error);
    }
  }

  /**
   * Internal render method with comprehensive error handling
   */
  private renderInternal(layout: LayoutResult, config: RenderConfig): void {

    const startTime = performance.now();

    // Update data
    this.nodes = layout.nodes;
    this.edges = layout.edges;

    // Update spatial index if available
    if (this.spatialIndex) {
      this.spatialIndex.build(layout.nodes);
    }

    // Calculate optimal LOD level based on zoom and performance
    const lodLevel = this.performanceManager.calculateLODLevel(
      this.transform,
      { width: this.canvas.width, height: this.canvas.height },
      this.nodes.length
    );

    // Perform frustum culling if enabled
    let culledNodes = this.nodes;
    let culledEdges = this.edges;

    if (this.frustumCulling && this.spatialIndex) {
      this.performFrustumCulling();
      culledNodes = this.nodes.filter(node => this.visibleNodes.has(node.id));
      culledEdges = this.edges.filter(edge => this.visibleEdges.has(edge.id));
    }

    // Apply LOD filtering
    const viewportBounds = {
      x: -this.transform.x / this.transform.scale,
      y: -this.transform.y / this.transform.scale,
      width: this.canvas.width / this.transform.scale,
      height: this.canvas.height / this.transform.scale,
    };

    const lodNodes = this.performanceManager.applyNodeLOD(
      culledNodes,
      lodLevel,
      this.transform,
      viewportBounds
    );

    const lodEdges = this.performanceManager.applyEdgeLOD(
      culledEdges,
      new Set(lodNodes.map(n => n.id)),
      lodLevel,
      this.transform
    );

    // Create optimized render batches
    const renderBatches = this.performanceManager.createRenderBatches(
      lodNodes,
      lodEdges,
      lodLevel
    );

    // Clear viewport
    this.clear();

    // Render batches in optimized order
    const order = config.layerOrder || ['edges', 'nodes', 'labels'];
    let batchesExecuted = 0;

    for (const layer of order) {
      switch (layer) {
        case 'edges':
          for (const batch of renderBatches) {
            if (batch.edges.length > 0) {
              this.renderEdgeBatch(batch, config.edgeConfig);
              batchesExecuted++;
            }
          }
          break;
        case 'nodes':
          for (const batch of renderBatches) {
            if (batch.nodes.length > 0) {
              this.renderNodeBatch(batch, config.nodeConfig);
              batchesExecuted++;
            }
          }
          break;
        case 'labels':
          // Skip labels at high LOD levels for performance
          if (lodLevel < 2) {
            const labels: LabelItem[] = lodNodes
              .filter(node => node.label)
              .map(node => ({
                id: node.id,
                text: node.label!,
                position: { x: node.x, y: node.y },
                anchor: 'middle',
              }));
            this.renderLabels(labels, config.labelConfig);
          }
          break;
      }
    }

    // Update performance stats
    const frameTime = performance.now() - startTime;
    this.renderStats.lastFrameTime = frameTime;
    this.renderStats.nodesRendered = lodNodes.length;
    this.renderStats.edgesRendered = lodEdges.length;

    this.performanceManager.updatePerformanceStats(frameTime, {
      nodesRendered: lodNodes.length,
      edgesRendered: lodEdges.length,
      batchesExecuted,
      lodLevel,
    });
  }

  /**
   * Render a batch of nodes with optimized GPU calls
   */
  private renderNodeBatch(batch: RenderBatch, config?: NodeRenderConfig): void {
    if (!this.gl || !this.bufferManager || !this.state.programs.node) return;
    if (batch.nodes.length === 0) return;

    // Update GPU buffers for this batch
    this.bufferManager.updateNodes(batch.nodes, config || {});

    // Use node shader program
    this.gl.useProgram(this.state.programs.node.program);

    // Bind VAO
    this.gl.bindVertexArray(this.state.vaos.node);

    // Set uniforms
    const uniforms = this.state.programs.node.uniforms;
    this.gl.uniformMatrix3fv(uniforms.u_transform, false, this.viewMatrix);
    this.gl.uniform2f(uniforms.u_viewport, this.canvas!.width, this.canvas!.height);
    this.gl.uniform1f(uniforms.u_pixelRatio, this.config!.pixelRatio || 1);

    // Bind updated buffer
    const buffers = this.bufferManager.getBuffers();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.nodeAttributes);

    // Render instanced quads
    this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      6, // 6 vertices per quad (2 triangles)
      this.gl.UNSIGNED_SHORT,
      0,
      batch.nodes.length
    );

    this.renderStats.drawCalls++;

    // Unbind
    this.gl.bindVertexArray(null);
  }

  /**
   * Render a batch of edges with optimized GPU calls
   */
  private renderEdgeBatch(batch: RenderBatch, config?: EdgeRenderConfig): void {
    if (!this.gl || !this.bufferManager || !this.state.programs.edge) return;
    if (batch.edges.length === 0) return;

    // Update GPU buffers for this batch
    this.bufferManager.updateEdges(batch.edges, config || {});

    // Use edge shader program
    this.gl.useProgram(this.state.programs.edge.program);

    // Bind VAO
    this.gl.bindVertexArray(this.state.vaos.edge);

    // Set uniforms
    const uniforms = this.state.programs.edge.uniforms;
    this.gl.uniformMatrix3fv(uniforms.u_transform, false, this.viewMatrix);
    this.gl.uniform2f(uniforms.u_viewport, this.canvas!.width, this.canvas!.height);
    this.gl.uniform1f(uniforms.u_pixelRatio, this.config!.pixelRatio || 1);

    // Bind updated buffer
    const buffers = this.bufferManager.getBuffers();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.edgeAttributes);

    // Render instanced lines
    this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      6, // 6 vertices per line quad
      this.gl.UNSIGNED_SHORT,
      0,
      batch.edges.length
    );

    this.renderStats.drawCalls++;

    // Unbind
    this.gl.bindVertexArray(null);
  }

  /**
   * Perform frustum culling using spatial index
   */
  private performFrustumCulling(): void {
    if (!this.spatialIndex || !this.canvas) return;

    // Calculate viewport bounds in world coordinates
    const viewport = this.screenToWorldBounds({
      x: 0,
      y: 0,
      width: this.canvas.width,
      height: this.canvas.height,
    });

    // Query visible nodes
    const visibleNodes = this.spatialIndex.queryRegion(viewport);
    this.visibleNodes.clear();
    visibleNodes.forEach(node => this.visibleNodes.add(node.id));

    // Filter visible edges (edges where both nodes are visible)
    this.visibleEdges.clear();
    this.edges.forEach(edge => {
      const sourceId = (edge.source as PositionedNode).id;
      const targetId = (edge.target as PositionedNode).id;

      if (this.visibleNodes.has(sourceId) || this.visibleNodes.has(targetId)) {
        this.visibleEdges.add(edge.id);
      }
    });
  }

  /**
   * Convert screen bounds to world coordinates
   */
  private screenToWorldBounds(screenBounds: Rectangle): Rectangle {
    const topLeft = this.screenToWorldInternal({ x: screenBounds.x, y: screenBounds.y });
    const bottomRight = this.screenToWorldInternal({
      x: screenBounds.x + screenBounds.width,
      y: screenBounds.y + screenBounds.height,
    });

    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }


  // === Rendering Methods ===

  renderNodes(nodes: PositionedNode[], config?: NodeRenderConfig): void {
    if (!this.gl || !this.bufferManager || !this.state.programs.node) return;

    // Filter visible nodes
    const visibleNodes = this.frustumCulling
      ? nodes.filter(node => this.visibleNodes.has(node.id))
      : nodes;

    if (visibleNodes.length === 0) return;

    // Update GPU buffers
    this.bufferManager.updateNodes(visibleNodes, config || {});

    // Use node shader program
    this.gl.useProgram(this.state.programs.node.program);

    // Bind VAO
    this.gl.bindVertexArray(this.state.vaos.node);

    // Set uniforms
    const uniforms = this.state.programs.node.uniforms;
    this.gl.uniformMatrix3fv(uniforms.u_transform, false, this.viewMatrix);
    this.gl.uniform2f(uniforms.u_viewport, this.canvas!.width, this.canvas!.height);
    this.gl.uniform1f(uniforms.u_pixelRatio, this.config!.pixelRatio || 1);

    // Bind updated buffer
    const buffers = this.bufferManager.getBuffers();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.nodeAttributes);

    // Render instanced quads
    this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      6, // 6 vertices per quad (2 triangles)
      this.gl.UNSIGNED_SHORT,
      0,
      visibleNodes.length
    );

    this.renderStats.nodesRendered = visibleNodes.length;
    this.renderStats.drawCalls++;

    // Unbind
    this.gl.bindVertexArray(null);
  }

  renderEdges(edges: PositionedEdge[], config?: EdgeRenderConfig, nodes?: PositionedNode[]): void {
    if (!this.gl || !this.bufferManager || !this.state.programs.edge) return;

    // Filter visible edges
    const visibleEdges = this.frustumCulling
      ? edges.filter(edge => this.visibleEdges.has(edge.id))
      : edges;

    if (visibleEdges.length === 0) return;

    // Update GPU buffers
    this.bufferManager.updateEdges(visibleEdges, config || {});

    // Use edge shader program
    this.gl.useProgram(this.state.programs.edge.program);

    // Bind VAO
    this.gl.bindVertexArray(this.state.vaos.edge);

    // Set uniforms
    const uniforms = this.state.programs.edge.uniforms;
    this.gl.uniformMatrix3fv(uniforms.u_transform, false, this.viewMatrix);
    this.gl.uniform2f(uniforms.u_viewport, this.canvas!.width, this.canvas!.height);
    this.gl.uniform1f(uniforms.u_pixelRatio, this.config!.pixelRatio || 1);

    // Bind updated buffer
    const buffers = this.bufferManager.getBuffers();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffers.edgeAttributes);

    // Render instanced lines
    this.gl.drawElementsInstanced(
      this.gl.TRIANGLES,
      6, // 6 vertices per line quad
      this.gl.UNSIGNED_SHORT,
      0,
      visibleEdges.length
    );

    this.renderStats.edgesRendered = visibleEdges.length;
    this.renderStats.drawCalls++;

    // Unbind
    this.gl.bindVertexArray(null);
  }

  renderLabels(items: LabelItem[], config?: LabelRenderConfig): void {
    // Labels typically rendered with Canvas overlay for text quality
    // WebGL text rendering is complex and often not worth the performance trade-off
    // This could be implemented as a Canvas 2D overlay or using texture atlases
    if (items.length > 0) {
      console.warn('Label rendering not implemented in WebGL renderer. Consider using Canvas overlay.');
    }
  }

  // === Transform and Interaction Methods ===

  setTransform(transform: Transform): void {
    this.transform = { ...transform };
    this.updateMatrices();
  }

  getTransform(): Transform {
    return { ...this.transform };
  }

  // === Spatial Integration ===

  setSpatialIndex(spatialIndex: SpatialIndexer): void {
    this.spatialIndex = spatialIndex;
  }

  // === Spatial Interaction API ===

  /**
   * Get node at screen coordinates (GPU picking + spatial fallback)
   */
  getNodeAt(screenX: number, screenY: number): PositionedNode | null {
    // Try GPU picking first (if available)
    if (this.pickingSystem && this.canvas) {
      const pickResult = this.pickingSystem.pickNode(
        screenX,
        screenY,
        this.nodes,
        this.viewMatrix,
        { width: this.canvas.width, height: this.canvas.height }
      );

      if (pickResult.node) {
        return pickResult.node;
      }
    }

    // Fallback to CPU-based spatial query
    if (this.spatialIndex) {
      const worldPoint = this.screenToWorldInternal({ x: screenX, y: screenY });
      const tolerance = 10 / this.transform.scale; // 10 pixel tolerance in world space

      const nearbyNodes = this.spatialIndex.queryPoint(worldPoint, tolerance);
      return nearbyNodes.length > 0 ? nearbyNodes[0] : null;
    }

    return null;
  }

  /**
   * Get nodes in screen region
   */
  getNodesInRegion(screenBounds: Rectangle): PositionedNode[] {
    // Try GPU area picking first (if available)
    if (this.pickingSystem && this.canvas) {
      const pickedNodes = this.pickingSystem.pickNodesInArea(
        screenBounds.x,
        screenBounds.y,
        screenBounds.x + screenBounds.width,
        screenBounds.y + screenBounds.height,
        this.nodes,
        this.viewMatrix,
        { width: this.canvas.width, height: this.canvas.height }
      );

      if (pickedNodes.length > 0) {
        return pickedNodes;
      }
    }

    // Fallback to spatial index region query
    if (this.spatialIndex) {
      const worldBounds = this.screenToWorldBounds(screenBounds);
      return this.spatialIndex.queryRegion(worldBounds);
    }

    return [];
  }

  /**
   * Pan viewport by screen pixels
   */
  setPan(offsetX: number, offsetY: number): void {
    this.setTransform({
      x: offsetX,
      y: offsetY,
      scale: this.transform.scale,
    });
  }

  /**
   * Set zoom scale
   */
  setZoom(scale: number): void {
    this.setTransform({
      x: this.transform.x,
      y: this.transform.y,
      scale: Math.max(0.1, Math.min(10, scale)), // Clamp zoom
    });
  }

  /**
   * Reset viewport to show all nodes
   */
  resetView(padding = 50): void {
    if (!this.canvas || this.nodes.length === 0) return;

    // Calculate bounding box of all nodes
    const xs = this.nodes.map(n => n.x);
    const ys = this.nodes.map(n => n.y);

    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;

    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;

    // Calculate scale to fit data in viewport
    const scaleX = this.canvas.width / dataWidth;
    const scaleY = this.canvas.height / dataHeight;
    const scale = Math.min(scaleX, scaleY, 2.0); // Max zoom of 2x

    // Center the data
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const offsetX = this.canvas.width / 2 - centerX * scale;
    const offsetY = this.canvas.height / 2 - centerY * scale;

    this.setTransform({ x: offsetX, y: offsetY, scale });
  }

  /**
   * Fit viewport to show specific nodes
   */
  fitToNodes(nodeIds: string[], padding = 50): void {
    if (!this.canvas || nodeIds.length === 0) return;

    const targetNodes = this.nodes.filter(n => nodeIds.includes(n.id));
    if (targetNodes.length === 0) return;

    // Calculate bounding box of target nodes
    const xs = targetNodes.map(n => n.x);
    const ys = targetNodes.map(n => n.y);

    const minX = Math.min(...xs) - padding;
    const maxX = Math.max(...xs) + padding;
    const minY = Math.min(...ys) - padding;
    const maxY = Math.max(...ys) + padding;

    const dataWidth = maxX - minX;
    const dataHeight = maxY - minY;

    // Calculate scale to fit data in viewport
    const scaleX = this.canvas.width / dataWidth;
    const scaleY = this.canvas.height / dataHeight;
    const scale = Math.min(scaleX, scaleY, 2.0);

    // Center on the target nodes
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const offsetX = this.canvas.width / 2 - centerX * scale;
    const offsetY = this.canvas.height / 2 - centerY * scale;

    this.setTransform({ x: offsetX, y: offsetY, scale });
  }

  /**
   * Convert world coordinates to screen coordinates (public API)
   */
  worldToScreen(worldPoint: Point): Point {
    return this.worldToScreenInternal(worldPoint);
  }

  /**
   * Convert screen coordinates to world coordinates (public API)
   */
  screenToWorld(screenPoint: Point): Point {
    return this.screenToWorldInternal(screenPoint);
  }

  /**
   * Internal world to screen conversion
   */
  private worldToScreenInternal(worldPoint: Point): Point {
    if (!this.canvas) return worldPoint;

    const { x, y, scale } = this.transform;

    // Apply transformation
    const canvasX = worldPoint.x * scale + x;
    const canvasY = worldPoint.y * scale + y;

    // Convert to screen coordinates
    const rect = this.canvas.getBoundingClientRect();
    const screenX = (canvasX / this.canvas.width) * rect.width + rect.left;
    const screenY = (canvasY / this.canvas.height) * rect.height + rect.top;

    return { x: screenX, y: screenY };
  }

  /**
   * Internal screen to world conversion
   */
  private screenToWorldInternal(screenPoint: Point): Point {
    if (!this.canvas) return screenPoint;

    const { x, y, scale } = this.transform;
    const rect = this.canvas.getBoundingClientRect();

    // Convert to canvas coordinates
    const canvasX = (screenPoint.x - rect.left) * (this.canvas.width / rect.width);
    const canvasY = (screenPoint.y - rect.top) * (this.canvas.height / rect.height);

    // Apply inverse transformation
    const worldX = (canvasX - x) / scale;
    const worldY = (canvasY - y) / scale;

    return { x: worldX, y: worldY };
  }

  // === Other IRenderer Methods ===

  updateNodePositions(positions: NodePosition[]): void {
    if (this.batchingEnabled) {
      this.pendingUpdates.nodePositions = [...(this.pendingUpdates.nodePositions || []), ...positions];
    } else {
      this.applyNodePositionUpdates(positions);
    }
  }

  updateEdgePositions(positions: EdgePosition[]): void {
    if (this.batchingEnabled) {
      this.pendingUpdates.edgePositions = [...(this.pendingUpdates.edgePositions || []), ...positions];
    } else {
      this.applyEdgePositionUpdates(positions);
    }
  }

  updateNodeStyles(updates: NodeStyleUpdate[]): void {
    if (this.batchingEnabled) {
      this.pendingUpdates.nodeStyles = [...(this.pendingUpdates.nodeStyles || []), ...updates];
    } else {
      this.applyNodeStyleUpdates(updates);
    }
  }

  updateEdgeStyles(updates: EdgeStyleUpdate[]): void {
    if (this.batchingEnabled) {
      this.pendingUpdates.edgeStyles = [...(this.pendingUpdates.edgeStyles || []), ...updates];
    } else {
      this.applyEdgeStyleUpdates(updates);
    }
  }

  highlightNodes(nodeIds: string[], config?: HighlightConfig): void {
    if (!this.bufferManager) return;

    // For GPU highlighting, we update node colors/scales in the buffer
    // This is more efficient than DOM manipulation
    const highlightColor = config?.color || '#ff0000';
    const highlightOpacity = config?.opacity || 1.0;
    const highlightScale = config?.scale || 1.2;

    // Create style updates for highlighted nodes
    const styleUpdates: NodeStyleUpdate[] = nodeIds.map(nodeId => ({
      nodeId,
      style: {
        fill: highlightColor,
        opacity: highlightOpacity,
        radius: (node: any) => (node.radius || 10) * highlightScale,
      },
    }));

    this.applyNodeStyleUpdates(styleUpdates);
  }

  highlightEdges(edgeIds: string[], config?: HighlightConfig): void {
    if (!this.bufferManager) return;

    const highlightColor = config?.color || '#ff0000';
    const highlightOpacity = config?.opacity || 1.0;
    const highlightScale = config?.scale || 2.0;

    const styleUpdates: EdgeStyleUpdate[] = edgeIds.map(edgeId => ({
      edgeId,
      style: {
        stroke: highlightColor,
        opacity: highlightOpacity,
        strokeWidth: (edge: any) => (edge.strokeWidth || 1.5) * highlightScale,
      },
    }));

    this.applyEdgeStyleUpdates(styleUpdates);
  }

  clearHighlights(): void {
    if (!this.bufferManager) return;

    // Reset to default styles by marking all buffers dirty
    // The next render will use default config
    this.bufferManager.markDirty(['nodes', 'edges']);
  }

  getNodeElement(nodeId: string): Element | null {
    // WebGL doesn't have DOM elements
    return null;
  }

  getEdgeElement(edgeId: string): Element | null {
    // WebGL doesn't have DOM elements
    return null;
  }

  getContainer(): Element {
    return this.canvas!;
  }

  enableBatching(enabled: boolean): void {
    this.batchingEnabled = enabled;
    if (!enabled) {
      this.flush();
    }
  }

  flush(): void {
    if (Object.keys(this.pendingUpdates).length === 0) return;

    // Apply all pending updates
    if (this.pendingUpdates.nodePositions) {
      this.applyNodePositionUpdates(this.pendingUpdates.nodePositions);
    }
    if (this.pendingUpdates.edgePositions) {
      this.applyEdgePositionUpdates(this.pendingUpdates.edgePositions);
    }
    if (this.pendingUpdates.nodeStyles) {
      this.applyNodeStyleUpdates(this.pendingUpdates.nodeStyles);
    }
    if (this.pendingUpdates.edgeStyles) {
      this.applyEdgeStyleUpdates(this.pendingUpdates.edgeStyles);
    }

    // Clear pending updates
    this.pendingUpdates = {};
  }

  // === Private Implementation Methods ===

  private applyNodePositionUpdates(positions: NodePosition[]): void {
    if (!this.bufferManager) return;

    // Update positions in node array
    for (const pos of positions) {
      const nodeIndex = this.nodes.findIndex(n => n.id === pos.nodeId);
      if (nodeIndex >= 0) {
        this.nodes[nodeIndex].x = pos.x;
        this.nodes[nodeIndex].y = pos.y;
        if ('z' in pos && pos.z !== undefined) {
          this.nodes[nodeIndex].z = pos.z;
        }
      }
    }

    // Mark buffers dirty for next render
    this.bufferManager.markDirty(['nodes', 'picking']);
  }

  private applyEdgePositionUpdates(positions: EdgePosition[]): void {
    if (!this.bufferManager) return;

    // Edge positions are derived from node positions
    // Mark edges dirty to recalculate from updated nodes
    this.bufferManager.markDirty(['edges']);
  }

  private applyNodeStyleUpdates(updates: NodeStyleUpdate[]): void {
    if (!this.bufferManager) return;

    // Style updates require full node buffer update with new styles
    // For now, mark dirty - could be optimized to update specific ranges
    this.bufferManager.markDirty(['nodes']);
  }

  private applyEdgeStyleUpdates(updates: EdgeStyleUpdate[]): void {
    if (!this.bufferManager) return;

    // Style updates require full edge buffer update
    this.bufferManager.markDirty(['edges']);
  }

  // === Utility Methods ===

  /**
   * Get current render statistics
   */
  getRenderStats() {
    return { ...this.renderStats };
  }

  /**
   * Check WebGL capabilities
   */
  getCapabilities() {
    if (!this.gl) return null;

    return {
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      maxVertexAttribs: this.gl.getParameter(this.gl.MAX_VERTEX_ATTRIBS),
      maxVaryingVectors: this.gl.getParameter(this.gl.MAX_VARYING_VECTORS),
      maxFragmentTextures: this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS),
      extensions: this.gl.getSupportedExtensions(),
    };
  }

  // === Error Handling and Recovery ===

  /**
   * Handle initialization errors with fallback strategies
   */
  private handleInitializationError(error: Error): void {
    this.lastError = error;
    this.errorCount++;

    console.error('WebGL renderer initialization failed:', error);

    if (this.fallbackSystem) {
      const errorReport = this.fallbackSystem.createErrorReport(error, 'WebGL initialization');
      console.warn('WebGL Error Report:', errorReport);
    }
  }

  /**
   * Handle render errors with recovery strategies
   */
  private handleRenderError(error: Error): void {
    this.lastError = error;
    this.errorCount++;

    console.error(`WebGL render error (${this.errorCount}/${this.config!.maxRenderErrors}):`, error);

    // Check if we should attempt recovery
    if (this.config!.enableErrorRecovery && this.errorCount < this.config!.maxRenderErrors!) {
      try {
        this.attemptErrorRecovery();
      } catch (recoveryError) {
        console.error('Error recovery failed:', recoveryError);
        this.errorCount = this.config!.maxRenderErrors!; // Force fallback
      }
    }

    // If too many errors, suggest fallback
    if (this.errorCount >= this.config!.maxRenderErrors!) {
      console.warn('Too many render errors, WebGL renderer may be unstable');

      if (this.fallbackSystem) {
        const errorReport = this.fallbackSystem.createErrorReport(error, 'Render loop');
        console.warn('WebGL Error Report:', errorReport);

        // Monitor performance for fallback suggestions
        const performanceCheck = this.fallbackSystem.monitorPerformance({
          frameTime: this.renderStats.lastFrameTime,
          nodesRendered: this.renderStats.nodesRendered,
        });

        if (performanceCheck.shouldFallback) {
          console.warn('Performance fallback suggested:', performanceCheck.reason);
        }
      }
    }
  }

  /**
   * Attempt to recover from WebGL errors
   */
  private attemptErrorRecovery(): void {
    if (!this.gl || !this.canvas) return;

    // Check WebGL context status
    const contextLost = this.gl.isContextLost();
    if (contextLost) {
      console.warn('WebGL context lost, waiting for restore...');
      return; // Context loss recovery is handled by browser events
    }

    // Clear any WebGL errors
    let glError = this.gl.getError();
    while (glError !== this.gl.NO_ERROR) {
      console.warn(`Clearing WebGL error: ${this.getGLErrorString(glError)}`);
      glError = this.gl.getError();
    }

    // Reset render state
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, null);
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, null);
    this.gl.bindVertexArray(null);
    this.gl.useProgram(null);

    // Mark buffers as dirty for recreation
    if (this.bufferManager) {
      this.bufferManager.markDirty(['nodes', 'edges', 'picking']);
    }

    // WebGL error recovery attempted
  }

  /**
   * Convert GL error codes to readable strings
   */
  private getGLErrorString(error: number): string {
    if (!this.gl) return `Unknown error: ${error}`;

    const errorMap: { [key: number]: string } = {
      [this.gl.NO_ERROR]: 'NO_ERROR',
      [this.gl.INVALID_ENUM]: 'INVALID_ENUM',
      [this.gl.INVALID_VALUE]: 'INVALID_VALUE',
      [this.gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [this.gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
      [this.gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
    };

    return errorMap[error] || `Unknown error: ${error}`;
  }

  /**
   * Get current error state for debugging
   */
  getErrorState(): {
    errorCount: number;
    lastError: Error | null;
    contextLost: boolean;
    glErrors: string[];
    diagnostics?: any;
  } {
    const glErrors: string[] = [];

    if (this.gl && !this.gl.isContextLost()) {
      let glError = this.gl.getError();
      while (glError !== this.gl.NO_ERROR) {
        glErrors.push(this.getGLErrorString(glError));
        glError = this.gl.getError();
      }
    }

    return {
      errorCount: this.errorCount,
      lastError: this.lastError,
      contextLost: this.gl?.isContextLost() || false,
      glErrors,
      diagnostics: this.fallbackSystem?.getDiagnostics(),
    };
  }

  /**
   * Reset error state (for testing or recovery)
   */
  resetErrorState(): void {
    this.errorCount = 0;
    this.lastError = null;
  }

  /**
   * Handle WebGL context loss (browser event)
   */
  private handleContextLoss = (event: Event): void => {
    event.preventDefault();
    console.warn('WebGL context lost');

    // Stop rendering until context is restored
    this.gl = null;
  };

  /**
   * Handle WebGL context restore (browser event)
   */
  private handleContextRestore = (event: Event): void => {
    // WebGL context restored, reinitializing

    try {
      // Reinitialize WebGL
      this.initializeWebGL();
      this.initializeShaders();
      this.initializeBuffers();
      this.setupViewport();

      // Reinitialize managers
      if (this.bufferManager) {
        this.bufferManager.destroy();
        this.bufferManager = new WebGLBufferManager(
          this.gl!,
          this.config!.maxNodes!,
          this.config!.maxEdges!
        );
      }

      if (this.pickingSystem) {
        this.pickingSystem.destroy();
        if (this.config!.enablePicking && this.state.programs.picking) {
          this.pickingSystem = new WebGLPicking(
            this.gl!,
            this.canvas!.width,
            this.canvas!.height,
            this.state.programs.picking
          );
        }
      }

      // Reset error state
      this.resetErrorState();

      // WebGL context restore completed
    } catch (error) {
      console.error('Failed to restore WebGL context:', error);
      this.handleInitializationError(error as Error);
    }
  };

  /**
   * Set up WebGL context loss/restore event handlers
   */
  private setupContextEventHandlers(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('webglcontextlost', this.handleContextLoss);
    this.canvas.addEventListener('webglcontextrestored', this.handleContextRestore);
  }

  /**
   * Remove WebGL context event handlers
   */
  private removeContextEventHandlers(): void {
    if (!this.canvas) return;

    this.canvas.removeEventListener('webglcontextlost', this.handleContextLoss);
    this.canvas.removeEventListener('webglcontextrestored', this.handleContextRestore);
  }
}