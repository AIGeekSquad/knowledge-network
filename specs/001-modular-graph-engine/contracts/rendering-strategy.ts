/**
 * Rendering Strategy Contracts
 * 
 * Defines interfaces for pluggable rendering strategies that can be switched dynamically
 * without changing underlying layout logic. Supports Canvas, SVG, and WebGL rendering
 * with consistent interaction patterns and performance characteristics.
 * 
 * Key Integration Points:
 * - Consumes Map<string, LayoutNode> and EdgeLayout[] from pipeline
 * - Async method naming convention (renderAsync, cleanupAsync)
 * - Unified navigation contract across all strategies
 * - Automatic degradation support when memory limits approached
 */

import { LayoutNode } from './layout-engine';

// Core Rendering Strategy Interface
export interface IRenderingStrategy {
  /**
   * Render the complete graph using this strategy
   * @param context Rendering context with nodes, edges, and configuration
   * @param progress Optional progress callback for rendering feedback
   */
  renderAsync(context: RenderingContext, progress?: RenderingProgressCallback): Promise<void>;
  
  /**
   * Clean up rendering resources and stop active operations
   */
  cleanupAsync(): Promise<void>;
  
  /**
   * Handle user interaction events (zoom, pan, select)
   * @param event Interaction event from unified navigation contract
   * @returns Whether the event was handled
   */
  handleInteraction(event: InteractionEvent): boolean;
  
  /**
   * Update visual properties without full re-render
   * @param updates Partial updates to apply
   */
  updateVisualsAsync(updates: VisualUpdates): Promise<void>;
  
  /**
   * Get current strategy capabilities and constraints
   */
  getCapabilities(): RenderingCapabilities;
  
  /**
   * Validate configuration before rendering
   * @param config Configuration to validate
   */
  validateConfiguration(config: RenderingConfig): ValidationResult;
}

// Rendering Context
export interface RenderingContext {
  /** Positioned nodes from layout engine with Map<string, LayoutNode> structure */
  nodes: Map<string, LayoutNode>;
  
  /** Edge data with pre-calculated compatibility scores */
  edges: EdgeLayout[];
  
  /** Visual configuration settings */
  config: RenderingConfig;
  
  /** Target container for rendering */
  container: HTMLElement;
  
  /** Current viewport state */
  viewport: ViewportState;
  
  /** Performance constraints */
  constraints: PerformanceConstraints;
}

// Edge Layout (from 003-edge-generator integration)
export interface EdgeLayout {
  /** Source node ID for Map lookup */
  sourceId: string;
  
  /** Target node ID for Map lookup */
  targetId: string;
  
  /** Pre-calculated compatibility scores with other edges */
  compatibilityScores: Map<string, number>;
  
  /** Optional bundle group assignment for edge bundling */
  bundleGroup?: string;
  
  /** Original edge data from GraphDataset */
  originalEdge: any;
  
  /** Visual properties specific to this edge */
  visualProperties?: EdgeVisualProperties;
}

// Rendering Configuration
export interface RenderingConfig {
  /** Selected rendering strategy name */
  strategy: 'simple' | 'bundling' | 'webgl';
  
  /** Performance vs quality balance */
  performanceMode: 'high-quality' | 'balanced' | 'performance';
  
  /** Visual styling configuration */
  visual: VisualConfig;
  
  /** Interaction behavior settings */
  interaction: InteractionConfig;
  
  /** Automatic degradation rules */
  degradation: DegradationConfig;
  
  /** Strategy-specific settings */
  strategyOptions?: StrategyOptions;
}

// Visual Configuration
export interface VisualConfig {
  /** Node visual properties */
  nodes: NodeVisualConfig;
  
  /** Edge visual properties */
  edges: EdgeVisualConfig;
  
  /** Color schemes and palettes */
  colors: ColorConfig;
  
  /** Animation and transition settings */
  animations: AnimationConfig;
}

export interface NodeVisualConfig {
  /** Default node radius */
  defaultRadius: number;
  
  /** Node radius range for scaling */
  radiusRange: [number, number];
  
  /** Default fill color */
  defaultFillColor: string;
  
  /** Default stroke color */
  defaultStrokeColor: string;
  
  /** Stroke width */
  strokeWidth: number;
  
  /** Opacity for normal state */
  opacity: number;
  
