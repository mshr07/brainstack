# Playwright Test Automation Setup Guide

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher  
- **Git**: For version control
- **Visual Studio Code**: Recommended IDE

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
# Install Playwright and dependencies
npm install @playwright/test
npm install allure-playwright allure-commandline
npm install @faker-js/faker dotenv cross-env

# Install Playwright browsers
npx playwright install
npx playwright install-deps
```

### 2. Install Additional Packages for Enhanced Features

```bash
# For JSON data manipulation
npm install fs-extra

# For date/time handling
npm install moment

# For API testing
npm install axios

# Development dependencies
npm install --save-dev rimraf
```

## 🔧 Visual Studio Code Setup

### 1. Install Required Extensions

Open VS Code and install these extensions:

1. **Playwright Test for VSCode** (ms-playwright.playwright)
   - Official Playwright extension
   - Test discovery and execution
   - Debug support

2. **JavaScript and TypeScript Nightly** (ms-vscode.vscode-typescript-next)
   - Enhanced JavaScript/TypeScript support

3. **Allure Reports** (qameta.allure-reports)
   - View Allure reports directly in VS Code

4. **JSON Tools** (eriklynd.json-tools)
   - JSON formatting and validation

5. **GitLens** (eamodio.gitlens)
   - Enhanced Git integration

6. **Auto Rename Tag** (formulahendry.auto-rename-tag)
   - HTML/XML tag renaming

### 2. VS Code Workspace Settings

Create `.vscode/settings.json` in your project root:

```json
{
  "playwright.reuseBrowser": true,
  "playwright.headless": false,
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.spec.js": "javascript"
  },
  "emmet.includeLanguages": {
    "javascript": "html"
  }
}
```

### 3. VS Code Tasks Configuration

Create `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run Playwright Tests",
      "type": "shell",
      "command": "npx playwright test",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Run Tests in Headed Mode",
      "type": "shell",
      "command": "npx playwright test --headed",
      "group": "test"
    },
    {
      "label": "Generate Allure Report",
      "type": "shell",
      "command": "allure generate test-results/allure-results --clean -o test-results/allure-report",
      "group": "test"
    }
  ]
}
```

### 4. Launch Configuration for Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Playwright Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test", "--debug"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Single Test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test", "${relativeFile}", "--debug"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## 📦 Package.json Configuration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test": "npx playwright test",
    "test:headed": "npx playwright test --headed",
    "test:debug": "npx playwright test --debug",
    "test:ui": "npx playwright test --ui",
    "test:chrome": "npx playwright test --project=chromium",
    "test:firefox": "npx playwright test --project=firefox",
    "test:safari": "npx playwright test --project=webkit",
    "test:mobile": "npx playwright test --project='Mobile Chrome'",
    "codegen": "npx playwright codegen",
    "report:allure:generate": "allure generate test-results/allure-results --clean -o test-results/allure-report",
    "report:allure:open": "allure open test-results/allure-report"
  }
}
```

## 🎯 Command Line Execution Examples

### Basic Test Execution

```bash
# Run all tests
npm test

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in debug mode
npm run test:debug
```

### Browser-Specific Testing

```bash
# Run tests only in Chrome
npm run test:chrome

# Run tests only in Firefox  
npm run test:firefox

# Run tests only in Safari
npm run test:safari

# Run tests in mobile Chrome
npm run test:mobile
```

### Advanced Command Line Options

```bash
# Run specific test file
npx playwright test login.spec.js

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests with specific tags
npx playwright test --grep "@smoke"

# Run tests in parallel with 4 workers
npx playwright test --workers=4

# Run tests serially (one at a time)
npx playwright test --workers=1

# Run tests with maximum failures
npx playwright test --max-failures=3

# Run tests with specific timeout
npx playwright test --timeout=60000

# Update visual snapshots
npx playwright test --update-snapshots
```

### Test Filtering

```bash
# Run tests by file pattern
npx playwright test network-*.spec.js

# Run tests by title pattern
npx playwright test --grep "should handle login"

# Exclude tests with pattern
npx playwright test --grep-invert "slow"

# Run tests from specific directory
npx playwright test tests/api/
```

### Reporting and Results

```bash
# Generate HTML report
npx playwright show-report

# Generate Allure report
npm run report:allure:generate

# Open Allure report in browser
npm run report:allure:open

# Serve Allure report
allure serve test-results/allure-results
```

