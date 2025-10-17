/**
 * Represents a node in the knowledge graph.
 *
 * @remarks
 * Nodes are the fundamental vertices in the graph. They can represent entities,
 * concepts, or data points. Position (x, y, z) is typically managed by the force
 * simulation but can be pre-specified for fixed layouts.
 *
 * @example
 * ```typescript
 * const node: Node = {
 *   id: 'node-1',
 *   label: 'Machine Learning',
 *   type: 'concept',
 *   vector: [0.8, 0.2, 0.5], // Optional embedding for similarity calculations
 *   metadata: {
 *     category: 'AI',
 *     importance: 0.9,
 *     lastModified: '2024-01-01'
 *   }
 * };
 * ```
 */
export interface Node {
  /**
   * Unique identifier for the node.
   * Used to reference this node in edges and for d3 data binding.
   */
  id: string;

  /**
   * Display label for the node.
   * If not provided, the id will typically be used for display.
   */
  label?: string;

  /**
   * Node type for categorization and styling.
   * Can be used with accessor functions to apply different visual styles.
   */
  type?: string;

  /**
   * X-coordinate position.
   * Managed by force simulation unless fixed positioning is used.
   */
  x?: number;

  /**
   * Y-coordinate position.
   * Managed by force simulation unless fixed positioning is used.
   */
  y?: number;

  /**
   * Z-coordinate for 3D layouts.
   * Only used when dimensions is set to 3 in GraphConfig.
   */
  z?: number;

  /**
   * Vector embedding for similarity-based clustering.
   * Used by similarityFunction to calculate node attraction forces.
   */
  vector?: number[];

  /**
   * Arbitrary metadata attached to the node.
   * Can be accessed by accessor functions for dynamic styling and behavior.
   */
  metadata?: Record<string, unknown>;
}

/**
 * Represents an edge (link) between nodes in the knowledge graph.
 *
 * @remarks
 * Edges define relationships between nodes. During force simulation, string
 * source/target references are resolved to Node objects. Edge properties can
 * influence both visual styling and force simulation behavior.
 *
 * @example
 * ```typescript
 * const edge: Edge = {
 *   id: 'edge-1',
 *   source: 'node-1',  // Can be string ID or Node object
 *   target: 'node-2',
 *   type: 'dependency',
 *   weight: 0.8,       // Influences edge bundling compatibility
 *   strength: 1.0,     // Force simulation link strength
 *   metadata: {
 *     created: '2024-01-01',
 *     bidirectional: false
 *   }
 * };
 * ```
 */
export interface Edge {
  /**
   * Optional unique identifier for the edge.
   * Useful for d3 data binding and edge selection.
   */
  id?: string;

  /**
   * Source node reference.
   * Can be a string ID (before simulation) or Node object (after simulation).
   */
  source: string | Node;

  /**
   * Target node reference.
   * Can be a string ID (before simulation) or Node object (after simulation).
   */
  target: string | Node;

  /**
   * Display label for the edge.
   * Rendered along the edge path if label rendering is enabled.
   */
  label?: string;

  /**
   * Edge type for categorization.
   * Used for styling and can influence force layout behavior.
   * Common types: 'hierarchy', 'dependency', 'similarity', 'reference'.
   */
  type?: string;

  /**
   * Edge weight for importance or connection strength.
   * Higher weights can influence edge bundling compatibility calculations.
   * Typically normalized between 0 and 1.
   */
  weight?: number;

  /**
   * Link strength for force simulation.
   * Controls how strongly this edge pulls connected nodes together.
   * Default is typically 1.0, use lower values for weaker connections.
   */
  strength?: number;

  /**
   * Arbitrary metadata attached to the edge.
   * Accessible by accessor functions for dynamic styling and behavior.
   */
  metadata?: Record<string, unknown>;
}

