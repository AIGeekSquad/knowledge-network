# Quickstart: Modular Knowledge Graph Engine

**Feature**: 001-modular-graph-engine | **Date**: 2025-11-13
**Objective**: Comprehensive usage examples for the modular graph engine implementation

## Overview

The Modular Knowledge Graph Engine provides a flexible, pipeline-based architecture for knowledge graph visualization with pluggable rendering strategies, runtime extensibility, and centralized progress coordination.

## Installation and Setup

```typescript
// Installation (when published)
npm install @aigeeksquad/knowledge-network

// Import core components
import { ModularGraphEngine, GraphConfigBuilder } from '@aigeeksquad/knowledge-network';
```

## Basic Usage Examples

### 1. Simple Graph Initialization

```typescript
import { ModularGraphEngine } from '@knowledge-network/modular-graph-engine';
import { GraphConfigBuilder } from '@knowledge-network/configuration';

// Create basic configuration using builder pattern
const config = new GraphConfigBuilder()
  .withCore({
    container: '#graph-container',
    dimensions: {
      width: 800,
      height: 600,
      responsive: true
    },
    data: {
      source: 'inline',
      fieldMapping: {
        node: { id: 'id', label: 'name' },
        edge: { source: 'from', target: 'to' }
      }
    }
  })
  .withNodeLayout({
    engine: 'force-directed',
    forces: {
      center: { enabled: true, strength: 0.1 },
      charge: { enabled: true, strength: -300 },
      link: { enabled: true, strength: 0.1, distance: 100 }
    }
  })
  .withRendering({
    strategy: 'canvas',
    quality: { antialiasing: { enabled: true } }
  })
  .build();

// Initialize graph engine
const graphEngine = new ModularGraphEngine(config);

// Load data and render
const graphData = {
  nodes: [
    { id: 'node1', name: 'Alice', type: 'person' },
    { id: 'node2', name: 'Bob', type: 'person' },
    { id: 'node3', name: 'Company', type: 'organization' }
  ],
  edges: [
    { from: 'node1', to: 'node2', type: 'knows' },
    { from: 'node1', to: 'node3', type: 'works_at' },
    { from: 'node2', to: 'node3', type: 'works_at' }
  ]
};

await graphEngine.loadDataAsync(graphData);
await graphEngine.renderAsync();
```

### 2. Switching Rendering Strategies

```typescript
// Start with simple edge rendering
const config = new GraphConfigBuilder()
  .withRendering({
    strategy: 'canvas',
    options: {
      canvas: {
        highDPI: true,
        imageSmoothingEnabled: true
      }
    }
  })
  .build();

const graphEngine = new ModularGraphEngine(config);
await graphEngine.loadDataAsync(graphData);

// Render with simple edges
await graphEngine.renderAsync();

// Switch to edge bundling strategy dynamically
await graphEngine.switchRenderingStrategyAsync('bundling', {
  bundling: {
    enabled: true,
    algorithm: 'force-directed',
    parameters: {
      bundleStrength: 0.8,
      subdivisionIterations: 3
    }
  }
});

// Navigation state is preserved across strategy changes
console.log('Current zoom level:', graphEngine.getNavigationState().zoomLevel);
```

### 3. Custom Similarity Functions

