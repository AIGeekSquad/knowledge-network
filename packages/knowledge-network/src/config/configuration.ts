/**
 * Configuration Contracts
 * 
 * Defines hierarchical configuration management with master GraphConfig containing
 * nested module sections. Supports builder pattern for predictable initialization,
 * inheritance rules, and validation across all modular components.
 * 
 * Key Integration Points:
 * - Hierarchical configuration with inheritance from master config
 * - Builder pattern for consistent configuration construction
 * - Module-specific overrides for nodeLayout, edgeGenerator, rendering
 * - Configuration validation and type safety
 * - Integration with existing GraphConfig from types.ts
 */

// Master Configuration (Enhanced from existing GraphConfig)
export interface GraphConfig {
  /** Core graph configuration */
  core: CoreGraphConfig;
  
  /** Node layout module configuration */
  nodeLayout: NodeLayoutConfig;
  
  /** Edge generator module configuration */
  edgeGenerator: EdgeGeneratorConfig;
  
  /** Rendering module configuration */
  rendering: RenderingModuleConfig;
  
  /** Navigation and interaction configuration */
  navigation: NavigationConfig;
  
  /** Performance and optimization configuration */
  performance: PerformanceConfig;
  
  /** Extensibility and plugin configuration */
  extensibility: ExtensibilityConfig;
  
  /** Debug and development configuration */
  debug: DebugConfig;
}

// Core Graph Configuration
export interface CoreGraphConfig {
  /** Graph identifier */
  id?: string;
  
  /** Graph title or description */
  title?: string;
  
  /** Target container selector or element */
  container: string | HTMLElement;
  
  /** Graph dimensions */
  dimensions: GraphDimensions;
  
  /** Data input configuration */
  data: DataInputConfig;
  
  /** Global styling defaults */
  styling: GlobalStylingConfig;
}

export interface GraphDimensions {
  /** Graph width (pixels or 'auto') */
  width: number | 'auto';
  
  /** Graph height (pixels or 'auto') */
  height: number | 'auto';
  
  /** Maintain aspect ratio */
  maintainAspectRatio: boolean;
  
  /** Responsive behavior */
  responsive: boolean;
  
  /** Minimum dimensions */
  minDimensions?: { width: number; height: number };
}

// Data Input Configuration (Enhanced flexible format support)
export interface DataInputConfig {
  /** Data source type */
  source: 'inline' | 'url' | 'file' | 'stream';
  
  /** Field mapping configuration */
  fieldMapping: FieldMappingConfig;
  
  /** Data validation rules */
  validation: DataValidationConfig;
  
  /** Data preprocessing options */
  preprocessing: DataPreprocessingConfig;
}

export interface FieldMappingConfig {
  /** Node ID field mapping */
  node: {
    id: string;
    label?: string;
    type?: string;
    properties?: string[];
  };
  
  /** Edge field mapping */
  edge: {
    source: string;
    target: string;
    label?: string;
    type?: string;
    properties?: string[];
  };
  
  /** Custom field mappings */
  custom: Map<string, string>;
}

export interface DataValidationConfig {
  /** Validate node uniqueness */
  validateNodeUniqueness: boolean;
  
  /** Validate edge references */
  validateEdgeReferences: boolean;
  
  /** Required fields validation */
  requiredFields: string[];
  
  /** Custom validation functions */
  customValidators: ValidationFunction[];
}

export type ValidationFunction = (data: any) => ValidationResult;

export interface DataPreprocessingConfig {
  /** Remove duplicate nodes */
  deduplicateNodes: boolean;
  
  /** Remove self-loops */
  removeSelfLoops: boolean;
  
  /** Data normalization */
  normalization: NormalizationConfig;
  
  /** Data enrichment */
  enrichment: EnrichmentConfig;
}

export interface NormalizationConfig {
  /** Normalize node IDs */
  normalizeIds: boolean;
  
  /** Case sensitivity */
  caseSensitive: boolean;
  
  /** Trim whitespace */
  trimWhitespace: boolean;
}

export interface EnrichmentConfig {
  /** Auto-generate missing labels */
  autoGenerateLabels: boolean;
  
  /** Infer node types */
  inferNodeTypes: boolean;
  
