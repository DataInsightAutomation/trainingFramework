import React, { useState } from 'react';
import { useAppStore } from '#store/appStore';
import { translations } from './Inference';
import './InferenceModel.scss';

// Define inference configuration interface
interface InferenceConfig {
  model_name_or_path: string;
  adapter_name_or_path: string;
  template: string;
  finetuning_type: string;
  infer_backend: 'huggingface' | 'vllm';
  vllm_settings: {
    vllm_maxlen: number;
    vllm_gpu_util: number;
    vllm_enforce_eager: boolean;
    vllm_max_lora_rank: number;
    vllm_config: string;
  };
}

// Template options
const TEMPLATE_OPTIONS = [
  'llama3',
  'llama2',
  'mistral',
  'vicuna',
  'baichuan',
  'chatglm3',
  'qwen',
  'default'
];

// Finetuning type options
const FINETUNING_OPTIONS = [
  'lora',
  'qlora',
  'full',
  'none'
];

const InferenceModel = () => {
  const { currentLocale, currentTheme } = useAppStore();
  const locale: 'en' | 'zh' = currentLocale === 'zh' ? 'zh' : 'en';
  
  // Initialize model configuration with default values
  const [config, setConfig] = useState<InferenceConfig>({
    model_name_or_path: 'meta-llama/Meta-Llama-3-8B-Instruct',
    adapter_name_or_path: 'saves/llama3-8b/lora/sft',
    template: 'llama3',
    finetuning_type: 'lora',
    infer_backend: 'huggingface',
    vllm_settings: {
      vllm_maxlen: 4096,
      vllm_gpu_util: 0.9,
      vllm_enforce_eager: false,
      vllm_max_lora_rank: 32,
      vllm_config: '',
    }
  });

  // Handle input changes
  const handleInputChange = (field: keyof InferenceConfig, value: string) => {
    setConfig({ ...config, [field]: value });
  };

  // Handle vLLM setting changes
  const handleVllmSettingChange = (
    field: keyof InferenceConfig['vllm_settings'], 
    value: string | number | boolean
  ) => {
    setConfig({
      ...config,
      vllm_settings: {
        ...config.vllm_settings,
        [field]: value
      }
    });
  };

  // Function to parse number inputs safely
  const parseNumberInput = (value: string, min: number, max: number, defaultVal: number): number => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return defaultVal;
    return Math.max(min, Math.min(max, parsed));
  };

  return (
    <div className={`inference-model-container ${currentTheme.name}-theme`}>
      <div className="inference-section">
        <h3>{translations[locale].basicOptions}</h3>
        
        <div className="form-group">
          <label htmlFor="model_name_or_path">Model Name or Path:</label>
          <input
            id="model_name_or_path"
            type="text"
            value={config.model_name_or_path}
            onChange={(e) => handleInputChange('model_name_or_path', e.target.value)}
            placeholder="e.g., meta-llama/Meta-Llama-3-8B-Instruct"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="adapter_name_or_path">Adapter Name or Path:</label>
          <input
            id="adapter_name_or_path"
            type="text"
            value={config.adapter_name_or_path}
            onChange={(e) => handleInputChange('adapter_name_or_path', e.target.value)}
            placeholder="e.g., saves/llama3-8b/lora/sft"
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="template">Template:</label>
          <select
            id="template"
            value={config.template}
            onChange={(e) => handleInputChange('template', e.target.value)}
            className="form-control"
          >
            {TEMPLATE_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="finetuning_type">Finetuning Type:</label>
          <select
            id="finetuning_type"
            value={config.finetuning_type}
            onChange={(e) => handleInputChange('finetuning_type', e.target.value)}
            className="form-control"
          >
            {FINETUNING_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="infer_backend">Inference Backend:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="infer_backend"
                value="huggingface"
                checked={config.infer_backend === 'huggingface'}
                onChange={() => handleInputChange('infer_backend', 'huggingface')}
              />
              HuggingFace
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="infer_backend"
                value="vllm"
                checked={config.infer_backend === 'vllm'}
                onChange={() => handleInputChange('infer_backend', 'vllm')}
              />
              vLLM
            </label>
          </div>
        </div>
      </div>

      {/* vLLM specific settings, only shown when vllm backend is selected */}
      {config.infer_backend === 'vllm' && (
        <div className="inference-section">
          <h3>{translations[locale].advancedOptions} (vLLM)</h3>
          
          <div className="form-group">
            <label htmlFor="vllm_maxlen">
              Maximum Sequence Length:
              <span className="input-hint"> (Include input text and generated text)</span>
            </label>
            <input
              id="vllm_maxlen"
              type="number"
              value={config.vllm_settings.vllm_maxlen}
              onChange={(e) => handleVllmSettingChange(
                'vllm_maxlen', 
                parseNumberInput(e.target.value, 1, 32768, 4096)
              )}
              min="1"
              max="32768"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vllm_gpu_util">
              GPU Utilization:
              <span className="input-hint"> (Range: 0-1)</span>
            </label>
            <input
              id="vllm_gpu_util"
              type="number"
              value={config.vllm_settings.vllm_gpu_util}
              onChange={(e) => handleVllmSettingChange(
                'vllm_gpu_util', 
                parseNumberInput(e.target.value, 0.1, 1, 0.9)
              )}
              step="0.1"
              min="0.1"
              max="1"
              className="form-control"
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.vllm_settings.vllm_enforce_eager}
                onChange={(e) => handleVllmSettingChange('vllm_enforce_eager', e.target.checked)}
              />
              Enforce Eager Mode (Disable CUDA graph in vLLM)
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="vllm_max_lora_rank">Maximum LoRA Rank:</label>
            <input
              id="vllm_max_lora_rank"
              type="number"
              value={config.vllm_settings.vllm_max_lora_rank}
              onChange={(e) => handleVllmSettingChange(
                'vllm_max_lora_rank', 
                parseNumberInput(e.target.value, 1, 256, 32)
              )}
              min="1"
              max="256"
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label htmlFor="vllm_config">
              vLLM Configuration:
              <span className="input-hint"> (JSON string or leave empty for default)</span>
            </label>
            <textarea
              id="vllm_config"
              value={config.vllm_settings.vllm_config}
              onChange={(e) => handleVllmSettingChange('vllm_config', e.target.value)}
              placeholder='{"tensor_parallel_size": 1, "gpu_memory_utilization": 0.9}'
              className="form-control textarea"
              rows={4}
            />
          </div>
        </div>
      )}
      
      <div className="action-buttons">
        <button className="primary-button">
          Apply Configuration
        </button>
        <button className="secondary-button">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};

export default InferenceModel;
