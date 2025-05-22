// <TextField
//   name={field.name}
//   label="" // Empty label since we show it in the Form.Group
//   value={formData[field.name] || ''}
//   placeholder={t[`${field.name}Placeholder`]}
//   required={field.required !== false}
//   validated={validated}
//   error={t[`${field.name}Error`]}
//   theme={theme}
//   onChange={onChange}
//   noLabel={true} // Add a prop to hide the label in the TextField component

import React from "react";
import { Form } from "react-bootstrap";
import { Theme } from "../../../../themes/theme";

// Define DropDownField type if not imported from elsewhere
export interface DropDownField {
    name: string;
    required?: boolean;
    options: Array<{ value: string; label?: string; directLabel?: string }>;
}

export interface DropDownFieldProps {
    name: string;
    value: string;
    placeholder: string;
    options: Array<{ value: string; label: string }>;
    onChange: (name: string, value: string) => void;
    required?: boolean;
    validated?: boolean;
    error?: string;
    theme: Theme;
    noLabel?: boolean;
    formData: Record<string, string>,
    field: DropDownField,
    handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void,
    t: Record<string, string>,
}
// />
export const DropDown: React.FC<DropDownFieldProps> = ({
    formData,
    field,
    handleChange,
    t,
    theme,
    validated,
    noLabel = false
}) => {
    // Determine the placeholder text
    const placeholderKey = `select${field.name.charAt(0).toUpperCase() + field.name.slice(1)}`;
    const placeholderText = t[placeholderKey] || `Select ${field.name}`;
    
    // Check if this field has an error (is empty but required and has been validated)
    const hasError = validated && !formData[field.name] && field.required !== false;
    const errorMessage = t[`${field.name}Error`] || 'This field is required';
    
    return (
        <>
            <Form.Select
                required={field.required !== false}
                name={field.name}
                value={formData[field.name] || ''}
                onChange={handleChange}
                isInvalid={hasError}
                style={{
                    backgroundColor: theme.name === 'dark' ? '#343a40' : '#fff',
                    color: formData[field.name] ? theme.colors.text : '#6c757d', // Gray color for placeholder
                    borderColor: hasError ? '#dc3545' : '#ced4da'
                }}
                className="placeholder-style"
            >
                {/* Styled placeholder option */}
                <option value="" disabled={false} style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    {placeholderText}
                </option>
                
                {/* Map the actual options */}
                {field.options?.map(option => (
                    <option 
                        key={option.value} 
                        value={option.value}
                        style={{ color: theme.colors.text, fontStyle: 'normal' }}
                    >
                        {option.directLabel || t[option.label!]}
                    </option>
                ))}
            </Form.Select>
            
            {/* Display error message if validation failed */}
            {hasError && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                    {errorMessage}
                </Form.Control.Feedback>
            )}
        </>
    );
}