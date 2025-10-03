/**
 * Represents a node in the knowledge graph
 */
export interface Node {
  id: string;
  label?: string;
  type?: string;
  x?: number;
  y?: number;
  z?: number; // For 3D support
  vector?: number[]; // For similarity-based clustering
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
  type?: string; // Ontology type affects layout
  weight?: number;
  strength?: number; // Link strength for force calculations
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
 * Accessor function type - can return value from datum, or be a constant
 */
export type Accessor<T, R> = R | ((d: T, i: number, nodes: T[]) => R);

/**
 * Similarity function for node clustering
 */
export type SimilarityFunction = (a: Node, b: Node) => number;

/**
 * Link strength function based on edge type
 */
export type LinkStrengthFunction = (edge: Edge, i: number, edges: Edge[]) => number;

/**
 * Configuration options for the knowledge graph
 */
export interface GraphConfig {
  width?: number;
  height?: number;
  
  // Node styling - d3 idiomatic accessor pattern
  nodeRadius?: Accessor<Node, number>;
  nodeFill?: Accessor<Node, string>;
  nodeStroke?: Accessor<Node, string>;
  nodeStrokeWidth?: Accessor<Node, number>;
  
  // Link styling - d3 idiomatic accessor pattern
  linkDistance?: Accessor<Edge, number>;
  linkStrength?: LinkStrengthFunction;
  linkStroke?: Accessor<Edge, string>;
  linkStrokeWidth?: Accessor<Edge, number>;
  
  // Edge rendering
  edgeRenderer?: 'simple' | 'bundled'; // Type of edge renderer to use
  edgeBundling?: {
    subdivisions?: number;
    compatibilityThreshold?: number;
    iterations?: number;
    stepSize?: number;
    stiffness?: number;
  };
  
  // Force simulation
  chargeStrength?: Accessor<Node, number>;
  similarityFunction?: SimilarityFunction; // For clustering based on similarity
  collisionRadius?: Accessor<Node, number>; // For collision detection
  
  // Simulation stability
  waitForStable?: boolean; // Wait for simulation to stabilize before rendering edges
  stabilityThreshold?: number; // Alpha threshold for considering simulation stable
  
  // Interaction
  enableZoom?: boolean;
  enableDrag?: boolean;
  
  // Dimensionality
  dimensions?: 2 | 3; // Support 2D and 3D layouts
}
