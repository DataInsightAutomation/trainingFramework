import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useAppStore } from '../../../store/appStore';
import TextField from '../../core/field/text/TextField';
import SearchableSelectField from '../../core/field/searchableSelect/SearchableSelectField';
import { DropDown } from '../../core/field/dropdown/Dropdown';
import MultiSelectField from '../../core/field/multiSelect/MultiSelectField'; // Import MultiSelectField
import ToggleField from '../../core/field/toggle/ToggleField'; // Import the new ToggleField component
import CheckboxField from '../../core/field/checkbox/CheckboxField'; // Import the new CheckboxField component
import './ModelForm.scss'; // Import the SCSS file

export interface FormField {
    hideLabel?: any;
    name: string;
    type: 'text' | 'select' | 'searchableSelect' | 'multiSelect' | 'sectionHeader' | 'number' | 'range' | 'toggle' | 'checkbox' | 'empty';
    colSpan?: number;
    options?: ReadonlyArray<{
        readonly value: string;
        readonly label?: string;
        readonly directLabel?: string;
    }> | Array<{
        value: string;
        label?: string;
        directLabel?: string;
    }>;
    required?: boolean;
    collapsible?: boolean;
    expanded?: boolean;
    onToggle?: () => void;
    customTitle?: string;
    min?: number;
    max?: number;
    step?: number;
    // Add support for search highlighting
    searchHighlight?: string;
    defaultValue?: string;
    creatable?: boolean; // For searchableSelect, allows creating new options
    createMessage?: string; // Message to show when creating a new option
    createPlaceholder?: string; // Placeholder text for the create input
    customOptionPrefix?: string; // Prefix for custom option values
    description?: string; // Additional description text for the field
    disabled?: boolean; // Optional property to disable the field
    placeholder?: string; // Placeholder text for input fields
    advancedOnly?: boolean; // Add property to mark fields that only appear in advanced mode
}

// Add a button configuration interface
export interface FormButton {
    key: string;
    text: string;
    variant?: string;
    type?: 'submit' | 'button';
    position?: 'left' | 'right';
    onClick?: (formData: Record<string, string>) => void;
}

export interface FormConfig {
    // ...existing properties...
    submitButtonText: string;
    buttons?: FormButton[]; // Add optional array of buttons
    fields: FormField[]; // Add fields property
    translations: Record<string, any>; // Add translations property if not already present
    onSubmit: (formData: Record<string, string>) => Promise<string>;
    formData: Record<string, string>;
    onChange: (name: string, value: string) => void;
    formType?: string;
    title?: string;
    // ...other existing properties...
}

interface ModelFormProps {
    title: string;
    submitButtonText: string;
    fields: FormField[];
    translations: Record<string, Record<string, string>>;
    onSubmit: (data: Record<string, string>) => Promise<string>;
    formData?: Record<string, string>;
    onChange?: (name: string, value: string) => void;
    buttons?: FormButton[];
    isLoading?: boolean;
    showAdvanced?: boolean;
    validateVisibleFieldsOnly?: boolean; // Add this new prop
}

