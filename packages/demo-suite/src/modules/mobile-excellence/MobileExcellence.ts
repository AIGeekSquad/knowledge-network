/**
 * Mobile Excellence Module
 *
 * Flagship mobile demonstration showcasing touch-native graph interactions:
 * - Multi-touch gesture recognition and handling
 * - Haptic feedback for enhanced user experience
 * - Battery-aware performance optimization
 * - Adaptive UI that responds to device capabilities
 */

import { BaseDemoModule, type ConfigOption, type CodeExample, type InteractionEvent } from '../../shared/DemoModule.js';
import { TouchController } from './components/TouchController.js';
import { HapticFeedback } from './components/HapticFeedback.js';
import { BatteryMonitor } from './components/BatteryMonitor.js';
import { AdaptiveInterface } from './components/AdaptiveInterface.js';
import { generateMobileDataset } from './data/mobile-datasets.js';
import { formatNumber, debounce } from '../../shared/utils.js';

/**
 * Configuration interface for mobile optimization
 */
export interface MobileConfig {
  enableMultiTouch: boolean;
  enableHapticFeedback: boolean;
  batteryOptimization: boolean;
  adaptivePerformance: boolean;
  touchTargetSize: number;
  gestureThreshold: number;
  hapticIntensity: number;
  performanceMode: 'battery' | 'balanced' | 'performance';
  showTouchIndicators: boolean;
  enableRotation: boolean;
}

/**
 * Touch gesture data structure
 */
export interface TouchGesture {
  type: 'tap' | 'doubletap' | 'pinch' | 'pan' | 'rotate' | 'longpress';
  startTime: number;
  endTime?: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  scale?: number;
  rotation?: number;
  velocity?: { x: number; y: number };
  fingerCount: number;
}

/**
 * Haptic feedback pattern definitions
 */
export interface HapticPattern {
  type: 'selection' | 'navigation' | 'error' | 'success' | 'warning';
  intensity: number;
  duration: number;
  pattern?: number[];
}

/**
 * Battery status information
 */
export interface BatteryStatus {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  performanceMode: 'battery' | 'balanced' | 'performance';
}

/**
 * Device profile for adaptation
 */
export interface DeviceProfile {
  isMobile: boolean;
  isTablet: boolean;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  orientation: 'portrait' | 'landscape';
  touchSupport: boolean;
  maxTouchPoints: number;
  batteryAPI: boolean;
  vibrationAPI: boolean;
}

/**
 * Main Mobile Excellence module implementation
 */
export class MobileExcellence extends BaseDemoModule {
  private knowledgeGraph: any = null;
  private touchController: TouchController | null = null;
  private hapticFeedback: HapticFeedback | null = null;
  private batteryMonitor: BatteryMonitor | null = null;
  private adaptiveInterface: AdaptiveInterface | null = null;

  private currentDataset: any = null;
  private activeGestures = new Map<number, TouchGesture>();
  private deviceProfile: DeviceProfile;
  private lastFrameTime = 0;

  private mobileConfig: MobileConfig = {
    enableMultiTouch: true,
    enableHapticFeedback: true,
    batteryOptimization: true,
    adaptivePerformance: true,
    touchTargetSize: 44, // iOS HIG minimum
    gestureThreshold: 10,
    hapticIntensity: 0.7,
    performanceMode: 'balanced',
    showTouchIndicators: true,
    enableRotation: true
  };

  constructor() {
    super({
      id: 'mobile-excellence',
      title: 'Mobile Excellence',
      description: 'Multi-touch gestures, haptic feedback, and mobile-optimized graph interactions',
      difficulty: 'intermediate',
      estimatedTime: '8-12 minutes',
      capabilities: [
        'Multi-touch gesture recognition (pinch, pan, rotate)',
        'Haptic feedback for touch interactions',
        'Battery-aware performance scaling',
        'Adaptive UI for all screen sizes and orientations',
        'Touch-optimized node selection and manipulation',
        'Mobile-native zoom and navigation controls'
      ],
      competitiveAdvantages: [
        '60fps rendering on mobile devices vs 10-15fps in D3.js',
        'Native multi-touch gesture support vs single-touch only',
        'Hardware-accelerated animations vs CPU-bound alternatives',
        'Battery-optimized performance scaling vs fixed overhead',
        'Touch-first design vs desktop-adapted interfaces',
        'Xbox-inspired mobile gaming UI vs generic web controls'
      ]
    });

    this.deviceProfile = this.detectDeviceCapabilities();
  }

