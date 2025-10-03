import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['dist/', 'node_modules/', '**/*.config.ts', '**/*.test.ts'],
    },
  },
});
