# Refactoring Roadmap: Align Implementation with Architecture

## 🎯 Goal

Refactor `KnowledgeGraph.ts` from 540 lines of mixed responsibilities to ~150 lines of pure orchestration by extracting missing modules and properly using EdgeRenderer.

## 📊 Current State Analysis

### Code Metrics
```
KnowledgeGraph.ts: 540 lines
├── Orchestration logic: ~150 lines (28%) ✅
├── Configuration handling: ~80 lines (15%) ❌ Should be ConfigManager
├── State management: ~40 lines (7%) ❌ Should be StateManager
├── Selection logic: ~60 lines (11%) ❌ Should be SelectionManager
├── Edge rendering: ~50 lines (9%) ⚠️ Should use EdgeRenderer properly
├── Event handling: ~40 lines (7%) ⚠️ Mixed concerns
└── Helper methods: ~120 lines (22%) ❌ Scattered responsibilities
```

### Module Status
| Module | Status | Lines | Location | Priority |
|--------|--------|-------|----------|----------|
| LayoutEngine | ✅ Exists & Used | 750 | `layout/LayoutEngine.ts` | - |
| RenderingSystem | ✅ Exists & Used | 360 | `rendering/RenderingSystem.ts` | - |
| ViewportManager | ✅ Exists & Used | 480 | `viewport/ViewportManager.ts` | - |
| EdgeRenderer | ⚠️ Exists but unused | 340 | `edges/EdgeRenderer.ts` | 🔥 HIGH |
| ConfigManager | ❌ Missing | 0 | - | 🔥 HIGH |
| StateManager | ✅ Exists but unused | 420 | `state/StateManager.ts` | 🔥 HIGH |
| SelectionManager | ❌ Missing | 0 | - | ⚠️ MEDIUM |
| InteractionManager | ⚠️ Exists but unused | 590 | `interaction/InteractionManager.ts` | 📝 LOW |

**Surprise Discovery**: StateManager and InteractionManager already exist! They're just not being used by KnowledgeGraph!

## 🚀 Phased Refactoring Plan

---

## Phase 1: Use Existing StateManager ✅ EXISTS!

**Duration**: 1 day  
**Priority**: HIGH  
**Risk**: Low (module already exists)

### Current Problem
```typescript
// In KnowledgeGraph.ts - lines 56-60
private currentState: LayoutEngineState = LayoutEngineState.INITIAL;
private selectedNodeId: string | null = null;
private layoutResult: LayoutResult | null = null;

// Lines 209-222
private updateState(state: LayoutEngineState, progress: number): void {
  this.currentState = state;
  if (this.config.onStateChange) {
    try {
      this.config.onStateChange(state, progress);
    } catch (error) {
      console.error('Error in onStateChange callback:', error);
    }
  }
}
```

### Solution

**Step 1.1**: Examine existing StateManager
```bash
# Review what already exists
cat src/state/StateManager.ts
```

**Step 1.2**: Import and initialize StateManager in KnowledgeGraph
```typescript
// src/KnowledgeGraph.ts
import { StateManager } from './state/StateManager';

export class KnowledgeGraph {
  private stateManager: StateManager;
  
  constructor(container, data, config) {
    this.stateManager = new StateManager();
    
    // Forward state events to user callbacks
    this.stateManager.on('stateChange', (state, progress) => {
      if (this.config.onStateChange) {
        this.config.onStateChange(state, progress);
      }
    });
  }
}
```

**Step 1.3**: Replace direct state access with StateManager
```typescript
// Before:
this.currentState = LayoutEngineState.LOADING;
if (this.config.onStateChange) {
  this.config.onStateChange(state, progress);
}

// After:
this.stateManager.setState(LayoutEngineState.LOADING, 10);
```

**Step 1.4**: Remove redundant code
```typescript
// DELETE these from KnowledgeGraph:
private currentState: LayoutEngineState;       // ❌ Remove
private selectedNodeId: string | null;         // ❌ Remove
private updateState(state, progress): void {}  // ❌ Remove
private handleError(error, stage): void {}     // ⚠️ Move to StateManager
```

