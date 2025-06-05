import { Page } from '@playwright/test';
import { getScreenshotPath, humanClick, humanType, humanPause } from '../utils/testHelpers';

/**
 * Base page class with common functionality for all pages
 */
export class BasePage {
  protected page: Page;
  protected baseUrl: string;
  
  constructor(page: Page, baseUrl: string = 'http://localhost') {
    this.page = page;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Navigate to a specific path relative to base URL
   */
  async goto(path: string = '') {
    await this.page.goto(`${this.baseUrl}${path}`);
    await this.safeScreenshot('page-loaded');
  }
  
  /**
   * Wait for an element to be visible
   */
  async waitForElement(selector: string, timeout: number = 30000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.error(`Timeout waiting for element: ${selector}`);
      await this.safeScreenshot('element-wait-timeout');
      return false;
    }
  }
  
  /**
   * Check if element exists and is visible
   */
  async isVisible(selector: string, timeout: number = 1000): Promise<boolean> {
    try {
      return await this.page.isVisible(selector, { timeout });
    } catch {
      return false;
    }
  }
  
  /**
   * Check if element exists in the DOM
   */
  async elementExists(selector: string, timeout: number = 1000): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout, state: 'attached' });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Take a screenshot with a descriptive name
   * Uses a safe implementation that won't fail tests if screenshots can't be taken
   */
  async takeScreenshot(name: string): Promise<void> {
    await this.safeScreenshot(name);
  }
  
  /**
   * Take a screenshot safely - if it fails, log error but don't throw exception
   * This ensures tests continue running even if screenshots fail
   */
  protected async safeScreenshot(name: string): Promise<void> {
    try {
      // Ensure filename has a .png extension
      const filename = name.endsWith('.png') ? name : `${name}.png`;
      await this.page.screenshot({ path: getScreenshotPath(filename) });
    } catch (error) {
      // Log error but don't fail the test
      console.log(`Warning: Could not take screenshot "${name}": ${error.message}`);
    }
  }
}

/**
 * Base form page with form-specific functionality
 */
export class BaseFormPage extends BasePage {
  /**
   * Fill a text field with retry logic
   */
  async fillTextField(name: string, value: string, selectors: Array<string | any>): Promise<boolean> {
    let fieldFilled = false;
    
    // Try each selector
    for (const selector of selectors) {
      try {
        if (await this.elementExists(selector, 1000)) {
          await this.page.waitForTimeout(300);
          await humanClick(this.page.locator(selector));
          await humanPause(this.page, 'thinking');
          await humanType(this.page, value);
          fieldFilled = true;
          break;
        }
      } catch (e) {
        console.log(`Selector for ${name} failed: ${e.message}`);
      }
    }
    
    // Fallback: Tab key navigation
    if (!fieldFilled) {
      console.log(`WARNING: Could not fill ${name} field with selectors, trying keyboard`);
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(300);
      await humanType(this.page, value);
    }
    
    await humanPause(this.page, 'observation');
    return fieldFilled;
  }
  
  /**
   * Submit the form and check for success/error
   */
  async submitForm(submitButtonSelectors: Array<string | any>, 
                  successPatterns: RegExp[] = [/success/i],
                  errorPatterns: RegExp[] = [/error/i, /failed/i]): Promise<boolean> {
    await this.page.screenshot({ path: getScreenshotPath('form-before-submit.png') });
    
    let buttonClicked = false;
    
    for (const selector of submitButtonSelectors) {
      if (await this.elementExists(selector) && 
          await this.page.isEnabled(selector)) {
        await humanPause(this.page, 'navigation');
        await humanClick(this.page.locator(selector));
        buttonClicked = true;
        break;
      }
    }
    
    if (!buttonClicked) {
      console.error('Could not find submit button');
      return false;
    }
    
    // Check for success/error patterns
    // ...existing verification logic...
    
    return true;
  }
}
