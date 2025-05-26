import { create } from 'zustand';
import { Theme, lightTheme, darkTheme } from "../themes/theme";
import { TrainFormData, EvaluateFormData } from '../utils/context';

type Locale = 'en' | 'vi' | 'fr' | 'zh';
type SettingKey = 'activeKeyLeftPanel' | 'theme' | 'userName';

interface LocaleSettings {
    [key: string]: string | boolean;
}

interface AppState {
    // State
    currentLocale: Locale;
    currentTheme: Theme;
    showHeader: boolean;
    showLeftPanel: boolean;
    showFooter: boolean;
    trainFormData: TrainFormData;
    evaluateFormData: EvaluateFormData;
    activeKeyLeftPanel: string;

    // Locale-specific settings
    en: LocaleSettings;
    vi: LocaleSettings;
    fr: LocaleSettings;
    zh: LocaleSettings;

    // Add loading and error states
    loading: boolean;
    error: string | null;

    // Actions
    toggleHeader: () => void;
    toggleLeftPanel: () => void;
    toggleFooter: () => void;
    updateTrainFormData: (data: Partial<TrainFormData>) => void;
    resetTrainFormData: () => void;
    updateEvaluateFormData: (data: Partial<EvaluateFormData>) => void;
    resetEvaluateFormData: () => void;
    toggleTheme: () => void;
    setLocale: (locale: Locale) => void;
    setActiveTab: (key: string) => void;
    fetchModels: () => Promise<void>;
}

// Initial state that matches defaultState in context.tsx
export const useAppStore = create<AppState>((set, get) => ({
    currentLocale: "en",
    currentTheme: lightTheme,
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
    activeKeyLeftPanel: "train",
    en: {
        theme: "light",
        userName: "",
    },
    vi: {
        theme: "light",
        userName: "",
    },
    fr: {
        theme: "light",
        userName: "",
    },
    zh: {
        theme: "light",
        userName: "",
    },

    // Add loading and error states
    loading: false,
    error: null,

    // Actions
    toggleHeader: () => set(state => ({ showHeader: !state.showHeader })),
    toggleLeftPanel: () => set(state => ({ showLeftPanel: !state.showLeftPanel })),
    toggleFooter: () => set(state => ({ showFooter: !state.showFooter })),

    updateTrainFormData: (data) => set(state => ({
        trainFormData: { ...state.trainFormData, ...data }
    })),

    resetTrainFormData: () => set(() => ({
        trainFormData: {
            modelName: '',
            modelPath: '',
            dataset: '',
            trainMethod: ''
        }
    })),

    updateEvaluateFormData: (data) => set(state => ({
        evaluateFormData: { ...state.evaluateFormData, ...data }
    })),

    resetEvaluateFormData: () => set(() => ({
        evaluateFormData: {
            modelName: '',
            modelPath: '',
            checkpointPath: '',
            dataset: '',
            evaluateMethod: ''
        }
    })),

    toggleTheme: () => set(state => ({
        currentTheme: state.currentTheme === lightTheme ? darkTheme : lightTheme
    })),

    setLocale: (locale) => set(() => ({ currentLocale: locale })),

    setActiveTab: (key) => set({ activeKeyLeftPanel: key }),

    // Example async action
    fetchModels: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.getModels();
            set({ models: response.data, loading: false });
        } catch (error) {
            set({
                error: error instanceof Error ? error.message : 'Unknown error',
                loading: false
            });
        }
    },
}));
