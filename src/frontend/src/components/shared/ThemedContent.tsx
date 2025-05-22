import React, { useContext } from 'react';
import { Context } from '../../utils/context';

interface ThemedContentProps {
  children: React.ReactNode;
  className?: string;
}

const ThemedContent: React.FC<ThemedContentProps> = ({ children, className = '' }) => {
  const { state } = useContext(Context);
  const theme = state.currentTheme;

  return (
    <div 
      className={`themed-content ${className}`}
      style={{ 
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        minHeight: '100%'
      }}
    >
      {children}
    </div>
  );
};

export default ThemedContent;
