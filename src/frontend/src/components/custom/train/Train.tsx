import React, { useState, useEffect, useMemo, useContext } from 'react';
import { TrainFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm from '../../shared/ModelForm/ModelForm';
import { EndPoints } from '#constants/endpoint';
import { trainingService } from '#services/trainingService';
import ModelConfigLayout, { ModelConfigContext } from '../../shared/ModelConfigLayout/ModelConfigLayout';
import './Train.scss';
import { translations } from './TrainTranslation';
import ErrorBanner from '../../shared/ErrorBanner/ErrorBanner';
import { useModelForm, processFormFields } from '../../../hooks/useModelForm';
import { createFormButtons } from '../../../utils/buttonActions';

// Advanced form field sections with custom header names
const advancedFieldSections = {
  modelConfig: {
    title: 'modelConfigSection',
    fields: [
      { name: 'trust_remote_code', type: 'toggle', defaultValue: 'true' },
      // Stage will be added dynamically
    ]
  },
  finetuningConfig: {
    title: 'finetuningConfigSection',
    fields: [
      // Add finetuning_type as the first field in this section
      {
        name: 'finetuning_type',
        type: 'select',
        required: true, // Make this field required
        options: [
          { value: 'lora', directLabel: 'Low-Rank Adaptation (LoRA) - Efficient, recommended' },
          { value: 'qlora', directLabel: 'Quantized LoRA (QLoRA) - More memory efficient' },
          { value: 'full', directLabel: 'Full Fine-tuning - Uses more resources' },
          { value: 'freeze', directLabel: 'Freeze - Only train specific layers' }
        ],
        description: 'Choose how model parameters will be updated. LoRA is usually the best choice.',
        defaultValue: 'lora'
      },
      // Add lora_rank back to advanced settings
      { name: 'lora_rank', type: 'number', min: 1, max: 64, step: 1, defaultValue: '8', description: 'Higher rank = more parameters = better quality but slower training' },
      { name: 'lora_target', type: 'text', defaultValue: 'all', description: 'Which model components to apply LoRA to (default: all)' },
      {
        name: 'template', type: 'select', options: [
          { value: 'llama3', directLabel: 'Llama 3' },
          { value: 'mistral', directLabel: 'Mistral' },
          { value: 'chatml', directLabel: 'ChatML' },
        ]
      },
    ]
  },
  datasetConfig: {
    title: 'datasetConfigSection',
    fields: [
      { name: 'cutoff_len', type: 'number', min: 128, max: 8192, step: 32 },
      {
        name: 'max_samples',
        type: 'number',
        min: 100,
        max: 100000,
        step: 100,
        required: false // Explicitly mark as not required
      },
      { name: 'overwrite_cache', type: 'toggle', defaultValue: 'false' },
      { name: 'preprocessing_num_workers', type: 'number', min: 1, max: 32, step: 1 },
    ]
  },
  trainingConfig: {
    title: 'trainingConfigSection',
    fields: [
      { name: 'per_device_train_batch_size', type: 'number', min: 1, max: 128, step: 1 },
      { name: 'gradient_accumulation_steps', type: 'number', min: 1, max: 64, step: 1 },
      { name: 'learning_rate', type: 'number', min: 0.000001, max: 0.01, step: 0.000001 },
      { name: 'num_train_epochs', type: 'number', min: 0.1, max: 10, step: 0.1 },
      {
        name: 'lr_scheduler_type', type: 'select', options: [
          { value: 'cosine', directLabel: 'Cosine' },
          { value: 'linear', directLabel: 'Linear' },
          { value: 'constant', directLabel: 'Constant' },
        ]
      },
      { name: 'warmup_ratio', type: 'range', min: 0, max: 0.5, step: 0.01 },
      { name: 'bf16', type: 'checkbox', defaultValue: 'true', required: false }, // Changed from toggle to checkbox
    ]
  },
  outputConfig: {
    title: 'outputConfigSection',
    fields: [
      { name: 'output_dir', type: 'text', required: false },
      { name: 'logging_steps', type: 'number', min: 1, max: 1000, step: 1 },
      { name: 'save_steps', type: 'number', min: 10, max: 10000, step: 10 },
      { name: 'plot_loss', type: 'toggle', defaultValue: 'true' },
      { name: 'overwrite_output_dir', type: 'toggle', defaultValue: 'true' },
    ]
  },
};

// Define the basic form fields structure
const basicFields = [
  {
    name: 'modelName',
    type: 'searchableSelect',
    options: [], // Will be populated from API
    creatable: true, // Allow creating custom options
    createMessage: 'addCustomModel', // Translation key for "Add custom model: {input}"
    createPlaceholder: 'enterCustomModelName', // Translation key for placeholder
    customOptionPrefix: 'custom', // Prefix for custom option values
    description: 'modelNameDescription', // Add a description explaining custom model input
    required: true, // Make this field required
  },
  {
    name: 'modelPath',
    type: 'text',
    required: false // Make this field optional
  },
  {
    name: 'dataset',
    type: 'multiSelect',
    options: [], // Will be populated from API
    required: true
  },
  // Training method and stage will be positioned right after dataset
  {
    name: 'trainMethod',
    type: 'searchableSelect',
    options: [
      { value: 'supervised', label: 'supervisedFineTuning', directLabel: 'Supervised Fine-Tuning (SFT)' },
      { value: 'rlhf', label: 'rlhfTraining', directLabel: 'Reinforcement Learning from Human Feedback (RLHF)' },
      { value: 'distillation', label: 'distillation', directLabel: 'Knowledge Distillation' }
    ],
    colSpan: 6, // Half width
    description: 'trainMethodDescription', // Add a description field
    required: true, // Make this field required

  },
  {
    name: 'token',
    type: 'text',
    required: false,
    description: 'tokenDescription' // Add a translation key for the description
  }
];

// Add this debugging function to help identify field rendering issues
const DebugComponent = ({ formFields }: { formFields: any[] }) => {
  useEffect(() => {
    console.log('Form fields to render:', formFields);
    const finetuningField = formFields.find(f => f.name === 'finetuning_type');
    console.log('Finetuning type field:', finetuningField);
  }, [formFields]);

  return null;
};

// Updated helper component with a more compact table format
const TrainingOptionsHelp = () => {
  return (
    <div className="training-options-help" style={{
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '5px',
      marginBottom: '20px'
    }}>
      <h5>Understanding Training Options:</h5>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <p>Below are the available training methods and their configurations:</p>

        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          marginBottom: '15px',
          border: '1px solid #dee2e6'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#e9ecef' }}>
              <th style={{ padding: '8px', border: '1px solid #dee2e6', width: '30%' }}>Method</th>
              <th style={{ padding: '8px', border: '1px solid #dee2e6', width: '30%' }}>Stage Choices</th>
              <th style={{ padding: '8px', border: '1px solid #dee2e6', width: '40%' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                <strong>Supervised Fine-Tuning (SFT)</strong>
              </td>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                <code>sft</code> (automatic)
              </td>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                Direct supervision with labeled data
              </td>
            </tr>

            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                <strong>RLHF</strong><br />
                <span style={{ fontSize: '0.9em', color: '#6c757d' }}>
                  (Reinforcement Learning from Human Feedback)
                </span>
              </td>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                <code>rm</code>, <code>ppo</code>, <code>dpo</code>, <code>orpo</code>, <code>kto</code>
              </td>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                Multi-stage process: typically start with Reward Model (<code>rm</code>)
                training, then use preference optimization (<code>ppo</code> or <code>dpo</code>)
              </td>
            </tr>

            <tr>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                <strong>Knowledge Distillation</strong>
              </td>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                <code>sft</code> (automatic)
              </td>
              <td style={{ padding: '8px', border: '1px solid #dee2e6' }}>
                Like SFT, but uses a teacher model's outputs as training targets
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ marginTop: '10px' }}>
          <p><strong>Finetuning Type Options:</strong> All methods support these finetuning approaches:</p>
          <ul style={{ margin: '5px 0' }}>
            <li><strong>LoRA</strong> - Low-Rank Adaptation (efficient, recommended)</li>
            <li><strong>QLoRA</strong> - Quantized LoRA (more memory efficient)</li>
            <li><strong>Full</strong> - Full parameter fine-tuning (resource intensive)</li>
            <li><strong>Freeze</strong> - Only train specific layers</li>
          </ul>
        </div>

        <div style={{
          backgroundColor: '#e2f0ff',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #b8daff',
          marginTop: '10px'
        }}>
          <strong>Key points:</strong>
          <ul style={{ marginBottom: '5px', marginTop: '5px' }}>
            <li>For SFT and Knowledge Distillation, stage is automatically set</li>
            <li>For RLHF, you must select a specific stage (starting with <code>rm</code> is typical)</li>
            <li>Advanced settings like LoRA rank can be configured in Advanced Mode</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const getFinetuningTypeOptions = () => {
  return [
    { value: 'lora', directLabel: 'Low-Rank Adaptation (LoRA) - Efficient, recommended' },
    { value: 'qlora', directLabel: 'Quantized LoRA (QLoRA) - More memory efficient' },
    { value: 'full', directLabel: 'Full Fine-tuning - Uses more resources' },
    { value: 'freeze', directLabel: 'Freeze - Only train specific layers' }
  ];
};

const Train = () => {
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
    setShowErrorBanner,
    setError,
    setIsLoading
  } = useModelForm({
    formType: 'train',
    defaultValues: {
      modelName: '',
      modelPath: '',
      dataset: '',
      trainMethod: 'supervised',
      finetuning_type: 'lora',
      token: '',
      trust_remote_code: 'true',
      stage: 'sft',
      lora_rank: '8',
      lora_target: 'all',
      template: 'llama3',
      cutoff_len: '2048',
      max_samples: '',
      overwrite_cache: 'false',
      preprocessing_num_workers: '4',
      per_device_train_batch_size: '1',
      gradient_accumulation_steps: '8',
      learning_rate: '0.0001',
      num_train_epochs: '1.0',
      lr_scheduler_type: 'cosine',
      warmup_ratio: '0.1',
      bf16: 'true',
      output_dir: '',
      logging_steps: '10',
      save_steps: '500',
      plot_loss: 'true',
      overwrite_output_dir: 'true',
    },
    updateStoreCallback: useAppStore.getState().updateTrainFormData,
    getStoreData: () => useAppStore.getState().trainFormData,
    initialSections: {
      modelConfig: true,
      finetuningConfig: true,
      datasetConfig: true,
      trainingConfig: true,
      outputConfig: true
    }
  });

  // Add state to track the current training method
  const [currentTrainMethod, setCurrentTrainMethod] = useState<string>('supervised');

  // Update train method when form data changes
  useEffect(() => {
    if (formData && formData.trainMethod && formData.trainMethod !== currentTrainMethod) {
      setCurrentTrainMethod(formData.trainMethod);
      console.log('Training method changed to:', formData.trainMethod);
    }
  }, [formData?.trainMethod]); // Only depend on trainMethod, not the entire formData object

  // Updated function to get stage options based on training method
  const getStageOptions = (method: string) => {
    if (method === 'rlhf') {
      return [
        { value: 'rm', directLabel: 'Reward Model Training (First Stage)' },
        { value: 'ppo', directLabel: 'PPO Optimization (Second Stage)' },
        { value: 'dpo', directLabel: 'Direct Preference Optimization' },
        { value: 'orpo', directLabel: 'ORPO (Optimization Reinforced)' },
        { value: 'kto', directLabel: 'KTO (Knowledge Transfer)' }
      ];
    } else {
      return [
        { value: 'sft', directLabel: 'Supervised Fine-Tuning (SFT)' }
      ];
    }
  };

  // Get form fields using the shared processor
  const currentFields = useMemo(() => {
    // Create a deep copy of basic fields to avoid modifying the original
    const fieldsWithOptions = JSON.parse(JSON.stringify(basicFields));

    // Apply the current options to the fields
    if (modelOptions.length > 0) {
      fieldsWithOptions[0].options = modelOptions;
    }

    if (datasetOptions.length > 0) {
      fieldsWithOptions[2].options = datasetOptions;
    }

    // Get current train method for dynamic fields
    const method = currentTrainMethod || 'supervised';

    // Handle basic mode special fields
    if (!showAdvanced) {
      // Find index of trainMethod field to position stage field after it
      const trainMethodIndex = fieldsWithOptions.findIndex((f: { name: string; }) => f.name === 'trainMethod');

      if (trainMethodIndex >= 0) {
        // Insert the stage field right after trainMethod
        fieldsWithOptions.splice(trainMethodIndex + 1, 0, {
          name: 'stage',
          type: 'select',
          options: getStageOptions(method),
          description: 'Select which training stage to perform.',
          required: true, // Mark as required to show asterisk
          defaultValue: method === 'rlhf' ? 'rm' : 'sft',
          colSpan: 6 // Half width to align with trainMethod
        });

        // Add finetuning_type after stage
        fieldsWithOptions.splice(trainMethodIndex + 2, 0, {
          name: 'finetuning_type',
          type: 'select',
          options: getFinetuningTypeOptions(),
          description: 'Choose how model parameters will be updated.',
          defaultValue: formData.finetuning_type || 'lora',
          colSpan: 6,
          required: true // Make this field required
        });

        // Find token field and move it after finetuning_type if needed
        interface FormFieldOption {
          value: string;
          label?: string;
          directLabel?: string;
        }

        interface FormField {
          name: string;
          type: string;
          options?: FormFieldOption[];
          required?: boolean;
          colSpan?: number;
          description?: string;
          defaultValue?: string;
          min?: number;
          max?: number;
          step?: number;
          creatable?: boolean;
          createMessage?: string;
          createPlaceholder?: string;
          customOptionPrefix?: string;
        }

        const tokenIndex: number = fieldsWithOptions.findIndex((f: FormField) => f.name === 'token');
        if (tokenIndex > trainMethodIndex + 3) { // If token is after our newly inserted fields
          // Remove token from its current position
          const tokenField = fieldsWithOptions.splice(tokenIndex, 1)[0];
          // Set width to half
          tokenField.colSpan = 6;
          // Add it next to finetuning_type
          fieldsWithOptions.splice(trainMethodIndex + 3, 0, tokenField);
        }
      }

      // If not in search mode, return the basic fields with our custom additions
      if (!searchQuery.trim()) {
        return fieldsWithOptions;
      }
    }

    // Use the shared processor for search filtering and advanced mode
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
    currentTrainMethod,
    showAdvanced,
    formData
  ]);

  // Helper functions to make handleSubmit more readable
  
  // Validate form data
  const validateForm = (data: Record<string, string>): string[] => {
    const issues = [];
    
    if (!data.dataset) issues.push("Dataset is required");
    if (!data.modelName) issues.push("Model name is required");
    if (data.max_samples && Number(data.max_samples) < 100) {
      issues.push("Max samples must be at least 100");
    }
    
    return issues;
  };
  
  // Prepare the basic request data
  const prepareBasicRequestData = (data: Record<string, string>) => {
    const datasets = data.dataset.split(',').map(d => d.trim()).filter(d => d);
    
    const requestData: any = {
      datasets,
      train_method: data.trainMethod,
      finetuning_type: data.finetuning_type,
    };
    
    // Add token if provided
    if (data.token) requestData.token = data.token;
    
    // Handle stage based on training method
    requestData.stage = data.trainMethod === 'rlhf' && data.stage 
      ? data.stage 
      : (data.stage || 'sft');
    
    // Handle LoRA parameters
    if (data.finetuning_type === 'lora' || data.finetuning_type === 'qlora') {
      requestData.lora_rank = data.lora_rank 
        ? parseInt(data.lora_rank, 10) 
        : 8; // Default value
    }
    
    return requestData;
  };
  
  // Process model information
  const processModelInfo = (data: Record<string, string>, requestData: any) => {
    if (data.modelName && data.modelName.startsWith('custom:')) {
      const customModelName = data.modelName.replace('custom:', '');
      requestData.model_name = customModelName;
      requestData.is_custom_model = true;
      requestData.model_path = data.modelPath || customModelName;
    } else {
      requestData.model_name = data.modelName;
      requestData.model_path = data.modelPath;
      requestData.is_custom_model = false;
    }
    return requestData;
  };
  
  // Process advanced parameters when in advanced mode
  const addAdvancedParameters = (data: Record<string, string>, requestData: any) => {
    Object.entries(advancedFieldSections).forEach(([_, section]) => {
      for (const field of section.fields) {
        const fieldName = field.name;
        const value = data[fieldName];
        
        if (!value) continue;
        
        // Convert values to appropriate types
        if (value === 'true' || value === 'false') {
          requestData[fieldName] = value === 'true';
        } else if (!isNaN(Number(value))) {
          requestData[fieldName] = value.includes('.')
            ? parseFloat(value)
            : parseInt(value, 10);
        } else {
          requestData[fieldName] = value;
        }
      }
    });
    return requestData;
  };
  
  // Extract error message from API error response
  const getErrorMessage = (error: any): string => {
    if (
      typeof error === 'object' && 
      error?.response?.data?.message
    ) {
      return error.response.data.message;
    }
    return 'Failed to start training. Please try again later.';
  };

  // Refactored handleSubmit with improved readability
  const handleSubmit = async (data: Record<string, string>): Promise<string> => {
    try {
      console.log('Train form data before submission:', data);
      
      // 1. Validate the form data
      const validationIssues = validateForm(data);
      if (validationIssues.length > 0) {
        throw new Error(`Validation failed: ${validationIssues.join(', ')}`);
      }
      
      // 2. Show loading state
      setIsLoading(true);
      
      // 3. Prepare request data
      let requestData = prepareBasicRequestData(data);
      
      // 4. Process model information
      requestData = processModelInfo(data, requestData);
      
      // 5. Add advanced parameters if in advanced mode
      if (showAdvanced) {
        console.log('Advanced mode: including advanced configuration options');
        requestData = addAdvancedParameters(data, requestData);
      } else {
        console.log('Basic mode: excluding advanced configuration options');
      }
      
      // 6. Log the final request data
      console.log('Sending training request with data:', requestData);
      
      // 7. Make the API call
      const response = await trainingService.startTraining(requestData, showAdvanced);
      
      // 8. Process the response
      const jobId = response.job_id;
      if (jobId) {
        localStorage.setItem('lastTrainingJobId', jobId);
      }
      
      console.log('Training submitted successfully:', response);
      
      // 9. Return success message
      const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
      return `${translations[locale].trainingStarted} "${data.modelName}" (Job ID: ${jobId || 'unknown'})`;
      
    } catch (error) {
      console.error('Training submission failed:', error);
      throw new Error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add custom handler for field changes to manage train method changes
  const handleFormChange = (name: string, value: string) => {
    // Special case for train method to update stage as well
    if (name === 'trainMethod') {
      setCurrentTrainMethod(value);
      const newStage = value === 'rlhf' ? 'rm' : 'sft';

      // Update both values at once
      setFormData(prev => ({
        ...prev,
        trainMethod: value,
        stage: newStage
      }));
      return;
    }

    // For ALL field types, directly update form data to prevent infinite loops
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Define button actions
  const handlePreviewCurl = (data: Record<string, string>) => {
    // Generate and show curl command based on form data
    const curlCommand = `curl -X POST ${EndPoints.getPreviewCurlCommand} \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(data, null, 2)}'`;

    alert(curlCommand);
    // Optionally copy to clipboard
    navigator.clipboard.writeText(curlCommand);
  };

  // Check status handler
  const handleCheckStatus = async () => {
    const jobId = localStorage.getItem('lastTrainingJobId');
    if (!jobId) {
      alert('No recent training job found');
      return;
    }

    try {
      setIsLoading(true);

      // Call the API to get training status
      const response = await trainingService.getTrainingStatus(jobId);

      // Show status to the user
      const status = response.status || response.training_status;
      alert(`Training status for job ${jobId}: ${status}`);
    } catch (error) {
      console.error('Failed to get training status:', error);
      alert('Failed to retrieve training status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create form buttons using the shared utility
  const formButtons = useMemo(() => createFormButtons({
    formType: 'train',
    previewCommand: handlePreviewCurl,
    checkStatus: handleCheckStatus,
    translations,
    currentLocale,
    updateFormData: useAppStore.getState().updateTrainFormData
  }), [currentLocale]);

  return (
    <>
      {/* Error banner */}
      <ErrorBanner
        message={error}
        retryCount={showErrorBanner ? 2 : 0}
        onRetry={() => setRetryCount(prev => prev + 1)}
      />

      <ModelForm
        title="trainNewModel"
        submitButtonText="startTraining"
        buttons={formButtons}
        fields={currentFields}
        translations={translations}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        isLoading={isLoading}
      />
    </>
  );
};

// Create a wrapper component that includes the shared layout
const TrainWithLayout = () => (
  <ModelConfigLayout
    title="Configure Training Options"
    translations={translations}
  >
    <Train />
  </ModelConfigLayout>
);

export default TrainWithLayout;