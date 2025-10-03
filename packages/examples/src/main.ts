import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
import type { GraphData } from '@aigeeksquad/knowledge-network';

const container = document.getElementById('graph') as HTMLElement;
let currentGraph: KnowledgeGraph | null = null;

// Example 1: Simple Graph
const simpleGraphData: GraphData = {
  nodes: [
    { id: 'A', label: 'Concept A' },
    { id: 'B', label: 'Concept B' },
    { id: 'C', label: 'Concept C' },
    { id: 'D', label: 'Concept D' },
  ],
  edges: [
    { source: 'A', target: 'B', label: 'relates to' },
    { source: 'B', target: 'C', label: 'connected to' },
    { source: 'C', target: 'D', label: 'links to' },
    { source: 'D', target: 'A', label: 'references' },
  ],
};

// Example 2: Complex Graph
const complexGraphData: GraphData = {
  nodes: [
    { id: '1', label: 'Machine Learning', type: 'topic' },
    { id: '2', label: 'Neural Networks', type: 'topic' },
    { id: '3', label: 'Deep Learning', type: 'topic' },
    { id: '4', label: 'Computer Vision', type: 'application' },
    { id: '5', label: 'Natural Language Processing', type: 'application' },
    { id: '6', label: 'TensorFlow', type: 'tool' },
    { id: '7', label: 'PyTorch', type: 'tool' },
    { id: '8', label: 'Transformers', type: 'architecture' },
  ],
  edges: [
    { source: '1', target: '2', label: 'includes' },
    { source: '2', target: '3', label: 'foundation of' },
    { source: '3', target: '4', label: 'used in' },
    { source: '3', target: '5', label: 'used in' },
    { source: '2', target: '6', label: 'implemented in' },
    { source: '2', target: '7', label: 'implemented in' },
    { source: '3', target: '8', label: 'uses' },
    { source: '8', target: '5', label: 'powers' },
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

function renderGraph(data: GraphData, config = {}) {
  if (currentGraph) {
    currentGraph.destroy();
  }

  currentGraph = new KnowledgeGraph(container, data, {
    width: 1000,
    height: 600,
    nodeRadius: 12,
    linkDistance: 150,
    chargeStrength: -400,
    enableZoom: true,
    enableDrag: true,
    ...config,
  });

  currentGraph.render();
}

// Event listeners
document.getElementById('example1')?.addEventListener('click', () => {
  renderGraph(simpleGraphData);
});

document.getElementById('example2')?.addEventListener('click', () => {
  renderGraph(complexGraphData);
});

document.getElementById('example3')?.addEventListener('click', () => {
  renderGraph(customGraphData, {
    nodeRadius: 15,
    linkDistance: 200,
  });
});

// Render the first example by default
renderGraph(simpleGraphData);
