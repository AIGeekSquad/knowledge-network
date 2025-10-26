/**
 * Battery Monitor Component
 *
 * Monitors device battery status and adjusts performance accordingly.
 * Provides Xbox-style battery level indicators and optimization.
 */

import { EventEmitter } from '../../../shared/utils.js';
import type { BatteryStatus } from '../MobileExcellence.js';

interface BatteryMonitorConfig {
  onBatteryChange: (battery: BatteryStatus) => void;
}

// Extend Navigator type for battery API
interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface NavigatorWithBattery extends Navigator {
  getBattery(): Promise<BatteryManager>;
}

export class BatteryMonitor extends EventEmitter<{
  batteryChange: BatteryStatus;
  chargingChange: boolean;
  levelChange: number;
  performanceModeChange: string;
}> {
  private batteryManager: BatteryManager | null = null;
  private onBatteryChangeCallback: (battery: BatteryStatus) => void;
  private isSupported: boolean = false;
  private currentStatus: BatteryStatus;

  // Performance thresholds
  private readonly performanceThresholds = {
    battery: 0.2,   // Below 20%: battery saver mode
    balanced: 0.5,  // Below 50%: balanced mode
    performance: 1.0 // Above 50% or charging: performance mode
  };

  constructor({ onBatteryChange }: BatteryMonitorConfig) {
    super();
    this.onBatteryChangeCallback = onBatteryChange;

    // Initialize with defaults
    this.currentStatus = {
      level: 1.0,
      charging: false,
      chargingTime: Infinity,
      dischargingTime: Infinity,
      performanceMode: 'performance'
    };

    this.initializeBatteryAPI();
  }

  /**
   * Get current battery level (0-1)
   */
  getBatteryLevel(): number {
    return this.currentStatus.level;
  }

  /**
   * Check if device is currently charging
   */
  isCharging(): boolean {
    return this.currentStatus.charging;
  }

  /**
   * Get current performance mode based on battery status
   */
  getPerformanceMode(): 'battery' | 'balanced' | 'performance' {
    return this.currentStatus.performanceMode;
  }

  /**
   * Get full battery status
   */
  getBatteryStatus(): BatteryStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if Battery API is supported
   */
  isBatterySupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get battery level as percentage string
   */
  getBatteryPercentage(): string {
    return `${Math.round(this.currentStatus.level * 100)}%`;
  }

  /**
   * Get estimated time remaining
   */
  getTimeRemaining(): string {
    if (this.currentStatus.charging) {
      if (this.currentStatus.chargingTime === Infinity) {
        return 'Unknown';
      }
      const hours = Math.floor(this.currentStatus.chargingTime / 3600);
      const minutes = Math.floor((this.currentStatus.chargingTime % 3600) / 60);
      return `${hours}h ${minutes}m until full`;
    } else {
      if (this.currentStatus.dischargingTime === Infinity) {
        return 'Unknown';
      }
      const hours = Math.floor(this.currentStatus.dischargingTime / 3600);
      const minutes = Math.floor((this.currentStatus.dischargingTime % 3600) / 60);
      return `${hours}h ${minutes}m remaining`;
    }
  }

  /**
   * Get Xbox-style battery indicator
   */
  getBatteryIcon(): string {
    const level = this.currentStatus.level;
    const charging = this.currentStatus.charging;

    if (charging) {
      return '🔌'; // Charging icon
    }

    // Xbox-style battery indicators
    if (level > 0.75) return '🔋'; // Full
    if (level > 0.5) return '🔋'; // Good
    if (level > 0.25) return '🪫'; // Medium
    return '🪫'; // Low
  }

  /**
   * Force performance mode (overrides battery-based detection)
   */
  setPerformanceMode(mode: 'battery' | 'balanced' | 'performance'): void {
    if (this.currentStatus.performanceMode !== mode) {
      this.currentStatus.performanceMode = mode;
      this.notifyBatteryChange();
      this.emit('performanceModeChange', mode);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.batteryManager) {
      this.removeBatteryListeners();
    }
    this.removeAllListeners();
  }

  // Private methods

  private async initializeBatteryAPI(): Promise<void> {
    // Check if Battery API is supported
    if (!('getBattery' in navigator)) {
      console.warn('Battery API not supported');
      this.isSupported = false;
      return;
    }

    try {
      const nav = navigator as NavigatorWithBattery;
      this.batteryManager = await nav.getBattery();
      this.isSupported = true;

      // Update initial status
      this.updateBatteryStatus();

      // Setup event listeners
      this.setupBatteryListeners();

      console.log('Battery monitoring initialized');
    } catch (error) {
      console.warn('Failed to initialize Battery API:', error);
      this.isSupported = false;
    }
  }

  private setupBatteryListeners(): void {
    if (!this.batteryManager) return;

    // Battery level changes
    this.batteryManager.addEventListener('levelchange', () => {
      this.updateBatteryStatus();
      this.emit('levelChange', this.currentStatus.level);
    });

    // Charging status changes
    this.batteryManager.addEventListener('chargingchange', () => {
      this.updateBatteryStatus();
      this.emit('chargingChange', this.currentStatus.charging);
    });

    // Charging time changes
    this.batteryManager.addEventListener('chargingtimechange', () => {
      this.updateBatteryStatus();
    });

    // Discharging time changes
    this.batteryManager.addEventListener('dischargingtimechange', () => {
      this.updateBatteryStatus();
    });
  }

  private removeBatteryListeners(): void {
    if (!this.batteryManager) return;

    // Remove all event listeners
    const events = ['levelchange', 'chargingchange', 'chargingtimechange', 'dischargingtimechange'];
    events.forEach(event => {
      this.batteryManager!.removeEventListener(event, this.updateBatteryStatus.bind(this));
    });
  }

  private updateBatteryStatus(): void {
    if (!this.batteryManager) return;

    const previousMode = this.currentStatus.performanceMode;

    this.currentStatus = {
      level: this.batteryManager.level,
      charging: this.batteryManager.charging,
      chargingTime: this.batteryManager.chargingTime,
      dischargingTime: this.batteryManager.dischargingTime,
      performanceMode: this.calculatePerformanceMode()
    };

    // Notify about battery changes
    this.notifyBatteryChange();

    // Emit specific events
    this.emit('batteryChange', this.currentStatus);

    // Check if performance mode changed
    if (previousMode !== this.currentStatus.performanceMode) {
      this.emit('performanceModeChange', this.currentStatus.performanceMode);
    }
  }

  private calculatePerformanceMode(): 'battery' | 'balanced' | 'performance' {
    // If charging, always use performance mode
    if (this.currentStatus.charging) {
      return 'performance';
    }

    // Determine mode based on battery level
    if (this.currentStatus.level <= this.performanceThresholds.battery) {
      return 'battery';
    } else if (this.currentStatus.level <= this.performanceThresholds.balanced) {
      return 'balanced';
    } else {
      return 'performance';
    }
  }

  private notifyBatteryChange(): void {
    this.onBatteryChangeCallback(this.currentStatus);
  }
}