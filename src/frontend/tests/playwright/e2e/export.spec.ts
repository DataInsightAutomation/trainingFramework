import { test, expect } from '@playwright/test';
import { TrainFormPage } from '../pages/TrainFormPage';
import { ExportFormPage } from '../pages/ExportFormPage';
import { config, logTestConfiguration, getScreenshotPath } from '../utils/testHelpers';
import { trainFormTestData } from '../fixtures/trainFormData';
import { exportFormData } from '../fixtures/exportFormData';
import { logger } from '../utils/logger';  // Import the logger

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

test.describe('Export form tests', () => {
  test.beforeEach(async ({ page }) => {
    logTestConfiguration();
  });

  test('should be able to export a trained model', async ({ page }) => {
    logger.info(`Test timeout set to ${config.timeout / 1000} seconds`);

    const exportForm = new ExportFormPage(page, `${config.BACKEND_SERVER}`, 'export');
    const exportData = exportFormData.exportModel;

    await exportForm.goto();
    await exportForm.fillExportForm({
      modelPath: exportData.model_name_or_path,
      adapterPath: exportData.adapter_name_or_path,
      exportDirectory: exportData.export_dir
    });

    logger.info('Submitting export with data: ' + JSON.stringify(exportData, null, 2));

    // Use the updated submitExportForm which now properly handles waiting for the response
    const result = await exportForm.submitExportForm();

    if (result.payload) {
      logger.info(`Export submission payload: ${JSON.stringify(result.payload, null, 2)}`);
    } else {
      logger.warn('No export submission payload was captured');
    }

    await page.screenshot({ path: getScreenshotPath('export-result.png') });
    expect(result.success).toBeTruthy();
  });
  test('0021 should be able to export a trained model with advanced setting and token', async ({ page }) => {
      await page.goto(`${config.BACKEND_SERVER}`);
      await page.getByRole('tab', { name: ' Export' }).click();
      await page.getByRole('button', { name: 'Advanced Export Options' }).click();
      await page.getByLabel('Base Model *').selectOption('llamafactory/tiny-random-Llama-3');

      await page.getByRole('textbox', { name: 'Adapter Path *' }).click();
      await page.getByRole('textbox', { name: 'Adapter Path *' }).fill('saves/tiny-random-Llama-3/supervised/lora/sft');
      await page.getByRole('textbox', { name: 'Export Directory *' }).click();
      await page.getByRole('textbox', { name: 'Export Directory *' }).fill('saves/export/Tiny-random-llama-3');
      await page.getByRole('switch').nth(2).click();
      await page.getByRole('textbox', { name: 'Merged Model Hub ID *' }).dblclick();
      await page.getByRole('textbox', { name: 'Merged Model Hub ID *' }).fill('exportModelTinyRandomLlama3-2');
      await page.getByRole('textbox', { name: 'HuggingFace Hub Token *' }).click();
      await page.getByRole('textbox', { name: 'HuggingFace Hub Token *' }).fill(config.HUB_TOKEN);
      await page.getByRole('spinbutton', { name: 'Export Size (GB)' }).click();
      await page.getByRole('spinbutton', { name: 'Export Size (GB)' }).fill('5');
      await page.getByLabel('Export Device').selectOption('auto');
      await page.getByRole('button', { name: 'Start Export' }).click();
    });
});