/**
 * The complete graph data structure.
 *
 * @remarks
 * Contains all nodes and edges that define the knowledge graph.
 * This is the primary data structure passed to the visualization library.
 *
 * @example
 * ```typescript
 * const graphData: GraphData = {
 *   nodes: [
 *     { id: 'n1', label: 'Node 1', type: 'concept' },
 *     { id: 'n2', label: 'Node 2', type: 'concept' },
 *     { id: 'n3', label: 'Node 3', type: 'detail' }
 *   ],
 *   edges: [
 *     { source: 'n1', target: 'n2', type: 'relates' },
 *     { source: 'n2', target: 'n3', type: 'contains' }
 *   ]
 * };
 * ```
 */
export interface GraphData {
  /**
   * Array of all nodes in the graph.
   * Each node must have a unique id.
   */
  nodes: Node[];

  /**
   * Array of all edges in the graph.
   * Source and target must reference valid node ids.
   */
  edges: Edge[];
}

/**
 * Accessor function type following d3.js patterns.
 *
 * @typeParam T - The type of the data element (typically Node or Edge)
 * @typeParam R - The return type (number, string, etc.)
 *
 * @remarks
 * This is the core d3.js pattern for data-driven styling. An accessor can be:
 * - A constant value applied to all elements
 * - A function that computes values based on data
 *
 * The function signature matches d3's selection.attr() and similar methods,
 * receiving the datum, index, and full array of elements.
 *
 * @example
 * ```typescript
 * // Constant accessor - all nodes get radius 5
 * const nodeRadius: Accessor<Node, number> = 5;
 *
 * // Function accessor - radius based on node type
 * const nodeRadius: Accessor<Node, number> = (node) => {
 *   return node.type === 'concept' ? 10 : 5;
 * };
 *
 * // Using metadata for dynamic styling
 * const nodeFill: Accessor<Node, string> = (node) => {
 *   const importance = node.metadata?.importance as number || 0;
 *   return importance > 0.7 ? '#ff6b6b' : '#4ecdc4';
 * };
 *
 * // Using index for gradients
 * const nodeOpacity: Accessor<Node, number> = (node, i, nodes) => {
 *   return 0.3 + (0.7 * i / nodes.length);
 * };
 * ```
 */
export type Accessor<T, R> = R | ((d: T, i: number, nodes: T[]) => R);

/**
 * Similarity function for node clustering and attraction forces.
 *
 * @param a - First node to compare
 * @param b - Second node to compare
 * @returns Similarity score, typically between 0 (dissimilar) and 1 (identical)
 *
 * @remarks
 * Used to create attraction forces between similar nodes, causing them to cluster
 * in the force layout. Higher similarity values create stronger attraction.
 * Common implementations use vector embeddings, type matching, or metadata comparison.
 *
 * @example
 * ```typescript
 * // Cosine similarity using vector embeddings
 * const cosineSimilarity: SimilarityFunction = (a, b) => {
 *   if (!a.vector || !b.vector) return 0;
 *
 *   const dotProduct = a.vector.reduce((sum, val, i) =>
 *     sum + val * b.vector![i], 0
 *   );
 *   const magnitudeA = Math.sqrt(
 *     a.vector.reduce((sum, val) => sum + val * val, 0)
 *   );
 *   const magnitudeB = Math.sqrt(
 *     b.vector.reduce((sum, val) => sum + val * val, 0)
 *   );
 *
 *   return dotProduct / (magnitudeA * magnitudeB);
 * };
 *
 * // Type-based similarity
 * const typeSimilarity: SimilarityFunction = (a, b) => {
 *   if (a.type === b.type) return 1.0;
 *   if (a.type?.startsWith('sub') && b.type?.startsWith('sub')) return 0.5;
 *   return 0;
 * };
 *
 * // Metadata-based similarity
 * const metadataSimilarity: SimilarityFunction = (a, b) => {
 *   const catA = a.metadata?.category;
 *   const catB = b.metadata?.category;
 *   return catA === catB ? 0.8 : 0.2;
 * };
 * ```
 */
