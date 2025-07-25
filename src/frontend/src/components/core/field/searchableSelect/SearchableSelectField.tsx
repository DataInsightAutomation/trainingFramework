import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, Button, ListGroup } from 'react-bootstrap';
import { useAppStore } from '../../../../store/appStore';
import './SearchableSelectField.scss';

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  name: string;
  label?: string;
  value: string;
  placeholder?: string;
  options: Option[];
  onChange: (name: string, value: string) => void;
  required?: boolean;
  validated?: boolean;
  error?: string;
  theme: any;
  noLabel?: boolean;
  // New props for creatable select
  creatable?: boolean;
  createMessage?: string;
  createPlaceholder?: string;
  customOptionPrefix?: string;
  description?: string;
}

const SearchableSelectField: React.FC<SearchableSelectProps> = ({
  name,
  label,
  value,
  placeholder,
  options,
  onChange,
  required = false,
  validated = false,
  error,
  theme,
  noLabel = false,
  // Add creatable props with defaults
  creatable = false,
  createMessage = 'Add custom option: "{input}"',
  createPlaceholder = 'Type to search or create...',
  customOptionPrefix = 'custom',
  description
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Extract selected option or custom value
  useEffect(() => {
    if (value.startsWith(`${customOptionPrefix}:`)) {
      // For custom values, display the actual value without the prefix
      const customValue = value.substring(value.indexOf(':') + 1);
      setSelectedOption({ value, label: customValue });
    } else if (value) {
      // For regular options, find the matching option
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
    } else {
      setSelectedOption(null);
    }
  }, [value, options, customOptionPrefix]);
  
  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredOptions([...options]);
    } else {
      const filtered = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);
  
  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    onChange(name, option.value);
    setShowDropdown(false);
    setSearchTerm('');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    // Always show dropdown when typing if creatable is enabled
    if (!showDropdown) {
      setShowDropdown(true);
    }
    
    // Do NOT call onChange on every keystroke for creatable fields
    // Only update the internal searchTerm state while typing
    // The form value will be updated only when the user selects/creates an option
  };
  
  // Handle key press events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Only handle special keys if dropdown is open
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (creatable && searchTerm.trim()) {
        handleCreateOption();
      }
      setShowDropdown(false);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      // Restore the previous value on escape
      if (selectedOption) {
        setSearchTerm('');
      }
    } else if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
      // Focus the first option in the dropdown
      const firstOption = document.querySelector('.searchable-select-dropdown .list-group-item');
      if (firstOption) {
        (firstOption as HTMLElement).focus();
      }
    }
  };
  
  const handleCreateOption = () => {
    if (!searchTerm.trim()) return;
    
    const newOptionValue = `${customOptionPrefix}:${searchTerm}`;
    const newOption = { value: newOptionValue, label: searchTerm };
    
    setSelectedOption(newOption);
    onChange(name, newOptionValue);
    setShowDropdown(false);
  };
  
  // Clear button should reset everything
  const handleClear = () => {
    onChange(name, '');
    setSelectedOption(null);
    setSearchTerm('');
  };
  
  // Display the label of the selected option or the custom value
  const displayValue = selectedOption ? selectedOption.label : '';
  
  return (
    <div ref={containerRef} className={`searchable-select-container ${theme.name}-theme`}>
      {!noLabel && label && (
        <Form.Label>
          {label}
          {required && <span className="text-danger">*</span>}
        </Form.Label>
      )}
      
      <InputGroup className={validated && required && !value ? 'is-invalid' : ''}>
        <Form.Control
          type="text"
          placeholder={placeholder || (creatable ? createPlaceholder : 'Search...')}
          value={showDropdown ? searchTerm : displayValue}
          onChange={handleInputChange}
          onClick={() => {
            setShowDropdown(true);
            if (!creatable) { // Only clear search term if not creatable
              setSearchTerm('');
            }
          }}
          onBlur={() => {
            // For creatable fields, commit the searchTerm as a custom value when losing focus
            if (creatable && searchTerm.trim() && searchTerm !== displayValue) {
              const newOptionValue = `${customOptionPrefix}:${searchTerm}`;
              const newOption = { value: newOptionValue, label: searchTerm };
              setSelectedOption(newOption);
              onChange(name, newOptionValue);
            }
            // Close dropdown after a short delay to allow clicks on dropdown items
            setTimeout(() => setShowDropdown(false), 150);
          }}
          onKeyDown={handleKeyDown}
          required={required}
          className={theme.name}
          autoComplete="off" // Disable browser autocomplete
        />
        
        <Button 
          variant="outline-secondary"
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <i className={`bi bi-${showDropdown ? 'chevron-up' : 'chevron-down'}`}></i>
        </Button>
        
        {value && (
          <Button 
            variant="outline-secondary"
            onClick={handleClear}
          >
            <i className="bi bi-x"></i>
          </Button>
        )}
      </InputGroup>
      
      {validated && required && !value && (
        <div className="invalid-feedback d-block">
          {error || `Please select a ${name}`}
        </div>
      )}
      
      {showDropdown && (
        <div className={`searchable-select-dropdown ${theme.name}-theme`}>
          <ListGroup>
            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map((option, index) => (
                  <ListGroup.Item
                    key={index}
                    action
                    active={selectedOption?.value === option.value}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </ListGroup.Item>
                ))}
              </>
            ) : (
              <ListGroup.Item disabled>No options found</ListGroup.Item>
            )}
            
            {/* Custom option creation - Always show this if creatable and there's a search term */}
            {creatable && searchTerm && (
              <ListGroup.Item 
                action 
                className="create-option"
                onClick={handleCreateOption}
              >
                <i className="bi bi-plus-circle me-2"></i>
                <strong>{createMessage.replace('{input}', searchTerm)}</strong>
              </ListGroup.Item>
            )}
          </ListGroup>
        </div>
      )}
    </div>
  );
};

export default SearchableSelectField;
