# Demo Development Guide

**Creating New Demo Modules for the Knowledge Network Demo Suite**

📚 **Architecture Overview**: [Demo Suite Specification](./DEMO_SUITE_SPECIFICATION.md)
🎮 **Live Examples**: [Demo Suite](../packages/demo-suite/README.md)
🏆 **Competitive Features**: [Competitive Showcase](./COMPETITIVE_SHOWCASE.md)

---

## Overview

The Knowledge Network Demo Suite uses an interactive exploration architecture where users dynamically switch between rendering modes, layout algorithms, and rich datasets to discover optimal configurations. This guide provides comprehensive instructions for creating interactive components and rich datasets that maintain quality standards and Xbox gaming aesthetic consistency.

---

## Module Architecture

### DemoModule Interface

All demo modules implement the standardized interface:

```typescript
interface DemoModule {
  // Module identity
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;

  // Showcase capabilities
  capabilities: string[];
  competitiveAdvantages: string[];

  // Lifecycle methods
  initialize(container: HTMLElement): Promise<void>;
  render(): Promise<void>;
  cleanup(): void;

  // Configuration and examples
  getConfigurationOptions(): ConfigOption[];
  getCodeExamples(): CodeExample[];
}
```

### Module Structure Template

```
src/modules/your-module/
├── index.ts              # Main module export
├── YourDemoModule.ts     # Module implementation
├── components/           # Module-specific UI components
│   ├── ControlPanel.ts
│   └── MetricsDisplay.ts
├── data/                 # Module-specific datasets
│   └── demo-data.ts
├── styles/               # Module-specific styling
│   └── module.css
├── README.md             # Module documentation
└── __tests__/            # Module tests
    ├── module.test.ts
    └── integration.test.ts
```

---

## Creating a New Demo Module

### Step 1: Module Planning

**Define Module Purpose:**
1. **What capability does this showcase?** (GPU performance, semantic AI, etc.)
2. **What competitive advantage does it demonstrate?** (vs D3.js, Cytoscape, etc.)
3. **Who is the primary audience?** (developers, evaluators, enterprise users)
4. **How long should the demonstration take?** (2-3 min beginner, 10+ min advanced)

**Example Module Concept:**
```typescript
// Real-time Graph Updates Demo
const moduleSpec = {
  purpose: 'Showcase real-time data streaming and dynamic graph updates',
  competitiveAdvantage: 'Efficient incremental updates vs full re-render approaches',
  audience: 'developers building live dashboards and monitoring systems',
  estimatedTime: '5-7 minutes',
  difficulty: 'intermediate'
};
```

### Step 2: Module Implementation

**Create Module Class:**
```typescript
// src/modules/real-time-updates/RealTimeUpdatesDemo.ts
import { DemoModule, ConfigOption, CodeExample } from '../../shared/DemoModule';
import { KnowledgeGraph, GraphData } from '@aigeeksquad/knowledge-network';
import { PerformanceMonitor } from '../../shared/PerformanceMonitor';
import { DataGenerator } from '../../shared/DataGenerator';

export class RealTimeUpdatesDemo implements DemoModule {
  // Module identity
  readonly id = 'real-time-updates';
  readonly title = 'Real-Time Graph Updates';
  readonly description = 'Demonstrates efficient streaming data visualization with incremental graph updates';
  readonly difficulty = 'intermediate' as const;
  readonly estimatedTime = '5-7 minutes';

  // Showcase focus
  readonly capabilities = [
    'Incremental data updates',
    'Streaming visualization',
    'Animation optimization',
    'State management'
  ];

  readonly competitiveAdvantages = [
    'Efficient updates vs full re-render (D3.js)',
    'Smooth animations during data changes',
    'Maintains user interaction state during updates'
  ];

  // Module state
  private graph: KnowledgeGraph | null = null;
  private container: HTMLElement | null = null;
  private performanceMonitor: PerformanceMonitor | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  async initialize(container: HTMLElement): Promise<void> {
    this.container = container;

    // Setup module UI
    this.createModuleInterface();

    // Initialize performance monitoring
    this.performanceMonitor = new PerformanceMonitor(container);

    // Create initial graph
    const initialData = DataGenerator.generateStreamingData(50, 75);
    this.graph = new KnowledgeGraph(container, initialData, {
      edgeRenderer: 'bundled',
      nodeRadius: 8,
      nodeFill: (node) => this.getNodeColor(node),
      onUpdateComplete: () => {
        this.performanceMonitor?.recordUpdate();
      }
    });
  }

  async render(): Promise<void> {
    if (!this.graph) return;

    await this.graph.render();
    this.startDataStreaming();
  }

  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.graph?.destroy();
    this.performanceMonitor?.cleanup();
  }

  getConfigurationOptions(): ConfigOption[] {
    return [
      {
        id: 'updateFrequency',
        label: 'Update Frequency',
        type: 'slider',
        min: 100,
        max: 2000,
        default: 500,
        description: 'Milliseconds between data updates'
      },
      {
        id: 'batchSize',
        label: 'Update Batch Size',
        type: 'slider',
        min: 1,
        max: 20,
        default: 5,
        description: 'Number of nodes to update per batch'
      }
    ];
  }

  getCodeExamples(): CodeExample[] {
    return [
      {
        title: 'Basic Streaming Updates',
        language: 'typescript',
        code: `
