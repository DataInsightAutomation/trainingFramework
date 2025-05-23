import React from 'react';
import { useAppStore } from '../../store/appStore';

interface ThemedContentProps {
  children: React.ReactNode;
  className?: string;
}

const ThemedContent: React.FC<ThemedContentProps> = ({ children, className = '' }) => {
  // Use Zustand store directly
  const { currentTheme } = useAppStore();

  return (
    <div 
      className={`themed-content ${className}`}
      style={{ 
        backgroundColor: currentTheme.colors.background,
        color: currentTheme.colors.text,
        minHeight: '100%'
      }}
    >
      {children}
    </div>
  );
};

export default ThemedContent;
