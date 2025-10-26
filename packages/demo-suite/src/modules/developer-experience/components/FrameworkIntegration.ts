/**
 * Framework Integration Component
 *
 * Framework-specific examples and templates.
 */

import { EventEmitter } from '../../../shared/utils.js';

interface FrameworkIntegrationConfig {
  container: HTMLElement;
  selectedFramework: string;
  onFrameworkChange: (framework: string) => void;
}

export class FrameworkIntegration extends EventEmitter<{
  frameworkChange: string;
}> {
  private container: HTMLElement;
  private selectedFramework: string;
  private onFrameworkChangeCallback: (framework: string) => void;

  constructor({ container, selectedFramework, onFrameworkChange }: FrameworkIntegrationConfig) {
    super();
    this.container = container;
    this.selectedFramework = selectedFramework;
    this.onFrameworkChangeCallback = onFrameworkChange;
  }

  setFramework(framework: string): void {
    this.selectedFramework = framework;
    this.onFrameworkChangeCallback(framework);
  }

  destroy(): void {
    this.removeAllListeners();
  }
}