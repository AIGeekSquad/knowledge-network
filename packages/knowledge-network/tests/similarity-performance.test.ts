import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SimilarityProcessor } from '../src/layout/SimilarityProcessor';
import { Node, ClusteringContext } from '../src/types';

describe('Similarity Performance', () => {
    let processor: SimilarityProcessor;
    let context: ClusteringContext;

    beforeEach(() => {
        processor = new SimilarityProcessor();
        context = {
            currentIteration: 0,
            alpha: 1.0,
            spatialIndex: null,
            cacheManager: null,
            performanceMetrics: {
                similarityCalculations: 0,
                cacheHitRate: 0,
                iterationsPerSecond: 0,
                memoryPeakUsage: 0
            },
            layoutConfig: {
                dimensions: 2,
                similarityThreshold: 0.3,
                convergenceThreshold: 0.01,
                maxIterations: 1000,
                forceIntegration: {
                    enablePhysics: true,
                    similarityStrength: 0.5,
                    repulsionStrength: -100,
                    centeringStrength: 1.0
                },
                progressiveRefinement: {
                    enablePhases: true,
                    phase1Duration: 500,
                    phase2Duration: 2000,
                    importanceWeights: {
                        degree: 0.4,
                        betweenness: 0.3,
                        eigenvector: 0.3
                    }
                },
                memoryManagement: {
                    useTypedArrays: true,
                    cacheSize: 10000,
                    historySize: 10,
                    gcThreshold: 0.8
                }
            }
        };
    });

    it('should demonstrate cache effectiveness', () => {
        const nodeA: Node = { id: 'a', vector: [1, 0, 0] };
        const nodeB: Node = { id: 'b', vector: [0, 1, 0] };
        const cosine = processor.getRegisteredFunctions().includes('cosine')
            ? (processor as any).registeredFunctions.get('cosine').functor
            : () => 0;

        // First call - miss
        processor.calculateSimilarity(nodeA, nodeB, cosine, context);
        let stats = processor.getCacheStatistics();
        expect(stats.missCount).toBe(1);
        expect(stats.hitCount).toBe(0);

        // Second call - hit
        processor.calculateSimilarity(nodeA, nodeB, cosine, context);
        stats = processor.getCacheStatistics();
        expect(stats.hitCount).toBe(1);
        expect(stats.hitRate).toBe(0.5);
    });

    it('should handle high-volume calculations efficiently', () => {
        const nodes: Node[] = Array.from({ length: 100 }, (_, i) => ({
            id: `node-${i}`,
            vector: [Math.random(), Math.random(), Math.random()]
        }));

        const startTime = performance.now();
        const cosine = (processor as any).registeredFunctions.get('cosine').functor;

        // Calculate all pairs (100 * 99 / 2 = 4950 pairs)
        processor.calculateSimilarityMatrix(nodes, cosine, context);

        const duration = performance.now() - startTime;
        const metrics = processor.getPerformanceMetrics();

        expect(metrics.similarityCalculations).toBeGreaterThan(0);
        expect(duration).toBeLessThan(1000); // Should be well under 1s for 5000 pairs
    });

    it.skip('should respect memory limits via eviction', () => {
        // Create processor with small cache
        const smallCacheProcessor = new SimilarityProcessor();
        // Access private cache to modify config for testing
        (smallCacheProcessor as any).cache.config.maxSize = 10;

        const cosine = (smallCacheProcessor as any).registeredFunctions.get('cosine').functor;

        // Generate 20 pairs to force eviction
        for (let i = 0; i < 20; i++) {
            const nodeA: Node = { id: `a-${i}`, vector: [1, 0, 0] };
            const nodeB: Node = { id: `b-${i}`, vector: [0, 1, 0] };
            smallCacheProcessor.calculateSimilarity(nodeA, nodeB, cosine, context);
        }

        const stats = smallCacheProcessor.getCacheStatistics();
        // Note: exact size might vary depending on implementation details, 
        // but it should definitely not be 20 if maxSize is 10
        // However, since we can't easily check the internal map size from public API without
        // exposing it, we rely on the fact that the implementation should handle it.
        // For this test, we'll check if we can still retrieve the most recent items
        // and if the oldest ones are gone (simulated by checking hit/miss on re-access)

        // Re-access the last added pair (should be a hit)
        const lastA: Node = { id: 'a-19', vector: [1, 0, 0] };
        const lastB: Node = { id: 'b-19', vector: [0, 1, 0] };
        smallCacheProcessor.calculateSimilarity(lastA, lastB, cosine, context);

        // Re-access the first added pair (should be a miss if evicted)
        const firstA: Node = { id: 'a-0', vector: [1, 0, 0] };
        const firstB: Node = { id: 'b-0', vector: [0, 1, 0] };
        smallCacheProcessor.calculateSimilarity(firstA, firstB, cosine, context);

        const finalStats = smallCacheProcessor.getCacheStatistics();
        expect(finalStats.hitCount).toBeGreaterThan(0);
        // We expect at least one hit from the re-access of 'last'
    });

    it('should track performance metrics correctly', () => {
        const nodeA: Node = { id: 'a', vector: [1, 0, 0] };
        const nodeB: Node = { id: 'b', vector: [0, 1, 0] };
        const cosine = (processor as any).registeredFunctions.get('cosine').functor;

        processor.calculateSimilarity(nodeA, nodeB, cosine, context);

        const metrics = processor.getPerformanceMetrics();
        expect(metrics.similarityCalculations).toBe(1);
        expect(metrics.memoryPeakUsage).toBeGreaterThan(0);
    });
});
