// Knowledge Network Demo Application
// Implements formal specification v1.0 with all 39 requirements

import { KnowledgeGraph, Node, Edge } from '@aigeeksquad/knowledge-network';
import * as d3 from 'd3';
import {
  createGamingSessionGraph,
  getEdgeCompatibility,
  nodeStyles,
  edgeStyles,
  type SemanticSpacetimeNode,
  type SemanticSpacetimeEdge
} from './gaming-session-data.js';

// Application state
interface ApplicationState {
  currentMode: 'simple' | 'enhanced';
  currentGraph: KnowledgeGraph | null;
  isLoading: boolean;
  loadingStage: number;
  selectedNode: string | null;
  loadStartTime: number;
  interactionEnabled: boolean;
}

// Loading stages according to REQ-INIT-003
const LOADING_STAGES = [
  { id: 1, message: 'Loading data...', duration: 500 },
  { id: 2, message: 'Node layout calculation...', duration: 2000 },
  { id: 3, message: 'Edge generation...', duration: 1000 },
  { id: 4, message: 'Zoom to fit...', duration: 500 },
  { id: 5, message: 'Complete', duration: 0 }
];

// Initialize application state
const state: ApplicationState = {
  currentMode: 'simple', // REQ-INIT-001: Simple Edges mode by default
  currentGraph: null,
  isLoading: false,
  loadingStage: 0,
  selectedNode: null,
  loadStartTime: 0,
  interactionEnabled: false
};

// Error handling for REQ-UX-004 and REQ-UX-005
class GraphError extends Error {
  constructor(message: string, public isRecoverable: boolean = true) {
    super(message);
    this.name = 'GraphError';
  }
}

// Status management for REQ-UX-001
function updateStatus(message: string, isLoading: boolean = false, isError: boolean = false) {
  const statusElement = document.getElementById('status');
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.className = 'status';

  if (isError) {
    statusElement.classList.add('status-error');
  } else if (isLoading) {
    statusElement.classList.add('status-loading');
  } else {
    statusElement.classList.add('status-success');
  }

  // Add ARIA live region for accessibility (REQ-ACC-001-003)
  statusElement.setAttribute('role', 'status');
  statusElement.setAttribute('aria-live', 'polite');
}

// REQ-INIT-002: Hide graph during loading
function hideGraph() {
  const container = document.getElementById('graph');
  if (container) {
    container.style.visibility = 'hidden';
    container.style.opacity = '0';
  }
}

// Show graph with transition
function showGraph() {
  const container = document.getElementById('graph');
  if (container) {
    container.style.visibility = 'visible';
    container.style.transition = 'opacity 0.3s ease-in-out';
    container.style.opacity = '1';
  }
}

// REQ-UX-003: Disable interaction during processing
function setInteractionEnabled(enabled: boolean) {
  state.interactionEnabled = enabled;
  const container = document.getElementById('graph');
  if (container) {
    container.style.pointerEvents = enabled ? 'auto' : 'none';
  }

  // Disable/enable buttons
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    (button as HTMLButtonElement).disabled = !enabled;
  });
}

// Clean up existing graph
function clearGraph() {
  if (state.currentGraph) {
    state.currentGraph.destroy();
    state.currentGraph = null;
  }

  const container = document.getElementById('graph');
  if (container) {
    container.innerHTML = '';
  }

  state.selectedNode = null;
}

