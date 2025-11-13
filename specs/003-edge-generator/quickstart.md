# Quickstart: EdgeGenerator Module

**Date**: 2025-11-13  
**Feature**: EdgeGenerator Module  
**Branch**: `003-edge-generator`

## Overview

This quickstart guide demonstrates how to use the EdgeGenerator module's async/Promise-based API for generating edge structures from relationship data with compatibility calculation and bundling preparation.

**CRITICAL**: All EdgeGenerator APIs are async and return Promises. This guide emphasizes proper async/await patterns and error handling.

## Basic Usage

### Simple Edge Generation

Generate basic edges from relationship data without compatibility analysis:

```typescript
import { EdgeGenerationEngine, ProcessingMode } from '@knowledge-network/edge-generator';

async function generateSimpleEdges() {
  const engine = new EdgeGenerationEngine();
  
  // Sample data
  const relationships = [
    {
      id: 'rel-1',
      sourceId: 'node-a',
      targetId: 'node-b',
      type: 'connected-to',
      properties: { weight: 0.8 }
    },
    {
      id: 'rel-2', 
      sourceId: 'node-b',
      targetId: 'node-c',
      type: 'similar-to',
      properties: { weight: 0.6 }
    }
  ];
  
  const layoutNodes = new Map([
    ['node-a', { id: 'node-a', x: 0, y: 0, radius: 10 }],
    ['node-b', { id: 'node-b', x: 100, y: 50, radius: 12 }],
    ['node-c', { id: 'node-c', x: 200, y: 100, radius: 8 }]
  ]);
  
  // Configuration for simple generation
  const config = {
    processingMode: ProcessingMode.SIMPLE,
    batchSize: { initialSize: 1000, adaptiveScaling: true },
    performance: { enableWebWorkers: false }
  };
  
  try {
    // ASYNC: Generate edges with Promise-based API
    const result = await engine.generateEdgesAsync(relationships, Array.from(layoutNodes.values()), config);
    
    console.log(`Generated ${result.edges.length} edges`);
    console.log(`Processing time: ${result.performance.totalTime}ms`);
    
    return result.edges;
  } catch (error) {
    console.error('Edge generation failed:', error);
    throw error;
  }
}

// Usage with proper async handling
generateSimpleEdges()
  .then(edges => {
    console.log('Edge generation completed successfully');
    // Use generated edges...
  })
  .catch(error => {
    console.error('Failed to generate edges:', error);
  });
```

### Complex Edge Generation with Compatibility

Generate edges with full compatibility analysis for bundling:

```typescript
import { 
  EdgeGenerationEngine, 
  CompatibilityFunctorType,
  ProcessingMode 
} from '@knowledge-network/edge-generator';

async function generateComplexEdges() {
  const engine = new EdgeGenerationEngine();
  
  // Register custom compatibility functor (optional)
  engine.registerCompatibilityFunctor('custom-semantic', async (edgeA, edgeB, context) => {
    // Custom async compatibility calculation
    const typeMatch = edgeA.relationship.type === edgeB.relationship.type ? 0.5 : 0.0;
    const spatialDistance = Math.sqrt(
      Math.pow(edgeA.sourceNode.x - edgeB.sourceNode.x, 2) + 
      Math.pow(edgeA.sourceNode.y - edgeB.sourceNode.y, 2)
    );
    const spatialSimilarity = Math.max(0, 1 - (spatialDistance / 200));
    
    return Math.min(1, typeMatch + (spatialSimilarity * 0.5));
  });
  
  // Configuration for complex generation
  const config = {
    processingMode: ProcessingMode.COMPLEX,
    batchSize: {
      initialSize: 500,  // Smaller batches for complex processing
      adaptiveScaling: true,
      memoryThreshold: 100 * 1024 * 1024 // 100MB
    },
    compatibility: {
      defaultFunctor: CompatibilityFunctorType.CUSTOM,
      spatialOptimization: true,
      cacheResults: true,
      progressiveCalculation: true
    },
    performance: {
      enableWebWorkers: true,
      workerThreshold: 200  // Use workers for >200 edges
    },
    events: {
      emitProgress: true,
      progressInterval: 1000 // Progress updates every second
    }
  };
  
  // Progress tracking
  const progressHandler = (event) => {
    console.log(`Phase ${event.phase}: ${event.progress}% complete`);
    console.log(`Processed ${event.edgesProcessed}/${event.totalEdges} edges`);
    if (event.memoryUsage) {
      console.log(`Memory usage: ${Math.round(event.memoryUsage / 1024 / 1024)}MB`);
    }
  };
  
  try {
    // ASYNC: Generate edges with progress tracking
    const result = await engine.generateEdgesAsync(
      relationships,
      layoutNodes,
      config,
      progressHandler  // Optional progress callback
    );
    
    console.log(`Generated ${result.edges.length} edges`);
    console.log(`Compatibility matrix: ${result.compatibilityMatrix.statistics.totalPairs} pairs`);
    console.log(`Bundling groups: ${result.bundlingData.groups.length}`);
    
    return result;
  } catch (error) {
    console.error('Complex edge generation failed:', error);
    throw error;
  }
}
```

