const { test, expect } = require('@playwright/test');

test.describe('Network Commands and Interception', () => {
  
  test('Basic request interception and monitoring', async ({ page }) => {
    const requests = [];
    const responses = [];
    
    // Monitor all requests
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        headers: request.headers()
      });
      console.log(`Request: ${request.method()} ${request.url()}`);
    });
    
    // Monitor all responses
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
      console.log(`Response: ${response.status()} ${response.url()}`);
    });
    
    await page.goto('https://httpbin.org/json');
    
    // Verify requests were captured
    expect(requests.length).toBeGreaterThan(0);
    expect(responses.length).toBeGreaterThan(0);
    
    // Find main page request
    const mainRequest = requests.find(req => req.url.includes('httpbin.org/json'));
    expect(mainRequest).toBeDefined();
    expect(mainRequest.method).toBe('GET');
  });

  test('Mock API responses', async ({ page }) => {
    // Mock a specific API endpoint
    await page.route('**/api/users/**', async route => {
      const mockResponse = {
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ]
      };
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });
    
    // Create a test page that makes API calls
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head><title>API Test</title></head>
      <body>
        <button id="loadUsers">Load Users</button>
        <div id="users"></div>
        <script>
          document.getElementById('loadUsers').addEventListener('click', async () => {
            try {
              const response = await fetch('/api/users/all');
              const data = await response.json();
              document.getElementById('users').innerHTML = 
                data.users.map(user => '<div>' + user.name + ' - ' + user.email + '</div>').join('');
            } catch (error) {
              document.getElementById('users').innerHTML = 'Error: ' + error.message;
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Click button to trigger API call
    await page.click('#loadUsers');
    
    // Verify mocked response is displayed
    await expect(page.locator('#users')).toContainText('John Doe - john@example.com');
    await expect(page.locator('#users')).toContainText('Jane Smith - jane@example.com');
  });

  test('Intercept and modify requests', async ({ page }) => {
    // Intercept and modify requests
    await page.route('**/httpbin.org/**', async (route, request) => {
      // Modify request headers
      const headers = {
        ...request.headers(),
        'X-Custom-Header': 'Modified by Playwright',
        'User-Agent': 'Playwright-Test-Agent'
      };
      
      // Continue with modified request
      await route.continue({
        headers
      });
    });
    
    // Track the modified request
    let modifiedRequest = null;
    page.on('request', request => {
      if (request.url().includes('httpbin.org')) {
        modifiedRequest = request;
      }
    });
    
    await page.goto('https://httpbin.org/headers');
    
    // Verify request was modified
    expect(modifiedRequest).toBeDefined();
    
    // Check if page shows our custom headers
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('X-Custom-Header');
    expect(pageContent).toContain('Playwright-Test-Agent');
  });

  test('Mock network failures and errors', async ({ page }) => {
    // Mock network failures
    await page.route('**/api/unreliable/**', async route => {
      // Simulate different types of failures
      const random = Math.random();
      
      if (random < 0.3) {
        // Simulate network error
        await route.abort('internetdisconnected');
      } else if (random < 0.6) {
        // Simulate server error
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      } else {
        // Simulate timeout (slow response)
        await new Promise(resolve => setTimeout(resolve, 5000));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Finally succeeded!' })
        });
      }
    });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <button id="makeRequest">Make Unreliable Request</button>
        <div id="result"></div>
        <script>
          document.getElementById('makeRequest').addEventListener('click', async () => {
            const resultDiv = document.getElementById('result');
            resultDiv.textContent = 'Loading...';
            
            try {
              const response = await fetch('/api/unreliable/test');
              if (response.ok) {
                const data = await response.json();
                resultDiv.textContent = 'Success: ' + data.message;
              } else {
                const error = await response.json();
                resultDiv.textContent = 'Server Error: ' + error.error;
              }
            } catch (error) {
              resultDiv.textContent = 'Network Error: ' + error.message;
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Try the unreliable endpoint
    await page.click('#makeRequest');
    
    // Wait for some result (success, server error, or network error)
    await page.waitForFunction(() => {
      const result = document.getElementById('result').textContent;
      return result !== 'Loading...' && result !== '';
    }, {}, { timeout: 10000 });
    
    const result = await page.textContent('#result');
    expect(['Success:', 'Server Error:', 'Network Error:']).toContain(
      result.split(' ')[0] + ' ' + result.split(' ')[1]
    );
  });

  test('Intercept and validate request data', async ({ page }) => {
    const interceptedRequests = [];
    
    // Intercept POST requests and capture data
    await page.route('**/httpbin.org/post', async (route, request) => {
      const postData = request.postData();
      const headers = request.headers();
      
      interceptedRequests.push({
        method: request.method(),
        url: request.url(),
        postData: postData,
        contentType: headers['content-type']
      });
      
      // Continue with original request
      await route.continue();
    });
    
    // Create form and submit data
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <form id="testForm" action="https://httpbin.org/post" method="POST">
          <input name="username" value="testuser" />
          <input name="email" value="test@example.com" />
          <input type="submit" value="Submit" />
        </form>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Submit form
    await page.click('input[type="submit"]');
    
    // Wait for request to be intercepted
    await page.waitForResponse(response => 
      response.url().includes('httpbin.org/post')
    );
    
    // Verify intercepted data
    expect(interceptedRequests).toHaveLength(1);
    const request = interceptedRequests[0];
    expect(request.method).toBe('POST');
    expect(request.postData).toContain('username=testuser');
    expect(request.postData).toContain('email=test%40example.com');
  });

  test('Response modification and caching', async ({ page }) => {
    const responseCache = new Map();
    
    // Intercept and modify responses
    await page.route('**/httpbin.org/json', async (route, request) => {
      const url = request.url();
      
      // Check cache first
      if (responseCache.has(url)) {
        console.log('Serving from cache');
        const cachedResponse = responseCache.get(url);
        await route.fulfill(cachedResponse);
        return;
      }
      
      // Get original response
      const response = await route.fetch();
      const originalData = await response.json();
      
      // Modify response data
      const modifiedData = {
        ...originalData,
        modified: true,
        timestamp: new Date().toISOString(),
        playwright_injected: 'This was modified by Playwright'
      };
      
      const modifiedResponse = {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(modifiedData)
      };
      
      // Cache the modified response
      responseCache.set(url, modifiedResponse);
      
      await route.fulfill(modifiedResponse);
    });
    
    // First request
    await page.goto('https://httpbin.org/json');
    let content = await page.textContent('body');
    expect(content).toContain('playwright_injected');
    expect(content).toContain('"modified":true');
    
    // Second request (should use cache)
    await page.reload();
    content = await page.textContent('body');
    expect(content).toContain('playwright_injected');
  });

  test('Network throttling and conditions', async ({ page, context }) => {
    // Enable slow 3G simulation
    const client = await context.newCDPSession(page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8,          // 750 Kbps
      latency: 40                                 // 40ms
    });
    
    const startTime = Date.now();
    await page.goto('https://httpbin.org/delay/2');
    const endTime = Date.now();
    
    const totalTime = endTime - startTime;
    console.log(`Request completed in ${totalTime}ms with throttling`);
    
    // Verify request took longer due to throttling
    expect(totalTime).toBeGreaterThan(2000); // At least 2 seconds due to delay + throttling
    
    // Disable throttling
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0
    });
  });

  test('Monitor WebSocket connections', async ({ page }) => {
    const wsMessages = [];
    
    // Monitor WebSocket frames
    page.on('websocket', ws => {
      console.log(`WebSocket opened: ${ws.url()}`);
      
      ws.on('framesent', event => {
        wsMessages.push({ type: 'sent', payload: event.payload });
        console.log('WS Sent:', event.payload);
      });
      
      ws.on('framereceived', event => {
        wsMessages.push({ type: 'received', payload: event.payload });
        console.log('WS Received:', event.payload);
      });
      
      ws.on('close', () => console.log('WebSocket closed'));
    });
    
    // Create a page with WebSocket connection
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <button id="connect">Connect WebSocket</button>
        <button id="sendMessage">Send Message</button>
        <div id="messages"></div>
        <script>
          let ws;
          
          document.getElementById('connect').addEventListener('click', () => {
            ws = new WebSocket('wss://echo.websocket.org/');
            
            ws.onopen = () => {
              document.getElementById('messages').innerHTML += '<div>Connected</div>';
            };
            
            ws.onmessage = (event) => {
              document.getElementById('messages').innerHTML += 
                '<div>Received: ' + event.data + '</div>';
            };
          });
          
          document.getElementById('sendMessage').addEventListener('click', () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send('Hello from Playwright test!');
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Connect WebSocket
    await page.click('#connect');
    await page.waitForTimeout(2000); // Wait for connection
    
    // Send message
    await page.click('#sendMessage');
    
    // Wait for messages
    await page.waitForTimeout(2000);
    
    // Verify WebSocket messages were captured
    expect(wsMessages.length).toBeGreaterThan(0);
    const sentMessages = wsMessages.filter(msg => msg.type === 'sent');
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].payload).toContain('Hello from Playwright test!');
  });

  test('API rate limiting simulation', async ({ page }) => {
    let requestCount = 0;
    const rateLimitWindow = 10000; // 10 seconds
    const maxRequests = 3;
    let windowStartTime = Date.now();
    
    await page.route('**/api/rate-limited/**', async route => {
      const now = Date.now();
      
      // Reset window if expired
      if (now - windowStartTime > rateLimitWindow) {
        requestCount = 0;
        windowStartTime = now;
      }
      
      requestCount++;
      
      if (requestCount > maxRequests) {
        await route.fulfill({
          status: 429,
          contentType: 'application/json',
          headers: {
            'Retry-After': '10',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0'
          },
          body: JSON.stringify({
            error: 'Rate limit exceeded',
            retryAfter: 10
          })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': (maxRequests - requestCount).toString()
          },
          body: JSON.stringify({
            message: 'Request successful',
            requestNumber: requestCount
          })
        });
      }
    });
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <button id="makeRequest">Make Request</button>
        <div id="results"></div>
        <script>
          document.getElementById('makeRequest').addEventListener('click', async () => {
            try {
              const response = await fetch('/api/rate-limited/test');
              const data = await response.json();
              const div = document.createElement('div');
              div.textContent = response.status + ': ' + JSON.stringify(data);
              document.getElementById('results').appendChild(div);
            } catch (error) {
              const div = document.createElement('div');
              div.textContent = 'Error: ' + error.message;
              document.getElementById('results').appendChild(div);
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(htmlContent);
    
    // Make requests to trigger rate limiting
    for (let i = 0; i < 5; i++) {
      await page.click('#makeRequest');
      await page.waitForTimeout(500);
    }
    
    // Verify rate limiting occurred
    await expect(page.locator('#results')).toContainText('429:');
    await expect(page.locator('#results')).toContainText('Rate limit exceeded');
  });
});