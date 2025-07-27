import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    trainFormData: Record<string, any> | null;
    evaluateFormData: EvaluateFormData;
    exportFormData: Record<string, any> | null;
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
    updateExportFormData: (data: Partial<Record<string, any>>) => void;
    toggleTheme: () => void;
    setLocale: (locale: Locale) => void;
    setActiveTab: (key: string) => void;
    fetchModels: () => Promise<void>;
}

// Initialize the theme from localStorage if available
import { getTheme } from "../themes/theme";
const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('preferredTheme');
  return getTheme(savedTheme === 'dark' ? 'dark' : 'light');
};

export const useAppStore = create(
  persist(
    (set) => ({
        // Initial state
        currentLocale: localStorage.getItem('preferredLocale') as 'en' | 'zh' | 'vi' | 'fr' || 'en',
        currentTheme: getInitialTheme(),
        showHeader: true,
        showLeftPanel: true,
        showFooter: true,
        trainFormData: null,
        evaluateFormData: {
            modelName: '',
            modelPath: '',
            checkpointPath: '',
            dataset: '',
            evaluateMethod: ''
        },
        exportFormData: null,
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
            trainFormData: state.trainFormData ? { ...state.trainFormData, ...data } : { ...data }
        })),

        updateExportFormData: (data) => set(state => ({
            exportFormData: state.exportFormData ? { ...state.exportFormData, ...data } : data
        })),

        resetTrainFormData: () => set(() => ({
            trainFormData: null
        })),

        updateEvaluateFormData: (data) => set(state => ({
            exportFormData: state.evaluateFormData ? { ...state.evaluateFormData, ...data } : data
            // evaluateFormData: { ...state.evaluateFormData, ...data }
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

        toggleTheme: () => set(state => {
            // Get the new theme name (opposite of current)
            const newThemeName = state.currentTheme.name === 'light' ? 'dark' : 'light';

            // Store theme preference in localStorage
            localStorage.setItem('preferredTheme', newThemeName);

            // Always use getTheme for consistency
            return {
                currentTheme: getTheme(newThemeName)
            };
        }),

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
    }),
    {
      name: 'app-storage',
      partialize: (state: AppState) => ({ 
        currentTheme: state.currentTheme,
        currentLocale: state.currentLocale 
      })
    }
  )
);
