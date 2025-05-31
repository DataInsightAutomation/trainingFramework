import React, { useState, useEffect } from 'react';
import { Context, defaultState } from '../utils/context';
import { useAppStore } from '../store/appStore';

interface ContextBridgeProps {
  children: React.ReactNode;
}

/**
 * ContextBridge provides backward compatibility between
 * the new Zustand store and old React Context API.
 */
const ContextBridge: React.FC<ContextBridgeProps> = ({ children }) => {
  // Initialize with defaultState
  const [state, setState] = useState(defaultState);
  
  // Get all needed state and actions from Zustand
  const {
    currentLocale,
    currentTheme,
    showHeader,
    showLeftPanel,
    showFooter,
    trainFormData,
    evaluateFormData,
    toggleHeader,
    toggleLeftPanel,
    toggleFooter,
    updateTrainFormData,
    resetTrainFormData,
    updateEvaluateFormData,
    resetEvaluateFormData,
    toggleTheme
  } = useAppStore();
  
  // Sync Zustand store to Context state
  useEffect(() => {
    setState({
      ...state,
      currentLocale,
      currentTheme,
      showHeader,
      showLeftPanel,
      showFooter,
      trainFormData,
      evaluateFormData
    });
  }, [
    currentLocale,
    currentTheme,
    showHeader,
    showLeftPanel,
    showFooter,
    trainFormData,
    evaluateFormData
  ]);

  // Create context value with Zustand actions
  const contextValue = {
    state,
    setState,
    toggleHeader,
    toggleLeftPanel,
    toggleFooter,
    updateTrainFormData,
    resetTrainFormData,
    updateEvaluateFormData,
    resetEvaluateFormData,
    toggleTheme
  };

  return (
    <Context.Provider value={contextValue}>
      {children}
    </Context.Provider>
  );
};

export default ContextBridge;
