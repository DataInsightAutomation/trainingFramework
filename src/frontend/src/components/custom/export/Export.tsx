import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useAppStore } from '../../../store/appStore';
import ModelForm, { FormField, FormButton } from '../../shared/ModelForm/ModelForm';
import { resourceService } from '../../../services/resourceService';
import { exportService } from '#services/exportService';
import { EndPoints } from '#constants/endpoint';
import ModelConfigLayout, { ModelConfigContext } from '../../shared/ModelConfigLayout/ModelConfigLayout';
import './Export.scss';

// Define translations
const translations = {
    en: {
        exportModel: 'Export Model',
        modelNameOrPathLabel: 'Base Model',
        modelNameOrPathPlaceholder: 'Enter base model name or path',
        adapterNameOrPathLabel: 'Adapter Path',
        adapterNameOrPathPlaceholder: 'Enter adapter path (e.g. saves/modelname/lora/sft)',
        adapterNameOrPathDescription: 'Path to the trained adapter (LoRA weights)',
        exportDirLabel: 'Export Directory',
        exportDirPlaceholder: 'Enter local export directory path',
        exportDirDescription: 'Local directory where the model will be saved',
        exportHubModelIdLabel: 'HuggingFace Hub Model ID',
        exportHubModelIdPlaceholder: 'username/model-name',
        exportHubModelIdDescription: 'Model ID for uploading to HuggingFace Hub (optional)',
        hfHubTokenLabel: 'HuggingFace Hub Token',
        hfHubTokenPlaceholder: 'Enter your HuggingFace token',
        hfHubTokenDescription: 'Required for uploading to HuggingFace Hub',
        exportFormatLabel: 'Export Format',
        exportTypeLabel: 'Export Type',
        startExport: 'Start Export',
        exportStarted: 'Export job started for model',
        previewCurlCommand: 'Preview Curl Command',
        loadConfig: 'Load Config',
        saveConfig: 'Save Config',
        configSaved: 'Configuration saved successfully',
        configLoaded: 'Configuration loaded successfully',
        checkStatus: 'Check Status',
        advancedOptions: "Advanced Export Options",
        basicOptions: "Basic Export Options",
        formatLabel: "Export Format",
        destinationLabel: "Export Destination",
        
        // Advanced options
        exportConfigSection: 'Export Configuration',
        quantizationLabel: 'Quantization',
        quantizationDescription: 'Apply quantization during export',
        quantizationBitsLabel: 'Quantization Bits',
        quantizationBitsDescription: 'Number of bits for quantization',
        mergeAdapterLabel: 'Merge Adapter',
        mergeAdapterDescription: 'Merge LoRA adapter with base model',
        pushToHubLabel: 'Push to Hub',
        pushToHubDescription: 'Upload model to HuggingFace Hub',
        privateLabel: 'Private Repository',
        privateDescription: 'Make the HuggingFace repository private',
    },
    zh: {
        exportModel: '导出模型',
        modelNameOrPathLabel: '基础模型',
        modelNameOrPathPlaceholder: '输入基础模型名称或路径',
        adapterNameOrPathLabel: '适配器路径',
        adapterNameOrPathPlaceholder: '输入适配器路径（例如 saves/modelname/lora/sft）',
        adapterNameOrPathDescription: '训练好的适配器路径（LoRA 权重）',
        exportDirLabel: '导出目录',
        exportDirPlaceholder: '输入本地导出目录路径',
        exportDirDescription: '保存模型的本地目录',
        exportHubModelIdLabel: 'HuggingFace Hub 模型 ID',
        exportHubModelIdPlaceholder: '用户名/模型名称',
        exportHubModelIdDescription: '上传到 HuggingFace Hub 的模型 ID（可选）',
        hfHubTokenLabel: 'HuggingFace Hub 令牌',
        hfHubTokenPlaceholder: '输入您的 HuggingFace 令牌',
        hfHubTokenDescription: '上传到 HuggingFace Hub 需要此令牌',
        exportFormatLabel: '导出格式',
        exportTypeLabel: '导出类型',
        startExport: '开始导出',
        exportStarted: '模型导出任务已开始',
        previewCurlCommand: '预览 Curl 命令',
        loadConfig: '加载配置',
        saveConfig: '保存配置',
        configSaved: '配置保存成功',
        configLoaded: '配置加载成功',
        checkStatus: '检查状态',
        advancedOptions: "高级导出选项",
        basicOptions: "基本导出选项",
        formatLabel: "导出格式",
        destinationLabel: "导出目的地",
        
        // Advanced options
        exportConfigSection: '导出配置',
        quantizationLabel: '量化',
        quantizationDescription: '在导出过程中应用量化',
        quantizationBitsLabel: '量化位数',
        quantizationBitsDescription: '量化的位数',
        mergeAdapterLabel: '合并适配器',
        mergeAdapterDescription: '将 LoRA 适配器与基础模型合并',
        pushToHubLabel: '推送到 Hub',
        pushToHubDescription: '将模型上传到 HuggingFace Hub',
        privateLabel: '私有仓库',
        privateDescription: '将 HuggingFace 仓库设为私有',
    }
};

