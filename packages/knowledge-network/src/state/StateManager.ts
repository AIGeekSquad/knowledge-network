import { EventEmitter } from 'events';
import { LayoutEngineState } from '../types';
import type { LayoutAlgorithm } from '../layout/LayoutEngine';
import type { Selection } from '../interaction/InteractionManager';
import type { Transform, RendererType } from '../rendering/RenderingSystem';
import type { BoundingBox } from '../layout/LayoutEngine';

export enum RenderState {
  IDLE = 'idle',
  RENDERING = 'rendering',
  UPDATING = 'updating',
  ERROR = 'error'
}

export interface InteractionState {
  dragEnabled: boolean;
  zoomEnabled: boolean;
  panEnabled: boolean;
  selectEnabled: boolean;
  hoveredNode: string | null;
  hoveredEdge: string | null;
  isDragging: boolean;
  draggedNode: string | null;
}

export interface ViewportState {
  transform: Transform;
  bounds: BoundingBox;
  zoomExtent: [number, number];
}

export interface ErrorState {
  error: Error;
  context?: string;
  timestamp: number;
}

export interface GraphState {
  layout: {
    state: LayoutEngineState;
    progress: number;
    algorithm: LayoutAlgorithm;
  };
  render: {
    state: RenderState;
    renderer: RendererType;
  };
  interaction: InteractionState;
  viewport: ViewportState;
  selection: {
    nodes: string[];
    edges: string[];
  };
  error: ErrorState | null;
  metadata: Record<string, any>;
}

export interface StateHistoryEntry {
  state: GraphState;
  timestamp: number;
  label?: string;
}

/**
 * Centralized state management for the Knowledge Graph.
 *
 * @remarks
 * The StateManager maintains the complete state of the graph visualization,
 * including layout state, rendering state, interaction state, and viewport state.
 * It provides history management for undo/redo operations and state persistence.
 *
 * @example
 * ```typescript
 * const stateManager = new StateManager();
 *
 * // Update state
 * stateManager.setLayoutState(LayoutEngineState.LOADING, 0);
 *
 * // Save state checkpoint
 * stateManager.pushState('Before layout change');
 *
 * // Undo last change
 * if (stateManager.canUndo()) {
 *   stateManager.undo();
 * }
 * ```
 */
export class StateManager extends EventEmitter {
  private state: GraphState;
  private history: StateHistoryEntry[] = [];
  private historyIndex: number = -1;
  private maxHistorySize: number = 50;
  private savedStates: Map<string, string> = new Map();

  constructor() {
    super();
    this.state = this.createInitialState();
  }

  /**
   * Create initial state
   */
  private createInitialState(): GraphState {
    return {
      layout: {
        state: LayoutEngineState.INITIAL,
        progress: 0,
        algorithm: 'force-directed'
      },
      render: {
        state: RenderState.IDLE,
        renderer: 'svg'
      },
      interaction: {
        dragEnabled: false,
        zoomEnabled: true,
        panEnabled: true,
        selectEnabled: true,
        hoveredNode: null,
        hoveredEdge: null,
        isDragging: false,
        draggedNode: null
      },
      viewport: {
        transform: { x: 0, y: 0, scale: 1 },
        bounds: {
          minX: 0,
          minY: 0,
          maxX: 800,
          maxY: 600,
          width: 800,
          height: 600
        },
        zoomExtent: [0.1, 10]
      },
      selection: {
        nodes: [],
        edges: []
      },
      error: null,
      metadata: {}
    };
  }

  /**
   * Get current state
   */
  getState(): GraphState {
    return this.deepClone(this.state);
  }

  /**
   * Set state (partial update)
   */
  setState(partialState: Partial<GraphState>): void {
    const oldState = this.deepClone(this.state);
    this.state = this.mergeState(this.state, partialState);

    this.emit('stateChanged', this.state);

    // Emit specific state change events
    if (oldState.layout.state !== this.state.layout.state ||
        oldState.layout.progress !== this.state.layout.progress) {
      this.emit('layoutStateChanged', this.state.layout.state, this.state.layout.progress);
    }

    if (oldState.render.state !== this.state.render.state) {
      this.emit('renderStateChanged', this.state.render.state);
    }

    if (!this.selectionsEqual(oldState.selection, this.state.selection)) {
      this.emit('selectionChanged', this.state.selection);
    }

    if (oldState.error !== this.state.error) {
      if (this.state.error) {
        this.emit('error', this.state.error.error, this.state.error.context);
      } else {
        this.emit('errorCleared');
      }
    }
  }

