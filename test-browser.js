#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPage() {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Listen for console messages
    page.on('console', msg => {
      console.log('PAGE LOG:', msg.text());
    });

    // Listen for errors
    page.on('error', err => {
      console.log('PAGE ERROR:', err.message);
    });

    console.log('Navigating to http://localhost:3000/...');
    await page.goto('http://localhost:3000/', {
      waitUntil: 'networkidle2',
      timeout: 10000
    });

    // Wait a bit for the page to load
    await page.waitForTimeout(2000);

    console.log('Taking screenshot...');
    await page.screenshot({ path: 'page-screenshot.png', fullPage: true });

    // Check if Enhanced Bundling button exists and click it
    console.log('Looking for Enhanced Bundling button...');
    const button = await page.$('#edge-bundling');
    if (button) {
      console.log('Found Enhanced Bundling button, clicking it...');
      await button.click();
      await page.waitForTimeout(3000); // Wait for rendering

      console.log('Taking screenshot after clicking Enhanced Bundling...');
      await page.screenshot({ path: 'enhanced-bundling-screenshot.png', fullPage: true });
    } else {
      console.log('Enhanced Bundling button not found!');
    }

    // Check for SVG paths (bundled edges)
    const paths = await page.$$eval('svg path', paths => paths.length);
    console.log('Number of SVG paths found:', paths);

    if (paths > 0) {
      // Get the first few path data attributes to see if they're curved
      const pathData = await page.$$eval('svg path', paths =>
        paths.slice(0, 3).map(p => p.getAttribute('d'))
      );
      console.log('Sample path data:');
      pathData.forEach((d, i) => {
        console.log(`Path ${i}:`, d ? d.substring(0, 100) + '...' : 'null');
      });
    }

    await browser.close();
    console.log('Browser test completed. Check page-screenshot.png and enhanced-bundling-screenshot.png');

  } catch (error) {
    console.error('Error testing page:', error.message);
  }
}

testPage();