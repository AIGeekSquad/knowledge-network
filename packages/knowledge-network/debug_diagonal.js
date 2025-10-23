// Debug diagonal ray intersection issue
import { RaycastingSystem } from './src/spatial/RaycastingSystem.js';
import { QuadTree } from './src/spatial/QuadTree.js';

const config = {
  maxDepth: 6,
  maxNodesPerLeaf: 4,
  enableCaching: false,
  cacheSize: 0,
  rayIntersectionTolerance: 5.0,
  pointQueryTolerance: 0.1,
};

const raycastingSystem = new RaycastingSystem(config);
const quadTree = new QuadTree(config);

const nodes2D = [
  { id: 'n1', x: 10, y: 50 },
  { id: 'n2', x: 30, y: 50 },
  { id: 'n3', x: 50, y: 50 },
  { id: 'n4', x: 70, y: 50 },
  { id: 'n5', x: 90, y: 50 },
  { id: 'n6', x: 50, y: 10 },
  { id: 'n7', x: 50, y: 90 },
];

console.log('Building QuadTree with nodes:', nodes2D);
quadTree.build(nodes2D);

const ray = {
  origin: { x: 0, y: 0 },
  direction: { x: 1, y: 1 }
};

console.log('Testing ray:', ray);

const intersections = raycastingSystem.raycast2D(ray, quadTree);
console.log('Intersections found:', intersections.length);
console.log('Intersections:', intersections);

// Check if the expected node (50,50) is in the tree
const root = quadTree.getRoot();
console.log('QuadTree root bounds:', root?.bounds);

function printTree(node, depth = 0) {
  const indent = '  '.repeat(depth);
  console.log(`${indent}Node bounds:`, node.bounds);
  console.log(`${indent}Node children:`, node.nodes?.length || 0, 'nodes');
  if (node.nodes) {
    node.nodes.forEach(n => console.log(`${indent}  - ${n.id}: (${n.x}, ${n.y})`));
  }
  if (node.children) {
    node.children.forEach(child => printTree(child, depth + 1));
  }
}

console.log('\nQuadTree structure:');
if (root) printTree(root);