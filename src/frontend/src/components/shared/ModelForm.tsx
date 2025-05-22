import React, { useState, useContext } from 'react';
import { Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { Context } from '../../utils/context';
import TextField from '../core/field/text/TextField';
import SearchableSelectField from '../core/field/searchableSelect/SearchableSelectField';
import { DropDown } from '../core/field/dropdown/Dropdown';
import './ModelForm.scss'; // Import the SCSS file

export interface FormField {
    name: string;
    type: 'text' | 'select' | 'searchableSelect'; // Include searchableSelect type
    colSpan?: number;
    options?: {
        value: string;
        label?: string;
        directLabel?: string;
    }[];
    required?: boolean;
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
    const { state } = useContext(Context);
    const [validated, setValidated] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
    const [hoveredButtons, setHoveredButtons] = useState<Record<string, boolean>>({});
    const locale = state.currentLocale || 'en';
    const theme = state.currentTheme;
    const t = translations[locale as keyof typeof translations];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onChange(name, value);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;

        if (form.checkValidity() === false) {
            e.stopPropagation();
            setValidated(true);
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

    // Render form fields based on configuration
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
                    const placeholderKey = `select${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
                    const placeholderText = t[placeholderKey] || `Select ${field.name}`;
                    const fieldLabel = t[`${field.name}Label`];

                    return (
                        <Form.Group as={Col} md={colSpan} controlId={field.name} key={fieldKey}>
                            {/* Always show the label at the Form.Group level for consistency */}
                            <Form.Label>{fieldLabel}</Form.Label>

                            {field.type === 'searchableSelect' ? (
                                <SearchableSelectField
                                    name={field.name}
                                    value={formData[field.name] || ''}
                                    placeholder={placeholderText}
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
                                    field={{ ...field, options: field.options ?? [] }} 
                                    handleChange={handleChange} 
                                    t={t}
                                    validated={validated} // Pass validation state to dropdown
                                />
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

                            {/* Show error feedback for selects at the Form.Group level */}
                            {/* {field.type !== 'searchableSelect' && field.type !== 'text' && (
                                <Form.Control.Feedback type="invalid">
                                    {t[`${field.name}Error`]}
                                </Form.Control.Feedback>
                            )} */}
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
