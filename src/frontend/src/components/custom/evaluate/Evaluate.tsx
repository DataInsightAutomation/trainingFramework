import React, { useMemo } from 'react';
import { EvaluateFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm from '../../shared/ModelForm/ModelForm';
import ModelConfigLayout from '../../shared/ModelConfigLayout/ModelConfigLayout';
import { translations } from './EvaluateTranslation';
import ErrorBanner from '../../shared/ErrorBanner/ErrorBanner';
import { useModelForm, processFormFields } from '../../../hooks/useModelForm';
import { createFormButtons } from '../../../utils/buttonActions';

// Define the form fields with better type consistency
const basicFields = [
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
  // Use our custom hook for form handling
  const {
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
    setIsLoading
  } = useModelForm({
    formType: 'evaluate',
    defaultValues: {
      modelName: '',
      modelPath: '',
      checkpointPath: '',
      dataset: '',
      evaluateMethod: ''
    },
    updateStoreCallback: useAppStore.getState().updateEvaluateFormData,
    getStoreData: () => useAppStore.getState().evaluateFormData,
    initialSections: {
      evaluationConfig: true
    }
  });
  
  // Get form fields based on the current state
  const currentFields = useMemo(() => {
    // Apply options to fields
    const fieldsWithOptions = JSON.parse(JSON.stringify(basicFields));
    
    if (modelOptions.length > 0) {
      fieldsWithOptions[0].options = modelOptions;
    }
    
    if (datasetOptions.length > 0) {
      fieldsWithOptions[3].options = datasetOptions;
    }
    
    // Process fields based on mode and search
    return processFormFields({
      basicFields: fieldsWithOptions,
      advancedSections: advancedFieldSections,
      expandedSections,
      toggleSection,
      formData,
      showAdvanced,
      searchQuery,
      currentLocale,
      translations
    });
  }, [
    modelOptions,
    datasetOptions,
    expandedSections,
    searchQuery,
    currentLocale,
    showAdvanced,
    formData
  ]);
  
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

  // Button actions
  const handlePreviewCommand = (data: Record<string, string>) => {
    const command = `curl -X POST http://api.example.com/evaluate \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(data, null, 2)}'`;
    
    alert(command);
    navigator.clipboard.writeText(command);
  };
  
  // Create form buttons using the shared utility
  const formButtons = useMemo(() => createFormButtons({
    formType: 'evaluate',
    previewCommand: handlePreviewCommand,
    translations,
    currentLocale,
    updateFormData: useAppStore.getState().updateEvaluateFormData
  }), [currentLocale]);

  return (
    <>
      <ErrorBanner 
        message={error}
        retryCount={showErrorBanner ? 2 : 0}
        onRetry={() => setRetryCount(prev => prev + 1)}
      />
      
      <ModelForm
        title="evaluateModel"
        submitButtonText="startEvaluation"
        buttons={formButtons}
        fields={currentFields}
        translations={translations}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleChange}
        isLoading={isLoading}
      />
    </>
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
