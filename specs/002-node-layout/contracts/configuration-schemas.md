# NodeLayout Configuration Schemas

**Feature**: `002-node-layout`  
**Created**: 2025-11-13  
**Phase**: Phase 1 - Configuration Schema Definition  
**Project**: Knowledge Network Library

## Overview

This document defines the configuration schemas for the NodeLayout engine, including layout parameters, optimization settings, and performance tuning options based on research findings for similarity-based node positioning with progressive convergence.

## Core Configuration Interface

### LayoutConfig

Main configuration interface integrating all layout parameters and optimization settings.

```typescript
interface LayoutConfig {
  /** Coordinate system dimensions */
  readonly dimensions: 2 | 3;
  
  /** Similarity calculation settings */
  readonly similarity: SimilarityConfig;
  
  /** Convergence detection settings */
  readonly convergence: ConvergenceConfig;
  
  /** Progressive refinement configuration */
  readonly progressive: ProgressiveConfig;
  
  /** Force integration settings */
  readonly forces: ForceConfig;
  
  /** Performance optimization settings */
  readonly performance: PerformanceConfig;
  
  /** Memory management settings */
  readonly memory: MemoryConfig;
  
  /** Spatial indexing configuration */
  readonly spatial: SpatialConfig;
  
  /** Event and monitoring settings */
  readonly events: EventConfig;
}
```

## Configuration Schema Tables

### Performance Targets Configuration

| Parameter | Type | Default | Range | Description |
|-----------|------|---------|-------|-------------|
| `initialPositioning` | `number` | `500` | `100-5000` | Target time for initial positioning (ms) |
| `fullConvergence` | `number` | `5000` | `1000-30000` | Target time for full convergence (ms) |
| `calculationsPerSecond` | `number` | `1000000` | `10000-10000000` | Target similarity calculations per second |
| `maxMemoryUsage` | `number` | `209715200` | `10MB-2GB` | Maximum acceptable memory usage (bytes) |
| `cacheHitRate` | `number` | `0.6` | `0-1` | Target cache hit rate |

### Progressive Phase Configuration

| Phase | Duration (ms) | Node Fraction | Initial Alpha | Alpha Decay | Description |
|-------|---------------|---------------|---------------|-------------|-------------|
| `COARSE` | `500` | `0.2` | `0.3` | `0.05` | High-importance nodes, aggressive cooling |
| `MEDIUM` | `2000` | `0.6` | `0.2` | `0.03` | Medium-importance nodes, moderate cooling |
| `FINE` | `5000` | `1.0` | `0.1` | `0.0228` | All nodes, gentle cooling for stability |

### Similarity Function Defaults

| Function | Enabled | Weight | Use Case | Performance |
|----------|---------|--------|----------|-------------|
| `cosine` | `true` | `1.0` | Vector embeddings, semantic similarity | Fast |
| `jaccard` | `true` | `0.7` | Metadata overlap, categorical similarity | Fast |
| `spatial` | `true` | `0.3` | Position-based fallback | Fast |

### Memory Configuration Defaults

| Setting | Default | Type | Description |
|---------|---------|------|-------------|
| `useTypedArrays` | `true` | `boolean` | Use Float32Array for coordinates |
| `preAllocateBuffers` | `true` | `boolean` | Pre-allocate memory buffers |
| `bufferSizeMultiplier` | `1.5` | `number` | Growth factor for buffer expansion |
| `coordinatePrecision` | `'float32'` | `string` | Coordinate storage precision |

### Spatial Indexing Defaults

| Parameter | Default | Range | Description |
|-----------|---------|-------|-------------|
| `maxDepth` | `10` | `5-20` | Maximum quadtree depth |
| `maxNodesPerLeaf` | `10` | `5-50` | Nodes per leaf before subdivision |
| `rebuildFrequency` | `15` | `5-100` | Iterations between index rebuilds |
| `theta` | `0.8` | `0.1-2.0` | Barnes-Hut approximation threshold |

### Cache Configuration Defaults

| Setting | Default | Description |
|---------|---------|-------------|
| `maxSize` | `10000` | Maximum cache entries |
| `maxMemory` | `10485760` | Maximum cache memory (10MB) |
| `ttl` | `30000` | Time-to-live (30 seconds) |
| `policy` | `'lru'` | Eviction policy (LRU) |
| `triggerThreshold` | `0.9` | Cache usage trigger for eviction |

## Default Configuration Template

