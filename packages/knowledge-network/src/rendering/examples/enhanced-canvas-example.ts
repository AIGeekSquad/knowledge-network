/**
 * Enhanced Canvas Renderer Usage Examples
 *
 * Demonstrates how to use the spatial-aware canvas renderer
 * for high-performance graph visualization with interaction.
 */

import {
  SpatialCanvasFactory,
  SpatialInteractionHelpers,
  PerformanceMonitor,
  PERFORMANCE_PRESETS,
  type CanvasRenderingConfig
} from '../SpatialCanvasIntegration';
import type { LayoutResult, PositionedNode, PositionedEdge } from '../../layout/LayoutEngine';
import type { RenderConfig } from '../IRenderer';

/**
 * Example 1: Basic Enhanced Canvas Usage
 */
export function basicEnhancedCanvasExample() {
  // Create renderer with balanced preset
  const renderer = SpatialCanvasFactory.create('balanced');

  // Initialize with container
  const container = document.getElementById('graph-container')!;
  const config: CanvasRenderingConfig = {
    ...PERFORMANCE_PRESETS.balanced.config,
    width: container.clientWidth,
    height: container.clientHeight,
  };

  renderer.initialize(container, config);

  // Create sample data
  const layout: LayoutResult = createSampleLayout();

  // Render with spatial optimization
  const renderConfig: RenderConfig = {
    nodeConfig: {
      radius: 8,
      fill: (node: PositionedNode) => node.group ? '#ff6b35' : '#69b3a2',
      stroke: '#fff',
      strokeWidth: 2,
    },
    edgeConfig: {
      stroke: '#999',
      strokeWidth: 1.5,
      opacity: 0.6,
    },
    labelConfig: {
      fontSize: 12,
      fill: '#333',
    },
  };

  renderer.render(layout, renderConfig);

  // Spatial queries
  renderer.getContainer().addEventListener('click', (event) => {
    const rect = renderer.getContainer().getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const clickedNode = renderer.getNodeAt(x, y);
    if (clickedNode) {
      console.log('Clicked node:', clickedNode);
      renderer.highlightNodes([clickedNode.id]);
    }
  });

  return renderer;
}

/**
 * Example 2: Large Graph Optimization
 */
export function largeGraphExample() {
  // Use optimized preset for large graphs
  const renderer = SpatialCanvasFactory.create('largeGraph');

  const container = document.getElementById('large-graph-container')!;
  renderer.initialize(container, PERFORMANCE_PRESETS.largeGraph.config);

  // Generate large dataset
  const largeLayout = generateLargeLayout(2000);

  const renderConfig: RenderConfig = {
    nodeConfig: {
      radius: 6, // Smaller nodes for large graphs
      fill: '#4CAF50',
      stroke: '#fff',
      strokeWidth: 1,
    },
    edgeConfig: {
      stroke: '#757575',
      strokeWidth: 1,
      opacity: 0.4, // More transparent edges
    },
    labelConfig: {
      fontSize: 10,
      fill: '#333',
    },
  };

  renderer.render(largeLayout, renderConfig);

  // Setup viewport controls for navigation
  setupViewportControls(renderer);

  return renderer;
}

/**
 * Example 3: Interactive Graph with Full Feature Set
 */
