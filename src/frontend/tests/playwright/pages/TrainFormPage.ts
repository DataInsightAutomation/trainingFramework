import { Page } from '@playwright/test';
import { getScreenshotPath, humanClick, humanType, humanPause } from '../utils/testHelpers';
import { BaseFormPage, BasePage } from './BasePage';
import { FormField, DropdownField } from '../components/FormField';
import { logger } from '../utils/logger';  // Add logger import

/**
 * Page Object Model for the Training Form page
 * Encapsulates all interactions with the training form
 */
export class TrainFormPage extends BaseFormPage {
  // Basic form components
  private modelNameField: FormField;
  private datasetField: DropdownField;
  private trainMethodField: DropdownField;
  private finetuningTypeField: DropdownField;
  private mode: string;
  private path: string;

  // Advanced form components
  private bf16Field: FormField;
  private cutoffLenField: FormField;
  private gradientAccumulationStepsField: FormField;
  private learningRateField: FormField;
  private loggingStepsField: FormField;
  private loraRankField: FormField;
  private loraTargetField: FormField;
  private lrSchedulerTypeField: DropdownField;
  private numTrainEpochsField: FormField;
  private overwriteCacheField: FormField;
  private overwriteOutputDirField: FormField;
  private perDeviceTrainBatchSizeField: FormField;
  private plotLossField: FormField;
  private preprocessingNumWorkersField: FormField;
  private saveStepsField: FormField;
  private templateField: DropdownField;
  private trustRemoteCodeField: FormField;
  private warmupRatioField: FormField;

