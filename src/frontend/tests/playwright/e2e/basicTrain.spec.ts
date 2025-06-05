import { test, expect } from '@playwright/test';
import { TrainFormPage } from '../pages/TrainFormPage';
import { config, logTestConfiguration, getScreenshotPath } from '../utils/testHelpers';
import { trainFormTestData } from '../fixtures/trainFormData';
import * as path from 'path';

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
    
    // Pass the dataset name from test data
    await trainForm.selectDataset(testData.dataset);
    
    await trainForm.selectTrainingMethod();
    
    // Log form data before submission
    console.log('Submitting form with test data:', JSON.stringify(testData, null, 2));
    
    const isSuccessful = await trainForm.submitForm();
    
    // Take final screenshot regardless of result - now using the imported helper
    await page.screenshot({ path: getScreenshotPath('final-state.png') });
    
    // Verify the submission was successful
    expect(isSuccessful).toBeTruthy();
  });
  
  // // Example of how to add more tests easily with the modular structure
  // test.skip('should be able to train with LoRA fine-tuning', async ({ page }) => {
  //   const trainForm = new TrainFormPage(page);
    
  //   await trainForm.goto();
  //   await trainForm.fillModelName(trainFormTestData.loraTraining.modelName);
  //   await trainForm.selectDataset();
  //   await trainForm.selectTrainingMethod();
  //   // Additional LoRA-specific steps would go here
  //   const isSuccessful = await trainForm.submitForm();
    
  //   expect(isSuccessful).toBeTruthy();
  // });
  
  // test.skip('should be able to train with a custom dataset', async ({ page }) => {
  //   const trainForm = new TrainFormPage(page);
    
  //   await trainForm.goto();
  //   await trainForm.fillModelName(trainFormTestData.customDatasetTraining.modelName);
  //   // Custom dataset selection would use a different method or parameter
  //   await trainForm.selectTrainingMethod();
  //   const isSuccessful = await trainForm.submitForm();
    
  //   expect(isSuccessful).toBeTruthy();
  // });
});