```typescript
export const DefaultLayoutConfig: LayoutConfig = {
  dimensions: 2,
  
  similarity: {
    threshold: 0.3,
    distanceMapping: {
      type: 'exponential',
      gamma: 2.0,
      minDistance: 10,
      maxDistance: 500
    },
    composition: {
      strategy: 'weighted-average',
      normalization: 'sum',
      allowRuntimeRegistration: true,
      maxFunctions: 5
    },
    caching: {
      enabled: true,
      storage: {
        maxSize: 10000,
        maxMemory: 10485760,
        backend: 'memory',
        persistence: { enabled: false }
      },
      eviction: {
        policy: 'lru',
        triggerThreshold: 0.9,
        evictionTarget: 0.2,
        batchSize: 100
      },
      invalidation: {
        ttl: 30000,
        eventDriven: true,
        events: ['node-metadata-change', 'similarity-function-change']
      }
    },
    defaultFunctions: {
      cosine: { enabled: true, weight: 1.0 },
      jaccard: { enabled: true, weight: 0.7 },
      spatial: { enabled: true, weight: 0.3 }
    }
  },
  
  convergence: {
    threshold: 0.01,
    stability: {
      positionThreshold: 1.0,
      velocityThreshold: 0.1,
      stableIterationCount: 5,
      historyWindowSize: 10,
      maxPositionVariance: 0.5
    },
    monitoring: {
      checkFrequency: 10,
      enablePrediction: true,
      trendWindowSize: 50,
      predictionConfidence: 0.7
    },
    earlyTermination: {
      enabled: true,
      convergenceRatio: 0.95,
      maxIterations: 1000,
      timeout: 30000
    }
  },
  
  progressive: {
    enabled: true,
    phases: [
      {
        phase: LayoutPhase.COARSE,
        duration: 500,
        nodeFraction: 0.2,
        simulation: {
          initialAlpha: 0.3,
          alphaDecay: 0.05,
          targetAlpha: 0.01,
          maxIterations: 100
        },
        convergence: {
          threshold: 0.05,
          stabilityRatio: 0.8,
          allowEarlyCompletion: true
        }
      },
      {
        phase: LayoutPhase.MEDIUM,
        duration: 2000,
        nodeFraction: 0.6,
        simulation: {
          initialAlpha: 0.2,
          alphaDecay: 0.03,
          targetAlpha: 0.005,
          maxIterations: 300
        },
        convergence: {
          threshold: 0.02,
          stabilityRatio: 0.9,
          allowEarlyCompletion: true
        }
      },
      {
        phase: LayoutPhase.FINE,
        duration: 5000,
        nodeFraction: 1.0,
        simulation: {
          initialAlpha: 0.1,
          alphaDecay: 0.0228,
          targetAlpha: 0.001,
          maxIterations: 500
        },
        convergence: {
          threshold: 0.01,
          stabilityRatio: 0.95,
          allowEarlyCompletion: false
        }
      }
    ],
    importance: {
      weights: {
        degree: 0.4,
        betweenness: 0.3,
        eigenvector: 0.3
      },
      method: 'centrality',
      enableRecalculation: false
    },
    transitions: {
      triggers: ['time-elapsed', 'convergence-achieved'],
      timing: 'adaptive',
      phaseOverlap: 0,
      allowManualControl: true
    }
  },
  
  forces: {
    enabled: true,
    similarity: {
      enabled: true,
      strength: 0.5,
      distanceScale: 1.0,
      minForce: 0.001,
      maxForce: 10.0
    },
    repulsion: {
      enabled: true,
      strength: -100,
      minDistance: 1,
      maxDistance: 500,
      theta: 0.8
    },
    centering: {
      enabled: true,
      strength: 1.0,
      center: { x: 0, y: 0, z: 0 }
    },
    collision: {
      enabled: true,
      strength: 0.7,
      radius: 5,
      iterations: 1
    },
    custom: []
  },
  
  performance: {
    targets: {
      initialPositioning: 500,
      fullConvergence: 5000,
      calculationsPerSecond: 1000000,
      maxMemoryUsage: 209715200,
      cacheHitRate: 0.6
    },
    optimization: {
      enabled: true,
      webAssembly: {
        enabled: false,
        nodeThreshold: 10000,
        modulePath: './similarity-wasm.wasm',
        memorySize: 16777216
      },
      simd: {
        enabled: true,
        vectorSize: 128,
        dimensionThreshold: 4
      },
      batching: {
        enabled: true,
        batchSize: 1000,
        batchTimeout: 100
      }
    },
    workers: {
      enabled: false,
      nodeThreshold: 3000,
      workerCount: 4,
      workerScript: './layout-worker.js',
      transferOptimization: {
        useTransferables: true,
        serializationFormat: 'arraybuffer',
        batchTransferSize: 1048576
      }
    },
    monitoring: {
      enabled: true,
      updateFrequency: 1000,
      metrics: [
        'similarity-calculations',
        'memory-usage',
        'cache-performance',
        'iteration-timing'
      ],
      alerts: []
    }
  },
  
  memory: {
    allocation: {
      useTypedArrays: true,
      preAllocateBuffers: true,
      growthStrategy: 'exponential',
      bufferSizeMultiplier: 1.5,
      objectPooling: {
        enabled: true,
        vectorPoolSize: 1000,
        positionPoolSize: 1000,
        cleanupFrequency: 10000
      }
    },
    garbageCollection: {
      triggerThreshold: 0.8,
      forceInterval: 60000,
      proactiveCleanup: true,
      strategies: [
        'cache-eviction',
        'pool-cleanup',
        'history-truncation'
      ]
    },
    monitoring: {
      enabled: true,
      interval: 5000,
      alertThreshold: 0.9,
      detailedBreakdown: true
    },
    optimization: {
      compression: false,
      sharedBuffers: false,
      coordinatePrecision: 'float32',
      historyCompression: {
        enabled: false,
        algorithm: 'delta',
        targetRatio: 0.5
      }
    }
  },
  
  spatial: {
    indexing: {
      enabled: true,
      type: 'quadtree',
      maxDepth: 10,
      maxNodesPerLeaf: 10,
      rebuildFrequency: 15,
      rebuildThreshold: 0.25
    },
    barnesHut: {
      enabled: true,
      theta: 0.8,
      minDistance: 1,
      maxDistance: 1000
    },
    neighborQueries: {
      defaultRadius: 50,
      maxNeighbors: 100,
      caching: {
        enabled: true,
        size: 1000,
        ttl: 5000,
        invalidation: 'hybrid'
      },
      adaptiveRadius: true
    },
    bounds: {
      automatic: true,
      padding: 0.1,
      dynamic: true
    }
  },
  
  events: {
    enabled: true,
    frequency: {
      progress: 100,
      performance: 1000,
      convergence: 500,
      nodeUpdates: 50
    },
    filtering: {
      minProgressChange: 1,
      minPerformanceChange: 5,
      typeFilters: []
    },
    batching: {
      enabled: false,
      batchSize: 10,
      batchTimeout: 100,
      batchableEvents: ['node-update']
    }
  }
};
```

