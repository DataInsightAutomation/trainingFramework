import React, { useState, useEffect, useMemo, useContext } from 'react';
import { TrainFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm/ModelForm';
import { resourceService } from '../../../services/resourceService';
import { EndPoints } from '#constants/endpoint';
import { trainingService } from '#services/trainingService';
import ModelConfigLayout, { ModelConfigContext } from '../../shared/ModelConfigLayout/ModelConfigLayout';
import './Train.scss';
import { translations } from './TrainTranslation';
import { saveConfig, loadConfig } from '../../../utils/configUtils';

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
      { name: 'bf16', type: 'checkbox', defaultValue: 'true' }, // Changed from toggle to checkbox
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
} as const;

// Define the basic form fields structure
const basicFields: FormField[] = [
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
const DebugComponent = ({ formFields }: { formFields: FormField[] }) => {
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
  // Use the shared context for advanced mode and search
  const { showAdvanced, searchQuery } = useContext(ModelConfigContext);

  const { trainFormData, currentLocale, updateTrainFormData } = useAppStore();
  const [modelOptions, setModelOptions] = useState<{ value: string, directLabel: string }[]>([]);
  const [datasetOptions, setDatasetOptions] = useState<{ value: string, directLabel: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track expanded/collapsed state of each section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    modelConfig: true,
    finetuningConfig: true,
    datasetConfig: true,
    trainingConfig: true,
    outputConfig: true
  });

  // Add state to track the current training method
  const [currentTrainMethod, setCurrentTrainMethod] = useState<string>('supervised');

  // Add state to track API retry attempts
  const [retryCount, setRetryCount] = useState<number>(0);
  const [showErrorBanner, setShowErrorBanner] = useState<boolean>(false);

  // Toggle section expanded/collapsed state
  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  // Initialize form data with defaults for advanced options
  const defaultAdvancedData = {
    modelName: '',
    modelPath: '',
    dataset: '',
    trainMethod: 'supervised', // Default to supervised
    finetuning_type: 'lora', // Default to LoRA
    token: '', // Add default empty value for token

    // Advanced options with defaults
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
  };

  // Merge with existing form data or use defaults
  const formData = trainFormData
    ? { ...defaultAdvancedData, ...trainFormData }
    : defaultAdvancedData;

  // Function to highlight text matches in field labels
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;

    const regex = new RegExp(`(${query.trim()})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };

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

  // Dynamically build the form fields based on mode and search query
  const getFormFields = () => {
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

    // Filter and enhance fields if there's a search query
    if (searchQuery.trim()) {
      // Filter basic fields that match the search
      const filteredBasicFields = fieldsWithOptions.filter((field: FormField) => {
        const labelKey = `${field.name}Label`;
        const locale = currentLocale === 'zh' ? 'zh' : 'en';
        const localeTranslations = translations[locale];
        // Use a type-safe access pattern to get the translation
        const label = (labelKey in localeTranslations ?
          localeTranslations[labelKey as keyof typeof localeTranslations] :
          field.name);
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      });

      // Apply highlighting to basic fields (both matching and non-matching)
      fieldsWithOptions.forEach((field: FormField) => {
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
      let allFields: FormField[] = [...fieldsWithOptions];

      // Identify which sections have any matching fields or section title matches
      const sectionsWithMatches = new Set<string>();

      Object.entries(advancedFieldSections).forEach(([sectionKey, section]) => {
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
      Object.entries(advancedFieldSections).forEach(([sectionKey, section]) => {
        // Only add sections that have a matching title or fields
        if (sectionsWithMatches.has(sectionKey)) {
          // Get the section title
          const sectionTitleKey = section.title;
          const sectionTitle = translations[currentLocale === 'zh' ? 'zh' : 'en'][sectionTitleKey] || '';

          // Check if section title matches search query
          const titleMatches = sectionTitle.toLowerCase().includes(searchQuery.toLowerCase());

          // Create section header with highlighted title if it matches
          const sectionHeader: FormField = {
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
            const enhancedField: FormField = {
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
      // Find index of trainMethod field to position stage field after it
      const trainMethodIndex = fieldsWithOptions.findIndex(f => f.name === 'trainMethod');

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
        const tokenIndex = fieldsWithOptions.findIndex(f => f.name === 'token');
        if (tokenIndex > trainMethodIndex + 3) { // If token is after our newly inserted fields
          // Remove token from its current position
          const tokenField = fieldsWithOptions.splice(tokenIndex, 1)[0];
          // Set width to half
          tokenField.colSpan = 6;
          // Add it next to finetuning_type
          fieldsWithOptions.splice(trainMethodIndex + 3, 0, tokenField);
        }
      }

      return fieldsWithOptions;
    }

    // Regular advanced mode without search
    let allFields = [...fieldsWithOptions];

    // Add all advanced field sections
    Object.entries(advancedFieldSections).forEach(([sectionKey, section]) => {
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
        if (sectionKey === 'modelConfig') {
          // Add all fields except stage
          const nonStageFields = section.fields.filter(f => (f.name as string) !== 'stage');
          allFields.push(...nonStageFields);

          // Add stage with options based on training method
          allFields.push({
            name: 'stage',
            type: 'select',
            options: getStageOptions(method),
            defaultValue: method === 'rlhf' ? 'rm' : 'sft'
          });
        } else {
          allFields.push(...section.fields);
        }
      }
    });

    return allFields;
  };

  // Enhanced resource fetching with retry logic and better error handling
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
          console.log(modelsResponse, 'modelsResponse');
          console.log(modelsResponse.models, 'modelsResponse.models');
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

    // Call the function
    fetchResources();
  }, [retryCount]); // Add retryCount as dependency to trigger retries

  // Watch for changes in trainMethod and update UI accordingly
  useEffect(() => {
    if (trainFormData && trainFormData.trainMethod) {
      setCurrentTrainMethod(trainFormData.trainMethod);
      console.log('Training method changed to:', trainFormData.trainMethod);
    }
  }, [trainFormData]);

  // Handle form submission via the API
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      console.log('Train form data before submission:', data);

      // Check for any validation issues before proceeding
      const validationIssues = [];

      // Validate dataset is provided
      if (!data.dataset) {
        validationIssues.push("Dataset is required");
      }

      // Validate modelName is provided
      if (!data.modelName) {
        validationIssues.push("Model name is required");
      }

      // Validate max_samples if provided
      if (data.max_samples && Number(data.max_samples) < 100) {
        validationIssues.push("Max samples must be at least 100");
      }

      // If there are validation issues, throw an error
      if (validationIssues.length > 0) {
        throw new Error(`Validation failed: ${validationIssues.join(', ')}`);
      }

      // Show some loading state if needed
      setIsLoading(true);

      // Parse datasets into an array before sending to API
      const datasets = data.dataset.split(',').map(d => d.trim()).filter(d => d);

      // Start with basic parameters that are always included
      const requestData: any = {
        datasets: datasets,
        train_method: data.trainMethod,
        finetuning_type: data.finetuning_type, // Always include finetuning_type
      };

      // For RLHF, ensure stage is included
      if (data.trainMethod === 'rlhf' && data.stage) {
        requestData.stage = data.stage;
      }

      // Add lora_rank if present and relevant (will only be present in advanced mode now)
      if (data.lora_rank && (data.finetuning_type === 'lora' || data.finetuning_type === 'qlora')) {
        requestData.lora_rank = parseInt(data.lora_rank, 10);
      } else if ((data.finetuning_type === 'lora' || data.finetuning_type === 'qlora')) {
        // If LoRA is selected but no rank is provided, use the default value
        requestData.lora_rank = 8;
      }

      // Handle custom model inputs
      if (data.modelName && data.modelName.startsWith('custom:')) {
        // Extract the actual model name/path from the custom input
        const customModelName = data.modelName.replace('custom:', '');
        requestData.model_name = customModelName;
        requestData.is_custom_model = true;

        // If modelPath is empty but we have a custom model, we'll use the custom name as the path
        if (!data.modelPath) {
          requestData.model_path = customModelName;
        } else {
          requestData.model_path = data.modelPath;
        }
      } else {
        // Regular model selection
        requestData.model_name = data.modelName;
        requestData.model_path = data.modelPath;
        requestData.is_custom_model = false;
      }

      // Add advanced parameters only when advanced mode is enabled
      if (showAdvanced) {
        console.log('Advanced mode: including advanced configuration options');
        // Process each advanced section's fields
        Object.entries(advancedFieldSections).forEach(([sectionKey, section]) => {
          for (const field of section.fields) {
            const fieldName = field.name;
            const value = data[fieldName];

            if (value) {
              // Convert boolean strings to actual booleans
              if (value === 'true' || value === 'false') {
                requestData[fieldName] = value === 'true';
              }
              // Convert numeric strings to numbers
              else if (!isNaN(Number(value))) {
                // Check if it needs to be an integer or float
                if (value.includes('.')) {
                  requestData[fieldName] = parseFloat(value);
                } else {
                  requestData[fieldName] = parseInt(value, 10);
                }
              }
              // Keep strings as is
              else {
                requestData[fieldName] = value;
              }
            }
          }
        });
      } else {
        console.log('Basic mode: excluding advanced configuration options');
      }

      console.log('Sending training request with data:', requestData);

      // Call the API endpoint with the prepared data, passing showAdvanced flag
      const response = await trainingService.startTraining(requestData, showAdvanced);

      // Get the job ID from the response
      const jobId = response.job_id;

      // Save the job ID for later status checking
      if (jobId) {
        localStorage.setItem('lastTrainingJobId', jobId);
      }

      console.log('Training submitted successfully:', response);

      // Return a success message for the form
      const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
      return `${translations[locale].trainingStarted} "${data.modelName}" (Job ID: ${jobId || 'unknown'})`;
    } catch (error) {
      console.error('Training submission failed:', error);

      // Extract error message from API response if available
      let errorMessage = 'Failed to start training. Please try again later.';
      if (
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as any).response === 'object' &&
        (error as any).response !== null &&
        'data' in (error as any).response &&
        typeof (error as any).response.data === 'object' &&
        (error as any).response.data !== null &&
        'message' in (error as any).response.data
      ) {
        errorMessage = (error as any).response.data.message;
      }

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    // If the training method changes, update the current method state
    if (name === 'trainMethod') {
      setCurrentTrainMethod(value);
      console.log('Training method changed to:', value);

      // If changing to RLHF, ensure stage is set to 'rm' (default)
      // If changing to other methods, set stage to 'sft'
      const newStage = value === 'rlhf' ? 'rm' : 'sft';

      // Update form data with new method and appropriate stage
      updateTrainFormData({
        trainMethod: value,
        stage: newStage,
        finetuning_type: trainFormData?.finetuning_type || 'lora'
      });
      return;
    }

    // If the finetuning_type changes, we may need to show/hide lora_rank
    if (name === 'finetuning_type') {
      // Force refresh of the UI to show/hide lora_rank field
      setCurrentTrainMethod(prev => prev === 'supervised' ? 'supervised' : prev);
    }

    // If finetuning_type changes, update the form immediately
    if (name === 'finetuning_type') {
      // Force re-render to show/hide lora_rank field and update labels
      setCurrentTrainMethod(prev => {
        // Trigger re-render by "changing" to the same value
        setTimeout(() => updateTrainFormData({ finetuning_type: value } as Partial<TrainFormData>), 0);
        return prev;
      });
    }

    // Update form data in the store
    updateTrainFormData({ [name]: value });
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

  const handleSaveConfig = (data: Record<string, string>) => {
    const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
    saveConfig(
        data, 
        'train', 
        translations[locale].configSaved
    );
};

const handleLoadConfig = () => {
    const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
    loadConfig(
        (config) => {
            // Update form data with loaded config
            updateTrainFormData(config);
        },
        translations[locale].configLoaded
    );
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

  // Update form buttons to include advanced toggle
  const formButtons: FormButton[] = [
    {
      key: 'preview-curl',
      text: 'previewCurlCommand',
      variant: 'outline-secondary',
      position: 'left',
      onClick: handlePreviewCurl
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
    },
    {
      key: 'check-status',
      text: 'checkStatus',
      variant: 'outline-primary',
      position: 'right',
      onClick: handleCheckStatus
    }
  ];

  // Use useMemo to memoize the fields so they only regenerate when needed
  const currentFields = useMemo(() => getFormFields(), [
    showAdvanced,
    modelOptions,
    datasetOptions,
    expandedSections,
    searchQuery,
    currentLocale,
    currentTrainMethod
  ]);

  return (
    <>
      {/* Error banner */}
      {showErrorBanner && (
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '20px',
          borderLeft: '5px solid #ffeeba'
        }}>
          <strong>Note:</strong> {error} You can still proceed with training using these options.
          {retryCount < 2 && (
            <button
              onClick={() => setRetryCount(prev => prev + 1)}
              style={{
                marginLeft: '10px',
                backgroundColor: '#856404',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* This is the standalone TrainingOptionsHelp component that should be used */}
      {/* <div className="training-help-container" style={{ 
        marginBottom: '20px',
        padding: '0',  // Ensure no additional padding
        border: 'none'  // Ensure no border is added
      }}>
        <TrainingOptionsHelp />
      </div> */}

      <DebugComponent formFields={currentFields} />
      <ModelForm
        title="trainNewModel"
        submitButtonText="startTraining"
        buttons={formButtons}
        fields={currentFields}
        translations={translations}
        onSubmit={handleSubmit}
        formData={formData as unknown as Record<string, string>}
        onChange={handleChange}
      />
    </>
  );
};

// Create a wrapper component that includes the shared layout
const TrainWithLayout = () => (
  <ModelConfigLayout
    title="Configure Training Options"
    description="Set up the parameters for training your model. Choose a base model, dataset, and training configuration."
    breadcrumbs={[{ label: 'Home', to: '/' }, { label: 'Train', to: '/train' }]}
    translations={translations}
  >
    <Train />
  </ModelConfigLayout>
);

export default TrainWithLayout;