  /**
   * Create a new TrainFormPage instance
   * @param page Playwright page object
   * @param baseUrl Base URL for the application (defaults to localhost)
   */
  constructor(page: Page, baseUrl: string = 'http://localhost', mode: string = 'basic') {
    super(page, baseUrl);

    this.mode = mode;
    this.path = "train";

    // Initialize basic form field components
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

    // Initialize advanced form field components with better selectors
    // For checkbox (has visible checkbox element)
    this.bf16Field = new FormField(page, 'bf16', [
      page.getByRole('checkbox', {name: "BF16 *"}),
      page.locator('input#bf16'),
      page.locator('input[name="bf16"]'),
      // More specific selectors for the React Bootstrap component
      page.locator('.form-check-input[name="bf16"]'),
      page.locator('label:has-text("BF16") input'),
    ]);

    this.cutoffLenField = new FormField(page, 'cutoff_len', [
      page.locator('input#cutoffLen'),
      page.locator('input[name="cutoff_len"]'),
      page.getByLabel('Cutoff Length')
    ]);

    this.gradientAccumulationStepsField = new FormField(page, 'gradient_accumulation_steps', [
      page.locator('input#gradientAccumulationSteps'),
      page.locator('input[name="gradient_accumulation_steps"]'),
      page.getByLabel('Gradient Accumulation Steps')
    ]);

    this.learningRateField = new FormField(page, 'learning_rate', [
      page.locator('input#learningRate'),
      page.locator('input[name="learning_rate"]'),
      page.getByLabel('Learning Rate')
    ]);

    this.loggingStepsField = new FormField(page, 'logging_steps', [
      page.locator('input#loggingSteps'),
      page.locator('input[name="logging_steps"]'),
      page.getByLabel('Logging Steps')
    ]);

    this.loraRankField = new FormField(page, 'lora_rank', [
      page.locator('input#loraRank'),
      page.locator('input[name="lora_rank"]'),
      page.getByLabel('LoRA Rank')
    ]);

    this.loraTargetField = new DropdownField(page, 'lora_target', [
      page.locator('input#loraTarget'),
      page.locator('input[name="lora_target"]'),
      page.getByLabel('LoRA Target')
    ]);

    this.lrSchedulerTypeField = new DropdownField(page, 'lr_scheduler_type', [
      page.locator('select#lrSchedulerType'),
      page.locator('select[name="lr_scheduler_type"]'),
      page.getByLabel('LR Scheduler Type')
    ]);

    this.numTrainEpochsField = new FormField(page, 'num_train_epochs', [
      page.locator('input#numTrainEpochs'),
      page.locator('input[name="num_train_epochs"]'),
      page.getByLabel('Number of Training Epochs')
    ]);

    this.perDeviceTrainBatchSizeField = new FormField(page, 'per_device_train_batch_size', [
      page.locator('input#perDeviceTrainBatchSize'),
      page.locator('input[name="per_device_train_batch_size"]'),
      page.getByLabel('Per Device Train Batch Size')
    ]);

    this.saveStepsField = new FormField(page, 'save_steps', [
      page.locator('input#saveSteps'),
      page.locator('input[name="save_steps"]'),
      page.getByLabel('Save Steps')
    ]);

    this.templateField = new DropdownField(page, 'template', [
      page.locator('select#template'),
      page.locator('select[name="template"]'),
      page.getByLabel('Template')
    ]);

    this.warmupRatioField = new FormField(page, 'warmup_ratio', [
      page.locator('input#warmupRatio'),
      page.locator('input[name="warmup_ratio"]'),
      page.getByLabel('Warmup Ratio')
    ]);

    // Checkboxes
    this.overwriteCacheField = new FormField(page, 'overwrite_cache', [
      // Include input and its container
      page.locator('.toggle-switch input[name="overwrite_cache"]'),
      page.locator('.toggle-switch-container:has-text("Overwrite Cache")'),
      page.locator('[data-testid="toggle-overwrite_cache"]'),
      // Label often works better for toggles since the input might be hidden
      page.getByText('Overwrite Cache').locator('..'), // Parent of text
    ]);

    this.overwriteOutputDirField = new FormField(page, 'overwrite_output_dir', [
      page.locator('input#overwrite_output_dir'),
      page.locator('input[name="overwrite_output_dir"]'),
      page.getByLabel('Output Directory')
    ]);

    this.plotLossField = new FormField(page, 'plot_loss', [
      page.locator('.toggle-switch input[name="plot_loss"]'),
      page.locator('.toggle-switch-container:has-text("Plot Loss")'),
      page.locator('[data-testid="toggle-plot_loss"]'),
      page.getByText('Plot Loss').locator('..'),
    ]);

    this.trustRemoteCodeField = new FormField(page, 'trust_remote_code', [
      page.locator('.toggle-switch input[name="trust_remote_code"]'),
      page.locator('.toggle-switch-container:has-text("Trust Remote Code")'),
      page.locator('[data-testid="toggle-trust_remote_code"]'),
      page.getByText('Trust Remote Code').locator('..'),
    ]);

    // Initialize the missing field
    this.preprocessingNumWorkersField = new FormField(page, 'preprocessing_num_workers', [
      page.locator('input#preprocessingNumWorkers'),
      page.locator('input[name="preprocessing_num_workers"]'),
      page.getByLabel('Preprocessing Num Workers')
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
          logger.warn(`Invalid field: name="${name}", id="${id}", type=${tagName}`);
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
      logger.error(`Error submitting form: ${error.message}`);
      await this.takeScreenshot('submit-error');
      return { success: false };
    }
  }

  /**
   * Helper method to handle both checkbox and toggle fields
   * @param field The FormField object
   * @param value The desired value (true/false)
   * @param fieldType The type of boolean field ('checkbox' or 'toggle')
   */
  private async handleBooleanField(field: FormField, value: boolean | string, fieldType: 'checkbox' | 'toggle'): Promise<void> {
    if (value === undefined) return;

    try {
      // Use the setChecked method from FormField
      await field.setChecked(value);
    } catch (error) {
      console.log(`Error handling ${fieldType} ${field.getName()}: ${error.message}`);
    }
  }

  /**
   * Fill form with advanced parameters
   * @param advancedParams The advanced parameters from trainFormData
   */
  async fillAdvancedParams(advancedParams: any): Promise<void> {
    // Only proceed if we're in advanced mode

    // Log the advanced parameters being used
    logger.debug(`Filling advanced params: ${JSON.stringify(advancedParams, null, 2)}`);

    // Fill numeric fields
    if (advancedParams.cutoff_len) {
      logger.debug(`Setting cutoff_len to ${advancedParams.cutoff_len}`);
      await this.cutoffLenField.setRangeValue(advancedParams.cutoff_len.toString());
    }

    if (advancedParams.gradient_accumulation_steps) {
      logger.debug(`Setting gradient_accumulation_steps to ${advancedParams.gradient_accumulation_steps}`);
      await this.gradientAccumulationStepsField.setRangeValue(advancedParams.gradient_accumulation_steps.toString());
    }

    if (advancedParams.learning_rate) {
      logger.debug(`Setting learning_rate to ${advancedParams.learning_rate}`);
      await this.learningRateField.setRangeValue(advancedParams.learning_rate.toString());
    }

    if (advancedParams.logging_steps) {
      logger.debug(`Setting logging_steps to ${advancedParams.logging_steps}`);
      await this.loggingStepsField.setRangeValue(advancedParams.logging_steps.toString());
    }

    if (advancedParams.lora_rank) {
      logger.debug(`Setting lora_rank to ${advancedParams.lora_rank}`);
      await this.loraRankField.setRangeValue(advancedParams.lora_rank.toString());
    }

    if (advancedParams.num_train_epochs) {
      logger.debug(`Setting num_train_epochs to ${advancedParams.num_train_epochs}`);
      await this.numTrainEpochsField.setRangeValue(advancedParams.num_train_epochs.toString());
    }

    if (advancedParams.per_device_train_batch_size) {
      logger.debug(`Setting per_device_train_batch_size to ${advancedParams.per_device_train_batch_size}`);
      await this.perDeviceTrainBatchSizeField.setRangeValue(advancedParams.per_device_train_batch_size.toString());
    }

    if (advancedParams.preprocessing_num_workers) {
      logger.debug(`Setting preprocessing_num_workers to ${advancedParams.preprocessing_num_workers}`);
      await this.preprocessingNumWorkersField.setRangeValue(advancedParams.preprocessing_num_workers.toString());
    }

    if (advancedParams.save_steps) {
      logger.debug(`Setting save_steps to ${advancedParams.save_steps}`);
      await this.saveStepsField.setRangeValue(advancedParams.save_steps.toString());
    }

    // // Handle warmup_ratio as a range input
    if (advancedParams.warmup_ratio) {
      logger.debug(`Setting warmup_ratio to ${advancedParams.warmup_ratio}`);
      await this.warmupRatioField.setRangeValue(advancedParams.warmup_ratio.toString());
    }

    // // Select dropdowns
    if (advancedParams.lora_target) {
      logger.debug(`Setting lora_target to ${advancedParams.lora_target}`);
      await this.loraTargetField.setRangeValue(advancedParams.lora_target.toString());
    }

    if (advancedParams.lr_scheduler_type) {
      logger.debug(`Setting lr_scheduler_type to ${advancedParams.lr_scheduler_type}`);
      await this.lrSchedulerTypeField.select(advancedParams.lr_scheduler_type);
    }

    if (advancedParams.template) {
      logger.debug(`Setting template to ${advancedParams.template}`);
      await this.templateField.select(advancedParams.template);
    }

    // // Handle boolean fields - using specific type identification for each field
    if (advancedParams.bf16 !== undefined) {
      // bf16 is a checkbox type
      logger.debug(`Setting bf16 to ${advancedParams.bf16}`);
      await this.bf16Field.setChecked(advancedParams.bf16);
    }

    // These are toggle types
    if (advancedParams.overwrite_cache !== undefined) {
      logger.debug(`Setting toggle overwrite_cache to ${advancedParams.overwrite_cache}`);
      await this.overwriteCacheField.setChecked(advancedParams.overwrite_cache);
    }

    if (advancedParams.overwrite_output_dir !== undefined) {
      logger.debug(`Setting toggle overwrite_output_dir to ${advancedParams.overwrite_output_dir}`);
      await this.overwriteOutputDirField.fill(advancedParams.overwrite_output_dir);
    }

    if (advancedParams.plot_loss !== undefined) {
      logger.debug(`Setting toggle plot_loss to ${advancedParams.plot_loss}`);
      await this.plotLossField.setChecked(advancedParams.plot_loss);
    }

    if (advancedParams.trust_remote_code !== undefined) {
      logger.debug(`Setting toggle trust_remote_code to ${advancedParams.trust_remote_code}`);
      await this.trustRemoteCodeField.setChecked(advancedParams.trust_remote_code);
    }

    // Allow time for form to update after setting all fields
    logger.debug('Advanced parameters filled, waiting for form to update');
    // await this.page.waitForTimeout(20000);
  }

  /**
   * Fill form with all the data from the test fixtures
   * @param formData The test data from trainFormData
   */
  async fillCompleteForm(formData: any): Promise<void> {
    // Basic fields
    await this.fillModelName(formData.modelName);
    await this.selectDataset(formData.datasets || formData.datasets);
    await this.selectTrainingMethod(formData.trainMethod || formData.train_method);
    await this.selectFinetuningType(formData.finetuningType || formData.finetuning_type);

    // Advanced fields
    if (this.mode === 'advanced' || formData.learning_rate ||
      formData.lora_rank || formData.num_train_epochs) {
      await this.fillAdvancedParams(formData);
    }
  }
}