export type SimilarityFunction = (a: Node, b: Node) => number;

/**
 * Link strength function for force simulation.
 *
 * @param edge - The edge to calculate strength for
 * @param i - Index of the edge in the edges array
 * @param edges - Full array of edges
 * @returns Link strength value, typically between 0 and 1
 *
 * @remarks
 * Controls how strongly each edge pulls its connected nodes together in the
 * force simulation. Higher values create tighter connections. Can be used to
 * create hierarchical layouts or emphasize certain relationship types.
 *
 * @example
 * ```typescript
 * // Strength based on edge type
 * const linkStrength: LinkStrengthFunction = (edge) => {
 *   switch (edge.type) {
 *     case 'hierarchy': return 1.0;   // Strong hierarchical connections
 *     case 'dependency': return 0.7;   // Medium strength dependencies
 *     case 'reference': return 0.3;    // Weak references
 *     default: return 0.5;
 *   }
 * };
 *
 * // Use edge weight if available
 * const linkStrength: LinkStrengthFunction = (edge) => {
 *   return edge.weight ?? 0.5;
 * };
 *
 * // Combine strength property with type
 * const linkStrength: LinkStrengthFunction = (edge) => {
 *   const baseStrength = edge.strength ?? 0.5;
 *   const typeMultiplier = edge.type === 'critical' ? 2.0 : 1.0;
 *   return Math.min(baseStrength * typeMultiplier, 1.0);
 * };
 * ```
 */
export type LinkStrengthFunction = (edge: Edge, i: number, edges: Edge[]) => number;

/**
 * Layout engine state for progress tracking.
 *
 * @remarks
 * Represents the different stages of graph rendering and layout calculation.
 * Used with the onStateChange callback to provide detailed progress information.
 *
 * @example
 * ```typescript
 * const config: GraphConfig = {
 *   onStateChange: (state, progress) => {
 *     console.log(`State: ${state}, Progress: ${progress}%`);
 *   }
 * };
 * ```
 */
export enum LayoutEngineState {
  /**
   * Initial state before rendering starts.
   */
  INITIAL = 'initial',

  /**
   * Loading and preparing graph data.
   */
  LOADING = 'loading',

  /**
   * Force simulation is calculating node positions.
   */
  LAYOUT_CALCULATING = 'layout_calculating',

  /**
   * Edges are being generated and rendered.
   */
  EDGE_GENERATING = 'edge_generating',

  /**
   * Viewport is being adjusted to fit the graph.
   */
  ZOOM_FITTING = 'zoom_fitting',

  /**
   * Graph is fully rendered and ready for interaction.
   */
  READY = 'ready',

  /**
   * An error occurred during rendering.
   */
  ERROR = 'error',
}

/**
 * Configuration options for the knowledge graph visualization.
 *
 * @remarks
 * GraphConfig follows d3.js patterns extensively, using accessor functions to enable
 * data-driven styling. Most properties accept either constant values or functions
 * that compute values based on the data element. This enables rich, dynamic
 * visualizations that respond to your data's properties.
 *
 * @example
 * ```typescript
 * const config: GraphConfig = {
 *   width: 800,
 *   height: 600,
 *
 *   // Node styling using accessor pattern
 *   nodeRadius: (node) => node.type === 'concept' ? 12 : 6,
 *   nodeFill: (node) => {
 *     const importance = node.metadata?.importance as number || 0;
 *     return importance > 0.7 ? '#ff6b6b' : '#4ecdc4';
 *   },
 *   nodeStroke: '#333',
 *   nodeStrokeWidth: 1.5,
 *
 *   // Edge configuration
 *   linkDistance: 30,
 *   linkStrength: (edge) => edge.weight || 0.5,
 *   linkStroke: (edge) => edge.type === 'critical' ? '#ff0000' : '#999',
 *
 *   // Edge bundling for cleaner visualization
 *   edgeRenderer: 'bundled',
 *   edgeBundling: {
 *     subdivisions: 10,
 *     iterations: 90,
 *     compatibilityThreshold: 0.6
 *   },
 *
 *   // Force simulation
 *   chargeStrength: -300,
 *   similarityFunction: (a, b) => {
 *     // Cluster nodes with same type
 *     return a.type === b.type ? 0.8 : 0;
 *   },
 *
 *   // Interaction
 *   enableZoom: true,
 *   enableDrag: true
 * };
 * ```
 */
