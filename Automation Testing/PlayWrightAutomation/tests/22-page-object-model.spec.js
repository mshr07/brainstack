const { test, expect } = require('@playwright/test');

// Page Object Model Classes

class LoginPage {
  constructor(page) {
    this.page = page;
    // Locators
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.flashMessage = page.locator('#flash');
    this.pageTitle = page.locator('h2');
  }

  async navigate() {
    await this.page.goto('https://the-internet.herokuapp.com/login');
  }

  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async getFlashMessage() {
    return await this.flashMessage.textContent();
  }

  async isLoginSuccessful() {
    await this.page.waitForURL(/secure/);
    return this.page.url().includes('/secure');
  }

  async isLoginFailed() {
    return this.page.url().includes('/login');
  }

  async getPageTitle() {
    return await this.pageTitle.textContent();
  }
}

class SecurePage {
  constructor(page) {
    this.page = page;
    this.heading = page.locator('h2');
    this.flashMessage = page.locator('.flash.success');
    this.logoutButton = page.locator('a[href="/logout"]');
    this.subheading = page.locator('h4');
  }

  async getHeading() {
    return await this.heading.textContent();
  }

  async getFlashMessage() {
    return await this.flashMessage.textContent();
  }

  async logout() {
    await this.logoutButton.click();
  }

  async isSecurePageLoaded() {
    await expect(this.heading).toHaveText('Secure Area');
    await expect(this.flashMessage).toBeVisible();
  }
}

class DropdownPage {
  constructor(page) {
    this.page = page;
    this.dropdown = page.locator('#dropdown');
    this.pageTitle = page.locator('h3');
  }

  async navigate() {
    await this.page.goto('https://the-internet.herokuapp.com/dropdown');
  }

  async selectOption(value) {
    await this.dropdown.selectOption(value);
  }

  async selectOptionByText(text) {
    await this.dropdown.selectOption({ label: text });
  }

  async getSelectedValue() {
    return await this.dropdown.inputValue();
  }

  async getSelectedText() {
    return await this.dropdown.locator('option:checked').textContent();
  }

  async getAllOptions() {
    return await this.dropdown.locator('option').allTextContents();
  }
}

class FileUploadPage {
  constructor(page) {
    this.page = page;
    this.fileInput = page.locator('#file-upload');
    this.uploadButton = page.locator('#file-submit');
    this.uploadedFiles = page.locator('#uploaded-files');
    this.pageTitle = page.locator('h3');
  }

  async navigate() {
    await this.page.goto('https://the-internet.herokuapp.com/upload');
  }

  async uploadFile(filePath) {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  async uploadMultipleFiles(filePaths) {
    await this.fileInput.setInputFiles(filePaths);
    await this.uploadButton.click();
  }

  async getUploadedFileName() {
    return await this.uploadedFiles.textContent();
  }

  async isUploadSuccessful() {
    return await this.uploadedFiles.isVisible();
  }
}

class DynamicControlsPage {
  constructor(page) {
    this.page = page;
    this.checkbox = page.locator('#checkbox input[type="checkbox"]');
    this.removeButton = page.locator('button[onclick="swapCheckbox()"]');
    this.enableButton = page.locator('button[onclick="swapInput()"]');
    this.textInput = page.locator('input[type="text"]');
    this.message = page.locator('#message');
    this.loading = page.locator('#loading');
  }

  async navigate() {
    await this.page.goto('https://the-internet.herokuapp.com/dynamic_controls');
  }

  async removeCheckbox() {
    await this.removeButton.click();
  }

  async addCheckbox() {
    await this.removeButton.click();
  }

  async enableInput() {
    await this.enableButton.click();
  }

  async disableInput() {
    await this.enableButton.click();
  }

  async waitForLoading() {
    await this.loading.waitFor({ state: 'visible' });
    await this.loading.waitFor({ state: 'hidden' });
  }

  async getMessage() {
    return await this.message.textContent();
  }

  async isCheckboxPresent() {
    return await this.checkbox.isVisible();
  }

  async isInputEnabled() {
    return await this.textInput.isEnabled();
  }
}

class WindowsPage {
  constructor(page) {
    this.page = page;
    this.openWindowLink = page.locator('a[href="/windows/new"]');
    this.pageTitle = page.locator('h3');
  }

  async navigate() {
    await this.page.goto('https://the-internet.herokuapp.com/windows');
  }

  async openNewWindow() {
    const [newPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.openWindowLink.click()
    ]);
    return newPage;
  }

  async getPageTitle() {
    return await this.pageTitle.textContent();
  }
}

class BasePage {
  constructor(page) {
    this.page = page;
  }

  async takeScreenshot(name) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  async getCurrentUrl() {
    return this.page.url();
  }

