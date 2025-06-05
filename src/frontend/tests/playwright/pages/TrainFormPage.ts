import { Page } from '@playwright/test';
import { getScreenshotPath, humanClick, humanType, humanPause } from '../utils/testHelpers';
import { BasePage } from './BasePage';
import { FormField, DropdownField } from '../components/FormField';

/**
 * Page Object Model for the Training Form page
 * Encapsulates all interactions with the training form
 */
export class TrainFormPage extends BasePage {
  // Form components
  private modelNameField: FormField;
  private datasetField: DropdownField;
  private trainMethodField: DropdownField;
  private finetuningTypeField: DropdownField;
  
  /**
   * Create a new TrainFormPage instance
   * @param page Playwright page object
   * @param baseUrl Base URL for the application (defaults to localhost)
   */
  constructor(page: Page, baseUrl: string = 'http://localhost') {
    super(page, baseUrl);
    
    // Initialize form field components
    this.modelNameField = new FormField(page, 'model name', [
      page.getByRole('textbox', { name: 'Model Name *' }),
      page.locator('input#modelName'),
      page.locator('input[name="modelName"]')
    ]);
    
    this.datasetField = new DropdownField(page, 'dataset', [
      page.getByText('Dataset', { exact: false }).first(),
      page.locator('select[name="dataset"]'),
      page.locator('.dataset-select'),
    ]);
    
    this.trainMethodField = new DropdownField(page, 'training method', [
      page.getByText('Training Method', { exact: false }).first(),
      page.locator('select[name="trainMethod"]'),
      page.locator('.train-method-select')
    ]);
    
    this.finetuningTypeField = new DropdownField(page, 'finetuning type', [
      page.getByText('Finetuning Type', { exact: false }).first(),
      page.locator('select[name="finetuning_type"]'),
      page.locator('.finetuning-type-select')
    ]);
  }
  
  /**
   * Navigate to the training page
   * @param path Optional path parameter (maintains compatibility with BasePage)
   */
  async goto(path?: string): Promise<void> {
    try {
      // First navigate to the main page
      await super.goto();
      
      // Determine navigation method (maintain previous functionality)
      const useNavPanel = path !== '/train';
      
      if (useNavPanel) {
        await this.page.screenshot({ path: getScreenshotPath('before-navigation.png') });
        
        // Use the role-based selector to click the Train tab
        const trainTab = this.page.getByRole('tab', { name: ' Train' });
        if (await trainTab.isVisible({ timeout: 5000 })) {
          await trainTab.click();
        } else {
          console.log('Train tab not visible, trying fallback navigation');
          await super.goto('/train');
        }
      } else {
        // Direct URL navigation
        console.log('Using direct URL navigation to train page');
        await super.goto('/train');
      }
      
      // Wait for the form to load
      const formLoaded = await this.waitForElement('form', 30000);
      if (!formLoaded) {
        throw new Error('Form did not load within timeout period');
      }
      
      // Verify we're on the right page
      const pageIndicators = [
        'input#modelName', 
        'label[for="modelName"]',
        'button[type="submit"]',
        'form'
      ];
      
      let isTrainPage = false;
      for (const selector of pageIndicators) {
        if (await this.isVisible(selector)) {
          isTrainPage = true;
          break;
        }
      }
      
      if (!isTrainPage) {
        throw new Error('Failed to navigate to the Train page - key elements not found');
      }
      
      await this.takeScreenshot('train-form-loaded');
      
    } catch (error) {
      console.error('Navigation error:', error);
      await this.takeScreenshot('navigation-error');
      throw new Error(`Failed to navigate to Train page: ${error.message}`);
    }
  }
  
  /**
   * Fill the model name field
   */
  async fillModelName(modelName: string): Promise<boolean> {
    return this.modelNameField.fill(modelName);
  }
  
  /**
   * Select a dataset
   */
  async selectDataset(datasetName: string | string[]): Promise<boolean> {
    // Convert to array if string
    const datasets = Array.isArray(datasetName) ? datasetName : [datasetName];
    // For multiple datasets, select each one
    for (const dataset of datasets) {
      const result = await this.datasetField.select(dataset);
      if (!result) {
        console.log(`Failed to select dataset: ${dataset}`);
        return false;
      }
    }
    return true;
  }
  
  /**
   * Select a training method
   */
  async selectTrainingMethod(method: string = 'supervised'): Promise<boolean> {
    return this.trainMethodField.select(method);
  }
  
