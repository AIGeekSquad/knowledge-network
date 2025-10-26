/**
 * Mobile Dataset Generator
 *
 * Generates optimized graph datasets specifically designed for mobile touch interactions.
 * Provides Xbox-themed data with appropriate node sizes and touch target optimization.
 */

import type { GraphNode, GraphEdge } from '../../../shared/types.js';

/**
 * Mobile-optimized dataset configuration
 */
interface MobileDatasetConfig {
  nodeCount?: number;
  edgeCount?: number;
  touchTargetSize: number;
  clustering?: boolean;
  hierarchical?: boolean;
}

/**
 * Generate a mobile-optimized dataset with appropriate touch targets
 */
export function generateMobileDataset(touchTargetSize: number): any {
  const config: MobileDatasetConfig = {
    nodeCount: 150, // Optimal for mobile performance
    edgeCount: 200,
    touchTargetSize,
    clustering: true,
    hierarchical: false
  };

  const nodes = generateMobileNodes(config);
  const edges = generateMobileEdges(nodes, config);

  return {
    nodes,
    edges,
    targetSize: touchTargetSize,
    metadata: {
      optimizedForMobile: true,
      xboxThemed: true,
      touchTargetSize,
      generatedAt: Date.now()
    }
  };
}

/**
 * Generate mobile gaming-themed dataset
 */
export function generateGamingDataset(): any {
  const xboxGames = [
    'Halo Infinite', 'Forza Horizon 5', 'Gears 5', 'Sea of Thieves',
    'Minecraft', 'Age of Empires IV', 'Flight Simulator', 'Ori and the Will of the Wisps',
    'Cuphead', 'Psychonauts 2', 'It Takes Two', 'Biomutant',
    'The Medium', 'Scarlet Nexus', 'Yakuza: Like a Dragon', 'Control'
  ];

  const genres = [
    'Action', 'Adventure', 'RPG', 'Strategy', 'Racing', 'Simulation',
    'Platformer', 'Puzzle', 'Horror', 'Fighting', 'Sports'
  ];

  const platforms = ['Xbox Series X/S', 'Xbox One', 'PC', 'Mobile', 'Cloud'];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create game nodes
  xboxGames.forEach((game, index) => {
    nodes.push({
      id: `game-${index}`,
      label: game,
      type: 'game',
      size: Math.random() * 20 + 15, // Touch-friendly sizes
      color: getXboxGameColor(index),
      category: 'games',
      metadata: {
        touchTarget: true,
        platform: platforms[Math.floor(Math.random() * platforms.length)],
        genre: genres[Math.floor(Math.random() * genres.length)]
      }
    });
  });

  // Create genre nodes
  genres.forEach((genre, index) => {
    nodes.push({
      id: `genre-${index}`,
      label: genre,
      type: 'genre',
      size: 25,
      color: '#ffb900', // Xbox gold
      category: 'genres',
      metadata: {
        touchTarget: true,
        isCategory: true
      }
    });
  });

  // Create platform nodes
  platforms.forEach((platform, index) => {
    nodes.push({
      id: `platform-${index}`,
      label: platform,
      type: 'platform',
      size: 30,
      color: '#1570a6', // Xbox blue
      category: 'platforms',
      metadata: {
        touchTarget: true,
        isPlatform: true
      }
    });
  });

  // Create edges between games and genres
  nodes.filter(n => n.type === 'game').forEach((gameNode, index) => {
    const genreIndex = Math.floor(Math.random() * genres.length);
    edges.push({
      id: `game-genre-${index}`,
      source: gameNode.id,
      target: `genre-${genreIndex}`,
      type: 'belongs-to',
      weight: 1,
      color: 'rgba(16, 124, 16, 0.6)'
    });
  });

  // Create edges between games and platforms
  nodes.filter(n => n.type === 'game').forEach((gameNode, index) => {
    const platformCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < platformCount; i++) {
      const platformIndex = Math.floor(Math.random() * platforms.length);
      edges.push({
        id: `game-platform-${index}-${i}`,
        source: gameNode.id,
        target: `platform-${platformIndex}`,
        type: 'available-on',
        weight: 0.8,
        color: 'rgba(21, 112, 166, 0.6)'
      });
    }
  });

  return {
    nodes,
    edges,
    targetSize: 44,
    metadata: {
      optimizedForMobile: true,
      xboxThemed: true,
      theme: 'gaming',
      generatedAt: Date.now()
    }
  };
}

