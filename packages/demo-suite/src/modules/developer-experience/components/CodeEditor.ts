/**
 * Code Editor Component
 *
 * Monaco Editor integration with Xbox theming and IntelliSense support.
 */

import { EventEmitter } from '../../../shared/utils.js';

interface CodeEditorConfig {
  container: HTMLElement;
  theme: string;
  enableIntelliSense: boolean;
  onCodeChange: (code: string) => void;
}

export class CodeEditor extends EventEmitter<{
  change: string;
}> {
  private container: HTMLElement;
  private theme: string;
  private enableIntelliSense: boolean;
  private onCodeChangeCallback: (code: string) => void;
  private editor: any = null;
  private currentCode: string = '';

  constructor({ container, theme, enableIntelliSense, onCodeChange }: CodeEditorConfig) {
    super();
    this.container = container;
    this.theme = theme;
    this.enableIntelliSense = enableIntelliSense;
    this.onCodeChangeCallback = onCodeChange;

    this.initializeEditor();
  }

  updateConfig(config: { theme: string; enableIntelliSense: boolean }): void {
    this.theme = config.theme;
    this.enableIntelliSense = config.enableIntelliSense;
    // Update editor configuration
  }

  getValue(): string {
    return this.currentCode;
  }

  setValue(code: string): void {
    this.currentCode = code;
    if (this.editor) {
      this.editor.setValue(code);
    }
  }

  destroy(): void {
    this.removeAllListeners();
  }

  private initializeEditor(): void {
    // Create editor container
    const editorContainer = document.createElement('div');
    editorContainer.style.cssText = `
      position: absolute;
      top: 60px;
      right: 16px;
      width: 400px;
      height: 300px;
      background: #1e1e1e;
      border: 2px solid #107c10;
      border-radius: 8px;
    `;

    // Mock Monaco editor (would integrate real Monaco in production)
    const textarea = document.createElement('textarea');
    textarea.style.cssText = `
      width: 100%;
      height: 100%;
      background: #1e1e1e;
      color: #d4d4d4;
      border: none;
      padding: 16px;
      font-family: 'Consolas', monospace;
      font-size: 14px;
      resize: none;
      outline: none;
    `;

    textarea.addEventListener('input', () => {
      this.currentCode = textarea.value;
      this.onCodeChangeCallback(this.currentCode);
      this.emit('change', this.currentCode);
    });

    editorContainer.appendChild(textarea);
    this.container.appendChild(editorContainer);
    this.editor = textarea;
  }
}