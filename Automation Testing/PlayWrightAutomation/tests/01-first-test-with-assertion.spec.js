const { test, expect } = require('@playwright/test');

test.describe('First Playwright Test Cases with Assertions', () => {
  
  test('Basic page navigation and title assertion', async ({ page }) => {
    // Navigate to a dummy website
    await page.goto('https://playwright.dev/');
    
    // Assert page title
    await expect(page).toHaveTitle(/Playwright/);
    
    // Assert page URL
    expect(page.url()).toContain('playwright.dev');
    
    console.log('Page title:', await page.title());
    console.log('Page URL:', page.url());
  });

  test('Element visibility and text assertions', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Assert element is visible
    const todoInput = page.locator('.new-todo');
    await expect(todoInput).toBeVisible();
    
    // Assert placeholder text
    await expect(todoInput).toHaveAttribute('placeholder', 'What needs to be done?');
    
    // Assert element count
    const todoItems = page.locator('.todo-list li');
    await expect(todoItems).toHaveCount(0); // Initially no todos
  });

  test('Form interaction and value assertions', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const todoInput = page.locator('.new-todo');
    const todoText = 'Learn Playwright Assertions';
    
    // Type in input field
    await todoInput.fill(todoText);
    
    // Assert input value
    await expect(todoInput).toHaveValue(todoText);
    
    // Press Enter to add todo
    await todoInput.press('Enter');
    
    // Assert todo was added
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toHaveCount(1);
    await expect(todoItem.locator('label')).toHaveText(todoText);
  });

  test('Multiple assertions with soft assertions', async ({ page }) => {
    await page.goto('https://playwright.dev/');
    
    // Hard assertions (test stops if any fails)
    await expect(page).toHaveTitle(/Playwright/);
    
    // Soft assertions (test continues even if some fail)
    await expect.soft(page.locator('nav')).toBeVisible();
    await expect.soft(page.locator('.hero')).toBeVisible();
    await expect.soft(page.locator('.footer')).toBeVisible();
    
    // Check if Get Started button exists
    const getStartedBtn = page.locator('text=Get started');
    await expect(getStartedBtn).toBeVisible();
  });

  test('Custom assertions with polling', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo item
    await page.locator('.new-todo').fill('Custom assertion test');
    await page.locator('.new-todo').press('Enter');
    
    // Wait for element with custom timeout
    const todoItem = page.locator('.todo-list li');
    await expect(todoItem).toBeVisible({ timeout: 10000 });
    
    // Assert CSS classes (should be empty by default)
    await expect(todoItem).toHaveClass('');
    
    // Assert element count with retry
    await expect(todoItem).toHaveCount(1);
  });

  test('Negative assertions', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Assert element does not exist
    await expect(page.locator('.non-existent-element')).not.toBeVisible();
    
    // Assert text does not contain specific value
    const heading = page.locator('h1');
    await expect(heading).not.toHaveText('Wrong Title');
    
    // Assert page URL does not contain specific string
    expect(page.url()).not.toContain('wrong-url');
  });
});