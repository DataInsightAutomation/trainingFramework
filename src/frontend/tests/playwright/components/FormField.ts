import { Page, Locator } from '@playwright/test';
import { humanClick, humanType, humanPause, getScreenshotPath } from '../utils/testHelpers';
import { logger } from '../utils/logger';

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

  async selectOptionWithSearch(value: string): Promise<boolean> {
    // 1. Click the input to focus/open dropdown
    let locator;
    for (const selector of this.selectors) {
      const candidate = typeof selector === 'string'
        ? this.page.locator(selector)
        : selector;
      if (await candidate.isVisible({ timeout: 2000 }).catch(() => false)) {
        locator = candidate;
        break;
      }
    }
    if (!locator) return false;
    await locator.click();

    // 2. Type the value (to filter options)
    await locator.fill(value);

    // 3. Wait for dropdown options to appear (wait longer for React rendering)
    await this.page.waitForSelector('.searchable-select-dropdown', { state: 'visible', timeout: 3000 }).catch(() => { });
    await this.page.waitForTimeout(700);

    // 4. Log the dropdown HTML for debugging
    const dropdownHtml = await this.page.locator('.searchable-select-dropdown').innerHTML().catch(() => '');

    // 5. Try to find a matching option (normal or creatable) inside the dropdown
    const optionLocators = [
      // Most specific for your custom searchable select
      this.page.locator('.searchable-select-dropdown .list-group-item', { hasText: value }),
    ];

    for (const optionLocator of optionLocators) {
      if (
        await optionLocator.count() > 0 &&
        await optionLocator.first().isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const clickedText = await optionLocator.first().textContent();
        console.log(`Clicking dropdown option: "${clickedText?.trim()}"`);
        await optionLocator.first().click();
        return true;
      }
    }

    return false;
  }

  async fill(value: string): Promise<boolean> {
    // Check if this is a range input first, which needs special handling
    if (await this.isRangeInput()) {
      return this.setRangeValue(value);
    }

    // Regular input handling
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
          // await this.page.screenshot({ path: getScreenshotPath(`before-fill-${this.fieldName}.png`) });

          // First click to focus - use humanClick for more realistic interaction
          await humanClick(locator);
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
          // await this.page.screenshot({ path: getScreenshotPath(`after-fill-${this.fieldName}.png`) });

          return true;
        }
      } catch (e) {
        logger.debug(`Failed to fill ${this.fieldName} with selector: ${e.message}`);
      }
    }

    logger.warn(`Could not fill ${this.fieldName}`);
    return false;
  }

  /**
   * Check if this field is a range input
   */
  private async isRangeInput(): Promise<boolean> {
    for (const selector of this.selectors) {
      try {
        const locator = typeof selector === 'string'
          ? this.page.locator(selector)
          : selector;

        if (await locator.isVisible({ timeout: 1000 })) {
          // Check if this is a range input
          const isRange = await locator.evaluate(el =>
            el.tagName?.toLowerCase() === 'input' && el.type?.toLowerCase() === 'range'
          ).catch(() => false);

          if (isRange) {
            return true;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    return false;
  }

  /**
   * Set the value of a range input
   */
  async setRangeValue(value: string): Promise<boolean> {
    for (const selector of this.selectors) {
      try {
        const locator = typeof selector === 'string'
          ? this.page.locator(selector)
          : selector;

        if (await locator.isVisible({ timeout: 1000 })) {
          logger.debug(`Setting range value for ${this.fieldName} to ${value}`);

          // Simpler approach - use fill() directly instead of evaluate
          await locator.fill(value);

          // Wait a moment for the UI to update
          await this.page.waitForTimeout(300);

          return true;
        }
      } catch (e) {
        logger.debug(`Failed to set range value for ${this.fieldName}: ${e.message}`);
      }
    }

    logger.warn(`Could not set range value for ${this.fieldName}`);
    return false;
  }

  /**
   * Set a checkbox or toggle field to the desired state
   * @param value Boolean value or string 'true'/'false' to set
   */
  async setChecked(value: boolean | string): Promise<boolean> {
    const desiredState = typeof value === 'string'
      ? value.toLowerCase() === 'true'
      : !!value;

    logger.debug(`Setting ${this.fieldName} checkbox/toggle to ${desiredState}`);

    // Try direct ID-based approach first (works for any checkbox with ID pattern)
    if (await this.handleDirectIdCheckbox(desiredState)) {
      return true;
    }

    // Try each selector until one works
    for (const selector of this.selectors) {
      try {
        const locator = typeof selector === 'string'
          ? this.page.locator(selector)
          : selector;

        if (await locator.isVisible({ timeout: 2000 })) {
          logger.debug(`Found visible element for ${this.fieldName}`);

          // Try different checkbox/toggle types in order of specificity

          // 1. Try as a toggle button
          if (await this.handleAsToggleButton(locator, desiredState)) {
            return true;
          }

          // 2. Try as a standard checkbox
          if (await this.handleAsCheckbox(locator, desiredState)) {
            return true;
          }

          // 3. Try as a Bootstrap form-check
          if (await this.handleAsFormCheck(locator, selector, desiredState)) {
            return true;
          }
        }
      } catch (e) {
        logger.debug(`Error in setChecked for ${this.fieldName}: ${e.message}`);
      }
    }

    logger.warn(`Could not set checked state for ${this.fieldName}`);
    return false;
  }

  /**
   * Handle checkbox directly by ID pattern
   */
  private async handleDirectIdCheckbox(desiredState: boolean): Promise<boolean> {
    logger.debug(`Trying direct ID approach for ${this.fieldName}`);
    try {
      // Try direct selector based on common ID patterns
      const directSelector = this.page.locator(`#checkbox-${this.fieldName.toLowerCase()}`);
      const count = await directSelector.count();
      logger.debug(`Found ${count} elements with direct selector #checkbox-${this.fieldName.toLowerCase()}`);

      if (count > 0 && await directSelector.isVisible({ timeout: 1000 })) {
        logger.debug(`Direct checkbox is visible`);
        const isChecked = await directSelector.isChecked().catch(() => false);
        logger.debug(`Current state: ${isChecked}, desired: ${desiredState}`);

        if ((desiredState && !isChecked) || (!desiredState && isChecked)) {
          try {
            // Try check/uncheck first
            if (desiredState) {
              await directSelector.check({ force: true });
            } else {
              await directSelector.uncheck({ force: true });
            }
            logger.debug('Successfully set checkbox directly');
            return true;
          } catch (e) {
            logger.debug(`Check/uncheck failed: ${e.message}, trying click`);
            await humanClick(directSelector);
            logger.debug('Clicked checkbox directly');
            return true;
          }
        } else {
          logger.debug('Checkbox already in desired state');
          return true;
        }
      }

      // Try clicking the label instead
      const labelSelector = this.page.locator(`label.checkbox-label:has-text("${this.fieldName}")`);
      if (await labelSelector.count() > 0 && await labelSelector.isVisible({ timeout: 1000 })) {
        logger.debug(`Found label for ${this.fieldName}, clicking it`);
        await humanClick(labelSelector);
        return true;
      }
    } catch (e) {
      logger.debug(`Error in direct checkbox handling: ${e.message}`);
    }
    return false;
  }

  /**
   * Handle as a toggle button
   */
  private async handleAsToggleButton(locator: Locator, desiredState: boolean): Promise<boolean> {
    try {
      // Check if it's a toggle button by role and attribute
      const isToggleButton = await locator.evaluate(el => {
        // Check for React Bootstrap toggle button
        if (el.tagName?.toLowerCase() === 'button' && el.getAttribute('role') === 'switch') {
          return true;
        }
        // Also check for child toggle buttons
        return !!el.querySelector('button[role="switch"]');
      }).catch(() => false);

      if (!isToggleButton) return false;

      // Get the actual button element (either this element or its child)
      const buttonElement = await locator.evaluate(el => {
        if (el.tagName?.toLowerCase() === 'button' && el.getAttribute('role') === 'switch') {
          return null; // It's the element itself
        }
        // Return any child button with role="switch"
        return !!el.querySelector('button[role="switch"]');
      }).catch(() => false);

      // If it's a child button, target that specifically
      const buttonLocator = buttonElement === true
        ? locator.locator('button[role="switch"]')
        : locator;

      // Check current state from aria-checked or active class
      const isChecked = await buttonLocator.evaluate(el =>
        el.getAttribute('aria-checked') === 'true' ||
        el.classList.contains('active')
      ).catch(() => false);

      logger.debug(`Toggle ${this.fieldName} current state: ${isChecked}, desired: ${desiredState}`);

      // Only click if needed
      if ((desiredState && !isChecked) || (!desiredState && isChecked)) {
        logger.debug(`Clicking toggle button for ${this.fieldName}`);
        await humanClick(buttonLocator);
        await this.page.waitForTimeout(500); // Wait for state to update
      } else {
        logger.debug(`Toggle already in correct state (${desiredState})`);
      }
      return true;
    } catch (e) {
      logger.debug(`Error handling as toggle button: ${e.message}`);
      return false;
    }
  }

  /**
   * Handle as a standard checkbox
   */
  private async handleAsCheckbox(locator: Locator, desiredState: boolean): Promise<boolean> {
    try {
      const isCheckbox = await locator.evaluate(el =>
        el.tagName?.toLowerCase() === 'input' && (el as HTMLInputElement).type?.toLowerCase() === 'checkbox'
      ).catch(() => false);

      if (!isCheckbox) return false;

      const isChecked = await locator.isChecked().catch(() => false);
      if ((desiredState && !isChecked) || (!desiredState && isChecked)) {
        // Try using the proper method first
        try {
          if (desiredState) {
            await locator.check({ force: true });
          } else {
            await locator.uncheck({ force: true });
          }
          await this.page.waitForTimeout(500);
          return true;
        } catch (checkError) {
          logger.debug(`Standard check/uncheck failed for ${this.fieldName}, trying alternatives: ${checkError.message}`);

          // Try clicking the checkbox directly
          try {
            await humanClick(locator);
            await this.page.waitForTimeout(500);
            return true;
          } catch (clickError) {
            logger.debug(`Direct click failed for ${this.fieldName}: ${clickError.message}`);

            // Try finding and clicking associated label
            return await this.tryClickAssociatedLabel(locator);
          }
        }
      } else {
        logger.debug(`Checkbox already in desired state: ${desiredState}`);
        return true;
      }
    } catch (e) {
      logger.debug(`Error handling as standard checkbox: ${e.message}`);
      return false;
    }
  }

  /**
   * Try to click the label associated with a checkbox
   */
  private async tryClickAssociatedLabel(locator: Locator): Promise<boolean> {
    try {
      // Try to find the label associated with this checkbox using 'for' attribute
      const id = await locator.evaluate(el => el.id).catch(() => '');
      if (id) {
        const labelLocator = this.page.locator(`label[for="${id}"]`);
        if (await labelLocator.isVisible({ timeout: 1000 })) {
          logger.debug(`Clicking label for ${this.fieldName}`);
          await humanClick(labelLocator);
          await this.page.waitForTimeout(500);
          return true;
        }
      }
    } catch (labelError) {
      logger.debug(`Label click failed for ${this.fieldName}: ${labelError.message}`);
    }
    return false;
  }

  /**
   * Handle as a Bootstrap form-check
   */
  private async handleAsFormCheck(locator: Locator, originalSelector: any, desiredState: boolean): Promise<boolean> {
    try {
      // Check if we're within a form-check container
      const isFormCheck = await locator.evaluate(el => {
        return el.classList.contains('form-check-input') ||
          !!el.closest('.form-check') ||
          !!el.closest('.checkbox-wrapper') ||
          !!el.closest('.checkbox-field-container');
      }).catch(() => false);

      if (!isFormCheck) return false;

      logger.debug(`Detected React Bootstrap form-check for ${this.fieldName}`);

      // If it's a form-check element but not the input itself, try to find the input
      const isInput = await locator.evaluate(el =>
        el.tagName?.toLowerCase() === 'input'
      ).catch(() => false);

      if (isInput) return false; // Already an input, handled elsewhere

      // Try original selectors first
      if (await this.tryOriginalSelectors(originalSelector, desiredState)) {
        return true;
      }

      // Try to find checkbox within form-check
      if (await this.findCheckboxInFormCheck(locator, desiredState)) {
        return true;
      }

      // Try with label as a fallback
      return await this.tryFormCheckLabel(locator);
    } catch (e) {
      logger.debug(`Form-check handling failed for ${this.fieldName}: ${e.message}`);
      return false;
    }
  }

  /**
   * Try to use the original selectors for finding a checkbox
   */
  private async tryOriginalSelectors(currentSelector: any, desiredState: boolean): Promise<boolean> {
    for (const origSelector of this.selectors) {
      if (origSelector === currentSelector) continue; // Skip the current selector

      try {
        const origLocator = typeof origSelector === 'string'
          ? this.page.locator(origSelector)
          : origSelector;

        logger.debug(`Trying original selector for ${this.fieldName}: ${typeof origSelector === 'string' ? origSelector : 'Locator object'}`);
        const count = await origLocator.count();

        if (count === 0) continue;
        logger.debug(`Found ${count} elements with original selector`);

        const isVisible = await origLocator.isVisible({ timeout: 1000 }).catch(() => false);
        if (!isVisible) continue;
        logger.debug(`Original selector visible: ${isVisible}`);

        // Try to use the checkbox methods
        const isCheckbox = await origLocator.evaluate(el =>
          el.tagName?.toLowerCase() === 'input' && el.type?.toLowerCase() === 'checkbox'
        ).catch(() => false);

        if (isCheckbox) {
          const isChecked = await origLocator.isChecked().catch(() => false);
          logger.debug(`Original selector is checkbox, current state: ${isChecked}, desired: ${desiredState}`);

          if ((desiredState && !isChecked) || (!desiredState && isChecked)) {
            if (desiredState) {
              await origLocator.check({ force: true });
            } else {
              await origLocator.uncheck({ force: true });
            }
            return true;
          } else {
            logger.debug(`Checkbox already in desired state: ${desiredState}`);
            return true;
          }
        } else {
          // Just click it if it's not recognized as a checkbox
          logger.debug(`Element is not a checkbox, clicking directly`);
          await humanClick(origLocator);
          await this.page.waitForTimeout(500);
          return true;
        }
      } catch (e) {
        logger.debug(`Failed with original selector: ${e.message}`);
      }
    }
    return false;
  }

  /**
   * Find and interact with a checkbox within a form-check container
   */
  private async findCheckboxInFormCheck(locator: Locator, desiredState: boolean): Promise<boolean> {
    const checkboxSelectors = [
      'input[type="checkbox"]',
      `.checkbox-input input[type="checkbox"]`,
      `.form-check-input`,
      `#checkbox-${this.fieldName.toLowerCase()}`,
    ];

    for (const checkboxSelector of checkboxSelectors) {
      logger.debug(`Trying to find checkbox using selector: ${checkboxSelector}`);
      const inputLocator = locator.locator(checkboxSelector);

      if (await inputLocator.count() === 0) continue;
      logger.debug(`Found checkbox elements: ${await inputLocator.count()}`);

      if (!await inputLocator.isVisible({ timeout: 1000 })) {
        logger.debug(`Checkbox found but not visible`);
        continue;
      }

      logger.debug(`Checkbox is visible`);
      const isChecked = await inputLocator.isChecked().catch(() => false);
      logger.debug(`Current state: ${isChecked}, desired: ${desiredState}`);

      if ((desiredState && !isChecked) || (!desiredState && isChecked)) {
        try {
          // Try check() method first
          if (desiredState) {
            await inputLocator.check({ force: true });
          } else {
            await inputLocator.uncheck({ force: true });
          }
          await this.page.waitForTimeout(500);
          return true;
        } catch (checkError) {
          logger.debug(`Check/uncheck in form-check failed: ${checkError.message}, trying direct click`);
          try {
            await humanClick(inputLocator);
            await this.page.waitForTimeout(500);
            return true;
          } catch (e) {
            logger.debug(`Failed to click input in form-check: ${e.message}`);
          }
        }
      } else {
        logger.debug(`Form-check input already in desired state: ${desiredState}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Try to click the label in a form-check
   */
  private async tryFormCheckLabel(locator: Locator): Promise<boolean> {
    try {
      // Try checkbox-label which is often more accessible
      const labelLocator = locator.locator('.checkbox-label, label[for]');
      if (await labelLocator.isVisible({ timeout: 1000 })) {
        logger.debug(`Clicking checkbox label for ${this.fieldName}`);
        await humanClick(labelLocator);
        await this.page.waitForTimeout(500);
        return true;
      }
    } catch (labelError) {
      logger.debug(`Failed to click label in form-check: ${labelError.message}`);
    }
    return false;
  }

  /**
   * Get the field name
   */
  getName(): string {
    return this.fieldName;
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
        logger.debug(`Failed to select ${this.fieldName} option: ${value}`);
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
      // Check if this is a native <select> element first and use selectOption directly if so
      for (const selector of this.selectors) {
        try {
          const locator = typeof selector === 'string'
            ? this.page.locator(selector)
            : selector;

          if (await locator.isVisible({ timeout: 2000 })) {
            // Check if this is a native <select> element
            const isSelect = await locator.evaluate(el =>
              el.tagName && el.tagName.toLowerCase() === 'select'
            ).catch(() => false);

            if (isSelect) {
              logger.debug(`Selecting option ${optionValue} using native select`);
              await locator.selectOption(optionValue);
              return true;
            }
          }
        } catch (e) {
          logger.debug(`Failed to check if selector is a <select>: ${e.message}`);
        }
      }

      // Continue with existing code for non-native dropdowns
      // First click to open the dropdown using one of our selectors
      let dropdownOpened = false;

      for (const selector of this.selectors) {
        try {
          const locator = typeof selector === 'string'
            ? this.page.locator(selector)
            : selector;

          if (await locator.isVisible({ timeout: 2000 })) {
            // await this.page.screenshot({ path: getScreenshotPath(`before-dropdown-click-${this.fieldName}.png`) });

            // Click with force true to ensure it registers
            await humanClick(locator);
            await this.page.waitForTimeout(1000); // Wait longer for dropdown to appear

            // Take screenshot after clicking to open dropdown
            // await this.page.screenshot({ path: getScreenshotPath(`after-dropdown-click-${this.fieldName}.png`) });

            dropdownOpened = true;
            break;
          }
        } catch (e) {
          logger.debug(`Failed to open dropdown with selector: ${e.message}`);
        }
      }

      if (!dropdownOpened) {
        logger.warn(`Could not open ${this.fieldName} dropdown`);
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
              await humanClick(locator);
              await this.page.waitForTimeout(500);
              return true;
            }
          } catch (e) {
            logger.debug(`Custom selector failed: ${e.message}`);
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
            // await this.page.screenshot({ path: getScreenshotPath(`before-option-click-${optionValue}.png`) });

            // Click the option with force true
            await humanClick(optionSelector);
            await this.page.waitForTimeout(500);

            // Take screenshot after clicking option
            // await this.page.screenshot({ path: getScreenshotPath(`after-option-click-${optionValue}.png`) });

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
        logger.debug(`Trying keyboard navigation for option: ${optionValue}`);
        try {
          // Press down a few times to navigate options and then Enter to select
          for (let i = 0; i < 3; i++) {
            await this.page.keyboard.press('ArrowDown');
            await this.page.waitForTimeout(200);
          }
          await this.page.keyboard.press('Enter');
          logger.debug(`Used keyboard navigation to select option`);
          return true;
        } catch (e) {
          logger.debug(`Keyboard navigation failed: ${e.message}`);
        }
      }

      // If we get here, we couldn't find the option
      logger.warn(`Could not find option ${optionValue} in dropdown`);
      return false;
    } catch (error) {
      logger.error(`Error in dropdown selection: ${error.message}`);
      return false;
    }
  }
}