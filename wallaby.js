module.exports = function (wallaby) {
  process.chdir('packages/knowledge-network');
  
  return {
    files: [
      'src/**/*.ts',
      '!src/**/*.test.ts',
      'vitest.config.ts'
    ],
    
    tests: [
      'tests/**/*.test.ts'
    ],

    env: {
      type: 'node'
    },

    testFramework: 'vitest'
  };
};
