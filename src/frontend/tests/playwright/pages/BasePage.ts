import { Page } from '@playwright/test';
import { getScreenshotPath, humanClick, humanType, humanPause } from '../utils/testHelpers';

/**
 * Base page class with common functionality for all pages
 * This represents the most fundamental concept of a web page with generic functionality
 * It should NOT contain application-specific properties or methods
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
   * Navigate to a tab in the left panel
   * Only if your left panel navigation exists on ALL pages
   */
  async navigateLeftPanelTab(tabName: string) {
    const tab = this.page.getByRole('tab', { name: ` ${this.capitalize(tabName)}` });
    if (await tab.isVisible({ timeout: 5000 })) {
      await tab.click();
    } else {
      console.log('navigate to leftpanel not success')
    }
  }

  /**
   * Capitalize the first letter of a string
   * Converts "train" to "Train"
   */
  protected capitalize(str: string): string {
    if (!str || str.length === 0) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
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
   * Supports multiple selector formats for flexibility and pattern matching for validation
   * @param submitButtonSelectors Array of selectors to find the submit button
   * @param successPatterns Regex patterns that indicate successful submission
   * @param errorPatterns Regex patterns that indicate submission errors
   * @param urlPatterns Optional URL patterns to monitor for network requests
   * @returns Object with success status and captured payload if available
   */
  async submitForm(
    submitButtonSelectors?: Array<any>,
    successPatterns: RegExp[] = [/success/i, /submitted/i, /complete/i],
    errorPatterns: RegExp[] = [/error/i, /failed/i, /invalid/i],
    urlPatterns: string[] = []
  ): Promise<{ success: boolean, payload?: any }> {
    // Setup network monitoring if URL patterns were provided
    let responsePromise: Promise<any> | null = null;
    if (urlPatterns.length > 0) {
      responsePromise = this.setupNetworkMonitoring(urlPatterns);
    }
    
    // Step 1: Find and click the submit button
    const buttonClicked = await this.findAndClickSubmitButton(submitButtonSelectors);
    if (!buttonClicked) {
      return { success: false };
    }

    // Step 2: Wait for any navigation or form submission to complete
    await this.page.waitForTimeout(1000);

    // Step 3: Check for success or error patterns
    const isSuccess = await this.checkForSuccessOrError(successPatterns, errorPatterns);
    
    // Step 4: Try to capture the payload if we were monitoring the network
    let payload = null;
    if (responsePromise) {
      payload = await this.captureResponsePayload(responsePromise);
    }
    
    return { 
      success: isSuccess, 
      payload 
    };
  }

  /**
   * Setup monitoring for network requests matching certain URL patterns
   * @private Helper method for submitForm
   */
  private setupNetworkMonitoring(urlPatterns: string[]): Promise<any> {
    return this.page.waitForResponse(
      response => {
        const url = response.url();
        for (const pattern of urlPatterns) {
          if (url.includes(pattern)) {
            return true;
          }
        }
        return false;
      },
      { timeout: 15000 }
    );
  }

  /**
   * Capture the payload from a response promise
   * @private Helper method for submitForm
   */
  private async captureResponsePayload(responsePromise: Promise<any>): Promise<any> {
    try {
      const response = await responsePromise;
      const request = response.request();
      try {
        const payload = request.postDataJSON();
        console.log('Successfully captured JSON payload');
        return payload;
      } catch (e) {
        console.log(`Could not parse payload as JSON: ${e.message}`);
        return request.postData();
      }
    } catch (e) {
      console.log(`Could not capture form submission: ${e.message}`);
      return null;
    }
  }

  /**
   * Find and click the submit button using various selector strategies
   * @private Helper method for submitForm
   */
  private async findAndClickSubmitButton(submitButtonSelectors?: Array<any>): Promise<boolean> {
    // Default selectors if none provided
    const defaultSelectors = [
      { type: 'role', selector: 'Submit' },
      { type: 'css', selector: 'button[type="submit"]' },
      { type: 'text', selector: 'Submit' }
    ];

    const selectors = submitButtonSelectors || defaultSelectors;

    // Try each selector strategy
    for (const selectorInfo of selectors) {
      try {
        const locator = this.getLocatorFromSelector(selectorInfo);

        // Try to click the button with this locator
        if (await locator.isVisible({ timeout: 1000 }) &&
          await locator.isEnabled({ timeout: 1000 })) {
          await humanPause(this.page, 'navigation');
          await humanClick(locator);
          return true; // Button clicked successfully
        }
      } catch (e) {
        console.log(`Error with selector ${this.describeSelectorForLogging(selectorInfo)}: ${e.message}`);
      }
    }

    // If we got here, no button was clicked
    console.error('Could not find submit button');
    await this.safeScreenshot('submit-button-not-found');
    return false;
  }

  /**
   * Create a Playwright locator from various selector formats
   * @private Helper method for findAndClickSubmitButton
   */
  private getLocatorFromSelector(selectorInfo: any) {
    if (typeof selectorInfo === 'string') {
      // If it's a simple string, assume it's a CSS selector
      return this.page.locator(selectorInfo);
    } 
    // Check if it's already a Playwright locator object
    else if (selectorInfo._frame || selectorInfo._selector) {
      // It's already a Playwright locator, use it directly
      return selectorInfo;
    }
    else if (selectorInfo.type === 'role') {
      // Role-based selector
      return this.page.getByRole('button', { name: selectorInfo.selector });
    } else if (selectorInfo.type === 'text') {
      // Text-based selector
      return this.page.getByText(selectorInfo.selector);
    } else {
      // Default to CSS selector
      return this.page.locator(selectorInfo.selector);
    }
  }

  /**
   * Generate a description of a selector for logging purposes
   * @private Helper method for logging
   */
  private describeSelectorForLogging(selectorInfo: any): string {
    if (typeof selectorInfo === 'string') {
      return selectorInfo;
    } else if (selectorInfo._selector) {
      return 'direct locator';
    } else {
      return JSON.stringify(selectorInfo);
    }
  }

  /**
   * Check for success or error patterns after form submission
   * @private Helper method for submitForm
   */
  private async checkForSuccessOrError(
    successPatterns: RegExp[],
    errorPatterns: RegExp[]
  ): Promise<boolean> {
    // Try to find success messages
    const successResult = await this.checkForPatterns(successPatterns, 5000, true);
    if (successResult.found) {
      return true;
    }

    // If no success found, check for errors
    const errorResult = await this.checkForPatterns(errorPatterns, 2000, false);
    if (errorResult.found) {
      return false;
    }

    // If no specific message found, default to assuming success
    console.log('No success/error patterns found, assuming success');
    return true;
  }

  /**
   * Check for specific text patterns on the page
   * @private Helper method for checkForSuccessOrError
   */
  private async checkForPatterns(
    patterns: RegExp[],
    timeout: number,
    isSuccess: boolean
  ): Promise<{ found: boolean, message?: string }> {
    for (const pattern of patterns) {
      try {
        const textElement = this.page.getByText(pattern);
        
        if (await textElement.isVisible({ timeout })) {
          const message = await textElement.textContent() || 'Unknown message';
          console.log(`${isSuccess ? '✅ Success' : '❌ Error'} message found:`, message);
          return { found: true, message };
        }
      } catch (e) {
        console.log(`Error checking pattern ${pattern}: ${e.message}`);
      }
    }
    return { found: false };
  }

  /**
   * Switch to the form mode specified
   * Moved here because this is form-specific functionality
   */
  async updateFormMode(mode: string): Promise<void> {
    if (mode === 'advanced') {
      await this.ensureAdvancedOptionsMode();
    } else {
      await this.ensureBasicOptionsMode();
    }
  }

  /**
   * Ensure the form is in Basic Options mode (convenience method)
   */
  private async ensureBasicOptionsMode(): Promise<void> {
    await this.ensureOptionsMode('basic');
  }

  /**
   * Ensure the form is in Advanced Options mode (convenience method)
   */
  private async ensureAdvancedOptionsMode(): Promise<void> {
    await this.ensureOptionsMode('advanced');
  }

  /**
   * Ensure the form is in the specified options mode (Basic or Advanced)
   * @param mode The desired options mode - 'basic' (default) or 'advanced'
   */
  private async ensureOptionsMode(mode: 'basic' | 'advanced' = 'basic'): Promise<void> {
    try {
      const advancedOptionsButton = this.page.getByRole('button', { name: 'Advanced Options' });
      const basicOptionsButton = this.page.getByRole('button', { name: 'Basic Options' });

      // Check which button is visible to determine current mode
      const isAdvancedButtonVisible = await advancedOptionsButton.isVisible({ timeout: 2000 });
      const isBasicButtonVisible = await basicOptionsButton.isVisible({ timeout: 2000 });

      if (mode === 'basic') {
        // Want Basic mode
        if (isBasicButtonVisible && !isAdvancedButtonVisible) {
          // Currently in Advanced mode, need to switch to Basic
          await basicOptionsButton.click();
          await this.page.waitForTimeout(500); // Wait for UI to update
        }
      } else {
        // Want Advanced mode
        if (isAdvancedButtonVisible && !isBasicButtonVisible) {
          // Currently in Basic mode, need to switch to Advanced
          console.log('Currently in Basic mode, switching to Advanced Options');
          await advancedOptionsButton.click();
          await this.page.waitForTimeout(500); // Wait for UI to update
        }
      }
    } catch (error) {
      console.log(`Error handling options toggle: ${error.message}`);
    }
  }
}
