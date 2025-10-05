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
    // Reset container styles
    container.style.opacity = '1';
    container.style.transition = '';
  }
  if (currentGraph) {
    currentGraph.destroy();
    currentGraph = null;
  }
}

function updateStatus(message: string, isLoading: boolean = false) {
  console.log('Status:', message);
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = message;
    // Add loading indicator styling
    if (isLoading) {
      statusElement.style.backgroundColor = '#fff3cd';
      statusElement.style.border = '1px solid #ffeaa7';
      statusElement.style.color = '#856404';
      statusElement.innerHTML = `<div style="display: flex; align-items: center; justify-content: center;">
        <div style="width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></div>
        ${message}
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>`;
    } else {
      statusElement.style.backgroundColor = '#d4edda';
      statusElement.style.border = '1px solid #c3e6cb';
      statusElement.style.color = '#155724';
      statusElement.innerHTML = message;
    }
  }
}

function updateButtonStates() {
  const simpleButton = document.getElementById('simple-edges') as HTMLButtonElement;
  const bundlingButton = document.getElementById('edge-bundling') as HTMLButtonElement;

  if (simpleButton && bundlingButton) {
    if (currentMode === 'simple') {
      simpleButton.style.backgroundColor = '#e74c3c';
      simpleButton.style.fontWeight = 'bold';
      bundlingButton.style.backgroundColor = '#95a5a6';
      bundlingButton.style.fontWeight = 'normal';
    } else {
      bundlingButton.style.backgroundColor = '#e74c3c';
      bundlingButton.style.fontWeight = 'bold';
      simpleButton.style.backgroundColor = '#95a5a6';
      simpleButton.style.fontWeight = 'normal';
    }
  }
}