import { KnowledgeGraph } from '@aigeeksquad/knowledge-network';

const graph = new KnowledgeGraph(container, initialData, {
  onUpdateComplete: () => console.log('Update complete')
});

// Efficient incremental update
const newNodes = [{ id: 'new-1', label: 'New Node' }];
const newEdges = [{ source: 'existing', target: 'new-1' }];

await graph.updateData({
  nodes: [...graph.getData().nodes, ...newNodes],
  edges: [...graph.getData().edges, ...newEdges]
});
        `
      }
    ];
  }

  private createModuleInterface(): void {
    // Create module-specific controls and displays
  }

  private startDataStreaming(): void {
    // Implement streaming data simulation
  }

  private getNodeColor(node: any): string {
    // Dynamic node coloring based on data recency
    return node.metadata?.isNew ? '#e74c3c' : '#3498db';
  }
}
```

### Step 3: Module Registration

**Add to Module Registry:**
```typescript
// src/shared/ModuleRegistry.ts
import { RealTimeUpdatesDemo } from '../modules/real-time-updates/RealTimeUpdatesDemo';

export const demoModules = {
  // Existing modules...
  'real-time-updates': new RealTimeUpdatesDemo()
};
```

**Add Navigation Entry:**
```typescript
// src/router/NavigationConfig.ts
export const moduleNavigation = [
  // Existing entries...
  {
    id: 'real-time-updates',
    title: 'Real-Time Updates',
    path: '/real-time-updates',
    difficulty: 'intermediate',
    estimatedTime: '5-7 minutes',
    category: 'dynamic-data'
  }
];
```

---

## Development Standards

### Code Quality Requirements

**TypeScript Standards:**
- **Strict Mode**: All modules must compile with TypeScript strict mode
- **Type Coverage**: 100% type coverage with no `any` types except D3 interop
- **Interface Compliance**: All modules must implement DemoModule interface completely
- **Documentation**: Comprehensive JSDoc comments with examples and cross-references

**Performance Standards:**
- **Initialization**: Module initialization must complete within 2 seconds
- **Responsiveness**: User interactions must respond within 100ms
- **Memory Management**: Proper cleanup in module destruction
- **Animation**: All animations must maintain 60fps on target hardware

**Accessibility Standards:**
- **WCAG Compliance**: All modules must meet WCAG AA standards minimum
- **Keyboard Navigation**: Full functionality available via keyboard
- **Screen Reader**: Proper ARIA labels and live region announcements
- **Reduced Motion**: Animation controls for vestibular sensitivity

### Testing Requirements

**Unit Tests:**
```typescript
// src/modules/your-module/__tests__/module.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { YourDemoModule } from '../YourDemoModule';

describe('YourDemoModule', () => {
  let module: YourDemoModule;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    module = new YourDemoModule();
  });

  afterEach(() => {
    module.cleanup();
  });

  it('should initialize correctly', async () => {
    await module.initialize(container);
    expect(module.id).toBe('your-module');
  });

  it('should render without errors', async () => {
    await module.initialize(container);
    await expect(module.render()).resolves.not.toThrow();
  });
});
```

**Integration Tests:**
```typescript
// src/modules/your-module/__tests__/integration.test.ts
import { test, expect } from '@playwright/test';

test('Your Module Full User Journey', async ({ page }) => {
  await page.goto('/your-module');

  // Wait for module to initialize
  await page.waitForSelector('[data-testid="module-ready"]');

  // Test key interactions
  await page.click('[data-testid="primary-action"]');
  await expect(page.locator('[data-testid="result"]')).toBeVisible();

  // Test performance requirements
  const performanceEntry = await page.evaluate(() => {
    return performance.now();
  });
  expect(performanceEntry).toBeLessThan(100); // 100ms response requirement
});
```

---

## Shared Infrastructure Usage

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '../../shared/PerformanceMonitor';

// In your module
private performanceMonitor: PerformanceMonitor;

async initialize(container: HTMLElement): Promise<void> {
  this.performanceMonitor = new PerformanceMonitor(container, {
    showFPS: true,
    showMemory: true,
    showRenderTime: true
  });
}

