/**
 * Default Similarity Functions
 * 
 * Built-in similarity functions following the functor contract:
 * (nodeA: Node, nodeB: Node, context: ClusteringContext) => number
 * 
 * Provides:
 * - Cosine similarity for vector embeddings
 * - Jaccard similarity for metadata overlap
 * - Spatial proximity for position-based similarity
 * - Auto-selector with intelligent fallback cascade
 */

import type {
  Node,
  SimilarityFunctor,
  ClusteringContext
} from '../types.js';

/**
 * Cosine similarity functor for vector embeddings
 * 
 * Calculates cosine similarity between node vectors:
 * similarity = (A · B) / (||A|| × ||B||)
 */
export const cosineSimilarity: SimilarityFunctor = (nodeA: Node, nodeB: Node, context: ClusteringContext): number => {
  // Check if both nodes have vector data
  if (!nodeA.vector || !nodeB.vector) {
    return 0;
  }

  const vectorA = nodeA.vector;
  const vectorB = nodeB.vector;

  // Handle different vector lengths by using the shorter length
  const minLength = Math.min(vectorA.length, vectorB.length);
  if (minLength === 0) return 0;

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  // Calculate dot product and magnitudes
  for (let i = 0; i < minLength; i++) {
    const aVal = vectorA[i] || 0;
    const bVal = vectorB[i] || 0;

    // Handle special values (NaN, Infinity)
    if (!Number.isFinite(aVal) || !Number.isFinite(bVal)) {
      continue;
    }

    dotProduct += aVal * bVal;
    magnitudeA += aVal * aVal;
    magnitudeB += bVal * bVal;
  }

  // Handle zero vectors
  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  
  // Normalize to [0,1] range (cosine can be [-1,1])
  return Math.max(0, (similarity + 1) / 2);
};

/**
 * Jaccard similarity functor for metadata overlap
 * 
 * Calculates Jaccard coefficient between node metadata:
 * similarity = |A ∩ B| / |A ∪ B|
 */
export const jaccardSimilarity: SimilarityFunctor = (nodeA: Node, nodeB: Node, context: ClusteringContext): number => {
  // Extract all metadata values for comparison
  const setA = extractMetadataValues(nodeA);
  const setB = extractMetadataValues(nodeB);

  if (setA.size === 0 && setB.size === 0) {
    return 0; // Both empty
  }

  if (setA.size === 0 || setB.size === 0) {
    return 0; // One empty
  }

  // Calculate intersection
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  
  // Calculate union
  const union = new Set([...setA, ...setB]);

  return union.size > 0 ? intersection.size / union.size : 0;
};

/**
 * Spatial proximity similarity functor
 * 
 * Calculates similarity based on spatial distance between nodes:
 * similarity = exp(-distance / scale)
 */
export const spatialProximity: SimilarityFunctor = (nodeA: Node, nodeB: Node, context: ClusteringContext): number => {
  // Check if both nodes have position data
  if (!nodeA.position || !nodeB.position) {
    return 0;
  }

  const posA = nodeA.position;
  const posB = nodeB.position;

  // Calculate Euclidean distance
  const dx = posB.x - posA.x;
  const dy = posB.y - posA.y;
  const dz = (posB.z || 0) - (posA.z || 0); // Handle 2D mode

  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // Exponential falloff with configurable scale
  const scale = 100; // Distance where similarity drops to ~0.37
  return Math.exp(-distance / scale);
};

/**
 * Create auto-selector functor with intelligent fallback cascade
 * 
 * Automatically selects the best available similarity function:
 * 1. Cosine similarity (if vectors available)
 * 2. Jaccard similarity (if metadata available)
 * 3. Spatial proximity (if positions available)
 * 4. Zero similarity (fallback)
 */
export const createAutoSelector = (): SimilarityFunctor => {
  return (nodeA: Node, nodeB: Node, context: ClusteringContext): number => {
    // Try cosine similarity first
    if (nodeA.vector && nodeB.vector) {
      return cosineSimilarity(nodeA, nodeB, context);
    }

    // Fall back to metadata similarity
    if ((nodeA.metadata && Object.keys(nodeA.metadata).length > 0) ||
        (nodeB.metadata && Object.keys(nodeB.metadata).length > 0)) {
      return jaccardSimilarity(nodeA, nodeB, context);
    }

    // Fall back to spatial proximity
    if (nodeA.position && nodeB.position) {
      return spatialProximity(nodeA, nodeB, context);
    }

    // No usable data
    return 0;
  };
};

