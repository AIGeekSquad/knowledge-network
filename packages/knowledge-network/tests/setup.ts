/**
 * Test setup file for JSDOM environment
 * This ensures DOM globals are available for all tests
 */

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Additional DOM setup if needed
  // The JSDOM environment is already configured in vitest.config.ts
  console.log('DOM environment initialized');

  if (typeof window !== 'undefined') {
    // Mock SVGSVGElement.getBBox for JSDOM
    if (!('getBBox' in window.SVGSVGElement.prototype)) {
      Object.defineProperty(window.SVGSVGElement.prototype, 'getBBox', {
        value: () => ({
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        }),
        writable: true,
      });
    }

    // Mock ownerSVGElement for JSDOM
    if (!('ownerSVGElement' in window.SVGElement.prototype)) {
      Object.defineProperty(window.SVGElement.prototype, 'ownerSVGElement', {
        get: function() {
          return this.tagName === 'svg' ? this : this.parentNode;
        },
      });
    }

    // Mock createSVGPoint for JSDOM
    if (!('createSVGPoint' in window.SVGSVGElement.prototype)) {
      Object.defineProperty(window.SVGSVGElement.prototype, 'createSVGPoint', {
        value: function() {
          const point = this.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'svg:point');
          point.x = 0;
          point.y = 0;
          return point;
        },
        writable: true,
      });
    }

    // Mock getScreenCTM for JSDOM
    if (!('getScreenCTM' in window.SVGElement.prototype)) {
      Object.defineProperty(window.SVGElement.prototype, 'getScreenCTM', {
        value: () => ({
          a: 1,
          b: 0,
          c: 0,
          d: 1,
          e: 0,
          f: 0,
        }),
        writable: true,
      });
    }
  }
});