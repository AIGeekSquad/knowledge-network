/**
 * MobileAccessibilitySupport provides enhanced mobile interaction
 * and accessibility features for the Knowledge Network.
 *
 * Features:
 * - Mobile-optimized touch handling
 * - Screen reader support
 * - Keyboard navigation
 * - High contrast mode support
 * - Voice control integration
 * - Haptic feedback
 */

import type { Point2D } from '../spatial/types';
import type { PositionedNode } from '../layout/LayoutEngine';
import type {
  InteractionController,
  ViewportState,
  _InteractionConfig,
  _GestureEvent,
} from './index';

// === Mobile Optimization ===

export interface MobileOptimizationConfig {
  // Touch handling
  enhancedTouchTargets: boolean;
  minimumTouchTargetSize: number; // pixels
  touchSlop: number; // pixels of allowed movement before gesture recognition

  // Performance
  reducedAnimations: boolean;
  lowPowerMode: boolean;
  batteryOptimization: boolean;

  // UI adaptations
  mobileUIScale: number;
  hideScrollbars: boolean;
  preventZoomOnDoubleTap: boolean;

  // Haptic feedback
  enableHaptics: boolean;
  hapticIntensity: 'light' | 'medium' | 'heavy';
}

export interface MobileCapabilities {
  hasTouchSupport: boolean;
  hasMultiTouch: boolean;
  hasOrientationSupport: boolean;
  hasVibrationSupport: boolean;
  hasDeviceMotion: boolean;
  isIOSDevice: boolean;
  isAndroidDevice: boolean;
  screenSize: 'small' | 'medium' | 'large';
  pixelDensity: number;
}

export class MobileOptimizer {
  private config: MobileOptimizationConfig;
  private capabilities: MobileCapabilities;
  private interactionController: InteractionController;

  // Orientation handling
  private currentOrientation: 'portrait' | 'landscape' = 'portrait';
  private orientationChangeHandlers: (() => void)[] = [];

  // Battery optimization
  private batteryLevel = 1.0;
  private isLowPowerMode = false;

  constructor(
    interactionController: InteractionController,
    config: Partial<MobileOptimizationConfig> = {}
  ) {
    this.interactionController = interactionController;
    this.capabilities = this.detectMobileCapabilities();

    this.config = {
      enhancedTouchTargets: true,
      minimumTouchTargetSize: 44, // iOS HIG recommendation
      touchSlop: 8,
      reducedAnimations: this.capabilities.screenSize === 'small',
      lowPowerMode: false,
      batteryOptimization: true,
      mobileUIScale: this.capabilities.screenSize === 'small' ? 1.2 : 1.0,
      hideScrollbars: true,
      preventZoomOnDoubleTap: true,
      enableHaptics: this.capabilities.hasVibrationSupport,
      hapticIntensity: 'medium',
      ...config,
    };

    this.setupMobileOptimizations();
  }

  // === Mobile Detection ===

  private detectMobileCapabilities(): MobileCapabilities {
    if (typeof window === 'undefined') {
      return {
        hasTouchSupport: false,
        hasMultiTouch: false,
        hasOrientationSupport: false,
        hasVibrationSupport: false,
        hasDeviceMotion: false,
        isIOSDevice: false,
        isAndroidDevice: false,
        screenSize: 'large',
        pixelDensity: 1,
      };
    }

    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/.test(userAgent);

    // Detect screen size
    const screenWidth = Math.min(window.screen.width, window.screen.height);
    let screenSize: 'small' | 'medium' | 'large' = 'large';
    if (screenWidth < 400) {
      screenSize = 'small';
    } else if (screenWidth < 800) {
      screenSize = 'medium';
    }

    return {
      hasTouchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      hasMultiTouch: navigator.maxTouchPoints > 1,
      hasOrientationSupport: 'orientation' in window,
      hasVibrationSupport: 'vibrate' in navigator,
      hasDeviceMotion: 'DeviceMotionEvent' in window,
      isIOSDevice,
      isAndroidDevice,
      screenSize,
      pixelDensity: window.devicePixelRatio || 1,
    };
  }

