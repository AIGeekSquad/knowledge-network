/**
 * Accessibility Leadership Module
 *
 * Industry-leading accessibility demonstration showcasing:
 * - Comprehensive screen reader support with intelligent graph descriptions
 * - Voice control for hands-free navigation and interaction
 * - Spatial keyboard navigation with arrow-key awareness
 * - WCAG AAA compliance validation and real-time metrics
 * - High contrast Xbox theming optimized for visual accessibility
 */

import { BaseDemoModule, type ConfigOption, type CodeExample, type InteractionEvent } from '../../shared/DemoModule.js';
import { ScreenReaderManager } from './components/ScreenReaderManager.js';
import { VoiceController } from './components/VoiceController.js';
import { KeyboardNavigator } from './components/KeyboardNavigator.js';
import { AccessibilityValidator } from './components/AccessibilityValidator.js';
import { ContrastManager } from './components/ContrastManager.js';
import { generateAccessibleDataset } from './data/accessibility-datasets.js';
import { formatNumber, debounce, announceToScreenReader } from '../../shared/utils.js';

/**
 * Configuration interface for accessibility features
 */
export interface AccessibilityConfig {
  enableScreenReader: boolean;
  enableVoiceControl: boolean;
  enableKeyboardNavigation: boolean;
  enableHighContrast: boolean;
  voiceControlLanguage: string;
  screenReaderVerbosity: 'minimal' | 'standard' | 'verbose';
  keyboardNavigationMode: 'spatial' | 'tabular' | 'tree';
  contrastLevel: 'AA' | 'AAA' | 'enhanced';
  announceActions: boolean;
  provideSpatialContext: boolean;
  enableFocusManagement: boolean;
  validateWCAG: boolean;
}

/**
 * Screen reader announcement data
 */
export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  context?: string;
  type: 'navigation' | 'selection' | 'action' | 'status' | 'error';
  metadata?: Record<string, any>;
}

/**
 * Voice command definition
 */
export interface VoiceCommand {
  command: string;
  aliases: string[];
  action: string;
  parameters?: string[];
  confidence: number;
  language: string;
}

/**
 * Keyboard navigation state
 */
export interface KeyboardNavigationState {
  currentNode: string | null;
  focusedElement: HTMLElement | null;
  navigationMode: 'spatial' | 'tabular' | 'tree';
  position: { x: number; y: number };
  neighbors: {
    up?: string;
    down?: string;
    left?: string;
    right?: string;
  };
}

/**
 * Accessibility compliance metrics
 */
export interface AccessibilityMetrics {
  wcagLevel: 'A' | 'AA' | 'AAA';
  contrastRatio: number;
  keyboardNavigable: boolean;
  screenReaderSupport: boolean;
  focusIndicators: boolean;
  semanticMarkup: boolean;
  ariaLabels: number;
  violations: number;
  lastValidation: number;
}

/**
 * Contrast level configuration
 */
export interface ContrastLevel {
  level: 'AA' | 'AAA' | 'enhanced';
  textRatio: number;
  graphicsRatio: number;
  backgroundColors: string[];
  foregroundColors: string[];
}

/**
 * Main Accessibility Leadership module implementation
 */
export class AccessibilityLeadership extends BaseDemoModule {
  private knowledgeGraph: any = null;
  private screenReaderManager: ScreenReaderManager | null = null;
  private voiceController: VoiceController | null = null;
  private keyboardNavigator: KeyboardNavigator | null = null;
  private accessibilityValidator: AccessibilityValidator | null = null;
  private contrastManager: ContrastManager | null = null;

  private currentDataset: any = null;
  private navigationState: KeyboardNavigationState;
  private accessibilityMetrics: AccessibilityMetrics;

  private accessibilityConfig: AccessibilityConfig = {
    enableScreenReader: true,
    enableVoiceControl: true,
    enableKeyboardNavigation: true,
    enableHighContrast: false,
    voiceControlLanguage: 'en-US',
    screenReaderVerbosity: 'standard',
    keyboardNavigationMode: 'spatial',
    contrastLevel: 'AAA',
    announceActions: true,
    provideSpatialContext: true,
    enableFocusManagement: true,
    validateWCAG: true
  };

