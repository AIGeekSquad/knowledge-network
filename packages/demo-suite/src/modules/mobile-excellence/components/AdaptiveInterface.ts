/**
 * Adaptive Interface Component
 *
 * Provides responsive UI adaptation based on device capabilities and screen size.
 * Implements Xbox-style interface scaling and layout optimization for mobile devices.
 */

import { EventEmitter, debounce } from '../../../shared/utils.js';
import type { DeviceProfile, MobileConfig } from '../MobileExcellence.js';

interface AdaptiveInterfaceConfig {
  container: HTMLElement;
  deviceProfile: DeviceProfile;
  config: MobileConfig;
}

export class AdaptiveInterface extends EventEmitter<{
  orientationChange: { orientation: string };
  screenResize: { width: number; height: number };
  interfaceMode: { mode: string };
}> {
  private container: HTMLElement;
  private deviceProfile: DeviceProfile;
  private config: MobileConfig;

  private currentOrientation: 'portrait' | 'landscape';
  private interfaceMode: 'compact' | 'full' | 'expanded';
  private uiElements: Map<string, HTMLElement> = new Map();

  // Xbox UI scaling factors
  private readonly scalingFactors = {
    mobile: { base: 0.8, touch: 1.2 },
    tablet: { base: 0.9, touch: 1.1 },
    desktop: { base: 1.0, touch: 1.0 }
  };

  // Breakpoints for responsive design
  private readonly breakpoints = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
    wide: 1440
  };

  constructor({ container, deviceProfile, config }: AdaptiveInterfaceConfig) {
    super();
    this.container = container;
    this.deviceProfile = deviceProfile;
    this.config = config;

    this.currentOrientation = deviceProfile.orientation;
    this.interfaceMode = this.calculateInterfaceMode();

    this.initializeAdaptiveInterface();
    this.setupEventHandlers();
  }

  updateConfig(config: MobileConfig): void {
    this.config = config;
    this.updateInterfaceLayout();
  }

  render(): void {
    this.updateResponsiveLayout();
    this.updateXboxStyling();
  }

  destroy(): void {
    this.cleanup();
    this.removeAllListeners();
  }

  // Public methods for interface control

  /**
   * Get current device category
   */
  getDeviceCategory(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;

    if (width <= this.breakpoints.mobile) return 'mobile';
    if (width <= this.breakpoints.tablet) return 'tablet';
    return 'desktop';
  }

  /**
   * Get current interface mode
   */
  getInterfaceMode(): 'compact' | 'full' | 'expanded' {
    return this.interfaceMode;
  }

  /**
   * Force interface mode
   */
  setInterfaceMode(mode: 'compact' | 'full' | 'expanded'): void {
    if (this.interfaceMode !== mode) {
      this.interfaceMode = mode;
      this.updateInterfaceLayout();
      this.emit('interfaceMode', { mode });
    }
  }

  /**
   * Get optimal touch target size for current device
   */
  getOptimalTouchTargetSize(): number {
    const deviceCategory = this.getDeviceCategory();
    const baseSize = this.config.touchTargetSize;
    const scaling = this.scalingFactors[deviceCategory];

    return Math.round(baseSize * scaling.touch);
  }

  /**
   * Check if interface should use compact mode
   */
  shouldUseCompactMode(): boolean {
    return this.currentOrientation === 'landscape' && this.deviceProfile.isMobile;
  }

  // Private methods

  private initializeAdaptiveInterface(): void {
    this.createXboxInterfaceElements();
    this.applyInitialLayout();
    this.setupAccessibilityFeatures();
  }

  private setupEventHandlers(): void {
    // Orientation change handling
    const handleOrientationChange = debounce(() => {
      this.handleOrientationChange();
    }, 100);

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    // Touch capability detection
    this.container.addEventListener('touchstart', () => {
      this.container.classList.add('touch-enabled');
    }, { once: true });
  }

  private handleOrientationChange(): void {
    // Update device profile
    this.deviceProfile.orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    this.deviceProfile.screenSize = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const previousOrientation = this.currentOrientation;
    this.currentOrientation = this.deviceProfile.orientation;

    // Update interface layout
    this.updateInterfaceLayout();

    // Emit orientation change event
    if (previousOrientation !== this.currentOrientation) {
      this.emit('orientationChange', { orientation: this.currentOrientation });
    }

    // Emit resize event
    this.emit('screenResize', {
      width: this.deviceProfile.screenSize.width,
      height: this.deviceProfile.screenSize.height
    });
  }

  private calculateInterfaceMode(): 'compact' | 'full' | 'expanded' {
    const deviceCategory = this.getDeviceCategory();
    const screenWidth = this.deviceProfile.screenSize.width;

    if (deviceCategory === 'mobile' || this.shouldUseCompactMode()) {
      return 'compact';
    } else if (deviceCategory === 'tablet' || screenWidth < this.breakpoints.desktop) {
      return 'full';
    } else {
      return 'expanded';
    }
  }

  private updateInterfaceLayout(): void {
    const newMode = this.calculateInterfaceMode();

    if (newMode !== this.interfaceMode) {
      this.interfaceMode = newMode;
      this.emit('interfaceMode', { mode: newMode });
    }

    // Apply layout-specific changes
    this.applyLayoutMode();
    this.updateControlSizes();
    this.updateSpacing();
  }

  private createXboxInterfaceElements(): void {
    // Create Xbox-style control panel
    const controlPanel = this.createControlPanel();
    this.uiElements.set('controlPanel', controlPanel);

    // Create status indicators
    const statusBar = this.createStatusBar();
    this.uiElements.set('statusBar', statusBar);

    // Create navigation elements
    const navElements = this.createNavigationElements();
    this.uiElements.set('navigation', navElements);

    // Create touch indicators
    if (this.config.showTouchIndicators) {
      const touchIndicators = this.createTouchIndicators();
      this.uiElements.set('touchIndicators', touchIndicators);
    }
  }

  private createControlPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'xbox-control-panel adaptive-control-panel';

    panel.style.cssText = `
      position: absolute;
      bottom: 16px;
      right: 16px;
      background: linear-gradient(135deg, rgba(16, 124, 16, 0.9) 0%, rgba(14, 30, 14, 0.95) 100%);
      border: 2px solid rgba(16, 124, 16, 0.7);
      border-radius: 12px;
      padding: 12px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
      z-index: 200;
    `;

    this.container.appendChild(panel);
    return panel;
  }

  private createStatusBar(): HTMLElement {
    const statusBar = document.createElement('div');
    statusBar.className = 'xbox-status-bar adaptive-status-bar';

    statusBar.style.cssText = `
      position: absolute;
      top: 8px;
      left: 8px;
      right: 8px;
      height: 32px;
      background: rgba(16, 124, 16, 0.2);
      border: 1px solid rgba(16, 124, 16, 0.4);
      border-radius: 16px;
      display: flex;
      align-items: center;
      padding: 0 16px;
      font-size: 12px;
      color: #107c10;
      z-index: 100;
      transition: all 0.3s ease;
    `;

    statusBar.innerHTML = `
      <span class="xbox-logo">🎮</span>
      <span class="device-info">Mobile Excellence</span>
      <div style="margin-left: auto; display: flex; gap: 12px; align-items: center;">
        <span class="orientation-indicator">${this.currentOrientation === 'portrait' ? '📱' : '📺'}</span>
        <span class="touch-status">${this.deviceProfile.touchSupport ? '👆' : '🖱️'}</span>
        <span class="performance-mode">⚡ ${this.interfaceMode}</span>
      </div>
    `;

    this.container.appendChild(statusBar);
    return statusBar;
  }

  private createNavigationElements(): HTMLElement {
    const nav = document.createElement('div');
    nav.className = 'xbox-navigation adaptive-navigation';

    nav.style.cssText = `
      position: absolute;
      top: 50px;
      right: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      z-index: 150;
    `;

    // Create Xbox-style action buttons
    const buttons = ['A', 'B', 'X', 'Y'];
    buttons.forEach((button, index) => {
      const btn = document.createElement('button');
      btn.className = `xbox-button xbox-button-${button.toLowerCase()}`;
      btn.textContent = button;

      btn.style.cssText = `
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 2px solid;
        background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent);
        color: white;
        font-weight: bold;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;

      // Xbox button colors
      const colors = {
        'A': '#107c10',
        'B': '#d13438',
        'X': '#1570a6',
        'Y': '#ffb900'
      };

      btn.style.borderColor = colors[button];
      btn.style.backgroundColor = colors[button];

      // Touch feedback
      btn.addEventListener('touchstart', () => {
        btn.style.transform = 'scale(0.95)';
      });

      btn.addEventListener('touchend', () => {
        btn.style.transform = 'scale(1)';
      });

      nav.appendChild(btn);
    });

    this.container.appendChild(nav);
    return nav;
  }

  private createTouchIndicators(): HTMLElement {
    const indicators = document.createElement('div');
    indicators.className = 'xbox-touch-indicators';

    indicators.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 300;
    `;

    this.container.appendChild(indicators);
    return indicators;
  }

  private applyInitialLayout(): void {
    this.container.classList.add('adaptive-interface');
    this.container.classList.add(`interface-${this.interfaceMode}`);
    this.container.classList.add(`orientation-${this.currentOrientation}`);
    this.container.classList.add(`device-${this.getDeviceCategory()}`);
  }

  private applyLayoutMode(): void {
    // Remove existing mode classes
    this.container.classList.remove('interface-compact', 'interface-full', 'interface-expanded');
    this.container.classList.remove('orientation-portrait', 'orientation-landscape');
    this.container.classList.remove('device-mobile', 'device-tablet', 'device-desktop');

    // Apply current mode classes
    this.container.classList.add(`interface-${this.interfaceMode}`);
    this.container.classList.add(`orientation-${this.currentOrientation}`);
    this.container.classList.add(`device-${this.getDeviceCategory()}`);
  }

  private updateControlSizes(): void {
    const deviceCategory = this.getDeviceCategory();
    const touchTargetSize = this.getOptimalTouchTargetSize();

    // Update control panel size
    const controlPanel = this.uiElements.get('controlPanel');
    if (controlPanel) {
      if (this.interfaceMode === 'compact') {
        controlPanel.style.bottom = '8px';
        controlPanel.style.right = '8px';
        controlPanel.style.padding = '8px';
      } else {
        controlPanel.style.bottom = '16px';
        controlPanel.style.right = '16px';
        controlPanel.style.padding = '12px';
      }
    }

    // Update navigation button sizes
    const navigation = this.uiElements.get('navigation');
    if (navigation) {
      const buttons = navigation.querySelectorAll('.xbox-button');
      buttons.forEach((button: HTMLElement) => {
        button.style.width = `${touchTargetSize}px`;
        button.style.height = `${touchTargetSize}px`;
        button.style.fontSize = `${Math.max(12, touchTargetSize / 3)}px`;
      });
    }
  }

  private updateSpacing(): void {
    // Adjust spacing based on interface mode
    const spacingMultiplier = {
      compact: 0.75,
      full: 1.0,
      expanded: 1.25
    }[this.interfaceMode];

    // Apply spacing to elements
    this.uiElements.forEach((element, key) => {
      if (key === 'navigation') {
        element.style.gap = `${8 * spacingMultiplier}px`;
      }
    });
  }

  private updateResponsiveLayout(): void {
    // Update based on current screen size and orientation
    const statusBar = this.uiElements.get('statusBar');
    if (statusBar) {
      // Update status information
      const orientationIndicator = statusBar.querySelector('.orientation-indicator');
      const performanceMode = statusBar.querySelector('.performance-mode');

      if (orientationIndicator) {
        orientationIndicator.textContent = this.currentOrientation === 'portrait' ? '📱' : '📺';
      }

      if (performanceMode) {
        performanceMode.textContent = `⚡ ${this.interfaceMode}`;
      }
    }
  }

  private updateXboxStyling(): void {
    // Apply Xbox-themed styling updates
    this.container.style.setProperty('--xbox-primary', '#107c10');
    this.container.style.setProperty('--xbox-secondary', '#1570a6');
    this.container.style.setProperty('--xbox-accent', '#ffb900');
    this.container.style.setProperty('--xbox-error', '#d13438');
  }

  private setupAccessibilityFeatures(): void {
    // Ensure proper ARIA labels and roles
    this.container.setAttribute('role', 'application');
    this.container.setAttribute('aria-label', 'Mobile Excellence Interactive Graph');

    // Add keyboard navigation support
    const navigation = this.uiElements.get('navigation');
    if (navigation) {
      navigation.setAttribute('role', 'toolbar');
      navigation.setAttribute('aria-label', 'Graph controls');
    }

    // Setup focus management for touch interfaces
    if (this.deviceProfile.touchSupport) {
      this.container.addEventListener('focusin', (event) => {
        // Ensure focus is visible for keyboard users on touch devices
        if (event.target instanceof HTMLElement) {
          event.target.classList.add('keyboard-focused');
        }
      });

      this.container.addEventListener('focusout', (event) => {
        if (event.target instanceof HTMLElement) {
          event.target.classList.remove('keyboard-focused');
        }
      });
    }
  }

  private cleanup(): void {
    // Remove all created UI elements
    this.uiElements.forEach((element) => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    this.uiElements.clear();

    // Remove event listeners
    window.removeEventListener('orientationchange', this.handleOrientationChange);
    window.removeEventListener('resize', this.handleOrientationChange);
  }
}