const ModelForm = ({
    title,
    submitButtonText,
    fields,
    translations,
    onSubmit,
    formData = {},
    onChange,
    buttons = [],
    isLoading = false,
    showAdvanced = false,
    validateVisibleFieldsOnly = false // Default to false to maintain backward compatibility
}: ModelFormProps) => {
    // Use Zustand store directly
    const { currentLocale, currentTheme } = useAppStore();
    const [validated, setValidated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
    const [hoveredButtons, setHoveredButtons] = useState<Record<string, boolean>>({});
    const locale = currentLocale || 'en';
    const theme = currentTheme;
    const t = translations[locale as keyof typeof translations];

    // Initialize form values from props or default
    const [formValues, setFormValues] = useState<Record<string, string>>(formData || {});

    // Add useEffect to reset validation when showAdvanced changes
    useEffect(() => {
        // Reset validation state when toggling between basic and advanced modes
        if (validated) {
            setValidated(false);
            setResultMessage(null);
        }
    }, [showAdvanced]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (onChange) {
            onChange(name, value);
        }
    };

    // Helper function to determine if a field should be visible based on current state
    const isFieldVisible = (field: FormField): boolean => {
        // If the field is marked as advanced-only and we're not in advanced mode, hide it
        if (field.advancedOnly && !showAdvanced) {
            return false;
        }
        
        // Add other visibility conditions as needed
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        
        // Custom validation that respects validateVisibleFieldsOnly
        let formIsValid = true;
        
        if (validateVisibleFieldsOnly) {
            // When validateVisibleFieldsOnly is true, only check visible fields
            const visibleRequiredFields = fields.filter(field => 
                field.required && isFieldVisible(field) && field.type !== 'sectionHeader' && field.type !== 'empty'
            );
            
            for (const field of visibleRequiredFields) {
                const value = formData[field.name];
                if (!value || value.trim() === '') {
                    formIsValid = false;
                    break;
                }
            }
        } else {
            // Default browser validation behavior
            formIsValid = form.checkValidity();
        }

        if (!formIsValid) {

            // Log which fields failed validation
            const invalidFields = Array.from(form.elements)
                .filter((element: any) => !element.checkValidity() && element.name)
                .map((element: any) => element.name);

            e.stopPropagation();
            setValidated(true);

            // Show a generic error message
            setResultMessage({
                type: 'danger',
                text: 'Please check the form for errors and try again.'
            });
            console.log(invalidFields, 'invalidFields');

            return;
        }
        
        setValidated(true);
        setIsSubmitting(true);

        try {
            // The onSubmit function should return a success message
            const message = await onSubmit(formData);
            setResultMessage({
                type: 'success',
                text: message
            });
        } catch (error) {
            console.error("Form submission error:", error);
            
            // Enhanced error handling for backend connectivity issues
            let errorMessage = error instanceof Error ? error.message : 'An error occurred';
            
            // Check for connectivity-related errors
            if (errorMessage.includes('unreachable') || 
                errorMessage.includes('network')) {
                
                errorMessage = 'The server could not be reached. Please check your connection and try again later.';
            } 
            // Check for undefined property errors (which might indicate a JSON parsing issue)
            else if (errorMessage.includes('Cannot read properties of undefined')) {
                console.error('Possible JSON parsing issue or unexpected response format:', error);
                errorMessage = 'There was an issue processing the server response. Please contact support if this persists.';
                
                // Log additional debugging information
                if (error instanceof Error && error.stack) {
                    console.debug('Error stack:', error.stack);
                }
            }
            
            setResultMessage({
                type: 'danger',
                text: errorMessage
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle custom button clicks
    const handleButtonClick = (button: FormButton) => {
        if (button.onClick) {
            button.onClick(formData);
        }
    };

    // Handle button hover state
    const handleButtonMouseEnter = (buttonKey: string) => {
        setHoveredButtons(prev => ({ ...prev, [buttonKey]: true }));
    };

    const handleButtonMouseLeave = (buttonKey: string) => {
        setHoveredButtons(prev => ({ ...prev, [buttonKey]: false }));
    };

    // Enhanced rendering for form fields with better validation feedback
    const renderFields = () => {
        // Group fields by row
        const rows: FormField[][] = [];
        let currentRow: FormField[] = [];
        let currentRowSpan = 0;

        // Only include fields that should be visible based on current state
        const visibleFields = fields.filter(field => isFieldVisible(field));

        visibleFields.forEach(field => {
            const span = field.colSpan || 6;
            if (currentRowSpan + span > 12) {
                rows.push([...currentRow]);
                currentRow = [field];
                currentRowSpan = span;
            } else {
                currentRow.push(field);
                currentRowSpan += span;
            }
        });

        if (currentRow.length > 0) {
            rows.push(currentRow);
        }

        return rows.map((row, rowIndex) => (
            <Row className="mb-3" key={`row-${rowIndex}`}>
                {row.map(field => {
                    const fieldKey = `field-${field.name}`;
                    const colSpan = field.colSpan || 6;

                    // Handle section headers
                    if (field.type === 'sectionHeader') {
                        // If collapsible, render with toggle controls
                        if (field.collapsible) {
                            // Use custom title if provided, otherwise generate from section name
                            const titleKey = field.customTitle || `${field.name.replace('Header', '')}Configuration`;

                            // Get the title text, possibly with highlighting
                            const titleText = field.searchHighlight
                                ? <span dangerouslySetInnerHTML={{ __html: field.searchHighlight }} />
                                : t[titleKey] || field.name;

                            return (
                                <Col md={colSpan} key={fieldKey}>
                                    <div
                                        className={`collapsible-section-header d-flex align-items-center justify-content-between ${field.expanded ? 'expanded' : ''} ${theme.name}-theme`}
                                        onClick={field.onToggle}
                                    >
                                        <h4>
                                            {titleText}
                                        </h4>
                                        <span className="section-toggle-icon">
                                            <i className="bi bi-chevron-down"></i>
                                        </span>
                                    </div>
                                </Col>
                            );
                        }

                        // Regular non-collapsible section header
                        const titleKey = field.customTitle || `${field.name.replace('Header', '')}Configuration`;
                        return (
                            <Col md={colSpan} key={fieldKey}>
                                <h4 className="mt-4 mb-3 border-bottom pb-2">
                                    {t[titleKey] || field.name}
                                </h4>
                            </Col>
                        );
                    }

                    const placeholderKey = `select${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
                    const placeholderText = t[placeholderKey] || `Select ${field.name}`;
                    const fieldLabel = field.searchHighlight
                        ? <span dangerouslySetInnerHTML={{ __html: field.searchHighlight }} />
                        : t[`${field.name}Label`];

                    return (
                        <Form.Group as={Col} md={colSpan} controlId={field.type === 'checkbox' ? undefined : field.name} key={fieldKey}>
                            {/* Only show label at Form.Group level if not checkbox and not hidden */}
                            {field.type !== 'checkbox' && !field.hideLabel && (
                                <Form.Label className="d-flex align-items-center">
                                    <span>{fieldLabel}</span>
                                    {field.required && <span className="text-danger"> *</span>}
                                    
                                    {/* Add tooltip icon if description exists */}
                                    {field.description && (
                                        <div className={`ms-2 description-tooltip position-relative ${
                                            field.required && (!formData[field.name] || formData[field.name] === '') 
                                            ? 'required-missing' : ''}`}>
                                            <i className={`bi ${!t[field.description] ? 'bi-exclamation-triangle text-warning' : 'bi-info-circle text-muted'}`}
                                               style={{ fontSize: '0.9rem', cursor: 'help' }}></i>
                                            <div className="tooltip-content">
                                                {t[field.description] || 
                                                  <div className="missing-translation">
                                                    <span className="text-warning">Missing translation:</span> {field.description}
                                                  </div>
                                                }
                                            </div>
                                        </div>
                                    )}
                                </Form.Label>
                            )}

                            {field.type === 'empty' ? (
                                // Empty field - just a placeholder div with no content
                                <div className="empty-field" style={{ height: field.customTitle ? field.customTitle : '38px' }}></div>
                            ) : field.type === 'checkbox' ? (
                                <CheckboxField
                                    name={field.name}
                                    label={t[`${field.name}Label`] || field.name}
                                    value={formData[field.name] || field.defaultValue || 'false'}
                                    onChange={onChange ?? (() => {})}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    disabled={field.disabled}
                                    descriptionText={field.description ? t[field.description] : undefined}
                                />
                            ) : field.type === 'toggle' ? (
                                <ToggleField
                                    name={field.name}
                                    value={formData[field.name] || field.defaultValue || 'false'}
                                    onChange={onChange ?? (() => {})}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    noLabel={true}
                                />
                            ) : field.type === 'multiSelect' ? (
                                <MultiSelectField
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    placeholder={t[`${field.name}Placeholder`]}
                                    options={field.options?.map(option => ({
                                        value: option.value,
                                        label: option.directLabel || (option.label ? t[option.label] : option.value)
                                    })) || []}
                                    onChange={onChange ?? (() => {})}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    noLabel={true}
                                />
                            ) : field.type === 'searchableSelect' ? (
                                <SearchableSelectField
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    placeholder={field.createPlaceholder ? t[field.createPlaceholder] : placeholderText}
                                    options={field.options?.map(option => ({
                                        value: option.value,
                                        label: option.directLabel || (option.label ? t[option.label] : option.value)
                                    })) || []}
                                    onChange={onChange ?? (() => {})}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    noLabel={true}
                                    // Pass through all creatable props
                                    creatable={field.creatable}
                                    createMessage={field.createMessage ? t[field.createMessage] : field.createMessage}
                                    createPlaceholder={field.createPlaceholder ? t[field.createPlaceholder] : field.createPlaceholder}
                                    customOptionPrefix={field.customOptionPrefix}
                                    description={field.description ? t[field.description] : ""}  // Use the translated description
                                />
                            ) : field.type === 'select' ? (
                                <DropDown
                                    required={field.required !== false}
                                    name={field.name}
                                    value={formData[field.name] || field.defaultValue || ''}
                                    onChange={onChange ?? (() => {})}
                                    options={[
                                        { value: '', label: t[`select${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`] },
                                        ...(field.options?.map(option => ({
                                            value: option.value,
                                            label: option.directLabel || t[option.label!]
                                        })) || [])
                                    ]}
                                    placeholder={t[`${field.name}Placeholder`]}
                                    theme={theme}
                                    formData={formData}
                                    field={{
                                        ...field,
                                        options: field.options ? [...field.options].map(opt => ({
                                            value: opt.value,
                                            label: opt.label,
                                            directLabel: opt.directLabel
                                        })) : []
                                    }}
                                    handleChange={handleChange}
                                    t={t}
                                    validated={validated} // Pass validation state to dropdown
                                />
                            ) : field.type === 'number' ? (
                                <>
                                    <Form.Control
                                        type="number"
                                        name={field.name}
                                        value={formData[field.name] || field.defaultValue || ''}
                                        onChange={handleChange}
                                        placeholder={t[`${field.name}Placeholder`]}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step || 1}
                                        required={field.required !== false}
                                    />
                                    <Form.Text className="text-muted">
                                        {/* Only show range info, not the description */}
                                        {field.min !== undefined && field.max !== undefined ?
                                            `Valid range: ${field.min} - ${field.max}` : ''}
                                    </Form.Text>
                                    <Form.Control.Feedback type="invalid">
                                        {t[`${field.name}Error`] ||
                                            `Please enter a valid value ${field.min !== undefined ?
                                                `(minimum: ${field.min}${field.max !== undefined ? `, maximum: ${field.max}` : ''})` :
                                                field.max !== undefined ? `(maximum: ${field.max})` : ''}`}
                                    </Form.Control.Feedback>
                                </>
                            ) : field.type === 'range' ? (
                                <div className="range-field-container">
                                    <Form.Control
                                        type="range"
                                        name={field.name}
                                        value={formData[field.name] || field.min || 0}
                                        onChange={handleChange}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step || 1}
                                        className="form-range"
                                        required={field.required !== false}
                                    />
                                    <div className="range-value">
                                        {formData[field.name] || field.min || 0}
                                    </div>
                                </div>
                            ) : (
                                // Text field
                                <TextField
                                    name={field.name}
                                    label="" // Empty label since we show it in the Form.Group
                                    value={formData[field.name] || ''}
                                    placeholder={t[`${field.name}Placeholder`]}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    onChange={onChange ?? (() => {})}
                                    noLabel={true} // Add a prop to hide the label in the TextField component
                                    description="" // Don't show description text in the component
                                />
                            )}
                        </Form.Group>
                    );
                })}
            </Row>
        ));
    };

    // Modify validation logic to respect validateVisibleFieldsOnly
    const validateForm = useCallback(() => {
        const errors: Record<string, string> = {};
        
        fields.forEach(field => {
            // Skip validation for fields that aren't supposed to be validated yet
            if (validateVisibleFieldsOnly && field.required && !isFieldVisible(field)) {
                return;
            }
            
            // Standard validation logic for required fields
            if (field.required && (!formValues[field.name] || formValues[field.name].trim() === '')) {
                errors[field.name] = locale === 'zh' ? '此字段是必需的' : 'This field is required';
            }

            // ...existing validation logic...
        });
        
        return errors;
    }, [fields, formValues, locale, validateVisibleFieldsOnly]);

    // In the component's render function, add this debugging code
    return (
        <main className={`model-form-container ${theme.name}-theme`}>
            <Card className={`model-form-card ${theme.name}-theme`}>
                <Card.Header className={`model-form-header ${theme.name}-theme`}>
                    {title ? t[title] : ''}
                </Card.Header>
                <Card.Body>
                    {resultMessage && (
                        <Alert variant={resultMessage.type} dismissible onClose={() => setResultMessage(null)}>
                            {resultMessage.text}
                        </Alert>
                    )}

                    <Form noValidate validated={validated} onSubmit={handleSubmit}>
                        {renderFields()}

                        <div className="model-form-buttons">
                            <div className="left-buttons">
                                {buttons.filter(btn => btn.position === 'left').map(button => (
                                    <Button
                                        key={button.key}
                                        variant={button.variant || 'secondary'}
                                        type={button.type || 'button'}
                                        className={`me-2 ${theme.name}-theme ${hoveredButtons[button.key] ? 'hovered' : ''} ${button.variant || 'secondary'}`}
                                        onClick={() => handleButtonClick(button)}
                                        onMouseEnter={() => handleButtonMouseEnter(button.key)}
                                        onMouseLeave={() => handleButtonMouseLeave(button.key)}
                                    >
                                        {t[button.text] || button.text}
                                    </Button>
                                ))}
                            </div>

                            <div className="right-buttons">
                                {buttons.filter(btn => btn.position !== 'left').map(button => (
                                    <Button
                                        key={button.key}
                                        variant={button.variant || 'secondary'}
                                        type={button.type || 'button'}
                                        className={`me-2 ${theme.name}-theme ${hoveredButtons[button.key] ? 'hovered' : ''} ${button.variant || 'secondary'}`}
                                        onClick={() => handleButtonClick(button)}
                                        onMouseEnter={() => handleButtonMouseEnter(button.key)}
                                        onMouseLeave={() => handleButtonMouseLeave(button.key)}
                                    >
                                        {t[button.text] || button.text}
                                    </Button>
                                ))}

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSubmitting}
                                    className={`submit-button ${theme.name}-theme ${hoveredButtons['submit'] ? 'hovered' : ''}`}
                                    onMouseEnter={() => handleButtonMouseEnter('submit')}
                                    onMouseLeave={() => handleButtonMouseLeave('submit')}
                                >
                                    {isSubmitting ? t.submitting : t[submitButtonText]}
                                </Button>
                            </div>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </main>
    );
};

export default ModelForm;
