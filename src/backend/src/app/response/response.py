from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TrainResponse(BaseModel):
    job_id: str
    status: str

class TrainRequest(BaseModel):
    # Basic parameters (always required)
    model_name: str
    model_path: str
    datasets: List[str]
    train_method: str
    
    # Advanced parameters with Optional[Type] = None
    # This means they only get values when explicitly provided
    trust_remote_code: Optional[bool] = None
    stage: Optional[str] = None
    do_train: Optional[bool] = None
    
    # Fine-tuning configuration
    finetuning_type: Optional[str] = None
    lora_rank: Optional[int] = None
    lora_target: Optional[str] = None
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