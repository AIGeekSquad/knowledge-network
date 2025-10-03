import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
import type { GraphData, Node } from '@aigeeksquad/knowledge-network';

const container = document.getElementById('graph') as HTMLElement;
let currentGraph: KnowledgeGraph | null = null;

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Example 1: Simple Graph with type-based styling
const simpleGraphData: GraphData = {
  nodes: [
    { id: 'A', label: 'Concept A', type: 'primary' },
    { id: 'B', label: 'Concept B', type: 'secondary' },
    { id: 'C', label: 'Concept C', type: 'secondary' },
    { id: 'D', label: 'Concept D', type: 'primary' },
  ],
  edges: [
    { source: 'A', target: 'B', label: 'relates to', type: 'is-a' },
    { source: 'B', target: 'C', label: 'connected to', type: 'related-to' },
    { source: 'C', target: 'D', label: 'links to', type: 'part-of' },
    { source: 'D', target: 'A', label: 'references', type: 'similar-to' },
  ],
};

// Example 2: Complex Graph with vector similarity
const complexGraphData: GraphData = {
  nodes: [
    { id: '1', label: 'Machine Learning', type: 'topic', vector: [1.0, 0.8, 0.6, 0.4] },
    { id: '2', label: 'Neural Networks', type: 'topic', vector: [0.9, 0.9, 0.7, 0.5] },
    { id: '3', label: 'Deep Learning', type: 'topic', vector: [0.95, 0.85, 0.8, 0.6] },
    { id: '4', label: 'Computer Vision', type: 'application', vector: [0.7, 0.6, 0.9, 0.3] },
    { id: '5', label: 'Natural Language Processing', type: 'application', vector: [0.7, 0.5, 0.8, 0.7] },
    { id: '6', label: 'TensorFlow', type: 'tool', vector: [0.5, 0.4, 0.3, 0.9] },
    { id: '7', label: 'PyTorch', type: 'tool', vector: [0.5, 0.4, 0.35, 0.85] },
    { id: '8', label: 'Transformers', type: 'architecture', vector: [0.8, 0.7, 0.75, 0.65] },
  ],
  edges: [
    { source: '1', target: '2', label: 'includes', type: 'is-a' },
    { source: '2', target: '3', label: 'foundation of', type: 'is-a' },
    { source: '3', target: '4', label: 'used in', type: 'related-to' },
    { source: '3', target: '5', label: 'used in', type: 'related-to' },
    { source: '2', target: '6', label: 'implemented in', type: 'part-of' },
    { source: '2', target: '7', label: 'implemented in', type: 'part-of' },
    { source: '3', target: '8', label: 'uses', type: 'part-of' },
    { source: '8', target: '5', label: 'powers', type: 'related-to' },
  ],
};

// Example 3: Custom Styling
const customGraphData: GraphData = {
  nodes: [
    { id: 'root', label: 'Root Node' },
    { id: 'child1', label: 'Child 1' },
    { id: 'child2', label: 'Child 2' },
    { id: 'child3', label: 'Child 3' },
    { id: 'leaf1', label: 'Leaf 1' },
    { id: 'leaf2', label: 'Leaf 2' },
  ],
  edges: [
    { source: 'root', target: 'child1' },
    { source: 'root', target: 'child2' },
    { source: 'root', target: 'child3' },
    { source: 'child1', target: 'leaf1' },
    { source: 'child2', target: 'leaf2' },
  ],
};

