from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TrainResponse(BaseModel):
    job_id: str
    status: str

class TrainRequest(BaseModel):
    # Basic parameters (always required)
    model_name: str
    model_path: Optional[str] = None  # Make optional since it can be empty
    datasets: List[str]
    stage: str  # New: direct LLaMA-Factory stage
    finetuning_method: Optional[str] = "lora"  # New: UI abstraction for finetuning method
    token: Optional[str] = None
    
    # Legacy field for backward compatibility (optional)
    train_method: Optional[str] = None
    
    # Advanced parameters with Optional[Type] = None
    trust_remote_code: Optional[bool] = None
    do_train: Optional[bool] = None
    
    # Fine-tuning configuration
    finetuning_type: Optional[str] = None  # LLaMA-Factory actual parameter
    quantization_bit: Optional[int] = None  # For QLoRA support
    lora_rank: Optional[int] = None
    lora_target: Optional[str] = None
    lora_alpha: Optional[int] = None  # Added missing parameter
    lora_dropout: Optional[float] = None  # Added missing parameter
    template: Optional[str] = None
    
    # Dataset configuration
    cutoff_len: Optional[int] = None
    max_samples: Optional[int] = None
    overwrite_cache: Optional[bool] = None
    preprocessing_num_workers: Optional[int] = None
    dataloader_num_workers: Optional[int] = None
    
    # Output configuration
    output_dir: Optional[str] = None
    logging_steps: Optional[int] = None
    save_steps: Optional[int] = None
    plot_loss: Optional[bool] = None
    overwrite_output_dir: Optional[bool] = None
    save_only_model: Optional[bool] = None
    report_to: Optional[str] = None
    
    # Training parameters
    per_device_train_batch_size: Optional[int] = None
    gradient_accumulation_steps: Optional[int] = None
    learning_rate: Optional[float] = None
    num_train_epochs: Optional[float] = None
    lr_scheduler_type: Optional[str] = None
    warmup_ratio: Optional[float] = None
    bf16: Optional[bool] = None
    resume_from_checkpoint: Optional[str] = None
    dataset_dir: Optional[str] = None
    
    # Additional parameters can be passed without validation
    additional_params: Optional[Dict[str, Any]] = None

    # Advanced dataset configuration fields
    dataset_auto_config: Optional[bool] = None
    dataset_ranking_override: Optional[str] = None
    custom_column_mapping: Optional[bool] = None
    prompt_column: Optional[str] = None
    query_column: Optional[str] = None
    chosen_column: Optional[str] = None
    rejected_column: Optional[str] = None
    response_column: Optional[str] = None

    class Config:
        # Exclude None values when converting to dict
        exclude_none = True
        # Only accept explicitly defined fields
        extra = "ignore"

class StatusResponse(BaseModel):
    job_id: str
    status: str
    progress: float = 0.0
    message: str = ""

# New response models for model and dataset endpoints
class Model(BaseModel):
    id: str
    name: str
    description: str = ""

class Dataset(BaseModel):
    id: str
    name: str
    description: str = ""
    category: str = ""
    size_mb: float = 0.0

class ModelsResponse(BaseModel):
    models: List[Model]

class DatasetsResponse(BaseModel):
    datasets: List[Dataset]