  private setupMobileOptimizations(): void {
    if (!this.capabilities.hasTouchSupport) return;

    // Setup orientation handling
    if (this.capabilities.hasOrientationSupport) {
      window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
    }

    // Setup battery monitoring
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.batteryLevel = battery.level;
        this.isLowPowerMode = battery.level < 0.2;

        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.updatePowerOptimizations();
        });
      });
    }

    // Prevent unwanted behaviors
    if (this.config.preventZoomOnDoubleTap) {
      this.preventDoubleTapZoom();
    }

    // Apply mobile UI scaling
    if (this.config.mobileUIScale !== 1.0) {
      this.applyMobileUIScaling();
    }
  }

  // === Touch Target Enhancement ===

  enhanceTouchTargets(nodes: PositionedNode[], viewport: ViewportState): PositionedNode[] {
    if (!this.config.enhancedTouchTargets) return nodes;

    const minSize = this.config.minimumTouchTargetSize;
    const scale = viewport.getZoom();

    return nodes.map(node => {
      const screenRadius = (node.radius || 10) * scale;
      const enhancedRadius = Math.max(screenRadius, minSize / 2 / scale);

      return {
        ...node,
        touchRadius: enhancedRadius, // Add touch-specific radius
      } as PositionedNode & { touchRadius: number };
    });
  }

  /**
   * Check if a touch point hits a node with enhanced touch targets
   */
  hitTestWithEnhancedTargets(
    touchPoint: Point2D,
    nodes: PositionedNode[],
    viewport: ViewportState
  ): PositionedNode | null {
    const worldPoint = viewport.screenToWorld(touchPoint);

    for (const node of nodes) {
      const nodeWithTouch = node as PositionedNode & { touchRadius?: number };
      const touchRadius = nodeWithTouch.touchRadius || node.radius || 10;

      const distance = Math.sqrt(
        Math.pow(worldPoint.x - node.x, 2) + Math.pow(worldPoint.y - node.y, 2)
      );

      if (distance <= touchRadius) {
        return node;
      }
    }

    return null;
  }

  // === Haptic Feedback ===

  private vibrate(pattern: number | number[]): void {
    if (!this.config.enableHaptics || !this.capabilities.hasVibrationSupport) return;

    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  triggerHapticFeedback(type: 'selection' | 'impact' | 'notification' | 'warning' | 'success'): void {
    if (!this.config.enableHaptics) return;

    const patterns = {
      selection: [10], // Short tap
      impact: [20], // Medium impact
      notification: [10, 50, 10], // Double tap
      warning: [100, 50, 100], // Alert pattern
      success: [50, 25, 50, 25, 50], // Confirmation pattern
    };

    // Adjust intensity
    const intensityMultiplier = {
      light: 0.5,
      medium: 1.0,
      heavy: 1.5,
    }[this.config.hapticIntensity];

    const pattern = patterns[type].map(duration => Math.round(duration * intensityMultiplier));
    this.vibrate(pattern);
  }

  // === Orientation Handling ===

  private handleOrientationChange(): void {
    const newOrientation = window.orientation === 90 || window.orientation === -90
      ? 'landscape'
      : 'portrait';

    if (newOrientation !== this.currentOrientation) {
      this.currentOrientation = newOrientation;

      // Notify handlers
      this.orientationChangeHandlers.forEach(handler => {
        try {
          handler();
        } catch (error) {
          console.error('Orientation change handler error:', error);
        }
      });

      // Update viewport if needed
      setTimeout(() => {
        const container = this.interactionController.getViewportState();
        if (container) {
          // Trigger viewport resize
          this.interactionController.updateConfig({
            viewport: {
              ...this.interactionController.getConfig().viewport,
            },
          });
        }
      }, 100); // Delay to ensure screen has rotated
    }
  }

  onOrientationChange(handler: () => void): void {
    this.orientationChangeHandlers.push(handler);
  }

  // === Power Optimization ===

  private updatePowerOptimizations(): void {
    const wasLowPower = this.isLowPowerMode;
    this.isLowPowerMode = this.batteryLevel < 0.2;

    if (this.config.batteryOptimization && this.isLowPowerMode !== wasLowPower) {
      // Update interaction config for power saving
      const currentConfig = this.interactionController.getConfig();

      this.interactionController.updateConfig({
        ...currentConfig,
        features: {
          ...currentConfig.features,
          animatedTransitions: !this.isLowPowerMode,
          throttleDelay: this.isLowPowerMode ? 32 : 16, // Reduce to 30fps when low power
        },
        animation: {
          ...currentConfig.animation,
          defaultDuration: this.isLowPowerMode ? 150 : 300,
          enableGpuAcceleration: !this.isLowPowerMode,
        },
      });
    }
  }

  // === UI Adaptations ===

  private preventDoubleTapZoom(): void {
    let lastTouchEnd = 0;

    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault(); // Prevent zoom on double tap
      }
      lastTouchEnd = now;
    }, { passive: false });
  }

  private applyMobileUIScaling(): void {
    const scale = this.config.mobileUIScale;
    if (scale === 1.0) return;

    // Apply CSS scaling to UI elements
    const style = document.createElement('style');
    style.textContent = `
      .knowledge-network-ui {
        transform: scale(${scale});
        transform-origin: top left;
      }
    `;
    document.head.appendChild(style);
  }

  // === Public API ===

  getCapabilities(): MobileCapabilities {
    return { ...this.capabilities };
  }

  getConfig(): MobileOptimizationConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<MobileOptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getCurrentOrientation(): 'portrait' | 'landscape' {
    return this.currentOrientation;
  }

  getBatteryLevel(): number {
    return this.batteryLevel;
  }

  isInLowPowerMode(): boolean {
    return this.isLowPowerMode;
  }
}