// Record custom metrics
this.performanceMonitor.recordMetric('customOperation', operationTime);
```

### Data Generation

```typescript
import { DataGenerator } from '../../shared/DataGenerator';

// Generate data for your demonstration
const demoData = DataGenerator.generateSemanticNetwork('technology', 200, {
  clusterCount: 5,
  embeddingDimensions: 384,
  similarityThreshold: 0.7
});

const performanceData = DataGenerator.generateScaleFreeNetwork(1000, {
  gamma: 2.1, // Power-law exponent
  minDegree: 1,
  maxDegree: 50
});
```

### UI Components

```typescript
import { Button, Slider, MetricsPanel } from '../../shared/UIComponents';

// Use consistent UI components
const controlPanel = new Button({
  label: 'Start Demo',
  onClick: () => this.startDemonstration(),
  variant: 'primary'
});

const configSlider = new Slider({
  label: 'Node Count',
  min: 100,
  max: 1000,
  value: 500,
  onChange: (value) => this.updateNodeCount(value)
});
```

---

## Module Categories

### Performance-Focused Modules

**Purpose**: Demonstrate speed, scalability, and optimization
**Key Requirements**:
- Real-time performance metrics display
- Competitive benchmark comparisons
- Scalability demonstrations with large datasets
- Memory efficiency showcases

**Examples**: GPU rendering, spatial indexing, large graph handling

### Feature-Focused Modules

**Purpose**: Showcase unique capabilities and competitive advantages
**Key Requirements**:
- Clear before/after comparisons
- Interactive parameter adjustment
- Live configuration changes with immediate feedback
- Integration examples for practical usage

**Examples**: Semantic AI clustering, edge bundling, mobile interactions

### Developer-Focused Modules

**Purpose**: Demonstrate ease of integration and customization
**Key Requirements**:
- Live code editors with working examples
- Framework integration patterns
- Copy-paste code samples
- Interactive configuration playgrounds

**Examples**: TypeScript integration, framework examples, API playground

---

## Quality Assurance Guidelines

### Code Review Checklist

**Architecture Compliance:**
- [ ] Implements DemoModule interface completely
- [ ] Follows modular "bricks and studs" design principles
- [ ] Uses shared infrastructure appropriately
- [ ] Maintains independence from other modules

**Performance Standards:**
- [ ] Initializes within 2 seconds
- [ ] Responds to interactions within 100ms
- [ ] Maintains 60fps animations
- [ ] Cleans up resources properly on destruction

**User Experience:**
- [ ] Clear demonstration purpose and competitive advantage
- [ ] Progressive complexity appropriate for target difficulty level
- [ ] Consistent styling and interaction patterns
- [ ] Accessible via keyboard and screen reader

**Documentation Quality:**
- [ ] Comprehensive README with setup and usage instructions
- [ ] Code examples work when copy-pasted
- [ ] Competitive advantages are measured and documented
- [ ] Integration guidance clear and actionable

### Testing Standards

**Unit Test Coverage:**
- **Minimum**: 80% code coverage for module logic
- **Focus Areas**: Initialization, rendering, cleanup, configuration handling
- **Edge Cases**: Error conditions, invalid inputs, resource constraints

**Integration Test Coverage:**
- **User Journeys**: Complete module experience from load to completion
- **Performance Validation**: Response times and resource usage within requirements
- **Cross-Browser**: Functionality validation across all supported browsers
- **Accessibility**: Screen reader, keyboard navigation, and WCAG compliance

---

## Best Practices

### Module Design Patterns

**Single Responsibility:**
Each module should demonstrate one primary capability clearly rather than trying to showcase multiple complex features simultaneously.

**Progressive Disclosure:**
Start with the most impressive demonstration, then provide controls for users to explore configuration options and technical details.

**Competitive Context:**
Always provide context about how this capability compares to other libraries - quantified advantages are more compelling than feature lists.

### Performance Optimization

**Efficient Resource Usage:**
- Use shared data generators rather than creating custom datasets
- Leverage shared UI components for consistency and efficiency
- Implement proper cleanup to prevent memory leaks during module switching

**Responsive Performance:**
- Adapt demonstration complexity based on device capabilities
- Provide quality/performance trade-off controls for user preference
- Implement efficient update strategies for real-time demonstrations

### User Experience Excellence

**Clear Value Proposition:**
- Explain what capability is being demonstrated within first 10 seconds
- Show the most impressive result first, then explain how it works
- Provide clear competitive context ("This is 10x faster than X library")

**Interactive Learning:**
- Enable users to adjust parameters and see immediate results
- Provide guided exploration with suggested interaction sequences
- Include "Try This" suggestions that highlight key capabilities

---

## Module Examples

### Beginner Module Example

**Simple Renderer Toggle:**
```typescript
export class RendererToggleDemo implements DemoModule {
  readonly id = 'renderer-toggle';
  readonly title = 'SVG vs Canvas Rendering';
  readonly difficulty = 'beginner';
  readonly estimatedTime = '2-3 minutes';

