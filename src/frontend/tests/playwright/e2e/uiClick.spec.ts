import { test, expect } from '@playwright/test';
import { config, logTestConfiguration, getScreenshotPath } from '../utils/testHelpers';

test.setTimeout(config.timeout);

test.describe('Ui button suite', () => {
    // Changed from beforeEach to beforeAll to run only once for the entire suite
    test.beforeAll(async () => {
        logTestConfiguration();
    });

    test('UI. click language', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);

        // Change to Chinese
        await page.getByRole('button', { name: 'Language' }).click();
        await page.getByRole('button', { name: '中文' }).click();

        // Verify language changed
        await expect(page.getByRole('button', { name: '语言' })).toBeVisible();
        await page.screenshot({ path: getScreenshotPath('language-chinese.png') });

        // Change back to English
        await page.getByRole('button', { name: '语言' }).click();
        await page.getByRole('button', { name: 'English' }).click();

        // Verify changed back to English
        await expect(page.getByRole('button', { name: 'Language' })).toBeVisible();
    })

    test('UI. click theme', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);

        // Change to dark mode
        await page.getByRole('button', { name: ' Dark Mode' }).click();

        // Verify dark mode is active - check that the class contains dark-theme
        await expect(page.locator('.main-layout')).toHaveClass(/dark-theme/);
        await page.screenshot({ path: getScreenshotPath('dark-mode.png') });

        // Change to light mode
        await page.getByRole('button', { name: ' Light Mode' }).click();

        // Verify light mode is active (dark-theme class is removed)
        await expect(page.locator('.main-layout')).not.toHaveClass(/dark-theme/);
    })

    test('UI. click leftpanel', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);

        // Hide left panel
        await page.getByTitle('Hide Left Panel').locator('i').click();

        // Verify panel is hidden
        await expect(page.getByTitle('Show Left Panel')).toBeVisible();
        await page.screenshot({ path: getScreenshotPath('left-panel-hidden.png') });

        // Show left panel
        await page.getByTitle('Show Left Panel').locator('i').click();

        // Verify panel is visible
        await expect(page.getByTitle('Hide Left Panel')).toBeVisible();
    })

    test('UI. click header', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);

        // Hide header
        await page.getByText('▲').click();

        // Verify header is hidden
        await expect(page.getByTitle('Show Header (Shift+H)')).toBeVisible();
        await page.screenshot({ path: getScreenshotPath('header-hidden.png') });

        // Show header
        await page.getByTitle('Show Header (Shift+H)').click();

        // Verify header is visible
        await expect(page.getByText('▲')).toBeVisible();
    })

    test('UI. toggle advanced option', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);
        
        // Switch to advanced mode
        await page.getByRole('button', { name: 'Advanced Options' }).click();
        
        // Verify advanced mode is active
        await expect(page.getByRole('button', { name: 'Basic Options' })).toBeVisible();
        await page.screenshot({ path: getScreenshotPath('advanced-options.png') });
        
        // Switch back to basic mode
        await page.getByRole('button', { name: 'Basic Options' }).click();
        
        // Verify basic mode is active
        await expect(page.getByRole('button', { name: 'Advanced Options' })).toBeVisible();
    })
    
    // Create separate tests for each advanced feature
    test('UI. collapsible sections in advanced mode', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);
        
        // First ensure we're in advanced mode
        await page.getByRole('button', { name: 'Advanced Options' }).click();
        
        // Collapse a section
        const modelSettingsSection = page.locator('div').filter({ hasText: /^Model Settings$/ }).nth(2);
        await modelSettingsSection.click();
        
        // Verify section is collapsed (you might need to adjust this verification based on your UI)
        await expect(modelSettingsSection).not.toHaveClass(/expanded /);
        await page.screenshot({ path: getScreenshotPath('section-collapsed.png') });
        
        // Expand the section again
        await modelSettingsSection.click();
        
        // Verify section is expanded
        await expect(modelSettingsSection).toHaveClass(/expanded/);
    })
    
    test('UI. toggle switches in advanced mode', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);
        
        // First ensure we're in advanced mode
        await page.getByRole('button', { name: 'Advanced Options' }).click();
        
        // Find and toggle a switch
        const firstSwitch = page.getByRole('switch').first();
        
        // Get initial state
        const initialChecked = await firstSwitch.isChecked();
        
        // Toggle on if off, off if on
        await firstSwitch.click();
        
        // Verify toggle changed state
        await expect(firstSwitch).toBeChecked({ checked: !initialChecked });
        await page.screenshot({ path: getScreenshotPath('switch-toggled.png') });
        
        // Toggle back
        await firstSwitch.click();
        
        // Verify toggle returned to initial state
        await expect(firstSwitch).toBeChecked({ checked: initialChecked });
    })
    
    test('UI. number inputs in advanced mode', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);
        
        // First ensure we're in advanced mode
        await page.getByRole('button', { name: 'Advanced Options' }).click();
        
        // Find the LoRA Rank input
        const rankInput = page.getByRole('spinbutton', { name: 'LoRA Rank' });
        
        // Get initial value
        const initialValue = await rankInput.inputValue();
        
        // Increment with arrow key
        await rankInput.click();
        await rankInput.press('ArrowUp');
        
        // Verify value increased
        const increasedValue = await rankInput.inputValue();
        expect(parseInt(increasedValue)).toBeGreaterThan(parseInt(initialValue || '0'));
        
        // Decrement with arrow key
        await rankInput.press('ArrowDown');
        
        // Verify value returned to initial
        await expect(rankInput).toHaveValue(initialValue);
        
        // Test direct input
        await rankInput.fill('42');
        await expect(rankInput).toHaveValue('42');
    })
    
    test('UI. checkboxes in advanced mode', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);
        
        // First ensure we're in advanced mode
        await page.getByRole('button', { name: 'Advanced Options' }).click();
        
        // Find the BF16 checkbox
        const bf16Checkbox = page.getByRole('checkbox', { name: 'BF16' });
        
        // Get initial state
        const initialChecked = await bf16Checkbox.isChecked();
        
        // Toggle by clicking the text
        await page.getByText('BF16').click();
        
        // Verify checkbox changed state
        if (initialChecked) {
            await expect(bf16Checkbox).not.toBeChecked();
        } else {
            await expect(bf16Checkbox).toBeChecked();
        }
        
        // Toggle back by clicking the text
        await page.getByText('BF16').click();
        
        // Verify checkbox returned to initial state
        if (initialChecked) {
            await expect(bf16Checkbox).toBeChecked();
        } else {
            await expect(bf16Checkbox).not.toBeChecked();
        }
        
        // Test direct checkbox interaction
        await bf16Checkbox.uncheck();
        await expect(bf16Checkbox).not.toBeChecked();
        
        await bf16Checkbox.check();
        await expect(bf16Checkbox).toBeChecked();
    })
    
    test('UI. search functionality in advanced mode', async ({ page }) => {
        await page.goto(config.BACKEND_SERVER);
        
        // First ensure we're in advanced mode
        await page.getByRole('button', { name: 'Advanced Options' }).click();
        
        // Test search functionality
        const searchBox = page.getByRole('textbox', { name: 'Search fields...' });
        await searchBox.click();
        await searchBox.fill('rank');
        
        // Verify search results show "Rank"
        await expect(page.getByText('Rank', { exact: true })).toBeVisible();
        await page.screenshot({ path: getScreenshotPath('search-results.png') });
        
        // Clear search
        await searchBox.clear();
    })
});
