import React from 'react';
import Form from 'react-bootstrap/Form';
import './ToggleField.scss';

interface ToggleFieldProps {
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

const ToggleField: React.FC<ToggleFieldProps> = ({
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

  return (
    <div className={`toggle-field-container ${theme.name}-theme`}>
      {!noLabel && label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </Form.Label>
      )}
      
      <div className="toggle-wrapper">
        <button 
          type="button"
          className={`toggle-switch ${isChecked ? 'active' : ''}`}
          onClick={disabled ? undefined : handleChange}
          disabled={disabled}
          aria-checked={isChecked}
          role="switch"
        >
          <div className="toggle-track">
            <div className="toggle-indicator"></div>
          </div>
        </button>
        <span className="toggle-label" onClick={disabled ? undefined : handleChange}>
          {isChecked ? 'True' : 'False'}
        </span>
      </div>
      
      {validated && error && (
        <div className="invalid-feedback d-block">{error}</div>
      )}
    </div>
  );
};

export default ToggleField;