**Files to Change**:
- `src/KnowledgeGraph.ts`: Import StateManager, replace state calls
- `src/types.ts`: Ensure LayoutEngineState is exported

**Tests**:
- Verify state transitions still work
- Verify callbacks still fire
- Run existing architecture tests

**Lines Removed**: ~50 lines  
**Complexity Reduction**: 10%

---

## Phase 2: Use Existing InteractionManager ✅ EXISTS!

**Duration**: 0.5 days  
**Priority**: MEDIUM  
**Risk**: Low (module already exists)

### Current Problem
```typescript
// KnowledgeGraph handles interaction setup directly
private setupEventListeners(): void {
  if (!this.layoutEngine) return;
  
  this.layoutEngine.on('layoutProgress', (progress) => { ... });
  this.layoutEngine.on('positions', (positions) => { ... });
  // ... more event handlers ...
}
```

### Solution

**Step 2.1**: Check what InteractionManager provides
```bash
cat src/interaction/InteractionManager.ts
```

**Step 2.2**: Initialize InteractionManager
```typescript
import { InteractionManager } from './interaction/InteractionManager';

constructor(container, data, config) {
  // ... existing code ...
  
  this.interactionManager = new InteractionManager(
    container,
    this.layoutEngine,
    this.renderingSystem,
    this.viewportManager
  );
  
  // Enable interactions based on config
  if (this.config.enableDrag) {
    this.interactionManager.enableDrag(true);
  }
  if (this.config.enableZoom) {
    this.interactionManager.enableZoom(true);
  }
}
```

**Step 2.3**: Delegate interaction setup
```typescript
// DELETE setupEventListeners() from KnowledgeGraph
// InteractionManager should handle it

// Replace with:
private setupInteractions(): void {
  this.interactionManager.setup();
}
```

**Files to Change**:
- `src/KnowledgeGraph.ts`: Import and delegate to InteractionManager

**Lines Removed**: ~30 lines  
**Complexity Reduction**: 5%

---

## Phase 3: Fix EdgeRenderer Usage 🔥 CRITICAL

**Duration**: 2 days  
**Priority**: CRITICAL  
**Risk**: Medium (affects rendering)

### Current Problem
```typescript
// EdgeRenderer is created but never called!
this.edgeRenderer = new EdgeBundling(this.config.edgeBundling);

// Instead, just passing string:
this.renderingSystem.render(this.layoutResult, {
  edgeConfig: {
    curveType: this.config.edgeRenderer === 'bundled' ? 'bundle' : 'straight'
  }
});
```

### Solution

**Step 3.1**: Add edge generation phase
```typescript
/**
 * Generate edge geometries after layout
 */
private async generateEdgeGeometry(): Promise<void> {
  if (!this.layoutResult || !this.edgeRenderer) return;
  
  this.stateManager.setState(LayoutEngineState.EDGE_GENERATING, 60);
  
  // Actually use the EdgeRenderer!
  this.edgeRenderResult = await this.edgeRenderer.render(
    this.layoutResult.edges,
    this.layoutResult.nodes,
    this.config.edgeBundling
  );
  
  this.stateManager.setState(LayoutEngineState.EDGE_GENERATED, 70);
}
```

**Step 3.2**: Update render flow
```typescript
async render(): Promise<void> {
  try {
    // Phase 1: Layout
    this.stateManager.setState(LayoutEngineState.LAYOUT_CALCULATING, 20);
    this.layoutResult = await this.layoutEngine.calculateLayout(this.data);
    
    // Phase 2: Edge Generation (NEW!)
    await this.generateEdgeGeometry();
    
    // Phase 3: Rendering
    await this.renderScene();
    
    // Phase 4: Viewport
    this.setupViewport();
    
    this.stateManager.setState(LayoutEngineState.READY, 100);
  } catch (error) {
    this.stateManager.setError(error, 'render');
  }
}
```

**Step 3.3**: Update rendering to use edge geometry
```typescript
private async renderScene(): Promise<void> {
  if (!this.layoutResult || !this.renderingSystem) return;
  
  this.stateManager.setState(LayoutEngineState.RENDERING, 80);
  
  // Use edge geometry from EdgeRenderer
  await this.renderingSystem.render({
    nodes: this.layoutResult.nodes,
    edges: this.edgeRenderResult?.edges || this.layoutResult.edges,
    bounds: this.layoutResult.bounds
  }, {
    nodeConfig: this.getNodeConfig(),
    edgeConfig: this.getEdgeConfig(),
  });
}
```

