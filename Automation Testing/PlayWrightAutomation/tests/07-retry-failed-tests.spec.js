const { test, expect } = require('@playwright/test');

test.describe('Test Retry Logic and Failure Handling', () => {
  
  test('Test with automatic retries on failure', async ({ page }) => {
    // This test demonstrates automatic retry behavior
    // Retries are configured in playwright.config.js
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Retry test todo');
    await page.locator('.new-todo').press('Enter');
    
    // This assertion should pass consistently
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    
    console.log('Test passed successfully');
  });

  test('Test with flaky behavior simulation', async ({ page }) => {
    // This test simulates flaky behavior that might require retries
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Flaky test simulation');
    await page.locator('.new-todo').press('Enter');
    
    // Wait a bit to simulate timing issues
    await page.waitForTimeout(Math.random() * 1000);
    
    // This should eventually pass with retries
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toBeVisible({ timeout: 10000 });
    await expect(todoItem.locator('label')).toHaveText('Flaky test simulation');
    
    console.log('Flaky test passed');
  });

  test('Test retry with custom timeout', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo with custom timeout for operations
    await page.locator('.new-todo').fill('Custom timeout test', { timeout: 15000 });
    await page.locator('.new-todo').press('Enter', { timeout: 15000 });
    
    // Wait for element with extended timeout
    const todoItem = page.locator('.todo-list li');
    await todoItem.waitFor({ state: 'visible', timeout: 20000 });
    
    // Verify with custom timeout
    await expect(todoItem).toHaveText('Custom timeout test', { timeout: 15000 });
    
    console.log('Custom timeout test passed');
  });

  test('Test with conditional retry logic', async ({ page }, testInfo) => {
    // Custom retry logic based on test conditions
    let attemptCount = 0;
    const maxAttempts = 3;
    
    while (attemptCount < maxAttempts) {
      try {
        attemptCount++;
        console.log(`Attempt ${attemptCount} of ${maxAttempts}`);
        
        await page.goto('https://demo.playwright.dev/todomvc/');
        
        // Add a todo
        await page.locator('.new-todo').fill(`Conditional retry attempt ${attemptCount}`);
        await page.locator('.new-todo').press('Enter');
        
        // This might fail on purpose for demonstration
        const todoItem = page.locator('.todo-list li');
        await expect(todoItem).toBeVisible({ timeout: 5000 });
        
        console.log(`Attempt ${attemptCount} succeeded`);
        break; // Exit loop on success
        
      } catch (error) {
        console.log(`Attempt ${attemptCount} failed: ${error.message}`);
        
        if (attemptCount >= maxAttempts) {
          throw new Error(`Test failed after ${maxAttempts} attempts`);
        }
        
        // Wait before retry
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Test with soft assertions and retries', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add multiple todos
    const todos = ['Soft assertion test 1', 'Soft assertion test 2', 'Soft assertion test 3'];
    
    for (const todo of todos) {
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }
    
    const todoItems = page.locator('.todo-list li');
    
    // Use soft assertions - test continues even if some fail
    await expect.soft(todoItems).toHaveCount(3);
    
    for (let i = 0; i < todos.length; i++) {
      const todoItem = todoItems.nth(i);
      await expect.soft(todoItem.locator('label')).toHaveText(todos[i]);
    }
    
    // Hard assertion at the end
    await expect(todoItems).toHaveCount(3);
    
    console.log('Soft assertions test completed');
  });

  test('Test retry with network conditions', async ({ page, context }) => {
    // Simulate network issues that might require retries
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Intercept network requests to simulate delays or failures
    await page.route('**/*', async (route) => {
      // Simulate slow network on first attempt
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.continue();
    });
    
    // Add a todo (might be slow due to simulated network delay)
    await page.locator('.new-todo').fill('Network retry test');
    await page.locator('.new-todo').press('Enter');
    
    // Wait for todo to appear with retry logic
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toBeVisible({ timeout: 15000 });
    
    console.log('Network retry test passed');
  });

  test('Test retry with screenshots on failure', async ({ page }, testInfo) => {
    let screenshotTaken = false;
    
    try {
      await page.goto('https://demo.playwright.dev/todomvc/');
      
      await page.locator('.new-todo').fill('Screenshot on failure test');
      await page.locator('.new-todo').press('Enter');
      
      // This should pass
      await expect(page.locator('.todo-list li')).toHaveCount(1);
      
    } catch (error) {
      // Take screenshot on failure
      if (!screenshotTaken) {
        const screenshotPath = `screenshots/failure-${testInfo.title.replace(/\s+/g, '-')}-${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved: ${screenshotPath}`);
        screenshotTaken = true;
      }
      
      throw error;
    }
  });

  test('Test with exponential backoff retry', async ({ page }) => {
    const maxRetries = 3;
    let retryCount = 0;
    
    while (retryCount < maxRetries) {
      try {
        await page.goto('https://demo.playwright.dev/todomvc/');
        
        await page.locator('.new-todo').fill(`Exponential backoff test - attempt ${retryCount + 1}`);
        await page.locator('.new-todo').press('Enter');
        
        // Simulate potential failure point
        const todoItem = page.locator('.todo-list li');
        await expect(todoItem).toBeVisible({ timeout: 3000 });
        
        console.log(`Exponential backoff test passed on attempt ${retryCount + 1}`);
        break;
        
      } catch (error) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error(`Test failed after ${maxRetries} retries`);
        }
        
        // Exponential backoff: wait longer each time
        const waitTime = Math.pow(2, retryCount) * 1000;
        console.log(`Retry ${retryCount} failed, waiting ${waitTime}ms before next attempt`);
        await page.waitForTimeout(waitTime);
      }
    }
  });

  test('Test retry with different browsers', async ({ page, browserName }) => {
    // Test behavior might vary by browser, so retry logic can be browser-specific
    console.log(`Running retry test in ${browserName}`);
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Some browsers might need different handling
    const timeout = browserName === 'webkit' ? 10000 : 5000;
    
    await page.locator('.new-todo').fill(`Browser-specific retry test (${browserName})`);
    await page.locator('.new-todo').press('Enter');
    
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toBeVisible({ timeout });
    
    console.log(`Browser-specific retry test passed in ${browserName}`);
  });

  test('Test with manual retry implementation', async ({ page }) => {
    // Custom retry function
    const retryOperation = async (operation, maxRetries = 3, delay = 1000) => {
      let lastError;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Manual retry attempt ${attempt}/${maxRetries}`);
          await operation();
          return; // Success, exit function
        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed: ${error.message}`);
          
          if (attempt < maxRetries) {
            await page.waitForTimeout(delay);
            delay *= 1.5; // Increase delay for next retry
          }
        }
      }
      
      throw lastError; // Throw the last error if all retries failed
    };
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Use custom retry function
    await retryOperation(async () => {
      await page.locator('.new-todo').fill('Manual retry implementation test');
      await page.locator('.new-todo').press('Enter');
      
      const todoItem = page.locator('.todo-list li');
      await expect(todoItem).toBeVisible({ timeout: 3000 });
      await expect(todoItem.locator('label')).toHaveText('Manual retry implementation test');
    });
    
    console.log('Manual retry implementation test passed');
  });

  test('Test retry with cleanup between attempts', async ({ page }) => {
    const maxAttempts = 3;
    let currentAttempt = 0;
    
    while (currentAttempt < maxAttempts) {
      currentAttempt++;
      
      try {
        console.log(`Cleanup retry attempt ${currentAttempt}/${maxAttempts}`);
        
        // Clean up any previous state
        await page.goto('https://demo.playwright.dev/todomvc/');
        
        // Clear any existing todos (cleanup)
        const existingTodos = page.locator('.todo-list li');
        const count = await existingTodos.count();
        
        if (count > 0) {
          await page.locator('.toggle-all').click(); // Select all
          const clearButton = page.locator('.clear-completed');
          if (await clearButton.isVisible()) {
            await clearButton.click();
          }
        }
        
        // Now perform the actual test
        await page.locator('.new-todo').fill(`Clean retry attempt ${currentAttempt}`);
        await page.locator('.new-todo').press('Enter');
        
        const todoItem = page.locator('.todo-list li');
        await expect(todoItem).toBeVisible({ timeout: 5000 });
        
        console.log(`Clean retry test passed on attempt ${currentAttempt}`);
        break;
        
      } catch (error) {
        console.log(`Attempt ${currentAttempt} failed: ${error.message}`);
        
        if (currentAttempt >= maxAttempts) {
          throw new Error(`Test failed after ${maxAttempts} attempts with cleanup`);
        }
        
        // Additional cleanup before retry
        try {
          await page.reload();
        } catch (reloadError) {
          console.log('Reload failed, continuing...');
        }
        
        await page.waitForTimeout(2000);
      }
    }
  });
});

/**
 * Configuration for retries in playwright.config.js:
 * 
 * module.exports = {
 *   // Global retry configuration
 *   retries: process.env.CI ? 2 : 0, // Retry only on CI
 *   
 *   // Or per project
 *   projects: [
 *     {
 *       name: 'chromium',
 *       use: { ...devices['Desktop Chrome'] },
 *       retries: 1, // Specific retries for this project
 *     }
 *   ],
 *   
 *   // Test timeout (affects retry behavior)
 *   timeout: 30000,
 *   
 *   // Expect timeout (for assertions)
 *   expect: {
 *     timeout: 5000
 *   }
 * }
 * 
 * Environment variable to control retries:
 * PLAYWRIGHT_RETRIES=2 npx playwright test
 * 
 * Command line options:
 * npx playwright test --retries=1
 * npx playwright test --repeat-each=3  // Run each test 3 times
 */