export function interactiveGraphExample() {
  const renderer = SpatialCanvasFactory.create('highQuality');

  const container = document.getElementById('interactive-container')!;
  renderer.initialize(container, {
    ...PERFORMANCE_PRESETS.highQuality.config,
    enableMouseInteraction: true,
  });

  const layout = createSampleLayout();
  const renderConfig: RenderConfig = {
    nodeConfig: {
      radius: 10,
      fill: '#2196F3',
      stroke: '#fff',
      strokeWidth: 2,
      shape: 'circle',
    },
    edgeConfig: {
      stroke: '#757575',
      strokeWidth: 2,
      opacity: 0.7,
    },
  };

  renderer.render(layout, renderConfig);

  // Setup comprehensive interactions
  const cleanupInteractions = SpatialInteractionHelpers.setupMouseInteractions(renderer, {
    enableHover: true,
    enableSelection: true,
    enablePanning: true,
    enableZooming: true,

    onNodeHover: (node) => {
      // Highlight hovered node
      renderer.highlightNodes([node.id]);

      // Show tooltip
      showTooltip(node, event as MouseEvent);
    },

    onNodeClick: (node) => {
      console.log('Selected node:', node);

      // Find connected nodes
      const connectedNodes = findConnectedNodes(node.id, layout.edges);
      renderer.highlightNodes([node.id, ...connectedNodes]);
    },
  });

  // Setup region selection
  const cleanupRegionSelection = SpatialInteractionHelpers.setupRegionSelection(
    renderer,
    (selectedNodes) => {
      console.log('Selected nodes in region:', selectedNodes);
      const nodeIds = selectedNodes.map(n => n.id);
      renderer.highlightNodes(nodeIds);
    }
  );

  // Setup keyboard shortcuts
  const cleanupKeyboard = SpatialInteractionHelpers.setupKeyboardShortcuts(renderer);

  // Return cleanup function
  return () => {
    cleanupInteractions();
    cleanupRegionSelection();
    cleanupKeyboard();
    renderer.destroy();
  };
}

/**
 * Example 4: Performance Monitoring
 */
export function performanceMonitoringExample() {
  const renderer = SpatialCanvasFactory.create('balanced');
  const monitor = new PerformanceMonitor();

  const container = document.getElementById('monitored-container')!;
  renderer.initialize(container, PERFORMANCE_PRESETS.balanced.config);

  // Start monitoring
  const stopMonitoring = monitor.monitor(renderer);

  // Render different sized layouts to test performance
  const layouts = [
    generateLargeLayout(100),
    generateLargeLayout(500),
    generateLargeLayout(1000),
    generateLargeLayout(2000),
  ];

  let layoutIndex = 0;
  const renderConfig: RenderConfig = {
    nodeConfig: { radius: 8, fill: '#FF9800' },
    edgeConfig: { stroke: '#757575', strokeWidth: 1 },
  };

  // Cycle through layouts every 2 seconds
  const intervalId = setInterval(() => {
    renderer.render(layouts[layoutIndex], renderConfig);
    layoutIndex = (layoutIndex + 1) % layouts.length;

    // Show performance stats
    const stats = monitor.getStats();
    console.log('Performance Stats:', stats);

    // Show recommendations
    if (stats.recommendations.length > 0) {
      console.log('Recommendations:', stats.recommendations);
    }
  }, 2000);

  // Cleanup function
  return () => {
    clearInterval(intervalId);
    stopMonitoring();
    renderer.destroy();
  };
}

/**
 * Example 5: Mobile-Optimized Graph
 */
export function mobileOptimizedExample() {
  const renderer = SpatialCanvasFactory.createMobile();

  const container = document.getElementById('mobile-container')!;
  renderer.initialize(container, {
    width: Math.min(window.innerWidth - 20, 400),
    height: Math.min(window.innerHeight - 100, 300),
    enableViewportCulling: true,
    enableLevelOfDetail: true,
    pixelDensity: Math.min(window.devicePixelRatio || 1, 2),
  });

  const layout = createSampleLayout();
  const mobileRenderConfig: RenderConfig = {
    nodeConfig: {
      radius: 12, // Larger for touch interaction
      fill: '#E91E63',
      stroke: '#fff',
      strokeWidth: 2,
    },
    edgeConfig: {
      stroke: '#757575',
      strokeWidth: 2,
      opacity: 0.6,
    },
    labelConfig: {
      fontSize: 14, // Larger for mobile
      fill: '#333',
    },
  };

  renderer.render(layout, mobileRenderConfig);

  // Setup touch-friendly interactions
  setupTouchInteractions(renderer);

  return renderer;
}

/**
 * Example 6: Custom Styling and Animation
 */
