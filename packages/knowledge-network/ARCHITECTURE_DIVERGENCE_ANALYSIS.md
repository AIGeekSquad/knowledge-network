# Architecture Divergence Analysis

## Executive Summary

The knowledge-network project has **good modular components** (LayoutEngine, RenderingSystem, ViewportManager) but the **main KnowledgeGraph class does NOT fully follow the intended architecture**. While it attempts to use modular components, there are still significant divergences from the documented design.

**Overall Status**: ⚠️ **PARTIALLY COMPLIANT** - Architecture exists but not fully utilized

---

## ✅ What's Working (Aligned with Architecture)

### 1. Modular Components Exist and Function Independently

✅ **LayoutEngine** (`src/layout/LayoutEngine.ts`)
- Pure calculation without DOM manipulation ✅
- Supports multiple algorithms (force-directed, hierarchical, circular, grid, radial)
- Event-driven architecture
- Returns LayoutResult with positioned nodes/edges
- **Status**: Fully compliant with design

✅ **RenderingSystem** (`src/rendering/RenderingSystem.ts`)
- Manages DOM operations separately ✅
- Supports multiple renderer types (SVG, Canvas placeholder, WebGL placeholder)
- Proper IRenderer interface for extensibility
- Handles highlighting, transforms, and updates
- **Status**: Fully compliant with design

✅ **ViewportManager** (`src/viewport/ViewportManager.ts`)
- Independent transformation management ✅
- Zoom, pan, fit operations
- D3 zoom behavior integration
- Coordinate conversion utilities
- **Status**: Fully compliant with design

### 2. Proper Separation of Concerns

The modular components demonstrate proper separation:

```typescript
// LayoutEngine: Pure calculation
calculateLayout(data: GraphData): Promise<LayoutResult>

// RenderingSystem: DOM operations
render(layout: LayoutResult, config: RenderConfig): void

// ViewportManager: Transformations
setTransform(transform: Transform): void
```

✅ Each module has a **single responsibility**  
✅ Modules work **independently**  
✅ Proper **interfaces** defined

---

## ❌ Where It Diverges (Violations)

### VIOLATION 1: KnowledgeGraph Still Does Some Direct Operations

**Expected (from docs)**:
> KnowledgeGraph should act as a pure **orchestrator**, delegating ALL operations to modular components.

**Actual Implementation Issues**:

1. **Edge Rendering Mixed with Layout**
   ```typescript
   // In KnowledgeGraph.ts - line 282
   private async renderEdges(): Promise<void> {
     // Edge renderer is separate but logic is in KnowledgeGraph
     await this.renderingSystem.setRenderer('svg');
     this.renderingSystem.render(this.layoutResult, {...});
   }
   ```
   ⚠️ **Issue**: Edge rendering logic is mixed into KnowledgeGraph instead of being purely handled by EdgeRenderer + RenderingSystem

2. **Node Selection Logic in Main Class**
   ```typescript
   // Lines 426-458 in KnowledgeGraph.ts
   selectNode(nodeId: string): void {
     const neighbors = this.getNeighbors(nodeId);
     // ... business logic here ...
     this.renderingSystem.highlightNodes([nodeId, ...neighbors]);
   }
   ```
   ⚠️ **Issue**: Selection logic should be in a separate SelectionManager module

3. **Configuration Transformation**
   ```typescript
   // Lines 109-123 in KnowledgeGraph.ts
   const layoutConfig: Partial<LayoutConfig> = {
     linkDistance: typeof this.config.linkDistance === 'function' ? 100 : this.config.linkDistance,
     // ... lots of conversion logic ...
   };
   ```
   ⚠️ **Issue**: Configuration adapter logic scattered in constructor instead of dedicated ConfigManager

### VIOLATION 2: EdgeRenderer Not Fully Integrated

**Expected**:
> EdgeRenderer should generate edge geometries as a separate phase between layout and rendering.

**Actual**:
```typescript
// KnowledgeGraph constructor - lines 141-145
if (this.config.edgeRenderer === 'bundled') {
  this.edgeRenderer = new EdgeBundling(this.config.edgeBundling);
} else {
  this.edgeRenderer = new SimpleEdge();
}
```

BUT the edge renderer is **initialized but never called directly**!