  /** Opacity for selected state */
  selectedOpacity: number;
  
  /** Opacity for highlighted state (neighbor highlighting) */
  highlightedOpacity: number;
}

export interface EdgeVisualConfig {
  /** Default stroke color */
  defaultStrokeColor: string;
  
  /** Default stroke width */
  defaultStrokeWidth: number;
  
  /** Opacity for normal state */
  opacity: number;
  
  /** Opacity for selected edges */
  selectedOpacity: number;
  
  /** Bundling curvature for edge bundling strategy */
  bundlingCurvature: number;
  
  /** Arrow head size for directed edges */
  arrowHeadSize: number;
}

export interface ColorConfig {
  /** Primary color palette */
  primary: string[];
  
  /** Accent colors for highlighting */
  accent: string[];
  
  /** Background color */
  background: string;
  
  /** Selection color */
  selection: string;
}

export interface AnimationConfig {
  /** Enable smooth transitions */
  enabled: boolean;
  
  /** Transition duration in milliseconds */
  duration: number;
  
  /** Easing function */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

// Interaction Configuration
export interface InteractionConfig {
  /** Zoom limits */
  zoom: ZoomConfig;
  
  /** Pan constraints */
  pan: PanConfig;
  
  /** Selection behavior */
  selection: SelectionConfig;
  
  /** Hover behavior */
  hover: HoverConfig;
}

export interface ZoomConfig {
  /** Minimum zoom level */
  min: number;
  
  /** Maximum zoom level */
  max: number;
  
  /** Zoom step size */
  step: number;
  
  /** Enable zoom to fit */
  enableFit: boolean;
}

export interface PanConfig {
  /** Enable panning */
  enabled: boolean;
  
  /** Pan boundaries (optional) */
  boundaries?: Rectangle;
  
  /** Inertia for smooth panning */
  inertia: boolean;
}

export interface SelectionConfig {
  /** Selection mode (single selection only per clarifications) */
  mode: 'single';
  
  /** Enable neighbor highlighting */
  enableNeighborHighlight: boolean;
  
  /** Selection visual feedback */
  feedback: 'outline' | 'glow' | 'scale';
}

export interface HoverConfig {
  /** Enable hover effects */
  enabled: boolean;
  
  /** Hover delay in milliseconds */
  delay: number;
  
  /** Show tooltips on hover */
  showTooltips: boolean;
}

// Degradation Configuration
export interface DegradationConfig {
  /** Enable automatic degradation */
  enabled: boolean;
  
  /** Memory threshold for degradation (MB) */
  memoryThreshold: number;
  
  /** Performance threshold (FPS) */
  performanceThreshold: number;
  
  /** Degradation strategy */
  strategy: 'reduce-quality' | 'simple-fallback' | 'disable-animations';
}

// Strategy-Specific Options
export interface StrategyOptions {
  /** Canvas-specific options */
  canvas?: CanvasOptions;
  
  /** SVG-specific options */
  svg?: SVGOptions;
  
  /** WebGL-specific options */
  webgl?: WebGLOptions;
}

export interface CanvasOptions {
  /** Enable high DPI support */
  highDPI: boolean;
  
  /** Context type */
  contextType: '2d' | 'webgl';
  
  /** Image smoothing */
  imageSmoothingEnabled: boolean;
}

export interface SVGOptions {
  /** Use CSS transforms */
  useCSSTransforms: boolean;
  
  /** Enable text selection */
  enableTextSelection: boolean;
}

export interface WebGLOptions {
  /** WebGL context attributes */
  contextAttributes: WebGLContextAttributes;
  
  /** Enable instanced rendering */
  useInstancedRendering: boolean;
  
  /** Shader quality level */
  shaderQuality: 'low' | 'medium' | 'high';
}

// Viewport State (from NavigationState integration)
export interface ViewportState {
  /** Current zoom level */
  zoomLevel: number;
  
  /** Pan offset from center */
  panOffset: Point2D;
  
  /** Currently selected node ID */
  selectedNodeId?: string;
  
  /** Set of highlighted node IDs */
  highlightedNodeIds: Set<string>;
  
  /** Current interaction mode */
  interactionMode: InteractionMode;
  