// Advanced export options
const advancedFieldSections = {
    exportConfig: {
        title: 'exportConfigSection',
        fields: [
            { 
                name: 'quantization', 
                type: 'toggle', 
                defaultValue: 'false',
                description: 'quantizationDescription'
            },
            { 
                name: 'quantizationBits', 
                type: 'select', 
                options: [
                    { value: '4', directLabel: '4-bit' },
                    { value: '8', directLabel: '8-bit' },
                ],
                description: 'quantizationBitsDescription'
            },
            { 
                name: 'mergeAdapter', 
                type: 'toggle', 
                defaultValue: 'true',
                description: 'mergeAdapterDescription'
            },
            { 
                name: 'pushToHub', 
                type: 'toggle', 
                defaultValue: 'false',
                description: 'pushToHubDescription'
            },
            { 
                name: 'private', 
                type: 'toggle', 
                defaultValue: 'true',
                description: 'privateDescription'
            },
        ]
    },
} as const;

// Basic export fields
const basicFields: FormField[] = [
    {
        name: 'modelNameOrPath',
        type: 'searchableSelect',
        options: [], // Will be populated from API
        creatable: true,
        createMessage: 'addCustomModel',
        createPlaceholder: 'enterCustomModelName',
        customOptionPrefix: 'custom',
        description: 'modelNameOrPathDescription'
    },
    {
        name: 'adapterNameOrPath',
        type: 'text',
        required: true,
        description: 'adapterNameOrPathDescription'
    },
    {
        name: 'exportDir',
        type: 'text',
        required: true,
        description: 'exportDirDescription'
    },
    {
        name: 'exportHubModelId',
        type: 'text',
        required: false,
        description: 'exportHubModelIdDescription'
    },
    {
        name: 'hfHubToken',
        type: 'text',
        required: false,
        description: 'hfHubTokenDescription'
    },
    // {
    //     name: 'exportFormat',
    //     type: 'searchableSelect',
    //     options: [
    //         { value: 'pytorch', directLabel: 'PyTorch' },
    //         { value: 'safetensors', directLabel: 'SafeTensors' },
    //         { value: 'onnx', directLabel: 'ONNX' },
    //     ],
    //     required: true
    // },
];

