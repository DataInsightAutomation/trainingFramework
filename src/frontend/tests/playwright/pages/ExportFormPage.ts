import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './BasePage';
import { DropdownField, FormField } from '../components/FormField';
import { logger } from '../utils/logger';

/**
 * Page Object Model for the Export Form
 */
export class ExportFormPage extends BaseFormPage {
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
        
        // Fill text fields
        await this.adapterPathField.fill(exportData.adapterPath);
        await this.exportDirField.fill(exportData.exportDirectory);
    }

    /**
     * Submit the export form
     * Using the parent BaseFormPage.submitForm method for consistency
     */
    async submitExportForm(): Promise<{ success: boolean, payload?: any }> {
        // Define submit button selectors
        const submitButtonSelectors = [
            { type: 'role', selector: 'Export' },
            this.page.getByText('Export', { exact: true }),
            this.page.locator('button[type="submit"]'),
            this.page.locator('.export-submit-button')
        ];

        // Define success patterns - adjust based on your UI's actual messages
        const successPatterns = [
            /Export job started/i,
            /Successfully queued export/i,
            /Export in progress/i
        ];

        // Define error patterns
        const errorPatterns = [
            /Error/i,
            /Failed to export/i,
            /Invalid export/i
        ];

        // Define URL patterns to monitor for the export API call
        const urlPatterns = ['/export'];
        
        logger.debug('Submitting export form with configured patterns');

        // Use the parent class's submitForm method
        const result = await this.submitForm(
            submitButtonSelectors,
            successPatterns,
            errorPatterns,
            urlPatterns
        );
        
        if (result.success) {
            logger.info('Export submission was successful');
        } else {
            logger.warn('Export submission failed');
        }
        
        return result;
    }
}