## Advanced Usage Patterns

### Pipeline Integration

Integrate EdgeGenerator with the sequential processing pipeline:

```typescript
import { EdgeGenerationPipeline, PipelineEventEmitter } from '@knowledge-network/edge-generator';

async function runEdgeGenerationPipeline() {
  const eventEmitter = new PipelineEventEmitter();
  const pipeline = new EdgeGenerationPipeline(eventEmitter);
  
  // Listen for pipeline events
  eventEmitter.onAsync('nodeLayoutComplete', async (layoutNodes) => {
    console.log(`Received ${layoutNodes.length} positioned nodes`);
  });
  
  eventEmitter.onAsync('edgeGenerationProgress', async (progress) => {
    console.log(`Edge generation: ${progress.progress}% (${progress.phase})`);
  });
  
  eventEmitter.onAsync('edgeGenerationComplete', async (result) => {
    console.log(`Edge generation completed with ${result.edges.length} edges`);
  });
  
  const config = {
    processingMode: ProcessingMode.COMPLEX,
    compatibility: { 
      defaultFunctor: CompatibilityFunctorType.RELATIONSHIP_TYPE,
      spatialOptimization: true 
    }
  };
  
  try {
    // ASYNC: Wait for node layout completion and execute edge generation
    const layoutNodes = await eventEmitter.waitForAsync('nodeLayoutComplete', 30000); // 30s timeout
    
    // ASYNC: Execute staged pipeline processing
    const result = await pipeline.executeStagedAsync(relationships, layoutNodes, config);
    
    return result;
  } catch (error) {
    if (error.name === 'TimeoutError') {
      console.error('Pipeline timed out waiting for node layout');
    } else {
      console.error('Pipeline execution failed:', error);
    }
    throw error;
  }
}
```

### Error Handling and Recovery

Comprehensive error handling with fallback strategies:

```typescript
import { CircuitBreaker, AsyncErrorHandler } from '@knowledge-network/edge-generator';

async function robustEdgeGeneration() {
  const engine = new EdgeGenerationEngine();
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 3,
    timeout: 30000,
    resetTimeout: 60000
  });
  
  const errorHandler = new AsyncErrorHandler();
  
  // Fallback compatibility functor
  const fallbackFunctor = async (edgeA, edgeB, context) => {
    // Simple spatial proximity fallback
    const distance = Math.sqrt(
      Math.pow(edgeA.targetNode.x - edgeB.sourceNode.x, 2) +
      Math.pow(edgeA.targetNode.y - edgeB.sourceNode.y, 2)
    );
    return Math.max(0, 1 - (distance / 300));
  };
  
  const generateWithResilience = async () => {
    const config = {
      processingMode: ProcessingMode.COMPLEX,
      compatibility: {
        defaultFunctor: CompatibilityFunctorType.CUSTOM
      },
      errorHandling: {
        fallbackToDefault: true,
        retryAttempts: 2,
        timeoutMs: 15000,
        circuitBreakerThreshold: 3
      }
    };
    
    return await engine.generateEdgesAsync(relationships, layoutNodes, config);
  };
  
  try {
    // ASYNC: Execute with circuit breaker protection
    const result = await circuitBreaker.execute(
      generateWithResilience,
      async () => {
        // Fallback: Simple generation if complex fails
        console.warn('Falling back to simple edge generation');
        const simpleConfig = { processingMode: ProcessingMode.SIMPLE };
        return await engine.generateEdgesAsync(relationships, layoutNodes, simpleConfig);
      }
    );
    
    return result;
  } catch (error) {
    // ASYNC: Handle specific error types
    if (error.name === 'MemoryPressureError') {
      const recovery = await errorHandler.handleMemoryPressure(error, {
        sessionId: 'current-session',
        phase: 'compatibility',
        processed: 150,
        total: 500,
        memoryUsage: error.memoryUsage,
        startTime: Date.now()
      });
      
      if (recovery.strategy === 'reduce_batch') {
        console.log(`Reducing batch size to ${recovery.newBatchSize}`);
        // Retry with smaller batch size...
      }
    }
    
    throw error;
  }
}
```

