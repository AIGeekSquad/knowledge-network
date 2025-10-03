module.exports = function (wallaby) {
  process.chdir('packages/knowledge-network');
  
  return {
    files: [
      'src/**/*.ts',
      'vitest.config.ts'
    ],
    
    tests: [
      'tests/**/*.test.ts'
    ],

    env: {
      type: 'node'
    },

    setup: function() {
      // Set up JSDOM environment
      const { JSDOM } = require('jsdom');
      
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
      });

      // Set up DOM globals
      global.window = dom.window;
      global.document = dom.window.document;
      global.navigator = dom.window.navigator;
      global.HTMLElement = dom.window.HTMLElement;
      global.SVGElement = dom.window.SVGElement;
      global.Element = dom.window.Element;
      global.Node = dom.window.Node;
      global.DocumentFragment = dom.window.DocumentFragment;
      global.HTMLDivElement = dom.window.HTMLDivElement;
    },

    testFramework: 'vitest'
  };
};