### Code Generation

```bash
# Generate test code for a website
npx playwright codegen https://example.com

# Generate code with specific browser
npx playwright codegen --browser=firefox https://example.com

# Generate code with custom viewport
npx playwright codegen --viewport-size=1280,720 https://example.com

# Generate code with device emulation
npx playwright codegen --device="iPhone 12" https://example.com
```

### Trace Viewer

```bash
# Show trace files
npx playwright show-trace path/to/trace.zip

# Show trace with specific port
npx playwright show-trace --port=9323 trace.zip
```

## 🔍 Allure Reporting Setup

### 1. Install Allure

```bash
# Install Allure command line tool
npm install -g allure-commandline

# Or install locally
npm install allure-commandline --save-dev
```

### 2. Configure Allure in Tests

Add Allure annotations to your tests:

```javascript
import { allure } from 'allure-playwright';

test('Login test with Allure', async ({ page }) => {
  await allure.description('This test validates user login functionality');
  await allure.owner('Test Team');
  await allure.tags('smoke', 'login', 'critical');
  await allure.severity('critical');
  
  // Test steps
  await allure.step('Navigate to login page', async () => {
    await page.goto('/login');
  });
  
  await allure.step('Enter credentials', async () => {
    await page.fill('#username', 'user');
    await page.fill('#password', 'pass');
  });
  
  await allure.step('Click login button', async () => {
    await page.click('#login-btn');
  });
});
```

### 3. Generate and View Reports

```bash
# Generate Allure report
npm run report:allure:generate

# Open report in browser
npm run report:allure:open

# Serve report on local server
allure serve test-results/allure-results
```

## 📁 Project Structure

```
PlayWrightAutomation/
├── tests/
│   ├── test-data/
│   │   ├── users.json
│   │   ├── form-data.json
│   │   └── config.json
│   ├── 01-first-test.spec.js
│   ├── 04-viewport-browser-window.spec.js
│   ├── 08-dropdown-handling.spec.js
│   ├── 18-multiple-tabs-windows.spec.js
│   ├── 20-frames-iframes.spec.js
│   ├── 21-json-data-driven.spec.js
│   └── 22-page-object-model.spec.js
├── test-results/
│   ├── allure-results/
│   ├── allure-report/
│   └── html-report/
├── .vscode/
│   ├── settings.json
│   ├── tasks.json
│   └── launch.json
├── playwright.config.js
├── playwright-enhanced.config.js (recommended)
├── global-setup.js
├── global-teardown.js
├── package.json
└── README.md
```

## 🔧 Environment Variables

Create `.env` file for environment-specific settings:

```bash
# Environment
NODE_ENV=test
TEST_ENV=staging

# Base URLs
BASE_URL=https://the-internet.herokuapp.com
API_URL=https://httpbin.org

# Browser settings
HEADLESS=false
BROWSER=chromium

# Timeouts
DEFAULT_TIMEOUT=30000
NAVIGATION_TIMEOUT=60000

# Reporting
ALLURE_RESULTS_DIR=test-results/allure-results
```

## 🚨 Troubleshooting

### Common Issues and Solutions

1. **Browsers not installed**
   ```bash
   npx playwright install
   ```

2. **Permission errors on macOS/Linux**
   ```bash
   sudo npx playwright install-deps
   ```

3. **Tests timing out**
   - Increase timeout in config
   - Check network connectivity
   - Verify selectors

4. **Allure reports not generating**
   ```bash
   # Check if allure is installed
   allure --version
   
   # Reinstall if needed
   npm install allure-commandline
   ```

5. **VS Code extension not working**
   - Restart VS Code
   - Check extension compatibility
   - Update extensions

## 📝 Best Practices

1. **Test Organization**
   - Use descriptive test names
   - Group related tests in describe blocks
   - Use tags for test categorization

2. **Data Management**
   - Store test data in JSON files
   - Use environment variables for configuration
   - Implement data factories for dynamic data

3. **Page Object Model**
   - Create reusable page classes
   - Encapsulate element selectors
   - Implement common actions

4. **Reporting**
   - Use Allure for comprehensive reporting
   - Add descriptive test steps
   - Include screenshots for failures

5. **CI/CD Integration**
   - Use Docker for consistent environments
   - Implement parallel execution
   - Store test artifacts

This setup guide provides everything you need to get started with Playwright automation testing using VS Code and Allure reporting!