```typescript
import { ISimilarityMeasureRegistry } from '@knowledge-network/similarity-measure';

// Register custom similarity function (< 50 lines as per requirement)
const customSimilarity = {
  id: 'semantic-similarity',
  name: 'Semantic Node Similarity',
  description: 'Calculates similarity based on node semantic properties',
  calculateSimilarity: (nodeA, nodeB, context) => {
    // Pure function implementation
    const tagsA = nodeA.properties?.tags || [];
    const tagsB = nodeB.properties?.tags || [];
    
    if (tagsA.length === 0 && tagsB.length === 0) return 0.5;
    
    const intersection = tagsA.filter(tag => tagsB.includes(tag));
    const union = [...new Set([...tagsA, ...tagsB])];
    
    return union.length === 0 ? 0 : intersection.length / union.length;
  },
  configSchema: {
    version: '1.0',
    required: [],
    optional: [
      {
        name: 'weightMultiplier',
        type: 'number',
        description: 'Multiplier for similarity scores',
        defaultValue: 1.0
      }
    ],
    defaults: { weightMultiplier: 1.0 },
    validation: []
  },
  version: '1.0.0'
};

// Register the similarity measure
const registry = graphEngine.getSimilarityRegistry();
registry.register(customSimilarity);

// Use in configuration
const configWithCustomSimilarity = new GraphConfigBuilder()
  .withNodeLayout({
    similarity: {
      default: ['euclidean', 'semantic-similarity'],
      weights: new Map([
        ['euclidean', 0.4],
        ['semantic-similarity', 0.6]
      ]),
      conflictResolution: 'weighted-average'
    },
    clustering: {
      enabled: true,
      algorithm: 'similarity-based',
      parameters: { similarityThreshold: 0.7 }
    }
  })
  .build();

await graphEngine.updateConfigurationAsync(configWithCustomSimilarity);
```

### 4. Pipeline Progress Monitoring

```typescript
// Monitor detailed pipeline progress
const progressCallback = (progress) => {
  console.log(`Overall Progress: ${progress.overallProgress}%`);
  console.log(`Current Stage: ${progress.currentStage}`);
  console.log(`Stage Progress: ${progress.currentStageProgress}%`);
  console.log(`Message: ${progress.message}`);
  
  // Update UI progress indicators
  updateProgressBar(progress.overallProgress);
  updateStageIndicator(progress.currentStage, progress.stageBreakdown);
  
  // Show performance metrics
  console.log('Performance:', progress.metrics);
  if (progress.estimatedTimeRemaining) {
    console.log(`ETA: ${progress.estimatedTimeRemaining}ms`);
  }
};

// Execute pipeline with progress monitoring
await graphEngine.executeLayoutPipelineAsync(graphData, progressCallback);

// Example progress output:
// Overall Progress: 25%
// Current Stage: node-positioning
// Stage Progress: 75%
// Message: Positioning nodes using force simulation...
// Performance: { memoryUsage: 45MB, currentFPS: 60, processingRate: 120 }
// ETA: 3200ms
```

### 5. Navigation and Interaction

```typescript
// Configure navigation behavior
const navigationConfig = {
  zoom: {
    limits: { min: 0.1, max: 5.0 },
    step: 0.1,
    smooth: true,
    animationDuration: 300
  },
  pan: {
    enabled: true,
    inertia: true,
    friction: 0.85
  },
  selection: {
    mode: 'single', // Single selection only per clarifications
    autoDeselect: true,
    neighborHighlight: true,
    animationDuration: 200
  },
  keyboard: {
    enabled: true,
    keyMappings: new Map([
      ['fit', ['f']],
      ['reset', ['r']],
      ['zoom-in', ['+', '=']],
      ['zoom-out', ['-', '_']]
    ])
  }
};

const config = new GraphConfigBuilder()
  .withNavigation(navigationConfig)
  .build();

// Handle navigation events
graphEngine.onNavigationChange((newState, previousState, changes) => {
  if (changes.selectedNodeId !== undefined) {
    console.log('Selection changed:', newState.selectedNodeId);
    
    // Update UI for selected node
    if (newState.selectedNodeId) {
      showNodeDetails(newState.selectedNodeId);
      highlightNeighbors(newState.highlightedNodeIds);
    } else {
      hideNodeDetails();
      clearHighlights();
    }
  }
  
  if (changes.zoomLevel !== undefined) {
    console.log('Zoom changed:', newState.zoomLevel);
    updateZoomIndicator(newState.zoomLevel);
  }
});

// Programmatic navigation
await graphEngine.focusOnNodeAsync('node1', 2.0, true); // Focus on node with zoom level 2.0, animated
await graphEngine.fitToContentAsync(50, true); // Fit all content with 50px padding, animated
```

