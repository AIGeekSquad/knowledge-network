/**
 * Represents a node in the knowledge graph
 */
export interface Node {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Represents an edge (link) between nodes in the knowledge graph
 */
export interface Edge {
  id?: string;
  source: string | Node;
  target: string | Node;
  label?: string;
  type?: string;
  weight?: number;
  metadata?: Record<string, unknown>;
}

/**
 * The complete graph data structure
 */
export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

/**
 * Configuration options for the knowledge graph
 */
export interface GraphConfig {
  width?: number;
  height?: number;
  nodeRadius?: number;
  linkDistance?: number;
  chargeStrength?: number;
  enableZoom?: boolean;
  enableDrag?: boolean;
}
