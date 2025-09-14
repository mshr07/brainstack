// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Enhanced Playwright Configuration with Allure Reporting
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 3 : 2,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 2 : undefined,
  
  /* Global timeout for each test */
  timeout: 120000,
  
  /* Expect timeout for assertions */
  expect: {
    timeout: 15000,
  },

  /* Reporter configuration - Multiple reporters for comprehensive reporting */
  reporter: [
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright', { 
      detail: true, 
      outputFolder: 'test-results/allure-results',
      suiteTitle: false,
      categories: [
        {
          name: 'Outdated tests',
          messageRegex: '.*chrome.*',
          traceRegex: '.*',
          matchedStatuses: ['broken']
        }
      ],
      environmentInfo: {
        framework: 'Playwright',
        version: '1.40.0',
        environment: process.env.NODE_ENV || 'test'
      }
    }],
    ['line']
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup.js'),
  globalTeardown: require.resolve('./global-teardown.js'),

  /* Shared settings for all projects */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: 'https://the-internet.herokuapp.com',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Record video on failure */
    video: 'retain-on-failure',
    
    /* Global timeout settings */
    actionTimeout: 30000,
    navigationTimeout: 60000,
    
    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,
    
    /* Accept downloads */
    acceptDownloads: true,
    
    /* Locale and timezone */
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  /* Output directory for test artifacts */
  outputDir: 'test-results/artifacts',

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.js/,
      teardown: 'cleanup'
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.js/
    },
    
    /* Desktop Chrome */
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable Chrome DevTools Protocol for advanced features
        launchOptions: {
          args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
        }
      },
      dependencies: ['setup']
    },

    /* Desktop Firefox */
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },

    /* Desktop Safari */
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup']
    },

    /* Mobile Testing */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup']
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['setup']
    },

    /* Branded browsers */
    {
      name: 'Microsoft Edge',
      use: { ...devices['Desktop Edge'], channel: 'msedge' },
      dependencies: ['setup']
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      dependencies: ['setup']
    },

    /* API Testing */
    {
      name: 'api',
      testMatch: '**/api-*.spec.js',
      use: {
        baseURL: 'https://httpbin.org'
      }
    },

    /* Network Testing with specific configurations */
    {
      name: 'network-tests',
      testMatch: '**/network-*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: ['--disable-web-security']
        }
      }
    },

    /* Visual Testing */
    {
      name: 'visual-tests',
      testMatch: '**/visual-*.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Consistent visual testing settings
        viewport: { width: 1280, height: 720 }
      }
    },

    /* Page Object Model Tests */
    {
      name: 'pom-tests',
      testMatch: '**/page-object-model.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Additional context options for POM
        contextOptions: {
          permissions: ['clipboard-read', 'clipboard-write']
        }
      }
    },

    /* Data Driven Tests */
    {
      name: 'data-driven-tests',
      testMatch: '**/json-data-driven.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Longer timeout for data-driven tests
        actionTimeout: 45000
      }
    },

    /* Frames and iFrames Tests */
    {
      name: 'frames-tests',
      testMatch: '**/frames-iframes.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Special settings for iframe handling
        contextOptions: {
          ignoreHTTPSErrors: true
        }
      }
    }
  ],

  /* Metadata for Allure reporting */
  metadata: {
    url: 'https://the-internet.herokuapp.com',
    environment: 'Test',
    browser: 'Multiple',
    platform: 'Cross-platform',
    author: 'Playwright Test Suite',
    tags: ['ui', 'e2e', 'regression', 'smoke']
  },

  /* Web Server - if you need to start a local server */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  // },
});