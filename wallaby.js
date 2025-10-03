module.exports = function (wallaby) {
  return {
    files: [
      'packages/knowledge-network/src/**/*.ts',
      '!packages/knowledge-network/tests/**/*.test.ts',
      'packages/knowledge-network/vitest.config.ts',
      'packages/knowledge-network/tests/setup.ts'
    ],
    
    tests: [
      'packages/knowledge-network/tests/**/*.test.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'vitest',

    // Let Vitest handle everything including JSDOM setup
    setup: function (wallaby) {
      const path = require('path');
      const { createVitest } = require('vitest/node');

      return createVitest('test', {
        watch: false,
        config: path.join(wallaby.projectCacheDir, 'packages/knowledge-network/vitest.config.ts'),
      });
    }
  };
};
