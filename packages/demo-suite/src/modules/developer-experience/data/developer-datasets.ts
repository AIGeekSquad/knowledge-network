/**
 * Developer Dataset Generator
 *
 * Generates datasets optimized for developer experience and code examples.
 */

import type { GraphNode, GraphEdge } from '../../../shared/types.js';

/**
 * Generate developer-focused dataset
 */
export function generateDeveloperDatasets(): any {
  const frameworks = ['React', 'Vue', 'Angular', 'Svelte'];
  const libraries = ['D3.js', 'Three.js', 'Chart.js', 'Plotly', 'Cytoscape.js'];
  const concepts = ['Components', 'Hooks', 'State', 'Props', 'Events', 'Lifecycle'];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Framework nodes
  frameworks.forEach((framework, index) => {
    nodes.push({
      id: `framework-${index}`,
      label: framework,
      type: 'framework',
      size: 30,
      color: '#107c10',
      category: 'frameworks',
      metadata: {
        type: 'framework',
        popularity: Math.random() * 100,
        examples: 5 + Math.floor(Math.random() * 10)
      }
    });
  });

  // Library nodes
  libraries.forEach((library, index) => {
    nodes.push({
      id: `library-${index}`,
      label: library,
      type: 'library',
      size: 25,
      color: '#1570a6',
      category: 'libraries',
      metadata: {
        type: 'library',
        integration: 'available'
      }
    });
  });

  // Concept nodes
  concepts.forEach((concept, index) => {
    nodes.push({
      id: `concept-${index}`,
      label: concept,
      type: 'concept',
      size: 20,
      color: '#ffb900',
      category: 'concepts',
      metadata: {
        type: 'concept',
        complexity: ['beginner', 'intermediate', 'advanced'][Math.floor(Math.random() * 3)]
      }
    });
  });

  // Create edges
  for (let i = 0; i < 20; i++) {
    const source = Math.floor(Math.random() * nodes.length);
    let target = Math.floor(Math.random() * nodes.length);
    while (target === source) {
      target = Math.floor(Math.random() * nodes.length);
    }

    edges.push({
      id: `edge-${i}`,
      source: nodes[source].id,
      target: nodes[target].id,
      type: 'relationship',
      weight: Math.random(),
      color: 'rgba(16, 124, 16, 0.6)'
    });
  }

  return {
    nodes,
    edges,
    metadata: {
      optimizedForDevelopment: true,
      theme: 'developer-tools',
      generatedAt: Date.now()
    }
  };
}