  readonly capabilities = ['Multi-renderer support', 'Performance comparison'];
  readonly competitiveAdvantages = [
    'Only library with seamless renderer switching',
    'No performance penalty for renderer changes'
  ];

  async initialize(container: HTMLElement): Promise<void> {
    // Create side-by-side comparison with same data
    this.setupSplitView(container);
    this.createToggleControls();
  }

  async render(): Promise<void> {
    // Render same graph with different renderers
    await this.renderComparison();
  }
}
```

### Advanced Module Example

**Live Configuration Playground:**
```typescript
export class ConfigurationPlaygroundDemo implements DemoModule {
  readonly id = 'config-playground';
  readonly title = 'Interactive Configuration';
  readonly difficulty = 'advanced';
  readonly estimatedTime = '10-15 minutes';

  readonly capabilities = [
    'Real-time configuration',
    'TypeScript IntelliSense',
    'Framework integration'
  ];

  async initialize(container: HTMLElement): Promise<void> {
    // Setup Monaco editor with TypeScript support
    this.setupCodeEditor();

    // Create live preview panel
    this.setupPreviewPanel();

    // Connect editor changes to live preview
    this.connectEditorToPreview();
  }
}
```

---

## Integration with Shared Infrastructure

### Navigation Integration

**Register Module Route:**
```typescript
// Module automatically registered via ModuleRegistry
export const moduleConfig = {
  route: '/your-module',
  title: 'Your Module Name',
  category: 'performance' | 'features' | 'developer-experience'
};
```

### Performance Monitoring Integration

**Built-in Metrics:**
```typescript
// Performance monitoring is automatically available
this.performanceMonitor.startRecording();

// Custom metrics
this.performanceMonitor.recordMetric('customOperation', {
  duration: operationTime,
  nodeCount: currentNodeCount,
  success: operationSucceeded
});

this.performanceMonitor.stopRecording();
```

### Data Generation Integration

**Predefined Datasets:**
```typescript
// Use shared data generators
const data = DataGenerator.generateForModule('your-module', {
  nodeCount: 500,
  complexity: 'medium',
  features: ['semantic-metadata', 'performance-optimized']
});
```

---

## Deployment and Testing

### Local Development

```bash
# Start development server
pnpm dev

# Run module-specific tests
pnpm test:module your-module

# Test accessibility compliance
pnpm test:a11y your-module

# Performance regression testing
pnpm test:perf your-module
```

### Quality Gates

**Before Module Acceptance:**
1. **Functionality**: All DemoModule interface methods implemented correctly
2. **Performance**: Meets response time and resource usage requirements
3. **Testing**: Unit and integration tests passing with required coverage
4. **Documentation**: README, code examples, and competitive advantages documented
5. **Accessibility**: WCAG compliance validated with assistive technology testing

**Continuous Integration:**
- **Automated Testing**: All tests run on every commit with performance regression detection
- **Cross-Browser Testing**: Automatic validation across all supported browser environments
- **Accessibility Testing**: Automated axe-core compliance checking with manual validation
- **Performance Monitoring**: Benchmark results tracked and compared over time

---

## Contributing Guidelines

### Module Contribution Process

1. **Propose Module Concept**: Create issue with module specification and competitive advantage
2. **Design Review**: Architecture review with demo suite maintainers
3. **Implementation**: Follow development standards and testing requirements
4. **Quality Review**: Code review focusing on performance, accessibility, and user experience
5. **Integration Testing**: Validation within complete demo suite context
6. **Documentation Review**: Ensure clear explanation and working examples
7. **Deployment**: Integration into main demo suite with appropriate promotion

### Community Module Standards

**Innovation Focus:**
Modules should demonstrate innovative capabilities or significant competitive advantages rather than duplicating existing demonstrations.

**Quality Excellence:**
Community modules must meet the same quality standards as core modules - no exceptions for performance, accessibility, or documentation requirements.

**Educational Value:**
Each module should teach users something valuable about graph visualization or the specific capabilities being demonstrated.

---

## Future Evolution

### Extensibility Framework

**Plugin Architecture:**
The DemoModule interface enables community contributions and third-party extensions while maintaining quality and consistency standards.

**Competitive Tracking:**
As other libraries evolve, new modules can be created to demonstrate continued competitive advantages and new capability areas.

**Technology Integration:**
New web technologies (WebGPU, WebAssembly, etc.) can be integrated through new modules without affecting the core architecture.

---

**This development guide ensures all demo modules maintain the world-class quality standards that position the Knowledge Network Demo Suite as the most comprehensive library demonstration platform available.**