Looking at the renderEdges method:
```typescript
// Line 319 - Edge rendering happens via RenderingSystem
this.renderingSystem.render(this.layoutResult, {
  edgeConfig: {
    curveType: this.config.edgeRenderer === 'bundled' ? 'bundle' : 'straight',
  },
});
```

⚠️ **Issue**: EdgeRenderer (SimpleEdge/EdgeBundling) instances are created but not used in the rendering flow! The curve type is just passed as config.

### VIOLATION 3: Flow Sequence Not Strictly Enforced

**Expected Flow (from docs)**:
```
Layout → Edge Generation → Rendering → Viewport
```

**Actual Flow**:
```typescript
// In render() method - lines 274-289
async render(): Promise<void> {
  // Step 1: Layout
  this.layoutResult = await this.layoutEngine.calculateLayout(this.data);
  
  // Step 2: Edge Generation (partially)
  this.onLayoutComplete();
  
  // Step 3: Rendering (but edge generation is mixed in)
  if (!this.config.waitForStable) {
    await this.renderEdges(); // Edge rendering happens here
  }
}
```

⚠️ **Issues**:
- Edge generation is not a clear separate phase
- `renderEdges()` does both edge processing AND rendering
- No clear edge geometry generation before rendering

### VIOLATION 4: State Management Scattered

**Expected**: Centralized state management

**Actual**: State scattered across KnowledgeGraph:
```typescript
// Lines 56-60
private currentState: LayoutEngineState = LayoutEngineState.INITIAL;
private selectedNodeId: string | null = null;
private layoutResult: LayoutResult | null = null;
private edgeRenderResult: EdgeRenderResult | null = null;
```

⚠️ **Issue**: No StateManager module, state is mixed into orchestrator class

### VIOLATION 5: Configuration Handling Not Centralized

**Expected**: ConfigManager to handle all configuration

**Actual**: Configuration transformation scattered:
```typescript
// Constructor lines 69-98 - massive config merging
this.config = {
  width: config.width ?? 800,
  height: config.height ?? 600,
  // ... 30+ lines of defaults ...
};
```

Then more config transformation in initializeComponents():
```typescript
// Lines 109-123
const layoutConfig: Partial<LayoutConfig> = {
  linkDistance: typeof this.config.linkDistance === 'function' ? 100 : ...
  // More transformation logic
};
```

⚠️ **Issue**: No ConfigManager, configuration logic pollutes orchestrator

---

## 🔍 Detailed Comparison: Expected vs Actual

### Architecture Design (from docs)

```
KnowledgeGraph (Orchestrator)
├── LayoutEngine (Pure calculation) ✅ EXISTS
├── RenderingSystem (DOM manipulation) ✅ EXISTS  
├── ViewportManager (Transformations) ✅ EXISTS
├── EdgeRenderer (Edge processing) ⚠️ EXISTS BUT NOT USED
├── StateManager (State management) ❌ MISSING
└── ConfigManager (Configuration) ❌ MISSING
```

### Actual Implementation

```
KnowledgeGraph (Orchestrator + Business Logic)
├── LayoutEngine ✅ Used correctly
├── RenderingSystem ✅ Used correctly
├── ViewportManager ✅ Used correctly
├── EdgeRenderer ❌ Created but bypassed
├── State ❌ Managed in KnowledgeGraph directly
└── Config ❌ Transformed in KnowledgeGraph directly
```

---

## 📋 Compliance Matrix

| Component | Design Exists | Implemented | Used Correctly | Status |
|-----------|--------------|-------------|----------------|---------|
| LayoutEngine | ✅ | ✅ | ✅ | **COMPLIANT** |
| RenderingSystem | ✅ | ✅ | ✅ | **COMPLIANT** |
| ViewportManager | ✅ | ✅ | ✅ | **COMPLIANT** |
| EdgeRenderer | ✅ | ✅ | ❌ | **NOT USED** |
| StateManager | ✅ | ❌ | ❌ | **MISSING** |
| ConfigManager | ✅ | ❌ | ❌ | **MISSING** |
| SelectionManager | ✅ (implied) | ❌ | ❌ | **MISSING** |
| InteractionManager | ✅ | ⚠️ | ⚠️ | **EXISTS BUT UNUSED** |
| KnowledgeGraph Role | Orchestrator Only | Orchestrator + Logic | ❌ | **VIOLATES SRP** |

---

## 🎯 Specific Code Issues

### Issue 1: EdgeRenderer Instantiated But Never Called

**Location**: `KnowledgeGraph.ts:141-145, 319`

