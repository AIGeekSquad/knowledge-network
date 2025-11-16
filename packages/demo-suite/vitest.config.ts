/**
 * Vitest configuration for Demo Suite component testing
 * Enables DOM environment for proper KnowledgeGraph testing
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});