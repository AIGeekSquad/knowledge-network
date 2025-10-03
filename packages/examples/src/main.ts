// Import from the built library, not source TypeScript
import { KnowledgeGraph, Node, Edge, GraphData } from '../../knowledge-network/dist/index.js';

// Helper function to create a network graph structure
function createNetworkGraph(nodeCount: number, connectionDensity: number): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Create nodes in a circular layout initially
  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * 2 * Math.PI;
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      x: 400 + Math.cos(angle) * 200,
      y: 300 + Math.sin(angle) * 200,
      metadata: {
        group: Math.floor(i / (nodeCount / 3)), // Divide into 3 groups
        importance: Math.random()
      }
    });
  }
  
  // Create edges based on connection patterns
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      // Create connections based on patterns
      const sameGroup = nodes[i].metadata?.group === nodes[j].metadata?.group;
      const crossGroup = Math.abs((nodes[i].metadata?.group as number || 0) - (nodes[j].metadata?.group as number || 0)) === 1;
      
      // Higher probability for same group connections
      const probability = sameGroup ? 0.3 : (crossGroup ? 0.15 : 0.05);
      
      if (Math.random() < probability * connectionDensity) {
        edges.push({
          id: `edge-${i}-${j}`,
          source: `node-${i}`,
          target: `node-${j}`,
          metadata: {
            type: sameGroup ? 'intra-group' : 'inter-group',
            weight: Math.random() * 3 + 1
          }
        });
      }
    }
  }
  
  return { nodes, edges };
}

// Create hierarchical graph for better bundling demonstration
function createHierarchicalGraph(): GraphData {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  // Create three layers
  const layers = [
    { count: 3, y: 100, prefix: 'top' },
    { count: 5, y: 300, prefix: 'mid' },
    { count: 8, y: 500, prefix: 'bot' }
  ];
  
  layers.forEach((layer, layerIndex) => {
    for (let i = 0; i < layer.count; i++) {
      const x = 100 + (600 / (layer.count - 1)) * i;
      nodes.push({
        id: `${layer.prefix}-${i}`,
        label: `${layer.prefix.toUpperCase()} ${i}`,
        x: x,
        y: layer.y,
        metadata: {
          layer: layerIndex,
          position: i
        }
      });
    }
  });
  
  // Connect layers with specific patterns
  // Top to middle connections
  for (let i = 0; i < layers[0].count; i++) {
    for (let j = 0; j < layers[1].count; j++) {
      // Each top node connects to 2-3 middle nodes
      if (Math.abs(i * 2 - j) <= 1) {
        edges.push({
          id: `edge-t${i}-m${j}`,
          source: `top-${i}`,
          target: `mid-${j}`,
          metadata: {
            type: 'downward',
            layer: 'top-mid'
          }
        });
      }
    }
  }
  
  // Middle to bottom connections
  for (let i = 0; i < layers[1].count; i++) {
    for (let j = 0; j < layers[2].count; j++) {
      // Each middle node connects to 2-3 bottom nodes
      if (Math.abs(i * 1.6 - j) <= 1.5) {
        edges.push({
          id: `edge-m${i}-b${j}`,
          source: `mid-${i}`,
          target: `bot-${j}`,
          metadata: {
            type: 'downward',
            layer: 'mid-bot'
          }
        });
      }
    }
  }
  
  // Add some cross-layer connections for bundling effect
  edges.push(
    { id: 'cross-1', source: 'top-0', target: 'bot-0', metadata: { type: 'cross', layer: 'cross' } },
    { id: 'cross-2', source: 'top-2', target: 'bot-7', metadata: { type: 'cross', layer: 'cross' } },
    { id: 'cross-3', source: 'top-1', target: 'bot-3', metadata: { type: 'cross', layer: 'cross' } }
  );
  
  return { nodes, edges };
}

// Current graph instance
let currentGraph: KnowledgeGraph | null = null;

// Function to clear and prepare the graph container
function clearGraph() {
  const graphContainer = document.querySelector('#graph') as HTMLElement;
  if (graphContainer) {
    graphContainer.innerHTML = '';
    graphContainer.style.height = '600px';
    graphContainer.style.width = '100%';
  }
  if (currentGraph) {
    currentGraph.destroy();
    currentGraph = null;
  }
}

// Example 1: Type-Based Styling
function showExample1() {
  clearGraph();
  const graphContainer = document.querySelector('#graph') as HTMLElement;
  
  const data = createNetworkGraph(12, 0.8);
  currentGraph = new KnowledgeGraph(
    graphContainer,
    data,
    {
      nodeRadius: (node: Node) => {
        const group = node.metadata?.group as number || 0;
        return 8 + group * 3;
      },
      nodeFill: (node: Node) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
        const group = node.metadata?.group as number || 0;
        return colors[group];
      },
      linkStroke: '#999',
      linkStrokeWidth: 1.5,
      chargeStrength: -400,
      linkDistance: 80,
      waitForStable: false
    }
  );
  currentGraph.render();
}

