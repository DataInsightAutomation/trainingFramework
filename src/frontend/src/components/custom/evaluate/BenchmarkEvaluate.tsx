import React, { useMemo } from 'react';
import { useAppStore } from '../../../store/appStore';
import ModelForm from '../../shared/ModelForm/ModelForm';
import { translations } from './EvaluateTranslation';
import ErrorBanner from '../../shared/ErrorBanner/ErrorBanner';
import { useModelForm, processFormFields } from '../../../hooks/useModelForm';
import { createFormButtons } from '../../../utils/buttonActions';
import { evaluateService } from '../../../services/evaluateService';
import { EndPoints } from '../../../constants/endpoint';

// Define benchmark evaluation fields
const benchmarkEvalFields = [
  {
    name: 'modelName',
    type: 'searchableSelect',
    options: [], // Will be populated from API
    creatable: true,
    createMessage: 'addCustomModel',
    createPlaceholder: 'enterCustomModelName',
    customOptionPrefix: 'custom',
    description: 'modelNameDescription',
    required: true,
  },
  {
    name: 'task',
    type: 'text',
    required: true,
    description: 'taskDescription',
    placeholder: 'e.g., mmlu, ceval, or custom dataset name',
  },
  {
    name: 'datasetSubset',
    type: 'text',
    required: true,
    description: 'datasetSubsetDescription',
    placeholder: 'dataset module, value, default:default',
  },
  {
    name: 'task_dir',
    type: 'text',
    required: true,
    placeholder: 'e.g., evaluation or huggingface/repo',
    defaultValue: 'evaluation',
    description: 'taskDirDescription',
  },
  {
    name: 'save_dir',
    type: 'text',
    description: 'saveDirDescription',
    placeholder: 'e.g., mmlu_results',
  },
  {
    name: 'template',
    type: 'select',
    options: [
      { value: 'fewshot', directLabel: 'Few-Shot' },
      { value: 'llama3', directLabel: 'Llama 3' },
      { value: 'mistral', directLabel: 'Mistral' },
      { value: 'chatml', directLabel: 'ChatML' }
    ],
    defaultValue: 'fewshot',
    description: 'templateDescription',
  },
  {
    name: 'token',
    type: 'text',
    description: 'tokenDescription',
    required: false,
    colSpan: 6,
    label: 'tokenLabel'
  }
];

// Advanced field sections for benchmark evaluation
const benchmarkAdvancedSections = {
  benchmarkConfig: {
    title: 'benchmarkConfigSection',
    fields: [
      { 
        name: 'n_shot', 
        type: 'number', 
        min: 0, 
        max: 10, 
        step: 1, 
        defaultValue: '5', 
        description: 'nShotDescription',
        label: 'n_shotLabel'  // Changed from nShotLabel to n_shotLabel to match field name
      },
      { 
        name: 'lang', 
        type: 'select', 
        options: [
          { value: 'en', directLabel: 'English' },
          { value: 'zh', directLabel: 'Chinese' }
        ],
        defaultValue: 'en',
        description: 'langDescription',
        label: 'langLabel'
      },
      { 
        name: 'batch_size', 
        type: 'number', 
        min: 1, 
        max: 64, 
        step: 1, 
        defaultValue: '4', 
        description: 'batchSizeDescription',
        label: 'batch_sizeLabel'  // Changed from batchSizeLabel to batch_sizeLabel to match field name
      },
      { 
        name: 'seed', 
        type: 'number', 
        min: 0, 
        max: 10000, 
        step: 1, 
        defaultValue: '42', 
        description: 'seedDescription',
        label: 'seedLabel'
      }
    ]
  },
  modelConfig: {
    title: 'modelConfigSection', // This should match a key in your translations file
    fields: [
      { 
        name: 'trust_remote_code', 
        type: 'toggle', 
        defaultValue: 'true', 
        description: 'trustRemoteCodeDescription',
        label: 'trustRemoteCodeLabel'
      }
    ]
  }
};

