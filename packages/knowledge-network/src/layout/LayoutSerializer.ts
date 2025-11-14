/**
 * Layout State Serializer
 * 
 * Handles serialization and deserialization of layout state for persistence and caching.
 * Converts Map<string, LayoutNode> to/from JSON with versioning and metadata.
 * 
 * @fileoverview Layout state persistence with Map conversion and versioning
 */

import type { 
  LayoutNode, 
  LayoutMetadata, 
  PerformanceMetrics 
} from './layout-engine';

/**
 * Serializable layout state structure
 */
export interface SerializableLayoutState {
  /** Serialization format version for backwards compatibility */
  version: string;
  
  /** Timestamp when layout was serialized */
  timestamp: number;
  
  /** Layout nodes as array (converted from Map) */
  nodes: SerializableLayoutNode[];
  
  /** Layout metadata */
  metadata: LayoutStateMetadata;
  
  /** Performance metrics when layout was created */
  performanceMetrics: PerformanceMetrics;
  
  /** Checksum for data integrity verification */
  checksum: string;
}

/**
 * Serializable layout node (simplified for JSON)
 */
export interface SerializableLayoutNode {
  id: string;
  x: number;
  y: number;
  clusterId?: string;
  similarityScores: [string, number][]; // Array of tuples from Map
  originalData: any;
  layoutMetadata: LayoutMetadata;
}

/**
 * Layout state metadata
 */
export interface LayoutStateMetadata {
  /** Number of nodes in the layout */
  nodeCount: number;
  
  /** Layout algorithm used */
  algorithm: string;
  
  /** Configuration hash for cache validation */
  configHash: string;
  
  /** Application version */
  appVersion: string;
  
  /** Additional custom metadata */
  custom?: Record<string, any>;
}

/**
 * Layout Serializer for state persistence
 */
export class LayoutSerializer {
  private static readonly CURRENT_VERSION = '1.0.0';
  private static readonly SUPPORTED_VERSIONS = ['1.0.0'];