// Example 4: Edge Bundling - Designed to showcase bundling effects
const edgeBundlingGraphData: GraphData = {
  nodes: [
    // Core nodes
    { id: 'core1', label: 'Data Science', type: 'core' },
    { id: 'core2', label: 'Machine Learning', type: 'core' },
    
    // Left cluster
    { id: 'left1', label: 'Statistics', type: 'foundation' },
    { id: 'left2', label: 'Mathematics', type: 'foundation' },
    { id: 'left3', label: 'Programming', type: 'foundation' },
    { id: 'left4', label: 'Databases', type: 'foundation' },
    
    // Right cluster
    { id: 'right1', label: 'Computer Vision', type: 'application' },
    { id: 'right2', label: 'NLP', type: 'application' },
    { id: 'right3', label: 'Robotics', type: 'application' },
    { id: 'right4', label: 'Speech', type: 'application' },
    
    // Middle connectors
    { id: 'mid1', label: 'Neural Nets', type: 'method' },
    { id: 'mid2', label: 'Deep Learning', type: 'method' },
  ],
  edges: [
    // Multiple edges flowing from left to core1 - these should bundle together
    { source: 'left1', target: 'core1', type: 'foundation' },
    { source: 'left2', target: 'core1', type: 'foundation' },
    { source: 'left3', target: 'core1', type: 'foundation' },
    { source: 'left4', target: 'core1', type: 'foundation' },
    
    // Multiple edges flowing from core1 to core2 - different type
    { source: 'core1', target: 'mid1', type: 'method' },
    { source: 'core1', target: 'mid2', type: 'method' },
    { source: 'mid1', target: 'core2', type: 'method' },
    { source: 'mid2', target: 'core2', type: 'method' },
    
    // Multiple edges flowing from core2 to right cluster - these should bundle together
    { source: 'core2', target: 'right1', type: 'application' },
    { source: 'core2', target: 'right2', type: 'application' },
    { source: 'core2', target: 'right3', type: 'application' },
    { source: 'core2', target: 'right4', type: 'application' },
    
    // Some cross connections to create more bundling opportunities
    { source: 'left1', target: 'mid1', type: 'foundation' },
    { source: 'left2', target: 'mid1', type: 'foundation' },
    { source: 'mid1', target: 'right1', type: 'application' },
    { source: 'mid1', target: 'right2', type: 'application' },
    { source: 'mid2', target: 'right3', type: 'application' },
    { source: 'mid2', target: 'right4', type: 'application' },
    { source: 'left3', target: 'mid2', type: 'foundation' },
    { source: 'left4', target: 'mid2', type: 'foundation' },
  ],
};

function renderGraph(data: GraphData, config = {}) {
  if (currentGraph) {
    currentGraph.destroy();
  }

  currentGraph = new KnowledgeGraph(container, data, {
    width: 1000,
    height: 600,
    enableZoom: true,
    enableDrag: true,
    ...config,
  });

  currentGraph.render();
}

// Event listeners
document.getElementById('example1')?.addEventListener('click', () => {
  // Example 1: Type-based node styling (accessor function)
  renderGraph(simpleGraphData, {
    nodeRadius: (d: Node) => d.type === 'primary' ? 15 : 10,
    nodeFill: (d: Node) => d.type === 'primary' ? '#ff6b6b' : '#4ecdc4',
    linkDistance: 150,
    chargeStrength: -400,
    // Collision detection to prevent overlap
    collisionRadius: (d: Node) => (d.type === 'primary' ? 15 : 10) + 5,
  });
});

document.getElementById('example2')?.addEventListener('click', () => {
  // Example 2: Similarity-based clustering with ontology-aware links
  renderGraph(complexGraphData, {
    nodeRadius: (d: Node) => {
      // Size by type
      if (d.type === 'topic') return 15;
      if (d.type === 'application') return 12;
      if (d.type === 'tool') return 10;
      return 8;
    },
    nodeFill: (d: Node) => {
      // Color by type
      const colors: Record<string, string> = {
        'topic': '#ff6b6b',
        'application': '#4ecdc4',
        'tool': '#45b7d1',
        'architecture': '#f9ca24',
      };
      return colors[d.type || ''] || '#95afc0';
    },
    linkDistance: 100,
    linkStroke: (d) => {
      // Color edges by ontology type
      const colors: Record<string, string> = {
        'is-a': '#e74c3c',
        'part-of': '#3498db',
        'related-to': '#95a5a6',
        'similar-to': '#2ecc71',
      };
      return colors[d.type || ''] || '#999';
    },
    linkStrokeWidth: (d) => d.type === 'is-a' ? 3 : 1.5,
    chargeStrength: -500,
    // Use vector similarity for clustering
    similarityFunction: (a: Node, b: Node) => {
      if (a.vector && b.vector) {
        return cosineSimilarity(a.vector, b.vector);
      }
      return 0;
    },
    collisionRadius: (d: Node) => {
      if (d.type === 'topic') return 20;
      if (d.type === 'application') return 17;
      if (d.type === 'tool') return 15;
      return 13;
    },
  });
});

