import React, { useContext, useState, useEffect } from 'react';
import { Context, TrainFormData } from '../../../utils/context';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm';
import { instance, trainAPI } from '../../../apis/api';
import { EndPoints } from '#constants/endpoint';

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
    checkStatus: 'Check Status'
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
    checkStatus: '检查状态'
  }
};

// Define the form fields structure with searchable select
const trainFields: FormField[] = [
  {
    name: 'modelName', 
    type: 'searchableSelect', // Changed to searchableSelect type
    options: [] // Will be populated in the component
  },
  { name: 'modelPath', type: 'text' },
  { name: 'dataset', type: 'text' },
  {
    name: 'trainMethod',
    type: 'select',
    options: [
      { value: 'supervised', label: 'supervisedLearning' },
      { value: 'rlhf', label: 'rlhf' },
      { value: 'finetuning', label: 'finetuning' },
      { value: 'distillation', label: 'distillation' }
    ]
  }
];

const Train = () => {
  const { state, updateTrainFormData } = useContext(Context);
  // Use the correct type for formData
  const formData: TrainFormData = state.trainFormData || {
    modelName: '',
    modelPath: '',
    dataset: '',
    trainMethod: ''
  };

  const [modelOptions, setModelOptions] = useState<{value: string, directLabel: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load models from API
  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // This will trigger the interceptors in your API file
        // Comment this out for now if your backend isn't ready
        /*
        const modelsList = response.data.map(model => ({
          value: model.id,
          directLabel: model.name
        }));
        setModelOptions(modelsList);
        */
        
        // Simulated API call with setTimeout to show loading state
        setTimeout(() => {
          console.log("API call completed via interceptor");
          
          // For now, use hardcoded models
          setModelOptions([
            { value: 'llama3-1b', directLabel: 'Llama-3.2-1B' },
            { value: 'llama3-8b', directLabel: 'Llama 3 (8B)' },
            { value: 'llama3-70b', directLabel: 'Llama 3 (70B)' },
            { value: 'gpt4', directLabel: 'GPT-4' },
            { value: 'gpt4o', directLabel: 'GPT-4o' },
            { value: 'gpt3.5', directLabel: 'GPT-3.5 Turbo' },
            { value: 'mistral-7b', directLabel: 'Mistral (7B)' },
            { value: 'mixtral', directLabel: 'Mixtral 8x7B' },
            { value: 'phi-3', directLabel: 'Phi-3' },
            { value: 'claude-3', directLabel: 'Claude 3 Opus' },
            { value: 'claude-3-sonnet', directLabel: 'Claude 3 Sonnet' },
            { value: 'claude-3-haiku', directLabel: 'Claude 3 Haiku' },
            { value: 'falcon-180b', directLabel: 'Falcon (180B)' },
            { value: 'gemma-7b', directLabel: 'Gemma (7B)' },
            { value: 'gemma-2b', directLabel: 'Gemma (2B)' },
            // Add more models to demonstrate the search functionality
          ]);
          
          setIsLoading(false);
        }, 1000); // Simulate network delay
        
        // Return to avoid setting isLoading=false immediately
        return;
      } catch (error) {
        console.error('Failed to fetch models:', error);
        setError('Failed to load models. Please try again later.');
        // Fallback to default models
        setModelOptions([
          { value: 'llama3-8b', directLabel: 'Llama 3 (8B)' },
          { value: 'gpt4', directLabel: 'GPT-4' }
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call the function
    fetchModels();
  }, []);
  
  // Update trainFields with dynamic model options
  trainFields[0].options = modelOptions;

  // Handle form submission via the API
  const handleSubmit = async (data: Record<string, string>) => {
    try {
      // Show some loading state if needed
      setIsLoading(true);
      
      // Call the API endpoint
      const response = await trainAPI.startTraining({
        model_name: data.modelName,
        model_path: data.modelPath,
        dataset: data.dataset,
        train_method: data.trainMethod,
        // Add any other parameters your API needs
      });
      
      // Get the job ID from the response
      const jobId = response.job_id || response.jobId;
      
      // Save the job ID for later status checking
      if (jobId) {
        localStorage.setItem('lastTrainingJobId', jobId);
      }
      
      console.log('Training submitted successfully:', response);
      
      // Return a success message for the form
      const locale: 'en' | 'zh' = state.currentLocale === 'zh' ? 'zh' : 'en';
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
    
    const locale = (state.currentLocale === 'zh') ? 'zh' : 'en';
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
            const locale: 'en' | 'zh' = state.currentLocale === 'zh' ? 'zh' : 'en';
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
      const response = await trainAPI.getTrainingStatus(jobId);
      
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
  
  // Define buttons including status check
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
      text: 'checkStatus', // Fixed to use translation key
      variant: 'outline-primary',
      position: 'right',
      onClick: handleCheckStatus
    }
  ];

  return (
    <ModelForm
      title="trainNewModel"  // Add this line to restore the title
      submitButtonText="startTraining"
      buttons={formButtons}
      fields={trainFields}
      translations={translations}
      onSubmit={handleSubmit}
      formData={formData as unknown as Record<string, string>}
      onChange={handleChange}
    />
  );
};

export default Train;