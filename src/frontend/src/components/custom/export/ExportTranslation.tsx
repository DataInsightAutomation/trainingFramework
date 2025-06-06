export const translations = {
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
        exportHubModelIdLabel: 'Merged Model Hub ID',
        exportHubModelIdPlaceholder: 'model-name',
        exportHubModelIdDescription: 'Model ID for uploading merged model to HuggingFace Hub',
        adapterHubModelIdLabel: 'Adapter Hub ID',
        adapterHubModelIdPlaceholder: 'adapter-name',
        adapterHubModelIdDescription: 'Model ID for uploading adapter to HuggingFace Hub (for both export type)',
        hfHubTokenLabel: 'HuggingFace Hub Token',
        hfHubTokenPlaceholder: 'Enter your HuggingFace token',
        hfHubTokenDescription: 'Required for uploading to HuggingFace Hub',
        exportFormatLabel: 'Export Format',
        exportTypeLabel: 'Export Type',
        exportTypeDescription: 'Choose what to export: merged model, adapter only, or both',
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

        // New export configuration field labels and descriptions
        exportSizeLabel: 'Export Size (GB)',
        exportSizeDescription: 'File chunk size for exported model (in GB)',
        exportSizePlaceholder: 'Enter export size in GB (default: 5)',
        
        exportDeviceLabel: 'Export Device',
        exportDeviceDescription: 'Device used for model export, auto can accelerate export',
        
        exportQuantizationBitLabel: 'Quantization Bits',
        exportQuantizationBitDescription: 'Number of bits used for model quantization',
        
        exportQuantizationDatasetLabel: 'Quantization Dataset',
        exportQuantizationDatasetDescription: 'Dataset path or name used for model quantization',
        exportQuantizationDatasetPlaceholder: 'Enter dataset path or name',
        
        exportQuantizationNsamplesLabel: 'Quantization Samples',
        exportQuantizationNsamplesDescription: 'Number of samples used for quantization',
        exportQuantizationNsamplesPlaceholder: 'Enter number of samples (default: 128)',
        
        exportQuantizationMaxlenLabel: 'Quantization Max Length',
        exportQuantizationMaxlenDescription: 'Maximum input length for quantization',
        exportQuantizationMaxlenPlaceholder: 'Enter max length (default: 1024)',
        
        exportLegacyFormatLabel: 'Use Legacy Format',
        exportLegacyFormatDescription: 'True: save in .bin format. False: save in .safetensors format',

        // New sub-header translations
        exportBasicConfigSection: 'Basic Export Settings',
        exportQuantizationConfigSection: 'Quantization Settings',
        exportModelRepositorySection: 'Model Repository Settings', // Changed from 'HuggingFace Hub Settings'

        // Add missing translations for pushToHub and private
        pushToHubLabel: 'Push to Repository', // Changed from 'Push to Hub'
        pushToHubDescription: 'Upload model to online repository', // Changed from 'Upload model to HuggingFace Hub'
        privateLabel: 'Private Repository',
        privateDescription: 'Make the HuggingFace repository private',

        // Add quantization toggle translations
        quantizationLabel: 'Enable Quantization',
        quantizationDescription: 'Reduce model size with quantization (available for merged models)',
        quantizationSection: 'Quantization Options',
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
        exportHubModelIdLabel: '合并模型的 Hub ID',
        exportHubModelIdPlaceholder: '用户名/模型名称',
        exportHubModelIdDescription: '上传合并模型到 HuggingFace Hub 的模型 ID',
        adapterHubModelIdLabel: '适配器 Hub ID',
        adapterHubModelIdPlaceholder: '用户名/适配器名称',
        adapterHubModelIdDescription: '上传适配器到 HuggingFace Hub 的模型 ID（用于同时导出类型）',
        hfHubTokenLabel: 'HuggingFace Hub 令牌',
        hfHubTokenPlaceholder: '输入您的 HuggingFace 令牌',
        hfHubTokenDescription: '上传到 HuggingFace Hub 需要此令牌',
        exportFormatLabel: '导出格式',
        exportTypeLabel: '导出类型',
        exportTypeDescription: '选择要导出的内容：合并模型、仅适配器或两者都导出',
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

        // New export configuration field labels and descriptions
        exportSizeLabel: '导出大小 (GB)',
        exportSizeDescription: '导出模型的文件分片大小（以GB为单位）',
        exportSizePlaceholder: '输入导出大小（默认：5）',
        
        exportDeviceLabel: '导出设备',
        exportDeviceDescription: '导出模型时使用的设备，auto可自动加速导出',
        
        exportQuantizationBitLabel: '量化位数',
        exportQuantizationBitDescription: '量化导出模型时使用的位数',
        
        exportQuantizationDatasetLabel: '量化数据集',
        exportQuantizationDatasetDescription: '用于量化导出模型的数据集路径或数据集名称',
        exportQuantizationDatasetPlaceholder: '输入数据集路径或名称',
        
        exportQuantizationNsamplesLabel: '量化样本数',
        exportQuantizationNsamplesDescription: '量化时使用的样本数量',
        exportQuantizationNsamplesPlaceholder: '输入样本数量（默认：128）',
        
        exportQuantizationMaxlenLabel: '量化最大长度',
        exportQuantizationMaxlenDescription: '用于量化的模型输入的最大长度',
        exportQuantizationMaxlenPlaceholder: '输入最大长度（默认：1024）',
        
        exportLegacyFormatLabel: '使用传统格式',
        exportLegacyFormatDescription: 'True：.bin格式保存。False：.safetensors格式保存',

        // New sub-header translations
        exportBasicConfigSection: '基本导出设置',
        exportQuantizationConfigSection: '量化设置',
        exportModelRepositorySection: '模型存储库设置', // Changed from 'HuggingFace Hub 设置'

        // Add missing translations for pushToHub and private
        pushToHubLabel: '推送到存储库', // Changed from '推送到 Hub'
        pushToHubDescription: '将模型上传到在线存储库', // Changed from '将模型上传到 HuggingFace Hub'
        privateLabel: '私有仓库',
        privateDescription: '将 HuggingFace 仓库设为私有',

        // Add quantization toggle translations
        quantizationLabel: '启用量化',
        quantizationDescription: '使用量化减小模型大小（适用于合并模型）',
        quantizationSection: '量化选项',
    }
};