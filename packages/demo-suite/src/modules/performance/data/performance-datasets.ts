/**
 * Performance Dataset Generator
 *
 * Generates scalable test datasets for performance benchmarking and validation.
 * Creates realistic graph structures with configurable complexity and density.
 */

export interface Node {
  id: string;
  label: string;
  x?: number;
  y?: number;
  size?: number;
  color?: string;
  type?: string;
  weight?: number;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  type?: string;
  color?: string;
}

export interface GraphDataset {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    nodeCount: number;
    edgeCount: number;
    averageDegree: number;
    density: number;
    generatedAt: number;
    structure: string;
  };
}

export interface DatasetConfig {
  nodeCount: number;
  edgeDensity?: number;
  structure?: 'random' | 'clustered' | 'hierarchical' | 'scale-free' | 'small-world';
  nodeTypes?: string[];
  spatialDistribution?: 'uniform' | 'clustered' | 'circular' | 'grid';
  seed?: number;
}

/**
 * Seeded pseudo-random number generator for reproducible datasets
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  integer(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  choice<T>(array: T[]): T {
    return array[this.integer(0, array.length - 1)];
  }

  boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}

/**
 * Generate a performance test dataset with specified configuration
 */
export function generatePerformanceDataset(
  nodeCountOrConfig: number | DatasetConfig
): GraphDataset {
  let config: DatasetConfig;

  if (typeof nodeCountOrConfig === 'number') {
    config = { nodeCount: nodeCountOrConfig };
  } else {
    config = nodeCountOrConfig;
  }

  // Set defaults
  const finalConfig: Required<DatasetConfig> = {
    nodeCount: config.nodeCount,
    edgeDensity: config.edgeDensity ?? calculateOptimalDensity(config.nodeCount),
    structure: config.structure ?? 'scale-free',
    nodeTypes: config.nodeTypes ?? ['person', 'organization', 'concept', 'document'],
    spatialDistribution: config.spatialDistribution ?? 'clustered',
    seed: config.seed ?? 12345
  };

  const random = new SeededRandom(finalConfig.seed);

  // Generate nodes
  const nodes = generateNodes(finalConfig, random);

  // Generate edges based on structure
  const edges = generateEdges(nodes, finalConfig, random);

  // Calculate metadata
  const metadata = {
    nodeCount: nodes.length,
    edgeCount: edges.length,
    averageDegree: (edges.length * 2) / nodes.length,
    density: (edges.length * 2) / (nodes.length * (nodes.length - 1)),
    generatedAt: Date.now(),
    structure: finalConfig.structure
  };

  return { nodes, edges, metadata };
}

/**
 * Calculate optimal edge density based on node count for good performance
 */
function calculateOptimalDensity(nodeCount: number): number {
  // Decrease density as node count increases to maintain performance
  if (nodeCount <= 500) return 0.05;      // 5% density for small graphs
  if (nodeCount <= 2000) return 0.02;     // 2% density for medium graphs
  if (nodeCount <= 10000) return 0.008;   // 0.8% density for large graphs
  return 0.003;                           // 0.3% density for very large graphs
}

/**
 * Generate nodes with spatial distribution and realistic properties
 */
function generateNodes(config: Required<DatasetConfig>, random: SeededRandom): Node[] {
  const nodes: Node[] = [];
  const nodeColors = [
    '#107c10', '#00bcf2', '#ffb900', '#e81123',
    '#6264a7', '#8764b8', '#00b7c3', '#d13438'
  ];

  for (let i = 0; i < config.nodeCount; i++) {
    const nodeType = random.choice(config.nodeTypes);
    const position = generateNodePosition(i, config, random);

    const node: Node = {
      id: `node-${i}`,
      label: generateNodeLabel(nodeType, i, random),
      x: position.x,
      y: position.y,
      size: random.range(3, 12),
      color: random.choice(nodeColors),
      type: nodeType,
      weight: random.range(0.1, 1.0)
    };

    nodes.push(node);
  }

  return nodes;
}

/**
 * Generate realistic node position based on spatial distribution
 */
