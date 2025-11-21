import { LayoutConfig } from '../types';

/**
 * Factory for creating and managing LayoutConfig objects
 */
export class LayoutConfigFactory {
    /**
     * Create a default configuration
     */
    public static createDefault(): LayoutConfig {
        return {
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
        };
    }

    /**
     * Create a configuration by merging defaults with partial overrides
     */
    public static create(partial?: Partial<LayoutConfig>): LayoutConfig {
        const defaults = this.createDefault();
        if (!partial) return defaults;
        return { ...defaults, ...partial };
    }
}
