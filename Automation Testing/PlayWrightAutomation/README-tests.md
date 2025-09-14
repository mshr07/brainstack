# Playwright Test Suite

This comprehensive Playwright test suite covers various aspects of web automation testing including network handling, DOM loading, wait methods, and multi-tab/window management.

## Test Files Overview

### 🌐 `network-delays.spec.js`
Tests for handling network delays and timeout scenarios:
- Custom timeout configurations
- Network throttling simulation
- Graceful timeout handling
- Slow loading element handling
- Concurrent request management
- Connection retry mechanisms
- Progressive loading scenarios

### 🏗️ `dom-loading.spec.js`
Tests for DOM loading and dynamic content:
- Different DOM ready states
- Dynamically loaded content
- Lazy-loaded images
- Infinite scroll scenarios
- AJAX content loading
- Delayed DOM mutations
- CSS animations and transitions
- Form validation and error messages
- Third-party script loading
- Progressive image loading

### ⏱️ `wait-methods.spec.js`
Comprehensive coverage of Playwright wait methods:
- `waitForSelector` - Element appearance/disappearance
- `waitForResponse` - API response waiting
- `waitForRequest` - Request monitoring
- `waitForFunction` - Custom condition waiting
- `waitForEvent` - Page event handling
- `waitForURL` - URL change detection
- `waitForLoadState` - Different load states
- `waitForTimeout` - Simple delays (used sparingly)
- `waitForFileChooser` - File upload dialogs
- `waitForDownload` - File download handling
- Custom retry mechanisms

### 🌍 `network-commands.spec.js`
Network interception, mocking, and monitoring:
- Request/response monitoring
- API response mocking
- Request modification
- Network failure simulation
- Request data validation
- Response modification and caching
- Network throttling
- WebSocket monitoring
- Rate limiting simulation

### 🗂️ `multiple-tabs-windows.spec.js`
Handling multiple browser tabs and windows:
- Popup window management
- Multiple browser contexts
- Tab switching and management
- Window focus/blur events
- Cross-tab data sharing (localStorage)
- Cross-tab communication (postMessage)
- Multiple browser instances
- Dynamic tab creation
- Authentication across tabs
- File downloads across tabs

## Running the Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test Categories
```bash
# Network-related tests
npx playwright test network-delays.spec.js
npx playwright test network-commands.spec.js

# DOM and loading tests
npx playwright test dom-loading.spec.js

# Wait methods tests
npx playwright test wait-methods.spec.js

# Multi-tab/window tests
npx playwright test multiple-tabs-windows.spec.js
```

### Run Tests in Specific Browser
```bash
# Chrome
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# Safari
npx playwright test --project=webkit
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests with UI Mode
```bash
npx playwright test --ui
```

### Debug Specific Test
```bash
npx playwright test network-delays.spec.js --debug
```

## Test Configuration Features

The test suite includes:

### 🛠️ Advanced Configuration
- Multiple browser support (Chrome, Firefox, Safari, Edge)
- Mobile device testing
- Custom project configurations for different test types
- Global setup and teardown scripts

### 📊 Reporting
- HTML reports
- JSON results
- JUnit XML output
- Screenshots on failure
- Video recording on failure
- Trace collection on retry

### 🎯 Specialized Settings
- Network test optimizations
- DOM loading test configurations
- Multi-tab test permissions
- Custom timeout configurations

## Key Testing Patterns Demonstrated

### 1. Network Resilience
- Handling slow networks
- Dealing with timeouts
- Retry mechanisms
- Network failure recovery

### 2. Dynamic Content Handling
- Waiting for AJAX requests
- Progressive content loading
- Animation completion
- Third-party widget loading

### 3. Advanced Wait Strategies
- Custom wait conditions
- Race conditions
- Parallel waiting
- Polling mechanisms

### 4. Network Testing
- Request/response interception
- API mocking
- Network condition simulation
- WebSocket handling

### 5. Multi-Context Testing
- Isolated browser sessions
- Cross-tab communication
- Shared authentication
- Concurrent operations

## Test Execution Tips

### Environment Setup
Ensure you have the following installed:
```bash
npm install @playwright/test
npx playwright install
```

### Running Subsets of Tests
```bash
# Run only tests containing "timeout"
npx playwright test --grep timeout

# Run tests excluding "slow" ones
npx playwright test --grep-invert slow

# Run tests in a specific describe block
npx playwright test --grep "Network Delays"
```

### Parallel Execution
```bash
# Run tests in parallel (default behavior)
npx playwright test

# Run tests serially
npx playwright test --workers=1
```

### Test Results
After running tests, check:
- `test-results/` directory for artifacts
- HTML report: `npx playwright show-report`
- Summary file: `test-results/summary.json`

## Troubleshooting

### Common Issues
1. **Timeouts**: Increase timeout values in playwright.config.js
2. **Network failures**: Check internet connection and test site availability
3. **Browser installation**: Run `npx playwright install`
4. **Permissions**: Ensure proper file/directory permissions

### Debug Mode
Use debug mode to step through tests:
```bash
npx playwright test --debug --headed
```

### Verbose Output
For detailed logging:
```bash
npx playwright test --verbose
```

## Extending the Test Suite

### Adding New Tests
1. Create new `.spec.js` files in the `tests/` directory
2. Follow the naming convention: `feature-name.spec.js`
3. Use the existing test patterns as templates

### Custom Wait Methods
See `wait-methods.spec.js` for examples of implementing custom wait logic and retry mechanisms.

### Network Mocking
Refer to `network-commands.spec.js` for advanced network interception and mocking patterns.

This test suite provides a comprehensive foundation for testing modern web applications with various network conditions, loading scenarios, and browser behaviors.