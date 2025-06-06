import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { DropdownField, FormField } from '../components/FormField';

/**
 * Page Object Model for the Export Form
 */
export class ExportFormPage extends BasePage {
    private modelNameDropdown: DropdownField;
    private adapterPathField: FormField;
    private exportDirField: FormField;
    private path:string;
    /**
     * Create a new ExportFormPage instance
     * @param page Playwright page object
     * @param baseUrl Base URL for the application (defaults to localhost)
     */
    constructor(page: Page, baseUrl: string = 'http://localhost', path:string) {
        super(page, baseUrl);
        this.path = path;
        // Initialize form field components with proper selectors based on actual HTML
        this.modelNameDropdown = new DropdownField(page, 'Base Model', [
            page.locator('select#modelNameOrPath'),
            page.locator('select[name="modelNameOrPath"]')
        ]);

        this.adapterPathField = new FormField(page, 'adapter path', [
            page.locator('input#adapterNameOrPath'),
            page.locator('input[name="adapterNameOrPath"]'),
            page.getByPlaceholder(/Enter adapter path/i)
        ]);

        this.exportDirField = new FormField(page, 'export directory', [
            page.locator('input#exportDir'),
            page.locator('input[name="exportDir"]'),
            page.getByPlaceholder(/Enter local export directory path/i)
        ]);
    }

    /**
     * Navigate to the export page
     */
    async goto() {
        await this.page.goto(`${this.baseUrl}`);
        await this.navigateLeftPanelTab(this.path);
        const formLoaded = await this.waitForElement('form', 30000);
    }

    /**
     * Fill the export form with the provided data
     */
    async fillExportForm(exportData: { modelPath: string, adapterPath: string, exportDirectory: string }) {
        // Use native selectOption for the <select> element instead of DropdownField
        await this.modelNameDropdown.select(exportData.modelPath);

        // const selectLocator = this.page.locator('select#modelNameOrPath');
        // if (await selectLocator.isVisible({ timeout: 2000 })) {
        //     await selectLocator.selectOption(exportData.modelPath);
        // } else {
        //     // Only use DropdownField as fallback
        //     await this.modelNameDropdown.select(exportData.modelPath);
        // }
        
        // Fill text fields
        await this.adapterPathField.fill(exportData.adapterPath);
        await this.exportDirField.fill(exportData.exportDirectory);
    }

    /**
     * Submit the export form and return the result
     */
    async submitExportForm() {
        // Set up listener to capture network requests
        let payload = null;
        this.page.on('request', request => {
            if (request.url().includes('/api/export')) {
                payload = request.postDataJSON();
            }
        });

        // Updated button selectors based on the actual HTML
        const exportButtonSelectors = [
            this.page.getByRole('button', { name: /Start Export/i }),
            this.page.locator('button[type="submit"]'),
            this.page.locator('button.submit-button'),
            this.page.locator('button.btn-primary').last()
        ];

        for (const selector of exportButtonSelectors) {
            if (await selector.isVisible({ timeout: 2000 })) {
                await selector.click();
                break;
            }
        }

        // Wait for success message or completion indicator
        const successSelectors = [
            this.page.locator('.export-success-message'),
            this.page.locator('.alert-success'),
            this.page.getByText(/export successful/i),
            this.page.getByText(/successfully exported/i)
        ];

        let successElement: Locator | null = null;
        for (const selector of successSelectors) {
            successElement = await selector.isVisible({ timeout: 30000 })
                .then(() => selector)
                .catch(() => null);
            
            if (successElement) break;
        }

        return {
            success: !!successElement,
            payload: payload
        };
    }

}
