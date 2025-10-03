module.exports = function (wallaby) {
  process.chdir('packages/knowledge-network');
  
  // Set up JSDOM globals immediately
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  // Set up DOM globals before returning config
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.HTMLElement = dom.window.HTMLElement;
  global.SVGElement = dom.window.SVGElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLDivElement = dom.window.HTMLDivElement;

  return {
    files: [
      'src/**/*.ts',
      '!src/**/*.test.ts',
      'vitest.config.ts'
    ],
    
    tests: [
      'src/**/*.test.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'vitest'
  };
};