/**
 * Generate touch gesture training dataset
 */
export function generateGestureTrainingDataset(): any {
  const gestures = [
    'Tap', 'Double Tap', 'Long Press', 'Pinch Zoom', 'Pan', 'Rotate',
    'Swipe Left', 'Swipe Right', 'Swipe Up', 'Swipe Down', 'Multi-Touch'
  ];

  const interactions = [
    'Select Node', 'Zoom In', 'Zoom Out', 'Pan Graph', 'Rotate View',
    'Open Context Menu', 'Navigate Left', 'Navigate Right', 'Navigate Up',
    'Navigate Down', 'Multi-Select'
  ];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Create gesture nodes
  gestures.forEach((gesture, index) => {
    nodes.push({
      id: `gesture-${index}`,
      label: gesture,
      type: 'gesture',
      size: 35, // Large touch targets
      color: getXboxGestureColor(gesture),
      category: 'gestures',
      metadata: {
        touchTarget: true,
        gestureType: gesture.toLowerCase().replace(/\s+/g, '-'),
        difficulty: getGestureDifficulty(gesture)
      }
    });
  });

  // Create interaction nodes
  interactions.forEach((interaction, index) => {
    nodes.push({
      id: `interaction-${index}`,
      label: interaction,
      type: 'interaction',
      size: 30,
      color: '#107c10', // Xbox green
      category: 'interactions',
      metadata: {
        touchTarget: true,
        actionType: interaction.toLowerCase().replace(/\s+/g, '-')
      }
    });
  });

  // Create mappings between gestures and interactions
  const gestureToInteraction = [
    [0, 0], [1, 4], [2, 5], [3, 1], [4, 3], [5, 4],
    [6, 6], [7, 7], [8, 8], [9, 9], [10, 10]
  ];

  gestureToInteraction.forEach(([gestureIndex, interactionIndex], index) => {
    edges.push({
      id: `mapping-${index}`,
      source: `gesture-${gestureIndex}`,
      target: `interaction-${interactionIndex}`,
      type: 'triggers',
      weight: 1,
      color: 'rgba(16, 124, 16, 0.8)'
    });
  });

  return {
    nodes,
    edges,
    targetSize: 44,
    metadata: {
      optimizedForMobile: true,
      xboxThemed: true,
      theme: 'gesture-training',
      generatedAt: Date.now()
    }
  };
}

/**
 * Generate performance testing dataset with various sizes
 */
