const { test, expect } = require('@playwright/test');

test.describe('Browser Window and Viewport Management', () => {
  
  test('Set custom viewport size', async ({ page }) => {
    // Set custom viewport before navigation
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Get viewport size
    const viewportSize = page.viewportSize();
    console.log('Viewport size:', viewportSize);
    
    expect(viewportSize?.width).toBe(1280);
    expect(viewportSize?.height).toBe(720);
    
    // Verify responsive behavior
    const todoApp = page.locator('.todoapp');
    await expect(todoApp).toBeVisible();
  });

  test('Test different viewport sizes for responsive design', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.todoapp')).toBeVisible();
    console.log('Desktop view loaded');
    
    // Tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.todoapp')).toBeVisible();
    console.log('Tablet view loaded');
    
    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.todoapp')).toBeVisible();
    console.log('Mobile view loaded');
    
    // Ultra-wide viewport
    await page.setViewportSize({ width: 2560, height: 1440 });
    await expect(page.locator('.todoapp')).toBeVisible();
    console.log('Ultra-wide view loaded');
  });

  test('Maximize browser window using context options', async ({ browser }) => {
    // Create a new context with maximized window
    const context = await browser.newContext({
      viewport: null // This disables the default viewport
    });
    
    const page = await context.newPage();
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Get the actual viewport size (will be the window size)
    const viewportSize = page.viewportSize();
    console.log('Window viewport size:', viewportSize);
    
    // Verify the page loads correctly
    await expect(page.locator('.todoapp')).toBeVisible();
    
    await context.close();
  });

  test('Dynamic viewport changes during test', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Start with mobile view
    await page.setViewportSize({ width: 360, height: 640 });
    
    // Add a todo in mobile view
    await page.locator('.new-todo').fill('Mobile todo');
    await page.locator('.new-todo').press('Enter');
    
    // Verify todo exists in mobile view
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    
    // Switch to desktop view
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // Verify todo still exists after viewport change
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    
    // Add another todo in desktop view
    await page.locator('.new-todo').fill('Desktop todo');
    await page.locator('.new-todo').press('Enter');
    
    // Verify both todos exist
    await expect(page.locator('.todo-list li')).toHaveCount(2);
  });

  test('Test viewport with device emulation', async ({ browser }) => {
    // iPhone 13 Pro emulation
    const iPhone13Pro = {
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true
    };
    
    const context = await browser.newContext(iPhone13Pro);
    const page = await context.newPage();
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Verify mobile-specific behavior
    const viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(390);
    expect(viewportSize?.height).toBe(844);
    
    // Test touch interactions
    const todoInput = page.locator('.new-todo');
    await todoInput.tap(); // Use tap instead of click for mobile
    await todoInput.fill('Mobile touch test');
    await todoInput.press('Enter');
    
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    
    await context.close();
  });

  test('Test viewport with different aspect ratios', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Full HD 16:9' },
      { width: 1440, height: 900, name: 'MacBook 16:10' },
      { width: 1366, height: 768, name: 'Laptop 16:9' },
      { width: 1280, height: 1024, name: 'Square 5:4' },
      { width: 2560, height: 1600, name: 'Retina 16:10' }
    ];
    
    for (const viewport of viewports) {
      console.log(`Testing ${viewport.name} - ${viewport.width}x${viewport.height}`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://demo.playwright.dev/todomvc/');
      
      // Verify page elements are visible and properly positioned
      await expect(page.locator('.todoapp')).toBeVisible();
      await expect(page.locator('.new-todo')).toBeVisible();
      
      // Add a test todo to ensure functionality works
      await page.locator('.new-todo').fill(`Test for ${viewport.name}`);
      await page.locator('.new-todo').press('Enter');
      
      await expect(page.locator('.todo-list li')).toHaveCount(1);
      
      // Clear todos for next iteration
      await page.locator('.todo-list li input[type="checkbox"]').check();
      const clearButton = page.locator('text=Clear completed');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    }
  });

  test('Viewport scaling and zoom testing', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Test different device scale factors
    const scaleFactors = [1, 1.5, 2, 2.5];
    
    for (const scaleFactor of scaleFactors) {
      console.log(`Testing scale factor: ${scaleFactor}`);
      
      // Set viewport with scale factor
      await page.setViewportSize({ 
        width: Math.floor(1280 / scaleFactor), 
        height: Math.floor(720 / scaleFactor) 
      });
      
      // Verify elements are still accessible
      await expect(page.locator('.new-todo')).toBeVisible();
      
      // Test interaction at different scales
      await page.locator('.new-todo').fill(`Scaled test ${scaleFactor}x`);
      await page.locator('.new-todo').press('Enter');
      
      const todoItem = page.locator('.todo-list li').first();
      await expect(todoItem).toBeVisible();
      
      // Clean up
      await page.locator('.todo-list li input[type="checkbox"]').check();
      const clearButton = page.locator('text=Clear completed');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    }
  });

  test('Full screen testing', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Simulate full screen (as close as possible in headless mode)
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const viewportSize = page.viewportSize();
    console.log('Full screen viewport:', viewportSize);
    
    // Test that elements are properly positioned in full screen
    const todoApp = page.locator('.todoapp');
    await expect(todoApp).toBeVisible();
    
    // Check element positioning
    const todoAppBox = await todoApp.boundingBox();
    console.log('TodoApp position:', todoAppBox);
    
    await context.close();
  });

  test('Viewport persistence across page navigation', async ({ page }) => {
    // Set initial viewport
    await page.setViewportSize({ width: 800, height: 600 });
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Verify viewport is set
    let viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(800);
    expect(viewportSize?.height).toBe(600);
    
    // Navigate to another page (refresh in this case)
    await page.reload();
    
    // Verify viewport persists
    viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(800);
    expect(viewportSize?.height).toBe(600);
    
    // Navigate to different URL
    await page.goto('https://playwright.dev/');
    
    // Verify viewport still persists
    viewportSize = page.viewportSize();
    expect(viewportSize?.width).toBe(800);
    expect(viewportSize?.height).toBe(600);
  });

  test('Responsive breakpoint testing', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const breakpoints = [
      { width: 320, name: 'Mobile Small' },
      { width: 480, name: 'Mobile Large' },
      { width: 768, name: 'Tablet' },
      { width: 1024, name: 'Desktop Small' },
      { width: 1440, name: 'Desktop Large' },
      { width: 1920, name: 'Desktop XL' }
    ];
    
    for (const breakpoint of breakpoints) {
      console.log(`Testing breakpoint: ${breakpoint.name} (${breakpoint.width}px)`);
      
      await page.setViewportSize({ width: breakpoint.width, height: 800 });
      
      // Wait for any responsive changes to take effect
      await page.waitForTimeout(100);
      
      // Verify core functionality works at all breakpoints
      const todoInput = page.locator('.new-todo');
      await expect(todoInput).toBeVisible();
      
      // Test that input is still functional
      await todoInput.fill(`Breakpoint test ${breakpoint.name}`);
      await todoInput.press('Enter');
      
      const todoItem = page.locator('.todo-list li');
      await expect(todoItem).toHaveCount(1);
      
      // Clean up
      await page.locator('.todo-list li input[type="checkbox"]').check();
      const clearButton = page.locator('text=Clear completed');
      if (await clearButton.isVisible()) {
        await clearButton.click();
      }
    }
  });
});