// Fit graph to viewport with proper scaling
function fitGraphToView(container: HTMLElement, g: Element, svg: Element) {
  const data = createGamingSessionGraph();
  if (data.nodes.length === 0) return;

  const padding = 50;
  const containerRect = container.getBoundingClientRect();
  const nodes = data.nodes as any[];

  // Calculate bounding box of all nodes
  const xExtent = [
    Math.min(...nodes.map(d => d.x || 0)),
    Math.max(...nodes.map(d => d.x || 0))
  ];
  const yExtent = [
    Math.min(...nodes.map(d => d.y || 0)),
    Math.max(...nodes.map(d => d.y || 0))
  ];

  const dx = xExtent[1] - xExtent[0];
  const dy = yExtent[1] - yExtent[0];
  const x = (xExtent[0] + xExtent[1]) / 2;
  const y = (yExtent[0] + yExtent[1]) / 2;

  // Calculate scale to fit with padding
  const scale = Math.min(
    (containerRect.width - padding * 2) / dx,
    (containerRect.height - padding * 2) / dy
  );

  // Calculate translation to center
  const translateX = containerRect.width / 2 - scale * x;
  const translateY = containerRect.height / 2 - scale * y;

  // Apply transform using D3's zoom transform
  if (currentGraph) {
    const simulation = currentGraph.getSimulation();
    if (simulation && svg && g) {
      // Apply the transform directly to the group element
      g.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`);
    }
  }
}

// Enhanced Edge Bundling Demonstration
function showEnhancedEdgeBundling() {
  console.log('[Render] Starting enhanced edge bundling render...');
  updateStatus('🔄 Loading enhanced bundling demo...', true);

  clearGraph();
  const container = document.getElementById('graph');
  if (!container) {
    console.error('[Render] Graph container not found');
    return;
  }

  currentMode = 'enhanced';
  const data = createGamingSessionGraph();
  console.log(`[Render] Data ready: ${data.nodes.length} nodes, ${data.edges.length} edges`);

  // Hide graph initially during loading
  container.style.opacity = '0.1';

  // Use responsive container dimensions
  const containerRect = container.getBoundingClientRect();
  const config = {
    width: containerRect.width,
    height: containerRect.height,
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

      // Map full concept types to simplified keys for styling
      const typeMap: Record<string, string> = {
        'player_character': 'player',
        'raid_boss': 'boss',
        'boss_encounter_arena': 'location',
        'frontal_cone_attack': 'ability',
        'player_party': 'group',
        'functional_role': 'role'
      };
      const mappedType = typeMap[conceptType] || conceptType;
      const baseSize = nodeStyles.sizes[mappedType as keyof typeof nodeStyles.sizes] || 8;
      return baseSize + 2; // Slightly larger for better visibility
    },
    nodeFill: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';

      // Map full concept types to simplified keys for styling
      const typeMap: Record<string, string> = {
        'player_character': 'player',
        'raid_boss': 'boss',
        'boss_encounter_arena': 'location',
        'frontal_cone_attack': 'ability',
        'player_party': 'group',
        'functional_role': 'role'
      };
      const mappedType = typeMap[conceptType] || conceptType;
      return nodeStyles.colors[mappedType as keyof typeof nodeStyles.colors] || '#666';
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
    edgeLabelStyle: {
      fontSize: 10,
      fontFamily: 'Arial, sans-serif',
      fill: '#333',
      textAnchor: 'middle',
      dominantBaseline: 'middle'
    },

    // Wait for simulation stability before rendering edges
    waitForStable: true,        // Wait for layout to stabilize
    stabilityThreshold: 0.01,   // Threshold for stability detection

    // Zoom and fit functionality - will be applied after edges render
    enableZoom: true,           // Enable zoom/pan interactions
    zoomExtent: [0.1, 4],      // Min/max zoom levels
    fitToViewport: false,       // We'll handle this manually after edges render
    padding: 50,                // Padding around the graph when fitting

    // Callback for when edges are rendered and ready
    onEdgesRendered: () => {
      updateStatus('🎯 Fitting graph to view...', true);
      setTimeout(() => {
        // Fit to viewport after edges are rendered
        if (currentGraph) {
          const simulation = currentGraph.getSimulation();
          if (simulation) {
            const g = container.querySelector('g');
            const svg = container.querySelector('svg');
            if (g && svg) {
              fitGraphToView(container, g, svg);
            }
          }
        }

        // Show the completed graph
        container.style.opacity = '1';
        container.style.transition = 'opacity 0.3s ease-in-out';
        updateStatus('🌟 ENHANCED BUNDLING ACTIVE: Watch edges flow and bundle by semantic similarity!');
        updateButtonStates();
      }, 100);
    }
  };

  try {
    updateStatus('⚙️ Setting up force simulation...', true);
    console.log('[Render] Creating KnowledgeGraph instance...');
    // Fix: Pass data and config as separate arguments
    currentGraph = new KnowledgeGraph(container, data, config);
    console.log('[Render] KnowledgeGraph created, calling render()...');

    updateStatus('🔄 Running physics simulation...', true);
    currentGraph.render();
    console.log('[Render] ✅ Enhanced bundling render initiated');
  } catch (error) {
    console.error('[Render] Failed to create or render graph:', error);
    updateStatus(`❌ Render failed: ${error.message}`);
    throw error; // Re-throw to be caught by outer handler
  }
}

// Simple comparison mode
function showSimpleEdges() {
  console.log('[Render] Starting simple edges render...');
  updateStatus('🔄 Loading simple edges demo...', true);

  clearGraph();
  const container = document.getElementById('graph');
  if (!container) {
    console.error('[Render] Graph container not found');
    return;
  }

  currentMode = 'simple';
  const data = createGamingSessionGraph();
  console.log(`[Render] Data ready: ${data.nodes.length} nodes, ${data.edges.length} edges`);

  // Hide graph initially during loading
  container.style.opacity = '0.1';

  // Use responsive container dimensions
  const containerRect = container.getBoundingClientRect();
  const config = {
    width: containerRect.width,
    height: containerRect.height,
    chargeStrength: -1800,
    linkDistance: 250,
    edgeRenderer: 'simple' as const,

    nodeRadius: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';

      // Map full concept types to simplified keys for styling
      const typeMap: Record<string, string> = {
        'player_character': 'player',
        'raid_boss': 'boss',
        'boss_encounter_arena': 'location',
        'frontal_cone_attack': 'ability',
        'player_party': 'group',
        'functional_role': 'role'
      };
      const mappedType = typeMap[conceptType] || conceptType;
      return nodeStyles.sizes[mappedType as keyof typeof nodeStyles.sizes] || 8;
    },
    nodeFill: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type ||
                         semanticNode.metadata?.type as string || '';

      // Map full concept types to simplified keys for styling
      const typeMap: Record<string, string> = {
        'player_character': 'player',
        'raid_boss': 'boss',
        'boss_encounter_arena': 'location',
        'frontal_cone_attack': 'ability',
        'player_party': 'group',
        'functional_role': 'role'
      };
      const mappedType = typeMap[conceptType] || conceptType;
      return nodeStyles.colors[mappedType as keyof typeof nodeStyles.colors] || '#666';
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

    // Enhanced labeling for comparison
    showEdgeLabels: true,       // Show edge labels for comparison
    edgeLabelStyle: {
      fontSize: 10,
      fontFamily: 'Arial, sans-serif',
      fill: '#333',
      textAnchor: 'middle',
      dominantBaseline: 'middle'
    },

    // Basic zoom and fit for simple mode
    enableZoom: true,           // Enable zoom/pan interactions
    zoomExtent: [0.1, 4],      // Min/max zoom levels
    fitToViewport: false,       // We'll handle this manually
    padding: 50,                // Padding around the graph
    waitForStable: false,

    // Callback for when rendering is complete
    onEdgesRendered: () => {
      updateStatus('🎯 Fitting graph to view...', true);
      setTimeout(() => {
        // Fit to viewport after rendering
        if (currentGraph) {
          const g = container.querySelector('g');
          const svg = container.querySelector('svg');
          if (g && svg) {
            fitGraphToView(container, g, svg);
          }
        }

        // Show the completed graph
        container.style.opacity = '1';
        container.style.transition = 'opacity 0.3s ease-in-out';
        updateStatus('📏 SIMPLE EDGES: Basic straight lines - compare with Enhanced Bundling!');
        updateButtonStates();
      }, 100);
    }
  };

  try {
    updateStatus('⚙️ Setting up simple layout...', true);
    console.log('[Render] Creating KnowledgeGraph instance...');
    // Fix: Pass data and config as separate arguments
    currentGraph = new KnowledgeGraph(container, data, config);
    console.log('[Render] KnowledgeGraph created, calling render()...');
    currentGraph.render();
    console.log('[Render] ✅ Simple edges render initiated');
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

  // Get current data for accurate counts
  const currentData = createGamingSessionGraph();

  legendContainer.innerHTML = `
    <h4 style="margin: 0 0 10px 0; color: #2c3e50; font-size: 14px;">Semantic Spacetime Graph</h4>
    <p style="margin: 0 0 8px 0; color: #7f8c8d; font-size: 11px;">${currentData.nodes.length} nodes, ${currentData.edges.length} edges</p>

    <div style="margin-bottom: 12px;">
      <strong style="color: #34495e;">Entity Types:</strong><br>
      <div style="margin: 2px 0; font-size: 11px;">🔵 <span style="color: #4a90e2;">Players</span> - Tank, Healer, DPS</div>
      <div style="margin: 2px 0; font-size: 11px;">🔴 <span style="color: #d0021b;">Boss/NPCs</span> - Blightbone & adds</div>
      <div style="margin: 2px 0; font-size: 11px;">🟢 <span style="color: #7ed321;">Locations</span> - Dungeon areas</div>
      <div style="margin: 2px 0; font-size: 11px;">🟣 <span style="color: #bd10e0;">Abilities</span> - Spells & attacks</div>
      <div style="margin: 2px 0; font-size: 11px;">🟠 <span style="color: #f5a623;">Roles</span> - Tank/Healer/DPS</div>
      <div style="margin: 2px 0; font-size: 11px;">🟦 <span style="color: #50e3c2;">Group</span> - Mythic+ party</div>
    </div>

    <div style="margin-bottom: 8px;">
      <strong style="color: #34495e;">γ(3,4) Association Types:</strong><br>
      <div style="margin: 1px 0; font-size: 11px;">🔵 <span style="color: #4a90e2;">Proximity (N)</span> - Group coordination</div>
      <div style="margin: 1px 0; font-size: 11px;">🔴 <span style="color: #d0021b;">Directional (L)</span> - Movement, combat</div>
      <div style="margin: 1px 0; font-size: 11px;">🟢 <span style="color: #7ed321;">Containment (C)</span> - Party membership</div>
      <div style="margin: 1px 0; font-size: 11px;">🟣 <span style="color: #bd10e0;">Property (E)</span> - Role fulfillment, buffs</div>
    </div>

    <div style="font-size: 10px; color: #95a5a6; border-top: 1px solid #ecf0f1; padding-top: 6px;">
      <div>💡 <strong>Edge Bundling:</strong> Similar edges bundle together</div>
      <div>⚡ <strong>Zoom:</strong> Mouse wheel to zoom, drag to pan</div>
      <div>🎯 <strong>Auto-Fit:</strong> Graph fits to viewport automatically</div>
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
    updateButtonStates(); // Ensure buttons show correct initial state
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
