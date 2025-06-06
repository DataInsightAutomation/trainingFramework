/**
 * Test data for train form tests
 */
export const trainFormTestData = {
  // Basic training with default settings
  basicTraining: {
    model_name: 'llamafactory/tiny-random-Llama-3',
    train_method: 'supervised',
    description: 'Basic training with minimal configuration',
    // Change datasets to array format to support multiSelect
    datasets: ['Easydata Alpaca Public Easydata', 'Easydata Alpaca private Easydata'],
    // Add finetuning_type which is also required
    finetuning_type: 'lora',
    stage: 'sft'
  },

  // Advanced training with detailed configuration
  advancedTraining: {
    model_name: 'llamafactory/tiny-random-Llama-3',
    model_path: '',
    is_custom_model: false,
    datasets: ['Easydata Alpaca Public Easydata', 'Easydata Alpaca private Easydata'], // For compatibility
    train_method: 'supervised', // For compatibility
    description: 'Advanced training with detailed configuration',
    finetuning_type: 'lora',
    stage: 'sft',
    // Advanced parameters
    bf16: false,
    cutoff_len: 2048,
    gradient_accumulation_steps: 8,
    learning_rate: 0.0001,
    logging_steps: 10,
    lora_rank: 8,
    lora_target: 'all',
    lr_scheduler_type: 'cosine',
    num_train_epochs: 1,
    overwrite_cache: false,
    overwrite_output_dir: '',
    per_device_train_batch_size: 1,
    plot_loss: false,
    preprocessing_num_workers: 4,
    save_steps: 500,
    template: 'llama3',
    trust_remote_code: false,
    warmup_ratio: 0.1
  },
  
  // Training with LoRA fine-tuning
  loraTraining: {
    modelName: 'llamafactory/tiny-random-Llama-3',
    trainMethod: 'supervised',
    finetuningType: 'lora',
    description: 'LoRA fine-tuning with low-rank adaptation',
    // Update to array format
    datasets: ['Easydata Alpaca Public Easydata'],
    stage: 'sft'
  },
  
  // Training with different datasets
  customDatasetTraining: {
    modelName: 'llamafactory/tiny-random-Llama-3',
    trainMethod: 'supervised',
    datasetName: 'alpaca_mini',
    description: 'Training with custom datasets',
    // Use the custom datasets name
    datasets: ['alpaca_mini'],
    finetuning_type: 'lora',
    stage: 'sft'
  }
};
