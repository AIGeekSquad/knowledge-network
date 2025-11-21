import { LayoutPhase } from '../types';

/** Layout progress event data */
export interface LayoutProgressEvent {
    readonly type: 'nodeLoading' | 'nodeLayout' | 'nodeLayoutComplete';
    readonly progress: number;
    readonly phase: string;
    readonly nodesProcessed: number;
    readonly totalNodes: number;
    readonly timeElapsed: number;
    readonly estimatedRemaining?: number;
}

/** Phase completion event data */
export interface PhaseCompleteEvent {
    readonly phase: LayoutPhase;
    readonly duration: number;
    readonly nodesPositioned: number;
    readonly convergenceAchieved: boolean;
}

/** Layout completion event data */
export interface LayoutCompleteEvent {
    readonly totalDuration: number;
    readonly finalStability: number;
    readonly totalNodes: number;
    readonly totalIterations: number;
}

/** Convergence update event data */
export interface ConvergenceUpdateEvent {
    readonly stability: number;
    readonly positionDelta: number;
    readonly iterations: number;
    readonly phase: LayoutPhase;
}

/** Layout event emitter interface */
export interface LayoutEventEmitter {
    on(event: 'layoutProgress', handler: (data: LayoutProgressEvent) => void): void;
    on(event: 'phaseComplete', handler: (data: PhaseCompleteEvent) => void): void;
    on(event: 'layoutComplete', handler: (data: LayoutCompleteEvent) => void): void;
    on(event: 'convergenceUpdate', handler: (data: ConvergenceUpdateEvent) => void): void;
    emit(event: string, data: any): void;
    off(event: string, handler: Function): void;
}
