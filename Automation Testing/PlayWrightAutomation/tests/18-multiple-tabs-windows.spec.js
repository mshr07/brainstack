const { test, expect } = require('@playwright/test');

test.describe('Multiple Browser Tabs and Windows', () => {
  
  test('Handle popup windows', async ({ page, context }) => {
    await page.goto('https://the-internet.herokuapp.com/windows');
    
    // Listen for new page creation
    const pagePromise = context.waitForEvent('page');
    
    // Click link that opens new window
    await page.click('a[href="/windows/new"]');
    
    // Get the new page
    const newPage = await pagePromise;
    await newPage.waitForLoadState();
    
    // Verify new window content
    await expect(newPage.locator('h3')).toHaveText('New Window');
    
    // Verify we still have access to original page
    await expect(page.locator('h3')).toHaveText('Opening a new window');
    
    // Work with both pages
    const originalTitle = await page.title();
    const newTitle = await newPage.title();
    
    console.log('Original page title:', originalTitle);
    console.log('New page title:', newTitle);
    
    // Close the new page
    await newPage.close();
    
    // Verify original page is still active
    await expect(page.locator('h3')).toHaveText('Opening a new window');
  });

  test('Handle multiple tabs with different contexts', async ({ browser }) => {
    // Create multiple browser contexts (isolated sessions)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    // Create pages in different contexts
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Navigate to different pages
    await page1.goto('https://the-internet.herokuapp.com/login');
    await page2.goto('https://httpbin.org/json');
    
    // Login in context1
    await page1.fill('#username', 'tomsmith');
    await page1.fill('#password', 'SuperSecretPassword!');
    await page1.click('button[type="submit"]');
    
    // Verify login success in context1
    await page1.waitForURL(/secure/);
    await expect(page1.locator('h2')).toHaveText('Secure Area');
    
    // Verify context2 is unaffected
    const page2Content = await page2.textContent('body');
    expect(page2Content).toContain('slideshow');
    
    // Close contexts
    await context1.close();
    await context2.close();
  });

  test('Switch between multiple tabs', async ({ page, context }) => {
    await page.goto('https://the-internet.herokuapp.com/windows');
    
    // Open multiple tabs
    const tab1Promise = context.waitForEvent('page');
    await page.click('a[href="/windows/new"]');
    const tab1 = await tab1Promise;
    await tab1.waitForLoadState();
    
    // Open another tab by evaluating JavaScript
    const tab2Promise = context.waitForEvent('page');
    await page.evaluate(() => {
      window.open('/windows/new', '_blank');
    });
    const tab2 = await tab2Promise;
    await tab2.waitForLoadState();
    
    // Now we have 3 tabs total (original + 2 new ones)
    const pages = context.pages();
    expect(pages).toHaveLength(3);
    
    // Work with each tab
    const originalPage = pages[0];
    const firstTab = pages[1];
    const secondTab = pages[2];
    
    // Verify content of each tab
    await expect(originalPage.locator('h3')).toHaveText('Opening a new window');
    await expect(firstTab.locator('h3')).toHaveText('New Window');
    await expect(secondTab.locator('h3')).toHaveText('New Window');
    
    // Add unique content to distinguish tabs
    await firstTab.evaluate(() => {
      document.body.style.backgroundColor = 'lightblue';
      document.querySelector('h3').textContent = 'First New Window';
    });
    
    await secondTab.evaluate(() => {
      document.body.style.backgroundColor = 'lightgreen';
      document.querySelector('h3').textContent = 'Second New Window';
    });
    
    // Verify changes
    await expect(firstTab.locator('h3')).toHaveText('First New Window');
    await expect(secondTab.locator('h3')).toHaveText('Second New Window');
    
    // Close tabs in reverse order
    await secondTab.close();
    await firstTab.close();
    
    // Verify only original tab remains
    expect(context.pages()).toHaveLength(1);
  });

  test('Handle window focus and blur events', async ({ page, context }) => {
    await page.goto('data:text/html,<html><body><h1>Main Window</h1><div id="status">Active</div></body></html>');
    
    // Add event listeners
    await page.evaluate(() => {
      window.addEventListener('focus', () => {
        document.getElementById('status').textContent = 'Active';
      });
      
      window.addEventListener('blur', () => {
        document.getElementById('status').textContent = 'Inactive';
      });
    });
    
    // Verify initial state
    await expect(page.locator('#status')).toHaveText('Active');
    
    // Open new window
    const newPagePromise = context.waitForEvent('page');
    await page.evaluate(() => {
      window.open('data:text/html,<html><body><h1>New Window</h1></body></html>', '_blank');
    });
    const newPage = await newPagePromise;
    await newPage.waitForLoadState();
    
    // Focus should shift to new window
    // Note: In headless mode, focus events might not work as expected
    // This test is more relevant in headed mode
    
    // Bring focus back to original page
    await page.bringToFront();
    
    // Close new window
    await newPage.close();
    
    await expect(page.locator('#status')).toBeVisible();
  });

  test('Share data between tabs using localStorage', async ({ page, context }) => {
    // Navigate to a page and set localStorage
    await page.goto('https://example.com');
    
    await page.evaluate(() => {
      localStorage.setItem('sharedData', JSON.stringify({
        user: 'testUser',
        timestamp: Date.now(),
        tabId: 'main'
      }));
    });
    
    // Open new tab with same origin
    const newTabPromise = context.waitForEvent('page');
    await page.evaluate(() => {
      window.open('/', '_blank');
    });
    const newTab = await newTabPromise;
    await newTab.waitForLoadState();
    
    // Read shared data from new tab
    const sharedData = await newTab.evaluate(() => {
      return JSON.parse(localStorage.getItem('sharedData'));
    });
    
    expect(sharedData.user).toBe('testUser');
    expect(sharedData.tabId).toBe('main');
    
    // Update data from new tab
    await newTab.evaluate(() => {
      const data = JSON.parse(localStorage.getItem('sharedData'));
      data.tabId = 'secondary';
      data.updatedBy = 'newTab';
      localStorage.setItem('sharedData', JSON.stringify(data));
    });
    
    // Read updated data from original tab
    const updatedData = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('sharedData'));
    });
    
    expect(updatedData.tabId).toBe('secondary');
    expect(updatedData.updatedBy).toBe('newTab');
    
    await newTab.close();
  });

  test('Handle cross-tab communication with postMessage', async ({ page, context }) => {
    // Create main page with message handling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Main Window</h1>
        <button id="openTab">Open New Tab</button>
        <button id="sendMessage">Send Message</button>
        <div id="messages"></div>
        <script>
          let childWindow = null;
          
          document.getElementById('openTab').addEventListener('click', () => {
            childWindow = window.open('about:blank', 'childTab');
            childWindow.document.write(\`
              <!DOCTYPE html>
              <html>
              <body>
                <h1>Child Window</h1>
                <button onclick="sendToParent()">Send to Parent</button>
                <div id="messages"></div>
                <script>
                  window.addEventListener('message', (event) => {
                    document.getElementById('messages').innerHTML += 
                      '<div>Received: ' + event.data + '</div>';
                  });
                  
                  function sendToParent() {
                    window.opener.postMessage('Hello from child!', '*');
                  }
                </script>
              </body>
              </html>
            \`);
          });
          
          document.getElementById('sendMessage').addEventListener('click', () => {
            if (childWindow) {
              childWindow.postMessage('Hello from parent!', '*');
            }
          });
          
          window.addEventListener('message', (event) => {
            document.getElementById('messages').innerHTML += 
              '<div>Received: ' + event.data + '</div>';
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Open new tab
    const newTabPromise = context.waitForEvent('page');
    await page.click('#openTab');
    const newTab = await newTabPromise;
    await newTab.waitForLoadState();
    
    // Send message from parent to child
    await page.click('#sendMessage');
    await expect(newTab.locator('#messages')).toContainText('Hello from parent!');
    
    // Send message from child to parent
    await newTab.click('button');
    await expect(page.locator('#messages')).toContainText('Hello from child!');
    
    await newTab.close();
  });

  test('Manage multiple browser instances', async ({ browser }) => {
    // Create multiple browser contexts for different users/sessions
    const userContext1 = await browser.newContext({
      userAgent: 'User1-Agent',
      viewport: { width: 1920, height: 1080 }
    });
    
    const userContext2 = await browser.newContext({
      userAgent: 'User2-Agent',
      viewport: { width: 1366, height: 768 }
    });
    
    // Create pages for each user
    const user1Page = await userContext1.newPage();
    const user2Page = await userContext2.newPage();
    
    // Navigate both users to login page
    await Promise.all([
      user1Page.goto('https://the-internet.herokuapp.com/login'),
      user2Page.goto('https://the-internet.herokuapp.com/login')
    ]);
    
    // Perform different actions for each user
    // User 1 - successful login
    await user1Page.fill('#username', 'tomsmith');
    await user1Page.fill('#password', 'SuperSecretPassword!');
    await user1Page.click('button[type="submit"]');
    await user1Page.waitForURL(/secure/);
    
    // User 2 - failed login attempt
    await user2Page.fill('#username', 'wronguser');
    await user2Page.fill('#password', 'wrongpassword');
    await user2Page.click('button[type="submit"]');
    
    // Verify different outcomes
    await expect(user1Page.locator('h2')).toHaveText('Secure Area');
    await expect(user2Page.locator('#flash')).toContainText('Your username is invalid!');
    
    // Check viewport differences
    const user1Viewport = await user1Page.evaluate(() => {
      return { width: window.innerWidth, height: window.innerHeight };
    });
    
    const user2Viewport = await user2Page.evaluate(() => {
      return { width: window.innerWidth, height: window.innerHeight };
    });
    
    expect(user1Viewport.width).toBe(1920);
    expect(user2Viewport.width).toBe(1366);
    
    // Close contexts
    await userContext1.close();
    await userContext2.close();
  });

  test('Handle dynamic tab creation and management', async ({ page, context }) => {
    await page.goto('data:text/html,<html><body><h1>Tab Manager</h1><div id="tabs"></div></body></html>');
    
    const tabs = [];
    
    // Create multiple tabs dynamically
    for (let i = 1; i <= 3; i++) {
      const tabPromise = context.waitForEvent('page');
      
      await page.evaluate((tabNum) => {
        window.open(`data:text/html,<html><body><h1>Tab ${tabNum}</h1><div id="content">Content ${tabNum}</div></body></html>`, '_blank');
      }, i);
      
      const newTab = await tabPromise;
      await newTab.waitForLoadState();
      tabs.push(newTab);
    }
    
    // Verify all tabs were created
    expect(tabs).toHaveLength(3);
    expect(context.pages()).toHaveLength(4); // Original + 3 new tabs
    
    // Verify content of each tab
    for (let i = 0; i < tabs.length; i++) {
      await expect(tabs[i].locator('h1')).toHaveText(`Tab ${i + 1}`);
      await expect(tabs[i].locator('#content')).toHaveText(`Content ${i + 1}`);
    }
    
    // Close tabs in random order
    await tabs[1].close(); // Close second tab
    await tabs[0].close(); // Close first tab
    await tabs[2].close(); // Close third tab
    
    // Only original page should remain
    expect(context.pages()).toHaveLength(1);
  });

  test('Handle tab with authentication and cookies', async ({ browser }) => {
    const context = await browser.newContext();
    const page1 = await context.newPage();
    
    // Login on first tab
    await page1.goto('https://the-internet.herokuapp.com/login');
    await page1.fill('#username', 'tomsmith');
    await page1.fill('#password', 'SuperSecretPassword!');
    await page1.click('button[type="submit"]');
    await page1.waitForURL(/secure/);
    
    // Open second tab - should share same session
    const page2 = await context.newPage();
    await page2.goto('https://the-internet.herokuapp.com/secure');
    
    // Both tabs should be authenticated
    await expect(page1.locator('h2')).toHaveText('Secure Area');
    await expect(page2.locator('h2')).toHaveText('Secure Area');
    
    // Logout from first tab
    await page1.click('a[href="/logout"]');
    await page1.waitForURL(/login/);
    
    // Second tab should still be accessible initially
    await expect(page2.locator('h2')).toHaveText('Secure Area');
    
    // But refreshing should require login again
    await page2.reload();
    await expect(page2.locator('#flash')).toContainText('You must login');
    
    await context.close();
  });

  test('Handle file downloads across multiple tabs', async ({ browser }) => {
    const context = await browser.newContext();
    
    // Create multiple tabs for downloading
    const downloadTab1 = await context.newPage();
    const downloadTab2 = await context.newPage();
    
    await Promise.all([
      downloadTab1.goto('https://the-internet.herokuapp.com/download'),
      downloadTab2.goto('https://the-internet.herokuapp.com/download')
    ]);
    
    // Start downloads from both tabs simultaneously
    const download1Promise = downloadTab1.waitForEvent('download');
    const download2Promise = downloadTab2.waitForEvent('download');
    
    // Click first available download link in each tab
    await Promise.all([
      downloadTab1.click('a[href^="/download/"]'),
      downloadTab2.click('a[href^="/download/"]:nth-of-type(2)')
    ]);
    
    // Wait for both downloads to start
    const [download1, download2] = await Promise.all([download1Promise, download2Promise]);
    
    // Verify downloads
    expect(download1.suggestedFilename()).toBeTruthy();
    expect(download2.suggestedFilename()).toBeTruthy();
    
    console.log('Download 1:', download1.suggestedFilename());
    console.log('Download 2:', download2.suggestedFilename());
    
    await context.close();
  });
});