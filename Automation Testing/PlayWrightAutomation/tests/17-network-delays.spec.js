const { test, expect } = require('@playwright/test');

test.describe('Network Delays and Timeout Handling', () => {
  
  test('Handle slow network responses with custom timeout', async ({ page }) => {
    // Set custom timeout for this test
    test.setTimeout(60000);
    
    // Navigate with extended timeout
    await page.goto('https://httpbin.org/delay/3', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Verify page loaded despite delay
    await expect(page).toHaveTitle(/httpbin/i);
  });

  test('Handle network throttling simulation', async ({ page, context }) => {
    // Simulate slow 3G network
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 40 // 40ms latency
    });

    const startTime = Date.now();
    await page.goto('https://example.com');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page loaded in ${loadTime}ms with throttled network`);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Handle request timeouts gracefully', async ({ page }) => {
    // Set shorter timeout to test timeout handling
    page.setDefaultTimeout(5000);
    
    try {
      // This should timeout
      await page.goto('https://httpbin.org/delay/10', { timeout: 3000 });
    } catch (error) {
      expect(error.message).toContain('Timeout');
      console.log('Successfully caught timeout error:', error.message);
    }
  });

  test('Wait for slow loading elements with retry mechanism', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    
    // Click start button
    await page.click('#start button');
    
    // Wait for loading to complete with custom timeout
    await page.waitForSelector('#loading', { state: 'hidden', timeout: 10000 });
    
    // Verify final element appears
    const finishElement = page.locator('#finish h4');
    await expect(finishElement).toBeVisible({ timeout: 15000 });
    await expect(finishElement).toHaveText('Hello World!');
  });

  test('Handle multiple concurrent slow requests', async ({ page }) => {
    const responses = [];
    
    // Listen for all responses
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        timing: response.timing()
      });
    });

    // Navigate to page with multiple slow resources
    await page.goto('https://httpbin.org/delay/2');
    
    // Make additional slow requests
    const promises = [
      page.request.get('https://httpbin.org/delay/1'),
      page.request.get('https://httpbin.org/delay/2'),
      page.request.get('https://httpbin.org/delay/3')
    ];

    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Request ${index + 1} completed with status:`, result.value.status());
      } else {
        console.log(`Request ${index + 1} failed:`, result.reason);
      }
    });
  });

  test('Test connection retry on network failure', async ({ page }) => {
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Connection attempt ${attempts}/${maxAttempts}`);
        
        await page.goto('https://httpstat.us/500', { 
          timeout: 10000,
          waitUntil: 'domcontentloaded'
        });
        
        // If we get here, the request succeeded
        break;
      } catch (error) {
        if (attempts === maxAttempts) {
          console.log('All retry attempts failed');
          expect(error.message).toContain('500');
        } else {
          console.log(`Attempt ${attempts} failed, retrying...`);
          await page.waitForTimeout(2000); // Wait before retry
        }
      }
    }
  });

  test('Handle progressive loading with multiple wait conditions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/2');
    
    // Click start and wait for multiple conditions
    await page.click('#start button');
    
    // Wait for loading indicator to disappear AND content to appear
    await Promise.all([
      page.waitForSelector('#loading', { state: 'hidden' }),
      page.waitForSelector('#finish', { state: 'visible' }),
      page.waitForFunction(() => {
        const element = document.querySelector('#finish h4');
        return element && element.textContent === 'Hello World!';
      })
    ]);
    
    await expect(page.locator('#finish h4')).toBeVisible();
  });
});