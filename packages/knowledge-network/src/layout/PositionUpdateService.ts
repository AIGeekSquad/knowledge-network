/**
 * @fileoverview PositionUpdateService - Centralizes logic for updating node positions
 * 
 * Handles the application of position updates to layout nodes, ensuring consistency
 * and providing a single point of entry for position modifications.
 */

import { Position3D, NodeUpdate } from '../types';

export class PositionUpdateService {
    /**
     * Update positions for specific nodes
     */
    public updatePositions(
        nodeUpdates: NodeUpdate[],
        currentPositions: Position3D[],
        nodeIds: string[]
    ): Position3D[] {
        const updatedPositions = [...currentPositions];

        for (const update of nodeUpdates) {
            const index = nodeIds.indexOf(update.nodeId);
            if (index >= 0 && index < updatedPositions.length) {
                updatedPositions[index] = update.newPosition;
            }
        }

        return updatedPositions;
    }

    /**
     * Apply a single update to a position
     */
    public applyUpdate(currentPosition: Position3D, update: Partial<Position3D>): Position3D {
        return {
            x: update.x !== undefined ? update.x : currentPosition.x,
            y: update.y !== undefined ? update.y : currentPosition.y,
            z: update.z !== undefined ? update.z : currentPosition.z
        };
    }
}