  /**
   * Select a finetuning type
   */
  async selectFinetuningType(type: string = 'lora'): Promise<boolean> {
    return this.finetuningTypeField.select(type);
  }
  
  /**
   * Submit the form and verify the result with better error handling
   * @returns An object containing success status and the submitted payload if available
   */
  async submitForm(): Promise<{success: boolean, payload?: any}> {
    try {
      // Safely take screenshot before submission
      try {
        await this.page.screenshot({ path: getScreenshotPath('before-submit.png') });
      } catch (e) {
        console.log(`Warning: Could not take screenshot: ${e.message}`);
      }
      
      // Start monitoring network requests to capture the form submission
      let submittedPayload: any = null;
      const responsePromise = this.page.waitForResponse(
        response => {
          // Adjust this URL pattern to match your form submission endpoint
          return response.url().includes('/api/train') || 
                 response.url().includes('/train');
        },
        { timeout: 10000 }
      );
      
      await humanPause(this.page, 'navigation');
      
      // Check for validation errors before submitting
      const invalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').count();
      if (invalidFields > 0) {
        console.log(`Found ${invalidFields} invalid form fields before submission`);
        
        // Log which fields are invalid to help debugging
        const allInvalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').all();
        for (const field of allInvalidFields) {
          const name = await field.getAttribute('name') || '(missing-name)';
          const id = await field.getAttribute('id') || '(missing-id)';
          const tagName = await field.evaluate(el => el.tagName.toLowerCase());
          console.log(`Invalid field: name="${name}", id="${id}", type=${tagName}`);
        }
        
      } else {
        console.log('No validation errors detected, form appears valid');
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
        try {
          if (await selector.isVisible({ timeout: 1000 }) && 
              await selector.isEnabled({ timeout: 1000 })) {
            await humanPause(this.page, 'navigation');
            await selector.click({ force: true });
            buttonClicked = true;
            break;
          }
        } catch (e) {
          console.log(`Button selector failed: ${e.message}`);
        }
      }
      
      if (!buttonClicked) {
        console.log('WARNING: Could not click submit button');
        return {success: false};
      } 
      
      // Wait for the response and capture the payload
      try {
        const response = await responsePromise;
        const request = response.request();
        try {
          // Try to get the POST data
          submittedPayload = request.postDataJSON();
        } catch (e) {
          console.log(`Could not parse payload as JSON: ${e.message}`);
          // Try to get raw data
          submittedPayload = request.postData();
        }
      } catch (e) {
        console.log(`Could not capture form submission: ${e.message}`);
      }
      
      await humanPause(this.page, 'observation');
      
      // Check for success or error message with better logging
      const successPatterns = [/training started/i, /job id/i, /success/i, /submitted/i];
      const errorPatterns = [/error/i, /failed/i, /invalid/i, /check.*form/i];
      
      let resultFound = false;
      
      for (const pattern of successPatterns) {
        try {
          const successText = this.page.getByText(pattern);
          if (await successText.isVisible({ timeout: 5000 })) {
            const message = await successText.textContent() || 'Unknown success message';
            resultFound = true;
            return {success: true, payload: submittedPayload};
          }
        } catch (e) {
          console.log(`Error checking success pattern: ${e.message}`);
        }
      }
      
      if (!resultFound) {
        for (const pattern of errorPatterns) {
          try {
            const errorText = this.page.getByText(pattern);
            if (await errorText.isVisible({ timeout: 2000 })) {
              const message = await errorText.textContent() || 'Unknown error message';
              console.log('❌ Error message found:', message);
              resultFound = true;
              return {success: false};
            }
          } catch (e) {
            console.log(`Error checking error pattern: ${e.message}`);
          }
        }
      }
      
      // If no specific message found, try to determine if we're on a success page
      try {
        const currentUrl = this.page.url();
        console.log('Current URL:', currentUrl);
        if (currentUrl.includes('success') || currentUrl.includes('training-status')) {
          console.log('Redirected to success/status page:', currentUrl);
          return {success: true, payload: submittedPayload};
        }
      } catch (e) {
        console.log(`Error checking URL: ${e.message}`);
      }
      
      console.log('No success or error message found, defaulting to success=false');
      return {success: false, payload: submittedPayload};
      
    } catch (error) {
      console.error(`Error submitting form: ${error.message}`);
      return {success: false};
    }
  }
}
