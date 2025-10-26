/**
 * Synthetic graph data generation for different demo scenarios.
 * Provides realistic test data for knowledge network visualizations.
 */

import { random, randomInt, randomChoice, distance, angle } from './utils.js';

export interface Node {
  id: string;
  x: number;
  y: number;
  radius?: number;
  color?: string;
  label?: string;
  category?: string;
  data?: Record<string, any>;
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight?: number;
  color?: string;
  category?: string;
  data?: Record<string, any>;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  metadata?: {
    name: string;
    description: string;
    nodeCount: number;
    edgeCount: number;
    avgDegree: number;
    density: number;
  };
}

export type GraphType =
  | 'random'
  | 'smallWorld'
  | 'scaleFree'
  | 'grid'
  | 'tree'
  | 'cluster'
  | 'knowledge'
  | 'social'
  | 'biological';

/**
 * Configuration options for graph generation.
 */
export interface GraphConfig {
  nodeCount: number;
  width: number;
  height: number;
  seed?: number;

  // Edge generation parameters
  edgeProbability?: number;
  avgDegree?: number;

  // Clustering parameters
  clusterCount?: number;
  clusterRadius?: number;

  // Tree parameters
  branchingFactor?: number;
  maxDepth?: number;

  // Node styling
  nodeRadius?: { min: number; max: number };
  nodeColors?: string[];

  // Categories
  nodeCategories?: string[];
  edgeCategories?: string[];
}

/**
 * Main data generator class for creating synthetic graphs.
 */
export class DataGenerator {
  private rng: () => number;

  constructor(seed?: number) {
    this.rng = this.createSeededRandom(seed);
  }

  /**
   * Generate a graph of the specified type.
   */
  generateGraph(type: GraphType, config: GraphConfig): Graph {
    switch (type) {
      case 'random':
        return this.generateRandomGraph(config);
      case 'smallWorld':
        return this.generateSmallWorldGraph(config);
      case 'scaleFree':
        return this.generateScaleFreeGraph(config);
      case 'grid':
        return this.generateGridGraph(config);
      case 'tree':
        return this.generateTreeGraph(config);
      case 'cluster':
        return this.generateClusteredGraph(config);
      case 'knowledge':
        return this.generateKnowledgeGraph(config);
      case 'social':
        return this.generateSocialGraph(config);
      case 'biological':
        return this.generateBiologicalGraph(config);
      default:
        throw new Error(`Unknown graph type: ${type}`);
    }
  }

