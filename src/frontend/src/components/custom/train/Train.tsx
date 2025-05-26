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

// Advanced form field sections with custom header names
const advancedFieldSections = {
  modelConfig: {
    title: 'modelConfigSection',
    fields: [
      { name: 'trust_remote_code', type: 'toggle', defaultValue: 'true' },
      { name: 'stage', type: 'select', options: [
          { value: 'sft', directLabel: 'SFT' },
          { value: 'rm', directLabel: 'Reward Model' },
          { value: 'ppo', directLabel: 'PPO' },
        ]
      },
    ]
  },
  finetuningConfig: {
    title: 'finetuningConfigSection',
    fields: [
      { name: 'finetuning_type', type: 'select', options: [
          { value: 'lora', directLabel: 'LoRA' },
          { value: 'qlora', directLabel: 'QLoRA' },
          { value: 'full', directLabel: 'Full Fine-tuning' },
        ]
      },
      { name: 'lora_rank', type: 'number', min: 1, max: 64, step: 1 },
      { name: 'lora_target', type: 'text' },
      { name: 'template', type: 'select', options: [
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
      { name: 'lr_scheduler_type', type: 'select', options: [
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
    options: [] // Will be populated from API
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
  {
    name: 'trainMethod',
    type: 'searchableSelect',
    options: [
      { value: 'supervised', label: 'supervisedLearning' },
      { value: 'rlhf', label: 'rlhf' },
      { value: 'finetuning', label: 'finetuning' },
      { value: 'distillation', label: 'distillation' }
    ]
  }
];

const Train = () => {
  // Use the shared context for advanced mode and search
  const { showAdvanced, searchQuery } = useContext(ModelConfigContext);
  
  const { trainFormData, currentLocale, updateTrainFormData } = useAppStore();
  const [modelOptions, setModelOptions] = useState<{value: string, directLabel: string}[]>([]);
  const [datasetOptions, setDatasetOptions] = useState<{value: string, directLabel: string}[]>([]);
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
    trainMethod: '',
    
    // Advanced options with defaults
    trust_remote_code: 'true',
    stage: 'sft',
    finetuning_type: 'lora',
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
    
    // Filter and enhance basic fields if there's a search query
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
        allFields = [...allFields, ...section.fields];
      }
    });
    
    return allFields;
  };
  
  // Load models and datasets from API
  useEffect(() => {
    const fetchResources = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Use API service instead of direct Axios calls
        const modelsResponse = await resourceService.getModels();
        if (modelsResponse && modelsResponse.models) {
          const modelsList = modelsResponse.models.map((model: any) => ({
            value: model.id,
            directLabel: model.name
          }));
          setModelOptions(modelsList);
          // Remove this line - we'll handle this in getFormFields
          // trainFields[0].options = modelsList;
        }
        
        const datasetsResponse = await resourceService.getDatasets();
        if (datasetsResponse && datasetsResponse.datasets) {
          const datasetsList = datasetsResponse.datasets.map((dataset: any) => ({
            value: dataset.id,
            directLabel: dataset.name
          }));
          setDatasetOptions(datasetsList);
          // Remove this line - we'll handle this in getFormFields
          // trainFields[2].options = datasetsList;
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error);
        setError('Failed to load models or datasets. Using default options.');
        
        // Fallback to default models and datasets
        setModelOptions([
          { value: 'llama3-8b', directLabel: 'Llama 3 (8B)' },
          { value: 'gpt4', directLabel: 'GPT-4' }
        ]);
        
        setDatasetOptions([
          { value: 'alpaca-cleaned', directLabel: 'Alpaca (Cleaned)' },
          { value: 'dolly-15k', directLabel: 'Dolly 15k' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call the function
    fetchResources();
  }, []);
  
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
        model_name: data.modelName,
        model_path: data.modelPath,
        datasets: datasets,
        train_method: data.trainMethod,
      };
      
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
    // Save config to localStorage or download as JSON
    const configJson = JSON.stringify(data, null, 2);
    localStorage.setItem('trainConfig', configJson);
    
    // Trigger download
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'train-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    const locale = (currentLocale === 'zh') ? 'zh' : 'en';
    alert(translations[locale].configSaved);
  };
  
  const handleLoadConfig = () => {
    // Create a file input and trigger it
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
            // Update form data with loaded config
            updateTrainFormData(config);
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
    currentLocale
  ]);
  
  return (
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