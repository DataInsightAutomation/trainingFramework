import { createContext } from "react";
import { Theme, lightTheme, darkTheme } from "../themes/theme";

// Keeping these types for backward compatibility
type Locale = 'en' | 'vi' | 'fr' | 'zh';
type SettingKey = 'activeKeyLeftPanel' | 'theme' | 'userName';

// Define the train form data type
export interface TrainFormData {
stage: string; // Added stage field
  modelName: string;
  modelPath: string;
  dataset: string; // This will now store comma-separated values
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
    showHeader: boolean;
    showLeftPanel: boolean;
    showFooter: boolean;
    trainFormData?: TrainFormData;
    evaluateFormData?: EvaluateFormData;
} & {
    [locale in Locale]?: {
        [key in SettingKey]?: string | boolean;
    };
};

// DEPRECATED: For backward compatibility only. Use useAppStore instead.
export const defaultState: LocaleKeyState = {
    currentLocale: "en" as Locale,
    currentTheme: lightTheme,
    showHeader: true,
    showLeftPanel: true,
    showFooter: true,
    trainFormData: {
        modelName: '',
        modelPath: '',
        dataset: '',
        trainMethod: '',
        stage: ''
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
        theme: "light",
        userName: "",
    },
    vi: {
        activeKeyLeftPanel: "element1",
        theme: "light",
        userName: "",
    },
    fr: {
        activeKeyLeftPanel: "element1",
        theme: "light",
        userName: "",
    },
    zh: {
        activeKeyLeftPanel: "element1",
        theme: "light",
        userName: "",
    },
};

// DEPRECATED: Maintain for backward compatibility
// Use the useAppStore hook from /store/appStore instead
interface ContextValue {
    state: LocaleKeyState;
    setState: React.Dispatch<React.SetStateAction<LocaleKeyState>>;
    toggleHeader: () => void;
    toggleLeftPanel: () => void;
    toggleFooter: () => void;
    updateTrainFormData: (data: Partial<TrainFormData>) => void;
    resetTrainFormData: () => void;
    updateEvaluateFormData: (data: Partial<EvaluateFormData>) => void;
    resetEvaluateFormData: () => void;
    toggleTheme: () => void;
}

// Creating a dummy context for backward compatibility
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
    toggleTheme: () => {},
});

// Add a console warning for deprecated usage
if (process.env.NODE_ENV !== 'production') {
  console.warn(
    'The Context API from utils/context.tsx is deprecated. ' +
    'Please use the useAppStore hook from store/appStore.ts instead.'
  );
}