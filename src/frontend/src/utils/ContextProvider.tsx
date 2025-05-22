import { useCallback, useState, useEffect } from "react";
import { Context, defaultState, TrainFormData, EvaluateFormData } from "./context";
import { lightTheme, darkTheme } from "../themes/theme";

export const ContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Initialize state with values from localStorage if available
  const [state, setState] = useState(() => {
    const savedState = localStorage.getItem('appState');
    const savedTrainData = localStorage.getItem('trainFormData');
    const savedEvaluateData = localStorage.getItem('evaluateFormData');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      // Merge with default state to ensure all properties exist
      return {
        ...defaultState,
        ...parsedState,
        currentTheme: savedTheme === 'dark' ? darkTheme : lightTheme,
        trainFormData: savedTrainData ? JSON.parse(savedTrainData) : defaultState.trainFormData,
        evaluateFormData: savedEvaluateData ? JSON.parse(savedEvaluateData) : defaultState.evaluateFormData
      };
    }
    return defaultState;
  });
  
  // Persist state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('appState', JSON.stringify({
      currentLocale: state.currentLocale,
      en: state.en,
      vi: state.vi,
      fr: state.fr,
      zh: state.zh
    }));
    
    localStorage.setItem('theme', state.currentTheme.name);
    
    if (state.trainFormData) {
      localStorage.setItem('trainFormData', JSON.stringify(state.trainFormData));
    }
    
    if (state.evaluateFormData) {
      localStorage.setItem('evaluateFormData', JSON.stringify(state.evaluateFormData));
    }
  }, [state]);

  // Add theme toggle function
  const toggleTheme = useCallback(() => {
    setState((prevState: typeof defaultState) => {
      const newTheme = prevState.currentTheme.name === 'light' ? darkTheme : lightTheme;

      interface LocaleState {
      theme: string;
      [key: string]: any;
      }

      return {
      ...prevState,
      currentTheme: newTheme,
      en: {
        ...(prevState.en as LocaleState),
        theme: newTheme.name,
      },
      vi: {
        ...(prevState.vi as LocaleState),
        theme: newTheme.name,
      },
      fr: {
        ...(prevState.fr as LocaleState),
        theme: newTheme.name,
      },
      zh: {
        ...(prevState.zh as LocaleState),
        theme: newTheme.name,
      }
      };
    });
  }, []);
  
  // Update toggle functions to modify top-level state instead of locale-specific state
  const toggleHeader = useCallback(() => {
    setState((prevState: { showHeader: any; }) => ({
      ...prevState,
      showHeader: !prevState.showHeader
    }));
  }, []);

  const toggleLeftPanel = useCallback(() => {
    setState((prevState: { showLeftPanel: any; }) => ({
      ...prevState,
      showLeftPanel: !prevState.showLeftPanel
    }));
  }, []);

  const toggleFooter = useCallback(() => {
    setState((prevState: { showFooter: any; }) => ({
      ...prevState,
      showFooter: !prevState.showFooter
    }));
  }, []);
  
  // Train form data functions
  const updateTrainFormData = useCallback((data: Partial<TrainFormData>) => {
    setState((prevState: { trainFormData: TrainFormData; }) => ({
      ...prevState,
      trainFormData: {
        ...prevState.trainFormData as TrainFormData,
        ...data
      }
    }));
  }, []);
  
  const resetTrainFormData = useCallback(() => {
    setState((prevState: typeof defaultState) => ({
      ...prevState,
      trainFormData: {
      modelName: '',
      modelPath: '',
      dataset: '',
      trainMethod: ''
      }
    }));
  }, []);
  
  // Evaluate form data functions
  const updateEvaluateFormData = useCallback((data: Partial<EvaluateFormData>) => {
    setState((prevState: { evaluateFormData: EvaluateFormData }) => ({
      ...prevState,
      evaluateFormData: {
      ...prevState.evaluateFormData as EvaluateFormData,
      ...data
      }
    }));
  }, []);
  
  const resetEvaluateFormData = useCallback(() => {
    setState((prevState: typeof defaultState) => ({
      ...prevState,
      evaluateFormData: {
      modelName: '',
      modelPath: '',
      checkpointPath: '',
      dataset: '',
      evaluateMethod: ''
      }
    }));
  }, []);
  
  return (
    <Context.Provider value={{
      state,
      setState,
      toggleHeader,
      toggleLeftPanel,
      toggleFooter,
      updateTrainFormData,
      resetTrainFormData,
      updateEvaluateFormData,
      resetEvaluateFormData,
      toggleTheme // Add the theme toggle function
    }}>
      {children}
    </Context.Provider>
  );
};