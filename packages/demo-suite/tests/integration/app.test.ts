/**
 * Integration tests for app composition and DOM interaction
 * These tests should catch real browser issues
 */

import { test, expect } from '@playwright/test';

test.describe('Demo Suite App Integration', () => {
  test('page loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];

    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to the demo
    await page.goto('http://localhost:3000/');

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    // Check for critical errors
    const criticalErrors = errors.filter(err =>
      err.includes('ReferenceError') ||
      err.includes('TypeError') ||
      err.includes('not defined')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('performance overlay exists and is visible', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Wait for demo to initialize
    await page.waitForTimeout(1000);

    // Check if performance overlay exists
    const overlay = await page.locator('#performance-overlay');
    await expect(overlay).toBeVisible();
  });

  test('performance overlay shows FPS values', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Wait for demo to initialize and start measuring FPS
    await page.waitForTimeout(2000);

    // Check if FPS value is displayed
    const fpsElement = await page.locator('#fps-value');
    const fpsText = await fpsElement.textContent();

    // Should not be empty or "--"
    expect(fpsText).not.toBe('--');
    expect(fpsText).not.toBe('');

    // Should be a number
    const fps = parseFloat(fpsText || '0');
    expect(fps).toBeGreaterThan(0);
    expect(fps).toBeLessThan(200); // Reasonable upper bound
  });

  test('double-click toggle functionality works', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Wait for demo to initialize
    await page.waitForTimeout(1000);

    const overlay = await page.locator('#performance-overlay');
    const detailedMetrics = await page.locator('#detailed-metrics');

    // Initially should be hidden
    await expect(detailedMetrics).not.toBeVisible();

    // Double-click to show details
    await overlay.dblclick();
    await expect(detailedMetrics).toBeVisible();

    // Double-click again to hide
    await overlay.dblclick();
    await expect(detailedMetrics).not.toBeVisible();
  });
});