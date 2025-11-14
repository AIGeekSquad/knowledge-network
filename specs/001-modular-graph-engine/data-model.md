# Data Model: Modular Knowledge Graph Engine

**Feature**: 001-modular-graph-engine | **Date**: 2025-11-13
**Objective**: Define comprehensive entity model for modular graph engine implementation

## Core Entities

### GraphDataset
Represents the input data structure containing nodes, relationships, and metadata that will be processed by the system.

**Purpose**: Primary input entity for the modular graph engine, supporting flexible data formats with configurable field mappings.

**Properties**:
- `nodes: Node[]` - Array of node objects with flexible structure
- `edges: Edge[]` - Array of edge/relationship objects  
- `metadata?: GraphMetadata` - Optional metadata about the dataset
- `fieldMappings: FieldMappingConfig` - Configuration for mapping input fields to expected structure

**Validation Rules**:
- Nodes array must not be empty
- Each node must have a unique identifier field (mapped via fieldMappings)
- Each edge must reference valid node identifiers for source and target
- Field mappings must specify required fields (id, label) and may specify optional fields
- Dataset size triggers warning system when exceeding 1000 nodes

**Relationships**:
- Contains multiple `Node` entities
- Contains multiple `Edge` entities  
- References `FieldMappingConfig` for data structure flexibility
- Feeds into `LayoutConfiguration` for processing parameters

### LayoutConfiguration
Defines parameters and strategies for node positioning, clustering algorithms, and similarity measures.

**Purpose**: Configuration entity for the node layout phase of the pipeline, controlling positioning algorithms and similarity-based clustering.

**Properties**:
- `forceParameters: ForceConfig` - D3.js force simulation parameters (strength, distance, collision)
- `clusteringConfig: ClusteringConfig` - Node clustering and grouping parameters
- `similarityMeasures: string[]` - Names of registered similarity functions to apply
- `performanceSettings: PerformanceConfig` - Memory limits, degradation thresholds, warning levels
- `stabilityThreshold: number` - Threshold for determining layout completion
- `maxIterations: number` - Maximum simulation iterations before forced completion

**Validation Rules**:
- Force parameters must be within valid ranges (0-1 for strengths, positive values for distances)
- Similarity measure names must reference registered functions in ExtensibilityRegistry
- Performance settings must align with system constraints (~10MB per 100 nodes)
- Stability threshold must be between 0 and 1
- Max iterations must be positive integer

**Relationships**:
- Consumes `GraphDataset` for initial node data
- Produces `Map<string, LayoutNode>` for pipeline handoff
- References registered similarity functions from `ExtensibilityRegistry`
- Integrates with `ProgressCoordinator` for stage-specific progress reporting

### RenderingProfile
Encapsulates visual rendering strategies, performance settings, and interaction behavior configurations.

**Purpose**: Configuration entity for the rendering phase, controlling visual output strategies and performance characteristics.

**Properties**:
- `strategy: RenderingStrategy` - Selected rendering approach (simple, bundling, webgl)
- `performanceMode: PerformanceMode` - Performance vs quality tradeoffs (high-quality, balanced, performance)
- `visualSettings: VisualConfig` - Colors, strokes, node sizes, opacity levels
- `interactionConfig: InteractionConfig` - Zoom limits, pan constraints, selection behavior
- `degradationRules: DegradationConfig` - Automatic fallback rules when memory limits approached
- `canvasSettings?: CanvasConfig` - Canvas-specific rendering parameters
- `svgSettings?: SVGConfig` - SVG-specific rendering parameters

**Validation Rules**:
- Strategy must correspond to registered rendering strategy in ComponentRegistry
- Performance mode must balance quality requirements with system capabilities
- Visual settings must use valid color formats and positive numeric values
- Interaction limits must be within reasonable ranges (zoom: 0.1x to 10x)
- Degradation rules must specify valid fallback strategies

**Relationships**:
- References registered rendering strategies from `ComponentRegistry`
- Consumes layout data from `LayoutConfiguration` output
- Integrates with `NavigationState` for consistent interaction behavior
- Coordinates with `ProgressCoordinator` for rendering progress feedback

### NavigationState  
Maintains current view context including zoom level, selection state, and interaction mode.

**Purpose**: State entity tracking user interactions and view context across all rendering strategies and pipeline stages.

**Properties**:
- `zoomLevel: number` - Current zoom factor (0.1 to 10.0 range)
- `panOffset: Point2D` - Current pan offset from center position
- `selectedNodeId?: string` - ID of currently selected node (single selection only)
- `highlightedNodeIds: Set<string>` - Set of nodes highlighted via neighbor highlighting
- `interactionMode: InteractionMode` - Current interaction state (navigate, select, pan, zoom)
- `viewBounds: Rectangle` - Current visible area bounds
- `lastInteractionTimestamp: number` - Timestamp of last user interaction for responsiveness tracking

**Validation Rules**:
- Zoom level must be within configured interaction limits (default: 0.1-10.0)
- Pan offset must keep graph content within reasonable bounds
- Selected node ID must reference valid node in current dataset
- Highlighted node IDs must reference valid nodes in current dataset  
- Interaction timestamps must support 100ms response time requirement

**Relationships**:
- Maintains references to valid nodes from `GraphDataset`
- Preserved across rendering strategy changes per requirement FR-007
- Integrates with all rendering strategies for consistent behavior
- Coordinated by unified navigation contract implementation

### PipelineStatus
Tracks progress and state of layout processing stages from initial data through final positioning.

**Purpose**: Status entity providing detailed progress feedback across all pipeline stages with centralized coordination.

