import React, { useState, ReactNode } from 'react';
import { useAppStore } from '../../../store/appStore';
import OptionsToggle from '../OptionsToggle';
import './ModelConfigLayout.scss';

interface ModelConfigLayoutProps {
  children: ReactNode;
  title: string;
  translations: {
    en: {
      advancedOptions: string;
      basicOptions: string;
      [key: string]: string;
    };
    zh: {
      advancedOptions: string;
      basicOptions: string;
      [key: string]: string;
    };
  };
}

// Create a context to share state with children
export const ModelConfigContext = React.createContext<{
  showAdvanced: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}>({
  showAdvanced: false,
  searchQuery: '',
  setSearchQuery: () => {},
});

const ModelConfigLayout: React.FC<ModelConfigLayoutProps> = ({ 
  children, 
  title,
  translations 
}) => {
  const { currentLocale, currentTheme } = useAppStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toggle handler
  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
    setSearchQuery('');
  };
  
  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <div className="model-config-container" style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <OptionsToggle
        showAdvanced={showAdvanced}
        onToggleAdvanced={handleToggleAdvanced}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        toggleText={{
          advanced: translations[currentLocale === 'zh' ? 'zh' : 'en'].advancedOptions,
          basic: translations[currentLocale === 'zh' ? 'zh' : 'en'].basicOptions
        }}
        title={title}
        theme={currentTheme.name}
      />
      
      <ModelConfigContext.Provider value={{ 
        showAdvanced, 
        searchQuery, 
        setSearchQuery 
      }}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </ModelConfigContext.Provider>
    </div>
  );
};

export default ModelConfigLayout;