**Step 3.4**: Add edge config helpers
```typescript
private getNodeConfig(): NodeRenderConfig {
  return {
    radius: this.config.nodeRadius,
    fill: this.config.nodeFill,
    stroke: this.config.nodeStroke,
    strokeWidth: this.config.nodeStrokeWidth,
  };
}

private getEdgeConfig(): EdgeRenderConfig {
  return {
    stroke: this.config.linkStroke,
    strokeWidth: this.config.linkStrokeWidth,
    // EdgeRenderer already generated geometry, just render it
  };
}
```

**Files to Change**:
- `src/KnowledgeGraph.ts`: Add edge generation phase, use edge geometry
- `src/edges/EdgeRenderer.ts`: Ensure render() method is complete
- `src/rendering/RenderingSystem.ts`: Accept edge geometry in render()

**Tests**:
- Verify simple edges still work
- Verify bundled edges use EdgeRenderer
- Compare visual output before/after
- Run edge bundling tests

**Lines Changed**: ~60 lines  
**Complexity Reduction**: 10%

---

## Phase 4: Create ConfigManager 🆕

**Duration**: 2 days  
**Priority**: HIGH  
**Risk**: Medium (affects initialization)

### Current Problem
```typescript
// 80+ lines of config handling in constructor
constructor(container, data, config) {
  this.config = {
    width: config.width ?? 800,
    height: config.height ?? 600,
    // ... 30 more lines of defaults ...
  };
  
  // Then more transformation in initializeComponents():
  const layoutConfig: Partial<LayoutConfig> = {
    linkDistance: typeof this.config.linkDistance === 'function' 
      ? 100 
      : this.config.linkDistance,
    // ... more transformation ...
  };
}
```

### Solution

**Step 4.1**: Create ConfigManager module
```typescript
// src/config/ConfigManager.ts

import type { 
  GraphConfig, 
  LayoutConfig, 
  RenderConfig, 
  ViewportConfig 
} from '../types';

export interface ResolvedConfig extends Required<GraphConfig> {
  // All properties required and resolved
}

export class ConfigManager {
  private config: ResolvedConfig;
  
  constructor(userConfig: Partial<GraphConfig>) {
    this.config = this.resolveConfig(userConfig);
  }
  
  private resolveConfig(userConfig: Partial<GraphConfig>): ResolvedConfig {
    // Apply all defaults
    return {
      width: userConfig.width ?? 800,
      height: userConfig.height ?? 600,
      nodeRadius: userConfig.nodeRadius ?? 10,
      // ... all defaults ...
    } as ResolvedConfig;
  }
  
  /**
   * Get configuration for LayoutEngine
   */
  getLayoutConfig(): LayoutConfig {
    return {
      width: this.config.width,
      height: this.config.height,
      linkDistance: this.resolveAccessor(this.config.linkDistance, 100),
      linkStrength: this.resolveAccessor(this.config.linkStrength, 1),
      chargeStrength: this.resolveAccessor(this.config.chargeStrength, -300),
      collisionRadius: this.resolveAccessor(this.config.collisionRadius, 20),
      similarityFunction: this.config.similarityFunction,
      similarityThreshold: this.config.similarityThreshold,
      alpha: 1,
      alphaMin: this.config.stabilityThreshold,
      dimensions: this.config.dimensions,
    };
  }
  
  /**
   * Get configuration for RenderingSystem
   */
  getRenderConfig(): RenderConfig {
    return {
      nodeConfig: {
        radius: this.config.nodeRadius,
        fill: this.config.nodeFill,
        stroke: this.config.nodeStroke,
        strokeWidth: this.config.nodeStrokeWidth,
      },
      edgeConfig: {
        stroke: this.config.linkStroke,
        strokeWidth: this.config.linkStrokeWidth,
        curveType: this.config.edgeRenderer === 'bundled' ? 'bundle' : 'straight',
      },
    };
  }
  
  /**
   * Get configuration for ViewportManager
   */
  getViewportConfig(): ViewportConfig {
    return {
      enableZoom: this.config.enableZoom,
      enablePan: this.config.enableDrag,
      zoomExtent: this.config.zoomExtent,
      fitToViewport: this.config.fitToViewport,
      padding: this.config.padding,
    };
  }
  
  /**
   * Resolve accessor to constant value if it's a function
   */
  private resolveAccessor<T, R>(
    accessor: R | ((d: T) => R) | undefined, 
    defaultValue: R
  ): R {
    if (accessor === undefined) return defaultValue;
    if (typeof accessor === 'function') return defaultValue;
    return accessor;
  }
  
  /**
   * Get full resolved config
   */
  getConfig(): ResolvedConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(updates: Partial<GraphConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}
```

