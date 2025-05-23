import React, { useState, useEffect, useMemo } from 'react';
import { EvaluateFormData } from '../../../utils/context';
import { useAppStore } from '../../../store/appStore';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm/ModelForm';
import { resourceService } from '../../../services/resourceService';
import OptionsToggle from '../../shared/OptionsToggle';
// Simple translations for localization
const translations = {
  en: {
    evaluateModel: 'Evaluate Model',
    modelNameLabel: 'Model Name',
    modelNamePlaceholder: 'Enter model name',
    modelNameError: 'Please provide a model name.',
    modelPathLabel: 'Model Path',
    modelPathPlaceholder: 'Enter model path (e.g., /models/base)',
    modelPathError: 'Please provide a model path.',
    checkpointPathLabel: 'Checkpoint Path',
    checkpointPathPlaceholder: 'Enter checkpoint path (e.g., /checkpoints/finetuned-model)',
    checkpointPathError: 'Please provide a checkpoint path.',
    datasetLabel: 'Dataset',
    datasetPlaceholder: 'Enter dataset name or path',
    datasetError: 'Please provide a dataset.',
    evaluateMethodLabel: 'Evaluation Method',
    selectevaluateMethod: 'Select an evaluation method',
    accuracy: 'Accuracy',
    f1Score: 'F1 Score',
    precision: 'Precision',
    recall: 'Recall',
    bleu: 'BLEU Score',
    startEvaluation: 'Start Evaluation',
    submitting: 'Submitting...',
    evaluationStarted: 'Evaluation job started for model',
    selectLanguage: 'Language',
    english: 'English',
    chinese: '中文',
    previewCommand: 'Preview Command',
    loadConfig: 'Load Config',
    saveConfig: 'Save Config',
    configSaved: 'Configuration saved successfully',
    configLoaded: 'Configuration loaded successfully',
    commandCopied: 'Command copied to clipboard',
    advancedOptions: 'Advanced Options',
    basicOptions: 'Basic Options',
  },
  zh: {
    evaluateModel: '评估模型',
    modelNameLabel: '模型名称',
    modelNamePlaceholder: '输入模型名称',
    modelNameError: '请提供模型名称。',
    modelPathLabel: '模型路径',
    modelPathPlaceholder: '输入模型路径（例如，/models/base）',
    modelPathError: '请提供模型路径。',
    checkpointPathLabel: '检查点路径',
    checkpointPathPlaceholder: '输入检查点路径（例如，/checkpoints/finetuned-model）',
    checkpointPathError: '请提供检查点路径。',
    datasetLabel: '数据集',
    datasetPlaceholder: '输入数据集名称或路径',
    datasetError: '请提供数据集。',
    evaluateMethodLabel: '评估方法',
    selectevaluateMethod: '选择评估方法',
    accuracy: '准确率',
    f1Score: 'F1分数',
    precision: '精确率',
    recall: '召回率',
    bleu: 'BLEU分数',
    startEvaluation: '开始评估',
    submitting: '提交中...',
    evaluationStarted: '模型评估任务已开始',
    selectLanguage: '语言',
    english: 'English',
    chinese: '中文',
    previewCommand: '预览命令',
    loadConfig: '加载配置',
    saveConfig: '保存配置',
    configSaved: '配置保存成功',
    configLoaded: '配置加载成功',
    commandCopied: '命令已复制到剪贴板',
    advancedOptions: '高级选项',
    basicOptions: '基本选项',
  }
} as const;

type TranslationLocale = keyof typeof translations;

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

const Evaluate = () => {
  // Use Zustand store directly - add currentTheme to the destructuring
  const { evaluateFormData, currentLocale, currentTheme, updateEvaluateFormData } = useAppStore();
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add field sections for the evaluate component, similar to how it's done in Train
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
  
  // Function to highlight matches
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.trim()})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  };
  
  // Add filter and search functionality
  const getFormFields = () => {
    // Create a deep copy of evaluate fields
    const fieldsWithOptions = JSON.parse(JSON.stringify(evaluateFields));
    
    // Apply options
    fieldsWithOptions[0].options = modelOptions;
    fieldsWithOptions[3].options = datasetOptions;
    
    // Apply search filtering and highlighting logic similar to Train component
    if (searchQuery.trim()) {
      // Implementation similar to Train component
      // ...
    }
    
    // Handle advanced mode
    if (showAdvanced) {
      // Implementation similar to Train component
      // ...
    }
    
    return fieldsWithOptions;
  };
  
  // Update evaluateFields with dynamic options
  evaluateFields[0].options = modelOptions;
  evaluateFields[3].options = datasetOptions;

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

  // Define button actions for consistency with Train component
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

  // Define buttons for consistency with Train component
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
    currentLocale
  ]);
  
  // Add toggle handler
  const handleToggleAdvanced = () => {
    setShowAdvanced(!showAdvanced);
    setSearchQuery('');
  };
  
  // Add search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <div className="evaluate-container">
      {/* Use the new OptionsToggle component */}
      <OptionsToggle
        showAdvanced={showAdvanced}
        onToggleAdvanced={handleToggleAdvanced}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onClearSearch={handleClearSearch}
        toggleText={{
          advanced: translations[currentLocale === 'zh' ? 'zh' : 'en'].advancedOptions,
          basic: translations[currentLocale === 'zh' ? 'zh' : 'en'].basicOptions
        }}
        title="Configure Evaluation Options"
        theme={currentTheme.name}
      />
      
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
    </div>
  );
};

export default Evaluate;
