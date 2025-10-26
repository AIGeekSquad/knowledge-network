/**
 * Reusable UI components for the Knowledge Network Demo Suite.
 * Provides accessible, touch-optimized components with consistent styling.
 */

import { EventEmitter, throttle, debounce, announceToScreenReader, createKeyboardHandler } from './utils.js';
import type { ConfigOption } from './DemoModule.js';

/**
 * Base component class with common functionality.
 */
export abstract class BaseComponent<T extends Record<string, any> = {}> extends EventEmitter<T> {
  protected element: HTMLElement;
  protected isDestroyed = false;

  constructor(tagName = 'div', className?: string) {
    super();
    this.element = document.createElement(tagName);
    if (className) {
      this.element.className = className;
    }
  }

  /**
   * Get the DOM element for this component.
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Append this component to a parent element.
   */
  appendTo(parent: HTMLElement): this {
    parent.appendChild(this.element);
    return this;
  }

  /**
   * Remove this component from its parent.
   */
  remove(): this {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    return this;
  }

  /**
   * Show the component.
   */
  show(): this {
    this.element.style.display = '';
    return this;
  }

  /**
   * Hide the component.
   */
  hide(): this {
    this.element.style.display = 'none';
    return this;
  }

  /**
   * Set component visibility.
   */
  setVisible(visible: boolean): this {
    return visible ? this.show() : this.hide();
  }

  /**
   * Enable/disable the component.
   */
  setEnabled(enabled: boolean): this {
    if (enabled) {
      this.element.removeAttribute('disabled');
      this.element.classList.remove('disabled');
    } else {
      this.element.setAttribute('disabled', 'true');
      this.element.classList.add('disabled');
    }
    return this;
  }

  /**
   * Cleanup component resources.
   */
  destroy(): void {
    if (this.isDestroyed) return;

    this.removeAllListeners();
    this.remove();
    this.isDestroyed = true;
  }
}

/**
 * Button component with touch optimization and accessibility.
 */
export class Button extends BaseComponent<{ click: Event; focus: Event; blur: Event }> {
  private buttonElement: HTMLButtonElement;

  constructor(text: string, options: {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    icon?: string;
    disabled?: boolean;
    ariaLabel?: string;
  } = {}) {
    super('div', 'ui-button-container');

    this.buttonElement = document.createElement('button');
    this.buttonElement.className = `ui-button ui-button--${options.variant || 'primary'} ui-button--${options.size || 'medium'}`;
    this.buttonElement.textContent = text;

    if (options.icon) {
      const icon = document.createElement('span');
      icon.className = 'ui-button__icon';
      icon.textContent = options.icon;
      this.buttonElement.insertBefore(icon, this.buttonElement.firstChild);
    }

    if (options.ariaLabel) {
      this.buttonElement.setAttribute('aria-label', options.ariaLabel);
    }

    if (options.disabled) {
      this.setEnabled(false);
    }

    this.setupEventHandlers();
    this.element.appendChild(this.buttonElement);
  }

  private setupEventHandlers(): void {
    this.buttonElement.addEventListener('click', (event) => {
      if (!this.buttonElement.disabled) {
        this.emit('click', event);
      }
    });

    this.buttonElement.addEventListener('focus', (event) => {
      this.emit('focus', event);
    });

    this.buttonElement.addEventListener('blur', (event) => {
      this.emit('blur', event);
    });

    // Touch feedback
    this.buttonElement.addEventListener('touchstart', () => {
      this.buttonElement.classList.add('ui-button--pressed');
    });

    this.buttonElement.addEventListener('touchend', () => {
      this.buttonElement.classList.remove('ui-button--pressed');
    });
  }

  setText(text: string): this {
    const icon = this.buttonElement.querySelector('.ui-button__icon');
    this.buttonElement.textContent = text;
    if (icon) {
      this.buttonElement.insertBefore(icon, this.buttonElement.firstChild);
    }
    return this;
  }

  setIcon(icon: string | null): this {
    const existingIcon = this.buttonElement.querySelector('.ui-button__icon');
    if (existingIcon) {
      existingIcon.remove();
    }

    if (icon) {
      const iconElement = document.createElement('span');
      iconElement.className = 'ui-button__icon';
      iconElement.textContent = icon;
      this.buttonElement.insertBefore(iconElement, this.buttonElement.firstChild);
    }

    return this;
  }

  setEnabled(enabled: boolean): this {
    this.buttonElement.disabled = !enabled;
    this.buttonElement.classList.toggle('ui-button--disabled', !enabled);
    return this;
  }
}

