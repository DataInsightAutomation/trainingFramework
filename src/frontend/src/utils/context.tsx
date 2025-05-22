import { createContext } from "react";
import { Theme, lightTheme, darkTheme } from "../themes/theme";

type Locale = 'en' | 'vi' | 'fr' | 'zh';
// Update to separate UI settings from locale-specific settings
type SettingKey = 'activeKeyLeftPanel' | 'theme' | 'userName';

// Define the train form data type
export interface TrainFormData {
  modelName: string;
  modelPath: string;
  dataset: string;
  trainMethod: string;
}

// Define the evaluate form data type
export interface EvaluateFormData {
  modelName: string;
  modelPath: string;
  checkpointPath: string; // Added checkpoint path field
  dataset: string;
  evaluateMethod: string;
}

type LocaleKeyState = {
    currentLocale: Locale;
    currentTheme: Theme;
    // Move UI visibility settings to top level (language-independent)
    showHeader: boolean;
    showLeftPanel: boolean;
    showFooter: boolean;
    trainFormData?: TrainFormData;
    evaluateFormData?: EvaluateFormData; // Add evaluate form data to the state
} & {
    [locale in Locale]?: {
        [key in SettingKey]?: string | boolean;
    };
};

// Update defaultState to move UI visibility to top level
export const defaultState: LocaleKeyState = {
    currentLocale: "en" as Locale,
    currentTheme: lightTheme, // Default to light theme
    // Define UI visibility at top level
    showHeader: true,
    showLeftPanel: true,
    showFooter: true,
    trainFormData: {
        modelName: '',
        modelPath: '',
        dataset: '',
        trainMethod: ''
    },
    evaluateFormData: {
        modelName: '',
        modelPath: '',
        checkpointPath: '',
        dataset: '',
        evaluateMethod: ''
    },
    en: {
        activeKeyLeftPanel: "element1",
        theme: "light", // Keep this for backward compatibility
        userName: "",
        // Remove these from locale-specific state
    },
    vi: {
        activeKeyLeftPanel: "element1",
        theme: "light",
        userName: "",
        // Remove these from locale-specific state
    },
    fr: {
        activeKeyLeftPanel: "element1",
        theme: "light",
        userName: "",
        // Remove these from locale-specific state
    },
    zh: { // Add Chinese locale
        activeKeyLeftPanel: "element1",
        theme: "light",
        userName: "",
        // Remove these from locale-specific state
    },
};

interface ContextValue {
    state: LocaleKeyState;
    setState: React.Dispatch<React.SetStateAction<LocaleKeyState>>;
    // Add these UI toggle functions
    toggleHeader: () => void;
    toggleLeftPanel: () => void;
    toggleFooter: () => void;
    // Add functions for train form data
    updateTrainFormData: (data: Partial<TrainFormData>) => void;
    resetTrainFormData: () => void;
    // Add functions for evaluate form data
    updateEvaluateFormData: (data: Partial<EvaluateFormData>) => void;
    resetEvaluateFormData: () => void;
    toggleTheme: () => void; // Add theme toggle function
}

export const Context = createContext<ContextValue>({
    state: defaultState,
    setState: () => { },
    toggleHeader: () => {},
    toggleLeftPanel: () => {},
    toggleFooter: () => {},
    updateTrainFormData: () => {},
    resetTrainFormData: () => {},
    updateEvaluateFormData: () => {},
    resetEvaluateFormData: () => {},
    toggleTheme: () => {}, // Add theme toggle function
});