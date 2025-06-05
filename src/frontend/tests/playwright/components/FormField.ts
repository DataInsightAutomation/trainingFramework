import { Page, Locator } from '@playwright/test';
import { humanClick, humanType, humanPause, getScreenshotPath } from '../utils/testHelpers';

/**
 * Reusable form field component
 */
export class FormField {
  protected page: Page;
  protected fieldName: string;
  protected selectors: Array<any>; // Can be string or Locator
  
  constructor(page: Page, fieldName: string, selectors: Array<any>) {
    this.page = page;
    this.fieldName = fieldName;
    this.selectors = selectors;
  }
  
  async fill(value: string): Promise<boolean> {
    // Try each selector until one works
    for (const selector of this.selectors) {
      try {
        // If it's a direct locator, use it; otherwise create a locator from string
        const locator = typeof selector === 'string' 
          ? this.page.locator(selector) 
          : selector;
        
        // Check if visible with a timeout
        if (await locator.isVisible({ timeout: 2000 })) {
          // Take screenshot before interaction
          await this.page.screenshot({ path: getScreenshotPath(`before-fill-${this.fieldName}.png`) });
          
          // First click to focus
          await locator.click({ timeout: 3000, force: true });
          await this.page.waitForTimeout(500);
          
          // Clear existing content if any
          await locator.fill('');
          await this.page.waitForTimeout(300);
          
          // Type the new value with human-like timing
          await humanType(this.page, value);
          await this.page.waitForTimeout(300);
          
          // Press Enter to confirm (helps with some form fields)
          await this.page.keyboard.press('Enter');
          
          // Take screenshot after filling
          await this.page.screenshot({ path: getScreenshotPath(`after-fill-${this.fieldName}.png`) });
          
          return true;
        }
      } catch (e) {
        console.log(`Failed to fill ${this.fieldName} with selector: ${e.message}`);
      }
    }
    
    console.log(`WARNING: Could not fill ${this.fieldName}`);
    return false;
  }
  
