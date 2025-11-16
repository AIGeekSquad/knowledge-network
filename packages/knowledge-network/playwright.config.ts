import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration for Knowledge Network Library
 * 
 * Tests rendering strategies (Canvas/SVG/WebGL) in real browser environments
 * Validates DOM integration, visual rendering, and cross-strategy consistency
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }]
  ],
  
  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:3001',
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshots on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Coverage collection for SonarQube E2E tracking */
    extraHTTPHeaders: {
      'X-Coverage-Collection': 'enabled'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Knowledge Network specific viewport for consistent testing
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 }
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 }
      },
    },

    /* Test against mobile viewports for responsive behavior */
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'pnpm run dev',
    cwd: '../demo-suite',
    port: 3001,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // Extended timeout for demo server startup
    stdout: 'pipe',
    stderr: 'pipe'
  },

  /* Global test timeout for knowledge graph rendering operations */
  timeout: 30000,

  /* Expect timeout for individual assertions */
  expect: {
    timeout: 10000,
    /* Visual regression testing threshold */
    threshold: 0.2,
  },

  /* Test artifacts configuration */
  outputDir: 'test-results/e2e',
  
  /* Global setup and teardown - commented out until implemented */
  // globalSetup: './tests/e2e/global-setup.ts',
  // globalTeardown: './tests/e2e/global-teardown.ts',
});