### 6. Performance Optimization for Large Datasets

```typescript
// Configure for large datasets (1000+ nodes with warning system)
const performanceConfig = new GraphConfigBuilder()
  .withPerformance({
    targets: {
      fps: 60,
      responseTime: 100, // 100ms response time requirement
      memoryLimit: 500,  // 500MB limit (~10MB per 100 nodes baseline)
      initializationTime: 5000
    },
    optimization: {
      autoDegradation: true,
      frustumCulling: true,
      objectPooling: true,
      batchRendering: true
    },
    memory: {
      gcHints: true,
      pooling: {
        enabled: true,
        poolSizes: new Map([
          ['nodes', 2000],
          ['edges', 5000]
        ])
      }
    },
    monitoring: {
      enabled: true,
      samplingInterval: 1000,
      alerts: {
        memoryWarningThreshold: 80, // 80% memory usage
        cpuWarningThreshold: 75,
        timeWarningThreshold: 150
      }
    }
  })
  .withRendering({
    optimization: {
      enabled: true,
      strategies: ['level-of-detail', 'culling', 'batching'],
      thresholds: {
        fpsThreshold: 45,
        memoryThreshold: 400,
        renderTimeThreshold: 16 // Target 60fps (16.67ms per frame)
      }
    },
    fallback: {
      enabled: true,
      fallbackOrder: ['canvas', 'svg'],
      triggers: {
        performance: {
          minFPS: 30,
          maxMemoryUsage: 450,
          maxRenderTime: 33 // 30fps fallback threshold
        }
      }
    }
  })
  .build();

// Handle performance warnings
graphEngine.onPerformanceWarning((warning) => {
  console.warn(`Performance Warning: ${warning.message}`);
  
  if (warning.type === 'dataset-size' && warning.severity === 'high') {
    showUserWarning('Large dataset detected. Performance may be affected.');
  }
});

// Handle automatic degradation
graphEngine.onAutomaticDegradation((event) => {
  console.log(`Automatic degradation: ${event.from} → ${event.to}`);
  console.log(`Reason: ${event.reason}`);
  
  updateUIStatus(`Switched to ${event.to} mode for better performance`);
});
```

### 7. Flexible Data Input Formats

```typescript
// Support various data formats with configurable field mappings
const flexibleDataConfig = new GraphConfigBuilder()
  .withCore({
    data: {
      source: 'inline',
      fieldMapping: {
        node: {
          id: 'identifier',
          label: 'displayName',
          type: 'category',
          properties: ['metadata', 'attributes']
        },
        edge: {
          source: 'sourceNode',
          target: 'targetNode',
          label: 'relationshipType',
          properties: ['weight', 'properties']
        },
        custom: new Map([
          ['nodeColor', 'metadata.color'],
          ['edgeWeight', 'properties.strength']
        ])
      },
      validation: {
        validateNodeUniqueness: true,
        validateEdgeReferences: true,
        requiredFields: ['identifier', 'sourceNode', 'targetNode']
      },
      preprocessing: {
        deduplicateNodes: true,
        removeSelfLoops: false,
        normalization: {
          normalizeIds: true,
          caseSensitive: false,
          trimWhitespace: true
        },
        enrichment: {
          autoGenerateLabels: true,
          inferNodeTypes: true,
          calculateDerivedProperties: true
        }
      }
    }
  })
  .build();

// Data in custom format
const customFormatData = {
  entities: [
    {
      identifier: 'person_1',
      displayName: 'Alice Johnson',
      category: 'researcher',
      metadata: { color: '#ff6b6b', department: 'AI Research' },
      attributes: { experience: 5, publications: 23 }
    },
    {
      identifier: 'org_1',
      displayName: 'TechCorp Inc.',
      category: 'organization',
      metadata: { color: '#4ecdc4', industry: 'Technology' }
    }
  ],
  relationships: [
    {
      sourceNode: 'person_1',
      targetNode: 'org_1',
      relationshipType: 'employed_by',
      properties: { strength: 0.9, since: '2019' }
    }
  ]
};

await graphEngine.loadDataAsync({
  nodes: customFormatData.entities,
  edges: customFormatData.relationships
});
```