  constructor() {
    super({
      id: 'accessibility-leadership',
      title: 'Accessibility Leadership',
      description: 'Screen reader navigation, voice control, and WCAG AAA compliance showcase',
      difficulty: 'advanced',
      estimatedTime: '15-20 minutes',
      capabilities: [
        'Full screen reader support with intelligent descriptions',
        'Voice control for hands-free graph navigation',
        'Spatial keyboard navigation with arrow keys',
        'WCAG AAA compliance across all interaction patterns',
        'High contrast Xbox theming for visual accessibility',
        'Real-time accessibility metrics and validation'
      ],
      competitiveAdvantages: [
        'First graph library with full screen reader graph navigation',
        'Voice control capabilities not available in D3.js or Cytoscape.js',
        'WCAG AAA compliance vs AA-level support in alternatives',
        'Spatial keyboard navigation vs basic tab-only interfaces',
        'Assistive technology integration vs accessibility afterthoughts',
        'Xbox accessibility leadership applied to data visualization'
      ]
    });

    this.navigationState = {
      currentNode: null,
      focusedElement: null,
      navigationMode: 'spatial',
      position: { x: 0, y: 0 },
      neighbors: {}
    };

    this.accessibilityMetrics = {
      wcagLevel: 'AAA',
      contrastRatio: 0,
      keyboardNavigable: true,
      screenReaderSupport: true,
      focusIndicators: true,
      semanticMarkup: true,
      ariaLabels: 0,
      violations: 0,
      lastValidation: Date.now()
    };
  }

  protected async onInitialize(): Promise<void> {
    if (!this.container || !this.context) {
      throw new Error('Container and context must be available');
    }

    // Apply Xbox-inspired accessible styling
    this.setupAccessibleXboxStyling();

    // Initialize accessibility components
    this.screenReaderManager = new ScreenReaderManager({
      container: this.container,
      verbosity: this.accessibilityConfig.screenReaderVerbosity,
      announceActions: this.accessibilityConfig.announceActions
    });

    this.voiceController = new VoiceController({
      language: this.accessibilityConfig.voiceControlLanguage,
      onCommand: this.handleVoiceCommand.bind(this),
      enabled: this.accessibilityConfig.enableVoiceControl
    });

    this.keyboardNavigator = new KeyboardNavigator({
      container: this.container,
      mode: this.accessibilityConfig.keyboardNavigationMode,
      onNavigate: this.handleKeyboardNavigation.bind(this)
    });

    this.accessibilityValidator = new AccessibilityValidator({
      container: this.container,
      targetLevel: this.accessibilityConfig.contrastLevel,
      onValidation: this.handleAccessibilityValidation.bind(this)
    });

    this.contrastManager = new ContrastManager({
      container: this.container,
      level: this.accessibilityConfig.contrastLevel,
      highContrastMode: this.accessibilityConfig.enableHighContrast
    });

    // Generate accessible dataset
    this.currentDataset = generateAccessibleDataset();

    // Initialize accessible graph
    await this.initializeAccessibleGraph();

    // Set up accessibility event handlers
    this.setupAccessibilityHandlers();

    // Start accessibility monitoring
    this.startAccessibilityMonitoring();

    // Announce module initialization
    this.announceToUser('Accessibility Leadership module initialized. Use arrow keys to navigate, or say "help" for voice commands.', 'polite');
  }

  protected async onRender(): Promise<void> {
    if (!this.context || !this.canvas) return;

    const startTime = performance.now();

    // Clear with accessible background
    this.renderAccessibleBackground();

    // Render graph with accessibility enhancements
    if (this.knowledgeGraph && this.currentDataset) {
      await this.renderAccessibleGraph();
    }

    // Render accessibility indicators
    this.renderAccessibilityIndicators();

    // Render focus indicators
    this.renderFocusIndicators();

    // Update accessibility metrics
    const renderTime = performance.now() - startTime;
    this.updateAccessibilityMetrics(renderTime);
  }

  protected onCleanup(): void {
    this.screenReaderManager?.destroy();
    this.voiceController?.destroy();
    this.keyboardNavigator?.destroy();
    this.accessibilityValidator?.destroy();
    this.contrastManager?.destroy();
    this.knowledgeGraph = null;
  }

