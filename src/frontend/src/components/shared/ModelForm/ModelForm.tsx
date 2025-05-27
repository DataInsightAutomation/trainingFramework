import React, { useState } from 'react';
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
    name: string;
    type: 'text' | 'select' | 'searchableSelect' | 'multiSelect' | 'sectionHeader' | 'number' | 'range' | 'toggle' | 'checkbox';
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

const ModelForm: React.FC<FormConfig> = ({
    formType,
    title,
    submitButtonText,
    buttons = [], // Default to empty array
    fields,
    translations,
    onSubmit,
    formData,
    onChange,
}) => {
    // Use Zustand store directly
    const { currentLocale, currentTheme } = useAppStore();
    const [validated, setValidated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
    const [hoveredButtons, setHoveredButtons] = useState<Record<string, boolean>>({});
    const locale = currentLocale || 'en';
    const theme = currentTheme;
    const t = translations[locale as keyof typeof translations];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            
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
            setResultMessage({
                type: 'danger',
                text: error instanceof Error ? error.message : 'An error occurred'
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

        fields.forEach(field => {
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
                                        <span className="chevron-icon">
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
                            {/* Only show label at Form.Group level if not checkbox */}
                            {field.type !== 'checkbox' && (
                                <Form.Label>
                                    {fieldLabel}
                                    {field.required && <span className="text-danger"> *</span>}
                                </Form.Label>
                            )}

                            {field.type === 'checkbox' ? (
                                <CheckboxField
                                    name={field.name}
                                    label={t[`${field.name}Label`] || field.name}
                                    value={formData[field.name] || field.defaultValue || 'false'}
                                    onChange={onChange}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    disabled={field.disabled}
                                />
                            ) : field.type === 'toggle' ? (
                                <ToggleField
                                    name={field.name}
                                    value={formData[field.name] || field.defaultValue || 'false'}
                                    onChange={onChange}
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
                                    onChange={onChange}
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
                                    onChange={onChange}
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
                                    description={field.description ? t[field.description] : field.description}
                                />
                            ) : field.type === 'select' ? (
                                <DropDown
                                    required={field.required !== false}
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    onChange={onChange}
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
                                        value={formData[field.name] || ''}
                                        onChange={handleChange}
                                        placeholder={t[`${field.name}Placeholder`]}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step || 1}
                                        required={field.required !== false}
                                    />
                                    <Form.Text className="text-muted">
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
                                // Text field without label (since we handle it above)
                                <TextField
                                    name={field.name}
                                    label="" // Empty label since we show it in the Form.Group
                                    value={formData[field.name] || ''}
                                    placeholder={t[`${field.name}Placeholder`]}
                                    required={field.required !== false}
                                    validated={validated}
                                    error={t[`${field.name}Error`]}
                                    theme={theme}
                                    onChange={onChange}
                                    noLabel={true} // Add a prop to hide the label in the TextField component
                                />
                            )}
                        </Form.Group>
                    );
                })}
            </Row>
        ));
    };

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
