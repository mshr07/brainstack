// global-setup.js
const { chromium } = require('@playwright/test');

async function globalSetup(config) {
  console.log('🚀 Starting global setup...');
  
  // Create a global browser instance for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Pre-warm commonly used test sites
    console.log('🔥 Pre-warming test sites...');
    
    const testSites = [
      'https://the-internet.herokuapp.com/',
      'https://httpbin.org/',
      'https://example.com/'
    ];
    
    for (const site of testSites) {
      try {
        await page.goto(site, { timeout: 10000 });
        console.log(`✅ Pre-warmed: ${site}`);
      } catch (error) {
        console.log(`⚠️  Failed to pre-warm ${site}: ${error.message}`);
      }
    }
    
    // Set up test data or authentication tokens if needed
    console.log('📝 Setting up test data...');
    
    // Example: Create test data in localStorage or sessionStorage
    await page.goto('https://example.com');
    await page.evaluate(() => {
      localStorage.setItem('testSetupComplete', 'true');
      localStorage.setItem('testStartTime', Date.now().toString());
    });
    
    console.log('✅ Global setup completed successfully');
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

module.exports = globalSetup;