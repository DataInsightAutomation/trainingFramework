import React from 'react';
import { Form } from 'react-bootstrap';
import { Theme } from '../../../../themes/theme';
import './TextField.scss';

export interface TextFieldProps {
  name: string;
  label: string;
  value: string;
  placeholder?: string;
  required?: boolean;
  validated?: boolean;
  error?: string;
  theme: Theme;
  onChange: (name: string, value: string) => void;
  noLabel?: boolean;
  description?: string; // Add description prop
}

const TextField: React.FC<TextFieldProps> = ({
  name,
  label,
  value,
  placeholder,
  required = true,
  validated = false,
  error,
  theme,
  onChange,
  noLabel = false,
  description, // Include description in destructuring
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value);
  };

  // Generate a unique class name based on the theme for custom styling
  const themeClass = `text-field-${theme.name}-theme`;

  return (
    <div className={`text-field ${themeClass}`}>
      {/* Only show the label if noLabel is false */}
      {!noLabel && label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}
      <Form.Control
        type="text"
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        required={required}
        isInvalid={validated && required && !value}
        style={{
          backgroundColor:
            theme.name === 'dark' ? '#333' : '#fff',
          color: theme.colors.text,
          borderColor: theme.colors.border,
        }}
        // Custom class for theming
        className="themed-input"
      />
      {validated && required && !value && (
        <Form.Control.Feedback type="invalid">
          {error || 'This field is required'}
        </Form.Control.Feedback>
      )}
    </div>
  );
};

export default TextField;