export interface GraphConfig {
  /**
   * Width of the visualization canvas in pixels.
   * @default 800
   */
  width?: number;

  /**
   * Height of the visualization canvas in pixels.
   * @default 600
   */
  height?: number;

  // Node styling - d3 idiomatic accessor pattern

  /**
   * Node radius accessor.
   * Can be a constant or a function of node data.
   * @default 5
   * @example
   * ```typescript
   * // Constant radius
   * nodeRadius: 8
   *
   * // Dynamic based on metadata
   * nodeRadius: (node) => {
   *   const size = node.metadata?.size as number || 1;
   *   return 4 + size * 2;
   * }
   * ```
   */
  nodeRadius?: Accessor<Node, number>;

  /**
   * Node fill color accessor.
   * Can be a constant color or a function returning colors.
   * @default '#69b3a2'
   * @example
   * ```typescript
   * // By type with color scale
   * nodeFill: (node) => {
   *   const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
   *   return colorScale(node.type || 'default');
   * }
   * ```
   */
  nodeFill?: Accessor<Node, string>;

  /**
   * Node stroke color accessor.
   * @default '#333'
   */
  nodeStroke?: Accessor<Node, string>;

  /**
   * Node stroke width accessor.
   * @default 1.5
   */
  nodeStrokeWidth?: Accessor<Node, number>;

  // Link styling - d3 idiomatic accessor pattern

  /**
   * Link distance accessor for force simulation.
   * Controls the desired distance between connected nodes.
   * @default 30
   * @example
   * ```typescript
   * // Variable distance based on edge type
   * linkDistance: (edge) => {
   *   return edge.type === 'hierarchy' ? 50 : 30;
   * }
   * ```
   */
  linkDistance?: Accessor<Edge, number>;

  /**
   * Link strength function for force simulation.
   * Controls how strongly edges pull nodes together.
   * @see LinkStrengthFunction
   */
  linkStrength?: LinkStrengthFunction;

  /**
   * Link stroke color accessor.
   * @default '#999'
   */
  linkStroke?: Accessor<Edge, string>;

  /**
   * Link stroke width accessor.
   * @default 1
   */
  linkStrokeWidth?: Accessor<Edge, number>;

  // Edge rendering

  /**
   * Type of edge renderer to use.
   * - 'simple': Direct lines between nodes
   * - 'bundled': Hierarchical edge bundling for cleaner visualization
   * @default 'simple'
   */
  edgeRenderer?: 'simple' | 'bundled';