const BenchmarkEvaluate = () => {
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
      task: 'mmlu_test',
      task_dir: 'evaluation',
      save_dir: '',
      template: 'fewshot',
      n_shot: '5',
      lang: 'en',
      batch_size: '4',
      seed: '42',
      trust_remote_code: 'true'
    },
    updateStoreCallback: useAppStore.getState().updateEvaluateFormData,
    getStoreData: () => useAppStore.getState().evaluateFormData,
    initialSections: {
      benchmarkConfig: true,
      modelConfig: true
    }
  });

  // Get form fields based on the current state
  const currentFields = useMemo(() => {
    // Apply options to fields
    const fieldsWithOptions = JSON.parse(JSON.stringify(benchmarkEvalFields));

    if (modelOptions.length > 0) {
      fieldsWithOptions[0].options = modelOptions;
    }

    // Process fields based on mode and search
    return processFormFields({
      basicFields: fieldsWithOptions,
      advancedSections: benchmarkAdvancedSections,
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
    expandedSections,
    searchQuery,
    currentLocale,
    showAdvanced,
    formData,
    toggleSection
  ]);

  // Helper functions for validation and request preparation
  const validateForm = (data: Record<string, string>): string[] => {
    const issues = [];

    if (!data.modelName) issues.push("Model name is required");
    if (!data.task) issues.push("Task is required");

    return issues;
  };

  const prepareRequestData = (data: Record<string, string>, isAdvanced: boolean) => {
    // Combine dataset name and split to create the task parameter
    
    const requestData: any = {
      evaluation_type: 'benchmark',
      model_name_or_path: data.modelName,
      task: data.task + data.datasetSubset || 'default', // Ensure task is formatted correctly
      task_dir: data.task_dir,
      save_dir: data.save_dir || generateBenchmarkSaveDir(data),
      template: data.template,
      hub_token: data.token,
    };

    // Add other benchmark-specific fields if in advanced mode
    if (isAdvanced) {
      if (data.n_shot) requestData.n_shot = parseInt(data.n_shot, 10);
      if (data.lang) requestData.lang = data.lang;
      if (data.batch_size) requestData.batch_size = parseInt(data.batch_size, 10);
      if (data.seed) requestData.seed = parseInt(data.seed, 10);
      if (data.trust_remote_code) requestData.trust_remote_code = data.trust_remote_code === 'true';
    }

    return requestData;
  };

  const generateBenchmarkSaveDir = (data: Record<string, string>) => {
    const modelShortName = data.modelName.split('/').pop() || 'model';
    const dataset = data.task || 'benchmark';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    
    return `${dataset}_results_${modelShortName}_${timestamp}`;
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
      console.log('Benchmark evaluation submitted:', data);

      // Prepare request data based on form fields
      const processModelInfo = (data: Record<string, string>, requestData: any) => {
        if (data.modelName && data.modelName.startsWith('custom:')) {
          const customModelName = data.modelName.replace('custom:', '');
          requestData.model_name_or_path = customModelName;
          requestData.is_custom_model = true;
          requestData.model_path = data.modelPath || customModelName;
        } else {
          requestData.model_name_or_path = data.modelName;
          requestData.model_path = data.modelPath;
          requestData.is_custom_model = false;
        }
        return requestData;
      };
      
      // Format the task value correctly for the backend
      // The backend expects task to be in format: dataset_split
      // For example: mmlu_test, mmlu-custom-small_test
      let requestData = prepareRequestData(data, showAdvanced);
      
      // Make sure the task name is formatted correctly with _test suffix
      if (!requestData.task.includes('_')) {
        requestData.task = `${requestData.task}_test`;
      }
      
      requestData = processModelInfo(data, requestData);

      console.log('Sending benchmark request with data:', requestData);

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
      console.error('Benchmark submission failed:', error);
      throw new Error(typeof error === 'string' ? error : 'Failed to start benchmark evaluation. Please try again later.');
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
      const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
      alert(translations[locale].noRecentJob);
      return;
    }

    try {
      setIsLoading(true);

      // Call the API to get evaluation status
      const response = await evaluateService.getEvaluationStatus(jobId);

      // Show status to the user
      const status = response.status || "UNKNOWN";
      alert(`Benchmark status for job ${jobId}: ${status}`);
    } catch (error) {
      console.error('Failed to get benchmark status:', error);
      alert('Failed to retrieve benchmark status. Please try again later.');
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
        title="benchmarkModel"
        submitButtonText="startBenchmark"
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

export default BenchmarkEvaluate;