**Step 4.2**: Use ConfigManager in KnowledgeGraph
```typescript
// src/KnowledgeGraph.ts

import { ConfigManager } from './config/ConfigManager';

export class KnowledgeGraph {
  private configManager: ConfigManager;
  
  constructor(container, data, config = {}) {
    this.container = container;
    this.data = data;
    
    // Replace 80 lines with this:
    this.configManager = new ConfigManager(config);
    
    this.initializeComponents();
  }
  
  private initializeComponents(): void {
    // Use config adapters
    this.layoutEngine = new LayoutEngine(
      'force-directed',
      this.configManager.getLayoutConfig()
    );
    
    this.renderingSystem = new RenderingSystem(
      this.container,
      {
        width: this.configManager.getConfig().width,
        height: this.configManager.getConfig().height,
      }
    );
    
    // ... etc ...
  }
}
```

**Step 4.3**: Create type definitions
```typescript
// src/config/types.ts

export interface ViewportConfig {
  enableZoom: boolean;
  enablePan: boolean;
  zoomExtent?: [number, number];
  fitToViewport?: boolean;
  padding?: number;
}
```

**Files to Create**:
- `src/config/ConfigManager.ts`: New module
- `src/config/types.ts`: Config types
- `src/config/index.ts`: Exports

**Files to Change**:
- `src/KnowledgeGraph.ts`: Use ConfigManager, remove config logic
- `src/types.ts`: Export config types

**Tests**:
- Verify default config works
- Verify custom config works
- Verify accessor functions still work
- Test config updates

**Lines Removed**: ~80 lines from KnowledgeGraph  
**Lines Added**: ~150 lines in ConfigManager  
**Net Change**: Configuration logic properly separated  
**Complexity Reduction**: 15%

---

## Phase 5: Create SelectionManager 🆕

**Duration**: 1.5 days  
**Priority**: MEDIUM  
**Risk**: Low (straightforward extraction)

### Current Problem
```typescript
// 60+ lines of selection logic in KnowledgeGraph
selectNode(nodeId: string): void {
  this.selectedNodeId = nodeId;
  const neighbors = this.getNeighbors(nodeId);
  const connectedEdges: string[] = [];
  
  this.data.edges.forEach((edge, index) => {
    // ... edge traversal logic ...
  });
  
  this.renderingSystem.highlightNodes([nodeId, ...neighbors]);
  this.renderingSystem.highlightEdges(connectedEdges);
  
  if (this.config.onNodeSelected) {
    this.config.onNodeSelected(nodeId, neighbors, connectedEdges);
  }
}

getNeighbors(nodeId: string): string[] {
  // ... 15 lines of graph traversal ...
}
```

### Solution

