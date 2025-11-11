/**
 * WebGL GPU-based picking system for node selection
 *
 * Implements efficient node selection using GPU rendering to an off-screen buffer.
 * Each node is rendered with a unique color ID that can be read back from the GPU.
 */

import type { PositionedNode } from '../layout/LayoutEngine';
import type { Point } from '../spatial/types';
import type { ShaderProgram } from './shaders/WebGLShaders';

export interface PickingResult {
  node: PositionedNode | null;
  worldPosition: Point;
  screenPosition: Point;
}

export interface PickingConfig {
  tolerance: number; // Pixel tolerance for picking
  enableMultiSelect: boolean;
  enableAreaSelect: boolean;
}

/**
 * GPU-based picking implementation
 */
export class WebGLPicking {
  private gl: WebGL2RenderingContext;
  private pickingFramebuffer: WebGLFramebuffer | null = null;
  private pickingTexture: WebGLTexture | null = null;
  private pickingProgram: ShaderProgram | null = null;
  private nodeIdMap: Map<number, PositionedNode> = new Map();
  private pickingBuffer: Uint8Array;

  constructor(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    pickingProgram: ShaderProgram
  ) {
    this.gl = gl;
    this.pickingProgram = pickingProgram;
    this.pickingBuffer = new Uint8Array(4); // RGBA pixel

    this.initializeFramebuffer(width, height);
  }

  /**
   * Initialize off-screen framebuffer for picking
   */
  private initializeFramebuffer(width: number, height: number): void {
    // Create picking texture
    this.pickingTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickingTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

    // Create framebuffer
    this.pickingFramebuffer = this.gl.createFramebuffer();
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pickingFramebuffer);
    this.gl.framebufferTexture2D(
      this.gl.FRAMEBUFFER,
      this.gl.COLOR_ATTACHMENT0,
      this.gl.TEXTURE_2D,
      this.pickingTexture,
      0
    );

