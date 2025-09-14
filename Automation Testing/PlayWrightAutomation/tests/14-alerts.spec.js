const { test, expect } = require('@playwright/test');

test.describe('Alert Handling in Playwright', () => {
  
  test('Handle basic JavaScript alert', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="alert-btn" onclick="showAlert()">Show Alert</button>
          <div id="alert-result"></div>
          
          <script>
            function showAlert() {
              alert('This is a simple alert!');
              document.getElementById('alert-result').textContent = 'Alert was shown and dismissed';
            }
          </script>
        </body>
      </html>
    `);
    
    const alertBtn = page.locator('#alert-btn');
    const alertResult = page.locator('#alert-result');
    
    // Set up alert handler before triggering the alert
    page.on('dialog', async dialog => {
      console.log(`Alert type: ${dialog.type()}`);
      console.log(`Alert message: ${dialog.message()}`);
      
      // Verify alert properties
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toBe('This is a simple alert!');
      
      // Accept the alert
      await dialog.accept();
    });
    
    // Trigger the alert
    await alertBtn.click();
    
    // Verify the result after alert was handled
    await expect(alertResult).toHaveText('Alert was shown and dismissed');
  });

  test('Handle confirm dialog - accept', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="confirm-btn" onclick="showConfirm()">Show Confirm</button>
          <div id="confirm-result"></div>
          
          <script>
            function showConfirm() {
              const result = confirm('Do you want to continue?');
              document.getElementById('confirm-result').textContent = 
                result ? 'User clicked OK' : 'User clicked Cancel';
            }
          </script>
        </body>
      </html>
    `);
    
    const confirmBtn = page.locator('#confirm-btn');
    const confirmResult = page.locator('#confirm-result');
    
    // Handle confirm dialog by accepting
    page.on('dialog', async dialog => {
      console.log(`Dialog type: ${dialog.type()}`);
      console.log(`Dialog message: ${dialog.message()}`);
      
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Do you want to continue?');
      
      // Accept the confirm dialog
      await dialog.accept();
    });
    
    await confirmBtn.click();
    await expect(confirmResult).toHaveText('User clicked OK');
  });

  test('Handle confirm dialog - dismiss', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="confirm-btn" onclick="showConfirm()">Show Confirm</button>
          <div id="confirm-result"></div>
          
          <script>
            function showConfirm() {
              const result = confirm('Are you sure you want to delete this item?');
              document.getElementById('confirm-result').textContent = 
                result ? 'Item will be deleted' : 'Delete cancelled';
            }
          </script>
        </body>
      </html>
    `);
    
    const confirmBtn = page.locator('#confirm-btn');
    const confirmResult = page.locator('#confirm-result');
    
    // Handle confirm dialog by dismissing
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toBe('Are you sure you want to delete this item?');
      
      // Dismiss the confirm dialog
      await dialog.dismiss();
    });
    
    await confirmBtn.click();
    await expect(confirmResult).toHaveText('Delete cancelled');
  });

  test('Handle prompt dialog with input', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="prompt-btn" onclick="showPrompt()">Show Prompt</button>
          <div id="prompt-result"></div>
          
          <script>
            function showPrompt() {
              const name = prompt('What is your name?', 'Enter your name here');
              document.getElementById('prompt-result').textContent = 
                name ? \`Hello, \${name}!\` : 'No name provided';
            }
          </script>
        </body>
      </html>
    `);
    
    const promptBtn = page.locator('#prompt-btn');
    const promptResult = page.locator('#prompt-result');
    
    // Handle prompt dialog with input text
    page.on('dialog', async dialog => {
      console.log(`Dialog type: ${dialog.type()}`);
      console.log(`Dialog message: ${dialog.message()}`);
      console.log(`Default value: ${dialog.defaultValue()}`);
      
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('What is your name?');
      expect(dialog.defaultValue()).toBe('Enter your name here');
      
      // Accept with custom input
      await dialog.accept('John Doe');
    });
    
    await promptBtn.click();
    await expect(promptResult).toHaveText('Hello, John Doe!');
  });

  test('Handle prompt dialog - cancel', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="prompt-btn" onclick="showPrompt()">Show Prompt</button>
          <div id="prompt-result"></div>
          
          <script>
            function showPrompt() {
              const email = prompt('Enter your email address:');
              document.getElementById('prompt-result').textContent = 
                email ? \`Email: \${email}\` : 'Email input cancelled';
            }
          </script>
        </body>
      </html>
    `);
    
    const promptBtn = page.locator('#prompt-btn');
    const promptResult = page.locator('#prompt-result');
    
    // Handle prompt dialog by dismissing
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('prompt');
      expect(dialog.message()).toBe('Enter your email address:');
      
      // Dismiss the prompt dialog
      await dialog.dismiss();
    });
    
    await promptBtn.click();
    await expect(promptResult).toHaveText('Email input cancelled');
  });

  test('Handle multiple alerts in sequence', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="multiple-alerts-btn" onclick="showMultipleAlerts()">Show Multiple Alerts</button>
          <div id="alerts-result"></div>
          
          <script>
            function showMultipleAlerts() {
              alert('First alert');
              const confirmed = confirm('Do you want to see more?');
              
              if (confirmed) {
                const name = prompt('What\\'s your name?');
                alert(\`Nice to meet you, \${name || 'Anonymous'}!\`);
                document.getElementById('alerts-result').textContent = 
                  \`Completed sequence for \${name || 'Anonymous'}\`;
              } else {
                document.getElementById('alerts-result').textContent = 'Sequence cancelled';
              }
            }
          </script>
        </body>
      </html>
    `);
    
    const multipleAlertsBtn = page.locator('#multiple-alerts-btn');
    const alertsResult = page.locator('#alerts-result');
    
    let dialogCount = 0;
    const expectedDialogs = ['alert', 'confirm', 'prompt', 'alert'];
    
    // Handle multiple dialogs in sequence
    page.on('dialog', async dialog => {
      console.log(`Dialog ${dialogCount + 1}: ${dialog.type()} - ${dialog.message()}`);
      
      expect(dialog.type()).toBe(expectedDialogs[dialogCount]);
      
      switch (dialogCount) {
        case 0: // First alert
          expect(dialog.message()).toBe('First alert');
          await dialog.accept();
          break;
        case 1: // Confirm dialog
          expect(dialog.message()).toBe('Do you want to see more?');
          await dialog.accept(); // Choose yes
          break;
        case 2: // Prompt dialog
          expect(dialog.message()).toBe("What's your name?");
          await dialog.accept('Alice');
          break;
        case 3: // Final alert
          expect(dialog.message()).toBe('Nice to meet you, Alice!');
          await dialog.accept();
          break;
      }
      
      dialogCount++;
    });
    
    await multipleAlertsBtn.click();
    await expect(alertsResult).toHaveText('Completed sequence for Alice');
    expect(dialogCount).toBe(4);
  });

  test('Handle beforeunload dialog', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="enable-beforeunload" onclick="enableBeforeUnload()">Enable Before Unload Warning</button>
          <button id="navigate-away" onclick="navigateAway()">Navigate Away</button>
          <div id="status"></div>
          
          <script>
            let beforeUnloadEnabled = false;
            
            function enableBeforeUnload() {
              beforeUnloadEnabled = true;
              window.addEventListener('beforeunload', function(e) {
                if (beforeUnloadEnabled) {
                  e.preventDefault();
                  e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                  return e.returnValue;
                }
              });
              document.getElementById('status').textContent = 'Before unload warning enabled';
            }
            
            function navigateAway() {
              window.location.href = 'about:blank';
            }
          </script>
        </body>
      </html>
    `);
    
    const enableBtn = page.locator('#enable-beforeunload');
    const navigateBtn = page.locator('#navigate-away');
    const status = page.locator('#status');
    
    // Enable beforeunload warning
    await enableBtn.click();
    await expect(status).toHaveText('Before unload warning enabled');
    
    // Handle beforeunload dialog
    page.on('dialog', async dialog => {
      console.log(`Dialog type: ${dialog.type()}`);
      console.log(`Dialog message: ${dialog.message()}`);
      
      expect(dialog.type()).toBe('beforeunload');
      
      // Accept to proceed with navigation
      await dialog.accept();
    });
    
    // Trigger navigation that should show beforeunload dialog
    await navigateBtn.click();
    
    // Verify we navigated (page URL should change)
    await expect(page).toHaveURL('about:blank');
  });

  test('Handle alerts with timeout and auto-dismiss', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="timeout-alert-btn" onclick="showTimeoutAlert()">Show Alert with Timeout</button>
          <div id="timeout-result"></div>
          
          <script>
            function showTimeoutAlert() {
              setTimeout(() => {
                alert('This alert appeared after 1 second');
                document.getElementById('timeout-result').textContent = 'Alert handled';
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    
    const timeoutAlertBtn = page.locator('#timeout-alert-btn');
    const timeoutResult = page.locator('#timeout-result');
    
    // Set up alert handler
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toBe('This alert appeared after 1 second');
      await dialog.accept();
    });
    
    // Trigger the delayed alert
    await timeoutAlertBtn.click();
    
    // Wait for the alert to be handled and result to be updated
    await expect(timeoutResult).toHaveText('Alert handled', { timeout: 5000 });
  });

  test('Handle file dialog (not JavaScript alert)', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <input type="file" id="file-input" accept=".txt">
          <div id="file-result"></div>
          
          <script>
            document.getElementById('file-input').addEventListener('change', function(e) {
              const file = e.target.files[0];
              document.getElementById('file-result').textContent = 
                file ? \`Selected: \${file.name}\` : 'No file selected';
            });
          </script>
        </body>
      </html>
    `);
    
    const fileInput = page.locator('#file-input');
    const fileResult = page.locator('#file-result');
    
    // Create a test file
    const testFileContent = 'This is a test file content';
    const buffer = Buffer.from(testFileContent, 'utf8');
    
    // Handle file dialog by setting files directly
    await fileInput.setInputFiles({
      name: 'test-file.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });
    
    await expect(fileResult).toHaveText('Selected: test-file.txt');
  });

  test('Handle custom modal dialogs (not browser alerts)', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            .modal {
              display: none;
              position: fixed;
              z-index: 1;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0,0,0,0.4);
            }
            
            .modal-content {
              background-color: #fefefe;
              margin: 15% auto;
              padding: 20px;
              border: 1px solid #888;
              width: 300px;
              border-radius: 5px;
            }
            
            .close {
              color: #aaa;
              float: right;
              font-size: 28px;
              font-weight: bold;
              cursor: pointer;
            }
            
            .modal-buttons {
              margin-top: 20px;
              text-align: right;
            }
            
            .modal-buttons button {
              margin-left: 10px;
              padding: 8px 16px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            
            .btn-ok {
              background-color: #007cba;
              color: white;
            }
            
            .btn-cancel {
              background-color: #ccc;
            }
          </style>
        </head>
        <body>
          <button id="show-modal">Show Custom Modal</button>
          <div id="modal-result"></div>
          
          <!-- Custom Modal -->
          <div id="custom-modal" class="modal">
            <div class="modal-content">
              <span class="close" id="close-modal">&times;</span>
              <h3>Custom Confirmation</h3>
              <p>Are you sure you want to perform this action?</p>
              <div class="modal-buttons">
                <button id="modal-ok" class="btn-ok">OK</button>
                <button id="modal-cancel" class="btn-cancel">Cancel</button>
              </div>
            </div>
          </div>
          
          <script>
            const modal = document.getElementById('custom-modal');
            const showBtn = document.getElementById('show-modal');
            const closeBtn = document.getElementById('close-modal');
            const okBtn = document.getElementById('modal-ok');
            const cancelBtn = document.getElementById('modal-cancel');
            const result = document.getElementById('modal-result');
            
            showBtn.addEventListener('click', () => {
              modal.style.display = 'block';
            });
            
            closeBtn.addEventListener('click', () => {
              modal.style.display = 'none';
              result.textContent = 'Modal closed without action';
            });
            
            okBtn.addEventListener('click', () => {
              modal.style.display = 'none';
              result.textContent = 'User clicked OK';
            });
            
            cancelBtn.addEventListener('click', () => {
              modal.style.display = 'none';
              result.textContent = 'User clicked Cancel';
            });
            
            // Close modal when clicking outside
            window.addEventListener('click', (e) => {
              if (e.target === modal) {
                modal.style.display = 'none';
                result.textContent = 'Modal closed by clicking outside';
              }
            });
          </script>
        </body>
      </html>
    `);
    
    const showModalBtn = page.locator('#show-modal');
    const modal = page.locator('#custom-modal');
    const okBtn = page.locator('#modal-ok');
    const cancelBtn = page.locator('#modal-cancel');
    const closeBtn = page.locator('#close-modal');
    const modalResult = page.locator('#modal-result');
    
    // Test showing and accepting the modal
    await showModalBtn.click();
    await expect(modal).toBeVisible();
    
    await okBtn.click();
    await expect(modal).not.toBeVisible();
    await expect(modalResult).toHaveText('User clicked OK');
    
    // Test showing and canceling the modal
    await showModalBtn.click();
    await expect(modal).toBeVisible();
    
    await cancelBtn.click();
    await expect(modal).not.toBeVisible();
    await expect(modalResult).toHaveText('User clicked Cancel');
    
    // Test closing modal with X button
    await showModalBtn.click();
    await expect(modal).toBeVisible();
    
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
    await expect(modalResult).toHaveText('Modal closed without action');
  });

  test('Handle alert with special characters and long text', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="special-alert-btn" onclick="showSpecialAlert()">Show Special Alert</button>
          <div id="special-result"></div>
          
          <script>
            function showSpecialAlert() {
              const message = "Alert with special characters:\\n" +
                             "• Unicode: ñáéíóú ®™ ☀️ 🌙\\n" +
                             "• Symbols: @#$%^&*()_+-={}[]|\\\\;':,.<>?\\n" +
                             "• Quotes: 'single' and \\"double\\" quotes\\n" +
                             "• Long text: " + "A".repeat(100);
              
              alert(message);
              document.getElementById('special-result').textContent = 'Special alert handled';
            }
          </script>
        </body>
      </html>
    `);
    
    const specialAlertBtn = page.locator('#special-alert-btn');
    const specialResult = page.locator('#special-result');
    
    // Handle alert with special characters
    page.on('dialog', async dialog => {
      console.log('Alert message length:', dialog.message().length);
      
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('Unicode: ñáéíóú');
      expect(dialog.message()).toContain('Symbols: @#$%^&*()');
      expect(dialog.message()).toContain('Quotes: \'single\' and "double"');
      expect(dialog.message()).toContain('A'.repeat(100));
      
      await dialog.accept();
    });
    
    await specialAlertBtn.click();
    await expect(specialResult).toHaveText('Special alert handled');
  });

  test('Test alert handler removal and re-adding', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <body>
          <button id="alert-btn" onclick="alert('Test alert')">Show Alert</button>
          <div id="handler-result"></div>
        </body>
      </html>
    `);
    
    const alertBtn = page.locator('#alert-btn');
    let handlerCalled = false;
    
    // Add first handler
    const handler1 = async (dialog) => {
      handlerCalled = true;
      expect(dialog.message()).toBe('Test alert');
      await dialog.accept();
    };
    
    page.on('dialog', handler1);
    
    // Trigger alert with first handler
    await alertBtn.click();
    expect(handlerCalled).toBe(true);
    
    // Remove first handler and add second one
    page.off('dialog', handler1);
    handlerCalled = false;
    
    const handler2 = async (dialog) => {
      handlerCalled = true;
      expect(dialog.message()).toBe('Test alert');
      // This handler dismisses instead of accepting
      await dialog.dismiss();
    };
    
    page.on('dialog', handler2);
    
    // Trigger alert with second handler
    await alertBtn.click();
    expect(handlerCalled).toBe(true);
    
    // Clean up
    page.off('dialog', handler2);
  });
});