  /** Calculate derived properties */
  calculateDerivedProperties: boolean;
}

// Global Styling Configuration
export interface GlobalStylingConfig {
  /** Color theme */
  theme: ColorTheme;
  
  /** Typography settings */
  typography: TypographyConfig;
  
  /** Animation preferences */
  animations: AnimationPreferences;
  
  /** Accessibility settings */
  accessibility: AccessibilityConfig;
}

export interface ColorTheme {
  /** Theme name */
  name: string;
  
  /** Primary color palette */
  primary: string[];
  
  /** Secondary color palette */
  secondary: string[];
  
  /** Background colors */
  background: {
    primary: string;
    secondary: string;
    contrast: string;
  };
  
  /** Text colors */
  text: {
    primary: string;
    secondary: string;
    disabled: string;
  };
  
  /** Status colors */
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface TypographyConfig {
  /** Font families */
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  
  /** Font sizes */
  fontSize: {
    small: number;
    medium: number;
    large: number;
    extraLarge: number;
  };
  
  /** Font weights */
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
}

export interface AnimationPreferences {
  /** Enable animations globally */
  enabled: boolean;
  
  /** Animation duration preferences */
  duration: {
    fast: number;
    normal: number;
    slow: number;
  };
  
  /** Easing preferences */
  easing: {
    standard: string;
    accelerate: string;
    decelerate: string;
  };
  
  /** Reduce motion for accessibility */
  reduceMotion: boolean;
}

export interface AccessibilityConfig {
  /** Enable high contrast mode */
  highContrast: boolean;
  
  /** Enable screen reader support */
  screenReader: boolean;
  
  /** Enable keyboard navigation */
  keyboardNavigation: boolean;
  
  /** Enable focus indicators */
  focusIndicators: boolean;
  
  /** ARIA label configuration */
  ariaLabels: AriaLabelConfig;
}

export interface AriaLabelConfig {
  /** Node ARIA labels */
  node: string;
  
  /** Edge ARIA labels */
  edge: string;
  
  /** Graph ARIA labels */
  graph: string;
  
  /** Control ARIA labels */
  controls: Map<string, string>;
}

// Node Layout Module Configuration (Enhanced from layout-engine.ts)
export interface NodeLayoutConfig {
  /** Layout engine selection */
  engine: 'force-directed' | 'hierarchical' | 'circular' | 'grid';
  
  /** Force simulation parameters */
  forces: ForceSimulationConfig;
  
  /** Node positioning preferences */
  positioning: NodePositioningConfig;
  
  /** Clustering configuration */
  clustering: ClusteringModuleConfig;
  
  /** Similarity measures configuration */
  similarity: SimilarityMeasuresConfig;
  
  /** Performance settings for layout */
  performance: LayoutPerformanceConfig;
}

export interface ForceSimulationConfig {
  /** Center force configuration */
  center: {
    enabled: boolean;
    strength: number;
    x?: number;
    y?: number;
  };
  
  /** Charge (repulsion) force configuration */
  charge: {
    enabled: boolean;
    strength: number;
    distanceMin: number;
    distanceMax: number;
  };
  
  /** Link force configuration */
  link: {
    enabled: boolean;
    strength: number;
    distance: number;
    iterations: number;
  };
  
  /** Collision force configuration */
  collision: {
    enabled: boolean;
    radius: number;
    strength: number;
    iterations: number;
  };
  
  /** Custom forces */
  custom: Map<string, CustomForceConfig>;
}

export interface CustomForceConfig {
  /** Force type identifier */
  type: string;
  
  /** Force parameters */
  parameters: any;
  
  /** Force strength */
  strength: number;
  
  /** Whether force is enabled */
  enabled: boolean;
}

export interface NodePositioningConfig {
  /** Initial positioning strategy */
  initialPositioning: 'random' | 'circular' | 'grid' | 'hierarchical';
  
  /** Position constraints */
  constraints: PositionConstraints;
  
  /** Stabilization criteria */
  stabilization: StabilizationConfig;
}

export interface PositionConstraints {
  /** Boundary constraints */
  boundaries?: {
    x: { min: number; max: number };
    y: { min: number; max: number };
  };
  
