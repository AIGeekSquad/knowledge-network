import { test, expect } from '@playwright/test';

test.describe('Knowledge Network Demo', () => {
  test('should load demo page', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loaded
    await expect(page).toHaveTitle(/Knowledge Network/i);
  });

  test('should render graph visualization', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the graph container to be visible
    const graphContainer = page.locator('#graph-container, [data-testid="graph-container"], canvas, svg');
    await expect(graphContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check that content is visible on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should have accessible navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility
    const violations = await page.evaluate(async () => {
      // Simple accessibility check
      const images = document.querySelectorAll('img');
      const violations = [];
      
      images.forEach((img) => {
        if (!img.alt) {
          violations.push(`Image without alt text: ${img.src}`);
        }
      });
      
      return violations;
    });
    
    expect(violations).toHaveLength(0);
  });
});