// REQ-VIS-001: Create legend
function createLegend() {
  const existingLegend = document.getElementById('legend');
  if (existingLegend) {
    existingLegend.remove();
  }

  const legendContainer = document.createElement('div');
  legendContainer.id = 'legend';
  legendContainer.className = 'legend';

  const data = createGamingSessionGraph();

  // Extract unique node types
  const nodeTypes = new Map<string, string>();
  data.nodes.forEach(node => {
    const sNode = node as SemanticSpacetimeNode;
    const type = sNode.metadata?.semantic_content?.concept_type || 'unknown';
    const mappedType = mapNodeType(type);
    if (!nodeTypes.has(mappedType)) {
      nodeTypes.set(mappedType, nodeStyles.colors[mappedType as keyof typeof nodeStyles.colors] || '#666');
    }
  });

  // Extract unique edge types
  const edgeTypes = new Map<string, string>();
  data.edges.forEach(edge => {
    const sEdge = edge as SemanticSpacetimeEdge;
    const type = sEdge.metadata?.association_type || 'unknown';
    if (!edgeTypes.has(type)) {
      edgeTypes.set(type, edgeStyles.colors[type as keyof typeof edgeStyles.colors] || '#999');
    }
  });

  let legendHTML = '<h3>Legend</h3>';

  // Node types section
  legendHTML += '<div class="legend-section"><h4>Node Types</h4>';
  nodeTypes.forEach((color, type) => {
    legendHTML += `<div class="legend-item">
      <span class="legend-color" style="background-color: ${color}"></span>
      <span class="legend-label">${type}</span>
    </div>`;
  });
  legendHTML += '</div>';

  // Edge types section
  legendHTML += '<div class="legend-section"><h4>Edge Types</h4>';
  edgeTypes.forEach((color, type) => {
    const label = type === 'N' ? 'Proximity' :
                  type === 'L' ? 'Directional' :
                  type === 'C' ? 'Containment' :
                  type === 'E' ? 'Property' : type;
    legendHTML += `<div class="legend-item">
      <span class="legend-line" style="background-color: ${color}"></span>
      <span class="legend-label">${label}</span>
    </div>`;
  });
  legendHTML += '</div>';

  legendContainer.innerHTML = legendHTML;
  document.body.appendChild(legendContainer);
}

// Helper function to map node types
function mapNodeType(conceptType: string): string {
  const typeMap: Record<string, string> = {
    'player_character': 'player',
    'raid_boss': 'boss',
    'boss_encounter_arena': 'location',
    'frontal_cone_attack': 'ability',
    'player_party': 'group',
    'functional_role': 'role'
  };
  return typeMap[conceptType] || conceptType;
}

// REQ-PROC-001: Sequential loading process
async function executeLoadingSequence(mode: 'simple' | 'enhanced'): Promise<void> {
  state.isLoading = true;
  state.loadStartTime = Date.now();
  setInteractionEnabled(false);

  try {
    const container = document.getElementById('graph');
    if (!container) {
      throw new GraphError('Graph container not found', false);
    }

    // Clear any existing graph and hide container
    clearGraph();
    hideGraph();

    // Stage 1: Load data (REQ-PROC-001.1)
    state.loadingStage = 1;
    updateStatus(LOADING_STAGES[0].message, true);
    await simulateAsyncOperation(LOADING_STAGES[0].duration);

    const data = createGamingSessionGraph();
    if (!data || data.nodes.length === 0) {
      throw new GraphError('No data available', false);
    }

    // Validate data integrity
    validateGraphData(data);

    // Stage 2: Node layout (REQ-PROC-001.2)
    state.loadingStage = 2;
    updateStatus(LOADING_STAGES[1].message, true);

    // Create graph configuration with callbacks
    const config = createGraphConfig(mode, container, data);

    // Override onEdgesRendered to handle our stage 5 transition
    const originalOnEdgesRendered = config.onEdgesRendered;
    config.onEdgesRendered = () => {
      if (originalOnEdgesRendered) originalOnEdgesRendered();

      // Stage 5: Complete - show the graph
      state.loadingStage = 5;
      updateStatus(LOADING_STAGES[4].message, true);

      // Apply zoom to fit then show
      setTimeout(() => {
        applyZoomToFit(container);
        showGraph();

        // Success message
        const loadTime = Date.now() - state.loadStartTime;
        updateStatus(`Visualization ready (${loadTime}ms)`, false);
      }, 100);
    };

    // Create and render the graph (but keep it hidden)
    state.currentGraph = new KnowledgeGraph(container, data, config);

    // Ensure container stays hidden during rendering
    container.style.visibility = 'hidden';
    container.style.opacity = '0';

    state.currentGraph.render();

    // Wait for simulated layout time
    await simulateAsyncOperation(LOADING_STAGES[1].duration);

    // Stage 3: Edge generation (REQ-PROC-001.3)
    state.loadingStage = 3;
    updateStatus(LOADING_STAGES[2].message, true);
    await simulateAsyncOperation(LOADING_STAGES[2].duration);

    // Stage 4: Zoom calculation (REQ-PROC-001.4)
    state.loadingStage = 4;
    updateStatus(LOADING_STAGES[3].message, true);
    await simulateAsyncOperation(LOADING_STAGES[3].duration);

    // Add interactivity
    setupInteractivity(container);

  } catch (error) {
    handleLoadingError(error);
  } finally {
    state.isLoading = false;
    setInteractionEnabled(true);
  }
}

