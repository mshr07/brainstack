const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Test data as JSON objects
const testUsers = [
  {
    "id": 1,
    "username": "tomsmith",
    "password": "SuperSecretPassword!",
    "fullName": "Tom Smith",
    "email": "tom@example.com",
    "role": "admin",
    "expectedResult": "success"
  },
  {
    "id": 2,
    "username": "invaliduser",
    "password": "wrongpassword",
    "fullName": "Invalid User",
    "email": "invalid@example.com",
    "role": "user",
    "expectedResult": "failure"
  },
  {
    "id": 3,
    "username": "testuser",
    "password": "TestPass123",
    "fullName": "Test User",
    "email": "test@example.com",
    "role": "user",
    "expectedResult": "failure"
  }
];

const formTestData = [
  {
    "testCase": "Valid Form Submission",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "123-456-7890",
    "message": "This is a test message",
    "expectedResult": "success"
  },
  {
    "testCase": "Invalid Email Format",
    "name": "Jane Smith",
    "email": "invalid-email",
    "phone": "987-654-3210",
    "message": "Test message with invalid email",
    "expectedResult": "validation_error"
  },
  {
    "testCase": "Empty Required Fields",
    "name": "",
    "email": "",
    "phone": "555-123-4567",
    "message": "Message with empty required fields",
    "expectedResult": "validation_error"
  }
];