  async getPageTitle() {
    return await this.page.title();
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async scrollToElement(locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  async hover(locator) {
    await locator.hover();
  }

  async doubleClick(locator) {
    await locator.dblclick();
  }

  async rightClick(locator) {
    await locator.click({ button: 'right' });
  }

  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  async waitForElement(locator, timeout = 30000) {
    await locator.waitFor({ state: 'visible', timeout });
  }
}

// Test Suite using Page Object Model
test.describe('Page Object Model Tests', () => {

  test('Login with valid credentials using POM', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const securePage = new SecurePage(page);

    await loginPage.navigate();
    await loginPage.login('tomsmith', 'SuperSecretPassword!');

    expect(await loginPage.isLoginSuccessful()).toBeTruthy();

    await securePage.isSecurePageLoaded();
    expect(await securePage.getHeading()).toBe('Secure Area');
    expect(await securePage.getFlashMessage()).toContain('You logged into a secure area!');
  });

  test('Login with invalid credentials using POM', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login('invaliduser', 'wrongpassword');

    expect(await loginPage.isLoginFailed()).toBeTruthy();
    expect(await loginPage.getFlashMessage()).toContain('Your username is invalid!');
  });

  test('Complete login-logout flow using POM', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const securePage = new SecurePage(page);

    // Login
    await loginPage.navigate();
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();

    // Verify secure page
    await securePage.isSecurePageLoaded();

    // Logout
    await securePage.logout();
    await page.waitForURL(/login/);
    expect(await loginPage.getPageTitle()).toBe('Login Page');
  });

  test('Dropdown interactions using POM', async ({ page }) => {
    const dropdownPage = new DropdownPage(page);

    await dropdownPage.navigate();

    // Get all options
    const allOptions = await dropdownPage.getAllOptions();
    console.log('Available options:', allOptions);
    expect(allOptions).toContain('Option 1');
    expect(allOptions).toContain('Option 2');

    // Select by value
    await dropdownPage.selectOption('1');
    expect(await dropdownPage.getSelectedValue()).toBe('1');
    expect(await dropdownPage.getSelectedText()).toBe('Option 1');

    // Select by text
    await dropdownPage.selectOptionByText('Option 2');
    expect(await dropdownPage.getSelectedValue()).toBe('2');
    expect(await dropdownPage.getSelectedText()).toBe('Option 2');
  });

  test('Dynamic controls interactions using POM', async ({ page }) => {
    const dynamicControlsPage = new DynamicControlsPage(page);

    await dynamicControlsPage.navigate();

    // Initial state - checkbox should be present
    expect(await dynamicControlsPage.isCheckboxPresent()).toBeTruthy();

    // Remove checkbox
    await dynamicControlsPage.removeCheckbox();
    await dynamicControlsPage.waitForLoading();
    expect(await dynamicControlsPage.getMessage()).toContain('gone');
    expect(await dynamicControlsPage.isCheckboxPresent()).toBeFalsy();

    // Add checkbox back
    await dynamicControlsPage.addCheckbox();
    await dynamicControlsPage.waitForLoading();
    expect(await dynamicControlsPage.getMessage()).toContain('back');
    expect(await dynamicControlsPage.isCheckboxPresent()).toBeTruthy();

    // Enable input field
    await dynamicControlsPage.enableInput();
    await dynamicControlsPage.waitForLoading();
    expect(await dynamicControlsPage.getMessage()).toContain('enabled');
    expect(await dynamicControlsPage.isInputEnabled()).toBeTruthy();
  });

  test('Window handling using POM', async ({ page }) => {
    const windowsPage = new WindowsPage(page);

    await windowsPage.navigate();
    expect(await windowsPage.getPageTitle()).toBe('Opening a new window');

    // Open new window
    const newPage = await windowsPage.openNewWindow();
    await newPage.waitForLoadState();

    // Verify new window content
    const newPageTitle = await newPage.locator('h3').textContent();
    expect(newPageTitle).toBe('New Window');

    // Close new window
    await newPage.close();

    // Verify original window is still active
    expect(await windowsPage.getPageTitle()).toBe('Opening a new window');
  });

