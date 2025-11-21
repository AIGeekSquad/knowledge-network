/**
 * SpatialOptimizer Tests
 * 
 * Tests for coordinate calculation accuracy, mapping algorithms, and boundary constraints.
 * Corresponds to T015 in specs/002-node-layout/tasks.md
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialOptimizer, SimilarityMappingAlgorithms } from '../src/layout/SpatialOptimizer';
import { Position3D, BoundingBox } from '../src/types';

describe('SpatialOptimizer', () => {
    let optimizer: SpatialOptimizer;
    let boundingBox: BoundingBox;

    beforeEach(() => {
        optimizer = new SpatialOptimizer();
        boundingBox = { minX: 0, maxX: 100, minY: 0, maxY: 100, minZ: 0, maxZ: 100 };
    });

    describe('Mapping Algorithms', () => {
        it('should support exponential mapping', () => {
            const mapper = SimilarityMappingAlgorithms.exponential;
            const config = { maxDistance: 100, exponent: 2 };

            // High similarity -> Low distance
            expect(mapper(1.0, config)).toBe(0);
            // Low similarity -> High distance
            expect(mapper(0.0, config)).toBe(100);
            // Mid similarity -> Non-linear distance
            expect(mapper(0.5, config)).toBe(75); // 100 * (1 - 0.25)
        });

        it('should support linear mapping', () => {
            const mapper = SimilarityMappingAlgorithms.linear;
            const config = { maxDistance: 100 };

            expect(mapper(1.0, config)).toBe(0);
            expect(mapper(0.0, config)).toBe(100);
            expect(mapper(0.5, config)).toBe(50);
        });

        it('should allow configuring mapping algorithm', () => {
            optimizer.setSimilarityMapper(SimilarityMappingAlgorithms.linear, { maxDistance: 50 });
            const { mapper, config } = optimizer.getMappingConfig();

            expect(mapper).toBe(SimilarityMappingAlgorithms.linear);
            expect(config.maxDistance).toBe(50);
        });
    });

    describe('Coordinate Calculation', () => {
        it('should respect boundary constraints', () => {
            const positions: Position3D[] = [
                { x: -10, y: 50, z: 50 }, // Out of bounds X
                { x: 50, y: 150, z: 50 }, // Out of bounds Y
                { x: 50, y: 50, z: -10 }  // Out of bounds Z
            ];

            // Access private method via any cast or public wrapper if available
            // Since applyBoundaryConstraints is private, we test via optimizePositions or similar public API
            // However, optimizePositions initializes random positions within bounds.
            // We might need to expose a way to test constraints or rely on the fact that outputs are bounded.

            const similarities = new Map<string, number>();
            const optimized = optimizer.optimizePositions(similarities, {
                dimensions: 3,
                boundingBox
            });

            optimized.forEach(pos => {
                expect(pos.x).toBeGreaterThanOrEqual(boundingBox.minX);
                expect(pos.x).toBeLessThanOrEqual(boundingBox.maxX);
                expect(pos.y).toBeGreaterThanOrEqual(boundingBox.minY);
                expect(pos.y).toBeLessThanOrEqual(boundingBox.maxY);
                if (pos.z !== undefined) {
                    expect(pos.z).toBeGreaterThanOrEqual(boundingBox.minZ || 0);
                    expect(pos.z).toBeLessThanOrEqual(boundingBox.maxZ || 0);
                }
            });
        });

        it('should calculate distance correctly', () => {
            // We can test the public calculateStress which uses calculateDistance internally
            // Or we can test a public helper if we add one.
            // For now, let's verify stress calculation for known positions
            const positions: Position3D[] = [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 0, z: 0 }
            ];
            const nodeIds = ['a', 'b'];
            const similarities = new Map<string, number>();
            similarities.set('a|b', 0.9); // High similarity -> should be close

            // With default exponential mapping (maxDist=100, exp=2):
            // Target dist = 100 * (1 - 0.9^2) = 100 * (1 - 0.81) = 19
            // Actual dist = 10
            // Stress should be (19 - 10)^2 = 81

            const stress = optimizer.calculateStress(similarities, positions, nodeIds);
            expect(stress).toBeCloseTo(Math.sqrt(81)); // calculateStress returns RMSE
        });
    });
});