### 8. Hierarchical Configuration Management

```typescript
// Master configuration with module inheritance
const masterConfig = new GraphConfigBuilder()
  // Global performance settings inherited by all modules
  .withPerformance({
    targets: { fps: 60, memoryLimit: 300 }
  })
  
  // Node layout inherits global performance but overrides specific settings
  .withNodeLayout({
    performance: {
      timeout: 10000, // Override: longer timeout for complex layouts
      memoryLimit: 150, // Override: smaller memory limit for layout
      monitoring: true  // Inherits from global performance.monitoring
    },
    forces: {
      charge: { strength: -200 },
      link: { distance: 80 }
    }
  })
  
  // Edge generator inherits and customizes
  .withEdgeGenerator({
    performance: {
      timeout: 5000,    // Override: shorter timeout for edge processing
      batchSize: 500     // Module-specific setting
    },
    compatibility: {
      method: 'hybrid',
      parameters: {
        geometricWeight: 0.6,
        topologicalWeight: 0.4
      }
    }
  })
  
  // Rendering inherits global performance settings
  .withRendering({
    strategy: 'canvas',
    quality: {
      antialiasing: { enabled: true },
      levelOfDetail: {
        enabled: true,
        thresholds: [1.0, 0.5, 0.2], // Zoom levels for LOD
        levels: [
          { level: 0, qualityMultiplier: 1.0, simplification: {} },
          { level: 1, qualityMultiplier: 0.7, simplification: { reduceNodeDetail: true } },
          { level: 2, qualityMultiplier: 0.4, simplification: { skipNonEssential: true } }
        ]
      }
    }
  })
  .build();

const graphEngine = new ModularGraphEngine(masterConfig);
```

## Advanced Usage Examples

### 9. Independent Layout Engine Operation

```typescript
// Use layout engine without rendering (SC-001: Export results in < 30 seconds for 1000 nodes)
const layoutOnlyConfig = new GraphConfigBuilder()
  .withNodeLayout({
    engine: 'force-directed',
    performance: {
      timeout: 30000, // 30 second limit per success criteria
      monitoring: true
    }
  })
  .build();

const graphEngine = new ModularGraphEngine(layoutOnlyConfig);

// Load data and perform layout calculation only
await graphEngine.loadDataAsync(largeDataset); // 1000 nodes
const layoutResults = await graphEngine.calculateLayoutAsync();

// Export positioning data for use in other visualization tools
const positionData = Array.from(layoutResults.entries()).map(([nodeId, layoutNode]) => ({
  id: nodeId,
  x: layoutNode.x,
  y: layoutNode.y,
  cluster: layoutNode.clusterId,
  metadata: layoutNode.layoutMetadata
}));

// Export to JSON, CSV, or other formats
exportToJSON(positionData, 'graph-positions.json');
exportToCSV(positionData, 'graph-positions.csv');
```

### 10. Multiple Similarity Measures with Conflict Resolution

```typescript
// Register multiple custom similarity functions
const organizationalSimilarity = {
  id: 'org-similarity',
  calculateSimilarity: (nodeA, nodeB, context) => {
    const deptA = nodeA.properties?.department;
    const deptB = nodeB.properties?.department;
    return deptA === deptB ? 1.0 : 0.0;
  }
};

const experienceSimilarity = {
  id: 'experience-similarity',
  calculateSimilarity: (nodeA, nodeB, context) => {
    const expA = nodeA.properties?.experience || 0;
    const expB = nodeB.properties?.experience || 0;
    const diff = Math.abs(expA - expB);
    return Math.max(0, 1.0 - diff / 10); // Similarity decreases with experience gap
  }
};

// Register both measures
registry.register(organizationalSimilarity);
registry.register(experienceSimilarity);

// Configure conflict resolution (mathematical averaging per clarifications)
const config = new GraphConfigBuilder()
  .withNodeLayout({
    similarity: {
      default: ['org-similarity', 'experience-similarity', 'semantic-similarity'],
      weights: new Map([
        ['org-similarity', 0.4],
        ['experience-similarity', 0.3],
        ['semantic-similarity', 0.3]
      ]),
      conflictResolution: 'weighted-average' // Averages conflicting scores
    }
  })
  .build();
```

