import { Locator, Page } from '@playwright/test';
import { BaseFormPage } from './BasePage';
import { DropdownField, FormField } from '../components/FormField';

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
     * Submit the export form and return the result
     */
    async submitExportForm(): Promise<{ success: boolean, payload?: any }> {
        try {
            // Check for validation errors before submitting
            const invalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').count();
            if (invalidFields > 0) {
                console.log(`Found ${invalidFields} invalid form fields before submission`);
                
                // Log which fields are invalid to help debugging
                const allInvalidFields = await this.page.locator('input:invalid, select:invalid, textarea:invalid').all();
                for (const field of allInvalidFields) {
                    const name = await field.getAttribute('name') || '(missing-name)';
                    const id = await field.getAttribute('id') || '(missing-id)';
                    const tagName = await field.evaluate(el => el.tagName.toLowerCase());
                    console.log(`Invalid field: name="${name}", id="${id}", type=${tagName}`);
                }
                
                return { success: false };
            }

            // Take screenshot before submission
            await this.takeScreenshot('export-form-before-submit');
            
            // Button selectors for the export form
            const buttonSelectors = [
                this.page.getByRole('button', { name: 'Start Export' }),
                this.page.getByRole('button', { name: 'Export' }),
                this.page.locator('button.submit-button'),
                this.page.locator('button[type="submit"]')
            ];
            
            // Define patterns to detect success/errors
            const successPatterns = [
                /Export job started/i, 
                /successfully exported/i, 
                /completed/i,
                /success/i
            ];
            
            const errorPatterns = [
                /export failed/i, 
                /error/i, 
                /failed/i,
                /invalid/i
            ];
            
            // URL patterns to monitor for network requests
            const urlPatterns = [
                '/api/export',
                '/v1/export',
                '/export'
            ];
            
            // Use the enhanced base submitForm method
            const result = await super.submitForm(
                buttonSelectors,
                successPatterns,
                errorPatterns,
                urlPatterns
            );
            
            // Additional validation and checks if needed
            if (!result.success) {
                console.log('Export submission was not successful');
                await this.takeScreenshot('export-failure');
            } else {
                console.log('Export submission was successful');
                await this.takeScreenshot('export-success');
            }
            
            return result;
            
        } catch (error) {
            console.error(`Error submitting export form: ${error.message}`);
            await this.takeScreenshot('export-submit-error');
            return { success: false };
        }
    }
}