    // Check framebuffer status
    if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) !== this.gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Picking framebuffer not complete');
    }

    // Unbind
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /**
   * Update node ID mapping for picking
   */
  updateNodeMapping(nodes: PositionedNode[]): void {
    this.nodeIdMap.clear();

    // Create mapping from hashed ID to node
    nodes.forEach(node => {
      const hashedId = this.hashStringToNumber(node.id);
      this.nodeIdMap.set(hashedId, node);
    });
  }

  /**
   * Pick node at screen coordinates
   */
  pickNode(
    screenX: number,
    screenY: number,
    nodes: PositionedNode[],
    viewMatrix: Float32Array,
    viewport: { width: number; height: number },
    config: PickingConfig = { tolerance: 0, enableMultiSelect: false, enableAreaSelect: false }
  ): PickingResult {
    if (!this.pickingFramebuffer || !this.pickingProgram) {
      return { node: null, worldPosition: { x: screenX, y: screenY }, screenPosition: { x: screenX, y: screenY } };
    }

    // Update node mapping
    this.updateNodeMapping(nodes);

    // Render to picking framebuffer
    this.renderPickingBuffer(nodes, viewMatrix, viewport);

    // Read pixel at click position
    const pixelY = viewport.height - screenY; // Flip Y coordinate
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pickingFramebuffer);
    this.gl.readPixels(
      Math.floor(screenX),
      Math.floor(pixelY),
      1,
      1,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      this.pickingBuffer
    );
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    // Decode node ID from pixel color
    const nodeId = this.decodeNodeId(this.pickingBuffer);
    const node = this.nodeIdMap.get(nodeId) || null;

    // Convert screen to world coordinates (simplified)
    const worldPosition = this.screenToWorld(screenX, screenY, viewMatrix, viewport);

    return {
      node,
      worldPosition,
      screenPosition: { x: screenX, y: screenY },
    };
  }

  /**
   * Pick nodes in a rectangular area
   */
  pickNodesInArea(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    nodes: PositionedNode[],
    viewMatrix: Float32Array,
    viewport: { width: number; height: number }
  ): PositionedNode[] {
    if (!this.pickingFramebuffer || !this.pickingProgram) {
      return [];
    }

    // Update node mapping
    this.updateNodeMapping(nodes);

    // Render to picking framebuffer
    this.renderPickingBuffer(nodes, viewMatrix, viewport);

    // Calculate area bounds
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, startY);
    const maxY = Math.max(startY, endY);

    const width = Math.floor(maxX - minX);
    const height = Math.floor(maxY - minY);

    if (width <= 0 || height <= 0) return [];

    // Read pixel area
    const areaBuffer = new Uint8Array(width * height * 4);
    const pixelY = viewport.height - maxY; // Flip Y coordinate

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pickingFramebuffer);
    this.gl.readPixels(
      Math.floor(minX),
      Math.floor(pixelY),
      width,
      height,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      areaBuffer
    );
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    // Collect unique node IDs
    const pickedNodeIds = new Set<number>();
    for (let i = 0; i < areaBuffer.length; i += 4) {
      const pixel = areaBuffer.slice(i, i + 4);
      const nodeId = this.decodeNodeId(pixel);
      if (nodeId > 0) {
        pickedNodeIds.add(nodeId);
      }
    }

    // Return corresponding nodes
    const pickedNodes: PositionedNode[] = [];
    pickedNodeIds.forEach(id => {
      const node = this.nodeIdMap.get(id);
      if (node) {
        pickedNodes.push(node);
      }
    });

    return pickedNodes;
  }

  /**
   * Render nodes to picking framebuffer with ID colors
   */
  private renderPickingBuffer(
    nodes: PositionedNode[],
    viewMatrix: Float32Array,
    viewport: { width: number; height: number }
  ): void {
    if (!this.pickingFramebuffer || !this.pickingProgram) return;

    // Bind picking framebuffer
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.pickingFramebuffer);
    this.gl.viewport(0, 0, viewport.width, viewport.height);

    // Clear with black (ID = 0)
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Use picking shader
    this.gl.useProgram(this.pickingProgram.program);

    // Set uniforms
    this.gl.uniformMatrix3fv(this.pickingProgram.uniforms.u_transform, false, viewMatrix);
    this.gl.uniform2f(this.pickingProgram.uniforms.u_viewport, viewport.width, viewport.height);
    this.gl.uniform1f(this.pickingProgram.uniforms.u_pixelRatio, 1.0);

    // Render nodes with ID colors
    // Note: This is simplified - would need proper buffer setup in real implementation
    // For now, just indicate that picking rendering would happen here

    // Unbind
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  private screenToWorld(
    screenX: number,
    screenY: number,
    viewMatrix: Float32Array,
    viewport: { width: number; height: number }
  ): Point {
    // This is a simplified transformation
    // In practice, you'd need to invert the view matrix and projection
    const normalizedX = (screenX / viewport.width) * 2 - 1;
    const normalizedY = ((viewport.height - screenY) / viewport.height) * 2 - 1;

    // Apply inverse transformation (simplified)
    const worldX = normalizedX / viewMatrix[0] - viewMatrix[2] / viewMatrix[0];
    const worldY = normalizedY / viewMatrix[4] - viewMatrix[5] / viewMatrix[4];

    return { x: worldX, y: worldY };
  }

  /**
   * Hash string ID to number for GPU encoding
   */
  private hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    // Ensure positive and within 24-bit range for RGB encoding
    return Math.abs(hash) % 16777215 + 1; // +1 to avoid 0 (background)
  }

  /**
   * Decode node ID from RGBA pixel
   */
  private decodeNodeId(pixel: Uint8Array): number {
    // Decode 24-bit ID from RGB channels
    return (pixel[0] << 16) | (pixel[1] << 8) | pixel[2];
  }

  /**
   * Resize picking framebuffer
   */
  resize(width: number, height: number): void {
    if (!this.pickingTexture) return;

    this.gl.bindTexture(this.gl.TEXTURE_2D, this.pickingTexture);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      width,
      height,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      null
    );
    this.gl.bindTexture(this.gl.TEXTURE_2D, null);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.pickingFramebuffer) {
      this.gl.deleteFramebuffer(this.pickingFramebuffer);
    }
    if (this.pickingTexture) {
      this.gl.deleteTexture(this.pickingTexture);
    }
    this.nodeIdMap.clear();
  }
}