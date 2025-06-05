import { Page } from '@playwright/test';
import { getScreenshotPath, humanClick, humanType, humanPause } from '../utils/testHelpers';

/**
 * Page Object Model for the Training Form page
 * Encapsulates all interactions with the training form
 */
export class TrainFormPage {
  private page: Page;
  private baseUrl: string;
  
  /**
   * Create a new TrainFormPage instance
   * @param page Playwright page object
   * @param baseUrl Base URL for the application (defaults to localhost:1234)
   */
  constructor(page: Page, baseUrl: string = 'http://localhost') {
    this.page = page;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Navigate to the training page
   * @param useNavPanel Whether to use the nav panel instead of direct URL (more reliable for non-root pages)
   */
  async goto(useNavPanel: boolean = true) {
    try {
      // First navigate to the main page if not already there
      await this.page.goto(this.baseUrl);
      console.log('Navigated to base URL');
      
      if (useNavPanel) {
        console.log('Navigating to Train page via navigation panel');
        
        // Take a screenshot of initial state
        await this.page.screenshot({ path: getScreenshotPath('before-navigation.png') });
        
        // Updated selectors that correctly target the Train tab
        const navSelectors = [
          // Target the specific Train tab in the left panel using its ID
          this.page.locator('#left-tabs-tab-train'),
          // Target by role and name combination - FIXED to target train not export
          this.page.getByRole('tab', { name: /train/i }),
          // Target by class and text content - FIXED to target train not export
          this.page.locator('.nav-link').filter({ hasText: /train/i }),
          // Target by nav-item parent and specific icon (for Train tab)
          this.page.locator('.nav-item a').filter({ has: this.page.locator('.bi-graph-up') }),
          // Fallback to any clickable element with Train text - FIXED to target train not export
          this.page.locator('.left-panel-container a').filter({ hasText: /train/i })
        ];
        
        let navClicked = false;
        for (const selector of navSelectors) {
          try {
            if (await selector.isVisible({ timeout: 3000 })) {
              // Take a screenshot before clicking to help with debugging
              await this.page.screenshot({ path: getScreenshotPath('before-nav-click.png') });
              
              // Click the navigation element
              await selector.click({ force: true, timeout: 5000 });
              console.log('Clicked Train tab in navigation panel');
              
              // Wait briefly to ensure navigation completes
              await this.page.waitForTimeout(2000);
              
              // Take a screenshot after navigation
              await this.page.screenshot({ path: getScreenshotPath('after-nav-click.png') });
              
              // Verify we're on the Train tab by checking for specific Train page elements
              const trainFormVisible = await this.page.locator('form').isVisible({ timeout: 5000 });
              const trainHeadingVisible = await this.page.getByText(/train new model/i).isVisible({ timeout: 5000 });
              
              if (trainFormVisible && trainHeadingVisible) {
                console.log('Successfully navigated to Train tab - form and heading confirmed');
                navClicked = true;
                break;
              } else {
                console.log('Click seemed to succeed but Train form not found - will try another selector');
              }
            }
          } catch (e) {
            console.log(`Nav selector failed: ${e.message}`);
          }
        }
        
        if (!navClicked) {
          console.log('WARNING: Could not navigate via left panel, falling back to direct URL');
          await this.page.goto(`${this.baseUrl}/train`);
        }
      } else {
        // Direct URL navigation as fallback
        console.log('Using direct URL navigation to train page');
        await this.page.goto(`${this.baseUrl}/train`);
      }
      
      // Wait for the form to load regardless of navigation method
      await this.page.waitForSelector('form', { timeout: 30000 });
      
      // Double-check we're on the Train page by looking for key elements
      const trainElements = [
        this.page.getByText(/model name/i),
        this.page.getByText(/dataset/i),
        this.page.getByText(/training method/i),
        this.page.getByText(/start training/i)
      ];
      
      let isTrainPage = false;
      for (const element of trainElements) {
        if (await element.isVisible({ timeout: 2000 })) {
          isTrainPage = true;
          break;
        }
      }
      
      if (!isTrainPage) {
        throw new Error('Failed to navigate to the Train page - key form elements not found');
      }
      
      console.log('Form loaded successfully - confirmed Train page');
      await this.page.screenshot({ path: getScreenshotPath('train-form-loaded.png') });
      
    } catch (error) {
      console.error('Navigation error:', error);
      await this.page.screenshot({ path: getScreenshotPath('navigation-error.png') });
      throw new Error(`Failed to navigate to Train page: ${error.message}`);
    }
  }
  
  /**
   * Fill the model name field
   */
  async fillModelName(modelName: string) {
    console.log('Selecting model name field');
    
    const modelNameSelectors = [
      this.page.locator('input#modelName'),
      this.page.locator('label[for="modelName"]'),
      this.page.getByText('Model Name', { exact: false }).first(),
      this.page.locator('.form-group', { hasText: 'Model Name' }).locator('input')
    ];
    
    let modelNameFieldClicked = false;
    for (const selector of modelNameSelectors) {
      try {
        if (await selector.isVisible({ timeout: 1000 })) {
          await this.page.waitForTimeout(500);
          await selector.click({ force: true });
          console.log('Clicked model name field');
          modelNameFieldClicked = true;
          break;
        }
      } catch (e) {
        console.log(`Selector failed: ${e.message}`);
      }
    }
    
    if (!modelNameFieldClicked) {
      console.log('WARNING: Could not click model name field, trying direct keyboard focus');
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(500);
    }
    
    await humanPause(this.page, 'thinking');
    console.log(`Typing model name: ${modelName}`);
    await humanType(this.page, modelName);
    await humanPause(this.page, 'thinking');
    await this.page.keyboard.press('Enter');
    await humanPause(this.page, 'observation');
    console.log('Filled model name');
  }
  
  /**
   * Select datasets from the dropdown (supporting both single value and arrays)
   * @param datasetNames Single dataset name or array of dataset names to select
   */
  async selectDataset(datasetNames: string | string[] = 'easydata2022/public_alpaca_mini_slice') {
    try {
      // Normalize input to array format
      const datasets = Array.isArray(datasetNames) ? datasetNames : [datasetNames];
      console.log(`Selecting datasets: ${datasets.join(', ')}`);
      
      // First click to OPEN the dropdown
      const datasetField = this.page.getByText('Dataset', { exact: false }).first();
      await datasetField.click({ force: true, timeout: 5000 });
      console.log('Clicked dataset field to open dropdown');
      
      // Take screenshot for debugging
      await this.page.screenshot({ path: getScreenshotPath('after-dataset-field-click.png') });
      await this.page.waitForTimeout(1000);
      
      // Get all dropdown items and their text
      const dropdownItems = await this.page.locator('.dropdown-item, [role="option"], li').all();
      console.log(`Found ${dropdownItems.length} potential dropdown items`);
      
      // Log all available options for debugging
      const dropdownTexts: string[] = [];
      for (let i = 0; i < dropdownItems.length; i++) {
        const text = await dropdownItems[i].textContent() || '';
        dropdownTexts.push(text.trim());
        console.log(`Option ${i+1}: "${text.trim()}"`);
      }
      
      // Track if we managed to select at least one dataset
      let selectedCount = 0;
      
      // Try to select each requested dataset - simpler approach focused on exact matches
      for (const datasetName of datasets) {
        console.log(`Looking for dataset: "${datasetName}"`);
        let matched = false;
        
        // First try exact matches, then fallback to partial matches
        for (let i = 0; i < dropdownItems.length; i++) {
          const text = dropdownTexts[i];
          const item = dropdownItems[i];
          
          // First priority: exact match
          // Second priority: dropdown text contains the dataset name
          if (text === datasetName || text.toLowerCase().includes(datasetName.toLowerCase())) {
            console.log(`Found matching dataset option: "${text}"`);
            
            // Click the matching option
            await item.click({ force: true, timeout: 5000 });
            console.log(`Selected dataset: "${text}"`);
            selectedCount++;
            matched = true;
            
            // Wait a moment before trying to select another option
            await this.page.waitForTimeout(500);
            
            // For multiselect, check if we need to reopen dropdown for next item
            if (!await dropdownItems[0].isVisible() && datasets.length > 1 && 
                datasets.indexOf(datasetName) < datasets.length - 1) {
              await datasetField.click({ force: true });
              await this.page.waitForTimeout(500);
            }
            
            break;
          }
        }
        
        if (!matched) {
          console.log(`Could not find a match for dataset: "${datasetName}"`);
        }
      }
      
      // If we didn't select any datasets, try to select the first available option as fallback
      if (selectedCount === 0 && dropdownItems.length > 0) {
        console.log('No matching datasets found, selecting first available option');
        await dropdownItems[0].click({ force: true, timeout: 5000 });
        console.log(`Selected fallback dataset: "${dropdownTexts[0]}"`);
        selectedCount++;
      }
      
      // Take a screenshot after selection
      await this.page.screenshot({ path: getScreenshotPath('after-dataset-selection.png') });
      
      return selectedCount > 0;
    } catch (error) {
      console.error('Critical error in dataset selection:', error);
      await this.page.screenshot({ path: getScreenshotPath('dataset-critical-error.png') });
      return false;
    }
  }
  
  /**
   * Select a training method
   */
  async selectTrainingMethod() {
    try {
      console.log('Selecting training method field');
      const trainingMethodField = this.page.getByText('Training Method', { exact: false }).first();
      await humanClick(trainingMethodField);
      console.log('Clicked training method field');
      
      await humanPause(this.page, 'observation');
      
      const methodOptions = [
        this.page.getByRole('button', { name: 'Supervised Fine-Tuning (SFT)' }),
        this.page.getByRole('button', { name: /supervised/i }),
        this.page.locator('button.list-group-item').filter({ hasText: /supervised/i }),
        this.page.locator('.list-group-item-action').filter({ hasText: /supervised/i })
      ];
      
      let methodSelected = false;
      
      for (const optionLocator of methodOptions) {
        if (await optionLocator.isVisible()) {
          await humanPause(this.page, 'thinking');
          await humanClick(optionLocator);
          console.log(`Selected training method using specific selector`);
          methodSelected = true;
          await humanPause(this.page, 'observation');
          break;
        }
      }
      
      if (!methodSelected) {
        console.log('WARNING: Could not select training method');
      }
    } catch (error) {
      console.error('Error selecting training method:', error);
      await this.page.screenshot({ path: getScreenshotPath('training-method-error.png') });
    }
  }
  
  /**
   * Submit the form and verify the result with better error handling
   */
  async submitForm() {
    await this.page.screenshot({ path: getScreenshotPath('train-form-filled.png') });
    await humanPause(this.page, 'navigation');
    
    try {
      console.log('Looking for submit button');
      
      // Take a screenshot of form before submission
      await this.page.screenshot({ path: getScreenshotPath('before-submit.png') });
      
      // Improved validation error detection - only count visible errors
      const errorSelectors = [
        '.invalid-feedback:visible', 
        '.text-danger:visible', 
        '.error-message:visible',
        '.alert-danger',
        'div[role="alert"]'
      ];
      
      let hasValidationErrors = false;
      const errorDetails: string[] = [];
      
      // Check each error selector individually
      for (const selector of errorSelectors) {
        try {
          const elements = await this.page.locator(selector).filter({ hasText: /./ }).all();
          for (const element of elements) {
            if (await element.isVisible()) {
              const text = await element.textContent();
              if (text && text.trim() && text.trim() !== '*') { // Skip if just an asterisk
                errorDetails.push(text.trim());
                hasValidationErrors = true;
              }
            }
          }
        } catch (e) {
          // Ignore errors from selector evaluation
        }
      }
      
      // Also check for invalid fields which might indicate validation errors
      const invalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').all();
      if (invalidFields.length > 0) {
        console.log(`Found ${invalidFields.length} invalid form fields`);
        hasValidationErrors = true;
      }
      
      if (hasValidationErrors) {
        console.log('Form has validation issues:', errorDetails.length > 0 ? errorDetails : 'No error messages, but invalid fields detected');
        await this.page.screenshot({ path: getScreenshotPath('validation-errors.png') });
      } else {
        console.log('No validation errors detected');
      }
      
      // Try multiple ways to find the submit button
      const buttonSelectors = [
        this.page.getByRole('button', { name: /start training/i }),
        this.page.getByText('Start Training', { exact: false }),
        this.page.locator('button:has-text("Start")'),
        this.page.locator('button[type="submit"]')
      ];
      
      let buttonClicked = false;
      
      for (const selector of buttonSelectors) {
        if (await selector.isVisible() && await selector.isEnabled()) {
          await humanPause(this.page, 'navigation');
          console.log('Clicking submit button');
          await selector.click({ force: true });
          console.log('Clicked submit button');
          buttonClicked = true;
          break;
        }
      }
      
      if (!buttonClicked) {
        console.log('WARNING: Could not click submit button');
        await this.page.screenshot({ path: getScreenshotPath('submit-button-not-found.png') });
        return false;
      } 
      
      await humanPause(this.page, 'observation');
      await this.page.screenshot({ path: getScreenshotPath('train-form-submitted.png') });
      
      // Check for both success and error messages
      const result = await this.verifySubmissionResult();
      
      // If not successful, log additional form details to help debug
      if (!result) {
        console.log('Form submission failed. Checking form state...');
        
        // Check all required fields
        const requiredFields = ['modelName', 'dataset', 'trainMethod', 'finetuning_type'];
        for (const field of requiredFields) {
          const fieldElement = this.page.locator(`[name="${field}"]`);
          if (await fieldElement.count() > 0) {
            const value = await fieldElement.inputValue().catch(() => 'N/A');
            console.log(`Field ${field} value: "${value}"`);
          } else {
            console.log(`Field ${field} not found in DOM`);
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error submitting form:', error);
      await this.page.screenshot({ path: getScreenshotPath('form-submission-error.png') });
      return false;
    }
  }
  
  /**
   * Verify the submission result by looking for success or error messages
   */
  private async verifySubmissionResult(): Promise<boolean> {
    const successTexts = [/training started/i, /job id/i, /success/i, /submitted/i];
    const errorTexts = [/error/i, /failed/i, /invalid/i];
    
    let resultFound = false;
    let isSuccess = false;
    
    for (const pattern of successTexts) {
      const element = this.page.getByText(pattern);
      if (await element.isVisible()) {
        console.log('Success message found:', await element.textContent());
        resultFound = true;
        isSuccess = true;
        break;
      }
    }
    
    if (!resultFound) {
      for (const pattern of errorTexts) {
        const element = this.page.getByText(pattern);
        if (await element.isVisible()) {
          console.log('Error message found:', await element.textContent());
          resultFound = true;
          break;
        }
      }
    }
    
    if (!resultFound) {
      console.log('No success or error message found');
    }
    
    return isSuccess;
  }
}