export function generatePerformanceTestDataset(nodeCount: number, touchTargetSize: number): any {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Generate nodes with Xbox theming
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Node ${i}`,
      type: 'test',
      size: Math.max(touchTargetSize / 2, Math.random() * 15 + 10),
      color: getXboxPerformanceColor(i, nodeCount),
      category: 'performance',
      metadata: {
        touchTarget: true,
        index: i,
        performance: true
      }
    });
  }

  // Generate edges with clustering
  const edgeCount = Math.min(nodeCount * 1.5, nodeCount * nodeCount * 0.1);

  for (let i = 0; i < edgeCount; i++) {
    const source = Math.floor(Math.random() * nodeCount);
    let target = Math.floor(Math.random() * nodeCount);

    // Avoid self-loops
    while (target === source) {
      target = Math.floor(Math.random() * nodeCount);
    }

    edges.push({
      id: `edge-${i}`,
      source: `node-${source}`,
      target: `node-${target}`,
      type: 'connection',
      weight: Math.random(),
      color: 'rgba(16, 124, 16, 0.5)'
    });
  }

  return {
    nodes,
    edges,
    targetSize: touchTargetSize,
    metadata: {
      optimizedForMobile: true,
      xboxThemed: true,
      theme: 'performance',
      nodeCount,
      edgeCount: edges.length,
      generatedAt: Date.now()
    }
  };
}

// Private helper functions

function generateMobileNodes(config: MobileDatasetConfig): GraphNode[] {
  const nodes: GraphNode[] = [];
  const nodeCount = config.nodeCount || 150;

  for (let i = 0; i < nodeCount; i++) {
    nodes.push({
      id: `node-${i}`,
      label: `Mobile Node ${i}`,
      type: 'mobile',
      size: Math.max(config.touchTargetSize / 2, Math.random() * 20 + 10),
      color: getXboxMobileColor(i),
      category: 'mobile',
      metadata: {
        touchTarget: true,
        optimized: true,
        cluster: config.clustering ? Math.floor(i / 30) : 0
      }
    });
  }

  return nodes;
}

function generateMobileEdges(nodes: GraphNode[], config: MobileDatasetConfig): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const edgeCount = config.edgeCount || nodes.length * 1.3;

  for (let i = 0; i < edgeCount; i++) {
    const source = Math.floor(Math.random() * nodes.length);
    let target = Math.floor(Math.random() * nodes.length);

    // Avoid self-loops
    while (target === source) {
      target = Math.floor(Math.random() * nodes.length);
    }

    edges.push({
      id: `edge-${i}`,
      source: nodes[source].id,
      target: nodes[target].id,
      type: 'mobile-connection',
      weight: Math.random() * 0.8 + 0.2,
      color: 'rgba(16, 124, 16, 0.6)'
    });
  }

  return edges;
}

function getXboxMobileColor(index: number): string {
  const colors = [
    '#107c10', // Xbox green
    '#1570a6', // Xbox blue
    '#ffb900', // Xbox gold
    '#d13438', // Xbox red
    '#8c5ac8', // Xbox purple
    '#00bcf2'  // Xbox cyan
  ];

  return colors[index % colors.length];
}

function getXboxGameColor(index: number): string {
  const gameColors = [
    '#107c10', '#1570a6', '#ffb900', '#d13438',
    '#8c5ac8', '#00bcf2', '#ff6b35', '#2d7d32'
  ];

  return gameColors[index % gameColors.length];
}

function getXboxGestureColor(gesture: string): string {
  const gestureColors: Record<string, string> = {
    'Tap': '#107c10',
    'Double Tap': '#1570a6',
    'Long Press': '#d13438',
    'Pinch Zoom': '#ffb900',
    'Pan': '#8c5ac8',
    'Rotate': '#00bcf2',
    'Swipe Left': '#ff6b35',
    'Swipe Right': '#ff6b35',
    'Swipe Up': '#2d7d32',
    'Swipe Down': '#2d7d32',
    'Multi-Touch': '#ff4081'
  };

  return gestureColors[gesture] || '#107c10';
}

function getXboxPerformanceColor(index: number, total: number): string {
  // Create gradient from green to blue based on position
  const ratio = index / total;
  const green = Math.floor(16 + (112 * (1 - ratio)));
  const blue = Math.floor(16 + (196 * ratio));

  return `rgb(${green}, 124, ${blue})`;
}

function getGestureDifficulty(gesture: string): 'easy' | 'medium' | 'hard' {
  const easyGestures = ['Tap', 'Double Tap', 'Long Press'];
  const mediumGestures = ['Pan', 'Swipe Left', 'Swipe Right', 'Swipe Up', 'Swipe Down'];
  const hardGestures = ['Pinch Zoom', 'Rotate', 'Multi-Touch'];

  if (easyGestures.includes(gesture)) return 'easy';
  if (mediumGestures.includes(gesture)) return 'medium';
  return 'hard';
}