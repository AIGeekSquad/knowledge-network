/**
 * WebGL Buffer Manager for efficient GPU memory management
 *
 * Handles buffer allocation, updates, and optimizations for massive graph rendering.
 * Provides instanced rendering capabilities and dynamic buffer updates.
 */

import type { PositionedNode, PositionedEdge } from '../layout/LayoutEngine';
import type { NodeRenderConfig, EdgeRenderConfig, NodeShape } from './RenderingSystem';

export interface BufferUpdateResult {
  nodeCount: number;
  edgeCount: number;
  bufferUpdates: number;
  updateTime: number;
}

/**
 * Manages WebGL buffers for efficient graph rendering
 */
export class WebGLBufferManager {
  private gl: WebGL2RenderingContext;
  private maxNodes: number;
  private maxEdges: number;

  // Node buffers
  private nodeAttributeBuffer: WebGLBuffer | null = null;
  private nodePickingBuffer: WebGLBuffer | null = null;
  private nodeDataArray: Float32Array;
  private pickingDataArray: Float32Array;

  // Edge buffers
  private edgeAttributeBuffer: WebGLBuffer | null = null;
  private edgeDataArray: Float32Array;

  // Buffer state
  private nodeBufferDirty = true;
  private edgeBufferDirty = true;
  private pickingBufferDirty = true;

  // Performance tracking
  private updateStats = {
    totalUpdates: 0,
    lastUpdateTime: 0,
    bufferSize: 0,
  };

  constructor(gl: WebGL2RenderingContext, maxNodes: number, maxEdges: number) {
    this.gl = gl;
    this.maxNodes = maxNodes;
    this.maxEdges = maxEdges;

    // Pre-allocate typed arrays
    this.nodeDataArray = new Float32Array(maxNodes * 8); // position(2) + radius(1) + color(4) + shape(1)
    this.pickingDataArray = new Float32Array(maxNodes * 3); // position(2) + nodeId(1)
    this.edgeDataArray = new Float32Array(maxEdges * 8); // start(2) + end(2) + color(4)

    this.initializeBuffers();
  }

  /**
   * Initialize GPU buffers
   */
  private initializeBuffers(): void {
    // Create node attribute buffer
    this.nodeAttributeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeAttributeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.nodeDataArray, this.gl.DYNAMIC_DRAW);

