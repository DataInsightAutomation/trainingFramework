import React, { useState, useEffect, useMemo } from 'react';
import { TrainFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm';
import { resourceService } from '../../../services/resourceService';
import { EndPoints } from '#constants/endpoint';
import { trainingService } from '#services/trainingService';
import { Form, Button, Accordion, Card } from 'react-bootstrap';
import './Train.scss';

// Translations for the Train component
const translations = {
  en: {
    trainNewModel: 'Train New Model',
    modelNameLabel: 'Model Name',
    modelNamePlaceholder: 'Enter model name',
    modelNameError: 'Please provide a model name.',
    modelPathLabel: 'Model Path',
    modelPathPlaceholder: 'Enter model path (e.g., /models/base)',
    modelPathError: 'Please provide a model path.',
    datasetLabel: 'Dataset',
    datasetPlaceholder: 'Enter dataset name or path',
    datasetError: 'Please provide a dataset.',
    trainMethodLabel: 'Training Method',
    selectTrainMethod: 'Select a training method',
    trainMethodError: 'Please select a training method.',
    selectModelName: 'Select a model',
    baseModel: 'Base Model',
    advancedModel: 'Advanced Model',
    supervisedLearning: 'Supervised Learning',
    rlhf: 'Reinforcement Learning from Human Feedback',
    finetuning: 'Fine-tuning',
    distillation: 'Knowledge Distillation',
    startTraining: 'Start Training',
    submitting: 'Submitting...',
    trainingStarted: 'Training job started for model',
    previewCurlCommand: 'Preview Curl Command',
    loadConfig: 'Load Config',
    saveConfig: 'Save Config',
    configSaved: 'Configuration saved successfully',
    configLoaded: 'Configuration loaded successfully',
    curlCommandCopied: 'Curl command copied to clipboard',
    checkStatus: 'Check Status',
    advancedOptions: 'Advanced Options',
    basicOptions: 'Basic Options',
    modelConfiguration: 'Model Configuration',
    finetuningConfiguration: 'Fine-tuning Configuration',
    datasetConfiguration: 'Dataset Configuration',
    trainingConfiguration: 'Training Configuration',
    outputConfiguration: 'Output Configuration',
    
    // Custom section titles
    modelConfigSection: 'Model Settings',
    finetuningConfigSection: 'Fine-tuning Settings',
    datasetConfigSection: 'Dataset Processing',
    trainingConfigSection: 'Training Parameters',
    outputConfigSection: 'Output Configuration',
    
    // Field labels
    trust_remote_codeLabel: 'Trust Remote Code',
    stageLabel: 'Training Stage',
    finetuning_typeLabel: 'Fine-tuning Type',
    lora_rankLabel: 'LoRA Rank',
    lora_targetLabel: 'LoRA Target',
    templateLabel: 'Template',
    cutoff_lenLabel: 'Cutoff Length',
    max_samplesLabel: 'Max Samples',
    overwrite_cacheLabel: 'Overwrite Cache',
    preprocessing_num_workersLabel: 'Preprocessing Workers',
    per_device_train_batch_sizeLabel: 'Batch Size',
    gradient_accumulation_stepsLabel: 'Gradient Accumulation Steps',
    learning_rateLabel: 'Learning Rate',
    num_train_epochsLabel: 'Number of Epochs',
    lr_scheduler_typeLabel: 'LR Scheduler Type',
    warmup_ratioLabel: 'Warmup Ratio',
    bf16Label: 'BF16',
    output_dirLabel: 'Output Directory',
    logging_stepsLabel: 'Logging Steps',
    save_stepsLabel: 'Save Steps',
    plot_lossLabel: 'Plot Loss',
    overwrite_output_dirLabel: 'Overwrite Output Directory',
    
    // Placeholders
    trust_remote_codePlaceholder: 'Select trust remote code',
    stagePlaceholder: 'Select training stage',
    finetuning_typePlaceholder: 'Select fine-tuning type',
    lora_rankPlaceholder: 'Enter LoRA rank',
    lora_targetPlaceholder: 'Enter LoRA target modules',
    templatePlaceholder: 'Select template',
    cutoff_lenPlaceholder: 'Enter cutoff length',
    max_samplesPlaceholder: 'Enter max samples',
    overwrite_cachePlaceholder: 'Select overwrite cache',
    preprocessing_num_workersPlaceholder: 'Enter preprocessing workers',
    per_device_train_batch_sizePlaceholder: 'Enter batch size',
    gradient_accumulation_stepsPlaceholder: 'Enter gradient accumulation steps',
    learning_ratePlaceholder: 'Enter learning rate',
    num_train_epochsPlaceholder: 'Enter number of epochs',
    lr_scheduler_typePlaceholder: 'Select LR scheduler type',
    warmup_ratioPlaceholder: 'Enter warmup ratio',
    bf16Placeholder: 'Select BF16',
    output_dirPlaceholder: 'Enter output directory',
    logging_stepsPlaceholder: 'Enter logging steps',
    save_stepsPlaceholder: 'Enter save steps',
    plot_lossPlaceholder: 'Select plot loss',
    overwrite_output_dirPlaceholder: 'Select overwrite output directory',
  },
  zh: {
    trainNewModel: '训练新模型',
    modelNameLabel: '模型名称',
    modelNamePlaceholder: '输入模型名称',
    modelNameError: '请提供模型名称。',
    modelPathLabel: '模型路径',
    modelPathPlaceholder: '输入模型路径（例如，/models/base）',
    modelPathError: '请提供模型路径。',
    datasetLabel: '数据集',
    datasetPlaceholder: '输入数据集名称或路径',
    datasetError: '请提供数据集。',
    trainMethodLabel: '训练方法',
    selectTrainMethod: '选择训练方法',
    trainMethodError: '请选择训练方法。',
    selectModelName: '选择模型',
    baseModel: '基础模型',
    advancedModel: '高级模型',
    supervisedLearning: '监督学习',
    rlhf: '人类反馈强化学习',
    finetuning: '微调',
    distillation: '知识蒸馏',
    startTraining: '开始训练',
    submitting: '提交中...',
    trainingStarted: '模型训练任务已开始',
    previewCurlCommand: '预览 Curl 命令',
    loadConfig: '加载配置',
    saveConfig: '保存配置',
    configSaved: '配置保存成功',
    configLoaded: '配置加载成功',
    curlCommandCopied: 'Curl 命令已复制到剪贴板',
    checkStatus: '检查状态',
    advancedOptions: '高级选项',
    basicOptions: '基本选项',
    modelConfiguration: '模型配置',
    finetuningConfiguration: '微调配置',
    datasetConfiguration: '数据集配置',
    trainingConfiguration: '训练配置',
    outputConfiguration: '输出配置',
    
    // Custom section titles in Chinese
    modelConfigSection: '模型设置',
    finetuningConfigSection: '微调设置',
    datasetConfigSection: '数据集处理',
    trainingConfigSection: '训练参数',
    outputConfigSection: '输出配置',
    
    // Field labels (Chinese translations would go here)
    trust_remote_codeLabel: '信任远程代码',
    stageLabel: '训练阶段',
    finetuning_typeLabel: '微调类型',
    lora_rankLabel: 'LoRA 排名',
    lora_targetLabel: 'LoRA 目标',
    templateLabel: '模板',
    cutoff_lenLabel: '截断长度',
    max_samplesLabel: '最大样本',
    overwrite_cacheLabel: '覆盖缓存',
    preprocessing_num_workersLabel: '预处理工作线程',
    per_device_train_batch_sizeLabel: '每个设备的批量大小',
    gradient_accumulation_stepsLabel: '梯度累积步数',
    learning_rateLabel: '学习率',
    num_train_epochsLabel: '训练轮数',
    lr_scheduler_typeLabel: '学习率调度器类型',
    warmup_ratioLabel: '预热比例',
    bf16Label: 'BF16',
    output_dirLabel: '输出目录',
    logging_stepsLabel: '日志记录步数',
    save_stepsLabel: '保存步数',
    plot_lossLabel: '绘制损失',
    overwrite_output_dirLabel: '覆盖输出目录',
    
    // Placeholders
    trust_remote_codePlaceholder: '选择信任远程代码',
    stagePlaceholder: '选择训练阶段',
    finetuning_typePlaceholder: '选择微调类型',
    lora_rankPlaceholder: '输入 LoRA 排名',
    lora_targetPlaceholder: '输入 LoRA 目标模块',
    templatePlaceholder: '选择模板',
    cutoff_lenPlaceholder: '输入截断长度',
    max_samplesPlaceholder: '输入最大样本',
    overwrite_cachePlaceholder: '选择覆盖缓存',
    preprocessing_num_workersPlaceholder: '输入预处理工作线程',
    per_device_train_batch_sizePlaceholder: '输入批量大小',
    gradient_accumulation_stepsPlaceholder: '输入梯度累积步数',
    learning_ratePlaceholder: '输入学习率',
    num_train_epochsPlaceholder: '输入训练轮数',
    lr_scheduler_typePlaceholder: '选择学习率调度器类型',
    warmup_ratioPlaceholder: '输入预热比例',
    bf16Placeholder: '选择 BF16',
    output_dirPlaceholder: '输入输出目录',
    logging_stepsPlaceholder: '输入日志记录步数',
    save_stepsPlaceholder: '输入保存步数',
    plot_lossPlaceholder: '选择绘制损失',
    overwrite_output_dirPlaceholder: '选择覆盖输出目录',
  }
};

// Advanced form field sections with custom header names
const advancedFieldSections = {
  modelConfig: {
    title: 'modelConfigSection',
    fields: [
      { name: 'trust_remote_code', type: 'select', options: [
          { value: 'true', directLabel: 'True' },
          { value: 'false', directLabel: 'False' },
        ]
      },
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
      { name: 'max_samples', type: 'number', min: 100, max: 100000, step: 100 },
      { name: 'overwrite_cache', type: 'select', options: [
          { value: 'true', directLabel: 'True' },
          { value: 'false', directLabel: 'False' },
        ]
      },
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
      { name: 'bf16', type: 'select', options: [
          { value: 'true', directLabel: 'True' },
          { value: 'false', directLabel: 'False' },
        ]
      },
    ]
  },
  outputConfig: {
    title: 'outputConfigSection',
    fields: [
      { name: 'output_dir', type: 'text' },
      { name: 'logging_steps', type: 'number', min: 1, max: 1000, step: 1 },
      { name: 'save_steps', type: 'number', min: 10, max: 10000, step: 10 },
      { name: 'plot_loss', type: 'select', options: [
          { value: 'true', directLabel: 'True' },
          { value: 'false', directLabel: 'False' },
        ]
      },
      { name: 'overwrite_output_dir', type: 'select', options: [
          { value: 'true', directLabel: 'True' },
          { value: 'false', directLabel: 'False' },
        ]
      },
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
  { name: 'modelPath', type: 'text' },
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
  const { trainFormData, currentLocale, currentTheme, updateTrainFormData } = useAppStore();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [modelOptions, setModelOptions] = useState<{value: string, directLabel: string}[]>([]);
  const [datasetOptions, setDatasetOptions] = useState<{value: string, directLabel: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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
      }
      
      console.log('Sending training request with data:', requestData);
      
      // Call the API endpoint with the prepared data
      const response = await trainingService.startTraining(requestData);
      
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
  
  // Add toggle button for advanced options
  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
    setSearchQuery('');
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
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
    searchQuery, // Add search dependency
    currentLocale
  ]);
  
  return (
    <div className="train-container">
      {/* Create a centered toggle section with both text and button */}
      <div className={`options-toggle-section mb-4 p-3 border rounded ${currentTheme.name}-theme`}>
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div className="d-flex align-items-center mb-2 mb-sm-0">
            <span className="me-3 fw-medium">Configure Training Options</span>
            <span className="toggle-divider mx-3">|</span>
            <Button 
              variant={showAdvanced ? "primary" : "outline-primary"}
              onClick={handleToggleAdvanced}
              className="px-4"
            >
              {showAdvanced 
                ? translations[currentLocale === 'zh' ? 'zh' : 'en'].basicOptions 
                : translations[currentLocale === 'zh' ? 'zh' : 'en'].advancedOptions}
            </Button>
          </div>
          
          {/* Add search input */}
          <div className="search-container">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search fields..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <span className="input-group-text">
                <i className="bi bi-search"></i>
              </span>
              {searchQuery && (
                <button 
                  className="btn btn-outline-secondary" 
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
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
    </div>
  );
};

export default Train;