  /** Fixed positions for specific nodes */
  fixedPositions: Map<string, { x: number; y: number }>;
  
  /** Position restrictions */
  restrictions: Map<string, PositionRestriction>;
}

export interface PositionRestriction {
  /** Restriction type */
  type: 'fixed' | 'bounded' | 'relative';
  
  /** Restriction parameters */
  parameters: any;
}

export interface StabilizationConfig {
  /** Stabilization threshold */
  threshold: number;
  
  /** Maximum iterations */
  maxIterations: number;
  
  /** Minimum velocity for stability */
  minVelocity: number;
  
  /** Stabilization timeout (ms) */
  timeout: number;
}

// Clustering Module Configuration
export interface ClusteringModuleConfig {
  /** Enable clustering */
  enabled: boolean;
  
  /** Clustering algorithm */
  algorithm: 'k-means' | 'hierarchical' | 'density-based' | 'similarity-based';
  
  /** Algorithm parameters */
  parameters: ClusteringAlgorithmParams;
  
  /** Cluster visualization */
  visualization: ClusterVisualizationConfig;
}

export interface ClusteringAlgorithmParams {
  /** Number of clusters (for k-means) */
  k?: number;
  
  /** Distance threshold (for hierarchical) */
  distanceThreshold?: number;
  
  /** Density parameters (for DBSCAN) */
  density?: {
    eps: number;
    minPoints: number;
  };
  
  /** Similarity threshold (for similarity-based) */
  similarityThreshold?: number;
}

export interface ClusterVisualizationConfig {
  /** Show cluster boundaries */
  showBoundaries: boolean;
  
  /** Cluster color scheme */
  colorScheme: 'automatic' | 'manual';
  
  /** Manual cluster colors */
  clusterColors: Map<string, string>;
  
  /** Cluster label display */
  labels: ClusterLabelConfig;
}

export interface ClusterLabelConfig {
  /** Show cluster labels */
  show: boolean;
  
  /** Label position */
  position: 'center' | 'top' | 'bottom';
  
  /** Label styling */
  styling: LabelStylingConfig;
}

export interface LabelStylingConfig {
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  padding: number;
}

// Similarity Measures Configuration
export interface SimilarityMeasuresConfig {
  /** Default similarity measures */
  default: string[];
  
  /** Similarity measure weights */
  weights: Map<string, number>;
  
  /** Conflict resolution strategy */
  conflictResolution: 'average' | 'weighted-average' | 'max' | 'min';
  
  /** Custom similarity measures */
  custom: Map<string, CustomSimilarityConfig>;
}

export interface CustomSimilarityConfig {
  /** Similarity function */
  function: string; // Reference to registered function
  
  /** Function parameters */
  parameters: any;
  
  /** Function weight */
  weight: number;
  
  /** Whether function is enabled */
  enabled: boolean;
}

// Edge Generator Module Configuration
export interface EdgeGeneratorConfig {
  /** Edge generation strategy */
  strategy: 'simple' | 'bundled' | 'hierarchical';
  
  /** Compatibility calculation settings */
  compatibility: CompatibilityConfig;
  
  /** Bundling configuration */
  bundling: EdgeBundlingConfig;
  
  /** Edge styling preferences */
  styling: EdgeStylingConfig;
  
  /** Performance settings for edge generation */
  performance: EdgeGenerationPerformanceConfig;
}

export interface CompatibilityConfig {
  /** Compatibility calculation method */
  method: 'geometric' | 'topological' | 'hybrid';
  
  /** Compatibility parameters */
  parameters: CompatibilityParameters;
  
  /** Compatibility thresholds */
  thresholds: CompatibilityThresholds;
}

export interface CompatibilityParameters {
  /** Geometric compatibility weight */
  geometricWeight: number;
  
  /** Topological compatibility weight */
  topologicalWeight: number;
  
  /** Angular compatibility consideration */
  angularWeight: number;
  
  /** Length compatibility consideration */
  lengthWeight: number;
}

export interface CompatibilityThresholds {
  /** Minimum compatibility for bundling */
  bundlingThreshold: number;
  
  /** Compatibility decay factor */
  decayFactor: number;
  
