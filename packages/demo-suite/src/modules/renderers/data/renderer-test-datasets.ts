/**
 * Renderer Test Datasets
 *
 * Provides optimized test datasets specifically designed to compare renderer performance
 * and quality across SVG, Canvas, and WebGL engines with varying complexity levels.
 */

import type { GraphDataset } from '../components/SplitViewRenderer.js';

/**
 * Color palettes for consistent theming across datasets
 */
const colorPalettes = {
  xbox: {
    primary: '#107c10',
    secondary: '#00bcf2',
    accent: '#ffb900',
    success: '#4CAF50',
    warning: '#FF8C00',
    danger: '#e81123',
    neutral: '#6c757d'
  },
  neon: {
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    yellow: '#FFFF00',
    lime: '#00FF00',
    orange: '#FF8000',
    purple: '#8000FF',
    pink: '#FF0080'
  },
  gradient: {
    blue: '#1e3c72',
    teal: '#2a5298',
    green: '#00b4db',
    lime: '#0083b0',
    orange: '#FF6B6B',
    red: '#FF8E53',
    purple: '#4ECDC4'
  }
};

/**
 * Generates node positions using various layout algorithms
 */
class LayoutGenerator {
  /**
   * Circular layout - nodes arranged in concentric circles
   */
  static circular(nodeCount: number, centerX = 400, centerY = 300): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const layers = Math.ceil(Math.sqrt(nodeCount / Math.PI));
    let nodeIndex = 0;

    for (let layer = 0; layer < layers && nodeIndex < nodeCount; layer++) {
      const radius = 50 + layer * 60;
      const nodesInLayer = layer === 0 ? 1 : Math.floor(2 * Math.PI * radius / 50);
      const actualNodes = Math.min(nodesInLayer, nodeCount - nodeIndex);

      for (let i = 0; i < actualNodes; i++) {
        const angle = (i / actualNodes) * 2 * Math.PI;
        positions.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        });
        nodeIndex++;
      }
    }

    return positions;
  }

  /**
   * Grid layout - nodes arranged in a regular grid
   */
  static grid(nodeCount: number, spacing = 80, startX = 100, startY = 100): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const cols = Math.ceil(Math.sqrt(nodeCount));

    for (let i = 0; i < nodeCount; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      positions.push({
        x: startX + col * spacing,
        y: startY + row * spacing
      });
    }

    return positions;
  }

  /**
   * Force-directed layout simulation for organic positioning
   */
  static forceDirected(nodeCount: number, width = 800, height = 600): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];

    // Simple force-directed simulation
    for (let i = 0; i < nodeCount; i++) {
      positions.push({
        x: Math.random() * width,
        y: Math.random() * height
      });
    }

    // Run simulation steps
    for (let step = 0; step < 100; step++) {
      for (let i = 0; i < positions.length; i++) {
        let fx = 0, fy = 0;

        // Repulsion from other nodes
        for (let j = 0; j < positions.length; j++) {
          if (i !== j) {
            const dx = positions[i].x - positions[j].x;
            const dy = positions[i].y - positions[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (distance * distance);
            fx += (dx / distance) * force;
            fy += (dy / distance) * force;
          }
        }

        // Attraction to center
        const centerX = width / 2;
        const centerY = height / 2;
        const toCenterX = centerX - positions[i].x;
        const toCenterY = centerY - positions[i].y;
        fx += toCenterX * 0.01;
        fy += toCenterY * 0.01;

        // Apply forces
        positions[i].x += fx * 0.1;
        positions[i].y += fy * 0.1;

        // Keep in bounds
        positions[i].x = Math.max(50, Math.min(width - 50, positions[i].x));
        positions[i].y = Math.max(50, Math.min(height - 50, positions[i].y));
      }
    }

    return positions;
  }

  /**
   * Hierarchical tree layout
   */
  static hierarchical(nodeCount: number, levels = 4, width = 800): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const levelHeight = 100;
    let nodeIndex = 0;

    for (let level = 0; level < levels && nodeIndex < nodeCount; level++) {
      const nodesInLevel = Math.ceil(Math.pow(2, level));
      const actualNodes = Math.min(nodesInLevel, nodeCount - nodeIndex);
      const spacing = width / (actualNodes + 1);

      for (let i = 0; i < actualNodes; i++) {
        positions.push({
          x: spacing * (i + 1),
          y: 100 + level * levelHeight
        });
        nodeIndex++;
      }
    }

    return positions;
  }

  /**
   * Clustered layout - nodes grouped into distinct clusters
   */
  static clustered(nodeCount: number, clusterCount = 5, width = 800, height = 600): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    const nodesPerCluster = Math.floor(nodeCount / clusterCount);
    const clusterRadius = 80;

    for (let cluster = 0; cluster < clusterCount; cluster++) {
      const clusterX = (cluster + 1) * (width / (clusterCount + 1));
      const clusterY = height / 2 + (cluster % 2 === 0 ? -100 : 100);

      const actualNodes = cluster === clusterCount - 1
        ? nodeCount - (cluster * nodesPerCluster)  // Last cluster gets remaining nodes
        : nodesPerCluster;

      for (let i = 0; i < actualNodes; i++) {
        const angle = (i / actualNodes) * 2 * Math.PI;
        const distance = Math.random() * clusterRadius;
        positions.push({
          x: clusterX + Math.cos(angle) * distance,
          y: clusterY + Math.sin(angle) * distance
        });
      }
    }

    return positions;
  }
}