**Problem**:
```typescript
// EdgeRenderer is created
this.edgeRenderer = new EdgeBundling(this.config.edgeBundling);

// But never called! Instead:
this.renderingSystem.render(this.layoutResult, {
  edgeConfig: { curveType: 'bundle' } // Just passing a string!
});
```

**Expected**:
```typescript
// Should be:
const edgeGeometry = await this.edgeRenderer.generateEdges(this.layoutResult);
this.renderingSystem.render({
  ...this.layoutResult,
  edges: edgeGeometry
}, config);
```

### Issue 2: No Clear Edge Generation Phase

**Location**: `KnowledgeGraph.ts:282-343`

**Problem**: `renderEdges()` mixes edge generation and rendering

**Expected**: Separate methods:
```typescript
private async generateEdgeGeometry(): Promise<void> {
  this.edgeRenderResult = await this.edgeRenderer.render(
    this.layoutResult.edges,
    this.layoutResult.nodes
  );
}

private async renderScene(): Promise<void> {
  await this.renderingSystem.render({
    nodes: this.layoutResult.nodes,
    edges: this.edgeRenderResult.edges
  });
}
```

### Issue 3: State Management Not Modular

**Location**: `KnowledgeGraph.ts:56-60, 209-222`

**Problem**:
```typescript
// State scattered in KnowledgeGraph
private currentState: LayoutEngineState;
private selectedNodeId: string | null;

// State update logic mixed in
private updateState(state: LayoutEngineState, progress: number): void {
  this.currentState = state;
  if (this.config.onStateChange) {
    this.config.onStateChange(state, progress);
  }
}
```

**Expected**: StateManager module
```typescript
// Should have:
class StateManager {
  private state: GraphState;
  setState(state: GraphState): void;
  getState(): GraphState;
  subscribe(callback: StateCallback): void;
}
```

### Issue 4: Selection Logic Not Separated

**Location**: `KnowledgeGraph.ts:426-482`

**Problem**: 60 lines of selection logic in orchestrator

**Expected**: SelectionManager module
```typescript
class SelectionManager {
  selectNode(nodeId: string): void;
  selectNodes(nodeIds: string[]): void;
  clearSelection(): void;
  getSelection(): Selection;
}
```

---

## 🔧 Required Fixes

### Priority 1 (Critical): Properly Use EdgeRenderer

1. **Make EdgeRenderer actually generate geometry**
   ```typescript
   // In render() after layout:
   if (this.edgeRenderer && this.layoutResult) {
     this.edgeRenderResult = await this.edgeRenderer.render(
       this.layoutResult.edges,
       this.layoutResult.nodes
     );
   }
   ```

2. **Pass edge geometry to RenderingSystem**
   ```typescript
   this.renderingSystem.render({
     nodes: this.layoutResult.nodes,
     edges: this.edgeRenderResult.edges // Use generated geometry!
   });
   ```

### Priority 2 (High): Extract State Management

1. **Create StateManager module**
   ```typescript
   // src/state/StateManager.ts
   export class StateManager extends EventEmitter {
     private state: GraphState;
     private selection: SelectionState;
     
     setState(state: GraphState): void { ... }
     setSelection(selection: SelectionState): void { ... }
   }
   ```

2. **Move state from KnowledgeGraph**
   ```typescript
   class KnowledgeGraph {
     private stateManager: StateManager;
     
     constructor() {
       this.stateManager = new StateManager();
     }
   }
   ```

### Priority 3 (High): Extract Configuration Management

1. **Create ConfigManager module**
   ```typescript
   // src/core/ConfigManager.ts
   export class ConfigManager {
     private config: ResolvedConfig;
     
     constructor(userConfig: Partial<GraphConfig>) {
       this.config = this.resolveConfig(userConfig);
     }
     
     getLayoutConfig(): LayoutConfig { ... }
     getRenderConfig(): RenderConfig { ... }
     getViewportConfig(): ViewportConfig { ... }
   }
   ```

2. **Use ConfigManager in KnowledgeGraph**
   ```typescript
   class KnowledgeGraph {
     private configManager: ConfigManager;
     
     constructor(container, data, config) {
       this.configManager = new ConfigManager(config);
       this.layoutEngine = new LayoutEngine(
         'force-directed',
         this.configManager.getLayoutConfig()
       );
     }
   }
   ```