/**
 * Create composite similarity functor with weighted combination
 * 
 * Combines multiple similarity functions with normalized weights:
 * finalSimilarity = Σ(weight_i × similarity_i) / Σ(weight_i)
 */
export const createComposite = (weights: Record<string, number>): SimilarityFunctor => {
  // Normalize weights
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + Math.abs(w || 0), 0);
  if (totalWeight === 0) {
    throw new Error('At least one weight must be positive');
  }

  const normalizedWeights: Record<string, number> = {};
  for (const [name, weight] of Object.entries(weights)) {
    normalizedWeights[name] = Math.abs(weight || 0) / totalWeight;
  }

  return (nodeA: Node, nodeB: Node, context: ClusteringContext): number => {
    let totalSimilarity = 0;
    let activeWeights = 0;

    // Vector similarity
    if (normalizedWeights.vector > 0 && nodeA.vector && nodeB.vector) {
      const vectorSim = cosineSimilarity(nodeA, nodeB, context);
      totalSimilarity += vectorSim * normalizedWeights.vector;
      activeWeights += normalizedWeights.vector;
    }

    // Metadata similarity  
    if (normalizedWeights.metadata > 0) {
      const metadataSim = jaccardSimilarity(nodeA, nodeB, context);
      if (metadataSim > 0) {
        totalSimilarity += metadataSim * normalizedWeights.metadata;
        activeWeights += normalizedWeights.metadata;
      }
    }

    // Spatial similarity
    if (normalizedWeights.spatial > 0 && nodeA.position && nodeB.position) {
      const spatialSim = spatialProximity(nodeA, nodeB, context);
      totalSimilarity += spatialSim * normalizedWeights.spatial;
      activeWeights += normalizedWeights.spatial;
    }

    // Return weighted average if any functions were active
    return activeWeights > 0 ? totalSimilarity / activeWeights : 0;
  };
};

/**
 * Extract metadata values for Jaccard similarity
 */
function extractMetadataValues(node: Node): Set<string> {
  const values = new Set<string>();

  if (!node.metadata) {
    return values;
  }

  // Add tags if present
  if (node.metadata.tags && Array.isArray(node.metadata.tags)) {
    for (const tag of node.metadata.tags) {
      if (typeof tag === 'string') {
        values.add(tag.toLowerCase().trim());
      }
    }
  }

  // Add other metadata properties
  for (const [key, value] of Object.entries(node.metadata)) {
    if (key === 'tags') continue; // Already handled

    if (typeof value === 'string') {
      values.add(`${key}:${value.toLowerCase().trim()}`);
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      values.add(`${key}:${value}`);
    }
  }

  // Add node group if available
  if (node.group) {
    values.add(`group:${node.group.toLowerCase().trim()}`);
  }

  return values;
}

/**
 * Default Similarity Functions registry
 */
export class DefaultSimilarityFunctions {
  static readonly cosine = cosineSimilarity;
  static readonly jaccard = jaccardSimilarity;
  static readonly spatialProximity = spatialProximity;
  
  static readonly createAutoSelector = createAutoSelector;
  static readonly createComposite = createComposite;

  /**
   * Get all default function names
   */
  static getAvailableFunctions(): string[] {
    return ['cosine', 'jaccard', 'spatialProximity', 'auto'];
  }

  /**
   * Get function by name
   */
  static getFunction(name: string): SimilarityFunctor | null {
    switch (name.toLowerCase()) {
      case 'cosine':
      case 'cosine-similarity':
        return cosineSimilarity;
      
      case 'jaccard':
      case 'jaccard-similarity':
        return jaccardSimilarity;
      
      case 'spatial':
      case 'spatial-proximity':
        return spatialProximity;
      
      case 'auto':
      case 'default':
        return createAutoSelector();
      
      default:
        return null;
    }
  }

  /**
   * Validate similarity function result
   */
  static validateResult(result: number, functorName: string): number {
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      console.warn(`Invalid similarity result from ${functorName}:`, result);
      return 0;
    }

    // Clamp to [0,1] range
    const clamped = Math.max(0, Math.min(1, result));
    
    if (clamped !== result) {
      console.warn(`Similarity result from ${functorName} clamped from ${result} to ${clamped}`);
    }

    return clamped;
  }
}

// Export function types for testing
export type {
  CosineSimilarityFunctor,
  JaccardSimilarityFunctor, 
  SpatialProximitySimilarityFunctor
} from '../types.js';

// Type aliases for the specific similarity functors
export type CosineSimilarityFunctor = typeof cosineSimilarity;
export type JaccardSimilarityFunctor = typeof jaccardSimilarity;
export type SpatialProximitySimilarityFunctor = typeof spatialProximity;