test.describe('JSON Data Driven Tests in Playwright', () => {
  
  test.beforeAll(async () => {
    // Create test data files for testing
    const testDataDir = path.join(__dirname, 'test-data');
    
    // Ensure test data directory exists
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Write test data to JSON files
    fs.writeFileSync(
      path.join(testDataDir, 'users.json'),
      JSON.stringify(testUsers, null, 2)
    );
    
    fs.writeFileSync(
      path.join(testDataDir, 'form-data.json'),
      JSON.stringify(formTestData, null, 2)
    );
    
    // Create configuration data
    const configData = {
      "baseUrl": "https://the-internet.herokuapp.com",
      "timeout": 30000,
      "retries": 2,
      "browsers": ["chrome", "firefox"],
      "environments": {
        "dev": {
          "url": "https://dev.example.com",
          "apiUrl": "https://api-dev.example.com"
        },
        "staging": {
          "url": "https://staging.example.com",
          "apiUrl": "https://api-staging.example.com"
        },
        "prod": {
          "url": "https://example.com",
          "apiUrl": "https://api.example.com"
        }
      }
    };
    
    fs.writeFileSync(
      path.join(testDataDir, 'config.json'),
      JSON.stringify(configData, null, 2)
    );
  });

  // Data-driven login tests using JSON data
  for (const userData of testUsers) {
    test(`Login test for user: ${userData.username} (${userData.expectedResult})`, async ({ page }) => {
      await page.goto('https://the-internet.herokuapp.com/login');
      
      // Fill login form with data from JSON
      await page.fill('#username', userData.username);
      await page.fill('#password', userData.password);
      await page.click('button[type="submit"]');
      
      if (userData.expectedResult === 'success') {
        // Expect successful login
        await expect(page).toHaveURL(/secure/);
        await expect(page.locator('h2')).toHaveText('Secure Area');
        await expect(page.locator('.flash.success')).toContainText('You logged into a secure area!');
      } else {
        // Expect login failure
        await expect(page).toHaveURL(/login/);
        await expect(page.locator('.flash.error')).toContainText('Your username is invalid!');
      }
      
      console.log(`Test completed for user: ${userData.fullName} (${userData.role})`);
    });
  }

  test('Read JSON data from external file', async ({ page }) => {
    // Read data from JSON file
    const testDataPath = path.join(__dirname, 'test-data', 'users.json');
    const jsonData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
    
    console.log('Loaded test data:', jsonData.length, 'users');
    
    // Use first valid user for login
    const validUser = jsonData.find(user => user.expectedResult === 'success');
    
    await page.goto('https://the-internet.herokuapp.com/login');
    await page.fill('#username', validUser.username);
    await page.fill('#password', validUser.password);
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/secure/);
    console.log(`Successfully logged in with user from JSON: ${validUser.fullName}`);
  });

  test('Configuration-driven test execution', async ({ page }) => {
    // Read configuration from JSON
    const configPath = path.join(__dirname, 'test-data', 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    console.log('Using configuration:', config);
    
    // Use configuration data
    await page.goto(config.baseUrl + '/login');
    
    // Set timeout from config
    page.setDefaultTimeout(config.timeout);
    
    // Use environment-specific data
    const env = 'dev'; // Could be set from environment variable
    console.log(`Testing against ${env} environment:`, config.environments[env]);
    
    // Verify page loads within configured timeout
    await expect(page.locator('h2')).toHaveText('Login Page');
  });

  // Data-driven form tests
  for (const formData of formTestData) {
    test(`Form test: ${formData.testCase}`, async ({ page }) => {
      // Create a test form page
      const formPageContent = `
        <!DOCTYPE html>
        <html>
        <body>
          <h1>Contact Form</h1>
          <form id="contact-form">
            <input type="text" id="name" placeholder="Name" required>
            <input type="email" id="email" placeholder="Email" required>
            <input type="tel" id="phone" placeholder="Phone">
            <textarea id="message" placeholder="Message" required></textarea>
            <button type="submit">Submit</button>
          </form>
          <div id="result"></div>
          
          <script>
            document.getElementById('contact-form').addEventListener('submit', function(e) {
              e.preventDefault();
              const name = document.getElementById('name').value;
              const email = document.getElementById('email').value;
              const phone = document.getElementById('phone').value;
              const message = document.getElementById('message').value;
              
              // Basic validation
              if (!name || !email || !message) {
                document.getElementById('result').textContent = 'Please fill in all required fields';
                return;
              }
              
              if (!email.includes('@')) {
                document.getElementById('result').textContent = 'Please enter a valid email address';
                return;
              }
              
              document.getElementById('result').textContent = 'Form submitted successfully!';
            });
          </script>
        </body>
        </html>
      `;
      
      await page.setContent(formPageContent);
      
      // Fill form with JSON data
      await page.fill('#name', formData.name);
      await page.fill('#email', formData.email);
      await page.fill('#phone', formData.phone);
      await page.fill('#message', formData.message);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Verify expected result
      const resultElement = page.locator('#result');
      
      if (formData.expectedResult === 'success') {
        await expect(resultElement).toHaveText('Form submitted successfully!');
      } else if (formData.expectedResult === 'validation_error') {
        await expect(resultElement).toContainText(/Please|valid/);
      }
      
      console.log(`Test case "${formData.testCase}" completed with expected result: ${formData.expectedResult}`);
    });
  }

  test('Dynamic JSON data loading and processing', async ({ page }) => {
    // Simulate loading data from different sources
    const dynamicTestData = {
      "products": [
        { "id": 1, "name": "Laptop", "price": 999.99, "category": "Electronics" },
        { "id": 2, "name": "Book", "price": 19.99, "category": "Books" },
        { "id": 3, "name": "Headphones", "price": 149.99, "category": "Electronics" }
      ],
      "search_terms": ["laptop", "book", "headphones", "invalid-product"],
      "filters": {
        "price_ranges": [
          { "min": 0, "max": 50 },
          { "min": 50, "max": 200 },
          { "min": 200, "max": 1000 }
        ]
      }
    };
    
    // Create a mock e-commerce page
    const ecommercePage = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>Product Search</h1>
        <input type="text" id="search" placeholder="Search products...">
        <button id="search-btn">Search</button>
        <div id="results"></div>
        
        <script>
          const products = ${JSON.stringify(dynamicTestData.products)};
          
          document.getElementById('search-btn').addEventListener('click', function() {
            const searchTerm = document.getElementById('search').value.toLowerCase();
            const results = products.filter(p => 
              p.name.toLowerCase().includes(searchTerm) || 
              p.category.toLowerCase().includes(searchTerm)
            );
            
            const resultsDiv = document.getElementById('results');
            if (results.length === 0) {
              resultsDiv.innerHTML = '<p>No products found</p>';
            } else {
              resultsDiv.innerHTML = results.map(p => 
                '<div class="product">' + p.name + ' - $' + p.price + '</div>'
              ).join('');
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(ecommercePage);
    
    // Test each search term from JSON data
    for (const searchTerm of dynamicTestData.search_terms) {
      await page.fill('#search', searchTerm);
      await page.click('#search-btn');
      
      const results = page.locator('#results');
      await expect(results).toBeVisible();
      
      // Verify results based on search term
      if (searchTerm === 'invalid-product') {
        await expect(results).toContainText('No products found');
      } else {
        await expect(results.locator('.product')).toHaveCount({ atLeast: 1 });
      }
      
      console.log(`Search test completed for term: "${searchTerm}"`);
    }
  });

  test('Complex data structures and nested JSON processing', async ({ page }) => {
    const complexTestData = {
      "user_profiles": [
        {
          "id": 1,
          "personal_info": {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@example.com"
          },
          "preferences": {
            "theme": "dark",
            "notifications": {
              "email": true,
              "sms": false,
              "push": true
            }
          },
          "permissions": ["read", "write", "admin"]
        },
        {
          "id": 2,
          "personal_info": {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@example.com"
          },
          "preferences": {
            "theme": "light",
            "notifications": {
              "email": false,
              "sms": true,
              "push": false
            }
          },
          "permissions": ["read"]
        }
      ]
    };
    
    // Create user profile page
    const profilePageContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>User Profile</h1>
        <div id="profile-form">
          <input type="text" id="first-name" placeholder="First Name">
          <input type="text" id="last-name" placeholder="Last Name">
          <input type="email" id="email" placeholder="Email">
          <select id="theme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <label>
            <input type="checkbox" id="email-notifications"> Email Notifications
          </label>
          <label>
            <input type="checkbox" id="sms-notifications"> SMS Notifications
          </label>
          <label>
            <input type="checkbox" id="push-notifications"> Push Notifications
          </label>
          <button id="save-profile">Save Profile</button>
        </div>
        <div id="saved-data"></div>
        
        <script>
          document.getElementById('save-profile').addEventListener('click', function() {
            const profileData = {
              firstName: document.getElementById('first-name').value,
              lastName: document.getElementById('last-name').value,
              email: document.getElementById('email').value,
              theme: document.getElementById('theme').value,
              notifications: {
                email: document.getElementById('email-notifications').checked,
                sms: document.getElementById('sms-notifications').checked,
                push: document.getElementById('push-notifications').checked
              }
            };
            
            document.getElementById('saved-data').textContent = JSON.stringify(profileData);
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(profilePageContent);
    
    // Test each user profile from complex JSON data
    for (const userProfile of complexTestData.user_profiles) {
      // Fill form with nested data
      await page.fill('#first-name', userProfile.personal_info.first_name);
      await page.fill('#last-name', userProfile.personal_info.last_name);
      await page.fill('#email', userProfile.personal_info.email);
      await page.selectOption('#theme', userProfile.preferences.theme);
      
      // Handle notification preferences
      const emailNotificationCheckbox = page.locator('#email-notifications');
      if (userProfile.preferences.notifications.email) {
        await emailNotificationCheckbox.check();
      } else {
        await emailNotificationCheckbox.uncheck();
      }
      
      const smsNotificationCheckbox = page.locator('#sms-notifications');
      if (userProfile.preferences.notifications.sms) {
        await smsNotificationCheckbox.check();
      } else {
        await smsNotificationCheckbox.uncheck();
      }
      
      const pushNotificationCheckbox = page.locator('#push-notifications');
      if (userProfile.preferences.notifications.push) {
        await pushNotificationCheckbox.check();
      } else {
        await pushNotificationCheckbox.uncheck();
      }
      
      // Save profile
      await page.click('#save-profile');
      
      // Verify saved data contains expected information
      const savedData = page.locator('#saved-data');
      await expect(savedData).toContainText(userProfile.personal_info.first_name);
      await expect(savedData).toContainText(userProfile.personal_info.email);
      await expect(savedData).toContainText(userProfile.preferences.theme);
      
      console.log(`Profile test completed for user: ${userProfile.personal_info.first_name} ${userProfile.personal_info.last_name}`);
    }
  });

  test('JSON data validation and error handling', async ({ page }) => {
    // Test error handling with malformed or missing data
    const testScenarios = [
      {
        "name": "Valid JSON Data",
        "data": '{"name": "Test User", "email": "test@example.com"}',
        "expected": "success"
      },
      {
        "name": "Invalid JSON Format",
        "data": '{"name": "Test User", "email": "test@example.com"',
        "expected": "parse_error"
      },
      {
        "name": "Missing Required Fields",
        "data": '{"name": "Test User"}',
        "expected": "validation_error"
      }
    ];
    
    const testPageContent = `
      <!DOCTYPE html>
      <html>
      <body>
        <h1>JSON Data Processor</h1>
        <textarea id="json-input" placeholder="Enter JSON data..."></textarea>
        <button id="process-json">Process JSON</button>
        <div id="json-result"></div>
        
        <script>
          document.getElementById('process-json').addEventListener('click', function() {
            const input = document.getElementById('json-input').value;
            const resultDiv = document.getElementById('json-result');
            
            try {
              const data = JSON.parse(input);
              
              if (!data.name || !data.email) {
                resultDiv.textContent = 'Validation Error: Missing required fields';
                return;
              }
              
              resultDiv.textContent = 'Success: Data processed for ' + data.name;
            } catch (error) {
              resultDiv.textContent = 'Parse Error: Invalid JSON format';
            }
          });
        </script>
      </body>
      </html>
    `;
    
    await page.setContent(testPageContent);
    
    for (const scenario of testScenarios) {
      // Clear previous input
      await page.fill('#json-input', '');
      
      // Input test data
      await page.fill('#json-input', scenario.data);
      await page.click('#process-json');
      
      const result = page.locator('#json-result');
      
      // Verify expected outcome
      if (scenario.expected === 'success') {
        await expect(result).toContainText('Success');
      } else if (scenario.expected === 'parse_error') {
        await expect(result).toContainText('Parse Error');
      } else if (scenario.expected === 'validation_error') {
        await expect(result).toContainText('Validation Error');
      }
      
      console.log(`JSON validation test completed for scenario: ${scenario.name}`);
    }
  });

  test.afterAll(async () => {
    // Clean up test data files
    const testDataDir = path.join(__dirname, 'test-data');
    
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      files.forEach(file => {
        fs.unlinkSync(path.join(testDataDir, file));
      });
      fs.rmdirSync(testDataDir);
    }
    
    console.log('Test data cleanup completed');
  });
});