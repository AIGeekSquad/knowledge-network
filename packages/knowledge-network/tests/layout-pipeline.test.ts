import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LayoutPipeline } from '../src/layout/LayoutPipeline';
import { SimilarityProcessor } from '../src/layout/SimilarityProcessor';
import { SpatialOptimizer } from '../src/layout/SpatialOptimizer';
import { EventEmitter } from '../src/utils/EventEmitter';
import { LayoutConfigFactory } from '../src/layout/LayoutConfigFactory';
import { Node, LayoutConfig } from '../src/types';

describe('LayoutPipeline', () => {
    let pipeline: LayoutPipeline;
    let similarityProcessor: SimilarityProcessor;
    let spatialOptimizer: SpatialOptimizer;
    let eventEmitter: EventEmitter;
    let config: LayoutConfig;

    const mockNodes: Node[] = [
        { id: '1', label: 'Node 1', vector: [1, 0, 0] },
        { id: '2', label: 'Node 2', vector: [0, 1, 0] },
        { id: '3', label: 'Node 3', vector: [0, 0, 1] }
    ];

    // Mock functor with correct signature (3 args)
    const mockFunctor = (a: Node, b: Node, c: any) => 0.5;

    beforeEach(() => {
        similarityProcessor = new SimilarityProcessor();
        spatialOptimizer = new SpatialOptimizer();
        eventEmitter = new EventEmitter();
        config = LayoutConfigFactory.createDefault();

        pipeline = new LayoutPipeline(
            similarityProcessor,
            spatialOptimizer,
            eventEmitter
        );
    });

    it('should execute layout pipeline successfully', async () => {
        const emitSpy = vi.spyOn(eventEmitter, 'emit');

        const result = await pipeline.executeAsync(mockNodes, mockFunctor, config);

        expect(result.status.success).toBe(true);
        expect(result.nodes).toHaveLength(3);
        expect(result.processingTime).toBeGreaterThan(0);

        // Verify events were emitted
        expect(emitSpy).toHaveBeenCalledWith('layoutProgress', expect.objectContaining({
            type: 'nodeLoading',
            phase: 'initialization'
        }));

        expect(emitSpy).toHaveBeenCalledWith('layoutProgress', expect.objectContaining({
            type: 'nodeLayout',
            phase: 'similarity-calculation'
        }));

        expect(emitSpy).toHaveBeenCalledWith('layoutProgress', expect.objectContaining({
            type: 'nodeLayout',
            phase: 'spatial-optimization'
        }));

        expect(emitSpy).toHaveBeenCalledWith('layoutComplete', expect.any(Object));
    });

    it('should handle errors gracefully', async () => {
        // Error functor with correct signature but throws
        const errorFunctor = (a: Node, b: Node, c: any) => { throw new Error('Functor error'); };

        const result = await pipeline.executeAsync(mockNodes, errorFunctor, config);

        expect(result.status.success).toBe(false);
        expect(result.status.errors.some(e => e.includes('Functor error'))).toBe(true);
    });

    it('should validate similarity functor contract', async () => {
        const validateSpy = vi.spyOn(similarityProcessor, 'validateFunctorContract');

        await pipeline.executeAsync(mockNodes, mockFunctor, config);

        expect(validateSpy).toHaveBeenCalledWith(mockFunctor);
    });
});
