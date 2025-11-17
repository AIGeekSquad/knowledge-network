/**
 * Knowledge Graph - Main Orchestration Class
 * 
 * Coordinates layout calculation, rendering strategies, and user interactions
 * using existing modular components following Constitutional compliance.
 */

import { Node, Edge } from '../types';
import { LayoutEngine } from '../layout';
import { CanvasRenderingStrategy } from '../rendering';
import { EventEmitter } from '../utils/ReactiveEmitter';

export interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export interface GraphConfig {
  width?: number;
  height?: number;
  edgeRenderer?: 'simple' | 'bundled';
  onNodeSelected?: (nodeId: string) => void;
  onStateChange?: (state: string) => void;
  [key: string]: any;
}

/**
 * Main Knowledge Graph class using modular architecture
 */
export class KnowledgeGraph {
  private container: HTMLElement;
  private data: GraphData;
  private config: GraphConfig;
  private layoutEngine!: LayoutEngine;
  private currentRenderer: any;
  private eventEmitter: EventEmitter;

  constructor(container: HTMLElement, data: GraphData, config: GraphConfig = {}) {
    this.container = container;
    this.data = data;
    this.config = {
      width: 800,
      height: 600,
      edgeRenderer: 'simple',
      ...config
    };

    this.eventEmitter = new EventEmitter();
    this.initializeLayoutEngine();
    this.initializeRenderer();
  }

  private initializeLayoutEngine(): void {
    this.layoutEngine = new LayoutEngine();
  }

  private initializeRenderer(): void {
    // Use Canvas as default for simplicity
    this.currentRenderer = new CanvasRenderingStrategy();
  }

  async render(): Promise<void> {
    try {
      // For now, just render basic layout
      // TODO: Integrate with actual layout calculation methods
      console.log('Rendering graph with nodes:', this.data.nodes.length);
      console.log('Container:', this.container.tagName);
      
      // Basic rendering setup
      if (this.currentRenderer && this.layoutEngine) {
        console.log('Renderer and layout engine available');
      }

      // Notify state change
      if (this.config.onStateChange) {
        this.config.onStateChange('ready');
      }
    } catch (error) {
      console.error('Render error:', error);
      if (this.config.onStateChange) {
        this.config.onStateChange('error');
      }
    }
  }

  selectNode(nodeId: string): void {
    if (this.config.onNodeSelected) {
      this.config.onNodeSelected(nodeId);
    }
  }

  clearSelection(): void {
    // Clear any current selection
    console.log('Selection cleared');
  }

  updateData(newData: GraphData): void {
    this.data = newData;
    this.render();
  }

  destroy(): void {
    if (this.currentRenderer && this.currentRenderer.destroy) {
      this.currentRenderer.destroy();
    }
    this.eventEmitter.destroy();
  }
}