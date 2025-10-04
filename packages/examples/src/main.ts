// Gaming Session Semantic Space-Time Graph Example
// Enhanced Edge Bundling Demonstration with Smooth Flow & Semantic Labels
import { KnowledgeGraph, Node, Edge } from '../../knowledge-network/dist/index.js';
import {
  createGamingSessionGraph,
  getEdgeCompatibility,
  nodeStyles,
  edgeStyles
} from './gaming-session-data.js';

let currentGraph: KnowledgeGraph | null = null;
let currentMode: 'simple' | 'enhanced' = 'enhanced';

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

// Enhanced Edge Bundling Demonstration
function showEnhancedEdgeBundling() {
  clearGraph();
  const container = document.getElementById('graph');
  if (!container) return;

  currentMode = 'enhanced';
  const data = createGamingSessionGraph();

  const config = {
    width: 1200,
    height: 700,
    chargeStrength: -2000,      // Stronger charge for better node separation
    linkDistance: 280,          // Optimal distance for edge bundling
    edgeRenderer: 'bundled' as const,
    edgeBundling: {
      // Enhanced algorithm features
      subdivisions: 25,                    // High subdivision for ultra-smooth curves
      adaptiveSubdivision: true,          // Longer edges get more subdivisions
      iterations: 80,                     // More iterations for better bundling
      compatibilityThreshold: 0.4,       // Lower threshold bundles more edge types
      stepSize: 0.05,                     // Slightly larger steps for faster convergence
      stiffness: 0.2,                     // Lower stiffness allows more curvature
      momentum: 0.7,                      // High momentum for smooth movement
      curveType: 'cardinal' as const,     // Cardinal splines for natural curves
      curveTension: 0.8,                  // High tension for controlled curves
      smoothingType: 'gaussian' as const, // Gaussian smoothing for ultra-smooth edges
      smoothingIterations: 3,             // Multiple smoothing passes
      smoothingFrequency: 5,              // Smooth every 5 iterations during bundling
      compatibilityFunction: (edge1: Edge, edge2: Edge) => {
        const type1 = edge1.metadata?.type as string;
        const type2 = edge2.metadata?.type as string;
        return getEdgeCompatibility(type1, type2);
      }
    },
    // Enhanced node styling with clear visual hierarchy
    nodeRadius: (node: Node) => {
      const type = (node.metadata?.type as string) || '';
      const baseSize = nodeStyles.sizes[type as keyof typeof nodeStyles.sizes] || 5;
      return baseSize + 2; // Slightly larger for better visibility
    },
    nodeFill: (node: Node) => {
      const type = (node.metadata?.type as string) || '';
      return nodeStyles.colors[type as keyof typeof nodeStyles.colors] || '#999';
    },
    nodeStroke: '#ffffff',      // White border for contrast
    nodeStrokeWidth: 2,         // Clear node boundaries

    // Enhanced edge styling with semantic coloring
    linkStroke: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      return edgeStyles.colors[type as keyof typeof edgeStyles.colors] || '#999';
    },
    linkStrokeWidth: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      const baseWidth = edgeStyles.widths[type as keyof typeof edgeStyles.widths] || 1;
      return Math.max(baseWidth, 1.5); // Minimum width for visibility
    },
    linkStrokeOpacity: 0.7,     // Higher opacity for clearer visibility

    // Enhanced labeling for clear understanding
    nodeLabel: true,
    nodeLabelFontSize: 11,      // Slightly larger for readability
    nodeLabelFontWeight: '600', // Semi-bold for clarity
    nodeLabelFill: '#2c3e50',   // Dark color for contrast

    edgeLabel: true,
    edgeLabelFontSize: 9,       // Clear edge labels
    edgeLabelFontWeight: '500',
    edgeLabelFill: '#34495e',   // Readable dark gray
    edgeLabelOpacity: 0.9,      // High opacity for readability

    // Animation settings for smooth interactions
    waitForStable: true,        // Wait for layout to stabilize
    animationDuration: 1500,    // Smooth animations

    // Force simulation tuning for optimal layout
    alphaDecay: 0.01,          // Slower cooling for better convergence
    velocityDecay: 0.15        // Lower decay preserves momentum
  };

  // Fix: Pass data and config as separate arguments
  currentGraph = new KnowledgeGraph(container, data, config);
  currentGraph.render();

  updateStatus('Enhanced Edge Bundling: Semantic gaming session with smooth flows, adaptive subdivision, and momentum-based bundling');
}

