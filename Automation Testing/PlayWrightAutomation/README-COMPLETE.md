# Complete Playwright Testing Examples Collection

This repository contains a comprehensive collection of Playwright testing examples covering all major testing scenarios. Each file demonstrates specific Playwright capabilities with practical, runnable examples.

## 📁 File Structure

### Basic Testing Concepts (01-07)
- `01-first-test-with-assertion.js` - Basic test cases with various assertion types
- `02-web-element-interaction.js` - Element interaction methods and strategies
- `03-text-verification.js` - Text content verification techniques
- `04-viewport-browser-window.js` - Browser window and viewport management
- `05-screenshots-videos-trace.js` - Media capture and debugging tools
- `06-codegen-record-play.js` - Test generation and recording examples
- `07-retry-failed-tests.js` - Test retry logic and failure handling

### Interactive Elements (08-14)
- `08-dropdown-handling.js` - Dropdown selection and validation
- `10-mouse-hover.js` - Mouse hover interactions and events
- `11-file-upload.js` - File upload handling with various scenarios
- `12-keyboard-actions.js` - Keyboard input and navigation
- `13-autocomplete.js` - Autocomplete and auto-suggestion handling
- `14-alerts.js` - JavaScript alert, confirm, and prompt handling

### Advanced Topics (15-21)
- `15-frames-iframes.js` - Frame and iframe interactions
- `16-multiple-tabs.js` - Multi-tab and window handling
- `17-network-calls.js` - Network interception and API mocking
- `18-json-data-driven.js` - Data-driven testing with JSON
- `20-page-object-model.js` - Page Object Model implementation

### API Testing
- `api-test.js` - Comprehensive API testing examples

## 🚀 Quick Start

### Prerequisites
```bash
# Install Node.js (version 16 or higher)
# Install Playwright
npm install @playwright/test
npx playwright install
```

### Running Individual Tests

```bash
# Run a specific test file
npx playwright test 01-first-test-with-assertion.js

# Run with UI mode (visual test runner)
npx playwright test 01-first-test-with-assertion.js --ui

# Run in headed mode (see browser)
npx playwright test 01-first-test-with-assertion.js --headed

# Run specific test by name
npx playwright test --grep "Basic page navigation"
```

### Running All Tests

```bash
# Run all tests
npx playwright test

# Run tests in parallel
npx playwright test --workers=4

# Run with detailed output
npx playwright test --reporter=list
```

## 📖 Test Examples Overview

### 1. First Test with Assertions (`01-first-test-with-assertion.js`)
Learn the basics of Playwright testing:
- Page navigation and URL assertions
- Element visibility and text verification
- Form interactions and value validation
- Soft assertions vs hard assertions
- Custom timeout configurations

```javascript
// Example: Basic assertion
await expect(page).toHaveTitle(/Playwright/);
await expect(element).toBeVisible();
```

### 2. Web Element Interaction (`02-web-element-interaction.js`)
Master element interactions:
- Different locator strategies
- Click, fill, and keyboard actions
- Working with multiple elements
- Element state checking
- Advanced interaction patterns

```javascript
// Example: Element interaction
await page.locator('#input').fill('text');
await page.locator('button').click();
```

### 3. Text Verification (`03-text-verification.js`)
Text content validation techniques:
- Exact text matching
- Partial text matching with regex
- Dynamic content verification
- Multiple element text validation
- Special character handling

```javascript
// Example: Text verification
await expect(element).toHaveText('Expected text');
await expect(element).toContainText(/pattern/);
```

### 4. Viewport and Browser Window (`04-viewport-browser-window.js`)
Browser and viewport management:
- Setting custom viewport sizes
- Responsive design testing
- Device emulation
- Full screen testing
- Breakpoint validation

```javascript
// Example: Viewport management
await page.setViewportSize({ width: 1280, height: 720 });
```

### 5. Screenshots, Videos, Trace (`05-screenshots-videos-trace.js`)
Visual testing and debugging:
- Full page and element screenshots
- Video recording configuration
- Trace file generation
- Visual regression testing
- Debug media capture