### 11. Real-time Progress with Stage-Specific Details

```typescript
// Detailed progress monitoring with stage breakdown
const detailedProgressCallback = (progress) => {
  // Overall progress
  updateOverallProgress(progress.overallProgress);
  
  // Stage-specific progress with detailed breakdown per clarifications
  const stageNames = {
    'initialization': 'Loading Data',
    'node-positioning': 'Node Positioning',
    'clustering': 'Clustering',
    'edge-calculation': 'Edge Calculation',
    'edge-bundling': 'Edge Bundling',
    'rendering': 'Rendering'
  };
  
  const stageName = stageNames[progress.currentStage] || progress.currentStage;
  updateCurrentStage(stageName, progress.currentStageProgress);
  
  // Stage breakdown with percentages
  const stageBreakdown = Array.from(progress.stageBreakdown.entries()).map(([stage, percent]) => ({
    stage: stageNames[stage] || stage,
    progress: percent,
    status: percent === 100 ? 'complete' : percent > 0 ? 'active' : 'pending'
  }));
  
  updateStageBreakdownUI(stageBreakdown);
  
  // Performance monitoring
  const { memoryUsage, currentFPS, processingRate } = progress.metrics;
  updatePerformanceMetrics({
    memory: `${memoryUsage.toFixed(1)}MB`,
    fps: `${currentFPS}fps`,
    rate: `${processingRate.toFixed(0)} items/sec`
  });
  
  // Time estimation
  if (progress.estimatedTimeRemaining) {
    const eta = new Date(Date.now() + progress.estimatedTimeRemaining);
    updateETA(eta.toLocaleTimeString());
  }
};

await graphEngine.executeLayoutPipelineAsync(largeDataset, detailedProgressCallback);
```

### 12. Error Handling and Recovery

```typescript
// Configure comprehensive error handling
const errorHandlingConfig = new GraphConfigBuilder()
  .withCore({
    // Strict validation with detailed error messages (per clarifications)
    data: {
      validation: {
        validateNodeUniqueness: true,
        validateEdgeReferences: true,
        customValidators: [
          (data) => {
            if (!data.nodes || data.nodes.length === 0) {
              return { 
                isValid: false, 
                errors: [{ field: 'nodes', message: 'Dataset must contain at least one node', code: 'EMPTY_NODES' }] 
              };
            }
            return { isValid: true, errors: [], warnings: [] };
          }
        ]
      }
    }
  })
  .build();

// Handle various error types
graphEngine.onError((error) => {
  switch (error.type) {
    case 'validation':
      console.error('Data validation failed:', error.message);
      displayValidationErrors(error.details);
      break;
      
    case 'memory':
      console.error('Memory limit exceeded:', error.message);
      // Automatic degradation will handle this, but notify user
      showMemoryWarning('Switching to performance mode due to memory constraints');
      break;
      
    case 'timeout':
      console.error('Processing timeout:', error.message);
      offerCancellationOption('Processing is taking longer than expected. Cancel?');
      break;
      
    case 'rendering':
      console.error('Rendering failure:', error.message);
      // Layout continues independent of rendering per clarifications
      console.log('Layout operations continue normally');
      break;
  }
});

// Graceful degradation handling
graphEngine.onDegradation((event) => {
  console.log(`Performance degradation: ${event.from} → ${event.to}`);
  
  // Update UI to reflect degraded mode
  updateRenderingModeIndicator(event.to);
  
  if (event.to === 'simple') {
    showNotification('Switched to simple rendering for better performance');
  }
});
```

### 13. Integration with Existing Components