### Custom Compatibility Functions

Implement domain-specific compatibility functions:

```typescript
// Semantic similarity based on relationship properties
const semanticCompatibilityFunctor = async (edgeA, edgeB, context) => {
  // Type-based compatibility
  const typeScore = edgeA.relationship.type === edgeB.relationship.type ? 0.4 : 0.0;
  
  // Property-based compatibility
  const propsA = edgeA.relationship.properties || {};
  const propsB = edgeB.relationship.properties || {};
  
  let propertyScore = 0.0;
  if (propsA.category && propsB.category) {
    propertyScore = propsA.category === propsB.category ? 0.3 : 0.0;
  }
  
  // Confidence-based weighting
  const confidenceA = propsA.confidence || 1.0;
  const confidenceB = propsB.confidence || 1.0;
  const confidenceWeight = (confidenceA + confidenceB) / 2;
  
  // Spatial proximity from context
  let spatialScore = 0.0;
  if (context.spatialIndex) {
    const proximateEdges = context.spatialIndex.getProximateEdges(edgeA, 50);
    spatialScore = proximateEdges.includes(edgeB) ? 0.3 : 0.0;
  }
  
  const totalScore = (typeScore + propertyScore + spatialScore) * confidenceWeight;
  return Math.min(1.0, totalScore);
};

// Register and use custom functor
async function useCustomCompatibility() {
  const engine = new EdgeGenerationEngine();
  
  // Register custom functor
  engine.registerCompatibilityFunctor('semantic-similarity', semanticCompatibilityFunctor);
  
  const config = {
    processingMode: ProcessingMode.COMPLEX,
    compatibility: {
      defaultFunctor: CompatibilityFunctorType.CUSTOM,
      customFunctors: new Map([['semantic-similarity', semanticCompatibilityFunctor]]),
      spatialOptimization: true,
      cacheResults: true
    }
  };
  
  const result = await engine.generateEdgesAsync(relationships, layoutNodes, config);
  return result;
}
```

### Batch Processing with Memory Management

Handle large datasets with adaptive batch processing:

```typescript
async function processLargeDataset(largeRelationshipSet) {
  const engine = new EdgeGenerationEngine();
  
  const config = {
    processingMode: ProcessingMode.COMPLEX,
    batchSize: {
      initialSize: 1000,
      minSize: 100,
      maxSize: 2000,
      adaptiveScaling: true,
      memoryThreshold: 500 * 1024 * 1024, // 500MB threshold
      timeThreshold: 5000 // 5 second max per batch
    },
    performance: {
      enableWebWorkers: true,
      workerThreshold: 500,
      memoryMonitoring: true,
      adaptiveBatching: true
    }
  };
  
  // Monitor memory and performance
  const memoryMonitor = setInterval(() => {
    if (performance.memory) {
      const memUsage = performance.memory.usedJSHeapSize;
      console.log(`Memory usage: ${Math.round(memUsage / 1024 / 1024)}MB`);
    }
  }, 2000);
  
  try {
    const result = await engine.generateEdgesAsync(
      largeRelationshipSet, 
      layoutNodes, 
      config,
      (progress) => {
        console.log(`Batch ${progress.batchInfo?.batchIndex}/${progress.batchInfo?.totalBatches}`);
        console.log(`Overall progress: ${progress.progress}%`);
        
        // Adaptive batch size feedback
        if (progress.batchInfo && progress.timeElapsed > 5000) {
          console.warn('Batch processing slower than expected, may reduce batch size');
        }
      }
    );
    
    clearInterval(memoryMonitor);
    return result;
  } catch (error) {
    clearInterval(memoryMonitor);
    throw error;
  }
}
```