/**
 * Slider component for numeric input with touch support.
 */
export class Slider extends BaseComponent<{ change: { value: number }; input: { value: number } }> {
  private sliderElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;
  private valueElement: HTMLSpanElement;

  constructor(options: {
    label: string;
    min: number;
    max: number;
    value: number;
    step?: number;
    unit?: string;
    disabled?: boolean;
  }) {
    super('div', 'ui-slider-container');

    this.labelElement = document.createElement('label');
    this.labelElement.className = 'ui-slider__label';
    this.labelElement.textContent = options.label;

    this.valueElement = document.createElement('span');
    this.valueElement.className = 'ui-slider__value';

    this.sliderElement = document.createElement('input');
    this.sliderElement.type = 'range';
    this.sliderElement.className = 'ui-slider';
    this.sliderElement.min = options.min.toString();
    this.sliderElement.max = options.max.toString();
    this.sliderElement.step = (options.step || 1).toString();
    this.sliderElement.value = options.value.toString();

    if (options.disabled) {
      this.setEnabled(false);
    }

    this.updateValueDisplay(options.value, options.unit);
    this.setupEventHandlers();

    this.element.appendChild(this.labelElement);
    this.element.appendChild(this.sliderElement);
    this.element.appendChild(this.valueElement);
  }

  private setupEventHandlers(): void {
    const debouncedChange = debounce((value: number) => {
      this.emit('change', { value });
      announceToScreenReader(`${this.labelElement.textContent}: ${value}`);
    }, 100);

    this.sliderElement.addEventListener('input', (event) => {
      const value = parseFloat(this.sliderElement.value);
      this.updateValueDisplay(value);
      this.emit('input', { value });
    });

    this.sliderElement.addEventListener('change', (event) => {
      const value = parseFloat(this.sliderElement.value);
      debouncedChange(value);
    });

    // Touch support for mobile devices
    let isDragging = false;

    this.sliderElement.addEventListener('touchstart', () => {
      isDragging = true;
      this.sliderElement.classList.add('ui-slider--active');
    });

    this.sliderElement.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        this.sliderElement.classList.remove('ui-slider--active');
      }
    });
  }

  private updateValueDisplay(value: number, unit?: string): void {
    this.valueElement.textContent = unit ? `${value}${unit}` : value.toString();
  }

  getValue(): number {
    return parseFloat(this.sliderElement.value);
  }

  setValue(value: number): this {
    this.sliderElement.value = value.toString();
    this.updateValueDisplay(value);
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.sliderElement.disabled = !enabled;
    this.element.classList.toggle('ui-slider-container--disabled', !enabled);
    return this;
  }
}

/**
 * Toggle switch component.
 */
export class Toggle extends BaseComponent<{ change: { value: boolean } }> {
  private toggleElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;

  constructor(options: {
    label: string;
    value: boolean;
    disabled?: boolean;
  }) {
    super('div', 'ui-toggle-container');

    this.toggleElement = document.createElement('input');
    this.toggleElement.type = 'checkbox';
    this.toggleElement.className = 'ui-toggle';
    this.toggleElement.checked = options.value;

    this.labelElement = document.createElement('label');
    this.labelElement.className = 'ui-toggle__label';
    this.labelElement.textContent = options.label;

    if (options.disabled) {
      this.setEnabled(false);
    }

    this.setupEventHandlers();

    this.element.appendChild(this.toggleElement);
    this.element.appendChild(this.labelElement);

    // Make label clickable
    this.labelElement.addEventListener('click', () => {
      if (!this.toggleElement.disabled) {
        this.toggleElement.checked = !this.toggleElement.checked;
        this.emit('change', { value: this.toggleElement.checked });
      }
    });
  }

  private setupEventHandlers(): void {
    this.toggleElement.addEventListener('change', () => {
      this.emit('change', { value: this.toggleElement.checked });
      announceToScreenReader(`${this.labelElement.textContent}: ${this.toggleElement.checked ? 'on' : 'off'}`);
    });

    // Keyboard support
    this.toggleElement.addEventListener('keydown', createKeyboardHandler({
      'Space': () => {
        this.toggleElement.checked = !this.toggleElement.checked;
        this.emit('change', { value: this.toggleElement.checked });
      }
    }));
  }

  getValue(): boolean {
    return this.toggleElement.checked;
  }