function generateNodePosition(
  index: number,
  config: Required<DatasetConfig>,
  random: SeededRandom
): { x: number; y: number } {
  const width = 2000;
  const height = 1500;

  switch (config.spatialDistribution) {
    case 'uniform':
      return {
        x: random.range(-width / 2, width / 2),
        y: random.range(-height / 2, height / 2)
      };

    case 'grid':
      const cols = Math.ceil(Math.sqrt(config.nodeCount));
      const spacing = width / cols;
      const row = Math.floor(index / cols);
      const col = index % cols;
      return {
        x: (col - cols / 2) * spacing + random.range(-spacing / 4, spacing / 4),
        y: (row - cols / 2) * spacing + random.range(-spacing / 4, spacing / 4)
      };

    case 'circular':
      const radius = Math.min(width, height) / 3;
      const angle = (index / config.nodeCount) * 2 * Math.PI;
      const r = radius * Math.sqrt(random.next());
      return {
        x: r * Math.cos(angle) + random.range(-50, 50),
        y: r * Math.sin(angle) + random.range(-50, 50)
      };

    case 'clustered':
    default:
      const clusters = Math.min(8, Math.max(3, Math.floor(config.nodeCount / 100)));
      const clusterIndex = Math.floor(index / (config.nodeCount / clusters));
      const clusterCenterX = ((clusterIndex % 3) - 1) * width / 3;
      const clusterCenterY = (Math.floor(clusterIndex / 3) - 1) * height / 3;
      return {
        x: clusterCenterX + random.range(-width / 6, width / 6),
        y: clusterCenterY + random.range(-height / 6, height / 6)
      };
  }
}

/**
 * Generate realistic node labels based on type
 */
function generateNodeLabel(nodeType: string, index: number, random: SeededRandom): string {
  const templates = {
    person: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'],
    organization: ['Corp', 'Ltd', 'Inc', 'Group', 'Foundation', 'Institute', 'Systems'],
    concept: ['Innovation', 'Strategy', 'Growth', 'Efficiency', 'Quality', 'Research'],
    document: ['Report', 'Analysis', 'Study', 'Proposal', 'Guidelines', 'Manual']
  };

  const names = templates[nodeType as keyof typeof templates] || ['Node'];
  const baseName = random.choice(names);

  switch (nodeType) {
    case 'person':
      return `${baseName} ${String.fromCharCode(65 + (index % 26))}`;
    case 'organization':
      return `${baseName} ${Math.floor(index / 10) + 1}`;
    case 'concept':
      return `${baseName} ${random.choice(['Alpha', 'Beta', 'Gamma', 'Delta'])}`;
    default:
      return `${baseName} ${index.toString().padStart(3, '0')}`;
  }
}

/**
 * Generate edges based on network structure
 */
function generateEdges(
  nodes: Node[],
  config: Required<DatasetConfig>,
  random: SeededRandom
): Edge[] {
  switch (config.structure) {
    case 'random':
      return generateRandomEdges(nodes, config, random);
    case 'clustered':
      return generateClusteredEdges(nodes, config, random);
    case 'hierarchical':
      return generateHierarchicalEdges(nodes, config, random);
    case 'small-world':
      return generateSmallWorldEdges(nodes, config, random);
    case 'scale-free':
    default:
      return generateScaleFreeEdges(nodes, config, random);
  }
}

/**
 * Generate random edges with uniform distribution
 */
function generateRandomEdges(
  nodes: Node[],
  config: Required<DatasetConfig>,
  random: SeededRandom
): Edge[] {
  const edges: Edge[] = [];
  const targetEdgeCount = Math.floor(nodes.length * nodes.length * config.edgeDensity);
  const edgeSet = new Set<string>();

  while (edges.length < targetEdgeCount) {
    const sourceIndex = random.integer(0, nodes.length - 1);
    const targetIndex = random.integer(0, nodes.length - 1);

    if (sourceIndex === targetIndex) continue;

    const edgeKey = `${Math.min(sourceIndex, targetIndex)}-${Math.max(sourceIndex, targetIndex)}`;
    if (edgeSet.has(edgeKey)) continue;

    edgeSet.add(edgeKey);
    edges.push(createEdge(nodes[sourceIndex], nodes[targetIndex], edges.length, random));
  }

  return edges;
}

/**
 * Generate scale-free network edges (preferential attachment)
 */