/**
 * Edge generation utilities for creating various connectivity patterns
 */
class EdgeGenerator {
  /**
   * Random edges with specified density
   */
  static random(nodeCount: number, density = 0.1): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];
    const targetEdgeCount = Math.floor(nodeCount * (nodeCount - 1) * density / 2);

    const possibleEdges: Array<{ source: number; target: number }> = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        possibleEdges.push({ source: i, target: j });
      }
    }

    // Shuffle and take first targetEdgeCount edges
    for (let i = possibleEdges.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [possibleEdges[i], possibleEdges[j]] = [possibleEdges[j], possibleEdges[i]];
    }

    return possibleEdges.slice(0, targetEdgeCount).map(edge => ({
      source: `node-${edge.source}`,
      target: `node-${edge.target}`
    }));
  }

  /**
   * Small-world network (high clustering, short path lengths)
   */
  static smallWorld(nodeCount: number, nearestNeighbors = 4, rewireProb = 0.1): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];

    // Start with ring lattice
    for (let i = 0; i < nodeCount; i++) {
      for (let j = 1; j <= nearestNeighbors / 2; j++) {
        const target = (i + j) % nodeCount;
        edges.push({
          source: `node-${i}`,
          target: `node-${target}`
        });
      }
    }

    // Rewire edges with probability
    const rewiredEdges = edges.map(edge => {
      if (Math.random() < rewireProb) {
        const sourceIndex = parseInt(edge.source.split('-')[1]);
        let newTarget;
        do {
          newTarget = Math.floor(Math.random() * nodeCount);
        } while (newTarget === sourceIndex);

        return {
          source: edge.source,
          target: `node-${newTarget}`
        };
      }
      return edge;
    });

    return rewiredEdges;
  }

  /**
   * Scale-free network (power-law degree distribution)
   */
  static scaleFree(nodeCount: number, initialNodes = 3, edgesPerNode = 2): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];
    const degrees: Map<string, number> = new Map();

    // Initialize with complete graph of initial nodes
    for (let i = 0; i < initialNodes; i++) {
      degrees.set(`node-${i}`, 0);
    }

    for (let i = 0; i < initialNodes; i++) {
      for (let j = i + 1; j < initialNodes; j++) {
        edges.push({
          source: `node-${i}`,
          target: `node-${j}`
        });
        degrees.set(`node-${i}`, degrees.get(`node-${i}`)! + 1);
        degrees.set(`node-${j}`, degrees.get(`node-${j}`)! + 1);
      }
    }

    // Add remaining nodes with preferential attachment
    for (let i = initialNodes; i < nodeCount; i++) {
      const newNode = `node-${i}`;
      degrees.set(newNode, 0);

      const totalDegree = Array.from(degrees.values()).reduce((a, b) => a + b, 0);
      const candidates = Array.from(degrees.keys()).filter(node => node !== newNode);

      for (let j = 0; j < Math.min(edgesPerNode, candidates.length); j++) {
        // Preferential attachment - higher degree nodes more likely to be selected
        let targetNode: string;
        do {
          const randomValue = Math.random() * totalDegree;
          let cumulativeDegree = 0;

          for (const candidate of candidates) {
            cumulativeDegree += degrees.get(candidate)! || 1;
            if (cumulativeDegree >= randomValue) {
              targetNode = candidate;
              break;
            }
          }
        } while (!targetNode! || edges.some(e =>
          (e.source === newNode && e.target === targetNode) ||
          (e.source === targetNode && e.target === newNode)
        ));

        edges.push({
          source: newNode,
          target: targetNode!
        });

        degrees.set(newNode, degrees.get(newNode)! + 1);
        degrees.set(targetNode!, degrees.get(targetNode!)! + 1);
      }
    }

    return edges;
  }

  /**
   * Tree structure (hierarchical, no cycles)
   */
  static tree(nodeCount: number, branchingFactor = 3): Array<{ source: string; target: string }> {
    const edges: Array<{ source: string; target: string }> = [];
    let nodeIndex = 1; // Start from 1, as 0 is root

    const queue = [0]; // Nodes to process

    while (queue.length > 0 && nodeIndex < nodeCount) {
      const parentIndex = queue.shift()!;

      // Add children
      for (let i = 0; i < branchingFactor && nodeIndex < nodeCount; i++) {
        edges.push({
          source: `node-${parentIndex}`,
          target: `node-${nodeIndex}`
        });
        queue.push(nodeIndex);
        nodeIndex++;
      }
    }

    return edges;
  }
}