  /**
   * Edge bundling configuration for hierarchical edge bundling.
   * Only used when edgeRenderer is 'bundled'.
   * @example
   * ```typescript
   * edgeBundling: {
   *   subdivisions: 10,     // Points per edge for curves
   *   iterations: 90,       // Bundling iterations
   *   compatibilityThreshold: 0.6,  // Min compatibility to bundle
   *   stepSize: 0.1,        // Force step size
   *   stiffness: 0.1,       // Edge stiffness
   *   compatibilityFunction: (e1, e2) => {
   *     // Custom compatibility based on edge types
   *     return e1.type === e2.type ? 1.0 : 0.3;
   *   }
   * }
   * ```
   */
  edgeBundling?: {
    /**
     * Number of subdivision points for curved edges.
     * More subdivisions create smoother curves.
     * @default 20
     */
    subdivisions?: number;

    /**
     * Whether to use adaptive subdivision based on edge length.
     * When true, longer edges get more subdivision points.
     * @default true
     */
    adaptiveSubdivision?: boolean;

    /**
     * Minimum compatibility score for edges to bundle together.
     * Range: 0 (never bundle) to 1 (always bundle).
     * @default 0.6
     */
    compatibilityThreshold?: number;

    /**
     * Number of iterations for the bundling algorithm.
     * More iterations create tighter bundles.
     * @default 90
     */
    iterations?: number;

    /**
     * Step size for force-directed bundling.
     * Smaller values create more gradual bundling.
     * @default 0.04
     */
    stepSize?: number;

    /**
     * Edge stiffness controlling resistance to bundling.
     * Higher values preserve edge direction more.
     * @default 0.1
     */
    stiffness?: number;

    /**
     * Momentum factor for force application (0-1).
     * Higher values create smoother movement over iterations.
     * @default 0.5
     */
    momentum?: number;

    /**
     * Type of curve to use for rendering.
     * Options: 'basis', 'cardinal', 'catmullRom', 'bundle'
     * @default 'basis'
     */
    curveType?: 'basis' | 'cardinal' | 'catmullRom' | 'bundle';

    /**
     * Tension parameter for cardinal and catmullRom curves.
     * 0 = straight lines, 1 = maximum curvature.
     * @default 0.85
     */
    curveTension?: number;

    /**
     * Type of smoothing algorithm to apply.
     * Options: 'laplacian', 'gaussian', 'bilateral'
     * @default 'laplacian'
     */
    smoothingType?: 'laplacian' | 'gaussian' | 'bilateral';

    /**
     * Number of smoothing iterations.
     * @default 2
     */
    smoothingIterations?: number;

    /**
     * How often to apply smoothing during bundling iterations.
     * E.g., 5 means smooth every 5 iterations.
     * @default 5
     */
    smoothingFrequency?: number;

    /**
     * Custom compatibility function for edge pairs.
     * Returns compatibility score between 0 and 1.
     * Higher scores mean edges are more likely to bundle.
     */
    compatibilityFunction?: (edge1: Edge, edge2: Edge) => number;
  };

  // Force simulation

  /**
   * Charge strength accessor for node repulsion.
   * Negative values create repulsion, positive create attraction.
   * @default -300
   * @example
   * ```typescript
   * // Stronger repulsion for larger nodes
   * chargeStrength: (node) => {
   *   const size = node.metadata?.size as number || 1;
   *   return -200 * size;
   * }
   * ```
   */
  chargeStrength?: Accessor<Node, number>;

  /**
   * Similarity function for creating attraction between similar nodes.
   * Creates clustering effect based on computed similarity.
   * @see SimilarityFunction
   */
  similarityFunction?: SimilarityFunction;

  /**
   * Threshold for similarity-based clustering.
   * Only node pairs with similarity above this threshold will be attracted.
   * Range: 0 (no clustering) to 1 (maximum clustering).
   * @default 0.5
   */
  similarityThreshold?: number;

  /**
   * Collision radius accessor to prevent node overlap.
   * Sets minimum distance between node centers.
   * @example
   * ```typescript
   * // Collision based on visual radius plus padding
   * collisionRadius: (node) => {
   *   const radius = nodeRadius(node) || 5;
   *   return radius + 2; // 2px padding
   * }
   * ```
   */
  collisionRadius?: Accessor<Node, number>;

  // Simulation stability

  /**
   * Wait for force simulation to stabilize before rendering edges.
   * Useful for edge bundling which works better on stable layouts.
   * @default false
   */
  waitForStable?: boolean;

  /**
   * Alpha threshold for considering the simulation stable.
   * Lower values mean more stability before considering complete.
   * @default 0.001
   */
  stabilityThreshold?: number;

  /**
   * Whether to show edge labels along the edges.
   * Labels are rendered as text along the edge paths.
   * @default false
   */
  showEdgeLabels?: boolean;