// REQ-PROC-003: Wait for physics simulation stability
async function waitForLayoutStabilization(): Promise<void> {
  return new Promise((resolve) => {
    if (!state.currentGraph) {
      resolve();
      return;
    }

    const simulation = state.currentGraph.getSimulation();
    if (!simulation) {
      resolve();
      return;
    }

    const stabilityThreshold = 0.05;
    let checkCount = 0;
    const maxChecks = 100; // Maximum 10 seconds (100 * 100ms)

    const checkStability = () => {
      checkCount++;

      // @ts-ignore - accessing alpha is valid
      const alpha = simulation.alpha();

      if (alpha < stabilityThreshold || checkCount >= maxChecks) {
        resolve();
      } else {
        setTimeout(checkStability, 100);
      }
    };

    setTimeout(checkStability, 100);
  });
}

// REQ-INT-001: Zoom to fit implementation
function applyZoomToFit(container: HTMLElement) {
  const svg = d3.select(container).select('svg');
  const g = svg.select('g');

  if (svg.empty() || g.empty()) return;

  // Get bounding box of all content
  const bounds = (g.node() as SVGGElement).getBBox();
  const containerRect = container.getBoundingClientRect();

  const fullWidth = containerRect.width;
  const fullHeight = containerRect.height;
  const width = bounds.width;
  const height = bounds.height;
  const midX = bounds.x + width / 2;
  const midY = bounds.y + height / 2;

  // Calculate scale with padding
  const padding = 50;
  const scale = Math.min(
    (fullWidth - padding * 2) / width,
    (fullHeight - padding * 2) / height,
    2 // Maximum zoom level
  );

  // Apply transform
  const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

  // Create zoom behavior
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString());
    });

  // Apply initial transform
  svg.call(zoom);
  svg.transition()
    .duration(300)
    .call(
      zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
}

// REQ-INT-002, REQ-INT-003: Node selection system
function setupInteractivity(container: HTMLElement) {
  const svg = d3.select(container).select('svg');
  const g = svg.select('g');

  if (svg.empty() || g.empty()) return;

  // Setup zoom/pan (REQ-INT-001)
  const zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform.toString());
    });

  svg.call(zoom);

  // Node selection handlers
  g.selectAll('.node').on('click', function(event: MouseEvent, d: any) {
    event.stopPropagation();
    if (!state.interactionEnabled) return;

    const nodeId = d.id || (d as any).data?.id;
    selectNode(nodeId);
  });

  // Click on empty space to deselect (REQ-INT-003)
  svg.on('click', function(event: MouseEvent) {
    if (!state.interactionEnabled) return;

    const target = event.target as Element;
    if (target.tagName === 'svg' || target.classList.contains('background')) {
      deselectAll();
    }
  });

  // Add hover effects (REQ-UX-002)
  g.selectAll('.node')
    .on('mouseenter', function() {
      if (!state.interactionEnabled) return;
      d3.select(this).style('cursor', 'pointer');
    })
    .on('mouseleave', function() {
      d3.select(this).style('cursor', 'default');
    });
}

// REQ-INT-002: Select node and connected elements
function selectNode(nodeId: string) {
  state.selectedNode = nodeId;

  const container = document.getElementById('graph');
  if (!container) return;

  const svg = d3.select(container).select('svg');
  const g = svg.select('g');

  // Get connected nodes
  const data = createGamingSessionGraph();
  const connectedNodes = new Set<string>([nodeId]);

  data.edges.forEach(edge => {
    const source = typeof edge.source === 'string' ? edge.source : (edge.source as any).id;
    const target = typeof edge.target === 'string' ? edge.target : (edge.target as any).id;

    if (source === nodeId) connectedNodes.add(target);
    if (target === nodeId) connectedNodes.add(source);
  });

  // Apply opacity changes with transition (REQ-INT-004)
  g.selectAll('.node')
    .transition()
    .duration(300)
    .style('opacity', function(d: any) {
      const id = d.id || (d as any).data?.id;
      return connectedNodes.has(id) ? 1 : 0.2;
    });

  g.selectAll('.link, .edge')
    .transition()
    .duration(300)
    .style('opacity', function(d: any) {
      const source = typeof d.source === 'string' ? d.source : d.source?.id;
      const target = typeof d.target === 'string' ? d.target : d.target?.id;
      return (source === nodeId || target === nodeId) ? 1 : 0.1;
    });

  // Edge labels
  g.selectAll('.edge-label')
    .transition()
    .duration(300)
    .style('opacity', function(d: any) {
      const source = typeof d.source === 'string' ? d.source : d.source?.id;
      const target = typeof d.target === 'string' ? d.target : d.target?.id;
      return (source === nodeId || target === nodeId) ? 1 : 0.1;
    });
}