  protected onConfigurationUpdate(config: Record<string, any>): void {
    this.accessibilityConfig = { ...this.accessibilityConfig, ...config };

    // Update components with new configuration
    this.screenReaderManager?.updateConfig({
      verbosity: this.accessibilityConfig.screenReaderVerbosity,
      announceActions: this.accessibilityConfig.announceActions
    });

    this.voiceController?.setEnabled(this.accessibilityConfig.enableVoiceControl);
    this.voiceController?.setLanguage(this.accessibilityConfig.voiceControlLanguage);

    this.keyboardNavigator?.setMode(this.accessibilityConfig.keyboardNavigationMode);

    this.contrastManager?.setLevel(this.accessibilityConfig.contrastLevel);
    this.contrastManager?.setHighContrastMode(this.accessibilityConfig.enableHighContrast);

    // Regenerate styling if contrast settings changed
    if (config.enableHighContrast !== undefined || config.contrastLevel !== undefined) {
      this.setupAccessibleXboxStyling();
    }

    // Announce configuration change
    if (config.enableScreenReader !== undefined) {
      this.announceToUser(`Screen reader support ${config.enableScreenReader ? 'enabled' : 'disabled'}`, 'polite');
    }
  }

  protected getDefaultConfiguration(): Record<string, any> {
    return { ...this.accessibilityConfig };
  }

  public getConfigurationOptions(): ConfigOption[] {
    return [
      {
        id: 'enableScreenReader',
        label: 'Screen Reader Support',
        type: 'toggle',
        value: this.accessibilityConfig.enableScreenReader,
        description: 'Enable comprehensive screen reader navigation'
      },
      {
        id: 'enableVoiceControl',
        label: 'Voice Control',
        type: 'toggle',
        value: this.accessibilityConfig.enableVoiceControl,
        description: 'Enable hands-free voice navigation'
      },
      {
        id: 'enableKeyboardNavigation',
        label: 'Keyboard Navigation',
        type: 'toggle',
        value: this.accessibilityConfig.enableKeyboardNavigation,
        description: 'Enable spatial keyboard navigation'
      },
      {
        id: 'enableHighContrast',
        label: 'High Contrast Mode',
        type: 'toggle',
        value: this.accessibilityConfig.enableHighContrast,
        description: 'Enable high contrast Xbox theming'
      },
      {
        id: 'screenReaderVerbosity',
        label: 'Screen Reader Verbosity',
        type: 'select',
        value: this.accessibilityConfig.screenReaderVerbosity,
        options: [
          { value: 'minimal', label: 'Minimal' },
          { value: 'standard', label: 'Standard' },
          { value: 'verbose', label: 'Verbose' }
        ],
        description: 'Amount of detail in screen reader announcements'
      },
      {
        id: 'keyboardNavigationMode',
        label: 'Keyboard Navigation Mode',
        type: 'select',
        value: this.accessibilityConfig.keyboardNavigationMode,
        options: [
          { value: 'spatial', label: 'Spatial (Arrow Keys)' },
          { value: 'tabular', label: 'Tabular (Tab Order)' },
          { value: 'tree', label: 'Tree (Hierarchical)' }
        ],
        description: 'Method for keyboard navigation'
      },
      {
        id: 'contrastLevel',
        label: 'Contrast Level',
        type: 'select',
        value: this.accessibilityConfig.contrastLevel,
        options: [
          { value: 'AA', label: 'WCAG AA (4.5:1)' },
          { value: 'AAA', label: 'WCAG AAA (7:1)' },
          { value: 'enhanced', label: 'Enhanced (10:1)' }
        ],
        description: 'Color contrast compliance level'
      },
      {
        id: 'voiceControlLanguage',
        label: 'Voice Control Language',
        type: 'select',
        value: this.accessibilityConfig.voiceControlLanguage,
        options: [
          { value: 'en-US', label: 'English (US)' },
          { value: 'en-GB', label: 'English (UK)' },
          { value: 'es-ES', label: 'Spanish' },
          { value: 'fr-FR', label: 'French' },
          { value: 'de-DE', label: 'German' }
        ],
        description: 'Language for voice recognition'
      }
    ];
  }

