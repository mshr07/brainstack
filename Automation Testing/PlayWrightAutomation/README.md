# Playwright API Testing Script

This is a basic API testing script using Playwright that demonstrates common API testing patterns.

## Features

The script includes tests for:
- **GET requests** - Fetch single resources and collections with query parameters
- **POST requests** - Create new resources
- **PUT requests** - Update entire resources
- **PATCH requests** - Partial updates
- **DELETE requests** - Remove resources
- **Error handling** - Testing 404 responses
- **Authentication** - Example with headers (Bearer token, API key)
- **Performance testing** - Response time validation
- **Schema validation** - Basic response structure validation

## Setup

1. Make sure you have Playwright installed:
   ```bash
   npm install @playwright/test
   ```

2. If you don't have Playwright installed globally, you can install it:
   ```bash
   npx playwright install
   ```

## Usage

### Run all API tests:
```bash
npx playwright test api-test.js
```

### Run a specific test:
```bash
npx playwright test api-test.js -g "should fetch a single post"
```

### Run tests with verbose output:
```bash
npx playwright test api-test.js --reporter=list
```

### Run tests in headed mode (if you want to see browser activity):
```bash
npx playwright test api-test.js --headed
```

## Customization

### Change the API endpoint:
Edit the `BASE_URL` constant at the top of the file:
```javascript
const BASE_URL = 'https://your-api-endpoint.com';
```

### Add authentication:
The script includes an example of how to add authentication headers. You can modify the headers in any test:
```javascript
const response = await request.get(`${BASE_URL}/endpoint`, {
  headers: {
    'Authorization': 'Bearer your-actual-token',
    'X-API-Key': 'your-actual-api-key'
  }
});
```

### Environment variables:
You can use environment variables for sensitive data:
```javascript
const BASE_URL = process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com';
```

## Test Data

The script currently uses JSONPlaceholder (https://jsonplaceholder.typicode.com), a free fake API for testing and prototyping. This allows you to run the tests immediately without setting up your own API.

## Adding More Tests

You can easily add more tests by following the existing patterns:

```javascript
test('your test description', async ({ request }) => {
  const response = await request.get(`${BASE_URL}/your-endpoint`);
  expect(response.status()).toBe(200);
  // Add more assertions as needed
});
```

## Reports

Playwright generates detailed HTML reports after test runs. You can view them by running:
```bash
npx playwright show-report
```

## Tips

1. **Parallel execution**: Tests run in parallel by default for faster execution
2. **Retry logic**: Failed tests are automatically retried (configurable)
3. **Debugging**: Use `console.log()` to debug responses, or run with `--debug` flag
4. **CI/CD**: The script is ready for CI/CD integration with proper exit codes