  /** Maximum compatibility distance */
  maxDistance: number;
}

// Edge Bundling Configuration
export interface EdgeBundlingConfig {
  /** Enable edge bundling */
  enabled: boolean;
  
  /** Bundling algorithm */
  algorithm: 'force-directed' | 'geometric' | 'hierarchical';
  
  /** Bundling parameters */
  parameters: EdgeBundlingParameters;
  
  /** Bundle visualization */
  visualization: BundleVisualizationConfig;
}

export interface EdgeBundlingParameters {
  /** Bundle strength */
  bundleStrength: number;
  
  /** Subdivision iterations */
  subdivisionIterations: number;
  
  /** Smoothing iterations */
  smoothingIterations: number;
  
  /** Step size for bundling forces */
  stepSize: number;
}

export interface BundleVisualizationConfig {
  /** Bundle curve style */
  curveStyle: 'bezier' | 'spline' | 'arc';
  
  /** Bundle opacity */
  opacity: number;
  
  /** Bundle width variation */
  widthVariation: boolean;
  
  /** Bundle color strategy */
  colorStrategy: 'uniform' | 'gradient' | 'by-type';
}

// Edge Styling Configuration
export interface EdgeStylingConfig {
  /** Default edge properties */
  default: DefaultEdgeProperties;
  
  /** Edge type styling */
  types: Map<string, EdgeTypeProperties>;
  
  /** Interactive edge properties */
  interactive: InteractiveEdgeProperties;
}

export interface DefaultEdgeProperties {
  strokeWidth: number;
  strokeColor: string;
  opacity: number;
  dashArray?: string;
  arrowHead?: ArrowHeadConfig;
}

export interface EdgeTypeProperties extends DefaultEdgeProperties {
  /** Edge type identifier */
  type: string;
  
  /** Type-specific properties */
  properties: any;
}

export interface InteractiveEdgeProperties {
  /** Hover properties */
  hover: Partial<DefaultEdgeProperties>;
  
  /** Selection properties */
  selected: Partial<DefaultEdgeProperties>;
  
  /** Highlighted properties */
  highlighted: Partial<DefaultEdgeProperties>;
}

export interface ArrowHeadConfig {
  /** Show arrow head */
  show: boolean;
  
  /** Arrow head size */
  size: number;
  
  /** Arrow head style */
  style: 'triangle' | 'circle' | 'diamond';
  
  /** Arrow head color */
  color?: string;
}

// Rendering Module Configuration (Enhanced from rendering-strategy.ts)
export interface RenderingModuleConfig {
  /** Rendering strategy */
  strategy: 'canvas' | 'svg' | 'webgl';
  
  /** Strategy-specific options */
  options: RenderingStrategyOptions;
  
  /** Visual quality settings */
  quality: RenderingQualityConfig;
  
  /** Performance optimization */
  optimization: RenderingOptimizationConfig;
  
  /** Fallback configuration */
  fallback: RenderingFallbackConfig;
}

export interface RenderingStrategyOptions {
  /** Canvas-specific options */
  canvas?: CanvasRenderingOptions;
  
  /** SVG-specific options */
  svg?: SVGRenderingOptions;
  
  /** WebGL-specific options */
  webgl?: WebGLRenderingOptions;
}

export interface CanvasRenderingOptions {
  /** Enable high DPI support */
  highDPI: boolean;
  
  /** Context type */
  contextType: '2d' | 'webgl';
  
  /** Image smoothing */
  imageSmoothingEnabled: boolean;
  
  /** Composite operation */
  globalCompositeOperation: string;
}

export interface SVGRenderingOptions {
  /** Use CSS transforms for performance */
  useCSSTransforms: boolean;
  
  /** Enable text selection */
  enableTextSelection: boolean;
  
  /** SVG namespace */
  namespace: string;
  
  /** Optimization techniques */
  optimizations: SVGOptimizations;
}

export interface SVGOptimizations {
  /** Use CSS classes for styling */
  useCSSClasses: boolean;
  
  /** Minimize DOM updates */
  minimizeDOMUpdates: boolean;
  
  /** Use symbol definitions */
  useSymbolDefinitions: boolean;
}

export interface WebGLRenderingOptions {
  /** WebGL context attributes */
  contextAttributes: WebGLContextAttributes;
  
