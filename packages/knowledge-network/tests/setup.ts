/**
 * Test setup file for JSDOM environment
 * This ensures DOM globals are available for all tests
 */

import { beforeAll } from 'vitest';

beforeAll(() => {
  // Additional DOM setup if needed
  // The JSDOM environment is already configured in vitest.config.ts
  console.log('DOM environment initialized');
});