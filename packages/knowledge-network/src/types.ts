/**
 * Modular Knowledge Graph Engine Types
 * 
 * This file contains comprehensive TypeScript definitions for the modular graph engine.
 * Architecture: Sequential pipeline processing with modular rendering strategies.
 * 
 * @fileoverview Core type definitions for the modular knowledge graph system
 * @author Knowledge Network Team
 * @version 1.0.0
 */

// Basic graph data structures
export interface Node {
  /** Unique identifier for the node */
  id: string;
  
  /** Display label for the node */
  label?: string;
  
  /** Optional group/type classification */
  group?: string;
  
  /** Additional node properties */
  [key: string]: any;
}

export interface Edge {
  /** Unique identifier for the edge */
  id: string;
  
  /** Source node ID */
  source: string;
  
  /** Target node ID */
  target: string;
  
  /** Optional edge label */
  label?: string;
  
  /** Edge weight/strength */
  weight?: number;
  
  /** Additional edge properties */
  [key: string]: any;
}

// Graph dataset structure
export interface GraphDataset {
  /** Array of nodes */
  nodes: Node[];
  
  /** Array of edges */
  edges: Edge[];
  
  /** Optional metadata */
  metadata?: {
    [key: string]: any;
  };
}

// Modular configuration interfaces
export interface ModularGraphConfig {
  /** Layout engine configuration */
  layout: LayoutEngineOptions;
  
  /** Rendering strategy configuration */
  rendering: RenderingStrategyOptions;
  
  /** Pipeline coordinator configuration */
  pipeline: PipelineCoordinatorOptions;
  
  /** Navigation contract configuration */
  navigation: NavigationContractOptions;
  
  /** Similarity measure configuration */
  similarity: SimilarityMeasureOptions;
}

export interface LayoutEngineOptions {
  /** Layout algorithm type */
  algorithm: 'force-directed' | 'hierarchical' | 'circular';
  
  /** Algorithm-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface RenderingStrategyOptions {
  /** Rendering type */
  type: 'canvas' | 'svg' | 'webgl';
  
  /** Rendering-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface PipelineCoordinatorOptions {
  /** Processing mode */
  mode: 'sequential' | 'parallel';
  
  /** Pipeline-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface NavigationContractOptions {
  /** Navigation features to enable */
  features: string[];
  
  /** Navigation-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}

export interface SimilarityMeasureOptions {
  /** Similarity functions to use */
  functions: string[];
  
  /** Similarity-specific parameters */
  parameters?: {
    [key: string]: any;
  };
}