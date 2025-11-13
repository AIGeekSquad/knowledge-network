# Research: EdgeGenerator Module Implementation

**Date**: 2025-11-13  
**Feature**: EdgeGenerator Module  
**Branch**: `003-edge-generator`

## Research Overview

This document addresses the technical unknowns identified during implementation planning, focusing on async/Promise API design, performance optimization, and pipeline coordination patterns for the EdgeGenerator module.

## Decision Summary

| Area | Decision | Rationale |
|------|----------|-----------|
| **Async Batching** | Web Workers with transferable objects for chunks >500 relationships | Prevents UI blocking while maintaining memory efficiency |
| **Pipeline Coordination** | Promise-based event emitter with async/await pipeline stages | Clean async flow with proper error propagation |
| **Compatibility Matrix** | Spatial indexing + progressive calculation with Web Workers | O(n log n) performance through intelligent sampling |
| **Error Handling** | Circuit breaker pattern with exponential backoff | Graceful degradation under memory/performance pressure |

---

## Research Area 1: Optimal Async Batching Strategies

### Problem Statement
The EdgeGenerator must process large relationship datasets (1000+ relationships) without blocking the UI thread while managing browser memory constraints effectively.

### Findings

#### Browser Memory Constraints Analysis
- **Browser Limits**: Modern browsers typically allow 2-4GB per tab before garbage collection pressure
- **Edge Data Size**: Each EdgeLayout structure ~200-400 bytes including compatibility scores
- **Relationship Processing**: 1000 relationships = ~400KB base data + compatibility matrix overhead
- **Compatibility Matrix**: O(n²) growth - 1000 edges = 1M compatibility calculations

#### Async Batching Strategies Evaluated

##### Strategy 1: RequestAnimationFrame Chunking ⭐ SELECTED
```typescript
async function processRelationshipsRAF(
    relationships: Relationship[], 
    chunkSize: number = 1000
): Promise<EdgeLayout[]> {
    const results: EdgeLayout[] = [];
    
    for (let i = 0; i < relationships.length; i += chunkSize) {
        const chunk = relationships.slice(i, i + chunkSize);
        const chunkResults = await new Promise<EdgeLayout[]>(resolve => {
            requestAnimationFrame(() => {
                const processed = chunk.map(rel => processRelationship(rel));
                resolve(processed);
            });
        });
        results.push(...chunkResults);
        
        // Emit progress event
        emitProgress({
            processed: i + chunk.length,
            total: relationships.length,
            phase: 'relationship-processing'
        });
    }
    
    return results;
}
```

**Rationale**: Maintains 60fps responsiveness while processing large datasets. Browser-native scheduling prevents UI blocking.

##### Strategy 2: Web Workers for Heavy Computation
```typescript
// For compatibility matrix calculation only
async function calculateCompatibilityMatrix(
    edges: EdgeLayout[]
): Promise<CompatibilityMatrix> {
    if (edges.length < 500) {
        // Main thread for small datasets
        return calculateCompatibilityMainThread(edges);
    }
    
    // Web Worker for large datasets
    const worker = new Worker('/compatibility-worker.js');
    return new Promise((resolve, reject) => {
        worker.postMessage({ edges: edges.map(e => e.toTransferable()) });
        worker.onmessage = (e) => {
            resolve(CompatibilityMatrix.fromWorkerData(e.data));
            worker.terminate();
        };
        worker.onerror = reject;
    });
}
```

**Decision**: Hybrid approach - RequestAnimationFrame for relationship processing, Web Workers for compatibility matrix when >500 edges.

#### Adaptive Chunk Sizing Algorithm
```typescript
class AdaptiveBatchProcessor {
    private baseChunkSize = 1000;
    private performanceHistory: number[] = [];
    
    calculateOptimalChunkSize(availableMemory: number, processingTime: number): number {
        // Adjust based on memory pressure
        const memoryFactor = Math.max(0.5, availableMemory / (100 * 1024 * 1024)); // 100MB baseline
        
        // Adjust based on processing time
        const timeFactor = processingTime < 16 ? 1.2 : 0.8; // 16ms = 60fps target
        
        const adjustedSize = Math.floor(this.baseChunkSize * memoryFactor * timeFactor);
        return Math.max(100, Math.min(2000, adjustedSize)); // Bounds: 100-2000
    }
}
```