export function customStyledExample() {
  const renderer = SpatialCanvasFactory.create('highQuality');

  const container = document.getElementById('styled-container')!;
  renderer.initialize(container, PERFORMANCE_PRESETS.highQuality.config);

  const layout = createSampleLayout();

  // Custom node styling based on data
  const renderConfig: RenderConfig = {
    nodeConfig: {
      radius: (node: PositionedNode) => {
        // Vary size based on connections or importance
        return Math.max(6, Math.min(20, (node.connections || 1) * 3));
      },
      fill: (node: PositionedNode) => {
        // Color by category or other attributes
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
        return colors[(node.category || 0) % colors.length];
      },
      stroke: '#fff',
      strokeWidth: 2,
      shape: (node: PositionedNode) => {
        // Different shapes for different types
        const shapes = ['circle', 'square', 'diamond', 'triangle'];
        return shapes[(node.type || 0) % shapes.length];
      },
    },
    edgeConfig: {
      stroke: (edge: PositionedEdge) => {
        // Color edges by relationship type
        return edge.relationship === 'strong' ? '#FF6B35' : '#95A5A6';
      },
      strokeWidth: (edge: PositionedEdge) => {
        return edge.weight ? edge.weight * 2 : 1;
      },
      opacity: 0.7,
    },
  };

  renderer.render(layout, renderConfig);

  // Animate highlighting
  animateHighlights(renderer, layout);

  return renderer;
}

// === Helper Functions ===

function createSampleLayout(): LayoutResult {
  const nodes: PositionedNode[] = [
    { id: '1', x: 100, y: 100, label: 'Node 1', group: 'A', connections: 3 },
    { id: '2', x: 200, y: 150, label: 'Node 2', group: 'B', connections: 2 },
    { id: '3', x: 300, y: 100, label: 'Node 3', group: 'A', connections: 4 },
    { id: '4', x: 250, y: 250, label: 'Node 4', group: 'C', connections: 1 },
    { id: '5', x: 150, y: 300, label: 'Node 5', group: 'B', connections: 2 },
  ];

  const edges: PositionedEdge[] = [
    { id: 'e1', source: nodes[0], target: nodes[1], relationship: 'strong', weight: 2 },
    { id: 'e2', source: nodes[1], target: nodes[2], relationship: 'weak', weight: 1 },
    { id: 'e3', source: nodes[2], target: nodes[3], relationship: 'strong', weight: 3 },
    { id: 'e4', source: nodes[3], target: nodes[4], relationship: 'weak', weight: 1 },
    { id: 'e5', source: nodes[4], target: nodes[0], relationship: 'strong', weight: 2 },
  ];

  return { nodes, edges };
}

function generateLargeLayout(nodeCount: number): LayoutResult {
  const nodes: PositionedNode[] = [];
  const edges: PositionedEdge[] = [];

  // Generate nodes in a grid-like pattern with some randomness
  const cols = Math.ceil(Math.sqrt(nodeCount));
  const spacing = 30;

  for (let i = 0; i < nodeCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    nodes.push({
      id: `node-${i}`,
      x: col * spacing + Math.random() * 10 - 5,
      y: row * spacing + Math.random() * 10 - 5,
      label: `Node ${i}`,
      category: Math.floor(Math.random() * 5),
      type: Math.floor(Math.random() * 4),
      connections: Math.floor(Math.random() * 8) + 1,
    });
  }

  // Generate edges (each node connects to 1-3 nearby nodes)
  for (let i = 0; i < nodeCount; i++) {
    const connections = Math.min(3, Math.floor(Math.random() * 3) + 1);

    for (let j = 0; j < connections; j++) {
      const targetIndex = Math.min(nodeCount - 1, i + Math.floor(Math.random() * 10) + 1);
      if (targetIndex !== i) {
        edges.push({
          id: `edge-${i}-${targetIndex}`,
          source: nodes[i],
          target: nodes[targetIndex],
          relationship: Math.random() > 0.5 ? 'strong' : 'weak',
          weight: Math.random() * 3 + 0.5,
        });
      }
    }
  }

  return { nodes, edges };
}