  /** Enable instanced rendering */
  instancedRendering: boolean;
  
  /** Shader quality level */
  shaderQuality: 'low' | 'medium' | 'high';
  
  /** Buffer management */
  bufferManagement: WebGLBufferConfig;
}

export interface WebGLBufferConfig {
  /** Use vertex buffer objects */
  useVBO: boolean;
  
  /** Buffer update strategy */
  updateStrategy: 'static' | 'dynamic' | 'stream';
  
  /** Buffer size limits */
  sizeLimits: {
    vertices: number;
    indices: number;
  };
}

// Rendering Quality Configuration
export interface RenderingQualityConfig {
  /** Anti-aliasing settings */
  antialiasing: AntialiasingConfig;
  
  /** Level of detail settings */
  levelOfDetail: LevelOfDetailConfig;
  
  /** Texture quality */
  textureQuality: TextureQualityConfig;
}

export interface AntialiasingConfig {
  /** Enable anti-aliasing */
  enabled: boolean;
  
  /** Anti-aliasing method */
  method: 'msaa' | 'fxaa' | 'smaa';
  
  /** Sample count for MSAA */
  sampleCount: number;
}

export interface LevelOfDetailConfig {
  /** Enable level of detail */
  enabled: boolean;
  
  /** Distance thresholds for LOD levels */
  thresholds: number[];
  
  /** Quality levels */
  levels: LODLevel[];
}

export interface LODLevel {
  /** Level identifier */
  level: number;
  
  /** Quality multiplier */
  qualityMultiplier: number;
  
  /** Simplification rules */
  simplification: SimplificationRules;
}

export interface SimplificationRules {
  /** Reduce node detail */
  reduceNodeDetail: boolean;
  
  /** Reduce edge detail */
  reduceEdgeDetail: boolean;
  
  /** Skip non-essential elements */
  skipNonEssential: boolean;
}

export interface TextureQualityConfig {
  /** Texture resolution */
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  
  /** Texture filtering */
  filtering: 'nearest' | 'linear' | 'trilinear';
  
  /** Mipmap generation */
  generateMipmaps: boolean;
}

// Navigation Configuration (Enhanced from navigation-contract.ts)
export interface NavigationConfig {
  /** Interaction settings */
  interactions: InteractionSettings;
  
  /** Zoom configuration */
  zoom: ZoomConfiguration;
  
  /** Pan configuration */
  pan: PanConfiguration;
  
  /** Selection configuration */
  selection: SelectionConfiguration;
  
  /** Keyboard shortcuts */
  keyboard: KeyboardConfiguration;
}

export interface InteractionSettings {
  /** Enable mouse interactions */
  mouse: boolean;
  
  /** Enable touch interactions */
  touch: boolean;
  
  /** Enable keyboard interactions */
  keyboard: boolean;
  
  /** Interaction response time limit (ms) */
  responseTimeLimit: number;
  
  /** Debounce time between interactions (ms) */
  debounceTime: number;
}

export interface ZoomConfiguration {
  /** Zoom limits */
  limits: { min: number; max: number };
  
  /** Zoom step size */
  step: number;
  
  /** Enable smooth zooming */
  smooth: boolean;
  
  /** Zoom animation duration (ms) */
  animationDuration: number;
  
  /** Zoom to fit on initialization */
  fitOnInit: boolean;
}

export interface PanConfiguration {
  /** Enable panning */
  enabled: boolean;
  
  /** Pan boundaries */
  boundaries?: { x: number; y: number; width: number; height: number };
  
  /** Enable pan inertia */
  inertia: boolean;
  
  /** Inertia friction coefficient */
  friction: number;
}

export interface SelectionConfiguration {
  /** Selection mode (single only per clarifications) */
  mode: 'single';
  
  /** Auto-deselect on background click */
  autoDeselect: boolean;
  
  /** Enable neighbor highlighting */
  neighborHighlight: boolean;
  
  /** Selection animation duration (ms) */
  animationDuration: number;
}

export interface KeyboardConfiguration {
  /** Enable keyboard shortcuts */
  enabled: boolean;
  