**Step 5.1**: Create SelectionManager module
```typescript
// src/selection/SelectionManager.ts

import { EventEmitter } from 'events';
import type { GraphData, Node, Edge } from '../types';

export interface Selection {
  nodeId: string;
  neighbors: string[];
  connectedEdges: string[];
  node?: Node;
}

export interface SelectionState {
  selectedNodes: Set<string>;
  selectedEdges: Set<string>;
}

export class SelectionManager extends EventEmitter {
  private data: GraphData;
  private selection: SelectionState = {
    selectedNodes: new Set(),
    selectedEdges: new Set(),
  };
  
  constructor(data: GraphData) {
    super();
    this.data = data;
  }
  
  /**
   * Select a node and find related elements
   */
  selectNode(nodeId: string): Selection {
    const node = this.data.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }
    
    const neighbors = this.findNeighbors(nodeId);
    const connectedEdges = this.findConnectedEdges(nodeId);
    
    // Update state
    this.selection.selectedNodes.clear();
    this.selection.selectedNodes.add(nodeId);
    neighbors.forEach(id => this.selection.selectedNodes.add(id));
    
    this.selection.selectedEdges.clear();
    connectedEdges.forEach(id => this.selection.selectedEdges.add(id));
    
    const selection: Selection = {
      nodeId,
      node,
      neighbors,
      connectedEdges,
    };
    
    this.emit('selectionChanged', selection);
    return selection;
  }
  
  /**
   * Select multiple nodes
   */
  selectNodes(nodeIds: string[]): Selection[] {
    return nodeIds.map(id => this.selectNode(id));
  }
  
  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selection.selectedNodes.clear();
    this.selection.selectedEdges.clear();
    this.emit('selectionCleared');
  }
  
  /**
   * Get current selection state
   */
  getSelection(): SelectionState {
    return {
      selectedNodes: new Set(this.selection.selectedNodes),
      selectedEdges: new Set(this.selection.selectedEdges),
    };
  }
  
  /**
   * Find neighbor nodes
   */
  private findNeighbors(nodeId: string): string[] {
    const neighbors: Set<string> = new Set();
    
    this.data.edges.forEach((edge) => {
      const sourceId = typeof edge.source === 'string' 
        ? edge.source 
        : (edge.source as Node).id;
      const targetId = typeof edge.target === 'string' 
        ? edge.target 
        : (edge.target as Node).id;
      
      if (sourceId === nodeId && targetId !== nodeId) {
        neighbors.add(targetId);
      } else if (targetId === nodeId && sourceId !== nodeId) {
        neighbors.add(sourceId);
      }
    });
    
    return Array.from(neighbors);
  }
  
  /**
   * Find edges connected to node
   */
  private findConnectedEdges(nodeId: string): string[] {
    const connectedEdges: string[] = [];
    
    this.data.edges.forEach((edge, index) => {
      const sourceId = typeof edge.source === 'string' 
        ? edge.source 
        : (edge.source as Node).id;
      const targetId = typeof edge.target === 'string' 
        ? edge.target 
        : (edge.target as Node).id;
      
      if (sourceId === nodeId || targetId === nodeId) {
        connectedEdges.push(edge.id || `edge-${index}`);
      }
    });
    
    return connectedEdges;
  }
  
  /**
   * Update data reference
   */
  updateData(data: GraphData): void {
    this.data = data;
    this.clearSelection();
  }
  
  /**
   * Check if node is selected
   */
  isNodeSelected(nodeId: string): boolean {
    return this.selection.selectedNodes.has(nodeId);
  }
  
  /**
   * Check if edge is selected
   */
  isEdgeSelected(edgeId: string): boolean {
    return this.selection.selectedEdges.has(edgeId);
  }
}
```

**Step 5.2**: Use SelectionManager in KnowledgeGraph
```typescript
// src/KnowledgeGraph.ts

import { SelectionManager } from './selection/SelectionManager';

export class KnowledgeGraph {
  private selectionManager: SelectionManager;
  
  constructor(container, data, config) {
    // ... other initialization ...
    
    this.selectionManager = new SelectionManager(data);
    
    // Forward selection events to user callbacks
    this.selectionManager.on('selectionChanged', (selection) => {
      // Apply highlighting
      this.renderingSystem.highlightNodes([
        selection.nodeId,
        ...selection.neighbors
      ]);
      this.renderingSystem.highlightEdges(selection.connectedEdges);
      
      // Call user callback
      const config = this.configManager.getConfig();
      if (config.onNodeSelected) {
        config.onNodeSelected(
          selection.nodeId,
          selection.neighbors,
          selection.connectedEdges
        );
      }
    });
  }
  
  selectNode(nodeId: string): void {
    this.selectionManager.selectNode(nodeId);
  }
  
  clearSelection(): void {
    this.selectionManager.clearSelection();
    this.renderingSystem.clearHighlights();
  }
}
```

