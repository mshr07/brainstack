const { test, expect } = require('@playwright/test');

test.describe('Frames and IFrames Handling in Playwright', () => {
  
  test('Handle basic iframe interactions', async ({ page }) => {
    // Navigate to a page with iframes
    await page.goto('https://the-internet.herokuapp.com/iframe');
    
    // Wait for iframe to load
    await page.waitForSelector('#mce_0_ifr');
    
    // Get the iframe
    const iframe = page.frameLocator('#mce_0_ifr');
    
    // Interact with elements inside iframe
    const iframeBody = iframe.locator('body');
    await expect(iframeBody).toBeVisible();
    
    // Clear existing content and type new content
    await iframeBody.clear();
    await iframeBody.fill('Hello from Playwright inside iframe!');
    
    // Verify the content
    await expect(iframeBody).toHaveText('Hello from Playwright inside iframe!');
    
    // Interact with elements outside iframe
    const heading = page.locator('h3');
    await expect(heading).toHaveText('An iFrame containing the TinyMCE WYSIWYG Editor');
  });

  test('Handle nested iframes', async ({ page }) => {
    // Create a test page with nested iframes
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Main Page</h1>
        <iframe id="outer-iframe" src="data:text/html,
          <!DOCTYPE html>
          <html>
          <body>
            <h2>Outer Iframe</h2>
            <iframe id='inner-iframe' src='data:text/html,
              <!DOCTYPE html>
              <html>
              <body>
                <h3>Inner Iframe</h3>
                <button id=inner-button>Click Me</button>
                <p id=inner-text>Original text</p>
              </body>
              </html>
            '></iframe>
          </body>
          </html>
        "></iframe>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Wait for iframes to load
    await page.waitForSelector('#outer-iframe');
    
    // Access outer iframe
    const outerFrame = page.frameLocator('#outer-iframe');
    await expect(outerFrame.locator('h2')).toHaveText('Outer Iframe');
    
    // Access inner iframe within outer iframe
    const innerFrame = outerFrame.frameLocator('#inner-iframe');
    await expect(innerFrame.locator('h3')).toHaveText('Inner Iframe');
    
    // Interact with element in nested iframe
    await innerFrame.locator('#inner-button').click();
    
    // Verify interaction worked
    await expect(innerFrame.locator('#inner-text')).toBeVisible();
  });

  test('Handle iframe with dynamic content loading', async ({ page }) => {
    // Create an iframe that loads content dynamically
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Dynamic Iframe Test</h1>
        <button id="load-iframe">Load Iframe</button>
        <div id="iframe-container"></div>
        
        <script>
          document.getElementById('load-iframe').addEventListener('click', function() {
            const iframe = document.createElement('iframe');
            iframe.id = 'dynamic-iframe';
            iframe.src = 'data:text/html,<!DOCTYPE html><html><body><h2>Dynamically Loaded Iframe</h2><input type="text" id="dynamic-input" placeholder="Type here..."><button id="dynamic-btn">Submit</button><p id="result">Not submitted yet</p></body></html>';
            document.getElementById('iframe-container').appendChild(iframe);
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Click to load iframe dynamically
    await page.click('#load-iframe');
    
    // Wait for dynamic iframe to appear
    await page.waitForSelector('#dynamic-iframe');
    
    // Access the dynamically loaded iframe
    const dynamicFrame = page.frameLocator('#dynamic-iframe');
    
    // Wait for content to be available in iframe
    await expect(dynamicFrame.locator('h2')).toHaveText('Dynamically Loaded Iframe');
    
    // Interact with elements in dynamic iframe
    await dynamicFrame.locator('#dynamic-input').fill('Test input in dynamic iframe');
    await dynamicFrame.locator('#dynamic-btn').click();
    
    // Since there's no actual form handling, just verify elements are interactable
    await expect(dynamicFrame.locator('#dynamic-input')).toHaveValue('Test input in dynamic iframe');
  });

  test('Handle iframe form submissions', async ({ page }) => {
    // Create an iframe with a form
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Iframe Form Test</h1>
        <iframe id="form-iframe" src="data:text/html,
          <!DOCTYPE html>
          <html>
          <body>
            <h2>Form in Iframe</h2>
            <form id='test-form'>
              <input type='text' id='name' placeholder='Name' required>
              <input type='email' id='email' placeholder='Email' required>
              <textarea id='message' placeholder='Message'></textarea>
              <button type='submit'>Submit</button>
            </form>
            <div id='form-result'></div>
            
            <script>
              document.getElementById('test-form').addEventListener('submit', function(e) {
                e.preventDefault();
                const name = document.getElementById('name').value;
                const email = document.getElementById('email').value;
                const message = document.getElementById('message').value;
                
                document.getElementById('form-result').innerHTML = 
                  'Form submitted! Name: ' + name + ', Email: ' + email;
              });
            </script>
          </body>
          </html>
        "></iframe>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Access iframe
    const iframe = page.frameLocator('#form-iframe');
    
    // Fill form in iframe
    await iframe.locator('#name').fill('John Doe');
    await iframe.locator('#email').fill('john@example.com');
    await iframe.locator('#message').fill('This is a test message from iframe');
    
    // Submit form
    await iframe.locator('button[type="submit"]').click();
    
    // Verify form submission result
    await expect(iframe.locator('#form-result')).toContainText('Form submitted! Name: John Doe');
    await expect(iframe.locator('#form-result')).toContainText('Email: john@example.com');
  });

  test('Handle iframe with different domains (cross-origin)', async ({ page }) => {
    await page.goto('https://the-internet.herokuapp.com/nested_frames');
    
    // Handle top frame
    const topFrame = page.frameLocator('frame[name="frame-top"]');
    
    // Handle left frame within top frame
    const leftFrame = topFrame.frameLocator('frame[name="frame-left"]');
    await expect(leftFrame.locator('body')).toContainText('LEFT');
    
    // Handle middle frame within top frame
    const middleFrame = topFrame.frameLocator('frame[name="frame-middle"]');
    await expect(middleFrame.locator('body')).toContainText('MIDDLE');
    
    // Handle right frame within top frame
    const rightFrame = topFrame.frameLocator('frame[name="frame-right"]');
    await expect(rightFrame.locator('body')).toContainText('RIGHT');
    
    // Handle bottom frame
    const bottomFrame = page.frameLocator('frame[name="frame-bottom"]');
    await expect(bottomFrame.locator('body')).toContainText('BOTTOM');
  });

  test('Handle iframe switching and context switching', async ({ page }) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Multiple Iframes Test</h1>
        
        <iframe id="iframe-1" src="data:text/html,
          <!DOCTYPE html>
          <html><body>
            <h2>Iframe 1</h2>
            <button id='btn-1'>Button in Iframe 1</button>
            <p id='text-1'>Text in Iframe 1</p>
          </body></html>
        "></iframe>
        
        <iframe id="iframe-2" src="data:text/html,
          <!DOCTYPE html>
          <html><body>
            <h2>Iframe 2</h2>
            <button id='btn-2'>Button in Iframe 2</button>
            <p id='text-2'>Text in Iframe 2</p>
          </body></html>
        "></iframe>
        
        <button id="main-button">Main Page Button</button>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Access first iframe
    const iframe1 = page.frameLocator('#iframe-1');
    await expect(iframe1.locator('h2')).toHaveText('Iframe 1');
    await iframe1.locator('#btn-1').click();
    
    // Access second iframe
    const iframe2 = page.frameLocator('#iframe-2');
    await expect(iframe2.locator('h2')).toHaveText('Iframe 2');
    await iframe2.locator('#btn-2').click();
    
    // Switch back to main page
    await page.locator('#main-button').click();
    
    // Verify we can still interact with both iframes
    await expect(iframe1.locator('#text-1')).toBeVisible();
    await expect(iframe2.locator('#text-2')).toBeVisible();
  });

  test('Handle iframe with JavaScript interactions', async ({ page }) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>JavaScript Iframe Communication</h1>
        <button id="communicate-with-iframe">Send Message to Iframe</button>
        <div id="main-messages"></div>
        
        <iframe id="js-iframe" src="data:text/html,
          <!DOCTYPE html>
          <html>
          <body>
            <h2>JavaScript Iframe</h2>
            <button id='iframe-btn'>Send Message to Parent</button>
            <div id='iframe-messages'></div>
            
            <script>
              // Listen for messages from parent
              window.addEventListener('message', function(event) {
                if (event.data.type === 'PARENT_TO_IFRAME') {
                  document.getElementById('iframe-messages').innerHTML += 
                    '<p>Received from parent: ' + event.data.message + '</p>';
                }
              });
              
              // Send message to parent
              document.getElementById('iframe-btn').addEventListener('click', function() {
                window.parent.postMessage({
                  type: 'IFRAME_TO_PARENT',
                  message: 'Hello from iframe!'
                }, '*');
              });
            </script>
          </body>
          </html>
        "></iframe>
        
        <script>
          // Listen for messages from iframe
          window.addEventListener('message', function(event) {
            if (event.data.type === 'IFRAME_TO_PARENT') {
              document.getElementById('main-messages').innerHTML += 
                '<p>Received from iframe: ' + event.data.message + '</p>';
            }
          });
          
          // Send message to iframe
          document.getElementById('communicate-with-iframe').addEventListener('click', function() {
            const iframe = document.getElementById('js-iframe');
            iframe.contentWindow.postMessage({
              type: 'PARENT_TO_IFRAME',
              message: 'Hello from main page!'
            }, '*');
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Send message from main page to iframe
    await page.click('#communicate-with-iframe');
    
    // Verify message received in iframe
    const iframe = page.frameLocator('#js-iframe');
    await expect(iframe.locator('#iframe-messages')).toContainText('Received from parent: Hello from main page!');
    
    // Send message from iframe to main page
    await iframe.locator('#iframe-btn').click();
    
    // Verify message received in main page
    await expect(page.locator('#main-messages')).toContainText('Received from iframe: Hello from iframe!');
  });

  test('Handle iframe loading states and timeouts', async ({ page }) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Iframe Loading Test</h1>
        <button id="load-slow-iframe">Load Slow Iframe</button>
        <div id="iframe-container"></div>
        
        <script>
          document.getElementById('load-slow-iframe').addEventListener('click', function() {
            const iframe = document.createElement('iframe');
            iframe.id = 'slow-iframe';
            // Simulate slow loading iframe
            iframe.src = 'data:text/html,<!DOCTYPE html><html><body><h2>Slowly Loaded Iframe</h2><script>setTimeout(() => { document.body.innerHTML += "<p id=\\'loaded\\'>Content loaded after delay</p>"; }, 2000);</script></body></html>';
            document.getElementById('iframe-container').appendChild(iframe);
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Load iframe
    await page.click('#load-slow-iframe');
    
    // Wait for iframe to appear
    await page.waitForSelector('#slow-iframe');
    
    // Access iframe
    const slowIframe = page.frameLocator('#slow-iframe');
    
    // Wait for initial content
    await expect(slowIframe.locator('h2')).toHaveText('Slowly Loaded Iframe');
    
    // Wait for delayed content with timeout
    await expect(slowIframe.locator('#loaded')).toHaveText('Content loaded after delay', { timeout: 5000 });
  });

  test('Handle iframe with file operations', async ({ page }) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Iframe File Operations</h1>
        
        <iframe id="file-iframe" src="data:text/html,
          <!DOCTYPE html>
          <html>
          <body>
            <h2>File Operations in Iframe</h2>
            <input type='file' id='file-input' multiple>
            <button id='download-btn'>Download File</button>
            
            <script>
              document.getElementById('download-btn').addEventListener('click', function() {
                const link = document.createElement('a');
                link.href = 'data:text/plain;charset=utf-8,Hello from iframe file!';
                link.download = 'iframe-file.txt';
                link.click();
              });
            </script>
          </body>
          </html>
        "></iframe>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    const iframe = page.frameLocator('#file-iframe');
    
    // Interact with file input in iframe
    const fileInput = iframe.locator('#file-input');
    await expect(fileInput).toBeVisible();
    
    // Note: File upload testing would require actual file paths
    // This demonstrates the iframe file input is accessible
    
    // Test download from iframe
    const downloadPromise = page.waitForEvent('download');
    await iframe.locator('#download-btn').click();
    const download = await downloadPromise;
    
    expect(download.suggestedFilename()).toBe('iframe-file.txt');
  });

  test('Handle iframe security and permissions', async ({ page }) => {
    // Test iframe with different security policies
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Iframe Security Test</h1>
        
        <!-- Sandboxed iframe -->
        <iframe id="sandboxed-iframe" 
                sandbox="allow-scripts allow-same-origin" 
                src="data:text/html,
          <!DOCTYPE html>
          <html><body>
            <h2>Sandboxed Iframe</h2>
            <button id='sandbox-btn'>Sandboxed Button</button>
            <p id='sandbox-text'>Sandbox test</p>
          </body></html>
        "></iframe>
        
        <!-- Regular iframe -->
        <iframe id="regular-iframe" src="data:text/html,
          <!DOCTYPE html>
          <html><body>
            <h2>Regular Iframe</h2>
            <button id='regular-btn'>Regular Button</button>
          </body></html>
        "></iframe>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Test sandboxed iframe
    const sandboxedIframe = page.frameLocator('#sandboxed-iframe');
    await expect(sandboxedIframe.locator('h2')).toHaveText('Sandboxed Iframe');
    await sandboxedIframe.locator('#sandbox-btn').click();
    
    // Test regular iframe
    const regularIframe = page.frameLocator('#regular-iframe');
    await expect(regularIframe.locator('h2')).toHaveText('Regular Iframe');
    await regularIframe.locator('#regular-btn').click();
    
    // Both should be functional despite different security contexts
    await expect(sandboxedIframe.locator('#sandbox-text')).toBeVisible();
    await expect(regularIframe.locator('#regular-btn')).toBeVisible();
  });
});