  async isVisible(timeout: number = 1000): Promise<boolean> {
    for (const selector of this.selectors) {
      try {
        const locator = typeof selector === 'string' 
          ? this.page.locator(selector) 
          : selector;
        
        if (await locator.isVisible({ timeout })) {
          return true;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    return false;
  }
}

/**
 * Dropdown field component with improved selection capabilities
 */
export class DropdownField extends FormField {
  protected dropdownConfig: any;

  constructor(page: Page, fieldName: string, selectors: Array<any>, dropdownConfig: any = {}) {
    super(page, fieldName, selectors);
    this.dropdownConfig = dropdownConfig;
  }
  
  /**
   * Select one or more options from the dropdown
   * @param optionValue Single value or array of values to select
   * @returns Promise resolving to true if successful, false otherwise
   */
  async select(optionValue: string | string[]): Promise<boolean> {
    // Handle both single values and arrays
    const values = Array.isArray(optionValue) ? optionValue : [optionValue];
    let success = true;
    for (const value of values) {
      const result = await this.selectSingleOption(value);
      if (!result) {
        console.log(`Failed to select ${this.fieldName} option: ${value}`);
        success = false;
      }
    }
    
    return success;
  }
  
  /**
   * Select a single option from the dropdown
   * @param optionValue The value to select
   * @returns Promise resolving to true if successful, false otherwise
   */
  private async selectSingleOption(optionValue: string): Promise<boolean> {
    try {
      // First click to open the dropdown using one of our selectors
      let dropdownOpened = false;
      
      for (const selector of this.selectors) {
        try {
          const locator = typeof selector === 'string' 
            ? this.page.locator(selector) 
            : selector;
          
          if (await locator.isVisible({ timeout: 2000 })) {
            await this.page.screenshot({ path: getScreenshotPath(`before-dropdown-click-${this.fieldName}.png`) });
            
            // Click with force true to ensure it registers
            await locator.click({ force: true, timeout: 3000 });
            await this.page.waitForTimeout(1000); // Wait longer for dropdown to appear
            
            // Take screenshot after clicking to open dropdown
            await this.page.screenshot({ path: getScreenshotPath(`after-dropdown-click-${this.fieldName}.png`) });
            
            dropdownOpened = true;
            break;
          }
        } catch (e) {
          console.log(`Failed to open dropdown with selector: ${e.message}`);
        }
      }
      
      if (!dropdownOpened) {
        console.log(`Could not open ${this.fieldName} dropdown`);
        return false;
      }
      
      // Use additional custom selectors from config if provided
      const customSelectors = this.dropdownConfig.optionSelectors || [];
      
      // Try custom selectors first if available
      if (customSelectors.length > 0) {
        for (const selector of customSelectors) {
          try {
            const locator = typeof selector === 'function' 
              ? selector(optionValue, this.page) // Allow dynamic selectors that take the option value
              : selector;
              
            if (await locator.isVisible({ timeout: 2000 })) {
              await locator.click({ force: true });
              await this.page.waitForTimeout(500);
              return true;
            }
          } catch (e) {
            console.log(`Custom selector failed: ${e.message}`);
          }
        }
      }
      
      // Standard selectors for dropdown options that work across different UI libraries
      const optionSelectors = [
        // Role-based with exact match - most specific and reliable
        this.page.getByRole('option', { name: optionValue, exact: true }),
        
        // Role-based with case-insensitive match
        this.page.getByRole('option', { name: new RegExp(`^${optionValue}$`, 'i') }),
        
        // Direct selection by role+name
        this.page.getByRole('button', { name: new RegExp(optionValue, 'i') }).first(),
        
        // Text-based selectors with first() to avoid strict mode issues
        this.page.getByText(optionValue, { exact: true }).first(),
        this.page.getByText(optionValue, { exact: false }).first(),
        
        // Class-based selectors with text filtering
        this.page.locator('.dropdown-item').filter({ hasText: optionValue }).first(),
        this.page.locator('li').filter({ hasText: optionValue }).first(),
        
        // Very specific selectors for different dropdown implementations
        this.page.locator(`option[value="${optionValue}"]`).first(),
        this.page.locator(`.select__option:has-text("${optionValue}")`).first(),
        
        // Last resort - try a direct XPath with contains - also with first()
        this.page.locator(`//*[contains(text(), "${optionValue}")]`).first()
      ];
      
      // Try to find and click the option
      for (const optionSelector of optionSelectors) {
        try {
          const isVisible = await optionSelector.isVisible({ timeout: 2000 })
            .catch(e => {
              // Log but don't throw for strict mode violations
              if (e.message.includes('strict mode violation')) {
                console.log(`Strict mode violation: ${e.message}`);
                return false;
              }
              throw e;
            });
            
          if (isVisible) {
            await this.page.screenshot({ path: getScreenshotPath(`before-option-click-${optionValue}.png`) });
            
            // Click the option with force true
            await optionSelector.click({ force: true, timeout: 3000 });
            await this.page.waitForTimeout(500);
            
            // Take screenshot after clicking option
            await this.page.screenshot({ path: getScreenshotPath(`after-option-click-${optionValue}.png`) });
            
            return true;
          }
        } catch (e) {
          if (!e.message.includes('strict mode violation')) {
            console.log(`Failed to click option ${optionValue}: ${e.message}`);
          }
        }
      }
      
      // Keyboard navigation as a last resort
      if (this.dropdownConfig.useKeyboardNavigation !== false) {
        console.log(`Trying keyboard navigation for option: ${optionValue}`);
        try {
          // Press down a few times to navigate options and then Enter to select
          for (let i = 0; i < 3; i++) {
            await this.page.keyboard.press('ArrowDown');
            await this.page.waitForTimeout(200);
          }
          await this.page.keyboard.press('Enter');
          console.log(`Used keyboard navigation to select option`);
          return true;
        } catch (e) {
          console.log(`Keyboard navigation failed: ${e.message}`);
        }
      }
      
      // If we get here, we couldn't find the option
      console.log(`Could not find option ${optionValue} in dropdown`);
      return false;
    } catch (error) {
      console.error(`Error in dropdown selection: ${error.message}`);
      return false;
    }
  }
}