import React from 'react';
import { InputGroup, Form, Button } from 'react-bootstrap';

interface FormSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  placeholder?: string;
}

const FormSearch: React.FC<FormSearchProps> = ({ 
  searchQuery, 
  onSearchChange, 
  onClearSearch,
  placeholder = "Search fields..." 
}) => {
  return (
    <div className="search-container">
      <InputGroup>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={onSearchChange}
        />
        <InputGroup.Text>
          <i className="bi bi-search"></i>
        </InputGroup.Text>
        {searchQuery && (
          <Button 
            variant="outline-secondary" 
            onClick={onClearSearch}
          >
            <i className="bi bi-x"></i>
          </Button>
        )}
      </InputGroup>
    </div>
  );
};

export default FormSearch;
