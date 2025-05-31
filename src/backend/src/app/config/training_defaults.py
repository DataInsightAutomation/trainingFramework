from typing import Dict, Any

# Default training configurations organized by training method
DEFAULT_CONFIGS = {
    "supervised": {
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
        "num_train_epochs": 1.0,
        "lr_scheduler_type": "cosine",
        "warmup_ratio": 0.1,
        "bf16": True,
        "logging_steps": 10,
        "save_steps": 500,
        "plot_loss": True,
        "overwrite_output_dir": True
    },
    "rlhf": {
        # RLHF-specific defaults
        "trust_remote_code": True,
        "stage": "ppo",
        # ...other RLHF defaults
    },
    # Add other training methods as needed
    "default": {
        # Fallback defaults for any training method
        "trust_remote_code": True,
        "stage": "sft",
        # ...other generic defaults
    }
}

def get_default_config(train_method: str) -> Dict[str, Any]:
    """
    Get default configuration values based on training method.
    Falls back to generic defaults if the specific method isn't defined.
    """
    if train_method in DEFAULT_CONFIGS:
        return {**DEFAULT_CONFIGS["default"], **DEFAULT_CONFIGS[train_method]}
    return DEFAULT_CONFIGS["default"]
