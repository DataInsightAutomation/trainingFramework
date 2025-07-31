import { test, expect } from '@playwright/test';
import { TrainFormPage } from '../pages/TrainFormPage';
import { ExportFormPage } from '../pages/ExportFormPage';
import { config, logTestConfiguration, getScreenshotPath } from '../utils/testHelpers';
import { trainFormTestData } from '../fixtures/trainFormData';
import { exportFormData } from '../fixtures/exportFormData';
import { logger } from '../utils/logger';  // Import the logger

test.setTimeout(config.timeout);

test.describe('Evaluate form tests', () => {
  test.beforeEach(async ({ page }) => {
    logTestConfiguration();
  });

  test('0031 should be able to evaluate model', async ({ page }) => {
      await page.goto(`${config.BACKEND_SERVER}`);
      await page.getByRole('tab', { name: ' Evaluate' }).click();
      await page.getByText('Training Evaluation').click();
      await page.getByRole('button', { name: '' }).click();
      await page.getByRole('button', { name: 'Llama-3.2-1B-instruct' }).click();
      await page.getByRole('textbox', { name: 'Adapter Path' }).click();
      await page.getByRole('textbox', { name: 'Adapter Path' }).fill('saves/Llama-3.2-1B-Instruct/supervised/lora/sft');
      await page.getByRole('textbox', { name: 'Output Directory' }).click();
      await page.getByRole('textbox', { name: 'Output Directory' }).fill('saves/eval/Llama-3.2-1B-instruct');
      // await page.locator('div').filter({ hasText: /^Dataset \*$/ }).locator('div').nth(1).click();
      await page.locator("#dataset").click()
      await page.getByRole('textbox', { name: 'Dataset *' }).click();
      await page.getByText('Easydata Alpaca Public').click();
      await page.getByRole('button', { name: 'Start Evaluation' }).click();
    });
});
