import { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { useAppStore } from '../store/appStore';
import { resourceService } from '../services/resourceService';
import { ModelConfigContext } from '../components/shared/ModelConfigLayout/ModelConfigLayout';

/**
 * Highlights search query matches in text
 */
export const highlightMatch = (text: string, query: string) => {
  if (!query.trim() || !text) return text;

  const regex = new RegExp(`(${query.trim()})`, 'gi');
  return text.replace(regex, '<span class="search-highlight">$1</span>');
};

/**
 * Options for the useModelForm hook
 */
export interface UseModelFormOptions {
  formType: 'train' | 'evaluate' | 'export';
  defaultValues: Record<string, string>;
  updateStoreCallback?: (data: any) => void;
  getStoreData?: () => any;
  initialSections?: Record<string, boolean>;
}

/**
 * Custom hook to handle common form functionality across model configuration components
 */
export function useModelForm({
  formType,
  defaultValues,
  updateStoreCallback,
  getStoreData,
  initialSections = {}
}: UseModelFormOptions) {
  // Get context for advanced mode and search
  const { showAdvanced, searchQuery } = useContext(ModelConfigContext);
  
  // Debug context values
  console.log('useModelForm context values:', { showAdvanced, searchQuery });
  
  // State management
  const [formData, setFormData] = useState<Record<string, string>>(defaultValues);
  const [modelOptions, setModelOptions] = useState<Array<{ value: string; directLabel: string }>>([]);
  const [datasetOptions, setDatasetOptions] = useState<Array<{ value: string; directLabel: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showErrorBanner, setShowErrorBanner] = useState<boolean>(false);
  
  // Track expanded/collapsed state of sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    initialSections
  );
  
  // Get current locale from store
  const currentLocale = useAppStore(state => state.currentLocale);
  
  // Load data from store on mount only once
  useEffect(() => {
    if (!getStoreData) return;
    
    try {
      const storeData = getStoreData();
      if (storeData) {
        setFormData(prev => ({ ...prev, ...storeData }));
      }
    } catch (error) {
      console.error('Error loading data from store:', error);
    }
    // Empty dependency array means "run only on mount"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Toggle section expanded/collapsed state
  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }, []);
  
  // Handle form field changes
  const handleChange = useCallback((name: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Update store if callback provided
      if (updateStoreCallback) {
        updateStoreCallback(newData);
      }
      
      return newData;
    });
  }, [updateStoreCallback]);
  
  // Fetch models and datasets
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);
      setShowErrorBanner(false);

      try {
        // Try to fetch models with retry logic
        let modelsList = [];
        try {
          console.log('Fetching models from resource service...');
          const modelsResponse = await resourceService.getModels();
          if (modelsResponse && modelsResponse.models) {
            modelsList = modelsResponse.models.map((model: any) => ({
              value: model.id,
              directLabel: model.name
            }));
            setModelOptions(modelsList);
          }
        } catch (modelError) {
          console.error('Error fetching models:', modelError);
          // Use fallback model data
          modelsList = [
            { value: 'llama3-8b', directLabel: 'Llama 3 (8B)' },
            { value: 'llama3-70b', directLabel: 'Llama 3 (70B)' },
            { value: 'mistral-7b', directLabel: 'Mistral (7B)' },
            { value: 'mixtral-8x7b', directLabel: 'Mixtral (8x7B)' }
          ];
          setModelOptions(modelsList);
          // Show error notification but continue with fallback data
          setError('Using default model options due to API error.');
          setShowErrorBanner(true);
        }

        // Try to fetch datasets with separate try/catch to handle independently
        let datasetsList = [];
        try {
          console.log('Fetching datasets from resource service...');
          const datasetsResponse = await resourceService.getDatasets();
          if (datasetsResponse && datasetsResponse.datasets) {
            datasetsList = datasetsResponse.datasets.map((dataset: any) => ({
              value: dataset.id,
              directLabel: dataset.name
            }));
            setDatasetOptions(datasetsList);
          }
        } catch (datasetError) {
          console.error('Error fetching datasets:', datasetError);
          // Use fallback dataset data
          datasetsList = [
            { value: 'alpaca-cleaned', directLabel: 'Alpaca (Cleaned)' },
            { value: 'dolly-15k', directLabel: 'Dolly 15k' },
            { value: 'oasst1', directLabel: 'Open Assistant' },
            { value: 'platypus', directLabel: 'Platypus' }
          ];
          setDatasetOptions(datasetsList);
          // Show error notification but continue with fallback data
          setError((prev) => prev ? prev : 'Using default dataset options due to API error.');
          setShowErrorBanner(true);
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        setError('Failed to load resources. Using default options.');
        setShowErrorBanner(true);

        // Fallback to default models and datasets if all else fails
        setModelOptions([
          { value: 'llama3-8b', directLabel: 'Llama 3 (8B)' },
          { value: 'mistral-7b', directLabel: 'Mistral (7B)' },
          { value: 'gpt4', directLabel: 'GPT-4' }
        ]);

        setDatasetOptions([
          { value: 'alpaca-cleaned', directLabel: 'Alpaca (Cleaned)' },
          { value: 'dolly-15k', directLabel: 'Dolly 15k' },
          { value: 'oasst1', directLabel: 'Open Assistant' }
        ]);

        // Auto-retry logic (max 2 retries with increasing delay)
        if (retryCount < 2) {
          const retryDelay = (retryCount + 1) * 2000; // 2s, then 4s
          console.log(`Scheduling retry ${retryCount + 1} in ${retryDelay}ms`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, retryDelay);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [retryCount]);
  
  return {
    formData,
    modelOptions,
    datasetOptions,
    isLoading,
    error,
    showErrorBanner,
    expandedSections,
    showAdvanced,
    searchQuery,
    currentLocale,
    setRetryCount,
    toggleSection,
    handleChange,
    setFormData,
    setShowErrorBanner,
    setError,
    setIsLoading,
    highlightMatch
  };
}

/**
 * Process fields based on advanced mode and search query
 */
export function processFormFields({
  basicFields,
  advancedSections,
  expandedSections,
  toggleSection,
  formData,
  showAdvanced,
  searchQuery,
  currentLocale,
  translations
}: {
  basicFields: any[];
  advancedSections: Record<string, { title: string; fields: any[] }>;
  expandedSections: Record<string, boolean>;
  toggleSection: (sectionKey: string) => void;
  formData: Record<string, string>;
  showAdvanced: boolean;
  searchQuery: string;
  currentLocale: string;
  translations: any;
}) {
  // Create a deep copy of basic fields to avoid modifying the original
  const fieldsWithOptions = JSON.parse(JSON.stringify(basicFields));

  // Filter and enhance fields if there's a search query
  if (searchQuery.trim()) {
    // Apply highlighting to basic fields (both matching and non-matching)
    fieldsWithOptions.forEach((field: any) => {
      const labelKey = `${field.name}Label`;
      const locale = currentLocale === 'zh' ? 'zh' : 'en';
      const localeTranslations = translations[locale];
      // Use a type-safe access pattern to get the translation
      const label = (labelKey in localeTranslations ?
        localeTranslations[labelKey as keyof typeof localeTranslations] :
        field.name);

      // Only highlight if it's a match
      if (label.toLowerCase().includes(searchQuery.toLowerCase())) {
        field.searchHighlight = highlightMatch(label, searchQuery);
      }
    });

    // Show all basic fields when we're in basic mode
    if (!showAdvanced) {
      // In basic mode, show all basic fields but highlight matches
      return fieldsWithOptions;
    }

    // Handle advanced mode with search
    let allFields: any[] = [...fieldsWithOptions];

    // Identify which sections have any matching fields or section title matches
    const sectionsWithMatches = new Set<string>();

    Object.entries(advancedSections).forEach(([sectionKey, section]) => {
      // Check if the section title matches
      const sectionTitleKey = section.title;
      const sectionTitle = translations[currentLocale === 'zh' ? 'zh' : 'en'][sectionTitleKey] || '';

      // Check if section title matches search query
      const titleMatches = sectionTitle.toLowerCase().includes(searchQuery.toLowerCase());

      // Check if any field in this section matches
      const hasMatchingField = section.fields.some(field => {
        const labelKey = `${field.name}Label`;
        const locale = currentLocale === 'zh' ? 'zh' : 'en';
        const localeTranslations = translations[locale];
        const label = (labelKey in localeTranslations ?
          localeTranslations[labelKey as keyof typeof localeTranslations] :
          field.name);
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      });

      // Add to matches if either title or any field matches
      if (titleMatches || hasMatchingField) {
        sectionsWithMatches.add(sectionKey);
      }
    });

    // Add advanced field sections, keeping entire sections intact for matches
    Object.entries(advancedSections).forEach(([sectionKey, section]) => {
      // Only add sections that have a matching title or fields
      if (sectionsWithMatches.has(sectionKey)) {
        // Get the section title
        const sectionTitleKey = section.title;
        const sectionTitle = translations[currentLocale === 'zh' ? 'zh' : 'en'][sectionTitleKey] || '';

        // Check if section title matches search query
        const titleMatches = sectionTitle.toLowerCase().includes(searchQuery.toLowerCase());

        // Create section header with highlighted title if it matches
        const sectionHeader: any = {
          name: `${sectionKey}Header`,
          type: 'sectionHeader',
          colSpan: 12,
          collapsible: true,
          expanded: true, // Always expand sections with matches
          onToggle: () => toggleSection(sectionKey),
          customTitle: section.title
        };

        // Add highlighting to section title if it matches
        if (titleMatches) {
          sectionHeader.searchHighlight = highlightMatch(sectionTitle, searchQuery);
        }

        // Add the section header
        allFields.push(sectionHeader);

        // Add ALL fields in this section, not just matches
        section.fields.forEach(field => {
          const labelKey = `${field.name}Label`;
          const locale = currentLocale === 'zh' ? 'zh' : 'en';
          const localeTranslations = translations[locale];

          // Get translated label, safely
          let label = field.name;
          if (labelKey in localeTranslations) {
            // @ts-ignore - We know this key exists from the check above
            label = localeTranslations[labelKey];
          }

          // Create a clean copy of the field
          const enhancedField = {
            ...field, // Copy all properties directly
          };

          // Only add highlight if it matches
          if (label.toLowerCase().includes(searchQuery.toLowerCase())) {
            enhancedField.searchHighlight = highlightMatch(label, searchQuery);
          }

          allFields.push(enhancedField);
        });
      }
    });

    return allFields;
  }

  // Regular non-search behavior
  if (!showAdvanced) {
    return fieldsWithOptions;
  }

  // Regular advanced mode without search
  let allFields = [...fieldsWithOptions];

  // Add all advanced field sections
  Object.entries(advancedSections).forEach(([sectionKey, section]) => {
    // Add collapsible section header with custom title
    allFields.push({
      name: `${sectionKey}Header`,
      type: 'sectionHeader',
      colSpan: 12,
      collapsible: true,
      expanded: expandedSections[sectionKey],
      onToggle: () => toggleSection(sectionKey),
      customTitle: section.title
    });

    // Only add fields if section is expanded
    if (expandedSections[sectionKey]) {
      allFields.push(...section.fields);
    }
  });

  return allFields;
}