document.getElementById('example3')?.addEventListener('click', () => {
  // Example 3: Custom accessor-based styling
  renderGraph(customGraphData, {
    nodeRadius: 15,
    nodeFill: (d: Node, i: number) => {
      // Gradient based on position in array
      const hue = (i * 60) % 360;
      return `hsl(${hue}, 70%, 60%)`;
    },
    linkDistance: 200,
    chargeStrength: (d: Node) => d.id === 'root' ? -800 : -300,
    collisionRadius: 20,
  });
});

document.getElementById('example4')?.addEventListener('click', () => {
  // Example 4: Simple edges (no bundling) - for comparison
  renderGraph(edgeBundlingGraphData, {
    nodeRadius: (d: Node) => {
      if (d.type === 'core') return 20;
      if (d.type === 'foundation') return 15;
      if (d.type === 'method') return 15;
      if (d.type === 'application') return 15;
      return 12;
    },
    nodeFill: (d: Node) => {
      const colors: Record<string, string> = {
        'core': '#ff6b6b',
        'foundation': '#4ecdc4',
        'method': '#f9ca24',
        'application': '#45b7d1',
      };
      return colors[d.type || ''] || '#95afc0';
    },
    linkDistance: 150,
    linkStroke: (d) => {
      const colors: Record<string, string> = {
        'foundation': '#4ecdc4',
        'method': '#f9ca24',
        'application': '#45b7d1',
      };
      return colors[d.type || ''] || '#999';
    },
    linkStrokeWidth: 2,
    chargeStrength: -300,
    collisionRadius: (d: Node) => {
      if (d.type === 'core') return 25;
      return 20;
    },
    // Use simple edge renderer (straight lines)
    edgeRenderer: 'simple',
  });
});

document.getElementById('example5')?.addEventListener('click', () => {
  // Example 5: Edge bundling demonstration
  renderGraph(edgeBundlingGraphData, {
    nodeRadius: (d: Node) => {
      if (d.type === 'core') return 20;
      if (d.type === 'foundation') return 15;
      if (d.type === 'method') return 15;
      if (d.type === 'application') return 15;
      return 12;
    },
    nodeFill: (d: Node) => {
      const colors: Record<string, string> = {
        'core': '#ff6b6b',
        'foundation': '#4ecdc4',
        'method': '#f9ca24',
        'application': '#45b7d1',
      };
      return colors[d.type || ''] || '#95afc0';
    },
    linkDistance: 150,
    linkStroke: (d) => {
      const colors: Record<string, string> = {
        'foundation': '#4ecdc4',
        'method': '#f9ca24',
        'application': '#45b7d1',
      };
      return colors[d.type || ''] || '#999';
    },
    linkStrokeWidth: 2,
    chargeStrength: -300,
    collisionRadius: (d: Node) => {
      if (d.type === 'core') return 25;
      return 20;
    },
    // Enable edge bundling with highly aggressive parameters for dramatic effect
    edgeRenderer: 'bundled',
    waitForStable: true,
    stabilityThreshold: 0.005,
    edgeBundling: {
      subdivisions: 60,              // More control points for smoother curves
      compatibilityThreshold: 0.2,   // Very low threshold for maximum bundling
      iterations: 150,                // Many iterations for tight bundles
      stepSize: 0.25,                // Very large steps for dramatic bundling
      stiffness: 0.01,               // Very low stiffness for extreme curvature
    },
  });
});

// Render the first example by default
renderGraph(simpleGraphData, {
  nodeRadius: (d: Node) => d.type === 'primary' ? 15 : 10,
  nodeFill: (d: Node) => d.type === 'primary' ? '#ff6b6b' : '#4ecdc4',
  linkDistance: 150,
  chargeStrength: -400,
  collisionRadius: (d: Node) => (d.type === 'primary' ? 15 : 10) + 5,
});