  /** Visible area bounds */
  viewBounds: Rectangle;
}

export type InteractionMode = 'navigate' | 'select' | 'pan' | 'zoom';

// Performance Constraints
export interface PerformanceConstraints {
  /** Maximum memory usage in MB */
  maxMemoryMB: number;
  
  /** Target FPS for smooth interactions */
  targetFPS: number;
  
  /** Maximum rendering time per frame (ms) */
  maxFrameTime: number;
  
  /** Enable performance monitoring */
  enableMonitoring: boolean;
}

// Rendering Capabilities
export interface RenderingCapabilities {
  /** Maximum recommended node count */
  maxNodes: number;
  
  /** Maximum recommended edge count */
  maxEdges: number;
  
  /** Supported interaction types */
  supportedInteractions: string[];
  
  /** Performance characteristics */
  performanceProfile: RenderingPerformanceProfile;
  
  /** Memory usage profile */
  memoryProfile: MemoryProfile;
  
  /** Feature support matrix */
  features: FeatureSupport;
}

export interface RenderingPerformanceProfile {
  /** Rendering time complexity */
  renderingComplexity: string;
  
  /** Update time complexity */
  updateComplexity: string;
  
  /** Memory complexity */
  memoryComplexity: string;
  
  /** Optimal use cases */
  optimalFor: string[];
}

export interface MemoryProfile {
  /** Base memory usage (MB) */
  baseUsage: number;
  
  /** Memory per node (MB) */
  perNode: number;
  
  /** Memory per edge (MB) */
  perEdge: number;
  
  /** Peak memory multiplier */
  peakMultiplier: number;
}

export interface FeatureSupport {
  /** Edge bundling support */
  edgeBundling: boolean;
  
  /** Real-time updates */
  realTimeUpdates: boolean;
  
  /** Hardware acceleration */
  hardwareAcceleration: boolean;
  
  /** Animation support */
  animations: boolean;
  
  /** Custom shaders (WebGL only) */
  customShaders?: boolean;
}

// Interaction Event (Unified Navigation Contract)
export interface InteractionEvent {
  /** Event type */
  type: 'zoom' | 'pan' | 'select' | 'hover' | 'click' | 'drag';
  
  /** Target element (node ID or null for background) */
  target?: string;
  
  /** Event coordinates */
  coordinates: Point2D;
  
  /** Event-specific data */
  data: any;
  
  /** Timestamp */
  timestamp: number;
  
  /** Whether event should be propagated */
  propagate: boolean;
}

// Visual Updates
export interface VisualUpdates {
  /** Node updates by ID */
  nodes?: Map<string, NodeUpdate>;
  
  /** Edge updates by source-target pair */
  edges?: Map<string, EdgeUpdate>;
  
  /** Viewport updates */
  viewport?: Partial<ViewportState>;
  
  /** Configuration updates */
  config?: Partial<VisualConfig>;
}

export interface NodeUpdate {
  /** Position update */
  position?: Point2D;
  
  /** Visual property updates */
  visual?: Partial<NodeVisualProperties>;
  
  /** Selection state */
  selected?: boolean;
  
  /** Highlight state */
  highlighted?: boolean;
}

export interface EdgeUpdate {
  /** Visual property updates */
  visual?: Partial<EdgeVisualProperties>;
  
  /** Bundle assignment */
  bundleGroup?: string;
}

export interface NodeVisualProperties {
  radius: number;
  fillColor: string;
  strokeColor: string;
  opacity: number;
}

export interface EdgeVisualProperties {
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  curvature?: number;
}

// Geometric Types
export interface Point2D {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Progress Callback
export type RenderingProgressCallback = (progress: RenderingProgress) => void;

export interface RenderingProgress {
  /** Current rendering stage */
  stage: 'preparation' | 'nodes' | 'edges' | 'post-processing';
  
  /** Progress percentage (0-100) */
  percentage: number;
  
  /** Status message */
  message: string;
  
  /** Performance metrics */
  metrics: RenderingMetrics;
}

export interface RenderingMetrics {
  /** Rendering time so far (ms) */
  renderTime: number;
  
  /** Memory usage (MB) */
  memoryUsage: number;
  
  /** Current FPS */
  currentFPS: number;
  
  /** Nodes rendered */
  nodesRendered: number;
  
  /** Edges rendered */
  edgesRendered: number;
}

// Validation Result (reused from layout-engine)
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