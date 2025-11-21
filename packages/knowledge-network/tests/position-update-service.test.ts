import { describe, it, expect, beforeEach } from 'vitest';
import { PositionUpdateService } from '../src/layout/PositionUpdateService';
import { Position3D, NodeUpdate } from '../src/types';

describe('PositionUpdateService', () => {
    let service: PositionUpdateService;

    beforeEach(() => {
        service = new PositionUpdateService();
    });

    describe('updatePositions', () => {
        it('should update positions for existing nodes', () => {
            const currentPositions: Position3D[] = [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 10, z: 0 }
            ];
            const nodeIds = ['1', '2'];

            const updates: NodeUpdate[] = [
                { nodeId: '1', newPosition: { x: 5, y: 5, z: 5 }, priority: 1, triggerConvergence: false }
            ];

            const result = service.updatePositions(updates, currentPositions, nodeIds);

            expect(result[0]).toEqual({ x: 5, y: 5, z: 5 });
            expect(result[1]).toEqual({ x: 10, y: 10, z: 0 });
        });

        it('should ignore updates for non-existent nodes', () => {
            const currentPositions: Position3D[] = [
                { x: 0, y: 0, z: 0 }
            ];
            const nodeIds = ['1'];

            const updates: NodeUpdate[] = [
                { nodeId: '999', newPosition: { x: 5, y: 5, z: 5 }, priority: 1, triggerConvergence: false }
            ];

            const result = service.updatePositions(updates, currentPositions, nodeIds);

            expect(result[0]).toEqual({ x: 0, y: 0, z: 0 });
        });

        it('should handle multiple updates', () => {
            const currentPositions: Position3D[] = [
                { x: 0, y: 0, z: 0 },
                { x: 10, y: 10, z: 0 }
            ];
            const nodeIds = ['1', '2'];

            const updates: NodeUpdate[] = [
                { nodeId: '1', newPosition: { x: 1, y: 1, z: 1 }, priority: 1, triggerConvergence: false },
                { nodeId: '2', newPosition: { x: 2, y: 2, z: 2 }, priority: 1, triggerConvergence: false }
            ];

            const result = service.updatePositions(updates, currentPositions, nodeIds);

            expect(result[0]).toEqual({ x: 1, y: 1, z: 1 });
            expect(result[1]).toEqual({ x: 2, y: 2, z: 2 });
        });
    });

    describe('applyUpdate', () => {
        it('should apply partial updates', () => {
            const current: Position3D = { x: 10, y: 20, z: 30 };
            const update: Partial<Position3D> = { x: 15 };

            const result = service.applyUpdate(current, update);

            expect(result).toEqual({ x: 15, y: 20, z: 30 });
        });

        it('should apply full updates', () => {
            const current: Position3D = { x: 10, y: 20, z: 30 };
            const update: Partial<Position3D> = { x: 0, y: 0, z: 0 };

            const result = service.applyUpdate(current, update);

            expect(result).toEqual({ x: 0, y: 0, z: 0 });
        });
    });
});
