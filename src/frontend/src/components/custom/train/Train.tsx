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
      // Add quantization settings for QLoRA support
      { 
        name: 'quantization_bit', 
        type: 'select', 
        options: [
          { value: '', directLabel: 'No Quantization (Full Precision)' },
          { value: '4', directLabel: '4-bit Quantization (QLoRA)' },
          { value: '8', directLabel: '8-bit Quantization' }
        ],
        defaultValue: '',
        description: 'quantizationDescription'
      },
    ]
  },
  finetuningConfig: {
    title: 'finetuningConfigSection',
    fields: [
      // Correct finetuning_type options per LLaMA-Factory docs
      {
        name: 'finetuning_type',
        type: 'select',
        required: true,
        options: [
          { value: 'lora', directLabel: 'LoRA - Low-Rank Adaptation (recommended)' },
          { value: 'freeze', directLabel: 'Freeze - Only train specific layers' },
          { value: 'full', directLabel: 'Full - Train all parameters (resource intensive)' }
        ],
        description: 'finetuningTypeDescription',
        defaultValue: 'lora'
      },
      // Add lora_rank to advanced settings
      { name: 'lora_rank', type: 'number', min: 1, max: 64, step: 1, defaultValue: '8', description: 'loraRankDescription' },
      { name: 'lora_target', type: 'text', defaultValue: 'all', description: 'loraTargetDescription' },
      { name: 'lora_alpha', type: 'number', min: 1, max: 128, step: 1, defaultValue: '16', description: 'loraAlphaDescription' },
      { name: 'lora_dropout', type: 'number', min: 0, max: 0.5, step: 0.01, defaultValue: '0.0', description: 'loraDropoutDescription' },
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
      // Dataset configuration override section
      {
        name: 'dataset_auto_config',
        type: 'toggle',
        defaultValue: 'true',
        description: 'dataset_auto_configDescription',
        required: false
      },
      {
        name: 'dataset_ranking_override',
        type: 'select',
        options: [
          { value: 'auto', directLabel: 'Auto-detect based on stage (recommended)' },
          { value: 'true', directLabel: 'Force ranking=True (for RM training)' },
          { value: 'false', directLabel: 'Force ranking=False (for SFT/DPO/PPO training)' }
        ],
        defaultValue: 'auto',
        description: 'dataset_ranking_overrideDescription',
        required: false,
        dependsOn: 'dataset_auto_config',
        showWhen: 'false' // Only show when auto-config is disabled
      },
      // Custom column mapping for advanced users
      {
        name: 'custom_column_mapping',
        type: 'toggle',
        defaultValue: 'false',
        description: 'custom_column_mappingDescription',
        required: false
      },
      {
        name: 'prompt_column',
        type: 'text',
        defaultValue: 'instruction',
        description: 'prompt_columnDescription',
        placeholder: 'prompt_columnPlaceholder',
        required: false,
        dependsOn: 'custom_column_mapping',
        showWhen: 'true'
      },
      {
        name: 'query_column',
        type: 'text',
        defaultValue: 'input',
        description: 'query_columnDescription',
        placeholder: 'query_columnPlaceholder',
        required: false,
        dependsOn: 'custom_column_mapping',
        showWhen: 'true'
      },
      {
        name: 'chosen_column',
        type: 'text',
        defaultValue: 'chosen',
        description: 'chosen_columnDescription',
        placeholder: 'chosen_columnPlaceholder',
        required: false,
        dependsOn: 'custom_column_mapping',
        showWhen: 'true'
      },
      {
        name: 'rejected_column',
        type: 'text',
        defaultValue: 'rejected',
        description: 'rejected_columnDescription',
        placeholder: 'rejected_columnPlaceholder',
        required: false,
        dependsOn: 'custom_column_mapping',
        showWhen: 'true'
      },
      {
        name: 'response_column',
        type: 'text',
        defaultValue: 'output',
        description: 'response_columnDescription',
        placeholder: 'response_columnPlaceholder',
        required: false,
        dependsOn: 'custom_column_mapping',
        showWhen: 'true'
      },
      {
        name: 'cutoff_len',
        type: 'number',
        min: 128,
        max: 8192,
        step: 32
      },
      {
        name: 'max_samples',
        type: 'number',
        min: 100,
        max: 100000,
        step: 100,
        defaultValue: 1000,
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
    creatable: true,
    createMessage: 'addCustomModel',
    createPlaceholder: 'enterCustomModelName',
    customOptionPrefix: 'custom',
    description: 'modelNameDescription',
    required: true,
  },
  {
    name: 'modelPath',
    type: 'text',
    required: false,
    description: 'modelPathDescription',
  },
  {
    name: 'dataset',
    type: 'multiSelect',
    options: [], // Will be populated from API
    required: true,
    description: 'datasetDescription',
  },
  // Stage - what you want to accomplish (maps directly to LLaMA-Factory)
  {
    name: 'stage',
    type: 'searchableSelect',
    options: [
      { value: 'sft', directLabel: 'Supervised Fine-Tuning (SFT) - Train on instruction/chat datasets' },
      { value: 'pt', directLabel: 'Continued Pretraining (PT) - Train on raw text data' },
      { value: 'rm', directLabel: 'Reward Model (RM) - Train on comparison/ranking datasets' },
      { value: 'ppo', directLabel: 'PPO - Reinforcement learning (requires trained reward model)' },
      { value: 'dpo', directLabel: 'DPO - Direct preference optimization on RLHF datasets' },
      { value: 'kto', directLabel: 'KTO - Kahneman-Tversky optimization on preference data' },
      { value: 'orpo', directLabel: 'ORPO - Odds ratio preference optimization' }
    ],
    colSpan: 6,
    description: 'stageDescription', 
    required: true,
    defaultValue: 'sft'
  },
  // Finetuning method - how to modify the model (all stages support all methods)
  {
    name: 'finetuning_method',
    type: 'select',
    options: [
      { value: 'lora', directLabel: 'LoRA - Low-Rank Adaptation (recommended)' },
      { value: 'qlora', directLabel: 'QLoRA - Quantized LoRA (memory efficient)' },
      { value: 'freeze', directLabel: 'Freeze - Only train specific layers' },
      { value: 'full', directLabel: 'Full - Train all parameters (resource intensive)' }
    ],
    colSpan: 6,
    description: 'finetuningMethodDescription',
    required: true,
    defaultValue: 'lora'
  },
  {
    name: 'token',
    type: 'text',
    required: false,
    description: 'tokenDescription'
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
      stage: 'sft', // Updated: use stage instead of trainMethod
      finetuning_method: 'lora', // Updated: use finetuning_method instead of finetuning_type
      token: '',
      trust_remote_code: 'true',
      lora_rank: '8',
      lora_target: 'all',
      lora_alpha: '16', // Added missing lora_alpha
      lora_dropout: '0.0', // Added missing lora_dropout
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
      quantization_bit: '', // Added for QLoRA support
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

  // Add state to track the current stage
  const [currentStage, setCurrentStage] = useState<string>('sft');

  // Update stage when form data changes
  useEffect(() => {
    if (formData && formData.stage && formData.stage !== currentStage) {
      setCurrentStage(formData.stage);
      console.log('Training stage changed to:', formData.stage);
    }
  }, [formData?.stage]);

  // All stages support all finetuning methods
  const getFinetuningMethodOptions = (stage: string) => {
    return [
      { value: 'lora', directLabel: 'LoRA - Low-Rank Adaptation (recommended)' },
      { value: 'qlora', directLabel: 'QLoRA - Quantized LoRA (memory efficient)' },
      { value: 'freeze', directLabel: 'Freeze - Only train specific layers' },
      { value: 'full', directLabel: 'Full - Train all parameters (resource intensive)' }
    ];
  };

  // Convert UI finetuning method to LLaMA-Factory parameters
  const convertFinetuningMethod = (method: string) => {
    switch (method) {
      case 'qlora':
        return { finetuning_type: 'lora', quantization_bit: 4 };
      case 'lora':
        return { finetuning_type: 'lora', quantization_bit: null };
      case 'freeze':
        return { finetuning_type: 'freeze', quantization_bit: null };
      case 'full':
        return { finetuning_type: 'full', quantization_bit: null };
      default:
        return { finetuning_type: 'lora', quantization_bit: null };
    }
  };

  // Add dataset configuration status component
  const DatasetConfigStatus = ({ stage, datasets }: { stage: string, datasets: string[] }) => {
    if (!datasets.length) return null;
    
    const isRlhfDataset = datasets.some(d => d.toLowerCase().includes('rlhf') || d.toLowerCase().includes('preference'));
    
    return (
      <div style={{
        backgroundColor: stage === 'rm' ? '#fff3cd' : '#d1ecf1',
        border: `1px solid ${stage === 'rm' ? '#ffeaa7' : '#bee5eb'}`,
        borderRadius: '4px',
        padding: '12px',
        marginTop: '8px',
        fontSize: '0.9em'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          🔧 Auto-Configuration for {stage.toUpperCase()} Training:
        </div>
        
        {stage === 'rm' ? (
          <>
            <div>• Dataset ranking: <code>True</code> (required for reward model training)</div>
            <div>• Column mapping: <code>instruction→prompt, chosen/rejected→comparison</code></div>
            {!isRlhfDataset && (
              <div style={{ color: '#856404', marginTop: '4px' }}>
                ⚠️ This dataset may not be ideal for RM training. RLHF datasets work best.
              </div>
            )}
          </>
        ) : (
          <>
            <div>• Dataset ranking: <code>False</code> (standard for {stage} training)</div>
            <div>• Column mapping: <code>instruction→prompt, output→response</code></div>
          </>
        )}
        
        <div style={{ fontSize: '0.85em', color: '#666', marginTop: '6px' }}>
          Advanced users can override these settings in Advanced Mode.
        </div>
      </div>
    );
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

    // Get current stage for dynamic fields
    const stage = currentStage || 'sft';

    // Update finetuning_method options (all stages support all methods)
    const finetuningMethodIndex = fieldsWithOptions.findIndex(f => f.name === 'finetuning_method');
    if (finetuningMethodIndex >= 0) {
      fieldsWithOptions[finetuningMethodIndex].options = getFinetuningMethodOptions(stage);
    }

    // Add stage-specific help text and dataset suggestions
    const stageFieldIndex = fieldsWithOptions.findIndex(f => f.name === 'stage');
    if (stageFieldIndex >= 0) {
      switch (stage) {
        case 'rm':
          fieldsWithOptions[stageFieldIndex].helpText = 'Step 1 of RLHF: Train a reward model to score response quality. Works best with comparison datasets (like RLHF datasets with chosen/rejected pairs).';
          fieldsWithOptions[stageFieldIndex].warningText = 'Note: RM training requires datasets with comparison data. The system will auto-configure your selected dataset.';
          break;
        case 'ppo':
          fieldsWithOptions[stageFieldIndex].helpText = 'Step 2 of RLHF: Use reward model to improve responses. Requires a trained reward model from RM stage.';
          break;
        case 'dpo':
        case 'kto':
        case 'orpo':
          fieldsWithOptions[stageFieldIndex].helpText = 'Direct preference training without explicit reward model. Works great with RLHF/preference datasets.';
          break;
        case 'pt':
          fieldsWithOptions[stageFieldIndex].helpText = 'Continue training on raw text to expand knowledge. Use text corpus datasets.';
          break;
        case 'sft':
        default:
          fieldsWithOptions[stageFieldIndex].helpText = 'Train on supervised examples. Use instruction/chat datasets.';
      }
    }

    // Add dataset configuration status after dataset field (renamed variable)
    const datasetIndex = fieldsWithOptions.findIndex(f => f.name === 'dataset');
    if (datasetIndex >= 0) {
      if (stage === 'rm') {
        fieldsWithOptions[datasetIndex].helpText = 'For RM training: The system will auto-configure any dataset for reward model training. RLHF datasets work best.';
      }
    }

    // If not in search mode and not in advanced mode, return the basic fields
    if (!showAdvanced && !searchQuery.trim()) {
      // Add custom component AFTER JSON operations and ONLY for basic mode
      if (datasetIndex >= 0) {
        fieldsWithOptions[datasetIndex].customComponent = (
          <DatasetConfigStatus 
            stage={stage} 
            datasets={formData?.dataset ? formData.dataset.split(',').map(d => d.trim()) : []} 
          />
        );
      }
      return fieldsWithOptions;
    }

    // For advanced mode, create a copy of advanced sections
    const advancedSectionsWithStage = JSON.parse(JSON.stringify(advancedFieldSections));
    
    // Update finetuning_type options in advanced sections (correct LLaMA-Factory options)
    const finetuningField = advancedSectionsWithStage.finetuningConfig.fields.find(f => f.name === 'finetuning_type');
    if (finetuningField) {
      finetuningField.options = [
        { value: 'lora', directLabel: 'LoRA - Low-Rank Adaptation (recommended)' },
        { value: 'freeze', directLabel: 'Freeze - Only train specific layers' },
        { value: 'full', directLabel: 'Full - Train all parameters (resource intensive)' }
      ];
    }

    // Use the shared processor for search filtering and advanced mode
    const processedFields = processFormFields({
      basicFields: fieldsWithOptions,
      advancedSections: advancedSectionsWithStage,
      expandedSections,
      toggleSection,
      formData,
      showAdvanced,
      searchQuery,
      currentLocale,
      translations
    });

    // Add custom component AFTER processFormFields to avoid circular reference issues
    const datasetFieldInProcessed = processedFields.find(f => f.name === 'dataset');
    if (datasetFieldInProcessed) {
      datasetFieldInProcessed.customComponent = (
        <DatasetConfigStatus 
          stage={stage} 
          datasets={formData?.dataset ? formData.dataset.split(',').map(d => d.trim()) : []} 
        />
      );
    }

    return processedFields;
  }, [
    modelOptions,
    datasetOptions,
    expandedSections,
    searchQuery,
    currentLocale,
    currentStage,
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
    
    // Convert UI finetuning method to LLaMA-Factory parameters
    const finetuningConfig = convertFinetuningMethod(data.finetuning_method || 'lora');
    
    const requestData: any = {
      datasets,
      stage: data.stage, // Direct mapping to LLaMA-Factory stage
      finetuning_method: data.finetuning_method || 'lora', // Send UI field
      finetuning_type: finetuningConfig.finetuning_type, // Send LLaMA-Factory field
      do_train: true // Always true for training
    };
    
    // Add quantization if QLoRA is selected
    if (finetuningConfig.quantization_bit) {
      requestData.quantization_bit = finetuningConfig.quantization_bit;
    }
    
    // Add token if provided
    if (data.token) requestData.token = data.token;
    
    // Handle LoRA parameters only for LoRA-based methods
    if (finetuningConfig.finetuning_type === 'lora') {
      requestData.lora_rank = data.lora_rank 
        ? parseInt(data.lora_rank, 10) 
        : 8;
      requestData.lora_alpha = data.lora_alpha 
        ? parseInt(data.lora_alpha, 10) 
        : 16;
      requestData.lora_dropout = data.lora_dropout 
        ? parseFloat(data.lora_dropout) 
        : 0.0;
      requestData.lora_target = data.lora_target || 'all';
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
      error?.response?.data?.detail
    ) {
      const detail = error.response.data.detail;
      
      // Check for dataset ranking compatibility errors
      if (detail.includes("ranking=False but stage=") || detail.includes("ranking=True but stage=")) {
        return detail; // Return the detailed message from backend
      }
      
      // Check for the specific LLaMA-Factory dataset incompatibility error
      if (detail.includes("The dataset is not applicable in the current training stage")) {
        return "Dataset incompatible with training stage. " +
               "For RM training, use comparison/ranking datasets. " +
               "For DPO/PPO/KTO training, use preference datasets. " +
               "Try switching to DPO stage for RLHF preference datasets.";
      }
      
      return detail;
    } else if (
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
  
  // Add custom handler for field changes
  const handleFormChange = (name: string, value: string) => {
    // Special case for stage
    if (name === 'stage') {
      setCurrentStage(value);
    }

    // For ALL field types, directly update form data
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

  // Advanced dataset configuration preview
  const DatasetConfigPreview = () => {
    if (!showAdvanced || !formData?.dataset) return null;
    
    const datasets = formData.dataset.split(',').map(d => d.trim());
    const stage = formData.stage || 'sft';
    const autoConfig = formData.dataset_auto_config !== 'false';
    const customMapping = formData.custom_column_mapping === 'true';
    
    return (
      <div style={{
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <h6 style={{ marginBottom: '8px' }}>Dataset Configuration Preview:</h6>
        
        {datasets.map(dataset => (
          <div key={dataset} style={{ marginBottom: '8px', fontSize: '0.9em' }}>
            <strong>{dataset}:</strong>
            <div style={{ marginLeft: '16px' }}>
              {autoConfig ? (
                <>
                  <div>• Auto-configured for <code>{stage}</code> training</div>
                  <div>• Ranking: <code>{stage === 'rm' ? 'True' : 'False'}</code></div>
                  {!customMapping && (
                    <div>• Columns: {stage === 'rm' 
                      ? <code>instruction→prompt, chosen/rejected→comparison</code>
                      : <code>instruction→prompt, output→response</code>
                    }</div>
                  )}
                </>
              ) : (
                <>
                  <div>• Manual configuration</div>
                  <div>• Ranking: <code>{formData.dataset_ranking_override || 'auto'}</code></div>
                </>
              )}
              
              {customMapping && (
                <div>• Custom mapping: 
                  <code>{formData.prompt_column || 'instruction'}→prompt</code>,
                  {stage === 'rm' ? (
                    <> <code>{formData.chosen_column || 'chosen'}/{formData.rejected_column || 'rejected'}→comparison</code></>
                  ) : (
                    <> <code>{formData.response_column || 'output'}→response</code></>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Add the preview component to advanced mode
  const TrainWithPreview = () => (
    <>
      {showAdvanced && <DatasetConfigPreview />}
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

  return (
    <>
      <ErrorBanner
        message={error}
        retryCount={showErrorBanner ? 2 : 0}
        onRetry={() => setRetryCount(prev => prev + 1)}
      />
      <TrainWithPreview />
    </>
  );
};

const TrainWithLayout = () => (
  <ModelConfigLayout
    translations={translations}
    title="Configure Training Options"
  >
    <Train />
  </ModelConfigLayout>
);

export default TrainWithLayout;