```typescript
// Leverage existing KnowledgeGraph components
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';
import { ModularGraphEngine } from '@knowledge-network/modular-graph-engine';

// Extend existing KnowledgeGraph with modular capabilities
class EnhancedKnowledgeGraph extends KnowledgeGraph {
  private modularEngine: ModularGraphEngine;
  
  constructor(config: GraphConfig) {
    super(config);
    
    // Initialize modular engine with enhanced capabilities
    this.modularEngine = new ModularGraphEngine({
      ...config,
      // Add modular enhancements
      pipeline: {
        sequential: true,
        progressReporting: true,
        errorRecovery: true
      }
    });
  }
  
  // Enhanced rendering with module capabilities
  async renderAsync(options?: RenderingOptions): Promise<void> {
    // Use modular pipeline for enhanced rendering
    return this.modularEngine.executeLayoutPipelineAsync(
      this.getData(),
      options?.progressCallback
    );
  }
  
  // Leverage existing edge bundling with pre-calculated compatibility
  async enableEdgeBundlingAsync(): Promise<void> {
    // EdgeBundling.ts will consume pre-calculated compatibility from EdgeGenerator
    return this.modularEngine.switchRenderingStrategyAsync('bundling');
  }
}

// Use enhanced graph with existing demo applications
const enhancedGraph = new EnhancedKnowledgeGraph(config);
await enhancedGraph.loadDataAsync(graphData);
await enhancedGraph.renderAsync({
  progressCallback: (progress) => updateDemoProgress(progress)
});
```

### 14. Testing and Validation Examples

```typescript
// Validate configuration before execution
const configValidation = graphEngine.validateConfiguration(config);
if (!configValidation.isValid) {
  console.error('Configuration validation failed:');
  configValidation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message} (${error.code})`);
  });
  return;
}

// Test pipeline stages independently
try {
  // Test node layout independently
  const layoutResult = await graphEngine.executeStageAsync(
    'node-positioning', 
    graphData,
    (progress) => console.log(`Layout progress: ${progress.percentage}%`)
  );
  
  console.log('Node layout completed:', layoutResult.success);
  console.log('Positioned nodes:', layoutResult.output.size);
  
  // Test edge generation with pre-positioned nodes
  const edgeResult = await graphEngine.executeStageAsync(
    'edge-calculation',
    { 
      nodes: layoutResult.output, 
      edges: graphData.edges 
    },
    (progress) => console.log(`Edge generation progress: ${progress.percentage}%`)
  );
  
  console.log('Edge generation completed:', edgeResult.success);
  console.log('Generated edges:', edgeResult.output.length);
  
} catch (error) {
  console.error('Pipeline stage failed:', error);
  
  // Access detailed error information
  const pipelineStatus = graphEngine.getStatus();
  console.log('Pipeline errors:', pipelineStatus.errors);
  console.log('Pipeline warnings:', pipelineStatus.warnings);
}
```

### 15. Demo Application Integration

```typescript
// Complete demo application setup (single integrated demo per requirements)
class ModularGraphDemo {
  private graphEngine: ModularGraphEngine;
  private progressIndicator: ProgressIndicator;
  private performanceMonitor: PerformanceMonitor;
  
  async initializeAsync() {
    // Single demo showcasing all modular capabilities
    const config = new GraphConfigBuilder()
      .withCore({
        container: '#main-demo-container',
        dimensions: { width: 'auto', height: 'auto', responsive: true }
      })
      .withNodeLayout({
        engine: 'force-directed',
        clustering: { enabled: true },
        similarity: { 
          default: ['euclidean', 'structural'],
          conflictResolution: 'weighted-average'
        }
      })
      .withRendering({
        strategy: 'canvas', // Start with canvas
        fallback: { enabled: true, fallbackOrder: ['canvas', 'svg'] }
      })
      .withNavigation({
        interactions: { responseTimeLimit: 100 }, // 100ms requirement
        selection: { mode: 'single', neighborHighlight: true }
      })
      .withDebug({
        enabled: true,
        visual: { 
          performanceMetrics: true,
          overlays: true 
        }
      })
      .build();
    
    this.graphEngine = new ModularGraphEngine(config);
    
    // Setup UI event handlers
    this.setupEventHandlers();
    this.setupPerformanceMonitoring();
  }
  