  setValue(value: boolean): this {
    this.toggleElement.checked = value;
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.toggleElement.disabled = !enabled;
    this.element.classList.toggle('ui-toggle-container--disabled', !enabled);
    return this;
  }
}

/**
 * Select dropdown component.
 */
export class Select extends BaseComponent<{ change: { value: string | number } }> {
  private selectElement: HTMLSelectElement;
  private labelElement: HTMLLabelElement;

  constructor(options: {
    label: string;
    value: string | number;
    options: Array<{ value: string | number; label: string }>;
    disabled?: boolean;
  }) {
    super('div', 'ui-select-container');

    this.labelElement = document.createElement('label');
    this.labelElement.className = 'ui-select__label';
    this.labelElement.textContent = options.label;

    this.selectElement = document.createElement('select');
    this.selectElement.className = 'ui-select';

    // Add options
    for (const option of options.options) {
      const optionElement = document.createElement('option');
      optionElement.value = option.value.toString();
      optionElement.textContent = option.label;
      if (option.value === options.value) {
        optionElement.selected = true;
      }
      this.selectElement.appendChild(optionElement);
    }

    if (options.disabled) {
      this.setEnabled(false);
    }

    this.setupEventHandlers();

    this.element.appendChild(this.labelElement);
    this.element.appendChild(this.selectElement);
  }

  private setupEventHandlers(): void {
    this.selectElement.addEventListener('change', () => {
      const value = this.selectElement.value;
      const numericValue = parseFloat(value);
      const finalValue = isNaN(numericValue) ? value : numericValue;

      this.emit('change', { value: finalValue });
      announceToScreenReader(`${this.labelElement.textContent}: ${this.selectElement.selectedOptions[0].textContent}`);
    });
  }

  getValue(): string | number {
    const value = this.selectElement.value;
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? value : numericValue;
  }

  setValue(value: string | number): this {
    this.selectElement.value = value.toString();
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.selectElement.disabled = !enabled;
    this.element.classList.toggle('ui-select-container--disabled', !enabled);
    return this;
  }

  setOptions(options: Array<{ value: string | number; label: string }>): this {
    this.selectElement.innerHTML = '';

    for (const option of options) {
      const optionElement = document.createElement('option');
      optionElement.value = option.value.toString();
      optionElement.textContent = option.label;
      this.selectElement.appendChild(optionElement);
    }

    return this;
  }
}

/**
 * Color picker component.
 */
export class ColorPicker extends BaseComponent<{ change: { value: string } }> {
  private colorElement: HTMLInputElement;
  private labelElement: HTMLLabelElement;
  private previewElement: HTMLSpanElement;

  constructor(options: {
    label: string;
    value: string;
    disabled?: boolean;
  }) {
    super('div', 'ui-color-picker-container');

    this.labelElement = document.createElement('label');
    this.labelElement.className = 'ui-color-picker__label';
    this.labelElement.textContent = options.label;

    this.colorElement = document.createElement('input');
    this.colorElement.type = 'color';
    this.colorElement.className = 'ui-color-picker';
    this.colorElement.value = options.value;

    this.previewElement = document.createElement('span');
    this.previewElement.className = 'ui-color-picker__preview';
    this.previewElement.style.backgroundColor = options.value;

    if (options.disabled) {
      this.setEnabled(false);
    }

    this.setupEventHandlers();

    this.element.appendChild(this.labelElement);
    this.element.appendChild(this.colorElement);
    this.element.appendChild(this.previewElement);
  }

  private setupEventHandlers(): void {
    this.colorElement.addEventListener('input', () => {
      const value = this.colorElement.value;
      this.previewElement.style.backgroundColor = value;
    });

    this.colorElement.addEventListener('change', () => {
      const value = this.colorElement.value;
      this.emit('change', { value });
      announceToScreenReader(`${this.labelElement.textContent}: ${value}`);
    });
  }

  getValue(): string {
    return this.colorElement.value;
  }

  setValue(value: string): this {
    this.colorElement.value = value;
    this.previewElement.style.backgroundColor = value;
    return this;
  }

  setEnabled(enabled: boolean): this {
    this.colorElement.disabled = !enabled;
    this.element.classList.toggle('ui-color-picker-container--disabled', !enabled);
    return this;
  }
}

/**
 * Panel component for grouping related controls.
 */
export class Panel extends BaseComponent<{ toggle: { expanded: boolean } }> {
  private headerElement: HTMLElement;
  private contentElement: HTMLElement;
  private titleElement: HTMLElement;
  private toggleButton: HTMLButtonElement | null = null;
  private isExpanded = true;