function generateScaleFreeEdges(
  nodes: Node[],
  config: Required<DatasetConfig>,
  random: SeededRandom
): Edge[] {
  const edges: Edge[] = [];
  const degrees = new Map<string, number>();
  const targetEdgeCount = Math.floor(nodes.length * nodes.length * config.edgeDensity);

  // Initialize degrees
  nodes.forEach(node => degrees.set(node.id, 0));

  // Start with a small connected component
  const initialSize = Math.min(5, nodes.length);
  for (let i = 1; i < initialSize; i++) {
    edges.push(createEdge(nodes[0], nodes[i], edges.length, random));
    degrees.set(nodes[0].id, degrees.get(nodes[0].id)! + 1);
    degrees.set(nodes[i].id, degrees.get(nodes[i].id)! + 1);
  }

  // Add remaining nodes with preferential attachment
  for (let i = initialSize; i < nodes.length && edges.length < targetEdgeCount; i++) {
    const newNode = nodes[i];
    const attachmentCount = Math.min(3, random.integer(1, 4));

    for (let j = 0; j < attachmentCount && edges.length < targetEdgeCount; j++) {
      const target = selectByPreferentialAttachment(nodes.slice(0, i), degrees, random);
      if (target && target.id !== newNode.id) {
        edges.push(createEdge(newNode, target, edges.length, random));
        degrees.set(newNode.id, degrees.get(newNode.id)! + 1);
        degrees.set(target.id, degrees.get(target.id)! + 1);
      }
    }
  }

  return edges;
}

/**
 * Generate clustered network with high intra-cluster connectivity
 */
function generateClusteredEdges(
  nodes: Node[],
  config: Required<DatasetConfig>,
  random: SeededRandom
): Edge[] {
  const edges: Edge[] = [];
  const clusters = Math.min(8, Math.max(3, Math.floor(nodes.length / 50)));
  const clusterSize = Math.floor(nodes.length / clusters);

  const targetEdgeCount = Math.floor(nodes.length * nodes.length * config.edgeDensity);
  const intraClusterProbability = 0.8; // 80% of edges within clusters

  for (let cluster = 0; cluster < clusters && edges.length < targetEdgeCount; cluster++) {
    const clusterStart = cluster * clusterSize;
    const clusterEnd = Math.min((cluster + 1) * clusterSize, nodes.length);
    const clusterNodes = nodes.slice(clusterStart, clusterEnd);

    // Generate intra-cluster edges
    const clusterEdgeCount = Math.floor(
      (targetEdgeCount / clusters) * intraClusterProbability
    );

    for (let e = 0; e < clusterEdgeCount && edges.length < targetEdgeCount; e++) {
      const source = random.choice(clusterNodes);
      const target = random.choice(clusterNodes);

      if (source.id !== target.id) {
        edges.push(createEdge(source, target, edges.length, random));
      }
    }
  }

  // Add inter-cluster edges
  const remainingEdges = targetEdgeCount - edges.length;
  for (let e = 0; e < remainingEdges; e++) {
    const source = random.choice(nodes);
    const target = random.choice(nodes);

    if (source.id !== target.id) {
      edges.push(createEdge(source, target, edges.length, random));
    }
  }

  return edges;
}

/**
 * Generate hierarchical tree-like structure
 */
function generateHierarchicalEdges(
  nodes: Node[],
  config: Required<DatasetConfig>,
  random: SeededRandom
): Edge[] {
  const edges: Edge[] = [];
  const branchingFactor = random.integer(2, 4);

  // Build tree structure
  let parentIndex = 0;
  for (let i = 1; i < nodes.length; i++) {
    if (i % branchingFactor === 1 && i > branchingFactor) {
      parentIndex++;
    }

    if (parentIndex < nodes.length) {
      edges.push(createEdge(nodes[parentIndex], nodes[i], edges.length, random));
    }
  }

  // Add some cross-links to make it more interesting
  const targetEdgeCount = Math.floor(nodes.length * nodes.length * config.edgeDensity);
  const additionalEdges = targetEdgeCount - edges.length;

  for (let e = 0; e < additionalEdges; e++) {
    const source = random.choice(nodes);
    const target = random.choice(nodes);

    if (source.id !== target.id) {
      edges.push(createEdge(source, target, edges.length, random));
    }
  }

  return edges;
}

/**
 * Generate small-world network (Watts-Strogatz model)
 */