// Example 2: Similarity Clustering
function showExample2() {
  clearGraph();
  const graphContainer = document.querySelector('#graph') as HTMLElement;
  
  const data = createNetworkGraph(20, 0.6);
  // Add vectors for similarity
  data.nodes.forEach(node => {
    const group = node.metadata?.group as number || 0;
    node.vector = [
      group === 0 ? 1 : 0,
      group === 1 ? 1 : 0,
      group === 2 ? 1 : 0,
      Math.random()
    ];
  });
  
  currentGraph = new KnowledgeGraph(
    graphContainer,
    data,
    {
      nodeFill: (node: Node) => {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
        const group = node.metadata?.group as number || 0;
        return colors[group];
      },
      similarityFunction: (a: Node, b: Node) => {
        if (!a.vector || !b.vector) return 0;
        // Cosine similarity
        let dot = 0;
        let magA = 0;
        let magB = 0;
        for (let i = 0; i < a.vector.length; i++) {
          dot += a.vector[i] * b.vector[i];
          magA += a.vector[i] * a.vector[i];
          magB += b.vector[i] * b.vector[i];
        }
        return dot / (Math.sqrt(magA) * Math.sqrt(magB));
      },
      chargeStrength: -300,
      linkDistance: 100,
      waitForStable: false
    }
  );
  currentGraph.render();
}

// Example 3: Custom Accessors
function showExample3() {
  clearGraph();
  const graphContainer = document.querySelector('#graph') as HTMLElement;
  
  const data = createNetworkGraph(15, 0.7);
  currentGraph = new KnowledgeGraph(
    graphContainer,
    data,
    {
      nodeRadius: (node: Node, i: number) => {
        return 5 + (i % 3) * 5;
      },
      nodeFill: (node: Node, i: number) => {
        const importance = node.metadata?.importance as number || 0;
        return importance > 0.5 ? '#ff6b6b' : '#4ecdc4';
      },
      nodeStroke: (node: Node) => {
        const group = node.metadata?.group as number || 0;
        return group === 1 ? '#333' : '#999';
      },
      nodeStrokeWidth: (node: Node) => {
        const group = node.metadata?.group as number || 0;
        return group === 1 ? 3 : 1.5;
      },
      linkStroke: (edge: Edge) => {
        return edge.metadata?.type === 'intra-group' ? '#4ecdc4' : '#ff6b6b';
      },
      linkStrokeWidth: (edge: Edge) => {
        const weight = edge.metadata?.weight as number || 1;
        return weight;
      },
      chargeStrength: -350,
      linkDistance: 90,
      waitForStable: false
    }
  );
  currentGraph.render();
}

// Example 4: Simple Edges
function showExample4() {
  clearGraph();
  const graphContainer = document.querySelector('#graph') as HTMLElement;
  
  const data = createNetworkGraph(15, 0.8);
  currentGraph = new KnowledgeGraph(
    graphContainer,
    data,
    {
      edgeRenderer: 'simple',
      linkStroke: (edge: Edge) => {
        const colors: Record<string, string> = {
          'intra-group': '#4ecdc4',
          'inter-group': '#ff6b6b'
        };
        return colors[edge.metadata?.type as string] || '#999';
      },
      linkStrokeWidth: (edge: Edge) => (edge.metadata?.weight as number) || 1.5,
      chargeStrength: -300,
      linkDistance: 80,
      waitForStable: false
    }
  );
  currentGraph.render();
}

// Example 5: Edge Bundling
function showExample5() {
  clearGraph();
  const graphContainer = document.querySelector('#graph') as HTMLElement;
  
  const data = createHierarchicalGraph();
  currentGraph = new KnowledgeGraph(
    graphContainer,
    data,
    {
      edgeRenderer: 'bundled',
      edgeBundling: {
        subdivisions: 25,
        iterations: 80,
        compatibilityThreshold: 0.55,
        stepSize: 0.04,
        stiffness: 0.15
      },
      linkStroke: (edge: Edge) => {
        const colors: Record<string, string> = {
          'downward': '#4ecdc4',
          'cross': '#ff6b6b'
        };
        return colors[edge.metadata?.type as string] || '#999';
      },
      linkStrokeWidth: 2,
      chargeStrength: -500,
      linkDistance: 100,
      waitForStable: false
    }
  );
  currentGraph.render();
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Knowledge Network Examples');
  
  const example1Btn = document.getElementById('example1');
  const example2Btn = document.getElementById('example2');
  const example3Btn = document.getElementById('example3');
  const example4Btn = document.getElementById('example4');
  const example5Btn = document.getElementById('example5');
  
  if (example1Btn) example1Btn.addEventListener('click', showExample1);
  if (example2Btn) example2Btn.addEventListener('click', showExample2);
  if (example3Btn) example3Btn.addEventListener('click', showExample3);
  if (example4Btn) example4Btn.addEventListener('click', showExample4);
  if (example5Btn) example5Btn.addEventListener('click', showExample5);
  
  // Show first example by default
  showExample4(); // Start with simple edges
});