  /**
   * Styling options for edge labels when showEdgeLabels is true.
   */
  edgeLabelStyle?: {
    fontSize?: number;
    fontFamily?: string;
    fill?: string;
    textAnchor?: 'start' | 'middle' | 'end';
    dominantBaseline?:
      | 'auto'
      | 'text-before-edge'
      | 'text-after-edge'
      | 'central'
      | 'middle'
      | 'hanging';
  };

  // Interaction

  /**
   * Enable zoom and pan interaction on the graph.
   * @default true
   */
  enableZoom?: boolean;

  /**
   * Zoom extent range [min, max] for zoom controls.
   * @default [0.1, 10]
   */
  zoomExtent?: [number, number];

  /**
   * Whether to automatically fit the graph to the viewport.
   * @default false
   */
  fitToViewport?: boolean;

  /**
   * Padding around the graph when fitting to viewport.
   * @default 20
   */
  padding?: number;

  /**
   * Enable dragging nodes to reposition them.
   * @default true
   */
  enableDrag?: boolean;

  // Dimensionality

  /**
   * Number of dimensions for the layout (2D or 3D).
   * 3D support requires nodes to have z coordinates.
   * @default 2
   */
  dimensions?: 2 | 3;

  /**
   * Callback function called when edges have been rendered and are ready.
   * Useful for implementing loading states and post-render operations.
   */
  onEdgesRendered?: () => void;

  // Progress and state callbacks

  /**
   * Callback when the layout engine state changes.
   * Provides current state and overall progress percentage.
   * @param state - Current state of the layout engine
   * @param progress - Progress percentage (0-100)
   * @example
   * ```typescript
   * onStateChange: (state, progress) => {
   *   console.log(`State: ${state}, Progress: ${progress}%`);
   *   if (state === LayoutEngineState.READY) {
   *     console.log('Graph fully rendered!');
   *   }
   * }
   * ```
   */
  onStateChange?: (state: LayoutEngineState, progress: number) => void;

  /**
   * Callback for layout calculation progress.
   * Called during force simulation ticks.
   * @param alpha - Current alpha value of the simulation (0-1)
   * @param progress - Progress percentage (0-100)
   * @example
   * ```typescript
   * onLayoutProgress: (alpha, progress) => {
   *   console.log(`Layout ${progress}% complete (alpha: ${alpha})`);
   * }
   * ```
   */
  onLayoutProgress?: (alpha: number, progress: number) => void;

  /**
   * Callback for edge rendering progress.
   * Useful for showing progress during edge bundling calculations.
   * @param rendered - Number of edges rendered
   * @param total - Total number of edges
   * @example
   * ```typescript
   * onEdgeRenderingProgress: (rendered, total) => {
   *   console.log(`Rendered ${rendered}/${total} edges`);
   * }
   * ```
   */
  onEdgeRenderingProgress?: (rendered: number, total: number) => void;

  /**
   * Callback when a node is selected.
   * Provides the selected node ID and its neighbors.
   * @param nodeId - ID of the selected node
   * @param neighbors - Array of neighbor node IDs
   * @param edges - Array of connected edge IDs
   * @example
   * ```typescript
   * onNodeSelected: (nodeId, neighbors, edges) => {
   *   console.log(`Selected ${nodeId} with ${neighbors.length} neighbors`);
   *   highlightNodes([nodeId, ...neighbors]);
   * }
   * ```
   */
  onNodeSelected?: (nodeId: string, neighbors: string[], edges: string[]) => void;

  /**
   * Callback when an error occurs during rendering.
   * @param error - The error that occurred
   * @param stage - The stage where the error occurred
   * @example
   * ```typescript
   * onError: (error, stage) => {
   *   console.error(`Error in ${stage}:`, error);
   *   showErrorNotification(error.message);
   * }
   * ```
   */
  onError?: (error: Error, stage: string) => void;
}
