import { EventEmitter } from '../utils/EventEmitter';
import type { GraphData, Node, Edge } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Manages graph data with validation, indexing, and efficient queries.
 *
 * @remarks
 * The DataManager is responsible for all data-related operations including
 * validation, storage, updates, and queries. It maintains internal indexes
 * for efficient neighbor and edge lookups.
 *
 * @example
 * ```typescript
 * const dataManager = new DataManager();
 * const result = dataManager.setData(graphData);
 * if (result.isValid) {
 *   const neighbors = dataManager.getNeighbors('node1');
 * }
 * ```
 */
export class DataManager extends EventEmitter {
  private nodes: Map<string, Node> = new Map();
  private edges: Map<string, Edge> = new Map();
  private adjacencyList: Map<string, Set<string>> = new Map();
  private incomingEdges: Map<string, Set<string>> = new Map();
  private outgoingEdges: Map<string, Set<string>> = new Map();

  constructor(data?: GraphData) {
    super();
    if (data) {
      this.setData(data);
    }
  }

  /**
   * Set the graph data with validation and indexing
   */
  setData(data: GraphData): ValidationResult {
    const validation = this.validateData(data);

    if (!validation.isValid) {
      this.emit('validationError', validation);
      return validation;
    }

    // Clear existing data
    this.clearData();

    // Index nodes
    data.nodes.forEach(node => {
      this.nodes.set(node.id, { ...node });
      this.adjacencyList.set(node.id, new Set());
      this.incomingEdges.set(node.id, new Set());
      this.outgoingEdges.set(node.id, new Set());
    });

    // Index edges and build adjacency structures
    data.edges.forEach((edge, index) => {
      const edgeId = edge.id || `edge-${index}`;
      const processedEdge = { ...edge, id: edgeId };
      this.edges.set(edgeId, processedEdge);

      const sourceId = this.getNodeId(edge.source);
      const targetId = this.getNodeId(edge.target);

      if (sourceId && targetId) {
        // Update adjacency list (undirected)
        this.adjacencyList.get(sourceId)?.add(targetId);
        this.adjacencyList.get(targetId)?.add(sourceId);

        // Update directed edge lists
        this.outgoingEdges.get(sourceId)?.add(edgeId);
        this.incomingEdges.get(targetId)?.add(edgeId);
      }
    });

    this.emit('dataChanged', this.getData());
    return validation;
  }

