/**
 * Semantic AI Datasets - Concept Networks for Demonstrations
 *
 * Curated datasets designed to showcase semantic clustering and AI-powered layout
 * capabilities. Each dataset represents concepts with semantic relationships that
 * benefit from embedding-based positioning rather than purely structural layout.
 */

import type { KnowledgeNode, KnowledgeEdge } from '@aigeeksquad/knowledge-network';

/**
 * Interface for concept nodes with semantic metadata
 */
export interface SemanticNode extends KnowledgeNode {
  concept: string;
  category: string;
  description: string;
  tags: string[];
  semanticVector?: number[]; // Pre-computed embedding for performance
}

/**
 * Interface for semantic edges with compatibility scores
 */
export interface SemanticEdge extends KnowledgeEdge {
  relationshipType: 'semantic' | 'structural' | 'causal' | 'hierarchical';
  strength: number; // 0-1 relationship strength
  description?: string;
}

/**
 * Research Papers Network - Academic concepts and relationships
 * Demonstrates semantic clustering of research topics and methodologies
 */
export const researchPapers = {
  nodes: [
    // Machine Learning Core
    { id: 'ml', concept: 'Machine Learning', category: 'core-ml',
      description: 'Algorithms that learn patterns from data',
      tags: ['ai', 'algorithms', 'data'], x: 0, y: 0 },
    { id: 'dl', concept: 'Deep Learning', category: 'core-ml',
      description: 'Neural networks with multiple layers',
      tags: ['ai', 'neural', 'layers'], x: 0, y: 0 },
    { id: 'nlp', concept: 'Natural Language Processing', category: 'applications',
      description: 'AI for understanding human language',
      tags: ['language', 'text', 'ai'], x: 0, y: 0 },
    { id: 'cv', concept: 'Computer Vision', category: 'applications',
      description: 'AI for analyzing visual content',
      tags: ['images', 'visual', 'ai'], x: 0, y: 0 },

    // Data Science
    { id: 'stats', concept: 'Statistics', category: 'foundations',
      description: 'Mathematical analysis of data patterns',
      tags: ['math', 'probability', 'analysis'], x: 0, y: 0 },
    { id: 'viz', concept: 'Data Visualization', category: 'tools',
      description: 'Graphical representation of information',
      tags: ['charts', 'visual', 'analysis'], x: 0, y: 0 },
    { id: 'mining', concept: 'Data Mining', category: 'techniques',
      description: 'Extracting patterns from large datasets',
      tags: ['patterns', 'discovery', 'algorithms'], x: 0, y: 0 },

    // Graph Theory
    { id: 'graph-theory', concept: 'Graph Theory', category: 'foundations',
      description: 'Mathematical study of graphs and networks',
      tags: ['math', 'networks', 'structure'], x: 0, y: 0 },
    { id: 'network-analysis', concept: 'Network Analysis', category: 'techniques',
      description: 'Study of network structures and properties',
      tags: ['networks', 'topology', 'analysis'], x: 0, y: 0 },
    { id: 'social-networks', concept: 'Social Network Analysis', category: 'applications',
      description: 'Analysis of social structures and relationships',
      tags: ['social', 'relationships', 'community'], x: 0, y: 0 },

    // Semantic Technologies
    { id: 'knowledge-graphs', concept: 'Knowledge Graphs', category: 'semantic',
      description: 'Structured representation of real-world entities',
      tags: ['semantic', 'entities', 'relationships'], x: 0, y: 0 },
    { id: 'ontology', concept: 'Ontologies', category: 'semantic',
      description: 'Formal specification of conceptualization',
      tags: ['concepts', 'formal', 'specification'], x: 0, y: 0 },
    { id: 'embeddings', concept: 'Word Embeddings', category: 'semantic',
      description: 'Dense vector representations of words',
      tags: ['vectors', 'similarity', 'semantic'], x: 0, y: 0 }
  ] as SemanticNode[],

  edges: [
    // Core ML relationships
    { id: 'ml-dl', source: 'ml', target: 'dl', relationshipType: 'hierarchical',
      strength: 0.9, description: 'Deep learning is a subset of machine learning' },
    { id: 'dl-nlp', source: 'dl', target: 'nlp', relationshipType: 'causal',
      strength: 0.8, description: 'Deep learning enables modern NLP' },
    { id: 'dl-cv', source: 'dl', target: 'cv', relationshipType: 'causal',
      strength: 0.8, description: 'Deep learning revolutionized computer vision' },

    // Foundational relationships
    { id: 'ml-stats', source: 'ml', target: 'stats', relationshipType: 'semantic',
      strength: 0.7, description: 'Machine learning builds on statistical methods' },
    { id: 'mining-stats', source: 'mining', target: 'stats', relationshipType: 'semantic',
      strength: 0.6, description: 'Data mining uses statistical techniques' },
    { id: 'viz-mining', source: 'viz', target: 'mining', relationshipType: 'structural',
      strength: 0.5, description: 'Visualization helps interpret mining results' },

    // Graph theory connections
    { id: 'network-graph', source: 'network-analysis', target: 'graph-theory', relationshipType: 'hierarchical',
      strength: 0.9, description: 'Network analysis applies graph theory' },
    { id: 'social-network', source: 'social-networks', target: 'network-analysis', relationshipType: 'hierarchical',
      strength: 0.8, description: 'Social networks use network analysis methods' },
    { id: 'kg-graph', source: 'knowledge-graphs', target: 'graph-theory', relationshipType: 'semantic',
      strength: 0.7, description: 'Knowledge graphs are applications of graph theory' },

    // Semantic web connections
    { id: 'kg-ontology', source: 'knowledge-graphs', target: 'ontology', relationshipType: 'semantic',
      strength: 0.8, description: 'Knowledge graphs often use ontologies' },
    { id: 'embeddings-nlp', source: 'embeddings', target: 'nlp', relationshipType: 'causal',
      strength: 0.9, description: 'Word embeddings are core to modern NLP' },
    { id: 'embeddings-kg', source: 'embeddings', target: 'knowledge-graphs', relationshipType: 'semantic',
      strength: 0.6, description: 'Embeddings can represent knowledge graph entities' }
  ] as SemanticEdge[]
};

