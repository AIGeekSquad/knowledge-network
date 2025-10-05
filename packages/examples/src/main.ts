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
    chargeStrength: -3000,      // Stronger charge for better node separation
    linkDistance: 400,          // Longer distance creates more bundling opportunities
    edgeRenderer: 'bundled' as const,
    edgeBundling: {
      // ORGANIC BUNDLING ALGORITHM - Maximum visual impact with fluid curves
      subdivisions: 60,                    // Ultra-high subdivision for maximum smoothness
      adaptiveSubdivision: true,          // Longer edges get even more subdivisions
      iterations: 200,                    // Many more iterations for dramatic bundling
      compatibilityThreshold: 0.25,      // Lower threshold for aggressive bundling
      stepSize: 0.12,                     // Larger steps for pronounced bundling effects
      stiffness: 0.08,                    // Very low stiffness for dramatic organic curves
      momentum: 0.85,                     // High momentum for fluid, smooth movement
      curveType: 'bundle' as const,       // Bundle curves for tighter bundling
      curveTension: 0.95,                 // Maximum tension for controlled organic flow
      smoothingType: 'bilateral' as const, // Advanced edge-preserving smoothing
      smoothingIterations: 6,             // More smoothing for ultra-smooth appearance
      smoothingFrequency: 3,              // Frequent smoothing during bundling process
      compatibilityFunction: (edge1: Edge, edge2: Edge) => {
        const type1 = edge1.metadata?.type as string;
        const type2 = edge2.metadata?.type as string;

        // Get WoW-specific semantic compatibility
        const baseCompatibility = getEdgeCompatibility(type1, type2);

        // Boost compatibility significantly for dramatic organic bundling
        const organicBoost = 1.6; // 60% boost for dramatic effect

        // Add distance-based compatibility for organic flow
        const source1 = edge1.source as any;
        const target1 = edge1.target as any;
        const source2 = edge2.source as any;
        const target2 = edge2.target as any;

        if (source1 && target1 && source2 && target2) {
          const midpoint1x = (source1.x + target1.x) / 2;
          const midpoint1y = (source1.y + target1.y) / 2;
          const midpoint2x = (source2.x + target2.x) / 2;
          const midpoint2y = (source2.y + target2.y) / 2;

          const distance = Math.sqrt(
            Math.pow(midpoint1x - midpoint2x, 2) +
            Math.pow(midpoint1y - midpoint2y, 2)
          );

          // Closer edges have higher compatibility for organic bundling
          const distanceBoost = Math.max(0.2, 1 - distance / 300);

          return Math.min(baseCompatibility * organicBoost * distanceBoost, 1.0);
        }

        return Math.min(baseCompatibility * organicBoost, 1.0);
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