  /**
   * Serialize layout state to JSON string
   */
  static serialize(
    layoutMap: Map<string, LayoutNode>,
    metadata?: Partial<LayoutStateMetadata>,
    performanceMetrics?: PerformanceMetrics
  ): string {
    try {
      // Convert Map to serializable array
      const nodes: SerializableLayoutNode[] = Array.from(layoutMap.entries()).map(([id, node]) => ({
        id,
        x: node.x,
        y: node.y,
        clusterId: node.clusterId,
        similarityScores: Array.from(node.similarityScores.entries()),
        originalData: node.originalData,
        layoutMetadata: node.layoutMetadata
      }));

      // Create serializable state
      const state: SerializableLayoutState = {
        version: this.CURRENT_VERSION,
        timestamp: Date.now(),
        nodes,
        metadata: {
          nodeCount: layoutMap.size,
          algorithm: nodes[0]?.layoutMetadata?.algorithm || 'unknown',
          configHash: this.generateConfigHash(layoutMap),
          appVersion: '1.0.0', // Could be from package.json
          ...metadata
        },
        performanceMetrics: performanceMetrics || {
          processingTime: 0,
          memoryUsage: 0,
          iterations: 0,
          stabilityScore: 0,
          currentFPS: 0
        },
        checksum: ''
      };

      // Calculate checksum
      state.checksum = this.calculateChecksum(state);

      return JSON.stringify(state, null, 2);
    } catch (error) {
      throw new Error(`Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deserialize JSON string to layout Map
   */
  static deserialize(jsonString: string): Map<string, LayoutNode> {
    try {
      const state: SerializableLayoutState = JSON.parse(jsonString);
      
      // Validate version compatibility
      if (!this.SUPPORTED_VERSIONS.includes(state.version)) {
        throw new Error(`Unsupported version: ${state.version}. Supported versions: ${this.SUPPORTED_VERSIONS.join(', ')}`);
      }

      // Validate checksum
      const originalChecksum = state.checksum;
      state.checksum = '';
      const calculatedChecksum = this.calculateChecksum(state);
      
      if (originalChecksum !== calculatedChecksum) {
        throw new Error('Data integrity check failed - checksum mismatch');
      }

      // Convert array back to Map
      const layoutMap = new Map<string, LayoutNode>();
      
      for (const serializableNode of state.nodes) {
        const layoutNode: LayoutNode = {
          id: serializableNode.id,
          x: serializableNode.x,
          y: serializableNode.y,
          clusterId: serializableNode.clusterId,
          similarityScores: new Map(serializableNode.similarityScores),
          originalData: serializableNode.originalData,
          layoutMetadata: serializableNode.layoutMetadata
        };
        
        layoutMap.set(serializableNode.id, layoutNode);
      }

      return layoutMap;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON format');
      }
      throw new Error(`Deserialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate serialized layout state without full deserialization
   */
  static validate(jsonString: string): {
    isValid: boolean;
    errors: string[];
    metadata?: LayoutStateMetadata;
  } {
    const errors: string[] = [];
    
    try {
      const state: SerializableLayoutState = JSON.parse(jsonString);
      
      // Check required fields
      if (!state.version) errors.push('Missing version field');
      if (!state.timestamp) errors.push('Missing timestamp field');
      if (!Array.isArray(state.nodes)) errors.push('Nodes must be an array');
      if (!state.metadata) errors.push('Missing metadata field');
      
      // Check version compatibility
      if (state.version && !this.SUPPORTED_VERSIONS.includes(state.version)) {
        errors.push(`Unsupported version: ${state.version}`);
      }
      
      // Validate nodes structure
      if (Array.isArray(state.nodes)) {
        for (let i = 0; i < Math.min(state.nodes.length, 5); i++) { // Check first 5 nodes
          const node = state.nodes[i];
          if (!node.id) errors.push(`Node ${i}: Missing id field`);
          if (typeof node.x !== 'number') errors.push(`Node ${i}: Invalid x coordinate`);
          if (typeof node.y !== 'number') errors.push(`Node ${i}: Invalid y coordinate`);
        }
      }
      
      // Validate checksum
      if (state.checksum) {
        const originalChecksum = state.checksum;
        state.checksum = '';
        const calculatedChecksum = this.calculateChecksum(state);
        
        if (originalChecksum !== calculatedChecksum) {
          errors.push('Data integrity check failed - checksum mismatch');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors,
        metadata: state.metadata
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        errors.push('Invalid JSON format');
      } else {
        errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      return { isValid: false, errors };
    }
  }

  /**
   * Create a compressed version of the layout state (for large datasets)
   */
  static compress(layoutMap: Map<string, LayoutNode>): string {
    // For compression, we only store essential positioning data
    const compressedNodes = Array.from(layoutMap.entries()).map(([id, node]) => ({
      id,
      x: Math.round(node.x * 100) / 100, // Round to 2 decimal places
      y: Math.round(node.y * 100) / 100,
      c: node.clusterId // Shortened field name
    }));

    const compressedState = {
      v: this.CURRENT_VERSION,
      t: Date.now(),
      n: compressedNodes
    };

    return JSON.stringify(compressedState);
  }

  /**
   * Decompress a compressed layout state
   */
  static decompress(compressedString: string): Map<string, LayoutNode> {
    try {
      const state = JSON.parse(compressedString);
      const layoutMap = new Map<string, LayoutNode>();

      for (const node of state.n) {
        const layoutNode: LayoutNode = {
          id: node.id,
          x: node.x,
          y: node.y,
          clusterId: node.c,
          similarityScores: new Map(),
          originalData: { id: node.id }, // Minimal original data
          layoutMetadata: {
            algorithm: 'compressed',
            timestamp: state.t,
            processingTime: 0,
            appliedForces: new Map(),
          }
        };
        
        layoutMap.set(node.id, layoutNode);
      }

      return layoutMap;
    } catch (error) {
      throw new Error(`Decompression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate serialized data integrity (simple validation)
   * Returns boolean for compatibility with tests
   */
  static validateSerializedData(jsonString: string): boolean {
    try {
      const validation = this.validate(jsonString);
      return validation.isValid;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate configuration hash for cache validation
   */
  private static generateConfigHash(layoutMap: Map<string, LayoutNode>): string {
    // Simple hash based on node count and first few node IDs
    const nodeIds = Array.from(layoutMap.keys()).slice(0, 5).sort().join(',');
    const nodeCount = layoutMap.size;
    return this.simpleHash(`${nodeCount}-${nodeIds}`);
  }

  /**
   * Calculate checksum for data integrity
   */
  private static calculateChecksum(state: Omit<SerializableLayoutState, 'checksum'>): string {
    // Create a deterministic string representation
    const dataString = JSON.stringify({
      version: state.version,
      nodeCount: state.metadata.nodeCount,
      nodes: state.nodes.map(n => `${n.id}:${n.x}:${n.y}`).sort().join('|')
    });
    
    return this.simpleHash(dataString);
  }

  /**
   * Simple hash function for checksums
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Get estimated serialized size in bytes
   */
  static estimateSize(layoutMap: Map<string, LayoutNode>): number {
    // Rough estimation based on average node data size
    const avgNodeSize = 200; // bytes per node (estimated)
    const metadataSize = 500; // bytes for metadata
    return (layoutMap.size * avgNodeSize) + metadataSize;
  }

  /**
   * Check if layout state should be compressed based on size
   */
  static shouldCompress(layoutMap: Map<string, LayoutNode>): boolean {
    const estimatedSize = this.estimateSize(layoutMap);
    const compressionThreshold = 50 * 1024; // 50KB
    return estimatedSize > compressionThreshold;
  }
}