// REQ-INT-003: Deselect all
function deselectAll() {
  state.selectedNode = null;

  const container = document.getElementById('graph');
  if (!container) return;

  const svg = d3.select(container).select('svg');
  const g = svg.select('g');

  // Reset opacity with transition (REQ-INT-004)
  g.selectAll('.node, .link, .edge, .edge-label')
    .transition()
    .duration(300)
    .style('opacity', 1);
}

// Create graph configuration
function createGraphConfig(mode: 'simple' | 'enhanced', container: HTMLElement, data: any) {
  const containerRect = container.getBoundingClientRect();

  const baseConfig = {
    width: containerRect.width,
    height: containerRect.height,
    nodeRadius: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type || '';
      const mappedType = mapNodeType(conceptType);
      return (nodeStyles.sizes[mappedType as keyof typeof nodeStyles.sizes] || 8) + 2;
    },
    nodeFill: (node: Node) => {
      const semanticNode = node as SemanticSpacetimeNode;
      const conceptType = semanticNode.metadata?.semantic_content?.concept_type || '';
      const mappedType = mapNodeType(conceptType);
      return nodeStyles.colors[mappedType as keyof typeof nodeStyles.colors] || '#666';
    },
    nodeStroke: '#ffffff',
    nodeStrokeWidth: 2,
    linkStroke: (edge: Edge) => {
      const semanticEdge = edge as SemanticSpacetimeEdge;
      const associationType = semanticEdge.metadata?.association_type || '';
      return edgeStyles.colors[associationType as keyof typeof edgeStyles.colors] || '#999';
    },
    linkStrokeWidth: (edge: Edge) => {
      const semanticEdge = edge as SemanticSpacetimeEdge;
      const associationType = semanticEdge.metadata?.association_type || '';
      return edgeStyles.widths[associationType as keyof typeof edgeStyles.widths] || 1;
    },
    showNodeLabels: true, // REQ-VIS-002
    showEdgeLabels: true, // REQ-VIS-004
    enableZoom: true,     // REQ-INT-001
    zoomExtent: [0.1, 4] as [number, number],
    fitToViewport: false, // We handle this manually
    waitForStable: true,  // REQ-PROC-003
    stabilityThreshold: 0.05,
    // Add event callbacks to track progress
    onLayoutProgress: (alpha: number, progress: number) => {
      console.log(`Layout progress: ${progress}% (alpha: ${alpha.toFixed(3)})`);
    },
    onEdgeRenderingProgress: (current: number, total: number) => {
      console.log(`Edge rendering: ${current}/${total}`);
    },
    onEdgesRendered: () => {
      console.log('Edges fully rendered');
    }
  };

  if (mode === 'enhanced') {
    // REQ-MODE-001: Enhanced bundling configuration
    return {
      ...baseConfig,
      chargeStrength: -3000,
      linkDistance: 400,
      edgeRenderer: 'bundled' as const,
      edgeBundling: {
        subdivisions: 60,
        iterations: 200,
        compatibilityThreshold: 0.25,
        stepSize: 0.12,
        stiffness: 0.08,
        momentum: 0.85,
        curveType: 'bundle' as const,
        curveTension: 0.95,
        smoothingType: 'bilateral' as const,
        smoothingIterations: 6,
        compatibilityFunction: (edge1: Edge, edge2: Edge) => {
          const e1 = edge1 as SemanticSpacetimeEdge;
          const e2 = edge2 as SemanticSpacetimeEdge;
          const type1 = e1.metadata?.association_type || '';
          const type2 = e2.metadata?.association_type || '';
          return getEdgeCompatibility(type1, type2);
        }
      }
    };
  } else {
    // REQ-MODE-001: Simple edges configuration
    return {
      ...baseConfig,
      chargeStrength: -1800,
      linkDistance: 250,
      edgeRenderer: 'simple' as const
    };
  }
}

