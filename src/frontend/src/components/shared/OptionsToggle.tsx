import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'react-bootstrap';
import FormSearch from './FormSearch';

interface OptionsToggleProps {
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearSearch: () => void;
  toggleText: {
    advanced: string;
    basic: string;
  };
  title: string;
  theme: string;
}

const OptionsToggle: React.FC<OptionsToggleProps> = ({
  showAdvanced,
  onToggleAdvanced,
  searchQuery,
  onSearchChange,
  onClearSearch,
  toggleText,
  title,
  theme
}) => {
  const toggleRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  
  // Add scroll event listener to detect when toggle is stuck
  useEffect(() => {
    const handleScroll = () => {
      if (toggleRef.current) {
        const { top } = toggleRef.current.getBoundingClientRect();
        setIsStuck(top === 0);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={toggleRef}
      className={`options-toggle-section mb-4 p-3 border rounded ${theme}-theme ${isStuck ? 'stuck' : ''}`}
    >
      <div className="d-flex justify-content-between align-items-center flex-wrap">
        <div className="d-flex align-items-center mb-2 mb-sm-0">
          <span className="me-3 fw-medium">{title}</span>
          <span className="toggle-divider mx-3">|</span>
          <Button 
            variant={showAdvanced ? "primary" : "outline-primary"}
            onClick={onToggleAdvanced}
            className="px-4"
          >
            {showAdvanced ? toggleText.basic : toggleText.advanced}
          </Button>
        </div>
        
        <FormSearch 
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onClearSearch={onClearSearch}
        />
      </div>
    </div>
  );
};

export default OptionsToggle;