---

## Research Area 2: Event-Driven Pipeline Coordination

### Problem Statement
EdgeGenerator must integrate seamlessly with the sequential pipeline, waiting for node layout completion and coordinating with rendering systems using Promise-based patterns.

### Findings

#### Pipeline Coordination Pattern ⭐ SELECTED
```typescript
interface PipelineEventEmitter extends EventTarget {
    waitFor<T>(eventType: string): Promise<T>;
    emit<T>(eventType: string, data: T): void;
}

class EdgeGeneratorPipeline {
    constructor(private events: PipelineEventEmitter) {}
    
    async execute(config: EdgeGenerationConfig): Promise<EdgeGenerationResult> {
        // Wait for node layout completion
        const layoutNodes = await this.events.waitFor<LayoutNode[]>('nodeLayoutComplete');
        
        // Execute edge generation with progress events
        const result = await this.generateEdgesAsync(config.relationships, layoutNodes);
        
        // Signal completion for next pipeline stage
        this.events.emit('edgeGenerationComplete', result);
        
        return result;
    }
    
    private async generateEdgesAsync(
        relationships: Relationship[],
        layoutNodes: LayoutNode[]
    ): Promise<EdgeGenerationResult> {
        // Phase 1: Relationship processing
        this.events.emit('edgeGenerationProgress', {
            phase: 'processing',
            progress: 0
        });
        
        const edges = await this.processRelationships(relationships, layoutNodes);
        
        // Phase 2: Compatibility calculation
        this.events.emit('edgeGenerationProgress', {
            phase: 'compatibility',
            progress: 50
        });
        
        const compatibilityMatrix = await this.calculateCompatibility(edges);
        
        // Phase 3: Bundling preparation
        this.events.emit('edgeGenerationProgress', {
            phase: 'bundling-prep',
            progress: 90
        });
        
        const bundlingData = await this.prepareBundling(edges, compatibilityMatrix);
        
        return {
            edges,
            compatibilityMatrix,
            bundlingData,
            metadata: { processingTime: Date.now() - startTime }
        };
    }
}
```

#### Error Propagation & Circuit Breaker
```typescript
class CircuitBreaker {
    private failures = 0;
    private lastFailure?: number;
    private readonly threshold = 5;
    private readonly timeout = 30000; // 30 seconds
    
    async execute<T>(operation: () => Promise<T>, fallback: () => T): Promise<T> {
        if (this.isOpen()) {
            return fallback();
        }
        
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    private isOpen(): boolean {
        return this.failures >= this.threshold && 
               this.lastFailure && 
               (Date.now() - this.lastFailure) < this.timeout;
    }
}
```

---

## Research Area 3: Performance Optimization for Compatibility Matrix

### Problem Statement
Compatibility calculation is O(n²) complexity, requiring optimization techniques to maintain responsive performance for large edge datasets.

### Findings

