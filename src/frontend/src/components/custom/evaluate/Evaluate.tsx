import React, { useMemo } from 'react';
import { EvaluateFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm from '../../shared/ModelForm/ModelForm';
import ModelConfigLayout from '../../shared/ModelConfigLayout/ModelConfigLayout';
import { translations } from './EvaluateTranslation';
import ErrorBanner from '../../shared/ErrorBanner/ErrorBanner';
import { useModelForm, processFormFields } from '../../../hooks/useModelForm';
import { createFormButtons } from '../../../utils/buttonActions';
import { evaluateService } from '../../../services/evaluateService';
import { EndPoints } from '../../../constants/endpoint';

// Define the form fields with better type consistency
const basicFields = [
  { 
    name: 'modelName', 
    type: 'searchableSelect',
    options: [], // Will be populated from API
    description: 'modelNameDescription',
    required: true
  },
  { 
    name: 'adapterPath', 
    type: 'text', 
    description: 'adapterPathDescription',
    required: false
  },
  { 
    name: 'dataset', 
    type: 'multiSelect',
    options: [], // Will be populated from API
    required: true,
    description: 'datasetDescription'
  },
  { 
    name: 'stage', 
    type: 'select',
    options: [
      { value: 'sft', directLabel: 'Supervised Fine-Tuning (SFT)' },
      { value: 'rm', directLabel: 'Reward Model' },
      { value: 'ppo', directLabel: 'PPO' },
      { value: 'dpo', directLabel: 'Direct Preference Optimization' }
    ],
    defaultValue: 'sft',
    colSpan: 6,
    required: true
  },
  { 
    name: 'outputDir', 
    type: 'text', 
    description: 'outputDirDescription',
    colSpan: 12,
  },
  { 
    name: 'token', 
    type: 'text',
    description: 'tokenDescription', 
    required: false,
    colSpan: 6
  }
];

// Advanced field sections for evaluate
const advancedFieldSections = {
  modelConfig: {
    title: 'modelConfigSection',
    fields: [
      { name: 'trust_remote_code', type: 'toggle', defaultValue: 'true' },
      { name: 'finetuning_type', type: 'select', options: [
          { value: 'lora', directLabel: 'Low-Rank Adaptation (LoRA)' },
          { value: 'qlora', directLabel: 'Quantized LoRA (QLoRA)' },
          { value: 'full', directLabel: 'Full Fine-tuning' },
        ],
        defaultValue: 'lora'
      },
      { name: 'quantization_method', type: 'select', options: [
          { value: 'bnb', directLabel: 'BitsAndBytes' },
          { value: 'gptq', directLabel: 'GPTQ' },
          { value: 'none', directLabel: 'None' },
        ],
        defaultValue: 'bnb'
      },
      { name: 'template', type: 'select', options: [
          { value: 'llama3', directLabel: 'Llama 3' },
          { value: 'mistral', directLabel: 'Mistral' },
          { value: 'chatml', directLabel: 'ChatML' },
        ],
        defaultValue: 'llama3'
      },
      { name: 'flash_attn', type: 'select', options: [
          { value: 'auto', directLabel: 'Auto' },
          { value: 'true', directLabel: 'Enabled' },
          { value: 'false', directLabel: 'Disabled' },
        ],
        defaultValue: 'auto'
      },
    ]
  },
  datasetConfig: {
    title: 'datasetConfigSection',
    fields: [
      { name: 'dataset_dir', type: 'text', defaultValue: 'data' },
      { name: 'cutoff_len', type: 'number', min: 128, max: 8192, step: 32, defaultValue: '1024' },
      { name: 'max_samples', type: 'number', min: 100, max: 100000, step: 100, defaultValue: '10000' },
      { name: 'preprocessing_num_workers', type: 'number', min: 1, max: 32, step: 1, defaultValue: '16' },
    ]
  },
  evaluationConfig: {
    title: 'evaluationConfigSection',
    fields: [
      { name: 'per_device_eval_batch_size', type: 'number', min: 1, max: 128, step: 1, defaultValue: '8' },
      { name: 'predict_with_generate', type: 'toggle', defaultValue: 'true' },
      { name: 'max_new_tokens', type: 'number', min: 1, max: 2048, step: 1, defaultValue: '512' },
      { name: 'top_p', type: 'range', min: 0.1, max: 1.0, step: 0.05, defaultValue: '0.7' },
      { name: 'temperature', type: 'range', min: 0.1, max: 2.0, step: 0.05, defaultValue: '0.95' },
    ]
  }
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
    setFormData,
    setIsLoading
  } = useModelForm({
    formType: 'evaluate',
    defaultValues: {
      modelName: '',
      adapterPath: '',
      dataset: '',
      stage: 'sft',
      outputDir: '',
      token: '',
      trust_remote_code: 'true',
      finetuning_type: 'lora',
      quantization_method: 'bnb',
      template: 'llama3',
      flash_attn: 'auto',
      dataset_dir: 'data',
      cutoff_len: '1024',
      max_samples: '10000',
      preprocessing_num_workers: '16',
      per_device_eval_batch_size: '8',
      predict_with_generate: 'true',
      max_new_tokens: '512',
      top_p: '0.7',
      temperature: '0.95',
    },
    updateStoreCallback: useAppStore.getState().updateEvaluateFormData,
    getStoreData: () => useAppStore.getState().evaluateFormData,
    initialSections: {
      modelConfig: true,
      datasetConfig: true,
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
      fieldsWithOptions[2].options = datasetOptions;
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
  
  // Helper functions for validation and request preparation
  const validateForm = (data: Record<string, string>): string[] => {
    const issues = [];
    
    if (!data.modelName) issues.push("Model name is required");
    // if (!data.adapterPath) issues.push("Adapter path is required");
    if (!data.dataset) issues.push("Dataset is required");
    if (!data.stage) issues.push("Stage is required");
    
    return issues;
  };
  
  const prepareRequestData = (data: Record<string, string>, isAdvanced: boolean) => {
    // Convert dataset string to array
    const datasets = data.dataset.split(',').map(d => d.trim()).filter(d => d);
    
    // Basic fields
    const requestData: any = {
      model_name_or_path: data.modelName,
      adapter_name_or_path: data.adapterPath,
      stage: data.stage,
      eval_dataset: datasets.join(','),
      output_dir: data.outputDir || generateOutputDir(data),
    };
    
    // Add token if provided
    if (data.token) {
      requestData.hub_token = data.token;
    }
    
    // Add advanced fields if in advanced mode
    if (isAdvanced) {
      // Map fields from form data to request data
      Object.entries(advancedFieldSections).forEach(([_, section]) => {
        section.fields.forEach(field => {
          const fieldName = field.name;
          if (data[fieldName]) {
            // Convert boolean strings to actual booleans
            if (data[fieldName] === 'true' || data[fieldName] === 'false') {
              requestData[fieldName] = data[fieldName] === 'true';
            } 
            // Convert numeric strings to numbers
            else if (!isNaN(Number(data[fieldName]))) {
              requestData[fieldName] = data[fieldName].includes('.') 
                ? parseFloat(data[fieldName]) 
                : parseInt(data[fieldName], 10);
            }
            // Keep strings as is
            else {
              requestData[fieldName] = data[fieldName];
            }
          }
        });
      });
    }
    
    return requestData;
  };
  
  const generateOutputDir = (data: Record<string, string>) => {
    const modelShortName = data.modelName.split('/').pop() || 'model';
    const finetuningType = data.finetuning_type || 'lora';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    return `saves/${modelShortName}/${finetuningType}/eval_${timestamp}`;
  };
  
  // Form submission handler
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      // Validate form data
      const validationIssues = validateForm(data);
      if (validationIssues.length > 0) {
        throw new Error(`Validation failed: ${validationIssues.join(', ')}`);
      }
      
      setIsLoading(true);
      console.log('Evaluation submitted:', data);
      
      // Prepare request data based on form fields
      const requestData = prepareRequestData(data, showAdvanced);
      console.log('Sending evaluation request with data:', requestData);
      
      // Make API call using the evaluate service
      const response = await evaluateService.startEvaluation(requestData, showAdvanced);
      
      // Store job ID for status checking
      const jobId = response.job_id;
      if (jobId) {
        localStorage.setItem('lastEvaluationJobId', jobId);
      }
      
      // Return success message to display in alert
      const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
      return `${translations[locale].evaluationStarted} "${data.modelName}" (Job ID: ${jobId || 'unknown'})`;
    } catch (error) {
      console.error('Evaluation submission failed:', error);
      throw new Error(typeof error === 'string' ? error : 'Failed to start evaluation. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Button actions
  const handlePreviewCommand = (data: Record<string, string>) => {
    const requestData = prepareRequestData(data, showAdvanced);
    const command = `curl -X POST ${EndPoints.evaluate} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(requestData, null, 2)}'`;
    
    alert(command);
    navigator.clipboard.writeText(command);
  };
  
  // Check status handler
  const handleCheckStatus = async () => {
    const jobId = localStorage.getItem('lastEvaluationJobId');
    if (!jobId) {
      alert(translations[currentLocale].noRecentJob);
      return;
    }

    try {
      setIsLoading(true);
      
      // Call the API to get evaluation status
      const response = await evaluateService.getEvaluationStatus(jobId);
      
      // Show status to the user
      const status = response.status || "UNKNOWN";
      alert(`Evaluation status for job ${jobId}: ${status}`);
    } catch (error) {
      console.error('Failed to get evaluation status:', error);
      alert('Failed to retrieve evaluation status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Create form buttons using the shared utility
  const formButtons = useMemo(() => createFormButtons({
    formType: 'evaluate',
    previewCommand: handlePreviewCommand,
    checkStatus: handleCheckStatus,
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
