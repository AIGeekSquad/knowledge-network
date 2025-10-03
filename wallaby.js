module.exports = function (wallaby) {
  process.chdir('packages/knowledge-network');
  
  return {
    files: [
      'src/**/*.ts',
      '!src/**/*.test.ts',
      'vitest.config.ts',
      'tsconfig.json'
    ],
    
    tests: [
      'tests/**/*.test.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'vitest',

    // TypeScript support using @swc/core
    preprocessors: {
      '**/*.ts': (file) =>
        require('@swc/core').transformSync(file.content, {
          jsc: {
            parser: {
              syntax: 'typescript',
              tsx: false,
              decorators: false,
              dynamicImport: true,
            },
            target: 'es2022',
            loose: false,
            externalHelpers: false,
            keepClassNames: false,
            transform: null,
            baseUrl: '.',
          },
          module: {
            type: 'es6',
          },
          sourceMaps: 'inline',
          isModule: true,
        }).code,
    },

    // Set up JSDOM environment manually BEFORE tests run
    setup: function (wallaby) {
      // Set up JSDOM environment
      const { JSDOM } = require('jsdom');
      
      const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost',
        pretendToBeVisual: true,
        resources: 'usable'
      });

      // Attach DOM globals to the global object
      global.window = dom.window;
      global.document = dom.window.document;
      global.navigator = dom.window.navigator;
      global.HTMLElement = dom.window.HTMLElement;
      global.SVGElement = dom.window.SVGElement;
      global.Element = dom.window.Element;
      global.Node = dom.window.Node;
      global.DocumentFragment = dom.window.DocumentFragment;
      global.HTMLDivElement = dom.window.HTMLDivElement;
      
      // Set up additional DOM properties that might be needed
      global.getComputedStyle = dom.window.getComputedStyle;
      global.requestAnimationFrame = dom.window.requestAnimationFrame || function(fn) { return setTimeout(fn, 16); };
      global.cancelAnimationFrame = dom.window.cancelAnimationFrame || function(id) { clearTimeout(id); };
      
      console.log('JSDOM setup completed. Document available:', typeof global.document);
    }
  };
};