### Priority 4 (Medium): Extract Selection Logic

1. **Create SelectionManager**
   ```typescript
   // src/interaction/SelectionManager.ts
   export class SelectionManager extends EventEmitter {
     selectNode(nodeId: string, data: GraphData): SelectionResult {
       const neighbors = this.findNeighbors(nodeId, data);
       const edges = this.findConnectedEdges(nodeId, data);
       return { nodeId, neighbors, edges };
     }
   }
   ```

2. **Use in KnowledgeGraph**
   ```typescript
   selectNode(nodeId: string): void {
     const selection = this.selectionManager.selectNode(nodeId, this.data);
     this.renderingSystem.highlightNodes(selection.nodes);
     this.renderingSystem.highlightEdges(selection.edges);
   }
   ```

### Priority 5 (Medium): Enforce Flow Sequence

1. **Make phases explicit**
   ```typescript
   async render(): Promise<void> {
     // Phase 1: Layout
     await this.phaseLayout();
     
     // Phase 2: Edge Generation
     await this.phaseEdgeGeneration();
     
     // Phase 3: Rendering
     await this.phaseRendering();
     
     // Phase 4: Viewport Setup
     await this.phaseViewport();
   }
   ```

---

## 📊 Metrics

### Code Organization Metrics

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Lines in KnowledgeGraph | 540 | <200 | ❌ 270% over |
| Number of modules | 6 | 10 | ⚠️ Missing 4 |
| Single Responsibility | No | Yes | ❌ Violation |
| EdgeRenderer usage | 0% | 100% | ❌ Not used |
| State centralization | 0% | 100% | ❌ Scattered |
| Config centralization | 0% | 100% | ❌ Scattered |

### Architecture Compliance

| Category | Score | Details |
|----------|-------|---------|
| Modular Design | 60% | 3/5 core modules used properly |
| Separation of Concerns | 50% | Some mixing of responsibilities |
| Flow Sequence | 70% | Generally correct but not enforced |
| Extensibility | 80% | Good interfaces but not fully used |
| **Overall** | **65%** | **Partially compliant** |

---

## 🎓 Summary of Divergences

### Major Violations (Must Fix)

1. ❌ **EdgeRenderer not used** - Created but bypassed in favor of config strings
2. ❌ **No StateManager** - State scattered in KnowledgeGraph
3. ❌ **No ConfigManager** - Config transformation pollutes orchestrator
4. ❌ **No SelectionManager** - Selection logic mixed in KnowledgeGraph
5. ❌ **Flow not explicit** - Phases mixed together instead of clear sequence

### Minor Issues (Should Fix)

1. ⚠️ InteractionManager exists but not referenced in KnowledgeGraph
2. ⚠️ Edge generation not a clear separate phase
3. ⚠️ Too much logic in KnowledgeGraph class (540 lines → should be <200)

### What's Working Well

1. ✅ LayoutEngine properly separated and used
2. ✅ RenderingSystem properly separated and used
3. ✅ ViewportManager properly separated and used
4. ✅ Modular components work independently
5. ✅ Good interfaces and event-driven design

---

## 🚀 Recommended Action Plan

### Phase 1: Fix EdgeRenderer Integration (1-2 days)
- Make EdgeRenderer actually generate geometry
- Pass geometry to RenderingSystem
- Remove edge type string passing

### Phase 2: Extract State Management (2-3 days)
- Create StateManager module
- Move state from KnowledgeGraph
- Add state subscriptions

### Phase 3: Extract Configuration (2-3 days)
- Create ConfigManager module
- Move config transformation logic
- Provide config adapters for each module

### Phase 4: Extract Selection Logic (1-2 days)
- Create SelectionManager module
- Move selection logic from KnowledgeGraph
- Integrate with InteractionManager

### Phase 5: Enforce Flow Sequence (1 day)
- Create explicit phase methods
- Document and validate flow
- Add flow enforcement tests

**Total Estimated Effort**: 7-11 days

---

## 📚 References

- Architecture docs: `tests/architecture/README.md`
- Test summary: `tests/architecture/SUMMARY.md`
- Current violations: `tests/architecture/violation-detection.test.ts`

---

**Conclusion**: The knowledge-network has a solid modular foundation but KnowledgeGraph needs significant refactoring to truly act as a pure orchestrator. The main issues are: unused EdgeRenderer, missing StateManager/ConfigManager, and scattered business logic.