  constructor(options: {
    title: string;
    collapsible?: boolean;
    expanded?: boolean;
    className?: string;
  }) {
    super('div', `ui-panel ${options.className || ''}`);

    this.isExpanded = options.expanded !== false;

    this.headerElement = document.createElement('div');
    this.headerElement.className = 'ui-panel__header';

    this.titleElement = document.createElement('h3');
    this.titleElement.className = 'ui-panel__title';
    this.titleElement.textContent = options.title;

    this.contentElement = document.createElement('div');
    this.contentElement.className = 'ui-panel__content';

    if (options.collapsible) {
      this.toggleButton = document.createElement('button');
      this.toggleButton.className = 'ui-panel__toggle';
      this.toggleButton.textContent = this.isExpanded ? '▼' : '▶';
      this.toggleButton.setAttribute('aria-label', `Toggle ${options.title} panel`);
      this.setupToggleHandler();
      this.headerElement.appendChild(this.toggleButton);
    }

    this.headerElement.appendChild(this.titleElement);
    this.element.appendChild(this.headerElement);
    this.element.appendChild(this.contentElement);

    this.updateExpandedState();
  }

  private setupToggleHandler(): void {
    if (!this.toggleButton) return;

    this.toggleButton.addEventListener('click', () => {
      this.toggle();
    });

    this.headerElement.addEventListener('keydown', createKeyboardHandler({
      'Enter': () => this.toggle(),
      'Space': () => this.toggle()
    }));
  }

  toggle(): this {
    this.isExpanded = !this.isExpanded;
    this.updateExpandedState();
    this.emit('toggle', { expanded: this.isExpanded });
    return this;
  }

  expand(): this {
    if (!this.isExpanded) {
      this.toggle();
    }
    return this;
  }

  collapse(): this {
    if (this.isExpanded) {
      this.toggle();
    }
    return this;
  }

  private updateExpandedState(): void {
    this.element.classList.toggle('ui-panel--collapsed', !this.isExpanded);
    this.contentElement.style.display = this.isExpanded ? '' : 'none';

    if (this.toggleButton) {
      this.toggleButton.textContent = this.isExpanded ? '▼' : '▶';
      this.toggleButton.setAttribute('aria-expanded', this.isExpanded.toString());
    }
  }

  addContent(content: HTMLElement | BaseComponent<any>): this {
    const element = content instanceof BaseComponent ? content.getElement() : content;
    this.contentElement.appendChild(element);
    return this;
  }

  clearContent(): this {
    this.contentElement.innerHTML = '';
    return this;
  }

  setTitle(title: string): this {
    this.titleElement.textContent = title;
    return this;
  }
}

/**
 * Metrics display component.
 */
export class MetricsDisplay extends BaseComponent<{}> {
  private metrics: Array<{ label: string; value: string; element: HTMLElement }> = [];

  constructor(options: {
    title?: string;
    className?: string;
  } = {}) {
    super('div', `ui-metrics-display ${options.className || ''}`);

    if (options.title) {
      const title = document.createElement('h4');
      title.className = 'ui-metrics-display__title';
      title.textContent = options.title;
      this.element.appendChild(title);
    }
  }

  addMetric(label: string, initialValue = '—'): this {
    const metricElement = document.createElement('div');
    metricElement.className = 'ui-metrics-display__metric';

    const labelElement = document.createElement('span');
    labelElement.className = 'ui-metrics-display__label';
    labelElement.textContent = label + ':';

    const valueElement = document.createElement('span');
    valueElement.className = 'ui-metrics-display__value';
    valueElement.textContent = initialValue;

    metricElement.appendChild(labelElement);
    metricElement.appendChild(valueElement);
    this.element.appendChild(metricElement);

    this.metrics.push({
      label,
      value: initialValue,
      element: valueElement
    });

    return this;
  }

  updateMetric(label: string, value: string): this {
    const metric = this.metrics.find(m => m.label === label);
    if (metric) {
      metric.value = value;
      metric.element.textContent = value;
    }
    return this;
  }

  updateMetrics(values: Record<string, string>): this {
    for (const [label, value] of Object.entries(values)) {
      this.updateMetric(label, value);
    }
    return this;
  }

  clearMetrics(): this {
    for (const metric of this.metrics) {
      metric.element.textContent = '—';
      metric.value = '—';
    }
    return this;
  }
}

/**
 * Configuration panel factory for creating UI from ConfigOption arrays.
 */