function setupViewportControls(renderer: any) {
  // Create control panel
  const controls = document.createElement('div');
  controls.style.position = 'absolute';
  controls.style.top = '10px';
  controls.style.left = '10px';
  controls.style.background = 'rgba(255,255,255,0.9)';
  controls.style.padding = '10px';
  controls.style.borderRadius = '5px';

  // Zoom controls
  const zoomIn = document.createElement('button');
  zoomIn.textContent = 'Zoom In';
  zoomIn.onclick = () => {
    const transform = renderer.getTransform();
    renderer.setZoom(transform.scale * 1.2);
  };

  const zoomOut = document.createElement('button');
  zoomOut.textContent = 'Zoom Out';
  zoomOut.onclick = () => {
    const transform = renderer.getTransform();
    renderer.setZoom(transform.scale / 1.2);
  };

  const resetView = document.createElement('button');
  resetView.textContent = 'Reset View';
  resetView.onclick = () => renderer.fitToViewport();

  controls.appendChild(zoomIn);
  controls.appendChild(zoomOut);
  controls.appendChild(resetView);

  renderer.getContainer().parentElement?.appendChild(controls);
}

function showTooltip(node: PositionedNode, event: MouseEvent) {
  // Simple tooltip implementation
  let tooltip = document.getElementById('node-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'node-tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(0,0,0,0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '3px';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.zIndex = '1000';
    document.body.appendChild(tooltip);
  }

  tooltip.textContent = `${node.label || node.id} (${node.connections || 0} connections)`;
  tooltip.style.left = `${event.clientX + 10}px`;
  tooltip.style.top = `${event.clientY - 30}px`;
  tooltip.style.display = 'block';

  // Hide tooltip after delay
  setTimeout(() => {
    if (tooltip) tooltip.style.display = 'none';
  }, 2000);
}

function findConnectedNodes(nodeId: string, edges: PositionedEdge[]): string[] {
  const connected: string[] = [];

  for (const edge of edges) {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;

    if (sourceId === nodeId) {
      connected.push(targetId);
    } else if (targetId === nodeId) {
      connected.push(sourceId);
    }
  }

  return connected;
}

function setupTouchInteractions(renderer: any) {
  const container = renderer.getContainer();

  // Touch-friendly selection with larger tolerance
  container.addEventListener('touchstart', (event: TouchEvent) => {
    event.preventDefault();

    const touch = event.touches[0];
    const rect = container.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const node = renderer.getNodeAt(x, y);
    if (node) {
      renderer.highlightNodes([node.id]);
    }
  });

  // Pinch to zoom (simplified)
  let lastTouchDistance = 0;

  container.addEventListener('touchmove', (event: TouchEvent) => {
    if (event.touches.length === 2) {
      event.preventDefault();

      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (lastTouchDistance > 0) {
        const scale = distance / lastTouchDistance;
        const currentZoom = renderer.getTransform().scale;
        renderer.setZoom(currentZoom * scale);
      }

      lastTouchDistance = distance;
    }
  });

  container.addEventListener('touchend', () => {
    lastTouchDistance = 0;
  });
}

function animateHighlights(renderer: any, layout: LayoutResult) {
  let currentIndex = 0;

  const animationInterval = setInterval(() => {
    if (currentIndex < layout.nodes.length) {
      const nodeToHighlight = layout.nodes[currentIndex];
      renderer.highlightNodes([nodeToHighlight.id]);
      currentIndex++;
    } else {
      renderer.clearHighlights();
      currentIndex = 0;
    }
  }, 1000);

  // Cleanup after 10 seconds
  setTimeout(() => {
    clearInterval(animationInterval);
    renderer.clearHighlights();
  }, 10000);
}

// === Export all examples for easy access ===
export const EnhancedCanvasExamples = {
  basic: basicEnhancedCanvasExample,
  largeGraph: largeGraphExample,
  interactive: interactiveGraphExample,
  performance: performanceMonitoringExample,
  mobile: mobileOptimizedExample,
  customStyling: customStyledExample,
};