/**
 * Technology Stack Network - Modern software development concepts
 * Shows semantic relationships between technologies, languages, and frameworks
 */
export const technologyStack = {
  nodes: [
    // Frontend Technologies
    { id: 'react', concept: 'React', category: 'frontend-framework',
      description: 'JavaScript library for building user interfaces',
      tags: ['javascript', 'ui', 'component'], x: 0, y: 0 },
    { id: 'vue', concept: 'Vue.js', category: 'frontend-framework',
      description: 'Progressive JavaScript framework',
      tags: ['javascript', 'progressive', 'reactive'], x: 0, y: 0 },
    { id: 'typescript', concept: 'TypeScript', category: 'language',
      description: 'Typed superset of JavaScript',
      tags: ['types', 'javascript', 'compiler'], x: 0, y: 0 },
    { id: 'css', concept: 'CSS', category: 'styling',
      description: 'Cascading Style Sheets for web styling',
      tags: ['styles', 'layout', 'design'], x: 0, y: 0 },

    // Backend Technologies
    { id: 'nodejs', concept: 'Node.js', category: 'backend-runtime',
      description: 'JavaScript runtime built on Chrome V8 engine',
      tags: ['javascript', 'server', 'runtime'], x: 0, y: 0 },
    { id: 'python', concept: 'Python', category: 'language',
      description: 'High-level programming language',
      tags: ['scripting', 'data', 'ai'], x: 0, y: 0 },
    { id: 'fastapi', concept: 'FastAPI', category: 'backend-framework',
      description: 'Modern Python web framework',
      tags: ['python', 'api', 'async'], x: 0, y: 0 },
    { id: 'express', concept: 'Express.js', category: 'backend-framework',
      description: 'Minimal Node.js web framework',
      tags: ['nodejs', 'web', 'minimal'], x: 0, y: 0 },

    // Databases
    { id: 'postgresql', concept: 'PostgreSQL', category: 'database',
      description: 'Advanced open source relational database',
      tags: ['sql', 'relational', 'acid'], x: 0, y: 0 },
    { id: 'redis', concept: 'Redis', category: 'database',
      description: 'In-memory data structure store',
      tags: ['cache', 'memory', 'key-value'], x: 0, y: 0 },
    { id: 'mongodb', concept: 'MongoDB', category: 'database',
      description: 'Document-oriented NoSQL database',
      tags: ['nosql', 'document', 'flexible'], x: 0, y: 0 },

    // DevOps & Tools
    { id: 'docker', concept: 'Docker', category: 'devops',
      description: 'Platform for developing and running applications in containers',
      tags: ['containers', 'deployment', 'isolation'], x: 0, y: 0 },
    { id: 'kubernetes', concept: 'Kubernetes', category: 'devops',
      description: 'Container orchestration platform',
      tags: ['orchestration', 'containers', 'scaling'], x: 0, y: 0 },
    { id: 'git', concept: 'Git', category: 'tools',
      description: 'Distributed version control system',
      tags: ['version-control', 'collaboration', 'tracking'], x: 0, y: 0 }
  ] as SemanticNode[],

  edges: [
    // Frontend relationships
    { id: 'react-typescript', source: 'react', target: 'typescript', relationshipType: 'semantic',
      strength: 0.8, description: 'React works excellently with TypeScript' },
    { id: 'vue-typescript', source: 'vue', target: 'typescript', relationshipType: 'semantic',
      strength: 0.7, description: 'Vue has strong TypeScript support' },
    { id: 'react-css', source: 'react', target: 'css', relationshipType: 'structural',
      strength: 0.6, description: 'React components need CSS for styling' },

    // Backend relationships
    { id: 'express-nodejs', source: 'express', target: 'nodejs', relationshipType: 'hierarchical',
      strength: 0.9, description: 'Express is built on Node.js' },
    { id: 'fastapi-python', source: 'fastapi', target: 'python', relationshipType: 'hierarchical',
      strength: 0.9, description: 'FastAPI is a Python framework' },

    // Language relationships
    { id: 'typescript-nodejs', source: 'typescript', target: 'nodejs', relationshipType: 'semantic',
      strength: 0.7, description: 'TypeScript compiles to JavaScript for Node.js' },

    // Database relationships
    { id: 'fastapi-postgresql', source: 'fastapi', target: 'postgresql', relationshipType: 'structural',
      strength: 0.6, description: 'FastAPI commonly uses PostgreSQL' },
    { id: 'express-mongodb', source: 'express', target: 'mongodb', relationshipType: 'structural',
      strength: 0.6, description: 'Express often pairs with MongoDB' },
    { id: 'redis-caching', source: 'redis', target: 'fastapi', relationshipType: 'structural',
      strength: 0.5, description: 'Redis used for caching in FastAPI apps' },

    // DevOps relationships
    { id: 'docker-kubernetes', source: 'docker', target: 'kubernetes', relationshipType: 'hierarchical',
      strength: 0.8, description: 'Kubernetes orchestrates Docker containers' },
    { id: 'docker-nodejs', source: 'docker', target: 'nodejs', relationshipType: 'structural',
      strength: 0.5, description: 'Node.js apps commonly containerized with Docker' },
    { id: 'docker-python', source: 'docker', target: 'python', relationshipType: 'structural',
      strength: 0.5, description: 'Python apps commonly containerized with Docker' }
  ] as SemanticEdge[]
};

