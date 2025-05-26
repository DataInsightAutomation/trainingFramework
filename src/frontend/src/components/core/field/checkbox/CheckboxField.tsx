import React from 'react';
import Form from 'react-bootstrap/Form';
import './CheckboxField.scss';

interface CheckboxFieldProps {
  name: string;
  label?: string;
  value: string | boolean;
  onChange: (name: string, value: string) => void;
  required?: boolean;
  validated?: boolean;
  error?: string;
  theme: any;
  noLabel?: boolean;
  disabled?: boolean;
}

const CheckboxField: React.FC<CheckboxFieldProps> = ({
  name,
  label,
  value,
  onChange,
  required = false,
  validated = false,
  error,
  theme,
  noLabel = false,
  disabled = false
}) => {
  // Convert value to boolean
  const isChecked = value === true || value === 'true';
  
  const handleChange = () => {
    // Toggle the value and convert to string
    onChange(name, isChecked ? 'false' : 'true');
  };

  // Create a unique ID for the checkbox
  const checkboxId = `checkbox-${name}`;

  return (
    <div className={`checkbox-field-container ${theme.name}-theme`}>
      <div className="checkbox-wrapper">
        <Form.Check 
          type="checkbox"
          id={checkboxId}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="checkbox-input"
          required={required}
          // Don't use label prop here - we'll handle with separate Form.Label
          label=""
        />
        <Form.Label 
          htmlFor={checkboxId} 
          className="checkbox-label"
          // Don't use onClick on label - it will automatically trigger the checkbox
        >
          {label || (isChecked ? 'True' : 'False')}
          {required && !noLabel && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      </div>
      
      {validated && error && (
        <div className="invalid-feedback d-block">{error}</div>
      )}
    </div>
  );
};

export default CheckboxField;