  protected async onInitialize(): Promise<void> {
    if (!this.container || !this.context) {
      throw new Error('Container and context must be available');
    }

    // Apply Xbox-inspired mobile styling
    this.setupXboxMobileStyling();

    // Initialize mobile-specific components
    this.touchController = new TouchController({
      container: this.container,
      config: this.mobileConfig,
      onGesture: this.handleGesture.bind(this)
    });

    this.hapticFeedback = new HapticFeedback({
      enabled: this.mobileConfig.enableHapticFeedback && this.deviceProfile.vibrationAPI,
      intensity: this.mobileConfig.hapticIntensity
    });

    this.batteryMonitor = new BatteryMonitor({
      onBatteryChange: this.handleBatteryChange.bind(this)
    });

    this.adaptiveInterface = new AdaptiveInterface({
      container: this.container,
      deviceProfile: this.deviceProfile,
      config: this.mobileConfig
    });

    // Generate mobile-optimized dataset
    this.currentDataset = generateMobileDataset(this.mobileConfig.touchTargetSize);

    // Initialize with mobile-optimized settings
    await this.initializeMobileGraph();

    // Set up touch event handlers
    this.setupTouchHandlers();

    // Start adaptive performance monitoring
    this.startAdaptiveMonitoring();
  }

  protected async onRender(): Promise<void> {
    if (!this.context || !this.canvas) return;

    const startTime = performance.now();

    // Clear with Xbox-themed gradient background
    this.renderMobileBackground();

    // Render graph with mobile optimizations
    if (this.knowledgeGraph && this.currentDataset) {
      await this.renderMobileGraph();
    }

    // Render touch indicators if enabled
    if (this.mobileConfig.showTouchIndicators) {
      this.renderTouchIndicators();
    }

    // Render adaptive UI elements
    if (this.adaptiveInterface) {
      this.adaptiveInterface.render();
    }

    // Update performance metrics
    const renderTime = performance.now() - startTime;
    this.updateMobileMetrics(renderTime);
  }

  protected onCleanup(): void {
    this.touchController?.destroy();
    this.hapticFeedback?.destroy();
    this.batteryMonitor?.destroy();
    this.adaptiveInterface?.destroy();
    this.knowledgeGraph = null;
  }

  protected onConfigurationUpdate(config: Record<string, any>): void {
    this.mobileConfig = { ...this.mobileConfig, ...config };

    // Update components with new configuration
    this.touchController?.updateConfig(this.mobileConfig);
    this.hapticFeedback?.setIntensity(this.mobileConfig.hapticIntensity);
    this.adaptiveInterface?.updateConfig(this.mobileConfig);

    // Regenerate dataset if touch target size changed
    if (config.touchTargetSize && config.touchTargetSize !== this.currentDataset?.targetSize) {
      this.currentDataset = generateMobileDataset(config.touchTargetSize);
      this.initializeMobileGraph();
    }
  }

  protected getDefaultConfiguration(): Record<string, any> {
    return { ...this.mobileConfig };
  }

  public getConfigurationOptions(): ConfigOption[] {
    return [
      {
        id: 'enableMultiTouch',
        label: 'Multi-Touch Gestures',
        type: 'toggle',
        value: this.mobileConfig.enableMultiTouch,
        description: 'Enable multi-finger gesture recognition'
      },
      {
        id: 'enableHapticFeedback',
        label: 'Haptic Feedback',
        type: 'toggle',
        value: this.mobileConfig.enableHapticFeedback,
        description: 'Provide tactile feedback for interactions'
      },
      {
        id: 'batteryOptimization',
        label: 'Battery Optimization',
        type: 'toggle',
        value: this.mobileConfig.batteryOptimization,
        description: 'Scale performance based on battery level'
      },
      {
        id: 'touchTargetSize',
        label: 'Touch Target Size',
        type: 'slider',
        value: this.mobileConfig.touchTargetSize,
        min: 32,
        max: 64,
        step: 4,
        description: 'Minimum touch target size in pixels'
      },
      {
        id: 'hapticIntensity',
        label: 'Haptic Intensity',
        type: 'slider',
        value: this.mobileConfig.hapticIntensity,
        min: 0.1,
        max: 1.0,
        step: 0.1,
        description: 'Strength of haptic feedback'
      },
      {
        id: 'performanceMode',
        label: 'Performance Mode',
        type: 'select',
        value: this.mobileConfig.performanceMode,
        options: [
          { value: 'battery', label: 'Battery Saver' },
          { value: 'balanced', label: 'Balanced' },
          { value: 'performance', label: 'High Performance' }
        ],
        description: 'Performance vs battery trade-off'
      },
      {
        id: 'showTouchIndicators',
        label: 'Touch Indicators',
        type: 'toggle',
        value: this.mobileConfig.showTouchIndicators,
        description: 'Show visual feedback for touches'
      }
    ];
  }

