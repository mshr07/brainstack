const { test, expect } = require('@playwright/test');

test.describe('Text Verification in Playwright', () => {
  
  test('Basic text verification methods', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Verify text content using toHaveText
    const heading = page.locator('h1');
    await expect(heading).toHaveText('todos');
    
    // Verify text content with regex
    await expect(heading).toHaveText(/todos/i);
    
    // Add a todo and verify its text
    await page.locator('.new-todo').fill('Learn text verification');
    await page.locator('.new-todo').press('Enter');
    
    const todoLabel = page.locator('.todo-list li label');
    await expect(todoLabel).toHaveText('Learn text verification');
  });

  test('Text content verification with different methods', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add multiple todos
    const todos = ['Buy milk', 'Walk the dog', 'Read a book'];
    for (const todo of todos) {
      await page.locator('.new-todo').fill(todo);
      await page.locator('.new-todo').press('Enter');
    }
    
    // Verify text using textContent()
    const firstTodo = page.locator('.todo-list li').first().locator('label');
    const textContent = await firstTodo.textContent();
    expect(textContent).toBe('Buy milk');
    
    // Verify text using innerText()
    const innerText = await firstTodo.innerText();
    expect(innerText).toBe('Buy milk');
    
    // Verify all todo texts
    const todoLabels = page.locator('.todo-list li label');
    await expect(todoLabels).toHaveText(todos);
  });

  test('Partial text matching and contains verification', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo with specific text
    await page.locator('.new-todo').fill('Complete Playwright tutorial by Friday');
    await page.locator('.new-todo').press('Enter');
    
    const todoLabel = page.locator('.todo-list li label');
    
    // Verify text contains specific substring
    await expect(todoLabel).toContainText('Playwright');
    await expect(todoLabel).toContainText('tutorial');
    await expect(todoLabel).toContainText('Friday');
    
    // Verify text contains with regex
    await expect(todoLabel).toContainText(/playwright/i);
    await expect(todoLabel).toContainText(/\bFriday\b/);
  });

  test('Text verification with dynamic content', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Initially no todos
    const todoCount = page.locator('.todo-count');
    
    // Add first todo and verify count
    await page.locator('.new-todo').fill('First task');
    await page.locator('.new-todo').press('Enter');
    
    await expect(todoCount).toContainText('1 item left');
    
    // Add second todo and verify count changes
    await page.locator('.new-todo').fill('Second task');
    await page.locator('.new-todo').press('Enter');
    
    await expect(todoCount).toContainText('2 items left');
    
    // Complete one todo and verify count updates
    await page.locator('.todo-list li').first().locator('input[type="checkbox"]').check();
    await expect(todoCount).toContainText('1 item left');
  });

  test('Text verification with empty and whitespace handling', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add todo with leading/trailing spaces
    await page.locator('.new-todo').fill('  Task with spaces  ');
    await page.locator('.new-todo').press('Enter');
    
    const todoLabel = page.locator('.todo-list li label');
    
    // Verify exact text (might include spaces depending on implementation)
    const exactText = await todoLabel.textContent();
    console.log(`Exact text: "${exactText}"`);
    
    // Verify trimmed text
    const trimmedText = (await todoLabel.textContent())?.trim();
    expect(trimmedText).toBe('Task with spaces');
    
    // Verify text contains the core content
    await expect(todoLabel).toContainText('Task with spaces');
  });

  test('Case-sensitive and case-insensitive text verification', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    await page.locator('.new-todo').fill('UPPERCASE Task');
    await page.locator('.new-todo').press('Enter');
    
    const todoLabel = page.locator('.todo-list li label');
    
    // Case-sensitive verification
    await expect(todoLabel).toHaveText('UPPERCASE Task');
    await expect(todoLabel).not.toHaveText('uppercase task');
    
    // Case-insensitive verification using regex
    await expect(todoLabel).toHaveText(/uppercase task/i);
    await expect(todoLabel).toContainText(/TASK/i);
  });

  test('Text verification with special characters and HTML entities', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add todo with special characters
    await page.locator('.new-todo').fill('Task with "quotes" & symbols!');
    await page.locator('.new-todo').press('Enter');
    
    const todoLabel = page.locator('.todo-list li label');
    
    // Verify text with special characters
    await expect(todoLabel).toHaveText('Task with "quotes" & symbols!');
    await expect(todoLabel).toContainText('"quotes"');
    await expect(todoLabel).toContainText('&');
    await expect(todoLabel).toContainText('!');
  });

  test('Text verification with multiple elements', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add multiple todos
    const todoTexts = [
      'Morning exercise',
      'Check emails',
      'Team meeting',
      'Code review'
    ];
    
    for (const todoText of todoTexts) {
      await page.locator('.new-todo').fill(todoText);
      await page.locator('.new-todo').press('Enter');
    }
    
    // Verify all todo texts at once
    const todoLabels = page.locator('.todo-list li label');
    await expect(todoLabels).toHaveText(todoTexts);
    
    // Verify specific todo by index
    await expect(todoLabels.nth(0)).toHaveText('Morning exercise');
    await expect(todoLabels.nth(2)).toHaveText('Team meeting');
    
    // Verify text content of all elements
    const count = await todoLabels.count();
    for (let i = 0; i < count; i++) {
      const todoLabel = todoLabels.nth(i);
      const text = await todoLabel.textContent();
      expect(todoTexts).toContain(text);
      console.log(`Todo ${i + 1}: ${text}`);
    }
  });

  test('Text verification with complex selectors', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add todos and mark some as complete
    await page.locator('.new-todo').fill('Completed task');
    await page.locator('.new-todo').press('Enter');
    await page.locator('.new-todo').fill('Active task');
    await page.locator('.new-todo').press('Enter');
    
    // Mark first task as complete
    await page.locator('.todo-list li').first().locator('input[type="checkbox"]').check();
    
    // Verify completed task text
    const completedTask = page.locator('.todo-list li.completed label');
    await expect(completedTask).toHaveText('Completed task');
    
    // Verify active task text (not completed)
    const activeTask = page.locator('.todo-list li:not(.completed) label');
    await expect(activeTask).toHaveText('Active task');
    
    // Verify using filter
    const allTasks = page.locator('.todo-list li');
    const completedTasks = allTasks.filter({ hasText: 'Completed task' });
    await expect(completedTasks).toHaveCount(1);
  });

  test('Text verification with timeout and retry', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Add a todo
    await page.locator('.new-todo').fill('Timeout test task');
    await page.locator('.new-todo').press('Enter');
    
    const todoLabel = page.locator('.todo-list li label');
    
    // Wait for text to appear with custom timeout
    await expect(todoLabel).toHaveText('Timeout test task', { timeout: 10000 });
    
    // Verify text appears within timeout
    await expect(todoLabel).toContainText('Timeout', { timeout: 5000 });
    
    // Use soft assertion for text that might not be present
    await expect.soft(todoLabel).toContainText('Optional text');
    
    // Continue with other verifications
    await expect(todoLabel).toBeVisible();
  });
});