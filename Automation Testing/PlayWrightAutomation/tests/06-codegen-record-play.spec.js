const { test, expect } = require('@playwright/test');

/**
 * This file demonstrates Playwright's codegen (code generation) capabilities
 * and how to record and play scripts.
 * 
 * To generate code using Playwright:
 * 1. Run: npx playwright codegen https://demo.playwright.dev/todomvc/
 * 2. Interact with the page in the opened browser
 * 3. Copy the generated code
 * 
 * The tests below are examples of what codegen might produce
 */

test.describe('Codegen and Record/Play Examples', () => {
  
  test('Generated code example - Basic todo operations', async ({ page }) => {
    // This is what codegen might generate for basic todo operations
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Click on the input field
    await page.locator('.new-todo').click();
    
    // Fill the input
    await page.locator('.new-todo').fill('Buy groceries');
    
    // Press Enter to add the todo
    await page.locator('.new-todo').press('Enter');
    
    // Verify the todo was added
    await expect(page.locator('.todo-list li')).toHaveText('Buy groceries');
    
    // Click the checkbox to mark as complete
    await page.locator('.todo-list li input[type="checkbox"]').check();
    
    // Verify it's marked as complete
    await expect(page.locator('.todo-list li')).toHaveClass(/completed/);
  });

  test('Generated code example - Multiple todos and filtering', async ({ page }) => {
    // Example of what codegen generates for more complex interactions
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add first todo
    await page.locator('.new-todo').click();
    await page.locator('.new-todo').fill('Learn Playwright');
    await page.locator('.new-todo').press('Enter');
    
    // Add second todo
    await page.locator('.new-todo').click();
    await page.locator('.new-todo').fill('Write tests');
    await page.locator('.new-todo').press('Enter');
    
    // Add third todo
    await page.locator('.new-todo').click();
    await page.locator('.new-todo').fill('Deploy application');
    await page.locator('.new-todo').press('Enter');
    
    // Mark first todo as complete
    await page.locator('.todo-list li').first().locator('input[type="checkbox"]').check();
    
    // Verify todo count
    await expect(page.locator('.todo-count')).toContainText('2 items left');
    
    // Click on Active filter
    await page.locator('text=Active').click();
    
    // Verify only active todos are shown
    await expect(page.locator('.todo-list li')).toHaveCount(2);
    
    // Click on Completed filter
    await page.locator('text=Completed').click();
    
    // Verify only completed todos are shown
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    
    // Click on All to show all todos
    await page.locator('text=All').click();
    
    // Verify all todos are shown
    await expect(page.locator('.todo-list li')).toHaveCount(3);
  });

  test('Generated code with hover and context actions', async ({ page }) => {
    // Example of codegen with hover actions and context menus
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Hover test todo');
    await page.locator('.new-todo').press('Enter');
    
    const todoItem = page.locator('.todo-list li');
    
    // Hover over the todo item (codegen captures hover actions)
    await todoItem.hover();
    
    // The destroy button appears on hover
    const destroyButton = todoItem.locator('.destroy');
    await expect(destroyButton).toBeVisible();
    
    // Double-click to edit (codegen captures double-click)
    await todoItem.locator('label').dblclick();
    
    // Edit the todo
    const editInput = todoItem.locator('.edit');
    await editInput.fill('Edited hover test todo');
    await editInput.press('Enter');
    
    // Verify the edit
    await expect(todoItem.locator('label')).toHaveText('Edited hover test todo');
  });

  test('Generated code with keyboard navigation', async ({ page }) => {
    // Example of codegen capturing keyboard interactions
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Focus on the input using Tab navigation
    await page.keyboard.press('Tab');
    
    // Type using keyboard
    await page.keyboard.type('Keyboard navigation test');
    
    // Press Enter to add
    await page.keyboard.press('Enter');
    
    // Use keyboard to navigate to the todo item
    await page.keyboard.press('Tab');
    
    // Press Space to toggle checkbox (if focused)
    await page.keyboard.press('Space');
    
    // Verify the todo is completed
    await expect(page.locator('.todo-list li')).toHaveClass(/completed/);
  });

  test('Generated code with form interactions', async ({ page }) => {
    // Example of more complex form interactions that codegen might capture
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const todos = [
      'First generated todo',
      'Second generated todo',
      'Third generated todo'
    ];
    
    // Add multiple todos (codegen would capture each action)
    for (const todo of todos) {
      await page.locator('.new-todo').click();
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }
    
    // Select all todos using the toggle all checkbox
    await page.locator('.toggle-all').click();
    
    // Verify all are completed
    await expect(page.locator('.todo-list li.completed')).toHaveCount(3);
    
    // Clear completed todos
    await page.locator('.clear-completed').click();
    
    // Verify all todos are removed
    await expect(page.locator('.todo-list li')).toHaveCount(0);
  });

  test('Generated code with drag and drop (if supported)', async ({ page }) => {
    // Note: TodoMVC doesn't have drag and drop, but this shows the pattern
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add todos for demonstration
    await page.locator('.new-todo').fill('Draggable item 1');
    await page.locator('.new-todo').press('Enter');
    
    await page.locator('.new-todo').fill('Draggable item 2');
    await page.locator('.new-todo').press('Enter');
    
    const todoItems = page.locator('.todo-list li');
    
    // Example of how codegen might capture drag and drop
    // (This specific example won't work with TodoMVC as it doesn't support drag/drop)
    // await todoItems.first().dragTo(todoItems.last());
    
    // Instead, demonstrate other interactions codegen might capture
    const firstTodo = todoItems.first();
    const secondTodo = todoItems.nth(1);
    
    // Get bounding boxes for potential drag operations
    const firstBox = await firstTodo.boundingBox();
    const secondBox = await secondTodo.boundingBox();
    
    console.log('First todo position:', firstBox);
    console.log('Second todo position:', secondBox);
    
    // Verify the todos exist
    await expect(todoItems).toHaveCount(2);
  });

  test('Generated code with page navigation and back/forward', async ({ page }) => {
    // Example of codegen capturing navigation actions
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Navigation test todo');
    await page.locator('.new-todo').press('Enter');
    
    // Navigate to Playwright homepage (simulate external navigation)
    await page.goto('https://playwright.dev/');
    
    // Verify we're on the new page
    await expect(page).toHaveURL(/playwright\.dev/);
    
    // Go back using browser navigation
    await page.goBack();
    
    // Verify we're back on TodoMVC and our todo still exists
    await expect(page).toHaveURL(/todomvc/);
    await expect(page.locator('.todo-list li')).toHaveText('Navigation test todo');
    
    // Go forward
    await page.goForward();
    
    // Verify we're back on Playwright homepage
    await expect(page).toHaveURL(/playwright\.dev/);
  });

  test('Customizing generated code with better locators', async ({ page }) => {
    // This shows how you might improve generated code
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Instead of using generic selectors, use more specific ones
    const todoInput = page.getByPlaceholder('What needs to be done?');
    const todoList = page.locator('.todo-list');
    const todoCount = page.locator('.todo-count');
    
    // Add a todo with improved locator
    await todoInput.fill('Improved locator test');
    await todoInput.press('Enter');
    
    // Verify using semantic locators
    await expect(todoList.locator('li')).toHaveCount(1);
    await expect(todoCount).toContainText('1 item left');
    
    // Use role-based locators when possible
    const checkbox = page.getByRole('checkbox');
    await checkbox.check();
    
    // Verify completion
    await expect(todoList.locator('.completed')).toHaveCount(1);
  });

  test('Generated code with error handling and retries', async ({ page }) => {
    // Example of how to enhance generated code with error handling
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    try {
      // Add todo with retry logic
      await page.locator('.new-todo').fill('Error handling test', { timeout: 5000 });
      await page.locator('.new-todo').press('Enter');
      
      // Wait for the todo to appear with custom timeout
      const todoItem = page.locator('.todo-list li');
      await todoItem.waitFor({ state: 'visible', timeout: 10000 });
      
      // Verify with custom error message
      await expect(todoItem).toHaveText('Error handling test');
      
    } catch (error) {
      console.error('Test failed:', error.message);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'screenshots/error-handling-failure.png' });
      
      throw error;
    }
  });
});

/**
 * Instructions for using Playwright Codegen:
 * 
 * 1. Basic codegen:
 *    npx playwright codegen https://demo.playwright.dev/todomvc/
 * 
 * 2. Codegen with specific browser:
 *    npx playwright codegen --browser=firefox https://demo.playwright.dev/todomvc/
 * 
 * 3. Codegen with device emulation:
 *    npx playwright codegen --device="iPhone 13" https://demo.playwright.dev/todomvc/
 * 
 * 4. Codegen with specific viewport:
 *    npx playwright codegen --viewport-size=800,600 https://demo.playwright.dev/todomvc/
 * 
 * 5. Save generated code to file:
 *    npx playwright codegen --target javascript --output generated-test.js https://demo.playwright.dev/todomvc/
 * 
 * 6. Codegen with authentication (if needed):
 *    npx playwright codegen --load-storage auth.json https://demo.playwright.dev/todomvc/
 * 
 * Tips for using codegen:
 * - Always review and refactor generated code
 * - Replace generic selectors with more semantic ones
 * - Add proper assertions and error handling
 * - Group related actions into meaningful test cases
 * - Add comments to explain test intent
 */