export class ConfigurationPanel extends Panel {
  private controls = new Map<string, BaseComponent<any>>();

  constructor(options: {
    title: string;
    configOptions: ConfigOption[];
    onConfigChange: (config: Record<string, any>) => void;
    initialValues?: Record<string, any>;
  }) {
    super({
      title: options.title,
      collapsible: true,
      expanded: false,
      className: 'ui-configuration-panel'
    });

    this.buildControls(options.configOptions, options.onConfigChange, options.initialValues);
  }

  private buildControls(
    configOptions: ConfigOption[],
    onConfigChange: (config: Record<string, any>) => void,
    initialValues: Record<string, any> = {}
  ): void {
    const currentConfig = { ...initialValues };

    for (const option of configOptions) {
      let control: BaseComponent<any> | null = null;
      const initialValue = initialValues[option.id] !== undefined ? initialValues[option.id] : option.value;

      switch (option.type) {
        case 'slider':
          control = new Slider({
            label: option.label,
            min: option.min || 0,
            max: option.max || 100,
            value: initialValue as number,
            step: option.step || 1
          });
          break;

        case 'toggle':
          control = new Toggle({
            label: option.label,
            value: initialValue as boolean
          });
          break;

        case 'select':
          control = new Select({
            label: option.label,
            value: initialValue,
            options: option.options || []
          });
          break;

        case 'color':
          control = new ColorPicker({
            label: option.label,
            value: initialValue as string
          });
          break;
      }

      if (control) {
        control.on('change', ({ value }) => {
          currentConfig[option.id] = value;
          onConfigChange({ ...currentConfig });
        });

        this.addContent(control);
        this.controls.set(option.id, control);
      }
    }
  }

  getControl<T extends BaseComponent<any>>(id: string): T | null {
    return (this.controls.get(id) as T) || null;
  }

  updateConfiguration(config: Record<string, any>): this {
    for (const [id, value] of Object.entries(config)) {
      const control = this.controls.get(id);
      if (control && 'setValue' in control) {
        (control as any).setValue(value);
      }
    }
    return this;
  }

  destroy(): void {
    for (const control of this.controls.values()) {
      control.destroy();
    }
    this.controls.clear();
    super.destroy();
  }
}

/**
 * Code viewer component for displaying examples.
 */
export class CodeViewer extends BaseComponent<{}> {
  private codeElement: HTMLElement;
  private headerElement: HTMLElement;
  private copyButton: Button;

  constructor(options: {
    title: string;
    language: string;
    code: string;
    className?: string;
  }) {
    super('div', `ui-code-viewer ${options.className || ''}`);

    this.headerElement = document.createElement('div');
    this.headerElement.className = 'ui-code-viewer__header';

    const titleElement = document.createElement('h4');
    titleElement.className = 'ui-code-viewer__title';
    titleElement.textContent = options.title;

    const languageElement = document.createElement('span');
    languageElement.className = 'ui-code-viewer__language';
    languageElement.textContent = options.language;

    this.copyButton = new Button('📋', {
      variant: 'ghost',
      size: 'small',
      ariaLabel: 'Copy code to clipboard'
    });

    this.copyButton.on('click', () => {
      this.copyToClipboard(options.code);
    });

    this.headerElement.appendChild(titleElement);
    this.headerElement.appendChild(languageElement);
    this.headerElement.appendChild(this.copyButton.getElement());

    this.codeElement = document.createElement('pre');
    this.codeElement.className = 'ui-code-viewer__code';

    const codeContent = document.createElement('code');
    codeContent.className = `language-${options.language}`;
    codeContent.textContent = options.code;

    this.codeElement.appendChild(codeContent);

    this.element.appendChild(this.headerElement);
    this.element.appendChild(this.codeElement);
  }

  private async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      announceToScreenReader('Code copied to clipboard');

      // Visual feedback
      this.copyButton.setText('✓');
      setTimeout(() => {
        this.copyButton.setText('📋');
      }, 2000);

    } catch (error) {
      console.warn('Failed to copy to clipboard:', error);
      announceToScreenReader('Failed to copy code');
    }
  }

  setCode(code: string, language?: string): this {
    const codeContent = this.codeElement.querySelector('code');
    if (codeContent) {
      codeContent.textContent = code;
      if (language) {
        codeContent.className = `language-${language}`;
      }
    }
    return this;
  }

  destroy(): void {
    this.copyButton.destroy();
    super.destroy();
  }
}