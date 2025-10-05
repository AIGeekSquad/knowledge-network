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
    chargeStrength: -2500,      // Very strong charge for wide node separation
    linkDistance: 320,          // Longer distance creates more bundling opportunities
    edgeRenderer: 'bundled' as const,
    edgeBundling: {
      // Enhanced algorithm features for maximum visual impact
      subdivisions: 35,                    // Very high subdivision for ultra-smooth curves
      adaptiveSubdivision: true,          // Longer edges get more subdivisions
      iterations: 120,                    // More iterations for tighter bundling
      compatibilityThreshold: 0.3,       // Lower threshold for more aggressive bundling
      stepSize: 0.08,                     // Larger steps for more pronounced bundling
      stiffness: 0.15,                    // Reduced stiffness for more dramatic curves
      momentum: 0.8,                      // Higher momentum for ultra-smooth movement
      curveType: 'cardinal' as const,     // Cardinal splines for natural curves
      curveTension: 0.9,                  // Maximum tension for controlled curves
      smoothingType: 'gaussian' as const, // Gaussian smoothing for ultra-smooth edges
      smoothingIterations: 4,             // More smoothing passes
      smoothingFrequency: 4,              // More frequent smoothing during bundling
      compatibilityFunction: (edge1: Edge, edge2: Edge) => {
        const type1 = edge1.metadata?.type as string;
        const type2 = edge2.metadata?.type as string;
        // Boost compatibility for more dramatic bundling
        const baseCompatibility = getEdgeCompatibility(type1, type2);
        return Math.min(baseCompatibility * 1.3, 1.0); // 30% boost
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

    // Enhanced edge styling with high-contrast semantic coloring
    linkStroke: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      const color = edgeStyles.colors[type as keyof typeof edgeStyles.colors] || '#999';
      console.log(`Edge ${edge.source}->${edge.target} type:${type} color:${color}`);
      return color;
    },
    linkStrokeWidth: (edge: Edge) => {
      const type = (edge.metadata?.type as string) || '';
      const baseWidth = edgeStyles.widths[type as keyof typeof edgeStyles.widths] || 1;
      return Math.max(baseWidth * 1.8, 2.0); // Thicker edges for bundling visibility
    },

    // Enhanced labeling for clear understanding
    showEdgeLabels: true,       // Enable edge labels along paths

    // Wait for simulation stability before rendering edges
    waitForStable: true,        // Wait for layout to stabilize
    stabilityThreshold: 0.005   // Lower threshold for better stability
  };

  // Fix: Pass data and config as separate arguments
  currentGraph = new KnowledgeGraph(container, data, config);
  currentGraph.render();

  updateStatus('🌟 ENHANCED BUNDLING ACTIVE: Watch edges flow and bundle by semantic similarity! Curved paths show relationships.');
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

    showEdgeLabels: true,       // Show edge labels for comparison
    waitForStable: false
  };

  // Fix: Pass data and config as separate arguments
  currentGraph = new KnowledgeGraph(container, data, config);
  currentGraph.render();

  updateStatus('📏 SIMPLE EDGES: Basic straight lines - compare with Enhanced Bundling to see the difference!');
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
