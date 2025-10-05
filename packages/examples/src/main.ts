// Gaming Session Semantic Space-Time Graph Example
// Enhanced Edge Bundling Demonstration with Smooth Flow & Semantic Labels
import { KnowledgeGraph, Node, Edge } from '../../knowledge-network/dist/index.js';
import {
  createGamingSessionGraph,
  getEdgeCompatibility,
  nodeStyles,
  edgeStyles,
  type SemanticSpacetimeNode,
  type SemanticSpacetimeEdge
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
  console.log('[Render] Starting enhanced edge bundling render...');
  clearGraph();
  const container = document.getElementById('graph');
  if (!container) {
    console.error('[Render] Graph container not found');
    return;
  }

  currentMode = 'enhanced';
  const data = createGamingSessionGraph();
  console.log(`[Render] Data ready: ${data.nodes.length} nodes, ${data.edges.length} edges`);

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
        const semanticEdge1 = edge1 as SemanticSpacetimeEdge;
        const semanticEdge2 = edge2 as SemanticSpacetimeEdge;

        // Use semantic spacetime association types for bundling
        const assocType1 = semanticEdge1.metadata?.association_type ||
                          semanticEdge1.metadata?.type as string || '';
        const assocType2 = semanticEdge2.metadata?.association_type ||
                          semanticEdge2.metadata?.type as string || '';

        // Get semantic compatibility using γ(3,4) system
        let baseCompatibility = getEdgeCompatibility(assocType1, assocType2);

        // Add concept similarity boost for semantic relationships
        const sim1 = semanticEdge1.metadata?.semantic_binding?.concept_similarity || 0.5;
        const sim2 = semanticEdge2.metadata?.semantic_binding?.concept_similarity || 0.5;
        const semanticBoost = (sim1 + sim2) / 2;

        // Temporal compatibility - edges closer in time bundle better
        const time1 = semanticEdge1.metadata?.spacetime_binding?.temporal_relationship?.start_time || 0;
        const time2 = semanticEdge2.metadata?.spacetime_binding?.temporal_relationship?.start_time || 0;
        const timeDiff = Math.abs(time1 - time2);
        const temporalBoost = Math.max(0.3, 1 - timeDiff / 120); // 2-minute window

        // Spatial compatibility - edges from similar locations
        const source1 = edge1.source as any;
        const target1 = edge1.target as any;
        const source2 = edge2.source as any;
        const target2 = edge2.target as any;

        let spatialBoost = 1.0;
        if (source1 && target1 && source2 && target2) {
          const midpoint1x = (source1.x + target1.x) / 2;
          const midpoint1y = (source1.y + target1.y) / 2;
          const midpoint2x = (source2.x + target2.x) / 2;
          const midpoint2y = (source2.y + target2.y) / 2;

          const distance = Math.sqrt(
            Math.pow(midpoint1x - midpoint2x, 2) +
            Math.pow(midpoint1y - midpoint2y, 2)
          );

          spatialBoost = Math.max(0.2, 1 - distance / 200);
        }

        // Combine all compatibility factors using semantic spacetime principles
        return Math.min(baseCompatibility * semanticBoost * temporalBoost * spatialBoost, 1.0);
      }
    },
    // Enhanced node styling with clear visual hierarchy for semantic spacetime entities
    nodeRadius: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';
      const baseSize = nodeStyles.sizes[conceptType as keyof typeof nodeStyles.sizes] || 5;
      return baseSize + 2; // Slightly larger for better visibility
    },
    nodeFill: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';
      return nodeStyles.colors[conceptType as keyof typeof nodeStyles.colors] || '#999';
    },
    nodeStroke: '#ffffff',      // White border for contrast
    nodeStrokeWidth: 2,         // Clear node boundaries

    // Enhanced edge styling with γ(3,4) association type coloring
    linkStroke: (edge: Edge) => {
      const semanticEdge = edge as SemanticSpacetimeEdge;
      const associationType = semanticEdge.metadata?.association_type ||
                             semanticEdge.metadata?.type as string || '';
      const color = edgeStyles.colors[associationType as keyof typeof edgeStyles.colors] || '#999';
      console.log(`Edge ${edge.source}->${edge.target} type:${associationType} color:${color}`);
      return color;
    },
    linkStrokeWidth: (edge: Edge) => {
      const semanticEdge = edge as SemanticSpacetimeEdge;
      const associationType = semanticEdge.metadata?.association_type ||
                             semanticEdge.metadata?.type as string || '';
      const baseWidth = edgeStyles.widths[associationType as keyof typeof edgeStyles.widths] || 1;
      return Math.max(baseWidth * 1.8, 2.0); // Thicker edges for bundling visibility
    },

    // Enhanced labeling for clear understanding
    showEdgeLabels: true,       // Enable edge labels along paths

    // Wait for simulation stability before rendering edges
    waitForStable: true,        // Wait for layout to stabilize
    stabilityThreshold: 0.005,   // Lower threshold for better stability

    // Zoom-to-fit functionality for large graphs
    enableZoomToFit: true,      // Auto-zoom to show entire graph
    zoomPadding: 50             // Padding around the graph
  };

  try {
    console.log('[Render] Creating KnowledgeGraph instance...');
    // Fix: Pass data and config as separate arguments
    currentGraph = new KnowledgeGraph(container, data, config);
    console.log('[Render] KnowledgeGraph created, calling render()...');
    currentGraph.render();
    console.log('[Render] ✅ Enhanced bundling render complete');
    updateStatus('🌟 ENHANCED BUNDLING ACTIVE: Watch edges flow and bundle by semantic similarity! Curved paths show relationships.');
  } catch (error) {
    console.error('[Render] Failed to create or render graph:', error);
    updateStatus(`❌ Render failed: ${error.message}`);
    throw error; // Re-throw to be caught by outer handler
  }
}

