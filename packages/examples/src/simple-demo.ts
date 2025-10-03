// Simple demo that ACTUALLY WORKS
import * as d3 from 'd3';

// Import the built library
import { KnowledgeGraph } from '../../knowledge-network/dist/index.js';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('graph');
  if (!container) return;
  
  // Clear container
  container.innerHTML = '';
  container.style.height = '600px';
  
  // Simple test data
  const nodes = [
    { id: 'a', label: 'Node A' },
    { id: 'b', label: 'Node B' },
    { id: 'c', label: 'Node C' },
    { id: 'd', label: 'Node D' },
    { id: 'e', label: 'Node E' },
    { id: 'f', label: 'Node F' }
  ];
  
  const edges = [
    { source: 'a', target: 'd' },
    { source: 'b', target: 'd' },
    { source: 'c', target: 'd' },
    { source: 'a', target: 'e' },
    { source: 'b', target: 'e' },
    { source: 'c', target: 'f' }
  ];
  
  // Create simple edges example
  document.getElementById('example4')?.addEventListener('click', () => {
    container.innerHTML = '';
    const graph = new KnowledgeGraph(
      container,
      { nodes, edges },
      {
        edgeRenderer: 'simple',
        waitForStable: false
      }
    );
    graph.render();
    console.log('Simple edges rendered');
  });
  
  // Create bundled edges example  
  document.getElementById('example5')?.addEventListener('click', () => {
    container.innerHTML = '';
    const graph = new KnowledgeGraph(
      container,
      { nodes, edges },
      {
        edgeRenderer: 'bundled',
        edgeBundling: {
          subdivisions: 20,
          iterations: 60
        },
        waitForStable: false
      }
    );
    graph.render();
    console.log('Bundled edges rendered');
  });
  
  // Auto-show simple edges on load
  const graph = new KnowledgeGraph(
    container,
    { nodes, edges },
    {
      edgeRenderer: 'simple',
      waitForStable: false
    }
  );
  graph.render();
});