/**
 * Creates all available renderer test datasets
 */
export function createRendererTestDatasets(): Record<string, GraphDataset> {
  const datasets: Record<string, GraphDataset> = {};

  // Small Network (50 nodes) - Good for detailed quality comparison
  datasets['small-network'] = createSmallNetwork();

  // Medium Network (200 nodes) - Balanced performance testing
  datasets['medium-network'] = createMediumNetwork();

  // Large Network (1000 nodes) - Performance stress testing
  datasets['large-network'] = createLargeNetwork();

  // Dense Network (500 nodes, high connectivity) - Edge rendering stress test
  datasets['dense-network'] = createDenseNetwork();

  // Hierarchical Tree (300 nodes) - Layout and depth testing
  datasets['hierarchical'] = createHierarchicalNetwork();

  // Clustered Network (400 nodes) - Clustered layout testing
  datasets['clustered'] = createClusteredNetwork();

  // Performance Benchmark - Specifically designed for performance testing
  datasets['performance-benchmark'] = createPerformanceBenchmark();

  // Quality Assessment - Designed for visual quality testing
  datasets['quality-assessment'] = createQualityAssessment();

  return datasets;
}

/**
 * Small network for detailed visual quality comparison
 */
function createSmallNetwork(): GraphDataset {
  const nodeCount = 50;
  const positions = LayoutGenerator.circular(nodeCount, 400, 300);
  const edges = EdgeGenerator.smallWorld(nodeCount, 6, 0.2);

  const nodes = positions.map((pos, index) => ({
    id: `node-${index}`,
    x: pos.x,
    y: pos.y,
    radius: 8 + Math.random() * 4,
    color: Object.values(colorPalettes.xbox)[index % Object.values(colorPalettes.xbox).length],
    label: `N${index + 1}`
  }));

  const styledEdges = edges.map(edge => ({
    ...edge,
    color: '#666666',
    width: 1 + Math.random() * 2
  }));

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Small Network',
      description: 'Small network optimized for visual quality comparison and detailed analysis',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'low'
    }
  };
}

/**
 * Medium network for balanced performance and quality testing
 */
