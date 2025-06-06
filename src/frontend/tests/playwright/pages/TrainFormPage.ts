import { Page } from '@playwright/test';
import { getScreenshotPath, humanClick, humanType, humanPause } from '../utils/testHelpers';
import { BaseFormPage, BasePage } from './BasePage';
import { FormField, DropdownField } from '../components/FormField';

/**
 * Page Object Model for the Training Form page
 * Encapsulates all interactions with the training form
 */
export class TrainFormPage extends BaseFormPage {
  // Form components
  private modelNameField: FormField;
  private datasetField: DropdownField;
  private trainMethodField: DropdownField;
  private finetuningTypeField: DropdownField;
  private mode: string;
  private path: string;

  /**
   * Create a new TrainFormPage instance
   * @param page Playwright page object
   * @param baseUrl Base URL for the application (defaults to localhost)
   */
  constructor(page: Page, baseUrl: string = 'http://localhost', mode: string = 'basic') {
    super(page, baseUrl);

    this.mode = mode;
    this.path = "train";

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

      // Navigate to train page using appropriate method
      await this.navigateLeftPanelTab(this.path);
      await this.updateFormMode(this.mode);

      // Verify form is loaded and we're on the right page
      await this.verifyTrainPageLoaded();

    } catch (error) {
      console.error('goto:', error);
      await this.takeScreenshot('navigation-error');
      throw new Error(`Failed to navigate to Train page: ${error.message}`);
    }
  }



  /**
   * Verify the train form is loaded and we're on the right page
   */
  private async verifyTrainPageLoaded(): Promise<void> {
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
  async selectTrainingMethod(method: string): Promise<boolean> {
    return this.trainMethodField.select(method);
  }

  /**
   * Select a finetuning type
   */
  async selectFinetuningType(type: string): Promise<boolean> {
    return this.finetuningTypeField.select(type);
  }

  /**
   * Submit the training form with enhanced validation and payload capture
   */
  async submitTrainingForm(): Promise<{ success: boolean, payload?: any }> {
    try {
      // Check for validation errors before submitting
      const invalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').count();
      if (invalidFields > 0) {
        // Log which fields are invalid to help debugging
        const allInvalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').all();
        for (const field of allInvalidFields) {
          const name = await field.getAttribute('name') || '(missing-name)';
          const id = await field.getAttribute('id') || '(missing-id)';
          const tagName = await field.evaluate(el => el.tagName.toLowerCase());
          console.log(`Invalid field: name="${name}", id="${id}", type=${tagName}`);
        }

      }

      // Define button selectors
      const buttonSelectors = [
        this.page.getByRole('button', { name: 'Start Training' }),
      ];
      
      // Define patterns
      const successPatterns = [/training started/i, /job id/i, /success/i, /submitted/i];
      const errorPatterns = [/error/i, /failed/i, /invalid/i, /check.*form/i];
      
      // Define URL patterns to monitor
      const urlPatterns = ['/v1/train'];

      // Take screenshot before submission
      await this.takeScreenshot('pre-submit-debug');

      // Use the enhanced base submitForm method with all parameters
      const result = await super.submitForm(
        buttonSelectors, 
        successPatterns, 
        errorPatterns,
        urlPatterns
      );

      return result;
    } catch (error) {
      console.error(`Error submitting form: ${error.message}`);
      await this.takeScreenshot('submit-error');
      return { success: false };
    }
  }
}