  test('File upload using POM', async ({ page }) => {
    const fileUploadPage = new FileUploadPage(page);

    await fileUploadPage.navigate();

    // Create a temporary test file
    const fs = require('fs');
    const path = require('path');
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');

    try {
      await fileUploadPage.uploadFile(testFilePath);
      expect(await fileUploadPage.isUploadSuccessful()).toBeTruthy();
      expect(await fileUploadPage.getUploadedFileName()).toContain('test-file.txt');
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });

  test('BasePage utility methods', async ({ page }) => {
    const basePage = new BasePage(page);
    const loginPage = new LoginPage(page);

    await loginPage.navigate();

    // Test base page utilities
    expect(await basePage.getCurrentUrl()).toContain('/login');
    expect(await basePage.getPageTitle()).toContain('The Internet');

    // Test wait for page load
    await basePage.waitForPageLoad();

    // Test hover functionality
    await basePage.hover(loginPage.loginButton);

    // Test keyboard actions
    await basePage.pressKey('Tab');

    console.log('BasePage utility methods tested successfully');
  });

  test('Data-driven testing with POM', async ({ page }) => {
    const loginPage = new LoginPage(page);

    const testData = [
      { username: 'tomsmith', password: 'SuperSecretPassword!', expected: 'success' },
      { username: 'invaliduser', password: 'wrongpassword', expected: 'failure' },
      { username: '', password: 'password', expected: 'failure' },
      { username: 'user', password: '', expected: 'failure' }
    ];

    for (const data of testData) {
      console.log(`Testing login with username: ${data.username}`);

      await loginPage.navigate();
      await loginPage.login(data.username, data.password);

      if (data.expected === 'success') {
        expect(await loginPage.isLoginSuccessful()).toBeTruthy();
        // Navigate back to login page for next iteration
        await page.goto('https://the-internet.herokuapp.com/logout');
      } else {
        expect(await loginPage.isLoginFailed()).toBeTruthy();
        const flashMessage = await loginPage.getFlashMessage();
        expect(flashMessage).toMatch(/invalid|blank/);
      }
    }
  });

  test('Complex page interactions using multiple POMs', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const securePage = new SecurePage(page);
    const basePage = new BasePage(page);

    // Step 1: Navigate and take screenshot
    await loginPage.navigate();
    await basePage.takeScreenshot('login-page');

    // Step 2: Attempt login with invalid credentials
    await loginPage.login('wronguser', 'wrongpass');
    expect(await loginPage.isLoginFailed()).toBeTruthy();

    // Step 3: Login with valid credentials
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();

    // Step 4: Verify secure page and take screenshot
    await securePage.isSecurePageLoaded();
    await basePage.takeScreenshot('secure-page');

    // Step 5: Interact with secure page elements
    const heading = await securePage.getHeading();
    console.log('Secure page heading:', heading);

    // Step 6: Logout and verify
    await securePage.logout();
    expect(await basePage.getCurrentUrl()).toContain('/login');
    expect(await loginPage.getPageTitle()).toBe('Login Page');
  });

  test('Page Object inheritance and composition', async ({ page }) => {
    // Extended Login Page with additional functionality
    class ExtendedLoginPage extends LoginPage {
      constructor(page) {
        super(page);
        this.forgotPasswordLink = page.locator('a[href="/forgot_password"]');
        this.rememberMeCheckbox = page.locator('#remember-me');
      }

      async clickForgotPassword() {
        if (await this.forgotPasswordLink.isVisible()) {
          await this.forgotPasswordLink.click();
        }
      }

      async toggleRememberMe() {
        if (await this.rememberMeCheckbox.isVisible()) {
          await this.rememberMeCheckbox.click();
        }
      }

      async loginWithRemember(username, password) {
        await this.toggleRememberMe();
        await this.login(username, password);
      }
    }

    const extendedLoginPage = new ExtendedLoginPage(page);

    await extendedLoginPage.navigate();

    // Test inherited functionality
    await extendedLoginPage.login('tomsmith', 'SuperSecretPassword!');
    expect(await extendedLoginPage.isLoginSuccessful()).toBeTruthy();

    // Go back to test extended functionality
    await page.goto('https://the-internet.herokuapp.com/logout');
    await extendedLoginPage.navigate();

    // Test extended functionality (even if elements don't exist, we test the pattern)
    await extendedLoginPage.loginWithRemember('tomsmith', 'SuperSecretPassword!');
    expect(await extendedLoginPage.isLoginSuccessful()).toBeTruthy();
  });
});

// Page Factory Pattern Alternative
class PageFactory {
  static getPage(pageName, page) {
    switch (pageName.toLowerCase()) {
      case 'login':
        return new LoginPage(page);
      case 'secure':
        return new SecurePage(page);
      case 'dropdown':
        return new DropdownPage(page);
      case 'upload':
        return new FileUploadPage(page);
      case 'controls':
        return new DynamicControlsPage(page);
      case 'windows':
        return new WindowsPage(page);
      default:
        throw new Error(`Page ${pageName} not found in factory`);
    }
  }
}

test.describe('Page Factory Pattern Tests', () => {
  test('Using Page Factory for different pages', async ({ page }) => {
    // Create pages using factory
    const loginPage = PageFactory.getPage('login', page);
    const securePage = PageFactory.getPage('secure', page);
    const dropdownPage = PageFactory.getPage('dropdown', page);

    // Test login page
    await loginPage.navigate();
    await loginPage.login('tomsmith', 'SuperSecretPassword!');
    expect(await loginPage.isLoginSuccessful()).toBeTruthy();

    // Test secure page
    await securePage.isSecurePageLoaded();
    await securePage.logout();

    // Test dropdown page
    await dropdownPage.navigate();
    await dropdownPage.selectOption('1');
    expect(await dropdownPage.getSelectedValue()).toBe('1');

    console.log('Page Factory pattern tested successfully');
  });
});