function createMediumNetwork(): GraphDataset {
  const nodeCount = 200;
  const positions = LayoutGenerator.forceDirected(nodeCount, 800, 600);
  const edges = EdgeGenerator.scaleFree(nodeCount, 5, 3);

  const nodes = positions.map((pos, index) => ({
    id: `node-${index}`,
    x: pos.x,
    y: pos.y,
    radius: 6 + Math.random() * 3,
    color: Object.values(colorPalettes.gradient)[index % Object.values(colorPalettes.gradient).length],
    label: `Node ${index + 1}`
  }));

  const styledEdges = edges.map((edge, index) => ({
    ...edge,
    color: index % 3 === 0 ? colorPalettes.xbox.primary : '#555555',
    width: 1 + (index % 2)
  }));

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Medium Network',
      description: 'Balanced network for comprehensive renderer comparison',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'medium'
    }
  };
}

/**
 * Large network for performance stress testing
 */
function createLargeNetwork(): GraphDataset {
  const nodeCount = 1000;
  const positions = LayoutGenerator.grid(nodeCount, 60, 50, 50);
  const edges = EdgeGenerator.random(nodeCount, 0.05);

  const nodes = positions.map((pos, index) => ({
    id: `node-${index}`,
    x: pos.x,
    y: pos.y,
    radius: 4 + Math.random() * 2,
    color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
    label: `${index}`
  }));

  const styledEdges = edges.map(edge => ({
    ...edge,
    color: '#444444',
    width: 0.5 + Math.random() * 1
  }));

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Large Network',
      description: 'Large-scale network for performance benchmarking and scalability testing',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'high'
    }
  };
}

/**
 * Dense network with high edge connectivity for rendering stress testing
 */
function createDenseNetwork(): GraphDataset {
  const nodeCount = 500;
  const positions = LayoutGenerator.circular(nodeCount, 400, 300);
  const edges = EdgeGenerator.random(nodeCount, 0.15); // High density

  const nodes = positions.map((pos, index) => ({
    id: `node-${index}`,
    x: pos.x,
    y: pos.y,
    radius: 5 + Math.random() * 3,
    color: Object.values(colorPalettes.neon)[index % Object.values(colorPalettes.neon).length],
    label: `Dense-${index}`
  }));

  const styledEdges = edges.map((edge, index) => ({
    ...edge,
    color: `rgba(${100 + (index % 155)}, ${100 + ((index * 7) % 155)}, ${100 + ((index * 13) % 155)}, 0.6)`,
    width: 0.5 + (index % 3) * 0.5
  }));

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Dense Network',
      description: 'High-connectivity network designed to stress test edge rendering performance',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'high'
    }
  };
}

/**
 * Hierarchical tree structure for layout testing
 */
function createHierarchicalNetwork(): GraphDataset {
  const nodeCount = 300;
  const positions = LayoutGenerator.hierarchical(nodeCount, 6, 800);
  const edges = EdgeGenerator.tree(nodeCount, 4);

  const nodes = positions.map((pos, index) => {
    const level = Math.floor(pos.y / 100);
    return {
      id: `node-${index}`,
      x: pos.x,
      y: pos.y,
      radius: 8 - level * 0.5,
      color: Object.values(colorPalettes.gradient)[level % Object.values(colorPalettes.gradient).length],
      label: `L${level}-${index}`
    };
  });

  const styledEdges = edges.map(edge => ({
    ...edge,
    color: colorPalettes.xbox.primary,
    width: 2
  }));

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Hierarchical Tree',
      description: 'Tree-structured network for testing hierarchical layouts and depth rendering',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'medium'
    }
  };
}

/**
 * Clustered network for cluster detection and rendering
 */