    // Create picking buffer
    this.nodePickingBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodePickingBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.pickingDataArray, this.gl.DYNAMIC_DRAW);

    // Create edge attribute buffer
    this.edgeAttributeBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeAttributeBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, this.edgeDataArray, this.gl.DYNAMIC_DRAW);

    this.updateStats.bufferSize =
      this.nodeDataArray.byteLength +
      this.pickingDataArray.byteLength +
      this.edgeDataArray.byteLength;
  }

  /**
   * Update node data in GPU buffers
   */
  updateNodes(nodes: PositionedNode[], config: NodeRenderConfig = {}): BufferUpdateResult {
    const startTime = performance.now();
    let bufferUpdates = 0;

    if (nodes.length > this.maxNodes) {
      throw new Error(`Too many nodes: ${nodes.length} > ${this.maxNodes}`);
    }

    // Default configuration
    const defaultConfig: Required<NodeRenderConfig> = {
      radius: 10,
      fill: '#69b3a2',
      stroke: '#fff',
      strokeWidth: 1.5,
      opacity: 1,
      shape: 'circle' as NodeShape,
      image: null,
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Update node attribute data
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const offset = i * 8;

      // Position (vec2)
      this.nodeDataArray[offset + 0] = node.x;
      this.nodeDataArray[offset + 1] = node.y;

      // Radius (float)
      this.nodeDataArray[offset + 2] = this.accessor(finalConfig.radius, node);

      // Color (vec4) - convert hex/string to RGBA
      const color = this.parseColor(this.accessor(finalConfig.fill, node), this.accessor(finalConfig.opacity, node));
      this.nodeDataArray[offset + 3] = color.r;
      this.nodeDataArray[offset + 4] = color.g;
      this.nodeDataArray[offset + 5] = color.b;
      this.nodeDataArray[offset + 6] = color.a;

      // Shape (float)
      this.nodeDataArray[offset + 7] = this.getShapeIndex(this.accessor(finalConfig.shape, node));
    }

    // Update picking data
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const offset = i * 3;

      // Position (vec2)
      this.pickingDataArray[offset + 0] = node.x;
      this.pickingDataArray[offset + 1] = node.y;

      // Node ID (float) - hash the ID to a number
      this.pickingDataArray[offset + 2] = this.hashStringToFloat(node.id);
    }

    // Upload to GPU if dirty
    if (this.nodeBufferDirty) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodeAttributeBuffer);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.nodeDataArray, 0, nodes.length * 8);
      bufferUpdates++;

      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.nodePickingBuffer);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.pickingDataArray, 0, nodes.length * 3);
      bufferUpdates++;

      this.nodeBufferDirty = false;
      this.pickingBufferDirty = false;
    }

    const updateTime = performance.now() - startTime;
    this.updateStats.totalUpdates++;
    this.updateStats.lastUpdateTime = updateTime;

    return {
      nodeCount: nodes.length,
      edgeCount: 0,
      bufferUpdates,
      updateTime,
    };
  }

  /**
   * Update edge data in GPU buffers
   */
  updateEdges(edges: PositionedEdge[], config: EdgeRenderConfig = {}): BufferUpdateResult {
    const startTime = performance.now();
    let bufferUpdates = 0;

    if (edges.length > this.maxEdges) {
      throw new Error(`Too many edges: ${edges.length} > ${this.maxEdges}`);
    }

    // Default configuration
    const defaultConfig: Required<EdgeRenderConfig> = {
      stroke: '#999',
      strokeWidth: 1.5,
      opacity: 0.6,
      strokeDasharray: '',
      arrowHead: false,
      curveType: 'straight',
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Update edge attribute data
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const source = edge.source as PositionedNode;
      const target = edge.target as PositionedNode;
      const offset = i * 8;

      // Start position (vec2)
      this.edgeDataArray[offset + 0] = source.x;
      this.edgeDataArray[offset + 1] = source.y;

      // End position (vec2)
      this.edgeDataArray[offset + 2] = target.x;
      this.edgeDataArray[offset + 3] = target.y;

      // Color (vec4)
      const color = this.parseColor(this.accessor(finalConfig.stroke, edge), this.accessor(finalConfig.opacity, edge));
      this.edgeDataArray[offset + 4] = color.r;
      this.edgeDataArray[offset + 5] = color.g;
      this.edgeDataArray[offset + 6] = color.b;
      this.edgeDataArray[offset + 7] = color.a;
    }

    // Upload to GPU if dirty
    if (this.edgeBufferDirty) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.edgeAttributeBuffer);
      this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.edgeDataArray, 0, edges.length * 8);
      bufferUpdates++;

      this.edgeBufferDirty = false;
    }

    const updateTime = performance.now() - startTime;
    this.updateStats.totalUpdates++;
    this.updateStats.lastUpdateTime = updateTime;

    return {
      nodeCount: 0,
      edgeCount: edges.length,
      bufferUpdates,
      updateTime,
    };
  }

  /**
   * Mark buffers as dirty for next update
   */
  markDirty(buffers: ('nodes' | 'edges' | 'picking')[] = ['nodes', 'edges', 'picking']): void {
    if (buffers.includes('nodes')) {
      this.nodeBufferDirty = true;
    }
    if (buffers.includes('edges')) {
      this.edgeBufferDirty = true;
    }
    if (buffers.includes('picking')) {
      this.pickingBufferDirty = true;
    }
  }

  /**
   * Get buffer objects for binding
   */
  getBuffers() {
    return {
      nodeAttributes: this.nodeAttributeBuffer,
      nodePicking: this.nodePickingBuffer,
      edgeAttributes: this.edgeAttributeBuffer,
    };
  }

  /**
   * Get buffer statistics
   */
  getStats() {
    return {
      ...this.updateStats,
      maxNodes: this.maxNodes,
      maxEdges: this.maxEdges,
      nodeBufferSize: this.nodeDataArray.byteLength,
      edgeBufferSize: this.edgeDataArray.byteLength,
      pickingBufferSize: this.pickingDataArray.byteLength,
    };
  }

  /**
   * Destroy all buffers
   */
  destroy(): void {
    if (this.nodeAttributeBuffer) {
      this.gl.deleteBuffer(this.nodeAttributeBuffer);
    }
    if (this.nodePickingBuffer) {
      this.gl.deleteBuffer(this.nodePickingBuffer);
    }
    if (this.edgeAttributeBuffer) {
      this.gl.deleteBuffer(this.edgeAttributeBuffer);
    }
  }

  // === Utility Methods ===

  /**
   * Accessor function for configuration values
   */
  private accessor<T, R>(value: R | ((d: T) => R), data: T): R {
    return typeof value === 'function' ? (value as (d: T) => R)(data) : value;
  }

  /**
   * Parse color string to RGBA components
   */
  private parseColor(colorStr: string, opacity: number = 1): { r: number; g: number; b: number; a: number } {
    // Handle hex colors
    if (colorStr.startsWith('#')) {
      const hex = colorStr.slice(1);
      const r = parseInt(hex.slice(0, 2), 16) / 255;
      const g = parseInt(hex.slice(2, 4), 16) / 255;
      const b = parseInt(hex.slice(4, 6), 16) / 255;
      return { r, g, b, a: opacity };
    }

    // Handle rgb/rgba colors
    const rgbMatch = colorStr.match(/rgba?\(([^)]+)\)/);
    if (rgbMatch) {
      const values = rgbMatch[1].split(',').map(v => parseFloat(v.trim()));
      return {
        r: values[0] / 255,
        g: values[1] / 255,
        b: values[2] / 255,
        a: values[3] !== undefined ? values[3] : opacity,
      };
    }

    // Handle named colors (basic support)
    const namedColors: { [key: string]: [number, number, number] } = {
      red: [1, 0, 0],
      green: [0, 1, 0],
      blue: [0, 0, 1],
      white: [1, 1, 1],
      black: [0, 0, 0],
      gray: [0.5, 0.5, 0.5],
      orange: [1, 0.65, 0],
      purple: [0.5, 0, 0.5],
      yellow: [1, 1, 0],
      cyan: [0, 1, 1],
      magenta: [1, 0, 1],
    };

    const named = namedColors[colorStr.toLowerCase()];
    if (named) {
      return { r: named[0], g: named[1], b: named[2], a: opacity };
    }

    // Default to gray
    console.warn(`Unknown color: ${colorStr}, using gray`);
    return { r: 0.5, g: 0.5, b: 0.5, a: opacity };
  }

  /**
   * Convert shape name to numeric index
   */
  private getShapeIndex(shape: NodeShape): number {
    const shapes = {
      circle: 0,
      square: 1,
      diamond: 2,
      triangle: 3,
      star: 4,
    };
    return shapes[shape] ?? 0;
  }

  /**
   * Hash string to float for node picking
   */
  private hashStringToFloat(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Convert to positive float
    return Math.abs(hash) % 16777215; // 24-bit max for RGB encoding
  }
}