import React from 'react';
import Select from 'react-select';
import { Theme } from '../../../../themes/theme';

export interface SearchableSelectFieldProps {
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
}

const SearchableSelectField: React.FC<SearchableSelectFieldProps> = ({
  name,
  value,
  placeholder,
  options,
  onChange,
  required = true,
  validated = false,
  error,
  theme,
  noLabel = false
}) => {
  // Find the selected option by its value
  const selectedOption = value 
    ? options.find(opt => opt.value === value) 
    : undefined;
  
  // Handle selection change
  const handleChange = (selected: any) => {
    onChange(name, selected?.value || '');
  };
  
  return (
    <div className={validated && !value && required ? 'is-invalid' : ''}>
      <Select
        placeholder={placeholder}
        value={selectedOption || null}
        onChange={handleChange}
        options={options}
        isClearable={true}
        classNamePrefix="react-select"
        noOptionsMessage={() => "No options available"}
        styles={{
          // Style to match Bootstrap theme
          control: (base, state) => ({
            ...base,
            borderColor: validated && !value && required ? '#dc3545' : 
                        state.isFocused ? theme.colors.primary : '#ced4da',
            boxShadow: state.isFocused ? `0 0 0 0.25rem rgba(${theme.name === 'dark' ? '255,255,255,0.1' : '13,110,253,0.25'})` : 'none',
            backgroundColor: theme.name === 'dark' ? '#343a40' : '#fff',
            '&:hover': {
              borderColor: theme.colors.primary
            }
          }),
          menu: (base) => ({
            ...base,
            backgroundColor: theme.name === 'dark' ? '#343a40' : '#fff',
            zIndex: 9999
          }),
          menuList: (base) => ({
            ...base,
            maxHeight: '200px',
          }),
          option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? theme.colors.primary : 
                            state.isFocused ? (theme.name === 'dark' ? '#495057' : '#e9ecef') : 'transparent',
            color: state.isSelected ? '#fff' : theme.colors.text,
            '&:hover': {
              backgroundColor: theme.name === 'dark' ? '#495057' : '#e9ecef',
            }
          }),
          singleValue: (base) => ({
            ...base,
            color: theme.colors.text,
            fontWeight: 400,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }),
          input: (base) => ({
            ...base,
            color: theme.colors.text
          }),
          placeholder: (base) => ({
            ...base,
            color: '#6c757d',
            marginLeft: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          })
        }}
        theme={(selectTheme) => ({
          ...selectTheme,
          colors: {
            ...selectTheme.colors,
            primary: theme.colors.primary,
            primary25: theme.name === 'dark' ? '#495057' : '#e9ecef',
            neutral0: theme.name === 'dark' ? '#343a40' : '#ffffff',
            neutral80: theme.colors.text,
          },
        })}
      />
      {validated && !value && required && (
        <div className="invalid-feedback d-block">
          {error}
        </div>
      )}
    </div>
  );
};

export default SearchableSelectField;