**Properties**:
- `currentStage: PipelineStage` - Current active stage (NodePositioning, Clustering, EdgeCalculation, EdgeBundling, Rendering)
- `stageProgress: Map<PipelineStage, StageProgress>` - Progress percentage for each stage (0-100)
- `overallProgress: number` - Calculated overall completion percentage (0-100)
- `stageTimings: Map<PipelineStage, StageTimingInfo>` - Performance timing data for each stage
- `errors: PipelineError[]` - Array of any errors encountered during processing
- `warnings: PipelineWarning[]` - Array of warnings (e.g., dataset size, performance)
- `isActive: boolean` - Whether pipeline is currently processing

**Validation Rules**:
- Progress percentages must be between 0 and 100
- Current stage must be valid pipeline stage enumeration
- Stage timings must include start time and may include end time and duration
- Overall progress calculation must aggregate individual stage progress accurately
- Error and warning arrays must contain valid, actionable information

**Relationships**:
- Coordinates with all pipeline stages (`LayoutConfiguration`, `EdgeGenerator`, `RenderingProfile`)
- Provides progress callbacks to `ProgressCoordinator`
- Integrates with UI components for user feedback
- Supports performance monitoring and bottleneck identification

## Supporting Entities

### LayoutNode (from 002-node-layout integration)
Enhanced node entity produced by NodeLayout with positioning and clustering information.

**Properties**:
- `id: string` - Unique node identifier for O(1) lookups
- `x: number` - Calculated X coordinate position  
- `y: number` - Calculated Y coordinate position
- `clusterId?: string` - Optional cluster assignment from similarity measures
- `similarityScores: Map<string, number>` - Scores from applied similarity functions
- `originalData: any` - Original node data from input dataset
- `layoutMetadata: LayoutMetadata` - Algorithm-specific metadata

**Integration Points**:
- Key type for `Map<string, LayoutNode>` handoff between pipeline stages
- Consumed by EdgeGenerator for compatibility score calculations
- Referenced by rendering strategies for visual positioning

### EdgeLayout (from 003-edge-generator integration)  
Edge entity with pre-calculated compatibility scores for bundling optimization.

**Properties**:
- `sourceId: string` - Reference to source LayoutNode ID
- `targetId: string` - Reference to target LayoutNode ID
- `compatibilityScores: Map<string, number>` - Pre-calculated compatibility with other edges
- `bundleGroup?: string` - Optional bundle assignment for edge bundling
- `originalEdge: any` - Original edge data from input dataset

**Integration Points**:
- Consumes `Map<string, LayoutNode>` for node position references  
- Provides compatibility data to EdgeBundling rendering strategy
- Eliminates duplicate similarity calculations per clarification requirement

## Configuration Supporting Entities

### FieldMappingConfig
Defines mapping between flexible input data structure and expected entity fields.

**Properties**:
- `nodeIdField: string` - Field name containing node unique identifier
- `nodeLabelField?: string` - Field name containing node display label
- `edgeSourceField: string` - Field name containing edge source node ID
- `edgeTargetField: string` - Field name containing edge target node ID  
- `customFields: Map<string, string>` - Additional field mappings for custom properties

### ExtensibilityRegistry
Registry for runtime-registered similarity and compatibility functions.

**Properties**:
- `similarityFunctions: Map<string, SimilarityFunction>` - Registered similarity functions (similarity namespace)
- `compatibilityFunctions: Map<string, CompatibilityFunction>` - Registered compatibility functions (compatibility namespace)
- `validationRules: Map<string, ValidationRule>` - Function signature validation rules

### ComponentRegistry  
Registry for pluggable rendering strategies and layout engines.

**Properties**:
- `renderingStrategies: Map<string, IRenderingStrategy>` - Registered rendering strategy implementations
- `layoutEngines: Map<string, ILayoutEngine>` - Registered layout engine implementations  

### ProgressCoordinator
Centralized progress coordination across all pipeline stages.

**Properties**:
- `stageWeights: Map<PipelineStage, number>` - Relative weight of each stage for overall progress
- `activeCallbacks: Set<ProgressCallback>` - Registered progress callback functions
- `coordinationMode: CoordinationMode` - How progress is aggregated and reported

## Entity Relationships

### Data Flow Relationships
1. **Input Processing**: `GraphDataset` → `FieldMappingConfig` → Validated Node/Edge Arrays
2. **Layout Pipeline**: Validated Data → `LayoutConfiguration` → `Map<string, LayoutNode>`  
3. **Edge Processing**: `Map<string, LayoutNode>` + Edges → `EdgeGenerator` → `EdgeLayout[]`
4. **Rendering**: `LayoutNode` + `EdgeLayout` + `RenderingProfile` → Visual Output
5. **Navigation**: `NavigationState` ↔ All Rendering Strategies (bidirectional state sync)

### Configuration Relationships  
1. **Registry Integration**: `ExtensibilityRegistry` ↔ `LayoutConfiguration` (similarity functions)
2. **Component Selection**: `ComponentRegistry` ↔ `RenderingProfile` (strategy selection)  
3. **Progress Coordination**: `ProgressCoordinator` ↔ All Pipeline Entities (status reporting)

### State Management Relationships
1. **Pipeline Orchestration**: `PipelineStatus` coordinates all processing entities
2. **User Interaction**: `NavigationState` persists across configuration changes  
3. **Performance Monitoring**: All entities report to `ProgressCoordinator` for bottleneck identification

This data model supports the modular architecture requirements while maintaining the integration points specified in the feature clarifications, particularly the Map<string, LayoutNode> handoff mechanism and centralized progress coordination system.