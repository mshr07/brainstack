const { test, expect } = require('@playwright/test');

test.describe('Web Element Interaction in Playwright', () => {
  
  test('Basic element interactions - click, fill, select', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Fill input field
    const todoInput = page.locator('.new-todo');
    await todoInput.fill('Buy groceries');
    await expect(todoInput).toHaveValue('Buy groceries');
    
    // Press Enter to submit
    await todoInput.press('Enter');
    
    // Click on todo item to mark as complete
    const todoItem = page.locator('.todo-list li');
    const checkbox = todoItem.locator('input[type="checkbox"]');
    await checkbox.check();
    
    // Verify checkbox is checked
    await expect(checkbox).toBeChecked();
  });

  test('Different ways to locate elements', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add some todos first
    await page.locator('.new-todo').fill('Task 1');
    await page.locator('.new-todo').press('Enter');
    await page.locator('.new-todo').fill('Task 2');
    await page.locator('.new-todo').press('Enter');
    
    // Locate by CSS selector
    const todoByCSS = page.locator('.todo-list li:first-child');
    await expect(todoByCSS).toBeVisible();
    
    // Locate by text content
    const todoByText = page.locator('text=Task 1');
    await expect(todoByText).toBeVisible();
    
    // Locate by data attribute
    const todoList = page.locator('[data-testid="todo-list"]').or(page.locator('.todo-list'));
    await expect(todoList).toBeVisible();
    
    // Locate by role
    const textbox = page.getByRole('textbox');
    await expect(textbox).toBeVisible();
    
    // Locate by placeholder
    const inputByPlaceholder = page.getByPlaceholder('What needs to be done?');
    await expect(inputByPlaceholder).toBeVisible();
  });

  test('Element state checks and actions', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const todoInput = page.locator('.new-todo');
    
    // Check if element is visible, enabled, editable
    await expect(todoInput).toBeVisible();
    await expect(todoInput).toBeEnabled();
    await expect(todoInput).toBeEditable();
    
    // Add a todo
    await todoInput.fill('Test todo item');
    await todoInput.press('Enter');
    
    const todoItem = page.locator('.todo-list li').first();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    const label = todoItem.locator('label');
    
    // Double-click to edit
    await label.dblclick();
    
    // Check if edit input is visible
    const editInput = todoItem.locator('.edit');
    await expect(editInput).toBeVisible();
    await expect(editInput).toBeFocused();
  });

  test('Working with multiple elements', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add multiple todos
    const todos = ['Task 1', 'Task 2', 'Task 3'];
    for (const todo of todos) {
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }
    
    // Get all todo items
    const todoItems = page.locator('.todo-list li');
    await expect(todoItems).toHaveCount(3);
    
    // Iterate through elements
    const count = await todoItems.count();
    for (let i = 0; i < count; i++) {
      const todoItem = todoItems.nth(i);
      const label = todoItem.locator('label');
      const text = await label.textContent();
      console.log(`Todo ${i + 1}: ${text}`);
      
      // Mark first two as complete
      if (i < 2) {
        await todoItem.locator('input[type="checkbox"]').check();
      }
    }
    
    // Verify completed todos
    const completedTodos = page.locator('.todo-list li.completed');
    await expect(completedTodos).toHaveCount(2);
  });

  test('Advanced element interactions', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Advanced interactions test');
    await page.locator('.new-todo').press('Enter');
    
    const todoItem = page.locator('.todo-list li').first();
    const label = todoItem.locator('label');
    
    // Right-click (context menu)
    await label.click({ button: 'right' });
    
    // Double-click to edit
    await label.dblclick();
    
    const editInput = todoItem.locator('.edit');
    
    // Select all text and replace
    await editInput.selectText();
    await editInput.fill('Modified todo item');
    await editInput.press('Enter');
    
    // Verify the change
    await expect(label).toHaveText('Modified todo item');
  });

  test('Element waiting strategies', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const todoInput = page.locator('.new-todo');
    
    // Wait for element to be visible
    await todoInput.waitFor({ state: 'visible' });
    
    // Wait for element to be attached to DOM
    await todoInput.waitFor({ state: 'attached' });
    
    // Add todo and wait for it to appear
    await todoInput.fill('Waiting test');
    await todoInput.press('Enter');
    
    const todoItem = page.locator('.todo-list li').first();
    
    // Wait for element with timeout
    await todoItem.waitFor({ state: 'visible', timeout: 5000 });
    
    // Wait for specific text content
    await expect(todoItem.locator('label')).toHaveText('Waiting test', { timeout: 5000 });
  });

  test('Element attribute and property handling', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const todoInput = page.locator('.new-todo');
    
    // Get element attributes
    const placeholder = await todoInput.getAttribute('placeholder');
    console.log('Placeholder:', placeholder);
    
    const className = await todoInput.getAttribute('class');
    console.log('Class:', className);
    
    // Check if attribute exists
    await expect(todoInput).toHaveAttribute('placeholder');
    await expect(todoInput).toHaveAttribute('class', 'new-todo');
    
    // Add todo and check properties
    await todoInput.fill('Property test');
    await todoInput.press('Enter');
    
    const todoItem = page.locator('.todo-list li').first();
    const checkbox = todoItem.locator('input[type="checkbox"]');
    
    // Check element properties
    const isChecked = await checkbox.isChecked();
    console.log('Checkbox checked:', isChecked);
    
    const isVisible = await checkbox.isVisible();
    console.log('Checkbox visible:', isVisible);
    
    const isEnabled = await checkbox.isEnabled();
    console.log('Checkbox enabled:', isEnabled);
  });
});