// Simple comparison mode
function showSimpleEdges() {
  clearGraph();
  const container = document.getElementById('graph');
  if (!container) return;

  currentMode = 'simple';
  const data = createGamingSessionGraph();

  const config = {
    width: 1200,
    height: 700,
    chargeStrength: -1800,
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
    nodeStroke: '#ffffff',
    nodeStrokeWidth: 1.5,

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

  // Fix: Pass data and config as separate arguments
  currentGraph = new KnowledgeGraph(container, data, config);
  currentGraph.render();

  updateStatus('Simple Edges: Basic straight-line connections for comparison');
}

// Add legend for understanding the semantic graph
function createLegend() {
  const legendContainer = document.createElement('div');
  legendContainer.id = 'legend';
  legendContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 15px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    line-height: 1.4;
    max-width: 250px;
    z-index: 1000;
    border: 1px solid #e0e0e0;
  `;

  legendContainer.innerHTML = `
    <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px;">Gaming Session Graph</h4>

    <div style="margin-bottom: 12px;">
      <strong style="color: #34495e;">Node Types:</strong><br>
      <div style="margin: 4px 0;">🔴 <span style="color: #ff6b6b;">Players</span> - Game participants</div>
      <div style="margin: 4px 0;">🌍 <span style="color: #4ecdc4;">Locations</span> - Map areas</div>
      <div style="margin: 4px 0;">⚡ <span style="color: #ffd93d;">Events</span> - Game events</div>
      <div style="margin: 4px 0;">💎 <span style="color: #6bcf7f;">Items</span> - Equipment</div>
    </div>

    <div>
      <strong style="color: #34495e;">Edge Types:</strong><br>
      <div style="margin: 2px 0;">Movement, Combat, Events</div>
      <div style="margin: 2px 0;">Item pickups, Sequences</div>
      <div style="margin: 2px 0; font-style: italic;">Semantic bundling by type</div>
    </div>
  `;

  document.body.appendChild(legendContainer);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Hook up buttons if they exist, otherwise show enhanced by default
  const simpleButton = document.getElementById('simple-edges');
  const bundlingButton = document.getElementById('edge-bundling');

  if (simpleButton) {
    simpleButton.addEventListener('click', showSimpleEdges);
    simpleButton.textContent = 'Simple Edges';
  }

  if (bundlingButton) {
    bundlingButton.addEventListener('click', showEnhancedEdgeBundling);
    bundlingButton.textContent = 'Enhanced Bundling';
  }

  // Create legend for understanding the visualization
  createLegend();

  // Start with the enhanced edge bundling demonstration
  showEnhancedEdgeBundling();

  console.log('🎮 Gaming Session Knowledge Graph - Enhanced Edge Bundling Demo');
  console.log('✨ Features showcased:');
  console.log('  • Adaptive subdivision - longer edges get more control points');
  console.log('  • Momentum-based force application for smooth movement');
  console.log('  • Gaussian smoothing for ultra-smooth curves');
  console.log('  • Cardinal splines with configurable tension');
  console.log('  • Semantic edge compatibility for intelligent bundling');
  console.log('  • Rich semantic labels on nodes and edges');
  console.log('  • Gaming session space-time relationships');
  console.log('📖 Try switching between "Simple Edges" and "Enhanced Bundling" modes');
});