  private setupEventHandlers() {
    // Strategy switching controls
    document.getElementById('strategy-simple')?.addEventListener('click', async () => {
      await this.graphEngine.switchRenderingStrategyAsync('simple');
      this.updateStrategyIndicator('Simple Edges');
    });
    
    document.getElementById('strategy-bundling')?.addEventListener('click', async () => {
      await this.graphEngine.switchRenderingStrategyAsync('bundling');
      this.updateStrategyIndicator('Edge Bundling');
    });
    
    // Navigation controls
    document.getElementById('zoom-fit')?.addEventListener('click', async () => {
      await this.graphEngine.fitToContentAsync(20, true);
    });
    
    document.getElementById('reset-view')?.addEventListener('click', async () => {
      await this.graphEngine.resetNavigationAsync(true);
    });
  }
  
  private setupPerformanceMonitoring() {
    // Monitor performance metrics for 60fps target
    this.performanceMonitor = new PerformanceMonitor({
      targetFPS: 60,
      memoryThreshold: 400,
      onPerformanceIssue: (issue) => {
        this.showPerformanceAlert(issue);
      }
    });
    
    this.graphEngine.attachPerformanceMonitor(this.performanceMonitor);
  }
  
  async loadDemoDataAsync() {
    // Progressive loading demonstration
    const datasets = [
      { name: 'Small (50 nodes)', size: 50 },
      { name: 'Medium (200 nodes)', size: 200 },
      { name: 'Large (1000 nodes)', size: 1000 }
    ];
    
    for (const dataset of datasets) {
      const data = generateTestData(dataset.size);
      
      console.log(`Loading ${dataset.name}...`);
      await this.graphEngine.loadDataAsync(data, (progress) => {
        this.progressIndicator.update({
          stage: `Loading ${dataset.name}`,
          progress: progress.overallProgress,
          message: progress.message
        });
      });
      
      console.log(`Rendering ${dataset.name}...`);
      await this.graphEngine.renderAsync();
      
      // Verify performance meets requirements
      const performanceMetrics = this.graphEngine.getPerformanceMetrics();
      console.log(`Performance for ${dataset.name}:`, {
        fps: performanceMetrics.currentFPS,
        memory: `${performanceMetrics.memoryUsage}MB`,
        responseTime: `${performanceMetrics.averageResponseTime}ms`
      });
      
      // Wait for user interaction before next dataset
      await this.waitForUserInput(`${dataset.name} loaded. Try the navigation controls, then click Next.`);
    }
  }
}

// Initialize and run demo
const demo = new ModularGraphDemo();
await demo.initializeAsync();
await demo.loadDemoDataAsync();
```

## Key Integration Points Summary

### Sequential Pipeline Processing
- **NodeLayout** → produces `Map<string, LayoutNode>` → **EdgeGenerator** → produces `EdgeLayout[]` → **Rendering**
- 100% completion gates between stages ensure stable data handoff
- Progress coordination provides unified feedback across all stages

### Runtime Extensibility  
- **Similarity Functions**: `(nodeA, nodeB, context) => number` in "similarity" namespace
- **Rendering Strategies**: Pluggable through ComponentRegistry with consistent interfaces
- **Configuration Inheritance**: Hierarchical config with module-specific overrides

### Performance Requirements
- **1000+ nodes**: Warning system alerts but continues with full functionality
- **60fps interactions**: Automatic degradation when performance drops below thresholds
- **100ms response time**: Navigation interactions meet responsiveness requirement across all strategies
- **Memory constraints**: ~10MB per 100 nodes with automatic fallback to simpler rendering

This quickstart demonstrates all key modular capabilities while meeting the success criteria and integration requirements defined in the feature specification.