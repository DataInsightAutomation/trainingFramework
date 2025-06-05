/**
 * Test data for train form tests
 */
export const trainFormTestData = {
  // Basic training with default settings
  basicTraining: {
    modelName: 'llamafactory/tiny-random-Llama-3',
    trainMethod: 'supervised',
    description: 'Basic training with minimal configuration',
    // Change dataset to array format to support multiSelect
    dataset: ['Easydata Alpaca Public Easydata', 'Easydata Alpaca private Easydata'],
    // Add finetuning_type which is also required
    finetuning_type: 'lora',
    stage: 'sft'
  },
  
  // Training with LoRA fine-tuning
  loraTraining: {
    modelName: 'llamafactory/tiny-random-Llama-3',
    trainMethod: 'supervised',
    finetuningType: 'lora',
    description: 'LoRA fine-tuning with low-rank adaptation',
    // Update to array format
    dataset: ['Easydata Alpaca Public Easydata'],
    stage: 'sft'
  },
  
  // Training with different datasets
  customDatasetTraining: {
    modelName: 'llamafactory/tiny-random-Llama-3',
    trainMethod: 'supervised',
    datasetName: 'alpaca_mini',
    description: 'Training with custom dataset',
    // Use the custom dataset name
    dataset: ['alpaca_mini'],
    finetuning_type: 'lora',
    stage: 'sft'
  }
};