/**
 * Scientific Concepts Network - Interdisciplinary scientific relationships
 * Demonstrates complex semantic clustering across multiple scientific domains
 */
export const scientificConcepts = {
  nodes: [
    // Physics
    { id: 'quantum', concept: 'Quantum Mechanics', category: 'physics',
      description: 'Physics of matter and energy at quantum scale',
      tags: ['quantum', 'mechanics', 'uncertainty'], x: 0, y: 0 },
    { id: 'relativity', concept: 'Relativity', category: 'physics',
      description: 'Einstein theory of space-time relationships',
      tags: ['spacetime', 'einstein', 'gravity'], x: 0, y: 0 },
    { id: 'thermodynamics', concept: 'Thermodynamics', category: 'physics',
      description: 'Study of heat, work, and energy transfer',
      tags: ['energy', 'entropy', 'temperature'], x: 0, y: 0 },

    // Biology
    { id: 'evolution', concept: 'Evolution', category: 'biology',
      description: 'Change in species over time through natural selection',
      tags: ['selection', 'adaptation', 'species'], x: 0, y: 0 },
    { id: 'genetics', concept: 'Genetics', category: 'biology',
      description: 'Study of genes and heredity',
      tags: ['dna', 'inheritance', 'genes'], x: 0, y: 0 },
    { id: 'ecology', concept: 'Ecology', category: 'biology',
      description: 'Study of organisms and their environment',
      tags: ['environment', 'ecosystems', 'relationships'], x: 0, y: 0 },

    // Chemistry
    { id: 'organic-chem', concept: 'Organic Chemistry', category: 'chemistry',
      description: 'Study of carbon-containing compounds',
      tags: ['carbon', 'molecules', 'reactions'], x: 0, y: 0 },
    { id: 'biochemistry', concept: 'Biochemistry', category: 'interdisciplinary',
      description: 'Chemical processes within living organisms',
      tags: ['biology', 'chemistry', 'metabolism'], x: 0, y: 0 },

    // Mathematics
    { id: 'chaos-theory', concept: 'Chaos Theory', category: 'mathematics',
      description: 'Study of complex dynamical systems',
      tags: ['nonlinear', 'dynamics', 'complexity'], x: 0, y: 0 },
    { id: 'fractals', concept: 'Fractals', category: 'mathematics',
      description: 'Self-similar geometric patterns',
      tags: ['geometry', 'self-similar', 'scaling'], x: 0, y: 0 },

    // Interdisciplinary
    { id: 'complexity', concept: 'Complexity Science', category: 'interdisciplinary',
      description: 'Study of complex adaptive systems',
      tags: ['emergence', 'systems', 'adaptation'], x: 0, y: 0 },
    { id: 'information', concept: 'Information Theory', category: 'interdisciplinary',
      description: 'Mathematical study of information transmission',
      tags: ['entropy', 'communication', 'data'], x: 0, y: 0 }
  ] as SemanticNode[],

  edges: [
    // Physics interconnections
    { id: 'quantum-relativity', source: 'quantum', target: 'relativity', relationshipType: 'semantic',
      strength: 0.6, description: 'Quantum mechanics and relativity are foundational physics theories' },
    { id: 'thermodynamics-information', source: 'thermodynamics', target: 'information', relationshipType: 'semantic',
      strength: 0.7, description: 'Entropy connects thermodynamics and information theory' },

    // Biology interconnections
    { id: 'genetics-evolution', source: 'genetics', target: 'evolution', relationshipType: 'causal',
      strength: 0.9, description: 'Genetics provides mechanism for evolutionary change' },
    { id: 'ecology-evolution', source: 'ecology', target: 'evolution', relationshipType: 'semantic',
      strength: 0.8, description: 'Environmental pressures drive evolutionary selection' },

    // Interdisciplinary bridges
    { id: 'biochemistry-genetics', source: 'biochemistry', target: 'genetics', relationshipType: 'hierarchical',
      strength: 0.8, description: 'Biochemistry explains genetic mechanisms' },
    { id: 'biochemistry-organic', source: 'biochemistry', target: 'organic-chem', relationshipType: 'hierarchical',
      strength: 0.8, description: 'Biochemistry applies organic chemistry to living systems' },

    // Complexity connections
    { id: 'complexity-chaos', source: 'complexity', target: 'chaos-theory', relationshipType: 'semantic',
      strength: 0.8, description: 'Complexity science incorporates chaos theory concepts' },
    { id: 'complexity-ecology', source: 'complexity', target: 'ecology', relationshipType: 'semantic',
      strength: 0.7, description: 'Ecosystems are complex adaptive systems' },
    { id: 'fractals-chaos', source: 'fractals', target: 'chaos-theory', relationshipType: 'semantic',
      strength: 0.7, description: 'Fractals often arise in chaotic systems' },

    // Cross-domain connections
    { id: 'quantum-information', source: 'quantum', target: 'information', relationshipType: 'semantic',
      strength: 0.6, description: 'Quantum information theory combines quantum mechanics and information theory' },
    { id: 'thermodynamics-complexity', source: 'thermodynamics', target: 'complexity', relationshipType: 'semantic',
      strength: 0.6, description: 'Thermodynamic principles apply to complex systems' }
  ] as SemanticEdge[]
};