## Configuration Validation

### Validation Schema

```typescript
interface ConfigValidationRule {
  readonly field: string;
  readonly type: 'number' | 'boolean' | 'string' | 'object' | 'array';
  readonly required: boolean;
  readonly min?: number;
  readonly max?: number;
  readonly enum?: string[];
  readonly validator?: (value: unknown) => boolean;
}

const ConfigValidationRules: ConfigValidationRule[] = [
  {
    field: 'dimensions',
    type: 'number',
    required: true,
    enum: ['2', '3']
  },
  {
    field: 'similarity.threshold',
    type: 'number',
    required: true,
    min: 0,
    max: 1
  },
  {
    field: 'convergence.threshold',
    type: 'number',
    required: true,
    min: 0.001,
    max: 1
  },
  {
    field: 'performance.targets.initialPositioning',
    type: 'number',
    required: true,
    min: 100,
    max: 10000
  },
  {
    field: 'memory.allocation.bufferSizeMultiplier',
    type: 'number',
    required: true,
    min: 1.1,
    max: 5.0
  },
  {
    field: 'spatial.barnesHut.theta',
    type: 'number',
    required: true,
    min: 0.1,
    max: 2.0
  }
];
```

### Configuration Builder

```typescript
class LayoutConfigBuilder {
  private config: Partial<LayoutConfig> = {};
  
  static create(): LayoutConfigBuilder {
    return new LayoutConfigBuilder();
  }
  
  withDimensions(dimensions: 2 | 3): LayoutConfigBuilder {
    this.config.dimensions = dimensions;
    return this;
  }
  
  withSimilarityThreshold(threshold: number): LayoutConfigBuilder {
    if (!this.config.similarity) {
      this.config.similarity = {} as SimilarityConfig;
    }
    (this.config.similarity as any).threshold = threshold;
    return this;
  }
  
  withProgressivePhases(enabled: boolean): LayoutConfigBuilder {
    if (!this.config.progressive) {
      this.config.progressive = {} as ProgressiveConfig;
    }
    (this.config.progressive as any).enabled = enabled;
    return this;
  }
  
  withPerformanceTargets(targets: Partial<PerformanceTargets>): LayoutConfigBuilder {
    if (!this.config.performance) {
      this.config.performance = {} as PerformanceConfig;
    }
    if (!(this.config.performance as any).targets) {
      (this.config.performance as any).targets = {};
    }
    Object.assign((this.config.performance as any).targets, targets);
    return this;
  }
  
  build(): LayoutConfig {
    const merged = this.mergeWithDefaults(this.config);
    this.validateConfig(merged);
    return merged;
  }
  
  private mergeWithDefaults(partial: Partial<LayoutConfig>): LayoutConfig {
    return {
      ...DefaultLayoutConfig,
      ...partial,
      similarity: {
        ...DefaultLayoutConfig.similarity,
        ...partial.similarity
      },
      convergence: {
        ...DefaultLayoutConfig.convergence,
        ...partial.convergence
      },
      performance: {
        ...DefaultLayoutConfig.performance,
        ...partial.performance
      }
    };
  }
  
  private validateConfig(config: LayoutConfig): void {
    for (const rule of ConfigValidationRules) {
      const value = this.getNestedValue(config, rule.field);
      
      if (rule.required && value === undefined) {
        throw new Error(`Required field ${rule.field} is missing`);
      }
      
      if (value !== undefined) {
        if (typeof value !== rule.type) {
          throw new Error(`Field ${rule.field} must be of type ${rule.type}`);
        }
        
        if (rule.min !== undefined && (value as number) < rule.min) {
          throw new Error(`Field ${rule.field} must be >= ${rule.min}`);
        }
        
        if (rule.max !== undefined && (value as number) > rule.max) {
          throw new Error(`Field ${rule.field} must be <= ${rule.max}`);
        }
        
        if (rule.enum && !rule.enum.includes(String(value))) {
          throw new Error(`Field ${rule.field} must be one of: ${rule.enum.join(', ')}`);
        }
        
        if (rule.validator && !rule.validator(value)) {
          throw new Error(`Field ${rule.field} failed custom validation`);
        }
      }
    }
  }
  
  private getNestedValue(obj: any, path: string): unknown {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

## Usage Examples

### Basic Configuration

```typescript
// Minimal configuration for small graphs
const basicConfig = LayoutConfigBuilder
  .create()
  .withDimensions(2)
  .withSimilarityThreshold(0.5)
  .withProgressivePhases(false)
  .build();
