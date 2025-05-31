import React, { useState } from 'react';
import { Form, Badge, CloseButton } from 'react-bootstrap';
import './MultiSelectField.scss';

interface MultiSelectFieldProps {
  name: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (name: string, value: string) => void;
  required?: boolean;
  validated?: boolean;
  error?: string;
  theme: any;
  noLabel?: boolean;
}

const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  name,
  value,
  placeholder,
  options,
  onChange,
  required = false,
  validated = false,
  error,
  theme,
  noLabel = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customEntries, setCustomEntries] = useState<string[]>([]);
  
  // Parse the current values (comma-separated string)
  const selectedValues = value ? value.split(',').map(v => v.trim()).filter(v => v) : [];

  // Combined options (predefined + custom)
  const allOptions = [
    ...options,
    ...customEntries.map(entry => ({ value: entry, label: entry }))
  ];
  
  // Filtered options based on search term
  const filteredOptions = allOptions.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedValues.includes(option.value)
  );

  const handleSelect = (optionValue: string) => {
    const newValues = [...selectedValues, optionValue];
    onChange(name, newValues.join(','));
    setSearchTerm('');
  };

  const handleRemove = (optionValue: string) => {
    const newValues = selectedValues.filter(v => v !== optionValue);
    onChange(name, newValues.join(','));
  };

  const handleCreateNew = () => {
    if (!searchTerm || selectedValues.includes(searchTerm) || 
        allOptions.some(opt => opt.value === searchTerm)) {
      return;
    }
    
    setCustomEntries([...customEntries, searchTerm]);
    handleSelect(searchTerm);
  };

  const handleBlur = () => {
    // Small delay to allow for click events on dropdown
    setTimeout(() => setShowDropdown(false), 200);
  };

  return (
    <div className={`multi-select-field ${theme.name}-theme`}>
      <div className="selected-items-container">
        {selectedValues.map(val => {
          const option = allOptions.find(opt => opt.value === val) || { label: val };
          return (
            <Badge 
              key={val} 
              bg={theme.name === 'dark' ? 'secondary' : 'primary'} 
              className="selected-item"
            >
              {option.label}
              <CloseButton 
                variant="white" 
                className="remove-badge" 
                onClick={() => handleRemove(val)}
              />
            </Badge>
          );
        })}
      </div>

      <div className="input-container">
        <Form.Control
          type="text"
          placeholder={selectedValues.length ? '' : placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={handleBlur}
          required={required && selectedValues.length === 0}
          isInvalid={validated && required && selectedValues.length === 0}
          className={`${theme.name}-theme`}
        />

        {validated && required && selectedValues.length === 0 && (
          <Form.Control.Feedback type="invalid">
            {error}
          </Form.Control.Feedback>
        )}
      </div>

      {showDropdown && (
        <div className={`dropdown-menu show ${theme.name}-theme`}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div 
                key={option.value}
                className="dropdown-item"
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className="dropdown-item no-results">
              No matching options
            </div>
          )}
          
          {searchTerm && !filteredOptions.some(opt => opt.value === searchTerm) && (
            <div 
              className="dropdown-item create-new"
              onClick={handleCreateNew}
            >
              Create "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelectField;
