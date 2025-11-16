/**
 * Vitest DOM setup for Demo Suite component testing
 * Configures DOM environment for KnowledgeGraph integration testing
 */

import { vi } from 'vitest';

// Mock DOM environment globals
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class MockHTMLCanvasElement {
    private _width = 800;
    private _height = 600;
    
    getContext(type: string) {
      if (type === '2d') {
        return {
          clearRect: vi.fn(),
          fillRect: vi.fn(),
          strokeRect: vi.fn(),
          arc: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          translate: vi.fn(),
          scale: vi.fn(),
          rotate: vi.fn(),
          setTransform: vi.fn(),
          canvas: this,
          fillStyle: '#000000',
          strokeStyle: '#000000',
          lineWidth: 1,
          globalAlpha: 1
        };
      }
      return null;
    }
    
    get width() { return this._width; }
    set width(val: number) { this._width = val; }
    get height() { return this._height; }
    set height(val: number) { this._height = val; }
    
    toDataURL() { return 'data:image/png;base64,'; }
    getBoundingClientRect() {
      return {
        x: 0,
        y: 0,
        width: this._width,
        height: this._height,
        top: 0,
        left: 0,
        bottom: this._height,
        right: this._width
      };
    }
  }
});

// Mock ResizeObserver for layout testing
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock requestAnimationFrame for animation testing  
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16); // Simulate 60fps
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Console setup for test debugging
console.log('DOM environment initialized for demo-suite testing');