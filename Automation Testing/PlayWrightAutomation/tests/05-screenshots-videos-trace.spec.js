const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Screenshots, Videos, and Trace Files', () => {
  
  test('Take full page screenshots', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Take a full page screenshot
    await page.screenshot({ 
      path: 'screenshots/full-page-screenshot.png',
      fullPage: true 
    });
    console.log('Full page screenshot saved');
    
    // Add some content first
    await page.locator('.new-todo').fill('Screenshot test todo');
    await page.locator('.new-todo').press('Enter');
    
    // Take screenshot of current viewport only
    await page.screenshot({ 
      path: 'screenshots/viewport-screenshot.png'
    });
    console.log('Viewport screenshot saved');
  });

  test('Take element screenshots', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add some todos first
    const todos = ['Element screenshot test 1', 'Element screenshot test 2'];
    for (const todo of todos) {
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }
    
    // Screenshot of specific element
    const todoApp = page.locator('.todoapp');
    await todoApp.screenshot({ path: 'screenshots/todoapp-element.png' });
    console.log('TodoApp element screenshot saved');
    
    // Screenshot of todo list only
    const todoList = page.locator('.todo-list');
    await todoList.screenshot({ path: 'screenshots/todo-list-element.png' });
    console.log('Todo list element screenshot saved');
    
    // Screenshot of individual todo item
    const firstTodo = page.locator('.todo-list li').first();
    await firstTodo.screenshot({ path: 'screenshots/first-todo-item.png' });
    console.log('First todo item screenshot saved');
  });

  test('Screenshots with different options', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add content
    await page.locator('.new-todo').fill('Screenshot options test');
    await page.locator('.new-todo').press('Enter');
    
    // Screenshot with quality setting (for JPEG)
    await page.screenshot({ 
      path: 'screenshots/quality-test.jpg',
      quality: 90,
      type: 'jpeg'
    });
    
    // Screenshot without background (for PNG with transparency)
    await page.screenshot({ 
      path: 'screenshots/no-background.png',
      omitBackground: true
    });
    
    // Screenshot with custom clip area
    await page.screenshot({ 
      path: 'screenshots/clipped-area.png',
      clip: { x: 0, y: 0, width: 400, height: 300 }
    });
    
    console.log('Screenshots with different options saved');
  });

  test('Screenshots for test failure debugging', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    try {
      // Add a todo
      await page.locator('.new-todo').fill('Debug screenshot test');
      await page.locator('.new-todo').press('Enter');
      
      // Intentional assertion that might fail for demonstration
      const todoCount = page.locator('.todo-list li');
      await expect(todoCount).toHaveCount(1);
      
      // Take success screenshot
      await page.screenshot({ path: 'screenshots/test-success.png' });
      console.log('Test success screenshot saved');
      
    } catch (error) {
      // Take screenshot on failure
      await page.screenshot({ path: 'screenshots/test-failure.png' });
      console.log('Test failure screenshot saved');
      throw error;
    }
  });

  test('Automatic screenshot on test failure', async ({ page }, testInfo) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Auto screenshot test');
    await page.locator('.new-todo').press('Enter');
    
    // This will pass, but shows how to use testInfo for conditional screenshots
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toHaveCount(1);
    
    // Take screenshot with test info
    const screenshotPath = path.join('screenshots', `${testInfo.title.replace(/\s+/g, '-')}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved: ${screenshotPath}`);
  });

  test('Compare screenshots for visual regression testing', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add consistent content for comparison
    await page.locator('.new-todo').fill('Visual regression test');
    await page.locator('.new-todo').press('Enter');
    
    // Take screenshot for visual comparison
    // Note: In real tests, you would use expect(page).toHaveScreenshot()
    await page.screenshot({ path: 'screenshots/visual-regression-baseline.png' });
    
    // Simulate some change
    await page.locator('.todo-list li input[type="checkbox"]').check();
    
    // Take screenshot of the changed state
    await page.screenshot({ path: 'screenshots/visual-regression-changed.png' });
    
    console.log('Visual regression screenshots saved');
  });

  test('Video recording example', async ({ page, context }) => {
    // Note: Video recording is usually configured in playwright.config.js
    // This test demonstrates how video recording works
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    console.log('Starting video recording actions...');
    
    // Perform various actions that will be recorded
    await page.locator('.new-todo').fill('Video recording test 1');
    await page.locator('.new-todo').press('Enter');
    
    await page.waitForTimeout(1000); // Pause for video clarity
    
    await page.locator('.new-todo').fill('Video recording test 2');
    await page.locator('.new-todo').press('Enter');
    
    await page.waitForTimeout(1000);
    
    // Mark first todo as complete
    await page.locator('.todo-list li').first().locator('input[type="checkbox"]').check();
    
    await page.waitForTimeout(1000);
    
    // Clear completed todos
    const clearButton = page.locator('text=Clear completed');
    if (await clearButton.isVisible()) {
      await clearButton.click();
    }
    
    console.log('Video recording actions completed');
    
    // Note: The video will be saved automatically if video recording is enabled
    // You can access the video path via testInfo.outputPath() or similar
  });

  test('Trace recording example', async ({ page, context }) => {
    // Start tracing
    await context.tracing.start({ 
      screenshots: true, 
      snapshots: true,
      sources: true 
    });
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Perform actions that will be traced
    await page.locator('.new-todo').fill('Trace recording test');
    await page.locator('.new-todo').press('Enter');
    
    // Verify the todo was added
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    
    // Mark as complete
    await page.locator('.todo-list li input[type="checkbox"]').check();
    
    // Stop tracing and save
    await context.tracing.stop({ path: 'traces/trace.zip' });
    
    console.log('Trace saved to traces/trace.zip');
    console.log('You can view the trace by running: npx playwright show-trace traces/trace.zip');
  });

  test('Conditional tracing on test failure', async ({ page, context }, testInfo) => {
    // Start tracing only if needed
    const shouldTrace = process.env.TRACE_ON_FAILURE === 'true';
    
    if (shouldTrace) {
      await context.tracing.start({ 
        screenshots: true, 
        snapshots: true,
        sources: true 
      });
    }
    
    try {
      await page.goto('https://demo.playwright.dev/todomvc/');
      
      await page.locator('.new-todo').fill('Conditional trace test');
      await page.locator('.new-todo').press('Enter');
      
      // This should pass
      await expect(page.locator('.todo-list li')).toHaveCount(1);
      
      console.log('Test passed successfully');
      
    } catch (error) {
      // Save trace only on failure
      if (shouldTrace) {
        const tracePath = path.join('traces', `${testInfo.title.replace(/\s+/g, '-')}-failure.zip`);
        await context.tracing.stop({ path: tracePath });
        console.log(`Trace saved on failure: ${tracePath}`);
      }
      throw error;
    } finally {
      // Stop tracing if it was started and test passed
      if (shouldTrace) {
        try {
          await context.tracing.stop();
        } catch (e) {
          // Tracing might have been stopped already on failure
        }
      }
    }
  });

  test('Create directories for media files', async ({ page }) => {
    const fs = require('fs').promises;
    
    // Create directories if they don't exist
    const directories = ['screenshots', 'videos', 'traces'];
    for (const dir of directories) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`Directory created/verified: ${dir}`);
      } catch (error) {
        console.log(`Directory already exists: ${dir}`);
      }
    }
    
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Take a simple screenshot to verify directory creation
    await page.screenshot({ path: 'screenshots/directory-test.png' });
    console.log('Directory test screenshot saved');
  });
});

// Test setup to create directories
test.beforeAll(async () => {
  const fs = require('fs').promises;
  const directories = ['screenshots', 'videos', 'traces'];
  
  for (const dir of directories) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
});