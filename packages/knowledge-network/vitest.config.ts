/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.ts', 'src/**/__tests__/**/*.test.ts'],
    exclude: [
      'tests/e2e/**/*.e2e.ts',
      // Browser-specific tests requiring WebGL, DOMMatrix, or Touch APIs not available in jsdom
      // These tests should be run separately with @playwright/test or in a real browser environment
      'src/rendering/__tests__/WebGLRenderer.test.ts',
      'src/interaction/__tests__/**',
    ],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'dist/',
        'node_modules/',
        '**/*.config.ts',
        '**/*.test.ts',
        'tests/',
        'playwright-report/',
        'test-results/',
      ],
      all: true,
      clean: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
