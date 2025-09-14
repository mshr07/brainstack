const { test, expect } = require('@playwright/test');

test.describe('Keyboard Actions in Playwright', () => {
  
  test('Basic keyboard input and navigation', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    const todoInput = page.locator('.new-todo');
    
    // Focus on input using keyboard navigation
    await page.keyboard.press('Tab');
    await expect(todoInput).toBeFocused();
    
    // Type text using keyboard
    await page.keyboard.type('Learn keyboard actions in Playwright');
    await expect(todoInput).toHaveValue('Learn keyboard actions in Playwright');
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Verify todo was added
    await expect(page.locator('.todo-list li')).toHaveCount(1);
    await expect(page.locator('.todo-list li label')).toHaveText('Learn keyboard actions in Playwright');
  });

  test('Special key combinations and shortcuts', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <textarea id="editor" placeholder="Type here and try keyboard shortcuts..." 
                    style="width: 500px; height: 200px; padding: 10px; font-family: monospace;"></textarea>
          
          <div id="shortcuts-info" style="margin-top: 20px; padding: 20px; background: #f0f0f0;">
            <strong>Available shortcuts:</strong><br>
            Ctrl+A (Cmd+A on Mac): Select All<br>
            Ctrl+C (Cmd+C on Mac): Copy<br>
            Ctrl+V (Cmd+V on Mac): Paste<br>
            Ctrl+Z (Cmd+Z on Mac): Undo<br>
            Ctrl+Y (Cmd+Y on Mac): Redo
          </div>
          
          <div id="key-events" style="margin-top: 20px; padding: 20px; background: #e9ecef; max-height: 200px; overflow-y: auto;"></div>
          
          <script>
            const editor = document.getElementById('editor');
            const keyEvents = document.getElementById('key-events');
            
            editor.addEventListener('keydown', function(e) {
              const modifiers = [];
              if (e.ctrlKey || e.metaKey) modifiers.push('Ctrl/Cmd');
              if (e.altKey) modifiers.push('Alt');
              if (e.shiftKey) modifiers.push('Shift');
              
              const keyInfo = modifiers.length > 0 ? 
                \`\${modifiers.join('+')}+\${e.key}\` : e.key;
              
              keyEvents.innerHTML += \`<div>Key pressed: \${keyInfo}</div>\`;
              keyEvents.scrollTop = keyEvents.scrollHeight;
            });
            
            // Handle some shortcuts
            editor.addEventListener('keydown', function(e) {
              if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                this.select();
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const editor = page.locator('#editor');
    const keyEvents = page.locator('#key-events');
    
    // Click to focus on the editor
    await editor.click();
    
    // Type some text
    await page.keyboard.type('Hello World! This is a test of keyboard shortcuts.');
    
    // Test Select All (Ctrl+A / Cmd+A)
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    
    await page.keyboard.press(`${modifier}+KeyA`);
    
    // Type replacement text (should replace selected text)
    await page.keyboard.type('Text replaced using Select All!');
    await expect(editor).toHaveValue('Text replaced using Select All!');
    
    // Test other key combinations
    await page.keyboard.press('Home'); // Go to beginning
    await page.keyboard.press('Shift+End'); // Select to end
    await page.keyboard.press('Delete'); // Delete selection
    
    await expect(editor).toHaveValue('');
  });

  test('Arrow keys and text navigation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <input type="text" id="nav-input" value="Navigate this text with arrows" 
                 style="width: 400px; padding: 10px; font-size: 16px;">
          
          <div id="cursor-info" style="margin-top: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const input = document.getElementById('nav-input');
            const cursorInfo = document.getElementById('cursor-info');
            
            function updateCursorInfo() {
              const pos = input.selectionStart;
              const text = input.value;
              const before = text.substring(0, pos);
              const after = text.substring(pos);
              
              cursorInfo.innerHTML = \`
                <strong>Cursor position:</strong> \${pos}<br>
                <strong>Text before cursor:</strong> "\${before}"<br>
                <strong>Text after cursor:</strong> "\${after}"
              \`;
            }
            
            input.addEventListener('keyup', updateCursorInfo);
            input.addEventListener('click', updateCursorInfo);
            
            // Initialize
            updateCursorInfo();
          </script>
        </body>
      </html>
    `);
    
    const input = page.locator('#nav-input');
    const cursorInfo = page.locator('#cursor-info');
    
    // Focus on input
    await input.click();
    
    // Move cursor to beginning
    await page.keyboard.press('Home');
    await expect(cursorInfo).toContainText('Cursor position: 0');
    
    // Move right with arrow key
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('ArrowRight');
    }
    await expect(cursorInfo).toContainText('Cursor position: 8');
    await expect(cursorInfo).toContainText('Text before cursor: "Navigate"');
    
    // Move to end
    await page.keyboard.press('End');
    await expect(cursorInfo).toContainText('Text after cursor: ""');
    
    // Move left and select text
    await page.keyboard.press('Shift+Home'); // Select all from cursor to beginning
    
    // Type to replace selection
    await page.keyboard.type('Use keyboard to navigate');
    await expect(input).toHaveValue('Use keyboard to navigate');
  });

  test('Function keys and special characters', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div>
            <label for="special-input">Test special keys and characters:</label>
            <input type="text" id="special-input" style="width: 400px; padding: 10px; margin: 10px;">
          </div>
          
          <div id="key-log" style="margin-top: 20px; padding: 20px; background: #f8f9fa; max-height: 300px; overflow-y: auto;"></div>
          
          <button id="clear-log">Clear Log</button>
          
          <script>
            const input = document.getElementById('special-input');
            const keyLog = document.getElementById('key-log');
            const clearBtn = document.getElementById('clear-log');
            
            input.addEventListener('keydown', function(e) {
              const timestamp = new Date().toLocaleTimeString();
              keyLog.innerHTML += \`
                <div style="border-bottom: 1px solid #ddd; padding: 5px;">
                  <strong>\${timestamp}</strong> - Key: \${e.key} | Code: \${e.code} | KeyCode: \${e.keyCode}
                </div>
              \`;
              keyLog.scrollTop = keyLog.scrollHeight;
            });
            
            clearBtn.addEventListener('click', function() {
              keyLog.innerHTML = '';
            });
          </script>
        </body>
      </html>
    `);
    
    const input = page.locator('#special-input');
    const keyLog = page.locator('#key-log');
    const clearBtn = page.locator('#clear-log');
    
    await input.click();
    
    // Test various special characters
    const specialKeys = [
      'F1', 'F2', 'F12',
      'Tab', 'Escape', 'Space',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'PageUp', 'PageDown', 'Home', 'End',
      'Insert', 'Delete', 'Backspace'
    ];
    
    for (const key of specialKeys) {
      await page.keyboard.press(key);
      await expect(keyLog).toContainText(key);
    }
    
    // Test typing special characters
    await clearBtn.click();
    
    // Type various characters including symbols
    await page.keyboard.type('Hello! @#$%^&*()_+-={}[]|\\:";\'<>?,./`~');
    await page.keyboard.press('Enter');
    
    // Verify the text was typed
    await expect(input).toHaveValue('Hello! @#$%^&*()_+-={}[]|\\:";\'<>?,./`~');
  });

  test('Keyboard shortcuts in form handling', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <form id="test-form">
            <div style="margin: 10px;">
              <label for="name">Name:</label>
              <input type="text" id="name" name="name" required>
            </div>
            
            <div style="margin: 10px;">
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required>
            </div>
            
            <div style="margin: 10px;">
              <label for="message">Message:</label>
              <textarea id="message" name="message" rows="4" cols="50"></textarea>
            </div>
            
            <div style="margin: 10px;">
              <input type="checkbox" id="agree" name="agree">
              <label for="agree">I agree to the terms</label>
            </div>
            
            <div style="margin: 10px;">
              <button type="submit" id="submit-btn">Submit (Alt+S)</button>
              <button type="reset" id="reset-btn">Reset (Alt+R)</button>
            </div>
          </form>
          
          <div id="form-status" style="margin-top: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const form = document.getElementById('test-form');
            const status = document.getElementById('form-status');
            const submitBtn = document.getElementById('submit-btn');
            const resetBtn = document.getElementById('reset-btn');
            
            // Handle keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              if (e.altKey && e.key === 's') {
                e.preventDefault();
                submitBtn.click();
              }
              
              if (e.altKey && e.key === 'r') {
                e.preventDefault();
                resetBtn.click();
              }
            });
            
            form.addEventListener('submit', function(e) {
              e.preventDefault();
              const formData = new FormData(form);
              const data = Object.fromEntries(formData.entries());
              status.innerHTML = \`
                <strong>Form submitted with data:</strong><br>
                \${JSON.stringify(data, null, 2)}
              \`;
            });
            
            form.addEventListener('reset', function() {
              status.innerHTML = '<strong>Form reset!</strong>';
            });
          </script>
        </body>
      </html>
    `);
    
    const nameInput = page.locator('#name');
    const emailInput = page.locator('#email');
    const messageTextarea = page.locator('#message');
    const agreeCheckbox = page.locator('#agree');
    const formStatus = page.locator('#form-status');
    
    // Fill form using keyboard navigation
    await page.keyboard.press('Tab'); // Focus first input
    await page.keyboard.type('John Doe');
    
    await page.keyboard.press('Tab'); // Move to email
    await page.keyboard.type('john.doe@example.com');
    
    await page.keyboard.press('Tab'); // Move to textarea
    await page.keyboard.type('This is a test message typed using keyboard actions.');
    
    await page.keyboard.press('Tab'); // Move to checkbox
    await page.keyboard.press('Space'); // Check the checkbox
    await expect(agreeCheckbox).toBeChecked();
    
    // Use keyboard shortcut to submit (Alt+S)
    await page.keyboard.press('Alt+KeyS');
    
    // Verify form submission
    await expect(formStatus).toContainText('Form submitted with data:');
    await expect(formStatus).toContainText('John Doe');
    await expect(formStatus).toContainText('john.doe@example.com');
  });

  test('Keyboard events and input validation', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div>
            <label for="numeric-input">Numeric Input (numbers only):</label>
            <input type="text" id="numeric-input" placeholder="Type only numbers" 
                   style="width: 200px; padding: 10px; margin: 10px;">
          </div>
          
          <div>
            <label for="limited-input">Limited Length (max 10 chars):</label>
            <input type="text" id="limited-input" placeholder="Max 10 characters" 
                   style="width: 200px; padding: 10px; margin: 10px;">
            <span id="char-count">0/10</span>
          </div>
          
          <div id="validation-messages" style="margin-top: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const numericInput = document.getElementById('numeric-input');
            const limitedInput = document.getElementById('limited-input');
            const charCount = document.getElementById('char-count');
            const messages = document.getElementById('validation-messages');
            
            // Numeric input validation
            numericInput.addEventListener('keydown', function(e) {
              const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];
              const isNumber = /^[0-9]$/.test(e.key);
              
              if (!isNumber && !allowedKeys.includes(e.key)) {
                e.preventDefault();
                showMessage('Only numbers are allowed!', 'error');
              }
            });
            
            // Limited length input
            limitedInput.addEventListener('input', function() {
              const remaining = 10 - this.value.length;
              charCount.textContent = \`\${this.value.length}/10\`;
              
              if (remaining <= 0) {
                charCount.style.color = 'red';
              } else if (remaining <= 2) {
                charCount.style.color = 'orange';
              } else {
                charCount.style.color = 'green';
              }
            });
            
            limitedInput.addEventListener('keydown', function(e) {
              if (this.value.length >= 10 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                showMessage('Maximum length reached!', 'warning');
              }
            });
            
            function showMessage(text, type) {
              const colors = {
                error: '#dc3545',
                warning: '#ffc107',
                success: '#28a745'
              };
              
              messages.innerHTML = \`
                <div style="color: \${colors[type] || '#007bff'}; font-weight: bold;">
                  \${text}
                </div>
              \`;
              
              setTimeout(() => {
                messages.innerHTML = '';
              }, 2000);
            }
          </script>
        </body>
      </html>
    `);
    
    const numericInput = page.locator('#numeric-input');
    const limitedInput = page.locator('#limited-input');
    const charCount = page.locator('#char-count');
    const messages = page.locator('#validation-messages');
    
    // Test numeric input validation
    await numericInput.click();
    await page.keyboard.type('123');
    await expect(numericInput).toHaveValue('123');
    
    // Try typing letters (should be prevented)
    await page.keyboard.type('abc');
    await expect(numericInput).toHaveValue('123'); // Should remain same
    await expect(messages).toContainText('Only numbers are allowed!');
    
    // Test limited length input
    await limitedInput.click();
    await page.keyboard.type('1234567890'); // Exactly 10 characters
    await expect(limitedInput).toHaveValue('1234567890');
    await expect(charCount).toHaveText('10/10');
    
    // Try typing more characters (should be prevented)
    await page.keyboard.type('x');
    await expect(limitedInput).toHaveValue('1234567890'); // Should remain same
    await expect(messages).toContainText('Maximum length reached!');
    
    // Test backspace works
    await page.keyboard.press('Backspace');
    await expect(limitedInput).toHaveValue('123456789');
    await expect(charCount).toHaveText('9/10');
  });

  test('Copy, paste, and clipboard operations', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <div style="margin: 20px;">
            <textarea id="source-text" placeholder="Source text (copy from here)" 
                      style="width: 300px; height: 100px; margin: 10px;">Hello, this is sample text for copying!</textarea>
          </div>
          
          <div style="margin: 20px;">
            <textarea id="target-text" placeholder="Target text (paste here)" 
                      style="width: 300px; height: 100px; margin: 10px;"></textarea>
          </div>
          
          <div style="margin: 20px;">
            <button id="copy-btn">Copy Source Text</button>
            <button id="paste-btn">Paste to Target</button>
            <button id="clear-btn">Clear All</button>
          </div>
          
          <div id="clipboard-status" style="margin: 20px; padding: 20px; background: #f8f9fa;"></div>
          
          <script>
            const sourceText = document.getElementById('source-text');
            const targetText = document.getElementById('target-text');
            const copyBtn = document.getElementById('copy-btn');
            const pasteBtn = document.getElementById('paste-btn');
            const clearBtn = document.getElementById('clear-btn');
            const status = document.getElementById('clipboard-status');
            
            copyBtn.addEventListener('click', async function() {
              try {
                await navigator.clipboard.writeText(sourceText.value);
                status.innerHTML = '✓ Text copied to clipboard!';
                status.style.color = 'green';
              } catch (err) {
                status.innerHTML = '✗ Failed to copy text';
                status.style.color = 'red';
              }
            });
            
            pasteBtn.addEventListener('click', async function() {
              try {
                const text = await navigator.clipboard.readText();
                targetText.value = text;
                status.innerHTML = '✓ Text pasted from clipboard!';
                status.style.color = 'green';
              } catch (err) {
                status.innerHTML = '✗ Failed to paste text';
                status.style.color = 'red';
              }
            });
            
            clearBtn.addEventListener('click', function() {
              sourceText.value = '';
              targetText.value = '';
              status.innerHTML = 'All text cleared';
              status.style.color = 'blue';
            });
            
            // Handle keyboard shortcuts
            document.addEventListener('keydown', function(e) {
              const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
              const modifier = isMac ? e.metaKey : e.ctrlKey;
              
              if (modifier && e.key === 'c' && document.activeElement === sourceText) {
                copyBtn.click();
              }
              
              if (modifier && e.key === 'v' && document.activeElement === targetText) {
                pasteBtn.click();
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const sourceText = page.locator('#source-text');
    const targetText = page.locator('#target-text');
    const copyBtn = page.locator('#copy-btn');
    const pasteBtn = page.locator('#paste-btn');
    const status = page.locator('#clipboard-status');
    
    // Focus on source text and select all
    await sourceText.click();
    await page.keyboard.press('Control+a'); // Select all
    
    // Copy using keyboard shortcut
    await page.keyboard.press('Control+c');
    
    // Click target text area and paste
    await targetText.click();
    await page.keyboard.press('Control+v');
    
    // Verify the text was copied and pasted
    const sourceValue = await sourceText.inputValue();
    const targetValue = await targetText.inputValue();
    expect(targetValue).toBe(sourceValue);
  });

  test('Keyboard accessibility and focus management', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc/');
    
    // Test keyboard navigation through the todo app
    await page.keyboard.press('Tab'); // Focus on input
    
    const todoInput = page.locator('.new-todo');
    await expect(todoInput).toBeFocused();
    
    // Add a few todos using keyboard
    const todos = ['First todo', 'Second todo', 'Third todo'];
    
    for (const todo of todos) {
      await page.keyboard.type(todo);
      await page.keyboard.press('Enter');
      
      // Input should remain focused after adding todo
      await expect(todoInput).toBeFocused();
    }
    
    // Verify all todos were added
    await expect(page.locator('.todo-list li')).toHaveCount(3);
    
    // Test keyboard navigation to todo items
    // Tab through the page elements
    await page.keyboard.press('Tab'); // Move away from input
    
    // Use keyboard to toggle todos
    const firstTodoCheckbox = page.locator('.todo-list li').first().locator('input[type="checkbox"]');
    
    // Navigate to first checkbox and toggle it
    while (!(await firstTodoCheckbox.isVisible()) || !(await firstTodoCheckbox.isFocused())) {
      await page.keyboard.press('Tab');
      
      // Check if we've focused on the checkbox
      const focusedElement = await page.evaluate(() => document.activeElement);
      if (await firstTodoCheckbox.evaluate((el, focusedEl) => el === focusedEl, focusedElement)) {
        break;
      }
    }
    
    // Toggle the checkbox with space
    await page.keyboard.press('Space');
    await expect(firstTodoCheckbox).toBeChecked();
  });
});