function createClusteredNetwork(): GraphDataset {
  const nodeCount = 400;
  const positions = LayoutGenerator.clustered(nodeCount, 6, 1000, 600);

  // Create edges within clusters and some inter-cluster connections
  const edges: Array<{ source: string; target: string }> = [];
  const clusterSize = Math.floor(nodeCount / 6);

  // Intra-cluster edges
  for (let cluster = 0; cluster < 6; cluster++) {
    const clusterStart = cluster * clusterSize;
    const clusterEnd = cluster === 5 ? nodeCount : clusterStart + clusterSize;

    for (let i = clusterStart; i < clusterEnd; i++) {
      for (let j = i + 1; j < clusterEnd; j++) {
        if (Math.random() < 0.3) { // 30% connectivity within cluster
          edges.push({
            source: `node-${i}`,
            target: `node-${j}`
          });
        }
      }
    }
  }

  // Inter-cluster edges
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const clusterI = Math.floor(i / clusterSize);
      const clusterJ = Math.floor(j / clusterSize);

      if (clusterI !== clusterJ && Math.random() < 0.02) { // 2% inter-cluster connectivity
        edges.push({
          source: `node-${i}`,
          target: `node-${j}`
        });
      }
    }
  }

  const nodes = positions.map((pos, index) => {
    const cluster = Math.min(5, Math.floor(index / clusterSize));
    return {
      id: `node-${index}`,
      x: pos.x,
      y: pos.y,
      radius: 6 + Math.random() * 2,
      color: Object.values(colorPalettes.neon)[cluster],
      label: `C${cluster}-${index % clusterSize}`
    };
  });

  const styledEdges = edges.map((edge, index) => {
    const sourceIndex = parseInt(edge.source.split('-')[1]);
    const targetIndex = parseInt(edge.target.split('-')[1]);
    const sourceCluster = Math.min(5, Math.floor(sourceIndex / clusterSize));
    const targetCluster = Math.min(5, Math.floor(targetIndex / clusterSize));

    return {
      ...edge,
      color: sourceCluster === targetCluster ? '#888888' : colorPalettes.xbox.secondary,
      width: sourceCluster === targetCluster ? 1 : 2
    };
  });

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Clustered Network',
      description: 'Multi-cluster network for testing cluster visualization and community detection',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'medium'
    }
  };
}

/**
 * Specialized dataset for performance benchmarking
 */
function createPerformanceBenchmark(): GraphDataset {
  const nodeCount = 750;
  const positions = LayoutGenerator.forceDirected(nodeCount, 1200, 800);
  const edges = EdgeGenerator.scaleFree(nodeCount, 8, 4);

  const nodes = positions.map((pos, index) => ({
    id: `perf-node-${index}`,
    x: pos.x,
    y: pos.y,
    radius: 3 + (index % 5),
    color: `hsl(${(index * 50) % 360}, 80%, 60%)`,
    label: `P${index}`
  }));

  const styledEdges = edges.map((edge, index) => ({
    ...edge,
    color: `rgba(${(index * 37) % 255}, ${(index * 73) % 255}, ${(index * 109) % 255}, 0.7)`,
    width: 0.5 + (index % 4) * 0.25
  }));

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Performance Benchmark',
      description: 'Optimized dataset for comprehensive renderer performance benchmarking',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'high'
    }
  };
}

/**
 * Specialized dataset for visual quality assessment
 */