  /**
   * Generate a random Erdős-Rényi graph.
   */
  private generateRandomGraph(config: GraphConfig): Graph {
    const nodes = this.generateNodes(config);
    const edges: Edge[] = [];
    const probability = config.edgeProbability || 0.1;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (this.rng() < probability) {
          edges.push({
            id: `edge-${i}-${j}`,
            source: nodes[i].id,
            target: nodes[j].id,
            weight: this.rng()
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Random (Erdős-Rényi)', 'Random graph with uniform edge probability', nodes, edges)
    };
  }

  /**
   * Generate a small-world (Watts-Strogatz) graph.
   */
  private generateSmallWorldGraph(config: GraphConfig): Graph {
    const nodes = this.generateCircularNodes(config);
    const edges: Edge[] = [];
    const k = Math.max(2, Math.floor((config.avgDegree || 4) / 2) * 2); // Ensure even number
    const beta = 0.3; // Rewiring probability

    // Create initial ring lattice
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 1; j <= k / 2; j++) {
        const target = (i + j) % nodes.length;

        // Rewire with probability beta
        let finalTarget = target;
        if (this.rng() < beta) {
          do {
            finalTarget = Math.floor(this.rng() * nodes.length);
          } while (finalTarget === i || edges.some(e =>
            (e.source === nodes[i].id && e.target === nodes[finalTarget].id) ||
            (e.target === nodes[i].id && e.source === nodes[finalTarget].id)
          ));
        }

        edges.push({
          id: `edge-${i}-${finalTarget}`,
          source: nodes[i].id,
          target: nodes[finalTarget].id,
          weight: this.rng()
        });
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Small World (Watts-Strogatz)', 'High clustering with short path lengths', nodes, edges)
    };
  }

  /**
   * Generate a scale-free (Barabási-Albert) graph.
   */
  private generateScaleFreeGraph(config: GraphConfig): Graph {
    const nodes = this.generateNodes(config);
    const edges: Edge[] = [];
    const m = Math.max(1, Math.floor(config.avgDegree || 3)); // Edges to add per new node

    // Start with a small connected core
    const coreSize = Math.min(m + 1, nodes.length);
    for (let i = 0; i < coreSize; i++) {
      for (let j = i + 1; j < coreSize; j++) {
        edges.push({
          id: `edge-${i}-${j}`,
          source: nodes[i].id,
          target: nodes[j].id,
          weight: this.rng()
        });
      }
    }

    // Add remaining nodes with preferential attachment
    for (let i = coreSize; i < nodes.length; i++) {
      const degrees = new Map<string, number>();

      // Count degrees
      for (const edge of edges) {
        degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
        degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
      }

      // Calculate attachment probabilities
      const totalDegree = Array.from(degrees.values()).reduce((sum, deg) => sum + deg, 0);
      const targets = new Set<number>();

      // Select m targets based on degree
      while (targets.size < Math.min(m, i)) {
        for (let j = 0; j < i && targets.size < m; j++) {
          const nodeId = nodes[j].id;
          const degree = degrees.get(nodeId) || 1;
          const probability = totalDegree > 0 ? degree / totalDegree : 1 / i;

          if (this.rng() < probability && !targets.has(j)) {
            targets.add(j);
          }
        }
      }

      // Add edges
      for (const target of targets) {
        edges.push({
          id: `edge-${i}-${target}`,
          source: nodes[i].id,
          target: nodes[target].id,
          weight: this.rng()
        });
      }
    }

    // Update node sizes based on degree (visual representation of scale-free property)
    const degrees = new Map<string, number>();
    for (const edge of edges) {
      degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
      degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
    }

    const maxDegree = Math.max(...Array.from(degrees.values()));
    for (const node of nodes) {
      const degree = degrees.get(node.id) || 0;
      node.radius = 5 + (degree / maxDegree) * 15; // Scale radius by degree
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Scale-Free (Barabási-Albert)', 'Power-law degree distribution with hubs', nodes, edges)
    };
  }

  /**
   * Generate a grid graph.
   */
  private generateGridGraph(config: GraphConfig): Graph {
    const cols = Math.ceil(Math.sqrt(config.nodeCount));
    const rows = Math.ceil(config.nodeCount / cols);
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const cellWidth = config.width / cols;
    const cellHeight = config.height / rows;

    // Create grid nodes
    for (let row = 0; row < rows && nodes.length < config.nodeCount; row++) {
      for (let col = 0; col < cols && nodes.length < config.nodeCount; col++) {
        nodes.push({
          id: `node-${row}-${col}`,
          x: col * cellWidth + cellWidth / 2,
          y: row * cellHeight + cellHeight / 2,
          radius: config.nodeRadius?.min || 5,
          label: `${row},${col}`
        });
      }
    }

    // Create grid connections
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index >= nodes.length) break;

        // Right neighbor
        if (col < cols - 1 && index + 1 < nodes.length) {
          edges.push({
            id: `edge-${index}-${index + 1}`,
            source: nodes[index].id,
            target: nodes[index + 1].id,
            weight: 1
          });
        }

        // Bottom neighbor
        if (row < rows - 1 && index + cols < nodes.length) {
          edges.push({
            id: `edge-${index}-${index + cols}`,
            source: nodes[index].id,
            target: nodes[index + cols].id,
            weight: 1
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Grid', 'Regular lattice structure', nodes, edges)
    };
  }

  /**
   * Generate a tree graph.
   */
  private generateTreeGraph(config: GraphConfig): Graph {
    const branching = config.branchingFactor || 3;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Root node
    nodes.push({
      id: 'root',
      x: config.width / 2,
      y: 50,
      radius: (config.nodeRadius?.max || 10),
      category: 'root',
      label: 'Root'
    });

    let currentLevel = ['root'];
    let nextLevel: string[] = [];
    let level = 1;
    const levelHeight = (config.height - 100) / (config.maxDepth || 5);

    while (nodes.length < config.nodeCount && currentLevel.length > 0) {
      nextLevel = [];

      for (const parentId of currentLevel) {
        const parentNode = nodes.find(n => n.id === parentId)!;
        const childrenCount = Math.min(branching, Math.ceil((config.nodeCount - nodes.length) / currentLevel.length));

        for (let i = 0; i < childrenCount && nodes.length < config.nodeCount; i++) {
          const childId = `${parentId}-${i}`;
          const angleOffset = (i - (childrenCount - 1) / 2) * (Math.PI / (childrenCount + 1));
          const x = parentNode.x + Math.sin(angleOffset) * (100 + level * 50);
          const y = parentNode.y + levelHeight;

          nodes.push({
            id: childId,
            x: Math.max(50, Math.min(config.width - 50, x)),
            y,
            radius: Math.max(3, (config.nodeRadius?.max || 10) - level),
            category: `level-${level}`,
            label: `L${level}-${i}`
          });

          edges.push({
            id: `edge-${parentId}-${childId}`,
            source: parentId,
            target: childId,
            weight: 1,
            category: 'hierarchy'
          });

          nextLevel.push(childId);
        }
      }

      currentLevel = nextLevel;
      level++;
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Tree', 'Hierarchical structure with no cycles', nodes, edges)
    };
  }

  /**
   * Generate a clustered graph with multiple communities.
   */
  private generateClusteredGraph(config: GraphConfig): Graph {
    const clusterCount = config.clusterCount || Math.max(2, Math.floor(config.nodeCount / 20));
    const nodesPerCluster = Math.floor(config.nodeCount / clusterCount);
    const clusterRadius = config.clusterRadius || Math.min(config.width, config.height) / (2 * Math.sqrt(clusterCount));

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const colors = config.nodeColors || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];

    // Generate clusters
    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const clusterColor = colors[cluster % colors.length];
      const centerX = (cluster % Math.ceil(Math.sqrt(clusterCount))) * (config.width / Math.ceil(Math.sqrt(clusterCount))) + config.width / (2 * Math.ceil(Math.sqrt(clusterCount)));
      const centerY = Math.floor(cluster / Math.ceil(Math.sqrt(clusterCount))) * (config.height / Math.ceil(Math.sqrt(clusterCount))) + config.height / (2 * Math.ceil(Math.sqrt(clusterCount)));

      // Generate nodes in cluster
      const clusterNodes: Node[] = [];
      for (let i = 0; i < nodesPerCluster && nodes.length < config.nodeCount; i++) {
        const angle = (i / nodesPerCluster) * 2 * Math.PI;
        const radius = this.rng() * clusterRadius;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        const node: Node = {
          id: `cluster-${cluster}-node-${i}`,
          x: Math.max(10, Math.min(config.width - 10, x)),
          y: Math.max(10, Math.min(config.height - 10, y)),
          radius: config.nodeRadius?.min || 5,
          color: clusterColor,
          category: `cluster-${cluster}`,
          label: `C${cluster}N${i}`
        };

        nodes.push(node);
        clusterNodes.push(node);
      }

      // Create dense intra-cluster connections
      for (let i = 0; i < clusterNodes.length; i++) {
        for (let j = i + 1; j < clusterNodes.length; j++) {
          if (this.rng() < 0.6) { // High intra-cluster connectivity
            edges.push({
              id: `edge-${clusterNodes[i].id}-${clusterNodes[j].id}`,
              source: clusterNodes[i].id,
              target: clusterNodes[j].id,
              weight: this.rng(),
              category: 'intra-cluster',
              color: clusterColor
            });
          }
        }
      }
    }

    // Add sparse inter-cluster connections
    const clusterSize = Math.floor(config.nodeCount / clusterCount);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeI = nodes[i];
        const nodeJ = nodes[j];

        // Check if nodes are from different clusters
        if (nodeI.category !== nodeJ.category && this.rng() < 0.02) { // Low inter-cluster connectivity
          edges.push({
            id: `edge-${nodeI.id}-${nodeJ.id}`,
            source: nodeI.id,
            target: nodeJ.id,
            weight: this.rng(),
            category: 'inter-cluster',
            color: '#999999'
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Clustered', 'Multiple densely connected communities', nodes, edges)
    };
  }

  /**
   * Generate a knowledge graph with topics and relationships.
   */
  private generateKnowledgeGraph(config: GraphConfig): Graph {
    const topics = [
      'Machine Learning', 'Neural Networks', 'Data Science', 'Algorithms',
      'Computer Vision', 'Natural Language Processing', 'Deep Learning',
      'Statistics', 'Mathematics', 'Programming', 'Software Engineering',
      'Database Systems', 'Web Development', 'Mobile Development'
    ];

    const nodes = this.generateNodes(config);
    const edges: Edge[] = [];

    // Assign topics to nodes
    for (const node of nodes) {
      node.label = randomChoice(topics);
      node.category = 'topic';
      node.color = this.getTopicColor(node.label);
    }

    // Create semantic relationships
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const similarity = this.calculateTopicSimilarity(nodes[i].label!, nodes[j].label!);
        if (similarity > 0.3 && this.rng() < similarity) {
          edges.push({
            id: `edge-${i}-${j}`,
            source: nodes[i].id,
            target: nodes[j].id,
            weight: similarity,
            category: 'semantic-relationship'
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Knowledge Graph', 'Semantic relationships between topics', nodes, edges)
    };
  }

  /**
   * Generate a social network graph.
   */
  private generateSocialGraph(config: GraphConfig): Graph {
    const nodes = this.generateNodes(config);
    const edges: Edge[] = [];

    // Assign social attributes
    const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
    for (const node of nodes) {
      node.label = randomChoice(names) + ` ${Math.floor(this.rng() * 1000)}`;
      node.category = 'person';
    }

    // Create social connections (preferential attachment with clustering)
    const friends = new Map<string, Set<string>>();

    for (let i = 0; i < nodes.length; i++) {
      friends.set(nodes[i].id, new Set());
    }

    // Add friendships
    for (let i = 0; i < nodes.length; i++) {
      const friendCount = Math.min(Math.floor(this.rng() * 10) + 2, nodes.length - 1);
      const nodeId = nodes[i].id;

      for (let j = 0; j < friendCount; j++) {
        let friendId: string;
        let attempts = 0;

        do {
          const friendIndex = Math.floor(this.rng() * nodes.length);
          friendId = nodes[friendIndex].id;
          attempts++;
        } while ((friendId === nodeId || friends.get(nodeId)!.has(friendId)) && attempts < 50);

        if (attempts < 50) {
          friends.get(nodeId)!.add(friendId);
          friends.get(friendId)!.add(nodeId);

          edges.push({
            id: `friendship-${nodeId}-${friendId}`,
            source: nodeId,
            target: friendId,
            weight: this.rng(),
            category: 'friendship'
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Social Network', 'Friendship relationships with clustering', nodes, edges)
    };
  }

  /**
   * Generate a biological network (protein interactions).
   */
  private generateBiologicalGraph(config: GraphConfig): Graph {
    const proteins = [
      'p53', 'BRCA1', 'EGFR', 'TP53', 'KRAS', 'PIK3CA', 'AKT1',
      'PTEN', 'RB1', 'MYC', 'BRAF', 'MDM2', 'CDKN2A'
    ];

    const nodes = this.generateNodes(config);
    const edges: Edge[] = [];

    // Assign protein names
    for (const node of nodes) {
      node.label = randomChoice(proteins) + (Math.floor(this.rng() * 100));
      node.category = 'protein';
      node.color = this.getProteinColor(node.label);
    }

    // Create protein-protein interactions
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const interactionProb = this.calculateProteinInteraction(nodes[i].label!, nodes[j].label!);
        if (this.rng() < interactionProb) {
          edges.push({
            id: `interaction-${i}-${j}`,
            source: nodes[i].id,
            target: nodes[j].id,
            weight: this.rng(),
            category: 'protein-interaction'
          });
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: this.calculateMetadata('Biological Network', 'Protein-protein interaction network', nodes, edges)
    };
  }

  // Helper methods

  private generateNodes(config: GraphConfig): Node[] {
    const nodes: Node[] = [];
    const categories = config.nodeCategories || ['default'];
    const colors = config.nodeColors || ['#4A90E2'];

    for (let i = 0; i < config.nodeCount; i++) {
      nodes.push({
        id: `node-${i}`,
        x: this.rng() * config.width,
        y: this.rng() * config.height,
        radius: config.nodeRadius ?
          config.nodeRadius.min + this.rng() * (config.nodeRadius.max - config.nodeRadius.min) :
          5 + this.rng() * 10,
        color: randomChoice(colors),
        category: randomChoice(categories),
        label: `Node ${i}`
      });
    }

    return nodes;
  }

  private generateCircularNodes(config: GraphConfig): Node[] {
    const nodes: Node[] = [];
    const centerX = config.width / 2;
    const centerY = config.height / 2;
    const radius = Math.min(config.width, config.height) / 2 - 50;

    for (let i = 0; i < config.nodeCount; i++) {
      const angle = (i / config.nodeCount) * 2 * Math.PI;
      nodes.push({
        id: `node-${i}`,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: config.nodeRadius?.min || 5,
        label: `Node ${i}`
      });
    }

    return nodes;
  }

  private calculateMetadata(name: string, description: string, nodes: Node[], edges: Edge[]) {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const avgDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0;
    const maxPossibleEdges = nodeCount * (nodeCount - 1) / 2;
    const density = maxPossibleEdges > 0 ? edgeCount / maxPossibleEdges : 0;

    return {
      name,
      description,
      nodeCount,
      edgeCount,
      avgDegree,
      density
    };
  }

  private getTopicColor(topic: string): string {
    const colors: Record<string, string> = {
      'Machine Learning': '#FF6B6B',
      'Neural Networks': '#4ECDC4',
      'Data Science': '#45B7D1',
      'Algorithms': '#96CEB4',
      'Computer Vision': '#FFEAA7',
      'Natural Language Processing': '#DDA0DD',
      'Deep Learning': '#FF8A80',
      'Statistics': '#81C784',
      'Mathematics': '#64B5F6',
      'Programming': '#FFB74D',
      'Software Engineering': '#F06292',
      'Database Systems': '#A1887F',
      'Web Development': '#90A4AE',
      'Mobile Development': '#CE93D8'
    };
    return colors[topic] || '#999999';
  }

  private getProteinColor(protein: string): string {
    // Color by protein family/function
    if (protein.includes('p53') || protein.includes('TP53')) return '#E57373';
    if (protein.includes('BRCA')) return '#81C784';
    if (protein.includes('EGFR')) return '#64B5F6';
    if (protein.includes('KRAS')) return '#FFB74D';
    if (protein.includes('PIK3CA')) return '#F06292';
    return '#BA68C8';
  }

  private calculateTopicSimilarity(topic1: string, topic2: string): number {
    // Simple similarity based on shared keywords
    const related: Record<string, string[]> = {
      'Machine Learning': ['Neural Networks', 'Deep Learning', 'Data Science', 'Statistics'],
      'Neural Networks': ['Machine Learning', 'Deep Learning', 'Computer Vision'],
      'Data Science': ['Machine Learning', 'Statistics', 'Programming'],
      'Computer Vision': ['Neural Networks', 'Deep Learning', 'Machine Learning'],
      'Natural Language Processing': ['Machine Learning', 'Deep Learning'],
      'Deep Learning': ['Machine Learning', 'Neural Networks', 'Computer Vision'],
      'Programming': ['Software Engineering', 'Web Development', 'Mobile Development'],
      'Software Engineering': ['Programming', 'Database Systems'],
      'Web Development': ['Programming', 'Database Systems'],
      'Mobile Development': ['Programming', 'Software Engineering']
    };

    if (topic1 === topic2) return 1;
    if (related[topic1]?.includes(topic2)) return 0.7;
    if (related[topic2]?.includes(topic1)) return 0.7;
    return 0.1;
  }

  private calculateProteinInteraction(protein1: string, protein2: string): number {
    // Simulate known protein interaction probabilities
    const interactions: Record<string, string[]> = {
      'p53': ['MDM2', 'CDKN2A', 'RB1'],
      'BRCA1': ['p53', 'TP53'],
      'EGFR': ['AKT1', 'PIK3CA'],
      'KRAS': ['BRAF', 'PIK3CA'],
      'PIK3CA': ['AKT1', 'PTEN'],
      'AKT1': ['PTEN', 'MDM2'],
      'PTEN': ['PIK3CA', 'AKT1'],
      'MDM2': ['p53', 'TP53']
    };

    const base1 = protein1.replace(/\d+$/, '');
    const base2 = protein2.replace(/\d+$/, '');

    if (interactions[base1]?.includes(base2) || interactions[base2]?.includes(base1)) {
      return 0.4;
    }
    return 0.05; // Low background interaction
  }

  private createSeededRandom(seed?: number): () => number {
    if (seed === undefined) {
      return Math.random;
    }

    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  /**
   * Generate performance test data with varying complexity.
   */
  static generatePerformanceTestData(nodeCount: number): { small: Graph; medium: Graph; large: Graph } {
    const generator = new DataGenerator(42); // Fixed seed for reproducible results

    const baseConfig: GraphConfig = {
      nodeCount: 0,
      width: 800,
      height: 600,
      avgDegree: 4
    };

    return {
      small: generator.generateGraph('scaleFree', { ...baseConfig, nodeCount: Math.floor(nodeCount * 0.1) }),
      medium: generator.generateGraph('scaleFree', { ...baseConfig, nodeCount: Math.floor(nodeCount * 0.5) }),
      large: generator.generateGraph('scaleFree', { ...baseConfig, nodeCount })
    };
  }

  /**
   * Generate demo scenarios for different use cases.
   */
  static generateDemoScenarios(): Record<string, Graph> {
    const generator = new DataGenerator(123);
    const config: GraphConfig = {
      nodeCount: 50,
      width: 800,
      height: 600,
      avgDegree: 3,
      clusterCount: 4,
      nodeRadius: { min: 5, max: 15 }
    };

    return {
      basic: generator.generateGraph('random', { ...config, nodeCount: 20 }),
      clusters: generator.generateGraph('cluster', config),
      hierarchy: generator.generateGraph('tree', { ...config, branchingFactor: 3, maxDepth: 4 }),
      social: generator.generateGraph('social', config),
      knowledge: generator.generateGraph('knowledge', { ...config, nodeCount: 30 }),
      scaleFree: generator.generateGraph('scaleFree', config)
    };
  }
}