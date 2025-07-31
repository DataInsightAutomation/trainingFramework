

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

test.describe('Inference Chat', () => {
    test.beforeEach(async ({ page }) => {
        logTestConfiguration();
    });


    test('UI check setting field is available', async ({ page }) => {
        await page.goto(`${config.BACKEND_SERVER}`);
        await page.getByRole('tab', { name: ' Inference' }).click();

        // Open settings sidebar
        await page.locator('button.settings-button').click();

        // Sidebar container
        const sidebar = page.locator('div.model-config-sidebar.show');
        await expect(sidebar).toBeVisible();

        // Title
        await expect(sidebar.locator('h4')).toHaveText('Model Settings');

        // Model Name or Path
        const modelNameLabel = sidebar.locator('label.form-label', { hasText: 'Model Name or Path' });
        await expect(modelNameLabel).toBeVisible();
        const modelNameInput = modelNameLabel.locator('xpath=following-sibling::div//input[@name="model_name_or_path"]');
        await expect(modelNameInput).toBeVisible();
        // Check default value
        expect(await modelNameInput.inputValue()).toBe('meta-llama/Llama-3.2-1B-Instruct');

        // Adapter Name or Path
        const adapterLabel = sidebar.locator('label.form-label', { hasText: 'Adapter Name or Path' });
        await expect(adapterLabel).toBeVisible();
        const adapterInput = adapterLabel.locator('xpath=following-sibling::div//input[@name="adapter_name_or_path"]');
        await expect(adapterInput).toBeVisible();
        expect(await adapterInput.inputValue()).toBe('saves/Llama-3.2-1B-Instruct/supervised/lora/sft');

        // Template select
        const templateLabel = sidebar.locator('label.form-label', { hasText: 'Template' });
        await expect(templateLabel).toBeVisible();
        const templateSelect = templateLabel.locator('xpath=following-sibling::select[@name="template"]');
        await expect(templateSelect).toBeVisible();
        // Check default value (should match the value attribute of the selected <option>)
        expect(await templateSelect.inputValue()).toBe('llama3'); // or whatever the default is

        // Finetuning Type select
        const finetuneLabel = sidebar.locator('label.form-label', { hasText: 'Finetuning Type' });
        await expect(finetuneLabel).toBeVisible();
        const finetuneSelect = finetuneLabel.locator('xpath=following-sibling::select[@name="finetuning_type"]');
        await expect(finetuneSelect).toBeVisible();
        expect(await finetuneSelect.inputValue()).toBe('lora'); // or whatever the default is

        // Inference Backend select
        const backendLabel = sidebar.locator('label.form-label', { hasText: 'Inference Backend' });
        await expect(backendLabel).toBeVisible();
        const backendSelect = backendLabel.locator('xpath=following-sibling::select[@name="infer_backend"]');
        await expect(backendSelect).toBeVisible();
        expect(await backendSelect.inputValue()).toBe('huggingface'); // or whatever the default is
    })

    test('0041 should be able to do default chat and has a proper response with hi', async ({ page }) => {
        await page.goto(`${config.BACKEND_SERVER}`);
        await page.getByRole('tab', { name: ' Inference' }).click();
        await page.getByRole('textbox', { name: 'Type your message here...' }).click();
        await page.getByRole('textbox', { name: 'Type your message here...' }).fill('hi');
        await page.locator('button.send-button').click()
        const assistantMessage = page.locator('.chat-messages .message.assistant .plain-text div');
        await expect(assistantMessage).toHaveText(/.+/, { timeout: 15000 }); // Wait up to 15 seconds
        const replyText = await assistantMessage.textContent();

        expect(replyText?.trim()).not.toBe('Error: No streaming response from backend.');
        const responseTime = page.locator('.chat-messages .message.assistant .message-footer .message-time .ms-2');
        console.log(responseTime, 'responseTime')
        await expect(responseTime).toHaveText(/Response time: [\d.]+s/, { timeout: 5000 });
    });
});