function createQualityAssessment(): GraphDataset {
  const nodeCount = 100;
  const positions = LayoutGenerator.circular(nodeCount, 400, 300);
  const edges = EdgeGenerator.smallWorld(nodeCount, 8, 0.15);

  // Create nodes with various visual properties for quality testing
  const nodes = positions.map((pos, index) => {
    const category = index % 4;
    let nodeConfig;

    switch (category) {
      case 0: // Large, solid colors
        nodeConfig = {
          radius: 12,
          color: colorPalettes.xbox.primary
        };
        break;
      case 1: // Medium, gradient-like colors
        nodeConfig = {
          radius: 8,
          color: colorPalettes.neon.cyan
        };
        break;
      case 2: // Small, bright colors
        nodeConfig = {
          radius: 6,
          color: colorPalettes.xbox.accent
        };
        break;
      default: // Tiny, neutral colors
        nodeConfig = {
          radius: 4,
          color: colorPalettes.xbox.secondary
        };
    }

    return {
      id: `quality-node-${index}`,
      x: pos.x,
      y: pos.y,
      radius: nodeConfig.radius,
      color: nodeConfig.color,
      label: `Q${index + 1}`
    };
  });

  // Create edges with varying styles for quality assessment
  const styledEdges = edges.map((edge, index) => {
    const style = index % 3;
    let edgeConfig;

    switch (style) {
      case 0: // Thick, opaque edges
        edgeConfig = {
          width: 3,
          color: colorPalettes.xbox.primary
        };
        break;
      case 1: // Medium, semi-transparent edges
        edgeConfig = {
          width: 2,
          color: 'rgba(0, 188, 242, 0.6)'
        };
        break;
      default: // Thin, subtle edges
        edgeConfig = {
          width: 1,
          color: 'rgba(108, 117, 125, 0.8)'
        };
    }

    return {
      ...edge,
      width: edgeConfig.width,
      color: edgeConfig.color
    };
  });

  return {
    nodes,
    edges: styledEdges,
    metadata: {
      name: 'Quality Assessment',
      description: 'Carefully designed dataset for evaluating visual quality and rendering fidelity',
      nodeCount,
      edgeCount: edges.length,
      complexity: 'low'
    }
  };
}

/**
 * Utility functions for dataset manipulation
 */
export const DatasetUtils = {
  /**
   * Scale dataset to fit specific dimensions
   */
  scaleDataset(dataset: GraphDataset, width: number, height: number, padding = 50): GraphDataset {
    const nodes = dataset.nodes.map(node => ({ ...node }));

    if (nodes.length === 0) return { ...dataset, nodes };

    // Find bounds
    const minX = Math.min(...nodes.map(n => n.x || 0));
    const maxX = Math.max(...nodes.map(n => n.x || 0));
    const minY = Math.min(...nodes.map(n => n.y || 0));
    const maxY = Math.max(...nodes.map(n => n.y || 0));

    const dataWidth = maxX - minX || 1;
    const dataHeight = maxY - minY || 1;

    // Calculate scale factors
    const scaleX = (width - 2 * padding) / dataWidth;
    const scaleY = (height - 2 * padding) / dataHeight;
    const scale = Math.min(scaleX, scaleY);

    // Apply scaling
    nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        node.x = padding + (node.x - minX) * scale;
        node.y = padding + (node.y - minY) * scale;
      }
    });

    return {
      ...dataset,
      nodes
    };
  },

  /**
   * Add animation properties to dataset
   */
  addAnimationProperties(dataset: GraphDataset): GraphDataset {
    const nodes = dataset.nodes.map(node => ({
      ...node,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      fx: undefined, // Fixed position
      fy: undefined
    }));

    return {
      ...dataset,
      nodes
    };
  },

  /**
   * Filter dataset by complexity or size
   */
  filterDataset(dataset: GraphDataset, maxNodes?: number, maxEdges?: number): GraphDataset {
    let nodes = [...dataset.nodes];
    let edges = [...dataset.edges];

    if (maxNodes && nodes.length > maxNodes) {
      nodes = nodes.slice(0, maxNodes);

      // Filter edges to only include nodes that still exist
      const nodeIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    if (maxEdges && edges.length > maxEdges) {
      edges = edges.slice(0, maxEdges);
    }

    return {
      ...dataset,
      nodes,
      edges,
      metadata: {
        ...dataset.metadata,
        nodeCount: nodes.length,
        edgeCount: edges.length
      }
    };
  },

  /**
   * Generate performance test variations
   */
  createPerformanceVariations(baseDataset: GraphDataset): Record<string, GraphDataset> {
    return {
      'minimal': DatasetUtils.filterDataset(baseDataset, 25, 25),
      'light': DatasetUtils.filterDataset(baseDataset, 100, 150),
      'medium': DatasetUtils.filterDataset(baseDataset, 300, 500),
      'heavy': DatasetUtils.filterDataset(baseDataset, 750, 1500),
      'maximum': baseDataset
    };
  }
};