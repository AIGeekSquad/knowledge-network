module.exports = function (wallaby) {
  return {
    files: [
      'packages/knowledge-network/src/**/*.ts',
      '!packages/knowledge-network/src/**/*.test.ts',
      'packages/knowledge-network/tsconfig.json',
      'packages/knowledge-network/vitest.config.ts',
      'tsconfig.json',
    ],

    tests: ['packages/knowledge-network/src/**/*.test.ts'],

    env: {
      type: 'node',
    },

    testFramework: 'vitest',

    debug: true,

    // Vitest-specific configuration
    workers: {
      restart: true,
    },

    // TypeScript support
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

    setup: function (wallaby) {
      const path = require('path');
      const { createVitest } = require('vitest/node');

      return createVitest('test', {
        watch: false,
        config: path.join(
          wallaby.projectCacheDir,
          'packages/knowledge-network/vitest.config.ts'
        ),
      });
    },
  };
};
