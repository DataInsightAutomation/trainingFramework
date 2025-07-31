import { test, expect } from '@playwright/test';
import { TrainFormPage } from '../pages/TrainFormPage';
import { ExportFormPage } from '../pages/ExportFormPage';
import { config, logTestConfiguration, getScreenshotPath, captureTestResult } from '../utils/testHelpers';
import { trainFormTestData } from '../fixtures/trainFormData';
import { exportFormData } from '../fixtures/exportFormData';
import { logger, LogLevel } from '../utils/logger';
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

function comparePayloadWithTestData(payload: any, testData: any, essentialProps: Array<string> = ['model_name', 'dataset', 'stage', 'finetuning_type']) {
  // function comparePayloadWithTestData(payload: any, testData: any, essentialProps:Array<string> = ['model_name', 'dataset', 'train_method', 'finetuning_type']) {

  // Compare essential properties that should match
  const differences: Record<string, { expected: any, actual: any }> = {};

  for (const prop of essentialProps) {
    if (payload[prop] !== testData[prop]) {
      differences[prop] = {
        expected: testData[prop],
        actual: payload[prop]
      };
    }
  }

  return {
    isMatch: Object.keys(differences).length === 0,
    differences
  };
}
async function mockAndCapturePayload(page, routePattern: string, responseBody: any) {
  let capturedPayload: any = null;
  await page.route(routePattern, async (route, request) => {
    capturedPayload = request.postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
  return () => capturedPayload;
}
test.describe('Training form tests', () => {
  test.beforeEach(async ({ page }) => {
    logTestConfiguration();
    logger.setLevel(LogLevel.DEBUG);

  });
  test('mock 0001a train basic form (mock backend, payload check with fill)', async ({ page }) => {
    const testData = trainFormTestData.basicTraining;
    const getPayload = await mockAndCapturePayload(page, '**/v1/train', { success: true, job_id: 'mock-job-0001a' });

    // Use the Page Object Model
    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    await trainForm.goto();
    await trainForm.fillModelName(testData.model_name);
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectFinetuningType(testData.finetuning_type);

    // Submit the form (will hit the mocked backend)
    await trainForm.submitTrainingForm();

    // Wait for the request to be captured
    await page.waitForTimeout(500); // Small wait to ensure route is hit
    const capturedPayload = getPayload(); // <-- get the payload after submission
    // Assert and log
    expect(capturedPayload).toBeTruthy();
    const comparison = comparePayloadWithTestData(capturedPayload, testData);
    if (!comparison.isMatch) {
      console.log('Differences between test data and payload:', comparison.differences);
    }
    expect(comparison.isMatch,
      `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
    ).toBeTruthy();
  });

  test('mock 0001b train basic form (mock backend, payload check with click)', async ({ page }) => {
    const testData = trainFormTestData.basicTraining;
    // Use the Page Object Model
    const getPayload = await mockAndCapturePayload(page, '**/v1/train', { success: true, job_id: 'mock-job-0001a' });

    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    await trainForm.goto();
    await trainForm.selectModelNameWithSearch('tiny-random-Llama-3');
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectFinetuningType(testData.finetuning_type);

    // Submit the form (will hit the mocked backend)
    await trainForm.submitTrainingForm();

    // Wait for the request to be captured
    await page.waitForTimeout(500); // Small wait to ensure route is hit
    const capturedPayload = getPayload(); // <-- get the payload after submission
    // Assert and log
    expect(capturedPayload).toBeTruthy();
    const comparison = comparePayloadWithTestData(capturedPayload, testData);
    if (!comparison.isMatch) {
      console.log('Differences between test data and payload:', comparison.differences);
    }
    expect(comparison.isMatch,
      `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
    ).toBeTruthy();
  });

  test('mock 0001c train basic form (mock backend, payload check with click)', async ({ page }) => {
    const testData = trainFormTestData.basicTraining;
    // Use the Page Object Model
    const getPayload = await mockAndCapturePayload(page, '**/v1/train', { success: true, job_id: 'mock-job-0001a' });

    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    await trainForm.goto();
    await trainForm.selectModelNameWithSearch('tiny-random');
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectFinetuningType(testData.finetuning_type);

    // Submit the form (will hit the mocked backend)
    await trainForm.submitTrainingForm();

    // Wait for the request to be captured
    await page.waitForTimeout(500); // Small wait to ensure route is hit
    const capturedPayload = getPayload(); // <-- get the payload after submission
    // Assert and log
    expect(capturedPayload).toBeTruthy();
    const comparison = comparePayloadWithTestData(capturedPayload, testData);
    if (!comparison.isMatch) {
      console.log('Differences between test data and payload:', comparison.differences);
    }
    expect(comparison.isMatch,
      `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
    ).toBeTruthy();
  });

  test('0001 train basic form', async ({ page }) => {
    console.log(`Test timeout set to ${config.timeout / 1000} seconds`);

    // Use the Page Object Model
    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    const testData = trainFormTestData.basicTraining;

    // Test steps using the POM methods
    await trainForm.goto();
    await trainForm.fillModelName(testData.model_name);
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectFinetuningType(testData.finetuning_type);
    // Log form data before submission
    logger.debug('Submitting form with test data: ' + JSON.stringify(testData, null, 2));

    const result = await trainForm.submitTrainingForm();

    // Log the captured submission payload
    if (result.payload) {
      logger.debug('Form submission payload: ' + JSON.stringify(result.payload, null, 2));
    } else {
      logger.warn('No submission payload was captured');
    }
    // Verify the submission was successful
    expect(result.payload).toBeTruthy();

    // Capture final state for recording
    await captureTestResult(page, 'basic-train');

    expect(result.success).toBeTruthy();

    // Compare essential properties between testData and payload
    if (result.payload) {
      const comparison = comparePayloadWithTestData(result.payload, testData);

      // Log comparison results for debugging
      if (!comparison.isMatch) {
        console.log('Differences between test data and payload:', comparison.differences);
      }

      // Assert that essential properties match
      expect(comparison.isMatch,
        `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
      ).toBeTruthy();

      // Additional specific assertions if needed
      expect(result.payload.model_name).toBe(testData.model_name);
      // expect(result.payload.datasets).toBe(testData.datasets);
      // value and label, will not be same..
    }
  });

  test('0010 train advanced default', async ({ page }) => {
    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    const testData = trainFormTestData.advancedTraining;

    // Test steps using the POM methods
    await trainForm.goto();
    await trainForm.fillModelName(testData.model_name);
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectFinetuningType(testData.finetuning_type);
    await trainForm.fillAdvancedParams(trainFormTestData.advancedTraining);
    console.log('Submitting form with test data:', JSON.stringify(testData, null, 2));

    const result = await trainForm.submitTrainingForm();

    // Log the captured submission payload
    if (result.payload) {
      console.log('Form submission payload:', JSON.stringify(result.payload, null, 2));
    } else {
      console.log('No submission payload was captured');
    }
    expect(result.payload).toBeTruthy();

    // // Capture final state for recording
    await captureTestResult(page, 'advanced-train');

    // Verify the submission was successful
    expect(result.success).toBeTruthy();

    // Compare essential properties between testData and payload
    if (result.payload) {
      const comparison = comparePayloadWithTestData(result.payload, testData);

      // Log comparison results for debugging
      if (!comparison.isMatch) {
        console.log('Differences between test data and payload:', comparison.differences);
      }

      // Assert that essential properties match
      expect(comparison.isMatch,
        `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
      ).toBeTruthy();

      // Check advanced parameters if they exist in the payload
      // Replace 'advancedParams' with direct property checks, e.g., 'epochs', 'learning_rate', etc.
      if ('epochs' in result.payload && 'epochs' in testData) {
        // You can add specific assertions for advanced parameters here
        // For example: expect(result.payload.epochs).toBe(testData.epochs);
      }
    }
  });

  test('0011 train basic rlhf reward model ', async ({ page }, testInfo) => {
    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    const testData = trainFormTestData.basicTrainingRewardModel;

    // Test steps using the POM methods
    await trainForm.goto();
    await trainForm.fillModelName(testData.model_name);
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectFinetuningType(testData.finetuning_type);
    await trainForm.selectStage(testData.stage);

    logger.debug('Submitting form with test data: ' + JSON.stringify(testData, null, 2));

    const result = await trainForm.submitTrainingForm();

    // Log the captured submission payload
    if (result.payload) {
      logger.debug('Form submission payload: ' + JSON.stringify(result.payload, null, 2));
    } else {
      logger.warn('No submission payload was captured');
    }
    // Verify the submission was successful
    expect(result.payload).toBeTruthy();

    // Capture final state for recording
    await captureTestResult(page, testInfo.title);

    expect(result.success).toBeTruthy();

    // Compare essential properties between testData and payload
    if (result.payload) {
      const comparison = comparePayloadWithTestData(result.payload, testData);

      // Log comparison results for debugging
      if (!comparison.isMatch) {
        console.log('Differences between test data and payload:', comparison.differences);
      }

      // Assert that essential properties match
      expect(comparison.isMatch,
        `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
      ).toBeTruthy();

      // Additional specific assertions if needed
      expect(result.payload.model_name).toBe(testData.model_name);
      // expect(result.payload.datasets).toBe(testData.datasets);
      // value and label, will not be same..
    }
  });

  test('0012 train basic rlhf ppo with trained reward model ', async ({ page }, testInfo) => {
    const trainForm = new TrainFormPage(page, `${config.BACKEND_SERVER}`);
    const testData = trainFormTestData.basicTrainingPPO;

    // Test steps using the POM methods
    await trainForm.goto();
    await trainForm.fillModelName(testData.model_name);
    await trainForm.selectDataset(testData.datasets);
    await trainForm.selectTrainingMethod(testData.train_method);
    await trainForm.selectStage(testData.stage);

    await trainForm.selectFinetuningType(testData.finetuning_type);

    logger.debug('Submitting form with test data: ' + JSON.stringify(testData, null, 2));

    const result = await trainForm.submitTrainingForm();

    // Log the captured submission payload
    if (result.payload) {
      logger.debug('Form submission payload: ' + JSON.stringify(result.payload, null, 2));
    } else {
      logger.warn('No submission payload was captured');
    }
    // Verify the submission was successful
    expect(result.payload).toBeTruthy();

    // Capture final state for recording
    await captureTestResult(page, testInfo.title);
    expect(result.success).toBeTruthy();

    // Compare essential properties between testData and payload
    if (result.payload) {
      const comparison = comparePayloadWithTestData(result.payload, testData);

      // Log comparison results for debugging
      if (!comparison.isMatch) {
        console.log('Differences between test data and payload:', comparison.differences);
      }

      // Assert that essential properties match
      expect(comparison.isMatch,
        `Payload doesn't match test data. Differences: ${JSON.stringify(comparison.differences)}`
      ).toBeTruthy();

      // Additional specific assertions if needed
      expect(result.payload.model_name).toBe(testData.model_name);
      // expect(result.payload.datasets).toBe(testData.datasets);
      // value and label, will not be same..
    }
  });

});