**Files to Create**:
- `src/selection/SelectionManager.ts`: New module
- `src/selection/types.ts`: Selection types
- `src/selection/index.ts`: Exports

**Files to Change**:
- `src/KnowledgeGraph.ts`: Use SelectionManager, remove selection logic

**Tests**:
- Verify node selection works
- Verify neighbor finding works
- Verify edge finding works
- Test selection clearing
- Test selection events

**Lines Removed**: ~60 lines from KnowledgeGraph  
**Lines Added**: ~120 lines in SelectionManager  
**Net Change**: Selection logic properly separated  
**Complexity Reduction**: 12%

---

## Phase 6: Clean Up & Final Integration

**Duration**: 1 day  
**Priority**: MEDIUM  
**Risk**: Low (cleanup)

### Tasks

**Step 6.1**: Remove dead code from KnowledgeGraph
```typescript
// DELETE these methods:
private accessor()           // ❌ Move to ConfigManager
private getNeighbors()       // ❌ Moved to SelectionManager
private updateState()        // ❌ Moved to StateManager
private handleError()        // ❌ Moved to StateManager
```

**Step 6.2**: Simplify render() method
```typescript
async render(): Promise<void> {
  // Clean, simple orchestration
  await this.phaseLayout();
  await this.phaseEdgeGeneration();
  await this.phaseRendering();
  await this.phaseViewport();
}

private async phaseLayout(): Promise<void> {
  this.stateManager.setState(LayoutEngineState.LAYOUT_CALCULATING, 20);
  this.layoutResult = await this.layoutEngine.calculateLayout(this.data);
}

private async phaseEdgeGeneration(): Promise<void> {
  this.stateManager.setState(LayoutEngineState.EDGE_GENERATING, 50);
  this.edgeRenderResult = await this.edgeRenderer.render(
    this.layoutResult.edges,
    this.layoutResult.nodes
  );
}

private async phaseRendering(): Promise<void> {
  this.stateManager.setState(LayoutEngineState.RENDERING, 75);
  await this.renderingSystem.render({
    nodes: this.layoutResult.nodes,
    edges: this.edgeRenderResult.edges,
    bounds: this.layoutResult.bounds
  }, this.configManager.getRenderConfig());
}

private async phaseViewport(): Promise<void> {
  this.stateManager.setState(LayoutEngineState.ZOOM_FITTING, 90);
  this.viewportManager.setup(this.container, this.renderingSystem);
  
  const vpConfig = this.configManager.getViewportConfig();
  if (vpConfig.enableZoom) {
    this.viewportManager.setZoomEnabled(true);
  }
  if (vpConfig.fitToViewport) {
    this.viewportManager.fitToViewport(vpConfig.padding || 50, true);
  }
  
  this.stateManager.setState(LayoutEngineState.READY, 100);
}
```

**Step 6.3**: Update documentation
- Update README with new architecture
- Document new modules
- Update examples

**Step 6.4**: Run full test suite
```bash
npm test
npm run test:architecture
npm run lint
npm run build
```

**Files to Change**:
- `src/KnowledgeGraph.ts`: Final cleanup
- `README.md`: Update architecture section
- `examples/`: Update example code

**Lines Removed**: ~50 lines (dead code, simplification)  
**Final KnowledgeGraph size**: ~150 lines ✅

---

## 📊 Expected Results

### Before Refactoring

```
KnowledgeGraph.ts: 540 lines
├── Orchestration: 150 lines (28%)
├── Configuration: 80 lines (15%) ❌
├── State: 40 lines (7%) ❌
├── Selection: 60 lines (11%) ❌
├── Edge logic: 50 lines (9%) ⚠️
├── Events: 40 lines (7%) ⚠️
└── Helpers: 120 lines (22%) ❌
```

### After Refactoring

```
KnowledgeGraph.ts: ~150 lines
├── Module initialization: 40 lines
├── Orchestration logic: 50 lines
├── Lifecycle management: 30 lines
└── Public API: 30 lines

ConfigManager.ts: ~150 lines (NEW)
StateManager.ts: 420 lines (USED)
SelectionManager.ts: ~120 lines (NEW)
InteractionManager.ts: 590 lines (USED)
EdgeRenderer: (PROPERLY USED)
```