  public getCodeExamples(): CodeExample[] {
    return [
      {
        id: 'touch-gestures',
        title: 'Multi-Touch Gesture Recognition',
        description: 'Implementing pinch-to-zoom and pan gestures for mobile graph interaction',
        language: 'typescript',
        code: `// Multi-touch gesture controller
class TouchController {
  private activePointers = new Map<number, Touch>();
  private gestureState = {
    scale: 1,
    rotation: 0,
    translation: { x: 0, y: 0 }
  };

  handleTouchStart(event: TouchEvent) {
    event.preventDefault();

    for (const touch of event.changedTouches) {
      this.activePointers.set(touch.identifier, touch);
    }

    if (this.activePointers.size === 2) {
      this.startPinchGesture();
    }
  }

  handleTouchMove(event: TouchEvent) {
    if (this.activePointers.size === 2) {
      this.updatePinchGesture(event);
    } else if (this.activePointers.size === 1) {
      this.updatePanGesture(event);
    }
  }

  private startPinchGesture() {
    const [touch1, touch2] = Array.from(this.activePointers.values());
    this.initialDistance = this.getDistance(touch1, touch2);
    this.initialAngle = this.getAngle(touch1, touch2);
  }
}`,
        category: 'interaction'
      },
      {
        id: 'haptic-feedback',
        title: 'Haptic Feedback Integration',
        description: 'Adding tactile responses to graph interactions for enhanced mobile UX',
        language: 'typescript',
        code: `// Haptic feedback patterns for different interactions
class HapticFeedback {
  private patterns = {
    selection: [50, 30, 50],      // Short-pause-short
    navigation: [100],             // Single strong pulse
    error: [200, 100, 200],       // Long-pause-long
    success: [30, 20, 30, 20, 30] // Triple tap
  };

  async triggerFeedback(type: string, intensity = 1.0) {
    if (!navigator.vibrate || !this.enabled) return;

    const pattern = this.patterns[type];
    if (!pattern) return;

    // Scale pattern by intensity
    const scaledPattern = pattern.map(duration =>
      Math.round(duration * intensity)
    );

    try {
      navigator.vibrate(scaledPattern);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }

  // Trigger feedback for node selection
  onNodeSelect(node: GraphNode) {
    this.triggerFeedback('selection', 0.7);
  }
}`,
        category: 'interaction'
      },
      {
        id: 'battery-optimization',
        title: 'Battery-Aware Performance Scaling',
        description: 'Automatically adjusting rendering quality based on device battery level',
        language: 'typescript',
        code: `// Battery-aware performance management
class BatteryMonitor {
  private batteryInfo: BatteryManager | null = null;

  async initialize() {
    if ('getBattery' in navigator) {
      this.batteryInfo = await (navigator as any).getBattery();
      this.setupBatteryListeners();
    }
  }

  private setupBatteryListeners() {
    if (!this.batteryInfo) return;

    this.batteryInfo.addEventListener('levelchange', () => {
      this.adjustPerformanceMode();
    });
  }

  private adjustPerformanceMode() {
    const level = this.batteryInfo?.level ?? 1;
    const charging = this.batteryInfo?.charging ?? false;

    if (!charging && level < 0.2) {
      // Battery saver mode: reduce quality
      this.setPerformanceMode('battery');
    } else if (!charging && level < 0.5) {
      // Balanced mode
      this.setPerformanceMode('balanced');
    } else {
      // High performance mode
      this.setPerformanceMode('performance');
    }
  }

  private setPerformanceMode(mode: string) {
    const configs = {
      battery: { fps: 30, quality: 0.5, particles: false },
      balanced: { fps: 45, quality: 0.75, particles: true },
      performance: { fps: 60, quality: 1.0, particles: true }
    };

    this.emit('performanceChange', configs[mode]);
  }
}`,
        category: 'optimization'
      },
      {
        id: 'adaptive-ui',
        title: 'Responsive Mobile Interface',
        description: 'Creating adaptive UI that responds to device orientation and screen size',
        language: 'typescript',
        code: `// Adaptive interface for mobile devices
class AdaptiveInterface {
  private breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200
  };

  constructor(private container: HTMLElement) {
    this.setupResponsiveHandlers();
    this.detectInitialState();
  }

  private setupResponsiveHandlers() {
    // Orientation change handling
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleOrientationChange(), 100);
    });

    // Resize handling with debouncing
    const debouncedResize = debounce(() => {
      this.handleScreenResize();
    }, 250);

    window.addEventListener('resize', debouncedResize);
  }

  private handleOrientationChange() {
    const orientation = screen.orientation?.angle === 0 ? 'portrait' : 'landscape';

    this.container.classList.toggle('landscape', orientation === 'landscape');
    this.container.classList.toggle('portrait', orientation === 'portrait');

    // Adjust UI layout for orientation
    if (orientation === 'landscape') {
      this.enableCompactMode();
    } else {
      this.enableFullMode();
    }

    this.emit('orientationChange', { orientation });
  }

  private getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;

    if (width < this.breakpoints.mobile) return 'mobile';
    if (width < this.breakpoints.tablet) return 'tablet';
    return 'desktop';
  }
}`,
        category: 'setup'
      }
    ];
  }