```javascript
// Example: Screenshot capture
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### 6. Code Generation and Recording (`06-codegen-record-play.js`)
Test generation and automation:
- Using Playwright's codegen tool
- Recording user interactions
- Generated code examples
- Best practices for recorded tests
- Code improvement techniques

### 7. Test Retry Logic (`07-retry-failed-tests.js`)
Handling flaky tests and failures:
- Automatic retry configuration
- Custom retry logic
- Exponential backoff strategies
- Cleanup between attempts
- Conditional retry patterns

```javascript
// Example: Custom retry logic
const retryOperation = async (operation, maxRetries = 3) => {
  // Custom retry implementation
};
```

### 8. Dropdown Handling (`08-dropdown-handling.js`)
Dropdown interaction patterns:
- Standard HTML select elements
- Custom dropdown components
- Multi-select functionality
- Dynamic dropdown loading
- Keyboard navigation in dropdowns

```javascript
// Example: Dropdown selection
await dropdown.selectOption('value');
await dropdown.selectOption({ label: 'Option Text' });
```

### 10. Mouse Hover Actions (`10-mouse-hover.js`)
Mouse interaction techniques:
- Basic hover operations
- Hover menus and dropdowns
- Precise mouse positioning
- Drag and drop simulation
- Complex hover sequences

```javascript
// Example: Hover interaction
await element.hover();
await page.mouse.move(x, y);
```

### 11. File Upload (`11-file-upload.js`)
File upload scenarios:
- Single and multiple file uploads
- Drag and drop file uploads
- File validation and progress
- Buffer-based file creation
- Upload status monitoring

```javascript
// Example: File upload
await fileInput.setInputFiles('path/to/file.txt');
await fileInput.setInputFiles(['file1.txt', 'file2.txt']);
```

### 12. Keyboard Actions (`12-keyboard-actions.js`)
Keyboard interaction examples:
- Basic typing and key presses
- Special key combinations
- Text navigation with arrows
- Copy, paste, and clipboard operations
- Accessibility keyboard testing

```javascript
// Example: Keyboard actions
await page.keyboard.type('Hello World');
await page.keyboard.press('Control+KeyA');
```

### 13. Autocomplete Handling (`13-autocomplete.js`)
Autocomplete component testing:
- Basic autocomplete interactions
- Keyboard navigation in suggestions
- Async data loading scenarios
- Multi-select tag inputs
- Rich content suggestions

```javascript
// Example: Autocomplete interaction
await input.fill('search term');
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
```

### 14. Alert Handling (`14-alerts.js`)
JavaScript dialog management:
- Alert, confirm, and prompt dialogs
- Dialog event handling
- Multiple dialog sequences
- Custom modal dialogs
- Special character handling in dialogs

```javascript
// Example: Alert handling
page.on('dialog', async dialog => {
  await dialog.accept('input text');
});
```

## 🛠️ Configuration

### Basic Playwright Config
Create a `playwright.config.js` file:

```javascript
module.exports = {
  testDir: './',
  timeout: 30000,
  retries: 2,
  use: {
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } }
  ]
};
```

## 🎯 Best Practices

### 1. Locator Strategies
```javascript
// Prefer semantic locators
page.getByRole('button', { name: 'Submit' })
page.getByPlaceholder('Enter email')
page.getByText('Welcome')

// Use data-testid for complex cases
page.locator('[data-testid="submit-form"]')
```

### 2. Waiting Strategies
```javascript
// Wait for specific conditions
await expect(element).toBeVisible();
await page.waitForLoadState('networkidle');
await page.waitForSelector('.loading', { state: 'detached' });
```

### 3. Test Organization
```javascript
test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });
  
  test('should perform specific action', async ({ page }) => {
    // Test implementation
  });
});
```

## 🐛 Debugging

### Debug Mode
```bash
# Run in debug mode
npx playwright test --debug

# Debug specific test
npx playwright test --debug --grep "test name"
```

### Visual Debugging
```bash
# Open test results
npx playwright show-report

# View trace files
npx playwright show-trace trace.zip
```

### Console Logging
```javascript
// Add debug information
console.log('Current URL:', page.url());
console.log('Element text:', await element.textContent());
```

## 📊 Reporting

### Built-in Reporters
```bash
# HTML report (default)
npx playwright test --reporter=html

# Line reporter for CI
npx playwright test --reporter=line

# JSON reporter
npx playwright test --reporter=json
```

### Custom Reporting
```javascript
// In playwright.config.js
reporter: [
  ['html'],
  ['json', { outputFile: 'results.json' }],
  ['junit', { outputFile: 'results.xml' }]
]
```

## 🚀 Advanced Features

### Parallel Execution
```bash
# Run tests in parallel
npx playwright test --workers=4

# Disable parallel execution
npx playwright test --workers=1
```

### Cross-Browser Testing
```javascript
// Test across all browsers
projects: [
  { name: 'chromium' },
  { name: 'firefox' },  
  { name: 'webkit' }
]
```

### Mobile Testing
```javascript
// Mobile device emulation
use: {
  ...devices['iPhone 13'],
  locale: 'en-US',
  geolocation: { longitude: 12.492507, latitude: 41.889938 },
  permissions: ['geolocation']
}
```

## 📝 Tips and Tricks

1. **Use Page Object Model** for maintainable tests
2. **Implement proper waits** instead of fixed timeouts
3. **Use soft assertions** for multiple validations
4. **Leverage auto-waiting** features of Playwright
5. **Set up proper test data** management
6. **Use fixtures** for common setup/teardown
7. **Implement proper error handling**
8. **Use trace viewer** for debugging failures

## 🤝 Contributing

Feel free to add more examples or improve existing ones:

1. Fork the repository
2. Create a feature branch
3. Add your examples with proper documentation
4. Submit a pull request

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices Guide](https://playwright.dev/docs/best-practices)
- [Community Examples](https://github.com/microsoft/playwright)

## Tags

`#playwright` `#testing` `#automation` `#javascript` `#e2e-testing` `#web-testing` `#api-testing`