## Integration Examples

### With Existing EdgeRenderer System

Integrate EdgeGenerator output with the existing edge rendering system:

```typescript
import { EdgeRenderer, EdgeBundling } from '@knowledge-network/edges';

async function generateAndRender() {
  // Generate edges
  const edgeResult = await engine.generateEdgesAsync(relationships, layoutNodes, config);
  
  // Initialize edge renderer with bundling
  const renderer = new EdgeRenderer({
    strategy: 'bundling',
    bundlingConfig: {
      threshold: edgeResult.bundlingData.thresholds.moderateBundling,
      groups: edgeResult.bundlingData.groups
    }
  });
  
  // Convert EdgeLayout to rendering format
  const renderableEdges = edgeResult.edges.map(edge => ({
    source: edge.sourceNode,
    target: edge.targetNode,
    compatibility: edge.compatibility,
    bundlingGroup: edgeResult.bundlingData.groups.find(group => 
      group.edges.includes(edge.id)
    )?.id
  }));
  
  // Render edges
  renderer.render(renderableEdges, canvasContext);
}
```

### Testing and Validation

Test EdgeGenerator functionality with async patterns:

```typescript
import { describe, it, expect } from 'vitest';

describe('EdgeGenerator Async API', () => {
  it('should generate edges asynchronously', async () => {
    const engine = new EdgeGenerationEngine();
    const config = { processingMode: ProcessingMode.SIMPLE };
    
    const result = await engine.generateEdgesAsync(testRelationships, testNodes, config);
    
    expect(result).toBeDefined();
    expect(result.edges).toHaveLength(testRelationships.length);
    expect(result.performance.totalTime).toBeGreaterThan(0);
  });
  
  it('should handle compatibility calculation errors gracefully', async () => {
    const engine = new EdgeGenerationEngine();
    
    // Register failing functor
    engine.registerCompatibilityFunctor('failing-functor', async () => {
      throw new Error('Simulated functor failure');
    });
    
    const config = {
      processingMode: ProcessingMode.COMPLEX,
      compatibility: { defaultFunctor: CompatibilityFunctorType.CUSTOM },
      errorHandling: { fallbackToDefault: true }
    };
    
    // Should not throw, should fall back gracefully
    const result = await engine.generateEdgesAsync(testRelationships, testNodes, config);
    expect(result.edges).toBeDefined();
  });
  
  it('should support cancellation', async () => {
    const engine = new EdgeGenerationEngine();
    const config = { processingMode: ProcessingMode.COMPLEX };
    
    const generationPromise = engine.generateEdgesAsync(largeDataset, testNodes, config);
    
    // Cancel after 100ms
    setTimeout(() => {
      engine.cancelGenerationAsync('test-session');
    }, 100);
    
    await expect(generationPromise).rejects.toThrow('Generation cancelled');
  });
});
```

## Performance Optimization Tips

1. **Use Web Workers**: Enable `performance.enableWebWorkers` for datasets >500 relationships
2. **Spatial Optimization**: Enable `compatibility.spatialOptimization` for dense graphs
3. **Progressive Calculation**: Use `compatibility.progressiveCalculation` for immediate bundling feedback
4. **Cache Results**: Enable `compatibility.cacheResults` for repeated compatibility calculations
5. **Adaptive Batching**: Configure `batchSize.adaptiveScaling` for optimal memory usage
6. **Memory Monitoring**: Enable `performance.memoryMonitoring` for large datasets

## Error Handling Best Practices

1. **Always use try-catch** with async operations
2. **Implement timeouts** for long-running operations
3. **Use circuit breakers** for unreliable custom functors
4. **Monitor memory pressure** during batch processing
5. **Provide fallback strategies** for compatibility calculation failures
6. **Log detailed error context** for debugging

---

**Status**: ✅ Complete  
**Next**: Agent context update and Phase 2 completion