/**
 * Comprehensive concept networks collection for easy access
 */
export const conceptNetworks = {
  'research-papers': researchPapers,
  'technology-stack': technologyStack,
  'scientific-concepts': scientificConcepts
};

/**
 * Generate random concept network for testing
 */
export function generateRandomConceptNetwork(nodeCount: number = 20): { nodes: SemanticNode[], edges: SemanticEdge[] } {
  const categories = ['technology', 'science', 'business', 'arts', 'philosophy'];
  const concepts = [
    'Innovation', 'Creativity', 'Analysis', 'Synthesis', 'Optimization',
    'Integration', 'Automation', 'Intelligence', 'Adaptation', 'Evolution',
    'Transformation', 'Communication', 'Collaboration', 'Discovery', 'Exploration',
    'Implementation', 'Methodology', 'Framework', 'Architecture', 'Design'
  ];

  const nodes: SemanticNode[] = [];
  const edges: SemanticEdge[] = [];

  // Generate nodes
  for (let i = 0; i < nodeCount; i++) {
    const concept = concepts[Math.floor(Math.random() * concepts.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];

    nodes.push({
      id: `concept-${i}`,
      concept: `${concept} ${i + 1}`,
      category,
      description: `A ${category} concept related to ${concept.toLowerCase()}`,
      tags: [category, concept.toLowerCase(), 'generated'],
      x: 0,
      y: 0
    });
  }

  // Generate edges with semantic relationships
  for (let i = 0; i < nodes.length * 1.5; i++) {
    const source = nodes[Math.floor(Math.random() * nodes.length)];
    const target = nodes[Math.floor(Math.random() * nodes.length)];

    if (source.id !== target.id) {
      const relationshipTypes: Array<'semantic' | 'structural' | 'causal' | 'hierarchical'> =
        ['semantic', 'structural', 'causal', 'hierarchical'];
      const relationshipType = relationshipTypes[Math.floor(Math.random() * relationshipTypes.length)];

      edges.push({
        id: `edge-${i}`,
        source: source.id,
        target: target.id,
        relationshipType,
        strength: 0.3 + Math.random() * 0.7, // Random strength between 0.3 and 1.0
        description: `${relationshipType} relationship between ${source.concept} and ${target.concept}`
      });
    }
  }

  return { nodes, edges };
}