  /** Custom key mappings */
  keyMappings: Map<string, KeyboardAction>;
  
  /** Modifier key preferences */
  modifiers: KeyboardModifiers;
}

export interface KeyboardAction {
  /** Action identifier */
  action: string;
  
  /** Key combination */
  keys: string[];
  
  /** Action description */
  description: string;
}

export interface KeyboardModifiers {
  /** Zoom modifier */
  zoom: 'ctrl' | 'alt' | 'meta' | 'shift';
  
  /** Pan modifier */
  pan: 'ctrl' | 'alt' | 'meta' | 'shift';
  
  /** Selection modifier */
  selection: 'ctrl' | 'alt' | 'meta' | 'shift';
}

// Performance Configuration
export interface PerformanceConfig {
  /** Target performance metrics */
  targets: PerformanceTargets;
  
  /** Optimization strategies */
  optimization: OptimizationStrategies;
  
  /** Memory management */
  memory: MemoryManagementConfig;
  
  /** Monitoring and profiling */
  monitoring: PerformanceMonitoringConfig;
}

export interface PerformanceTargets {
  /** Target FPS */
  fps: number;
  
  /** Maximum response time (ms) */
  responseTime: number;
  
  /** Memory usage limit (MB) */
  memoryLimit: number;
  
  /** Maximum initialization time (ms) */
  initializationTime: number;
}

export interface OptimizationStrategies {
  /** Enable automatic degradation */
  autoDegradation: boolean;
  
  /** Frustum culling */
  frustumCulling: boolean;
  
  /** Occlusion culling */
  occlusionCulling: boolean;
  
  /** Object pooling */
  objectPooling: boolean;
  
  /** Batch rendering */
  batchRendering: boolean;
}

export interface MemoryManagementConfig {
  /** Garbage collection hints */
  gcHints: boolean;
  
  /** Object pooling */
  pooling: PoolingConfig;
  
  /** Cache management */
  caching: CacheManagementConfig;
}

export interface PoolingConfig {
  /** Enable object pooling */
  enabled: boolean;
  
  /** Pool sizes for different object types */
  poolSizes: Map<string, number>;
  
  /** Pool cleanup interval (ms) */
  cleanupInterval: number;
}

export interface CacheManagementConfig {
  /** Cache size limits */
  sizeLimits: Map<string, number>;
  
  /** Cache eviction strategy */
  evictionStrategy: 'lru' | 'lfu' | 'fifo';
  
  /** Cache cleanup interval (ms) */
  cleanupInterval: number;
}

// Extensibility Configuration
export interface ExtensibilityConfig {
  /** Plugin system configuration */
  plugins: PluginSystemConfig;
  
  /** Custom function registration */
  functions: FunctionRegistrationConfig;
  
  /** Extension points */
  extensionPoints: Map<string, ExtensionPointConfig>;
}

export interface PluginSystemConfig {
  /** Enable plugin system */
  enabled: boolean;
  
  /** Plugin directories */
  directories: string[];
  
  /** Plugin loading strategy */
  loadingStrategy: 'lazy' | 'eager';
  
  /** Plugin security settings */
  security: PluginSecurityConfig;
}

export interface PluginSecurityConfig {
  /** Enable plugin sandboxing */
  sandboxing: boolean;
  
  /** Allowed plugin APIs */
  allowedAPIs: string[];
  
  /** Plugin validation */
  validation: boolean;
}

export interface FunctionRegistrationConfig {
  /** Enable custom function registration */
  enabled: boolean;
  
  /** Function validation */
  validation: boolean;
  
  /** Namespace separation */
  namespaces: string[];
}

export interface ExtensionPointConfig {
  /** Extension point type */
  type: string;
  
  /** Extension interface */
  interface: string;
  
  /** Loading strategy */
  loadingStrategy: 'lazy' | 'eager';
}

// Debug Configuration
export interface DebugConfig {
  /** Enable debug mode */
  enabled: boolean;
  
  /** Debug levels */
  levels: DebugLevels;
  
  /** Logging configuration */
  logging: LoggingConfig;
  
  /** Visual debugging */
  visual: VisualDebuggingConfig;
  