function generateSmallWorldEdges(
  nodes: Node[],
  config: Required<DatasetConfig>,
  random: SeededRandom
): Edge[] {
  const edges: Edge[] = [];
  const k = Math.max(4, Math.floor(nodes.length * config.edgeDensity * 2));
  const beta = 0.3; // Rewiring probability

  // Start with ring lattice
  for (let i = 0; i < nodes.length; i++) {
    for (let j = 1; j <= k / 2; j++) {
      const target = (i + j) % nodes.length;
      edges.push(createEdge(nodes[i], nodes[target], edges.length, random));
    }
  }

  // Rewire edges with probability beta
  const edgesToRewire = [...edges];
  edgesToRewire.forEach((edge, index) => {
    if (random.boolean(beta)) {
      const newTarget = random.choice(nodes);
      if (newTarget.id !== edge.source) {
        edges[index] = createEdge(
          nodes.find(n => n.id === edge.source)!,
          newTarget,
          index,
          random
        );
      }
    }
  });

  return edges;
}

/**
 * Select node by preferential attachment (probability proportional to degree)
 */
function selectByPreferentialAttachment(
  nodes: Node[],
  degrees: Map<string, number>,
  random: SeededRandom
): Node | null {
  const totalDegree = Array.from(degrees.values()).reduce((sum, degree) => sum + degree + 1, 0);
  let target = random.range(0, totalDegree);

  for (const node of nodes) {
    const degree = degrees.get(node.id) || 0;
    target -= (degree + 1);
    if (target <= 0) {
      return node;
    }
  }

  return nodes[0]; // Fallback
}

/**
 * Create an edge with realistic properties
 */
function createEdge(source: Node, target: Node, index: number, random: SeededRandom): Edge {
  const edgeTypes = ['collaboration', 'communication', 'dependency', 'similarity'];
  const edgeColors = ['#666666', '#888888', '#aaaaaa'];

  return {
    id: `edge-${index}`,
    source: source.id,
    target: target.id,
    weight: random.range(0.1, 1.0),
    type: random.choice(edgeTypes),
    color: random.choice(edgeColors)
  };
}

/**
 * Generate performance benchmark datasets for different scales
 */
export function generateBenchmarkDatasets(): Record<string, GraphDataset> {
  const scales = [100, 500, 1000, 2500, 5000, 10000, 15000, 20000];
  const datasets: Record<string, GraphDataset> = {};

  scales.forEach(scale => {
    datasets[`scale-${scale}`] = generatePerformanceDataset({
      nodeCount: scale,
      structure: 'scale-free',
      spatialDistribution: 'clustered',
      seed: 12345 // Fixed seed for reproducible benchmarks
    });
  });

  return datasets;
}

/**
 * Generate datasets for different network structures
 */
export function generateStructureDatasets(nodeCount: number = 1000): Record<string, GraphDataset> {
  const structures: Array<Required<DatasetConfig>['structure']> = [
    'random', 'clustered', 'hierarchical', 'scale-free', 'small-world'
  ];

  const datasets: Record<string, GraphDataset> = {};

  structures.forEach(structure => {
    datasets[structure] = generatePerformanceDataset({
      nodeCount,
      structure,
      spatialDistribution: 'clustered',
      seed: 12345
    });
  });

  return datasets;
}

/**
 * Generate a minimal test dataset for quick testing
 */
export function generateTestDataset(): GraphDataset {
  return generatePerformanceDataset({
    nodeCount: 50,
    structure: 'scale-free',
    spatialDistribution: 'uniform',
    seed: 12345
  });
}

/**
 * Validate dataset quality and structure
 */
export function validateDataset(dataset: GraphDataset): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check node count
  if (dataset.nodes.length === 0) {
    issues.push('Dataset contains no nodes');
  }

  // Check edge validity
  const nodeIds = new Set(dataset.nodes.map(n => n.id));
  const invalidEdges = dataset.edges.filter(
    e => !nodeIds.has(e.source) || !nodeIds.has(e.target)
  );

  if (invalidEdges.length > 0) {
    issues.push(`Found ${invalidEdges.length} edges referencing non-existent nodes`);
  }

  // Check performance characteristics
  if (dataset.metadata.nodeCount > 10000 && dataset.metadata.density > 0.01) {
    recommendations.push('High density with many nodes may impact performance');
  }

  // Check spatial distribution
  const positions = dataset.nodes.filter(n => n.x !== undefined && n.y !== undefined);
  if (positions.length === 0) {
    recommendations.push('Nodes have no spatial coordinates for layout');
  }

  return {
    isValid: issues.length === 0,
    issues,
    recommendations
  };
}