  /**
   * Reset state to initial
   */
  resetState(): void {
    this.state = this.createInitialState();
    this.history = [];
    this.historyIndex = -1;
    this.emit('stateReset');
    this.emit('stateChanged', this.state);
  }

  /**
   * Specific state updates
   */
  setLayoutState(state: LayoutEngineState, progress?: number): void {
    this.setState({
      layout: {
        ...this.state.layout,
        state,
        progress: progress ?? this.state.layout.progress
      }
    });
  }

  setRenderState(state: RenderState): void {
    this.setState({
      render: {
        ...this.state.render,
        state
      }
    });
  }

  setInteractionState(state: Partial<InteractionState>): void {
    this.setState({
      interaction: {
        ...this.state.interaction,
        ...state
      }
    });
  }

  setViewportState(viewport: Partial<ViewportState>): void {
    this.setState({
      viewport: {
        ...this.state.viewport,
        ...viewport
      }
    });
  }

  setSelection(selection: Selection | { nodes: string[], edges: string[] }): void {
    this.setState({
      selection: {
        nodes: Array.isArray(selection.nodes) ? selection.nodes : [],
        edges: Array.isArray(selection.edges) ? selection.edges : []
      }
    });
  }

  setError(error: Error | null, context?: string): void {
    if (error) {
      this.setState({
        error: {
          error,
          context,
          timestamp: Date.now()
        }
      });
    } else {
      this.setState({ error: null });
    }
  }

  setMetadata(key: string, value: any): void {
    this.setState({
      metadata: {
        ...this.state.metadata,
        [key]: value
      }
    });
  }

  getMetadata(key: string): any {
    return this.state.metadata[key];
  }

  /**
   * History management
   */
  pushState(label?: string): void {
    // Remove any states after current index (for redo that won't be possible)
    this.history = this.history.slice(0, this.historyIndex + 1);

    // Add new state
    const entry: StateHistoryEntry = {
      state: this.deepClone(this.state),
      timestamp: Date.now(),
      label
    };

    this.history.push(entry);
    this.historyIndex++;

    // Maintain max history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.historyIndex--;
    }

    this.emit('historyChanged', this.history);
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    this.historyIndex--;
    const entry = this.history[this.historyIndex];
    this.state = this.deepClone(entry.state);

    this.emit('stateChanged', this.state);
    this.emit('undo', entry);
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this.historyIndex++;
    const entry = this.history[this.historyIndex];
    this.state = this.deepClone(entry.state);