```

### Performance-Optimized Configuration

```typescript
// High-performance configuration for large graphs
const performanceConfig = LayoutConfigBuilder
  .create()
  .withDimensions(2)
  .withPerformanceTargets({
    initialPositioning: 200,
    calculationsPerSecond: 2000000
  })
  .withProgressivePhases(true)
  .build();

// Enable WebWorkers for large datasets
performanceConfig.performance.workers.enabled = true;
performanceConfig.performance.workers.nodeThreshold = 1000;
```

### Memory-Constrained Configuration

```typescript
// Optimized for limited memory environments
const memoryConfig = LayoutConfigBuilder
  .create()
  .withDimensions(2)
  .build();

// Reduce memory usage
memoryConfig.memory.allocation.bufferSizeMultiplier = 1.2;
memoryConfig.similarity.caching.storage.maxSize = 5000;
memoryConfig.similarity.caching.storage.maxMemory = 5242880; // 5MB
```

### 3D Configuration

```typescript
// Configuration for 3D layouts
const config3D = LayoutConfigBuilder
  .create()
  .withDimensions(3)
  .build();

// Adjust spatial indexing for 3D
config3D.spatial.indexing.type = 'octree';
config3D.forces.centering.center = { x: 0, y: 0, z: 0 };
```

### Research Domain Configuration

```typescript
// Configuration for academic paper similarity
const researchConfig = LayoutConfigBuilder
  .create()
  .withSimilarityThreshold(0.4)
  .build();

// Disable spatial fallback for pure semantic similarity
researchConfig.similarity.defaultFunctions.spatial.enabled = false;
researchConfig.similarity.defaultFunctions.cosine.weight = 0.8;
researchConfig.similarity.defaultFunctions.jaccard.weight = 0.2;
```

This comprehensive configuration system provides flexible, type-safe configuration management for the NodeLayout engine while maintaining performance and architectural consistency with the established modular patterns from the Knowledge Network library.