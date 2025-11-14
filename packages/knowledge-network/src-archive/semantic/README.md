# Semantic Layout Enhancement

This module provides semantic embedding-based clustering for the Knowledge Network layout system. It extends the existing layout algorithms with the ability to position nodes based on semantic similarity in addition to structural relationships.

## Features

- **Embedding-based clustering**: Position nodes based on semantic similarity using embedding vectors
- **Flexible embedding functions**: Support for both text-based and custom embedding functions
- **Caching system**: Efficient caching of computed embeddings for performance
- **Backward compatibility**: All existing layout functionality continues to work unchanged
- **Pure calculation**: No rendering side effects, only position calculations

## Basic Usage

### Text-based Semantic Layout

```typescript
import { LayoutEngine, EmbeddingUtils } from '@aigeeksquad/knowledge-network';

const layoutEngine = new LayoutEngine('force-directed', {
  width: 800,
  height: 600,

  // Enable semantic clustering with simple text embeddings
  textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(384),
  semanticDimensions: 384,
  semanticThreshold: 0.7,        // Minimum similarity to cluster
  semanticForceStrength: 0.2,    // Strength of semantic attraction
  semanticWeight: 0.3,           // Balance between semantic and structural forces
});

const graphData = {
  nodes: [
    { id: '1', label: 'artificial intelligence machine learning' },
    { id: '2', label: 'deep learning neural networks' },
    { id: '3', label: 'natural language processing' },
    { id: '4', label: 'computer vision image recognition' },
  ],
  edges: [
    { id: 'e1', source: '1', target: '2' },
    { id: 'e2', source: '2', target: '3' },
  ]
};

const result = await layoutEngine.calculateLayout(graphData);
```

### Custom Embedding Function

```typescript
import { LayoutEngine } from '@aigeeksquad/knowledge-network';

// Custom embedding function that processes node data
const customEmbedding = async (node) => {
  // Use your preferred embedding service (OpenAI, Sentence-BERT, etc.)
  const response = await embeddingService.embed(node.label + ' ' + node.description);
  return response.embedding;
};

const layoutEngine = new LayoutEngine('force-directed', {
  width: 800,
  height: 600,

  // Use custom embedding function
  embeddingFunction: customEmbedding,
  semanticDimensions: 1536,      // Match your embedding service dimensions
  semanticThreshold: 0.8,
  semanticForceStrength: 0.15,
  enableSemanticCache: true,     // Cache embeddings for performance
  maxSemanticCacheSize: 1000,
});
```

### Working with Semantic Similarity

```typescript
const result = await layoutEngine.calculateLayout(graphData);

// Get semantic similarity between nodes
const similarity = layoutEngine.getSemanticSimilarity('node1', 'node2');
console.log(`Similarity: ${similarity}`); // 0.85 (high similarity)

// Access computed embeddings
const embedding = layoutEngine.getNodeEmbedding('node1');
console.log(`Embedding dimensions: ${embedding.length}`);

// Get all embeddings
const allEmbeddings = layoutEngine.getAllEmbeddings();
console.log(`Computed embeddings for ${allEmbeddings.size} nodes`);

// Monitor cache performance
const stats = layoutEngine.getEmbeddingStats();
console.log(`Cache hit rate: ${stats.hitRate * 100}%`);
```

## Configuration Options

### Semantic Layout Config

```typescript
interface SemanticLayoutConfig {
  // Embedding function (choose one)
  embeddingFunction?: (node: Node) => Promise<number[]> | number[];
  textEmbeddingFunction?: (text: string) => Promise<number[]> | number[];

  // Text extraction for text-based embeddings
  textExtractor?: (node: Node) => string;

  // Semantic clustering parameters
  semanticWeight?: number;         // Balance semantic vs structural forces (0-1)
  semanticThreshold?: number;      // Minimum similarity for clustering (0-1)
  semanticDimensions?: number;     // Expected embedding vector size
  semanticForceStrength?: number;  // Strength of semantic attraction force

  // Caching configuration
  enableSemanticCache?: boolean;   // Enable embedding caching
  maxSemanticCacheSize?: number;   // Maximum cached embeddings
}
```

### Default Values

