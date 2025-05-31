import React, { useState, useEffect, useMemo, useContext } from 'react';
import { EvaluateFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm/ModelForm';
import { resourceService } from '../../../services/resourceService';
import ModelConfigLayout, { ModelConfigContext } from '../../shared/ModelConfigLayout/ModelConfigLayout';
import { translations } from './EvaluateTranslation';

// Define the form fields with better type consistency
const evaluateFields: FormField[] = [
  { 
    name: 'modelName', 
    type: 'searchableSelect',
    options: [] // Will be populated from API
  },
  { name: 'modelPath', type: 'text' },
  { name: 'checkpointPath', type: 'text', colSpan: 12 },
  { 
    name: 'dataset', 
    type: 'multiSelect',
    options: [], // Will be populated from API
    required: true
  },
  { 
    name: 'evaluateMethod', 
    type: 'select',
    options: [
      { value: 'accuracy', label: 'accuracy' },
      { value: 'f1', label: 'f1Score' },
      { value: 'precision', label: 'precision' },
      { value: 'recall', label: 'recall' },
      { value: 'bleu', label: 'bleu' }
    ]
  }
];

// Advanced field sections for evaluate
const advancedFieldSections = {
  evaluationConfig: {
    title: 'evaluationConfigSection',
    fields: [
      // Add your advanced evaluation fields here
      { name: 'metric_type', type: 'select', options: [
          { value: 'accuracy', directLabel: 'Accuracy' },
          { value: 'f1', directLabel: 'F1 Score' },
          { value: 'precision', directLabel: 'Precision' },
        ]
      },
      // Add more fields as needed
    ]
  },
  // Add more sections as needed
};

const Evaluate = () => {
  // Use the shared context for advanced mode and search
  const { showAdvanced, searchQuery } = useContext(ModelConfigContext);
  
  // Use Zustand store directly
  const { evaluateFormData, currentLocale, updateEvaluateFormData } = useAppStore();
  const formData: EvaluateFormData = evaluateFormData || {
    modelName: '',
    modelPath: '',
    checkpointPath: '',
    dataset: '',
    evaluateMethod: ''
  };

  const [modelOptions, setModelOptions] = useState<{value: string, directLabel: string}[]>([]);
  const [datasetOptions, setDatasetOptions] = useState<{value: string, directLabel: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    evaluationConfig: true,
    // Add more sections as needed
  });
  
  // Toggle section expanded/collapsed state
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  
  // Function to highlight matches (from shared code)
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };
  
  // Load models and datasets from API (you may want to move this to the shared layout)
  useEffect(() => {
    // ...existing code for fetching resources...
  }, []);
  
  // Get form fields based on mode and search (similar to Train)
  const getFormFields = () => {
    // Create a deep copy of evaluate fields
    const fieldsWithOptions = JSON.parse(JSON.stringify(evaluateFields));
    
    // Apply options
    if (modelOptions.length > 0) {
      fieldsWithOptions[0].options = modelOptions;
    }
    
    if (datasetOptions.length > 0) {
      fieldsWithOptions[3].options = datasetOptions;
    }
    
    // Apply search filtering and highlighting logic
    if (searchQuery.trim()) {
      // Filter fields based on search query
      return fieldsWithOptions.filter(field => {
        const labelKey = `${field.name}Label`;
        const locale = currentLocale === 'zh' ? 'zh' : 'en';
        const label = translations[locale][labelKey] || field.name;
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      }).map(field => {
        // Add search highlighting
        const labelKey = `${field.name}Label`;
        const locale = currentLocale === 'zh' ? 'zh' : 'en';
        const label = translations[locale][labelKey] || field.name;
        
        if (label.toLowerCase().includes(searchQuery.toLowerCase())) {
          field.searchHighlight = highlightMatch(label, searchQuery);
        }
        return field;
      });
    }
    
    // When advanced mode is enabled, add advanced fields
    if (showAdvanced) {
      let allFields = [...fieldsWithOptions];
      
      // Add each section with proper handling
      Object.entries(advancedFieldSections).forEach(([sectionKey, section]) => {
        // Add section header
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
          allFields = [...allFields, ...section.fields];
        }
      });
      
      return allFields;
    }
    
    // Return basic fields by default
    return fieldsWithOptions;
  };
  
  // Form submission handler
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      setIsLoading(true);
      console.log('Evaluation submitted:', data);
      
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return success message to display in alert
      const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
      return `${translations[locale].evaluationStarted} "${data.modelName}"`;
    } catch (error) {
      console.error('Evaluation submission failed:', error);
      throw new Error('Failed to start evaluation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    updateEvaluateFormData({ [name as keyof EvaluateFormData]: value });
  };

  // Define button actions (unchanged)
  const handlePreviewCommand = (data: Record<string, string>) => {
    const command = `curl -X POST http://api.example.com/evaluate \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(data, null, 2)}'`;
    
    alert(command);
    navigator.clipboard.writeText(command);
  };
  
  const handleSaveConfig = (data: Record<string, string>) => {
    const configJson = JSON.stringify(data, null, 2);
    localStorage.setItem('evaluateConfig', configJson);
    
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'evaluate-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    const locale = (currentLocale === 'zh') ? 'zh' : 'en';
    alert(translations[locale].configSaved);
  };
  
  const handleLoadConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const config = JSON.parse(event.target?.result as string);
            updateEvaluateFormData(config);
            const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
            alert(translations[locale].configLoaded);
          } catch (error) {
            console.error('Failed to parse config file:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Form buttons (unchanged)
  const formButtons: FormButton[] = [
    {
      key: 'preview-command',
      text: 'previewCommand',
      variant: 'outline-secondary',
      position: 'left',
      onClick: handlePreviewCommand
    },
    {
      key: 'load-config',
      text: 'loadConfig',
      variant: 'outline-info',
      position: 'left',
      onClick: handleLoadConfig
    },
    {
      key: 'save-config',
      text: 'saveConfig',
      variant: 'outline-success',
      position: 'right',
      onClick: handleSaveConfig
    }
  ];

  // Calculate current fields with memoization
  const currentFields = useMemo(() => getFormFields(), [
    showAdvanced,
    modelOptions,
    datasetOptions,
    searchQuery,
    currentLocale,
    expandedSections
  ]);
  
  return (
    <ModelForm
      title="evaluateModel"
      submitButtonText="startEvaluation"
      buttons={formButtons}
      fields={currentFields}
      translations={translations}
      onSubmit={handleSubmit}
      formData={formData as unknown as Record<string, string>}
      onChange={handleChange}
    />
  );
};

// Create a wrapper component that includes the shared layout
const EvaluateWithLayout = () => (
  <ModelConfigLayout 
    title="Configure Evaluation Options"
    translations={translations}
  >
    <Evaluate />
  </ModelConfigLayout>
);

export default EvaluateWithLayout;
