import { test, expect } from '@playwright/test';
import { TrainFormPage } from '../pages/TrainFormPage';
import { ExportFormPage } from '../pages/ExportFormPage';
import { config, logTestConfiguration, getScreenshotPath } from '../utils/testHelpers';
import { trainFormTestData } from '../fixtures/trainFormData';
import { exportFormData } from '../fixtures/exportFormData';
/**
 * IMPORTANT: Running tests with browser UI (non-headless mode)
 * 
 * If you get the error:
 * "Looks like you launched a headed browser without having a XServer running."
 * 
 * You have two options:
 * 
 * 1. Run in headless mode (no visible browser):
 *    npx playwright test
 * 
 * 2. Use xvfb-run to create a virtual display:
 *    xvfb-run npx playwright test --headed
 *    OR
 *    xvfb-run -a HEADLESS_MODE=false npx playwright test
 * 
 * For recording videos with human-like interactions:
 *    xvfb-run -a HEADLESS_MODE=false HUMAN_MODE=true RECORDING_MODE=true npx playwright test
 *
 * Install xvfb if needed:
 *    sudo apt-get install xvfb
 */

// Set timeout based on configuration
test.setTimeout(config.timeout);

test.describe('Training form tests', () => {
  test.beforeEach(async ({ page }) => {
    logTestConfiguration();
  });
  
  test('should be able to fill and submit the training form with basic settings', async ({ page }) => {
    console.log(`Test timeout set to ${config.timeout/1000} seconds`);
    
    // Use the Page Object Model
    const trainForm = new TrainFormPage(page, "http://localhost:1234");
    const testData = trainFormTestData.basicTraining;
    
    // Test steps using the POM methods
    await trainForm.goto();
    await trainForm.fillModelName(testData.modelName);
    await trainForm.selectDataset(testData.dataset);
    await trainForm.selectTrainingMethod(testData.trainMethod);
    await trainForm.selectFinetuningType(testData.finetuning_type);
    // Log form data before submission
    console.log('Submitting form with test data:', JSON.stringify(testData, null, 2));
    
    const result = await trainForm.submitTrainingForm();
    
    // Log the captured submission payload
    if (result.payload) {
      console.log('Form submission payload:', JSON.stringify(result.payload, null, 2));
    } else {
      console.log('No submission payload was captured');
    }
    
    // Take final screenshot regardless of result - now using the imported helper
    await page.screenshot({ path: getScreenshotPath('final-state.png') });
    
    // Verify the submission was successful
    expect(result.success).toBeTruthy();
  });
});