  /** Performance profiling */
  profiling: ProfilingConfig;
}

export interface DebugLevels {
  /** General debug level */
  general: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /** Layout debug level */
  layout: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /** Rendering debug level */
  rendering: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  
  /** Performance debug level */
  performance: 'off' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
}

export interface LoggingConfig {
  /** Log to console */
  console: boolean;
  
  /** Log to file */
  file: boolean;
  
  /** Log file path */
  filePath?: string;
  
  /** Log formatting */
  format: 'json' | 'text' | 'structured';
}

export interface VisualDebuggingConfig {
  /** Show debug overlays */
  overlays: boolean;
  
  /** Show performance metrics */
  performanceMetrics: boolean;
  
  /** Show bounding boxes */
  boundingBoxes: boolean;
  
  /** Show force vectors */
  forceVectors: boolean;
}

export interface ProfilingConfig {
  /** Enable performance profiling */
  enabled: boolean;
  
  /** Profiling sampling rate */
  samplingRate: number;
  
  /** Profiling output format */
  outputFormat: 'json' | 'csv' | 'chrome-devtools';
}

// Configuration Builder Pattern
export interface IGraphConfigBuilder {
  /** Set core configuration */
  withCore(config: Partial<CoreGraphConfig>): this;
  
  /** Set node layout configuration */
  withNodeLayout(config: Partial<NodeLayoutConfig>): this;
  
  /** Set edge generator configuration */
  withEdgeGenerator(config: Partial<EdgeGeneratorConfig>): this;
  
  /** Set rendering configuration */
  withRendering(config: Partial<RenderingModuleConfig>): this;
  
  /** Set navigation configuration */
  withNavigation(config: Partial<NavigationConfig>): this;
  
  /** Set performance configuration */
  withPerformance(config: Partial<PerformanceConfig>): this;
  
  /** Set extensibility configuration */
  withExtensibility(config: Partial<ExtensibilityConfig>): this;
  
  /** Set debug configuration */
  withDebug(config: Partial<DebugConfig>): this;
  
  /** Build final configuration with validation */
  build(): GraphConfig;
  
  /** Build configuration with custom validation */
  buildWithValidation(validator: (config: GraphConfig) => ValidationResult): GraphConfig;
}

// Configuration Validation
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

// Layout Performance Configuration (reused from pipeline-coordinator.ts)
export interface LayoutPerformanceConfig {
  timeout: number;
  memoryLimit: number;
  monitoring: boolean;
}

// Edge Generation Performance Configuration
export interface EdgeGenerationPerformanceConfig {
  timeout: number;
  memoryLimit: number;
  monitoring: boolean;
  batchSize: number;
}

// Rendering Optimization Configuration
export interface RenderingOptimizationConfig {
  /** Enable automatic optimization */
  enabled: boolean;
  
  /** Optimization strategies */
  strategies: string[];
  
  /** Performance thresholds for optimization */
  thresholds: OptimizationThresholds;
}

export interface OptimizationThresholds {
  /** FPS threshold for degradation */
  fpsThreshold: number;
  
  /** Memory threshold for optimization */
  memoryThreshold: number;
  
  /** Rendering time threshold */
  renderTimeThreshold: number;
}

// Rendering Fallback Configuration
export interface RenderingFallbackConfig {
  /** Enable automatic fallback */
  enabled: boolean;
  
  /** Fallback strategy hierarchy */
  fallbackOrder: string[];
  
  /** Fallback triggers */
  triggers: FallbackTriggers;
}

export interface FallbackTriggers {
  /** Performance-based triggers */
  performance: PerformanceThresholds;
  
  /** Feature support triggers */
  featureSupport: string[];
  
  /** Error-based triggers */
  errors: string[];
}

export interface PerformanceThresholds {
  minFPS: number;
  maxMemoryUsage: number;
  maxRenderTime: number;
}

// Performance Monitoring Configuration (reused and enhanced)
export interface PerformanceMonitoringConfig {
  enabled: boolean;
  samplingInterval: number;
  trackMemory: boolean;
  trackCPU: boolean;
  alerts: PerformanceAlerts;
}

export interface PerformanceAlerts {
  memoryWarningThreshold: number;
  cpuWarningThreshold: number;
  timeWarningThreshold: number;
}