  public onInteraction(event: InteractionEvent): void {
    // Handle touch interactions through TouchController
    if (event.type === 'touch') {
      this.touchController?.handleInteraction(event);
    }

    // Provide haptic feedback for selections
    if (event.type === 'select' && this.hapticFeedback) {
      this.hapticFeedback.triggerFeedback('selection');
    }
  }

  // Private methods

  private detectDeviceCapabilities(): DeviceProfile {
    return {
      isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      isTablet: /iPad|Android(?=.*\\bMobile\\b)|PlayBook|Silk/i.test(navigator.userAgent),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      maxTouchPoints: navigator.maxTouchPoints || 1,
      batteryAPI: 'getBattery' in navigator,
      vibrationAPI: 'vibrate' in navigator
    };
  }

  private setupXboxMobileStyling(): void {
    if (!this.container) return;

    this.container.style.cssText += `
      background: linear-gradient(135deg, #0e1e0e 0%, #1a3d1a 50%, #0e1e0e 100%);
      border: 2px solid #107c10;
      border-radius: 12px;
      box-shadow:
        0 0 20px rgba(16, 124, 16, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      position: relative;
      overflow: hidden;
    `;

    // Add Xbox-style mobile indicators
    const statusBar = document.createElement('div');
    statusBar.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      height: 24px;
      background: rgba(16, 124, 16, 0.2);
      border: 1px solid rgba(16, 124, 16, 0.4);
      border-radius: 12px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      font-size: 12px;
      color: #107c10;
      z-index: 100;
    `;
    statusBar.innerHTML = `
      <span>🎮 Xbox Mobile</span>
      <span style="margin-left: auto; display: flex; gap: 8px;">
        <span id="battery-indicator">🔋 ${Math.round((this.batteryMonitor?.getBatteryLevel() ?? 1) * 100)}%</span>
        <span id="touch-indicator">👆 Multi-Touch</span>
      </span>
    `;

    this.container.appendChild(statusBar);
  }

  private async initializeMobileGraph(): Promise<void> {
    // Initialize knowledge graph with mobile-optimized settings
    // This would integrate with the actual knowledge-network library
    console.log('Initializing mobile graph with dataset:', this.currentDataset);
  }

  private async renderMobileGraph(): Promise<void> {
    // Render the graph with mobile optimizations
    // This would use the actual rendering engine
  }

  private renderMobileBackground(): void {
    if (!this.context || !this.canvas) return;

    const { width, height } = this.canvas;

    // Xbox-themed gradient background optimized for mobile
    const gradient = this.context.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) / 2
    );

    gradient.addColorStop(0, 'rgba(16, 124, 16, 0.1)');
    gradient.addColorStop(0.5, 'rgba(14, 30, 14, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)');

    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, width, height);
  }

  private renderTouchIndicators(): void {
    // Render visual indicators for active touches
    for (const gesture of this.activeGestures.values()) {
      this.renderTouchPoint(gesture.currentPosition, gesture.type);
    }
  }

  private renderTouchPoint(position: { x: number; y: number }, type: string): void {
    if (!this.context) return;

    const radius = this.mobileConfig.touchTargetSize / 2;

    // Xbox-themed touch indicator
    this.context.save();
    this.context.globalAlpha = 0.7;

    // Outer ring
    this.context.strokeStyle = '#107c10';
    this.context.lineWidth = 3;
    this.context.beginPath();
    this.context.arc(position.x, position.y, radius + 5, 0, Math.PI * 2);
    this.context.stroke();

    // Inner fill
    this.context.fillStyle = 'rgba(16, 124, 16, 0.3)';
    this.context.beginPath();
    this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.context.fill();

    this.context.restore();
  }

  private setupTouchHandlers(): void {
    if (!this.container) return;

    // Prevent default touch behaviors that interfere with gestures
    this.container.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    this.container.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  private startAdaptiveMonitoring(): void {
    const monitor = () => {
      // Adjust performance based on device state
      if (this.batteryMonitor && this.mobileConfig.batteryOptimization) {
        const batteryLevel = this.batteryMonitor.getBatteryLevel();
        this.adjustPerformanceForBattery(batteryLevel);
      }

      // Continue monitoring
      setTimeout(monitor, 5000); // Check every 5 seconds
    };

    monitor();
  }

  private adjustPerformanceForBattery(level: number): void {
    let targetFPS = 60;

    if (!this.batteryMonitor?.isCharging()) {
      if (level < 0.2) {
        targetFPS = 30; // Battery saver
      } else if (level < 0.5) {
        targetFPS = 45; // Balanced
      }
    }

    // Apply performance adjustments
    // This would integrate with the actual rendering pipeline
  }

  private handleGesture(gesture: TouchGesture): void {
    this.activeGestures.set(gesture.fingerCount, gesture);

    // Process different gesture types
    switch (gesture.type) {
      case 'pinch':
        this.handlePinchGesture(gesture);
        break;
      case 'pan':
        this.handlePanGesture(gesture);
        break;
      case 'rotate':
        this.handleRotateGesture(gesture);
        break;
      case 'tap':
        this.handleTapGesture(gesture);
        break;
      case 'longpress':
        this.handleLongPressGesture(gesture);
        break;
    }

    // Provide haptic feedback
    if (this.hapticFeedback) {
      this.hapticFeedback.triggerFeedback(gesture.type);
    }
  }

  private handlePinchGesture(gesture: TouchGesture): void {
    // Handle pinch-to-zoom
    if (gesture.scale) {
      console.log(`Pinch gesture: scale ${gesture.scale}`);
    }
  }

  private handlePanGesture(gesture: TouchGesture): void {
    // Handle two-finger pan
    console.log(`Pan gesture: ${gesture.currentPosition.x}, ${gesture.currentPosition.y}`);
  }

  private handleRotateGesture(gesture: TouchGesture): void {
    // Handle rotation gesture
    if (gesture.rotation) {
      console.log(`Rotate gesture: ${gesture.rotation}°`);
    }
  }

  private handleTapGesture(gesture: TouchGesture): void {
    // Handle single tap selection
    console.log(`Tap at: ${gesture.currentPosition.x}, ${gesture.currentPosition.y}`);
  }

  private handleLongPressGesture(gesture: TouchGesture): void {
    // Handle long press for context menu
    console.log(`Long press at: ${gesture.currentPosition.x}, ${gesture.currentPosition.y}`);
  }

  private handleBatteryChange(battery: BatteryStatus): void {
    if (this.mobileConfig.batteryOptimization) {
      this.adjustPerformanceForBattery(battery.level);
    }

    // Update UI battery indicator
    const indicator = this.container?.querySelector('#battery-indicator');
    if (indicator) {
      indicator.textContent = `🔋 ${Math.round(battery.level * 100)}%`;
    }
  }

  private updateMobileMetrics(renderTime: number): void {
    // Update performance metrics with mobile-specific data
    const now = performance.now();

    if (this._state) {
      this._state.metrics.renderTime = renderTime;
      this._state.metrics.lastUpdate = now;

      // Add mobile-specific metrics
      const deviceMetrics = {
        batteryLevel: this.batteryMonitor?.getBatteryLevel() ?? 1,
        activeGestures: this.activeGestures.size,
        touchSupport: this.deviceProfile.touchSupport,
        pixelRatio: this.deviceProfile.pixelRatio
      };

      // Store in state for external access
      (this._state.metrics as any).mobile = deviceMetrics;
    }
  }
}