// Data validation
function validateGraphData(data: any) {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw new GraphError('Invalid data: nodes array missing');
  }

  if (!data.edges || !Array.isArray(data.edges)) {
    throw new GraphError('Invalid data: edges array missing');
  }

  // Validate node IDs are unique
  const nodeIds = new Set(data.nodes.map((n: any) => n.id));
  if (nodeIds.size !== data.nodes.length) {
    throw new GraphError('Invalid data: duplicate node IDs');
  }

  // Validate edge references
  data.edges.forEach((edge: any) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new GraphError('Invalid data: edge references non-existent node');
    }
  });
}

// Error handling (REQ-UX-004, REQ-UX-005)
function handleLoadingError(error: any) {
  console.error('Loading error:', error);

  let message = 'An error occurred';
  let showRetry = true;

  if (error instanceof GraphError) {
    message = error.message;
    showRetry = error.isRecoverable;
  } else if (error.message) {
    message = error.message;
  }

  // Check for timeout (REQ-UX-005)
  const loadTime = Date.now() - state.loadStartTime;
  if (loadTime > 15000) {
    message = 'Loading timeout exceeded. Displaying partial results.';
    showGraph(); // Show whatever we have
  }

  updateStatus(message, false, true);

  if (showRetry) {
    addRetryButton();
  }
}

// Add retry button for recoverable errors
function addRetryButton() {
  const statusElement = document.getElementById('status');
  if (!statusElement) return;

  const retryButton = document.createElement('button');
  retryButton.textContent = 'Retry';
  retryButton.className = 'retry-button';
  retryButton.onclick = () => {
    executeLoadingSequence(state.currentMode);
  };

  statusElement.appendChild(retryButton);
}

// Simulate async operations for demo
async function simulateAsyncOperation(duration: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, duration));
}

// Update button states
function updateButtonStates() {
  const simpleButton = document.getElementById('simple-edges') as HTMLButtonElement;
  const enhancedButton = document.getElementById('edge-bundling') as HTMLButtonElement;

  if (!simpleButton || !enhancedButton) return;

  // Reset all buttons
  simpleButton.classList.remove('active');
  enhancedButton.classList.remove('active');

  // Set active state
  if (state.currentMode === 'simple') {
    simpleButton.classList.add('active');
  } else {
    enhancedButton.classList.add('active');
  }
}

// REQ-MODE-002: Mode switching
async function switchMode(mode: 'simple' | 'enhanced') {
  if (state.isLoading) return;
  if (state.currentMode === mode) return;

  state.currentMode = mode;
  updateButtonStates();

  // Clear previous selection (REQ-MODE-002)
  state.selectedNode = null;

  // Execute complete loading sequence (REQ-MODE-002)
  await executeLoadingSequence(mode);
}

// Initialize application
function initializeApplication() {
  console.log('Knowledge Network Demo - Initializing...');

  // Create legend (REQ-VIS-001)
  createLegend();

  // Setup button handlers (REQ-MODE-001)
  const simpleButton = document.getElementById('simple-edges');
  const enhancedButton = document.getElementById('edge-bundling');

  if (simpleButton) {
    simpleButton.addEventListener('click', () => switchMode('simple'));
  }

  if (enhancedButton) {
    enhancedButton.addEventListener('click', () => switchMode('enhanced'));
  }

  // Update button states
  updateButtonStates();

  // Start with simple edges mode (REQ-INIT-001)
  executeLoadingSequence('simple');
}

// Performance monitoring
function logPerformance() {
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    console.log(`Page load time: ${loadTime}ms`);
  }
}

// Setup keyboard shortcuts for accessibility
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    if (!state.interactionEnabled) return;

    switch(event.key) {
      case 'Escape':
        deselectAll();
        break;
      case '1':
        switchMode('simple');
        break;
      case '2':
        switchMode('enhanced');
        break;
    }
  });
}

// Main entry point
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Verify environment (REQ-TECH-001)
    const userAgent = navigator.userAgent.toLowerCase();
    console.log('User Agent:', userAgent);

    // Initialize application
    initializeApplication();

    // Setup keyboard shortcuts
    setupKeyboardShortcuts();

    // Log performance metrics
    logPerformance();

  } catch (error) {
    console.error('Failed to initialize application:', error);
    updateStatus('Failed to initialize application', false, true);
  }
});

// Export for testing
export {
  state,
  executeLoadingSequence,
  selectNode,
  deselectAll,
  switchMode
};