#### Spatial Indexing Optimization ⭐ SELECTED
```typescript
class SpatialCompatibilityIndex {
    private spatialGrid: Map<string, EdgeLayout[]> = new Map();
    private readonly gridSize = 100; // pixels
    
    constructor(edges: EdgeLayout[]) {
        // Build spatial index
        edges.forEach(edge => {
            const gridKey = this.getGridKey(edge.sourceNode.x, edge.sourceNode.y);
            const gridEdges = this.spatialGrid.get(gridKey) || [];
            gridEdges.push(edge);
            this.spatialGrid.set(gridKey, gridEdges);
        });
    }
    
    calculateOptimizedCompatibility(
        edge: EdgeLayout,
        functor: CompatibilityFunctor
    ): CompatibilityScores {
        // Only calculate compatibility with spatially proximate edges
        const proximateEdges = this.getProximateEdges(edge);
        const scores: CompatibilityScores = {};
        
        proximateEdges.forEach(otherEdge => {
            if (edge.id !== otherEdge.id) {
                scores[otherEdge.id] = functor(edge, otherEdge, this.context);
            }
        });
        
        return scores;
    }
    
    private getProximateEdges(edge: EdgeLayout): EdgeLayout[] {
        const sourceKey = this.getGridKey(edge.sourceNode.x, edge.sourceNode.y);
        const targetKey = this.getGridKey(edge.targetNode.x, edge.targetNode.y);
        
        // Get edges from source, target, and adjacent grid cells
        const keys = new Set([
            sourceKey, 
            targetKey,
            ...this.getAdjacentKeys(sourceKey),
            ...this.getAdjacentKeys(targetKey)
        ]);
        
        return Array.from(keys)
            .flatMap(key => this.spatialGrid.get(key) || [])
            .filter((edge, index, arr) => arr.indexOf(edge) === index); // Deduplicate
    }
}
```

#### Progressive Compatibility Calculation
```typescript
async function calculateCompatibilityProgressive(
    edges: EdgeLayout[],
    functor: CompatibilityFunctor
): Promise<CompatibilityMatrix> {
    const spatialIndex = new SpatialCompatibilityIndex(edges);
    const matrix = new CompatibilityMatrix();
    
    // Phase 1: High-priority pairs (same type, spatial proximity)
    const highPriorityPairs = spatialIndex.getHighPriorityPairs();
    await this.calculateBatch(highPriorityPairs, matrix, functor, 'high-priority');
    
    // Emit partial results for early bundling decisions
    this.events.emit('compatibilityPartial', { matrix, coverage: 0.3 });
    
    // Phase 2: Progressive expansion based on performance budget
    const remainingPairs = spatialIndex.getRemainingPairs();
    await this.calculateProgressiveBatches(remainingPairs, matrix, functor);
    
    return matrix;
}
```

#### Dynamic Threshold Computation
```typescript
class DynamicThresholdCalculator {
    calculateBundlingThresholds(
        compatibilityMatrix: CompatibilityMatrix,
        edges: EdgeLayout[]
    ): BundlingThresholds {
        // Analyze compatibility score distribution
        const scores = compatibilityMatrix.getAllScores();
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const stdDev = Math.sqrt(
            scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length
        );
        
        // Dynamic thresholds based on distribution
        return {
            strongBundling: mean + (stdDev * 1.5),   // Top 15% compatibility
            moderateBundling: mean + (stdDev * 0.5), // Above average + 0.5 std dev
            weakBundling: mean,                      // Average compatibility
            edgeDensity: edges.length / this.calculateGraphArea(edges)
        };
    }
}
```

---

## Implementation Roadmap

### Phase 1: Core Async Infrastructure
1. **Pipeline Event System**: Promise-based event emitter for coordination
2. **Adaptive Batch Processor**: RequestAnimationFrame-based chunking with performance monitoring
3. **Circuit Breaker**: Error handling with fallback compatibility functions

### Phase 2: Performance Optimization
1. **Spatial Indexing**: Grid-based spatial index for compatibility optimization
2. **Progressive Calculation**: Priority-based compatibility matrix computation
3. **Web Worker Integration**: Heavy computation offloading for large datasets

### Phase 3: Dynamic Optimization
1. **Threshold Calculator**: Dynamic bundling threshold computation
2. **Memory Monitor**: Browser memory pressure detection and adaptation
3. **Performance Analytics**: Real-time performance metrics and optimization

---

## References

1. **Browser Performance**: MDN Web Workers, Performance API, Memory Management
2. **Spatial Indexing**: "Spatial Data Structures" - Hanan Samet
3. **Async Patterns**: "JavaScript Concurrency" - Adam Boduch
4. **Circuit Breaker**: "Release It!" - Michael T. Nygard
5. **Graph Algorithms**: "Introduction to Algorithms" - CLRS (Chapter 22)

---

**Decision Status**: ✅ All research areas resolved  
**Next Phase**: Data model design and API contracts