  /**
   * Get the current graph data
   */
  getData(): GraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges.values())
    };
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
    this.incomingEdges.clear();
    this.outgoingEdges.clear();
    this.emit('dataCleared');
  }

  /**
   * Node operations
   */
  addNode(node: Node): void {
    const validation = this.validateNode(node);
    if (!validation.isValid) {
      throw new Error(`Invalid node: ${validation.errors[0].message}`);
    }

    this.nodes.set(node.id, { ...node });
    this.adjacencyList.set(node.id, new Set());
    this.incomingEdges.set(node.id, new Set());
    this.outgoingEdges.set(node.id, new Set());

    this.emit('nodeAdded', node);
    this.emit('dataChanged', this.getData());
  }

  updateNode(nodeId: string, updates: Partial<Node>): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const updatedNode = { ...node, ...updates, id: node.id };
    this.nodes.set(nodeId, updatedNode);

    this.emit('nodeUpdated', updatedNode);
    this.emit('dataChanged', this.getData());
  }

  removeNode(nodeId: string): void {
    if (!this.nodes.has(nodeId)) {
      throw new Error(`Node ${nodeId} not found`);
    }

    // Remove connected edges
    const connectedEdges = this.getConnectedEdges(nodeId);
    connectedEdges.forEach(edge => {
      const edgeId = edge.id || '';
      this.edges.delete(edgeId);
    });

    // Clean up adjacency structures
    this.adjacencyList.delete(nodeId);
    this.incomingEdges.delete(nodeId);
    this.outgoingEdges.delete(nodeId);

    // Remove from other nodes' adjacency lists
    this.adjacencyList.forEach(neighbors => {
      neighbors.delete(nodeId);
    });

    this.nodes.delete(nodeId);

    this.emit('nodeRemoved', nodeId);
    this.emit('dataChanged', this.getData());
  }

  getNode(nodeId: string): Node | undefined {
    return this.nodes.get(nodeId);
  }

  getNodes(): Node[] {
    return Array.from(this.nodes.values());
  }

  hasNode(nodeId: string): boolean {
    return this.nodes.has(nodeId);
  }

  /**
   * Edge operations
   */
  addEdge(edge: Edge): void {
    const validation = this.validateEdge(edge);
    if (!validation.isValid) {
      throw new Error(`Invalid edge: ${validation.errors[0].message}`);
    }

    const edgeId = edge.id || `edge-${this.edges.size}`;
    const processedEdge = { ...edge, id: edgeId };
    this.edges.set(edgeId, processedEdge);

    const sourceId = this.getNodeId(edge.source);
    const targetId = this.getNodeId(edge.target);

    if (sourceId && targetId) {
      this.adjacencyList.get(sourceId)?.add(targetId);
      this.adjacencyList.get(targetId)?.add(sourceId);
      this.outgoingEdges.get(sourceId)?.add(edgeId);
      this.incomingEdges.get(targetId)?.add(edgeId);
    }

    this.emit('edgeAdded', processedEdge);
    this.emit('dataChanged', this.getData());
  }

  updateEdge(edgeId: string, updates: Partial<Edge>): void {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      throw new Error(`Edge ${edgeId} not found`);
    }

    const updatedEdge = { ...edge, ...updates, id: edge.id };
    this.edges.set(edgeId, updatedEdge);

    this.emit('edgeUpdated', updatedEdge);
    this.emit('dataChanged', this.getData());
  }

  removeEdge(edgeId: string): void {
    const edge = this.edges.get(edgeId);
    if (!edge) {
      throw new Error(`Edge ${edgeId} not found`);
    }

    const sourceId = this.getNodeId(edge.source);
    const targetId = this.getNodeId(edge.target);

    if (sourceId && targetId) {
      // Update adjacency list (check if this was the only edge between nodes)
      const remainingEdges = this.getEdgesBetween(sourceId, targetId)
        .filter(e => (e.id || '') !== edgeId);

      if (remainingEdges.length === 0) {
        this.adjacencyList.get(sourceId)?.delete(targetId);
        this.adjacencyList.get(targetId)?.delete(sourceId);
      }

      this.outgoingEdges.get(sourceId)?.delete(edgeId);
      this.incomingEdges.get(targetId)?.delete(edgeId);
    }

    this.edges.delete(edgeId);

    this.emit('edgeRemoved', edgeId);
    this.emit('dataChanged', this.getData());
  }

  getEdge(edgeId: string): Edge | undefined {
    return this.edges.get(edgeId);
  }

  getEdges(): Edge[] {
    return Array.from(this.edges.values());
  }

  hasEdge(edgeId: string): boolean {
    return this.edges.has(edgeId);
  }

  /**
   * Graph queries
   */
  getNeighbors(nodeId: string): Node[] {
    const neighborIds = this.adjacencyList.get(nodeId) || new Set();
    return Array.from(neighborIds)
      .map(id => this.nodes.get(id))
      .filter((node): node is Node => node !== undefined);
  }

  getConnectedEdges(nodeId: string): Edge[] {
    return Array.from(this.edges.values()).filter(edge => {
      const sourceId = this.getNodeId(edge.source);
      const targetId = this.getNodeId(edge.target);
      return sourceId === nodeId || targetId === nodeId;
    });
  }

  getIncomingEdges(nodeId: string): Edge[] {
    const edgeIds = this.incomingEdges.get(nodeId) || new Set();
    return Array.from(edgeIds)
      .map(id => this.edges.get(id))
      .filter((edge): edge is Edge => edge !== undefined);
  }

  getOutgoingEdges(nodeId: string): Edge[] {
    const edgeIds = this.outgoingEdges.get(nodeId) || new Set();
    return Array.from(edgeIds)
      .map(id => this.edges.get(id))
      .filter((edge): edge is Edge => edge !== undefined);
  }

  getDegree(nodeId: string): number {
    return this.adjacencyList.get(nodeId)?.size || 0;
  }

  getInDegree(nodeId: string): number {
    return this.incomingEdges.get(nodeId)?.size || 0;
  }

  getOutDegree(nodeId: string): number {
    return this.outgoingEdges.get(nodeId)?.size || 0;
  }

  /**
   * Validation methods
   */
  validateData(data: GraphData): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate nodes
    const nodeIds = new Set<string>();
    data.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push({
          field: `nodes[${index}].id`,
          message: 'Node must have an id'
        });
      } else if (nodeIds.has(node.id)) {
        errors.push({
          field: `nodes[${index}].id`,
          message: `Duplicate node id: ${node.id}`,
          value: node.id
        });
      } else {
        nodeIds.add(node.id);
      }

      if (!node.label) {
        warnings.push({
          field: `nodes[${index}].label`,
          message: `Node ${node.id} has no label`,
          suggestion: 'Consider adding a label for better visualization'
        });
      }
    });

    // Validate edges
    data.edges.forEach((edge, index) => {
      const sourceId = this.getNodeId(edge.source);
      const targetId = this.getNodeId(edge.target);

      if (!sourceId) {
        errors.push({
          field: `edges[${index}].source`,
          message: 'Edge source is invalid',
          value: edge.source
        });
      } else if (!nodeIds.has(sourceId)) {
        errors.push({
          field: `edges[${index}].source`,
          message: `Edge references non-existent source node: ${sourceId}`,
          value: sourceId
        });
      }

      if (!targetId) {
        errors.push({
          field: `edges[${index}].target`,
          message: 'Edge target is invalid',
          value: edge.target
        });
      } else if (!nodeIds.has(targetId)) {
        errors.push({
          field: `edges[${index}].target`,
          message: `Edge references non-existent target node: ${targetId}`,
          value: targetId
        });
      }

      if (sourceId === targetId) {
        warnings.push({
          field: `edges[${index}]`,
          message: `Self-loop detected on node ${sourceId}`,
          suggestion: 'Self-loops may cause rendering issues'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  validateNode(node: Node): ValidationResult {
    const errors: ValidationError[] = [];

    if (!node.id) {
      errors.push({
        field: 'id',
        message: 'Node must have an id'
      });
    } else if (this.nodes.has(node.id)) {
      errors.push({
        field: 'id',
        message: `Node with id ${node.id} already exists`,
        value: node.id
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateEdge(edge: Edge): ValidationResult {
    const errors: ValidationError[] = [];

    const sourceId = this.getNodeId(edge.source);
    const targetId = this.getNodeId(edge.target);

    if (!sourceId) {
      errors.push({
        field: 'source',
        message: 'Invalid source',
        value: edge.source
      });
    } else if (!this.nodes.has(sourceId)) {
      errors.push({
        field: 'source',
        message: `Source node ${sourceId} does not exist`,
        value: sourceId
      });
    }

    if (!targetId) {
      errors.push({
        field: 'target',
        message: 'Invalid target',
        value: edge.target
      });
    } else if (!this.nodes.has(targetId)) {
      errors.push({
        field: 'target',
        message: `Target node ${targetId} does not exist`,
        value: targetId
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Helper methods
   */
  private getNodeId(nodeOrId: string | Node | any): string | null {
    if (!nodeOrId) return null;
    if (typeof nodeOrId === 'string') return nodeOrId;
    if (typeof nodeOrId === 'object' && 'id' in nodeOrId) return nodeOrId.id;
    return null;
  }

  private getEdgesBetween(sourceId: string, targetId: string): Edge[] {
    return Array.from(this.edges.values()).filter(edge => {
      const edgeSourceId = this.getNodeId(edge.source);
      const edgeTargetId = this.getNodeId(edge.target);
      return (
        (edgeSourceId === sourceId && edgeTargetId === targetId) ||
        (edgeSourceId === targetId && edgeTargetId === sourceId)
      );
    });
  }
}