```typescript
{
  semanticWeight: 0.3,           // 30% semantic, 70% structural
  semanticThreshold: 0.7,        // 70% similarity threshold
  semanticDimensions: 384,       // Standard embedding size
  semanticForceStrength: 0.1,    // Moderate semantic attraction
  enableSemanticCache: true,     // Caching enabled
  maxSemanticCacheSize: 1000     // Cache up to 1000 embeddings
}
```

## EmbeddingManager

The `EmbeddingManager` class handles embedding computation and caching independently:

```typescript
import { EmbeddingManager, EmbeddingUtils } from '@aigeeksquad/knowledge-network/semantic';

const manager = new EmbeddingManager({
  textEmbeddingFunction: EmbeddingUtils.createSimpleTextEmbedding(256),
  dimensions: 256,
  enableCache: true
});

// Compute embeddings for nodes
const embeddings = await manager.computeEmbeddings(nodes);

// Calculate similarity
const similarity = manager.cosineSimilarity(embeddings[0], embeddings[1]);

// Monitor performance
const stats = manager.getCacheStats();
```

## Embedding Utilities

### Simple Text Embedding

For basic semantic clustering without external services:

```typescript
const embeddingFn = EmbeddingUtils.createSimpleTextEmbedding(128);
const embedding = embeddingFn('artificial intelligence');
// Returns normalized vector with basic text features
```

### Mock Embedding (for testing)

Deterministic embeddings for development and testing:

```typescript
const mockFn = EmbeddingUtils.createMockEmbedding(384);
const embedding = mockFn(node);
// Returns consistent embedding based on node ID
```

## Performance Considerations

### Large Graphs

For graphs with many nodes (100+):

```typescript
const layoutEngine = new LayoutEngine('force-directed', {
  // ... other config

  // Optimize for performance
  semanticThreshold: 0.8,        // Higher threshold = fewer connections
  enableSemanticCache: true,     // Essential for large graphs
  maxSemanticCacheSize: 5000,    // Increase cache size

  // Faster simulation convergence
  alpha: 0.3,
  alphaDecay: 0.05,
});
```

### Embedding Services

When using external embedding services:

```typescript
const embeddingFn = async (node) => {
  try {
    // Add retry logic for robustness
    return await embeddingService.embed(extractText(node));
  } catch (error) {
    console.warn(`Failed to embed node ${node.id}:`, error);
    // Fallback to simple embedding
    return EmbeddingUtils.createSimpleTextEmbedding(384)(node.label);
  }
};
```

### Memory Usage

The embedding cache stores vectors in memory:

```typescript
// For a 384-dimensional embedding: ~1.5KB per node
// 1000 cached nodes: ~1.5MB memory usage
// Monitor with getCacheStats() and adjust maxCacheSize accordingly
```

## Integration Patterns

### Hybrid Similarity

Combine semantic and traditional similarity:

```typescript
const layoutEngine = new LayoutEngine('force-directed', {
  // Traditional similarity based on connections
  similarityFunction: (a, b) => calculateStructuralSimilarity(a, b),
  similarityThreshold: 0.5,

  // Semantic similarity based on content
  textEmbeddingFunction: embeddingFunction,
  semanticThreshold: 0.7,
  semanticForceStrength: 0.2,

  // Balance both approaches
  semanticWeight: 0.4  // 40% semantic, 60% structural
});
```

### Progressive Enhancement

Start simple and add semantic features:

```typescript
// Start with basic layout
let layoutEngine = new LayoutEngine('force-directed', basicConfig);

// Add semantic features when needed
if (enableSemanticClustering) {
  layoutEngine.setConfig({
    textEmbeddingFunction: embeddingFunction,
    semanticThreshold: 0.7,
    semanticForceStrength: 0.15
  });
}
```

## Error Handling

Semantic layout is designed to fail gracefully:

```typescript
// If embedding computation fails, layout continues without semantic forces
const result = await layoutEngine.calculateLayout(data);

// Check if semantic features are working
const embeddings = layoutEngine.getAllEmbeddings();
if (embeddings.size === 0) {
  console.warn('Semantic clustering unavailable, using structural layout only');
}
```

## Architecture

The semantic module follows the "bricks and studs" philosophy:

- **EmbeddingManager**: Self-contained embedding computation and caching
- **LayoutEngine extensions**: Minimal integration points with existing layout system
- **Pure calculation**: No rendering side effects, only position calculations
- **Regeneratable**: Can be rebuilt from this specification alone

The implementation maintains backward compatibility while adding semantic capabilities as opt-in features.