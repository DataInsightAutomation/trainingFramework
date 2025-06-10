// Simple translations for localization
export const translations = {
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
    
    // Basic field translations
    modelNameDescription: 'The model to evaluate',
    adapterPathLabel: 'Adapter Path',
    adapterPathPlaceholder: 'Enter path to fine-tuned adapter',
    adapterPathDescription: 'Path to the fine-tuned adapter for this model',
    adapterPathError: 'Please provide an adapter path',
    stageLabel: 'Training Stage',
    stagePlaceholder: 'Select training stage',
    outputDirLabel: 'Output Directory',
    outputDirPlaceholder: 'Path to save evaluation results',
    outputDirDescription: 'Directory where evaluation results will be saved',
    tokenLabel: 'Hugging Face Token',
    tokenPlaceholder: 'Enter your HF token for private models',
    tokenDescription: 'Required for accessing private models from Hugging Face',
    datasetDescription: 'Dataset(s) to use for evaluation',
    
    // Section titles
    modelConfigSection: 'Model Configuration',
    datasetConfigSection: 'Dataset Configuration',
    evaluationConfigSection: 'Evaluation Configuration',
    
    // Model config fields
    trust_remote_codeLabel: 'Trust Remote Code',
    finetuning_typeLabel: 'Fine-tuning Type',
    quantization_methodLabel: 'Quantization Method',
    templateLabel: 'Prompt Template',
    flash_attnLabel: 'Flash Attention',
    
    // Dataset config fields
    dataset_dirLabel: 'Dataset Directory',
    cutoff_lenLabel: 'Cutoff Length',
    max_samplesLabel: 'Max Samples',
    preprocessing_num_workersLabel: 'Preprocessing Workers',
    
    // Evaluation config fields
    per_device_eval_batch_sizeLabel: 'Eval Batch Size',
    predict_with_generateLabel: 'Predict with Generate',
    max_new_tokensLabel: 'Max New Tokens',
    top_pLabel: 'Top P',
    temperatureLabel: 'Temperature',
    do_evalLabel: 'Do Evaluation',
    
    // Status-related
    checkStatus: 'Check Status',
    noRecentJob: 'No recent evaluation job found',
    
    // Command output
    evaluationCommand: 'Evaluation command:',
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
    
    // Basic field translations
    modelNameDescription: '要评估的模型',
    adapterPathLabel: '适配器路径',
    adapterPathPlaceholder: '输入微调适配器的路径',
    adapterPathDescription: '此模型的微调适配器路径',
    adapterPathError: '请提供适配器路径',
    stageLabel: '训练阶段',
    stagePlaceholder: '选择训练阶段',
    outputDirLabel: '输出目录',
    outputDirPlaceholder: '保存评估结果的路径',
    outputDirDescription: '评估结果将保存的目录',
    tokenLabel: 'Hugging Face 令牌',
    tokenPlaceholder: '输入您的 HF 令牌以访问私有模型',
    tokenDescription: '访问 Hugging Face 私有模型所需',
    datasetDescription: '用于评估的数据集',
    
    // Section titles
    modelConfigSection: '模型配置',
    datasetConfigSection: '数据集配置',
    evaluationConfigSection: '评估配置',
    
    // Model config fields
    trust_remote_codeLabel: '信任远程代码',
    finetuning_typeLabel: '微调类型',
    quantization_methodLabel: '量化方法',
    templateLabel: '提示模板',
    flash_attnLabel: '闪速注意力',
    
    // Dataset config fields
    dataset_dirLabel: '数据集目录',
    cutoff_lenLabel: '截断长度',
    max_samplesLabel: '最大样本数',
    preprocessing_num_workersLabel: '预处理工作线程',
    
    // Evaluation config fields
    per_device_eval_batch_sizeLabel: '评估批次大小',
    predict_with_generateLabel: '使用生成预测',
    max_new_tokensLabel: '最大新令牌数',
    top_pLabel: 'Top P值',
    temperatureLabel: '温度系数',
    do_evalLabel: '执行评估',
    
    // Status-related
    checkStatus: '检查状态',
    noRecentJob: '未找到最近的评估任务',
    
    // Command output
    evaluationCommand: '评估命令：',
  }
} as const;
