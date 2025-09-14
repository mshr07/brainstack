const { test, expect } = require('@playwright/test');

test.describe('Playwright Wait Methods', () => {
  
  test('waitForSelector - Wait for elements to appear', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    
    // Click start button
    await page.click('#start button');
    
    // Wait for loading element to appear
    await page.waitForSelector('#loading', { timeout: 5000 });
    
    // Wait for loading element to disappear
    await page.waitForSelector('#loading', { 
      state: 'hidden', 
      timeout: 10000 
    });
    
    // Wait for final element to appear
    await page.waitForSelector('#finish h4', { 
      state: 'visible',
      timeout: 10000 
    });
    
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
  });

  test('waitForResponse - Wait for specific API responses', async ({ page }) => {
    // Start listening for response before navigation
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('httpbin.org') && response.status() === 200
    );
    
    await page.goto('https://httpbin.org/json');
    
    // Wait for the response
    const response = await responsePromise;
    const responseBody = await response.json();
    
    console.log('Response received:', response.url());
    console.log('Response status:', response.status());
    console.log('Response body:', responseBody);
    
    expect(response.status()).toBe(200);
    expect(responseBody).toHaveProperty('slideshow');
  });

  test('waitForRequest - Wait for specific requests', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Start listening for request before triggering it
    const requestPromise = page.waitForRequest(request => 
      request.url().includes('/authenticate') && 
      request.method() === 'POST'
    );
    
    // Fill form and submit
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');
    
    // Wait for the request
    const request = await requestPromise;
    
    console.log('Request URL:', request.url());
    console.log('Request method:', request.method());
    console.log('Request headers:', await request.allHeaders());
    
    expect(request.method()).toBe('POST');
  });

  test('waitForFunction - Wait for custom conditions', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_content');
    
    // Wait for specific condition to be met
    await page.waitForFunction(() => {
      const images = document.querySelectorAll('#content .row img');
      return images.length >= 3 && 
             Array.from(images).every(img => img.complete);
    }, {}, { timeout: 10000 });
    
    // Wait for custom JavaScript condition
    await page.waitForFunction(() => {
      return document.readyState === 'complete' && 
             window.jQuery !== undefined;
    }, {}, { timeout: 5000, polling: 100 });
    
    // Wait with parameters
    const targetCount = 3;
    await page.waitForFunction((count) => {
      return document.querySelectorAll('#content .row').length >= count;
    }, targetCount, { timeout: 10000 });
    
    const rowCount = await page.locator('#content .row').count();
    expect(rowCount).toBeGreaterThanOrEqual(3);
  });

  test('waitForEvent - Wait for page events', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/windows');
    
    // Wait for new page to be created
    const newPagePromise = page.waitForEvent('popup');
    
    await page.click('a[href="/windows/new"]');
    
    // Get the new page
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    
    // Verify new page content
    await expect(newPage.locator('h3')).toHaveText('New Window');
    
    await newPage.close();
  });

  test('waitForURL - Wait for URL changes', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Fill and submit form
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');
    
    // Wait for URL to change
    await page.waitForURL(/secure/, { timeout: 10000 });
    
    // Verify we're on the secure page
    expect(page.url()).toContain('/secure');
    await expect(page.locator('h2')).toHaveText('Secure Area');
  });

  test('waitForLoadState - Wait for different load states', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://the-internet.herokuapp.com/dynamic_content');
    
    // Wait for DOM content to be loaded
    await page.waitForLoadState('domcontentloaded');
    const domLoadTime = Date.now() - startTime;
    console.log(`DOM loaded in ${domLoadTime}ms`);
    
    // Wait for all resources to load
    await page.waitForLoadState('load');
    const fullLoadTime = Date.now() - startTime;
    console.log(`All resources loaded in ${fullLoadTime}ms`);
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    const networkIdleTime = Date.now() - startTime;
    console.log(`Network idle after ${networkIdleTime}ms`);
    
    expect(fullLoadTime).toBeGreaterThan(domLoadTime);
  });

  test('waitForTimeout - Simple delay (use sparingly)', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/2');
    
    await page.click('#start button');
    
    // Wait for loading to start (better to use waitForSelector in real tests)
    await page.waitForTimeout(1000);
    
    // Verify loading is happening
    await expect(page.locator('#loading')).toBeVisible();
    
    // Wait for completion with proper wait method
    await page.waitForSelector('#finish h4', { timeout: 10000 });
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
  });

  test('Multiple wait conditions with Promise.all', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    
    await page.click('#start button');
    
    // Wait for multiple conditions simultaneously
    await Promise.all([
      page.waitForSelector('#loading', { state: 'visible' }),
      page.waitForFunction(() => {
        const loading = document.querySelector('#loading');
        return loading && loading.style.display !== 'none';
      })
    ]);
    
    // Wait for completion conditions
    await Promise.all([
      page.waitForSelector('#loading', { state: 'hidden' }),
      page.waitForSelector('#finish h4', { state: 'visible' }),
      page.waitForFunction(() => {
        return document.querySelector('#finish h4')?.textContent === 'Hello World!';
      })
    ]);
    
    await expect(page.locator('#finish h4')).toBeVisible();
  });

  test('Race conditions with Promise.race', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    
    await page.click('#start button');
    
    // Race between different wait conditions
    const result = await Promise.race([
      page.waitForSelector('#finish h4', { timeout: 15000 }).then(() => 'success'),
      page.waitForSelector('#error', { timeout: 15000 }).then(() => 'error'),
      page.waitForTimeout(10000).then(() => 'timeout')
    ]);
    
    console.log('Race result:', result);
    expect(['success', 'error', 'timeout']).toContain(result);
  });

  test('waitForCondition with polling intervals', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_content');
    
    let checkCount = 0;
    
    // Wait with custom polling
    await page.waitForFunction(() => {
      window.checkCount = (window.checkCount || 0) + 1;
      console.log(`Check #${window.checkCount}`);
      
      const images = document.querySelectorAll('#content img');
      return images.length >= 3 && 
             Array.from(images).every(img => img.complete && img.naturalHeight > 0);
    }, {}, { 
      timeout: 15000, 
      polling: 500  // Check every 500ms
    });
    
    const finalCheckCount = await page.evaluate(() => window.checkCount);
    console.log(`Total checks performed: ${finalCheckCount}`);
    
    expect(finalCheckCount).toBeGreaterThan(0);
  });

  test('waitForFileChooser - Wait for file upload dialogs', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/upload');
    
    // Start listening for file chooser before clicking
    const fileChooserPromise = page.waitForEvent('filechooser');
    
    // Click the file input
    await page.click('#file-upload');
    
    // Handle the file chooser
    const fileChooser = await fileChooserPromise;
    
    // In a real test, you might set files here
    // await fileChooser.setFiles(['path/to/file.txt']);
    
    expect(fileChooser).toBeDefined();
    expect(fileChooser.isMultiple()).toBeFalsy();
  });

  test('waitForDownload - Wait for file downloads', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/download');
    
    // Start listening for download before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click on a download link (get first available file)
    const firstDownloadLink = page.locator('a[href^="/download/"]').first();
    await firstDownloadLink.click();
    
    // Wait for download to start
    const download = await downloadPromise;
    
    console.log('Download started:', download.suggestedFilename());
    
    // Verify download properties
    expect(download.suggestedFilename()).toBeTruthy();
    
    // In a real test, you might save the file
    // await download.saveAs('path/to/save/' + download.suggestedFilename());
  });

  test('Custom wait with retry logic', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_content');
    
    // Custom wait function with retry logic
    async function waitForConditionWithRetry(condition, maxAttempts = 5, delay = 1000) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const result = await condition();
          if (result) {
            console.log(`Condition met on attempt ${attempt}`);
            return result;
          }
        } catch (error) {
          console.log(`Attempt ${attempt} failed:`, error.message);
        }
        
        if (attempt < maxAttempts) {
          await page.waitForTimeout(delay);
        }
      }
      throw new Error(`Condition not met after ${maxAttempts} attempts`);
    }
    
    // Use custom wait function
    const result = await waitForConditionWithRetry(async () => {
      const imageCount = await page.locator('#content img').count();
      return imageCount >= 3;
    });
    
    expect(result).toBeTruthy();
    await expect(page.locator('#content img')).toHaveCount(3);
  });
});