    this.emit('stateChanged', this.state);
    this.emit('redo', entry);
    return true;
  }

  canUndo(): boolean {
    return this.historyIndex > 0;
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  getHistory(): StateHistoryEntry[] {
    return this.history.map(entry => ({
      ...entry,
      state: this.deepClone(entry.state)
    }));
  }

  clearHistory(): void {
    this.history = [];
    this.historyIndex = -1;
    this.emit('historyCleared');
  }

  setMaxHistorySize(size: number): void {
    this.maxHistorySize = Math.max(1, size);

    // Trim history if needed
    if (this.history.length > this.maxHistorySize) {
      const excess = this.history.length - this.maxHistorySize;
      this.history = this.history.slice(excess);
      this.historyIndex = Math.max(0, this.historyIndex - excess);
    }
  }

  /**
   * State persistence
   */
  saveState(key: string): void {
    const stateJson = this.exportState();
    this.savedStates.set(key, stateJson);

    // Also save to localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`graph-state-${key}`, stateJson);
      } catch (e) {
        console.warn('Failed to save state to localStorage:', e);
      }
    }

    this.emit('stateSaved', key);
  }

  loadState(key: string): boolean {
    let stateJson = this.savedStates.get(key);

    // Try localStorage if not in memory
    if (!stateJson && typeof window !== 'undefined' && window.localStorage) {
      stateJson = localStorage.getItem(`graph-state-${key}`) || undefined;
    }

    if (!stateJson) return false;

    try {
      this.importState(stateJson);
      this.emit('stateLoaded', key);
      return true;
    } catch (e) {
      console.error('Failed to load state:', e);
      return false;
    }
  }

  deleteState(key: string): void {
    this.savedStates.delete(key);

    // Also remove from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(`graph-state-${key}`);
    }

    this.emit('stateDeleted', key);
  }

  getSavedStates(): string[] {
    const keys = Array.from(this.savedStates.keys());

    // Add localStorage keys
    if (typeof window !== 'undefined' && window.localStorage) {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('graph-state-')) {
          const stateKey = key.substring('graph-state-'.length);
          if (!keys.includes(stateKey)) {
            keys.push(stateKey);
          }
        }
      }
    }

    return keys;
  }

  /**
   * State export/import
   */
  exportState(): string {
    return JSON.stringify(this.state, null, 2);
  }

  importState(stateJson: string): void {
    try {
      const state = JSON.parse(stateJson);
      this.validateState(state);
      this.state = state;
      this.emit('stateImported');
      this.emit('stateChanged', this.state);
    } catch (e) {
      throw new Error(`Failed to import state: ${e}`);
    }
  }

  /**
   * Helper methods
   */
  private deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  private mergeState(current: GraphState, partial: Partial<GraphState>): GraphState {
    const merged = { ...current };

    Object.keys(partial).forEach(key => {
      const k = key as keyof GraphState;
      const value = partial[k];

      if (value !== undefined) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          merged[k] = { ...current[k] as any, ...value as any } as any;
        } else {
          merged[k] = value as any;
        }
      }
    });

    return merged;
  }

  private selectionsEqual(a: { nodes: string[], edges: string[] }, b: { nodes: string[], edges: string[] }): boolean {
    return a.nodes.length === b.nodes.length &&
           a.edges.length === b.edges.length &&
           a.nodes.every(id => b.nodes.includes(id)) &&
           a.edges.every(id => b.edges.includes(id));
  }

  private validateState(state: any): void {
    // Basic validation
    if (!state || typeof state !== 'object') {
      throw new Error('Invalid state: must be an object');
    }

    if (!state.layout || !state.render || !state.interaction || !state.viewport) {
      throw new Error('Invalid state: missing required properties');
    }

    // Could add more detailed validation here
  }

  /**
   * Get specific state slices
   */
  getLayoutState(): GraphState['layout'] {
    return { ...this.state.layout };
  }

  getRenderState(): GraphState['render'] {
    return { ...this.state.render };
  }

  getInteractionState(): InteractionState {
    return { ...this.state.interaction };
  }

  getViewportState(): ViewportState {
    return {
      transform: { ...this.state.viewport.transform },
      bounds: { ...this.state.viewport.bounds },
      zoomExtent: [...this.state.viewport.zoomExtent]
    };
  }

  getSelectionState(): { nodes: string[], edges: string[] } {
    return {
      nodes: [...this.state.selection.nodes],
      edges: [...this.state.selection.edges]
    };
  }

  getErrorState(): ErrorState | null {
    return this.state.error ? { ...this.state.error } : null;
  }

  /**
   * Callbacks support (for backward compatibility)
   */
  private callbacks: Record<string, Array<(...args: any[]) => void>> = {};

  registerCallback(event: string, callback: (...args: any[]) => void): void {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);

    // Also register with EventEmitter
    this.on(event, callback);
  }

  unregisterCallback(event: string, callback: (...args: any[]) => void): void {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(callback);
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }

    // Also remove from EventEmitter
    this.off(event, callback);
  }

  triggerCallbacks(event: string, ...args: any[]): void {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => {
        try {
          callback(...args);
        } catch (e) {
          console.error(`Error in callback for ${event}:`, e);
        }
      });
    }

    // Also emit through EventEmitter
    this.emit(event, ...args);
  }
}