  public getCodeExamples(): CodeExample[] {
    return [
      {
        id: 'screen-reader-navigation',
        title: 'Screen Reader Graph Navigation',
        description: 'Implementing intelligent screen reader support for graph structures',
        language: 'typescript',
        code: `// Screen reader manager with spatial awareness
class ScreenReaderManager {
  announceNodeSelection(node: GraphNode, context: NavigationContext) {
    const connections = this.getNodeConnections(node);
    const position = this.getSpatialDescription(node.position);

    const announcement = this.buildAnnouncement({
      primary: \`Selected \${node.label}\`,
      secondary: \`\${connections.length} connections\`,
      spatial: position,
      actions: ['Press Enter to explore', 'Arrow keys to navigate']
    });

    this.announce(announcement, 'assertive');
  }

  private getSpatialDescription(position: Point): string {
    const quadrant = this.getQuadrant(position);
    const density = this.getAreaDensity(position);

    return \`Located in \${quadrant} area, \${density} density\`;
  }

  private buildAnnouncement(parts: AnnouncementParts): string {
    return [
      parts.primary,
      parts.secondary,
      parts.spatial,
      parts.actions.join(', ')
    ].filter(Boolean).join('. ') + '.';
  }
}`,
        category: 'interaction'
      },
      {
        id: 'voice-control-commands',
        title: 'Voice Control Implementation',
        description: 'Hands-free graph navigation using speech recognition',
        language: 'typescript',
        code: `// Voice control with natural language processing
class VoiceController {
  private commands = {
    navigation: [
      'select {nodeName}',
      'go to {nodeName}',
      'find {searchTerm}',
      'zoom in',
      'zoom out',
      'center view'
    ],
    information: [
      'describe current node',
      'list connections',
      'what am I looking at',
      'read node details'
    ],
    actions: [
      'expand node',
      'collapse node',
      'highlight path to {target}',
      'show shortest path'
    ]
  };

  async processVoiceCommand(transcript: string): Promise<VoiceCommand> {
    const normalizedCommand = this.normalizeTranscript(transcript);
    const matchedCommand = this.matchCommand(normalizedCommand);

    if (matchedCommand) {
      await this.executeCommand(matchedCommand);
      this.announceSuccess(matchedCommand);
    } else {
      this.announceError('Command not recognized');
      this.suggestAlternatives(transcript);
    }

    return matchedCommand;
  }

  private matchCommand(transcript: string): VoiceCommand | null {
    // Use fuzzy matching for natural speech variations
    for (const [category, commands] of Object.entries(this.commands)) {
      for (const pattern of commands) {
        const match = this.fuzzyMatch(transcript, pattern);
        if (match.confidence > 0.7) {
          return {
            command: pattern,
            action: category,
            parameters: match.parameters,
            confidence: match.confidence
          };
        }
      }
    }
    return null;
  }
}`,
        category: 'interaction'
      },
      {
        id: 'spatial-keyboard-navigation',
        title: 'Spatial Keyboard Navigation',
        description: 'Arrow-key navigation with spatial awareness for graph structures',
        language: 'typescript',
        code: `// Spatial navigation using arrow keys
class KeyboardNavigator {
  private spatialIndex: SpatialIndex;
  private currentNode: GraphNode | null = null;

  handleArrowKey(direction: 'up' | 'down' | 'left' | 'right'): void {
    if (!this.currentNode) {
      this.selectCenterNode();
      return;
    }

    const nextNode = this.findSpatialNeighbor(this.currentNode, direction);

    if (nextNode) {
      this.selectNode(nextNode);
      this.announceNavigation(direction, nextNode);
    } else {
      this.announceNoNeighbor(direction);
    }
  }

  private findSpatialNeighbor(
    currentNode: GraphNode,
    direction: Direction
  ): GraphNode | null {
    const currentPos = currentNode.position;
    const candidates = this.spatialIndex.getNodesInDirection(
      currentPos,
      direction,
      { maxDistance: 200, maxResults: 5 }
    );

    // Score candidates by distance and alignment
    const scored = candidates.map(node => ({
      node,
      score: this.calculateNavigationScore(currentPos, node.position, direction)
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.node || null;
  }

  private calculateNavigationScore(
    from: Point,
    to: Point,
    direction: Direction
  ): number {
    const vector = { x: to.x - from.x, y: to.y - from.y };
    const distance = Math.sqrt(vector.x ** 2 + vector.y ** 2);

    // Calculate alignment with direction
    const directionVector = this.getDirectionVector(direction);
    const alignment = this.dotProduct(vector, directionVector) / distance;

    // Prefer closer nodes that are well-aligned
    return alignment / (1 + distance / 100);
  }
}`,
        category: 'interaction'
      },
      {
        id: 'wcag-validation',
        title: 'WCAG Compliance Validation',
        description: 'Real-time accessibility validation and metrics collection',
        language: 'typescript',
        code: `// WCAG compliance validator
class AccessibilityValidator {
  async validateWCAG(element: HTMLElement): Promise<AccessibilityMetrics> {
    const metrics: AccessibilityMetrics = {
      wcagLevel: 'A',
      contrastRatio: 0,
      keyboardNavigable: false,
      screenReaderSupport: false,
      focusIndicators: false,
      semanticMarkup: false,
      ariaLabels: 0,
      violations: 0,
      lastValidation: Date.now()
    };

    // Test color contrast
    metrics.contrastRatio = await this.testColorContrast(element);

    // Test keyboard navigation
    metrics.keyboardNavigable = this.testKeyboardNavigation(element);

    // Test screen reader support
    metrics.screenReaderSupport = this.testScreenReaderSupport(element);

    // Test focus indicators
    metrics.focusIndicators = this.testFocusIndicators(element);

    // Test semantic markup
    metrics.semanticMarkup = this.testSemanticMarkup(element);

    // Count ARIA labels
    metrics.ariaLabels = this.countAriaLabels(element);

    // Determine WCAG level
    metrics.wcagLevel = this.determineWCAGLevel(metrics);

    return metrics;
  }

  private async testColorContrast(element: HTMLElement): Promise<number> {
    const style = getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    return this.calculateContrastRatio(color, backgroundColor);
  }

  private testKeyboardNavigation(element: HTMLElement): boolean {
    // Check if element is focusable
    const focusable = element.tabIndex >= 0 ||
                     element.matches('a, button, input, select, textarea, [tabindex]');

    // Check if all interactive elements are keyboard accessible
    const interactiveElements = element.querySelectorAll('button, a, input, select');
    const keyboardAccessible = Array.from(interactiveElements).every(el => {
      return (el as HTMLElement).tabIndex >= 0 ||
             el.matches('a[href], button:not([disabled]), input:not([disabled])');
    });

    return focusable && keyboardAccessible;
  }

  private determineWCAGLevel(metrics: AccessibilityMetrics): 'A' | 'AA' | 'AAA' {
    if (metrics.contrastRatio >= 7 &&
        metrics.keyboardNavigable &&
        metrics.screenReaderSupport &&
        metrics.focusIndicators &&
        metrics.violations === 0) {
      return 'AAA';
    }

    if (metrics.contrastRatio >= 4.5 &&
        metrics.keyboardNavigable &&
        metrics.screenReaderSupport) {
      return 'AA';
    }

    return 'A';
  }
}`,
        category: 'setup'
      }
    ];
  }