### Metrics Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| KnowledgeGraph Lines | 540 | 150 | **72% reduction** |
| Modules Used | 3/7 | 7/7 | **100% usage** |
| Separation of Concerns | 50% | 100% | **2x better** |
| EdgeRenderer Usage | 0% | 100% | **∞% better** |
| Test Coverage | 65% | 95% | **30% increase** |
| Architecture Compliance | 55% | 100% | **45% increase** |

---

## 🧪 Testing Strategy

### Per-Phase Testing

Each phase should include:
1. **Unit tests** for new modules
2. **Integration tests** for module interactions
3. **Regression tests** to ensure no breaking changes
4. **Visual tests** for rendering changes

### Test Checklist

```bash
# After each phase:
✓ npm test                    # Run all unit tests
✓ npm run test:architecture   # Architecture compliance tests
✓ npm run test:integration    # Integration tests
✓ npm run test:visual         # Visual regression tests
✓ npm run lint                # Code quality
✓ npm run build               # Ensure it builds
✓ npm run examples            # Manual testing
```

---

## 📝 Migration Notes

### Breaking Changes

**None!** All changes are internal refactoring. Public API remains the same:

```typescript
// API stays exactly the same
const graph = new KnowledgeGraph(container, data, config);
graph.render();
graph.selectNode(nodeId);
graph.clearSelection();
graph.destroy();
```

### Config Changes

All existing configurations continue to work. No changes needed in user code.

---

## ⏱️ Timeline Summary

| Phase | Duration | Priority | Risk | Lines Changed |
|-------|----------|----------|------|---------------|
| 1. Use StateManager | 1 day | HIGH | Low | -50 |
| 2. Use InteractionManager | 0.5 days | MEDIUM | Low | -30 |
| 3. Fix EdgeRenderer | 2 days | CRITICAL | Medium | ±60 |
| 4. Create ConfigManager | 2 days | HIGH | Medium | -80, +150 |
| 5. Create SelectionManager | 1.5 days | MEDIUM | Low | -60, +120 |
| 6. Cleanup & Integration | 1 day | MEDIUM | Low | -50 |
| **TOTAL** | **8 days** | | | **-390 in KG** |

**Net Result**: KnowledgeGraph goes from 540 → 150 lines

---

## 🎯 Success Criteria

### Code Quality
- ✅ KnowledgeGraph < 200 lines
- ✅ All modules used properly
- ✅ No TODO/FIXME comments
- ✅ 100% TypeScript strict mode
- ✅ Lint passing with no warnings

### Architecture
- ✅ Single Responsibility Principle followed
- ✅ Proper separation of concerns
- ✅ EdgeRenderer generates geometry
- ✅ Flow sequence enforced
- ✅ State management centralized

### Testing
- ✅ All tests passing
- ✅ Architecture tests 100% passing
- ✅ Test coverage > 90%
- ✅ No regression in functionality
- ✅ Visual output unchanged

### Documentation
- ✅ Architecture docs updated
- ✅ README reflects new structure
- ✅ Examples updated
- ✅ API docs complete

---

## 🚨 Risk Mitigation

### High-Risk Areas

1. **EdgeRenderer Integration** (Phase 3)
   - **Risk**: Visual output could change
   - **Mitigation**: Visual regression tests, gradual rollout
   
2. **ConfigManager** (Phase 4)
   - **Risk**: Accessor functions might break
   - **Mitigation**: Comprehensive accessor tests, backward compatibility

### Rollback Plan

Each phase should be a separate commit/PR:
- Easy to revert individual phases
- Can pause refactoring at any point
- System remains functional after each phase

---

## 📚 References

- Architecture Design: `tests/architecture/README.md`
- Current Violations: `ARCHITECTURE_DIVERGENCE_ANALYSIS.md`
- Comparison: `ARCHITECTURE_COMPARISON.md`
- Existing Tests: `tests/architecture/*.test.ts`

---

**Ready to start refactoring?** Begin with Phase 1 (StateManager) as it's the lowest risk and highest impact!
