from typing import Dict, Any

# Default training configurations organized by LLaMA-Factory stage
DEFAULT_CONFIGS = {
    "sft": {  # Changed from "supervised" to "sft"
        "trust_remote_code": True,
        "stage": "sft",
        "finetuning_type": "lora",
        "lora_rank": 8,
        "lora_target": "all",
        "template": "llama3",
        "cutoff_len": 2048,
        "overwrite_cache": False,
        "preprocessing_num_workers": 4,
        "per_device_train_batch_size": 1,
        "gradient_accumulation_steps": 8,
        "learning_rate": 0.0001,
        "num_train_epochs": 1.0,  # SFT default: 1 epoch
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.1,
        "bf16": True,
        "logging_steps": 10,
        "save_steps": 500,
        "plot_loss": True,
        "overwrite_output_dir": True,
    },
    "rm": {  # Add RM stage defaults
        "trust_remote_code": True,
        "stage": "rm",
        "finetuning_type": "lora",
        "lora_rank": 8,
        "lora_target": "all",
        "template": "llama3",
        "cutoff_len": 2048,
        "overwrite_cache": False,
        "preprocessing_num_workers": 4,
        "per_device_train_batch_size": 1,
        "gradient_accumulation_steps": 8,
        "learning_rate": 0.0001,
        "num_train_epochs": 1.0,  # Changed from 3 to 1 epoch for RM
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.1,
        "bf16": True,
        "logging_steps": 10,
        "save_steps": 500,
        "plot_loss": True,
        "overwrite_output_dir": True,
    },
    "ppo": {
        "trust_remote_code": True,
        "stage": "ppo",
        "do_train": True,
        "finetuning_type": "lora",
        "lora_rank": 8,
        "lora_target": "all",
        "template": "llama3",
        "cutoff_len": 2048,
        "max_samples": 1000,
        "overwrite_cache": True,
        "preprocessing_num_workers": 16,
        "dataloader_num_workers": 4,
        "logging_steps": 10,
        "save_steps": 500,
        "plot_loss": True,
        "overwrite_output_dir": True,
        "report_to": "none",
        "per_device_train_batch_size": 1,
        "gradient_accumulation_steps": 2,
        "learning_rate": 1.0e-5,
        "num_train_epochs": 1.0,
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.1,
        "bf16": True,
        "ddp_timeout": 180000000,
        "max_new_tokens": 512,
        "top_k": 0,
        "top_p": 0.9,
        # Note: reward_model will be set dynamically based on user input or generated automatically
    },
    "dpo": {  # Add DPO stage defaults
        "trust_remote_code": True,
        "stage": "dpo",
        "finetuning_type": "lora",
        "num_train_epochs": 1.0,
        # ...other DPO defaults
    },
    "kto": {  # Add KTO stage defaults
        "trust_remote_code": True,
        "stage": "kto",
        "finetuning_type": "lora",
        "num_train_epochs": 1.0,
        # ...other KTO defaults
    },
    "orpo": {  # Add ORPO stage defaults
        "trust_remote_code": True,
        "stage": "orpo",
        "finetuning_type": "lora",
        "num_train_epochs": 1.0,
        # ...other ORPO defaults
    },
    "pt": {  # Add pretraining stage defaults
        "trust_remote_code": True,
        "stage": "pt",
        "finetuning_type": "lora",
        "num_train_epochs": 1.0,
        # ...other PT defaults
    },
    "default": {
        # Fallback defaults for any training stage
        "trust_remote_code": True,
        "stage": "sft",
        "num_train_epochs": 1.0,  # Default: 1 epoch
        # ...other generic defaults
    }
}

def get_default_config(stage: str) -> Dict[str, Any]:  # Changed parameter name from train_method to stage
    """
    Get default configuration values based on training stage.
    Falls back to generic defaults if the specific stage isn't defined.
    """
    if stage in DEFAULT_CONFIGS:
        return {**DEFAULT_CONFIGS["default"], **DEFAULT_CONFIGS[stage]}
    return DEFAULT_CONFIGS["default"]