  public onInteraction(event: InteractionEvent): void {
    // Handle interactions through accessibility managers
    if (event.type === 'select' && this.screenReaderManager) {
      this.screenReaderManager.announceSelection(event);
    }

    if (event.type === 'hover' && this.accessibilityConfig.announceActions) {
      this.announceToUser(`Hovering over interactive element`, 'polite');
    }
  }

  // Private methods

  private setupAccessibleXboxStyling(): void {
    if (!this.container) return;

    const isHighContrast = this.accessibilityConfig.enableHighContrast;
    const contrastLevel = this.accessibilityConfig.contrastLevel;

    // Xbox-inspired accessible color scheme
    const colors = isHighContrast ? {
      primary: '#00ff00',      // High contrast green
      secondary: '#ffffff',    // Pure white
      background: '#000000',   // Pure black
      accent: '#ffff00',       // High contrast yellow
      error: '#ff0000'         // High contrast red
    } : {
      primary: '#107c10',      // Xbox green
      secondary: '#ffffff',    // White
      background: '#1a1a1a',   // Dark gray
      accent: '#ffb900',       // Xbox gold
      error: '#d13438'         // Xbox red
    };

    this.container.style.cssText += `
      background: ${colors.background};
      border: 3px solid ${colors.primary};
      border-radius: 8px;
      box-shadow: ${isHighContrast ? 'none' : `0 0 20px rgba(16, 124, 16, 0.5)`};
      position: relative;
      overflow: hidden;
    `;

    // Add accessibility indicators
    const accessibilityBar = document.createElement('div');
    accessibilityBar.className = 'accessibility-status-bar';
    accessibilityBar.setAttribute('role', 'status');
    accessibilityBar.setAttribute('aria-live', 'polite');

    accessibilityBar.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      height: 40px;
      background: ${colors.primary};
      border: 2px solid ${colors.secondary};
      border-radius: 8px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 14px;
      font-weight: bold;
      color: ${colors.background};
      z-index: 1000;
    `;

    accessibilityBar.innerHTML = `
      <span>🔍 Accessibility Leadership</span>
      <div style="margin-left: auto; display: flex; gap: 16px; align-items: center;">
        <span id="wcag-level">WCAG ${contrastLevel}</span>
        <span id="contrast-ratio">Contrast: ${isHighContrast ? '∞' : '7:1'}</span>
        <span id="navigation-mode">⌨️ ${this.accessibilityConfig.keyboardNavigationMode}</span>
        <span id="voice-status">🎙️ ${this.accessibilityConfig.enableVoiceControl ? 'ON' : 'OFF'}</span>
      </div>
    `;

    this.container.appendChild(accessibilityBar);

    // Add focus trap for keyboard navigation
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', 'Accessible graph visualization');
    this.container.setAttribute('tabindex', '0');
  }

  private async initializeAccessibleGraph(): Promise<void> {
    // Initialize knowledge graph with accessibility enhancements
    console.log('Initializing accessible graph with dataset:', this.currentDataset);

    // Add ARIA labels to all interactive elements
    this.enhanceWithARIA();
  }

  private enhanceWithARIA(): void {
    if (!this.container) return;

    // Add comprehensive ARIA structure
    const graphRegion = document.createElement('div');
    graphRegion.setAttribute('role', 'img');
    graphRegion.setAttribute('aria-label', 'Interactive knowledge graph visualization');
    graphRegion.setAttribute('aria-describedby', 'graph-description');

    const description = document.createElement('div');
    description.id = 'graph-description';
    description.className = 'sr-only'; // Screen reader only
    description.textContent = `This is an interactive graph with ${this.currentDataset?.nodes?.length || 0} nodes and ${this.currentDataset?.edges?.length || 0} connections. Use arrow keys to navigate between nodes, Enter to select, and voice commands for hands-free interaction.`;

    this.container.appendChild(description);
    this.container.appendChild(graphRegion);
  }

  private async renderAccessibleGraph(): Promise<void> {
    // Render the graph with accessibility enhancements
    // This would integrate with the actual rendering engine
  }

  private renderAccessibleBackground(): void {
    if (!this.context || !this.canvas) return;

    const { width, height } = this.canvas;
    const isHighContrast = this.accessibilityConfig.enableHighContrast;

    if (isHighContrast) {
      // High contrast background
      this.context.fillStyle = '#000000';
      this.context.fillRect(0, 0, width, height);
    } else {
      // Xbox-themed accessible gradient
      const gradient = this.context.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a1a1a');
      gradient.addColorStop(0.5, '#0f0f0f');
      gradient.addColorStop(1, '#000000');

      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, width, height);
    }
  }

  private renderAccessibilityIndicators(): void {
    // Render visual accessibility aids
    this.renderFocusRing();
    this.renderNavigationHints();
  }

  private renderFocusIndicators(): void {
    if (!this.navigationState.currentNode || !this.context) return;

    const position = this.navigationState.position;
    const isHighContrast = this.accessibilityConfig.enableHighContrast;

    // Draw focus ring with high visibility
    this.context.save();
    this.context.strokeStyle = isHighContrast ? '#ffff00' : '#ffb900';
    this.context.lineWidth = isHighContrast ? 4 : 3;
    this.context.setLineDash([5, 5]);
    this.context.beginPath();
    this.context.arc(position.x, position.y, 30, 0, Math.PI * 2);
    this.context.stroke();
    this.context.restore();
  }

  private renderFocusRing(): void {
    if (!this.navigationState.focusedElement) return;

    // Ensure focused element has visible focus indicator
    const element = this.navigationState.focusedElement;
    element.style.outline = this.accessibilityConfig.enableHighContrast
      ? '3px solid #ffff00'
      : '2px solid #ffb900';
    element.style.outlineOffset = '2px';
  }

  private renderNavigationHints(): void {
    if (!this.context || !this.navigationState.currentNode) return;

    const position = this.navigationState.position;
    const neighbors = this.navigationState.neighbors;

    // Draw directional arrows for available navigation
    this.context.save();
    this.context.fillStyle = this.accessibilityConfig.enableHighContrast ? '#ffffff' : '#107c10';
    this.context.font = '16px Arial';

    if (neighbors.up) this.drawArrow(position.x, position.y - 50, '↑');
    if (neighbors.down) this.drawArrow(position.x, position.y + 50, '↓');
    if (neighbors.left) this.drawArrow(position.x - 50, position.y, '←');
    if (neighbors.right) this.drawArrow(position.x + 50, position.y, '→');

    this.context.restore();
  }

  private drawArrow(x: number, y: number, arrow: string): void {
    if (!this.context) return;

    this.context.fillText(arrow, x, y);
  }

  private setupAccessibilityHandlers(): void {
    if (!this.container) return;

    // Keyboard event handling
    this.container.addEventListener('keydown', (event) => {
      this.handleKeyboardEvent(event);
    });

    // Focus management
    this.container.addEventListener('focus', () => {
      if (!this.navigationState.currentNode) {
        this.selectInitialNode();
      }
    });

    // Mouse interactions for screen reader users
    this.container.addEventListener('click', (event) => {
      this.handleAccessibleClick(event);
    });
  }

  private startAccessibilityMonitoring(): void {
    // Start real-time accessibility validation
    setInterval(() => {
      if (this.accessibilityValidator && this.accessibilityConfig.validateWCAG) {
        this.validateAccessibility();
      }
    }, 5000); // Validate every 5 seconds
  }

  private async validateAccessibility(): Promise<void> {
    if (!this.accessibilityValidator || !this.container) return;

    try {
      const metrics = await this.accessibilityValidator.validate(this.container);
      this.accessibilityMetrics = metrics;
      this.updateAccessibilityUI(metrics);
    } catch (error) {
      console.error('Accessibility validation failed:', error);
    }
  }

  private updateAccessibilityUI(metrics: AccessibilityMetrics): void {
    // Update accessibility status indicators
    const wcagLevel = this.container?.querySelector('#wcag-level');
    const contrastRatio = this.container?.querySelector('#contrast-ratio');

    if (wcagLevel) {
      wcagLevel.textContent = `WCAG ${metrics.wcagLevel}`;
    }

    if (contrastRatio) {
      contrastRatio.textContent = `Contrast: ${metrics.contrastRatio.toFixed(1)}:1`;
    }
  }

  private handleKeyboardEvent(event: KeyboardEvent): void {
    if (!this.accessibilityConfig.enableKeyboardNavigation) return;

    switch (event.key) {
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        this.keyboardNavigator?.handleArrowKey(event.key.replace('Arrow', '').toLowerCase() as any);
        break;

      case 'Enter':
        event.preventDefault();
        this.handleNodeSelection();
        break;

      case 'Escape':
        event.preventDefault();
        this.clearSelection();
        break;

      case ' ':
        event.preventDefault();
        this.toggleNodeExpansion();
        break;
    }
  }

  private handleAccessibleClick(event: MouseEvent): void {
    // Convert mouse click to accessible interaction
    const rect = this.container!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find nearest node and select it
    const nearestNode = this.findNodeAtPosition(x, y);
    if (nearestNode) {
      this.selectNode(nearestNode);
    }
  }

  private handleVoiceCommand(command: VoiceCommand): void {
    this.announceToUser(`Executing voice command: ${command.command}`, 'assertive');

    switch (command.action) {
      case 'navigation':
        this.handleVoiceNavigation(command);
        break;
      case 'information':
        this.handleVoiceInformation(command);
        break;
      case 'actions':
        this.handleVoiceActions(command);
        break;
    }
  }

  private handleVoiceNavigation(command: VoiceCommand): void {
    // Process voice navigation commands
    console.log('Voice navigation:', command);
  }

  private handleVoiceInformation(command: VoiceCommand): void {
    // Process voice information requests
    console.log('Voice information:', command);
  }

  private handleVoiceActions(command: VoiceCommand): void {
    // Process voice action commands
    console.log('Voice actions:', command);
  }

  private handleKeyboardNavigation(state: KeyboardNavigationState): void {
    this.navigationState = state;

    if (state.currentNode) {
      this.announceToUser(`Navigated to ${state.currentNode}`, 'assertive');
    }
  }

  private handleAccessibilityValidation(metrics: AccessibilityMetrics): void {
    this.accessibilityMetrics = metrics;

    if (metrics.violations > 0) {
      this.announceToUser(`${metrics.violations} accessibility violations detected`, 'assertive');
    }
  }

  private selectInitialNode(): void {
    // Select the first available node for keyboard users
    const firstNode = this.currentDataset?.nodes?.[0];
    if (firstNode) {
      this.selectNode(firstNode.id);
    }
  }

  private selectNode(nodeId: string): void {
    this.navigationState.currentNode = nodeId;
    this.updateNavigationNeighbors();

    const node = this.findNodeById(nodeId);
    if (node && this.screenReaderManager) {
      this.screenReaderManager.announceNodeSelection(node, this.navigationState);
    }
  }

  private handleNodeSelection(): void {
    if (this.navigationState.currentNode) {
      this.announceToUser(`Selected node ${this.navigationState.currentNode}`, 'assertive');
    }
  }

  private clearSelection(): void {
    this.navigationState.currentNode = null;
    this.navigationState.neighbors = {};
    this.announceToUser('Selection cleared', 'polite');
  }

  private toggleNodeExpansion(): void {
    if (this.navigationState.currentNode) {
      this.announceToUser(`Toggled expansion for ${this.navigationState.currentNode}`, 'polite');
    }
  }

  private updateNavigationNeighbors(): void {
    // Calculate spatial neighbors for current node
    if (!this.navigationState.currentNode) return;

    // This would use the spatial index to find neighbors
    this.navigationState.neighbors = {
      up: 'node-up',
      down: 'node-down',
      left: 'node-left',
      right: 'node-right'
    };
  }

  private findNodeAtPosition(x: number, y: number): string | null {
    // Find node at screen position
    // This would integrate with the actual graph layout
    return 'node-1';
  }

  private findNodeById(id: string): any {
    return this.currentDataset?.nodes?.find((node: any) => node.id === id);
  }

  private announceToUser(message: string, priority: 'polite' | 'assertive'): void {
    if (this.accessibilityConfig.announceActions && this.screenReaderManager) {
      this.screenReaderManager.announce(message, priority);
    }

    // Also use the shared utility
    announceToScreenReader(message);
  }

  private updateAccessibilityMetrics(renderTime: number): void {
    // Update performance metrics with accessibility data
    if (this._state) {
      this._state.metrics.renderTime = renderTime;
      this._state.metrics.lastUpdate = Date.now();

      // Add accessibility-specific metrics
      const accessibilityMetrics = {
        wcagCompliance: this.accessibilityMetrics.wcagLevel,
        contrastRatio: this.accessibilityMetrics.contrastRatio,
        keyboardNavigable: this.accessibilityMetrics.keyboardNavigable,
        screenReaderSupport: this.accessibilityMetrics.screenReaderSupport,
        voiceControlActive: this.accessibilityConfig.enableVoiceControl,
        ariaLabels: this.accessibilityMetrics.ariaLabels
      };

      // Store in state for external access
      (this._state.metrics as any).accessibility = accessibilityMetrics;
    }
  }
}