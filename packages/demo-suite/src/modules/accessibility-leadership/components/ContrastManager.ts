/**
 * Contrast Manager Component
 *
 * Manages color contrast levels for accessibility compliance.
 */

import { EventEmitter } from '../../../shared/utils.js';
import type { ContrastLevel } from '../AccessibilityLeadership.js';

interface ContrastManagerConfig {
  container: HTMLElement;
  level: 'AA' | 'AAA' | 'enhanced';
  highContrastMode: boolean;
}

export class ContrastManager extends EventEmitter<{
  contrastChange: ContrastLevel;
}> {
  private container: HTMLElement;
  private level: 'AA' | 'AAA' | 'enhanced';
  private highContrastMode: boolean;

  constructor({ container, level, highContrastMode }: ContrastManagerConfig) {
    super();
    this.container = container;
    this.level = level;
    this.highContrastMode = highContrastMode;

    this.applyContrastLevel();
  }

  setLevel(level: 'AA' | 'AAA' | 'enhanced'): void {
    this.level = level;
    this.applyContrastLevel();
  }

  setHighContrastMode(enabled: boolean): void {
    this.highContrastMode = enabled;
    this.applyContrastLevel();
  }

  destroy(): void {
    this.removeAllListeners();
  }

  private applyContrastLevel(): void {
    const contrastConfig: ContrastLevel = {
      level: this.level,
      textRatio: this.getTextRatio(),
      graphicsRatio: this.getGraphicsRatio(),
      backgroundColors: this.getBackgroundColors(),
      foregroundColors: this.getForegroundColors()
    };

    this.emit('contrastChange', contrastConfig);
  }

  private getTextRatio(): number {
    const ratios = { 'AA': 4.5, 'AAA': 7, 'enhanced': 10 };
    return ratios[this.level];
  }

  private getGraphicsRatio(): number {
    const ratios = { 'AA': 3, 'AAA': 4.5, 'enhanced': 7 };
    return ratios[this.level];
  }

  private getBackgroundColors(): string[] {
    return this.highContrastMode ? ['#000000'] : ['#1a1a1a', '#0f0f0f'];
  }

  private getForegroundColors(): string[] {
    return this.highContrastMode ? ['#ffffff', '#ffff00'] : ['#ffffff', '#107c10', '#ffb900'];
  }
}