const Export = () => {
    // Use the shared context for advanced mode and search
    const { showAdvanced, searchQuery } = useContext(ModelConfigContext);
    
    const { exportFormData, currentLocale, updateExportFormData } = useAppStore();
    const [modelOptions, setModelOptions] = useState<{value: string, directLabel: string}[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Track expanded/collapsed state of each section
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        exportConfig: true,
    });
    
    // Toggle section expanded/collapsed state
    const toggleSection = (sectionKey: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    };
    
    // Initialize form data with defaults
    const defaultExportData = {
        modelNameOrPath: '',
        adapterNameOrPath: '',
        exportDir: '',
        exportHubModelId: '',
        hfHubToken: '',
        exportFormat: 'safetensors',
        
        // Advanced options
        quantization: 'false',
        quantizationBits: '8',
        mergeAdapter: 'true',
        pushToHub: 'false',
        private: 'true',
    };
    
    // Merge with existing form data or use defaults
    const formData = exportFormData 
        ? { ...defaultExportData, ...exportFormData }
        : defaultExportData;
    
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
        
        // Apply search filtering and highlighting logic similar to Train.tsx
        if (searchQuery.trim()) {
            // Filter and highlight fields based on search query
            // ...similar to the Train.tsx implementation
            // This is abbreviated for clarity
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
    
    // Load models from API
    useEffect(() => {
        const fetchResources = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Fetch available models
                const modelsResponse = await resourceService.getModels();
                if (modelsResponse && modelsResponse.models) {
                    const modelsList = modelsResponse.models.map((model: any) => ({
                        value: model.id,
                        directLabel: model.name
                    }));
                    setModelOptions(modelsList);
                }
            } catch (error) {
                console.error('Failed to fetch resources:', error);
                setError('Failed to load models. Using default options.');
                
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
        fetchResources();
    }, []);
    
    // Handle form submission via the API
    const handleSubmit = async (data: Record<string, string>) => {
        try {
            console.log('Export form data before submission:', data);
            
            // Check for validation issues
            const validationIssues = [];
            
            if (!data.modelNameOrPath) {
                validationIssues.push("Base model is required");
            }
            
            if (!data.adapterNameOrPath) {
                validationIssues.push("Adapter path is required");
            }
            
            if (!data.exportDir) {
                validationIssues.push("Export directory is required");
            }
            
            // Check if we need token for HuggingFace Hub
            if (data.pushToHub === 'true' || data.exportHubModelId) {
                if (!data.hfHubToken) {
                    validationIssues.push("HuggingFace Hub token is required for uploading to Hub");
                }
                
                if (!data.exportHubModelId) {
                    validationIssues.push("HuggingFace Hub Model ID is required for uploading to Hub");
                }
            }
            
            // If there are validation issues, throw an error
            if (validationIssues.length > 0) {
                throw new Error(`Validation failed: ${validationIssues.join(', ')}`);
            }
            
            // Show loading state
            setIsLoading(true);
            
            // Build request data for API
            const requestData: any = {
                model_name_or_path: data.modelNameOrPath,
                adapter_name_or_path: data.adapterNameOrPath,
                export_dir: data.exportDir,
                // export_format: data.exportFormat,
            };
            
            // Add optional fields
            if (data.exportHubModelId) {
                requestData.export_hub_model_id = data.exportHubModelId;
            }
            
            // Add token if provided
            if (data.hfHubToken) {
                requestData.hf_hub_token = data.hfHubToken;
            }
            
            // Add advanced parameters when advanced mode is enabled
            if (showAdvanced) {
                console.log('Advanced mode: including advanced configuration options');
                
                // Process advanced fields
                if (data.quantization === 'true') {
                    requestData.quantization = true;
                    requestData.quantization_bits = parseInt(data.quantizationBits);
                }
                
                requestData.merge_adapter = data.mergeAdapter === 'true';
                requestData.push_to_hub = data.pushToHub === 'true';
                requestData.private = data.private === 'true';
            }
            
            console.log('Sending export request with data:', requestData);
            
            // Call the API endpoint using exportService instead of fetch
            const response = await exportService.startExport(requestData, showAdvanced);
            
            // Save the job ID for later status checking
            if (response.job_id) {
                localStorage.setItem('lastExportJobId', response.job_id);
            }
            
            console.log('Export submitted successfully:', response);
            
            // Return a success message for the form
            const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
            return `${translations[locale].exportStarted} "${data.modelNameOrPath}" (Job ID: ${response.job_id || 'unknown'})`;
            
        } catch (error) {
            console.error('Export submission failed:', error);
            
            // Extract error message from API response if available
            let errorMessage = 'Failed to start export. Please try again later.';
            if (
                typeof error === 'object' &&
                error !== null &&
                'message' in error
            ) {
                errorMessage = (error as Error).message;
            }
            
            throw new Error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (name: string, value: string) => {
        updateExportFormData({ [name]: value });
    };

    // Check status handler
    const handleCheckStatus = async () => {
        const jobId = localStorage.getItem('lastExportJobId');
        if (!jobId) {
            alert('No recent export job found');
            return;
        }
        
        try {
            setIsLoading(true);
            
            // Call the API to get export status using exportService
            const result = await exportService.getExportStatus(jobId);
            
            // Show status to the user
            alert(`Export status for job ${jobId}: ${result.status}`);
        } catch (error) {
            console.error('Failed to get export status:', error);
            alert('Failed to retrieve export status. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Define button actions
    const handlePreviewCurl = (data: Record<string, string>) => {
        // Prepare the data in the format expected by the exportService
        const exportData = {
            model_name_or_path: data.modelNameOrPath,
            adapter_name_or_path: data.adapterNameOrPath,
            export_dir: data.exportDir,
            // export_format: data.exportFormat,
        };
        
        // Get the curl command from exportService
        const curlCommand = exportService.getPreviewCurlCommand(exportData);
        
        alert(curlCommand);
        // Copy to clipboard
        navigator.clipboard.writeText(curlCommand);
    };
    
    const handleSaveConfig = (data: Record<string, string>) => {
        // Save config to localStorage or download as JSON
        const configJson = JSON.stringify(data, null, 2);
        localStorage.setItem('exportConfig', configJson);
        
        // Trigger download
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export-config.json';
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
                        updateExportFormData(config);
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
    
    // Form buttons
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
    
    // Use useMemo to memoize the fields
    const currentFields = useMemo(() => getFormFields(), [
        showAdvanced, 
        modelOptions, 
        expandedSections,
        searchQuery,
        currentLocale
    ]);
    
    return (
        <ModelForm
            title="exportModel"
            submitButtonText="startExport"
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
const ExportWithLayout = () => (
    <ModelConfigLayout 
        title="Export Model"
        translations={translations}>
        <Export />
    </ModelConfigLayout>
);

export default ExportWithLayout;