const { test, expect } = require('@playwright/test');

test.describe('DOM Loading and Dynamic Content', () => {
  
  test('Wait for DOM ready states', async ({ page }) => {
    // Navigate and check different DOM ready states
    await page.goto('https://example.com');
    
    // Check document ready state
    const readyState = await page.evaluate(() => document.readyState);
    console.log('Document ready state:', readyState);
    
    // Wait for DOM content loaded
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for all resources loaded
    await page.waitForLoadState('load');
    
    // Wait for network idle (no network requests for 500ms)
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Handle dynamically loaded content', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_content');
    
    // Get initial content
    const initialContent = await page.locator('#content .row').count();
    console.log('Initial content rows:', initialContent);
    
    // Click to load new content
    await page.click('a[href*="dynamic_content"]');
    
    // Wait for content to change
    await page.waitForFunction(() => {
      return document.querySelector('#content .row img');
    });
    
    // Verify content loaded
    const images = page.locator('#content .row img');
    await expect(images).toHaveCount(3);
    
    // Verify images are actually loaded
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      await expect(images.nth(i)).toBeVisible();
      
      // Check if image is actually loaded
      const isLoaded = await images.nth(i).evaluate((img) => {
        return img.complete && img.naturalHeight !== 0;
      });
      expect(isLoaded).toBeTruthy();
    }
  });

  test('Wait for lazy-loaded images', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_content');
    
    // Scroll to trigger lazy loading (if any)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for all images to load
    await page.waitForFunction(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.every(img => img.complete && img.naturalHeight !== 0);
    });
    
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      await expect(images.nth(i)).toBeVisible();
    }
  });

  test('Handle infinite scroll and dynamic loading', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/infinite_scroll');
    
    let previousHeight = 0;
    let currentHeight = await page.evaluate(() => document.body.scrollHeight);
    
    // Scroll and load content multiple times
    for (let i = 0; i < 3; i++) {
      // Scroll to bottom
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      // Wait for new content to load
      await page.waitForFunction((prevHeight) => {
        return document.body.scrollHeight > prevHeight;
      }, previousHeight);
      
      previousHeight = currentHeight;
      currentHeight = await page.evaluate(() => document.body.scrollHeight);
      
      console.log(`Scroll ${i + 1}: Height changed from ${previousHeight} to ${currentHeight}`);
    }
    
    // Verify content increased
    expect(currentHeight).toBeGreaterThan(previousHeight);
  });

  test('Wait for AJAX content to load', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    
    // Monitor network requests
    const responses = [];
    page.on('response', response => {
      responses.push(response.url());
    });
    
    // Click to trigger AJAX loading
    await page.click('#start button');
    
    // Wait for loading indicator to appear
    await expect(page.locator('#loading')).toBeVisible();
    
    // Wait for AJAX request to complete and content to appear
    await page.waitForSelector('#finish h4', { timeout: 10000 });
    
    // Verify content loaded
    await expect(page.locator('#finish h4')).toHaveText('Hello World!');
    await expect(page.locator('#loading')).toBeHidden();
  });

  test('Handle delayed DOM mutations', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/add_remove_elements/');
    
    // Add multiple elements with delays
    for (let i = 0; i < 3; i++) {
      await page.click('button[onclick="addElement()"]');
      
      // Wait for element to be added to DOM
      await page.waitForSelector(`.added-manually:nth-child(${i + 1})`, { timeout: 5000 });
    }
    
    // Verify all elements are present
    const addedElements = page.locator('.added-manually');
    await expect(addedElements).toHaveCount(3);
    
    // Remove elements and wait for DOM update
    for (let i = 2; i >= 0; i--) {
      await addedElements.nth(i).click();
      
      // Wait for element to be removed from DOM
      await page.waitForFunction((expectedCount) => {
        return document.querySelectorAll('.added-manually').length === expectedCount;
      }, i);
    }
    
    await expect(addedElements).toHaveCount(0);
  });

  test('Wait for CSS animations and transitions to complete', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/dynamic_loading/1');
    
    await page.click('#start button');
    
    // Wait for loading spinner to be visible
    await expect(page.locator('#loading')).toBeVisible();
    
    // Wait for animation/loading to complete
    await page.waitForSelector('#loading', { state: 'hidden' });
    
    // Wait for result element to fully appear (may have fade-in animation)
    const resultElement = page.locator('#finish h4');
    await expect(resultElement).toBeVisible();
    
    // Verify element is fully loaded and styled
    const opacity = await resultElement.evaluate(el => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(opacity)).toBeGreaterThan(0.9);
  });

  test('Handle form validation and dynamic error messages', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/login');
    
    // Try to submit form without credentials
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear dynamically
    const errorMessage = page.locator('#flash');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });
    
    // Verify error message content
    await expect(errorMessage).toContainText('Your username is invalid!');
    
    // Fill form with valid data
    await page.fill('#username', 'tomsmith');
    await page.fill('#password', 'SuperSecretPassword!');
    await page.click('button[type="submit"]');
    
    // Wait for success message
    await expect(errorMessage).toContainText('You logged into a secure area!');
  });

  test('Wait for third-party scripts and widgets to load', async ({ page }) => {
    // Create a test page with simulated third-party content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Third-party Loading Test</title>
      </head>
      <body>
        <div id="widget-container"></div>
        <script>
          // Simulate third-party widget loading with delay
          setTimeout(() => {
            const widget = document.createElement('div');
            widget.id = 'third-party-widget';
            widget.textContent = 'Widget Loaded!';
            document.getElementById('widget-container').appendChild(widget);
          }, 2000);
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Wait for third-party widget to load
    await page.waitForSelector('#third-party-widget', { timeout: 10000 });
    
    // Verify widget content
    await expect(page.locator('#third-party-widget')).toHaveText('Widget Loaded!');
  });

  test('Handle progressive image loading', async ({ page }) => {
    await page.goto('https://picsum.photos/');
    
    // Navigate to a page with multiple images
    const imageUrls = [
      'https://picsum.photos/200/300?random=1',
      'https://picsum.photos/200/300?random=2',
      'https://picsum.photos/200/300?random=3'
    ];
    
    // Create HTML with multiple images
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        ${imageUrls.map((url, index) => `<img id="img${index}" src="${url}" alt="Test Image ${index}">`).join('')}
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Wait for all images to load
    for (let i = 0; i < imageUrls.length; i++) {
      const img = page.locator(`#img${i}`);
      await expect(img).toBeVisible();
      
      // Wait for image to actually load (not just be visible)
      await img.waitFor({ state: 'attached' });
      const isLoaded = await img.evaluate(img => img.complete && img.naturalHeight !== 0);
      expect(isLoaded).toBeTruthy();
    }
  });
});