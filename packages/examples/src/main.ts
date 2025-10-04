// Gaming Session Semantic Space-Time Graph Example
import { KnowledgeGraph, Node, Edge } from '../../knowledge-network/dist/index.js';
import { 
  createGamingSessionGraph, 
  getEdgeCompatibility, 
  nodeStyles, 
  edgeStyles 
} from './gaming-session-data.js';

let currentGraph: KnowledgeGraph | null = null;

function clearGraph() {
  const container = document.getElementById('graph');
  if (container) {
    container.innerHTML = '';
    container.style.height = '700px';
    container.style.width = '1200px';
    container.style.margin = '0 auto';
  }
  if (currentGraph) {
    currentGraph.destroy();
    currentGraph = null;
  }
}

function updateStatus(message: string) {
  console.log('Status:', message);
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Example 1: Simple Edges - Clear visibility with labels
function showSimpleEdges() {
  clearGraph();
  const container = document.getElementById('graph');
  if (!container) return;
  
  const data = createGamingSessionGraph();
  
  const config = {
    nodes: data.nodes,
    edges: data.edges,
    width: 1200,
    height: 700,
    chargeStrength: -1500,
    linkDistance: 250,
    edgeRenderer: 'simple' as const,
    nodeRadius: (node: Node) => {
      const type = (node.metadata?.type as string) || '';
      return nodeStyles.sizes[type as keyof typeof nodeStyles.sizes] || 5;
    },
    nodeFill: (node: Node) => {
      const type = (node.metadata?.type as string) || '';
      return nodeStyles.colors[type as keyof typeof nodeStyles.colors] || '#999';
    },
    linkStroke: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      return edgeStyles.colors[type as keyof typeof edgeStyles.colors] || '#999';
    },
    linkStrokeWidth: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      return edgeStyles.widths[type as keyof typeof edgeStyles.widths] || 1;
    },
    linkStrokeOpacity: 0.6,
    nodeLabel: true,
    nodeLabelFontSize: 10,
    edgeLabel: true,
    edgeLabelFontSize: 8,
    waitForStable: false
  };
  
  currentGraph = new KnowledgeGraph(container, config);
  currentGraph.render();
  updateStatus('Simple edges visualization - Clear straight lines with labels');
}

// Example 2: Edge Bundling - Smooth curves with semantic compatibility
function showEdgeBundling() {
  clearGraph();
  const container = document.getElementById('graph');
  if (!container) return;
  
  const data = createGamingSessionGraph();
  
  const config = {
    nodes: data.nodes,
    edges: data.edges,
    width: 1200,
    height: 700,
    chargeStrength: -1800,
    linkDistance: 300,
    edgeRenderer: 'bundled' as const,
    edgeBundling: {
      subdivisions: 20,       // Good balance for smooth curves
      iterations: 60,         // Enough iterations for bundling
      compatibilityThreshold: 0.5,  // Bundle moderately similar edges
      stepSize: 0.04,         // Standard step size
      stiffness: 0.3,         // Allow flexibility in bundling
      compatibilityFunction: (edge1: Edge, edge2: Edge) => {
        const type1 = edge1.metadata?.type as string;
        const type2 = edge2.metadata?.type as string;
        return getEdgeCompatibility(type1, type2);
      }
    },
    nodeRadius: (node: Node) => {
      const type = (node.metadata?.type as string) || '';
      return nodeStyles.sizes[type as keyof typeof nodeStyles.sizes] || 5;
    },
    nodeFill: (node: Node) => {
      const type = (node.metadata?.type as string) || '';
      return nodeStyles.colors[type as keyof typeof nodeStyles.colors] || '#999';
    },
    linkStroke: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      return edgeStyles.colors[type as keyof typeof edgeStyles.colors] || '#999';
    },
    linkStrokeWidth: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      return edgeStyles.widths[type as keyof typeof edgeStyles.widths] || 1;
    },
    linkStrokeOpacity: 0.4,   // Lower opacity for bundled edges
    nodeLabel: true,
    nodeLabelFontSize: 10,
    edgeLabel: true,           // Show edge labels
    edgeLabelFontSize: 8,
    waitForStable: false
  };
  
  currentGraph = new KnowledgeGraph(container, config);
  currentGraph.render();
  updateStatus('Edge bundling visualization - Semantically bundled curves with labels');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Hook up buttons
  document.getElementById('simple-edges')?.addEventListener('click', showSimpleEdges);
  document.getElementById('edge-bundling')?.addEventListener('click', showEdgeBundling);
  
  // Show simple edges by default
  showSimpleEdges();
  
  console.log('Gaming session knowledge graph example initialized');
  console.log('Features:');
  console.log('- Rich semantic edge labels describing relationships');
  console.log('- Temporal metadata for space-time visualization');
  console.log('- Edge compatibility based on semantic similarity');
  console.log('- Multiple node types: players, locations, events, items');
  console.log('- Edge bundling with smooth curves for visual clarity');
});