// === Accessibility Support ===

export interface AccessibilityConfig {
  // Screen reader support
  enableAriaLabels: boolean;
  enableLiveRegions: boolean;
  announceChanges: boolean;

  // Keyboard navigation
  enableKeyboardNavigation: boolean;
  focusVisibleStyle: boolean;
  trapFocusInModals: boolean;

  // Visual accessibility
  highContrastMode: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  focusIndicators: boolean;

  // Voice control
  enableVoiceCommands: boolean;
  voiceCommandLanguage: string;

  // Custom announcements
  customAnnouncements: boolean;
  announcementDelay: number;
}

export interface AccessibilityFeatures {
  hasScreenReader: boolean;
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersDarkMode: boolean;
  supportsVoiceControl: boolean;
  keyboardNavigation: boolean;
}

export class AccessibilitySupport {
  private config: AccessibilityConfig;
  private features: AccessibilityFeatures;
  private interactionController: InteractionController;

  // Screen reader support
  private liveRegion: HTMLElement | null = null;
  private announcementQueue: string[] = [];
  private announcementTimer: number | null = null;

  // Keyboard navigation
  private focusableNodes: string[] = [];
  private currentFocusIndex = -1;

  // Voice control
  private speechRecognition: any = null;
  private voiceCommands = new Map<string, () => void>();

  constructor(
    interactionController: InteractionController,
    config: Partial<AccessibilityConfig> = {}
  ) {
    this.interactionController = interactionController;
    this.features = this.detectAccessibilityFeatures();

    this.config = {
      enableAriaLabels: true,
      enableLiveRegions: true,
      announceChanges: this.features.hasScreenReader,
      enableKeyboardNavigation: true,
      focusVisibleStyle: true,
      trapFocusInModals: false,
      highContrastMode: this.features.prefersHighContrast,
      reduceMotion: this.features.prefersReducedMotion,
      largeText: false,
      focusIndicators: true,
      enableVoiceCommands: this.features.supportsVoiceControl,
      voiceCommandLanguage: 'en-US',
      customAnnouncements: true,
      announcementDelay: 500,
      ...config,
    };

    this.setupAccessibilityFeatures();
  }

  // === Feature Detection ===

  private detectAccessibilityFeatures(): AccessibilityFeatures {
    if (typeof window === 'undefined') {
      return {
        hasScreenReader: false,
        prefersReducedMotion: false,
        prefersHighContrast: false,
        prefersDarkMode: false,
        supportsVoiceControl: false,
        keyboardNavigation: false,
      };
    }

    return {
      hasScreenReader: this.detectScreenReader(),
      prefersReducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false,
      prefersHighContrast: window.matchMedia?.('(prefers-contrast: high)')?.matches || false,
      prefersDarkMode: window.matchMedia?.('(prefers-color-scheme: dark)')?.matches || false,
      supportsVoiceControl: 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window,
      keyboardNavigation: true, // Assume supported
    };
  }