// Simple comparison mode
function showSimpleEdges() {
  console.log('[Render] Starting simple edges render...');
  clearGraph();
  const container = document.getElementById('graph');
  if (!container) {
    console.error('[Render] Graph container not found');
    return;
  }

  currentMode = 'simple';
  const data = createGamingSessionGraph();
  console.log(`[Render] Data ready: ${data.nodes.length} nodes, ${data.edges.length} edges`);

  const config = {
    width: 1200,
    height: 700,
    chargeStrength: -1800,
    linkDistance: 250,
    edgeRenderer: 'simple' as const,

    nodeRadius: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';
      return nodeStyles.sizes[conceptType as keyof typeof nodeStyles.sizes] || 5;
    },
    nodeFill: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';
      return nodeStyles.colors[conceptType as keyof typeof nodeStyles.colors] || '#999';
    },
    nodeStroke: '#ffffff',
    nodeStrokeWidth: 1.5,

    linkStroke: (edge: Edge) => {
      const semanticEdge = edge as SemanticSpacetimeEdge;
      const associationType = semanticEdge.metadata?.association_type ||
                             semanticEdge.metadata?.type as string || '';
      return edgeStyles.colors[associationType as keyof typeof edgeStyles.colors] || '#999';
    },
    linkStrokeWidth: (edge: Edge) => {
      const semanticEdge = edge as SemanticSpacetimeEdge;
      const associationType = semanticEdge.metadata?.association_type ||
                             semanticEdge.metadata?.type as string || '';
      return edgeStyles.widths[associationType as keyof typeof edgeStyles.widths] || 1;
    },
    linkStrokeOpacity: 0.6,

    showEdgeLabels: true,       // Show edge labels for comparison
    waitForStable: false
  };

  try {
    console.log('[Render] Creating KnowledgeGraph instance...');
    // Fix: Pass data and config as separate arguments
    currentGraph = new KnowledgeGraph(container, data, config);
    console.log('[Render] KnowledgeGraph created, calling render()...');
    currentGraph.render();
    console.log('[Render] ✅ Simple edges render complete');
    updateStatus('📏 SIMPLE EDGES: Basic straight lines - compare with Enhanced Bundling to see the difference!');
  } catch (error) {
    console.error('[Render] Failed to create or render graph:', error);
    updateStatus(`❌ Render failed: ${error.message}`);
  }
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
    <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px;">Semantic Spacetime Graph</h4>

    <div style="margin-bottom: 12px;">
      <strong style="color: #34495e;">Entity Types:</strong><br>
      <div style="margin: 4px 0;">🔵 <span style="color: #4a90e2;">Players</span> - Autonomous agents</div>
      <div style="margin: 4px 0;">🔴 <span style="color: #d0021b;">Bosses</span> - Scripted entities</div>
      <div style="margin: 4px 0;">🟢 <span style="color: #7ed321;">Locations</span> - Spatial regions</div>
      <div style="margin: 4px 0;">🟣 <span style="color: #bd10e0;">Abilities</span> - Temporal processes</div>
      <div style="margin: 4px 0;">🟠 <span style="color: #f5a623;">Roles</span> - Abstract concepts</div>
      <div style="margin: 4px 0;">🟦 <span style="color: #50e3c2;">Groups</span> - Collection entities</div>
    </div>

    <div>
      <strong style="color: #34495e;">γ(3,4) Association Types:</strong><br>
      <div style="margin: 2px 0;">🔵 <span style="color: #4a90e2;">Proximity (N)</span> - Similarity</div>
      <div style="margin: 2px 0;">🔴 <span style="color: #d0021b;">Directional (L)</span> - Causality</div>
      <div style="margin: 2px 0;">🟢 <span style="color: #7ed321;">Containment (C)</span> - Membership</div>
      <div style="margin: 2px 0;">🟣 <span style="color: #bd10e0;">Property (E)</span> - Attributes</div>
    </div>
  `;

  document.body.appendChild(legendContainer);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[Main] DOM loaded, initializing Knowledge Graph visualization...');

  // Verify data generation first
  try {
    const testData = createGamingSessionGraph();
    console.log(`[Data Check] Generated ${testData.nodes.length} nodes and ${testData.edges.length} edges`);

    // Check for any invalid edge references
    const nodeIds = new Set(testData.nodes.map(n => n.id));
    const invalidEdges = testData.edges.filter(e =>
      !nodeIds.has(e.source as string) || !nodeIds.has(e.target as string)
    );

    if (invalidEdges.length > 0) {
      console.error('[Data Error] Found edges with invalid node references:', invalidEdges);
      updateStatus('❌ Error: Invalid edge references detected. Check console for details.');
      return;
    }

    console.log('[Data Check] ✅ All edge references are valid');
  } catch (error) {
    console.error('[Data Error] Failed to generate graph data:', error);
    updateStatus('❌ Error: Failed to generate graph data. Check console for details.');
    return;
  }

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
  try {
    showEnhancedEdgeBundling();
  } catch (error) {
    console.error('[Render Error] Failed to render graph:', error);
    updateStatus('❌ Error: Failed to render graph. Check console for details.');
  }

  console.log('🎮 Semantic Spacetime Knowledge Graph - Enhanced Edge Bundling Demo');
  console.log('✨ Features showcased:');
  console.log('  • γ(3,4) Representation System - Four irreducible association types');
  console.log('  • Promise-theoretic autonomous agents with behavioral commitments');
  console.log('  • Multi-dimensional spacetime integration (spatial, temporal, semantic)');
  console.log('  • Enhanced edge compatibility using concept similarity');
  console.log('  • Temporal and spatial bundling factors for natural grouping');
  console.log('  • Advanced bilateral smoothing for ultra-smooth curves');
  console.log('  • Zoom-to-fit functionality for scalable visualization');
  console.log('📖 Based on Mark Burgess\'s Semantic Spacetime model - try "Enhanced Bundling"');
});