  private detectScreenReader(): boolean {
    // Various methods to detect screen readers
    return !!(
      navigator.userAgent.includes('NVDA') ||
      navigator.userAgent.includes('JAWS') ||
      navigator.userAgent.includes('VoiceOver') ||
      (window as any).speechSynthesis ||
      document.querySelector('[aria-hidden]')
    );
  }

  // === Setup ===

  private setupAccessibilityFeatures(): void {
    if (this.config.enableLiveRegions) {
      this.createLiveRegion();
    }

    if (this.config.enableKeyboardNavigation) {
      this.setupKeyboardNavigation();
    }

    if (this.config.enableVoiceCommands && this.features.supportsVoiceControl) {
      this.setupVoiceControl();
    }

    if (this.config.focusVisibleStyle) {
      this.setupFocusStyles();
    }

    // Listen to interaction events for announcements
    this.setupEventListeners();

    // Apply motion preferences
    if (this.config.reduceMotion) {
      this.applyReducedMotion();
    }
  }

  // === Screen Reader Support ===

  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';

    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.config.announceChanges || !this.liveRegion) return;

    this.announcementQueue.push(message);

    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer);
    }

    this.announcementTimer = window.setTimeout(() => {
      if (this.liveRegion && this.announcementQueue.length > 0) {
        this.liveRegion.setAttribute('aria-live', priority);
        this.liveRegion.textContent = this.announcementQueue.join('. ');
        this.announcementQueue = [];
      }
      this.announcementTimer = null;
    }, this.config.announcementDelay);
  }

  // === Keyboard Navigation ===

  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', this.handleKeyboardNavigation.bind(this));
  }

  private handleKeyboardNavigation(event: KeyboardEvent): void {
    if (!this.config.enableKeyboardNavigation) return;

    switch (event.key) {
      case 'Tab':
        if (event.shiftKey) {
          this.focusPreviousNode();
        } else {
          this.focusNextNode();
        }
        event.preventDefault();
        break;

      case 'Enter':
      case ' ':
        this.activateCurrentNode();
        event.preventDefault();
        break;

      case 'Escape':
        this.clearFocus();
        event.preventDefault();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        this.handleArrowKeyNavigation(event.key);
        event.preventDefault();
        break;
    }
  }

  private focusNextNode(): void {
    if (this.focusableNodes.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % this.focusableNodes.length;
    this.focusNode(this.focusableNodes[this.currentFocusIndex]);
  }

  private focusPreviousNode(): void {
    if (this.focusableNodes.length === 0) return;

    this.currentFocusIndex = this.currentFocusIndex <= 0
      ? this.focusableNodes.length - 1
      : this.currentFocusIndex - 1;
    this.focusNode(this.focusableNodes[this.currentFocusIndex]);
  }

  private focusNode(nodeId: string): void {
    // Focus and announce node
    this.interactionController.selectNodes([nodeId], 'set');

    // Get node information for announcement
    const selectedNodes = this.interactionController.getSelectedNodes();
    if (selectedNodes.length > 0) {
      const node = selectedNodes[0];
      this.announce(`Focused on node ${node.id}`);
    }
  }

  private activateCurrentNode(): void {
    if (this.currentFocusIndex >= 0 && this.currentFocusIndex < this.focusableNodes.length) {
      const nodeId = this.focusableNodes[this.currentFocusIndex];
      // Trigger click/activation event
      this.announce(`Activated node ${nodeId}`);
    }
  }

  private clearFocus(): void {
    this.currentFocusIndex = -1;
    this.interactionController.clearSelection();
    this.announce('Selection cleared');
  }

  private handleArrowKeyNavigation(key: string): void {
    // Implement spatial navigation based on arrow keys
    const direction = {
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 },
    }[key];

    if (direction) {
      // Find nearest node in direction
      // This would need spatial indexing integration
      this.announce(`Navigating ${key.replace('Arrow', '').toLowerCase()}`);
    }
  }

  // === Voice Control ===

  private setupVoiceControl(): void {
    if (!this.features.supportsVoiceControl) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.speechRecognition = new SpeechRecognition();
    this.speechRecognition.continuous = true;
    this.speechRecognition.interimResults = false;
    this.speechRecognition.lang = this.config.voiceCommandLanguage;

    this.speechRecognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
      this.handleVoiceCommand(transcript);
    };

    // Setup default voice commands
    this.setupDefaultVoiceCommands();
  }

  private setupDefaultVoiceCommands(): void {
    this.addVoiceCommand('zoom in', () => {
      this.interactionController.zoom(1.5);
      this.announce('Zoomed in');
    });

    this.addVoiceCommand('zoom out', () => {
      this.interactionController.zoom(0.75);
      this.announce('Zoomed out');
    });

    this.addVoiceCommand('reset view', () => {
      this.interactionController.resetView();
      this.announce('View reset');
    });

    this.addVoiceCommand('fit to graph', () => {
      this.interactionController.fitToGraph();
      this.announce('Graph fitted to view');
    });

    this.addVoiceCommand('clear selection', () => {
      this.interactionController.clearSelection();
      this.announce('Selection cleared');
    });
  }

  addVoiceCommand(phrase: string, action: () => void): void {
    this.voiceCommands.set(phrase.toLowerCase(), action);
  }

  private handleVoiceCommand(transcript: string): void {
    const command = this.voiceCommands.get(transcript);
    if (command) {
      try {
        command();
      } catch (error) {
        this.announce('Command failed');
        console.error('Voice command error:', error);
      }
    } else {
      this.announce('Command not recognized');
    }
  }

  startListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.start();
    }
  }

  stopListening(): void {
    if (this.speechRecognition) {
      this.speechRecognition.stop();
    }
  }

  // === Visual Accessibility ===

  private setupFocusStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .knowledge-network-node:focus {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
      }

      .knowledge-network-node:focus-visible {
        outline: 3px solid #005fcc;
        outline-offset: 2px;
      }

      @media (prefers-contrast: high) {
        .knowledge-network-node:focus {
          outline: 4px solid currentColor;
        }
      }
    `;
    document.head.appendChild(style);
  }

  private applyReducedMotion(): void {
    // Update interaction config to reduce motion
    const currentConfig = this.interactionController.getConfig();

    this.interactionController.updateConfig({
      ...currentConfig,
      features: {
        ...currentConfig.features,
        animatedTransitions: false,
      },
      animation: {
        ...currentConfig.animation,
        defaultDuration: 0,
      },
    });
  }

  // === Event Integration ===

  private setupEventListeners(): void {
    this.interactionController.on('selectionChange', (event: any) => {
      if (this.config.announceChanges) {
        const count = event.selectedNodes.length;
        if (count === 0) {
          this.announce('Selection cleared');
        } else if (count === 1) {
          this.announce(`Selected node ${event.selectedNodes[0].id}`);
        } else {
          this.announce(`Selected ${count} nodes`);
        }
      }
    });

    this.interactionController.on('viewportChange', (event: any) => {
      if (this.config.announceChanges && event.reason !== 'pan') {
        switch (event.reason) {
          case 'zoom':
            this.announce(`Zoom level ${event.viewport.zoom.toFixed(1)}x`);
            break;
          case 'fit':
            this.announce('Graph fitted to viewport');
            break;
          case 'reset':
            this.announce('Viewport reset');
            break;
        }
      }
    });
  }

  // === Public API ===

  updateFocusableNodes(nodeIds: string[]): void {
    this.focusableNodes = [...nodeIds];
    this.currentFocusIndex = -1;
  }

  getFeatures(): AccessibilityFeatures {
    return { ...this.features };
  }

  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...config };
  }

  destroy(): void {
    if (this.liveRegion) {
      document.body.removeChild(this.liveRegion);
      this.liveRegion = null;
    }

    if (this.announcementTimer) {
      clearTimeout(this.announcementTimer);
      this.announcementTimer = null;
    }

    if (this.speechRecognition) {
      this.speechRecognition.stop();
      this.speechRecognition = null;
    }
  }
}

// === Factory Functions ===

export function createMobileOptimizer(
  interactionController: InteractionController,
  config?: Partial<MobileOptimizationConfig>
): MobileOptimizer {
  return new MobileOptimizer(interactionController, config);
}

export function createAccessibilitySupport(
  interactionController: InteractionController,
  config?: Partial<AccessibilityConfig>
): AccessibilitySupport {
  return new AccessibilitySupport(interactionController, config);
}